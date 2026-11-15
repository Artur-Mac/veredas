# VE02 — Evaluation record

## Objective and scope

Establish a reliable observation-to-publication pipeline (plan §7, VE02; applications A04, A37): data can be acquired, inspected, linked and published without silently corrupting the experience; a failing source degrades only its own layer; the last good publication survives.

**Entry dependency:** VE00 verified (baseline, issues I05, I08–I10). VE01 verified (its projection needs only `custoMensal` today; no new projection field was required from VE02).

**Acceptance (plan):** fixtures for 200-with-HTML-error, 403/429, repeated page, missing next page, shifted columns, wrong coordinate system, all categories failed, legitimate empty results, absent fees and an interrupted activation; no zero-record success labelled full coverage; reuse pagination and municipal staging tests.

## Work packages

| ID | State | Delivered | Evidence |
|---|---|---|---|
| VE02.01 Contracts | done | [`src/dados/observacao.ts`](../../../../src/dados/observacao.ts): `SnapshotDaFonte`, `Observacao`, `Quarentena`, `ManifestoDePublicacao` (Zod), with explicit collection state (`valida/vazia/parcial/falhou` + reason), value state (`conhecido/desconhecido/zero_declarado/a_confirmar`), spatial scale, date precision, units, separate event/administrative/published/retrieved times, parser and derivation versions, retention terms. `classificarColeta` and `estadoDaPublicacao` encode "200 is not success". Imports only `zod`, so the app, Jest and the Node 22 pipeline share it. No stored notebook schema changed → no migration needed | [tests/observacoes.test.ts](../../../../tests/observacoes.test.ts) |
| VE02.02 Adapters and collector repair | done | **Municipal API/file:** CKAN datastore collector ([coleta.mjs](../../../../scripts/dados/observacoes/coleta.mjs), reusing `http.mjs` and `paginacao.mjs`, mandatory field whitelist) and Defesa Civil normalizer ([defesaCivil.mjs](../../../../scripts/dados/observacoes/defesaCivil.mjs), per-row layout detection, administrative date kept separate from event time, quarantine). **HTML/structured page:** Geofabrik listing ([geofabrik.mjs](../../../../scripts/dados/observacoes/geofabrik.mjs)). **Deliberate listing import:** [observacoesDoAnuncio.ts](../../../../src/dados/observacoesDoAnuncio.ts). **Dated network extract:** `nordeste-261113.osm.pbf` (OSM data to 2026-11-13T21:22:20Z) archived at `.cache/osm/`, 445,428,124 bytes, published MD5 verified, SHA-256 `e5599530…`. **GTFS:** snapshot of both feeds ([gtfs.mjs](../../../../scripts/dados/observacoes/gtfs.mjs)); v2026.10.26 pinned for later runs. **OSM collectors repaired:** shared tested builder ([osm.mjs](../../../../scripts/dados/observacoes/osm.mjs)); `10-osm-pois.mjs` boxes now from official polygons (were near lat −8.8), broken regex quoting replaced, status no longer "ok" when categories fail; `12-amenidades.mjs` invalid `amenity["pharmacy"](…)` selectors replaced, `todosPois` scope fixed. Collectors not run live (dated extract preferred) | [pipeline tests](../../../../scripts/dados/observacoes/testes/pipeline.test.mjs) |
| VE02.03 Replay and promotion | done | Raw inputs archived content-addressed (`.cache/observacoes/brutos/`, 68 MB); deterministic normalization (2022 replayed twice in-run: identical; two separate runs produced the same version id); quarantine file per version; immutable versions + manifest + atomic pointer ([publicar.mjs](../../../../scripts/dados/observacoes/publicar.mjs)); activation requires intact hashes, compatible contract, "completa" state (or an explicit reason), and no per-key coverage drop > 20%. Rollback exercised on the real publication. Guard test for the app's active index ([publicacao-ativa.test.ts](../../../../tests/publicacao-ativa.test.ts)) | [reversao.json](logs/reversao.json), [comparacao-de-versoes.json](logs/comparacao-de-versoes.json) |
| VE02.04 Economics and health | done | [health.json](health.json): per source discovered/captured/parsed/linked/eligible/published, requests, bytes, runtime, source age, spend, review minutes; network extract and GTFS records; live probe | [measurements.json](measurements.json) |

## Commands actually run

```
node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/observacoes/testes/pipeline.test.mjs   # Node 22; first 30/32, final 33/33
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/observacoes/rodar.mjs [--ao-vivo] --relatorio …     # 1 offline + 4 live runs (see below)
npx jest --runInBand tests/observacoes.test.ts tests/rua-nucleo.test.ts
npm run typecheck   # exit 0, 8 s
npm run lint        # exit 0, 0 errors, 5 pre-existing warnings (expo lint skips .mjs; new .mjs checked with `npx eslint`: 0 errors)
npx jest --runInBand   # exit 0, 56/56 suites, 1468/1468 tests, 74 s
curl … nordeste-261113.osm.pbf(.md5) → .cache/osm/   # HTTP 200, 38 s, md5sum -c OK
```

Network use: Geofabrik listing/region pages (2 requests per live run), the 445 MB extract once, and CKAN Defesa Civil 2024 (2 requests per live run, budget-limited, whitelisted fields). One manual `curl` of a CKAN page (all columns) was used to diagnose the probe; its file was deleted.

## Results

**Engineering correctness.** All acceptance fixtures pass offline (33 Node tests + 18 Jest tests): 200 with HTML → `falhou/corpo_nao_e_dados`; CKAN `success:false` → falhou; 403 → `acesso_negado`; persistent 429 → `limite_de_taxa`, single 429 with `Retry-After: 0` → retried and valid; repeated page → parcial without duplicate rows; empty or short next page → parcial; budget → parcial; total 0 → vazia; shifted columns and "Maro" detected; unknown layout/invalid date/masked-only street quarantined; UTM-scale coordinates, swapped lat/lon and the old −8.8 boxes rejected; all categories failed → falhou; absent fee → `desconhecido`, declared zero → `zero_declarado`; interrupted write leaves no version and the pointer intact; a dead process's temp folder is never read; bad checksum blocks activation; partial versions need an explicit reason; coverage drop > 20% blocked; all sources failed → publication blocked; rollback restores the verified previous version.

**Data validity (Defesa Civil 2020–2024, replayed from archived raw).** Declared 388,739; captured 388,739; accepted 388,555; quarantined 184 (166 without a usable street, 7 without a date, 11 with impossible dates such as `21/202/2020` or `1900-01-17`). Layouts: 2020 and 2022 fully shifted, 2021/2023/2024 aligned. Linked to an official street code by name + neighbourhood: 235,774 (60.7%); ambiguous 5,263 (1.4%); unlinked 147,518 (38.0%) — **link precision not measured** (no reviewed labels). Incident category present in only 15,126 rows (3.9%): the source leaves `Ocorrencia` empty in most rows; the request type is kept in the excerpt. "Same day, street and category" coincidences (233,225) are not treated as duplicates because the house number is masked. Live probe (2024): source still declares 80,173 rows, and 1,000/1,000 fetched rows match archived rows by content.

**Important defect found in existing published data.** The existing street-layer reader (`scripts/dados/rua/nucleo.mjs`) recognized shifted rows by the month name in `Ano`, but the 2020 and 2022 files write March as "Maro". Every March row of those years — 10,577 (2020) and 11,322 (2022), including 110 citywide rows mentioning flooding and 94 rows in the pilot neighbourhoods — was silently dropped from the published street aggregates the dossier shows ("Atendimentos da Defesa Civil na rua"). Fixed in the shared reader with a regression test; **the app's published index has not been regenerated** (owner: VE06, which replaces street counts with the event ledger; interim undercount remains visible). The VE00 note that the reader "trusts the declared header" (I05) was partly wrong: it did detect shifted rows, except March.

**Errors made and fixed during the epoch.** (1) First publication used parser v1 (quarantined 21,910 March rows) — correct quarantine, wrong parser; (2) the fix was published once still labelled `@1` (version `bbaec268…`) — caught in review, parser bumped to v2 and republished as `8daa1b96…`; earlier versions kept for audit. (3) The CKAN collector initially requested all columns; the live resource now also publishes property measurements (`Altura`, `Largura`, `Area_m`) and other fields the existing pipeline excludes — the collector now refuses to start without a field whitelist (test added); the probe never stored the extra columns. (4) The probe compared `_id`s that the archive does not contain → replaced by content comparison. (5) Region-page size parser always returned null on the real page (sentence with "others.") — fixed via test. (6) GTFS reader first misread `lerZip`/`lerCsv` return types → self-flagged by failing checks, rewritten. (7) A test regex error.

**Operating viability.** Full replay + link + publish: 32–35 s wall, peak RSS ~1.1 GB, street index build ~18 s (dominant cost; cacheable). 0.083 ms per accepted record. Publication 12.3 MB gzip (not shipped to the app). Raw archive 68 MB. Spend R$ 0; human review 0 minutes. One update cycle measured; two cycles with a failed-source run are VE16.

**Customer usefulness.** No direct customer change. The value is preventive: one silent undercount found and characterised, and the next layers (routes, rain ledger) start on validated, versioned inputs.

## Remaining work and limits

- ~~Regenerate the published app index with the fixed March reader~~ — done in the follow-up below (index `5bad409c1782ca8a`).
- Review a sample of street links (precision) — needs G-BUILDING/G-RAIN labels (VE03/VE06).
- ~~Activator reads a moved audit file~~ — **correction:** this was wrong. `docs/plano-recife/execucoes/municipal-validacao.json` exists and is tracked; I misread a directory listing. The activator now also re-hashes the files it wrote before switching the catalog, and both the audit test and the activator accept `VEREDA_AUDITORIA_MUNICIPAL` so a new audit need not overwrite the historical one.
- Pipeline tests are not in `npm test` (they need Node 22; `package.json` carries your uncommitted edits, so no script was added). Command above.
- The noise layer still comes from GTFS v2026.10.16; regeneration by calendar is VE05.

## Outcome

**State: verified** (all VE02.01–04 delivered; every acceptance fixture passes; no zero-record success can be labelled complete). **Outcome: adopt** the contract, collectors, publication/rollback and health report as the data path for VE03 onward.

## Follow-up (2026-11-14): published index regenerated with the fixed reader

**Request:** regenerate the app's municipal index so the dossier's Defesa Civil street counts include the March rows lost to the "Maro" spelling.

**What was found first.** The 2014–2019 Defesa Civil years come from CSVs whose cache stores rows *already read* by the old reader, keyed only by query (`versao: 1`). Re-reading the 2015 and 2019 CSVs showed March was lost there too: 10,212 → 33 discarded rows (2015) and 5,761 → 21 (2019). The cache key now includes the reader version (`versao: 2` in `scripts/dados/rua/camadas.mjs`), so the six CSVs (2014–2019) were downloaded again and re-read; 2014, 2016–2018 were unchanged.

**Commands.**
```
cp -a .cache/dados-recife/{indice-municipal-staging,defesa-civil-201[4-9].json} .cache/backup-antes-regeneracao-2026-11-14/
node scripts/dados/construir-indice-recife.mjs --todos-bairros                      # Node 22, exit 0, 34 s; all sources from cache except the 6 CSVs
python3 -I docs/aplicacao/execucoes/VE02/regeneracao-indice/comparar.py > …/comparacao.json
VEREDA_AUDITAR_MUNICIPAL=1 VEREDA_AUDITORIA_MUNICIPAL=…/municipal-validacao.json npx jest --runInBand tests/municipal-staging.test.ts   # 3/3
VEREDA_AUDITORIA_MUNICIPAL=…/municipal-validacao.json node scripts/dados/ativar-indice-municipal.mjs                                  # exit 0
npm run typecheck && npx jest --runInBand                                                                                             # 56/56, 1468/1468
```

**Acceptance of the regenerated data** ([comparacao.json](regeneracao-indice/comparacao.json)). Every changed JSON path is under `rua.logradouros.*.defesaCivil`; no unexpected path; 0 building-count changes; `meta.json` identical; 25 of 72 enabled partitions byte-identical, 47 changed (the audit independently finds 47 of 94 staging hashes differ from the previous audit). Defesa Civil records attached to indexed streets: 43,385 → 45,539 (+2,154, +5.0%). Flood-category counts unchanged (141 records on 61 streets). Pilot: Boa Viagem 1,799 → 2,656; Casa Forte 153 → 155; Graças 501 → 506; Espinheiro 421 → 431; Madalena 446 → 455.

**Activation.** New version `indice-municipal/5bad409c1782ca8a` (72 neighbourhoods, 7,206 buildings). The catalog diff is only the version id; the previous catalog (`91b71d239c1847cf`) is saved in `.cache/dados-recife/publicacao-anterior.ts` (`node scripts/dados/ativar-indice-municipal.mjs --reverter` restores it); both older version folders remain; backups in `.cache/backup-antes-regeneracao-2026-11-14/`.

**Rendered check** (Expo web, 375 px, no external requests): a dossier confirmed to building 53490-78 (Rua Salgueiro, Boa Viagem) now shows "Atendimentos da Defesa Civil na rua: 749" (was 33).

**New finding — the metric mixes outreach with risk work.** 712 of the 716 rows added to Rua Salgueiro are one day (2019-03-29) of a door-to-door campaign: 356 "Ações de Porta-Porta" + 356 "Atendimento Social", no category, no risk grade. In the 2019 file overall, outreach is 18,606 of 89,955 rows (20.7%); other types include risk-area mapping (30,784), visual structural analysis (3,599) and tarpaulin requests (1,039). The street metric has always counted every action type (other campaigns, e.g. 258 rows on one Jardim São Paulo street in May 2019, were already published); the regeneration made it conspicuous on a pilot street. The dossier now asks the person to check whether any of 749 "atendimentos" happened at their building, which overstates risk. The action type (`Tipo_da_Acao`) is published in every year but is not in the collection whitelist. **Resolved in follow-up 2 below** (outreach now counted separately).

**Not done:** the outreach/risk split; human review of any street; the 2014–2019 CSV re-downloads were not archived as raw files (the cache keeps only whitelisted, already-read fields, as before).

## Follow-up 2 (2026-11-14): outreach separated from Defesa Civil attendances

**Request:** split outreach from risk attendances in the street metric.

**Evidence before coding.** The portal's SQL endpoint is disabled, so I sampled 1,500 rows per datastore year (offsets 0, 30,000 and 60,000; whitelisted descriptive fields only, never `Altura/Largura/Area_m`). `Data_da_Acao` held a date in 7,500/7,500 sampled rows and `Tipo_da_Acao` held an action name in every year, including the shifted 2020 and 2022 files, so the action type is not affected by the column shift. Outreach in the samples ranged from about 11% (2021) to about 55% (2024).

**Rule (D018).** `classeDaAcao` in `scripts/dados/rua/nucleo.mjs`: "comunitária" when the normalized type matches door-to-door (`porta…porta`, including "Porta-Porta"), social assistance, distributions (food baskets, mattresses, blankets), educational actions, talks, training, drills or referrals to partners; everything else — including an empty or unknown type, risk-area mapping, visual structural analysis, evacuation guidance, tarpaulins, clearing, tree cutting, demolition — remains an attendance. Conservative by design: in doubt, the row still counts. The first test run caught that the source writes "Porta-Porta" without "a"; the pattern was corrected before regeneration.

**Changes.** `Tipo_da_Acao` added to the Defesa Civil whitelist (field names now compared without separators); CSV cache `versao: 3`; the street layer counts outreach in a new optional field `acoesComunitarias` and excludes it from `atendimentos`, `porAno`, `ocorrencias` and `grafia`; contract `esquemaIndiceDoBairro` accepts the optional field (older indexes stay valid); the dossier detail adds "Fora da conta: N ações comunitárias da Defesa Civil (porta a porta, atendimento social, donativos)" when N > 0; the VE02 observation adapter lists `Tipo_da_Acao` as a known column. Tests added: classifier (19 real values), reader output, dossier text with and without outreach, index invariant.

**Regeneration.** Builder: exit 0, 60 s; the five datastore years were re-fetched (≈ 780 pages, totals unchanged: e.g. 2024 80,173, 2023 83,164) and the six CSV years re-read. Comparison ([comparacao.json](separacao-comunitaria/comparacao.json)) against index `5bad409c1782ca8a`: all changes under `rua.logradouros.*.defesaCivil`; the only meta change is the added column in `colunasUsadas`; 0 building-count changes. Street-attached Defesa Civil rows: 45,539 → 26,719 attendances + 18,820 outreach actions (41%). Flood-category counts unchanged (141 records on 61 streets). Pilot attendances (outreach in parentheses): Boa Viagem 2,656 → 1,057 (1,599); Casa Forte 155 → 84 (71); Graças 506 → 282 (224); Espinheiro 431 → 211 (220); Madalena 455 → 232 (223). Staging audit 3/3; activation exit 0 → **`indice-municipal/1e393803851f3fd5`** (previous `5bad409c1782ca8a` saved for `--reverter`; backups in `.cache/backup-antes-separacao-comunitaria-2026-11-14/`).

**Checks.** Typecheck 0 errors; lint 0 errors (5 pre-existing warnings); Jest 56/56 suites, 1,470/1,470 tests; pipeline tests 33/33. Rendered dossier (building 53490-78, Rua Salgueiro, 375 px): "Atendimentos da Defesa Civil na rua: 14 — 12 por imóvel com danos ou risco e 2 sem ocorrência registrada … Fora da conta: 735 ações comunitárias…", prompt now "registrou 14 atendimentos (2014 a 2020, em 5 anos)"; 0 external requests, 0 page errors, 0 px overflow.

**Limits.** The classification rule is mine and unreviewed by Defesa Civil staff; about 30–50% of rows have an empty action type and stay counted; "attendance" still mixes inspections, mapping and maintenance (one number, not a risk score); the VE02 observation publication (`8daa1b96…`) predates the new column and was not republished; G-RAIN episode work remains VE06.
