# VEREDA — Feature register (VE17)

Every feature enabled in the app, with its data, how that data is updated, who owns it and its programme status. Owners are **roles**: no named person has been assigned in this work, and the plan does not invent one. Before a public release, each role needs a person.

- **Product lead:** screens, wording, decision logic, participant studies.
- **Data lead:** sources, the update cycle, review sheets, coverage.
- **Platform:** storage, backup, offline, native builds.

Update policies refer to the [update runbook](RUNBOOK-ATUALIZACAO.md). "Cycle" means `scripts/dados/ciclo.mjs`; "index" means the municipal building index rebuild (`construir-indice-recife.mjs` → `ativar-indice-municipal.mjs`), which is outside the cycle.

## Explorar

| Feature (screen) | Code | Data | Update policy | Owner | Status |
|---|---|---|---|---|---|
| One input: listing URL **or** search by building name, street or bairro (pilot bairros unless a bairro is named); results open a building "Raio-X" without a listing (no price, no credit) | `inicio/Explorar.tsx`, `localizar.ts`, `raioX.ts` | index partitions (D036) | index, quarterly | product | iterate (web verified 1280/360) |
| "Usar minha localização agora": nearest index building within 250 m; position used once, never stored | `localizar.ts`, `caixasDosBairros.ts` | index + bairro boxes | rerun `caixas-dos-bairros.mjs` after each index activation | product | iterate (real GPS on devices pending) |
| Three example addresses (Boa Viagem beachfront, Graças 1972 resale with ITBI, Madalena street with 156 drainage requests), open with an empty notebook, collapsed otherwise | `EXEMPLOS` in `raioX.ts` | index | fixed ids; test fails if one disappears | product | iterate |
| Card triage: Favoritar, Anotar (notebook diary), Descartar, stage (Triagem / Visita / Visitado / Negociando) and stage filter | `TriagemDoCartao`, `triagem.ts` | on device | user | product | iterate |
| Onde mais procurar no piloto, as soon as the household profile has a destination (7 a.m. scheduled trip, 20/30/45 min) | `OndeMaisProcurarNoPiloto` | cycle: procura | cycle monthly | data | iterate |

## Dossier

| Feature (screen) | Code | Data | Update policy | Owner | Status |
|---|---|---|---|---|---|
| Ficha viva do edifício (before the tabs): 15-second pills (surface heat vs. bairro, elevation and nearest mapped water, day/night noise sources) and five facts with source: scale and age, structural records, ITBI per unit vs. asking price, condo fee/m² vs. same-age buildings **in the user's own notebook** (median ± MAD, needs 5), climate and surroundings (LPUOS neighbour potential: no published reading) | `FichaViva`, `fichaViva.ts` | index, Landsat 100 m, Copernicus DEM, ESIG, notebook | follows its sources | product | iterate |
| Linha do tempo da estrutura (Edifício tab): chamado → vistoria → laudo ART/RRT → interdição → reparo → liberação with literal document, number and date; question for the síndico | `LinhaDoTempoEstrutural`, `linhaDoTempo.ts` | documents and occurrences the user stored and linked to this property | user | product | iterate |
| Andar × fachada simulator (Entorno): house/apartment, floor, 3×3 compass; nearest 3 named noise sources with distance and front/side/back relation (**no dB**), direct sun on that façade at that height (equinox, neighbours), south-east breeze and taller neighbour in its path | `SimuladorDaUnidade`, `simuladorDaUnidade.ts` | noite, atrito, environmental layers, index floors | follows its sources | product | iterate (no field check) |
| "Isso bate com a rua hoje?" (Bate / Não bate + optional reason), on device only | `BateComARua` | on device | user | product | iterate |
| Bares, oficinas e comércio em volta: friction (bar/drinks, workshop, supermarket) separated from daily convenience; 2022 construction snapshot | `Servicos`, `atrito.ts` | cycle: atrito (IBGE CNEFE 2022; category only) | when IBGE republishes | data | iterate |
| Census tract income and occupation card shown by default (no extra tap) | `Entorno` | Census 2022 | static | product | iterate |
| Total purchase cost in the cost block: price + ITBI as a 2%–3% range; deed and registry "a confirmar" | `custoPorPartes.ts` (`estimarTransferencia`) | Recife tax code art. 52; Lei 19.490/2026 | check the rate with the Secretaria de Finanças | product | iterate |
| Negotiation arguments the user ticks (ITBI median gap, fees missing from the listing, literal minutes excerpts, surface heat, nearby noise sources) | `Negociacao`, `negociacao.ts` | dossier + notebook | on demand | product | iterate |
| Pacote para especialista (lawyer / inspector): print, `.md`, `.html` | `Pacote.tsx`, `pacoteEspecialista.ts` | dossier + notebook (no household profile, photos or diary) | on demand | product | iterate |
| Top: listing photos, summary, known monthly cost | `Topo`, `Custo` | listing (user), index, ANEEL tariff | listing: user edits; index: quarterly | product | adopt |
| Lot map: 2D plan / 2.5D estimated volume (morning, noon, afternoon), zoom 1–3× around the building pin, drag, tap a works pin for distance and licence status | `MapaDoLote`, `mapaInterativo.ts` | index (lots, floors, works + licence status) | index, quarterly | product | iterate (web verified 375/360; touch drag on devices pending) |
| Price simulator inside the financing pill (entrada 10/20/30/50%, prazo 15/20/30/35 anos; total paid and interest) | `SimuladorPrice`, `custoPorPartes.ts` (`prestacaoPrice`) | BCB SGS 20774 average rate (public references) | with the public references file | product | iterate |
| Destaques | `Destaques` | derived from all blocks | follows its sources | product | adopt |
| Cadastro oficial (IPTU, ITBI, area, year) | `InfoDoImovel`, `cadastro.ts` | index (IPTU 2026, ITBI) | index, quarterly; ITBI and m² never share a line | data | adopt |
| A pé, a partir da entrada (essentials, plan B, errand chain) | `DiaADia` | cycle: rede + destinos | cycle monthly; G-POI review | data | iterate |
| Se a rua alagar (street history, conditional detours, small detours; eSIG catalogue as reference) | `SeAlagar`, `chuva.ts` | cycle: chuva (Defesa Civil ledger 2014–2024 + eSIG points/street list 2026) | cycle after each rainy season; **review the 4 driving records first**; eSIG layers re-fetched with the sources manifest | data | iterate |
| Voltando à noite | `Noite` | cycle: noite (GTFS, lamps, 156, CTTU) | cycle monthly; GTFS before expiry (26 Oct 2027) | data | iterate |
| Obras próximas / mudanças na vizinhança (with licence status: valid until, expired, approved without licence date, under review; impact flag) | `Entorno`, `textos.ts` (`textoDaLicenca`) | index (Licenciamento urbanístico, 24 months; snapshot, not proof of works, P05) | index, quarterly | data | adopt |
| Comparado com o bairro (six classifiers incl. **Sol e sombra**: afternoon sun on lot façades, taller-neighbour shade, Census trees for low buildings) | `Indicadores`, `indicadores.ts`, `solDaTarde.ts` | index + cycle layers | follows its sources | product | iterate (no field check of the sun model yet) |
| A rua: plain-language consequence first; count, detail, source and date behind the tap; ramp/obstacle facts only with "mobilidade" in the household profile | `ARua`, `rua.ts` | index (LUSE, 156 window 20 Jun 2025–19 Jun 2026, lamps, CTTU 2022–2024, coleta, Defesa Civil, Census) | index, quarterly | product | iterate |
| Por perto: registered public equipment (square/park with area, cycle lane, Bike PE, bike rack, municipal health unit, Academia da Cidade, culture, conservation unit; audible signal only with "visão" in the profile); counts and source behind the tap | `PorPerto`, `equipamentos.ts` | cycle: equipamentos (hub 15 Nov 2026, SHA-256 checked; ESIG squares) | cycle; registry, not opening hours or maintenance | data | iterate |
| Household accessibility needs (opt-in, on device only, never shared) | `perfil-domicilio`, `PerfilDomicilio.tsx` | user | user | product | iterate |
| Sol nas fachadas | `SolNasFachadas` | cycle: sol (Edificações lots/floors) | when the Prefeitura republishes | data | iterate |
| De que lado vem o barulho | `Noite` (Edifício) | cycle: noite (main roads, LUSE) | cycle monthly | data | iterate |
| Desde que você guardou | `DesdeQueSalvou` | on-device snapshot + current layers | on demand, no background | product | iterate |
| Preparar a negociação | `Negociacao` | dossier facts + personal notebook | on demand; no external price range | product | iterate |
| Building documents, CNPJ, occurrences, photos, compass, visit | `Edificio`, caderno, `visita-v1`, `sol` | user-entered, private | user | product | keep |
| Minutes / bylaws / statement reader: pasted text or `.txt`; literal excerpts with page (header or footer markers, form feeds), house rules, financial and legal facts, ready questions incl. what the document does not mention | `LeitorDeAta`, `leitorDeAta.ts` | user | user | product | iterate (PDF: paste text; no on-device PDF parser) |
| Visit: up to 3 risk checks on top (water/garage, building over 25 years, internet test) and optional 10-s microphone comparison (open vs. closed window, relative dB only) | `checagensDoRisco.ts`, `MedidorDeRuido` | dossier layers; Web Audio | follows its sources | product | iterate (microphone on real phones pending) |
| Internet onde você vai usar (fibre query by address/block/unit, per-room measurement, Anatel link) | `Conectividade`, `conectividade.ts` | user-entered, private | user | product | iterate (web verified; devices pending) |
| Segurança no bairro (Entorno): registros in 12 months, rate per 1,000 residents, top natures, position against the Recife median (±15% band), border neighbours (≥50 m of shared limit) in alphabetical order; "few residents" warning under 5,000. No ranking, score, "safe" or "dangerous" (hub, 16 and 18 Nov 2026) | `SegurancaNoBairro`, `recife/seguranca.ts` | `crime/ocorrencias.json` (SDS-PE records compiled by Crime Brasil, CC BY 4.0) + `populacao-bairros.json` (IBGE Censo 2022, V0001) | rerun `coletar-crime-recife.mjs` (cached pages, 12-month moving window) and `populacao-bairros-recife.mjs` (static) | data | iterate (web) |
| Ruído do aeroporto: Guararapes as a named noise source, no dB. Distance to runway 18/36 (shown up to 3 km) and "under the landing/take-off path" (extended centreline up to 10 km, ICAO Annex 14 approach surface: 150 m each side at 60 m, 15% divergence), aircraft height from a 3° slope. Appears in the Dia × Noite card (confirmed building), Andar × fachada simulator (kept beyond the 3 nearest sources) and "De que lado vem o barulho" (all 72 bairros) (hub, 18 Nov 2026) | `recife/aeroporto.ts`, `simuladorDaUnidade.ts`, `sintesesDaRua.ts`, `noite.ts` | `aeroporto.json` (OpenStreetMap way 22732877, ODbL) | rerun `pista-aeroporto-recife.mjs` if the runway changes | data | iterate (web) |

## Compare

| Feature | Code | Data | Update policy | Owner | Status |
|---|---|---|---|---|---|
| Para decidir: brief, priority, decisive question | `Decisao` | dossier projections | follows its sources | product | adopt |
| Já tem a resposta? | `Decisao`, `resposta.ts` | user answer | user | product | iterate |
| Custo / Espaço / Entorno panels | `Paineis` | listing, index, cycle | as above | product | adopt |
| Quem ganha em cada parte (Custo, Espaço, Dia a dia a pé, Rua e clima incl. Sol e sombra) | `Placar`, `placarDoPar.ts` | indicators of each building | follows its sources | product | iterate |
| Rotina por horário | `Rotina` | cycle: transito (on-device RAPTOR) | cycle monthly; GTFS freshness check | data | adopt (engineering) |
| Price per hour saved, dominance | `Rotina` (ParaDecidir) | cost + routine | follows its sources | product | iterate |
| Onde mais procurar | `Rotina`, `procura.ts` | cycle: procura | cycle (per-area cache) | data | iterate |
| Comparáveis do meu caderno | `ComparaveisPessoais` | personal notebook only | user | product | iterate |
| Placar: total purchase cost (ITBI range), routine to the destination (7 a.m. trip, h/month and 8-h working days/year, return assumed equal to the trip and said so), surface heat and elevation, condo fee/m² (no winner) | `placarDoPar.ts`, `extras.ts` | procura, environmental layers, listing | follows its sources | product | iterate |
| Sala de decisão: share 2–3 analyses in the link fragment (`#s=`), the other person reacts (Faz sentido / Dúvida / Descartar) and notes, returns `#r=`; import writes diary lines once | `Sala.tsx`, `sala.tsx`, `salaDeDecisao.ts` | listing fields only (no notebook, visit or profile); no server | user | product | iterate |

## Platform

| Feature | Data | Update policy | Owner | Status |
|---|---|---|---|---|
| Layer files outside the JS bundle (web cache, native assets) | `publicar-camadas.cjs` | rewritten by each pipeline; checked by `ciclo.mjs --conferir` | platform | adopt |
| Notebook, backup/restore with files, export | on-device | migrations tested in Jest | platform | keep |
| Coverage text on screens | generated modules | follows the cycle (`coberturaDasCamadas.ts`) | product | adopt |
| Local hub mode for the index (`--hub 2026-11-15`): manifest UUIDs, SHA-256 per file, CKAN-typed values, whitelist, CKAN fallback | `scripts/dados/hub.mjs` | `.cache/dados-recife/hub-<date>/` + manifests in `docs/aplicacao` | per extraction | data | adopt |
| LGPD scan of every published artefact (no personal column, no CPF/CNPJ pattern) | `tests/lgpd-artefatos.test.ts`, `auditar-indice-municipal.mjs` | all layer files + active index | every `npm run verificar` and every index audit | data | adopt |
| Base map behind every map (blocks, lots, named streets, bairro limits, water, squares, bridges; credit "Base: Prefeitura do Recife (ODbL)"; explained in "Sobre os dados"): drawn by `src/componentes/mapa/FundoDoMapa.tsx`, `fundoDoMapaCena.ts`, hook `useFundoDoMapa.ts`; surfaces `MapaDoLote`, `PorPerto`, `MapaDoPredio`, examples map, dossier top. No satellite imagery, no third-party tiles; lots missing on hills and periphery show only the block; no road hierarchy (avenue from the name, corridor from field CT); published file keeps only geometry, floors and the index-building mark (no address, building name or lot code) | `src/dados/recife/mapa-base/<sha>/` (94 bairros + `cidade.json`), read by `mapaBase.ts`, versions/sources in `mapaBaseGerado.ts`; pipeline `scripts/dados/construir-mapa-base.mjs` from Prefeitura open data ("Área urbana", "Parques e praças", ODbL) | regenerate after every index activation and when the portal republishes (`--atualizar`); see RUNBOOK-ATUALIZACAO.md section 6 | data (pipeline), product (screens) | built on branch `feat/mapa-base`, pending human review, physical-device check and the legal opinion on ODbL (derived base in the repo, visible credit); not released |

## Not enabled (kept out on purpose)

| Feature | Why |
|---|---|
| Shaded walking routes | A15 rejected |
| External price ranges, valuation | A21/A31 deferred |
| Flood susceptibility prediction | A30 rejected |
| Street-image or listing AI extraction | A27/A28 deferred |
| Telemetry | No consent design; the plan keeps private routines on the device |
| Drainage works as "done/cleaned" (`macrodrenagem` `CONCLUÍDO`) | 21 of 236 "CONCLUÍDO" features say "NÃO FOI LIMPO"; blocked on LAI P04 |
| APAC rain as history or flood correlation | snapshot of recent accumulations with negative and stale readings; blocked on P13 |
| Sidewalk width / accessibility ratings from `calcadas-*` | blocked on P09 |
| Business "noise" (`incomodo`) or "open storefront" claims | `incomodo` is "N" in all 439,905 rows; registration is not operation |
| CTTU crashes as a street safety score | `acidente_verificado` empty in all 5,315 rows of 2024; shown only as registered calls with a victim |
| Shared corrections, accounts, sync | A36 deferred |
| Noise in dB(A) per floor/façade | no calibrated measurement in Recife; user decision 15 Nov 2026 (the airport left this list on 18 Nov 2026 and is shown as a named source, without dB) |
| Establishment names from the CNEFE | descriptions can carry a person's name; only the category is published |
| Neighbour high-rise potential (PE3D MDS−MDT, LPUOS, outorga onerosa) and bare-earth flooding (PE3D MDT + HAND + tide) | sources not in the repository; shown as "Sem leitura publicada nesta área ainda" |
