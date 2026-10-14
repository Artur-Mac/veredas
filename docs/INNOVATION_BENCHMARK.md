# VEREDAS — INNOVATION BENCHMARK & CREATIVE TECHNOLOGIST EXPLORATION
**Documento Canônico:** Pesquisa de Fronteira em Interatividade, Jornalismo de Dados Investigativo e Simulações Urbanas  
**Foco:** Validação de Produto e Experiência de Usuário de Alto Impacto (100% Mockado / Client-Side)  
**Autor:** Principal Product Innovator & Lead Urban Data Experience Designer  
**Data:** Outubro de 2026

---

## 1. Visão Geral da Exploração
Em vez de se posicionar como mais um portal de listagem ou dashboard analítico convencional ("SaaS genérico"), o **Veredas** opera como uma **arma pericial de desmascaramento e negociação imobiliária**. 

Para criar momentos de revelação imediata (*"Aha! / Wow Moments"*) em menos de 10 segundos de uso, vasculhamos o ecossistema de **código aberto no GitHub, peças emblemáticas de jornalismo de dados (*The Pudding*, *The New York Times*, *ObservableHQ*) e ferramentas de simulação urbana e OSINT**.

---

## 2. Repositórios de Referência & Mecânicas Absorvidas

| Repositório / Referência | Link / Origem | O que torna brilhante | Como adaptamos no Veredas |
| :--- | :--- | :--- | :--- |
| **`mourner/suncalc`** | [github.com/mourner/suncalc](https://github.com/mourner/suncalc) | Biblioteca JavaScript ultra-leve (~3KB) para cálculo trigonométrico exato da posição solar (azimute e altitude) e horários solares com base em latitude/longitude e hora do dia. | Implementamos um widget interativo de **Bússola Solar & Ventos Alísios** calibrated para o Recife (latitude `-8.05°`), permitindo ao usuário arrastar um slider de horário (06:00 às 18:00) para ver a penetração do calor da tarde na face Poente e a obstrução dos ventos alísios de Sudeste. |
| **`before-after-slider` / Image Comparison** | [Tewix/before-after-slider](https://github.com/Tewix/before-after-slider) | Controle de divisão visual com zero dependências que permite comparar duas camadas de imagem com slider horizontal suave. | Criamos o **Raio-X / Loupe Pericial**: de um lado a foto de marketing do anúncio imobiliário; do outro, a camada diagnóstica de visão computacional destacando a distorção da lente grande-angular 0.5x (+38% de amplitude falsa) e eflorescência por umidade. |
| **Receipt / Invoice POS UI Patterns** | Visual interactives inspired by *The Pudding* & POS CSS Generators | Metáfora tátil do "cupom fiscal de papel térmico" com serrilha rasgada, código de barras e decomposição linha por linha de custos omitidos. | Desenhamos o **Cupom Fiscal da Verdade Imobiliária**: recibo estilizado com valor anunciado riscado, desdobramento de taxas extras de condomínio, IPTU real, sobrecusto de energia por calor Poente e custo total projetado em 5 anos. |
| **Tide & Flood Cross-Section Profiles** | Coastal Engineering & GIS Elevation Profiles | Visualização em corte transversal (perfil topográfico altimétrico) correlacionando cota da rua com maré astronômica e chuva. | Criamos o **Simulador de Estresse Hidro-Climático do Recife**: corte do Oceano ➔ Arrecifes ➔ Rua dos Navegantes / Rosa e Silva ➔ Bacia do Capibaribe, com sliders de maré de sizígia (0–2.8m) e precipitação (0–120mm) inundando o corte em tempo real. |
| **Interactive Buyer Leverage Matrix** | Multi-Criteria Decision & Procurement Negotiation Frameworks | Sliders ponderados de poder de barganha (dias de encalhe no mercado, spread de preço entre imobiliárias e divergência cadastral) gerando postura tática de contraproposta. | Construímos o **Painel de Alavancagem do Comprador**: converte as divergências apuradas no anúncio em cálculo de desconto recomendado e scripts assertivos de negociação. |

---

## 3. As 5 Propostas de Recursos Categoria-Definidores para o Veredas

### Proposta 1: O "Cupom Fiscal da Verdade Imobiliária" (Forensic Thermal Receipt)
- **O Problema:** Portais anunciam parcelas ou aluguéis descolados da realidade, escondendo despesas condominiais extraordinárias, IPTU e custos bioclimáticos.
- **A Experiência:** Um cupom fiscal impresso em papel térmico editorial com borda serrilhada e código de barras pericial. O valor divulgado no portal aparece com um traço vermelho (*strikethrough*), seguido do detalhamento de cada centavo ocultado e a projeção do custo de vida real acumulado em 1 e 5 anos.
- **Momento Wow:** O usuário percebe instantaneamente que o imóvel anunciado por R$ 5.700/mês custará R$ 6.640/mês na vida real.

### Proposta 2: O "Raio-X / Loupe Diagnóstica de Fotos" (Before/After X-Ray Loupe)
- **O Problema:** Fotos de imobiliárias utilizam lentes ultra-angulares (0.5x) para fazer quartos minúsculos parecerem salões e tratam fotos para disfarçar umidade e fiação antiga.
- **A Experiência:** Um controle deslizante horizontal sobre a foto principal. À esquerda: a foto publicitária. À direita: o diagnóstico forense com malha de distorção focal (indicando a área real de 22m² vs 35m² aparentes), caixas de patologia estrutural (eflorescência na fachada oeste) e estimativa de CAPEX de reforma.
- **Momento Wow:** Deslizar e desmascarar a ilusão ótica do anúncio com precisão cirúrgica.

### Proposta 3: A "Bússola Solar & Ventos Alísios com Simulação Horária" (Recife Sun & Wind Compass)
- **O Problema:** No Recife, a face Poente (Oeste) transforma apartamentos em estufas inabitáveis à tarde, exigindo ar-condicionado constante, enquanto a face Nascente (Leste/Sudeste) recebe a brisa fresca dos ventos alísios. Anúncios sempre omitem o Poente.
- **A Experiência:** Um mostrador cartográfico com a rosa dos ventos do Recife e azimute solar exato. Um slider interativo das 06:00 às 18:00 move o sol no céu: ao passar das 13h30, o indicador alerta sobrecarga térmica nos quartos e calcula o sobrecusto na conta de luz.
- **Momento Wow:** Visualizar a trajetória exata do sol batendo nas janelas do quarto e a barreira de vento provocada por espigões vizinhos.

### Proposta 4: O "Simulador de Estresse Hidro-Climático de Recife" (Tide + Rain Stress-Test)
- **O Problema:** Recife é a capital brasileira mais vulnerável a marés de sizígia combinadas com chuvas de inverno. Imóveis em cotas baixas (2.1m em Boa Viagem) sofrem com retorno de água nas garagens e calçadas.
- **A Experiência:** Perfil topográfico em SVG interativo cortando o Recife do mar aos rios. Dois controles deslizantes: **Maré de Sizígia (0 a 2.8m)** e **Chuva Acumulada (0 a 120mm)**. Ao aumentar a maré, a lâmina d'água sobe graficamente na tela, mostrando se atinge o meio-fio ou rampa de garagem do prédio avaliado.
- **Momento Wow:** Ver graficamente a diferença entre estar em cota de 2.1m (alagamento iminente na maré cheia) e 6.8m nas Graças ou 12.4m na Várzea.

### Proposta 5: O "Tradutor de Eufemismos de Corretor ➔ Realidade Forense" (Broker Euphemism Decoder)
- **O Problema:** Textos de anúncios usam linguagem publicitária para mascarar defeitos graves da propriedade.
- **A Experiência:** O texto do anúncio possui um seletor *"Ver Texto Publicitário"* vs *"Traduzir para Realidade Pericial"*. Cada termo de marketing é desconstruído interativamente:
  - *"Seminovo charmoso"* ➔ *"Construção de 1984 (42 anos construtivos com prumada antiga)"*
  - *"Ambiente aconchegante"* ➔ *"Dormitório de 7,8 m² (não comporta cama queen)"*
  - *"Varandão super ventilado"* ➔ *"Face Poente 278° sem alísios e calor escaldante à tarde"*
- **Momento Wow:** O humor ácido e o choque de realidade de ler o que o corretor realmente quis esconder.

---

## 4. Plano de Implementação Imediata no Protótipo
Selecionamos os seguintes recursos para absorver diretamente no protótipo autocontido [`index.html`](file:///home/v/Documents/vereda/veredas/index.html):
1. **O Cupom Fiscal da Verdade Imobiliária** na barra lateral.
2. **O Raio-X / Slider de Visão Computacional** nas fotos do Painel 01.
3. **A Bússola Solar & Ventos Alísios Horária** no Painel 05.
4. **O Simulador de Maré & Alagamento do Recife** no Painel 05.
5. **O Tradutor de Eufemismos de Corretor** no texto do Painel 01.

Tudo implementado em Vanilla HTML/CSS/JS puro, com estética editorial rigorosa e zero dependências de backend.
