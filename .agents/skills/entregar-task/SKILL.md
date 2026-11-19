---
name: entregar-task
description: Orienta qual etapa executar no método de entrega por plano e task. Use quando o usuário pedir o fluxo completo, perguntar qual é o próximo passo ou retomar uma task sem indicar etapa.
---

# Navegar pelo fluxo de entrega

Leia o [fluxo](../../../docs/metodo/fluxo-entrega.md), o [contexto do projeto](../../../docs/metodo/contexto-projeto.md) e o estado atual da task no Hub. Identifique a primeira etapa ainda necessária pelos artefatos e aprovações registrados. Não trate a existência de um arquivo como aprovação.

| Necessidade | Skill |
| --- | --- |
| Contexto geral da aplicação ausente ou desatualizado | [definir-contexto-projeto](../definir-contexto-projeto/SKILL.md) |
| Plano ou divisão de tasks indefinidos | [planejar-entrega](../planejar-entrega/SKILL.md) |
| Insumos da task ainda não reunidos | [preparar-task](../preparar-task/SKILL.md) |
| Comportamento e critérios de aceite indefinidos | [especificar-funcional](../especificar-funcional/SKILL.md) |
| Solução técnica indefinida | [especificar-tecnico](../especificar-tecnico/SKILL.md) |
| Especificações aprovadas e código pendente | [implementar-task](../implementar-task/SKILL.md) |
| Código pronto, evidências ou revisão pendentes | [validar-task](../validar-task/SKILL.md) |
| Merge aprovado, registros finais pendentes | [concluir-task](../concluir-task/SKILL.md) |

Carregue apenas a skill da etapa pertinente. Se o usuário pedir o fluxo inteiro, avance entre etapas à medida que os insumos e as decisões humanas forem registrados. Mostre o estado da task e a próxima decisão necessária. Não marque como aprovada uma etapa cuja decisão não tenha autor e registro.
