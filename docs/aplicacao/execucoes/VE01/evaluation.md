# VE01 — Evaluation record

## Objective and scope

Make comparison the first useful product increment (plan §7, VE01; applications A01–A04): a person with two saved homes of the same tenure sees which to visit first and why, the main trade-off, and the one question that could change the answer, without entering new information.

**Entry dependency:** VE00 verified ([VE00 evaluation](../VE00/evaluation.md)). Inputs reused: `custoMensal` (single cost source), the Compare screen and panels, the G-COMPARE set, VE00 issues I01, I02 and I14.

**Acceptance (plan):** run G-COMPARE; verify annual/monthly charges, equal totals, missing vs zero, unit conversion, reversals, purchase horizon; meaningful tests beside the comparison/cost tests; inspect real rendered screens; customer validation pending if no participants; no route-time claim from air distance.

## Work packages

| ID | State | Delivered | Evidence |
|---|---|---|---|
| VE01.01 One comparison projection | done | `src/dados/decisao.ts::projetarDecisao`: pure, deterministic, all money from `custoMensal` (same figure as dossier and cards). Unknown charges are ranges `[0, open]`, never zero; an IPTU with a value but no period is `[value/12, value]`. Order of cost is "definite" only when ranges cannot cross. Purchase keeps price and monthly fees separate; incompatible tenures return `incompativel` | [decisao.ts](../../../../src/dados/decisao.ts), tests "invariantes" |
| VE01.02 Decision brief | done | "Para decidir" card at the top of Compare: priority switch (Menor custo / Mais espaço, screen-only, no new stored preference), one headline ("Visite primeiro X…" or "os dois ficam próximos"), one trade-off line, up to three material differences with a compact source cue | [Decisao.tsx](../../../../src/componentes/comparar/Decisao.tsx), [comparar.tsx](../../../../src/app/%28abas%29/comparar.tsx), screenshots `out/ve01/compare/` |
| VE01.03 Break-even and question | done | Reversal threshold for the missing charge(s) on the cheaper side; decisive vs confirmation question (confirmation when the other home's known value for the same charge is below the threshold); negotiation template when the preferred home costs more; purchase horizon (months until monthly fees offset the price gap, no interest); optional "hour saved" calculator using minutes the person types (plan fixture: R$ 180, 20 min × 16 days → 5h20 → R$ 33,75/h). Editable question → "Levar para a visita" (existing `perguntasProprias`, no schema change) or "Copiar" | tests GC01–GC20, "preço da hora poupada", screen test "Resumo da decisão" |
| VE01.04 Evidence consistency and states | done | Parity test: projection monthly totals equal `derivarDossie().custo.totalMensalConhecido` for all 40 G-COMPARE listings. Destinations never enter the projection (privacy test). States: loading (existing), one property (brief absent; screen test), incompatible tenure (pure test), partial cost (GC03/04/06/07/09/13/18/20), offline after load (rendered check). Share output unchanged (contains no brief and no destinations) | tests, [compare-render.json](logs/compare-render.json) |

Also delivered: interim fix of VE00 issue **I01**. In `src/dados/dossie/sintesesDaRua.ts` (an untracked file, so git shows no diff), the line `` `corredor de ônibus a ${…} (${formatarNumero(onibusPerto.viagensDia)} paradas diárias no GTFS)` `` became `` `corredor de ônibus a ${…}` ``, with a comment pointing to VE05 for the calendar-correct count.

## Rules introduced (recorded as D010–D012)

- **Wording (D010):** the legacy factual panels keep their bans (`comparar.test.ts`, unchanged). The new brief may recommend which home to visit first, always tied to the person's chosen priority and a stated reason; it must never use pejorative or safety adjectives, a score, or "winner/best" language (enforced by `tests/decisao.test.ts` policy test and the screen test). One legacy sentence that now contradicted the brief ("não produz nota nem escolhe um vencedor", `Prioridades.tsx`) was trimmed to "A ordem vale nesta tela e não altera dados."
- **Materiality thresholds (D011, initial proposals per D004):** rent monthly ≥ max(R$ 50, 2%); purchase price ≥ max(R$ 5,000, 1%); monthly fees in purchase as rent; area ≥ 10% of the smaller; permits within 150 m differing by ≥ 3. Below threshold, the dimension does not pick a home.
- **Question strength (D012):** a cost question is "decisiva" unless the other home has a known value for the same charge below the reversal threshold, in which case it is "confirmação" and states both numbers. Ordering among candidate charges is fixed by typical magnitude (rent/price, condo, IPTU period, IPTU, other fees, fire insurance, area). No probability or invented typical ranges.

## Commands actually run

```
npx jest --runInBand tests/decisao.test.ts                 # first run: 30/33 (log: logs/decisao-first-run.log); final 33/33
npx jest --runInBand tests/decisao.test.ts tests/comparar.test.ts tests/custos.test.ts tests/perfil-domicilio-custo.test.ts \
     tests/sinteses-da-rua.test.ts tests/telas-fatia5.test.ts tests/visita.test.ts tests/privacidade.test.ts
npm run typecheck                                          # exit 0, 8 s
npm run lint                                               # exit 0, 0 errors, 5 pre-existing warnings, 4 s
npx jest --runInBand                                       # exit 0, 54/54 suites, 1450/1450 tests, 73 s
POC_URL=http://localhost:8087 SMOKE_OUT=out/ve01/v1-smoke node scripts/v1-smoke.mjs        # Node 22, exit 0, 96 s, 50/50 steps
POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE01/scripts/ve01-compare-render.mjs   # Node 22, 2 runs, final exit 0, 49 s
```

The Expo web server ran from the app preview launcher (`npx expo start --web --port 8087`, Node 22). Two one-off Playwright probes (inline `node -e`) checked where a saved question appears on the Visita screen.

## Results

**Engineering correctness.** G-COMPARE: 18/20 pairs matched the hand labels on the first run; the two mismatches (GC02, GC04) were label errors (a tie has no "cheaper side", so no threshold) and were corrected in [labels v1.1](../../evaluation-sets/g-compare-labels-v1.1.json) with the original values kept; final 20/20. Covered and passing: annual→monthly IPTU (1,440/yr → 120; 2,400/yr → 200), equal totals (GC02, no winner), declared zero vs unknown (GC04, GC15), unknown period as bounded range (GC06, GC20), missing charges never zero (GC03, GC09, GC13), price unknown (GC18), purchase horizon 60/45/250 months (GC16/GC15/GC14), A/B swap symmetry, incompatible tenure, dossier parity (40 listings), privacy and wording policy. Full suite 1,450/1,450; v1 smoke 50/50 with no accessibility/overflow findings.

**Defects found and fixed during the epoch** (all by tests or rendered review, none shipped):
1. Definite cost difference with a bounded pending charge was stated as exact (R$ 1,080) instead of the guaranteed minimum ("pelo menos R$ 860") — found because my invariant test's own arithmetic was wrong.
2. Area 17.5 m² rendered as "18 m²" (integer formatting).
3. The support line repeated the first listed difference verbatim.
4. A fire-insurance question with a R$ 1,120/month threshold was labelled decisive although the other home's insurance is R$ 42 → introduced the confirmation strength.
5. Two controls named "Espaço" (priority and topic tab) — renamed priority options to "Menor custo / Mais espaço".
6. Legacy panel text contradicting the brief (see D010).
7. Lint: setting state inside an effect → replaced by the screen's existing key-reset pattern.

**Data validity.** No new data source. Every number in the brief is either a listing value entered or read by the person (cue "Anúncio") or the municipal permit count already published (cue "Prefeitura · licenças de obra, 24 meses"). G-COMPARE values are synthetic and stay outside notebooks.

**Rendered review (web, 6 G-COMPARE pairs on real buildings).** 0 px horizontal overflow at 360, 375 and 1,280 px; at 375×812 the brief starts at 301 px and the headline ends by 425–455 px, i.e. the conclusion is on the first screen (VE00 issue I02: the first conclusion used to sit below the fold). Offline after load: switching homes and priority still works, 0 external requests, 0 page/console errors. Time calculator renders "São 5h20 por mês: cada hora poupada sai por R$ 33,75." The question taken to the visit persists and appears on "No imóvel" and in the full plan, **but only as item 13 of 13**, not among the three highlighted on "Preparar" (follow-up for VE11/A26; not changed here because the visit files carry the user's uncommitted edits). Permit differences appear only after the building index finishes loading, so the brief can gain a line a moment after opening.

**Customer usefulness.** No participants; G-USER not run; customer validation **pending**. Expert review of the rendered states: the brief now answers "which first, why, what could change it" on the first screen. Remaining concern: listings without fire insurance on both sides yield "decisive" insurance questions with large thresholds (e.g. GC08, R$ 370/month) because there is no defensible reference value; the motivo shows the number so a person can judge, but this needs observation with real users.

**Operating viability (desktop dev web build, not the target device).** Warm open of Compare to visible brief: p50 734 ms, p95 801 ms (n = 30, includes navigation and app boot of the route). Priority switch: p50 49 ms, p95 64 ms (n = 30, includes Playwright round trips). Cold context: p50 1,084 ms, p95 1,090 ms (n = 5). No new data payload; projection is pure TypeScript evaluated per render.

## Checks not run

Participant study (G-USER), native Android/iOS, target-device performance, keyboard-only traversal and large-text scaling of the new controls (the v1 auditor checks names/roles only), screen reader announcement of the priority radio group on a real screen reader.

## Reviews

1. **Correctness/failure modes:** unknown never becomes zero; ranges bound the IPTU-period ambiguity; ties and sub-threshold differences pick no home; swap symmetry holds; source cues map to real producers; no destination or travel time enters the projection; one producer feeds Compare and matches the dossier.
2. **Customer clarity:** one headline, one trade-off line, ≤ 3 differences, one action. The question block is the densest part of the card (motivo + editable field + two buttons); worth testing whether people use "Levar para a visita" and whether the confirmation/decisive distinction is understood.

## Outcome

**State: verified** for the recorded scope (engineering and data acceptance met on web; customer validation pending as the plan permits; native not run). **Outcome: adopt** the projection and brief as the comparison baseline, with iteration items: question position in the visit (VE11/A26), insurance-question plausibility (needs user observation or a sourced reference), keyboard/large-text checks, and the G-USER study.
