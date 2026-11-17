# VE12 — Evaluation record

## Objective and scope

Integrate and evaluate the five-neighbourhood pilot (plan §7, VE12; A01–A26 as applicable). This record keeps engineering acceptance, customer validation and platform verification separate, as the plan requires.

| Part | State |
|---|---|
| VE12.01 End-to-end acceptance | done (engineering) |
| VE12.02 Usability round (G-USER) | **not run**: no participants |
| VE12.03 Product and performance | measured on desktop; the largest engineering problem is identified, not fixed |
| VE12.04 Pilot decision | done (below) |

**The pilot is not validated.** The product evaluation with participants was not performed.

## VE12.01 — End-to-end acceptance

**Setup.** [ve12-piloto.mjs](scripts/ve12-piloto.mjs) runs Expo web at 375 × 812 in isolated contexts, with external requests blocked.
- **Homes:** in each area, four saved homes on real strong-link buildings, chosen by SHA-256 order:
  - a rent pair, one complete listing and one with the condo fee missing and IPTU without a period;
  - a purchase pair, one with annual IPTU and one with IPTU unknown.
- **Later update:** one home per area carries a snapshot built from the older published index (5bad409c) with a different condo fee.
- **Profile destination:** centro do bairro Recife.
- **What it opens:** all 20 dossiers (Destaques, Entorno, Edifício) and all 10 comparisons (summary and Rotina tab).
- **Checked on every screen:** no NaN/undefined/Infinity/[object; no horizontal overflow; no page errors; no external requests.

**Result: 0 page errors, 0 external requests, 0 invariant violations** ([piloto.json](piloto.json)).

**Capability presence** (count of the 4 homes per area):

| Area | Findings | Memory block | Change since saved | Negotiation | Daily essentials | If the street floods | Night walk | Sun on façades | Noise side |
|---|---|---|---|---|---|---|---|---|---|
| Boa Viagem | 4 | 4 | 1/1 | 4 | 4 | 1 | 4 | 2 | 4 |
| Casa Forte | 4 | 4 | 1/1 | 4 | 4 | 0 | 4 | 4 | 1 |
| Graças | 4 | 4 | 1/1 | 4 | 4 | 0 | 4 | 4 | 2 |
| Espinheiro | 4 | 4 | 1/1 | 4 | 4 | 1 | 4 | 3 | 2 |
| Madalena | 4 | 4 | 1/1 | 4 | 4 | 0 | 4 | 3 | 4 |

The blocks that appear conditionally are absent for documented reasons:

| Block | Shown only when |
|---|---|
| Flood | A material flood consequence exists (VE06) |
| Sun on façades | The building has a validated cadastral volume with a height (VE07) |
| Noise side | A main road is within 80 m or a valid LUSE venue within 150 m (VE08) |

**Comparisons:**

| Check | Result |
|---|---|
| Summary ("Para decidir") | 10/10 |
| Rotina tab and monthly difference | 10/10 |
| "Onde mais procurar" | 10/10 |
| "Custo × tempo" | 5/5 rent pairs; rent only by design (D035) |

**Backup and restore.** [piloto-integridade.test.ts](../../../../tests/piloto-integridade.test.ts) runs an export → restore round trip that preserves the VE09 snapshot, positioned destinations and the visit questions added by VE07 and VE08. A notebook from before these epochs restores identically, and a malformed snapshot is rejected rather than half-saved.

**Offline.** No screen makes an external request; all data ships in the bundle. True offline reopen without the origin server was not tested on web (there is no service worker).

**Test-fixture error.** One of my fixtures lacked the IPTU `periodo` field. The app's per-item validation then left that analysis out of the list, so the dossier showed "Nenhum dossiê aberto". The fixture was fixed. This is existing, intended validation behaviour, but the person gets no visible notice that an analysis was skipped; that is worth a later UX review.

## VE12.03 — Product and performance

| Measure | Value (desktop) |
|---|---|
| Time to dossier tabs (dev server) | median 969 ms; first open per area ≈ 1.4–1.8 s |
| Compare → Rotina complete, both homes, 4 scenarios, last return and decision section | median 2.1 s (1.9–2.6 s) |
| Production web build (`expo export`) | **one 30.1 MB JS bundle, 7.4 MB gzipped** |
| Data inside the bundle | 28.4 MB: solar cut-outs 15.4, municipal index 7.5, timetable 3.2, essentials 1.1, other 1.2 |
| Startup to usable Início, production build served locally | median 712 ms at CPU 1×; 1,969 ms at CPU 4× (DevTools throttling, not a device) |
| JS heap after start | 45 MB (per-area data is evaluated only when used) |

**Largest engineering problem: payload.** The per-area loaders (`() => require(...)`) avoid evaluating data but not downloading it. Every visitor downloads 7.4 MB gzipped, including all five areas' solar cut-outs.
- **Before VE04:** about 20 MB (index plus four solar areas).
- **Added in VE04–VE11:** about 8 MB (Madalena solar 3.4, timetable 3.2, essentials 1.1, other layers).
- **Decision:** *improve*. Move area and layer data out of the JS bundle into separately fetched or cached assets on web (with a service worker for offline), and keep bundled assets on native. Then re-measure on a real low-end phone (D009).
- **Why not fixed in this epoch:** it changes offline semantics and the native asset path, which needs its own design and test.

**Not measured:** native device latency and memory; larger text; keyboard-only beyond the existing smoke test; publication refresh cost on a real schedule.

## VE12.04 — Pilot decision

| Capability | Areas | Decision | Why / dependency |
|---|---|---|---|
| Compare summary with decisive question (A01) | 5/5 | keep | Verified in VE01; present in all 10 comparisons |
| Dossier navigation, main layout only (D027) | all | keep | Legacy examples hidden from the journey |
| Daily essentials on foot (VE04, A06–A08) | 5/5 | keep / improve | G-POI review; OSM completeness unmeasured |
| Rotina by hour (VE05, A10) | 5/5 | keep / improve | G-TRANSIT human review; phone timing; brief integration |
| Corrected corridor signal (VE05, D026) | all | keep | — |
| If the street floods (VE06, A11) | shown where material (2/20 here) | keep / improve | G-RAIN review; name matching; long-road overstatement |
| Sun on façades (VE07, A14) | 16/20 | keep / improve | Façade observations; annex heights |
| Shaded walk (VE07, A15) | — | stop for now | Benefit below canopy uncertainty (D030) |
| Night walk (VE08, A16) | 20/20 | keep / improve | Observation sheet; crossing review |
| Noise side (VE08, A17) | 13/20 | keep | Airport pending a verified plan |
| Changes since saved (VE09, A18) | 5/5 tested | keep / improve | Show in Compare; licence state history |
| Negotiation preparation (VE10, A22) | 20/20 | keep | — |
| External price ranges (VE10, A21) | — | stop for now | No permitted offer source |
| Decision aids (VE11, A23–A25) | 10/10 | keep / improve | Structured visit answers (VE11.04); paired study |
| Payload / bundle | all | **improve (top engineering task)** | See VE12.03 |

**Coverage envelope.**
- Walking, essentials, night, flood and timetable features cover the five pilot areas only, for strong-link buildings (2,516 buildings).
- Weak-link buildings get straight-line facts and no walking claims.
- The rest of Recife keeps the municipal-index dossier without these layers.
- Nothing claims citywide coverage.

**Unresolved dependencies:**
- **Human review:** the VE03 sheets, G-POI, G-TRANSIT and G-RAIN.
- **Field observations:** G-SHADE, façades and the evening/noise sheet.
- **Participants:** G-USER.
- **Devices:** a native device and a low-end phone.
- **Data:** a permitted offer source.
- **App work:** structured visit answers, and the payload split.

**Effort forecast** (engineering only, rough):
- payload split and offline cache: 2–3 sessions;
- Compare integration of VE05/VE09 results and VE11.04 structured answers: 1–2 sessions;
- review tooling for the human sheets: 1 session.

Participant and field work depend on people and are not estimated here.

## Checks actually run

```
POC_URL=… node docs/aplicacao/execucoes/VE12/scripts/ve12-piloto.mjs   # 5 areas, 20 dossiers, 10 comparisons
npx expo export --platform web   # bundle measurement
URL=… node docs/aplicacao/execucoes/VE12/scripts/ve12-inicio.mjs   # startup, CPU 1× and 4×
npm run typecheck && npm run lint && npx jest --runInBand   # 0; 0 errors / 5 pre-existing warnings; 65/65 suites, 1553/1553
node --test (pipeline suites)   # 81/81
POC_URL=… SMOKE_OUT=out/ve12/v1-smoke node scripts/v1-smoke.mjs   # 50/50
```

## Outcome

**State: partial.** Engineering acceptance of the core journey passes in all five areas with zero invariant violations, and a decision table and coverage map exist. Customer validation and device verification were not performed, so the pilot is not validated. **Outcome: iterate.** Top engineering task: the payload split.
