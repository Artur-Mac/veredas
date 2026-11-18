# VEREDA — Update runbook (VE16)

How to refresh the per-building layers, what each source costs, how to recover, and who reviews what. The numbers below come from measured cycles ([VE16 evaluation](execucoes/VE16/evaluation.md)); update them when a new cycle is run.

## 1. What a cycle does

One command runs every per-building layer in dependency order, with a restore point taken first:

```bash
node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/ciclo.mjs --nome <id> [--ao-vivo]
```

| Step | Script | Publishes | App module rewritten |
|---|---|---|---|
| observacoes | `scripts/dados/observacoes/rodar.mjs` | `defesa-civil` | — |
| rede | `scripts/dados/rede/rodar-rede.mjs` | `rede-pedestre` | — |
| destinos | `scripts/dados/destinos/rodar-destinos.mjs` | `essenciais` | `essenciaisGerados.ts` |
| transito | `scripts/dados/transito/rodar-transito.mjs` | `transito` | `transitoGerado.ts` |
| chuva | `scripts/dados/chuva/rodar-chuva.mjs` | `chuva` | `chuvaGerado.ts` |
| noite | `scripts/dados/noite/rodar-noite.mjs` | — | `noiteGerado.ts` |
| procura | `scripts/dados/transito/onde-procurar.mjs` | — | `procuraGerado.ts` |
| equipamentos | `scripts/dados/equipamentos/rodar-equipamentos.mjs` (reads the audited hub, SHA-256 checked) | — | `equipamentosGerado.ts` |
| atrito | `scripts/dados/atrito/rodar-atrito.mjs` (IBGE CNEFE 2022 zip in `.cache/dados-recife/cnefe-completo/`, fixed SHA-256; category and counts only, never the establishment name, complement or CEP) | — | `atritoGerado.ts` |
| sol | `scripts/dados/preparar-sol-recife.py` | — | `sol/fontesGeradas.ts` |

- Areas come from `scripts/dados/areas.json` (pilot first, then expansion). The municipal building index is separate and covers every enabled bairro.
- A step is **skipped** when its code, its data inputs and the state left by earlier steps match the last successful run and its outputs are still active (`--sem-cache` forces a run). Big raw files are fingerprinted by size and modification time; a re-downloaded file therefore re-runs everything downstream.
- Records go to `.cache/ciclos/<id>/`: `antes.json` (restore point), `depois.json`, `ciclo.json` (per-step time and memory, versions before/after, buildings added/changed/removed per layer and area, source dates, problems), plus each step's own report.
- Review sheets in `docs/aplicacao/evaluation-sets/` are rewritten only while they hold no human answers. Once a `REVISAO_*` or `OBS_*` cell is filled, the sheet is kept and the regenerated version goes to `<name>.regerada.csv` (`scripts/dados/folhas.mjs`). Selected evaluation sets (`g-poi.json`, `g-route.json`, `g-rain.json`) are frozen once created.

## 1b. Municipal index from the audited hub (outside the cycle)

The index reads, per resource, the local copy of the Prefeitura hub extraction when it is listed in `docs/aplicacao/manifesto-extracao-{hub,complementar}-<date>.json`. Each file is checked against the manifest SHA-256 and size before use; values come back typed like the CKAN datastore (`TIPOS` in `scripts/dados/hub.mjs`); requested columns go through the same whitelist and personal columns are refused even as filters. Resources not in the hub (ITBI 2016–2025, Defesa Civil 2014–2023, LUSE, lighting, coleta, Census) still come from the CKAN cache, or from CKAN when the cache is missing. The partial 2025 copy of the 156 (`06872af2`) is refused.

```bash
# 1. Build the 94 partitions in staging (≈40 s, peak 2.2 GB). Stamp: <date>T00:00:00Z.
VEREDA_HUB=2026-11-15 node --max-old-space-size=10000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/construir-indice-recife.mjs --todos-bairros
# 2. Audit (structure, own-lot geometry, id collisions, 2 MB cap, personal columns) and diff against the active index.
node scripts/dados/auditar-indice-municipal.mjs --saida docs/aplicacao/execucoes/<id>/municipal-validacao.json --diff docs/aplicacao/execucoes/<id>/indice-diff.json
# 3. Activate (keeps the previous version; reads the staging's coleta-iptu.json for coverage).
VEREDA_AUDITORIA_MUNICIPAL=docs/aplicacao/execucoes/<id>/municipal-validacao.json node scripts/dados/ativar-indice-municipal.mjs
# 4. Re-run every layer on the new building ids, with a restore point, and check.
node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/ciclo.mjs --nome <id>
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/ciclo.mjs --conferir
# 4b. Bairro boxes for "Usar minha localização agora" (small, bundled; rerun after activating a new index).
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/localizar/caixas-dos-bairros.mjs
# 5. Did the refresh move the frozen evaluation sets? And regenerate the H1 sheet.
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/conferir-baselines.mjs --saida docs/aplicacao/execucoes/<id>/baselines.json
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/chuva/revisao-h1.mjs
```

What changes with a refresh, and what to read before activating:
- **Central 156:** the window is the 12 months that end at the newest published request (never after the stamp). With the 15 Nov hub: 20 Jun 2025 to 19 Jun 2026 (the 2026 file carries open requests back to 2009; 38,456 rows fall before the window). The same request (category, service, street, number, bairro, day) counts once across the 2025 and 2026 files and inside one file, keeping the latest status.
- **Licensing:** each works record now carries `[estado, válida até, impacto]` from `data_emissao_licenca`, `data_validade_licenca`, `situacao_processo` and `empreendimento_de_impacto`. It is a snapshot of the licensing base (P05), never proof that works started or ended. `areatotalconstruida` is empty for every "Obra" row and is not read.
- **Building ids:** read `indice-diff.json`. On 15 Nov: 4 added, 7 removed (5 fell below 2 residential units; 2 vanished from the IPTU file: `33804-120`, 126 units in Várzea, and `56839-1247`, 6 units in Torre). A saved analysis that points to a removed id opens without cadastre data; it does not crash.

The three Explorar examples (`EXEMPLOS` in `src/dados/raioX.ts`: `11720-2290` Boa Viagem, `59382-537` Graças, `1880-186` Madalena) point at fixed building ids. After activating an index, `tests/copiloto.test.ts` fails if one of them disappeared; pick a replacement with the criterion written next to it, never silently.

**CNEFE (atrito):** the IBGE file is the 2022 Census survey (published 17 May 2024). If IBGE republishes it, the pipeline stops on the SHA-256 check; download the new zip from the URL in `rodar-atrito.mjs`, update `SHA_DO_ZIP` on purpose, and rerun the cycle.

## 2. Recovery

| Situation | What happens | What to do |
|---|---|---|
| A step fails or is killed | Later steps do not run; each publication keeps its last good version; app modules of unfinished steps are untouched | Fix the cause, then re-run the cycle under a new name (finished steps are skipped) |
| A bad version reached the app | — | `ciclo.mjs --reverter <id>` restores pointers, app modules and published layer files to that cycle's restore point, after checking every version and file hash |
| A bad index refresh | The cycle's restore point already holds the new index pointer (activation runs before the cycle) | Two steps, in this order: `ciclo.mjs --reverter <id>` (layers back), then `ativar-indice-municipal.mjs --reverter` (index pointer back to the previous version), then `node scripts/dados/publicar-camadas.cjs` |
| Check current state | — | `ciclo.mjs --conferir` (exit 1 on any problem: unverifiable version, missing layer file, leftover temporary folder) |
| Coverage drop guard blocks activation | The new version stays inactive | Inspect the report; accept a deliberate redefinition only with the step's own flag (e.g. `--redefinir-cobertura` in chuva), recorded in the pointer |

Old app payload folders (`src/dados/recife/<layer>/<version>/`) are kept so a rollback can point back to them; do not delete them while a cycle that references them might be reverted.

## 3. Sources and cadence

| Source | Used by | How it enters a cycle | Suggested cadence | Age at the last live cycle (15 Nov 2026) |
|---|---|---|---|---|
| OSM Nordeste extract (Geofabrik, dated, MD5-checked) | walk network, day-to-day, night | `--ao-vivo` lists dated extracts; a newer one must be archived deliberately | monthly | newest dated extract (data to 13 Nov) |
| Defesa Civil 2014–2024 (Prefeitura CKAN) | observations, rain | archived raws; `--ao-vivo` probes 2024 (2 requests) | after each rainy season, or when the portal's declared count changes | live count = archive (80,173); 1,000/1,000 rows identical |
| Feiras, mercados públicos, Farmácias da Família (CKAN) | day-to-day | `--ao-vivo` fetches (budget 3 requests each), else the archive | monthly | fetched live 15 Nov |
| GTFS Grande Recife (pinned v2026.10.26, valid to 26 Oct 2027) | transit, night, where-to-look | pinned file; **not probed by the cycle** | check monthly; replace before expiry | snapshot 11 Nov |
| Municipal building index (IPTU/ITBI/cadastre, licensing, 156, CTTU) | everything | **outside the cycle** (section 1b) | quarterly, or after each hub extraction | generated 15 Nov from hub 2026-11-15 (`indice-municipal/faa40c969275e6b5`) |
| Registered equipment (traffic lights, audible signals, bike racks, Bike PE, cycle network, municipal health, culture, conservation units) and ESIG squares | Por perto, Sol e sombra (none) | cycle step `equipamentos`, from the hub (SHA-256) | per hub extraction | extracted 15 Nov 2026 |
| Edificações (lots, floors) | sun | local files in `.cache/sol-fontes`, hashes in the geometry report | when the Prefeitura republishes | published 2 Mar 2026 |

## 4. Review ownership

| Sheet | Rows waiting | What a reviewer confirms | Owner |
|---|---|---|---|
| `g-rain-h1.csv` (**first**) | 4 | the 4 flood records behind all 173 route consequences (H1: keep the rain block only if ≥ 3 hold, in ≤ 30 min); `revisao-h1.mjs --decidir` reads the answers | data lead (unassigned) |
| `g-building-revisao.csv` | 50 | building identity and entrance | data lead (unassigned) |
| `g-poi-revisao.csv` | 44 | place exists, category, public entrance | data lead (unassigned) |
| `g-rain-revisao.csv` | 38 | flood record location, date, mode | data lead (unassigned) |
| `g-transit-revisao.csv`, `g-transit-torre-revisao.csv` | 20 + 12 | itinerary matches the operator's timetable | data lead (unassigned) |
| `g-noite-observacao.csv`, `g-shade-observacao.csv` | 15 + 80 | field observation at the stated time | field visit (unassigned) |

No review has been worked yet (0 minutes). Before the next expansion, time one sheet to get minutes per row; that number, not compute, decides whether coverage can grow.

## 5. Measured economics (VE16)

| Measure | Value |
|---|---|
| Full offline cycle, 5 areas (c3) | 522 s on one laptop; peak 1.35 GB |
| Full offline cycle after the hub refresh (m1-hub-2026-11-15, 9 steps) | 576 s; where-to-look 236 s, equipamentos 19 s; 0 problems |
| Index rebuild from the hub, 94 partitions | 40 s; peak 2.2 GB; largest partition 1.93 MB (cap 2 MB) |
| Largest step | where-to-look, 215 s (41%) |
| Cached cycle, nothing changed | 0.2 s |
| Adding one area (where-to-look) | 10 s instead of 224 s with the per-area cache; the other steps still run in full (~5 min) |
| Rollback / re-apply | ~120 ms, verified against the restore point |
| Money | R$ 0 (no paid source, no remote service) |
| Machine time per building per full cycle | 0.18 s (2,825 buildings) |
| Human review | 0 minutes so far; 259 rows waiting |
| Cost per useful decision | not measurable without participants |

Known limits: the code fingerprint is global (editing any pipeline script re-runs every step); raw files are fingerprinted by size and modification time; GTFS and the building index are outside the cycle; the hub extraction is a dated snapshot (re-run `extrair-hub-recife.py` and `extrair-hub-complementar.py` to refresh it, then this whole section).

## 6. Base map (mapa-base, outside the cycle)

The drawing behind every map (blocks, lots, named streets, bairro limits, water, squares, bridges) comes from Prefeitura do Recife open data ("Área urbana" and "Parques e praças", ODbL). Sources, `lastModified`, SHA-256 and sizes are recorded in `FONTES_DO_MAPA_BASE` (`src/dados/recife/mapaBaseGerado.ts`); files live in `src/dados/recife/mapa-base/<sha>/` (one per bairro plus `cidade.json`). Raw downloads stay in `.cache/dados-recife/mapa-base/` (outside git). The legal opinion on ODbL (derived base in the repository, visible credit) is still pending: nothing leaves branch `feat/mapa-base` until it is in.

**When to regenerate**

| Trigger | Why |
|---|---|
| After activating a new municipal index (section 1b) | the "building the Vereda knows" mark depends on the active index; `tests/mapa-base.test.ts` fails when `INDICE_DO_MAPA_BASE` no longer matches it |
| When the portal republishes a source | `--atualizar` rereads portal metadata, downloads what changed (`last_modified` or size) and recomputes SHA-256 |

**Commands** (run from the repository root; flags as in the script header)

| Step | Command |
|---|---|
| Try first in a scratch folder (does not touch the published version, does not call `publicar-camadas`) | `node --max-old-space-size=4096 scripts/dados/construir-mapa-base.mjs --todos --saida .cache/mapa-base-teste --relatorio .cache/mapa-base-teste/relatorio.json` |
| Refresh sources from the portal (all, or a list of resource keys from `mapa-base/fontes.mjs`) | add `--atualizar` or `--atualizar <a,b>` |
| Publish every bairro (always replaces the whole version) | `node --max-old-space-size=4096 scripts/dados/construir-mapa-base.mjs --todos` |
| Only some bairros | `--bairros a,b` (refused if it would drop published bairros; list them too, or pass `--substituir` to drop the others on purpose) |
| Different clip border (experiments only) | `--borda <m>` is accepted only with `--saida`; the app assumes 300 m |

Write order on publish: new version files, then the module (atomic switch), then `publicar-camadas`, and last the previous version folder is removed.

**What to check**

1. Determinism: run the scratch build twice into two folders; every file SHA-256 must match (no generation date or absolute path is written).
2. Size: each bairro file at most 250 kB gzip (level 9). The report lists offenders in `acimaDoTeto`; `tests/mapa-base.test.ts` enforces it. Imbiribeira is about 2 kB below the cap today.
3. `npx jest tests/mapa-base tests/lgpd-artefatos.test.ts`
4. `node scripts/dados/publicar-camadas.cjs --conferir` (exit 1 if anything is stale or missing)

**Measured (18 Nov 2026, all 94 bairros)**: 12–13 s, about 650 MB peak memory; 21 MB raw, 7.6 MB gzip in total. The total is twice the planned 3.8 MB because the 300 m border repeats boundary features in both neighbours' files.

**If a bairro goes over the cap**: do not publish. Inspect its per-section weights in the `--relatorio` output, then try a smaller border in a scratch folder (`--saida ... --borda 150` measured 5.8 MB total and 197 kB for Imbiribeira). Changing the published border also changes what the app reads (it assumes 300 m), so it is a product and code decision, not a runbook step; record it before acting.
