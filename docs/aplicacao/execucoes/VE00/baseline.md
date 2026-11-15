# VE00 — Baseline of the real application and published data

Run date 2026-11-14 · Checkout `5d90b64` on `main` with 39 pre-existing dirty tracked files (see [checks.json](checks.json)) · Active publication `indice-municipal/91b71d239c1847cf` generated 2026-10-22T00:30:36Z.

This document records what the current app actually does and which data each inspected screen consumes. It is a baseline, not an improvement claim. Machine-readable counts are in [coverage.json](coverage.json); commands and results in [checks.json](checks.json); the prioritized defects in [issues.md](issues.md).

## 1. Checkout and preservation

- HEAD `5d90b642` (2026-11-11, "feat(dados): infraestrutura de dados completa"), one commit ahead of `origin/main`.
- Before VE00 started, 39 tracked files were already modified or deleted (1,331 insertions, 6,897 deletions), including `src/app/(abas)/{comparar,dossie,salvos,visita}.tsx`, `src/componentes/comparar/Paineis.tsx`, `src/dados/{backup,caderno}.ts`, `src/estado/Analises.tsx`, `tests/visita.test.ts` and the **deletion of root `index.html`**. `AGENTS.md` still names `index.html` as the only brand source for motion work; that is an inconsistency in the user's in-progress work, recorded here and not changed. The full lists are in [logs/git-status.txt](logs/git-status.txt) and [logs/git-diff-stat.txt](logs/git-diff-stat.txt).
- VE00 changed no tracked file. `git status --porcelain` was identical before and after the run. New files are confined to `docs/aplicacao/execucoes/VE00/`, `docs/aplicacao/evaluation-sets/`, the gitignored `.cache/dados-recife/trechos-de-logradouros.geojson` and `out/ve00/`, plus a preview launcher outside the repository (`../.claude/launch.json`).
- All tests and smoke checks below ran against this dirty working tree, so they describe the user's current state, not HEAD alone.

## 2. Journey inventory (VE00.01)

| Journey step | Evidence | Result |
|---|---|---|
| Paste listing link → read text → anomalies → building suggestion → confirm (1 credit) → dossier | v1 smoke steps 1–17 (Casa Forte purchase and rent); VE00 pilot journey ×5 areas | Works on web in all five pilot areas |
| Manual entry without link → save → compare purchase pair and rent pair | v1 smoke steps 24–33 | Works |
| Dossier tabs Destaques / Entorno / Edifício, source drawers, official cadastre drawer | v1 smoke 5–10, 16–17; pilot journey | Works; Entorno shows "A rua", 156, Defesa Civil and permits in all 5 areas |
| Visit tab (Preparar) | v1 smoke 11; pilot journey (5 areas) | Opens without error |
| Offline after load (Explorar, dossiers, Comparar, Visita, cadastre) | v1 smoke 18–20 | Works with network blocked after load; cold offline reload unsupported on web (no service worker) |
| Reload / reopen persistence | v1 smoke 23; pilot journey reload | 5/5 analyses and 5/5 confirmed building links persisted; app restores last route (`/comparar`) |
| Out-of-coverage area (Cabanga) | v1 smoke 21 | Clear "not covered" and save-to-notebook path |
| Discard / restore / credit rules; unreadable notebook protection | v1 smoke 34–36, 41–44 | Work; corrupt key preserved byte-for-byte with raw copy |
| Responsive/accessibility audit | v1 smoke at 375 and 1280 px, 50 steps | 0 automated findings; pilot journey 0 px horizontal overflow at 375 px |

**Real building per pilot area** (dev split of [G-BUILDING](../../evaluation-sets/g-building.json); listing values are fixtures in an isolated browser context):

| Area | Building id | Address (cadastre) | Suggested automatically | Dossier after confirm |
|---|---|---|---|---|
| Boa Viagem | 11720-4398 | AV BOA VIAGEM, 4398 | yes | 227 ms |
| Casa Forte | 21385-617 | EST DO ENCANAMENTO, 617 | yes | 217 ms |
| Graças | 34223-220 | RUA JOAO RAMOS, 220 | yes | 213 ms |
| Espinheiro | 59617-94 | RUA RUI CALACA, 94 | yes | 194 ms |
| Madalena | 28894-37 | RUA HERCILIO CUNHA, 37 | yes | 196 ms |

Plus Casa Forte 21385-719 (Estrada do Encanamento, 719) and the first Casa Forte partition building through the v1 smoke.

**Native versus web.** Only the web build was exercised (Expo web, headless Chromium). No Android/iOS device, emulator or toolchain is present, so the portal WebView reader, share intent, native file/notification/camera features, native screen reader and on-device performance are **not verified by VE00**. Existing native-specific Jest suites (`exportacao-nativa`, `lembretes-nativos`, `midia-nativa-integridade`) passed as unit tests only.

**Customer-clarity walkthrough (expert review, not a participant study).** The flow is coherent and well protected, but the decision value arrives late: on a 375 px screen, Compare opens with two map tiles and property names; the first quantitative conclusion ("R$ 100 de diferença no custo mensal conhecido") is below the fold, and there is no statement of which home to visit first, the main trade-off, or the one question that could change the answer. The dossier is information-dense (~7,200–7,600 characters in Entorno) and leads with descriptive counts (156 requests, permits, Census context) rather than consequences. This is precisely the VE01 opportunity.

## 3. Published-data reconciliation (VE00.02)

Every count below was recomputed by [scripts/reconcile_baseline.py](scripts/reconcile_baseline.py) from the active publication and cached official inputs.

| Plan §2 claim | Measured on this checkout | Status |
|---|---|---|
| 7,206 buildings in 72 neighbourhoods | 7,206 in 72 enabled partitions; `cobertura.json` lists 94 (72 enabled, 21 without eligible records, 1 pending geometric review); 72/72 partition SHA-256 and building counts match the manifest | confirmed |
| 2,688 pilot buildings | Boa Viagem 1,879 · Casa Forte 82 · Graças 291 · Espinheiro 156 · Madalena 280 = 2,688 | confirmed |
| All pilot street codes in official network; 2,622 within 50 m | 2,688/2,688 codes present in `trechos-de-logradouros.geojson` (SHA-256 `154ebe0a…`, 10,226 features, re-downloaded 2026-11-14 to `.cache/`); 2,622/2,688 centroids ≤ 50 m from own street; medians 24.3–26.9 m; worst 326.8 m (Boa Viagem 8060-695) | confirmed; still not entrance evidence |
| CNEFE 5,661 points; 96.5% of pilot within 300 m | 5,661 (education 1,676 · health 1,427 · religious 2,558); 2,594/2,688 = 96.5% within 300 m of any; 2,549 of a health point | confirmed |
| Flood category on 7 streets | 7 pilot streets (BV 5, CF 1, Esp 1, Graças 0, Madalena 0); 68 buildings on those streets | confirmed |
| 20 rows 2020–2024, "fourteen on one administrative date" | 20 rows (2022: 14, 2023: 2, 2024: 4); **12** on 2022-06-08 and 2 on 2022-06-06; 7 distinct dates. By the row's `Bairro` field: BV 15, Espinheiro 3, Madalena 2, Casa Forte 0 — which disagrees with the published street attribution (CF 1, Madalena 0) | **corrected**: 12 on one date, 14 within three days; attribution differs by method |
| Drainage near 2,515; injury collisions near 2,588; pedestrian collisions near 772 | 2,515 · 2,588 · 772 (150 m catchments, overlapping); 0 buildings with unknown drainage | confirmed |
| ITBI quartiles 1,319; 630 pass single-typology gate | 1,319; 630 pass `tipologiaUnica` (3% of median area, `derivar.ts`) | confirmed |
| GLO-30 resampled ~155 m; four Landsat dates | grid step 0.0014° ≈ 155 m; scenes 2023-06-14, 2024-01-16, 2024-11-23, 2025-04-16 | confirmed (ERA5 series not re-verified: no published consumer found) |
| Solar partitions exist; Madalena missing | `src/dados/sol/recortes/`: boa-viagem, casa-forte, espinheiro, gracas | confirmed |
| GTFS: two feed versions; corridor count ignores service dates | raw `v2026.10.26` (1,137 calendar exceptions) vs published-layer cache `v2026.10.16` (**0** exceptions); the published layer records neither version nor hash; the "daily stops" number is the sum over all calendars: median **2.42×** the weekday count (p10–p90 2.01–7.24×), 146 "corridor" stops have no weekday service ([check](logs/gtfs-daily-count-check.json)) | confirmed and quantified |
| −0.75° latitude shift is wrong | 2,839 (raw) / 2,841 (cache) stops inside Recife with original coordinates; **0** after the shift | confirmed |
| Google Maps: 100 searches, no entities | 100 searches, all HTTP 200, 0 extracted entities | confirmed |
| OSM collector boxes near −8.8; amenities collector malformed | all five `10-osm-pois.mjs` boxes lie at −8.80…−8.89 (outside Recife); `12-amenidades.mjs` builds `amenity["pharmacy"](bbox)` selectors and declares `todosPois` inside the loop (line 154) but uses it after the loop (line 217) | confirmed |
| 139 ZAP card summaries, not verified homes | 139 sample cards across the pilot (334 overall), stored only as per-neighbourhood summaries with no card rows or listing IDs | confirmed; deduplication impossible from stored data |

**Defesa Civil schema drift.** The 2014–2019 caches are already normalized (`ano`, `bairro`, `ocorrencia`, `rua`; no event date; 16,217 null rows across those six years). The 2020–2024 caches are raw CKAN rows whose declared header is `Regional, Ano, Mês, Data, …`; in **2020 and 2022** the ISO date sits in the `Mês` column and the category in `Data` (columns shifted by one), while 2021, 2023 and 2024 are aligned. The 2022 header is also double-encoded (`MÃªs`). Any parser that trusts the declared header silently misreads two of five years.

## 4. Displayed metric → producer → source → period → scale

Inspected on the dossier (Destaques, Entorno, Edifício) and Compare screens in the five-area journey.

| Visible metric (screen) | Producer | Source and period | Unit / spatial scale | Note |
|---|---|---|---|---|
| Mensal conhecido, rent/price, condo, IPTU, seguro (Dossier, Compare Custo) | `src/dados/custos.ts::custoMensal`, `comparar.ts::compararCusto` | Listing fields entered or read by the person | R$/month; listing | Unknown stays "a confirmar"; zero distinct from unknown (tests) |
| R$/m² and "Preço anunciado por m²" (Compare Espaço) | `comparar.ts::compararEspaco` | Listing price and area | R$/m²; listing | Area kind (private/total) not recorded |
| IPTU 2026 no prédio (Destaques) | `derivar.ts` from `Edificio.tipologias[].iptuAnualMediano` | IPTU 2026 cadastre, modified 2026-10-03 | R$/month (annual ÷ 12), median per typology; building | Fiscal charge, not listing IPTU |
| Construído em / pavimentos (Destaques, Edifício) | `derivar.ts`; index builder | IPTU "ano da construção corrigido"; Lotes `QTDPAVIMENTOS` (2026-03-02) | year; floors; building/lot | — |
| Preço × avaliação fiscal (purchase only) | `derivar.ts::posicaoDe` | ITBI 2016–2026, last 36 months, single-typology buildings only | R$ per unit, quartiles; building | Fiscal assessment, not closing price |
| Obras próximas N; recent permit list | index `obras150m`, `obras` | Licenciamento urbanístico, 24 months, modified 2026-10-19 | count; 150 m radius | Permit ≠ observed construction |
| Pedidos ao 156 (drenagem, lâmpada, entulho) | `rua.ts::grupoDo156` | Central 156, 2025-01-31 to 2026-01-30 | requests; 150 m radius | UI note: measures who asks, not street condition |
| Atendimentos da Defesa Civil na rua | `rua.ts` | Defesa Civil 2014–2024 by street code (CNEFE name match) | count by year/category; street | Administrative records; see schema drift |
| Sinistros com vítima / atropelamentos | `rua.ts::grupoDoTransito` | CTTU 2022–2024 | count; 150 m radius | Not linked to a crossing or route |
| Licenças de som vigentes | `rua.ts::grupoDoSom` | Licenciamento ambiental (LUSE), modified 2026-10-19 | count; 150 m radius | Licence ≠ activity |
| Pontos de iluminação desativados | `rua.ts::grupoDaIluminacao` | Iluminação pública 2025 | count; 150 m radius | Deactivated asset ≠ observed dark street |
| Coleta domiciliar | `rua.ts` | Roteiro de coleta (2026-03-06) | schedule; street | — |
| Censo do entorno (ônibus, calçada, rampa, árvores) | `rua.ts` | Censo 2022 entorno | share of households; census sector face | Sector scale, not the building front |
| Domicílios alugados | `rua.ts::grupoDaMoradia` | Censo 2022 sample | %; weighting area (~9k–12k households) | Coarse scale |
| Microclima card ("Superfície da quadra … acima da mediana") | `sintesesDaRua.ts` + `camadasAmbientais.ts` | Landsat 8/9 ST, 4 scenes 2023–2025 | °C land surface; 100 m cell | Wording says "quadra"; it is a 100 m surface cell |
| Chuva card (relief vs neighbours, canal distance, flood records) | `sintesesDaRua.ts` | GLO-30 DEM on 0.0014° grid; ESIG hydrography; Defesa Civil | metres (decimetre text); ~155 m cells | Decimetre differences overstate a ~155 m surface model |
| Acústica Dia × Noite ("N paradas diárias no GTFS") | `sintesesDaRua.ts::ruidoDiaNoite`; `scripts/dados/camadas-inteligentes-recife.mjs` | GTFS `v2026.10.16` (unrecorded in payload), LUSE, permits | stop events summed over all calendars; stops ≤ 160 m | **Wrong unit**: not daily (median 2.42× weekday) |
| Saúde ambiental (dengue/chikungunya) | `sintesesDaRua.ts` | SINAN 2023–2025 | cases; neighbourhood | Neighbourhood scale |
| Renda do setor | `sintesesDaRua.ts`, `censoRenda.ts` | Censo 2022 income by sector | R$/month median and mean; census sector | Descriptive; must never become a safety label |
| Energy/transport scenario (Custo, only with household profile) | `custoPorPartes.ts` | ANEEL tariff; ×1.32 air-to-road factor; Anel A fare | R$/month scenario | Air distance × 1.32 to a neighbourhood centroid; not a route |

## 5. Wording tests to revise deliberately in VE01 (VE00.04)

The plan now permits user-relevant, evidence-backed trade-offs. These assertions encode the legacy "never compare evaluatively" rule and will need intentional revision when VE01 introduces a decision brief:

- `tests/comparar.test.ts:279–304` — forbids `melhor|pior|recomend|menor|maior|caro|barat…` in compare notes and cost texts. `menor|maior` will block ordinary arithmetic phrasing ("R$ 100 menor por mês").
- `tests/perfil-domicilio-custo.test.ts:24`, `tests/dossie-tela.test.ts:759`, `tests/sinteses-da-rua.test.ts:23` — prohibited adjective lists (`perigos`, `vale a pena`, `caro`, `barat`, `ótim`, `ruim`, `arriscad`).
- Comment in `src/componentes/comparar/comparar.ts` that the comparison never recommends.

**Keep unchanged:** `tests/rua-indice.test.ts` `PROIBIDAS` (privacy columns that must never be read), `tests/extrator-estado.test.ts` forbidden values (extraction safety), and all arithmetic, unknown-versus-zero, migration and provenance assertions. Pejorative and safety adjectives ("perigoso", "arriscado") should remain forbidden even after revision; preference-dependent comparatives with reasons should become allowed.

## 6. Legacy F01–F80 preservation (grouped)

| F group | VE00 status | Evidence |
|---|---|---|
| F01–F07 shell, drafts, persistence, migration/quarantine, backup, media | retained as implemented (web) | Jest `migracao`, `persistir-analises`, `caderno-amplo`, `rascunho`, `midia-nativa-integridade`; v1 smoke unreadable-notebook and reload |
| F08–F14 manual/link/text import, WebView, share, OCR, extension | web text/link/manual verified; WebView/share/OCR need native verification | v1 smoke; Jest `extrator-*`, `leitor-decidir`, `zap-next-app` |
| F15–F20 municipal index, matching, lot confirmation, CNEFE | retained; 72 areas, checksums verified | pilot journey 5/5; `coverage.json` |
| F21–F29 costs, scenarios, fiscal data, comparables, history | retained; moves to VE01/VE10 | Jest `custos`, `perfil-domicilio-custo`, `comparaveis-pessoais`, `historico-do-anuncio` |
| F30–F39 building facts, timeline, permits, documents | retained; VE09/VE15 | Jest `cronologia-publica`, `complementos-finalizacao` |
| F40–F55 street/environment context | retained with defects (noise unit, relief precision, Defesa Civil drift); VE04–VE09 | §3–4 above |
| F56–F61 services, transit, routines | retained; air-distance only; VE03–VE05 | `rotina.ts`, `custoPorPartes.ts` |
| F62–F68 visits, field instruments | Visita opens in 5 areas; instruments need native verification | pilot journey; Jest `visita`, `sol-*` |
| F69–F75 compare, decision, export/share | compare verified for both tenures; decision support absent (VE01) | v1 smoke 26–33; Jest `compartilhar`, `exportacao-nativa` |
| F76–F78 credits, professional/institutional | credit rules verified on web | v1 smoke 34–39; Jest `carteira` |
| F79–F80 research, performance, operations | this baseline; device performance pending | [checks.json](checks.json) |

An 80-row individual audit remains a VE15/VE17 task; this grouping is the preservation checklist, not that audit.

## 7. Performance procedure (VE00.03)

Recorded now (desktop, headless Chromium, Expo web dev server, warm server, this machine): first page load to "Colar link" 1,143 ms; dossier visible after "É este prédio" 194–227 ms (n = 5); full reload to tab bar 814 ms (n = 1). These are **development-build desktop numbers, not the plan's device budget**.

Procedure for VE01 and later: (1) production web export served statically plus at least one named low-end Android device when available; (2) 30 runs per condition, cold (fresh context/app start) and warm (second open), reporting p50/p95; (3) measure "Compare usable" as navigation to `/comparar` until the first cost difference is visible, and "scenario change" as input event to updated text; (4) record payload size of the active index directory (7.3 MB on disk today) and JS heap where the platform exposes it; (5) keep the reference device and build in `measurements.json`. Until a device exists, report desktop numbers as a regression baseline only.

## 8. Evaluation sets (VE00.03)

Registered in [evaluation-sets/](../../evaluation-sets/README.md):

- **G-BUILDING**: 50 real buildings, 10 per area (2 far-centroid, 2 multi-front candidates, 2 sparse records, 4 ordinary), whole official street codes assigned to dev/test by SHA-256 parity. Split per area: BV 4/6, CF 5/5, Graças 4/6, Espinheiro 2/8, Madalena 3/7 (dev/test). All labels `unlabeled`; no field review was performed.
- **G-COMPARE**: 20 pairs (10 rent, 10 purchase), each area appearing 8 times, real dev-split buildings with **synthetic listing values** designed to exercise named cases (equal totals, missing vs zero condo, annual IPTU, unknown period, reversal by fee range, purchase horizon crossing at 60 months, the plan's R$ 33.75/h fixture). Expected outcomes are left for VE01 to define and label.
