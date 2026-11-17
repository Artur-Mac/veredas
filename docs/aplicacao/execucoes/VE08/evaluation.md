# VE08 — Evaluation record

## Objective and scope

Give useful, time-specific context for the route home and the next visit (plan §7, VE08; applications A09, A16, A17). Hard limits for this epoch:
- no safety or crime labels;
- no decibel figures;
- no use of the old airport noise cone.

## Work packages

| ID | State | Delivered |
|---|---|---|
| VE08.01 Crossing and lighting evidence | done (estimates, unreviewed) | Main-road crossings estimated on the walking network. Installed lamps (inventory) kept apart from 156 "lâmpada apagada" requests, with dates and status. CTTU pedestrian collisions linked to the streets the path uses. |
| VE08.02 Evening scenario | done | Walk from the nearest stop with arrivals 22h–02h on a typical weekday, crossings, last scheduled arrival, and an equal-or-short alternative with fewer crossings (details only). |
| VE08.03 Source and façade context | done (partial) | Side of the building facing the nearest main road (≤ 80 m, with weekday departures from D026) and the nearest valid LUSE venue (≤ 150 m). Airport not used. |
| VE08.04 Observation campaign | sheet only | [g-noite-observacao.csv](../../evaluation-sets/g-noite-observacao.csv): 15 cases (2 evening walks and 1 noise side per area); nothing observed. |

### Inputs

| Source | What is used | Count |
|---|---|---|
| Pinned GTFS v2026.10.26 (VE05) | Stops with arrivals 22h–02h on Tuesday 17/11 | 6,555; 1,101 still have arrivals after 02h |
| Public-lighting inventory 2025 | Installed lamps | 111,666 |
| 156 "MANUTENCAO EM LAMPADA APAGADA" | Requests with date and status, 30/01/2025–30/01/2026 | 14,571 |
| CTTU 2022–2024 | Collisions involving pedestrians, linked to an official street by name and neighbourhood | 12,016 records; 671 with a pedestrian; 577 linked |
| VE03 walking network | Main-road edges (bit 8) | — |
| VE03 walking network | Mapped crossings (bit 16) | only 2,919 citywide |
| Municipal index | LUSE records with their validity status | — |

**How crossings are estimated** ([travessias.mjs](../../../../scripts/dados/noite/travessias.mjs)). A crossing is counted when the path passes through a main-road junction from one side street to another, or uses a mapped crossing that touches a main road. Turning onto a main road is not a crossing. It is an estimate because the network is centreline-based.

## What the person sees

**"Voltando à noite"**, inside "A pé, a partir da entrada":

> Chegando de ônibus depois das 22h num dia útil: o ponto mais perto com chegada nesse horário é o Ponto na Avenida Boa Viagem, a 3 min a pé, com 1 travessia de via principal. O último ônibus programado chega lá às 23:50.

Behind "Ver o caminho à noite":
- installed lamps, and the longest stretch without one;
- 156 lamp-out requests and how many are still open, stating that the inventory does not say whether a lamp works;
- recorded pedestrian collisions on the streets used, with count, deaths and years, stating that the record gives the street, not the point or the hour;
- an alternative with fewer crossings, if there is one;
- "Isto não é uma avaliação de segurança da rua."

**"De que lado vem o barulho"**, in the Edifício tab:

> O lado sudeste do prédio dá para a Avenida Boa Viagem, via principal a 30 m, com 544 partidas de ônibus num dia útil no ponto mais perto. Para comparar o barulho, visite num dia útil entre 17h e 19h e ouça também o lado noroeste.

With a LUSE venue nearby, the block adds: "a licença não diz horário nem volume, então vale passar numa sexta ou num sábado à noite". "Levar para a visita" saves the check to the roteiro. The note says there is no decibel measurement and why the airport is not included.

## Results (pilot, strong-link buildings)

| Area | Buildings | Night stop ≤ 1 km | Median crossings | Fewer-crossing alternative | Main road ≤ 80 m | Valid LUSE ≤ 150 m |
|---|---|---|---|---|---|---|
| Boa Viagem | 1,761 | 1,761 | 0 | 112 | 1,064 | 113 |
| Casa Forte | 78 | 78 | 0 | 0 | 22 | 0 |
| Graças | 285 | 285 | 0 | 1 | 124 | 21 |
| Espinheiro | 151 | 151 | 0 | 3 | 91 | 0 |
| Madalena | 241 | 241 | 0 | 7 | 166 | 0 |

Alternatives are almost always the same length, so the app does not draw them and they stay in the details. Payload: 387 KB across five lazy files. Pipeline: 21 s and 0.5 GB.

## Checks actually run

```
node scripts/dados/noite/rodar-noite.mjs --relatorio docs/aplicacao/execucoes/VE08/noite.json   # Node 22, 21 s
node --test (pipeline suites incl. noite/testes/travessias.test.mjs)   # 81/81
npm run typecheck && npm run lint && npx jest --runInBand   # 0; 0 errors / 5 pre-existing warnings; 61/61 suites, 1520/1520
POC_URL=… node docs/aplicacao/execucoes/VE08/scripts/ve08-render.mjs   # 375 and 360 px; Boa Viagem 11720-5110, Graças 12610-150
POC_URL=… SMOKE_OUT=out/ve08/v1-smoke node scripts/v1-smoke.mjs   # 50/50
```

**Tests.**
- **Node, crossing rule (4):** side street to side street across the main road counts 1; walking along it counts 0; turning onto it counts 0; a mapped crossing touching it counts 1.
- **Jest (6):**
  - the real payloads validate: references exist; the last arrival falls between 22h and 06h; the alternative has fewer crossings and is no shorter, at most +20%; open requests never exceed total requests;
  - the night-walk sentence states the stop, the minutes, the crossings and the last arrival or overnight service;
  - lamps-versus-requests wording;
  - collision wording (street, count, years, no point or hour);
  - the noise side and its opposite, with a question that fits the roteiro and a note on decibels and the airport;
  - LUSE wording;
  - no safety, crime, income or decibel terms in the sentences.
- **Refactor check:** moving the crossing rule into a module reproduced the payload byte for byte.

**Defects found in review and fixed.**
1. The alternative's length omitted the stop's snap distance, so alternatives appeared shorter than the shortest route.
2. "Último ônibus" was capped at 02h, so stops with buses through the night showed a false "last" time (1,101 stops have arrivals after 02h). It now says there is service in the early hours.
3. The Boa Viagem payload was 565 KB; it is now 282 KB, keeping only streets with collisions.
4. The noise-block title mentioned licensed sound when there was none.
5. Lint: two unused variables.

**Not done.**
- No one has reviewed whether a counted crossing is a real one; G-ROUTE has 30 routes, none reviewed yet.
- Lamp working condition is unknown; only the inventory and the reports exist.
- CTTU records carry no time of day, so they are not evening-specific.
- Airport contours: the official plan has not been georeferenced or checked.
- The observation campaign has not been run.
- Opening hours for an evening walk are not interpreted (VE04 kept them as raw text).

## Outcome

**State: partial.** Implemented and tested; no observations; crossings are estimates. **Outcome: iterate.**
