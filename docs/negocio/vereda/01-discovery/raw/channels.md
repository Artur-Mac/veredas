# Análise Profunda de Canais de Distribuição — VEREDA

**Phase:** 3 — Market Research (Wave 4, Agent D1)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** Medium-High *(alta precisão em benchmarks tributários/anúncios 2026, estrutura observada das SERPs em Recife, regras de comunidades locais, economia unitária das Ondas 1–3 e restrições regulatórias; `DATA GAP`s explícitos declarados para volumes exatos de palavras-chave/DR sem acesso a Semrush/Ahrefs/Keyword Planner pagos e taxa real de conversão pós-pivô `G-USER = 0`)*

---

## 0. Restrições Estruturais e Premissas Verificadas (Ondas 1–3)

Qualquer plano de distribuição do VEREDA precisa respeitar cinco travas objetivas já comprovadas nas Ondas 1–3 e na auditoria do repositório:

1. **Colapso do passe B2C isolado (R$ 49,90) em mídia paga:** `[Data]` `[Estimate]` Conforme `01-discovery/raw/pricing-intel.md` e `01-discovery/raw/competitor-gtm.md`, na Web Pix (Anexo III, 6% DAS, Mercado Pago 0,99%), o passe `A2` (R$ 49,90) gera contribuição pré-CAC de **R$ 41,21** — impondo teto de CAC 3:1 de **R$ 13,74** (`R$ 21,97` no Passe Completo `A3` de R$ 79,90). Com CPC imobiliário de **R$ 4,00–12,00** no Google Ads e CAC real de **R$ 100–750+** em campanhas frias no Brasil, mídia paga para `R$ 49,90` queima caixa de 7× a 50× acima do teto, colidindo com substitutos gratuitos (`Google Maps`, `Street View`, `Mapa Sossego` R$ 0, `Morei Aqui` R$ 0, `ChatGPT/Gemini PDF` R$ 0).
2. **Exploit crítico no protótipo antes do tráfego:** `[Data]` Inspeção direta de `src/estado/Carteira.tsx` (linhas 21–33) e `src/dados/descarte.ts` (linhas 48–50) confirma que todo usuário inicia com `saldo: 3` (`cota_inicial`) em armazenamento local (`vereda-carteira-v1`) e recebe estorno `+1` (`descarteGeraCredito`) ao descartar qualquer análise paga com 1 dos 4 motivos pré-prontos — criando **loop infinito gratuito** que precisa ser fechado antes de qualquer aquisição paga ou orgânica em escala.
3. **Motor de Caixa Viável (`V2` + `B2B2C`) e Web-First Pix-First:** `[Data]` `[Estimate]` Conforme `01-discovery/raw/demand-signals.md` e `01-discovery/raw/pricing-intel.md`, o valor capturável dispara na janela pré-contrato/pré-arras:
   - **Web-First + Pix-First:** **0,99%** (Mercado Pago até R$ 80,80) e **R$ 0,80 fixo** (`0,23%–0,40%`, AbacatePay/Woovi acima de R$ 80,81) vs. **10%–15%** (Apple pós-CADE/SBP) e **11%** (Google Play UCB).
   - **`V2` Concierge Pré-Contrato "Anti-Cilada":** **R$ 199** (revisão 24h; contribuição **R$ 139,28**, teto CAC 3:1 **R$ 46,43**) e **R$ 349** (+ call 20 min; contribuição **R$ 252,28**, teto CAC 3:1 **R$ 84,09**), com **custas de RI Digital desacopladas** para evitar bitributação (SC COSIT nº 72/2020) e sob cláusula estrita de relatório informativo (anti-OAB/CRECI/CREA).
   - **`B2B2C` (`C1/C2`) Co-Branded:** **R$ 199 / 10 dossiês** (`R$ 174,27` margem, teto CAC 3:1 **R$ 58,09**) ou **R$ 249/mês** (`R$ 212,77`/mês, LTV 6 meses ~**R$ 425** de teto CAC) para **Advogados Imobiliários (`OAB-PE CDI` / `IBRADIM-PE`)**, **Engenheiros Vistoriadores (`IBAPE-PE`)**, **Assessores *Buy-Side* (`CRECI-PE`)** e **Arrematantes de Leilão Caixa**.
4. **Alvo vs. Vetos Rígidos (`01-discovery/raw/target-audience.md`):** Foco exclusivo em compradores de usados R$ 350k–1,2M (35–55+ anos), locatários/transferidos de média/alta renda nos 5 bairros-piloto (R$ 2,5k–6k/mês de aluguel) e intermediários *buyer-side*. **VETADOS:** Turistas (estadia média 2–6 dias), calouros Sisu de baixa renda (Várzea/Iputinga, mediana R$ 1.500, fora dos 5 bairros) e corretores *sell-side* (risco de retaliação tipo Zillow/First Street nov/2025).
5. **Restrições Operacionais e de Competição:** Equipe de **5 pessoas com 10–20h/semana totais** (`01-discovery/raw/competitor-gtm.md`), caixa restrito a **R$ 0–3.000** em 90 dias, veto total a *shadow ads* no Reddit (`r/Recife ~81 mil`) e **Regulamento da 15ª ed. Campus Mobile (item 11.20(iv))**, que **proíbe mencionar marcas de portais terceiros (`OLX`, `ZAP`, `VivaReal`, `QuintoAndar`) em materiais de pitch, vídeo e demonstrações vinculadas ao edital**.

---

## 1. Ranking de Canais por ROI (Para 10–20h/sem e Orçamento R$ 0–3k)

### Tier 1: Alto Impacto, Baixo Custo (Prioridade Máxima em 90 Dias)

#### Canal 1 — Outbound Cirúrgico B2B2C *Buyer-Side* + PDF Co-Branded com QR Code
- **Por que funciona para o VEREDA:** `[Data]` `[Opinion]` Conforme `01-discovery/raw/target-audience.md` e `01-discovery/raw/pricing-intel.md`, 5 assinantes a R$ 249/mês (`R$ 1.245 MRR`) ou 8 pacotes de R$ 199 geram mais receita líquida e previsível do que 100+ vendas B2C de R$ 49,90 — com **CAC próximo de R$ 0**. Listagens públicas da **Comissão de Direito Imobiliário (CDI) da OAB-PE** (`oabpe.org.br`), associados do **IBAPE-PE** (`ibape-pe.org.br`) e encontros regionais do **IBRADIM-PE** (*After Hours* no Recife) permitem acesso direto sem pagar mídia.
- **Alcance estimado:** `[Data]` `[Estimate]` ~47.000–47.200 inscritos na OAB-PE (dezenas de especialistas listados na CDI + IBRADIM-PE), dezenas de peritos listados no IBAPE-PE e ~17.000–18.000 no CRECI-PE (filtrando estritamente *personal shoppers / buy-side*). Alvo realista de prospecção em 90 dias: **60 a 80 profissionais qualificados no Recife**.
- **CAC estimado:** **R$ 0 – R$ 50** (apenas tempo de abordagem + cafés/PDF amostra). `[Estimate]`
- **Tempo até os primeiros resultados:** **7 a 21 dias** para os primeiros testes gratuitos; **21 a 45 dias** para os primeiros pacotes pagos de R$ 199 (10 dossiês). `[Estimate]`
- **Como começar (passos acionáveis):**
  1. Mapear 40 advogados da CDI/OAB-PE + IBRADIM-PE, 20 engenheiros do IBAPE-PE e 10 assessores *buy-side* (CRECI-PE).
  2. Oferecer **"3 Dossiês Urbanos & Fiscais gratuitos (Web/PDF Co-Branded) para anexar ao parecer ou laudo do próximo cliente"**, economizando 1,5–3h de consultas em Sefin/Licenciamento Unificado/Defesa Civil/SPU.
  3. Incluir no rodapé do PDF **logo do escritório + selo VEREDA + QR Code + hash verificável** (nunca *white-label* editável) e cláusula de relatório informativo.

#### Canal 2 — Comunidades de Arrematantes de Leilão Caixa (Telegram/WhatsApp/YouTube) → Concierge `V2` (R$ 199 / R$ 349)
- **Por que funciona para o VEREDA:** `[Data]` `[Opinion]` O setor de leilões movimentou **R$ 420 bilhões** no Brasil em 2025 (`01-discovery/raw/demand-signals.md`), com crescimento expressivo de imóveis retomados da Caixa (Leilão Online e Venda Direta em Recife/RMR). Arrematantes enfrentam risco agudo e irrevogável antes do lance/proposta (ITBI real vs. desconto anunciado, obras em 150 m, alagamento Defesa Civil, Terreno de Marinha/laudêmio 5% e prédio-caixão em Boa Viagem/Imbiribeira/Madalena) e sofrem forte desconfiança contra golpes em grupos (`caixa.gov.br/imoveiscaixa`).
- **Alcance estimado:** `DATA GAP` para contagem exata em PE; canais estaduais como *Pro Leilão* (Telegram PE/NE), grupos de WhatsApp de *Venda Direta Online* e canais regionais de arrematação somam milhares de participantes ativos recorrentes (`[Estimate]` 2.000–15.000 investidores/assessores ativos na RMR/NE).
- **CAC estimado:** **R$ 0 – R$ 35** via demonstrações ao vivo em comunidades/parceiros e indicação de assessores de leilão (`B2B2C`). `[Estimate]`
- **Tempo até os primeiros resultados:** **14 a 30 dias** (arrematantes têm data fixa de edital/praça e decidem em 24–72h). `[Assumption]`
- **Como começar:**
  1. Entregar 2–3 auditorias urbanas gratuitas de imóveis em edital aberto da Caixa em Boa Viagem/Madalena/Casa Forte dentro de comunidades/canais parceiros (mostrando cruzamento oficial sem juízo de valor).
  2. Direcionar para landing page dedicada **"Pré-Análise Urbana & Fiscal para Leilão/Venda Direta em Recife (`V2` R$ 199 em 24h)"**, destacando SPU/Marinha, Defesa Civil, alvarás 150 m e régua ITBI.

#### Canal 3 — Ecossistema Porto Digital / CESAR / HC-UFPE + `r/Recife` Transparente + Loop WhatsApp ("3 Linhas" & Casal)
- **Por que funciona para o VEREDA:** `[Data]` `[Opinion]` O **Porto Digital** encerrou 2025 com **541 empresas e 24.079 colaboradores** (+19% vs. 2024; `01-discovery/raw/competitor-gtm.md`), com forte fluxo de profissionais híbridos/remotos (e residentes médicos no HC-UFPE/IMIP/Oswaldo Cruz) que buscam apartamento nos 5 bairros-piloto (R$ 2.500–6.000/mês) e precisam evitar ruído de obras e calor poente no *home office*. No **`r/Recife` (~81 mil membros)**, postagens transparentes de ferramentas cívicas/dados abertos da PCR geram tração orgânica imediata sem custo de mídia.
- **Alcance estimado:** **24.079 colaboradores** no ecossistema Porto Digital/CESAR + **~81.000 inscritos** no `r/Recife` `[Data]`; expectativa realista de **200 a 600 sessões qualificadas/mês** no piloto sem gastar em anúncios `[Estimate]`.
- **CAC estimado:** **R$ 0 – R$ 10** (custo operacional de guia web + loop viral embutido). `[Estimate]`
- **Tempo até os primeiros resultados:** **7 a 14 dias** para validação e primeiros acessos Web-First. `[Estimate]`
- **Como começar:**
  1. Consertar `Carteira.tsx`/`descarte.ts` e liberar **1 *Free-Look* por prédio** (mostrando contagem de alertas sem revelar detalhes críticos) + **Compartilhar Comparação do Casal no WhatsApp** e **"Mensagem de 3 Linhas"** (`src/dados/mensagem.ts`).
  2. Publicar no `r/Recife` (pedindo aprovação prévia via *Modmail* e sem nenhum link afiliado/disfarçado): *"Mapeamos 2.688 prédios de 5 bairros do Recife com dados abertos da Prefeitura (alagamento, obras em 150 m, sol nas fachadas e GTFS) — testem grátis e apontem erros de rua/prédio"*.
  3. Distribuir **"Guia Web de Mudança Segura (5 Bairros)"** em canais de *onboarding* do CESAR/Porto Digital (`CodeCrab`, `GDG Recife`, `RFEC`, Slack/RH parceiros) e grupos de residência médica (HC-UFPE), monetizando **Passe Decisão R$ 79,90** e **`V2` R$ 199** via Pix Web. *(Veto rigoroso: não mirar repúblicas de graduação Sisu na Várzea/Iputinga para receita).*

---

### Tier 2: Médio Impacto, Médio Custo (Ativar a partir da Semana 5–9)

#### Canal 4 — Micro-Criadores Locais de Recife (5k–50k seguidores) + Afiliado Pix (25%–30% CPA)
- **Por que funciona para o VEREDA:** `[Data]` `[Estimate]` Adaptação cirúrgica do playbook *Olho no Carro* (`R$ 2M → R$ 20M` via YouTube creators + cupom 10% + Pix) focado no **Recife** e no ticket **`V2` (R$ 199/349)** ou **Passe Completo (R$ 79,90)**. Perfis locais de arquitetura/decoração, direito imobiliário educativo, finanças pessoais em PE e guias urbanos do Recife têm audiência concentrada na RMR (evitando o erro de perfis gigantes nacionais ou páginas de meme genéricas como `@recifeordinario`, ~2,2M, que trazem curiosos de fora dos 5 bairros e geram avaliações 1 estrela).
- **Alcance estimado:** **15.000 a 50.000 visualizações qualificadas no Recife** somando 4 a 6 micro-criadores em 60 dias (`[Estimate]` baseado em engajamento típico de micro-perfis 5k–50k).
- **CAC estimado:** **R$ 20 – R$ 87** via estrutura híbrida (cachê enxuto R$ 0–300 + **25%–30% CPA via Pix** = R$ 20–24 no passe R$ 79,90; R$ 50–105 no Concierge `V2`). `[Estimate]`
- **Tempo até os primeiros resultados:** **30 a 60 dias** (triagem de *Insights* geográficos + gravação + publicação). `[Estimate]`
- **Como começar:** Auditar *Insights* exigindo ≥ 60% do público em Recife/RMR; entregar roteiro de demonstração real de um prédio local (ex.: impacto de obra 150 m + sol poente + SPU) **sem mencionar marcas de portais** (`Campus Mobile 11.20(iv)`) e com link UTM + cupom rastreável direto para o **Web Checkout Pix**.

#### Canal 5 — SEO Programático Cirúrgico por Entidade de Edifício & Calculadoras Locais (GEO)
- **Por que funciona para o VEREDA:** `[Data]` `[Opinion]` Embora **AI Overviews (AIO)** derrubem em **58%–61%** o CTR de consultas informacionais amplas (`01-discovery/raw/competitor-gtm.md`; Ahrefs/Conversion 2025–2026), buscas por **entidade de edifício específico** (`"Edifício [Nome] Boa Viagem"`) e **consultas estruturadas cruzadas** (`DSQFL`, alvarás em 150 m, ITBI histórico, SPU/Marinha por lote) exibem apenas portais com ficha genérica de quartos/vagas — sem dados municipais auditados.
- **Alcance estimado:** **2.688 páginas de edifícios** nos 5 bairros-piloto (expansíveis a **7.206 prédios** em 72 bairros); expectativa realista de **300–1.500 visitas orgânicas/mês** após 4–9 meses de indexação (`DATA GAP` para tráfego exato sem Keyword Planner). `[Estimate]`
- **CAC estimado:** **~R$ 0 – R$ 5** marginal em 6–12 meses. `[Estimate]`
- **Tempo até os primeiros resultados:** **4 a 9 meses** para ranqueamento estável no Google (investimento contínuo pequeno de **2h/sem** a partir da Semana 5, zero aposta de caixa imediato em 90 dias). `[Estimate]`

#### Canal 6 — Meta Ads Retargeting Hiper-Local (Exclusivo para `V2` R$ 199 / R$ 349)
- **Por que funciona para o VEREDA:** `[Data]` `[Estimate]` Com o repasse tributário da Meta no Brasil em 2026 (**+12,15% "por dentro" / +13,83% "por fora"**), anúncios frios quebram. Porém, **retargeting** sobre visitantes que já abriram o *Free-Look* de um prédio nos 5 bairros ou interagiram com vídeo de criador local — apontando para **Concierge `V2` (R$ 199 / R$ 349)** — opera com CPC efetivo estimado de **R$ 1,71–3,41** e pode converter dentro do teto CAC 3:1 de **R$ 46,43–84,09** `[Estimate]`.
- **Alcance estimado:** **1.000 a 4.000 usuários aquecidos/mês** nos 5 bairros (após tráfego inicial orgânico/criadores). `[Assumption]`
- **CAC estimado:** **R$ 35 – R$ 80** em retargeting direto para `V2` (sendo inviável se CVR cair abaixo de 3%–4% ou se o ticket for R$ 49,90). `[Estimate]`
- **Tempo até os primeiros resultados:** **Semanas 9–12** (não rodar antes de acumular pixel/audiência qualificada nas Semanas 1–8).

---

### Tier 3: Apostas de Longo Prazo (Meses 4–12+)

- **B2G / CPSI (`E.I.T.A! Recife` / LC 182/2021):** `[Data]` Contratos de inovação aberta de **R$ 40k–50k** iniciais até teto de **R$ 1,6 milhão** (`01-discovery/raw/demand-signals.md`) para painéis urbanos (Defesa Civil / Sefin / Licenciamento). Excelente capital não-dilutivo para financiar a atualização de dados (`VE16`), mas ciclo público lento (6–12 meses) inviabiliza meta de 90 dias.
- **Lotes Corporativos RH / Relocation Pós-Expansão RMR:** `[Data]` `[Estimate]` Venda de lotes pré-pagos (ex.: **R$ 1.490 por 10 colaboradores**) para grandes empregadores e hospitais em PE (`01-discovery/raw/pricing-intel.md`), viável somente após expandir cobertura para além dos 5 bairros-piloto (`Torre` e RMR).
- **Lojas Móveis Nativas (Play Store / App Store):** `[Data]` Só devem atuar como **leitor autenticado / Modo Visita pós-compra web**, após fechar o exploit de `Carteira.tsx`, evitando queda de 70%–85% no funil de download *zero-brand*, taxa de **10%–15%** pós-CADE e risco de rejeição **Apple Guideline 5.2.2** por WebView de terceiros (`01-discovery/raw/competitor-gtm.md`).

---

### Canais a Evitar (Vetos Explícitos nos Próximos 90 Dias)

| Canal / Público Vetado | Motivo Baseado em Evidências (`[Data]` / `[Estimate]`) |
|---|---|
| **Google Ads / Meta Ads frios para Passe R$ 49,90** | Margem líquida de **R$ 41,21** (teto CAC 3:1 = **R$ 13,74**). Mesmo antes do imposto Meta 2026 (+13,83%), o CAC real imobiliário no Brasil é **R$ 100–750+** (7× a 55× acima do teto). |
| **Google Search frio em *"personal shopper imobiliário"* e *"due diligence"* genérico BR** | CPC de **R$ 8–25+** (`personal shopper`) e **R$ 6–18+** (`due diligence`), com LP B2B/jurídica convertendo **1,5%–3,5%** → CAC implícito de **R$ 171–1.200**, rompendo até o teto de **R$ 84,09** do `V2` R$ 349. |
| ***"Shadow ads"* / astroturfing no Reddit (`r/Recife`, `r/investimentos`, `r/ConselhosLegais`) e X** | Filtros automáticos (*Crowd Control*, CQS) e moderadores removem e banem divulgação disfarçada; no `r/ConselhosLegais`, captação viola também normas éticas da OAB. |
| **Instagram / TikTok de "curiosidades urbanas nacionais" com link na bio p/ App Store** | Consome **8–12h/semana** (quase toda a banda da equipe), exige **~80.000 views qualificadas no Recife** para gerar 1 venda de R$ 49,90 (`01-discovery/raw/competitor-gtm.md`) e atrai usuários fora de PE que dão **1 estrela** por falta de cobertura. |
| **Corretores *Sell-Side* / Stands / Incorporadoras** | Conflito econômico irreconciliável (comissão de 5%–8% só cai se fechar; dados negativos reduzem venda). Risco de boicote idêntico ao caso **Zillow × First Street (nov/2025)**. |
| **Turistas (Airbnb) & Calouros Sisu (<R$ 1,5k/mês)** | Turistas ficam **2–6 dias** (não pagam IPTU, condomínio, laudêmio ou multa rescisória); calouros Sisu concentram-se na Várzea/Iputinga (mediana R$ 1.500/mês, `censo-renda-setores.json`), fora da cobertura e sem WTP. |

---

## 2. Realidade de SEO Programático & Google AI Overviews (Brasil 2025–2026)

### 2.1 O que os Dados de 2025–2026 Provam no Brasil
- **Erosão massiva do clique informacional:** `[Data]` Pesquisas de mercado consolidadas em 2025–2026 indicam que os **AI Overviews (AIO)** já aparecem em cerca de **47%–48% das buscas**, sendo **~99%** acionados por intenção informacional ou de cauda longa (*Ahrefs*, *Shakers*). Quando há um bloco de AIO no topo da SERP, o **CTR da 1ª posição orgânica despenca entre 58% e 61%** (*Ahrefs* / *Conversion* / *Flowup* / *Dataslayer*).
- **Punição de *Scaled Content Abuse*:** `[Data]` Desde o endurecimento das diretrizes anti-spam de 2024–2026, o Google desindexa páginas programáticas rasas que apenas trocam `{bairro}` ou `{termo}` em textos genéricos (*Seomatic*). Em contrapartida, páginas programáticas com **dados primários exclusivos, tabelas comparativas estruturadas (`Schema.org`) e ferramentas interativas** sobrevivem como páginas transacionais ou são **citadas como fonte dentro dos AIOs** (*GEO — Generative Engine Optimization*).

### 2.2 Auditoria Empírica das SERPs de Recife (Onde a IA Substitui vs. Onde Ela Falha)
Verificação direta das SERPs brasileiras em novembro de 2026 revela uma divisão nítida:

1. **`"terreno de marinha recife laudêmio"` — AIO explica a lei, mas é cega por lote:**
   - *Quem ranqueia hoje:* AIO no topo + `secovi-pe.com.br`, `gov.br` (SPU), `rodrigomontenegro.com.br`, `gabrielapereiraadvocacia.com.br`, `valenbrasil.com`, `ibet.com.br`, `vivareal.com.br`.
   - *Limite da IA:* A IA explica perfeitamente a regra (faixa de 33 m da LPM de 1831, 5% de laudêmio, 0,6% foro, 2% ocupação, CAT e consulta via RIP no GOV.BR), mas **não sabe se o Edifício X na Rua Y em Boa Viagem ou Madalena cruza a poligonal SPU/preamar**.
2. **`"prédio caixão boa viagem recife"` — Informação fragmentada em notícias e PDFs:**
   - *Quem ranqueia hoje:* AIO + matérias jornalísticas (`globo.com`, `cbnrecife.com`, `ebc.com.br`, `cnnbrasil.com.br`) e `sindiconet.com.br`, citando apenas casos avulsos (ex.: Edf. Apolônio Sales, Res. Boa Viagem I, Edf. Emílio Santos) e remetendo aos canais da **Seduh/PE** e **JFPE** sobre os **431 prédios** do acordo federal.
   - *Limite da IA:* Não existe lookup rápido por endereço/edifício cruzando ano cadastral, número de pavimentos e enquadramento histórico/Lei PE nº 13.032/2006 (lembrando a trava rígida do `CRIVO`: exibir **apenas fatos cadastrais com fonte/data**, jamais "nota de risco de desabamento").
3. **`"cota extra condomínio inquilino"` — Zona morta por AIO + Intenção tardia:**
   - *Quem ranqueia hoje:* AIO + portais jurídicos e condominiais (`leidoinquilinatonapratica.com.br`, `sindiconet.com.br`, `brcondos.com.br`, `porter.com.br`, `dosadvocacia.com.br`).
   - *Diagnóstico:* A IA já responde verbatim os arts. 22 e 23 da Lei nº 8.245/1991, e quem busca isso **já assinou o contrato** (dor pós-mudança, fora do funil de compra/locação do VEREDA).
4. **`"como saber se rua alaga recife"` — Resposta genérica de avenidas, sem impacto no trajeto:**
   - *Quem ranqueia hoje:* AIO + `conecta.recife.pe.gov.br`, `FloodGIS` (`arcgis.com`), `cbnrecife.com` (citando grandes corredores como Av. Eng. Abdias de Carvalho, Mascarenhas de Moraes, Dois Rios, Conde da Boa Vista).
   - *Limite da IA:* A IA **não calcula** se o trecho específico entre o Edifício X e a parada de ônibus Y tem ocorrências datadas da Defesa Civil (2014–2024) nem o desvio pedonal em minutos (`6 min → 13 min`).
5. **Consultas Cadastrais & Páginas de Edifício (`"DSQFL recife"`, `"alvará de construção recife"`, `"IPTU recife valor venal"`, `"Edifício [Nome] Boa Viagem"`):**
   - *Quem ranqueia hoje:* Para termos municipais oficiais, aparecem páginas de serviço fragmentadas (`recifeemdia.recife.pe.gov.br`, `licenciamentounificado.recife.pe.gov.br`, `dados.recife.pe.gov.br`) — inclusive `"DSQFL"` quase não aparece indexado de forma amigável ao cidadão comum! Já buscas por nomes de edifícios (`Edf. Portugal`, `Edf. Manhattan`, `Studio Graças`, `Espinheiro Residence`, `Madalena Classic`) são dominadas por classificados (`imovelweb`, `olx`, `vivareal`, `loft`, `lopes`) e corretoras locais (`xmetrosquadrados`, `hgimoveisrecife`, `melorodrigues`), que exibem apenas quartos/vagas/lazer e **zero** histórico de obras em 150 m, ITBI fiscal, chuva ou sol 3D.

### 2.3 Top 10 Oportunidades de Palavras-Chave (BR / Recife)

> **Declaração de `DATA GAP`:** Não houve acesso pago a Google Keyword Planner, Semrush ou Ahrefs nesta etapa. Volumes mensais exatos e *Domain Rating (DR)* / *Keyword Difficulty (KD)* numéricos estão marcados como **`DATA GAP`**, substituídos por competição observada na SERP real e vulnerabilidade verificada a AI Overviews.

| # | Palavra-Chave / Padrão | Volume & KD | Concorrência Observada na SERP (Nov/2026) | Impacto AIO | Intenção & Público | Cunha do VEREDA (Por que a IA não mata) |
|---|---|---|---|---|---|---|
| **1** | **`[Nome do Edifício] [Bairro] Recife`** *(2.688–7.206 páginas programáticas)* | `DATA GAP` | Portais de anúncios (`Imovelweb`, `OLX`, `VivaReal`, `Loft`, `Lopes`) + imobiliárias locais | **Baixo** *(busca de entidade/endereço local)* | Comprador / Locatário em triagem | Classificados listam quartos e preço pedido; **nenhum** exibe histórico ITBI fiscal do prédio, alvarás em 150 m, chuvas Defesa Civil, faces solares e GTFS no mesmo endereço. |
| **2** | **`due diligence imobiliária recife`** / **`análise documental imóvel recife`** | `DATA GAP` | Escritórios boutique de advocacia locais (baixo conteúdo interativo, foco em contato) | **Médio** *(AIO explica conceito, mas usuário quer contratar)* | **Persona A + Arrematantes (`V2` R$ 199/349)** | Landing page de conversão com checklist local (SPU, ITBI, condomínio, matrícula) + âncora de preço (`R$ 199 vs. piso OAB-PE R$ 6.038,70`) e entrega em 24h. |
| **3** | **`terreno de marinha recife consulta endereço`** / **`laudêmio recife`** | `DATA GAP` | AIO + `secovi-pe.com.br`, `gov.br`, blogs de advocacia | **Alto** para *"o que é"* / **Baixo** para **consulta por rua/prédio** | **Persona A (Boa Viagem/Pina/Madalena)** | Calculadora/consulta interativa por endereço ou prédio mostrando proximidade à linha de preamar SPU + impacto financeiro de 5% laudêmio + foro/ocupação. |
| **4** | **`alvará de construção recife consulta endereço`** / **`obras perto [rua] recife`** | `DATA GAP` | Portais lentos/técnicos da PCR (`licenciamentounificado`, `dados.recife.pe.gov.br`, `conecta`) | **Baixo** *(requer banco de dados vivo por endereço)* | **Persona A & B (home office / silêncio)** | Busca instantânea em linguagem humana por rua/edifício mostrando alvarás de demolição/construção ativos num raio de **150 m** (o que nenhum portal oficial entrega com 1 clique). |
| **5** | **`leilão caixa recife como analisar imóvel`** / **`venda direta caixa recife`** | `DATA GAP` | `caixa.gov.br`, agregadores (`Leilão Imóvel`, `Monitor Leilão`, `Arremate Score`), vídeos YouTube | **Médio** *(passo a passo genérico; usuário busca checagem do lote)* | **Arrematantes Caixa (`V2` R$ 199/349)** | Ferramenta prática de pré-diligência urbana/fiscal de lotes em Recife + checklist SPU/prédio-caixão/alagamento antes do lance ou proposta direta. |
| **6** | **`prédio caixão boa viagem recife lista`** / **`consultar prédio caixão recife`** | `DATA GAP` | AIO + notícias (`G1/Globo`, `CBN Recife`, `CNN`, `EBC`) e `SíndicoNet` | **Alto** para histórico / **Baixo** para lookup | **Persona A (Usados) & Financiadores Caixa** | Tabela estruturada e buscável cruzando dados públicos disponíveis (idade cadastral, pavimentos, referências oficiais Seduh/JFPE e Lei PE 13.032/2006) — **sem atribuir nota de risco**. |
| **7** | **`ITBI recife cálculo valor venal`** / **`quanto custa escritura imóvel recife`** | `DATA GAP` | `recifeemdia.recife.pe.gov.br`, `cbnrecife.com`, blogs (`apartamentolivre`, `custosimovel`), escritórios | **Médio-Alto** *(AIO cita 3% padrão / 1% SFH)* | **Persona A (pré-proposta)** | **Calculadora Interativa de ITBI + Emolumentos PE + SPU Recife** (comparando 3% vs. 1% SFH vs. 5% laudêmio + referência histórica do prédio) → captura email/WhatsApp para `V2`. |
| **8** | **`como saber se rua alaga recife`** / **`mapa alagamento boa viagem madalena`** | `DATA GAP` | AIO + `Conecta Recife`, `FloodGIS` (`arcgis.com`), matérias `CBN Recife`/`G1` | **Alto** em *"quais avenidas"* / **Baixo** por endereço específico | **Persona A & B (Topo de funil)** | Mostrar o **Ledger datado Defesa Civil (2014–2024)** na rota real do prédio até a parada/mercado (ex.: desvio de 6 → 13 min), algo que mapas genéricos e AIO não calculam. |
| **9** | **`apartamento nascente ou poente recife conta de luz`** | `DATA GAP` | Blogs de construtoras (`Ceta`, `V2`, `Paulo Mauro`, `3 Pinheiros`) e YouTube | **Alto** *(conceitual; IA já resume prós/contras)* | **Persona B (Híbridos/Transferidos)** | Simulador interativo de **incidência solar em volumes 3D por edifício e horário** (`VE07`), provando quando um prédio vizinho bloqueia ou agrava o sol da tarde em Recife. |
| **10** | **`vistoria pré-compra apartamento recife`** | `DATA GAP` | Sites individuais de engenheiros/consultorias (`Rebeka Pedrozo`, `Mangieri`, `Periton`) | **Médio** | **Persona A + B2B2C (`IBAPE-PE`)** | Página de **triagem pré-vistoria** explicando o que checar antes de pagar R$ 700–1.500 em ART física + diretório/parceria com peritos locais. |

### 2.4 Estratégia Recomendada de Conteúdo & GEO (Ajustada a 2h/semana)
- **Regra anti-*Scaled Content Abuse*:** `[Opinion]` Não gerar 2.688 páginas de texto genérico por IA. Gerar páginas de edifício **somente** quando houver densidade mínima de fatos cruzados (cadastro `DSQFL`/Sefin + alvarás em 150 m + ocorrências Defesa Civil + geometria solar 3D + rotas GTFS) e apresentar **tabelas factuais limpas (`Schema.org` + FAQ estruturada)** com **widget de *Free-Look*** (contagem de achados desbloqueada no Web-First Pix).
- **Priorizar 3 Calculadoras/Consultas Interativas (Iscas de Backlink e Topo de Funil):**
  1. *Simulador de Custo Real de Compra em Recife* (ITBI 3%/1% + Laudêmio 5% SPU + Emolumentos PE);
  2. *Buscador de Alvarás de Obras em 150 m por Rua/Edifício do Recife*;
  3. *Consulta de Histórico de Alagamento na Rota a Pé (Defesa Civil 2014–2024)*.

---

## 3. Comunidades BR/Recife, Leilão Caixa & Mecânica Viral WhatsApp/PDF

### 3.1 Mapa de Comunidades Reais, Regras e Protocolo de Acesso

| Comunidade / Canal | Tamanho / Escala Verificada | Regras de Autopromoção & Moderação | Protocolo Seguro de Abordagem (Sem Banimento) |
|---|---|---|---|
| **`r/Recife`** (Reddit) | **~81.000 membros** `[Data]` | Moderação local combate spam comercial; tolera projetos cívicos/locais se houver transparência total e utilidade real para moradores. Filtros *Crowd Control* e CQS barram contas novas/astroturfing. | **Proibido *shadow ad*.** Conta com histórico real pede autorização via *Modmail*; post transparente compartilhando ferramenta aberta com dados da PCR pedindo feedback e correções de rua. |
| **`r/investimentos`** (Reddit) | **~1,2 milhão de membros** `[Data]` | Proíbe expressamente autopromoção de produtos/blogs/assessorias sem contribuição genuína; "Regra dos 10%" (90% participação orgânica antes de qualquer menção); remove links comerciais imediatamente. | **Não postar links do VEREDA.** Usar apenas para aprender objeções reais de investidores/arrematantes e responder dúvidas com estudos de caso numéricos sem link comercial. |
| **`r/ConselhosLegais`** (Reddit) | **~75.000 membros** `[Data]` | Veda captação de clientes (Código de Ética OAB), conselhos ilegais e respostas automatizadas por IA; foco estrito em orientação jurídica informativa. | **Zero promoção ou captação.** Apenas pesquisa passiva das dores reais recorrentes (arras, cota extra, vício oculto, SPU) para calibrar copy das LPs. |
| **Grupos de Arrematantes Caixa (Telegram & WhatsApp)** | `DATA GAP` *(ex.: canais estaduais Pro Leilão PE/NE, grupos de Venda Direta de corretores credenciados, comunidades de cursos)* | Alta desconfiança de golpes (sites falsos de leilão, Pix de terceiros); admins banem links não autorizados imediatamente. | Abordar **administradores/assessores de leilão** no privado oferecendo **auditoria urbana gratuita para 2 lotes do próximo edital de Recife** em troca de divulgação autorizada no grupo ou parceria `B2B2C`. |
| **Ecossistema Porto Digital / CESAR / UFPE** | **541 empresas / 24.079 colaboradores** no Porto Digital `[Data]`; comunidades *CodeCrab*, *GDG Recife*, *DSE*, *RFEC*, Slack CESAR | Grupos técnicos e acadêmicos aceitam compartilhamento de projetos open-data/tech locais quando construídos na comunidade; repudiam spam comercial agressivo. | Apresentar como case de engenharia de dados cívicos do Recife; oferecer **"Guia Web de Mudança Segura (5 Bairros)"** para *onboarding* de novos contratados/híbridos e residentes médicos (HC-UFPE). |
| **Grupos de Moradores & Condomínios no Recife (Facebook / Síndicos)** | `DATA GAP` *(grupos privados ex.: Moradores Boa Viagem, Condomínios Boa Viagem, Moradores Casa Forte, Síndicos PE; eventos Fesíndico / SECOVI-PE)* | Grupos de Facebook de bairro são **privados** e exigem validação de endereço/edifício; síndicos reagem mal a qualquer rótulo de "prédio problemático". | Não fazer panfletagem comercial em grupos fechados. Atuar via moradores/testadores reais ou participar de eventos abertos (Fesíndico / SECOVI-PE) coletando dores sem expor notas contra condomínios. |
| **Associações *Buyer-Side* & Periciais PE (`OAB-PE CDI`, `IBRADIM-PE`, `IBAPE-PE`)** | **~47k OAB-PE** (CDI listada publicamente), **IBRADIM-PE** (*After Hours* / Congresso NE), **IBAPE-PE** (diretório público), subset *buy-side* **CRECI-PE** `[Data]` | Código de Ética da OAB (Prov. 205/2021) proíbe mercantilismo; profissionais exigem rigor técnico, fontes oficiais datadas e isenção de responsabilidade. | **Outreach 1-a-1** (LinkedIn/WhatsApp profissional/eventos) oferecendo **3 Dossiês Co-Branded gratuitos** como anexo factual do parecer/laudo — jamais posicionando o VEREDA como concorrente do advogado ou perito. |

### 3.2 Engenharia da Mecânica Viral (WhatsApp + PDF Co-Branded)
1. **Otimização da "Mensagem de 3 Linhas" (`src/dados/mensagem.ts`):**
   - *Estado atual no código:* `mensagemParaCorretor` já gera lista enxuta com até 6 perguntas pendentes (priorizando `lacuna-endereco`) e encerra com `"Obrigado!\n\nMensagem preparada com o VEREDA."`.
   - *Ajuste recomendado para tração sem atrito:*
     1. Manter o tom estritamente cordial e factual (`CRIVO`), evitando que o corretor *sell-side* se sinta "investigado" e bloqueie o comprador.
     2. Criar **modo "Compartilhar Comparativo no WhatsApp (Casal / Família)"**: `[Data]` **64% a 72%** dos compradores residenciais decidem em conjunto (`01-discovery/raw/target-audience.md`). Um botão **"Enviar resumo de 3 linhas dos 2 finalistas para [cônjuge/pai/advogado]"** gera um link curto `Free-Look` (com contagem de achados e ponto de empate financeiro), multiplicando cada usuário ativo por **1,5–2,5 novos acessos orgânicos de altíssima intenção** sem depender da boa vontade do corretor vendedor. `[Estimate]`
2. **Loop *Co-Branded* com QR Code e Hash (`Arquitetura C`):**
   - Cada PDF exportado por advogado (`OAB-PE`), engenheiro (`IBAPE-PE`) ou assessor *buy-side* (`CRECI-PE`) traz no rodapé: *"Anexo Factual de Bases Públicas · Preparado para [Nome do Escritório] via VEREDA · Conferir integridade e data de corte via QR Code"*.
   - **Por que viraliza no fundo de funil:** O comprador final que recebe o parecer (ou seu cônjuge/corretor) escaneia o QR Code para conferir os mapas/fontes na web e pode rodar o *Free-Look* de seus outros 2 imóveis favoritos ali mesmo — gerando **aquisição B2C quente a CAC R$ 0** com selo implícito de confiança do advogado/perito. `[Opinion]`

---

## 4. Benchmark Profundo de Tráfego Pago (BR/Recife 2026) & Micro-Creators PE

### 4.1 A Matemática Real de Google Ads e Meta Ads (Após Imposto Meta 2026 de +12,15%)

**Fato Tributário Crítico de 2026 (`[Data]`):** Desde **1º de janeiro de 2026**, o Meta Ads Brasil passou a repassar diretamente aos anunciantes **12,15% "por dentro"** (**9,25% PIS/COFINS + 2,90% ISS**). Na prática:
- Em **faturamento pós-pago (cartão)**: cada **R$ 100,00** investidos no leilão do Gerenciador gera cobrança real de **R$ 113,83** (**+13,83% "por fora"**).
- Em **pré-pago (Pix)**: cada **R$ 100,00** depositados entrega apenas **~R$ 87,15** líquidos para o leilão.
- Como o VEREDA operará inicialmente no **Simples Nacional**, **não há aproveitamento de crédito tributário** de PIS/COFINS sobre a nota da Meta. Toda métrica nominal de Meta Ads precisa ser multiplicada por **1,1383×** para refletir o gasto real de caixa.

| Canal / Segmento (BR & Recife 2025–2026) | CPC Nominal / Efetivo (c/ Imposto) | CPL / CVR Observado (`[Data]`) | CAC Implícito Real (`[Estimate]`) | Veredito vs. Tetos 3:1 (`A2 R$ 13,74` · `A3 R$ 21,97` · `B1 R$ 46,43` · `B2 R$ 84,09`) |
|---|---|---|---|---|
| **Google Search — Imobiliário Geral Recife** (`apartamento boa viagem`) | **R$ 4,00 – R$ 12,00** | CPL R$ 40–150 · CVR 1%–3% | **R$ 133 – R$ 750+** | **INVIÁVEL** em qualquer produto B2C (`6×` a `54×` acima dos tetos). |
| **Google Search — *"Due diligence imobiliária"* / Advogado Imob.** | **R$ 6,00 – R$ 18,00+** | LP B2B/Jurídica CVR **1,5% – 3,5%** | **R$ 171 – R$ 1.200** | **INVIÁVEL frio** mesmo para `V2` R$ 349 (`R$ 84,09`), a menos que venda pacotes B2B de alto LTV (`C2` 6m LTV = `R$ 425`). |
| **Google Search — *"Leilão Caixa"* / Venda Direta** | **R$ 2,50 – R$ 7,00** | CPL **R$ 35 – R$ 120** | **R$ 117 – R$ 400** *(a 20%–30% fechamento do lead)* | **ARRISCADO frio** (estoura `3:1` de R$ 84,09; só tangencia *breakeven* 1:1 no `B2` R$ 349 com funil altamente qualificado). |
| **Google Search — *"Personal shopper imobiliário"*** | **R$ 8,00 – R$ 25,00+** | CPL **R$ 150 – R$ 450** | **R$ 500 – R$ 1.500+** | **VETADO.** Economia exclusiva de corretores de comissão de 4%–6% (R$ 30k+/venda). |
| **Meta Ads Frio — Imobiliário Médio/Alto / Jurídico** | Nominal R$ 1,50–4,50 (Imob.) / R$ 3–9 (Jur.) → **Efetivo R$ 1,71 – R$ 10,24** | CPL Nominal R$ 15–40 → **Efetivo R$ 17,07 – R$ 45,53** | **R$ 68 – R$ 227** *(a 20%–25% fechamento)* | **INVIÁVEL para Passes (`R$ 49,90–79,90`)** e **arriscado frio para `B1/B2`** com caixa de R$ 0–3k. |
| **Meta Ads Retargeting (Recife) — Visitantes *Free-Look* → `V2` (R$ 199/349)** | Nominal R$ 1,50–3,00 → **Efetivo R$ 1,71 – R$ 3,41** | Público aquecido CVR checkout **5% – 8%** (ou WhatsApp close 15%–20%) | **R$ 25 – R$ 68** | **ÚNICO USO PAGO VIÁVEL em 90 dias:** cabe no teto de **`B1` (R$ 46,43, se ≤ R$ 45)** e folgadamente em **`B2` (R$ 84,09)** a partir da Semana 9. |

### 4.2 Economia de Micro-Creators Locais em Recife (5k–50k Seguidores) + Afiliado Pix
- **Benchmarks verificados no Brasil (2026):** `[Data]`
  - **Nano (1k–10k):** permuta qualificada ou **R$ 100 a R$ 500** por entrega.
  - **Micro (10k–50k):** **R$ 300 a R$ 800** (pacote de 3 Stories + menção) e **R$ 600 a R$ 2.000** (Reels/vídeo dedicado no Feed). Perfis de arquitetura, engenharia e finanças pessoais cobram no topo da faixa devido ao público qualificado.
  - **Modelo de afiliado validado (`Olho no Carro`):** `[Data]` Programa aberto *Indique e Ganhe* paga **10% de comissão sacável via Pix** (+10% de desconto ao cliente, saque mínimo R$ 25), enquanto negociações diretas com criadores de nicho no Brasil praticam **25% a 30% de CPA** por venda rastreada.
- **Estrutura Híbrida Calibrada para Caixa de R$ 0–3k (`[Estimate]`):**
  - **Por que não pagar R$ 1.500 fixo:** Uma única postagem que falhar consome 50% do caixa trimestral inteiro.
  - **Proposta para 4–6 micro-criadores do Recife (arquitetura/reforma, advogados imobiliários educadores, guias de bairros/vida em Recife, finanças pessoais PE):**
    - **Cachê fixo enxuto de ativação:** **R$ 0 a R$ 250 via Pix** para cobrir produção de 1 Reels mostrando auditoria real de prédio no Recife + 3 Stories com link direto Web;
    - **Comissão de performance via Pix: 25%–30% CPA** + cupom de **10% OFF** para a audiência:
      - No **Passe Completo `A3` (R$ 79,90)**: comissão de 25% = **R$ 19,98** (margem líquida retida de **R$ 45,94**);
      - No **Dossiê `V2 B1` (R$ 199)**: comissão de 25% = **R$ 49,75** (margem retida de **R$ 89,53**);
      - No **Concierge `V2 B2` (R$ 349)**: comissão de 25% = **R$ 87,25** (margem retida de **R$ 165,03**).
  - **Cláusula obrigatória no briefing:**
    1. Exigir print do *Instagram Insights* comprovando **≥ 60% de audiência em Recife/RMR** (evitando curiosos de SP/RJ);
    2. Proibir menção a marcas de portais (`OLX`, `ZAP`, `VivaReal`, `QuintoAndar`) para blindar elegibilidade na **15ª ed. Campus Mobile (Reg. 11.20(iv))**;
    3. Solicitar autorização de *whitelisting* / uso do vídeo nativo para testar como criativo no **Meta Retargeting (Semanas 9–12)**.

---

## 5. Oportunidades de Parcerias Priorizadas

| Parceiro / Tipo | O que Eles Ganham | O que o VEREDA Ganha | Como Abordar (Ação Prática) | Prioridade |
|---|---|---|---|---|
| **Advogados Imobiliários (`OAB-PE CDI` / `IBRADIM-PE`)** | Economia de 1,5–3h de pesquisa em portais municipais + anexo visual factual *Co-Branded* que justifica honorário e capta cliente antes da perda de *arras*. | **MRR B2B2C (`R$ 249/mês`) ou Packs (`R$ 199/10`)** + distribuição gratuita para compradores finais via QR Code no PDF. | Lista pública da CDI/OAB-PE + LinkedIn direto oferecendo 3 anexos gratuitos para o próximo parecer de compra. | **ALTA** |
| **Engenheiros Vistoriadores (`IBAPE-PE` / `CREA-PE`)** | Diferencial imediato no laudo pré-compra ou cautelar de vizinhança (alvarás de demolição em 150 m + Defesa Civil + sol 3D), permitindo cobrar *add-on* de R$ 200–350. | Pacotes recorrentes (`C1/C2`) + credibilidade técnica compartilhada sem assumir responsabilidade estrutural (`ART`). | Diretório público `ibape-pe.org.br`; amostra de PDF mostrando raio de 150 m de licenciamento ao lado da vistoria física. | **ALTA** |
| **Assessores de Leilão Caixa & *Buy-Side* Independentes (`CRECI-PE`)** | Triagem rápida de imóveis retomados em Recife (SPU/Marinha, alagamento, ITBI fiscal, prédio-caixão) para fechar mais arremates seguros sem perder tempo em lotes ruins. | Vendas rápidas de **`V2` (R$ 199/349)** ou **Packs `C1`** com altíssima recorrência por cliente. | Contato direto com corretores credenciados de Venda Direta Caixa e *personal shoppers* independentes em Recife; auditar 2 lotes em aberto grátis como prova. | **ALTA** |
| **RHs / Comunidades Tech & Saúde (`Porto Digital`, `CESAR`, `HC-UFPE`)** | Material de acolhimento prático para colaboradores transferidos/híbridos evitarem alagamento, obras e contas de luz altas nos 5 bairros. | Fluxo constante de **Persona B** com maior WTP (transferidos e médicos residentes) a CAC ~R$ 0. | Oferecer Guia Web gratuito co-assinado para *onboarding* ou grupos de residência/comunidades (`CodeCrab`, `GDG`), mantendo venda via Web Pix. | **MÉDIA** |
| **Micro-Criadores PE (5k–50k seg.)** | Monetização via Pix (**R$ 50–87** por venda `V2`) + conteúdo de utilidade pública altamente compartilhável em Recife. | Alcance hiper-local em vídeo + material pronto para retargeting nas Semanas 9–12. | DM direta com exemplo visual auditado no bairro do criador + cupom 10% OFF + Pix em 48h após confirmação. | **MÉDIA** |
| **Prefeitura do Recife (`E.I.T.A!` / `CPSI` LC 182/2021)** | Ferramenta cívica de cruzamento urbano/climático validada na cidade. | Contrato não-dilutivo (R$ 40k–50k iniciais) para sustentar atualização de bases (`VE16`). | Submeter após ter tração real e métricas de uso B2C/B2B2C consolidadas (Mês 4+). | **BAIXA (<90d)** |

---

## 6. Plano Acionável de Canais — 90 Dias (`10–20h/semana totais` | `R$ 0–3.000`)

### Travas Inegociáveis de Alocação
- **Banda máxima:** Planejado para **16–18 horas/semana totais** distribuídas entre os 5 membros (respeitando o teto de 10–20h/semana):
  - **Engenharia/Dados (2 pessoas):** ~6h/sem totais;
  - **Produto/QA/Validação (1 pessoa):** ~4h/sem;
  - **Comercial B2B2C / Comunidades (1–2 pessoas):** ~6–8h/sem.
- **Compliance transversal:** Zero menção a `OLX`, `ZAP`, `VivaReal` ou `QuintoAndar` em qualquer ativo público/vídeo ligado ao **Campus Mobile 15ª ed. (Reg. 11.20(iv))**; revisão contábil do **Fator R ≥ 28%** (Anexo III 6% vs. Anexo V 15,5%) antes de escalar faturamento.

### Semana 1–4: Estancar Vazamentos, Validar `G-USER` e Lançar Semente B2B2C (`17h/sem` | Caixa: `R$ 0 – R$ 300`)
- **Engenharia & Checkout (`7h/sem` | R$ 100 domínio/infra):**
  1. Corrigir o exploit de créditos em `src/estado/Carteira.tsx` e `src/dados/descarte.ts` (remover `saldo: 3` local irrestrito e o estorno 1:1 infinito por descarte; trocar por **1 *Free-Look* de diagnóstico com contagem de sinais** + ledger servidor via OTP leve).
  2. Publicar **Web Mobile-First (PWA) + Checkout Pix** (`Mercado Pago 0,99%` para R$ 49,90/79,90; `AbacatePay R$ 0,80` para `V2` R$ 199/349), com **termo ativo de execução imediata** (mitigação Art. 49 CDC) e **cláusula informativa** (anti-OAB/CRECI/CREA).
  3. Adicionar botão **"Compartilhar Comparação (Casal/Família)"** ao lado de `mensagemParaCorretor` (`src/dados/mensagem.ts`) e gerar o template de **PDF *Co-Branded* com QR Code + Hash**.
- **Validação Real & Orgânico Inicial (`4h/sem` | R$ 200 incentivos se necessário):**
  4. Executar **`G-USER`** com **8–12 buscadores reais** fora do círculo familiar (recrutados via comunidades Porto Digital / residentes HC-UFPE / conhecidos indiretos) e concluir revisão humana prioritária de `G-BUILDING` / `G-RAIN`.
  5. Após *Modmail*, publicar **1 post transparente no `r/Recife`** compartilhando o *Free-Look* aberto dos 5 bairros para coletar feedback real.
- **Ataque Direto B2B2C (`6h/sem` | R$ 0):**
  6. Mapear e abordar **30 advogados (`OAB-PE CDI` / `IBRADIM-PE`) + 15 vistoriadores (`IBAPE-PE`)**, entregando **3 dossiês *Co-Branded* gratuitos** anexáveis aos próximos casos reais.
- **Meta de Saída (Semana 4) / Critério *Go*:** Exploit fechado; `G-USER` concluído com **≥ 6/8 participantes** citando evidência concreta na escolha da 1ª visita; **150+ usuários reais do Recife** no Web-First; **8+ testes profissionais B2B2C iniciados** e **2–5 primeiras vendas reais via Pix** (entre `V2` ou Pack `C1`).

### Semana 5–8: Converter Primeiros Recorrentes B2B2C, Atacar Leilões Caixa & Estruturar SEO de Entidade (`17h/sem` | Caixa: `R$ 500 – R$ 1.000`)
- **Comercial B2B2C & Arrematantes (`7h/sem` | R$ 200 cafés/impressões):**
  1. Converter profissionais testados na Fase 1 em **Pacote `C1` (R$ 199 / 10 dossiês)** ou **Pro `C2` (R$ 249/mês)**; expandir lista para mais **30 advogados, vistoriadores e *buy-sides* (`CRECI-PE`)**.
  2. Entrar em contato com **5–8 assessores/grupos de Venda Direta e Leilão Caixa em PE** oferecendo auditoria urbana gratuita de 2 imóveis em edital aberto em troca de recomendação da LP **`V2` Anti-Cilada (R$ 199/349)**.
- **Parcerias Ecossistema & Micro-Creators (`5h/sem` | R$ 300–800 cachê base + Pix 25% CPA):**
  3. Fechar parceria de **Guia Web de Mudança Segura** com 2 comunidades de *onboarding* (Porto Digital / CESAR / HC-UFPE).
  4. Contratar **2 primeiros micro-criadores do Recife (5k–30k)** (auditoria de Geo Insights ≥ 60% Recife) com cachê fixo baixo (R$ 150–300) + **25%–30% CPA Pix** e zero menção a marcas de portais (`11.20(iv)`), testando gancho pré-contrato (`Terreno de Marinha` + `obras 150 m`).
- **SEO Programático Cirúrgico & Calculadoras (`5h/sem` | R$ 0):**
  5. Publicar as **3 páginas/calculadoras âncora** (Simulador ITBI+SPU Recife, Buscador de Alvarás 150 m, Rota Defesa Civil) e os primeiros **300–500 perfis estáticos de edifícios de maior busca** em Boa Viagem/Graças/Casa Forte/Espinheiro/Madalena com `Schema.org` + widget *Free-Look*.
- **Meta de Saída (Semana 8) / Critério *Go*:** **4–6 clientes B2B2C pagantes** (R$ 800–1.500 acumulados em packs/MRR); **5–10 vendas `V2` Concierge (R$ 199/349)** validando margem e tempo humano (≤ 30–50 min/caso); **CAC de micro-creators medido** via cupom/UTM.

### Semana 9–12: Escalar o Que Converteu, Ativar Retargeting `V2` e Consolidar Motor Orgânico (`16h/sem` | Caixa: `R$ 1.000 – R$ 1.700`)
- **Escala Seletiva de Micro-Creators + Meta Retargeting (`6h/sem` | R$ 1.000–1.700):**
  1. Dobrar a aposta nos **2 formatos de criadores** com melhor conversão nas Semanas 5–8 e ativar mais **2–4 micro-criadores do Recife** no modelo **25%–30% CPA Pix** (`R$ 500–900` em cachês de teste).
  2. Ligar **Meta Ads Retargeting (orçamento travado de R$ 400–800 totais no mês, já prevendo +13,83% de imposto sobre a fatura)** exclusivamente para visitantes do *Free-Look* de Recife e engajamento nos vídeos dos criadores — direcionando apenas para **`V2` R$ 199 / R$ 349** ou **Pack B2B2C R$ 199** *(nunca para passe de R$ 49,90)*. **Trava de parada automática:** desligar campanha se após R$ 300 gastos o CAC efetivo (com +13,83%) superar **R$ 84,09**.
- **Retenção & Expansão B2B2C + Loop Viral (`6h/sem` | R$ 0):**
  3. Coletar depoimentos/casos reais (anonimizados) dos primeiros compradores `V2` e escritórios B2B2C para prova social ética na landing page.
  4. Acompanhar taxa de escaneamento de **QR Codes dos PDFs *Co-Branded*** e compartilhamentos WhatsApp entre casais; abordar mais **20 escritórios/peritos** por indicação dos primeiros pagantes.
- **SEO & Base de Cobertura (`4h/sem` | R$ 0):**
  5. Completar publicação dos **2.688 edifícios elegíveis** dos 5 bairros (monitorando Google Search Console contra erros de indexação/`Thin Content`) e iniciar preparação de expansão controlada (`VE16` / Torre).
- **Meta de Saída (Dia 90):**
  - **B2B2C:** **8–12 escritórios/profissionais pagantes** (mix Packs R$ 199 + Assinaturas R$ 249/mês = **R$ 1.600 – R$ 2.800/mês** recorrente/recompra); `[Estimate]`
  - **B2C / Concierge `V2`:** **12–25 vendas `V2` (R$ 199/349)** + **25–50 passes orgânicos (R$ 79,90/49,90)** acumulados no trimestre (**R$ 4.000 – R$ 9.500 em vendas totais acumuladas**, validando payback de caixa sem depender de mídia fria). `[Estimate]`

---

## Data Gaps

1. **`DATA GAP` — Volumes de busca mensais exatos (BR/PE) e métricas DR/KD:** Ferramentas fechadas (*Google Keyword Planner*, *Semrush*, *Ahrefs*) não estavam acessíveis via API/consulta pública nesta execução; a priorização de SEO apoia-se em concorrência observada nas SERPs e vulnerabilidade estrutural a AI Overviews.
2. **`DATA GAP` — Conversão real de *Free-Look* → Checkout Pix (`R$ 49,90 / R$ 79,90 / R$ 199 / R$ 349`) e tempo de produção `V2`:** O aplicativo possui `G-USER = 0` sessões reais pós-pivô; taxas de conversão em retargeting (5%–8%) e fechamento B2B2C são estimativas sujeitas a validação nas Semanas 1–8.
3. **`DATA GAP` — Tamanho exato de grupos fechados de moradores e leilões no Recife:** Grupos privados no Facebook/WhatsApp de bairros (`Boa Viagem`, `Casa Forte`) e canais/grupos de arrematantes Caixa em PE não publicam contagem aberta consolidada de membros ativos.
4. **`DATA GAP` — Contagem exata de profissionais *buy-side* ativos em Recife:** Embora OAB-PE (~47,2k) e CRECI-PE (~17k–18k) tenham totais públicos, não há registro oficial segmentando quantos advogados atuam especificamente em *due diligence* residencial ou quantos corretores operam exclusivamente no lado comprador na capital.
5. **`DATA GAP` — Taxa real de conversão de micro-criadores de arquitetura/direito em Recife via CPA Pix:** Benchmarks de cachê (R$ 300–2.000) e comissão (10% aberto / 25%–30% CPA) foram verificados no mercado brasileiro, mas não há série histórica pública específica de conversão de criadores de Recife em produtos de diligência imobiliária.

---

## Flags

**Red Flags:**
- **Loop infinito gratuito ativo no código atual (`src/estado/Carteira.tsx:23`, `src/dados/descarte.ts:48-50`):** Enquanto permanecer ativo, qualquer tráfego enviado ao produto consome recursos sem jamais atingir o paywall. Bloqueio absoluto antes de divulgar em comunidades ou pagar criadores.
- **Inviabilidade matemática de tráfego pago frio no Brasil para B2C R$ 49,90 (e Google Search frio até para `V2`):** Com Meta Ads cobrando **+12,15% "por dentro" (+13,83% "por fora")** em 2026 e Google Ads imobiliário/jurídico a **R$ 4–25/clique**, comprar cliques frios sem funil de aquecimento ou B2B2C gera prejuízo garantido e consome todo o caixa de R$ 0–3k em dias.
- **Risco jurídico OAB / CRECI / CREA no `V2` e `B2B2C` (`Lei 8.906/94`, `Lei 6.530/78`, `Lei 5.194/66`):** Qualquer copy em anúncio, landing page ou PDF prometendo *"parecer jurídico"*, *"laudo técnico"* ou *"avaliação mercadológica"* expõe o projeto a nulidade contratual e sanções de conselhos de classe.
- **Risco de banimento em comunidades e desclassificação no Campus Mobile:** Fazer *shadow ads* no `r/Recife`/`r/investimentos` gera banimento imediato; mencionar `OLX`, `ZAP`, `VivaReal` ou `QuintoAndar` em pitch/vídeo viola o **item 11.20(iv) do regulamento da 15ª ed. do Campus Mobile**.

**Yellow Flags:**
- **Banda apertada da equipe (10–20h/sem totais) vs. dispersão de canais:** Tentar executar SEO programático, micro-creators, outbound B2B2C, leilões e retargeting ao mesmo tempo sem corte rigoroso paralisa o time. O plano acima força sequência rígida (B2B2C + `G-USER` primeiro; criadores e SEO na Semana 5+; Ads retargeting somente na Semana 9+).
- **Erosão de CTR por AI Overviews (-58% a -61%) e filtro *Scaled Content Abuse*:** Páginas programáticas dos 2.688 edifícios serão ignoradas pelo Google se forem templates rasos; precisam expor tabelas únicas de dados municipais e ferramentas interativas.
- **Dependência de revisão humana (`G-BUILDING`/`G-RAIN`) e cobertura nos 5 bairros:** Atrair usuários para imóveis fora de Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena sem aviso claro prévio derruba confiança logo no *Free-Look*.
- **Armadilha tributária do Fator R (Simples Nacional):** Operar sem planejamento de pró-labore (≥ 28%) eleva o DAS de **6,0% (Anexo III)** para **15,5% (Anexo V)**, comprimindo o teto máximo de CAC em todos os pacotes.

---

## Sources

### Tier 1 (Fontes Primárias, Regulatórias, Oficiais e Código Auditado)
- **Código-fonte e documentos internos auditados no repositório (`/home/v/Documents/vereda/veredas` e `../vereda-negocio`):**
  - `src/estado/Carteira.tsx` (linhas 19–33: `saldo: 3` inicial local `vereda-carteira-v1`), `src/dados/descarte.ts` (linhas 12–50: `descarteGeraCredito` 1:1), `src/dados/mensagem.ts` (linhas 5–27: `mensagemParaCorretor`).
  - `00-intake/brief.md`, `01-discovery/raw/competitor-gtm.md`, `01-discovery/raw/target-audience.md`, `01-discovery/raw/pricing-intel.md`, `01-discovery/raw/demand-signals.md`, `01-discovery/raw/trends.md`.
- **Prefeitura da Cidade do Recife — Portais Oficiais e Dados Abertos:** `dados.recife.pe.gov.br` (Urbanismo/Alvarás), `licenciamentounificado.recife.pe.gov.br` / `licenciamento.recife.pe.gov.br`, `recifeemdia.recife.pe.gov.br` (SEFIN / ITBI 3% padrão, 1% SFH, campanhas temporárias / DSQFL), `conecta.recife.pe.gov.br` (COP / Defesa Civil).
- **Governo Federal / SPU & Caixa Econômica Federal:** `gov.br` (SPU — Terrenos de Marinha, 33 m LPM 1831, 5% laudêmio, 0,6% foro, 2% taxa de ocupação, CAT/RIP), `caixa.gov.br/imoveiscaixa` (Leilão, Venda Online, Venda Direta e regras de corretores credenciados).
- **Entidades de Classe e Regulamento de Edital:** `oabpe.org.br` (CDI OAB-PE e apoio Congresso IBRADIM NE), `ibradim.org.br` (*After Hours* PE), `secovi-pe.com.br` (Terrenos de Marinha ~40% Recife / Congresso Condominial PE), `ademi-pe.com.br`, `institutoclaro.org.br` (Campus Mobile 15ª ed. — prorrogação 02/11/2026, categoria *Tecnologias Urbanas*, cronograma 2026–2027 e Reg. 11.20(iv) conforme ground truth do projeto).

### Tier 2 (Imprensa de Negócios, Estudos Empíricos de SEO/Ads e Portais Setoriais)
- **Impacto AI Overviews & SEO Programático (2025–2026):** *Ahrefs* (`-58%` CTR na 1ª posição; 99% queries informacionais), *Conversion* (`conversion.com.br`), *Semrush*, *Shakers Agência* / *Agência RMkt Digital* (~47%–48% presença AIO), *Flowup Agency* (`-58%` a `-61%` CTR), *Dataslayer*, *Seomatic* (*Scaled Content Abuse*), *Neil Patel Brasil*, *Web Estratégica* (*Query Fan-Out* / GEO).
- **Repasse Tributário Meta Ads Brasil 2026 (+12,15%):** *Spedy*, *Arcwords* (`R$ 100` → `R$ 113,83` pós-pago / `~R$ 87,15` líquido pré-pago; `9,25% PIS/COFINS + 2,9% ISS`), *Degrau Publicidade*, *ReformaTributaria.com*, *Singmídia*, *Nexus Growth* (CBS 0,9% / IBS 0,1% apenas informativo em 2026).
- **Imprensa & Setoriais (Recife / Leilões / Condomínios):** *G1/Globo*, *CBN Recife*, *EBC*, *CNN Brasil* (Acordo 431 prédios-caixão RMR; trechos históricos de alagamento Recife; campanhas ITBI 2%), *Folha de Pernambuco* (Porto Digital / Fesíndico), *Fesíndico* (`fesindico.com.br`), *SíndicoNet* (`sindiconet.com.br`), *IBET* (decisões judiciais LPM Recife), *FloodGIS / IRRD-PE* (`arcgis.com`).
- **Afiliados & Benchmarks de Plataforma:** *Olho no Carro* (`olhonocarro.com.br` — Indique e Ganhe 10% Pix, saque mín. R$ 25), *Pro Leilão* (`proleilao.com.br` — canais Telegram por estado), *Monitor Leilão* (`monitorleilao.com.br`), *LeiloAI*, *Arremate Score*.

### Tier 3 (Benchmarks de Agências BR, Micro-Creators, SERPs Locais e Comunidades)
- **Benchmarks de Google Ads / Meta Ads BR (2025–2026):** *Website Imobiliário*, *Hoogli*, *André Rocha Consultor*, *Trafius* (Meta Imobiliário CPC R$ 1,50–4,50), *Leal Mídia* / *ImoAds* (CPL R$ 5–12 econômico; R$ 15–40+ médio/alto padrão), *Virtu Assessoria* / *Juridigital* (Meta Jurídico CPL R$ 15–40 B2C; OAB Prov. 205/2021), *Consultoria Tráfego Ads* / *Ponti Digital* / *Grupo Kop* (LP B2B/Due Diligence CVR 1,5%–3,5%).
- **Micro-Influenciadores BR (2026):** *Você no Hype* (`vocenohype.com.br`), *Cora* (`cora.com.br`) — faixas nano (R$ 100–500) e micro (R$ 300–800 Stories / R$ 600–2.000 Reels).
- **Comunidades & SERPs Observadas:** `Reddit` (`r/Recife` ~81k membros; `r/investimentos` ~1,2M; `r/ConselhosLegais` ~75k; `r/brasil`; regras anti-spam / Regra dos 10%), `Jornal Digital Recife` (*CodeCrab*, *GDG Recife*, *DSE*, *RFEC*), `cesar.school`, `ufpe.br`, portais de fichas de edifícios observados (`imovelweb`, `loft`, `lopes`, `xmetrosquadrados`, `hgimoveisrecife`, `melorodrigues`, `edvaldomorais`, `apto.vc`) e blogs técnicos (`construtoraceta`, `3pinheirosconsultoria`, `rodrigomontenegro`, `gabrielapereiraadvocacia`, `leidoinquilinatonapratica`).

---

*(Nota metodológica: todos os valores numéricos não verificados publicamente constam explicitamente como `DATA GAP`, e o plano de 90 dias está calibrado exclusivamente para banda de 10–20h/semana totais e orçamento máximo de R$ 3.000.)*