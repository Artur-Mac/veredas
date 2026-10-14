# VEREDAS — GUIA & RELATÓRIO EXECUTIVO DE PESQUISA, BENCHMARK E INOVAÇÃO UX

**Documento para Avaliação de Gestão de Produto & Engenharia**  
**Data:** Outubro de 2026  
**Fase do Projeto:** Descoberta de Produto, Validação de UX Forense & Benchmark Competitivo  
**Status da Branch:** `feat/overnight-sprint`  
**Ambiente de Demonstração:** 100% Client-Side / Dados Simulados de Alta Fidelidade (Zero dependências de banco de dados/backend)

---

## 1. Sumário Executivo: A Tese de Produto do Veredas

### 1.1 O Que é o Veredas?
O **Veredas** não é mais um agregador imobiliário (como ZAP, VivaReal ou QuintoAndar). Ele é uma **plataforma pericial de inteligência, auditoria cadastral e arma de negociação** para quem compra ou aluga imóveis no Recife.

### 1.2 O Conflito Estrutural dos Portais Tradicionais
Os portais convencionais sofrem de um conflito de incentivo intrínseco: sua receita provém das taxas cobradas de construtoras e imobiliárias anunciantes. Por isso, são passivos diante de:
- **Fotos enganosas:** distorcidas com lentes ultra-angulares (0.5x) para falsear amplitude.
- **Custos ocultos:** condomínios com chamadas de capital omitidas, IPTU subdeclarado e gastos astronômicos de ar-condicionado por orientação solar desfavorável.
- **Inconsistências cadastrais:** divergências entre a área anunciada e a área privativa oficial registrada na Prefeitura do Recife (ESIG/ITBI).
- **Vulnerabilidades urbanas graves:** desconhecimento do risco de alagamento por marés de sizígia da bacia do Capibaribe e bacia do Pina.

### 1.3 O Posicionamento Estratégico do Veredas
O Veredas atua exclusivamente do **lado do comprador/locatário**. Nossa missão é municiar o usuário com provas técnicas, laudos periciais e contrapropostas fundamentadas para economizar dezenas de milhares de reais na mesa de negociação ou evitar a compra de um imóvel problemático.

---

## 2. Fronteiras de Pesquisa & Benchmarks Investigados

Nossa pesquisa mapeou quatro fronteiras de inovação digital e cruzou referências com a realidade geomorfológica e urbana do Recife:

### Fronteira 1: Simulações Micro-Ambientais & Resiliência Urbana (JS/SVG Leve)
- **Referência:** [`mourner/suncalc`](https://github.com/mourner/suncalc) e referências de insolação como `ted-piotrowski/shademap`.
- **Insight:** Em vez de exigir modelos 3D pesados (WebGL/Three.js de dezenas de megabytes), a física trigonométrica solar e os dados de tábua de marés podem ser calculados diretamente em fórmulas JavaScript client-side de < 2KB.
- **Aplicação no Recife:** Latitude `-8.05°`. No Recife, apartamentos com fachada Oeste (Poente) sofrem insolação escaldante a partir das 13h, gerando um custo elétrico adicional de até R$ 280/mês em climatização, enquanto a fachada Leste/Sudeste se beneficia da ventilação natural dos ventos alísios.

### Fronteira 2: Jornalismo de Dados Investigativo & Desconstrução Documental
- **Referência:** *The Pudding*, *The New York Times Upshot*, *Bloomberg Graphics* e *Financial Times*.
- **Insight:** Elementos táteis e metáforas do cotidiano geram engajamento e compreensão imediata da assimetria de informação.
- **Mecânicas Identificadas:**
  - *Thermal Receipt POS Pattern:* Apresentar o custo total de posse como um "Cupom Fiscal" detalhado, onde o valor de marketing é tachado em vermelho e cada custo omitido é somado.
  - *Split-View Loupe / Image Slider:* Permitir ao usuário "passar a lupa" pericial sobre a foto de anúncio e ver o diagnóstico de patologia física e distorção óptica.

### Fronteira 3: Padrões Forenses & Scanner de Red-Flags
- **Referência:** Ferramentas de OSINT (Open-Source Intelligence) e análise de conformidade contratual.
- **Insight:** A linguagem das imobiliárias é repleta de eufemismos que mascaram defeitos estruturais e legais.
- **Mecânica:** O *Broker Euphemism Decoder*, que traduz jargões de corretores (*"aconchegante"*, *"vintage"*, *"varanda super ventilada"*) para a realidade objetiva medida pela perícia técnica.

### Fronteira 4: Alavancagem de Negociação & Decisão Multicritério
- **Referência:** Ferramentas de negociação de suprimentos corporativos (*Procurement Leverage Matrices*).
- **Insight:** O usuário não quer apenas saber que o imóvel tem defeitos; ele quer saber **quanto pedir de desconto** e **qual script de mensagem usar** para negociar com o proprietário com base nos dados levantados.

---

## 3. Catálogo das 5 Funcionalidades Inovadoras Desenvolvidas

| # | Funcionalidade | Conceito Central | Momento "Aha!" (< 10 segundos) | Status no Protótipo |
|---|---|---|---|---|
| **01** | **Cupom Fiscal da Verdade** (*Forensic Thermal Receipt*) | Nota fiscal em papel térmico editorial com borda serrilhada e código de barras pericial que decompõe o custo real em 1 e 5 anos. | Ver o preço anunciado de R$ 5.700/mês riscado em vermelho e recalculado para R$ 6.640/mês com taxas ocultas somadas. | ✅ **Implementado e Interativo** (Barra lateral direita) |
| **02** | **Raio-X / Loupe Pericial de Fotos** (*Before/After X-Ray*) | Controle deslizante de duas camadas sobre as fotos de marketing comparando a imagem comercial com a malha de visão computacional. | Arrastar o slider e desmascarar a lente 0.5x (+38% de amplitude falsa) e caixas de alerta de umidade na parede. | ✅ **Implementado e Interativo** (Painel 01 - Dossiê) |
| **03** | **Bússola Solar & Alísios do Recife** (*Sun & Wind Compass*) | Rosa dos ventos geolocalizada com slider horário (06h às 18h) calculando azimute e altitude solar para a latitude `-8.05°`. | Mover o controle para 15:30 e ver o alerta de sobrecarga térmica do Poente e o bloqueio dos ventos de Sudeste. | ✅ **Implementado e Interativo** (Painel 05 - Bioclimático) |
| **04** | **Simulador de Estresse de Maré & Chuva** (*Tide + Rain Stress-Test*) | Perfil topográfico transversal do Recife em corte (Oceano ➔ Arrecifes ➔ Rua ➔ Rio Capibaribe) com lâmina d'água dinâmica. | Subir a maré de sizígia para 2.4m e a chuva para 80mm e ver a água cobrir o meio-fio e a rampa da garagem. | ✅ **Implementado e Interativo** (Painel 05 - Alagamento) |
| **05** | **Tradutor de Eufemismos de Corretor** (*Euphemism Decoder*) | Alternador instantâneo no texto de anúncio que substitui adjetivos de venda por termos técnicos forenses. | Clicar em *"Traduzir para Realidade Pericial"* e ler que *"estilo vintage"* significa *"construção de 1984 com prumada antiga"*. | ✅ **Implementado e Interativo** (Painel 01 - Descrição) |

---

## 4. Guia Prático para Demonstração e Avaliação pelo Gestor

### 4.1 Como Rodar a Demonstração
O protótipo é um artefato único, autocontido e ultra-rápido (< 100 KB).

1. No terminal do projeto, execute:
   ```bash
   python3 -m http.server 8080
   ```
2. Abra no navegador:
   ```
   http://127.0.0.1:8080/index.html
   ```
   *(Ou abra diretamente o arquivo `index.html` em qualquer navegador sem servidor).*

### 4.2 Roteiro de Inspeção Recomendado para o Gestor

```
Passo 1: Tela Inicial (Home)
  └── Clique em "Auditar Imóvel" ou escolha o card "Solar dos Navegantes" (Boa Viagem).
       
Passo 2: Painel 01 — Dossiê Pericial & Loupe de Fotos
  ├── Observe o Raio-X interativo sobre a foto do imóvel.
  ├── Arraste a barra divisória da esquerda para a direita.
  │     => Repare na sobreposição verde/terracota indicando distorção ótica de 0.5x e infiltração.
  └── No quadro de texto logo abaixo, clique no botão:
        [ TRADUZIR PARA REALIDADE PERICIAL ]
        => Veja os jargões publicitários serem desconstruídos instantaneamente.

Passo 3: Barra Lateral — Cupom Fiscal da Verdade
  ├── Role a visão para a coluna direita de decomposição de custos.
  └── Inspecione o layout de papel térmico serrilhado:
        - Preço anunciado riscado.
        - Decomposição de taxas extras, IPTU periciado e sobrecusto de energia.
        - Projeção de desembolso acumulado em 5 anos (+ R$ 56.400 de discrepância).

Passo 4: Painel 05 — Resiliência Hidro-Climática e Solar
  ├── Bússola Solar:
  │     - Mova o slider das 06:00 para as 15:30.
  │     - Veja o vetor solar girar e o indicador de Poente acionar o alerta térmico.
  └── Simulador de Maré e Chuva:
        - Aumente o slider "Maré de Sizígia" para 2.4m.
        - Aumente o slider "Chuva Acumulada" para 90mm.
        - Observe a animação SVG da lâmina d'água subindo em direção à cota da rua.
```

---

## 5. Garantia Técnica & Anti-AI-Slop

O protótipo foi construído com estrita observância às diretrizes de qualidade do projeto:
- **Design System Editorial Técnico:** Fundo papel técnico (`#F4F1EA`), tinta primária (`#141413`), alerta terracota Recife (`#C84B31`) e verde mangue (`#1B5E40`).
- **Zero AI-Slop:** Sem cantos arredondados genéricos (`border-radius: 0px` absoluto), sem gradientes roxos/neons, sem sombras difusas (sombras duras arquitetônicas `4px 4px 0px #141413`).
- **Tipografia Editorial:** `Instrument Serif` para scores e vereditos, `Plus Jakarta Sans` para interfaces e `JetBrains Mono` com números tabulares (`tabular-nums`) para telemetria financeira.
- **Suíte de Testes Automatizada:**
  ```bash
  python3 tests/run_benchmarks.py
  # Resultado: 43 PASSED | 0 FAILED | 0 WARNINGS
  ```

---

## 6. Rubrica de Avaliação para Feedback da Gestão

Solicitamos que a liderança avalie os resultados considerando os seguintes eixos para orientar a próxima fase:

| Critério | Perguntas para Avaliação do Gestor | Nota Sugerida (1 a 5) |
|---|---|:---:|
| **Impacto de Negociação** | O Cupom Fiscal e o Euphemism Decoder fornecem argumentos reais e agressivos que o comprador usaria diante do corretor? | [ &nbsp; &nbsp; ] |
| **Clareza Visual & "Aha Moment"** | O Raio-X de fotos e o Simulador de Maré comunicam o problema em menos de 10 segundos sem precisar ler manuais? | [ &nbsp; &nbsp; ] |
| **Adequação ao Recife** | A calibragem da face Poente e das marés de sizígia reflete a dor real e crônica dos bairros (Boa Viagem, Graças, Jaqueira)? | [ &nbsp; &nbsp; ] |
| **Identidade Anti-AI-Slop** | A estética editorial de papel técnico passa credibilidade jornalística/forense superior aos portais convencionais? | [ &nbsp; &nbsp; ] |
| **Próxima Fronteira** | Qual módulo deve receber profundidade analítica na próxima sprint: aprofundamento do laudo para WhatsApp ou expansão dos bairros mapeados? | [ &nbsp; &nbsp; ] |

---
*Documento canônico disponível no repositório em [`docs/GUIA_RELATORIO_EXECUTIVO_PESQUISA.md`](file:///home/v/Documents/vereda/veredas/docs/GUIA_RELATORIO_EXECUTIVO_PESQUISA.md).*
