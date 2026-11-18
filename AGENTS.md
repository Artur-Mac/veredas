# Instruções para agentes

## Fonte da verdade: o Enemyhub

Vale para todo o repositório. Decisão do usuário de 16/11/2026, estruturada aqui em 18/11/2026.

- O **Enemyhub** é a fonte da verdade do Vereda: negócio, escopo, features (com veredito e justificativa), impedimentos, decisões de produto, tarefas, documentos e roteiros de pitch. Projeto no hub: **Vereda**, id `8c0a06e6-76eb-4673-a858-d2dc65d0ea81`.
- O acesso é pelo servidor MCP `enemyhub`, que fica no repositório `Mangue-Bit/EnemiesHub`, pasta `mcp/`. Cada pessoa gera o próprio token em **Minha conta** no hub e registra o servidor uma vez com `claude mcp add --scope user enemyhub ...` (passo a passo no `mcp/README.md` daquele repositório). **Nunca grave o token neste repositório**: nem em `.mcp.json`, nem em `.env` versionado, nem em doc ou log.
- **Antes** de trabalhar em escopo, feature, PRD ou decisão, leia o projeto com `enemyhub_get_project` (use `sections`, por exemplo `["features"]`, porque o projeto inteiro estoura o limite de resposta).
- **A cada feature**, atualize o hub no mesmo trabalho, com `enemyhub_apply_changes`:
  - ao começar: a feature existe no hub, com a tarefa no quadro "Macro";
  - ao mudar o escopo ou o veredito: registre o veredito **com a justificativa** (o porquê é o que o hub preserva). Se a decisão não foi tomada, a feature fica `em_aberto`, sem justificativa inventada;
  - ao concluir: mova a tarefa e registre os impedimentos que ficaram;
  - mostre ao usuário o que vai mudar e peça confirmação antes de gravar. Passe o `updatedAt` lido; se o hub responder 409, releia e refaça.
- **Conflito entre `docs/` e o hub: vale o hub.** Corrija o doc ou aponte a divergência ao usuário. Decisão nova vai para o hub, não para um documento solto em `docs/`.
- `docs/` continua guardando o que o hub não guarda: evidência e execução (`docs/aplicacao/execucoes/`, medições, logs, telas), dados (`docs/dados/`), planos técnicos e o pitch. O registro de features (`docs/aplicacao/FEATURE-REGISTER.md`) é um espelho técnico (código, dados, política de atualização): quando ele mudar, o hub muda junto.
- Limites do MCP: só opera no quadro "Macro"; responsável de tarefa, colunas do kanban, áreas e imagens são alterados pela interface do hub.
- No PR, preencha a seção "Hub" do modelo em `.github/pull_request_template.md`.

## Notas e avaliações no app

Decisão do usuário de 18/11/2026 (D1, D4, A13), registrada no hub.

- Notas 0–10, selos e comparações de vantagem são permitidos quando cada nota mostra como foi calculada (ficha de método) e usa dado do imóvel, nunca valor fixo igual para todos. Sem dado, a tela diz "Sem leitura" e a nota fica fora de qualquer média.
- Previsão de preço e preço-alvo continuam proibidos. Ranking de bairros e adjetivo sobre bairro ("seguro", "perigoso") também.
- Todo dB(A) na tela é estimativa e vem com a palavra "estimativa".
- A ficha de método é a de 6 campos: `src/dados/fichaDeMetodo.ts` e `src/componentes/visual/FichaDeMetodo.tsx`.
- Núcleo offline (SQLite, Drizzle, PMTiles, MapLibre): não será feito agora (decisão de 18/11/2026). Está em `arquivo/nucleo-offline-2026-11-18`.

## Motion do pitch VEREDA

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
