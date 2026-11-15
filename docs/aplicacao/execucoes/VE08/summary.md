# VE08 — Summary

VE08 (Evening walking and relevant noise sources) is **partial**: both new dossier blocks are implemented, tested and rendered; the crossing counts are network estimates; no one has observed anything on the ground. "Voltando à noite", in the dossier's walking section, shows:
- the nearest stop with buses or metro arriving between 22h and 2h on a typical weekday;
- the minutes on foot and the estimated main-road crossings;
- the last scheduled arrival, or, at 1,101 stops served through the night, a note that buses keep arriving into the early hours.

Behind one tap it lists the installed lamps along the walk, kept apart from the 156 "lâmpada apagada" requests (with dates and open status, because the inventory does not say whether a lamp works). It also lists pedestrian collisions recorded by CTTU in 2022–2024 on the streets the walk uses, with count, deaths and years. These records give the street, not the point or the hour, and the block says it is not a safety rating. "De que lado vem o barulho", in the Edifício tab, names the side of the building facing the nearest main road, with its weekday bus departures, and any valid LUSE (licensed sound) venue within 150 m. It suggests when to visit to compare that side with the opposite one, and can add the check to the visit roteiro. It gives no decibel figures, and the airport is left out because the official noise plan has not been georeferenced and checked.

Checks run: Jest 61/61 suites (1,520 tests, 6 new), Node 81/81 (4 new for the crossing rule), typecheck and lint clean, web smoke 50/50, and rendered checks at 375 and 360 px on a Boa Viagem and a Graças building, with no overflow, page errors or external requests. The new tests also check that no sentence uses safety, crime, income or decibel language. Every strong-link pilot building has such a stop within 1 km. The median walk crosses no main road. 1,467 buildings are within 80 m of a main road, and 134 are within 150 m of a valid LUSE venue. Review fixed five problems:
- an alternative route looked shorter than the shortest one, because the stop's snap distance was missing;
- a "last bus" capped at 02h was wrong for night lines;
- the Boa Viagem payload was oversized (565 KB → 282 KB);
- the noise title mentioned licensed sound where there was none;
- two unused variables.

Open gaps:
- with only 2,919 mapped crossings citywide, crossings are estimated from main-road junctions;
- CTTU data has no time of day;
- lamp working condition is unknown;
- the 15-case observation sheet is unrun.

Decision: **iterate**. Remaining for VE08:
- run the [observation sheet](../../evaluation-sets/g-noite-observacao.csv);
- review the crossing estimates on G-ROUTE paths;
- georeference and verify the airport noise plan before using it;
- read venue opening hours for evening errands;
- prepare calibrated acoustic measurement for VE14, only if equipment exists.

The next eligible epoch is **VE09 (memory: changes since the home was saved)**, which can reuse the VE02 publication versions and the VE06 flood ledger to say what changed for a saved home.
