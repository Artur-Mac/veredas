# app5 — First Street / Risk Factor

Coleta: 17/11/2026. Fontes: `firststreet.org` (home, `/methodology`, `/use-cases`, `/pricing/*`, `/research-library/*`), `firststreet.org/property/address/<fsid>`, `riskfactor.com` (bloqueado por erro de TLS no acesso direto — conteúdo acessado pela página de propriedade do firststreet.org).

## 1. Identificação da Solução

- **Nome:** First Street (First Street Technology, Inc.), **agora parte da MSCI**. Marca de consumidor: **Risk Factor**.
- **URL:** https://firststreet.org · https://riskfactor.com.
- **Público-alvo:** cinco frentes de enterprise — donos de ativo, gestores de ativo, **imobiliário**, bancos, corporações — mais o consumidor final via Risk Factor.
- **Proposta central:** modelagem **física e determinística** de risco climático **por imóvel**, com impacto financeiro (dano e tempo de parada), hoje e no futuro, em cobertura **global**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Perigos modelados
| Perigo | Sub-perigos |
|---|---|
| **Inundação** | fluvial, pluvial, costeira |
| **Fogo** (wildfire) | — |
| **Vento** | — |
| **Calor** | — |
| **Seca** | — |
| **Granizo** | — |
| **Qualidade do ar** | — |

### 2.2 Camadas de entrega
1. **Score de risco climático** por imóvel.
2. **Exposição por perigo** (probabilidade e severidade).
3. **Impacto financeiro**: dano estimado e **downtime** (tempo fora de operação).
4. **Projeção temporal**: hoje, durante o período de posse, e horizonte futuro.
5. **Comparação de portfólio** (enterprise).

### 2.3 Especificidade do edifício (o núcleo do produto)
A página de propriedade tem um botão **"Edit Building Details"** que abre os atributos usados no cálculo. É aqui que o produto se diferencia de um score de CEP:

- área construída, número de pavimentos;
- **tipo de fundação** e primeiro piso;
- tipo de telhado e de construção;
- ocupação e uso.

O usuário **corrige o edifício** e o risco é recalculado. O modelo não é um mapa de mancha: é uma função de atributos do imóvel.

### 2.4 APIs (três produtos distintos)
| API | Uso |
|---|---|
| **Climate Risk API** (GraphQL) | consulta por localização/ativo, retorno estruturado |
| **Enterprise API** | integração em fluxo de portfólio |
| **Raster Map API** | camada raster de perigo para análise geoespacial |

Além disso: **data feeds**, integrações e *due diligence* de ativo em nível de portfólio.

### 2.5 Versão do modelo
**Vintage 6**, publicada em **8 de outubro de 2026** — o produto versiona o modelo e comunica a mudança, o que é raro e é um ativo de confiança.

### 2.6 Pesquisa e biblioteca
- Relatórios nacionais de risco (`/research-library/national-risk-reports`).
- Metodologia de risco e perdas (`/research-library/climate-risk-and-losses-methodology`).
- Casos de uso públicos por setor.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:**
- endereço ou coordenada (global);
- atributos do edifício (opcional, para refinar);
- no enterprise, o portfólio inteiro em lote.

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Topografia e batimetria | agências governamentais, modelos digitais de elevação | público |
| Hidrologia e hidráulica | modelos físicos calibrados | privado (modelo) |
| Clima futuro | cenários de emissão (CMIP) e downscaling | público + modelagem |
| Pegada e atributos do edifício | bases de imóveis + entrada do usuário | privado |
| Curvas de dano | engenharia e literatura peer-reviewed | privado/publicado |
| Custo de reparo e downtime | dados de mercado e engenharia | privado |

**Artefato final:** score, exposição por perigo, custo esperado, série temporal, e no consumidor uma página de relatório. No enterprise, JSON/GraphQL e raster.

## 4. Mecânica de UI/UX e Visualização

- **Score grande + lista de perigos com barra**, cada um abrindo para o detalhe do modelo.
- **"Editar o edifício"** como interação central: o produto convida o usuário a corrigir o dado, o que aumenta a confiança e a precisão ao mesmo tempo.
- **Hoje / durante a posse / futuro** como três colunas — o eixo temporal é a interface.
- **Dano em dinheiro e em dias de parada**, não em probabilidade abstrata.
- **Metodologia pública e versionada**, com data.
- **Página de propriedade como demonstração** — qualquer endereço global vira exemplo.

## 5. Regras de Negócio e Monetização

- **Modelo:** enterprise first. Preço por assento/ativo/API, negociado por segmento (`/pricing/asset-owners`, `/asset-managers`, `/real-estate-enterprises`, `/banking-enterprises`, `/corporations`, `/government-enterprises`, `/integrations`).
- **Consumidor (Risk Factor):** gratuito, como canal de marca e de pressão regulatória.
- **Moat:**
  1. **Modelo físico determinístico** validado por pares — barreira científica, não de dados.
  2. **Especificidade de edifício** (fundação, primeiro piso, telhado) que nenhum score de CEP replica.
  3. **Versionamento público** do modelo.
  4. **Distribuição institucional** e now **dentro da MSCI**, que dá acesso a fluxo de capital.
  5. **Cobertura global**, que permite due diligence fora dos EUA.
- **Gatilho de conversão:** regulação e subscrição de seguro/crédito. O comprador pessoa física nunca paga; quem paga é quem tem exposição financeira repetida.

## 6. Aplicação Direta no VEREDA

O VEREDA **não pode** e **não deve** copiar o núcleo: previsão de alagamento está rejeitada (`A30`, `FEATURE-REGISTER.md`), e não há modelo hidráulico nem curva de dano para Recife. O que se aproveita é a **mecânica de produto**, que é excelente.

### 6.1 "Editar o edifício" como padrão do simulador
O `SimuladorDaUnidade` já pede andar e face. O First Street mostra que a interação deve ser **corrigir o edifício e ver a consequência mudar na hora**, não preencher um formulário. Proposta concreta:

| Campo editável | Efeito no VEREDA |
|---|---|
| andar | sol na fachada, relação com fonte de ruído, vista |
| face (3×3) | sol, ruído frontal/traseiro, vista |
| pavimentos do edifício | sombra projetada nos vizinhos e recebida |
| recuo/frente do lote | distância real até a fonte, não distância do pino |

Cada edição reescreve os cartões de insight. Isso transforma o simulador em ferramenta, não em ficha.

### 6.2 Pirâmide "score → exposição → consequência"
O First Street nunca entrega só o número: entrega score, o que compõe o score, e o que isso custa. Aplicação ao **"Se a rua alagar"** do VEREDA, respeitando a postura de histórico:

1. **Fato:** 3 registros de alagamento nesta rua desde 2014, com data e fonte.
2. **Contexto:** elevação do lote, distância até o corpo d'água mapeado mais próximo, declive.
3. **Consequência:** "no evento de 2022, a via a 200 m ficou intransitável; o desvio era por X".
4. **O que não sabemos:** sem leitura publicada de lâmina d'água para este trecho.

O quarto item é o que separa o VEREDA do First Street e é o que o First Street não faz: **dizer o que não sabe**. Manter.

### 6.3 Versionar a camada como o First Street versiona o modelo
`Vintage 6, 8 out 2026` é uma lição de governança. O VEREDA já tem `EPOCH-TRACKER.md` e SHA-256 por arquivo; falta **expor a versão na tela** ("camada de chuva, versão 2026-11, coleta 15/11/2026"). Isso responde à pergunta "de quando é esse dado?" sem o usuário precisar abrir documentação.

### 6.4 Atributos de edifício que valem pedir ao usuário
O First Street pede fundação e primeiro piso porque são o que determina dano. No VEREDA, os análogos úteis e baratos:

- **térreo é garagem ou moradia?** (define o que alaga primeiro);
- **há laje/pilotis?**;
- **o edifício tem subsolo?**;
- **a entrada fica na cota da rua ou abaixo?**

Esses quatro são perguntáveis na visita e mudam a leitura de "Se a rua alagar" sem nenhum modelo.

### 6.5 O que **não** copiar
- **Score de risco futuro por imóvel** — seria previsão, e a decisão de produto é não fazer.
- **Custo de dano em reais** — exigiria curva de dano local inexistente.
- **Cobertura global sem verificação local** — o VEREDA publica envelope de cobertura explícito.
- **Risco de fogo/seca/granizo** — irrelevantes para Recife e diluiriam o produto.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Simulador editável (andar/face/pavimentos/recuo) | nenhum | pequeno-médio |
| Pirâmide fato→contexto→consequência→lacuna | nenhum | pequeno (redação + componentes) |
| Versão da camada na tela | nenhum (já existe no manifesto) | pequeno |
| Quatro perguntas de edifício na visita | entrada do usuário | pequeno |
