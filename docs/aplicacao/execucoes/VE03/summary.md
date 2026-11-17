# VE03 — Summary

VE03 (Entrance and pedestrian network) is **partial**. Every work package is implemented and the automated checks pass, but no person has yet reviewed the entrances and routes. Before this epoch the app knew a building's centroid and street name, and nothing about how anyone walks from it. Delivered:
- **A dependency-free reader** for the archived dated OSM extract ([pbf.mjs](../../../../scripts/dados/rede/pbf.mjs)): 66.4M nodes in about 34 s.
- **A walking network for Recife plus a margin** ([grafo.mjs](../../../../scripts/dados/rede/grafo.mjs)): 273,529 nodes and 300,703 edges, with 98.2% in one connected component.
  - Access rules: `foot` overrides `access`; private ways, `foot=no` and motorways are excluded; customers-only ways are kept but kept out of default routes; blocking gates and walls cut edges.
  - Connectivity: ways connect only where they share a node, so overpasses never join what they cross.
  - Each segment carries flags for steps, bridge, tunnel, major road and marked crossing, plus its official street code.
- **An identity backbone** ([frentes.mjs](../../../../scripts/dados/rede/frentes.mjs)) for all 2,688 pilot buildings:
  - frontages measured from the building outline, with the building's own street as primary and other streets within 15 m kept for corners;
  - 76 buildings with at least one frontage refused because it would cross a canal or river;
  - entrance candidates snapped to the nearest point of an edge;
  - OSM-mapped entrances preferred where they exist.
- **Offline routing** with no-steps and fewer-major-roads scenarios.
- **A 180-item review queue**, ranked by the households affected.
- **A versioned corrections file**, so reviewer fixes persist across runs.
- **A versioned publication** (`rede-pedestre`, `c05c3ba9033e9fd9`).
- **Review materials:** a [G-BUILDING sheet](../../evaluation-sets/g-building-revisao.csv) with map links and a [G-ROUTE GeoJSON](../../evaluation-sets/g-route-caminhos.geojson).

Nothing changes in the app yet. The network is the foundation for walkable essentials in VE04.

Checks run:
- **Node tests:** 48/48 (15 network, 33 pipeline). They build PBF bytes and synthetic streets covering corners, canals, a dual carriageway, an overpass, steps, private gates and ways, customers-only access, a disconnected component, network versions and corrections.
- **Reproducibility:** two full runs produced the same network and publication versions.
- **Defects fixed:** a decoder bug (a position read before it advanced), an impossible detour ratio caused by using the centroid instead of the entrance, a test-point error, and an over-loose entrance comparison.

Results on real data:
- **Link classes by area** (automatic, not verified):

  | Area | Strong | Medium | Weak |
  |---|---|---|---|
  | Boa Viagem | 1,761 | 105 | 13 |
  | Casa Forte | 78 | 3 | 1 |
  | Graças | 285 | 6 | 0 |
  | Espinheiro | 151 | 5 | 0 |
  | Madalena | 241 | 38 | 1 |

- **Identity proxy:** 310 of 315 buildings that also carry an address in OSM sit within 40 m of the cadastral building (median 2–8 m).
- **Entrances:** the only 2 OSM-mapped entrances on pilot outlines are 26 m and 38 m from my candidate, so **entrance precision is unmeasured and possibly weak**.
- **G-ROUTE:** 29 of 30 routed. The missing one has no supported origin link, so no path is claimed. There are 0 impossible paths, all 11 water crossings use bridge-tagged ways, and detours run 1.07–2.87.
- **Broad check:** 2,684 of 2,688 buildings route to their nearest bus stop with 0 impossible paths. 32 of those routes pass over water on ways without a bridge tag, and the 8 ways involved are queued for review.
- **Cost:** a full run takes about 74 s and 0.9 GB of memory, with no spend, no network and no human review.

No field walk or customer evidence exists ([evaluation](evaluation.md), [measurements](measurements.json)).

Decision: **iterate**. The network, rules, routing and publication are ready to build on. The missing acceptance item is a person reviewing the 50 G-BUILDING entrances and 30 G-ROUTE paths in the prepared sheet, then the queue's 8 water ways and 14 weak links. Corrections go into `scripts/dados/rede/correcoes.json`. Sidewalk sides, kerbs and ramps are not modelled, so no step-free claim is possible.

The next eligible epoch is **VE04 (essentials and an independent plan B)**, for engineering. It must only claim a walk where the entrance link is strong or reviewed. Its first task, VE04.01, is to extract grocery, pharmacy, park and transit-access candidates from the same archived extract. Those are then merged with the municipal and CNEFE records into canonical venues, and a G-POI set of at least 40 venues is drawn for review. The dependency is the same: a person to review G-POI and the VE03 sheets.
