# Pre-Flight Check — VEREDA

**Phase:** 0.5 — Pre-Flight Check
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** High

---

## 1. Dominant Solution & Landscape Check

- **[Data]** Portais dominantes de busca e transação no Brasil concentram o mercado em **Grupo OLX** (`ZAP`, `VivaReal`, `OLX`) e **QuintoAndar** (incl. Imovelweb/Navent), porém nenhum deles cruza comparativamente rotinas reais, rotas alternativas sob alagamento, histórico de alvarás em 150 m e inconsistências cadastrais antes da visita.
- **[Data]** **Concorrente direto não mapeado antes descoberto no Pre-Flight:** **[Morei Aqui](https://moreiaqui.com.br)** (*moreiaqui.com.br*) já opera no Brasil como "Openigloo brasileiro" gratuito para inquilinos avaliarem incidência de sol, barulho, taxas ocultas/condomínio e postura de imobiliária/proprietário após a moradia. Diferença: é baseado em relatos pós-ocupação colaborativos, não em dados cadastrais/urbanos objetivos antes da visita.
- **[Data]** Lá fora, ferramentas adjacentes fragmentam a dor (`Walk Score`, `Openigloo`, `Rentometer`, `NeighborhoodScout`, `AreaVibes`, `Hoodmaps`, `Nomads.com`), sem player único combinando cadastro oficial brasileiro + rotas de rotina + comparação sem score único.

## 2. Precedent Failure & Model Stress Check

- **[Data]** **Precedente brasileiro (`Já Morei`, ~2014):** pioneira nacional em avaliação colaborativa de prédios e bairros por ex-moradores; perdeu tração ao longo dos anos e hoje encontra-se praticamente inativa/estagnada, sem escala comercial sustentável. Lição: modelo dependente apenas de *crowdsourcing* gratuito sem base cadastral prévia nem motor de receita claro tende a morrer por falta de densidade.
- **[Data]** **Sinal de alerta internacional (`Openigloo`, EUA):** mesmo com capital de risco (*Bow Capital, Gutter Capital*, entre outros), evoluiu além da consulta B2C gratuita para inquilinos e incluiu **B2B SaaS / serviços de dados e gestão de reputação para proprietários, gestores e compradores**, indicando limite estrutural de monetizar exclusivamente o lado do inquilino.
- **[Data]** **Caso `Zillow / First Street` (EUA, nov/2025):** Zillow retirou notas de risco climático de mais de 1 milhão de anúncios após pressão de corretores por perda de vendas — prova empírica do conflito entre depender de receita de anunciantes/corretores vendedores e expor passivos negativos do imóvel.

## 3. Regulatory / Legal Instant-Kill Check (Brasil)

- **[Data]** **Lei nº 6.530/1978 (CRECI):** intermediação imobiliária e emissão de avaliação comercial de preço são privativas de corretores inscritos. O VEREDA não sofre *instant kill* enquanto atuar como camada informacional de fatos públicos e rascunho de perguntas enviado pelo próprio usuário, mas **qualquer feature que "avalie valor do ap", cobre comissão por fechamento ou atue como captador comercial automatizado entra em risco direto de exercício ilegal da profissão**.
- **[Data]** **LGPD (Lei nº 13.709/2018) & Termos dos Portais:** a ANPD rejeita o argumento de que "dado público na internet libera uso comercial irrestrito"; *scraping* automatizado em servidor viola explicitamente termos de QuintoAndar e OLX e traz risco regulatório/cível. A arquitetura atual local (WebView no aparelho iniciada pelo usuário + dados locais + zero CPF/proprietário) reduz o risco, mas exige disciplina absoluta para não regredir para *crawling* centralizado.
- **[Data]** **ODbL 1.0 (Cadastro Recife):** obriga atribuição e disponibilidade da base cadastral derivada; logo, dado municipal bruto não cria monopólio jurídico isolado.

---

## Pre-Flight Verdict

> Sem bloqueio legal imediato para o núcleo comparativo neutro baseado em dados locais no aparelho, mas **com sinal vermelho no modelo puramente B2C colaborativo (precedente Já Morei / Morei Aqui gratuito)** e **aviso crítico contra vender "avaliação de ap" para corretores (Lei 6.530 + caso Zillow)**. Contexto para a sabatina, não veredito final.

---

## Flags

**Red Flags:**
- **Alternativa gratuita brasileira existente (`Morei Aqui`)** cobrindo dor parecida de taxas ocultas, sol e barulho pós-ocupação sem cobrar do inquilino.
- **Saturação/estagnação histórica de ferramentas puramente colaborativas (`Já Morei`)** e necessidade de pivô B2B observada mesmo lá fora (`Openigloo`).

**Yellow Flags:**
- **Fronteira estreita de *compliance* (`CRECI` / `LGPD` / ToS)** se o produto avançar para avaliação de preço, *scraping* em servidor ou venda de *leads*.

## Sources
- Busca externa ao vivo (15/11/2026): `moreiaqui.com.br` [Tier 2/3], `jamorei.com` / Estadão / Catraca Livre [Tier 2], PitchBook/Tracxn sobre `Openigloo` [Tier 1/2], análise `Lei 6.530/78` & ANPD/LGPD (`planalto.gov.br`, `captei.com`, `zkfluxus.com.br`, `crecisp.gov.br`) [Tier 1/2].
- Documentação interna consolidada em [`../02-MERCADO-CONCORRENTES-E-POSICIONAMENTO.md`](../../02-MERCADO-CONCORRENTES-E-POSICIONAMENTO.md) e [`../05-RISCOS-E-GUARDRAILS.md`](../../05-RISCOS-E-GUARDRAILS.md).
