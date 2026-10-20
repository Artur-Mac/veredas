# Motion do pitch VEREDA

Motor de animação determinístico (`window.seek(t)` + Playwright + ffmpeg) e as provas de conceito do pitch. Regras em [`../AGENTS.md`](../AGENTS.md); linguagem visual em [`../docs/motion-language.md`](../docs/motion-language.md).

As **12 cenas têm masters visuais individuais** em `out/`. O palco em [`palco.html`](palco.html) toca a sequência aprovada para revisão e apresentação com pausas; o roteiro revisado em 18/10/2026 está em [`../docs/pitch-revisado-2026-10-18.md`](../docs/pitch-revisado-2026-10-18.md), com os cortes ainda necessários em [`../docs/plano-montagem-roteiro-revisado.md`](../docs/plano-montagem-roteiro-revisado.md). Os vídeos ainda seguem a versão anterior e seus sons de interface: a gravação recebida não foi sincronizada.

| Arquivo | O que é |
| --- | --- |
| `lib/motion.js` | springs em forma fechada, `track`, `swap`, `press`, `rng`, câmera 2.5D (`project`), quadrilátero arredondado |
| `lib/marca.css` | tokens da marca extraídos do `index.html` |
| `poc/poc-01.html` | POC-01: cartão → registro → lote → mapa → dossiê (13,4 s) |
| `poc/dados.js` | os fatos do POC, com a origem de cada um |
| `poc/cena01.html` | cena 01 do pitch, "o apartamento perfeito", em três variantes (`?v=1` janela, `?v=2` linha do anúncio, `?v=3` geometria), 18 s |
| `poc/cena02.html` | cena 02, "o cliente do portal": `?v=1` ousada (14,4 s) e `?v=2` sóbria, com costuras e HOLDs (23,633 s) |
| `poc/cena03.html` | cena 03, pesquisa com 83 pessoas e quadro ilustrativo do entorno (34,8 s) |
| `poc/cena04.html` | cena 04, travessia das bases e dificuldade de cruzamento (25,4 s) |
| `lib/espaco3d.js` | câmera pinhole e polígonos 3D em SVG (usado pela cena 02) |
| `poc/cena05.html` | cena 05, "a virada: em segundos" (15,75 s): a tinta escoa, SEMANAS vira SEGUNDOS, o cartão "Auditar novo anúncio" e a porta em planta entre Edifício e Entorno |
| `lib/subsolo.js` | o subsolo escuro (pontilhado, régua de semanas, contorno, nomes das bases): primeiro quadro da cena 05 e último da cena 04 |
| `poc/cena06.html` | cena 06, "da porta para dentro" (29,7 s): leitura do anúncio, simulação da lente, lote, área, IPTU e ITBI do prédio real |
| `poc/cena07.html` | cena 07, "da porta para fora" (25,4 s): cidade, raio de 150 m, alagamento, calor, segurança e caminhos |
| `poc/cena08.html` | cena 08, "tirar a maquiagem e negociar" (21,9 s): o anel vira a divisória, declarado × registro oficial, prioridade Custo e a mensagem ao corretor |
| `lib/cidade.js` | cidade estilizada (REF-01 na marca) em volumes, paletas quente e dessaturada, SVG ou canvas |
| `lib/costuras.js` e `poc/costura.html` | quadros de emenda entre cenas feitas em paralelo (C02-03, C03-04, C09-10, C10-11, C11-12); as duas vizinhas conferem o quadro por diff contra `costura.html?id=<ID>` |
| `tools/checar-quadros.mjs` | verificador de texto sobre texto e de deslocamento por quadro (`node motion/tools/checar-quadros.mjs cena05 --porta 4193`) |
| `tools/verificar-pitch.mjs` | confere a narração travada e se as citações e batidas do storyboard são literais |
| `tools/cenas-pitch.mjs` | divide o pitch travado em trechos por cena (`tools/cenas-pitch.json`) |
| `montagem.mjs` e `montagem/linha-final.json` | filme final com a voz: cada quadro é `seek(t)` da cena da vez, com `t` interpolado de âncoras [tempo na gravação, tempo da cena] (`node motion/montagem.mjs parte N`, depois `juntar`) |
| `serve.mjs` | servidor estático local (os módulos ES não carregam em `file://`) |
| `palco.html` | player das 12 cenas, com HOLDs e costuras automáticas; usa os MP4 com som de `out/` |
| `render.mjs` | QA, vídeo, som e teste de determinismo |
| `audio/sfx.mjs` | sons de interface sintetizados a partir das deixas do POC |
| `audio/beats.py` | grade de batidas de uma trilha licenciada (librosa), para quando houver trilha |
| `audio/ritmo-poc-01.json` | mapa de ritmo provisório gerado pelo `render.mjs audio` |
| `test/motion.test.mjs` | testes da biblioteca |

## Comandos no Linux

Precisa de Node 22, ffmpeg e o Playwright da raiz (`npm install` e `npx playwright install chromium`, se ainda não houver).

Preview no navegador, em loop, com espaço para pausar:

```bash
node motion/serve.mjs
```

Depois abra `http://127.0.0.1:4178/motion/poc/poc-01.html`. Para o modo ao vivo (ENTER → HOLD → EXIT; espaço ou → avança, ← volta, `r` reinicia), use `?live`; para ver o tempo no canto, `?debug`.

Para revisar o pitch inteiro, abra `http://127.0.0.1:4178/motion/palco.html`. **Espaço** ou **→** inicia e avança; **←** volta; **R** recomeça; **F** abre em tela cheia. A primeira cena usa a V1 aprovada. Algumas costuras avançam sozinhas. O palco é um preview das cenas individuais, não a montagem já ajustada ao roteiro novo.

Revisão visual (quadros-chave, grade de 0,5 s, tiras e 360 px em `motion-references/contact-sheets/poc-01/<rodada>/`):

```bash
node motion/render.mjs qa --passo pass-5
```

Vídeo de preview a 30 fps (`out/poc-01.mp4`):

```bash
node motion/render.mjs video --fps 30
```

Sons, mapa de ritmo e mixagem em −14 LUFS (`out/poc-01-com-som.mp4`):

```bash
node motion/render.mjs audio
```

Versão final a 60 fps com motion blur, 8 subquadros num obturador de 180° (`out/poc-01-60fps.mp4`; leva cerca de 10 minutos):

```bash
node motion/render.mjs video --fps 60 --sub 8 --obturador 0.5
```

Com `--sub 4` e obturador 1, o texto rápido vira cópias fantasma em vez de borrão (achado na rodada 4).

Teste de determinismo (o mesmo `t` em ordens diferentes precisa dar o mesmo PNG):

```bash
node motion/render.mjs determinismo
```

Testes da biblioteca:

```bash
node --test motion/test/motion.test.mjs
```

Validar o manifesto de referências e ver o próximo id:

```bash
node refs/validate.mjs
```

## Cena 01

Preview de uma variante (troque `v=2` por 1 ou 3; acrescente `&live` para o modo ao vivo):

```bash
node motion/serve.mjs
```

Depois abra `http://127.0.0.1:4178/motion/poc/cena01.html?v=2`.

Revisão de uma variante:

```bash
node motion/render.mjs qa --poc cena01 --v 1 --passo pass-6
```

As três variantes lado a lado nos mesmos tempos:

```bash
node motion/render.mjs comparar --poc cena01 --variantes 1,2,3 --passo pass-6
```

Vídeo e som de uma variante (`out/cena01-v1-com-som.mp4`):

```bash
node motion/render.mjs video --poc cena01 --v 1 --fps 30
```

```bash
node motion/render.mjs audio --poc cena01 --v 1
```

## Cena 02

Igual à cena 01, com `--poc cena02` e `--v 1` (ousada) ou `--v 2` (sóbria):

```bash
node motion/render.mjs qa --poc cena02 --v 1 --passo pass-6
```

```bash
node motion/render.mjs comparar --poc cena02 --variantes 1,2 --passo pass-6
```

Regras que a cena 02 acrescentou: câmera que dá zoom no mundo usa `zoom` (layout) em vez de `transform: scale`, e nada que precise ser idêntico entre quadros cresce ou vira por `transform`. O Chromium reaproveita rasterização de quadros anteriores de elementos com transform que muda, e o quadro passa a depender do histórico.

## Cenas 05 a 08

```bash
node motion/render.mjs qa --poc cena07 --passo pass-6
```

```bash
node motion/render.mjs video --poc cena07 --fps 30
```

Antes de entregar qualquer cena, confira a narração:

```bash
node motion/tools/verificar-pitch.mjs
```
