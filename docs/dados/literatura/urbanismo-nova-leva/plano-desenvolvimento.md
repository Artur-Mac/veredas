# Plano de desenvolvimento — dossiê urbano para os cinco bairros

**Superseded execution sequence — 14 November 2026:** use the [Official Application and Evaluation Plan](../../../aplicacao/VEREDA-APPLICATION-PLAN.md) and its VE00–VE17 epochs. This document remains the earlier research proposal; the new plan starts with useful comparison, preserves existing functions, and evaluates advanced methods as separate experiments.

Proposta de 14/11/2026 para Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena. A pesquisa informa as escolhas deste plano. Nenhum item abaixo certifica uma integração ou funcionalidade como entregue. O plano detalha uma rodada focada do plano vigente em `docs/plano-recife/`, sem alterar o histórico nem as demais funcionalidades.

## Produto desejado

Ao receber o link ou texto de um anúncio e confirmar o edifício quando necessário, a pessoa abre um resumo que responde às perguntas mais importantes sobre aquele lugar. O resumo combina oportunidades e pontos a examinar, mostra a origem e o período de cada conclusão e permite aprofundar sem exigir documentos adicionais.

A primeira tela deve responder em linguagem cotidiana a três perguntas: o que se sabe sobre a rua em dias de chuva, o que se resolve a pé e quais atividades próximas podem mudar a experiência em diferentes horários. Os mesmos fatos entram na comparação entre dois imóveis. Sol nas janelas, custos e visita continuam compondo o dossiê.

## Princípios de construção

- Um registro administrativo é apresentado na escala geográfica que a fonte realmente suporta. O logradouro sem número não atesta a entrada do prédio. Não transformar ausência de atendimento em garantia de que não houve alagamento.
- Associar período e tipo de registro ao texto apresentado, com evidência acessível e estado explícito de cobertura. Frases assertivas exigem condições verificáveis. Quando não houver evidência suficiente, apresentar o contexto disponível.
- Atualizar em lote e distribuir arquivos compactos versionados, reaproveitando o índice local e Expo/React Native. Priorizar consultas que funcionem sem servidor e sem exigir dados novos da pessoa.
- Dados, método e exemplos de interface devem separar valor observado, derivado e inferido. A mesma fonte não conta duas vezes como confirmação independente. Manter rastreabilidade de parâmetros, versões e limitações.
- Cobrir os cinco bairros em cada etapa, incluindo casos com poucos resultados e baixo nível de certeza. Avaliar desempenho e cobertura por bairro, modalidade, tipo de dado e precisão de endereço.

## Prioridade 0 — estabelecer a verdade da versão em execução

**Objetivo.** Conhecer o comportamento real do aplicativo, as fontes efetivas de cada cartão e a integridade dos dados antes de ampliar as afirmações.

**Trabalho.** Abrir o aplicativo nos fluxos de anúncio e análise manual. Escolher pelo menos um edifício por bairro e registrar imagens e saídas de Destaques, Entorno e comparação. Criar inventário das fontes e datas efetivamente publicadas por camada. Reexecutar leituras locais de Defesa Civil, 156, CTTU, CNEFE, GTFS, Landsat e licenças, conferindo esquemas e as versões do índice. Investigar o deslocamento de 0,75° documentado para GTFS e os centros usados no processamento, sempre comparando coordenadas brutas, limites oficiais e pontos independentes. Investigar manchetes de calor, chuva, obras e ruído onde uma referência espacial ou temporal é mais ampla que a frase exibida.

**Código a examinar.** `src/dados/dossie/sintesesDaRua.ts`, `src/dados/dossie/rua.ts`, `src/dados/recife/camadasAmbientais.ts`, `src/componentes/dossie-v1/Entorno.tsx`, `scripts/dados/rua/camadas.mjs` e `scripts/dados/camadas-inteligentes-recife.mjs`.

**Aceite.** Tabela por bairro e fonte com data, período, contagem, regras e lacunas; exemplos de tela revisados; lista de correções com caso reproduzível. Os resultados brutos e a versão íntegra anterior permanecem disponíveis. Nenhuma reconstrução de todo o app é necessária.

## Prioridade 1 — chuva que responde à pergunta

**Objetivo.** Mostrar histórico de ocorrências por rua e explicar o que foi observado ao longo dos episódios disponíveis.

**Dados e processamento.** Recuperar as linhas originais de Defesa Civil por `Endereco`, `Bairro`, `Data`, `Ocorrencia` e `Solicitacao` e reaproveitar normalização de `scripts/dados/rua/nucleo.mjs`. Preservar ano e fonte, o texto do logradouro e a classe interpretada. Resolver divergências de logradouro e bairro em uma tabela revisável. Consolidar ocorrências possivelmente relacionadas ao mesmo temporal por janela documentada, mantendo contagem de registros e número de episódios distintos como medidas diferentes. Usar dados pluviométricos históricos da APAC quando estiverem acessíveis e suas datas/estações tiverem sido verificadas. A fonte de chuva pode contextualizar, sem precisar existir para apresentar um registro conhecido.

**Experiência.** O cartão traz um resumo claro do que está registrado, período e escala, com detalhes de eventos e fonte em segundo nível. Uma rua extensa ou uma correspondência ambígua mantém essa limitação visível. Onde só houver contexto de relevo, canais ou drenagem, explicar esses dados como contexto e oferecer aprofundamento. Uma zona sem registros suficientes não recebe conclusão positiva ou negativa.

**Primeira execução.** Escolher duas ruas com registros de alagamento em bairros diferentes e duas sem correspondência no agregado. Revisar os registros originais e dois temporais independentemente, incluindo 2022, com documentação de data. Testar nomes homônimos, rua longa, dados incompletos, duplicatas, categoria vazia e ano 2025 parcial.

**Aceite.** Contagens reproduzíveis a partir da fonte, rastreio de cada episódio, testes para agrupamento e associação, comportamento com fonte indisponível, revisão das cinco áreas e comparação entre dois imóveis. Avaliar manualmente amostra de classificações positivas e negativas. Fazer revisão independente de erros relevantes antes de ativar o texto para usuários.

## Prioridade 2 — vizinhança que se percorre

**Objetivo.** Apresentar o que existe a uma caminhada realista e revelar travessias relevantes, com benefícios e limitações.

**Dados e processamento.** Obter extrato datado do OSM para Recife e margem suficiente, preservar direitos e metadados. Construir grafo pedonal, especificando conexões, pontes, barreiras e cruzamentos conhecidos. Complementar serviços com CNEFE, dados municipais e fontes atualizadas cuja reutilização seja permitida. Consolidar duplicatas e registrar verificação de atividade, horário e data. Começar com supermercado, farmácia, praça e transporte, por serem destinos úteis sem configuração de rotina. O CNEFE 2022 apoia descoberta, sujeito à verificação atual.

**Experiência.** Mostrar até alguns destinos distintos, tempo estimado de percurso e uma explicação sobre a principal travessia ou barreira quando houver dados. Destacar alternativas de rota ou de serviço onde existirem. Mostrar hora de funcionamento somente com fonte que a forneça e período pertinente.

**Aceite.** Amostra por bairro e destino de rotas e serviços confrontadas com a via observável, incluindo ponte ou avenida em pelo menos um caso. Medir proporção de POIs em funcionamento e cobertura de conexões, por bairro. Bloquear o uso de rotas com desconexão ou travessia incerta, mantendo o endereço do serviço e a informação disponível. Registrar tempos e tamanho dos dados distribuídos ao aplicativo.

## Prioridade 3 — a rua muda de horário

**Objetivo.** Mostrar atividades e mudanças documentadas que ajudem a entender o entorno em horários diferentes.

**Trabalho.** Revisar situação e data das LUSE, licenças de obras, CTTU e serviços públicos. Distinguir processo, licença vigente e atividade observada. Validar horários de funcionamento a partir de fonte específica, atualizar pontualmente e preservar versão da origem. Não converter proximidade de uma licença em medição acústica. Sinistros de pedestres exigem geolocalização e classificação verificadas antes de associar a uma travessia específica. Mostrar obras como processo ou licença enquanto faltar evidência de execução.

**Aceite.** Para cada cartão, amostras de locais ativos e inativos, datas e erros encontrados; texto que respeite exatamente o tipo de evidência; atualização por fonte independente de outras camadas. Comparação apresenta os mesmos períodos e escalas para os dois imóveis.

## Prioridade 4 — sombra e conforto no percurso

**Objetivo.** Encontrar vantagens verificáveis de caminhar por ruas com sombra em horários representativos.

**Experimento.** Usar geometria e alturas municipais de edifícios, redes de caminhada e posição solar já adotada no projeto. Confrontar o código e método de CoolWalks com os dados de Recife, incluindo licenças. Inventariar copas, galerias cobertas e passagens ausentes. Comparar rota mais curta e alternativa para horários fixos com limite configurável de desvio. Identificar observação e incerteza por trecho. A temperatura de superfície Landsat tem resolução e momento de captura próprios, e não mede temperatura do ar ao nível do pedestre.

**Aceite.** Comparar previsões em pelo menos dois trajetos e em manhã e tarde, usando observações de sombra datadas. Medir cobertura dos edifícios e árvores, extensão sombreada observada e erro de ordenação entre rotas. Publicar como estimativa apenas após validação local. Se a cobertura impedir a comparação, manter o protótipo de pesquisa e a leitura solar de janela existente.

## Prioridade 5 — diferenciação por histórico

**Objetivo.** Preservar mudanças da cidade e tornar comparações mais explicativas com o tempo.

**Trabalho.** Criar históricos versionados de fontes públicas e permitidas, registros de alteração e validação de POIs, vínculo entre eventos de chuva e ruas, e linhas do tempo de processos urbanísticos. Avaliar sinais adicionais, como repetição de problemas de drenagem e perda de acesso a serviços, com métricas específicas e dados confirmados. Pesquisar histórico de anúncios e preços ofertados se houver fonte com acesso e retenção viáveis. Descrever a natureza do preço, janela e seleção da amostra. Manter dados pessoais e contribuições privadas isolados, com compartilhamento voluntário quando houver produto para isso.

**Aceite.** Uma nova versão pode ser verificada e ativada integralmente, com reversão à anterior. Apresentar histórico apenas quando a série e o método permitem comparações. Medir por fonte a proporção de dados atualizados, registros válidos, falhas, custo e tempo de atualização.

## Estrutura de dados e operação

Reutilizar os contratos Zod, os tipos de `Fato`, o pipeline de fontes, as partições e o caderno local. Acrescentar contratos mínimos quando um recurso novo os exigir. Uma observação tem ID de fonte e registro, versão, data observada, data de referência, tipo de geometria e precisão, tipo de fato, valor, método e estado. Uma derivação referencia as observações utilizadas, versão do algoritmo e critérios. Datas desconhecidas permanecem desconhecidas. Um evento pode referenciar vários registros e precisa de rastreio de agrupamento.

Cada fonte registra URL, responsável, licença, direitos de armazenamento, periodicidade, limite de coleta, período, esquema e hash. Coletar com cliente comum, cache e retomada, manter a última versão válida e validar contagens, CRS, ordenação espacial e campos antes de publicar. Tratar falha de uma camada como estado dela, mantendo as demais. Coordenadas de fonte, prédio, rua e ponto de interesse não devem ser promovidas a precisão maior. Amostras e logs operacionais não precisam conter nome ou telefone de pessoas.

Serviços que exigem dados contratados, crawling frequente, grandes mapas ou custos recorrentes entram somente após prova de acesso, cobertura, manutenção e custo. Para imagem, primeiro verificar direitos e uma pequena amostra local rotulada. Para imagens e textos gerados por modelos, medir erro e permitir revisão, em vez de assumir que coerência textual prova o fato.

## Entrega, avaliação e sequência

1. Fazer auditoria da experiência atual e dos dados nas cinco áreas.
2. Implementar o histórico de chuva com amostras rastreáveis, integrar e avaliar no dossiê e comparação.
3. Construir protótipo de acessibilidade a serviços e medir cobertura de rede e POIs.
4. Integrar a leitura por horário baseada em dados verificáveis.
5. Experimentar rotas de sombra e validar em campo antes de publicação.
6. Ampliar histórico e atualizar continuamente com métricas de qualidade.

Em cada etapa, registrar o tamanho da amostra, decisões, limitações, erros, permissões das fontes e resultado em cada bairro. Verificar fluxos de link, caderno, dossiê, comparação, sem rede e dados parciais. Para alterações funcionais, usar testes de domínio direcionados, `npm run verificar` quando aplicável, e revisão visual nos tamanhos e plataformas efetivamente disponíveis. Estimativas de prazo e custo precisam ser produzidas após medir a primeira coleta e a primeira implementação.
