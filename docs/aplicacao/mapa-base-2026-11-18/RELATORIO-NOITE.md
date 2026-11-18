# Relatório da noite: mapa-base (18/11/2026)

Escrito pelo orquestrador ao longo da noite. Estado de cada parte no fim de cada fase; o resumo do topo é o último a ser escrito. O plano de antes está em `PLANO-DA-NOITE.md`; o pedido, em `PROMPT-SESSAO-NOTURNA.md`.

## Resumo

**O que mudou.** Todos os mapas do app passaram a ter um fundo de verdade, feito com as bases abertas da Prefeitura do Recife: quadras com calçada, todos os lotes, ruas com nome (a do imóvel em destaque), o bairro e suas divisas, água, praças e pontes, com o crédito "Base: Prefeitura do Recife (ODbL)". Isso vale para a gaveta "Mapa do lote" (planta e volume 2.5D), o Por perto, a confirmação do prédio, o topo do dossiê sem fotos e o mapa dos exemplos, que desenhava uma cidade inventada. As miniaturas dos cartões ficaram como eram, de propósito.

**Onde está.** Branch `feat/mapa-base`, enviada ao GitHub, com PR rascunho contra `fix/mapas-e-leitura-de-anuncios` (o PR #4). Nada foi mesclado nem enviado para `main`. A cópia de trabalho usada na noite fica em `C:\Users\ssamu\vereda-mapa-base` (ver a primeira seção: outra sessão trocou a branch da pasta original durante a preparação).

**Portões.** `tsc` sem erros; lint sem erro novo; `jest` com 92 suítes e 2.421 testes passando (eram 1.980), 0 falhas; pipeline com os mesmos bytes em execuções repetidas; todos os 94 bairros abaixo de 250 kB gzip; LGPD verde; nenhum dado no pacote JS; 160 capturas sem rolagem horizontal, erro de console ou requisição falha; gaveta com o fundo sem rede, inclusive recarregando a página na versão exportada. Detalhes e comandos na seção F5.

**O que não fechou.**

1. **Desempenho na primeira abertura.** Desenhar o fundo custa 19 ms na gaveta e 25 ms no Por perto com a CPU 4 vezes mais lenta, dentro do teto de 50 e 80 ms. Mas na primeira abertura depois de carregar a página o fundo chega ~140 ms depois do mapa na gaveta e ~800 ms depois no Por perto, por esperar a medida da largura e por baixar e ler os arquivos. O mapa não trava; o fundo entra depois.
2. **Peso.** O total publicado é 7,6 MB gzip (21 MB brutos), o dobro dos 3,8 MB estimados, porque a borda de 300 m repete as feições de divisa nos dois vizinhos. Imbiribeira está a 2 kB do teto. Com borda de 150 m o total cairia 24%.
3. **Celular físico e tema escuro na tela** não foram conferidos (o app é sempre claro; nada rodou em aparelho).
4. Detalhes visuais que restam, decisões para confirmar e problemas dos dados na origem: seção "Pendências e decisões tomadas por padrão".

**Como a noite andou.** 27 agentes em Opus 5.5, no máximo 5 ao mesmo tempo, em workflows por fase. Cada fase teve revisores independentes em duas rodadas, e o orquestrador conferiu os números antes de cada commit. Três vezes a conferência desmentiu um relatório: um teste de custo que só passava com a máquina livre; uma nota dizendo que a bacia do porto não tinha polígono de água (tinha); e o custo do fundo, medido em 35 ms por quem corrigiu e em 127 ms pelo revisor seguinte.

## Entrega

- **PR rascunho:** https://github.com/Artur-Mac/veredas/pull/5, de `feat/mapa-base` contra `fix/mapas-e-leitura-de-anuncios` (o PR #4 continuava aberto às 06:00). Segue o modelo de PR do repositório, com a seção "Hub" preenchida.
- **Hub:** a tarefa "Mapa-base: ruas, quadras, lotes e bairros em todos os mapas" foi movida para "Fazendo" e ganhou um bloco "ATUALIZAÇÃO 18/11/2026" no fim da descrição, com o resumo, o link do PR e as pendências. O texto que já estava lá foi mantido. O pedido falava em comentar na tarefa: o hub só aceita comentário em feature e em impedimento, então o resumo foi para a descrição, como nas outras tarefas do quadro. Nada mais foi gravado no hub (nenhuma feature, veredito, impedimento ou documento).
- **Relatório:** este arquivo. **Capturas:** `telas/noite/antes/` e `telas/noite/depois/`.

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

**Rodada 2, um revisor independente.** Conferiu de novo, por conta própria: o determinismo (gerou duas vezes em pastas à parte, arquivos iguais entre si e iguais aos publicados), a independência da ordem dos bairros, a lista branca em todos os campos dos arquivos (as pontes só têm geometria), os pesos e os testes. **Não abriu nenhuma imagem**: a parte visual ficou sem veredito nesta rodada (o primeiro revisor de dados também tinha pulado essa parte). O orquestrador olhou as fotos da integração e é dali que saíram os defeitos corrigidos na etapa B da F2. Achados novos:

1. Imbiribeira quase no teto de 250 kB: 247.904 bytes pelo zlib nível 9, que é o que o teste aplica (folga de 2.096 bytes), e 249.354 bytes pelo `gzip -9` de linha de comando (folga de 646 bytes). Qualquer quadra a mais numa base nova quebra o teste de peso. Tratado só com um aviso do pipeline a partir de 90% do teto; a folga de verdade depende da decisão sobre a borda (seção F3).
2. Depois de uma falha por arquivo recusado, "Tentar de novo" não refazia a montagem. Corrigido na etapa B da F2.

## F2 Integração

Antes de integrar, o orquestrador escreveu duas peças comuns para as telas não repetirem lógica: `src/componentes/mapa/useFundoDoMapa.ts` (dado o quadro de um mapa, carrega os arquivos em dois tempos e entrega o estado e a cena; commit `80b4ab7`, 12 testes) e `AvisoDoFundoDoMapa.tsx` ("Carregando ruas e quadras…" ou a falha com "Tentar de novo"; commit `a2a938d`).

### Etapa A: quatro frentes em paralelo, arquivos disjuntos

| Superfície | O que mudou | Commit |
|---|---|---|
| Gaveta "Mapa do lote", planta 2D | Fundo com quadras, lotes, ruas com nome, selo do bairro e crédito; lote do imóvel em azul cadastral. Abre em 220 m (eram 80 m) e ganhou o passo de zoom 4 (~55 m no celular). Sem o fundo, desenha como antes, com os vizinhos do índice numa forma só (sem o limite de 60). Rótulo de acessibilidade com rua, bairro e distância até a divisa. Legenda nova: "Prédios que o Vereda conhece". | `ea9f827` |
| Confirmação do prédio (`/predio`) | Fundo no lugar da grade; lotes vizinhos continuam botões de verdade; um só destaque para o prédio. | `45fac9e` |
| Topo do dossiê sem fotos | Mapa parado de 220 m em volta do prédio, com o crédito. Com fotos, nada muda. | mesmo commit |
| Mapa dos exemplos (mapa, caminhos, confirmar lote, topo do exemplo) | A cidade inventada saiu: o chão é o mapa-base em volta da coordenada do exemplo, montado para a janela visível. Os candidatos de "É este o prédio?" são lotes de verdade. Sem o fundo, chão liso, sem reserva inventada. | `9f9b631` |

Decisões desta etapa:

1. **Miniaturas dos cartões (início, Comparar, Visita) continuam só com o contorno do lote.** São ícones de 72 a 84 px de altura; cada cartão baixaria de 80 a 250 kB do bairro só para a miniatura; e todo mapa com o fundo precisa do crédito, que não cabe legível num cartão. O agente montou a cena no tamanho real de cada uma para conferir: não fica legível (fotos e nota em `telas/noite/f2-miniaturas/`).
2. **Em tela larga a gaveta tem pelo menos 160 m de altura de quadro.** Só com os 220 m de largura, a 1280 px sobravam ~100 m de altura e a rua do imóvel saía do quadro.
3. **`PoligonoMini.tsx` foi apagado.** Não era usado por ninguém e dependia dos lotes inventados.
4. **A camada "Alagamento" dos exemplos ficou sem a faixa hachurada.** Sobre a água de verdade, ela pareceria uma inundação mapeada. "Calor" continua ilustrativo e rotulado; "3D e sombra" usa os lotes da base com pavimentos, só de perto.
5. O servidor web compartilhado que o orquestrador subiu para as capturas não serviu: com `CI=1` o Metro não enxerga arquivo criado depois de iniciar. Cada agente usou o próprio servidor e o derrubou.

Suíte depois da etapa A: `tsc` sem erros; `eslint` sem erros; `jest` com 91 suítes, **2.362 testes passando**, 0 falhas.

Defeitos que o orquestrador viu ao abrir as fotos da etapa A (e mandou corrigir na etapa B):

- Junto à divisa (Casa Forte), as ruas do bairro vizinho apareciam hachuradas como "sem dado", embora os lotes de lá estivessem desenhados.
- No Por perto de Casa Forte apareciam PARNAMIRIM, SANTANA e TORRE, mas não o nome do bairro do imóvel; e os pontos de interesse cobriam nomes.
- O rótulo da rua do imóvel passava por baixo de um botão no zoom máximo e saía cortado em tela larga.

### Etapa B: dois agentes em paralelo

**Arquivos comuns do fundo** (commit `53361d0`), corrigindo o que as fotos da etapa A mostraram:

- Junto à divisa, o chão passa a cobrir também os bairros do arquivo da cidade, que o gancho pede sempre que o quadro cruza a divisa. Só vale quando a borda de 300 m dos arquivos carregados cobre o quadro inteiro, para nunca sobrar chão de rua sem quadra. As divisas e os nomes dos vizinhos aparecem ali também no nível de lote.
- O nome do bairro do imóvel tem prioridade no nível de quadras e procura outro lugar quando o melhor está tomado.
- A rua do imóvel fica dentro da janela visível com zoom; nenhum rótulo sai do quadro; o lote do imóvel pequeno conta como obstáculo. A largura do texto foi medida no Chrome com as fontes do app: a estimativa do código já fica acima do texto pintado.
- "Tentar de novo" depois de arquivo recusado refaz leitura e montagem (teste que falha sem a correção). Cena sem dado nenhum vira "sem cobertura".
- Custo depois das correções, em node, mediana: gaveta 2,4 ms; Por perto 10,8 ms; quadro de 1240 px até 27,6 ms.

**Mapa do lote** (commit `fe03420`):

- Por perto: o pino e os pontos de interesse passam como obstáculos; os nomes de bairro deixaram de ficar atrás deles.
- Volume 2.5D: o chão é o mapa-base, na projeção do próprio volume. Volumes só para prédios com altura conhecida, os mais perto primeiro, até 60; o prédio do índice do outro lado da divisa entra pelo lote do fundo (visto em Casa Forte: um prédio de 37 m em Parnamirim). Planta e volume abrem na mesma escala (220 m).
- Toque nos lotes (ver F4).

O que o orquestrador olhou antes de commitar: a folha de contato com os arquivos reais de oito bairros (`telas/noite/f2-bairros/folha-de-contato.png`: lotes dentro das quadras, ruas no vão, água por cima, pontes nas travessias, quadra sem lote só como quadra) e as fotos de Casa Forte na gaveta, no Por perto e no volume: a hachura saiu das ruas de Parnamirim e CASA FORTE aparece no Por perto.

Suíte depois da etapa B: `tsc` sem erros; `eslint` sem erros; `jest` com 91 suítes, **2.379 testes passando**, 0 falhas; `publicar-camadas --conferir` sem problemas.

Ficou de fora nesta etapa (dito pelos agentes): fotos com zoom máximo no Por perto; o percurso por Tab conferido na tela; os nomes de rua e de bairro ficam por baixo dos volumes no 2.5D; a 360 px com zoom máximo a rua do imóvel pode ficar sem rótulo (não há lugar livre que não passe por baixo de um botão).

**O bairro do Recife (o do porto) na folha de contato.** O mapa de 300 m do porto aparece quase todo como chão liso. O agente que montou a folha escreveu que a água entre o cais e o molhe não tinha polígono na base; **isso estava errado** e foi desmentido depois por medição nos brutos: a bacia portuária tem polígono (aparece duas vezes na base, sobreposta) e o arquivo gerado é fiel ao bruto em 6.430 de 6.432 pontos de uma grade de 22 m. O chão liso do quadro é a área do cais, que é terra e não tem quadra nem lote na base. Dentro da divisa do bairro há um único vazio largo de água sem polígono, de ~5.800 m², logo ao norte do fim da bacia.

### Revisão da F2

**Rodada 1, dois revisores independentes.** Como os revisores da F1 tinham entregado relatórios sem abrir imagens, a revisão foi dividida: um revisor só para olhar e outro para código e comportamento.

O revisor visual rodou o roteiro inteiro (160 capturas, todas no estado certo, sem rolagem horizontal nem erro de console) e **abriu 89 imagens**, descrevendo cada uma; 42 tinham algum critério falhando. Veredito: não bloqueia; a gaveta e o Por perto do Golden Tower ficaram muito perto do modelo aprovado; as miniaturas dos cartões continuam iguais ao antes. Os três piores:

1. Na tela `/predio`, o crédito ficava no topo, por cima de números de lote e do nome do bairro vizinho.
2. Nos mapas de exemplo, nomes de bairro e de rua saíam cortados na borda, nos cinco exemplos.
3. Afastando o mapa, o oceano terminava numa borda reta e o resto do Atlântico aparecia hachurado como "sem dado". O revisor também achou que a bacia do porto aparecia como chão; a medição nos brutos mostrou que a bacia tem polígono de água e é desenhada como água (ver a nota sobre o bairro do Recife na etapa B).

Também: nomes de rua sem acento ("R. Frei Jaboatao", "R. Sa e Souza"); um rótulo de rua deitado dentro do Capibaribe a 360 px; os botões cobrindo o pino no Por perto com zoom máximo a 360 px; no volume 2.5D, os volumes tapando nomes de rua e de bairro.

Comparação com o modelo, feita pelo revisor: bate o selo, as quadras com calçada, os lotes, o lote do imóvel sem contorno duplo, a rua do imóvel em destaque, as divisas e a hachura; difere a régua (50 m na gaveta e 200 m no Por perto, contra 25 m e 500 m do modelo: o quadro da gaveta é um pouco mais afastado e o do Por perto mostra menos cidade), os nomes sem acento e o crédito, que o modelo não tinha.

O revisor de código conferiu que nenhum teste antigo foi afrouxado para passar (o único apagado, de geometria inventada, foi trocado por um equivalente); que com a carga do fundo bloqueada a gaveta, a tela do prédio e os exemplos mostram o mapa sem fundo com o aviso, e que "Tentar de novo" traz o fundo sem recarregar a página; que um dossiê já visto reabre com o fundo sem rede; que os valores do rótulo de acessibilidade estão certos; e que as áreas de toque novas têm 44 px ou mais. Os três piores:

1. **Desempenho**: do toque ao mapa pintado, com a CPU 4 vezes mais lenta, a gaveta passou de 283 ms para **396 ms** e o Por perto de 183 ms para **331 ms**. A montagem da cena custa ~10 ms, mas era feita 3 vezes por abertura; o resto do atraso não estava separado.
2. Nos exemplos, com o fundo falhando, o mapa ficava vazio, "É este o prédio?" ficava sem candidatos e o aviso dizia que "o lote continua valendo".
3. O rótulo de acessibilidade da gaveta repetia a descrição em dois nós e falava "R." abreviado.

Também: bairros decodificados guardados em memória para sempre; o lote tocado não é alcançável pelo teclado; o topo do dossiê falha em silêncio.

**Correções da rodada 1**, por quatro agentes em arquivos disjuntos; o orquestrador conferiu a suíte e abriu as fotos do crédito na tela do prédio, de um exemplo e do volume antes de commitar:

- **Desempenho** (commit `fa5f78a`). A cena só é montada com o plano de carga completo, e a chegada de outra camada do app não remonta; as últimas seis cenas ficam guardadas, então reabrir não remonta; no máximo oito bairros ficam decodificados em memória. O roteiro `medir.mjs` passou a medir a primeira e a segunda abertura, com e sem o fundo (uma chave só de medição desliga o fundo): **o custo do fundo é a diferença**. Medido pelo agente, CPU 4 vezes mais lenta, Golden Tower, 375 px, segunda abertura: **35 ms na gaveta** (portão: 50) e **50 ms no Por perto** (portão: 80). Na primeira abertura depois de recarregar a página o fundo chega depois do mapa: +60 ms na gaveta e **+708 ms no Por perto**, quase tudo baixando e lendo os cinco arquivos (quatro bairros e a cidade); o mapa aparece antes, sem o fundo, e não fica travado. A medição final está na F5.
- **Telas do dossiê** (commit `9a25a93`). Na tela do prédio, o crédito foi para o pé, acima da faixa de instrução. No volume 2.5D a ordem passou a ser chão, sombras e volumes, e por último os nomes de rua e de bairro. Em tela estreita o "Recentrar" virou um botão de 44 px com ícone (a coluna de botões cobria o pino no Por perto com zoom máximo a 360 px). A descrição para leitor de tela fica num nó só. O topo do dossiê enquadra o lote inteiro com a rua em volta quando o lote é grande.
- **Mapa dos exemplos** (commit `c5a6b53`). Nomes de rua e de bairro ficam inteiros dentro da janela visível e o pino conta como obstáculo. Sem o fundo, o aviso diz o que continua valendo em cada tela e "É este o prédio?" diz que não dá para escolher o lote agora, com os botões desligados. O lote escolhido usa o azul cadastral e uma linha explica que os tracejados são lotes do cadastro.
- **O mar** (commit `8ecab4d`). A borda reta tinha duas causas: o pipeline cortava o oceano cedo demais (corrigido) e a própria base da Prefeitura acaba a cerca de 6 km da costa, numa reta inclinada (mantido: além dali nada foi acrescentado). Versão nova dos dados: `62be5d5145e04c7f`, +552 bytes gzip no total, três execuções com os mesmos bytes.
- Descrição para leitor de tela com "Rua" e "Avenida" por extenso; rótulo de rua que cairia sobre a água é descartado.

Suíte depois das correções: `tsc` sem erros; `eslint` sem erros; `jest` com 91 suítes, **2.408 testes passando**, 0 falhas; `publicar-camadas --conferir` sem problemas.

**Rodada 2, dois revisores independentes novos.**

O revisor visual rodou as 160 capturas de novo (todas no estado certo, sem rolagem horizontal nem erro), abriu 57 imagens e conferiu por foto os 11 achados da rodada 1: sete corrigidos (crédito da tela do prédio, rótulos dos exemplos, rótulo no rio, botões sobre o pino, confirmar lote, pino sobre nomes, rótulos sobre os volumes), dois em parte (o mar, até onde a base vai; o topo do dossiê, que ganhou as ruas) e dois não (os nomes sem acento, por decisão; a divisa do Pina no Por perto a 1280 px, que fica fora do quadro). Os três piores do que resta, na avaliação dele:

1. A divisa de Boa Viagem aparece como uma reta em ferrugem atravessando o mar. **Mantido:** a divisa oficial do bairro passa pelo mar, e o modelo aprovado mostra a mesma linha.
2. No Por perto de Casa Forte, os marcadores de obra e de ponto cobrem o pino. **Mantido:** já era assim antes desta noite (os marcadores e o pino são do mapa de hoje, "como hoje" no pedido).
3. Afastando o mapa do exemplo ao máximo, depois dos ~6 km de mar que a base tem, o resto do oceano aparece hachurado. **Mantido:** é onde a base da Prefeitura acaba; o oceano dela cobre só da latitude −8,177 à −8,047 (o mar em frente ao porto e a Olinda fica de fora).

Também: números de lote sobrepostos na tela do prédio do Golden Tower (já era assim); a rua do imóvel sem nome em alguns quadros de 360 e 375 px; o topo do dossiê mostrando só o nome do bairro vizinho perto da divisa (corrigido na rodada final).

O revisor de código conferiu que o pipeline gera os mesmos 96 arquivos em duas execuções (iguais aos publicados), que a suíte passa duas vezes seguidas sem variação, que os comandos do runbook funcionam como escritos, que a descrição para leitor de tela fica num nó só e diz "Rua" por extenso, e que nenhum arquivo de camada entra no pacote JS (o único pedaço do mapa-base no pacote é `mapaBaseGerado.ts`, com 15 kB). Os três piores:

1. **O portão de desempenho da gaveta reprovou na medida dele**: 127 ms de custo do fundo na segunda abertura, contra o teto de 50 ms (o agente que corrigiu tinha medido 35 ms). A máquina estava ocupada pelo outro revisor e as repetições variaram muito, mas a causa que sobrava é real: as telas desenhavam o fundo primeiro com uma largura provisória e depois de novo com a largura medida. Corrigido na rodada final; a medida que vale é a da F5, com a máquina livre.
2. Na primeira abertura do Por perto o fundo chega ~720 ms depois do mapa, quase tudo baixando e lendo cinco arquivos. Tratado na rodada final com pré-carga em segundo plano.
3. O limite de memória só vale para os bairros decodificados: o JSON bruto de cada arquivo lido fica para sempre no sistema de camadas (`src/dados/camadas.ts`). **Não corrigido:** é o desenho do sistema de camadas para todas as camadas do app, não só do mapa-base; fica como pendência.

**Correções da rodada 2** (commits `71371d1` e `67cb0a4`):

- **O fundo só entra depois de medir a largura.** O Mapa do lote e a tela do prédio começavam com uma largura provisória e desenhavam o fundo duas vezes. Agora o fundo só é pedido depois do primeiro `onLayout`: uma montagem e um desenho por abertura (contado pelo `medir.mjs`). O mapa em si continua aparecendo no primeiro render.
- **Pré-carga em segundo plano.** O dossiê adianta o arquivo do mapa-base do bairro e o da cidade 1,5 s depois de abrir; o Por perto adianta os dos bairros em volta. Só guarda no aparelho: nada vai para a memória antes de a pessoa abrir o mapa.
- O topo do dossiê não mostra mais nomes de bairro (perto da divisa aparecia só o do vizinho).
- "Tentar de novo" esquece a cena guardada daquela chave antes de reler. A remontagem do Por perto ao reabrir, que o revisor mediu, não se reproduziu com o código final (zero montagens na segunda abertura, em três repetições); entrou um teste que garante uma montagem para duas aberturas iguais e uma nova montagem quando muda qualquer entrada que muda o desenho.
- **Roteiro de capturas seguro.** Um revisor rodou `capturar.mjs --help`; o roteiro não conhecia a opção, rodou tudo contra uma porta fora do ar e gravou fotos de erro dentro da pasta de fotos de antes. Ele apagou na hora e a pasta ficou intacta (conferido no `git status`). Agora `--help` só imprime o uso, parâmetro desconhecido é erro, sem `--fase` nem `--saida` o roteiro recusa e a pasta de antes não é regravada sem `--sobrescrever`.

Tentado e desfeito, por não mudar o resultado nas fotos: fazer a rua do imóvel caber mais vezes em quadro pequeno (tela do prédio e Por perto a 360 e 375 px). Fica na lista de pendências.

Suíte depois das correções finais: `tsc` sem erros; `eslint` sem erros; `jest` com 91 suítes, **2.415 testes passando**, 0 falhas.

Não corrigido de propósito, para decisão do dono do produto:

- **Nomes de rua sem acento.** É como a Prefeitura publica o nome curto do logradouro (e o nome oficial também vem sem acento). Restaurar acentos por dicionário é mexer em dado oficial e pode errar; ficou como está.
- **O lote tocado só é alcançável por toque ou mouse.** O rótulo do mapa diz quantos lotes há no quadro e quantos são de prédio conhecido, mas não há lista de lotes navegável por teclado.

## F3 Expansão dos dados

Feita junto com as correções da F1, porque gerar a cidade inteira leva 13 segundos.

| Item | Valor (conferido pelo orquestrador) |
|---|---|
| Publicado | **94 bairros** (todos os da base de Bairros, não só os 72 do índice e seus vizinhos) e `cidade.json`; versão `30c418b7bb665cd3` nesta fase e `62be5d5145e04c7f` depois da correção do mar (F2) |
| Tempo e memória | 12,6 s; pico de 651 MB |
| Peso total | **21,0 MB brutos; 7,6 MB gzip** (zlib nível 9) |
| Maiores, gzip | Imbiribeira 248 kB, Afogados 241 kB, Ibura 222 kB, Várzea 201 kB, Boa Viagem 200 kB |
| Teto de 250 kB gzip por bairro | todos abaixo; **Imbiribeira fica a 2.096 bytes do teto** pelo zlib nível 9 do teste (247.904 bytes; pelo `gzip -9` de linha de comando são 249.354) |
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

**Documentação** (feita em paralelo com a etapa A da F2; commit `9f02f84`):

- Tela "Sobre os dados": seção nova "O desenho dos mapas", com as bases (lidas do módulo gerado, sem data escrita à mão), a licença ODbL com o crédito e o que o desenho não é (não é foto de satélite; onde falta o lote aparece só a quadra; a forma do lote não é a planta do prédio). Teste novo em `tests/telas-fatia5.test.ts`.
- `docs/aplicacao/FEATURE-REGISTER.md` (em inglês, como o arquivo): linha do mapa-base na seção Platform, com o estado "construído na branch, pendente de revisão humana, teste em celular físico e parecer jurídico sobre a ODbL".
- `docs/aplicacao/RUNBOOK-ATUALIZACAO.md` (em inglês): seção "6. Base map", com quando e como gerar de novo, o que conferir e o que fazer se um bairro passar do teto.

**Interação e acessibilidade** (feitas junto com a etapa B da F2, no Mapa do lote):

- Tocar num lote da planta mostra, abaixo do mapa, "Lote vizinho · N pavimentos" quando a base traz pavimentos, "Lote vizinho" quando não traz e "Lote do imóvel · N pavimentos" no lote do imóvel, com o contorno do lote tocado e a origem do número (base de Lotes da Prefeitura). Tocar de novo ou no ✕ fecha. Arrastar mais de 8 px não conta como toque. O cartão é uma região viva para leitor de tela.
- O rótulo de acessibilidade de cada mapa com o fundo diz a rua do imóvel, o bairro e a distância até a divisa mais próxima (568 m no Golden Tower; 39 m no prédio da Torre). O do Mapa do lote diz também quantos lotes há no quadro e quantos são de prédio conhecido: quem usa leitor de tela não alcança o toque livre no mapa.
- Filtros do Por perto com 44 px; botões de zoom desligados legíveis sobre o mapa.
- Contraste dos rótulos calculado e testado nos dois temas (4,5:1 ou mais, contra o halo).

O que a revisão conferiu ou não disso: ver "Revisão da F2".

## F5 Verificação final

Um agente que não escreveu nada do código rodou todos os portões sozinho na máquina, no commit `67cb0a4`, e tirou as fotos de depois. O portão de desempenho reprovou; depois da correção (commit `2f65361`) as fotos e as medidas foram refeitas com o código final (commit `bac37c1`) e o orquestrador rodou de novo, ele mesmo, os itens marcados com (O).

| Portão (seção 6 do pedido) | Resultado | Situação |
|---|---|---|
| `npx tsc --noEmit` | sem erros (O, código final) | verde |
| `npm run lint` | 0 erros, 5 avisos, os mesmos da partida (O, código final) | verde |
| `npx jest` | **92 suítes, 2.421 testes passando**, 4 pulados, 0 falhas (partida: 83 suítes, 1.980) (O, código final) | verde |
| `publicar-camadas --conferir` | 343 arquivos, sem problemas (O, código final); manifestos iguais depois de subir o Metro | verde |
| Pipeline determinístico | duas execuções em pastas à parte e a pasta publicada: os mesmos 95 arquivos e o mesmo módulo gerado; versão `62be5d5145e04c7f`; resumo dos sha256 `04013bb7b7134812…` | verde |
| Peso por bairro (teto de 250 kB gzip) | maior: Imbiribeira, 247.904 bytes; nenhum acima; total publicado **21,0 MB brutos, 7,6 MB gzip** | verde, com Imbiribeira no limite |
| O pacote JS não cresce com dados | nenhum módulo importa arquivo de camada (protegido por `tests/camadas.test.ts`); na exportação web, "Major Armando de Souza Mello" não aparece em nenhum `.js`, só nos arquivos estáticos de `dados/recife/mapa-base/`. O que entra no pacote: `mapaBaseGerado.ts` (15 kB, novo) e +22 kB no manifesto `camadasGeradas.ts`. O pacote do app exportado tem 3,84 MB | verde |
| LGPD (`tests/lgpd-artefatos.test.ts`) | 346 testes passando, com os 95 arquivos novos | verde |
| Visual: 160 capturas (13 superfícies, 4 prédios, 5 exemplos, 375/360/1280 px, e zoom máximo) | todas no estado certo; rolagem horizontal 0; erros de console 0; requisições que falharam 0; requisições para fora 0. O fundo está presente onde se espera e ausente nas miniaturas dos cartões | verde, com os problemas visuais que restam listados abaixo |
| Elementos SVG do fundo (até ~30, mais os rótulos) | as camadas são no máximo 13 formas. Com os rótulos: gaveta 19 a 42; Por perto 23 a 64. Com zoom máximo o Por perto chega a 210 a 650, quase tudo rótulo | verde nas camadas; sem teto de rótulos no zoom máximo |
| Desempenho com a CPU 4 vezes mais lenta (até 50 ms na gaveta e 80 ms no Por perto) | desenho do fundo: **19 ms e 25 ms** (O). Primeira abertura depois de recarregar a página: +140 ms e +801 ms | verde no desenho; primeira abertura fora do teto (ver abaixo) |
| Sem rede | a gaveta de um dossiê já visto mostra o fundo com a rede cortada, no servidor de desenvolvimento e na **exportação recarregada sem rede** (o service worker serve a casca e os arquivos guardados). O Por perto sem rede só mostra o fundo se os arquivos dos vizinhos e da cidade já tiverem sido baixados (por tê-lo aberto antes, ou pela pré-carga em segundo plano); sem isso aparece como antes, sem o fundo, com o aviso | verde na gaveta; parcial no Por perto |
| Tema escuro | o app não tem tema escuro; conferido só nos testes e nas cenas de prova | não conferido na tela |

### Desempenho

Chrome com a CPU 4 vezes mais lenta, Golden Tower (Boa Viagem), 375 px, máquina sem mais nada rodando. O roteiro `scripts/medir.mjs` abre a gaveta e o Por perto com e sem o fundo (uma chave só de medição desliga o fundo); **o custo do fundo é a diferença** entre as duas medianas, do toque ao quadro pintado.

A verificação final, no commit `67cb0a4`, reprovou este portão: 75 ms na gaveta e 122 ms no Por perto na reabertura. Um último agente perfilou (cerca de 40 ms eram o React e o `react-native-svg` criando dezenas de componentes, três por rótulo; o resto era espera de quadro, porque o fundo só era pedido depois de a largura ser medida) e fez duas mudanças (commit `2f65361`): na web o fundo sai de um serializador como marcação SVG crua num único elemento (o nativo não muda), e o Mapa do lote lembra a última largura medida. As 50 fotos conferidas depois saíram iguais, pixel a pixel, às que os revisores tinham aprovado.

Medida refeita pelo orquestrador no código final (7 repetições, medianas):

| | Antes desta noite | Sem o fundo | Com o fundo | **Custo do fundo** | Portão |
|---|---|---|---|---|---|
| Gaveta, reabertura (arquivos em memória) | — | 250 ms | 269 ms | **19 ms** | 50 ms: verde |
| Por perto, reabertura | — | 157 ms | 183 ms | **25 ms** | 80 ms: verde |
| Gaveta, primeira abertura depois de recarregar a página | 283 ms | 279 ms | 419 ms | **140 ms** | fora |
| Por perto, primeira abertura depois de recarregar a página | 183 ms | 208 ms | 1.009 ms | **801 ms** | fora |

O que os números dizem:

- **Desenhar o fundo custa pouco**: 19 e 25 ms com os dados em memória. É esse o número comparado com o portão, porque o portão fala em desenho e veio de uma bancada de desenho (`scripts/bench.mjs`: 24 ms para 7 mil polígonos numa forma só).
- **A primeira abertura depois de carregar a página não cabe no teto.** O mapa em si aparece quase no tempo de antes (301 ms contra 283 na gaveta; 214 ms contra 183 no Por perto) e o fundo entra depois, sem travar nada. Na gaveta são 140 ms a mais: esperar a medida da largura (o fundo só é pedido depois dela, para não ser desenhado duas vezes), montar a cena (12 ms) e desenhar. No Por perto são 800 ms a mais: quase tudo é baixar, conferir (tamanho e sha256) e ler quatro arquivos de bairro e o da cidade, cerca de 2 MB de JSON, com a CPU lenta; montar leva 30 ms. O roteiro abre o Por perto logo depois de carregar a página, então a pré-carga em segundo plano não tem tempo de ajudar; em uso normal ela ajuda, mas isso não foi medido.
- Depois da primeira abertura de qualquer mapa na sessão, as seguintes já começam com a largura lembrada.
- Elementos do fundo: no máximo 13 formas de camada. Com os rótulos, a gaveta tem de 19 a 42 elementos e o Por perto de 23 a 64. Com zoom máximo o Por perto chega a 210 a 650 elementos, quase tudo rótulo de rua; não há teto no número de rótulos (um teto mudaria o que se vê e ficou de fora).
- Montar a cena, em node, mediana: 2,5 ms na gaveta, 10,9 ms no Por perto, até 28 ms num quadro de 1240 px.

**Leitura honesta do portão:** verde para o desenho; a primeira abertura depois de recarregar fica fora do teto e vai para as pendências, com o caminho provável (estimar a largura pela janela antes do primeiro `onLayout`; deixar os arquivos do Por perto prontos em memória enquanto a aba Entorno está aberta).

### Fotos

`telas/noite/antes/` (144 capturas do app antes desta noite) e `telas/noite/depois/` (as mesmas, com os mesmos nomes, mais as de zoom máximo). Para comparar uma superfície, abra os dois arquivos de mesmo nome. As principais:

| Superfície | Antes | Depois |
|---|---|---|
| Gaveta "Mapa do lote", Golden Tower | `antes/gaveta-planta--golden-tower--375--claro.png` | `depois/gaveta-planta--golden-tower--375--claro.png` |
| Gaveta junto à divisa (Casa Forte) | `antes/gaveta-planta--casa-forte-divisa--375--claro.png` | `depois/gaveta-planta--casa-forte-divisa--375--claro.png` |
| Gaveta com quadra sem lote (Pina) | `antes/gaveta-planta--pina-sem-lote--375--claro.png` | `depois/gaveta-planta--pina-sem-lote--375--claro.png` |
| Volume 2.5D | `antes/gaveta-volume--golden-tower--375--claro.png` | `depois/gaveta-volume--golden-tower--375--claro.png` |
| Por perto | `antes/por-perto--golden-tower--375--claro.png` | `depois/por-perto--golden-tower--375--claro.png` |
| Por perto, Torre | `antes/por-perto--torre--375--claro.png` | `depois/por-perto--torre--375--claro.png` |
| Confirmação do prédio | `antes/predio--casa-forte-divisa--375--claro.png` | `depois/predio--casa-forte-divisa--375--claro.png` |
| Topo do dossiê sem fotos | `antes/miniatura-topo--golden-tower--375--claro.png` | `depois/miniatura-topo--golden-tower--375--claro.png` |
| Mapa do exemplo | `antes/exemplo-mapa--casa-forte--375--claro.png` | `depois/exemplo-mapa--casa-forte--375--claro.png` |
| "É este o prédio?" do exemplo | `antes/exemplo-confirmar-lote--boa-viagem--375--claro.png` | `depois/exemplo-confirmar-lote--boa-viagem--375--claro.png` |
| Tela larga | `antes/gaveta-planta--golden-tower--1280--claro.png` | `depois/gaveta-planta--golden-tower--1280--claro.png` |

As fotos pesam: 7 MB as de antes, 12 MB as de depois e 5 MB as provas, cerca de 25 MB na branch. Se for demais para o repositório, as de tela inteira (`--tela.png`) e as de 1280 px dos exemplos são as primeiras a sair.

Outras provas: `telas/noite/f1-desenho/` (o componente no Chrome, claro e escuro), `telas/noite/f2-bairros/folha-de-contato.png` (oito bairros de tipos diferentes com os arquivos reais) e `telas/noite/f2-miniaturas/` (por que os cartões ficaram sem o fundo).

### Problemas visuais que restam (vistos nas fotos de depois)

- A rua do imóvel fica sem nome no Por perto do Golden Tower e de Casa Forte, e na tela do prédio a 375 px.
- No Por perto, marcadores de obra e de ponto cobrem o pino quando caem em cima dele (Casa Forte; já era assim antes).
- Na tela do prédio do Golden Tower, números de lote sobrepostos (já era assim antes).
- No volume 2.5D, "Brisa SE" encosta no crédito e a etiqueta de altura do próprio lote fica riscada pelas arestas do volume em Casa Forte.
- Nos exemplos, o nome do bairro às vezes é cruzado por um anel de distância ou por uma avenida.
- A divisa de Boa Viagem aparece no mar (é a divisa oficial; o modelo aprovado também a mostra).

## Pendências e decisões tomadas por padrão

### Decisões que são do dono do produto (a noite seguiu o padrão indicado e registrou)

1. **Licença ODbL.** Implementado com o crédito "Base: Prefeitura do Recife (ODbL)" em todo mapa com o fundo e na tela "Sobre os dados", e com a base derivada no repositório (`src/dados/recife/mapa-base/`). Nada foi publicado fora da branch. O parecer jurídico continua pendente no hub.
2. **Escala inicial da gaveta: 220 m**, como proposto. Em tela larga o quadro tem pelo menos 160 m de altura.
3. **Paissandu e Madalena:** o mapa desenha o que a geometria diz; nenhuma regra de vizinhança foi criada.
4. **Nada mudou fora do mapa** (custos, extrator, comparar, visita). A única mudança em arquivo de regra é a lista de arquivos que o dossiê adianta em segundo plano (`src/dados/camadasDasTelas.ts`), que ganhou os do mapa-base.

### Decisões tomadas nesta noite, para confirmar

| Decisão | Por quê | Para desfazer |
|---|---|---|
| Lotes aparecem até 2,4 m por pixel (~800 m num quadro de celular); o pedido dizia "até ~600 m" | o intervalo entre 600 m e 1 km estava em aberto; a 800 m um lote de 10 a 12 m de frente ainda tem 4 a 5 px | `LOTES_ATE_M_POR_PX` em `fundoDoMapaCena.ts` |
| 94 bairros publicados (o pedido: os 72 do índice e os vizinhos de borda) | a hachura passa a significar só "fora do Recife" ou "arquivo que não carregou" | lista de bairros no pipeline |
| Um arquivo a mais, da cidade inteira (`cidade.json`, 83 kB gzip) | divisas e nomes dos vizinhos, chão junto à divisa e o nível de mais de 3 km sem baixar dezenas de arquivos de bairro | — |
| Pontes desenhadas (base "Pontes do Recife", só a geometria) | o pedido mandava avaliar; mostram por onde se atravessa o rio | seção `pontes` do pipeline |
| O arquivo publicado não leva código de lote nem de quadra | o pedido permitia; a marca "prédio que o Vereda conhece" é calculada no pipeline, e o lote do imóvel é achado pela geometria | — |
| Sete tokens novos de mapa em `src/tema/tokens.ts` | no escuro os tokens gerais não separavam rua, quadra e área sem dado; no claro repetem as cores da especificação | — |
| Miniaturas dos cartões sem o fundo | ilegível em 72 a 84 px; custo de download por cartão; crédito não cabe | — |
| A rua do imóvel só ganha rótulo quando cabe sem cobrir o pino | o pedido dizia "sempre" e também "só aparece se couber"; o leitor de tela ouve a rua sempre que ela é achada | — |
| Nomes de rua sem acento, como a Prefeitura publica | restaurar por dicionário é mexer em nome oficial e pode errar | — |
| Camada "Alagamento" dos exemplos sem a faixa hachurada | sobre a água de verdade pareceria inundação mapeada | — |
| `PoligonoMini.tsx` apagado | não era usado e dependia dos lotes inventados | `git show 9f9b631` |
| A divisa do bairro continua desenhada sobre o mar | é a divisa oficial e o modelo aprovado a mostra | — |

### Pendências

0. **Primeira abertura depois de carregar a página.** O fundo aparece ~140 ms depois do mapa na gaveta e ~800 ms depois no Por perto (CPU 4 vezes mais lenta), acima do teto de 50 e 80 ms que o desenho em si cumpre. Caminho provável: estimar a largura do mapa pela janela, para pedir o fundo já no primeiro render; e deixar os arquivos do Por perto lidos em memória enquanto a aba Entorno está aberta, em vez de só guardados no aparelho. Vale medir também num celular de entrada, que é para quem o teto existe.
1. **Borda de 300 m ou de 150 m.** O total publicado é 7,6 MB gzip (21 MB brutos, que no aplicativo nativo vão como arquivos empacotados), o dobro do estimado, e Imbiribeira fica a 2 kB do teto de 250 kB. Com 150 m o total cai 24% e Imbiribeira vai para 197 kB. A carga em dois tempos e a regra do chão junto à divisa supõem a borda de 300 m (constante `BORDA_DO_MAPA_BASE_M`): trocar pede mexer nas duas pontas e rodar a suíte.
2. **Teste em celular físico.** Nada desta noite rodou em aparelho. O que pode diferir no nativo está em `telas/noite/f1-desenho/LEIA.md` (peso da fonte variável no Android, texto que passa do fim do caminho, espaçamento entre letras). O `TextPath` foi conferido só na web e pela leitura do código do `react-native-svg`.
3. **Tema escuro na tela.** O app é sempre claro; o fundo no escuro foi conferido pelos testes e pelas cenas de prova (`telas/noite/f1-desenho/navegador-*.png`), não em nenhuma tela do app.
4. **Rua do imóvel sem nome em quadro pequeno**: na tela do prédio (180 px de altura) e no Por perto a 360 e 375 px, em alguns casos. Falta diagnosticar qual obstáculo barra cada posição; o caminho mais provável na tela do prédio é pôr o crédito e a instrução na mesma faixa.
5. **Lote tocado só por toque ou mouse.** Não há lista de lotes navegável por teclado nem por leitor de tela.
6. **Memória do sistema de camadas.** O JSON bruto de cada arquivo lido fica para sempre em `src/dados/camadas.ts`, para todas as camadas do app. O mapa-base limita o que ele mesmo decodifica (8 bairros, 6 cenas), mas não o bruto.
7. **O oceano da base** cobre uma faixa de ~6 km e só da latitude −8,177 à −8,047. Afastando muito o mapa dos exemplos, ou olhando para o mar em frente ao porto, aparece a hachura de "sem dado".
8. **Dados com defeito na origem**: 24 prédios do índice sem lote na base; 6.695 lotes sem pavimentos; alturas no volume 2.5D vindas de pavimentos altos demais na base de Lotes (na Torre aparecem volumes de 112 m e 189 m; já era assim antes desta noite); números de lote sobrepostos na tela do prédio quando dois prédios do índice dividem o mesmo lote (também já era assim).
9. **Com a gaveta aberta, o leitor de tela ainda alcança o mapa do topo, que fica atrás** (a gaveta não é marcada como modal em `Gavetas.tsx`; comportamento de antes desta noite).
10. **Outra sessão e a branch `feat/seguranca-aeroporto-limpeza`**: ver a primeira seção deste relatório. A tela "Sobre os dados" (`src/app/sobre-os-dados.tsx`), o teste dela (`tests/telas-fatia5.test.ts`) e `docs/aplicacao/FEATURE-REGISTER.md` foram editados nas duas branches (o commit `7f834d2` da outra sessão mexe nos três); a mesclagem pode pedir conciliação manual nesses arquivos.
11. **Hub.** Esta noite só gravou o que o pedido autorizou (atualização da tarefa e mudança de coluna). Propostas, sem gravar: registrar na feature "Mapa do lote em 2D e volume 2.5D" as decisões da tabela acima; criar o impedimento "parecer ODbL antes de publicar o mapa-base"; atualizar o documento do plano com o peso real (7,6 MB) e com as pontes.
