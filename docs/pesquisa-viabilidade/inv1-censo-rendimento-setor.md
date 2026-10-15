# Investigação 1: Censo 2022, rendimento por setor censitário (Recife)

Data de acesso de todas as fontes: 2026-10-14.

## 1. Resposta curta

Sim, com ressalva de conceito: o IBGE publicou por setor censitário a média (30/04/2025) e a mediana (arquivos datados de 08/05/2026) do rendimento nominal mensal **da pessoa responsável pelo domicílio**, junto com a contagem de responsáveis por setor; rendimento domiciliar per capita (todos os moradores) só existe por área de ponderação.

## 2. Evidências

| URL (acesso 2026-10-14) | O que confirma |
|---|---|
| https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/ | Lista de temas do Censo 2022 no FTP, incluindo `Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/` e `Microdados_e_Areas_de_Ponderacao/`. |
| https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/ | Arquivos de rendimento do responsável por setor, bairro, distrito, subdistrito e município (CSV e XLSX), todos com data 2026-05-08 17:30, e dicionário `dicionario_de_dados_renda_responsavel_20260508.xlsx`. |
| https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/ | Agregados "básico" por setor (`Agregados_por_setores_basico_BR_20260520.zip`, 2026-05-20), dicionário geral `dicionario_de_dados_agregados_por_setores_censitarios_20260520.xlsx` e pasta `malha_com_atributos/`. O dicionário geral não contém variável de rendimento. |
| https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/Agregados_por_Setor_csv/ | Datas dos demais temas por setor: alfabetização, características do domicílio 1, cor ou raça, demografia, domicílios e pessoas indígenas e quilombolas, óbitos, parentesco (2024-11-12); características do domicílio 2 e 3 (2025-04-17); básico (2026-05-20). |
| https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/malha_com_atributos/setores/gpkg/UF/PE/PE_setores_CD2022.gpkg | Malha de setores 2022 de Pernambuco em GeoPackage, 44.572.672 bytes (Content-Length), Last-Modified 2024-11-13. |
| https://biblioteca.ibge.gov.br/visualizacao/livros/liv102175.pdf | Notas metodológicas 02/2025 (rendimento do responsável, universo): regra de sigilo ("x" para setores com menos de cinco domicílios particulares permanentes e, no bloco de rendimento, para setores com variância de rendimento igual a zero); limitações (não permite rendimento domiciliar per capita, Gini, linhas de pobreza, nem ranqueamento de divisões territoriais apenas com rendimento do responsável). |
| https://biblioteca.ibge.gov.br/visualizacao/livros/liv102277.pdf | Notas metodológicas 01/2026 (mediana): confirma divulgação da média e variância por setor em 30 de abril de 2025 e incorporação posterior da mediana aos agregados por setor. Data exata da divulgação da mediana não consta no texto extraído. |
| https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Microdados_e_Areas_de_Ponderacao/Areas_de_Ponderacao/tabelas_xlsx.zip | Tabelas da Amostra por área de ponderação (arquivos internos datados de 2026-08-21 a 2026-08-24). `Tab8_3.xlsx`: rendimento domiciliar mensal per capita, médio e mediano, por área de ponderação. |
| https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Microdados_e_Areas_de_Ponderacao/Documentacao/%c3%81reas%20de%20pondera%c3%a7%c3%a3o/ | `Composição das Áreas de Ponderação.xlsx` (setor para área de ponderação), `Lista das Áreas de Ponderação_Microdado_Público.xlsx` (setores, pessoas e domicílios do universo e da amostra por área). |
| https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Microdados_e_Areas_de_Ponderacao/Documentacao/Notas%20metodol%c3%b3gicas/ | Notas metodológicas 05/2026 (microdados da amostra): microdado de acesso público suprime recortes geográficos abaixo da UF; recorte por área de ponderação só no microdado de acesso controlado (cadastro e termo de compromisso) ou sala de acesso restrito. |
| https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Microdados_e_Areas_de_Ponderacao/1_Atualizacoes_20260914.pdf | Última atualização dos microdados em 14/09/2026 (inclusão de P0115). |
| https://biblioteca.ibge.gov.br/biblioteca-servicos.html | Texto de uso: dados selecionados de publicações do IBGE "podem ser utilizados por terceiros em publicações, devendo ser citado como fonte o IBGE"; transformações exigem nota identificando o responsável. |
| https://www.ibge.gov.br/novo-portal-destaques/42982-ibge-divulgara-em-30-de-abril-informacoes-do-censo-demografico-2022-sobre-o-rendimento-do-responsavel-pelo-domicilio.html | Comunicado de agendamento (título confirma 30 de abril). O corpo da página não veio no HTML baixado; conteúdo não verificado. |

## 3. Esquema dos dados

Licença de todos os arquivos IBGE abaixo: sem licença nomeada (ODbL, CC ou domínio público) encontrada nos arquivos ou no FTP. Termo de uso localizado: citação obrigatória do IBGE como fonte (ver seção 8).

### 3.1 Rendimento do responsável por setor
- Arquivo: `Agregados_por_setores_renda_responsavel_BR_20260508_csv.zip` (9.370.011 bytes) contendo `Agregados_por_setores_renda_responsavel_BR.csv` (30.580.873 bytes; data interna do arquivo 2025-08-12; data no FTP 2026-05-08).
- Formato: CSV, separador `;`, aspas em todos os campos, decimal com ponto, conteúdo ASCII. 458.772 linhas no Brasil, 2.814 no Recife.
- Colunas (nome exato e descrição do dicionário oficial `dicionario_de_dados_renda_responsavel_20260508.xlsx`):

| Coluna | Descrição |
|---|---|
| `CD_SETOR` | Geocódigo do setor (15 dígitos; Recife começa com `2611606`). Não há coluna de município no arquivo. |
| `V06001` | Pessoas responsáveis em domicílios particulares permanentes ocupados |
| `V06002` | Moradores em domicílios particulares permanentes ocupados |
| `V06003` | Variância do número de moradores em domicílios particulares permanentes ocupados |
| `V06004` | Valor do rendimento nominal médio mensal das pessoas responsáveis com rendimentos por domicílios particulares permanentes ocupados |
| `V06005` | Variância do rendimento nominal mensal das pessoas responsáveis com rendimentos por domicílios particulares permanentes ocupados |
| `V06006` | Valor do rendimento nominal mediano mensal das pessoas responsáveis com rendimentos por domicílios particulares permanentes ocupados |

- Valor suprimido: literal `X`.
- O mesmo conjunto de colunas existe por bairro (`Agregados_por_bairros_renda_responsavel_BR_20260508_csv.zip`, 491K; CSV em CP1252, decimal com vírgula, colunas `CD_BAIRRO`, `NM_BAIRRO`, `V06001` a `V06006`), distrito, subdistrito e município.

### 3.2 Agregados básicos por setor (N de domicílios, nome do bairro)
- Arquivo: `Agregados_por_setores_basico_BR_20260520.zip` (15.418.417 bytes) com `Agregados_por_setores_basico_BR.csv` (140.970.380 bytes). CSV `;`, codificação CP1252 (DuckDB recusou como latin-1; convertido com `iconv -f CP1252`), decimal com vírgula.
- Colunas relevantes: `CD_SETOR`, `SITUACAO`, `CD_SIT`, `CD_TIPO`, `AREA_KM2`, `CD_MUN`, `NM_MUN`, `CD_BAIRRO`, `NM_BAIRRO`, `v0001` (Total de pessoas), `v0002` (Total de domicílios), `v0003` (Domicílios particulares), `v0007` (Total de Domicílios Particulares Ocupados, DPPO + DPIO), `v0008` (uso ocasional), `v0009` (vagos). Recife: 2.835 setores.
- Colunas `NM_FCU`/`CD_FCU` (favela e comunidade urbana) existem; são nomes de território, não de pessoa.

### 3.3 Malha de setores 2022
- Arquivo: `PE_setores_CD2022.gpkg`, GeoPackage, 44.572.672 bytes, tabela `PE_setores_CD2022`, geometria `POLYGON` na coluna `geom`, CRS EPSG:4674 (SIRGAS 2000), `last_change` 2024-11-12T17:22:22Z. Também existe em SHP (`.../setores/shp/UF/`) e CSV nacional sem geometria (`BR_setores_CD2022.csv`, 102M).
- Colunas: `id`, `geom`, `CD_SETOR`, `SITUACAO`, `CD_SIT`, `CD_TIPO`, `AREA_KM2`, `CD_REGIAO`, `NM_REGIAO`, `CD_UF`, `NM_UF`, `CD_MUN`, `NM_MUN`, `CD_DIST`, `NM_DIST`, `CD_SUBDIST`, `NM_SUBDIST`, `CD_BAIRRO`, `NM_BAIRRO`, `CD_NU`, `NM_NU`, `CD_FCU`, `NM_FCU`, `CD_AGLOM`, `NM_AGLOM`, `CD_RGINT`, `NM_RGINT`, `CD_RGI`, `NM_RGI`, `CD_CONCURB`, `NM_CONCURB`, `v0001` a `v0007`.
- Nome de bairro: confirmado na coluna `NM_BAIRRO` (código em `CD_BAIRRO`). Recife: 19.700 feições em PE, 2.836 no Recife (o setor `261160605180056` aparece em duas feições; 2.835 códigos distintos, todos presentes no agregado básico).
- O dicionário da malha está em `Dicionario_de_dados_malha_agregados.xlsx` (mesmo diretório `malha_com_atributos/`).

### 3.4 Área de ponderação (Amostra)
- `tabelas_xlsx.zip` (39.981.060 bytes, 32 arquivos). `Tab8_3.xlsx`, aba `Tab8_3`, colunas: Código do Município, Nome do Município, Área de ponderação, Nome, Pessoas (Total, Homens, Mulheres), Renda média (Total, Homens, Mulheres), Renda mediana (Total, Homens, Mulheres). Conceito: rendimento domiciliar mensal per capita dos moradores em DPPO, exclusive pensionista, empregado(a) doméstico(a) e parente do(a) empregado(a) doméstico(a).
- `Composição das Áreas de Ponderação.xlsx` (10.294.181 bytes): colunas `Setor`, `Código do Município`, `Área de Ponderação`, `Nome do Municíipio` (grafia do original).
- `Lista das Áreas de Ponderação_Microdado_Público.xlsx`, aba `APONDs`: `Código do Município`, `Nome do Município`, `Área de ponderação`, `Tipo`, `Nome`, `Setores`, `Pessoas_Univ`, `Domicílios_Univ`, `Pessoas_Amo`, `Domicílios_Amo`, `Pessoas_Amo_Mic`, `Domicílios_Amo_Mic`. Recife: 50 áreas, `Tipo` = "Consulta à prefeitura".
- Microdados de acesso público (`Microdados_de_acesso_Publico/csv/26_PE.zip`, 44M, 2026-09-14): layout `Layout Microdados CD2022 - acesso Público.xlsx` tem `D0350` (Rendimento domiciliar), `D0360` (Rendimento domiciliar per capita), `F0260` (Rendimento familiar per capita), mas nenhum campo de município ou área de ponderação (somente `D0010` região e `D0020` UF). Não baixado.

## 4. Resultado contra o critério de aprovação

Critério: existe variável de rendimento no nível setor com N de domicílios. **Atendido**, para o conceito "rendimento do responsável pelo domicílio".

Recife (código 2611606), cruzando renda por setor com agregado básico:
- Setores no agregado básico: 2.835. Com linha no arquivo de renda: 2.814. Os 21 sem linha têm `v0007` = 0.
- Setores com `X` em `V06001`, `V06004` e `V06006`: 18 (os três campos suprimidos juntos). Desses, 9 têm `v0007` = 0 e 9 têm `v0007` entre 1 e 5; `CD_TIPO` 2, 3, 4, 6 ou 7 em todos.
- Total sem valor de rendimento: 39 de 2.835 (21 sem linha + 18 `X`). Nenhum valor vazio ou zero em `V06004`.
- Menor `V06001` publicado no Recife: 6. No Brasil: 5. Distribuição de `V06001` nos setores do Recife com valor: p10 = 90, mediana = 197, p90 = 296, máximo = 477; 24 setores com menos de 30 responsáveis e 69 com menos de 50.
- `V06001` difere de `v0007` em 170 setores (`v0007` inclui domicílios improvisados).

Bairros-alvo (nome em `NM_BAIRRO` do agregado básico e da malha):

| Bairro (`CD_BAIRRO`) | Setores | Com `X` | Sem linha | Soma `v0007` | `V06001` mín | p10 | mediana | p90 | máx | setores com `V06001` < 50 |
|---|---|---|---|---|---|---|---|---|---|---|
| Boa Viagem (2611606092) | 252 | 1 | 1 | 50.666 | 10 | 103 | 204 | 307 | 388 | 3 |
| Casa Forte (2611606055) | 10 | 0 | 0 | 2.325 | 129 | 145 | 244 | 298 | 338 | 0 |
| Espinheiro (2611606016) | 19 | 0 | 0 | 4.383 | 105 | 155 | 228 | 326 | 348 | 0 |
| Graças (2611606013) | 37 | 2 | 0 | 7.945 | 74 | 140 | 229 | 308 | 394 | 0 |
| Madalena (2611606062) | 50 | 1 | 0 | 9.966 | 102 | 129 | 206 | 279 | 319 | 0 |

Nível bairro (arquivo de bairros do IBGE), sem supressão nos cinco bairros: `V06001` = 50.663 (Boa Viagem), 2.325 (Casa Forte), 4.374 (Espinheiro), 7.943 (Graças), 9.964 (Madalena).

## 5. Riscos e o que não foi possível verificar

- Conceito: as variáveis são do rendimento do responsável, não do domicílio. A nota 02/2025 afirma que isso não permite rendimento domiciliar per capita, Gini, linhas de pobreza nem ranqueamento de divisões territoriais só com essa variável. Exibir posição de um setor numa distribuição de `V06004`/`V06006` toca nessa ressalva de ranqueamento; registrar para decisão de produto.
- Denominador: `V06004` e `V06006` são calculados sobre "responsáveis com rendimentos". O número de responsáveis com rendimento por setor não aparece no dicionário (só `V06001`, todos os responsáveis). O N exibido seria `V06001` ou `v0007`, que é maior que o N efetivo do cálculo. Não verificado se outro arquivo traz esse N.
- Regra de supressão: a nota descreve dois critérios (menos de 5 DPP; variância zero). No Brasil há setores com `X` e `v0007` até 322, o que é compatível com o critério de variância zero ou com setores especiais; causa caso a caso não verificada.
- Outliers: a nota 01/2026 trata da sensibilidade de `V06004` a valores extremos e apresenta `V06006` como complemento.
- Data da mediana: divulgada em 2026, arquivo no FTP datado de 2026-05-08; data oficial do release não verificada.
- Codificação e formato divergem entre arquivos (setor: ponto decimal; bairro e básico: CP1252 e vírgula decimal).
- Bairros IBGE x bairros da Prefeitura: os limites de `NM_BAIRRO` do IBGE não foram comparados com a base de bairros da Prefeitura do Recife.
- Área de ponderação: o arquivo `Coeficientes de variação e de regressão.xlsx` traz coeficientes para estimativas de pessoas e domicílios; não foi encontrado coeficiente de variação para rendimento por área de ponderação.
- Página de agendamento do IBGE (42982) retornou 403 no WebFetch e HTML sem corpo via curl; conteúdo não verificado.

## 6. Plano B: área de ponderação

Viável como camada adicional, com publicação aberta em `Tab8_3.xlsx` (média e mediana do rendimento domiciliar per capita, conceito da Amostra) e ligação setor para área via `Composição das Áreas de Ponderação.xlsx` (2.835 setores do Recife, 51 códigos de área, dos quais 50 com população; a área 2611606045 tem um setor sem população).

Mudança na escala declarada para os bairros-alvo (setores e domicílios do universo por área):

| Bairro | Área(s) de ponderação | Composição da área (setores / soma `v0007`) | Domicílios na amostra (`Domicílios_Amo_Mic`) |
|---|---|---|---|
| Boa Viagem | 2611606034, 035, 036, 037, 056 | só Boa Viagem em cada uma (43/8.807; 42/8.813; 67/11.829; 57/12.223; 43/8.994) | 405; 404; 549; 585; 401 |
| Casa Forte | 2611606053 "Apipucos e Monteiro" | Parnamirim 14/2.573; Poço 12/1.968; Casa Forte 10/2.325; Monteiro 9/2.343; Apipucos 8/868; Santana 6/1.013 | 509 |
| Graças, Espinheiro | 2611606009 | Graças 37/7.945; Espinheiro 19/4.383; Aflitos 10/1.998; Derby 4/704 | 740 |
| Madalena | 2611606017 | Madalena 50/9.966; Ilha do Retiro 7/1.411 | 543 |

Rótulo necessário na tela: "por área de ponderação (agrupamento de N setores, estimativa da Amostra)". Casa Forte, Graças e Espinheiro não teriam valor próprio nessa escala; Boa Viagem é subdividida em cinco áreas. O microdado público não permite recortar abaixo da UF, então qualquer estatística diferente das tabelas publicadas exige microdado de acesso controlado (cadastro e termo) ou sala de acesso restrito.

## 7. Roteiro reproduzível

Pré-requisitos: Git Bash, `curl.exe`, `duckdb` (testado v1.5.5), `iconv`, `uv`. Diretórios `dados/` (downloads) e `scripts/` separados.

```bash
B=https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022
cd dados
# 1. Renda do responsável por setor + dicionário
curl.exe -O $B/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/Agregados_por_setores_renda_responsavel_BR_20260508_csv.zip
curl.exe -O $B/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/dicionario_de_dados_renda_responsavel_20260508.xlsx
# 2. Agregado básico (N de domicílios, bairro)
curl.exe -O $B/Agregados_por_Setores_Censitarios/Agregados_por_Setor_csv/Agregados_por_setores_basico_BR_20260520.zip
# 3. Malha PE (repetir com -C - até 44572672 bytes; o primeiro download veio truncado)
curl.exe -C - --retry 3 -O $B/Agregados_por_Setores_Censitarios/malha_com_atributos/setores/gpkg/UF/PE/PE_setores_CD2022.gpkg
unzip -d renda Agregados_por_setores_renda_responsavel_BR_20260508_csv.zip
unzip -d basico Agregados_por_setores_basico_BR_20260520.zip
iconv -f CP1252 -t UTF-8 basico/Agregados_por_setores_basico_BR.csv > basico/basico_utf8.csv
duckdb recife.duckdb -c "
create table b as select * from read_csv('basico/basico_utf8.csv', delim=';', all_varchar=true, header=true) where CD_MUN='2611606';
create table r as select * from read_csv('renda/Agregados_por_setores_renda_responsavel_BR.csv', delim=';', all_varchar=true, header=true) where CD_SETOR like '2611606%';
create table j as select b.CD_SETOR, b.NM_BAIRRO, try_cast(b.v0007 as int) dpo, try_cast(r.V06001 as int) resp, r.V06004, r.V06006 from b left join r using(CD_SETOR);
select NM_BAIRRO, count(*), count(*) filter (where V06004='X'), count(*) filter (where V06004 is null), min(resp), median(resp)
from j where NM_BAIRRO in ('Boa Viagem','Casa Forte','Graças','Espinheiro','Madalena') group by 1;"
```

Plano B:
```bash
A=$B/Microdados_e_Areas_de_Ponderacao
curl.exe -O $A/Areas_de_Ponderacao/tabelas_xlsx.zip          # Tab8_3.xlsx
curl.exe -o composicao.xlsx "$A/Documentacao/%c3%81reas%20de%20pondera%c3%a7%c3%a3o/Composi%c3%a7%c3%a3o%20das%20%c3%81reas%20de%20Pondera%c3%a7%c3%a3o.xlsx"
curl.exe -o lista_publico.xlsx "$A/Documentacao/%c3%81reas%20de%20pondera%c3%a7%c3%a3o/Lista%20das%20%c3%81reas%20de%20Pondera%c3%a7%c3%a3o_Microdado_P%c3%bablico.xlsx"
# exportar linhas do Recife para CSV (scripts/export.py usa openpyxl) e cruzar por CD_SETOR / código da área
uv run --with openpyxl python -I scripts/export.py composicao.xlsx - comp_recife.csv 1 2611606 1
```

Inspeção da malha sem extensões: `uv run python -I scripts/gpkg.py dados/PE_setores_CD2022.gpkg` (lê `gpkg_contents`, `gpkg_geometry_columns`, `gpkg_spatial_ref_sys` e `pragma table_info` via `sqlite3` da biblioteca padrão).

Scripts usados nesta investigação: `scratchpad/inv1/scripts/dic.py`, `peek.py`, `export.py`, `gpkg.py`, `gpkg_ids.py`, `layout_rows.py`, `pdf2txt.py`.

## 8. Dúvidas de licença ou termos de uso (sem opinião)

1. Nenhum arquivo do FTP nem as notas metodológicas trazem licença nomeada (ODbL, CC-BY, domínio público). O texto localizado é o da Biblioteca do IBGE: uso por terceiros com citação do IBGE e nota identificando o responsável por transformações. Compatibilidade desse termo com a regra "ODbL ou domínio público" do PropSight: em aberto.
2. As notas metodológicas exibem "© IBGE. 2025" e "© IBGE. 2026". Relação entre esse aviso e o reuso dos dados tabulares: em aberto.
3. Termos de bases cartográficas do IBGE (BC250, BC100) proíbem locação e venda sem autorização; se esses termos se aplicam à malha de setores 2022: não verificado.
4. Microdado de acesso controlado exige termo de compromisso e finalidade estatística; se um produto comercial se enquadra: em aberto (só relevante se o plano B precisar de recorte não tabulado).
5. Exigência de share-alike: não encontrada nos termos do IBGE; não verificado se a combinação com dados ODbL de outras fontes gera obrigação adicional.

## (a) Pedido por ofício ou LAI

Não necessário para os dados acima. Se for preciso confirmar licença: "Solicito ao IBGE informar sob qual licença ou termo de uso são disponibilizados os Agregados por Setores Censitários do Censo 2022 (incluindo rendimento do responsável) e a malha de setores 2022, e se o reuso em aplicação comercial com atribuição é permitido."

## (b) Próxima ação

Carregar `V06001`, `V06004`, `V06006` e `v0007` por `CD_SETOR` para os 2.835 setores do Recife, com lista branca dessas colunas mais `CD_SETOR`, `CD_BAIRRO`, `NM_BAIRRO`, e ligar à malha `PE_setores_CD2022.gpkg` (EPSG:4674) para testar o cruzamento com a tabela edifício para DSQFL.
