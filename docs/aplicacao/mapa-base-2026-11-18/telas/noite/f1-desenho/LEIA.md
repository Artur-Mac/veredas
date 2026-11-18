# Prova visual do fundo do mapa (F1, agente desenho, 18/11/2026)

Cenas montadas por `montarFundoDoMapa` (`src/componentes/mapa/fundoDoMapaCena.ts`) sobre os recortes reais de `../../../recortes/`, escritas em SVG pela mesma tabela de estilo do componente (`fundoDoMapaEstilo.ts`) e fotografadas no Chrome a 2×, com as fontes do app por `@font-face`. Pino, régua, selo e crédito são desenhados pela página de prova, como o mapa que hospeda fará. Não é o componente React no app (essa conferência fica para a F2).

Para gerar de novo: `PROVA_FUNDO=<pasta> npx jest tests/fundo-do-mapa-prova.test.ts` escreve os HTML; um roteiro Playwright (`chromium.launch({ channel: "chrome" })`) fotografa o elemento `.mapa`.

| Arquivo | Vista |
|---|---|
| `gaveta-340x300-{claro,escuro}.png` | gaveta, 220 m de largura, nível de lote |
| `gaveta-327x280-{claro,escuro}.png` | gaveta na largura de 360 px de tela |
| `gaveta-340x300-zoom3-{claro,escuro}.png` | gaveta com zoom 3 (traço e texto do mesmo tamanho na tela; mais nomes) |
| `por-perto-340x300-{claro,escuro}.png` | por perto, 1,5 km (o máximo que o recorte B cobre), nível de bairro |
| `rodada-1/` | duas fotos das rodadas anteriores, para comparar |

Rodadas:

1. Rodada 1: (a) o nome da rua do imóvel passava sob o pino no por perto; (b) o nome do bairro encostava no nome da rua; (c) avenidas com traçado digitalizado em zigue-zague eram recusadas pela regra de curva. Corrigido: o pino é obstáculo dos rótulos, o nome de bairro tem folga, a curva é medida por cordas.
2. Rodada 2: (a) sem caber longe do pino, a rua do imóvel era esticada para fora do quadro; (b) no escuro, os lotes (`cor-fundo`) viravam buracos pretos; (c) o texto esticado saía do quadro. Corrigido: rótulos presos ao quadro, rua do imóvel corre ao lado da via quando não cabe nela sem cobrir o pino, lote no escuro em `cor-creme`.

Ficou como está, de propósito: a Av. Mal. Juarez Távora (traçado sinuoso ao longo do canal) não leva nome no por perto; a Av. Vinte de Janeiro só tem 14 px dentro do quadro de 1,5 km; no escuro, rua (`cor-superficie`) e quadra (`cor-sutil`) ficam próximas.
