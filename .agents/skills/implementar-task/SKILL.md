---
name: implementar-task
description: Implementa uma task com especificações funcional e técnica aprovadas, mantendo rastreabilidade no código, testes, documentação e PR. Use quando o desenho aprovado estiver pronto para execução.
---

# Implementar a task

Confirme IDs, versões aprovadas e contexto do repositório da aplicação. Se surgir mudança de escopo ou decisão que invalide uma especificação, apresente o impacto e obtenha revisão da etapa pertinente antes de continuar nessa parte.

Crie branch com o ID da task conforme convenção local. Implemente em incrementos verificáveis, atualize testes e documentação afetada e execute os comandos de verificação do projeto. Ao encontrar falhas, investigue e corrija; registre limitações não resolvidas. Não afirme que um teste passou sem executá-lo.

Antes de abrir o PR, verifique que os critérios de aceite estão cobertos, que contratos e migrações seguem o desenho aprovado, que não há segredos ou mudanças sem relação com a task e que o PR liga Hub, especificações e evidências. Se um requisito não puder ser atendido, registre o bloqueio e peça decisão sobre o escopo; não o omita silenciosamente. Encaminhe para [validação](../validar-task/SKILL.md) quando houver implementação revisável.
