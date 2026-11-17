#!/usr/bin/env python3
"""VE00.03 — deterministic selection of G-BUILDING and G-COMPARE.

Run from the repository root:

    python3 -I docs/aplicacao/execucoes/VE00/scripts/select_eval_sets.py

Writes docs/aplicacao/evaluation-sets/g-building.json and g-compare.json. Re-running on the same published
index and street network reproduces the same selection (SHA-256 ordering, no RNG state).

G-BUILDING: ten real published buildings per pilot area, stratified:
  far_centroid (2)  — largest centroid distance to the building's own official street geometry
  multi_front (2)   — centroid within 40 m of at least two distinct official street codes (corner/multi-front candidates)
  sparse (2)        — no ITBI unit quartiles and at most 4 units (thin public record)
  ordinary (4)      — hash-ordered remainder
Split: whole official street codes are assigned to dev or test by hash, so a street never appears in both splits.

G-COMPARE: twenty pairs of real buildings (ten rent, ten purchase) covering all five areas. The listing values are
SYNTHETIC test inputs designed to exercise specific comparison cases; they are not observed offers and must never be
written into a person's saved notebook. Expected outcomes stay `unlabeled` until VE01 defines the projection.
"""
import hashlib
import json
import math
import os
import re
from collections import defaultdict

ROOT = os.getcwd()
PILOT = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"]
NAMES = {"boa-viagem": "Boa Viagem", "casa-forte": "Casa Forte", "gracas": "Graças", "espinheiro": "Espinheiro", "madalena": "Madalena"}
SALT = "VE00-2026-11-14"


def h(*parts):
    return hashlib.sha256(("|".join(map(str, (SALT,) + parts))).encode()).hexdigest()


def seg_m(px, py, ax, ay, bx, by):
    kx = 111319.49 * math.cos(math.radians(py)); ky = 110574.0
    ax_, ay_, bx_, by_ = (ax - px) * kx, (ay - py) * ky, (bx - px) * kx, (by - py) * ky
    dx, dy = bx_ - ax_, by_ - ay_
    L = dx * dx + dy * dy
    t = 0.0 if L == 0 else max(0.0, min(1.0, -(ax_ * dx + ay_ * dy) / L))
    return math.hypot(ax_ + t * dx, ay_ + t * dy)


pub = open(os.path.join(ROOT, "src/dados/recife/publicacaoGerada.ts"), encoding="utf-8").read()
active = re.search(r'DIRETORIO_DO_INDICE = "([^"]+)"', pub).group(1)
net = json.load(open(os.path.join(ROOT, ".cache/dados-recife/trechos-de-logradouros.geojson"), encoding="utf-8"))
segments = []  # (code, ax, ay, bx, by)
for f in net["features"]:
    g = f["geometry"]; code = f["properties"].get("CLOGRACODI")
    if g is None or code is None:
        continue
    for line in (g["coordinates"] if g["type"] == "MultiLineString" else [g["coordinates"]]):
        for i in range(len(line) - 1):
            segments.append((int(code), line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]))
CELL = 0.002
grid = defaultdict(list)
for s in segments:
    for gx in range(int(min(s[1], s[3]) // CELL), int(max(s[1], s[3]) // CELL) + 1):
        for gy in range(int(min(s[2], s[4]) // CELL), int(max(s[2], s[4]) // CELL) + 1):
            grid[(gx, gy)].append(s)


def street_distances(lon, lat):
    best = {}
    gx, gy = int(lon // CELL), int(lat // CELL)
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for code, ax, ay, bx, by in grid.get((gx + dx, gy + dy), []):
                d = seg_m(lon, lat, ax, ay, bx, by)
                if d < best.get(code, 1e9):
                    best[code] = d
    return best


buildings = []
for slug in PILOT:
    d = json.load(open(os.path.join(ROOT, "src/dados/recife", active, slug + ".json"), encoding="utf-8"))
    for e in d["edificios"]:
        code = int(e["id"].split("-")[0])
        dist = street_distances(*e["centro"])
        own = dist.get(code)
        near_codes = sorted(c for c, x in dist.items() if x <= 40)
        buildings.append({
            "area": slug, "id": e["id"], "street_code": code, "logradouro": e["logradouro"], "numero": e["numero"],
            "nome": e.get("nome"), "dsqfl": e.get("dsqfl"), "centro": e["centro"], "unidades": e["unidades"],
            "own_street_distance_m": None if own is None else round(own, 1),
            "street_codes_within_40m": near_codes,
            "has_itbi_unit_quartiles": bool(e.get("itbi") and e["itbi"].get("valorUnidade")),
            "pavimentos": e.get("pavimentos"),
        })

split_of_street = {}
for b in buildings:
    split_of_street.setdefault(b["street_code"], "test" if int(h("street", b["street_code"])[:8], 16) % 2 else "dev")

selected = []
for slug in PILOT:
    pool = [b for b in buildings if b["area"] == slug]
    taken = set()

    def take(cands, n, stratum, key):
        out = []
        for b in sorted(cands, key=key):
            if b["id"] in taken:
                continue
            taken.add(b["id"]); out.append(dict(b, stratum=stratum));
            if len(out) == n:
                break
        return out

    picks = []
    picks += take([b for b in pool if b["own_street_distance_m"] is not None], 2, "far_centroid", lambda b: -b["own_street_distance_m"])
    picks += take([b for b in pool if len(b["street_codes_within_40m"]) >= 2], 2, "multi_front", lambda b: h("mf", b["id"]))
    picks += take([b for b in pool if not b["has_itbi_unit_quartiles"] and b["unidades"] <= 4], 2, "sparse", lambda b: h("sp", b["id"]))
    picks += take(pool, 10 - len(picks), "ordinary", lambda b: h("or", b["id"]))
    selected += picks

for b in selected:
    b["split"] = split_of_street[b["street_code"]]
    b["labels"] = {
        "building_identity": "unlabeled",
        "street_frontages": "unlabeled",
        "public_entrance": "unlabeled",
        "wrong_street_negative": "unlabeled",
    }

os.makedirs(os.path.join(ROOT, "docs/aplicacao/evaluation-sets"), exist_ok=True)
gb = {
    "set": "G-BUILDING", "version": 1, "created": "2026-11-14", "created_by": "VE00.03",
    "selection_script": "docs/aplicacao/execucoes/VE00/scripts/select_eval_sets.py", "salt": SALT,
    "index_directory": active,
    "street_network_sha256": "154ebe0adc920bd12ec013e1fe110df94f6d2717764dfec9b7ccfc639e426ace",
    "split_rule": "whole official street code -> dev/test by SHA-256 parity; no street in both splits",
    "label_status": "all labels unlabeled; no field review performed in VE00",
    "counts": {s: {"total": sum(1 for b in selected if b["area"] == s),
                   "dev": sum(1 for b in selected if b["area"] == s and b["split"] == "dev"),
                   "test": sum(1 for b in selected if b["area"] == s and b["split"] == "test")} for s in PILOT},
    "buildings": selected,
}
json.dump(gb, open(os.path.join(ROOT, "docs/aplicacao/evaluation-sets/g-building.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# ——— G-COMPARE ——————————————————————————————————————————————————————————————————————
# Cases each pair is designed to exercise. Values are synthetic test inputs, not observations.
CASES = [
    # (case id, tenure, A inputs, B inputs, what the projection must handle)
    ("complete_rent_clear_difference", "aluguel", dict(preco=3200, condominio=650, iptu=(90, "mensal")), dict(preco=2800, condominio=900, iptu=(110, "mensal")), "totals differ; rent ordering reverses after fees"),
    ("rent_equal_totals", "aluguel", dict(preco=3000, condominio=700, iptu=(100, "mensal")), dict(preco=3300, condominio=450, iptu=(50, "mensal")), "equal known totals; no false winner"),
    ("rent_missing_condo", "aluguel", dict(preco=2500, condominio=None, iptu=(80, "mensal")), dict(preco=2900, condominio=550, iptu=(80, "mensal")), "missing fee must stay unknown; break-even = 400/month"),
    ("rent_condo_zero_vs_unknown", "aluguel", dict(preco=2600, condominio=0, iptu=(70, "mensal")), dict(preco=2600, condominio=None, iptu=(70, "mensal")), "declared zero is not unknown"),
    ("rent_annual_iptu", "aluguel", dict(preco=3100, condominio=600, iptu=(1440, "anual")), dict(preco=3150, condominio=600, iptu=(110, "mensal")), "annual IPTU converts to 120/month"),
    ("rent_iptu_period_unknown", "aluguel", dict(preco=2700, condominio=500, iptu=(150, "desconhecido")), dict(preco=2750, condominio=520, iptu=(60, "mensal")), "unknown period stays pending"),
    ("rent_reversal_by_fee_range", "aluguel", dict(preco=2400, condominio=None, iptu=(60, "mensal")), dict(preco=2950, condominio=380, iptu=(60, "mensal")), "unknown condo range 300-900 can reverse the order"),
    ("rent_large_area_difference", "aluguel", dict(preco=3500, condominio=800, iptu=(120, "mensal"), area=120), dict(preco=3200, condominio=750, iptu=(100, "mensal"), area=70), "per-m2 and total disagree"),
    ("rent_all_fees_missing", "aluguel", dict(preco=2800, condominio=None, iptu=(None, "desconhecido")), dict(preco=3000, condominio=None, iptu=(None, "desconhecido")), "only rent known"),
    ("rent_travel_tradeoff_fixture", "aluguel", dict(preco=3000, condominio=600, iptu=(100, "mensal")), dict(preco=2820, condominio=600, iptu=(100, "mensal")), "R$180/month vs 20 min/day x 16 days = 5h20 -> R$33.75/h (plan fixture)"),
    ("complete_purchase_clear_difference", "compra", dict(preco=690000, condominio=780, iptu=(154, "mensal")), dict(preco=540000, condominio=650, iptu=(120, "mensal")), "purchase price difference separate from monthly"),
    ("purchase_equal_price_different_fees", "compra", dict(preco=600000, condominio=900, iptu=(150, "mensal")), dict(preco=600000, condominio=500, iptu=(100, "mensal")), "monthly difference only"),
    ("purchase_missing_iptu", "compra", dict(preco=750000, condominio=850, iptu=(None, "desconhecido")), dict(preco=720000, condominio=900, iptu=(140, "mensal")), "missing IPTU not zero"),
    ("purchase_annual_iptu", "compra", dict(preco=820000, condominio=1000, iptu=(2400, "anual")), dict(preco=800000, condominio=1100, iptu=(180, "mensal")), "annual 2400 -> 200/month"),
    ("purchase_condo_zero_house", "compra", dict(preco=500000, condominio=0, iptu=(90, "mensal")), dict(preco=480000, condominio=450, iptu=(90, "mensal")), "declared zero condo"),
    ("purchase_horizon_reversal", "compra", dict(preco=900000, condominio=600, iptu=(150, "mensal")), dict(preco=870000, condominio=1100, iptu=(150, "mensal")), "30k price gap vs 500/month: crosses at 60 months"),
    ("purchase_itbi_gated_building", "compra", dict(preco=650000, condominio=700, iptu=(130, "mensal")), dict(preco=640000, condominio=720, iptu=(130, "mensal")), "fiscal reference only for single-typology buildings"),
    ("purchase_price_unknown", "compra", dict(preco=None, condominio=700, iptu=(130, "mensal")), dict(preco=610000, condominio=720, iptu=(130, "mensal")), "unknown price must block price difference"),
    ("purchase_large_vs_small", "compra", dict(preco=1200000, condominio=1500, iptu=(300, "mensal"), area=150), dict(preco=700000, condominio=800, iptu=(160, "mensal"), area=80), "per-m2 vs absolute"),
    ("purchase_iptu_period_unknown", "compra", dict(preco=560000, condominio=600, iptu=(154, "desconhecido")), dict(preco=580000, condominio=620, iptu=(100, "mensal")), "unknown period pending"),
]
area_pairs = [(PILOT[i], PILOT[j]) for i in range(5) for j in range(i + 1, 5)]  # 10 cross-area pairs
pool_by_area = defaultdict(list)
held_out = {b["id"] for b in selected if b["split"] == "test"}
for b in buildings:
    if b["id"] not in held_out and split_of_street[b["street_code"]] == "dev":
        pool_by_area[b["area"]].append(b)
for a in pool_by_area:
    pool_by_area[a].sort(key=lambda b: h("cmp", b["id"]))
cursor = defaultdict(int)
pairs = []
for i, (case, tenure, A, B, note) in enumerate(CASES):
    a_area, b_area = area_pairs[i % 10]
    ba = pool_by_area[a_area][cursor[a_area]]; cursor[a_area] += 1
    bb = pool_by_area[b_area][cursor[b_area]]; cursor[b_area] += 1

    def listing(b, v):
        return {
            "building_id": b["id"], "area": b["area"], "address": f'{b["logradouro"]}, {b["numero"]}',
            "tenure": tenure, "price": v.get("preco"), "condo_monthly": v.get("condominio"),
            "iptu_value": v["iptu"][0], "iptu_period": v["iptu"][1], "area_m2": v.get("area", 70),
        }
    pairs.append({"pair_id": f"GC{i + 1:02d}", "case": case, "tenure": tenure, "note": note,
                  "A": listing(ba, A), "B": listing(bb, B),
                  "expected": "unlabeled (VE01 defines and labels the projection outcome)"})
gc = {
    "set": "G-COMPARE", "version": 1, "created": "2026-11-14", "created_by": "VE00.03",
    "selection_script": "docs/aplicacao/execucoes/VE00/scripts/select_eval_sets.py",
    "synthetic_listing_values": True,
    "warning": "Listing values are synthetic test inputs on real public buildings. Never import into a saved notebook.",
    "building_pool": "dev-split streets only; G-BUILDING test buildings excluded",
    "counts": {"pairs": len(pairs), "rent": sum(p["tenure"] == "aluguel" for p in pairs), "purchase": sum(p["tenure"] == "compra" for p in pairs),
               "area_appearances": {s: sum((p["A"]["area"] == s) + (p["B"]["area"] == s) for p in pairs) for s in PILOT}},
    "pairs": pairs,
}
json.dump(gc, open(os.path.join(ROOT, "docs/aplicacao/evaluation-sets/g-compare.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps({"g_building": gb["counts"], "strata": {s: [b["stratum"] for b in selected if b["area"] == s] for s in PILOT}, "g_compare": gc["counts"]}, ensure_ascii=False))
