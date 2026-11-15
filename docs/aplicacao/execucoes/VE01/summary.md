# VE01 — Summary

VE01 (Useful comparison) is **verified** for its recorded web scope; customer validation is pending. The existing Compare screen showed costs side by side but never said which home to look at first or what could change that. It now opens with a "Para decidir" brief built on a single new decision layer, [`src/dados/decisao.ts`](../../../../src/dados/decisao.ts). The brief uses the same `custoMensal` figures as the dossier and cards, so the two screens cannot disagree. Unknown charges are never treated as zero: each is a range, and an IPTU with a value but no stated period runs from that value divided by 12 up to the value itself. The brief ([Decisao.tsx](../../../../src/componentes/comparar/Decisao.tsx)) contains:
- a "Menor custo / Mais espaço" switch that applies only on screen and stores nothing;
- one headline, such as "Visite primeiro Espinheiro, se o custo pesa mais agora", plus one line on what you give up;
- at most three material differences, each with a short source note;
- the missing fact that could reverse the order, with its threshold, written as an editable question you can copy or add to that home's visit plan through the existing notebook path (no schema change);
- for purchases, the number of months after which higher monthly fees cancel out a lower price (no interest assumed);
- an optional calculator for the price of each hour saved, using minutes the person types in. Travel time is never derived from air distance.

I reused the cost function, the Compare screen, the visit-question storage and the VE00 evaluation set. As an interim fix for VE00 issue I01, I also removed the inflated "paradas diárias no GTFS" figure from the dossier's noise card.

**Checks run:**
- Typecheck: clean.
- Lint: no new warnings.
- Jest: 54/54 suites, 1,450 tests, 36 of them new: [decisao.test.ts](../../../../tests/decisao.test.ts) plus two screen tests.
- v1 web smoke: 50/50 audited steps.
- [Rendered check](scripts/ve01-compare-render.mjs) on six G-COMPARE pairs using real buildings.

The 20 G-COMPARE cases were labelled by hand before the code first ran ([labels](../../evaluation-sets/g-compare-labels-v1.1.json)). On the first run 18 of 20 matched; both misses were labelling errors on ties, now corrected with the original values kept, so the result is 20/20. The cases cover annual-to-monthly IPTU, equal totals, declared zero versus unknown, unknown IPTU period, missing fees, unknown price, purchase horizons of 45, 60 and 250 months, swapping A and B, mixed rent/purchase, dossier parity and privacy. Tests and the rendered review found seven defects, all fixed before the run ended:
- a guaranteed minimum difference was stated as exact;
- 17.5 m² was rounded to 18 m²;
- a repeated sentence;
- an implausible fire-insurance question presented as decisive;
- two controls both named "Espaço";
- old panel text that contradicted the new recommendation;
- a lint violation.

At 360, 375 and 1,280 px there is no horizontal overflow. On a phone the recommendation is now visible on the first screen, ending 425–455 px down. The brief keeps working offline once loaded, and the time calculator shows "5h20 … R$ 33,75". Measured on a desktop development build, not a target device, opening Compare takes p95 801 ms over 30 runs and switching priority takes p95 64 ms. Not run: any study with real people, native devices, keyboard-only and large-text checks. All evidence is automated or my own review of rendered screens, with no field or participant data ([evaluation](evaluation.md), [measurements](measurements.json)).

Decision: **adopt**, with four items to iterate on:
- A question taken from Compare lands as item 13 of 13 in the visit plan, outside the three highlighted on the "Preparar" tab. This belongs to VE11/A26; the visit files hold your uncommitted edits, so I left them alone.
- When neither listing gives fire insurance, the "decisive" insurance questions can carry implausibly large thresholds. This needs observation with real users or a sourced reference value.
- Keyboard and large-text checks on the new controls.
- The G-USER study, which needs 8–12 people currently searching for a home.

The next eligible epoch is **VE02 (observation and publication pipeline)**. Its first concrete task, VE02.01, is to define `SourceSnapshot`, `Observation` and manifest fields mapped onto the existing contracts and the index builder. It should start with the Defesa Civil column-shift fixtures (VE00 issue I05) and the two-version GTFS problem (I08). VE02 needs no external dependency beyond the already public municipal sources.
