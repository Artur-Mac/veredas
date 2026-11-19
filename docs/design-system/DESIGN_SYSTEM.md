# VEREDA Design System — Single Source of Truth (`v3.1.0`)

**Architectural Thesis:** *Architectural Editorial & Calm Forensics.*  
Every surface, metric, diagram, and micro-sentence translates municipal, acoustic, solar, and financial records into **3-second clarity** across **Mobile (`390 px`)**, **Web (`1440 px`)**, and **Instagram (`1080 × 1350 px`)** — backed by [tokens.json](file:///home/v/Documents/vereda/veredas/docs/design-system/tokens.json) and verified interactively in [showcase.html](file:///home/v/Documents/vereda/veredas/docs/design-system/showcase.html).

---

## 1. Visual Foundations

### 1.1 Surface Polarity & 60–25–10–5 Chromatic Discipline
Following the paper-first architecture validated across calm editorial design systems (`refero` / Radix Colors) and architectural real estate references in [some_refs/](file:///home/v/Documents/vereda/veredas/docs/design-system/some_refs):
- **60% Warm Porcelain Canvas (`#F6F4EF` — `surface.canvas`):** Level-0 background across app screens, web sections, and educational social slides. Never place warm cards on a sterile `#FFFFFF` canvas.
- **Level-1 Elevated Paper (`#FCFBF9` — `surface.elevated`):** All unified Audit Cards and Vital Signals Matrices.
- **25% Deep Forest (`#142D2D` — `brand.forest`):** Primary ink (`14.07:1` on card), active navigation pills, primary DataViz baselines, dark symbol lexicon cards, and Instagram cover slides.
- **10% Tactile Sand (`#ECEAE3` — `surface.subtle`):** Compact control tracks, filter buttons, and `"Sem leitura"` states.
- **5% Brand Solar (`#EA580C` / `#C44312` / `#F47745`):** Rationed exclusively to the VEREDA Portal mark, primary conversion CTAs, Poente heat peaks, and asking-price divergence markers.

### 1.2 Color & WCAG 2.1 AA Matrix
Every semantic text/background pair is mathematically verified (`≥ 4.88:1` normal text, `≥ 3.23:1` graphical marks):

| Role | Token | Hex | Paired Surface | Contrast | Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Ink** | `ink.primary` | `#142D2D` | `#FCFBF9` / `#F6F4EF` | `14.07:1` / `13.24:1` | Headings, primary metrics, structural icons |
| **Secondary Ink** | `ink.secondary` | `#42504D` | `#FCFBF9` / `#F6F4EF` | `8.17:1` / `7.68:1` | Body explanations, Layer 2 bullets |
| **Muted Ink** | `ink.muted` | `#5A6663` | `#F6F4EF` / `#ECEAE3` | `5.43:1` / `4.96:1` | Plain kickers, dates, sources, inactive labels |
| **Primary CTA** | `brand.solarCta` | `#C44312` | `#FCFBF9` text | `4.88:1` | Primary action buttons (`Gerar Dossiê`, `Preparar visita`) |
| **Solar Small Text** | `brand.solarText` | `#BC4010` | `#FCFBF9` / `#F6F4EF` | `5.23:1` / `4.93:1` | Inline solar warnings and positive/negative deltas |
| **Solar on Dark** | `brand.solarOnDark` | `#F47745` | `#142D2D` | `5.25:1` | 16-symbol icons & accents on Deep Forest dark surfaces |
| **Solar Graphic** | `brand.solarMark` | `#EA580C` | `#FCFBF9` (SVG/icons) | `3.44:1` | Portal mark, Poente bars, sun rays (**never small text on light**) |
| **Favorable** | `status.favorable` | `#0F6E65` | `3px` rule + ink on light | `5.91:1` | Mangrove Teal: Nascente, cota seca, aligned median, quiet room |
| **Caution** | `status.caution` | `#945306` | `3px` rule `#C97A16` + ink | `5.80:1` | Warm Ochre: pending docs, moderate noise |
| **Critical** | `status.critical` | `#B33124` | `3px` rule + ink on light | `6.00:1` | Recife Terracotta: high Poente heat, loud corridor, flood alert |
| **Official / Method** | `status.official` | `#1E507B` | Link & tap-to-reveal source | `8.16:1` | Cadastral Blue: IPTU/ITBI/ESIG sources, Layer 3 triggers, focus ring |
| **No Reading** | `status.noReading` | `#5A6663` | Dashed `#CCC6B9` frame | `4.96:1` | `"Sem leitura"` state — excluded from averages |

> **Anti-AI-Slop & Anti-Vibecode Guardrails:** Strictly forbid rounded pastel pill badges with tiny colored dots (`[ • Favorável ]`), neon gradients, nested rounded boxes inside cards, or giant bubbly radii (`> 12 px`). Use a crisp **`3px` left accent rule + typographic status text** instead.

### 1.3 Typography System — Zero Monospace Architecture
VEREDA eliminates monospace fonts (`JetBrains Mono`, `Geist Mono`) so consumer prices and architectural measurements read with human clarity instead of developer-console styling.

- **Brand Wordmark (`typography.wordmark`):** **`Switzer` Bold (`700`, `+0.16em`)** paired cleanly with the `#EA580C` VEREDA Portal mark. *(Alternate tested in showcase: `Geist Serif Triangle` with optical weight boost `-webkit-text-stroke: 0.45px currentColor`.)*
- **Editorial Headlines (`fontFamily.display`):** **`Geist Serif Triangle`** (`GeistSerif-Triangle.woff2`, weight **`400`**, tracking `-0.025em`). **Hard floor: `≥ 24 px`** so hairline serifs never break up on mobile screens.
- **UI, Body, Metrics & Layer 3 Proofs (`fontFamily.sans`):** **`Switzer`** (default, Fontshare `400–800`) — 1-token swappable to **`Geist`** (`sansAlternate`) — always paired with `font-variant-numeric: tabular-nums` (`tnum`) on metrics, prices, decibels, and percentages.

| Role | Token | Family & Weight | Size / Line-Height | Tracking | Usage & Limits |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wordmark** | `typography.wordmark` | `Switzer` · 700 | `15–17px / 1.08` | `+0.16em` | App header, web navbar, Instagram footer |
| **Display Hero** | `typography.display` | `Geist Serif Triangle` · 400 | `38px / 1.08` (42px IG) | `-0.025em` | Landing hero & IG cover headline (`≤ 10 words`) |
| **Screen Heading** | `typography.heading` | `Geist Serif Triangle` · 400 | `24px / 1.20` | `-0.02em` | Mobile screen titles (`Explorar`, `Dossiê`, `Comparar`) |
| **Card Title** | `typography.cardTitle` | `Switzer` · 700 | `17px / 1.20` | `-0.01em` | Layer 1 Verdict headline (`≤ 40 chars`) |
| **Body** | `typography.body` | `Switzer` · 400 | `15px / 1.55` | `0em` | Layer 2 concise bullets & compact Layer 3 method fields |
| **Microcopy** | `typography.microcopy` | `Switzer` · 500 | `12px / 1.40` | `0em` | Supporting subtitles (`≤ 24 chars` in 2×2 matrix) |
| **Cadastral Code (L3)** | `typography.cadastralTagLayer3` | `Switzer` · 600 (Uppercase) | `11px / 1.20` | `+0.06em` | **Hidden by default** — shown inside Layer 3 proof (`SOL-NASC`, `DSQFL`) |
| **Hero Metric** | `typography.metricHero` | `Switzer` · 800 (`tnum`) | `30px–36px / 1.08` | `-0.02em` | Monthly total (`~R$ 6.405`), asking price (`R$ 690.000`) |

### 1.4 Architectural Geometry: Radii, Hairlines & Elevation
- **Tight Radii (`4 / 6 / 8 / 10 / 12 px`):**
  - `4 px`: subtle inline metric chips / bars
  - `6 px`: secondary containers / thumbnails
  - `8 px`: buttons, inputs, and filter chips (architectural rectangular crispness — NO `9999px` pill bloat)
  - `10 px`: symbol tiles and chart stages
  - `12 px`: **hard ceiling** for all Audit Cards, Vital Matrices, and Photo Hero Cards
  - `9999 px`: reserved strictly for compact segmented track switches and the floating mobile bottom dock
- **Zero Nested Boxes:** Never place bordered rounded boxes inside cards. Separate regions inside a card using open whitespace (`12–20 px`) and `1px solid #E4DFD5` horizontal hairlines.
- **Flat Surface Polarity:** Content cards carry `box-shadow: none`. Reserve warm Forest shadows (`rgba(20, 45, 45, ...)`) exclusively for the floating mobile dock and modal drawers.

---

## 2. Explainability Grammar — The VEREDA Diagnostic / Audit Card

Every VEREDA audit module strictly obeys the **3-Layer Progressive Disclosure Contract**:

```
┌───────────────────────────────────────────────────────────┐
│ LAYER 1 · INSTANT VERDICT (< 1.5s)                        │
│ | 3px Left Accent Rule + Plain Category · Status Text     │
│ Verdict Headline (<= 40 chars, human impact first)        │
│ Anchor Metric (tabular-nums) + tap-to-reveal [Fonte ⓘ]    │
├───────────────────────────────────────────────────────────┤
│ LAYER 2 · CONCENTRATED VISUAL PROOF (< 3s)                │
│ 1 Bespoke Direct-Labeled SVG  OR  <= 2 Scannable Bullets  │
├───────────────────────────────────────────────────────────┤
│ LAYER 3 · DEPTH ON DEMAND (Collapsed, >= 48px, Compact)   │
│ [Fonte e cálculo                                      ∨ ] │
│  -> Expands lightweight 2-col hairline 6-field Method     │
│     (Fonte · Data · Mede | Cálculo | Limite | Na visita)  │
└───────────────────────────────────────────────────────────┘
```

### 2.1 Hard Density & Layer 3 Compression Limits
- **Layer 1 Headline:** `≤ 40 characters` (max 2 lines on `390 px`). Plain Portuguese — **zero internal codes** (`SOL-NASC`, `ITBI-ALTO`, `DSQFL` stay tucked inside Layer 3).
- **Tap-to-Reveal Metric Sources:** Key labels like `Mediana no prédio` or `Custo total mensal` carry a subtle tap/hover `Fonte` trigger revealing provenance (`ITBI · Pref. Recife · 16 vendas`) inline without cluttering the resting view.
- **Compact 2-Column Layer 3 `FichaDeMetodo` (matches [fichaDeMetodo.ts](file:///home/v/Documents/vereda/veredas/src/dados/fichaDeMetodo.ts)):** Zero nested boxes, clean `1px` hairlines, ≤ 85 total words across all 6 mandatory fields:
  - **Linha 1 (3 colunas):** `Fonte` · `Data` · `Mede` (plus technical key like `SOL-NASC` / `DSQFL` here only)
  - **Linha 2:** `Cálculo:` 1 concise phrase
  - **Linha 3:** `Limite:` 1 concise phrase
  - **Linha 4 (barra `2px` `#1E507B`):** `Na visita:` 1 direct check
- **Epistemic Tag & `"Sem leitura"` Rule:** Missing data renders a calm dashed frame (`#CCC6B9`) stating `"Sem leitura"` with zero invented fallback scores and explicit exclusion from averages.

### 2.2 WAI-ARIA APG & Keyboard Contract (`frontend-inspo: shadcn` + W3C APG)
1. **Layer 3 Disclosure (`Fonte e cálculo` / `Ver composição`):** `<button type="button" aria-expanded="false|true" aria-controls="panel-id">` (`min-height: 48px`, rotating chevron `180deg`). Panel carries `id`, `role="region"`.
2. **Tabs:** `role="tablist"` with `role="tab"`, `aria-selected`, `aria-controls` and `ArrowLeft`/`ArrowRight`/`Home`/`End` keyboard navigation.
3. **Drawers / Modals:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, `Escape` closes, focus returns to trigger.
4. **Visible Focus Ring:** `outline: 2px solid #1E507B; outline-offset: 2px` on `:focus-visible`.

---

## 3. Bespoke DataViz System & Visual Lexicon

**Core Rule:** *Zero ping-pong legends, zero fat bubbly bars, zero duplicated noise.*

### 3.1 Five Signature VEREDA Visualization Patterns

| # | Pattern Name | When to Use / Avoid | Anatomy & Color Rules | Direct Labeling & Compliance Rules | Empty / `"Sem leitura"` State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Mapa Solar & Brisa 2.5D** | Show afternoon heat, physically connected shadow, and E-SE breeze by hour & floor. *Avoid without confirmed building.* | Connected extruded isometric prism (lit face `#FCFBF9`, self-shaded `#E4DFD5`, roof with active facade highlight `#0F6E65`/`#EA580C`, dashed floor line moving 1º–24º, anchored base shadow `rgba(20,45,45,0.16)`, smooth E-SE breeze vector). | Top 1-line human verdict (`Frente Nascente · Fresco às 15h` + `-1,4 °C`); clean 2-row hairline controls below (`Hora` + `Verão/Inverno`; `Fachada` + `Andar` + `Torres futuras`). Azimuth degrees hidden in Layer 3. | Dashed outline: `"Sem leitura solar — confirme o edifício no cadastro."` |
| **2** | **Preço vs. Mediana** *(2 Variações)* | Compare asking price against real building transactions without speculating on price targets. *Avoid < 3 deeds.* | **Variação A (`Espectro Fino`):** Razor-thin `3.5px` vertical histogram ticks (`#142D2D` bulk, `#0F6E65` `Mediana`, `#EA580C` `Anúncio`).<br>**Variação B (`Régua do App`):** Sleek horizontal range track with interquartile band (`P25–P75`), vertical `Mediana` tick, and Solar `Anúncio` pin. | Labels say **`Mediana`** (not `"ITBI"` upfront); `"ITBI"` appears on tap or in Layer 3. **FORBIDDEN:** zero target/counter-offer price and zero inline disclaimer banners. | `"Sem leitura — menos de 3 vendas registradas no prédio."` |
| **3** | **Custo Total Mensal** | Translate purchase price + fixed bills into total monthly outflow with interactive component breakdown. | Thick rounded semicircular SVG arc (`#142D2D` Financiamento, `#0F6E65` Cond.+IPTU, hatched `#EA580C` Luz est.) + centered monthly figure (`~R$ 6.405/mês`) + subtitle `Estimativa com 20% de entrada`. | Expandable **`Ver composição do total ∨`** opens exact itemized values (`Financiamento`, `Condomínio`, `IPTU cadastro`, `Luz estimada`) + `20% / 30% / 50%` entry toggles. | `"A calcular — informe preço ou condomínio."` |
| **4** | **Corte Vertical "Cota & Sossego"** | Pair physical flood elevation (`+m`) with day/night acoustic comfort zone. | Left: street water baseline (`#1E507B`) + vertical elevation ruler (`+9,9 m`). Right: clean comfort track + ABNT NBR 10151 `50 dB(A)` tick. | **MANDATORY:** every decibel readout MUST include **`estimativa`** (e.g., `~44 dB(A) · estimativa`). | `"Sem leitura — prédio não vinculado ao lote."` |
| **5** | **Comparar Editorial (Sem Tabelão)** | Compare 2 finalists without dense spreadsheet tables. | Top split photo cards (`A` vs `B`) with 1 sharp takeaway sentence each, followed by **visual divergence bars showing only what differs** (`Preço`, `Espaço`, `Custo mensal`, `Sossego noite`). | Criteria that tie collapse into 1 quiet footer line (`Empatam em: Sol Nascente`). No overall winner ranking. | `"Sem leitura"` metric stays neutral and excluded from divergence bars. |

### 3.2 Lexicon of 16 Angular Semantic Symbols (`Símbolo + 2 Palavras`)
Clean `24 px` geometric icons standing directly beside/above metrics without cramped mini-boxes (`#F47745` on `#142D2D` dark surfaces, `#142D2D` or `#BC4010` on light paper). *Technical codes (`SOL-NASC`, `ITBI-OK`, etc.) are displayed ONLY in the design lexicon and Layer 3 proofs — never as Layer 1 UI kickers.*

---

## 4. UX Writing & Condensation Rules

- **Human-First Impact:** Lead with lived clarity (`Fresco à tarde`, `Custo total mensal`, `Mediana no prédio`), never internal acronyms (`DSQFL`, `HAND`, `TWI`, `ITBI` upfront when `"Mediana"` is clearer).
- **Zero Prohibited Judgments:** Never output `seguro`, `perigoso`, `caro`, `barato`, `vale a pena`, `ótimo`, `ruim`, `prédio-caixão`, neighborhood rankings, or target prices.
- **Mandatory Qualifier:** Every `dB(A)` number includes **`estimativa`**.
- **Layer 3 Compression:** Keep every `FichaDeMetodo` row `≤ 12 words` so expanding details feels crisp and scannable, never like reading a wall of text.

---

## 5. Omnichannel Grid, Canva Brand Kit & Framework Handoff

| Spec | Mobile App (`390 px` Primary) | Web Landing & App (`1440 px`) | Instagram Carousel (`1080 × 1350 px`, 4:5) |
| :--- | :--- | :--- | :--- |
| **Grid & Margins** | 1 col, `16 px` outer margin, `14 px` gap | 12 cols (`max-width: 1200 px`), `24 px` gutter | Safe zone: `88 px` top/bottom, `80 px` sides |
| **Wordmark** | `Switzer` Bold `14 px` (`+0.16em`) | `Switzer` Bold `17 px` (`+0.16em`) | `Switzer` Bold `28 px` (`+0.16em`) |
| **Display Heading** | `Geist Serif Triangle` `24 px` | `Geist Serif Triangle` `38–48 px` | `Geist Serif Triangle` `68–82 px` |
| **Card / Button Radius** | `12 px` card / `8 px` button | `12 px` card / `8 px` button | `12 px` inner card |
| **DataViz Adaptation** | Single chart per card, crisp `8 px` controls | 2-col grid + `Espectro Fino / Régua` toggle | Strip controls; enlarge strokes & direct labels (`Mediana`, `Anúncio`) |

### Canva Brand Kit (Copy-Paste)
- **Hex Colors:** `#F6F4EF` (Porcelain), `#FCFBF9` (Elevated), `#ECEAE3` (Sand), `#142D2D` (Deep Forest), `#C44312` (Solar CTA), `#EA580C` (Solar Mark), `#F47745` (Solar on Dark), `#0F6E65` (Favorable Teal), `#945306` (Ochre), `#B33124` (Terracotta), `#1E507B` (Cadastral Blue).
- **Fonts:** Upload `Switzer` (`400`, `600`, `700`, `800`) + `GeistSerif-Triangle.woff2` (for ≥ 24px editorial titles). *Canva Free fallback:* `Plus Jakarta Sans` + `Cormorant Garamond`.
