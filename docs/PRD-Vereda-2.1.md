# PRD Vereda (PropSight) 2.1

14/10/2026 · Samuel V. Cordeiro · revisado em 15/10/2026 (crime por bairro)

## O que mudou de 2.0 para 2.1

A pesquisa de viabilidade de 14/10/2026 fechou quatro das cinco perguntas técnicas e reprovou uma. Nenhum item do protótipo caiu; dois itens do Final mudaram de forma e um saiu.

| Item | Antes (2.0) | Agora (2.1) |
| --- | --- | --- |
| Bairros-alvo | em aberto | Boa Viagem, Casa Forte, Graças, Espinheiro, Madalena |
| Rotas (item 11) | motor de roteamento próprio e botão neutro único | sem motor no protótipo; seletor por app de mapas instalado + "Outro app" só com destino; nenhum tempo exibido |
| Isócronas (item 8) | isócronas a pé 5/10/15 min | anéis de raio 500 m, 1 km, 1,5 km e distância em linha reta; isócronas vão para o Final |
| Vínculo IPTU | "DSQFL liga IPTU" | IPTU não tem DSQFL; vínculo por coordenada dentro do lote (82.193 de 82.252 concordam com o endereço) |
| 3D não casado | ressalva genérica | regra: footprint do Lotes × pavimentos do Lotes (3,28 m/pav.), rotulado inferência; pavimentos do IPTU descartado |
| Texto do 3D | "prédios novos não constam" | "2 em cada 3 prédios posteriores a 2013 não constam" (taxa pós-2013: 32,4%) |
| Renda (Final) | renda domiciliar por setor, com régua | rendimento do responsável (média e mediana) por setor, sem régua: o IBGE veda ranquear; per capita só por área de ponderação |
| Crime (Final) | decidido, granularidade a confirmar | a SDS só publica por município e região, mas a base de registros por bairro do fato existe e já circula compilada por terceiro (Crime Brasil). Entra no mock do protótipo com esses números, atribuídos; no produto real, depende de adquirir a base (LAI à SDS ou licenciamento do compilado) |
| Calor (Final) | por quarteirão | grade de 100 m, mediana de 9 cenas; quarteirão é menor que o pixel térmico na maioria dos casos |
| Censo arbóreo | 2023 | pontos de 2018 a 2022, publicado como 2023; rótulo até ofício |
| Lista branca | 4 exclusões | 9 exclusões (IPTU contribuinte e complemento; Licenciamento CNPJ e razão social; SDS sexo e idade; censo arbóreo logins e contatos) |
| Desempenho 3D (E9) | teste em nov/dez | adiado para etapa futura |

## O que o produto é

App móvel para Recife que transforma o link de um anúncio de apartamento num dossiê de evidências. O ativo real é a tabela "nome do edifício → DSQFL (lote)" mais o ledger de origem de cada fato.

| Camada | Chave | Onde vive | Compartilhada |
| --- | --- | --- | --- |
| Edifício | DSQFL | servidor, cacheada | sim, entre usuários |
| Anúncio | URL | servidor, privada | não |
| Usuário | aparelho | só no aparelho, allowBackup off | não |

O DSQFL liga Lotes, modelo 3D e Licenciamento diretamente. O IPTU não traz DSQFL: o vínculo é feito pela coordenada do imóvel dentro do polígono do lote, com 99,9% de concordância com o vínculo por endereço.

Regra do casamento edifício → 3D: DSQFL exato; senão, bloco 3D com 50% ou mais da área dentro do lote. Nos cinco bairros-alvo, 90,3% dos lotes anteriores a 2013 casam por DSQFL e 97,5% com o critério espacial (Casa Forte 98,2%, Madalena 83,4%). Prédios posteriores a 2013 casam em 32,4%.

Bairros-alvo do protótipo: Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena. O nome do produto segue como Vereda (nome do repositório); a marca não entra na ficha do concurso.

Marco externo: Campus Mobile 15ª edição, inscrição até 18/10/2026 23h59; Semana Imersiva de 21 a 26/02/2027.

## Regras fixas

1. Toda afirmação tem fonte, data e escala. Nenhuma nota, score, preço justo ou recomendação. Posição numa distribuição é fato; adjetivo é veredito.
2. Régua (posição em distribuição) só onde a fonte permite comparar divisões territoriais. O rendimento por setor do IBGE não permite (nota metodológica 02/2025) e sai da régua.
3. Nenhuma pergunta de preferência antes do resultado. Dados do usuário só dentro do dossiê, opcionais, só no aparelho.
4. O servidor nunca toca portais de anúncio. Leitura na WebView do usuário, lista branca de campos, nenhum HTML guardado. Nunca contorna antibot; sem nome, telefone ou CRECI.
5. O que vai ao ledger vem de fonte aberta (ODbL ou domínio público; atribuição e share-alike nos derivados). API comercial só sob demanda, sem cache, com atribuição.
6. Nenhum tempo de deslocamento é calculado ou exibido pelo app no protótipo. Rotas abrem no app de mapas do usuário.
7. Confiança: 7 categorias no ledger, 4 rótulos na tela: registro oficial, declarado pelo anunciante, inferência ou sinal exploratório, não sabemos. "Desconhecido oficial" só no bloco de consistência.
8. Concurso (item 11.20 iv): a regra veda propaganda, não citação. Sem logos, capturas de terceiros, elogios ou chamadas comerciais; tecnologias habilitadoras e terceiros usados como fonte de dados citados em texto factual, com atribuição; benchmarking nomeado na apresentação com fonte e data. No seletor de apps de mapas, só nome em texto.

Lista branca de ingestão: colunas que nunca entram, mesmo estando no arquivo.

| Base | Colunas excluídas | Por quê |
| --- | --- | --- |
| IPTU | regime de tributação (IPTU e TRSD), número do contribuinte, CPF/CNPJ mascarado, tipo de contribuinte, complemento, pavimentos | regime revela aposentado ou servidor; complemento mais lat/long reidentifica; pavimentos do IPTU não têm relação com altura (Spearman −0,04) |
| Licenciamento | CPF, CNPJ, razão social, razão social mercantil, inscrição mercantil | identificam pessoa ou empresa |
| Dengue e arboviroses | qualquer dado de paciente | saúde |
| Escolas | gestor | nome de pessoa |
| SDS-PE | sexo, idade, idade SENASP | dado de vítima |
| Censo arbóreo | created\_us, last\_edite, resptecnic, responsave, contato | logins e contatos de pessoas |

## Protótipo (fev/2027): 12 itens, todos decididos

Ordem de corte se faltar tempo (R14): ruído e bússola do modo visita primeiro.

Mock de fevereiro: além dos 12 itens, inclui todos os itens do Final e o cartão de crime por bairro, com os números dos cinco bairros-alvo compilados pelo Crime Brasil a partir dos registros da SDS-PE, atribuídos às duas fontes. Esse cartão é exceção à regra 5 só no mock: o compilado não tem licença aberta declarada e não entra no ledger do produto até a base ser adquirida. O protótipo entregue só exibe o que tem fonte real.

Dados de crime do mock, coletados em 15/10/2026 (out/2025 a set/2026, contagem bruta por bairro informado no registro). Detalhe por natureza em `docs/pesquisa-viabilidade/dados/crime-bairros-recife.csv`, fonte única para o mock.

| Bairro | Ocorrências em 12 meses | Três naturezas mais registradas | Ano a ano (2020 → 2025) | 2026 até set |
| --- | --- | --- | --- | --- |
| Boa Viagem | 2.165 | ameaça 616, roubo a transeunte 581, roubo 212 | 2.429 → 2.705 | 1.522 |
| Casa Forte | 154 | ameaça 49, roubo a transeunte 39, furto 19 | 205 → 222 | 112 |
| Graças | 205 | roubo a transeunte 75, ameaça 58, roubo em estabelecimento 22 | 177 → 346 | 124 |
| Espinheiro | 197 | ameaça 85, roubo a transeunte 44, roubo 15 | 202 → 242 | 143 |
| Madalena | 424 | ameaça 134, roubo a transeunte 102, furto 42 | 537 → 543 | 289 |
| Areias (dossiê demonstrativo) | 504 | ameaça 185, roubo 91, roubo a transeunte 72 | 627 → 654 | 349 |

Conferência: no mesmo período, o compilado traz 8.899 roubos explícitos no Recife (transeunte, roubo e outros roubos), e o CVP municipal publicado pela SDS-PE soma 10.195. A diferença cabe na categoria "outros tipos" do compilado (2.353), onde ficam as demais modalidades de roubo. Os números são compatíveis. O compilado não publica população por bairro; por isso o cartão mostra contagem bruta, sem taxa e sem posição entre bairros.

| # | Feature | Ressalvas e regras |
| --- | --- | --- |
| 1 | Entrada por compartilhamento e colar link | Área de transferência vai para pós-programa. |
| 2 | Leitura na WebView + extração híbrida (lista branca de campos) | Sem jurisprudência sobre leitura pelo usuário; parecer pendente. Demo com dossiês pré-gerados como plano A. |
| 3 | Resolução por regras + confirmação no mapa; dossiê do edifício como entidade (DSQFL) | Confirmação obrigatória em compra. Camada edifício cacheada: o 2º anúncio do mesmo prédio abre em segundos. |
| 4 | Dossiê em 4 blocos: fiscal, cadastro, Defesa Civil, suscetibilidade, consistência, custo | IPTU por unidade só área e valor cobrado. "Desconhecido oficial" só no bloco de consistência. Defesa Civil 2025 geocodificada; SGB 2015 sem setorização no Recife. |
| 5 | Transmissões no edifício (ITBI 2015-2026, agregado) | Avaliação fiscal, não preço. Nunca uma transmissão isolada. |
| 6 | Régua de preço do bairro | Quartis do ITBI (raio ou bairro, 12 ou 24 meses) + anúncios do ledger + valor venal relativo, com o anúncio marcado. Controles de raio e período. Sem adjetivo. |
| 7 | Obras próximas: licenciamento no lote e em 150 m | Base tem DSQFL e coordenadas (113.305 registros). Só digital desde 2017; ausência nunca é irregularidade. |
| 8 | Mapa com POIs e anéis de raio (500 m, 1 km, 1,5 km) | Distância em linha reta, rotulada. POIs: UBS, USF, hospitais, policlínicas, maternidades, escolas municipais, mercados públicos, estações de trem e metrô (CBTU). Data de referência dos POIs pendente de ofício. Isócronas e 3D vão para o Final. |
| 9 | Roteiro de visita + mensagem ao corretor + formato WhatsApp | Resumo de 3 linhas por template. |
| 10 | Modo visita completo: checklist, GPS confirma o prédio, foto da fachada, cronômetro, ruído, bússola | Tudo em fevereiro. Confirmação por GPS vira origem "humano em campo". |
| 11 | Meus dossiês + fatos lado a lado + comparáveis abertos pelo usuário | Diff por magnitude, sem recomendação. Comparáveis lidos na WebView, rotulados "declarado pelo anunciante", só lista e faixa. |
| 12 | Caminhos diários + contestação | Seletor com uma linha por app de mapas instalado (Google Maps, OsmAnd, Organic Maps, CoMaps: origem, destino e modo; Waze: só destino) e "Outro app" via geo: só com destino. Nomes em texto, sem ícone. Contestação com motivo fechado e fila manual no Linear; nunca esconde o cartão. |

## Final (jun/2027)

Todos decididos, com a forma corrigida pela pesquisa. Crime por bairro depende de adquirir a base da SDS-PE e fica em pendências, mas entra no mock do protótipo com os números do compilado de terceiro.

| Feature | Ressalvas e regras |
| --- | --- |
| Linha do tempo do edifício (IPTU + ITBI + licenciamento + Defesa Civil) | Tudo ODbL e já carregado. |
| Verificação de distância declarada; rotina (3 pontos); isócronas a pé | Rede OSM, motor próprio (openrouteservice ou Valhalla, a testar com declive); sempre depois do dossiê. |
| Mapa 3D (MapLibre + PMTiles) e exposição solar com sombra | 3D é LOD1 de \~2013 (ano vem só do nome do serviço ESIG; metadados por ofício). Não casados: footprint × pavimentos do Lotes, rotulado inferência. "Medido em 2013" só quando altura coerente com pavimentos. Texto fixo: "2 em cada 3 prédios posteriores a 2013 não constam". Sombra pré-computada no servidor. Desempenho em aparelho fica para etapa futura. |
| Engarrafamento: carro com trânsito típico | Mapbox duration\_typical sob demanda (chave no servidor, sem cache) ou estimativa própria com radares CTTU. Google Routes e TomTom fora. |
| Calor: Landsat + censo arbóreo | Grade de 100 m (resolução nativa do sensor), mediana de 9 cenas Tier 1 com menos de 20% de nuvem (2022-2025). Texto: "por célula de 100 m, temperatura de superfície, não do ar, \~09h30". Boa Viagem P90−P10 de 6,6 °C; Casa Forte 1,7 °C. Censo arbóreo com pontos de 2018 a 2022, publicado como 2023. |
| Alagamento ampliado; arboviroses por bairro; barulho (metrô, via, bares) | Faixas marginais já (ODbL); alagamentos 2026 e curvas 1 m após ofício. Dengue com atraso > 9 meses, série anual. Aeroporto e hierarquia viária pendentes. |
| Renda do setor (Censo 2022) | Mediana e média do rendimento do responsável por setor, com N de responsáveis e de domicílios. Sem régua nem "acima da média" (IBGE veda ranquear). 39 setores do Recife sem valor: "não sabemos". Renda per capita só por área de ponderação (50 no Recife), como camada adicional. Condicionado ao teste de estigma em E6. |
| Custo de vida por partes | Fixos + transporte por tarifa × rota + condomínio mediano do bairro + cesta DIEESE + índice FIPE (cidade). Nunca um total. |
| Dados do domicílio | Pessoas (1/2/3-4/5+), criança escolar, veículos (0/1/2+), deslocamento, pet; em faixas; só no aparelho; allowBackup off; sem telemetria; botão apagar. |
| Indício de tipologia (prédio-caixão) | Só com 3 sinais (≤ 4 pavimentos, ano < 2005, padrão Simples/Médio); "o que observar" + "pergunta ao proprietário"; nunca afirma. |
| Leitor documental, App Links, PDF, créditos corroborados, contestação automática | Crédito só por confirmação corroborada; "em verificação" só após 2 contestações independentes; "não é este prédio" reabre a confirmação. |

## Pós-programa e pendências de parceria ou LAI

| Feature | Status | Depende de |
| --- | --- | --- |
| Foto de rua (Mapillary); white-label para corretor | decidido, pós-programa | revisão jurídica do uso comercial; token no servidor; resposta à dúvida 6 (share-alike da tabela edifício → DSQFL) |
| Crime por bairro (SDS-PE) | fonte identificada; aquisição pendente | A base por bairro do fato existe (Crime Brasil a compila desde jan/2020). Aquisição por LAI à Ouvidoria Geral do Estado (texto pronto na seção Aberto) ou por licenciamento do compilado. No mock do protótipo entra com os números do compilado, atribuídos; no app real, fora do dossiê até a aquisição. |
| Ônibus (GTFS do Grande Recife) | pendente | LAI ou parceria; até lá, rota de transporte público pelo seletor de apps |
| Ruído do aeroporto (curvas do PEZR) | pendente | LAI à ANAC, operadora ou Prefeitura |
| Setores de risco R1 a R4 (Defesa Civil do Recife) | pendente | parceria com a Defesa Civil municipal; SGB não cobre o Recife |
| Lista de prédios-caixão por endereço | pendente | Defesa Civil, ITEP ou MPPE; só endereço e situação, sem moradores |
| Camadas do ESIG sem licença (alagamentos 2026, curvas 1 m, temperatura, hierarquia viária) | pendente | ofício à Prefeitura; entram no Final com resposta escrita |

## Fora do produto

- Nível de preço de comércio do Google Places: os termos proíbem exibir com ou perto de mapa não-Google e proíbem cache.
- Score, preço justo ou previsão, total de custo de vida, relatos, chat livre, trânsito em tempo real, comparação com recomendação, outra cidade: veredito, dado inexistente ou sem licença.
- Cartão de crime no nível município: convida leitura errada num dossiê de prédio.

## Fontes confirmadas

Todas verificadas em 14/10/2026 na pesquisa de viabilidade (relatórios inv1 a inv5 em docs/pesquisa-viabilidade do repositório), exceto o Crime Brasil, verificado em 15/10/2026.

| Base | Licença | Atualização | Uso no produto |
| --- | --- | --- | --- |
| [Recife: Lotes, Quadras, Edificações 3D, Bairros e RPAs](https://dados.recife.pe.gov.br/dataset/area-urbana) | ODbL | 2026-03-02 (atributos de 2023) | DSQFL, footprint, pavimentos, quadras, 3D |
| [Recife: Limites dos Bairros 2023](https://dados.recife.pe.gov.br/dataset/mapas-de-limites-e-divisoes-territoriais) | ODbL | 2026-03-02 | régua por bairro, AIS aproximada |
| [Recife: IPTU 2026 (422.776 registros)](https://dados.recife.pe.gov.br/dataset/imposto-predial-e-territorial-urbano-iptu) | ODbL | 2026-10-03 | área, valor cobrado, ano de construção, lat/long |
| [Recife: Licenciamento Urbanístico (113.305 registros)](https://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=39927a3d-3235-436a-9dc8-df7f4ea3b720&limit=0) | ODbL | 2026-06-17 | obras no lote e em 150 m |
| [ESIG: serviços ArcGIS (Lotes, Face de Quadra, Edificação 2013)](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/) | não declarada | não declarada | cálculo do casamento; equivalência com os arquivos a confirmar |
| Recife: POIs de saúde, escolas, mercados, estações de trem (pacotes em dados.recife.pe.gov.br) | ODbL | 2026-03 a 2026-07 | mapa com anéis de raio |
| [Recife: Censo Arbóreo (259.575 pontos)](https://dados.recife.pe.gov.br/dataset/censo-arboreo) | ODbL | 2026-03-02 (pontos 2018-2022) | calor, cruzado com a grade |
| [IBGE: rendimento do responsável por setor](https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/) | não nomeada; citar o IBGE e anotar transformações | 2026-05-08 | renda do setor |
| [IBGE: malha de setores 2022 de PE (GeoPackage)](https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/malha_com_atributos/setores/gpkg/UF/PE/PE_setores_CD2022.gpkg) | idem | 2024-11-13 | geometria dos setores |
| [IBGE: áreas de ponderação](https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Microdados_e_Areas_de_Ponderacao/) | idem | 2026-08 | renda per capita, camada adicional |
| [SDS-PE: microdados de CVLI, MVI, CVP, estupro e violência doméstica](https://www.sds.pe.gov.br/estatisticas) | não declarada; Portaria 752/2023 exige citar a SDS | 2026-10-05 | publicação aberta só por município e região; a base por bairro é a do compilado abaixo |
| [Crime Brasil: ocorrências da SDS-PE por bairro do fato e natureza](https://crimebrasil.com.br/fontes/sds-pe) | termos: dados seguem a licença do órgão (a SDS não declara); textos e visualizações são do Crime Brasil; base completa só por API paga | mensal; páginas de bairro com out/2025 a set/2026 | crime por bairro no mock. ~848 mil registros em PE (jan/2020 a set/2026), ~4% sem bairro, sem coordenada; bairro é o nome informado no registro |
| [Landsat 8 e 9 C2 L2 via STAC do Planetary Computer](https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2) | USGS: sem restrição, pede crédito; STAC diz "proprietary" | cenas 2023-10 a 2025-09 | temperatura de superfície |

## Textos fixos de escala por cartão

Entram literalmente no mock e no app. O doc de UI/UX não cria frases novas para estes cartões.

| Cartão | Texto de escala | Rótulo de confiança |
| --- | --- | --- |
| IPTU por unidade | "área e valor cobrado, IPTU 2026, Prefeitura do Recife" | registro oficial |
| Transmissões | "avaliação fiscal do ITBI, não preço; agregado do edifício, 2015-2026" | registro oficial |
| Régua de preço | "quartis do ITBI, \[bairro ou raio de X m\], \[12 ou 24\] meses, N = x" | registro oficial + declarado pelo anunciante (anúncios do ledger) |
| Obras próximas | "licenciamento em 150 m, só processos digitais desde 2017; ausência não é irregularidade" | registro oficial |
| Distância a POI | "em linha reta" | registro oficial (coordenada), data de referência pendente |
| Altura e 3D | "medido em 2013" ou "altura inferida por pavimentos"; rodapé do bairro: "2 em cada 3 prédios posteriores a 2013 não constam" | registro oficial ou inferência |
| Calor | "por célula de 100 m, temperatura de superfície, não do ar, \~09h30, mediana de 9 cenas 2022-2025" | inferência ou sinal exploratório |
| Renda do setor | "mediana do rendimento mensal do responsável, setor censitário, Censo 2022, N = x responsáveis"; sem posição em distribuição | registro oficial |
| Renda per capita | "área de ponderação \[código\], que inclui \[bairros\], Censo 2022" | registro oficial |
| Arborização | "censo arbóreo da Prefeitura, pontos levantados entre 2018 e 2022, publicado como 2023" | registro oficial |
| Defesa Civil | "ocorrências geocodificadas, 2025; sem registro não significa sem risco" | registro oficial |
| Suscetibilidade | "SGB 2015, sem setorização no Recife" | não sabemos (bloco de consistência) |
| Prédio-caixão | "indício por 3 sinais cadastrais; não é laudo" | inferência ou sinal exploratório |
| Rotas | "abre no app de mapas que você escolher; o Vereda não calcula tempo" | sem rótulo |
| Crime por bairro | "contagem bruta de ocorrências registradas, 12 meses (\[período\]), por bairro informado no registro policial; registros da SDS-PE compilados pelo Crime Brasil; não é o total de crimes, há subnotificação"; sem cor, sem adjetivo, sem ranking de bairros e sem agrupar ameaça em "crimes violentos" | registro oficial |

## Aberto

Técnico, não verificado pela pesquisa (só dois afetam o protótipo):

- [x] Coletar no Crime Brasil os números dos cinco bairros-alvo (total e por natureza, 12 meses) e conferir a soma de roubos do Recife contra o CVP municipal da SDS-PE. Feito em 15/10/2026; compatível (tabela na seção Protótipo).
- [ ] Testar os esquemas de rota (geo:, Google Maps URLs, OsmAnd, Organic Maps, CoMaps, Waze) em emulador Android 12+ e registrar o que cada um preenche. Afeta o item 12.
- [ ] Confirmar a equivalência entre o serviço ArcGIS de Lotes e o GeoJSON do portal (o cálculo do E4 usou o serviço). Afeta o item 3.
- [ ] Conferir o N efetivo de responsáveis com rendimento por setor (denominador da média e mediana). Final.
- [ ] Verificar nuvem residual nas cenas Tier 1 e se as bordas com água e praia explicam os extremos de Boa Viagem. Final.
- [ ] Obter documento oficial do levantamento 3D; o ano 2013 vem só do nome do serviço. Final.
- [ ] Verificar se os limites das AIS coincidem com os limites oficiais de bairro. Pós-LAI.

Jurídico (17 dúvidas no relatório; as que decidem produto):

1. Share-alike da ODbL: a tabela edifício → DSQFL, derivada de Lotes, 3D, IPTU e Licenciamento, é base derivada a publicar sob ODbL? Decide o modelo de white-label.
2. Texto de atribuição exigido pelo portal do Recife na tela.
3. IBGE: licença dos agregados e da malha 2022; compatibilidade com "ODbL ou domínio público"; finalidade estatística para produto comercial.
4. Google Maps Platform: a cláusula 3.2.3(e) alcança um link de Maps URL ao lado de um mapa MapLibre? Usar sem chave cria vínculo com os termos?
5. Marcas: nome de cada app de mapas no seletor exige autorização?
6. Landsat: qual texto de licença vale (STAC "proprietary" vs. FAQ da USGS) e qual crédito usar.
7. IPTU: lat/long por imóvel mais complemento gera risco de reidentificação; complemento já está excluído.
8. WebView e termos dos portais de anúncio; Mapillary comercial; licença da pesquisa Ademi-PE.

Ofícios e LAI, texto pronto para protocolar:

| Destinatário | Canal | Pedido |
| --- | --- | --- |
| SDS-PE | [Ouvidoria Geral do Estado](https://www.ouvidoria.pe.gov.br/), Lei 14.804/2012 e art. 3º da Portaria 752/2023 | Contagem mensal, jan/2019 a set/2026, de vítimas de CVLI, ocorrências de CVP por modalidade, vítimas de estupro e ocorrências das demais naturezas registradas (ameaça, furto, lesão corporal, entre outras) no Recife, por bairro do fato e por AIS, sem dado pessoal, em CSV, com o número de registros sem bairro e o vetor do Anexo IV da Portaria 3.985/2018. |
| Prefeitura do Recife (ESIG/EMPREL) | ofício | Relatório técnico ou metadados da camada Edificação Recife 2013 (data, método, MDE/MDT/MDS, critério de DSQFL quando CDLOTENUM é zero) e definição de "ano da construção corrigido" do IPTU. |
| Prefeitura do Recife (EMPREL/SEINFRA) | ofício | Data de referência do Censo Arbóreo publicado como 2023 e dicionário de dados atualizado de Quadras e Lotes. |
| Secretarias de Saúde e Educação do Recife | ofício | Data de referência dos arquivos de UBS, USF, hospitais, policlínicas, maternidades e unidades de ensino, e datum das coordenadas. |
| Prefeitura do Recife (ESIG, EMLURB, SEMOC/UIG, Finanças) | ofício | Camadas sem licença: alagamentos 2026, curvas 1 m, temperatura, hierarquia viária; pesquisa Ademi-PE. |
| ANAC, Grande Recife, Defesas Civis, ITEP, APAC | LAI | Curvas do PEZR; GTFS; setores de risco R1 a R4; lista de prédios-caixão; hidrologia. |
| IBGE | opcional, só se o parecer pedir | Licença dos Agregados por Setores 2022 e da malha; reuso comercial com atribuição. |
