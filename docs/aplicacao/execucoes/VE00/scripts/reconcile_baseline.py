#!/usr/bin/env python3
"""VE00.02 — reproducible reconciliation of the published baseline.

Run from the repository root:

    python3 -I docs/aplicacao/execucoes/VE00/scripts/reconcile_baseline.py > docs/aplicacao/execucoes/VE00/coverage.json

Stdlib only. Reads the *published* app data under src/dados, the cached official inputs under
.cache/dados-recife, and the exploratory files under docs/dados. Writes nothing except stdout.
Every count states its denominator. Nothing here changes product data.
"""
import glob
import hashlib
import json
import math
import os
import re
import sys
import zipfile
from collections import Counter, defaultdict

ROOT = os.getcwd()
PILOT = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"]
PILOT_NAMES = {"boa-viagem": "Boa Viagem", "casa-forte": "Casa Forte", "gracas": "Graças",
               "espinheiro": "Espinheiro", "madalena": "Madalena"}


def p(*parts):
    return os.path.join(ROOT, *parts)


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def meters(lon1, lat1, lon2, lat2):
    """Local equirectangular distance; adequate (<0.1% error) at Recife's scale for distances < 2 km."""
    kx = 111319.49 * math.cos(math.radians((lat1 + lat2) / 2))
    return math.hypot((lon2 - lon1) * kx, (lat2 - lat1) * 110574.0)


def point_segment_m(px, py, ax, ay, bx, by):
    kx = 111319.49 * math.cos(math.radians(py))
    ky = 110574.0
    ax_, ay_, bx_, by_ = (ax - px) * kx, (ay - py) * ky, (bx - px) * kx, (by - py) * ky
    dx, dy = bx_ - ax_, by_ - ay_
    L = dx * dx + dy * dy
    t = 0.0 if L == 0 else max(0.0, min(1.0, -(ax_ * dx + ay_ * dy) / L))
    return math.hypot(ax_ + t * dx, ay_ + t * dy)


def median(xs):
    s = sorted(xs)
    n = len(s)
    if not n:
        return None
    return s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2


# ——— Published index ——————————————————————————————————————————————————————————————
pub_ts = open(p("src/dados/recife/publicacaoGerada.ts"), encoding="utf-8").read()
active_dir = re.search(r'DIRETORIO_DO_INDICE = "([^"]+)"', pub_ts).group(1)
enabled = json.loads(re.search(r"BAIRROS_HABILITADOS = (\[[^\]]*\])", pub_ts).group(1))
idx_dir = p("src/dados/recife", active_dir)
partitions = sorted(f[:-5] for f in os.listdir(idx_dir) if f.endswith(".json") and f not in ("meta.json", "cobertura.json"))
coverage_manifest = json.load(open(os.path.join(idx_dir, "cobertura.json"), encoding="utf-8"))
meta = json.load(open(os.path.join(idx_dir, "meta.json"), encoding="utf-8"))

total_buildings = 0
by_area = {}
all_files_hash = hashlib.sha256()
for slug in partitions:
    path = os.path.join(idx_dir, slug + ".json")
    all_files_hash.update(open(path, "rb").read())
    d = json.load(open(path, encoding="utf-8"))
    by_area[slug] = d
    total_buildings += len(d["edificios"])

manifest_rows = {b["bairro"]: b for b in coverage_manifest["bairros"]}
checksum_mismatch = []
count_mismatch = []
for slug in partitions:
    row = manifest_rows.get(slug)
    if row is None:
        checksum_mismatch.append((slug, "absent from cobertura.json"))
        continue
    if row.get("sha256") and row["sha256"] != sha256(os.path.join(idx_dir, slug + ".json")):
        checksum_mismatch.append((slug, "sha256 differs"))
    if row.get("edificios") != len(by_area[slug]["edificios"]):
        count_mismatch.append((slug, row.get("edificios"), len(by_area[slug]["edificios"])))

index_summary = {
    "coverage_manifest_states": dict(Counter(b.get("estado") for b in coverage_manifest["bairros"])),
    "coverage_manifest_partitions": len(coverage_manifest["bairros"]),
    "partition_checksum_mismatches": checksum_mismatch,
    "partition_building_count_mismatches": count_mismatch,
    "active_directory": active_dir,
    "generated_at": meta.get("geradoEm"),
    "partitions_on_disk": len(partitions),
    "enabled_neighbourhoods": len(enabled),
    "enabled_without_partition": sorted(set(enabled) - set(partitions)),
    "partitions_not_enabled": sorted(set(partitions) - set(enabled)),
    "buildings_total": total_buildings,
    "buildings_pilot": sum(len(by_area[s]["edificios"]) for s in PILOT),
    "sha256_of_concatenated_partitions": all_files_hash.hexdigest(),
    "sources": [{"key": f["chave"], "modified": f.get("modificadoEm"), "retrieved": f.get("consultadoEm"),
                 "records_read": f.get("registrosLidos")} for f in meta["fontes"]],
    "street_sources": [{"key": f["chave"], "modified": f.get("modificadoEm"), "period": f.get("periodo"),
                        "records_read": f.get("registrosLidos")} for f in meta["fontesDaRua"]],
}

# ——— Official street network join ————————————————————————————————————————————————
net_path = p(".cache/dados-recife/trechos-de-logradouros.geojson")
streets = defaultdict(list)  # code -> list of line coordinate lists
net_info = {"path": ".cache/dados-recife/trechos-de-logradouros.geojson", "available": os.path.exists(net_path)}
if net_info["available"]:
    net = json.load(open(net_path, encoding="utf-8"))
    net_info.update({"sha256": sha256(net_path), "bytes": os.path.getsize(net_path),
                     "features": len(net["features"]), "crs": net.get("crs", {}).get("properties", {}).get("name")})
    for f in net["features"]:
        code = f["properties"].get("CLOGRACODI")
        g = f["geometry"]
        if code is None or g is None:
            continue
        lines = g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]
        streets[int(code)].extend(lines)
    net_info["distinct_street_codes"] = len(streets)

# CNEFE published layer (education 4, health 5, religious 8)
cnefe = json.load(open(p("src/dados/recife/servicos-cnefe.json"), encoding="utf-8"))
cnefe_pts = cnefe["pontos"]
grid = defaultdict(list)
CELL = 0.004  # ~440 m
for lon, lat, esp, _lvl in cnefe_pts:
    grid[(int(lon // CELL), int(lat // CELL))].append((lon, lat, esp))


def cnefe_within(lon, lat, radius):
    gx, gy = int(lon // CELL), int(lat // CELL)
    found = Counter()
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for qlon, qlat, esp in grid.get((gx + dx, gy + dy), []):
                if meters(lon, lat, qlon, qlat) <= radius:
                    found[esp] += 1
    return found


LIMIT_SINGLE_TYPOLOGY = 0.03  # src/dados/dossie/derivar.ts LIMITE_TIPOLOGIA_UNICA


def single_typology(e):
    t = e["tipologias"]
    if not t:
        return False
    m = median([x["area"] for x in t])
    return all(abs(x["area"] - m) <= m * LIMIT_SINGLE_TYPOLOGY + 1e-9 for x in t)


solar_parts = sorted(os.path.basename(f)[:-5] for f in glob.glob(p("src/dados/sol/recortes/*.json")))

pilot = {}
for slug in PILOT:
    d = by_area[slug]
    eds = d["edificios"]
    logr = d["rua"]["logradouros"]
    codes = [int(e["id"].split("-")[0]) for e in eds]
    in_net = sum(1 for c in codes if c in streets)
    dists = []
    far = []
    for e, c in zip(eds, codes):
        if c not in streets:
            continue
        lon, lat = e["centro"]
        best = min(point_segment_m(lon, lat, *line[i], *line[i + 1])
                   for line in streets[c] for i in range(len(line) - 1))
        dists.append(best)
        if best > 50:
            far.append((round(best, 1), e["id"]))
    flood_streets = sorted(k for k, v in logr.items()
                           if v.get("defesaCivil") and any(cat == "alagamento" for cat, _ in v["defesaCivil"]["ocorrencias"]))
    rua = [e["rua"] for e in eds]  # [setor, drenagem, diasDrenagem, lampada, diasLampada, entulho, diasEntulho, comVitima, atropelamentos]
    cn = [cnefe_within(*e["centro"], 300) for e in eds]
    pilot[slug] = {
        "name": PILOT_NAMES[slug],
        "buildings": len(eds),
        "buildings_with_dsqfl": sum(1 for e in eds if e.get("dsqfl")),
        "distinct_street_codes": len(set(codes)),
        "street_code_in_official_network": in_net,
        "centroid_within_50m_of_own_street": sum(1 for x in dists if x <= 50),
        "median_centroid_to_own_street_m": round(median(dists), 1) if dists else None,
        "farthest_5": sorted(far, reverse=True)[:5],
        "streets_with_flood_category_2014_2024": len(flood_streets),
        "buildings_on_flood_category_street": sum(1 for c in codes if str(c) in flood_streets),
        "buildings_with_drainage_156_within_150m": sum(1 for r in rua if (r[1] or 0) > 0),
        "buildings_drainage_unknown": sum(1 for r in rua if r[1] is None),
        "buildings_with_injury_collision_within_150m": sum(1 for r in rua if (r[7] or 0) > 0),
        "buildings_with_pedestrian_collision_within_150m": sum(1 for r in rua if (r[8] or 0) > 0),
        "buildings_with_itbi_unit_quartiles": sum(1 for e in eds if e.get("itbi") and e["itbi"].get("valorUnidade")),
        "buildings_itbi_and_single_typology": sum(1 for e in eds if e.get("itbi") and e["itbi"].get("valorUnidade") and single_typology(e)),
        "buildings_with_cnefe_point_within_300m": sum(1 for c in cn if sum(c.values()) > 0),
        "buildings_with_cnefe_health_within_300m": sum(1 for c in cn if c[5] > 0),
        "permits_in_partition": len(d["obras"]),
        "luse_current_in_partition": sum(1 for l in d["rua"]["luse"] if l["vigente"]),
        "solar_partition_published": slug in solar_parts,
    }

tot = lambda k: sum(v[k] for v in pilot.values())
pilot_totals = {k: tot(k) for k in pilot["boa-viagem"] if isinstance(pilot["boa-viagem"][k], (int, float)) and not isinstance(pilot["boa-viagem"][k], bool)}
pilot_totals.pop("median_centroid_to_own_street_m", None)

# ——— Defesa Civil flood rows 2020–2024 in the pilot (raw cache, column semantics detected per row) ————
DATE_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")
pilot_norm = {"BOA VIAGEM": "boa-viagem", "CASA FORTE": "casa-forte", "GRACAS": "gracas", "GRAÇAS": "gracas",
              "ESPINHEIRO": "espinheiro", "MADALENA": "madalena"}
dc = {"years": {}, "pilot_flood_rows": 0, "pilot_flood_rows_by_area": Counter(), "dates": Counter(), "schema_by_year": {}}
for year in range(2014, 2025):
    path = p(f".cache/dados-recife/defesa-civil-{year}.json")
    if not os.path.exists(path):
        dc["years"][year] = "missing"
        continue
    d = json.load(open(path, encoding="utf-8"))
    if "registros" not in d:
        # 2014–2019 caches hold rows already normalized by scripts/dados/rua (no date field, category slug only).
        at = d.get("atendimentos", [])
        n = sum(1 for r in at if r and r.get("ocorrencia") == "alagamento" and str(r.get("bairro", "")).strip().upper() in pilot_norm)
        dc["schema_by_year"][year] = {"format": "normalized_atendimentos", "fields": sorted(next((r for r in at if r), {}).keys()), "null_rows": sum(1 for r in at if not r), "has_event_date": False}
        dc["years"][year] = {"rows": len(at), "pilot_flood_rows": n}
        continue
    rows = d["registros"]
    fields = d["consulta"].get("fields")
    # Which declared field actually holds the ISO date in this year's payload?
    date_field = Counter()
    for r in rows[:500]:
        for k, v in r.items():
            if isinstance(v, str) and DATE_RE.match(v):
                date_field[k] += 1
    holder = date_field.most_common(1)[0][0] if date_field else None
    dc["schema_by_year"][year] = {"format": "raw_ckan_rows", "declared_fields": fields, "field_holding_iso_date": holder,
                                  "columns_shifted": holder is not None and holder != "Data"}
    n = 0
    for r in rows:
        vals = [str(v) for v in r.values() if v is not None]
        if not any("alaga" in v.lower() for v in vals):
            continue
        bairro = str(r.get("Bairro", "")).strip().upper()
        slug = pilot_norm.get(bairro)
        if not slug:
            continue
        dates = [DATE_RE.match(v).group(0) for v in vals if DATE_RE.match(v)]
        n += 1
        if 2020 <= year <= 2024:
            dc["pilot_flood_rows"] += 1
            dc["pilot_flood_rows_by_area"][slug] += 1
            dc["dates"][dates[0] if dates else "no-date"] += 1
    dc["years"][year] = {"rows": len(rows), "pilot_flood_rows": n}
dc["pilot_flood_rows_by_area"] = dict(dc["pilot_flood_rows_by_area"])
dc["distinct_dates_2020_2024"] = len(dc["dates"])
dc["max_rows_on_one_date"] = dc["dates"].most_common(1)[0] if dc["dates"] else None
dc["dates"] = dict(dc["dates"].most_common())

# ——— GTFS feeds ——————————————————————————————————————————————————————————————————
bairros = json.load(open(p(".cache/dados-recife/bairros-do-recife.geojson"), encoding="utf-8"))
polys = []
for f in bairros["features"]:
    g = f["geometry"]
    for poly in (g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]):
        polys.append(poly[0])
bbox = [min(x for pl in polys for x, _ in pl), min(y for pl in polys for _, y in pl),
        max(x for pl in polys for x, _ in pl), max(y for pl in polys for _, y in pl)]


def in_ring(x, y, ring):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def in_recife(x, y):
    if not (bbox[0] <= x <= bbox[2] and bbox[1] <= y <= bbox[3]):
        return False
    return any(in_ring(x, y, r) for r in polys)


def read_csv(z, name):
    import csv, io
    return list(csv.DictReader(io.TextIOWrapper(z.open(name), encoding="utf-8-sig")))


gtfs = {}
for label, rel in [("raw_exploratory", "docs/dados/raw/transporte/gtfs.zip"),
                   ("published_layer_cache", ".cache/dados-recife/gtfs-inspecao.zip")]:
    path = p(rel)
    if not os.path.exists(path):
        gtfs[label] = {"path": rel, "available": False}
        continue
    z = zipfile.ZipFile(path)
    fi = read_csv(z, "feed_info.txt")[0]
    stops = read_csv(z, "stops.txt")
    cal = read_csv(z, "calendar.txt")
    cd = read_csv(z, "calendar_dates.txt")
    inside = sum(1 for s in stops if in_recife(float(s["stop_lon"]), float(s["stop_lat"])))
    shifted = sum(1 for s in stops if in_recife(float(s["stop_lon"]), float(s["stop_lat"]) - 0.75))
    gtfs[label] = {
        "path": rel, "sha256": sha256(path), "bytes": os.path.getsize(path),
        "feed_version": fi.get("feed_version"), "feed_start": fi.get("feed_start_date"), "feed_end": fi.get("feed_end_date"),
        "stops": len(stops), "stops_in_recife_original_coordinates": inside,
        "stops_in_recife_after_minus_075_lat_shift": shifted,
        "trips": sum(1 for _ in z.open("trips.txt")) - 1,
        "routes": sum(1 for _ in z.open("routes.txt")) - 1,
        "calendar_services": len(cal), "calendar_date_exceptions": len(cd),
        "calendar_service_days": dict(Counter(
            "weekday" if r["monday"] == "1" and r["saturday"] == "0" else
            "saturday" if r["saturday"] == "1" and r["monday"] == "0" and r["sunday"] == "0" else
            "sunday" if r["sunday"] == "1" and r["monday"] == "0" and r["saturday"] == "0" else "other"
            for r in cal)),
    }
amb = json.load(open(p("src/dados/recife/camadas-ambientais.json"), encoding="utf-8"))
gtfs["published_noise_corridor_layer"] = {
    "source_label": amb["ruidoCorredores"].get("fonte"),
    "declared_feed_version": amb["ruidoCorredores"].get("versaoGtfs") or amb["ruidoCorredores"].get("versao"),
    "retrieved": amb.get("consultadoEm"),
    "keys": sorted(amb["ruidoCorredores"].keys()),
}

# ——— Exploratory acquisition evidence ———————————————————————————————————————————
expl = {}
gm = {}
for f in glob.glob(p("docs/dados/raw/google-maps/*.json")):
    d = json.load(open(f, encoding="utf-8"))  # {category: search record or list of records}
    recs = [r for v in d.values() for r in (v if isinstance(v, list) else [v]) if isinstance(r, dict)]
    gm[os.path.basename(f)] = {"searches": len(recs), "http_statuses": sorted({str(r.get("http")) for r in recs}),
                               "extracted_entities": sum(int(r.get("entidades") or 0) for r in recs)}
expl["google_maps"] = gm
osm_src = open(p("docs/dados/infra/scripts/10-osm-pois.mjs"), encoding="utf-8").read()
boxes = re.findall(r'"([^"]+)": \{ sw: \[(-?[\d.]+), (-?[\d.]+)\], ne: \[(-?[\d.]+), (-?[\d.]+)\] \}', osm_src)
expl["osm_collector_10_boxes"] = [{"area": a, "south_lat": float(s), "north_lat": float(n),
                                   "overlaps_recife_bbox": float(n) >= bbox[1] and float(s) <= bbox[3]} for a, s, w, n, e in boxes]
am_src = open(p("docs/dados/infra/scripts/12-amenidades.mjs"), encoding="utf-8").read()
expl["amenities_collector_12"] = {
    "todosPois_declared_lines": [i + 1 for i, l in enumerate(am_src.splitlines()) if "const todosPois" in l],
    "todosPois_used_lines": [i + 1 for i, l in enumerate(am_src.splitlines()) if "todosPois" in l and "const todosPois" not in l],
    "selector_template": next((l.strip() for l in am_src.splitlines() if "const matchers" in l), None),
}
zap = json.load(open(p("docs/dados/raw/precos/zap-bairros-recife.json"), encoding="utf-8"))
pilot_names = set(PILOT_NAMES.values())
expl["zap_sample"] = {
    "note": "Only per-neighbourhood summaries are stored (no per-card rows, no listing IDs): uniqueness cannot be verified.",
    "per_card_rows_stored": 0,
    "sample_cards_all_neighbourhoods": sum(v.get("amostra", 0) for v in zap["resumo"].values()),
    "sample_cards_pilot": sum(v.get("amostra", 0) for k, v in zap["resumo"].items() if k in pilot_names),
    "neighbourhoods": {k: v.get("amostra") for k, v in zap["resumo"].items()},
    "retrieved": zap.get("consultado_em"),
}

out = {
    "generated_by": "docs/aplicacao/execucoes/VE00/scripts/reconcile_baseline.py",
    "index": index_summary,
    "official_street_network": net_info,
    "cnefe_layer": {"points": len(cnefe_pts), "by_species": dict(Counter(str(x[2]) for x in cnefe_pts)),
                    "sha256_input_declared": cnefe.get("sha256Entrada"), "reference": cnefe.get("referencia")},
    "solar_partitions_published": solar_parts,
    "pilot": pilot,
    "pilot_totals": pilot_totals,
    "defesa_civil_flood_rows": dc,
    "gtfs": gtfs,
    "exploratory_acquisition": expl,
}
json.dump(out, sys.stdout, ensure_ascii=False, indent=1, default=lambda o: dict(o) if isinstance(o, Counter) else str(o))
print()
