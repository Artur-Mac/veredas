# VE14 — Evaluation record

## Objective and scope

Give every advanced model family an explicit decision (adopt, revise, defer or reject), and use a model only where local data earns it (plan §7, VE14; A30–A33 and advanced A10/A21). The acceptance criterion is a reproducible result or a precise not-tested/dependency record for each family. It is not the validation of any model.

## VE14.01 — Pre-registration

[preregistro.md](preregistro.md) was written and hashed before any result was computed. The hash and timestamp are in [logs/preregistro.sha256](logs/preregistro.sha256). For each family it records the customer question, labels, splits, baselines, primary metric, cost ceiling and failure rule. Only one family, flood susceptibility (X04), has usable local labels. The other six record exactly what would unlock them.

## VE14.02 — X04 flood susceptibility

**Setup** ([suscetibilidade.mjs](../../../../scripts/dados/chuva/suscetibilidade.mjs); 46 s, 0.3 GB, no paid services):

| Element | Value |
|---|---|
| Unit | 9,037 official streets with 50 m or more of segments |
| Positives | Streets with a linked Defesa Civil "Alagamentos" observation (VE06): 14 in 2022–2023 (training), 17 in 2024 (test) |
| Unlabelled | Every other street, never treated as dry |
| Features | Past records; distance to water; mean surface height (GLO-30 DSM ≈150 m, a surface model); 156 drainage requests within 50 m dated before the period (8,141 requests in the extract) |
| Primary split | Temporal / whole-storm: every 2024 storm held out |
| Secondary split | Spatial, by SHA-256 halves of bairros |

**Temporal test, 2024** (17 positive streets):

| Ranker | p@20 | p@50 (hits) | p@100 | recall@50 |
|---|---|---|---|---|
| B1 past records on the street | 0.25 | **0.16 (8)** | 0.09 | 0.47 |
| B2 near water | 0 | 0 (0) | 0 | 0 |
| B3 low surface | 0 | 0 (0) | 0 | 0 |
| B4 drainage requests | 0 | 0 (0) | 0.01 | 0 |
| M1 logistic regression (all four) | 0.25 | 0.14 (7) | 0.09 | 0.41 |

**Spatial check.** M1 is not better than B1 in either direction. Train A, test B: M1 got 4 hits at 50 against B1's 6 on 10 positives. Train B, test A: M1 got 2 hits against B1's 3 on 7 positives.

**Gate decision.** M1 does not exceed B1 by at least 10% and 2 streets: it is lower. **M1 is rejected**, and **B1, recurrence, is kept** as the review-priority rule.

**Interpretation and caveats:**
- With 14 training positives, a learned combination has little to learn from.
- The surface model mixes buildings and terrain at about 150 m, which may explain B3's failure.
- The 156 extract over-represents recent requests, which weakens B4 for earlier periods.
- The labels are Defesa Civil attendances (reporting bias), and only street-linked ones count (VE06/VE13: 211 of 394 were unlinked).
- **Leakage check:** all features predate the predicted period; B1's strength comes from 8 of 17 positive streets recurring.

**Not run.** Gradient-boosted trees were not trained, because no library is installed.

## VE14.03 — Product ablation

Not applicable: no model won. Nothing was added to the app.

## VE14.04 — Portfolio disposition

| Family | Decision | What stays in the product | What would unlock it |
|---|---|---|---|
| X04 flood susceptibility (A30) | **reject** (tested) | Dated ledger and historical replay (VE06); recurrence as review priority (can feed the VE13 queue) | A bare-terrain model with a datum, a drainage network, rain/tide series, more labelled storms, reviewed negatives |
| X10 offer valuation (A31) | **defer** (not tested) | Personal comparables, negotiation facts (VE10) | A permitted, dated, deduplicated offer source |
| X12 trends / repeat sales | **defer** | — | Offer series; true paired closings |
| X07 heat / ventilation (A32) | **defer** | Direct sun by side (VE07) | Local air temperature, humidity, wind and radiant observations |
| X05–X06 noise / air (A33) | **defer** | Source and time context (VE08) | Calibrated, co-located instruments with repeated windows |
| X09 transit reliability (advanced A10) | **defer** | Scheduled journeys (VE05) | Authorised vehicle data (none found, VE05.04) |
| X18 post-repair learning (A12) | **defer** | Chronology | Repair dates, repeated rain exposure, a control design |

No generic "AI quality-of-life score" was introduced, and no predictive output is shown anywhere.

## Checks

```
sha256sum docs/aplicacao/execucoes/VE14/preregistro.md   # before the run
node scripts/dados/chuva/suscetibilidade.mjs --relatorio docs/aplicacao/execucoes/VE14/x04.json
```

No app code changed. The concurrent payload-split session is reorganising the data loaders, and VE14 did not touch them.

## Outcome

**State: verified.** VE14's acceptance is met: every family has a pre-registered result or a dependency record, and the single testable model was evaluated against its gate. **Outcome: reject/defer.** No model is adopted.
