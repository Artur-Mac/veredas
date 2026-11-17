# Instruções para agentes: motion do pitch VEREDA

Vale para quem trabalha em `motion/`, `refs/`, `motion-references/` e nos docs de motion (`docs/pitch/motion-language.md`, `docs/pitch/storyboard.md`, `docs/pitch/ui-state-spec.md`, `docs/pitch/reference-analysis.md`, `docs/pitch/review-log.md`). Reescrito em 17/10/2026; a versão anterior estava errada (paleta e fontes que não são da marca) e foi arquivada em `motion-references/_descartado-ia-anterior/AGENTS.md`.

## Marca

- A única fonte da identidade visual é o protótipo web `index.html`, na raiz. Os tokens estão em `motion/lib/marca.css`: papel `#F2EBDD`, superfície `#FFFFFF`, texto `#171717`, laranja `#F47745`, ferrugem `#B94E36`, azul cadastral `#2E5A85`. Fontes: Fraunces, Plus Jakarta Sans e JetBrains Mono.
- Não importe marca, fonte ou paleta das referências externas.
- Sem gradiente, glow, partícula genérica ou 3D de template.

## Dados

- **Decisão do usuário de 18/10/2026 (vale sobre as regras antigas abaixo):** o pitch é demonstrativo. Saem da tela todos os avisos ("ilustrativo", "fictício", "exemplo", "demonstração", "em desenvolvimento", "encenado", rodapés de fonte). Fonte e data só entram simplificadas, e só quando ajudam o número. Dados podem ser inventados ou arredondados para mostrar o impacto da funcionalidade, mas nenhum endereço real aparece: o imóvel é "Imóvel em análise" (`motion/poc/dados.js`) ou um endereço inventado.
- Big numbers impactantes, interligados de uma cena para a outra. Os números da fala aparecem exatamente como ditos (93%, 83, mais de 70%, 89%, 4,7 de 5, 15 telas, mais de meio milhão, junho de 2027).
- Sem nota, selo ou veredito de julgamento sobre o imóvel.
- A cena 01 usa uma extensão quente da paleta (amarelos e cremes derivados do laranja e do papel), pedida pelo usuário. O acento do choque continua sendo o laranja `#F47745` da marca.
- Regras antigas (até 17/10/2026, antes da decisão acima): só dados reais com origem e data; o ilustrativo dito na tela. Ficam como histórico em `docs/pitch/review-log.md`.

## Narração (travada)

- **Roteiro vigente: `docs/pitch/pitch-revisado-2026-10-18.md`** (entre `PITCH-REVISAO:INICIO` e `PITCH-REVISAO:FIM`), enviado pelo usuário com a gravação de referência de 120 s. É imutável: não reescreva, resuma, reordene, corrija nem acrescente falas, nem para caber no tempo da animação. Se um conceito visual pedir outra fala, mude o conceito.
- O tempo de cada parágrafo na gravação está em `docs/pitch/mapa-fala-revisada.md`. Cada cena dura o que a fala dela dura e prende os eventos às palavras de sentido; a montagem final com a voz vem depois.
- O roteiro anterior está em `docs/pitch/pitch-original-locked.md`, com o storyboard e `node motion/tools/verificar-pitch.mjs`, que continuam valendo para aquele texto. A cena 09 (visita) saiu da fala nova e fica guardada como peça separada.

## Render

- Cada quadro é `window.seek(t)`, função pura do tempo. No render não há `setTimeout`, `setInterval`, transição CSS nem `requestAnimationFrame`; o rAF só roda no preview, atrás de `!navigator.webdriver`.
- Nunca `Math.random()`: use `rng(semente)` de `motion/lib/motion.js`.
- Nunca `will-change`. Texto em morph muda por `font-size` e `font-weight`, nunca por `scale()`.
- Nunca redimensione nem escale uma imagem durante a animação: recorte com `clip-path`.
- Meça texto sem transform no contêiner.
- Câmera que dá zoom num grupo de elementos HTML usa `zoom` (layout), não `transform: scale`. Elemento que cresce, vira ou se desloca entre quadros muda por layout (`top`, `width`, `clip-path`) ou é redesenhado em SVG; `transform` animado faz o Chromium reaproveitar rasterização antiga.
- `node motion/render.mjs determinismo` tem que passar.

## Referências

- Nunca apague nem reescreva uma referência analisada em `refs/references.json`. Acrescente com o próximo id (`node refs/validate.mjs` informa qual).
- `available_inspected` só se o vídeo foi de fato baixado ou assistido; texto lido é `available_inspected_via_transcript_and_spec`. Registre cada tentativa em `accessLog`.

## Revisão

Uma animação não está pronta porque compilou. Para cada mudança:

1. `node motion/render.mjs qa --passo pass-N`.
2. Abra e olhe a folha de contato, a grade de 0,5 s, as tiras e o teste de 360 px.
3. Registre problemas, correções e notas em `docs/pitch/review-log.md`.
4. Faça pelo menos duas rodadas e corrija os três piores problemas de cada uma.
