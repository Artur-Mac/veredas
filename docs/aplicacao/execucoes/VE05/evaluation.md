# VE05 — Evaluation record

## Objective and scope

Make routine depend on date, direction and hour (plan §7, VE05; application A10). The user should be able to compare a weekday morning, a Saturday and a late return without mistaking stop counts for useful transit.

**Entry state:**
- VE02 is verified (pinned feed archived).
- VE03 and VE04 are partial; their walking access is used only for strong or reviewed entrance links (D020).

## Work packages

| ID | State | Delivered | Evidence |
|---|---|---|---|
| VE05.01 One feed and service-day model | done | See notes below the table. | [transito.json](transito.json) |
| VE05.02 Journey calculations | done | See notes below the table. | G-TRANSIT below |
| VE05.03 Scenario comparison | done | See notes below the table. | rendered checks |
| VE05.04 Reliability stub | done (research) | See notes below the table. | [measurements.json](measurements.json) |

**VE05.01 — one feed and service-day model.**
- **Compactor:** [grade.mjs](../../../../scripts/dados/transito/grade.mjs) reads the pinned GTFS v2026.10.26 (SHA-256 `e1d834d9…`; one timezone, America/Recife, which has no DST). It produces 1,216 stop patterns, 8,417 timing profiles and 87,678 trips, with 0 discarded. Discards would carry a reason: missing time, time going backwards, unknown stop.
- **Device router:** [roteador.ts](../../../../src/dados/transito/roteador.ts) resolves `calendar` and `calendar_dates` per date on the device:
  - 1,137 exceptions, all on 2026-11-02 (All Souls' Day, a Monday), where every weekday service is removed and the Sunday services are added;
  - times after 24:00, using the previous and the next service day;
  - stops where boarding or alighting is not allowed.
- **Stop checks:**
  - 2,791 of 2,822 Recife stops lie within 40 m of an official street (median 7 m);
  - 5,376 of 7,208 stops are linked to the VE03 network.
- **Stop names:** 6,731 stops that had only a numeric code are now named after their street ("Ponto na Avenida …").
- **Scheduled vs observed:** the app labels every result as scheduled.

**VE05.02 — journey calculations.**
- **Algorithm:** RAPTOR over (pattern, profile) routes. Each journey is broken into access walk, wait, boarding direction ("sentido …"), ride, transfer walk, buffer and final walk.
- **Transfer rules:** a 2-minute transfer buffer, and a 5-minute penalty per extra ride, so a bus hop must save at least 5 minutes to be chosen.
- **Access walk:** from the building entrance over the VE03 network, to the stops within 1 km. The app keeps every stop within 400 m plus any farther stop that serves a line and direction no closer stop serves; the pilot median is 9–21 stops per building.
- **Transfer walks:** 19,623 pairs computed on the network, and 3,735 estimated as straight line × 1.19. The 1.19 is the median detour measured on 31,162 network stop pairs.
- **Destination walk:** straight line × 1.19, labelled as estimated.
- **r5py:** not used. The input is one feed and the pilot's walk legs, and a ~300-line router in the app avoids a Java service. It was not benchmarked against r5py.

**VE05.03 — scenario comparison.**
- **Compare tab "Rotina"** ([Rotina.tsx](../../../../src/componentes/comparar/Rotina.tsx)) shows four rows:
  - weekday out, 7–8h;
  - weekday back, 18–19h;
  - Saturday, 9–10h;
  - late return, leaving 22–23h.

  Each row gives the median and worst case of departures every 10 min, on the next date without calendar exceptions. Below them sits a "last useful return" row (21h–02h, arrival within 90 min) and a typical itinerary for each home.
- **Monthly difference:** computed with the profile's explicit days per month: `diasPresenciaisMes` × (out + back).
- **Destinations reused:** the profile's work/study neighbourhood, and positioned notebook destinations of both homes.
- **States shown separately:** no destination, building outside the pilot, unconfirmed entrance, empty service window, and feed not covering the date.
- **Corridor claim (I01):** the dossier's "bus corridor" claim is recomputed by [corredores.mjs](../../../../scripts/dados/transito/corredores.mjs); details under Results.

**VE05.04 — reliability stub.** A web search on 2026-11-14 found no published GTFS-RT or vehicle-position feed from Grande Recife. No delay statistics were produced; X09 stays a VE14 experiment.

## Commands actually run

```
node --max-old-space-size=8000 scripts/dados/transito/rodar-transito.mjs --relatorio docs/aplicacao/execucoes/VE05/transito.json   # Node 22, 27 s, 1.4 GB
node docs/aplicacao/execucoes/VE05/scripts/ve05-gtransit.mjs && python3 -I docs/aplicacao/execucoes/VE05/scripts/ve05_verificar_itinerarios.py   # 20/20
node scripts/dados/transito/corredores.mjs --aplicar --relatorio docs/aplicacao/execucoes/VE05/corredores.json   # backup in .cache/backup-ve05/
node --test scripts/dados/transito/testes/grade.test.mjs scripts/dados/destinos/testes/destinos.test.mjs scripts/dados/rede/testes/rede.test.mjs scripts/dados/observacoes/testes/pipeline.test.mjs   # 65/65
npm run typecheck && npm run lint && npx jest --runInBand   # 0 errors; 0 errors / 5 pre-existing warnings; 58/58 suites, 1500/1500
POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE05/scripts/ve05-render.mjs   # 375 and 360 px
POC_URL=http://localhost:8087 SMOKE_OUT=out/ve05/v1-smoke node scripts/v1-smoke.mjs   # 50/50
```

## Results

**Engineering.**
- **Node tests:** 5 new compactor tests: times after 24h, dwell, boarding flags, exceptions, quoted CSV, and discards with a reason.
- **Jest:** 19 new tests. Synthetic fixtures cover the plan's acceptance list (see the table below). Real-payload tests replay every G-TRANSIT journey with identical lines and duration.

| Fixture | Behaviour checked |
|---|---|
| Added/removed exception | 02/11: weekday out, Sunday in |
| Saturday / Sunday | Correct service; Sunday with no service on this line |
| 24:xx | 25:00 on the 17th equals 01:00 on the 18th |
| Opposite directions | Separate patterns |
| Transfer | Buffer boundary: 07:12 boardable, 07:20 with a 3-minute buffer |
| Walk transfer | Between neighbouring stops |
| No-boarding stop | Cannot be used as an origin |
| Last return | Latest departure that still connects |
| Expired feed | Reported as "feed does not cover this date" |

**G-TRANSIT** ([g-transit.json](../../evaluation-sets/g-transit.json), [verification](g-transit-verificacao.json)). 20 cases, fixed before running:
- one building per pilot area, chosen by SHA-256 order;
- destinations are the neighbourhood centroids the app uses;
- weekday out and back, two opposite-direction pairs, Saturday, Sunday, and the holiday plus its control Monday;
- late return, and the same after-midnight instant asked as 24:20 of the 17th and as 00:20 of the 18th;
- an empty window and an expired-feed date.

An independent Python checker reads the raw zip and shares no code with the router. It confirmed every bus or rail leg: trip, route, service on that service day, stops in order, exact departure and arrival, boarding allowed, and a feasible chain. Result: **20/20**, with 17 journeys, 2 with no journey and 1 out of validity.
- **Holiday:** 0 weekday services and 362 Sunday services active on 02/11, against 393 weekday services on 09/11. The holiday journey takes 49 min against 42 min on the normal Monday.
- **Defect found and fixed:** the two after-midnight cases first disagreed. A 24:20 query could not board 01:04 trips of the next service day; the router now considers the next service day too.

**Data validity — the old count, corrected.**

| Measure | Value |
|---|---|
| Old "corridor" rule | stop_times rows summed over weekday, Saturday and Sunday, from an unpinned feed |
| Ratio of old count to real weekday departures (median) | 2.22× |
| Old corridor stops with zero weekday service | 25 |
| Corridor stops, old rule → new rule | 2,356 → 1,492 |
| New rule | ≥ 180 scheduled departures on Tuesday 17/11 |
| Pilot buildings losing a "bus corridor within 160 m" signal | 185 of 2,688 |
| Pilot buildings gaining one | 0 |

Losses by area: Boa Viagem 70, Graças 69, Madalena 33, Espinheiro 8, Casa Forte 5. The dossier now states the departures ("corredor de ônibus a 80 m (420 partidas num dia útil)"), and the layers script uses the pinned feed and the same function (I01 and I08 closed in code).

**Rendered review.** First render, real buildings, profile destination "Recife":

| Defect | Fix |
|---|---|
| "Última volta útil: 04:00", which was the first morning bus | Window limited to 21h–02h with arrival ≤ 90 min; a linear scan replaces a binary search that assumed one interval (the night "Bacurau" lines break it); "Madrugada" is shown when service continues |
| Destination read "centro de Recife (bairro)" | Reads "centro do bairro Recife" |
| "1 ônibus" also counted metro rides | Shows "direto / 1 baldeação" |
| An extra 2-minute bus hop to save seconds | 5-minute penalty per extra ride |

Final render at 375 and 360 px: no overflow, no page errors, no external requests. Casa Forte vs Graças → centro do bairro Recife:
- weekday out: 51 vs 37 min;
- monthly difference: **11.5 h/month** over 20 days;
- last useful return: 00:35 for both.

**Customer usefulness.** No participants. Expert reading:
- The tab answers "how long, at which hours, with how many transfers, and until when can I come back". It shows the actual lines and stops, and states its limits.
- The destination is coarse when it is a neighbourhood centroid.
- The monthly hours number is the most decision-relevant output. It is not yet in the Compare brief (decisao.ts); that is a follow-up.

**Operating viability.**

| Item | Measure |
|---|---|
| Pipeline | 27 s, 1.4 GB, no network |
| Timetable payload | 2.88 MB raw (0.76 MB gzip), bundled and parsed only when the tab opens |
| Access payload | 273 KB across five areas |
| Router, Node 22 desktop | 9–18 ms per search |
| Compare tab, two homes, all scenarios, desktop Chromium | ~2–2.7 s after load |
| Phone | Not measured. Hermes has no JIT, so a low-end device may be several times slower: a risk for D009. |

## Remaining work

- A person reviews [g-transit-revisao.csv](../../evaluation-sets/g-transit-revisao.csv) against the operator's published timetables. The plan asks for manual reproduction; the independent automated checker is not a substitute.
- Measure the router and the 2.9 MB payload on a low-end phone. If too slow, precompute per-building windows for profile neighbourhoods, or move the work to a worker.
- Feed the monthly-hours difference into the Compare brief as a material difference.
- Use the VE04 network walk at the destination when the destination is in the pilot.
- No fare modelling.
- Reliability needs observed vehicle data (VE14/X09).

## Outcome

**State: partial.** All four work packages are implemented and the engineering acceptance list passes, including independent reproduction. Human review of G-TRANSIT, device performance and observed reliability are missing. **Outcome: iterate.**
