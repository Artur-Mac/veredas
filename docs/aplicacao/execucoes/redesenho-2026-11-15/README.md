# Redesenho do dossiê e do Comparar (15/11/2026, segundo teste no celular)

Resposta ao segundo teste no celular ("não tá com foto, o IPTU continua repetindo e ainda continua com os problemas que conversamos"). Este registro cobre a Fase 1 corrigida e as decisões da sabatina para as Fases 2 a 5, em [feedback-2026-11-15-proximos-passos.md](../../feedback-2026-11-15-proximos-passos.md).

## Por que não havia foto, e o que foi conferido no ZAP real

Abri um anúncio público do ZAP no navegador interno e li o estado da página:
- **Onde ficam as fotos:** em `listing.medias.images[].dangerousSrc`, um modelo com `{description}`, `{action}` e `{width}x{height}`. O leitor só procurava listas com `url` ou `src` e não entrava em `medias`, que é um objeto. **Corrigido** e testado com o objeto real gravado em `tests/fixtures/zap-listing-real-2026-11-15.json`: 3 fotos, sem anunciante e sem descrição.
- **O CDN do ZAP recusa (403) pedido com Referer de outro site**, mas responde 200 sem Referer, que é o caso do app nativo. Na web, a foto agora é um `<img referrerPolicy="no-referrer">` (`src/componentes/FotoRemota.tsx`). A foto não é guardada.
- **Condomínio e IPTU de R$ 1 no ZAP** são valor simbólico: agora contam como não informados.
- **Nome do prédio:** o código interno do anunciante (`externalId`, por exemplo "EDF CASTELO DE BRUNO…") vira mais uma pista. Com o anúncio real, o prédio certo vem primeiro com 310 pontos: mesmo nome, mesma rua e número e 42 apartamentos de 74,45 m².

## IPTU uma vez só

- O topo não mostra mais a faixa "R$ 131–165/mês · IPTU 2026 no prédio". A ficha do prédio virou uma linha: "Prédio de 2014 · 24 andares".
- O IPTU aparece **só no custo**:
  - **Com IPTU no anúncio:** mostra esse valor, com "cadastro: ~R$ X" embaixo, só quando a diferença passa de 20%.
  - **Sem IPTU no anúncio:** "~R$ 158 · pelo cadastro, fora da soma".
- A nota longa "IPTU não informado no anúncio. Como referência cadastral…" saiu. "IPTU no cadastro" deixou de aparecer nos Destaques e na negociação, porque repetia o custo.

## Dossiê

- **Topo:** fotos do anúncio no quadro, deslizáveis, com "1/3 · fotos do anúncio". O contorno do lote fica no "Abrir mapa". O cartão manual "Sol nas suas janelas · verificar na visita" saiu do topo.
- **Estimativas à parte:** luz e financiamento viram duas pílulas ("~R$ 324/mês · Luz estimada", "~R$ 4.028/mês · Financiar 80% em 30 anos"). Um toque abre o detalhe e os ajustes.
- **Destaques:**
  - até 3, com os achados fortes do anúncio (área que não confere, estrutura) e os indicadores mais fora da média do bairro;
  - cada um é um cartão com o classificador ("Avenida colada", "Perto do dia a dia") e a comparação ("Mais perto de avenida que 9 de cada 10 prédios de Boa Viagem");
  - "Ver o porquê" abre a medida, o que isso pode significar e "Investigar no Entorno".
- **Rotina num olhar:** minutos a pé até mercado, farmácia, praça e ônibus, em pílulas.
- **Divergências do anúncio:** numa área própria, compacta, com "Perguntar ao corretor" e "Corrigir o valor".
- **Entorno:**
  - começa por "Comparado com o bairro", com os cinco indicadores;
  - **obras:** o que isso significa vem primeiro ("Demolição costuma vir antes de prédio novo…"); a lista vem com um toque;
  - **"O que esperar no dia a dia":** só a manchete, com o detalhe e a fonte atrás do toque;
  - **renda do setor (Censo):** atrás de "Ver renda e perfil do setor (Censo)";
  - **"A rua":** fonte e data saem de cada linha e ficam na gaveta e no rótulo acessível; calçada, rampa e moradia do Censo ficam atrás de um toque.
- **Preço e avaliação fiscal:** prédio com tamanhos parecidos (a maior área até 20% acima da menor, por exemplo 53 e 61 m²) agora compara o preço com a avaliação por unidade. Antes, o limite era 3%.
- **"Comparar imóveis":** saiu de perto de "Descartar" e foi para cima de "Preparar visita".

**Indicadores** (`src/dados/dossie/indicadores.ts`):

| Tema | Medida | "Bom" quando |
|---|---|---|
| Dia a dia a pé | soma dos minutos até mercado, farmácia e ônibus | menor que o da maioria do bairro |
| Volta à noite | metros até a parada com ônibus entre 22h e 2h | menor |
| Barulho de rua | distância até a via principal; licença de som perto | maior |
| Obras em volta | construções e demolições licenciadas a 150 m, 24 meses | menos |
| Alagamento | registro na rua ou no caminho | nunca "melhor": sem registro fica "como o bairro" |

O classificador usa "7 de cada 10" como corte: "Acima do bairro", "Como o bairro" ou "Atenção". Não há nota única.

## Comparar

"Quem ganha em cada parte" fica antes das abas, com quatro linhas:
- Custo: "Torre custa R$ 190.000 a menos";
- Espaço: "Boa Viagem tem 21 m² a mais";
- Dia a dia a pé: "Boa Viagem fica 12 min mais perto…";
- Rua e clima: pontos de atenção.

Cada linha abre a aba do detalhe. Os cartões dos imóveis mostram a foto do anúncio.

## Verificação

- **Jest:** 75 suítes, 1.637 testes. Novos: fotos e nome do anúncio real, valor simbólico, indicadores com um prédio real, placar. Atualizados para o desenho novo: dossiê (ficha, IPTU, obras, divergências), custo recolhido, renda atrás do toque, Censo da rua atrás do toque e regra de tamanhos parecidos.
- **Typecheck:** limpo.
- **Lint:** 0 erros e 5 avisos, os mesmos de antes.
- **Smoke web:** 50 de 50, sem requisição externa, com os passos atualizados para o cartão, o IPTU único e a rua condensada.
- **Render com o anúncio real** ([render.mjs](render.mjs), [render.json](render.json), [telas/](telas/)):
  - anúncio → prédio → preparo → dossiê → Entorno → segundo anúncio → Comparar;
  - 3 fotos carregadas do CDN do ZAP, 0 outras requisições externas, 0 erros, 0 avisos no console, sem rolagem lateral.

## O que ainda não está feito

- **Sol automático no indicador de calor:** a orientação das fachadas já é automática no Edifício ("O sol nas fachadas"), mas ainda não entra num indicador comparado com o bairro, junto com a sombra das árvores.
- **Mapa do lote com zoom e arraste:** continua fixo. A distância de cada obra está na lista ("a 121 m").
- **Praças e parques:** tamanho e movimento ainda não entram.
- **"A rua":** traduzir cada linha em consequência (drenagem, trânsito) ainda é texto da fonte.
- **Teste no celular:** foto, IPTU e prédio, com os seus anúncios.
