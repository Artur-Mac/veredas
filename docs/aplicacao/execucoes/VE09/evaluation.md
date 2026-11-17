# VE09 — Evaluation record

## Objective and scope

Give the dossier a reason to be reopened by showing what materially changed since the home was saved (plan §7, VE09; applications A12, A18, A19). Delivery is on demand only. Nothing runs in the background, and there are no notifications, accounts or server.

## Work packages

| ID | State | Delivered |
|---|---|---|
| VE09.01 Semantic snapshots | done | [memoria.ts](../../../../src/dados/memoria.ts): a snapshot of the facts the dossier shows (see below). Stored as `caderno.memoria`, optional; older notebooks stay valid. |
| VE09.02 Relevant diff | done | Every change is classified as `anuncio`, `mundo`, `antigo`, `correcao` or `mapa` (see below). |
| VE09.03 Construction sequence | partial | Licence state changes are detected from the published `situacao`. The index keeps only the current state, not the filed/approved/expired/active/completed history, and no proposed-volume solar scenario was built. |
| VE09.04 On-demand delivery | done (dossier) | "Desde que você guardou" at the top of Destaques. The snapshot is taken when you save the home or tap "Guardar o que o dossiê mostra hoje"; "Marcar como visto hoje" resets it. Compare does not show changes yet. |

**VE09.01 — what the snapshot holds.**
- the listing's costs;
- licences within 150 m, identified by category, subject, month and position, because the index has no process number;
- Defesa Civil attendances on the building's street by year, plus outreach actions;
- the nearest grocery, pharmacy, park and stop, with walking minutes;
- the night stop and its last arrival;
- the timetable version.

Each base also records its version.

**VE09.02 — how changes are classified.**
- `anuncio`: listing values.
- `mundo`: a licence filed after the snapshot or one that changed state, new attendances in the current year, a new timetable, or a changed night bus.
- `antigo`: a record dated before the snapshot that has only now appeared.
- `correcao`: a closed year whose count changed, a record that disappeared, or a layer the dossier did not have before.
- `mapa`: a different nearest place on the map, which may be a new place or a newly mapped one.

**What is never reported as a change:**
- spelling-only differences (accents, case, spacing, punctuation);
- a republication with identical facts;
- walking minutes that differ only by rounding (under 2 min);
- a base that failed to load. It is skipped, never reported as "fechou".

Disappearing from a base never becomes "terminou", "vendeu" or "fechou".

## What the person sees

At the top of Destaques:

> Desde 01/11/2026, quando você guardou este dossiê
> Condomínio: R$ 550 → R$ 600 (+R$ 50 por mês).
> *9 correções de base* (one tap) — e.g. "Atendimentos da Defesa Civil na rua em 2019: … É um ano já fechado: a base foi corrigida ou reclassificada, não houve atendimento novo." · "O dossiê passou a mostrar mercado, farmácia, praça e ponto mais perto a pé; não havia isso no seu retrato para comparar."
> Marcar como visto hoje

When there is no change: "Nada mudou nas bases deste dossiê desde 14/11/2026." When there is no snapshot yet, it offers "Guardar o que o dossiê mostra hoje".

## Checks actually run

```
npm run typecheck && npm run lint && npx jest --runInBand   # 0; 0 errors / 5 pre-existing warnings; 62/62 suites, 1531/1531
node --test (pipeline suites)   # 81/81
POC_URL=… node docs/aplicacao/execucoes/VE09/scripts/ve09-render.mjs   # 375 and 360 px
POC_URL=… SMOKE_OUT=out/ve09/v1-smoke node scripts/v1-smoke.mjs   # 50/50
```

### Tests

**Real successive snapshots.** The four published index versions are still in the repository, and the tests use building 53490-78 on Rua Salgueiro:

| Versions | What the diff reports |
|---|---|
| 59f → 91b | No change. The republication had identical facts. |
| 91b → 5ba | The "Maro" parser fix. 2019 goes from 15 to 730 and is reported as a correction to a closed year, not as new attendances. The street-spelling change ("Rua do Salgueiro" → "Rua Salgueiro") is ignored. |
| 5ba → 1e3 | The outreach split. Counts fall, 2024 disappears and a community-actions field appears. All of it is reported as corrections. |

The index's `geradoEm` stamp is identical across all four versions, which is why snapshots record the published version folder instead.

**Synthetic cases:**
- a listing change, with the monthly difference;
- a new licence versus an old one that only now appeared;
- a licence changing state;
- a licence leaving the list (not reported as "obra terminada");
- recurrence in the current year;
- case and accent noise;
- rollback A → B → A;
- rounding versus a real map change;
- a new layer versus one that failed to load;
- schema compatibility of old and new notebooks.

**Dossier test.** The bookmark now updates through `atualizar`. Saving a home with no snapshot creates one; unsaving does not.

### Defects found in review and fixed

1. **Lost snapshot write.** The store's `salvar` deliberately keeps the notebook already on disk, so a notebook copied from an older screen can't wipe newer data. That made "Marcar como visto hoje" silently save nothing. Snapshots now go through `atualizar`, and the existing dossier test was updated to match.
2. **Layer missing from the old snapshot.** It produced "não havia no mapa → Pague Menos" for every place. It is now a single "o dossiê passou a mostrar…" note.
3. **Stop code as name.** The stop name used the raw GTFS code ("010099"); it now uses the dossier's naming.
4. **"Old record" too loose.** A record from the same month as the snapshot was called old; it now has to be from a strictly earlier month.

### Not done

- Changes are not shown in Compare, so they are not yet prioritised there.
- A licence-state timeline and proposed-volume geometry need a source with process history.
- Rain recurrence (A12) beyond the VE06 ledger.
- Field-level parser-version tagging. Corrections are inferred from closed periods, not from parser metadata.
- No participants.

## Outcome

**State: partial.** Snapshot, diff and dossier delivery work and are tested on real version history. Compare integration and the construction state history are missing. **Outcome: iterate.**
