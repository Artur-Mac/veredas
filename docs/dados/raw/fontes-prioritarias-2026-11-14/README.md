# Coleta de fontes prioritárias do Recife

Coleta de 14/11/2026, hora local. Esta pasta contém arquivos de pesquisa. Os manifestos registram URL do recurso, recorte, quantidade e hash SHA-256. O [levantamento de produto](../../../produto/fontes-prioritarias-recife-2026-11-14.md) cobre os usos e as hipóteses de outras fontes.

## Drenagem e alagamento no eSIG

| Arquivo | Registros | Leitura sustentada pelo arquivo |
| --- | --- | --- |
| [Pontos de alagamento](pontos-alagamento.geojson) | 54 | Todos têm logradouro e indicação de precisão. São 39 pontos marcados como aproximados e 15 como interseção. Todos os campos de recorrência, influência de maré e lâmina vieram vazios. |
| [Polígonos de alagamento](poligonos-alagamento-2026.geojson) | 78 | Áreas listadas pelo serviço. Metodologia, evento ou cenário associado e significado dos limites precisam ser confirmados com o produtor antes de interpretar o cruzamento. |
| [Trechos de logradouro](logradouros-alagamento-2026.geojson) | 552 | Geometrias de trechos, com código e nome de logradouro. Vários trechos podem fazer parte de uma rua. |
| [Canais da EMLURB](canais-emlurb.geojson) | 99 | Linhas de canais do cadastro com nome, código e bacia. A descrição do serviço cita o contrato 6016/2012. |
| [Planejamento de limpeza](limpeza-macrodrenagem-2026.geojson) | 514 | Trechos da camada de planejamento para 2026. Para mostrar obra ou limpeza concluída, obter etapa e data de execução. |

A data de edição do serviço descreve a camada publicada. Datas dos eventos, equivalência com os 159 pontos do Plano de Contingência, metodologia dos polígonos, atualização do cadastro e licença de redistribuição das camadas consultadas no eSIG ficaram pendentes. O serviço técnico da EMLURB também expõe o cadastro de microdrenagem, consultado nesta rodada sem coleta em massa. [Manifesto eSIG](manifesto-esig.json) · [Pontos no eSIG](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Hosted/pontos_alagamento_arcgis/FeatureServer/0) · [Microdrenagem](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Emlurb/BASES_DRENAGEM_RECIFE_MI/MapServer)

## Ideb 2025 nas escolas do Recife

Baixei os três arquivos oficiais pelo Chrome. Extraí o município IBGE 2611606 e selecionei código INEP, escola, rede, Ideb 2023 e 2025 e o marcador de ausência da nota de 2025. O cruzamento pelo código INEP usa o cadastro municipal de 2023. A falta de correspondência pede uma fonte atualizada de localização ou de rede estadual, especialmente para o ensino médio. Cada estágio é uma tabela própria. A mesma escola pode aparecer em mais de uma etapa.

| Etapa | Registros | Com nota 2025 | Correspondência no cadastro municipal |
| --- | --- | --- | --- |
| [Anos iniciais](ideb-2025-anos-iniciais-recife.json) | 309 | 200 | 217 |
| [Anos finais](ideb-2025-anos-finais-recife.json) | 192 | 122 | 41 |
| [Ensino médio](ideb-2025-ensino-medio-recife.json) | 122 | 96 | 0 |

[Página oficial Ideb 2005–2025](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados/2005-2025) · [Manifesto Ideb](manifesto-ideb.json)

## Rotina, saúde e cadastro

| Arquivo | Registros | Observação |
| --- | --- | --- |
| [Ciclovias permanentes](ciclovias-permanentes.geojson) | 558 | Tipo, sentido e logradouro. |
| [Calçadas de corredores](calcadas-corredores.json) | 159 | Largura cadastrada por via principal. |
| [Semáforos acessíveis](semaforos-acessiveis.json) | 67 | Coordenadas, tipo, horário e funcionamento cadastrado. |
| [Feiras](feiras.json) e [mercados](mercados.json) | 17 e 6 | Horário e dias declarados na fonte onde preenchidos. |
| [Coleta de resíduos](coleta-residuos.json) | 5.046 | Roteiro completo, com turno e frequência. Preservada a granularidade de registro da fonte. |
| [Educação municipal](educacao-municipal-2023.json) | 357 | Cadastro de 2023 com código INEP e campos úteis ao cruzamento. |
| [Saúde municipal](saude-municipal.geojson) | 132 | Polígonos de equipamentos urbanos. A entrada precisa de localização própria para traçar o percurso. |
| [CNES](cnes-amostra.json) | 20 | Amostra de estabelecimentos ativos para verificar código, tipo, coordenadas e campos de atendimento. |
| [Imóveis especiais de preservação](imoveis-de-preservacao.geojson) | 275 | Polígonos e referência à legislação do cadastro. |

[Manifesto dos dados de rotina](manifesto.json)

## Investigação complementar de água, energia, chuva e maré

**Compesa.** No Chrome, conferi o fluxo com o endereço público da sede da APAC como referência, usando as coordenadas do cadastro de estações. A página pública do calendário aceita `x` e `y` em SIRGAS 2000. O código público consulta primeiro logradouro, depois área de abastecimento e, na ausência de área, a gerência. Quando há identificação da área, tenta consultar a programação mensal pelo ID. O serviço geográfico que a própria página chama na porta HTTPS 6443 encerrou a conexão no Chrome e na consulta direta. O teste por coordenadas abriu a página sem preencher o calendário. O fluxo por coordenadas ficou verificado no código público, e uma programação específica do Recife segue sem confirmação. Para histórico, é preciso uma fonte de interrupções observadas além do calendário programado. [Calendário Compesa](https://servicos.compesa.com.br/calendario-de-abastecimento-da-compesa/) · [Consulta pública testada](https://giscomp.compesa.com.br/calendario.html?x=-34.875&y=-8.045)

**Energia.** Baixei o arquivo oficial de dezembro de 2025 da Neoenergia Pernambuco, distribuidora 43 na BDGD. A camada `CONJ` contém 134 multipolígonos em SIRGAS 2000. Cruzei 48 centróides do índice municipal, oito de cada um dos seis bairros já amostrados na pesquisa de conectividade. Todos caíram em exatamente um polígono e produziram 12 códigos distintos. Todos os 12 códigos `COD_ID` corresponderam a `IdeConjUndConsumidoras` no arquivo de continuidade da ANEEL para o mesmo ano. Obtive 288 chaves mensais distintas de DEC e FEC após retirar duplicatas idênticas de 576 linhas. Boa Viagem, por exemplo, teve três conjuntos na amostra. O teste valida a associação espacial dos pontos ao conjunto. A confirmação da rede que atende uma unidade específica e a revisão de lotes em borda ainda exigem dados próprios. [Prova geográfica e série mensal](energia-prova-conjuntos-dec-fec-2025.json) · [Arquivo da distribuidora](https://www.arcgis.com/home/item.html?id=a36b00f67b394ff8977cbacb6d278901) · [DEC/FEC](https://dadosabertos.aneel.gov.br/dataset/indicadores-coletivos-de-continuidade-dec-e-fec)

**Chuva recente.** A API da APAC retornou 20 estações no Recife, com coordenadas, bacia, hora da leitura e acumulados de 1 a 72 h. Na captura, 18 tinham acumulado de 24 h não negativo. Um registro trouxe ano 1900 e acumulados negativos. Outro trouxe `-1` em 24 h e valor positivo em 72 h. Preservar a ausência por janela, a data da estação e o horário bruto. O download anual de 2025 do INMET foi conferido no Chrome e a listagem do ZIP não continha A301, Recife ou Curado; esse arquivo específico não cobre a série local procurada. [Captura APAC · Recife](chuva-apac-recife.json) · [Serviço APAC](https://geoportal.apac.pe.gov.br/server/rest/services/met_monitoramento_chuvas_pe/MapServer) · [Arquivos INMET](https://portal.inmet.gov.br/dadoshistoricos)

**Histórico de chuva.** O Centro de Operações do Recife disponibiliza registros por pulso, em milímetros. Baixei os 7.808 registros de Recife, com 10 códigos de estação. O campo `DATAHORA`, lido como timestamp bruto, vai de julho de 2023 a fevereiro de 2026, com lacunas de meses. Há seis ocorrências extras de IDs repetidos, que ficaram preservadas no bruto. Em 7.807 registros, o número no sufixo de `IDUNICO` fica exatamente três horas à frente de `DATAHORA`. Há uma exceção. A interpretação do fuso precisa de confirmação do COP antes de alinhar com chamados de alagamento. Séries por pulso também exigem distinguir períodos secos de falta de telemetria antes de somar longas janelas. [Coleta do histórico](chuva-cop-pulsos-recife.json) · [Serviço COP do Recife](https://esigportal2.recife.pe.gov.br/arcgis/rest/services/COP/BASE_SENSORES_PLUVIOMETRICOS_RECIFE/MapServer)

**Maré.** No Chrome, selecionei a estação Porto do Recife (30645) para 14/11/2026 no visualizador da Marinha. A tabela do Projeto REMO retornou 24 valores horários e quatro extremos em metros, no fuso da estação UTC−3. Mostrou preamares às 06h39 e 18h54, com 1,843 m e 1,907 m. São valores calculados pelo REMO. A edição anual oficial do CHM para o Porto do Recife foi localizada e o PDF ficou sem leitura nesta sessão. O CHM distingue o nível de redução usado nas previsões do zero da régua das observações. Para comparar com cotas da rua, falta confirmar a referência vertical no produto usado e a transformação para o levantamento municipal. [Captura Porto do Recife](mare-remo-porto-recife-2026-11-14.json) · [Visualizador da Marinha](https://pam.marinha.mil.br/tabuamares/tabuamares.html) · [Tábua oficial CHM](https://www.marinha.mil.br/chm/dados-do-segnav-dados-de-mare-mapa/24-porto-do-recife-82-84) · [Referenciais CHM](https://www.marinha.mil.br/chm/bndo/duvidas-frequentes)

[Manifesto das quatro coletas complementares](manifesto-utilidades.json)
