# app4 — Localize.city

Coleta: 17/11/2026. Fontes: `localize.city` (home, `/nyc/explore.html`, `/nyc/for-sale/*`, `/agents.html`, sitemap de 909 URLs), posts `/blog/localize-offers-sunlight-analysis-...`, `/blog/sun-drenched-or-sun-starved-...`.

## 1. Identificação da Solução

- **Nome:** Localize.city.
- **URL:** https://www.localize.city.
- **Escopo:** **Nova York** (o produto nasceu com ambição multi-cidade e hoje opera essencialmente NYC).
- **Público-alvo:** comprador e inquilino de Nova York, e **corretor** como canal de aquisição.
- **Proposta central:** "a verdade sobre cada anúncio" — checar cada afirmação da listagem **contra dados da cidade**, e antecipar o que vai mudar no endereço (obra aprovada, vista que será bloqueada, sol que vai embora).

## 2. Mapeamento Completo de Funcionalidades

### 2.1 Camadas de insight por endereço
| Insight | O que entrega | Fonte implícita |
|---|---|---|
| **Luz natural / sol** | quanto sol a fachada e a unidade recebem, ao longo do dia e do ano | LiDAR + modelo 3D da cidade |
| **Vista que será bloqueada** | "o prédio vizinho vai cortar sua vista" | licenças/obra planejada + geometria |
| **Obra planejada** | construção aprovada na vizinhança, com o que ela muda | dados de permissão municipal |
| **Violações abertas** | violação de edificação registrada e não resolvida | DOB/HPD |
| **Problema de elevador** | elevador quebrado reportado (ex.: chamado 311) | 311 |
| **Criminalidade** | taxa comparada à média da área | dados de crime da cidade |
| **Escolas** | escola de zona e indicadores | DOE |
| **Deslocamento** | tempo de commute por modo | rede de transporte |
| **Preço abaixo do similar** | "22% abaixo de anúncios semelhantes" | base de listagens |
| **Direito de ampliar** | potencial de acrescentar área construída | zoneamento (FAR) |
| **Ruído** | fontes de ruído e nível relativo | derivado de vias e POIs |

### 2.2 Formato de apresentação: o cartão de insight
A página `/nyc/explore.html` é a melhor peça de design do produto: cada endereço é um **cartão com etiqueta de categoria, frase de consequência e endereço**:

> **ELEVATOR ISSUES** — Broken elevator reported — 311 East 79 St, Manhattan
> **VIEW TO BE BLOCKED** — Bldg's view could be cut off in the future — 493 4 Ave, Brooklyn
> **CRIME** — Above average crime rate — 196 Orchard St, Manhattan
> **LOW PRICE** — Price is 22% lower than similar listings! — 15 Hudson Yards, Manhattan
> **RIGHT TO ADD SQ FT** — Potential to add square footage — 559 Grand St, Manhattan

Cada cartão é simultaneamente **exemplo, prova de capacidade e conteúdo de aquisição**. Não há dashboard; há uma pilha de fatos.

### 2.3 Busca e listagem
- Busca por endereço ("Check any address") e por listagem.
- Filtros por preço, quartos e **comodidades** (roofdeck, garden, balcony, courtyard, patio, washer/dryer, home office, park view, city view, gym, doorman, parking, pets).
- Ordenação "Best Match" e por preço.
- 7.467 imóveis em Manhattan no momento da coleta.

### 2.4 Página de bairro
`/nyc/for-sale/<bairro>-neighborhood-manhattan-new-york-ny.html` para dezenas de bairros, com contagem de listagens. Serve SEO e navegação.

### 2.5 Ferramenta para corretor
- `/agents.html`: "Localize for agents".
- Programa de indicação com **30% de comissão** sobre o negócio gerado.
- **Agent HQ** com upload de leads em CSV.
- O corretor usa a ferramenta como prova de valor na conversa com o cliente.

## 3. Fluxo de Dados e Inputs/Outputs

**Entradas do usuário:** endereço, ou filtros de busca de listagem.

**Fontes cruzadas (declaradas e inferidas do produto):**
| Camada | Fonte | Tipo |
|---|---|---|
| Geometria 3D dos edifícios | **LiDAR** municipal + modelo 3D da cidade | público |
| Eixos de rua e calçadas | *street centerline* | público |
| Posição do sol e sombra | cálculo astronômico com **Cesium + Pysolar** | determinístico |
| Licenças e obras | DOB (Department of Buildings) | público |
| Violações | DOB / HPD | público |
| Chamados 311 | NYC 311 | público |
| Crime | NYPD | público |
| Escolas | NYC DOE | público |
| Zoneamento (FAR) | Zoning Resolution | público |
| Listagens | MLS/portais parceiros | privado |
| Árvores (crescimento) | inventário de árvores da cidade | público |

**Artefato final:** página de endereço/edifício com os insights, e página de listagem enriquecida. Sem PDF. O produto é a **consulta**, não o dossiê.

## 4. Mecânica de UI/UX e Visualização

- **A etiqueta é o produto.** "VIEW TO BE BLOCKED" em caixa alta comunica mais que qualquer gráfico.
- **Consequência no título, dado no corpo.**
- **Um cartão por fato**, empilhados — não um score agregado. O usuário escolhe o que importa.
- **Futuro como camada**: quase todos os concorrentes descrevem o presente; o Localize descreve o que **vai mudar**, que é a pergunta que o comprador realmente faz.
- **Exemplos reais na home de exploração**, que funcionam como demonstração permanente.
- **Corretor como distribuidor**, com comissão — o insight vira argumento de venda.

## 5. Regras de Negócio e Monetização

- **Consumidor:** gratuito para buscar e ver insights; monetização pelo **lado do corretor**.
- **Corretor:** programa de indicação com **30% de comissão**, painel de leads e upload CSV.
- **Moat:**
  1. **Pipeline geométrico** (LiDAR + 3D + solar) que poucos conseguem montar fora de uma cidade com dados abertos.
  2. **Cruzamento futuro** (licença + geometria), que exige as duas coisas ao mesmo tempo.
  3. **Marca "truth"** contra o "fluff" do anúncio.
- **Limite estrutural:** o modelo depende de cidade com LiDAR e dados abertos. É replicável em NYC, São Francisco, talvez Chicago — **não** é replicável em Recife. Isso é uma lição, não um defeito.

## 6. Aplicação Direta no VEREDA

O Localize é o concorrente conceitual mais próximo do VEREDA: mesma tese (checar o anúncio contra o dado), mesma unidade (endereço/edifício), mesma recusa de adjetivo. As diferenças: ele tem geometria 3D e permissão de obra; o VEREDA tem **cadastro, licenciamento, chuva, noite, sol e a rua** — e um índice de **7.206 edifícios em 72 bairros**.

### 6.1 "Sua vista pode ser bloqueada" — implementável hoje, com dado que já existe
Este é o insight de maior valor por unidade de esforço em todo o dossiê. O VEREDA **já tem os três ingredientes**:

1. **Obra licenciada nos últimos 24 meses** com número de pavimentos (`Licenciamento urbanístico`, camada `obras`, e o `MapaDoLote` já mostra o pino com status de licença).
2. **Altura do edifício do usuário** (índice: lotes e pavimentos).
3. **Orientação da fachada da unidade** (o `SimuladorDaUnidade` já tem bússola 3×3).

Regra: para cada obra licenciada num raio de ~150 m, se `pavimentos_obra × altura_média_pavimento > altura_do_edifício` **e** a obra cai dentro do cone de visão da fachada escolhida, gerar o cartão:

> **VISTA** — há obra licenciada a 82 m, com 18 pavimentos, na direção da sua fachada. Se for construída, ela fica acima da sua laje.

Isso não é previsão: é **licença registrada + geometria**. A frase "se for construída" é obrigatória, e o VEREDA já usa esse cuidado ("snapshot, não prova de obra", P05).

### 6.2 Sombra futura, não só sombra atual
O `SolNasFachadas` e o classificador "Sol e sombra" calculam sombra de prédios **existentes**. O Localize mostra que a pergunta de valor é a sombra do prédio **ainda não construído**. O VEREDA pode acrescentar um modo "com as obras licenciadas" no `MapaDoLote` a 2.5D: a mesma cena, com os volumes aprovados em contorno tracejado. Custo baixo, impacto alto na percepção.

### 6.3 O cartão de insight como padrão de tela
O `FichaViva` usa *pills* de 15 s. O cartão do Localize é a evolução natural: **etiqueta + frase + endereço**. Proposta de padronização para os achados do dossiê:

```
[OBRA]        Obra licenciada a 82 m, 18 pavimentos, na direção da sua fachada
[CHUVA]       3 registros de alagamento nesta rua desde 2014
[NOITE]       Bar a 40 m na face da frente; a face do fundo não tem fonte próxima
[SOL]         Fachada norte: sol direto das 9h às 13h no equinócio
[ESCALA]      Edifício de 1982, 12 pavimentos, 96 unidades
```

Cada cartão abre o detalhe com fonte e data. É exatamente o que o `FEATURE-REGISTER` já promete ("consequência em linguagem comum primeiro; contagem, detalhe, fonte e data atrás do toque").

### 6.4 "Direito de ampliar" invertido
O Localize mostra ao **proprietário** o potencial de ampliar. O VEREDA fala com o **comprador**: a mesma leitura de zoneamento (LPUOS, taxa de ocupação, gabarito, outorga onerosa) serve para dizer **o que pode aparecer ao lado**. Hoje o VEREDA exibe "Sem leitura publicada nesta área ainda" para potencial de vizinho alto. O Localize prova que a leitura é possível quando há base legal publicada — e o PE3D de Pernambuco (ver `app7_place_ospa.md`) é a peça que falta para sair do "sem leitura".

### 6.5 O que **não** copiar
- **Score agregado**: o Localize evita; o VEREDA também deve evitar no dossiê (o `Placar` existe só na comparação).
- **"Preço 22% abaixo do similar"**: é exatamente a faixa de preço externa que o VEREDA decidiu não publicar.
- **Criminalidade como camada de produto**: o VEREDA tem o *branch* experimental fora do main e a literatura de viés socioespacial; manter fora.
- **Dependência de LiDAR**: Recife não tem. O VEREDA usa cadastro + DEM + lotes, que é o análogo disponível.

### 6.6 Esforço estimado
| Item | Dados novos | Esforço |
|---|---|---|
| Cartão "vista pode ser bloqueada" | nenhum | médio (geometria + cone de visão) |
| Modo "obras licenciadas" no `MapaDoLote` | nenhum | médio |
| Padronização de cartões de insight | nenhum | pequeno |
| Leitura de potencial de vizinho via PE3D | PE3D (público, gratuito) | grande (aquisição + modelo) |
