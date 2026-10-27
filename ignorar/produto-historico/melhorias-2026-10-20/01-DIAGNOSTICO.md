# Diagnóstico técnico e de experiência

## Método e limites

Inspeção de código, navegação real na versão web local, comparação com o protótipo raiz, execução da verificação do projeto e do percurso ponta a ponta existente. Foi criada uma análise sintética no navegador local com bairro Boa Viagem, 70 m², aluguel de R$ 2.500 e condomínio de R$ 600, sem endereço. Não foram enviados anúncios ou dados a serviços externos.

**Observado** significa visto na interface ou confirmado por execução. **Inferido** significa risco identificado no código, ainda sem reprodução por injeção de falha. **Proposto** é uma decisão de produto a validar. Não houve teste em Android/iPhone físico, medição de desempenho em aparelho lento, auditoria jurídica nem teste com usuários reais.

## Resultado da verificação

| Verificação | Resultado e alcance |
|---|---|
| `npm run verificar` | Passou: tipos, lint, 32 suítes e 1.268 testes |
| Avisos do teste | Dois avisos React `act` na atualização assíncrona de movimento reduzido em testes de formulário; registrar e corrigir, não ocultar |
| `npm run test:v1` contra servidor local | Passou: 44 etapas auditadas a 375×812 e 1280×900 |
| Rede externa durante smoke | Nenhuma requisição para fora do servidor do app |
| Offline | Abas e dados com app já aberto funcionaram; recarga integral offline não certificada, web sem service worker |
| Armazenamento corrompido | Smoke confirmou bloqueio de gravações e preservação do conteúdo original |
| Crédito | Compra/aluguel, confirmação e descarte testados, inclusive toque duplo no descarte |
| Visual | Inspeção manual do início, editor, escolha de prédio e dossiê; capturas do smoke de Destaques, Entorno e Visita também examinadas |

As 44 etapas são verificações do roteiro existente, não 44 pesquisas com usuários nem certificação completa de acessibilidade. Capturas: [`out/auditoria-melhorias-2026-10-20`](../../../out/auditoria-melhorias-2026-10-20). Execução: `SMOKE_OUT=out/auditoria-melhorias-2026-10-20 POC_URL=http://localhost:8099 npm run test:v1` com servidor Expo já aberto. Os arquivos em `out/` podem ser ignorados pelo Git; regenerá-los quando necessário.

## O que já está bem resolvido

- Identidade básica coerente: papel, branco, laranja, tipografia editorial, cartões e abas. Não há motivo para redesenhar a marca.
- Composição de custo explicita o que está fora da soma; separa compra de despesas mensais.
- Fontes e cadastro oficial têm gavetas próprias; dado pode ser consultado sem sair da jornada.
- Visita tem preparação, perguntas derivadas, perguntas próprias, anotações, orientação e persistência. Não propor “criar modo visita” novamente.
- Índice local permite leitura dos dossiês sem chamadas externas durante o percurso testado.
- Armazenamento possui fila, validação, migração e quarentena. Não substituir isso por armazenamento simples.
- “A rua” já combina dados municipais e do Censo. O ganho futuro depende de interpretação e seleção, não só ingestão.

## Diferenças relevantes em relação ao protótipo

| Área | Observação no app | Referência desejada | Ação |
|---|---|---|---|
| Primeiro uso | CTA principal e cadastro manual com peso visual próximo; exemplos como lista simples | Uma ação principal clara e uma apresentação concreta do valor | E06 |
| Cadastro manual | Formulário longo com localização, vários custos e características | Progressão que faz o usuário chegar logo a um dossiê útil | E03 |
| Identificação | Com bairro+área, primeiro candidato tem nome e endereço específicos; confirmação consome crédito | Entender por que aquele prédio foi sugerido e quando faltam informações | E01 |
| Topo do dossiê | Retângulo 16:10 com grade/lote; sem prédio, grande área vazia | Reconhecimento do imóvel, imagem quando disponível e resumo visível cedo | E02 |
| Custo entre telas | Salvos mostra aluguel anunciado de R$ 2.500; dossiê mostra total conhecido de R$ 3.100 | Mesma semântica financeira nas etapas de decisão | E04 |
| Descobertas | Componentes de fatos já existem; bastante rolagem até conteúdo contextual | Poucos destaques editoriais, evidência e ação seguinte | E05/D03 |
| Retorno da visita | Respostas existem, mas origem e atualização por resposta merecem modelo explícito | Ver o que foi confirmado e o que permanece pendente | E05 |
| Navegação | Salvar cadastro manual levou a Salvos com Comparar marcado no dock | Resultado previsível e relação clara entre caderno e comparação | E06 |

O protótipo demonstrativo é referência de composição e ritmo. Fotografias, valores e promessas do demonstrativo não são evidência de cobertura real. A versão funcional precisa acomodar informação incompleta com o mesmo cuidado visual.

## Achados prioritários

### Identificação: especificidade visual maior que a evidência — observado

Passos: adicionar sem link → Boa Viagem → área 70 m² → salvar → abrir análise. Sem rua/número, a interface apresenta um candidato individual e pergunta se é o prédio. O código `src/dados/recife/buscar.ts` permite candidatura por área: 30 pontos, mais 10 se tipologia repetida, corte de 30, oito resultados máximos. Empates ordenam por ID; não por probabilidade calibrada.

Na base atual há 106 edifícios compatíveis só com essa área em Boa Viagem. O número oito é limite de retorno, não total de correspondências. Não afirmar “encontramos oito prédios” sem distinguir truncamento. O texto “confirmar ... garante” merece revisão: confirmação da pessoa não certifica o cadastro nem elimina erro de vínculo.

### Topo sem foto — observado

`src/componentes/dossie-v1/Topo.tsx` não recebe uma fotografia; o quadro 16:10 persiste sem prédio. No telefone, consome aproximadamente 200 px antes da identidade textual. Mesmo confirmado, a geometria cadastral tem pouco valor de reconhecimento para o usuário. Tratar lote como recurso de mapa e oferecer modo compacto sem imagem.

### Persistência em duas etapas — inferido

Em `src/estado/Analises.tsx`, `salvar` aguarda gravação da lista, atualiza `ativa` e só depois grava `CHAVE_ATIVA`. Se a última escrita falhar, a Promise rejeita mesmo com a análise salva. `remover` tem situação semelhante. Isso pode gerar mensagem de falha incompatível com o resultado persistido. Reproduzir por injeção de falha antes de corrigir; T01 especifica a semântica desejada.

### Maturidade nativa ainda não demonstrada nesta rodada

Código de compartilhamento, leitor de página e intenção nativa não prova que os portais entregam o mesmo conteúdo no aparelho. A aprovação da versão web não deve encerrar a matriz Android/iOS. Preservar os fallbacks de texto e cadastro manual; não prometer integração universal.
