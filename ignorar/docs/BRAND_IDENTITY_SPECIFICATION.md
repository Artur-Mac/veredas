# VEREDA — Brand Identity & Design System Specification
**Origin:** Google Stitch & Pomelli Design Explorations  
**Recommended Direction:** Direção 04 (*Híbrida Contemporânea: Chassi Editorial com Inscrição Cartográfica*)  
**Art Director:** Walter  

---

## 1. Brand Concept & Etymology

> **Vereda:** From Latin *verēda*, a narrow, clear path traced by pedestrians; an orienting shortcut through dense, uncharted territory. In Brazilian literature and geography (*Grande Sertão: Veredas*), a vereda is also an oasis ecosystem lined with buriti palms that provides clear water and safe passage through the arid sertão.

The brand does **not** signify rural tourism, hiking, or ecology. In the context of housing intelligence, VEREDA represents **wayfinding through the opaque jungle of real estate marketing**.

---

## 2. Core Visual Tension

VEREDA balances two distinct traditions:
1. **The Noble Craft of Architecture:** High-contrast editorial display typography, warm tactile paper, disciplined proportions, and brutalist structural weight.
2. **Analytical Urban Intelligence:** Monospace telemetry, cadastral lot codes, cartographic route lines, and topographic isolines.

---

## 3. Color Tokens & Semantic Roles

| Swatch | Token | Hex | Role & Functional Behavior |
| :---: | :--- | :--- | :--- |
| ![#F47745](https://via.placeholder.com/15/F47745/000000?text=+) | `--color-signal-orange` | `#F47745` | **Decisões & Foco:** Primary interactive buttons, route vectors, critical discoveries. |
| ![#FDF1EB](https://via.placeholder.com/15/FDF1EB/000000?text=+) | `--color-signal-orange-light` | `#FDF1EB` | **Acentos Suaves:** Pill highlights, active tabs, hover states. |
| ![#171717](https://via.placeholder.com/15/171717/000000?text=+) | `--color-near-black` | `#171717` | **Estrutura & Autoridade:** Primary headlines, rigid cadastral bounds, dark CTA buttons. |
| ![#F2EBDD](https://via.placeholder.com/15/F2EBDD/000000?text=+) | `--color-warm-paper` | `#F2EBDD` | **Superfície Editorial:** Background substrate separating the product from sterile SaaS. |
| ![#B94E36](https://via.placeholder.com/15/B94E36/000000?text=+) | `--color-deep-rust` | `#B94E36` | **Profundidade & Solo:** Alert borders, dense metadata, hazard pills. |
| ![#7F8870](https://via.placeholder.com/15/7F8870/000000?text=+) | `--color-muted-sage` | `#7F8870` | **Geografia & Ambiente:** Parks, slope comfort, municipal legal exemptions. |

---

## 4. Typography System

* **Display (Editorial Serifs):**
  * Primary: `DM Serif Display` or `Fraunces`
  * Weight: Regular / Italic
  * Style: Sharp triangular serifs, high stroke contrast. Used for hero headings and narrative titles.
* **Interface & Body:**
  * Primary: `Plus Jakarta Sans` or `Inter`
  * Weight: 400 (Regular), 500 (Medium), 600 (Semi-bold), 700 (Bold)
  * Style: Clean, humanistic geometry, generous x-height for mobile legibility.
* **Cadastral Telemetry & Data:**
  * Primary: `JetBrains Mono` or `Space Mono`
  * Weight: 500 (Medium), 600 (Bold)
  * Style: All-caps, tracked (+0.8px to +1.5px), used for IDs (`VRD-SP-2026-9041`), monetary breakdowns, and official municipal tags (`TOMBADO CONDEPHAAT`, `ZONEAMENTO ZER-1`).

---

## 5. UI Surface Principles

* **No Generic Drop Shadows:** Use solid 1px architectural hairline borders (`#E5DCB8`) combined with minimal elevation.
* **Grid Discipline:** Everything conforms to an 8pt architectural grid system.
* **Tactile Grounding:** Backgrounds evoke high-grade architectural paper stock rather than sterile white screens.
