# VEREDA — Next programme (from VE17)

The VE00–VE17 programme built and measured an evidence-first comparison app across six Recife neighbourhoods. Engineering acceptance was met for its core and its operations. **No customer outcome has been measured**, and human review of the data has not started. Those two gaps, not new features, set the next programme.

## Decisions: keep, merge, simplify, expand, stop

| Decision | What | Why (measured) |
|---|---|---|
| **Keep** | Decision brief, known cost (unknown ≠ zero), decisive question with answer box (A01–A03, A26) | Engineering-verified; the product's core claim |
| **Keep** | Entrance link + walking network, essentials, routine by hour, night return, façade sun (A05, A06, A10, A14, A16) | 2,643/2,825 buildings get ≥3 of these from maintained cross-source links; held-out transit sets 32/32 |
| **Keep** | Update cycle with restore point and rollback (A37) | Two byte-identical cycles; 0.2 s when nothing changed |
| **Merge** | A12/A13 into the A11 rain block; A23–A25 into Compare's "Para decidir" | Same data and screen; separate labels add nothing for the person |
| **Simplify** | Rain block: show only reviewed links | 4 unreviewed records drive all 173 consequences (one drives 147); one wrong link would mislead many dossiers |
| **Simplify** | Cycle cache: per-step code fingerprint | Any script edit re-runs all eight steps (VE16) |
| **Expand** | Nothing until H3 is answered | Compute is cheap; human review cost is unknown |
| **Stop** | Shaded routes (A15), flood model (A30), external price ranges and valuation (A21, A31) | Rejected, or no permitted data; their papers stay in the register with triggers |

## Data acquisition budget (next 8 weeks)

| Item | Budget | Spend on |
|---|---|---|
| Money | R$ 0 | No paid source or service is justified by a measured bottleneck |
| Review time | 6 hours of one reviewer, timed | G-RAIN top 4 links first (they reach 173 dossiers). Then G-TRANSIT + G-TRANSIT-TORRE (32 rows), G-BUILDING (50), G-POI (44) |
| Participant time | 5 sessions × 45 min | G-USER paired tasks (listing-only vs dossier + Compare), with consent; no telemetry |
| Device time | 1 low-end Android, 1 iPhone | Offline dossier load, layer assets, backup round trip |
| Free sources to probe | GTFS freshness monthly; licence-history and drainage-works availability (Prefeitura) | Unlocks A19 and A12 if they exist |

## Hypotheses (three, each with a stop rule)

1. **H1 — The rain block is trustworthy enough to keep.** A reviewer confirms at least 3 of the 4 links that drive every rain consequence, in under 30 minutes. *If fewer than 3 hold, hide the rain block* until a reviewed ledger exists.
2. **H2 — The comparison helps people decide.** In 5 paired sessions, people using the dossier and Compare reach a "visit first" choice they can justify, faster than with the listings alone. They also find the decisive missing fact more often. *If no difference appears in 5 sessions, simplify the brief before adding anything.*
3. **H3 — Coverage can grow sustainably.** Timed review costs at most 1 minute per row, so a new area's sheets (about 100 rows) take at most 2 hours. *If it costs more, keep six areas* and invest in review tooling (pre-filled maps, one-click confirm) before expanding.

## Next areas, if H3 holds

Pick one adjacent area at a time with its own held-out set, as with Torre:
- **Parnamirim** (92 buildings, next to Casa Forte);
- **Aflitos** (70 buildings, next to Espinheiro and Graças).

Routine paths already cross into any bairro of the city.
