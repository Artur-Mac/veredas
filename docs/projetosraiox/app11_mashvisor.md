# app11 — Mashvisor

Coleta: 17/11/2026. Fontes: `mashvisor.com` (home, `/product`, `/data-methodology`, `/pricing`, `/product/market-finder`, `/airbnb-data`, `/airbnb-calculator`, `/api-plans`, `/product/marketplace`).

## 1. Identificação da Solução

- **Nome:** Mashvisor.
- **URL:** https://www.mashvisor.com.
- **Mercado:** **Estados Unidos**.
- **Público-alvo:** investidor de aluguel — tanto **longa temporada (LTR)** quanto **curta temporada (STR/Airbnb)** — e corretor/consultor que atende esse investidor.
- **Proposta central:** dado o endereço, dizer **quanto aquele imóvel rende** em cada estratégia (aluguel tradicional vs. Airbnb), com comparáveis, ocupação, diária e retorno.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Base
- **+150 milhões de propriedades** no total.
- **+6 milhões de propriedades de investimento** (as que podem ser compradas).
- **+2 milhões de comparáveis de aluguel tradicional.**
- **+2 milhões de comparáveis de Airbnb.**
- Dados de investimento e comparáveis **atualizados mensalmente**; MLS **diariamente**.
- **Ocupação calculada sobre os últimos 10 meses** de reservas.

### 2.2 As três abas de busca (o desenho central)
| Aba | O que mostra |
|---|---|
| **Investment properties** | imóveis à venda com **retorno projetado**; ao passar o mouse no mapa ou selecionar na lista, mostra **cash-on-cash return e cap rate** para LTR e para Airbnb, lado a lado |
| **Traditional rental comps** | aluguéis de longa temporada já praticados na área |
| **Airbnb comps** | diária (ADR), ocupação e receita de curta temporada na área |

O dado é sempre **comparativo e por estratégia**: a mesma casa é avaliada duas vezes.

### 2.3 Métricas
- **ADR** (diária média), **ocupação**, **receita**;
- **cash-on-cash return** e **cap rate** para cada estratégia;
- **ROI** projetado;
- **Mashmeter** — score composto que ranqueia o imóvel/mercado.

### 2.4 Ferramentas
- **Property Finder** — busca por critério de investimento.
- **Market Finder** — escolha de mercado por retorno.
- **Heatmaps** — mapa de calor de retorno e de ocupação.
- **Airbnb Calculator** — calculadora de receita de curta temporada.
- **Regulamentação de curta temporada para +500 cidades** — base própria de regras municipais.
- **API** (`/api-plans`) para integrar os dados.
- **Marketplace** — conexão com prestadores (gestão, financiamento).
- **Assistente de IA** (`/ai-assistant`).

### 2.5 Precificação
| Plano | Preço |
|---|---|
| Lite | **US$ 39,99/mês** |
| Standard | **US$ 74,99/mês** |
| Professional | **US$ 99,99/mês** |
| Enterprise | sob consulta |

(valores na cobrança anual; mensal avulso é mais caro)

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:** endereço, cidade ou critérios (preço, quartos, retorno desejado); no calculador, dados do imóvel e do financiamento.

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Imóveis à venda | MLS e portais | privado/licenciado |
| Aluguéis tradicionais | anúncios de aluguel | privado |
| Diárias e ocupação de Airbnb | dados de listagens STR | privado |
| Regras de curta temporada | legislação municipal, curada | público + curadoria |
| Financiamento | taxas de mercado | público |
| Impostos e seguro | estimativas | privado |

**Artefato final:** projeção financeira por imóvel, comparativo de estratégia, heatmap de mercado e relatório.

## 4. Mecânica de UI/UX e Visualização

- **Duas colunas por imóvel**: LTR vs. STR. A comparação é a interface.
- **Mapa com heatmap de retorno**, que transforma a escolha de bairro em escolha de número.
- **Hover no mapa → cartão com números**, sem clique.
- **Score único (Mashmeter)** para ordenar uma lista longa.
- **Calculadora com premissas visíveis** (entrada, juros, prazo, ocupação), o que permite ao usuário discordar.
- **Base de regulação como feature de retenção**: o investidor volta para checar se a cidade mudou a regra.

## 5. Regras de Negócio e Monetização

- **Modelo:** assinatura mensal em três degraus + enterprise/API.
- **Gatilho:** o usuário chega com um endereço e descobre que a estratégia A rende mais que a B — e precisa da assinatura para ver o resto.
- **Moat:**
  1. **Base de comparáveis STR** (+2 milhões), que é difícil de montar.
  2. **Base de regulação municipal curada** (+500 cidades), que é trabalho humano contínuo.
  3. **Cálculo de retorno com premissas completas**, não só preço.
  4. **Heatmap proprietário** que vira ferramenta de descoberta.

## 6. Aplicação Direta no VEREDA

O Mashvisor é de outro mercado e de outra tese (retorno financeiro), e o VEREDA não faz valuation. Ainda assim há **uma lição estrutural** e um conceito adiado que vale registrar.

### 6.1 A lição: comparar duas estratégias do mesmo imóvel
O Mashvisor não pergunta "quanto vale"; pergunta **"quanto rende em cada estratégia"**. O VEREDA pode fazer o análogo **sem dinheiro**, com o que já tem:

| Estratégia | O que o VEREDA compara |
|---|---|
| **Morar** | rotina ao destino do perfil, custo mensal conhecido, sol, ruído, rua |
| **Alugar** | o que muda: a locação é permitida pela convenção? o prédio tem regra contra temporada? a rua tem demanda de comércio? |

Ou seja: **duas leituras do mesmo edifício**, com o mesmo dado, sem preço. Isso é uma tela de comparação que hoje não existe no `Placar` (que compara imóveis, não estratégias).

### 6.2 A base de regras por edifício (o conceito adiado)
O Mashvisor mantém **regras de curta temporada para 500+ cidades**. O equivalente do VEREDA é mais fino: **regras do edifício** — a convenção e o regulamento de cada prédio dizem se pode alugar, se pode temporada, se pode animal, se pode obra em que horário.

O `LeitorDeAta` já extrai "políticas de locação" do texto. O que falta é a **agregação por edifício**, que é exatamente `A36` (correções compartilhadas), hoje adiado. O desenho correto, quando sair do adiado:

1. extração **no dispositivo**, como hoje;
2. o usuário escolhe publicar **apenas a regra derivada + artigo + data** (nunca o documento, nunca o nome);
3. revisão antes de publicar;
4. o edifício passa a ter uma ficha pública de regras: "temporada: proibida (art. 12)".

Isso é um ativo que nenhum concorrente brasileiro tem e que o Mashvisor prova ter valor de retenção. **Não implementar agora**; registrar como especificação para o `A36`.

### 6.3 Heatmap com métrica honesta
O Mashvisor usa heatmap de retorno. O VEREDA pode usar heatmap de **coisas que mede**: obras licenciadas por km², registros de alagamento por rua, densidade de comércio de rua (CNEFE), minutos até o destino. O mapa de calor deixa de ser "onde valoriza" e passa a ser "onde muda". É a mesma mecânica visual, com métrica defensável.

### 6.4 Premissas visíveis
A calculadora do Mashvisor mostra entrada, juros, prazo e ocupação. O `SimuladorPrice` do VEREDA já faz isso para financiamento (entrada 10/20/30/50%, prazo 15/20/30/35 anos, taxa BCB SGS 20774, total pago e juros). O que falta é **declarar a premissa na tela**, não só o resultado — e o VEREDA já tem a cultura de fazê-lo ("retorno assumido igual à ida e dito assim").

### 6.5 O que **não** copiar
- **Projeção de receita de aluguel**: é valuation por outro nome.
- **Mashmeter**: score composto opaco é o oposto de "Posição é Fato".
- **Base de Airbnb**: fora do escopo e com risco regulatório.
- **Assinatura mensal de dado**: o VEREDA não é terminal de dados.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Comparação "morar vs. alugar" | nenhum | médio |
| Heatmap de obras/chuva/comércio | nenhum | pequeno-médio |
| Premissas visíveis no simulador | nenhum | pequeno |
| Base de regras por edifício | `A36` (adiado) | grande, bloqueado por decisão |
