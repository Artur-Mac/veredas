# Análise Profunda: Concorrentes Indiretos, Substitutos e Risco de Plataforma — VEREDA (B2)

**Phase:** 3 — Market Research (Wave 2, Agent B2)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** High

> **Objeto analisado:** VEREDA — Plataforma neutra de decisão e diligência pré-contratual imobiliária (evidência urbana + verificação condominial/documental) para quem aluga ou compra no Brasil (piloto Recife).  
> **Data da pesquisa:** 15/11/2026  
> **Padrão probatório:** Dados verificados em 6 rodadas externas + auditoria de documentação primária local (`docs/produto/`). Fontes classificadas em **Tier 1** (oficiais, legislação, relatórios financeiros, telemetria de produto observada), **Tier 2** (imprensa econômica/setorial reconhecida) e **Tier 3** (fóruns, agências, relatos de campo). Lacunas explícitas declaradas como **`DATA GAP`**.

---

## Sumário Executivo

O maior concorrente do VEREDA **não é outro aplicativo de busca de imóveis**: é a combinação gratuita de **improviso humano + ferramentas genéricas + inércia de decisão** `[Opinion]`. Hoje, o comprador ou inquilino no Brasil (e especificamente no Recife) resolve suas dúvidas com um mosaico gratuito de **Google Maps/Street View**, **conversa informal com o porteiro**, **grupos de WhatsApp/Facebook e `r/Recife`**, **planilhas pessoais**, **corretores no WhatsApp** e, cada vez mais, **upload de PDFs no ChatGPT/Gemini/Claude gratuitos** `[Data]`.

Do lado das plataformas incumbentes, o risco competitivo bifurcou-se entre 2024 e 2026:
1. **Portais de anúncio (QuintoAndar e Grupo OLX/ZAP/VivaReal):** Estão despejando bilhões em IA conversacional e automação B2B (**R$ 2 bilhões no QuintoAndar em jun/2026 + Domi**; **Recomendação de Preços e Especialista PRO no Grupo OLX** `[Data]`), **mas sofrem de perigo moral estrutural insuperável**: como monetizam corretores, proprietários e volume transacional, não podem exibir alertas negativos que matem visitas ou derrubem conversão — exatamente como o **Zillow foi forçado a remover os escores climáticos da First Street em nov/2025** após retaliação de corretores da CRMLS `[Data]`.
2. **ERPs condominiais (Superlógica + Ahreas, com >130 mil condomínios e ~50% de share; uCondo):** Lançaram IAs nativas em 2025–2026 (**Gruvi AI**, **Superlógica Nexus em ago/2026**, **uCondo Móra AI**), já lendo regimentos, convenções e balancetes via chat/WhatsApp `[Data]`. Contudo, enfrentam um **bloqueio jurídico-político (LGPD + Código Civil art. 1.334/1.348 + veto de síndicos)** para abrir atas e balancetes a *terceiros não condôminos* antes da assinatura `[Opinion]`.
3. **Ameaça LLM genérica (ChatGPT/Gemini/Claude):** Já resolve bem a leitura pós-obtenção de um PDF limpo de contrato ou ata, **mas falha em três frentes críticas**: (i) não consegue obter a ata/balancete quando o corretor sonega; (ii) alucina em carimbos, manuscritos e certidões históricas sem trilha de auditoria; e (iii) é cega ao contexto territorial-predial (drenagem/maré, sol 3D por fachada, alvarás vizinhos, prédio-caixão/laudêmio e comparáveis por prédio).
4. **Inviabilidade de CAC B2C puro no ticket de R$ 49,90:** `[Estimate]` Com CPC imobiliário no Google Ads entre R$ 2,50 e R$ 18,00 e margem de contribuição intermediária estimada de **R$ 31,92** no pacote de R$ 49,90, tráfego pago B2C destrói a economia unitária em **2,5× a 12×**.

---

## 1. Status Quo Solutions (O Comportamento Real no Brasil e no Recife) `[Data]`

No mercado residencial brasileiro — e com gravidade ampliada no Recife, que em set/2026 registrou o **2º aluguel anunciado mais caro entre as capitais (R$ 64,39/m², atrás apenas de São Paulo, e o mais caro do Nordeste; FipeZAP, Tier 1)** — a diligência pré-contratual é feita de forma **artesanal, fragmentada e reativa**.

| Dor / Risco Investigado | Como o Usuário Realmente Resolve Hoje (BR / Recife) | Onde o Status Quo Falha Brutalmente | Por que o "Bom o Suficiente" Grátis Resiste `[Opinion]` |
| :--- | :--- | :--- | :--- |
| **Alagamento & Maré** | Olha relevo intuitivo no Google Maps, procura marcas de água em muros no **Street View**, pergunta ao **porteiro** ou comerciante da esquina e busca nome da rua no **Google Notícias / `r/Recife` / TikTok**. | Street View é tirado em dia seco e pode ter anos de defasagem; porteiro e corretor minimizam ("só encheu naquela chuva histórica"); ninguém cruza **cota do lote + ponto crítico Emlurb + tábua de maré + rota de saída da garagem** (subsolo em Boa Viagem/Setúbal/Pina). | Para bairros notoriamente famosos por alagar (trechos da Agamenon, Imbiribeira, Caxangá), o "boca a boca" e o noticiário local já dão um veto grosseiro de custo R$ 0. |
| **Ruído Urbano & Noturno** | Abre o **Google Maps** ao redor do prédio procurando bares, igrejas, postos e escolas; lê avaliações no Google de bares próximos; visita o imóvel em horário comercial e volta rapidamente num sábado à noite. | Visitas comerciais (terça às 14h) escondem entrega de supermercado às 5h, cultos de fim de semana, sirenes de hospital e corredor de ônibus às 18h. Pouca gente conhece **Mapa Sossego** ou checa licenças sonoras (**LUSE**) da Prefeitura. | A maioria acha que "uma passada de carro à noite" resolve; só descobre reverberação de cânion viário ou casa de festas vizinha após assinar contrato de 12–30 meses. |
| **Condomínio, Taxa Extra & Inadimplência** | Pergunta o valor ao **corretor no WhatsApp**; conversa informalmente com o **porteiro** (*"o elevador quebra muito? tem obra aprovada?"*); se for compra avançada, pede as **3 últimas atas e balancetes** e a CND condominial. | **1) Na locação**, quase nenhum inquilino recebe ata/balancete antes de assinar (administradoras negam a terceiros). **2) Na compra**, a CND condominial só prova que o vendedor está em dia — **não revela cota extra já aprovada em assembleia** nem déficit com fundo de reserva zerado. **3) Anúncios escondem encargos:** auditoria local em 14/11/2026 mostrou OLX exibindo *"Não informado"* para condomínio/IPTU e ZAP exibindo valores simbólicos de R$ 1–R$ 2. | Conversar com o porteiro é grátis, humano e dá sensação de "malandragem local". Muitos compradores só leem as atas tarde demais (após pagar sinal/arras). |
| **Insolação (Nascente / Poente)** | Olha a bússola do celular na visita ou estima no olho pelo satélite/3D do Google Maps; no Recife, filtra anúncios pela palavra **"nascente"** (regra cultural absoluta contra calor tropical). | Corretores frequentemente confundem *"nascente"* com *"nascente-sul"* ou *"semi-nascente"*. Google Maps 3D padrão não calcula **sombra projetada por torres vizinhas por andar e época do ano**. | A heurística *"é nascente?"* + olhar pela janela durante a visita já parece suficiente para 80% do público. |
| **Segurança da Rua** | Pergunta no **`r/Recife`**, grupos de **Facebook de bairro**, colegas de trabalho, ou olha **Fogo Cruzado**; observa portaria 24h e movimento às 20h. | Grupos sociais misturam preconceito socioespacial com anedotas antigas; dados oficiais da **SDS-PE param em nível de município/região**; Fogo Cruzado registra tiroteios, não assalto a pedestre/celular. | Validação social ("meu amigo mora perto e acha tranquilo") tem altíssima confiança psicológica e custo zero. |
| **Preço Justo (Aluguel / Compra)** | Abre **5–10 abas** no ZAP, VivaReal, OLX e QuintoAndar, ordena por preço/m², joga numa **planilha Excel / Google Sheets** ou notas do WhatsApp, e pechincha no feeling. | **1) Preço pedido ≠ preço fechado** (portais têm 25–40% de estoque duplicado/fantasma). **2) No Recife**, anúncios omitem **Terreno de Marinha** (laudêmio de **5%** sobre valor do terreno na venda + foro anual em ~40% do território da cidade) ou se um prédio antigo de 3–4 pavimentos é **prédio-caixão** sem seguro/financiamento Caixa. | O usuário confunde "média dos anúncios que abri no ZAP" com "valor justo de mercado". |

---

## 2. Adjacent Products & Benchmark Global `[Data]`

### A. Produtos Adjacentes no Brasil

| Produto | O que Faz (Verificado) | Preço / Modelo | Forças vs. VEREDA | Fraquezas Estruturais |
| :--- | :--- | :--- | :--- | :--- |
| **Mapa Sossego** (`mapasossego.com.br`) | Estima nível de ruído urbano (**Índice Sossego 0–100**, dia e noite) para endereços no Brasil (inclui **Recife** e SP), via dados OpenStreetMap + Censo. | **100% gratuito**, sem cadastro. | Zero fricção de entrada; resposta instantânea para *"essa rua é barulhenta?"*; SEO forte por bairro. | Modelo teórico estático por OSM; não mede ruído real em campo, não cruza LUSE Recife, alagamento, sol ou condomínio. |
| **SíndicoNet** (`sindiconet.com.br`) | Maior portal/ecossistema condominial do Brasil: notícias, fóruns, jurisprudência, cotações e IA para gestão. | Mídia + B2B (fornecedores/síndicos). | Profundo conhecimento das patologias reais de condomínios brasileiros. | Serve exclusivamente o **lado da gestão** (síndicos e administradoras), nunca o comprador/inquilino pré-contrato. |
| **Já Morei** (`jamorei.com`) | Tentativa brasileira (~2014) estilo *Openigloo* de avaliações anônimas de prédios. | Gratuito (legado). | Validou cedo o apetite de inquilinos por saber *"como é morar nesse prédio"*. | Praticamente inativo; escassez por prédio, risco de difamação/LGPD e sem modelo de receita. |
| **MySide** (`myside.com.br`) | Assessoria imobiliária independente (*personal shopper* exclusivo do comprador) em GO, SC, PR, MG, SP (Recife planejado, **não confirmado** operacionalmente até out/2026). | Comissão paga na compra (*buy-side*). | Alinhamento com o comprador na negociação e documentação. | Focado apenas em compra de ticket médio-alto (lançamentos/novos), não atende locação nem pré-visita rápida. |
| **DiHub** (BH) | Automação de certidões imobiliárias (>100 clientes B2B). | B2B SaaS / por transação. | Resolve o pós-decisão cartorial para imobiliárias/incorporadoras. | Opera **depois** da escolha; sem evidência urbana, sol, alagamento ou custo condominial. |
| **ONR / RI Digital + SIG-RI** (Provimento CNJ 195/2025) | Infraestrutura oficial dos cartórios; Provimento 195/2025 (jun/2025) instituiu o **SIG-RI** e **Mapa do Registro de Imóveis**. | Pago por ato (PE: visualização ~R$ 17,58; certidão digital ~R$ 58,61 est. 2026). | Única fonte com **fé pública jurídica** (ônus, penhoras, proprietário, laudêmio). | Interface técnica; não traduz matrícula para leigo nem cobre condomínio (ata/balancete) ou microclima urbano. |

### B. Precedentes Internacionais Críticos
1. **Zillow + First Street (`Tier 1/2`):** Em nov/2025, após reação da *CRMLS*, a Zillow **removeu os escores climáticos diretamente das páginas de anúncio** (TechCrunch, 01/12/2025). Em **03/08/2026**, a **MSCI** concluiu a aquisição da First Street por **US$ 122,6 milhões** líquidos (+ até **US$ 130 milhões** em earn-out em 2 anos; Form 10-Q MSCI), migrando o ativo para bancos/seguradoras/gestores.
2. **Rightmove + HomeViews (`Tier 1/2`):** Em **01/02/2024**, a Rightmove comprou a **HomeViews** por **£ 8 milhões**, monetizando reputação B2B (*HomeViews Business*) para operadoras *build-to-rent*.

---

## 3. Platform Risk Assessment (Risco dos Incumbentes 2024–2026) `[Data]` `[Opinion]`

| Incumbente | Movimentos Verificados (2024–2026) | O que PODE Copiar | O que NÃO Consegue Copiar Sem Destruir Seu Negócio | Risco para VEREDA |
| :--- | :--- | :--- | :--- | :--- |
| **QuintoAndar** | • Em Recife desde jan/2021.<br>• Busca IA generativa + **QPreço**.<br>• **Jan/2026:** Termos endurecidos anti-scraping.<br>• **Jun/2026:** **R$ 2 bilhões em IA** (2026–2028) + assistente **Domi** (WhatsApp B2B corretores). | • Comparativo interno de preço (**QPreço**).<br>• Guias de bairro IA.<br>• Leitura de documentos dentro da esteira de fechamento. | • **Transparência adversarial pré-visita:** exibir alagamento ou obra vizinha derruba conversão e afasta proprietários.<br>• **Comparação neutra cross-portal** (concorrentes ZAP/OLX/imobiliárias). | **ALTO** em preço/descoberta interna; **MÉDIO-BAIXO** em auditoria neutra cross-portal. |
| **Grupo OLX (OLX, ZAP, VivaReal, DataZAP)** | • **Abr/2024:** Cortou integrações de não-imobiliárias (tirou QuintoAndar da OLX).<br>• **Out/2024:** Padronizou feeds VRSync no Canal Pro.<br>• **ZAPway+:** Integrou **Sohtec** + Recomendação de Preços IA + Especialista PRO; ToS fev/2025 anti-scraping. | • Deduplicação de anúncios.<br>• Faixa pedida por bairro (DataZAP).<br>• POIs genéricos no mapa. | • **Sabotagem de anunciantes pagantes:** mostrar tempo de imóvel encalhado, quedas de preço ou omissão deliberada de taxas sabota clientes B2B do Canal Pro.<br>• Dados básicos em Recife chegam omissos/errados por autodeclaração. | **MÉDIO** (risco maior é bloqueio jurídico/ToS sobre links). |
| **Superlógica (+ Ahreas)** | • Fusão com Ahreas: **>130 mil condomínios** (>6,3M unidades, ~50% share BR).<br>• **Gruvi AI** (*Chat Regimento*).<br>• **24–25/08/2026:** **Nexus** (*Superlógica Next 2026*) automatizando até 70% de rotinas ERP/CRM. | • Poderia gerar com 1 clique um **"Passaporte do Condomínio"** (taxa média, cota extra, inadimplência, reserva) se o proprietário autorizasse. | **Barreira tripla:** (1) Cliente é a Administradora/Síndico (que veta expor déficit/passivos); (2) LGPD + sigilo de devedores/votos; (3) Margem está em *Embedded Finance*, não em B2C de R$ 49,90. | **BAIXO** no curto prazo como concorrente B2C; **ALTO potencial** como parceiro B2B2C opt-in. |
| **uCondo** | • **Móra AI** (2025–2026): IA gratuita e ilimitada via **WhatsApp** lendo PDFs (balancetes, regimento, Código Civil) e redigindo atas para síndicos/moradores. | • Morador/síndico já resume balancete no WhatsApp da Móra de graça. | • Não atende o comprador/inquilino antes da entrada nem cruza dados urbanos externos (ESIG, alagamento, sol 3D, ITBI). | **BAIXO** como substituto completo; **MÉDIO** em educação de moradores. |

---

## 4. The ChatGPT / Gemini / Claude PDF Threat `[Data]` `[Opinion]`

### Preços e Limites no Brasil (2025–2026)
* **ChatGPT:** Upload grátis limitado (~3 arquivos/dia na prática); **ChatGPT Go ~R$ 39,99/mês**; **Plus US$ 20/mês (~R$ 100–105/mês)**.
* **Google Gemini:** Grátis na web/app; **Google AI Plus ~R$ 24,99/mês**; **AI Pro R$ 96,99–97/mês**.
* **Claude:** Grátis limitado; **Claude Pro US$ 20/mês (~R$ 75–115/mês)**.

### Onde a LLM Genérica Vence vs. Onde Falha
* **Vence:** Se o usuário JÁ TEM o PDF limpo do contrato/ata/balancete, ChatGPT/Claude gratuitos extraem cláusulas e resumem tabelas em 30 segundos. **Vender o VEREDA como "resumo de ata por IA" é morte certa.**
* **Falha Brutalmente (3 lacunas que fundamentam pagamento):**
  1. **Muro de Acesso Pré-Proposta:** 90%+ dos interessados comparando 3–5 visitas em Recife **não recebem ata, balancete ou matrícula** antes de fazer proposta — o ChatGPT fica sem PDF.
  2. **Alucinação em Matrículas Antigas & Carimbos:** PDFs cartoriais escaneados com carimbos e averbações manuscritas induzem LLMs genéricas a preencher dados ilegíveis sem sinalizar incerteza auditável.
  3. **Cegueira Territorial, Financeira Comparativa e Presencial:** ChatGPT não sabe que a rua alaga na maré cheia de 2,3 m, não sabe que o prédio fica em Terreno de Marinha (5% laudêmio), não projeta sombra 3D por fachada, não compara Custo Total de Ocupação lado a lado e não acompanha o usuário no **Modo Visita ao vivo**.

---

## 5. Open & Free Alternatives + Bloqueio de Dados nas 7 Capitais `[Data]`

### 5.1 Ferramentas Abertas e Gratuitas
- **Google Maps / Street View / Reviews:** Grátis, mas seco em dias de foto antiga e reviews esparsos de prédios residenciais.
- **FipeZAP / DataZAP:** Preço pedido macro por bairro (Casa Forte ausente do recorte por bairro), nunca por edifício.
- **Loft Calculadora:** Limitada/ausente para Recife.
- **Walk Score / SunCalc / ShadeMap:** Métricas genéricas que ignoram calçada/alagamento/iluminação no Brasil e exigem leitura técnica manual de azimute sem modelo 3D local.
- **ESIG Recife + Dados Abertos + Fogo Cruzado:** Inutilizáveis no celular por leigos; ademais, **181 pontos Emlurb pararam em ago/2022** e **205 prédios ITEP (2007) não têm licença declarada**.

### 5.2 Bloqueio/Opacidade nas 7 Capitais (Reforço Cross-Check Onda 1)
Em **5 das 7 capitais** analisadas (Curitiba, RJ, BH, Fortaleza e parcialmente POA — além de Salvador), há restrição ou bloqueio por inscrição/sigilo em ao menos um pilar da tríade `IPTU + ITBI + Alvarás por lote`, confirmando que **SP e Recife são exceções** e que escalar nacionalmente exige fontes independentes do município.

---

## 6. Switching Cost Analysis & "Por que Pagar?" `[Estimate]` `[Opinion]`

### A Matemática de CAC vs. Ticket de R$ 49,90 (`docs/produto/refinamento-2026-10-21/03`)
* Receita bruta: **R$ 49,90** → Margem pré-CAC intermediária: **R$ 31,92** (ou **R$ 9,92** no cenário pesado).
* Google Ads imobiliário BR: CPC **R$ 2,50–18,00**, CPL **R$ 45–150**; Meta Ads CPL **R$ 8–90+** (+ ~12,15% tributo).
* Mesmo a CPC de **R$ 2,50** e **2,5%** de conversão = **CAC de R$ 100,00** (**3,1× acima da margem de contribuição inteira**).
* WTP declarada na pesquisa exploratória (`N=83`, UFPE) ficou em **R$ 27,40–R$ 28,00**.

### O que Quebra a Inércia do "Grátis"
1. **Valor imediato em <15 segundos por nome do prédio/rua** (revelando risco oculto não óbvio: obra vizinha, ponto crítico Emlurb, divergência de condomínio entre anúncios).
2. **Desempate financeiro de risco alto antes do sinal:** Evitar erro em aluguel de **R$ 40k–60k/ano** ou compra com **laudêmio de 5%** / **prédio-caixão** / **cota extra aprovada**.
3. **Transferir recorrência para B2B2C:** Assessorias independentes, advogados imobiliários, RH de realocação, seguradoras de fiança/incêndio e correspondentes de crédito.

---

## 7. Data Gaps

1. **`DATA GAP` — CAC real observado do VEREDA:** 0 campanhas e 0 pagamentos reais executados até nov/2026.
2. **`DATA GAP` — Uso real de ChatGPT/Gemini para PDFs por compradores/inquilinos no Recife:** Sem estudo quantitativo representativo local.
3. **`DATA GAP` — Granularidade por edifício do `QPreço` no Recife:** Confirmada atuação em Recife, não auditado edifício a edifício autenticado.
4. **`DATA GAP` — Produto autônomo `"Sohtec AI"`:** Confirmada compra da Sohtec pelo Grupo OLX (2022) e integração no ZAPway+; nenhum produto autônomo com esse nome literal encontrado em 2024–2026.
5. **`DATA GAP` — Auditoria técnica direta de download em BH, Fortaleza e RJ.**
6. **`DATA GAP` — MAU isolado e planos públicos da `Gruvi AI` (Superlógica) e `Móra AI` (uCondo).**
7. **`DATA GAP` — Base consolidada de inadimplência/cotas extras por prédio no Recife:** Apenas 185 CNPJs de condomínio de PE na PGFN (2T/2026) em base pública.

---

## Flags

**Red Flags:**
- **Morte da tese "IA leitora de ata/PDF":** ChatGPT/Gemini gratuitos e a **Móra AI (WhatsApp gratuito da uCondo)** já resumem PDFs de graça; sem contexto territorial + muro pré-proposta + Modo Visita, o usuário não paga.
- **Armadilha de dados locais defasados ou sem licença no Recife:** Emlurb (2022), ITEP prédios-caixão (2007 sem licença explícita), Defesa Civil (88% sem grau de risco nos 5 bairros) e SDS-PE apenas municipal.
- **Conflito Zillow/First Street & ToS Anti-Scraping (QuintoAndar jan/2026, OLX fev/2025):** Qualquer dependência de servidor raspando portais ou emissão de "notas/selos de risco" atrai bloqueio e litígio.
- **CAC pago B2C inviável a R$ 49,90:** CPC R$ 2,50–18,00 gera CAC de ~R$ 100+ contra margem de R$ 31,92.

**Yellow Flags:**
- **Moat hiperlocal em risco de ser subaproveitado:** **Terreno de Marinha (40% do Recife, laudêmio 5%)** e **431 prédios-caixão (acordo FCVS R$ 1,7B até 2026)** são dores gigantes ignoradas por ZAP/QuintoAndar/ChatGPT, mas pouco exploradas se o produto focar só em "bairros legais".
- **Existência de ferramenta gratuita pontual (`Mapa Sossego`):** Já entrega índice de ruído 0–100 gratuito inclusive em Recife via SEO.

---

## Sources

### Tier 1 — Primárias, Oficiais, Legislação e Relatórios Financeiros
1. Fipe / Índice FipeZAP (fev/2026 & set/2026 — Recife R$ 64,39/m² aluguel, +21,5% Graças).
2. IBGE — Censo 2022 (SIDRA 9928 & CNEFE).
3. Prefeitura do Recife — Dados Abertos & ESIG (IPTU 2026, Licenciamento, Defesa Civil 2024, Emlurb 181 pontos, LPUOS 2025).
4. MSCI Inc. — Form 10-Q / Comunicado Oficial (03/08/2026 — aquisição First Street US$ 122,6M líquidos + até US$ 130M earn-out).
5. CNJ — Provimento nº 195/2025 (`cnj.jus.br`, `onr.org.br`, `anoreg.org.br`) & Tabela ARIPE/TJPE.
6. Legislação: Código Civil (arts. 1.334, 1.348), Lei nº 8.245/1991 (art. 22, IX), LGPD (Lei 13.709/2018), Lei nº 6.530/1978, LC nº 182/2021.
7. GrupoZAP / Canal Pro (VRSync obrigatório out/2024); QuintoAndar & OLX Termos de Uso (jan/2026, fev/2025); Superlógica (`Gruvi AI`, `Nexus` ago/2026) & uCondo (`Móra AI`); Rightmove & HomeViews (`£8M` fev/2024); Caixa/AGU (acordo FCVS 431 prédios-caixão R$ 1,7B); Portais Dados Abertos (`cmc.pr.gov.br`, `geosampa`, `data.rio`, `dadosabertos.poa.br`, `databh.pbh.gov.br`, `dados.fortaleza.ce.gov.br`, `dados.df.gov.br`).
8. Auditoria local VEREDA (`docs/produto/benchmark-portais-imobiliarios-2026-11-14.md`, `docs/produto/refinamento-2026-10-21/03-PUBLICO-MONETIZACAO-E-DISTRIBUICAO.md`, pesquisa `N=83` UFPE).

### Tier 2 — Imprensa Econômica, Tecnológica e Portais Setoriais
9. InfoMoney, Forbes Brasil, Bloomberg Línea, Estadão, Itatiaia (QuintoAndar R$ 2B IA & Domi).
10. SindicoNet, Secovi-PE, ImobiReport, Exame, Brazil Journal (Superlógica + Ahreas >130k condomínios; Grupo OLX corte abr/2024 & Sohtec/ZAPway+; terrenos de marinha 40% Recife).
11. TechCrunch (01/12/2025), CNN, The Real Deal, City AM (Zillow/First Street; Rightmove/HomeViews).
12. Globo/G1, Diário de Pernambuco, FolhaPE (prédios-caixão PE 2024–set/2026).
13. Exame, Estadão, Canaltech (preços locais ChatGPT Go/Plus, Google AI Plus/Pro).
14. SciELO Brasil / ITDP / Fogo Cruzado / Walk Score / SunCalc / ShadeMap / Já Morei (`jamorei.com`).

### Tier 3 — Comunidades, Agências Digitais e LegalTechs
15. Reddit (`r/Recife`, `r/brasil`, `r/golpe`, `r/ConselhosLegais` — descoberta do `Mapa Sossego` `mapasossego.com.br`, cultura do "nascente", golpes e porteiros).
16. Agências BR (Altavance, Leal Mídia, Hoogli, Colibex, Leadster — benchmarks CPC/CPL Google e Meta Ads).
17. Blogs Jurídicos/LegalTechs (`digitajus.com.br`, `ialocus.com.br`, `morada.ai`, `ohub.com.br`, `tudocondo.com.br`, `castan.com.br`, `ribeirocavalcante.com.br`, `FamilyPro`, `Whizi`, `GeoPriced`, `DiogoPuiatti`).
