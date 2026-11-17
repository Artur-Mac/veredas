# VEREDA — Supporting Experiment Cards

Version 1.0 · 14 November 2026. This appendix supplies detailed hypotheses and evaluation alternatives for the [official application plan](VEREDA-APPLICATION-PLAN.md). It is not a second execution sequence. Thresholds are proposed experiment gates, not results. Use A01–A40 for application tracking and VE00–VE17 for execution; P/X identifiers below identify individual cards only.

This contribution is based on the repository assessment dated 14 November 2026, the existing integrated report, the 217-paper appraisal, and static inspection of the exploratory scraping code. Numerical gates below are proposed pilot decision rules, not measured product results. Links are repository-relative from `docs/aplicacao/`.

## Product thesis and portfolio rules

The product should help someone decide which saved apartment to visit first, why, what could reverse that choice, and where else to search. Every new layer should produce a difference, a counterfactual, an action, or a change over time. “There are 24 nearby establishments” is an input; “both supermarkets require the same bridge, while the alternative property has an independent option” is an insight.

The difficult-to-copy asset is the corrected history connecting an apartment listing to a building, entrance, street side, crossing, service, event, and user decision. A single correction should update every affected comparison. Buy and rent remain separate decision contexts. Documents and visit captures are optional enrichment. Default behavior must deliver value from the imported listing and existing saved destinations.

Use compact internal states and an expandable evidence view; do not blanket the interface with approximation badges. Plain wording must nevertheless preserve the actual measured quantity: scheduled departures, sun exposure, known closure, asking price, fiscal reference, or observed crossing. A technical contract prevents misleading simplifications before they reach the UI.

## Core applications and evaluation cards

### P01 — Decision brief with explicit trade-offs

**Hypothesis:** a two- or three-difference comparison helps users select a first visit more effectively than separate dossiers. Reuse monthly cost components, listing attributes, saved destinations, existing budget, and comparable routine windows. Start with deterministic differences and Pareto filtering rather than a universal property score. Display money/time trade-offs, hard constraints, and the one uncertainty that could reverse the preference.

**Evaluation:** construct at least 20 paired scenarios including equal prices, missing condominium fees, mixed periods, shared buildings, and reversed priorities. Monotonic tests must ensure lowering a known expense cannot make that property more expensive; comparison order must not change the result. In an initial moderated study, seek at least 6 of 8 participants able to name their first visit and cite a displayed differentiator without help. This is a usability gate, not a population-level causal claim. Rewrite if participants merely repeat a score.

### P02 — Break-even question and visit prioritization

**Hypothesis:** one question selected by decision sensitivity is more valuable than a long checklist. Inputs include cost gaps, missing recurring expenses, travel-frequency ranges, façade alternatives, and uncertain entrances. Start with interval arithmetic: find which uncertain variable crosses the comparison boundary and generate a specific editable question.

**Evaluation:** create counterexamples in which an unknown fee does and does not reverse the winner. The suggested question must target a reversible material difference and must not request information already available. A useful gate is 100% correct reversal direction in fixture scenarios and at least 6 of 8 participants understanding what answer would change their choice. Do not claim probabilistic value of information without distributions.

### P03 — Search inversion: preserve the good parts

**Hypothesis:** when neither listing works, users value seeing street areas that preserve selected advantages more than a generic neighborhood recommendation. Inputs are building-to-network links, destination travel limits, known saved-offer costs, and optional verified market strata. Start with intersection of reachable areas and constraints, explain the limiting destination, and provide portal search handoff.

**Evaluation:** test against brute-force enumeration on a small graph. No returned area may violate a hard constraint under the same scenario. At least three distinct failure cases should explain why no match exists. Price-filtered suggestions remain limited to actual priced observations until broader offer coverage passes P19.

### P04 — Essential errands with an independent fallback

**Hypothesis:** users prefer knowing whether they can complete essential errands and retain a backup. Begin with grocery, pharmacy, everyday food, and public leisure; schools and care facilities become preference-dependent categories. Each destination needs identity, category, public entrance, dated activity evidence, and network access. Calculate first and second useful destinations, route time, significant crossing, and shared bottlenecks. Shared ownership is separate from route independence.

**Evaluation:** manually review 30 routes, six per pilot neighborhood, including at least one difficult crossing/entrance in each. Reject any published route containing a known forbidden or impossible connection. Compare against radial distance and existing distance × 1.32. Measure rank reversals and corrected decisions, not just average distance error. Track category/building coverage separately.

### P05 — Errand chaining and time-window feasibility

**Hypothesis:** “pharmacy plus groceries on the way home” produces greater everyday value than isolated POIs. Add documented opening windows and destination dwell-time assumptions to P04. Use a small deterministic shortest-path/time-window search, not a learned itinerary planner. An unknown opening window should not become “open.”

**Evaluation:** use synthetic clock cases crossing closing time, midnight, weekends, and holidays. Verify that the chain respects all constraints and beats independent round trips where expected. Pilot only where at least two destination schedules have current evidence. Defer live occupancy and queue estimates until observations exist.

### P06 — Verified step-free and lower-crossing alternatives

**Hypothesis:** specific route constraints serve people with mobility needs better than generic walkability. Inputs are steps, ramps, slope, surface, clear width, crossing type, gate access, and verification date. Unknown links remain distinct from verified accessible links. Start with route filtering and penalties explicitly chosen by the user.

**Evaluation:** hold out whole crossings, not random images. Test unreachable outcomes and disconnected sidewalk sides. Never label an entire route step-free because no step is recorded. Field review is required for route-wide accessibility claims; without it, publish known constraints and reviewed stretches. This is a later enhancement where coverage supports it, not a mandatory onboarding question.

### P07 — Commute by departure window

**Hypothesis:** the difference between weekday morning, evening return, and Saturday service changes housing choices. Inputs are versioned GTFS, `calendar`, `calendar_dates`, stop location, direction, transfer rules, pedestrian approaches, and actual destination entry. Start with schedule-based path sampling over departure windows; use the median and tail of scheduled journey duration rather than total `stop_times` rows.

**Evaluation:** select known weekday, Saturday, exception, midnight-over-24h, and direction cases. Compare sampled itineraries to the original feed. Test no-service and transfer-missed cases. A scheduled distribution cannot become actual reliability; observed vehicle data would be a separate experiment. Publish only validated feed versions and retain the previous valid artifact when ingestion fails.

### P08 — Rain history as a route interruption counterfactual

**Hypothesis:** a historical closure linked to the person's access route is more actionable than an area flood score. Inputs are dated municipal bulletins, named locations, affected mode, closure/reopening evidence, rainfall episode, street geometry, and ordinary routes. Start with curated events and deterministic edge removal. Distinguish the location of water from the apartment, and vehicle closure from pedestrian closure.

**Evaluation:** curate 20–40 located records over at least three episodes; hold out two complete episodes if sufficient records exist. Recompute shortest paths independently on small graph fixtures, covering disconnected networks and shared bottlenecks. Report event-link precision, unmatched locations, and reviewed route coverage. If few observations support a neighborhood, retain its routes and known events without inventing an absence-of-risk conclusion.

### P09 — Recurrence, recovery, and drainage review priority

**Hypothesis:** repeated disruption, recovery duration, and subsequent maintenance distinguish similar streets. Link multiple reports to one meteorological episode; preserve observation time, administrative processing time, and reopened status. Start with a transparent review-priority ranking using directly located water/closure, repeated drainage signals, and relative terrain context.

**Evaluation:** compare against raw complaint count, canal distance, and coarse elevation alone on held-out storms. A proposed promotion gate is higher precision at the same review workload, with failures shown by neighborhood. Treat a drainage repair as a changed condition to investigate; do not causally claim it eliminated flooding without a suitable before/after design and exposure controls.

### P10 — Façade comparison and best visit hour

**Hypothesis:** knowing which side differs and when to inspect it is useful before knowing a specific window. Reuse the solar engine, building volumes, height intervals, façade normals, season, and optional unit orientation. Show contrasts among building façades; refine only when a unit direction is known.

**Evaluation:** test solar position against trusted fixtures, opposite façades, shadow occlusion, time zone, seasonal dates, and sensitivity to height uncertainty. Add Madalena through the same publication process. Validate selected façade observations with dated photos or direct observation. A stable contrast under plausible height ranges can support visit timing; do not infer the interior temperature or unit orientation from an address.

### P11 — Less sun for a small detour

**Hypothesis:** a route that trades one extra minute for several fewer minutes in direct sun is a meaningful neighborhood advantage. Combine the pedestrian graph, building shadows, time, canopy/marquise geometry where available, and a maximum detour constraint. Start with 10–15% allowed extra distance as an adjustable experimental setting.

**Evaluation:** compare paired routes at two hours and two seasonal dates; validate shadow labels on held-out segments. Measure direct-sun minutes, extra travel minutes, route feasibility, and sensitivity to missing tree cover. Kill the optimization for a given pair if the preferred route flips frequently across plausible geometry inputs or the benefit is smaller than measurement uncertainty.

### P12 — Evening return conditions

**Hypothesis:** users value knowing the actual crossing, known lighting infrastructure, late transit service, and open destinations along the return route. Link CTTU events to crossings, lighting points to segments, maintenance to dates, and verified activity to hours. Start with a route explanation and a lower-crossing alternative.

**Evaluation:** reviewed links must support the displayed condition at the correct spatial scale. Distinguish installed lamps from lamps currently working and crossing crash history from per-person risk. Test the same address at two departure times. Do not rank street-level crime from district aggregates, appearance, income, or demographic proxies.

### P13 — Noise sources and façade exposure

**Hypothesis:** source location, operating hours, façade orientation, and barriers can help select a visit time and room questions. Start with arterial proximity, documented commercial activity, LUSE status, construction evidence, and the georeferenced official airport noise zoning plan. Use geometry to identify facing and shielded sides.

**Evaluation:** maintain source-status distinctions: permit, observed activity, measured sound. Audit the airport plan control points and version; reject the current empty theoretical cone. Compare source-based visit suggestions with field observations. A decibel model requires calibrated local measurements across time and street/facade strata before activation; paper coefficients alone are insufficient.

### P14 — What changed since the listing was saved

**Hypothesis:** changes are a reason to revisit Vereda. Diff listing snapshots, business opening/closure evidence, construction process states, service schedules, and known access changes. Produce a concise timeline with a direct effect: updated monthly cost, different route, relevant construction side, or new question.

**Evaluation:** use snapshots with equivalent formatting, real price changes, withdrawn offers, relisted units, and reversed municipal status. Cosmetic changes must not generate alerts. Duplicate publications must not inflate event counts. Start on-demand inside the app; outbound notifications require explicit product authorization and preference handling.

### P15 — Construction geometry and future context

**Hypothesis:** permit plus parcel plus height envelope can reveal which side of a building merits attention. Start with process status and location; an optional scenario can compare sunlight with a documented proposed volume. Inputs must preserve whether dimensions are requested, approved, or observed.

**Evaluation:** exact status transitions, parcel association, coordinate alignment, and geometric scenario tests. Keep scenarios separate from current-world geometry in the data contract. Promote only if at least a small set of cases can be traced end to end; otherwise retain the process timeline. Do not label an approved project as an active site.

### P16 — Reliable asking-price history and duplicate identities

**Hypothesis:** price changes and multiple representations of the same offered unit are more useful than raw portal counts. Inputs are portal/offer identifiers, capture times, mode, source-field text, unit attributes, periodic fees, and permitted image fingerprints. Start with within-portal IDs, deterministic candidates, and human-reviewed uncertain cross-portal links.

**Evaluation:** report false merges and missed duplicates separately; a proposed gate for automatic cross-portal merges is at least 98% precision on a held-out reviewed set, with ambiguous candidates unmerged. Reposted units must not become new independent comparables, and separate units in one building must remain distinct. If identity evidence is insufficient, present offer history at its supported level.

### P17 — Total-cost comparison and negotiation threshold

**Hypothesis:** separating base rent, condominium, tax, temporary charges, commuting costs, and known purchase costs reveals a better action than “cheap/expensive.” Start with existing `custoPorPartes` and explicit comparable periods. Calculate the missing-fee break-even threshold and optional rent-versus-buy scenarios with the same horizon and user-editable assumptions.

**Evaluation:** unit/period conversion, annual-to-monthly, refundable versus recurring, unknown-versus-zero, purchase cash flow, and sensitivity tests. Reference fiscal ITBI values only as fiscal values. Financing and investment scenarios require current inputs when executed and must not be silently converted into definitive personal advice.

### P18 — Explain a price difference through comparable attributes

**Hypothesis:** “what explains the premium?” is actionable if decomposition is understandable. Start with paired saved units matching modality and time; show known area, parking, total monthly expenses, route effects, and building context without assigning causal monetary value to each amenity.

**Evaluation:** test like-for-like definitions and cases where private area differs from total constructed area. Ask users which adjustment they would negotiate and why. Keep a small interpretable baseline; do not force a point valuation when comparable samples are sparse.

### P19 — External offer bands

**Hypothesis:** a curated micro-market asking-price band improves negotiation once selection and duplicates are controlled. Inputs require at least a dated, deduplicated sample by modality, type, area definition, micro-area, portal, and period. Start with empirical medians/quantiles and a transparent expansion ladder.

**Evaluation:** an experimental minimum of 20 distinct eligible units per displayed stratum is a starting gate, not proof of representativeness. Bootstrap stability, leave-one-portal-out sensitivity, and dated building holdouts determine promotion. Never mix asking prices, actual closings, fiscal values, and auction reserve prices. If coverage fails, retain personal comparables and total-cost thresholds.

### P20 — Decide which fact to inspect next

**Hypothesis:** targeted verification creates more value per review minute than uniformly collecting more data. Rank unknown entrances, bottleneck crossings, conflicting service status, and uncertain event links by number of affected comparisons and potential result change. Start with deterministic influence × uncertainty × reuse, with a capped review cost.

**Evaluation:** compare a fixed reviewer-hour budget with uniform sampling. Count corrected comparisons, reusable links, and eliminated contradictions. Preserve rejected candidates and edit provenance. User-submitted corrections are optional; personal routines should remain local by default.

## Advanced experiments with explicit entry conditions

| ID | Application and technical baseline | Required data / local labels | Promotion or stop rule |
|---|---|---|---|
| X01 | Bulletin extraction: regex/NER → small text model with quoted evidence. | Human-labeled location, event type, mode, dates, status, and origin spans across source layouts. | Promote only on held-out sources/periods with greater valid-event yield per reviewer hour and bounded cost; hallucinated locations or dates fail the field. |
| X02 | Sidewalk image triage: taxonomy-based annotation → segmentation or VLM. | Licensed dated imagery, crossing/steps/obstacle labels, local field checks, separate quantitative width labels. | Score added verified graph links, not image accuracy alone. Reject width estimates without local scale validation. |
| X03 | Visual flood observation and SAR/optical fusion. | Dated geolocated event imagery, visibility/cloud/shadow labels, independent storm annotations. | Test whole unseen storms and locations; stop if spatial/temporal precision cannot alter an event or route decision. |
| X04 | Flood susceptibility modeling with calibrated trees before GNN or hydrodynamics. | Useful terrain model/datum, drainage network, rainfall/tide, positive and reviewed-negative events, exposure. | Beat canal-distance/elevation/complaint baselines under spatial and storm holdouts; calibrate and show where labels are absent. No live warning until operational inputs and validation exist. |
| X05 | Local acoustic mapping with tabular regression before a 3D model or GAN. | Calibrated meters, repeated time windows, façade/source geometry, traffic/activity observations. | Compare MAE and interval coverage on held-out streets/hours against road-class baseline. A better fit without a changed user decision does not justify deployment. |
| X06 | Air quality exposure along routes. | Calibrated repeated local sensors or defensible monitoring coverage, meteorology, drift checks, source emissions. | Begin with observable traffic-source exposure, then test concentration estimates on held-out sensors/time. Stop at source context if station coverage cannot resolve street differences. |
| X07 | Thermal comfort beyond direct sunlight. | Air temperature, humidity, wind, mean radiant temperature, canopy, repeated route observations. | Compare simple sun-minutes baseline with a validated thermal model and added decision benefit. Never use Landsat surface temperature as indoor/air temperature. |
| X08 | Visual openness, greenery, and street perception. | Rights-cleared imagery, visible-canopy/sky/obstruction labels; optional local user preference ratings. | Test visible physical attributes first; retain per-user preferences. Avoid universal beauty, safety, socioeconomic, or health judgments from appearance. |
| X09 | Dynamic and personalized travel reliability. | Authorized vehicle/AVL observations, matching schedule history, cancellations, observation completeness. | Held-out-day and route calibration must beat schedule-only travel distributions. Keep scheduled and observed metrics distinct. |
| X10 | Asking-price prediction: hedonic regression → boosted trees/quantiles → GNN. | Deduplicated sufficiently large longitudinal offer labels; actual-closing labels separately if available. | Same building/period/spatial test splits, coverage calibration, cost measurement, and modality ablations. Reject complexity without a meaningful incremental gain over simple comparables. |
| X11 | Multimodal offer attributes and condition clues. | Permitted text/photos, local labels for parking, view obstruction, visible condition, amenities, source text spans. | Test per field and portal with missing-modality fallbacks. Keep observed attributes distinct from inferred physical defects and unknown unit orientation. |
| X12 | Repeat-sales or market trend index. | True repeated units with dated comparable price nature and stable definitions. | Assess sample and compositional stability; thin-market smoothing remains research until paired observations exist. Repeated listings are not repeated sales. |
| X13 | Multi-person and household compromise search. | Optional multiple saved destinations, schedules, constraints, local preference storage. | Pareto trade-off and minimax regret over stated scenarios, tested for monotonicity and fairness across household constraints. Avoid inferring household membership or sensitive traits. |
| X14 | Robustness to unknown future routine. | User-selected scenarios such as more office days, later return, or car unavailability. | Test whether the preferred property stays preferable across scenarios; show exact reversal thresholds. No learned probabilities required. |
| X15 | Optional phone/visit capture. | Consented photos/audio/notes, calibrated capture requirements where quantitative, timestamps and editable links. | Measure whether one capture resolves a decision-critical unknown; never make uploads required. Quantitative acoustic/photogrammetry claims require device-specific calibration. |
| X16 | Building documents, service history, and technical due diligence. | Voluntarily supplied condominium records, budgets, works notices, authorized fields with provenance. | Extract expenses/status and generate targeted questions; test each field against originals. Keep this as enrichment, not the core path or automatic building defect diagnosis. |
| X17 | Auction or distressed-sale exploration. | Auction-specific dates, price nature, status, possession/fees from authorized primary records. | Separate product universe and explicit comparability rules. Stop if available records are search pages/404s or if expected valuation depends on unavailable facts. |
| X18 | Post-maintenance longitudinal learning. | Linked repair dates, repeat rainfall exposure, documented comparable outcomes, spatial controls. | First show chronology; causal claims need an appropriate study with controls. Keep unresolved confounding in the internal experiment report. |

These alternatives cover the additional families in the collected literature without committing the pilot to sensors, VLMs, GNNs, hydrodynamic simulation, interior reconstruction, or a document-heavy onboarding flow.

## Collection reliability and source gaps

A source moves through discovery → captured → parsed → validated → linked → eligible → published. An HTTP 200 or catalog `ok` cannot stand in for the final state. Track valid records, spatial coverage, schema version, time extent, eligible fields, and published artifact IDs separately. Store immutable originals and parser versions; normalize and publish atomically with the previous valid version available.

Prefer official files, APIs, CKAN and ArcGIS pagination, then structured page data and DOM extraction, then controlled browser sessions for authorized JavaScript sources. VLM extraction is justified only when a useful field exists exclusively in an image/layout and its incremental valid-field yield exceeds review cost. Use per-domain budgets, conditional requests, bounded retries with Retry-After, resumable cursors, content checks, fixture snapshots, and drift alarms. Blocked login/CAPTCHA/403 sources should produce a recorded gap and alternative-source task, not an empty publication or escalating evasion attempts.

Specific inherited defects worth adding to the first collector test set:

- `docs/dados/infra/scripts/10-osm-pois.mjs` has hardcoded Recife latitude boxes near −8.8, unlike the corrected municipal boxes in `12-amenidades.mjs`; its source status can be `ok` even when all categories fail. Its category regex interpolates quoted alternatives, so validate emitted selectors rather than treating transport failures as the only problem.
- `docs/dados/infra/scripts/12-amenidades.mjs` emits selectors such as `shop["supermarket"]` where an OSM element type and tag condition are needed, and declares `todosPois` within the neighborhood loop then references it outside when writing output. A fixture test should fail before any network call; preserving raw POIs for every neighborhood also needs a keyed outer collection.
- `docs/dados/infra/scripts/http.mjs` provides cache, retries, bounded Retry-After handling, gzip decoding, and atomic writes, but production consumers still need semantic validators, source freshness choices, pagination completeness, and explicit last-valid preservation.
- Google Maps collected zero entities; Oleo returned errors; the lone Overpass output failed every category; CNEFE’s reduced app layer does not supply the grocery category; the current ZAP snapshot is selected first-page evidence rather than a market distribution. These gaps motivate new acquisition tests, not UI metrics.
- Neighborhood centroids are inappropriate origins for apartment decisions. Retain them only as geographic summaries or source-validation aids; all meaningful accessibility begins at supported building/entrance geometry.
- The two GTFS copies have different versions; all transit calculations and screenshots must identify their source manifest internally. Correct the service-date logic before adding richer routing.

## Evidence and evaluation policy

Keep a versioned gold set covering five neighborhoods, weak-coverage areas, no-data cases, blocked sources, ambiguous streets, duplicate offers, midnight services, corners, gates, waterways, changed schemas, and conflicting observations. Hold out the unit appropriate to each question: whole building for offers, whole storm for flood, whole crossing for vision, whole street/time window for noise. Tiny pilot samples support a go/no-go engineering decision; they do not support broad statistical claims.

Measure four levels independently: data validity/coverage; calculation correctness; user comprehension/action; operating cost and refresh reliability. A proposed feature should have a cheap baseline, one primary decision metric, a maximum review/inference cost, and a fallback that still serves the user. The experiment report should preserve failures and the reason to stop; a rejected complicated model can be a successful epoch if the simpler feature remains useful.

## Repository evidence

- [Integrated product and technical assessment](../dados/literatura/parecer-tecnico-integrado.md).
- [Individual appraisal of 217 PDFs and discovery-only queue](../dados/literatura/avaliacao-do-acervo.md).
- [Urban collection catalogue](../dados/literatura/urbanismo-nova-leva/CATALOGO.md).
- [Earlier development hypotheses](../dados/literatura/urbanismo-nova-leva/plano-desenvolvimento.md); the integrated report's comparison-first sequence should supersede the earlier rain-first order.
- [Collector guidance](../dados/infra/RECADO-PARA-O-AGENTE.md), [HTTP client](../dados/infra/scripts/http.mjs), [old OSM collector](../dados/infra/scripts/10-osm-pois.mjs), and [amenity collector](../dados/infra/scripts/12-amenidades.mjs).

## Card-to-programme mapping

| Cards | Application IDs | Owning epochs |
|---|---|---|
| P01–P02 | A01–A04 | VE01, VE11 |
| P03 | A23 | VE11 |
| P04–P05 | A06–A08 | VE04 |
| P06 | A09 | VE03, VE08 |
| P07 | A10 | VE05 |
| P08–P09 | A11–A13 | VE06, VE09 |
| P10–P11 | A14–A15 | VE07 |
| P12–P13 | A16–A17 | VE08 |
| P14–P15 | A18–A19 | VE09, VE13 |
| P16–P19 | A02, A20–A22 | VE10 |
| P20 | A29 | VE13, VE17 |
| X01–X03 | A11, A27–A28 | VE06, VE13 |
| X04 | A30 | VE14 |
| X05–X06 | A33 | VE14 |
| X07–X08 | A15, A32 | VE07, VE13, VE14 |
| X09 | A10 | VE05, VE14 |
| X10–X12 | A21, A28, A31 | VE10, VE13, VE14 |
| X13–X14 | A24–A25 | VE11 |
| X15–X17 | A34–A35, A40 | VE15 |
| X18 | A12, A18, A30 | VE09, VE14 |
