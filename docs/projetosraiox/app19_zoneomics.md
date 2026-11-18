# app19 — Zoneomics (e Bassett.ai)

Coleta: 17/11/2026. Fontes: `zoneomics.com` (home, `/pricing/api`, `/pricing/reports`, `/zoning-maps`, `/usecases/*`, `/blog`, `/docs/v2`), `bassett.ai`.

## 1. Identificação da Solução

- **Nome:** Zoneomics; em 2026 lançou **Bassett.ai**, descrito como "sistema operacional de IA para inteligência de zoneamento".
- **URL:** https://www.zoneomics.com · https://www.bassett.ai.
- **Público-alvo:** avaliador, credor, incorporador, escritório de advocacia, REIT, e **portais** que querem responder "o que dá para fazer neste lote?" dentro da página do imóvel.
- **Proposta central:** pegar o zoneamento — que é **criado e mantido localmente, com regra diferente em cada município** — e entregar como **dado padronizado, consultável e reportável** por lote.

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Escala
- **+27.000 cidades** digitalizadas.
- **+136,9 milhões de lotes** pesquisáveis.
- **+392 milhões de acres** cobertos.
- Exemplos de granularidade: **Nova York** 1,6 milhão de lotes e **204 distritos** de zoneamento; **Los Angeles** 439 mil lotes e **2.120 distritos**; **Houston** 636 mil lotes e **1 distrito** (não tem zoneamento tradicional — a ausência é dado).

### 2.2 Quatro produtos
| Produto | O que é |
|---|---|
| **Zoning Search** | consulta por endereço/lote: zona, usos permitidos, controles |
| **Prospecting** | filtro de imóveis por **zona, uso permitido, largura e altura do lote** — busca invertida |
| **Zoning API** | acesso programático por ponto, em lote, e **tiles** |
| **Reports** | **Zoning Brief, Summary Report, Full Report, Certified Zoning Letter**; relatórios para endosso **ALTA 3.0/3.1**; **Pre-Insights Report** |
| **Bassett.ai** | assistente que responde sobre zoneamento com base na base |

### 2.3 Estrutura do dado
- **Tipo e subtipo** de zona padronizados.
- **Usos permitidos** e **condicionalmente permitidos**.
- **Controles numéricos**: altura, FAR, recuos, ocupação, área e largura do lote, área livre.
- **Contexto local**: código bruto, descrição, município, link para a norma.
- **Camada FLUM** (Future Land Use Map): uso futuro, usos, controles e tiles próprios.

### 2.4 O que o mercado usa na prática
Dois depoimentos publicados explicam o valor melhor que qualquer feature:

- **Redfin** (Chief Growth Officer): *"usuários do Redfin nos perguntam todo dia se um imóvel pode ser alugado no Airbnb ou se dá para construir outra unidade no fundo; agora encontram a resposta direto na página do imóvel"*.
- **Crexi** (VP de Produto): permite avaliar **o que é possível** com um lote "não só agora, mas potencialmente no futuro", e tornar o dado "conversacional em vez de planilha ou PDF".

### 2.5 Precificação
**API (mensal; anual com 20% de desconto):**

| Plano | Preço | Tiles | Chamadas por ponto | Outros |
|---|---|---|---|---|
| Starter | **$134/mês** | 10.000 | 100 | — |
| Builder | **$284/mês** | 25.000 | 250 | 1.000 Zone Permits |
| Growth | **$549/mês** | 75.000 | 600 | 3.000 permits, 5.000 *prospector*, 100 consultas Bassett |
| Custom | sob consulta | — | — | todos os schemas |

Overages: **$1,75 → $1,20 por chamada**, **$1,50 → $0,75 por mil tiles**, **$0,40 → $0,25 por crédito** de licença, **$0,12 por imóvel** desbloqueado.

**Relatórios (due diligence):**

| Plano | Preço | Inclui |
|---|---|---|
| Flexível | **$870 por relatório** | 1 relatório, Pre-Insights, Bassett 50 msg/mês, 50 buscas/mês |
| Insight | **$594/mês** (anual) | 12 relatórios/ano, Bassett 600 msg/mês, 150 buscas/mês, técnico dedicado, 5 assentos |
| Premium | sob consulta | ilimitado, 1.500+ msg, 12+ assentos |

**Restrição contratual importante:** o dado de API é **para uso interno e pesquisa**; **proibido republicar, redistribuir ou revender** sem autorização escrita, em todos os planos.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas:** endereço, lote/parcela, ponto, polígono, ou critérios (zona, uso, dimensão).

**Fontes cruzadas:** normas municipais de zoneamento (fragmentadas, milhares de fontes), mapas de zoneamento, **FLUM**, limites de lote, e — no Bassett — a própria norma indexada.

**Artefato final:** JSON por lote, tiles, relatório em PDF (do *brief* à **carta certificada**), lista de lotes que atendem a um critério, e resposta conversacional.

## 4. Mecânica de UI/UX e Visualização

- **Mapa de zonas colorido** com painel de "o que é permitido aqui".
- **Tabela de controles** (altura, FAR, recuos) no formato de ficha técnica.
- **Busca invertida (Prospecting)** com filtros de zona e dimensão — a ferramenta que o incorporador usa para achar terreno.
- **Escada de relatório**: *brief* → *summary* → *full* → **carta certificada**. O usuário compra o nível de formalidade que o banco ou o advogado exige.
- **Assistente conversacional** por cima do dado estruturado, não no lugar dele.

## 5. Regras de Negócio e Monetização

- **Modelo:** API por volume em três degraus; relatório avulso caro ($870) e assinatura de relatório; enterprise.
- **Gatilho:** a **carta certificada** é o produto que fecha negócio — sem ela, o banco não aceita.
- **Moat:**
  1. **27.000 cidades** digitalizadas à mão/assistidas — barreira de operação.
  2. **Padronização** de regras incompatíveis.
  3. **Distribuição em portais** (Redfin, Crexi), que coloca a resposta na página do imóvel.
  4. **Rede de técnicos** que assinam relatório.
- **Limite:** o dado é para uso interno; quem quer publicar precisa de licença — o que limita o produto de quem consome.

## 6. Aplicação Direta no VEREDA

O Zoneomics é o **benchmark mais próximo da tela de lote do VEREDA** e resolve a pergunta que o VEREDA hoje não responde. Duas lições grandes e várias pequenas.

### 6.1 As duas perguntas que as pessoas realmente fazem
O depoimento do Redfin entrega de graça a pesquisa de produto que o VEREDA precisaria fazer: **"posso alugar por temporada?"** e **"posso construir outra unidade no fundo?"**.

O VEREDA pode responder a segunda de forma determinística com a LPUOS: taxa de ocupação, coeficiente, recuo de fundo e gabarito. E a primeira com o `LeitorDeAta` (convenção do edifício). Nenhum concorrente brasileiro junta as duas. **Isso é posicionamento**, não feature.

Proposta de bloco na tela de lote:

```
O QUE DÁ PARA FAZER AQUI
Construir nos fundos      permite, até X m² (LPUOS art. …)
Ampliar para cima         não permite (gabarito atingido)
Alugar por temporada      depende do edifício — ver convenção
```

### 6.2 A escada de relatório é a escada do VEREDA
Hoje o VEREDA tem **resumo** (dossiê) e **pacote para especialista** (print/`.md`/`.html`). O Zoneomics mostra três degraus, e o degrau do meio falta:

| Zoneomics | VEREDA |
|---|---|
| Zoning Brief | `FichaViva` + cartões de insight |
| Summary Report | **falta** — dossiê de 2–4 páginas com fonte e data |
| Full Report | `Pacote para especialista` |
| Certified Zoning Letter | não existe equivalente; exige responsável técnico |

O **Summary Report** é o produto que o VEREDA pode criar sem responsável técnico: leitura organizada, com fonte, data, e "o que não sabemos".

### 6.3 "A ausência é dado" (Houston com 1 distrito)
Houston aparece com **1 distrito** porque não tem zoneamento tradicional. O Zoneomics **conta isso como cobertura**, não como falha. É a mesma lição do `NZ` do Regrid (`app18`): distinguir ausência confirmada de cobertura faltante. O VEREDA deve dizer "não há zoneamento neste trecho" quando for o caso, e não "sem leitura".

### 6.4 Busca invertida por atributo de lote
O **Prospecting** filtra imóveis por zona, uso e dimensão do lote. É o análogo do `A23` ("Onde mais procurar"), mas pelo atributo do terreno em vez do tempo de viagem. O VEREDA pode oferecer, dentro do índice: "terrenos com mais de X m² e gabarito acima de Y neste bairro". Isso serve ao comprador que quer construir e ao investidor que quer estoque.

### 6.5 O assistente por cima do dado, nunca no lugar dele
O Bassett responde **a partir da base estruturada**, não de geração livre. É exatamente a regra que o VEREDA deve seguir se algum dia tiver chat: **resposta só com citação de lei, artigo e parágrafo**. O modelo do Zoneomics valida a arquitetura do `app7_place_ospa.md`.

### 6.6 O que **não** copiar
- **Carta certificada**: exige responsável técnico e seguro; fora do escopo.
- **Restrição de republicação**: o VEREDA é aberto por decisão; comprar dado com cláusula de não redistribuição mataria o modelo.
- **Preço por relatório de $870**: o mercado brasileiro de compra de imóvel não paga isso; serve só como teto de referência para o B2B.
- **Cobertura de 27.000 cidades**: o VEREDA é uma cidade.

### 6.7 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Bloco "o que dá para fazer aqui" | LPUOS (público) | médio |
| Summary Report (2–4 páginas) | nenhum | pequeno-médio |
| Busca invertida por atributo de lote | nenhum (índice) | médio |
| Três estados de ausência | nenhum | pequeno |
