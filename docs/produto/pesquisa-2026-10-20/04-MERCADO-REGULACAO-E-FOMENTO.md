# Mercado, regulação, modelo de negócio e fomento

Pesquisa de 20/10/2026, com verificação das fontes. Detalhes em [`anexo-pesquisa-verificada.json`](anexo-pesquisa-verificada.json). Isto não é parecer jurídico: os pontos marcados "parecer" precisam de advogado antes de cobrar.

## Prazos que vencem nas próximas semanas

| Data | O quê | Exige |
|---|---|---|
| **02/11/2026, 23h59** | Inscrição no [Campus Mobile 15ª edição](https://www.institutoclaro.org.br/campus-mobile/wp-content/uploads/sites/6/2026/08/Regulamento-15a-edicao.pdf) (prorrogável) | Gratuita; vídeo opcional de até 2 minutos; equipe de até 3 pessoas |
| **23/11/2026** | 1ª fase do [Pró-Startups Operação 2026, FACEPE (Edital 33/2026)](https://www.facepe.br/wp-content/uploads/2026/09/2026.09.29-Pr%c3%b3-Startups-Opera%c3%a7%c3%a3o.pdf): até R$ 15 mil (Protótipo), depois R$ 30 mil (MVP) e R$ 60 mil (Produto) | Não exige CNPJ na 1ª fase. Exige anuência de uma incubadora da REPE associada à ANPROTEC e coordenador com graduação |
| **30/11/2026** | [Desafios.Gov, FACEPE (Edital 32/2026)](https://www.facepe.br/wp-content/uploads/2026/09/2026.09.29-Desafios-Gov.pdf): até R$ 300 mil por projeto | CNPJ de ME ou EPP, coordenador graduado, contrapartida, e um desafio de órgão estadual na plataforma Desafios.PE que caiba no VEREDA (lista não lida) |
| 04/12/2026 | Lista de selecionados do Campus | — |
| 21 a 26/02/2027 | Semana Imersiva do Campus | **Protótipo funcional é eliminatório** (item 6.4) |
| até 31/05/2027 | Metas com uso real, só para os 3 premiados de cada categoria | Números de uso antes de maio |

O calendário do Pró-Startups combina com o do Campus: a fase de MVP cai em abril de 2027, perto das metas da Etapa 4.

## Campus Mobile: o que conta e o que pode desclassificar

**Critérios de seleção** (item 5.2.2): habilidade técnica (peso 3), atitude criativa e empreendedora (3), impacto (3), autonomia (2), originalidade e inovação, com valorização de IA e big data (2), viabilidade técnica (2), clareza (1).

**Item 11.20(iv):** veda "qualquer menção que caracterize a divulgação do nome e/ou marca". A leitura prudente vale para a ficha, o vídeo e a demonstração:

- dizer "portais de anúncio", sem nome nem logo de portal;
- mostrar só telas próprias;
- **o app hoje escreve os nomes dos portais** no campo de link ("Cole o link do ZAP, VivaReal, QuintoAndar ou OLX") e na leitura ("ZAP Imóveis · código …"). Para a demonstração, trocar por "portal de anúncios" é barato e tira o risco. Decisão da equipe.

## Mercado

| Número | Valor | Fonte |
|---|---|---|
| Domicílios ocupados no Recife | 547.539, dos quais 145.805 alugados (26,6%) | [IBGE, SIDRA 9928](https://servicodados.ibge.gov.br/api/v3/agregados/9928/periodos/2022/variaveis/381?localidades=N6[2611606]&classificacao=137[13233]|63[95826,73554,4343,1055]|125[2932,3247]) |
| Apartamentos alugados | 58.392 no Recife (35% dos apartamentos ocupados); 97.700 na Região Metropolitana | Mesma tabela |
| Apartamentos ocupados nos 5 bairros da v1.0 | 64.153 (39% da cidade): Boa Viagem 43.454, Graças 7.699, Madalena 7.081, Espinheiro 3.951, Casa Forte 1.968 | [Censo 2022 por bairro](https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/Agregados_por_Bairro_csv/Agregados_por_bairros_caracteristicas_domicilio1_BR.zip) |
| Alugados nos 5 bairros | Cerca de 22 mil, **se** a taxa municipal de 35% valesse ali. É inferência: não existe condição de ocupação por bairro | Cálculo |
| Aluguel anunciado no Recife | R$ 64,39/m² em set/2026, 2º entre as capitais e o mais caro do Nordeste | [FipeZAP](https://downloads.fipe.org.br/indices/fipezap/fipezap-serieshistoricas.xlsx) |
| Rentabilidade do aluguel | 8,53% ao ano em fev/2026, a maior entre as 22 capitais | [FipeZAP fev/2026](https://www.datazap.com.br/wp-content/uploads/2026/03/fipezap-202602-residencial-locacao.pdf) |
| Aluguel anunciado nas Graças | +21,5% em 12 meses (fev/2026) | Mesmo informe |
| Venda | R$ 9.044,83/m² em set/2026 | FipeZAP |

**Para o pitch:** o aluguel no Recife é caro e subiu rápido, então escolher mal custa caro. São dezenas de milhares de apartamentos alugados só nos 5 bairros da v1.0.

## Capital e incumbentes

- No mundo, US$ 16,7 bilhões em proptech em 2025, concentrados: 35 empresas ficaram com 71,9%, e cerca de 77% das rodadas acima de US$ 100 milhões foram dívida, securitização ou private equity. No Brasil, o dinheiro recente foi para IA a serviço de imobiliárias. Não há fonte primária para o total investido em proptech brasileira de 2022 a 2026.
- O anúncio está concentrado em dois ecossistemas (Grupo OLX e QuintoAndar), e os incumbentes recuaram de garantia e condomínio.
- **Implicação:** não disputar anúncio nem preço estimado. Apresentar o VEREDA como camada de fatos do cadastro depois da busca, com frente B2B que não mude o que o usuário vê.

## Regulação

| Tema | O que diz | O que significa para o produto |
|---|---|---|
| [Corretagem (Lei 6.530/1978)](https://www.planalto.gov.br/ccivil_03/leis/l6530.htm) | Intermediação de compra, venda e locação é do corretor inscrito no CRECI | **Linha que não se cruza:** nada de comissão, taxa por negócio fechado, lead pago por fechamento, negociação em nome da pessoa ou "avaliação" com valor de imóvel. Mostrar dado público com fonte e redigir a mensagem que a própria pessoa envia é informação. Parecer antes de cobrar de corretores |
| [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) | Dado de acesso público se trata conforme a finalidade que justificou a publicação (art. 7º, §3º) | Confirma o desenho atual: IPTU por tipologia, sem unidade, complemento nem CPF. Com servidor e conta, o VEREDA vira controlador: política de privacidade, canal com o titular, base legal por dado |
| [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) | IPTU, ITBI e Licenciamento do Recife estão sob ODbL (confirmado no CKAN). Usar a base em público exige aviso de origem (§4.3) e oferecer a base derivada ou o método, **com os acréscimos feitos à mão** (§4.6 b) | O índice prédio → DSQFL vira base derivada aberta quando os dossiês forem públicos. **A vantagem competitiva não é o dado**, é a resolução anúncio → prédio, a experiência e a velocidade. Dados de parceiros ficam em base separada |
| [CDC](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm) e [Lei do Inquilinato](https://www.planalto.gov.br/ccivil_03/leis/l8245.htm) | Direito a informação clara sobre preço e tributos; o locador deve exibir comprovantes de IPTU e condomínio quando pedido (Lei 8.245, art. 22, IX) | As perguntas do app têm base legal: dá para citar o art. 22, IX, na mensagem. O VEREDA também é fornecedor, mesmo grátis: "a confirmar", origem e data são dever de informação |
| [Termos dos portais](https://www.quintoandar.com.br/termos) | QuintoAndar (08/01/2026) e OLX (27/02/2025) proíbem extrair dados e usar o anúncio em outro veículo. Termos do ZAP e do VivaReal não foram lidos | Nenhuma busca pelo servidor. A leitura na WebView parte da pessoa, sobre a página à vista dela, e guarda só campos factuais: menor risco, não risco zero. Parecer antes de escalar |
| [Seguro e crédito](https://www.planalto.gov.br/ccivil_03/leis/l8245.htm) | Seguro só por representante (CNSP 431/2021) ou corretora parceira; crédito só por correspondente (CMN 4.935/2021) | Link de indicação não basta para ser remunerado. O VEREDA não deve assumir risco de crédito |
| [Contratação pública de inovação (LC 182/2021)](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp182.htm) | CPSI de até 12 meses, prorrogáveis, até R$ 1,6 milhão; depois, fornecimento sem nova licitação | Caminho B2G se um órgão publicar desafio compatível |

## Âncoras de preço

| Referência | Preço |
|---|---|
| Disposição a pagar declarada na pesquisa própria (83 respondentes) | R$ 27,40 a R$ 28,00 por dossiê (declarada e induzida pela pergunta) |
| Extrato veicular avulso da Serasa | R$ 29,90 |
| Visualização de matrícula em PE (2026, por cálculo) | Cerca de R$ 17,58 |
| Certidão digital de matrícula em PE (2026, por cálculo) | Cerca de R$ 58,61 |
| NeighborhoodScout (EUA), avulso | US$ 30 |
| Openigloo (Nova York), passe de 24 h | US$ 14,99 a 17,99 |
| Groundsure (Reino Unido) | A partir de £ 92,60 + VAT |
| CRM de imobiliária (Tecimob) | R$ 129,90/mês + R$ 19,90 por corretor |

A faixa de teste de R$ 19,90 a R$ 29,90 por dossiê avulso e de R$ 49,90 pelo pacote de busca, do [modelo de preços existente](../2026-10-20/04-PRECOS-E-VIABILIDADE.md), está dentro dessas âncoras. É 0,4% a 0,7% de um mês de aluguel de 70 m² no Recife (inferência sobre o FipeZAP). Um módulo B2B para corretores precisa caber entre R$ 20 e R$ 130 por mês por corretor para competir com o CRM inteiro.

## Fomento além dos prazos acima

- [Porto Digital](https://movimentoeconomico.com.br/tecnologia/2026/02/10/porto-digital-lanca-editais-de-incubacao-e-internacionalizacao-de-negocios/): pré-incubação sem CNPJ, incubação e pré-aceleração, com chamada anual por volta de fevereiro. O próximo ciclo cai na fase preparatória do Campus. Não está confirmado que a incubadora do Porto Digital atenda à exigência REPE/ANPROTEC do Edital 33/2026.
- Centelha 3 PE: fechado; próximo ciclo no radar para 2027.
- Não confirmados em 2026: EITA! Recife, Hacker Cidadão, chamadas da Finep para startups.
