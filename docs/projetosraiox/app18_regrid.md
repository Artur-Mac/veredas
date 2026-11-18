# app18 — Regrid

Coleta: 17/11/2026. Fontes: `regrid.com` (home, `/api`, `/zoning`, `/building-footprints`, `/enhanced-property-ownership`, `/validated-us-addresses`, `/bulk-files`, `/feature-service`, `/mcp`, `/global/*`, `/coverage`), `support.regrid.com/parcel-data/schema`.

## 1. Identificação da Solução

- **Nome:** Regrid.
- **URL:** https://regrid.com.
- **Cobertura:** **100% dos condados dos EUA** em dado de lote, mais Canadá e **22 países** no total.
- **Público-alvo:** AEC, imobiliário, governo, agricultura, energia, *broadband*, seguro, transporte — e, desde 2026, **clientes de IA**.
- **Proposta central:** ser a **fundação de dado de lote** (*parcel*) do país: unificar registros fragmentados de condado em um único dataset padronizado, **com zoneamento, pegada construída, endereço e titularidade** no mesmo registro.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 O registro unificado
- **+160 milhões de registros de lote.**
- **+73 milhões de endereços** padronizados casados com o lote.
- **Pegadas de edificação** casadas ao lote.
- **Titularidade enriquecida**: nome do proprietário, endereço de correspondência, dados de escritura.
- **Zoneamento padronizado** (ver 2.3).
- **Direito de via** (*roadway right-of-way*) como camada separada.

### 2.2 Formas de acesso (seis, e isso é o desenho)
| Acesso | Para quem |
|---|---|
| **Enterprise file delivery** | entrega recorrente em lote, com metadado e formato pronto para nuvem |
| **Feature Service** | dentro do **Esri/ArcGIS**, pronto para uso |
| **API + tiles + MCP** | software, pipeline e **IA** |
| **Data Store** | download autosserviço por condado/estado |
| **Property App** | consulta, trabalho de campo, notas, locais salvos, rastreamento |
| **Bulk files** | parquet/tabela para warehouse |

### 2.3 Zoneamento padronizado (o add-on)
- **Polígonos de zoneamento** com atributos estruturados.
- **Tipo e subtipo** padronizados.
- **Usos permitidos e condicionalmente permitidos.**
- **Controles de desenvolvimento numéricos**: **altura, FAR, recuos (*setbacks*), taxa de ocupação, área do lote, largura do lote, área ajardinada, área aberta, taxa de impermeabilização**.
- **Contexto local preservado**: código bruto, descrição bruta, município e **link para a portaria local**.
- **Junção**: `zoning_id` compartilhado; recomendação de casar **o centroide do lote** com o polígono de zoneamento.
- **Atualização mensal**, com `zoning_data_date` por polígono.
- **Designação `NZ` (No Zoning)**: quando o município confirma que **não existe zoneamento**, o dado diz `NZ` em vez de ficar vazio. É a distinção entre **ausência confirmada** e **cobertura faltante**.

### 2.4 API
- **REST** com endpoints síncronos e **batch assíncrono de até 100.000 pontos**.
- **MCP server** nativo: "milhões de lotes, uma conversa" — consulta em linguagem natural por LLM (Gemini, Claude, ChatGPT).
- **Sandbox gratuito por 30 dias**, token autosserviço.
- Dois esquemas: **Standard** e **Premium**.
- **Limite autosserviço: 10.000 registros/mês**; acima disso, licença enterprise.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** ponto, endereço, polígono, condado/estado, ou lote de coordenadas.

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Limites de lote | **3.000+ condados** | público, fragmentado |
| Titularidade | registros de escritura e assessores | público |
| Endereços | correios e bases próprias | público + normalização |
| Pegada de edificação | sensoriamento e bases | misto |
| Zoneamento | municípios + parceiro **Zoneomics** | público + padronização |
| Demografia | Censo | público |

**Artefato final:** GeoJSON/Feature com lote, dono, endereço, pegada, zoneamento e controles; tabela em warehouse; serviço Esri; resposta de agente via MCP.

## 4. Mecânica de UI/UX e Visualização

- **Lote como unidade de tela**, com painel de atributos ao lado — não é mapa de calor, é cadastro navegável.
- **Camadas ligáveis** (lote, pegada, zoneamento, direito de via) sobre a mesma base.
- **"Aponte e veja o dono"** — a consulta mais desejada do mercado, resolvida em um clique.
- **Property App com notas e locais salvos**, que transforma consulta em trabalho de campo.
- **Mapa de cobertura por condado**, com contagem de lotes e completude campo a campo.
- **MCP**: a interface vira conversa, e o produto entra no fluxo de quem usa LLM.

## 5. Regras de Negócio e Monetização

- **Modelo:** assinatura API em degraus + autosserviço por download + enterprise por volume + Feature Service para o mundo Esri.
- **Gatilho:** sandbox de 30 dias com token imediato — zero atrito de compra.
- **Moat:**
  1. **Cobertura de 100% dos condados** — trabalho de aquisição, não de código.
  2. **Padronização** de 3.000+ esquemas locais diferentes.
  3. **Pegada + zoneamento + titularidade no mesmo registro**, que é o que o cliente realmente quer juntar.
  4. **Presença no ecossistema Esri**, onde o setor já trabalha.
  5. **MCP**, que cria uma posição nova de distribuição.

## 6. Aplicação Direta no VEREDA

O Regrid é o **espelho americano do índice municipal do VEREDA**: lote + atributo + zoneamento + titularidade, com chave estável. As lições são de **schema** e de **honestidade de cobertura**.

### 6.1 `NZ` — distinguir "não existe" de "não temos"
Esta é a melhor ideia de todo o lote novo de dossiês. O VEREDA hoje usa **"Sem leitura publicada nesta área ainda"** para qualquer lacuna. Isso mistura três situações diferentes:

1. **não se aplica** (ex.: não há zoneamento naquele trecho);
2. **existe, mas o dado não foi publicado**;
3. **existe e foi publicado, mas está vazio**.

Proposta de vocabulário de três estados, copiado do `NZ`:

| Estado | Texto |
|---|---|
| confirmado inexistente | "não se aplica neste trecho" |
| cobertura faltante | "sem leitura publicada nesta área ainda" |
| dado presente e vazio | "registro sem ocorrência no período" |

Isso é **mudança de texto e de tipo**, não de dado — e melhora a confiança de todas as telas de uma vez. Encaixa em `A17` (tela de camadas) e no `coberturaDasCamadas.ts`.

### 6.2 O schema de controles é a lista de parâmetros da LPUOS
O Regrid publica exatamente os campos que um comprador precisa saber de um lote: **altura, FAR, recuos, taxa de ocupação, área do lote, largura do lote, área aberta, impermeabilização**. A LPUOS tem equivalentes diretos (gabarito, taxa de ocupação, recuos, coeficiente). Adotar o **mesmo vocabulário** (em português) para a leitura de lote do VEREDA:

```
ZONA: … (LPUOS, art. …)
Gabarito            …
Taxa de ocupação    …
Recuos              frente … / laterais … / fundo …
Coeficiente         …
Uso permitido       …
Uso permitido sob condição  …
```

Só isso já dá conteúdo à tela de lote que hoje diz "sem leitura".

### 6.3 "Casar o centroide" é um alerta de qualidade
O Regrid recomenda casar **o centroide do lote** com o polígono de zoneamento por interseção espacial. O VEREDA faz junções parecidas entre lote e camada. A recomendação prática: **usar centroide, não interseção de área**, e **registrar a regra no manifesto da camada**. Isso evita lote de esquina cair em duas zonas.

### 6.4 MCP + sandbox como distribuição de camada pública
O VEREDA tem camadas estáveis com hash. Um **MCP de leitura** (`A27` na síntese anterior) com sandbox e token autosserviço é o mesmo movimento em escala municipal: quem usa LLM consulta o VEREDA sem abrir o app. O Regrid prova que existe demanda B2B para isso.

### 6.5 O que **não** copiar
- **Titularidade**: dado pessoal (nome do proprietário) — o VEREDA não publica e a LGPD reforça.
- **Cobertura nacional**: o VEREDA é municipal.
- **Esri como canal**: não há base instalada equivalente no mercado brasileiro de compra de imóvel.
- **Venda de lote bruto**: o VEREDA entrega leitura, não shapefile.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Vocabulário de 3 estados (`NZ`) | nenhum | pequeno |
| Schema de controles do lote | LPUOS (público) | médio |
| Regra de centroide documentada | nenhum | pequeno |
| MCP com sandbox | nenhum | médio |
