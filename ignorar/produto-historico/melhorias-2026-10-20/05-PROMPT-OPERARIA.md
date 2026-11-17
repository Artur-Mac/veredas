# Prompt para executar um lote

Copie o bloco abaixo para a IA executora. Troque somente o lote se desejar outra etapa. O padrão é o lote A; este documento não é autorização para executar todos os lotes de uma vez.

---

Você está no repositório VEREDA. Implemente **somente o lote A: T01, E01 e E04** do pacote `docs/produto/melhorias-2026-10-20/`.

Primeiro leia README, diagnóstico e as especificações desses três itens. Inspecione as instruções aplicáveis e o código atual: o projeto pode ter avançado desde a avaliação. Preserve mudanças de outras pessoas. Não altere o `index.html` raiz, o pitch ou arquivos de motion. O `index.html` é a referência de identidade visual; os dados demonstrativos dele não devem ser transplantados como fatos.

Objetivo do lote: salvamento com resultado coerente mesmo se falhar a preferência de análise ativa; identificação do prédio sem sugerir certeza quando só há área/bairro; custo mensal com a mesma semântica em Salvos, dossiê e comparação.

Antes de editar, registre uma tabela curta com: item, comportamento atual confirmado, arquivos a alterar e teste de aceite. Se algo já estiver resolvido, demonstre com código e teste e não reimplemente. Se faltar detalhe pequeno, escolha a solução mais simples compatível com os contratos. Se houver decisão que altera cobrança, envio externo, perda de dados ou escopo, deixe essa dependência explícita; continue os itens independentes.

Execute T01 primeiro. Reproduza falha seletiva de CHAVE_ATIVA depois de gravação da lista. Adote lista como dado principal e seleção como preferência recuperável, mantendo serialização. Não esconda falha de gravação do conteúdo nem apague dados num rollback improvisado.

Depois execute E01: explique os motivos da correspondência, exponha total antes do corte quando necessário, faça a entrada só por área pedir mais informação ou oferecer continuidade sem prédio. Nunca converta pontos em probabilidade. Preserve cobrança única na confirmação deliberada. Não invente novo algoritmo de machine learning.

Por fim execute E04: reutilize a derivação de custos existente e padronize rótulos. A fixture aluguel 2.500 + condomínio 600 com IPTU/seguro desconhecidos precisa mostrar mensal conhecido 3.100 e pendências em todas as superfícies relevantes. Preço de compra permanece separado.

Para cada item, adicione somente testes que comprovem comportamento/risco; execute os testes focados. Ao fechar o lote, rode `npm run verificar`, o smoke `npm run test:v1` contra servidor local e examine as capturas das telas alteradas em 375×812 e 1280×900. Confira também 360 px, nome longo, informação incompleta, teclado e texto ampliado. Não declare validação visual apenas porque o teste passou. Se não conseguir executar um ambiente, registre exatamente o que não foi testado.

Não refatore outras áreas por conveniência. Não contrate API, publique, altere pagamentos, envie mensagens a terceiros ou crie infraestrutura remota. Preserve ausência versus zero, origem das fontes, caderno antigo e funcionamento local.

Atualize um registro de execução dentro deste pacote, em arquivo novo, com: itens concluídos, alterações, decisões, testes e resultados, capturas, limitações e pendências. Não reescreva o diagnóstico histórico como se a auditoria tivesse observado a versão futura. Ao terminar, informe o resultado do lote e os caminhos dos artefatos, sem iniciar o lote seguinte automaticamente.

---

## Se a IA for mais autônoma

Manter os mesmos limites e critérios de aceite. Ela pode propor outra organização interna de componentes ou uma solução melhor para o problema, desde que apresente a evidência, preserve os contratos e não amplie escopo silenciosamente. Melhorias descobertas fora do lote vão para uma lista de próximas decisões. A autonomia deve melhorar a solução, não eliminar os testes ou transformar hipóteses em fatos.
