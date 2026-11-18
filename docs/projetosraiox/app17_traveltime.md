# app17 — TravelTime

Coleta: 17/11/2026. Fontes: `traveltime.com` (home, `/pricing`, `/isochrones`, `/travel-time-matrix`, `/h3`, `/geohash`, `/distance-map`, `/data`, `/solutions/*`), `docs.traveltime.com`.

## 1. Identificação da Solução

- **Nome:** TravelTime (Reino Unido).
- **URL:** https://traveltime.com · docs em https://docs.traveltime.com.
- **Público-alvo:** **B2B de plataforma** — portais imobiliários, marketplaces, logística, varejo, setor público, e agora **IA/LLM**.
- **Proposta central:** "a camada de inteligência de localização para IA, busca e análise" — tempo de viagem multimodal e área de alcance (isócrona) por API, com **preço fixo e chamadas ilimitadas**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Produtos de API
| API | O que faz |
|---|---|
| **Travel Time Matrix** | tempo entre N origens e M destinos, multimodal, com tráfego |
| **Isochrones** | área alcançável a partir de um ponto num tempo máximo |
| **H3** | tempo de viagem para **todas as células H3** dentro de um alcance, com máximo, mínimo e média por célula |
| **Geohash** | o mesmo, para células geohash |
| **Distance Map** | alcance por **distância** (não tempo), com partida, modo e *snapping* configuráveis |
| **Routes** | rota A→B com instruções turn-by-turn |
| **(Reverse) Geocoding** | endereço ↔ coordenada |
| **Data API** | lugares, POIs, transporte público, população, ambiente, demografia |

### 2.2 Modos
- Condução **com modelo de tráfego** (inclui **modelo de fora de pico**, anunciado em 2026).
- Transporte público **global**.
- Ciclismo.
- Caminhada.

### 2.3 O caso de uso que define o produto
A home mostra três demonstrações:
1. **"Encontre um escritório que todos os 3 possamos alcançar em 30 min"** — interseção de isócronas de três origens.
2. **Comparação de commute por transporte público** entre candidatos.
3. **Busca por tempo de deslocamento** em portal ("Hoxton 8 min de bike, Shoreditch 10…").

O item 1 é a operação que quase nenhum produto imobiliário faz e que resolve o problema mais comum de um casal escolhendo casa.

### 2.4 Integrações
Esri, Snowflake, Databricks, BigQuery, Elasticsearch, OpenSearch, Solr, Alteryx, QGIS. Saída em **JSON e Protobuf**.

### 2.5 Base de clientes e parcerias
- **Homes.com** lançou busca com IA apoiada no TravelTime.
- **Apartments.com** idem.
- **CACI** usa para *journey time insights*.
- **CARTO** lançou "TravelTime H3" dentro da sua plataforma de location intelligence.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** origem/destino (lat/lng ou id), modo, horário de partida, tempo máximo; opcionalmente, o **próprio dataset** do cliente para juntar.

**Fontes cruzadas:** rede viária com tráfego histórico e em tempo real, GTFS e dados de agências de transporte, malha cicloviária e de caminhada, POIs, dados demográficos e ambientais.

**Artefato final:** matriz de tempos, polígono de isócrona (GeoJSON), grade H3 com tempos, rota, ou enriquecimento do dataset do cliente.

## 4. Mecânica de UI/UX e Visualização

- **Iscrona como mancha colorida** sobre o mapa — leitura instantânea de "até onde dá".
- **Ranking por tempo** ("8 min, 10 min, 12 min…") em vez de distância.
- **Interseção de manchas** para decisão conjunta (o caso dos três sócios).
- **Slider de tempo** que refaz a mancha em tempo real.
- **Modo como botão**, não como configuração escondida.
- **Integração ao dataset do cliente**: a saída volta como coluna na tabela dele, não como tela nova.

## 5. Regras de Negócio e Monetização

### 5.1 Modelo de preço (o mais instrutivo do conjunto)
- **Preço fixo anual**, **sem cobrança por chamada**.
- O preço é definido por **dois fatores**: **capacidade** (throughput provisionado, medido em **HPM — hits por minuto**) e **nível de serviço** (suporte, SLA, SSO/MFA).
- **Não** se cobra por requisição, localização, rota ou resultado.
- **Plano Basic gratuito para sempre**, 120 HPM, apenas pesquisa/desenvolvimento (não comercial).
- A empresa diz explicitamente **para quem não é**: "não somos competitivos em volume baixo; se você faz poucos milhares de chamadas por mês, um provedor pay-as-you-go sai mais barato".
- Direitos de **cache, retenção e reuso** fazem parte da assinatura.

### 5.2 Por que isso importa
O cliente do TravelTime é aquele em que **a cobrança por chamada virou a restrição do produto**. É a mesma situação do VEREDA se ele algum dia servir isócronas a milhares de usuários: o custo por consulta mataria a feature.

### 5.3 Moat
1. **Modelos multimodais próprios** (não é só OSRM).
2. **Escala de cálculo** — a empresa vende throughput, não dado.
3. **Direitos contratuais** de cache e reuso, que destravam arquitetura.
4. **Integrações de dados** (Snowflake, BigQuery, Esri) que colocam o produto dentro do fluxo do analista.

## 6. Aplicação Direta no VEREDA

O VEREDA já faz o que o TravelTime vende, **no dispositivo**: `Rotina` usa RAPTOR sobre GTFS e o `DiaADia` usa distância de rede a pé. A diferença é que o VEREDA não tem uma **camada de alcance** publicada. Este dossiê dá o desenho.

### 6.1 Interseção de isócronas = `A24` (compromisso doméstico)
O caso "escritório que os três alcançam em 30 min" é literalmente o `A24`. O VEREDA pode implementar com o que tem:

1. calcular a isócrona de **casa** ao destino do perfil A;
2. calcular a de **trabalho/casa do outro** ao destino B;
3. **intersectar** os polígonos;
4. ordenar os bairros do índice dentro da interseção.

Tudo offline, com GTFS e rede. O resultado é uma tela que nenhum concorrente brasileiro tem e que resolve a objeção mais comum ("fica longe para mim, mas e para ele?").

### 6.2 Pré-computar a superfície de tempo (a lição de arquitetura)
O TravelTime tem API **H3** porque calcular tempo para célula é caro; então ele pré-computa. O VEREDA pode fazer o mesmo **sem servidor**:

- para cada destino do perfil e cada faixa horária (7h, 12h, 18h), pré-computar o tempo de viagem por **célula H3** ou por **setor censitário** das seis áreas habilitadas;
- publicar como **camada estática** (o pipeline já sabe publicar camada com hash);
- o cliente só consulta a célula do edifício: leitura O(1), sem RAPTOR no aparelho.

Isso reduz o custo de bateria e de CPU no celular — que é onde o VEREDA sofre — e mantém o determinismo do render, porque a camada é dado, não cálculo em tempo de quadro.

### 6.3 "Modelo de fora de pico" como honestidade de premissa
O TravelTime anuncia um modelo específico para fora de pico porque o tráfego muda a resposta. O `Rotina` do VEREDA já escolhe horário (7h, 20/30/45 min). A lição: **dizer na tela qual premissa de tráfego foi usada** e permitir trocar. Já existe parcialmente; falta o rótulo.

### 6.4 Preço fixo como argumento de produto
Se o VEREDA algum dia vender acesso a rotina (B2B para corretora mostrar "quanto tempo até o trabalho"), o modelo do TravelTime — capacidade + SLA, sem medidor — é mais vendável que pay-per-call, porque o cliente não tem medo de experimentar.

### 6.5 O que **não** copiar
- **Dependência de API externa**: o VEREDA é offline-first e aberto; pagar por isócrona criaria custo variável e dependência.
- **Cobertura global**: o VEREDA é Recife.
- **Rotas turn-by-turn**: fora do escopo.
- **Data API de demografia**: o VEREDA usa Censo 2022 direto.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Interseção de isócronas (A24) | nenhum | médio |
| Superfície de tempo pré-computada por célula | nenhum (GTFS + rede) | médio-grande |
| Rótulo de premissa de tráfego | nenhum | pequeno |
