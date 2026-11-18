# PROGRESS_CARBON — VEREDA Master Execution Tracker

**Branch:** `feat/carbon-master-upgrade`
**Started:** 2026-11-17T22:59-03:00
**Master Spec:** `docs/ARQUITETURA_MESTRE.md`

## 1. Product Insights Extracted from `/home/v/Documents/mcphub/` (Strict Quarantine Applied)
- **Strict Quarantine Enforced:** Ignored and excluded all social media/outreach/marketing rows from `/home/v/Documents/mcphub/EnemiesHub/data/enemyhub.db`.
- **Retained Engineering & Product Patterns:**
  - Drizzle ORM + SQLite + Zod strict schemas as single source of truth (`src/db/schema.ts`, `src/lib/*-write.ts` pattern).
  - Conventional Commits (single-line English, strictly **zero** `Co-Authored-By` or AI attribution trailers per team rule).
  - Canonical `pt-BR` domain glossary discipline and non-destructive schema evolution (`docs/PRD.md`, `docs/SPEC.md`).
  - Synthesized competitive learnings (`docs/projetosraiox/00-sintese-backlog.md`): 3 distinct absence states (*não se aplica*, *sem ocorrência no período*, *ainda não sabemos*), dual property identification keys (`DSQFL` + `CNM 16 dígitos`), 3-state document package (`recebido | faltando | vencido`), 6-field Method Card, and Symbium/Gridics *verdict + legal article + arithmetic* strictly tucked in Layer 3 proof drawer.

## 2. Baseline Snapshot (Before Master Upgrade)
- **Dataset:** 7,206 buildings across 72 neighborhoods; 2,825 pilot buildings across 6 areas (Boa Viagem, Casa Forte, Graças, Espinheiro, Madalena, Torre); 114,079 municipal lots; 300,703 walking graph edges.
- **Test Baseline:** TypeScript `0` errors; ESLint `0` errors, `5` warnings (mid-file imports & unused eslint-disable); Jest `80/81` suites passed (`tests/visita.test.ts:392` timed out at `5000ms` under parallel load).
- **Pending Human Gates:** 259+ unreviewed evaluation rows (`g-building-revisao.csv`, `g-poi-revisao.csv`, `g-rain-revisao.csv`, `g-rain-h1.csv`, `g-transit-revisao.csv`, `g-transit-torre-revisao.csv`, `g-extract-revisao.csv`, `g-noite-observacao.csv`, `g-shade-observacao.csv`) — **NEVER** artificially marked as reviewed.

## 3. Milestone Checklist & Progress
- [x] **M0:** Branch `feat/carbon-master-upgrade`, persist `docs/ARQUITETURA_MESTRE.md`, `PROGRESS_CARBON.md`, fix 5 lint warnings + `visita.test.ts` timeout -> green `npm run verificar`.
- [x] **M1 (Pillar A.1 & A.2):** Data hygiene (`-3h` UTC APAC/CEMADEN, 156 hash deduplication, triplicate paraciclos cleanup, archive 2015/2016 CTTU & 2007 canopy keeping 49 heritage trees), single-keystroke `scripts/auditoria-humana.mjs`, 8 Canonical Contracts (Zod + TypeScript + SQLite DDL).
- [x] **M2 (Pillar A.3):** `EPSG:31985` SIRGAS 2000 UTM 25S analytical projection engine, ESIG ArcGIS REST deterministic `OBJECTID`-paginated extractor, PE3D LiDAR (`MDS - MDT`) reader, IBGE Censo 2022 Entorno priors + CNEFE point fusion.
- [x] **M3 (Pillar B.1, B.2, B.7):** `IND-01/#37` SPU Marine Lands & FGTS engine, `IND-02/IND-09/#42` Prédios-Caixão + NBR 15575-1:2025 + NBR 6118 + Law PE 13.032/06 + Tenancy Law, `IND-07/#40` NBR 14653-2 ITBI econometrics + Repeat-Sales + Recife closing tax optimizer.
- [x] **M4 (Pillar B.3–B.6, B.8):** `IND-03/#38` Tropical 3D Bioclimatic + 108-byte horizon + LPUOS 2025 radar, `IND-04/#15` 3D Acoustics + PEZR SBRF + NBR 15575-4, `IND-05` 1m Hydro-Tide `ST-DBSCAN` + `HAND/TWI`, `IND-06` PU-Learning EM 156 debiaser, `IND-08/#39` AQUA PE (23/11/2026) + Tapacurá + ANEEL + 5G.
- [x] **M5 (Pillar B.9 & B.10):** `IND-10/#41` ONR CNM 16-digit ISO 7064 MOD 97-10 + 100% deterministic citation entailment + DataJud client, `Fellegi-Sunter` EM + `pHash` deduplication + *Street Smart* walkability & GTFS calendar router.
- [x] **M6 (Pillar C):** `expo-sqlite` (`R*Tree`, `FTS5`, `SQLCipher`), `user_vault.db` + `ATTACH DATABASE`, non-destructive `AsyncStorage` migration, Python offline city compiler (`recife_public.db` + `.db.zst` + `.pmtiles` + `publication_manifest.json`), MapLibre editorial cartography, Layer 0 / 1 / 2 multi-city adapters.
- [ ] **M7 (Supreme UX Mandate):** 3-layer zero-jargon `pt-BR` citizen cards across `IND-01..IND-10`, invisible dominance filtering (zero "Pareto" / "0-100 score"), clean `A × B` finalist duel, Household Convergence Mode, 10-Year Buy vs Rent TCO Simulator, Live Solar/Breeze Visit Compass, Shareable Evidence Summary.
- [ ] **M8 (Unbounded Hyper-Refinement):** 4 end-to-end citizen persona test suites, `fast-check` property-based math suites, <16ms 60fps SQLite/derive benchmarks + pipeline dead-code pruning, WCAG AA contrast + 48dp touch targets + corrupted input fuzzing.

## 4. Autonomous Architectural Decisions & Notes
- `node:sqlite` (`DatabaseSync` on Node `v22.23.3`) + Python `sqlite3` (`ENABLE_RTREE` + `ENABLE_FTS5`) enable full real-SQLite spatial and FTS5 test parity without native emulator blockers.
- Dual key identification (`DSQFL` + `CNM`) and 3 absence states will be surfaced cleanly in Layer 3 drawers while Layer 1 stays crisp 1-sentence `pt-BR` citizen impact.

## 5. Immediate Next Target
Milestone 3: `IND-01/#37` SPU Marine Lands & FGTS engine, `IND-02/IND-09/#42` Prédios-Caixão + NBR 15575-1:2025 + NBR 6118 + Law PE 13.032/06 + Tenancy Law, `IND-07/#40` NBR 14653-2 ITBI econometrics + Repeat-Sales + Recife closing tax optimizer.
