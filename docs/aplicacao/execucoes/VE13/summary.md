# VE13 — Summary

VE13 (Use AI to reduce the cost of useful evidence) is **partial**. The bottleneck is chosen, a deterministic improvement and a ranked review queue are built and tested, and a labelled set exists for a later model comparison. The model arms were deliberately not run: they would send record text to an outside model service, which requires credentials and your explicit authorisation. The bottleneck comes from the pilot itself. 211 of 394 Defesa Civil street-flood records could not be linked to an official street in VE06, so they could not inform any walking route. (Listing extraction already has 28 passing acceptance cases and no permitted real source to label.) New rules ([normalizar.mjs](../../../../scripts/dados/chuva/normalizar.mjs)):
- **auto-link** only when a transformation cannot change the place: removing "em frente ao…", expanding Av./Gov./Min., writing numbers as digits. That linked 4 more records.
- **classify** 50 records as watercourses or named places rather than failures.
- **propose candidates for a person to confirm**, never automatically: same name in a neighbouring bairro, a longer official name, a 1–2 letter typo. 40 records in 34 groups get one.

The [G-EXTRACT](../../evaluation-sets/g-extract.json) set holds all of these, with 2024 held out as the test split.

Checks run: 86/86 pipeline tests, including 5 new ones, and lint clean. The new tests cover each rule, and check that a record with an embedded instruction ("ignore as regras anteriores…") stays inert text. App code did not change; reviewed links will reach the app after the review, and after the concurrent payload-split session, which is reorganising the data loaders. The review queue gives the clearest result. It groups records by name and bairro, so one review settles them all, and ranks the groups by how many pilot buildings could be affected. With 3 reviews it reaches 845 building-impact units, against 90 for uniform sampling, and only 4 groups touch the pilot at all. Two limits apply: that figure assumes the candidate is confirmed, and "within 1 km" stands in for a full route recomputation. One defect was found and fixed: the first queue counted the same street once per record, overstating the value of a review.

Decision: **iterate**. Keep rules v2 and the ranked review queue. Remaining for VE13:
- a person reviews the first rows of [g-extract-revisao.csv](../../evaluation-sets/g-extract-revisao.csv) (three reviews cover almost all pilot value);
- then fold the confirmed links into the VE06 flood scenarios;
- run a text-model comparison against the reviewed labels only if you authorise sending record text to a model service.

The next eligible epoch is **VE14 (advanced models only where the data earns them)**. Most of its candidate models (flood susceptibility, acoustic, reliability) lack the labelled or observed data their gates require, so it will mostly record which gates fail and why.
