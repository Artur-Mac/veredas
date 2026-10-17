## 22. Deep-Dive into the ZAP Scraper Dataset as an Experimental Laboratory

A single snapshot of real estate listings provides only static, biased inventory data. However, **a longitudinal time-series dataset produced by continuous web scraping** (capturing repeated snapshots, listing revisions, price cuts, and disappearance events) transforms raw portal listings into a powerful macroeconomic and forensic laboratory.

Below, we detail **110 rigorous research questions** structured across five analytical disciplines.

```
+---------------------------------------------------------------------------------------------------+
|                                  THE 110-QUESTION ZAP EXPERIMENTAL SUITE                          |
+--------------------------+--------------------------+---------------------------------------------+
| • 30 EDA Questions       | • 20 Anomaly Questions   | • 20 Predictive Questions                   |
| • 20 Temporal Questions  | • 20 Spatial Questions   | Total = 110 Quantitative Laboratory Hypotheses|
+--------------------------+--------------------------+---------------------------------------------+
```

### 22.1 30 Exploratory Data Analysis (EDA) Questions
1. What is the empirical distribution of asking price per square meter ($/m²) across neighborhoods, and does it exhibit log-normal, bimodal, or fat-tailed behavior?
2. What is the true correlation between stated condominium fee (*condomínio*) and advertised usable area (*área útil*) within the same construction decade?
3. What percentage of active listings fail to report the monthly condominium fee or report it as R$ 0 or R$ 1?
4. What is the ratio between usable area (*área útil*) and total area (*área total*), and does this ratio diverge significantly between modern towers and pre-1990 buildings?
5. How does the number of reported parking spaces (*vagas de garagem*) scale with apartment area, and at what square meter threshold does a 2nd or 3rd space become standard?
6. What is the frequency distribution of listing descriptions containing specific concession keywords (*"motivo viagem"*, *"porteira fechada"*, *"urgente"*, *"aceita permuta"*)?
7. What proportion of listings are posted by corporate real estate agencies (*imobiliárias*) versus individual brokers (*corretores autônomos*) versus direct property owners?
8. How many listings share identical or near-identical text descriptions across different listing IDs in the same neighborhood?
9. What is the distribution of photo counts per listing, and does photo count correlate with asking price per square meter?
10. What percentage of listings utilize virtual staging, 3D renderings, or architectural blueprints instead of real physical photographs?
11. How do asking prices differ between ground-floor units, intermediate floors, and top-floor/penthouse units within the same building?
12. What is the empirical spread between the mean and median asking $/m² within individual census tracts?
13. How frequently do listings report IPTU property tax values, and what is the typical ratio of annual IPTU to property asking price?
14. What are the most common unlisted attributes that appear in text descriptions (e.g., *"varanda gourmet"*, *"vista definitiva"*, *"sol da manhã"*) but lack structured database tags?
15. What percentage of listings display fuzzed, truncated, or incomplete street addresses (e.g., showing only the street name or neighborhood without a building number)?
16. How does the distribution of suite bedrooms (bedrooms with private ensuite bathrooms) vary across different price deciles?
17. What is the proportion of residential listings that represent studio apartments (*kitnets / studios*) versus traditional 2-to-3 bedroom family apartments?
18. How does the advertised price per square meter correlate with the age of the building when year-of-construction data is available?
19. What is the frequency of duplicate image assets across listings with different advertised prices in the same geographic grid cell?
20. How do condominium fees vary between high-density towers (>100 units) and low-density boutique buildings (<20 units) with identical amenity packages?
21. What percentage of listings explicitly mention the availability of a 24-hour concierge (*portaria 24h*) versus virtual remote concierge (*portaria remota*)?
22. How does the presence of a balcony (*varanda*) impact asking price per square meter within the same building typologies?
23. What is the empirical distribution of bathroom counts relative to bedroom counts across different historical construction eras?
24. How often do listings report conflicting operations (e.g., simultaneously listed for sale and for rent), and what is the typical implied capitalization rate (annual rent / sale price)?
25. What percentage of listings explicitly state that the property is eligible for mortgage financing (*"aceita financiamento"* / *"documentação 100% regular"*)?
26. How do asking prices per square meter vary across different cardinal facade orientations when orientation is mentioned in listing text?
27. What is the frequency of listings offering furnished (*"mobiliado"*), semi-furnished (*"armários planejados"*), or bare (*"no contrapiso"*) interiors?
28. How does the ratio of asking rent to total carrying cost (Rent / [Rent + Condomínio + IPTU]) vary across price tiers?
29. What proportion of listings feature floor plans or architectural layouts in their image carousel?
30. What is the distribution of broker contact methods (direct WhatsApp click-through versus generic web portal contact forms)?

### 22.2 20 Anomaly Detection Questions
31. How can we algorithmically flag "phantom listings" that remain active on portals months after the property has been legally sold or leased?
32. What mathematical threshold of price-per-square-meter residual ($\epsilon_i = P_i - \hat{P}_i$) distinguishes an authentic "bargain" from a listing with severe unadvertised legal debt?
33. How can we identify artificial price manipulation where a broker temporarily inflates an asking price before immediately cutting it by 15% to trigger "price drop" portal badges?
34. Which listings exhibit anomalous condominium fees relative to their building peers ($Z_{	ext{condo}} > +3.0$ or $Z_{	ext{condo}} < -2.5$)?
35. How can perceptual image hashing (pHash) detect identical apartments listed under different neighborhoods or fuzzed coordinates?
36. Which listings claim unrealistic usable square footage relative to their bedroom and bathroom counts (e.g., claiming 120m² for a 1-bedroom flat)?
37. How can we detect fraudulent or scam listings that harvest user deposits using stolen photos from luxury Airbnb units?
38. Which listings display anomalous text sentiment (e.g., excessive legal disclaimers, arbitration clauses, or mentions of judicial disputes)?
39. How can we flag listings where the advertised address coordinates fall into a river, ocean, public park, or industrial zone?
40. Which properties exhibit anomalous days-on-market survival trajectories (>360 days) despite operating in a high-velocity, high-demand neighborhood?
41. How can we detect discrepancies where the listing description claims "luxurious new finishes" but computer vision classifies 1970s ungrounded electrical sockets?
42. Which listings show sudden, unexplained jumps in monthly condominium fees across successive scraping snapshots?
43. How can we detect listings where the advertised price abruptly doubles or cuts in half due to broker data entry typos?
44. Which properties exhibit an anomalous ratio between sale price and rental price within the same building, indicating mispriced assets?
45. How can we identify broker accounts that post hundreds of duplicate listings with identical text across different zip codes?
46. Which listings feature photos where the window views contradict the building's physical geographic surroundings (e.g., mountain views in a coastal delta)?
47. How can we detect listings that omit mandatory legal disclosures regarding un-regularized construction expansions?
48. Which properties display an anomalous ratio of parking spaces to square meters (e.g., a 45m² studio claiming 4 private parking bays)?
49. How can we identify listings where the asking price per square meter is completely disconnected from the municipal fiscal cadastre valuation (*Valor Venal*)?
50. Which listings claim "sea view / vista mar" despite sitting 5 kilometers inland behind dense urban canyons?

### 22.3 20 Predictive Questions
51. Can a computer vision model predicting price residuals from interior photos outperform traditional hedonic models by capturing unobserved "aesthetic renovation quality"?
52. What combination of listing features best predicts the exact number of days a property will remain active before being removed from the portal?
53. Can we predict the final transaction closing price from the initial asking price and historical price revision trajectories?
54. What is the predictive probability that a seller who cuts their price by 5% after 60 days will accept a counter-offer 10% below ask?
55. Can natural language embeddings of listing descriptions predict whether a property will experience a price cut within the next 30 days?
56. Can we forecast future 12-month neighborhood price appreciation velocity from the net change in third-wave cafe and boutique gym business registrations?
57. What is the predictive probability of an upcoming special condominium assessment (*cota extra*) based on building age and monthly fee deviations?
58. Can we predict whether a listing is exclusive to a single broker or syndicated across multiple agencies based on description text structure?
59. How accurately can an automated model predict the true usable floor area from photo counts, room types, and building exterior dimensions?
60. Can we forecast seasonal rental demand spikes in specific coastal neighborhoods based on historical listing turnover cycles?
61. What features predict whether a property will be leased within the first 14 days of listing?
62. Can we predict default risk on rental contracts from the ratio of condominium fees and IPTU to base rent?
63. How accurately can image classification of exterior building facades predict the presence of internal structural concrete carbonation?
64. Can we predict the probability of un-regularized construction expansions from discrepancies between cadastral footprints and listing square meters?
65. What combination of transit access and micro-topography best predicts tenant willingness to pay premiums for parking spaces?
66. Can we forecast when a stale listing will be deactivated and re-posted under a new listing ID to artificially reset its time-on-market?
67. What is the predictive impact of professional wide-angle staging photography on buyer inquiry click-through rates?
68. Can we predict whether a landlord will accept a rental guarantee without a traditional guarantor (*fiador*) based on listing duration?
69. How accurately can we predict monthly air conditioning electricity consumption from window orientation, floor level, and satellite surface temperature?
70. Can we forecast the likelihood of a property sale falling through during due diligence based on historical re-listing frequencies?

### 22.4 20 Temporal / Longitudinal Questions
71. How does the total volume of active listings fluctuate across seasons (e.g., summer vacation periods vs post-Carnival vs year-end)?
72. What is the empirical median survival time of a listing on ZAP Imóveis before deactivation, broken down by rental versus sale?
73. How do price revisions unfold over time: do sellers make frequent micro-cuts or rare, large step-function cuts?
74. At what time-on-market threshold (e.g., 60 days, 90 days, 120 days) does the probability of a seller accepting a major concession spike?
75. What percentage of "new" listings appearing on any given day are genuine new inventory versus recycled stale listings re-posted under a new ID?
76. How did average asking prices per square meter evolve across individual census tracts following major interest rate (Selic) hiking cycles?
77. What is the historical velocity of condominium fee inflation over a 3-year scraping horizon, and does it exceed official consumer price inflation (IPCA)?
78. How does the time-of-week a listing is published (e.g., Friday afternoon vs Monday morning) impact its initial view velocity and days-on-market?
79. How quickly do listings in flood-vulnerable micro-zones experience price cuts following major documented urban flood disasters?
80. What is the typical life cycle of a cosmetic house flip: how many months elapse between the original acquisition and the re-listing at an inflated price?
81. How do rental asking prices respond to local university academic calendars in neighborhoods adjacent to major university campuses?
82. What is the temporal lag between a municipal transit infrastructure announcement (e.g., new metro station) and listing price inflation along the corridor?
83. How do price revision frequencies differ between institutional corporate landlords and individual retail property owners?
84. What happens to the asking prices of surrounding properties when a luxury residential development breaks ground on a neighboring block?
85. How do days-on-market distributions change during macroeconomic credit tightening versus loose credit cycles?
86. What is the survival rate of new brokerage firms entering a neighborhood market over a 24-month scraping timeline?
87. How does the proportion of furnished rental listings change over time in response to tourism and short-term rental market dynamics?
88. What is the frequency of price increases (rather than cuts) on active listings, and what drives sellers to raise asking prices?
89. How does the seasonal onset of the winter wet season impact listing descriptions mentioning water features or balcony leisure?
90. What is the longitudinal turnover rate of ground-floor commercial listings versus upper-floor residential listings on the same street?

### 22.5 20 Spatial / Geospatial Questions
91. What is the empirical spatial decay rate of asking prices per square meter as distance from the ocean coastline increases in Boa Viagem?
92. Where are the sharpest spatial price discontinuities (*price cliffs*) located across administrative neighborhood boundaries?
93. How do asking prices per square meter vary across micro-elevation gradients (e.g., properties on elevated ridges vs properties in concave drainage bowls)?
94. What is the spatial clustering of duplicate multi-broker listings, and do certain micro-neighborhoods exhibit higher broker fragmentation?
95. How does proximity to dedicated public transit corridors (BRT / Metro) alter spatial price gradients when controlling for building age?
96. Where are the geographic clusters of listings that report zero condominium fees, and do they align with specific informal or horizontal housing typologies?
97. How does the density of active listings per square kilometer correlate with local commercial vibrancy and pedestrian footfall?
98. What is the spatial relationship between historical 156 municipal clogged drain tickets and listing price discounts along specific street segments?
99. How do spatial price surfaces vary across the boundary of the "Lei dos 12 Bairros" height restriction zones in Recife?
100. Where are the micro-geographic clusters of listings that feature private swimming pools and leisure amenities?
101. How does the spatial distribution of pet-friendly rental listings align with municipal dog parks and veterinary clinic density?
102. What is the spatial buffer distance around major hospital emergency rooms where residential asking prices exhibit acoustic siren penalties?
103. Where are the sharpest spatial boundaries between high-rise condominium towers and Special Zones of Social Interest (ZEIS)?
104. How does street width and street canyon aspect ratio spatially correlate with price per square meter within identical zoning categories?
105. What is the spatial correlation between satellite-derived Land Surface Temperature (LST) and residential asking prices during summer months?
106. Where are the spatial clusters of listings that advertise unobstructed views (*"vista livre" / "vista definitiva"*), and what is their empirical price premium?
107. How does the spatial network centrality (Space Syntax integration) of a street segment correlate with ground-floor commercial rent per square meter?
108. What is the spatial buffer of property price depression surrounding active freight rail lines and industrial railyards?
109. Where are the geographic boundaries where the proportion of rental listings exceeds the proportion of sale listings?
110. How do spatial price gradients behave across municipal border lines between Recife, Olinda, and Jaboatão dos Guararapes within contiguous urban fabric?
