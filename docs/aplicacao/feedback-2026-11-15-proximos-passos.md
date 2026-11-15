# Feedback do teste no celular e próximos passos (15/11/2026)

Teste feito no celular com anúncios reais do ZAP (Graças e Torre). Este arquivo junta o diagnóstico, as decisões da sabatina e o plano.

## Diagnóstico do que já dá para explicar

| Sintoma | Causa | Correção |
|---|---|---|
| "$undefined, $undefined" no endereço, mesmo depois de confirmar o lote | As páginas novas do ZAP (Next.js) marcam campo vazio com o texto `"$undefined"`, e o extrator aceita esse texto como rua (`src/dados/extrator/estado.ts:227`). | Tratar `$undefined` e valores do mesmo tipo como ausentes. Ao confirmar o lote, preencher rua e número **pelo cadastro**. |
| IPTU de R$ 131–165/mês no topo e R$ 15/mês embaixo | O topo usa o cadastro da Prefeitura; o custo usa o anúncio. O ZAP mostra só "IPTU", sem período, e o extrator supõe que é **anual** (`estado.ts:171`): R$ 180 ÷ 12 = R$ 15. | Período desconhecido vira hipótese. O app escolhe o período que bate com o cadastro do prédio (R$ 180/mês está dentro de R$ 131–165 ± margem; R$ 15 não está). Mostra **um** valor, o do cadastro quando o vínculo é forte, com a divergência atrás do toque. |
| Prédio errado: "compatíveis" não eram; o certo estava na mesma rua com outro número | O anúncio não trazia endereço. O app não usa o nome do edifício que o anúncio traz (ex.: "Engenho Torre") nem o nome que existe no cadastro de lotes. | Fase 1: casar pelo nome do edifício e por indícios (bairro, pavimentos, ano, área típica). Fallback: mapa de lotes tocável. |
| Mapa do lote não mexe; não dá para entender a distância real da obra | O mapa é um desenho fixo, sem zoom nem arraste. | Fase 4: mapa com zoom/arraste e régua até a obra, ou distância dita em frase ("a 120 m, no quarteirão ao lado"). |
| "Carregamento do prédio às vezes não funciona" e o aviso "Can't perform a React state update on an unmounted component" | Ainda não reproduzido. Hipótese: a camada do bairro carrega depois que a tela já saiu, ou duas cargas concorrem. | Fase 1: reproduzir no celular, corrigir o cancelamento do carregamento e testar abrindo e fechando o dossiê rápido. |
| "Cannot connect to Expo CLI" | O servidor de desenvolvimento no computador caiu ou o celular perdeu a rede. Não é bug do app. | — |

## Decisões da sabatina

1. **Leitura do anúncio.** A confirmação vira um cartão parecido com o do ZAP/QuintoAndar: fotos, preço, custos, área, quartos e endereço. Cada campo é tocável para editar, com um "Editar" geral embaixo. A modalidade vem do link, e o app só pergunta o que faltou.
2. **Achar o prédio.** Acontece **dentro dessa confirmação**, pelo nome do edifício e pelos indícios do anúncio. Se não acertar, a pessoa edita e abre a tela de lotes.
3. **Imagem do prédio.** Fotos do próprio anúncio, sem guardar cópia e com link para a origem. Street View e 3D fotorrealista ficam **no radar**, porque são pagos e exigem chave.
4. **Indicadores.** Nada de nota crua. Um **classificador direto, comparado com o entorno**, por exemplo:
   - "Mais sombreada que a maioria das ruas do bairro";
   - "Alaga mais que a média da Torre";
   - "Barulho de avenida num lado do prédio".

   O cálculo e a fonte ficam atrás do toque.
5. **Topo do dossiê:**
   - fotos e custo mensal numa linha, sem valor repetido;
   - 3 destaques com insight;
   - a rotina num olhar.

   Alertas e divergências ficam numa área própria, não no topo. Só uma divergência grande (área, preço por m²) pode virar destaque, e o toque abre a pergunta pronta para o corretor.
6. **Profundidade.** Cartão com uma frase e um indicador, que abre em "investigar": mapa, linha do tempo, comparação com o entorno e, por último, as fontes. Fonte e método saem da superfície.
7. **Comparar.** Seções tocáveis (Custo, Rotina, Rua e clima, Prédio). Cada uma diz quem ganha e por quanto, e abre o lado a lado.
8. **Renda e Censo.** Saem da tela. Servem só para calibrar comparações e aparecem dentro de "investigar", com a fonte.
9. **Sol.** Vira parte do indicador de calor e conforto e precisa ser **automático**. A orientação das fachadas sai da geometria do cadastro, que o app já calcula nas áreas cobertas; somam-se a sombra da rua e as árvores. A bússola manual fica só como ferramenta opcional na Visita.
10. **Ordem.** Começar pela **leitura do anúncio**, porque tudo depende de acertar o prédio.

## Minha opinião sobre "desdistorcer" as fotos e o 3D

- **Desdistorcer fotos do anúncio.** É tecnicamente possível: estimar a distorção da lente grande-angular pelas linhas retas da foto. Mas altera a imagem de outra pessoa, e o resultado pode enganar tanto quanto a foto original. Proponho um caminho mais útil e mais seguro:
  1. mostrar sempre a foto original;
  2. **detectar** quando a foto parece de grande-angular e avisar ("foto aberta: o cômodo pode parecer maior; compare com a área de X m²");
  3. só depois, como experimento, um "ver com proporção corrigida", marcado como simulação.

  Isso conversa com o alerta de área e reforça a ideia de investigação.
- **3D estilo Earth / 360°.** O caminho viável é a camada 3D fotorrealista do Google (Map Tiles API) ou o Street View. Os dois são pagos por uso, com cota, e têm regras de exibição e atribuição. Ficam no radar, como você decidiu. Uma alternativa gratuita sem foto, que já temos, é um **3D simples dos volumes do cadastro** (prédios com altura) em volta do lote. Ele mostra vizinhos altos, sombra e vista. Pode entrar junto com o indicador de calor.

## Plano por fases

### Fase 1: leitura do anúncio e prédio certo (feita em 15/11/2026; [registro](execucoes/fase1-2026-11-15/README.md))

**Acrescentado pelo usuário:** tela de preparo depois da confirmação, rápida, mostrando o que o Vereda está fazendo, com um aviso curto de que os dados podem estar desatualizados ou divergentes e de que o Vereda é ferramenta de apoio, não avaliação. **Pendente:** teste com 20 anúncios reais no celular.

**Objetivo:** do link ao prédio correto com o mínimo de toques.

- Cartão de confirmação estilo ZAP: fotos, campos tocáveis, "Editar" embaixo, modalidade vinda do link.
- `$undefined` e similares tratados como ausência; rua e número do cadastro depois da confirmação do lote.
- IPTU com período resolvido contra o cadastro; um valor só no app.
- Prédio pelo nome do edifício (cadastro de lotes, IPTU) e por indícios (bairro, pavimentos, ano, área); candidatos ordenados com o motivo; fallback no mapa de lotes.
- Reproduzir e corrigir a falha intermitente de carregamento e o aviso de atualização de estado.

**Pronto quando:**
- um conjunto de 20 anúncios reais (10 sem endereço) acerta o prédio, ou chega a ele em até 2 toques, em pelo menos 17;
- o caso Engenho Torre (Rua Horácio Cahu, 52) é encontrado pelo nome;
- nenhum "$undefined" aparece;
- o IPTU não diverge na mesma tela;
- testado em Android.

### Fase 2: topo do dossiê

- Fotos do anúncio, custo mensal numa linha e 3 destaques escolhidos por força do achado.
- Rotina num olhar (mercado, farmácia, ônibus, destinos da pessoa), comparada com o bairro.
- Área própria para divergências, com a pergunta pronta para o corretor.
- Ficha resumida do prédio numa linha ("2018 · 15 andares · lote confirmado"), com o resto em "investigar".
- Simulação Price num cartão visual editável ("toque para mudar entrada e prazo").

### Fase 3: indicadores comparativos com o entorno

- **Calor e sombra:** fachada automática, sombra de prédios e árvores no caminho, comparados às ruas do bairro. Reaproveita o piloto CoolWalk, sem prometer rota.
- **Alagamento:** histórico da rua contra a média do bairro (frequência de registros). Os 4 registros mais usados entram depois da revisão H1.
- **Ruído:** fontes perto do prédio (avenida, escola, LUSE, obra) e de que lado ficam.
- **Caminhada:** minutos até o essencial contra a mediana do bairro. Praças e parques com tamanho (área do polígono) e movimento, quando houver dado. Crime fica fora até a resposta da SDS.
- Linguagem: classificador direto ("acima, na média, abaixo do bairro") e, no detalhe, o que isso significa para a pessoa.

### Fase 4: cartões "investigar" no Entorno e na Rua

- Traduzir cada item técnico em consequência:
  - obras: "2 obras deferidas a 120 m: possível barulho e poeira até ~2027; pergunte o horário da obra";
  - drenagem;
  - trânsito;
  - rampas e travessias, só para quem marcou mobilidade reduzida no perfil.
- Mapa do lote com zoom e distância real.
- Fontes e números brutos no fim de cada investigação.

### Fase 5: Comparar por seções

- Custo, Rotina, Rua e clima, e Prédio, com o vencedor e a diferença ("B custa R$ 410 a menos por mês").
- "Comparar imóveis" sai de perto de "Descartar" e vai para um lugar menos acidental.

### Radar (não agora)

- Street View e 3D fotorrealista do Google: custo, cota e termos levantados antes de qualquer chave.
- Detecção de grande-angular e "proporção corrigida" como experimento.
- Crime por bairro (depende do pedido LAI à SDS).

## Regras que continuam valendo

- Fato com fonte e data; o que é inferência é dito como inferência, só que agora atrás do toque.
- Classificador comparativo, sim; nota única de "qualidade de vida", não.
- Nada de linguagem de segurança sem dado de ocorrências.
- A narração travada do pitch não muda.
