# VE14 — Pre-registration (written 2026-11-14, before any result was computed)

## X04 Flood susceptibility (A30) — the only family with usable local labels

- **Customer question.** Which streets should a reviewer check first for flood-related access problems before the next rainy season? The output is a ranked list for review. It is not a warning, not a probability shown to people, and not a "dry" label for anything.
- **Unit.** Official street (`CLOGRACODI`) in Recife, with at least 50 m of official segments.
- **Labels.** A street is *positive* in a period if it has at least one Defesa Civil "Alagamentos" observation linked to it (VE06 ledger, publication `chuva`). Every other street is **unlabelled, not negative**: absence of a record is not evidence of a dry street.
- **Features**, all computed only from data dated before the period being predicted:
  1. flood records on the street in earlier periods, including year-only 2014–2019 rows;
  2. distance from the street to the nearest official water polygon (`recursos-hidricos.geojson`);
  3. mean surface height along the street (Copernicus GLO-30 DSM, ≈150 m grid). This is a surface model, not bare terrain, and has no local datum check;
  4. 156 drainage requests (DRENAGEM/MACRODRENAGEM) within 50 m, dated before the period. The 156 extract over-represents recent requests, so this is a biased count.
- **Splits.**
  - *Temporal / whole-storm (primary).* Features before 2024-01-01; test labels are all 2024 observations, which covers every 2024 storm. The model is trained on 2022–2023 labels with features before 2022-01-01.
  - *Spatial (secondary).* Within the 2024 test, streets are split by a SHA-256 hash of their bairro into two halves. The model is trained on half A's 2022–2023 labels and scored on half B's 2024 labels, then the reverse.
- **Rankers compared.**

  | Ranker | Order |
  |---|---|
  | B1 past records | most first |
  | B2 water distance | nearest first |
  | B3 surface height | lowest first |
  | B4 drainage requests | most first |
  | M1 logistic regression on standardised features 1–4 | L2 = 1.0, 2,000 gradient steps, fixed initialisation |

  Gradient-boosted trees were **not run**: no library is installed, and adding a dependency was out of scope.
- **Primary metric.** Precision@50 and recall@50 on 2024 positive streets, plus precision@20 and precision@100 as secondary.
- **Gate (fixed now).** M1 is promoted over the best single baseline only if **both** of these hold:
  1. on the temporal test, its precision@50 exceeds the best baseline's by at least 10% relative **and** by at least 2 more positive streets;
  2. on the spatial check, it is not worse than that baseline in either half.

  Otherwise M1 is **rejected** and the best simple baseline is kept as the review-priority rule. Even a promoted model would not reach the app in this epoch: the product ablation (VE14.03) needs a decision-utility test.
- **Cost ceiling.** One CPU run under 5 minutes, no paid services.
- **Failure rule.** If fewer than 15 positive streets exist in the 2024 test, the comparison is reported as *underpowered*, and no adoption or rejection beyond "defer" is made.

## Families without usable labels: not tested

| Family | Customer question | What would unlock it |
|---|---|---|
| Offer valuation / uncertainty (X10, A31) | Is this asking price high for comparable units? | A permitted, dated, deduplicated offer source with distinct units, at least 20 per stratum (VE10 D034) |
| Market trends / repeat sales (X12) | Are asks in this area rising? | The same source over time; true paired closings for repeat sales |
| Heat / ventilation / greenery (X07, A32) | Which home or side is hotter or better ventilated? | Local air temperature, humidity, wind and radiant observations on held-out streets and hours; never Landsat surface temperature as air or room temperature |
| Noise / air exposure (X05–X06, A33) | How loud or polluted is the façade? | Calibrated, co-located instruments with repeated time windows; station coverage that resolves street differences |
| Transit reliability (X09, A10) | How late are buses in practice? | Authorised vehicle (AVL/GTFS-RT) observations with history; none found on 2026-11-14 (VE05.04) |
| Post-repair learning (X18, A12) | Did a drainage repair reduce flooding? | Linked repair dates, repeated comparable rainfall exposure and a control design; only a chronology can be shown now |

For each of these the simpler feature already in the product stays: scheduled times, direct-sun hours, source and time context, the dated ledger.
