# app12 — ClimateCheck

Coleta: 17/11/2026. Fontes: `climatecheck.com` (home, `/our-methodologies`, `/solutions`, `/risks/overview`, `/risks/*`, `/about-us`, blog e imprensa).

## 1. Identificação da Solução

- **Nome:** ClimateCheck.
- **URL:** https://climatecheck.com.
- **Mercado:** **Estados Unidos e Canadá**.
- **Público-alvo:** comprador e vendedor de imóvel, corretor, e **enterprise** (banco, seguradora, gestor, proptech).
- **Proposta central:** **nota de risco climático de 1 a 100 por imóvel**, para **cinco perigos**, projetada **até 2050**, comparada **relativamente à área de cobertura**, e entregue em relatório de **35 páginas**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Perigos pontuados
| Perigo | Detalhe |
|---|---|
| **Calor extremo** | frequência e severidade de ondas de calor |
| **Precipitação** | eventos extremos de chuva |
| **Seca** | déficit e severidade |
| **Fogo** | risco de incêndio florestal |
| **Inundação** | **costeira**, **ressaca/maré de tempestade**, **fluvial** e **pluvial** — quatro sub-perigos separados |
| (também modelados em parte do produto) | **vento**, **sísmico**, **furacão** |

### 2.2 A nota
- Escala **1 a 100**.
- **Relativa à área de cobertura** — não absoluta. É um **percentil**, não um nível físico.
- Baseada na **frequência e severidade de eventos extremos**, no passado **e projetadas até 2050**.
- Compara **múltiplos cenários de emissão** ("representando uma faixa de futuros possíveis, dependendo de quanto e quão rápido se reduz o carbono").

### 2.3 Modelagem
- **64 modelos climáticos**.
- **+170 milhões de imóveis** na América do Norte.
- **+10 bilhões de pontos de dado**.
- Combina modelos internacionalmente aceitos com **agências governamentais** e literatura acadêmica.

### 2.4 Produtos
| Produto | Entrega |
|---|---|
| **Relatório de imóvel** | 35 páginas, por perigo, com gráficos e narrativa |
| **Snapshot de portfólio** | risco agregado de uma carteira |
| **Data feed / enterprise** | dado estruturado para integrar em outro sistema |
| **API/page widget** | nota embutida em listagem |

### 2.5 Comunicação pública
- Aparições em imprensa de grande circulação (Quartz, Guardian, Washington Post, SFGate, CNN, CBC) como prova de autoridade.
- Página de time e de metodologia, com credenciais acadêmicas.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:** endereço (consumidor) ou conjunto de endereços (enterprise).

**Fontes cruzadas:**
| Camada | Origem |
|---|---|
| Modelos climáticos globais e regionais | CMIP e *downscaling* |
| Dados observados | agências governamentais (NOAA, etc.) |
| Hidrologia e topografia | modelos digitais de elevação e bases federais |
| Cobertura de vegetação e combustível | sensoriamento remoto |
| Pegada do imóvel | bases de imóveis |

**Artefato final:** nota 1–100 por perigo, gráfico de trajetória até 2050, relatório PDF de 35 páginas e feed de dados.

## 4. Mecânica de UI/UX e Visualização

- **Cinco notas empilhadas**, cada uma com barra e faixa, e uma **nota geral** no topo.
- **Gráfico de trajetória** (passado → 2050), que é o que dá a sensação de futuro.
- **"O que compõe este perigo"**: os fatores que puxaram a nota.
- **Comparação com cenários de emissão** em abas ou linhas paralelas.
- **Relatório longo (35 páginas)** como produto de valor percebido: o comprador sente que recebeu um estudo.
- **Selo embutível** em listagem.

## 5. Regras de Negócio e Monetização

- **Modelo:** freemium para consumidor (uma consulta) → relatório pago → enterprise (snapshot, feed, API).
- **Gatilho:** o comprador vê a nota de graça, mas precisa do relatório para entender e do feed para usar em escala.
- **Moat:**
  1. **64 modelos** consolidados com metodologia publicada.
  2. **Cobertura de 170 milhões de imóveis** já calculada.
  3. **Percentil relativo** — comparável e defensável, sem prometer precisão física absoluta.
  4. **Rede de imprensa** que valida a marca.

## 6. Aplicação Direta no VEREDA

O VEREDA **não pode** fazer projeção climática: `A30` (suscetibilidade a alagamento) está rejeitado, e o produto trabalha com **histórico e evento registrado**, não com futuro modelado. O ClimateCheck vale por **três decisões de apresentação** que o VEREDA pode adotar sem violar essa postura.

### 6.1 Percentil em vez de valor absoluto — e dizendo que é percentil
ClimateCheck não diz "seu risco de calor é 7,2"; diz "sua nota é 84, relativa à área de cobertura". O VEREDA já faz isso no "Comparado com o bairro", mas **não nomeia**. Ação: em cada indicador comparativo, escrever explicitamente **"posição relativa entre os X edifícios/ruas desta área"**. Isso protege contra a leitura de que o número é uma medição física.

### 6.2 "O que compõe esta nota"
O ClimateCheck mostra os fatores. O VEREDA tem a mesma exigência no `Dossiê` ("contagem, detalhe, fonte e data atrás do toque"), mas o **cartão de comparação** mostra só o resultado. Adaptação: ao tocar em qualquer indicador do `Placar`, abrir a **decomposição** — "este edifício está no quartil alto de superfície quente porque: orientação da laje, ausência de árvore no Censo, densidade construída".

### 6.3 O gráfico de trajetória, adaptado ao passado
O ClimateCheck usa passado→2050. O VEREDA pode usar **passado→hoje**, que é o que tem:

> Registros de alagamento nesta rua: 2014, 2017, 2019, 2022, 2024.
> Obras licenciadas: 2023 (2), 2024 (1), 2025 (3).
> Edifícios no índice: construção até 1980 (4), 1981–2000 (7), 2001–hoje (3).

Três séries curtas no mesmo eixo temporal contam a história da rua sem prever nada. É a versão honesta do gráfico de trajetória, e o dado já existe no `EPOCH-TRACKER` e nas camadas.

### 6.4 Relatório longo como artefato de valor
35 páginas parecem excesso, mas são **percepção de valor**: o comprador paga por volume organizado. O `Pacote para especialista` do VEREDA exporta `.md`/`.html` e é curto. Não inflar por inflar, mas **incluir os anexos**: trechos literais com página, lista de camadas usadas com versão, e o que não foi possível ler. Um pacote de 12–20 páginas bem organizadas é o alvo.

### 6.5 Cenários de emissão → cenários de decisão
O ClimateCheck mostra dois futuros paralelos. O análogo do VEREDA é o `A25` (estabilidade da decisão): **"o que mudaria sua escolha"**. A visualização é a mesma — duas colunas, "se X" / "se Y" — mas com fatos do dossiê, não com clima. Ex.: "se você trabalhar em Boa Viagem, o edifício A ganha; se em Casa Forte, o B".

### 6.6 O que **não** copiar
- **Nota de risco futuro por imóvel**: é previsão; bloqueado por decisão de produto.
- **Cenários de emissão**: sem modelo local, seria teatro.
- **Relatório de 35 páginas como produto principal**: o VEREDA vende decisão, não volume.
- **Selo de risco em anúncio**: terceiriza o veredito ao vendedor.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Nomear "posição relativa" nos indicadores | nenhum | pequeno |
| Decomposição de cada indicador | nenhum | médio |
| Linha do tempo da rua (3 séries) | nenhum | pequeno-médio |
| Pacote com anexos e versões | nenhum | pequeno |
