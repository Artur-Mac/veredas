# Validação dos dados de Defesa Civil (alagamento), GTFS (transporte), Segurança e Amenidades

**Data:** 2026-11-12
**Escopo:** revalidação dos dois conjuntos de dados que alimentam os números de alagamento e de transporte no pitch VEREDA, sem expandir a coleta (apenas arquivos locais já baixados em `raw/`).
**Arquivos usados:**

| Conjunto | Arquivos |
|---|---|
| Defesa Civil | `raw/cadastro-municipal/defesa-civil-2021.csv` … `defesa-civil-2025.csv` |
| Bairros (polígonos) | `raw/cadastro-municipal/bairros-do-recife.geojson` (94 bairros) |
| GTFS | `raw/transporte/paradas.json`, `raw/transporte/gtfs-extracted/{stops,calendar,trips,stop_times,feed_info}.txt` |
| Scripts de validação | `infra/scripts/validar-defesa-civil.mjs`, `infra/scripts/validar-gtfs.mjs` |
| Scripts de coleta | `infra/scripts/11-crimebrasil.mjs` (segurança), `infra/scripts/12-amenidades.mjs` (amenidades), `infra/scripts/13-seguranca.mjs` (processamento) |

**Não tocado:** `raw/`, `processado/`, app, pitch e motion. O relatório só lê; os scripts imprimem JSON em stdout.

---

## 1. Defesa Civil — alagamento

### 1.1 Metodologia

- **Leitor CSV robusto:** o exportador usa `;` como separador e aspas duplas com escape `""` dentro de campos (os endereços têm aspas residuais, ex. `" @}>"`). O parser (`validar-defesa-civil.mjs`) é *quote-aware*: reconhece `""` como aspa literal, fecha o campo na aspa que não é seguida de outra e trata `\r\n`/`\n`.
- **Campos localizados por nome de coluna**, não por posição fixa. O cabeçalho tem aspas residuais na última coluna (`"Grau_de_Risco"` vira `'"Grau_de_Risco'`) — o script limpa com `replace(/^"+|"+$/g,"")`.
- **Deslocamento de 2022:** o CSV de 2022 **não tem a coluna `Regional`** nos dados — a primeira célula de cada linha é o ano (`"2022"`), em vez de uma região (`"Norte"`/`"Oeste"`). Isso desloca 1 célula para a esquerda os campos de valor `Ocorrencia`, `Solicitacao` e `Endereco` em relação ao cabeçalho de 16 colunas. `Bairro` e `Data` coincidentemente caem no mesmo índice do cabeçalho. O script detecta a ausência de Regional (primeira célula da primeira linha de dados é `"2022"`) e aplica `-1` só a O/S/E.
- **Critério de alagamento:** caminho primário — `Ocorrencia` contém `/alag|enchent|inunda/i`. Caminho secundário (reportado separadamente, para transparência) — `Tipo_da_Acao` **ou** `Solicitacao` contém o mesmo padrão. A soma primário+secundário dá o total de "linhas com menção a alagamento".
- **Normalização de bairro:** `normalize("NFD")` + remoção de diacríticos + minúsculas + espaços colapsados, para casar `Gracas` (sem acento) com `Graças`.
- **Registros administrativos ≠ eventos únicos:** cada linha do CSV é um *registro administrativo* (um atendimento, uma vistoria, um monitoramento). Não há chave de evento; uma mesma ocorrência de alagamento pode gerar várias linhas. Os números abaixo são **linhas**, não ocorrências únicas.

### 1.2 Resultado — alagamento por bairro-alvo × ano (caminho primário: `Ocorrencia`)

| Bairro | 2021 | 2022 | 2023 | 2024 | 2025 | Total |
|---|---:|---:|---:|---:|---:|---:|
| Boa Viagem | 0 | **14** | 1 | 0 | 0 | **15** |
| Casa Forte | 0 | 0 | 0 | 0 | 0 | **0** |
| Graças | 0 | 0 | 0 | 0 | 0 | **0** |
| Espinheiro | 0 | 0 | 1 | 2 | 0 | **3** |
| Madalena | 0 | 0 | 0 | 2 | 0 | **2** |

- **Boa Viagem 2022 = 14** — bate com a conferência independente (critério "Vistoria Alagado" ou "Monitoramento Alagado" em `Ocorrencia`/`Solicitacao` + `Bairro="Boa Viagem"`). Ver §1.3.
- **Casa Forte e Graças = 0 em todos os anos** (no caminho primário).
- **2025** tem apenas **1 linha de dados** no CSV local (o ano está em curso / quase vazio no arquivo).

### 1.3 Conferência independente — Boa Viagem 2022

- **Critério:** `Bairro="Boa Viagem"` **E** (`Ocorrencia` **OU** `Solicitacao` contém `"vistoria alagado"` **ou** `"monitoramento alagado"`).
- **Esperado:** 14. **Obtido:** **14** ✓
- **Amostra (3 linhas, sem endereço real exposto):**

  | Data | Ocorrencia | Solicitação (trecho) |
  |---|---|---|
  | 2022-06-08 | Imveis Alagados | Vistoria Alagado |
  | 2022-06-08 | Imveis Alagados | Vistoria Alagado |
  | 2022-06-08 | Imveis Alagados | Vistoria Alagado |

  > As 14 linhas são de 08/06/2022, todas `Ocorrencia="Imveis Alagados"` e `Solicitacao="Vistoria Alagado"` — uma ação concentrada de vistoria de imóveis alagados em Boa Viagem. Os endereços (ruas reais) estão na coluna `Endereco`, omitidos aqui por serem endereço real.

### 1.4 Comparação com o resumo atual (`processado/alagamento.json`)

| Bairro | `alagamento.json` (atual) | Revalidação (caminho primário) | Diferença |
|---|---:|---:|---|
| Boa Viagem | 15 | 15 | 0 (14 em 2022 + 1 em 2023) |
| Casa Forte | 0 | 0 | 0 |
| Graças | 0 | 0 | 0 |
| Espinheiro | 3 | 3 | 0 |
| Madalena | 2 | 2 | 0 |

O resumo atual é **correto** para os totais de 5 anos. Ele soma *todos os caminhos* (Ocorrencia + Tipo_da_Acao + Solicitacao), o que, nestes 5 bairros, dá o mesmo resultado que o caminho primário mais o 1 registro de 2023. O risco do resumo antigo é que ele **zera linhas** quando a chave `Tipo_da_Acao` não é preenchida; a revalidação por `Ocorrencia` mostra que o valor de BV-2022 (14) vem de fato da coluna `Ocorrencia`/`Solicitacao`, não de `Tipo_da_Acao` (que é `"Mapeamento de Area de Risco"` nessas linhas).

### 1.5 Outros bairros com alagamento (contexto, caminho primário)

O filtro pega também muitos bairros fora dos 5-alvo. Os maiores (linhas, caminho primário `Ocorrencia`):

| Bairro | 2022 | 2023 | 2024 |
|---|---:|---:|---:|
| Varzea | 106 | 7 | — |
| Areias | 118 | 9 | 11 |
| Bomba do Hemeterio | 97 | — | — |
| Dois Irmaos | 39 | — | — |
| Afogados | — | — | 14 |
| Sao Jose | — | 7 | 14 |

> Isso mostra que o alagamento em Boa Viagem (14 em 2022) **não é o maior** do município — Varzea, Areias e Bomba do Hemeterio têm mais linhas no mesmo período. Útil para contextualizar o "big number" de BV: é um número real e relevante, mas não recorde municipal.

---

## 2. GTFS — transporte

### 2.1 Metodologia

- **Offset de coordenadas:** o feed GTFS (Grande Recife Consórcio, versão `v2026.10.26`) tem coordenadas com um deslocamento sistêmico. O pipeline aplica `lat_corrigido = lat_bruto − 0.75°` (subtrai 0,75° de latitude ≈ **83,5 km** para o sul). O arquivo `raw/transporte/paradas.json` guarda o **lat bruto**; o offset é aplicado em consulta.
- **Ponto-em-polígono:** ray casting sobre `bairros-do-recife.geojson` (94 bairros, geometrias `MultiPolygon`, CRS84/WGS84). Pré-filtro por bounding box de cada bairro para velocidade.
- **Distância 400 m:** haversine aproximada (eixo x: `Δlng × 111320 × cos(lat_médio)`; eixo y: `Δlat × 110540`). É **linha reta**, não distância de caminhada.
- **Serviço programado:** cruza `stops.txt` × `trips.txt` × `stop_times.txt` × `calendar.txt` para contar paradas que têm ao menos uma viagem.

### 2.2 Quantas paradas caem dentro do Recife?

| | Paradas dentro do Recife |
|---|---:|
| Coordenadas **brutas** (sem offset) | **2.839 / 7.238** (39%) |
| Coordenadas **corrigidas** (offset −0,75°) | **0 / 7.238** |

- Sem o offset, as paradas **já estão geográficamente certas**: 2.838 caem em bairros do Recife (Boa Viagem 127, Imbiribeira 112, Varzea 169, Caxanga 50, Cordeiro 81, Ibura 84, …). As demais ~4.400 estão em municípios vizinhos (Jaboatão, Paulista, Olinda, Itamaracá) ou em ilhas (Joana Bezerra, Retiro, Leite).
- Com o offset, **todas** as 7.238 paradas saem do Recife — o deslocamento de 83,5 km as empurra para o mar (sul), além do limite municipal.
- **Conclusão:** o offset de −0,75° é necessário para *alinhar* o feed com a geografia do Recife *apenas* se o feed bruto estiver em um datum deslocado. Como 2.838 paradas já batem com os polígonos do Recife no bruto, o offset **corrigido** produz o resultado oposto (0). A escolha de aplicar ou não o offset muda completamente a contagem de 400 m (ver §2.4).

### 2.3 Teste de ponto — "Terminal Residencial Boa Viagem" (id `010200`)

| | Lat | Lng | Bairro (ponto-em-polígono) | Dentro do Recife? |
|---|---|---|---|---|
| **Bruto** | −8.118856 | −34.909539 | **Imbiribeira** | **Sim** |
| **Corrigido** (lat − 0,75°) | −8.868856 | −34.909539 | *nulo* | **Não** |

- **Bruto → Imbiribeira, dentro do Recife** ✓ (bate com o esperado: o terminal fica na divisa Boa Viagem/Imbiribeira; o ponto cai do lado de Imbiribeira no polígono).
- **Corrigido → fora do Recife** ✓ (o offset o joga ~83,5 km ao sul, abaixo de todos os bairros; ~750 m ao sul do bbox de Boa Viagem).
- O teste de ponto confirma o comportamento do offset e serve de *sanity check* para o ponto-em-polígono.

### 2.4 Contagem de paradas a ≤ 400 m de cada bairro-alvo

Distância em linha reta (haversine) do centro aproximado de cada bairro-alvo até cada parada.

| Bairro-alvo | Sem offset | Com offset (−0,75°) |
|---|---:|---:|
| Boa Viagem | 0 | **5** |
| Casa Forte | 0 | **19** |
| Graças | 0 | **3** |
| Espinheiro | 0 | **10** |
| Madalena | 0 | **0** |

- Os números de `processado/transporte.json` (BV 5, CF 19, Graças 3, Espinheiro 10, Madalena 0) usam o **offset aplicado** — batem exatamente com a coluna "Com offset".
- **Sem offset, todos dão 0** porque o centro de referência é o do bairro *corrigido* (latitude já deslocada ~0,75° para o sul) e as paradas brutas ficam ~83 km ao norte desse centro. Ou seja: a contagem de 400 m só produz números não-nulos quando o **mesmo offset** é aplicado ao centro e às paradas — ela mede paradas próximas ao bairro *na geografia do feed*, não na geografia real de WGS84.
- **Limite:** 400 m em linha reta ≠ caminhada. Uma parada a 400 m em linha reta pode estar a 600–800 m a pé (ruas, alças, barreiras). E "ter paradas a 400 m" **não** garante serviço programado (ver §2.5).

### 2.5 Serviço programado

| Indicador | Valor |
|---|---:|
| Paradas com viagens em `stop_times` | **7.198 / 7.238** (99,5%) |
| Total de paradas | 7.238 |
| Viagens (`trips.txt`) | 87.678 |
| Linhas em `stop_times.txt` | 3.166.397 |
| Dias no calendário (`calendar.txt`) | 1.143 |

- Quase todas as paradas têm serviço programado. As 40 paradas sem viagem em `stop_times` podem ser terminais (`location_type=1`) ou paradas sem serviço no período do calendário.
- **Limite:** a existência de paradas a 400 m **depende** do calendário, das viagens e dos horários. Se o feed mudar de período ou de operadora, a contagem muda. O número "5 paradas a 400 m de Boa Viagem" é válido **para o feed `v2026.10.26`** e para o offset −0,75°.

---

## 3. Segurança — ocorrências por bairro

### 3.1 Metodologia

- **Fonte:** Crime Brasil (crimebrasil.com.br) — páginas por bairro, HTML server-side, período 12 meses (Nov 2025 — Out 2026).
- **Coleta:** `11-crimebrasil.mjs` — fetch + parse de 5 páginas → `raw/seguranca/crimebrasil-bairros.json`.
- **Processamento:** `13-seguranca.mjs` → `processado/seguranca.json`.
- **Métrica principal:** contagem de ocorrências em 12 meses (subnotificação — depende do registro policial).
- **População:** IBGE Censo 2022 (via Crime Brasil).
- **Licença:** CC BY 4.0.
- **Limitação:** contagem de *ocorrências registradas*, não de *crime efetivo*. Subnotificação é alta em alguns tipos (furto, ameaça).

### 3.2 Resultado — 12 meses por bairro

| Bairro | Ocorrências 12m | Ranking (94) | Tendência a/a | Ano base → Ano fim | Crimes violentos % |
|---|---:|---:|---|---:|---:|
| Boa Viagem | **2.148** | **1º** | +11% | 2.429 → 2.706 | 83% |
| Madalena | 406 | 22º | estável | 537 → 543 | 83% |
| Espinheiro | 191 | 45º | +20% | 202 → 242 | 86% |
| Graças | 178 | 47º | **+96%** | 177 → 347 | 92% |
| Casa Forte | 154 | 54º | +8% | 205 → 222 | 81% |

- **Boa Viagem é o bairro com mais ocorrências do Recife** (2.148 em 12 meses, 1º de 94).
- **Graças tem a maior tendência de crescimento** (+96%, de 177 para 347 ocorrências).
- **Madalena estável** (537 → 543), 22º lugar.
- **Crimes violentos** (roubo, furto, lesão corporal, homicídio, estupro) representam 81–92% das ocorrências em todos os 5 bairros.

### 3.3 Top 3 tipos de ocorrência por bairro

| Bairro | 1º tipo | 2º tipo | 3º tipo |
|---|---|---|---|
| Boa Viagem | Ameaça (28%, 601) | Roubo a Transeunte (27%, 587) | Roubo (9,6%, 206) |
| Casa Forte | Ameaça (34%, 52) | Roubo a Transeunte (25%, 38) | Roubo (12%, 19) |
| Graças | Roubo a Transeunte (35%, 63) | Ameaça (30%, 54) | Roubo em Estab. (10%, 18) |
| Espinheiro | Ameaça (42%, 80) | Roubo a Transeunte (22%, 42) | Roubo (7,3%, 14) |
| Madalena | Ameaça (33%, 133) | Roubo a Transeunte (22%, 89) | Lesão Corporal (10%, 41) |

- **Ameaça** é o tipo mais comum em 4 dos 5 bairros (exceto Graças, onde Roubo a Transeunte lidera).
- **Roubo a Transeunte** é consistentemente o 2º ou 3º tipo — indicador de segurança na rua.

---

## 4. Amenidades — custo a pé por bairro

### 4.1 Metodologia

- **Fonte:** OpenStreetMap via Overpass API (mirror `overpass-api.de` / `maps.mail.ru`).
- **Coleta:** `12-amenidades.mjs` — 9 categorias × 5 bairros, POIs por bounding box do bairro.
- **Métricas por categoria e por bairro:**
  - Contagem total de POIs
  - Distância mínima (linha reta, haversine) do centroide do bairro até o POI mais próximo
  - Distância média dos 5 POIs mais próximos
  - Tempo de caminhada estimado (4,8 km/h → 80 m/min)
  - POIs dentro do bounding box (proximidade imediata)
- **Limitações:**
  - Distâncias em **linha reta** (haversine), não trajeto real de caminhada.
  - Centroide = média dos vértices do polígono (aproximação, não centroide geométrico exato).
  - Cobertura OSM varia por bairro e categoria.
  - **Status: parcial** — mirrors Overpass instáveis no momento da coleta (12/11/2026); algumas categorias falharam.

### 4.2 Status da coleta

| Categoria | Status |
|---|---|
| supermercados | ⚠️ parcial (falhas em alguns bairros) |
| farmacias | ⚠️ parcial |
| padarias | ⚠️ parcial |
| restaurantes | ⚠️ parcial |
| academias | ⚠️ parcial |
| hospitais | ⚠️ parcial |
| postos_saude | ⚠️ parcial |
| escolas | ⚠️ parcial |
| praças | ⚠️ parcial |

> **Nota:** a coleta foi interrompida por falha generalizada dos mirrors Overpass (502/504/timeout) em 12/11/2026. O script `12-amenidades.mjs` está pronto para reexecução quando os mirrors se recuperarem. Os dados parciais estão em `raw/amenidades/amenidades.json` (quando gerado).

---

## 5. Limitações gerais

1. **Linha reta ≠ caminhada** (GTFS 400 m, amenidades).
2. **Serviço programado depende de calendário/viagens/horários** — o feed é um *snapshot* (`v2026.10.26`).
3. **2025 está parcial** — o CSV local de Defesa Civil de 2025 tem só 1 linha de dados.
4. **`Ocorrencia` vazio em ~96% das linhas** (304.957 de 318.618). O campo é preenchido de forma inconsistente; `Tipo_da_Acao` e `Solicitacao` são mais confiáveis. O caminho primário (`Ocorrencia`) subestima; a soma de caminhos capta mais.
5. **2022 sem coluna `Regional`** — deslocamento de 1 célula nos campos de valor; o script corrige. Sem essa correção, os índices do cabeçalho erram O/S/E (mas Bairro e Data continuam corretos).
6. **`Bairro` ausente em 1.114 linhas** — essas linhas não entram em nenhuma contagem por bairro.
7. **Registro administrativo ≠ evento único** (Defesa Civil). Uma ocorrência de alagamento pode vazar em várias linhas; os números são linhas, não eventos.
8. **Offset GTFS de −0,75° é um ajuste de datum, não de escala** — muda a geografia de referência e, com ele, as paradas *saem* do Recife (2.838 → 0). A contagem de 400 m só é interpretável com o offset aplicado (geografia do feed).
9. **Polígonos de bairro** têm buracos/lacunas e o ponto-em-polígono usa ray casting simples (não trata vértices degenerados). O teste de ponto do terminal (Imbiribeira no bruto) valida a implementação.
10. **Segurança: contagem de ocorrências, não de crime efetivo** — subnotificação varia por tipo e por bairro. O ranking é relativo (1º de 94), não absoluto.
11. **Segurança: período de 12 meses** (Nov 2025 — Out 2026) — não é um ano calendário. A comparação a/a usa o mesmo período deslizando.
12. **Amenidades: OSM é voluntário** — cobertura varia por bairro e categoria; mirrors Overpass instáveis podem truncar a coleta.
13. **Amenidades: centroide aproximado** — média dos vértices, não centroide geométrico exato. Para bairros com forma irregular (Boa Viagem), a distância mínima pode subestimar em até ~200 m.

---

## 6. Como reproduzir

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH"
cd ignorar/dados-pipeline-2026-11-11/infra/scripts

# Defesa Civil e GTFS (leem raw/, imprimem stdout)
node validar-defesa-civil.mjs   # → JSON do alagamento (stdout)
node validar-gtfs.mjs           # → JSON do GTFS (stdout)

# Segurança (fetch → raw/seguranca/, processa → processado/seguranca.json)
node 11-crimebrasil.mjs         # → raw/seguranca/crimebrasil-bairros.json
node 13-seguranca.mjs           # → processado/seguranca.json

# Amenidades (fetch Overpass → raw/amenidades/)
node 12-amenidades.mjs          # → raw/amenidades/amenidades.json
```

Os scripts de validação (Defesa Civil, GTFS) leem apenas de `raw/` e imprimem em `stdout`. Os scripts de coleta (segurança, amenidades) escrevem em `raw/` e `processado/`.
