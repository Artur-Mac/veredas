# VE11 — Evaluation record

## Objective and scope

Help when the shortlist is inconclusive, not only when it has an obvious winner (plan §7, VE11; applications A03, A23–A26). Everything is deterministic and explainable:
- no psychological profile;
- no value assigned to the person's time; only the implied price of an hour saved;
- no inference about who lives in the home.

## Work packages

| ID | State | Delivered |
|---|---|---|
| VE11.01 Sensitivity | done (cost × time) | `trocaCustoTempo` in [escolha.ts](../../../../src/dados/escolha.ts). Inputs: known monthly cost against door-to-door time, weekday out plus back, on the household profile's days per month. It reports "no trade-off" when one side is cheaper and faster, "similar" under R$ 20 and 1 h per month, or the implied price per hour saved with the threshold that flips the preference, and warns when costs still have values to confirm. VE01's reversal thresholds on fees remain in the brief. |
| VE11.02 Household trade-offs | done (destinations) | `naoDominadas`: with two or more saved destinations (the profile neighbourhood plus positioned notebook destinations), reports which home wins on cost and on each journey, or that one home is at least as good everywhere. Criteria missing on one side decide nothing. Strict constraints are not yet a separate input. |
| VE11.03 Reverse search | done (pilot streets × neighbourhoods) | [onde-procurar.mjs](../../../../scripts/dados/transito/onde-procurar.mjs) precomputes, for 261 pilot streets (2,516 buildings, 2+ buildings per street), the median 7h weekday door-to-door time to each of 94 neighbourhood centroids (07:00, 07:20, 07:40), plus the share of buildings with a grocery within 10 min on foot. The panel lists other streets that keep the better option's journey time, with no prices or listings. |
| VE11.04 Decision-driven visit | not built | VE01 already carries the decisive question to the visit. Recomputing when an answer arrives needs structured answers (e.g. a condo-fee value); visit answers are free text today. |

## What the person sees

At the bottom of the Compare "Rotina" tab (Casa Forte R$ 3,000 vs Graças R$ 3,250; destinations "centro do bairro Recife" and a notebook "Faculdade"):

> **Custo × tempo** — Graças custa R$ 250 a mais por mês e poupa 11h26 por mês no trajeto (20 dias): cerca de R$ 22 por hora poupada. Se uma hora sua vale mais que R$ 22, Graças compensa; se vale menos, Casa Forte. A escolha é sua; o VEREDA não dá valor ao seu tempo.
>
> **Com todos os destinos** — Nenhuma opção ganha em tudo: Casa Forte no custo mensal conhecido; Graças na ida até centro do bairro Recife e na ida até Faculdade. A escolha depende do que pesa mais para vocês.
>
> **Onde mais procurar (ida das 7h até 37 min)** — Rua Benfica (Madalena) · 28 min · mercado a até 10 min a pé em 100% dos prédios … Mais 133 ruas do piloto também cabem. Só ruas dos cinco bairros do piloto; preço e anúncios disponíveis não entram: procure anúncios nessas ruas no portal que você usa.

## Checks actually run

```
node scripts/dados/transito/onde-procurar.mjs --relatorio docs/aplicacao/execucoes/VE11/procura.json   # Node 22, 229 s, 0.3 GB, 97 KB payload
npm run typecheck && npm run lint && npx jest --runInBand   # 0; 0 errors / 5 pre-existing warnings; 64/64 suites, 1550/1550
node --test (pipeline suites)   # 81/81
POC_URL=… node docs/aplicacao/execucoes/VE11/scripts/ve11-render.mjs   # 375 and 360 px
POC_URL=… SMOKE_OUT=out/ve11/v1-smoke node scripts/v1-smoke.mjs   # 50/50
```

**Jest (12 tests)** cover the plan's acceptance list:

| Case | What the test checks |
|---|---|
| Monotonicity | Raising a home's cost never improves its standing; the price per hour rises strictly |
| Pareto dominance | Cheaper and faster dominates |
| Contradictory preferences | Two destinations favour different homes, and the sentence says who wins on what |
| Missing data | A criterion missing on one side decides nothing; an all-tie reads as a tie |
| All options fail | "Onde mais procurar" returns a "nenhuma" state |
| Missing destination | Returns a "sem_destino" state |
| Inaccessible path | A street with no bus within 2 h is never listed |
| No-price reverse search | Results carry no price or listing |
| Preference reversal | The threshold sentence |
| Pending fees | The warning that the threshold can change |
| Days needed | Days per month needed for the dearer home to pay off |

**Spot check.** Av. Conselheiro Rosa e Silva's street median is 41 min to the centre of Recife across 30 buildings, against 37 min for one of its buildings in the Rotina tab. The difference comes from sampling: 3 departures for streets versus every 10 min for the tab.

### Defects found in review and fixed

1. **Lost cents.** The price per hour was rounded to whole reais ("R$ 4" instead of R$ 4,41), so values under R$ 10 now show cents.
2. **Wrong monotonicity test.** The first test was mis-specified and now tests the true property.
3. **Hidden dominance block.** The two-destination block was computed after the visible scenarios and the check missed it; the render waits for it.
4. **Hard-to-read sentence.** The dominance sentence ("custo mensal conhecido: Casa Forte; …") now groups by winner.
5. **Cadastral abbreviations.** Street names showed abbreviations ("AV", "EST"); they are now expanded.

### Not done

- VE11.04 recompute.
- The paired task study: a generic checklist against the targeted question, with participants.
- Strict household constraints as their own input.
- Reverse search for GPS destinations. Neighbourhood centroids only; a GPS destination would need on-device routing per street.
- Broader coverage. With 139 of 261 streets within 37 min of the centre, the list is broad; a stricter "and better than both" option could narrow it.

## Outcome

**State: partial.** Inconclusive shortlists now get a priced trade-off, a dominance check and a supported search area. Visit-answer recompute and participant evidence are missing. **Outcome: iterate.**
