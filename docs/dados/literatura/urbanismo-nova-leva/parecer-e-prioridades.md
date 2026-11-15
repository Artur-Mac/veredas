# Parecer de produto e pesquisa — inteligência urbana VEREDA

14 de novembro de 2026. Recorte de lançamento nos cinco bairros iniciais, com referências técnicas brasileiras e internacionais. O [catálogo](CATALOGO.md) identifica 116 PDFs nesta leva. A [leitura anterior](LEITURA.md) detalha os 19 primeiros. A coleta registra fonte, DOI, licença indicada e tentativas em [coleta-openalex.json](coleta-openalex.json). Para todos os PDFs foi extraído o texto das três primeiras páginas e 102 apresentaram marcador de resumo. A síntese abaixo aprofunda os estudos indicados por links e incorpora uma triagem do conjunto. Ela não representa revisão integral dos métodos e resultados de todos os 116 artigos.

## Decisão

A Vereda já tem acesso a uma parte substancial dos dados necessários para uma experiência mais valiosa. A primeira prioridade é montar um **resumo de moradia que responda perguntas**, com evidência e período acessíveis. O investimento em dados deve criar histórico geográfico e temporal que permita explicar a situação daquela rua, seus acessos e seus serviços próximos.

A melhor primeira funcionalidade é **histórico de chuva por rua e episódio**. Ela usa o índice existente e exige organizar registros originais por data, com precisão espacial honesta. Em paralelo, prototipar **o que se alcança a pé** e pesquisar **sombra no percurso**. Esses três temas produzem informação útil mesmo quando a pessoa só fornece um link. Obras, barulho potencial e travessias completam a visão do cotidiano.

O diferencial acumulável está na união de séries de observações municipais, topônimos e vias normalizadas, episódios de chuva, grafo de caminhada, locais em funcionamento e validações. Isso exige manutenção e pode tornar o resultado cada vez mais difícil de reproduzir. A capacidade de reproduzir o raciocínio por imóvel é parte do valor.

## O que a pesquisa muda no produto

### 1. De cota e canal para histórico compreensível de chuva

A China combina dados de precipitação, publicações e satélite para identificar episódios de alagamento. Os meios observam eventos diferentes e a postagem depende da participação. A pesquisa sobre vias no sul da China propõe estudar como a inundação interrompe a conectividade da malha. Em Porto Alegre, outro estudo mede alterações de acesso a hospitais sob cenários de inundação. A combinação sugere duas funcionalidades com maturidades distintas. [China — chuva, relatos e satélite](china-flood-social-satellite.pdf) · [Conectividade no sul da China](flood-impacts-on-urban-road-connectivity-in-southern-china-bd23f5.pdf) · [Porto Alegre — acesso](porto-alegre-redundancia.pdf)

**Agora:** reconstruir registros por logradouro e data, classificar o motivo, consolidar possíveis registros do mesmo episódio e explicar quantas datas ou episódios distintos aparecem no período. O índice atual já guarda resumo por rua e por ano, mas não a lista diária necessária para reconstituir eventos. Uma rua longa pode conter um ponto afetado longe da entrada do prédio.

**Pesquisa seguinte:** associar ocorrências com precisão de trecho a rotas e verificar se há caminhos alternativos. Para isso é preciso obter eventos localizados no trecho, grafo pedonal e independência de duas fontes. Evitar inferir profundidade ou passagem bloqueada a partir de cota, distância a canal ou ausência de chamados.

O estudo de elevação e maré no Recife trabalha com cenários de elevação do nível do mar e modelo topográfico de maior detalhe. Ele orienta investigação sobre drenagem e maré, mas seus cenários não constituem observações de água na porta de um imóvel. Conferir datum e resolução dos dados antes de cruzar terreno e maré. [Recife — cenários costeiros](recife-mare.pdf)

### 2. Caminhada real em vez de contagem em raio

Valls e Clua modelam as áreas caminháveis de Barcelona com uma representação mais detalhada que a linha central das ruas. Bolten e Caspi mostram como um grafo pedonal pode representar necessidades e acessos distintos. Para a Vereda, o primeiro resultado não precisa de uma plataforma de navegação completa: pode ser uma lista pré-calculada de destinos existentes e caminhos com duração estimada, exibindo também uma travessia importante ou alternativa quando os dados sustentam essa informação. [Calçadas de Barcelona](modeling-barcelona-sidewalks-a-high-resolution-urban-scale-assessment-of-th-83e860.pdf) · [Grafo pedonal personalizado](towards-routine-city-scale-accessibility-metrics-graph-theoretic-interpreta-bfa4cd.pdf)

O app já tem um recorte local de serviços CNEFE de 2022 e outros dados de entorno. Antes de prometer “mercado aberto” ou “acesso sem barreiras”, precisamos medir se o estabelecimento continua funcionando e se a rede registra calçadas e cruzamentos. A alternativa em caso de dados incompletos é apresentar os serviços identificados com origem e distância disponível, sem inventar rota.

### 3. Sombra como benefício comparável

CoolWalks calcula caminhos e exposição ao sol a partir da geometria das ruas, edifícios e posição solar. O estudo de Hong Kong examina proteção solar para trajetos, usando também LiDAR e conexões internas. A Vereda já trabalha com posição solar e recortes de edifícios, portanto vale estudar rotas entre prédio, mercado e parada, em horários representativos. O experimento testa duas rotas, com um limite de desvio, mostrando o ganho de sombra estimado e o tempo adicional. [CoolWalks](coolwalks.pdf) · [Hong Kong — rotas protegidas](hong-kong-sombra.pdf)

A parte difícil é ter calçadas separadas dos eixos de veículos, geometria e altura dos prédios, copas, marquises e sombra coerentes com a realidade. Comparar observações em horários diferentes antes de afirmar que um caminho é mais confortável. Temperatura da superfície obtida por Landsat não mede a temperatura do ar, a sensação térmica ou o interior do apartamento.

### 4. Segurança como condições verificáveis

Trabalhos sobre acessibilidade de calçadas e segurança de cruzamentos diferenciam geometria, visibilidade, tipo de via e ocorrência registrada. O conjunto municipal da CTTU fornece chamados de sinistros de trânsito, e o pipeline da Vereda já compila ocorrências com vítima a até 150 m. A próxima pergunta é se há ponto e categoria suficientemente precisos para ligar um atropelamento a uma travessia do percurso. O produto pode revelar uma travessia que merece atenção e uma alternativa de caminhada, com período e fonte. [Segurança em cruzamentos](evaluating-pedestrians-safety-on-urban-intersections-a-visibility-analysis-c1326f.pdf) · [CTTU](https://dados.recife.pe.gov.br/dataset/acidentes-de-transito-com-e-sem-vitimas)

A pesquisa também oferece algoritmos de imagem para encontrar rampas e obstáculos. O SideSeeing fornece uma taxonomia e um método de observação com imagens de calçadas no Brasil e nos EUA. Um estudo sobre VLMs aponta limites para estimar atributos quantitativos de acessibilidade por fotografia. Tratá-los como ferramentas de triagem, com inspeção local, data e direitos da imagem. [SideSeeing](sideseeing.pdf) · [VLMs e atributos de calçadas](sidewalk-vlm.pdf)

### 5. Dia, noite e a mudança da vizinhança

Licenças sonoras, processos de obra e corredores de transporte podem identificar atividades próximas. Para responder “como é à noite”, faltam observações de funcionamento por horário, medições ou outras evidências de atividade. A existência de uma licença não mede ruído, e obra licenciada ainda precisa de confirmação de execução. A experiência pode apresentar as atividades e datas documentadas, ligadas à fonte, em linguagem direta.

Para ônibus, GTFS registra serviço programado. Um estudo compara horários planejados com trajetos observados e encontra divergências de acessibilidade conforme origem e tempo. A condição do GTFS local ainda precisa ser saneada antes de calcular tempos. Dados em tempo real agregariam disponibilidade, se acessíveis e com histórico utilizável. [GTFS planejado e observado](on-the-accuracy-of-schedule-based-gtfs-for-measuring-accessibility-e9dba0.pdf) · [Dados vivos Recife](https://dados.recife.pe.gov.br/tr/dataset/demandas-dos-cidadaos-e-servicos-dados-vivos-recife)

## Portfólio priorizado

| Ordem | O que a pessoa ganha | Estado dos dados | Decisão |
|---|---|---|---|
| 0 | Dossiê coerente e confiável nas cinco áreas | App e fontes existem; qualidade e apresentação variam | Auditar os fluxos e corrigir afirmações cuja escala excede a fonte. |
| 1 | Entender o que foi registrado sobre chuva na rua | Defesa Civil 2014–24 no pipeline, 156 e relevo locais; eventos ainda agregados por ano | Desenvolver primeiro o histórico por episódios e medir qualidade da associação. |
| 2 | Ver serviços alcançáveis a pé e alternativas | Há CNEFE, OSM parcial e geometrias; rotas e funcionamento carecem de auditoria | Fazer prova com categorias fixas e cinco bairros. |
| 3 | Entender atividades, travessias e mudanças próximas | CTTU, licenças e 156 já usados; vínculo e período variam | Contextualizar fontes, validar pontos e horários, integrar à comparação. |
| 4 | Comparar caminhos com sombra | Solar e edifícios disponíveis em recortes; copas, calçadas e altura não comprovadas | Experimentar dois trajetos e observação em campo antes de publicar. |
| 5 | Entender histórico de anúncios e preço ofertado | Há leitura de anúncio; base histórica comparável ainda não estabelecida | Investigar acesso estável, deduplicação e cobertura. |

## Ideias ainda em pesquisa

- **Episódios em fotos e vídeos.** Classificar localização e, eventualmente, profundidade de água pode enriquecer os registros. Precisa de direitos de uso, data, geolocalização e amostra independente. Um vídeo mostra um ponto e instante específicos.
- **Alternativas durante enchentes.** Quando houver trechos efetivamente associados a episódios históricos, estimar o efeito de sua interrupção no acesso a serviços. Apresentar a hipótese e o histórico do trecho, com dados suficientes para o percurso.
- **Calor por caminhada.** Sombra do edifício, vegetação, vento, céu e umidade interagem. Escolher primeiro a variável que pode ser validada. A pesquisa de rotas de Austin usa modelagem térmica mais abrangente, com dados e custos adicionais. [Austin](austin-conforto.pdf)
- **Ruído estimado.** Modelos usam medições acústicas e atributos viários para aprender padrões. Sua transferência para Recife requer amostra de medições locais por hora e tipo de rua, além de cuidado com reflexões e fachadas. Sem isso, apresentar as fontes potenciais conhecidas.
- **Mudança real de obras e comércio.** Cruzar licenças ou cadastros com fontes atualizadas e observações independentes. O ganho vem de distinguir mudança anunciada, autorizada, observada e encerrada.

## Limites que mudam a ordem do desenvolvimento

O índice municipal consultado contém 2.688 edifícios nos cinco bairros. O campo de rua existe em todos eles, mas isso não prova cobertura completa dos fatos. No índice, apenas cinco ruas de Boa Viagem, uma de Casa Forte e uma de Espinheiro apresentaram a categoria de alagamento; Graças e Madalena tiveram zero nessa categoria. São resultados do classificador e dos dados agregados da versão analisada, e justificam testar a cobertura e a classificação antes de qualquer narrativa sobre ausência de chuva. Os arquivos locais da Defesa Civil em 2025 e a correção GTFS relatada têm inconsistências específicas apontadas na [leitura da leva](LEITURA.md).

Um modelo complexo, uma rede neural ou um resumo de LLM não elimina a necessidade de dados de referência locais. A avaliação de um método começa com o que ele acrescenta à decisão, medido em lugares e períodos que não participaram do ajuste. Não há nesta pesquisa validação de campo, custo operacional medido ou estudo com usuários que comprove impacto comercial.

O [plano de desenvolvimento](plano-desenvolvimento.md) detalha arquivos de partida, sequência, dados, estados, verificações e critérios de entrega. A ordem pode ser atualizada depois da primeira auditoria dos cinco bairros.
