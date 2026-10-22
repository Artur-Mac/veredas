# 01 — Dados públicos, contexto urbano e proxies

**Data de referência: 21/10/2026.** Este documento distingue registros administrativos/estatísticos, inferências do VEREDA e observações da visita. A existência de uma base não prova a qualidade de sua associação a um imóvel.

## 1. CNEFE e entorno: corrigir a promessa

O CNEFE do Censo 2022 oferece endereço, coordenadas, nível de geocodificação e espécie de uso. Ensino, saúde e estabelecimentos religiosos têm categorias próprias; bares e oficinas não são categorias específicas equivalentes, ficando entre outras finalidades. Descrição de estabelecimento, quando disponível, não substitui classificação atualizada de atividade. Coordenadas originais, modificadas, estimadas e agregadas exigem tratamento diferente. [IBGE — CNEFE](https://www.ibge.gov.br/estatisticas/sociais/populacao/38734-cadastro-nacional-de-enderecos-para-finsestatisticos.html), [dicionário republicado pelo Geoportal municipal do Rio](https://pgeo3.rio.rj.gov.br/arcgis/rest/services/Censo/CNEFE_2022/FeatureServer/layers).

Calçada, pavimentação, bueiro, iluminação, obstáculos e rampa pertencem à **Pesquisa Urbanística do Entorno dos Domicílios**. O levantamento observa características de faces, mas isso não transforma automaticamente todo produto divulgado em uma camada individual de faces associável a cada porta. O VEREDA usa dados agregados por setor. Presença de bueiro não comprova funcionamento da drenagem; presença de calçada não certifica percurso contínuo ou caminhável hoje. [IBGE — entorno 2022](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/tipologias-do-territorio/24702-caracteristicas-urbanisticas-do-entorno-dos-domicilios.html?lang=pt-BR).

**Texto proposto:** “Registro de ensino no Censo 2022 próximo ao endereço. Confirme acesso e horários.” Para agregados: “Neste setor censitário, … dos domicílios investigados estavam em faces com …, em 2022.” Usar o denominador da variável escolhida; não trocar domicílios por extensão de calçada.

**Evitar:** “Igreja colada ao prédio”, “rua silenciosa”, “calçada acessível”, “sem risco de alagamento” e “GPS exato” quando a evidência só sustenta categoria, distância aproximada ou contexto territorial.

## 2. O que já existe no código

- `scripts/dados/rua/camadas.mjs`: importa CNEFE, entorno, licenças ambientais, pedidos 156, iluminação, coleta, sinistros e Defesa Civil; o resultado é empacotado para uso local.
- `scripts/dados/rua/nucleo.mjs`: lista branca do CNEFE inclui `NV_GEO_COORD`, mas `lerEnderecoDoCnefe` não conserva esse atributo no objeto retornado. Isso merece investigação antes de reutilizar coordenadas para pontos próximos; correspondência por número e qualidade geográfica são dimensões diferentes.
- O cache exclui nome do estabelecimento, complemento, código único, quadra e face. Não acrescentar todos esses campos por conveniência. Para o primeiro experimento, categoria e localização são suficientes.
- A malha final de setores e a grade usada originalmente no CNEFE não devem ser associadas cegamente pelo código. O construtor já contém tratamento espacial dessa diferença; preservar esse comportamento.
- No índice há contexto por setor e por rua. A ocorrência da Defesa Civil associada à rua não fornece uma inspeção estrutural daquele edifício.

São constatações de leitura do código, não uma nova certificação de toda a cadeia de dados.

## 3. Análise exploratória executada nesta rodada

Insumo: `.cache/dados-recife/cnefe-recife.json.gz`, já presente, com dez colunas minimizadas; origem e hash estão no [resultado](evidencias/eda-cnefe.json). A data de modificação guardada no cache é 20/05/2024; a referência censitária é 2022. Não houve nova coleta de campo ou download integral do CNPJ. O [script](evidencias/explorar_cnefe.py) lê o cache e os cinco índices, sem alterar o produto e sem exportar endereços individuais.

| Espécie no recorte municipal | Registros |
|---|---:|
| Domicílio particular | 643.590 |
| Domicílio coletivo | 623 |
| Agropecuário | 60 |
| Ensino | 1.689 |
| Saúde | 1.519 |
| Outras finalidades | 72.760 |
| Construção ou reforma | 14.695 |
| Religioso | 2.575 |
| **Total** | **737.511** |

Esses números contam registros. Não representam contagem validada de empresas em operação, portas distintas, hospitais ou obras atuais. O cache não contém o indicador de multiplicidade de estabelecimentos, portanto não permite reconstruir essa quantidade.

| Nível de geocodificação | Registros | Consequência proposta |
|---|---:|---|
| 1 — coordenada original | 654.789 | Pode entrar no experimento espacial; ainda precisa de auditoria de localização |
| 2 — coordenada modificada | 71.793 | Conservar origem; não tratar como observação independente de cada unidade |
| 3 — coordenada estimada | 8.638 | Identificar estimativa e avaliar separadamente |
| 4 — face | 2.284 | Não exibir distância porta a porta |
| 5 — localidade | 0 neste cache | Suportar o estado mesmo que ausente aqui |
| 6 — setor | 7 | Somente contexto territorial |

Há **82.722 registros, 11,2% do total, fora do nível 1**. Todos têm coordenadas dentro do retângulo amplo usado pelo app, mas passar nesse teste não comprova precisão nem pertencimento ao polígono municipal. Outros 47.880 registros não têm número inteiro positivo sob a regra estrita deste experimento; isso não equivale automaticamente a endereço inválido.

### Proximidade exploratória

Calculou-se Haversine entre o centro cadastral dos prédios e registros de ensino/saúde/religião com nível 1. Consideraram-se registros de todo o município para evitar cortar pontos na borda dos bairros. A contagem é de prédios com **ao menos um** desses registros no raio, não de atividades distintas.

| Bairro do índice | Prédios | Até 150 m | Até 300 m |
|---|---:|---:|---:|
| Boa Viagem | 1.879 | 1.553 | 1.785 |
| Casa Forte | 82 | 82 | 82 |
| Espinheiro | 156 | 154 | 156 |
| Graças | 291 | 290 | 291 |
| Madalena | 280 | 268 | 280 |
| **Total** | **2.688** | **2.347 (87,3%)** | **2.594 (96,5%)** |

**Interpretação de produto:** uma bandeira genérica “há atividade próxima” atingiria quase todos os prédios. Ela tende a gerar pouco contraste e muita atenção desnecessária. Testar informação específica ligada à necessidade: acesso a serviços, horários de movimento ou ponto a observar. Não converter religião, saúde ou ensino em penalidade sobre o imóvel. O mesmo equipamento pode ser conveniência para uma pessoa e motivo para conferir movimento para outra.

**Limites:** os índices não são amostra representativa do mercado; as distâncias são entre pontos, sem rota, barreiras, acesso, andar ou fachada. O exercício não valida a situação de 2026, nem prova que pontos do mesmo endereço são estabelecimentos diferentes. Nenhuma dessas contagens foi adicionada à interface.

## 4. CNPJ: atividade declarada exige geocodificação própria

O leiaute oficial de estabelecimentos contém situação cadastral, data de início, CNAE principal/secundários e endereço; não contém latitude/longitude. A data cadastral de início não demonstra quando a atividade começou naquele endereço. Uma empresa ativa não comprova loja aberta, horário, volume de entregas ou emissão sonora. [Receita — leiaute público](https://www.gov.br/receitafederal/dados/cnpj-metadados.pdf).

A classificação pode orientar hipóteses: mecânica automotiva, comércio de bebidas, atividades com entretenimento, farmácia, padaria e mercado. Manter tabela versionada de CNAE com descrição oficial e distinguir atividade principal de secundária. Bares com e sem entretenimento são subclasses diferentes. [CONCLA — classe 5611-2](https://cnae.ibge.gov.br/?classe=56112&tipo=cnae&versao=9&view=classe), [CONCLA — classe 4520-0](https://cnae.ibge.gov.br/?classe=45200&tipo=cnae&versao=9&view=classe). As páginas foram localizadas no índice de busca oficial; uma abertura direta retornou 403. Validar o dicionário completo antes de fixar o mapa de códigos.

### Pipeline proposto, separado do cadastro tributário dos imóveis

1. Fixar competência do arquivo e hash; carregar somente estabelecimentos de PE/Recife e tabelas de códigos necessárias. Resolver o município pela tabela da Receita; não presumir que é o código IBGE de sete dígitos.
2. Excluir sócios, contatos pessoais, e-mail, telefone e capital social. Não relaxar `COLUNAS_PROIBIDAS` do construtor atual de IPTU/ITBI. Criar extrator separado e justificado.
3. Tratar CNPJ como identificador textual. O novo formato alfanumérico já foi iniciado em 2026; não usar `soDigitos` nem conversão numérica. [Receita — primeira emissão alfanumérica](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/julho/receita-federal-gera-o-primeiro-cnpj-em-formato-alfanumerico).
4. Associar rua, número, município e bairro ao CNEFE ou cadastro municipal. Conservar `exato_no_numero`, `ambiguo`, `interpolado`, `somente_rua` e `nao_localizado`; nenhuma dessas classes é probabilidade.
5. Deduplicar um estabelecimento com vários CNAEs para a contagem por categoria. Preservar a diferença entre filiais e matriz. Um centro comercial pode concentrar registros válidos; um escritório virtual pode concentrar atividades não exercidas ali.
6. Publicar apenas agregados e evidências necessárias à pergunta de moradia. Endereços residenciais de pequenos negócios não precisam virar uma lista nominal de comerciantes.
7. No produto: “Atividade cadastrada na base de competência …; funcionamento e horários a confirmar”. Sem dados elegíveis: “Não foi possível avaliar esta camada”, não “não há comércio”.

### Experimento de qualidade antes da feature

Selecionar 150 registros: 50 associações exatas, 50 ambíguas/sem número e 50 categorias de interesse, balanceadas entre os cinco bairros quando possível. Dois revisores classificam endereço, categoria e atualidade, sem presumir que uma página de busca prova funcionamento. Registrar divergências e casos não verificáveis. Nenhum contato externo está autorizado por este plano.

Medir: cobertura por bairro/categoria, acerto entre associações auditáveis, registros desatualizados, duplicação por endereço e tempo de manutenção. Critério proposto: pelo menos 95% de associações corretas **entre as auditadas como exatas**, com denominador e intervalo de incerteza; nenhum vínculo ambíguo apresentado como exato. Essa meta de liberação não é acurácia observada nem probabilidade por imóvel.

## 5. Transporte: separar oferta programada, circulação e ruído

O GTFS permite trabalhar com paradas, trajetos e serviço programado; para um dia é necessário combinar calendário, exceções e horários. Frequência programada não é passagem observada. `shapes` pode faltar; trajetos deduzidos unindo paradas não devem parecer geometria precisa. [Especificação GTFS Schedule](https://gtfs.org/documentation/schedule/reference/).

O endereço de distribuição atribuído ao Grande Recife é `https://www.granderecife.pe.gov.br/gtfs/gtfs.zip`. Nesta rodada a abertura direta não funcionou: conteúdo, vigência e licença **não foram revalidados**. A pesquisa anterior registrou uma versão; não reapresentá-la como download novo. A CTTU publica equipamentos de fiscalização com licença ODbL, mas localização de radar não é série de volume ou velocidade efetiva. [Portal de dados do Recife](https://dados.recife.pe.gov.br/dataset/equipamentos-de-monitoramento-e-fiscalizacao-de-transito).

**MVP possível:** “Parada cadastrada próxima” e “serviço programado nesta faixa de horário”, com distância em linha reta e validade. “A fachada está voltada para o corredor?” é informação do usuário; o centro do prédio não responde. Não deduzir motor diesel, frenagem, horário das 5h ou silêncio sem informação específica.

**Algoritmo proposto:** recortar área com margem; validar feed; ativar `service_id` pelo dia local; tratar horários após 24h, exceções e viagens por frequência; contar passagens por sentido sem somar duas vezes a mesma viagem em paradas vizinhas; distinguir estimativa de frequência de horário exato. Em ausência de calendário válido, ocultar números de frequência e manter só a geometria datada, se autorizada.

OSM pode complementar tipo de via, paradas e rotas. Ausência de tag não demonstra via silenciosa. A ODbL exige considerar atribuição e obrigações da base derivada; documentar composição e distribuição. O servidor público Nominatim limita uso e não é solução para geocodificação massiva ou autocomplete. [OSM — licença](https://www.openstreetmap.org/copyright), [política do Nominatim](https://operations.osmfoundation.org/policies/nominatim/).

## 6. Proxies que valem experimentar

| Sinal | Pergunta útil | Confundidor a controlar | Validação proposta |
|---|---|---|---|
| Escola próxima + horário de entrada | O acesso muda nos horários em que vou sair? | Escola fechada, outra entrada, férias | Visita/observação em dois horários |
| Serviços cotidianos próximos | Consigo fazer tarefas a pé? | Rio, via expressa, travessia e portão distante | Trajeto observado, sem chamar raio de caminhada |
| Empresa com atividade de entretenimento | Quais horários e isolamento devo conferir? | CNAE secundário, cadastro antigo, local só administrativo | Funcionamento confirmado e observação do usuário |
| Ônibus programados por hora | Preciso verificar movimento junto à fachada? | Desvio, frota, sentido e atraso | Conferir corredor em campo; não gerar dB |
| Bueiro no setor + chamados de drenagem | Há histórico a perguntar e pontos a observar? | Chuvas, repetição de chamados e desigualdade de uso do 156 | Deduplicação, período explícito e resposta do condomínio |
| Número de aberturas de CNPJ | A oferta registrada está mudando? | Mudança cadastral, MEI residencial, endereços virtuais | Comparar snapshots; não chamar de valorização imobiliária |

Não produzir índice único de “qualidade da rua” nesta etapa. Cada camada deve justificar sua inclusão por uma decisão do usuário e disponibilizar a origem que a sustenta.
