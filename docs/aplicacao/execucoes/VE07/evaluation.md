# VE07 — Evaluation record

## Objective and scope

Turn solar geometry into façade and walking choices (plan §7, VE07; applications A14 and A15).

**Outcome sought:**
- show which side of the building gets sun, and when to visit to see it;
- offer a less exposed walk only when the benefit survives uncertainty.

## Work packages

| ID | State | Delivered |
|---|---|---|
| VE07.01 Complete solar coverage | done | Madalena added; existing four areas unchanged byte for byte |
| VE07.02 Façade contrast | done (unobserved) | Edifício-tab block, visit hour, question to the visit roteiro |
| VE07.03 Route shade | evaluated, **not shipped** | Building-shadow simulation; benefit small and canopy unknown |
| VE07.04 Observations | sheet only | G-SHADE observation sheet; nothing observed |

**VE07.01 — complete solar coverage.**
- **Source files:** the two official ODbL files (Edificações–Lotes and Edificações–Pavimentos, 84 MB and 172 MB) were downloaded again from dados.recife.pe.gov.br. They match the SHA-256 recorded on 2026-10-27, and are cached in `.cache/sol-fontes`.
- **Regeneration:** `preparar-sol-recife.py` was rerun for five areas.
  - Graças, Casa Forte, Espinheiro and Boa Viagem came out byte-identical, so the preparation is reproducible.
  - Madalena was added: 15,701 volumes, 2,108 validated associations, 3.4 MB, loaded lazily.
- **Evidence report:** the run overwrites the October evidence report; that file was restored, and the new report is [geometrias.json](geometrias.json).

**VE07.02 — façade contrast.**
- **Sides of the building:** [fachadas.ts](../../../../src/dados/sol/fachadas.ts) takes the outer outline of the building's validated cadastral volume and groups it into sides by direction (8 directions, sides of 8 m or more).
- **Two measures per side, for 21 December and 21 June:**
  - **"De frente para o sol":** minutes with the sun in front of the face. This depends only on orientation, so it is certain.
  - **"Com os vizinhos":** direct sun on the stated floor (or the 1st). It uses the same conventions as the window engine: window heights per floor, a height range per volume from floor counts, and the building's own volumes as obstacles.
- **Sentence:** the lead sentence comes from the orientation contrast. Neighbour shading is added as a qualifier, stated only when the model is decisive: blocking at least 60% or at most 40% of that sun. Otherwise it says the cadastre cannot tell.
- **Visit hour:** the first hour today when the sunny side has sun in front and the other side has none.
- **Never said:** interior temperature, or which way the flat faces.

**VE07.03 — route shade.** [sombra-nos-caminhos.mjs](../../../../scripts/dados/sol/sombra-nos-caminhos.mjs) takes 20 pairs (4 per area) of a strong-link building and its nearest mapped grocery at 300–1,200 m. Each pair is run in 4 scenarios: 21/12 and 21/06, at 9h and 15h.
- **Sun along a route:** sampled every 10 m on the walking network at 1.5 m height, against 57,851 cadastral volumes. 11,396 of those have no height and count as "uncertain" when on the ray.
- **Alternative route:** the least-sun route within +15% distance, from a sun-penalised shortest path.
- **Robustness:** the preferred route is tested with heights at the minimum, at the maximum, and with 20% of volumes removed. If the preference flips, the pair is "inconclusivo".

## What the person sees

In the Edifício tab, the block "O sol nas fachadas" shows:

> De manhã, o lado sul do prédio fica de frente para o sol por cerca de 7 h no verão; o lado norte, nenhuma. No inverno (junho) é o contrário. Se prédios vizinhos ou anexos tapam esse sol no 5º andar, o cadastro não permite dizer (há alturas desconhecidas). Para ver a diferença, visite por volta das 8h.

Behind "Ver cada lado" are the hours per side and season, with and without neighbours, plus the method and its limits. "Levar para a visita" adds this check to the visit roteiro: "Sol no lado sul por volta das 8h: as janelas do apartamento ficam desse lado? Há proteção (varanda, brise, árvore)?" The check reads it back from the notebook.

## Checks actually run

```
curl -sL …/edificacoes-lotes.geojson …/edificacoes-pavimentos.geojson   # SHA-256 match the 2026-10-27 record
python3 -I scripts/dados/preparar-sol-recife.py --cache .cache/sol-fontes --bairros gracas casa-forte espinheiro boa-viagem madalena   # 15 s; 4 files byte-identical
node scripts/dados/sol/sombra-nos-caminhos.mjs --relatorio docs/aplicacao/execucoes/VE07/sombra.json   # 46 s, 1.1 GB
npm run typecheck && npm run lint && npx jest --runInBand   # 0; 0 errors / 5 pre-existing warnings; 60/60 suites, 1514/1514
node --test (pipeline suites, incl. sol/testes/raio.test.mjs)   # 77/77
POC_URL=… node docs/aplicacao/execucoes/VE07/scripts/ve07-render.mjs   # 375 and 360 px, two real buildings
POC_URL=… SMOKE_OUT=out/ve07/v1-smoke node scripts/v1-smoke.mjs   # 50/50
```

## Results

### Tests

**Jest, façade block** ([sol-fachadas.test.ts](../../../../tests/sol-fachadas.test.ts)) covers:
- sides of a rectangle;
- opposite faces;
- night;
- seasons at 8° S: south gets sun in December, north in June;
- a tall neighbour removing afternoon sun while the orientation is unchanged;
- a neighbour of unknown height widening the range;
- no-geometry cases;
- a real Madalena building in 0.3 s;
- exact sentence, natural wording, and question length within the visit limit.

**Node:**
- 4 tests for the ray module, a documented copy of `intervalosDoRaio`, needed because Node cannot resolve the TypeScript module's extensionless import;
- 4 more pipeline tests in total.

### Defects found in review and fixed

1. **Unusable ranges:** the first version reused the window engine, whose far-obstacle rule assumes a 200 m building whenever any neighbour within the cut lacks a height. It printed "de 0 a 6,5 h" everywhere. A façade evaluator now applies that uncertainty only to neighbours actually on the ray, and uses the tallest known nearby building as the far bound.
2. **Unknown-height volume on the same lot:** a podium or annex touches the face and keeps most hours uncertain. Its height cannot be inferred honestly, so the sentence now leads with the certain orientation contrast and states the neighbour effect only when decisive.
3. **Wrong test expectations, not engine errors:**
   - solar noon in Recife is about 11:18 civil time, so west gets some civil-morning sun;
   - in December the sun stays in the southern half of the sky, so south × north is the strongest contrast.
4. **Wording:** "por de 3,5 a 6,5 h", "cerca de 0 h" and "nenhuma hora e nenhuma hora" were rewritten.
5. **Test teardown:** the dossier-screen test left the deferred calculation running after Jest teardown (exit 1 with all tests passing). The test now unmounts its renderers after each test.
6. **Route experiment:** the extra distance ignored the entrance-to-network offset; fixed.

### Route shade

Of 80 pair-scenarios:
- **70:** no useful alternative;
- **4:** gain smaller than twice the extra time;
- **6:** a stable alternative that survives all three robustness variants, saving 1.0–3.6 min of sun for 13–43 m of extra walking.

The median sun on the shortest route was 1.8 min, on walks of about 5 min. With trees, awnings and sidewalk side all missing, the benefit is below the uncertainty those omissions introduce. Following P11's kill rule, route shade is **not shown in the app**. G-SHADE ([observation sheet](../../evaluation-sets/g-shade-observacao.csv), 80 rows) is ready for dated field observations.

### Customer usefulness

Expert reading only; no participants. The façade block turns a generic fact (at 8° S, north and south swap with the seasons) into a concrete visit action: which side to look at and when, plus a check carried into the roteiro. Building-specific shading is usually undecidable with the current cadastre, and the dossier says so. This should not be confused with an observation.

### Operating viability

| Item | Measure |
|---|---|
| Solar preparation | 15 s, 0.4 GB |
| Madalena payload | 3.4 MB, lazy |
| Façade block on desktop web | 0.5–0.75 s after opening Edifício |
| Route experiment | 46 s, 1.1 GB, offline |

## Remaining work

- Dated façade photos or observations (VE07.04); G-SHADE field observations.
- A canopy and marquee source (municipal tree inventory or aerial imagery) before revisiting route shade.
- Heights for annexes and podiums, which drive most of the uncertainty.
- Phone timing for the façade block.

## Outcome

**State: partial.** Façade contrast is implemented, tested and shown; route shade was evaluated and kept out of the app; observations are missing. **Outcome: iterate.**
