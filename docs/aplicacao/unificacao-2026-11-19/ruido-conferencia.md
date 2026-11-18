# Ruído estimado: conferência antes de mostrar

Feita em 18/11/2026, na branch `integracao/ruido-estimado`, sobre a camada `recife/ruido/5e3b4b7941ed75ee` (72 bairros, 7.203 prédios). É a conferência pedida na seção 4.1 do plano de unificação. Os números saem de `node scripts/dados/ruido/conferir-ruido.mjs` (saída guardada em `docs/aplicacao/execucoes/ruido-2026-11-18/conferencia.json`), que usa a mesma leitura do app (`src/dados/ruido/leitura.ts`) e o mesmo cone do aeroporto.

Tudo aqui é estimativa com dados abertos, não medição. Nenhum ponto do Recife foi medido.

## Atualização de 19/11/2026: o avião fora do cone (pendência 2 do HANDOFF)

Refeita na branch `fix/pendencias-unificacao` com o mesmo script (saída em `docs/aplicacao/execucoes/ruido-2026-11-19/conferencia.json`). A camada não mudou; mudou a parcela do avião, que é calculada no app.

- **Antes:** o avião só entrava dentro do cone de aproximação (639 prédios). Dos 322 prédios a até 1 km da pista, nenhum recebia avião fora do cone; 237 saíam "Tranquilo" ou "Muito tranquilo", e havia um degrau na borda (prédio `64823-1080`: 0 fora, ~69 dB(A) 27 m para dentro).
- **Agora, além das cabeceiras (até 10 km delas):** o nível do avião é o da altura na rampa de 3°, com 9 dB a menos por km para o lado da linha de pouso, dentro e fora do cone ("uns 9 dB a menos 1 km para o lado", página de metodologia do Mapa Sossego). Abaixo de 35 dB(A) de dia, fora do cone, não entra (decisão do app; muda o total em menos de 2 dB). Na borda do cone o nível passa de 69,2 para 68,9 dB(A); o `64823-1080` recebe ~69 dB(A) de dia.
- **Ao lado da pista (entre as cabeceiras):** entram os aviões chegando e saindo pela cabeceira mais perto, contados a partir dela, como se ela fosse o começo da linha de pouso; assim não há degrau na linha da cabeceira (a revisão independente achou um de ~68 para 0 dB(A) na primeira versão). O barulho da própria pista (corrida de decolagem, pouso, solo) a página não publica, e o Vereda não inventa: até 3 km da pista, a tela ("Sossego à noite por fonte"), o placar ("piso, sem a pista ao lado"), a ficha, o Comparar ("piso: sem a pista do aeroporto", e a nota que é piso não ganha o ponto), o Duelo e o tradutor dizem que a nota é um piso, e "dentro da referência" não aparece. São 1.172 prédios.
- **Os 322 a até 1 km da pista:** todos com avião na conta; 214 deles com o aviso de piso.
- **Cidade:** 3.831 prédios com avião na conta (eram 639). Mediana na rua 64,7 dB(A) de dia e 58,0 à noite (eram 64,1 e 57,5); nota mediana 7,4 (era 7,5). O aeroporto aparece com nome (cartão Dia × Noite, simulador, "De que lado vem o barulho") sempre que a estimativa soma o avião.
- **Boa Viagem:** mediana 66,8 de dia e 59,9 à noite (eram 66,3 e 59,4); diferença para o Mapa Sossego +0,8 e −1,1, dentro de ±5 dB. Os outros cinco bairros não mudaram.
- **Golden Tower (`8001-216`) mudou de faixa:** fica a ~570 m além da cabeceira 18 e 1,1 km para o lado da linha de pouso. O avião passa a ser a fonte que mais pesa (~61 dB(A) de dia, ~54 à noite), e na rua o prédio vai de 59,6 / 52,4 (8,8, "Muito tranquilo") a 63,4 / 56,3 (7,8, "Tranquilo"). Como o avião vem de cima, frente e fundos ficam mais perto (+1,4 / +1,5 dB, eram +4,6 / +5,2). As fotos e os números de 18/11 abaixo são de antes desta mudança.
- **O que continua de fora:** o aeroporto além de 10 km da cabeceira e o ruído da pista ao lado dela.

## O que foi comparado

- **Vereda:** o nível na rua (térreo, sem fachada) no centro do lote de cada prédio do índice; a tabela dá a mediana dos prédios do bairro.
- **Mapa Sossego:** o que a página de cada bairro publica (`https://mapasossego.com.br/ruido/recife/<bairro>`, lida em 18/11/2026; as páginas dizem "cálculo em 8 de novembro de 2026"). Segundo a própria página, "o valor de cada bairro é a mediana de nove pontos em torno do seu centro".

Não são a mesma coisa: nove pontos em volta do centro do bairro contra todos os prédios do cadastro, que se concentram nas avenidas. A comparação serve para ver se as duas estimativas falam do mesmo tamanho de barulho.

## (a) Os 6 bairros com todas as camadas

| Bairro | Prédios | Vereda, dia (mediana; p10–p90) | Vereda, noite | Mapa Sossego, dia (índice) | Mapa Sossego, noite (índice) | Diferença dia | Diferença noite | Dentro de ±5 dB |
|---|---:|---|---|---|---|---:|---:|---|
| Boa Viagem | 1.878 | 66,3 (60,4–70,2) | 59,4 | ~66 (54) | ~61 (65) | +0,3 | −1,6 | sim |
| Casa Forte | 82 | 59,3 (55,5–63,9) | 51,6 | ~62 (64) | ~55 (82) | −2,7 | −3,4 | sim |
| Graças | 291 | 61,9 (59,2–67,0) | 54,9 | ~62 (64) | ~55 (82) | −0,1 | −0,1 | sim |
| Espinheiro | 156 | 67,3 (63,9–72,2) | 60,5 | ~66 (52) | ~60 (70) | +1,3 | +0,5 | sim |
| Madalena | 280 | 66,9 (61,3–72,1) | 60,0 | ~67 (50) | ~60 (68) | −0,2 | 0,0 | sim |
| Torre | 136 | 65,8 (60,6–70,5) | 58,5 | ~63 (60) | ~56 (79) | +2,8 | +2,5 | sim |

Valores em dB(A). A referência do plano bate: Boa Viagem dá índice 54 de dia (~66 dB) e 65 à noite (~61 dB) no site, e 66,3 e 59,4 no Vereda.

As seis diferenças ficam dentro de ±5 dB, de dia e à noite. As duas maiores:

- **Torre (+2,8 de dia, +2,5 à noite).** Os nove pontos do site ficam em volta do centro do bairro, onde a via mais perto é a Rua Visconde de Itaparica ("via local principal", a 32 m) e a arterial mais perto está a 178 m. Os 136 prédios do cadastro ficam mais perto da Rua José Bonifácio e da Rua Real da Torre, arteriais com cerca de 550 partidas de ônibus num dia útil, que o Vereda soma e o site não tem.
- **Casa Forte (−2,7 de dia, −3,4 à noite).** O centro do bairro no site é a praça, cercada por três vias a 20, 33 e 45 m. Os 82 prédios do cadastro se espalham por ruas mais quietas. Além disso o Vereda não tem duas parcelas que o site soma (abaixo).

### O que o site soma e o Vereda não

O site publica, por bairro, as parcelas de "O que compõe o índice". Duas não entram no Vereda:

| Bairro | Trânsito | Aeroportos | Fontes locais | Vizinhança | Moradores por hectare |
|---|---:|---:|---:|---:|---:|
| Boa Viagem | ~65 | ~53 | ~41 | ~55 | 262 |
| Casa Forte | ~61 | ~42 | ~38 | ~48 | 112 |
| Graças | ~61 | ~40 | ~39 | ~50 | 152 |
| Espinheiro | ~66 | ~38 | ~38 | ~51 | 156 |
| Madalena | ~67 | ~43 | ~42 | ~51 | 168 |
| Torre | ~61 | ~42 | ~38 | ~52 | 188 |

- **Vizinhança (densidade de moradores do Censo 2022).** O repositório tem a população por bairro e os domicílios por setor, mas não a área dos setores censitários. Sem densidade por setor, vale só o piso fixo (38 dB(A) de dia, 33 à noite), como o pedido manda. Somando a parcela de vizinhança que o próprio site publica para o bairro, as diferenças ficam: Boa Viagem +0,6 / −0,9; Casa Forte −2,4 / −2,5; Graças +0,2 / +0,6; Espinheiro +1,4 / +0,7; Madalena 0,0 / +0,2; Torre +3,0 / +3,0. Muda pouco: nos seis bairros o trânsito domina.
- **Aeroporto ao lado da pista.** O site dá uma parcela de aeroporto a todo bairro num raio de 15 km (pista como linha de alcance curto e queda de ~9 dB por km de lado). Em 18/11 o Vereda só somava o avião sob o cone de aproximação (639 prédios); desde 19/11 soma também fora do cone e ao lado da pista, com a queda de 9 dB por km de afastamento da linha de pouso (3.831 prédios, ver a atualização no topo). A página não publica o nível da própria pista, então ele não entra, e ao lado dela a tela diz que a nota é um piso.

E o contrário, o que o Vereda soma e o site não: as partidas de ônibus do GTFS (entram nas fontes de 6.685 dos 7.203 prédios), os locais com licença de som (LUSE vigente, 19 pontos, 181 prédios) e os bares, oficinas e mercados do CNEFE (o site usa os pontos do OpenStreetMap).

## (b) Três prédios

Andar do meio do prédio; "frente" é a janela virada para a fonte que mais pesa, "fundos" é a oposta. Nota de sossego pela noite na janela (48 dB(A) ou menos = 10; 86 ou mais = 0).

| Prédio | Na rua, dia | Na rua, noite | Nota na rua | Andar | Frente, dia / noite (nota) | Fundos, dia / noite (nota) | Frente − fundos |
|---|---:|---:|---:|---:|---|---|---|
| Golden Tower, R. Major Armando de Souza Mello, 216, Boa Viagem (`8001-216`, 18 andares, 1999) | 59,6 | 52,4 | 8,8 | 9º | 59,7 / 52,7 (8,8) | 55,1 / 47,5 (10) | +4,6 / +5,2 |
| Conj. Resid. Privê Bosque da Torre, R. Frei Jaboatão, 280, Torre (`31950-280`, 6 andares, 1985) | 60,6 | 53,1 | 8,7 | 3º | 59,6 / 51,9 (9,0) | 55,7 / 48,4 (9,9) | +3,9 / +3,5 |
| Chagall, Av. Dezessete de Agosto, 1070, Casa Forte (`19526-1070`, 17 andares, 2010) | 63,4 | 55,4 | 8,1 | 8º | 63,0 / 55,1 (8,1) | 52,8 / 45,4 (10) | +10,2 / +9,7 |

- Os três têm números e notas diferentes entre si. Golden Tower e o prédio da Torre: 8,8 contra 8,7 na rua; na tela do dossiê, com o andar e a fachada de cada anúncio, 9,3 contra 9,5 (fotos de 18/11).
- A frente é mais barulhenta que os fundos nos três, de dia e à noite.
- No Golden Tower o topo (17º andar) dá 60,8 dB(A) de dia contra 59,6 na rua: as fontes dele estão longe (a que mais pesa fica a 220 m) e o andar alto perde parte da absorção do ar e do solo, como a metodologia descreve ("andares altos ouvem melhor o ruído distante"). No Chagall, que fica a 50 m da avenida, o topo dá 62,1 contra 63,4.

Fontes que mais pesam (na rua):

- **Golden Tower:** Avenida Visconde de Jequitinhonha, arterial, 542 partidas de ônibus num dia útil, 220 m: ~57 dB(A) de dia · ~50 à noite; Rua Sá e Souza, via local, 71 m: ~50 · ~41; Avenida Boa Viagem, arterial, 544 partidas, 416 m: ~48 · ~41; Avenida Marechal Juarez Távora, coletora, 285 m: ~48 · ~40; bar ou venda de bebida, 120 m: ~38 · ~41.
- **Bosque da Torre:** Rua Marcos André, coletora, 69 m: ~56 · ~48; Rua José Bonifácio, arterial, 542 partidas, 280 m: ~55 · ~48; Avenida Beira Rio, coletora, 102 m: ~52 · ~44; Avenida Rui Barbosa, coletora, 647 partidas, 211 m: ~51 · ~43.
- **Chagall:** Avenida Dezessete de Agosto, coletora, 346 partidas, 50 m: ~63 · ~55; Rua de Santana, via local, 58 m: ~49 · ~40; bar ou venda de bebida, 130 m: ~37 · ~40.

Os três ficam acima da referência da NBR 10151 para área residencial (55 dB(A) de dia, 50 à noite) na rua, por 5 e 2 dB, 6 e 3 dB e 8 e 5 dB. Diferença de até 5 dB cabe na faixa de erro, e a tela diz isso.

## (c) Vieses conhecidos do método

O Mapa Sossego comparou o modelo com 62 pontos medidos em São Paulo: erro médio absoluto de 4,8 dB (daí a faixa de ±5 dB na tela), 2,8 dB acima do medido em média, correlação de 0,55. Dois vieses, que a ficha de método repete em todo prédio:

- **Perto de grandes avenidas, 4 a 5 dB acima do medido** (arteriais e vias expressas): leia como teto. No Vereda, 1.136 dos 7.203 prédios têm uma arterial ou via expressa como fonte que mais pesa a até 60 m.
- **Em rua residencial com trânsito de passagem, 10 a 15 dB abaixo do medido**: leia como piso. O nível vem da classe da via no mapa, não de contagem de carros. No Vereda só 22 prédios têm uma rua residencial como fonte que mais pesa; a parcela dos ônibus reduz esse viés nas ruas que carregam linha, mas não nas que só carregam carro.

Outros limites ditos na ficha: o modelo não vê muros, prédios vizinhos, relevo, obras, festas nem o trânsito de cada hora. A barreira dos fundos (12 dB) e os níveis das fontes pontuais são valores de partida, marcados "a calibrar" em `src/dados/ruido/parametros.ts`.

## Cidade inteira

| | p10 | mediana | p90 | mínimo | máximo |
|---|---:|---:|---:|---:|---:|
| Na rua, de dia, dB(A) | 58,0 | 64,1 | 70,2 | 45,0 | 78,5 |
| Na rua, à noite, dB(A) | 50,9 | 57,5 | 63,7 | 41,9 | 74,0 |
| Nota de sossego (noite) | 5,9 | 7,5 | 9,2 | | |

Os 7.203 prédios têm leitura. O mínimo de 45 dB(A) fica acima do piso de 38 porque todo prédio do índice tem alguma via a menos de 1,5 km.

## Determinismo, peso e origem

- Três execuções de `scripts/dados/ruido/rodar-ruido.mjs` em 18/11/2026, uma delas lendo o extrato inteiro de novo (sem o cache das vias): mesma versão (`5e3b4b7941ed75ee`) e mesmos arquivos (as pastas de versão são imutáveis: conteúdo diferente faria o pipeline parar). SHA-256 do conjunto dos 72 arquivos: `b03a942f987cd2ca1dd7e37a541ec6ba85f5348fc161927cf5dedfe7e8cdc30c`.
- Peso: 1.357.045 bytes nos 72 arquivos (447.715 com gzip); o maior, Boa Viagem, tem 352.399 bytes (104.093 com gzip). Teto no teste: 450 kB por arquivo, 150 kB com gzip, 2 MB no total.
- Vias: OpenStreetMap, extrato Geofabrik da região Nordeste `nordeste-261117.osm.pbf`, dados de 17/11/2026, baixado em 18/11/2026, 445.617.687 bytes, MD5 `9546c214b72a118f99ad5c8d1c06a630` (confere com o publicado), SHA-256 `4b1b5e2eae02e04f29db98c88ce93c484816ace1484ed3238f920a684aa7a43d`. Lidas 34.978 vias de trânsito na caixa do Recife (208.478 trechos, 312 túneis de fora); 1.490 das 1.492 paradas com 180 partidas ou mais ligadas a uma via a até 40 m.
- Metodologia: `https://mapasossego.com.br/sobre`, lida em 18/11/2026 (SHA-256 do HTML `54aee7969211df05ae9104733affd4b4bc6460bcfb77b11fc79a979f8383a1b0`).

## O que não foi obtido ou conferido

- **Os nove pontos de cada bairro do site** não são publicados; a comparação ponto a ponto não foi feita.
- **A tabela de etiquetas `highway` → classe** não está na página de metodologia. A leitura `tertiary` = rua local (61 dB) veio dos rótulos das páginas de bairro ("via local principal" para vias `tertiary`), e diverge da seção 4.1, que punha `tertiary` com `secondary` (68). Com 68 as medianas subiriam; não foi medido quanto.
- **Os valores das correções por faixas, velocidade e zona 30** e os níveis das fontes pontuais não estão na página: são "a calibrar".
- **Medição em campo no Recife:** nenhuma. O botão "Isso bate com a rua hoje?" recolhe a percepção de quem visita, só no aparelho.

## Verificação na web (390 px)

Web na porta 8097 e `node docs/aplicacao/unificacao-2026-11-19/scripts/capturar-telas-novas.mjs --base http://localhost:8097 --saida .cache/unificacao/ruido-3`, em 18/11/2026. Dez telas; li as tiras do dossiê do Golden Tower e do Comparar.

- **Checagens de texto do roteiro:** nenhum "dB" sem "estimativa" e nenhuma nota "/10" sem botão de ficha em nenhuma tela; zero rolagem horizontal; zero requisição falha.
- **Placar do Golden Tower** (9º andar, fachada nordeste): "Sossego à noite · Muito tranquilo · ~51 dB(A) à noite (estimativa) · 9,3/10", com os botões "Como foi calculada a nota de sol e conforto" e "Como foi calculada a nota de sossego". A ficha do sossego abre os seis campos e lista as fontes do prédio (Av. Visconde de Jequitinhonha, arterial, 220 m, etc.). O cartão "Valor pedido" diz "32% acima do ITBI do prédio". No prédio da Torre: "~50 dB(A) à noite (estimativa) · 9,5/10".
- **"Sossego à noite por fonte":** "Nota de sossego 9,3 / 10", "~60 dB(A) na rua de dia · ~52 à noite (estimativa)", a janela do 9º andar, o quarto com a janela fechada, a faixa de ±5 dB, a NBR 10151 dita como norma técnica e o aviso "Estimativa com dados abertos, não medição."; a ficha fica a um toque.
- **Simulador (Entorno):** o resumo "Barulho por perto" abre com "~61 dB(A) de dia · ~54 à noite (estimativa) · 2 fontes perto" (fachada sudeste, a que o roteiro deixa escolhida). O roteiro não abre o painel; o conteúdo dele está coberto por `tests/ruido-telas.test.ts`.
- **Comparar (Golden Tower × Torre):** "Sossego no quarto: Muito tranquilo · 9,3/10" contra "Muito tranquilo · 9,5/10" (empate: menos de 1 ponto), as mesmas notas dos dois placares; "Torre leva vantagem em N de 6 pontos" continua; a ficha "Como cada ponto é comparado" abre os seis campos.
- **Sem prédio confirmado:** placar "Sem leitura · Sem estimativa de ruído" e cartão "Ruído estimado: sem leitura para este imóvel", sem número.
- **Console:** 6 avisos "Unknown event handler property onStartShouldSetResponder…" nas telas do dossiê com prédio. É o item T4 do plano (já aparecia antes deste trabalho, com as mesmas 6 ocorrências); não vem dos componentes do ruído.

Duas coisas que as fotos mostraram e ficam registradas:

- No Comparar, a fachada de cada imóvel era inferida sem os vizinhos do bairro, e a do dossiê, com eles: o Golden Tower saía "Nascente-Sul" no Comparar e "Norte-Nascente" no dossiê, com nota de sossego 8,8 contra 9,3. O Comparar passou a usar os mesmos vizinhos (`src/app/(abas)/comparar.tsx`), e as notas agora batem. O selo de conforto continua diferente entre as duas telas ("Tende a abafar" no Comparar, "Clima agradável" no dossiê) porque o dossiê passa mais dados ao termômetro; isso é do termômetro (R6), não do ruído.
- O cartão "Dia × Noite" mantém a manchete de fatos ("Fora de eixos intensos de ônibus/metrô…") e mostra os dB(A) estimados ao abrir.
