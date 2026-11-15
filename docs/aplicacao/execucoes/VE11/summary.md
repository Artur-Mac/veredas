# VE11 — Summary

VE11 (The decisive question and where else to search) is **partial**: the three new aids for an undecided shortlist work, are tested and render correctly; recomputing the comparison from a visit answer was not built, and no participants have tried any of it. The Compare "Rotina" tab now ends with a "para decidir" section in three parts:
- **Custo × tempo:** it prices the trade-off when the dearer home saves journey time ("Graças custa R$ 250 a mais por mês e poupa 11h26 por mês no trajeto: cerca de R$ 22 por hora poupada") and names the threshold that flips the choice, without valuing the person's time. It says "não há troca" when one home is both cheaper and faster, and warns when unconfirmed fees could move the threshold.
- **Com todos os destinos:** with two or more saved destinations, it reports whether any home wins everything or who wins on what ("Casa Forte no custo; Graças na ida até o centro e até a Faculdade").
- **Onde mais procurar:** other pilot streets whose 7h weekday trip to the destination is no longer than the better option's, with the share of buildings near a grocery. It comes from a precomputed table of 261 streets × 94 neighbourhoods (97 KB), and says plainly that prices and available listings are not covered.

Checks run: Jest 64/64 suites (1,550 tests, 12 new), Node 81/81, typecheck and lint clean, web smoke 50/50, and rendered checks at 375 and 360 px. The new tests follow the plan's acceptance list:
- monotonicity (raising a cost never helps that home);
- Pareto dominance;
- contradictory preferences;
- a missing criterion;
- every option failing;
- a missing destination;
- unreachable streets;
- a search with no prices;
- the reversal threshold.

One street median was checked against the building-level result in the Rotina tab (41 versus 37 min; the difference comes from how departures are sampled). Review fixed five problems:
- the price per hour lost its cents below R$ 10;
- the first monotonicity test was mis-specified;
- the render check missed the two-destination block;
- the dominance sentence was awkward until grouped by winner;
- street names showed cadastral abbreviations.

Decision: **iterate**. Remaining for VE11:
- structured visit answers, so that answering the decisive question (e.g. the condo fee) recomputes the comparison (VE11.04);
- a paired task study comparing a generic checklist with the targeted question;
- strict household constraints as their own input;
- reverse search for GPS destinations;
- an option to narrow the broad street list.

The next eligible epoch is **VE12 (integrate and evaluate the five-neighbourhood pilot)**, which should exercise VE00–VE11 end to end, two complete comparisons per area.
