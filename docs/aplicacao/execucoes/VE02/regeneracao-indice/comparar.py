#!/usr/bin/env python3
"""Compare the regenerated municipal staging with the active published index.

    python3 -I docs/aplicacao/execucoes/VE02/regeneracao-indice/comparar.py > docs/aplicacao/execucoes/VE02/regeneracao-indice/comparacao.json

For every enabled partition: which JSON paths changed (array indexes and street-code keys generalized), and Defesa
Civil totals before/after. Acceptance for the regeneration: changes confined to `rua.logradouros.*.defesaCivil`
(plus fields derived from it) and meta.json source counts. Anything else is reported for review.
"""
import json
import os
import re
import sys
from collections import Counter

ROOT = os.getcwd()
pub = open(os.path.join(ROOT, "src/dados/recife/publicacaoGerada.ts"), encoding="utf-8").read()
active = re.search(r'DIRETORIO_DO_INDICE = "([^"]+)"', pub).group(1)
enabled = json.loads(re.search(r"BAIRROS_HABILITADOS = (\[[^\]]*\])", pub).group(1))
OLD = os.path.join(ROOT, "src/dados/recife", active)
NEW = os.path.join(ROOT, ".cache/dados-recife/indice-municipal-staging")
PILOT = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"]


def diff(a, b, path, out):
    if type(a) != type(b):
        out[path] += 1
        return
    if isinstance(a, dict):
        for k in set(a) | set(b):
            gk = "*" if path.endswith("logradouros") else k
            if k not in a or k not in b:
                out[f"{path}.{gk}{'(+)' if k not in a else '(-)'}"] += 1
            else:
                diff(a[k], b[k], f"{path}.{gk}", out)
    elif isinstance(a, list):
        if len(a) != len(b):
            out[f"{path}[len]"] += 1
        for x, y in zip(a, b):
            diff(x, y, f"{path}[]", out)
    elif a != b:
        out[path] += 1


def dc_totals(d):
    tot = flood = streets = flood_streets = 0
    for v in d["rua"]["logradouros"].values():
        dc = v.get("defesaCivil")
        if not dc:
            continue
        streets += 1
        tot += dc["atendimentos"]
        f = dict(dc["ocorrencias"]).get("alagamento", 0)
        flood += f
        flood_streets += f > 0
    return {"streets_with_records": streets, "records": tot, "flood_records": flood, "flood_streets": flood_streets}


result = {"active_directory": active, "partitions": {}, "paths_changed": Counter(), "meta_changes": None}
for slug in enabled:
    a = json.load(open(os.path.join(OLD, slug + ".json"), encoding="utf-8"))
    b = json.load(open(os.path.join(NEW, slug + ".json"), encoding="utf-8"))
    out = Counter()
    diff(a, b, "", out)
    result["paths_changed"].update(out)
    result["partitions"][slug] = {
        "identical": not out,
        "changed_paths": dict(out),
        "defesa_civil_before": dc_totals(a),
        "defesa_civil_after": dc_totals(b),
        "buildings_before": len(a["edificios"]),
        "buildings_after": len(b["edificios"]),
    }
ma = json.load(open(os.path.join(OLD, "meta.json"), encoding="utf-8"))
mb = json.load(open(os.path.join(NEW, "meta.json"), encoding="utf-8"))
mo = Counter()
diff(ma, mb, "meta", mo)
result["meta_changes"] = dict(mo)
result["meta_defesa_civil"] = {
    "before": next(f for f in ma["fontesDaRua"] if f["chave"] == "defesa_civil"),
    "after": next(f for f in mb["fontesDaRua"] if f["chave"] == "defesa_civil"),
}
allowed = re.compile(r"^\.rua\.logradouros\.\*(\(\+\)|\(-\)|\.defesaCivil.*)$")
result["paths_changed"] = dict(result["paths_changed"])
result["unexpected_paths"] = sorted(p for p in result["paths_changed"] if not allowed.match(p))
tot = lambda k, w: sum(v[f"defesa_civil_{w}"][k] for v in result["partitions"].values())
result["summary"] = {
    "partitions": len(enabled),
    "identical_partitions": sum(v["identical"] for v in result["partitions"].values()),
    "building_count_changes": sum(v["buildings_before"] != v["buildings_after"] for v in result["partitions"].values()),
    **{f"{k}_{w}": tot(k, w) for k in ["records", "flood_records", "flood_streets", "streets_with_records"] for w in ["before", "after"]},
    "pilot": {s: {"before": result["partitions"][s]["defesa_civil_before"], "after": result["partitions"][s]["defesa_civil_after"]} for s in PILOT},
}
json.dump(result, sys.stdout, ensure_ascii=False, indent=1)
print()
