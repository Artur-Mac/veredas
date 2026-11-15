# Inteligência de Precificação, Economia Unitária e Arquitetura de Monetização — VEREDA (2025–2026)

**Phase:** 3 — Market Research (Wave 3, Agent C4)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** High

**Data de referência:** 15/11/2026  
**Escopo:** Auditoria econômica da oferta atual, verificação de taxas de pagamento/lojas/tributos no Brasil (2025–2026), benchmarks de conversão (RevenueCat, Adapty, e-commerce BR) e *stress-test* financeiro e regulatório de 4 arquiteturas de monetização (B2C Passe, Concierge Híbrido Pré-Contrato, B2B2C Profissional e Enterprise/RH/Risco).  
**Regra de integridade:** Todos os valores de mercado, tributos, tarifas de adquirentes e taxas de lojas foram verificados empiricamente nesta rodada; premissas internas de custo variável/suporte e lacunas sem cotação direta estão explicitadas em `## Flags` e `## Data Gaps`.

---

## 1. Diagnóstico da Crise Atual (Wave 1+2 & Auditoria de Código)

### 1.1 O Bug Estrutural do Loop Gratuito Infinito (`Carteira.tsx`, `creditos.tsx` e `descarte.ts`)
A inspeção direta do código-fonte do protótipo revelou que a mecânica atual de créditos (*Give-to-Get*) inviabiliza qualquer conversão paga se mantida em produção:

1. **Cota inicial de 3 créditos (`src/estado/Carteira.tsx:21-33`):** Todo novo aparelho nasce com `saldo: 3` (`cota_inicial`).
2. **Estorno 1:1 infinito por descarte (`src/dados/descarte.ts:48-50` e `153-162`):** `creditarDescarteNaCarteira` devolve `+1` crédito para qualquer análise que consumiu `1` crédito (`dossie_cadastral`), bastando selecionar um dos 4 motivos pré-prontos (`MOTIVOS_DE_DESCARTE`). Embora `restaurarAnalise` (`descarte.ts:136-146`) impeça reabrir a *mesma* análise descartada sem gastar crédito novamente, **o usuário em busca de imóvel descarta 80%–95% das opções que analisa**. Ele pode confirmar um prédio (`-1`), inspecionar/printar o dossiê completo, descartar com 2 toques (`+1`) e voltar indefinidamente a `saldo = 3` — analisando 30+ imóveis sem jamais chegar a `saldo === 0`.
3. **Recarga local e persistência no aparelho (`src/app/creditos.tsx:126-127`, `Carteira.tsx:19`):** A carteira reside em armazenamento local (`vereda-carteira-v1`), trivialmente reiniciável limpando dados do navegador/app, além do botão `"Recarregar 3 créditos de teste"` da versão atual de testes.

### 1.2 Colapso da Margem e do CAC no Modelo Atual (R$ 49,90 via App Store + Ads)
No modelo-base de planejamento (`R$ 49,90` por Passe de Busca com 5 dossiês), o teto de CAC é estruturalmente incompatível com mídia paga no Brasil:

* **Matemática na loja móvel (cenário de crise Wave 1+2):** Com comissão de **15%** (Apple link externo padrão / Google Play padrão) + **~5%** de imposto/gateway hipotético, a receita líquida cai para **R$ 39,92** (ou **R$ 31,92** descontando ~R$ 8,00 de IA/OCR + atendimento, conforme `03-PUBLICO-MONETIZACAO-E-DISTRIBUICAO.md:94`). Em uma razão saudável **LTV:CAC ≥ 3:1**, o **CAC pago máximo sustentável fica entre R$ 10,64 e R$ 13,30**.
* **Colisão com o custo real de tráfego pago imobiliário no Brasil (2025–2026):**
  * **Meta Ads (BR):** CPC médio de **R$ 2,50 a R$ 6,00** + repasse obrigatório de tributos locais desde início de 2026 (**~12,15%** de PIS/COFINS/ISS sobre a fatura da Meta) = **R$ 2,80 a R$ 6,73 por clique efetivo**; CPL imobiliário típico de **R$ 30,00 a R$ 100,00**.
  * **Google Ads Search (BR):** CPC médio de **R$ 5,00 a R$ 12,00**; CPL de **R$ 80,00 a R$ 200,00**.
  * **Simulação de funil realista (Meta Ads a R$ 3,00/clique):** Mesmo assumindo que **35%** dos cliques ativem o app/web (`R$ 8,57` por usuário ativado) e que o VEREDA atinja a mediana global de *Hard Paywall* da RevenueCat (**10,7%**), o **CAC pago resulta em R$ 80,11** (**6× a 7,5× acima do teto sustentável**). Em *Freemium* (`2,1%` de conversão), o CAC explode para **R$ 408,10**.

**Conclusão:** O bilhete de **R$ 49,90** em loja de aplicativo **não fecha conta em tráfego pago**; só sobrevive via **aquisição orgânica/B2B2C**, **Web-First Pix**, ou ancorado por um produto de ticket superior (**Arquiteturas B e C**).

---

## 2. Infraestrutura de Pagamentos, Taxas de Lojas e Realidade Tributária (BR 2025–2026)

### 2.1 Comparativo de Gateways Web: Pix vs. Cartão vs. Boleto
Os dados oficiais de 2025–2026 mostram que a escolha errada do gateway de Pix corrói até **6,66%** de tickets baixos:

| Provedor / Gateway | Taxa Pix (API / Checkout) | Cartão de Crédito (À vista online) | Cartão Parcelado | Boleto | Melhor Faixa de Ticket para o VEREDA |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mercado Pago** | **0,99%** (na hora) | **4,98%** (na hora) / **4,48%** (14d) / **3,98%** (30d) | Base + % por parcela | ~R$ 3,49 | **Melhor até R$ 80,80** no Pix (`R$ 0,30` em R$ 29,90; `R$ 0,49` em R$ 49,90) |
| **Pagar.me (Essencial)** | **0,99% a 1,19%** (instantâneo) | **4,19% a 4,39%** (~2,99% negociado) | ~13,6% (6x) / ~20,9% (12x) | ~R$ 3,49 | Bom para split B2B2C e até R$ 80,80 no Pix |
| **Efí Bank** | **1,19%** (Pix Cob/CobV API) | Sob tabela / conta | Sob tabela | Sob tabela | Alternativa sólida a 1,19% |
| **Stripe Brasil** | **1,19%** (contas elegíveis/convite) | **3,99% + R$ 0,39** (+2% internacional) | Parcelado BR restrito/adicional | N/A foco cartão | Assinaturas B2B recorrentes internacionais/cartão |
| **AbacatePay** | **R$ 0,80 fixo** por Pix pago | — (foco Pix) | — | — | **Melhor acima de R$ 80,81** (`0,40%` em R$ 199; `0,23%` em R$ 349) |
| **Woovi** | **R$ 0,80 a R$ 0,85 fixo** (plano padrão) | — (foco Pix/crediário) | — | — | **Melhor acima de R$ 80,81** + webhooks B2B |
| **Asaas** | **R$ 0,99** (promo 3m) / **R$ 1,99 fixo** padrão (100 Pix estáticos/chave grátis/mês) | **R$ 0,49 + 2,99%** padrão (promo 3m: +1,99%) | **R$ 0,49 + 3,49%** (2–6x) / **+3,99%** (7–12x) | **R$ 0,99** (3m) / **R$ 1,99** padrão | **Cartão à vista mais barato** (`R$ 1,98` em R$ 49,90) e **melhor Pix/Boleto B2B ≥ R$ 201**; **NÃO usar Pix API em ticket ≤ R$ 49,90** (`R$ 1,99 = 6,66%` em R$ 29,90) |

> **Regra matemática de roteamento (Ponto de Cruzamento = R$ 80,81):**  
> Abaixo de **R$ 80,81**, Pix percentual de **0,99%** (Mercado Pago / Pagar.me) custa menos que **R$ 0,80** fixo. Acima de **R$ 80,81** (Arquiteturas B e C), **AbacatePay/Woovi a R$ 0,80 fixo** derrubam o custo de meio de pagamento para **0,23%–0,40%**. Para cartão à vista e boletos B2B ≥ R$ 200, **Asaas** entrega a menor taxa combinada verificada (`R$ 0,49 + 2,99%` no cartão; `R$ 1,99` no boleto).

### 2.2 Taxas das Lojas Móveis no Brasil pós-Acordo Apple×CADE e Google User Choice Billing

| Canal / Plataforma (Brasil 2025–2026) | Taxa da Loja | Custo Adicional de Gateway | Custo Total de Canal | Regra de Elegibilidade / Risco |
| :--- | :--- | :--- | :--- | :--- |
| **Web / PWA Checkout Próprio (Pix-First)** | **0%** | **0,23% a 0,99%** | **0,23% a 0,99%** | Proibido colocar link/botão clicável levando a ele *dentro* do app iOS sem pagar comissão à Apple; permitido via aquisição Web, WhatsApp, e-mail ou menção textual estática não clicável (conforme termos pós-CADE) |
| **Apple iOS — Serviço Humano 1:1 / Fora do App (Guideline 3.1.3(d)/(e))** | **0%** | **0,23% a 0,99%** (Pix) | **0,23% a 0,99%** | Válido **apenas** para Arquitetura B (revisão humana + call 1-a-1 consumida fora do app) **desde que não desbloqueie features digitais dentro do app**; exige *App Review Notes* explícitas contra falso positivo na revisão (3.1.1) |
| **Apple iOS — Small Business Program (SBP ≤ US$ 1M/ano)** | **10%** (IAP Brasil ou Link Externo SBP) | 0% (IAP) / ~0,99% (Link Externo) | **10,0% a 11,0%** | Exige adesão ao SBP (receita ≤ US$ 1M/ano) e aceitação do *Attachment 12* (Brasil/CADE) para link externo |
| **Apple iOS — Padrão Brasil (pós-CADE)** | **15%** (Link Externo) / **21%–25%** (IAP padrão) | ~0,99% (Link Externo) / 0% (IAP) | **15,99% a 25,0%** | Lojas alternativas de terceiros pagam **5% de Core Technology Commission (CTC)** no Brasil |
| **Google Play BR — User Choice Billing (UCB)** | **11%** (15% base primeiros US$ 1M − 4% redução UCB) | ~0,99% (Pix próprio na tela de escolha) | **~11,99%** | Redução de **4 p.p.** na taxa do Google Play no Brasil ao oferecer Pix/sistema próprio lado a lado; acima de US$ 1M sobe sobre base de 30% (−4% = 26%) |

### 2.3 Simples Nacional (Anexo III vs. Anexo V, Fator R) & Reforma Tributária 2026 (LC 214/2025)
* **Enquadramento de SaaS e Consultoria:** Tanto SaaS/processamento de dados (`CNAE 6311-9/00`, `6203-1/00`, `6201-5/01`) quanto consultoria/organização documental (`7020-4/00`, `7490-1/99`) estão sujeitos ao **Fator R** (`Folha + Pró-labore + Encargos 12m ÷ Receita Bruta 12m`):
  * **Fator R ≥ 28% → Anexo III:** Alíquota nominal de **6,00%** na 1ª faixa (RBT12 até R$ 180 mil/ano); **11,20% − R$ 9.360** na 2ª faixa (R$ 180k–360k → efetiva **6,00% a 8,60%**); **13,50% − R$ 17.640** na 3ª faixa (efetiva **8,60% a 11,05%**). Já unifica ISS, PIS, COFINS, IRPJ, CSLL e CPP.
  * **Fator R < 28% → Anexo V:** Alíquota nominal de **15,50%** logo no primeiro real (até R$ 180 mil/ano); **18,00% − R$ 4.500** na 2ª faixa (efetiva **15,50% a 16,75%**).
  * **Risco crítico para operação enxuta:** Sem planejamento contábil de pró-labore (para atingir 28% de Fator R, considerando incidência de 11% de INSS retido + tabela progressiva de IRPF sobre o pró-labore), a carga tributária no DAS salta **+9,5 pontos percentuais** já na 1ª faixa (de **6,0% para 15,5%**).
* **Lucro Presumido (referência de escala ou transição):** `PIS 0,65% + COFINS 3,00% + IRPJ 4,80% + CSLL 2,88% + ISS 2%–5%` = **13,33% a 16,33%** sobre o faturamento bruto (mais adicional de 10% de IRPJ sobre lucro presumido > R$ 20 mil/mês).
* **Reforma Tributária em 2026 (LC 214/2025, Art. 348, III):** Empresas optantes pelo **Simples Nacional estão DISPENSADAS** de recolher as alíquotas-teste de **0,9% (CBS) + 0,1% (IBS)** em 2026. A transição de modelo no Simples/split ocorre a partir de **janeiro de 2027** (ponto de atenção para contratos B2B Enterprise em 2027 caso clientes peçam crédito de IBS/CBS fora do DAS).

### 2.4 A Armadilha Fiscal da Bitributação em Certidões (SC COSIT nº 72/2020)
* **O fato jurídico-tributário:** Conforme a **Solução de Consulta COSIT nº 72/2020** da Receita Federal (e entendimento consolidado de ISS municipal sob LC 116/03 para despachantes), **"reembolso de despesas" com custas cartorárias, emolumentos e taxas públicas cobrado dentro do preço do prestador INTEGRA A RECEITA BRUTA** do Simples Nacional e do ISS — sendo irrelevante emitir "nota de débito" separada se a empresa contrata o cartório e repassa ao cliente.
* **O impacto real em Pernambuco (TJPE Ato nº 1556/2025 + CNJ Provimento 127/2022):**
  * Na Tabela E vigente em 2026 em PE, emolumentos base de certidão variam de **R$ 13,54** (1ª folha até 5 anos) a **R$ 48,84/folha** (acima de 20 anos, padrão usado para vintenária/inteiro teor no Provimento 127, Art. 3º, I), acrescidos de **TSNR** (mín. R$ 6,59, até 100% dos emolumentos; padrão ~20%), fundos estaduais (**FERC/FERM/FUNSEG**), **ISS municipal** (**5%** no Recife) e taxa SAEC/ONR.
  * Resultado prático observado: **~R$ 17,58+** para visualização de matrícula (1/3 dos emolumentos base, Prov. 127 Art. 3º III) e **R$ 58,61 a R$ 96,00+** por certidão digital de inteiro teor (podendo atingir **R$ 150–280+** quando a matrícula tem páginas excedentes ou são exigidas certidões separadas de Inteiro Teor + Ônus Reais + Ações Reipersecutórias).
  * **Efeito na margem:** Se o VEREDA cobrar **R$ 199,00** e embutir **2 certidões PE (R$ 150,00)** no seu CNPJ sob Anexo V (`15,5%`), pagará **R$ 30,85** de DAS + gateway + revisão humana (**R$ 35**) → **margem de contribuição NEGATIVA de −R$ 29,62 (−14,9%)** antes de qualquer custo de aquisição!

---

## 3. Benchmarks de Conversão, Paywalls e Concorrência (2025–2026)

### 3.1 RevenueCat & Adapty: Hard Paywall vs. Freemium vs. Free-Look Preview
* **RevenueCat (*State of Subscription Apps 2025/2026*, >115.000 apps):**
  * **Hard Paywall** (mediana Day-35 download-to-paid): **10,7%** (era 12,1% em 2025).
  * **Freemium** (mediana Day-35 download-to-paid): **2,1%** (**5× menor** que Hard Paywall; Hard Paywall gera ~8× mais receita por instalação até D60).
  * **Efeito Dia 0:** A maioria absoluta das conversões acontece no **Dia 0**; se o valor não ficar óbvio na primeira sessão, a recuperação posterior é marginal.
  * **Trade-off de reembolso:** Paywalls agressivos antes de entregar valor ("blurred/hard gate cego") elevam a conversão inicial, mas sofrem taxas de reembolso **~70% maiores** e desinstalação imediata quando há substitutos gratuitos.
* **Adapty (*State of In-App Subscriptions / Paywalls 2025/2026*):**
  * Trials curtos (`≤ 4 dias`) convertem **~25,5%** *trial-to-paid* vs. **~42,5%** em trials `≥ 17 dias`; porém, apps com custo variável de IA têm migrado de freemium aberto para **cotas rígidas de uso antes do bloqueio** (*usage-gated previews*) para evitar subsídio negativo de tokens/OCR.
  * **Por que assinatura B2C falha em busca imobiliária:** Compras únicas (*one-time*) são apenas 7%–10% dos apps de consumo em geral porque apps de rotina (fitness, música) têm uso contínuo. Já busca de imóvel dura **2 a 8 semanas** e se encerra ao assinar o contrato — motivo pelo qual o benchmark análogo mais próximo (*Openigloo* em NY) vende **passes temporais** (`US$ 14,99–17,99` por 24h; `US$ 24,99–34,99` por 3 meses) e o enxame interno rejeitou assinatura mensal B2C (`0/9` pagantes).

### 3.2 Conversão de Checkout no Brasil (Pix-First vs. Cartão vs. Boleto)
* **Participação e aprovação (2025–2026):** Pix já responde por **42%–49%** dos pedidos no e-commerce brasileiro (>55% das transações de varejo no BC em 2026) contra **41%–47%** do cartão e **<1,5%** do boleto.
* **Conversão dentro do checkout:**
  * **Pix com QR Code dinâmico / Copia-e-Cola integrado na tela:** **até 90%** de conclusão.
  * **Cartão de Crédito:** **70%–75%** de conversão, severamente penalizado por falsas recusas antifraude — **57% das negativas de cartão ocorrem em compras abaixo de R$ 300**, e **70% dos consumidores recusados migram imediatamente para o Pix** se a opção estiver visível.
  * **Boleto:** **30%–50%** de conversão (alto abandono pós-emissão; inadequado para compra B2C por impulso/urgência de visita).

### 3.3 Mapa de Âncoras de Preço (Brasil & América do Norte)
| Categoria | Referência Real Verificada | Preço / Modelo | O que ensina ao VEREDA |
| :--- | :--- | :--- | :--- |
| **Substitutos Gratuitos** | Morei Aqui, Mapa Sossego, Google Maps, ChatGPT/Gemini PDF | **R$ 0** (ou R$ 0–39,99/mês IA genérica) | O usuário não paga por *opinião genérica* ou *chat de PDF solto*; paga por **cruzamento local validado + comparação objetiva + roteiro pronto na visita** |
| **Checagem Episódica BR** | Serasa Extrato Veicular / Olho no Carro | **R$ 29,90** (básico) / **R$ 64,90** (completo 25+ itens) | Prova aceitação de **R$ 30–65** por dossiê único pré-compra em ativo de alto risco, mas o custo de mídia paga exige ticket ≥ R$ 65–80 ou canal orgânico |
| **Passe Imobiliário (EUA)** | Openigloo (NY) | **US$ 14,99–17,99** (24h) / **US$ 24,99–34,99** (3 meses) | Passe por janela de tempo acompanha a comparação de vários prédios melhor que cobrança por relatório unitário |
| **Condo Diligence (América do Norte)** | Eli Report *(pivot Out/2024)* | Caiu de **US$ 39,99** avulso → **Freemium** (`$0` básico / `$20` Essential / `$40` Pro / `$60` Enterprise) | Consumidor recusa pagar US$ 40 às cegas; B2B (corretores/gestores) sustenta os tiers pagos de OCR + compartilhamento |
| **Condo Humano (Canadá)** | CondoScan / Condo Check | **CAD $349–500** (~R$ 1.400–2.000) com call 24h | Há demanda clara por revisão **IA + Humano em 24h** a 10% do custo jurídico tradicional |
| **Cartório & Despachante BR** | RI Digital PE / Certidão na Mão | **~R$ 17,58** (view PE) / **R$ 58,61–96+** (certidão PE) / **R$ 169,90+** (Certidão na Mão SP) | Vender certidão pura paga margem baixa e atrai bitributação; valor está na **interpretação e síntese**, não em revender PDF de cartório |
| **Vistoria & Due Diligence BR** | Vistoria Locação / Cautelar Engenharia / Advogado Due Diligence | **R$ 150–350** (locação) / **R$ 1.200–4.000** (cautelar) / **R$ 1.500–7.000** ou **0,5%–2%** (advogado) | Cria uma **zona vazia gigantesca entre R$ 170 e R$ 1.200** para a Arquitetura B |
| **SaaS Profissional BR** | Jusbrasil Pro / Loft (Vista) CRM / Kenlo Prime | **R$ 58,90–200+/mês** (Jusbrasil) / **R$ 129,90/mês** (Loft 1 user) / **R$ 247/mês** (Kenlo 2 users) | Teto psicológico de assinatura mensal para autônomo/pequeno escritório no Brasil é **R$ 149–299/mês**; abaixo de 5 usos/mês, preferem **pacote pré-pago** |

---

## 4. Stress-Test das 4 Arquiteturas de Pacote e Preço para o VEREDA

### 4.1 Arquitetura A: Passe B2C Low-Ticket Web/App (`R$ 29,90` vs. `R$ 49,90` vs. `R$ 79,90`)

**Correção obrigatória pré-monetização (Matando o Loop Infinito):**
1. Remover `saldo: 3` irrestrito (`Carteira.tsx:23`) e eliminar `+1` crédito automático por motivo de descarte (`descarte.ts:48-50, 153-162`). O motivo de descarte passa a ser dado opcional/colaborativo (ou bônus único com teto vitalício máximo de `+1` após validação, nunca renovável 1:1).
2. Transferir a carteira de saldo de `vereda-carteira-v1` (armazenamento local manipulável) para ledger no servidor vinculado a login leve (OTP WhatsApp/e-mail) no momento do checkout.

**O que DEVE ser Gratuito (*Free-Look* sem custo variável alto) vs. Trancado (*Hard Gate*):**

| Camada do Produto | Gratuito (*Free-Look*) | Trancado no Passe Pago | Racional de Conversão e Custo |
| :--- | :--- | :--- | :--- |
| **Entrada & Caderno** | Colar anúncio / buscar endereço + Caderno básico (até 3 imóveis salvos) + 1 exemplo demonstrativo completo | Ilimitado no caderno durante a vigência do passe | Mostra utilidade imediata (Dia 0) sem gastar OCR/API |
| **Diagnóstico de Choque (Preview)** | **Contador de Achados e Lacunas ("3 sinais encontrados"):** mostra *quantos* alvarás a 150 m existem, se há divergência de IPTU/condomínio e se a via tem ocorrência histórica de alagamento — **com detalhes, números de processo/alvará e valores exatos borrados/bloqueados** | Desbloqueio completo dos dados auditados, fontes, datas, alvarás individuais e histórico de ocorrências de **até 5 ou 8 imóveis** | Ativa aversão à perda (*"já sei que há 2 obras perto e R$ 400 de divergência, preciso ver quais são"*) com custo de geração próximo de zero (`< R$ 0,05`, índice D036 estático) |
| **Comparação & Decisão** | — | **Comparador Lado a Lado (`comparar.tsx`) + Limiar de Inversão (`decisao.ts` / `resposta.ts`) + Roteiro WhatsApp 3 linhas** | É aqui que a dor real acontece (pesquisa `N=83`: 91,5% usam para negociar ou desistir) |
| **Visita & Documentos** | Bússola simples ou checklist estático básico | **Simulação Solar Horária 3D (`sol.tsx`) + Modo Visita completo (dB + conectividade) + OCR assistido de atas/boletos (teto rígido de páginas)** | Garante teto de custo variável de OCR (`≤ R$ 1,50–2,50` por passe) e monetiza quem vai visitar de fato |

**Stress-Test de Preço na Arquitetura A:**
* **A1 — R$ 29,90:** **Reprovado como oferta principal.** Apesar de alinhado à WTP declarada da pesquisa (`R$ 27,40–28,00`), entrega margem absoluta baixa demais (`R$ 24,91` na Web Pix Anexo III; CAC 3:1 máximo **R$ 8,30**). **Uso recomendado:** apenas como *downsell* de saída ou **Passe Relâmpago de 1 Imóvel (48h)** após abandono de checkout, sem OCR de PDFs longos.
* **A2 — R$ 49,90 (Passe Aluguel / Busca 30 dias — até 5 imóveis, sem OCR pesado):** Contribuição de **R$ 41,21** na Web Pix Anexo III (CAC teto 3:1 **R$ 13,74**). Viável **somente** para aquisição orgânica (SEO por edifício/bairro do Recife, viralização da assinatura `"Mensagem preparada com o VEREDA"`, parcerias universitárias/comunidades) + Web-First Pix. Inviável em Meta/Google Ads puros.
* **A3 — R$ 79,90 (Passe Decisão Completa 60 dias — até 8 imóveis + Modo Visita + OCR até 50 páginas de atas/convenção):** Contribuição de **R$ 65,92** na Web Pix Anexo III (CAC teto 3:1 **R$ 21,97**; e ainda **R$ 58,33** mesmo no Anexo V!). Representa apenas **~1,5% de um mês de aluguel médio** de 70 m² no Recife (`FipeZAP R$ 64,39/m²`) e aproxima-se do *Olho no Carro Completo* (`R$ 64,90`). **É o único preço B2C puro que tolera testes controlados de retargeting em Meta Ads.**

---

### 4.2 Arquitetura B: Dossiê Híbrido "Anti-Cilada" / Concierge Pré-Contrato (`R$ 199 – R$ 399`)

Posiciona o VEREDA no **oceano azul entre o Certidão na Mão (`R$ 169,90` sem análise) e a Vistoria/Advogado (`R$ 1.200 – R$ 7.000`)**, resolvendo a crise de CAC (permite CAC sustentável de **R$ 46 a R$ 84** a 3:1, viabilizando tráfego pago focado em intenção de fechamento!).

**Como precificar SEM cair na margem negativa do RI Digital PE e da COSIT nº 72/2020:**
1. **Regra de Ouro (Desacoplar Cartório do Preço-Base):** O preço de **R$ 199** ou **R$ 349** **NÃO absorve taxas variáveis do RI Digital**.
   * **Tier B1 (`R$ 199` — Revisão Documental & Risco Urbano 24h):** O comprador envia os documentos já fornecidos pelo vendedor/corretor (cópia da matrícula, convenção, 3 últimas atas, guia de IPTU, último boleto de condomínio — obrigação legal do locador/vendedor na Lei 8.245/91 art. 22, IX e negociação de venda). O motor OCR/RAG do VEREDA processa (até 80 páginas) + um analista treinado valida inconsistências em **≤ 30 min** (`custo humano ~R$ 35`). O VEREDA ainda puxa automaticamente bases gratuitas/API de centavos (Sefin/Alvarás/Defesa Civil + CND Federal/PGFN + CNDT Trabalhista + CNPJ da SPE/incorporadora via BigDataCorp/Infosimples a **< R$ 2,00/caso**). Se faltar matrícula atualizada, o fluxo gera **guia instruída para o próprio cliente pagar diretamente no `ridigital.org.br` no seu CPF** (`0%` de imposto/taxa sobre o VEREDA).
   * **Tier B2 (`R$ 349` — Concierge Anti-Cilada Completo + Call 20 min):** Inclui até 120 páginas de atas/convenção + cruzamento ampliado de passivos públicos da SPE/vendedor PJ + síntese executiva + **chamada de 20 minutos** (`custo humano total ~50 min = R$ 55`) para preparar a pauta objetiva de negociação com corretor/advogado.
   * **Add-on Opcional "Emissão Assistida de Matrícula" (se o cliente insistir em terceirizar o cartório):** Precificado com fórmula de repasse bruto que compensa COSIT 72/2020 + gateway + operação: `Preço_AddOn = (Emolumentos_RI_Digital / (1 - Imposto - Gateway)) + R$ 29,00`. Ex.: uma certidão de R$ 96,00 no RI Digital deve ser cobrada à parte por **R$ 135,00–149,00** (nunca dentro dos R$ 199).
2. **Benefício colateral na Apple App Store (Guideline 3.1.3(d)):** Por envolver atendimento humano 1-para-1 consumido fora do app (revisão + call de 20 min entregues por WhatsApp/e-mail/PDF externo, sem desbloquear UI do app), a Arquitetura B enquadra-se na isenção **3.1.3(d)/(e)** se vendida via Web/PWA ou fluxo externo de serviço pessoal (**0% de comissão Apple**).

**Blindagem Regulatória Obrigatória (OAB / CRECI / CREA):**
* **Termos PROIBIDOS na oferta, checkout e PDF:** *"Parecer jurídico"*, *"Análise jurídica de contrato"*, *"Due diligence jurídica"*, *"Laudo técnico de vistoria/avaliação"* (privativo CREA/CAU + NBR 14653), *"Avaliação mercadológica/PTAM"* (privativo CRECI) ou *"Recomendação/intermediação de compra"* (Lei 6.530/78).
* **Cláusula Padrão Obrigatória (Termo de Aceite + Cabeçalho e Rodapé do Dossiê B1/B2):**
  > *"Este documento é um **Relatório Informativo de Organização Documental e Cruzamento de Bases Públicas**. O VEREDA não presta serviços privativos de advocacia — não realiza consultoria, assessoria ou parecer jurídico (Lei nº 8.906/1994, art. 1º) —, não executa vistoria ou avaliação de engenharia (Lei nº 5.194/1966 e ABNT NBR 14653, privativos de engenheiro/arquiteto com ART/RRT no CREA/CAU) e não realiza corretagem ou avaliação mercadológica (Lei nº 6.530/1978, privativa de corretor inscrito no CRECI). Apontamentos de gravames, passivos ou anomalias construtivas devem ser submetidos a advogado imobiliário ou engenheiro habilitado antes da assinatura de qualquer contrato."*

---

### 4.3 Arquitetura C: B2B2C Assessor / Advogado / Vistoriador Pro

O enxame (`VEREDA_SWARM_INSIGHTS.md`) e o caso real *Zillow × First Street* (nov/2025) provam que **corretores tradicionais e incorporadoras têm conflito de interesse estrutural** contra dados negativos e exigirão ocultar defeitos se forem o pagador principal. O B2B2C deve mirar exclusivamente **profissionais remunerados para proteger o cliente ou diagnosticar o imóvel**:
1. **Advogados Imobiliários & Despachantes de Due Diligence** (cobram R$ 1.500–7.000 por diligência; pagam R$ 58,90–200+/mês no Jusbrasil; economizam 2h de pesquisa urbana/alvarás/IPTU/leitura de atas).
2. **Assessores Buy-Side / Personal Shoppers Imobiliários** (modelo MySide, inscritos no CRECI representando o comprador; usam o dossiê para qualificar clientes sem inventar nota).
3. **Vistoriadores Independentes / Engenheiros Peritos** (cobram R$ 150–350 em locação ou R$ 1.200–4.000 em cautelar; anexam o contexto urbano de entorno 150 m/alagamento/sol como diferencial no laudo).

**Stress-Test: Mensalidade (`R$ 199–349/mês`) vs. Pacote de Dossiês (`R$ 149–299 / 10 relatórios`) vs. White-label:**
* **Por que assinatura pura (`R$ 249–349/mês`) sofre churn em autônomos:** Advogados e vistoriadores autônomos frequentemente fecham **3 a 6 imóveis por mês**. Se pagarem R$ 299/mês em meses fracos, o custo efetivo salta para R$ 75–100/relatório e cancelam no mês 2.
* **Por que o Pacote Pré-Pago de Dossiês (`R$ 199 por 10 dossiês`, validade 6 meses = `R$ 19,90/dossiê`) vence na entrada:** Zero fricção de recorrência fixa, margens de **87,6%** (`R$ 174,27` de contribuição por pacote), e o profissional embute facilmente R$ 20 ou vende como adicional de R$ 99 ao cliente final.
* **Pacote + Plano Pro Híbrido Recomendado:**
  * **C1 — Pacote Profissional:** **R$ 199 por 10 Dossiês** (validade 180 dias; **R$ 19,90/dossiê**; inclui OCR de até 60 págs/caso).
  * **C2 — Assinatura Escritório / Assessoria:** **R$ 249/mês** (inclui **20 dossiês/mês** = `R$ 12,45/dossiê` + link de captação para clientes do escritório + exportação CSV/JSON + excedente a R$ 14,90).
* **Regra contra *White-Label* Opaco (Usar *Co-Branded Verificável*):** **Nunca** permitir que o profissional edite fatos públicos ou remova a marca/origem do VEREDA para omitir riscos. Oferecer PDF **Co-Branded** (*"Preparado para [Nome do Escritório/Vistoriador] · Auditoria de dados públicos VEREDA"* com **QR Code / Hash de integridade** no rodapé), preservando independência legal e gerando aquisição orgânica B2B2C a partir dos clientes finais que recebem o PDF.

---

### 4.4 Arquitetura D: B2B2C Enterprise / RH Relocation / Crédito & Seguros Risk Data

* **RH & Consultorias de *Relocation* Corporativo (ex.: empresas do Porto Digital, executivos transferidos):**
  * Um pacote tradicional de *relocation* no Brasil envolve flat temporário de 30–90 dias, *home hunting* e assessoria logística por milhares de reais por colaborador. Um **Lote Corporativo de Moradia Segura** a **R$ 1.490 por 10 colaboradores** (`R$ 149/colaborador`, margem de contribuição **~90%** = `R$ 1.338,61`) entrega Passe Completo + checklist de conectividade *home-office* + alertas de alagamento/ruído/obras e economiza dias de improdutividade.
  * **Limitação imediata:** Exige cobertura mínima da Região Metropolitana inteira (não apenas 5 bairros piloto) e ciclo comercial B2B de 3 a 6 meses. Viável a partir da expansão de cobertura (Fase 2).
* **Bancos, Garantidoras (Loft/CredPago, Porto, CredAluga) & Seguradoras (Risk Data API):**
  * **Realidade de preços em DataTech BR:** BigDataCorp cobra **R$ 0,024 a R$ 0,060/consulta básica** e Infosimples **R$ 0,04 a R$ 0,10+**; DataZAP e Docket operam em contratos Enterprise anuais com cobertura nacional.
  * **Bloqueios estruturais no curto prazo:** (1) Cobertura restrita a 1 cidade impede venda nacional para seguradoras/bancos; (2) Ausência de série atuarial provando redução de inadimplência/sinistro pelo dossiê; (3) **Risco viral da ODbL 1.0 (§4.6(b)):** fundir bases da Prefeitura do Recife (ODbL) em API proprietária comercial sem **Muralha Física de Banco de Dados** pode obrigar abertura pública da base derivada.
  * **Veredito Arquitetura D:** Tratar **Risk Data API** como **Horizonte 2/3 (12–24 meses)** após consolidação da Muralha ODbL e cobertura multi-cidade. No curto prazo, testar apenas **lotes pré-pagos para RH/Relocation local** e **editais B2G/CPSI (LC 182/2021, até R$ 1,6 milhão)**.

---

## 5. Ancoragem de Preço, Armadilha do CDC Art. 49 e Engenharia de Reembolso

### 5.1 Ancoragem Psicológica e Escada *Good-Better-Best*
1. **Âncora na Perda Mensal Recorrente (e nunca em "créditos de software"):** O usuário rejeita pagar R$ 49,90 por "5 consultas", mas paga com facilidade quando comparado ao custo real da omissão validado na pesquisa `N=83` (**62,7%** sofreram desvios de **+R$ 300 a +R$ 1.500/mês** = `R$ 3.600 a R$ 18.000/ano`). O Passe Completo de **R$ 79,90** equivale a **1,8% de 1 mês de aluguel** ou **5 dias de um condomínio oculto de R$ 500**.
2. **Escada de 3 Degraus na Web (*Decoy Effect*):**
   * **Gratuito (*Free-Look*):** Diagnóstico com contador de riscos/lacunas (detalhes bloqueados) + Caderno (3 imóveis).
   * **Passe Busca (`R$ 49,90` — 30 dias, 5 imóveis):** Comparador + Respostas decisivas + Roteiro WhatsApp (sem OCR/call).
   * **Passe Decisão Completo (`R$ 79,90` — 60 dias, 8 imóveis + Modo Visita + OCR 50 págs) [Recomendado]:** Apenas +R$ 30 por dobro de janela, 60% mais imóveis e leitura de atas/matrícula.
   * **Dossiê Anti-Cilada Híbrido (`R$ 199` revisão 24h / `R$ 349` + call 20 min):** Ancorado explicitamente contra **Advogado (`R$ 1.500–7.000`)** e **Vistoria Cautelar (`R$ 1.200–4.000`)**.

### 5.2 Mitigação do Abuso do Art. 49 do CDC (7 Dias) e Chargeback
O **Art. 49 do CDC** garante desistência imotivada em **7 dias** para compras online com devolução imediata e integral — criando risco crítico de **"consumir e estornar"** (comprar o passe de R$ 79,90, gerar 8 dossiês no Dia 1, fechar o imóvel e pedir reembolso no Dia 5). Como o direito do art. 49 não pode ser simplesmente "revogado" por cláusula abusiva em contrato de adesão, a defesa combina **desenho de produto, meio de pagamento e boa-fé objetiva (Art. 187 CC)**:

1. **Reduzir motivo legítimo de arrependimento antes do pagamento (*Free-Look*):** Mostrar *quais camadas estão cobertas no bairro/prédio* e o contador de achados **antes** do checkout. Se o usuário sabe exatamente o que a base tem antes de pagar, cai drasticamente a alegação de frustração informacional.
2. **Termo de Execução Imediata Consentida (não pré-marcado no checkout):** Jurisprudência estadual brasileira vem afastando abuso de direito por **exaustão da utilidade do bem/serviço digital** quando a entrega ocorre integralmente com ciência prévia. Exigir aceite ativo: *"Autorizo o início imediato da geração e leitura dos dossiês digitais solicitados para estes imóveis, ciente de que a entrega integral exaure o serviço."* (Especialmente defensável na **Arquitetura B**, que configura serviço personalizado sob encomenda iniciado mediante aceite).
3. **Política de Reembolso em Camadas + Trava Antifraude:**
   * **Reembolso automático imediato (sem atrito):** Se **0 dossiês pagos** foram desbloqueados, ou se houve **falha técnica / base indisponível** prometida na cobertura.
   * **Análise assistida após consumo:** Se ≥ 2 dossiês já foram abertos/exportados, o pedido passa por triagem de suporte (evitando botão de estorno automático sem verificação e bloqueando CPF/conta de *serial refunders* em compras futuras).
4. **Pix-First contra *Friendly Fraud*:** Pagamentos via **Pix não sofrem chargeback unilateral de bandeira de cartão** (apenas MED do BC para fraude bancária comprovada), eliminando o risco de o cliente usar os dossiês, contestar a fatura no banco e ainda gerar tarifa de chargeback contra o VEREDA.

---

## 6. Tabela Completa de Cascata de Margem (*Margin Waterfall* — Todos os Tiers)

**Premissas explícitas do modelo:**
* **Gateway Web Pix otimizado:** Mercado Pago (`0,99%`) para tickets `< R$ 80,81`; AbacatePay (`R$ 0,80` fixo) para tickets `R$ 80,81–499`; Asaas (`R$ 1,99` fixo Pix/Boleto) para B2B `R$ 1.490`. Para Cartão Web à vista: Asaas (`R$ 0,49 + 2,99%`).
* **Lojas móveis:** Apple Small Business Program (`10%`), Apple Link Externo Padrão BR pós-CADE (`15% + 0,99% Pix`), Apple IAP Padrão BR (`25%`), Google Play User Choice Billing BR (`11% + 0,99% Pix = 11,99%`).
* **Tributos (Simples Nacional Faixa 1, LC 214/2025 dispensa CBS/IBS-teste em 2026):** **Anexo III (`6,0%`)** com Fator R ≥ 28% vs. **Anexo V (`15,5%`)** com Fator R < 28%.
* **Custos variáveis operacionais estimados (IA/OCR + APIs + Suporte + Reserva Reembolso 3% B2C / 2% B1-B2 / 1% B2B):** `A1 = R$ 2,90`; `A2 = R$ 5,20`; `A3 = R$ 8,40`; `B1 = R$ 46,98` (inclui `R$ 35` analista 30 min); `B2 = R$ 74,98` (inclui `R$ 55` analista+call 50 min); `C1 = R$ 11,99`; `C2 = R$ 20,49` (média 15 dossiês/mês); `D1 = R$ 60,00`.
* **Meta de CAC máximo sustentável:** Regra conservadora **LTV:CAC = 3:1** (`Contribuição ÷ 3`, assumindo 1 compra média no B2C episódico e 1º ciclo em B2B — no B2B recorrente C2, o LTV de 6 meses multiplica o teto de CAC).

| Tier / Oferta | Canal & Tributação | Preço Bruto (R$) | Taxa Canal + Gateway (R$) | Imposto Simples (R$) | Custo Var. + Humano + Reemb. (R$) | Contribuição Líquida (R$) | Margem (%) | Teto CAC Pago 3:1 (R$) | Veredito Econômico |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **A1 — Downsell 1 Imóvel (48h)** | Web Pix (MP 0,99%) · Anexo III (6%) | 29,90 | 0,30 | 1,79 | 2,90 | **24,91** | 83,3% | **8,30** | Só orgânico / *downsell* |
| **A1 — Downsell 1 Imóvel (48h)** | Web Pix (Asaas R$ 1,99) · Anexo III (6%) | 29,90 | 1,99 | 1,79 | 2,90 | **23,22** | 77,7% | **7,74** | **Não usar Asaas Pix** em R$ 29,90 |
| **A1 — Downsell 1 Imóvel (48h)** | Web Pix (MP 0,99%) · Anexo V (15,5%) | 29,90 | 0,30 | 4,63 | 2,90 | **22,07** | 73,8% | **7,36** | Inviável em Ads |
| **A1 — Downsell 1 Imóvel (48h)** | iOS SBP (10%) · Anexo III (6%) | 29,90 | 2,99 | 1,79 | 2,90 | **22,22** | 74,3% | **7,41** | Inviável em Ads |
| **A1 — Downsell 1 Imóvel (48h)** | iOS ExtLink Padrão (15%+0,99%) · Anexo V | 29,90 | 4,78 | 4,63 | 2,90 | **17,59** | 58,8% | **5,86** | **Colapso de margem** |
| **A2 — Passe Busca 30d (5 imóveis)** | Web Pix (MP 0,99%) · Anexo III (6%) | 49,90 | 0,49 | 2,99 | 5,20 | **41,21** | 82,6% | **13,74** | Viável via SEO / WhatsApp |
| **A2 — Passe Busca 30d (5 imóveis)** | Web Cartão (Asaas 2,99%+0,49) · An. III | 49,90 | 1,98 | 2,99 | 5,20 | **39,73** | 79,6% | **13,24** | Risco maior de Art. 49/chargeback |
| **A2 — Passe Busca 30d (5 imóveis)** | Web Pix (MP 0,99%) · Anexo V (15,5%) | 49,90 | 0,49 | 7,73 | 5,20 | **36,47** | 73,1% | **12,16** | Fator R < 28% custa R$ 4,74/venda |
| **A2 — Passe Busca 30d (5 imóveis)** | Google UCB BR (11%+0,99%) · An. III (6%) | 49,90 | 5,98 | 2,99 | 5,20 | **35,73** | 71,6% | **11,91** | Só orgânico Android |
| **A2 — Passe Busca 30d (5 imóveis)** | iOS SBP (10%) · Anexo III (6%) | 49,90 | 4,99 | 2,99 | 5,20 | **36,72** | 73,6% | **12,24** | Só orgânico iOS |
| **A2 — Passe Busca 30d (5 imóveis)** | iOS ExtLink Padrão (15%+0,99%) · An. III | 49,90 | 7,98 | 2,99 | 5,20 | **33,73** | 67,6% | **11,24** | Link externo destrói 16% bruto |
| **A2 — Passe Busca 30d (5 imóveis)** | iOS IAP Padrão BR (25%) · Anexo V (15,5%) | 49,90 | 12,47 | 7,73 | 5,20 | **24,49** | 49,1% | **8,16** | **Pior cenário estrutural** |
| **A3 — Passe Completo 60d (8 im. + OCR)** | Web Pix (MP 0,99%) · Anexo III (6%) | 79,90 | 0,79 | 4,79 | 8,40 | **65,92** | 82,5% | **21,97** | **Melhor âncora B2C Web** |
| **A3 — Passe Completo 60d (8 im. + OCR)** | Web Pix (MP 0,99%) · Anexo V (15,5%) | 79,90 | 0,79 | 12,38 | 8,40 | **58,33** | 73,0% | **19,44** | Ainda aguenta retargeting leve |
| **A3 — Passe Completo 60d (8 im. + OCR)** | iOS SBP (10%) · Anexo III (6%) | 79,90 | 7,99 | 4,79 | 8,40 | **58,72** | 73,5% | **19,57** | Aceitável no app via SBP |
| **A3 — Passe Completo 60d (8 im. + OCR)** | iOS ExtLink Padrão (15%+0,99%) · An. III | 79,90 | 12,78 | 4,79 | 8,40 | **53,93** | 67,5% | **17,98** | Melhor evitar link clicável iOS |
| **B1 — Híbrido 24h (sem cartório incluso)** | Web Pix (Abacate R$ 0,80) · Anexo III | 199,00 | 0,80 | 11,94 | 46,98 | **139,28** | 70,0% | **46,43** | **Viabiliza Meta Ads B2C!** |
| **B1 — Híbrido 24h (sem cartório incluso)** | Web Pix (Abacate R$ 0,80) · Anexo V | 199,00 | 0,80 | 30,84 | 46,98 | **120,38** | 60,5% | **40,12** | Ainda viável, mas Anexo V dói |
| **B1-ARMADILHA (embutindo 1× certidão PE R$ 75)** | Web Pix (Abacate R$ 0,80) · Anexo III | 199,00 | 0,80 | 11,94 | 121,98 | **64,28** | 32,3% | **21,43** | **Armadilha de margem** (COSIT 72) |
| **B1-COLAPSO (embutindo 2× certidões PE R$ 150)** | Web Pix (Abacate R$ 0,80) · Anexo V | 199,00 | 0,80 | 30,84 | 196,98 | **−29,62** | **−14,9%** | **−9,88** | **PREJUÍZO POR VENDA** |
| **B2 — Concierge Anti-Cilada (+ Call 20m)** | Web Pix (Abacate R$ 0,80) · Anexo III | 349,00 | 0,80 | 20,94 | 74,98 | **252,28** | 72,3% | **84,09** | **Motor de caixa B2C em Ads** |
| **B2 — Concierge Anti-Cilada (+ Call 20m)** | Web Cartão (Asaas 2,99%+0,49) · An. III | 349,00 | 10,93 | 20,94 | 74,98 | **242,15** | 69,4% | **80,72** | Cartão aceitável em ticket alto |
| **B2 — Concierge Anti-Cilada (+ Call 20m)** | Web Pix (Abacate R$ 0,80) · Anexo V | 349,00 | 0,80 | 54,09 | 74,98 | **219,12** | 62,8% | **73,04** | Suporta tráfego mesmo no An. V |
| **B2 — Concierge Anti-Cilada (+ Call 20m)** | iOS Isento 3.1.3(d) (0% Apple, Pix) · An. III | 349,00 | 0,80 | 20,94 | 74,98 | **252,28** | 72,3% | **84,09** | Exige não desbloquear UI no app |
| **B2 — Concierge Anti-Cilada (+ Call 20m)** | iOS IAP SBP (10% se não isento) · An. III | 349,00 | 34,90 | 20,94 | 74,98 | **218,18** | 62,5% | **72,73** | Evitar IAP: consome R$ 34,10 extras |
| **C1 — B2B2C Pack 10 Dossiês (Co-branded)** | Web Pix (Abacate R$ 0,80) · Anexo III | 199,00 | 0,80 | 11,94 | 11,99 | **174,27** | 87,6% | **58,09** | **Melhor entrada B2B2C (0 atrito)** |
| **C2 — B2B2C Pro Mensal (20 dossiês/mês)** | Web Pix (Abacate R$ 0,80) · Anexo III | 249,00 | 0,80 | 14,94 | 20,49 | **212,77** | 85,4% | **70,92** *(1 mês)* / **~425** *(6m LTV)* | **Alta retenção p/ escritórios ativos** |
| **C2 — B2B2C Pro Mensal (20 dossiês/mês)** | Web Cartão (Asaas 2,99%+0,49) · An. V | 249,00 | 7,94 | 38,59 | 20,49 | **181,98** | 73,1% | **60,66** *(1 mês)* | Rentável até no pior cenário |
| **D1 — B2B2C Lote RH Relocation (10 colab.)** | Boleto/Pix Asaas (R$ 1,99) · Anexo III | 1.490,00 | 1,99 | 89,40 | 60,00 | **1.338,61** | 89,8% | **446,20** | **Escala B2B pós-expansão RMR** |
| **D1 — B2B2C Lote RH Relocation (10 colab.)** | Boleto/Pix Asaas (R$ 1,99) · Anexo V | 1.490,00 | 1,99 | 230,95 | 60,00 | **1.197,06** | 80,3% | **399,02** | Margem >80% garantida |

---

## 7. Recomendações Executivas e Sequenciamento de Caixa

1. **Estancar o sangramento no código antes de cobrar R$ 1,00:** Desligar a bonificação 1:1 de `+1` crédito em `descarte.ts`, limitar `cota_inicial` a um *Free-Look* de diagnóstico sem comparação/visita/OCR completo e mover a carteira do armazenamento local (`Carteira.tsx`) para ledger autenticado no servidor.
2. **Adotar estratégia Web-First Pix-First (0% Apple/Google):** Capturar tráfego na Web/PWA com checkout transparente em Pix (**Mercado Pago 0,99%** até R$ 80,80; **AbacatePay/Woovi R$ 0,80** acima disso) e usar o app nativo como leitor/Modo Visita autenticado sem links clicáveis de pagamento externo (preservando **+10% a +25% de margem bruta** e eliminando chargeback de cartão).
3. **Lançar a Escada de Monetização em 3 frentes simultâneas (sem depender de Ads para ticket de R$ 49,90):**
   * **Topo Orgânico / B2C (`R$ 49,90` Passe Busca 30d e `R$ 79,90` Passe Decisão 60d):** Monetiza busca orgânica (SEO por edifício + viralização da assinatura no WhatsApp `"Mensagem preparada com o VEREDA"`).
   * **Motor de Caixa / Ads B2C (`R$ 199` Revisão 24h e `R$ 349` Concierge + Call 20m):** Permite comprar mídia paga no Meta Ads dentro do teto de CAC (`R$ 46–84`), **sempre desacoplando taxas do RI Digital** e sob cláusula estrita de relatório informativo (anti-OAB/CRECI/CREA).
   * **Recorrência Alinhada / B2B2C (`R$ 199 / 10 Dossiês` e `R$ 249/mês Pro` Co-branded):** Focar em advogados imobiliários, vistoriadores e assessorias *buy-side*, proibindo *white-label* editável que oculte achados negativos.

---

## Flags

1. **Exploit crítico de loop infinito no protótipo atual (`src/estado/Carteira.tsx`, `src/app/creditos.tsx`, `src/dados/descarte.ts`):** Os `3` créditos iniciais + `+1` crédito por motivo de descarte + armazenamento exclusivamente local permitem consultas ilimitadas gratuitas sem nunca atingir `saldo === 0`.
2. **Armadilha de 9,5 p.p. no Fator R (Simples Nacional):** Operação enxuta sem pró-labore/folha ≥ 28% da RBT12 cai automaticamente do **Anexo III (6,0%)** para o **Anexo V (15,5%)** desde a 1ª faixa, consumindo R$ 4,74 a R$ 33,15 extras por venda.
3. **Bitributação e margem negativa em custas de cartório (SC COSIT nº 72/2020):** Embutir taxas do RI Digital PE no preço do pacote incide DAS (6%–15,5%) + gateway sobre o repasse cartorário; com 2 certidões PE (~R$ 150) num pacote de R$ 199, a margem é **negativa (−14,9%)**.
4. **Risco de exercício ilegal de profissão regulada (OAB Lei 8.906/94, CRECI Lei 6.530/78, CREA Lei 5.194/66 e ABNT NBR 14653):** Qualquer linguagem de *"parecer jurídico"*, *"due diligence jurídica"*, *"laudo de vistoria/avaliação"* ou *"recomendação de compra"* no Dossiê Híbrido (Arquitetura B) expõe a empresa a nulidade contratual e Ação Civil Pública.
5. **Armadilha de anti-steering Apple×CADE no iOS:** Inserir link clicável dentro do app iOS para o checkout Web Pix atrai comissão de **10% (SBP)** a **15% (padrão)** no Brasil; a taxa **0%** exige aquisição Web/PWA pura sem link clicável no iOS ou enquadramento rigoroso na exceção **Guideline 3.1.3(d)** (serviço 1-para-1 fora do app sem destravar UI do app).
6. **Vetor de abuso do Art. 49 do CDC (7 dias) + *Friendly Fraud*:** Vender passe digital de consumo rápido por cartão de crédito sem *Free-Look* prévio nem termo de execução imediata consentida expõe a operação a consumo integral seguido de pedido de estorno/chargeback.
7. **Conflito de interesse B2B (*Paradoxo Zillow/First Street*):** Vender *white-label* para corretores de venda/incorporadoras gera pressão comercial para suprimir alertas negativos; o modelo B2B2C só se sustenta com lado comprador/pericial e PDF *co-branded* imutável.

---

## Data Gaps

1. **Zero dados reais de conversão e elasticidade no app (`G-USER = 0`):** Os números da pesquisa própria (`N=83`, WTP declarada R$ 27,40–28,00) são de intenção em formulário; não existem testes reais de checkout pago (`R$ 29,90` vs `R$ 49,90` vs `R$ 79,90` vs `R$ 199`) nem medição da queda de funil na transição Mobile Discovery → Web Pix Checkout.
2. **Cotação unitária exata por matrícula no RI Digital Recife (ONR/SAEC):** O PDF oficial do TJPE (`tjpe_ato1556_2025_emolumentos_2026.pdf`) fixa os emolumentos base (R$ 13,54 a R$ 48,84/folha conforme janela temporal) e TSNR (mín. R$ 6,59, até 100% dos emolumentos), mas a soma exata com fundos estaduais (FERC/FERM/FUNSEG), ISS do Recife (5%), taxa operacional do SAEC e número médio de folhas excedentes em matrículas do Recife (estimado em **R$ 58,61 a R$ 96+** por certidão) precisa ser verificada com 5 pedidos reais no `ridigital.org.br`.
3. **Preços unitários de APIs de certidões judiciais PE (TJPE) e protestos (CENPROT-PE):** BigDataCorp e Infosimples publicam preços de entrada para dados básicos/CND Federal (`R$ 0,024–0,10/consulta`, franquia mínima R$ 100/mês na Infosimples), mas custos por chamada em tribunais estaduais específicos, protestos PE e contratos Enterprise de DataZAP/Docket/Netrin são sob consulta comercial.
4. **Simulação contábil líquida do Fator R (INSS + IRPF do sócio vs. Anexo V):** A economia líquida real de elevar o pró-labore a 28% do faturamento depende do faturamento mensal projetado (RBT12) e descontos pessoais de INSS/IRPF, devendo ser simulada com contador antes do lançamento comercial.
5. **Impacto atuarial de risco para Arquitetura D (Seguros/Crédito):** Não há estudo empírico ligando achados do dossiê VEREDA a menor inadimplência ou sinistralidade residencial para precificar APIs de risco no mercado segurador.

---

## Sources

* **Código-fonte e documentos internos auditados no repositório local (`/home/v/Documents/vereda/veredas`):**
  * `src/estado/Carteira.tsx`, `src/app/creditos.tsx`, `src/dados/descarte.ts`, `src/dados/economiaDaOferta.ts`.
  * `docs/pesquisas-campo/PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md` (Pesquisa `N=83`, out/2026).
  * `docs/produto/refinamento-2026-10-21/03-PUBLICO-MONETIZACAO-E-DISTRIBUICAO.md`.
  * `docs/produto/pesquisa-2026-10-20/03-CONCORRENTES.md` e `04-MERCADO-REGULACAO-E-FOMENTO.md` (dados IBGE SIDRA 9928, FipeZAP set/2026, regulação ODbL/LGPD/CRECI).
  * `docs/dados/raw/preco-registro-2026-11-15/tjpe_ato1556_2025_emolumentos_2026.pdf` (TJPE Ato nº 1556/2025 — Tabela de Emolumentos 2026, DJ390/2025) e `cnj_provimento127.html` (CNJ Provimento nº 127/2022, Art. 3º).
  * `ignorar/camara-fria-swarm-2026-11-14/VEREDA_SWARM_INSIGHTS.md` e `ignorar/produto-historico/2026-10-20/04-PRECOS-E-VIABILIDADE.md`.
* **Gateways de Pagamento Brasil (verificação 2025–2026):**
  * Asaas (`asaas.com/precos-e-taxas`): Pix/Boleto R$ 0,99 promo 3m / R$ 1,99 padrão; Cartão R$ 0,49 + 2,99% à vista / +3,49% (2–6x) / +3,99% (7–12x).
  * Mercado Pago (`mercadopago.com.br`): Pix 0,99%; Cartão 4,98% (na hora) / 4,48% (14d) / 3,98% (30d); Boleto ~R$ 3,49.
  * Pagar.me (`pagar.me`): Plano Essencial Pix 0,99%–1,19%; Cartão à vista 4,19%–4,39% (promo/Flex ~2,99%); Boleto ~R$ 3,49.
  * Stripe Brasil (`stripe.com`): Cartão nacional 3,99% + R$ 0,39 (+2% int.); Pix 1,19%.
  * AbacatePay (`abacatepay.com`), Woovi (`woovi.com`), Efí (`sejaefi.com.br`): AbacatePay R$ 0,80 fixo/Pix; Woovi R$ 0,80–0,85 fixo/Pix; Efí 1,19% Pix API.
* **Lojas de Aplicativos e Regulação Antitruste Brasil (2025–2026):**
  * Apple × CADE / App Store Brasil (`apple.com`, `gov.br`, *Apple Developer Support / Attachment 12*): 10% Small Business Program / pós-1º ano; 15% links externos padrão; 21%–25% IAP padrão; 5% CTC em lojas alternativas; Apple App Store Review Guidelines 3.1.1 e 3.1.3(d)/(e) (serviços 1:1 / fora do app).
  * Google Play User Choice Billing Brasil (`support.google.com/googleplay`, `android.com`): redução de 4 p.p. na taxa de serviço (15% → **11%** nos primeiros US$ 1M).
* **Tributação, Custas Cartorárias e Regulação Profissional/Consumidor (Brasil):**
  * Simples Nacional Anexo III / V e Fator R (LC nº 123/2006; `contabilizei.com.br`, `contmatic.com.br` — CNAEs 6311-9/00 e 6203-1/00).
  * Reforma Tributária — Dispensa do Simples Nacional das alíquotas-teste 2026 (`0,9% CBS + 0,1% IBS`): Lei Complementar nº 214/2025, Art. 348, III (`fazenda.gov.br`, `conam.com.br`).
  * Tributação de reembolso de despesas / custas cartorárias no Simples Nacional: **Solução de Consulta COSIT nº 72/2020** (RFB) e LC nº 116/2003 (ISS).
  * CDC Art. 49 (Lei nº 8.078/1990), Boa-fé objetiva (CC Art. 187) e jurisprudência sobre exaustão de produtos/serviços digitais (`stj.jus.br`, `migalhas.com.br`).
  * Exercício profissional: Estatuto da OAB (Lei nº 8.906/1994, Art. 1º), Lei dos Corretores (Lei nº 6.530/1978), CONFEA/CREA e ABNT NBR 14653 (`planalto.gov.br`, `ibape-nacional.com.br`).
  * Emolumentos e fundos PE: TJPE Ato nº 1556/2025 (TSNR Lei nº 11.404/96, FERC, FERM/FUNSEG, ISS Recife), RI Digital (`ridigital.org.br`) e CNJ Provimento nº 127/2022.
* **Benchmarks de Conversão, Checkout, Tráfego Pago e Concorrência:**
  * RevenueCat (*State of Subscription Apps 2025/2026*, `revenuecat.com`): Hard Paywall 10,7% (vs. 12,1% em 2025) vs. Freemium 2,1% (Day-35).
  * Adapty (*State of In-App Subscriptions / Paywalls 2025/2026*, `adapty.io`): Trial ≤4d 25,5% vs ≥17d 42,5%; apps IA 5,3% trial start; *one-time* 7%–10%.
  * Checkout & Pagamentos BR 2025–2026 (`ecommercebrasil.com.br`, `visa.com.br`): Pix 42%–49% e-commerce e até 90% aprovação; Cartão 70%–75% (57% recusas < R$ 300; 70% migram para Pix).
  * Tráfego Pago Imobiliário BR 2025–2026 (`imobisoft.com.br`, `hoogli.com.br`, `adrock.com.br`): Google Ads CPC R$ 5–12 / CPL R$ 80–200; Meta Ads CPC R$ 2,50–6,00 (+12,15% repasse tributário 2026) / CPL R$ 30–100.
  * Concorrentes e APIs: Eli Report (`elireport.com`, freemium out/2024), CondoScan (`condoscan.ca`), Condo Check (`condo-check.com`), Certidão na Mão (`certidaonamao.com.br`), Olho no Carro (`olhonocarro.com.br`), Serasa (`serasa.com.br`), Vistoria/Due Diligence BR (`vistorize.app`, `costasaleseng.com.br`, `barbieriadvogados.com`), Jusbrasil (`jusbrasil.com.br`), Kenlo (`kenlo.com.br`), Vista/Loft CRM (`vistasoft.com.br`), BigDataCorp (`bigdatacorp.com.br`), Infosimples (`infosimples.com`), Netrin (`netrin.com.br`), DataZAP/Geoimovel/Docket (`docket.com.br`, `datazap.com.br`).