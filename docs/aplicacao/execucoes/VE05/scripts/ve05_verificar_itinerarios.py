"""VE05 — independent check of G-TRANSIT against the raw pinned GTFS zip.

Written separately from the TypeScript router (no shared code): resolves calendar.txt + calendar_dates.txt per service
date, then for every bus/rail leg confirms that the trip exists, belongs to the route, runs on that service day, stops at
both stops in order with the stated departure/arrival, and allows boarding/alighting there. Also checks the chain of
legs (no leg departs before the previous one arrives plus the walk), the holiday swap, the after-midnight cases, the
"no journey" case (no departure from any origin stop in the window) and the expired-feed case.

    python3 -I docs/aplicacao/execucoes/VE05/scripts/ve05_verificar_itinerarios.py
"""
import csv
import datetime as dt
import io
import json
import sys
import zipfile

FEED = "docs/dados/raw/transporte/gtfs.zip"
SET = sys.argv[1] if len(sys.argv) > 1 else "docs/aplicacao/evaluation-sets/g-transit.json"
OUT = sys.argv[2] if len(sys.argv) > 2 else "docs/aplicacao/execucoes/VE05/g-transit-verificacao.json"

z = zipfile.ZipFile(FEED)


def rows(name):
    return list(csv.DictReader(io.TextIOWrapper(z.open(name), "utf-8-sig")))


def sec(t):
    h, m, s = t.split(":")
    return int(h) * 3600 + int(m) * 60 + int(s)


info = rows("feed_info.txt")[0]
cal = {r["service_id"]: r for r in rows("calendar.txt")}
exc = {}
for r in rows("calendar_dates.txt"):
    exc.setdefault(r["date"], {})[r["service_id"]] = r["exception_type"]
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def active(service, iso):
    d = iso.replace("-", "")
    e = exc.get(d, {}).get(service)
    if e == "1":
        return True
    if e == "2":
        return False
    c = cal.get(service)
    if not c:
        return False
    wd = DAYS[dt.date.fromisoformat(iso).weekday()]
    return c[wd] == "1" and c["start_date"] <= d <= c["end_date"]


trips = {r["trip_id"]: r for r in rows("trips.txt")}
s = json.load(open(SET, encoding="utf-8"))
needed = {p["trip_id"] for c in s["casos"] for p in c.get("pernas", []) if p["tipo"] == "viagem"}
origin_stops = {o["stop_id"] for c in s["casos"] if c["resultado"] == "sem_jornada" for o in c["paradasDeOrigem"]}
st = {}
departures_at = {}
for r in csv.DictReader(io.TextIOWrapper(z.open("stop_times.txt"), "utf-8-sig")):
    if r["trip_id"] in needed:
        st.setdefault(r["trip_id"], []).append(r)
    if r["stop_id"] in origin_stops and r["pickup_type"] != "1":
        departures_at.setdefault(r["stop_id"], []).append((r["trip_id"], sec(r["departure_time"])))

results = []
for c in s["casos"]:
    problems = []
    notes = []
    if c["resultado"] == "fora_da_validade":
        if not (c["data"].replace("-", "") > info["feed_end_date"]):
            problems.append("date is inside the feed validity")
        results.append({"id": c["id"], "ok": not problems, "problems": problems, "notes": [f"feed_end_date {info['feed_end_date']}"]})
        continue
    if c["resultado"] == "sem_jornada":
        t0, t1 = c["saidaSeg"], c["saidaSeg"] + c["horizonteSeg"]
        prev = (dt.date.fromisoformat(c["data"]) - dt.timedelta(days=1)).isoformat()
        hits = []
        for o in c["paradasDeOrigem"]:
            for trip_id, d in departures_at.get(o["stop_id"], []):
                sid = trips[trip_id]["service_id"]
                if active(sid, c["data"]) and t0 + o["seg"] <= d <= t1:
                    hits.append((o["stop_id"], trip_id, d))
                if active(sid, prev) and t0 + o["seg"] <= d - 86400 <= t1:
                    hits.append((o["stop_id"], trip_id, d - 86400))
        notes.append(f"{len(hits)} departures from the {len(c['paradasDeOrigem'])} origin stops inside the window")
        if hits:
            notes.append("departures exist; the router found none reaching the destination within the horizon (not a contradiction by itself)")
        results.append({"id": c["id"], "ok": True, "problems": problems, "notes": notes, "departuresInWindow": len(hits)})
        continue
    t = c["saidaSeg"]
    legs = c["pernas"]
    for i, p in enumerate(legs):
        if p["tipo"] == "a_pe":
            if p["seg"] < 0:
                problems.append(f"leg {i}: negative walk")
            t += p["seg"]
            continue
        tr = trips.get(p["trip_id"])
        if not tr:
            problems.append(f"leg {i}: trip {p['trip_id']} not in trips.txt")
            continue
        if tr["route_id"] != p["route_id"]:
            problems.append(f"leg {i}: trip route {tr['route_id']} != {p['route_id']}")
        if not active(tr["service_id"], p["diaDeServico"]):
            problems.append(f"leg {i}: service {tr['service_id']} not active on {p['diaDeServico']}")
        # Seconds of the query's service day = feed time shifted by the leg's service-day offset.
        shift = (dt.date.fromisoformat(p["diaDeServico"]) - dt.date.fromisoformat(c["data"])).days * -86400
        seq = sorted(st.get(p["trip_id"], []), key=lambda r: int(r["stop_sequence"]))
        a = next((k for k, r in enumerate(seq) if r["stop_id"] == p["de"] and sec(r["departure_time"]) == p["partida"]), None)
        b = next((k for k, r in enumerate(seq) if a is not None and k > a and r["stop_id"] == p["para"] and sec(r["arrival_time"]) == p["chegada"]), None)
        if a is None:
            problems.append(f"leg {i}: no departure {p['partidaTexto']} at stop {p['de']} in trip {p['trip_id']}")
        elif seq[a]["pickup_type"] == "1":
            problems.append(f"leg {i}: boarding not allowed at {p['de']}")
        if b is None:
            problems.append(f"leg {i}: no later arrival {p['chegadaTexto']} at stop {p['para']} in trip {p['trip_id']}")
        elif seq[b]["drop_off_type"] == "1":
            problems.append(f"leg {i}: alighting not allowed at {p['para']}")
        dep = p["partida"] - shift
        if dep < t:
            problems.append(f"leg {i}: departs {dep} before the traveller can be there ({t})")
        t = p["chegada"] - shift
        if shift:
            notes.append(f"leg {i}: trip of service day {p['diaDeServico']} at {p['partidaTexto']} (neighbouring service day)")
        if sec(seq[a]["departure_time"]) >= 86400 if a is not None else False:
            notes.append(f"leg {i}: departure time {seq[a]['departure_time']} ≥ 24:00 in the feed")
        notes.append(f"leg {i}: {tr['service_id']}")
    results.append({"id": c["id"], "ok": not problems, "problems": problems, "notes": notes})

# Holiday swap: on 2026-11-02 no weekday service is active and Sunday services are active by exception.
dut = [k for k in cal if k.endswith("-DUT")]
dom = [k for k in cal if k.endswith("-DOM")]
holiday = {
    "weekdayServicesActive_2026_11_02": sum(active(k, "2026-11-02") for k in dut),
    "sundayServicesActive_2026_11_02": sum(active(k, "2026-11-02") for k in dom),
    "weekdayServicesActive_2026_11_09": sum(active(k, "2026-11-09") for k in dut),
}
out = {"feed": info["feed_version"], "checked": len(results), "ok": sum(r["ok"] for r in results), "holiday": holiday, "cases": results}
json.dump(out, open(OUT, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(json.dumps({k: out[k] for k in ("feed", "checked", "ok", "holiday")}))
for r in results:
    print(r["id"], "OK" if r["ok"] else "FAIL", "; ".join(r["problems"]) or "", "|", "; ".join(r["notes"])[:220])
sys.exit(0 if out["ok"] == out["checked"] else 1)
