# VE09 — Summary

VE09 (Memory: changes since the home was saved) is **partial**: the snapshot, the change classification and the dossier block work and are tested on real version history; Compare does not show changes yet, and licences keep only their current state. When you save a home, or tap "Guardar o que o dossiê mostra hoje", the app keeps a compact record of the facts its dossier shows ([memoria.ts](../../../../src/dados/memoria.ts)):
- listing costs;
- licences within 150 m;
- Defesa Civil attendances on the street, by year;
- the nearest grocery, pharmacy, park and stop;
- the night bus;
- the timetable version.

The record stays in your notebook on the device; nothing runs in the background. Reopening the dossier shows "Desde que você guardou" at the top of Destaques, leading with what matters to the decision. For example: "Condomínio: R$ 550 → R$ 600 (+R$ 50 por mês)", a new licence, a licence that changed state, a new attendance this year, or a different nearest place on the map. Corrections to past data and old records that only now appeared sit one tap away, each saying what it is not. A closed year that changed means "a base foi corrigida ou reclassificada, não houve atendimento novo". A licence that left the list "não diz que a obra terminou". "Marcar como visto hoje" resets the comparison. Spelling-only differences, identical republications, rounding and bases that failed to load never produce a change, and nothing is ever reported as sold, closed or finished.

Checks run: Jest 62/62 suites (1,531 tests, 11 new), Node 81/81, typecheck and lint clean, web smoke 50/50, and rendered checks at 375 and 360 px. The strongest test uses the four index versions still in the repository, for a real building on Rua Salgueiro:
- an identical republication reports nothing;
- the March parser fix (2019: 15 → 730) and the outreach split (counts fall, 2024 disappears) are both reported only as corrections;
- the street-spelling change is ignored.

Synthetic tests cover new versus old licences, state changes, licence removal, recurrence, rollback, rounding, new or missing layers, and backward-compatible storage. Review found and fixed four defects:
- the store's `salvar` deliberately keeps the stored notebook, which made "Marcar como visto hoje" silently save nothing; snapshots now go through `atualizar`;
- a layer absent from the old snapshot was reported as "não havia no mapa" for every place;
- a stop showed its raw GTFS code;
- the "old record" rule was too loose.

Decision: **iterate**. Remaining for VE09:
- show the changes in Compare, prioritising those that affect a saved comparison;
- find a licence source with process history (filed, approved, expired, active, completed), so the construction timeline and any proposed-volume sun scenario can be traced;
- tag parser versions per field.

Outbound notifications remain out of scope until authorised. The next eligible epoch is **VE10 (price information that supports an action)**, which can reuse the listing history and ITBI/IPTU references already in the dossier.
