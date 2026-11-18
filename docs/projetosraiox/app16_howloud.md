# app16 — HowLoud (Soundscore)

Coleta: 17/11/2026. Fontes: `howloud.com` (home, `/faqs`, `/pricing`, `/#developers`), `api.howloud.com/docs/` (OpenAPI 2.0.0).

## 1. Identificação da Solução

- **Nome:** HowLoud, Inc. — produto **Soundscore™**.
- **URL:** https://howloud.com · API em https://api.howloud.com.
- **Público-alvo:** consumidor (comprador/inquilino) e **B2B de listagem** — portais, corretoras, MLS.
- **Proposta central:** uma nota única de ruído ambiental por endereço, **0–100**, construída sobre modelo acústico reconhecido (FHWA Traffic Noise Model) e **licenciada** para sites imobiliários.
- **Origem:** fundada em 2014 por Brendan Farrell, em Los Angeles, porque ele queria saber o barulho de um apartamento antes de atravessar a cidade para vê-lo.
- **Escala de uso declarada:** **mais de 1 milhão de consultas por dia**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 A nota
- **Soundscore™**: número entre 50 (muito barulhento) e 100 (muito silencioso) — segundo a home; o FAQ diz "entre 0 e 100". **A inconsistência é do próprio site** e vale registrar.
- Composta por **três fatores**:
  1. **tráfego de veículos** (o componente mais importante);
  2. **tráfego aéreo**;
  3. **fontes locais** — restaurantes, escolas, comércios, etc.
- Para o tráfego, aplica o **Federal Highway Administration Traffic Noise Model**, modelo **exigido no Estado da Califórnia** para estudos municipais de ruído. O argumento de autoridade: "HowLoud é o primeiro a usar isso em escala massiva".
- Métodos de aeroporto e fonte local são **proprietários**, mas "tratam todos os lugares de forma uniforme com bases nacionais".

### 2.2 Sub-scores (a mecânica que importa)
A resposta da API não devolve só a nota: devolve **quatro números e quatro rótulos**:

```json
{
  "score": 80,
  "traffic": 18, "traffictext": "Active",
  "local": 0,     "localtext": "Calm",
  "airports": 0,  "airportstext": "Calm",
  "scoretext": "Active"
}
```

Ou seja: **o usuário vê a causa**, não só o efeito. É decomposição por fonte, não por distância.

### 2.3 Busca e mapa
- Busca por endereço completo, com botão "Go" e "Reset".
- **Mapa de calor** por tiles.
- **Mapa de cobertura** (onde há dado).
- **Feedback público** para corrigir a nota, com incentivo explícito a enviar bases locais: "seções subterrâneas de via, linhas de trem movimentadas, helipontos, sirenes de nevoeiro, casas noturnas".

### 2.4 API (desenho técnico)
| Endpoint | Função |
|---|---|
| `GET /v2/score?lat&lng` | uma nota |
| `POST /v2/score` | até **250** coordenadas numa chamada síncrona |
| `POST /v2/jobs` | job assíncrono de até **10.000** pontos, com URL pré-assinada de S3 e **NDJSON** |
| `GET /v2/jobs/{id}` | status e URL de download do resultado |
| `GET /v2/tiles/{type}/{z}/{x}/{y}.png` | tiles PNG por tipo: `airports`, `local`, `score`, `traffic` |
| `GET /map/` · `/coverage/` | mapas HTML prontos |

Autenticação por `x-api-key` (header ou query).

### 2.5 Widget
A nota é **embutível** em página de listagem. É o modelo de distribuição: o dado vai até o anúncio.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** endereço (consumidor) ou lat/lng, em lote (B2B).

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Tráfego viário | FHWA Traffic Noise Model sobre malha e volume | público (modelo) + modelagem |
| Tráfego aéreo | bases nacionais de aeroportos e rotas | público |
| Fontes locais | comércio, escolas, restaurantes | licenciado |
| Correções | feedback do usuário e bases locais enviadas | colaborativo |
| Rasterização | **Clockwork Micro** | fornecedor |

**Artefato final:** nota + 3 sub-notas + tiles + mapa de calor. **Não há relatório em PDF**, não há histórico, não há dossiê: é um número com causa.

## 4. Mecânica de UI/UX e Visualização

- **Um número gigante** como resposta principal.
- **Três rótulos de causa** ao lado ("Active", "Calm") — a explicação vem em palavra, não em número.
- **Mapa de calor** como navegação, não como dado.
- **Mapa de cobertura** explícito, que é raro e honesto.
- **Feedback** sempre a um clique, com pedido de base local em vez de "avaliação".
- **Widget** com marca discreta: o portal mantém o usuário, o HowLoud ganha a distribuição.

## 5. Regras de Negócio e Monetização

### 5.1 Preço (público, por volume)
| Plano | Preço | Limite | Cache |
|---|---|---|---|
| Free | $0 | < 2.500 consultas/mês, página única | **proibido** |
| Basic | **$25/mês** | < 5.000 consultas/mês, página única | permitido |
| Premium | **$100/mês** | < 50.000 consultas/mês, **múltiplas páginas** | permitido |
| Enterprise | sob consulta | alto volume, **dados brutos**, **uso dentro de outro produto** | — |

### 5.2 A escada de preço é a lição
O que muda entre os planos não é só volume: é **direito de cache**, **número de páginas** e **direito de embutir em outro produto**. É licenciamento de dado, não consumo de API. Empresas de dado que só cobram por chamada deixam dinheiro na mesa.

### 5.3 Clientes declarados
Apartments.com, beycome.com, Estately, Homes.com, Staten Island Board of Realtors.

### 5.4 Moat
1. **Uso do modelo federal (FHWA TNM)** em escala nacional — barreira de engenharia, não de dado.
2. **Distribuição embutida** em portais grandes.
3. **Cobertura calculada** e mantida.
4. **Norma como argumento**: "o modelo exigido por lei na Califórnia" encerra a discussão sobre legitimidade.

## 6. Aplicação Direta no VEREDA

O HowLoud é o **análogo americano do Mapa Sossego**, mas com uma decisão de produto melhor: **decompõe a nota por fonte** em vez de dar só o total. O VEREDA está bloqueado para dB, e é justamente aí que este dossiê ajuda.

### 6.1 Três rótulos de causa, zero dB
O VEREDA não pode publicar nível. Pode publicar **presença e causa**, exatamente como o HowLoud faz com texto:

```
RUÍDO — fontes por tipo
Tráfego     Forte   (avenida a 35 m)
Local       Calmo   (nenhum bar, oficina ou templo a menos de 100 m)
Aéreo       —       (não publicado por decisão de produto)
```

Isso entrega a mesma informação útil ("o que faz barulho aqui") sem afirmar nível absoluto. É a tradução visual da decisão de 15/11/2026.

### 6.2 A nota de 50–100 é pior que a de 0–100
O próprio HowLoud tem duas escalas no site. O VEREDA deve escolher **uma** e usá-la em todo lugar. Recomendação: 0–10 (ver `app8_local_logic.md`), com o rótulo de causa ao lado.

### 6.3 Bulk assíncrono a 10.000 pontos é o desenho certo para camada pública
Se o VEREDA algum dia publicar a camada de tranquilidade para os 7.206 edifícios, o padrão do HowLoud resolve: **job assíncrono, NDJSON, URL pré-assinada, resultado em lote**. O VEREDA já publica camada estática com hash; o HowLoud mostra que existe mercado para o passo seguinte (consulta por coordenada).

### 6.4 Cache e "embutir em outro produto" como níveis de licença
O VEREDA é aberto, mas as **camadas derivadas** (tranquilidade, nota a pé, cartão de localização) são trabalho próprio. Se um dia houver licenciamento, a escada do HowLoud — cache proibido → cache permitido → múltiplas páginas → embutir em outro produto — é o modelo mais limpo do conjunto.

### 6.5 Mapa de cobertura como tela
O `/coverage/` do HowLoud é uma página que mostra **onde há dado**. O VEREDA tem `coberturaDasCamadas.ts` e a recomendação `A17` (tela de camadas). O HowLoud confirma que essa tela é esperada pelo usuário, não um detalhe interno.

### 6.6 O que **não** copiar
- **Tráfego aéreo**: bloqueado por decisão no VEREDA.
- **Feedback aberto sem revisão**: o VEREDA não tem contas (`A36` adiado); o feedback fica no dispositivo.
- **Escala inconsistente**: escolher uma e documentar.
- **"Active/Calm" como rótulo**: traduzir para português descritivo, não adjetivo de valor.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Decomposição por tipo de fonte (texto, sem dB) | nenhum | pequeno |
| Escala única 0–10 com rótulo | nenhum | pequeno |
| Camada de tranquilidade por edifício | nenhum | médio |
| Consulta por coordenada (se houver API) | nenhum | grande |
