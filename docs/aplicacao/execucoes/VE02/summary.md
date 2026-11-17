# VE02 — Summary

VE02 (Observation and publication pipeline) is **verified**. Before this epoch, a collector reporting "ok" or receiving HTTP 200 was treated as success. Two data systems coexisted, the OSM collectors queried boxes outside Recife, and transit feeds were not pinned. Delivered:
- **A single shared contract**, [`src/dados/observacao.ts`](../../../../src/dados/observacao.ts). It covers source snapshots, observations, quarantine and publication manifests. Every collection gets an explicit state (valid, empty, partial or failed, with a reason). Unknown values are kept distinct from zero, and an administrative date is never treated as the time an event happened. The app, Jest and the Node 22 pipeline all import it.
- **Three sources run through that contract:**
  - the Prefeitura's CKAN data API, with a mandatory field whitelist, replaying the archived Defesa Civil files for 2020–2024;
  - Geofabrik's HTML listing, used to select and archive the dated, MD5-verified street-network extract `nordeste-261113.osm.pbf`;
  - the app's existing listing import.
- **GTFS snapshots** of both feeds, with v2026.10.26 pinned for later runs.
- **Repaired OSM collectors**, now using a tested query builder.
- **A versioned publication** with atomic activation and rollback ([publicar.mjs](../../../../scripts/dados/observacoes/publicar.mjs)), plus a guard test for the app's own active index.
- **A health report** ([health.json](health.json)).

Replaying the archive also exposed a defect in the existing published data. The street reader silently dropped every March row, because the source spells "Março" as "Maro": 21,899 rows in 2020 and 2022, plus about 15,900 in the 2015 and 2019 CSVs. The dossier's Defesa Civil street counts were therefore too low. In a follow-up the same day I fixed the reader (with a regression test), made the CSV cache key include the reader version, and **regenerated and activated the app index** as `indice-municipal/5bad409c1782ca8a`. Only Defesa Civil fields changed: street-attached records went from 43,385 to 45,539, flood counts are unchanged, and the previous version is kept for one-command rollback. That regeneration exposed a new problem. The street metric counted outreach campaigns as attendances: on 2019-03-29 alone, 712 rows on Rua Salgueiro (Boa Viagem) were a door-to-door campaign. In a second follow-up I added the action type to the whitelist and counted outreach separately, using a conservative rule that keeps unknown types counted. The index was regenerated and activated as `indice-municipal/1e393803851f3fd5`. Of the 45,539 street-attached records, 18,820 (41%) were outreach, and flood counts are unchanged. Rua Salgueiro now shows 14 attendances, with 735 outreach actions named as left out of the count.

Checks run:
- Typecheck: clean.
- Lint: 0 errors.
- Jest: 56/56 suites, 1,468 tests (18 new).
- [Pipeline test suite](../../../../scripts/dados/observacoes/testes/pipeline.test.mjs): 33/33 under Node 22, using a local HTTP server and a temporary folder.

The suite covers every acceptance case: a 200 response carrying an error page, 403, persistent and one-off 429, repeated, missing and short pages, an exhausted request budget, a legitimately empty result, shifted columns, "Maro", UTM coordinates and swapped lat/lon, all categories failing, absent fees, an interrupted write, a leftover folder from a killed process, a bad checksum, partial versions, a drop in coverage, all sources failing, and rollback. It first passed 30 of 32. One failure was my own regex. The other was a real bug: the region-page size reader always returned nothing.

Results on real data:
- **Volume:** 388,739 rows declared, 388,555 accepted, and 184 quarantined, all with genuinely impossible dates or no usable street.
- **Street links:** 60.7% linked to an official street code, 1.4% ambiguous, 38.0% unlinked. Link precision is **unmeasured**, because no reviewed labels exist yet.
- **Categories:** only 3.9% of rows carry an incident category at the source.
- **Live probe:** 1,000 of 1,000 fetched rows match the archive by content.
- **Rollback:** reverting took 18 ms and reactivating 13 ms on the real publication.

My errors during the run were fixed and are recorded:
- the collector at first requested every column, and the source now also publishes property measurements;
- the probe compared IDs that the archive doesn't store;
- a parser fix was published once without bumping its version.

A full replay takes about 33 s and about 1.1 GB of memory and costs nothing. No field, customer or human-review evidence was involved ([evaluation](evaluation.md), [measurements](measurements.json)).

Decision: **adopt** the contract, collectors, publication path and health report as the data route for later epochs. Remaining work:
- have Defesa Civil staff, or a sample review, confirm the outreach rule; republish the VE02 observation layer with `Tipo_da_Acao`;
- review a sample of street links;
- (correction) the activator's audit file was never moved; my VE02 claim was wrong. The activator now also re-hashes the files it wrote before switching the catalog;
- add the Node pipeline tests to an npm script once you are ready to commit `package.json`.

The next eligible epoch is **VE03 (entrances and pedestrian network)**. Its first concrete task, VE03.01, is to join the 2,688 pilot buildings to the official street network, keeping every candidate frontage for corner buildings. Then VE03.02 builds the pedestrian graph from the archived `nordeste-261113.osm.pbf`. That step needs a PBF reader (for example pyosmium or osmium-tool), which is not installed on this machine: the first dependency to resolve.
