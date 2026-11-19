# Índice da Documentação — VEREDA

**Current research-to-product execution programme (14 November 2026): [VEREDA Official Application and Evaluation Plan](aplicacao/VEREDA-APPLICATION-PLAN.md).** This English programme defines VE00–VE17, the application of all 217 collected PDFs, acquisition and evaluation gates, and the [reusable implementation prompt](aplicacao/EXECUTION-PROMPT.md). It supersedes conflicting historical execution priorities for this programme; existing implementation and historical evidence remain preserved. See the [epoch tracker](aplicacao/EPOCH-TRACKER.md) for actual execution status.

Este diretório concentra toda a documentação ativa, canônica e de alto valor do **VEREDA**. Documentos intermediários, relatórios de handoff operacionais e planos de épocas passadas foram organizados no arquivo morto [`../ignorar/`](../ignorar/LEIA-ME.md).

---

## 🧩 0. Método de entrega por task (`metodo/` e `planos/`)

* **[Método de entrega por task](./metodo/README.md)** — Como uma tarefa do hub vira especificação, código, PR e conclusão, com as aprovações humanas. Inclui o [fluxo](./metodo/fluxo-entrega.md), o [contexto do projeto](./metodo/contexto-projeto.md) e os [modelos](./metodo/templates/).
* **[Planos e tasks](./planos/README.md)** — Artefatos por feature e tarefa do hub.

---

## 🏛️ 1. Visão Canônica e Arquitetura do Negócio

* **[Documento Definitivo do Projeto (`VEREDA_DOCUMENTO_DEFINITIVO.md`)](./VEREDA_DOCUMENTO_DEFINITIVO.md)**  
  *Master Spec 3.0 & Avaliação Executiva:* Tese de produto, arquitetura de 3 camadas com chave cadastral `DSQFL` (14 dígitos), tese de Inteligência Artificial Epistemológica e de Proveniência, modelo de monetização por créditos e roteiro da 15ª Edição do Campus Mobile.

---

## 🏗️ 2. Arquitetura Técnica e Implementação (`plano-recife/`)

* **[Plano Recife — Catálogo de Funcionalidades e 15 Épocas](./plano-recife/README.md)**  
  A especificação técnica em vigor que rege a v1.0 do aplicativo Expo SDK 57, a cobertura espacial no Recife e os contratos de dados:
  * [`01-CATALOGO-E-RASTREABILIDADE.md`](./plano-recife/01-CATALOGO-E-RASTREABILIDADE.md) — Catálogo de requisitos e matriz de rastreabilidade.
  * [`02-EXPERIENCIA-E-CONTRATOS.md`](./plano-recife/02-EXPERIENCIA-E-CONTRATOS.md) — Contratos de tela, estados e jornada de usuário.
  * [`03-ARQUITETURA-E-DADOS.md`](./plano-recife/03-ARQUITETURA-E-DADOS.md) — Pipeline de dados, cache local e resolução espacial `DSQFL`.
  * [`04-EPOCAS-00-A-04.md`](./plano-recife/04-EPOCAS-00-A-04.md) a [`06-EPOCAS-10-A-14.md`](./plano-recife/06-EPOCAS-10-A-14.md) — Especificação detalhada das 15 épocas de desenvolvimento.
  * [`07-QUALIDADE-E-ACEITE.md`](./plano-recife/07-QUALIDADE-E-ACEITE.md) — Critérios de aceite, cobertura e suíte de testes.
  * [`09-DECISOES-E-FONTES.md`](./plano-recife/09-DECISOES-E-FONTES.md) — Decisões de arquitetura e inventário de fontes abertas.
  * [`10-CNPJ-E-OCORRENCIAS-DO-EDIFICIO.md`](./plano-recife/10-CNPJ-E-OCORRENCIAS-DO-EDIFICIO.md) — Higidez fiscal do condomínio (CNPJ 3085) e auditoria.

---

## 🧭 2B. Pivô Pós-11/11/2026, Benchmarks de 14/11 e Pasta Isolada de Negócio

> **Para rodar skills de startup sem puxar contexto do app (`src/`, GeoJSONs, PDFs e docs de outubro):** use a pasta irmã isolada **[`vereda-negocio/`](../../vereda-negocio/README.md)** na raiz pai (`/home/v/Documents/vereda/vereda-negocio/`).

* **[Estado Real da Aplicação (`VE00–VE15`)](./aplicacao/EPOCH-TRACKER.md)** e **[Runbook (`VE16`)](./aplicacao/RUNBOOK-ATUALIZACAO.md)** — Controle de execução, decisões `D001–D039`, split de payload (`D036`) e rejeição do ML de alagamento (`VE14`).
* **[Parecer Técnico Integrado](./dados/literatura/parecer-tecnico-integrado.md)** e **[Regras do CRIVO](./dados/crivo/CRIVO.md)** — Base do pivô para **Comparação como centro**, evidência com fonte/data, zero score e auditoria de 217 PDFs + validação (`validacao-defesa-civil-gtfs.md`).
* **[Mapeamento Criativo de Concorrentes e Dados (14/11/2026)](./produto/mapeamento-criativo-concorrentes-e-dados-2026-11-14.md)** — 9 concorrentes globais de contexto/decisão, 12 novas fontes de alto impacto (Censo 2022 aluguel pago & FCU, OSRM, TJPE, AVCB, PVGIS, CVM, CPRH, Ideb/QEdu) e 9 oportunidades de feature.
* **[Benchmark de Portais Imobiliários (14/11/2026)](./produto/benchmark-portais-imobiliarios-2026-11-14.md)** — Posicionamento pós-anúncio frente a QuintoAndar, Viva Real, OLX, ZAP, Zillow e Homes.com (separação Pedido × ITBI Fiscal × Locação Contratada).
* **[Benchmark de Conectividade (14/11/2026)](./produto/benchmark-conectividade-recife-2026-11-14.md)** — Teste Anatel Mosaico (48/48 no mesmo intervalo 5G), nPerf, links de fibra por endereço e estratégia pragmática offline por cômodo.
* **[Benchmark Google Earth (14/11/2026)](./produto/benchmark-google-earth-2026-11-14.md)** — Por que não pagar licença externa e seguir com bases 3D abertas locais (Edificações 3D, EMLURB, PE3D, eSIG).
* **[Fontes Prioritárias de Recife/PE (14/11/2026)](./produto/fontes-prioritarias-recife-2026-11-14.md)** — Fontes testadas e arquivadas em `docs/dados/raw/fontes-prioritarias-2026-11-14/` (Calçadas, CONVIVA, EMLURB resíduos, IEPs, ANEEL DEC/FEC, APAC/COP, maré REMO, drenagem eSIG, Ideb/CNES).

## 🔬 3. Produto, Dados Públicos e Inteligência Territorial (`produto/` — Base Histórica de Outubro)

* **[Pesquisa Extensiva de KPIs, Indicadores e Estratégia (22/10/2026)](./produto/pesquisa-extensiva-kpis-indicadores-insights-vereda.md)**  
  Tese de produto, métrica North Star (`CDAC`), guardrails anti-score/LGPD e 7 hipóteses de monetização e risco.
* **[Pesquisa de Produto Verificada (20/10/2026)](./produto/pesquisa-2026-10-20/README.md)**  
  Auditoria factual de 109 itens com fontes confirmadas sobre dados públicos municipais/estaduais, APIs pagas, fornecedores, concorrentes diretos e regulação imobiliária.
* **[Refinamento de Produto e Backlog Executável (21/10/2026)](./produto/refinamento-2026-10-21/README.md)**  
  Refinamento de proxies de dados, conectividade de visita, modelo de distribuição e backlog prioritário de evolução.

---

## 🎬 4. Roteiro e Motion Design do Pitch (`pitch/`)

* **[Roteiro Canônico Travado do Pitch](./pitch/pitch-revisado-2026-10-18.md)**  
  O texto exato da narração de 120 segundos da locução de referência (imutável).
* **[Storyboard Visual do Pitch](./pitch/storyboard.md)**  
  Quadro a quadro das 12 cenas com batidas de animação e citações literais da locução.
* **[Linguagem de Movimento (`motion-language.md`)](./pitch/motion-language.md)**  
  Regras de motion design, curvas de aceleração, hierarquia tipográfica e física da animação.
* **[Mapa de Fala Revisada](./pitch/mapa-fala-revisada.md)** & **[Plano de Montagem](./pitch/plano-montagem-roteiro-revisado.md)**  
  Metragem de tempo em segundos por parágrafo e plano de cortes de áudio/vídeo.
* **[Log de Revisão de QA (`review-log.md`)](./pitch/review-log.md)** & **[Análise de Referências](./pitch/reference-analysis.md)**  
  Histórico de auditoria quadro a quadro e catálogo de referências de movimento.

---

## 📊 5. Pesquisas de Campo e Validação de Mercado (`pesquisas-campo/`)

* **[Pesquisa Quantitativa UFPE (83 Respondentes)](./pesquisas-campo/PESQUISA_QUANTITATIVA_UFPE_83.md)**  
  Dados brutos da pesquisa com 83 potenciais usuários no campus da UFPE (base dos números citados no pitch).
* **[Validação de Mercado no Recife](./pesquisas-campo/PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md)**  
  Análise de propensão a pagar, principais dores na busca de imóveis e validação de proposta de valor.
* **[Entrevistas Qualitativas em Profundidade](./pesquisas-campo/ENTREVISTAS_QUALITATIVAS_5_CASOS.md)**  
  5 estudos de caso reais com relatos de inquilinos e compradores lesados por assimetria de informação.

---

## 🧪 6. Prototipação e Recursos Visuais

* **[`mock/`](./mock/)** — Protótipo clicável standalone em HTML e fixtures JSON dos 5 edifícios piloto do Recife.
* **[`kv/`](./kv/)** — Assets vetoriais (SVG) da marca, splash screen e cabeçalhos de apresentação.

---

## 🗄️ Arquivo Morto (`ignorar/`)

Documentos históricos superados (Era São Paulo / GeoSampa, relatórios de handoff entre agentes arquiteto/operário e logs detalhados de épocas passadas já testadas) encontram-se preservados para histórico em [`../ignorar/`](../ignorar/LEIA-ME.md).
