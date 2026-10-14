---
name: veredas-editorial-ui
description: Design System Editorial e Perícia Urbana do Veredas (Papel Técnico, Anti-AI-Slop, Instrument Serif, JetBrains Mono, border-radius 0px)
---

# VEREDAS EDITORIAL UI — GUIA DE ESTILO E TOKENS DE PERÍCIA URBANA

## Identidade Visual: Jornalismo de Dados & Perícia Urbana
O Veredas utiliza uma estética de documento pericial impresso, laudo arquitetônico e cartografia de alta precisão.

### 🚫 Bloqueio Estrito Anti-AI-Slop:
- PROIBIDO gradientes roxos, neon, azul brilhante ("AI slop / cyberpunk / SaaS genérico").
- PROIBIDO `background-clip: text` ou texto brilhante.
- PROIBIDO cantos arredondados (`border-radius > 0px`). Todo elemento tem `border-radius: 0px`.
- PROIBIDO sombras difusas ou efeito névoa (`box-shadow: 0 10px 30px rgba(...)`).
- PROIBIDO ícones de estrelinhas de IA (✨, 🪄, sparkles). Use terminologia técnica pericial.

### 🎨 Paleta de Papel Técnico:
- `--veredas-bg-paper: #F4F1EA` (Fundo principal com textura pontilhada sutil)
- `--veredas-bg-card: #FAF8F4` (Superfície de fichas e laudos)
- `--veredas-bg-subtle: #EAE5DA` (Cabeçalhos e barras de metadados)
- `--veredas-ink-primary: #141413` (Texto principal e bordas estruturais `1.5px solid #141413`)
- `--veredas-ink-secondary: #4A4843` | `--veredas-ink-muted: #78746C`

### 🧭 Cores Semânticas de Perícia Urbana:
- `--veredas-alert: #C84B31` / `--veredas-alert-bg: #F9EBE8` (Terracota Recife: sobrepreço, divergência ESIG, face Poente)
- `--veredas-valid: #1B5E40` / `--veredas-valid-bg: #E6F2EC` (Verde Mangue: preço justo, cadastro íntegro, arbitragem favorável)
- `--veredas-warn: #B86B11` / `--veredas-warn-bg: #FDF3E4` (Âmbar: omissão, cota extra, maré moderada)
- `--veredas-official: #1D4E89` / `--veredas-official-bg: #EBF1F8` (Azul Cadastral: fontes oficiais ESIG Recife, ITBI)

### 🔤 Tríade Tipográfica:
- `Instrument Serif`: Manchetes editoriais de veredito e Score Veredas (0–100).
- `Plus Jakarta Sans`: Textos corridos, formulários e checklists.
- `JetBrains Mono` (`font-variant-numeric: tabular-nums`): TODOS os valores monetários (`R$`), metragens (`m²`), índices `h3_index`, selos e tabelas comparativas.

### 📐 Geometria e Sombras Estruturais:
- `border-radius: 0px` absoluto em botões, tags, inputs, tabelas e modais.
- Sombras duras e estruturais: `box-shadow: 4px 4px 0px #141413` e `box-shadow: 8px 8px 0px #141413`.
- Bordas estruturais de `1.5px solid #141413`.
