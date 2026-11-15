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
| sol | `scripts/dados/preparar-sol-recife.py` | — | `sol/fontesGeradas.ts` |

- Areas come from `scripts/dados/areas.json` (pilot first, then expansion). The municipal building index is separate and covers every enabled bairro.
- A step is **skipped** when its code, its data inputs and the state left by earlier steps match the last successful run and its outputs are still active (`--sem-cache` forces a run). Big raw files are fingerprinted by size and modification time; a re-downloaded file therefore re-runs everything downstream.
- Records go to `.cache/ciclos/<id>/`: `antes.json` (restore point), `depois.json`, `ciclo.json` (per-step time and memory, versions before/after, buildings added/changed/removed per layer and area, source dates, problems), plus each step's own report.
- Review sheets in `docs/aplicacao/evaluation-sets/` are rewritten only while they hold no human answers. Once a `REVISAO_*` or `OBS_*` cell is filled, the sheet is kept and the regenerated version goes to `<name>.regerada.csv` (`scripts/dados/folhas.mjs`). Selected evaluation sets (`g-poi.json`, `g-route.json`, `g-rain.json`) are frozen once created.

## 2. Recovery

| Situation | What happens | What to do |
|---|---|---|
| A step fails or is killed | Later steps do not run; each publication keeps its last good version; app modules of unfinished steps are untouched | Fix the cause, then re-run the cycle under a new name (finished steps are skipped) |
| A bad version reached the app | — | `ciclo.mjs --reverter <id>` restores pointers, app modules and published layer files to that cycle's restore point, after checking every version and file hash |
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
| Municipal building index (IPTU/ITBI/cadastre) | everything | **outside the cycle** (`construir-indice-recife.mjs`, `ativar-indice-municipal.mjs`) | quarterly | generated 22 Oct |
| Edificações (lots, floors) | sun | local files in `.cache/sol-fontes`, hashes in the geometry report | when the Prefeitura republishes | published 2 Mar 2026 |

## 4. Review ownership

| Sheet | Rows waiting | What a reviewer confirms | Owner |
|---|---|---|---|
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
| Largest step | where-to-look, 215 s (41%) |
| Cached cycle, nothing changed | 0.2 s |
| Adding one area (where-to-look) | 10 s instead of 224 s with the per-area cache; the other steps still run in full (~5 min) |
| Rollback / re-apply | ~120 ms, verified against the restore point |
| Money | R$ 0 (no paid source, no remote service) |
| Machine time per building per full cycle | 0.18 s (2,825 buildings) |
| Human review | 0 minutes so far; 259 rows waiting |
| Cost per useful decision | not measurable without participants |

Known limits: the code fingerprint is global (editing any pipeline script re-runs every step); raw files are fingerprinted by size and modification time; GTFS and the building index are outside the cycle.
