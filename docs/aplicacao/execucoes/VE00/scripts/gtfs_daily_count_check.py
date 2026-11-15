#!/usr/bin/env python3
"""VE00.02 — quantify the GTFS "daily stops" defect in the published noise-corridor layer.

Run from repo root: python3 -I docs/aplicacao/execucoes/VE00/scripts/gtfs_daily_count_check.py
Reproduces the generator's count (scripts/dados/camadas-inteligentes-recife.mjs: stop_times rows per stop summed over
every service_id) and compares it with stop events on one representative weekday, Saturday and Sunday, resolved from
calendar.txt + calendar_dates.txt of the same feed. Dates are inside the feed's validity window.
"""
import csv, io, json, zipfile, datetime
from collections import Counter, defaultdict

PATH = ".cache/dados-recife/gtfs-inspecao.zip"
DAYS = {"weekday_2026-11-11": datetime.date(2026, 11, 11), "saturday_2026-11-14": datetime.date(2026, 11, 14), "sunday_2026-11-15": datetime.date(2026, 11, 15)}
z = zipfile.ZipFile(PATH)
rd = lambda n: csv.DictReader(io.TextIOWrapper(z.open(n), "utf-8-sig"))
cal = list(rd("calendar.txt")); cd = list(rd("calendar_dates.txt"))
names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
def active(day):
    s = set()
    for r in cal:
        a = datetime.datetime.strptime(r["start_date"], "%Y%m%d").date(); b = datetime.datetime.strptime(r["end_date"], "%Y%m%d").date()
        if a <= day <= b and r[names[day.weekday()]] == "1": s.add(r["service_id"])
    for r in cd:
        if datetime.datetime.strptime(r["date"], "%Y%m%d").date() == day:
            (s.add if r["exception_type"] == "1" else s.discard)(r["service_id"])
    return s
trip_service = {t["trip_id"]: t["service_id"] for t in rd("trips.txt")}
by_stop_service = defaultdict(Counter)
for st in rd("stop_times.txt"):
    by_stop_service[st["stop_id"]][trip_service.get(st["trip_id"])] += 1
summed = {s: sum(c.values()) for s, c in by_stop_service.items()}
corr = [s for s, n in summed.items() if n >= 180]
act = {k: active(d) for k, d in DAYS.items()}
rows = []
for s in corr:
    day = {k: sum(n for sv, n in by_stop_service[s].items() if sv in act[k]) for k in DAYS}
    rows.append((s, summed[s], day))
ratios = sorted(r[1] / r[2]["weekday_2026-11-11"] for r in rows if r[2]["weekday_2026-11-11"] > 0)
med = lambda xs: xs[len(xs) // 2] if xs else None
out = {
    "feed": PATH, "corridor_threshold_summed_events": 180, "corridor_stops_by_generator_rule": len(corr),
    "active_services": {k: len(v) for k, v in act.items()},
    "corridor_stops_still_>=180_on_weekday": sum(1 for r in rows if r[2]["weekday_2026-11-11"] >= 180),
    "corridor_stops_with_zero_weekday_events": sum(1 for r in rows if r[2]["weekday_2026-11-11"] == 0),
    "median_ratio_summed_to_weekday": round(med(ratios), 2) if ratios else None,
    "p10_p90_ratio": [round(ratios[len(ratios) // 10], 2), round(ratios[9 * len(ratios) // 10], 2)] if ratios else None,
    "examples": [{"stop_id": s, "published_count_labelled_daily": n, **d} for s, n, d in sorted(rows, key=lambda r: -r[1])[:5]],
}
print(json.dumps(out, indent=1))
