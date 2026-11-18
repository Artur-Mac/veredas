# app28 — Jupiter Intelligence

Coleta: 17/11/2026. Fontes: `jupiterintel.com` (home, `/products/risksignal`, `/products/adaptation-hub`, `/products/entity-modeling`, `/products/metric-engine`, `/products/compliance-hub`, `/products/mrm-accelerator`, `/science`, `/by-industry/real-estate-and-reits`, `/promise`).

## 1. Identificação da Solução

- **Nome:** Jupiter Intelligence.
- **URL:** https://www.jupiterintel.com.
- **Público-alvo:** **instituição financeira** — banco, seguradora, gestor de ativo, REIT, infraestrutura. Não é produto de consumidor.
- **Proposta central:** "**inteligência de risco de grau decisório**" — traduzir risco físico (clima e evento extremo) em **impacto financeiro** que passe pelo processo de validação de modelo do banco (**MRM**).
- **Frase que define o produto:** *"Opaque outputs don't clear MRM. Data you can't explain is data you can't approve."*

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Os sete produtos
| Produto | O que faz |
|---|---|
| **ClimateScore Global** | plataforma de avaliação de risco por ativo e portfólio |
| **RiskSignal** | risco físico por ativo e portfólio, multi-perigo |
| **Adaptation Hub** | **ROI de adaptação**: perda evitada, custo da obra, retorno |
| **Entity Modeling** | risco agregado por **entidade** (empresa, contraparte, veículo) |
| **MetricEngine** | motor de métrica configurável |
| **Compliance Hub** | resposta a divulgação regulatória |
| **MRM Accelerator** | documentação e testes prontos para **validação de modelo** |
| **Site Intelligence** | avaliação de local pontual |

### 2.2 Os números que o produto usa
- **22 mil+ valores de dado por localização** — o oposto do "um número".
- Projeções até **2100**, em **passos de 5 anos**.
- **Multi-perigo**: agudo (evento) e crônico (tendência).
- **Cobertura global**, comparável entre países.
- **Cenários de emissão** (herdados do IPCC), com "modelos globais mais recentes, validados e **de-enviesados**".

### 2.3 A escada de confiança (o núcleo do posicionamento)
O site organiza a venda em três objeções, nesta ordem:

1. **"Opaque outputs don't clear MRM"** → o dado precisa ser **explicável**.
2. **"Metrics without cashflow impact don't move boardrooms"** → o dado precisa virar **caixa**.
3. **"No proof of ROI, no execution"** → o dado precisa virar **decisão financiável**.

É uma escada de **legitimidade**, não de features — e é o inverso da lógica de "score de risco" de consumidor.

### 2.4 Adaptation Hub — a inversão mais interessante
Em vez de dizer "seu imóvel tem risco alto", o produto diz: **"quanto custa reduzir o risco e quanto você deixa de perder"**. Isso transforma risco em **orçamento**, e é o único jeito de a informação sair do relatório e virar obra.

### 2.5 Credibilidade declarada
- **20%** do Global 100 são clientes.
- **40%** dos maiores produtores de energia dos EUA.
- **3 de 5** dos maiores bancos dos EUA.
- **50%** dos maiores credores dos EUA.
- Base científica: artigos revisados por pares e relatórios próprios.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** coordenada ou conjunto de ativos (portfólio), tipo de perigo, cenário de emissão, horizonte de tempo, e o dado financeiro do cliente (valor do ativo, exposição, receita).

**Fontes cruzadas:** modelos climáticos globais (CMIP), dados de elevação, histórico de evento extremo, curvas de dano, e o **dado financeiro do cliente**.

**Artefato final:** métrica de perigo por ativo e horizonte, **perda esperada**, impacto em crédito e caixa, cenário de adaptação com ROI, e **documentação de validação do modelo**.

## 4. Mecânica de UI/UX e Visualização

- **Mapa de exposição** com horizonte temporal como controle principal.
- **Slider de cenário e de ano** — o mesmo ativo em 2030, 2050, 2100.
- **Do perigo ao número financeiro** na mesma tela (não em anexo).
- **Documentação ao lado do número**: o metodológico é parte da interface, não rodapé.
- **Comparação entre ativos** do portfólio, ordenada por perda esperada.

## 5. Regras de Negócio e Monetização

- **Modelo:** assinatura enterprise por cobertura de portfólio, com módulos (compliance, MRM) e serviços.
- **Gatilho:** obrigação regulatória + exigência do comitê de risco. Não é "curiosidade do comprador": é **conformidade**.
- **Moat:**
  1. **Base científica revisada por pares** — barreira de reputação.
  2. **Documentação de validação (MRM)** — barreira de processo, a mais difícil de copiar.
  3. **Tradução financeira** — o dado já vem na métrica que o banco usa.
  4. **Clientes-âncora** que servem de prova social regulatória.

## 6. Aplicação Direta no VEREDA

O Jupiter é o **anti-modelo** do VEREDA em conteúdo (prevê risco futuro, o VEREDA trabalha com histórico) e o **modelo** em **método**. Três lições ficam, e uma é grande.

### 6.1 A "ficha de método" por indicador é obrigatória no VEREDA
O Jupiter vende **documentação de validação** como produto (`MRM Accelerator`). O VEREDA publica número sem ficha de método: quem lê "tranquilidade 7/10" não sabe a escala, o raio, a fonte, a data nem o que ficou de fora.

Proposta: cada indicador carrega um bloco **"como este número foi feito"**, acessível por um toque, com seis campos fixos:

```
Método      distância de rede a fontes de ruído, raio 300 m
Fonte       OSM (extração 2026-09) + cadastro municipal
Escala      0–10, onde 10 = nenhuma fonte a 300 m
Fórmula     decaimento linear por distância, agregado por face
Não inclui  nível sonoro medido, obras irregulares
Atualizado  2026-10-02 · camada v3 · hash 8f2a
```

Isso é o `R18` e o `R19` levados a sério, e é o que separa "app com nota" de "leitura auditável". Também é o que o `app23` (ATTOM, tabela de elementos) pede do outro lado.

### 6.2 "De perigo a consequência" é a mesma escada do VEREDA
O Jupiter: perigo → impacto financeiro → ROI de adaptação.
O VEREDA pode fazer a versão imobiliária:

| Nível | Jupiter | VEREDA |
|---|---|---|
| 1. Fato | perigo projetado | **obra licenciada a 40 m, 18 pavimentos** |
| 2. Consequência | perda esperada | **sua vista oeste fecha em 2028** |
| 3. Ação | custo de adaptação e ROI | **o que perguntar ao vendedor / o que verificar antes de assinar** |

O nível 3 é o que falta no VEREDA hoje: a maioria das telas para no nível 2. Um bloco "o que fazer com isso" — 2 a 3 ações concretas — fecha o ciclo sem virar conselho jurídico.

### 6.3 Horizonte temporal explícito
O Jupiter nunca mostra número sem horizonte ("2050, cenário intermediário"). O VEREDA mostra "obras" sem dizer a janela. Regra: **todo dado temporal carrega a janela na etiqueta** — "obras licenciadas nos últimos 24 meses", "IPPU 2026", "GTFS de setembro de 2026".

### 6.4 O que **não** copiar
- **Previsão de risco futuro por imóvel**: decisão registrada (o VEREDA trabalha com o que aconteceu).
- **Score de risco climático**: seria veredito e alimentaria leitura catastrófica.
- **22 mil valores por local**: o VEREDA é deliberadamente pobre em número e rico em explicação.
- **Venda para banco**: outro comprador, outro ciclo.
- **Cenários de emissão**: fora do escopo municipal.

### 6.5 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Ficha de método por indicador (6 campos) | nenhum | pequeno-médio |
| Bloco "o que fazer com isso" (3 ações) | nenhum | pequeno (redação) |
| Janela temporal em toda etiqueta | nenhum | pequeno |
