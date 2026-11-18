# app20 — Docket

Coleta: 17/11/2026. Fontes: `docket.com.br` (home, `/produtos/`, `/solucoes/segmentos/real-estate/`, `/freemium/`, `/registro-docket/`, `/casos-de-sucesso/*`, `/docket-ia/`, `/hub/`, `/controle/`, `/a-empresa/`).

## 1. Identificação da Solução

- **Nome:** Docket (CNPJ 23.522.710/0001-87).
- **URL:** https://docket.com.br.
- **Mercado:** **Brasil**.
- **Público-alvo:** empresas com operação documental intensiva — **real estate**, agronegócio, energia, indústria de base, varejo, serviços financeiros.
- **Proposta central:** "o novo padrão para lidar com documentos" — **buscar, emitir, analisar e gerir** certidões, matrículas, registros e contratos em escala, com IA própria e alerta de vencimento.
- **Autodefinição legal (importante):** *"plataforma privada que facilita a gestão e emissão de documentos junto a cartórios. Não somos um órgão oficial do governo."*

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Hub — emissão e solicitação
- Conexão com **mais de 35 mil órgãos públicos** no Brasil.
- **Kits personalizados** por tipo de operação: um pacote de documentos vira um pedido só.
- Documentos cobertos: **certidões, matrículas, registros, contratos sociais, certidões de penhor e de alienação fiduciária, procurações**.
- **Acompanhamento de status** de entrega por documento.
- Objetivo declarado: reduzir deslocamento e trabalho manual, acelerar o fechamento.

### 2.2 Docket IA — leitura
- IA **treinada com mais de 100 mil documentos**.
- Interpreta de documentos simples (RG, CNH, conta de luz, água, telefone, holerite, título de eleitor) a complexos (contrato social, certidão de matrícula, certidão de penhor, alienação fiduciária).
- Campos extraídos declarados:
  - **restrições**;
  - **gravames**;
  - **positivo/negativo**;
  - **valor da dívida**;
  - **dados do proprietário**;
  - **histórico de transações**.
- Redução declarada de **até 80% do tempo** de análise manual.
- Duas camadas: **IA básica** (extração em lote, documentos simples) e **IA avançada** (documentos complexos).

### 2.3 Controle — gestão e vencimento
- Centraliza **documentos regulatórios, licenças e alvarás**.
- **Alertas de vencimento** e de **condicionantes**.
- Visão por unidade da empresa.
- Substitui planilha de controle.
- Este é o produto que responde exatamente ao problema do `app15_homewisedocs.md`, já em português e já vendido.

### 2.4 API
- API para **busca, emissão e análise** de documentos, integrável a sistemas do cliente.
- Conformidade LGPD declarada.

### 2.5 Real Estate — os cinco casos de uso
| Caso de uso | O que resolve |
|---|---|
| **Due diligence** | pacote de certidões e matrícula por imóvel |
| **Monitoramento de SPEs** | acompanhamento contínuo da sociedade de propósito específico |
| **Financiamento (DJU/DJE) e memorial de incorporação** | documentos do registro e da incorporação |
| **Repasse** | transferência de unidade e quitação |
| **Gestão de estoque de unidades e empreendimentos** | controle documental por unidade |

### 2.6 Freemium
- Uso gratuito da IA para testar: "em poucos segundos, as informações mais importantes dos seus documentos estão disponíveis para analisar e copiar".
- Também oferece **análise gratuita da operação** como isca B2B.

### 2.7 Registro Docket
- Produto para **registro de CPR** (crédito agrícola), em parceria com a **Trillia**, reutilizando dados da operação.
- Mostra a direção da empresa: não só buscar documento, mas **praticar o ato registral**.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** CNPJ/CPF e dados da parte, número de matrícula, lista de documentos do kit, PDF/imagem para leitura.

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Certidões e matrículas | **35 mil+ órgãos** (cartórios, tribunais, prefeituras, juntas) | público, mediante taxa |
| Contratos sociais | Junta comercial | público |
| Documentos do cliente | upload | privado |
| Norma e prazo | regra própria por tipo de documento | derivado |

**Artefato final:** documento emitido e arquivado, campos extraídos em JSON, alerta de vencimento, e relatório de status por operação.

## 4. Mecânica de UI/UX e Visualização

- **Kit de documentos como produto**: o usuário não escolhe 14 certidões; escolhe "due diligence de compra" e recebe o pacote.
- **Status por documento** (pedido, emitido, vencido) — a mesma gramática de três estados do `app15`.
- **Alerta de vencimento e de condicionante** como notificação de primeira classe.
- **Extração em painel lado a lado** com o documento, para conferência.
- **Freemium como demonstração**: o usuário testa a IA no próprio documento antes de falar com vendas.
- **Disclaimer de não-vinculação com o governo** no rodapé de todas as páginas — padrão de compliance que protege a marca.

## 5. Regras de Negócio e Monetização

- **Modelo:** SaaS B2B por operação/volume + taxa de emissão repassada + freemium + API.
- **Gatilho:** o custo de um analista júnior lendo certidão é maior que a assinatura; o produto vende **substituição de horas**.
- **Moat:**
  1. **35 mil órgãos conectados** — integração operacional e jurídica, não código.
  2. **100 mil documentos** de treino no domínio registral brasileiro (linguagem, formato, cartório).
  3. **Rede de parceiros** e casos públicos (Banco Carrefour, Sicredi, Gerdau, Klabin, TIM, Sicoob).
  4. **Controle de vencimento**, que cria dependência operacional (o cliente não desliga).

## 6. Aplicação Direta no VEREDA

Este é o dossiê com a consequência estratégica mais direta de todos: **a camada operacional de documentos no Brasil já tem dono**. O VEREDA não deve tentar buscá-los.

### 6.1 Conclusão de escopo: integrar, não construir
O `app15_homewisedocs.md` recomendou um "Pacote do imóvel" com estados. O Docket **já faz isso** — com 35 mil órgãos, IA treinada e clientes bancários. Reconstruir seria meses de trabalho para chegar atrás.

A recomendação correta muda para:

| Camada | Quem faz |
|---|---|
| **Buscar e emitir** certidão, matrícula, contrato social | **Docket** (ou equivalente) |
| **Controlar vencimento** de licença e alvará | **Docket — Controle** |
| **Ler e interpretar** o que chegou, cruzado com o lugar | **VEREDA** |
| **Decidir** com base no conjunto | **VEREDA** |

Ou seja: o VEREDA se posiciona **depois** do documento, não antes. Isso simplifica o produto e reduz risco.

### 6.2 O schema de campos da matrícula é aproveitável hoje
O Docket publica a lista de campos que extrai de matrícula e certidão. Essa lista é o **schema canônico** para o `LeitorDeAta` quando o texto for de matrícula, e o VEREDA pode adotá-la sem custo:

```
restrições · gravames · positivo/negativo · valor da dívida
proprietário · histórico de transações
```

Hoje o `LeitorDeAta` extrai "fatos financeiros e jurídicos" de forma genérica. Com esse schema, o resultado fica **estruturado e comparável** entre imóveis — e é o que permite a linha do tempo e o pacote para especialista.

### 6.3 O disclaimer de não-vinculação é obrigatório
O Docket deixa claro em todas as páginas: *"não somos um órgão oficial do governo"*. O VEREDA, que publica leitura de dado municipal, precisa do equivalente — e já tem parte disso na cultura ("sem leitura publicada", "snapshot, não prova"). Recomendação: uma linha fixa no rodapé do dossiê e do pacote:

> Leitura independente de dados públicos. Não substitui certidão, laudo ou parecer de profissional habilitado.

### 6.4 Freemium no documento do próprio usuário
O Docket mostra que a conversão mais forte em documento é **deixar o usuário colar o próprio documento e ver o que sai**. O `LeitorDeAta` já é exatamente isso, e é gratuito. Isso é um ativo de aquisição que o VEREDA tem e não explora na comunicação.

### 6.5 O que **não** copiar
- **Emissão de certidão**: exige conexão com 35 mil órgãos, repasse de taxa e responsabilidade. Fora de escopo.
- **Registro de CPR/garantias**: outro mercado.
- **Venda por "substituição de analista"**: o VEREDA fala com o comprador, não com o departamento de operações.
- **Treinar IA com 100 mil documentos**: o VEREDA processa no dispositivo e não tem corpus.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Schema de matrícula no `LeitorDeAta` | nenhum | pequeno-médio |
| Disclaimer fixo no rodapé | nenhum | pequeno |
| Texto de posicionamento "depois do documento" | nenhum | pequeno |
| Integração com Docket | contrato B2B | não recomendado agora |
