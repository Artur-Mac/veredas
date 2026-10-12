# Revisão da Apresentação v2 & Governança da Fonte Única de Verdade
**Campus Mobile 15ª Edição — Apresentação Executiva**  
**Data:** Outubro de 2026

---

## 1. Resolução do Problema da "Fonte Única de Verdade" (*Source of Truth*)

### O Diagnóstico Anterior:
O repositório mantinha uma duplicidade de código problemática:
1. O arquivo `docs/pitch/deck_slides.html` (8 slides antigos com grades repetitivas e erros de impressão).
2. Uma string estática idêntica embutida dentro de `tests/generate_deck.py` que, se executada, sobrescrevia silenciosamente qualquer melhoria feita diretamente no HTML.

### A Nova Governança Estabelecida:
1. **Arquivo Canônico Oficial:**
   * **`docs/pitch/deck_slides_v2.html`** é agora a **única fonte primária e editável** da apresentação executiva do VEREDA.
   * Qualquer alteração de texto, dados ou estilo deve ser feita diretamente nele.
2. **Papel de `tests/generate_deck.py`:**
   * O script foi refatorado para atuar como **orquestrador de compilação, validação e exportação de artefatos**.
   * Ele não contém marcação HTML duplicada hardcoded.
   * Ele lê `docs/pitch/deck_slides_v2.html`, valida a integridade do DOM e das fontes de dados, aciona a renderização de capturas em alta resolução (`docs/pitch/previews/`), compila o PDF oficial (`docs/pitch/deck_slides_v2.pdf`) e atualiza a prancha de contato (`docs/pitch/slide_contact_sheet.png`).
3. **Preservação do Histórico:**
   * O arquivo legado `docs/pitch/deck_slides.html` (v1) foi preservado intacto para referência histórica e rastreabilidade da evolução do projeto durante o sprint.

---

## 2. Quadro Comparativo: Deck v1 vs. Deck v2 Canônico

| Dimensão | Apresentação v1 (Legada) | Apresentação v2 (Canônica Atual) |
|---|---|---|
| **Número de Slides** | 8 slides longos | **7 slides precisos** (otimizados para 3 min de fala) |
| **Composição Visual** | 8 variações do mesmo grid de cartões arredondados | **Composição editorial variada:** Capa monumental, dado tipográfico assimétrico, fluxo horizontal, dossiê densamente anotado, matriz estratégica e fechamento limpo |
| **Integridade dos Dados** | Estatística falsa de 73%, omissão explicada como conspiração | **IBGE/POF auditado (36,6%)**, foco no modelo econômico de leads e Lei do Inquilinato (Art. 22) |
| **Matemática da Ladeira** | Erro de cálculo (+22m em 620m chamado de 8,4%) | **Reconciliação estrita:** 3,55% médio, trecho crítico de 8,33% (+15m em 180m), Tobler Hiking Function aplicada (~9,5 min reais vs. 3 min anunciados) |
| **Custo Efetivo** | R$ 4.000 vs R$ 4.410 sem discriminação transparente | **Decomposição clara:** Aluguel (R$ 3.400) + Condomínio (R$ 600) + Portaria remota (+R$ 210) + Fundo de obras (+R$ 135) + Seguro (+R$ 65) |
| **Tratamento da Impressão** | Slides absolutos se sobrepondo na 1ª página | **CSS `@media print` impecável:** `@page { size: 16in 9in; }`, `break-after: page`, 7 páginas perfeitas |
| **Exportação PDF** | Inexistente / Quebrada | **`docs/pitch/deck_slides_v2.pdf` gerado e auditado (7 páginas)** |
| **Prancha de Contato** | Inexistente | **`docs/pitch/slide_contact_sheet.png` em alta definição (1920x1080)** |

---

## 3. Instruções para a Equipe de Apresentação

* **Para Apresentar em Tela Cheia:**
  Abra `docs/pitch/deck_slides_v2.html` no navegador. Use as teclas `Seta Direita` ou `Barra de Espaço` para avançar, `Seta Esquerda` para recuar, ou as teclas numéricas de `1` a `7` para salto direto.
* **Para Compartilhar em PDF:**
  Utilize diretamente o arquivo `docs/pitch/deck_slides_v2.pdf`.
* **Para Re-exportar Artefatos:**
  Execute `python3 tests/generate_deck.py`.
