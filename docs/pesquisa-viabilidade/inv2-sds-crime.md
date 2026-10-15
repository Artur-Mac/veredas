# Investigação 2: SDS-PE, granularidade dos dados de crime

Data de acesso de todas as fontes: 2026-10-14.

## 1. Resposta curta

Não: as planilhas e painéis públicos da SDS-PE param no município (Recife inteiro) e na "região" (Capital / Região Metropolitana / Interior). Não publicam série por bairro nem por AIS. A composição das AIS em bairros é pública (Portaria SDS 3.985/2018), mas não há série publicada nessa escala.

## 2. Evidências

| URL | Acesso | O que confirma |
|---|---|---|
| https://www.sds.pe.gov.br/estatisticas | 2026-10-14 | Texto "Banco de dados e metodologia": publicação mensal; dados preliminares até o 5º dia e consolidados até o 15º dia do mês seguinte; "Continuam disponíveis os dados por municípios e regiões do Estado". Link para o painel Power BI. |
| https://www.sds.pe.gov.br/estatisticas/crimes-violentos-letais-intencionais | 2026-10-14 | Link para `MICRODADOS_DE_CVLI_JAN_2004_A_SETEMBRO_2026.xlsx` e PDFs CVLI anual/mensal por município e por região. |
| https://www.sds.pe.gov.br/estatisticas/indicadores-criminais/crimes-contra-o-patrimonio | 2026-10-14 | Link para `Microdados_de_CVP_-_Disponível_janeiro_de_2014_a_setembro_de_2026.xlsx` e PDFs de CVP, roubo a banco, cargas, veículos e ônibus. |
| https://www.sds.pe.gov.br/estatisticas/indicadores-criminais/estrupo | 2026-10-14 | Link para `MICRODADOS_ESTUPRO_JAN_2012_A_SET_2026.xlsx`. |
| https://www.sds.pe.gov.br/estatisticas/indicadores-criminais/mortes-violentas-intencionais-mvi | 2026-10-14 | Link para `MICRODADOS_DE_MVI_JAN_2004_A_SETEMBRO_2026.xlsx`. |
| https://www.sds.pe.gov.br/estatisticas/indicadores-criminais/violencia-domestica-e-familiar-contra-a-mulher | 2026-10-14 | Link para `MICRODADOS_DE_VIOLÊNCIA_DOMÉSTICA_JAN_2012_A_SET_2026.xlsx`. |
| https://www.sds.pe.gov.br/images/indicadores/CVLI/CVLI_MENSAL_POR_REGI%C3%83O.pdf | 2026-10-14 | "Região" = CAPITAL, REGIÃO METROPOLITANA, INTERIOR, PERNAMBUCO (jan a set/2026). Não é AIS. Capital 2026 = 332 vítimas, igual à soma do Recife nos microdados. |
| https://app.powerbi.com/view?r=eyJrIjoiNTQ4Y2Y1ZDgtYWJmYi00ODZjLWJhNmYtNDg0NDMxNWYwNjNiIiwidCI6Ijk3ZjdhNzBhLTQwMTEtNDU0NC04MDRmLWQwNjcxZmMyYWFlOSIsImMiOjl9 (link público publicado na página de estatísticas da SDS) | 2026-10-14 | Painel "SACE BI" com 10 páginas: MVI, CVLI, MVI de policiais, CVP, Furtos, Violências contra a mulher, Violências contra a população LGBTQIAPN+, Mortes no trânsito, Vitimização policial e Dicionário. Filtros: Período, Município, Região, Natureza. Página "Dicionário de dados", bloco "Unidade geográfica de análise": "Dados agregados por município e região geográfica". Fonte: Infopol; data de extração 05/10/2026. |
| https://dados.pe.gov.br/api/3/action/organization_list | 2026-10-14 | O portal estadual CKAN lista 8 organizações e nenhuma é a SDS. `package_search?q=CVLI` retorna 0. |
| https://www.sds.pe.gov.br/estatisticas/atos-normativos | 2026-10-14 | Links para a Portaria SDS 3.985/2018 (divisão territorial), o Anexo II "Limite territorial das AIS da Capital", a Portaria 1.410/2021, a Portaria 752/2023 (acesso a dados criminais) e a Portaria 4.666/2020 (coordenadas de mortes). |
| https://www.sds.pe.gov.br/images/media/atos_normativos/Responsabilidade%20Territorial/DIVIS%C3%83O%20TERRITORIAL%20PORTARIA%20SDS%203.985%20DE%2029.06.2018.pdf | 2026-10-14 | Portaria 3.985 de 29/06/2018 (BGSDS 120 de 30/06/2018). Anexo I: AIS 1 a 5 = Recife; AIS 6 = Jaboatão dos Guararapes. Art. 5º: "Para efeito de contabilização estatística, a totalização dos índices de ocorrências criminais obedecerá aos limites das Áreas Integradas de Seguranças". O Art. 3º cita um Anexo IV, "Mapa com a divisão territorial", que não está no PDF publicado: o arquivo tem 34 páginas, traz os Anexos I, II e III e não traz o Anexo IV. |
| https://www.sds.pe.gov.br/images/media/atos_normativos/Responsabilidade%20Territorial/LIMITE-TERRITORIAL-DAS-%C3%81REAS-INTEGRADAS-DE-SEGURAN%C3%87A---AIS-DA-CAPITAL.pdf | 2026-10-14 | Memorial descritivo em texto (ruas, rios, "includente/excludente") das Áreas 01 a 05 e das circunscrições. Sem coordenadas. |
| https://www.sds.pe.gov.br/images/media/atos_normativos/Responsabilidade%20Territorial/PORTARIA%20N%C2%BA%201410%20-%2022MAR2021%20-%20CRIA%C3%87%C3%83O%20DAS%20AISE%2027,97,98%20E%2099.pdf | 2026-10-14 | Altera o Anexo I da 3.985 só para as AIS Especiais (27 Fernando de Noronha; 97, 98 e 99 para locais de acesso restrito). Não altera as AIS 1 a 5. |
| https://www.sds.pe.gov.br/images/media/atos_normativos/Acesso%20%C3%A0%20Informa%C3%A7%C3%A3o%20-%20Dados%20Criminais/ACESSO%20AOS%20DADOS%20CRIMINAIS.pdf | 2026-10-14 | Portaria SDS 752/2023 (BGSDS 036 de 18/02/2023). Art. 2º: transparência ativa. Art. 3º: dado indisponível no site deve ser pedido por "Pedido de Acesso à Informação (PAI) por meio do sítio eletrônico da Ouvidoria Geral do Estado". Arts. 4º a 7º: dados sigilosos ou pessoais só para instituições, com termo de sigilo. Art. 10: citar a SDS como fonte do dado primário. |
| https://www.sds.pe.gov.br/images/media/atos_normativos/PORTARIA%20N%C2%BA%204666,%20DE%2024-08-2020%20-%20Disciplina%20a%20coleta%20das%20coordenadas%20geogr%C3%A1ficas%20das%20ocorr%C3%AAncias%20de%20interesse%20policial%20com%20resultado%20morte..pdf | 2026-10-14 | A SDS coleta latitude e longitude (SIRGAS 2000, precisão de 10 m) de todas as mortes de interesse policial, para o SIMIP. Indica que existe georreferência interna para mortes. |
| https://www.sds.pe.gov.br/images/media/arquivos/Boletim_Geral/2018/08%20-%20Agosto/151%20BGSDS%20DE%2016AGO2018.pdf | 2026-10-14 | Notícia oficial cita a "AIS 2 (composta por 21 bairros, entre eles Graças, Aflitos, Espinheiro, ... Madalena)". A contagem coincide com a extraída da Portaria 3.985 (21). |
| https://dados.recife.pe.gov.br/api/3/action/package_show?id=area-urbana | 2026-10-14 | Conjunto "area-urbana", licença `odc-odbl`. Recursos "Bairros e RPAs do Recife" (CSV) e "Bairros do Recife" (GeoJSON e SHP), modificados em 2026-03-02. |
| https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/a378d50a-5e55-4956-a28c-13305acfc2b3/download/bairros-e-rpas-do-recife.csv | 2026-10-14 | 94 linhas, 94 bairros distintos. Colunas `Bairro` e `rpa`. Nomes sem acento (ex.: "Gracas", "Poco"). |
| https://dados.recife.pe.gov.br/dataset/1702c764-ec7a-4ef0-9861-8acd0e40c819/resource/5c67ce14-1799-40c4-a37c-9daa04d1761c/download/bairros-do-recife.geojson | 2026-10-14 | 94 polígonos. As propriedades incluem `CBAIRRCODI`, `EBAIRRNOME`, `EBAIRRNOMEOF` e `CRPAAACODI`. |
| https://www.sds.pe.gov.br/estatisticas/informe-mensal-da-conjuntura-criminal | 2026-10-14 | Último informe listado: novembro de 2022. Os informes de dez/2014 e nov/2022 foram conferidos: trazem tabelas por porte de município, sem AIS nem bairro. |
| https://www.ouvidoria.pe.gov.br/ e https://www.lai.pe.gov.br/ | 2026-10-14 | Canal "Pedido de Informação ou Recurso" da Ouvidoria Geral do Estado. O portal LAI aponta para o mesmo formulário. |
| https://dados.recife.pe.gov.br/api/3/action/package_show?id=ocorrencias | 2026-10-14 | Conjunto municipal "Ocorrencias" (Guarda Municipal, ODbL, a descrição cita geolocalização) sem nenhum recurso publicado. Não é da SDS; registrado só como referência. |

## 3. Esquema dos dados

Todos os arquivos são XLSX servidos por sds.pe.gov.br, com `Last-Modified` em 05/10/2026 entre 21:05 e 21:12 GMT e metadado interno `dcterms:modified` de 2026-10-05. Licença: nenhuma declarada nas páginas inspecionadas (ver seção 8). As colunas pessoais aparecem só pelo nome; seus valores não foram inspecionados.

| Arquivo | Tamanho (bytes) | Aba de dados / linhas | Colunas (nome exato) | Menor nível geográfico | Período | Unidade da linha |
|---|---|---|---|---|---|---|
| `MICRODADOS_DE_CVLI_JAN_2004_A_SETEMBRO_2026.xlsx` (servido sob `/images/indicadores/CVP/`) | 4.437.399 | `Plan1` / 86.286 (mais as abas-resumo `Plan2` e `Planilha1`, com totais por ano) | `MUNICIPIO`, `REGIAO_GEOGRAFICA`, `SEXO`, `NATUREZA JURIDICA`, `DATA`, `ANO`, `IDADE`, `TOTAL DE VITIMAS` | Município | 2004-01-01 a 2026-09-30 | Vítima (no Recife, a soma de `TOTAL DE VITIMAS` é igual ao nº de linhas) |
| `MICRODADOS_DE_MVI_JAN_2004_A_SETEMBRO_2026.xlsx` | 4.500.686 | `Plan1` / 87.671 | Mesmas do CVLI | Município | 2004-01-01 a 2026-09-30 | Vítima |
| `Microdados_de_CVP_-_Disponível_janeiro_de_2014_a_setembro_de_2026.xlsx` | 4.466.337 | `microdados cvp` / 175.223 | `DATA`, `ANO`, `MUNICÍPIO`, `REGIÃO GEOGRÁFICA`, `TOTAL` | Município | 2014-01-01 a 2026-09-30 | Município por dia (Recife: 4.656 linhas, uma para cada um dos 4.656 dias do período) |
| `MICRODADOS_ESTUPRO_JAN_2012_A_SET_2026.xlsx` | 1.270.618 | `Plan1` / 35.651 | `MUNICÍPIO DO FATO`, `REGIAO GEOGRÁFICA`, `NATUREZA`, `DATA DO FATO`, `ANO`, `SEXO`, `IDADE SENASP`, `TOTAL DE VÍTIMAS` | Município | 2012-01-01 a 2026-09-30 | Registro com contagem de vítimas |
| `MICRODADOS_DE_VIOLÊNCIA_DOMÉSTICA_JAN_2012_A_SET_2026.xlsx` | 18.708.189 | `Plan1` / 538.427 | Mesmas do estupro | Município | 2012-01-01 a 2026-09-30 | Registro com contagem de vítimas |

Colunas excluídas pela lista branca: `SEXO`, `IDADE` e `IDADE SENASP` (dados de pessoa). Colunas úteis para a ingestão: município, região, natureza, data e total.

Valores de `REGIAO_GEOGRAFICA` (agregados): CVLI e MVI usam `CAPITAL`, `REGIÃO METROPOLITANA`, `AGRESTE`, `ZONA DA MATA`, `SERTÃO` e um valor `0`. CVP, estupro e violência doméstica usam `RECIFE` no lugar de `CAPITAL`.

Categorias de `NATUREZA JURIDICA` no CVLI: homicídio, latrocínio, feminicídio, lesão corporal seguida de morte, estupro de vulnerável com resultado morte e infanticídio. O MVI acrescenta "morte por intervenção legal de agente do Estado". Estupro tem 6 naturezas; violência doméstica, 20.

Totais do Recife (agregados, sem atributos pessoais):

| Série | 2025 | jan a set 2026 | Últimos meses de 2026 (jul / ago / set) |
|---|---|---|---|
| CVLI (vítimas) | 566 | 332 | 34 / 33 / 41 |
| MVI (vítimas) | 577 | 343 | 35 / 33 / 44 |
| CVP (ocorrências) | 16.732 | 7.168 | 690 / 631 / 721 |
| Estupro (vítimas) | 437 | 331 | 42 / 36 / 32 |
| Violência doméstica (vítimas) | 10.495 | 8.947 | 889 / 1.120 / 941 |

O painel Power BI traz as mesmas séries e mais furtos, violência contra a população LGBTQIAPN+, mortes no trânsito e vitimização policial. A menor unidade declarada no próprio dicionário do painel é o município.

Tabela derivada, gerada nesta investigação: `dados/ais_bairros_recife.csv`, com as colunas `ais`, `circunscricao`, `tipo` (bairro ou localidade), `nome_sds`, `nota`, `bairro_oficial` e `casamento`.

## 4. Resultado contra o critério de aprovação

| Critério | Resultado | Número |
|---|---|---|
| Nível bairro ou menor | Reprovado | Menor nível publicado: município. Nenhum arquivo, PDF ou painel traz bairro ou AIS. |
| Série mensal | Aprovado | Os microdados têm data diária. A agregação mensal é possível desde 2004 (CVLI/MVI), 2012 (estupro e violência doméstica) e 2014 (CVP). |
| Atraso ≤ 3 meses | Aprovado | Último mês: setembro/2026, em arquivos de 05/10/2026. Atraso de 1 mês em relação a outubro/2026. Regra publicada: preliminar até o dia 5 e consolidado até o dia 15 do mês seguinte. |

Conclusão: reprovado pelo critério de granularidade. Com dado público, a escala possível na tela é "por município (Recife inteiro)".

Casamento de bairros (feito sobre a Portaria 3.985, porque os microdados não têm bairro):
- Anexo I, AIS 1 a 5: 97 itens marcados como bairro e mais 16 "localidades".
- 93 casam com a lista oficial de 94 bairros só por normalização (caixa, acentos e pontuação).
- 3 precisam de tabela de equivalência: "Do Recife" → `Recife`; "Poço da Panela" → `Poco`; "Brejo do Beberibe" → `Brejo De Beberibe`.
- 1 fica sem correspondência: "UR - 7", conjunto habitacional listado como bairro na 14ª circunscrição, que não existe na lista oficial.
- Os 94 bairros oficiais aparecem todos.
- Pelas notas (1) a (3) da portaria, 3 bairros estão divididos entre duas AIS: Barro (AIS 3 e 4), Ibura (AIS 3 e 4) e Iputinga (AIS 2 e 4).
- Registros do Recife sem bairro: 100% (15.611 linhas de CVLI, 4.656 de CVP, 6.104 de estupro e 84.185 de violência doméstica), porque a coluna não existe.

Composição das AIS do Recife (Portaria 3.985/2018, Anexo I):

| AIS | Seccional / Batalhão | Circunscrições e bairros | Nº de bairros |
|---|---|---|---|
| 1 Santo Antônio | 1ª Seccional / 16º BPM | 1ª Rio Branco: Santo Antônio, São José, Cabanga, Recife. 2ª Boa Vista: Boa Vista, Soledade, Santo Amaro. 3ª Joana Bezerra: Ilha Joana Bezerra, Coelhos, Ilha do Leite, Paissandu | 11 |
| 2 Espinheiro | 2ª Seccional / 13º BPM | 4ª Espinheiro: Derby, Graças, Espinheiro, Aflitos, Rosarinho, Encruzilhada, Torreão, Ponto de Parada, Hipódromo, Campo Grande. 6ª Cordeiro: Madalena, Torre, Zumbi, Cordeiro, Iputinga (parte). 16ª Água Fria: Campina do Barreto, Arruda, Água Fria, Fundão, Cajueiro, Peixinhos (porção Recife) | 21 |
| 3 Boa Viagem | 3ª Seccional / 19º BPM | 7ª Boa Viagem: Pina, Boa Viagem, Brasília Teimosa. 8ª Jordão: Ibura (parte), Jordão. 9ª Ipsep: Imbiribeira, Ipsep. 10ª Cohab: Cohab (as localidades incluem parte do Barro) | 8 |
| 4 Jiquiá | 4ª Seccional / 12º BPM | 11ª Afogados: Afogados, Jiquiá, Areias, Caçote, Estância. 12ª Tejipió: Jardim São Paulo, Barro (parte), Tejipió, Sancho, Totó, Coqueiral, Ibura (parte). 13ª Mustardinha: Ilha do Retiro, Prado, Bongi, Mustardinha, Mangueira, San Martin. 14ª Várzea: Torrões, Curado, Engenho do Meio, Cidade Universitária, Várzea, Caxangá, Iputinga (parte), UR-7 | 26 |
| 5 Apipucos | 5ª Seccional / 11º BPM | 5ª Casa Amarela: Jaqueira, Santana, Poço da Panela, Parnamirim, Casa Forte, Tamarineira, Casa Amarela. 15ª Alto do Pascoal: 8 bairros. 17ª Vasco da Gama: 4 bairros. 18ª Macaxeira: 12 bairros | 31 |

Bairros-alvo:
- Boa Viagem: AIS 3 (7ª circunscrição).
- Casa Forte: AIS 5 (5ª circunscrição).
- Graças e Espinheiro: AIS 2 (4ª circunscrição).
- Madalena: AIS 2 (6ª circunscrição).

Nenhum dos cinco está entre os bairros divididos.

## 5. Riscos e o que não foi possível verificar

- Geometria pública das AIS: não encontrada. Não há shapefile, GeoJSON ou KML no site da SDS nem em dados.pe.gov.br. O Anexo IV (mapa), citado no Art. 3º da Portaria 3.985, não está no PDF publicado.
- Coincidência entre os limites das AIS e os limites oficiais de bairro: não verificada. O memorial descritivo segue ruas e rios e marca trechos como "includente/excludente". Sem polígono, não dá para medir a divergência.
- Vigência: não verificado se as AIS 1 a 5 mudaram depois de 2018, além das Portarias 2.216/2019 (Panelas) e 1.410/2021 (AISE). Todos os PDFs da seção "Responsabilidade Territorial" foram re-hospedados em 04/12/2025 (`Last-Modified`), data que não indica quando o conteúdo foi escrito.
- O PDF `DIVISÃO-DA-RESPONSABILIDADE-DOS-TERRITÓRIOS...pdf` é o Anexo I da Portaria 1.197/2010, revogada pela 3.985. O PDF "Limite territorial das AIS da Capital" é um "Anexo II" sem número de portaria no cabeçalho e usa "Recife Antigo" onde a 3.985 diz "Do Recife". Não verificado a qual portaria pertence.
- Qualidade dos dados não auditada: há o valor `0` em `REGIAO_GEOGRAFICA` (CVLI e MVI), e o número de municípios distintos varia de 185 a 187 conforme o arquivo, contra 184 municípios de PE mais Fernando de Noronha.
- Revisão retroativa: os dados do mês são preliminares até o dia 15. Não verificado quanto os meses anteriores mudam de uma versão para outra.
- Nomes e caminhos de arquivo mudam: o arquivo de CVLI é servido sob a pasta `/CVP/`, e o nome de cada arquivo carrega o último mês, então muda todo mês. Uma ingestão automática precisa raspar a página.
- Painel Power BI: lido pela tela. Não verificado se a fonte de dados do painel tem campos além dos filtros visíveis.
- Pedidos LAI já respondidos sobre o tema (consulta pública em transparencia.pe.gov.br): não verificados.

## 6. Plano B

AIS com escala declarada: não viável com dado público. A composição das AIS é pública, mas a SDS não publica contagens por AIS; só cita AIS isoladas em notícias de boletins. A série teria de vir de um pedido de acesso à informação.

Se a série por AIS for obtida:
- Escala na tela: "por Área Integrada de Segurança (AIS), definida pela SDS-PE na Portaria 3.985/2018". Boa Viagem divide a escala com outros 7 bairros da AIS 3; Casa Forte, com outros 30 da AIS 5; Graças, Espinheiro e Madalena, com os outros 18 da AIS 2.
- Geometria aproximada: dissolver por AIS os polígonos oficiais de bairro (ODbL, dados.recife), declarando que Barro, Ibura e Iputinga estão divididos e que o limite oficial é o do memorial descritivo.

Pedido LAI por bairro: viável pelo canal previsto no Art. 3º da Portaria 752/2023 (Ouvidoria Geral do Estado). Contagens agregadas por bairro e mês não são dado pessoal. A Portaria 4.666/2020 mostra que existem coordenadas internas para mortes; para CVP e estupro, não verificado se o Infopol tem bairro ou coordenada. Nesse caso, a escala mudaria para "por bairro, segundo registro da Polícia Civil".

Escala disponível hoje, sem pedido: "por município (Recife), mensal, SDS-PE".

## 7. Roteiro reproduzível

Ferramentas: Git Bash, `curl.exe`, `uv` (Python efêmero com `pandas` e `python-calamine`), `pdftotext` e `duckdb`. Scripts em `scratchpad/inv2/scripts/` (`estrutura.py`, `agrega.py`, `ais_bairros.py`).

1. Páginas e links: rodar `curl.exe -sL -A "Mozilla/5.0" -o est.html https://www.sds.pe.gov.br/estatisticas/crimes-violentos-letais-intencionais` e repetir para `indicadores-criminais/crimes-contra-o-patrimonio`, `.../estrupo`, `.../mortes-violentas-intencionais-mvi`, `.../violencia-domestica-e-familiar-contra-a-mulher` e `atos-normativos`. Depois, `grep -oiE 'href="[^"]+\.(xlsx|pdf)"' est.html`.
2. Baixar os 5 XLSX com as URLs da seção 2, codificando os acentos em percent-encoding (ex.: `VIOL%C3%8ANCIA_DOM%C3%89STICA`). O XLSX de violência doméstica (18,7 MB) veio truncado na primeira tentativa: usar `--retry 3` e conferir o `Content-Length`.
3. Estrutura: `uv run --with pandas --with python-calamine python -I scripts/estrutura.py cvli.xlsx cvp.xlsx estupro.xlsx mvi.xlsx vd.xlsx`.
4. Agregados e datas: `uv run --with pandas --with python-calamine python -I scripts/agrega.py cvli.xlsx mvi.xlsx cvp.xlsx estupro.xlsx vd.xlsx`. O script não imprime valores de `SEXO` nem de `IDADE`.
5. Conferência cruzada: rodar `pdftotext -layout` no PDF `CVLI_MENSAL_POR_REGIÃO.pdf` e comparar a linha CAPITAL com a soma mensal do Recife.
6. Painel: abrir o link Power BI, ir à página 10 ("Dicionário de dados") e ler o bloco "Unidade geográfica de análise".
7. AIS:
   - Baixar a Portaria 3.985 (URL na seção 2) e rodar `pdftotext -layout p3985.pdf`.
   - Converter o texto com `iconv -f latin1 -t utf-8 p3985.txt | tr -s ' ' > p3985_utf8.txt`.
   - Rodar `uv run python -I scripts/ais_bairros.py p3985_utf8.txt bairros-e-rpas.csv ais_bairros_recife.csv`.
8. Bairros oficiais: rodar `curl.exe -sL "https://dados.recife.pe.gov.br/api/3/action/package_show?id=area-urbana"` e baixar o CSV e o GeoJSON listados.

Tempo estimado: 2 a 3 horas.

## 8. Dúvidas de licença ou termos de uso

- As páginas de estatísticas da SDS não declaram licença. A busca por "licen", "creative commons", "direitos reservados", "termos de uso" e "copyright" nas 13 páginas baixadas não teve resultado. Compatibilidade com ODbL ou domínio público: em aberto.
- O Art. 10 da Portaria 752/2023 exige citar a SDS "somente como fonte do dado primário", na forma "Base de dados ou Sistema de Informação/Secretaria de Defesa Social". Em aberto se isso vale para dados de transparência ativa e como convive com a atribuição ODbL.
- O Art. 9º da Portaria 752/2023 atribui ao pesquisador a responsabilidade pelos parâmetros estatísticos derivados dos dados repassados. Em aberto se vale para dados obtidos por pedido de acesso à informação.
- Dados recebidos pelos Arts. 4º a 7º (com termo de sigilo) teriam restrição de uso. Em aberto se uma resposta LAI com agregados por bairro carrega alguma restrição.
- O painel Power BI fica hospedado em serviço comercial. Termos de uso para extrair dados do painel: em aberto.
- Os bairros de dados.recife são ODbL (share-alike). Em aberto o efeito disso sobre uma tabela derivada AIS → bairro que mistura texto de portaria estadual.

## Acréscimos

(a) Texto do pedido, a protocolar na Ouvidoria Geral do Estado de PE pelo formulário "Pedido de Informação" em https://www.ouvidoria.pe.gov.br/, órgão SDS, com base na Lei 14.804/2012 e no Art. 3º da Portaria SDS 752/2023: "Solicito, em formato aberto (CSV), a contagem mensal de jan/2019 a set/2026 de vítimas de CVLI, de ocorrências de CVP (por modalidade) e de vítimas de estupro no município do Recife, agregada por bairro do fato e por Área Integrada de Segurança (AIS 1 a 5, Portaria 3.985/2018), sem nenhum dado pessoal, informando também quantos registros não têm bairro preenchido e se existe arquivo vetorial (shapefile ou equivalente) do Anexo IV da Portaria 3.985/2018."

(b) Próxima ação: protocolar o pedido acima na Ouvidoria Geral do Estado e, enquanto isso, gerar a geometria aproximada das AIS 1 a 5 dissolvendo o GeoJSON oficial de bairros com `ais_bairros_recife.csv`, marcando Barro, Ibura e Iputinga como divididos.

## 9. Atualização de 15/10/2026: base por bairro existe, compilada por terceiro

Resposta curta revista: a publicação aberta da SDS-PE continua parando no município, mas a SDS tem registros por bairro do fato e natureza, e essa base circula compilada pelo Crime Brasil. O PRD 2.1 passou a usá-la como fonte do cartão de crime no mock.

| URL | Acesso | O que confirma |
|---|---|---|
| https://crimebrasil.com.br/fontes/sds-pe | 2026-10-15 | Base de PE com cerca de 848 mil registros, jan/2020 a set/2026, 185 municípios e cerca de 2.700 bairros, com município, bairro do fato e natureza. Cerca de 4% sem bairro; sem coordenada. A página afirma que o painel da SDS filtra por bairro, o que não se confirmou (linha seguinte). |
| Painel Power BI da SDS (link na seção 2) | 2026-10-15 | Páginas de CVP, furtos, violência contra a mulher, LGBTQIAPN+, mortes no trânsito e dicionário: filtros só de município, região e tipo. MVI e CVLI não foram reabertas. Ameaça e injúria não aparecem no painel nem nos microdados. Inferência: o compilado vem de base não publicada (provavelmente LAI, como o conjunto do RS do mesmo autor declara). |
| https://crimebrasil.com.br/bairro/pe/recife/{boa-viagem, casa-forte, gracas, espinheiro, madalena, areias} | 2026-10-15 | Contagens de out/2025 a set/2026 por natureza. Os totais conferem com a soma das naturezas em todos os seis bairros. Tabela em `dados/crime-bairros-recife.csv`. |
| https://crimebrasil.com.br/cidade/pe/recife | 2026-10-15 | Recife: 27.085 ocorrências em 12 meses; roubo a transeunte 5.379, roubo 2.713, outros roubos 807, outros tipos 2.353. |
| https://crimebrasil.com.br/termos | 2026-10-15 | "Os dados brutos são de +50 fontes oficiais e seguem a licença de cada órgão"; marca, textos e visualizações são do Crime Brasil. |
| https://zenodo.org/records/19712522 | 2026-10-15 | O conjunto aberto do autor (CC BY 4.0) cobre só o RS, por município. Não há conjunto aberto de PE. |

Conferência contra a SDS: o CVP do Recife nos microdados (`Microdados_de_CVP_-_Disponível_janeiro_de_2014_a_setembro_de_2026.xlsx`, agora servido em `/images/ESTATÍSTICAS/GACE/`) soma 10.195 ocorrências de out/2025 a set/2026. O compilado traz 8.899 roubos explícitos no mesmo período; as demais modalidades de roubo ficam em "outros tipos" (2.353). Como 8.899 ≤ 10.195 ≤ 11.252, os números são compatíveis. A conferência é de ordem de grandeza, não linha a linha.

Limitações para o cartão: o bairro é o nome informado no registro, não um ponto; o compilado não traz população por bairro, então o cartão mostra contagem bruta, sem taxa e sem posição entre bairros; ameaça não entra em "crimes violentos"; licença de reuso não declarada (vale a do órgão, que a SDS não declara). Por isso o uso fica restrito ao mock, e o produto real depende da LAI do item (a) ou de licenciamento do compilado.
