# Prova do fundo do mapa (F1, agente desenho, 18/11/2026)

## No navegador (rodada 2): o componente de verdade

Fotos `navegador-*.png`: o `FundoDoMapa` pelo react-native-web, no Expo web (porta 8096), com os arquivos reais do mapa-base (Boa Viagem e cidade; outros bairros cuja caixa toca o quadro) carregados por `garantirCamadas`. Cada foto mostra o tema claro (`TemaDoApp`) e o escuro (`TemaEscuro`) lado a lado, dentro de um `<Svg>` com o grupo de zoom `translate(cx cy) scale(z) translate(-cx -cy)`, com `SeloDoBairro`, `CreditoDaBase`, um retângulo no lugar dos botões de zoom e o pino. A rota de prova foi temporária e foi apagada.

| Arquivo | Vista |
|---|---|
| `navegador-gaveta-220m-z1-{340,1240}.png` | gaveta de 220 m, zoom 1 |
| `navegador-gaveta-220m-z3-{340,1240}.png` | gaveta de 220 m, zoom 3 |
| `navegador-por-perto-2600m-{340,1240}.png` | Por perto de 2,6 km (a 1240 px a escala é 2,1 m/px: nível de lote) |
| `navegador-cidade-5000m-{340,1240}.png` | 5 km (a 340 px: nível de cidade; a 1240 px: 4 m/px, nível de quadras) |
| `navegador-dom.json` | conferência do DOM: `textPath` com `href` para um id existente, `startOffset`, fontes e pesos calculados |
| `navegador-medidas-cpu4.json` | medidas no Chrome com a CPU 4 vezes mais lenta |
| `gaveta-340x300*.png` | rodada 1, pelo serializador de teste `svgDaCena` (para comparar) |

O que se conferiu nas fotos e no DOM:

- O texto segue a via (`<textPath href="#fundo-rua-N" startOffset=…>`, alvo existe); `textAnchor="middle"` centra o nome no `startOffset` (o comprimento medido do texto, 137 px para "R. Major Armando de Souza Mello", fica abaixo da estimativa de 156 px usada na colisão: a estimativa é conservadora).
- Fontes carregadas: Fraunces, PlusJakartaSans e JetBrainsMono; os rótulos de rua saem em PlusJakartaSans 600 e a rua do imóvel em 700. `letterSpacing` do nome de bairro aparece (BOA VIAGEM espaçado).
- O halo aparece nos dois temas; a hachura mantém o passo na tela com zoom; nenhuma camada some em relação ao `svgDaCena`.
- Avenidas visíveis no nível de cidade (antes eram da cor do chão); tema escuro com degraus entre sem dado, rua, quadra e lote (tokens `mapa-*`).
- Rótulos desviam do selo, dos botões e do crédito (obstáculos passados pelo quadro).

Medidas (CPU 4×, 9 repetições, `navegador-medidas-cpu4.json`):

| | montagem da cena (`performance` "fundo-do-mapa") | troca de cena até o quadro pintado |
|---|---|---|
| gaveta 220 m, 340 px | mediana 4,1 ms, pior 7,9 ms | mediana 53,2 ms, pior 95,1 ms |
| Por perto 2,6 km, 340 px | mediana 19,7 ms, pior 25,4 ms | mediana 76,5 ms, pior 161,9 ms |

A "troca até pintar" da rota de prova desmonta e remonta o `<Svg>` inteiro (a rota mostra "carregando" enquanto confere os arquivos) e a primeira repetição inclui carregar arquivos; é um teto, não o custo do mapa que só troca a cena. A gaveta ficou 3 ms acima do portão de 50 ms na mediana; o Por perto, dentro dos 80 ms.

Custo em node (arquivos reais, cidade carregada, aquecido, mediana de 15): `tests/fundo-do-mapa-prova.test.ts` (com `MOSTRAR_CUSTO=1` imprime). Medido: gaveta 2,3 ms; gaveta com zoom 3 2,5 ms; Por perto 9,4 ms; 1240 × 600 a 802 m 5,3 ms, a 2 km 13,9 ms, a 5 km 17,4 ms, a 12 km 31,8 ms.

## Decisões que aparecem no desenho

- Nível pela escala na tela em m/px: lote até 2,4 m/px, quadras até 8,8 m/px, cidade acima.
- O lote do imóvel continua desenhado no nível de quadras: é a camada "lote do imóvel" da tabela da seção 4, sem restrição de nível.
- A rua do imóvel: no nível de cidade é procurada nos arquivos de bairro carregados; entra na descrição sempre que achada; ganha rótulo só se couber sem cobrir o pino, outro rótulo ou os controles (antes era forçada por cima do pino).
- Pontes (`mapa.pontes`) em cor de rua por cima da água, nos níveis de lote e de quadras.

## O que pode diferir no celular (para a verificação em aparelho)

Lido no código do react-native-svg 15 (`android/.../TSpanView.java`, `TextPathView.java`; `apple/Text/RNSVGTSpan.mm`):

- TextPath é leiaute próprio da biblioteca: cada glifo é posto ao longo do caminho; o `textAnchor` vem do `<Text>` pai e desloca pelo comprimento medido (`getTextAnchorOffset`); `startOffset` numérico é somado. Glifos além do fim do caminho não são desenhados, então se a medida do texto no aparelho for maior que no Chrome as pontas podem sumir.
- `letterSpacing` entra no Paint (Android: `setLetterSpacing` em em) e desliga ligaduras; o espaçamento pode diferir alguns px do Chrome.
- Traço em texto (o halo) funciona nos dois; `strokeLinejoin="round"` é repassado.
- `fontWeight` 600/700 com a família própria depende da fonte: os .ttf do app são variáveis; no Android a família registrada pelo expo-font pode sair no peso padrão. Conferir no aparelho se a rua do imóvel aparece em negrito.
- Com zoom 3, a rua do imóvel pode ficar fora da janela visível (os rótulos são calculados para o quadro inteiro na escala 1); visto também no navegador.
