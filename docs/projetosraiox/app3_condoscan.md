# app3 — CondoScan

Coleta: 17/11/2026. Fontes: `condoscan.ca`, `/pricing`, `/how-it-works`, `/faq` (incluindo JSON-LD com 17 perguntas), `/blog`, `/resources/condo-insurance`, `/document-review/<cidade>`.

## 1. Identificação da Solução

- **Nome:** CondoScan.
- **URL:** https://condoscan.ca.
- **Base:** Calgary, Alberta; atende **Alberta e Colúmbia Britânica**.
- **Público-alvo:** comprador de apartamento e **corretor** (o corretor compra para o cliente e ganha velocidade de fechamento).
- **Proposta central:** revisão de documentos de condomínio com **especialista humano + plataforma**, entregue em **24 horas**, com **garantia de devolução de 100%** do valor.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 O serviço principal
- **Standard:** pacote residencial.
- **Commercial:** pacote para unidade comercial/loja, com regras e risco diferentes.
- **Entrega em 24 h** (declarada).
- **Relatório em site interativo + PDF.**
- **Chamada 1:1** com o especialista que fez a revisão.
- **Garantia de reembolso integral** se o cliente não ficar satisfeito, por qualquer motivo.

### 2.2 Intake personalizado
O formulário não pede só o endereço: pede o **que importa para aquele comprador** (animal, locação, reforma, investimento, mudança com criança, etc.). A revisão é enviesada por essas prioridades — o mesmo pacote gera relatórios diferentes para compradores diferentes.

### 2.3 Obtenção dos documentos
- O CondoScan **busca os documentos** com o agente de listagem ou com a administradora, em vez de exigir que o comprador os tenha.
- No FAQ, a pergunta "como sei que você tem todos os documentos?" é respondida com o processo de solicitação ativa, não com uma lista fechada.

### 2.4 Cobertura Alberta + BC
- Em BC, o pacote segue o **Strata Property Act** e usa a terminologia de strata: **Form B Information Certificate** e anexos, **depreciation report**, *strata bylaws* e regras, **certificados de seguro**, **atas de conselho**, **demonstrações financeiras**.
- Em Alberta, o equivalente em condominium plan/bylaws/estudos de reserva.

### 2.5 Conteúdo do relatório
- Resumo de **bylaws e regras** em linguagem comum.
- **Financeiro:** taxa, orçamento, **estudo de reserva**, **fundo de reserva**, histórico de **rateio extraordinário**.
- **Seguro:** o que o condomínio cobre e o que o proprietário precisa contratar por fora. Há uma página de recurso dedicada a seguro de condomínio, o que indica que é a dúvida mais cara do comprador.
- **Risco jurídico:** litígio, processo, notificação.
- **Gestão:** troca de administradora, qualidade de registro.
- **Perguntas para o conselho/síndico.**

### 2.6 As red flags publicadas (lista fechada, altíssimo valor de cópia)
O FAQ nomeia explicitamente:
1. **Fundo de reserva abaixo de 70%** do recomendado.
2. **Rateios extraordinários frequentes.**
3. **Inadimplência** alta de condôminos.
4. **Salto de taxa condominial** acima do padrão.
5. **Estudo de reserva ausente** ou desatualizado.
6. **Déficit** orçamentário recorrente.
7. **Litígio** envolvendo o condomínio.
8. **Rotatividade de administradora** (management churn).

### 2.7 Posicionamento de limite
O FAQ responde "você vai me dizer para não comprar?" com **não**: entrega dados e análise para o comprador decidir. É a mesma postura de "Posição é Fato, Adjetivo é Veredito".

### 2.8 Páginas de cidade (SEO local)
`/document-review/calgary`, `/edmonton`, `/airdrie`, `/cochrane`, `/okotoks`, `/st-albert`, `/sherwood-park`, `/leduc`, `/spruce-grove`, `/fort-mcmurray`, `/red-deer`, `/grande-prairie`. Uma página por município, com o mesmo serviço e texto localizado.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:**
- endereço/unidade;
- prioridades pessoais (intake);
- autorização para solicitar documentos ao agente/administradora;
- dados de contato e pagamento.

**Fontes cruzadas:**
| Dado | Origem | Tipo |
|---|---|---|
| Pacote de documentos do condomínio | agente de listagem / administradora | privado, obtido pelo fornecedor |
| Legislação (Strata Property Act / Condominium Property Act) | governo provincial | público |
| Referência de mercado de seguro | corretoras/parceiros | privado |
| Análise | **especialista humano** | trabalho |

**Artefato final:** relatório interativo + PDF + chamada 1:1. Não há monitoramento contínuo nem alerta posterior.

## 4. Mecânica de UI/UX e Visualização

- **Intake primeiro, relatório depois.** A personalização acontece antes do trabalho, não por filtro no resultado.
- **Relatório como página navegável**, com o PDF como cópia.
- **Chamada 1:1** como fechamento: o produto é o documento, mas a confiança vem da pessoa.
- **Garantia em destaque** logo no FAQ: remove o risco percebido de pagar CAD 349 por um PDF.
- **Uma página por cidade** com o mesmo esqueleto — prova de que o modelo é replicável por geografia sem produto novo.
- **FAQ como espelho das objeções de compra**, não como manual: "por que é mais barato?", "e se eu não gostar?", "vocês dizem para não comprar?".

## 5. Regras de Negócio e Monetização

### 5.1 Preço
| Produto | Preço |
|---|---|
| Standard (residencial) | **CAD 349 + GST** |
| Commercial | **CAD 500 + GST** |

### 5.2 Estrutura de custo declarada
O FAQ explica por que é mais barato que um escritório de advocacia: **especialista + ferramenta**, sem a estrutura de hora jurídica. Não é IA pura — é humano com plataforma.

### 5.3 Gatilhos de conversão
1. **Prazo de 24 h** — o comprador tem prazo de condição de financiamento; velocidade é o argumento.
2. **Garantia total** — elimina o risco da compra às cegas.
3. **Chamada 1:1** — transforma serviço em relação.
4. **Corretor como comprador recorrente** — quem compra para cliente compra várias vezes por ano.

### 5.4 Moat
- **Processo de obtenção de documento** (saber pedir ao agente certo) é operacional e chato de replicar.
- **Biblioteca de red flags** calibrada por província.
- **Garantia** que só é sustentável com margem e processo.
- **Marca local por cidade.**

## 6. Aplicação Direta no VEREDA

O CondoScan é o concorrente mais parecido com a **hipótese V2/V4** do `market-analysis.md` (venda direta ao comprador pré-sinal e ferramenta para profissional). O preço dele — CAD 349 ≈ R$ 1.300 — é a melhor evidência externa de que o teto de R$ 199–349 do VEREDA é conservador, e não otimista.

### 6.1 As 8 red flags como regras determinísticas no `LeitorDeAta`
Hoje o leitor extrai fatos. O CondoScan mostra que o valor está em **transformar fato em sinal**. Proposta de implementação, toda com trecho literal e página:

| Regra | Como detectar sem inventar | Saída |
|---|---|---|
| Fundo de reserva baixo | saldo declarado ÷ custo do cronograma, quando ambos existem no texto | "fundo cobre X% do previsto" |
| Rateio frequente | contagem de menções a "rateio", "derrama", "chamada extra" nas atas, com data | lista de eventos, não taxa |
| Inadimplência | percentual citado em ata/balancete | valor citado + data |
| Salto de taxa | duas taxas citadas em datas diferentes | "de R$ A para R$ B entre datas" |
| Estudo ausente | ausência de menção a laudo/estudo + idade do edifício | "nenhuma menção no pacote" |
| Déficit | "déficit", "saldo negativo" no balancete | trecho |
| Litígio | "ação", "processo", "notificação" + número | trecho com número |
| Troca de administradora | nomes diferentes de administradora em atas de anos distintos | linha do tempo |

A regra de ouro: **nunca inferir; só reportar o que está escrito**, e quando não estiver escrito, dizer "não menciona" — que o `LeitorDeAta` já faz.

### 6.2 Intake personalizado antes da leitura
O `LeitorDeAta` hoje recebe texto e devolve fatos. O CondoScan mostra que a **ordem certa** é: perguntar o que importa (animal? locação? reforma? criança?) e **priorizar o resumo por isso**. Custo: uma tela. Ganho: o relatório parece feito para a pessoa, e a percepção de valor sobe sem mudar o motor.

### 6.3 Garantia como dispositivo comercial
O VEREDA não vende hoje, mas o `market-analysis.md` já projeta R$ 199–349. Se a venda existir, a garantia total do CondoScan é o padrão a copiar: o custo do reembolso é menor que o custo de aquisição perdido por desconfiança. Vale registrar no plano comercial.

### 6.4 Página por bairro (não por cidade)
O CondoScan replica páginas por município porque o serviço é municipal. O VEREDA é **intraurbano**: a unidade de SEO é o **bairro** (72 no índice). O esqueleto é o mesmo: o que muda neste bairro, quais camadas existem, quais não existem, e o que o índice cobre. Isso é geração estática a partir de `coberturaDasCamadas.ts`.

### 6.5 "Quem busca os documentos" é o gargalo real
O CondoScan resolve o problema que o VEREDA ignora: o comprador **não tem** os documentos e não sabe pedir. O VEREDA pode fazer a versão leve: um **roteiro de pedido** por escrito (o que pedir ao síndico, o que pedir à administradora, o que pedir ao vendedor, prazo legal), pronto para copiar em mensagem. Zero dado novo, resolve a etapa 1.

### 6.6 O que **não** copiar
- **Revisão humana como núcleo**: o `market-analysis.md` já calculou que R$ 35/caso inviabiliza o pacote de 10. O VEREDA automatiza.
- **Promessa de 24 h**: o VEREDA não tem operação 24 h; prometer prazo seria mentir.
- **Aquisição de documento em nome do cliente**: envolve procuração e responsabilidade; fora do escopo.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| 8 regras de red flag | nenhum | médio (regex + testes com atas reais) |
| Intake antes do leitor | nenhum | pequeno |
| Roteiro de pedido de documento | nenhum | pequeno |
| Página por bairro | índice atual | médio |
