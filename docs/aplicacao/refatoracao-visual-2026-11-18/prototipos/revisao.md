# Revisão dos protótipos (fase 1)

Autocrítica feita olhando as capturas (`capturas/<opção>/390` e `/360`, e as folhas de contato), não o código. Em cada rodada: os três piores problemas de cada opção, o que foi feito, e a conferência da lista anti-"cara de IA" tela por tela. O verificador automático (`ferramentas/capturar.mjs`) roda junto e está resumido no fim.

Quem fez o quê: o desenho (estrutura, linguagem visual, CSS de base e telas de referência) e a revisão são da sessão principal; as telas e gavetas restantes foram montadas por agentes executores a partir de uma especificação escrita, e corrigidas por eles a cada rodada.

## Antes das rodadas: a base de cada opção

Problemas vistos na primeira captura das telas de referência, corrigidos antes de montar o resto.

| Opção | Problema | Correção |
|---|---|---|
| A | No Caderno, o nome do prédio dividia a linha com o preço e quebrava em duas ("Parque / Atlântico") | Nome e preço na primeira linha; bairro e área embaixo; etapa e achado na terceira |
| A | O sinal de aproximado ("~") em Fraunces ficava do tamanho de um número | "~" pequeno, em Plus Jakarta Sans, cinza |
| A | A legenda da barra "conhecido × estimativa" saía quebrada; a referência da régua em ferrugem lia como alerta | Legenda refeita; referência em cinza (ferrugem fica para o que pede atenção) |
| A | O título da ficha de método quebrava ("Sossego à noite: 7,3 de 10") | Título curto e a nota na linha de baixo |
| B | O painel não cabia em 844 px: a terceira fileira de mostradores ficava atrás do botão | O mostrador do bolso perdeu a segunda fileira de números (viraram uma linha); a linha do ruído encurtou |
| B | Os pontos do deslize saíam 2 px para fora da tela (truque de área de toque com margem negativa) | Área de toque sem margem negativa |
| B | "o anúncio diz R$ 95" (IPTU) aparecia em cinza, sem peso de atenção | Ferrugem de texto (`--barro-texto`) |

## Rodada 1

### Opção A · Ficha de campo

| # | Problema (captura) | Correção |
|---|---|---|
| 1 | No topo da ficha, o índice fixo e a leitura rápida mostravam os mesmos cinco nomes, um bloco em cima do outro (`02-ficha`) | O índice foi para depois da leitura rápida: no topo, a leitura rápida é o índice; ao rolar, a barra gruda no alto |
| 2 | A 360 px, o quinto item do índice ficava cortado ("5 Pergunt") (`360/02-ficha`) | Menos espaçamento entre os itens abaixo de 370 px: os cinco cabem |
| 3 | Ruído de detalhe: "anúncio" repetido embaixo das 5 linhas da leitura do link (`15-leitura`); "~" solto e barras grossas no Comparar (`43-comparar`); "sem leitura" em outro desenho no Caderno | Origem só no rótulo do bloco; "~" pequeno; barras de 2 px, cinza para quem não leva vantagem; "Sem leitura" igual em todo lugar |

Também nesta rodada: a rota `ficha` aparecia duas vezes no roteiro; as ações principais das gavetas (descartar, copiar mensagem, copiar link) passaram a ser o botão laranja da gaveta, e o laranja da tela de baixo se apaga enquanto a gaveta está aberta.

**Cobertura.** A conferência contra as 60 features `incluida` do hub mostrou 10 sem lugar. Foram acrescentadas: ruído do aeroporto (linha "Avião" no Conforto), sinais de estrutura (origem da linha "Estrutura"), custo total da compra (gaveta "Para entrar"), renda do setor, bairros vizinhos da segurança, pulso da quadra (com a ficha de método), internet no cômodo (Visita), onde mais procurar (Novo imóvel), prioridade da pergunta que decide (Comparar) e bairros cobertos (Sobre os dados).

**Lista anti-"cara de IA", tela por tela.** Nenhuma grade de cartões (a opção não tem cartão). Ícones: estrela, três pontos, seta e fechar, só como controle. Nenhum parágrafo na primeira camada (o verificador não achou bloco com mais de 22 palavras). Uma ação laranja por tela. Sem selo decorativo: os carimbos dizem o estado de um dado (confirmado, estimativa, não confere, trava, sem leitura). Rótulos de botão com até 3 palavras.

### Opção B · Painel de bolso

| # | Problema (captura) | Correção |
|---|---|---|
| 1 | No Comparar, os dois valores ficavam colados no meio e liam como um número só ("R$ 12.414 R$ 3.808"); ao rolar, sumia o nome de cada lado (`comparar`) | Três colunas: o valor de um imóvel à esquerda, o nome da linha no meio, o valor do outro à direita; barras que crescem do centro; o par de imóveis fica fixo no alto |
| 2 | No Caderno, as linhas estavam desencontradas: estrela na linha de baixo, apoio quebrando em duas, um nome em duas linhas (`caderno`) | Uma estrutura só: nome numa linha, com a estrela; uma linha de apoio; a atenção em terceira linha só quando existe; "Sem leitura" igual ao resto |
| 3 | Na gaveta do calor, um arco de 160 px sozinho no meio: peso sem informação (`painel+calor`) | Arco pequeno ao lado do número; selo e linha de contexto embaixo |

Também nesta rodada:
- a marca não aparecia em nenhuma tela da opção: entrou no primeiro uso e no fim do Caderno;
- respostas que a pessoa ainda não deu vinham marcadas ("Tudo certo" no ponto da visita, o primeiro motivo no descarte): agora nada vem marcado e "Descartar imóvel" fica desativado até escolher;
- a gaveta do mapa mostrava as três imagens de uma vez (o atributo `hidden` perdia para o `display` da classe): a regra foi para a base comum;
- as gavetas do painel abriam sobre a página do imóvel que estivesse na tela, com o texto de outro: o painel volta à página certa;
- "Ver resultados" na espera da busca saiu (a busca termina sozinha).

**Cobertura.** Os mesmos 10 itens da Opção A: linha "Avião" na gaveta do ruído, origem da linha "Estrutura", custo total da compra em "Para entrar", renda do setor, bairros vizinhos, pulso da quadra (uma linha fina embaixo dos mostradores, com a ficha de método), internet no cômodo, onde mais procurar, prioridade da pergunta que decide e bairros cobertos. Para a linha do pulso caber sem rolar, a grade do painel perdeu 2 px de espaço e 4 px de altura por mostrador.

**Lista anti-"cara de IA", tela por tela.** O risco desta opção é a grade de cartões. Conferido: nenhum mostrador tem parágrafo nem botão; cada um tem o seu instrumento (barra das parcelas, escala de idade, arco de nota, escala de decibéis) ou só o número; o do bolso tem outro tamanho. Ícones só na barra de baixo e em controles (estrela, mais, fechar, três pontos). Uma ação laranja por tela. Rótulos com até 3 palavras.

## Rodada 2

### Opção A · Ficha de campo

| # | Problema (captura) | Correção |
|---|---|---|
| 1 | Na primeira tela da ficha cabiam 4 das 5 respostas: a quinta, que traz o achado ("IPTU não confere"), ficava atrás do rodapé (`390/…-ficha`) | Mapa do cabeçalho de 148 para 104 px, centrado no lote, com o crédito da Prefeitura em texto; linhas da leitura rápida 4 px mais justas. As cinco cabem em 844 px |
| 2 | A linha nova do pulso quebrava o rótulo em duas ("PULSO DA / QUADRA") | Rótulo "Pulso"; a linha de baixo diz "média de 6 leituras da quadra" |
| 3 | Em "Descartar", o primeiro motivo ("Preço ou taxas") vinha marcado: um toque no botão gravaria um motivo que a pessoa não escolheu | Nenhum motivo marcado ao abrir; "Descartar imóvel" fica desativado até escolher |

**Lista anti-"cara de IA", de novo.** Conferidas as telas acrescentadas na rodada 1 (pulso, bairros vizinhos, renda do setor, internet no cômodo, onde mais procurar): todas são número e linhas, sem parágrafo de explicação na tela; os textos corridos estão nas gavetas e têm até 2 linhas.

### Opção B · Painel de bolso

| # | Problema (captura) | Correção |
|---|---|---|
| 1 | No Comparar, "Também muda" trazia os dois valores juntos à direita ("6,9 · 8,8"), sem dizer qual é de qual imóvel (`comparar`) | As 5 linhas usam o mesmo desenho de três colunas do duelo, sem barra: tudo no Comparar segue o par fixo do topo |
| 2 | No mostrador "Prédio", dois riscos sem rótulo na escala (15 e 25 anos): ninguém sabe o que são (`painel`) | Riscos fora do mostrador; continuam na régua da gaveta, com os nomes "fachada 15" e "colunas 25" |
| 3 | No Caderno deslizado, a linha cortava o texto no meio da margem ("iluguel", "rmar") e parecia defeito (`caderno-deslize`) | A linha desliza até a borda da tela, como no gesto das plataformas: o texto que sai passa a ser cortado pela borda do aparelho, não pela margem, e os dois botões encostam na borda direita |

Também nesta rodada:
- 15 nomes de linha encurtados para até 3 palavras, depois que o verificador passou a contá-los;
- a 360 px, o topo do Comparar cortava o nome de um imóvel ("Parque Atlânt…") e deixava o "2" de "empates 2" sozinho na linha de baixo: o nome passa a quebrar em duas linhas, o título se divide em duas linhas equilibradas e o elo "Como foi calculada" desce de linha quando não cabe ao lado do saldo;
- no mostrador do ruído ficou um risco só, o da referência de 50 dB(A): é contra ele que o ponto se lê, e a gaveta dá o nome ("referência 50").

**Lista anti-"cara de IA", de novo.** Conferidas as gavetas novas (pulso, bairros vizinhos, renda do setor, internet no cômodo, onde mais procurar): número e linhas, sem parágrafo de explicação; nenhum adjetivo sobre bairro na lista de vizinhos, que está em ordem alfabética.

## Rodada 3: cobertura fina

A rodada saiu da leitura do `cobertura.md` contra a descrição de cada feature no hub e contra o texto do app. Não foi uma rodada de aparência: o que faltava eram linhas, e uma estava errada.

**O dado errado.** Os dois protótipos mostravam um roteiro de visita de 10 pontos. O app tem 12 para o Parque Atlântico: os 10 do dossiê mais 2 checagens de risco que só entram na aba Visita (água na garagem, pelos 6 pedidos de drenagem; internet no cômodo). O roteiro passou a ter os 12, na ordem do app, com as duas checagens no topo. O número ficou um só em todo lugar: 12 no Parque Atlântico, 12 em Ana Elizabeth e 14 no Viena, lidos da aba Visita de cada exemplo (`../auditoria/textos/outros-exemplos/*-visita.txt`).

**O que faltava e entrou**

| Parte da feature (hub) | Opção A | Opção B |
|---|---|---|
| Texto colado, quando o link não abre | já tinha | "Colar o texto" em "Novo imóvel" e em "Anúncio lido" |
| Chave cadastral | já tinha | linha em código na gaveta do prédio |
| Via mais perto, com nome e lado | já tinha | linha na gaveta do ruído |
| Água mapeada mais perto | linha em "Chuva" | já tinha |
| Condomínio por m² contra a mediana | linha no Prédio, no estado "Sem leitura" | linha na gaveta do prédio, no mesmo estado |
| Outra opção de cada essencial e mercado e farmácia numa volta | grupo "A pé, da porta" em "Por perto" | o mesmo grupo |
| Resposta de quem recebe o link e a volta dela | "Decidir a dois": as três respostas e "Abrir resposta" | o mesmo |
| Motivo opcional de "Não bate" | campo que aparece ao marcar "Não bate" | o mesmo |
| Imóvel de aluguel | topo da ficha do Viena (`ficha-aluguel`); antes era só uma linha do Caderno | já tinha o painel do Viena |

**Problemas vistos nas capturas desta rodada**

| Opção | Problema (captura) | Correção |
|---|---|---|
| A | Com o ponto novo, "Internet no cômodo" aparecia duas vezes na visita: na lista e nos instrumentos (`visita-no-imovel`) | O instrumento passou a se chamar "Teste de internet" |
| A e B | "Praça … 3 min" aparecia duas vezes em "Por perto", e o segundo grupo não tinha nome (`ficha+por-perto`, `painel+por-perto`) | O segundo grupo virou "Equipamentos públicos", sem a praça |
| A | No topo da ficha do aluguel, o apoio do Conforto quebrava em duas linhas e empurrava a quinta resposta para trás do rodapé (`ficha-aluguel`) | Apoios encurtados; "estimativa" voltou à cor normal e só o calor fica em ferrugem; endereço abreviado ("Av. Visc. de Albuquerque") |
| B | Com a linha nova, "É este prédio" e "Não é este" ficavam cortados embaixo, e fora da tela a 360 px (`painel+confirmar`) | "Corrigir dados" e "Colar o texto" viraram dois botões pequenos lado a lado; a confirmação do prédio ficou presa no pé da gaveta, fora da rolagem |

**Lista anti-"cara de IA".** O que entrou é linha de fato ou campo, no desenho que cada opção já tinha: nenhum cartão novo, nenhum ícone, nenhum parágrafo. O verificador continuou zerado nas duas.

## Verificador automático

`ferramentas/capturar.mjs` abre cada rota de `window.TELAS` em 390 x 844 e em 360 x 780 e confere, no que está visível: rolagem horizontal, alvo de toque menor que 44 px, botão ou linha de navegação com mais de 3 palavras, mais de um botão laranja por tela, dB(A) sem a palavra "estimativa" por perto, termos proibidos ("inteligente", "ranking", "preço-alvo", adjetivo sobre bairro), emoji, contraste abaixo de AA e bloco de texto com mais de 22 palavras na primeira camada. O relatório fica em `verificacao-a.json` e `verificacao-b.json`.

Resultado da captura final, de 19/11/2026:

| | Opção A | Opção B |
|---|---|---|
| Rotas capturadas | 63, em duas larguras: 126 capturas | 62, em duas larguras: 124 capturas |
| Ocorrências, em todos os tipos | 0 | 0 |
| Elos quebrados (`ferramentas/conferir-elos.mjs`) | 0 | 0 |

`ferramentas/conferir-cobertura.mjs` conferiu o `cobertura.md` contra os dois HTML: 293 rotas e 435 textos citados, nenhum fora do lugar.

Durante a revisão o verificador ficou mais rígido duas vezes: passou a contar o nome das linhas que levam a outro lugar (não só os botões), o que obrigou a encurtar 11 nomes na A e 15 na B ("Documentos antes do sinal" virou "Documentos do sinal"; "O que mudou desde que guardei", "O que mudou"), e pegou o botão desativado em laranja apagado (2,3:1), que virou neutro (4,9:1).

O que ele não vê: se a tela está bonita, se a hierarquia está certa, texto sobre imagem (o mapa), e sobreposição por posicionamento absoluto. Isso foi olhado nas capturas.

## O que não foi verificado

- Celular físico e leitor de tela: nada rodou em aparelho. As capturas são do Chrome instalado na máquina, sem cabeça.
- Fonte ampliada e tema escuro.
- Teste com pessoas: o teste de 5 segundos do comparativo é leitura minha, a conferir.
- As gavetas abertas a partir de outro imóvel mostram os dados do Parque Atlântico (o protótipo tem uma versão de cada gaveta). Na Opção A, a ficha do aluguel tem só o topo.
- Algumas combinações de tela e gaveta funcionam, mas não têm captura própria (3 na A, 8 na B; a lista está em `cobertura.md`).
- As partes de feature que continuam sem desenho estão em `cobertura.md`: a página do portal aberta dentro do app, o zoom do mapa, a tela de quem recebe o link de "Decidir a dois", o condomínio por m² com a mediana e a terceira checagem de risco.
