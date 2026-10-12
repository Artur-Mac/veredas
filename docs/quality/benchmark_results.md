# Resultados dos Benchmarks de Engenharia e Qualidade — VEREDA

> **Ambiente de Teste:** Linux x86_64, Python 3.10  
> **Executor:** `tests/run_benchmarks.py`  
> **Data da Execução:** 12 de Outubro de 2026  
> **Resultado Geral:** 18 de 18 Verificações Aprovadas (100% PASS)

---

## 1. Resumo Executivo das Métricas

| Dimensão Testada | Alvo de Aceite | Resultado Obtido | Status |
| :--- | :---: | :---: | :---: |
| **Tamanho Total do Bundle** | < 150 KB | **78.24 KB** (Self-contained) | ✅ EXCELENTE |
| **Dependências Externas Bloqueantes** | 0 frameworks JS | **0 dependências** (Vanilla JS/CSS) | ✅ APROVADO |
| **Contraste Texto Primário (Near Black / Paper)**| $\\ge 4.5:1$ | **15.11:1** (Passa em WCAG AAA) | ✅ APROVADO |
| **Contraste Botão Primário (Signal Orange / Black)**| $\\ge 3.0:1$ | **6.46:1** | ✅ APROVADO |
| **Contraste Alerta (Deep Rust / White)** | $\\ge 4.5:1$ | **4.99:1** | ✅ APROVADO |
| **Integridade de Telas Móveis** | 6 telas ativas | **6/6 Telas presentes e mapeadas** | ✅ APROVADO |
| **Modais de Intervenção** | 3 modais | **3/3 Modais estruturados** | ✅ APROVADO |
| **Infográficos Vetoriais Inline** | $\\ge 4$ SVGs | **18 SVGs nativos no DOM** | ✅ APROVADO |
| **Cidades e Perfis Cobertos** | SP e Recife | **3 propriedades com dados completos** | ✅ APROVADO |
| **Conformidade com a Tríade Editorial** | 100% dos achados | **100% estruturados (Fato/Impacto/Ação)** | ✅ APROVADO |

---

## 2. Detalhamento dos Resultados por Módulo

### A. Desempenho e Leveza Móvel
* **Tamanho do Arquivo:** `78.24 KB` (HTML + CSS + SVG + JS unificados).
* **Interpretação:** Em uma rede 4G comum brasileira (15 Mbps), o download completo da aplicação leva menos de **42 milissegundos**. Não há overhead de compilação, Webpack ou Node.js runtime, garantindo que o aplicativo funcione perfeitamente mesmo no 3G fraco dentro de garagens de subsolo durante vistorias.

### B. Acessibilidade e Contraste de Cores (WCAG 2.1 AA)
1. **Near Black (`#171717`) sobre Warm Paper (`#F2EBDD`):** Razão de **15.11:1** (Supera amplamente o padrão AAA de 7.0:1).
2. **Near Black (`#171717`) sobre Fundo Branco (`#FFFFFF`):** Razão de **17.93:1** (Contraste máximo para títulos editoriais).
3. **Deep Rust (`#B94E36`) sobre Fundo Branco (`#FFFFFF`):** Razão de **4.99:1** (Atende aos 4.5:1 para dados cadastrais e alertas).
4. **Signal Orange (`#F47745`) sobre Near Black (`#171717`):** Razão de **6.46:1** (Destaque imediato para botões de ação e rotas).

### C. Mapeamento de Telas e Navegação Persistente
* `screen-home`: Formulário de intake, chips de presets rápidos (`SP Bela Cintra`, `SP Paulista`, `Recife Boa Viagem`) e feed de 3 dossiês.
* `screen-loading`: Barra de progresso de auditoria e telemetria de camadas GeoSampa/CNEFE.
* `screen-dossier`: Dossiê visual dinâmico, barra de desembolso proporcional, infográficos SVG e filtro de categorias.
* `screen-checklist`: Roteiro de vistoria presencial com cálculo dinâmico de porcentagem.
* `screen-compare`: Matriz de comparação lado a lado de 2 propriedades com síntese narrativa de trade-off.
* `screen-saved`: Histórico de busca com métricas de decisão e transparência de imóveis descartados.

### D. Modais de Ação Direta
* `modalCandidate`: Desambiguação de edifícios candidatos quando o anúncio omite número.
* `modalWhatsApp`: Exportador de dúvidas pré-formatadas para o WhatsApp do corretor.
* `modalCadastralProvenance`: Ficha técnica oficial exibindo SQL municipal, ano de Habite-se, zoneamento e data da auditoria.

### E. Integridade de Dados Multi-Propriedade
Foram validados com sucesso 3 cenários ricos e realistas:
1. **Solar dos Franceses (Consolação, SP):** Aclive topográfico de 8.4% (de 3 min para 9 min a pé) e recuo de 9m para torre de 28 andares aprovada.
2. **Edifício Pauliceia (Bela Vista, SP):** Proteção por tombamento CONDEPHAAT (sem risco de novas torres) e rota plana de 3 min do metrô.
3. **Edf. Costa do Marfim (Boa Viagem, Recife):** Zona de corrosão por maresia C4 (NBR 6118), poço artesiano funcional (imune ao rodízio Compesa) e histórico de alagamento pluvial em maré de sizígia.
