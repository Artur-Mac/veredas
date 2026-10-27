# Análise de referências do pitch

Refeito em 17/10/2026. O manifesto de onde este documento parte é [`refs/references.json`](../refs/references.json); a versão anterior, descartada pelo usuário, está em `motion-references/_descartado-ia-anterior/`.

## 1. O que foi inspecionado de fato

| ID | Referência | Status | Lido | Não visto |
| --- | --- | --- | --- | --- |
| PROD-01 | Protótipo web, `index.html` da raiz | inspecionado | CSS do `:root` e dos componentes `ed-*`, `ds-*`, `vv-*`; dados de `PROPERTIES[0]`; capturas Playwright de todas as telas | nada relevante |
| REF-07 | One-shape UI morph, zero (@twoclipping), 24/09/2026 | `available_inspected` | texto integral do post e do template; o vídeo (14 s, 1440 × 1440, 60 fps), baixado com autorização e decomposto por outra sessão em `motion-references/contact-sheets/refs/REF-07/` | respostas do post; parte dos morphs só a cada 0,5 s |
| REF-08 | Motion design studio workflow, Movez (@0xMovez), 27/09/2026 | `available_inspected_via_transcript_and_spec` | artigo inteiro em 12 passos, com os blocos de código (via `api.fxtwitter.com` e threadnavigator.com) | as 14 figuras, os tweets embutidos e os repositórios citados |
| REF-01 | Showreel de 5 anos da Ravie | `available_inspected` | arquivo enviado pelo usuário (1280 × 720, 24 fps, 47,3 s): quadros a cada 0,25 s, tiras a 10 qps e as capturas do usuário | áudio; autoria de cada trabalho do reel |
| REF-02 | "Comma" motion graphics | `available_inspected` | arquivo enviado pelo usuário (1920 × 1080, 24 fps, 25,5 s): quadros a cada 0,5 s | áudio; nenhum trecho quadro a quadro |
| REF-09 | Captura avulsa: "new" em meio-tom | `available_inspected` (só a imagem) | a captura enviada pelo usuário | o vídeo de origem, que não está nos dois arquivos |
| REF-10 | Par de fotos da mesma sala | `available_inspected` | as duas fotos enviadas pelo usuário, lado a lado com grade | de onde vem cada uma; se a B foi editada ou gerada; direitos de uso |

O X recusou o acesso direto às URLs originais (HTTP 402). As seções 2 e 3 vêm do texto que os autores publicaram; o que foi visto no vídeo da REF-07 está no manifesto. As seções 6 e 7 vêm dos vídeos, das capturas e das fotos que o usuário enviou.

Correção em relação ao manifesto descartado: o vídeo da REF-07 tem 1440 × 1440, não 720 × 720.

## 2. REF-07, uma forma que nunca corta

O template descreve um reel de UI em que todo estado é o mesmo elemento mudando largura, altura, raio e cor. Um cursor conduz cada mudança. Pontos que entram no VEREDA:

| Técnica (texto do autor, em paráfrase) | Como entra no VEREDA |
| --- | --- |
| Um elemento só; o conteúdo troca com timing próprio de entrada e saída | O cartão do anúncio vira registro, lote, mapa e dossiê. O texto sai antes de a geometria mudar e só entra quando a forma tem área para ele (`swap()` em `motion/lib/motion.js`). |
| Springs em forma fechada; valor com vários alvos é soma de springs | `spring()` e `track()`, com testes de continuidade de posição e velocidade (`motion/test/motion.test.mjs`). |
| Câmera dá zoom para o estado preencher o quadro | A câmera 2.5D recua do lote de perto até o raio de 150 m; o enquadramento muda por estado. |
| Nada de bounce, partícula, glow, gradiente no chrome | Mantido. O único "efeito" é o chão que se revela a partir do lote, com borda suave. |
| `will-change` borra texto escalado | Proibido no projeto. Além disso, tamanho de texto em morph muda por `font-size` e `font-weight` (fonte variável), nunca por `scale()`. |
| Arraste por manipulação direta | Ainda não usado no POC-01. Candidato natural: a bússola da visita (o protótipo ajusta a direção à mão). |

O que não entra: a fonte Geist, a paleta preto e branco e o canvas cinza da referência. Toda a marca vem do `index.html`.

## 3. REF-08, o estúdio determinístico

O artigo é um curso de pipeline. O núcleo técnico, que o VEREDA adotou quase sem mudança:

1. **Contrato `seek(t)`**: cada quadro é função pura do tempo. O Playwright chama `window.seek(t)`, captura `#c` e manda o PNG ao ffmpeg por `image2pipe`.
2. **Springs e `track`**: `spring(t, k, d)`, `track(t, keys, k, d)` e `swapAlpha`. O VEREDA corrige um detalhe: o caso superamortecido usa a solução exata, não a aproximação pelo crítico.
3. **PRNG**: mulberry32; nunca `Math.random()` na animação.
4. **Preview ao vivo** com `requestAnimationFrame` só quando `!navigator.webdriver`.
5. **Som**: `sfx.mjs` com click, pop, thump e whoosh sintetizados; mix em −14 LUFS; `beats.py` com librosa quando houver trilha.
6. **Revisão**: folha de contato, tira de quadros em torno de ação rápida, teste a 360 px, render duplo para comparar hashes, nota de 1 a 10, corrigir os três piores e repetir.

O teste de determinismo pegou dois defeitos reais no POC-01, nenhum deles visível a olho no preview (ver [`review-log.md`](review-log.md), rodada 4):

- `getBoundingClientRect()` medindo texto com o zoom do quadro anterior.
- O Chromium baixando a qualidade de uma imagem logo depois de ela mudar de tamanho, por tempo de relógio e não de `t`.

## 4. Onde cada técnica é mais forte

A demonstração do produto usa o one-shape. O resto do pitch não deve usá-lo, ou ele perde força.

| Técnica | Melhor contexto no roteiro | Origem |
| --- | --- | --- |
| Câmera de cidade (2.5D, chão revelado) | Recife, bairro, entorno, "da porta para fora" | POC-01 (lote → mapa); estilo de volume da REF-01 (seção 6) |
| Pontilhado (meio-tom) | Fundo das cenas de número e de dados espalhados | REF-09 e fachadas da REF-01 (seção 6) |
| Vetor urbano plano | Calor, alagamento, demolição, ruas, caminho até o destino | Paleta do mapa do protótipo |
| Máscara orgânica | Tirar a "maquiagem" do anúncio: foto esticada, poente vendido como nascente | Roteiro, cenas 2 e 12 |
| Fragmentos de dados flutuando | Dados públicos espalhados (IPTU, ITBI, licenciamento, ESIG, Defesa Civil) | Roteiro, cena 4 |
| Tipografia cinética | R$ 125 MIL, SEMANAS, SEGUNDOS, 89%, 4,73/5, +500 MIL | Roteiro; números com fonte verificada só onde houver |
| One-shape UI morph | Demonstração do produto (cenas 6 a 9) | REF-07 |

## 5. Próximas referências

Para acrescentar uma referência, siga [`refs/README.md`](../refs/README.md). `node refs/validate.mjs` informa o próximo id (hoje `REF-11`) e lista o que está pendente de análise (hoje nada).

## 6. REF-01 e REF-09: a cidade e os pontilhados

Em 17/10/2026 o usuário enviou os vídeos da REF-01 e da REF-02 e três capturas. Do que mandou, gostou da cidade e dos pontilhados. Também pediu para não misturar muita coisa: os vídeos são demonstrativos, para inspirar uma ou outra ideia. Por isso entram só duas ideias, cada uma com lugar certo. Nada foi aplicado ainda ao POC nem ao storyboard.

### A cidade (REF-01, 18,3 a 19,2 s)

O que se vê: volumes simples vistos do chão, uma rua com faixas em chevron, câmera grande-angular avançando. Cada face tem um tom só, com contorno branco fino em todas as arestas e céu claro com grade. A paleta medida é um matiz só, do vermelho `#F03018` ao laranja `#F07818`, mais branco (17% do quadro). Não há textura, luz realista nem sombra projetada.

Por que cabe no VEREDA: a paleta da referência já é quase a da marca. O laranja `#F47745` e a ferrugem `#B94E36` são da mesma família, e o céu em grade lembra a grade de prancheta do protótipo. Dá para adaptar sem trazer cor de fora.

| Elemento da referência | Versão VEREDA |
| --- | --- |
| Faces em vermelho, laranja e amarelo | Laranja `#F47745` (face clara), `#E06332` (face média), ferrugem `#B94E36` (face de sombra) |
| Topos claros | Papel `#FAF6EE` |
| Contorno branco | Branco `#FFFFFF`, 1,5 a 2 px no quadro de 1080 |
| Céu claro com grade | Papel `#F2EBDD` com a grade do protótipo |
| Faixas em chevron na rua | A rua do prédio em papel, sem chevron; quem marca o caminho é a linha laranja do VEREDA |
| Letreiros e ícones de fliperama nas fachadas | Fora: são conteúdo do cliente da referência |
| Painéis de pontos nas fachadas | Entram como textura de fachada (é o pontilhado de que o usuário gostou) |

O lote do prédio continua em azul cadastral: na cidade laranja, é ele que salta aos olhos. As quadras continuam ilustrativas e a tela continua dizendo isso.

Onde entra: nas cenas de Recife e do entorno (cenas 03 e 08) e no trecho de câmera de mundo do POC-01, entre o lote e o raio de 150 m (M3), em lugar das quadras chapadas. A câmera do POC já faz o movimento certo; muda a aparência dos volumes. Na referência a cidade fica menos de 1 s na tela; no pitch ela precisa ficar parada no HOLD, então a câmera assenta, em vez de sair girando.

### Os pontilhados (REF-09 e fachadas da REF-01)

O que se vê na captura: "new" em sans gigante, creme sobre preto, atrás de manchas orgânicas preenchidas por pontos brancos em meio-tom. São dois tons e uma textura.

Versão VEREDA: textura de pontos em meio-tom gerada por código (posições e tamanhos com `rng`, nunca imagem). Ela entra no fundo das cenas de número e de dados espalhados: "R$ 125 MIL", "93%", "SEMANAS", "SEGUNDOS", "89%", "4,73/5", "+500 MIL" (cenas 01, 03, 04, 05, 10 e 11). Duas opções de cor, as duas com tokens da marca:

| Opção | Fundo | Pontos | Número | Efeito |
| --- | --- | --- | --- | --- |
| A, clara | papel `#F2EBDD` | ferrugem `#B94E36` | tinta `#171717` | continua no mundo do app |
| B, escura | tinta `#171717` | papel `#F2EBDD` | papel `#F2EBDD` | mais perto da captura; separa as cenas de problema (escuras) das de solução (papel) |

A decisão entre A e B é do usuário.

### Regras para não misturar

1. **Uma textura por cena.** Cenas do produto: a grade do protótipo. Cenas de número e de dados: pontilhado. Cenas de cidade: volumes com contorno e pontos só nas fachadas.
2. **Dois empréstimos da REF-01, nada mais.** Ficam de fora o mármore e os objetos 3D realistas ("a distinct FORM"), o caleidoscópio, o neon, as cores de arco-íris ("new hue.") e a troca de estilo a cada segundo, que é ritmo de reel e não de pitch.
3. **Da REF-02, só a calma.** A vírgula que vira objetos confirma o princípio de forma única que já vem da REF-07. Não entra o visual monocromático cinza: uma ideia por vez e pausas longas, como os HOLD.
4. Fonte, cor e componentes continuam vindo só do `index.html`.

## 7. REF-10: duas fotos da mesma sala

O usuário mandou as fotos para "talvez usarmos para exemplificar nosso poder de ajustar imagem distorcida". Arquivos e comparações em `motion-references/contact-sheets/refs/REF-10/`.

| | Foto A | Foto B |
| --- | --- | --- |
| Tamanho | 530 × 724 | 1086 × 1448 |
| Verticais | convergem: parede esquerda e batente inclinados | retas |
| Parede do fundo | cerca de 36% da largura: a sala parece mais comprida | cerca de 43% da largura |
| Luz | mais escura (luma média 118 de 255) | cerca de 30% mais clara (154) e mais quente |
| Vista da varanda | céu estourado, prédio à esquerda | céu limpo, horizonte, verde, prédio à direita |

A sala e a arrumação são as mesmas, mas a vista pela janela muda. Então a B não é só a A com a geometria corrigida: tem outra luz e, talvez, outra tomada ou detalhes refeitos.

### Como usar sem contradizer o VEREDA

1. **O protótipo não tem correção de distorção.** Até o recurso existir, qualquer "antes e depois" leva a etiqueta "simulação" ou "em desenvolvimento". Sem ela, a tela afirma um recurso que não existe.
2. **Corrigir é deixar mais verdadeiro, não mais bonito.** Se a B for a versão "corrigida", ela também está mais clara e mais quente: isso é maquiagem, o contrário da promessa. Uma correção honesta mexe só na geometria (verticais, lente, proporção) e mantém a luz da foto original.
3. **Não mostrar detalhe inventado.** Se a B saiu de um editor ou de IA, a vista da janela pode ter sido refeita; não use a B como prova de nada.
4. **Direitos e privacidade.** É a sala de um imóvel real. Antes de entrar no pitch, confirme o uso com quem fotografou e com o anunciante ou proprietário. Não mostre nada que identifique o prédio, como a vista.

### Onde encaixa

| Cena | Uso | Condição |
| --- | --- | --- |
| 02, maquiagem do anúncio | A foto do anúncio ao lado de uma foto da mesma sala com luz e lente de verdade, com as verticais e a parede do fundo marcadas pela grade da marca | Saber qual é a do anúncio e qual é a real |
| 07, da porta para dentro | Antes e depois da correção | O recurso existir, ou a etiqueta "simulação"; a correção feita só na geometria, a partir da foto do anúncio |

Uma terceira via, sem depender de como a B foi feita: o próprio motion corrige a geometria da foto do anúncio na frente de quem assiste, com recorte e projeção conhecidos (o mesmo `project()` do POC). Luz e conteúdo ficam iguais, com a etiqueta "ilustração do recurso".

## 8. Em aberto

- Origem da captura "new" em meio-tom (REF-09): não está nos dois vídeos enviados.
- REF-10: qual das fotos é a do anúncio, como a outra foi feita e se há direito de uso.
- Opção A ou B para o pontilhado.
- Quando aplicar: a cidade no M3 do POC-01 e o pontilhado num POC curto de tipografia (cena 01, que ainda depende da memória de cálculo dos R$ 125 mil).
