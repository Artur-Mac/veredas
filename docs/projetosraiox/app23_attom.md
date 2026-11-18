# app23 — ATTOM

Coleta: 17/11/2026. Fontes: `attomdata.com` (home, `/solutions/`, `/solutions/delivery/*`, `/solutions/ai-powered/valuation-analytics/*`, `/solutions/ai-powered/market-location-analytics/*`, `/solutions/ai-powered/property-risk-analytics/*`, `/solutions/ai-powered/research-tools/*`, `/solutions/ai-powered/ai-agents/*`, `/attom-nexus/`, `/data/`).

## 1. Identificação da Solução

- **Nome:** ATTOM (ATTOM Data Solutions).
- **URL:** https://www.attomdata.com.
- **Cobertura:** **+160 milhões de imóveis nos EUA**.
- **Público-alvo:** hipoteca, seguro, governo, financeiro, tecnologia, marketing, corretagem — e, desde 2025/2026, **plataformas de IA**.
- **Proposta central:** ser a **camada de dado imobiliário pronta para IA** — dado bruto, analytics, modelos e **agentes** entregues por API, bulk, nuvem e **servidor MCP**.
- **Posição declarada:** "Property Data & Intelligence — Built for AI". O produto não é mais o dado: é o **acesso governado** ao dado.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 A "Table of Data Elements"
A home organiza tudo em uma tabela pública de elementos de dado — e isso é a peça de comunicação mais útil do site:

| Grupo | Conteúdo |
|---|---|
| **Property** | características, área, quartos, ano de construção, tipo |
| **Ownership** | proprietário, ocupação, histórico de escritura, transferências |
| **Mortgage / Transactions** | hipotecas, gravames, histórico de venda |
| **Boundaries** | limites de lote com coordenadas precisas, bairros, subdivisões |
| **Foreclosure** | execução, leilão, estágio |
| **Schools** | escolas e notas |
| **Neighborhood** | demografia, renda, tempo de deslocamento |
| **Valuation** | AVM, AVM de aluguel, comparáveis |
| **Analytics** | índices de preço, tendências |
| **AI Agents** | agentes de pesquisa e geração de relatório |

### 2.2 Cinco formas de entrega
| Canal | Desenho |
|---|---|
| **Property Data API** | REST, por imóvel e por lote |
| **Bulk Data Licensing** | entrega de arquivo, incluindo *file delivery* |
| **Cloud Delivery** | **Snowflake** e **Databricks** — o dado aparece na conta do cliente |
| **MCP Server** | acesso por LLM, com autenticação, permissão, log e medição de uso |
| **ATTOM Nexus** | plataforma de **descoberta** do dado antes de contratar: cobertura, qualidade, dicionário |

### 2.3 O MCP Server em detalhe (o mais relevante para o VEREDA)
- "Camada centralizada de acesso nativo para IA": o LLM **não chama a API crua**, chama ferramentas.
- O servidor expõe **ferramentas cientes do schema** mapeadas ao dado: detalhe do imóvel, AVM, comparáveis, histórico de venda.
- Resultado é empacotado em **formato otimizado para LLM**, "melhorando precisão e consistência".
- **Governança**: autenticação, permissões, *logging* e monitoramento de uso em um ponto só.
- Compatível com **OpenAI, Anthropic e Google** — ou seja, o produto não aposta em um fornecedor de modelo.
- Justificativa econômica explícita: **elimina orquestração de API sob medida** ("developer productivity").

### 2.4 Agentes
| Agente | Função |
|---|---|
| **Data Analyst Agent** | tendências, comparação de mercados, dado agregado |
| **Property & Place Insights Agent** | pergunta livre sobre um imóvel, lote, bairro ou entorno |
| **Report Generation Agent** | transforma o dado em **relatório pronto para o cliente** |

O agente de imóvel cobre: titularidade e histórico de escritura, características, valor estimado, IPTU e histórico de imposto, escolas, pontos de interesse, **zona de alagamento e risco natural**.

### 2.5 ResiScore (o produto de "ranking de bairro")
- Nota por **setor censitário**, com **ranking percentílico dentro da metro**.
- Horizonte de **24 meses**, atualização **mensal**.
- Combina cinco sinais: **tendência, valorização, aceleração, força da previsão e volatilidade**.
- Entrega por bulk e Snowflake.

### 2.6 Neighborhood Navigator (o produto de "página de bairro")
Aplicação pronta, embutível por **iframe** ou como site com a marca do cliente. Blocos:
- **Quick Facts**: população diurna, % de dias com sol possível, deslocamento médio, mediana do ano de construção, mediana de renda domiciliar;
- resumo da comunidade, demografia, emprego e finanças, clima, escolas, **estabelecimentos próximos**, vendas recentes, valor estimado.

O bloco "Quick Facts" é a síntese: **cinco números que descrevem um lugar em uma linha cada**.

### 2.7 Outros produtos
AVM, AVM de aluguel, comparables, *school ratings*, `sales trends`, `propensity to default`, risco de terremoto, índice de tornado, **Match & Append** (enriquecer a base do cliente por endereço).

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** endereço, APN/lote, coordenada, polígono, ou a própria tabela do cliente (*match & append*).

**Fontes cruzadas:** registros públicos de condado (escritura, hipoteca, execução), assessoria de imposto, limites de lote, escolas, Censo, modelos próprios de avaliação e de risco, e dados de parceiros.

**Artefato final:** JSON por imóvel, tabela em Snowflake/Databricks, arquivo em lote, resposta de agente, relatório gerado, página de bairro embutida.

## 4. Mecânica de UI/UX e Visualização

- **Tabela de elementos de dado** como página de produto: o comprador vê o inventário antes de falar com vendas.
- **Nexus** como "teste antes de comprar": cobertura e qualidade visíveis.
- **Quick Facts** em cinco linhas — o formato de resumo de lugar.
- **Página de bairro pronta e embutível**, com a marca do cliente.
- **Agente com resposta citando o dado** ("grounded"), não geração livre.
- **Uma pergunta, uma resposta**: "Ask Any Property Question".

## 5. Regras de Negócio e Monetização

- **Modelo:** licença de dado por cobertura e canal (API, bulk, nuvem), assinatura de analytics, agentes, e *white label* de página de bairro.
- **Gatilho:** o cliente já tem o dado espalhado em 3.000 condados; o ATTOM vende **normalização + entrega + governança**.
- **Moat:**
  1. **160 milhões de imóveis** com histórico de escritura e hipoteca.
  2. **Cinco canais de entrega** — inclusive dentro do warehouse do cliente.
  3. **Nexus**, que remove o risco percebido da compra.
  4. **MCP com governança**, que cria posição nova de distribuição.
  5. **Presença na mídia** como fonte de dado habitacional.

## 6. Aplicação Direta no VEREDA

O ATTOM é o **maior fornecedor de dado imobiliário dos EUA** e, por isso mesmo, define o que o VEREDA **não** precisa ser. Mas três peças são aproveitáveis imediatamente.

### 6.1 A "Table of Data Elements" é a página que falta no VEREDA
O VEREDA tem **2,3 GB de camadas** e nenhuma página que diga, em uma tabela, **o que existe, de que fonte, com que granularidade e de que data**. O ATTOM publica isso como produto.

Proposta: uma página `Dados` (pública, estática, sem servidor) com uma linha por camada:

```
CAMADA              GRANULARIDADE   FONTE              DATA       COBERTURA
Lotes                lote (DSQFL)    Prefeitura         2026-03    6 áreas
Edifícios            edificação      Índice VEREDA      2026-10    7.206 / 72 bairros
Uso do solo (LPUOS)  zona            Lei municipal      2019       6 áreas
ITBI                 transação       Prefeitura         2026       6 áreas
Ônibus (GTFS)        linha/parada    Grande Recife      2026-09    RMR
```

Isso substitui a explicação oral por **inventário auditável**, e é a mesma peça que o `A17`/`R19` pede. É texto e tabela: esforço pequeno, efeito grande.

### 6.2 MCP: o desenho de governança, não só o endpoint
O `R29` da síntese propõe um servidor MCP de leitura. O ATTOM mostra o que **precisa vir junto** para não virar brinquedo:

| Requisito | Por que |
|---|---|
| **Ferramentas cientes do schema** (não "execute SQL") | o modelo não inventa campo |
| **Formato otimizado para LLM** (resumo + unidade + fonte) | reduz alucinação |
| **Autenticação, permissão, log e medição por consumidor** | sem isso não há contrato |
| **Compatível com mais de um provedor** | não amarra o produto a um modelo |
| **Resposta sempre com fonte e data** | é a regra editorial do VEREDA aplicada ao agente |

### 6.3 "Match & Append" é o padrão de entrada de dado do usuário
O ATTOM enriquece a base do cliente casando por endereço. O VEREDA já faz isso quando o usuário digita um endereço — mas o padrão maduro é: **casar sem exigir que o usuário reformate nada**, e **devolver o que não casou**. Um caderno de imóveis colado de uma planilha deve voltar com "12 casaram, 3 não". Isso é confiança.

### 6.4 Quick Facts: cinco números, uma linha cada
Copiar o formato para a página de bairro (`R28`):

```
População diurna        18.400  (Censo 2022, setor …)
Ano mediano de construção  1987  (índice, 412 edifícios)
Deslocamento médio      31 min  (GTFS + rede, pico 7h)
Renda mediana           3,2 salários mínimos  (Censo 2022)
Área verde a 300 m      2 praças  (OSM)
```

### 6.5 O que **não** copiar
- **ResiScore (previsão de 24 meses)**: `A30`/`A31` rejeitados; previsão de valorização é veredito.
- **Titularidade nominal**: LGPD.
- **A VM e aluguel estimado**: valuation externo, bloqueado.
- **Risco de terremoto/tornado e zona de alagamento**: o VEREDA não prevê alagamento (decisão registrada).
- **160 milhões de imóveis**: escala nacional, não municipal.
- **Venda de bulk**: o VEREDA entrega leitura, não dataset.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Página `Dados` (tabela de elementos) | nenhum | pequeno |
| Requisitos de governança do MCP | nenhum | pequeno (documento) + médio (implementação) |
| Match & append com relatório de não-casados | nenhum | pequeno-médio |
| Quick Facts na página de bairro | nenhum | pequeno |
