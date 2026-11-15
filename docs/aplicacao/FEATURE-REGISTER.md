# VEREDA — Feature register (VE17)

Every feature enabled in the app, with its data, how that data is updated, who owns it and its programme status. Owners are **roles**: no named person has been assigned in this work, and the plan does not invent one. Before a public release, each role needs a person.

- **Product lead:** screens, wording, decision logic, participant studies.
- **Data lead:** sources, the update cycle, review sheets, coverage.
- **Platform:** storage, backup, offline, native builds.

Update policies refer to the [update runbook](RUNBOOK-ATUALIZACAO.md). "Cycle" means `scripts/dados/ciclo.mjs`; "index" means the municipal building index rebuild (`construir-indice-recife.mjs` → `ativar-indice-municipal.mjs`), which is outside the cycle.

## Dossier

| Feature (screen) | Code | Data | Update policy | Owner | Status |
|---|---|---|---|---|---|
| Top: lot map, summary, known monthly cost | `Topo`, `MapaDoLote`, `Custo` | listing (user), index, ANEEL tariff | listing: user edits; index: quarterly | product | adopt |
| Destaques | `Destaques` | derived from all blocks | follows its sources | product | adopt |
| Cadastro oficial (IPTU, ITBI, area, year) | `InfoDoImovel`, `cadastro.ts` | index (IPTU 2026, ITBI) | index, quarterly; ITBI and m² never share a line | data | adopt |
| A pé, a partir da entrada (essentials, plan B, errand chain) | `DiaADia` | cycle: rede + destinos | cycle monthly; G-POI review | data | iterate |
| Se a rua alagar (street history, conditional detours, small detours; eSIG catalogue as reference) | `SeAlagar`, `chuva.ts` | cycle: chuva (Defesa Civil ledger 2014–2024 + eSIG points/street list 2026) | cycle after each rainy season; **review the 4 driving records first**; eSIG layers re-fetched with the sources manifest | data | iterate |
| Voltando à noite | `Noite` | cycle: noite (GTFS, lamps, 156, CTTU) | cycle monthly; GTFS before expiry (26 Oct 2027) | data | iterate |
| Obras próximas / mudanças na vizinhança | `ARua`, `Entorno` | index (licences, 24 months) | index, quarterly | data | adopt |
| Sol nas fachadas | `SolNasFachadas` | cycle: sol (Edificações lots/floors) | when the Prefeitura republishes | data | iterate |
| De que lado vem o barulho | `Noite` (Edifício) | cycle: noite (main roads, LUSE) | cycle monthly | data | iterate |
| Desde que você guardou | `DesdeQueSalvou` | on-device snapshot + current layers | on demand, no background | product | iterate |
| Preparar a negociação | `Negociacao` | dossier facts + personal notebook | on demand; no external price range | product | iterate |
| Building documents, CNPJ, occurrences, photos, compass, visit | `Edificio`, caderno, `visita-v1`, `sol` | user-entered, private | user | product | keep |
| Internet onde você vai usar (fibre query by address/block/unit, per-room measurement, Anatel link) | `Conectividade`, `conectividade.ts` | user-entered, private | user | product | iterate (web verified; devices pending) |

## Compare

| Feature | Code | Data | Update policy | Owner | Status |
|---|---|---|---|---|---|
| Para decidir: brief, priority, decisive question | `Decisao` | dossier projections | follows its sources | product | adopt |
| Já tem a resposta? | `Decisao`, `resposta.ts` | user answer | user | product | iterate |
| Custo / Espaço / Entorno panels | `Paineis` | listing, index, cycle | as above | product | adopt |
| Rotina por horário | `Rotina` | cycle: transito (on-device RAPTOR) | cycle monthly; GTFS freshness check | data | adopt (engineering) |
| Price per hour saved, dominance | `Rotina` (ParaDecidir) | cost + routine | follows its sources | product | iterate |
| Onde mais procurar | `Rotina`, `procura.ts` | cycle: procura | cycle (per-area cache) | data | iterate |
| Comparáveis do meu caderno | `ComparaveisPessoais` | personal notebook only | user | product | iterate |

## Platform

| Feature | Data | Update policy | Owner | Status |
|---|---|---|---|---|
| Layer files outside the JS bundle (web cache, native assets) | `publicar-camadas.cjs` | rewritten by each pipeline; checked by `ciclo.mjs --conferir` | platform | adopt |
| Notebook, backup/restore with files, export | on-device | migrations tested in Jest | platform | keep |
| Coverage text on screens | generated modules | follows the cycle (`coberturaDasCamadas.ts`) | product | adopt |

## Not enabled (kept out on purpose)

| Feature | Why |
|---|---|
| Shaded walking routes | A15 rejected |
| External price ranges, valuation | A21/A31 deferred |
| Flood susceptibility prediction | A30 rejected |
| Street-image or listing AI extraction | A27/A28 deferred |
| Telemetry | No consent design; the plan keeps private routines on the device |
| Shared corrections, accounts, sync | A36 deferred |
