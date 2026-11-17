# Dados públicos que o VEREDA ainda não usa

Pesquisa de 20/10/2026, com cada item conferido por um segundo agente que abriu as fontes. Detalhes, trechos e todas as URLs estão em [`anexo-pesquisa-verificada.json`](anexo-pesquisa-verificada.json). "Confirmado" quer dizer que a fonte foi aberta e sustenta o que está escrito; "parcial", que parte do item não se sustentou e foi corrigida.

## O que muda na leitura da v1.0

A matriz de [`V1-ESCOPO-E-VIABILIDADE.md`](../../V1-ESCOPO-E-VIABILIDADE.md) dizia que alagamento por endereço e a lista de prédios do ITEP não eram públicos. **Não é bem assim.** O ESIG da Prefeitura expõe as duas coisas numa API aberta: 181 pontos críticos de alagamento com situação da obra e a avaliação de risco de 205 prédios feita pelo ITEP em 2007. A barreira é a licença (nenhuma camada do ESIG declara uma), não o acesso. A decisão muda de "inviável" para "viável depois de autorização ou parecer".

## Por pergunta de quem procura apartamento

### "A rua alaga?"

| Base | O que dá | Atualização | Licença | Esforço |
|---|---|---|---|---|
| [Pontos críticos de alagamento da Emlurb (ESIG/COP)](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/COP/BASES_FEATURES_COP_CONSULTA/MapServer/1) | 181 pontos em 52 bairros, com logradouro, trecho, custo e situação: 121 concluídos, 56 aguardando financiamento, 4 em andamento. Boa Viagem 22, Casa Forte 3, Madalena 3, Espinheiro 2, Graças 2 | Última conclusão registrada em 03/08/2022: a base pode estar parada | Não declarada | Baixo |
| [Áreas alagáveis (ESIG/COP, camada 5)](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/COP/BASES_FEATURES_COP_CONSULTA/MapServer/5) | 267 polígonos com campo DS de 1 a 8 | Sem data | Não declarada; DS sem legenda | Baixo |
| [Curvas de nível de 1 m (ESIG/SEPUL)](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento/BASES_CURVANIVEL/MapServer) | Cota aproximada do terreno do lote e se ele fica num ponto baixo da quadra | Data e referencial não declarados | Não declarada | Médio |
| [Rede de drenagem da Emlurb](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Emlurb/BASES_DRENAGEM_RECIFE_MA/MapServer) | 99 canais e 279 trechos com estado de conservação; faixas de proteção e non aedificandi de 2026 | Contrato de 2012; faixa de 2026 sobre imagens de 2002–2014 | Faixas: ODbL. Drenagem: copyright da contratada | Baixo |
| [Defesa Civil: atendimentos por endereço](https://dados.recife.pe.gov.br/dataset/registro-de-atendimentos-da-defesa-civil) | 80.173 atendimentos em 2024, com endereço e bairro; grau de risco vazio em 88% dos registros dos 5 bairros | Série útil até 2024 | ODbL | Médio (casar endereço) |
| [APAC e Cemaden: chuva por posto](http://monitoramento.apac.pe.gov.br:8031/modelos/Modelo_dados/informacoes_sobre_os_dados.html) | Chuva das últimas 3 horas e histórico | Tempo real | Sem licença; pede citação | Baixo |

**Como usar sem exagerar:** "ponto crítico de alagamento catalogado a 150 m, obra concluída em 2019 (Emlurb)" é fato com data. "Rua que alaga" não é. A cota baixa vira pergunta ("a garagem é no subsolo? já entrou água?"), não afirmação. No dia da visita, se choveu nas últimas 3 horas, o app sugere olhar a rua.

### "Tem ônibus e metrô perto?"

| Base | O que dá | Atualização | Licença | Esforço |
|---|---|---|---|---|
| [GTFS do Grande Recife](https://www.granderecife.pe.gov.br/transporte/gtfs/) | 400 linhas (395 de ônibus, 3 de metrô, 2 de VLT), 7.217 paradas e todos os horários programados | Versão de 16/10/2026, válida até 16/10/2027 | Não declarada | Médio |
| [Malha cicloviária (CTTU)](https://dados.recife.pe.gov.br/dataset/malha-cicloviaria-do-recife) | 240 km, dos quais 206 permanentes | 25/08/2026 | ODbL | Baixo |
| [Censo 2022: entorno dos domicílios](https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Caracteristicas_urbanisticas_do_entorno_dos_domicilios/) | Por setor e bairro: ponto de ônibus, calçada, obstáculo na calçada, rampa, árvores, iluminação | Dados de 17/04/2025 | Sem licença nomeada; citar o IBGE | Baixo |

O GTFS é o ganho mais visível desta lista: com ele, o script do índice calcula por prédio quantas linhas passam a 400 m e com que frequência no pico e às 22h, sem API paga. É o que tira "Caminhos diários" do papel.

### "Falta água? Falta luz? O celular pega?"

| Base | O que dá | Licença | Decisão |
|---|---|---|---|
| [Compesa: regime de abastecimento](https://servicos.compesa.com.br/calendario-de-abastecimento-da-compesa/) | Dias com água por mês em cada área de abastecimento, até setembro de 2026 | Não declarada | **Não consumir sem autorização.** O mesmo servidor expõe uma camada com endereço e valor de conta de 2,46 milhões de imóveis: é dado sensível exposto por terceiro. Até haver autorização, cisterna e rodízio entram só como pergunta |
| [ANEEL: DEC e FEC](https://dadosabertos.aneel.gov.br/dataset/indicadores-coletivos-de-continuidade-dec-e-fec) | Horas sem luz por ano no conjunto elétrico | ODbL | Usar o valor anual consolidado (a série mensal de 2025 tem buracos). Conjunto elétrico não é bairro: ligar o prédio ao conjunto exige a BDGD |
| [Anatel: cobertura móvel por setor](https://informacoes.anatel.gov.br/paineis/infraestrutura) | 4G e 5G por operadora e setor censitário, trimestral (setembro de 2026) | Rodapé do site em CC BY-ND 3.0 | Parecer jurídico antes: "sem derivações" pode impedir o recorte por prédio |

### "É barulhento? Tem obra ou bar perto?"

| Base | O que dá | Licença | Cuidado |
|---|---|---|---|
| [Licenciamento Ambiental: LUSE](https://dados.recife.pe.gov.br/dataset/licenciamento-ambiental) | Licenças de som amplificado com DSQFL e coordenada: bar, casa de show ou evento a 150 m, vigente ou não | ODbL | 577 processos concentram-se em cerca de 114 locais (renovações); a maioria está expirada. Pedir só DSQFL, coordenada, situação e datas, nunca CNPJ ou razão social |
| [Central 156 da Emlurb](https://dados.recife.pe.gov.br/dataset/central-de-atendimento-de-servicos-da-emlurb-156) | Pedidos de galeria entupida, lâmpada apagada, entulho, com coordenada e tempo de atendimento | ODbL | Mede quem reclama, não a condição real. 2026 só até janeiro |
| [Zoneamento da LPUOS 2025 (ESIG)](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento?f=json) | Zona do lote e dos vizinhos: o que pode subir ao lado | Não declarada | Lei sancionada em 03/10/2025 (PLE 16/2025); número da lei não encontrado. Mostrar a zona com "consulte o que pode ser construído", sem afirmar altura |
| [Obras públicas estaduais](https://dados.pe.gov.br/dataset/obras-publicas) | 144 obras do Estado no Recife, 127 em andamento, 112 com coordenada | CC-BY | Obras municipais no CKAN pararam no 1º trimestre de 2023 |

### "A rua é segura?"

| Base | O que dá | Decisão |
|---|---|---|
| [SDS-PE](https://www.sds.pe.gov.br/estatisticas) | Só município e região, como em 2025 | Manter o pedido via LAI por bairro e AIS |
| [Fogo Cruzado (API)](https://api.fogocruzado.org.br/docs) | Tiroteios com ponto, data e vítimas na Região Metropolitana desde abril de 2018; gratuita com cadastro | Única fonte georreferenciada utilizável. Se entrar, como "tiroteios registrados a 1 km em 12 meses (Fogo Cruzado)", nunca ranking. Não cobre roubo nem furto |
| [Sinistros de trânsito da CTTU](https://dados.recife.pe.gov.br/dataset/acidentes-de-transito-com-e-sem-vitimas) | Atropelamentos e colisões por endereço até 2024, com velocidade da via | Contagem com data, nunca "rua perigosa" |
| [ITEP 2007: risco de edificações](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento/BASES_ITEP_EDIF_GRAURISCO/MapServer/0) | 205 prédios avaliados, com DSQFL, em Imbiribeira, Várzea, Ipsep e outros 4 bairros, nenhum dos 5 da v1.0 | **Não usar sem parecer.** É rótulo de risco de prédio identificado, com 19 anos e sem licença |

### "O condomínio está bem das pernas?"

| Base | O que dá | Decisão |
|---|---|---|
| [CNPJ da Receita Federal](https://arquivos.receitafederal.gov.br/index.php/s/YggdBLfdninEJX9) | Condomínios aparecem com a natureza 3085 "Condomínio Edilício": dá para achar o CNPJ pelo endereço | Nunca ingerir o arquivo de sócios (nomes de pessoas) |
| [PGFN: dívida ativa e FGTS](https://www.gov.br/pgfn/pt-br/assuntos/divida-ativa-da-uniao/transparencia-fiscal-1/dados-abertos) | Débitos inscritos por CNPJ; 185 CNPJs de condomínios de PE no FGTS do 2º trimestre de 2026 | Mostrar só o fato com data e transformar em pergunta à administradora. Débito parcelado também aparece: nunca veredito |

### "O que tem por perto?"

| Base | O que dá | Licença | Observação |
|---|---|---|---|
| [CNEFE 2022 do IBGE](https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/Municipio/26_PE/2611606_RECIFE.zip) | 737.511 endereços do Recife com coordenada, setor e espécie (domicílio, escola, saúde, comércio) | Sem licença nomeada; citar o IBGE | **Pré-requisito de várias bases.** Geocodifica tudo o que só tem endereço (Defesa Civil, sinistros, coleta, empresas). Nunca guardar o complemento |
| [CNES (API do Ministério da Saúde)](https://apidadosabertos.saude.gov.br/static/swagger.json) | Unidades de saúde com coordenada, SUS ou não | API MIT; dados com rodapé CC BY-ND | Não usar o endpoint de profissionais |
| [INEP: Ideb por escola](https://download.inep.gov.br/ideb/resultados/divulgacao_anos_iniciais_escolas_2025.zip) | 309 escolas públicas do Recife nos anos iniciais | Rodapé CC BY-ND | Ideb só existe para escola pública: mostrar como dado da escola, nunca média do bairro |
| [Empresas ativas do Recife](https://dados.recife.pe.gov.br/dataset/empresas-da-cidade-do-recife) | 407.663 empresas com CNAE e endereço | ODbL | As coordenadas publicadas não servem (só 8 pares distintos, truncados). Geocodificar pelo CNEFE |
| [Árvores (ESIG)](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/MeioAmbiente/MA_PontosArvores/MapServer/0) | 259.575 árvores com porte e copa | Copyright da Prefeitura, sem licença | Contar árvores a 100 m, sem comparar espécies |
| OpenStreetMap e Overture | Malha viária e pontos de interesse | ODbL (OSM); varia por tema (Overture) | No Recife, o OSM tem um terço dos pontos do CNEFE e só 5,6% dos prédios com número de andares: não usar como fonte principal |

### "Quanto custa morar aqui? Vale financiar?"

| Base | O que dá | Licença |
|---|---|---|
| [Censo 2022: domicílios alugados por área de ponderação](https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Microdados_e_Areas_de_Ponderacao/Areas_de_Ponderacao/tabelas_xlsx.zip) | Graças, Espinheiro, Aflitos e Derby: 31,3% alugados; Casa Forte (área 053): 17,1%; Madalena: 28,2%; Boa Viagem: de 23,2% a 39,4% conforme a área; Recife: 26,6% | Citar o IBGE |
| [Censo 2022: vagos e uso ocasional por bairro](https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/Agregados_por_Bairro_csv/Agregados_por_bairros_basico_BR_20260520.zip) | Graças: 8,6% vagos e 3,7% de uso ocasional em 2022 | Citar o IBGE |
| [Banco Central: SGS 20774 e taxas por banco](https://dadosabertos.bcb.gov.br/dataset/20774-taxa-media-de-juros-das-operacoes-de-credito-com-recursos-direcionados---pessoas-fisicas---fi) | Taxa média do financiamento com recursos direcionados: 11,28% a.a. em agosto de 2026; Caixa regulada a 7,98% + TR | ODbL |
| [Índice FipeZAP](https://downloads.fipe.org.br/indices/fipezap/fipezap-serieshistoricas.xlsx) | Recife em setembro de 2026: aluguel anunciado R$ 64,39/m² (+6,29% em 12 meses), venda R$ 9.044,83/m². O informe mensal traz os 10 bairros mais representativos (4 dos 5 da v1.0; Casa Forte fica de fora) | **Todos os direitos reservados à Fipe.** Citar um número com fonte é diferente de reproduzir a série: pedir autorização (fipezap@fipe.org.br) |

Com o Banco Central, uma simulação de compra já é viável e gratuita. Exemplo conferido: 90 m² a R$ 7.972/m² (Graças), 70% financiado a 11,28% a.a. em 360 meses pela Tabela Price dá parcela de R$ 4.682,87, sem TR e sem seguros. Tem de dizer isso na tela.

## Bases que não valem o esforço agora

- **RAIS e Novo CAGED:** contagens por CEP; o CNPJ com o CNEFE nomeia melhor o comércio.
- **MapBiomas 10 m:** a camada urbana é binária, e os 5 bairros são todos urbanos.
- **Sentinel-2 para calor:** não tem banda térmica. Se o calor voltar, o ECOSTRESS (70 m, passagens à tarde) complementa o Landsat.
- **DataJud (CNJ):** gratuito, mas não busca por parte e o termo proíbe uso comercial derivado.
- **Cadastro Imobiliário Brasileiro (CIB/SINTER):** não é aberto; consulta com login gov.br. No médio prazo, o código CIB pode virar a chave universal anúncio → prédio → matrícula (capitais deviam adotá-lo até jan/2026; demais municípios até jan/2027, pela LC 214/2025, arts. 266 e 544).
- **Tábua de marés da Marinha:** acesso bloqueado (403); só como dica de visita em dia de chuva com maré alta.

## Regras que valem para todas as bases novas

1. **Tudo passa pelo script do índice**, nunca por consulta direta do app. Os portais da Prefeitura devolvem no máximo 500 linhas por página; os serviços ArcGIS aceitam estatística agregada no servidor.
2. **Lista branca estendida:** Licenciamento Ambiental e Empresas sem CNPJ, razão social e inscrição mercantil; CNEFE sem complemento; CNES sem profissionais; Receita sem sócios; Compesa nunca a camada de ligações; ArcGIS sem campos de usuário de edição.
3. **Cada fato com fonte e data na tela**, inclusive quando a data denuncia defasagem (alagamento: 2022; Defesa Civil: 2024).
4. **Licença antes de exibir:** ODbL e CC-BY entram com aviso de atribuição; "não declarada" e CC BY-ND passam por parecer ou autorização por escrito.
