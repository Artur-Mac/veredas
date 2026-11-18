# app25 — Symbium

Coleta: 17/11/2026. Fontes: `symbium.com` (home, `/instantpermitting`, `/automated-permitting-comparison`, `/projects`, `/pricing`, `/about/our-story`, `/legal`), `help.symbium.com`.

## 1. Identificação da Solução

- **Nome:** Symbium (São Francisco).
- **URL:** https://symbium.com.
- **Público-alvo:** **departamento de licenciamento municipal** (*building department*) e, do outro lado, **instalador, empreiteiro e proprietário**.
- **Proposta central:** **licenciamento instantâneo** — automatizar a **análise jurídica de conformidade** (código de obras, zoneamento e energia) enquanto o requerente ainda está **dimensionando o projeto**, e emitir a licença dentro do sistema que a prefeitura já usa.
- **Origem declarada:** time liderado por Stanford; a tese é que "o gargalo do licenciamento não é o formulário, é a leitura da lei".

## 2. Mapeamento Completo de Funcionalidades

### 2.1 O motor de conformidade
- Verifica o projeto contra **código de edificação, código de zoneamento e código de energia** — não um subconjunto.
- Roda **em tempo real durante o preenchimento**: o requerente vê o problema **antes** de enviar.
- Emite **"justificativa dinâmica de conformidade"** com **as seções de código citadas**.
- A empresa chama a atenção para isso na comparação pública: *"dynamic compliance rationale & referenced code sections"* contra *"black box analyses: no visible logic"* do concorrente.
- Configurável por jurisdição: **upload de conjunto de plantas, affidavits e nuances regulatórias locais**.

### 2.2 Integração com o sistema da prefeitura
- Integra ao **PTS** (*permit tracking system*) existente — cita **Accela, Tyler Technologies, Central Square**.
- Emite a licença **dentro** do fluxo, não só um "código de aprovação".
- Elimina redigitação pelo requerente e pelo servidor.

### 2.3 Cobertura e escala
- **271+ jurisdições** no ar (Califórnia, Colorado, Maryland).
- **3,5 milhões de horas de projeto economizadas** (número da home).
- **15+ tipos de projeto**: solar residencial e comercial, armazenamento, BIPV, bomba de calor, EV charger, retrofit estrutural, adição.
- **Verificação automática de licença do profissional** contra base estadual (contra 1–3 dias de verificação manual).
- **Sem treinamento**: "UX-first design".

### 2.4 Mandato estadual como catalisador
- **SB 379 (Califórnia)** obriga prazo curto para licença solar residencial; o Symbium se posiciona como a forma de cumprir.
- Curiosamente, a empresa **se declara contra mandato estadual obrigatório** ("opposes anticompetitive statewide mandates; empowers local jurisdictions"). O produto vende autonomia local, não conformidade imposta.

### 2.5 Comparação pública (o documento mais instrutivo)
A página `automated-permitting-comparison` compara o produto com o **SolarAPP+** (solução federal gratuita) em 11 critérios:
| Critério | Symbium | SolarAPP+ |
|---|---|---|
| Emissão | emite a licença, integrado ao sistema legado | devolve "código de aprovação" + checklist longo |
| Tipos de projeto | todos os retrofit residencial e comercial | só solar residencial e armazenamento |
| Transparência | **justificativa dinâmica e seção de código** | caixa-preta |
| Cobertura de código | código inteiro | subconjunto pequeno |
| Usuários | empreiteiro, despachante, **proprietário** | só empreiteiro licenciado |
| Verificação de licença | automática | manual, 1–3 dias |
| Customização local | alta | nenhuma |
| Custo de escala | novo tipo em dias | **$4 milhões** de verba pública para adicionar EV charger |

O último número é o argumento de venda: **o custo de acrescentar um tipo de projeto**.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** endereço/lote, tipo de projeto, dados técnicos (potência, área, estrutura), conjunto de plantas, licença do profissional, regra local.

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Código de obras, zoneamento, energia | município/estado | público, texto |
| Mapa de zoneamento e lote | município | público |
| Licença do profissional | base estadual | público |
| Regra processual local | prefeitura | público |
| Plantas e affidavit | requerente | privado |

**Artefato final:** **licença emitida**, com justificativa e seções citadas; ou lista de pendências antes do envio.

## 4. Mecânica de UI/UX e Visualização

- **Conformidade enquanto se digita** — o erro aparece no campo, não no fim.
- **Justificativa sempre visível**, com link para a seção de código.
- **Pendência nomeada**, não "erro genérico".
- **Zero treinamento** como requisito de design: se precisa de manual, o produto falhou.
- **Um fluxo para três públicos** (empreiteiro, despachante, proprietário).
- **Comparação pública com o concorrente**, critério por critério — o comprador público decide por tabela.

## 5. Regras de Negócio e Monetização

- **Modelo:** contrato com a prefeitura (SaaS por jurisdição), com o requerente usando de graça.
- **Gatilho:** prazo legal + fila + custo de horas de servidor. O ROI é medido em **horas de projeto economizadas** (3,5 M) e em **% de redução de tempo de análise** (75% no caso de Bakersfield).
- **Moat:**
  1. **Motor que lê a lei** e produz justificativa citável.
  2. **Integração com Accela/Tyler/Central Square** — barreira de entrada real.
  3. **Validação por 271 prefeituras** — credencial que nenhum concorrente novo tem.
  4. **Custo marginal baixo** por novo tipo de projeto, contra o custo público do concorrente.

## 6. Aplicação Direta no VEREDA

O Symbium não é imobiliário: é **automação de leitura de lei**. E é exatamente isso que o VEREDA precisa fazer com a **LPUOS** — hoje o produto diz "sem leitura" onde poderia dizer "o art. X permite Y".

### 6.1 "Justificativa dinâmica com seção de código" é a regra editorial do VEREDA
O VEREDA já decidiu não usar IA generativa em conteúdo exibido. O Symbium mostra que **não é preciso gerar texto**: é preciso **citar a norma e fazer a conta**. Formato recomendado para cada afirmação de zoneamento:

```
NÃO PERMITE construir nos fundos
Porque: recuo de fundo mínimo 3,00 m (LPUOS, art. 62, II)
         lote tem 2,40 m livres
Cálculo: 12,40 m (profundidade) − 10,00 m (edificação) = 2,40 m
```

Três linhas: **veredito, fundamento, aritmética**. É a mesma estrutura da justificativa do Symbium e é auditável por qualquer pessoa.

### 6.2 Conformidade enquanto o usuário mexe, não depois
O `SimuladorDaUnidade` deve recalcular **enquanto o slider se move** e mostrar a **pendência nomeada** ("gabarito excedido em 2 pavimentos"), não um estado binário. E o simulador de lote do `app24` (§6.4) deve fazer o mesmo com taxa de ocupação e recuo.

### 6.3 "Nenhum treinamento" como critério de aceite
O VEREDA tem 15 telas e um público que não vai ler manual. O critério do Symbium — **se precisa de treinamento, o produto falhou** — deve entrar no checklist de revisão de cada tela nova. Na prática: toda tela tem de responder a três perguntas sem texto de ajuda: **o que é isto, de onde veio, o que faço agora**.

### 6.4 O `A37` (leitura de licença) tem um precedente de escopo
O Symbium mostra que classificar **tipo de projeto** e **checar contra regra** é factível com regra determinística por tipo (15+ tipos). Isso valida o `R21` (tipificação determinística da licença em 10–15 tipos por palavra-chave) como caminho correto — e mostra que o valor está em **dizer qual regra foi aplicada**, não em adivinhar.

### 6.5 O que **não** copiar
- **Emitir licença**: exige convênio com a prefeitura e responsabilidade legal.
- **Integração com PTS municipal**: não existe equivalente aberto no Recife.
- **Verificação de licença profissional**: fora de escopo.
- **Promessa de "instantâneo"**: o VEREDA lê e explica; quem aprova é a prefeitura.
- **Comparação pública nominal com concorrente**: o VEREDA não tem concorrente direto e a postura é outra.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Formato "veredito + fundamento + aritmética" | LPUOS (público) | pequeno (é redação) |
| Pendência nomeada no simulador | nenhum | pequeno |
| Critério "zero treinamento" no checklist de revisão | nenhum | pequeno |
| Tipificação determinística de licença (R21) | nenhum | pequeno-médio |
