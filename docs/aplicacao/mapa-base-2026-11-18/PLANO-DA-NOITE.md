# Plano da noite: mapa-base (18/11/2026)

Escrito pelo orquestrador na F0, antes de qualquer agente rodar. Diz quem faz o quê, quem é dono de cada arquivo e o que foi decidido na preparação. O pedido está em `PROMPT-SESSAO-NOTURNA.md`; o plano de produto está no hub (documento "Plano do mapa-base: ruas, quadras e bairros nos mapas (18/11/2026)"). O que aconteceu de fato fica em `RELATORIO-NOITE.md`.

## 1. Estado de partida conferido

| Item | Valor |
|---|---|
| Branch | `feat/mapa-base`, igual a `origin/feat/mapa-base` (commit `7b4dacd`) |
| `npx tsc --noEmit` | 0 erros |
| `npx jest` | 83 suítes, 1.980 testes passando, 3 pulados, 0 falhas |
| `npm run lint` | 0 erros, 5 avisos (já existiam) |
| Arquivos de outra sessão, não commitados | `AGENTS.md`, `README.md`, `.github/` |
| Máquina | Windows 11, 12 núcleos, 23,8 GB de memória (8,9 GB livres), 17 GB livres em disco |
| Navegador | Chrome do sistema; os navegadores do Playwright não estão instalados (`channel: "chrome"`) |
| Portal de dados | `https://dados.recife.pe.gov.br` responde (o `http://` redireciona) |

## 2. O que a leitura do código mostrou

1. **`PoligonoMini.tsx` não é usado por ninguém.** As miniaturas de verdade desenham o lote direto com `caminho(poligonoNaCaixa(...))` em quatro lugares: `src/app/(abas)/index.tsx` (288 × 72), `src/componentes/comparar/CartaoDoImovel.tsx` (164 × 84), `src/componentes/visita-v1/CartaoDoImovel.tsx` e `src/componentes/dossie-v1/Topo.tsx` (300 × 100, via `caminhoDoLoteNaCaixa`). `dossie-v1/InfoDoImovel.tsx` só tem ícones. A superfície "miniaturas" são esses quatro lugares.
2. **O mapa dos exemplos (`src/componentes/mapa/Mapa.tsx` + `geometria.ts`) é inventado**: ruas em grade, praças, mar ou rio e nove lotes retangulares saem de um gerador com semente no id do dossiê. Os cinco dossiês de exemplo têm coordenada real em `lote.centro` (o de Boa Viagem com endereço real; os outros quatro marcados como ilustrativos) e `lote.poligono` nulo.
3. **Três projeções convivem** no app, com diferença de até 0,6%: `projetorDoPlano` e `projetorLocal` (esfera de 6.371.008,8 m), `geo.ts` (111.320 e 110.540 m por grau) e o gerador do modelo (111.320 e 110.574). O mapa-base usa a primeira; quem desenha em outra converte por transformação afim.
4. **O código do logradouro já está no id do prédio**: `8001-216` é o logradouro 8001, o mesmo `CLOGRACODI` dos Trechos de Logradouros. É por aí que o desenho acha a rua do imóvel.
5. **O Por perto pode passar de 3 km**: enquadra pontos a até 1.300 m de cada lado, com 22% de margem. O mapa dos exemplos vai de ~3 km até mais de 7 km ao afastar. O nível "mais de 3 km" precisa existir.
6. O teste de LGPD roda um caso por arquivo de camada publicado: cada arquivo novo do mapa-base entra sozinho na conferência.

## 3. Decisões de desenho tomadas na F0

Tomadas pelo orquestrador para os agentes trabalharem em paralelo. Cada uma vai para o relatório.

1. **Contrato em memória** em `src/dados/recife/mapaBaseContrato.ts` (só tipos): a leitura entrega esses tipos, o desenho só conhece esses tipos. Coordenadas em decímetros inteiros num plano local por arquivo (x para leste, y para o sul).
2. **Um arquivo por bairro**, como no plano aprovado: `src/dados/recife/mapa-base/<sha>/<bairro>.json`, com tudo que toca o bairro mais a borda de 300 m. Os lotes podem ser decodificados só quando pedidos.
3. **Mais um arquivo para a cidade** (`cidade.json`, no mesmo diretório): as 94 divisas simplificadas, os corpos d'água maiores e as avenidas, corredores e perimetrais. Serve ao nível de mais de 3 km, aos nomes e divisas dos vizinhos e à hachura de "fora do Recife". É um acréscimo ao plano: sem ele, um quadro de 5 km baixaria dezenas de arquivos de bairro para desenhar só divisas.
4. **Lote de prédio do índice é marcado no pipeline** (`noIndice`), cruzando o DSQFL da base de Lotes com o índice ativo. O arquivo publicado não leva DSQFL, DSQ, endereço nem nome de edifício: só geometria, pavimentos e a marca. O lote do imóvel é achado no app pela geometria (o lote que contém o centro do prédio). Consequência: o mapa-base tem de ser gerado de novo quando o índice muda; o módulo gerado registra o índice usado e um teste confere.
5. **Hachura significa "sem dado"**: fora de qualquer bairro carregado. Num mapa de quadro fixo (gaveta, Por perto, confirmação do prédio), se um arquivo necessário falha, o estado é `falhou`: mapa sem fundo e botão de tentar de novo.
6. **Carga em dois tempos**: primeiro o arquivo do bairro do imóvel; se o quadro sai da borda de 300 m dele, os bairros cuja caixa toca o quadro (as caixas ficam no módulo gerado, pequeno, no bundle) e o arquivo da cidade.
7. **Rótulos por passo de zoom, não por arraste**: os nomes são posicionados para a cena inteira em cada zoom e ficam parados enquanto o mapa é arrastado.
8. **Nenhuma dependência nova.** Recorte, ponto em polígono, distância a segmento e Douglas-Peucker são escritos no pipeline.

## 4. Propriedade de arquivos

Dois agentes nunca editam o mesmo arquivo ao mesmo tempo. Ninguém toca `AGENTS.md`, `README.md`, `.github/`, `package.json`, `package-lock.json`, `motion/`, nem usa `git add -A`, `git commit -a`, `git stash`, `git reset --hard` ou `git checkout -- <arquivo>`.

| Área | Arquivos | Dono |
|---|---|---|
| Contrato | `src/dados/recife/mapaBaseContrato.ts` | orquestrador (mudança só aditiva, pedida no relatório do agente) |
| Pipeline | `scripts/dados/construir-mapa-base.mjs`, `scripts/dados/mapa-base/**`, `scripts/dados/testes/*mapa-base*` | agente dados |
| Dados gerados | `src/dados/recife/mapa-base/**`, `src/dados/recife/mapaBaseGerado.ts` | agente dados (F1), agente expansão (F3) |
| Leitura | `src/dados/recife/mapaBase.ts`, `tests/mapa-base*.test.ts` | agente dados |
| Registro de camadas | `scripts/dados/publicar-camadas.cjs` (só `MODULOS_GERADOS`), `src/dados/camadasGeradas.ts`, `src/plataforma/camadasNativasGeradas.ts` (gerados) | agente dados |
| Desenho | `src/componentes/mapa/fundoDoMapa*.ts`, `src/componentes/mapa/FundoDoMapa*.tsx`, `tests/fundo-do-mapa*.test.ts`, `tests/apoio/mapa-base-de-teste.ts` | agente desenho |
| Régua visual | `docs/aplicacao/mapa-base-2026-11-18/scripts/capturar.mjs` e arquivos de apoio na mesma pasta, `docs/aplicacao/mapa-base-2026-11-18/telas/noite/**` | agente auditoria |
| Superfícies (F2 em diante) | `src/componentes/dossie-v1/MapaDoLote.tsx`, `mapa.ts`, `mapaInterativo.ts`, `PorPerto.tsx`, `Gavetas.tsx`, `Topo.tsx`, `cadastro.ts`; `src/componentes/predio/MapaDoPredio.tsx`, `projecao.ts`; `src/componentes/mapa/Mapa.tsx`, `geometria.ts`, `PoligonoMini.tsx`; telas dos exemplos; cartões com miniatura | um agente de integração por vez, na ordem da seção 5 |
| Documentação do produto | `docs/aplicacao/FEATURE-REGISTER.md`, `docs/aplicacao/RUNBOOK-ATUALIZACAO.md`, `src/app/sobre-os-dados.tsx` | agente de documentação (F4) |
| Plano e relatório | este arquivo, `RELATORIO-NOITE.md` | orquestrador |

## 5. Fases, agentes e portões

Até ~30 agentes na noite, no máximo 6 ao mesmo tempo, todos em Opus 5.5. O orquestrador confere os números de cada relatório antes de aceitar e faz os commits das fases paralelas.

| Fase | Agentes | Portão para avançar |
|---|---|---|
| F1 (paralela) | **dados** (pipeline, formato, leitura, piloto Boa Viagem e Torre, `cidade.json`); **desenho** (cena pura, componente, testes sobre os recortes); **auditoria** (roteiro de capturas e fotos de antes) | tsc e lint limpos; jest verde; pipeline com bytes iguais em duas execuções; peso do piloto no teto; cenas dos recortes parecidas com o modelo; capturas de antes de todas as superfícies |
| F1 revisão | 2 revisores independentes (dados, desenho), correções, 1 revisor na segunda rodada, correções | os três piores problemas de cada rodada corrigidos |
| F3 (cedo, junto com a F2) | **expansão** (todos os bairros, medição de peso); 1 revisor de dados | todos os arquivos no teto de 250 kB gzip ou justificados; `publicar-camadas --conferir` limpo; LGPD verde |
| F2 (sequencial) | **gaveta** (MapaDoLote na planta, escala inicial, vizinhos); **por perto e 2.5D**; **prédio e miniaturas**; **exemplos e topo**; revisão em duas rodadas com capturas | cada superfície conferida a 375, 360 e 1280 px, claro e escuro; nada do que funcionava quebrou |
| F4 | **interação e acessibilidade** (toque no lote, descrição, foco, movimento reduzido, tema escuro, crédito); **documentação** (Sobre os dados, registro de features, runbook); revisão em duas rodadas | critérios da seção 6 do pedido |
| F5 | **verificação final** (todos os portões, desempenho, sem rede, capturas de depois); orquestrador escreve o relatório, abre o PR rascunho e atualiza o hub | todos os portões verdes ou a pendência escrita |

## 6. Regras para todos os agentes

- Trabalhe só nos seus arquivos. Se precisar de mudança em arquivo de outro dono, descreva no relatório; não edite.
- Português em código, comentários, testes e textos de tela, no estilo do repositório. Cores só por token de `src/tema/tokens.ts`.
- Nenhuma biblioteca nova, nenhum tile, nenhuma chave de API, nenhuma WebView de mapa.
- Não invente dado. Quadra sem lote fica quadra sem lote.
- Quem sobe o Expo usa a própria porta (auditoria 8095, desenho 8096, integração 8097, verificação 8098), derruba só o próprio processo ao terminar e nunca mata processo alheio.
- Jest com `--maxWorkers=3` na suíte inteira (a máquina divide memória com outros agentes); prefira rodar os arquivos de teste da sua área enquanto itera.
- Nas fases paralelas ninguém commita: o orquestrador commita por área. Nas sequenciais, o agente commita só os próprios arquivos, citando os caminhos, com mensagem no estilo do repositório e a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Relatório final curto e factual: o que foi feito, o que ficou de fora, números com o comando que os produziu, problemas de dados e pedidos para outros donos.
