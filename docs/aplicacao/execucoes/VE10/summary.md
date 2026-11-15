# VE10 — Summary

VE10 (Make price information support an action) is **partial**: preparing a negotiation from facts you already have works and is tested, but external price ranges were not built. No permitted feed of distinct, deduplicated offers exists, so following the plan's fallback, everything is built on your saved homes and the official records. The Destaques tab gains "Preparar a negociação", which shows:
- the known monthly total and what is still missing (an unknown value is never counted as zero);
- up to three facts already in the dossier: a cadastral IPTU or area mismatch, the fiscal ITBI comparison, a price drop you recorded, and how this home's advertised price per m² ranks among your own comparable saves, explicitly "a sua amostra, não um preço de mercado";
- a "might be the same flat" warning when another saved listing is in the same confirmed building with the same area (±2%) and rooms (same building alone is never a match).

"Montar uma mensagem" opens an editable text that asks the dossier's own confirmation questions. It mentions the recorded price drop and, only if you type one, your proposal; the app never suggests a value or sends anything, and you copy it to send yourself.

Checks run: Jest 63/63 suites (1,538 tests, 7 new), Node 81/81, typecheck and lint clean, web smoke 50/50, and rendered checks at 375 and 360 px on a realistic notebook. The new tests cover:
- unknown ≠ zero;
- annual versus unknown-period IPTU;
- price history;
- same-flat candidates versus other units in the building;
- the minimum sample;
- real cadastral findings;
- the message with and without a proposal, with no market or "valor justo" language.

In the render, the copied text matched the message exactly. Review fixed four problems:
- cost-gap questions duplicated the total line;
- the first comparison used incomplete totals, which would make a listing with missing fees look cheaper (it now compares advertised price per m²);
- "IPTU" was lower-cased, and the same-flat note had nested brackets;
- the smoke test caught the block's sentences merging into one accessibility line, putting "m²" next to ITBI, which the product forbids because ITBI area includes common areas (now a semantic list).

Decision: **iterate**. Remaining for VE10:
- a permitted offer source, before external ranges, cross-portal identity (G-OFFER) and leave-one-portal-out checks can exist;
- rent-versus-buy scenarios that fetch current financing inputs;
- extracting "a partir de" (asking-price nature) flags.

The next eligible epoch is **VE11 (the decisive question and where else to search)**, which can combine the VE01 brief, the VE05 monthly hours and these negotiation facts.
