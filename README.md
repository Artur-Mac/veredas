# VEREDA — Housing Decision Intelligence Platform

> **"Transforming fragmented property listings, municipal open data, cadastral records, and environmental context into traceable evidence, contextual interpretation, and empowering next steps."**

---

## 🏛️ Project Overview

**VEREDA** is an early-stage, mobile-first housing decision intelligence platform built for the Brazilian real estate market, developed for the **15ª Edição do Campus Mobile** (Category: *Tecnologias Urbanas*).

When choosing where to live, home seekers face severe information asymmetry. Portals and classifieds only display marketing-curated highlights:
* Street numbers are frequently omitted.
* Recurring condominium fees, auxiliary charges, and special assessments are hidden.
* Topographic steepness, flood history, and urban noise are not disclosed.
* Neighboring construction permits and legal encumbrances are invisible.

VEREDA bridges the gap between **finding an advertisement** and **understanding what it actually means to live in that property**.

---

## 🧭 The Core Mechanism

Rather than outputting opaque, gamified scores or crawling endless listings, VEREDA operates on an evidence-first principle:

```
[Listing URL / Address Intake]
       ↓
[Entity & Building Cadastral Resolution]
       ↓
[Traceable Evidence Synthesis] ───→ "O que é fato verificado"
       ↓
[Contextual Human Interpretation] ───→ "Por que importa para sua vida"
       ↓
[Actionable Unknowns & Next Steps] ───→ "O que perguntar antes da visita"
```

---

## 📱 Interactive Mobile Prototype

A fully functional, self-contained mobile web prototype is available in this repository:

* **File:** [`index.html`](./index.html)
* **Design Philosophy:** Editorial architecture, Swiss Grid alignment, warm tactile paper surfaces, and zero "generic blue SaaS" aesthetics.
* **Key Flows Demonstrated:**
  1. **Intake Terminal:** Paste real estate URLs (QuintoAndar, ZAP, Loft) or enter manual street addresses.
  2. **Investigative Telemetry Pipeline:** Multi-step resolution with cadastral (CNEFE/IBGE), territorial (GeoSampa/SisRBC), and topographic layers.
  3. **Candidate Building Resolution:** Resolves building identity when listings omit exact street numbers.
  4. **Audited Monthly Outlay:** Strikethrough advertised price vs. audited total cost (`R$ 4.410` vs. `R$ 4.000 anunciado`).
  5. **Evidence Ledger:** Findings structured by *Finding → Why It Matters → Action*, covering noise from adjacent 28-story construction, slope impact on subway walking routes, and municipal tax exemptions.
  6. **Interactive Visit Checklist:** Dynamic field inspection points generated from document unknowns.
  7. **1-Click WhatsApp In-Field Generator:** Auto-generates concise, courteous inquiries for real estate brokers before booking visits.
  8. **Trade-Off Matrix:** Side-by-side comparison without arbitrary 0–10 scores, powered by narrative trade-off syntheses.
  9. **Search Workspace ("Minha Busca"):** Active dossier monitoring and transparent discard logging.

### How to Run Locally:
```bash
# Simply open index.html in any modern browser:
open index.html
# Or serve locally:
python3 -m http.server 8080
# Open http://localhost:8080 in mobile emulation mode (F12)
```

---

## 🎨 Brand Identity & Design Tokens

VEREDA's visual system follows **Direction 04: Chassi Editorial com Inscrição Cartográfica** developed in Google Stitch and Pomelli:

| Token | Hex | Name | Functional Purpose |
| :--- | :--- | :--- | :--- |
| `--color-signal-orange` | `#F47745` | **Signal Orange** | Critical discoveries, cartographic vectors, primary CTAs |
| `--color-near-black` | `#171717` | **Near Black / Ink** | High-contrast editorial typography, rigid cadastral bounds |
| `--color-warm-paper` | `#F2EBDD` | **Warm Paper** | Tactile, human, anti-sterile editorial substrate |
| `--color-deep-rust` | `#B94E36` | **Deep Rust** | Density layers, hazard highlights, cadastral metadata |
| `--color-muted-sage` | `#7F8870` | **Muted Sage** | Bioclimatic layers, green zones, verified exemptions |

* **Typography:** `DM Serif Display` / `Fraunces` (Editorial Display) + `Plus Jakarta Sans` / `Inter` (Interface) + `JetBrains Mono` (Cadastral Telemetry).
* **Wordmark:** Distinctive sharp-cut serif **VEREDA** with an orange dashed cartographic route vector (`- - - - - - - -`).

---

## 📚 Repository Structure

```
.
├── index.html                       # Standalone interactive mobile prototype
├── README.md                        # Master project overview & documentation
├── research/                        # Strategic Research Arsenal & Cross-Industry Intelligence
│   ├── README.md                    # Master index, module guide & executive roadmap
│   ├── 01_MASTER_RESEARCH_ATLAS_STAGE1.md # Full 40k-word Stage 1 Monograph
│   ├── 02_DEEP_RESEARCH_ATLAS_STAGE2.md   # Full 30k-word Stage 2 Monograph
│   ├── summaries/                   # Fast-reading executive summaries & playbooks
│   ├── stage1_foundations/          # 9 Foundation monographs (PropTech critique, CV, GeoSampa)
│   └── stage2_deep_dive/            # 9 Deep-dive monographs (Brazil grounding, pairwise engine)
├── docs/
│   ├── VEREDA_IMPROVEMENT_ROADMAP_EPOCHS.md  # 6-Epoch comprehensive technical & UI spec
│   ├── BRAND_IDENTITY_SPECIFICATION.md       # Full design system tokens & rules
│   ├── CAMPUS_MOBILE_BRIEF.md                # Project brief, problem statement & team roles
│   ├── PRD-PropSight.md                      # Product Requirements Document
│   └── references/                           # Analytical reference briefs & PDFs
└── assets/
    ├── brand/                       # Google Stitch Brand Book & wordmark studies
    └── screenshots/                 # Application screen captures & UX flows
```

---

## 🔬 Strategic Research Arsenal

The repository features an exhaustive research arsenal located in [`research/`](./research/README.md), covering over 70,000 words of cross-industry investigation, sensor proxies, Brazilian open data integration, and behavioral decision mechanics:

* **[Master Atlas (Stage 1)](./research/01_MASTER_RESEARCH_ATLAS_STAGE1.md):** 105 decision mechanisms, cross-industry analogies (aviation, diagnostics, finance, dating), and Brazilian municipal GIS integration (GeoSampa, CNEFE).
* **[Deep Research Atlas (Stage 2)](./research/02_DEEP_RESEARCH_ATLAS_STAGE2.md):** Epistemological audit, Brazilian hyper-local grounding (title deed encumbrances, water rodízio, structural legacies), revealed-preference pairwise engines, and the Anti-Listing architecture.
* **[Executive Summaries & Playbooks](./research/summaries/):** High-level decision guides synthesized for Campus Mobile evaluations and product development sprints.

---

## 🛡️ Scope & Methodology Statement

* **No Scrapers:** In accordance with project architecture and scope, this repository **does not contain any web scrapers, crawler scripts, or automated data harvesting pipelines**.
* **Public & Voluntary Data Focus:** All intelligence features are architected around voluntary user inputs, open municipal APIs, national census coordinates (CNEFE/IBGE), and authorized official open data repositories.

---

## 👥 Core Team (Campus Mobile)

* **Samuel:** Product Strategy & User Journey
* **Walter:** Visual Identity, Art Direction & Presentation Design
* **Artur:** Research, Data Validation, Architecture & Engineering Integration
