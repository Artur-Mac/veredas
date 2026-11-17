# Mapeamento Profundo de Concorrentes Emergentes, Stealth e Ecossistema Local (2024–2026) — VEREDA

**Phase:** 3 — Market Research (Wave 2, Agent B4)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** High

**Mercado-Alvo Inicial:** Recife (PE) — Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena  
**Método e Escala de Evidência:** 8 rodadas de pesquisa aberta (YC, Product Hunt, Chrome Web Store, GitHub, hubs brasileiros Terracotta/Cubo/Liga/LelloLab, editais Recife/PE/Campus Mobile) cruzadas com evidências do repositório local (`docs/produto/`, `plugins/compartilhar/`, `extensions/desktop/`). Classificação rigorosa de fontes:
- **Tier 1:** Fonte primária oficial (sites dos produtos, editais governamentais, repositórios GitHub, páginas da Chrome Web Store, documentações técnicas, registros oficiais).
- **Tier 2:** Imprensa especializada, relatórios setoriais, plataformas de lançamento e estudos técnicos de parceiros (InfoMoney, Estadão, Forbes, TechCrunch, Guardian, ESG Dive, LlamaIndex, Product Hunt, Imobi Report, SíndicoNet).
- **Tier 3:** Comunidades, fóruns, agregadores de métricas estimadas e listas de terceiros (Reddit, `chrome-stats.com`, diretórios de terceiros).  
Itens não verificáveis em fontes abertas estão marcados explicitamente como **`DATA GAP`**.

---

## Sumário Executivo

Enquanto o capital global de PropTech migrou para agentes de IA em fluxos documentais (US$ 16,7 bilhões em 2025; 58% do volume do 3º trimestre de 2026 em líderes de IA e crédito; aquisição da First Street pela MSCI por US$ 120 milhões em 2026 `[Data]`) e o mercado brasileiro concentrou aportes em infraestrutura de IA para vendas, crédito e gestão condominial (orçamento de R$ 2 bilhões em IA do QuintoAndar, Superlógica Nexus em ago/2026, uCondo Móra, Docket R$ 110 milhões `[Data]`), **a camada pré-visita voltada a quem procura imóvel para morar segue estruturalmente vazia no Brasil e em grande parte do mundo** `[Opinion]`.

Os achados desta varredura revelam quatro assimetrias críticas que protegem e orientam a tese do VEREDA:
1. **Paradoxo Documental (Pós-acordo vs. Jardim Murado):** [Data] As novas startups de IA que leem matrículas, contratos, atas e balancetes operam ou **no pós-fechamento/crédito** (Docket AI, Matrícula Simples, Feche Agora, Morad.ia, RealPact, Vestris, `condocheck.ai`) ou **trancadas dentro do ERP do síndico** para moradores atuais (Superlógica Nexus/Gruvi, uCondo Móra, Assembly HOA). Mesmo no Canadá, onde existem leitores B2C de atas condominiais (*Eli Report*, *CondoScan*), a alucinação contextual forçou o *CondoScan* (CAD $349) a impor **revisão humana obrigatória**, enquanto a incumbente *Condo Check* (`condo-check.com`) faz campanha explícita contra IA (*"NO AI, ONLY EXPERIENCED HUMANS"*).
2. **Extensões Chrome e Bots de Portais Bateram no Paredão Anti-Bot e no Modelo de Custos:** [Data] Extensões de histórico de preços enfrentam micro-adoção (*Precios Inmuebles Plus* no Idealista: ~900–950 usuários) ou rejeição por *paywall* necessário para sustentar servidores (*Property Log* no Rightmove: nota ~2,5–3,1/5 após cobrar £2,99/mês). No Brasil, há apenas extensões utilitárias simples de desktop (*Preço por m² — QuintoAndar*, *SureIA* no ZAP), e testes do próprio VEREDA registraram bloqueio `403` e Cloudflare (`Attention Required!`) contra WebViews/servidores em ZAP, VivaReal e OLX, agravado pela migração do ZAP em 2026 para Next.js App Router (`self.__next_f`).
3. **Ecossistema Recife/PE Foca em GovTech Climática B2G, Não em Inteligência para o Morador:** [Data] O *E.I.T.A! Recife* (CPSI) e o *Porto Digital* geraram soluções fortes de monitoramento de alagamento e resíduos para a Prefeitura/Defesa Civil (*Ih, Alagou* e *Manacá/SAÍRA*), além de construtechs pós-obra (*Facilitat*) e marketing de lançamentos (*Marta*). Nas edições 12ª (2024), 13ª (2025) e 14ª (2026) do *Claro Campus Mobile*, nenhum projeto de *Smart Cities / Tecnologias Urbanas* abordou dossiê habitacional ou perícia pré-visita.
4. **ChatGPT Apps, Google Maps e MCP Servers Ainda Não Resolvem Evidência Cadastral nem Campo:** [Data] A integração do Zillow no ChatGPT (out/2025) é funil de descoberta comercial — e o próprio Zillow **removeu os scores climáticos da First Street no fim de 2025** após pressão de corretores, comprovando o conflito de agência dos portais. O *Ask Maps* (Gemini) responde por POIs e avaliações subjetivas, sem cadastro municipal ou risco físico por lote. Já os servidores MCP no GitHub (incluindo o brasileiro `carloshernanic/proximo-ap`) são projetos de nicho para desenvolvedores, dependentes de scraping frágil e cegos para cadastro oficial e vistoria presencial.

---

## Matriz Consolidada de Concorrentes Emergentes, Stealth & Locais (2024–2026) `[Data]`

| Player / Projeto | Região / Origem | Eixo / Categoria | O que faz na prática | Estágio / Preço / Funding | Sobreposição com VEREDA | Tier |
|---|---|---|---|---|---|---|
| **Eli Report** (OctoAI) | Canadá (BC/AB) | IA para pacotes de condomínio (*strata*) | Lê PDFs escaneados de atas, orçamentos e fundos de reserva; aponta *red flags* e faz *benchmark* | Freemium + camada especialista (`DATA GAP` funding 2024–2026) | Média no conceito de ler condomínio, mas só atua após acesso privado ao pacote de documentos | 1 / 2 |
| **CondoScan** | Canadá (Alberta) | IA + humano para atas e balancetes | Pipeline LlamaIndex/LlamaParse + chat + **revisão humana obrigatória** antes do relatório (24h) | Bootstrapped; CAD $349 (res.) / CAD $500 (com.) | Baixa no Brasil; prova que relatório de ata com IA sem auditoria humana gera risco financeiro | 1 / 2 |
| **Condo Check** (`condo-check.com`) | Canadá (Alberta) | Revisão manual de condomínios | Analistas humanos revisam atas/regimentos/reservas com slogan *"NO AI, ONLY HUMANS"* | Incumbente desde 1994 (`DATA GAP` receita) | Evidência de contra-posicionamento à IA pura em decisões imobiliárias de alto valor | 1 |
| **Condo Check AI** (`condocheck.ai`) | EUA | Underwriting B2B de condomínios | IA audita elegibilidade de projetos condominiais para bancos e credores hipotecários | SaaS B2B; US$ 70 por análise | Nula no público final (foco em *lenders* / hipoteca) | 1 |
| **Assembly HOA** | EUA (YC S24) | Gestão condominial com IA | Plataforma operacional, contábil e documental para conselhos de HOA (CA) | YC S24 + MDI Ventures; preço custom B2B | Nula no pré-visita (ERP voltado à diretoria do condomínio) | 1 / 2 |
| **RealPact** | EUA (YC) | Agente de transação para corretores | Busca escrituras, impostos e MLS; preenche contratos e gerencia prazos | Fundada em 2025; US$ 500k pre-seed; 25+ imobiliárias | Nula (automação de backoffice de corretora) | 1 / 2 |
| **Vestris** | EUA (YC S26) | Processamento agêntico de *title/closing* | Automatiza fechamento e *title insurance* de ponta a ponta | YC Summer 2026 (`DATA GAP` receita/preço) | Nula (infraestrutura de cartório/title shop nos EUA) | 1 / 2 |
| **Propaya / Tower / LeaseWire / CleanRoll AI** | EUA (YC / PH 2026) | Due diligence & *lease abstraction* (CRE) | Extraem cláusulas de contratos comerciais e *rent rolls* para Excel/data rooms | Lançamentos 2024–2026 (CRE B2B) | Nula (foco em imóveis comerciais e fundos) | 1 / 2 |
| **Try The Apartment / FloorGen / Property Alpha** | Global (PH 2026) | Visualização 3D & matemática de investidor | Tour 3D por vídeo de celular, plantas com IA e ROI de aluguel | Lançamentos Product Hunt 2026 (`DATA GAP` tração) | Baixa (simulação espacial/ROI, sem dados municipais oficiais) | 2 |
| **Docket (Docket AI)** | Brasil (SP) | IDP / Due diligence documental B2B | Lê certidões de matrícula e documentos públicos em segundos para bancos/incorporadoras | Série B de R$ 110M (Gerdau, Inovabra, Kaszek, Canary etc.) | Nula no consumidor; B2B caro e voltado ao pós-match/crédito | 1 / 2 |
| **Matrícula Simples** | Brasil | Legaltech IA de matrículas e leilões | Traduz matrículas, ônus, editais de leilão e dados rurais (CAR/SIGEF) em minutos | SaaS/relatório (`DATA GAP` fundadores/preço/tração) | Baixa-Média no momento compra/leilão; não cobre locação, bairro nem pré-visita sem matrícula | 1 |
| **Morad.ia** (`morad.ia.br`) | Brasil | Regularização imobiliária com IA | Diagnóstico jurídico (Habite-se, averbações, matrícula) e conexão com advogados/engenheiros | SaaS/marketplace (`DATA GAP` funding) | Nula na escolha de aluguel/compra; atende proprietário regularizando imóvel | 1 |
| **Morada.ai** (MIA) | Brasil | IA conversacional para vendas | Assistente *MIA* no WhatsApp qualifica leads e simula financiamento para incorporadoras | PropTech escalada B2B (`DATA GAP` valor exato) | Nula (trabalha pelo vendedor/incorporadora) | 1 / 2 |
| **Feche Agora** (`fecheagora.xyz`) | Brasil | SaaS contratual para imobiliárias | IA lê documentos, gera minutas de compra e venda, ficha de crédito e assinatura digital | SaaS B2B (`DATA GAP` preços/tração) | Nula (etapa de fechamento comercial da imobiliária) | 1 |
| **Superlógica Nexus / Gruvi AI** | Brasil | Infraestrutura IA para administradoras | Ecossistema IA nativo lançado em ago/2026 + assistente no app Gruvi para regimentos/balancetes | Incumbente dominante B2B (Superlógica/Ahreas) | Bloqueada ao comprador externo: dados privados do condomínio ficam restritos ao síndico/morador | 1 / 2 |
| **uCondo (Móra)** | Brasil | IA condominial no WhatsApp/app | Responde moradores 24/7 sobre regimento e apoia síndico em comunicados/financeiro | Incumbente B2B SaaS (`DATA GAP` métrica isolada Móra) | Idem: jardim murado pós-mudança; inacessível antes de alugar/comprar | 1 / 2 |
| **Precios Inmuebles Plus** | Espanha/PT | Extensão Chrome (Idealista) | Injeta histórico de alterações de preço nas páginas do Idealista | ~900–950 usuários ativos; ~4,0/5 (~8 avaliações) | Análogo técnico de desktop; mostra teto baixo de adoção em extensão isolada | 1 / 3 |
| **Property Log / Property Track / Area360** | Reino Unido | Extensões Chrome (Rightmove/Zoopla) | Exibem reduções de preço, dias no mercado e preços vendidos (HM Land Registry) | *Property Log*: 2,5–3,1/5 (~150 aval.); paywall £2,99/mês | Alerta de modelo econômico: manter histórico em servidor quebrou a gratuidade e gerou rejeição | 1 / 3 |
| **Preço por m² — QuintoAndar / SureIA** | Brasil | Extensões Chrome (QuintoAndar / ZAP) | Calcula R$/m² nos cards (QuintoAndar) ou compara m² e projeta ROI (SureIA no ZAP) | Chrome Web Store (`DATA GAP` usuários exatos) | Muito superficial: só faz aritmética sobre o próprio anúncio, sem dados oficiais ou mobile | 1 |
| **carloshernanic/proximo-ap** | Brasil (GitHub) | Agente MCP/Claude Code open-source | Entrevista usuário, raspa QuintoAndar/ZAP/VivaReal, deduplica e dá nota 0–100 | Open-source dev-only (`DATA GAP` estrelas) | Conceito próximo na descoberta multi-portal, mas frágil (scraping), exige terminal/CLI e dá nota opaca | 1 |
| **Ih, Alagou** | Recife (PE) | GovTech climática (CPSI / EITA Labs) | Sensores IoT de nível de água e alertas em tempo real para Defesas Civis (Recife, Olinda, Paulista) | Fomento público / CPSI / FACEPE | Complementar (alerta B2G/Defesa Civil); não analisa imóveis, lotes DSQFL nem anúncios | 1 / 2 |
| **Manacá (SAÍRA)** | Recife (PE) | GovTech ambiental (3º Ciclo E.I.T.A! 2025) | IA, visão computacional e drones para autuar descarte irregular de lixo (drenagem urbana) | Contrato CPSI E.I.T.A! 2025 | Nula (fiscalização municipal B2G) | 2 / 3 |
| **Facilitat / Marta** | Recife (PE) | Construtech pós-obra / IA de lançamentos | *Facilitat*: manual digital pós-obra para construtoras; *Marta*: IA de marketing para lançamentos | Nascidas no Porto Digital / ecossistema UFPE (`DATA GAP` receita 2026) | Nula (ambas atendem construtoras/incorporadoras no B2B) | 1 / 2 |
| **Geopixel / Aprova Digital** | SJC (SP) / Cascavel (PR) | GovTechs municipais B2G | *Geopixel*: cadastro imobiliário multifinalitário; *Aprova*: licenciamento e alvarás digitais | B2G prefeituras (`DATA GAP` contratos PE) | Nula como concorrente (fornecem a infraestrutura de backoffice das prefeituras) | 1 |

---

## 1. Perfis e Achados por Eixo de Pesquisa `[Data]`

### 1.1. Startups de IA Lendo Atas, Balancetes, Matrículas e Contratos (2024–2026)
- **Cenário Global — Divisão entre Crédito B2B e Revisão Híbrida Humana:**
  - **Eli Report (`elireport.com` / OctoAI Technologies):** Digere pacotes *strata* (atas, orçamentos, seguros, regimentos), aponta *red flags* e opera em modelo freemium com camada especialista.
  - **CondoScan (`condoscan.ca`):** Pipeline LlamaIndex/LlamaParse, mas **impõe revisão manual humana obrigatória** + chamada 1:1 antes do relatório (**CAD $349 + GST** residencial / **CAD $500 + GST** comercial em 24h) porque IAs genéricas erram contexto contábil de reserva.
  - **Condo Check Canadá (`condo-check.com`) vs. Condo Check AI (`condocheck.ai`):** A canadense (desde 1994) faz campanha anti-IA (*"NO AI, ONLY EXPERIENCED HUMANS"*); a americana vende auditoria automatizada B2B a **US$ 70/projeto** exclusivamente para credores hipotecários.
  - **YC & Product Hunt 2024–2026:** **Propaya**, **Tower**, **LeaseWire**, **CleanRoll AI**, **RealPact** (2025, US$ 500k *pre-seed*, 25+ corretoras), **Vestris** (YC S26), **Assembly HOA** (YC S24), **Try The Apartment**, **FloorGen**, **Property Alpha**, **REI Litics** — nenhum une anúncio residencial + cadastro municipal oficial + perícia de visita presencial.
- **Cenário Brasil — Pós-Acordo e Jardins Murados:**
  - **Docket AI** (Série B R$ 110M): Foco em bancos/incorporadoras no pós-match/crédito.
  - **Matrícula Simples (`matriculasimples.com.br`):** Traduz matrículas, ônus e editais de leilão/rurais via IA (exige já ter a matrícula paga).
  - **Morad.ia (`morad.ia.br`):** Diagnóstico de regularização (Habite-se/averbações) para proprietários — não confundir com a homônima **Morada.ai** (chatbot MIA de vendas para incorporadoras).
  - **Feche Agora (`fecheagora.xyz`):** SaaS contratual B2B para imobiliárias.
  - **Superlógica Nexus / Gruvi AI (ago/2026), uCondo (Móra), TownSq, CondoConta:** Jardins murados voltados ao síndico e morador atual; quem busca imóvel não tem login.
  - **Hubs 2024–2026:** Terracotta (1.209 startups em 2024 → **1.232 em 2025**); **Cubo Legal** lançado em mar/2026 (Mattos Filho, Opice Blum, Clicksign); LelloLab (edital *Impulsiona* desde abr/2024, sem lista pública consolidada).

### 1.2. Ecossistema Local — Recife, Pernambuco e Nordeste (2024–2026)
- **E.I.T.A! Recife / CPSI & Região:** **Ih, Alagou** (IoT de nível d'água com Defesas Civis de Recife, Olinda e Paulista — complementar, não concorre com dossiê de imóvel); **Manacá — SAÍRA** (3º ciclo E.I.T.A! 2025 — drones/visão computacional contra descarte irregular de resíduos); **COE Jaboatão** (Prêmio InovaCidade 2026); editais estaduais recentes **FACEPE** set/2026 (*Pró-Startups Edital 33/2026* fases R$ 15k/30k/60k e *Desafios.Gov Edital 32/2026* até R$ 300k).
- **Claro Campus Mobile (`Smart Cities / Tecnologias Urbanas`):** **12ª ed. (mai/2024):** *Roteo* (PE, roteiros urbanos); **13ª ed. (abr/2025):** *PassaBot* (PE/SP, cotação passagens WhatsApp); **14ª ed. (jun/2026):** *Canteiro Circular* (BA, resíduos de obra); **15ª ed. (2026/2027):** inscrições até 02/11/2026. Nenhum concorrente local em dossiê habitacional pré-visita.
- **Porto Digital / UFPE / GovTechs:** **Facilitat** (pós-obra para construtoras); **Marta** (marketing de lançamentos, ex-UFPE); **Geopixel** (SJC-SP) e **Aprova Digital** (Cascavel-PR) atuam no B2G municipal.

### 1.3. Busca com IA, ChatGPT Apps, Google Maps e Guerra de Crawlers (2025–2026)
- **Zillow no ChatGPT (06/10/2025) & First Street (2025–2026):** Zillow removeu os scores climáticos da First Street em nov–dez/2025 após pressão de corretores/MLS; **MSCI comprou a First Street por US$ 120M** (jun–ago/2026). Confirma conflito de agência dos portais.
- **QuintoAndar (R$ 2 bilhões em IA) & Domi:** IA para corretores, precificação e crédito — não audita anúncios contra cadastro municipal adverso.
- **Google Maps "Ask Maps" (Gemini) & Perplexity/Cloudflare:** *Ask Maps* não tem IPTU/ITBI/DSQFL/sol 3D; Cloudflare bloqueia crawlers furtivos de IA na borda dos portais.

---

## 2. Chrome & MCP Post-Mortem (2024–2026)

### 2.1. Post-Mortem de Extensões Chrome
1. **Teto de Adoção:** *Precios Inmuebles Plus* (Idealista) estacionou em ~900–950 usuários; no Brasil, *Preço por m² — QuintoAndar* e *SureIA* fazem apenas conta local no card.
2. **Armadilha Econômica (*Property Log*, UK):** Paywall de £2,99/mês para pagar servidores de snapshot derrubou nota para **2,5–3,1/5 (~150 reviews)**.
3. **Quebra Técnica & Anti-Bot:** ZAP Imóveis migrou em 2026 para Next.js App Router (`self.__next_f`); testes documentados do VEREDA registraram **`403` e Cloudflare** em ZAP, VivaReal e OLX; Manifest V3 encerrou scripts persistentes; extensão desktop abandona a visita presencial no celular.

### 2.2. Post-Mortem de Servidores MCP (`carloshernanic/proximo-ap` e similares)
- Projetos como `HasData/zillow-mcp`, `agentic-ops/real-estate-mcp`, `luthersystems/mcp-server-buildium` e o brasileiro `carloshernanic/proximo-ap` (Claude Code CLI raspando QuintoAndar/ZAP/VivaReal com nota opaca 0–100) atingem apenas nicho dev/CLI, sofrem com bloqueios anti-bot e não possuem cadastro municipal vinculado a prédio nem perícia mobile.

---

## 3. Veredito de Espaço em Branco (White Space Verdict) `[Opinion]`

- **Superlotado:** IA para vendas, crédito, matrícula pós-venda e ERP interno de condomínio (R$ 110M–R$ 2B de capital defendendo vendedores/bancos/síndicos).
- **Tecnicamente frágil / bloqueado por incentivo:** Extensões/MCPs dependentes de scraping contínuo e scores negativos hospedados dentro de portais sustentados por corretores.
- **White Space Defensável:** **Pré-visita + Registro Oficial Vinculado ao Prédio (`DSQFL`) + Perícia Mobile em Campo + Perguntas Estruturadas (sem nota opaca 0–100)**. A barreira real é o vínculo prédio→lote→cadastro hiperlocal, o uso presencial no Modo Visita e os comparáveis reais privados, **não** "ter uma LLM".

---

## 4. Data Gaps

1. **Métricas privadas de brasileiras emergentes:** Fundadores completos, preços e receita/clientes de **Matrícula Simples**, **Morad.ia** e **Feche Agora**.
2. **Coortes nominais 2024–2026 de aceleradoras:** Lista nominal completa de selecionadas do **LelloLab**, residentes PropTech do **Cubo Itaú** e portfólio detalhado **Liga Ventures 2026**.
3. **Contagens exatas em lojas/GitHub:** Usuários ativos de *Preço por m² — QuintoAndar*, *SureIA* e estrelas/forks de `carloshernanic/proximo-ap` e outros MCPs citados.
4. **Status 2025–2026 de `Marta Inteligência Imobiliária`:** Sem divulgação pública recente de rodadas ou clientes.
5. **E.I.T.A! Recife 4º Ciclo (2026):** Nenhum edital oficial localizado até a data de corte.
6. **Receita/pricing recente de *Eli Report* e *Vestris* (YC S26).**

---

## Flags

**Red Flags:**
- **Regra Campus Mobile `11.20(iv)`:** Regulamento da 15ª edição proíbe divulgar marcas de terceiros (`OLX`, `ZAP`, `QuintoAndar`) na apresentação/vídeo — usar apenas *"portais de anúncio"* e telas próprias.
- **Fragilidade estrutural de leitura de links:** Migração do ZAP para Next.js App Router (`self.__next_f`) + Cloudflare `403` torna extratores de DOM vulneráveis a quebras frequentes; o dossiê do prédio não pode depender do link parseado perfeitamente.
- **Alucinação contextual de IA em atas (`CondoScan` / `Condo Check`):** Leitura puramente automática de PDFs financeiros/condominiais sem revisão humana ou citação estrita de fonte gera erro interpretativo grave (e contra-marketing *"NO AI"*).

**Yellow Flags:**
- **Risco de comoditização parcial via servidores MCP públicos de dados abertos:** Caso prefeituras ou terceiros publiquem MCPs sobre CSVs CKAN no futuro, o diferencial precisa estar na resolução `anúncio → edifício → DSQFL`, nos comparáveis reais do usuário e no Modo Visita em campo.
- **Homonímia de marca (`Morad.ia` vs `Morada.ai`):** Manter posicionamento editorial do VEREDA distante de termos genéricos de chatbot imobiliário ou regularização jurídica.

---

## Sources

### Tier 1 — Fontes Primárias, Oficiais, Repositórios e Evidências de Código
- `condo-check.com`, `condocheck.ai`, `condoscan.ca`, `elireport.com`, `realpact.ai`, `ycombinator.com`, `zillow.com` (app ChatGPT 06/10/2025), `msci.com`, `cloudflare.com`, `docket.com.br`, `matriculasimples.com.br`, `morad.ia.br`, `fecheagora.xyz`, `superlogica.com`, `ucondo.com.br`, `townsq.com.br`, `condoconta.com.br`, `terracotta.ventures`, `cubo.itau`, `lellolab.com.br`, `liga.ventures`, `recife.pe.gov.br`, `jaboatao.pe.gov.br`, `olinda.pe.gov.br`, `paulista.pe.gov.br`, `ufpe.br`, `cesar.org.br`, `institutoclaro.org.br` (12ª–14ª edições e Regulamento 15ª ed.), `facilitat.com.br`, `geopixel.com.br`, `aprova.com.br`, `chromewebstore.google.com`, `github.com` (`carloshernanic/proximo-ap`, `HasData/zillow-mcp`, `HasData/redfin-mcp`, `zillapi/zillow-skills`, `agentic-ops/real-estate-mcp`, `luthersystems/mcp-server-buildium`, `tae0y/real-estate-mcp`).
- Repositório local VEREDA: `README.md`, `plugins/compartilhar/coletaDaPagina.js`, `extensions/desktop/README.md`, `docs/produto/pesquisa-2026-10-20/{03,04,07}.md`, `docs/produto/{benchmark-portais-imobiliarios-2026-11-14,mapeamento-criativo-concorrentes-e-dados-2026-11-14}.md`.

### Tier 2 — Imprensa Especializada, Estudos Técnicos e Plataformas de Lançamento
- `TechCrunch` (01/12/2025, Zillow/First Street), `The Guardian`, `LA Times`, `RISMedia`, `ESG Dive`, `ESG Today`, `InfoMoney`, `IT Forum`, `Forbes Brasil`, `Estadão`, `Brazil Journal`, `Startups.com.br`, `Startupi`, `Law Innovation`, `LexLegal`, `Imobi Report`, `SíndicoNet`, `Exame`, `LlamaIndex`, `Calgary.tech`, `Product Hunt`, `Folha de Pernambuco`, `Movimento Econômico`, `Mobile Time`, `Projeto Draft`, `MundoGEO`, `Agência Sebrae`.

### Tier 3 — Comunidade, Agregadores e Fontes Terceiras
- `Reddit`, `The Negotiator`, `chrome-stats.com`, `apify.com`, `FalaPE`, `Impacta Nordeste`, `Fique Sabendo PE`, `PitchBook` / `Tracxn` / `MCPMarket`.
