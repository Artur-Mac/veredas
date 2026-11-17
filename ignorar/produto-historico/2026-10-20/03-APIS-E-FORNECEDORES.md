# Avaliação de APIs e fornecedores

**ID:** BUY-2026-10-20 · **Versão:** 1.0 · **Status:** seleção para testes  
**Consulta:** 20/10/2026. Preços em USD, antes de tributos, câmbio e serviços auxiliares. Nenhuma contratação executada.

## 1. Lista comparativa

| Fornecedor | Aplicação útil | Tarifa pública observada | Limite / recomendação |
|---|---|---|---|
| [Google Maps](https://developers.google.com/maps/billing-and-pricing/pricing) | Endereço e deslocamento | Geocoding e Compute Routes Essentials: franquia de 10 mil eventos/mês por SKU; primeira faixa paga US$ 5/mil | Testar precisão em Recife; opções avançadas podem mudar SKU |
| [Mapbox](https://www.mapbox.com/pricing) | Rotas e mapas | Directions: 100 mil requisições/mês gratuitas, depois US$ 2/mil até 500 mil; geocoding temporário: 100 mil gratuitos, depois US$ 0,75/mil | Não confundir busca temporária com cadastro persistente |
| [Mapbox permanente](https://www.mapbox.com/pricing) | Geocodificação persistente | US$ 5/mil na primeira faixa; contato comercial | Direitos de distribuição precisam ser resolvidos antes de embutir em índice do app |
| [Geoapify](https://www.geoapify.com/pricing/) | Rotas a pé, pontos de interesse e isócronas | 3 mil créditos/dia gratuitos; plano API 10: US$ 59/mês por 10 mil créditos/dia | Crédito não é sempre requisição; benchmark local e cálculo de picos |
| [Google Document AI](https://cloud.google.com/document-ai) | OCR de atas, boletos e documentos enviados | OCR básico US$ 1,50/mil páginas na faixa inicial paga; Form Parser US$ 30/mil | OCR não entrega sozinho interpretação confiável; começar com texto nativo de PDF |
| [Open-Meteo](https://open-meteo.com/en/pricing) | Contexto meteorológico para planejar visita | Uso comercial exige assinatura; preço monetário não confirmado no conteúdo recuperado | Avaliar só quando houver utilidade comprovada; clima regional não estima temperatura do quarto |
| [Kenlo Open API](https://kenlo-open-api-prd.kenlo.io/docs/v2.html) | Inventário autorizado e atualização de anúncios | Sem tarifa pública confirmada para o caso VEREDA | API documentada, acesso sujeito a parceria e contrato |
| [DataZAP](https://imoveis.grupoolx.com.br/datazap) | Dados e análises do mercado | Cotação necessária | Soluções verificadas; API, granularidade e redistribuição não confirmadas |
| [Loft Dados](https://loft.com.br/para-imobiliarias/loft-dados/) | Inteligência para imobiliárias | Cotação necessária | Produto verificado; integração externa para VEREDA não demonstrada |
| [Geobrain](https://geobrain.com.br/) | Análises territoriais e mercado | Cotação necessária | Tratar como fornecedor potencial; cobertura específica e API precisam de demonstração |

## 2. O que testar primeiro

**Escolha proposta:** manter o cadastro municipal como eixo de identidade do prédio; testar Geoapify e Google em uma amostra controlada para deslocamento; manter Mapbox como alternativa. Nenhuma comparação de preço substitui teste de qualidade do endereço e do trajeto.

Um geocodificador pode devolver centro da rua ou ponto aproximado. Não usar essa resposta como confirmação do lote sem revisão.

**Protocolo:** 50 endereços dos cinco bairros, incluindo homônimos, número ausente e edifício conhecido pelo nome. Para cada fornecedor, medir localização correta, resultado ambíguo, tempo de resposta e custo. Em 20 trajetos, revisar chegada, travessias e modo de transporte. Credenciais e orçamento serão necessários para executar.

## 3. Exemplo reproduzível de custo de rotas

Hipótese: cada dossiê faz **uma geocodificação e seis consultas simples de rota**, sem mapa interativo, Places, autocomplete ou tráfego avançado. Franquias disponíveis integralmente na conta, sem outros aplicativos consumindo-as.

| Dossiês/mês | Geocodificações | Rotas | Google Essentials estimado | Mapbox temporário + Directions estimado |
|---:|---:|---:|---:|---:|
| 1.000 | 1.000 | 6.000 | US$ 0 | US$ 0 |
| 10.000 | 10.000 | 60.000 | US$ 250 | US$ 0 |
| 50.000 | 50.000 | 300.000 | US$ 1.450 | US$ 400 |

Google em 50 mil dossiês: geocoding = 40 mil × US$ 5/mil = US$ 200; rotas = 90 mil × US$ 5/mil + 200 mil × US$ 4/mil = US$ 1.250. Mapbox: 200 mil rotas pagas × US$ 2/mil = US$ 400; geocoding permanece dentro da franquia temporária. [Google](https://developers.google.com/maps/billing-and-pricing/pricing), [Mapbox](https://www.mapbox.com/pricing).

Esses totais não representam o custo integral do produto nem tornam equivalentes os direitos de armazenamento. Geocodificação permanente Mapbox, quando autorizada, acrescentaria US$ 5, US$ 50 ou US$ 250 nos três volumes, em substituição à temporária.

Em matrizes, contar elementos origem × destino. Em Geoapify, calcular créditos por operação; não converter automaticamente franquia diária em mensal disponível a qualquer momento. [Detalhes de créditos](https://www.geoapify.com/pricing-details/).

## 4. Arquitetura e direitos

Google Geocoding restringe armazenamento de conteúdo, com exceção explícita para place IDs; resultados em mapa devem seguir as regras de apresentação do fornecedor. Separar esse conteúdo do índice cadastral distribuído. [Política](https://developers.google.com/maps/documentation/geocoding/policies).

O Nominatim público limita uso e proíbe autocomplete do cliente nessa instância. Para escala, escolher serviço contratado ou infraestrutura própria, além de cumprir atribuição e licença dos dados. [Política oficial](https://operations.osmfoundation.org/policies/nominatim/).

Para mapas, contabilizar também carregamentos ou tiles, conforme o produto. Para OCR, somar armazenamento, reprocessamentos e interpretação. Chaves com poder de cobrança ficam no servidor ou usam restrições próprias do SDK, quotas e separação entre ambientes.

## 5. Condições mínimas de uma proposta comercial

Solicitar a fornecedores de dados:

1. Quantidade de anúncios únicos ativos por bairro, modalidade e mês; uma amostra licenciada para avaliação.
2. Campos de aluguel, condomínio, IPTU e periodicidade; percentual de ausentes.
3. Endereço exato ou aproximado, método de deduplicação e frequência de retirada.
4. Separação entre preço pedido, negociado e estimado.
5. Direitos de exibição ao consumidor, cálculo de derivados, cache, exportação e uso após término.
6. Preço de implantação, mínimo mensal, unidade de cobrança, excedentes e reajuste.
7. Documentação, ambiente de testes, limites, suporte e compromisso de disponibilidade.
8. Condições de tratamento de dados e comprovação de autorização do inventário.

**Critério comercial proposto:** negociar amostra e piloto antes de compromisso anual. Cobertura nominal nacional não garante amostra suficiente nos cinco bairros.

## 6. Construir, comprar ou adiar

| Construir internamente | Comprar se validado | Adiar |
|---|---|---|
| Proveniência, normalização de custos, comparação e perguntas | Rotas, mapa base, OCR de documentos escaneados | Infraestrutura própria de mapas no piloto |
| Índice municipal e controle de qualidade | Inventário com licença e cobertura comprovadas | Previsão de valorização sem base adequada |
| Histórico do caderno e exportação | Infraestrutura de conta quando houver necessidade | Coleta massiva de portais sem acordo |

O ativo estratégico proposto é a ligação entre evidência, pergunta e resposta útil. Comprar componentes comuns permite investir nessa parte.
