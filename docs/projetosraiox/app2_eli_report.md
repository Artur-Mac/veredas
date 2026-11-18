# app2 — Eli Report

Coleta: 17/11/2026. Fontes: `elireport.com`, `/pricing-plans/`, `/how-eli-works/`, `/products/condo-document-review/`, `/products/special-levy-forecast/`, `/products/financial-health-assessment/`, `/widget/`, `/who-we-help/*`, `/resource-center/flood-score/`, `/resource-center/precipitation-score-v1/`.

## 1. Identificação da Solução

- **Nome:** Eli Report.
- **URL:** https://elireport.com (app em `app.elireport.com`).
- **Origem:** Vancouver, Canadá. Extração automática com **revisão humana** declarada ("human-audited extraction"), o que o produto trata como diferencial de precisão.
- **Público-alvo (cinco frentes declaradas):** comprador e vendedor, corretor, **gestor de condomínio e conselho (board)**, corretor de hipoteca, incorporador e prestador de serviço.
- **Proposta central:** pegar o pacote de documentos de condomínio/strata (centenas a milhares de páginas), transformar em **resumo acionável em minutos**, com *benchmark* financeiro e de seguro, *red flags* e **previsão de rateio extraordinário** por unidade.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Produtos (quatro, mais widget)
1. **Condo Document Review** — revisão do pacote de condomínio.
2. **HOA Document Review** — equivalente para HOA (nomenclatura e regras dos EUA).
3. **Special Levy Forecast** — previsão de chamada extra (rateio).
4. **Financial Health Assessment** — saúde financeira do condomínio.
5. **Widget "Eli Condo Scores"** — nota embutida em anúncio/site de corretor.

### 2.2 O que o produto extrai dos documentos
- **Documentos governantes e *bylaws* (CC&Rs):**
  - alinhamento de estilo de vida (o que a regra permite e proíbe);
  - **política de animais** e **política de locação** (ocupação e restrições de proprietário);
  - regras operacionais: **ruído, estacionamento, reforma**.
- **Atas de reunião e de conselho:** o produto trata as atas como "o único registro verdadeiro" do histórico do prédio, e faz *screening* do histórico em busca de problemas recorrentes.
- **Orçamento (budget):** leitura e **benchmark** contra pares.
- **Seguro:** apólice, cobertura e **benchmark** de prêmio/cobertura.
- **Estudo de reserva / *depreciation report*:** leitura do cronograma de reposição e do saldo.
- **Relatórios de engenharia** e **certificados**: entram como evidência de estado do edifício.
- **Form B (BC) / Form P (AB)** e anexos: o pacote legal de venda.

### 2.3 Saídas por documento
| Saída | Conteúdo |
|---|---|
| Resumo de *bylaws* | permissões e restrições em linguagem comum, por tema |
| Benchmarks | orçamento, seguro e fundo de reserva **contra conjuntos comparáveis** |
| *Red flags* | lista priorizada com trecho e página |
| Previsão de rateio | valor estimado por unidade, com a conta aberta |
| Scores climáticos | **flood score** e **precipitation score** (integrados via AISIX) |
| Chat de acompanhamento | assistente para perguntar sobre o próprio relatório |

### 2.4 A matemática do rateio (o diferencial mais concreto)
Declarada no produto: **cronograma do *depreciation report*** + **saldo do fundo de reserva** + **contribuição anual ao fundo (CRF)** → projeção de quanto falta e **média por unidade**. O relatório não chuta um valor solto: ele mostra o buraco entre o que o cronograma exige e o que o fundo tem, divide pelas unidades e apresenta o resultado como faixa.

### 2.5 Widget
- Nota de condomínio embutível em listagem de corretor.
- Serve como **canal de aquisição**: o comprador vê a nota no anúncio e cai no produto.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:**
- upload do pacote de documentos **ou** link para o pacote (o produto aceita "link support" no plano Enterprise);
- endereço/unidade para contextualizar;
- no widget, o corretor informa o imóvel e recebe o código de embed.

**Fontes cruzadas:**
| Dado | Origem | Tipo |
|---|---|---|
| Documentos do condomínio | usuário / agente / gestora | privado |
| Benchmark de orçamento, seguro e reserva | base própria acumulada de relatórios | privado (moat) |
| *Depreciation report* e Form B/P | província / condomínio | público-regulado |
| Risco de inundação e precipitação | AISIX (parceiro) | privado/licenciado |
| Dados de listagem | MLS/portal | privado |

**Artefato final:** relatório web interativo **+ PDF**, com resumo, benchmarks, red flags, previsão de rateio e scores. Há compartilhamento de documento e um **relatório inicial gratuito**.

## 4. Mecânica de UI/UX e Visualização

- **Relatório interativo primeiro, PDF depois.** O PDF é exportação, não o produto.
- **Blocos por pergunta do comprador**, não por documento: "posso ter animal?", "posso alugar?", "quanto pode me custar uma chamada extra?".
- **Toda afirmação vem com trecho e página.** É o mesmo princípio do `LeitorDeAta` do VEREDA ("trecho literal com página").
- **Benchmark em contexto**, não número solto: o valor do orçamento só significa algo ao lado do par.
- **Previsão com a conta visível**, em faixa e por unidade.
- **Chat sobre o próprio documento**, que reduz o custo de suporte sem inventar conteúdo.
- **Widget** que carrega a nota para fora do produto — distribuição embutida no anúncio.

## 5. Regras de Negócio e Monetização

### 5.1 Preço por relatório (pay-as-you-go)
| Plano | Preço | Entrega |
|---|---|---|
| Free | $0 | resumo por IA, OCR, suporte administrativo, compartilhamento |
| Pro | **$40**/relatório | + benchmark financeiro e de seguro |
| Enterprise | **$60**/relatório | + prioridade, suporte por link e **previsão de rateio** |

### 5.2 Assinatura anual
| Pacote | Preço |
|---|---|
| 5 relatórios | **$119,99**/ano |
| 10 relatórios | **$199,99**/ano |
| Ilimitado | **$359,99**/ano |

### 5.3 Métricas declaradas
- **40 mil+ relatórios** produzidos.
- **95% de tempo economizado** vs. leitura manual.

### 5.4 Gatilhos de conversão
1. **Primeiro relatório grátis** — remove o atrito do desconhecido.
2. **Benchmark e previsão no plano pago** — o gratuito resume, o pago **quantifica o risco**.
3. **Pacote anual** para quem compra ou analisa várias unidades (corretor, gestor).
4. **Widget** como aquisição passiva em anúncio de terceiro.

### 5.5 Moat
- **Base de benchmarks** acumulada: cada relatório melhora a comparação. Isso é o ativo que um concorrente novo não tem.
- **Revisão humana sobre extração automática**, que sustenta a promessa de precisão em documento jurídico.
- **Integração de risco climático** de terceiro (AISIX) sem construir modelo próprio.
- **Distribuição pelo widget**, que cria dependência do lado do corretor.

## 6. Aplicação Direta no VEREDA

O Eli é o concorrente mais próximo do que o VEREDA quer ser no eixo documental, mas com duas diferenças que o VEREDA deve preservar: o Eli **não tem camada de lugar** (não sabe do entorno, da rua, do sol) e **processa na nuvem**. O VEREDA tem o contrário: lugar forte, documento no dispositivo.

### 6.1 Checklist de pacote documental com "o que falta"
O Eli parte do pacote completo. O VEREDA parte do que o usuário tem. A inversão é uma vantagem: em vez de resumir, o `LeitorDeAta` deve **primeiro dizer o que não veio**. Checklist derivado do Eli, adaptado ao Brasil:

| Documento | Por que importa | No VEREDA |
|---|---|---|
| Convenção de condomínio + regulamento interno | regras de uso, obra, ruído, locação | já lido por `LeitorDeAta`; falta checklist |
| Atas dos últimos 24 meses (assembleias e conselho) | histórico de problema e de rateio | já lido; falta exigir janela mínima |
| Balancetes e demonstrativo do último exercício | saúde financeira | já lido; falta benchmark |
| Previsão orçamentária do ano corrente | o que vai subir | não tratado |
| Saldo e política do **fundo de reserva** | o que amortiza rateio | não tratado |
| **Laudo de vistoria / ART/RRT estrutural** | estado do edifício | já existe `LinhaDoTempoEstrutural` |
| Apólice de seguro do condomínio | cobertura real | não tratado |
| Certidões negativas do condomínio | dívida oculta | não tratado |
| Contrato de administração e de portaria | custo e risco de troca | não tratado |
| Projetos e alvará de construção | conformidade | parcial (`Licenciamento`) |

Isso é uma tela nova de baixo custo: "Pacote do imóvel — 10 documentos, 4 encontrados, 6 faltando", com cada linha apontando para onde pedir (síndico, administradora, vendedor).

### 6.2 Calculadora de fundo de reserva e rateio (100% no dispositivo)
O cálculo do Eli é replicável sem servidor:

```
buraco = Σ (custo do item do cronograma no ano) − saldo atual do fundo
rateio_por_unidade = buraco / nº de unidades
```

O VEREDA pode pedir três números ao usuário (saldo do fundo, contribuição mensal, custo do item mais caro do laudo) e devolver a faixa. **Sem base externa, sem promessa de previsão**: é aritmética sobre o documento que o usuário tem. Encaixa em `A34` (inteligência documental opcional) e no `Pacote para especialista`.

### 6.3 Benchmark de taxa condominial: manter a regra atual, com uma exceção
O Eli compara contra base própria. O VEREDA já compara **com o próprio caderno** (mediana ± MAD, mínimo 5). Isso é mais honesto e continua. A exceção defensável: comparar a taxa por m² **contra o mesmo bairro e a mesma faixa de idade do índice**, usando os anúncios que o próprio usuário viu — não uma base comprada. Nunca apresentar como "mercado".

### 6.4 Estrutura do relatório para o especialista
O `Pacote.tsx` já exporta `.md`/`.html`. A ordem do Eli é melhor para quem audita:
1. Identificação e dados do edifício;
2. Resumo de regras (animal, locação, obra, ruído);
3. Financeiro: orçamento, fundo, seguro, com o benchmark e a conta;
4. Histórico de atas: problema recorrente, data, trecho;
5. Red flags priorizadas;
6. Perguntas para o síndico (com o documento que falta);
7. Anexos: trechos literais com página.

### 6.5 O que **não** copiar
- **Nuvem obrigatória**: o Eli processa no servidor. O VEREDA mantém documento no dispositivo (LGPD e posição de produto).
- **Score de condomínio embutido em anúncio**: cria incentivo a "nota boa" e transforma o VEREDA em avaliador de condomínio, o que colide com "Posição é Fato, Adjetivo é Veredito".
- **Integração de score climático de terceiro**: o VEREDA não compra score; usa histórico de evento e camada pública.
- **Preço por relatório como produto principal**: o `market-analysis.md` já mostrou que o teto de CAC não fecha. O Eli só sustenta $40 porque o mercado canadense paga por documento obrigatório.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Checklist "o que falta" no `LeitorDeAta` | nenhum | pequeno |
| Calculadora de fundo/rateio | entrada do usuário | pequeno |
| Reordenação do `Pacote` | nenhum | pequeno |
| Benchmark por bairro+idade | índice + anúncios do usuário | médio |
