# Sessão noturna: mapa-base em todos os mapas do Vereda

Você é o orquestrador desta noite. Rode em Claude Fable 5.2 e **use um workflow / orquestre subagentes** para implementar o plano do mapa-base: ruas, quadras, lotes e bairros em todos os mapas do app, com a melhor visualização que conseguir verificar. Os subagentes rodam em **Opus 5.5** (`model: "opus"`). Esta tarefa autoriza escala acima do guia padrão: até ~30 agentes ao longo da noite, sem passar de ~6 ao mesmo tempo. Você coordena, revisa e decide; os agentes executam.

Você trabalha sozinho até de manhã. Ninguém vai responder perguntas. Quando faltar uma decisão que é do dono do produto, siga o padrão mais conservador descrito aqui, registre e continue.

## 1. Onde está tudo

- Repositório: `C:\Users\ssamu\OneDrive\Desktop\repos\veredas` (Windows; Git Bash e PowerShell; Expo SDK 57, expo-router, react-native-web, react-native-svg; código, comentários, commits e textos de tela em português).
- Leia o `AGENTS.md` da raiz inteiro: a seção "Fonte da verdade: o Enemyhub" vale para todo o repositório (a seção de motion vale só para `motion/` e afins). Se o `AGENTS.md`, o `README.md` ou `.github/` estiverem modificados e não commitados quando você começar, são trabalho de outra sessão: não commite, não reverta, não edite esses arquivos.
- Hub (MCP `enemyhub`, projeto Vereda `8c0a06e6-76eb-4673-a858-d2dc65d0ea81`): leia primeiro o documento **"Plano do mapa-base: ruas, quadras e bairros nos mapas (18/11/2026)"** e a tarefa **"Mapa-base: ruas, quadras, lotes e bairros em todos os mapas"**. O hub é a fonte da verdade sobre decisões.
- Material de referência: `docs/aplicacao/mapa-base-2026-11-18/` (commitado na branch `feat/mapa-base`; o `README.md` da pasta lista tudo):
  - `modelo-visual.html`: o modelo aprovado pelo dono do produto (abra num navegador). As vistas "Proposta" foram desenhadas com dados reais e são a referência visual.
  - `telas/hoje-*.png`: o app hoje; `telas/modelo-*.png`: a proposta.
  - `recortes/janela-A-gaveta.geojson` (450 × 400 m) e `recortes/janela-B-por-perto.geojson` (1,6 × 1,4 km): geometria real em volta do Golden Tower (índice 8001-216, centro -34.907539, -8.141503), com a propriedade `camada` (quadra, lote, rua, bairro, agua, praca, predio_indice; o alvo tem `alvo: true`). Servem de fixture para desenvolver o desenho antes de o pipeline existir.
  - `scripts/modelo.cjs`: o gerador do modelo (projeção local, uma forma por camada, rótulos que deslizam pela via, nome de bairro no ponto mais longe da borda, hachura fora dos bairros). Reaproveite a lógica; não copie o arquivo para o app.
  - `scripts/janelas.mjs`, `pesos.mjs`, `qualidade.mjs`, `cobertura.mjs`, `bench.mjs`, `densidade.cjs`: medições de peso, qualidade dos dados e desempenho.
  - `pesos.json`: pesos por camada e por bairro.

## 2. Estado de partida

- Trabalhe na branch **`feat/mapa-base`**, que já existe no GitHub: foi criada a partir de **`fix/mapas-e-leitura-de-anuncios`** (PR #4, ainda não mergeado: corrige o corte de vizinhos, a leitura de anúncios e a suíte no Windows) e traz só o material de referência. `git fetch` e `git switch feat/mapa-base`. Se o PR #4 for mergeado durante a noite, não faça rebase; siga na branch.
- Suíte de partida: `npx tsc --noEmit` sem erros; `npx jest` com 83 suítes, 1.980 testes, 0 falhas. Confira isso antes de começar e anote.
- Superfícies com mapa (todas entram no escopo):

| Componente | Onde aparece |
|---|---|
| `src/componentes/dossie-v1/MapaDoLote.tsx` + `mapa.ts` + `mapaInterativo.ts` | gaveta "Mapa do lote" (`Gavetas.tsx`), planta 2D e Volume 2.5D, zoom 1–3×, arraste, toque nas obras |
| `src/componentes/dossie-v1/PorPerto.tsx` (usa `MapaDoLote` com pontos extras) | aba Entorno (`Entorno.tsx`) |
| `src/componentes/predio/MapaDoPredio.tsx` | `src/app/(abas)/predio.tsx` (Raio-X do prédio, confirmação) |
| `src/componentes/mapa/Mapa.tsx` + `geometria.ts` | exemplos: `src/app/exemplos/[id]/(abas)/mapa.tsx`, `caminhos.tsx`, `confirmar-lote.tsx`; `src/componentes/dossie/Topo.tsx` |
| `src/componentes/mapa/PoligonoMini.tsx` | miniaturas em cartões (`comparar/CartaoDoImovel.tsx`, `visita-v1/CartaoDoImovel.tsx`, `dossie-v1/InfoDoImovel.tsx`, `dossie-v1/Topo.tsx`, `(abas)/index.tsx`) |

- Dados por área já saem do pacote JS pelo sistema de camadas (decisão D036): `src/dados/camadas.ts` (`lerCamada`, `garantirCamadas`, `EsperaDasCamadas`), `scripts/dados/publicar-camadas.cjs` (lista `MODULOS_GERADOS`, publica em `public/dados` e `assets/dados` com sha no nome), `metro.config.js`. O mapa-base entra como mais uma camada desse sistema: cache, uso offline e conferência por sha vêm de graça.
- O índice municipal ativo (`src/dados/recife/indice-municipal/<sha>/`) tem 72 bairros, 7.203 prédios de apartamento; vizinhos hoje vêm só do mesmo bairro (`src/componentes/dossie-v1/cadastro.ts`; leitura do índice em `src/dados/recife/indice.ts`).

## 3. O que entregar

1. **Pipeline** `scripts/dados/construir-mapa-base.mjs`, no estilo dos outros pipelines de `scripts/dados/` (downloads em `.cache/dados-recife/`, que está no `.gitignore`; nunca commitar os brutos):
   - Fontes, todas do portal https://dados.recife.pe.gov.br (dataset "Área urbana" `1702c764-ec7a-4ef0-9861-8acd0e40c819`, licença ODbL, publicado em 02/03/2026, atributos de 2023), em GeoJSON e já em lon/lat (CRS84):
     - Quadras `a961bf64-f6fe-4b1d-95c5-456bf0d01a31` (42 MB)
     - Lotes `c41ee0d0-bb33-4380-8809-2e9082d79ab0` (137 MB)
     - Trechos de Logradouros `6be90377-7b6d-483c-9b58-f7f34401ee6a` (14,5 MB; uma feição por rua; `NLGPAVRESU` é o nome curto, `CT` marca corredor de transporte, `NMPERIMETR` perimetral; `NMTPVIA` vem vazio)
     - Bairros do Recife `5c67ce14-1799-40c4-a37c-9daa04d1761c`
     - Recursos Hídricos `dc655db0-6b58-4334-8d72-1ef666de4b86` (inclui o oceano)
     - Pontes do Recife `53a04509-3524-4e4d-ac9e-79cf7d942c3d` (avalie se melhora a leitura sobre o Capibaribe)
     - Parques e Praças, dataset `b3a3a033-3611-485c-8d18-d02c5a42563d`, recurso `054f05a9-a113-47e0-a46f-720e4828eaf2` (ODbL, 04/03/2026)
     - Opcional: Face de Quadra `5c9068d9-7f36-45cd-a3ca-659a83dc0e37` (106 MB), se precisar do nome da rua por lado de quadra.
     - Os dicionários de dados (JSON) estão no mesmo dataset; use-os para escolher colunas.
   - Lista branca de colunas: só geometria e campos técnicos (DSQ, DSQFL, pavimentos, nome da rua, código da rua, CT, perimetral, nome do bairro, nome de água e praça). Nada de endereço de lote, nome de edifício da base de Lotes nem nada que identifique pessoa. `tests/lgpd-artefatos.test.ts` tem de passar.
   - Por bairro: recorte com borda de 300 m (para a divisa não ficar vazia); ligação lote → quadra **pela geometria** (18% dos lotes trazem código de quadra que não existe mais; 70 quadras e 231 lotes com código duplicado); simplificação Douglas-Peucker 0,5 m em lotes, quadras e água, 1 m em ruas; coordenadas em metros locais com precisão de 0,1 m, gravadas como diferenças. Formato com versão e esquema zod.
   - Saída: `src/dados/recife/mapa-base/<sha>/<bairro>.json` + módulo gerado, registrado em `MODULOS_GERADOS`. Determinístico: duas execuções produzem bytes idênticos (como `scripts/dados/ciclo.mjs`).
   - Ordem: piloto Boa Viagem e Torre; depois todos os bairros do índice ativo e os vizinhos que tocam a borda deles. Teto: 250 kB gzip por bairro; se passar, simplifique mais antes de cortar camada.
2. **Leitura** `src/dados/recife/mapaBase.ts`: carrega o bairro do imóvel e os bairros que tocam o quadro, por `garantirCamadas`; nunca bloqueia o resto da tela; estado `falhou` mostra o mapa sem o fundo e oferece tentar de novo, nunca um dado parecido.
3. **Desenho**: um componente comum de fundo (ex.: `src/componentes/mapa/FundoDoMapa.tsx` + lógica pura testável em `.ts`) usado por **todas** as superfícies da tabela, na medida que cada uma pede. Especificação na seção 4.
4. **Integração** em cada superfície, sem quebrar o que já funciona: obras numeradas, pontos de interesse do Por perto, rotina, 2.5D com sombras por horário, zoom/arraste/recentrar, confirmação de lote nos exemplos, miniaturas.
5. **Vizinhos**: com todos os lotes no fundo, o limite `MAX_VIZINHOS = 60` deixa de existir na planta; no 2.5D continua só para os volumes com altura (prédios do índice), já ordenado pela distância (PR #4). Vizinhos passam a vir também dos bairros que tocam o quadro.
6. **Interação e acessibilidade**: tocar num lote mostra "Lote vizinho · N pavimentos" (quando houver); `aria-label`/`accessibilityLabel` do mapa descreve rua do imóvel, bairro e distância até a divisa mais próxima; foco e teclado na web; área de toque de 44 × 44; contraste 4,5:1 nos rótulos; respeitar movimento reduzido.
7. **Documentação**: linha em `docs/aplicacao/FEATURE-REGISTER.md`, fonte e licença em "Sobre os dados" (`src/app/sobre-os-dados.tsx`), entrada no `docs/aplicacao/RUNBOOK-ATUALIZACAO.md` (como regenerar o mapa-base).

## 4. Especificação visual

A referência é `modelo-visual.html`. A identidade vem dos tokens de `src/tema/tokens.ts` (claro e escuro); use os nomes de token, não hex solto. Fontes: Fraunces (nome de bairro, selo), Plus Jakarta Sans (rua), JetBrains Mono (régua, rótulos técnicos). Sem gradiente, sombra decorativa, 3D de template ou cor de fora da marca.

Camadas, de baixo para cima:

| Camada | Claro (do modelo) | Observação |
|---|---|---|
| Rua (fundo dentro dos bairros) | `cor-superficie` #FFFFFF | rua é o espaço entre quadras; não desenhe eixo de rua no nível de lote |
| Fora de qualquer bairro do Recife | hachura 45° sobre `cor-papel-claro` | "sem dado", nunca parecer rua |
| Bairro do imóvel (só no Por perto) | `cor-acao` a 7% | |
| Quadra | `cor-sutil` #E7DEC9 | a faixa entre quadra e lote é a calçada |
| Lote | `cor-fundo` #F2EBDD, contorno `cor-linha-forte` 0,6 px | só até ~600 m |
| Prédio do índice | `cor-azul-cadastral-suave`, contorno `cor-azul-cadastral` 45% | "prédios que o Vereda conhece" |
| Praça e parque | `cor-salvia-suave`, contorno `cor-salvia` | |
| Água (canal, rio, mar) | azul cadastral claro (~#D3DEE8) | **por cima** das quadras: canais sobrepõem quadras na base |
| Divisa de outro bairro | `cor-texto-apoio`, tracejado 5/3 | |
| Divisa do bairro do imóvel | `cor-barro`, 1,6 px | |
| Lote do imóvel | `cor-azul-cadastral` 85% | |
| Rótulos de rua | Plus Jakarta 600, ~8,5 px, `cor-texto-apoio` com halo branco; avenidas em `cor-texto`; **rua do imóvel em `cor-azul-cadastral` 700, sempre** | |
| Nome de bairro | Fraunces 600, caixa alta, espaçamento 0,14 em; o do imóvel maior e em `cor-barro` | no ponto do quadro mais longe da borda do bairro |
| Pino, obras, pontos de interesse, régua | como hoje | sempre por cima |
| Crédito | "Base: Prefeitura do Recife (ODbL)" pequeno, discreto | obrigatório em todo mapa com o fundo |

Níveis por zoom (calcule por metros por pixel, não por tela):

| Escala do quadro | Desenha | Some |
|---|---|---|
| até ~600 m | quadras, todos os lotes, prédios do índice, todas as ruas com nome que couberem, água, praças, selo "BAIRRO / Boa Viagem" no canto | — |
| ~1 a 3 km | quadras, água, praças, avenidas, corredores (`CT`) e perimetrais com nome, divisas e nomes de bairro, pontos de interesse | lotes, ruas pequenas |
| mais de 3 km | bairros, água, avenidas | quadras |

- A gaveta abre em ~220 m (hoje ~80 m) com zoom até o lote. O Por perto continua enquadrando os pontos como hoje (~2,6 km no caso de Boa Viagem).
- **Uma forma por camada** (um `<Path>` com todos os anéis, `fillRule="evenodd"` quando preciso), não uma por lote: medido no Chrome com CPU 4× mais lenta, 7 mil polígonos juntos desenham em 24 ms contra 114 ms separados. No `react-native-svg` cada elemento é um objeto nativo.
- Rótulos de rua: o trecho mais longo dentro do quadro, lido da esquerda para a direita; prioridade rua do imóvel > avenida/corredor > comprimento; o nome desliza ao longo da via (50%, 35%, 65%, 22%, 78%…) até achar lugar sem colisão com outro rótulo nem com nome de bairro; só aparece se couber. `TextPath` existe no `react-native-svg`; confira o comportamento no nativo pelo código e na web pelo navegador.
- Com zoom, a espessura de traço e o tamanho de texto ficam constantes na tela (o padrão de `MapaDoLote` já divide por `estado.zoom`).
- Tema escuro: mesma estrutura com os tokens escuros; confira contraste.

## 5. Como orquestrar

Fases (cada uma termina num portão; não avance com portão vermelho):

- **F0 Preparação (você)**: ler hub, AGENTS.md (as regras de render ali são do `motion/`, não do app), o material de referência e o código das superfícies. Conferir a suíte. Criar a branch. Escrever `docs/aplicacao/mapa-base-2026-11-18/PLANO-DA-NOITE.md` com a divisão de trabalho e a propriedade de arquivos.
- **F1 em paralelo**:
  - Agente **dados**: pipeline, formato, testes do pipeline, piloto Boa Viagem e Torre. Dono de `scripts/dados/construir-mapa-base.mjs`, `src/dados/recife/mapa-base/**`, `src/dados/recife/mapaBase.ts`, registro em `publicar-camadas.cjs`.
  - Agente **desenho**: lógica pura de cena (projeção, LOD, montagem dos caminhos por camada, rótulos, nomes de bairro) + componente de fundo, desenvolvidos sobre os recortes de `recortes/*.geojson` como fixture, com testes jest. Dono de `src/componentes/mapa/FundoDoMapa*.tsx` e do módulo puro.
  - Agente **auditoria visual de hoje**: roteiro Playwright que sobe o web (porta própria, ex. 8095) e fotografa **todas** as superfícies da seção 2 a 375, 360 e 1280 px, claro e escuro, antes de qualquer mudança. Esse roteiro vira a régua das fases seguintes. Veja `docs/aplicacao/execucoes/*/render.mjs` como exemplo (análise salva injetada no `localStorage`); o Chrome do sistema funciona com `channel: "chrome"` se os navegadores do Playwright não estiverem instalados.
- **F2 integração (sequencial, uma superfície por vez, um agente por vez no mesmo arquivo)**: MapaDoLote planta → Por perto → 2.5D → MapaDoPredio → Mapa dos exemplos e Topo → PoligonoMini (decida se a miniatura ganha quadra e rua; não pode ficar ilegível em 64 px).
- **F3 expansão de dados**: todos os bairros do índice ativo + vizinhos de borda; medir peso total publicado.
- **F4 interação, acessibilidade, tema escuro, crédito ODbL, "Sobre os dados", FEATURE-REGISTER, RUNBOOK.**
- **F5 verificação final** (seção 6) e relatório.

Regras de orquestração:
- Brief completo para cada agente: objetivo, arquivos que ele possui, arquivos que não pode tocar, critérios de aceite, comandos de verificação, o que reportar. Ele só sabe o que você escrever.
- Dois agentes nunca editam o mesmo arquivo ao mesmo tempo. Integração e commits são feitos por um agente de cada vez (ou por você). Se usar `isolation: "worktree"`, lembre que cada worktree precisa de `npm ci` (lento no OneDrive); prefira dividir por arquivo na árvore principal.
- Cada fase tem um **revisor independente** (agente novo, sem o seu raciocínio) que recebe o diff, as capturas antes/depois e os critérios, e devolve os problemas por gravidade. Faça pelo menos duas rodadas por fase e corrija os três piores de cada rodada. Não aceite "compilou" como pronto.
- Desconfie de relatório confiante: confira você mesmo os números que vão para o relatório (rode os comandos, abra as capturas).
- Portas: cada agente que sobe o Expo usa uma porta própria e derruba o próprio processo ao terminar. Nunca mate processo que não é seu.
- Commits pequenos e frequentes em `feat/mapa-base`, mensagem em português no estilo do repositório (`feat(mapa): …`, `feat(dados): …`, `test: …`), terminando com:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (ou o modelo que fez o commit).

## 6. Portões de qualidade (todos verdes no fim)

- `npx tsc --noEmit` sem erros; `npm run lint` sem erro novo; `npx jest` com 0 falhas e o número de testes maior que 1.980.
- `node scripts/dados/publicar-camadas.cjs --conferir` sem problemas; `git status` limpo depois de subir o Metro (manifestos estáveis).
- Pipeline determinístico: duas execuções, mesmos bytes (registre os sha).
- Peso: ≤ 250 kB gzip por bairro; total publicado registrado no relatório; o pacote JS não cresce com dados.
- Desempenho no Chrome com CPU 4× mais lenta: primeiro desenho do fundo ≤ 50 ms na gaveta e ≤ 80 ms no Por perto de Boa Viagem; número de elementos SVG do fundo ≤ ~30 + rótulos. Registre os números antes e depois.
- Visual, para cada superfície, 375 / 360 / 1280 px, claro e escuro, antes e depois: sem rolagem horizontal; rótulos sem sobreposição; rua do imóvel rotulada; nome do bairro visível; divisa visível quando entra no quadro; água por cima das quadras; hachura onde não há bairro; obras, pontos e pino por cima; crédito ODbL presente. Pelo menos: Golden Tower (Boa Viagem, 8001-216), um prédio da Torre, um de Casa Forte perto de divisa e um bairro com muita quadra sem lote (ex.: Pina ou um dos morros cobertos pelo índice).
- Sem rede: abra um dossiê já visto com a rede cortada (web) e confira que o fundo aparece.
- Erros de console e requisições falhas: zero novos.
- LGPD: `tests/lgpd-artefatos.test.ts` verde com as camadas novas.

## 7. O que não fazer

- Não faça merge nem push para `main`; não reescreva histórico; não force push.
- Não adicione biblioteca de mapa (MapLibre, react-native-maps, Leaflet), WebView de mapa, tiles de terceiros, satélite nem chave de API. A abordagem é SVG próprio com dados abertos.
- Não invente dado nem "complete" área sem lote: quadra sem lote fica quadra sem lote (Coqueiral tem 98% da área de quadra sem lote; Pina 33%). Nada com aparência oficial pode ser inventado.
- Não mude regras de produto fora do mapa (custos, extrator, comparar, visita); não mexa no `package-lock.json` além do necessário para uma dependência que você justificar no relatório (o esperado é nenhuma).
- Não commite downloads brutos, `public/dados` nem `assets/dados`.
- Não apague nada no hub; não mude veredito de feature; não crie feature nem tarefa nova. A regra do `AGENTS.md` de pedir confirmação antes de gravar no hub está atendida **só** para as duas gravações da seção 9 (comentário e mudança de coluna da tarefa), que o dono do produto autorizou ao encomendar esta noite. Qualquer outra mudança no hub vira proposta no relatório.

## 8. Decisões que não são suas

Siga o padrão indicado, registre no relatório e continue:
- **Licença ODbL** (parecer jurídico pendente no hub): implemente com o crédito visível e a base derivada no repositório, mas não publique nada fora da branch. Registre como pendência.
- **Paissandu como vizinho de Madalena** (divisa de 2 m): desenhe o que a geometria disser; não trate isso como regra de produto.
- **Escala inicial da gaveta**: 220 m é a proposta; se a verificação mostrar que outra escala lê melhor, use e justifique com capturas.
- Qualquer mudança de comportamento fora do mapa: não faça; anote como sugestão.

## 9. Entrega de manhã

- `docs/aplicacao/mapa-base-2026-11-18/RELATORIO-NOITE.md`: o que foi feito por fase, o que ficou de fora e por quê, números (testes, pesos, desempenho antes/depois, sha do pipeline), lista de capturas antes/depois com caminho, problemas de dados encontrados, pendências e decisões tomadas por padrão. Escreva para alguém que não acompanhou a noite.
- Capturas em `docs/aplicacao/mapa-base-2026-11-18/telas/noite/` (antes/depois por superfície).
- Push da branch `feat/mapa-base` e PR **rascunho** contra `fix/mapas-e-leitura-de-anuncios` (ou contra `main`, se o PR #4 já tiver sido mergeado), com resumo, capturas principais, portões e pendências. Se existir `.github/pull_request_template.md` (commitado ou não), siga o modelo e preencha a seção "Hub" (tarefa, feature `ad9ed0d4-8ad2-48a4-a534-244cef17425c` "Mapa do lote em 2D e volume 2.5D", documento do plano). Termine o corpo do PR com `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Hub: comente na tarefa "Mapa-base: ruas, quadras, lotes e bairros em todos os mapas" com o resumo e o link do PR, e mova para "Fazendo" (não para "Feito": falta a revisão humana e o celular físico).
- Se parar antes do fim (erro, limite), deixe a branch num estado em que os portões passem, commite e escreva no relatório onde parou e qual o próximo passo.
