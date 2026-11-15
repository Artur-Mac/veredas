# VE12 — Summary

VE12 (Integrate and evaluate the five-neighbourhood pilot) is **partial**: the engineering acceptance passes in all five areas, but no participants or real phones were involved, so the pilot is **not validated** and that is stated rather than implied. An end-to-end run on real buildings opened 20 dossiers (rent and purchase, complete and incomplete listings, one home per area with a snapshot from an older index) and 10 comparisons with their Rotina tabs. It recorded 0 page errors, 0 external requests and 0 invariant violations (no NaN/undefined, no overflow). Core blocks appeared everywhere:
- findings, the memory block, negotiation preparation, daily essentials on foot and the night walk in all 20 dossiers;
- the summary, the Rotina tab, the monthly difference and "Onde mais procurar" in all 10 comparisons;
- the "changed since saved" change in all 5 homes given an old snapshot.

Conditional blocks appeared only where their data exists: sun on façades 16/20, noise side 13/20, flood consequence 2/20. Backup and restore preserve everything the later epochs write (snapshot, positioned destinations, questions carried to the visit), older notebooks restore identically, and a malformed snapshot is rejected.

Checks run: Jest 65/65 suites (1,553 tests, 3 new), Node 81/81, typecheck and lint clean, web smoke 50/50, plus the end-to-end run and a production web export. The export exposed the largest engineering problem: one 30 MB JavaScript bundle (7.4 MB gzipped).
- **Composition:** 28.4 MB of it is data (solar cut-outs 15.4, municipal index 7.5, timetable 3.2), because per-area "lazy" loaders still bundle everything.
- **Startup, production build served locally:** 0.7 s at normal CPU and 2.0 s with 4× CPU throttling, with a 45 MB heap. These are desktop proxies, not phone measurements, and network time is excluded.
- **Origin:** about 8 MB came from VE04–VE11; the rest predates them. Fixing it means moving data out of the bundle, with offline caching on web and assets on native, so it is recorded as the top engineering task rather than rushed.
- **Fixture issue:** a malformed test fixture was silently skipped by the app's per-item validation. The fixture was fixed, and the missing notice to the person is noted for the later UX review.

Decision: **iterate**. The capability table:
- **Keep (or keep and improve):** the comparison summary, essentials, the Rotina tab, the corrected corridor signal, flood consequences, sun on façades, the night walk, noise side, changes since saved, negotiation and the decision aids.
- **Stop for now:** shaded walks (D030) and external price ranges (no permitted source).
- **Improve first:** the bundle payload.

The coverage envelope is explicit: the new layers cover strong-link buildings in the five pilot areas only. Open dependencies:
- human review sheets (VE03, G-POI, G-TRANSIT, G-RAIN);
- field observations;
- the G-USER round;
- a native device;
- structured visit answers;
- a permitted offer source.

The next eligible epoch is **VE13 (multimodal AI to reduce the cost of useful evidence)**. Running a dedicated session for the payload split first would lower risk for every later epoch.
