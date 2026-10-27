# Registro de fontes e limites da pesquisa

**Data de consulta:** 20/10/2026 · **Método:** leitura de documentação e páginas oficiais via pesquisa web; inspeção de documentos locais. Sem entrevistas novas ou testes de APIs autenticadas.

## 1. Fontes externas utilizadas

| ID | Fonte direta | O que sustenta | Limite da verificação |
|---|---|---|---|
| S01 | [Catálogo Recife](https://dados.recife.pe.gov.br/dataset) | Existência do portal municipal | Buscas específicas de IPTU/lotes falharam no acesso web |
| S02 | [ITBI Recife](https://dados.recife.pe.gov.br/sl/dataset/imposto-sobre-transmissao-de-bens-imoveis-itbi) | Arquivos anuais, descrição e ODbL | Página retornada em interface multilíngue; não auditadas linhas |
| S03 | [Licenciamento Recife](https://dados.recife.pe.gov.br/dataset/licenciamento-urbanistico) | CSV, dicionário, cobertura apenas digital, ODbL | Publicação diária declarada não comprova atualização de cada processo |
| S04 | [IBGE API v3](https://servicodados.ibge.gov.br/api/docs/agregados?versao=3) | Metadados, períodos, localidades e variáveis | Não selecionada tabela para tamanho de mercado |
| S05 | [Censo 2022 — publicação](https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102071.pdf) | Agregados por setores censitários | Publicação localizada; bases não processadas |
| S06 | [SGB Recife](https://rigeo.sgb.gov.br/handle/doc/15030) | Produto de 2015, mapa e arquivos SIG | Sem download, validação de escala ou cruzamento espacial |
| S07 | [Compesa GISCOMP](https://servicos.compesa.com.br/giscomp/) | Aplicação de calendário de abastecimento | API pública e licença de redistribuição não confirmadas |
| S08 | [Anatel — cobertura](https://www.gov.br/anatel/pt-br/dados/qualidade/qualidade-dos-servicos/cobertura-da-telefonia-movel) | Cobertura modelada e fatores que afetam sinal | Não mede interior de apartamento |
| S09 | [Anatel — dados abertos](https://www.gov.br/anatel/pt-br/dados/dados-abertos) | Catálogo e política de abertura | Nenhum arquivo integrado |
| S10 | [BCB — dados abertos](https://www.bcb.gov.br/acessoinformacao/dadosabertos) | Oferta de bases e séries | Não consultada taxa atual nem oferta de crédito |
| S11 | [Fipe — indicadores](https://www.fipe.org.br/pt-br/indices/) | Disponibilidade de índices imobiliários | Não levantado valor atual por bairro |
| S12 | [FipeZAP — metodologia](https://downloads.fipe.org.br/indices/fipezap/metodologia/FipeZAP_Metodologia_v20110216.pdf) | Natureza de preços anunciados | Documento metodológico histórico; não prova microdados disponíveis |
| S13 | [Google Maps — tarifas](https://developers.google.com/maps/billing-and-pricing/pricing) | Franquias e faixas por SKU | Precisa reconferir SKU, região contratual e tarifa na contratação |
| S14 | [Google Geocoding — políticas](https://developers.google.com/maps/documentation/geocoding/policies) | Armazenamento e apresentação | Contrato aplicável precisa ser considerado |
| S15 | [Mapbox — tarifas](https://www.mapbox.com/pricing) | Directions e geocoding temporário/permanente | Não inclui mapas, navegação ou extras na simulação |
| S16 | [Mapbox Directions — documentação](https://docs.mapbox.com/api/navigation/directions/) | Requisições, perfis e limites | Sem benchmark em Recife |
| S17 | [Geoapify — tarifas](https://www.geoapify.com/pricing/) | Franquia diária e planos mensais | Preço não demonstra qualidade local |
| S18 | [Geoapify — créditos](https://www.geoapify.com/pricing-details/) | Cobrança variável conforme operação | Precisa simular mistura real de chamadas |
| S19 | [Document AI — produto e tarifas](https://cloud.google.com/document-ai) | OCR e parsers com cobrança por páginas | Serviços auxiliares e interpretação cobrados à parte |
| S20 | [Open-Meteo — planos](https://open-meteo.com/en/pricing) | Separação entre uso gratuito não comercial e assinatura comercial | Valor monetário não confirmado no conteúdo recuperado |
| S21 | [Kenlo — integração](https://www.kenlo.com.br/integre-conosco) | Avaliação técnica/comercial e homologação | Não houve contato |
| S22 | [Kenlo Open API v2](https://kenlo-open-api-prd.kenlo.io/docs/v2.html) | API documentada e uso contratual por parceiros | Credencial, cobertura e preço não confirmados |
| S23 | [DataZAP](https://imoveis.grupoolx.com.br/datazap) | Oferta de inteligência imobiliária | API comercial para este caso não demonstrada |
| S24 | [Loft Dados](https://loft.com.br/para-imobiliarias/loft-dados/) | Solução de dados para imobiliárias | Não presumir API externa |
| S25 | [Geobrain](https://geobrain.com.br/) | Oferta de inteligência territorial e imobiliária | Cobertura contratável nos bairros não demonstrada |
| S26 | [Nominatim — política](https://operations.osmfoundation.org/policies/nominatim/) | Regras da instância pública | Não se aplica indistintamente a provedores próprios |
| S27 | [LGPD — texto oficial](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) | Princípios e governança de dados pessoais | Não substitui análise do tratamento concreto |

## 2. Documentos internos consultados

| Documento | Uso nesta entrega | Cuidado |
|---|---|---|
| [README do projeto](../../../README.md) | Visão e organização | Há desenvolvimento simultâneo |
| [Escopo v1](../../V1-ESCOPO-E-VIABILIDADE.md) | Cinco bairros, limites e verificações cadastrais | Resultados internos não repetidos |
| [Validação da POC](../../POC-VALIDACAO.md) | Estágio documentado de funcionalidades | Registro anterior ao trabalho simultâneo |
| [Avaliação crítica anterior](../../AVALIACAO_CRITICA_ESTADO_ATUAL_E_OPORTUNIDADES.md) | Levantar ideias e conflitos de interpretação | Alegações fortes não foram herdadas como fatos |
| [Pesquisa quantitativa](../../PESQUISA_QUANTITATIVA_UFPE_83.md) | Perguntas e hipóteses de usuário | Respostas brutas e representatividade não auditadas |
| Script `scripts/dados/construir-indice-recife.mjs` | Identificar integração e campos excluídos | Leitura parcial, sem execução |

## 3. Registro de acesso e lacunas

- Pesquisa web recuperou páginas oficiais e documentação dos fornecedores acima.
- Aberturas de busca do catálogo Recife por `iptu` e `lotes` falharam; a página geral abriu.
- Uma chamada de metadados `package_search?q=iptu&rows=3` por terminal falhou com erro de resolução de nome. Não houve consulta bem-sucedida de registros por esse caminho.
- Não foram usados dados de pessoas, credenciais pagas ou coleta de anúncios nesta rodada.
- Preços sob consulta permanecem sem valor estimado atribuído ao fornecedor.
- Não foi verificado tamanho de mercado, taxa de conversão, disposição a pagar ou margem real.

## 4. Pontos que precisam de nova pesquisa antes de implementação

1. Dicionários, licenças e versões exatas de IPTU e lotes.
2. Escala e adequação dos arquivos geoespaciais do SGB.
3. Cobertura dos fornecedores com amostras licenciadas por bairro.
4. Variáveis censitárias para estoque de moradia e estudo de fluxo anual.
5. Política contratual de retenção e exportação de resultados de cada API.
6. Custo de pagamentos e regime tributário aplicável à operação real.
7. Custos de suporte e precisão em documentos reais autorizados.

Este registro permite atualizar o dossiê sem confundir uma página comercial encontrada com uma integração comprovada.
