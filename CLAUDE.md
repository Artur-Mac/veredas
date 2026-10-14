# VEREDAS — INSTRUÇÕES DE ENGENHARIA E DIRETRIZES DE ESTILO
**Branch:** Validação de Produto, Benchmark Competitivo e UX Showcase (Dados 100% Simulados)

Bem-vindo ao repositório do **VEREDAS** (Plataforma de Inteligência e Auditoria Imobiliária focada em Recife/PE).

## Execução Instantânea (Zero Dependências Externas)

O produto é **100% autocontido, simulado, instantâneo e à prova de falhas**:

```bash
# 1. Abrir diretamente no navegador ou servir localmente:
python3 -m http.server 8080
# Acesso: http://localhost:8080

# 2. Rodar suíte completa de qualidade e benchmarks (43 testes automatizados):
python3 tests/run_benchmarks.py
```

## Diretrizes Fundamentais

### 1. Bloqueio Estrito Anti-AI-Slop
- **NUNCA** utilize gradientes roxos/neon, `background-clip: text`, cantos arredondados (`border-radius > 0px`), sombras difusas ou ícones de estrelinhas/brilho de IA.
- Use a **Paleta de Papel Técnico**:
  - `--veredas-bg-paper: #F4F1EA` (Papel com malha pontilhada)
  - `--veredas-bg-card: #FAF8F4` (Superfície dos laudos)
  - `--veredas-bg-subtle: #EAE5DA` (Barras técnicas)
  - `--veredas-ink-primary: #141413` (Nanquim e bordas estruturais `1.5px solid #141413`)
- Cores semânticas de perícia urbana:
  - `--veredas-alert`: `#C84B31` / `#F9EBE8` (Terracota Recife: sobrepreço, divergência ESIG, face Poente)
  - `--veredas-valid`: `#1B5E40` / `#E6F2EC` (Verde Mangue: preço justo, cadastro íntegro)
  - `--veredas-warn`: `#B86B11` / `#FDF3E4` (Âmbar: omissões, risco de alagamento)
  - `--veredas-official`: `#1D4E89` / `#EBF1F8` (Azul Cadastral: fontes oficiais ESIG Recife, ITBI)
- Tipografia oficial:
  - `Instrument Serif` para títulos, manchetes de veredito e Score Veredas (0-100).
  - `Plus Jakarta Sans` para textos, formulários e checklists.
  - `JetBrains Mono` (`tabular-nums`) para TODOS os números, preços R$, metragens m², H3 índices e selos.
- Geometria ortogonal: `border-radius: 0px` absoluto em toda a interface; sombras duras `box-shadow: 4px 4px 0px #141413` ou `8px 8px 0px #141413`.

### 2. Núcleo de Skills Enxuto (.agent/skills/)
- `veredas-editorial-ui`: Regras de estilo editorial, tokens de perícia e Anti-AI-Slop.
- `ui-ux-pro-max`: Inteligência de layout, contraste WCAG AAA e microinterações.
- `data-storytelling`: Narrativas de dados para SHAP Waterfall, malha H3 e auditoria ESIG.
- `browser-testing-with-devtools`: Verificação em browser.

### 3. Camada Recife Real (100% Mockada e Autocontida)
- Território focado em Recife: Graças (Jaqueira), Boa Viagem (Navegantes) e Várzea (UFPE).
- Perícia de alagamento cruzando cota altimétrica com marés de sizígia.
- Conforto bioclimático: Azimute solar Nascente vs Poente e corredor de ventos alísios de Sudeste.
- Auditoria de área privativa real no ESIG Recife desmascarando garagem somada à área útil.
