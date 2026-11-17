# 09 — Decisões, fontes e limites da consolidação

**Data: 21/10/2026.** Este pacote é uma especificação de trabalho, não relatório de implementação das 80 capacidades. Fontes internas descrevem ideias e resultados históricos; consulta a documentação externa não comprova acesso autenticado, preço contratado, cobertura de Recife ou teste de aparelho.

## Precedência

Pedido atual do usuário → instruções aplicáveis → este plano para a rodada ampla → contratos atuais confirmados por código/teste → documentos históricos como contexto. Se surgir conflito que envolva cobrança, envio externo, perda de dados ou ampliação de escopo, registrar decisão pendente e continuar unidades independentes. Não usar precedência para remover requisito importante sem justificativa.

| Tema em documentos anteriores | Decisão desta consolidação |
|---|---|
| MVP pequeno antes de qualquer ampliação | Versão ampla deliberada, com crivo técnico; público e utilidade investigados em paralelo |
| Identidade Archivo/tema genérico ou bibliotecas alternativas | `index.html` raiz é a referência exclusiva; tokens/componentes atuais precisam ser reconciliados com ele |
| “Tudo implementado”, TRL elevado e demonstração de sensores | Estado é verificado no checkout/aparelho; simulação não é entrega de campo |
| 99,9% de pontos dentro do polígono | Métrica geométrica não mede probabilidade de prédio corretamente identificado |
| ITBI como preço de mercado por m² | Valor fiscal por unidade compatível; sem dividir por área que inclui partes comuns |
| A Rua como recurso futuro | Já há implementação; ampliar/reconciliar camadas e cobertura |
| Prédio-caixão inferido por idade/pavimentos | Não produzir diagnóstico; solicitar sistema estrutural e documentação técnica |
| GPS prova presença; celular mede dB certificado; sol prevê gasto exato | Observações e medições limitadas; metodologia/calibração/capacidade explícitas |
| Todos os dados em índice estático / FastAPI e PostGIS obrigatórios | Índice público particionado; documentos, sensores, sincronização e pagamento têm contratos próprios; stack atual preservada |
| Recompensa por confirmar prédio | Não mudar regra de créditos; confirmação deliberada com cobrança única vigente |
| Nunca mostrar um total | Mensal conhecido é útil; separar ausências, hipóteses, aquisição e desembolso inicial |
| Dados fictícios sem avisos no pitch | Autorização restrita ao pitch; não vale para fatos do produto real |
| Cronogramas/preços de fornecedores históricos | Não são compromisso desta rodada; rever condições na unidade de integração |
| Pesquisa como comprovação definitiva de demanda | Hipóteses e resultados internos declarados precisam de rastreabilidade primária; não bloqueiam construção global |

## Inventário documental usado

As siglas do catálogo apontam para os conjuntos abaixo. A matriz F01–F80 faz o vínculo funcional; ideias incompatíveis têm destino X01–X08, não desaparecem silenciosamente.

| Origem | Documentos | Contribuição e tratamento |
|---|---|---|
| H | [Master Spec](../VEREDA_DOCUMENTO_DEFINITIVO.md), [plano POC](../PLANO-POC-EXECUCAO.md), [V1](../V1-ESCOPO-E-VIABILIDADE.md), [UI/UX histórico](../ui-ux.md) | Inventário amplo: entrada, identidade, orçamento, sensores, dados territoriais, comunidade e negócio; conflitos resolvidos acima |
| O | [Ordem do arquiteto](../handoff/ORDEM_DO_ARQUITETO.md) | Contratos de dados Recife, fiscal, indexação e experiência; conferir revisão mais recente e código |
| P | [Pacote de produto 20/10](../produto/2026-10-20/README.md) | PRD, dados, APIs, preços, estratégia, validação e governança |
| Q | [Pesquisa verificada 20/10](../produto/pesquisa-2026-10-20/README.md) | Dados, fornecedores, concorrência, mercado/regulação, roadmap, estratégia, leitura de link e compartilhamento |
| M | [Melhorias 20/10](../produto/melhorias-2026-10-20/README.md), [execução lote A](../produto/melhorias-2026-10-20/06-EXECUCAO-LOTE-A.md) | Diagnóstico, experiência, técnica, insights, T01/E01/E04 e evidência histórica |
| R | [Refinamento 21/10](../produto/refinamento-2026-10-21/README.md), [fontes/execução](../produto/refinamento-2026-10-21/06-FONTES-E-EXECUCAO.md) | CNEFE/CNPJ/GTFS, conectividade, engenharia, público, monetização, dependências, assinatura e EDA |
| Avaliação | [Avaliação crítica](../AVALIACAO_CRITICA_ESTADO_ATUAL_E_OPORTUNIDADES.md), [maturidade](../DOSSIE_MATURIDADE_ORIENTACAO_HACKATHON.md) | Lacunas e oportunidades; alegações de prontidão não substituem validação |
| Pesquisa interna | [Entrevistas](../ENTREVISTAS_QUALITATIVAS_5_CASOS.md), [UFPE 83](../PESQUISA_QUANTITATIVA_UFPE_83.md), [mercado Recife 83](../PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md) | Insumo de hipótese, com inconsistências de proveniência a resolver |

Nos dois documentos quantitativos há divergências em datas/recrutamento e percentuais: utilidade 92,8% versus 89,2%; colaboração 89,2% versus 78,3%. Os relatos qualitativos também variam em descrição de participante/valores entre documentos. Não foram autenticadas respostas brutas, gravações ou exportação do instrumento nesta consolidação. Classificação: **resultados declarados em documentos internos, sem autenticação primária nesta revisão**. Isso não demonstra falsidade; impede tratá-los como comprovação auditada. EP00.03 e EP14.01 verificam origem, amostra de conveniência e perguntas potencialmente sugestivas.

## Código e baseline observados

- Contrato principal: `src/dados/contratos.ts` (`AnaliseV2` estrito); estado serializado e leitura/recuperação em `src/estado/Analises.tsx` e `armazenamento.ts`.
- Dossiê com Destaques/Entorno/Edifício e quatro áreas principais. Extrator, leitor visível, compartilhamento, caderno, custos e comparação já existem em graus diferentes de prontidão.
- Índice local de cinco bairros, 2.688 prédios no conjunto analisado anteriormente e aproximadamente 2,81 MB nos JSONs de partições; isso não é tamanho total do app. A EDA registrada usa 737.511 registros CNEFE minimizados. Esses números pertencem aos hashes da análise, não garantem o próximo checkout.
- `NV_GEO_COORD` está no cache examinado e precisa ser preservado no caminho de normalização/publicação. Camadas de A Rua têm janelas diferentes; não recebem rótulo coletivo “atual”.
- Expo Network/Cellular não estavam instalados no baseline lido; documentação da API não equivale a capacidade entregue. Revalidar dependências no início da época correspondente.

O registro do lote A e o pacote R00 mantêm seus próprios testes. Não transferimos seus resultados para esta rodada documental. Mudanças de código preexistentes no checkout foram preservadas e não são atribuídas a este plano.

## Fontes externas e nível de verificação

As fontes detalhadas, tentativas de acesso e limitações da pesquisa anterior estão no [registro R](../produto/refinamento-2026-10-21/06-FONTES-E-EXECUCAO.md). Nesta consolidação foram reabertas as referências GTFS, Expo Cellular 57 e Mapbox Geocoding; a página Expo FileSystem não retornou conteúdo útil pela ferramenta. Não se verificou API autenticada ou feed local novo.

| Fonte primária | Uso técnico no plano | Limite |
|---|---|---|
| [IBGE CNEFE](https://www.ibge.gov.br/estatisticas/sociais/populacao/38734-cadastro-nacional-de-enderecos-para-finsestatisticos.html) e [arquivos](https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/) | Endereços, usos amplos e qualidade de coordenadas | Conferir dicionário original; referência censitária não prova uso atual |
| [IBGE entorno](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/tipologias-do-territorio/24702-caracteristicas-urbanisticas-do-entorno-dos-domicilios.html?lang=pt-BR) | Infraestrutura urbanística em produto próprio | Não atribuir toda variável à porta sem chave/escala compatível |
| [Receita — metadados](https://www.gov.br/receitafederal/dados/cnpj-metadados.pdf) e [dados abertos](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/cadastros) | Estabelecimentos/CNAE/endereço | Geocodificação é etapa adicional; layout precisa revisão de versão |
| [Receita — CNPJ alfanumérico](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/julho/receita-federal-gera-o-primeiro-cnpj-em-formato-alfanumerico) | Identificador textual que preserva letras e zeros | Validar regras oficiais atuais no parser |
| [GTFS Schedule](https://gtfs.org/documentation/schedule/reference/) | Calendário, exceções, frequências e horários após 24h | Feed Grande Recife, vigência e licença permanecem por comprovar |
| [CTTU equipamentos](https://dados.recife.pe.gov.br/dataset/equipamentos-de-monitoramento-e-fiscalizacao-de-transito) | Infraestrutura viária | Não mede fluxo/ruído de cada janela |
| [OSM licença](https://www.openstreetmap.org/copyright) e [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) | Direito/atribuição e limites do serviço público | Não é infraestrutura gratuita ilimitada |
| [Crea-PE ART](https://creape.org.br/art) e [CAU autenticidade](https://transparencia.caubr.gov.br/cartadeservicos1-3/) | Caminho de verificação documental | Não foi consultada inspeção real; registro não certifica segurança |
| [Android WifiInfo](https://developer.android.com/reference/android/net/wifi/WifiInfo) e [Apple fetchCurrent](https://developer.apple.com/documentation/networkextension/nehotspotnetwork/fetchcurrent%28completionhandler%3A%29) | Capacidades distintas de Wi-Fi | Exigem APIs/permissões/build/aparelho; campos não são equivalentes |
| [Expo 57 Cellular](https://docs.expo.dev/versions/v57.0.0/sdk/cellular/) e [Network](https://docs.expo.dev/versions/v57.0.0/sdk/network/) | Adaptadores candidatos compatíveis com baseline | Nenhum pacote instalado ou sensor medido nesta consolidação |
| [MDN effectiveType](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType) | Limite da estimativa web | Não identifica rádio 5G |
| [Anatel cobertura](https://www.gov.br/anatel/pt-br/dados/qualidade/qualidade-dos-servicos/cobertura-da-telefonia-movel) | Contexto de cobertura prevista | Não garante recepção interna |
| [Serpro Consulta CNPJ](https://apicenter.estaleiro.serpro.gov.br/documentacao/consulta-cnpj/) | Consulta por identificador | Preço atual/acesso não comprovados; não é descoberta geográfica universal |
| [Mapbox Geocoding](https://docs.mapbox.com/api/search/geocoding/) | Temporário versus permanente, escopo v6 | Restrições de armazenamento; v6 não inclui POI; sem chave ou contratação |

APAC, Cemaden, SGB, CNES, INEP, ANEEL, ONR, fornecedores judiciais e demais fontes históricas têm investigação/integração atribuída nas épocas. Não foram todas reconsultadas nesta consolidação; a operária deve verificar fonte primária, acesso, licença e cobertura antes de habilitar. PLO de inspeção encontrado em pesquisa anterior não foi tratado como lei vigente. Nenhum prazo de inspeção obrigatório foi inventado neste plano.

## Critérios propostos versus fatos

Limites de arquivo, metas de desempenho, amostra de 150 associações, meta de 95%, limiar comunitário de cinco contribuições, 5–8 sessões por segmento e orçamento do teste de velocidade são **decisões iniciais de engenharia/pesquisa**, não normas externas nem garantias estatísticas. Podem mudar por decisão registrada e evidência; não podem virar probabilidade individual ou promessa comercial.

Preços de venda e tarifas de APIs permanecem hipóteses/cotações a atualizar. A época 13 fornece método de decisão econômica, sem contratar ou alterar pagamento. Legislação/tributos/tarifas exigem consulta vigente e revisão de aplicabilidade na implementação.

## Registro desta entrega documental

- Criados catálogo F01–F80, 15 épocas, contratos de experiência/dados, unidades de execução, critérios de qualidade e prompt reutilizável.
- Históricos e diagnósticos preservados. O README raiz recebe apenas apontamento para este plano; não se apresenta o histórico como auditoria da versão futura.
- Consultada a skill local de [UI/UX](../../.agents/skills/ui-ux-pro-max/SKILL.md), com foco em continuidade de navegação e acessibilidade; a identidade continua determinada pelo usuário/protótipo.
- Verificação estrutural do pacote: links locais, IDs únicos, cobertura de capacidades por época, blocos de código e integridade de diff; resultado em [evidências](evidencias/validacao.json), após execução do validador.
- A conferência original passou com 10 documentos, 80 capacidades, 15 épocas e 57 unidades. O [adendo 1.1](10-CNPJ-E-OCORRENCIAS-DO-EDIFICIO.md) acrescenta a especialização de CNPJ/ocorrências, mantendo capacidades e unidades. Contagens e resultado estrutural atualizado estão no JSON de evidências. Reproduzir com `python3 docs/plano-recife/evidencias/validar_plano.py`; a validação é documental, não comprovação das funcionalidades propostas.
- **Não executados nesta rodada documental:** testes do app, smoke, novas capturas de interface, teste nativo, validação de sensor, download/ingestão de novas bases, entrevistas, consulta autenticada, contratação ou deploy. São atividades das épocas de execução, não resultados presumidos deste plano.

Este plano resolve a ordem e os contratos da construção; integração pronta depende da evidência exigida em cada unidade. Não inicia a época 00 automaticamente.
