# Fluxo de entrega por task no Vereda

Adaptação do método de desenvolvimento com agentes (ver [origem](README.md#origem-e-atualização)) ao Vereda. As regras do hub em [`AGENTS.md`](../../AGENTS.md#fonte-da-verdade-o-enemyhub) continuam valendo e têm precedência; este fluxo diz em que ordem trabalhar e onde cada decisão humana fica registrada.

## Fontes de contexto

- **Hub (Enemyhub, servidor MCP `enemyhub`):** objetivo, features com veredito e justificativa, tarefas do quadro "Macro", impedimentos e documentos. É a referência para **o que entregar e por quê**. Leia com `enemyhub_get_project` e `sections`. O servidor MCP fica no repositório [`Mangue-Bit/EnemiesHub`](https://github.com/Mangue-Bit/EnemiesHub), pasta `mcp/`; se as ferramentas `enemyhub_*` não estiverem disponíveis na sessão, pare e peça ao usuário para registrar o servidor (passo a passo no `mcp/README.md` de lá) em vez de trabalhar sem o hub.
- **Documentação (`docs/` deste repositório):** arquitetura, contratos, dados, evidências de execução e os artefatos de plano e task. É a referência para **como a aplicação funciona**. O ponto de partida é o [contexto do projeto](contexto-projeto.md).
- **Código (`src/`, `scripts/`, `tests/`):** implementação e testes.

Se faltar um requisito ou houver conflito entre as fontes, vale o hub. Aponte a divergência ao responsável humano antes de decidir por conta própria.

## Equivalências

| No método | No Vereda |
| --- | --- |
| Plano ou épico | Feature no hub (tem veredito e justificativa) |
| Task | Tarefa no quadro "Macro", ligada à feature |
| ID do plano | `F-` + 8 primeiros caracteres do id da feature no hub, por exemplo `F-ad9ed0d4` |
| ID da task | `T-` + 8 primeiros caracteres do id da tarefa no hub, por exemplo `T-33540fe1` |
| Aprovação de Produto | Decisão humana registrada como comentário na feature do hub, com autor e data |
| Aprovação de Engenharia | Decisão humana registrada como comentário na feature do hub ou review no PR |
| Aprovação do PR | Review aprovado no GitHub (`Artur-Mac/veredas`) |

O hub não tem ID curto; o prefixo de 8 caracteres do id é a forma de manter o mesmo identificador no hub, nos documentos, na branch e no PR. Esta convenção é uma proposta de 18/11/2026 e aguarda confirmação da equipe (ver [pendências do contexto](contexto-projeto.md#5-decisões-e-dúvidas)).

## Organização dos artefatos

Os artefatos ficam em [`docs/planos/`](../planos/README.md), uma pasta por feature e uma subpasta por tarefa:

| Artefato | Caminho | Modelo |
| --- | --- | --- |
| Plano | `docs/planos/F-xxxxxxxx-nome-curto/plano.md` | [plano](templates/plano.md) |
| Funcional | `docs/planos/F-xxxxxxxx-nome-curto/tasks/T-xxxxxxxx/funcional.md` | [funcional](templates/especificacao-funcional.md) |
| Técnico | `docs/planos/F-xxxxxxxx-nome-curto/tasks/T-xxxxxxxx/tecnico.md` | [técnico](templates/especificacao-tecnica.md) |
| Validação | `docs/planos/F-xxxxxxxx-nome-curto/tasks/T-xxxxxxxx/validacao.md` | [validação](templates/validacao.md) |

Uma task pequena pode ter um único `.md` com as seções funcional e técnica, desde que as duas sejam revisadas. Telas, medições e logs volumosos continuam em `docs/aplicacao/execucoes/` ou na pasta da frente de trabalho; `validacao.md` aponta para eles.

Correção interna sem efeito no escopo (a opção "Esta mudança não altera o hub" do modelo de PR) não precisa de plano nem de especificação: basta o PR com a verificação.

## Execute uma task nesta ordem

Cada etapa tem uma skill em `.agents/skills/`. A skill [`entregar-task`](../../.agents/skills/entregar-task/SKILL.md) identifica a etapa pertinente.

1. **Preparar** ([`preparar-task`](../../.agents/skills/preparar-task/SKILL.md)): leia a tarefa e a feature no hub; confirme ID, responsável e critérios; leia o contexto e os docs técnicos da área. Se a tarefa não tiver feature, proponha o vínculo antes de seguir.
2. **Especificar a função** ([`especificar-funcional`](../../.agents/skills/especificar-funcional/SKILL.md)): redija `funcional.md` e cite o caminho dele na descrição da tarefa no hub. **Aguarde a aprovação de Produto.**
3. **Especificar a solução** ([`especificar-tecnico`](../../.agents/skills/especificar-tecnico/SKILL.md)): redija `tecnico.md` sobre a versão funcional aprovada. **Aguarde a aprovação de Engenharia.**
4. **Implementar** ([`implementar-task`](../../.agents/skills/implementar-task/SKILL.md)): crie a branch `<tipo>/T-xxxxxxxx-nome-curto` a partir de `main` (`tipo`: `feat`, `fix`, `dados` ou `docs`). Faça a alteração, os testes e a documentação afetada. Abra o PR para `main` preenchendo [o modelo](../../.github/pull_request_template.md).
5. **Validar** ([`validar-task`](../../.agents/skills/validar-task/SKILL.md)): rode `npm run verificar` e as verificações da área; registre em `validacao.md` o que passou, o que falhou e o que não foi executado. Não há CI no GitHub: a verificação local e o log dela são a evidência. Submeta o PR à **aprovação humana**.
6. **Concluir** ([`concluir-task`](../../.agents/skills/concluir-task/SKILL.md)): depois do merge em `main`, mova a tarefa para "Feito" no hub, atualize a descrição com os links do PR e dos artefatos e registre os impedimentos que ficaram. Se a mudança afeta uma feature habilitada, confira `docs/aplicacao/FEATURE-REGISTER.md`.

O plano de uma feature nova nasce com [`planejar-entrega`](../../.agents/skills/planejar-entrega/SKILL.md); o contexto geral é mantido com [`definir-contexto-projeto`](../../.agents/skills/definir-contexto-projeto/SKILL.md).

## Gravação no hub

- Mostre ao usuário o que vai mudar e peça confirmação antes de qualquer `enemyhub_apply_changes`. Passe o `updatedAt` lido; se o hub responder 409, releia e refaça.
- O agente escreve no hub o registro de uma decisão que um humano tomou, com o nome de quem decidiu e a data. Ele não decide, não muda veredito e não aprova.
- O MCP só opera no quadro "Macro". Responsável de tarefa e colunas do kanban são alterados pela interface do hub.

## Regras para todos os agentes

- Mantenha o **mesmo ID** no hub, nos documentos, na branch e no PR.
- Não marque uma etapa como aprovada por conta própria; registre quem aprovou e onde a decisão está.
- Não avance para a etapa seguinte com uma reprovação pendente.
- Faça artefatos proporcionais à mudança: claros e verificáveis, sem texto desnecessário.
- Uma revisão feita por outro agente pode apontar problemas, mas não substitui a decisão humana.
- Integre cada task aprovada em `main`; não espere todas as tasks da feature para descobrir problemas de integração.
- Não afirme que um teste passou sem executá-lo. Celular físico e leitor de tela contam como "não executado" até alguém rodar num aparelho.
