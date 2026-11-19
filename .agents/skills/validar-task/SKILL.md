---
name: validar-task
description: Verifica critérios de aceite, testes e CI de uma task implementada; registra evidências e conduz correções e revisão humana do PR. Use antes do merge.
---

# Validar a task

Use o [modelo de validação](../../../docs/metodo/templates/validacao.md), as especificações aprovadas e o PR. Para cada critério de aceite e risco técnico, indique a verificação adequada, execute o que estiver disponível e registre comando, resultado e evidência. Diferencie passou, falhou e não executado com motivo.

Confira CI, impacto em contratos e documentação. Se houver falha, corrija a implementação ou encaminhe uma mudança de requisito à etapa apropriada; rode novamente as verificações afetadas e as exigidas pelo projeto. Atualize a evidência antes de pedir nova revisão.

Entregue o registro de validação e o PR para code review e aprovação humana. Registre revisor, decisão e link. Um parecer de agente ajuda a revisar, mas não concede aprovação humana. Não marque o PR como pronto para merge enquanto houver falha relevante ou aprovação pendente.
