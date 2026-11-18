# app8 — Local Logic

Coleta: 17/11/2026. Fontes: `locallogic.co` (home, `/our-data/`, `/datasets/location-scores/`, `/our-data/how-are-location-scores-calculated/`, `/our-data/how-are-location-scores-measured/`, `/pricing/`, `/platform/*`, `/mcp-use-cases/*`), `docs.locallogic.co`.

## 1. Identificação da Solução

- **Nome:** Local Logic (Montreal, Canadá).
- **URL:** https://locallogic.co · docs em https://docs.locallogic.co.
- **Público-alvo:** **B2B puro** — portais imobiliários, MLS, bancos, seguradoras, proptechs, e agora **agentes de IA** via MCP.
- **Proposta central:** "scores de localização" por endereço e por bairro, em **escala 0–10**, calculados por um **modelo de acesso** sobre milhares de bases, entregues por API/SDK para serem embutidos em outro produto.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Escala e curadoria
- **+100 bilhões de pontos** de dado.
- **+250 milhões de endereços**.
- **+3.000 bases de dados**.
- **+12.000 sites** usando.
- **+50 milhões de usuários por mês** (via parceiros).

### 2.2 Os 18 scores em 6 grupos
| Grupo | Scores (0–10) |
|---|---|
| **Transporte** | caminhabilidade (*walk*), transporte público (*transit*), ciclismo (*cycling*) |
| **Amenidades** | acesso a conveniência, compras, serviços, alimentação |
| **Educação** | escolas, creches |
| **Caráter** | vibração/vida urbana, tranquilidade (*quiet*) |
| **Natureza** | parques, natureza, verde |
| **Bem-estar** | saúde, bem-estar, fitness |

*(A lista exata de nomes por grupo varia por pacote; o que é público e verificável é: **18 scores**, **6 grupos**, escala **0–10**, e a descrição funcional de walk, transit, cycling, quiet e vibrancy.)*

### 2.3 O modelo de acesso (a parte técnica que importa)
Declarado em "How Are Location Scores Calculated?":

1. Para um ponto, o modelo encontra **todos os destinos relevantes dentro do tempo de deslocamento**.
2. **Soma os valores** desses destinos.
3. **Desconta cada um pela distância**, com **decaimento linear ou gravitacional** (a escolha depende do score).
4. Calcula em **resolução de geohash menor que um segmento de rua**.
5. Agrega para bairro/cidade quando o cliente pede.

Detalhes por score (de "How Are Walkability, Transit, Cycling, Quietness, and Vibrancy Measured?"):
- **Caminhabilidade:** distância de **rede** (não linha reta).
- **Transporte:** pondera por **qualidade da linha, frequência e número de linhas**.
- **Tranquilidade:** derivada da **proximidade de tráfego, aeroportos, ferrovia e bares** — **sem declarar dB**.
- **Vibração:** densidade e diversidade de destinos e atividade.
- **Valor:** "value drivers" cruzando **AVM próprio + dados de transação**.

### 2.4 Produtos
- **Location Scores** (o carro-chefe): API de scores por endereço/bairro.
- **Neighborhood/Neighbourhood SDK**: componente pronto para embutir em portal.
- **Value Drivers**: o que explica a diferença de valor entre dois endereços.
- **Demographics e datasets** adicionais.
- **MCP server**: expõe os scores e o contexto local para **assistentes de IA**, com casos de uso publicados (assistente local, descrição de listagem, busca de bairro parecido, conteúdo ancorado em MLS, "matar alucinação de fato local", contexto para hipoteca).

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário (do cliente B2B, não do consumidor):** coordenada, endereço ou geohash; lista de scores desejados; idioma.

**Fontes cruzadas:**
| Camada | Origem |
|---|---|
| POIs e negócios | bases comerciais licenciadas |
| Rede viária e calçadas | redes públicas e proprietárias |
| Transporte público | agências e GTFS |
| Escolas e creches | bases públicas |
| Parques e verde | bases públicas e sensoriamento |
| Ruído | derivado de vias, aeroportos, ferrovia, bares |
| Valores de imóvel | AVM próprio + transações |

**Artefato final:** JSON de scores 0–10 com metadados de método, e componentes de UI prontos. **Não há relatório para consumidor** — o produto é o dado.

## 4. Mecânica de UI/UX e Visualização

- **Radar/grade de scores** é o padrão de visualização: 6 grupos, 18 notas, leitura instantânea.
- **Barra 0–10 com rótulo**, não número solto.
- **Cada score com "por que"**: a lista de destinos que o compõe.
- **Comparação entre dois endereços** (o caso de uso "find a neighborhood like this one").
- **Embutido no produto do cliente**, com marca discreta — o Local Logic não compete com o portal, ele o alimenta.
- **MCP**: a interface do futuro é o agente, e o produto se posiciona como a **fonte de verdade local** que o agente consulta.

## 5. Regras de Negócio e Monetização

### 5.1 Preço publicado (raro e valioso)
| Produto | A partir de |
|---|---|
| SDKs | **US$ 250/mês** |
| SDKs de bairro | **US$ 500/mês** |
| APIs | **US$ 1.500/mês** |
| Relatórios | sob consulta |

O preço público em três degraus (SDK → SDK de bairro → API) mostra a lógica: **quanto mais granular e mais integrado, mais caro**.

### 5.2 Moat
1. **3.000 bases** consolidadas e normalizadas — trabalho de anos.
2. **Resolução de geohash** menor que um segmento de rua, agregável — o cliente não precisa saber onde cortar.
3. **Modelo de acesso publicado** (credibilidade sem entregar o segredo).
4. **Distribuição**: 12.000 sites e 50 milhões de usuários/mês; trocar de fornecedor é caro.
5. **MCP**: ser a fonte que o agente consulta é uma posição defensável nova.

## 6. Aplicação Direta no VEREDA

O Local Logic é o melhor modelo de **produto de score** do conjunto: escala 0–10, modelo de acesso explícito, sem prometer precisão que não tem, e sem dB. É a referência mais próxima do que o VEREDA faz com índice de edifício.

### 6.1 Adotar a escala 0–10 e não 0–100
O VEREDA hoje mistura minutos, contagens e percentis. O Local Logic mostra que **uma escala única de 0 a 10**, com rótulo e "por que", resolve apresentação sem perder rigor. Proposta:

- **A pé: 0–10** (derivado da nota 0–100 do `app6_walk_score.md` ÷ 10).
- **Transporte: 0–10** (peso por linha, frequência e número — o `Rotina` já usa GTFS/RAPTOR e tem a frequência).
- **Tranquilidade: 0–10** (proximidade de vias, bares, oficinas, ferrovia, aeroporto — **sem dB**, exatamente como o Local Logic).
- **Vida na rua: 0–10** (densidade de comércio de rua do CNEFE, por categoria).
- **Verde: 0–10** (praças ESIG + árvores do Censo, quando houver).
- **Essenciais: 0–10** (a cadeia do `DiaADia`).

Seis scores, seis grupos, uma escala. Isso dá ao dossiê um "cartão de localização" comparável entre edifícios sem inventar nada.

### 6.2 O modelo de acesso é o que o VEREDA já faz — falta a fórmula
O `DiaADia` encontra destinos dentro de um tempo e conta. O Local Logic explicita o que falta: **somar valores e descontar pela distância**. A diferença é que o VEREDA pode ser melhor, porque usa **distância de rede a partir da entrada** e tem **plano B**. A fórmula de decaimento deve ser publicada na tela de método, como o Local Logic faz.

### 6.3 Tranquilidade sem dB é precedente direto
Este é o achado mais importante do dossiê para a decisão de produto do VEREDA: um fornecedor B2B sério, vendido a 12.000 sites, calcula **quietness 0–10 a partir de proximidade de tráfego, aeroporto, ferrovia e bar**, e **não publica dB**. O VEREDA chegou à mesma conclusão por medição insuficiente; o Local Logic chegou por desenho de produto. Isso valida a decisão de 15/11/2026 e dá o vocabulário para executá-la.

### 6.4 MCP como canal de distribuição
O VEREDA tem camadas públicas e um envelope de cobertura. Expor um **servidor MCP** com consultas do tipo "esta rua alagou?", "quais camadas existem neste bairro?", "qual a nota a pé deste edifício?" coloca o VEREDA dentro de assistentes de IA sem construir app. É a mesma jogada do Local Logic, em escala menor e com dado local. Baixo custo: as camadas já são arquivos estáveis com hash.

### 6.5 Resolução: o VEREDA já é mais fino que o Local Logic
O Local Logic calcula por **geohash menor que um segmento de rua**. O VEREDA calcula por **edifício** (DSQFL de 14 dígitos, 7.206 edifícios). Isso é uma vantagem real e deve ser dita: **a nota é do prédio, não da esquina**. A agregação para bairro é derivada, nunca a unidade primária.

### 6.6 O que **não** copiar
- **Value drivers com AVM**: é valuation, e o VEREDA não faz (A21/A31).
- **3.000 bases licenciadas**: o VEREDA é aberto por decisão; comprar base criaria dependência e custo fixo.
- **Venda por SDK**: o VEREDA não tem produto embarcável hoje.
- **18 scores**: seis bastam; dezoito diluem a decisão.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Cartão de 6 scores 0–10 | nenhum | médio |
| Fórmula de decaimento publicada | nenhum | pequeno |
| Tranquilidade 0–10 | nenhum (inventário OSM/LUSE) | médio |
| Servidor MCP de leitura | nenhum | médio |
