# VE17.01 — Coverage and outcome audit

Every application ID and every research family has a destination below, with the report that supports it. Destinations use the plan's vocabulary:
- **implemented / verified**
- **experiment passed**
- **experiment rejected**
- **partial**
- **deferred with trigger**
- **retained as reference**

"Verified" means the engineering acceptance was met. No customer outcome is verified anywhere in the programme: no participant session (G-USER) and no device test has been run.

## Applications A01–A40

| ID | Application | Destination | Evidence | Trigger / what is missing |
|---|---|---|---|---|
| A01 | Decision brief: why visit A before B | implemented / verified (engineering) | [VE01](../VE01/evaluation.md): G-COMPARE 20/20 | G-USER paired task |
| A02 | Monthly cost and time trade-off | implemented / verified (engineering) | [VE01](../VE01/evaluation.md), [VE11](../VE11/evaluation.md) (price per hour saved) | G-USER |
| A03 | The one question worth asking next | implemented / verified (engineering) | [VE01](../VE01/evaluation.md), [VE15](../VE15/evaluation.md) (answer recomputes the order, 4/4 rendered) | G-USER timing vs "Ajustar valores" |
| A04 | Structured evidence compiler | implemented / verified | [VE01](../VE01/evaluation.md), [VE02](../VE02/evaluation.md) | — |
| A05 | Historical place identity | partial | [VE03](../VE03/evaluation.md), [VE16](../VE16/evaluation.md): strong links 93.6% pilot / 92.7% Torre; OSM-address proxy 310/315 and 10/10 | 0 reviewed corrections; work G-BUILDING (50 rows) |
| A06 | Essentials within a real walk | partial | [VE04](../VE04/evaluation.md): 2,643 buildings | G-POI review (44 rows) |
| A07 | A genuinely independent plan B | partial | [VE04](../VE04/evaluation.md) (bridge-avoiding plan B), [VE06](../VE06/evaluation.md) | G-POI, G-RAIN review |
| A08 | Errands in one trip | partial | [VE04](../VE04/evaluation.md) | Opening hours not interpreted; needs a dated hours source |
| A09 | Less difficult walking | partial (engine only) | [VE03](../VE03/evaluation.md) (no-steps / fewer-major-roads scenarios; crossings counted) | Verified sidewalk/kerb/step data before any step-free claim |
| A10 | Weekday, weekend, late return | implemented (engineering verified) | [VE05](../VE05/evaluation.md) G-TRANSIT 20/20; [VE16](../VE16/evaluation.md) held-out G-TRANSIT-TORRE 12/12 | Reliability (observed delays) — X09 deferred |
| A11 | Rain-aware access history | partial | [VE06](../VE06/evaluation.md); VE17: all 173 consequences come from 4 linked records (one drives 147 dossiers) | Review those 4 links first (G-RAIN); hide the block if they fail |
| A12 | Drainage recurrence and intervention history | deferred with trigger | [VE06](../VE06/evaluation.md) episodes; [VE14](../VE14/evaluation.md) recurrence kept as review priority | A dated drainage-works / repair source |
| A13 | Service access under disruption | partial (merged into A11) | [VE06](../VE06/evaluation.md): consequence + alternative for essentials | Same as A11 |
| A14 | Façade and room solar comparison | partial | [VE07](../VE07/evaluation.md), Torre added in [VE16](../VE16/evaluation.md) | G-SHADE field observations (80 rows) |
| A15 | Shade for an actual walk | experiment rejected | [VE07](../VE07/evaluation.md): benefit 1–3.6 min in 6/80 cases, below canopy uncertainty | Canopy data + G-SHADE observations |
| A16 | Evening route context | partial | [VE08](../VE08/evaluation.md); Torre 127/127 in [VE16](../VE16/evaluation.md) | Night observations (15 rows); hourly activity source |
| A17 | Quiet-side visit planning | partial | [VE08](../VE08/evaluation.md) | Airport contours georeferenced; calibrated sound (A33) |
| A18 | Changes since saving | partial | [VE09](../VE09/evaluation.md) (dossier only) | Changes in Compare; participants |
| A19 | Construction and view-change watch | deferred with trigger | [VE09](../VE09/evaluation.md): licence state only | Licence-history source (filed/approved/expired/active/completed) |
| A20 | Effective offer history | partial (personal history only) | [VE10](../VE10/evaluation.md) | Permitted cross-portal offer source |
| A21 | Comparable offer ranges | deferred with trigger | [VE10](../VE10/evaluation.md), [VE14](../VE14/evaluation.md) | Permitted, dated, deduplicated offer feed |
| A22 | Evidence-based negotiation preparation | partial | [VE10](../VE10/evaluation.md) (the app suggests no value) | G-USER |
| A23 | Where else to search | partial | [VE11](../VE11/evaluation.md); +13 Torre streets in [VE16](../VE16/evaluation.md) | Prices/listings not covered by design |
| A24 | Household compromise | partial | [VE11](../VE11/evaluation.md) (non-dominated check) | Strict constraints; G-USER |
| A25 | Decision stability | partial | [VE11](../VE11/evaluation.md) (threshold that flips the choice) | G-USER |
| A26 | Visit that answers the decision | partial | [VE15](../VE15/evaluation.md) | Visit-screen answers structured; G-USER |
| A27 | Audited street-image extraction | deferred with trigger | [VE13](../VE13/evaluation.md) | Licensed dated imagery and authorisation to send data to a model service |
| A28 | Listing-text and image enrichment | deferred with trigger | [VE13](../VE13/evaluation.md): 28 synthetic cases pass | Permitted real listing source to label |
| A29 | Active review allocation | partial | [VE13](../VE13/evaluation.md) queue; VE17 reuse measurement (4 records → 173 dossiers) | First timed review (0 minutes so far) |
| A30 | Flood susceptibility research | experiment rejected | [VE14](../VE14/evaluation.md): logistic 7/50 vs recurrence 8/50 | New labelled seasons; drainage/tide data |
| A31 | Local valuation research | deferred with trigger | [VE14](../VE14/evaluation.md) | Permitted offer labels |
| A32 | Heat, wind, ventilation research | deferred with trigger | [VE14](../VE14/evaluation.md) | Local air/humidity/wind observations |
| A33 | Air and acoustic exposure research | deferred with trigger | [VE14](../VE14/evaluation.md) | Calibrated co-located instruments |
| A34 | Optional building/document intelligence | partial (existing flow kept) | [VE15 inventory](../VE15/inventario.md) | Real building documents with exact pages (VE15.02) |
| A35 | Optional field instruments | retained (existing feature) | [VE15 inventory](../VE15/inventario.md) | Calibration before any quantitative claim |
| A36 | Opt-in shared corrections | deferred with trigger | [VE15 inventory](../VE15/inventario.md) | Demonstrated need + opt-in, review, deletion design |
| A37 | Resilient ingestion | implemented / verified (operations) | [VE02](../VE02/evaluation.md), [VE16](../VE16/evaluation.md): two byte-identical cycles, rollback | Review minutes per row |
| A38 | Neighbourhood expansion | experiment passed (one area) | [VE16](../VE16/evaluation.md): Torre, held-out 12/12, pilot unchanged | Next area only after review cost is measured |
| A39 | Longitudinal product learning | partial | [VE17](evaluation.md): data-side measures (cycles, reuse, links); customer side not measurable | G-USER; no telemetry exists by design |
| A40 | Optional local context queue | retained at supported scale / research tasks | [VE15.04](../VE15/inventario.md) | Address-level sources for connectivity; separate universe for auctions |

**Totals:**

| Destination | Count | IDs |
|---|---|---|
| implemented / verified | 6 | A01–A04, A10, A37 (engineering acceptance; no customer outcome) |
| experiment passed | 1 | A38 |
| experiment rejected | 2 | A15, A30 |
| partial | 20 | A05–A09, A11, A13, A14, A16–A18, A20, A22–A26, A29, A34, A39 |
| deferred with trigger | 9 | A12, A19, A21, A27, A28, A31–A33, A36 |
| retained | 2 | A35, A40 |
| **total** | **40** | |

A13 counts as partial because it is merged into A11. A09's step-free claims stay deferred inside a partial row.

## Research families (R001–R217)

Each of the 217 papers has its own row in [pesquisa-destinos.csv](pesquisa-destinos.csv): id, plan label, kind, family, destination, applications and evidence epochs. Papers of kind *Reference* are "retained as reference". *Apply* and *Experiment* papers take their family's destination. No paper was dropped because its approach was inconvenient; papers whose method waits for data stay "deferred with trigger".

| Family (plan labels merged) | Papers | Apply / Experiment / Reference | Destination | Evidence |
|---|---|---|---|---|
| Offer comparables | 44 | 13 / 30 / 1 | deferred with trigger | VE10, VE14 — no permitted offer feed; personal history applied |
| Offers and multimodal attributes | 10 | 0 / 10 / 0 | deferred with trigger | VE13 — no licensed imagery, no model authorisation |
| Rain access, context and history | 37 | 11 / 18 / 8 | partial / experiment rejected | VE06 replay; VE14 X04 model rejected |
| Street conditions | 23 | 6 / 13 / 4 | partial / deferred | VE03, VE08 — no sidewalk/kerb data |
| Shade and heat | 24 | 11 / 13 / 0 | partial / rejected / deferred | VE07 façades; A15 rejected; A32 deferred |
| Entity identity | 18 | 13 / 3 / 2 | partial | VE03, VE16 — links unreviewed |
| Ingestion and source discovery | 13 | 4 / 0 / 9 | implemented / verified | VE02, VE16 |
| Fiscal context | 11 | 0 / 0 / 11 | retained as reference | VE01, VE10 |
| Noise | 12 | 1 / 10 / 1 | partial / deferred | VE08; A33 |
| Air quality | 7 | 0 / 3 / 4 | deferred with trigger | VE14 |
| Transit and mobility methods | 6 | 4 / 1 / 1 | implemented (engineering) | VE05, VE16 |
| Destinations, street graph | 2 | 2 / 0 / 0 | partial / implemented | VE03, VE04 |
| Street activity | 3 | 1 / 2 / 0 | partial / deferred | VE08 |
| Urban change | 2 | 0 / 2 / 0 | deferred with trigger | VE09 |
| Evaluation methods | 2 | 0 / 0 / 2 | applied | VE00, VE12, VE14 |
| Decision and cost; evidence history; optional capture | 3 | 2 / 1 / 0 | implemented; partial; retained | VE01, VE09, VE15 |

The **discovery-only queue** is retained as a queue. It has 180 metadata rows (172 distinct URLs) from nine queries, outside the 217-PDF corpus. The rule stays: a candidate becomes evidence only after its primary full text is retrieved, verified and given a new R-ID.

## Epoch states

Every VE00–VE17 epoch has a state and outcome in the [tracker](../../EPOCH-TRACKER.md):
- **verified:** 4 epochs (VE00–VE02, VE14).
- **partial:** 13 epochs (VE03–VE13, VE15, VE16).
- **VE17:** see its own record.
