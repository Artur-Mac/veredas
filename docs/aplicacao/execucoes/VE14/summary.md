# VE14 — Summary

VE14 (Advanced models only where the data earns them) is **verified** in the plan's sense: every advanced model family now has a recorded decision, and none is adopted. Before any run, a [pre-registration](preregistro.md) was written and hashed. For each of seven families it states the customer question, labels, splits, baselines, metric, cost ceiling and failure rule. Six families have no usable local labels and are **deferred**, each naming what would unlock it:
- **offer valuation and market trends:** a permitted offer source;
- **heat and ventilation:** local air, humidity and wind observations;
- **noise and air exposure:** calibrated instruments;
- **transit reliability:** authorised vehicle data;
- **learning from drainage repairs:** a control design.

Flood susceptibility was the one testable family. It ranked 9,037 official streets by how likely they were to get a Defesa Civil street-flood record, holding out every 2024 storm. The rankers compared were:
- a street's earlier flood records;
- distance to water;
- surface height;
- drainage requests;
- a small logistic regression combining all four.

Checks: the pre-registration was hashed before the run, and the run is reproducible from versioned inputs (46 s, 0.3 GB, no paid services, no app changes). On the 17 streets flooded in 2024, earlier records on the same street found 8 in its top 50. The regression found 7, and distance to water, surface height and drainage requests found none. The spatial check, across halves of the bairros, did not favour the model either. Under the pre-registered gate the model is **rejected**, and "check streets with earlier records first" stays as the review-priority rule. That rule can also feed the VE13 review queue. The caveats are recorded:
- there were only 14 training positives;
- the elevation grid is a ~150 m surface model that includes buildings;
- the drainage-request extract is biased towards recent years;
- the labels carry reporting bias and miss the 211 unlinked records.

Gradient-boosted trees were not run because no library is installed.

Decision: **reject or defer every advanced model; keep the simple features already in the product** (dated ledger, scheduled journeys, direct sun by side, source and time context, personal comparables). No predictive output or composite "quality of life" score is shown anywhere. Revisiting flood susceptibility would need a bare-terrain model with a datum, drainage and rain/tide series, and more labelled storms. The next eligible epoch is **VE15 (optional enrichment without burdening the core)**: optional captures and building documents, measured by whether one capture resolves a decision-critical unknown.
