# app10 — DataZap (Grupo OLX)

Coleta: 17/11/2026. Fontes: `datazap.com.br` (redireciona para `imoveis.grupoolx.com.br/datazap`), `/datazap/conteudos`, `/datazap/estudos-e-pesquisas/anuario-datazap-2026`, `/datazap/termometro-de-mercado/radar-imobiliario-53a-edicao`, `/datazap/conteudos?categoria=termometro&sub=Índice+de+Lançamentos`, PDF `raio_x_fipezap_2026t1`, `lp.dataland.ai/geoimovel`.

## 1. Identificação da Solução

- **Nome:** DataZap, braço de dados e inteligência do **Grupo OLX** (que opera os portais de imóveis do grupo no Brasil).
- **URL:** https://www.datazap.com.br → `imoveis.grupoolx.com.br/datazap`.
- **Público-alvo:** **B2B** — incorporadora, loteadora, corretora, banco, fundo, consultoria, imprensa econômica.
- **Proposta central:** ser a **referência de preço e de oferta** do mercado imobiliário brasileiro, combinando a maior base de anúncios do país com modelagem econômica.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Produtos editoriais e índices
| Produto | O que é | Periodicidade |
|---|---|---|
| **FipeZAP** | índice de preço de venda e aluguel por cidade/bairro, metodologia com a FIPE | mensal |
| **Raio-X FipeZAP** | relatório trimestral em PDF (ex.: 2026 T1) com leitura de conjuntura | trimestral |
| **Anuário DataZap** | compêndio anual do mercado (edição 2026 publicada) | anual |
| **Radar Imobiliário** | boletim de conjuntura (53ª edição na coleta) | mensal |
| **ILI — Índice de Lançamentos** | índice de lançamento de novos empreendimentos | periódico |
| **Geoimóvel** (via Dataland) | produto geoespacial de imóvel e entorno | contínuo |

### 2.2 Acompanhamento de lançamento (a feature mais próxima do VEREDA)
O produto de lançamento entrega, por empreendimento e por região:
- **estoque** disponível;
- **tabela de vendas** (unidades vendidas por período);
- **preços** praticados;
- **velocidade de venda** (unidades/mês);
- **relatórios espaciais e temporais** — recorte por área e por tempo.

### 2.3 Modelagem
- **AVM e modelos estatísticos** para estimativa de valor.
- Normalização de anúncio: tipologia, área, padrão, localização.

### 2.4 Distribuição
- Conteúdo aberto (artigos, índices, PDFs) como **geração de demanda e autoridade**.
- Produtos fechados (base, API, relatório sob medida) como **receita**.
- Presença de imprensa: o FipeZAP é citado como número oficial do mercado, o que dá ao grupo o status de fonte.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário (B2B):** recorte geográfico, período, tipologia, faixa de preço; no Geoimóvel, endereço/geometria.

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Anúncios de venda e aluguel | portais do Grupo OLX | privado (escala nacional) |
| Lançamentos | incorporadoras e corretores | privado |
| Índice de preços | metodologia FIPE sobre a base | derivado |
| Dados socioeconômicos | IBGE, BCB | público |
| Geometria e entorno | bases próprias + público | misto |

**Artefato final:** índice, relatório PDF, dashboard, tabela de lançamento, API/dado licenciado.

## 4. Mecânica de UI/UX e Visualização

- **Índice com variação percentual e série**: "preço médio subiu X% em 12 meses" é o formato que a imprensa reproduz e que o mercado consome.
- **Mapa de calor por bairro** com preço/m².
- **Tabela de lançamento** com estoque, vendas e velocidade — planilha, não cartão.
- **PDF trimestral com narrativa**, que é o que o executivo lê.
- **Boletim numerado** (53ª edição) que cria expectativa de série e fideliza.

## 5. Regras de Negócio e Monetização

- **Modelo:** assinatura/ licenciamento B2B + relatório sob demanda + produto geoespacial; conteúdo aberto como funil.
- **Moat:**
  1. **Escala de anúncio** — só quem tem portal tem esse volume.
  2. **Marca de índice** (FipeZAP) que virou referência de mercado e de imprensa.
  3. **Série histórica** longa.
  4. **Distribuição editorial**, que faz o número circular sem custo de mídia.
- **Limite:** o dado é de **anúncio**, não de transação; o produto vive disso e comunica isso.

## 6. Aplicação Direta no VEREDA

O DataZap é o **oposto complementar** do VEREDA: ele sabe preço e oferta; o VEREDA sabe lugar e documento. Não competem — e é justamente por isso que há duas lições fortes.

### 6.1 O formato "boletim numerado" como ativo de autoridade
`Radar Imobiliário, 53ª edição` é uma peça de posicionamento: numera a série, cria expectativa, e a imprensa cita com número. O VEREDA tem matéria-prima para um boletim próprio **sem preço**:

> **Radar do pré-contrato — Recife, edição 1**
> — 7.206 edifícios indexados em 72 bairros
> — 2.825 edifícios nas seis áreas habilitadas
> — X obras licenciadas nos últimos 24 meses
> — Y ruas com registro de alagamento desde 2014
> — Z edifícios com laudo estrutural registrado no dossiê dos usuários

Isso é **posição de mercado sem valuation** e sem dado pessoal. É a jogada editorial que o DataZap domina e que o VEREDA pode fazer em escala pequena.

### 6.2 Velocidade de venda por bairro — a métrica que falta
"Quanto tempo um imóvel fica parado neste bairro" é uma pergunta que o comprador faz e que ninguém responde fora do B2B. O VEREDA **não tem** base de anúncios hoje, mas:

- o `A20` (histórico de oferta efetiva) prevê exatamente isso: mesma unidade ao longo de anúncios, reduções, taxas, republicação e desaparecimento;
- se o `A20` for ligado, a métrica de velocidade vira derivável da **própria base de anúncios do usuário**, no dispositivo.

Recomendação: **não** comprar base para fazer isso. Guardar a fórmula do DataZap como especificação de saída (estoque, vendas, preço, velocidade, recorte espacial e temporal) para quando o `A20` existir.

### 6.3 "Estoque" como conceito de leitura de bairro
O DataZap mede estoque de lançamento. O VEREDA pode medir **estoque de oferta** no índice (quantos edifícios, quantas unidades) sem preço: "neste bairro há 340 edifícios indexados, 12 com obra licenciada". É contexto de mercado sem valuation.

### 6.4 Geoimóvel como prova do join endereço→geometria→dado
O Geoimóvel/Dataland mostra que o mercado brasileiro já paga por **endereço georreferenciado com atributos**. O VEREDA faz o mesmo com DSQFL e não cobra. Isso reforça que a **chave cadastral de 14 dígitos é ativo**, não detalhe técnico — e que ela deve aparecer na interface como identificador de confiança ("Edifício pelo cadastro municipal, DSQFL …"), como o DataZap faz com o endereço normalizado.

### 6.5 O que **não** copiar
- **FipeZAP e qualquer índice de preço**: o VEREDA não publica preço (A21/A31).
- **Compra de base de anúncio**: custo fixo alto, dependência de fornecedor.
- **Dashboard denso**: o público do VEREDA decide um imóvel, não um portfólio.
- **Linguagem de mercado** ("valorização", "oportunidade"): colide com a postura de produto.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Radar do pré-contrato (edição periódica) | nenhum (índice + camadas) | pequeno-médio (redação + geração) |
| Contagem de estoque por bairro | nenhum | pequeno |
| DSQFL visível como identificador | nenhum | pequeno |
| Velocidade de venda | base de anúncios (A20) | bloqueado por decisão de escopo |
