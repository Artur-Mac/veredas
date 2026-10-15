# Investigação 5 (E11): temperatura de superfície Landsat por quarteirão

Data de acesso de todas as fontes: 2026-10-14.

## 1. Resposta curta

Parcial: há 9 cenas Tier 1 úteis (o critério pede 6), e em Boa Viagem a diferença mediana entre quarteirões chega a 10,4 °C (máx menos mín) e 4,9 °C (P90 menos P10). Em Casa Forte ela fica em 1,9 °C e 1,3 °C, abaixo dos 3 °C. Só 29,7% (Boa Viagem) e 51,9% (Casa Forte) dos quarteirões têm área de pelo menos um pixel térmico real (10.000 m²), contra os 70% exigidos.

## 2. Evidências

| URL | O que confirma |
|---|---|
| https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2 | Catálogo usado (STAC do Microsoft Planetary Computer, coleção `landsat-c2-l2`). Produtores e licenciantes: NASA e USGS. Hospedagem: Microsoft. Campo `license`: "proprietary", com link de licença para `https://www.usgs.gov/core-science-systems/hdds/data-policy` (esse link retornou 404 no acesso). DOIs de citação: 10.5066/P9IAXOVV, 10.5066/P9C7I13B, 10.5066/P9OGBGM6. |
| https://planetarycomputer.microsoft.com/api/stac/v1 (busca STAC, executada por script) | 330 itens Landsat 8 e 9 de 2022 a 2025 tocam o bbox do Recife: 165 em 214/065 e 165 em 214/066. Todas as 165 cenas 214/066 cobrem o polígono municipal inteiro (teste `contains` com a geometria do item). |
| Metadados do asset `lwir11` no item `LC09_L2SP_214066_20250416_02_T1` (mesma API) | Título "Surface Temperature Band", descrição "Collection 2 Level-2 Thermal Infrared Band (ST_B10) Surface Temperature", `gsd` 100, `raster:bands`: unidade kelvin, scale 0.00341802, offset 149, nodata 0, uint16, spatial_resolution 30. Arquivo: `..._ST_B10.TIF`. |
| Metadados dos assets `qa_pixel` e `qa` (mesma API) | `qa_pixel` = QA_PIXEL, campos de bits: fill (bit 0), dilated_cloud (1), cirrus (2), cloud (3), cloud_shadow (4), snow (5), clear (6), water (7). `qa` = ST_QA, incerteza da temperatura em kelvin, scale 0.01, nodata -9999, int16. |
| https://www.usgs.gov/landsat-missions/landsat-collection-2-level-2-science-products | Fator de escala de ST: "0.00341802 + 149.0", fill 0, faixa válida 1 a 65535, uint16, unidade kelvin. |
| https://www.usgs.gov/faqs/what-are-band-designations-landsat-satellites | Bandas TIRS 10 e 11 do Landsat 8-9 com resolução "100 (resampled to 30)". Nota da tabela: dados adquiridos são reamostrados no processamento Level-1. |
| https://www.usgs.gov/landsat-missions/landsat-8 | Band 10 TIRS 1 (10,6 a 11,19 µm) com 100 m. |
| https://www.usgs.gov/landsat-missions/landsat-collection-2-level-1-data | Tier 1: "suitable for time-series analysis", georregistro ≤ 12 m de RMSE radial. Tier 2: não atende à especificação geométrica do Tier 1. |
| https://www.usgs.gov/faqs/are-there-any-restrictions-use-or-redistribution-landsat-data | "There are no restrictions on Landsat data downloaded from the USGS; it can be used or redistributed as desired." A USGS pede crédito da fonte. |
| https://dados.recife.pe.gov.br/dataset/mapas-de-limites-e-divisoes-territoriais | Recurso "Limites dos Bairros - 2023" (GeoJSON, 2.034.014 bytes, ODbL, recurso modificado em 2026-03-02). Usado como limite oficial de bairro. |
| https://dados.recife.pe.gov.br/dataset/area-urbana | Recursos "Quadras" (GeoJSON, 42.167.459 bytes), "Lotes" (GeoJSON, 136.947.752 bytes), dicionários de dados de quadra e lote. Licença ODbL. Responsável: Secretaria de Infraestrutura e Serviços Urbanos; disponibilização: EMPREL; frequência declarada: anual. |
| https://dados.recife.pe.gov.br/dataset/censo-arboreo | Recurso "Censo Arbóreo - 2023" (GeoJSON, 307.270.419 bytes, ODbL, metadados modificados em 2026-03-02). Descrição: "Relação de árvores existentes e catalogadas no município, com geolocalização." |
| https://dados.recife.pe.gov.br/api/3/action/package_search | API CKAN do portal, usada para localizar os conjuntos (buscas: bairros, quadras, lotes, arboreo, arvores, esig). |

## 3. Esquema dos dados

### Landsat Collection 2 Level 2 (Planetary Computer)
- Itens: `LC0[89]_L2SP_214066_AAAAMMDD_02_T[12]`, path/row WRS-2 214/066. Aquisições por volta de 12:29 UTC (cerca de 09:29 no horário local).
- Asset `lwir11` = arquivo `*_ST_B10.TIF`: COG uint16, grade de 30 m, nodata 0. Conversão: `T(°C) = DN × 0.00341802 + 149.0 − 273.15`.
- Asset `qa_pixel` = `*_QA_PIXEL.TIF`: COG uint16 com campos de bits (lista na seção 2).
- Asset `qa` = `*_ST_QA.TIF`: int16, incerteza em K = DN × 0.01, nodata -9999.
- Outros assets ligados a ST no item: `emis` (ST_EMIS), `cdist` (ST_CDIST, distância à nuvem em km), `trad`, `urad`, `drad`, `atran`, `emsd`.
- Licença: domínio público segundo a FAQ da USGS; o catálogo STAC diz "proprietary" (ver seção 8).
- Volume lido: só a janela do bbox municipal (cerca de 585 × 835 pixels de 30 m por banda, 244.500 pixels dentro do polígono), sem baixar a cena inteira.

### Bairros (Prefeitura do Recife)
- Arquivo: `limites-dos-bairros-2023.geojson`, EPSG:4326, 94 feições, área somada de 220,05 km² (calculada em EPSG:31985).
- Colunas usadas: `CBAIRRCODI` (código), `EBAIRRNOME` (nome em caixa alta), `geometry`. Códigos: Boa Viagem 205 (8,34 km²), Casa Forte 442 (0,56 km²), Graças 167, Espinheiro 124, Madalena 647.

### Quadras (Prefeitura do Recife)
- Existe camada de quadras pronta: não foi preciso dissolver lotes.
- Arquivo: `quadras.geojson`, CRS84, 11.105 feições MultiPolygon, 11.035 valores distintos de `DSQ` (70 feições compartilham `DSQ` com outra).
- Campos reais no arquivo: `OBJECTID`, `CDSADMCODI` (distrito), `CSETCECODI` (setor), `CQUASECODI` (quadra), `DSQ` (concatenação distrito + setor + quadra, texto, exemplo "61850287"), `TQUADRASULAT` (todas as feições entre 2023-08-23 14:57:56 e 14:57:59), `DB2GSE.ST_Area(SHAPE)`, `DB2GSE.SdeLength(SHAPE)`.
- O dicionário de dados publicado (`dicionario-de-dados-da-quadra-viaria.json`) lista nomes diferentes (`distrito_fiscal`, `setor_censitario`, `quadra_viaria`, `contatenacao`), que não batem com o GeoJSON.
- O dicionário de Lotes lista os campos `distrito`, `setor`, `quadra`, `face`, `lote`. O campo `quadra` aparece descrito como "Código oficial do logradouro". O GeoJSON de lotes não foi baixado nesta investigação, então os nomes reais dos campos dele não foram verificados.
- Atribuição de quarteirão a bairro: ponto representativo do polígono dentro do limite do bairro (105 quadras da cidade ficaram sem bairro).

### Censo arbóreo 2023 (Prefeitura do Recife)
- Arquivo: `censo-arboreo-2023.geojson`, 307.270.419 bytes, 259.575 pontos, CRS declarado EPSG:31985 (SIRGAS 2000 / UTM 25S). Todos com `tipo_ponto` = "ARV".
- Colunas de localização: geometria Point em UTM, `x` e `y` (UTM), `x_wgs84` e `y_wgs84` (graus, preenchidos em 100%), `bairro` (sigla, exemplo "DUN"), `rpa`. `idlote` está preenchido em só 18 registros, com formato alfanumérico (exemplo "3MACUC2048") diferente do DSQFL.
- Atributos de árvore: `nome_comum` (120 valores distintos), `nome_sp` (código inteiro), `nomecienti` (108 preenchidos), `altura`, `dap`, `cap`, `copa` (`altura` maior que 0 em só 12.390 registros).
- Datas no arquivo: `created_da` entre 2018-05-22 e 2022-04-06 (preenchido em 2.480 registros), `datamonito` entre 2021-02-02 e 2021-03-02 (6 registros). O "2023" do título não aparece como data nos registros.
- Campos que podem identificar pessoas (excluídos da lista branca, valores não lidos): `created_us` (636 preenchidos, 4 distintos), `last_edite` (169), `resptecnic` (2.157, 10 distintos), `responsave` (3), `contato` (0 preenchidos).
- Lista branca proposta: geometria, `bairro`, `rpa`, `nome_comum`, `nome_sp`, `altura`, `dap`, `copa`.
- Licença: ODbL.

## 4. Resultado contra o critério de aprovação

| Critério | Exigido | Medido | Situação |
|---|---|---|---|
| Cenas úteis 2022 a 2025 | ≥ 6 | 13 com nuvem < 20% no recorte, 9 delas Tier 1 com valores plausíveis | atende |
| Diferença mediana quente menos frio dentro do bairro | ≥ 3 °C | Boa Viagem: 10,40 (máx−mín) e 4,91 (P90−P10). Casa Forte: 1,87 e 1,34 | atende em Boa Viagem, não atende em Casa Forte |
| Quarteirões ≥ 1 pixel térmico real (10.000 m²) | ≥ 70% | Boa Viagem 29,7% (548 quadras), Casa Forte 51,9% (27 quadras), os dois juntos 30,3%. Cidade inteira: 22,9% | não atende |

### 4.1 Cenas 214/066 com nuvem < 20% no recorte municipal

Método: pixels do polígono municipal (união dos 94 bairros) marcados com dilated_cloud, cirrus, cloud ou cloud_shadow, divididos pelos pixels sem fill. Das 165 cenas 214/066 do período, 13 ficam abaixo de 20% (6 abaixo de 10%, 18 abaixo de 30%). Ficaram 146 Tier 1 e 19 Tier 2 no total.

| Data | Cena (ID) | Satélite | Path/Row | Tier | Nuvem na cena inteira (eo:cloud_cover) | Nuvem no recorte do município (QA_PIXEL) | Estação | Usada |
|---|---|---|---|---|---|---|---|---|
| 2022-05-26 | LC09_L2SP_214066_20220526_02_T2 | landsat-9 | 214/066 | T2 | 74,5% | 16,69% | chuvosa (mar-ago) | não (T2, valores implausíveis) |
| 2023-05-21 | LC08_L2SP_214066_20230521_02_T2 | landsat-8 | 214/066 | T2 | 14,8% | 5,89% | chuvosa (mar-ago) | não (T2, valores implausíveis) |
| 2023-06-14 | LC09_L2SP_214066_20230614_02_T2 | landsat-9 | 214/066 | T2 | 5,8% | 0,88% | chuvosa (mar-ago) | não (T2, valores implausíveis) |
| 2023-09-02 | LC09_L2SP_214066_20230902_02_T2 | landsat-9 | 214/066 | T2 | 22,4% | 0,02% | seca (set-dez) | não (T2, valores implausíveis) |
| 2023-10-28 | LC08_L2SP_214066_20231028_02_T1 | landsat-8 | 214/066 | T1 | 37,3% | 4,91% | seca (set-dez) | sim |
| 2024-03-04 | LC08_L2SP_214066_20240304_02_T1 | landsat-8 | 214/066 | T1 | 19,7% | 17,88% | chuvosa (mar-ago) | sim |
| 2024-06-16 | LC09_L2SP_214066_20240616_02_T1 | landsat-9 | 214/066 | T1 | 33,6% | 10,60% | chuvosa (mar-ago) | sim (só Casa Forte; Boa Viagem com 18% de pixels claros) |
| 2024-07-26 | LC08_L2SP_214066_20240726_02_T1 | landsat-8 | 214/066 | T1 | 26,6% | 0,00% | chuvosa (mar-ago) | sim |
| 2024-11-15 | LC08_L2SP_214066_20241115_02_T1 | landsat-8 | 214/066 | T1 | 58,1% | 15,56% | seca (set-dez) | sim |
| 2025-04-16 | LC09_L2SP_214066_20250416_02_T1 | landsat-9 | 214/066 | T1 | 9,8% | 0,01% | chuvosa (mar-ago) | sim |
| 2025-06-03 | LC09_L2SP_214066_20250603_02_T1 | landsat-9 | 214/066 | T1 | 43,9% | 14,30% | chuvosa (mar-ago) | sim |
| 2025-07-13 | LC08_L2SP_214066_20250713_02_T1 | landsat-8 | 214/066 | T1 | 69,5% | 13,04% | chuvosa (mar-ago) | sim |
| 2025-09-07 | LC09_L2SP_214066_20250907_02_T1 | landsat-9 | 214/066 | T1 | 28,6% | 18,68% | seca (set-dez) | sim (só Boa Viagem; Casa Forte com 64% de pixels claros) |

Separação por estação (só T1): 3 cenas na estação seca (set a dez) e 6 na chuvosa (mar a ago). Nenhuma cena de jan ou fev passou do filtro. Distribuição por ano (T1): 2023 com 1, 2024 com 4, 2025 com 4, 2022 com 0.

Os quatro valores T2 dão mediana de bairro entre −15,9 °C e 26,8 °C às 09h30 locais. Os T1 ficam entre 29,2 °C e 42,9 °C. A exclusão foi feita pela regra "só Tier 1" da USGS. A explicação de que os T2 trazem nuvem não detectada pelo QA_PIXEL é uma inferência, não foi verificada.

### 4.2 Diferenças por cena e bairro (mediana da temperatura por quarteirão)

Regras: um quarteirão entra se tiver ao menos um centro de pixel de 30 m dentro do polígono e nenhum pixel com nuvem. A cena entra na mediana do bairro se for T1 e tiver ≥ 80% de pixels claros no bairro.

| Data | Tier | Bairro | Pixels claros no bairro | Quarteirões válidos / total | Máx − mín (°C) | P90 − P10 (°C) | DP entre quarteirões (°C) | Mediana do bairro (°C) | ST_QA mediana (K) | Entra |
|---|---|---|---|---|---|---|---|---|---|---|
| 2022-05-26 | T2 | Boa Viagem | 4,8% | 5 / 548 | 1,28 | 1,03 | 0,52 | 10,09 | 7,07 | não |
| 2022-05-26 | T2 | Casa Forte | 100% | 19 / 27 | 6,82 | 5,42 | 2,09 | 19,92 | 2,81 | não |
| 2023-05-21 | T2 | Boa Viagem | 98,5% | 508 / 548 | 18,63 | 5,08 | 3,55 | 8,88 | 3,71 | não |
| 2023-05-21 | T2 | Casa Forte | 58,6% | 10 / 27 | 5,03 | 4,47 | 2,03 | 5,14 | 7,00 | não |
| 2023-06-14 | T2 | Boa Viagem | 99,9% | 511 / 548 | 17,75 | 9,59 | 3,63 | −15,87 | 5,16 | não |
| 2023-06-14 | T2 | Casa Forte | 100% | 19 / 27 | 2,20 | 1,64 | 0,66 | 0,82 | 4,24 | não |
| 2023-09-02 | T2 | Boa Viagem | 100% | 513 / 548 | 15,75 | 10,22 | 3,66 | 21,83 | 3,83 | não |
| 2023-09-02 | T2 | Casa Forte | 100% | 19 / 27 | 11,87 | 8,81 | 3,90 | 26,77 | 2,79 | não |
| 2023-10-28 | T1 | Boa Viagem | 99,2% | 511 / 548 | 10,57 | 4,96 | 2,02 | 41,30 | 3,81 | sim |
| 2023-10-28 | T1 | Casa Forte | 100% | 19 / 27 | 1,90 | 0,99 | 0,46 | 40,03 | 2,78 | sim |
| 2024-03-04 | T1 | Boa Viagem | 100% | 513 / 548 | 10,97 | 5,08 | 1,96 | 42,89 | 3,10 | sim |
| 2024-03-04 | T1 | Casa Forte | 100% | 19 / 27 | 2,60 | 1,54 | 0,72 | 42,27 | 4,01 | sim |
| 2024-06-16 | T1 | Boa Viagem | 18,3% | 59 / 548 | 3,46 | 2,02 | 0,82 | 29,22 | 4,23 | não |
| 2024-06-16 | T1 | Casa Forte | 100% | 19 / 27 | 1,59 | 1,03 | 0,42 | 31,72 | 2,77 | sim |
| 2024-07-26 | T1 | Boa Viagem | 100% | 513 / 548 | 10,23 | 4,44 | 1,77 | 35,57 | 2,46 | sim |
| 2024-07-26 | T1 | Casa Forte | 100% | 19 / 27 | 1,84 | 1,36 | 0,56 | 34,77 | 2,66 | sim |
| 2024-11-15 | T1 | Boa Viagem | 100% | 513 / 548 | 11,84 | 5,08 | 2,06 | 42,58 | 3,11 | sim |
| 2024-11-15 | T1 | Casa Forte | 100% | 19 / 27 | 2,66 | 1,49 | 0,63 | 41,70 | 2,78 | sim |
| 2025-04-16 | T1 | Boa Viagem | 100% | 513 / 548 | 10,17 | 4,86 | 1,86 | 40,40 | 2,55 | sim |
| 2025-04-16 | T1 | Casa Forte | 100% | 19 / 27 | 1,59 | 1,31 | 0,51 | 40,03 | 2,71 | sim |
| 2025-06-03 | T1 | Boa Viagem | 99,4% | 512 / 548 | 8,81 | 3,69 | 1,46 | 35,37 | 3,41 | sim |
| 2025-06-03 | T1 | Casa Forte | 100% | 19 / 27 | 2,84 | 1,65 | 0,69 | 35,32 | 2,82 | sim |
| 2025-07-13 | T1 | Boa Viagem | 100% | 513 / 548 | 7,14 | 3,16 | 1,25 | 32,06 | 3,60 | sim |
| 2025-07-13 | T1 | Casa Forte | 93,4% | 17 / 27 | 1,37 | 1,06 | 0,43 | 30,97 | 5,31 | sim |
| 2025-09-07 | T1 | Boa Viagem | 89,5% | 458 / 548 | 11,18 | 5,24 | 2,03 | 37,36 | 4,00 | sim |
| 2025-09-07 | T1 | Casa Forte | 64,1% | 11 / 27 | 2,12 | 1,46 | 0,67 | 36,53 | 5,34 | não |

Medianas das diferenças (cenas que entram):

| Bairro | Cenas | Máx − mín (mediana) | P90 − P10 (mediana) | Seca: máx−mín / P90−P10 | Chuvosa: máx−mín / P90−P10 | ST_QA mediana (K) |
|---|---|---|---|---|---|---|
| Boa Viagem | 8 (3 secas) | 10,40 °C | 4,91 °C | 11,18 / 5,08 (3 cenas) | 10,17 / 4,44 (5 cenas) | 3,26 |
| Casa Forte | 8 (2 secas) | 1,87 °C | 1,34 °C | 2,28 / 1,24 (2 cenas) | 1,72 / 1,34 (6 cenas) | 2,78 |
| Graças (informativo) | 9 | 5,20 °C | 2,77 °C | | | 2,92 |
| Espinheiro (informativo) | 9 | 4,64 °C | 2,32 °C | | | 2,94 |
| Madalena (informativo) | 7 | 6,05 °C | 3,01 °C | | | 3,12 |

### 4.3 A variação supera o ruído?

- Estabilidade do ordenamento entre cenas T1 (correlação de Spearman das medianas por quarteirão, par a par entre as cenas que entram): Boa Viagem com mediana 0,87 (mín 0,72, máx 0,95, 28 pares). Casa Forte com mediana 0,62 (mín 0,29, máx 0,83, 28 pares, 17 a 19 quarteirões por par).
- Anomalia média por quarteirão (temperatura do quarteirão menos a mediana do bairro na cena, média das cenas T1): Boa Viagem com P90−P10 de 4,21 °C, máx−mín de 9,46 °C e desvio padrão temporal mediano da anomalia de 0,62 °C por quarteirão. Casa Forte com P90−P10 de 1,07 °C, máx−mín de 1,72 °C e desvio temporal de 0,34 °C.
- Incerteza por pixel informada pela USGS (ST_QA): mediana entre 2,5 e 4,0 K nas cenas T1. Em Boa Viagem o P90−P10 entre quarteirões (4,9 °C) fica acima da ST_QA mediana (3,3 K). Em Casa Forte (1,3 °C) fica abaixo (2,8 K). A ST_QA tem componente atmosférico comum aos pixels vizinhos. Por isso a comparação direta entre ST_QA e diferença entre quarteirões é inferência, não teste formal.
- Cobertura de pixels: em Casa Forte, 8 das 27 quadras não contêm nenhum centro de pixel de 30 m. Em Boa Viagem, 35 das 548.

### 4.4 Área dos quarteirões (EPSG:31985)

| Bairro | Quadras | ≥ 10.000 m² | < 10.000 m² | Área mediana | P10 | P90 |
|---|---|---|---|---|---|---|
| Boa Viagem | 548 | 29,7% | 70,3% | 8.327 m² | 1.315 m² | 17.056 m² |
| Casa Forte | 27 | 51,9% | 48,1% | 10.636 m² | 25 m² | 40.102 m² |
| Graças | 82 | 54,9% | 45,1% | 10.692 m² | 113 m² | 36.095 m² |
| Espinheiro | 57 | 45,6% | 54,4% | 8.907 m² | 214 m² | 24.464 m² |
| Madalena | 162 | 30,2% | 69,8% | 7.254 m² | 398 m² | 17.558 m² |

Depois de dissolver por `DSQ`: Boa Viagem com 544 quadras e 29,2% ≥ 10.000 m², Casa Forte com 27 e 51,9%.

### 4.5 Censo arbóreo cruzado com quarteirões (verificação de viabilidade)

- Contagem por ponto dentro do polígono da quadra (EPSG:31985). Boa Viagem: 8.977 árvores no polígono do bairro (10,8 por ha), 16,8% das quadras sem nenhuma árvore. Casa Forte: 2.055 árvores no bairro (36,7 por ha), 25,9% das quadras sem nenhuma árvore.
- Árvores de calçada caem fora do polígono de quadra quando o polígono termina no alinhamento do lote. A soma de árvores dentro de quadras de Boa Viagem (10.255) passa da contagem no polígono do bairro porque há quadras que cruzam o limite do bairro. Para contar por quarteirão vai ser preciso definir um buffer (exemplo: meia largura de via) ou usar contagem por face de quadra.
- Correlação de Spearman entre árvores por ha da quadra e anomalia média de temperatura: Boa Viagem 0,198 (n = 525, p ≈ 5e-6). Casa Forte 0,587 (n = 19, p ≈ 0,008). Fatores de confusão (área da quadra, borda com via e água, mistura de pixels) não foram controlados, então esses números não sustentam nenhuma relação causal.

## 5. Riscos e o que não foi possível verificar

- Resolução: o ST_B10 vem em grade de 30 m, mas é medido a 100 m (USGS: "100 (resampled to 30)"). Quarteirões menores que 1 ha recebem valor de pixels interpolados que misturam vizinhos. A mediana por quarteirão não é medição independente por quarteirão.
- Valores extremos em Boa Viagem (máx−mín em torno de 10 °C): não foi verificado se vêm de quadras de borda com praia, mangue, canal ou grandes áreas pavimentadas. O P90−P10 reduz esse efeito, mas não o elimina.
- Nuvem não detectada: as 4 cenas T2 com QA_PIXEL limpo deram temperaturas fisicamente implausíveis. Nas T1 não foi verificado se sobra nuvem residual não marcada.
- Horário fixo: todas as cenas são de cerca de 09h30 locais. A temperatura de superfície às 09h30 não representa o pico da tarde nem a noite.
- Temperatura de superfície não é temperatura do ar. O produto mede a superfície radiante vista de cima (telhados, copas, asfalto), não o calor ao nível da rua.
- Série curta: 1 cena T1 em 2023, nenhuma em 2022, 3 na estação seca. Uma média sazonal de seca fica com poucas amostras.
- Path/row 214/065: tem as mesmas datas de aquisição (mesma passagem). Não foi usado porque 214/066 já cobre o município inteiro. Não foi verificado se combinar as duas cenas muda a máscara de nuvem.
- Camada de quadras: 70 feições com `DSQ` repetido e 105 quadras sem bairro pelo critério do ponto representativo. Os dicionários publicados não batem com os nomes reais dos campos. A data de atualização das feições é 2023-08-23.
- Censo arbóreo: o título diz 2023, mas as datas preenchidas nos registros vão de 2018 a 2022 e cobrem uma minoria dos registros. A data de referência do levantamento não foi verificada. `altura` só é maior que 0 em 4,8% dos registros.
- Não verificado: nomes reais dos campos no GeoJSON de Lotes (o arquivo não foi baixado). Termos de uso do Planetary Computer (página carregada por JavaScript, sem leitura). O link de licença citado no STAC devolve 404.
- Ambiente: o GDAL embutido no rasterio rejeitou a cadeia TLS da rede local (CERT_TRUST_IS_UNTRUSTED_ROOT). A leitura funcionou exportando as raízes do repositório de certificados do Windows para um PEM e passando `CURL_CA_BUNDLE` e `GDAL_CURL_CA_BUNDLE` antes de importar o rasterio, com a verificação TLS ligada. O `curl` do Git Bash truncou downloads grandes do portal do Recife perto de 32 MB, e o servidor não aceita Range. O `curl.exe` do Windows baixou os arquivos completos.

## 6. Plano B

Viável, com escala declarada:

| Opção | Escala declarada na tela | Boa Viagem (mediana das cenas T1) | Casa Forte (mediana das cenas T1) | Observação |
|---|---|---|---|---|
| Grade de 100 m (média dos pixels de 30 m em cada célula de 100 m em UTM 25S; célula aceita com ≥ 8 pixels, todos claros) | "por célula de 100 m (resolução nativa do sensor térmico)" | 802 células, P90−P10 6,64 °C, máx−mín 14,0 °C | 51 células, P90−P10 1,66 °C, máx−mín 3,84 °C | A célula coincide com a resolução medida pelo TIRS. Um anúncio é ligado à célula do edifício. |
| Por bairro (mediana dos pixels claros do bairro; bairro aceito com ≤ 10% de nuvem) | "por bairro" | entre 57 e 94 bairros válidos por cena; entre os bairros, P90−P10 mediano de 3,78 °C e máx−mín mediano de 10,06 °C | idem | Diferença entre os bairros-alvo pequena na mesma cena (exemplo 2024-11-15: Boa Viagem 42,16, Casa Forte 41,80, Graças 41,36, Espinheiro 41,72, Madalena 42,94 °C). |
| Quarteirão só quando área ≥ 10.000 m² | "por quarteirão (quarteirões ≥ 1 ha)" | 29,7% das quadras | 51,9% das quadras | Deixa a maioria dos quarteirões sem valor. |

O que muda na escala declarada: de "por quarteirão" para "por célula de 100 m", com data da cena, horário (cerca de 09h30), satélite e a frase "temperatura de superfície, não do ar". O dado mostrado é a posição da célula na distribuição do bairro ou da cidade (percentil), sem adjetivo.

## 7. Roteiro reproduzível (até um dia)

Pré-requisitos: `uv`. Na rede corporativa, também `curl.exe` do Windows e um PEM com as raízes do Windows. Scripts em `scratchpad/inv5/scripts/`.

1. Diretórios: `mkdir dados scripts saida ca`.
2. Dados da Prefeitura (usar `curl.exe -L`, porque o portal redireciona para armazenamento assinado):
   - `curl.exe -s -L -o dados/bairros-2023.geojson "https://dados.recife.pe.gov.br/dataset/ce23d3f4-7474-44d3-b310-19f3afcebf4a/resource/d5f956ce-7e1f-4c74-839b-06cb490c3721/download/limites-dos-bairros-2023.geojson"`
   - `curl.exe -s -L -o dados/quadras.geojson "https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/a961bf64-f6fe-4b1d-95c5-456bf0d01a31/download/quadras.geojson"` (conferir 42.167.459 bytes)
   - `curl.exe -s -L -o dados/censo-arboreo-2023.geojson "https://dados.recife.pe.gov.br/dataset/e3ed201c-ab2f-4a42-b364-a1897724add1/resource/4ac43805-0f44-43b0-bdf1-c25d89b5fa5d/download/censo-arboreo-2023.geojson"` (conferir 307.270.419 bytes)
3. Só se o GDAL acusar erro de certificado: `python -I scripts/exporta_ca.py ca/windows-roots.pem`.
4. Nuvem no recorte municipal (165 cenas, cerca de 5 min): `uv run --with pystac-client --with planetary-computer --with rasterio --with geopandas --with numpy python -I scripts/nuvem_recorte.py dados/bairros-2023.geojson dados/nuvem_recorte.json ca/windows-roots.pem`
5. Temperatura por quarteirão, grade de 100 m e bairro (13 cenas, cerca de 5 min): `uv run --with pystac-client --with planetary-computer --with rasterio --with geopandas --with numpy --with pandas --with scipy python -I scripts/temp_quarteirao.py dados/bairros-2023.geojson dados/quadras.geojson dados/nuvem_recorte.json saida ca/windows-roots.pem`
6. Resumo com filtro Tier 1 e ≥ 80% de pixels claros: `uv run --with geopandas --with numpy --with pandas --with scipy python -I scripts/resumo.py saida dados/nuvem_recorte.json dados/quadras.geojson dados/bairros-2023.geojson`
7. Censo arbóreo por quarteirão: `uv run --with geopandas --with pyogrio --with numpy --with pandas --with scipy python -I scripts/censo.py dados/censo-arboreo-2023.geojson dados/quadras.geojson dados/bairros-2023.geojson saida dados/nuvem_recorte.json`
8. Saídas: `saida/areas_quadras.csv`, `saida/dif_por_cena_bairro.csv`, `saida/dif_T1_util.csv`, `saida/grade100m.csv`, `saida/por_bairro.csv`, `saida/medianas_quadra_cena.csv`, `saida/estabilidade_ranking.csv`.

Parâmetros fixos: busca STAC com `collections=["landsat-c2-l2"]`, `platform in [landsat-8, landsat-9]`, `landsat:wrs_row = "066"`, período 2022-01-01 a 2025-12-31. Máscara de nuvem: bits 1, 2, 3 e 4 do QA_PIXEL, mais fill (bit 0) e DN = 0. Limiar de 20% no recorte municipal. Só cenas Tier 1. Bairro com ≥ 80% de pixels claros. Quarteirão sem nenhum pixel com nuvem.

## 8. Dúvidas de licença ou termos de uso

- O STAC do Planetary Computer marca a coleção como "proprietary" e aponta a licença para uma página da USGS que devolve 404. A FAQ da USGS diz que não há restrição de uso nem de redistribuição. Ficam em aberto: qual texto vale para dados lidos via Planetary Computer, e qual frase de crédito a USGS pede hoje (a FAQ remete à página "EROS Data Citation", que não foi lida).
- Termos de uso do Planetary Computer (tokens SAS anônimos, limites de uso, cache de derivados): não lidos.
- ODbL nas camadas da Prefeitura (bairros, quadras, censo arbóreo): uma tabela derivada (exemplo: temperatura por célula ou quarteirão combinada com quadras ODbL) pode cair no share-alike. Falta definir que forma de atribuição atende ao portal.
- Censo arbóreo: campos `created_us`, `last_edite`, `resptecnic` e `responsave` podem conter nomes ou logins de pessoas. Mesmo sob ODbL, a ingestão precisa seguir a lista branca do projeto.
- Combinação de domínio público (Landsat) com ODbL (Prefeitura) no mesmo banco: falta definir como declarar as duas origens.

## (a) Pedido por ofício ou LAI

Solicita-se à EMPREL/SEINFRA a data de referência do levantamento do Censo Arbóreo publicado como "2023" e o dicionário de dados atualizado das camadas Quadras e Lotes com os nomes de campo usados nos GeoJSON publicados.

## (b) Próxima ação concreta

Gerar a camada de células de 100 m com o percentil de temperatura de superfície (mediana das 9 cenas T1) para os cinco bairros-alvo e verificar, quadra a quadra em Boa Viagem, se os extremos vêm de bordas com água ou praia.
