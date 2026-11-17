# VEREDA — Startup Design Progress

- **Project:** vereda
- **Mode:** Full Mode (Modo Completo)
- **Language:** Português (PT-BR)
- **Started:** 2026-11-15
- **Research Depth:** Deep (score: 6/9, override: user request — 15 agents across 4 waves, 5–6 rounds each)

## Checklist

- [x] Phase 0: Resume Check
- [x] Phase 0.5: Pre-Flight Check (`00-intake/preflight.md`)
- [x] Phase 1: Intake Interview — Sabatina 3 rodadas concluída (`00-intake/brief.md`)
- [x] Phase 2: Brainstorm — 6 variações avaliadas (`00-intake/brainstorm.md`)
- [x] Phase 2.5: Research Depth Assessment — **Deep** aprovado (`sem navegador`, via busca/leitura pública + subagentes)
- [/] Phase 3: Market Research (4 waves — **Ondas 1, 2 e 3 concluídas `A1–C4`**, **Onda 4 em andamento `D1–D3`**)
- [ ] Phase 3.5a: Research Verification (`V1`)
- [ ] Phase 3.5: Research Gate (Go/No-Go Checkpoint)
- [ ] Phase 3.7: Customer Discovery (Interviews / Gate)
- [ ] Phase 4: Strategy
- [ ] Phase 5: Brand
- [ ] Phase 6: Product
- [ ] Phase 7: Financial
- [ ] Phase 8: Validation & Final Assessment Dashboard

## Session Notes

- **Onda 1 concluída (`01-discovery/raw/{market-size,trends,regulatory,adjacent-expansion}.md`):**
  - `A1`: Passe B2C puro (R$ 49,90) nos 5 bairros gera apenas **~R$ 3 mil–R$ 12,5 mil/Ano 1** (CAC máx ~R$ 13,30). SOM realista (~R$ 68 mil) depende de **Concierge R$ 299 + B2B2C**.
  - `A2`: VC para B2C puro secou; timing **forte para diligência pré-contratual (condomínio/ata/balancete + risco urbano)** via B2B2C/transacional (condomínio +24,9%, inadimplência 11,95%, Recife aluguel #2/#3 BR).
  - `A3`: WebView de portais e cobrança externa iOS violam **Apple 5.2 / 3.1.1**; IA jurídica/preço justo esbarra em **COFECI / OAB / CREA / CDC art. 14**; notas/selos atraem **Súmula 227 STJ**.
  - `A4`: Escala aberta em outras capitais **refutada** (5 de 7 bloqueiam/omitem IPTU/ITBI/obras; Recife = **10.761 LOC**; SP/POA levam 3,5–6 meses cada + 15–30h/mês). B2G CPSI (<40 editais municipais em 5 anos) e Relocation Porto Digital (~60–250 externos/ano) não sustentam operação.
- **Onda 2 concluída (`01-discovery/raw/{direct-competitors,indirect-competitors,competitor-gtm,emerging-competitors}.md`):**
  - `B1`: **Localize.city** queimou **US$ 70M** e fechou em ago/2024; **Já Morei** morreu no *cold-start* + ads; **Morei Aqui** sem app nem cobertura verificada em Recife; **MySide** (R$ 12M Seed) foca 100% imóveis novos (comissão 5% incorporadora), deixando **usados e locação** abertos; **Eli Report** virou Freemium (out/2024) enquanto **CondoScan/CondoCheck** cobram **CAD $349–475** com curadoria humana.
  - `B2`: **Ameaça ChatGPT/Gemini PDF** + **Móra AI (uCondo)** mata "só resumir ata por IA"; moat real está no **muro pré-proposta**, contexto **3D/ESIG/Terreno de Marinha (40% do Recife, laudêmio 5%)/Prédio-Caixão (431 na RMR)** e **Modo Visita ao vivo**; `Mapa Sossego` já dá índice 0–100 de ruído grátis no Recife.
  - `B3`: Instagram curiosidades exige **~80k views locais/venda**; Google/Meta Ads têm CAC R$ 100–750+; "shadow ads" no Reddit geram ban; loop de créditos em `Carteira.tsx`/`creditos.tsx` (relatado por B3) zera urgência de pagamento; Apple × CADE (iOS 26.5) ainda cobra 10%–15% em *external link* -> **Web/PWA + Pix + B2B2C advogados/vistoriadores + Porto Digital/UFPE + micro-creators Pix** é o caminho <90d.
  - `B4`: Extensões Chrome sofrem teto (~950 users ou paywall rejeitado no *Property Log*) + ZAP App Router (`self.__next_f`) + Cloudflare `403`; MCPs (`proximo-ap`) são só dev CLI; **Campus Mobile Reg. `11.20(iv)` proíbe citar marcas de portais** no pitch/vídeo!
- **Contradição crítica a alinhar antes da Fase 4:** fundador mencionou "turista virar local", "criminalidade", "desabamento", "coolwalk", "5G/Wi-Fi" e "preço real" como propostas centrais, mas os docs de engenharia pós-pivô (`VE00–VE15`, `CRIVO`, benchmark `14/11`) explicitamente rejeitaram/proibiram ou ainda não cobrem esses itens.
- **Estado de validação:** 0 testes reais pós-pivô; plano imediato citado pelo fundador usa familiares/conhecidos (`irmã` + `adultos mais velhos`), sujeito a viés de cortesia.
- **Critério de desistência (kill criterion):** ainda não definido pelo fundador.
