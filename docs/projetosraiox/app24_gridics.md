# app24 — Gridics

Coleta: 17/11/2026. Fontes: `gridics.com` (home, `/products/`, `/zoneiq/`, `/zonecheck/`, `/propzone/`, `/codehub/`, `/munimap/`, `/zvl/`, `/property-zoning-reports/`, `/zoning-data-api/`, `/ai-assistant/`, `/government-solutions/`, `/real-estate-solutions/`, `/case-studies/`).

## 1. Identificação da Solução

- **Nome:** Gridics LLC (Miami).
- **URL:** https://gridics.com.
- **Público-alvo:** **dois lados** — prefeitura (planejamento e zoneamento) e setor privado (incorporador, corretor, arquiteto, investidor).
- **Proposta central:** "inteligência de zoneamento por lote" — converter o **texto da lei** em **dado por lote**, com **motor de regras patenteado**, e mostrar em **3D** o que a lei permite construir.
- **Credencial que sustenta o preço:** "o único fornecedor de dado de zoneamento por lote **em que prefeituras confiam**".

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Sete produtos
| Produto | Lado | O que faz |
|---|---|---|
| **CodeHUB** | prefeitura | integra **texto do código, mapa e ferramenta de autoajuda** em um só lugar |
| **ZoneCheck** | prefeitura | **virtualiza o balcão de zoneamento**: autoatendimento 24/7 por endereço, lote ou uso permitido |
| **MuniMap** | prefeitura | mapeamento **3D** e visualização de dado |
| **ZVL (Zoning Verification Letters)** | prefeitura | **carta oficial de verificação de zoneamento** com template, versão e export |
| **PropZone** | privado | busca e análise de lote para *site selection*, com **PropZone Score** |
| **ZoneIQ** | privado | **planejamento de cenário 3D** e análise de viabilidade |
| **Property Zoning Reports** | privado | relatório de viabilidade feito por arquiteto |
| **Data API** + **AI Assistant** | ambos | acesso programático e assistente |

### 2.2 ZoneIQ — o produto que define a categoria
- **"Horas de trabalho de viabilidade de zoneamento em segundos."**
- Seleciona qualquer **lote, conjunto de lotes (assemblage) ou bairro**.
- Mostra **o que a lei permite por direito** (*by-right*) com **cálculo**.
- **Sliders de uso** que recalculam a capacidade em **3D em tempo real**.
- Modela: **zoneamento, overlays, direito aeroviário (*air rights*), estacionamento, variâncias, licenças especiais, recuos, waivers, testadas, usos permitidos, desenvolvimento orientado ao transporte, tipologias de edificação**.
- Exporta **relatório com a marca do cliente** em um clique.

### 2.3 O relatório de 6 páginas (estrutura exata)
O site publica um exemplo real (169 E Flagler St, Miami) e a ordem dos campos é o produto:

**Página 1 — Capacidade de desenvolvimento**
```
Uso atual do terreno:        Office
Código de zoneamento:        Miami 21 Code
Distrito(s):                 T6-80-O
Área máxima construída:      1.187.088 ft²
Altura máxima (pavimentos):  80
FAR:                         24,00
Unidades residenciais máx.:  1.136
```
**Página 2 — Terreno e edificação existente**
```
Parcel ID:        0101110701010
Área (acres):     1,14
Área (registro):  50.750 ft²
Área (geometria): 49.462 ft²
Tipo de lote:     Corner
Testada:          632,79 ft
Vago:             No
Área construída:  347.565 ft²
Uso existente:    OFFICE BUILDING
Ano:              1939
Bairro:           CBD
```

Duas decisões de engenharia aparecem aí e valem nota:
1. **Área do registro ≠ área da geometria** são exibidas **separadas** (50.750 vs. 49.462 ft²). O produto não escolhe: mostra as duas e deixa a diferença visível.
2. **"Tipo de lote: Corner"** é campo de primeira classe, porque lote de esquina muda recuo e testada.

### 2.4 ZoneCheck — o balcão virtual
Campos que a prefeitura expõe ao cidadão: **zona, overlays aplicáveis, taxa de ocupação, subzona, FAR, regra de muro, recuos, densidade permitida, usos permitidos, altura máxima**.
- Adoção declarada em **6 semanas ou menos**.
- Alega reduzir ligações, pedidos e visitas ao balcão **em até 10×**.
- Busca por endereço, **número do lote**, ou **por tipo de uso permitido**.

### 2.5 ZVL — a carta com controle de versão
- Templates por jurisdição, **campos conectados ao dado do imóvel**.
- **Rascunho e versão publicada** do template no mesmo lugar.
- Exporta **PDF e Word**.
- **"Itens de fonte faltante permanecem visíveis antes de a carta ser emitida"**.
- O texto é explícito: **"o servidor municipal continua responsável por revisar e emitir"**.

### 2.6 Preço
| Item | Preço |
|---|---|
| PropZone Premium | **$7/mês** (anual) |
| PropZone Professional | **$29/mês** (anual) |
| Relatório de zoneamento de um imóvel | **$29** avulso (não incluído nas assinaturas) |
| Relatório de viabilidade com arquiteto | **$650** por relatório |
| ZoneIQ / ZoneCheck / CodeHUB / API | sob consulta |

A escada é idêntica à do Zoneomics (`app19`), com um degrau a mais **na base**: $7/mês para consulta ilimitada de filtro. É o preço de um café para criar hábito.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** texto do código municipal, mapa de zoneamento, limites de lote, geometria, dados de registro (parcel ID, área registrada), uso e ano da edificação existente.

**Fontes cruzadas:** código e mapa oficiais do município, cadastro de lote, registro, e camadas públicas (trânsito, uso do solo).

**Artefato final:** resposta por lote (JSON), relatório de 6 páginas em PDF, cena 3D navegável, carta oficial em PDF/Word, e a **mesma** base servindo o balcão da prefeitura.

## 4. Mecânica de UI/UX e Visualização

- **3D com slider de uso**: a pessoa vê o prédio que a lei permite nascer, não uma tabela.
- **Dois números de área lado a lado** (registro vs. geometria) — honestidade de divergência.
- **Campo "tipo de lote"** visível, não escondido em metadado.
- **Relatório com ordem fixa**: capacidade primeiro, terreno depois. O comprador quer saber **quanto cabe**, não a área do lote.
- **Itens faltantes visíveis** antes da emissão da carta.
- **Marca do cliente** no relatório e no portal.

## 5. Regras de Negócio e Monetização

- **Modelo:** SaaS para prefeitura (por cidade/módulo) + assinatura barata para profissional + relatório avulso + serviço de arquiteto.
- **Gatilho do lado público:** reduzir balcão e litígio de interpretação. **Gatilho do lado privado:** não perder negócio por não saber quanto cabe no lote.
- **Moat:**
  1. **Motor de regras patenteado** que lê texto de lei.
  2. **Validação pela própria prefeitura** — o dado é o mesmo que o fiscal usa.
  3. **Cidades calibradas** (o produto só funciona onde foi calibrado; isso é limite e é defesa).
  4. **Rede de contato com planejamento urbano**.

## 6. Aplicação Direta no VEREDA

O Gridics é o **melhor modelo de tela de lote** de todo o conjunto, porque resolve a mesma lei que o VEREDA tem (texto de zoneamento municipal) e mostra o resultado em 3D — que é exatamente o `MapaDoLote` 2.5D.

### 6.1 A ordem do relatório de 6 páginas deve ser a ordem da tela de lote
O VEREDA hoje começa pelo lote e pelo endereço. O Gridics começa pelo **potencial**:

```
O QUE CABE AQUI
Área máxima construída     …
Altura máxima              … pavimentos
Taxa de ocupação           …
Coeficiente (FAR)          …
Unidades estimadas         …
```

Depois, e só depois: terreno, testada, tipo de lote, área registrada vs. área geométrica, edificação existente, ano. **Inverter a ordem é a mudança de uma linha de código com o maior efeito de leitura de todo o backlog.**

### 6.2 Área registrada ≠ área geométrica: mostrar as duas
O exemplo do Gridics (50.750 ft² registrados vs. 49.462 ft² medidos, diferença de 2,5%) é o caso mais comum do cadastro brasileiro — e o VEREDA hoje escolhe uma. Exibir **as duas com o rótulo de origem** resolve a discussão antes dela começar:

```
Área do lote (matrícula)   312 m²
Área do lote (geometria)   305 m²   diferença 7 m²
```

Isso é conteúdo, não feature, e melhora todas as telas que usam área.

### 6.3 "Lote de esquina" como campo de primeira classe
Se o lote é de esquina, recuos e testada mudam. O VEREDA tem a geometria (dá para detectar por número de testadas). O campo deve aparecer **na ficha**, não só no cálculo — porque o comprador de esquina sabe que está comprando esquina e quer ver que o produto sabe.

### 6.4 O simulador de capacidade do lote (não da unidade)
O `SimuladorDaUnidade` simula **andar/face do apartamento**. O Gridics mostra que o simulador de **lote** é outro produto e é o que serve a quem pensa em construir:

- slider de **taxa de ocupação**;
- slider de **gabarito**;
- resultado: **área máxima construída**, **unidades estimadas**, e **o volume em 3D**.

Isso encaixa no `MapaDoLote` e é a resposta à pergunta "posso construir outra unidade no fundo?" (`app19`, §6.1). Com a LPUOS, o cálculo é determinístico.

### 6.5 O padrão da carta: rascunho, versão, item faltante visível
O `ZVL` faz a carta oficial com **versão de template** e **itens de fonte faltante visíveis**. O VEREDA não emite carta, mas o `Pacote para especialista` é o análogo: deve sair com **versão do modelo, data, e a lista do que faltou**. É o `R2` (pacote com estados) e o `R17` (três estados) juntos.

### 6.6 $7/mês como preço de hábito
A escada do Gridics mostra que existe um degrau **abaixo** do relatório: assinatura de bolso para consulta ilimitada de filtro. Se o VEREDA algum dia monetizar o índice, esse é o degrau que cria uso diário — e o relatório é que paga a conta.

### 6.7 O que **não** copiar
- **Carta oficial de zoneamento**: exige o município como emissor. O VEREDA é leitura independente.
- **Serviço de arquiteto a $650**: fora de escopo.
- **Venda para a prefeitura**: ciclo político, licitação e manutenção de contrato — outro negócio.
- **"Cidades calibradas" como desculpa**: o VEREDA cobre seis áreas e deve dizer isso com clareza, não fingir cobertura.
- **Direito aeroviário e variâncias**: o VEREDA lê a LPUOS como ela é, sem simular exceção.

### 6.8 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Inverter a ordem da tela de lote (capacidade → terreno) | nenhum | pequeno |
| Área registrada vs. geométrica | nenhum | pequeno |
| Campo "lote de esquina" | geometria existente | pequeno |
| Simulador de capacidade do lote com sliders | LPUOS | médio |
| Versão + itens faltantes no pacote | nenhum | pequeno |
