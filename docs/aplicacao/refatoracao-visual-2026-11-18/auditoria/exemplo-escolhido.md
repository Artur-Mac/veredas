# Exemplo escolhido e os números usados nos protótipos

Fase 0, item 4. Os três imóveis são os endereços de exemplo do próprio app (Explorar › "Explorar um endereço exemplo agora", `EXEMPLOS` em `src/dados/raioX.ts`). Nenhum outro endereço entra nos protótipos.

**Dossiê principal: Parque Atlântico (Boa Viagem).** É o que tem mais leituras: 117 transmissões de ITBI, prédio novo e alto, terreno de marinha (trava de financiamento), nota de conforto alta, ruído estimado acima da referência, um achado de IPTU, obra licenciada perto e registros da rua. Os outros dois entram no caderno e no Comparar, porque contrastam com ele: Ana Elizabeth (Graças, 1972, muito bem servido a pé, muitas obras em volta) e Viena (Madalena, aluguel, quente à tarde, corredor de ônibus na porta, sem leitura de escrituras).

**O que foi digitado e o que o app calculou.** Os exemplos abrem sem anúncio (sem preço). Para o dossiê aparecer completo, os valores de anúncio abaixo foram digitados no editor (`/editar`): são **entrada de exemplo, não dado oficial**. Todo o resto foi lido da tela do app (exportação do commit `1153c2c1` de `main`, 19/11/2026), com o índice cadastral `faa40c969275e6b5`. Textos de origem em `textos/` e `textos/outros-exemplos/`.

## 1. Parque Atlântico · compra

| Campo | Valor | Origem |
|---|---|---|
| Endereço | Avenida Boa Viagem, 2290 · Boa Viagem · 14º andar | cadastro; andar digitado |
| Anúncio (digitado) | R$ 720.000 · 58 m² · 2 quartos (1 suíte) · 2 banheiros · 1 vaga | entrada de exemplo |
| Condomínio (digitado) | R$ 980/mês | entrada de exemplo |
| IPTU do anúncio (digitado) | R$ 95/mês | entrada de exemplo |
| IPTU no cadastro | R$ 142/mês (mediana de 25 unidades de 57,72 m²); R$ 130/mês (mediana do prédio, a que entra na saída mensal); faixa R$ 106–R$ 142 | IPTU 2026 |
| Achado | "IPTU não confere": anúncio R$ 95 × cadastro R$ 142 | app |
| Preço por m² | R$ 12.414/m² | app |
| Mensal conhecido | R$ 1.075/mês (condomínio 980 + IPTU 95); nenhuma parcela a confirmar | app |
| Saída estimada por mês | ~R$ 6.805 = financiamento 5.371 + condomínio 980 + IPTU do cadastro 130 + luz estimada 324 | app |
| Financiamento | ~R$ 5.371/mês, 80% em 30 anos, taxa média do BCB (11,3% a.a.) | app |
| Para entrar | ~R$ 152 mil = entrada de 20% (R$ 144 mil) + ITBI (R$ 8.352). Cartório: a confirmar | app |
| ITBI | economia possível até R$ 13.248 (1,8% com lançamento em até 180 dias; 1% na parte financiada pelo SFH; 3% fora disso) | app |
| Custo total da compra | R$ 732.960 a R$ 741.600 (preço + ITBI de 1,8% a 3%) | Comparar |
| 10 anos | com valorização de 0% ao ano, alugar e aplicar a entrada deixa ~R$ 559 mil à frente. Valorização é escolha da pessoa (0, 3 ou 5%) | app |
| Escrituras do prédio (ITBI) | R$ 587.717 a R$ 783.233 por unidade; mediana R$ 640.716; 12 em 36 meses; 117 desde 2017 | ITBI |
| Preço × escrituras | 12% acima da mediana. É avaliação fiscal, não preço de mercado | app |
| Prédio | 2016 (10 anos) · 29 andares · 103 unidades · padrão Médio · lote ~954 m² | cadastro |
| Chave cadastral | 6.1755.205.02.0130 | cadastro |
| Terreno da União | marinha: sem aforamento não usa FGTS; escritura pede CAT da SPU (vale 90 dias) | app |
| Estrutura | nenhum ato documentado; alerta de alvenaria resistente não se aplica (29 andares) | app |
| Relógio do prédio | 10 anos; fachada aos 15, colunas aos 25 | app |
| A pé | nota 6,9/10 · mais perto que 48% dos 1.760 prédios de Boa Viagem · mercado 5 min · farmácia 6 · praça 3 · ônibus 4 | camada essenciais |
| Em volta | 1 bar a ~120 m; 1 padaria ou farmácia a ~130 m (Censo 2022, só a categoria) | CNEFE |
| Sossego | 7,3/10 "Tranquilo" · ~58 dB(A) à noite na janela (estimativa) | modelo de ruído |
| Ruído, todos os pontos | rua ~68 de dia · ~61 à noite; janela (14º, sudeste) ~65 · ~58; quarto com janela fechada ~45 · ~38; faixa ±5 dB | modelo de ruído |
| Referência | NBR 10151 (55 de dia, 50 à noite): 10 dB acima de dia, 8 à noite. Norma técnica, não lei | app |
| Fonte mais perto | Rua dos Navegantes, via principal a ~45 m, do lado noroeste | app |
| Volta à noite | ponto na Av. Conselheiro Aguiar a 4 min, 2 travessias de via principal, último ônibus 23:58; mais longe que 7 de cada 10 prédios do bairro | camada noite |
| Rua (150 m, 12 meses) | 30 pedidos de lâmpada apagada · 6 de drenagem · 5 de entulho · 10 sinistros com vítima (2022–2024) · 0 licenças de som · coleta à noite (seg, qua, sex) | 156, CTTU, Emlurb |
| Segurança no bairro | 17,1 registros por 1.000 moradores em 12 meses; mediana do Recife 17,4 ("perto da mediana"); 2.148 registros (nov/2025 a out/2026) | SDS-PE via Crime Brasil; IBGE |
| Conforto térmico | 9,2/10 "Fresco e ventilado" · fachada Nascente-Sul (116°) · sol ~5,5 h/dia · brisa de sudeste livre | regra de conforto |
| Calor da quadra | −2,2 °C em relação ao bairro (superfície 38,0 °C) | Landsat 100 m |
| Chuva | sem registro de alagamento na rua; cota 14,6 m; água mapeada a 566 m; Defesa Civil: 80 atendimentos na avenida de 2014 a 2024 (a base esconde o número do imóvel) | Defesa Civil, eSIG |
| Obras | 1 licença em 24 meses a 150 m: acréscimo a ~116 m, nov/2024, deferida, vencida em 01/2025 | Licenciamento |
| Pulso da quadra | 7,9/10 em 6 eixos: sol 9,2 · sossego 7,3 · a pé 6,9 · custo conhecido 7,5 · ciclo do prédio 7,6 · obras 8,9 | app |
| Visita | 10 verificações no dossiê; roteiro de 12 pontos na aba Visita: as 10 mais 2 checagens de risco no topo (garagem e comporta, pelos 6 pedidos de drenagem; internet no cômodo, sem teste no caderno) | app (`textos/outros-exemplos/parque-atlantico-visita.txt`) |

## 2. Ana Elizabeth · compra

| Campo | Valor |
|---|---|
| Endereço | Avenida Conselheiro Rosa e Silva, 537 · Graças · 4º andar |
| Anúncio (digitado) | R$ 495.000 · 130 m² · 3 quartos · 3 banheiros · 1 vaga · condomínio R$ 1.350 · IPTU R$ 110 |
| Preço por m² | R$ 3.808/m² |
| Mensal conhecido | R$ 1.460/mês |
| Saída estimada por mês | ~R$ 5.476 = financiamento 3.692 + condomínio 1.350 + IPTU 110 + luz 324 |
| Para entrar | ~R$ 105 mil = entrada R$ 99 mil + ITBI R$ 5.742 |
| Custo total da compra | R$ 503.910 a R$ 509.850 |
| 10 anos | com 0% ao ano, alugar e aplicar deixa ~R$ 387 mil à frente |
| Escrituras (ITBI) | R$ 328.079 a R$ 450.872; mediana R$ 370.000; 11 em 36 meses. Preço 34% acima da mediana |
| Prédio | 1972 (54 anos) · 9 andares · 62 unidades · padrão Médio |
| A pé | 8,8/10 · mais perto que 99% dos prédios das Graças · mercado 1 min · farmácia 2 · ônibus 1 · praça 4 |
| Sossego | 7,5/10 "Tranquilo" · ~58 dB(A) à noite na janela (estimativa); rua ~66 · ~58; quarto ~48 · ~40 |
| Conforto | 9,2/10 "Fresco e ventilado" · fachada Nascente; torre de 17 andares à frente |
| Calor e chuva | +0,1 °C em relação ao bairro (40,2 °C) · cota 12,0 m · Defesa Civil: 17 atendimentos na avenida (2014–2024) |
| Obras | 5 licenças em 24 meses a 150 m ("mais obras que 8 de cada 10 prédios das Graças") |
| Rua | 8 pedidos de drenagem · 16 de lâmpada · 8 sinistros com vítima · ônibus da noite a 1 min, último 00:22 |
| Segurança no bairro | 9,0 por 1.000 moradores ("abaixo da mediana do Recife") |
| Terreno da União | fora da faixa costeira |
| Pulso | 7,0/10 em 6 eixos (ciclo do prédio 1,8) |
| Visita | 9 verificações no dossiê; roteiro de 12 pontos (no topo: garagem e comporta, 8 pedidos de drenagem; pressão da água e fachada, prédio de 54 anos; internet no cômodo) |

## 3. Viena · aluguel

| Campo | Valor |
|---|---|
| Endereço | Avenida Visconde de Albuquerque, 186 · Madalena · 5º andar |
| Anúncio (digitado) | aluguel R$ 3.600 · condomínio R$ 1.250 · seguro incêndio R$ 45 · IPTU não informado · 141 m² · 4 quartos · 3 banheiros · 2 vagas |
| Custo mensal por parcelas | aluguel 3.600 + condomínio 1.250 + seguro 45 = **R$ 4.895 conhecido**; IPTU a confirmar (cadastro: ~R$ 128); +R$ 1.295 além do aluguel |
| Total mensal estimado | ~R$ 5.219 (conhecido + luz 324) |
| Escrituras (ITBI) | **Sem leitura**: menos de 3 transmissões em 36 meses (na compra só; aqui é aluguel) |
| Prédio | 1976 (50 anos) · 11 andares · 18 unidades de 140,8 m² |
| A pé | 7,8/10 · 66% na Madalena · mercado 5 min · farmácia 4 · ônibus 1 · praça 4 |
| Sossego | 5,8/10 "Moderado" · ~64 dB(A) à noite na janela (estimativa); rua ~72 · ~65; quarto ~53 · ~46; 16 dB acima da referência de dia |
| Fonte mais perto | corredor de ônibus a ~11 m (556 partidas num dia útil) |
| Conforto | 1,8/10 "Quente à tarde" · fachada Poente · quadra +0,9 °C em relação ao bairro |
| Chuva | terreno baixo, cota 4,2 m · Rio Capibaribe a 347 m · 20 pedidos de drenagem em 12 meses · Defesa Civil: 4 atendimentos |
| Volta à noite | ônibus a 1 min, último 23:55 |
| Segurança no bairro | 15,7 por 1.000 moradores ("perto da mediana") |
| Pulso | 6,4/10 em 6 eixos |
| Visita | 11 verificações no dossiê; roteiro de 14 pontos (no topo: garagem e comporta, cota ~4,2 m e 20 pedidos de drenagem; pressão da água e fachada, prédio de 50 anos; internet no cômodo) |

## 4. Um anúncio sem prédio confirmado (o estado "Sem leitura")

Para mostrar "Sem leitura" como estado inteiro, os protótipos usam um quarto item do caderno, **sem endereço**: "Apartamento 2 quartos · Casa Forte", compra, R$ 690.000, 66 m², condomínio R$ 780, IPTU R$ 154 com período a confirmar, rua não informada no anúncio. É o que o app mostra quando a pessoa cola um link e ainda não confirmou o prédio: sol, sossego, a pé, obras e escrituras ficam "Sem leitura" e fora de qualquer média, e a ação é "Confirmar prédio".

## 5. Casos de "Sem leitura" vistos no app

- Prédio não confirmado: placar de sol e de sossego sem leitura (`PlacarHeroi5Segundos`).
- Pulso da quadra, eixo "Custo conhecido", quando o anúncio não traz preço nem condomínio (captura `10-dossie-exemplo-como-abre`).
- Escrituras do prédio com menos de 3 transmissões em 36 meses (Viena).
- Condomínio por m² contra prédios da mesma idade: pede 5 imóveis no caderno.
- Potencial construtivo do vizinho: "Sem leitura publicada nesta área ainda" (hub, feature "Ficha viva do edifício").
