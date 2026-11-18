# app30 — Ownwell

Coleta: 17/11/2026. Fontes: `ownwell.com` (home, `/pricing`, `/appeal`, `/appeals`, `/exemptions`, `/commercial`, `/tax-bill-management`, `/resources/{estado}-property-taxes-101`, `/competitors`, `/results/texas-...`).

## 1. Identificação da Solução

- **Nome:** Ownwell, Inc. (Austin, Texas), fundada em 2020.
- **URL:** https://www.ownwell.com.
- **Público-alvo:** **proprietário residencial** (principal) e investidor de aluguel; depois, comercial.
- **Proposta central:** **reduzir o imposto predial** do proprietário — contestar o valor avaliado, aplicar isenções, pagar a conta — **sem custo inicial e cobrando só se economizar**.
- **Números declarados (2025):** **88%** de taxa de sucesso; **$774** de economia média anual; **4,7** com **3.000+** avaliações; cobertura em **9 estados**.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 O funil de 15 segundos (o produto real)
A home abre com um único campo:

> "**Get Savings Estimate** — veja sua economia em ~15 segundos."

Fluxo: endereço → dado público do imóvel (valor avaliado, valor de mercado, imposto atual) → **estimativa de economia** → só então cadastro e contratação. Três decisões de produto embutidas:
1. **Número antes de cadastro.**
2. **Tempo prometido** ("15 segundos"), não "rápido".
3. **Economia em reais/dólares**, não em percentual.

### 2.2 Os seis serviços
| Serviço | O que faz |
|---|---|
| **Property Tax Appeals** | contesta o valor avaliado junto ao condado |
| **Property Tax Exemptions** | aplica isenções (residência principal, veterano, idoso, deficiência) |
| **Commercial Tax Appeals** | mesma lógica para imóvel comercial |
| **Tax Bill Payments** | paga a conta do imposto pelo proprietário |
| **Ownwell Energy** | compara e troca fornecedor de energia |
| **Home Insurance / Bill Reduction** | seguro e redução de contas |

A lógica de expansão é clara: começa com **um** problema caro e recorrente (imposto), ganha confiança, e vende os outros três que todo proprietário tem.

### 2.3 O modelo "só paga se economizar"
- **Sem custo inicial**, sem taxa escondida.
- **Honorário é percentual da economia obtida** (confirmado nas FAQs da página de preço).
- **Garantia "savings-or-free"**.
- Se não houver redução, o cliente não paga nada — e o custo do trabalho é do Ownwell.

Esse desenho **transfere o risco de qualidade** para o fornecedor e resolve a objeção clássica ("e se não der certo?"). É o mesmo desenho que o `app5_first_street` usa em conteúdo: mostrar o resultado antes de pedir confiança.

### 2.4 Páginas por estado e o conteúdo educativo
- `resources/{estado}-property-taxes-101`: como o imposto é calculado em cada estado, prazos, como contestar.
- `results/texas-...`: **resultados por escritório/agente**, com desempenho comparável.
- `competitors`: comparação direta.
- `trends` / `insight`: dado de mercado próprio.

### 2.5 Transparência de resultado
Publicar **taxa de sucesso por mercado** e **resultado por agente** é raro no setor de serviço. Funciona como prova e como controle de qualidade interno.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** endereço (e depois CPF/identidade, documento do imóvel).

**Fontes cruzadas:**
| Camada | Origem | Tipo |
|---|---|---|
| Valor avaliado e histórico | assessoria do condado | público |
| Valor de mercado / comparáveis | dado de venda e modelo | público + derivado |
| Alíquota e regra de isenção | legislação estadual/local | público |
| Documento do proprietário | upload | privado |
| Prazo de contestação | calendário do condado | público |

**Artefato final:** **contestação protocolada**, decisão do condado, **nova avaliação**, isenção aplicada, e conta paga.

## 4. Mecânica de UI/UX e Visualização

- **Um campo, um número, quinze segundos.**
- **Economia em valor absoluto**, com o cálculo visível.
- **"Só paga se economizar"** como selo, não letra miúda.
- **Prova social quantificada** (88%, $774, 4,7/3.000).
- **Resultado por agente** publicado — accountability.
- **Conteúdo por estado** que responde à dúvida antes da venda.

## 5. Regras de Negócio e Monetização

- **Modelo:** *contingency fee* — percentual da economia, sem custo inicial.
- **Gatilho:** a conta de imposto é **recorrente, obrigatória e visível**; qualquer redução é dinheiro no bolso.
- **Moat:**
  1. **Dado de avaliação e regra por condado**, com prazos corretos.
  2. **Operação de protocolo** em 9 estados — trabalho, não código.
  3. **Histórico de resultado** que calibra a estimativa de economia.
  4. **Confiança pelo modelo de risco invertido.**

## 6. Aplicação Direta no VEREDA

O Ownwell é o dossiê mais perigoso do conjunto, porque a tentação é copiar o serviço — e o VEREDA **não pode** fazer avaliação de valor. Mas três mecânicas são aproveitáveis e uma delas é uma feature nova legítima.

### 6.1 A feature permitida: checklist de isenção de IPTU
Isenções são **regra pública determinística**: não dependem de avaliar o imóvel, dependem de **fato e documento** (residência única, faixa de renda, idade, deficiência, imóvel histórico). É conteúdo, não valuation.

Proposta de bloco na tela `Custo`:

```
IPTU — você pode ter direito a isenção
Imóvel único e residencial          verificar
Rendimento familiar até …           verificar
65 anos ou mais                     verificar
Imóvel em área de preservação       verificar
→ Como pedir: … (link e prazo)
```

Isso entrega valor real, é verificável, e não cruza a linha de "quanto vale o imóvel". É o mesmo tipo de conteúdo que o `app19` (§6.1) propõe para zoneamento: **direito aplicável**, não opinião de valor.

### 6.2 O funil de 15 segundos deve ser o da tela `Custo`
O VEREDA tem a tela de custo mensal, mas ela provavelmente pede mais dado do que devolve número. O Ownwell inverte: **um campo** (endereço), **um número** (custo mensal estimado), **quinze segundos**, e só depois o detalhe.

```
Rua / endereço          [_______________]
→ Custo mensal estimado: R$ 1.840
   condomínio R$ 620 · IPTU R$ 180 · luz/água R$ 240 · …
```

A estimativa deve sair com **origem por linha** (anúncio, cadastro, média do bairro) — porque o VEREDA não pode errar em silêncio. Mas o formato "número primeiro, detalhe depois" é o certo.

### 6.3 Publicar taxa de acerto e resultado por tipo de análise
O Ownwell publica 88% de sucesso e resultado por agente. O VEREDA pode fazer o equivalente, e isso é **enorme** para credibilidade, porque nenhum concorrente brasileiro faz:

```
Qualidade das nossas leituras (últimos 90 dias)
Campos extraídos de ata            91% de acerto
Vínculo lote ↔ edifício            97%
Tipo de licença identificado       78%  ← em melhoria
Camadas com cobertura nas 6 áreas  100% / 72 bairros: parcial
```

Publicar **onde o produto erra** é o inverso do marketing padrão e é o que sustenta a postura de "leitura independente". Encaixa com o `R17` e com o `app29` §6.4 (dizer quando não há base).

### 6.4 "Só paga se economizar" como modelo de qualquer serviço futuro
Se o VEREDA algum dia cobrar pelo `Pacote para especialista` ou por uma revisão, o desenho do Ownwell — **sem custo inicial, honorário sobre o resultado, garantia de devolução** — é o único compatível com a desconfiança do comprador brasileiro de imóvel. Não é preço: é **transferência de risco**.

### 6.5 O que **não** copiar
- **Contestar avaliação / contestar IPTU**: exige avaliar valor e assumir responsabilidade perante o fisco. `A21`/`A31` adiados; valuation bloqueado.
- **Estimativa de valor de mercado**: bloqueado.
- **Pagar conta de terceiro**: operação financeira, fora de escopo.
- **Venda de energia e seguro**: outro negócio.
- **Promessa de economia**: o VEREDA informa custo, não promete redução.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Checklist de isenção de IPTU | legislação municipal (pública) | pequeno-médio |
| Tela `Custo` com número primeiro | nenhum | pequeno-médio |
| Página de qualidade das leituras | medição interna | pequeno (após medir) |
