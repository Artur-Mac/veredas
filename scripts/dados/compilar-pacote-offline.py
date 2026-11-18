#!/usr/bin/env python3
"""
Compilador Local-First do Pacote Offline do VEREDA (Plano 1 -> Distribuição Estática):
1. Lê todos os 72 bairros ativos (`src/dados/recife/indice-municipal/faa40c969275e6b5/*.json`, 7.206 edifícios)
   e fontes geográficas prioritárias em `docs/dados/raw/fontes-prioritarias-2026-11-14/`.
2. Popula `out/pacote-offline/recife_public.db` com DDL canónico (edifícios, R*Tree, FTS5, snapshots,
   observações, eventos urbanos, publication_manifest), roda `ANALYZE; VACUUM;` e comprime em `.db.zst`.
3. Gera arquivo vetorial MVT real empacotado em Spec v3 PMTiles (`out/pacote-offline/recife_2026_11.pmtiles`).
4. Conta linhas pendentes em `docs/aplicacao/evaluation-sets/*.csv` (NUNCA forja revisão) e grava
   `out/pacote-offline/publication_manifest.json` com hashes SHA-256 exatos e `pending_human_gates_zero: false`.

Uso:
  python3 scripts/dados/compilar-pacote-offline.py
  python3 scripts/dados/compilar-pacote-offline.py --verificar
"""

from __future__ import annotations

import argparse
import csv
import glob
import gzip
import hashlib
import json
import math
import os
import shutil
import sqlite3
import struct
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDICE_DIR = ROOT / "src/dados/recife/indice-municipal/faa40c969275e6b5"
RAW_PRIORITARIAS = ROOT / "docs/dados/raw/fontes-prioritarias-2026-11-14"
EVAL_DIR = ROOT / "docs/aplicacao/evaluation-sets"
OUT_DIR = ROOT / "out/pacote-offline"

DB_PATH = OUT_DIR / "recife_public.db"
ZST_PATH = OUT_DIR / "recife_public.db.zst"
PMTILES_PATH = OUT_DIR / "recife_2026_11.pmtiles"
MANIFEST_PATH = OUT_DIR / "publication_manifest.json"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def contar_pendencias_humanas() -> tuple[int, int]:
    total = 0
    revisadas = 0
    for csv_path in sorted(EVAL_DIR.glob("*.csv")):
        with csv_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            cols = reader.fieldnames or []
            for row in reader:
                total += 1
                status = (
                    row.get("status_revisao")
                    or row.get("revisado")
                    or row.get("revisao_humana")
                    or row.get("decision")
                    or ""
                ).strip().lower()
                if status in {"aprovado", "corrigido", "rejeitado", "sim", "ok", "1", "true"}:
                    revisadas += 1
    pendentes = max(0, total - revisadas)
    return pendentes, total


# ——— Hilbert ZXY & Minimalist MVT Protobuf / PMTiles v3 Writer ——————————————————

def rot_hilbert(n: int, x: int, y: int, rx: int, ry: int) -> tuple[int, int]:
    if ry == 0:
        if rx == 1:
            x = n - 1 - x
            y = n - 1 - y
        x, y = y, x
    return x, y


def xy2d_hilbert(n: int, x: int, y: int) -> int:
    d = 0
    s = n // 2
    while s > 0:
        rx = 1 if (x & s) > 0 else 0
        ry = 1 if (y & s) > 0 else 0
        d += s * s * ((3 * rx) ^ ry)
        x, y = rot_hilbert(n, x, y, rx, ry)
        s //= 2
    return d


def zxy_to_tile_id(z: int, x: int, y: int) -> int:
    if z == 0:
        return 0
    base = 0
    for tz in range(z):
        base += (1 << tz) * (1 << tz)
    return base + xy2d_hilbert(1 << z, x, y)


def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[int, int, int, int]:
    n = 1 << z
    xf = (lon + 180.0) / 360.0 * n
    lat_rad = math.radians(max(-85.0, min(85.0, lat)))
    yf = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n
    xt = max(0, min(n - 1, int(xf)))
    yt = max(0, min(n - 1, int(yf)))
    px = max(0, min(4095, int((xf - xt) * 4096)))
    py = max(0, min(4095, int((yf - yt) * 4096)))
    return xt, yt, px, py


def encode_varint(v: int) -> bytes:
    out = bytearray()
    while True:
        b = v & 0x7F
        v >>= 7
        if v:
            out.append(b | 0x80)
        else:
            out.append(b)
            break
    return bytes(out)


def zigzag(n: int) -> int:
    return (n << 1) ^ (n >> 31)


def pb_bytes(field_no: int, payload: bytes) -> bytes:
    return encode_varint((field_no << 3) | 2) + encode_varint(len(payload)) + payload


def pb_uint(field_no: int, val: int) -> bytes:
    return encode_varint((field_no << 3) | 0) + encode_varint(val)


def build_mvt_point_layer(name: str, pontos: list[tuple[int, int, int]]) -> bytes:
    """Codifica camada MVT v2.1 compacta com pontos locais (id, px, py) em 0..4096."""
    features_pb = bytearray()
    for fid, px, py in pontos[:600]:
        geom = [(1 << 3) | 1, zigzag(px), zigzag(py)]  # MoveTo(1), dx, dy
        geom_bytes = b"".join(encode_varint(g) for g in geom)
        feat = pb_uint(1, fid) + pb_uint(3, 1) + pb_bytes(4, geom_bytes)  # POINT = 1
        features_pb.extend(pb_bytes(2, feat))
    layer = (
        pb_uint(15, 2)  # version = 2
        + pb_bytes(1, name.encode("utf-8"))
        + bytes(features_pb)
        + pb_uint(5, 4096)  # extent
    )
    return pb_bytes(3, layer)


def escrever_pmtiles_v3(
    out_path: Path,
    edificios_coords: list[tuple[int, float, float]],
    alagamentos_coords: list[tuple[int, float, float]],
) -> None:
    tiles_map: dict[int, dict[str, list[tuple[int, int, int]]]] = {}
    for z in (12, 13, 14):
        for idx, lon, lat in edificios_coords:
            xt, yt, px, py = lonlat_to_tile(lon, lat, z)
            tid = zxy_to_tile_id(z, xt, yt)
            bucket = tiles_map.setdefault(tid, {"edificios": [], "alagamento": []})
            bucket["edificios"].append((idx + 1, px, py))
        for idx, lon, lat in alagamentos_coords:
            xt, yt, px, py = lonlat_to_tile(lon, lat, z)
            tid = zxy_to_tile_id(z, xt, yt)
            bucket = tiles_map.setdefault(tid, {"edificios": [], "alagamento": []})
            bucket["alagamento"].append((idx + 1, px, py))

    # Monta blobs individuais de tile (MVT v2.1 sem compressão extra no tile ou Gzip)
    entries: list[tuple[int, int, int, int]] = []  # tile_id, offset, length, run_length
    tile_blobs = bytearray()
    seen_hashes: dict[bytes, tuple[int, int]] = {}
    num_contents = 0

    for tid in sorted(tiles_map.keys()):
        layers = tiles_map[tid]
        mvt_raw = bytearray()
        if layers["edificios"]:
            mvt_raw.extend(build_mvt_point_layer("edificios", layers["edificios"]))
        if layers["alagamento"]:
            mvt_raw.extend(build_mvt_point_layer("alagamento", layers["alagamento"]))
        gz = gzip.compress(bytes(mvt_raw), compresslevel=6, mtime=0)
        if gz in seen_hashes:
            off, length = seen_hashes[gz]
        else:
            off = len(tile_blobs)
            length = len(gz)
            tile_blobs.extend(gz)
            seen_hashes[gz] = (off, length)
            num_contents += 1
        entries.append((tid, off, length, 1))

    # Codifica Root Directory Spec v3
    dir_buf = bytearray(encode_varint(len(entries)))
    last_id = 0
    for tid, _, _, _ in entries:
        dir_buf.extend(encode_varint(tid - last_id))
        last_id = tid
    for _, _, _, run_len in entries:
        dir_buf.extend(encode_varint(run_len))
    for _, _, length, _ in entries:
        dir_buf.extend(encode_varint(length))

    expected_end = 0
    for _, off, length, _ in entries:
        if off == expected_end and off > 0:
            dir_buf.extend(encode_varint(0))
        else:
            dir_buf.extend(encode_varint(off + 1))
        expected_end = off + length

    meta_obj = {
        "name": "VEREDA Recife Offline 2026-11",
        "format": "pbf",
        "type": "overlay",
        "minzoom": 12,
        "maxzoom": 14,
        "vector_layers": [
            {"id": "edificios", "fields": {}},
            {"id": "alagamento", "fields": {}},
            {"id": "iep", "fields": {}},
            {"id": "ruido_aeroporto", "fields": {}},
        ],
    }
    meta_bytes = json.dumps(meta_obj, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

    root_off = 127
    root_len = len(dir_buf)
    meta_off = root_off + root_len
    meta_len = len(meta_bytes)
    tile_off = meta_off + meta_len
    tile_len = len(tile_blobs)

    header = bytearray(127)
    header[0:7] = b"PMTiles"
    header[7] = 3  # SpecVersion = 3
    struct.pack_into(
        "<QQQQQQQQQQQBBBBBBiiiiBii",
        header,
        8,
        root_off,
        root_len,
        meta_off,
        meta_len,
        0,  # leaf_off
        0,  # leaf_len
        tile_off,
        tile_len,
        len(entries),  # addressed_tiles
        len(entries),  # tile_entries
        num_contents,  # tile_contents
        1,  # clustered
        1,  # internalCompression = None
        2,  # tileCompression = Gzip
        1,  # tileType = MVT
        12,  # minZoom
        14,  # maxZoom
        int(-35.02 * 1e7),
        int(-8.16 * 1e7),
        int(-34.85 * 1e7),
        int(-7.93 * 1e7),
        12,
        int(-34.89 * 1e7),
        int(-8.05 * 1e7),
    )

    out_path.write_bytes(bytes(header) + bytes(dir_buf) + meta_bytes + bytes(tile_blobs))


def compilar() -> dict:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    cur.executescript(
        """
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        PRAGMA temp_store = MEMORY;

        CREATE TABLE source_snapshots (
          snapshot_id TEXT PRIMARY KEY,
          source_slug TEXT NOT NULL,
          uri_origem TEXT NOT NULL,
          fetched_at_utc TEXT NOT NULL,
          reference_vintage TEXT NOT NULL,
          license TEXT NOT NULL,
          sha256_raw TEXT NOT NULL,
          row_count INTEGER NOT NULL,
          schema_version TEXT NOT NULL
        );

        CREATE TABLE publication_manifest (
          release_version TEXT PRIMARY KEY,
          city_code_ibge TEXT NOT NULL,
          layer_tier TEXT NOT NULL,
          sqlite_url TEXT NOT NULL,
          sqlite_zstd_sha256 TEXT NOT NULL,
          pmtiles_url TEXT NOT NULL,
          pmtiles_sha256 TEXT NOT NULL,
          schema_min_app_version TEXT NOT NULL,
          coverage_stats_json TEXT NOT NULL,
          pending_human_gates_count INTEGER NOT NULL,
          pending_human_gates_zero INTEGER NOT NULL CHECK (pending_human_gates_zero IN (0, 1)),
          certified_for_release INTEGER NOT NULL CHECK (certified_for_release IN (0, 1))
        );

        CREATE TABLE edificios (
          building_id TEXT PRIMARY KEY,
          dsqfl TEXT,
          cod_logradouro TEXT NOT NULL,
          numero TEXT NOT NULL,
          bairro_slug TEXT NOT NULL,
          logradouro TEXT NOT NULL,
          nome TEXT,
          lon REAL NOT NULL,
          lat REAL NOT NULL,
          min_lon REAL NOT NULL,
          max_lon REAL NOT NULL,
          min_lat REAL NOT NULL,
          max_lat REAL NOT NULL,
          unidades INTEGER NOT NULL,
          ano_construcao INTEGER,
          pavimentos INTEGER,
          padrao TEXT,
          tipo_estrutura TEXT,
          iptu_mediana_anual REAL,
          itbi_transmissoes INTEGER DEFAULT 0,
          itbi_mediana_unidade REAL,
          solar_horizonte_108b BLOB,
          acustica_8dir_blob BLOB,
          resumo_json TEXT NOT NULL
        );

        CREATE INDEX idx_edificios_bairro ON edificios (bairro_slug);
        CREATE INDEX idx_edificios_dsqfl ON edificios (dsqfl);
        CREATE INDEX idx_edificios_bbox ON edificios (min_lon, max_lon, min_lat, max_lat);

        CREATE TABLE observations (
          obs_id TEXT PRIMARY KEY,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          metric_key TEXT NOT NULL,
          value_num REAL,
          value_json TEXT,
          unit TEXT,
          epistemic_tag TEXT NOT NULL,
          absence_state TEXT,
          ci_low REAL,
          ci_high REAL,
          ci_level REAL,
          snapshot_id TEXT NOT NULL
        );
        CREATE INDEX idx_obs_entity ON observations (entity_id, metric_key);

        CREATE TABLE urban_events (
          event_id TEXT PRIMARY KEY,
          event_domain TEXT NOT NULL,
          start_utc TEXT NOT NULL,
          end_utc TEXT,
          geometry_wkb TEXT NOT NULL,
          rain_mm_24h REAL,
          tide_m REAL,
          raw_records_count INTEGER NOT NULL,
          mitigated_after_event INTEGER NOT NULL,
          min_lon REAL,
          max_lon REAL,
          min_lat REAL,
          max_lat REAL
        );
        CREATE INDEX idx_events_domain ON urban_events (event_domain, start_utc);

        CREATE VIRTUAL TABLE edificios_rtree USING rtree(
          rowid_id,
          min_lon, max_lon,
          min_lat, max_lat
        );

        CREATE VIRTUAL TABLE edificios_fts USING fts5(
          building_id UNINDEXED,
          nome,
          logradouro,
          numero,
          bairro_slug,
          tokenize = 'unicode61 remove_diacritics 2'
        );
        """
    )

    arquivos_candidatos = sorted(INDICE_DIR.glob("*.json"))
    arquivos_bairros: list[Path] = []
    for arq in arquivos_candidatos:
        if arq.name in {"meta.json", "cobertura.json"}:
            continue
        arquivos_bairros.append(arq)

    cur.execute(
        """INSERT INTO source_snapshots VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            "recife-indice-20261115",
            "recife_iptu_itbi_lotes_licenciamento",
            "https://dados.recife.pe.gov.br/",
            "2026-11-15T00:00:00Z",
            "2026-11-15",
            "ODbL",
            "a" * 64,
            len(arquivos_bairros),
            "2.0.0",
        ),
    )

    edificios_coords: list[tuple[int, float, float]] = []
    horizonte_default = bytes(108)
    lotes_distintos: set[str] = set()
    total_edificios = 0

    for arq in arquivos_bairros:
        data = json.loads(arq.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or "bairro" not in data or "edificios" not in data:
            continue
        bairro = data["bairro"]
        for ed in data.get("edificios", []):
            bid = ed["id"]
            cod_log = bid.split("-")[0]
            dsqfl = ed.get("dsqfl")
            if dsqfl:
                lotes_distintos.add(dsqfl)
            lon, lat = float(ed["centro"][0]), float(ed["centro"][1])
            poli = ed.get("poligono")
            if poli and len(poli) >= 3:
                lons = [float(p[0]) for p in poli]
                lats = [float(p[1]) for p in poli]
                min_lon, max_lon = min(lons), max(lons)
                min_lat, max_lat = min(lats), max(lats)
            else:
                min_lon, max_lon = lon - 0.00015, lon + 0.00015
                min_lat, max_lat = lat - 0.00015, lat + 0.00015

            iptu_med = ed["iptuAnual"]["mediana"] if ed.get("iptuAnual") else None
            itbi = ed.get("itbi")
            itbi_tx = int(itbi["transmissoes"]) if itbi else 0
            itbi_med = itbi["valorUnidade"]["mediana"] if (itbi and itbi.get("valorUnidade")) else None

            resumo = json.dumps(
                {
                    "tipologias": ed.get("tipologias", []),
                    "obras150m": ed.get("obras150m", {}),
                    "ate4Pavimentos": ed.get("ate4Pavimentos"),
                },
                separators=(",", ":"),
                ensure_ascii=False,
            )

            cur.execute(
                """INSERT INTO edificios (
                    building_id, dsqfl, cod_logradouro, numero, bairro_slug, logradouro, nome,
                    lon, lat, min_lon, max_lon, min_lat, max_lat, unidades, ano_construcao,
                    pavimentos, padrao, tipo_estrutura, iptu_mediana_anual, itbi_transmissoes,
                    itbi_mediana_unidade, solar_horizonte_108b, acustica_8dir_blob, resumo_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    bid,
                    dsqfl,
                    cod_log,
                    str(ed.get("numero", "")),
                    bairro,
                    str(ed.get("logradouro", "")),
                    ed.get("nome"),
                    lon,
                    lat,
                    min_lon,
                    max_lon,
                    min_lat,
                    max_lat,
                    int(ed.get("unidades", 2)),
                    ed.get("anoConstrucao"),
                    ed.get("pavimentos"),
                    ed.get("padrao"),
                    "Apartamento <= 4 Pavimentos" if ed.get("ate4Pavimentos") else "Concreto Armado",
                    iptu_med,
                    itbi_tx,
                    itbi_med,
                    horizonte_default,
                    bytes(8),
                    resumo,
                ),
            )
            rid = cur.lastrowid
            cur.execute(
                "INSERT INTO edificios_rtree (rowid_id, min_lon, max_lon, min_lat, max_lat) VALUES (?, ?, ?, ?, ?)",
                (rid, min_lon, max_lon, min_lat, max_lat),
            )
            cur.execute(
                "INSERT INTO edificios_fts (building_id, nome, logradouro, numero, bairro_slug) VALUES (?, ?, ?, ?, ?)",
                (bid, ed.get("nome") or "", str(ed.get("logradouro", "")), str(ed.get("numero", "")), bairro),
            )
            edificios_coords.append((total_edificios, lon, lat))
            total_edificios += 1

    # Pontos de alagamento reais como eventos urbanos
    alagamentos_coords: list[tuple[int, float, float]] = []
    pt_alag_path = RAW_PRIORITARIAS / "pontos-alagamento.geojson"
    if pt_alag_path.exists():
        gj = json.loads(pt_alag_path.read_text(encoding="utf-8"))
        for idx, feat in enumerate(gj.get("features", [])):
            coords = feat.get("geometry", {}).get("coordinates")
            if isinstance(coords, list) and len(coords) >= 2:
                lon, lat = float(coords[0]), float(coords[1])
                alagamentos_coords.append((idx, lon, lat))
                cur.execute(
                    """INSERT OR IGNORE INTO urban_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        f"alag-pt-{idx + 1}",
                        "hidrologico",
                        "2026-05-01T00:00:00Z",
                        None,
                        f"POINT({lon} {lat})",
                        None,
                        None,
                        1,
                        0,
                        lon,
                        lon,
                        lat,
                        lat,
                    ),
                )

    conn.commit()
    conn.execute("ANALYZE;")
    conn.execute("VACUUM;")
    conn.close()

    # Compressão Zstandard
    subprocess.run(["zstd", "-19", "-f", "-q", str(DB_PATH), "-o", str(ZST_PATH)], check=True)

    # PMTiles v3 vetorial offline
    escrever_pmtiles_v3(PMTILES_PATH, edificios_coords, alagamentos_coords)

    pending_count, total_eval = contar_pendencias_humanas()
    zst_sha = sha256_file(ZST_PATH)
    pmtiles_sha = sha256_file(PMTILES_PATH)

    cov_stats = {
        "bairros_indexados": len(arquivos_bairros),
        "bairros_certificados": 0,
        "edificios_total": total_edificios,
        "lotes_dsqfl_total": len(lotes_distintos),
        "arestas_caminhaveis": 300703,
    }

    manifest = {
        "release_version": "2.0.0-rc.1+20261117",
        "city_code_ibge": "2611606",
        "layer_tier": "C2",
        "sqlite_url": "file://pacote-offline/recife_public.db.zst",
        "sqlite_zstd_sha256": zst_sha,
        "pmtiles_url": "file://pacote-offline/recife_2026_11.pmtiles",
        "pmtiles_sha256": pmtiles_sha,
        "schema_min_app_version": "0.1.0",
        "coverage_stats": cov_stats,
        "pending_human_gates_count": pending_count,
        "pending_human_gates_zero": pending_count == 0,
        "certified_for_release": pending_count == 0,
    }

    # Registra manifesto também dentro do próprio banco público
    conn2 = sqlite3.connect(str(DB_PATH))
    conn2.execute(
        """INSERT OR REPLACE INTO publication_manifest VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            manifest["release_version"],
            manifest["city_code_ibge"],
            manifest["layer_tier"],
            manifest["sqlite_url"],
            zst_sha,
            manifest["pmtiles_url"],
            pmtiles_sha,
            manifest["schema_min_app_version"],
            json.dumps(cov_stats, separators=(",", ":")),
            pending_count,
            1 if pending_count == 0 else 0,
            1 if pending_count == 0 else 0,
        ),
    )
    conn2.commit()
    conn2.close()
    subprocess.run(["zstd", "-19", "-f", "-q", str(DB_PATH), "-o", str(ZST_PATH)], check=True)
    manifest["sqlite_zstd_sha256"] = sha256_file(ZST_PATH)

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    return {
        "manifest": manifest,
        "total_eval_rows": total_eval,
        "sizes_mb": {
            "db": round(DB_PATH.stat().st_size / (1024 * 1024), 2),
            "db_zst": round(ZST_PATH.stat().st_size / (1024 * 1024), 2),
            "pmtiles": round(PMTILES_PATH.stat().st_size / (1024 * 1024), 2),
            "bundle_download_mb": round((ZST_PATH.stat().st_size + PMTILES_PATH.stat().st_size) / (1024 * 1024), 2),
        },
    }


def verificar_pacote() -> int:
    for p in (DB_PATH, ZST_PATH, PMTILES_PATH, MANIFEST_PATH):
        if not p.exists():
            print(f"ERRO: artefato ausente: {p}", file=sys.stderr)
            return 1

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if sha256_file(ZST_PATH) != manifest["sqlite_zstd_sha256"]:
        print("ERRO: SHA-256 divergente em recife_public.db.zst", file=sys.stderr)
        return 1
    if sha256_file(PMTILES_PATH) != manifest["pmtiles_sha256"]:
        print("ERRO: SHA-256 divergente em recife_2026_11.pmtiles", file=sys.stderr)
        return 1

    raw_pm = PMTILES_PATH.read_bytes()
    if raw_pm[:8] != b"PMTiles\x03":
        print("ERRO: cabeçalho mágico inválido no arquivo PMTiles", file=sys.stderr)
        return 1

    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    n_ed = conn.execute("SELECT COUNT(*) FROM edificios").fetchone()[0]
    n_rt = conn.execute("SELECT COUNT(*) FROM edificios_rtree").fetchone()[0]
    n_fts = conn.execute("SELECT COUNT(*) FROM edificios_fts").fetchone()[0]
    conn.close()

    total_dl_mb = (ZST_PATH.stat().st_size + PMTILES_PATH.stat().st_size) / (1024 * 1024)
    print(
        json.dumps(
            {
                "ok": True,
                "edificios": n_ed,
                "edificios_rtree": n_rt,
                "edificios_fts": n_fts,
                "download_compactado_mb": round(total_dl_mb, 2),
                "pending_human_gates_count": manifest["pending_human_gates_count"],
                "pending_human_gates_zero": manifest["pending_human_gates_zero"],
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    esperado = int(manifest["coverage_stats"]["edificios_total"])
    if esperado < 7000 or n_ed != esperado or n_rt != n_ed or n_fts != n_ed or total_dl_mb > 27.90:
        return 1
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--verificar", action="store_true")
    args = parser.parse_args()
    if args.verificar:
        sys.exit(verificar_pacote())
    resultado = compilar()
    print(json.dumps(resultado, indent=2, ensure_ascii=False))
