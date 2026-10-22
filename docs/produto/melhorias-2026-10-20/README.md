# VEREDA — avaliação e plano executável de melhorias

**Data:** 20/10/2026 · **Status:** proposta para execução, não alterações implementadas · **Público:** produto, desenvolvimento e IA executora.

> Execução posterior: [lote A concluído — alterações, testes e capturas](06-EXECUCAO-LOTE-A.md). O diagnóstico abaixo permanece como referência anterior à implementação.

## Recomendação

O app já possui um núcleo funcional consistente. A próxima rodada deve transformar esse núcleo em uma experiência mais próxima do `index.html`: reconhecer visualmente o imóvel, entender os custos rapidamente, descobrir poucos fatos relevantes e levar perguntas úteis à visita. A prioridade não é adicionar mais cartões de dados; é melhorar a identificação do prédio, a hierarquia do dossiê e o ciclo entre descoberta e confirmação.

A revisão encontrou um risco importante na jornada: só informar bairro e área já oferece um prédio específico para confirmação. Na exploração dos dados, **106 edifícios de Boa Viagem têm alguma tipologia compatível com 70 m²** na tolerância do buscador. A primeira opção não equivale a uma identificação confiável. Esse ponto precede polimento visual.

## Como usar este pacote

1. Leia o [diagnóstico e evidências](01-DIAGNOSTICO.md), que separa observado, inferido e ainda não testado.
2. Execute o [backlog de experiência](02-EXPERIENCIA.md) e o [backlog técnico](03-TECNICA.md) na ordem abaixo.
3. Use a [análise exploratória e oportunidades](04-DADOS-E-INSIGHTS.md) para novas funcionalidades. Já existe uma EDA executada, além de experimentos propostos.
4. Entregue o [prompt de execução](05-PROMPT-OPERARIA.md) à IA escolhida, indicando um lote. Ele limita ambiguidades e exige validação visível.

## Ordem de implementação

| Lote | Itens | Resultado verificável | Estimativa de esforço humano equivalente* |
|---|---|---|---|
| A — confiança e clareza | T01, E01, E04 | Falha do ponteiro não vira falso erro de salvamento; identificação explica ambiguidade; custos coerentes | 3–5 dias |
| B — aproximação visual | E02a, E03, E06 | Topo compacto sem imagem; cadastro progressivo; início e navegação mais claros | 4–7 dias |
| C — caderno útil | T02, E05, T04 | Exportação recuperável; respostas com origem; validação em aparelho | 5–9 dias + acesso a aparelhos |
| D — riqueza visual | E02b | Fotografias próprias persistentes, com fallback e exclusão | 3–5 dias |
| E — inteligência de contexto | D01, D02, D03, T05 | Dados e ordenação de perguntas validados antes de novos textos públicos | 5–10 dias |

*Estimativas para planejamento, não promessa de prazo nem custo de API. Incluem revisão e testes, não compra de aparelhos nem esperas externas. A IA deve reestimar após inspecionar o código atualizado. T03 pode acompanhar qualquer lote; T06 deve preceder expansão geográfica. Nenhuma contratação é necessária para A e B.*

## Critérios globais de pronto

- Usar a identidade do `index.html`, sem copiar números, fotografias ou afirmações demonstrativas como fatos do produto.
- Preservar análises antigas, crédito, funcionamento local e distinção entre ausência, zero e desconhecido.
- Cada tarefa deve entregar estados vazio, parcial, completo e falha que se apliquem; não basta a tela ideal.
- Verificação automatizada correspondente passa; mudanças de tela têm comparação visual a 375×812 e 1280×900, além de 360 px e texto ampliado nas áreas alteradas.
- Não reimplementar entregas existentes. “A rua”, perguntas próprias, compartilhamento recebido, edição, custo incompleto e salvamento da visita já têm código.
- Nenhum texto de risco, preço de mercado ou identificação ganha precisão maior que a evidência.

## Contexto e precedência

Este pacote atualiza o diagnóstico de implementação dos estudos [anteriores](../2026-10-20/README.md) e do [roadmap de pesquisa](../pesquisa-2026-10-20/05-ROADMAP-PROXIMAS-VERSOES.md). Aqueles continuam úteis para fontes, APIs, mercado e hipóteses de preço. Itens que descrevem “A rua” como futura devem agora ser lidos como melhoria/validação da implementação existente. Datas do roadmap continuam propostas; não foram reafirmadas como compromissos nesta auditoria.

Referência de código observada: `d483d9eb0164cfe652048f340817eaf6e837f0fe`. O trabalho está em andamento; a próxima IA deve comparar o estado atual antes de editar. Esta entrega altera somente documentação e evidências da análise.
