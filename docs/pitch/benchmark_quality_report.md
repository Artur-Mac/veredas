# Relatório de Qualidade & Benchmark Técnico do Pitch e Protótipo
**Projeto:** VEREDA (Campus Mobile 15ª Edição — Tecnologias Urbanas)  
**Data:** Outubro de 2026  
**Auditor Técnico:** Equipe de Engenharia VEREDA  
**Test Runner:** `tests/run_benchmarks.py`  
**Status Consolidado:** **43 Testes Executados — 43 Aprovados (100% PASS)**

---

## 1. Separação Metodológica dos Testes

Em estrito cumprimento às diretrizes do sprint, eliminamos afirmações infladas de desempenho baseadas apenas no tamanho de arquivos e separamos os testes em quatro categorias técnicas bem definidas:

1. **Checagens Estruturais:** Integridade do DOM, presença de telas e modais essenciais, economia de bytes e uso de vetores inline SVG.
2. **Qualidade de Dados & Rigor Matemático:** Reconciliação exata de cálculos topográficos (Tobler), decomposição monetária auditada e rastreabilidade de citações primárias.
3. **Apresentação Executiva & Paginação de Impressão:** Integridade do deck canônico v2, suporte a `@media print`, verificação do arquivo PDF compilado (`docs/pitch/deck_slides_v2.pdf`) e contagem exata de páginas via `pdfinfo`.
4. **Acessibilidade & Interatividade:** Contrastes cromáticos medidos sob a norma WCAG 2.1 AA, navegação por teclado e viewport responsivo mobile.

---

## 2. Resultados Detalhados por Categoria

### A. Checagens Estruturais da Aplicação (`index.html`)
* **Orçamento de Bytes:** O arquivo da aplicação possui **78,2 KB**, operando sem bibliotecas pesadas externas (React/Vue/Tailwind em CDN), garantindo renderização quase instantânea mesmo em redes móveis 3G/4G no Brasil.
* **Telas do Fluxo Mobile:** Validadas com sucesso as 6 telas centrais:
  * `#screen-home` (Intake de link do imóvel).
  * `#screen-loading` (Feedback visual com telemetria).
  * `#screen-dossier` (Exibição da tríade do Dossiê).
  * `#screen-checklist` (Checklist de vistoria de campo).
  * `#screen-compare` (Comparador de alternativas residenciais).
  * `#screen-saved` (Histórico de imóveis analisados).
* **Modais Interativos:** Validados os 3 modais de apoio: `#modalCandidate`, `#modalWhatsApp` (disparo de perguntas ao corretor) e `#modalCadastralProvenance` (exibição de metadados oficiais).
* **Gráficos Vetoriais:** 18 elementos `<svg>` inline mapeados no DOM (curvas altimétricas, cones de insolação e mapas de rota), reduzindo dependências de imagens externas pesadas.

---

### B. Qualidade de Dados & Rigor Matemático
* **Declividade Média da Ladeira:**
  * Distância: 620 metros | Desnível: +22 metros.
  * Fórmula: $(22 / 620) \times 100 = \mathbf{3,55\%}$ (**APROVADO**).
* **Trecho Crítico de Declividade (Segmento Íngreme):**
  * Distância: 180 metros | Desnível: +15 metros.
  * Fórmula: $(15 / 180) \times 100 = \mathbf{8,33\%}$ (**APROVADO**).
* **Velocidade de Caminhada em Subida (Tobler's Hiking Function):**
  * $W = 6 \cdot e^{-3.5 \cdot (0.0833 + 0.05)} = \mathbf{3,76\text{ km/h}}$ (vs. 5,03 km/h no plano).
  * Tempo real estimado de subida: **~9,5 minutos** (provando a falsidade dos "3 min a pé" alegados no anúncio comercial).
* **Decomposição do Custo Efetivo Mensal:**
  * Anunciado: R$ 3.400 (Aluguel) + R$ 600 (Condomínio declarado) = R$ 4.000.
  * Custos adicionais auditados: +R$ 210 (Portaria remota real) + R$ 135 (Fundo de reserva/obras) + R$ 65 (Seguro obrigatório).
  * Soma total: $\mathbf{R\$\ 4.410}$ (**APROVADO — Reconciliação Exata**).
* **Rastreabilidade de Fontes Oficiais:** Todas as 4 fontes basilares (GeoSampa, CNEFE/IBGE, POF/IBGE e Lei do Inquilinato Art. 22) constam com links e menções textuais transparentes.

---

### C. Apresentação Executiva & Paginação de Impressão (`deck_slides_v2.html`)
* **Contagem de Slides:** Exatamente **7 slides** no deck canônico v2.
* **Folha de Estilo de Impressão:**
  * `@media print` declarado com remoção de posicionamento absoluto em cascata.
  * `@page { size: 16in 9in; margin: 0; }` declarado para proporção nativa 16:9.
  * `page-break-after: always` e `break-after: page` aplicados a cada seção `.slide`.
* **Auditoria do PDF (`docs/pitch/deck_slides_v2.pdf`):**
  * Gerado com sucesso: **584,6 KB**.
  * Verificação via ferramenta de sistema `pdfinfo`: **Exatamente 7 páginas** (zero sobreposição de slides ou corte de texto).
* **Capturas Renderizadas Individuais:** As 7 imagens em `docs/pitch/previews/slide_01.png` a `slide_07.png` foram renderizadas via Firefox Headless em 1240x740, com integridade visual atestada.
* **Prancha de Contato Panorâmica:** `docs/pitch/slide_contact_sheet.png` gerada em 1920x1080 (388 KB).

---

### D. Acessibilidade Visual (WCAG 2.1 AA) & Interação
* **Near Black (`#171717`) sobre Warm Paper (`#F2EBDD`):** Contraste medido de **15,11:1** (Supera amplamente o limiar WCAG AA de 4,5:1).
* **Near Black (`#171717`) sobre Branco (`#FFFFFF`):** Contraste de **17,93:1** (PASS).
* **Deep Rust (`#B94E36`) sobre Branco (`#FFFFFF`):** Contraste de **4,99:1** (PASS para textos e badges).
* **Signal Orange (`#F47745`) sobre Near Black (`#171717`):** Contraste de **6,46:1** (Supera o limiar de 3,0:1 para elementos de destaque e botões).
* **Navegação por Teclado:** Event listener `keydown` cobre setas esquerda/direita, espaço e atalhos numéricos de 1 a 7.
* **Navegação Direta por URL:** Suporte a inicialização via hash (`#4`) e query parameter (`?slide=4`).

---

## 3. O que Permanece Não Testado (Limitações Honestas)

Para manter a integridade acadêmica e profissional diante da banca do Campus Mobile, registramos explicitamente as condições que **não foram testadas em ambiente automatizado**:

1. **Latência de Rede em APIs WFS Públicas Reais:** O protótipo atual opera sobre dados estruturados locais (fixtures fiéis aos esquemas do GeoSampa e CNEFE). O tempo de resposta sob tráfego concorrente nos servidores da Prefeitura de São Paulo ou EMPREL Recife será medido apenas no piloto da Etapa 2.
2. **Renderização em Motores Proprietários (Safari / WebKit iOS):** Os testes automatizados de renderização e exportação de PDF foram executados no motor Gecko (Mozilla Firefox 153 no Linux). Testes manuais em dispositivos móveis iPhone reais serão realizados na bateria presencial com usuários.
3. **Validação de Usabilidade Qualitativa com 30 Usuários:** As métricas de satisfação, clareza subjetiva dos termos do dossiê e taxa de clique nos botões de WhatsApp dependem da execução do piloto de campo programado para Novembro/Dezembro de 2026.
