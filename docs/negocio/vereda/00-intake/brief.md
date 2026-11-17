# Intake Brief — VEREDA

**Phase:** 1 — Intake Interview
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** Medium *(alto detalhamento técnico nos docs; baixa clareza comercial/usuário e divergências graves entre fala do fundador e estado real de engenharia)*

---

## 1. The Idea & Pivot Reality

- **O que o projeto já tem construído (`../veredas/`, até `VE15` + `D036`):** aplicativo Expo/React Native focado na **web mobile** (`3,45 MB` JS após split) nos 5 bairros-piloto do Recife (`Boa Viagem`, `Casa Forte`, `Graças`, `Espinheiro`, `Madalena`; `2.688` prédios de `7.206` municipais). Entrega comparação lado a lado (*"Para decidir"*, *"Custo × Tempo"*, *"Onde mais procurar"*), pergunta decisiva interativa (`VE15`), caminhada em grafo real com **Plano B independente**, horários **GTFS** no aparelho, ledger histórico da **Defesa Civil** no trajeto, **sol nas fachadas**, entorno noturno/`LUSE`/CTTU sem nota de crime, memória *"Desde que você guardou"* e preparo de negociação/WhatsApp. **[Data]**
- **Visão declarada pelo fundador na sabatina:** fazer *"em alguns segundos um turista virar um local"*, entregando entendimento completo do imóvel e entorno (criminalidade, enchente, rotas, preço real, divergências, evidência de desabamento, barulho, verde, *CoolWalk*, Wi-Fi/5G bom, nascente automático) com insights críticos e perguntas no gatilho para o corretor. **[Founder-reported]**
- **Choque direto entre a fala do fundador e os dados do repositório (11–14/11):**
  - *Founder afirma:* "criminalidade", "evidência de desabamento", "ver se inunda", "coolwalk", "preço real", "se tem wifi bom (5g ou não)".
  - *Evidência interna real (`VE00–VE15`, `CRIVO`, benchmarks 14/11):*
    - **`CRIVO` e `VE08` proíbem** escore de criminalidade/segurança e classificação de risco de desabamento por tipologia/CNPJ. **[Data]**
    - **`VE14` rejeitou** modelo preditivo de alagamento (perdeu para recorrência simples `8/50` vs `7/50`); base Defesa Civil tem cobertura desigual e `176` nomes sem vínculo. **[Data]**
    - **`VE07` testou e manteve fora do app** o *CoolWalk* (rota sombreada só manteve ganho acima do ruído em `6/80` casos por falta de copas e marquises). **[Data]**
    - **Benchmark de conectividade (`14/11`)** mostrou que Anatel 5G coloca **48/48 pontos** de Recife na mesma faixa (`-90/-110 dBm`), não diferenciando prédios nem medindo Wi-Fi interno. **[Data]**
    - **Preço real de fechamento não existe** no app hoje (apenas anúncio pedido + referência fiscal ITBI em `630` prédios homogêneos; Censo 2022 aluguel pago ainda não integrado). **[Data]**

## 2. The Founders & Team Structure

- **Composição relatada:** **15 pessoas orbitando** sem remuneração: **`5` "cativos"** (fundador focado em dados + 1 perfil QA/negócios/"mais vendedora" + 1 líder proativo/experiente + 1 dev tecnicamente forte que precisa de *tasks* claras + 1 perfil descrito como "mais perdido") e **`10` "menos cativos"**. **[Founder-reported]**
- **Experiência:** histórico em hackathons, ideação e tecnologia, incluindo vitórias relacionadas a dados e soluções para a Prefeitura do Recife. Nenhuma experiência comercial imobiliária B2B/B2C comprovada citada até o momento. **[Founder-reported]**
- **Dedicação e governança:** estimativa de **`10h–20h` semanais** em média para os principais (*part-time*); fundador ainda vai "transbordar" o que desenvolveu para coordenar e distribuir tarefas aos demais. **[Assumption / Founder-reported]**
- **Runway / Motivação declarada:** foco imediato em **ganhar a Claro Campus Mobile**, publicar na **Play Store** e criar rede de divulgação, embora o fundador afirme que *"o vereda continua independente"* caso não passe em editais. Sem capital ou orçamento formal informados (*"não temos dinheiro infinito"*). **[Founder-reported]**

## 3. The Market & Current Customer Reality

- **Mercado de entrada:** Recife e futuramente centros urbanos brasileiros de médio/grande porte. Recife tem `145.805` domicílios alugados (`58.392` apartamentos; aluguel anunciado de **R$ 64,39/m²** em set/2026). **[Data]**
- **Alternativas atuais do cliente:** portais (`QuintoAndar`, `ZAP`, `VivaReal`, `OLX`), **Morei Aqui** (avaliações gratuitas de ex-moradores no BR), Google Maps, grupos de bairro/WhatsApp e planilhas pessoais. **[Data]**
- **Validação real pós-pivô (`VE01–VE15`):** **0 usuários reais testaram o fluxo comparativo novo**. Evidência existente vem de **outubro/2026 pré-pivô** (`N=83` Forms majoritariamente público UFPE/CESAR/Porto Digital + `5` entrevistas qualitativas). **[Data]**
- **Feedback externo recente citado pelo fundador:** conversa informal com uma liderança da **CESAR School** que havia comprado apartamento recentemente e se arrependeu de **custos de condomínio e barulho** — dores internas condominiais que bases abertas de Prefeitura *não* captam hoje sem ata/balancete do prédio. **[Founder-reported]**
- **Plano de teste de 1 semana proposto pelo fundador:** colocar versão web mobile na mão de familiares/conhecidos (*"minha irmã que é senior jovem tech"* e *"adultos mais velhos"*). Alto risco de viés de cortesia (*Mom Test*). **[Founder-reported]**

## 4. The Business Model & Monetization

- **Direcionamento pós-sabatina:** **B2C direto como foco primário** (crédito barato inicialmente subsidiado + recompensa por inserção de documentos/dados + funil orgânico via Instagram de curiosidades e *shadow ads* no Reddit/Twitter). **[Founder-reported]**
- **B2B secundário mencionado (e corrigido no debate):** fundador cogitou vender para corretor "avaliar ap ou vender", mas após confronto com **Lei 6.530/CRECI** e caso **Zillow**, recuou reconhecendo o conflito e reiterando foco B2C (mantendo B2G/Prefeitura e API como caminhos futuros se B2C falhar). **[Founder-reported]**
- **Contradição aberta:** ainda não há clareza de quanto um inquilino pagaria de fato nem como evitar que *crowdsourcing* subsidiado ("crédito barato por input") degrade a confiabilidade que sustenta o produto. **[Opinion / Open Gap]**

## 5. Constraints, Blind Spots & Hard-Question Audit

| Pergunta dura | Resposta do fundador | Avaliação honesta |
|---|---|---|
| **Por que ninguém testou ainda?** | Medo de ser "facilmente replicável" antes de uma v1 poderosa; Play Store como próximo alvo. | **Falsa proteção:** código fechado não defende produto sem uso recorrente e atrasa a única validação que importa (`G-USER`). |
| **Como escala para outros estados?** | Acredita que variações estaduais não inviabilizam replicação após consolidar Recife. | **Alto risco de subestimação:** 5 bairros do Recife já exigiram correção pesada de CKAN/GTFS/Defesa Civil; a maioria das capitais/cidades não publica cadastro aberto equivalente ao de Recife. |
| **O que te faria desistir/pivotar? (Kill criterion)** | **Não respondeu.** Reforçou otimismo de que o app tem muito potencial e, se 10 não virem valor, buscaria API B2B, extensão, MCP ou venda para governo. | **Ausência crítica de régua objetiva:** sem meta mínima de ativação/pagamento/retenção para encerrar ou cortar escopo. |

---

## Flags

**Red Flags:**
- **Zero testes com usuários reais pós-pivô (`0/10`)** combinados com recusa inicial em soltar o link fora do círculo próximo e ausência de critério pessoal de parada (*kill criterion*).
- **Desalinhamento grave entre promessa mental do fundador e produto real validado:** fundador descreve funcionalidades já descartadas ou proibidas no próprio projeto (`criminalidade`, `desabamento`, `5G/Wi-Fi`, `CoolWalk`, `preço real`, `turista`) enquanto subestima a falta de acesso a atas/custos reais de condomínio (justamente a dor da pessoa da CESAR).
- **Monetização B2C episódica não comprovada** + risco de poluir a base com "créditos por input" e concorrência gratuita existente (`Morei Aqui`).
- **Dispersão de escopo (*Boiling the Ocean*):** B2C, Give-to-Get, Instagram mídia, Play Store nativa, B2G Prefeitura, API B2B, extensão e MCP citados com equipe part-time (`10–20h/semana`) ainda sem divisão operacional de tarefas.

**Yellow Flags:**
- **Viés de "time de hackathon":** `5` cativos + `10` orbitando sem histórico comercial comprovado nem acordo societário declarado; risco de desmobilização se não ganhar a Campus Mobile.
- **Viabilidade geográfica fora do Recife:** tese de escala nacional assume disponibilidade cadastral que poucos municípios brasileiros oferecem de graça e estruturada.
- **Ambiguidade de persona:** misturar "turista virar local" com comprador/inquilino negociando taxas condominiais no WhatsApp.

## Sources
- Entrevista de Intake com o fundador (Rodadas 1–3, 15/11/2026) [Founder-reported].
- Documentos consolidados em [`../01-PRODUTO-TESE-E-ESTADO-ATUAL.md`](../../01-PRODUTO-TESE-E-ESTADO-ATUAL.md), [`../02-MERCADO-CONCORRENTES-E-POSICIONAMENTO.md`](../../02-MERCADO-CONCORRENTES-E-POSICIONAMENTO.md), [`../04-CLIENTES-METRICAS-E-MONETIZACAO.md`](../../04-CLIENTES-METRICAS-E-MONETIZACAO.md) e [`../05-RISCOS-E-GUARDRAILS.md`](../../05-RISCOS-E-GUARDRAILS.md).
- Achados do Pre-Flight [`preflight.md`](preflight.md).
