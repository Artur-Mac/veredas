# VEREDAS — BRAND GUIDELINES & DESIGN SYSTEM EDITORIAL-TÉCNICO
**Versão:** 2.0 (Edição Recife Real & Perícia Urbana)  
**Papel:** Staff Product Engineer, Data Engineer & Lead Design Technologist  
**Status:** Especificação Canônica e Vinculante

---

## 1. Manifesto: Jornalismo de Dados & Perícia Urbana

O **Veredas** rompe deliberadamente com a estética hegemônica de "SaaS genérico" e "AI Slop". Enquanto portais imobiliários operam sob a lógica da publicidade e da camuflagem comercial, o Veredas atua como um **tribunal técnico de perícia urbana**. 

Nossa linguagem visual herda os cânones do **design editorial impresso**, dos **laudos de engenharia diagnóstica**, da **cartografia de precisão** e do **jornalismo investigativo de dados**.

---

## 2. Bloqueio Estrito Anti-AI-Slop (Normas Negativas)

Fica terminantemente proibido nos repositórios, componentes e artefatos do Veredas:

| Elemento Proibido | Razão Pericial | Substituição Obrigatória |
| :--- | :--- | :--- |
| **Gradientes roxos / neon / elétricos** | Evocam templates genéricos de IA gerativa e falsidade algorítmica. | Papel técnico e tintas estruturais sólidas. |
| **`background-clip: text` gradiente** | Dificulta contraste e reduz autoridade pericial. | Texto sólido em `--veredas-ink-primary` ou semântico. |
| **Fontes genéricas (`Inter`, `Roboto`, `Arial`)** | Visual indiferenciado e burocrático de software padrão. | Tríade tipográfica: `Instrument Serif`, `Plus Jakarta Sans` e `JetBrains Mono`. |
| **Sombras difusas e blur excessivo** (`box-shadow: 0 10px 30px rgba(...)`) | Tentativa de esconder limites estruturais com névoa visual. | Sombra dura arquitetônica (`box-shadow: 4px 4px 0px #141413` ou `8px 8px 0px #141413`). |
| **Cantos arredondados (`border-radius > 0px`)** | Aspecto infantilizado e concessão a tendências efêmeras. | Geometria ortogonal estrita: `border-radius: 0px` absoluto em botões, cards, inputs e modais. |
| **Ícones de estrelinhas de IA (✨, 🪄, sparkles)** | Reduz a análise matemática e forense a um "passe de mágica". | Selos periciais, carimbos cadastrais e índices tabulares precisos. |

---

## 3. Paleta de Superfícies (Papel Técnico)

O substrato visual remete ao papel kraft técnico, folhas milimetradas de pranchetas de arquitetura e documentos periciais:

| Token CSS | Hexadecimal | Papel / Aplicação |
| :--- | :--- | :--- |
| `--veredas-bg-paper` | `#F4F1EA` | Fundo principal da aplicação com malha pontilhada técnica sutil. |
| `--veredas-bg-card` | `#FAF8F4` | Superfície de painéis, fichas e laudos analíticos. |
| `--veredas-bg-subtle` | `#EAE5DA` | Cabeçalhos de tabelas técnicas, barras de metadados e tags neutras. |
| `--veredas-ink-primary` | `#141413` | Texto principal, títulos e bordas estruturais rígidas (`1.5px solid #141413`). |
| `--veredas-ink-secondary` | `#4A4843` | Descrições secundárias, legendas e textos auxiliares de alta legibilidade. |
| `--veredas-ink-muted` | `#78746C` | Rótulos de metadados, carimbos de tempo e linhas de grid secundárias. |
| `--veredas-border` | `#D5CFC2` | Divisórias internas secundárias em tabelas e seções. |

---

## 4. Cores Semânticas de Perícia Urbana (Recife Grounding)

Cores selecionadas para transmitir diagnóstico técnico auditável e ancoragem territorial no Recife:

| Token CSS | Hex (Fundo / Texto) | Significado Pericial no Território do Recife |
| :--- | :--- | :--- |
| `--veredas-alert`<br>`--veredas-alert-bg` | `#C84B31`<br>`#F9EBE8` | **Terracota Recife:** Alerta crítico. Sobrepreço severo, divergência grave de metragem no ESIG Recife, omissão de face Poente com calor crítico, patologia estrutural nas fotos. |
| `--veredas-valid`<br>`--veredas-valid-bg` | `#1B5E40`<br>`#E6F2EC` | **Verde Mangue:** Validação pericial. Preço abaixo da mediana do hexágono H3, arbitragem favorável entre imobiliárias, cadastro predial ESIG íntegro. |
| `--veredas-warn`<br>`--veredas-warn-bg` | `#B86B11`<br>`#FDF3E4` | **Âmbar Técnico:** Atenção / Lacuna. Informação omitida no anúncio, condomínio com taxa extra iminente, risco moderado de alagamento por maré de sizígia. |
| `--veredas-official`<br>`--veredas-official-bg` | `#1D4E89`<br>`#EBF1F8` | **Azul Cadastral:** Base oficial cruzada. Registros validados do ESIG Recife, Guia de ITBI Municipal, Malha Setorial IBGE e OpenStreetMap. |

---

## 5. Tríade Tipográfica

A tipografia do Veredas combina autoridade editorial literária, clareza humanística de interface e precisão monospaçada tabular:

### 1. Manchetes e Score Veredas: `Instrument Serif`
- **Uso:** Vereditos periciais, manchetes investigativas e o Score Veredas principal (0–100).
- **Características:** Serifa triangular afiada, proporções nobres, resgate da tradição impressa do jornalismo investigativo clássico.

### 2. Interface e Leitura Contínua: `Plus Jakarta Sans`
- **Uso:** Parágrafos de laudo, checklists de visita, explicações de divergência, labels de botões e navegação.
- **Características:** Geometria humanista com generosa altura de x, legibilidade impecável em telas densas.

### 3. Telemetria e Cadastros: `JetBrains Mono`
- **Uso Obrigatório:** TODOS os valores monetários (`R$ 720.000`), metragens quadradas (`118 m²`), índices espaciais (`h3_index: 8880026e67fffff`), códigos de habite-se (`HAB-1984/0192`), carimbos e tabelas comparativas.
- **Configuração:** `font-variant-numeric: tabular-nums` para alinhamento vertical estrito de colunas numéricas.

---

## 6. Geometria, Grid e Sombras Estruturais

- **Zero Border-Radius:** `border-radius: 0px` em botões, inputs, painéis, modais e badges.
- **Bordas Estruturais:** `1.5px solid #141413` delimitando contornos de autoridade.
- **Sombras Duras:** Projeções ortogonais sem gradiente de opacidade:
  - Cards e painéis destacados: `box-shadow: 4px 4px 0px #141413;`
  - Modais, gavetas e laudo pericial: `box-shadow: 8px 8px 0px #141413;`
  - Efeito de clique em botões: `transform: translate(2px, 2px); box-shadow: 2px 2px 0px #141413;`

---

## 7. Experiência de Usuário: Revelação Progressiva

A interface disponibiliza o seletor de modo global:
1. **Modo Curioso:** Focado em síntese para compradores e inquilinos que necessitam de respostas rápidas:
   - Manchete de Veredito Direto
   - Score Veredas (0–100)
   - Custo Real Mensal Auditado
   - Menor Preço Multi-Imobiliária
   - Prancheta de Visita Essencial
2. **Modo Detetive:** Revela toda a profundidade técnica pericial:
   - Dissecador de Anúncio com notas `[1]`, `[2]` e correlações forenses
   - Inspetor de Fotos com Bounding Boxes de visão computacional (lente 0.5x, patologias, CAPEX)
   - Auditoria Oficial Cruzada (ESIG Recife / IPTU / ITBI)
   - Decomposição Matemática Preço Justo (Waterfall SHAP)
   - Malha H3 Interativa e Camadas de Resiliência Hidro-Urbana & Conforto Térmico
