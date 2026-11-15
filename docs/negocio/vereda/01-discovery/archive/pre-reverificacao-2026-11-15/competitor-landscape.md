# Panorama Competitivo — VEREDA (Brasil & Benchmarks Globais)

**Phase:** 3 — Market Research (Síntese)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** High *(concorrentes globais, incumbentes e regras de plataforma)* | **Medium** *(startups privadas BR sem balanço e defensibilidade futura contra MCPs)*

> **Síntese Executiva:** O maior concorrente do VEREDA não é outra startup — é a **gambiarra gratuita de custo `R$ 0`** (`Google Maps` + `porteiro` + `WhatsApp` + `ChatGPT/Gemini/Móra AI` lendo PDF) `[Opinion]`. Entre incumbentes e emergentes, **`R$ 110M–R$ 2B` em capital** concentra-se no lado vendedor, bancário ou administrativo (`QuintoAndar`, `Grupo OLX`, `Superlógica Nexus`, `Docket`) `[Data]`, deixando um **espaço em branco na decisão pré-contratual de imóveis usados e locação**. Contudo, **duas falências históricas (`Localize.city` com `US$ 70M` encerrada em `ago/2024` `[Data — >18m]` e `Já Morei` `2014` no Brasil `[Data — >18m]`)** somadas à **comoditização da IA pura (`Eli Report` migrado para Freemium em `out/2024` `[Data — >18m]` vs. `CondoScan` a `CAD $349` `[Data]` com revisão humana)** mostram que **extrator automático de PDF ou mapa B2C barato não fecha a conta sozinho** `[Opinion]`.

---

## 1. Concorrentes Diretos, Indiretos & Post-Mortems Críticos

**Confiança da Seção:** Alta *(perfis operacionais, preços públicos e desfechos históricos)*; Média *(startups privadas brasileiras sem receita auditada: `Morei Aqui`, `BetterPlace`, `Matrícula Simples`)*.

| Player / Benchmark | Categoria & Alcance | Recife? | Profundidade Urbana & Condominial | Preço & Quem Paga | Lição / Risco Crítico p/ VEREDA | Grau |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **Gabarito Gratuito (`Maps + Porteiro + ChatGPT/Gemini`)** | Status quo dominante (BR) | Sim (`100%`) | Street View seco; porteiro informal; LLM lê PDF limpo grátis *(falha em ata sonegada, carimbo antigo e maré/sol 3D/marinha)* | **`R$ 0`** (ou `R$ 25–115/mês` ChatGPT/Gemini Plus) | **Vender "resumo de ata por IA" é morte certa**; valor exige acesso + contexto territorial + campo | `[Data]` / `[Opinion]` |
| **QuintoAndar / Grupo OLX (ZAP, VivaReal)** | Portais & IA (`R$ 2B` IA QA `2026`; `OLX R$ 500–600M/ano`) | Sim | IA de preço/atendimento (`QPreço`, `Domi`, `ZAPway+`); **omitem taxas/riscos** (`25%–40%` estoque duplicado/fantasma) | Comissão locação/venda ou plano Canal Pro | **Zillow removeu First Street (`nov/2025`)** após pressão de corretores; portais não podem ser adversariais; **`403`/Cloudflare** trava scraping | `[Data]` |
| **Superlógica (+Ahreas) / uCondo** | ERPs condominiais (`>130k` conds. / `6,3M` u.h.; `Nexus ago/2026`; `Móra AI`) | Sim (B2B síndicos) | **`Móra AI` resume balancetes de graça no WhatsApp**; acesso travado atrás de login do morador/síndico | B2B SaaS / *Embedded Finance* (síndico/administradora) | Jardim murado por LGPD e veto de síndico — inacessível pré-proposta | `[Data]` |
| **Morei Aqui** (`moreiaqui.com.br`) | Reviews de locação (RJ/SP/PR/SC) | **Não** | Só relato subjetivo moderado; zero dados urbanos ou documentos | **`R$ 0`** (receita ativa: `DATA GAP`) | Sem massa crítica no prédio (*cold-start*), busca em Recife retorna vazia | `[Data]` |
| **Já Morei** (`jamorei.com`, `2014 [>18m]`) | Post-mortem BR de reviews | Histórico | Zero camada oficial; tentou gamificação voluntária | **`R$ 0`** (tentou Ads — **fracassou**) | **Prova brasileira:** portal B2C gratuito de reviews monetizado por Ads quebra em busca episódica | `[Data]` / `[Opinion]` |
| **MySide** (`myside.com.br`) | Assessoria *Buy-Side* (`Seed R$ 12M`; `VGV R$ 350M` 2024 `[>18m]`) | **Só SEO** *(op. local `DATA GAP`)* | Rankings macro por bairro; foca **100% em lançamentos novos** | **`~4,5%–5%` VGV** pago pela incorporadora (`R$ 31,5k–35k` em `R$ 700k`; **`R$ 0` p/ cliente**) | Tem **`~724x–805x` mais margem** que passe `V1` Pix (`~R$ 43,50`, ou `~790x` sobre loja `R$ 39,91`) vs. `~226x–291x` sobre `V2 B1`; cega p/ **usados/aluguel** | `[Data]` / `[Estimate]` |
| **Openigloo / IglooIQ** (`2020 [>18m]`, NYC) | Reviews + dados NYC + B2B landlord | Não (EUA) | Funde HPD/311 + relatos; pivotou p/ **IglooIQ** (`US$ 10–50/mês` B2B p/ responder reviews) | `US$ 14,99–34,99` *in-app* + B2B *landlord* | **Alerta ético:** monetizar controle de resposta p/ *landlord* destruiu confiança no Reddit; crítica contra paywall em dado público | `[Data]` / `[Opinion]` |
| **Eli Report / CondoScan / CondoCheck** | Diligência condominial IA vs. Humana (CA/EUA) | Não | Atas, reserva e orçamentos (`>25 mil` relatórios Eli; `CondoCheck` desde `1994 [>18m]`) | **Eli:** Freemium (`out/2024 [>18m]`) \| **Scan/Check:** **`CAD $349–475`** | **Padrão ouro de pricing:** IA pura virou isca Freemium; comprador paga alto (`CAD $349+`) por **analista humano + call 24h** | `[Data]` / `[Opinion]` |
| **Localize.city** (`fechou ago/2024 [>18m]`, EUA) | Inteligência micro-urbana (`US$ 70M` VC) | Não | `30+` camadas (obstrução de sol, alvarás, ruído) | B2C / corretagem — **encerrou operações EUA** | **Maior alerta existencial:** dado micro-urbano caro sem receita recorrente/ticket alto morre em juros altos | `[Data]` / `[Opinion]` |
| **Bairro Real / BetterPlace / Bom de Morar** | Comparadores de bairro (`SP` / macro BR) | Só macro (`Bom de Morar`) | Dados macro de bairro (`Bairro Real abr/2024 [>18m]`); `BetterPlace` agrega portais SP | **`R$ 0`** / Freemium (`Plano Básico`) | Reforçam expectativa de gratuidade; `BetterPlace` tem risco de ToS de portais | `[Data]` |
| **Docket / Matrícula Simples / Certidão na Mão** | Legaltech & despachantes (`Docket R$ 144–145M [2020/dez-2022 >18m]`) | Nacional (pós-escolha) | Certidões/matrículas/leilões; despachantes `R$ 139,90–300+` a `R$ 500–1.500` | Enterprise B2B / avulso pós-proposta | Operam **depois** da escolha; sem atas, balancetes nem microclima | `[Data]` |
| **Mapa Sossego** (`mapasossego.com.br`) | Ruído urbano OSM + Censo (`0–100`) | Sim | Índice teórico estático de ruído dia/noite sem LUSE | **`R$ 0`** (sem cadastro) | Concorrente gratuito pontual em ruído com SEO forte; sem contexto integrado | `[Data]` |
| **Olho no Carro** (`olhonocarro.com.br`) | Consulta veicular B2C (`R$ 2M→20M 2021–23 [>18m]`) | Nacional | Histórico nacional padronizado por **placa única** | **`R$ 64,90`** por dossiê | Valida WTP anti-prejuízo via criadores/afiliado Pix; **porém** imóvel não tem placa pública padronizada hoje | `[Data]` / `[Opinion]` |

---

## 2. Emergentes, Extensões Chrome, MCPs & Risco de Plataforma (2024–2026)

**Confiança da Seção:** Alta para registros em lojas, GitHub, YC, editais locais e testes técnicos internos; Média para tração de projetos recentes.

1. **Extensões Chrome, Apps Freemium & Servidores MCP não sustentam negócio B2C isolado:** Extensões de histórico de preço em portais bateram em teto micro (*Precios Inmuebles Plus* com `~900–950` usuários ativos; *Property Log* caiu para nota `2,5–3,1/5` ao cobrar `£2,99/mês`) `[Data]`. Ademais, em apps *freemium* no mundo, a mediana global de conversão de download para pagante é de apenas **`2,1%` (`RevenueCat 2025–2026` `[Data]`)**, tornando inviável pagar aquisição móvel para ticket baixo `[Opinion]`. No Brasil, *Preço por m² — QuintoAndar*, *SureIA* e o MCP `carloshernanic/proximo-ap` sofrem bloqueio de portais: **`ZAP` migrou em 2026 para Next.js App Router (`self.__next_f`)** e testes locais do VEREDA registraram **`403` e Cloudflare (`Attention Required!`)** `[Data]`. Extensão desktop também abandona a visita presencial no celular `[Opinion]`.
2. **Muralha Anti-Alucinação & Risco de Homonímia:** Emergentes americanos (`Vestris` YC S26, `RealPact` `US$ 500k`, `Assembly HOA` YC S24, `Condo Check AI` `US$ 70`/projeto para credores) focam corretores, bancos e síndicos `[Data]`. Já a canadense `CondoScan` (LlamaIndex) impôs **revisão humana obrigatória em 24h** e a `Condo Check` (`1994 [>18m]`) promove *"NO AI, ONLY EXPERIENCED HUMANS"* `[Data]`. No Brasil, surgiram `Matrícula Simples` (matrículas/leilões), `Feche Agora` (contratos B2B) e `Morad.ia` (`morad.ia.br`, regularização pós-obra) — que exige cuidado nominal frente à homônima **`Morada.ai`** (chatbot `MIA` comercial para incorporadoras) `[Data]`.
3. **Ecossistema Local Recife / PE e Edital Campus Mobile:** Premiados no `E.I.T.A! Recife` (*Ih, Alagou* IoT Defesa Civil; *Manacá/SAÍRA* 2025 drones), Porto Digital (*Facilitat*, *Marta*) e `Claro Campus Mobile` (*Roteo* `mai/2024 [>18m]`, *PassaBot* `abr/2025 [>18m]`, *Canteiro Circular* `jun/2026`) **não cobrem dossiê habitacional pré-visita** `[Data]`. **Regra crítica do edital 15ª ed. (`cláusula 11.20(iv)`):** proibido mencionar marcas de portais terceiros (`ZAP`, `OLX`, `QuintoAndar`) no pitch/vídeo `[Data]`.
4. **Exits Estratégicos Confirmam Valor do Dado Proprietário em B2B:** `Rightmove` comprou a `HomeViews` por **`£8 milhões` (`fev/2024 [>18m]`, `£1,3M` receita)** `[Data]`; `MSCI` comprou a `First Street` por **`US$ 120–122,6 milhões` líquidos + até `US$ 130M` earn-out (`jun–ago/2026`)** após a Zillow expulsar scores climáticos B2C `[Data]`.

---

## 3. Veredito de Espaço em Branco (*White Space*) & Defensibilidade

**Confiança da Seção:** Alta para mapeamento das lacunas atuais; Média quanto à defensibilidade futura caso terceiros publiquem MCPs sobre dados abertos municipais.

- **Superlotado & Indefensável para o VEREDA:** (i) Chat/resumo genérico de PDF (`ChatGPT`, `Gemini`, `uCondo Móra AI`); (ii) Comparador B2C barato de mapa/bairro via Ads (`Já Morei`, `Localize.city`); (iii) Ferramenta de scraping contínuo de portais (`403`/ToS/Next.js).
- **Espaço em Branco Defensável (`V2` + `B2B2C`):**
  1. **Momento pré-sinal / pré-leilão em usados & Terreno de Marinha:** Onde `QuintoAndar`, `ZAP` e `MySide` (`~70%` crédito SBPE em usados vs. `71%–77%` na compra geral em estudos setoriais `[Data]`) têm conflito econômico ou ausência comercial, e erros custam **`5%` de laudêmio**, **cota extra oculta** ou **prédio-caixão sem seguro** `[Data]`.
  2. **Camada híbrida IA + Curadoria Humana + Citação de Página:** O comprador e o advogado/vistoriador pagam por **responsabilidade auditável (`CAD $349` `[Data]` / `R$ 199–349` `[Estimate]`)**, não por resumo bruto de IA `[Opinion]`.
  3. **Dados hiperlocais em campo (`Modo Visita` + resolução `Edifício → DSQFL`):** Mantém o `V1` (`1 Free-Look` gratuito + passes opcionais) como isca SEO e gera fosso defensável contra futuros MCPs abertos `[Opinion]`.

---

## 4. Conexões Estratégicas

1. **Com [market-analysis.md](../../market-analysis.md):** A falha histórica da `Localize.city` (`US$ 70M`) e o *pivot* freemium da `Eli Report` reforçam a inviabilidade CAC do `V1` (`R$ 12,92–14,50` vs. `R$ 100–750+`) — porém o paralelo financeiro com `Eli Report` / `CondoScan` baseia-se em analogia externa, carecendo validação local na Fase 3.7 `[Opinion]`.
2. **Com [target-audience.md](../../target-audience.md):** O conflito econômico de `QuintoAndar`/`ZAP`/`MySide` deixa desassistido quem negocia usados e locação residencial, abrindo espaço direto para aliança com advogados `OAB-PE`, engenheiros `IBAPE-PE` e auditores `CRC-PE`.
3. **Com [industry-trends.md](../../industry-trends.md):** O aporte de `R$ 2B` em IA do QuintoAndar e o `Superlógica Nexus` blindam busca conversacional e gestão interna, validando a escolha pelo nicho pré-contratual independente.

---

## 5. Data Gaps

1. **Métricas fechadas de startups brasileiras privadas:** Receita, CAC, churn e base de clientes de `Morei Aqui`, `BetterPlace`, `Matrícula Simples`, `Morad.ia`, `Feche Agora` e `Marta`.
2. **Presença física da `MySide` no Recife (`2026`):** Confirmado SEO editorial local de bairros; `DATA GAP` para escritório físico ou *Personal Shoppers* presenciais em PE.
3. **Granularidade real do `QPreço` no Recife e tração exata das extensões/MCPs BR:** Usuários ativos em `SureIA`, `Preço por m²` e adoção real de ChatGPT/Gemini em PDFs por buscadores do Recife.
4. **Coortes e balanços recentes:** Lista nominal de aceleradas `LelloLab`/`Cubo`/`Liga 2026`, faturamento/volume de relatórios da `CondoScan`/`Condo Check`, `Eli Report` pós-out/2024 e data de encerramento formal da `Já Morei`.

---

## Flags

**Red Flags:**
- **Duplo Precedente de Morte (`Localize.city ago/2024 [>18m]` e `Já Morei 2014 [>18m]`):** Micro-dados urbanos ou reviews sem monetização transacional robusta ou B2B quebraram nos EUA e no Brasil.
- **Substituição imediata pela tríade gratuita (`ChatGPT + Móra AI + Mapa Sossego`):** Se o produto parecer apenas "resumo de ata + índice de ruído", o usuário não paga `R$ 49,90`.
- **Bloqueio técnico/regulatório (`403` Cloudflare, ZAP Next.js 2026, Apple `§5.2.2`, Campus Mobile `11.20(iv)`):** Scraping em servidor quebra e citar portais no edital arrisca desclassificação.

**Yellow Flags:**
- **Competição assimétrica SEO (`MySide` `~724x–805x` margem sobre `V1` Pix) + `Mapa Sossego` grátis:** Obriga focar cauda longa por edifício e risco pré-contrato (`Terreno de Marinha`, `obras 150 m`, `ata/balancete`).
- **Armadilha de neutralidade (`Openigloo/IglooIQ`):** Monetizar edição/resposta para o *sell-side* destrói confiança.
- **Risco de homonímia (`Morad.ia` vs. `Morada.ai`):** Manter marca e posicionamento editorial distantes de chatbots de incorporadora.

---

## Sources

### Tier 1 — Órgãos Reguladores, Lojas Oficiais, Filings Financeiros & Registros
- `Apple App Store` (`Openigloo IAPs` & `Review Guidelines §5.2.2`), `Instituto Claro` (`Regulamento Campus Mobile 15ª ed. cláusula 11.20(iv)`), `Rightmove RI` (`HomeViews £8M fev/2024 [>18m]`), `MSCI Inc. Form 10-Q` (`First Street ago/2026`), `Receita Federal / Registros Empresariais` (`CNPJ 18.359.366/0001-17 Certidão na Mão`, `CNPJ 54.750.249/0001-43 Bairro Real`).

### Tier 2 — Sites Comerciais de Players, Imprensa Econômica & Benchmarks de App
- Websites & comunicados oficiais de concorrentes: `moreiaqui.com.br`, `myside.com.br`, `docket.com.br`, `certidaonamao.com.br`, `bairroreal.com.br`, `betterplace.com.br`, `mapasossego.com.br`, `olhonocarro.com.br`, `serasa.com.br`, `openigloo.com`, `iglooiq.com`, `elireport.com`, `condoscan.ca`, `condo-check.com`, `condocheck.ai`, `ycombinator.com` (`Assembly HOA`, `RealPact`, `Vestris`), `QuintoAndar` (`Termos jan/2026; R$ 2B IA jun/2026`), `Grupo OLX / Canal Pro` (`corte abr/2024 [>18m]; VRSync out/2024 [>18m]; Termos fev/2025 [>18m]`), `Superlógica` (`Gruvi AI; Nexus ago/2026`), `uCondo` (`Móra AI`), `matriculasimples.com.br`, `fecheagora.xyz`, `morad.ia.br`.
- Imprensa & dados de app: `TechCrunch` (`dez/2025`), `The Real Deal` (`ago/2024 [>18m]`), `Estadão` (`out/2014 [>18m]`), `Exame` (`2021–2023 [>18m]`), `Finsiders Brasil`, `Startups.com.br`, `ImobiReport`, `SíndicoNet`, `InfoMoney`, `Forbes Brasil`, `PitchBook`, `Tracxn`, `PRWeb`, `RevenueCat` (`CVR freemium 2,1%`), `Ahrefs` (`-58%` CTR).

### Tier 3 — Comunidades, Repositórios Abertos & Agências
- `GitHub` (`carloshernanic/proximo-ap`), `Reddit` (`r/Recife`, `r/NYCapartments`, `r/Brooklyn`), `TabNews` (`bomdemorar.com`), `Trustindex`, `RD Station`, `Ignite Marketing`, `Altavance`, `Leadster`.

### Auditoria Interna do Repositório `veredas/` *(evidência técnica local)*
- Testes documentados `403` / Cloudflare (`Attention Required!`), inspeção DOM `ZAP Next.js self.__next_f` e auditoria `benchmark-portais-imobiliarios-2026-11-14`.
