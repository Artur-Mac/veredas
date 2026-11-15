# Urban intelligence for Vereda — research and product opportunities

Research snapshot, 14 November 2026. The sample copy below is fictional. The available PDFs are preserved in this directory. The first-page and abstract review identifies methods and local dependencies. Numerical performance claims require full methods and data inspection before implementation.

## Decisions for the next product iteration

The strongest immediate opportunity is a **history of rain-related events associated with the street**, with the date, kind of administrative record and geographical precision. The existing app already has street-level Civil Defense aggregation, 156 requests and terrain context. A pilot should recover individual source dates, consolidate records by storm, and connect each street to evidence independently. This can turn a scattered list of numbers into an answer without asking the resident for data. A street-level result must stay street-level when the source lacks a house number.

Two further bets are a walk to useful destinations with real crossings, and a time-specific shade comparison. These create visible benefits for apartments with good access as well as identifying obstacles. The city network, completeness of sidewalks, tree crown geometry and opening hours remain unverified dependencies. For these features, precompute examples using existing building locations and deliver cards with a short explanation.

The app currently combines height, proximity to water and service requests in its rain summary. These are inputs to investigation, with different meanings. In its noise summary, scheduled transit, construction permits and sound permits provide evidence of activities. Validate those sources and avoid converting them directly into decibel levels or operating hours.

## Local evidence and coverage

The active municipal index `91b71d239c1847cf`, generated on 22 October 2026, was inspected locally on 14 November 2026. The count of indexed streets with at least one record classified as alagamento is a count of streets in the generated index, not a survey of flooded streets. It depends on the source and the existing classifier.

| Pilot neighborhood | Buildings indexed | Indexed streets | Streets with at least one recorded alagamento category |
|---|---:|---:|---:|
| Boa Viagem | 1,879 | 168 | 5 |
| Casa Forte | 82 | 21 | 1 |
| Graças | 291 | 58 | 0 |
| Espinheiro | 156 | 28 | 1 |
| Madalena | 280 | 72 | 0 |

All 2,688 buildings have a `rua` field in the indexed output. This says nothing about completeness, geolocation quality, or observed absence of flooding. The 2025 local Defense Civil CSV contains one data row, so the local file cannot establish complete 2025 coverage. The GTFS validation report finds that applying a −0.75° offset moves all stops outside Recife. Check coordinates independently before using derived bus proximity. The current index holds street aggregates, so a pilot requiring event dates needs a separate reproducible join back to source rows. [Local validation](../../validacao-defesa-civil-gtfs.md) · [Index](../../../../src/dados/recife/indice-municipal/91b71d239c1847cf/meta.json) · [Street pipeline](../../../../scripts/dados/rua/camadas.mjs)

## Source inventory

The labels distinguish locally inspected files from documented online sources. Coverage of individual events and locations still requires measurement.

| Source | Status and actual granularity | Update, use and next verification |
|---|---|---|
| [Defense Civil calls](https://dados.recife.pe.gov.br/dataset/registro-de-atendimentos-da-defesa-civil) | Local CSV 2021–25 inspected; indexed street aggregates in five pilot neighborhoods. Street name may lack building number. | Annual files 2014–25 listed, quarterly update, ODbL. Recover date and event category, inspect duplicate calls and annual completeness. |
| [Emlurb 156](https://dados.recife.pe.gov.br/tr/dataset/demandas-dos-cidadaos-e-servicos-dados-vivos-recife) | The existing pipeline aggregates drainage, light and waste calls around buildings. The live portal documents current-day calls. | Historical data and live feed have different time windows. Verify coordinate precision, status, 12-month coverage and whether a call describes flooding or maintenance. |
| [Urban area layers](https://dados.recife.pe.gov.br/dataset/area-urbana) | Existing index contains 2,688 buildings and street context for all five areas. Municipal catalog documents lots, street segments, buildings and other layers. | ODbL. Audit geometry and attributes for each proposed street or facade calculation. |
| [Road crashes](https://dados.recife.pe.gov.br/dataset/acidentes-de-transito-com-e-sem-vitimas) | Official 2015–24 annual CSVs documented, local street pipeline references them. | ODbL, published calls can differ from police statistical reports. Audit victim type, coordinates and pedestrian counts before mapping crossing history. |
| [Census street surroundings](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/28971-bases-de-faces-de-logradouros-do-brasil.html) | The app carries census-sector counts for all five neighborhoods. | Census 2022 measures surroundings at its published geography. Verify exact indicator and denominator before associating with a route. |
| [CNEFE](https://www.ibge.gov.br/estatisticas/sociais/populacao/38734-cadastro-nacional-de-enderecos-para-finsestatisticos.html) | Local app service index exists. IBGE provides addresses, use category and coordinate quality. | Census 2022. Verify current operation and coverage of each amenity. |
| [Municipal licensing](https://dados.recife.pe.gov.br/dataset/licenciamento-urbanistico) | Existing building index contains nearby permits. Portal describes only fully digital applications. | ODbL, daily declared frequency. Confirm exact status and address; a permit is an application or authorization, depending on its status. |
| [OSM](https://www.openstreetmap.org/copyright) | Existing POI collection is partial; five-neighborhood sidewalk graph not audited. | ODbL. Download a dated extract and evaluate missing footways, crossings and bridges by neighborhood against sampled aerial or field references. |
| [GTFS Grande Recife](https://gtfs.org/documentation/schedule/reference/) | Local archive and stops inspected; the offset issue is documented in local validation. | Verify original feed coordinates, calendar, provider rights and validity. Service on a route needs trips and calendar, not stops alone. |
| [Landsat surface temperature](https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature) | Existing `camadas-ambientais.json` lists Landsat scenes and a ~100 m grid for Recife. | Land surface temperature at satellite overpass, not air or indoor temperature. Compare dates, clouds and season. |
| [Recife real-time services](https://dados.recife.pe.gov.br/tr/dataset/demandas-dos-cidadaos-e-servicos-dados-vivos-recife) | Online catalog inspected. Offers current-day records including road speed and 156/Defesa Civil requests. | ODbL, stated delay up to 15 min. Assess retention and fields in historical resources before treating as longitudinal data. |
| [Project Sidewalk](https://sidewalk-dc.cs.washington.edu/api) | Tool and documented API inspected online. Local Recife coverage has not been established. | Reusable methods and labels. Source imagery has separate terms. Obtain street-level imagery and local review if piloting. |
| [CoolWalks](https://arxiv.org/abs/2405.01225) | Research PDF downloaded. Builds network routing with time-dependent building shade. | Recife building heights, sidewalks, tree canopies and actual shade require verification. |

## Literature batch

These are methods to test, not estimated Vereda performance. All links in this table point to locally downloaded PDFs. The methods and settings are summarized from abstracts and available source descriptions. Full result extraction is pending for entries marked preliminary.

| Work | Where and evidence | Transferable method and decision |
|---|---|---|
| [China social media and satellite](china-flood-social-satellite.pdf) | China, rainstorm events and Weibo posts, satellite comparison. | Link reports by event, time and location. Reporting and satellite detection have different coverage. The paper does not validate Recife street predictions. |
| [Flood depth from images](flood-depth-social-media.pdf) | Social-media images with annotated water levels. | Rank plausible depth from image objects. Requires image location, time and validation, including failures in different streets. |
| [Zero-shot urban flood detection](flood-zero-shot.pdf) | Street imagery and Bayesian zero-shot classifications. | Treat model outputs as uncertain evidence and check sample bias. Preliminary for Recife. |
| [GEOID-Flood](flood-benchmark.pdf) | Multimodal satellite flood segmentation benchmark with manually validated tiles. | Compare radar/optical approaches and events; spatial scale and urban occlusion limit building-level claims. |
| [Vias alagadas](vias-alagadas.pdf) | MediaEval flood imagery and road passability labels. | Separate detection of water from classification of vehicle passability. Requires local road images and independent test. |
| [Recife sea-level scenarios](recife-mare.pdf) | Recife topography and projected sea-level/tidal exposure. | Investigate drainage and tide pathways with compatible elevation datum. A scenario is not a record of an actual flood. |
| [Porto Alegre hospital access](porto-alegre-redundancia.pdf) | Flood scenarios, road-network connectivity and hospital access. | Measure alternate paths to destinations under observed closures. Transfer to walking only after validating pedestrian graph and closures. |
| [Brazil road vulnerability](vulnerabilidade-viaria.pdf) | São Carlos, road network and flood scenarios. | Measure network disruption and dependence on critical segments. Test actual routing rather than proximity buffers. |
| [CoolWalks](coolwalks.pdf) | Simulated and real urban networks with buildings and solar geometry. | Compare shortest and shade-weighted routes at a fixed hour. Needs valid heights and sidewalk geometry. |
| [Hong Kong solar cost](hong-kong-sombra.pdf) | Hong Kong, 500 simulated trips, multiple hours and detour limits using LiDAR and building/vegetation geometry. | Compare shade gained against extra walking distance. The result is simulation using richer inputs than currently verified for Recife. |
| [Austin thermal route planner](austin-conforto.pdf) | Austin, thermal modelling and pedestrian/cycle routing. | Research UTCI-based route costs. Weather, radiation, trees and validation make this a longer-term option. |
| [SideSeeing](sideseeing.pdf) | Sidewalk videos and smartphone data near hospitals in Brazil and the US. | A taxonomy and field collection method for auditing accessibility around key destinations. |
| [Fine-grained sidewalk assessment](sidewalk-fine-grained.pdf) | Project Sidewalk image labels and computer vision benchmarks. | Detect attributes such as ramp and its condition separately, using local verification. |
| [Sidewalk VLM reliability](sidewalk-vlm.pdf) | Pedestrian images and measurable sidewalk features. | Use calibrated image models as a screening mechanism; quantitative measurements require stricter accuracy. |
| [UrbanVGGT](urbanvggt.pdf) | Street-view image estimates of sidewalk width, 527 OSM segments in prototype dataset. | Test whether relative width estimates help prioritize audit; validate the accuracy, view angle and local imagery rights first. |
| [UFSCar curb ramps](ufscar-calcadas.pdf) | Brazilian academic work on automatic ramp detection in panoramic imagery. | Local language and streetscape baseline for finding missing ramps, with manual audit and image licensing. |
| [Inclusive 15-minute cities](cidade-15min.pdf) | International comparison of accessibility on city networks. | Compare number and diversity of destinations reachable by network rather than straight-line counts. |
| [Street-view heat perception](percepcao-termica.pdf) | Street photographs and heat perception study. | Investigate visual greenery and perceived heat with local field observations. Surface temperature alone does not establish pedestrian comfort. |
| [Thermal comfort in sight](conforto-visual.pdf) | Visual analysis of thermal affordances. | Candidate method for heat-relevant streetscape attributes. Preliminary, requires further review. |

Other accessed research includes the [Chengdu social-media flood study](https://doi.org/10.1016/j.ijdrr.2023.103780), [Guangzhou flood model](https://doi.org/10.3390/rs18101495), and [street-level flood location extraction](https://doi.org/10.1080/19475705.2025.2551272). Their full texts or downloadable PDFs were not all independently obtained in this batch.

## Feature proposals

Examples are invented solely to show the intended form of a card. Effort is a relative engineering estimate, not a measured cost.

| Insight and sample copy | Inputs, logic, limitations and validation | Effort |
|---|---|---|
| **Quando chove nesta rua** — “Há registros de alagamento nesta rua em dois períodos de chuva. O endereço dos atendimentos não identifica o prédio.” | Join classified Civil Defense records by street and date, merge calls from same storm and retain links to source. False positive: one long street with a distant incident. False negative: unreported flooding. Validate against dated news and two known rain events. | Medium |
| **O caminho depois da chuva** — “O trajeto até o mercado passa por um trecho com registro anterior de água na via. Há uma rota alternativa pela rua paralela.” | Pedestrian graph plus independently located historical closures or observations. A record needs a reliable segment and date. A false closure can cause needless detour; missed reports can leave an affected route. Compare two independently checked past events. | High |
| **O essencial a pé** — “Há mercado e farmácia a poucos minutos por trajetos diferentes. Um dos caminhos cruza uma avenida movimentada.” | Network distances, mapped crossings and verified operating POIs. Check two routes and count coverage. False positives come from closed shops or missing crossings; false negatives from incomplete POIs. Inspect samples in each neighborhood. | Medium |
| **Caminho com mais sombra** — “Até a praça há um caminho estimado mais sombreado no fim da tarde. Ele acrescenta poucos minutos à caminhada.” | OSM walkable graph, municipal building footprints/heights, sun position and verified trees. Model two times and compare route alternatives. Missing trees and arcade shadows can invert ranking. Validate opposite sides of two blocks at measured times. | High |
| **Travessias do entorno** — “Uma travessia no caminho para a parada concentra registros de atropelamento. Os dados mostram chamados, com data e local informados.” | CTTU crash type, date and location joined to known crossing and route. Geocoding error can assign a collision to the wrong junction; unreported crashes reduce counts. Audit source points and sample intersections. | Medium |
| **A rua em horários diferentes** — “Há estabelecimentos com atividade sonora licenciada perto do prédio. Confira os horários do local para saber quando há movimento.” | Licensed sound locations, process validity and independently verified opening hours. A permit does not establish noise or operating hours. False positives include closed venues and expired licenses. Audit a day/evening sample. | Low–medium |
| **Mudanças próximas** — “Há uma licença de obra próxima com processo recente. O andamento da obra ainda precisa ser confirmado.” | Municipal permit status, coordinates, date and distance. Planned or expired permits can be mistaken for active works; unlicensed works may be absent. Review recent satellite/street imagery and local examples. | Low |
| **Vantagens do entorno imediato** — “Você tem duas alternativas de supermercado a pé e uma praça no caminho. As informações de funcionamento foram atualizadas nesta data.” | Verified POIs, dated operating state and walkable network. A duplicated or closed business creates a false advantage; unlisted stores reduce apparent choice. Audit two providers and on-the-ground sample. | Medium |

## Three prototypes

1. **Street rain history** is the first choice. Start with two contrasting streets already represented in the index, recover the corresponding Defense Civil rows from 2021–24, parse source category and date, count distinct dates and inspect two rain events against independently dated evidence. Show the period, street-level geography and what was recorded. Reject the automatic history if the street matching or event identity cannot be audited reliably. Estimated work is days for a research prototype, unmeasured for production. The app currently has the basic data and card location.
2. **Access to essentials** uses one dated OSM extract and a small manually verified set of supermarkets, pharmacies and transit destinations in two blocks per neighborhood. Compare network walking distance to the present straight-line information and record missing crossings. Stop if the graph or POIs are too incomplete to provide a usable comparison.
3. **Shade route comparison** is an experimental positive feature. Use one pair of nearby routes in Boa Viagem or Graças, fixed solar times, existing building volumes, and independently observed tree canopy. Compare modeled shade with observations on both sides of the street. Stop or reduce the claim to a static facade observation when the model cannot preserve route ordering.

## Access log and limitations

The four PDFs initially downloaded were retained. The expanded batch contains 19 locally readable PDFs, validated with `pdfinfo`; this validates file readability, not the scientific claims. Direct downloads attempted from the University of Twente Chengdu mirror, IFPE Recife paper, and Cardiff Porto Alegre paper failed in the local downloader. Their source pages or abstracts were accessible separately. [Anna’s Archive datasets](https://annas-archive.gl/datasets) was opened as requested; it is a broad catalog, and no paper was downloaded from it in this batch. Source catalog pages and existing local files were inspected. New full five-neighborhood source extracts, source-specific costs, field validation, and a reproducible event-level flood join remain unmeasured.
