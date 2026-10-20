# APIs pagas e fornecedores

Preços e termos conferidos nas páginas oficiais em 20/10/2026. Valores em dólar ou libra não foram convertidos para real. Detalhes e trechos em [`anexo-pesquisa-verificada.json`](anexo-pesquisa-verificada.json).

## Conclusão em três frases

1. **Na prova de conceito, quase nada pago é necessário.** O cadastro já traz coordenadas, então pagar geocodificação é desperdício. As cotas gratuitas cobrem milhares de dossiês por mês.
2. **O que limita as APIs de mapa são os termos, não o preço.** O app usa MapLibre, e o Google proíbe usar Places e Routes com mapa de outro fornecedor. A escolha do mapa vem antes de qualquer API de localização.
3. **Os gastos que fazem sentido são por pessoa pagante:** leitura de atas por modelo de linguagem (centavos por documento) e busca de processos pelo CNPJ do condomínio (de R$ 0,15 a R$ 1,00 por busca, com mínimo mensal).

## Usar, testar ou descartar

| Fornecedor | Para quê | Preço publicado | Termos que pesam | Decisão |
|---|---|---|---|---|
| [Fogo Cruzado](https://api.fogocruzado.org.br/docs) | Tiroteios com ponto e data na Região Metropolitana do Recife | Gratuito, com cadastro | Uso declarado livre; sem licença nomeada | **Testar** como contagem em raio, com fonte e data |
| [Modelos de linguagem: Claude](https://platform.claude.com/docs/en/about-claude/pricing) | Ler atas, convenção e balancetes enviados pela pessoa, citando a página | Haiku 5.5: US$ 0,10 de entrada e US$ 0,50 de saída por milhão de tokens (prompts até 100 mil tokens); lote com 50% de desconto | Até 32 MB e 600 páginas por pedido | **Testar.** Ata de 20 páginas: cerca de US$ 0,01 a 0,06 no Haiku 5.5, US$ 0,23 no Sonnet 5.5, US$ 0,46 no Opus 5.5 |
| [Gemini](https://ai.google.dev/gemini-api/docs/pricing) e OpenAI | Plano B para atas | 2.5 Flash-Lite: US$ 0,10 e 0,40 por milhão | **No nível gratuito do Gemini, o conteúdo é usado para treinar:** atas com nomes de moradores não podem ir para lá | Referência de preço |
| [JUDIT](https://judit.io/precos/) | Processos em que o condomínio ou a construtora é parte, pelo CNPJ | R$ 0,15 a R$ 1,00 por consulta; mínimo de R$ 1 mil/mês (pós-pago) ou pacote de R$ 5 mil | Buscar só CNPJ, nunca CPF | **Depois de haver pagantes** |
| [Google Maps Platform](https://developers.google.com/maps/billing-and-pricing/pricing) | Tempo de trajeto até destinos da pessoa; foto da fachada | Cota mensal gratuita: 10 mil (Essentials), 5 mil (Pro), 1 mil (Enterprise) por produto | Places e Routes não podem ser usados com mapa de outro fornecedor; Street View não pode dividir a tela com ele. Exceções: Places UI Kit; coordenadas da Geocoding em cache para a função direta do usuário | **Só se o mapa for Google** |
| [Mapbox](https://www.mapbox.com/pricing) | Trajeto, isócronas ("até 15 min a pé") | Directions: 100 mil grátis/mês, depois US$ 2/mil; mapa web: 50 mil carregamentos grátis | Geocodificação só com mapa Mapbox; termos de Directions e Isochrone não abriram | Alternativa ao Google; sem transporte público |
| [HERE](https://www.here.com/get-started/pricing) | Trajeto, inclusive transporte público | Geocode: 30 mil grátis/mês, depois US$ 0,88/mil | Página de preços se declara confidencial; cache não lido | Testar a cobertura de ônibus no Recife antes; o GTFS próprio pode bastar |
| [Crime Brasil](https://crimebrasil.com.br/api) | Ocorrências por bairro com taxa por morador | Só por contrato | Cada linha traz score de 0 a 1000 e percentil: o VEREDA não pode exibir nota | Só com contrato que cubra contagens e taxas, sem score |
| [RI Digital (ONR)](https://ridigital.org.br/) | Matrícula do imóvel na compra | Em PE, 2026, por cálculo sobre a tabela do TJPE: visualização cerca de R$ 17,58, certidão digital cerca de R$ 58,61 | Direito de qualquer pessoa (Lei 6.015, art. 17); a matrícula tem dados do proprietário | **Não intermediar.** O roteiro de compra pede o número da matrícula e o cartório e manda a pessoa ao RI Digital |
| [Docket](https://www.docket.com.br/) e similares | Pedir certidões em cartório | Sem preço público | Margem sobre o emolumento e responsabilidade LGPD | Só num produto B2B |
| [DataZAP (Grupo OLX)](https://imoveis.grupoolx.com.br/datazap/) | Preço anunciado por bairro e tipologia, inclusive Casa Forte | Sem preço público | Fornecedor é dono dos portais cujas lacunas o VEREDA expõe | Conversar só depois da POC; antes, pedir à Fipe |
| [BigDataCorp, Neoway, Cortex Geofusion](https://bigdatacorp.com.br/plataforma/outras-entidades/) | Perfil do entorno | Sem preço público | Metodologia fechada; bases centradas em pessoas | **Descartar** |
| [Google Solar API e Aerial View](https://developers.google.com/maps/documentation/aerial-view/faq) | Sol no apartamento | Solar: 10 mil grátis, depois US$ 10/mil | Solar só para projetos de energia; Aerial View só endereços dos EUA | **Descartar** |
| [OpenWeather](https://openweathermap.org/price) e Open-Meteo | Clima no dia da visita | OpenWeather: 1.000 chamadas/dia grátis | Open-Meteo grátis só para uso não comercial | Valor baixo; a APAC é gratuita |

## Decisão pendente: qual mapa

O app desenha com MapLibre e dados próprios. Isso é barato e livre, mas fecha a porta para Places e Routes do Google. Há três caminhos:

| Caminho | Ganha | Perde |
|---|---|---|
| **Manter MapLibre** (recomendado para a v1.x) | Custo zero, sem amarra de termos; GTFS próprio cobre o transporte público | Tempo de carro precisa de Mapbox ou HERE (também com termos) ou de aproximação em linha reta rotulada |
| Mudar para Google Maps | Trajetos, Street View e Places no mesmo lugar | Custo por uso; o índice estático não pode conter dados do Google |
| Abrir o app de mapas do celular | Zero custo e zero termo: o trajeto é calculado pelo app da pessoa | O dossiê não mostra o número |

Recomendação: MapLibre mais GTFS próprio para transporte público, e "abrir no app de mapas" para carro. Rever só se o tempo de carro virar pedido recorrente nos testes.

## Custo variável por dossiê, se tudo o que é útil entrar

| Item | Custo | Quando |
|---|---|---|
| Dados do índice (cadastro, GTFS, CNEFE, Censo) | Zero por dossiê; custo de rodar o script | Sempre |
| Leitura de ata de 20 páginas | Cerca de US$ 0,01 a 0,46, conforme o modelo | Só se a pessoa enviar |
| Busca de processos do condomínio | R$ 0,15 a R$ 1,00 por CNPJ, mais o mínimo mensal | Só com pagantes |
| Rotas de carro | Dentro da cota gratuita até milhares de dossiês | Só se o mapa permitir |

Esses números cabem com folga no preço de teste de R$ 19,90 a R$ 29,90 por dossiê e no custo variável de R$ 2 por dossiê que o [modelo de preços existente](../2026-10-20/04-PRECOS-E-VIABILIDADE.md) assume.
