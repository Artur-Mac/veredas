# Investigação 3 (E4): casamento IPTU × modelo 3D por DSQFL

Data de acesso de todas as fontes: 2026-10-14.

## 1. Resposta curta

Sim: nos cinco bairros-alvo, 90,3% dos lotes com IPTU 2026 e ano de construção anterior a 2013 (7.344 de 8.136 DSQFL) têm volume no modelo 3D de 2013 pelo DSQFL. Cada bairro fica acima de 80% (o menor é Madalena, com 83,4%). Para prédios de 2013 em diante, a taxa é de 32,4% pelo DSQFL.

## 2. Evidências

| URL (acesso em 2026-10-14) | O que confirma |
|---|---|
| https://dados.recife.pe.gov.br/api/3/action/package_search?q=lotes | O conjunto "area-urbana" contém os recursos Lotes, Edificações 3D, Edificações - Lotes, Edificações - Pavimentos e Face de Quadra, sob a licença `odc-odbl` |
| https://dados.recife.pe.gov.br/dataset/area-urbana | Licença ODbL, autor e mantenedor EMPREL, frequência anual, última atualização em 2026-03-02 |
| https://dados.recife.pe.gov.br/dataset/area-urbana/resource/b014a450-1e3d-4515-9d30-d5a21fe392b9 | "Edificações 3D": ZIP de 93 MiB, ODbL, criado em 2026-03-02 |
| https://dados.recife.pe.gov.br/api/3/action/resource_show?id=9a847338-92a6-4b74-b3e8-c8f8b57aff2d | IPTU 2026: CSV de 128.498.052 B, última modificação em 2026-10-03, `datastore_active: true` |
| https://dados.recife.pe.gov.br/dataset/imposto-predial-e-territorial-urbano-iptu | IPTU: ODbL, autor Secretaria de Finanças, mantenedor EMPREL, frequência anual |
| https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=9a847338-92a6-4b74-b3e8-c8f8b57aff2d&limit=0 | IPTU 2026 tem 422.776 registros. Lista real de campos: não há DSQFL, mas há `Código Logradouro`, `latitude` e `longitude` (estes dois ausentes do dicionário) |
| https://dados.recife.pe.gov.br/dataset/4a82b8b9-66a1-441c-aece-dfdf1dbbf994/resource/ccbe03c4-6241-45a5-a081-53ec7e45badb/download/dicionario-de-dados-iptu.json | Dicionário do IPTU: nenhum campo de lote ou DSQFL |
| https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/a9db29eb-9a64-4319-8b98-008d20ce72c8/download/dicionario-de-dados-dos-lote.json | Dicionário de Lotes: `concatenacao` ("distrito + setor + quadra + face + lote", Char 14), `ano_construcao`, `qtd_pavimento`, `area_construida` |
| https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/5586473b-d939-4a6f-a7db-556e2f25ac6d/download/dicionario-de-dados-edificacoes-pavimento.json | DSQFL descrito como "14 dígitos ... D.SSSS.QQQ.FF.LLLL" |
| https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento3D/BASES_EDIFICACAO_RECIFE3D_2013/MapServer/0 | Camada "Edificação Recife 2013": 523.547 feições, SRID 31985, campo `dsqfl`, alturas `mde`/`mdt`/`mds`, consulta espacial habilitada, `maxRecordCount` 2000 |
| https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento/BASES_LOTES_EDIFICACAO_BAIRRO/MapServer/3 | "Edificação 3D": mesma contagem (523.547) e mesmos campos |
| https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento/BASES_BAIRRO_FACEQUADRA_LOGRADOURO_LOTE/MapServer | Camadas 3 Lotes (126.534 feições; `DSQFL`, `DSQFL_N`, `ANCONSTR`, `QTDPAVIMENTOS`, `ENDNUMERO`), 5 Face de Quadra (`DSQF`, `LOGRA`, `CBAI`) e 2 Visão Bairros |
| Arquivo `Edificacoes 3D.qmd`, dentro do ZIP do CKAN | O ZIP do portal é uma exportação de `.../BASES_LOTES_EDIFICACAO_BAIRRO/MapServer/3`, com data interna de 2023-09-18, 523.547 feições e os primeiros registros idênticos aos do serviço "RECIFE3D_2013" |
| https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=39927a3d-3235-436a-9dc8-df7f4ea3b720&limit=0 | Licenciamento Urbanístico: 113.305 registros. Tem campo `dsqfl` no formato `D.SSSS.QQQ.FF.LLLL`, com 18 caracteres e pontos |

O ano "2013" vem apenas dos nomes do serviço (`BASES_EDIFICACAO_RECIFE3D_2013`) e da camada ("Edificação Recife 2013"). Não localizei documento oficial do levantamento (método, data do voo, LOD), então esse ponto fica como não verificado.

## 3. Esquema dos dados

| Recurso | Formato | Colunas relevantes (nome exato) | Licença | Atualização | Tamanho |
|---|---|---|---|---|---|
| Lotes (CKAN `lotes.geojson`) | GeoJSON | `concatenacao`, `ano_construcao`, `qtd_pavimento`, `area_construida`, `area_lote`, `qtd_subunidades` (segundo o dicionário; o arquivo não foi baixado, ver seção 5) | ODbL | 2026-03-02 | 136.947.752 B |
| Lotes (serviço ESIG, camada 3) | ArcGIS REST | `DSQFL` (texto, 14 dígitos sem separador), `DSQFL_N` (numérico), `DISTRITO`, `SETOR`, `QUADRA`, `FACE`, `LOTE`, `ENDNUMERO`, `ANCONSTR`, `QTDPAVIMENTOS`, `AREATOTALCONSTRUIDA`, `QTDUNHAB`, `SITUACAOIMOVEL`, `TLOTESULAT` | não declarada no serviço | `TLOTESULAT` = 2023-08-17 em 16.777 de 18.219 feições baixadas | 126.534 feições |
| Edificações 3D (CKAN `edificacoes-3d.zip` com `Edificacoes 3D.geojson`) | ZIP com GeoJSON (CRS84 com Z) | `DSQFL`, `CDSADMCODI` (D), `CSETCECODI` (S), `CQUASECODI` (Q), `CFACESNUME` (F), `CDLOTENUM` (L), `MDE`, `MDT`, `MDS`, `Z_MIN`, `Z_MAX`, `Z_MEAN`, `CEDIFNUM` | ODbL | 2026-03-02 no portal; 2023-09-18 dentro do ZIP | 97.595.760 B (GeoJSON descompactado: 605.116.009 B) |
| Edificação Recife 2013 (serviço ESIG) | ArcGIS REST | os mesmos campos em minúsculas (`dsqfl`, `mds` etc.) | não declarada no serviço | não declarada | 523.547 feições |
| Face de Quadra (serviço ESIG, camada 5) | ArcGIS REST | `DSQF` (11 dígitos: D+SSSS+QQQ+FFF, face com 3 dígitos), `LOGRA`, `CBAI`, `NOMEBAIRRO` | não declarada no serviço | não declarada | 3.790 faces nos bairros-alvo |
| IPTU 2026 (CKAN CSV e datastore) | CSV, separador `;`, decimal com vírgula | lidas: `bairro`, `logradouro`, `numero`, `Código Logradouro`, `AREA TERRENO`, `AREA CONSTRUIDA`, `valor cobrado de IPTU`, `ano da construção corrigido`, `quantidade de pavimentos`, `latitude`, `longitude`. Excluídas pela lista branca: `Número do contribuinte`, `CPF/CNPJ mascarado do contribuinte`, `tipo de contribuinte`, `complemento`, `Regime de Tributação do iptu`, `Regime de Tributação da trsd` e demais | ODbL | 2026-10-03 | 128.498.052 B; 422.776 registros |
| Licenciamento Urbanístico | CSV e datastore | `dsqfl` (18 caracteres com pontos), `tipo_processo`, `data_entrada`, `bairro`. Excluídas pela lista branca: `cnpj`, `razao_social`, `razao_social_mercantil`, `inscricao_mercantil` | ODbL | 2026-06-17 | 74.234.215 B; 113.305 registros |
| Edificações - Lotes / Edificações - Pavimentos | GeoJSON | `dsqfl`, `pavimento`, `QTAREA_TIP` (segundo o dicionário) | ODbL | 2026-03-02 | 84.208.543 B / 172.368.434 B (não baixados) |

**Formatos de DSQFL verificados nos dados baixados:**
- **Lotes e 3D:** 14 dígitos sem separador (D 1, SSSS 4, QQQ 3, FF 2, LLLL 4). Exemplo: `61755015020005`.
- **Lotes, conferência interna:** `DSQFL` = `str(DSQFL_N).zfill(14)` em 18.218 de 18.219 feições. Uma tem 13 caracteres.
- **3D sem lote:** 286.743 dos 523.547 blocos da cidade (54,8%) têm `CDLOTENUM` = 0. Nesses blocos, o DSQFL vem truncado até a face, com 11 dígitos (222.175 blocos) ou 10 dígitos (64.568 blocos), e não casa com nenhum lote. Outros 2 blocos têm 13 dígitos (lote com 3 dígitos). Nos envelopes dos bairros-alvo, isso ocorre em 8.382 de 56.362 blocos (14,9%).
- **Face de Quadra:** usa a face com 3 dígitos. Lotes e 3D usam 2.
- **Licenciamento:** usa pontos (`6.1840.065.04.0138`). Para converter, basta remover os pontos.
- **IPTU:** não tem DSQFL. O vínculo é feito pela posição (`latitude`/`longitude`) ou pelo endereço (`Código Logradouro` + `numero`).

**Registros de IPTU por DSQFL** (8.862 DSQFL vinculados nos bairros-alvo): mediana 1, média 11,6, p90 36, p99 112,8, máximo 645. 5.418 DSQFL têm 1 registro e 3.444 têm mais de 1 (unidades autônomas).

## 4. Resultado contra o critério de aprovação

**Método:**
- **Universo:** DSQFL distinto de lote cujo ponto representativo cai no polígono do bairro e que tem pelo menos um registro de IPTU 2026 vinculado.
- **Vínculo IPTU para DSQFL:** ponto lat/long dentro do polígono do lote. Como alternativa, `Código Logradouro` = `LOGRA` da face e `numero` = `ENDNUMERO`.
- **Qualidade do vínculo:**
  - 91.702 de 105.149 registros casaram pela posição e 93.447 pelo endereço.
  - Onde os dois métodos existem, concordam em 82.193 de 82.252 registros.
  - 2.252 registros (2,1%) ficaram sem DSQFL. 13.286 não têm lat/long.
- **Estrato:** moda do `ano da construção corrigido` entre as unidades do lote.
- **"Casado (DSQFL)":** o DSQFL existe na camada 3D.
- **"Espacial":** pelo menos um bloco 3D tem 50% ou mais da sua área dentro do lote.

| Bairro | Pré-2013: lotes com IPTU | Casados (DSQFL) | % DSQFL | % espacial | 2013 em diante: lotes com IPTU | Casados (DSQFL) | % DSQFL | % espacial com altura coerente* |
|---|---|---|---|---|---|---|---|---|
| Boa Viagem | 4.309 | 3.961 | 91,9 | 97,8 | 239 | 146 | 61,1 | 53,1 |
| Casa Forte | 548 | 538 | 98,2 | 99,1 | 18 | 12 | 66,7 | 55,6 |
| Espinheiro | 746 | 679 | 91,0 | 97,1 | 24 | 14 | 58,3 | 54,2 |
| Graças | 978 | 869 | 88,9 | 96,3 | 44 | 26 | 59,1 | 40,9 |
| Madalena | 1.555 | 1.297 | 83,4 | 97,2 | 401 | 37 | 9,2 | 77,6 |
| **Total** | **8.136** | **7.344** | **90,3** | **97,5** | **726** | **235** | **32,4** | **66,0** |

\* A altura é considerada coerente quando `mds` máximo do bloco ≥ 0,5 × 3,28 m × `QTDPAVIMENTOS` do Lotes. O fator 3,28 m é a mediana observada em lotes pré-2013 casados.

- **Altura dos blocos sobrepostos a prédios novos:** 89,3% dos lotes de 2013 em diante têm algum bloco 3D sobreposto, mas em 26,1% desses lotes o bloco tem menos da metade da altura esperada. Nos lotes pré-2013, essa proporção é de 0,5%. Interpretação (inferência): em parte dos lotes novos, o volume de 2013 é a edificação anterior ao prédio atual.
- **Desdobramento do "2013 em diante":** são 56 DSQFL com ano igual a 2013 (78,6% casam pelo DSQFL) e 670 com ano posterior (28,5% casam).
- **Ponderando por unidades** (registros de IPTU), a fração pré-2013 que casa pelo DSQFL é:

| Bairro | % das unidades |
|---|---|
| Boa Viagem | 94,0 |
| Casa Forte | 99,4 |
| Espinheiro | 90,7 |
| Graças | 90,6 |
| Madalena | 77,4 |

- **Ano pelo campo `ANCONSTR` do Lotes:** ele é nulo ou zero em 5.669 de 8.862 lotes. Onde existe, a taxa pré-2013 é de 92,1% (2.661 de 2.889) e a pós-2013 é de 38,1%.

**Causas de não casamento pelo DSQFL**, contadas sobre todos os não casados (792 pré-2013 e 491 em 2013 ou depois):

| Causa | Pré-2013 | 2013 em diante |
|---|---|---|
| Há volume 3D sobre o lote, mas com DSQFL truncado até a face (`CDLOTENUM` = 0) | 273 | 181 |
| Há volume 3D com DSQFL de 14 dígitos de outra quadra ou setor, ausente do Lotes vigente (por exemplo `41545091020306` contra `41545090020306`, quadra renumerada) | 198 | 84 |
| Dois ou mais DSQFL antigos sobre um lote atual (remembramento), dos quais 62 e 54 incluem DSQFL truncado | 89 | 113 |
| Mesma quadra, lote ou face diferente (desmembramento ou renumeração) | 14 | 28 |
| Volume 3D com DSQFL de outro lote vigente (código trocado ou geometria deslocada) | 45 | 8 |
| O bloco 3D toca o lote, mas com menos de 50% da sua área dentro (geometria deslocada ou bloco compartilhado) | 128 | 58 |
| Sem nenhum volume 3D sobre o lote | 45 | 19 (prédio novo) |

Dentro dos bairros-alvo, 1.518 dos 9.507 DSQFL distintos do 3D não existem no Lotes vigente.

## 5. Riscos e o que não foi possível verificar

- **Ano de referência do 3D:** "2013" vem só do nome do serviço. O ZIP do CKAN tem data interna de 2023-09-18. Método, data do voo e definição de `MDS`/`MDE`/`MDT` não foram verificados. A relação `MDS` = `MDE` − `MDT` foi observada nos registros (7,32 − 2,198 = 5,122), mas é inferência que `MDS` seja a altura acima do terreno.
- **`ano da construção corrigido`:** o nome sugere um valor revisado. Não verifiquei se reflete o ano original da obra. Há 443 DSQFL com anos divergentes entre unidades e valor mínimo de 1197. Madalena tem 401 lotes classificados em 2013 ou depois, dos quais 77,6% têm volume 3D com altura coerente. Isso é compatível com ano revisado ou recodificação de quadra, mas não foi verificado.
- **Defasagem entre bases:** os atributos do Lotes datam majoritariamente de 2023-08-17 e o IPTU é de 2026. Prédios e remembramentos posteriores a 2023 podem não ter polígono próprio.
- **Componentes nulos:** 1.148 de 18.219 lotes baixados têm `DISTRITO`/`SETOR`/`QUADRA`/`FACE`/`LOTE` nulos, embora tenham `DSQFL`. O casamento usou `DSQFL`.
- **14 DSQFL duplicados** entre polígonos de lote nos bairros-alvo.
- **IPTU `quantidade de pavimentos`:** valores de −1 a 3, mediana 1 mesmo em lotes com 10 ou mais unidades. A correlação de Spearman com a altura 3D é de −0,043. Não representa os pavimentos do prédio.
- **Origem dos dados no cálculo:** usei os serviços ArcGIS do ESIG (recorte por envelope do bairro) e o datastore do CKAN (filtro `bairro`, projeção de colunas no servidor), e não os arquivos `lotes.geojson` e `iptu_2026.csv`. Os downloads completos desses dois arquivos foram interrompidos por "Connection reset", e o servidor não aceita `Range`, então não há retomada. A equivalência do 3D entre CKAN e serviço foi confirmada (mesma contagem, mesmos campos e primeiros registros). A equivalência do Lotes entre os dois não foi verificada.
- **Divergência de bairro:** o filtro `bairro` do IPTU usa a grafia "Gracas" (sem cedilha). Registros do IPTU cuja coordenada cai fora dos polígonos-alvo não entram no universo.
- **Licenciamento:** não testei o casamento com o 3D. Numa amostra de 500 registros filtrados por "Boa Viagem", apareceram DSQFL de distritos 1, 3 e 4, o que indica que o campo `bairro` pode não ser o do lote (não verificado).

## 6. Plano B

O plano B é viável, com uma troca de fonte: a coluna de pavimentos do IPTU não serve. A que serve é `QTDPAVIMENTOS` do Lotes (serviço ESIG; `qtd_pavimento` no dicionário do CKAN).

- **Cobertura de `QTDPAVIMENTOS` > 0** nos lotes do universo:

| Bairro | Cobertura |
|---|---|
| Boa Viagem | 100,0% |
| Casa Forte | 100,0% |
| Espinheiro | 100,0% |
| Graças | 99,9% |
| Madalena | 98,3% |

- **Relação com a altura 3D** nos lotes casados: Spearman de 0,844 e altura de 3,28 m por pavimento na mediana (p10 2,77, p90 5,22).
- **O que muda na escala declarada:**
  - O volume passa a ser "por lote, footprint do lote (ou de Edificações - Lotes, não testado), altura estimada = pavimentos do cadastro × fator, inferência".
  - Deixa de ser "volume medido em 2013".
  - A data passa a ser a do atributo do Lotes (`TLOTESULAT`, 2023-08-17 na maior parte), e não 2013.

## 7. Roteiro reproduzível

Diretório: `scratchpad\inv3\`. Scripts em `scripts\`, saídas em `saida\` e `saida_analise.txt`.

1. Lotes, faces e 3D por bairro (cerca de 20 min). Gera `dados/esig/{bairros_alvo,faces,lotes,edif3d_2013}.gpkg`:
   ```
   uv run --with geopandas --with pyogrio --with shapely python -I scripts/fetch_esig.py dados/esig
   ```
2. IPTU 2026 só com as colunas da lista branca, via `datastore_search`, 500 registros por página, cerca de 12 min:
   ```
   python -I scripts/fetch_iptu.py dados/iptu
   ```
3. Formatos, vínculo IPTU para DSQFL, taxa por bairro e estrato, causas e plano B:
   ```
   uv run --with geopandas --with pyogrio --with shapely python -I scripts/analise.py dados/esig dados/iptu saida
   ```
4. Plausibilidade de altura e subtipos de causa:
   ```
   uv run --with geopandas --with pyogrio --with shapely python -I scripts/complemento.py dados/esig saida
   ```
5. (Opcional) Conferência do ZIP do CKAN:
   - Baixe com `sh scripts/baixar.sh <dir> <url> 97595760`.
   - Rode `unzip -l` e leia o `.qmd`.
   - Conte os comprimentos de `"DSQFL"` com `grep -o '"DSQFL": "[^"]*"' | awk '{print length($2)}' | sort | uniq -c`.

## 8. Dúvidas de licença ou termos de uso (apenas listadas)

- **Share-alike:** a ODbL dos conjuntos "area-urbana", "IPTU" e "Licenciamento Urbanístico" exige compartilhamento pela mesma licença. Fica a dúvida se a tabela edifício para DSQFL derivada deles é "base de dados derivada" a ser publicada sob ODbL.
- **Serviços do ESIG:** os serviços ArcGIS em `esigportal2.recife.pe.gov.br` não declaram licença (`copyrightText` vazio). Fica a dúvida se a ODbL dos recursos do CKAN se estende às camadas consultadas diretamente nesses serviços, e se há termos de uso para consulta automatizada (não verificado; `esig.recife.pe.gov.br` redireciona para `conecta.recife.pe.gov.br`).
- **Atribuição:** o portal não informa texto de atribuição. A "Política de Dados Abertos" (`/base/doc/recife/plano_de_dados_abertos_do_recife.pdf`) não foi lida.
- **IPTU e reidentificação:** o IPTU 2026 publica `latitude`/`longitude` por imóvel e `complemento`. Fica a dúvida se combinar esses campos com outras bases cria dado que identifique pessoa, mesmo sem ler os campos de contribuinte.
- **Status do 3D:** o 3D de 2013 está no CKAN como ODbL. Não há declaração sobre o contratante do levantamento nem sobre eventuais restrições do fornecedor.

## (a) Pedido de ofício ou LAI

Solicito à Prefeitura do Recife (ESIG/EMPREL) o relatório técnico ou os metadados da camada "Edificação Recife 2013": data do levantamento, método, nível de detalhe, definição dos campos MDE, MDT e MDS e critério de atribuição de DSQFL aos blocos com CDLOTENUM igual a zero. Peço também a definição do campo "ano da construção corrigido" do IPTU.

## (b) Próxima ação

Gerar a tabela edifício para DSQFL com a regra "DSQFL exato; senão, bloco 3D com 50% ou mais da área dentro do lote vigente". Exibir o volume como "medido em 2013" apenas quando a altura for coerente com `QTDPAVIMENTOS`, e marcar os demais lotes para o plano B.
