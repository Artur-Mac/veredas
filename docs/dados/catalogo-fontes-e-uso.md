# Catálogo de dados do VEREDA: cobertura, qualidade e uso

**Inventário em:** 17 de novembro de 2026  
**Referência:** branch main após atualização por git pull --ff-only. A extração municipal mais recente citada é de 15/11/2026, salvo data diferente indicada.  
**Objetivo:** descrever objetivamente os dados existentes, sua extensão temporal e espacial, qualidade conhecida, uso atual e lacunas. O catálogo não ranqueia fontes.

## Como ler

- **Integrado:** dado usado por uma camada, cálculo ou fluxo do app. Isso não significa dado ao vivo nem validado por clientes.
- **Snapshot/arquivo:** extração ou versão identificada; pode exigir novo download e processamento para atualizar.
- **Candidato:** fonte localizada, mas ainda sem validação suficiente, licença confirmada ou integração.
- **Difícil de obter:** exige pedido formal, levantamento de campo, contrato ou correção de limitações da fonte.
- Dado ausente não é tratado como zero. Datas de evento, protocolo, publicação, extração e observação são distintas.

## Recorte atual do produto

O índice cadastral cobre **7.206 edifícios em 72 bairros**. A referência municipal tem **94 bairros oficiais**. As camadas por edifício documentadas estão habilitadas em **Boa Viagem, Casa Forte, Graças, Espinheiro, Madalena e Torre**: 2.688 edifícios nas cinco áreas iniciais e 137 na Torre, total de 2.825. Há resultados associados a 2.643 edifícios quando o vínculo cadastral é forte. “Índice municipal”, “Recife inteiro” e “camada por edifício” são coberturas diferentes. **Não há cobertura RMR demonstrada para o produto como um todo.**

O app publica snapshots. A coleta e atualização são rotinas locais, não uma consulta ao vivo às fontes. Algumas camadas têm ciclo planejado mensal e o índice municipal, trimestral; isso não garante que a fonte publique dados nessa frequência. O GTFS está fixado em uma versão separada.

## 1. Dados em uso ou ligados a fluxos existentes

| Conjunto | Tempo e atualização | Espaço e granularidade | Qualidade e limitações conhecidas | Uso atual |
|---|---|---|---|---|
| **Cadastro municipal de lotes, edifícios e bairros:** DSQFL, geometrias, nomes cadastrais, pavimentos e relações entre imóvel, lote e edifício. O manifesto registra 114.079 lotes. | Snapshot municipal; extração Hub documentada em 15/11/2026. Nova publicação depende da Prefeitura. Índice e ciclo das camadas são etapas distintas. | Município do Recife; mapa oficial com 94 bairros. Índice do app: 72 bairros e 7.206 edifícios; seis áreas habilitadas: 2.825 edifícios. | DSQFL é a chave cadastral principal, mas endereço, lote, torre e unidade podem não coincidir. Geometria do lote não confirma entrada física ou apartamento. Correspondências ambíguas são mantidas como alternativas. | Espinha dorsal para localizar edifícios e ligar fontes. Não presume lote = edifício = apartamento. |
| **IPTU:** atributos cadastrais/fiscais, incluindo área, ano, uso, padrão, valor fiscal e identificadores. | Exercício de 2026. Arquivo bruto Hub: 422.910 linhas; manifesto do processamento do índice: 413.750 registros lidos. São contagens de estágios/extratos diferentes. | Recife; registro fiscal associado a inscrição/lote conforme arquivo. | Contém CPF/CNPJ mascarados em parte dos dados. Não descreve planta, conservação ou preço de mercado. Contagem de linhas não comprova cobertura ou exatidão. | Atributos cadastrais no índice e contexto do imóvel. Valor fiscal não é preço anunciado nem preço de venda. |
| **ITBI:** endereço/complemento, tipo e valor de avaliação fiscal de transmissões. | Série processada 2016–2026: 144.576 registros; arquivo Hub de 2026: 15.078 linhas. Atualização após nova publicação. | Recife, por endereço/imóvel declarado; não há identificador estável da unidade residencial. | Arquivo não apresenta valor declarado de venda que permita tratá-lo como preço de mercado. Complemento pode ajudar a identificar unidade e também expor detalhes. Endereços exigem normalização. | Referência fiscal agrupada. Há quartis para 1.319 edifícios e 630 passam a regra documentada de tipologia homogênea. Não é comparável automático nem recomendação de preço. |
| **Licenciamento urbanístico:** requerimentos, datas, categorias de obra/licença e vínculo cadastral. | Bruto Hub: 118.607 linhas; índice processado: 39.067 registros filtrados para categoria Obra. Snapshot sem histórico completo de status. | Recife, por requerimento/endereço e DSQFL quando disponível; DSQFL preenchido em 117.754 linhas do bruto. | Data de entrada preenchida em 118.607; conclusão em 115.837; emissão de licença em 36.562; validade em 36.255. Preenchimento não garante correção ou vigência. Extração pontual não registra transições de status. Inclui CNPJ e razão social. | Contextualiza processos/obras próximos. Não prova início, conclusão ou validade atual sem confirmação da semântica e do estado. |
| **Solicitações EMLURB/156:** chamados de serviços urbanos, inclusive iluminação, drenagem e conservação. | Recurso de 2026: 61.225 linhas, registros até 19/06/2026, com datas desde 2009. Camada documentada seleciona 20/06/2025–19/06/2026 e totaliza 175.878 linhas a partir de recursos selecionados. Recursos de 2025 repetem-se com 86.966 e 114.653 linhas e hashes diferentes; não somar como conjuntos únicos. Ciclo planejado mensal, dependente de publicação. | Recife; endereço ou coordenada. No CSV 2026, coordenadas em 30.981/61.225 linhas (50,6%). Precisão posicional não auditada. | Chamado não prova dano, reparo ou condição atual. Há recursos duplicados/republicados; data pode refletir protocolo ou atualização administrativa. Sem coordenada não significa sem problema. | Sinal histórico/contextual por rua e em camadas de rua/noite. Não prova que ponto esteja hoje apagado, alagado ou sem manutenção. |
| **Defesa Civil: alagamentos e imóveis alagados.** | Recursos locais de 2014–2024: 886.263 linhas lidas. 2024: 80.173 linhas; três recursos rotulados como 2025 tinham uma linha cada. Subconjunto de alagamentos: 1.645 registros agrupados em 763 observações e 31 episódios. | Recife; imóvel, endereço, rua ou bairro. 394 observações de rua; 175 associadas a logradouro oficial. 182 registros/trechos ligados à rede caminhável; 176 sem correspondência ou ambíguos. | 726 registros tinham dia exato e 919 apenas o ano. Data administrativa não necessariamente indica quando começou/baixou a água. Relato não informa profundidade, duração, fechamento de passagem ou risco atual. | Contexto histórico e bloco experimental de chuva. VE17 achou 173 consequências de rota derivadas de quatro associações, 147 por um registro. As 38 revisões G-RAIN estão pendentes; revisar antes de apresentar como impacto de rota. Não é previsão de enchente nem prova de calçada fechada. |
| **GTFS de transporte público:** horários, viagens, paradas e calendários programados. | Versão fixada v2026.10.26, com SHA-256; validade até 26/10/2027. Atualização manual, fora da rotina principal de camadas por edifício. | Paradas do Recife e serviços que as atendem. Estudo verificou 2.822 paradas de Recife. App associa rede/paradas às áreas habilitadas; não há cobertura imobiliária RMR demonstrada. | 87.678 viagens, 1.216 padrões de parada e 8.417 perfis de horário; 0 viagens descartadas. 2.791/2.822 paradas a até 40 m de via oficial (mediana 7 m); 5.376/7.208 ligadas ao grafo. Checagem independente: 20/20 itinerários amostrados conferidos contra o feed. É horário programado; não há atrasos, cancelamentos ou posição em tempo real. | Cenários de caminhada, espera e viagens previstas por dia/faixa horária e bloco noturno. Não prova que o veículo operou, chegou no horário ou tinha vaga. |
| **Rede caminhável do OpenStreetMap (OSM):** ruas e caminhos com tags de acesso, conectividade e barreiras. | Extrato Geofabrik nordeste-261113.osm.pbf, dados até 13/11/2026. Atualização exige nova extração, processamento e publicação. | Recife mais margem aproximada de 1,5 km. Origem: 1,63 milhão de nós e 55.239 vias/caminhos; grafo processado: 273.529 nós e 300.703 arestas. | Componente principal contém 98,2% dos nós; 1.731 vias excluídas por regras de acesso e 255 segmentos marcados como barreiras. Vínculo forte em 2.516/2.688 edifícios piloto (93,6%) e 127/137 Torre (92,7%). Fachadas são candidatas, não entradas confirmadas. Sem modelo confiável de calçada contínua, rampa, piso tátil ou rota sem degraus. | Menor caminho a pé entre fachada candidata, destinos e paradas. Não sustenta alegação de acessibilidade ou segurança. OSM exige atribuição e cuidados da ODbL. |
| **Destinos cotidianos, parques e transporte:** dados municipais e OSM reconciliados com paradas GTFS. | Snapshot no ciclo de aplicação; revisão/atualização quando fontes mudam e o ciclo é executado. | Camadas por edifício nas seis áreas habilitadas; fontes originais têm cobertura desigual. | 7.748 candidatos viraram 7.272 locais canônicos; 476 fusões; 335 locais com mais de uma fonte; 7.241 ligados à rede. Contagens mapeadas no piloto: 48 mercearias, 53 farmácias, 90 praças/parques e 221 paradas. Horário em texto para 58 mercearias, 23 farmácias e 24 parques. São contagens mapeadas, não completude. 44 revisões G-POI pendentes. | Busca do que há a pé a partir da entrada e plano B de rota em alguns cenários. Não garante completude, abertura, estoque ou acesso. |
| **CNEFE e Censo 2022 (IBGE):** endereços, tipos de estabelecimento e indicadores censitários agregados. | Referência de 2022; próxima atualização depende do IBGE/ciclo censitário. | CNEFE Recife: 737.511 registros. Censo de entorno urbanístico: 5.637 setores; amostra/renda: 2.885 áreas de ponderação, resolução mais agregada que lote. | Coordenadas originais e geocodificadas devem manter proveniência. Categoria não prova que estabelecimento esteja aberto. Renda é estatística territorial, não atributo de apartamento/morador. Requer atribuição ao IBGE. | Associação geográfica e sinais agregados de serviço/fricção; nomes pessoais de estabelecimentos não são divulgados. Não tratar como característica individual do imóvel. |
| **Iluminação pública:** pontos de luminária e chamados de lâmpada apagada. | Cadastro com 111.666 pontos; solicitações noturnas incluem 14.571 de 30/01/2025 a 30/01/2026. Atualização após nova publicação. | Pontos/chamados no Recife; precisão varia por arquivo. | Título do cadastro diz “pontos desativados”; funcionamento atual não confirmado. Chamado não prova reparo ou estado hoje. | Contexto noturno junto com transporte, chamados e sinistros. Não significa “rua iluminada hoje” nem nota de segurança. |
| **CTTU: ocorrências de trânsito e vítimas.** | 2022: 2.669; 2023: 4.032; 2024: 5.315; total 12.016 linhas. | Recife, em geral com endereço/interseção textual; arquivo 2024 sem coordenadas. | 671 identificadas como envolvendo pedestre; 577 ligações usadas no estudo noturno. Campo acidente_verificado vazio nas 5.315 linhas de 2024. Ocorrências não formam taxa de risco completa; hora do dia não é confiável em todos. | Contexto de mobilidade noturna; não é pontuação de segurança nem previsão de acidente/assalto. |
| **LUSE e sinais de ruído:** licenças/atividades potencialmente ruidosas. | 49.924 linhas no manifesto, período não informado; atualização quando houver nova publicação. | Recife; proximidade de edifício (regras documentadas: licença até 150 m, via principal até 80 m). | Licença não mede dB, horário real ou funcionamento. Em 439.905 empresas ativas, o campo incomodo é N em todas as linhas; não indica ausência de ruído. | Contexto de fontes potenciais; não afirma nível sonoro ou duração do incômodo. |
| **Sol, sombra e ambiente:** geometria de edifícios/lotes e orientação solar; fontes climáticas/vegetais em escala ampla. | Datas variam por imagem/grade nos artefatos. Atualiza quando a fonte é republicada e o pacote é refeito. | Cálculos por edifício nas seis áreas; grades de clima têm resolução maior que um cômodo. | Estimativa geométrica não vê com precisão árvores do lote, marquises e interiores. Sombra na rota foi rejeitada: apenas 6/80 casos tiveram benefício estável (1–3,6 min), sem cobertura de copa adequada. Não mede temperatura interna nem ventilação. | Apoia descrição de orientação/exposição de fachada. Sombra de rota não é benefício validado; calor é contexto urbano, não medição do apartamento. |
| **Histórico e documentos fornecidos pelo usuário:** anotações, visitas, preço salvo, fotos, laudos, atas, contas e convenções. | Período começa quando usuário registra/importa. | Unidade/edifício escolhidos pelo usuário; documento pode ser específico do apartamento. | Qualidade depende de autoria, data e revisão. Não é base pública. Endereço, fotos e documentos são privados. | Contexto mais específico da visita, preço visto pelo usuário e documentos. Não se presume permissão para enviar dados privados a logs ou serviços externos. |
| **Internet e custos pessoais:** teste por cômodo, tarifa e despesas informadas. | Teste/conta vale na data de medição, sem histórico automático. | Apartamento/cômodo; tarifa regulada pode ser contexto nacional, disponibilidade é por endereço/contrato. | Mapa de cobertura não prova velocidade dentro do imóvel; um teste não prova estabilidade. Conta não prevê consumo futuro. | Verificação de internet é manual no endereço e por cômodo; despesas dependem de conta ou entrada do usuário. |

## 2. Dados públicos extraídos ou disponíveis para aproveitamento

A extração do Hub Municipal de 15/11/2026 reúne 29 recursos principais e 42 complementares (71 arquivos/recursos, incluindo dicionários e duplicatas; não são 71 conjuntos independentes). Os brutos ficam no cache .cache/dados-recife/hub-2026-11-15, ignorado pelo Git. Manifestos registram origem e hashes, mas um clone limpo pode não conter os brutos. A extração declara ODbL para recursos municipais; conferir licença e atribuição por recurso antes de republicar. Ver [manifesto](../aplicacao/manifesto-extracao-hub-2026-11-15.json) e [relatório](../aplicacao/extracao-hub-2026-11-15.md).

| Fonte/camada | Conteúdo e extensão documentados | Cobertura e condição de uso |
|---|---|---|
| **Ciclovias e rotas cicláveis** | 558 feições permanentes GeoJSON, 79 feições Conecta e 7 operacionais. | Cadastro do Recife; bairro/percurso em parte dos recursos. Não há rede ciclável contínua validada. Tipo cadastrado não prova faixa utilizável hoje. Equipamentos podem aparecer como proximidades, mas não há rota ciclável validada no produto. |
| **Paraciclos e Bike PE** | 562 linhas CSV e 511 feições GeoJSON de paraciclos; o mesmo GeoJSON aparece em três recursos e não deve ser somado. 90 estações Bike PE. | Pontos cadastrados no Recife; cadastro não prova bicicleta/vaga ou operação atual. |
| **Calçadas, corredores e acessibilidade** | Calçadas 2023: 129 registros; corredores principais: 159; calçadas recuperadas de 2019: 40. | Trechos selecionados, não inventário de todas as rotas. Sem largura livre, rampas, piso, obstáculos, condição presente ou continuidade; não certifica acessibilidade. |
| **Macrodrenagem/eSIG** | 514 feições; 236 marcadas CONCLUÍDO. Em 21 dessas, campo de limpeza diz “NÃO FOI LIMPO”. | Semântica de data, program e statu_limp precisa confirmação. Não interpretar CONCLUÍDO isoladamente como obra/limpeza concluída. |
| **APAC: chuva recente** | 20 feições/estações e acumulados recentes. | Estação, não grade por rua nem série histórica horária; foram observados valores negativos e antigos. Pendentes semântica de hora/fuso/campos e licença. |
| **Empresas ativas/inativas** | 439.905 registros ativos e 421.722 inativos; incluem CNPJ e razão social. | Recife conforme cadastro/endereço. Status cadastral não prova funcionamento, acesso público ou horário. Campo incomodo é N em todas as linhas ativas. Nomes exigem revisão de privacidade. |
| **Equipamentos e semáforos** | 68 pontos culturais/lazer, 132 de saúde, 712 semáforos, 67 com indicação para deficiência visual; também corredores e unidades de conservação. | Cadastros do Recife, sem auditoria de funcionamento, manutenção, acessibilidade ou horário. Podem apoiar busca após validação. |
| **Outros arquivos em cache** | Pedidos CTTU 2015/2016: 17.023 e 9.869 linhas. Também há recursos de Censo, renda, árvores, relevo, GTFS e dengue. | Presença em cache não significa integração. Cada arquivo precisa de dicionário, data, licença, cobertura e inspeção de qualidade. |

## 3. Dados públicos que podem ampliar cobertura ou série

São possibilidades; cadência e disponibilidade futura não estão garantidas.

| Oportunidade | O que pode acrescentar | O que falta confirmar |
|---|---|---|
| **Novas publicações do Portal de Dados Abertos do Recife** | Atualizações de cadastro, chamados, obras, iluminação, calçadas, destinos, licenças e limites. | Monitorar republicação/esquema, separar atualização da fonte da data do evento, detectar duplicatas e conferir licença. Snapshot atual é 15/11/2026. |
| **IBGE: CNEFE, Censo e malhas** | Endereços, indicadores de população e entorno, conforme novas liberações. | Resolução censitária não é do apartamento; preservar atribuição, data e precisão. Geocodificação auxiliar deve ser marcada. |
| **OSM/Geofabrik** | Rede e destinos; novos recortes e versões podem expandir áreas avaliadas. | Cobertura/tags variam; requer revisão de conectividade, vínculos cadastrais e amostras. ODbL. |
| **GTFS público atualizado** | Novos calendários, linhas e serviços programados, se operador publicar. | Confirmar feed, vigência, licença e cobertura em cada ciclo; GTFS não mede pontualidade. |
| **Crime mensal por bairro** | Série oficial agregada por bairro poderia sustentar contexto temporal. Documentos locais identificam dados públicos por município/região/mês, não a série histórica desejada por bairro. | Pedido P12 não enviado. Coleta Crime Brasil em branch não é substituto pronto para produto. |
| **Chuva horária e eventos** | Série com horário/fuso e identificador estável ajudaria a relacionar relatos e eventos. | APAC atual não oferece a série histórica horária necessária; dado de sensor municipal analisado termina em 26/02/2026. P02/P13 não enviados. |
| **Extensão a outros bairros ou municípios da RMR** | Métodos podem ser avaliados em novas áreas, se cadastro, rede, transporte e destinos forem compatíveis. | RMR completa não foi demonstrada. Requer inventário/licenças por município, chaves locais e avaliação própria. Linha intermunicipal no GTFS não equivale a imóveis cobertos na RMR. |

### Crime no bairro: branch experimental fora de main

O pull encontrou a branch remota dados/crime-recife. A coleta via Crime Brasil/SDS-PE não está mesclada em main nem integrada ao app. O meta.json registra período móvel 11/2025–10/2026, páginas de 26 bairros-alvo/adjacentes, cerca de 9.418 ocorrências no conjunto descrito e ausência de Pau-Ferro. A página “Recife” agregada não tem janela comparável aos bairros. Registros são por bairro, sem rua/coordenada; há subnotificação e cerca de 4% sem bairro.

A página compilada indica CC BY 4.0 para a apresentação, mas a licença dos dados brutos SDS-PE não está declarada; os termos consultados não confirmam autorização para raspagem/redistribuição. Tratar como pesquisa exploratória até confirmar proveniência, direitos, janela e cobertura. Pedido oficial P12 ainda não foi enviado.

## 4. Fontes e serviços pagos avaliados, sem contratação confirmada

Triagem interna de 20/10/2026; não é cotação atual. Não há fornecedor contratado nem gasto registrado. Preço vigente, cobertura, direito de guardar e redistribuir devem ser confirmados por proposta/contrato.

| Fornecedor/serviço | Possível capacidade | A confirmar |
|---|---|---|
| **Google Maps Platform** | Geocodificação, lugares e rotas. | Preços/cotas atuais, cache/armazenamento, redistribuição, cobertura e classificação a pé em Recife. |
| **Mapbox** | Geocodificação, mapas e rotas. | Direitos de geocodificação temporária/permanente, retenção, custo e direito de combinar/publicar resultado. |
| **Geoapify** | Rotas a pé, POIs, isócronas e geocodificação. | Cota/preço, frescor e cobertura de POIs, cache, atribuição e redistribuição. |
| **Kenlo Open API** | Inventário/ofertas mediante acesso autorizado/parceria. | Contrato, cobertura Recife, IDs estáveis, datas/remoções, duplicatas e licença para comparáveis. |
| **DataZAP, Loft Dados e Geobrain** | Dados/estudos de mercado imobiliário, possivelmente API. | Cotação atual, granularidade, metodologia, amostra, origem e direitos de exibição/armazenamento. Sem feed autorizado confirmado. |
| **Google Document AI** | OCR de laudos, atas e documentos enviados pelo usuário. | Preço, região de processamento, retenção, consentimento, segurança e precisão. É processamento, não uma base. |
| **Open-Meteo para uso comercial** | Dados/previsão meteorológica conforme plano. | Termos/preço, fonte, resolução, histórico e redistribuição. Não substitui sensor local nem mede o apartamento. |

Referência: [triagem de APIs e fornecedores de 20/10/2026](../../ignorar/produto-historico/2026-10-20/03-APIS-E-FORNECEDORES.md). Preços antigos não foram apresentados como atuais. Raspagem de anúncios de portais não é autorizada pelos materiais consultados.

## 5. Dados difíceis de obter ou insuficientes nas fontes atuais

Há 17 pedidos de acesso à informação preparados — 11 para Recife, 5 para Pernambuco e 1 para CNJ — e **nenhum foi enviado**. Códigos P remetem a [pedidos LAI preparados](../aplicacao/pedidos-lai-recife.md).

| Lacuna | Por que é difícil | Dado necessário e situação |
|---|---|---|
| **Fechamentos/reaberturas durante chuva** | Chamado/alagamento não informa início/fim de bloqueio por modal; água na rua não prova que pedestre ficou sem passagem. | P01: CTTU desde 2022, início, reabertura e modo; P02: chuva/evento com hora e fuso. Preparado, não enviado. |
| **Vistorias, interdições e desinterdições de imóveis** | Relato não é laudo; exportação Defesa Civil recente tem só uma linha nos recursos 2025. | P03/P06: inspeção, decisão, data e status com ID protegido. Preparado, não enviado. |
| **Chuva horária, nível e maré** | APAC tem acumulados recentes, leituras negativas/antigas e semântica pendente; pareamento temporal é incerto. | P02/P13: estação, identificador, timestamp/fuso, chuva horária e controle de qualidade. Discrepância de 3h entre IDUNICO e DATAHORA em 7.807/7.808 linhas. Não enviado. |
| **Execução e semântica das obras de drenagem** | Conflito eSIG entre CONCLUÍDO e NÃO FOI LIMPO; geometria não comprova execução ou efeito. | P04: dicionário, histórico de limpeza/obra, datas e fiscalização. Não enviado. |
| **Histórico de licenças e habite-se** | Snapshot não preserva transições nem prova status vigente. | P05: histórico de status, datas, licença, certificado e DSQFL. Não enviado. |
| **Preço declarado e vínculo da unidade** | ITBI expõe avaliação fiscal, não valor declarado; não há ID estável da unidade. | P07: valor declarado e chave protegida; P17: serviço/registros CNJ/ONR. Preparado, não enviado. |
| **Ofertas comparáveis com histórico de alteração/retirada** | Sem feed contratado; histórico atual é de anúncios vistos/importados pelo usuário. Raspagem não autorizada. | Contrato/API com origem, ID, preço, área, tipologia, datas e direitos. VE10 adiou comparáveis; sem feed confirmado. |
| **Criminalidade oficial mensal por bairro** | Abertos identificados são agregados por município/região/mês. Captura experimental tem licença bruta incerta e janela curta. | P12: série por bairro, mês, categoria e metodologia, idealmente desde jan/2014. Preparado, não enviado. |
| **Pontualidade e viagens executadas** | GTFS informa horário previsto, não veículo observado, atraso ou cancelamento. | P15: AVL/GTFS-RT ou log de viagens reais e previstas. Não enviado. |
| **Calçadas utilizáveis e acessibilidade contínua** | Trechos pontuais não cobrem todas as rotas; falta largura, rampa, obstáculo, piso e condição atual. | P09 e levantamentos: largura útil, travessias, rampas e semáforos sonoros. App não certifica acessibilidade. |
| **Estado atual de luminárias/reparos** | Cadastro “pontos desativados” e chamados não provam estado ou conserto; recursos 156 duplicados. | P10: estado com data, histórico de reparo e definição/duplicatas 156. Não enviado. |
| **Ruído medido e horários** | Licença não mede dB; atividade cadastrada não prova horário; campo incomodo sem sinal útil. | P11: horários/reclamações e sensores calibrados co-localizados. Sem dB no produto. |
| **Altura/copa de árvores e sombra** | Apenas cerca de 4% têm copa/altura preenchidas; muitos registros de 2007. Imagem não mede sombra no passeio em cada hora. | P08: inventário georreferenciado datado e validação de campo/imagem. Rota sombreada rejeitada. |
| **Falta d’água por setor** | Não foi encontrada série temporal georreferenciada pronta. | P14: Compesa, setor, início/fim, causa e imóveis afetados, preservando privacidade. Não enviado. |
| **Áreas contaminadas** | Cadastro pode depender de vistoria/licença ambiental e geometria pública consolidada não foi encontrada. | P16: CPRH, polígonos, substância, situação, datas e remediação. Não enviado. |
| **Internet dentro do apartamento** | Cobertura da operadora/endereço não prova última milha nem qualidade em cada cômodo. | Consulta por endereço e teste presencial por cômodo/horário. Processo manual. |
| **Conforto ambiental interno** | Grade meteorológica/satélite não resolve apartamento; andar, fachada, ventilação e sombra variam. | Sensores calibrados dentro/fora e protocolo temporal, ou inspeção técnica. Sem medição local integrada. |

## 6. Como as fontes se combinam hoje

| Fluxo/pergunta | Fontes combinadas | Resposta possível e limite |
|---|---|---|
| **Qual é este edifício?** | Cadastro municipal, lote, DSQFL, bairro, OSM e revisão de correspondência. | Localiza cadastro e liga camadas quando vínculo passa regra de confiança. Não confirma torre, entrada, apartamento ou complemento do anúncio. |
| **O que existe a pé?** | Fachada candidata, grafo OSM, destinos municipais/OSM e GTFS. | Distâncias e rotas pela rede, locais próximos e opções de transporte. Fachada pode não ser entrada; completude, abertura, estoque e acessibilidade não são garantidos. |
| **Como seria um deslocamento numa faixa horária?** | Caminhada OSM, GTFS fixado e calendário. | Cenário programado de caminhada/espera/viagem. Não mostra atraso, lotação, cancelamento, tarifa atual ou conexão real. |
| **Há histórico de alagamento perto do caminho?** | Defesa Civil, 156, nomes de vias e rede. | Relatos históricos e consequências condicionais quando há associação. Parte só tem ano; revisão pendente; não prevê enchente nem comprova fechamento. |
| **Que sinais existem à noite?** | GTFS, cadastro de iluminação, 156, CTTU e LUSE. | Reúne contexto para orientar verificação. Não produz nota de criminalidade, segurança, ruído ou iluminação atual. |
| **Que atributos/histórico financeiro há?** | IPTU, ITBI fiscal, anúncios importados e histórico/documentos do usuário. | Contexto cadastral/fiscal e histórico pessoal disponível. Não substitui transação, comparáveis licenciados ou avaliação técnica. |
| **Como são sol, calor e internet?** | Geometria solar, clima amplo, fontes cadastrais e testes/documentos do usuário. | Contexto e perguntas para visita. Conforto interno, sombra, internet e ruído requerem medição local/temporal não disponível em escala suficiente. |

## 7. Qualidade, atualização e governança

- O processo documentado prevê snapshot, hash, validação de esquema, normalização, vínculo espacial, revisão amostral e publicação de versão/manifesto. Encontrar/baixar dado não significa integrá-lo.
- Camadas por edifício usam o ciclo local scripts/dados/ciclo.mjs; há backup/rollback testado. Documentos citam ciclo mensal para algumas camadas e trimestral para o índice municipal. O GTFS segue fixado separadamente.
- Não há agendador global. Cadência planejada das rotinas não é cadência garantida de publicação da fonte.
- Cache bruto do Hub é ignorado pelo Git. Manifesto/hash rastreia a extração, mas não basta para reproduzir processamento sem os arquivos ou novo download.
- Qualidade varia por fonte. Métricas nas tabelas são de arquivo/avaliação citados e não substituem visita ou auditoria de campo.
- Há **259 linhas de revisão humana pendentes** e zero minutos de revisão registrados. G-BUILDING, G-POI, G-RAIN e subconjuntos de transporte ainda precisam de revisão. Checagem automática de rota não é validação por morador.
- Tracker registra 40 aplicações/capacidades, nenhuma validada com cliente/participante até VE17. Status de engenharia não equivale a adoção ou satisfação.
- Manter separados: data do evento/protocolo/publicação/extração/observação; localização e precisão; zero e ausência; chamado e serviço realizado. Ver [arquitetura e dados](../plano-recife/03-ARQUITETURA-E-DADOS.md).

## Referências internas

- [Plano da aplicação](../aplicacao/VEREDA-APPLICATION-PLAN.md)
- [Registro de funcionalidades e cadências](../aplicacao/FEATURE-REGISTER.md)
- [Tracker de épocas e validação](../aplicacao/EPOCH-TRACKER.md)
- [Runbook de atualização](../aplicacao/RUNBOOK-ATUALIZACAO.md)
- [Pedidos LAI preparados](../aplicacao/pedidos-lai-recife.md)
- [Pesquisa do Hub](../aplicacao/pesquisa-hub-dados-recife-2026-11-15.md)
- [Manifestos e extração do Hub](../aplicacao/manifesto-extracao-hub-2026-11-15.json)
- [Manifesto complementar](../aplicacao/manifesto-extracao-complementar-2026-11-15.json)
- [Rede caminhável, VE03](../aplicacao/execucoes/VE03/evaluation.md)
- [Destinos a pé, VE04](../aplicacao/execucoes/VE04/evaluation.md)
- [GTFS, VE05](../aplicacao/execucoes/VE05/evaluation.md)
- [Alagamentos, VE06](../aplicacao/execucoes/VE06/evaluation.md)
- [Bloco noturno, VE08](../aplicacao/execucoes/VE08/evaluation.md)
- [Comparáveis, VE10](../aplicacao/execucoes/VE10/evaluation.md)
- [Auditoria, VE17](../aplicacao/execucoes/VE17/auditoria.md)

## Escopo e atribuição

Este inventário foi consolidado dos documentos, manifestos e avaliações do repositório, com main atualizada. A conferência do Linear em 17/11/2026 autenticou Artur Mac no workspace afsdfsdfds; não encontrou projetos cadastrados e a lista de issues continha apenas quatro tarefas padrão de onboarding, todas sem responsável. Nenhuma issue atribuída à pessoa usuária, sobre fontes de dados ou ligada ao VEREDA apareceu nessa conexão. Os documentos internos do repositório identificam papéis, não uma atribuição individual consistente. O estado descrito representa evidência técnica do repositório, não uma lista de tarefas pessoais.

Não foram executados testes para produzir este documento.
