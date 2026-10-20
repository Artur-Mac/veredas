# VEREDA — Plano de execução da prova de conceito

Atualizado em 19/10/2026. Este é o documento de continuidade do agente, escrito a partir do pedido atual do usuário. Plataforma confirmada: **web e celular, em Expo, sem cadastro obrigatório**.

## Mandato

Construir um aplicativo efetivo a partir do protótipo, com autonomia criativa, excelente experiência de uso e épocas pequenas verificáveis. É uma **prova de conceito interna e educacional, sem uso ostensivo, comercial ou financeiro nesta fase**. O objetivo é testar a jornada, as integrações e a utilidade; não construir uma operação de produção antes de validar o núcleo.

O usuário autorizou consultar inclusive `ignorar/`. A proibição histórica do README não se aplica a esta investigação. Recuperar ideias úteis desses arquivos não implica restaurar automaticamente as decisões antigas. A única referência de design e experiência de uso é `/home/v/Documents/vereda/veredas/index.html`, conforme determinação explícita do usuário em 19/10/2026. O pitch e seus arquivos de motion continuam com regras próprias e não foram alterados.

## Referência exclusiva de design e experiência — decisão do usuário

**Fonte única: `/home/v/Documents/vereda/veredas/index.html`.** Isso abrange a interface completa e sua experiência de uso: composição, hierarquia, navegação, organização das telas, componentes, interações, responsividade, espaçamento, tipografia, cores e identidade. Não basta reaproveitar a paleta e as fontes: o app deve seguir a linguagem visual e os padrões de experiência desse arquivo.

Os outros protótipos, `docs/mock/`, a interface atual de `src/`, screenshots antigos, documentos de marca, materiais em `ignorar/` e sugestões de skills **não são referências alternativas de design ou UX**. Podem contribuir com funcionalidades, pesquisa, dados, arquitetura e código reutilizável, mas não substituir nem disputar a direção definida em `index.html`. Em qualquer conflito visual ou de experiência, prevalece esse arquivo.

Antes de implementar ou revisar uma tela, abrir e inspecionar a tela ou interação correspondente em `index.html`. Para funcionalidades sem equivalente, derivar a solução dos componentes e padrões desse mesmo arquivo. A autonomia criativa vale dentro dessa direção. A interface implementada na primeira entrega também deve ser avaliada contra essa referência; não se torna referência por já existir. Registrar adaptações necessárias para web, celular e acessibilidade, preservando a intenção visual e de interação.

## Diagnóstico que orienta a execução

- Já existe um app Expo com navegação, cinco dossiês estáticos, mapa, fontes, comparação e roteiro de visita. Reaproveitar componentes e rotas; não criar uma segunda aplicação paralela.
- O fluxo anterior em `src/app/ler.tsx` reconhecia palavras na URL e, por padrão, abria Boa Viagem depois de uma animação. Isso não é extração nem resolução cadastral. Links comuns agora abrem uma análise para preenchimento; os estados encenados continuam restritos ao painel de referência.
- Os dossiês locais servem para explorar a visão de produto. As novas análises são dados do usuário, persistidos separadamente. Não copiar cadastros municipais de um imóvel para outro.
- A identidade do app usava Archivo e fundo cinza. A base passou a papel, Fraunces, Plus Jakarta Sans e JetBrains Mono, com arquivos de fonte locais e licenças.
- PostGIS, extração universal, sensores calibrados e modelos de sol não estão demonstrados pelo simples fato de haver telas. Documentação antiga é hipótese até confronto com código e teste.

## Fontes examinadas e decisões

| Material local | Aproveitar | Não assumir |
|---|---|---|
| `index.html` | Única referência de design e UX: interface, composição, navegação, componentes, interações e responsividade, além da marca | Que os resultados de interface são calculados por serviços reais |
| `docs/VEREDA_DOCUMENTO_DEFINITIVO.md` | Jornada pós-anúncio; edifício/anúncio/usuário; fonte por evidência; dúvidas acionáveis | Que todas as 15 telas equivalem a integrações concluídas |
| `docs/AVALIACAO_CRITICA_ESTADO_ATUAL_E_OPORTUNIDADES.md` | Obras próximas, custo por parcelas, roteiro de campo | Valores de energia, riscos ou condições prediais como fatos sem implementação |
| `ignorar/docs/VEREDA_IMPROVEMENT_ROADMAP_EPOCHS.md` | Organização em épocas e ideias funcionais de checklist, comparação e caderno; sem importar design ou UX | Preço riscado acusatório, São Paulo como cidade padrão, tipografia alternativa |
| `ignorar/research/summaries/stage2_executive_playbook.md` | Preferências explícitas, evidência → contexto → ação; laboratório de anúncios | Scores agregados ou inferências apresentadas como certeza |
| `ignorar/docs/pesquisa-viabilidade/SINTESE.md` | Investigação de vínculo cadastral e limitações de escala | Transferir taxa de sucesso de pesquisa histórica para uma integração ainda ausente |
| `src/`, `tests/`, `docs/mock/dossies/` | Base funcional existente e contratos tipados | Confundir fixture com coleta atual |

Leitura dirigida dos materiais acima, não auditoria integral de cada arquivo ou verificação independente de cada afirmação da pesquisa.

## Prioridades

| Funcionalidade | Valor para testar a proposta | Esforço relativo | Decisão |
|---|---|---|---|
| Entrada manual e link guardado | Muito alto | Baixo | Primeiro fluxo operacional |
| Persistência, reabrir, editar e excluir | Muito alto | Baixo | Núcleo obrigatório |
| Custos por parcela, IPTU anual / 12 | Alto | Baixo | Calcular apenas com valores informados |
| Dúvidas automáticas e checklist | Alto | Baixo | Conectar lacuna à visita |
| Comparação de dois imóveis | Alto | Baixo | Sem nota ou recomendação automática |
| Texto do anúncio / extração assistida | Alto | Médio | Próxima época; confirmação humana dos campos |
| Uma fonte cadastral + confirmação de prédio | Muito alto | Médio/alto | Depois da entrada funcionar |
| Preferências e motivos de descarte | Médio | Baixo/médio | Depois de validar a jornada |
| Scraping ZAP amplo | Incerto | Alto | Opcional; nunca pré-requisito do app |
| Sol 3D, acústica em dB, clima preditivo | Incerto nesta etapa | Alto | Adiar |
| Login, pagamentos, créditos comerciais | Baixo nesta etapa | Médio/alto | Fora do núcleo da POC |

## Épocas e critérios de saída

### Época 0 — Fundamento verificável

Objetivo: preservar o protótipo, auditar o que é funcional e organizar o projeto.

Entregas: este documento; identidade central alinhada; fontes locais; baseline de testes; inventário do que é referência. Não reescrever o pitch nem apagar trabalho prévio do usuário.

Saída: app inicializa, tipos e lint passam, fluxo existente continua acessível.

### Época 1 — Caderno de imóveis utilizável

Objetivo: alguém consegue usar o app com um imóvel próprio.

Entregas: link ou entrada manual; nome/região; aluguel/compra; área; custos; armazenamento local com validação; reabertura; edição; exclusão com confirmação; estado vazio e falha de gravação visíveis.

Saída: criar dois imóveis, recarregar a página, editar um deles e comprovar que continuam distintos. Link desconhecido nunca produz um dossiê municipal emprestado.

### Época 2 — Da informação à visita

Objetivo: transformar os dados em ações claras.

Entregas: subtotal mensal calculado; IPTU mensalizado; desconhecido diferente de zero; preço de compra separado de despesas mensais; dúvidas derivadas de lacunas; checklist, notas e mensagem copiável; comparação lado a lado.

Saída: alterar um custo muda o subtotal; nenhuma parcela desconhecida vira zero; progresso persiste; copiar mensagem não envia nada. Compra e aluguel recebem contexto diferente.

### Época 3 — Entrada assistida e primeira evidência externa

Objetivo: reduzir digitação e demonstrar uma integração real pequena.

Sequência: importar texto ou HTML salvo; extrair campos com regra/JSON-LD; mostrar revisão antes de salvar; preservar origem e momento da coleta. Depois, conectar uma base de Recife com endereço/código cadastral e confirmação humana. Se a fonte falhar, manter os campos manuais e o caderno funcionando.

Contrato sugerido: `ExtracaoAnuncio` (URL, coletadoEm, campos, lacunas); `Edificio` (id, DSQFL opcional, geometria, evidencias); `Analise` (dados informados e estado privado). Cada evidência contém valor, unidade, fonte, data, recorte e condição de confirmação. Não presumir que a unidade foi identificada só porque o lote foi.

Saída: demonstrar um anúncio suportado e um não suportado; uma resposta de dados real e uma indisponibilidade; nenhum segredo embutido no cliente; fixtures reproduzíveis para regressão.

### Época 4 — Contexto e preferências

Objetivo: tornar a comparação pessoal sem julgamento opaco.

Entregas candidatas: orçamento informado, destinos recorrentes, preferências explícitas, etapa da busca, motivo de descarte; obras próximas se houver integração comprovada. Ordenar pelas prioridades escolhidas e explicar cada diferença.

Saída: pessoa consegue explicar por que preservou ou descartou uma alternativa usando seus próprios critérios.

### Época 5 — Acabamento e validação com pessoas

Objetivo: demonstrar a POC de ponta a ponta com qualidade.

Entregas: revisão de foco/teclado, contraste e áreas de toque; teste a 375 px, desktop e celular físico; redução de movimento; erros e retorno à navegação; roteiro de demonstração; cinco sessões curtas de uso com registro de dificuldades.

Saída: fluxos centrais sem becos sem saída; evidências visuais e testes registrados; limites de integração descritos sem exigir leitura de documentação para operar a interface.

## Direção de design e experiência

As diretrizes abaixo são auxiliares e subordinadas à referência exclusiva `/home/v/Documents/vereda/veredas/index.html`. Não constituem um novo briefing visual nem autorizam substituir sua experiência por outro protótipo.

- A personalidade vem da tipografia e do ritmo: títulos Fraunces, corpo Plus Jakarta Sans, números JetBrains Mono. Papel `#F2EBDD`, tinta `#171717`, ação laranja `#F47745`, ferrugem `#B94E36`, azul `#2E5A85`.
- Formulários com rótulo permanente, área de toque confortável, leitura em uma coluna no celular e largura controlada no desktop. Nunca navegar enquanto a pessoa ainda está digitando.
- Um resultado principal por bloco. Primeiro conhecer o imóvel, depois entender custos, depois preparar a visita.
- Não tentar impressionar com animações de processamento inexistente. Cada botão precisa executar uma ação ou explicar uma dependência real.
- Fonte detalhada fica disponível junto à evidência; o caderno usa a atribuição simples “informado por você”. Regras de avisos do pitch não redefinem a procedência dos dados do app.
- Custo ausente é “a confirmar”. Compra não inclui preço total na mensalidade. Evitar nota global, selo de qualidade e julgamento de bairro/imóvel.

## Scraping: opção delimitada

O usuário mencionou um scraper parcial do ZAP em Documentos e autorizou considerá-lo se necessário. **Não foi necessário para a primeira entrega.** Uma busca inicial por nomes de arquivos contendo `zap`/`scrap` em Documentos não encontrou um candidato; isso não prova ausência. Antes de integrar, localizar por diretórios e README sem varrer credenciais ou arquivos pessoais sem relação com o projeto.

Se útil, reaproveitar o scraper em lote pequeno, com cache e fixtures locais, para uso interno e educacional, sem operação comercial/financeira. Começar com URLs fornecidas e conteúdo público; registrar falhas e interromper diante de bloqueio de acesso, sem tornar contorno de CAPTCHA requisito da POC. Preferir importação de texto/HTML quando a coleta remota consumir mais trabalho que a funcionalidade valida. O propósito educacional orienta o escopo, não garante disponibilidade técnica de uma fonte.

## Prompt de continuidade para o agente

Você está implementando o VEREDA, uma prova de conceito interna e educacional, sem uso ostensivo, comercial ou financeiro nesta fase. Leia `docs/PLANO-POC-EXECUCAO.md`, `docs/POC-VALIDACAO.md` e o estado atual do código antes de editar. O usuário autorizou autonomia criativa e consulta à documentação arquivada em `ignorar/`. Priorize alto valor e baixa complexidade; adapte o plano quando houver evidência, registrando o motivo. Reuse Expo para web e celular, sem cadastro obrigatório. A ÚNICA REFERÊNCIA DE DESIGN E EXPERIÊNCIA DE USO é `/home/v/Documents/vereda/veredas/index.html`: siga sua composição, hierarquia, navegação, organização das telas, componentes, interações, responsividade, espaçamento, tipografia e cores, não apenas a marca. Abra e inspecione esse arquivo antes de implementar ou revisar interfaces. Outros protótipos, `docs/mock/`, a interface existente em `src/`, screenshots, documentos antigos, `ignorar/` e sugestões de skills não são referências alternativas de design ou UX; use-os somente como subsídio funcional ou técnico. Em caso de conflito visual ou de experiência, prevalece `index.html`. Para telas novas, derive a solução dos padrões desse arquivo. A autonomia criativa deve respeitar essa direção. Preserve o trabalho prévio e as regras locais de motion. Não confunda resultados demonstrativos com extração ou consulta implementada. Scraping pode ser usado se necessário para validação interna/educacional; procure primeiro o trabalho parcial do ZAP mencionado pelo usuário, mantenha amostra pequena e fluxo manual de reserva. Entregue uma época verificável por vez, com critérios de aceite, testes adequados e inspeção visual. Registre o que realmente funciona, o que permanece como referência e o próximo passo. Não faça deploy, envie mensagens ou compre serviços por inferência. Pergunte apenas quando a resposta mudar materialmente o produto ou desbloquear dependência; decisões reversíveis de implementação já estão autorizadas.

## Estado e próximo passo

A primeira fatia implementa o núcleo das épocas 0–2: caderno local, custos, comparação e preparação de visita. Validação detalhada em `docs/POC-VALIDACAO.md`. As épocas 3–5 são evolução planejada, não funcionalidades concluídas. Próximo incremento: revisão assistida de texto de anúncio, mantendo a entrada manual como base e preparando a primeira integração cadastral pequena.

**19/10/2026, 21h:** as épocas 3 a 5 foram consolidadas na v1.0. Escopo, matriz de viabilidade e o que fica manual: `docs/V1-ESCOPO-E-VIABILIDADE.md`. Execução por fatias para o operário externo: `docs/handoff/ORDEM_DO_ARQUITETO.md` (versão 2), com contratos em `src/dados/contratos.ts` e aceite em `tests/fixtures/`. A entrega da Época 3 feita às 21h00 foi auditada e não aprovada (dados cadastrais escritos à mão); detalhes na seção 0 da ordem.
