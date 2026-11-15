# Adjacent Markets & Scalability Assessment: Brasil (Capitais, B2G e Relocation)

**Phase:** 3 — Market Research (Wave 1, Agent A4)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** High

**Data de referência:** 15 de novembro de 2026  
**Escopo:** Verificação empírica da tese de escalabilidade geográfica multirregional do VEREDA (`docs/VEREDA_DOCUMENTO_DEFINITIVO.md`, §1.4) e viabilidade econômica/operacional dos mercados adjacentes (B2G/CPSI, *Corporate Relocation*/Universitário e API/MCP B2B) para uma equipe enxuta operando em ritmo de 10–20 h/semana.

> **Classificação de Evidências usada neste relatório:**
> - **Tier 1 (Primária / Oficial):** Portais oficiais de dados abertos, legislação federal/municipal, repositórios governamentais e medições diretas no código-fonte/dados do repositório VEREDA.
> - **Tier 2 (Institucional / Observatórios / Imprensa Especializada):** Levantamentos de institutos de pesquisa, observatórios de compras públicas, hubs GovTech e veículos econômicos com citação nominal de números.
> - **Tier 3 (Mercado / Comercial / Referência):** Tabelas públicas de preços de APIs concorrentes, estimativas setoriais de ticket B2B sem tabela aberta e documentação técnica da comunidade.
> - **`DATA GAP`:** Informação não confirmável de forma conclusiva via busca indexada sem inspeção autenticada, download direto de shapefile/CSV ou resposta formal via LAI/e-SIC.

---

## Sumário Executivo (Veredito Direto)

1. **A tese de "escalabilidade fácil por dados abertos para médias e grandes cidades do Brasil" é empiricamente falsa.** [Data] Das 7 capitais-alvo analisadas além do Recife (SP, RJ, BH, Curitiba, Porto Alegre, Fortaleza e Salvador), **apenas Porto Alegre e São Paulo** possuem cobertura minimamente comparável para os pilares centrais do dossiê VEREDA (IPTU + ITBI + licenciamento/obras + edificações/alturas + GTFS) — e ainda assim com **schemas incompatíveis, formatos heterogêneos (XLSX, ArcGIS REST, WFS, CKAN, HTML scraping) e armadilhas semânticas graves**. As outras cinco falham em camadas críticas: **RJ e BH bloqueiam microdados individuais de IPTU/ITBI**; **Curitiba fecha IPTU, ITBI e alvarás de construção** (o CSV público de "alvarás" é apenas alvará comercial); **Fortaleza** abre IPTU/ITBI/Defesa Civil, mas fecha alvarás de construção e não confirma 3D; e **Salvador** é um deserto quase completo de dados abertos programáticos.
2. **O custo de engenharia já medido no Recife desmente a ideia de "adaptação direta".** [Data] Só para operar em Recife (inicialmente em 5 bairros com qualidade auditada), o repositório já acumulou **10.761 linhas de código de pipeline (`scripts/dados/`)**, sendo **1.963 linhas apenas em `construir-indice-recife.mjs`**. Mesmo com essa dedicação extrema, **42,2% dos prédios do piloto não têm volume solar validado** (Madalena ficou sem cobertura solar distribuída) e os registros de alagamento da Defesa Civil (2020–2024) renderam apenas **20 linhas com data recuperável em 7 ruas** (`docs/dados/literatura/parecer-tecnico-integrado.md`). [Estimate] Replicar isso por município sob ritmo de 10–20 h/semana significa **3,5 a 6 meses por capital viável** — e inviabilidade total em cidades médias sem portal CKAN.
3. **B2G via CPSI (LC 182/2021) não é motor de escala para um time sem histórico corporativo.** [Data] Desde 2021 até meados de 2026, o Brasil inteiro acumulou **~191 editais e 293 contratos de CPSI** — dos quais **menos de 40 editais partiram de prefeituras** entre 5.570 municípios (Observatório do CPSI / Migalhas, Tier 2). O ciclo de vendas é de **6 a 18 meses**, **57% das empresas vencedoras de inovação faturam > R$ 4,8 milhões/ano** (Tier 2), e editais municipais exigem CNPJ regular, CNDs completas (Federal, Estadual, Municipal, FGTS, CNDT) e entrega voltada à dor da prefeitura (arrecadação/fiscalização), não à auditoria de anúncios para inquilinos. *Uso recomendado:* apenas financiamento tático não-dilutivo local (ex.: prêmio MVP de R$ 50 mil no E.I.T.A! Recife ou FACEPE), nunca tese principal de negócio.
4. ***Corporate Relocation* em Recife/Porto Digital é um nicho pequeno demais como canal pago B2B.** [Data] [Estimate] Embora o Porto Digital tenha atingido **541 empresas e 24.079 colaboradores em 2025** (+2.528 postos sobre 2024, Tier 2), a expansão de talento apoia-se fortemente em formação local (UFPE >40 mil alunos, Embarque Digital) e trabalho híbrido/remoto; a imigração corporativa real com auxílio-moradia restringe-se a contratações pontuais de seniores/executivos (ordem de dezenas a poucas centenas/ano). O público universitário calouro de fora (via Sisu) tem dor real, mas **baixíssima disposição a pagar (WTP)** — serve como **canal orgânico de aquisição B2C**, não como receita B2B.
5. **APIs/MCPs de dados urbanos de 1 cidade têm *willingness to pay* quase nulo no B2B.** [Data] [Opinion] Bancos, seguradoras e fundos (que pagam R$ 30 mil a >R$ 300 mil/ano) exigem **cobertura nacional**, AVM calibrado em preços reais, certidões cartoriais/ONR, SLA e conformidade LGPD/ISO — terreno ocupado por DataZAP, Geofusion/Cortex, Neoway/B3 e BigDataCorp (R$ 0,04–0,14/chamada). Em SP, onde os dados são abertos, wrappers comerciais já estão comoditizados a **R$ 49/mês (`iptuapi.com.br`)** ou gratuitos (`itbisp.com`).

---

## 1. Geographic Scalability Stress-Test (Matriz de Dados & Schemas)

A especificação do VEREDA (`docs/VEREDA_DOCUMENTO_DEFINITIVO.md`, linha 72) afirma que a arquitetura centrada no `DSQFL` de Recife *"se adapta diretamente ao `SQL` (Setor-Quadra-Lote) de São Paulo ou inscrições imobiliárias de outras capitais"*. A verificação empírica dos portais oficiais das 7 capitais-alvo mostra uma realidade drasticamente diferente.

### 1.1 Matriz Comparativa: Disponibilidade Real e Granularidade (Recife vs. 7 Capitais-Alvo) `[Data]`

| Cidade / Portal Principal | Chave Cadastral & CRS | 1. IPTU (Lote / Unidade) | 2. ITBI (Transação / Lote) | 3. Alvarás de Construção / Obras | 4. Ocorrências de Alagamento | 5. Edificações 3D / Alturas | 6. GTFS (Transporte Público) | Veredito de Compatibilidade |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Recife (Baseline)**<br>`dados.recife.pe.gov.br` (CKAN) + ESIG | `DSQFL` (14 dígitos) + `CLOGRACODI`<br>SIRGAS 2000 UTM 25S / WGS84 | **Apto c/ atrito**<br>CSV/CKAN por unidade (413,6 mil–422,7 mil reg.), **sem DSQFL na tabela** (join espacial lat/lon + fallback texto; 99,9% no piloto). | **Apto c/ atrito**<br>11 arquivos anuais CKAN (2016–2026); usa `valor_avaliacao` fiscal (não preço de fechamento); 630/2.688 homogêneos no piloto. | **Apto c/ atrito**<br>CSV CKAN (113,3 mil reg.) com `dsqfl`; exige filtro pesado de indeferidos/arquivados e deduplicação. | **Frágil**<br>Defesa Civil CKAN (2014–2024) sem geometria; no piloto 2020–2024 só 20 linhas recuperáveis (14 na mesma data adm., 7 ruas). | **Parcial**<br>ESIG `edificacoes-pavimentos` dá nº de pavimentos (não LiDAR m); **57,8% cobertos** no piloto (Madalena = 0). | **Frágil**<br>Sem feed único estável em CKAN; versões com erro de `-0,75°` e divergência de calendário exigiram fixação local. | **Baseline (10,7k LOC)**<br>Funciona porque houve curadoria manual extrema por bairro. |
| **São Paulo (SP)**<br>`geosampa` (GeoServer WFS/SHP/GPKG) + `dados.prefeitura.sp.gov.br` + SF + CGE | `SQL` (10 dígitos) / `SQCd`<br>SIRGAS 2000 UTM 23S (EPSG:31983) | **Apto**<br>CSV anual (1995–atual) por SQL no GeoSampa e espelhado na Base dos Dados (`numero_contribuinte`, área, ano, valor venal). | **Parcial (XLSX)**<br>SF publica DTIs mensais/anuais (2019+) por SQL com `valor_declarado`, mas em `.xlsx`/`.ods` (sem CKAN API; ausente da Base dos Dados). | **Parcial / Fragmentado**<br>Camadas SLCe/Sisacoe/HIS no GeoSampa (WFS), mas fragmentadas entre sistemas legados (Insper teve de construir pipeline próprio `alvaras_por_lote`). | **Parcial (Scraping)**<br>GeoSampa tem manchas estáticas; ocorrências dinâmicas ficam no **CGE** (`cgesp.org`) em HTML sem API/CSV aberto — exige *web scraping*. | **Apto (Referência)**<br>GeoSampa publica Edificações 3D + MDT/MDS **LiDAR** de alta resolução em formatos abertos (GPKG/SHP/WFS). | **Parcial (Cadastro)**<br>SPTrans fornece GTFS estático e Olho Vivo (RT) mediante cadastro de dev + termos de uso; EMTU/Metrô/CPTM separados. | **Tier A (Viável, ETL alto)**<br>Tem os dados, mas exige parsers XLSX, scraper CGE e limpeza de alvarás legados. |
| **Porto Alegre (RS)**<br>`dadosabertos.poa.br` (CKAN) + GeoPOA (ArcGIS) + ObservaPOA | Inscrição Imobiliária (`SIAT`)<br>SIRGAS 2000 UTM 22S / TM-POA | **Apto**<br>CSVs anuais (2013–2026) no DataPOA por unidade imobiliária (endereço, áreas, fração ideal, padrão, ano, valor venal, imposto). | **Apto**<br>ZIP/CSVs anuais (2020–2026) por guia/transação (inscrição, endereço, base de cálculo, % transmitido, finalidade). | **Apto**<br>`Projetos de Edificação Aprovados` (SMAMUS, últimos 10 anos) em CSV no DataPOA, distinto do CSV de alvarás comerciais. | **Parcial (Pós-2024)**<br>Manchas oficiais das cheias de maio/2024 (cota 5,35 m) no GeoPOA/ObservaPOA; série CSV de micro-alagamentos DMAE/156 = `DATA GAP`. | **Apto c/ adaptação**<br>GeoPOA/SMAMUS possui camadas de edificações com estimativa de altura por estatística zonal MDS/MDT (LiDAR). | **Apto**<br>EPTC publica GTFS estático atualizado regularmente no DataPOA (`STPoa` ônibus e lotações). | **Tier A (Melhor espelho)**<br>Única capital além de SP/Recife com IPTU+ITBI+Obras+GTFS abertos em CSV. |
| **Belo Horizonte (MG)**<br>`dados.pbh.gov.br` (CKAN) + `bhmap` (IDE OGC) + SIURBE | Inscrição Imobiliária / Índice Cadastral (`CTM`) / `CP`<br>SIRGAS 2000 UTM 23S | **Bloqueado (Massa)**<br>Sem CSV em massa por lote/unidade devido a sigilo fiscal/LGPD; apenas consulta unitária em tela (SIURBE IBED / IPTU Online). | **Bloqueado (Microdado)**<br>`relatorio-itbi` no CKAN traz apenas estatísticas agregadas por regional/período, sem transações individuais por prédio/lote. | **Apto (Referência)**<br>`Projeto de Edificação Licenciado` (SMPU) em CSV e WFS no BHMap com endereço, status, área e **nº de pavimentos**. *(Não confundir com `alvara-local-funcionamento`)*. | **Parcial (Modelado)**<br>BHMap tem **Cartas de Inundação** hidrodinâmicas (Arrudas/Pampulha) em WFS; série CSV de ocorrências de Defesa Civil/156 = `DATA GAP`. | **Parcial (`DATA GAP`)**<br>PBH/Prodabel têm LiDAR (MDE/MDS) e pavimentos em projetos licenciados, mas não há confirmação de camada 3D universal aberta em WFS. | **Apto (Referência)**<br>SUMOB/BHTRANS publica GTFS estático (convencional + suplementar) e GTFS-RT no `dados.pbh.gov.br` e MobilityDatabase. | **Tier B (Quebra T4)**<br>Excelente em obras, risco e GTFS, mas **quebra faixa de IPTU e ITBI do edifício**. |
| **Fortaleza (CE)**<br>`dados.fortaleza.ce.gov.br` (CKAN) + `mapas.fortaleza` | Inscrição Imobiliária / Quadra Fiscal (SEFIN)<br>SIRGAS 2000 UTM 24S | **Apto**<br>`dados_abertos_iptu_cadastro_fiscal.csv` em CSV direto no CKAN (SEFIN) com atributos físicos e valor venal. | **Apto**<br>`dados_abertos_itbi_transacoes_imobiliarias.csv` em CSV no CKAN com transações, valores e **lat/lon**. | **Bloqueado (Massa)**<br>Sistema *Licenciamento Digital* (SEUMA) é fechado/processual; não há dataset CSV aberto de alvarás de construção. | **Apto c/ atrito**<br>`ocorrencias_defesa_civil_2025_dados_abertos.csv` (COPDC) traz tipologia, data, endereço e bairro + GeoJSON de canais/valas. | **Parcial (`DATA GAP`)**<br>Polígonos aerofotogramétricos de edificações + curvas de nível; **não confirmado** se traz altura/pavimentos para motor solar 3D. | **Apto**<br>ETUFOR disponibiliza feed GTFS (e KMZ/XML) no portal de dados abertos; Metrofor separado. | **Tier B+ (Falta obras/3D)**<br>Forte em IPTU/ITBI/Defesa Civil, mas perde radar de obras vizinhas (150 m) e possivelmente sol 3D. |
| **Rio de Janeiro (RJ)**<br>`data.rio` (ArcGIS Hub / IPP) + `dados.rio` + Carioca Digital | `CL` / `cod_unico` / `CLNP`<br>SIRGAS 2000 UTM 23S | **Bloqueado (Lote)**<br>Data.Rio publica IPTU apenas **agregado** por logradouro, bairro, RA e AP — impossível obter faixa de IPTU do prédio. | **Bloqueado (Lote)**<br>Data.Rio publica ITBI **agregado** por mês/ano, logradouro e bairro (2010+) — inviabiliza transações do edifício. | **Bloqueado (Privado)**<br>Painel de Obras cobre apenas obras *públicas*; alvarás privados de construção ficam restritos ao Carioca Digital. | **Parcial (`DATA GAP`)**<br>Data.Rio tem cartas de suscetibilidade e elevação do mar; ocorrências operacionais do COR têm série aberta histórica não confirmada em CSV. | **Defasado (2013)**<br>Camada *Edificações (2013)* do IPP tem cota base/topo/altura (1:2.000), mas com **13 anos de defasagem**. | **Parcial (Modal)**<br>SMTR publica GTFS estático (SPPO + BRT) e GTFS-RT, mas **exclui MetrôRio, SuperVia e Barcas** em feed unificado. | **Tier C (Inviável sem privado)**<br>Agregação excessiva do Data.Rio inviabiliza os diferenciais unitários do VEREDA. |
| **Curitiba (PR)**<br>`dadosabertos.curitiba.pr.gov.br` + GeoCuritiba (IPPUC) | Indicação Fiscal (`GeoCuritiba`)<br>SIRGAS 2000 UTM 22S (EPSG:31982) | **Bloqueado**<br>Dados individuais vetados por sigilo/LGPD; portal aberto traz apenas **arrecadação orçamentária agregada** do IPTU. | **Bloqueado**<br>Sem base aberta de transações por lote/imóvel; apenas boletins agregados da SMF. | **Bloqueado (Armadilha)**<br>O CSV `Base de Alvarás` contém **apenas alvará comercial** (`NOME_EMPRESARIAL`, `ATIVIDADE_PRINCIPAL`); obras ficam em sistema fechado da SMU. | **Parcial (`DATA GAP`)**<br>Camadas de hidrografia/risco no GeoCuritiba, sem série CSV aberta confirmada de alagamentos rua-a-rua. | **Restrito**<br>LiDAR (`LASDATASET`) e Curitiba 3D existem no IPPUC, mas entrega bruta exige pedido institucional (`geoprocessamento@ippuc.org.br`). | **Parcial (Atrito)**<br>URBS publica via WebService / RSYNC técnico; indexação no MobilityDatabase frequentemente desatualizada/parcial. | **Tier C (Deserto fiscal/obras)**<br>Sem IPTU, sem ITBI, sem alvará de construção aberto e LiDAR travado. |
| **Salvador (BA)**<br>`dados.salvador.ba.gov.br` + `geo.salvador` + SEFAZ/SEDUR | Inscrição Imobiliária (SEFAZ) / `CGA` | **Bloqueado**<br>Sem portal CKAN municipal de microdados; IPTU/PGV apenas via consulta unitária transacional na `sefaz.salvador.ba.gov.br`. | **Bloqueado**<br>Chamado localmente de **ITIV**; restrito ao portal transacional da SEFAZ, sem download em massa. | **Bloqueado**<br>Licenciamento tramita no *Portal Simplifica* (SEDUR); exportação CSV em massa depende de pedido formal via e-SIC/LAI. | **Bloqueado**<br>CODESAL divulga apenas relatórios anuais da Operação Chuva/CEMADEC; sem CSV aberto rua-a-rua. | **Bloqueado (`DATA GAP`)**<br>Cartografia GEO Salvador exibe blocos 2D; sem camada aberta 3D/alturas confirmada para download. | **Bloqueado**<br>SEMOB integra GPS com parceiros privados (Cittamobi/Kim), mas não publica GTFS estático aberto regularmente (exige LAI). | **Tier D (Inviável via open data)**<br>Nenhuma das 6 camadas centrais possui acesso programático aberto em massa. |

### 1.2 Incompatibilidade de Schemas: Por que "Trocar `DSQFL` por `SQL`" é uma Ilusão Arquitetônica

Mesmo entre as três cidades com melhor abertura tabular (Recife, São Paulo e Porto Alegre), **não há compatibilidade de esquema**:

1. **Identificadores e Granularidades Incompatíveis:** [Data]
   - Recife usa `DSQFL` (14 dígitos) nas bases espaciais (`Lotes`, `Licenciamento`, `Edificações`), **mas não no IPTU nem no ITBI** — obrigando join espacial por ponto-em-polígono com fallback de normalização de endereço (`construir-indice-recife.mjs`).
   - São Paulo usa `SQL` (10 dígitos) no IPTU e nas planilhas de ITBI (com `SQCd` para condomínios verticais, onde múltiplas unidades compartilham o mesmo lote territorial).
   - Porto Alegre usa `Inscrição Imobiliária` (SIAT), Belo Horizonte usa `Índice Cadastral / CTM / CP`, Curitiba usa `Indicação Fiscal`.
   - **SINTER / CIB (LC 214/2025):** Embora a Reforma Tributária tenha instituído o Cadastro Imobiliário Brasileiro (CIB — "CPF do imóvel") operado pela Receita Federal/ONR, com prazo de integração para cartórios e prefeituras até dezembro de 2026 e exigência em atos a partir de **janeiro de 2027**, o CIB nasce como chave fiscal e notarial de compliance. Não há previsão legal de que o SINTER publique um dump aberto gratuito (tipo CKAN) com valores venais, ITBI e obras para aplicativos B2C.
2. **Heterogeneidade de Protocolos e Formatos:** [Data]
   - Um mesmo dado exige stacks diferentes: CKAN JSON/CSV paginado em Recife (`limit=500` hardcoded no servidor), **XLSX/ODS** de portal fazendário em SP (ITBI), **GeoServer WFS/GPKG** em SP e BH, **ArcGIS FeatureServer REST** no Rio e GeoPOA, **HTML scraping** para alagamentos do CGE em SP, **RSYNC/WebService** na URBS em Curitiba e **pedidos manuais via e-SIC/LAI** em Salvador.
3. **Armadilhas Semânticas (Falsos Positivos de Catálogo):** [Data]
   - Em Curitiba, o dataset oficialmente chamado *"Base de Alvarás"* (`dadosabertos.curitiba.pr.gov.br`) é **exclusivamente alvará comercial** (`NOME_EMPRESARIAL`, `ATIVIDADE_PRINCIPAL`), não alvará de obras.
   - Em BH, existem dois datasets separados (`alvara-local-funcionamento` vs. `Projeto de Edificação Licenciado`).
   - No Recife, o próprio repositório documentou que 14 registros de alagamento da Defesa Civil em Boa Viagem (2022) compartilham a **mesma data administrativa** (não são 14 enchentes), e que versões antigas do GTFS tinham erro de coordenada de `-0,75°` (`docs/aplicacao/VEREDA-APPLICATION-PLAN.md`).
4. **Cidades Médias Brasileiras (100 mil a 500 mil habitantes):** [Opinion]
   - Se **capitais milionárias** como Salvador (2,4M hab.), Curitiba (1,8M hab.), Rio de Janeiro (6,2M hab.) e Belo Horizonte (2,3M hab.) já bloqueiam ou fragmentam camadas essenciais do VEREDA, cidades médias (Caruaru, Campina Grande, Joinville, Ribeirão Preto, Londrina) raramente operam portais CKAN/IDE mantidos com séries históricas georreferenciadas de IPTU, ITBI, obras e 3D. **Expandir para cidades médias usando o modelo open-data atual exige parcerias privadas ou scraping jurídico-arriscado.**

---

## 2. Custo Real de Engenharia & Manutenção Multi-Cidade

O repositório do VEREDA oferece uma linha de base empírica irrefutável do esforço necessário para operacionalizar **uma única cidade** (Recife):

* **Volume real de código de dados para Recife:** [Data] **10.761 linhas de código** distribuídas em `scripts/dados/` (levantamento direto no checkout atual), incluindo `construir-indice-recife.mjs` (**1.963 linhas**), `rua/nucleo.mjs` (**1.044 linhas**) + `rua/camadas.mjs` (**908 linhas**), `camadas-inteligentes-recife.mjs` (**848 linhas**), mais pipelines especializados (`rede/` ~980 linhas, `destinos/` ~650 linhas, `chuva/` ~950 linhas, `noite/`, `transito/`, `sol/`).
* **Resultado obtido mesmo após 10,7 mil linhas:** [Data] No piloto de 5 bairros (`docs/dados/literatura/parecer-tecnico-integrado.md`), apenas **1.554 de 2.688 prédios (57,8%)** têm volume solar validado (Madalena = 0%), o livro de alagamentos alcançou **7 vias**, e a limpeza de ofertas ainda sofre com ausência de histórico deduplicado.

### Estimativa Realista de Esforço por Nova Cidade `[Estimate]`

Supondo engenheiro de dados dedicando 10–15 h/semana líquidas dentro de uma equipe part-time (10–20 h/semana):

| Fase por Nova Capital Viável (ex.: Porto Alegre ou São Paulo) | Escopo de Engenharia & Auditoria | Esforço Estimado (horas úteis) | Calendário Real (10–15 h/sem dedicadas) |
| :--- | :--- | :---: | :---: |
| **1. Descoberta, Direito de Uso e Auditoria de Schema** | Mapear portal(is), validar granularidade real, definir whitelist LGPD/ODbL, testar CRS/projeção e *edge cases* de chaves (`SQL`/`SIAT`). | 30–50 h | 3–4 semanas |
| **2. ETL de Cadastro, Fiscal e Obras** | Escrever coletores (XLSX/WFS/ArcGIS/CKAN), normalizar endereços/ruas renomeadas, cruzar polígono × cadastro, construir testes de regressão. | 80–140 h | 6–10 semanas |
| **3. Rede Pedestre, GTFS, Chuva e Solar** | Recorte Geofabrik OSM, auditoria de calendário GTFS, parser/scraper de alagamentos (ex.: CGE em SP ou manchas 2024 POA) e adaptação LiDAR/3D. | 70–120 h | 5–9 semanas |
| **4. Avaliação de Campo & Ground Truth** | Montar conjuntos equivalentes a `G-BUILDING` e `G-ROUTE` para auditar falsos vínculos antes de liberar no app. | 30–50 h | 2–4 semanas |
| **Total por Capital Tier A (SP / POA)** | **Sem contar scraping de portais de anúncios nem suporte local** | **210–360 h** | **3,5 a 6 meses / cidade** |

**Custo oculto de manutenção (OpEx de Engenharia):** [Estimate]
* Em `construir-indice-recife.mjs`, cada ano civil cria um **novo `resource_id` de ITBI** no CKAN (11 IDs listados manualmente). Prefeituras alteram colunas, domínios (`datapoa.com.br` → `dadosabertos.poa.br`) ou formatos de boletins (CGE SP) sem aviso prévio. Manter 5 capitais simultaneamente com pipelines customizados gera **dívida operacional estimada de 15–30 h/mês apenas para apagar incêndios de *schema drift***.

---

## 3. Adjacent Market 1: GovTech / B2G via CPSI (LC 182/2021) & Impacto Social

### 3.1 Realidade Empírica do CPSI no Brasil (2021–2026) `[Data]`

* **Teto legal vs. volume real contratado:**
  * A LC 182/2021 permite CPSI de até **R$ 1,6 milhão** por 12+12 meses (fase de teste) seguido de contrato de fornecimento de até **R$ 8 milhões** por 24+24 meses sem nova licitação (Tier 1: `planalto.gov.br`).
  * Segundo dados consolidados do **Observatório do CPSI** até meados de 2026 (`migalhas.com.br`, Tier 2), foram mapeados apenas **~191 editais e 293 contratos de CPSI em todo o Brasil** (somando União, Judiciário, estados e municípios).
  * **Na esfera municipal pura (prefeituras), foram identificados menos de 40 editais no país inteiro** em cinco anos (<0,7% dos 5.570 municípios brasileiros), por receio jurídico frente à Lei 14.133/2021, baixa capacidade de especificar desafios e entraves orçamentários (LDO/LOA).
* **O caso Pernambuco:** **E.I.T.A! Recife (Emprel)** acumula **16 CPSIs assinados** (prêmios de até **R$ 50 mil na fase de MVP** e potencial CPSI até **R$ 1,6 milhão**). **Desafios.PE / FACEPE** operam chamadas estaduais de subvenção na faixa global de **R$ 3 milhões** por edital distribuídos entre projetos.

### 3.2 Tamanho do Mercado, Ciclo de Vendas e Barreiras para Equipe Hackathon (10–20 h/semana)

| Critério B2G | Benchmark Verificado no Brasil | Impacto para o VEREDA (10–20 h/sem, time inicial) |
| :--- | :--- | :--- |
| **TAM Real de GovTech** | [Data] Sebrae mapeia ~3.664 empresas B2G; BrazilLAB mapeia **~470–475 GovTechs maduras** ativas (Tier 2). | O **SAM municipal por CPSI** foi de <40 editais no Brasil em ~5 anos. |
| **Perfil de quem vence** | [Data] **57% das empresas com contratos de inovação consolidados faturam acima de R$ 4,8 milhões/ano** (Tier 2). | Concorrer contra empresas estabelecidas de geotecnologia/ERP municipal exige histórico e fôlego que o time não tem. |
| **Ciclo de Vendas** | [Data] **6 a 18 meses** (média realista **8–12 meses** em prefeituras; 4–8 meses entre edital CPSI e assinatura) (Tier 2). | Incompatível com necessidade de validação rápida; um ciclo perdido atrasa o roadmap em 1 ano. |
| **Compliance e Habilitação** | [Data] Exige **CNPJ ativo**, todas as CNDs (Federal/PGFN, Estadual, Municipal, FGTS/CRF, CNDT Trabalhista), ausência no CEIS/CNEP e capacidade técnica comprovável (Tier 1). | Exige formalização societária imediata, contador, prestação de contas rígida e tempo administrativo pesado. |
| **Alinhamento de Produto** | [Opinion] Prefeituras compram **aumento de arrecadação (PGV / IPTU)**, fiscalização de obras irregulares, defesa civil e zeladoria. | Auditoria de anúncios de aluguel/compra para o cidadão **não é o que uma Secretaria de Finanças compra**. Virar B2G força um *pivot* completo. |

**Veredito B2G:** [Opinion] Usar **E.I.T.A! Recife (R$ 50 mil MVP)** ou **FACEPE** como fonte pontual de **capital não-dilutivo** caso surja desafio aderente faz sentido tático. Adotar B2G/CPSI como motor de escala multirregional é inviável para equipe part-time.

---

## 4. Adjacent Market 2: Corporate Relocation / RH & Ecossistema Universitário/Tech

### 4.1 Realidade do Porto Digital e do *Corporate Relocation* no Brasil
* [Data] **Escala do Porto Digital (Recife):** Em 2025, atingiu **541 empresas** (vs. 475 em 2024), **24.079 trabalhadores formais** (vs. 21.551 em 2024, saldo de **+2.528 vagas no ano**) e faturamento de **R$ 7,4 bilhões**.
* [Estimate] [Opinion] **O mito da importação em massa de talentos:** A estratégia estrutural do polo apoia-se em formação local (**Embarque Digital** + **UFPE** + **CESAR School**). Mesmo assumindo generosamente que **5% a 10% dos ~2.500 novos postos líquidos/ano** venham de fora da RMR, isso representa **125 a 250 profissionais/ano** (~60–125 com auxílio formal de empresa) em todo o distrito. No Brasil pós-pandemia, *relocation* B2B pago restringe-se a executivos/expatriados no eixo SP–RJ–Sul/Sudeste (já atendidos por *concierge* humano). Trabalhadores remotos (1–6 meses) usam Airbnb/Housi e têm menor retorno em diligência de ITBI/obras de 150 m.

### 4.2 O Canal Universitário (UFPE / CESAR School / UFRPE / UNICAP)
* [Data] A **UFPE** concentra >**30.000 alunos de graduação e >10.000 de pós-graduação**, com ingressantes nacionais via **Sisu**, além de alunos de fora na CESAR School, UFRPE e UNICAP.
* [Opinion] Calouros de fora sofrem a dor exata do VEREDA, **porém** têm **baixíssima WTP** e frequência de uso única. Servem como excelente **canal orgânico gratuito de aquisição B2C e ground truth**, não como receita B2B.

---

## 5. Adjacent Market 3: Monetização via API / MCP / Ecossistema Tech B2B

### 5.1 Quem Compra Dados Imobiliários e Geoespaciais no Brasil (e Por Quanto) `[Data]`

| Segmento Comprador | Incumbentes Dominantes | Preços / Modelos Observados | O que Exigem (vs. o que VEREDA tem) |
| :--- | :--- | :--- | :--- |
| **Bancos, Fintechs (*Home Equity*) & Seguradoras** | **Neoway (B3)**, **BigDataCorp**, **DataZAP (Grupo OLX)**, **Loft** | Contratos Enterprise de **dezenas a centenas de milhares de R$/ano**; APIs cadastrais a **R$ 0,04–0,14/consulta** (BigDataCorp, Tier 3). | **Cobertura nacional** (não 1 cidade), AVM calibrado em fechamento, ONR, KYC, SLA ≥99,9%, ISO 27001/DPO. |
| **Incorporadoras & Varejo (Expansão)** | **Geofusion / Cortex**, **DataZAP (Geoimovel / Dataland)** | Assinaturas B2B a partir de **~R$ 30.000 a R$ 60.000/ano** até >R$ 100k–300k/ano (Tier 3). | Mapeamento nacional de lançamentos, VGV, VSO e potencial de consumo — dados privados que o VEREDA não tem. |
| **Pequenas Imobiliárias, Corretores & Devs** | **InfoSimples**, **IPTU API (`iptuapi.com.br`)**, **ITBI SP (`itbisp.com`)** | **InfoSimples:** franquia **R$ 100/mês** (~R$ 0,03+/chamada).<br>**IPTU API (SP):** Free (10/mês), **R$ 49/mês** (500 consultas), R$ 12 avulsa (Tier 3). | Prova empírica de **comoditização severa** assim que o dado municipal é aberto. |

### 5.2 A Realidade sobre Servidores MCP & Risco ODbL
1. **WTP por API/MCP de 1 cidade:** [Opinion] Próxima de zero no curto/médio prazo (bancos/seguradoras exigem cobertura nacional; corretores não consomem MCP).
2. **Risco jurídico ODbL 1.0:** [Data] Redistribuir bases derivadas da ESIG/CKAN Recife via API/MCP em massa pode acionar *Share-Alike*, permitindo que terceiros repliquem a base resolvida.

---

## 6. Strategic Verdict on Scale Thesis

[Opinion] A afirmação do fundador — *"replicar o modelo de dados abertos do VEREDA além do Recife para outras cidades/estados médios e grandes não será um grande obstáculo"* — **é refutada pelas evidências**:
1. Das 7 capitais-alvo, **5 bloqueiam ou omitem microdados centrais** (RJ, BH, Curitiba, Fortaleza e Salvador) e cidades médias raramente têm CKAN completo.
2. Só **Porto Alegre e São Paulo** possuem base equivalente, mas exigem **210–360h (~3,5–6 meses)** de engenharia cada + **15–30h/mês** de manutenção para *schema drift* num time de 10–20 h/semana.
3. **B2G CPSI (<40 editais municipais em 5 anos)** e **Relocation no Porto Digital (~60–250 pessoas/ano de fora)** são pequenos/lentos demais para sustentar a operação.
4. **Caminho racional de escala:** (i) Profundidade no Recife (usando parcerias privadas para preço real/disponibilidade e UFPE/Porto Digital como topo orgânico B2C); (ii) Se provar retenção/WTP no Recife, expandir seletivamente para **Porto Alegre** e depois **São Paulo**; (iii) Para outras cidades, abandonar a dependência de IPTU/ITBI/alvará municipal e migrar para camadas universais nacionais + dados privados/documentais (ex.: leitura/diligência condominial, CNEFE/OSM/DEM + parceiros privados).

---

## 7. Data Gaps (Lacunas Explícitas)

1. **`DATA GAP` — Fortaleza (Atributos 3D de Edificações):** Não foi possível inspecionar os headers do shapefile/GeoJSON em `dados.fortaleza.ce.gov.br` para confirmar campo de altura (`Z`) ou pavimentos.
2. **`DATA GAP` — Belo Horizonte (3D WFS universal e série Defesa Civil/156):** Confirmado LiDAR e pavimentos em projetos licenciados, sem confirmar WFS aberto universal de edificações existentes nem CSV aberto de ocorrências 156/Defesa Civil.
3. **`DATA GAP` — Porto Alegre (Série micro-alagamentos DMAE/156):** Confirmadas manchas das cheias de maio/2024 no GeoPOA/ObservaPOA; sem confirmação de CSV aberto para ocorrências pontuais anteriores.
4. **`DATA GAP` — Rio de Janeiro (Série aberta histórica de bolsões do COR):** Não confirmado se o Data.Rio publica CSV/API pública histórica de ocorrências ponto-a-ponto do COR.
5. **`DATA GAP` — Curitiba (Polígonos exportáveis de inundação no GeoCuritiba):** Confirmada ausência de CSV de alagamentos e obras; resta checar exportabilidade direta sem login no GeoCuritiba.
6. **`DATA GAP` — Salvador (Exportação 2D/3D no GEO Salvador):** Não confirmado sem acesso interativo se os blocos de `geo.salvador.ba.gov.br` permitem download aberto com altura.
7. **`DATA GAP` — Mercado de servidores MCP imobiliários no Brasil:** Sem benchmarks públicos publicados de receita ou WTP B2B até nov/2026.

---

## Flags

**Red Flags:**
- **Premissa de escalabilidade geográfica refutada:** 5 de 7 capitais-alvo brasileiras (RJ, BH, Curitiba, Fortaleza e Salvador) bloqueiam/omitem camadas centrais (IPTU, ITBI ou alvarás de construção) usadas pelo VEREDA no Recife.
- **Armadilha de custo de engenharia e *schema drift*:** Recife consumiu **10.761 LOC** com falhas remanescentes (Madalena 0% sol; 7 vias Defesa Civil); apenas SP e POA são viáveis via dados abertos e custam **3,5–6 meses cada** para um time de 10–20 h/sem, além de **15–30 h/mês** de manutenção.
- **B2G CPSI como tese de escala é irreal:** Menos de 40 editais de CPSI em prefeituras no Brasil inteiro em 5 anos; ciclo de 6–18 meses; 57% dos vencedores faturam > R$ 4,8M/ano.
- **Comoditização de APIs de dados abertos:** Wrappers de SP já são vendidos a R$ 49/mês (`iptuapi.com.br`) ou grátis (`itbisp.com`), tornando API/MCP de 1 cidade inviável comercialmente.

**Yellow Flags:**
- **Nicho limitado de *Relocation* no Porto Digital:** +2.528 novos postos líquidos em 2025 dependem principalmente de formação local (Embarque Digital/UFPE), gerando estimado de apenas ~125–250 profissionais de fora/ano.
- **Canal Universitário sem WTP:** Calouros da UFPE/CESAR têm a dor, mas baixa renda e uso único; úteis apenas para aquisição orgânica gratuita B2C e *ground truth*.

---

## Sources

### Tier 1 (Primárias / Oficiais)
- Código e documentação VEREDA: `docs/VEREDA_DOCUMENTO_DEFINITIVO.md`, `docs/aplicacao/VEREDA-APPLICATION-PLAN.md`, `docs/dados/literatura/parecer-tecnico-integrado.md`, `scripts/dados/{construir-indice-recife.mjs,camadas-inteligentes-recife.mjs,preparar-sol-recife.py,chuva/rodar-chuva.mjs,rua/nucleo.mjs,rua/camadas.mjs}`.
- Portais municipais e federais: `dados.recife.pe.gov.br`, `esigportal2.recife.pe.gov.br`, `geosampa.prefeitura.sp.gov.br`, `dados.prefeitura.sp.gov.br`, `sptrans.com.br`, `cgesp.org`, `data.rio`, `siurb.rio`, `dados.pbh.gov.br`, `bhmap.pbh.gov.br`, `siurbe.pbh.gov.br`, `dadosabertos.curitiba.pr.gov.br`, `geocuritiba.ippuc.org.br`, `dadosabertos.poa.br`, `gis-smamus.portoalegre.rs.gov.br`, `dados.fortaleza.ce.gov.br`, `mapas.fortaleza.ce.gov.br`, `dados.salvador.ba.gov.br`, `sefaz.salvador.ba.gov.br`, `basedosdados.org`, `planalto.gov.br` (LC 182/2021), `gov.br` (SINTER/CIB, LC 214/2025), `facepe.br`, `recife.pe.gov.br` (E.I.T.A! Recife, Embarque Digital).

### Tier 2 (Institucionais / Observatórios / Imprensa Especializada)
- Observatório do CPSI / Migalhas (`migalhas.com.br`), Enap (`enap.gov.br`), BrazilLAB / Consecti (`consecti.org.br`), Observatório Sebrae Startups (`agenciasebrae.com.br`), Exame (`exame.com`), Insper (`insper.edu.br`), IEBT Innovation (`iebtinnovation.com`), Apolitical (`apolitical.co`), Porto Digital (`movimentoeconomico.com.br`), Folha de Pernambuco (`folhape.com.br`), UFPE/PROAES & CESAR School (`cesar.school`), MobilityDatabase (`mobilitydatabase.org`), ITDP Brasil (`itdpbrasil.org`).

### Tier 3 (Mercado / Comercial / Referência)
- InfoSimples (`infosimples.com`), BigDataCorp (`bigdatacorp.com.br`), IPTU API (`iptuapi.com.br`), ITBI SP (`itbisp.com`), DataZAP (`grupoolx.com.br`), Geofusion/Cortex (`geofusion.com.br`, `cortex-intelligence.com`), Neoway (`neoway.com.br`).
