# Plano de Validação Externa e Protocolo de Entrevistas — VEREDA

> **Projeto:** VEREDA (Campus Mobile 15ª Edição)  
> **Fase:** Validação com Usuários Reais (Outubro de 2026)  
> **Objetivo:** Coletar evidências empíricas sobre o comportamento de busca, atritos pós-mudança e disposição a pagar sem recorrer a entrevistas fictícias.

---

## 1. Público-Alvo e Amostragem

* **Perfil dos Entrevistados:** 
  * Pessoas que alugaram ou compraram imóvel residencial em centros urbanos densos (São Paulo e Recife) nos últimos 12 meses, OU que estão ativamente buscando imóvel no momento.
  * Faixa etária: 22 a 45 anos.
  * Amostra Alvo Inicial: 15 a 20 entrevistados (10 em São Paulo, 10 em Recife).

---

## 2. Roteiro de Entrevista Semiestruturada (15 Minutos)

O objetivo é entender o **comportamento passado real**, e não opiniões hipotéticas sobre o futuro. Nunca pergunte "Você usaria um app incrível que faz X?". Pergunte "O que aconteceu da última vez que você fez Y?".

### Bloco A: A Jornada Real Passada
1. *"Conte como foi a sua última busca por imóvel: qual foi o momento mais frustrante entre achar o anúncio e assinar o contrato?"*
2. *"Durante a busca, você já tentou descobrir o endereço ou o nome de um prédio que o anúncio não mostrava? Como você fez isso?"*
3. *"Qual foi o maior 'susto' ou surpresa que você teve depois que mudou para o apartamento atual (barulho, taxa de condomínio, vizinho, sol, água)?"*

### Bloco B: Dinâmica Financeira
4. *"O valor total que você paga por mês de moradia hoje bate exatamente com o valor que estava anunciado no portal quando você visitou pela primeira vez? O que veio a mais?"*
5. *"Se você pudesse saber antes da visita que o condomínio teria uma taxa extra de R$ 200/mês ou que haveria uma obra vizinha por 2 anos, o que você teria feito de diferente?"*

### Bloco C: Teste de Usabilidade com o Protótipo VEREDA
6. *[Apresentar o protótipo móvel index.html em tela de celular]:*  
   *"Dê uma olhada neste dossiê de um apartamento na Bela Cintra. O que você acha que significa essa linha de 'Ainda Não Sabemos' e o botão de WhatsApp?"*
7. *"Comparando com o anúncio tradicional do ZAP ou QuintoAndar, essa informação muda a sua postura antes de agendar a visita?"*

---

## 3. Matriz Estruturada de Registro de Evidências

Toda entrevista deve ser registrada na planilha da equipe utilizando o seguinte gabarito:

| ID | Cidade | Tipo (Aluguel/Compra) | Anunciado vs. Real (R$) | Maior Atrito Pós-Mudança | Como Tentou Investigar | Reação ao Dossiê VEREDA | Disposição a Pagar (R$ 9,90) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| #01 | SP | Aluguel | R$ 3.800 ➔ R$ 4.250 | Barulho de bar embaixo | Olhou Street View | "Deveria ser obrigatório" | Sim (se evitar taxas) |
| #02 | Recife| Aluguel | R$ 2.400 ➔ R$ 2.780 | Falta d'água no rodízio | Perguntou ao porteiro | "Muito útil pro WhatsApp" | Sim |

---

## 4. Protocolo de Comparação Metodológica

Para demonstrar a superioridade do mecanismo à banca do Campus Mobile, a equipe executará um teste cego comparando:
1. **Busca Manual Tradicional:** Usuário recebe um link de anúncio e tem 10 minutos para pesquisar no Google, Street View e portais.
2. **IA Genérica (ChatGPT / Perplexity):** Usuário cola o texto do anúncio e pede uma análise de riscos.
3. **VEREDA:** Usuário insere o link e recebe o Dossiê em 60 segundos.

### Variáveis Medidas no Teste:
* Tempo até a identificação do edifício correto.
* Taxa de acerto sobre a declividade da rua (% de aclive).
* Descoberta de alvarás de obras vizinhas (0% na IA genérica vs. 100% no VEREDA).
* Clareza das perguntas a serem feitas na vistoria.

---

## 5. Critérios de Descarte e Pivot (Kill Criteria)

Se durante as entrevistas com usuários reais observarmos:
* **Hipótese Falsa 1:** "Os usuários não se importam com custos ocultos de até R$ 200/mês." ➔ *Ação:* Reposicionar o foco do produto inteiramente para conforto ambiental (ruído, sol, obras).
* **Hipótese Falsa 2:** "Os usuários preferem que a IA dê uma nota de 0 a 10 em vez de mostrar fatos e lacunas." ➔ *Ação:* Reavaliar a interface para incluir um índice sintetizado mantendo o detalhamento de auditoria.
