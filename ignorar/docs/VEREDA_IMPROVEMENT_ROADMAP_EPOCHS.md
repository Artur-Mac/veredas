# VEREDA — Master Product Improvement Roadmap & UI Transformation Epochs
**Document Version:** 1.0.0 (Master Execution Specification)  
**Target Platform:** Mobile-First Web Application (PWA / Responsive Mobile Web)  
**Design System Reference:** Google Stitch Direction 04 (*Chassi Editorial com Inscrição Cartográfica*) & Swiss Grid Architecture  
**Competition Target:** Campus Mobile 15ª Edição — Categoria: *Tecnologias Urbanas*  

---

## Executive Summary & System Philosophy

**VEREDA** is an urban housing decision intelligence platform designed for the Brazilian market. Its core thesis is:
> *"Transforming fragmented real estate advertisements, cadastral records, municipal open data, and environmental datasets into traceable evidence, contextual interpretation, and empowering next steps for citizens choosing where to live."*

### The Core Problem with the Current "Vibe Codado" Prototype
The initial application prototype verified in Google AI Studio and documented in `/home/v/Documents/project screens/` succeeds functionally in displaying data cards, but visually suffers from the classic **"vibe codado" (naive coded aesthetic)**:
1. **Generic Container Styling:** Standard white rounded cards with default shadows floating on an empty tinted background, resembling an off-the-shelf Tailwind/Bootstrap dashboard.
2. **Lack of Graphic Texture:** Absence of architectural blueprints, cartographic isolines, paper grain, and cadastral grid overlays defined in the official Stitch Brand Book.
3. **Double-Header & Navigation Glitches:** Stacked top bars, disappearing bottom navigation bars on scroll, and inconsistent badge states (`SP • HABITAT` vs. `PROTOCOLO • GEO` vs. `DOSSIÊ • AP. 84`).
4. **Pseudo-Scientific Metrics:** Badges like *"Edifício Confirmado (94%)"* that look like arbitrary startup marketing rather than verifiable municipal evidence.
5. **Passive Unknowns:** Flagging missing condominium minutes without providing an immediate one-click bridge to action (such as generating a pre-formatted WhatsApp inquiry for the broker).

This specification establishes **Six Concrete Implementation Epochs** to transform the codebase into an award-winning, editorial-architectural digital product that commands total credibility from both the engineering jury (Poli-USP / LSI-TEC) and innovation directors (Instituto Claro / beOn Hub).

---

## Brand Architecture & Visual System Specifications (Stitch Direction 04)

All future implementation prompts and downstream coding models must adhere strictly to these design tokens:

### 1. Color Palette Tokens
```css
:root {
  /* Primary Signature */
  --color-signal-orange: #F47745;       /* Focus, critical discoveries, primary CTAs */
  --color-signal-orange-light: #FDF1EB; /* Pill highlights, active tabs, subtle warnings */
  --color-signal-orange-hover: #E26330; /* Pressed button states */

  /* Structural & Ink */
  --color-near-black: #171717;          /* Primary headlines, high-contrast structural borders */
  --color-ink-surface: #121212;         /* Dark mode cards, night-mode cadastral viewers */
  --color-charcoal-subtle: #2D2D2D;     /* Secondary structural text */

  /* Substrate / Paper */
  --color-warm-paper: #F2EBDD;          /* Base app background (warm, non-sterile editorial paper) */
  --color-warm-paper-card: #FFFFFF;     /* Elevated card background */
  --color-warm-paper-border: #E5DCB8;   /* Architectural boundary lines, dividers */
  --color-paper-alt: #FAF6EF;           /* Input field background, secondary surfaces */

  /* Territorial & Earth */
  --color-deep-rust: #B94E36;           /* Land registry, zoning alerts, dense metadata */
  --color-deep-rust-light: #FCECE9;     /* Hazard pill backgrounds */

  /* Bioclimatic & Geography */
  --color-muted-sage: #7F8870;          /* Parks, slope comfort, legal municipal exemptions */
  --color-muted-sage-light: #F0F3EC;    /* Verified badge backgrounds */
}
```

### 2. Typographic Hierarchy
* **Headlines & Editorial Statements:** `DM Serif Display` or `Fraunces` (Serif, sharp cut, classic proportions, italic accents for emotional emphasis like *"onde morar"*).
* **Body & Interface Elements:** `Plus Jakarta Sans` or `Inter` (Geometric sans-serif, high legibility at 12px–14px on mobile screens).
* **Cadastral Records, Metadata & Telemetry:** `JetBrains Mono` or `Space Mono` (Uppercase, letter-spacing: 0.8px–1.5px, 9px–11px).

### 3. Wordmark Geometry
The official wordmark is **VEREDA** in high-contrast editorial serif, underlined by an orange dashed cartographic route vector (`- - - - - - - -`), followed by the monospace descriptor `INTELIGÊNCIA HABITACIONAL`. Do not use generic house/roof icons.

---

## Detailed Implementation Roadmap: The 6 Epochs

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  EPOCH 0 │ Graphic Assets, Textures & Anti-SaaS Design System Foundation     │
│  EPOCH 1 │ Intelligent Intake & Interactive Building Identity Resolution     │
│  EPOCH 2 │ Strikethrough Cost Intelligence & Dossier Information Hierarchy   │
│  EPOCH 3 │ The Evidence Ledger: "Evidence → Why It Matters → Next Action"   │
│  EPOCH 4 │ Actionable Unknowns & The 1-Click WhatsApp In-Field Generator     │
│  EPOCH 5 │ Multi-Property Trade-Off Matrix & Saved Search Workspace          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### EPOCH 0: Graphic Assets, Textures & Anti-SaaS Foundation
**Objective:** Purge the generic "coded startup" look. Ground the UI in the aesthetics of Swiss Grid architecture, topographic cartography, and high-end editorial publications (*FORM Magazine*).

#### Tasks & Technical Specifications:
1. **Background Cartographic Texture & Grid Lines:**
   * Implement a subtle SVG background overlay on `--color-warm-paper` featuring 24px isometric grid lines and delicate topographic isolines (opacity: 0.04 to 0.07).
   * Cards must not look like generic floating boxes. Use sharp 1px borders (`var(--color-warm-paper-border)`) combined with crisp 16px–20px corner radii and editorial hairline dividers.
2. **Architectural Photography & Façade Curation:**
   * Replace generic modern stock photos with authentic Brazilian urban architecture:
     * *São Paulo Case:* Façade crops of modernist residential high-rises (e.g., Edifício Pauliceia, Bela Cintra 1970s concrete façades, Pinheiros traditional residential enclaves).
     * *Recife Case (Optional Toggle):* Pilotis, coastal brick architecture, Boa Viagem residential blocks.
   * Apply an editorial duotone or warm contrast filter to listing thumbnails so they blend seamlessly into the warm paper aesthetic.
3. **Custom Architectural SVG Iconography:**
   * Build a dedicated inline SVG sprite sheet replacing standard generic icons:
     * *Area:* Floor plan boundary bracket (`[ ]`).
     * *Zoning:* Parcel boundary polygon (`⬡`).
     * *Slope/Topography:* Inclined plane vector (`∡ 8.4%`).
     * *Condominium Minute:* Page with seal stamp icon.
     * *Provenance/Source:* Official municipal coat-of-arms or cadastral seal pill.

---

### EPOCH 1: Intake & Interactive Building Identity Resolution
**Objective:** Solve the #1 skepticism of tech juries: *"How does the app know the building from an anonymous URL without a street number?"*

#### Tasks & Technical Specifications:
1. **Redesign the Intake Hero Screen (Module A):**
   * Prominent intake container styled like a surveyor's terminal:
     * Monospace label: `LINK DO ANÚNCIO (ZAP, QUINTOANDAR, LOFT, VIVAREAL...)`.
     * Pre-filled interactive chip: `[EXEMPLO: Rua Bela Cintra, Ap 84]`.
     * Secondary action: *"Ou consultar digitando endereço e número"*.
2. **Investigative Pipeline Stepper (Module B):**
   * Realistic multi-stage telemetry animation with millisecond timestamps and genuine source attribution:
     * `[0.4s]` **Leitura e Extração:** Parsing textual claims, declared rent, condo fees, and floor level.
     * `[0.9s]` **Resolução de Identidade:** Intersecting street segment with municipal cadastre (GeoSampa / CNEFE 2022).
     * `[1.4s]` **Interseção Territorial:** Querying municipal zoning (ZER-1 / ZEU), adjacent construction permits, and official flood records.
     * `[1.8s]` **Síntese de Incertezas:** Isolating undocumented fees and missing assembly minutes.
   * Include the **Transparência Metodológica** callout box: *"Ausência de registro não é garantia de ausência de problema. Dados não confirmados viram perguntas para a vistoria."*
3. **Interactive Candidate Resolution Bottom-Sheet:**
   * When confidence is not 100%, trigger a sleek interactive bottom-sheet:
     * Title: *"Qual é o edifício anunciado?"*
     * Subtitle: *"O portal omitiu o número exato. Localizamos 2 edifícios com 62m² e 2 dormitórios neste trecho da Bela Cintra:"*
     * *Option A:* **Edifício Solar dos Franceses** (Nº 412 • Lote 0124 • 12 andares • Fachada correspondente às fotos).
     * *Option B:* **Maison Cintra** (Nº 438 • Lote 0130 • 8 andares • Sem portaria remota).
   * Selecting Option A updates the entire dossier in real-time. This proves human-in-the-loop validation without claiming impossible AI magic.

---

### EPOCH 2: Strikethrough Cost Intelligence & Dossier Re-Architecture
**Objective:** Eliminate navigation stacking, fix visual clutter, and spotlight the product's instant "Aha!" moment: the audited monthly housing cost.

#### Tasks & Technical Specifications:
1. **Header & Navigation Fixes:**
   * **Eliminate Stacked Headers:** Fix the UI bug from `Screenshot_2026-10-11_22-22-03.png` where `VEREDA` top bar and `< Busca` share bar appeared simultaneously.
   * Standardize the top app bar: Left = Brand wordmark with cartographic baseline; Center = Context badge (`DOSSIÊ • AP. 84`); Right = Share icon + Menu.
   * Lock the bottom navigation bar (`Início`, `Dossiê`, `Vistoria`, `Comparar`, `Salvos`) across all primary screens with persistent active highlights and badge counts.
2. **Hero Section & Audited Cost Module (Module D):**
   * **Strikethrough Price Callout:**
     * `CUSTO MENSAL REAL APURADO: R$ 4.410/mês` (28px Mono, Bold, Near Black).
     * `DECLARADO NO PORTAL: R$ 4.000` (14px Mono, Strikethrough, Muted Gray).
     * Clear delta tag: `+R$ 410 vs anúncio`.
   * **Audited Discrepancy Callout:**
     * Highlight the hidden cost: *"⚠️ Rateio extraordinário de portaria remota (+R$ 210) e seguro-fiança obrigatório não discriminados na descrição do corretor."*
   * **Granular 4-Pill Breakdown:**
     * `ALUGUEL: R$ 3.400`
     * `CONDOMÍNIO: R$ 810` (Flagged in Rust)
     * `IPTU: Isento` (Flagged in Sage with *"Lei Municipal PMSP"*)
     * `SEGURO: R$ 65`
3. **Core Specs Matrix:**
   * 4-column balanced grid: `62 m² Área Privativa`, `2 Quartos`, `1 Banheiro`, `1 Vaga`.

---

### EPOCH 3: The Evidence Ledger ("Evidence → Context → Action")
**Objective:** Structure every discovery into VEREDA's signature 3-tier cognitive model. Eliminate the "1 ACHADOS" grammatical bug and organize findings by severity.

#### Tasks & Technical Specifications:
1. **Fix Section Header & Counters:**
   * Replace *"1 ACHADOS"* with: `4 ACHADOS AUDITADOS` and subtitle: *"Síntese independente combinando dados oficiais, geometria e omissões do anúncio."*
2. **Evidence Card Data Architecture:**
   Every card in the feed must strictly contain:
   ```typescript
   interface EvidenceCard {
     category: 'INCONSISTÊNCIA' | 'REGISTRO OFICIAL' | 'ALVARÁ VIZINHO' | 'AINDA NÃO SABEMOS';
     source: string;              // e.g., "SisRBC GeoSampa", "OSM Altimetria", "Cadastro Fiscal PMSP"
     sourceDate: string;          // e.g., "Out/2026", "Base 2024"
     title: string;               // Clear factual finding
     description: string;         // Detailed empirical context
     whyItMatters: string;        // Human impact on daily life
     actionableNextStep: string;  // Direct check, question, or verification
     status: 'alerta' | 'verificado' | 'lacuna';
   }
   ```
3. **The 4 Primary Demonstrative Cards for São Paulo:**
   * **Card 1 (Mobility & Slope):**
     * *Title:* Anúncio declara "3 min a pé do Metrô". Rota real leva 9 min.
     * *Finding:* Rota de pedestres via calçada possui 620 metros com inclinação média contínua de 8,4% (subida acentuada da Rua Bela Cintra).
     * *Por que importa:* Triplica o esforço físico real no trajeto diário de volta do trabalho.
     * *Ação:* Inspecionar perfil altimétrico e isócrona no mapa.
   * **Card 2 (Adjacent Construction & Noise):**
     * *Title:* Lote vizinho (nº 420) aprovado para torre de 28 pavimentos.
     * *Finding:* Alvará de edificação nova deferido no SisRBC GeoSampa. Janelas dos dormitórios a 9 metros do futuro canteiro de obras.
     * *Por que importa:* Risco iminente de ruído de fundação por 24 meses e bloqueio permanente do sol matinal.
     * *Ação:* Perguntar ao porteiro da unidade vizinha a data de início da obra.
   * **Card 3 (Fiscal Exemption):**
     * *Title:* IPTU Isento por Lei Municipal PMSP (Área construída < 65m²).
     * *Finding:* Economia real de R$ 180/mês garantida pelo cadastro fiscal da Prefeitura. Corretor indicava "IPTU a confirmar".
     * *Por que importa:* Redução líquida nas despesas fixas contratuais.
   * **Card 4 (Documentary Unknown):**
     * *Title:* Cota extraordinária para reforma de impermeabilização pendente.
     * *Finding:* Atas das assembleias dos últimos 12 meses não foram disponibilizadas no anúncio.
     * *Por que importa:* O inquilino/comprador pode ser surpreendido com cobranças de obras de manutenção estrutural no boleto.
     * *Ação:* Solicitar atas ao locador antes de formular proposta.

---

### EPOCH 4: Actionable Unknowns & The 1-Click WhatsApp Generator
**Objective:** Bridge the gap between passive reading and active field negotiation.

#### Tasks & Technical Specifications:
1. **Interactive Field Checklist (`O Que Investigar na Visita`):**
   * Re-architect the checklist so items are dynamically spawned from the dossier's flagged unknowns:
     * *Item 1 [Alta Prioridade]:* Checar isolamento acústico na janela da Bela Cintra às 16h (avaliar barulho de ônibus na ladeira).
     * *Item 2 [Alta Prioridade]:* Inspecionar recuo do lote vizinho nº 420 (conferir distância da futura torre de 28 andares).
     * *Item 3 [Vistoria]:* Testar vazão e pressão simultânea de água (abrir chuveiro e torneira juntos por 60s no 8º andar).
     * *Item 4 [Vaga]:* Conferir demarcação da vaga no subsolo (verificar se é livre ou presa e se manobra SUV).
   * Interactive checkboxes that update a live completion bar (`X de 4 verificados`).
2. **1-Click WhatsApp Inquiry Generator (Modal / Sheet):**
   * Primary button: `[Exportar Roteiro para o WhatsApp]`.
   * Generates a pre-filled, courteous, and bulletproof WhatsApp message ready to send to the broker:
     > *"Olá! Tenho interesse no apartamento da Bela Cintra (Ap 84). Antes de agendarmos a visita presencial, gostaria apenas de confirmar três pontos com o proprietário:*  
     > *1. Há cota extraordinária de reforma de fachada ou impermeabilização aprovada em assembleia recente?*  
     > *2. Há previsão para o início das obras no lote vizinho (nº 420)?*  
     > *3. A vaga de garagem é fixa e livre, ou necessita de manobrista?*  
     > *Obrigado!"*

---

### EPOCH 5: Trade-Off Comparison & Saved Search Workspace
**Objective:** Demonstrate long-term product value beyond a single listing, fulfilling Modules H and I without arbitrary gamified scores.

#### Tasks & Technical Specifications:
1. **Comparative Decision Matrix (`Comparar Alternativas`):**
   * 2-column comparison between two analyzed properties:
     * *Opção A:* Edifício Solar dos Franceses (Consolação • 62m²).
     * *Opção B:* Edifício Pauliceia (Bela Vista • 74m²).
   * Comparison rows:
     * Custo Mensal Real Apurado (`R$ 4.410 (+R$ 410 oculto)` vs. `R$ 5.150 (Estável)`).
     * Acesso a Pé ao Metrô (`9 min com ladeira 8,4%` vs. `3 min terreno plano`).
     * Risco de Entorno (`Obra de torre contígua` vs. `Tombado CONDEPHAAT / Sem obras`).
     * Tipologia (`62m² • 2q • 1b` vs. `74m² • 2q • 2b`).
2. **Narrative Trade-Off Synthesis:**
   * Prominent callout box replacing opaque AI ratings:
     > *"⚖️ Síntese do Trade-off VEREDA:*  
     > *O Edifício Solar dos Franceses economiza R$ 740/mês no orçamento, mas impõe ruído de construção vizinha e subida íngreme na rotina diária. O Edifício Pauliceia oferece previsibilidade acústica, mobilidade plana e documentação limpa por um prêmio financeiro de 16%."*
3. **Workspace (`Minha Jornada de Busca`):**
   * Status metrics: `2 Analisados`, `1 Visita Agendada`, `3 Dúvidas Abertas`.
   * Active cards with direct links back to dossiers.
   * **Descarte Transparente (Discard History):**
     * Card for `Studio Pamplona 920` (struck-through, badge `DESCARTADO`).
     * Documented justification: *"Motivo: Condomínio real apurado (R$ 890) superava em 50% o valor anunciado no portal."*

---

## Context Package: Required Files for the Downstream AI

When prompting your higher-powered coding AI to execute these Epochs, provide the following **exact context bundle**:

### 1. Primary Design & Aesthetic Reference Files
* **Stitch Brand Book Screenshots (Local paths):**
  * `/home/v/Pictures/Screenshots/Screenshot_2026-10-11_21-41-12.png` *(Stitch Direction 04 Wordmark, Cartographic Inscription & Design System Applications)*
  * `/home/v/Pictures/Screenshots/Screenshot_2026-10-11_21-41-28.png` *(Executive Report Cover, Isoline Map, Device Header UI)*
  * `/home/v/Pictures/Screenshots/Screenshot_2026-10-11_21-41-39.png` *(Exact Color Palette Tokens, Functional Criteria & Etymology of Vereda)*
  * `/home/v/Pictures/Screenshots/Screenshot_2026-10-11_21-48-49.png` *(Full Stitch Canvas: Component Sheet & 4 Wordmark Explorations)*
* **Art Direction Inspo:**
  * `/home/v/Pictures/Screenshots/Screenshot_2026-10-11_21-04-49.png` *(FORM Architecture Magazine editorial grids)*
  * `/home/v/Pictures/Screenshots/Screenshot_2026-10-11_21-05-04.png` *(Swiss Grid Architecture poster)*

### 2. Current Prototype Baseline Screens (What Already Exists)
* All screenshots in `/home/v/Documents/project screens/`:
  * `Screenshot_2026-10-11_22-23-02.png` *(Current Home & Input)*
  * `Screenshot_2026-10-11_22-23-17.png` & `...22-23-21.png` *(Current Pipeline Loading)*
  * `Screenshot_2026-10-11_22-20-02.png` & `...22-23-35.png` *(Current Dossier & Evidence Cards)*
  * `Screenshot_2026-10-11_22-24-14.png` *(Current Checklist)*
  * `Screenshot_2026-10-11_22-24-23.png` *(Current Comparison Matrix)*
  * `Screenshot_2026-10-11_22-24-29.png` *(Current Workspace)*

### 3. Interactive Code Reference
* `/home/v/.gemini/antigravity/scratch/vereda-prototype/vereda_interactive_prototype.html` *(The unified HTML/CSS/JS baseline implementing all screens, candidate modal, and WhatsApp generator)*.

### 4. Due Diligence & Methodological Frameworks
* `/home/v/Downloads/PropSight_critical_assessment.pdf` *(The 93-page rigorous due diligence identifying failure modes like Zillow's climate score retreat and Brazilian entity linkage limits)*.
* `/home/v/Downloads/PropSight_proposed_solution.pdf` *(The independently researched solution proposal defining the 8 core MVP capabilities)*.

---

## Instructions for the Downstream AI Execution Agent

When implementing the code based on this roadmap:
1. **Never Output Generic SaaS Colors:** Strictly maintain the `#F2EBDD` warm paper background, `#171717` ink typography, `#F47745` signal orange accents, and `#7F8870` sage environmental badges.
2. **Never Generate Random Floating Cards:** All containers must align to an underlying 8pt architectural grid with subtle borders and crisp typography.
3. **Preserve Linguistic Authenticity:** All interface strings must remain in natural, intelligent Brazilian Portuguese (e.g., *"Custo Mensal Real Apurado"*, *"Edifício Confirmado via Cadastro Municipal"*, *"O que vale saber antes de decidir"*).
4. **Mobile Ergonomics First:** Optimize for vertical 390px–412px viewports (iPhone 15 / Pixel 8). Touch targets must be minimum 44px × 44px. Modals must behave as native mobile bottom-sheets.
5. **No Vaporware Claims:** Frame every capability around real Brazilian open data realities (CNEFE/IBGE, GeoSampa/SisRBC, Dados Abertos Recife, OpenStreetMap) and document analysis.
