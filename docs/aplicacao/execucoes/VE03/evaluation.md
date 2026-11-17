# VE03 — Evaluation record

## Objective and scope

Link homes to entrances, crossings and paths (plan §7, VE03; applications A05, A09): turn address-level facts into path-level facts without re-solving listing import. Work packages VE03.01–04.

**Entry dependency:** VE02 verified — dated OSM extract `nordeste-261113.osm.pbf` archived with MD5/SHA-256, official street network and street-name linker, publication/rollback path, G-BUILDING set (VE00).

**Acceptance (plan):** review G-BUILDING and G-ROUTE; report precision and coverage separately by area; exercise corners, dual carriageways, overpasses, stairs, gates, closed/private ways, disconnected components and graph version changes; no known impossible path in enabled examples; a centroid-within-50 m statistic does not pass the entrance test.

## Work packages

| ID | State | Delivered | Evidence |
|---|---|---|---|
| VE03.01 Identity backbone | done (unreviewed) | [frentes.mjs](../../../../scripts/dados/rede/frentes.mjs): candidate frontages per official street code measured from the building **outline** (not the centroid); the frontage of the building's own cadastral street is primary; every other street within 15 m is kept as an additional frontage (corners); any frontage or network connector that would cross an official water polygon is refused with the water body's name; reviewed corrections and OSM-mapped entrances are kept apart from the raw centroid with an `origem` label | [rede.json](rede.json), publication `frentes.json.gz` |
| VE03.02 Connected network | done | Dependency-free PBF reader ([pbf.mjs](../../../../scripts/dados/rede/pbf.mjs)) over the archived extract; walking rules and graph ([grafo.mjs](../../../../scripts/dados/rede/grafo.mjs)): foot/access semantics (`foot` overrides `access`; private, `foot=no`, motorway, construction excluded; customers/destination kept as "restricted" and excluded from routes by default), blocking barriers on nodes, connection only through shared nodes (overpasses, bridges and tunnels never join what they cross), flags for steps, bridge, tunnel, major road, marked crossing, restricted, no-sidewalk; official street-code lineage per OSM way by name + neighbourhood polygon | rede.json `grafo`, `linhagem` |
| VE03.03 Routing baseline | done | Dijkstra with multi-source/target points on edges (entrance and destination snapped to the nearest point of an edge, not a node); scenarios default, no steps, and major-road penalty 1.5; walking speeds 1.2 and 0.8 m/s; route summaries (metres, minutes, steps, bridges, major-road metres, marked crossings) | G-ROUTE results, [g-route-caminhos.geojson](../../evaluation-sets/g-route-caminhos.geojson) |
| VE03.04 Review queue and publication | done | Queue ranks weak/medium building links by households × class weight and ways over water without a bridge tag by households whose routes use them; [correcoes.json](../../../../scripts/dados/rede/correcoes.json) persists reviewer corrections (entrance point, blocked way) and changes the network version; publication `rede-pedestre` (immutable version, manifest, atomic pointer); review sheet [g-building-revisao.csv](../../evaluation-sets/g-building-revisao.csv) with map links and blank review columns | publication `c05c3ba9033e9fd9` |

## Commands actually run

```
node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/rede/testes/rede.test.mjs scripts/dados/observacoes/testes/pipeline.test.mjs   # 48/48
node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/rede/rodar-rede.mjs --relatorio docs/aplicacao/execucoes/VE03/rede.json   # 4 full runs; last two identical
npx eslint scripts/dados/rede scripts/dados/observacoes   # 0 problems after fixes
```

Plus diagnostic one-off scripts (PBF framing hex dump, field traces, suspect-edge tag inspection). No network use in VE03; no app code changed, so Jest/typecheck were not rerun for this epoch.

## Results

**Engineering correctness.** 15 network tests (synthetic PBF bytes and synthetic geography) + 33 VE02 pipeline tests pass. Covered: PBF dense nodes/ways/tags with skipped `denseinfo`/`info` messages; motorway, construction, `foot=no`, private exclusion; `foot=yes` overriding private; customers-only restricted unless explicitly allowed; one-way roads walkable both ways; steps used by default and avoided in the no-steps scenario (longer path); overpass without shared node not connected; disconnected component → no route; private gate blocks, `foot=yes` gate passes; dual carriageway crossed only at the marked crossing; corner building with primary + additional frontage; canal refusal; reviewed correction applied without touching the centroid; network version stable for equal inputs and changed by extract, rules or corrections. Two full runs produced the same network version (`e8a0c30a51ab6cce`) and publication version (`c05c3ba9033e9fd9`).

**Defects found and fixed.** (1) PBF reader: `this.pos += this.varint()` read the old position before the varint advanced it, so every skipped length-delimited field landed short — found on the first real block, fixed, covered by the synthetic-PBF test. (2) Detour ratio used the building centroid as the straight-line origin while routes start at the entrance — produced an impossible 0.51 (network shorter than straight line); fixed to the entrance point; all ratios now 1.07–2.87. (3) One test point was closer to a steps edge than to the street (test error, not code). (4) "OSM entrance nearby" was first measured from the centroid with a 60 m radius — too loose; replaced by entrances lying on the building outline.

**Data validity — network.** Extract: 66.4 M nodes, 6.35 M ways; Recife + ~1.5 km margin: 1.63 M nodes, 55,239 road/path ways. Graph: 273,529 nodes, 300,703 edges, 298 components, main component 98.2 % of nodes; 1,731 ways excluded for permission; 255 segments cut by blocking barriers; 3,296 segments dropped at the margin (node outside the box). 58.9 km of steps, 72.1 km of bridge, 2,604 marked crossing nodes, 3,768 barrier nodes. Lineage: 18,922 of 32,590 named way-pieces linked to an official street code (name + neighbourhood); 2,105 ambiguous; 10,998 unmatched (many outside Recife's official network, in the margin).

**Data validity — buildings, by area** (classes are automatic, not reviewed):

| Area | Buildings | strong | medium | weak | with extra frontages | with a water-refused frontage | OSM-address identity proxy (agree/comparable) |
|---|---|---|---|---|---|---|---|
| Boa Viagem | 1,879 | 1,761 | 105 | 13 | 932 | 61 | 139/141 (median 5 m) |
| Casa Forte | 82 | 78 | 3 | 1 | 43 | 0 | 4/4 (7 m) |
| Graças | 291 | 285 | 6 | 0 | 130 | 5 | 148/149 (4 m) |
| Espinheiro | 156 | 151 | 5 | 0 | 52 | 0 | 1/1 (2 m) |
| Madalena | 280 | 241 | 38 | 1 | 128 | 10 | 18/20 (8 m) |

The identity proxy compares cadastral buildings with OSM buildings carrying the same street and number (310/315 within 40 m); it is an independent-source agreement, **not** a reviewed label. **Entrance precision is not measured:** only 2 pilot buildings have an OSM-mapped entrance on their outline, and both are 26 m and 38 m from the automatic candidate (one likely on the building's other street). The automatic candidate is a frontage point, not a verified entrance; those 2 buildings now use the mapped entrance.

**Data validity — routes.** G-ROUTE (30 routes, 6 per area: nearest GTFS stop, nearest official square/park, nearest destination across an official water body): 29 routed, 1 not routed because its origin (5690-1013, no own-street frontage within 60 m) has no supported link — correctly no path claim. 0 impossible paths (no forbidden or restricted way); all 11 routed water crossings use bridge-tagged ways; detour ratios 1.07–2.87; the major-road penalty removed 23–285 m of major-road walking on 8 routes; no G-ROUTE route uses steps. Broad check — every pilot building to its nearest stop: 2,684/2,688 buildings routed, **0 impossible**, 32 routes (Boa Viagem 30, Madalena 2) pass over a water polygon on a way without a bridge tag. Across the pilot area 175 such way pieces exist (mostly footways/paths along canal banks, some streets possibly missing a bridge/culvert tag, e.g. Rua Tenente João Cícero over the Rio Jordão); the 8 that real routes use are in the review queue.

**Customer usefulness.** Not exercised: nothing reaches the app in VE03. The value is the foundation for VE04 essentials and later route claims.

**Operating viability.** Full run 68–74 s, peak RSS ~0.9 GB (PBF read 34 s, lineage 22 s, broad routing 10 s). Publication 5.3 MB (graph 5.0 MB gzip). No network, no spend, no human review time.

## Reviews

1. **Correctness/failure modes:** connectivity only at shared nodes; private/forbidden edges excluded and re-checked on every route; water crossings refused at the building connector and flagged on routes; uncertain links never produce a route claim (the one unlinked origin got none); corrections persist and version the network.
2. **Customer clarity (forward-looking):** the network can support "N minutes on foot, crossing X", but customers should only see it where the entrance link is strong or reviewed; medium/weak links should show the destination and straight-line distance without claiming a walk.

## Remaining work and outcome

- Human review of G-BUILDING (50 buildings; sheet ready) and G-ROUTE (30 paths; GeoJSON ready) to measure entrance and route precision per area; record answers into `correcoes.json` and the sheet.
- Review the 180-item queue starting with the 8 water-crossing ways and the 14 weak links.
- Sidewalk sides and kerb/ramp accessibility are not modelled (only `sidewalk=no` on major roads is flagged); no step-free claims are possible.

**State: partial** — all four work packages are implemented and the automated acceptance items pass (exercises, no known impossible path, versioning), but the required G-BUILDING/G-ROUTE review has not been performed, so precision by area is unmeasured. **Outcome: iterate.** VE04 can start its engineering on candidate entrances, with the constraint that only strong or reviewed links may support walking claims.
