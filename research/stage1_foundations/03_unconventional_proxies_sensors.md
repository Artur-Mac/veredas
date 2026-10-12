## 4. Data Source Universe

To build genuine intelligence rather than repackaged listings, a product must tap into a rich multi-tiered data stack. Below is a systematic inventory of global and Brazilian datasets, classified by technical accessibility, update frequency, licensing, and stability.

```
+---------------------------------------------------------------------------------------+
|                                  DATA SOURCE TAXONOMY                                 |
+---------------------------+---------------------------+-------------------------------+
|     Municipal Cadastre    |    Hydrology & Hazard     |     Crowdsourced Telemetry    |
|   (GeoSampa, Dados Recife,|   (CEMADEN, SNIS, SIURB,  |  (OpenStreetMap, OpenCelliD,  |
|       IBGE Censo 2022)    |      Copernicus ERA5)     |     PurpleAir, Ookla Tiles)   |
|   * Land parcel polygons, * Flash flood vectors,      * Physical street tags,         *
|     zoning, fiscal data   * Soil saturation indices   * RF signal maps, air quality   *
+---------------------------+---------------------------+-------------------------------+
|     Remote Sensing Sat    |    Commercial Footprint   |     Civic Grievance Logs      |
|    (Sentinel-2, Landsat,  |   (Receita Federal CNPJs, |    (SP 156, Recife 156,       |
|        Planet Labs)       |     iFood, Cielo/Rede)    |       Reclame Aqui)           |
|   * Urban heat islands,   * Business opening velocity,* Streetlight outages, trash,   *
|     canopy & roof metrics * Commercial vital signs    * Potholes, clogged drains      *
+---------------------------+---------------------------+-------------------------------+
```

### 4.1 Brazilian Municipal & Federal Data Infrastructure

Brazil possesses extraordinarily rich, yet highly fragmented and under-utilized public geospatial datasets.

#### A. São Paulo (GeoSampa & SIURB)
* **GeoSampa (SMUL)**: The municipal GIS portal of São Paulo. Accessible via WMS/WFS endpoints, direct SHP/GeoJSON downloads, and CKAN APIs.
  * *Cadastral / IPTU Layer (SQL - Setor, Quadra, Lote)*: Contains parcel boundaries, year of construction, gross floor area, assessed tax value, and zoning categorization. *(Freely accessible, highly stable).*
  * *Áreas de Risco Geológico e Hidrológico (IPT / Defesa Civil)*: Polygons of mapped landslide and flash flood risk zones across the municipality. *(Public, updated biannually).*
  * *Áreas Contaminadas (CETESB)*: Georeferenced registry of brownfield sites with documented soil or groundwater chemical contamination (former gas stations, dry cleaners, chemical plants). *(Public, quarterly updates).*
  * *Drenagem Urbana & Piscinões (SIURB)*: Micro-catchment drainage basins, stormwater detention reservoirs (piscinões), and historical street inundation points. *(Public, technically accessible).*
  * *Licenciamento & Alvarás (SLCe)*: Registry of active, approved, and pending building permits, outorga onerosa grants, and demolition notices. *(Public, requires scraping or API parsing).*

#### B. Recife (Portal de Dados Abertos da Prefeitura do Recife & EMPREL)
* **Portal de Dados Abertos (dados.recife.pe.gov.br)**: Maintained by EMPREL (Empresa Municipal de Informática). Offers REST APIs (CKAN) and CSV/GeoJSON dumps.
  * *Cadastro Imobiliário Fiscal (IPTU)*: Parcel-level data including sequential property numbers, constructed area, logradouro code, building standard category, and tax assessment. *(Publicly available).*
  * *Licenciamento Urbanístico (SEDUL)*: Construction permits, outorga onerosa, zoning variances, and certificate of completion (Habite-se) filings. *(Public, updated monthly).*
  * *Defesa Civil & Setores de Risco nos Morros (CODECIR)*: Micro-polygons of geomorphological landslide vulnerability in the northern and western hills of Recife (Nova Descoberta, Casa Amarela, Ibura). *(Publicly accessible).*
  * *Pontos Críticos de Alagamento (Emlurb)*: Registry of recurring street flooding points across low-lying coastal and estuarine zones (Boa Viagem, Ilha do Leite, Derby, Caxangá). Critical due to Recife's vulnerability as one of the world's most threatened cities by sea-level rise and tide-locked storm drainage. *(Public).*
  * *Chamados 156 / Atendimento ao Cidadão (Emlurb)*: Geocoded citizen complaint tickets for broken streetlights, clogged storm drains (bueiros entupidos), garbage accumulation, and tree trimming requests. *(Public, high-value dynamic signal).*

#### C. Brazilian Federal & Multi-Regional Infrastructure
* **IBGE - Censo Demográfico 2022 (Características Urbanísticas do Entorno dos Domicílios)**:
  * Hyper-granular census tracts (Setores Censitários, ~150-300 households).
  * Measures direct field-observed street infrastructure variables: % of households with paved streets, public lighting, concrete sidewalks, stormwater drains (bueiro / boca de lobo), tree canopy (arborização), and wheelchair ramps. *(Public, monumental ground-truth dataset).*
* **CEMADEN (Centro Nacional de Monitoramento e Alertas de Desastres Naturais)**:
  * Real-time pluviometric monitoring stations (pluviômetros automáticos) measuring millimeter-per-hour rainfall rates.
  * Geotechnical threshold models warning of imminent mass slope movements. *(Public API & GeoTIFF feeds).*
* **SNIS (Sistema Nacional de Informações sobre Saneamento)**:
  * Annual municipal operational data on water distribution loss rates (frequently exceeding 40% in Brazilian cities), wastewater collection coverage, sewage treatment efficiency, and stormwater drainage coverage. *(Public, annual publication).*
* **Receita Federal (CNPJ Open Data)**:
  * Monthly dump of all registered commercial entities, legal addresses, CNAE economic activity codes, opening dates, and closure status. By computing the net delta of high-margin retail/services (e.g., specialty cafes, specialty gyms, boutique pet stores), one can construct an automated gentrification velocity index. *(Public, high processing requirement).*

### 4.2 Global Remote Sensing & Crowdsourced Infrastructure

| Dataset / System | Custodian | Granularity / Frequency | Primary Attributes | Accessibility & Feasibility |
| :--- | :--- | :--- | :--- | :--- |
| **Copernicus Sentinel-2** | European Space Agency (ESA) | 10m spatial resolution / 5-day revisit | Multispectral bands (RGB, NIR, RedEdge). Computes NDVI (vegetation health) and NDWI (moisture). | **Freely available** via Google Earth Engine or AWS Open Data. Highly feasible. |
| **Copernicus ERA5-Land** | ECMWF | 9km resolution / Hourly | Reanalysis 2-meter air temperature, solar radiation, relative humidity, wind speed vectors. | **Freely available**. Excellent for long-term thermodynamic micro-climate baselines. |
| **NASA / USGS SRTM & NASADEM** | NASA / USGS | 30m resolution (1 arc-second) / Static | Digital Elevation Model (DEM) for surface topography, slope angles, watershed delineation. | **Freely available**. Foundational for runoff and elevation-weighted walking friction. |
| **OpenStreetMap (OSM)** | OpenStreetMap Foundation | Vector topology / Continuous | Building footprints, road network graphs, pedestrian walkways, street amenities, points of interest. | **Freely available** via Overpass API / Geofabrik dumps. Core spatial backbone. |
| **OpenCelliD** | Unwired Labs / Community | Global points / Daily | Cell tower locations, cellular radio technologies (LTE/5G), MCC/MNC carrier codes, signal azimuth. | **Freely available** under CC-BY-SA. Feasible for RF shadow modeling. |
| **Ookla Open Data** | Ookla Speedtest | Zoom-16 tiles (~610m) / Quarterly | Mean/median download speed, upload speed, latency, device sample count across fixed/mobile networks. | **Freely available** on AWS S3 / Databricks marketplace. Feasible. |
| **PurpleAir / OpenAQ** | Distributed Community / OpenAQ | Station points / Real-time minute | Particulate matter (PM2.5, PM10), ozone, NO2 concentrations. | **Freely available API**. Moderate station density in Latin America; high in US/Europe. |
| **Waze for Cities** | Google / Waze | Polyline / Real-time feed | Driver-reported road jams, hazards, accidents, traffic jams with temporal timestamps. | **Restricted / Partnership required** (accessible via municipal data sharing programs). |
| **Commercial Telecom CDRs** | In Loco / Unacast / Safegraph | Hexagonal aggregated foot traffic / Daily | Device counts, home-work trajectory vectors, daytime population shifts. | **Expensive / Commercial license ($10k-$50k/yr)**. High barrier for early prototypes. |

---

## 5. Proxy Universe: 25+ Unexpected Indirect Signals

A core vulnerability of legacy real estate tools is their reliance on direct, stated attributes. Direct attributes are easily gamed: a seller paints over mold, an agent shoots photos with a wide-angle tilt lens, or a landlord claims an area is "tranquil and safe."

**Proxies bypass human manipulation.** When a physical or digital phenomenon occurs as an unintended side-effect of collective human behavior or physical environmental dynamics, it produces an un-gamed diagnostic signal.

```
+---------------------------------------------------------------------------------------+
|                                    THE PROXY PIPELINE                                 |
+---------------------+---------------------+---------------------+---------------------+
|   Physical Trace    |  Behavioral Residue | Municipal Friction  | Compound Fusion     |
|  * Tree canopy shade*  * Strava night runs*  * 156 drain tickets*  * Heavy rain + low   |
|    -> Microclimate  |  * Late night food  |  * Pothole density  |    elevation + 156  |
|    resilience       |    idling -> Noise  |    -> Neglect       |    -> Severance     |
+---------------------+---------------------+---------------------+---------------------+
```

### 5.1 Comprehensive Catalog of Unexpected Proxies

1. **Boutique Pet Store & Veterinary Clinic Density**:
   * *Underlying Signal*: High concentration of disposable income among childless young professionals ("DINKs" - Double Income No Kids) who prioritize walkable neighborhood lifestyles and personal safety.
   * *Target Variable*: Leading indicator of gentrification, pedestrian vibrancy, and neighborhood physical safety.
2. **Delivery Scooter Idling Clusters (20:00 - 23:30)**:
   * *Underlying Signal*: Delivery couriers congregate outside high-volume ghost kitchens, fast-food clusters, and restaurant corridors.
   * *Target Variable*: Severe nocturnal acoustic pollution (exhaust revving, intercom shouting) and double-parking street congestion, counterbalanced by commercial food convenience.
3. **Street-Level Tree Canopy (NDVI + LiDAR Height)**:
   * *Underlying Signal*: Foliage density directly intercepts solar irradiance and drives micro-scale evapotranspiration.
   * *Target Variable*: 3°C to 6°C reduction in street-level ambient summer temperatures, lowering apartment air conditioning electricity bills by 18-25% and dramatically boosting outdoor pedestrian endurance.
4. **Municipal 156 Complaints for "Bueiro Entupido" (Clogged Storm Drains)**:
   * *Underlying Signal*: Subterranean micro-drainage siltation and civic maintenance neglect.
   * *Target Variable*: Highly localized flash flooding and street-level impassability during 30-minute cloudbursts, even if the parcel is outside official flood zones.
5. **Ookla Crowd Latency vs OpenCelliD Tower Proximity Differential**:
   * *Underlying Signal*: Discrepancy between high theoretical outdoor signal strength and poor indoor crowd test latencies.
   * *Target Variable*: Heavy reinforced concrete shielding or low-emissivity glass coating that kills indoor mobile connectivity, creating severe remote-work ("Work-From-Home") dead zones.
6. **Nighttime Lights (VIIRS) Temporal Standard Deviation**:
   * *Underlying Signal*: Satellite-measured radiance variance between weekday midnights and weekend midnights.
   * *Target Variable*: Distinguishes stable, quiet residential enclaves (flat low radiance) from chaotic entertainment and nightlife corridors (high radiance peaks on weekends).
7. **Pharmacy Chain Density & Proximity**:
   * *Underlying Signal*: Pharmacies (e.g., Raia, Drogasil, Pague Menos in Brazil) employ sophisticated site-selection algorithms targeting dense, pedestrian-heavy areas with high purchasing power and aging demographic cohorts.
   * *Target Variable*: Sidewalk walkability, municipal medical infrastructure proximity, and basic urban vitality.
8. **The "Flat White Index" (Specialty Coffee Opening Velocity)**:
   * *Underlying Signal*: Entrepreneurs opening third-wave cafes in transitioning industrial or working-class fringe zones.
   * *Target Variable*: 24-to-36 month forward indicator of residential real estate capital appreciation and demographic transition.
9. **Ride-Hail (Uber / 99) Pickup Wait Times & Surge Multiplier Frequencies**:
   * *Underlying Signal*: Driver supply resistance caused by narrow cul-de-sacs, traffic bottlenecks, or perceived driver security concerns after dark.
   * *Target Variable*: True logistical friction of leaving the property without a private car.
10. **Micro-Elevation Differential (< 2 Meters within a 50m Radius)**:
    * *Underlying Signal*: Water flows naturally to local topographical depressions (concave landform curvature).
    * *Target Variable*: Chronic ground-floor dampness, foundation efflorescence, subterranean mold proliferation, and sewage backflow vulnerability during high tides or cloudbursts.
11. **Soundscape Biophony to Anthrophony Ratio**:
    * *Underlying Signal*: The acoustic energy ratio between biological sounds (birds, wind in leaves) and mechanical human sounds (engines, construction, HVAC).
    * *Target Variable*: Psychological restorative capacity of the property, baseline human cortisol reduction, and residential sleep hygiene.
12. **Public Lighting Maintenance Tickets (Ilumina SP / Emlurb Recife)**:
    * *Underlying Signal*: Spatial clusters of unaddressed burnt-out sodium/LED streetlamps.
    * *Target Variable*: Dark walking corridors and perceived opportunistic assault or robbery risks for pedestrians walking from transit stations.
13. **Bank Branch Closures & Cash Machine Removal**:
    * *Underlying Signal*: Traditional financial institutions pulling physical footprints due to street crime or commercial footfall decline.
    * *Target Variable*: Neighborhood commercial decay or shift toward completely digital/informal local economies.
14. **Overhead Electrical & Telecom Cable Clutter ("Emaranhado de Fios")**:
    * *Underlying Signal*: Unregulated aerial cabling drops from multiple informal telecommunications providers on utility poles.
    * *Target Variable*: Municipal regulatory absence, visual blight, heightened electrical fire hazards, and higher transformer blowout rates during storms.
15. **Condominium Reserve Fund Ratio vs Building Age**:
    * *Underlying Signal*: Ratio of liquid condo association reserve balances to annual operating budgets relative to building mechanical lifecycle (pumps, elevators, roof membrane, facade waterproofing).
    * *Target Variable*: Impending special assessment calls (chamada de capital) that unexpectedly inflate monthly ownership costs by $200-$1,000/month.
16. **Pre-School & Daycare Density**:
    * *Underlying Signal*: Young families establishing roots in the area; high social cohesion and daytime foot traffic.
    * *Target Variable*: Long-term residential stability and lower short-term tenant turnover.
17. **Bus Route Deceleration & Dwell Time Spikes**:
    * *Underlying Signal*: Public transit buses slowing down drastically on specific corridors during peak hours.
    * *Target Variable*: Narrow road geometry, illegal double parking, and extreme local bottleneck congestion.
18. **Garbage Collection Night Routes & Compactor Dwell Times**:
    * *Underlying Signal*: Heavy municipal diesel compactor trucks operating at 01:30 AM with high hydraulic compression noise and air brake hiss.
    * *Target Variable*: Recurrent nocturnal acoustic shock awakening light sleepers.
19. **Solar Angle of Incidence on Unshaded West-Facing Windows ("Sol da Tarde")**:
    * *Underlying Signal*: Direct unmitigated solar radiation entering glass facades between 14:30 and 17:30 in tropical and subtropical latitudes.
    * *Target Variable*: Extreme thermal discomfort, building facade heat retention, air conditioning overload, and spiked utility expenses.
20. **Reclame Aqui Complaint Density against Regional Water/Electric Utilities**:
    * *Underlying Signal*: Consumer complaints regarding localized low water pressure, intermittent water rationing, or voltage surges.
    * *Target Variable*: Fragile micro-grid infrastructure causing burned electronics or dry water storage tanks.
21. **Strava Night-Time Running Density (20:00 - 05:00)**:
    * *Underlying Signal*: Solo runners voluntarily choosing specific streets to exercise after dark.
    * *Target Variable*: Ground-truth empirical collective perception of neighborhood safety and adequate lighting.
22. **Automated Plate Reader / Police Incident Density Rate per Capita**:
    * *Underlying Signal*: High ratio of stolen vehicle recovery or traffic stops per street segment.
    * *Target Variable*: Vehicular theft risk and street parking vulnerability.
23. **Fast-Food Wrapper & Litter Density in Street Gutters**:
    * *Underlying Signal*: Lack of street sweeping frequency combined with high nocturnal transient pedestrian foot traffic.
    * *Target Variable*: Urban blight, storm drain blockage, and rodent/pest infestation risks.
24. **Number of For-Sale / For-Rent Banners on a Single Building Facade**:
    * *Underlying Signal*: Multiple simultaneous vacancies in a single condominium tower.
    * *Target Variable*: Internal building friction, structural disputes, predatory HOA boards, or untenable condo fee increases.
25. **Church / Temple Proximity & Service Schedule**:
    * *Underlying Signal*: Uninsulated acoustic systems during Sunday morning services or weekday evening assemblies.
    * *Target Variable*: Regular acoustic intrusion and sidewalk/street parking congestion on weekends.

### 5.2 Scientific Rigor: Categorization & Bias Mitigation

To maintain intellectual integrity, a data product must never present an indirect signal as an established fact. Every metric in our platform must be explicitly tagged under one of five epistemological categories:

```
+-------------------------------------------------------------------------------------------------+
|                                     EPISTEMOLOGICAL TAXONOMY                                    |
+-------------------+-------------------+-------------------+-------------------+-----------------+
| 1. Direct Obs.    | 2. Proxy Signal   | 3. Model Inference| 4. Forecast       | 5. Causal Claim |
| (Measured ground- | (Correlated       | (Latent feature   | (Forward-looking  | (Mechanistic    |
|  truth attribute) |  indirect marker) |  from ML model)   |  probability)     |  proven cause)  |
+-------------------+-------------------+-------------------+-------------------+-----------------+
```

#### Analytical Biases and Confounders to Guard Against:
1. **Selection Bias (e.g., The Strava Bias)**:
   * *Problem*: Strava users are disproportionately wealthy, male, young, and athletic. Relying solely on Strava heatmaps creates a spatial bias that over-indexes on affluent jogging corridors while misrepresenting safe, working-class family neighborhoods where residents walk to work rather than track athletic workouts.
   * *Correction*: Normalize Strava intensity against IBGE census demographic baselines and public transit commuter flows.
2. **Spatial Bias & Modifiable Areal Unit Problem (MAUP)**:
   * *Problem*: Aggregating crime or noise data by municipal district or police precinct creates arbitrary boundaries. A property located 10 meters inside a "safe" district boundary may be 50 meters away from a high-crime corridor in the adjacent precinct.
   * *Correction*: Use continuous spatial kernel density estimation (KDE) and hexagonal indexing (Uber H3 at Resolution 9 or 10, ~100m cell diameter) independent of political administrative boundaries.
3. **Temporal Bias & Transient Observations**:
   * *Problem*: Touring an apartment on a Saturday afternoon reveals a tranquil, sunlit oasis. It fails to observe that at 07:30 on Monday, the street becomes a high-speed diesel bus corridor, or that at 23:00 on Friday, a nearby church or bar hosts an open-air event.
   * *Correction*: Require temporal multi-sampling or simulate 24-hour diurnal and weekly cycle curves from continuous time-series data.
4. **Survivorship Bias in Business Longevity**:
   * *Problem*: Assuming an area is commercially stable because existing restaurants have been open for 10 years, ignoring that dozens of adjacent retail spaces have rotated tenants every 6 months.
   * *Correction*: Calculate retail turnover velocity and vacancy duration from cadastral and CNPJ registry changes rather than observing surviving businesses alone.
5. **Confounding in Noise vs Convenience**:
   * *Problem*: High ambient decibels correlate with high commercial convenience and walkability. A simplistic model penalizing all noise will steer users away from vibrant, walkable urban centers into sterile, car-dependent suburbs.
   * *Correction*: Decouple daytime commercial foot-traffic acoustics from nocturnal sleep-disrupting low-frequency acoustic shocks.
