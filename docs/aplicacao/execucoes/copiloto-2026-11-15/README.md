# Copilot cycle — 15 Nov 2026

The "VEREDA B2C Evolution Mission" brief: from a link reader to a neighbourhood, building and purchase co-pilot, with no
login, no paywall, no score and no verdict. This file separates what was **verified automatically**, what **needs a real
phone**, and what is **blocked on data that is not in the repository** (including the 17 LAI requests).

## 1. Decisions taken with the user before building

| Brief item | Conflict found | User decision |
|---|---|---|
| Day/night noise in dB(A) per floor and façade vs. NBR 10151, with airport corridor and −12 dB on the opposite façade | No noise source in Recife has been measured or calibrated; the project had already ruled out decibels and the airport | **No dB.** The simulator names the 3 nearest sources, their distance and whether the window faces them, is sideways or has its back to them. dB(A) reads "Sem leitura publicada nesta área ainda". |
| Show `DSC_ESTABELECIMENTO` and nightlife/friction by name | The local CNEFE copy had no descriptions | **Download the full IBGE file** (17.7 MB zip, SHA-256 `db8987a5…e75c6`) and publish **only the category**, never the name (a description can carry a person's name). |
| Condo fee/m² vs. buildings of the same age (median + MAD) | There is no public condo-fee dataset per building | **Only the user's own notebook sample** (same bairro, modality and building age ±10 years), from 5 listings; below that, "Sem leitura publicada nesta área ainda". |

Recife's ITBI rate is not fixed in the app: the municipal tax code (art. 52, II) says 3%, a temporary reduction to 2% was
announced in Dec 2025, and financed portions can be lower. Totals show a **2%–3% range**; deed and registry stay
"a confirmar".

## 2. What was built

**P0 — Explorar.** One input (listing URL, or building name/street/bairro search in the index; pilot bairros unless a
bairro is named), "Usar minha localização agora" (nearest index building within 250 m; position used once, not stored;
bairro boxes in `caixasDosBairros.ts`), three example addresses open on an empty notebook (Boa Viagem beachfront
`11720-2290`, Graças 1972 resale with ITBI `59382-537`, Madalena street with drainage requests `1880-186`; chosen by the
criteria in `raioX.ts`), card triage (Favoritar / Anotar / Descartar, stages Triagem / Visita / Visitado / Negociando,
stage filter; "negociando" added to the notebook enum), and "Onde mais procurar no piloto" as soon as the household
profile has a destination. A building opened from search, location or an example becomes a **Raio-X** analysis: building
confirmed, every listing value `null` ("A confirmar"), no credit spent.

**P0 — Dossier.** *Ficha viva do edifício* before the tabs: three 15-second pills (surface heat vs. bairro, elevation and
nearest mapped water, day/night noise sources) and five facts, each with source and a tap for reading, details and a
ready question: scale and age; structural records (`lerLinhaDoTempo` over the notebook's laudos, ART/RRT and structure
occurrences linked to this property); ITBI per unit vs. asking price (stated as a tax assessment, never R$/m²); condo
fee/m² vs. the user's sample (median ± MAD, alert above peers or well below peers in a 25–45-year-old building);
climate and surroundings (Landsat, Copernicus DEM, ESIG water, Defesa Civil; LPUOS neighbour potential: no reading).
The Edifício tab shows the full structural timeline with literal document/number/date and the question for the síndico.
The Census tract income card is shown by default. The services block now separates friction (bar/drinks, workshop,
supermarket) from daily convenience. Water-body classes from ESIG are shown in plain words ("ALAGADO" → "Área úmida
mapeada"), so a hydrography class no longer reads like a flood verdict.

**P1 — Simulator, Comparar, pipelines.** *Andar × fachada* (Entorno): house/apartment, floor, 3×3 compass; noise
sources without dB; direct sun on that façade at that height (equinox, taller neighbours; reuses
`analisarJanelaNoRecife`); south-east breeze and the nearest taller neighbour in its path (cadastre floors; PE3D: no
reading). "Isso bate com a rua hoje?" (Bate / Não bate + reason) stays on the device. Comparar's scoreboard adds total
purchase cost, routine to the destination (7 a.m. scheduled trip from the *procura* layer, h/month and 8-h working
days/year, "return assumed equal to the trip" said in the sentence), surface heat and elevation, and condo fee/m² (no
winner). *Sala de decisão*: 2–3 analyses travel in the link fragment (`#s=`, never sent to a server; listing fields only),
the other person reacts and writes notes, sends back `#r=`, and the import writes one diary line per analysis, once.
New layer **atrito** (`scripts/dados/atrito/rodar-atrito.mjs`, in the cycle): per building, counts within 150 m and the
nearest within 300 m (with bearing) of bar/drinks, workshop, supermarket, daily convenience and 2022 construction.

**P2 — Visit, reader, closing.** Visit itinerary gets up to 3 risk checks on top (water/garage when elevation ≤ 5 m, water
≤ 200 m or ≥ 3 drainage requests; pressure/façade for buildings over 25 years; internet test when the notebook has none).
Optional 10-s microphone comparison (Web Audio, open vs. closed window, relative dB only, nothing recorded); the three
manual buttons stay. Minutes/bylaws/statement reader: pasted text or `.txt`; literal excerpts with page (header or footer
markers and form feeds), house rules, financial and legal facts, questions including what the document does not mention;
"save to notebook" creates a document marked "a confirmar". Negotiation: arguments are checkboxes (ITBI median gap, fees
the listing omits, literal minutes excerpts, surface heat, nearby noise sources). *Pacote para especialista*: print or
download `.md`/`.html` (ficha, listing × cadastre, structural timeline, minutes excerpts, visit checklist, open legal and
technical questions; no household profile, photos or diary).

## 3. Verified automatically

| Check | Result |
|---|---|
| `npm run verificar` (typecheck, lint, Jest) | typecheck clean; lint 0 errors (5 pre-existing warnings); **81 suites, 1,947 tests** |
| New Jest file `tests/copiloto.test.ts` | 27 tests: entry/search/location, Raio-X validity and examples in the index, triage, median/MAD and condo comparison, Ficha Viva (5 items, unknown never 0, ITBI per unit), timeline in the UI, simulator (no dB, recalculates, house on ground floor), extended scoreboard, decision room (round trip with accents/emoji, tamper refused, import once), minutes reader (verbatim + page, header vs. footer), negotiation checkboxes, export (escaped HTML, no profile), atrito layer numbers only, hydrography names, microphone delta |
| Node tests (`scripts/**/*.test.mjs`) | **118/118** (new: 4 for the atrito pipeline: whole-word categories, never-read columns, dedupe, counts and bearing) |
| `ciclo.mjs --conferir` | `{"problemas":[]}` |
| `publicar-camadas.cjs --conferir` | 248 files, 31.5 MB, 0 problems (atrito adds 72 files; largest Boa Viagem 149 KB; outside the JS bundle) |
| LGPD scan of published artefacts | passes; atrito files hold only numbers |
| Web render, 4 tabs, 1280 px and 360 px (`render.mjs`, `render.json`, `telas/`) | **22/22 checks at each width**; 0 page errors, 0 console warnings, 0 horizontal overflow, 0 external requests, 0 forbidden terms (x/10, "nota N", stars, "seguro para morar", "livre de alagamento", "score", "vencedor") |
| End-to-end smoke (`scripts/v1-smoke.mjs`) | **50 audited steps** at 375×812 and 1280×900, 0 external requests, exit 0 (selector updated to the new input label) |

Atrito numbers (CNEFE 2022, 737,511 rows): 72,760 species-6 addresses, 53,254 without a recognisable category, 693 with an
approximate geocode left out, 910 duplicates; published points: 3,037 bar/drinks, 4,416 workshop, 451 supermarket,
10,939 daily convenience, 13,755 construction sites. **Construction in 2022 is near almost every building** (Boa Viagem
1,804 of 1,878 within 150 m), so it is shown last, as a dated snapshot, never as a headline.

## 4. Needs a real phone (with the 20 real ZAP listings)

- GPS "Usar minha localização agora" on Android and iOS (permission flow, accuracy, 250 m radius in dense blocks).
- Microphone comparison on phones (browser gain control can flatten the difference; native app shows the manual buttons).
- Decision-room links on native (`vereda://sala?d=…`) and opened from WhatsApp; very long links on old Android browsers.
- Simulator and Ficha Viva performance on a low-end Android (Boa Viagem has 1,878 buildings).
- Whether the floor × façade sun hours and the "Isso bate" answers match what people see on the street.
- Minutes reader on real PDFs copied from a phone (page markers survive copy/paste only sometimes).

## 5. Blocked on data or on the 17 LAI requests

| Item | Shown as | Blocked on |
|---|---|---|
| Noise dB(A), airport corridor | "Sem leitura publicada nesta área ainda" | calibrated measurements; official airport noise plan georeferenced |
| Bare-earth flooding (PE3D MDT 1 m + HAND + tide 2.3–2.8 m + SEDEC/156) | Copernicus DEM labelled as surface model; MDT "Sem leitura" | PE3D tiles not in the repository; drainage execution (LAI P04) |
| Neighbour high-rise potential (PE3D MDS−MDT, LPUOS CA max, IEPs, outorga onerosa) | "Sem leitura publicada nesta área ainda" | PE3D + ESIG LPUOS + SEDUL data not in the repository |
| Condo fee vs. peers from a public base | user's own sample only | no public per-building condo data |
| Structural records from official sources per building | only documents the user stores | Defesa Civil / Controle Urbano records per building (LAI) |
| Sidewalk width/accessibility, APAC rain history, `incomodo` noise, CTTU safety | still not enabled | P09, P13 and the earlier audit |

## 6. End-to-end smoke

Run against the same dev server: `POC_URL=http://localhost:8087 node scripts/v1-smoke.mjs`. All 50 steps passed (purchase
and rent in Casa Forte by link and text, IPTU anomaly, real index building, street+number search, credits 3→2→1,
Prefeitura source, no R$/m² with ITBI, offline tabs and dossiers, Cabanga out of coverage, persistence, comparison,
discard, menu, unreadable notebook). The smoke still exercises the existing credit counter; the new Raio-X path spends
no credit.

## 7. Files

- Pipelines: `scripts/dados/atrito/rodar-atrito.mjs` (+ `testes/`), `scripts/dados/localizar/caixas-dos-bairros.mjs`; `ciclo.mjs` and `publicar-camadas.cjs` register atrito.
- Data modules: `src/dados/{raioX,triagem,salaDeDecisao,leitorDeAta,pacoteEspecialista}.ts`, `src/dados/recife/{atrito,localizar,caixasDosBairros}.ts`, `src/dados/dossie/{fichaViva,simuladorDaUnidade}.ts`, `src/dados/visita/checagensDoRisco.ts`; `custoPorPartes.ts` (`estimarTransferencia`), `negociacao.ts` (extras), `camadasAmbientais.ts` (`nomeHidricoDeTela`), `caderno.ts` ("negociando").
- Screens: `src/componentes/inicio/Explorar.tsx`, `dossie-v1/{FichaViva,SimuladorDaUnidade,Pacote}.tsx`, `comparar/{Sala.tsx,extras.ts}`, `caderno/LeitorDeAta.tsx`, `visita-v1/MedidorDeRuido.tsx`, route `src/app/sala.tsx`.
- Evidence: `atrito.json`, `render.mjs`, `render.json`, `telas/` (screens at 1280 and 360).
