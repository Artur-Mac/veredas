# app9 — HouseCanary

Coleta: 17/11/2026. Fontes: `housecanary.com` (home, `/resources/our-avm`, `/resources/developer-tools`, `/pricing`, `/products/data-explorer`, `/products/market-insights`, `/products/bulk-property-data`, `/products/hpi-rpi-data`, `/industries/*`).

## 1. Identificação da Solução

- **Nome:** HouseCanary.
- **URL:** https://www.housecanary.com.
- **Público-alvo:** investidor imobiliário, corretor, oficial de crédito, **banco e credor**, capital markets, servicer.
- **Proposta central:** AVM (*automated valuation model*) e base de dados de imóvel com **cobertura nacional americana**, validada contra preço de listagem, e entrega por API, planilha, relatório e ferramenta.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Base de dados
- **+136 milhões de propriedades**, das quais **+114 milhões residenciais**.
- **35 anos** de histórico.
- **Status de corretagem em 50 estados** (acesso a MLS), o que é a licença que poucos têm.
- **Atualização diária**.
- **Visão computacional** aplicada a imagens para extrair atributos.
- **+75 pontos de dado** por imóvel, agregáveis em **imóvel, quadra, *block group*, CEP, MSA e estado**.

### 2.2 Produtos
| Produto | O que entrega |
|---|---|
| **AVM** | valor estimado, intervalo de confiança e *forecast* de valor até **36 meses** |
| **Rental AVM / RPI** | aluguel estimado e índice de preço de aluguel |
| **Data Explorer** | consulta interativa por imóvel/mercado |
| **Property Explorer** | ficha do imóvel |
| **Market Insights** | indicadores de mercado por geografia |
| **Bulk Property Data** | base em lote |
| **Portfolio Monitoring** | monitoramento contínuo de carteira |
| **Canary AI / Agile Insights** | camada de IA sobre os dados |
| **Brokerage Services** | corretagem (não é software) |

### 2.3 Recursos "geo" do imóvel (o detalhe mais interessante)
Entre os atributos entregues:
- **frente do lote (*frontage*)**;
- **orientação** do imóvel;
- **score de privacidade**;
- **ângulo de vista**.

Ou seja: o HouseCanary já transforma **geometria e orientação em atributo vendável**. É exatamente a família de features que o VEREDA calcula de graça com cadastro e DEM.

### 2.4 Dados de risco e contexto
Lista de camadas associadas ao imóvel: criminalidade, **inundação FEMA**, terremoto, granizo, furacão, tornado, vento, **NOD** (notice of default), escolas, *superfund*.

### 2.5 Validação do AVM
O argumento central da página é **precisão verificada de forma independente** e **benchmark pré-listagem**: o AVM é comparado ao **primeiro preço de anúncio**, não ao preço de fechamento — o que mede o erro na hora em que a decisão é tomada.

### 2.6 Precificação publicada
| Produto | Preço |
|---|---|
| Plano Basic | **US$ 190/ano** |
| Plano Pro | **US$ 790/ano** |
| Plano Teams | **US$ 1.990/ano** |
| Enterprise | sob consulta |
| API | **US$ 0,30 a US$ 6,00 por chamada**, por tipo de dado |
| Relatório avulso | **US$ 9 a US$ 25** |

O degradê de preço por chamada (0,30 → 6,00) mostra que o dado de **avaliação e risco** custa 20× o dado cadastral.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** endereço, APN, ou lote de endereços; filtros de mercado.

**Fontes cruzadas:** registros públicos de imóvel (deed, hipoteca, avaliação fiscal), MLS (via status de corretagem), imagens de satélite/rua com visão computacional, dados de risco de terceiros, transações.

**Artefato final:** JSON/planilha com valor, intervalo, aluguel, forecast, atributos físicos e de risco; relatório PDF de 1 imóvel.

## 4. Mecânica de UI/UX e Visualização

- **Ficha do imóvel com valor + intervalo + tendência** em primeiro plano.
- **Comparação com o mercado da quadra/CEP** — o imóvel nunca é mostrado sozinho.
- **Série temporal de 35 anos** como argumento de confiança.
- **Tabela densa para profissional**, não cartão para consumidor.
- **Relatório avulso barato (US$ 9–25)** como amostra grátis disfarçada: o usuário paga pouco, vê a qualidade, assina.

## 5. Regras de Negócio e Monetização

- **Modelo:** assinatura anual por assento + API por chamada + relatório avulso + enterprise.
- **Gatilho:** o relatório de US$ 9 é o teste; a API é onde o dinheiro está.
- **Moat:**
  1. **Licença de corretagem em 50 estados** — barreira regulatória, não técnica.
  2. **35 anos de histórico normalizado**.
  3. **Benchmark pré-listagem** como prova de precisão.
  4. **Custo marginal baixo** por consulta adicional.

## 6. Aplicação Direta no VEREDA

O HouseCanary é, para o VEREDA, principalmente uma **referência negativa**: ele mostra o tamanho do investimento necessário para fazer valuation de verdade (licença de MLS em 50 estados, 35 anos, visão computacional). O VEREDA decidiu não fazer isso (A21/A31 adiados), e este dossiê confirma que a decisão é correta: **preço é um negócio separado, com barreira regulatória própria**.

O que se aproveita é pequeno, mas real.

### 6.1 O "benchmark pré-listagem" como ideia, sem preço
O insight transferível é **comparar contra o momento da decisão**, não contra o fechamento. No VEREDA, o análogo não é preço: é **o que o anúncio afirma vs. o que o dado mostra**. Exemplo: o anúncio diz "vista livre"; o dado mostra obra licenciada na frente. O "benchmark pré-listagem" vira **checagem de afirmação de anúncio**, que o VEREDA já faz informalmente e pode sistematizar.

### 6.2 Atributos "geo" como lista de verificação
O HouseCanary cobra por: **frente do lote, orientação, privacidade, ângulo de vista**. O VEREDA calcula os quatro a partir de cadastro e DEM, e não cobra por eles. Vale **nomeá-los explicitamente** no dossiê:

| Atributo | Como o VEREDA obtém | Onde aparece |
|---|---|---|
| Frente do lote | geometria do lote no índice | `MapaDoLote` |
| Orientação | bússola 3×3 do simulador | `SimuladorDaUnidade` |
| Privacidade | distância à janela do vizinho mais próximo (geometria) | **novo** — cartão de insight |
| Ângulo de vista | cone da fachada + obstáculos | **novo** — ligado ao `app4` |

"Privacidade" é a única realmente nova, e é geométrica: quão perto está o vizinho da face da unidade. É calculável com os lotes e pavimentos que o VEREDA já tem.

### 6.3 A escala de preço por granularidade
O degradê US$ 0,30 (cadastral) → US$ 6,00 (avaliação/risco) é uma lição de **empacotamento**: o dado bruto é commodity, a **derivação** é o produto. Aplicação ao VEREDA: as camadas públicas podem ser gratuitas; o que se cobra (se um dia cobrar) é a **leitura** — o dossiê, o pacote para especialista, a comparação.

### 6.4 O que **não** copiar
- **AVM e faixa de valor**: decisão de produto já tomada; este dossiê reforça.
- **Risco de terceiro empacotado** (FEMA, tornado): o VEREDA não revende camada de terceiro.
- **Densidade de tabela**: o público do VEREDA é comprador, não analista.
- **Relatório de US$ 9**: preço baixo cria expectativa de volume e destrói margem com suporte.

### 6.5 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Score de privacidade geométrico | nenhum | pequeno |
| Checklist "afirmação do anúncio vs. dado" | nenhum | médio |
| Ângulo de vista | nenhum | médio (compartilha com `app4`) |
