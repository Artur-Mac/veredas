# Especificação técnica — {{TASK_ID}}: {{TITULO}}

> Preencha os campos `{{...}}` após a aprovação da especificação funcional. Preserve as seções. Quando algo não se aplicar, escreva `Não se aplica` e explique brevemente. Baseie decisões na arquitetura existente e registre dúvidas em **Riscos e pendências**.

| Campo | Valor |
| --- | --- |
| Plano / épico | {{PLAN_ID_E_LINK}} |
| Task no Hub | {{TASK_ID_E_LINK}} |
| Especificação funcional aprovada | {{CAMINHO_E_LINK_DA_VERSAO_APROVADA}} |
| Responsável de Engenharia | {{NOME}} |
| Status | {{RASCUNHO_OU_APROVADO}} |
| Versão / data | {{VERSAO_E_DATA}} |

## Fontes e decisões de desenho

| Informação técnica | Fonte / link | Estado |
| --- | --- | --- |
| {{CONTRATO_OU_DECISAO_EXISTENTE}} | {{FONTE}} | {{CONFIRMADO_OU_PENDENTE}} |

| Questão | Alternativas e impactos | Decisão de Engenharia | Autor e registro |
| --- | --- | --- | --- |
| {{QUESTAO}} | {{OPCOES_COMPATIBILIDADE_E_CUSTO}} | {{ESCOLHA_OU_PENDENTE}} | {{NOME_E_LINK_OU_PENDENTE}} |

## 1. Resumo da solução

**Abordagem:** {{COMO_A_SOLUCAO_ATENDE_AOS_CRITERIOS_DE_ACEITE}}

**Decisões técnicas principais e motivo:**

- {{DECISAO_E_JUSTIFICATIVA_1}}

## 2. Impacto na aplicação

| Componente ou arquivo | Alteração prevista | Motivo |
| --- | --- | --- |
| {{COMPONENTE_1}} | {{ALTERACAO_1}} | {{MOTIVO_1}} |

**Dependências técnicas e integração com outras tasks:** {{DEPENDENCIAS_OU_NENHUMA}}

## 3. Contratos e dados

- **APIs, eventos ou interfaces afetados:** {{ENTRADA_SAIDA_ERROS_E_COMPATIBILIDADE_OU_NAO_SE_APLICA}}
- **Persistência, esquema e migração:** {{MUDANCAS_E_TRATAMENTO_DOS_DADOS_EXISTENTES_OU_NAO_SE_APLICA}}
- **Autorização, privacidade e dados sensíveis:** {{IMPACTO_E_CONTROLES_OU_NAO_SE_APLICA}}

## 4. Plano de implementação

1. {{PASSO_1}}
2. {{PASSO_2}}
3. {{PASSO_3}}

**Documentação a atualizar:** {{ARQUIVOS_OU_NAO_SE_APLICA}}

## 5. Plano de validação

| Critério funcional | Teste ou verificação | Evidência esperada |
| --- | --- | --- |
| {{CA_01}} | {{TESTE_1}} | {{RESULTADO_1}} |
| {{CA_02}} | {{TESTE_2}} | {{RESULTADO_2}} |

**Comandos de teste e verificações de CI:** {{COMANDOS_E_CHECKS}}

**Como implantar ou habilitar a mudança:** {{PUBLICACAO_OU_NAO_SE_APLICA}}

**Como reverter em caso de falha:** {{ROLLBACK_OU_NAO_SE_APLICA}}

## 6. Riscos e pendências

- **Riscos e mitigação:** {{RISCOS_E_ACOES_OU_NENHUM}}
- **Dúvidas para Engenharia ou Produto:** {{DUVIDAS_OU_NENHUMA}}

## 7. Revisão humana

- **Decisão:** {{APROVADO_OU_AJUSTES_SOLICITADOS_OU_PENDENTE}}
- **Revisor e registro da decisão:** {{NOME_E_LINK_DO_COMENTARIO_OU_PR}}
- **Ajustes solicitados:** {{AJUSTES_OU_NENHUM}}

> A implementação começa após a aprovação de Engenharia registrada acima.
