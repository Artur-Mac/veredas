# VE04 — Evaluation record

## Objective and scope

Deliver essentials on foot with a real plan B (plan §7, VE04; applications A06–A08): for each home, which daily destinations fit on foot, which bridge the walk depends on, and whether the backup avoids that same bottleneck.

**Entry dependencies:** VE01 verified (decision brief). VE03 partial: network, frontages and routing exist; entrance precision is unreviewed. Per D020, walking times are produced only for buildings whose entrance link is strong (automatic) or reviewed; the rest get the nearest venue in a straight line with no walking claim.

**Acceptance (plan):** evaluate G-POI and G-ROUTE; cover duplicates, closed venue, missing hours, unsuitable public entrance, same-chain-but-distinct venue and shared bottleneck; show coverage by building/category, not only POI totals; the errands feature must reduce actual path distance/time under identical assumptions.

## Work packages

| ID | State | Delivered | Evidence |
|---|---|---|---|
| VE04.01 Destination catalogue | done (unreviewed) | [catalogo.mjs](../../../../scripts/dados/destinos/catalogo.mjs): categories from tags only (grocery: supermarket/convenience/greengrocer/grocery/wholesale/deli/marketplace; pharmacy; park/garden; transit), closed venues excluded and counted, duplicates merged only on equal names within 60 m or an unnamed copy within 25 m, mapped public entrances preferred over outlines and service/emergency/exit entrances ignored, hours only when a source states them. Sources: archived OSM extract, Prefeitura (17 street fairs with days/hours, 6 public markets, 11 Farmácias da Família — fetched live through the VE02 collector with field whitelists, 3 requests), official squares/parks (413 squares + 19 parks; green strips excluded), GTFS v2026.10.26 stops with at least one scheduled trip | [destinos.json](destinos.json) |
| VE04.02 Reachability | done | [alcance.mjs](../../../../scripts/dados/destinos/alcance.mjs): bounded Dijkstra (2 km) on the VE03 published graph (same indices as the entrances), from each strong/reviewed entrance to each category; minutes at 1.2 m/s; straight-line nearest only for the other buildings | coverage table below |
| VE04.03 Independent plan B and errands | done | Critical segments = bridge/tunnel edges on the route to the nearest venue; plan B = nearest other venue of the category reachable with those segments forbidden; the naive second-nearest is checked for sharing them. Chain home → grocery → pharmacy → home over the 3 nearest of each vs separate trips to the nearest | 2,514 chains, 0 longer than separate trips |
| VE04.04 Product integration | done | App payload `src/dados/recife/essenciais/eb4dd0621958f6be/<area>.json` (1.11 MB for the five areas; per-area lazy load; Zod schema in [essenciais.ts](../../../../src/dados/recife/essenciais.ts)); dossier Entorno section "A pé, a partir da entrada" ([DiaADia.tsx](../../../../src/componentes/dossie-v1/DiaADia.tsx)); Compare brief gains a "dia a dia" material difference (≥ 5 min in one category, both homes with network walks) and uses it for "visit first" when cost and space do not separate the homes. No new input, onboarding or permission | rendered checks, screenshots `out/ve04/` |

## Commands actually run

```
node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/destinos/rodar-destinos.mjs --ao-vivo --relatorio …   # first run, 3 CKAN requests
node … scripts/dados/destinos/rodar-destinos.mjs --relatorio docs/aplicacao/execucoes/VE04/destinos.json                                         # 2 offline reruns (payload compaction, format version)
node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/destinos/testes/destinos.test.mjs scripts/dados/rede/testes/rede.test.mjs scripts/dados/observacoes/testes/pipeline.test.mjs   # 60/60
npx jest --runInBand tests/essenciais.test.ts tests/decisao.test.ts tests/telas-fatia5.test.ts tests/dossie-tela.test.ts
npm run typecheck && npm run lint && npx jest --runInBand    # 0 errors; 0 errors/5 pre-existing warnings; 57/57 suites, 1480/1480
POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE04/scripts/ve04-render.mjs   # 375 and 360 px
POC_URL=http://localhost:8087 SMOKE_OUT=out/ve04/v1-smoke node scripts/v1-smoke.mjs         # 50/50
```

## Results

**Engineering.** Node tests 60/60, including the plan's fixtures: duplicate node + outline merged with both sources; same chain 300 m apart kept as two venues; different names 8 m apart kept apart; closed venues (`disused:`, `shop=vacant`, `opening_hours=closed`, "(fechada)") excluded with their category; missing hours stay null; service/emergency/exit/garage entrances refused; shared bottleneck (home and two venues on opposite sides of one bridge: the naive second venue shares the bridge, the plan B is the venue on the home side); search limit; chain 600 m vs 1,100 m separate. Jest 1,480/1,480 (10 new: real payload validity for all five areas, straight-line buildings never carry minutes, sentence templates, brief difference and headline). G-COMPARE 20/20 unchanged.

**Data validity — catalogue.** 7,748 candidates → 7,272 canonical venues (476 merges, mostly official squares also mapped in OSM; 335 venues have more than one source); 2 venues closed in OSM; 29 GTFS stops without scheduled service excluded; 7,241 venues connected to the network. Inside the pilot neighbourhoods: 48 groceries, 53 pharmacies, 90 squares/parks, 221 transit stops. **These counts are what is mapped, not what exists:** a recent field count is not available, and the pharmacy/grocery totals look low for these neighbourhoods, so distances are to the nearest *mapped* venue and can overstate the real walk. Hours exist for 58 groceries, 23 pharmacies and 24 parks (raw text, not interpreted).

**Coverage by building and category** (network walks from strong entrance links; ≤ 10 min = ≤ 720 m at 1.2 m/s):

| Area | Buildings (network / straight) | Grocery ≤10 min | Pharmacy ≤10 min | Park ≤10 min | Transit ≤10 min | Grocery route crosses a bridge | 2nd-nearest grocery on same bridge |
|---|---|---|---|---|---|---|---|
| Boa Viagem | 1,761 / 118 | 1,404 | 1,295 | 1,458 | 1,756 | 335 | 188 |
| Casa Forte | 78 / 4 | 57 | 46 | 78 | 78 | 0 | 0 |
| Graças | 285 / 6 | 285 | 284 | 285 | 285 | 9 | 2 |
| Espinheiro | 151 / 5 | 151 | 151 | 151 | 151 | 3 | 0 |
| Madalena | 241 / 39 | 241 | 238 | 241 | 241 | 0 | 0 |

Median walking minutes to the nearest mapped grocery: Boa Viagem 5.6, Casa Forte 7.3, Graças 4.8, Espinheiro 4.2, Madalena 3.7; pharmacy 6.0 / 9.5 / 4.0 / 3.4 / 4.1. Every bridge-dependent route found an independent plan B within 2 km. Errand chains: 2,514 compared, **0 longer than separate trips**; median saving 357–504 m by area; material saving (≥ 300 m and ≥ 15 %) for 1,713 buildings.

**G-ROUTE (VE03) consistency.** For the 9 G-ROUTE "nearest stop" routes whose origin has a strong link, VE04's network-nearest stop is never farther than the VE03 route to the straight-line-nearest stop (0 violations); in 4 cases it is closer (e.g. GR01: 92 m vs 290 m). GR10's origin is a medium link and is correctly treated as straight-line only.

**G-POI.** 44 venues (2 per area and category by SHA-256 order, plus 6 merged duplicates and 1 venue closed in OSM) with a review sheet ([g-poi-revisao.csv](../../evaluation-sets/g-poi-revisao.csv)). **Not reviewed**: category, operation and entrance accuracy are unmeasured; the ≥ 90 % target cannot be assessed yet.

**Rendered review and fixes (web, 375 and 360 px).** First renders exposed: (1) the Compare headline said "os dois ficam próximos" right above "Graças fica a 1 min a pé de uma farmácia; Casa Forte, a 14 min" — now the walking difference drives "Visite primeiro Graças" with the reason; (2) the dossier named the same bridge three times — now once for the section, and rows say "Passa pela ponte. Sem ela: …"; (3) 6,731 GTFS stops carry only numeric codes ("Parada 010208") — now "Ponto de ônibus", and named terminals drop the code suffix; (4) the payload version ignored a format change — format now part of the version; (5) the dev server served a stale bundle until restarted (environment, not code). Final renders: section and brief present, 0 px overflow, 0 external requests, 0 page errors; v1 smoke 50/50.

**Customer usefulness.** No participants. Expert reading: the dossier answers "how far is the shop, and what if the bridge closes" in one screen; the brief now recommends a visit order when only daily life separates two homes. Whether people trust "mapped" distances with one source caveat remains to be observed.

**Operating viability.** Pipeline 100 s (OSM pass 21 s, merge and snapping 24 s, reachability 52 s), peak RSS 1.17 GB; 3 live CKAN requests on the first run; app payload 1.11 MB across five lazily loaded files (Boa Viagem 782 KB); no spend; no human review time.

## Remaining work

- Review G-POI (44 venues) and the VE03 sheets; measure category/operation/entrance precision per area; add venues missing from the map as corrections (needs a corrections path for venues, mirroring `scripts/dados/rede/correcoes.json`).
- Measure catalogue completeness against an independent count for at least one neighbourhood before stating availability numbers anywhere outside the dossier's "nearest mapped" wording.
- Opening hours are shown as raw text; time-window reasoning (closed now, Sunday) is not implemented.
- Payload size per area (Boa Viagem 782 KB) should be checked on a low-end device (D009).

## Outcome

**State: partial** — all four work packages are implemented and the automated acceptance items pass (fixtures, coverage by building/category, chain never longer than separate trips, G-ROUTE consistency), but G-POI is unreviewed and venue completeness is unknown. **Outcome: iterate.**
