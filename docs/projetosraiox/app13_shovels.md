# app13 — Shovels

Coleta: 17/11/2026. Fontes: `shovels.ai` (home, `/pricing`, `/solutions/permit-database`, `/solutions/api`, `/solutions/data-feed`, `/features/gis`, `/features/charlie`, `/data/permits`, `/data/decisions`, `/data/contractors`, `/data/properties`, `/coverage`, `/data-dictionary`), `docs.shovels.ai`.

## 1. Identificação da Solução

- **Nome:** Shovels.
- **URL:** https://www.shovels.ai · docs em https://docs.shovels.ai.
- **Mercado:** **Estados Unidos** apenas.
- **Público-alvo:** construtoras, *home services*, imobiliário, seguradoras, telecom, pesquisa, e empresas de clima/energia.
- **Proposta central:** "tornar dado público realmente público" — consolidar **licenças de obra e decisões de uso do solo** de milhares de jurisdições em uma API única, com classificação por IA.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Quatro bases de dados
| Base | Conteúdo | Por que é diferente |
|---|---|---|
| **Permits** | **+202 milhões** de licenças, **+7 milhões novas por mês**, de **+2.840 jurisdições** | classificação por IA do tipo de obra, não texto bruto |
| **Decisions** | **decisões de zoneamento e uso do solo**, capturadas **até 18 meses antes** da licença sair | **o sinal antecedente** — o que está sendo pedido, não o que já foi aprovado |
| **Contractors** | **+4,13 milhões** de empreiteiros, com licença, histórico e contato | rede de quem executa |
| **Properties** | lotes, geometria e **titularidade** | o vínculo lote→pessoa |

### 2.2 A mecânica de atualização
- **Publicação nos dias 1º e 15** de cada mês.
- **5 a 10 milhões de registros** por publicação.
- **API REST** com consulta por **`geo_id`** (identificador geográfico próprio), além de filtros por data, tipo, jurisdição.
- **GIS layers** para QGIS/ArcGIS.
- **Data feed** e **Enterprise Data License** (parquet ou *table share* em Snowflake/Databricks).
- **Add-on do Google Workspace** (planilha).
- **Charlie** — agente de IA que consulta a base em linguagem natural.

### 2.3 Precificação
| Plano | Preço | Inclui |
|---|---|---|
| Free | **US$ 0** | 1 ano de histórico, 1 assento, **500 créditos/mês** |
| Basic | **US$ 599/mês** | histórico completo, 1 assento, **25.000 créditos/mês** |
| Pro | **US$ 999/mês** | até 2 assentos, **50.000 créditos/mês**, suporte dedicado |
| Enterprise | sob consulta | assentos e créditos dimensionados, EDL |

O crédito é a unidade de cobrança: cada consulta/registro consome. É um modelo que escala com uso sem cobrar por assento.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:** `geo_id`, endereço, polígono, jurisdição, janela de datas, tipo de obra.

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Licenças de obra | portais de **2.840 jurisdições** | público, fragmentado |
| Decisões de zoneamento | conselhos municipais, atas, portais | público, muito fragmentado |
| Licenças de empreiteiro | conselhos estaduais | público |
| Lotes e titularidade | assessores/condados | público |
| Classificação | **IA própria** sobre o texto da licença | derivado |

**Artefato final:** JSON/GeoJSON por `geo_id`, camada GIS, tabela em data warehouse, resposta do agente Charlie.

## 4. Mecânica de UI/UX e Visualização

- **Mapa com pontos de licença**, filtráveis por tipo e data.
- **Página de endereço/propriedade** com histórico de licença em linha do tempo.
- **Camada GIS** para sobrepor a projeto próprio — o produto entra no fluxo do analista, não o tira dele.
- **Agente Charlie** para perguntar em linguagem natural ("quantas licenças de telhado em Fort Myers em 2025?").
- **Documentação e dicionário de dados públicos**, que reduzem o custo de integração a quase zero.

## 5. Regras de Negócio e Monetização

- **Modelo:** assinatura por crédito, em degraus previsíveis; enterprise por licença de dados.
- **Gatilho:** 500 créditos grátis permitem um projeto pequeno inteiro — o usuário vê o valor antes de pagar.
- **Moat:**
  1. **2.840 jurisdições integradas** — trabalho operacional brutal de replicar.
  2. **Base `Decisions`**, que exige ler atas de conselho, não só portal.
  3. **Classificação por IA** do tipo de obra.
  4. **`geo_id`** como chave estável que amarra tudo (o análogo do DSQFL).

## 6. Aplicação Direta no VEREDA

O VEREDA já tem a base `Permits`: **licenciamento urbanístico dos últimos 24 meses**, com status (válida até, vencida, aprovada sem data, em análise) e pino no mapa. O que o Shovels mostra é o que **falta** — e é a lacuna mais valiosa do dossiê inteiro.

### 6.1 A camada "decisão antes da licença" (o gap real)
O VEREDA mostra obra **licenciada**. O Shovels mostra **pedido em análise, até 18 meses antes**. Em Recife, isso significa acompanhar:

| Fonte | O que rende |
|---|---|
| **Diário Oficial do Município (DOM Recife)** | requerimento de licença de construção, demolição, alteração de uso |
| **Processos de licenciamento urbanístico** (consulta pública) | número do processo, DSQFL, tipo, situação |
| **Reuniões do Conselho de Desenvolvimento Urbano / audiências públicas** | pedido de exceção, mudança de zoneamento, impacto de vizinhança |
| **LPUOS — outorga onerosa e transferência de potencial** | o que se pretende construir acima do gabarito básico |

Regra de produto: exibir **"pedido em análise"** com número e data, e **nunca** como obra. É a diferença entre "vai acontecer" e "alguém pediu". O VEREDA já tem a cultura da ressalva (`snapshot, não prova de obra`), então a frase é natural:

> **PEDIDO** — processo nº … pede licença de construção para este lote, protocolado em … Situação: em análise.

Isso **antecipa em até 18 meses** o que hoje só aparece depois de aprovado. É a feature que muda o valor do dossiê para quem está comprando ao lado de um terreno vazio.

### 6.2 Classificar o tipo de licença (o que o Shovels faz com IA)
Hoje o VEREDA mostra o texto da licença. O Shovels mostra que o valor está em **tipificar**: construção nova, reforma, demolição, mudança de uso, telhado, piscina. Ação: uma **tabela de tipos fechada** (10–15 categorias) e um classificador determinístico por palavra-chave no texto da licença, com revisão humana das incertas. Nunca IA generativa: é regex + lista + fila de revisão, o que mantém o determinismo do render e a auditabilidade.

Ganho direto no `MapaDoLote`: em vez de "obra", o pino diz **"demolição"** ou **"construção nova, 18 pavimentos"**.

### 6.3 Histórico de licença por lote como linha do tempo
O Shovels entrega a linha do tempo por endereço. O VEREDA tem `LinhaDoTempoEstrutural` (documento) e o licenciamento (obra), mas em telas separadas. Unificar em uma **linha do tempo do lote**: licença → obra → vistoria → laudo → interdição → reparo. É a fusão que dá ao dossiê a memória que hoje falta.

### 6.4 Um `geo_id` já existe: o DSQFL
O Shovels construiu um identificador geográfico para amarrar bases heterogêneas. O VEREDA já tem um melhor: o **DSQFL de 14 dígitos**, municipal e oficial. A recomendação é **usá-lo como chave pública de todas as camadas** e expô-lo na interface — inclusive para que outro produto possa cruzar dado do VEREDA pelo cadastro. Isso é a fundação de qualquer ecossistema.

### 6.5 O modelo de crédito como referência de preço
Se o VEREDA algum dia vender acesso a dado (não relatório), o modelo do Shovels — **free com 500 créditos, depois US$ 599/mês** — é a referência de patamar para um produto B2B de dado público consolidado. É ordens de magnitude acima do que o `market-analysis.md` projeta para B2C, e explica por que o eixo profissional (V4) é o de maior teto.

### 6.6 O que **não** copiar
- **Base de empreiteiros**: fora do escopo e com dado pessoal (CNPJ/CPF de profissional) — risco LGPD.
- **Cobertura nacional**: o VEREDA é municipal por desenho.
- **Agente de IA sobre a base**: o VEREDA não tem infraestrutura de inferência e não quer resposta não determinística.
- **Data warehouse/EDL**: o VEREDA publica arquivo estático com hash, não tabela.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Camada "pedido em análise" (DOM + processos) | **sim** (scraping do DOM e consulta de processos) | grande — é o maior item do dossiê |
| Tipificação de licença | nenhum (texto já existe) | pequeno-médio |
| Linha do tempo unificada do lote | nenhum | médio |
| DSQFL como chave pública | nenhum | pequeno |
