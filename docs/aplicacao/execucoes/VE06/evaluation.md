# VE06 — Evaluation record

## Scope of this invocation

The user asked for two things on 2026-11-14:
1. Fix the inconsistent dossier navigation, using the main dossier (`/dossie`) as the approved layout.
2. Continue the functional epochs, showing what changes for the person before the underlying records.

This record covers both. The navigation fix is recorded here because it shipped in the same change.

## Part 1 — Dossier navigation

**What caused the mismatch.** The app has two dossier screens built on two data models:
- `/dossie` renders the person's saved analysis (`AnaliseV2`) from the notebook. It uses the approved mobile layout: lot map, property summary, known monthly cost, then the Destaques, Entorno and Edifício tabs.
- `/exemplos/[id]` renders the five prototype dossiers in `docs/mock/dossies/*.json`. These have their own schema (`esquema.ts`), an older layout, and illustrative values ("R$ 4.500/mês ilustrativo").

Recent analyses (Início) and Salvos both call the same opener (`destinoDaAnalise` → `/dossie`). Two entry points still led to the prototype screen:
- the quick-menu item "Dossiês de exemplo";
- the example cards on Início, shown only when the notebook is empty.

**Why the examples were not moved onto the current screen.** That would not be a small adaptation:
- **Data:** the examples carry illustrative listing data in a different model.
- **Write actions:** everything on `/dossie` that acts on the analysis (save, discard, confirm building, edit, details, prepare visit, compare) looks the analysis up by id in the notebook, and several of these write to it.
- **Risk:** showing an example there would need a read-only mode across those routes, or would risk example data reaching the person's notebook.

Following the user's fallback instruction, the two entry points were removed from the main journey. The `/exemplos/*` screens are kept unchanged as historical references, still reachable by URL, with a header comment saying so.

**Changes.**
- [MenuRapido.tsx](../../../../src/componentes/casca/MenuRapido.tsx): menu item removed.
- [index.tsx](<../../../../src/app/(abas)/index.tsx>): Início example cards removed, along with their unused imports and styles.
- [exemplos/[id]/_layout.tsx](../../../../src/app/exemplos/[id]/_layout.tsx): historical-reference note.
- Tests:
  - [telas-fatia5.test.ts](../../../../tests/telas-fatia5.test.ts): the menu lists no `/exemplos` route;
  - [v1-smoke.mjs](../../../../scripts/v1-smoke.mjs): the menu offers no example; the old screen still opens by URL and keeps its accessibility check.

**Verification** ([ve06-navegacao.mjs](scripts/ve06-navegacao.mjs), Expo web, 375 px, real building 10537-232, synthetic listing values). The script recorded the landing URL and the approved-layout markers (tabs plus monthly cost) before and after the fix:

| Flow | Before | After |
|---|---|---|
| Início → recent analysis | `/dossie`, approved layout | `/dossie`, approved layout |
| Salvos → saved analysis | `/dossie`, approved layout | `/dossie`, approved layout |
| Início → recent analysis again, after the other flows | — | `/dossie`, approved layout |
| Quick menu → "Dossiês de exemplo" | `/exemplos/boa-viagem`, old layout, illustrative data | not offered |
| Empty Início → example cards | 5 cards → old layout | 0 cards |
| Saved analysis afterwards | intact | intact |

Logs: [before](logs/navegacao-antes.json), [after](logs/navegacao-depois.json). Screenshots: `out/ve06/navegacao-*`.

## Part 2 — VE06: what happens to access when a documented street floods

**Outcome sought (plan §7):** a historical rain record becomes an understandable access consequence with a plan B (A07, A11–A13).

| ID | State | Delivered |
|---|---|---|
| VE06.01 Event ledger | done (Defesa Civil only) | See notes below the table. |
| VE06.02 Adjudication | set built, unreviewed | See notes below the table. |
| VE06.03 Historical route replay | done | See notes below the table. |
| VE06.04 Data-value experiment | not run | Needs reviewed labels; recorded as pending. |

**VE06.01 — event ledger.** [livro.mjs](../../../../scripts/dados/chuva/livro.mjs) and [rodar-chuva.mjs](../../../../scripts/dados/chuva/rodar-chuva.mjs) read the cached Defesa Civil attendances for 2014–2024.

| Measure | Value |
|---|---|
| Flood-category records | 1,645 |
| By type | 724 "Alagamentos" (street) and 921 "Imóveis Alagados" (property) |
| By date precision | 726 with a day, 919 with only a year |
| Observations after merging duplicate bulletins | 763 (same street, type and date) |
| Episodes (dates ≤ 1 day apart, the plan's 24-hour hypothesis) | 31, the largest from 3 June 2022 (129 observations) |

Rules applied to every record:
- the date is administrative, never an event time;
- year-only rows join no episode;
- the affected mode is "not stated";
- an absence of records is not read as a dry street.

The 2014–2019 caches keep only the year, so those floods stay "date uncertain". CTTU closure and reopening bulletins were not available as a located source, so nothing was invented.

**VE06.02 — adjudication.** [G-RAIN](../../evaluation-sets/g-rain.json) holds 38 cases:
- 30 network-linked street floods across 9 episodes;
- 4 year-only records;
- 4 ambiguous or unmatched locations.

Two whole episodes are held out (3 test cases). A review sheet asks for location, event date and mode. Nobody has reviewed it.

**VE06.03 — historical route replay.**

| Linking step | Count |
|---|---|
| Street floods | 394 observations |
| Official street matched by name and neighbourhood | 175 |
| Túnel da Madalena (tunnel edges inside the neighbourhood) | 7 |
| Linked to walking-network edges in total | 182 |
| Unmatched or ambiguous names | 176 |

For long roads the record does not give the point, so only the stretch inside the record's neighbourhood is closed; 88 of the linked observations are flagged as long roads.

For each strong-link pilot building, the route to the nearest mapped grocery, pharmacy and stop is recomputed without the flooded stretch. Results:
- 642 route-crossings were compared in Boa Viagem; 449 changed by less than 3 minutes and are not shown.
- Material consequences (+3 min or lost access) reach 175 buildings in Boa Viagem, 26 in Madalena (the tunnel), 12 in Espinheiro and 1 in Casa Forte.
- Where the flooded street is the building's own, the dossier says so once instead of listing every destination as lost: 28 buildings in Boa Viagem, 11 in Espinheiro, 1 each in Casa Forte and Madalena.

**What the person sees** ([SeAlagar.tsx](../../../../src/componentes/dossie-v1/SeAlagar.tsx), in Entorno → "A pé, a partir da entrada"). The consequence comes first; the record is one tap away under "Ver o registro":

> Se a Avenida Barão de Souza Leão alagar como em 30/06/2023, o caminho a pé até o mercado passa de 6 min para 13 min, por outro caminho.
>
> *Ver o registro:* Defesa Civil do Recife … "Alagamentos" em Avenida Barão de Souza Leão, Boa Viagem, em 30/06/2023. A data é a do registro, não a hora da chuva, e o registro não diz se a passagem a pé foi bloqueada … (a rua é longa e a fonte não diz o ponto; consideramos os 1,7 km dela dentro do bairro). Não ter registro não quer dizer que a rua não alaga.

## Checks actually run

```
node scripts/dados/chuva/rodar-chuva.mjs --relatorio docs/aplicacao/execucoes/VE06/chuva.json --redefinir-cobertura "<motivo>"   # Node 22, 35 s, 0.4 GB
node --test scripts/dados/chuva/testes/livro.test.mjs … (all pipeline suites)   # 73/73
npm run typecheck && npm run lint && npx jest --runInBand   # 0 errors; 0 errors / 5 pre-existing warnings; 59/59 suites, 1506/1506
POC_URL=… node docs/aplicacao/execucoes/VE06/scripts/ve06-navegacao.mjs antes|depois
POC_URL=… node docs/aplicacao/execucoes/VE06/scripts/ve06-render.mjs   # 375 and 360 px
POC_URL=… SMOKE_OUT=out/ve06/v1-smoke node scripts/v1-smoke.mjs   # 50/50
```

**Tests.**
- **Pipeline (8 tests):** the plan's acceptance cases:
  - duplicated bulletins;
  - shifted administrative columns, including the corrupted "MÃªs" header;
  - year-only dates kept out of episodes, and episode gaps;
  - mode and time never invented;
  - same street name in two neighbourhoods;
  - perpendicular crossings excluded;
  - a long road trimmed to the neighbourhood;
  - two paths sharing a bottleneck: the detour is found, and the limit is reported as lost access.
- **Jest (6 tests):**
  - real payloads validate;
  - only material scenarios are kept;
  - exact sentences for three real buildings;
  - two tunnel records become one sentence;
  - the own-street wording.

**Defects found in review and fixed.**
1. Own-street floods showed as "no grocery within 2 km" for every category; they now get one line about the exit.
2. Sub-minute changes would have reached the person; a materiality threshold now filters them.
3. The 1.7 km figure used a decimal point instead of a decimal comma.
4. The publication guard correctly blocked the coverage drop caused by the redefinition. Activation now needs an explicit `--redefinir-cobertura` reason, which is stored in the pointer (`parcialAceita`). The earlier version came from this same epoch and nothing consumed it.

**Not reviewed or not done.**
- Link precision: no person has reviewed G-RAIN.
- Whether a flood blocked walking: the source does not say.
- Rainfall and tide linkage: no station series were ingested.
- Closures and reopenings: no CTTU source was available.
- VE06.04: the review-priority experiment was not run.
- Long roads are closed over their whole in-neighbourhood stretch, which overstates the impact where the flood was at one point.

## Outcome

**State: partial. Outcome: iterate.**
- The navigation fix is verified.
- VE06.01 and VE06.03 are implemented and tested.
- VE06.02 lacks review, and VE06.04 has not been run.
