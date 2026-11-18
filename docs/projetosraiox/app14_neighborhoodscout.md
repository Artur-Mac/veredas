# app14 — NeighborhoodScout

Coleta: 17/11/2026. Fontes: `neighborhoodscout.com` (home, `/about-the-data/`, `/about-the-data/real-estate`, `/about-the-data/demographics`, `/about-the-data/crime-rates`, `/about-the-data/trends-and-forecasts`, `/get-started/choose-subscription-plan`, `/match`, `/create`).

## 1. Identificação da Solução

- **Nome:** NeighborhoodScout. Hoje sob **Cotality (ex-CoreLogic)**.
- **URL:** https://www.neighborhoodscout.com.
- **Mercado:** Estados Unidos.
- **Público-alvo:** comprador e investidor pessoa física, corretor, e enterprise (API/bulk).
- **Proposta central:** **relatório padronizado de vizinhança** com **640 estatísticas** por endereço, em **seis categorias**, mais uma **previsão de valorização de 3 anos** e uma **busca multicritério de até 680 filtros**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 O relatório
- **640 estatísticas por relatório**, construídas sobre **+600 elementos de dado**.
- Seis categorias:
  1. **Visão geral**
  2. **Imóveis** (valores, aluguel, idade, tipo)
  3. **Economia e demografia**
  4. **Criminalidade**
  5. **Escolas** (nota por escola pública)
  6. **Tendências e previsões**

### 2.2 A unidade de análise: micro-vizinhança
- **218.000 micro-vizinhanças** nos EUA — não bairro censitário, não CEP: um recorte próprio, menor.
- O argumento é que a variação **dentro** do bairro é maior que entre bairros.
- Crime: **9,4 milhões de incidentes** de **+18.000 agências**, processados por "centenas de algoritmos espaciais" para produzir **risco comparável nacionalmente** — inclusive distinguindo **taxa de crime** de **risco de crime** (ajustado por população flutuante e por exposição).

### 2.3 Scout Vision — previsão de valorização
- Previsão de **3 anos** (5 anos no enterprise).
- Declara **até 90% de acerto** (na direção, não no valor).
- **23 modelos**, **+200 variáveis**, *backtest* de **16 anos**.

### 2.4 Busca multicritério (Match / Create)
- **122 a 680 critérios** selecionáveis: preço, aluguel, idade, criminalidade, escola, demografia, tendência.
- O resultado é uma lista de **micro-vizinhanças** que atendem, não de imóveis.
- É o "inverso" da busca tradicional: você descreve o lugar, não o imóvel.

### 2.5 Precificação
| Produto | Preço |
|---|---|
| Relatório avulso | **US$ 30** |
| Pro Lite | **US$ 112,50/mês** (anual) |
| Pro | **US$ 202,50/mês** |
| Pro Plus | **US$ 360/mês** |
| Enterprise | API / bulk file |

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** endereço, CEP, cidade; ou critérios no Match/Create.

**Fontes cruzadas:** censo e estimativas populacionais, registros de imóvel e transações, **18.000 agências policiais**, dados de escola (NCES e estaduais), dados econômicos (BLS), e modelos próprios de previsão.

**Artefato final:** relatório padronizado (tela e PDF), lista de micro-vizinhanças, e no enterprise arquivo/API.

## 4. Mecânica de UI/UX e Visualização

- **Relatório com sumário de uma página** e seis seções fixas — o usuário aprende a ler uma vez e lê sempre igual.
- **Percentil nacional e local** lado a lado ("melhor que X% do país", "melhor que Y% do estado").
- **Gráfico de tendência de 10 anos + previsão de 3** no mesmo eixo, com a previsão visualmente distinguida.
- **Match/Create com sliders e chips** de critério, mostrando em tempo real quantas micro-vizinhanças sobram.
- **Mapa de calor** de criminalidade e de valorização.

## 5. Regras de Negócio e Monetização

- **Modelo:** relatório avulso barato (US$ 30) + assinatura mensal em três degraus + enterprise.
- **Gatilho:** o relatório de US$ 30 é o teste; a assinatura é para quem compara vários endereços.
- **Moat:**
  1. **218.000 micro-vizinhanças** definidas e mantidas — ativo de modelagem.
  2. **Base criminal consolidada de 18.000 agências**, normalizada nacionalmente.
  3. **Scout Vision** com *backtest* longo e acurácia declarada.
  4. **Padronização**: 640 estatísticas sempre na mesma ordem, o que cria hábito.

## 6. Aplicação Direta no VEREDA

O NeighborhoodScout é o produto mais "denso em número" do conjunto e o mais distante da postura do VEREDA (prevê valorização, pontua criminalidade). O valor está em **duas mecânicas de interface** e **uma decisão de unidade de análise**.

### 6.1 Micro-área: o VEREDA compara contra o bairro, e o bairro é grande
O VEREDA agrega em **72 bairros**. O NeighborhoodScout mostra que a variação relevante é **menor que o bairro**. Em Recife, a unidade disponível e oficial é o **setor censitário do Censo 2022** — que o VEREDA **já usa** para renda e ocupação e para densidade no Mapa Sossego.

Ação concreta: passar o "Comparado com o bairro" a comparar **contra o setor censitário** quando houver N suficiente, e contra o bairro como fallback. A frase muda de "neste bairro" para **"neste setor"**, e o número fica mais honesto. Isso é ajuste de cálculo e de rótulo, não feature nova — e melhora todos os indicadores de uma vez.

### 6.2 Busca não dominada com critérios explícitos
O `A23` ("Onde mais procurar") e o `A24` ("Compromisso doméstico") já descrevem essa busca. O NeighborhoodScout dá a **forma de interface**: chips de critério, contador de quantas áreas sobram, e a lista final **não dominada** (nenhuma opção é pior em tudo). Adaptação ao VEREDA:

> "Procurar em outro lugar — seu perfil: 7h, 30 min, até R$ X de custo mensal, com farmácia a 10 min."
> **4 áreas atendem.** Nenhuma é melhor em tudo: A ganha em tempo, B em custo, C em comércio, D em parque.

O contador ao vivo é o que faz a ferramenta parecer viva. E a lista ser **não dominada** evita o "vencedor" artificial, que é exatamente a postura do VEREDA.

### 6.3 Padronização do dossiê
640 estatísticas sempre na mesma ordem criam hábito e comparabilidade. O `Dossiê` do VEREDA já tem ordem fixa (`FichaViva` → abas). A lição é **nunca reordenar por imóvel** e **nunca esconder seção vazia**: quando não há dado, a seção aparece com "sem leitura publicada nesta área ainda". Isso já é a prática; vale explicitar como regra de produto.

### 6.4 Percentil nacional e local
O duplo percentil (país e estado) é bom; o VEREDA pode fazer **bairro e cidade**: "esta rua está no quartil alto de alagamento do bairro e no quartil médio da cidade". Dois números, mesma escala, leitura imediata.

### 6.5 O que **não** copiar
- **Previsão de valorização (Scout Vision)**: o VEREDA não prevê preço, por decisão.
- **Nota de criminalidade**: há literatura de viés socioespacial na base do Gemini e o VEREDA mantém o *branch* de crime **fora do main**. Não trazer.
- **Score de escola**: não há dado aberto equivalente com qualidade no Recife; inventar seria pior que omitir.
- **Densidade de 640 números**: o público do VEREDA precisa de 8–12 indicadores, não 640.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Comparação por setor censitário | nenhum (Censo 2022 já usado) | médio (N mínimo e fallback) |
| Busca não dominada com contador | nenhum | médio |
| Duplo percentil (bairro e cidade) | nenhum | pequeno |
| Regra "seção vazia aparece" | nenhum | pequeno |
