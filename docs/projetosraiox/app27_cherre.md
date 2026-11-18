# app27 — Cherre

Coleta: 17/11/2026. Fontes: `cherre.com` (home, `/products/platform`, `/products/agent-studio`, `/products/data-submission-portal`, `/solutions/asset-managers`, `/solutions/investment-managers`, `/marketplace`, `/security`), `blog.cherre.com` (posts de 26/06/2026 e 14/07/2026).

## 1. Identificação da Solução

- **Nome:** Cherre, Inc. (Nova York). **Adquirida pela RealPage em julho de 2026** (anúncio no blog em 14/07/2026).
- **URL:** https://cherre.com.
- **Público-alvo:** **gestor de ativo** e **gestor de investimento** imobiliário — o lado institucional, com carteira de centenas de imóveis.
- **Proposta central:** "gestão de dado imobiliário feita de forma belamente simples" — **ingerir, normalizar, modelar e servir** dado de qualquer fonte para qualquer destino, com **modelo de dado universal** e **grafo de conhecimento**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 A escala declarada (que é o argumento de venda)
| Número | O que significa |
|---|---|
| **150+** | parcerias de dado e aplicação |
| **200+** | *data lakes* e warehouses conectados |
| **10 mil+** | pipelines de dado complexos |
| **100+ petabytes** | de dado único |
| **20 mil+** | **mudanças de schema em andamento** |
| **3,5 bilhões+** | pontos de dado únicos conectados |

O número mais instrutivo é o de **20 mil mudanças de schema em andamento**. É a admissão honesta do problema: o dado imobiliário **muda de forma o tempo todo**, e o produto que não trata schema como algo vivo quebra em silêncio.

### 2.2 As três funções
| Função | O que faz |
|---|---|
| **Data In** | ingestão de qualquer fonte, com **normalização, roteamento e observabilidade/validação embutidas** |
| **Data Through** | **Universal Data Model**: padroniza, transforma e modela o dado para uso |
| **Data Out** | entrega dado validado e acessível para análise, relatório e IA |

### 2.3 O Universal Data Model + Knowledge Graph
- Um **modelo canônico** de entidades imobiliárias (imóvel, edifício, unidade, locatário, contrato, avaliação, transação).
- Um **grafo** que liga as entidades entre fontes diferentes.
- O resultado é que "imóvel" significa a mesma coisa quando veio do ERP, do avaliador e do censo.

### 2.4 Agent STUDIO
- Construção e implantação de **agentes de IA sobre o dado conectado**.
- **Agnóstico de modelo**: troca de LLM sem reescrever.
- **O dado do cliente nunca é usado para treinar modelo** — declarado explicitamente.
- **Controles de acesso por agente**.
- **Humano no loop** com apoio de especialista.
- **Marketplace de "Work Packages"**: fluxos prontos, cada um com agentes coordenados.

### 2.5 Os Work Packages publicados (a lista é o produto)
| Pacote | Pergunta que responde |
|---|---|
| **OM Theses Screener** | a tese do *offering memorandum* se sustenta antes do *underwriting*? |
| **NOI Delta Explainer** | por que o NOI mudou entre períodos? |
| **Rent Roll Validator** | há inconsistência no rent roll antes de auditoria ou refinanciamento? |
| **Concession Impact Analyzer** | quanto a concessão ao inquilino custa em caixa e NOI? |
| **Capex Flagger** | há capex recorrente ou estouro escondido? |
| **Variance Analysis** | real vs. previsto, com explicação por linha |

### 2.6 Data Submission Portal
Portal para o **parceiro enviar dado** ao cliente, com validação na entrada. É o lado "fornecedor" do problema de integração.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** qualquer fonte — ERP, planilha, avaliador, provedor de dado de mercado, censo, documento.

**Fontes cruzadas:** o próprio portfólio do cliente + 150 parceiros + camadas públicas.

**Artefato final:** tabela modelada no warehouse do cliente, dashboard, relatório, resposta de agente e **conjunto de validação** (o que não casou, o que está fora de faixa).

## 4. Mecânica de UI/UX e Visualização

- **Observabilidade como feature**: o usuário vê o que entrou, o que falhou e o que mudou de schema.
- **Modelo canônico visível** — o analista sabe o que é "imóvel" na plataforma.
- **Agente com escopo**: cada agente tem permissão declarada.
- **Work package** em vez de "crie seu agente": o cliente compra **resultado**, não plataforma.
- **Humano no loop** como serviço, não como rodapé.

## 5. Regras de Negócio e Monetização

- **Modelo:** plataforma enterprise por volume de dado e número de fontes, com serviços de implantação.
- **Gatilho:** o cliente tem 40 fontes e um time de dados pequeno; o custo de manter pipelines é maior que a assinatura.
- **Moat:**
  1. **Universal Data Model** já construído para o setor.
  2. **150+ conectores** — trabalho de integração acumulado.
  3. **Grafo de conhecimento** entre fontes.
  4. **Aquisição pela RealPage** (2026), que traz distribuição e base instalada.

## 6. Aplicação Direta no VEREDA

O Cherre vende o que o VEREDA tem de mais frágil: **o modelo de dado**. O VEREDA tem 2,3 GB de camadas, 7.206 edifícios, 72 bairros e 15 telas — e nenhum **modelo canônico escrito**. Este dossiê é o argumento para escrever esse modelo antes da próxima feature.

### 6.1 O Universal Data Model do VEREDA (proposta concreta)
| Entidade | Chave | Atributos mínimos | Fontes |
|---|---|---|---|
| **Imóvel** | DSQFL 14 dígitos | área, uso, endereço, lote | cadastro municipal |
| **Lote** | DSQFL do lote | geometria, testada, esquina, área registrada vs. geométrica | cadastro + geometria |
| **Edifício** | id do índice | pavimentos, ano, unidades, tipologia | índice VEREDA |
| **Unidade** | id do edifício + número | andar, face, área privativa | anúncio / usuário |
| **Documento** | hash do conteúdo | tipo, emissor, data, validade, estado | usuário / Docket |
| **Camada** | nome + versão | fonte, data, cobertura, licença, hash | pipeline |
| **Indicador** | nome + versão do método | valor, unidade, escala, percentil, fonte | cálculo |
| **Obra** | id da licença | tipo, data, área, altura, situação | DOM / prefeitura |

Sem isso, cada tela inventa o seu vocabulário — e o produto começa a divergir de si mesmo.

### 6.2 "20 mil mudanças de schema" é um alerta, não um número de marketing
O VEREDA publica camada estática com hash (`R18`). O número do Cherre mostra que **versionar schema é rotina**, não exceção. Duas regras práticas:
1. **Toda camada carrega a versão do schema**, não só a data.
2. **Compatibilidade para trás por uma versão** — o app antigo continua lendo o dado novo até atualizar.

### 6.3 Work Packages são o formato certo de feature
O VEREDA não deve vender "plataforma de dado". Deve vender **resultados nomeados**, exatamente como o Cherre:

| Work Package do VEREDA | Pergunta |
|---|---|
| **"O que falta para fechar"** | quais documentos faltam, quais venceram (`R2`, `R3`) |
| **"Sua vista vai fechar?"** | obra licenciada no cone da fachada (`R1`) |
| **"Quanto custa morar aqui"** | custo mensal total com taxa, IPTU, condomínio (`Custo`) |
| **"Dá para construir nos fundos?"** | capacidade do lote pela LPUOS (`app24`) |
| **"E para ele?"** | interseção de isócronas (`R33`) |

Cada um é um pacote com nome, pergunta e saída — e não uma tela a mais.

### 6.4 "O dado não é usado para treinar modelo" é a frase que o VEREDA precisa
O VEREDA processa documentos pessoais **no dispositivo**. A declaração do Cherre é o padrão mínimo de quem usa IA com dado de terceiro. O VEREDA pode dizer algo mais forte:

> Seus documentos não saem do seu aparelho. Nada do que você envia é usado para treinar modelo.

Isso é vantagem competitiva real contra qualquer concorrente que processe em nuvem — e é verificável.

### 6.5 Observabilidade: mostrar o que não casou
O `Data In` do Cherre tem validação embutida. No VEREDA, isso vira uma tela pequena e valiosa: **"o que não conseguimos ler"**. Quando o usuário cola uma matrícula e o leitor extrai 6 de 9 campos, mostrar os 3 que falharam — com o motivo — é mais confiável que fingir 100%.

### 6.6 O que **não** copiar
- **Plataforma de dado para enterprise**: o VEREDA não vende infraestrutura.
- **Conectores pagos**: 150 parcerias é outro negócio.
- **Agentes de IA sobre o portfólio**: o VEREDA não tem carteira.
- **Humano no loop como serviço**: não há operação de serviço.
- **Knowledge graph completo**: para seis áreas e 7.206 edifícios, uma tabela bem feita resolve.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Escrever o modelo canônico (8 entidades) | nenhum | pequeno-médio |
| Versão de schema em cada camada | nenhum | pequeno |
| Nomear features como work packages | nenhum | pequeno |
| Declaração "não treina modelo" | nenhum | pequeno |
| Tela "o que não conseguimos ler" | nenhum | pequeno-médio |
