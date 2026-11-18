# app7 — Place / OSPA

Coleta: 17/11/2026. Fontes: `app.ospa.place` (shell do sistema), `www.ospa.place` (home, `/recife-ia`, `/demo-sistema-sp`, `/massayo360`, `/portfolio`, `/governos`), `www.ospa.com.br/ospa-place`.

## 1. Identificação da Solução

- **Nome:** OSPA Place (produto), dentro do **Grupo OSPA** — OSPA Architecture, OSPA Capital, OSPA Place e Responsive Cities.
- **URL:** https://www.ospa.place · sistema em https://app.ospa.place.
- **Público-alvo:** **prefeitura** (planejamento urbano, licenciamento, transparência) e **mercado imobiliário/incorporação** (estudo de lote, viabilidade).
- **Proposta central:** **gêmeo digital urbano** — uma plataforma onde o território é navegável em 3D e cruzado com legislação, projetos e indicadores, com uma camada de **IA que responde sobre legislação urbana citando lei, artigo e parágrafo**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Shell do sistema (`app.ospa.place`)
A navegação exposta, sem login, revela o modelo de informação:

| Item | O que é |
|---|---|
| **Estudo do lote** | análise de um lote específico dentro do gêmeo digital |
| **Painel de estudos** | lista de estudos salvos/comparáveis |
| **Camadas** | catálogo de camadas territoriais ligáveis |
| **Filtros** | recorte por atributo (uso, zoneamento, área, etc.) |
| **Parceiros** | acesso de terceiros ao ambiente |
| **Gêmeo digital** | o viewer 3D propriamente dito |

### 2.2 Estudo do lote (o núcleo de valor para o mercado)
- Um lote no mapa 3D com seus atributos urbanísticos.
- Cruzamento com a legislação aplicável ao zoneamento.
- Potencial construtivo (o que a lei permite ali).
- Camadas de projeto e de infraestrutura no entorno.
- O produto é vendido como **instrumento de decisão de incorporação**, não de compra.

### 2.3 Recife IA (a peça diretamente comparável ao VEREDA)
`ospa.place/recife-ia` — plataforma da Prefeitura do Recife:
- **Chat de IA para consulta de legislação urbana.**
- **Cada resposta indica a lei, o artigo e o parágrafo** que fundamentam a informação. A base normativa fica acessível ao cidadão em toda consulta.
- **Gratuita**, uso via navegador (computador/tablet), cadastro rápido.
- Argumentos declarados: **segurança jurídica, agilidade, imparcialidade, IA nativa, atendimento 24 h**.
- **Em fase de testes**, com canal de feedback e e-mail institucional (`icps@recife.pe.gov.br`).
- **Roadmap declarado: "em breve, mapa territorial interativo"** — ou seja, o chat hoje, o gêmeo digital depois.

### 2.4 Implantações públicas (prova de modelo replicável)
| Cidade | Endereço |
|---|---|
| São Paulo (demo) | `ospa.place/demo-sistema-sp` |
| Recife (legislação) | `ospa.place/recife-ia` |
| Maceió | `ospa.place/massayo360` |
| Rio Verde (GO) | `rioverde360.rioverde.go.gov.br` |
| Belo Horizonte | `ospa.place/mapaempreendebh` |
| Itajaí (SC) | `360.itajai.sc.gov.br` |
| Xangri-lá (RS) | `ospa.place/xangrila` |

O padrão de nome — `<cidade>360` — é o produto empacotado por município. É um modelo de **licenciamento para governo**, não de assinatura para consumidor.

### 2.5 Base pública que viabiliza o produto em Pernambuco
O **PE3D** (Secretaria de Recursos Hídricos e Saneamento de Pernambuco, `srhs.pe.gov.br`) disponibiliza **mapeamento digital de todo o território do estado, com acesso livre**, incluindo modelos digitais de superfície e de terreno. É a base que permite o 3D estadual e que o VEREDA **não tem no repositório** (por isso a tela de "potencial de vizinho alto" mostra "Sem leitura publicada nesta área ainda").

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:**
- no estudo do lote: seleção do lote no mapa (ou inscrição/endereço);
- no chat de legislação: a pergunta em texto;
- no modo parceiro: credenciais e escopo.

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Geometria 3D do terreno e superfície | **PE3D** e equivalentes estaduais | público |
| Lotes e cadastro | prefeitura (parceria) | público sob convênio |
| Legislação urbanística | municipal (LPUOS, código de obras, planos) | público |
| Projetos e iniciativas urbanas | prefeitura / parceiros | público/privado |
| Indicadores | bases municipais e próprias | misto |

**Artefato final:** estudo de lote navegável, resposta de chat com citação normativa, e no modo governo um portal público de transparência territorial.

## 4. Mecânica de UI/UX e Visualização

- **Mapa 3D como entrada única**, com painel lateral de camadas e filtros. O usuário não navega em menus; navega no território.
- **Estudo como objeto salvo**, não consulta efêmera — o "Painel de estudos" implica comparação entre lotes ao longo do tempo.
- **Citação no corpo da resposta**: na IA, a resposta traz lei/artigo/parágrafo, não uma nota de rodapé.
- **Portal público com marca da prefeitura** (domínio do município), o que transfere confiança institucional ao produto.
- **Faseamento explícito**: chat primeiro, mapa depois. O produto não promete o que ainda não tem; escreve "em breve".

## 5. Regras de Negócio e Monetização

- **Modelo:** contrato com **prefeitura** (licenciamento de plataforma + implantação + operação), e acesso de mercado possivelmente via parceria/assinatura no ambiente do município.
- **Moat:**
  1. **Relação institucional** e capacidade de licitar/vender para governo.
  2. **Integração de base estadual** (PE3D e equivalentes) que exige articulação, não só engenharia.
  3. **Modelo 3D + legislação** no mesmo ambiente — a combinação é mais difícil que cada parte.
  4. **Portfólio de cidades** que serve de referência em licitação.
- **Limite:** o produto é orientado a **planejamento e incorporação**, não a compra de imóvel por pessoa física. Não há dossiê de comprador, não há documento de condomínio, não há rotina.

## 6. Aplicação Direta no VEREDA

O OSPA é o único player brasileiro deste conjunto com **base territorial estadual + legislação + IA citando artigo**. Ele é simultaneamente benchmark de interface, fonte de dado e alerta competitivo.

### 6.1 A resposta de legislação com citação é o padrão a bater
O `Recife IA` faz o que qualquer produto de IA urbana deveria fazer e quase nenhum faz: **cada resposta com lei, artigo e parágrafo**. O VEREDA tem a mesma postura ("Posição é Fato, Adjetivo é Veredito") e pode ir além, porque tem algo que o chat não tem: **o lote**. Proposta:

> "Neste lote (DSQFL …), a LPUOS permite gabarito de X e taxa de ocupação Y — Lei nº …, art. …, § …"

Não como chat livre, mas como **leitura determinística da lei aplicável à zona do lote**, com o texto oficial linkado. Se um dia houver chat, ele deve responder **apenas** a partir do texto legal indexado, com citação obrigatória e recusa explícita quando não houver base — nunca geração livre.

### 6.2 PE3D é a fonte que destrava a tela que hoje diz "sem leitura"
O `FEATURE-REGISTER.md` registra que "potencial de vizinho alto (PE3D MDS−MDT, LPUOS, outorga onerosa)" está bloqueado porque **as fontes não estão no repositório**. O OSPA opera exatamente sobre essa base em Pernambuco, e o PE3D é **público e gratuito**. Ação concreta:

1. Baixar PE3D (MDS e MDT) para as seis áreas habilitadas.
2. Calcular `MDS − MDT` para volumes construídos e **gabarito observado** por lote.
3. Cruzar com o gabarito **legal** da LPUOS.
4. Só então ligar a leitura de potencial de vizinho, com a ressalva de que é "capacidade legal, não obra".

Isso é aquisição de dado, não feature de interface — e é a maior alavanca isolada deste dossiê.

### 6.3 O padrão "Estudo do lote" para a tela do imóvel
O VEREDA já tem `MapaDoLote` (2D/2.5D, zoom 1–3×, pino de obra). O OSPA mostra que o valor está em **salvar e comparar estudos**. O VEREDA já tem isso no caderno, mas não no mapa. Adaptação: permitir "salvar este lote no caderno" a partir do mapa, com a mesma estrutura de anotação que já existe.

### 6.4 Camadas e filtros como catálogo explícito
O VEREDA tem `coberturaDasCamadas.ts`. O OSPA expõe "Camadas" como menu de primeira classe. Adaptação de baixo custo: transformar a cobertura em **tela de camadas** — o que existe, o que não existe, de quando é — em vez de texto de rodapé. Isso responde "por que não tem aqui?" antes da pergunta.

### 6.5 O que **não** copiar
- **3D como espetáculo**: o gêmeo digital do OSPA é caro e o VEREDA não precisa de 3D para decidir; 2.5D estimado já resolve.
- **Venda para prefeitura**: ciclo de venda longo, incompatível com o estágio do VEREDA.
- **Chat livre sobre legislação**: risco de erro jurídico; só com citação e escopo fechado.
- **Marca `360` por cidade**: o VEREDA é intraurbano.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Leitura determinística da LPUOS por zona do lote | texto da lei (público) | médio |
| Aquisição e processamento do PE3D | PE3D (público) | grande |
| Tela de camadas | nenhum | pequeno |
| "Salvar lote no caderno" | nenhum | pequeno |
