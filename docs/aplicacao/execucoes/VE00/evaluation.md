# VE00 — Evaluation record

## Objective and scope

Reconcile the real application and its published data, preserve the baseline, and establish the first evaluation sets (plan §7, VE00). Applications A04, A37 and A39 (baseline only; no new customer feature). Work packages VE00.01–VE00.04, all executed.

**Success criteria (plan acceptance):** every pilot area appears in the journey inventory; each inspected displayed metric has a real producer and a time/scale definition; baseline commands and unexecuted device checks are recorded; no user data or unrelated work changed; inherited broken tests are documented rather than called passing.

**Entry dependencies:** none. No earlier VE record existed; the old EP epochs and the 14 November static inspection were treated as inputs, not as acceptance.

## Work packages

| ID | State | What was done | Evidence |
|---|---|---|---|
| VE00.01 Checkout and journey inventory | done | Recorded HEAD, 39 pre-existing dirty files, environment. Ran typecheck, lint, Jest, the v1 web smoke (50 steps, 2 widths) and a new five-area journey that drives the real UI with one real building per pilot area through import → building → confirm → dossier → visit → compare → reload | [baseline.md §1–2](baseline.md), [checks.json](checks.json), [scripts/ve00-pilot-journey.mjs](scripts/ve00-pilot-journey.mjs), [logs/pilot-journey.json](logs/pilot-journey.json) |
| VE00.02 Published-data reconciliation | done | Reproducible script recomputes every plan §2 count from the active publication and cached official inputs; manifest checksums verified; GTFS daily-count defect quantified; Defesa Civil header drift located by year; displayed metrics traced to producer/source/period/scale | [scripts/reconcile_baseline.py](scripts/reconcile_baseline.py), [coverage.json](coverage.json), [scripts/gtfs_daily_count_check.py](scripts/gtfs_daily_count_check.py), [baseline.md §3–4](baseline.md) |
| VE00.03 Evaluation setup | done | G-BUILDING (50) and G-COMPARE (20) selected deterministically with street-grouped dev/test split and registry; performance procedure defined; desktop timings recorded as a regression baseline; source hashes saved in the repo | [evaluation-sets/](../../evaluation-sets/README.md), [baseline.md §7–8](baseline.md), [measurements.json](measurements.json) |
| VE00.04 Baseline report | done | `baseline.md`, `coverage.json`, `checks.json`, prioritized [issues.md](issues.md); wording tests that will need deliberate revision identified, with the protections to keep | [baseline.md §5](baseline.md) |

## Before / after

Before: the plan's §2 figures existed only in a static audit relying partly on `/tmp` files; no record showed whether the app worked end to end in four of the five pilot areas; no evaluation sets existed. After: all figures are reproducible from repository scripts with saved hashes; one figure is corrected; three defects are newly quantified; the journey is evidenced in all five areas on web; G-BUILDING and G-COMPARE exist with fixed membership. No product behaviour changed.

## Commands actually run

```
npm run typecheck                                   # exit 0, 9 s
npm run lint                                        # exit 0, 23 s, 0 errors / 5 warnings
npx jest --runInBand --json                         # exit 0, 101 s, 53/53 suites, 1414/1414 tests
SMOKE_OUT=out/ve00/v1-smoke node scripts/v1-smoke.mjs                    # Node 22, exit 0, 106 s
POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/VE00/scripts/ve00-pilot-journey.mjs   # Node 22, 3 runs, final exit 0, 30 s
python3 -I docs/aplicacao/execucoes/VE00/scripts/reconcile_baseline.py > docs/aplicacao/execucoes/VE00/coverage.json
python3 -I docs/aplicacao/execucoes/VE00/scripts/gtfs_daily_count_check.py
python3 -I docs/aplicacao/execucoes/VE00/scripts/select_eval_sets.py      # 3 runs, identical hashes on runs 2–3
curl … trechos-de-logradouros.geojson → .cache/dados-recife/ (HTTP 200, 14,527,751 bytes, SHA-256 154ebe0a…, same as prior audit)
```

The Expo web server for the pilot journey was started through the app's browser-preview launcher (`npx expo start --web --port 8087`, Node 22).

## Results by evaluation dimension

**Engineering correctness.** Typecheck 0 errors; lint 0 errors, 5 warnings; Jest 1,414/1,414. Web smoke: 50/50 audited steps without findings at 375 and 1280 px, no external requests, offline navigation after load, unreadable-notebook protection intact. Five-area journey: 5/5 areas completed; the building was suggested automatically in 5/5; dossier visible 194–227 ms after confirmation; reload preserved 5/5 analyses and 5/5 confirmed links; 0 page errors, 0 console errors, 0 px overflow at 375 px. No inherited test failure exists to document.

**Data validity.** 72/72 partitions match `cobertura.json` (SHA-256 and building counts). Plan §2 counts confirmed: 7,206 / 72; 2,688 pilot; 2,688/2,688 street codes; 2,622 within 50 m; 5,661 CNEFE points with 2,594/2,688 (96.5%) within 300 m; 7 flood-category streets; 2,515 / 2,588 / 772 catchment counts; 1,319 / 630 ITBI; four solar partitions; zero stops inside Recife after the −0.75° shift; 100 Maps searches with 0 entities; 139 pilot ZAP cards. **Corrected:** the 2022 cluster is 12 rows on 2022-06-08 plus 2 on 2022-06-06, not 14 on one date. **Quantified:** the customer-visible "paradas diárias" is a sum across calendars, median 2.42× the weekday count (p10–p90 2.01–7.24×; 146 of 4,316 rule-selected stops have no weekday service). **Located:** Defesa Civil 2020 and 2022 raw rows are shifted one column; 2022 header is double-encoded; flood attribution by street code and by the row's neighbourhood field disagree (Casa Forte 1 vs 0; Madalena 0 vs 2).

**Customer usefulness.** Not measured with participants (none in VE00; not required). An expert walkthrough of rendered states found the flow coherent but without decision support: Compare opens with maps and names, the first difference is below the fold on mobile, and no next question is offered. This is a hypothesis for VE01, not a study result.

**Operating viability.** Full local check cycle 239 s (typecheck 9 + lint 23 + Jest 101 + web smoke 106) on this machine. One 14.5 MB public download; no paid services; no model calls. Device performance budgets remain unmeasured.

## Failures, fixes, and test-script errors

- Pilot journey run 1 failed at confirmation in all areas: the test seeded a 6-credit wallet with one `delta: 6` entry, which violates `esquemaCarteira` (`delta ≤ 3`). The app correctly refused the unreadable wallet ("— créditos") — expected protective behaviour. Fixed the seed (3 initial + 3 `recarga_de_teste`).
- Run 2: the "A rua" probe was case-sensitive (headings render in uppercase via CSS), and the post-reload wait looked for an Explorar-only button while the app restores `/comparar`. Both were test bugs; fixed and rerun.
- Reconciliation script: initial runs failed on `cobertura.json` (not a partition) and on two Defesa Civil cache formats; Maps/ZAP parsers first returned wrong zero counts. All corrected before the recorded output; the recorded `coverage.json` is from the final version.
- Replaced the 592 KB raw Jest JSON (absolute paths, every assertion) with a compact per-suite summary.

## Checks not run

Native Android/iOS (no device or toolchain), target-device performance, cold offline reload on web (unsupported by design), the all-partition municipal staging audit (replaced by manifest checksum verification), `sol-smoke` (hard-coded old index version), and any participant study. See [checks.json](checks.json) `not_run`.

## Reviews

1. **Correctness/data/failure modes.** Verified that each recomputed figure has its denominator, that the reconciliation reads the active publication rather than staging, that eval-set selection is deterministic and separates dev/test by whole street, and that synthetic G-COMPARE values are labelled and isolated from real notebooks. Material finding fixed during the epoch: my first Defesa Civil count assumed one schema; it now detects the date column per year.
2. **Customer clarity.** The baseline experience answers "what is recorded near this building" well and "which should I visit first" not at all. Several cards present coarse-scale numbers with block-level wording (I03, I04) and one wrong unit (I01). These are logged for owners rather than patched, because VE00 is a baseline epoch and the corrections change customer wording.

## Remaining work and outcome

Nothing mandatory for VE00 remains. Native and device checks stay open under VE12 (or earlier if a device appears); labels for G-BUILDING and G-COMPARE are owned by VE03 and VE01 respectively.

**State: verified** for the recorded VE00 scope (engineering and data baseline on web; native/device explicitly not verified). **Outcome: adopt** the baseline, scripts and evaluation sets. Next eligible: **VE01** (and VE02, which also depends only on VE00).
