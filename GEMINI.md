# VEREDAS — DIRETRIZES TÉCNICAS E AMBIÇÃO DE PRODUTO (ANTIGRAVITY IDE)

## Visão do Projeto
O **Veredas** é a plataforma de inteligência pericial e auditoria imobiliária do Recife.
Combinamos auditoria cadastral (ESIG Recife, ITBI, IPTU), visão computacional diagnóstica nas fotos, desmascaramento de assimetrias (garagem somada à área privativa, face Poente omitida), arbitragem entre imobiliárias (Entity Resolution) e modelagem hidro-climática (cota altimétrica vs marés de sizígia da bacia do Capibaribe e bacia do Pina).

---

## Ambição Estendida de Produto & Cruzamento Geográfico
Conforme diretrizes de produto:
1. **Cruzamento Geográfico de Rotina e Isócronas Pessoais:**
   - Rotinas diárias do usuário (trabalho no Porto Digital, aulas na UFPE, consultas no Polo Médico da Ilha do Leite, lazer em Boa Viagem ou Jaqueira).
   - Simulação de tempo real em pico por modal (Carro, Ônibus BRT, Uber/99, Remoto).
   - Cálculo de custo de vida local baseado na distância a pé para serviços essenciais (supermercados, padarias, farmácias, feiras livres).
   - Metrificação customizável por perfil de quem mora junto (casal, filhos, pets, trabalho remoto com gasto de energia por ar-condicionado na face Poente).
2. **Locais de Interesse e Visualização Espacial Interativa:**
   - Visualização com mapa hexagonal H3 interativo permitindo inspecionar micro-regiões e hexágonos vizinhos.
   - Camadas de Hospitais, Parques (Jaqueira, 13 de Maio, Santana, Santos Dumont), Shoppings (RioMar, Shopping Recife, Plaza) e Polos de inovação.
3. **Proxies Geográficos de Perícia Urbana:**
   - **Engarrafamento & Ruído Urbano:** Níveis de decibéis de tráfego pesado em vias arteriais (Agamenon Magalhães, Rosa e Silva, Domingos Ferreira, Caxangá).
   - **Obras e Canteiros Próximos:** Mapeamento de alvarás de novas torres e ruído de bate-estacas no lote vizinho.
   - **Natureza & Vetores Bioclimáticos:** Proximidade a manguezais e canais (proximidade a maré, mosquitos/vetores e odores em maré baixa vs alívio térmico).
   - **Resiliência a Alagamento:** Cruzamento da cota altimétrica da via com a tábua de marés da Capitania dos Portos (marés astronômicas > 2,2m) e bacia de retenção pluvial.
4. **Armazenamento de Imóveis de Interesse (Minha Busca / Dossiers Salvos):**
   - Salvar, contrastar e exportar relatórios periciais de contraproposta diretamente da plataforma.

---

## Anti-AI-Slop & Design System Editorial
- **Papel Técnico:** `--veredas-bg-paper: #F4F1EA`, `--veredas-bg-card: #FAF8F4`, `--veredas-bg-subtle: #EAE5DA`, `--veredas-ink-primary: #141413`.
- **Cores Semânticas:**
  - `--veredas-alert`: `#C84B31` (Terracota Recife: sobrepreço, divergência grave ESIG, face Poente)
  - `--veredas-valid`: `#1B5E40` (Verde Mangue: preço justo, cadastro íntegro, arbitragem favorável)
  - `--veredas-warn`: `#B86B11` (Âmbar: omissão, cota de rateio, maré moderada)
  - `--veredas-official`: `#1D4E89` (Azul Cadastral: bases oficiais ESIG, ITBI, IBGE)
- **Tipografia:** `Instrument Serif` (veredito e score), `Plus Jakarta Sans` (interface e textos), `JetBrains Mono` (telemetria, preços R$, m², códigos H3).
- **Geometria:** `border-radius: 0px` absoluto em toda a interface; sombras duras arquitetônicas `4px 4px 0px #141413` e `8px 8px 0px #141413`.
