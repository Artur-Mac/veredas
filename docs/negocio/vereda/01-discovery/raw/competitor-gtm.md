# Análise Profunda de Go-to-Market (GTM) e Concorrência — VEREDA

**Phase:** 3 — Market Research (Wave 2, Agent B3)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** High

**Escopo:** Estratégia de aquisição, retenção, economia unitária e viabilidade de execução em <90 dias para equipe part-time no Recife (5 membros, **10–20h/semana totais**, histórico zero de vendas imobiliárias, orçamento inicial **R$ 0–5 mil**).

---

## 0. Checagem de Realidade Unitária (Wave 1 Unit Economics & Restrições de Plataforma) `[Data]`

Antes de analisar canais, a matemática da oferta B2C atual (**Passe de R$ 49,90**) impõe um filtro eliminatório sobre qualquer estratégia de mídia paga ou distribuição via lojas:

| Variável Econômica / Regulatória (Wave 1) | Valor / Regra Verificada | Impacto Direto no GTM | Fonte / Grau |
| :--- | :--- | :--- | :--- |
| **Preço B2C Bruto (Passe)** | **R$ 49,90** | Ticket baixo para operação de aquisição ativa/consultiva manual. | Premissa Wave 1 |
| **Margem de Contribuição pré-CAC (via Loja/IAP)** | **~R$ 39,91** *(dedução ~20%: 15% loja + ~5% impostos/gateway)* | **Google Play BR** cobra **15%** no primeiro US$ 1M/ano (30% acima) [Tier 1]; **Apple Small Business** cobra **15%** em IAP [Tier 1]. | [Tier 1] Apple / Google Play |
| **Acordo Apple × CADE no Brasil (2025–2026 / iOS 26.5)** | **15%** (padrão) / **10%** (Small Business) em *external link*; **21%/10%** em processador alternativo in-app; **0%** apenas em *texto estático não clicável* | Sair para web via botão no app iOS **não zera a taxa** (paga 10%–15%); só texto estático isenta, gerando atrito severo de checkout. | [Tier 1] CADE / Apple Dev Docs |
| **WebView Scraping (App Store Guideline 5.2 / 5.2.2)** | Proíbe acessar, exibir ou monetizar conteúdo de sites terceiros sem permissão expressa nos ToS | Ler anúncios de portais (ZAP, OLX, QuintoAndar) dentro de WebView expõe o app iOS a **rejeição sumária na App Review** se não houver autorização escrita. | [Tier 1] Apple Guidelines §5.2.2 |
| **Teto de CAC para LTV:CAC ≥ 3:1 (compra única)** | **~R$ 13,30** *(R$ 39,91 ÷ 3)* | Compra de dossiê imobiliário é **episódica** (ciclo de mudança de 18–60 meses). Sem recorrência, LTV ≈ 1 venda (`R$ 39,91`). *Payback* 1:1 tem teto absoluto de R$ 39,91. | Cálculo Unitário `[Estimate]` |
| **Mídia Paga Imobiliária BR (Google/Meta Leads)** | CPL médio **R$ 10–25** (econômico) a **R$ 30–60** (médio/alto padrão); conversão final **1,2%–1,8%** *(média setorial 1%–3%)* | Gera **CAC de R$ 555–750+** no econômico (`R$ 10–13,50 ÷ 1,8%`) até **R$ 3.000+** no médio padrão (`R$ 45 ÷ 1,5%`). Mesmo em checkout direto por clique (CPC R$ 1,50–3,50 a 1,5% CVR), CAC = **R$ 100–233** (**7,5x–17,5x acima do teto**). | [Tier 3] Benchmarks BR (Ignite/RD) |
| **Mídia Paga Mobile BR (CPI + Freemium RevenueCat)** | CPI Android BR: **US$ 0,30–2,50** (~R$ 1,70–14,00; iOS 2x–3x maior); CVR *freemium* download→pago: **2,1%** *(mediana 2025–2026)* | Mesmo com CPI Android otimista de **R$ 3,00**, `R$ 3,00 ÷ 2,1%` = **R$ 142,86 de CAC** (**10,7x acima de R$ 13,30**). Para bater R$ 13,30 a 2,1%, o CPI teria de ser **≤ R$ 0,28**. | [Tier 2] RevenueCat / Business of Apps / Adjoe |

> **Diagnóstico Financeiro Seco:** [Estimate] [Opinion] Em aquisição B2C paga, cada real investido em Google Ads ou Meta Ads para vender um passe de R$ 49,90 destrói caixa de **6x a 50x** além do teto sustentável. Além disso, conforme reportado pela análise do agente B3 sobre o código do protótipo (`src/estado/Carteira.tsx` e `src/app/creditos.tsx`), conceder 3 créditos iniciais e devolver +1 crédito por informar motivo de descarte cria um risco de **loop gratuito infinito** (`3 → -1 → +1`) que zera a urgência de pagamento antes mesmo do paywall. *(Nota de auditoria: arquivo de código do app citado pelo subagente de pesquisa; verificar pontualmente antes de alterar código de produto).*

---

## 1. Decomposição dos Playbooks Reais de Aquisição & Retenção `[Data]`

| Player (Mercado) | Motor Primário de Aquisição | Estratégia de Conteúdo / SEO / Social / PR | Mecânica de Retenção / *Cold-Start* | Monetização & Como Fecha o CAC | Armadilha / Por que Travou ou Pivotou | Grau |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Jámorei** (`jamorei.com`, BR) | PR inicial de lançamento + busca orgânica pontual | Matérias em *Estadão* e *Catraca Livre* no lançamento (out/2014); sem máquina contínua de blog/vídeo | Crowdsourcing puro com gamificação (pontos e medalhas); sem dado público pré-carregado | **100% gratuito**, sem anúncios de imóveis e sem receita transacional | **Nunca atingiu velocidade de escape:** sem receita para pagar aquisição e sem dados públicos para vencer o *cold-start*, bairros/ruas ficavam vazios fora do centro de SP/RJ (`DATA GAP` em volume exato de reviews). | [Tier 2/3] |
| **Morei Aqui** (`moreiaqui.com.br`, BR) | SEO de blog local (RJ) + Instagram `@moreiaqui` | Artigos sobre bairros do RJ (Méier, Vila Isabel, Recreio, Jacarepaguá) e direitos do inquilino; apenas web responsiva (sem app na Play Store) | Cadastro identificado + moderação de relatos; foco 100% em locatários | **100% gratuito** (`DATA GAP` em receita/patrocínio e número de usuários/reviews) | Mesma armadilha estrutural do Jámorei: depende de ex-inquilino voluntário escrever review antes de gerar utilidade ao visitante; sem *loop* financeiro que pague distribuição. | [Tier 3] |
| **MySide** (`myside.com.br`, BR — atua editorialmente inclusive no Recife) | **SEO geolocalizado de alta intenção** + YouTube + mídia paga | Guias profundos de *"melhores bairros para morar"* (inclusive Boa Viagem, Casa Forte, Parnamirim, Pina e Derby no Recife), comparativos de lançamentos, blog consultivo e casos reais no YouTube | Atendimento consultivo *high-touch* de *Personal Shopper Imobiliário* até a entrega das chaves | **Comissão de corretagem de 4%–6%** paga pela incorporadora/vendedor (VGV **R$ 125M** em 2023 → **R$ 350M** em 2024; R$ 12M *seed* Terracotta/Hiker) | **Por que funciona para eles e mata a VEREDA:** Em um imóvel de R$ 700 mil, 4,5% rende **R$ 31.500** por conversão — **~790x mais margem** que a VEREDA (R$ 39,91) para comprar as mesmas palavras-chave no Google. | [Tier 2] |
| **Openigloo** (`openigloo.com`, NYC/EUA) | **TikTok da fundadora** (~200 mil seguidores) + PR orgânico de indignação + guerrilha física | CEO Allia Mohamed virou o rosto da marca após achar influenciadores caros; vídeos de *landlord horror stories* e red flags geram PR recorrente | **Dados abertos da prefeitura (NYC HPD/311/bedbugs)** garantem valor com **0 reviews**; *Give-to-Get* incentiva relato anônimo | Freemium + IAP App Store (**US$ 14,99–17,99 / 24h**; **US$ 24,99–34,99 / 3m**) + pivot B2B **IglooIQ** (**US$ 10+/mês/imóvel**) e corretagem (**½ mês de aluguel**) | **Armadilhas expostas no Reddit:** (1) fora de áreas densas há **0 reviews**; (2) usuários reclamam de *paywall* sobre dados municipais que são grátis na prefeitura; (3) viés de vingança de inquilinos furiosos. | [Tier 2/3] |
| **Olho no Carro** (`olhonocarro.com.br`, BR) | **YouTube Creators automotivos** + SEO transacional + programa de indicação Pix + mídia paga em escala | Demonstrações reais em canais de carros ("puxamos a placa e achamos leilão!") com **cupom de 10%–15%** do canal; artigos respondendo medo de golpe | Compra episódica repetida na troca/pesquisa de carro; *Indique e Ganhe* paga comissão sacável via **Pix** | **Consulta Completa ~R$ 59,90–64,90**; faturamento saltou de **R$ 2M** (2021) → **R$ 13M** (2022) → **R$ 20M** (2023, +53%, *Exame*) | Só escalou mídia paga (centenas de milhares/mês) após internalizar marketing e apoiado em **1 chave universal (placa)** com cobertura nacional de 100% da frota — imóvel não tem "placa" exposta nos anúncios. | [Tier 2] |
| **Serasa Veicular** (`serasa.com.br`, BR) | **Cross-sell em base cativa gratuita** (dezenas de milhões de MAUs do Serasa Score/Limpa Nome) | Captura gratuita pelo crédito/CPF; oferta contextual dentro do app e via assinatura | Empacotamento em plano recorrente (**Serasa Premium**) | **R$ 29,90 avulso**; **1 consulta grátis + R$ 9,90 extras** no Serasa Premium | Prova a regra de ouro do ticket R$ 30–50 no BR: **ninguém paga CAC frio** para vender laudo de R$ 29,90; o laudo é *upsell* ou benefício de retenção sobre tráfego que já entrou de graça. | [Tier 1/2] |
| **Eli Report / CondoCheck** (`elireport.com` / `condoscan.ca`, CA) | **B2B2C embutido em fluxo documental** (*StrataPress* / *eStrataHub*) e parceria com corretores/advogados | Educação para corretores (*"Carfax dos condomínios"*); aliança com consultorias humanas (*Condo Assist*) | Ferramenta de produtividade recorrente para corretores e advogados em cada transação | Eli: freemium + pacotes pagos + *checkbox* no checkout documental; revisões humanas (*CondoScan/Check*): **CAD 250–600** | Compradores B2C não buscam proativamente software técnico de atas; o canal só escalou quando **corretores e advogados** passaram a embutir no prazo contratual de *due diligence*. | [Tier 2] |

### Síntese das Lições Competitivas para a VEREDA `[Opinion]`
1. **A lição Openigloo + Jámorei:** Nunca lançar na dependência exclusiva de reviews de usuários. A arquitetura da VEREDA com bases abertas do Recife resolve o *cold-start* de dados — **mas** a Openigloo prova que cobrar B2C por dado municipal acessível de graça gera reação negativa, a menos que o valor pago esteja na **inteligência de campo/visita** e na **síntese cruzada instantânea** por edifício.
2. **A lição Olho no Carro vs. MySide:** A Olho no Carro prova que relatório B2C episódico de R$ 50–65 pode escalar no Brasil quando há demonstração ao vivo com criadores de nicho expondo risco financeiro oculto e afiliado com comissão em dinheiro (Pix) — enquanto a MySide mostra que disputar SEO genérico de *"melhores bairros do Recife"* coloca margem de R$ 39,91 contra players que faturam ~R$ 30 mil por venda.

---

## 2. Teste de Estresse das 5 Hipóteses do Fundador `[Estimate]` `[Opinion]`

| Hipótese do Fundador | Veredito | Diagnóstico Baseado em Evidências |
| :--- | :---: | :--- |
| **1. Funil de curiosidades no Instagram** | **REPROVADA PARA TRAÇÃO <90 DIAS** | **Funil empírico (2025–2026):** `10.000 views` → `1%–3%` visita perfil (`100–300`) → `15%–30%` clica bio (CTR efetivo **0,2%–0,8%** = `~40 cliques`) → `5%–12%` landing ou deep link direto → `8%–18%` instala app *zero-brand* (`~6 installs`) → `2,1%` paga R$ 49,90 (`0,126 vendas`). **São necessárias ~80.000 views qualificadas NO RECIFE para 1 venda (R$ 39,91).** Curiosidades genéricas atraem audiência de SP/RJ/MG que instala, vê cobertura limitada ao Recife e deixa **avaliação 1 estrela na loja**, além de consumir **8–12h/semana**. |
| **2. "Shadow ads" no Reddit & Twitter/X** | **VETADA (RISCO CRÍTICO)** | No Reddit (`r/Recife`, `r/brasil`), filtros *Crowd Control*, CQS e moderação identificam *astroturfing*, gerando banimento e Efeito Streisand. `r/aluguel` tem tração residual no Brasil. *Só funciona com transparência radical ("construí ferramenta aberta com dados da PCR — testem e critiquem").* |
| **3. *Give-to-Get* para desbloquear créditos** | **PERIGOSA COMO DESENHADA HOJE** | O loop de créditos gratuitos com devolução por motivo de descarte zera a necessidade de pagar durante as 2–4 semanas da busca. Na Openigloo gerou viés de vingança fora de zonas densas; no Jámorei não venceu o cold-start. Se mantido, deve recompensar apenas evidência de campo verificável e com teto rígido. |
| **4. Play Store + Google/descoberta orgânica** | **INVIÁVEL EM <90 DIAS** | Usuários não buscam *"dossiê de apartamento"* na Play Store; apps *zero-brand* convertem **8%–18%** da visita à ficha (vs. 26%–27% média global). No Google Web, **AI Overviews** reduziram em **~58%** os cliques do #1 orgânico (Ahrefs 2025–2026) e política de *Scaled Content Abuse* pune páginas programáticas rasas. Matura em 4–9 meses, não em 90 dias. |
| **5. Parcerias B2B2C / B2B "mais tarde"** | **INVERSÃO OBRIGATÓRIA → ANTECIPAR PARA JÁ** | Adiar B2B2C obriga o time a queimar energia tentando vencer CAC impossível no B2C frio. **5 escritórios/consultores locais a R$ 249–399/mês** geram mais receita que **100+ usuários B2C avulsos**, com CAC ≈ R$ 0. |

---

## 3. Mapa de Oportunidades de Canal (Adaptado a 10–20h/semana no Recife & R$ 0–5 mil) `[Estimate]` `[Opinion]`

| Canal / Tática | Potencial <90 Dias | Banda Semanal Exigida | Custo Direto (R$) | CAC Estimado | Risco Principal & Mitigação |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **1. B2B2C "Cavalo de Troia" com Advogados Imobiliários, Vistoriadores & *Buy-Side* (Recife)** | **ALTO** *(Receita paga real)* | **5–6h/sem** | **R$ 0–300** *(material)* | **R$ 0–50** *(outreach direto)* | **Mitigação de falta de histórico:** Oferecer **"3 dossiês técnicos gratuitos anexáveis ao parecer do próximo cliente"** em troca de feedback e piloto de **R$ 249/mês** (ou R$ 199/pacote 10 laudos). Evitar imobiliárias tradicionais de venda (conflito de interesse). |
| **2. Parcerias Orgânicas Porto Digital / CESAR School / UFPE (RH & Comunidades)** | **ALTO** *(Volume qualificado local)* | **3–4h/sem** | **R$ 0** | **R$ 0–5** | O **Porto Digital** encerrou 2025 com **541 empresas**, **R$ 7,4 bilhões** e **24.079 colaboradores** (+19% vs. 2024) [Data]. Oferecer guia web gratuito de moradia segura para *onboarding* e calouros, monetizando **Modo Visita / Comparação Completa via Pix**. |
| **3. Micro-Creators Locais Recife + Afiliado Pix (Modelo *Olho no Carro*)** | **MÉDIO-ALTO** *(se Web-first + Pix)* | **3–4h/sem** | **R$ 1.500–3.000** *(cachê micro + revshare)* | **R$ 10–25** *(se comissão variável)* | **4 a 6 micro-criadores hiper-locais do Recife** (5k–50k seguidores) mostrando um dossiê real + link para **Web (sem download obrigatório)** com cupom de 10% e **comissão de 25%–30% via Pix** só quando vende. |
| **4. SEO Cirúrgico por Entidade de Edifício (Recife) + Web Checkout Pix** | **BAIXO em 90d / ALTO em 6–12m** | **2–3h/sem** | **R$ 0–200** | **~R$ 0 marginal** | Páginas leves por prédio/rua real (`"[Nome do Edifício] Boa Viagem alagamento obra IPTU"`) em vez de *"melhores bairros"*. |
| **5. Reels/TikTok de Curiosidades Genéricas / Link na Bio p/ App Store** | **MUITO BAIXO** *(queima banda)* | **8–12h/sem** | R$ 0 | **>R$ 100 em hora/tempo** | Atrai usuários fora do Recife (1 estrela na loja) e esbarra em revisão iOS se depender de WebView (**Guideline 5.2.2**). |
| **6. Google Ads / Meta Ads Direto para B2C R$ 49,90** | **NEGATIVO** *(prejuízo garantido)* | 2h/sem | R$ 2.000–5.000 | **R$ 140–750+** | Incompatível matematicamente com contribuição pré-CAC de R$ 39,91. |

---

## 4. Plano Realista de Tração em <90 Dias (10–20h/sem | R$ 0–5 mil) `[Assumption]` `[Opinion]`

### Cortes Obrigatórios Imediatos
1. **Corte total de Google/Meta Ads para B2C de R$ 49,90.**
2. **Veto a "shadow ads" no Reddit/X** (substituir por post transparente de validação local).
3. **Web Mobile-First (PWA) + Pix antes de App Store:** Elimina queda de 70%–85% do funil de instalação, evita taxa de 10%–15% de loja (margem líquida sobe para ~R$ 45–46) e evita bloqueio **Apple 5.2.2** sobre WebView.
4. **Consertar loop de créditos gratuitos:** 1 consulta pública básica gratuita por prédio/endereço (vence *cold-start*) + Passe de 30 dias via Pix para Modo Visita + Comparação Multi-Imóvel + Dossiê Completo.

### Cronograma Enxuto de Execução (~15h/sem | Orçamento R$ 2.500–4.000)

| Horizonte | Frente de Execução | Horas/Sem | Orçamento | Meta Mensurável (KPI Real) |
| :--- | :--- | :---: | :---: | :--- |
| **Dias 1–30** | **Web-First Recife + UFPE / CESAR / Porto Digital + Post Transparente no `r/Recife`** | **7h/sem** | **R$ 300** | • **150–300 usuários reais de Recife** testando buscas de prédios.<br>• **5–10 vendas B2C piloto** via Pix sem loja. |
| **Dias 15–60** | **Ataque Direto B2B2C (40 Advogados Imobiliários, Vistoriadores & *Buy-Side* do Recife)** *(3 dossiês grátis anexáveis ao parecer → piloto R$ 249/mês ou R$ 199/10 laudos)* | **5h/sem** | **R$ 200** | • **40 abordagens** → **10 testes** → **3–5 clientes B2B2C pagantes** (**R$ 750–1.500 MRR**). |
| **Dias 30–90** | **4–6 Micro-Creators Recife (comissão Pix 25%–30%) + Páginas SEO de Edifícios** | **4h/sem** | **R$ 2.000–3.500** | • **15k–40k views Recife**.<br>• **20–40 passes B2C** + **5+ contas B2B2C** (**~R$ 2.500–4.000 acumulados**). |

---

## Data Gaps

1. **`DATA GAP` — Jámorei & Morei Aqui:** Não há dados públicos auditados de MAU, volume acumulado de avaliações, tráfego mensal ou receita/custeio.
2. **`DATA GAP` — MySide, Olho no Carro & Eli Report:** Não divulgam CAC unitário auditado, taxa de conversão por canal ou churn.
3. **`DATA GAP` — Funil Reels/TikTok → Compra R$ 49,90 em PropTech BR:** Sem série pública única; projeção do funil combina benchmarks verificados por etapa (vídeo curto → loja *zero-brand* → *download-to-paid* freemium).

---

## Flags

**Red Flags:**
- **Colapso matemático de mídia paga B2C:** Ao preço de R$ 49,90 (teto CAC 3:1 de **R$ 13,30**), campanhas Google/Meta Ads no Brasil (CAC real **R$ 142–750+**) queimam 6x–50x o orçamento por venda.
- **Possível loop infinito no Give-to-Get do código (`src/estado/Carteira.tsx` + `src/app/creditos.tsx`):** Conforme apontado pelo agente B3, 3 créditos iniciais + devolução por motivo de descarte zeram a urgência de pagar nas 2–4 semanas de busca *(requer auditoria direta pontual se for para produção)*.
- **Política Apple CADE (2025–2026) + Guideline 5.2.2:** Links externos no iOS ainda pagam 10%–15% e WebView de portais terceiros enfrenta rejeição na App Store.
- **Shadow Ads no Reddit:** Risco severo de banimento no `r/Recife`/`r/brasil` e efeito Streisand.

**Yellow Flags:**
- **Competição desigual em SEO de bairros:** `MySide` já publica conteúdo para Boa Viagem, Casa Forte, Parnamirim e Pina lucrando ~R$ 31.500 por venda vs. R$ 39,91 do passe VEREDA; SEO só faz sentido em cauda longa por edifício/rua.
- **Queda de CTR orgânico com AI Overviews (-58%) e *Scaled Content Abuse*:** Páginas programáticas precisam de dados cadastrais exclusivos por prédio, não texto genérico.

---

## Sources

### Tier 1 (Fontes Primárias, Regulatórias e Plataformas Oficiais)
- Apple App Store Review Guidelines (§5.2 / §5.2.2) — `apple.com`
- CADE × Apple — TCC e estrutura de taxas/pagamentos externos no Brasil (2025–2026 / iOS 26.5) — `gov.br`, `apple.com`
- Apple App Store — Openigloo In-App Purchases (US$ 14,99–17,99/24h; US$ 24,99–34,99/3m) — `apple.com`
- Google Play — Taxas Brasil (15% até US$ 1M / 30% acima / User Choice Billing Pix) — `pagbrasil.com`, `studioresponsivo.com.br`
- Portais oficiais: `jamorei.com`, `moreiaqui.com.br`, `myside.com.br`, `olhonocarro.com.br`, `serasa.com.br`, `elireport.com`, `iglooiq.com`
- Referência interna citada por B3: `ignorar/docs/PRD-Vereda-2.1.md`, `src/estado/Carteira.tsx`, `src/app/creditos.tsx`

### Tier 2 (Imprensa de Negócios, Balanços Setoriais e Estudos Empíricos)
- `Estadão` & `Catraca Livre` (Jámorei out/2014)
- `Finsiders Brasil`, `Startups.com.br`, `Startupi` (MySide Seed R$ 12M, VGV R$ 125M → R$ 350M)
- `FounderBrew`, `The Real Deal`, `Apartment Therapy` (Openigloo TikTok ~200k seguidores, IglooIQ)
- `Exame`, `Gazeta de Pinheiros` (Olho no Carro R$ 2M → R$ 13M → R$ 20M)
- `BIV`, `StrataPress`, `PRWeb` (Eli Report & Condo Review B2B2C Canadá)
- `Ahrefs` (-58% CTR AI Overviews), `Seer Interactive`, `Genevate`, `Promptwatch` (Scaled Content Abuse)
- `RevenueCat` (State of Subscription Apps 2025–2026 — Freemium 2,1%), `Business of Apps`, `Adapty`, `Adjoe`, `IdeaEquity`
- `Folha de Pernambuco`, `Exame` (Porto Digital 2025: 541 empresas, 24.079 colaboradores, R$ 7,4 bi)

### Tier 3 (Comunidades, Benchmarks de Agências e Revisões Qualitativas)
- `RD Station`, `Ignite Marketing` (CPL e conversão imobiliária BR 1%–3%)
- `Conversion.studio`, `QueMedia`, `EnrichLabs` (funis Reels/TikTok link-in-bio)
- `condoscan.ca`, `condo-check.com` (preços revisão Canadá)
- `Reddit` (`r/NYCapartments`, `r/Recife`), `Redship` (astroturfing backlash)
