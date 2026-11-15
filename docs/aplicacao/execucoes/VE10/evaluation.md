# VE10 — Evaluation record

## Objective and scope

Make price information support an action (plan §7, VE10; applications A02, A20–A22): explain cost differences, show defensible comparables when available, and prepare a specific negotiation question.

**Data constraint.** No permitted offer feed exists with dated, deduplicated, distinct units, and portal scraping is not an option. External comparable ranges and cross-portal unit identity therefore cannot be built honestly. The plan's fallback applies: "where the range fails, personal comparisons and a fee break-even remain useful".

## Work packages

| ID | State | Delivered |
|---|---|---|
| VE10.01 Offer snapshots | reused | `historicoDoAnuncio` (deliberate edits and re-imports, before → after per field) already preserves history. VE10 reads price changes from it. |
| VE10.02 Unit identity | done (personal notebook only) | "Might be the same flat" candidates (see below). Same building alone is never a match. |
| VE10.03 Comparables and cost | personal only; external **not built** | Your sample of saved homes, compared on advertised price per m². Known total via `custoMensal` (unknown ≠ zero). No external range. |
| VE10.04 Negotiation output | done | "Preparar a negociação" block in Destaques, plus an editable message (see below). |

**VE10.02 — same-flat candidates.** A candidate needs the same confirmed building, area within ±2% and the same number of rooms; if both listings state a floor, the floors must match too. Candidates are shown for you to check and are left out of the comparison sample.

**VE10.03 — why advertised price per m².** The comparison uses advertised rent or price per m² because each listing leaves out different charges. A total with gaps would look cheaper than it is.

**VE10.04 — what the block shows.**
- the known monthly total and what is missing;
- up to three facts already in the dossier: cadastral IPTU, area or fiscal ITBI findings, your recorded price changes, and your sample;
- any same-flat candidate.

**VE10.04 — the message.**
- It asks the dossier's own confirmation questions.
- A proposal value appears only if you type one; the app never suggests a value.
- You copy the message to send it yourself; the app sends nothing.

## Checks actually run

```
npm run typecheck && npm run lint && npx jest --runInBand   # 0; 0 errors / 5 pre-existing warnings; 63/63 suites, 1538/1538
node --test (pipeline suites)   # 81/81
POC_URL=… node docs/aplicacao/execucoes/VE10/scripts/ve10-render.mjs   # 375 and 360 px; clipboard text = message
POC_URL=… SMOKE_OUT=out/ve10/v1-smoke node scripts/v1-smoke.mjs   # 50/50
```

**Jest (7 tests)** cover:
- unknown values not counted as zero;
- annual IPTU converted to monthly;
- IPTU with no period left out of the sum;
- reading the history format, including "Não informado";
- only advertised-price changes counted as price history;
- a same-building, same-area, same-rooms candidate, with different floors kept apart and missing data giving no claim;
- a candidate excluded from the sample;
- the sample needing at least two other homes;
- real cadastral findings for building 53490-78 becoming arguments that carry the dossier's question;
- the message with and without a proposal, and no "mercado", "valor justo" or suggested number in it.

**Rendered check.** The notebook held the Rua Salgueiro home (missing condo fee, IPTU with no period, a recorded R$ 3,200 → 3,000 drop), a second listing of the same flat, and two other Boa Viagem homes. The block shows, in order:
1. the total with what is missing;
2. the area mismatch from the cadastre;
3. the price drop;
4. "Entre os 3 imóveis desse tipo que você salvou em Boa Viagem… este tem o maior aluguel anunciado por m² … É a sua amostra, não um preço de mercado";
5. the same-flat note.

The message contains three confirmation questions, the price drop, the known total with its gaps and the typed proposal. The copied text equals the message.

### Defects found in review and fixed

1. **Questions in the lead.** Questions about missing fees appeared as lead "facts", repeating what the total already says. They now go only into the message.
2. **Biased sample comparison.** The first version compared incomplete monthly totals, which made a listing with missing charges look cheaper. It now uses advertised price per m².
3. **Wording.** "IPTU" was lower-cased, and the same-flat note had brackets inside brackets.
4. **ITBI next to m².** The smoke test caught ITBI shown next to "m²" in the accessibility tree: the block's sentences merged into one line, putting the IPTU finding's "66,66 m²" beside the ITBI finding. ITBI area includes common areas, so the product rule forbids that. The sentences are now a semantic list, one item each.

### Not done

- External offer bands.
- Cross-portal identity and the G-OFFER set (false and missed merges).
- Leave-one-portal-out stability.
- Rent-versus-buy scenarios needing current financing inputs.
- Fee break-even for an unknown condo fee. The Compare brief's reversal threshold covers this for pairs; it is not repeated here.
- Asking-price nature flags ("a partir de") are not extracted.
- No participants.

## Outcome

**State: partial.** A negotiation preparation built only on personal and cadastral facts is working; external comparables are blocked by data. **Outcome: iterate.**
