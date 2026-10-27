# Backlog de experiência — especificação executável

Prioridades: P1 = próxima rodada; P2 = depois da clareza básica. Todas as tarefas preservam os tokens do `index.html`. Caminhos são relativos à raiz. Estimativas e medidas de layout são propostas, ajustáveis após comparação visual; regras de dados e aceite não são opcionais.

## E01 · P1 · Escolha do prédio com ambiguidade explícita

**Problema:** um candidato fraco parece uma identificação precisa. **Dependências:** nenhuma; manter a confirmação e a carteira existentes.

**Arquivos de entrada:** `src/dados/recife/buscar.ts`, `src/componentes/predio/BuscaDePredio.tsx`, `src/componentes/predio/percurso.ts`, `src/componentes/predio/textos.ts`, `src/app/(abas)/predio.tsx`.

**Implementação proposta:**

1. Separar elegibilidade, classificação e apresentação. Acrescentar motivos estruturados internos: nome, rua, número, área, ano. Não derivar lógica pela comparação de frases em português.
2. Preservar a API atual ou adaptar seus consumidores explicitamente. Retornar metadados `totalCompativeis` e `resultadosLimitados` antes do corte de oito. Pontuação continua interna, nunca apresentada como percentual.
3. Quando houver somente área/ano, abrir estado “Precisamos de mais uma informação para localizar o prédio”, com campo rua/número ou nome; oferecer “Continuar sem identificar”. Mostrar candidatos em lista secundária explorável, sem selecionar automaticamente o primeiro como solução.
4. Com rua/número ou nome, mostrar candidatos e motivos legíveis. Exibir posição e permitir comparar alternativas sem repetir “não é este” várias vezes. Ausência de resultado deve manter busca editável e saída para o dossiê.
5. Na confirmação final, mostrar nome/endereço escolhidos, origem cadastral e efeito no crédito. Texto proposto: “Vou usar este prédio para consultar o cadastro. Confira o endereço antes de confirmar.” Remover a promessa de garantia.
6. Usar o mesmo mecanismo atual de cobrança idempotente. Não cobrar por busca, mudança de candidato, cancelamento ou continuação sem prédio.

**Aceite:** bairro+70 m² não apresenta confirmação direta como primeira ação; total real não é confundido com oito resultados; pessoa consegue continuar sem prédio; confirmação deliberada cobra uma vez; mudança de vínculo não mistura dados anteriores.

**Testes:** entrada sem endereço; nomes abreviados; rua com número divergente; empate; zero resultados; mais de oito resultados; andar incompatível; voltar após buscar; saldo zero; toque duplo. Na fixture controlada, afirmar contagem conhecida; não fixar 106 no teste de regra, pois a base pode mudar. Preservar testes de normalização existentes.

## E02a · P1 · Topo adaptativo e hierarquia do dossiê

**Arquivos:** `src/componentes/dossie-v1/Topo.tsx`, `InfoDoImovel.tsx`, `Custo.tsx`, `src/app/(abas)/dossie.tsx`.

**Mudança:** implementar duas apresentações sem foto: (a) sem prédio, cabeçalho textual compacto; (b) com prédio, miniatura do lote junto da identidade, abrindo o mapa existente. Remover o quadro vazio obrigatório. Manter voltar e salvar em áreas de toque acessíveis, sem depender de sobreposição à imagem. Área/endereçamento incompleto não deve produzir lacuna vertical.

**Composição proposta a 375 px:** identidade → resumo de preço/custo → abas → primeiro destaque. Fonte completa e chave cadastral ficam acessíveis pelas gavetas existentes. Meta de leitura: nome e pelo menos o resumo de custo no primeiro viewport útil, sem esconder dados com recorte fixo. Se texto ampliado impedir a meta, acessibilidade prevalece sobre altura.

**Aceite:** sem imagem e sem lote não há painel de aproximadamente 200 px vazio; todos os acessos existentes continuam presentes; nome de três linhas não sobrepõe controles; compra e aluguel mantêm rótulos diferentes; a página continua utilizável com texto a 200% na web.

**Verificação visual:** guardar capturas antes/depois para análise vazia, incompleta, confirmada e nome longo. Comparar com a hierarquia do protótipo, sem copiar valores fictícios. Conferir foco e ordem de leitura após compactar.

## E02b · P2 · Fotografias próprias, sem depender de extração dos portais

**Dependências:** E02a e decisão de armazenamento de mídia compatível com T02. `expo-image-picker` já está nas dependências; isso não significa que a persistência esteja pronta.

**Arquivos:** modelo em `src/dados/esquema.ts`/`analise.ts`, migração, editor e `Topo.tsx`; localizar o uso efetivo dos componentes antigos de galeria antes de reaproveitar código.

**Escopo inicial:** até cinco fotos escolhidas pela pessoa; capa, reordenação e remoção. No nativo, copiar para diretório persistente do app; na web, usar armazenamento de blobs com chave estável e fallback se indisponível. Não gravar base64 na lista principal do AsyncStorage nem depender da URI temporária do seletor. Metadados com ID, origem “adicionada por você”, dimensões e referência local. Remover metadados de localização quando viável no processamento de exportação. Não extrair imagens de portais nesta tarefa.

**Aceite:** fotografia permanece após fechar/reabrir; cancelamento de permissão não impede edição; arquivo ausente cai no modo compacto; exclusão não remove mídia ainda referenciada; exportação avisa claramente se as fotos não estiverem incluídas. Limite inicial proposto: lado maior 1.600 px, alvo de 500 KB por foto, com validação de qualidade e orçamento de armazenamento.

**Testes:** cinco imagens, sexta recusada com orientação, arquivo inválido, armazenamento cheio, permissão negada, reabertura, exclusão e importação/exportação. Executar em web e aparelho; não simular suporte nativo apenas com mocks.

## E03 · P1 · Cadastro progressivo que entrega valor cedo

**Arquivos:** `src/app/editar.tsx`, `src/componentes/revisao/FormularioDeRevisao.tsx`, `SeletorDeBairro.tsx`, `src/dados/formulario.ts`, `custos.ts`.

**Estrutura:** 1) identificação mínima e compra/aluguel; 2) custos conhecidos; 3) detalhes opcionais. As seções podem ser expansíveis numa única tela; não criar três rotas sem necessidade. Exibir resumo persistente do que já foi informado. Campos obrigatórios devem derivar das regras atuais, não criar obrigação de endereço apenas para permitir salvar.

No primeiro cadastro, CTA “Criar dossiê” salva e abre a análise correspondente, com identificação opcional quando aplicável; na edição de uma análise, “Salvar alterações” retorna ao contexto de origem. Antes de mudar o destino, conferir o fluxo atual `destinoDaAnalise` e evitar obrigar confirmação de prédio. Rascunho deve sobreviver a avançar/recuar entre seções. Erro junto do campo, com foco no primeiro inválido.

**Regras:** zero informado é diferente de desconhecido; IPTU precisa de periodicidade; compra não entra na soma mensal; troca de modalidade não converte preço de compra em aluguel silenciosamente. Não preencher custos ausentes com médias cadastrais como se fossem despesas reais daquela unidade.

**Aceite:** análise útil criada sem completar todos os campos; custos incompletos mantêm indicação de subtotal; editar não duplica análise; voltar não perde silenciosamente alterações; seletor de bairro pesquisável não exige percorrer 94 opções.

**Testes:** apenas mínimo, todos os custos, IPTU anual, IPTU sem periodicidade, valores inválidos, troca de modalidade, erro de gravação, teclado aberto em tela pequena. Medir tempo e erros de cinco pessoas criando primeiro dossiê; objetivo inicial: 4/5 concluírem sem ajuda em até dois minutos, como hipótese de usabilidade, não KPI já alcançado.

## E04 · P1 · Mesma linguagem de custo em todo o caderno

**Arquivos:** `src/dados/custos.ts`, `src/app/(abas)/salvos.tsx`, `index.tsx`, componentes de cartão realmente usados, `src/componentes/comparar/CartaoDoImovel.tsx`, `dossie-v1/Custo.tsx`.

**Regra de produto:** aluguel mostra “Mensal conhecido” como informação comparativa principal e “Aluguel anunciado” como componente secundário. Compra mostra “Preço anunciado” e “Mensal conhecido” separadamente. Se existirem pendências, texto curto “+ valores a confirmar”; nunca “total” sem qualificação. Reutilizar a derivação de custo já existente, não somar de novo em cada componente.

**Exemplo obrigatório:** aluguel 2.500 + condomínio 600, IPTU e seguro desconhecidos → mensal conhecido R$ 3.100 + valores a confirmar; aluguel anunciado R$ 2.500. O mesmo significado aparece em Salvos, comparação e dossiê. Para compra, não somar R$ 690.000 ao condomínio.

**Aceite/testes:** fixtures com tudo conhecido, tudo desconhecido, zero, taxa anual, campos inválidos já tratados no formulário; editar condomínio atualiza todas as telas. Verificar arredondamento consistente e rótulos acessíveis com leitor de tela.

## E05 · P2 · Fechar o ciclo entre fato, pergunta e resposta

**Arquivos:** `src/dados/dossie/derivar.ts`, `rua.ts`, `src/componentes/visita-v1/useVisita.ts`, `LinhaDePergunta.tsx`, `Resumo.tsx`, `src/dados/esquema.ts`.

**Já existe:** roteiro, resposta livre, perguntas próprias e autosave. **Adicionar:** ligação estável entre pergunta e sinal que a originou; estado pendente/respondida/não se aplica; data de atualização e origem da resposta (“observei”, “corretor informou”, “documento”). Registrar relato não altera o dado oficial.

O dossiê ganha resumo “O que você já conferiu”, até três itens e acesso ao restante. Alteração em base oficial preserva resposta anterior com sua data e indica que o contexto mudou. IDs não podem depender da ordem da lista nem do texto traduzido. Respostas antigas recebem origem “não registrada”, sem inventar datas históricas; usar migração compatível.

**Aceite:** responder na visita atualiza o resumo ao retornar; reabrir preserva origem; “não se aplica” não conta como confirmação; perguntas removidas da derivação não apagam respostas antigas; falha de armazenamento mantém rascunho. Comparação distingue dado público de relato pessoal.

**Testes:** migração do formato atual, pergunta renomeada, sinal atualizado, resposta editada offline, falha de autosave, alternar imóvel durante rascunho. Métrica proposta: perguntas úteis respondidas por visita, e não número bruto de cartões exibidos.

## E06 · P1 · Início, caderno e navegação previsíveis

**Arquivos:** `src/app/(abas)/index.tsx`, `salvos.tsx`, `src/componentes/casca/DockInferior.tsx`, componentes de cartão e navegação.

**Mudanças:** CTA principal “Analisar um imóvel”; cadastro manual como ação secundária acessível; primeiro uso apresenta um exemplo navegável com clara distinção do caderno pessoal. Depois de existir análise, destacar “Continuar análise” com imóvel ativo. Não usar exemplos demonstrativos como dados da pessoa.

Documentar o mapa de navegação antes de alterar o dock: Explorar → entrada; Dossiê → análise ativa; Comparar → seleção/comparação; Visita → roteiro da análise ativa. Salvos é caderno acessível pelo menu/seleção, com título próprio; não deve dar a entender que a pessoa já está comparando. Resolver o estado ativo de Salvos por decisão explícita: nenhum item selecionado ou agrupamento visual “Caderno”, sem renomear toda a arquitetura nesta tarefa.

**Aceite:** salvar não deixa a pessoa sem próximo passo; voltar de edição retorna ao contexto correto; toque repetido no item atual não empilha cópias da mesma rota; sem análise ativa, Dossiê e Visita explicam como começar. O empilhamento é um cenário a testar, não um bug confirmado nesta auditoria.

**Validação:** início vazio, uma análise, várias análises, descartadas, link externo de entrada, retorno do leitor, troca de imóvel. Conferir cabeçalhos sem saltos semânticos desnecessários e gavetas com foco/restauração; o smoke atual deve continuar passando.
