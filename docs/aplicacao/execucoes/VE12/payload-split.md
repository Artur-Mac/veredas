# VE12 follow-up — payload split (D036)

**Date:** 2026-11-14. **State:** engineering done on web; native verified only up to the bundler. **Nothing committed.**

## What changed

Area and layer data no longer ships inside the JavaScript bundle.

- **Generated loaders list paths, not `require()`s.** The seven generated modules (`publicacaoGerada.ts`, `transitoGerado.ts`, `essenciaisGerados.ts`, `noiteGerado.ts`, `chuvaGerado.ts`, `procuraGerado.ts`, `sol/fontesGeradas.ts`) and their six generators plus `preparar-sol-recife.py` now emit `"recife/…/x.json"` paths. Version constants are unchanged. `meta.json` (9 KB) stays bundled.
- **Publisher.** [`scripts/dados/publicar-camadas.cjs`](../../../../scripts/dados/publicar-camadas.cjs) copies each listed file to:
  - `public/dados/<path>.<sha16>.json` for web;
  - `assets/dados/<path>.<sha16>.vjson` for native.

  It also writes [`camadasGeradas.ts`](../../../../src/dados/camadasGeradas.ts) (path → url, bytes, sha256) and [`camadasNativasGeradas.ts`](../../../../src/plataforma/camadasNativasGeradas.ts). It runs from `metro.config.js` on every Metro start/export, from each generator, and as the `eas-build-post-install` hook. Both output folders are git-ignored.
- **Registry.** [`src/dados/camadas.ts`](../../../../src/dados/camadas.ts) is a synchronous `lerCamada` over files loaded by `garantirCamadas`. A file that has not loaded throws `CamadaPendente`; a failed one throws `CamadaIndisponivel`. Modules that used to cache "no data" on any error (timetable, procura, sun) now re-throw these, so a missing file never becomes "nothing here". Zod validation and the generated-version checks are unchanged.
- **Web fetch and offline.** Data comes from Cache Storage first, then the network. Size and sha256 are checked before a file is used or cached. [`public/sw.js`](../../../../public/sw.js) caches the app shell (HTML, bundle, fonts) in production only. Data files are content-addressed; stale versions are pruned at startup.
- **Native.** Each file is an expo-asset (`.vjson`, registered in `metro.config.js`), read with `expo-file-system` and its byte size checked. There is no network on native.
- **Screens wait.** [`EsperaDasCamadas`](../../../../src/componentes/EsperaDasCamadas.tsx) gates:
  - Dossiê, Prédio, Visita, Comparar, Detalhes and Sol;
  - the Rotina tab ("Calculando a rotina por horário…");
  - sun on façades and the solar surroundings (existing "Calculando…" states).

  On failure a screen says "Não foi possível carregar os dados de <bairro>.", explains the offline rule and offers "Tentar de novo"; no partial dossier is drawn. Início cards load the index after first paint, as before. After a dossier opens, the sun and timetable files are cached in the background.

## Numbers

| Measure | Before | After |
|---|---|---|
| Web JS bundle (`expo export`) | 30.08 MB | **3.45 MB** |
| … gzip -9 | 7.30 MB | **0.94 MB** |
| Usable Início, CPU 1× (median of 5, uncompressed) | 697 ms | **265 ms** |
| Usable Início, CPU 4× | 1,952 ms | **931 ms** |
| Usable Início, CPU 1× / 4× (server gzips on the fly) | 1,438 / 2,755 ms | 302 / 1,028 ms |
| JS heap at Início | 45 MB | 17 MB |
| Android Hermes bundle | not measured | 6.2 MB + 99 data assets |

- **How startup was measured:** [`ve12-inicio.mjs`](scripts/ve12-inicio.mjs) against both exports, served by [`servir-estatico.mjs`](scripts/servir-estatico.mjs) on the same machine. The uncompressed row is comparable to VE12's 712 / 1,969 ms. All of these are desktop proxies, not phone measurements.
- **What a dossier downloads on first open** (raw / gzip):
  - index, day-to-day, night and flood: 0.14 / 0.03 MB (Casa Forte) up to 3.0 / 0.49 MB (Boa Viagem);
  - sun, in the background: 1.8–5.9 MB / 0.5–1.5 MB;
  - Rotina: 3.0 / 0.8 MB, mostly the shared timetable grid.

  All 99 files total 27.6 MB / 6.5 MB. Details: [`payload-split.json`](payload-split.json).

## Checks run

```
npx tsc --noEmit                      # 0 errors
npx expo lint                         # 0 errors, the same 5 pre-existing warnings
npx jest --runInBand                  # 67/67 suites, 1569/1569 tests (tests/camadas.test.ts new: 11)
node --test scripts/dados/**/testes/*.test.mjs   # 86/86
node scripts/dados/publicar-camadas.cjs --conferir   # 99 files, 0 problems
npx expo export --platform web | android          # both build; android ships 99 .vjson assets
POC_URL=http://127.0.0.1:8099 node docs/aplicacao/execucoes/VE12/scripts/ve12-piloto.mjs   # production export
URL=http://127.0.0.1:8099 node docs/aplicacao/execucoes/VE12/scripts/payload-offline.mjs
POC_URL=http://localhost:8094 SMOKE_OUT=out/payload/v1-smoke node scripts/v1-smoke.mjs   # dev server: 50/50 steps, 0 external requests
```

- **Pilot** ([`payload-piloto.json`](payload-piloto.json)):
  - 0 errors, 0 external requests, 0 invariant violations;
  - capability blocks identical to VE12 in all 30 items (20 dossiers, 10 comparisons);
  - time to dossier tabs: median 214 ms on the production export (VE12: 969 ms on the dev server, so not like-for-like).

  VE12's own `piloto.json` was restored byte-identical after the run.
- **Offline** ([`payload-offline.json`](payload-offline.json)):
  - a Casa Forte dossier opened once reloads with the network off: tabs, day-to-day and sun on façades all present;
  - a Madalena dossier never opened shows the failure and no dossier;
  - with the network back, "Tentar de novo" opens it.

  0 external requests, 0 page errors.
- **One defect found and fixed during the run:** the Rotina gate first said "Carregando os horários…". The pilot waits for "Calculando" to disappear, so it read the tab before the monthly and cost × time blocks were computed (10/10 missing). The gate now uses the app's "Calculando…" wording, and the rerun matches VE12 exactly. The pilot's dependence on that word is fragile.

## Not verified / limits

- **Native at runtime:** reading the `.vjson` assets (expo-asset + file system) has not run on a device or emulator; only the Android export was checked. iOS was not exported.
- **Service worker:** only first install and offline reload were tested. An update across two deploys and browser eviction of Cache Storage were not tested (after eviction the app refetches, or shows the failure offline).
- **Coverage limits:** a bairro never opened on a device is unavailable offline by design. The web build needs a secure context (HTTPS or localhost) for the service worker and the sha256 check; without one it still works online and checks size only.
