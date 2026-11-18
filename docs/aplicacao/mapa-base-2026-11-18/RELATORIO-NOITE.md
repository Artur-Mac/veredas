# Relatório da noite: mapa-base (18/11/2026)

Escrito pelo orquestrador ao longo da noite. Estado de cada parte no fim de cada fase; o resumo do topo é o último a ser escrito. O plano de antes está em `PLANO-DA-NOITE.md`; o pedido, em `PROMPT-SESSAO-NOTURNA.md`.

> **EM ANDAMENTO.** Este arquivo é atualizado a cada fase. Enquanto este aviso estiver aqui, a noite não terminou.

## Antes de tudo: o que aconteceu com a pasta do repositório

Às 01:36, durante a preparação, outra sessão trocou a branch da pasta `C:\Users\ssamu\OneDrive\Desktop\repos\veredas` de `feat/mapa-base` para `feat/seguranca-aeroporto-limpeza`. O primeiro commit da noite (plano e contrato de dados) foi feito às 01:44 sem conferir a branch de novo e **caiu na branch da outra sessão** como `fc5ad83`; ela commitou por cima (`7f834d2`).

- Nada foi apagado nem reescrito. A branch e os arquivos da outra sessão não foram tocados depois disso.
- A noite passou para uma cópia de trabalho própria em **`C:\Users\ssamu\vereda-mapa-base`** (fora do OneDrive), na branch `feat/mapa-base`. O commit foi trazido por `cherry-pick` (`2b757a6`).
- **Para decidir:** `feat/seguranca-aeroporto-limpeza` carrega uma cópia de `fc5ad83` (`PLANO-DA-NOITE.md` e `src/dados/recife/mapaBaseContrato.ts`). Se as duas branches forem mescladas, esses dois arquivos podem conflitar ("adicionado dos dois lados"); vale a versão de `feat/mapa-base`. Tirar o commit de lá exige reescrever a branch da outra sessão, o que esta noite não fez.
- Para apagar a cópia de trabalho de manhã: `git worktree remove C:\Users\ssamu\vereda-mapa-base` (a branch continua no repositório e no GitHub).

## F0 Preparação

| Item | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 erros (pasta original e cópia de trabalho) |
| `npx jest` | 83 suítes, 1.980 testes passando, 3 pulados, 0 falhas |
| `npm run lint` | 0 erros, 5 avisos que já existiam |
| Hub | lidos o documento do plano e a tarefa "Mapa-base: ruas, quadras, lotes e bairros em todos os mapas" |

Achados da leitura do código e decisões de desenho: seções 2 e 3 de `PLANO-DA-NOITE.md`.

## F1 Construção

Três agentes em paralelo, cada um nos próprios arquivos (18 minutos de relógio). Os números abaixo foram conferidos pelo orquestrador depois, rodando os comandos de novo.

### Dados (commit `e8012d1`)

- `scripts/dados/construir-mapa-base.mjs` (com `scripts/dados/mapa-base/{fontes,geometria,codificar}.mjs`): baixa os seis recursos do portal para `.cache/dados-recife/mapa-base/` com sha256, lê os Lotes em fluxo, simplifica cada feição uma vez na cidade inteira, recorta por bairro com borda de 300 m, liga lote a quadra pela geometria, marca os lotes de prédios do índice e grava em decímetros como diferenças.
- `src/dados/recife/mapaBase.ts`: leitura pelo sistema de camadas, com checagem rasa em tempo de execução, validação zod completa nos testes e lotes decodificados só quando pedidos.
- Piloto publicado, versão `2341003b4fca7f7f`:

| Arquivo | Bruto | gzip | Conteúdo |
|---|---|---|---|
| `boa-viagem.json` | 538 kB | 198 kB | 646 quadras, 6.109 lotes (1.940 de prédios do índice), 354 ruas, 47 corpos d'água, 17 praças |
| `torre.json` | 211 kB | 80 kB | 279 quadras, 2.337 lotes (316 do índice), 279 ruas, 9 corpos d'água, 26 praças |
| `cidade.json` | 198 kB | 83 kB | 94 divisas, 35 corpos d'água, 366 vias |

- Determinismo: rodei o piloto de novo e os quatro sha256 saíram iguais (`565cc751…`, `4b7e6820…`, `0bd80dd7…` e o módulo gerado `e92112dc…`).
- Cruzamento com o índice `faa40c969275e6b5`: 7.179 dos 7.203 edifícios acharam lote pelo DSQFL; 24 não acharam. 81 partes de lote ficaram sem quadra.
- O agente rodou todos os 94 bairros uma vez para medir: 12,4 s, 644 MB de memória, **7,6 MB gzip no total** (21 MB brutos), o maior com 246 kB (Imbiribeira). O plano estimava 3,8 MB para a cidade: a borda de 300 m repete as feições de divisa nos arquivos dos dois vizinhos e dobra o total. Cada arquivo fica no teto de 250 kB.

### Desenho (commit `a0ab1d2`)

- `src/componentes/mapa/fundoDoMapaCena.ts` (`montarFundoDoMapa`), com geometria, rótulos e estilo em arquivos irmãos, e `FundoDoMapa.tsx` (`FundoDoMapa`, `SeloDoBairro`, `CreditoDaBase`). Ainda não entra em nenhuma tela.
- Níveis: lotes até 800 m de quadro, quadras até 3 km, cidade acima. No máximo 13 caminhos de fundo, mais dois textos por rótulo (o texto e o halo).
- Provas visuais em `telas/noite/f1-desenho/` (claro e escuro, gaveta de 220 m, zoom 3× e Por perto de 1,5 km). Abri três: batem com o modelo aprovado.
- Custo de montar a cena, em node: ~2 ms na gaveta, ~20 ms no Por perto (a busca do ponto do nome do bairro pesa; vai para a revisão).
- Não foi conferido no navegador com o componente de verdade: fica para a F2.

### Régua de capturas (commit `9b21fa0`)

- `scripts/capturar.mjs` e `scripts/medir.mjs` na pasta do mapa-base: 13 superfícies, quatro prédios do índice (Golden Tower `8001-216`, Torre `31950-280`, Casa Forte `2453-108` a ~15 m da divisa, Pina `32948-160`) e os cinco exemplos.
- O app de hoje, medido: a gaveta tem 24 elementos SVG, o Por perto 93, o volume 2.5D 398.
- O agente parou antes de terminar a rodada completa de antes; um segundo agente terminou (ver revisão abaixo).

### Suíte depois da F1

`npx tsc --noEmit`: 0 erros. `npx jest`: 86 suítes, **2.033 testes passando**, 4 pulados, 0 falhas (eram 1.980). `node scripts/dados/publicar-camadas.cjs --conferir`: sem problemas, 251 arquivos.

### Revisão da F1

**Fotos de antes (commit `e4f7d57`):** um segundo agente terminou a rodada. 144 capturas, todas no estado certo (abriu 15, uma por superfície ou mais), sem rolagem horizontal, erro de console ou requisição para fora. A pasta `telas/noite/antes/` tem 7,0 MB. O caso do Pina foi conferido nos brutos: 3 das 17 quadras do quadro não têm lote (40% da área de quadra).

Tempo do toque ao mapa pintado no app de hoje, Chrome com a CPU 4 vezes mais lenta, Golden Tower, 375 px, 7 repetições: **gaveta 283 ms** (pior 287), **Por perto 183 ms** (pior 215). É o tempo da tela inteira abrir, não só do mapa: serve de base para a comparação com o depois.

**Rodada 1, dois revisores independentes** (não escreveram o código e não conhecem o raciocínio de quem escreveu).

Dados: serve de base. Conferiu por conta própria os bytes iguais em duas execuções, o recorte de 300 m sem perda de quadra, água ou praça em Torre e Boa Viagem, o erro de posição de 0,07 m contra o bruto e a ausência de qualquer campo fora da lista branca. Os três piores achados:

1. Rodar o pipeline com uma lista parcial de bairros apagava a publicação dos outros.
2. Não havia como gerar numa pasta à parte, então a regra "a mesma feição sai igual nos dois bairros vizinhos" não tinha prova.
3. O cache dos brutos nunca era atualizado, e o sha256 só era recalculado quando o tamanho mudava.

Também: o módulo gerado dependia da ordem dos bairros na linha de comando; o recorte escolhia feições só por vértice; um comparador de ordenação nunca devolvia empate. O revisor não conferiu a olho o desenho dos dados nem fez amostra independente da marca do índice: isso foi pedido na rodada de correções e de novo na rodada 2.

Desenho: serve de base com ressalvas. Conferiu a transformação afim (erro de 3e-9 px), a distância até a divisa na descrição acessível (568 m no Golden Tower, 39 m no prédio da Torre) e a ausência de rótulos sobrepostos ou de cabeça para baixo. Os três piores achados:

1. No nível de cidade, as avenidas eram desenhadas na cor do chão: invisíveis. O teste só conferia que o caminho não estava vazio.
2. A busca do ponto do nome do bairro varria o quadro inteiro contra a divisa inteira: 774 ms num quadro de 1240 px.
3. Com os arquivos reais, o Por perto custava 42 a 48 ms em node (o autor tinha medido ~20 ms nos recortes), fora do portão de 80 ms com a CPU 4 vezes mais lenta.

Também: o nível de detalhe era decidido pela largura do quadro em metros e não por metros por pixel (em tela larga os lotes sumiam); o tema escuro mal separava rua, quadra e área sem dado; os rótulos só desviavam do pino, não do selo, da régua e dos botões; o componente nunca tinha sido desenhado num navegador de verdade.

**Correções da rodada 1** (commits `980e4d2` dos dados e `413c0a3` do desenho). Todos os achados das duas listas foram tratados; os principais:

- Dados: lista parcial de bairros é recusada se tirar bairro já publicado (`--substituir` libera); `--saida <pasta>` gera à parte, sem publicar; `--atualizar` relê o portal e baixa de novo o que mudou; o módulo gerado não depende da ordem da linha de comando; o recorte mede a distância de aresta. Teste novo: a mesma quadra sai igual, com tolerância de 0,1 m, nos arquivos de Torre e Madalena. Conferências por amostra feitas por quem corrigiu: 200 de 200 lotes na quadra certa; 80 de 80 prédios do índice com o lote marcado; erro máximo de 0,065 m dos lotes contra o bruto; nenhum trecho de rua colado fora de ordem.
- Desenho: nível de detalhe por metros por pixel na tela (lotes até 2,4 m/px, quadras até 8,8 m/px); avenidas visíveis de longe; busca do nome de bairro reescrita (o quadro de 1240 px caiu de 774 ms para 5 a 30 ms); tema escuro com degraus entre sem dado, rua, quadra e lote; rótulos desviam de selo, régua e botões; pontes desenhadas. O componente foi desenhado no Chrome pelo react-native-web com os arquivos reais: fotos `telas/noite/f1-desenho/navegador-*.png`. Abri três (Por perto, gaveta e cidade a 5 km, claro e escuro): estão coerentes com o modelo.
- Achado do orquestrador ao rodar a suíte inteira: o teste de custo do desenho falhava com a máquina carregada, sem o código ter mudado. Agora compara o melhor de 15 medidas com um teto folgado na suíte normal e a mediana com o teto de verdade só com `CUSTO_ESTRITO=1`. Suíte inteira rodada duas vezes seguidas: 0 falhas.

Custo de montar a cena, arquivos reais, em node, mediana (medido pelo orquestrador com `CUSTO_ESTRITO=1`): gaveta de 220 m em 340 px, **2,5 ms**; Por perto de 2,6 km, **10,9 ms**; quadro de 1240 × 600 px, 5 a 30 ms conforme a escala. No Chrome com a CPU 4 vezes mais lenta (medido pelo agente numa rota de prova, 9 repetições): montagem da cena em 4,1 ms na gaveta e 19,7 ms no Por perto; da troca de cena ao quadro pintado, 53 ms na gaveta e 77 ms no Por perto (medianas; essa medida desmonta e remonta o desenho inteiro, então é um teto). A medida que vale para o portão é a do app, na F5.

Decisões tomadas aqui, para o dono do produto confirmar:

1. **Lotes até 2,4 metros por pixel**, que num quadro de celular (340 px) dá ~800 m de largura. O pedido falava em "até ~600 m" e deixava em aberto o intervalo entre 600 m e 1 km. A 800 m um lote de 10 a 12 m de frente ainda tem 4 a 5 px.
2. **A rua do imóvel só ganha rótulo quando cabe** sem cobrir o pino; a descrição para leitor de tela diz a rua sempre que ela é achada.
3. **Pontes desenhadas** (base "Pontes do Recife", 113 polígonos, só a geometria): entraram no contrato e nos arquivos.
4. **Tokens novos de mapa** em `src/tema/tokens.ts` (`mapa-sem-dado`, `mapa-rua`, `mapa-quadra`, `mapa-lote`, `mapa-lote-linha`, `mapa-agua`, `mapa-via-cidade`): no claro repetem as cores da especificação (a água é `#D3DEE8`); no escuro foram escolhidos para as camadas se distinguirem, porque os tokens gerais do escuro têm rua igual a papel e quadra igual a linha.

**Rodada 2:** _a preencher._

## F2 Integração

_A preencher._

## F3 Expansão dos dados

Feita junto com as correções da F1, porque gerar a cidade inteira leva 13 segundos.

| Item | Valor (conferido pelo orquestrador) |
|---|---|
| Publicado | **94 bairros** (todos os da base de Bairros, não só os 72 do índice e seus vizinhos) e `cidade.json`; versão `30c418b7bb665cd3` |
| Tempo e memória | 12,6 s; pico de 651 MB |
| Peso total | **21,0 MB brutos; 7,6 MB gzip** (zlib nível 9) |
| Maiores, gzip | Imbiribeira 248 kB, Afogados 241 kB, Ibura 222 kB, Várzea 201 kB, Boa Viagem 200 kB |
| Teto de 250 kB gzip por bairro | todos abaixo; **Imbiribeira fica a ~2 kB do teto** (249,4 kB pelo `gzip -9` de linha de comando) |
| Determinismo | rodei `--todos` de novo: o resumo de sha256 dos 95 arquivos e do módulo gerado saiu igual |
| `publicar-camadas --conferir` | 343 arquivos, sem problemas |
| Pontes | 113 feições; 47 bairros têm ponte |

Por que publicar os 94: assim a hachura sempre significa "fora do Recife" ou "arquivo que não carregou", e nunca "bairro do Recife que ficou sem arquivo".

**O total é o dobro do estimado no plano (3,8 MB).** A borda de 300 m repete as feições de divisa nos arquivos dos dois vizinhos. Medido numa pasta à parte: com borda de 150 m o total cai para 5,8 MB gzip (24% a menos) e Imbiribeira para 197 kB. O publicado segue com 300 m, como pedido; trocar é uma linha de comando (`--borda` só é aceito com `--saida`, de propósito) e fica para decisão.

Problemas de dados encontrados:

- 24 dos 7.203 prédios do índice não acham lote na base (nem pelo código, nem pelo centro): ficam sem a marca de "prédio que o Vereda conhece". 86 lotes têm pavimentos diferentes entre a base de Lotes e o índice (o mapa usa a base).
- 6.695 lotes vêm com pavimentos zero ou vazio (o toque no lote não vai dizer pavimentos ali). 81 partes de lote não caem em nenhuma quadra.
- 23 trechos de logradouro vêm com o código em número quebrado (`700398.0000000001`); o pipeline arredonda.
- Recursos Hídricos não traz tipo: canal, rio, lago e oceano são deduzidos do nome; 182 corpos d'água sem nome ficam como "outro".
- As divisas da cidade, simplificadas a 2 m, deixam frestas de até 2 m entre bairros vizinhos (um pixel a 5 m por pixel).
- Pontes do Recife tem campos de cadastro (usuário que criou e que editou). O pipeline não os lê e um teste confere que não chegam aos arquivos.

## F4 Interação, acessibilidade e documentação

_A preencher._

## F5 Verificação final

_A preencher._

## Pendências e decisões tomadas por padrão

_A preencher._
