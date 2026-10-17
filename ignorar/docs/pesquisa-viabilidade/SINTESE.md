# Pesquisa de viabilidade de dados e ferramentas: síntese

Data de acesso de todas as fontes: 2026-10-14. Bairros-alvo: Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena (o campo veio vazio no pedido, então valeu o padrão).

Cada investigação tem relatório próprio nesta pasta, no formato de 8 itens, com URLs, esquemas, números e roteiro reproduzível:

- [inv1-censo-rendimento-setor.md](inv1-censo-rendimento-setor.md)
- [inv2-sds-crime.md](inv2-sds-crime.md)
- [inv3-iptu-modelo-3d.md](inv3-iptu-modelo-3d.md)
- [inv4-rotas-externas.md](inv4-rotas-externas.md)
- [inv5-landsat-quarteirao.md](inv5-landsat-quarteirao.md)

O orquestrador refez por amostragem, em 2026-10-14, a leitura destas fontes, e todas conferem com os relatórios: a listagem do FTP do IBGE de rendimento do responsável; o campo `dsqfl` e a contagem de 523.547 feições do serviço ESIG `BASES_EDIFICACAO_RECIFE3D_2013`; o texto da SDS ("Continuam disponíveis os dados por municípios e regiões do Estado"); a frase "You don't need a Google API key to use Maps URLs"; e o asset `lwir11` (ST_B10, gsd 100) no Planetary Computer.

Scripts e dados baixados ficaram na pasta temporária da sessão, não no repositório. Os roteiros nos relatórios permitem refazer tudo.

## 1. Tabela de decisão

| # | Pergunta | Resposta | Critério atendido | Plano B recomendado | Próxima ação concreta |
|---|---|---|---|---|---|
| 1 | O Censo 2022 tem rendimento domiciliar por setor censitário? | Por setor, o IBGE publica a média (`V06004`) e a mediana (`V06006`) do rendimento nominal mensal **da pessoa responsável pelo domicílio**, com N de responsáveis (`V06001`) e de domicílios (`v0007`). O rendimento domiciliar per capita só existe por área de ponderação (Amostra, `Tab8_3.xlsx`). No Recife, 39 de 2.835 setores ficam sem valor. A nota metodológica 02/2025 diz que esse dado não permite ranquear divisões territoriais. | Sim, para o conceito "rendimento do responsável" | Área de ponderação como camada adicional de renda per capita. O Recife tem 50 áreas. Graças e Espinheiro dividem a área 009; Casa Forte fica na 053, com mais 5 bairros; Boa Viagem se divide em 5 áreas. | Carregar `CD_SETOR`, `V06001`, `V06004`, `V06006` e `v0007` dos 2.835 setores, ligar à malha `PE_setores_CD2022.gpkg` (EPSG:4674) e definir o texto do cartão diante da ressalva sobre ranqueamento. |
| 2 | Os dados de crime da SDS-PE chegam a bairro? | Não. Os microdados públicos (CVLI, MVI, CVP, estupro e violência doméstica) e o painel Power BI param no município e na região (Capital, RMR, Interior). A composição das AIS 1 a 5 em bairros é pública (Portaria SDS 3.985/2018), mas não há série publicada por AIS nem geometria das AIS. | Não. A granularidade foi reprovada; a série é mensal (data diária) e o atraso é de 1 mês. | Pedido de acesso à informação (Ouvidoria Geral do Estado) por bairro e por AIS. Até a resposta, a escala é "por município (Recife), mensal". Atualização de 15/10/2026: a base por bairro do fato existe e circula compilada por terceiro (Crime Brasil); o mock usa esse compilado, conferido contra o CVP municipal (inv2, seção 9). | Protocolar o pedido da seção 4 e gerar a geometria aproximada das AIS dissolvendo os polígonos oficiais de bairro, marcando Barro, Ibura e Iputinga como divididos entre AIS. |
| 3 | Que fração dos lotes com IPTU tem volume no modelo 3D de ~2013? | Nos cinco bairros, 90,3% dos lotes pré-2013 casam pelo DSQFL (7.344 de 8.136): Boa Viagem 91,9, Casa Forte 98,2, Espinheiro 91,0, Graças 88,9 e Madalena 83,4. Com o casamento espacial, chega a 97,5%. Pós-2013, a taxa é 32,4% (726 lotes); só para os anos posteriores a 2013, 28,5%. O IPTU não tem DSQFL: o vínculo foi feito por lat/long no polígono do lote, com 82.193 de 82.252 registros concordando com o vínculo por endereço. | Sim | Footprint do Lotes × `QTDPAVIMENTOS` do **Lotes** (cobertura de 98,3% a 100%; 3,28 m por pavimento na mediana; Spearman 0,844 com a altura 3D), rotulado "inferência". A coluna de pavimentos do IPTU não serve (Spearman −0,043). | Gerar a tabela edifício → DSQFL com a regra "DSQFL exato; senão, bloco 3D com 50% ou mais da área dentro do lote", e só exibir "medido em 2013" quando a altura for coerente com `QTDPAVIMENTOS`. |
| 4 | Como abrir a rota no app de mapas com origem, destino e modo, sem chave e sem favorecer fornecedor? | Nenhum esquema único faz isso pelo seletor do sistema. O `geo:` é neutro, mas leva só o destino. Esquemas por app levam os três parâmetros, sem chave: Google Maps URLs, Apple Maps (iOS 18.4+), OsmAnd, Organic Maps e CoMaps. O Waze leva só o destino. A lista de Core Services dos termos do Google Maps Platform não inclui Maps URLs. | Parcial | `geo:0,0?q=lat,lng(rótulo)` só com destino. Variação: seletor próprio, uma linha por app e uma linha "Outro app" com `geo:`; mostrar só os apps instalados exige `<queries>` no Android. | Rodar os comandos `adb` do relatório 4 num emulador Android 12+ com os apps instalados e registrar o que cada esquema preenche. |
| 5 | Há cenas Landsat suficientes, e a variação entre quarteirões supera o ruído? | Há 9 cenas Tier 1 com menos de 20% de nuvem no recorte municipal entre 2022 e 2025 (3 secas e 6 chuvosas). Na mediana das cenas, a diferença entre quarteirões é de 10,4 °C (máximo menos mínimo) e 4,9 °C (P90 menos P10) em Boa Viagem, contra 1,9 °C e 1,3 °C em Casa Forte. Quarteirões com pelo menos 1 pixel térmico real (10.000 m²): 29,7% em Boa Viagem e 51,9% em Casa Forte. | Parcial. Cenas: sim. Diferença: só em Boa Viagem. Área dos quarteirões: não. | Grade de 100 m (resolução nativa do sensor), rotulada "por célula de 100 m, temperatura de superfície, não do ar, ~09h30". Boa Viagem: 802 células, P90 − P10 de 6,64 °C. Casa Forte: 51 células, 1,66 °C. | Gerar a camada de 100 m com a mediana das 9 cenas para os 5 bairros e verificar se os extremos de Boa Viagem vêm de bordas com água ou praia. |

## 2. Bases de dados encontradas

| Base | URL | Licença | Data |
|---|---|---|---|
| IBGE, Agregados por setores: rendimento do responsável (setor, bairro, distrito, município) | https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/ | Não nomeada. O termo localizado exige citar o IBGE e anotar transformações (https://biblioteca.ibge.gov.br/biblioteca-servicos.html). | Arquivos de 2026-05-08 |
| IBGE, Agregados por setores: básico | https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/ | Idem | 2026-05-20 |
| IBGE, malha de setores 2022 de PE (GeoPackage, 44,6 MB, EPSG:4674) | https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/malha_com_atributos/setores/gpkg/UF/PE/PE_setores_CD2022.gpkg | Idem | 2024-11-13 |
| IBGE, tabelas por área de ponderação e composição das áreas | https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Microdados_e_Areas_de_Ponderacao/ | Idem | 2026-08-21 a 2026-08-24 |
| SDS-PE, microdados de CVLI, MVI, CVP, estupro e violência doméstica (XLSX, até set/2026) | https://www.sds.pe.gov.br/estatisticas | Não declarada. A Portaria SDS 752/2023, art. 10, exige citar a SDS como fonte. | 2026-10-05 |
| SDS-PE, Portaria 3.985/2018 (composição das AIS) e anexo de limites | https://www.sds.pe.gov.br/estatisticas/atos-normativos | Ato normativo | 2018-06-29 (re-hospedado em 2025-12-04) |
| Recife, Bairros e RPAs (CSV, GeoJSON, SHP) | https://dados.recife.pe.gov.br/dataset/area-urbana | ODbL | 2026-03-02 |
| Recife, Limites dos Bairros 2023 (GeoJSON) | https://dados.recife.pe.gov.br/dataset/mapas-de-limites-e-divisoes-territoriais | ODbL | 2026-03-02 |
| Recife, Lotes (GeoJSON, 137 MB) | https://dados.recife.pe.gov.br/dataset/area-urbana | ODbL | 2026-03-02 (atributos majoritariamente de 2023-08-17) |
| Recife, Edificações 3D (ZIP com GeoJSON, 97,6 MB; exportação interna de 2023-09-18) | https://dados.recife.pe.gov.br/dataset/area-urbana | ODbL | 2026-03-02 |
| Recife, Quadras (GeoJSON, 42 MB) | https://dados.recife.pe.gov.br/dataset/area-urbana | ODbL | 2026-03-02 |
| ESIG, serviços ArcGIS de Lotes, Face de Quadra e Edificação Recife 2013 | https://esigportal2.recife.pe.gov.br/arcgis/rest/services/ | Não declarada (`copyrightText` vazio) | Não declarada |
| Recife, IPTU 2026 (CSV, 128 MB, 422.776 registros) | https://dados.recife.pe.gov.br/dataset/imposto-predial-e-territorial-urbano-iptu | ODbL | 2026-10-03 |
| Recife, Licenciamento Urbanístico (113.305 registros) | https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=39927a3d-3235-436a-9dc8-df7f4ea3b720&limit=0 | ODbL | 2026-06-17 |
| Recife, POIs de saúde (UBS, USF, hospitais, policlínicas, maternidades, rede de atenção) | https://dados.recife.pe.gov.br (pacotes `unidades-basica-de-saude`, `unidades-saude-da-familia-usf`, `hospitais`, `policlinicas`, `maternidades`, `rede-de-atencao-a-saude-no-recife`) | ODbL | Recursos de 2026-03-04 a 2026-03-06 (data de referência não declarada) |
| Recife, escolas municipais 2023 e unidades educacionais 2024 | https://dados.recife.pe.gov.br (pacotes `rede-de-educacao-municipal`, `unidades-educacionais-no-municipio`) | ODbL | 2026-03-04 e 2026-03-06 |
| Recife, mercados públicos | https://dados.recife.pe.gov.br (pacote `conviva-feiras-e-mercados`) | ODbL | 2026-07-07 |
| Recife, estações de trem do Grande Recife (origem CBTU) | https://dados.recife.pe.gov.br (pacote `malha-viaria-de-trens-do-grande-recife`) | ODbL | 2026-03-02 |
| Recife, Censo Arbóreo "2023" (GeoJSON, 307 MB, 259.575 pontos; `created_da` entre 2018 e 2022) | https://dados.recife.pe.gov.br/dataset/censo-arboreo | ODbL | 2026-03-02 |
| Landsat 8 e 9 Collection 2 Level 2 (ST_B10, QA_PIXEL, ST_QA), via STAC do Planetary Computer | https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2 | STAC diz "proprietary". A FAQ da USGS diz "no restrictions" e pede crédito (https://www.usgs.gov/faqs/are-there-any-restrictions-use-or-redistribution-landsat-data). | Cenas de 2023-10-28 a 2025-09-07 |

Colunas que a lista branca precisa excluir (encontradas nos dados, valores não lidos):

| Base | Colunas |
|---|---|
| IPTU | `Número do contribuinte`, `CPF/CNPJ mascarado do contribuinte`, `tipo de contribuinte`, `complemento`, `Regime de Tributação do iptu`, `Regime de Tributação da trsd` |
| Licenciamento | `cnpj`, `razao_social`, `razao_social_mercantil`, `inscricao_mercantil` |
| SDS | `SEXO`, `IDADE`, `IDADE SENASP` |
| Escolas 2023 | `gestor` |
| Censo arbóreo | `created_us`, `last_edite`, `resptecnic`, `responsave`, `contato` |

## 3. Dúvidas de licença para o parecer jurídico

Só listadas, sem opinião.

1. **IBGE:** os agregados por setor e a malha 2022 não têm licença nomeada; o termo localizado exige citar o IBGE e anotar transformações. Os dados são compatíveis com a regra "ODbL ou domínio público" do PropSight? O aviso "© IBGE" das notas metodológicas alcança os dados tabulares?
2. **IBGE:** a restrição de locação e venda dos termos das bases cartográficas (BC250, BC100) vale para a malha de setores 2022?
3. **IBGE:** um produto comercial se enquadra na "finalidade estatística" exigida pelo microdado de acesso controlado (necessário para recortes por área de ponderação fora das tabelas publicadas)?
4. **SDS-PE:** sem licença declarada nas páginas de estatística. Como o art. 10 da Portaria 752/2023 (citar a SDS como fonte do dado primário) convive com a atribuição ODbL? Uma resposta a pedido de acesso com agregados por bairro carrega restrição de uso?
5. **SDS-PE:** há termos para extrair dados do painel Power BI, hospedado em serviço comercial?
6. **ODbL, share-alike:** a tabela edifício → DSQFL, derivada de Lotes, 3D, IPTU e Licenciamento, é "base de dados derivada" a publicar sob ODbL? O mesmo vale para POIs filtrados com distâncias, temperatura cruzada com quadras e a tabela AIS → bairro, que mistura texto de portaria estadual com bairros ODbL.
7. **ODbL, atribuição:** o portal do Recife não informa o texto de atribuição. Qual é a forma exigida na tela?
8. **ESIG:** os serviços ArcGIS não declaram licença. Há termos para consulta automatizada? Valem os da ODbL dos arquivos equivalentes no portal?
9. **Modelo 3D:** não há declaração sobre o contratante do levantamento nem sobre restrições do fornecedor.
10. **IPTU:** a publicação de lat/long por imóvel e de `complemento` gera risco de reidentificação quando combinada com outras bases?
11. **Dados pessoais em bases ODbL:** existe restrição adicional para quem baixa um arquivo com a coluna `gestor` (escolas) ou com logins de pessoas (censo arbóreo)?
12. **CBTU:** há termos próprios para os dados das estações republicados pela Prefeitura?
13. **Google Maps Platform:** a cláusula 3.2.3(e) ("with or near a non-Google Map") alcança um link de Maps URL ao lado de um mapa MapLibre, sendo que Maps URLs não está na lista de Core Services? Usar Maps URLs sem chave e sem conta cria vínculo com esses termos?
14. **Marcas:** exibir nome ou ícone de cada app de mapas no seletor exige autorização? (Ver também a regra interna de marcas do Campus Mobile.)
15. **Waze:** o `utm_source` é exigência ou recomendação?
16. **Landsat:** o STAC do Planetary Computer diz "proprietary", e o link de licença da USGS responde 404; a FAQ da USGS diz que não há restrição. Qual texto vale e qual crédito usar? Os termos de uso do Planetary Computer não foram lidos.
17. **Mistura de origens:** como declarar no mesmo banco dados de domínio público (USGS) e ODbL?

## 4. Pedidos por ofício ou LAI

| Destinatário e canal | Texto sugerido |
|---|---|
| SDS-PE, pelo formulário "Pedido de Informação" da Ouvidoria Geral do Estado (https://www.ouvidoria.pe.gov.br/), com base na Lei 14.804/2012 e no art. 3º da Portaria SDS 752/2023 | Solicito, em CSV, a contagem mensal de jan/2019 a set/2026 de vítimas de CVLI, de ocorrências de CVP (por modalidade) e de vítimas de estupro no Recife, agregada por bairro do fato e por AIS (1 a 5, Portaria 3.985/2018), sem dado pessoal, com o número de registros sem bairro e o arquivo vetorial do Anexo IV da mesma portaria, se existir. |
| Prefeitura do Recife (ESIG/EMPREL) | Solicito o relatório técnico ou os metadados da camada "Edificação Recife 2013" (data do levantamento, método, definição de MDE, MDT e MDS e critério de DSQFL quando CDLOTENUM é zero) e a definição do campo "ano da construção corrigido" do IPTU. |
| Prefeitura do Recife (EMPREL/SEINFRA) | Solicito a data de referência do levantamento do Censo Arbóreo publicado como "2023" e o dicionário de dados atualizado das camadas Quadras e Lotes, com os nomes de campo usados nos GeoJSON publicados. |
| Secretarias de Saúde e de Educação do Recife | Solicito a data de referência dos arquivos de UBS, USF, hospitais, policlínicas, maternidades e unidades de ensino publicados em dados.recife.pe.gov.br e o datum das colunas latitude e longitude. |
| IBGE (opcional, só se o parecer pedir confirmação) | Solicito informar sob qual licença ou termo de uso são disponibilizados os Agregados por Setores Censitários do Censo 2022, incluindo o rendimento do responsável, e a malha de setores 2022, e se o reuso em aplicação comercial com atribuição é permitido. |

## 5. O que não foi verificado

- **Seletores e esquemas de rota:** nenhum foi testado em aparelho ou emulador (investigação 4).
- **Modelo 3D:** o ano "2013" vem só do nome do serviço ESIG. Não há documento oficial do levantamento (investigação 3).
- **Lotes:** o cálculo usou o serviço ArcGIS, porque o download completo do GeoJSON foi interrompido. A equivalência entre o serviço e o arquivo foi confirmada para o 3D, mas não para o Lotes (investigação 3).
- **AIS:** não há geometria pública. Não foi verificado se os limites coincidem com os limites oficiais de bairro (investigação 2).
- **Rendimento por setor:** não foi verificado o N efetivo de "responsáveis com rendimentos" por setor, que é o denominador da média e da mediana (investigação 1).
- **Landsat:** não foi verificado se há nuvem residual nas cenas Tier 1, nem se as bordas com água influenciam os extremos de Boa Viagem (investigação 5).
