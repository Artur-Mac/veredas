# Dashboard de Confiança, Evidências & Riscos Críticos — VEREDA

**Phase:** 3 — Market Research (Síntese)
**Project:** vereda
**Date:** 2026-11-15
**Confidence:** High *(para diagnóstico macro/regulatório/unitário)* | **Low** *(para demanda paga validada em campo)*

> **Síntese Executiva:** A pesquisa combinada em **4 ondas (`15` agentes especializados)** estabelece com **alta confiança** que a tese original (`V1` passe B2C `R$ 49,90` com escala nacional via dados abertos) **não se sustenta financeiramente nem tecnicamente** `[Opinion]`. Em contrapartida, existe uma oportunidade concreta de **confiança média-alta** centrada em **`V2` Anti-Cilada Pré-Contrato (`R$ 199–349`) + `B2B2C Buy-Side` (`OAB-PE`, `IBAPE-PE`, `CRC-PE`, `CRECI-PE`, `CCA`) + `SPUNet`**, cuja viabilidade final depende **100% da Fase 3.7 (Descoberta com Clientes Reais)**, hoje zerada (`G-USER = 0`) `[Data]`.

---

## 1. Painel Consolidado de Confiança por Eixo de Pesquisa

**Confiança da Seção:** Alta (consolidação direta das 4 ondas e auditoria de evidências).

| Domínio Avaliado | Documento-Base | Grau de Confiança | Base Probatória Principal | Principal Risco de Fragilidade |
| :--- | :--- | :---: | :--- | :--- |
| **Tamanho de Mercado (`TAM/SAM`) & Macro** | [market-analysis.md](../../market-analysis.md) | **Alta** *(Macro)* / **Média** *(SOM)* | IBGE PNAD `23,8%`, Censo 2022 `[>18m]`, CBIC, ABECIP, FipeZAP `set/2026`, ONR, uCondo Censo. | Elasticidade de preço B2C/B2B2C em Recife não testada (`SOM` é estimativa). |
| **Economia Unitária, Tributos & Gateways** | [market-analysis.md](../../market-analysis.md) | **Alta** *(Custos/Taxas)* / **Média** *(CVR)* | Simples `Fator R`, `SC COSIT 72/2020`, `Apple×CADE`, `AbacatePay/MP`, benchmarks Meta/Google BR, código `Carteira.tsx`. | Taxas reais de conversão (`CVR`) e tempo humano de revisão `V2` são estimados. |
| **Expansão Geográfica & Dados Públicos** | [market-analysis.md](../../market-analysis.md) | **Alta** | Teste empírico em `7` capitais (`5/7` travadas), `10.761 LOC` Recife, `SPUNet/INDE`, bloqueio `DataJud`. | Olinda, Jaboatão e Paulista (`62,6%` dos prédios-caixão) têm **zero** base aberta (`DATA GAP`). |
| **Concorrência, Post-Mortems & IA** | [competitor-landscape.md](../../competitor-landscape.md) | **Alta** | `Localize.city`, `Já Morei`, `Eli Report/CondoScan/CondoCheck`, `Zillow/First Street`, `QuintoAndar/Superlógica/uCondo`, `403`/Next.js. | Faturamento e churn internos de startups privadas BR (`Morei Aqui`, `BetterPlace`, `Matrícula Simples`) são `DATA GAP`. |
| **Voz do Cliente, Personas & B2B2C** | [target-audience.md](../../target-audience.md) | **Média** | `22` falas literais Reddit/G1, `TJPE/TRF5/Procon`, `Porto Digital`, entidades `OAB-PE`/`IBAPE-PE`/`CRC-PE`/`CCA`. | **`G-USER = 0` após pivô**; pesquisa anterior (`N=83` UFPE) tem viés amostral acadêmico. |
| **Regulação, Litígio & Tendências** | [industry-trends.md](../../industry-trends.md) | **Alta** | `Lei 6.530/78`, `Súmula 227 STJ`, `STF Tema 987/533`, `CDC`, `OAB 205/2021`, `CMN 3.954/2011`, `CIB LC 214/2025`, `Campus Mobile`. | Regulamentação final do `PL 2338/2023` e implementação prática do `CIB` municipal em 2027. |

---

## 2. Checagem de Alinhamento: Suposições do Fundador vs. Evidências

**Confiança da Seção:** Alta (contraste objetivo entre o `00-intake/brief.md` e dados verificados nas Ondas 1–4).

| Premissa / Fala do Fundador (`brief.md` & `brainstorm.md`) | Evidência Verificada (Ondas 1–4) | Veredito |
| :--- | :--- | :---: |
| *"Em poucos segundos um turista pode virar um local."* | Turistas (`2–6 dias`, `>1.140` Airbnbs em Boa Viagem) não têm dor de atas, IPTU, laudêmio ou alvará de obra; o comprador real busca por `~10 semanas` (mediana `7` visitas) em `R$ 350k–1,2M`. `[Data]` | **Refutada** *(cortar turista)* |
| *"App extremamente escalável para outros estados sem tornar inviável."* | **Falso para `V1`:** `5/7` capitais bloqueiam dados; SP/POA custam `210–360h` cada (`3,5–6 meses`). **Verdadeiro apenas para `V2`:** documental nacional + 1 camada `SPUNet` (`Florianópolis` ou `Santos`). `[Data]` / `[Estimate]` | **Condicional ao Pivô `V2`** |
| *"Já aplicamos melhorias: criminalidade, desabamento, 5G, preço real, definições automáticas."* | `SDS-PE` para em nível municipal; `ITEP 2007 [>18m]` sem licença não dá risco vivo de desabamento; `Emlurb 2022 [>18m]`; *"preço justo/PTAM"* exige CRECI (`Lei 6.530/78`); notas atraem `Súmula 227 STJ`. `[Data]` | **Risco Alto** *(enxugar escopo)* |
| *"Funil de curiosidades no Instagram + shadow ads no Reddit/X + Give-to-Get para crescer orgânico."* | Reels genérico exige `~80k views` locais p/ 1 venda e gera `1★` fora de Recife; *shadow ads* causam ban no `r/Recife`; `Carteira.tsx` hoje cria **loop grátis infinito** (`3 créditos + estorno 1:1`). `[Data]` / `[Estimate]` | **Reprovada** *(ajustar urgente)* |
| *"B2C direto como foco principal e B2B secundário para mais tarde."* | `V1 R$ 49,90` gera CAC `6x–50x` acima do teto (`R$ 13,30`) e SOM Ano 1 de `R$ 3k–12,5k`; `V2 R$ 199–349` + `B2B2C` gera `R$ 139–252` de margem e CAC `~R$ 0–50` via `OAB-PE`/`IBAPE-PE`/`CRC-PE`. `[Estimate]` | **Inverter Prioridade** |
| *"5 sócios (`10–20h/sem` totais) focados em ganhar Claro Campus Mobile."* | Edital `15ª ed.` limita equipe a **`3` integrantes** e `cláusula 11.20(iv)` proíbe marcas de portais; banda de `16–18h/sem` exige cortes implacáveis e definição societária. `[Data]` | **Alerta de Governança** |

---

## 3. Catálogo Mestre de `DATA GAPS` (Bloqueios Não Resolvidos em Fontes Abertas)

1. **Validação de Demanda Real (`G-USER = 0` pós-pivô):** Zero entrevistas de campo pós-pivô, zero testes com pagantes Pix e zero medição de conversão *Free-Look* → `V2` (`R$ 199/349`) ou `B2B2C` (`R$ 199`/`R$ 249`). *(Solução: Fase 3.7 obrigatória).*
2. **Tempo Operacional Real da Curadoria `V2`:** Estimado em `<= 30–50 min/dossiê`, ainda não cronometrado com atas/matrículas reais em Recife.
3. **Volumes Exatos de Busca e Tráfego Fechado (`Keyword Planner / Semrush / Ahrefs`):** Sem acesso via API aberta para medir volume mensal exato em PE de buscas pré-contrato e tráfego mensal de `Morei Aqui`, `BetterPlace`, `Matrícula Simples`, `Morad.ia`, `Feche Agora` e `MySide Recife`.
4. **Região Metropolitana do Recife (`62,6%` dos prédios-caixão):** Olinda (`129`), Jaboatão (`81`) e Paulista (`60`) possuem zero portais CKAN/GIS abertos para integração automatizada.
5. **Busca Automática de Processos por CNPJ de Condomínio/Vendedor (`DataJud CNJ`):** Impossibilitada na API pública gratuita por LGPD (exige certidões locais pagas ou parceiro legaltech).
6. **Dados Urbanos Incompletos/Congelados em Recife:** Cobertura solar `0%` em Madalena (`57,8%` média), Emlurb congelada em `ago/2022 [>18m]`, Defesa Civil com `20` eventos datados (`88%` sem risco nos 5 bairros) e ausência de microdados municipais/estaduais de `Relocation` corporativo no Brasil.

---

## 4. Consolidação Final de Bandeiras Críticas (`Flags`)

### Red Flags (Impedimentos Críticos Sem Mitigação)
1. **Inviabilidade econômica do `V1` isolado a `R$ 49,90`:** SOM `R$ 3k–12,5k/ano`, CAC pago `R$ 100–750+` vs. teto `R$ 13,30–14,50`, `Localize.city` (`US$ 70M`) e `Já Morei` faliram no mesmo modelo, e `ChatGPT/Gemini/Móra AI` entregam resumo grátis.
2. **Bloqueio nacional de dados abertos (`5/7` capitais) + API `DataJud`:** Refuta tese de expansão rápida via prefeituras; só `V2` documental + `SPUNet` escala.
3. **Exploit de crédito infinito no código (`Carteira.tsx` / `descarte.ts`) + `SC COSIT 72/2020`:** Hoje o app não cobra de fato; no `V2`, embutir taxas de cartório gera margem negativa de **`-14,9%`**.
4. **Risco jurídico/contratual (`Súmula 227 STJ`, `Lei 6.530/78`, `403` Cloudflare, `Apple §5.2.2`, `Campus Mobile 11.20(iv)`):** Proíbe emitir notas/selos/"preço justo", raspar portais em WebView/servidor ou citar marcas terceiras no edital.
5. **Lacuna de governança (`5` sócios vs. limite de `3` no Campus Mobile) + `G-USER = 0`.**

### Yellow Flags (Riscos Gerenciáveis com Disciplina)
1. **Defasagem parcial das camadas do Recife (`Emlurb 2022`, `ITEP 2007`, `Censo 2022`):** Exige timestamp visível na interface e remoção de falsas promessas (*crime por rua*, *desabamento ao vivo*).
2. **Pressão tributária (`Meta Ads +13,83%`, `Simples Anexo V 15,5% vs. III 6%`):** Exige planejamento de Fator R após validação e trava automática de CAC (`<= R$ 84,09`) em retargeting.
3. **Limites éticos `B2B2C` (`Provimento OAB 205/2021`, `Res. CMN 3.954/2011`):** Vender ferramenta fixa de produtividade com *scrub* de PII e zero treinamento público — nunca *lead fee* ou repasse ao mutuário.
4. **Homonímia e concorrência SEO lateral:** Distanciar marca de `Morad.ia`/`Morada.ai` e focar SEO apenas em entidade de prédio (`DSQFL`) + calculadoras contra a vantagem de `~790x` de margem da `MySide`.

---

## Sources

Consolidação integral das fontes citadas em [market-analysis.md](../../market-analysis.md), [competitor-landscape.md](../../competitor-landscape.md), [target-audience.md](../../target-audience.md) e [industry-trends.md](../../industry-trends.md):
- **Tier 1 (Oficiais, Legais & Repositório):** `IBGE` (PNAD / Censo 2022 `[>18m]`), `CBIC`, `ABECIP`, `BCB`, `FipeZAP`, `Prefeitura do Recife` (`ESIG`, `Sefin 1T24 [>18m] / 1T25`, `Emlurb ago/2022 [>18m]`), `ITEP (2007 [>18m])`, `Caixa/FCVS`, `ONR/SIG-RI`, `SPUNet/INDE`, `DataJud/CNJ`, `TJPE`, `TRF5`, `Procon-PE/SP`, `OAB-PE` (`Prov. 205/2021`, `Rec. CFOAB 001/2024`), `CMN 3.954/2011`, `RFB` (`LC 214/2025`, `IN 2.275/2025`, `SC COSIT 72/2020`), `COFECI`, `ANPD/LGPD`, `CDC`, `STF Tema 987/533`, `STJ Súmula 227`, `Apple/Google/CADE`, `Instituto Claro` (`15ª ed.`), `MSCI Form 10-Q`, `Rightmove RI` (`fev/2024 [>18m]`), código local `veredas/`.
- **Tier 2 (Imprensa Setorial, VC & Estudos):** `CRETI`, `Terracotta`, `uCondo Censo`, `Porto Digital`, `FACEPE`, `CRC-PE`, `IBAPE-PE`, `TechCrunch`, `The Real Deal`, `Estadão`, `Exame`, `Finsiders Brasil`, `RevenueCat`, `Ahrefs`, `Seer Interactive`.
- **Tier 3 (Comunidades & Benchmarks):** `Reddit` (`r/Recife`, `r/ConselhosLegais`, `r/brasil`, `r/NYCapartments`), `TabNews`, `G1 PE`, `RD Station`, `Ignite Marketing`.
