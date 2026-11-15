# CÂMARA FRIA — Simulação de Enxame de Mercado (14/11/2026)

> **STATUS: ARQUIVADO NA CÂMARA FRIA (NÃO LEVAR EM CONTA NESTA ETAPA)**
> Este material foi colocado fora do fluxo ativo do projeto por decisão direta de produto (`14/11/2026`). **Não o utilize como backlog obrigatório, especificação vigente, prova de inviabilidade ou referência para agentes de IA e desenvolvedores.**

## Por que foi para a câmara fria

A simulação multiagente foi executada cedo demais, com o produto e a base técnica ainda em estágio **cru e em construção ativa** (`VE12`–`VE15` em iteração). Como consequência:

1. **Prematuridade de mercado e monetização:** Testes de disposição a pagar (`M1`/`M2`/`M3`), projeções de CAC/LTV e pressões de incumbentes não representam um produto finalizado em operação, e **não devem ditar decisões atuais** enquanto o núcleo técnico do aplicativo não estiver concluído.
2. **Ruído de recursos ainda em rascunho/adiados:** O enxame puniu severamente itens experimentais, adiados ou já em transição (ex.: ausência de backend `D034`, medições de bundle ainda sem novo build pós-split `D036`, falta de testes `G-USER`, cobertura piloto parcial, promessas antigas de pitch vs. estado intermediário do código).
3. **Coisas que não devem ser consideradas agora:** Debates sobre pivot B2B2C completo, conflito hipotético de exclusividade com corretores, demandas de SLA corporativo e extrapolações alucinadas do modelo local (como menções a blockchain) devem ser ignorados nesta fase.

## Arquivos preservados aqui apenas para eventual consulta futura

- [`VEREDA_SWARM_INSIGHTS.md`](./VEREDA_SWARM_INSIGHTS.md) — Síntese gerada em 14/11/2026.
- [`vereda_raw_debate.md`](./vereda_raw_debate.md) e [`vereda_raw_debate.json`](./vereda_raw_debate.json) — Transcrição e métricas brutas das 4 rodadas.
- [`run_vereda_swarm.py`](./run_vereda_swarm.py) — Script standalone usado na simulação.

Caso o time decida revisitar essa análise quando o produto estiver maduro, recomenda-se descartar todo diagnóstico baseado em limitações transitórias da fase atual e rodar nova avaliação apenas sobre o estado consolidado do app.
