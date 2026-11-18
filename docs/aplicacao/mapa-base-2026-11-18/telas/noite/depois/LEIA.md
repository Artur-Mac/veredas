# Fotos de "depois" do mapa-base (18/11/2026)

Tiradas no commit `67cb0a44` (branch `feat/mapa-base`), servidor de desenvolvimento na porta 8098, máquina sem outro trabalho. Mesmo roteiro e mesmos nomes de `../antes/`, para comparar lado a lado.

- 160 capturas (`capturas.json`), todas no estado `ok`: as 144 do roteiro (13 superfícies, 4 casos, 5 exemplos, 375/360/1280 px) e 16 com `--zoom max` (gaveta-planta e por-perto, 4 casos, 360 e 1280 px; sufixo `--zoom-max`).
- Rolagem horizontal: 0 em todas. Erros de console, requisições que falharam, requisições externas bloqueadas: 0, 0, 0.
- Pasta: 209 arquivos, 14,7 MB (antes: 7,0 MB). **Acima da meta de ~10 MB**: as telas inteiras a 375 px somam 4,1 MB e os mapas de exemplo a 1280 px chegam a 0,6 MB cada (fundo detalhado comprime pior que a grade de antes).

## Como rodar de novo

1. `CI=1 npx expo start --web --port 8098` e espere a página responder.
2. `node docs/aplicacao/mapa-base-2026-11-18/scripts/capturar.mjs --fase depois --base http://localhost:8098` (dividir com `--largura 375`, depois `--largura 360,1280`; uns 3 min no total).
3. `node .../capturar.mjs --fase depois --base http://localhost:8098 --superficie gaveta-planta,por-perto --largura 360,1280 --zoom max`
4. `node .../medir.mjs --modo desempenho --vezes 9 --base http://localhost:8098 --fase depois` e `--modo offline`.
5. Derrube o servidor pelo PID da 8098 (`netstat -ano`, `taskkill /T /F /PID <pid>`).

## Superfícies

Antes: `../antes/<superficie>--<caso>--<largura>--claro.png`. Depois: `./<superficie>--<caso>--<largura>--claro.png` (e `--tela.png` a 375 px).

| Superfície | O que mudou | SVG antes | SVG depois (fundo) |
|---|---|---|---|
| `gaveta-planta` | Grade azul virou quadras, lotes, ruas com nome, selo do bairro e crédito; abre em ~220 m (era ~80 m); rua do imóvel em azul | 15–32 | 29–61 (19–42); zoom máx. 56–111 (44–94) |
| `gaveta-volume` | Volumes sobre o fundo com ruas rotuladas | 49–498 | 64–1.393 (10–12) |
| `por-perto` | Quadras, água, praças, divisas, nomes de bairro, avenidas; hachura fora do Recife | 59–111 | 61–105 (23–64); zoom máx. 249–696 (210–650) |
| `predio` | Fundo no lugar da grade; selo do bairro; vizinhos numerados continuam | 9–93 | 21–116 |
| `miniatura-topo` | Mapa parado de ~220 m com ruas rotuladas e crédito | 11 | 25–51 |
| `miniatura-inicio`, `-comparar`, `-visita`, `-visita-no-imovel` | Sem mudança (sem fundo, de propósito) | 6 | 6 |
| `exemplo-mapa` | Cidade inventada saiu; mapa-base real com divisas, mar, hachura | 95–97 | 29–205 |
| `exemplo-topo` | Idem, ~500 m | 96–98 | 27–98 |
| `exemplo-caminhos` | Idem, ~1 km | 96 | 20–30 |
| `exemplo-confirmar-lote` | Lotes de verdade como candidatos | 102 | 46–102 |

## Desempenho (Golden Tower, 375 px, CPU 4×, 9 repetições; `desempenho.json`)

| | Antes (toque ao mapa) | Depois 1ª abertura com fundo / sem | Depois 2ª abertura com fundo / sem | Custo do fundo 1ª / 2ª |
|---|---|---|---|---|
| Gaveta | 282,6 ms | 414,2 / 275,1 ms (pior 445,9) | 316,8 / 242,0 ms | 139,1 / **74,8 ms** (portão 50) |
| Por perto | 183,4 ms | 909,2 / 181,1 ms (pior 1.006,5) | 269,1 / 147,3 ms | 728,1 / **121,8 ms** (portão 80) |

Etapas (mediana da soma por abertura). Gaveta, 1ª: ler 0 (0 vezes; os arquivos já vieram na pré-carga), montar 12,3 ms (1 vez), desenhar 101,4 ms (1 vez); 2ª: só desenhar, 3,5 ms. Por perto, 1ª: ler 14,4 ms (4 vezes), montar 28,8 ms (1), desenhar 120,4 ms (1); 2ª: só desenhar, 5,7 ms.

## Sem rede (`offline.json`)

- Servidor de desenvolvimento: gaveta com rede e sem rede desenha o fundo (39 elementos; antes 24). Por perto sem rede desenha o mapa (49 elementos), **mas sem o fundo** (volta à grade): `cidade.*.json` do mapa-base não tinha sido baixado (o roteiro só abriu a gaveta com rede), e falham também sol, trânsito e procura, como antes. Recarregar sem rede falha (`ERR_INTERNET_DISCONNECTED`), como antes.
- Exportação web (`npx expo export`) servida estática na 8099: o service worker registrou e guardou a casca; com a rede cortada a página recarregou e a gaveta abriu com o fundo (39 elementos, sem falhas).

## O que não dá para fotografar

Tema escuro: o app é sempre claro (não lê `prefers-color-scheme`); `--tema escuro` sairia igual.

## Problemas visuais que restam

- Rua do imóvel sem rótulo no Por perto do Golden Tower (`por-perto--golden-tower--375--claro.png`, e também em `--360--claro--zoom-max.png`, onde aparecem outras ruas mas não a Major Armando de Souza Mello) e no de Casa Forte (`por-perto--casa-forte-divisa--375--claro.png`).
- Marcadores encobrem o pino no Por perto (`por-perto--casa-forte-divisa--375--claro.png`: o "2" e o "3" sobre o pino; `por-perto--torre--1280--claro.png`: "S" sobre o lote do imóvel). Já acontecia antes.
- Números de lote sobrepostos no `predio` ("929"/"1929" e "135", `predio--golden-tower--375--claro.png`), igual ao antes; e o selo do bairro cobre agora o número de um lote no canto.
- Nome de bairro cruzado por vias ou anel em `exemplo-caminhos--boa-viagem--375--claro.png` e `exemplo-mapa--boa-viagem--375--claro.png`; a divisa de Boa Viagem segue mar adentro em `exemplo-mapa`.
- `exemplo-topo` ainda mostra o selo "ilustrativo".
