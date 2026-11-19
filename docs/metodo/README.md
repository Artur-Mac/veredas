# Método de entrega por task

Como uma tarefa do hub vira especificação, código, PR e registro de conclusão no Vereda, com os pontos em que uma pessoa precisa aprovar.

| Arquivo | Para quê |
| --- | --- |
| [`fluxo-entrega.md`](fluxo-entrega.md) | Etapas, equivalências com o Enemyhub, IDs, pastas e regras |
| [`contexto-projeto.md`](contexto-projeto.md) | Contexto geral do Vereda: fontes, stack, comandos, responsáveis e pendências |
| [`templates/`](templates/) | Modelos de plano, especificação funcional, especificação técnica e validação |
| [`../planos/`](../planos/README.md) | Onde ficam os artefatos de cada feature e tarefa |
| [`../../.agents/skills/`](../../.agents/skills/) | Uma skill por etapa; `entregar-task` indica qual usar |

## Como usar

Peça ao agente a etapa pelo nome ("prepare a tarefa X", "especifique a função da tarefa X") ou peça `entregar-task` para ele achar a etapa pelo estado da tarefa no hub. O agente lê o hub e o contexto, mostra o que encontrou e o que falta, propõe alternativas e espera a decisão. As aprovações de Produto, Engenharia e PR são de pessoas; o agente só registra quem decidiu e onde.

| Etapa | Skill |
| --- | --- |
| Contexto geral | [`definir-contexto-projeto`](../../.agents/skills/definir-contexto-projeto/SKILL.md) |
| Plano | [`planejar-entrega`](../../.agents/skills/planejar-entrega/SKILL.md) |
| Preparação | [`preparar-task`](../../.agents/skills/preparar-task/SKILL.md) |
| Funcional | [`especificar-funcional`](../../.agents/skills/especificar-funcional/SKILL.md) |
| Técnica | [`especificar-tecnico`](../../.agents/skills/especificar-tecnico/SKILL.md) |
| Implementação | [`implementar-task`](../../.agents/skills/implementar-task/SKILL.md) |
| Validação | [`validar-task`](../../.agents/skills/validar-task/SKILL.md) |
| Conclusão | [`concluir-task`](../../.agents/skills/concluir-task/SKILL.md) |

## Origem e atualização

As skills e os modelos vêm do kit Talos (repositório do método, commit `0a23027`). Diferenças em relação ao kit:

- o fluxo e os modelos ficam em `docs/metodo/`, e os links das skills apontam para cá;
- `fluxo-entrega.md` foi reescrito para o Enemyhub, as pastas e os comandos do Vereda;
- `contexto-projeto.md` é a versão preenchida do modelo; o `AGENTS-projeto.md` do kit virou a seção "Método de entrega por task" do [`AGENTS.md`](../../AGENTS.md).

Para trazer uma versão nova do kit: copie `.agents/skills/<etapa>/SKILL.md` e `templates/*.md`, troque `../../../docs/fluxo-entrega.md` por `../../../docs/metodo/fluxo-entrega.md` e `../../../templates/` por `../../../docs/metodo/templates/`, e confira os links. Não sobrescreva `fluxo-entrega.md` nem `contexto-projeto.md`.
