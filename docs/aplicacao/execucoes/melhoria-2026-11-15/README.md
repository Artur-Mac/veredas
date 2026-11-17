# Improvement cycle, 15 Nov 2026: audited hub data, lot map, "Sol e sombra" and review tooling

This cycle refreshed the municipal index and every per-building layer from the audited hub extraction of 15 Nov 2026 ([extraction note](../../extracao-hub-2026-11-15.md)). It also finished the redesign items left open in [redesenho-2026-11-15](../redesenho-2026-11-15/README.md) and added the review tooling for H1.

The user-facing text stays in Portuguese; this report is in English. The work is split three ways:
- what was verified automatically;
- what still needs a real phone and real listings;
- what stays blocked on the 17 LAI requests ([pedidos-lai-recife.md](../../pedidos-lai-recife.md)).

## 1. Data (WP1)

### Local hub mode

- **Reader.** [`scripts/dados/hub.mjs`](../../../../scripts/dados/hub.mjs) maps a CKAN resource id to its file in `.cache/dados-recife/hub-2026-11-15/` through the two manifests. Before any use it checks the SHA-256 and size of the whole file.
- **Same shape as the datastore.**
  - Columns that CKAN typed as numbers come back as numbers; dates come back as `AAAA-MM-DDT00:00:00`.
  - Typed columns that are empty come back as `null`; text columns stay text, and empty text stays `""`.
  - The types per resource are declared in `TIPOS`. They were checked row by row against the CKAN cache of 20 Oct:
    - sinistros 2024: 5,315 of 5,315 rows identical;
    - 156 of 2025: 114,617 of 114,653 identical. The 36 that differ are accents the CKAN datastore had lost ("PRX" in CKAN, "PRÓX" in the hub).
- **Whitelist.** Requested columns go through a whitelist. A personal column is refused even as a filter.
- **Refused resource.** The partial 2025 copy of the 156 (`06872af2`) is refused by id.
- **Wiring.**
  - [`construir-indice-recife.mjs`](../../../../scripts/dados/construir-indice-recife.mjs) uses the hub through `--hub 2026-11-15` or `VEREDA_HUB`. Everything not in the hub keeps the CKAN cache or a CKAN fetch.
  - The street layers inherit the hub through the same `lerTabela`.
  - Provenance: `modificadoEm` comes from the saved catalogue. The stamp is `2026-11-15T00:00:00Z`, so a re-run gives identical files.

### What the refresh changed

| Source | Before (CKAN, 20 Oct) | Now (hub, 15 Nov) |
|---|---|---|
| Central 156, 2026 file | 11,374 rows, up to 30 Jan 2026 | 61,225 rows, 19 May 2009 to 19 Jun 2026 |
| 156 window used | 31 Jan 2025 – 30 Jan 2026 | **20 Jun 2025 – 19 Jun 2026**: 71,144 drainage, lamp and rubble requests |
| IPTU 2026 read | 413,651 | 413,750 |
| ITBI 2026 | 13,852 | 15,078 |
| Licensing (Obra) | 39,067 | 39,067, now with licence status |
| CTTU 2022–2024 | 12,016 | 12,016 (identical) |

- **156 window and dedupe.** The rule lives in `selecionarPedidos156` ([`rua/nucleo.mjs`](../../../../scripts/dados/rua/nucleo.mjs)).
  - The window is the 12 months that end at the newest published request, never after the stamp.
  - 38,456 rows fall before the window.
  - The same request (category, service, street, number, bairro, day) counts once:
    - 191 repeats between the 2025 and 2026 files;
    - 1,726 repeats inside one file.
  - The row kept is the one with the latest status; on a tie, the one with coordinates.
- **Licence status.** Each works record now carries `[estado, válida até, impacto]`, built by [`licenca.mjs`](../../../../scripts/dados/licenca.mjs) and added to the contract as optional `esquemaObra.licenca`.
  - Of the 1,036 works in the active index:
    - 243 have a valid licence;
    - 256 have an expired one;
    - 372 were approved without a licence date;
    - 165 are under review;
    - 6 are flagged as high-impact projects.
  - On screen it reads "Licença válida até 11/2027 · retrato da base". It is not proof that works started or ended (P05).
  - `areatotalconstruida` is empty in all 39,067 works rows, so it is not read.
- **Comma decimals in CTTU.** `numeroDecimal` already parsed "1,0" as 1; it now has tests for `pedestre`, `vitimas`, `vitimasfatais` and `num_semaforo`.
  - Crashes have no coordinates. They are placed by CNEFE; 5,642 of 12,016 are discarded without a position, and that count is in the report.
  - CTTU is shown only as "registered calls with a victim", never as a safety score.

### Index rebuild, audit and activation

- **Rebuild.** 94 partitions in 40 s, peak 2.2 GB.
- **New audit script.** [`auditar-indice-municipal.mjs`](../../../../scripts/dados/auditar-indice-municipal.mjs) checks:
  - structure;
  - own-lot geometry;
  - id collisions;
  - the 2 MB cap;
  - personal column names in every partition and in `meta.json`.
- **Audit result** ([municipal-validacao.json](municipal-validacao.json)):
  - 0 collisions and 0 partitions over 2 MB; the largest is Boa Viagem, 1,934,423 bytes;
  - 21 bairros have no eligible buildings, as before;
  - Macaxeira stays under geometric review (fraction 0.875).
- **Diff against the previous index** ([indice-diff.json](indice-diff.json)):
  - 4 buildings added and 7 removed;
  - 5 of the 7 fell below 2 residential units;
  - 2 vanished from the IPTU file: `33804-120`, 126 units in Várzea, and `56839-1247`, 6 units in Torre. A saved analysis pointing at them opens without cadastre data; nothing crashes.
  - 7,188 buildings changed, mostly the street tuple (new 156 window).
- **Activation.**
  - New index: `indice-municipal/faa40c969275e6b5`, with 72 bairros enabled as before.
  - Previous index: `1e393803851f3fd5`, kept, and `ativar-indice-municipal.mjs --reverter` restores it.
  - The activator now reads the IPTU coverage from the staging file `coleta-iptu.json`, so it works for CKAN and hub builds alike.

### Proximity layer (`equipamentos`)

[`rodar-equipamentos.mjs`](../../../../scripts/dados/equipamentos/rodar-equipamentos.mjs) is a new cycle step. It writes one file per bairro, 72 in all, at most 240 KB each, with these facts for each of the 7,203 buildings:

| Fact | Source and handling |
|---|---|
| Traffic lights within 150 m | 711 of 712 with a position |
| Audible signals within 150 m, and the nearest | 67 |
| Nearest bike rack | CSV of 562; 77 broken longitudes recovered from the GeoJSON by reference; 528 unique. The three GeoJSON copies have the same SHA-256, so one is read. |
| Nearest Bike PE station | 90 |
| Permanent cycle lane, and Conecta route | 558 + 79 lines |
| Nearest municipal health unit | 94 kept |
| Academia da Cidade | 18 |
| Nearest culture or leisure venue | 68; latitude and longitude were swapped in all 68 rows and are fixed |
| Nearest conservation unit, with its hectares | 28 polygons |
| Nearest square or park, with polygon area, and the largest within 800 m | 432 ESIG polygons; "AREA VERDE" left out |

- **Left out on purpose.** Therapeutic residences, shelters, CAPS and CVA. Pointing at them as "neighbours" stigmatises the people they serve and does not inform a housing decision.
- **Never read.** The `complemento` column of the culture file.
- **Labels.** Everything is labelled as registered equipment, not opening hours, operation or maintenance. Distances are straight-line, rounded to 10 m.

### Cycle with a restore point

- **Run.** `ciclo.mjs --nome m1-hub-2026-11-15`: 9 steps in 576 s.
  - Every layer was rebuilt on the new building ids. "Where to look" was the slowest step (236 s); equipamentos took 19 s.
  - The proximity layer reproduced byte-identically from the manual run.
- **Checks.** `--conferir` reports `{"problemas":[]}`. The app's layer files total 30.9 MB, all outside the JS bundle.
- **Rollback (two steps, in order):**
  1. `ciclo.mjs --reverter m1-hub-2026-11-15`
  2. `ativar-indice-municipal.mjs --reverter`

  The [runbook](../../RUNBOOK-ATUALIZACAO.md) (section 1b) has the full procedure.

## 2. Screens (WP2)

- **Lot map** ([`MapaDoLote`](../../../../src/componentes/dossie-v1/MapaDoLote.tsx), [`mapaInterativo.ts`](../../../../src/componentes/dossie-v1/mapaInterativo.ts)):
  - the 2D/2.5D switcher is visible: "Planta 2D", "Volume · manhã / meio-dia / tarde";
  - the volume carries the label "Volume estimado: a altura do cadastro desenhada sobre o contorno do lote, não a forma real da torre";
  - zoom goes 1 / 1.5 / 2 / 3× and keeps the building pin in place; drag works only when zoomed, so a vertical swipe still scrolls the drawer; "Recentrar" resets;
  - tapping a works pin (44 px target) shows the type, distance, month and licence status;
  - duplicate lot outlines (two buildings on one lot) are drawn once.
- **Sol e sombra** ([`solDaTarde.ts`](../../../../src/dados/dossie/solDaTarde.ts)), the sixth classifier compared with the bairro. Its inputs:
  - **sun:** afternoon positions at the equinox, 13h–17h every 30 min;
  - **façades:** lot-outline orientation;
  - **neighbours:** shade from taller buildings in the sun's direction within 120 m, by floors;
  - **trees:** for buildings up to 12 m, Census trees on the block face.

  Labels: "Menos sol da tarde" / "Sol da tarde na média" / "Sol da tarde forte", with "k de cada 10". There is no score, and the sentence says it is an estimate.
  - Boa Viagem (1,878 buildings) computes in about 0.23 s on a laptop. It is cached per bairro and pre-computed while the preparation screen shows.
  - The manual compass in the visit flow is unchanged and optional.
- **A rua:**
  - each row starts with a plain-language consequence, for example "Houve 2 pedidos de limpeza de galeria ou canaleta perto do prédio em 12 meses: vale perguntar se a rua acumula água.";
  - the count shows small underneath; detail and "Ver fonte e data (período)" open on tap;
  - ramp and obstacle facts appear only when the household profile marks "Mobilidade reduzida", then as their own visible group;
  - macrodrenagem and calçadas data are not shown at all.
- **Por perto** ([`PorPerto`](../../../../src/componentes/dossie-v1/PorPerto.tsx)):
  - the sentence comes first, for example "Praça grande a 5 min a pé.", and the name, size and straight-line distance on tap;
  - traffic-light counts and the source sit behind "Ver contagens e fonte";
  - audible signals appear only with "Baixa visão ou cegueira" in the profile, and always say the registry does not show whether the signal works today (P09).
- **Household profile.** New optional question: "Alguém na casa precisa de acessibilidade?". It is stored on the device only and never enters a share or export.
- **Price simulator.** The financing pill opens it inline ([`SimuladorPrice`](../../../../src/componentes/dossie-v1/SimuladorPrice.tsx)):
  - down payment 10 / 20 / 30 / 50%; term 15 / 20 / 30 / 35 years;
  - shows the instalment, the amount financed, the total paid and the interest;
  - same formula as the cost card (`prestacaoPrice`), with the BCB average rate. It is labelled as not a credit offer and stays out of the known monthly cost.
- **Compare.** The "Rua e clima" row of "Quem ganha em cada parte" now counts "Sol da tarde forte" as an attention point.

## 3. Review tooling and tests (WP3)

- **H1 helper.** [`chuva/revisao-h1.mjs`](../../../../scripts/dados/chuva/revisao-h1.mjs) writes [`g-rain-h1.csv`](../../evaluation-sets/g-rain-h1.csv). The sheet lists the 4 flood records that drive every route consequence in the active rain layer:
  - Av. Barão de Souza Leão, 30 Jun 2023: 147 buildings;
  - Túnel da Madalena, 15 Jun 2024: 25;
  - Túnel da Madalena, 25 Jun 2024: 25;
  - Av. Agamenon Magalhães, 24 May 2023: 1.

  That makes 173 distinct buildings. Each row has an OpenStreetMap search link and blank columns for the reviewer, including minutes. `--decidir` applies the rule: keep if at least 3 of 4 hold, hide if not, pending while unanswered. Human answers are never overwritten (`folhas.mjs`).
- **Baselines after the refresh** ([baselines.json](baselines.json), [`conferir-baselines.mjs`](../../../../scripts/dados/conferir-baselines.mjs)):
  - **G-RAIN:** unchanged (147/25/25/1, 173 distinct).
  - **G-POI:** unchanged. The one absent venue was already absent by design (closed in OSM).
  - **G-BUILDING:** all 50 present; one attribute change, Graças `59382-327`, 60 → 59 units, from the new IPTU.
- **New tests:**
  - **156:** window and dedupe, including the real files (`e40fc8b9` with `80c5b3cd`; `06872af2` refused);
  - **CTTU:** comma decimals and crashes without a position;
  - **hub reader:** SHA-256, whitelist and types;
  - **licence status;**
  - **LGPD scan:** every published artefact and the active index `meta.json`. No personal column names, nothing shaped like a CPF, CNPJ or masked CPF;
  - **Sol e sombra:** façade, neighbour shade, trees, real index and Compare;
  - **lot map:** state (zoom, pan clamp, pin focus), switcher, pin card and licence text;
  - **Por perto and A rua:** consequence first, gating by profile;
  - **Price simulator;**
  - **proximity geometry:** health types, swapped coordinates and rack recovery.
- **Unmount fixes.** The confirm hook and the preparation modal stopped touching state and timers after unmount. The reduced-motion hook stopped scheduling a no-op update. The Explorar tests now unmount their trees.

## 4. Verified automatically (15 Nov 2026)

| Check | Result |
|---|---|
| `npm run verificar` | typecheck clean; lint 0 errors and 5 warnings, all pre-existing; Jest 80 suites, 1,846 tests, all passing |
| Node pipeline tests (`scripts/dados/**/testes`) | 114 of 114 |
| `ciclo.mjs --conferir` | 0 problems |
| Index audit | 94 partitions, 0 collisions, 0 over 2 MB, no personal column |
| Web smoke (`scripts/v1-smoke.mjs`) | 50 of 50 steps at 375×812 and 1280×900, 0 external requests |
| Render of this cycle ([render.mjs](render.mjs), [render.json](render.json), [telas/](telas/)) at 375 and 360 px | no console errors or warnings, no page errors, no horizontal overflow on any screen, 0 external requests (only the 4 ZAP listing photos); all 15 on-screen checks true at both widths |

The 15 render checks:
- simulator opens and changes with the down payment;
- Sol e sombra present;
- Por perto present, with the registry notice;
- street rows lead with the consequence, with the source behind the tap;
- no ramp row without the profile;
- map switcher visible, estimated-volume label, zoom announced, works pin shows licence status and the snapshot caveat;
- profile accessibility question;
- "Rua e clima" in Compare.

## 5. Needs a real phone and real listings (20 ZAP listings)

None of this can be settled on the web build. Use 20 real ZAP listings across at least 5 bairros. Record each in a sheet with the listing link and the columns below.

| What to check per listing | Why it is not verified yet |
|---|---|
| Photos load on the native app (no Referer) | Web uses `referrerPolicy="no-referrer"`; native never ran on a device in this cycle |
| The right building comes first (name, street, number, sizes) | 2 real listings tested so far (Boa Viagem, Torre) |
| IPTU shown once, period correct | Depends on how each listing writes IPTU |
| Lot map: drag with a finger while zoomed, inside the scrolling drawer; tap a works pin | Drag was verified by state tests and web clicks, not by touch |
| Sol e sombra time on a low-end Android (first open without the preparation screen) | 0.23 s on a laptop for Boa Viagem; a phone may be 4–8× slower |
| Sol e sombra against the afternoon sun seen on a visit (15h–17h) | The model is an estimate on the lot outline, not the tower; no field check yet (`g-shade-observacao.csv` has 80 rows waiting) |
| Por perto: does the square or park, Bike PE station or health unit exist where the registry says? | Registry only |
| Price simulator against one bank simulation | Uses the BCB average rate without insurance or fees |
| Profile accessibility toggles change A rua and Por perto as expected | Unit and screen tests only |
| Offline: dossier opens with layers already cached | Covered in the earlier smoke, not on device in this cycle |

## 6. Blocked on the LAI requests

These claims stay out of the app until the answers arrive:

| Kept out | Why | Request |
|---|---|---|
| Drainage works as "done" or "cleaned" | In `macrodrenagem`, 21 of 236 "CONCLUÍDO" features say "NÃO FOI LIMPO" | P04 |
| Proof that licensed works started or finished | Licensing is a snapshot (status shown as such) | P05 |
| Sidewalk width or accessibility ratings; whether audible signals work | `calcadas-*` has no method or date; signals are a registry | P09 |
| 156 response meaning beyond counts | Status codes and links to points not documented | P10 |
| Rain history or flood correlation from APAC | Recent accumulations with negative and stale readings | P13 |
| Noise from businesses; "open storefront" | `incomodo` is "N" in all 439,905 rows; registration is not operation | — (not requested; kept out) |
| Street safety score from CTTU | `acidente_verificado` empty in all 5,315 rows of 2024 | P01 (detours) does not cover it; kept as counts |
| Flood ledger beyond 2024 | Defesa Civil 2025 not published | P03 |
| Crime | Needs SDS data | P12 |

## 7. Files

- **Scripts:**
  - `scripts/dados/hub.mjs`, `licenca.mjs`, `auditar-indice-municipal.mjs`, `conferir-baselines.mjs`;
  - `equipamentos/{rodar-equipamentos,geometria}.mjs`;
  - `chuva/revisao-h1.mjs`;
  - changes to `construir-indice-recife.mjs`, `rua/{camadas,nucleo}.mjs`, `ativar-indice-municipal.mjs`, `ciclo.mjs` and `publicar-camadas.cjs`.
- **Tests:**
  - Node: `scripts/dados/rua/testes/hub-156-sinistros.test.mjs`, `scripts/dados/equipamentos/testes/equipamentos.test.mjs`;
  - Jest: `tests/{sol-e-sombra,mapa-do-lote,equipamentos-e-rua,lgpd-artefatos,desmontagem}.test.ts`.
- **App:**
  - new: `src/dados/recife/equipamentos.ts`, `src/dados/dossie/solDaTarde.ts`, `src/componentes/dossie-v1/{PorPerto,SimuladorPrice,mapaInterativo}.ts(x)`;
  - changed: `MapaDoLote`, `ARua`, `Entorno`, `Custo`, `indicadores.ts`, `rua.ts`, `contratos.ts`, `PerfilDomicilio`, `perfil-domicilio`, `PreparoDoDossie`, `confirmar.ts`, `movimento.ts`.
- **Data:**
  - `src/dados/recife/indice-municipal/faa40c969275e6b5/`;
  - `src/dados/recife/equipamentos/fa075f4647c474d2/`;
  - layer versions written by cycle `m1-hub-2026-11-15`.
