# 08 — Prompt de execução para IA operária

Copie a instrução abaixo para iniciar. O padrão executa somente a época 00; para outra, substitua `00` pelo número escolhido e confirme pré-requisitos pelos registros. Se desejar várias épocas, liste-as explicitamente. O plano não autoriza avanço automático além desse escopo.

---

Você está no repositório VEREDA. Execute **somente a época 00** do plano canônico `docs/plano-recife/README.md`.

Primeiro leia as instruções aplicáveis, README, o índice do plano, catálogo, contratos de experiência/dados, especificação da época, qualidade e decisões/fontes. Consulte os documentos históricos citados apenas quando esclarecerem a unidade. Inspecione código, testes, versões e alterações atuais: o projeto pode ter avançado. Preserve mudanças de outras pessoas.

Para unidades que tratem de CNPJ, documentos, consultas judiciais ou ocorrências relacionadas, leia também `docs/plano-recife/10-CNPJ-E-OCORRENCIAS-DO-EDIFICIO.md`, incluindo os nove testes de aceite e a separação entre certidão de ações, CNDT, alegação, decisão e laudo.

O produto é amplo e focado em imóveis do município do Recife. Não reduza o escopo para um MVP por preferência própria; também não invente dados ou implemente integrações sem condições técnicas. A interface deve seguir o `index.html` raiz como referência exclusiva de identidade e experiência. **Não altere o index raiz, pitch ou motion e não transplante seus dados demonstrativos como fatos.**

Antes de editar, crie/atualize apenas o registro desta execução em `docs/plano-recife/execucoes/EPxx.md`, preservando históricos. Registre tabela curta com unidade/FIDs, comportamento atual confirmado, arquivos pretendidos e teste de aceite. Se um item já estiver resolvido, demonstre com código/teste e não o reimplemente.

Execute unidades na ordem descrita, com incrementos pequenos e revisáveis. Use os componentes, derivadores, contratos e persistência existentes. Novos módulos sugeridos no plano não justificam refatorar áreas independentes. Se faltar detalhe pequeno, escolha a solução mais simples compatível com os contratos, registre a decisão e continue. Não troque a stack por conveniência.

Regras obrigatórias:

1. Preservar caderno antigo, ausência versus zero, origem/período/escala das fontes, serialização de escrita e funcionamento local. Lista é dado principal; preferência ativa é recuperável. Não esconder falha de conteúdo nem apagar dados em rollback improvisado.
2. Não converter pontos em probabilidade, coordenada em certeza de prédio/unidade, licença em ruído observado, cadastro ativo em funcionamento atual ou documento apresentado em atestado de segurança.
3. Custos reutilizam derivação existente. Aluguel 2.500 + condomínio 600 com IPTU/seguro desconhecidos mostra mensal conhecido 3.100 e pendências em Salvos, dossiê e comparação; aquisição fica separada.
4. Cada função tem entrada clara, resumo útil, detalhe de origem, ação e estados de ausência/erro. Manter navegação organizada; não criar uma aba/cartão principal por fonte.
5. Sensores e integrações declaram capacidade real por plataforma. Sem rede, roteador, permissão, fonte ou dispositivo, oferecer alternativa manual sem fingir medição.
6. Não contratar API, publicar, criar infraestrutura remota, alterar cobrança real ou enviar mensagens/documentos a terceiros. Prepare código local, testes e proposta concreta; registre a dependência para ativação. Não bloqueie itens independentes por isso.
7. Dados privados não entram em logs, índices públicos, analytics ou prompts remotos por conveniência. Compartilhamento tem prévia e seleção deliberada; mensagem sugerida inclui VEREDA e permite edição.

Adicione testes apenas para comportamento/risco. Rode testes focados de cada unidade. Ao fechar a época com código alterado, execute `npm run verificar` e o smoke `npm run test:v1` contra servidor local. Examine as capturas das telas alteradas em 375×812 e 1280×900; confira 360 px, nome longo, dados incompletos, teclado e texto ampliado. Testes nativos são necessários para capacidades nativas; navegador não os substitui. Se ambiente faltar, registre exatamente o que não foi testado e mantenha a capacidade no estado correto.

Atualize o registro com alterações, decisões, testes/resultados, capturas realmente examinadas, limitações e pendências por unidade/FID. Fallback manual não conclui integração automática; mock não comprova fornecedor. Não reescreva diagnóstico histórico como observação da versão futura.

Ao terminar, informe resultado da época, artefatos, verificações e bloqueios específicos. **Não inicie a época seguinte automaticamente.**

---

## Complemento para uma IA mais autônoma

Pode propor simplificações dentro da época quando reduzem duplicação e preservam todos os contratos. Antes de ampliar escopo, compare alternativas no registro e deixe a ampliação como proposta. Novas capacidades recebem IDs novos; nunca substitua silenciosamente uma capacidade existente ou altere regra de cobrança/dados. Pesquisa de público corre em paralelo ao desenvolvimento e não é gate global.
