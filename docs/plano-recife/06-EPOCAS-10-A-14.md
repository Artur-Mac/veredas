# 06 — Épocas 10 a 14: decisão, assistência e operação

O plano descreve integrações remotas para que possam ser preparadas corretamente. Não autoriza contratar, publicar, cobrar, transmitir documentos, enviar mensagens ou criar infraestrutura. Preparar interfaces, testes locais e sandbox; bloquear apenas a ativação que depender dessas decisões.

## Época 10 — Comparar, decidir e compartilhar

**Capacidades:** F26, F29, F63, F68–F72. **Depende:** 05–06–09; 07–08 enriquecem quando disponíveis. **Locais:** comparação, Salvos, `src/dados/mensagem.ts`, derivadores de perguntas e novos exportadores.

### EP10.01 — Comparação de dois e três imóveis

- Reusar comparação existente; terceiro imóvel é opt-in. Grupos: orçamento, rotina, edifício/documentos e visita. Mesma categoria, horizonte, unidade e status de informação em cada linha.
- Prioridades escolhidas pela pessoa ordenam assuntos, sem somar tudo em score ou eleger vencedor. Diferença calculada só quando valores comparáveis; conhecido parcial não é menor custo total.
- Aceite: compra×aluguel, três imóveis, falta de IPTU, áreas distintas, documentação de datas diferentes e ausência de prédio. Em 360 px, leitura continua possível sem três colunas minúsculas.

### EP10.02 — Histórico, decisão e pós-mudança

- Snapshot de anúncio a cada reimportação confirmada; registrar campo anterior/novo, origem e data. Não criar crawler/polling de portal sem autorização.
- Estados pessoais propostos: considerando, visita planejada, visitado, escolhido e descartado. Descarte é reversível, distinto de apagar dados. Motivo opcional e privado.
- Diário pós-mudança compara expectativa registrada com experiência datada; não transforma opinião em fato público. Preservar resposta anterior quando revisão muda decisão.
- Aceite: restaurar descartado, anúncio removido, preço alterado manualmente e múltiplas visitas. Escolha de um imóvel não apaga os demais.

### EP10.03 — Mensagem, resumo e PDF

- Gerador seleciona perguntas pendentes, evita duplicatas e inclui assinatura VEREDA por padrão, editável. Prévia mostra exatamente o que será copiado/compartilhado. Nenhum envio automático.
- Exportar texto/PDF selecionável com custos conhecidos/pendências, informações escolhidas, fontes e datas. Notas privadas e anexos ficam desmarcados; não embutir documento inteiro por conveniência.
- Criar PDF legível com paginação, texto selecionável e links quando suportados; validar nomes longos, listas extensas e documento sem dados. Marca não encobre informação.
- Aceite: cancelar compartilhamento não marca enviado; pergunta respondida sai da sugestão sem apagar histórico; exportação offline funciona; assinatura permanece na sugestão após restauração padrão, mas edição voluntária é respeitada.

### EP10.04 — Lembretes e correções

- Lembrete local opt-in por visita/pendência, com timezone, permissão e cancelamento. Editar horário cancela/substitui agendamento anterior, não duplica notificações. Sem permissão, pendência continua no caderno.
- Correção local anota qual fato foi contestado, motivo e evidência; não altera a fonte pública. “Enviar correção” só existe quando canal/operação estiverem implementados; rascunho local não diz “enviado”.
- Aceite: recusa de notificação, análise descartada/excluída, mudança de horário e correção contra fonte atualizada. Saída: decisão auditável e compartilhamento orgânico ligado à marca, sem exposição involuntária.

## Época 11 — Extração assistida e consultas documentais

**Capacidades:** F13–F14, F35, F37–F39. **Depende:** 03–06. **Arquitetura:** adaptadores isolados e schema de proposta; nunca LLM como autoridade do caderno.

### EP11.01 — Corpus e avaliação antes do modelo

- Criar corpus local autorizado/sintético com anúncio, ata, balancete, laudo e certidão; separar dados pessoais e conjunto de avaliação. Anotar manualmente campos, trechos e páginas de referência.
- Medir precisão/recall por campo, erro monetário, cobertura de citação e abstenção. Metas propostas para piloto assistido: 100% dos campos publicados com trecho localizável; nenhum valor sem revisão; ≥95% de precisão nos campos críticos no corpus e nenhum erro de sinal/unidade tolerado sem bloqueio da extração correspondente. Registrar tamanho e limites; não vender isso como acurácia universal.
- Testar instruções maliciosas dentro do documento: texto extraído é dado, nunca comando para acessar rede, apagar arquivo, transmitir conteúdo ou alterar cobrança.

### EP11.02 — OCR e LLM com revisão obrigatória

- OCR local primeiro quando suportado; modelo remoto opcional recebe somente conteúdo escolhido após mostrar fornecedor, finalidade, retenção e custo. Sem autorização, conservar fluxo manual/local.
- Saída estruturada por schema, trechos/páginas e campos ausentes. Validar formato, unidade, soma e identidade; conflito exige revisão. Não gerar parecer jurídico/estrutural ou preencher lacuna com conhecimento genérico.
- Implementar orçamento de tokens/páginas, timeout, cancelamento e idempotência. Chaves fora do cliente; erros não disparam fornecedor alternativo com política diferente.
- Aceite: PDF escaneado, tabela partida, documento ilegível, prompt injection, página ausente, alucinação de cifra e cancelamento. Nenhum resultado vira fato confirmado sem ação da pessoa; reprocessar conserva revisão anterior.

### EP11.03 — Consultas cadastrais/judiciais autorizadas

- Aplicar contratos, taxonomia e nove casos de aceite do [adendo de CNPJ e ocorrências](10-CNPJ-E-OCORRENCIAS-DO-EDIFICIO.md). Preservar polo do condomínio, vínculo ao empreendimento, natureza da evidência e tipos de valores; não transformar quantidade de processos em nota de risco.

- Serpro, ONR/Docket, JUDIT ou equivalente: validar endpoint e busca permitida, cobertura de CNPJ/Recife, contrato, custo por consulta, retenção, licença e mecanismo de correção. Não presumir que DataJud permite busca por nome/parte nem que CIB/SINTER é aberto.
- Consultar identidade confirmada e retornar origem, data e alcance. Processo judicial é registro processual, não condenação, dívida certa ou culpa. Não fazer busca por CPF de proprietário/morador.
- Aceite em sandbox autorizado: sem resultado, homônimo, processo sigiloso/indisponível, duplicatas, erro tarifado e revogação. Limitar deduplicação por identificador processual legítimo, preservando fases distintas.
- Saída: relatório de precisão/custo por caso, fluxos manuais intactos e lista de integrações ainda sem acesso. Não marcar época concluída integralmente sem verificar as consultas selecionadas.

## Época 12 — Conta opcional, colaboração e comunidade

**Capacidades:** F72–F75. **Depende:** 02–10; operação remota é decisão explícita. **Implementar primeiro:** contratos e simulador local de sincronização; não criar infraestrutura automaticamente.

### EP12.01 — Contrato de sincronização e identidade

- Conta opcional associa cópia privada do caderno após prévia de volume/conteúdo. Dados locais continuam acessíveis sem login/rede. Anexos só são enviados se selecionados.
- Protocolo: ID estável, revisão base, ID idempotente de operação, fila local e confirmação do servidor. Conflitos preservam versões; não usar último horário do dispositivo como vencedor de notas.
- Exclusão sincronizada usa marcador/tombstone com política de retenção definida; dispositivo offline não ressuscita item apagado. Logout não destrói caderno sem ação separada.
- Aceite local com transporte simulado: dois dispositivos alteram mesma nota, relógio errado, envio repetido, falha após confirmação, exclusão offline e reconexão. Validação local não equivale a servidor seguro entregue.

### EP12.02 — Operação remota e autorização

- Antes da ativação, escolher operador/hosting, região, custo, backups, política de retenção, suporte, autenticação e exclusão. Registrar decisão concreta, sem contratar nesta execução documental.
- Implementação autorizada deve aplicar controle por proprietário em cada consulta/arquivo, tokens seguros, limites, logs minimizados e ensaio de recuperação. Nunca confiar em ID enviado pelo cliente para conceder acesso.
- Aceite: usuário A não lê/altera dados de B; URL de arquivo não público; token expirado/revogado; exclusão/exportação e recuperação testadas. Fazer revisão de segurança antes de dados reais.

### EP12.03 — Colaboração privada e links

- Papéis separados: proprietário, colaborador autorizado e leitor de resumo. Notas pessoais são privadas por padrão; compartilhar análise não implica compartilhar todos os anexos.
- Link selecionável tem token não previsível, expiração e revogação. Explicar que revogar acesso futuro não apaga cópia que destinatário já guardou. Convite é criado/preparado, nunca enviado automaticamente.
- Aceite: retirar permissão, editar depois de compartilhar, acesso anônimo não permitido, colisão de edição e expiração. Sem backend autorizado, exportação estática da época 10 permanece alternativa; link revogável continua pendente.

### EP12.04 — Comunidade e contestação pública

- Publicação voluntária separada do caderno. Campos estruturados: assunto, período, frequência percebida e contexto; não aceitar denúncia identificável como fato confirmado. Mostrar natureza de relato.
- Propor agregação somente com pelo menos cinco contribuições independentes no recorte e após avaliar reidentificação; limiar é proteção inicial, não prova de anonimato/veracidade. Deduplicação não deve exigir dados pessoais excessivos.
- Exigir operação real de moderação, canal de contestação, prazo de tratamento, antispam e remoção antes de publicar. Sem equipe/processo, apenas formulário privado experimental; não habilitar mural público.
- Aceite: relato único, duplicado, endereço identificável, conteúdo ofensivo, pedido de correção e remoção. Não premiar confirmação de prédio nem aumentar “confiança” automaticamente por volume de relatos.

## Época 13 — Ofertas, créditos e uso profissional

**Capacidades:** F76–F78. **Depende:** 05–10; 12 quando houver serviço remoto. **Objetivo:** testar modelos econômicos sem comprometer independência da evidência.

### EP13.01 — Custos unitários e catálogo de ofertas

- Instrumentar contadores locais/sandbox de consultas, páginas, armazenamento e tempo assistido; preço de fornecedor tem data, moeda, impostos, franquia e restrição de cache. Validar preço atual antes de uso, sem copiar tabela antiga como cotação vigente.
- Planilha/derivador de economia: receita líquida − taxas de pagamento − APIs − armazenamento/egresso − suporte − reembolso esperado. Separar custo marginal e fixo; fazer cenários baixo/base/alto por volume, câmbio e taxa de uso.
- Catálogo experimental: avulso por análise enriquecida; pacote por busca de moradia; assinatura profissional por uso recorrente; serviço assistido/realocação. Não lançar todas as opções simultaneamente. Caderno próprio e revisão de notas não ficam bloqueados por expiração de crédito.
- Aceite: custo maior que receita alerta equipe, não muda preço cobrado silenciosamente; oferta mostra entregável, limites, validade e reembolso antes de compra. Preços são hipóteses até decisão comercial documentada.

### EP13.02 — Ledger e pagamento em sandbox

- Preservar carteira local atual até migração aprovada; ela não representa saldo financeiro autenticado. Não importar saldo de backup como crédito comprado.
- Ledger remoto, quando autorizado, é autoridade; estados pendente/confirmado/consumido/estornado com evento idempotente. Webhook assinado validado no servidor; retorno de checkout no cliente não libera crédito sozinho.
- Confirmação deliberada mantém cobrança única. Duplo toque/reenvio/reabertura não debita novamente; falha de consulta segue regra explícita de consumo/estorno. Não alterar regra histórica sem decisão específica.
- Aceite sandbox: webhook repetido/fora de ordem, timeout após pagamento, tentativa concorrente, saldo insuficiente e estorno. Dinheiro real fica desligado até aprovação de oferta, operação e testes.

### EP13.03 — Profissional, realocação e indicações

- Espaço profissional organiza casos/clientes com consentimento e separação de acesso; não converte caderno pessoal em CRM compartilhado automaticamente. Serviço assistido entrega escopo/tempo/responsável, sem fingir laudo de engenharia.
- Indicação a corretor/engenheiro/provedor é opt-in, com informação sobre remuneração. Não vender posição no dossiê nem alterar fatos para parceiro. Gerar resumo selecionado; envio permanece deliberado.
- Aceite: troca de cliente, revogação, nota privada, parceiro indisponível e interesse comercial declarado. Pesquisa de disposição a pagar não é autorização de contratação.

### EP13.04 — API institucional e B2G

- Definir piloto específico, destinatário e problema antes de endpoint. Contrato só inclui dados públicos licenciados e agregados aprovados; excluir notas, visitas, destinos e documentos pessoais.
- Preparar schema, limites, amostra sintética, documentação e política de atualização. Ativar requer direito de redistribuição, autenticação, rate limit, operação e contrato.
- Aceite: campos proibidos não aparecem na serialização; licença acompanha dataset; reconstrução de indivíduo/pequenos grupos é revisada; falha de parceiro não compromete app local.
- Saída: custos mensurados, ofertas prontas para decisão, sandbox verificável e dependências comerciais explícitas; sem cobrança ou infraestrutura criada por inferência.

## Época 14 — Validar a versão ampla e lapidar

**Capacidades:** F20, F79–F80; revisão F01–F80. **Depende:** revisão das épocas anteriores, inclusive bloqueios. Não chamar de versão integralmente concluída se houver capacidades selecionadas ainda pendentes.

### EP14.01 — Estudo de público e uso real

- Recrutar com consentimento segmentos separados: primeira locação, famílias mudando, compra para morar e profissional/realocação. Meta inicial proposta: 5–8 sessões por segmento relevante e até saturação prática, não amostra estatística representativa.
- Observar tarefas com dados da pessoa quando consentido: importar, entender custo, preparar visita, registrar resposta e decidir. Perguntar sobre decisão passada antes de demonstrar função; evitar pergunta sugestiva de intenção de compra.
- Instrumentação opcional/local: tempo até primeira análise útil, conclusão do roteiro, pergunta efetivamente esclarecida, retorno e comparação usada. Definir ativação nesta rodada como análise salva + revisão de custo ou pergunta em 24 h; registrar janela e denominador, sem exigir prédio encontrado ou dois imóveis.
- Não transmitir eventos remotos antes da política/operação. Autenticar ou reclassificar pesquisas internas antigas; não misturar seus percentuais com coleta nova.

### EP14.02 — Avaliação técnica ampla e campo Recife

- Executar suíte completa, smoke e matriz visual/nativa; comparar performance com época 00. Percorrer casos de cinco bairros iniciais e amostra dos novos, incluindo centro/periferia, limites e endereços incompletos.
- Conferir manualmente amostras de geocódigo/serviços, rota com ponte, fonte desatualizada, documento com data ausente, visita sem rede e recuperação de backup.
- Fazer ensaio de indisponibilidade de cada fornecedor habilitado e de corrupção do cache. Revisar dependências/licenças, custos e capacidade de desligar camada sem perder caderno.
- Aceite: nenhuma falha de perda de dados, exposição privada ou cobrança duplicada aberta. Outras falhas recebem gravidade, responsável e decisão de lançamento; não esconder pendência em contagem geral de testes.

### EP14.03 — Decidir manter, juntar, melhorar, ocultar ou cortar

- Para cada FID, registrar uso observado, utilidade relatada, custo de manutenção, erro/abstenção, compreensão, dependência e decisão. Não cortar só por baixa frequência em amostra sem oportunidade de uso.
- Unir funcionalidades que respondem à mesma pergunta; manter detalhes acessíveis para quem precisa. Remover cartão antes de remover dado pessoal; nunca apagar histórico porque módulo foi descontinuado.
- Gerar revisão 1.1 do plano com decisões e justificativas, preservando 1.0 e registros. Novas ideias recebem novos IDs; IDs antigos não são reciclados.
- Saída final: matriz de prontidão por plataforma/Recife/capacidade, limitações públicas honestas, custos de operação, backlog de correções e proposta de próxima rodada. Não iniciar expansão geográfica automaticamente.
