# VE16 — Evaluation

**State:** partial · **Outcome:** adopt (update operations) / iterate (review economics) · Applications: A37, A38.

## What was built

- **One update command**, [`scripts/dados/ciclo.mjs`](../../../../scripts/dados/ciclo.mjs). It runs the eight per-building steps in dependency order: observations, walk network, day-to-day, transit, rain, night, where-to-look, sun. Before starting, it records a restore point (active versions, app modules, hash of every published layer file). Per step it records time and peak memory. Afterwards it reports buildings added, changed or removed per layer and area, source dates and a state check. It can skip unchanged steps, simulate an interruption, revert a cycle and re-apply one. The runbook is [RUNBOOK-ATUALIZACAO.md](../../RUNBOOK-ATUALIZACAO.md).
- **One area list**, [`scripts/dados/areas.json`](../../../../scripts/dados/areas.json). It replaces six hard-coded copies, with the pilot first and in its usual order so pilot files do not move when an area is added.
- **Screen coverage text follows the data**, [`coberturaDasCamadas.ts`](../../../../src/dados/recife/coberturaDasCamadas.ts). "Cinco bairros do piloto" is no longer fixed in Compare. The building-confirmation card now names the enabled index (72 bairros) instead of a stale five-area list.

## Cycles

Records are in `ciclos/` (one JSON per cycle).

| Cycle | What | Time | Result |
|---|---|---|---|
| c1 | offline re-run of the code as found | 849 s | Walk network, transit and night byte-identical. Essentials and rain published new versions with **0 buildings changed**; essentials rewrote its own version folder (see defects) |
| c2 | **live acquisition** after fixes | 607 s | Requests: Defesa Civil probe ×2, Geofabrik ×2, three municipal place sources. 0 pilot buildings changed |
| c3 | offline, cache off | 522 s | **Byte-identical to c2**: same 5 publication versions, 0 modules changed, 99/99 layer files identical |
| c4 | cached | 0.17 s | 8/8 steps skipped |
| c5 | Torre + interruption | 220 s | **Invalid test**: the kill reached only the timing wrapper, and transit finished as an orphan. Runner fixed; cycle reverted (118 ms) |
| c6 | Torre + real interruption at transit +8 s | 201 s | Transit pointer and module unchanged, no leftover temp folder, state check clean. App coherent in between: Torre has day-to-day only |
| c7 | resume | 560 s | Complete. Finished steps re-ran because I changed the cache-key formula between c6 and c7 |
| c8 / c9 | where-to-look cold / only Torre missing | 224 s / **10 s** | Same output version both times |
| — | revert c7, re-apply c7 | 122 / 127 ms | Both equal to their restore point, state check clean |
| c10 | full re-run with Torre | 298 s | **Byte-identical**: 0 modules changed, 104/104 files, same versions |
| c11 | cached | 0.18 s | 8/8 steps skipped |

**Data age at c2:**
- **Street network:** the OSM extract is the newest dated one (data to 13 Nov).
- **Defesa Civil 2024:** the portal declares as many rows as the archive (80,173), and 1,000/1,000 sampled rows are identical.
- **Municipal places:** fetched live.
- **Outside the cycle:** the GTFS feed is pinned (v2026.10.26) and not re-probed, and the building index dates from 22 Oct.

## Defects found by the cycles, and fixed

1. **Version churn.** Essentials and rain stamped run time into each area file, and that file feeds the publication hash. Every re-run therefore created a "new" version with identical data. On web, clients would re-download, and a VE09 memory snapshot would see a different layer. `geradoEm` is now the date of the newest source datum.
2. **Mutable version folders.** Essentials rewrote files inside an existing version folder. A revert of c1 was correctly **refused** because the restore point no longer matched. Version folders are now immutable ([`imutavel.mjs`](../../../../scripts/dados/imutavel.mjs)): a different content under the same version stops the pipeline. The essentials format was bumped to 3.
3. **Misdated sources.** Replayed municipal sources were stamped with the run time as retrieval time, so data looked fresher than it was. The archive date is now kept, and a live failure that falls back to the archive says so.
4. **Human answers at risk.** Four pipelines rewrote their review sheets on every run. A filled `REVISAO_*`/`OBS_*` column would have been erased by the next update. Sheets with human answers are now kept, and the regenerated one goes beside them ([`folhas.mjs`](../../../../scripts/dados/folhas.mjs), 4 tests). The G-RAIN selection is frozen once created. No answer had been lost: every pipeline-written sheet was still empty.
5. **Runner defects found by my own tests.** Interruption killed the wrapper, not the pipeline. Cache keys included restore annotations. The where-to-look cache was keyed on file headers and missed on expansion. All three are fixed and re-measured (c6, c11, c9).
6. **A brittle test.** `tests/camadas.test.ts` had a layer-version path hard-coded, which left the manifest after a publication. It now reads the path from the generated module.

## Expansion: Torre (adjacent to Madalena, across the Capibaribe from Graças)

Torre was chosen before running: it has 137 buildings, it adds a river barrier and new bus corridors, and its sun data comes from local files.

| Feature | Torre | Pilot reference |
|---|---|---|
| Building index | 137 (already enabled) | — |
| Strong entrance link | 127/137 (92.7%) | 2,516/2,688 (93.6%) |
| OSM address agrees with the cadastre | 10/10, median 8 m | 310/315 |
| Walk routes | 137/137, 0 impossible, 0 suspicious; detour p90 3.73 | p90 2.1–3.2 |
| Day-to-day within 10 min | market 123, pharmacy 102, square 127, transport 127 (of 127 on the network) | — |
| Routine by hour | 127 buildings; **held-out G-TRANSIT-TORRE 12/12** verified against the raw GTFS by the independent VE05 checker (weekday, Saturday, Sunday, holiday, late return, after midnight) | G-TRANSIT 20/20 |
| Night return | 127, all with a stop with night arrivals; 95 with a main road within 80 m | — |
| If it floods | 127 analysed, **0** with a material change (≥3 min or loss) — the block stays hidden, as for Graças | — |
| Sun on façades | cut-out added (1.98 MB, loaded only when opened) | 5 areas |
| Where to look | +13 Torre streets (274 total) | 261 |

Neither interruption nor expansion changed any pilot building. In every layer and area, 0 buildings were added, changed or removed. Some pilot files got new version folders only because the walk-network version they carry in their header changed.

**Rendered check** at 375/360 px: a real Torre building shows *A pé, a partir da entrada*, *Voltando à noite* and *Sol nas fachadas*, and Compare's *Rotina* computes Torre against Madalena with no "cinco bairros" text. There were no page errors and no external requests ([render-torre.json](render-torre.json)). The Madalena control building has no façade block; its sun file content was unchanged throughout VE16.

## Cost and sustainability

- **Machine:** a full offline cycle takes 522 s (8.7 min) on one laptop, peaking at 1.35 GB. That is 0.18 s per building per cycle across 2,825 buildings. A cached cycle takes 0.2 s. Adding an area recomputes where-to-look for that area only (10 s instead of 224 s), but the other steps still run in full, about 5 min. Where-to-look is 41% of a full cycle.
- **Money:** R$ 0. No remote worker, storage or PostGIS was introduced, because no measured step needs one.
- **People:** **0 review minutes so far.** 259 rows wait in review and observation sheets (G-BUILDING 50, G-POI 44, G-RAIN 38, G-TRANSIT 20, G-TRANSIT-TORRE 12, night 15, shade 80). Human review is now the binding cost, and it is unmeasured.
- **Per useful decision:** not measurable without participants.
- **Storage:** old app version folders are kept for rollback (transit ≈3 MB per version). They are not published to the bundle; prune only versions no revertable cycle references.

## Acceptance

| Criterion | Met? |
|---|---|
| Two reproducible cycles | **yes** — c3 and c10 are byte-identical full re-runs (5 and 6 areas) |
| A demonstrated rollback | **yes** — three reverts and one re-apply, each equal to its restore point; one revert correctly refused |
| No data-loss regression | **yes** — review-sheet guard, immutable versions; Jest 68/1,571, pipeline tests 90/90, smoke 50/50 |
| Explicit coverage per enabled feature in the new area | **yes** — table above, plus a held-out set |
| Refresh/review effort sustainable for the team | **partly** — compute and refresh effort yes; human review effort unmeasured (no sheet worked); no price to compare cost against |

## Next

- Work one review sheet with a timer, to measure review minutes per row.
- Make the code fingerprint per step, so editing one script does not re-run all eight.
- Add a GTFS freshness probe and the municipal index to the cycle.
- Run the next area only after the review cost is known.
