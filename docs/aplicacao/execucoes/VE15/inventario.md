# VE15.01 — Inventory of existing optional extensions

Classification of what the app already has outside the core comparison, from the code (`src/componentes/caderno/*`, `src/componentes/sol/*`, `src/componentes/visita-v1/*`, `src/dados/backup.ts`, `src/dados/resumo.ts`) and its tests. Nothing was removed or rebuilt because it appeared in an older plan.

| Extension | Where | Tests | Classification | Why |
|---|---|---|---|---|
| Personal notebook records: observations, diary, reminders, expectations vs experience | `Registros`, `Lembretes`, `Historico` | `caderno-amplo` | **keep** | Private, optional, already validated and backed up |
| Listing history (edits and re-imports, before → after) | `Historico`, `historicoDoAnuncio.ts` | `historico-do-anuncio` | **keep / integrated** | VE09 snapshot and VE10 price history read from it |
| Building documents (laudo, ata, balancete, convenção, CNDT, TRT, licence, matrícula) with page, scope, excerpt and PDF | `Edificio` (DocumentosDoEdificio) | `caderno-amplo`, `privacidade` | **keep; integrate later** | Values are free-text excerpts. Linking a document to a decision field (e.g. condo fee from a balancete) is the next step, but VE15 chose the faster path (answer field, below) |
| Building legal entity (CNPJ) and public occurrences (TRT, Defesa Civil confirmation) | `Ocorrencias`, `Complementos` | `caderno-amplo` | **keep** | Presence of a public process is shown as a record, not a defect verdict (plan VE15.02) |
| Photos (up to 5, private) | `Fotos` | `caderno-amplo`, `midia-nativa-integridade` | **keep** | Optional; no analysis of content |
| Compass/sun window capture and "Sol nas suas janelas" | `sol/*`, `/sol` | `sol-*` (5 suites) | **keep; integrated** | VE07 façade block complements it (building side vs unit window) |
| Visit flow (verifications, own questions, answers, sessions) | `visita-v1/*` | `telas-*`, `visita-*` | **keep; repair (VE11.04)** | Answers are free text; VE15 adds a structured answer where the decisive question is a value |
| Routine destinations with GPS (private) | `caderno/Rotina` | `caderno-amplo` | **keep; integrated** | VE05/VE11 Compare reuse them |
| Personal budget and scenarios (rent vs buy, Price) | `Orcamento`, `EditarCenario` | `caderno-amplo` (`orcamento`) | **keep** | User-entered assumptions; no rate default supplied by the app |
| Household profile (residents, AC use, destination, days, financing) | `perfil-domicilio` | `perfil-*` | **keep** | Optional; the core comparison works with defaults |
| Backup / restore (with files) and notebook copy | `BackupComArquivos`, `dados-do-caderno` | `caderno-amplo`, `piloto-integridade` | **keep** | VE12 round trip covers VE05–VE11 fields |
| Shareable summary / PDF (private notes excluded by default) | `Resumo` | `caderno-amplo` | **keep** | Opt-in sharing only |
| Legacy example dossiers (`/exemplos/*`) | `app/exemplos` | `leitor-decidir`, `exemplos-regua` | **defer (historical reference)** | Hidden from the journey (D027) |
| Shared/public corrections | — | — | **defer** | Not built. Plan: private first; shared needs opt-in, review, deletion and minimal fields |
| Account / sync / professional reports | — | — | **defer** | No demonstrated need; no server |

## VE15.04 — Context experiments queue (research tasks only)

| Need | Accessible source? | Granularity | Disposition |
|---|---|---|---|
| Connectivity (fibre/4G at the address) | No permitted address-level source found in this work | — | research task |
| Utilities (energy tariff) | ANEEL homologated tariffs already used for the energy estimate | Utility-wide | keep as is |
| Public health (arboviroses) | SINAN by bairro already in `camadas-ambientais` | Neighbourhood | keep at neighbourhood scale; never a building metric |
| Coastal / marinha land status | The app already shows a *signal* (`indicioDeMarinha`) for purchases | Coastal band, not parcel | keep as a question to confirm with primary records; no legal conclusion |
| Auctions / distressed sales | Not explored | — | separate universe; research task only (X17) |
| Professional reports (engineering inspection) | User-supplied documents only | Document | keep as optional document; no automatic defect diagnosis |
