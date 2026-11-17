# VEREDA — Pasta de Negócio, Estratégia e Mercado (Pós-Pivô · 14/11/2026)

Esta pasta reúne **exclusivamente** o contexto de negócio, produto, mercado, concorrência, dados estratégicos, monetização e guardrails do **VEREDA**, separado do código-fonte e das dezenas de arquivos de engenharia de `../veredas/`.

Ela foi criada para rodar **skills de startup** (posicionamento, modelo de negócio, pitch, GTM, parcerias, precificação, análise competitiva) sem contaminar o contexto com `src/`, `node_modules/`, GeoJSONs, PDFs acadêmicos nem com documentos antigos anteriores ao pivô de novembro de 2026.

---

## 1. Qual repositório está vivo?

| Pasta em `/home/v/Documents/vereda/` | Commit / Data | Estado real | Uso |
|---|---|---|---|
| **`veredas/`** | `5d90b64` (`2026-11-11`) + trabalho ativo até **`2026-11-14 23:50`** | **Projeto principal, mais atualizado e completo.** Contém o app Expo/React Native após `VE00–VE15`, o split de payload web (`D036`), o pipeline Recife e toda a pesquisa pós-pivô (`11–14/11/2026`). | Fonte única da verdade |
| `vereda-preview-expo/` | `55f3f84` (`2026-10-17`) | Worktree destacada e congelada do protótipo unificado v3.0 com 5 dossiês em mock. | Histórico (pré-pivô) |
| `vereda-preview-impeccable/` | `d197947` (`2026-10-13`) | Worktree congelada da versão visual mobile inicial. | Histórico |
| `vereda-preview-propsight/` | `28c2c8e` (`2026-10-12`) | Worktree congelada do protótipo APK inicial (PropSight). | Histórico |

---

## 2. Mapa de leitura para skills de startup

| Se a sua tarefa / skill for... | Leia primeiro | Depois leia |
|---|---|---|
| **Resumo executivo / Lean Canvas / Proposta de valor** | [01-PRODUTO-TESE-E-ESTADO-ATUAL.md](01-PRODUTO-TESE-E-ESTADO-ATUAL.md) | [04-CLIENTES-METRICAS-E-MONETIZACAO.md](04-CLIENTES-METRICAS-E-MONETIZACAO.md) |
| **Posicionamento competitivo / Pitch de diferenciação** | [02-MERCADO-CONCORRENTES-E-POSICIONAMENTO.md](02-MERCADO-CONCORRENTES-E-POSICIONAMENTO.md) | [03-DADOS-PARCERIAS-E-MOAT.md](03-DADOS-PARCERIAS-E-MOAT.md) |
| **Defensabilidade (Moat) / Parcerias B2G, B2B e ISPs** | [03-DADOS-PARCERIAS-E-MOAT.md](03-DADOS-PARCERIAS-E-MOAT.md) | [05-RISCOS-E-GUARDRAILS.md](05-RISCOS-E-GUARDRAILS.md) |
| **Monetização / GTM / Validação com clientes** | [04-CLIENTES-METRICAS-E-MONETIZACAO.md](04-CLIENTES-METRICAS-E-MONETIZACAO.md) | [01-PRODUTO-TESE-E-ESTADO-ATUAL.md](01-PRODUTO-TESE-E-ESTADO-ATUAL.md) |
| **Compliance / Jurídico / Limites técnicos reais** | [05-RISCOS-E-GUARDRAILS.md](05-RISCOS-E-GUARDRAILS.md) | [03-DADOS-PARCERIAS-E-MOAT.md](03-DADOS-PARCERIAS-E-MOAT.md) |

---

## 3. Regras de Ouro Pós-Pivô (O que NÃO assumir do material antigo)

Entre **11 e 14 de novembro de 2026**, o VEREDA passou por revisão estrutural rigorosa (`CRIVO`, parecer sobre 217 artigos, benchmarks ao vivo e programa `VE00–VE15`). Se você leu versões de outubro (`VEREDA_DOCUMENTO_DEFINITIVO.md`, `pitch/`), **descarte os pressupostos abaixo**:

1. **O centro do produto não é um "laudo de link com nota".** O centro hoje é a **Comparação orientada à decisão e à rotina** (qual visitar primeiro, o que vira o jogo, qual pergunta fazer e onde mais procurar).
2. **Proibido nota única, selo de julgamento ou "ranking de bairro seguro".** Tudo aparece como **fato com fonte e data**, contrafactual ou intervalo explícito — nunca como score opaco ou adjetivo ("barulhento", "perigoso", "justo").
3. **Valor fiscal de ITBI não é "preço de mercado".** Pedido (anúncio), referência fiscal (ITBI) e valor contratado são naturezas separadas; a área do ITBI inclui fração comum.
4. **Sem IA milagrosa nem ML não comprovado.** Modelo logístico de alagamento (`VE14`) perdeu da recorrência histórica simples e foi rejeitado. Visão computacional/sensores/Google Earth pago não integram o produto atual.
5. **Ainda falta validação com usuários reais (`G-USER`) e aparelho nativo.** O aplicativo web tem extensa cobertura de testes automatizados até `VE15` e bundle otimizado (`3,45 MB` JS), mas o piloto ainda não foi testado com pessoas em busca ativa de imóvel nem medido em smartphone físico.
6. **Não misturar peça de vídeo com verdade do produto.** Os roteiros em `../veredas/docs/pitch/` permitem arredondamentos ilustrativos exclusivos de apresentação em vídeo; os documentos desta pasta refletem apenas o estado real de produto, pesquisa e negócio.
