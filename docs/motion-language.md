# Linguagem de motion do VEREDA

Gramática visual do pitch. Refeita em 17/10/2026 a partir do protótipo web (`index.html`, a fonte da marca) e das referências REF-07 e REF-08 ([`reference-analysis.md`](reference-analysis.md)). Vale para o pitch ao vivo, para teasers e para qualquer POC em `motion/`.

## 1. Marca: só o que o protótipo já tem

Tokens em [`motion/lib/marca.css`](../motion/lib/marca.css), copiados do `:root` e dos componentes do `index.html`.

| Papel | Valor | De onde vem |
| --- | --- | --- |
| Fundo | papel `#F2EBDD`, grade de 24 px em sálvia a 11% (48 px no quadro de 1080) | `--bg-paper`, `.arch-grid-pattern` |
| Superfície | `#FFFFFF`, borda `rgba(23,23,23,.09)`, raio 18 (36 no quadro) | `.ed-card` |
| Texto | `#171717`; apoio `#625C51` | `--ink-primary`, `--ds-muted` |
| Acento e caminho | laranja `#F47745`; ferrugem `#B94E36` para texto pequeno em laranja | `--brand-orange`, `--brand-rust` |
| Registro oficial | azul cadastral `#2E5A85`: traço cheio e contorno do lote | `--brand-cadastral`, `renderConfTrace('oficial')` |
| Declarado | traço tracejado em `#171717` | `.conf-trace.declarado` |
| Lote vizinho | tracejado `#8FAAC4` | `renderAnalyzingLotCard` |
| Display | Fraunces 500, `-0.02em`; números grandes com `opsz` fixo em 40 | `--font-display`, `.ed-title-lg` |
| Interface | Plus Jakarta Sans 400 a 700, variável, algarismos tabulares | `--font-sans` |
| Códigos e ordem | JetBrains Mono 600 (`01`, `02`) | `--font-mono` |
| Kicker | Plus Jakarta 700, caixa alta, `0.06em`, ferrugem | `.ed-kicker` |
| Marca | ninho do joão-de-barro em `#F47745` + "VEREDA" em Fraunces 500, `0.14em` (`--wordmark-weight` e `--wordmark-tracking` do `:root`; 600 e 0,18em são só o reserva do `var()`), opsz do tamanho do cabeçalho (19); lockup horizontal, ícone de 1,26em e vão de 0,58em | cabeçalho do `index.html` (corrigido em 18/10/2026) |

Escala: o protótipo é desenhado para celular. No quadro de 1920 × 1080, cada medida do app vale cerca de 2 vezes (título de 22 px vira 52 a 64 px; corpo de 12,5 px vira 22 a 26 px).

Fora da marca, mesmo que uma referência use: gradiente, glow, partícula, 3D com cara de template, cinza frio, fonte Geist, Instrument Serif.

## 2. Honestidade na tela

O VEREDA vende "saber a verdade". Uma animação que inventa dado contradiz o produto.

1. **Todo número tem origem na tela**: traço de origem (oficial ou declarado) e, por perto, fonte e data de consulta.
2. **Ilustrativo é dito**: foto de banco, polígono do lote, altura do prédio e quadras em esquema levam a palavra "ilustrativo" no quadro.
3. **Sem veredito**: nada de nota, selo, "seguro", "preço justo" ou verde e vermelho. O roteiro já diz "em vez de inventar uma nota".
4. **Distância é em linha reta**: o protótipo não calcula tempo a pé, então o pitch também não mostra minutos.
5. **Quando o dado só tem distância, não invente posição**: as 4 demolições estão "entre 118 m e 140 m", então o mapa desenha uma faixa nesse intervalo, não quatro pinos.

Dados reais disponíveis (Rua João Cardoso Aires, 327, consultados em 15/10/2026): IPTU 2026 de R$ 3.934 a R$ 4.457 por ano; 124,81 m² por unidade; 44 unidades; 2010; padrão Superior; 56 avaliações ITBI desde 2015, mediana de R$ 4.339/m²; 49 registros de obra em 150 m desde 2018; 4 alvarás de demolição deferidos em 2026, entre 118 m e 140 m; 2.165 ocorrências em 12 meses no bairro, 17,2 por mil moradores. A procedência completa está em [`refs/references.json`](../refs/references.json) (`PROD-01.dataHonesty`) e em `motion/poc/dados.js`.

## 3. Física

Toda propriedade animada é uma soma de springs em forma fechada (`motion/lib/motion.js`). Trocar o alvo no meio de um movimento soma uma spring nova, que começa com valor e velocidade zero. Por isso posição e velocidade não saltam; os testes conferem isso.

| Personalidade | k | d | ζ | Overshoot | Assenta (2%) | Uso |
| --- | --- | --- | --- | --- | --- | --- |
| `cursor` | 420 | 38 | 0,93 | 0,04% | 0,24 s | rápido e preciso |
| `button` | 520 | 30 | 0,66 | 6,43% | 0,26 s | clique, sublinhado, pino; o único com bounce visível |
| `card` | 190 | 22 | 0,80 | 1,56% | 0,27 s | contêiner, elemento compartilhado; confiante, um pouco pesado |
| `type` | 260 | 31 | 0,96 | 0% | 0,33 s | entrada de texto e títulos; quase sem bounce |
| `map` | 90 | 16 | 0,84 | 0,72% | 0,43 s | forma que vira lote, chão, pino que voa; fluido e espacial |
| `camera` | 30 | 11 | 1,00 | 0% | 1,07 s | câmera 2.5D e moldura; amortecimento crítico |
| `deriva` | 3 | 3,46 | 1,00 | 0% | 3,36 s | aproximação lenta da câmera de tela durante a leitura |
| `varredura` | 34 | 11,6 | 0,99 | 0% | 0,99 s | o caminho que varre o raio de 150 m |

Regras:

- Nada de `setTimeout`, `setInterval`, transição CSS ou `requestAnimationFrame` no render. O rAF só existe no preview e no modo ao vivo, atrás de `!navigator.webdriver`.
- Nada de `Math.random()`. Variações vêm de `rng(semente)`.
- Nada de `will-change`. Texto não é escalado por `scale()` dentro de um morph: muda `font-size` e `font-weight` (a Plus Jakarta é variável).
- Câmera de tela no máximo 1,025× e nunca sobre imagem: o Chromium baixa a qualidade de imagem redimensionada por tempo de relógio e quebra o determinismo.
- Medidas de texto são tomadas sem transform no contêiner (o `render()` zera o zoom antes de medir).
- `node motion/render.mjs determinismo` precisa passar antes de qualquer entrega.

## 4. Uma forma, vários estados

Na demonstração do produto existe um objeto só. Ele muda geometria (cantos, raio, cor, contorno) e o conteúdo troca dentro dele.

1. **Sai antes, entra depois.** O conteúdo que sai some até `tOut − 0,1 s`. O que entra aparece a partir de `tIn + 0,08 s`, quando a forma já tem área para ele. O teste `swap` garante que os dois nunca aparecem juntos.
2. **Um elemento compartilhado por transição.** Algo atravessa o morph intacto: o valor do IPTU declarado, o centro do lote, o anel de 150 m.
3. **A forma pode mudar de espaço.** Na tela ela é um retângulo arredondado. No mundo, é o lote em 2.5D: os quatro cantos interpolam entre o cartão e a projeção do lote. Na moldura, o recorte do mapa encolhe da tela inteira até o cartão do dossiê.
4. **Sem fade de tela inteira.** Nenhum estado do produto entra por fade a partir do vazio.

A especificação estado por estado está em [`ui-state-spec.md`](ui-state-spec.md).

## 5. Cursor

O cursor faz uma ação que o roteiro está narrando: abrir o IPTU, abrir o cadastro, preparar a visita. Nunca clica a esmo.

- **Chegada**: spring `cursor`. A ponta encosta no canto do alvo e nunca cobre o texto que a pessoa está lendo.
- **Clique**: desce em 70 ms, escala 0,84 e volta com a spring `button`. Um anel laranja de 8 a 38 px some em 0,45 s. O alvo responde (realce, sublinhado, cor de pressionado).
- **Saída de cena**: some em 0,15 s quando a câmera vira cinema (lote, mapa) e volta de fora do quadro quando há nova ação.
- Entre um clique e o próximo morph há de 0,2 a 0,25 s: tempo para a ação parecer a causa.

## 6. Câmera

| Câmera | O que faz | Spring |
| --- | --- | --- |
| De tela (`#cena`) | Deriva lenta de 1,0 a 1,022 enquanto a pessoa lê; volta a 1,0 antes do morph | `deriva` e `camera` |
| De mundo (2.5D) | `project()` com `yaw`, `pitch`, escala em px/m e distância focal. Começa a 27 px/m, olhando de cima, com o lote do tamanho do cartão; inclina 56° sobre o lote; sobe para 2,35 px/m e 36° no mapa; termina de cima, a 1,8 px/m, na capa do dossiê | `camera` |

A câmera de mundo é 2.5D leve: polígonos projetados em SVG e um prisma de 12 andares. Não há geometria 3D de cidade.

## 7. O caminho VEREDA

Uma linha laranja (`#F47745`, 4 px, pontas arredondadas) atravessa o pitch. Cada forma dela tem um significado e só aparece quando a narração precisa dele.

| Forma da linha | Significado | Onde |
| --- | --- | --- |
| Sublinhado da URL | o anúncio que vai ser investigado | cena 6 |
| Sublinhado de um valor | este dado está sob investigação | POC-01, clique no IPTU |
| Colchete entre dois valores | declarado × oficial, o cruzamento | POC-01, registro |
| Nó no centro do lote → pino | o dado localizou o prédio | POC-01, morph 2 |
| Haste e raio de 150 m | distância em linha reta a partir do prédio | POC-01, mapa |
| Linha reta até um destino salvo | "o que você resolve a pé", sem tempo | cena 8 |
| Agulha da bússola | sol na janela | cena 9 |
| Onda do ruído | barulho da rua | cena 9 |
| Linha do tempo até junho de 2027 | o piloto | cena 11 |
| Contorno do ninho | a marca | cena 12 |

## 8. Técnica por contexto

| Contexto | Técnica | Não usar |
| --- | --- | --- |
| Recife, bairro, entorno | câmera de mundo 2.5D, chão revelado a partir do lote | one-shape |
| Calor, alagamento, demolição, ruas | vetor plano na paleta do mapa (`#FAF6EE` ruas, `#E9E1D2` quadras), faixas e hachuras | escala de cor que julgue (vermelho = ruim) |
| Maquiagem do anúncio | máscara orgânica que descasca a foto e mostra o dado | glitch, distorção decorativa |
| Dados públicos espalhados | fragmentos com nomes reais de bases (IPTU 2026, ITBI 2015–2026, Licenciamento Urbanístico, ESIG, Defesa Civil 2024) flutuando com `rng` | planilha falsa com números inventados |
| Números de impacto | tipografia cinética em Fraunces (`opsz` 40), entrada com `type` e sem bounce | contagem rolando, número sem fonte |
| Demonstração do produto | one-shape conduzido pelo cursor | cortes secos entre telas |

## 9. Som e ritmo

Os sons de interface são sintetizados (`motion/audio/sfx.mjs`), presos aos eventos da linha do tempo e exportados pelo próprio POC em `window.POC.sons`.

| Voz | Evento |
| --- | --- |
| `click` (1.800 Hz, 50 ms) | clique do cursor |
| `tick` (2.600 Hz, 30 ms) | a linha começa a se desenhar |
| `pop` (glissando curto) | um dado aparece ou é sublinhado |
| `whoosh` (ruído filtrado, 0,3 a 0,9 s) | morph de forma e movimento de câmera |
| `thump` (90 Hz) | o prédio sobe |
| `sweep` (320 a 580 Hz) | o raio de 150 m varre o círculo |

- **Pitch ao vivo**: a fala manda. Cada estado tem ENTER (de 0,3 a 1,2 s, pode seguir a grade), HOLD (indefinido, com o quadro parado) e EXIT, disparado pelo clicker. O POC aceita `?live`, com espaço ou → para avançar e ← para voltar.
- **Teaser exportado**: sem trilha, `node motion/render.mjs audio` sugere uma grade (hoje 125 BPM, com desvio médio de 0,076 s nos eventos principais). Com trilha licenciada, rode `motion/audio/beats.py` e realinhe só as transições curtas, nunca os HOLD.

## 10. Lista antes de entregar

- [ ] Nenhum texto se sobrepõe em troca (ver as tiras de quadros).
- [ ] Nenhum texto borrado em zoom (recorte a 100%).
- [ ] Cursor nunca cobre o que está sendo lido.
- [ ] Nenhum corte seco na grade de 0,5 s.
- [ ] Números-chave legíveis a 360 px.
- [ ] Cada número com origem; cada ilustrativo dito.
- [ ] `determinismo` passa.
- [ ] Rodadas registradas em [`review-log.md`](review-log.md).
