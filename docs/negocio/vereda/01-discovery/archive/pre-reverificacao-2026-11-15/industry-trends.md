# Tendências de Indústria, Riscos Tecnológicos & Regulação — VEREDA

**Phase:** 3 — Market Research (Síntese)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** High *(capital, regulação vigente e bloqueios técnicos verificados)* | **Medium** *(custos estimados de compliance, regulamentação futura `PL 2338/2023` e abertura prática do `CIB`)*

> **Síntese Executiva:** Entre 2024 e 2026, o mercado de PropTech bifurcou entre **infraestrutura agêntica cara para bancos/portais/síndicos** (`US$ 16,7B` VC global em 2025; `QuintoAndar R$ 2B` em `jun/2026`; `Superlógica Nexus` em `ago/2026`; `MSCI` comprando `First Street` por `US$ 120–122,6M` em `ago/2026`) `[Data]` e a **morte ou comoditização de apps B2C de score/IA pura** (`Localize.city` encerrada em `ago/2024` `[Data — >18m]`; `Zillow` removendo scores em `nov/2025` `[Data]`; `Eli Report` virando Freemium em `out/2024` `[Data — >18m]`; ações estaduais nos EUA em `ago–out/2026` `[Data]`). No Brasil, **`CIB` (`LC 214/2025`, `IN RFB 2.275/2025`)**, **`STF Tema 987/533`**, **`LGPD`** e o **bloqueio da API `DataJud`** redefinem o que um app enxuto pode automatizar vs. o que exige revisão humana `[Opinion]`.

---

## 1. Dinâmica de Capital & Movimentos de Plataforma (2024–2026)

**Confiança da Seção:** Alta (registros CRETI, Form 10-Q, comunicados e marcos do setor BR); Média para datas de aportes privados não divulgadas.

- **Contração no Seed apesar do pico em IA/Crédito:** O VC global em PropTech saltou de **`US$ 8,0B` (2024 `[>18m]`)** para **`US$ 16,7B` (2025, `+67,9%`)**, somando **`US$ 4,53B` no 1S26** e **`US$ 2,21B` no 3T26** — com **`58%` concentrado em 7 mega-deals** e queda de **`-30% a -40%` nos deals Seed** frente ao pico `[Data]`. PropTechs nativas de IA crescem **`~42%/ano` vs. `~24%`** das legadas `[Estimate — estudo setorial CRETI]`.
- **Mapa brasileiro de capital (`Terracotta`: `1.209` startups em 2024 `[>18m]` → `1.232` em 2025)** `[Data]`:
  - **Transacional/Portais:** `QuintoAndar` anunciou **`R$ 2B` em IA (`jun/2026`)** + `Domi`; `OLX/ZAP` (`~R$ 500–600M/ano`, `~70%` do tráfego imobiliário BR `[Estimate]`) cortou integrações externas (`abr/2024 [>18m]`), padronizou `VRSync` (`out/2024 [>18m]`) e endureceu ToS anti-scraping (`fev/2025 [>18m]`) `[Data]`.
  - **Condomínios (ERPs murados):** `Superlógica + Ahreas` (`>130k` condomínios; aporte `R$ 450M` Warburg `[Data — data do aporte: DATA GAP]`; `Gruvi AI`; `Nexus` em `ago/2026`); `uCondo` (`Móra AI` grátis no WhatsApp, `2025–2026`); `Lello + Hubert` (`set/2024 [>18m]`, `>4,2k` condomínios); `CondoConta` (`Série A US$ 13,2M` `[Data — data: DATA GAP]`); `TownSq` (adquirida pela `HOAM Ventures` `[Data — data: DATA GAP]`).
  - **Legaltech & *Buy-Side*:** `Docket` (`R$ 144–145M`, Série A `2020` + Série B `dez/2022` `[Data — >18m]`); `MySide` (`R$ 12M` Seed em `jul/2025`); `Cubo Legal` (`mar/2026`) `[Data]`.
- **Precedente crítico de distribuição (`Zillow → MSCI / First Street`):** Após pressão da *CRMLS*, a **Zillow removeu escores climáticos em `nov/2025`** `[Data]`; depois a **MSCI comprou a First Street (`jun–ago/2026`) por `US$ 120–122,6M` líquidos + até `US$ 130M` earn-out** `[Data]`. Igualmente, a **Rightmove comprou a `HomeViews` por `£8M` (`fev/2024 [>18m]`)** para monetização B2B `[Data]`.

---

## 2. Vetores Tecnológicos, Fontes Públicas & Riscos de Obsolescência

**Confiança da Seção:** Alta (repositórios, APIs oficiais e normativos); Média para cobertura prática do `SPUNet` fora das capitais.

1. **Anti-Bot em Portais & Obsolescência de Scraping:** `ZAP` migrou em 2026 para Next.js App Router (`self.__next_f`), e `QuintoAndar` / `OLX` / `VivaReal` retornaram `403`/Cloudflare em testes do repositório `[Data — auditoria interna]`. Fluxo central dependente de extração de links de portais quebrará recorrentemente `[Opinion]`.
2. **Cadastro Nacional — o que funciona vs. o que trava:**
   - **Avanço (`ONR / SIG-RI` + `CIB` + `SPUNet`):** O `Provimento CNJ 195/2025` instituiu o `SIG-RI` e o Mapa do Registro `[Data]`; o **`CIB` (`LC 214/2025` / `IN RFB 2.275/2025`)** integra capitais a partir de `jan/2026` e demais municípios até `dez/2026` `[Data]` — identificador único futuro análogo à "placa" da *Olho no Carro*, ainda sem API privada `[Opinion]`. A **`SPUNet/INDE`** já oferece camada federal única de Terrenos de Marinha (`500k–600k` imóveis) `[Data]`.
   - **Bloqueios:** API pública do `DataJud` **não busca por CPF/CNPJ ou nome** (LGPD) `[Data]`; `5 de 7` capitais fecham microdados de IPTU/ITBI/alvará `[Data]`; em Recife convivem fontes defasadas (`Emlurb ago/2022 [>18m]`, `ITEP 2007 [>18m]`, `Censo 2022 [>18m]`, `ITBI 1T24–1T25 [>18m]`) e `62,6%` dos prédios-caixão metropolitanos ficam fora da capital sem portais abertos (`Olinda 129`, `Jaboatão 81`, `Paulista 60` — `DATA GAP`) `[Data]`.
3. **Limites da IA em Imóveis:** LLMs gratuitas (`ChatGPT`, `Gemini`, `uCondo Móra`) zeram o valor de "resumir PDF limpo" `[Opinion]`, enquanto documentos cartoriais escaneados induzem alucinações — justificando revisão humana + citação literal de página (`CondoScan`, `Condo Check`, `Rec. CFOAB 001/2024`) `[Data]`.
4. **Busca em 2026 (`AI Overviews`):** Com `47%–48%` das buscas exibindo respostas de IA (`-58% a -61%` CTR — Ahrefs/Seer `[Data]`), tráfego orgânico informativo genérico encolhe; sobrevivem bases proprietárias por entidade (`DSQFL`/prédio) e calculadoras `[Opinion]`.

---

## 3. Marco Regulatório & Custo de Conformidade (Brasil 2025–2026)

**Confiança da Seção:** Alta para textos legais, jurisprudência e pareceres fazendários; Média para custos de compliance (estimativa interna não corroborada por orçamento jurídico).

| Eixo Legal / Normativo | Status Verificado (Nov/2026) | Impacto Prático Obrigatório para o VEREDA | Grau |
| :--- | :--- | :--- | :---: |
| **CRECI / Avaliação (`Lei 6.530/78`, `Res. 1.066/2007`, `Res. 1.551/2025`)** | `Res. 1.551/2025` anulada em `out/2025` (`TRF-1`); seguem vedados PTAM ("preço justo") e divisão de comissão sem CRECI. | Proibir *"preço justo"*, *"laudo avaliativo"* e cobrança ligada a fechamento de venda. | `[Data]` |
| **Scores & Dano Moral PJ (`Súmula 227 STJ`, `REsp 1.736.593/SP`, EUA `ago–out/2026`)** | Incorporadoras/imobiliárias podem pleitear dano moral (condomínios não); AGs de NE e FL processaram a First Street. | **Zero notas (`0–100`), selos ou vereditos**; exibir só dado primário datado + pergunta ao vendedor/síndico. | `[Data]` |
| **UGC & Responsabilidade (`STF Tema 987/533`, `CDC art. 14 / 51 I`)** | `STF` (`jun/2025–jun/2026`) limitou imunidade do art. 19 MCI; `CDC` vale até em app grátis. | Evitar *Give-to-Get* anônimo opinativo; remoção rápida de conteúdo ofensivo sem lastro. | `[Data]` |
| **LGPD / IA (`ANPD`, `Res. 2/2022`, `Res. 18/2024`, `NT 12/2025`, `PL 2338/2023`)** | Pequeno porte tem isenção parcial de DPO **salvo alto risco em IA**; sanção Meta (`jul/2024 [>18m]`). | *Scrub* de PII em atas, opt-out de treino em LLMs externas, retenção enxuta. Compliance enxuto Ano 1 `~R$ 8,2k–22,3k` vs. pleno `R$ 35k–116k+`. | `[Data]` / `[Estimate]` |
| **ODbL (`1.0 §§ 4.3–4.5`) & Lojas (`Apple/Google`)** | ODbL exige isolar base *Collective* vs. *Produced Work*; Apple cobra `15%–25%` em IAP e `10%–15%` em *external link* + `§5.2.2`. | Isolar camadas OSM/ODbL; operar **Web-First + Pix-First**. | `[Data]` |
| **Tributação & Profissões (`COSIT 72/2020`, `OAB 205/2021`, `CMN 3.954/2011`, Simples `Fator R`)** | Repassar emolumento sem mandato bitributa; OAB veta *lead fee*; CMN veta cobrar do mutuário; `Fator R <28%` → Anexo V `15,5%` vs. Anexo III `6%`. | Desacoplar custas cartoriais do `V2`, licença fixa B2B sem *success fee*, **planejar margens no Anexo V até estruturar `Fator R >= 28%`**. | `[Data]` |

---

## 4. Conexões Estratégicas

1. **Com [market-analysis.md](../../market-analysis.md):** O `CIB` (`2026–2027`) pode, no médio prazo, suprir o identificador único que falta ao imóvel; até lá, `SPUNet/INDE` permite escalar `V2` litorâneo — com cobertura fora das capitais ainda não medida `[Opinion]`.
2. **Com [competitor-landscape.md](../../competitor-landscape.md):** A reação da `CRMLS` na Zillow (`nov/2025`) e as ações de `2026` contra a First Street indicam que **score público de risco** é risco regulatório e comercial simultâneo `[Opinion]`.
3. **Com [target-audience.md](../../target-audience.md):** Queda de CTR por `AI Overviews` e gratuidade de `Móra AI`/`ChatGPT` favorecem **B2B2C + SEO de entidade + curadoria humana `V2`** — hipótese de canal ainda dependente da Fase 3.7 `[Opinion]`.

---

## 5. Data Gaps

1. **Abertura prática do `CIB` e `SIG-RI` ao setor privado:** Normativos publicados, sem data de API aberta por imóvel.
2. **Regulamentação final do `PL 2338/2023` e `NT 12/2025` (ANPD):** Classificação de IA imobiliária como "alto risco" ainda incerta.
3. **Retenção/receita isoladas de `Superlógica Nexus` e `uCondo Móra AI`; datas exatas dos aportes `Superlógica/Warburg`, `CondoConta` e aquisição `TownSq/HOAM`.**
4. **Alternativas viáveis ao `DataJud` para consulta processual por CNPJ dentro da LGPD (custo de legaltechs/certidões por caso).**
5. **Taxa de pareamento endereço → Terreno de Marinha no `SPUNet/INDE` fora das capitais** (Santos, Florianópolis, Baixada).
6. **Orçamento jurídico real de compliance** (faixas `R$ 8,2k–22,3k` / `R$ 35k–116k+` são estimativas internas).

---

## Flags

**Red Flags:**
- **Proibição prática de scores, selos e "preço justo":** `Súmula 227 STJ`, `Lei 6.530/78`, `CDC` e precedentes First Street (`ago–out/2026`).
- **Bloqueio `DataJud` por CPF/CNPJ:** Impede checagem processual automática gratuita de condomínio/vendedor.
- **Compliance pleno para B2B+UGC+IA (`R$ 35k–116k+` estimado):** Exige MVP enxuto (sem UGC anônimo, sem notas algorítmicas) até validar receita.

**Yellow Flags:**
- **Dados do Recife `>18m` (`Emlurb ago/2022`, `ITEP 2007`, `Censo 2022`):** Exigem timestamp visível e remoção de promessas sem lastro.
- **Regime tributário inicial (`Simples Anexo V 15,5%`):** Comprime margens até estruturar `Fator R >= 28%`.
- **Dependência residual de portais (`403`/Next.js):** Desacoplar a jornada do *parse* automático de links (entrada por endereço/edifício/PDF).
- **`PL 2338/2023` & `ANPD IA`:** Pode elevar exigência de transparência/DPO — mitigável com evidência factual + revisão humana.

---

## Sources

### Tier 1 — Legislação, Tribunais, Reguladores & Filings Oficiais
- `LC 214/2025`, `IN RFB 2.275/2025` (`CIB`), `SC COSIT 72/2020`, `LC 123/2006` (Simples/Fator R), `Provimento CNJ 195/2025` (`SIG-RI / ONR`), `DataJud/CNJ` (política LGPD), `SPUNet / INDE`, `Lei 6.530/78`, `Res. COFECI 1.066/2007` & `1.551/2025` (`TRF-1 out/2025`), `LGPD` (`Res. ANPD 2/2022`, `18/2024`, `NT 12/2025`, sanção Meta `jul/2024 [>18m]`), `CDC`, `STF Tema 987/533`, `STJ REsp 1.736.593/SP`, `Súmula 227 STJ`, `PL 2338/2023`, `ODbL 1.0 §§ 4.3–4.5`, `Provimento OAB 205/2021`, `Rec. CFOAB 001/2024`, `Res. CMN 3.954/2011`.
- `MSCI Form 10-Q` (`ago/2026`), `Rightmove Investor Relations` (`fev/2024 [>18m]`), `Apple Review Guidelines` (`5.2 / 3.1.1`), ações dos AGs de Nebraska/Flórida (`ago–out/2026`).
- Bases municipais: `Emlurb (ago/2022 [>18m])`, `ITEP (2007 [>18m])`, `IBGE Censo 2022 [>18m]`, `Sefin 1T24–1T25 [>18m]`.

### Tier 2 — Relatórios de VC, Estudos Setoriais, Imprensa & Sites Corporativos
- `CRETI` (`2024 [>18m]`, `2025`, `1S26`, `3T26`), `Terracotta Ventures` (`2024 [>18m]–2025`), `ABECIP`, `TechCrunch` (`dez/2025`), `Exame`, `SíndicoNet`, `InfoMoney`, `Finsiders Brasil`, `Ahrefs`, `Seer Interactive`, sites corporativos (`QuintoAndar`, `Superlógica`, `uCondo`).

### Tier 3 — Estimativas Não Oficiais
- Estimativas de custo de compliance (`MVP lean vs. full`) compiladas a partir de blogs jurídicos e tabelas de mercado.

### Auditoria Interna do Repositório `veredas/` *(não confundir com validação externa)*
- Testes técnicos de portais (`ZAP Next.js self.__next_f`, bloqueios `403`/Cloudflare).
