# Unificação de 19/11/2026: as quatro frentes numa branch só

Branch `integracao/2026-11-19`, PR único contra `main`. O pedido completo, com as decisões do Samuel de 18/11/2026, está em `PROMPT-SESSAO-UNIFICACAO.md` (fora do repositório, em `C:\Users\ssamu\vereda-unificacao-plano`); este arquivo registra o que foi feito com ele.

## O que veio de cada branch

| Ordem | Branch | O que traz | Como entrou |
|---|---|---|---|
| 1 | `fix/mapas-e-leitura-de-anuncios` (PR #4) | vizinhos do mapa por distância, leitura de anúncios, correções do Windows | merge limpo |
| 2 | `feat/seguranca-aeroporto-limpeza` | cartão "Segurança no bairro", aeroporto como fonte de ruído, limpeza de dados legados | merge limpo; a branch não estava no GitHub e foi lida da pasta do Samuel |
| 3 | `feat/mapa-base` (PR #5) | fundo de mapa real em todos os mapas | 2 conflitos "adicionado dos dois lados" (`PLANO-DA-NOITE.md`, `mapaBaseContrato.ts`): ficou a versão do mapa-base |
| 4 | `feat/vereda-visual-power-overhaul` | refatoração visual, placar, 2.5D, bolso, radar de vista, pulso, copiloto, Comparar A×B | 4 conflitos, resolvidos pela receita 3.2 do pedido |

Resolução dos 4 conflitos da frente visual:

- `src/app/sobre-os-dados.tsx`: bloco da frente visual e, depois dele, `<MapaBase />`. Dois exageros corrigidos: o app confere tamanho e, na web, o SHA-256 com o manifesto (não "assina" nada); o "esquema canônico · v2" era texto fixo.
- `src/componentes/dossie-v1/MapaDoLote.tsx`: base do mapa-base; botão sem borda, com fundo opaco e sinal cinza quando desligado; etiqueta de altura longe do pino em Plus Jakarta Sans; legenda sem `comAlfa`; cartão do lote no padrão do cartão da obra; "Área do lote no cadastro: ~X m²" no lugar de "m² de projeção".
- `src/componentes/predio/MapaDoPredio.tsx`: rodapé medido do mapa-base; faixa com fundo opaco.
- `src/dados/dossie/simuladorDaUnidade.ts`: fontes com mercado e aeroporto; as 3 mais perto mais o aeroporto; causa "Avião"; o avião na linha de pouso vem de cima e não entra na leitura "de frente / de costas".

## Decisões aplicadas (seção 2 do pedido)

| # | Decisão | Onde ficou |
|---|---|---|
| D1, A13 | Notas 0–10 e placar ficam, com dado do imóvel e a conta a um toque | `src/dados/fichaDeMetodo.ts`, `componentes/visual/FichaDeMetodo.tsx`; pulso, termômetro, caminhada, placar, sossego e matriz do Comparar |
| D2 | "Leva vantagem em N de 6" fica | `MatrizVisualComparar.tsx` |
| D3, A1, A2, A3 | Ruído em dB(A) estimado, um modelo só | ver "Ruído estimado" abaixo |
| D4 | Sai o "alvo justo sugerido" | `TresPerguntasDoBolso.tsx`: ficam os fatos, sem valor em reais |
| A4 | Custo em 10 anos com valorização de 0, 3 ou 5% ao ano, começando em 0% | `SimuladorTco10Anos.tsx`, `TresPerguntasDoBolso.tsx` |
| A5 | Leis conferidas na fonte oficial | `leis-conferidas.md` (45 citações) e os commits `fix(leis): …` |
| A6 | Plus Jakarta Sans em todo texto SVG; Fraunces só em `FONTES_DO_FUNDO.bairro` | exceção escrita no teste de fontes |
| A7 | `comAlfa` permitido só em `src/componentes/mapa/**` | — |
| A8 | Núcleo offline sai do app (pendente; valeu a recomendação) | ver "O que foi para arquivo" |
| A9 | Os dois volumes 2.5D ficam; legenda da brisa "SE" nos dois | `CanvasSolSombraBrisa25D.tsx` |
| A10 | Borda do mapa-base em 300 m | nada muda |
| A11, A12 | Nome da rua do imóvel sempre visível, como a Prefeitura publica | ver "Pendências do mapa-base" |

## O que foi para arquivo

**`arquivo/nucleo-offline-2026-11-18`** (a ponta de `feat/vereda-visual-power-overhaul`, commit `1163888d`). Decisão A8: nenhuma tela usava. Saiu num commit só (`chore(a8): …`); `git revert` dele traz tudo de volta.

Para que serve cada peça (o Samuel pediu para entender):

- **SQLite (`expo-sqlite`) + Drizzle**: um banco de dados dentro do aparelho. A frente visual montou nele um "banco público" (os 7.203 prédios com busca por texto e por área do mapa) e um "cofre" para os dados da pessoa. Hoje o app guarda tudo em JSON por bairro e no armazenamento simples do aparelho, que é o que o hub registra como decidido. O banco só compensa se o índice crescer muito (cidade inteira, várias cidades) ou se a busca ficar lenta.
- **PMTiles + MapLibre**: um mapa de navegação livre (arrastar pela cidade, como o Google Maps) lido de um arquivo único, sem servidor. O arquivo que existia tinha 88 kB e só pontos; o mapa-base já desenha ruas, quadras e lotes da Prefeitura em SVG. Só compensa se um dia houver navegação livre pela cidade, que o plano do mapa-base deixa fora.
- **`compilar-pacote-offline.py`**: gerava o banco e o PMTiles em `out/pacote-offline/` (fora do git), e exigia Python e `zstd`.

Ficaram no repositório, sem tela que use e sem dependência nova (TypeScript puro, com teste): `src/nucleo/higiene/**`, `nucleo/geo/sirgas31985.ts`, `nucleo/documentos/datajudClient.ts`, `nucleo/mobilidade/streetSmart.ts`, `nucleo/resolucao/fellegiSunter.ts`, `nucleo/censo/entornoCnefe.ts`, `nucleo/camadaZeroNacional.ts`, `municipios/adaptadores/registroMunicipios.ts` e `municipios/recife/extratores/**`.

## Testes ajustados (cada um com o motivo no próprio teste)

| Teste | O que mudou | Por quê |
|---|---|---|
| `sota-…test.ts` S90 | 4 causas de barulho em vez de 3 | a quarta é o avião (branch de segurança) |
| `sota-…test.ts` S92 | até 2 `borderWidth: 1` no `MapaDoLote`; "Área do lote no cadastro" | moldura e quadradinho da legenda do mapa-base; texto novo da receita |
| `sota-…test.ts` (fontes) | comentário com a exceção `FONTES_DO_FUNDO.bairro` | A6 |
| `desempenho-60fps`, `persistencia-sqlite-pmtiles-multicidade` | apagados; o teste de roteamento por município foi para `camadas-multicidade.test.ts` | A8 (T2, T3): liam `out/pacote-offline/` e tinham limite de tempo de máquina |
| `contratos-canonicos`, `acessibilidade-resiliencia`, `personas-recife-e2e` | saem só as partes que abriam o SQLite; as personas usam um prédio de teste fixo | A8 |
| testes que esperavam "Alvo sugerido de proposta" | passam a esperar os fatos sem alvo | D4 |
| testes de leis (lista em `leis-conferidas.md` e no commit de merge) | valores e textos corrigidos para o que a fonte oficial diz | A5 |
| testes que afirmavam "sem dB" | passam à regra nova | A2 (lista em "Ruído estimado") |

Testes novos: `unificacao-bolso`, `unificacao-textos`, `unificacao-notas`, `leis-conferidas`, `camadas-multicidade` e os do ruído e do mapa.

## Notas, avaliações e textos (F3)

- **R1, R4, R5**: ver "Ruído estimado".
- **R2**: pulso da quadra sem valor fixo. "Serviços a pé" é a nota a pé do prédio; "Custo conhecido" é 10 × itens conhecidos ÷ itens considerados; "Obras a 150 m" é 10 − 1,1 por obra − 0,9 por demolição. Eixo sem dado mostra "Sem leitura" e fica fora da média.
- **R3**: sem "alvo justo" nem contraproposta; valorização escolhida pela pessoa.
- **R6**: o termômetro mantém nota e selo; a ficha diz que a regra de pontos e o gasto com ar são fórmula, sem base medida.
- **R7**: `leis-conferidas.md`. 45 citações: 15 confirmadas, 16 com ressalva, 2 só em fonte secundária, 9 divergiam, 3 não foram encontradas. As 16 correções de texto e de conta foram aplicadas; o que não se confirmou saiu da tela.
- **R8**: o tempo da rotina é linha reta × 1,38 a velocidade média fixa, e a tela diz isso.
- **R9**: sem prédio confirmado, o 2.5D não é desenhado.
- **R10**: nenhuma tela informa o valor do terreno; a ficha da taxa da União diz que nada foi lido da SPU.
- **R11**: ficha de método de 6 campos (o que mede, fonte, data, como foi calculada, limite, na visita) a um toque em toda nota.

## Ruído estimado (R5, com R1 e R4)

Um modelo só, nos moldes do Mapa Sossego (metodologia em https://mapasossego.com.br/sobre, lida em 18/11/2026), calculado no ponto do prédio.

- **Parâmetros**: `src/dados/ruido/parametros.ts`, cada constante com a origem em comentário. **Contas**: `src/dados/ruido/modelo.ts`. **Leitura no app**: `estimarRuido(predio, { andar, fachadaGraus, janelaFechada })` em `src/dados/ruido/estimativa.ts`; sem prédio ou sem camada devolve "sem leitura", nunca um valor fixo.
- **Camada**: `recife/ruido/<versão>/<bairro>.json`, 72 bairros, 7.203 prédios, 8 fachadas, dia e noite; 1,36 MB no total (448 kB com gzip). Gerada por `scripts/dados/ruido/rodar-ruido.mjs` a partir do extrato Geofabrik Nordeste de 17/11/2026, publicada pelo `publicar-camadas`. Três execuções deram os mesmos bytes.
- **Avião (A3)**: o cone de aproximação de `src/dados/recife/aeroporto.ts` com a fórmula de nível do `acustica3d.ts`; a via "coletora a 18 m" fixa sumiu.
- **Telas ligadas**: placar do dossiê, "Sossego à noite por fonte", pulso da quadra, simulador andar × fachada, cartão "Dia × Noite", tradutor dos 10 indicadores, matriz do Comparar. Todo "dB" vem com "estimativa", com a faixa de ±5 dB, a comparação com a NBR 10151 (55 de dia, 50 à noite; norma técnica, não lei municipal) e a ficha a um toque com as fontes que mais pesam no prédio.
- **Conferência** (`ruido-conferencia.md`): nos 6 bairros com todas as camadas, a mediana dos prédios do Vereda ficou a até 3,4 dB do que o Mapa Sossego publica (Boa Viagem: 66,3 de dia e 59,4 à noite contra ~66 e ~61). Golden Tower, Bosque da Torre e Chagall (Casa Forte) têm números diferentes entre si, e a frente é de 3,5 a 10,2 dB mais barulhenta que os fundos.
- **Testes que mudaram pela decisão A2**: `copiloto.test.ts` ("sem dB inventado" passa a "dB só como estimativa"), `sota-…test.ts` (a ficha do pulso passa de "zero dB" a "todo dB com estimativa") e o nome de um campo em `pegadinhas-reais-recife.test.ts`.

Pontos em aberto do modelo, para saber ao ler os números:

- **A calibrar** (sem número na página do Mapa Sossego nem no pedido): correções por faixas, velocidade e zona 30; o peso de cada partida de ônibus; os níveis das fontes pontuais (LUSE, bar, oficina, mercado); a barreira dos fundos.
- **Divergências entre o pedido e a página**: fundos tiram 12 dB na página e 10 no pedido (ficou 12); a classe `tertiary` ficou em 61 dB e não nos 68 do pedido, porque as páginas de bairro do site a rotulam "via local principal" (é inferência dos rótulos; a página de metodologia não traz a tabela).
- **Não entrou**: a parcela de vizinhança por densidade do Censo (o repositório não tem a área dos setores; vale só o piso fixo) e o aeroporto fora do cone de aproximação (a página não publica o nível da pista). Atualizado em 19/11/2026: o avião fora do cone, além das cabeceiras, entrou com a queda de 9 dB por km de lado; ao lado da pista continua fora, e a tela diz que a nota é um piso (`ruido-conferencia.md`).
- **Rótulo e norma**: a palavra da nota segue a escala do Mapa Sossego ("Muito tranquilo" a partir de 8,5). Um prédio pode ser "Muito tranquilo" e estar 1 dB acima da referência noturna da NBR 10151, como o Golden Tower (~51 dB(A) à noite na janela); a tela mostra as duas coisas.
- Nenhum ponto do Recife foi medido.

## Pendências do mapa-base (F4) e console (T4, T5)

- **M1**: confirmar o lote dos exemplos não depende do fundo e sempre tem "Pular".
- **M2**: a camada "Alagamento" sem desenho saiu dos exemplos.
- **M3**: o calor dos exemplos é recortado pela água.
- **M4 (A11)**: o nome da rua do imóvel aparece sempre (71 casos de teste nos 4 prédios e em todo zoom).
- **M5**: o leitor de tela lê travessa, praça e viaduto por extenso.
- **M7**: fundo do Por perto pré-aquecido: do toque ao fundo, de 1.055 ms para 286 ms (Chrome com CPU 4× mais lenta).
- **T4**: os 6 erros de console "Unknown event handler property" sumiram (toque nas paredes do 2.5D).
- **T5**: limite de 15 s nas suítes de visita, telas-fatia5 e exemplos-regua.
- Não verificado: celular físico, leitor de tela de verdade.

## Revisão independente (rodada 1) e o que ficou aberto

Corrigido: Duelo do Comparar dizia outro vencedor de trajeto sem dizer o destino; quatro rótulos para o mesmo sossego; "real" sobre estimativas, dois valores de luz e dois prazos de financiamento; saldo devedor fixo de 34% na conta de 10 anos; conforto e horizonte calculados sem prédio; entrada com ITBI diferente entre placar e bolso; ficha do conforto citando fonte não lida; frase da rotina; "dentro da referência da norma" valendo pelo quarto fechado.

Aberto (achados confirmados, não corrigidos nesta rodada):

1. **Andar e fachada sem estado único**: o placar usa o andar do anúncio (ou 4, sem dizer) e a fachada inferida; o simulador andar × fachada começa noutro andar e sem fachada. O mesmo dossiê pode mostrar duas notas de sossego (ex.: prédio 12955-45: 9,4 no placar e 6,9 no simulador). Depois da visita com bússola, dossiê e Comparar também divergem.
2. **Avião só dentro do cone de aproximação**: 322 prédios a até 1 km da pista ficam com zero de avião na nota, e há um degrau na borda do cone.
3. **Manchete do indicador de ruído** fala de "rota de aviões" mesmo quando o avião pesa pouco (34 dB(A) contra 52 do chão).
4. `MedidorDeRuido.tsx` ainda diz "Nível da rua em dB(A): Sem leitura publicada".
5. "Economia de ITBI" do SFH é medida contra 3% sobre tudo (provável exagero).
6. Achados visuais menores: IPTU descrito de formas diferentes entre cartões, distâncias duplicadas no Entorno, plurais "(s)", alvos de toque de 25–30 px na triagem do Explorar, jargão (CNM, CNIB, SFH).
7. Segunda rodada de revisão e as 144 fotos do mapa-base depois do último merge não foram refeitas na branch final.

## Fica para decisão do Samuel

1. **A8**: confirmar se o núcleo offline fica fora (está em `arquivo/nucleo-offline-2026-11-18`).
2. **Regra de notas** (texto proposto para o `AGENTS.md` e para o hub; não foi gravado): "Notas 0–10, selos e comparações de vantagem são permitidos quando cada nota mostra como foi calculada (ficha de método) e usa dado do imóvel, nunca valor fixo igual para todos. Previsão de preço e preço-alvo continuam proibidos."
3. **Normas pagas que não foi possível conferir** (ficaram na tela): NBR 15575-1 e NBR 6118 (vida útil e maresia), NBR 15575-4 (fachada), NBR 14653-2 (avaliação), EN 17037 (1,5 h de sol) e Anexo 14 da ICAO (superfície de aproximação). Onde aparecem: fim de `leis-conferidas.md`.
4. **Água**: a troca da Compesa pela AQUA Pernambuco está marcada para 23/11/2026 e já foi adiada uma vez; conferir depois do dia 23.
5. **Hub**: a lista de mudanças está no corpo do PR e só é gravada com a confirmação.

## Fica para depois (anotar no hub)

Viés dos pesos das notas (D1); celular físico; lote tocado pelo teclado; memória do cache de camadas; unificar as duas projeções 2.5D; tema escuro; folga de peso do mapa-base (A10); os módulos sem tela listados acima.
