# Fotos de "antes" do mapa-base (18/11/2026)

O app de hoje, sem o mapa-base em nenhuma tela. Servem de régua para as fotos de "depois" de cada integração: mesmo roteiro, mesmos nomes.

- 144 capturas, todas no estado `ok` (registro em `capturas.json`), mais as fotos de tela inteira a 375 px e as duas do modo sem rede: 198 arquivos com os JSON e este LEIA, 7,0 MB.
- Nome: `<superficie>--<caso>--<largura>--claro.png` (recorte do mapa) e `...--tela.png` (tela inteira, só a 375 px).
- Casos do app: `golden-tower`, `torre`, `casa-forte-divisa`, `pina-sem-lote` (porquê de cada um em `../../../scripts/casos.json`). Exemplos: os cinco bairros em `exemplo-mapa` e `exemplo-topo`; só Boa Viagem em `exemplo-caminhos` e `exemplo-confirmar-lote`. Larguras 375, 360 e 1280; `deviceScaleFactor` 1.

## O que cada foto mostra

| Superfície | O que mostra hoje | Elementos SVG (mín.–máx. entre casos e larguras) |
|---|---|---|
| `gaveta-planta` | Gaveta "Mapa do lote" do dossiê, Planta 2D: lote do prédio, lotes vizinhos tracejados, pino, régua de escala, grade azul | 15–32 |
| `gaveta-volume` | A mesma gaveta em "Volume": prédios em volume com altura e sombra | 49–498 |
| `por-perto` | Mapa do Por perto: grade azul, lotes perto do pino, marcadores de lugares (M, S, E, P), régua de 200 m | 59–111 |
| `predio` | Quadro do prédio no dossiê: lote escolhido e vizinhos com número, aviso "Toque nos lotes vizinhos..." | 9–93 |
| `miniatura-inicio` | Cartão do início: contorno do lote sobre papel quadriculado, bairro e preço | 6 |
| `miniatura-comparar` | Miniatura do comparar: só o contorno do lote | 6 |
| `miniatura-visita` | Miniatura da visita | 6 |
| `miniatura-visita-no-imovel` | Miniatura da visita no imóvel | 6 |
| `miniatura-topo` | Topo do dossiê: contorno do lote, voltar, salvar, "Abrir mapa" | 11 |
| `exemplo-mapa` | Mapa de exemplo: ruas desenhadas, anéis de 500 m, 1 km e 1,5 km, pino | 95–97 |
| `exemplo-topo` | Topo de exemplo: ruas, anel de 500 m, "Abrir mapa" (ainda com o selo "ilustrativo") | 96–98 |
| `exemplo-caminhos` | Caminhos de exemplo: anéis de 500 m e 1 km, mar à direita | 96 |
| `exemplo-confirmar-lote` | Confirmar lote de exemplo: quarteirão com lotes tracejados e o escolhido em azul | 102 |

Leitura dos números: as miniaturas são fixas em 6 (11 no topo) porque hoje desenham só o contorno; é ali que o mapa-base mais muda a conta. O `predio` varia de 9 (Pina, quase sem lote vizinho) a 93 (Golden Tower, quadra cheia de lotes). Na `gaveta-planta` do Pina aparece só o próprio lote, sem vizinhos: é o caso da quadra sem lote.

## Caso `pina-sem-lote` conferido

Contra os brutos de Quadras e Lotes (lidos em fluxo): no quadro de ~450 m em volta do prédio há 17 quadras, 3 sem nenhum lote (uma delas a quadra do mangue, ~1,58 km²), 40,1% da área de quadra do quadro. O caso fica.

## Desempenho de hoje (Golden Tower, 375 px, CPU 4x mais lenta, 7 repetições)

`desempenho.json`, do toque até o mapa desenhado:

| Superfície | Mediana | Pior |
|---|---|---|
| Gaveta (Planta 2D) | 282,6 ms | 286,6 ms |
| Por perto | 183,4 ms | 215,2 ms |

Ainda não há marca `fundo-do-mapa` (o fundo não existe hoje), então `fundo` sai nulo.

## Sem rede (`offline.json`)

- Gaveta com rede e sem rede: desenha, 24 elementos.
- Por perto sem rede: desenha (93 elementos), mas quatro arquivos de dados falham (sol de Boa Viagem, grade e recorte de trânsito, procura): o que já estava na memória fica, o resto some.
- Recarregar a página sem rede: falha (`ERR_INTERNET_DISCONNECTED`). O servidor de desenvolvimento não tem cache de navegador; não é medida do app instalado.

## O que não dá para fotografar no escuro

O app é sempre claro: não lê `prefers-color-scheme` e não tem tema escuro. O roteiro aceita `--tema escuro`, mas só emula a preferência do sistema e a foto sai igual à clara. Por isso não há fotos escuras nesta pasta; se um dia o app ganhar tema escuro, rode o roteiro com `--tema escuro` e compare.

## Como rodar

1. Servidor web (noutro terminal), e espere `http://localhost:8095` responder:
   `CI=1 npx expo start --web --port 8095`
2. Rodada completa (uns 3 min):
   `node docs/aplicacao/mapa-base-2026-11-18/scripts/capturar.mjs --fase antes`
3. Refazer só um pedaço (o `capturas.json` é mesclado, não apagado):
   `node .../capturar.mjs --fase antes --superficie gaveta-planta,por-perto --caso pina-sem-lote --largura 375`
   Filtros: `--superficie`, `--caso` (ids de casos ou bairros de exemplo), `--largura`, `--tema`, `--fase antes|depois` ou `--saida <pasta>`, `--base <url>`.
4. Desempenho e sem rede:
   `node docs/aplicacao/mapa-base-2026-11-18/scripts/medir.mjs --fase antes --vezes 7` (ou `--modo offline`).
5. Derrube o servidor pelo PID que escuta na 8095 (`netstat -ano | findstr :8095`, depois `taskkill /T /F /PID <pid>`).
