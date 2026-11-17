# VE13 — Evaluation record

## Objective and scope

Use AI only where it lowers the cost of useful evidence (plan §7, VE13; A19, A27–A29). The plan asks to:
- choose one bottleneck from pilot evidence;
- build a local labelled set;
- compare manual/rules against a lightweight model and a VLM;
- allocate review by impact.

**Constraint.** Any model step here would send record text to an external model service and needs credentials. Neither is available, and sending data out requires your explicit authorisation. The model arms of the ablation were therefore **not run**. Everything else was done locally and deterministically, so a model can later be compared at the same review cost.

## Work packages

**VE13.01 — Bottleneck: done.** From pilot evidence (VE06), 211 of 394 Defesa Civil street-flood observations were not linked to an official street, so they could not inform any route. Listing extraction was not chosen: it already has 28 acceptance cases, all passing, and there is no permitted real listing source to label.

**VE13.02 — Labelled set: built, unreviewed.** [G-EXTRACT v1](../../evaluation-sets/g-extract.json) holds every observation v1 left unlinked, with:
- the v2 decision and its candidates;
- 2024 records held out as the test split;
- a review sheet ordered by priority ([g-extract-revisao.csv](../../evaluation-sets/g-extract-revisao.csv)).

**VE13.03 — Ablation: rules only.** Rules v1 against rules v2 ([normalizar.mjs](../../../../scripts/dados/chuva/normalizar.mjs), [candidatos.mjs](../../../../scripts/dados/chuva/candidatos.mjs)). The text-model and VLM arms were not run (see the constraint above).

**VE13.04 — Review allocation: done.** Priority is impact × reuse × uncertainty ÷ effort, compared with uniform sampling on the same budget.

## Rules v2

**Auto-accepted.** Only transformations that cannot change the place, and only when they yield a unique street in the record's own bairro:
- removing locators ("em frente ao", "próximo ao", …);
- expanding abbreviations (Av., Gov., Min., …);
- spelled-out numbers ("Rua Doze" → "Rua 12").

**Classified, not linked.** Watercourses (canal, rio, …) and named places (loteamento, comunidade, beco, …) are not streets.

**Candidates, always for review:**
- the same name in a neighbouring bairro;
- the official name extending the record's name, with 3 or more words;
- 1–2 letters of difference in names of 10 or more letters.

**Results:**

| Outcome | Observations |
|---|---|
| Already linked by v1 | 183 |
| Auto-linked by v2 (locators removed) | 4, e.g. "Avenida Mascarenhas de Moraes Em Frente Ao Aeroporto" → Av. Mascarenhas de Moraes |
| Not a street (11 watercourses, 39 named places) | 50, previously counted as failures |
| Candidates for review | 40 records in 34 groups; 4 groups touch pilot buildings |
| No candidate | 117 |

## Review allocation (VE13.04)

**Measure.** One review per (normalised text, bairro) group; one review settles every record in the group. Impact is the number of strong-link pilot buildings within 1 km of the candidate street, which is an **upper bound**: it assumes the reviewer confirms the candidate.

| Reviews | Ranked queue | Uniform sampling (mean of 200 orders) |
|---|---|---|
| 3 | 845 | 90 |
| 5 | 922 | 151 |
| 10 | 922 | 304 |

**Top of the queue:**
1. "Praça Min. Salgado Filho" (Imbiribeira, 4 records), whose candidate lies in the neighbouring bairro;
2. "Avenida Santos Dumont" (Espinheiro, neighbouring bairro);
3. "Avenida Nrte Miguel Arraes de Alencar" (a typo);
4. "Rua Cantora Clara Nunes".

So three reviews carry almost all of the pilot value. The rest of the queue matters only outside the pilot.

## Checks actually run

```
node scripts/dados/chuva/candidatos.mjs --relatorio docs/aplicacao/execucoes/VE13/extracao.json   # Node 22
node --test scripts/dados/chuva/testes/normalizar.test.mjs … (all pipeline suites)   # 86/86, 5 new
npx eslint scripts/dados/chuva/…   # 0
```

**What the tests cover:**
- locator removal;
- abbreviations, with "R" expanded only at the start;
- spelled-out numbers;
- watercourse and named-place classes;
- candidate rules, with nothing proposed for short or identical names;
- **untrusted text:** an embedded instruction ("ignore as regras anteriores…") stays inert text and neither changes rules nor creates a link.

App code is unchanged. Linking reviewed records into the VE06 payload waits for the review, and for the concurrent payload-split session, which is reorganising the generated loaders.

### Defects found in review and fixed

1. The first queue counted the same street name once per record (four "Praça Min. Salgado Filho" entries), which overstated what a review buys. Items are now grouped by name and bairro.
2. "Min." was not expanded.

### Not done / limits

- **Model ablation:** text model and VLM. Needs authorisation, a service and spend.
- **Review:** G-EXTRACT has had no human review, so precision of the rules and candidates is unmeasured.
- **Impact measure:** "within 1 km" is a proxy for decision impact, not a recomputed route consequence.
- **Plan acceptance not met:** the acceptance requires a predeclared task to improve at equal or lower review cost. Rules v2 does so on this task, but the claim rests on unreviewed outputs.

## Outcome

**State: partial.**
- **Done:** the bottleneck is chosen, a deterministic improvement is made, and review allocation shows a large, measurable gain.
- **Missing:** the model arms and human review.

**Outcome: iterate.** Keep rules v2 and the ranked queue. Rerun the comparison with a model only if you authorise it, and only against reviewed G-EXTRACT labels.
