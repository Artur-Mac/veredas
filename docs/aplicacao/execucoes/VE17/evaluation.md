# VE17 — Evaluation

**State:** partial · **Outcome:** programme closed with a measured roadmap; customer value unmeasured · Applications: A29, A39; disposition of A01–A40.

## VE17.01 — Coverage and outcome audit

[auditoria.md](auditoria.md) gives every application an individual destination, evidence link and trigger:

| Destination | Count |
|---|---|
| implemented / verified (engineering) | 6 |
| experiment passed | 1 (A38) |
| experiment rejected | 2 (A15, A30) |
| partial | 20 |
| deferred with trigger | 9 |
| retained | 2 |

The grouped tracker rows (A01–A03, A12–A13, A34–A36) are now split. All 217 papers have a row in [pesquisa-destinos.csv](pesquisa-destinos.csv), across 19 merged families; 43 *Reference* papers are retained as reference. The discovery-only queue (180 rows) stays a queue under its retrieval rule.

## VE17.02 — Longitudinal evidence (two publication and evaluation cycles)

| Measure | Evidence | Value |
|---|---|---|
| Corrected reusable links | `scripts/dados/rede/correcoes.json` | **0** human-reviewed corrections. Automatic fixes did land between cycles: the "Março" reader fix (+2,154 street-attached Defesa Civil records), outreach split from attendances (18,820 = 41%), and VE13 rules v2 (+4 auto links, 50 non-street) |
| Independent event histories | VE06 ledger | 1,645 records → 763 observations → 31 episodes; the 2022–23 history found 8 of the 17 streets that flooded in 2024 within its top 50 (VE14) |
| Deduplicated offer histories | — | **0**: no permitted offer source; personal notebook history only |
| Changes that altered a comparison | VE16 c1–c11; VE09 index versions | Data refreshes changed **0** pilot buildings. Index corrections changed dossier text (Rua Salgueiro attendances 15 → 730 → 14) but not a measured comparison |
| Returning use, user-reported decisions | — | **Not measurable.** No participants, and no telemetry by design: private routines stay on the device |
| Review cost | VE16 | **0 minutes**; 259 rows waiting |

Data-side change is measured between cycles; customer-side change is not. A39 stays partial.

## VE17.03 — Data-advantage ("moat") assessment

Method: for every building in the six covered areas (2,825), count the per-building blocks the app shows. Each block type is one of two kinds:
- **Single lookup:** the cadastral and fiscal facts, one source, copyable by anyone with the Prefeitura APIs.
- **Maintained cross-source links:** walking essentials (entrance link × network × OSM/municipal places), routine by hour (× GTFS), night return (× lamps/156/CTTU), and the rain consequence (× Defesa Civil ledger linked to the network).

"Shown" is not "valued by a person"; that needs G-USER.

| Measure | Value |
|---|---|
| Buildings with ≥1 maintained-link block | 2,643 / 2,825 (93.6%) — the strong entrance links |
| Share of per-building blocks that depend on maintained links (mean over buildings) | **70.5%** |
| Blocks per building from links | essentials 2,643 · routine 2,643 · night 2,643 · rain 214 (incl. own-street notes) |
| Reuse of one linked record (rain) | 4 linked records drive all 173 route consequences: 147, 25, 25 and 1 buildings |
| Does a correction improve many homes? | Yes by construction: one rain-record correction reaches up to 147 dossiers; VE13's ranked queue: 3 reviews ≈ 845 vs 90 building-impact units. **Not yet observed**: 0 corrections made |
| Does the advantage persist later in time? | Recurrence from 2022–23 still ranked 2024 streets better than terrain/water models (VE14) |
| Does it persist in a new area? | Torre reached 92.7% strong links (pilot 93.6%) with the same contracts and pipelines, and the held-out transit set passed 12/12 (VE16) |

Most of what the app shows per building cannot be copied from one public lookup: it exists because entrances, the walking network, places, timetables and event records are kept linked and versioned. The same concentration is a risk. The rain block for 173 homes rests on 4 unreviewed links, so they lead the review budget ([NEXT-PROGRAMME.md](../../NEXT-PROGRAMME.md), H1).

## VE17.04 — Next programme

[NEXT-PROGRAMME.md](../../NEXT-PROGRAMME.md) sets out the decisions, the budget and the hypotheses.
- **Keep:** the core and its operations.
- **Merge:** A12/A13 into A11, and A23–A25 into "Para decidir".
- **Simplify:** the rain block to reviewed links only, and the cycle cache to per-step fingerprints.
- **Expand:** no new area until review cost is known.
- **Stop:** A15, A30, A21/A31.
- **Budget:** R$ 0 money, 6 timed review hours, 5 participant sessions, 2 devices.
- **Hypotheses:** three, each with a stop rule (rain links, decision help, review cost per row).

## Owners and update policy

[FEATURE-REGISTER.md](../../FEATURE-REGISTER.md) lists every enabled feature with its data, update policy (cycle, index, user, on demand) and owner role. Owners are roles (product, data, platform); no person is named because none has been assigned.

## Acceptance

| Criterion | Met? |
|---|---|
| Every A01–A40 item has a documented destination | **yes** — 40 individual rows with evidence and trigger |
| Every VE epoch has an honest outcome/status | **yes** — tracker: VE00–VE02 and VE14 verified; VE03–VE13, VE15, VE16 partial; VE17 partial |
| All enabled features have an owner and update policy | **partly** — every feature has a role and policy; no person is assigned to any role |
| Next roadmap grounded in measured customer/data/operating evidence | **partly** — data and operating evidence measured; customer evidence absent, so the roadmap's first job is to get it |
| May conclude a simple deterministic feature beats a complex model | **yes** — recurrence over the flood model (A30); no model in the product |

VE17 is **partial**. The audit, measurements and roadmap are complete. Two pieces of evidence the plan expects cannot be produced inside this work: customer outcomes and assigned people. The roadmap makes producing them its first step instead of hiding the gap.
