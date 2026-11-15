# VE06 — Summary

The navigation mismatch had one cause: the app has two dossier screens built on two data models. Recent analyses and Salvos open `/dossie`, which shows the person's saved analysis in the approved layout (lot map, summary, known monthly cost, then Destaques, Entorno and Edifício). The quick-menu item and the empty-Início cards called "Dossiês de exemplo" opened `/exemplos/[id]` instead. That screen renders prototype dossiers from `docs/mock` in an older layout with illustrative values. Moving the examples onto `/dossie` would not be a small change: every action there (save, discard, confirm building, edit, details, visit, compare) looks the analysis up in the person's notebook, and several write to it. So both entry points were removed from the main journey, and the old screens were kept unchanged as historical references, reachable only by URL. A scripted check at 375 px shows that opening a recent analysis, reopening it from Salvos, and opening it again all land on `/dossie` in the approved layout. No example is offered any more, and the saved analysis is untouched. VE06 (access after a documented street flood) is **partial**. A ledger of 1,645 Defesa Civil flood records (2014–2024) now separates street flooding from flooded properties, merges duplicate bulletins into 763 observations, and groups dated ones into 31 episodes; dates are kept as administrative and the affected mode as "not stated". The pipeline links 182 observations to the walking network and replays each pilot building's walk to the nearest grocery, pharmacy and stop without the flooded stretch. The dossier's walking section now leads with the consequence, for example: "Se a Avenida Barão de Souza Leão alagar como em 30/06/2023, o caminho a pé até o mercado passa de 6 min para 13 min, por outro caminho". The Defesa Civil record and the method's limits sit one tap away under "Ver o registro".

Checks run: Jest 59/59 suites (1,506 tests, 6 new for the flood block), Node 73/73 (8 new covering the plan's acceptance cases), typecheck and lint clean, web smoke 50/50 with its example step rewritten for the new navigation, and rendered checks at 375 and 360 px with no overflow, page errors or external requests. The new flood tests check:
- duplicate bulletins and shifted administrative columns;
- year-only dates, which stay out of episodes;
- the same street name in two neighbourhoods;
- long roads trimmed to the record's neighbourhood;
- perpendicular crossings excluded;
- two paths sharing a bottleneck;
- the exact sentences for three real buildings.

Review found and fixed four problems. A building whose own street flooded showed as having lost every destination; it now gets one line about the exit. Changes under 3 minutes would have reached the person; of the 642 route-crossings compared in Boa Viagem, 449 were immaterial and are now filtered out. A decimal point should have been a comma. And the publication guard correctly blocked the resulting coverage drop, so activation now requires an explicit, recorded reason for redefining coverage. After filtering, material consequences reach 175 Boa Viagem buildings, 26 in Madalena (the tunnel), 12 in Espinheiro (11 of them because their own street is the flooded one) and 1 in Casa Forte. Cost: a 35 s pipeline using 0.4 GB, and 27 KB of app payload. Gaps:
- Nobody has reviewed G-RAIN (38 cases, two whole episodes held out).
- 176 street names did not match.
- Long roads are closed over their whole in-neighbourhood stretch, which overstates the impact.
- The source never says whether pedestrians were blocked.

Decision: **iterate**. Remaining for VE06:
- a person reviews [g-rain-revisao.csv](../../evaluation-sets/g-rain-revisao.csv) (location, event date, mode);
- add located CTTU or municipal closure and reopening bulletins if a permitted source exists;
- improve name matching for abbreviated avenues;
- tie episodes to rainfall and tide records;
- run the VE06.04 review-priority experiment once labels exist.

"Além do anúncio" already leads with its principal finding, with sources one tap away. Promoting a material flood consequence into it, and carrying the VE05 monthly-hours difference into the Compare brief, are the next decision-surface steps. The broader UX review stays deferred, as requested. The next functional epoch is **VE07 (solar geometry for façade and walking choices)**, which can start now that the VE03 network and the existing sun engine are in place.
