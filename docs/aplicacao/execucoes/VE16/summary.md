# VE16 — Summary

VE16 turned the scattered per-layer pipelines into one update cycle, then measured it. `scripts/dados/ciclo.mjs` runs the eight steps in order and records a restore point first. It reports how many buildings each layer added, changed or removed per area, and it can skip unchanged steps, interrupt, revert and re-apply. The first plain re-run exposed problems that would have hurt people quietly:
- **Version churn:** two layers published a "new" version on every run with identical data, because they stamped the run time into their files.
- **Overwritten versions:** one layer rewrote its own published version folder, and a revert was correctly refused as a result.
- **Misdated data:** replayed municipal data was dated as if just fetched.
- **Human answers at risk:** four pipelines would have erased any human answers in their review sheets on the next update. None had been written yet, so nothing was lost.

All four are fixed. Versions are now immutable, and dates are the data's own. Sheets with human answers are preserved, and the regenerated copy is written beside them. After the fixes, a live acquisition cycle changed no pilot building and confirmed the sources are current. Two full re-runs (c3 with five areas, c10 with six) reproduced byte for byte. A cached cycle takes 0.2 s instead of 8.7 min.

The expansion went to Torre, next to Madalena and across the river from Graças, chosen before running. Every per-building layer now covers it:
- **Walking links:** 127 of 137 strong (92.7%, pilot 93.6%).
- **Day-to-day, routine, night and sun:** shown on a real Torre building in the dossier, and Compare computes its routine.
- **Held-out set:** 12 transit itineraries, all 12 verified against the raw GTFS by the independent checker, including holiday and after-midnight cases.
- **Flooding:** Torre honestly shows 0 buildings with a material flooding change, so that block stays hidden as it does for Graças.

The expansion was run with a real interruption in the middle. The interrupted step left nothing behind, and the app stayed coherent with Torre half-covered. The resumed cycle completed, and a revert and a re-apply each took about 120 ms and matched their restore points exactly. No pilot building changed in any layer. My own tests also caught three runner defects, each fixed and re-measured: the kill missed the real process, cache keys included restore notes, and the where-to-look cache missed on expansion. With the cache fixed, adding an area recomputes where-to-look in 10 s instead of 224 s. Regression is clean: Jest 1,571 tests, pipeline tests 90/90, typecheck, lint and the 50-step smoke test.

VE16 stays partial, because one acceptance item is not met: evidence that review effort is sustainable for the team. Compute is cheap (R$ 0, 0.18 s per building per cycle, no remote services needed). But no review sheet has been worked, so human review, the real recurring cost, is unmeasured, with 259 rows waiting. There is also no price to compare cost against. Next: time one review sheet, give each step its own code fingerprint so an edit doesn't re-run all eight, and add a GTFS freshness probe and the municipal index to the cycle. The next eligible epoch is VE17, the final portfolio review. It gives every application A01–A40 a destination from the measured evidence and sets the next small programme.
