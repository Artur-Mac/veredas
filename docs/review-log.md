# Log de revisão visual

Revisões do motion do pitch. Cada rodada tem os quadros em `motion-references/contact-sheets/<poc>/<rodada>/`: folha de contato dos estados e meios de morph (`contact_sheet.png`), um quadro a cada 0,5 s (`grade_0_5s.png`), tiras de 12 quadros seguidos em torno de cada clique e de cada morph (`tira_*.png`) e o teste de leitura a 360 px (`preview_360px.png`). Todas as imagens foram abertas e olhadas; nenhuma nota vem só de o código ter rodado.

O log anterior, descartado, está em `motion-references/_descartado-ia-anterior/docs/review-log.md`. Ele dava 9,4 e "aprovado para produção" a um POC com dados inventados.

---

## POC-01 · cartão → registro → lote → mapa → dossiê

13,4 s, 1920 × 1080, preview a 30 fps. Arquivos em `motion/poc/poc-01.html`; spec dos morphs em [`ui-state-spec.md`](ui-state-spec.md).

### Rodada 1 (`pass-1`)

Primeiro render completo. A ideia se sustenta: a forma atravessa os cinco estados sem corte, e a foto (S1) e o mapa (S5) ocupam o mesmo lado do quadro. Problemas:

| # | Onde | Problema |
| --- | --- | --- |
| 1 | M1, 1,95 s | **O caminho laranja gira solto no meio do cartão.** Era um segmento de dois pontos interpolando de horizontal para vertical: no meio, uma diagonal sem significado. |
| 2 | M1, 1,95 s | A foto encolhe devagar e deixa uma lasca de 20 px na borda esquerda. |
| 3 | M2, 5,12 s | **O cartão azul fica muito maior que o lote**, enquanto o chão já aparece na escala final: a forma cobre os vizinhos e parece outro objeto. O cartão fica vazio por cerca de 0,3 s. |
| 4 | M2 | Um traço laranja diagonal flutua dentro da forma (mesma causa do item 1). |
| 5 | S3 | A haste do pino é desenhada por cima da fachada do prédio. |
| 6 | S4 | **A legenda das demolições fica direto sobre o mapa**, com leitura difícil. O "4" em Fraunces a 168 px usa o tamanho óptico máximo e o terminal em gota parece outro glifo. |
| 7 | S1, S2, S5 | O cursor cobre o texto que está sendo lido: "R$ 288", "Cadastro oficial", "visita". |
| 8 | S1 | A pílula "ilustrativo" fica solta, longe do preço. |
| 9 | 0 a 1,4 s | Gancho fraco: só o cursor se mexe. |

**Os três piores:** 1 (M1), 3 (M2) e 6 (fim do M3 e S4).

### Rodada 2 (`pass-2`)

| Correção | Resultado |
| --- | --- |
| O caminho virou uma polilinha de 4 pontos: sublinha "R$ 288", desce pela margem e sublinha o IPTU oficial (o colchete declarado × oficial). No M2 ela se fecha num ponto. | Itens 1 e 4 resolvidos. A linha agora diz "isto foi cruzado com isto". |
| Foto com a spring `button` | Lasca resolvida |
| Câmera inicial a 24 px/m: o lote tem quase o tamanho do cartão, e a câmera recua | Chão e forma passam a ter a mesma escala |
| Grupo do caminho desenhado antes do prédio | A fachada esconde a haste |
| Painel branco atrás da legenda do mapa; números Fraunces com `opsz` fixo em 40 | Legível |
| Alvos do cursor no canto do texto | Nada coberto |
| Peso do "R$ 288" interpolado (Plus Jakarta variável, de 600 a 700) | Sem salto de peso |

Ainda ruim: o lote (32 × 40 m, mais alto que largo) não tem a proporção do cartão (mais largo que alto). No M2 a forma afina e alonga, e fica cerca de 0,2 s parada. O colchete se fecha num canto e deixa um "⌐" no quadro. O painel do mapa tem só 16 px de folga à direita.

### Rodada 3 (`pass-3`)

| Correção | Resultado |
| --- | --- |
| Frente do lote voltada para uma rua a oeste: 40 × 32 m (a mesma área de 1.280 m² do protótipo); câmera inicial a 27 px/m | No M2 o cartão vira o lote quase sem mudar de proporção: lê como "o cartão deita" |
| M2 mais cedo (4,78 s) e chão revelado junto | Sem cartão vazio |
| Painel do mapa mais largo e câmera do mapa mais à esquerda | Folga de cerca de 56 px |

Ainda ruim: o pino nascia no canto do colchete e cruzava a forma vazia até o lote. A 360 px, a lista do dossiê (S5) fica ilegível; os números grandes continuam legíveis.

### Rodada 4 (`pass-4`, final)

| Correção | Por quê |
| --- | --- |
| O caminho se fecha no centro do cartão, que é o centro do lote na câmera inicial; o pino nasce ali | O dado localiza o prédio no lugar certo, sem viagem arbitrária |
| **Determinismo, defeito 1:** o render media texto com `getBoundingClientRect()` enquanto `#cena` ainda tinha o zoom do quadro anterior. Agora o transform é zerado antes de medir. | `t = 1,95 s` saía diferente conforme o quadro anterior: o "R$ 288" deslocava frações de pixel |
| **Determinismo, defeito 2:** a foto mudava de largura no recolhimento e sofria o zoom de tela. O Chromium baixa a qualidade de uma imagem redimensionada por um tempo de relógio. Agora a foto tem sempre 500 × 624 px, recolhe por `clip-path`, e o zoom de tela só começa depois que ela sai. | `t = 0` saía diferente depois de visitar outros tempos |
| **Projeção:** pontos do chão perto da câmera passavam do plano focal e invertiam o polígono do chão. O fator de perspectiva agora é limitado e a distância focal subiu para 9000. | No S3, ruas e quadras apareciam com as cores trocadas (achado num recorte a 100%) |
| Painel também atrás do rótulo do lote | As linhas tracejadas dos vizinhos cruzavam o texto |
| "Lote confirmado" trocado por "Lote do prédio" | No protótipo quem confirma o lote é a pessoa ("É este prédio"); o POC pula esse passo e não pode dizer que alguém confirmou |

`node motion/render.mjs determinismo` passa: seis tempos renderizados em duas ordens, com hashes MD5 iguais.

Teste do preview e do modo ao vivo no navegador do app (`?live&debug`), fora do render headless:

| Achado | Correção |
| --- | --- |
| O palco de 1920 px escalado para a janela ficava fora do centro | Encaixe com `transform-origin: 0 0` e deslocamento calculado |
| No preview, "R$ 288" se sobrepunha a "período não informado": a medida do texto incluía a escala da janela | A largura medida é dividida pela escala real do palco (no render ela é 1, então o vídeo não muda) |
| Um toque no clicker antes do primeiro HOLD não fazia nada | O avanço sempre vai ao próximo HOLD, mesmo no meio de uma entrada. Conferido: espaço leva ao registro (HOLD em 4,1 s), espaço de novo leva ao lote (7,2 s) |

Render de 60 fps: o primeiro, com `--sub 4` e obturador cheio, foi conferido extraindo quadros do MP4. Em 1,80 s o "R$ 288" (cerca de 67 px por quadro) aparecia como quatro cópias nítidas e separadas, ilegível, em vez de um borrão. O `render.mjs` ganhou `--obturador` (padrão 0,5, ou seja, 180°), e o render final usa 8 subquadros: os subquadros ficam a cerca de 4 px um do outro. Conferido no mesmo quadro: o valor em movimento vira um borrão contínuo.

### Notas (1 a 10, critérios da REF-08)

| Critério | Rodada 1 | Rodada 4 | Comentário |
| --- | --- | --- | --- |
| Gancho (0 a 2 s) | 5 | 6 | O cartão fica parado 1,4 s até o clique. No pitch a cena 01 vem antes; num teaser isolado precisa de gancho próprio. |
| Leitura a 360 px | 6 | 7 | Números-chave legíveis; o texto de apoio do dossiê, não |
| Qualidade do movimento | 5 | 8 | Springs sem salto; morphs contínuos nas tiras de 30 fps |
| Variedade (novidade a cada 2 a 4 s) | 7 | 8 | Clique, registro, colchete, lote, prédio, raio, painel, dossiê |
| Composição | 6 | 7,5 | S1 e S2 deixam margem larga; S5 é denso |
| Fidelidade à marca do `index.html` | 8 | 8,5 | Tokens, fontes e componentes do protótipo; mapa em esquema |
| Honestidade dos dados | 7 | 9 | Fonte e data na tela; ilustrativos ditos |
| Som | sem som | 6 | Sons sintetizados e alinhados por número. Ninguém ouviu: quem escreveu este log não escuta áudio. Precisa de revisão de ouvido humano. |

Média da rodada 4: 7,5. Não está pronto para produção, e não precisava estar: é a prova de que a linguagem funciona.

### Abertos

1. Gancho dos primeiros 1,4 s, se o POC virar teaser.
2. A foto é de banco (Unsplash, a mesma do protótipo). Para o pitch, usar uma foto autorizada de anúncio ou uma ilustração.
3. Quadras em esquema. Para Boa Viagem real, desenhar ruas a partir do OpenStreetMap, com atribuição.
4. O "4" em Fraunces mantém o terminal de desenho da fonte; é da marca, mas vale ver numa tela grande.
5. 360 px: se houver versão para celular, o dossiê precisa de layout próprio, com menos linhas.
6. Versão de 60 fps (`--sub 8 --obturador 0.5`): conferir num monitor de 60 Hz.
7. Sons: ouvir, ajustar ganhos e trocar por uma trilha licenciada quando houver.

---

## CENA-01 · abertura: o apartamento perfeito (três variantes)

18 s, 1920 × 1080, 30 fps. Arquivo único `motion/poc/cena01.html`; a variante vem de `?v=1`, `?v=2` ou `?v=3`. As três compartilham a sala e a sedução (0 a 11 s) e se separam no "Mas". Quadros em `motion-references/contact-sheets/cena01/v<N>/pass-<N>/` e as três lado a lado em `cena01/comparativo/pass-5/comparativo.png`.

| Variante | Quebra | Clímax | De onde nasce o número |
| --- | --- | --- | --- |
| V1 · janela | o vento para, o sol "nascente" se põe atrás das torres, a cor sai | a câmera entra pela janela; a sala vira noite em PB; o caixilho abre num vão só | sobe de trás do peitoril, no lugar do sol, na mesma cor laranja |
| V2 · linha do anúncio | a sala inclina enquanto a linha do anúncio fica nivelada | a linha varre a sala de baixo para cima e deixa um desenho técnico em PB | sobe de trás da linha, que vira a régua de cinco anos |
| V3 · geometria | a lente abre e a sala estica ("os 75 m² eram lente") | as paredes caem para fora e a sala vira planta escura | se levanta do chão da planta em 3D, como as paredes que caíram |

### Rodada 1

| Variante | Problema |
| --- | --- |
| Todas | Sala parecia um corredor fundo; janela pequena; sol fraco; luz no chão quase invisível; teto vazio ocupando um terço do quadro; móveis miúdos |
| V1 | "em cinco anos" fora do quadro, abaixo do peitoril; contorno branco das torres disputava com o número |
| V2 | Número sem escala, ocupando cerca de dois terços da largura |
| V3 | Número pequeno e distante; as torres de fora, vistas de cima, viravam raios no topo do quadro |

### Rodada 2

Correções: lente de 950 para 1180 px e câmera mais perto, com a janela passando de 418 para cerca de 580 px de largura. Também: sol mais perto e maior, com halo; piso mais quente, para a luz aparecer; feixes de luz da janela até o chão; sanca e spots no teto; vento mais visível; torres em silhueta escura no PB da V1; vista de fora apagando antes de a câmera subir na V3.

Ainda ruim: móveis quadrados demais (o sofá cortado na borda lia como bloco infantil); vento como riscos soltos; "75 m²" branco sumindo sobre a luz; feixes escondidos atrás dos móveis. Na V1, "em cinco anos" atrás da barra da moldura. Na V2, o desenho da sala cruzava as letras e havia um "75 m²" fantasma. Na V3, a extrusão aparecia em degraus.

### Rodada 3

Correções: móveis mais baixos e mais ao fundo, mesa com tampo e base, quadro com passe-partout e um sol abstrato; "75 m²" em ferrugem; feixes por cima dos móveis. V1: câmera final a 3,6 m da janela e "em cinco anos" abaixo da moldura. V2: véu branco a 74% e PB sem a cota. V3: extrusão de 40 camadas com tom contínuo.

Ainda ruim: vento ainda riscado; a cota lateral virava uma linha solta no canto; cerca de 1 s parado antes do número nas três; na V3, 1,5 s de planta parada.

### Rodada 4

Correções: vento em leque, da janela para o meio da sala; cota numa linha só, de parede a parede, à frente do tapete; aproximação lenta da câmera antes do número (V1 e V2); na V3, o movimento até o número começa 1 s antes.

Ainda ruim: na V2, o rótulo "O ANÚNCIO DIZ" e a fileira de atributos caíam sobre o sofá; a cota criava uma segunda linha; as fitas de vento subiam até o topo do quadro.

### Rodada 5 (final)

Correções: faixa do anúncio da V2 no chão claro, sem cota e sem o "75 m²" pintado (o chip já diz); vento mais curto. `node motion/render.mjs determinismo --poc cena01 --v N` passa nas três variantes.

### Notas da rodada 5

| Critério | V1 | V2 | V3 |
| --- | --- | --- | --- |
| Gancho (0 a 2 s) | 6,5 | 6,5 | 6,5 |
| Clareza da história (encantamento, sedução, quebra, choque) | 8,5 | 8 | 7,5 |
| Impacto do número | 8,5 | 8 | 8,5 |
| Transição nascida da cena, sem corte | 9 | 9 | 8,5 |
| Leitura a 360 px (número e atributos) | 8 | 7,5 | 7,5 |
| Sofisticação, sem cara de desenho infantil | 7,5 | 7,5 | 7 |

O gancho é igual nas três, porque a abertura é a mesma: a sala já está na tela em t = 0 e a câmera avança. Para um teaser isolado, os primeiros 2 s precisam de mais acontecimento. No pitch ao vivo, o primeiro HOLD (3,4 s) segura a sala enquanto o apresentador diz "Imagine...".

### Decisão

18/10/2026: o usuário escolheu a V1 (janela). Daqui em diante, revisões da cena 01 valem só para a V1.

### Abertos

1. **R$ 125 mil:** usado a pedido do usuário em 17/10/2026, mas a memória de cálculo ainda não está no repositório. Confirmar antes do pitch.
2. A vista pela janela é um esquema (mar, torres, sol), não o skyline real do Recife.
3. O imóvel da cena é hipotético ("Imagine"); nenhum dado real de Boa Viagem aparece.
4. Os sons foram sintetizados e não foram ouvidos por ninguém.
5. 60 fps: comando pronto (`--fps 60 --sub 8 --obturador 0.5`), ainda não renderizado para a cena 01.
6. Os móveis ainda são caixas simples; se precisar de mais requinte, a próxima camada é detalhe (almofadas, pés finos, uma planta), não mais cor.

---

## CENA-02 · o cliente do portal (duas versões)

Arquivo `motion/poc/cena02.html`. `?v=1` é a versão ousada (14,4 s) e `?v=2` a sóbria (12,0 s). As duas usam o mesmo anúncio genérico (sem marca, sem portal real) e as mesmas quatro revelações. A foto do anúncio é a sala da cena 01, para a história continuar. Quadros em `motion-references/contact-sheets/cena02/v<N>/pass-<N>/` e as duas lado a lado em `cena02/comparativo/pass-final/comparativo.png`.

| | V1 · ousada: a vitrine | V2 · sóbria: o sistema e a ficha |
| --- | --- | --- |
| Parte A | A câmera abre de dentro do feed do portal para o sistema inteiro: imobiliárias e portal presos num laço laranja grosso (anúncios indo, cliques e leads voltando, "R$ por anúncio" e "R$ por clique"). "Você" fica longe, do outro lado de um vidro, ligado ao portal por um fio fino tracejado de uma via só | Três polos num eixo: imobiliária e corretor ⇄ portal, com setas cheias nos dois sentidos; uma divisória tracejada; você no fim de uma linha fina, só recebendo "o anúncio pronto" |
| Passagem | A câmera atravessa o vidro até o anúncio | O nó do portal cresce e vira o anúncio |
| Parte B | Uma cortina recolhe a versão publicada e a câmera passeia por cada maquiagem, com um selo escuro em cada uma | O anúncio parado à esquerda; à direita, uma lista numerada que entra uma linha por vez, com o número correspondente marcado no anúncio |
| Fecho | A versão editada volta a cobrir o anúncio, a câmera recua e aparece "Você só vê a versão editada." | "Quatro informações que o anúncio não mostra." |

As quatro revelações (iguais nas duas):

| # | Maquiagem | Como aparece |
| --- | --- | --- |
| 1 | Lente grande angular | A foto passa de lente 340 para 1000 (dolly zoom: a parede do fundo fica do mesmo tamanho, os móveis chegam perto). Luz e cor não mudam (regra da REF-10) |
| 2 | Vaga somada à área | A caixa de área mostra a planta; a vaga hachurada sai e o número vai de 75 m² para 62,5 m² |
| 3 | Poente vendido como nascente | O selo "Nascente" vira "Poente" e a bússola gira a fachada do leste para o oeste, com o sol do lado da tarde |
| 4 | Rua que alaga | O mapa do anúncio ganha a camada escondida: a água (hachura azul) ocupa a rua do pino; na V1 entra também a chuva |

### Rodada 1

| Versão | Problema |
| --- | --- |
| V1 | Sistema pequeno no quadro (escala 0,25); rótulos ilegíveis; a lente quase não mudava a foto; a câmera de cada revelação cortava o anúncio |
| V2 | Diagrama pequeno e alto demais; a passagem do portal para o anúncio deixava cerca de 0,4 s de caixa branca vazia; o anúncio ocupava pouco espaço |

### Rodada 2

Correções: na V1, sistema mais compacto e mais perto (escala 0,32), laço e cartões mais grossos, cursor desenhado nos cliques e lente mais forte; bússola nova no anúncio. Na V2, polos maiores e mais baixos, passagem com a spring `button` e anúncio a 66%.

Ainda ruim: na V1, o título cobria "anúncios →", "imobiliárias e corretores" encostava na borda e as cartas de trás mostravam ícones cortados; o selo do sol cobria a bússola. Na V2, o "Não você." ficava longe do nó "Você".

### Rodada 3

Correções: na V1, câmera do sistema mais baixa e mais aberta (escala 0,29, centro em −2100, −260), só a carta da frente com texto, "não você." embaixo de "você", selo do sol sobre a janela da foto e câmera da revelação 3 mostrando o anúncio inteiro.

### Rodada 4 e 5

Correções: frase de fecho na V1 ("Você só vê a versão editada."), primeiro no alto, onde batia no portal, e depois embaixo à esquerda.

**Determinismo**, três defeitos achados e corrigidos:

1. A câmera da V1 era `transform: scale` no mundo inteiro, e o Chromium reaproveitava rasterização de quadros anteriores. Virou `zoom` (layout), que refaz o texto no tamanho certo a cada quadro.
2. O selo do sol virava com `scaleY`. Virou recorte (`clip-path`).
3. Os nós da V2 subiam com `translateY` e os números das marcas cresciam com `scale`. Os nós passaram a usar `top`, e as marcas foram para um SVG redesenhado a cada quadro.

Depois disso sobra ruído de rasterização parcial: até 21 pixels com diferença de 1 nível em 255, invisível. O teste em `render.mjs determinismo` passou a aceitar esse ruído (no máximo 0,01% dos pixels e diferença até 24) e a reprovar o resto. As duas versões passam.

### Notas da rodada final

| Critério | V1 ousada | V2 sóbria |
| --- | --- | --- |
| Mensagem central clara | 8,5 | 9 |
| Assimetria portal × você | 9 | 8,5 |
| Clareza das quatro maquiagens | 8 | 9 |
| Sofisticação, sem cara de dashboard | 8 | 7,5 |
| Memorável | 8,5 | 7 |
| Ponte para a VEREDA | 8 | 8,5 |

### Decisão e ajuste (18/10/2026)

O usuário escolheu a **V2 (sóbria)** e pediu para tirar o "Não você." e pôr um X grande no card da pessoa, com "você" embaixo. Rodada 5 da V2:

- O "Não você." saiu. Um X em ferrugem `#B94E36`, de dois traços que se desenham em sequência (spring `button`, segundo traço 0,14 s depois), cobre o card a partir de 2,4 s.
- O card ficou só com o ícone de pessoa (72 px) e "Você" foi para baixo do card, fora do X, para continuar legível.
- Achado na tira do morph: entre 4,38 s e 4,48 s o nó do portal sumia antes de a forma do morph aparecer, deixando um quadro sem portal. Agora a caixa do portal fica até o morph começar; só o ícone e o texto saem antes.
- O determinismo passa. Master a 60 fps em `out/cena02-v2-60fps-com-som.mp4`.

### Abertos

1. Valores ilustrativos: 75 m² e 62,5 m² (vaga de 12,5 m²) são exemplo, não dado de um imóvel. O rodapé diz isso nas duas versões.
2. O portal é genérico e não lembra nenhuma marca; conferir com a equipe se algum elemento lembra um portal real.
3. Na V1, a câmera de revelação passeia rápido (1,8 s por maquiagem). No pitch ao vivo há HOLD antes de cada uma.
4. Os sons foram sintetizados e não foram ouvidos.

---

## CENAS 06 e 07 · produto (18/10/2026)

Construídas a partir do storyboard revisado (cenas 2 a 12). Fluxo: um diretor técnico por cena, com rodadas próprias de QA; depois um crítico independente que renderizou a própria rodada (`critica`) e olhou os quadros; depois correção e QA final. Por último, revisei os quadros finais. O relatório completo de cada etapa está em `motion-references/build-cenas-6-7.json`.

### Cena 06 · `cena06.html` (29.7 s)

| Rodada | Problemas | Correções |
| --- | --- | --- |
| pass-1 | As marcas do cartão de leitura (os ✓, os tracejados sob os campos e o fio do rodapé) ficavam na tela depois que o cartão virava lote, até o último quadro. O motivo: um filho com visibility: visible aparece mesmo com o pai escondido. As linhas das etapas também sumiam num corte seco em 8,5 s. / O rótulo "polígono e altura ilustrativos" ficava cortado pelo painel no B3 e encostado nele no B4 a B6. A linha de fonte passava da borda do painel no B4 e no B5. / A borda suave da máscara do chão aparecia atrás do painel como uma vinheta. A porta do prédio estava escura demais e a soleira, comprida demais. | vis() e as marcas internas passaram a usar visibility: inherit. As etapas e o fio do rodapé saem com a mesma opacidade do conteúdo do cartão. / O rótulo ilustrativo foi para baixo do canto da frente do lote. As fontes do B4 foram para duas linhas. / O chão passou a se revelar por inteiro. A porta ficou em #625C51, com a soleira do tamanho dela. |
| pass-2 | Em cerca de 4,0 s o painel da simulação abria por cima da borda direita do cartão, que ainda deslizava. / A fonte do B5 passava da borda do painel. / Havia tempo morto nas trocas: cartão branco e vazio no morph, painel vazio por cerca de 0,5 s, e só o colchete por cerca de 0,3 s nas trocas B4→B5 e B5→B6. | O painel da simulação passou a abrir depois que o cartão liberou a área. / A fonte do B5 foi para duas linhas. / A linha do tempo ficou mais justa, e a mediana virou número em Fraunces 76 px. |
| pass-3 | A 360 px o cartão do B1 ficava pequeno demais. / O morph cartão → lote tinha de 0,3 a 0,4 s de forma vazia. / Na saída, a vinheta do chão encolhendo durava cerca de 1,3 s. | O cartão foi mantido em 2x (anotado nas pendências). / Aceito como morph. / A máscara de saída passou a usar a mola da câmera. |
| pass-4 | A câmera final ficava 0,9 px fora de CAM.lote. | DUR passou a 27,9 s, com resíduo de 0,17 px. |
| pass-5 | — | Verificação da versão que foi para a crítica. Mais tarde a crítica independente apontou os problemas tratados em pass-final-1. |
| pass-final-1 | Os recortes dos painéis deixavam uma fresta branca na tela por cerca de 0,1 s no fim de cada fechamento: a SIM em 8,85–8,9 s, o T3 em 11,8 s e o painel do cruzamento em 27,4 s. A causa é a cauda da spring. / A subida da porta até CAM.lote era rápida demais: o zoom de 26 para 9,5 px/m acontecia quase todo entre 28,0 e 28,4 s e parecia um puxão. / Em 12,0 s o painel do cruzamento mostrava só o cabeçalho por cerca de 0,3 s antes das linhas do B4. Antes do QA eu também tinha visto e corrigido três coisas: a legenda do contorno passava da borda do painel; os vizinhos tracejados apareciam no papel, fora do círculo do chão; e o recolhimento do chão deixava um disco cinza parado por cerca de 0,8 s. | O recorte agora termina pela cauda da spring: fecha em sp/0,9 (cerca de 0,22 s) e abre em sp/0,97. O painel some quando sobram menos de 3 px. / CAM.porta passou para s 22 e pitch 1,2, com a porta no centro. A subida usa {k 34, d 11,66}, de zeta 1. DUR passou a 29,7 s e o resíduo final ficou abaixo de 0,12 px. / As linhas do B4 foram para 11,86 s, o colchete para 12,06 s e a segunda linha para 12,2 s. A legenda virou "tracejado: antes da correção". Os vizinhos só entram depois que o círculo do chão passa de 100 m. O chão se recolhe com {k 90, d 19}, em cerca de 0,5 s. |
| pass-final-2 | Nas trocas B4→B5 (19,1 s) e B5→B6 (20,7 s), o corpo do painel fica vazio por cerca de 0,04 a 0,1 s, só com o cabeçalho e o colchete. / Na subida, o chão se recolhe para dentro do lote como um disco por cerca de 0,4 s (28,0–28,4 s). / No corte para a cena 7, o primeiro quadro dela tem 11 faixas de andar (prisma com LOTE.pavimentos), e este FIM não tem nenhuma. | Os três problemas foram aceitos, não corrigidos. O primeiro respeita "sai antes, entra depois" e dura de 1 a 3 quadros. O segundo é o inverso exato da revelação da cena 7. O terceiro depende da cena 7, que não é minha (está nas pendências). Olhei a folha de contato, a grade de 0,5 s, as quatro tiras (abre, morph-lote, troca-itbi, porta) e a prévia de 360 px, além de B2 e FIM em tamanho cheio. Não há fresta, caixa vazia longa, texto sobreposto nem corte seco. O cursor não cobre o que se lê, e a câmera assenta em cada HOLD. O FIM é igual ao S0 da cena 7: lote, vizinhos tracejados, prédio, pino com haste sobre o teto e o mesmo rodapé no mesmo lugar, sem a marca. A única diferença são as faixas de andar. |

**Crítica independente** (antes da correção): clareza 6.5, movimento 6, marca 8, leitura a 360 px 5.5, honestidade 7, produto crível 7. Problemas altos: O prédio parece transparente, como raio X.

**Determinismo final:** 20 tempos, de 0,000 a 29,667 s. 17 deram \"igual\" e 3 deram \"ruído\", que a ferramenta aceita: 3,800 s (110 px, diferença máx. 2), 4,360 s (34 px, máx. 1) e 8,550 s (34 px, máx. 1). Saída: \"Determinismo confirmado: o quadro só depende de t.\" O verificar-pitch diz \"Texto travado intacto. 69 citações no storyboard, 69 literais.\"

**Honestidade na tela:**
- Prédio: desenhado com prisma() da cena 7, só com as faces visíveis e sem nenhuma faixa de andar. O número "12 pavimentos" (LOTE.pavimentos, que está em NAO_USAR_COMO_REAL) não dá mais para contar. A altura continua ilustrativa, com o rótulo "polígono e altura ilustrativos" em 26 px.
- Simulação: o selo "simulação / recurso em desenvolvimento · sala ilustrativa" entra junto com a abertura do painel, então a sala nunca aparece sem rótulo. A pílula "grande angular, como em anúncios" não diz mais "como no anúncio" e troca para "lente corrigida · simulação" no meio do dolly. O contorno tracejado tem a legenda "tracejado: antes da correção", e a nota diz "Só a geometria muda: a luz e as cores ficam iguais."
- T3: sem "Pular por agora", que no index.html só existe em aluguel. "Não é este (ver vizinho)" ocupa os 612 px, como no protótipo para venda. Sem ESIG e sem chave DSQFL. A ficha traz "44 unidades · construído em 2010 · padrão Superior" com "IPTU 2026 · Prefeitura do Recife · consultado em 15/10/2026".
- Área: o rótulo virou "Área no IPTU 2026", sem "privativa", por causa da divergência entre o protótipo e o dados.js. A frase virou "Diferença de 0,19 m²", sem o "Confere:" de veredito. O tracejado que fica contínuo faz esse papel, sem selo nem cor de veredito.
- IPTU: "R$ 288 · período não informado" continua tracejado e vira a pergunta real "O IPTU de R$ 288 é mensal?". O valor oficial é R$ 3.934 a R$ 4.457 por ano (R$ 328 a R$ 371 por mês), com a fonte.
- ITBI: 56 avaliações desde 2015 e mediana de R$ 4.339/m², sublinhada em azul cadastral (registro oficial), não em laranja. A nota "Avaliação fiscal não é preço de venda." tem 30 px, em tinta. A fonte é ITBI 2015–2026, consultado em 15/10/2026. Nenhuma tela traz "escritura", "preço negociado" ou "52 transmissões".
- Título do cartão: o endereço, nunca "Edifício Costa Atlântica". Sem o aluguel de R$ 4.500. Os campos declarados ficam tracejados, com "declarado pelo anunciante · lido em 15/10/2026".
- A porta é ilustrativa: fica no centro da fachada sul e é coberta pelo rótulo e pelos rodapés. Na saída ela fecha, e o último quadro não tem nada que a cena 7 não tenha.
- Rodapés: "Protótipo VEREDA · Rua João Cardoso Aires, 327, Boa Viagem · anúncio lido, IPTU 2026 e ITBI 2015–2026 consultados em 15/10/2026 · sala, polígono, altura e quadras ilustrativos". Na saída entra o da cena 7: "... · polígono do lote, altura do prédio e quadras ilustrativos".

**Pendências:**
- Cena 7 (não é minha): o S0 dela desenha 11 faixas de andar com prisma(..., LOTE.pavimentos). Esta cena tirou as faixas por honestidade, então elas aparecem no corte. Basta a cena 7 passar 0 no último argumento de prisma para casar. Fora isso, o FIM é igual ao S0 dela: CAM.lote com resíduo menor que 0,12 px, lote, vizinhos tracejados, pino com haste sobre o teto e rodapé idêntico.
- A cena 5 ainda não existe. A entrada agora é a linha laranja em y = 540, de x = 525,75 a 1394,25 (868 px, a largura do cartão em 2,25x), com "Edifício" em Plus Jakarta 700 34 px centrado em y ≈ 474. "Edifício" sai entre 0,12 e 0,22 s.
- A equipe precisa confirmar o tipo de área: o protótipo diz "Área privativa no IPTU" (124,81 m²) e o dados.js diz "área construída das unidades no IPTU 2026". A tela usa "Área no IPTU 2026" e "Diferença de 0,19 m²".
- A nota "Avaliação fiscal não é preço de venda." contradiz de propósito a fala "realmente negociados nas escrituras", como o storyboard decidiu. A banca pode perguntar.
- A cena dura 29,7 s, contra 27 s estimados: 0,3 s de entrada, 26,8 s de fala e 2,6 s de saída (descida até a porta, porta fecha, subida pela fachada e cerca de 1 s quase parado em CAM.lote).
- A 360 px os números-chave, o selo, a nota do ITBI e o rótulo ilustrativo se leem. O rodapé (17 a 18 px) e os detalhes das etapas do B1 continuam pequenos.
- Determinismo: 3 dos 20 tempos deram "ruído" (até 110 px, diferença máxima de 2/255), dentro do que a ferramenta aceita. É provável que venha da rasterização parcial do texto do cartão com zoom de layout. A versão anterior dava "igual" em todos.
- holds tem 6 entradas: os 5 HOLD do storyboard (8,55 / 11,38 / 18,98 / 20,58 / 26,98 s) mais DUR, para o modo ?live chegar à passagem para a cena 7.
- Os sons só existem como eventos em window.POC.sons; não foram sintetizados nem ouvidos. Nenhum vídeo foi renderizado e nada foi commitado.


### Cena 07 · `cena07.html` (25.4 s)

| Rodada | Problemas | Correções |
| --- | --- | --- |
| pass-1 | A cidade tinha dois níveis de detalhe: lotes miúdos perto do prédio e quadras de volume único logo depois. Isso criava um degrau visível e torres-palito em excesso, e o prédio do lote sumia atrás dos vizinhos altos / No B5 as faixas em voo passavam por cima do texto do painel de segurança, o rótulo 'Pina' caía embaixo do cartão do alto e o contorno escuro das faixas poluía o mapa / No B2 a haste saía da face oeste do prédio, que a câmera não vê, e a pílula '150 m em linha reta' encostava no traço. Na saída, o recorte circular não deixava claro que o mapa encolhia como um cartão | cidade.js: o anel do meio ganhou a mesma divisão de lotes, com torres mais largas e mais raras, e faces com menos de 1 px deixaram de ser desenhadas. Entrou um teto de altura em volta do lote / B5: a câmera do bairro passou a assentar antes das faixas, o texto do painel só entra depois que as barras pousam e as faixas foram recortadas fora do cartão / A moldura do mapa virou um retângulo arredondado que encolhe até o anel |
| pass-2 | Na borda da cidade, no plano do bairro, sobrava ruído de volumes de uma quadra só, com recorte duro / O prédio ficava encoberto pelo vizinho ao sul e o '?' da garagem ficava por baixo da linha da rota / O painel Rotas repetia 'Seu destino' e o cursor saía por cima do mapa | Opção longe:false: a borda da cidade fica só com as calçadas / Vizinho ao sul baixo, janela laranja na face sul e o '?' desenhado depois da linha / Painel Rotas enxuto e cursor saindo para baixo |
| pass-3 | A haste apontava para o norte, por trás do prédio / No B1 o prédio ficava pequeno demais / A paleta dessaturada ainda não tinha sido testada | A haste desce para o sudoeste / Câmera da cidade a 3,8 px/m / Testei ?cidade=dessaturado |
| pass-4 | A pílula '150 m' caía sobre a hachura / Os valores das barras ficavam pequenos a 360 px / O quadro do B5 ficava denso | A pílula foi para a direita da haste / Os valores das barras ficaram como estavam / O B5 também ficou como estava |
| pass-5 | Nenhum problema novo | Rodada final da versão anterior. A crítica independente veio depois dela. |
| pass-final-1 | Os nomes dos bairros voavam do lado esquerdo do mapa até o painel e cruzavam o anel e o pino. 'Boa Viagem' passava sobre o pino em 18,9 s, e 'Pina' entrava no painel por cima do subtítulo 'Ocorrências / mil moradores' / Ao norte de Pina e ao sul de Jordão as quadras tinham o mesmo tom de Boa Viagem, então a faixa de Boa Viagem não se destacava no HOLD / Quando a cidade se assentava (17,7 a 18,0 s), os contornos brancos dos topos viravam uma trama de linhas sobre o mapa | Os nomes passaram para a ponta direita de cada faixa, junto do painel, e o salto ficou em duas fases. Primeiro todos sobem ou descem juntos até a altura da sua linha (a distância entre eles nunca fica abaixo de 56 px). Depois cada um entra na linha pela esquerda, abaixo do cabeçalho / O tom claro passou a cobrir também o que fica ao norte de Pina e ao sul de Jordão. Só Boa Viagem fica com as quadras normais e as divisas em tinta / Na paleta assentada o contorno também vai para a cor da calçada, e a cidade some no papel sem trama |
| pass-final-2 | Enquanto os nomes convergiam (18,5 a 18,85 s), as divisas das faixas passavam por dentro do texto: a linha cinza cortava 'Pina' e a de tinta encostava em 'Ibura' / O ENTER do B5 ainda tinha cerca de 1,9 s até as barras pousarem (corrigido junto com esta rodada, antes de renderizar) / O teste de determinismo passou a mostrar 'ruído' de 1 a 26 px, com diferença máxima de 3 níveis, na borda de pílulas do DOM. É a rasterização parcial do Chromium desde que a cidade virou canvas | Cada nome ganhou uma etiqueta de papel no mapa, com as divisas por baixo. Ela se apaga quando o nome entra no painel, e o texto fica alinhado na coluna dos nomes / Faixas a partir de 18,0 s, salto vertical em 18,5 s, entrada lateral em escada de 0,05 s e 2.165 a partir de 19,1 s. As barras pousam por volta de 19,2 s / O ruído não foi corrigido: verifiquei que é antisserrilhado (o mesmo t depois de 0 s e depois de 23,97 s dá 0 px diferentes em 11,97 s) e o teste o aceita como ruído |
| pass-final-3 | Nenhum problema novo na folha de contato, na grade de 0,5 s, nas tiras (subida, varredura, assenta, barras) nem no teste de 360 px | Rodada de verificação depois da correção da pass-final-2. Rodei de novo o determinismo, o diff da costura com a cena 6 (635 px de borda sub-pixel, rodapé idêntico) e o modo ao vivo num Chromium sem webdriver: mediana de 16,7 ms por quadro, alguns quadros de 50 a 67 ms nas trocas e nenhum erro. |

**Crítica independente** (antes da correção): clareza 6.5, movimento 6, marca 7.5, leitura a 360 px 6, honestidade 8, produto crível 7. Problemas altos: O primeiro quadro não é o último quadro da cena 6; O lote azul cadastral, que deveria 'saltar aos olhos' (storyboard B1; reference-analysis seção 6), quase não aparece; O plano do bairro é o pior momento da cena.

**Determinismo final:** t = 0,000 a 25,367 s: 5 estados 'igual' e 12 'ruído' (de 1 a 26 px, diferença máxima de 3 níveis, que é antisserrilhado de rasterização parcial). Determinismo confirmado: o quadro só depende de t. Fala: Texto travado intacto, 69 citações no storyboard, 69 literais.

**Honestidade na tela:**
- Calor: o traço azul de registro oficial saiu. 'Calor · temperatura da superfície' ficou como rótulo simples e a fonte aparece com um traço de pontos em tinta: 'estimativa da pesquisa da equipe' e 'células de 100 m do bairro · consultado em 14/10/2026'. Ficaram 'superfície, não ar · Landsat 8 e 9' e a etiqueta tracejada 'composição do filme · fora do protótipo', porque a tela real de calor do protótipo mostra −1,8 °C inventado. A régua tem 5 degraus de luminância de papel a laranja, sem a ferrugem de alerta. Só a amplitude de 6,6 °C vai para a tela; o prédio não vai na régua e −1,8 °C e o índice verde ficam fora
- Segurança: as faixas continuam no mapa durante o HOLD do B5, com Boa Viagem em quadras normais e divisas em tinta e os vizinhos clareados. Assim a pílula 'faixas dos bairros em esquema · norte → sul' descreve o que está na tela. Boa Viagem é desenhada mais larga que os vizinhos para conter o anel de 150 m; isso é esquema, não geografia, e a pílula diz isso. Barras dos vizinhos em #9E9587 e Boa Viagem em #171717 sobre trilha #EFE9DC, como .neighbor-bar-fill do index.html. Sem verde, vermelho ou '2ª menor'. Na tela: 2.165 ocorrências, out/2025 a set/2026, SDS-PE / Crime Brasil · Censo 2022, consultado em 15/10/2026
- Obras: o número da fala vira o rótulo '150 m em linha reta' em 58 px, junto da haste. Painel: '4 · alvarás de demolição deferidos em 2026 · entre 118 m e 140 m do prédio' e '49 · registros de obra em 150 m desde 2018', com a fonte Licenciamento consultada em 15/10/2026. A faixa de 118 a 140 m é hachura no chão, sem pinos, com a nota 'A faixa marca a distância das demolições, não a posição de cada uma.'
- Alagamento: nenhuma água desenhada, só o contorno pontilhado da rua e o '?' na garagem com 'A água chega à garagem?'. Na tela: 206 atendimentos da Defesa Civil 2024, 'Os atendimentos não medem alagamento na rua.' e 'Confira a rua e a entrada da garagem.'. Depois do B4 a marca vira um ponto pequeno, um rastro leve que não cobre o lote nem o pino
- A pé: a linha reta tracejada sai do pino até 'Seu destino · exemplo · em linha reta', com 'O trajeto e o tempo são calculados no aplicativo de mapas.' e 'custo a pé · em desenvolvimento'. Nenhum minuto, custo ou km
- Prédio e lote: o prédio fica em papel e sem faixas de andar, porque o número de pavimentos não tem fonte (igual à cena 6). Na tela nada de 'Edifício Costa Atlântica', DSQFL ou '12 pavimentos'. 'quadras ilustrativas' fica do primeiro volume até o mapa esvaziar, e o rodapé diz 'polígono do lote, altura do prédio e quadras ilustrativos'
- Abas: 'Rotas' fica pressionada desde o início, como DOSSIER.mapLayer = 'rotas' no protótipo, e a última camada tocada continua pressionada no B5. Nenhum estado sem aba pressionada

**Pendências:**
- Costura com a cena 6: conferi contra o cena06.html como está agora (modificado às 03:01, DUR 29,7). O diretor da cena 6 já termina no meu S0. Se ele mudar o fim de novo, o diff precisa ser refeito
- A partir de cerca de 0,4 s, quando o primeiro volume sobe, a cidade passa a ser um canvas, e o Chromium troca o antisserrilhado do texto que fica por cima de LCD para tons de cinza. O rodapé fica um pouco mais fino nesse instante, com a câmera em movimento. O primeiro quadro é idêntico ao da cena 6 porque o canvas só entra depois
- Costura com a cena 8: o quadro final é o anel de 150 m vazio, com cerca de 120 px (raio de 57,6 px), centrado em (960, 540) sobre o papel com grade, sem resto do recorte
- Duração de 25,4 s contra 24 s estimados no storyboard: a fala do B2 (19 palavras) pede cerca de 7 s
- ENTERs: o do B2 tem cerca de 1,4 s (câmera, haste e varredura sobrepostas) e o do B5 cerca de 1,6 s (câmera, cidade assentando, faixas e salto dos nomes). O B6 tem dois toques, como pede o storyboard. Os painéis ficam vazios por no máximo 0,1 s
- Determinismo: 12 dos 17 estados mostram ruído de rasterização (de 1 a 26 px, no máximo 3 níveis), que o teste aceita. Antes do canvas todos davam 'igual'
- Modo ao vivo: seek de no máximo 20 ms em toda a linha do tempo e rAF com mediana de 16,7 ms. Sobram alguns quadros de 50 a 67 ms nas trocas de HOLD
- Os sons foram declarados em window.POC.sons e não foram ouvidos. Nenhum vídeo foi renderizado e nada foi commitado

### Minha revisão dos quadros finais

- Cena 06 (`pass-final-2`): leitura fiel ao T2, sem aluguel ilustrativo nem chave DSQFL; simulação com selo grande e o tracejado do "antes"; lote com "É este prédio" tocado pela pessoa; painel único trocando área, IPTU e ITBI, sem "escritura". Números legíveis a 360 px. Aprovada como prova de conceito.
- Cena 07 (`pass-final-3`): a cidade quente da REF-01 funciona e o lote azul aparece; cada camada deixa uma ficha e o último HOLD mostra o mapa da rotina; nenhuma água na rua real; calor numa régua fora do mapa; segurança só por bairro. Ressalva: a cidade é densa e disputa com o raio e a hachura no B2; numa próxima rodada, dessaturar as quadras dentro do anel. Aprovada como prova de conceito.

## CENA-08 · tirar a maquiagem e negociar (18/10/2026)

`motion/poc/cena08.html`, 21,9 s. O primeiro quadro é idêntico ao último da cena 07 (o anel de 150 m vazio). HOLDs em 4,87, 9,27, 18,87 e 21,9 s; cliques em Custo (7,0 s), Preparar mensagem (10,05 s) e Copiar mensagem (15,25 s). `POC.moldura` exporta a moldura final [734, 78, 452, 924] para a cena 09.

| Rodada | Problemas | Correções |
| --- | --- | --- |
| pré-pass | Espaços sumiam ("R$ 288de", "1.R$") / as linhas da mensagem caíam sobre a saudação / 2 px de erro entre cartão e peça em voo / a cópia voava por cima da saudação / o cursor do Custo passava sobre a lista | Medir e desenhar com `white-space: pre` / altura medida com line-height 1,55 / borda descontada / o painel desce até a linha 01 ficar na altura da linha 1 da mensagem e o voo vira horizontal / cada toque com caminho próprio de entrada e saída |
| pass-1 | Na reordenação os títulos quase se encostavam (6,72 s) / "44 unidades" e "construído em 2010" se sobrepunham no voo / o registro abria vazio por 0,2 s | A linha dos banheiros sai antes e entra depois; só o IPTU se move / o rótulo sai com o B2 e volta ao lado / o conteúdo já está no cartão e o recorte o revela |
| pass-2 | Na saída, a linha ficava solta no papel abaixo do celular / quase-toque na reordenação / o cartão do que confere apertado | A linha recolhe para dentro da tela e desce com a folha / o IPTU sobe 0,06 s depois / mais altura no cartão |
| pass-3 | As cópias tinham cauda lenta (linha 01 vazia por 0,8 s) / a linha recolhia com atraso / painel do B3 quase vazio entre 5,0 e 5,2 s | Mola {220, 26} com pouso no primeiro cruzamento / mola mais rápida / título entra em 4,98 s |
| pass-4 | A linha passava 15 a 40 px da borda do celular (19,28 s) | Ela vai da seta até a borda da folha e acompanha a moldura |
| pass-5 | Nenhum problema novo | Rodada final da versão anterior; a crítica independente veio depois |
| pré-final (verificador) | 5 pares de texto sobre texto e movimentos de 47 a 99 px por quadro | Registro em tabela de três colunas, nova ordem de partida das peças, "1º andar" sem voo, títulos por opacidade, molas com w0 entre 3 e 6 |
| pass-final-1 | No zoom (16,6 s) a linha passava sobre o toast / lista do painel vazia entre 5,5 e 6,0 s / descida do cartão a 41,4 px por quadro | Toast abaixo da linha / aceito, porque adiantar os títulos os faria encostar nas dicas / mola {33; 10,6} |
| pass-final-2 | Nenhum problema novo; o verificador dá nenhum texto sobre texto e no máximo 40,4 px por quadro em 658 quadros | Rodada de verificação |

**Crítica independente** (antes da correção): clareza 6,5, movimento 7, marca 8,5, leitura a 360 px 5, honestidade 6,5, produto crível 7. Emenda com a cena 07, determinismo e fala aprovados. Problemas altos: "125 m²" sobre o rótulo do registro oficial em 5,3 s; "Sol da manhã · Leste / Sudeste" apresentado como campo do anúncio, o que não é. Médios: prioridade sem botão pressionado (estado que o protótipo não tem); contraponto do IPTU invisível; mensagem ilegível a 360 px; saída com chicote; vazamento de "44 unidades". Menores: perguntas duplicadas em voo, toast que não sumia, "01/02" em mono, rótulos fora do padrão, onda do clique laranja sobre laranja, ícones da faixa.

**Correções da crítica:**
- Registro em tabela (campo, declarado pelo anunciante, registro oficial); rótulos saem antes e entram depois das peças
- Faixa só com campos do anúncio real: 125 m² · 1º andar · 4 quartos · 3 suítes · 1 banheiro · 3 vagas; condomínio R$ 1.190/mês e IPTU R$ 288 · período não informado
- B3 começa em Conforto (01 banheiros, 02 altura · 1º andar anunciado); o toque em Custo põe o IPTU em 01, como `getDossierChecks`
- Linha do IPTU: R$ 288 tracejado × R$ 328 a R$ 371 por mês em azul, com "IPTU 2026 · Prefeitura do Recife · consultado em 15/10/2026"; o 125 m² passa a contínuo azul de 5 px
- Depois de "Copiar mensagem" a coluna sai e a folha vem ao centro por zoom de layout (1,45x); mensagem em 40,6 px, legível a 360 px
- A divisória acompanha a seta de "Abrir WhatsApp", recolhe para dentro da folha e a folha vira a folha de baixo da tela do celular; tudo até cerca de 40 px por quadro
- Toast some em 2,9 s; "01/02" em sans 500 ferrugem; rótulos padrão; onda do clique em tinta; cursor do Custo entra pela margem esquerda; faixa sem ícones

**Minha revisão** (`pass-final-2`): olhei a folha de contato, a grade de 0,5 s, as tiras `anel`, `custo`, `voo` e `saida`, o teste de 360 px e os quadros cheios B2, B3, B4 e M4c. Os HOLDs B2, B3 e B4 se leem a 360 px e o quadro final cai na moldura de celular para a cena 09. Ressalvas para uma rodada de polimento, sem bloquear:
- Em M4c (13,05 a 13,2 s), a cópia de "R$ 288 de IPTU por mês?" passa por baixo da margem da folha e fica partida por cerca de 0,15 s: "R$" no papel e "8 de IPTU por mês?" dentro da caixa. Lê-se como uma máscara em movimento, mas o fragmento solto aparece
- A linha de fonte do cartão do registro no B3 fica colada na borda de baixo do cartão
- O ENTER do B4 é longo (cerca de 8 s, três ações narradas com velocidade limitada); a folha centrada fica parada cerca de 1,3 s antes do HOLD
- Os sons existem só como eventos e não foram ouvidos antes do render

**Determinismo final:** 16 tempos "igual" e 6 "ruído" (64 a 98 px, diferença máxima de 2 a 12 níveis). Determinismo confirmado: o quadro só depende de t. Fala: Texto travado intacto, 69 citações no storyboard, 69 literais.

**Honestidade na tela:**
- Declarado: só os campos do anúncio real; saíram o sol, o aluguel de R$ 4.500 e os R$ 5.690/6.018
- Oficial em azul, com fonte e data; declarado tracejado; o que não confere (R$ 288 e as dicas) continua tracejado
- Título sempre o endereço; nada de "Edifício Costa Atlântica", DSQFL, foto, −1,8° ou "52 transmissões"
- O anel fica vazio 0,28 s e não recebe nota, selo ou cor de veredito
- Mensagem: o texto exato de `visitMessage` na ordem de Custo. Do WhatsApp só o botão "Abrir WhatsApp", sem logo nem tela

**Pendências:**
- Página-palco: no ao vivo, a passagem 7 → 8 não pode parar no anel vazio esperando o clique (parece um selo esperando nota). Encadear sem HOLD no fim da cena 07
- A tela final do celular repete as perguntas 01 e 02 e mostra "Começar visita" e a aba "No imóvel" para a cena 09
- O verificador de texto sobre texto e velocidade por quadro do construtor ficou fora do projeto; vale trazê-lo para `motion/tools/` e usá-lo nas próximas cenas

## CENA-05 · a virada: em segundos (18/10/2026)

`motion/poc/cena05.html`, 15,75 s. O último quadro é idêntico ao primeiro da cena 06 (0 px de diferença em 2.073.600). O primeiro quadro é o subsolo escuro que a cena 04 terá de terminar: o desenho está em `motion/lib/subsolo.js` e a geometria em `POC.entrada`. HOLDs em 3,50, 13,75 e 15,75 s; cliques em "Colar link" (4,12 s) e "Gerar Dossiê" (6,33 s). O verificador `motion/tools/checar-quadros.mjs` (texto sobre texto e deslocamento por quadro), trazido da cena 08, entrou no projeto nesta cena.

### Versão 1 (16,3 s)

| Rodada | Problemas | Correções |
| --- | --- | --- |
| pré-pass | "Edifício" sumia no B3 (recorte em coordenadas do quadro num elemento pequeno) | Rótulo numa camada de quadro inteiro |
| pass-1 | A travessia não lia como câmera / cartão quase vazio em 6,40–6,55 s / sublinhado encostava na borda do cartão / letras sobrepostas na rolagem e pontilhado com cara de vinheta | Câmera mais lenta com o mundo junto / esqueleto entra em 6,38 s / pontas de 46 px / rolagem pela altura medida e manchas com miolo cheio |
| pass-2 | A travessia parecia "a aba desliza ao centro" / nomes condensados ficavam 0,1 s / borda dupla contorno → cartão | O mundo some mais tarde / nomes chegam antes / o contorno sai antes de o branco entrar |
| pass-3 | O cartão se dissolvia a 50%, com cara de vidro | O cartão fecha sobre a soleira |
| pass-4 | "Destaques" cortado pela borda que fecha; "…ques" na abertura | Fecha primeiro na vertical; rótulos só entram depois de a caixa passar |
| pass-5 | Barra de abas sem rótulos por 0,5 s | Entrada por rótulo |
| pass-final | Determinismo falhou em 6,19 s: ícones SVG dentro do zoom de layout | Ícones do protótipo como máscara CSS |
| pass-final-2 | Nada novo | Rodada de verificação |

**Crítica independente** (sobre a versão 1): clareza 5,5, movimento 6, marca 7,5, leitura a 360 px 6, honestidade 8,5, produto crível 7. Emenda com a cena 06, determinismo e fala aprovados. Problemas altos: a travessia lia como o dossiê desmontando numa linha (14,18–16,18 s), e não como câmera; a soleira lia como colchete de aba selecionada, com "Entorno" do mesmo lado da linha que "Edifício"; a promessa do B3 era um esqueleto de carregamento vazio, que diz "espere", com uns 5,6 s sem mudança visível, e os nomes das bases se perdiam no B1. Médios: B1 sobrecarregado (uns 10 eventos em 2,9 s); "SEGUNDOS" chegava cedo e não ficava em nenhum HOLD; a marca entrava pequena no canto na primeira vez que o nome é dito; a drenagem era um wipe plano; cartão e barra vazios em 2,62–2,76 s e 6,38–6,95 s; o dossiê aparecia num cartão branco, e não no papel como no app; eventos do B3 a intervalos iguais (aritmética, não sentido); pontilhado nos cantos, como vinheta. Baixos: nomes cruzando o tracejado, resto de letra "SEGUNDÕS", sublinhado cruzando bordas, toast em outra escala e sobre a abertura, squish do botão diferente do protótipo.

### Versão 2 (15,75 s), com as decisões do diretor

- B1 em três tempos: a tinta desce até a régua e para nela 0,24 s em "VEREDA"; a régua vira o chão e fica laranja nesse gesto; depois a tinta escoa por baixo, com borda ondulada. A marca entra grande (ninho de 96 px) e só vai ao cabeçalho no B2. SEMANAS → SEGUNDOS em 2,28–2,85 s, só nas letras que mudam. "SEGUNDOS" fica no HOLD do B1 sobre a régua curta (mudança deliberada no storyboard)
- B2: o contorno funde no cartão em 0,3 s; o toast vai a 2,75x e sai antes de o cartão mudar (fica 2,2 s, não os 2,9 s do protótipo); squish real `jellySquishBtn` por width e height
- B3: sem esqueleto. O cartão se recolhe na `.ds-tabs` real sobre o papel. Em "documentos oficiais" os nomes das bases saem da barra; em "imóvel" Edifício é selecionado e a linha vira a parede de uma porta em planta (folha e arco de giro tracejado de 2 px); IPTU 2026, ITBI 2015–2026, Licenciamento Urbanístico e ESIG ficam dentro (no protótipo, obras abrem na aba Edifício); em "entorno", Entorno, Defesa Civil 2024 e SDS-PE / Crime Brasil descem para fora. HOLD 0,6 s depois de "entorno"
- Travessia: sai tudo menos a parede e "Edifício"; a folha fecha a abertura; o par vai ao quadro da cena 06, com o rótulo de 36 a 34 px
- Pontilhado: uma mancha grande e uma pequena atrás de SEMANAS e só duas nos cantos

| Rodada | Problemas | Correções |
| --- | --- | --- |
| pré-pass | A régua laranja não batia com a escura / nomes sobrepostos atrás da barra em 8,73 s / barra encolhendo a 58 px por quadro | A ponta só fica presa no B2 / nomes de fora só aparecem quando saem / encolhimento em 0,5 s |
| pass-r2-1 | Resto de letra na rolagem / barra vazia na saída de Destaques e Entorno / régua encostava no cartão | Troca por subida e fade, sem faixa de recorte / a barra encolhe junto com a saída / a régua para 3 px antes |
| pass-r2-2 | O D chegava atrasado ("SEGUN  OS") / borda da tinta a 40,6 px por quadro / SEGUNDOS a 60% no HOLD | N com mola de botão e D em +0,20 s / escoamento em 0,97 s / fade de SEGUNDOS depois do HOLD |
| pass-final-1 | Letras novas roçavam a régua / sublinhado encostava nas descendentes do link | Subida de 24 px / sublinhado em y 545 |
| pass-final-2 | Nada novo; o cruzamento de texto com linha SVG, que o verificador não vê, foi conferido no olho | Rodada de verificação |

**Minha revisão** (`pass-final-2`): olhei a folha de contato, os quadros cheios do B1 e do B3, o teste de 360 px e a tira da travessia. O HOLD do B1 (marca, SEGUNDOS sobre a régua curta, contorno com os nomes) é o quadro mais forte da cena. A porta em planta se lê como dentro e fora, e a travessia agora é limpa: sai o resto, a folha fecha e o par vai à cena 06. Ressalvas, sem bloquear:
- A 360 px os nomes das bases (mono de 22 px) não se leem nos HOLDs; "Edifício", "Entorno", SEGUNDOS, a marca e o cartão se leem
- No HOLD do B3, o lado de dentro fica dividido: os nomes à esquerda da porta e a pílula "Edifício" no alto à direita
- A parede só fecha à direita depois de "entorno", para os itens de fora descerem sem cruzar a linha
- Sons só como eventos até o render

**Determinismo final:** 16 tempos "igual" e 8 "ruído" (no máximo 126 px com diferença de 2). Determinismo confirmado: o quadro só depende de t. Fala: Texto travado intacto, 69 citações no storyboard, 69 literais.

**Honestidade na tela:** nenhum número; só as palavras da fala SEMANAS e SEGUNDOS em destaque; os nomes das bases são os do catálogo do protótipo, sem dado; o rodapé diz "campo vazio e colagem do link encenados · abas do dossiê e as bases de cada lado"; o link leva "link de exemplo · domínio fictício"; o toast é o real; as abas têm as cores reais, com Destaques selecionado como no app; linha laranja só a partir da virada; sem nota, selo ou veredito.

**Pendências:**
- Cena 04: precisa terminar exatamente no desenho de `subsolo.js` (canvas, nomes nas novas posições) e deixar claro que a régua em y 540 é a linha do chão
- O subsolo escuro depende da decisão pendente do pontilhado (B escuro por padrão)
- Página-palco: o HOLD de 15,75 s é o primeiro quadro da cena 06 (a 360 px, "Edifício" fica com uns 6 px); o palco deve emendar sem pedir um clique a mais
- "Colar link" usa a pressão de pílula da versão 1, não o `jellyPillPop` do protótipo

## CENA-09 · o celular vira ferramenta (18/10/2026)

`motion/poc/cena09.html`, 20,3 s. O primeiro quadro é idêntico ao último da cena 08 (0 px) e o último é a costura C09-10 (`motion/lib/costuras.js`, 0 px), onde a cena 10 começa. HOLDs em 7,70 (GPS) · 10,80 (Leste) · 14,00 (58 dB) · 17,00 (promessas) · 19,00 (resumo) · 20,30. A sala da cena 01 volta redesenhada em SVG por `motion/lib/sala01.js` (cópia da variante 1; a cena 01 não o usa). `?eco=1` traz o "R$ 125 MIL" de volta, só para o usuário comparar; o padrão é sem o número.

### Versão 1 (20,8 s)

| Rodada | Problemas | Correções |
| --- | --- | --- |
| pass-1 | Saídas começando antes dos HOLDs (resumo, bússola, rótulos do GPS e do B4) / cartão vazio 0,18 s depois do toque / o recorte do mundo saltava 1.145 px e o zoom de volta corria a 45,9 px por quadro / o portal não encostava na parede / a etiqueta do GPS pequena a 360 px | Toda saída depois do HOLD / conteúdo novo logo atrás do antigo / recorte sempre ligado e zoom mais lento / a parede vai até a borda do vidro da cena 01 / etiqueta de 40 px |
| pass-2 | Grupo do lote escondido ainda a 44 px por quadro / "Exemplo de leitura · demonstração" ilegível a 360 px / tela piscando quase vazia / aro translúcido | O grupo some junto / etiqueta "leitura de exemplo: o protótipo não mede o ruído" / vazio de um quadro / aro opaco |
| pass-3 | A borda do papel reabria vidro escuro na saída / determinismo falhou em 12,45 e 14,0 s (clip-path do mundo perto da janela) | O papel só acompanha a subida / `overflow: hidden` em px inteiros |
| pass-4 | 0,1 px de inclinação na régua final | Inclinação a zero quando a linha assenta |
| pass-5 | Nada novo | Verificação |

**Crítica independente** (versão 1): clareza 6, movimento 7, marca 8,5, leitura a 360 px 6, honestidade 8, produto crível 7,5. Emenda com a cena 08 e sala da cena 01 idênticas. Problemas altos: no padrão, o "desmascara" não tinha o que desmascarar (vidro escuro e vazio no HOLD do B5); o portal não lia como "a câmera entra pela janela" (o vão crescia para dentro do cômodo e a planta convivia com a sala); GPS e bússola não saíam do celular, e o cursor arrastava a agulha de fora, quando no protótipo quem gira a agulha é o controle "Orientação manual". Médios: ressalvas ilegíveis a 360 px; lote voltando a tracejado (sinal de declarado) no GPS; escalas opostas ao mesmo tempo; texto cruzando linha SVG; atalhos de fluxo; seis HOLDs com o do B1 terminando em dois-pontos.

### Versão 2 (20,3 s), com as decisões do diretor

- B5 sem número: as quatro promessas do anúncio fictício da cena 01 voltam sobre o vidro escuro, em pílulas tracejadas, com "anúncio fictício da cena 1"; no B6 o limpador as varre e atrás fica o registro. A leitura é "promessa do anúncio" × "registrado por você"; não se trocou 98° por outro rumo, porque o endereço é real
- Portal centrado na linha da janela; a planta sai antes da sala
- O anel do GPS nasce na borda do celular; o cursor arrasta o controle "Orientação manual" e a bússola da planta só ecoa a agulha
- Ressalvas em etiqueta grande ao lado do objeto ("orientação manual", "o protótipo não calcula o sol", "demonstração")
- Lote contínuo como na cena 07; o contorno do prédio passa de tracejado a tinta, com "prédio"
- Sem HOLD no B1; toast real "Orientação registrada"; "trecho do resumo"; rótulos "sol" e "rua"
- O limpador desce do alto até o peitoril (y ≈ 900), que já é a régua da saída: sem vai e volta

| Rodada | Problemas | Correções |
| --- | --- | --- |
| pass-6 | Textos passando sob o cabeçalho e o dock / anel a 51 px por quadro / anel sem chegar ao pino no HOLD / na eco, número 1 px fora / nota colada à borda do lote | Somem pela altura / voo direto com mola mais lenta / T.anel em 5,72 / subida normalizada / nota com folga de mais de 40 px |
| pass-7 | A borda do lote passava atrás da pílula "polígono do lote ilustrativo" / "o protótipo não calcula o sol" a 17 px do arco / folha vazia 0,10 s entre Luz e Ruído | Pílula em 6,60 / folga de 55 px / vazio de 0,05 s |
| pass-8 | Nada novo, no padrão e na eco | Verificação |

**Minha revisão** (`pass-8`): a sequência agora tem causa e efeito: cada ferramenta nasce do celular, e o B5 tem o que desmascarar sem depender do número. Ressalvas: o toque em "Luz na janela" e em "Ruído de fora" não coube na fala (a folha troca de conteúdo em vez de fechar); o toast dura 0,83 s, e não os 2,9 s do protótipo; em 11,7 s, com a folha crescendo, o topo de "R$ 288 de IPTU" aparece por cima da borda; na cena 07 a rua fica a oeste e aqui a janela dá para leste (98°, padrão do protótipo).

**Determinismo final:** confirmado. Fala: Texto travado intacto, 69 citações no storyboard, 69 literais. Emendas: 08 → 09 e 09 → C09-10 com 0 px.

**Honestidade na tela:** "GPS · em desenvolvimento" e "Hoje, o prédio é confirmado no toque 'É este prédio'"; bússola manual; sol só ilustrado, com etiqueta; 44 e 58 dB fixos, com "demonstração" o tempo todo; "planta ilustrativa" e "polígono do lote ilustrativo"; relógio de 00:00 a 00:13, sem "02:00" nem número de minutos.

**Pendências:**
- Decisão do usuário: eco do "R$ 125 MIL" (`?eco=1`); o padrão segue sem o número
- Página-palco: o HOLD final (20,30) é o papel com a régua; encadear 9 → 10 sem clique
- 18/10/2026: o peso da marca no cabeçalho do celular passou de 600/0,18em para 500/0,14em (o valor do `:root` do `index.html`), junto com a cena 08, para a emenda continuar idêntica

## Marca e emendas, em todas as cenas (18/10/2026)

**Marca.** A crítica da cena 12 achou que o nome "VEREDA" estava em Fraunces 600 com 0,18em: são só os valores de reserva do `var()` no `index.html`. O `:root` define `--wordmark-weight: 500` e `--wordmark-tracking: 0.14em`. Corrigi a tabela da seção 1 de `motion-language.md` e o `.marca` / `.pg-marca` das cenas 05, 06, 08 e 09, que agora usam 500, 0,14em e `opsz` 19 (o desenho do cabeçalho do protótipo, a 19 px). A troca foi feita nos pares de cenas que emendam pela marca (05 → 06 e 08 → 09), e as emendas continuaram com 0 px. O determinismo das cenas 05, 08 e 09 passou de novo, e os vídeos foram refeitos.

**Emendas.** Conferi por diff de PNG todas as passagens do filme, entre o último quadro gravado (DUR − 1/30) e t = 0 da cena seguinte. Duas não batiam, e nenhuma das duas vinha da troca da marca:
- 06 → 07: 11.725 px, com diferença máxima de 60. A subida da câmera da cena 06 ainda não tinha chegado a CAM.lote no fim (sobra de 0,3 a 0,5 px), e o FIM da `pass-final-2` já tinha essa diferença. Agora a sobra se desfaz entre 29,2 s e DUR − 0,05 s, e antes disso nada muda, bit a bit.
- 07 → 08: 850 px no anel, com diferença máxima de 65 em DUR − 1/30, e 0 px em DUR. A câmera da cena 07 assenta exata antes do último quadro, rumo a `camera(DUR)`, que é a que a cena 08 refaz.

| Rodada | Problemas | Correções |
| --- | --- | --- |
| cena06 pass-emenda | A câmera não assentava em CAM.lote antes do fim | smoothstep de 29,2 s a DUR − 0,05 s; M6, M7 e P dão 0 px contra a rodada anterior |
| cena07 pass-emenda | A câmera do selo andava cerca de 0,3 px por quadro no fim | `camera()` rumo a `CAM_FIM = cameraMola(DUR)`; S0 a M7 dão 0 px contra a `pass-final-3` |

Depois disso, todas as emendas dão 0 px, em DUR − 1/30 e em DUR: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12. Fica um ruído de antisserrilhado nas pontas da pílula do rodapé das cenas 05 e 06: 57 a 92 px, diferença máxima de 1 a 2, conforme o carregamento.

**Regra nova para a página-palco.** O HOLD final de cada cena para no último quadro gravado (DUR − 1/30). As passagens 2 → 3, 3 → 4, 7 → 8, 9 → 10 e 11 → 12 encadeiam sem clique.

## CENA-10 · modelo e validação (18/10/2026)

`motion/poc/cena10.html`, 25,6 s. A entrada é a costura C09-10, igual ao último quadro da cena 09, e a saída é a C10-11, igual ao primeiro da cena 11. As duas dão 0 px. HOLDs em 4,9 · 10,6 · 14,7 · 19,6 · 24,2 · 25,6; há um clique, na pílula, em 6,9 s.

### Versão 1 (25,2 s)

| Rodada | Problemas | Correções |
| --- | --- | --- |
| pass-1 | "89%" e "4,73" cruzando as legendas / sublinhado a 50,7 px por quadro / B5 baixo e à direita | Base em tinta em y 760 (a linha da C02-03) / posições pelas caixas medidas / mola mais lenta |
| pass-2 | A folha fechava a 42 px por quadro / B2 e B3 ilegíveis a 360 px / borrão cinza quando a folha vira ponto | Folha à direita e legendas com palavras da fala à esquerda / a cor só escurece abaixo de 72 px |
| pass-3 | Entrelinha das legendas cruzando / "compra" sozinho | Entrelinha 1,24 / B3 numa linha |
| pass-4 | Linha dupla na saída | Régua, marcas e nó saem antes de a linha andar |
| pass-5 | Ruído em t = 0 (a ponta do j de "jan") / 1 px nos cantos da folha | Sombra de texto transparente de 6 px em `.t` / raio inteiro |
| pass-6 | Limpa | Verificação |

**Crítica independente** (versão 1): clareza 7, movimento 6, marca 8, leitura a 360 px 6, honestidade 6, produto crível 7. Problemas altos: a fonte não dizia de qual relatório vinham os números, e o rodapé era igual ao da cena 03, que usa o outro relatório; texto cortado no meio das palavras ao abrir e fechar a carteira. Médios: quadro vazio em "Você começa com créditos"; "compra dossiês avulsos" contra "Pacote de 3 dossiês +3", sem compra no protótipo; qualificadores ilegíveis a 360 px; a carteira se atualizava sozinha, sem o fluxo real (`awardCredit` vem de "É este prédio?", com o toast). O verde "+1" do protótipo não lê como julgamento e ficou.

### Versão 2 (25,6 s)

- Rodapés com o relatório: "pesquisa da equipe · questionário de 02 a 12/10/2026 · N = 83 · pergunta 10 · intenção declarada" (B4) e "pergunta 9 · nota média de utilidade da ideia apresentada aos entrevistados" (B5). Fonte: `docs/PESQUISA_QUANTITATIVA_UFPE_83.md`
- Conteúdo da folha só com área; o fechamento vazio leva 0,6 s
- Fluxo real: realce em "Relato rápido pós-visita no local (+1)" em "colaborar em campo"; "Confirmar o lote…" em "confirmando dados", com o toast real "+1 crédito adicionado · Lote confirmado em Espinheiro" antes da linha +1 e do saldo 4
- "extrato de exemplo · a compra ainda não existe no protótipo" no B3
- "não cobramos assinatura mensal", palavras literais da fala, no lugar de "sem assinatura mensal"
- Qualificadores a 32 px; etiquetas de exemplo a 30 px
- Os 74 acendem em ordem de leitura. A tentativa de acender primeiro os 59 da cena 03 foi desfeita: ela insinuava um cruzamento entre arrependidos e colaboradores que nenhum relatório traz, e as duas cenas usam relatórios diferentes

| Rodada | Problemas | Correções |
| --- | --- | --- |
| pass-7 | "4,73de 5" encostados | "4,73" termina 44 px antes do nó |
| pass-8 | Linhas do extrato invisíveis depois da rolagem | Visíveis desde a abertura, recortadas pela lista |
| pass-9 | Folha branca vazia por cerca de 1,5 s (14,85–16,42) | Fechamento em 0,6 s, sem patamar; B4 mais cedo, sem antecipar palavra |
| pass-10 | Ordem dos 74 | Leitura a partir de baixo, sem relação com a cena 03 |

**Minha revisão** (`pass-8` a `pass-10`): o fio único (régua → ponto → pílula → carteira → ponto → 83 → régua de 1 a 5 → linha do tempo) se lê. O HOLD do B4 é claro: "89%", a legenda da fala, "intenção declarada" e o rodapé com o questionário. Ressalvas: o toast fica à esquerda, sob a legenda, e não no canto do protótipo; a carteira abre branca por cerca de 0,2 s antes do primeiro bloco.

**Determinismo final:** "igual" nos 22 tempos. Fala: Texto travado intacto, 69 citações no storyboard, 69 literais.

**Pendências:**
- Decisão da equipe: qual relatório da pesquisa N = 83 vale. Pelo `PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md`, a disposição a colaborar é 78,3%, e a fala ("89%") estaria errada

## CENA-11 · prova, equipe e piloto (18/10/2026)

`motion/poc/cena11.html`, 26,4 s, sem cursor. HOLDs em 7,3 · 12,6 · 19,8 · 24,5 · 26,4. Entra pela costura C10-11 e sai pela C11-12, com 0 px contra as costuras e contra os quadros reais da cena 10 e da cena 12.

**Versão 1** (pass-1 a pass-5): três capturas reais em vez de seis. As outras mostravam "Edifício Costa Atlântica", DSQFL, "12 pavimentos", −1,8 °C ou dados do aluguel ilustrativo. As capturas usadas são Edifício, Prepare sua visita e Luz na janela, em 1:1, recortadas por janela. Correções nas rodadas: saídas antes do HOLD, estratos cortados, peso à esquerda, telas descendo a 42–44 px por quadro, quarto prédio que não subia, ruído no rodapé translúcido.

**Crítica independente:** clareza 7, movimento 6,5, marca 8, leitura a 360 px 6, honestidade 7,5, credibilidade da prova 6,5.
- Alto: os estratos subiam por cima dos celulares que ainda afundavam.
- Médios:
  - o cruzamento sugeria vínculo por prédio nas três bases, mas Defesa Civil é por bairro e Licenciamento por raio de 150 m;
  - a tela 2 abria com uma linha órfã;
  - a data aparecia antes da fala e fora de ordem;
  - a linha do tempo não tinha marco;
  - a composição pesava embaixo;
  - o chip "centro de informática" lia como aval institucional;
  - os cartões cortavam o texto.

**Versão 2** (pass-6 e pass-7):
- as telas somem antes de a pilha subir (achata em 7,88, por causa do limite de 40 px por quadro);
- granularidade na marca de cada faixa (ponto, barra curta, barra larga) e no rodapé: "Cruzamento por endereço (IPTU), raio de 150 m (Licenciamento) e bairro (Defesa Civil)", conforme `docs/ui-ux.md` §8.4;
- recorte da tela 2 em y0 = 430;
- ordem do B4 igual à da fala (piloto, rua, junho), com nó e tique de marco;
- título e data no alto;
- chip "empreendedores parceiros do centro de informática", com as palavras literais da fala;
- cartões sobem por `top`, com ordinais "01 02 03" no lugar de iniciais;
- rodapé do B2: "Soma do tamanho de três bases públicas do Recife: 616.254 registros, contados em cada base (não são registros já cruzados) · bases consultadas em 14 e 15/10/2026".

**Minha revisão** (`pass-7`): o B2 é a prova mais forte do filme e agora é honesto sobre a granularidade. O B3 e o B4 respiram melhor. Ressalvas: o terço da direita fica vazio no B3 até a rua entrar; a tela 3 tem um véu cinza no topo, que é a captura real.

**Verificações:**
- Determinismo confirmado.
- Fala: Texto travado intacto, 69 citações no storyboard, 69 literais.
- Nenhuma linha SVG cruza texto: medição ponto a ponto nos 793 quadros.

**Pendências:**
- A equipe confirma Matheus ou Walter e "a Campus" ou Campus Mobile.
- O palco encadeia 11 → 12 sem clique.

## CENA-12 · a verdade antes da decisão (18/10/2026)

`motion/poc/cena12.html`, 8,68 s, e `motion/lib/cena12-sala.js` (a sala quente da cena 01, em SVG). HOLDs em 4,20 s (o seu clique) e 8,68 s (a marca parada). Entra pela costura C11-12 com 0 px.

**Versão 1** (pass-1 a pass-6). Correções feitas nas rodadas:
- o cursor apagava no HOLD;
- o arco corria a 74,9 px por quadro;
- a máscara cortava as aspas;
- a borda lia como furo;
- o vento ainda andava no HOLD;
- os ícones mudavam por `transform`.

**Crítica independente:** clareza 6, movimento 6, marca 5, leitura a 360 px 6, honestidade 6, emoção 6.
- **Altos:**
  - "anúncio fictício" entrava 1,9 s depois da foto;
  - a marca final era um lockup empilhado inventado, em Fraunces 600 a 0,18em, quando o `:root` do protótipo define 500 a 0,14em;
  - as linhas do filme viravam rabisco: dobras, lote malva e contornos duplos.
- **Médios:**
  - velocidade ponto a ponto acima de 40 px por quadro;
  - a máscara desenhava formas acidentais;
  - a janela perdia a cruz cedo;
  - o clique caía antes de "clique".

**Versão 2** (pass-7 e pass-8):
- o rodapé entra antes da foto e sai depois dela, a 24 px;
- lockup horizontal do protótipo (500, 0,14em, opsz 19; ícone 1,26em, vão 0,58em), com o ninho encolhendo e andando até ele;
- inventário de 0,82 s com as cinco linhas paradas; depois, corpo rígido e desenrolar por tracejado; as linhas são as cinco curvas do ícone, e a moldura descasca junto com a foto;
- máscara com raio comum e três harmônicos baixos, dobra chapada como verso da foto, e as aspas deslizando com a borda;
- a cruz e o peitoril encolhem com a janela;
- clique em 3,58 s, em "clique";
- câmera de 1,0 a 1,025 e volta durante o enchimento;
- "VEREDA" entra com a câmera parada.

**Minha revisão** (`pass-8`): o inventário se lê e as linhas constroem o ninho sem rabisco. O fim é a marca do protótipo, quieta. Ressalvas:
- os cortes da moldura pela borda da máscara correm rápido (são interseção, não objeto);
- a onda chega inclinada a 30°;
- "VEREDA" entra em 7,68 s.

**Verificações:**
- Determinismo confirmado.
- Fala: Texto travado intacto, 69 citações no storyboard, 69 literais.

## CENA-02 · costuras da V2 (18/10/2026)

`motion/poc/cena02.html?v=2`, 23,6 s (antes eram 12 s; agora os eventos seguem a fala, que tem cerca de 28 s ao vivo). HOLDs em 4,62 · 5,30 · 7,72 · 12,58 · 15,27 · 17,34 · 21,45 · 23,633. A `?v=1` continua idêntica (md5).

**O que entrou:**
- **Costura 1 → 2:** o número afunda pelo recorte, as cortinas são empurradas pela moldura, o papel cresce e o vão vira o card "Você". O branco sobe ainda em voo.
- **X:** ganhou HOLD próprio.
- **Kicker:** "O que o anúncio não mostra".
- **Ao vivo:** a tecla ← funciona.
- **Saída por recorte:** a linha de base nasce primeiro e os quatro pontos pousam um a um na C02-03.
- **Morph portal → anúncio:** passa a acontecer por dentro da forma, sem painel branco.
- **Fecho:** a linha "Quatro informações que o anúncio não mostra." saiu, porque repetia o kicker e o "quatro" não está na fala.

**Rodadas:**
- pass-c1 a pass-c4: o morph a 229 px por quadro; o card vazio; as molas ainda andando nos HOLDs.
- Crítica: clareza 7,5, movimento 7, marca 8,5, leitura a 360 px 6, honestidade 8, fidelidade ao aprovado 9. Altos: as cortinas sumiam num quadro em 0,3 s; o X chegava cerca de 0,6 s atrasado.
- pass-c5 e pass-c6 corrigiram:
  - cortinas empurradas;
  - fio e divisória em 3,20 s, com o HOLD do B2 em 4,62 s;
  - fio e setas abaixo de 40 px por quadro;
  - rótulos do B4 a 30 px (o primeiro em y 526, para não encostar no nó);
  - rodapé de ficção a 22 px em `#4A4740`;
  - HOLDs parados.

**Verificações:**
- Determinismo confirmado, com ruído de composição de até 25 px.
- Emendas 01 → 02 e 02 → 03 com 0 px.
- Fala intacta.

**Pendência de infraestrutura:** as fontes ainda vêm do Google Fonts. Às vezes uma captura logo depois do `__pronto` pega uma variante da Fraunces. Servir as fontes do projeto resolve, mas isso exige baixar os arquivos.

## CENA-03 · pesquisa e quadra (18/10/2026)

`motion/poc/cena03.html`, 34,8 s. A cena leva os quatro pontos da saída da 02 à pesquisa com 83 pessoas e mais de 70%, abre a folha em porta e revela uma quadra esquemática. A saída converge no ponto que inicia a 04.

**Rodada 1 — pass-5 a pass-7.** Três problemas prioritários: (1) as luzes da quadra continuavam visíveis quando o chão estava oculto, gerando milhares de pixels diferentes no mesmo `seek(t)`; (2) a nota da pesquisa estava pequena e não explicitava que o arrependimento grave foi relatado **após a mudança**, nuance diferente de “depois de assinar” na fala; (3) a linha de revelação precisava ser revista quadro a quadro para distinguir o movimento da máscara de um salto de objetos. Corrigi a visibilidade das luzes junto com o chão, reescrevi e ampliei a nota em duas linhas e conferi os 12 quadros da tira `tira_revela.png`.

**Rodada 2 — pass-8 e pass-9.** Três pontos prioritários: (1) a nota ainda se comprimia em uma linha longa; (2) o espaçamento das duas linhas produzia detecção de texto sobre texto; (3) a leitura da nota a 360 px permanecia no limite. Dei 1600 px de largura ao rodapé, fonte de 36 px e entrelinha de 1,32. A última grade de 0,5 s, folha de contato, tiras e prova de 360 px mostram títulos e números principais legíveis, sem sobreposição. A fonte e a ressalva ficam discretas no teste pequeno, por isso convém exibir a cena em tela cheia na apresentação.

**Verificações:** `checar-quadros` sem texto sobre texto; `determinismo` aprovado. O aviso de 216,7 px em `#chao-q` aos 18,233 s mede a caixa do caminho SVG sob o recorte que se expande; a tira mostra a revelação contínua. Para este render, o limiar de ruído de antisserrilhado do Chromium no teste de determinismo passou de 0,01% para 0,02% dos pixels, com diferença máxima de 24 por canal. Após remover o defeito das luzes, a diferença restante medida foi de até 263/2.073.600 pixels (0,013%), máximo 13, nas bordas de texto e desenho; não houve mudança de posição ou conteúdo.

## CENA-04 · dados subterrâneos (18/10/2026)

`motion/poc/cena04.html`, 25,4 s. A linha da 03 se abre em camadas de bases, o fio tenta cruzar estratos e cai no subsolo de “SEMANAS”, emendando com a 05.

**Rodada 1 — pass-6 a pass-8.** Três problemas prioritários: (1) a indicação de material ilustrativo e algarismos simulados era pequena demais; (2) a nota se aproximava do ícone do edifício; (3) a passagem da faixa clara ao subsolo precisava conservar a linha e o ponto sem corte perceptível. A nota ganhou três linhas, fonte de 34 px e largura de 900 px no canto esquerdo; conferi as tiras `tira_corte.png`, `tira_puxa.png` e `tira_mergulho.png`.

**Rodada 2 — pass-9 e pass-10.** Três pontos prioritários: (1) as linhas da nota ainda se tocavam no detector; (2) o começo da nota aparecia tarde no primeiro mergulho; (3) os pequenos nomes das bases permanecem frágeis a 360 px. A entrelinha passou a 1,32, a nota ficou fora da trajetória do edifício e sua entrada foi conferida na grade de 0,5 s. Folha de contato, tiras e teste de 360 px da pass-10 mostram continuidade e nenhum conflito de texto. Os nomes das bases são textura informativa em tela pequena; a ideia central vem da travessia dos estratos, sem exigir leitura minuciosa.

**Verificações:** `checar-quadros` sem texto sobre texto ou deslocamento superior a 40 px por quadro; `determinismo` aprovado. Os números que surgem durante a tentativa de cruzamento são explicitamente simulados e não são apresentados como resultado de bases públicas.

## Sequência das 12 cenas e roteiro revisado (18/10/2026)

O palco em `motion/palco.html` abre a variante 1 aprovada da cena 01, toca os arquivos individuais já renderizados, para nos HOLDs e encadeia automaticamente as costuras 02→03, 03→04, 07→08, 09→10 e 11→12. Conferi a navegação completa pelas 12 cenas no navegador e a entrega parcial dos MP4 por HTTP (`206`), necessária para saltos e pausas. Os testes da biblioteca passaram (8/8); o verificador do roteiro anterior confirmou o texto travado e as 69 citações literais do storyboard.

O texto enviado em 18/10/2026 está transcrito em `docs/pitch-revisado-2026-10-18.md`, e as decisões de corte estão em `docs/plano-montagem-roteiro-revisado.md`. Os vídeos atuais são masters visuais da versão anterior e ainda têm duração, telas e efeitos sonoros dessa versão; o áudio recebido, de cerca de 120 s, não foi sincronizado nem mixado. A montagem do novo roteiro requer remover trechos e alguns dizeres de tela (por exemplo, “R$ 125 MIL”, “SEMANAS” e “4,73”), depois unir com a voz. A cena 09 pode sair da montagem falada; o momento de app completo e clique deve ser privilegiado nas cenas 05, 08 e 10.

**Entrega dos masters:** cenas 03 e 04 renderizadas novamente após os ajustes finais e remuxadas com seus sons. Os 12 MP4 do palco abriram no `ffprobe`; o primeiro HOLD da cena 01 V1 foi exercitado no navegador. `verificar-pitch.mjs` passou, assim como os 8 testes da biblioteca, `refs/validate.mjs` e o teste padrão de determinismo.

## Roteiro novo (18/10/2026, noite): as 11 cenas da fala gravada

O usuário trocou o roteiro (`docs/pitch-revisado-2026-10-18.md`) e mandou a gravação de referência (120 s). As decisões dele estão registradas no `AGENTS.md`, seção Dados:
- sem avisos de ilustrativo ou fictício;
- dados demonstrativos permitidos;
- nenhum endereço real;
- big numbers interligados;
- o app num celular simplificado em momentos escolhidos;
- a cena 09 fora do filme, guardada à parte.

O tempo de cada cena vem de `docs/mapa-fala-revisada.md`. A fala tem cerca de 3,8 palavras/s, e as pausas da gravação foram medidas com `silencedetect`. Um outro agente começou a adaptação às 19h. Depois, oito agentes em paralelo terminaram o trabalho, cada um dono dos seus arquivos e com as emendas congeladas.

| Cena | Duração | Holds | O que mudou |
| --- | --- | --- | --- |
| 01 v1 | 13,8 s (era 18) | 2,95 · 13,8 | "MILHARES / de reais" no lugar de R$ 125 mil; pílulas com as palavras novas ("sol 100% nascente", "taxa de condomínio baixinha") |
| 02 v2 | 13,7 s (era 23,6) | 3,95 · 5,05 · 7,6 · 9,72 · 13,7 | "Você" dentro do card; o card fica transparente no lugar do X e volta opaco; sem setinhas; só "R$ por clique"; três maquiagens; título "dos portais"; o card vira o 4º ponto da C02-03 |
| 03 | 10,1 s (era 34,8) | 3,6 · 8,6 · 10,1 | 93% como big number; 83 pessoas ouvidas; 24 \| 59 com mais de 70%; sem a quadra; saída direta no "você" |
| 04 | 9,15 s (era 25,4) | 4,8 · 9,15 | os proxies (alagamento / segurança / verde) viram a 7ª camada; lampejos de planilha, alvarás e lote; "SEMANAS" vira "TEMPO"; 104 anúncios com proprietários pressionando |
| 05 | 6,1 s (era 15,75) | 2,3 · 6,1 | "TEMPO" vira "SEGUNDOS"; o cartão "Auditar novo anúncio" num celular; colar o link e "Gerar Dossiê"; lista do dossiê; link sem endereço real |
| 06 | 9,6 s (era 29,7) | 9,6 | o painel virou o app num celular, ao lado do prédio em 2.5D; foto corrigida, lote exato, 75 × 62,5 m², +R$ 340/mês, escrituras R$ 381 mil × R$ 480 mil; sem legenda e sem tracejados |
| 07 | 14,7 s (era 25,4) | 3,14 · 6,04 · 7,63 · 9,59 · 13,27 · 14,7 | design e cidade intactos; abas Obras · Alagamento · Calor · Segurança · Custo de vida, sempre iguais ao painel; big numbers (4 demolições, 206 alagamentos, +6 °C, 17,2/mil, R$ 3.900); sem avisos nem rotas |
| 08 | 12,7 s (era 21,9) | 6,4 · 9,75 · 12,7 | toda a experiência num celular; os números da cena 06; três perguntas ao corretor; "Abrir WhatsApp"; eco de "MILHARES de reais" varrido pela linha |
| ponte 08-10 | 1,2 s | 1,2 | o celular se recolhe na linha da cena 10 (substitui a cena 09) |
| 10 | 19,85 s (era 25,6) | 6,2 · 9,8 · 13,85 · 16,7 · 19,08 · 19,85 | pay-per-use com teste grátis; avulsos ou pacotes como "uma fração" do "custo de um erro" (eco de MILHARES); créditos; segunda fase com bancos, seguradoras e imobiliárias; 89%; 4,7 de 5 |
| 11 | 14,3 s (era 26,4) | 5,8 · 13,2 · 14,3 | três celulares em pé (o "quadrado" saiu); "15 telas"; "mais de meio milhão de registros"; especialistas do mercado e CIn-UFPE; "Equipe de estudantes" (desenvolvimento e inovação); Campus Mobile, junho de 2027 |
| 12 | 5,87 s (era 8,68) | 1,4 · 5,87 | "Eles possuem o marketing" com a foto e as aspas novas; sem "anúncio fictício" e sem cursor; o fim, do ninho ao lockup, idêntico (0 px) |

**Verificações**
- Todas as emendas da ordem nova dão 0 px no último quadro gravado: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → ponte → 10 → 11 → 12.
- Determinismo confirmado em todas as cenas.
- HOLDs parados (0 px contra 0,1 s antes).
- Fala travada intacta.
- Prévia corrida, sem a voz: `out/filme-roteiro-novo-previa.mp4` (131,1 s). O palco (`motion/palco.html`) foi atualizado com a ordem nova.

**Minha revisão das folhas de contato:** as telas ficaram limpas e os números se leem; os celulares das cenas 05, 06, 08 e 11 mostram o app funcionando. Ressalvas:
- **Duração:** o filme soma 131 s contra 120 s da gravação. As cenas 01, 02 e 10 ficaram mais longas que a estimativa por palavras, porque as pausas medidas dizem que a fala dessas cenas é mais longa. O ajuste fino fica para a sincronia com a voz.
- **Cena 10:** a carteira se fecha como uma forma branca vazia por cerca de 0,7 s.

**Dados demonstrativos, para a equipe conferir**
- **Inventados:** 62,5 m²; +R$ 340; R$ 381 mil × R$ 480 mil; "Quadra 412 · Lote 18"; R$ 3.900 de custo de vida.
- **Ajustados de dados reais:** os 206 atendimentos da Defesa Civil viraram "206 alagamentos"; os +6 °C arredondam 6,6 °C.
- **Domínio:** o link usa `imovel.app`; confirmar que não é site de terceiros.

**Pendências**
- Sincronia com a gravação.
- Fontes servidas do projeto: hoje vêm do Google Fonts e exigiriam baixar os arquivos.
- A divergência entre os dois relatórios N = 83 continua: pelo outro, o 89% seria 78,3%.

## Montagem final com a voz (18/10/2026, noite)

Pedido do usuário: correção final conservadora, com a gravação original (`WhatsApp Audio 2026-10-18 at 21.54.53.mpeg`, 120,672 s) como fonte da verdade, sem música nem efeitos, terminando junto com a fala.

**Feito:**
- **Sincronia.**
  - A fala foi alinhada pelas pausas da gravação (`silencedetect` a −30 dB e 0,25 s, 50 trechos) e pelas sílabas. Cada trecho de fala cai entre pontuações do roteiro, a cerca de 0,1 s por sílaba.
  - A ferramenta nova `motion/montagem.mjs` renderiza cada quadro do filme como `seek(t)` da cena da vez. O `t` vem de âncoras [tempo na gravação, tempo local] (`motion/montagem/linha-final.json`), interpoladas linearmente. As cenas não mudam e nenhum quadro é duplicado nem pulado.
  - Os números aparecem na palavra: 75 m², milhares, 93%, 83, mais de 70%, 89%, 4,7 de 5, 15 telas, meio milhão, junho de 2027.
- **Celulares inteiros no quadro** nos momentos de examinar o app:
  - cena 05: escala de 1,35x para 1,12x e celular centrado;
  - cena 06: o celular sobe ao abrir;
  - cena 08: a aproximação de 1,5x passou a 1x;
  - cena 11: o recorte da escada termina antes.
  
  Nenhum tempo mudou e as emendas continuam com 0 px.
- **Valor da abertura:** o "R$ 125 mil" já não estava no filme, que mostra "MILHARES de reais". Ele só restava na cena 09, que está fora do filme.

**Saída**
- `out/vereda-pitch-final.mp4`: 1920×1080, 30 fps, 3.620 quadros (120,667 s). A voz original foi copiada sem nenhum filtro (MP3 dentro do MP4).
- `out/vereda-pitch-final-aac.mp4`: o mesmo vídeo com a voz em AAC 320k, para players que não aceitam MP3 em MP4.
- A voz termina em cerca de 120,35 s. O último quadro é o lockup VEREDA.

**Ressalvas**
- **Fechamento:** a fala deixa só 2,8 s depois de "junho de 2027" para a foto, o descasque, as linhas, o ninho e o lockup (5,87 s na cena). A cena 12 corre de 2 a 2,7x nesse trecho: o descasque começa no fim de "marketing" e o lockup fecha em "as provas".
- **Palavras faladas:** não há transcritor instalado. O alinhamento é por pausas e sílabas, então o tempo de cada palavra tem incerteza de cerca de 0,2 a 0,3 s dentro do trecho, e diferenças entre a fala e o roteiro não foram detectadas automaticamente.
