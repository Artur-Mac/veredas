# Backlog técnico — confiabilidade, dados e validação

## T01 · P1 · Semântica de salvamento e seleção ativa

**Evidência:** `src/estado/Analises.tsx`, funções `salvar`, `remover`, `definirAtiva`. A lista e o ponteiro ativo são escritos separadamente. Risco inferido, não falha reproduzida no teste atual.

**Contrato desejado:** a lista de análises é o dado principal; a análise ativa é preferência recuperável. Se a lista foi gravada, uma falha posterior no ponteiro não pode informar “não foi salvo”. Na próxima abertura, ponteiro inexistente/inválido usa fallback determinístico para análise existente ou `null`. Não aceitar ponteiro para item removido.

**Passos:**

1. Criar teste de falha seletiva de `setItem(CHAVE_ATIVA)` após sucesso da lista. Conferir estado em memória, retorno da operação e reabertura.
2. Escolher um resultado explícito para falha de preferência: sucesso do conteúdo com aviso recuperável. Centralizar atualização do ponteiro e manter ordem das operações para evitar corrida entre dois salvamentos.
3. Fazer `salvar`/`remover` resolverem quando a mudança principal persistiu; rejeitar quando ela falhou. Se o tipo passar a retornar status, adaptar todos os consumidores e mensagens, inclusive visita e crédito.
4. Não tentar “rollback” apagando análise que já foi gravada. Não usar `multiSet` como promessa de transação sem garantia do armazenamento.
5. Na carga, validar referência e aplicar fallback. Falha ao reparar preferência não deve bloquear caderno íntegro.

**Aceite/testes:** falha da lista não muda memória; falha apenas do ponteiro preserva conteúdo e não duplica ao tentar de novo; exclusão de ativa recupera seleção; duas gravações concorrentes terminam em estado coerente; caderno bloqueado continua sem escrita. Executar testes de armazenamento/visita/carteira e `npm run verificar`.

## T02 · P2 · Exportação e importação verificáveis

**Motivo:** caderno local precisa de caminho de recuperação antes de conta/sincronização. Quarentena protege de sobrescrita, mas não substitui cópia fora do aparelho.

**Entradas:** `src/estado/Analises.tsx`, `armazenamento.ts`, `src/dados/esquema.ts`, `migracao.ts`, menu e telas de erro. Criar módulo dedicado de formato de backup, sem escrever direto nas chaves pelas telas.

**Formato proposto:** envelope com `formato`, `versao`, `exportadoEm`, `analises`; mídia explicitamente incluída ou excluída. Preferências opcionais. Não importar saldo/créditos como autoridade financeira. Um hash pode detectar corrupção acidental, não atestar autenticidade.

**Fluxo:** escolher arquivo → limitar tamanho (proposta inicial 10 MB sem fotos) → validar envelope e cada registro → prévia de contagem e conflitos → confirmar importação → gravar via fila existente → resultado. Nunca substituir o caderno ao apenas selecionar arquivo. Para ID em conflito, padrão “manter existente”; permitir importar cópia com novo ID por escolha. Conservar vínculos e histórico internos dessa cópia.

**Aceite:** arquivo inválido não altera nada; exportar/importar preserva campos; conflito não duplica silenciosamente; versão futura é recusada com orientação; cancelamento não grava; falta de espaço não informa sucesso. Dados originais e quarentena não são apagados pelo importador. Fotos ausentes têm fallback e aviso.

**Testes:** ida e volta, schema antigo, versão futura, arquivo truncado, 0/1/100 análises, IDs repetidos, limite de tamanho e falha de escrita. No nativo, testar seleção e compartilhamento de arquivo reais. O saldo de créditos não cresce por reimportar backup.

## T03 · P1 de manutenção · Remover avisos de sincronização nos testes

**Evidência:** avisos `act` de `AccessibilityInfo.isReduceMotionEnabled().then` em `src/componentes/casca/movimento.ts:33`, observados em `tests/formulario.test.ts`.

**Ação:** no teste, controlar resolução da Promise e esperar a atualização dentro das ferramentas de teste apropriadas. Verificar também desmontagem antes de resolver e evento posterior de preferência. Não silenciar `console.error` genericamente e não tornar a função de produção síncrona apenas para o teste.

**Aceite:** suíte passa sem aqueles avisos; mudança de preferência reduz movimento; componente desmontado não recebe efeito indevido. Rodar suíte focada e verificação do projeto.

## T04 · P1 antes de afirmar suporte · Matriz nativa de entrada e visita

**Entradas:** `src/componentes/leitor/`, `src/app/(abas)/receber.tsx`, `ler.tsx`, `src/app/+native-intent.tsx`, configuração de build. Consultar os documentos de leitura/compartilhamento já existentes na pesquisa.

Criar tabela com aparelho, versão do sistema, build, navegador/app de origem, portal, payload recebido, extração, campos corretos, fallback, tempo e resultado. Testar Android e iOS, inicialização fria/quente, URL compartilhada, texto selecionado, conteúdo misto, URL inválida e retorno depois de cancelar. Usar anúncio autorizado para teste; não registrar tokens, cookies, conteúdo pessoal nem URLs com parâmetros sensíveis nos relatórios.

Para cada entrada: escolher a análise certa; não duplicar recebimento; permitir revisão; não consumir crédito antes da confirmação. Quando só vier URL e a página bloquear leitura, abrir fallback explícito para colar texto/adicionar dados. Não contornar mecanismos do portal.

Na visita: teclado, alternância de app, bloqueio de tela, retomada, fechamento durante debounce, perda de rede e permissão negada. Autosave já existe; testar persistência real e distinguir o que está salvo do rascunho pendente.

**Aceite:** matriz preenchida com observações, não “deve funcionar”; falhas têm caminho recuperável. Sem aparelho disponível, marcar bloqueio específico e concluir web independentemente. Não declarar aprovação nativa com base no smoke web.

## T05 · P2 · Proveniência e frescor como contratos

**Entradas:** `src/dados/contratos.ts`, `src/dados/recife/indice/meta.json`, `src/dados/dossie/derivar.ts`, `rua.ts`, `src/componentes/fonte/`, `scripts/dados/`.

Separar: data de consulta, atualização publicada, período dos eventos, referência censitária e versão do índice. Não substituir período de observação por “atualizado hoje”. A central 156 embarcada cobre 31/01/2025 a 30/01/2026; não chamar automaticamente de “últimos 12 meses” em outubro de 2026. Censo 2022 permanece referência de 2022 mesmo em arquivo publicado depois.

**Passos:** inventariar cada frase temporal → associar ao campo correto → derivar rótulos por função pura com relógio injetável → testes de virada de mês/ano e período vencido. Conferir a memoização de `new Date()` no dossiê: verificar se uma sessão longa pode manter recência anterior; corrigir só se demonstrado pelo teste. Registrar fontes ausentes como indisponíveis, nunca zero.

**Aceite:** mesma fonte mostra o mesmo período em cartão, gaveta e visita; relógio de teste não depende do dia real; fonte removida não deixa afirmação sem origem; fatos pessoais de E05 não sobrescrevem fatos oficiais.

**Pipeline:** adicionar relatório de qualidade com registros lidos, rejeitados, sem coordenada, casamento exato/aproximado, duplicados, extremos e cobertura por bairro. Guardar artefato da execução e hashes. Variação acima de limiar proposto de 20% exige explicação antes de publicar, não necessariamente erro automático: pode ser expansão legítima.

## T06 · P2 antes de expansão · Medir custo do índice e do caderno

**Evidência:** cinco JSON de bairros somam aproximadamente 2,81 MB em disco nesta EDA. Isso não é tamanho final do bundle nem memória utilizada. `src/dados/recife/indice.ts` usa módulos locais/cache; não presumir download remoto por bairro. O provedor persiste a lista de análises como conjunto.

**Experimento:** medir abertura fria, abertura de primeiro dossiê por bairro, busca, memória e tempo de salvar com 1/20/100/500 análises sintéticas. Separar desenvolvimento de build de produção; registrar aparelho, versão e três ou mais execuções. Fotos ficam fora do JSON principal.

**Metas iniciais propostas:** interação local percebida abaixo de 200 ms p95 e primeira tela útil abaixo de 2 s em aparelho intermediário escolhido; só virar orçamento definitivo após baseline. Se não houver gargalo medido, preservar arquitetura. Se houver, comparar particionamento por bairro, memoização seletiva e armazenamento por análise com migração e recuperação testadas. Não adicionar servidor ou banco apenas para antecipar escala.

## Portão de entrega por lote

Rodar tipos/lint e testes afetados durante implementação; `npm run verificar` no fechamento. Para jornada alterada, executar `npm run test:v1` e inspecionar capturas — o teste não avalia sozinho clareza de texto ou qualidade visual. Acrescentar casos de comportamento novo ao roteiro, evitando testes que só repetem a estrutura do componente. Relatar limitações e provas separadamente.
