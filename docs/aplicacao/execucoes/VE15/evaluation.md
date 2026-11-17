# VE15 — Evaluation

**State:** partial · **Outcome:** iterate · Applications: A26, A34–A36, A40.

## What was selected and why

The plan asks for one optional extension that resolves an important remaining question after comparison. The most frequent remaining question in Compare is the decisive one that `projetarDecisao` already names (VE01): a missing value — condo fee, IPTU, insurance, service fee, other costs, area or price — that could flip which home to visit first. Before VE15 the person could only send that question to the visit script, where the answer is free text and changes nothing, or open "Ajustar valores" in the cost panel. VE15 adds **"Já tem a resposta?"** under the decisive question: one numeric field (plus the IPTU period when needed) and one tap. The value is stored as "informado por você" (not "a confirmar"), the comparison is recomputed, and one sentence says whether the order changed.

Documents (VE15.02) and shared corrections were not chosen: there are no real building documents in this work to test extraction against exact pages, and shared corrections need opt-in, review and deletion first (inventory, `inventario.md`).

## Evidence

| Check | Result |
|---|---|
| Unit tests (`tests/resposta.test.ts`) | 5/5. Correct field mapping; IPTU requires a period; NaN, negative values, zero area → no change; unknown never becomes zero |
| Monotonicity | B's condo fee 0 → 1200 against A's known 600: the order never moves toward B as the value rises (0 → B first, 1200 → A first) |
| Rendered task (375 and 360 px, values 150 and 1200) | 4/4 cases. 150 → "A ordem não mudou: Graças continua na frente."; 1200 → "Com esse valor, a ordem mudou: visite primeiro Casa Forte." The sentence is in view after the tap; persisted `{valor, origem:"voce", aConfirmar:false}`; after reload the question is gone (answered); no horizontal scroll; no page errors; no external requests |
| Generic checklist, same fixture | 6 visit questions; the condo fee is the 2nd and its answer is free text that never changes the comparison |
| Core without the extension | Smoke 50/50 steps (purchase, rent, compare, discard, unreadable notebook), no external requests; nothing new needs uploads, an account, sensors or permissions |
| Privacy / backup / migration | Full suite 67 suites, 1,569 tests pass (includes `caderno-amplo`, `privacidade`, `piloto-integridade`); typecheck clean; lint 0 errors (5 warnings in the payload-split session's files) |

Screenshots: `logs/antes-*.png`, `logs/depois-*.png`. Raw render output: `render.json`.

## Defects found by the rendered check and corrected

1. **The confirmation vanished.** The sentence lived inside the answer box. Once the value is saved, the decisive question changes (it was answered), so the box closes and its state goes with it. The sentence now lives in the Compare screen state, keyed to the pair, cleared when the priority changes, and is shown under the headline with `role="status"`.
2. **The confirmation was out of view.** Removing the question block shrinks the card. At 360/375 px the viewport stayed below the summary, so neither the new headline nor the sentence was visible. On web the sentence now scrolls into view (measured: in view in 4/4 cases). On native the status role announces it, but this has no device evidence.

Environment note: three times, the Expo web dev server served old route code after edits. Every result above was taken after a restart and a check that the served bundle contained the new code.

## Acceptance

| Criterion | Met? |
|---|---|
| Core comparison works without new uploads, account, sensors or permissions | **yes** (smoke, full suite) |
| The selected extension resolves a concrete question in a measured task | **partly** — scripted and rendered on synthetic listings over real index buildings; not timed with people (G-USER) |
| Existing privacy, backup, export, migration tests remain valid | **yes** |
| Native capture and sync have real platform evidence | **no** — nothing native was added; no device |
| VE15.01 inventory: keep / integrate / repair / defer without silent removal | **yes** — 11 keep, 1 repair (visit answers are free text), 3 defer, 0 removed |
| VE15.04: unsupported context sources become research tasks | **yes** — 3 research tasks, 3 kept at their supported scale, 0 new building metrics |
| VE15.02 optional document test | **not run** — needs real building documents with exact pages |

**Disposition:** partial / iterate. A26 moves to iterate (a structured answer now recomputes the comparison). A34–A36: keep the existing optional flows and defer shared corrections; the document test waits for real documents. A40: keep the existing context at its supported scale; the rest are research tasks.

## Next

- Time the answer flow against "Ajustar valores" in the G-USER paired task.
- Run VE15.02 when a participant brings a real balancete or ata: link an excerpt to the condo-fee field, with page and date.
- Extend the structured answer to the visit screen, so an answer given there also recomputes the comparison.
