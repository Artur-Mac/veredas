# VEREDA Recife — Plano técnico definitivo por épocas

**Versão 1.0 · 21/10/2026 · Plano canônico para a versão ampla de experimentação.**

**Adendo 1.1:** [CNPJ e ocorrências do edifício](10-CNPJ-E-OCORRENCIAS-DO-EDIFICIO.md), detalhando obras, questões construtivas, documentos estruturais, trabalhistas e ruído. Aprofunda capacidades existentes, sem mudar a contagem ou iniciar implementação.

## Mandato

Construir uma versão funcional ampla do VEREDA para **imóveis no município do Recife**, reunindo as funcionalidades dos documentos do projeto. A utilidade de algumas funções será investigada com a versão funcionando: poderemos juntar, simplificar ou cortar módulos depois. A pesquisa de público acontece em paralelo e **não bloqueia globalmente a construção**.

“Versão grosseira” significa menor sofisticação e automação inicial, não dados jogados na tela, navegação desorganizada, resultados inventados ou perda do caderno. Cada função precisa de uma pergunta que ajuda a responder, um contrato de dados, uma localização na jornada e uma ação seguinte.

“Definitivo” significa que este é o plano único de execução desta rodada. Não significa que todos os fornecedores estejam disponíveis, que hipóteses estejam comprovadas ou que o plano não possa receber uma revisão explícita. Nenhuma contratação, publicação ou implementação foi feita na elaboração deste plano.

## Escopo geográfico e funcional

- Município do Recife, identificado pelo código IBGE `2611606`. Expandir a cobertura atual dos cinco bairros para todos os bairros municipais que passem pelo controle de qualidade. Registrar lacunas por camada; não confundir bairro listado com cobertura completa.
- A rotina pode atravessar o limite municipal. Dados de transporte/ambiente externos só entram como contexto necessário de um imóvel do Recife, com margem espacial documentada. Isso não abre uma expansão comercial para Olinda, Jaboatão ou outras cidades.
- Compra e aluguel, inicialmente apartamentos e tipologias já aceitas pelo formulário. Não forçar casa, flat ou cobertura a se comportar como unidade de prédio quando o cadastro não sustentar a associação.
- Caderno, custos, documentos, contexto urbano, rotina, visita, comparação, compartilhamento e instrumentos profissionais. Fluxos manuais úteis antecedem automações complexas, sem serem confundidos com automação entregue.
- Android, iOS e web, com capacidades declaradas por plataforma. O mesmo roteiro deve continuar utilizável quando sensores, arquivos ou rede não estiverem disponíveis.

## Leitura obrigatória para a IA operária

| Documento | Papel |
|---|---|
| [01 — Catálogo e rastreabilidade](01-CATALOGO-E-RASTREABILIDADE.md) | 80 capacidades, origem, época e limite técnico; inclui itens já existentes e substituições |
| [02 — Experiência e contratos de interface](02-EXPERIENCIA-E-CONTRATOS.md) | Onde cada função vive, hierarquia, estados, componentes e critérios visuais |
| [03 — Arquitetura e dados](03-ARQUITETURA-E-DADOS.md) | Entidades, persistência, migração, camadas, integrações e privacidade |
| [04 — Épocas 00 a 04](04-EPOCAS-00-A-04.md) | Reconciliação, interface, caderno, entrada e Recife municipal |
| [05 — Épocas 05 a 09](05-EPOCAS-05-A-09.md) | Custos, prédio/documentos, rua, serviços/mobilidade e visita |
| [06 — Épocas 10 a 14](06-EPOCAS-10-A-14.md) | Decisão, IA documental, colaboração, modelos comerciais e lapidação |
| [07 — Qualidade e aceite](07-QUALIDADE-E-ACEITE.md) | Testes, dados, visual, aparelhos, desempenho e saída por época |
| [08 — Prompt da operária](08-PROMPT-OPERARIA.md) | Instrução reutilizável para executar uma época com autonomia delimitada |
| [09 — Decisões e fontes](09-DECISOES-E-FONTES.md) | Precedência sobre decisões históricas, fontes consultadas e limites desta consolidação |
| [10 — CNPJ e ocorrências do edifício](10-CNPJ-E-OCORRENCIAS-DO-EDIFICIO.md) | Especialização de identidade jurídica, consultas, documentos, limites e testes |

## Sequência e dependências

| Época | Resultado funcional | Dependências obrigatórias |
|---|---|---|
| 00 | Baseline reconciliado e registro de execução | Nenhuma |
| 01 | Interface organizada, acessível e fiel à identidade | 00 |
| 02 | Caderno evolutivo, backup e mídia local confiáveis | 00; usar componentes de 01 |
| 03 | Entrada por formulário, link, compartilhamento e imagem | 01–02; integrações condicionais isoladas |
| 04 | Cobertura municipal, identificação e dados com precisão | 00–02 |
| 05 | Orçamento completo e cenários de compra/aluguel | 01–02; 04 apenas para referências externas |
| 06 | Edifício, linha do tempo e documentos apresentados | 02; 04 para fatos cadastrais |
| 07 | Rua, infraestrutura e ambiente contextualizados | 04; 06 para cruzar licenças sem duplicar |
| 08 | Serviços próximos e mobilidade de rotina | 04; geometria/manifestos de 07 reaproveitados |
| 09 | Visitas repetidas, evidências e instrumentos de campo | 02; perguntas de 05–08 entram incrementalmente |
| 10 | Comparação, decisão, histórico e compartilhamento local | 05–06–09; camadas 07–08 opcionais |
| 11 | Leitura documental/extração assistida com rastreabilidade | 03–06; serviço remoto só se autorizado |
| 12 | Conta/sincronização/colaboração e comunidade controladas | 02–10; depende de decisão de operação remota |
| 13 | Ofertas, créditos, profissional e contratos de serviço | 05–10; 12 somente para entrega remota |
| 14 | Versão ampla validada e decisões de lapidação | Revisão de todas as anteriores e seus bloqueios |

**Ordem padrão de execução: 00 → 01 → … → 14.** Independência na tabela permite continuar trabalho útil quando uma integração de outra época estiver bloqueada. Não exige desenvolver várias épocas ao mesmo tempo nem autoriza iniciar a seguinte sem que o pedido da sessão inclua esse avanço. A etapa 09 manual pode começar após 02, mas a saída consolidada reúne as perguntas disponíveis.

Não há calendário fictício por dia. Cada época se divide em unidades com ID `EPxx.nn`, que devem ser pequenas o suficiente para revisar e testar separadamente. A IA registra estimativa restante após a primeira unidade, com dependências reais de dados/aparelhos/pessoas.

## Crivo mínimo: largo em possibilidades, rigoroso em afirmações

Uma capacidade entra no produto quando passa por **identidade, fonte/direito, escala/tempo, semântica, privacidade, teste e experiência**. Uma integração bloqueada permanece no catálogo e no relatório, com motivo e alternativa; não aparece como um cartão com número simulado.

Estados de execução: `não iniciado`, `em execução`, `concluído e verificado`, `parcial`, `bloqueado por dependência`, `substituído por decisão`. Estado da base: disponível, parcial, desatualizada, indisponível ou não aplicável. São dimensões diferentes.

Uma época só é “concluída” quando todas as entregas do escopo selecionado foram verificadas. Se houver pendências, registrar **“núcleo concluído; integrações X pendentes”** e manter a época parcial. Um adaptador falso, um botão sem operação, mocks ou um roteiro manual não certificam integração automática.

## Estado de partida

O checkout já possui mudanças em andamento. Há código de caderno v2, extrator, compartilhamento nativo, índice de cinco bairros, A Rua, custos, dossiê, visita e comparação. Os registros anteriores documentam T01/E01/E04 do lote A e R00 da assinatura nas mensagens. A época 00 verifica esses resultados; não os reimplementa.

A navegação principal atual tem Explorar, Dossiê, Comparar e Visita, com Salvos como acesso de caderno. O dossiê tem Destaques, Entorno e Edifício. Essa estrutura é a base da organização ampla, não um obstáculo a contornar com novas abas para cada base.

## Critério de término da versão ampla

Todos os IDs F01–F80 possuem destino, implementação verificável ou dependência registrada; os fluxos locais essenciais funcionam ponta a ponta; as camadas habilitadas têm evidência auditável; as capacidades condicionais não são anunciadas como prontas. A época 14 entrega uma lista separada de funções a manter, juntar, melhorar, ocultar ou cortar, sem apagar histórico pessoal. Não reduzir previamente o portfólio só porque a utilidade ainda é hipótese.
