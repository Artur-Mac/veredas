# 04 — Fraquezas, dependências e plano estratégico

**Posição em 21/10/2026.** Leitura atual do código, pesquisa externa e referência explícita aos testes do lote anterior. Severidade e prioridade são julgamento de produto, não pontuação estatística.

## 1. Fraquezas que mais ameaçam o produto

| Prioridade | Fraqueza e evidência | Consequência | Resposta proposta | Evidência para encerrar |
|---|---|---|---|---|
| P0 | Público e disposição a pagar não demonstrados por pesquisa nesta rodada ou nos artefatos citados | Construir para uma persona imaginada | Descoberta com buscas ativas e teste de oferta | Episódios reais, retorno e compromissos registrados |
| P0 | Precisão do endereço pode ser confundida com precisão da evidência; `NV_GEO_COORD` não acompanha o objeto normalizado do geocodificador | Atribuir contexto de outra escala ao prédio | Preservar metadados e revisar apresentação de distância | Fixtures de níveis 1–6, ambiguidades e regressão do índice |
| P0 | Dados antigos e escalas misturadas podem parecer observação atual da porta | Confiança maior que a evidência permite | Data de referência separada de atualização e alcance espacial explícito | Exemplos de 2022/setor e de rua sem número corretamente rotulados |
| P1 | Cobertura inicial de cinco bairros, com 1.879 dos 2.688 prédios em Boa Viagem | Viés de cobertura e pesquisa de público | Exibir cobertura antes do esforço; oferecer valor sem identificação | Pessoa fora da área conclui custos, notas e perguntas |
| P1 | Produto local preserva privacidade, mas depende do armazenamento/aparelho | Perda por limpeza, troca ou reinstalação | Investigar exportação/importação com validação e restauração local | Ensaio de recuperação com caderno antigo; não adicionar nuvem por conveniência |
| P1 | APIs/sensores têm capacidades diferentes entre web, Android e iOS | Prometer função que não opera no aparelho do público | Matriz de capacidade e experimento em aparelhos reais | Registro por modelo/versão/permissão, sem simulação apresentada como campo |
| P1 | Proposta de negócio ainda não mede manutenção de dados nem suporte | Margem aparente com custo humano oculto | Medir custo por caso resolvido | Economia por coorte/oferta, incluindo falhas e reembolso |
| P1 | Interface com fonte 200% mostrou problemas de cabeçalho/dock no lote A | Barreiras de leitura e navegação | Tarefa isolada de acessibilidade, sem misturar com novo dado | Capturas examinadas e navegação por teclado/leitor |
| P2 | Parceiro vendedor pode pagar e influenciar o dossiê | Perda da independência percebida | Separação de evidência, publicidade e acesso às notas | Termo claro e teste de confiança com usuários |
| P2 | Documentação contém promessas históricas mais amplas que o app comprovado | Comercial vender “perícia” ou sensores como disponíveis | Inventário de afirmações sustentadas, por versão | Cada promessa ligada a capacidade e validação concreta |

A concentração de cobertura é calculada a partir dos índices locais. Problemas visuais citados vêm do [registro anterior](../melhorias-2026-10-20/06-EXECUCAO-LOTE-A.md), não de uma nova sessão visual. A assinatura desta rodada foi testada funcionalmente, sem nova certificação visual completa.

O README histórico chama o celular de instrumento de perícia; o fluxo atual de ruído em `NoImovel.tsx` e `Resumo.tsx` registra percepção. Não apresentar isso como decibelímetro calibrado. É um exemplo concreto de por que as promessas precisam acompanhar o código.

## 2. Dependência não é apenas fornecedor pago

| Dependência | O que pode quebrar | Estratégia proposta | Comportamento quando falhar |
|---|---|---|---|
| IBGE/Prefeitura | URL, esquema, arquivo parcial, periodicidade | Snapshot com hash, validação e publicação atômica | Manter última versão íntegra, mostrar referência; não zerar resultados |
| Geocodificação | Rua renomeada, número ambíguo, ponto agregado | Associação explicável com precisão separada e auditoria | Pedir endereço ou oferecer continuação sem prédio |
| Receita/CNAE | Formato do identificador e classificação, volume, local de atividade diferente | Parser por versão e mapa de categorias revisado | Desabilitar camada afetada; preservar caderno e outras evidências |
| GTFS | Feed fora de vigência, licença incerta, horários inconsistentes | Manifesto de licença e calendário validados | Sem frequência numérica até recuperação |
| OSM/serviços públicos | Rate limit, política de uso e cobertura desigual | Recorte licenciado e processamento local quando cabível | Lista sem mapa/rota; não bloquear decisão |
| Portal de anúncios | Bloqueio, HTML alterado, ausência de número | Entrada manual/texto compartilhado preservada | Permitir correção e não interpretar falha de importação como imóvel inválido |
| Sistema operacional/Expo | Permissões, APIs indisponíveis, mudanças nativas | Adaptadores por capacidade, builds testados, versões fixadas | Roteiro manual; não pedir permissões desnecessárias |
| WhatsApp | App ausente ou abertura falha | Texto copiável e editável | Copiar manualmente; nenhuma tentativa automática de envio |
| Prestador de pagamento futuro | Tarifas, indisponibilidade e conciliação | Contrato separado do conteúdo, idempotência e registro auditável | Não duplicar cobrança; regras definidas antes de habilitar |
| Conhecimento concentrado na equipe | Apenas uma pessoa sabe atualizar bases | Runbook curto e reprodução por outro membro | Identificar responsável substituto e última versão recuperável |

Não confundir dados abertos com SLA, gratuidade de infraestrutura ou licença de qualquer serviço que os exponha. A [política do Nominatim](https://operations.osmfoundation.org/policies/nominatim/) ilustra a diferença entre uma base aberta e a capacidade limitada de um endpoint público.

### Manifesto mínimo de uma nova camada

`fonte`, `url`, `licenca`, `referenciaTemporal`, `coletadoEm`, `publicadoEm`, `hash`, `versaoDoParser`, `escalaEspacial`, `camposUsados`, `cobertura`, `errosDescartados`, `criterioDeAssociacao` e `estadoDaAtualizacao`. Datas ausentes ficam ausentes. “Atualizado hoje” não substitui “dados do Censo 2022”.

Separar atualização do app de atualização dos dados. Rejeitar arquivos inválidos antes de substituir a última versão. Definir orçamento de tamanho/tempo por camada após medir o bundle atual; uma feature deve justificar os bytes e a manutenção que adiciona. Não consultar fontes externas na abertura de cada cartão só porque existe uma API.

### Política de saída de fornecedores

Antes de contratar, demonstrar exportação dos dados que podemos manter, reconstrução do índice sem o fornecedor, limite de despesas e substituição do adaptador. Proibir chaves secretas no bundle. Contrato que impede persistência pode inviabilizar uma feature offline mesmo com preço baixo. Documento de licença deve acompanhar a versão; migração de fornecedor não apaga a origem dos resultados antigos.

## 3. Refinamentos que podem valer mais que novos mapas

1. **Pendência com próximo passo:** ligar cada informação incompleta a pergunta, documento ou observação concreta, com origem da resposta.
2. **Resumo de decisão em casal/família:** escolher explicitamente quais custos, perguntas e observações compartilhar; notas privadas ficam selecionáveis, não implícitas. Arquivo/link é etapa posterior com decisão de privacidade.
3. **Cenários de custo:** separar valor informado de hipótese editada pela pessoa; evitar preencher desconhecidos silenciosamente. Pode ajudar sem localizar prédio.
4. **Trajeto de rotina:** conferência de portão, travessia, calçada e acesso ao serviço escolhido. Não chamar uma distância radial de minutos caminhando.
5. **Visita em dois horários:** lembrar dentro do roteiro que movimento muda. Notificação recorrente é opção futura, não ativada por esta documentação.
6. **Pedido documental simples:** registrar o que foi solicitado, recebido e ainda não conferido; o valor é organizar a conversa, não interpretar estrutura por IA.

Selecionar no máximo duas dessas hipóteses após a pesquisa. Aumentar a quantidade de abas agora pode diluir o fluxo principal.

## 4. Sequência de investimento

| Etapa proposta | Trabalho | Entrega para decisão | Condição de avanço |
|---|---|---|---|
| Agora | Assinatura da mensagem, documentação e EDA | Esta rodada | Concluída, sem iniciar outras implementações |
| Descoberta | Entrevistas, observação de busca e auditoria de precisão | Segmento prioritário e lista de erros/necessidades | Uso concreto e problemas reproduzíveis |
| Refinamento | Uma pendência documental e/ou roteiro manual de conectividade | Fluxo utilizável offline | Aceite com usuários e preservação de dados |
| Experimentos de dados | CNPJ e GTFS separados, sem publicação automática | Cobertura, acerto, licença e custo medidos | Evidência adicional útil para decisão |
| Viabilidade comercial | Oferta delimitada e custos reais | Decisão sobre cobrança | Aprovação de modelo/condições e sinais de compra |
| Expansão | Novo bairro/cidade ou B2B | Caso de negócio | Qualidade e atualização repetíveis, suporte sustentável |

Os esforços do backlog são estimativas de planejamento, sem prazo prometido. Entrevistas e ensaios em aparelhos são dependências externas reais; não devem ser “concluídos” por uma IA escrevendo resultados esperados.

## 5. Decisões que continuam abertas

Escolher responsável por descoberta, autorizar recrutamento e orçamento de incentivos; definir primeiro segmento após dados de campo; decidir se haverá armazenamento de documentos; escolher destino de teste ativo de rede; validar licenças específicas das novas camadas; aprovar oferta e regras de cobrança antes de implementá-las. A leitura desta lista não bloqueia pesquisa local ou correções independentes já autorizadas, nem autoriza contato, gasto ou infraestrutura remota.
