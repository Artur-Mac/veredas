# Especificação dos estados de UI para o motion

Mapeia os estados que o pitch quer mostrar contra o que existe no protótipo web (`index.html`, a referência indicada pelo usuário em 17/10/2026). Também define cada morph com os mesmos dez campos. Um estado só aparece como recurso do VEREDA se existir no protótipo. O que não existe ganha uma alternativa visual honesta.

## 1. Os doze estados candidatos

| # | Estado | No protótipo | Dado | Suporte | Como mostrar com honestidade |
| --- | --- | --- | --- | --- | --- |
| 1 | Link do anúncio | `renderExplore` → cartão "Auditar novo anúncio", `#decoderUrlInput`, "Colar link", "Gerar Dossiê" | URL de exemplo do próprio protótipo | **existe** | Igual ao protótipo. A URL de exemplo é do mock, não de um portal real. |
| 2 | Análise | `triggerUrlDecode` → `#view-analyzing`: "Lendo o anúncio no aparelho", 4 etapas (preço e condomínio, área e quartos, endereço, cruzando com a base do Recife), `#extractProgressPct` | campos declarados | **existe** | Igual. A frase "Só lemos campos do imóvel. Nada sobre quem anuncia." fica na tela. |
| 3 | Cartão do imóvel | Cartão da lista em `#portfolioGrid` e topo do dossiê em `renderDossier` | aluguel R$ 4.500 (ilustrativo), 125 m², 4 quartos, 1 banheiro, 3 vagas, condomínio R$ 1.190, IPTU R$ 288 sem período | **existe** | Sem o nome "Edifício Costa Atlântica", que é inventado e ficaria colado a um endereço real; o título é o endereço. |
| 4 | Foto do anúncio | `renderDossierGallery` (`1/5`, "Abrir mapa") | fotos do Unsplash | **existe**, mas a foto é de banco | Selo "foto do anúncio · ilustrativa". Nunca dizer que é o prédio da Rua João Cardoso Aires. |
| 5 | Área anunciada × cadastro | Sem componente próprio. O dado está na aba Edifício ("124,81 m², área no cadastro") e no anúncio ("125 m²") | 125 m² × 124,81 m² | **dado existe, componente não** | Linha de fato com traço oficial: "124,81 m² no IPTU · 125 m² no anúncio". Neste prédio a área confere; mostrar que confere também é resultado. |
| 6 | Registro oficial, IPTU | Aba Edifício ("Valor e histórico", IPTU mensal de R$ 328 a R$ 371) e a pergunta "R$ 288 de IPTU por mês?" | IPTU 2026 de R$ 3.934 a R$ 4.457 por ano | **existe** | Comparação declarado × oficial no estilo `ds-finding` (POC-01, S2). |
| 7 | Lote do prédio | `renderAnalyzingLotCard`: "É este o prédio?", polígono azul, vizinhos tracejados, pino laranja, "É este prédio" | chave DSQFL e polígono **ilustrativos** | **existe**, com geometria ilustrativa | Lote em 2.5D com "polígono e altura ilustrativos". Não mostrar a chave DSQFL como se fosse real. |
| 8 | Mapa do bairro | `renderDossierMap`, `#ds-central-map` (Leaflet com tiles do OpenStreetMap), camadas Rotas, Alagamento, Calor, Serviços | tiles OSM | **existe** | No vídeo, quadras em esquema com a legenda "quadras ilustrativas". Para usar o traçado real, desenhar a partir do OSM com atribuição. |
| 9 | Raio de 150 m | Destaques: "49 registros de obra · Em 150 m · 4 demolições em 2026"; seção Obras próximas | 49 registros desde 2018; 4 demolições deferidas em 2026, entre 118 m e 140 m | **dado existe; o anel no mapa, não** | Anel de 150 m "em linha reta" com uma faixa entre 118 m e 140 m. Legenda: a faixa marca a distância, não a posição de cada obra. |
| 10 | Caminhos e "o que você resolve a pé" | "Seus caminhos": destinos com distância em linha reta e "Abrir rota" para o app de mapas | distância em linha reta | **parcial** | Linha reta do prédio ao destino com "x km em linha reta". Sem minutos, sem custo: o protótipo não calcula, então a tela não mostra valores que ele não tem. A fala continua como está. |
| 11 | Mensagem ao corretor | `openVisitMessage` → folha "Converse com o corretor": mensagem pronta, "Copiar mensagem", "Abrir WhatsApp" | perguntas do dossiê | **existe** | Igual. Sem logo nem tela do WhatsApp: só o botão do protótipo. |
| 12 | Dossiê final | `#view-dossier`: abas Destaques, Entorno e Edifício, "Preparar visita" | todos os fatos acima | **existe** | Dossiê em duas colunas no quadro 16:9 (POC-01, S5); o mapa ocupa o lugar que era da foto. |

Recursos do roteiro que **não existem** no protótipo (a fala não muda; a coluna da direita é só a decisão visual):

| Frase do roteiro | Situação no `index.html` | Alternativa |
| --- | --- | --- |
| "corrige a distorção das fotos para revelar a proporção real dos cômodos" | Não há correção de lente | Ilustração da correção com a etiqueta "simulação" ou "em desenvolvimento" |
| "usa o GPS para confirmar o prédio" | Nenhuma chamada de geolocalização | O app Expo em `src/` tem `expo-location`. Mostrar com etiqueta "no app" ou "em desenvolvimento". |
| "a bússola para testar o sol na janela" | "Luz na janela" com bússola ajustada à mão | Mostrar a bússola manual do protótipo |
| "o microfone para medir o barulho da rua" | "Ruído de fora" com valores de exemplo (44 dB e 58 dB) e a etiqueta "Exemplo de leitura · demonstração" | Mostrar com a mesma etiqueta "demonstração" |
| "negociados nas escrituras dos últimos dez anos" | ITBI agregado por prédio, que é avaliação fiscal e não preço | A tela usa os rótulos do protótipo ("transmissões no prédio", mediana do ITBI 2015–2026), sem chamar de escritura. A fala não muda |

## 2. Morphs do POC-01

Geometria em px no quadro de 1920 × 1080; tempos em segundos. Constantes em `motion/poc/poc-01.html` (`CARD1`, `CARD2`, `DOSSIE`, `CAPA`, `CAM`, `T`).

### M1 · cartão do anúncio → registro oficial

| Campo | Especificação |
| --- | --- |
| De | S1, cartão do anúncio: 1360 × 660 em (280, 210), raio 36, foto de 500 px à esquerda |
| Para | S2, registro: 1200 × 780 em (360, 150), raio 36, sem foto |
| Elemento compartilhado | O valor "R$ 288" do IPTU declarado e a nota "período não informado" |
| Geometria | O retângulo segue a spring `card` a partir de 1,70 s. A foto é recortada da direita para a esquerda (`clip-path`, spring `button`), sem mudar de tamanho desenhado. |
| Conteúdo | O texto do anúncio sai entre 1,65 e 1,85 s. "R$ 288" viaja e cresce de 26 para 72 px, com peso de 600 para 700 (fonte variável, sem `scale()`). Kicker, título e IPTU oficial entram em escada de 50 ms a partir de 2,15 s. |
| Câmera | Câmera de tela parada no S1; deriva de 1,0 a 1,022 durante a leitura do S2 |
| Timing | Hover em 1,0 s, clique em 1,45 s, morph de 1,70 a cerca de 2,0 s, conteúdo novo completo em 2,6 s |
| Interação | O cursor encosta no fim de "R$ 288" (sem cobrir), a linha se realça e o clique dispara o morph |
| Som | `click` em 1,45 s, `tick` em 1,49 s, `whoosh` (0,32 s) em 1,70 s |
| Continuidade | O caminho nasce como sublinhado de "R$ 288" e viaja colado ao valor. No S2 desce pela margem e sublinha o IPTU oficial, formando o colchete declarado × oficial. |

### M2 · registro → lote em 2.5D

| Campo | Especificação |
| --- | --- |
| De | S2, registro (retângulo de tela) |
| Para | S3, o lote de 40 × 32 m projetado com `yaw −0,42` e `pitch 0,98` (56°) |
| Elemento compartilhado | A própria forma: os quatro cantos do cartão interpolam até os quatro cantos do lote |
| Geometria | A câmera de mundo começa a 27 px/m, de cima. Nessa escala o lote tem o tamanho do cartão, então o cartão é o lote visto de perto. A câmera recua para 9,5 px/m e inclina 56°. O raio vai de 36 a 5; o preenchimento passa de branco a azul a 16%; o contorno passa de hairline a azul cadastral de 3,5 px. |
| Conteúdo | O registro sai entre 4,62 e 4,74 s. O chão se revela a partir do lote, com borda suave, de 4,80 s em diante. O prédio (12 andares, ilustrativo) sobe a partir de 5,6 s com a spring `type`. O painel "Lote do prédio" entra em 6,15 s. (Não diz "confirmado": no protótipo quem confirma é a pessoa, em "É este prédio", e o POC pula esse passo.) |
| Câmera | Spring `camera` (crítica, cerca de 1,07 s) |
| Timing | Clique em 4,55 s; morph em 4,78 s; lote assentado por volta de 5,9 s; HOLD a partir de 7,2 s |
| Interação | Clique em "Cadastro oficial →", que ganha sublinhado de hover. O cursor sai do quadro em 5,1 s. |
| Som | `click` em 4,55 s; `whoosh` (0,5 s) em 4,78 s; `pop` em 4,80 s, quando nasce o pino; `thump` em 5,60 s |
| Continuidade | O colchete se fecha no centro do cartão, que é o centro do lote na câmera inicial. O pino nasce ali e fica sobre o lote enquanto ele deita. |

### M3 · lote → mapa e raio de 150 m

| Campo | Especificação |
| --- | --- |
| De | S3, lote a 9,5 px/m e 56° |
| Para | S4, entorno a 2,35 px/m e 36°, `yaw −0,16` |
| Elemento compartilhado | O lote, o prédio e o pino |
| Geometria | A câmera sobe. A haste do pino gira e se estende até 150 m ao norte, virando o raio. O raio varre o círculo em cerca de 1 s (spring `varredura`) e revela junto a faixa de 118 m a 140 m em hachura laranja. |
| Conteúdo | O painel do lote sai em 7,25 s. A pílula "150 m em linha reta" entra em 8,75 s. O painel das obras ("4 alvarás de demolição deferidos em 2026", "49 registros de obra em 150 m desde 2018") entra a partir de 8,85 s. |
| Câmera | Spring `camera` |
| Timing | Morph em 7,40 s; raio a partir de 7,75 s; varredura de 8,10 a cerca de 9,1 s; HOLD em 10,2 s |
| Interação | Nenhuma. O cursor fica fora: é o momento cinematográfico. |
| Som | `whoosh` (0,9 s) em 7,40 s; `sweep` em 8,10 s; `pop` em 8,85 s |
| Continuidade | O caminho vira o raio, e o raio fica até o fim |

### M4 · mapa → dossiê

| Campo | Especificação |
| --- | --- |
| De | S4, mapa em tela cheia |
| Para | S5, dossiê de 1500 × 800 em (210, 140), com capa de mapa de 600 × 764 em (228, 158) |
| Elemento compartilhado | O mapa inteiro: lote, pino, anel e pílula |
| Geometria | A moldura do mapa encolhe da tela inteira (raio 0) até o cartão do dossiê (raio 36) a partir de 10,35 s e, de 10,85 s em diante, até a capa (raio 24). A superfície branca do dossiê aparece por trás do mapa que recua. |
| Conteúdo | O painel das obras sai em 10,2 s. O texto do dossiê entra em escada de 55 ms a partir de 11,15 s. |
| Câmera | A câmera de mundo vai a 1,8 px/m, vista de cima (`pitch 0`), centrada na capa |
| Timing | Morph em 10,35 s; dossiê completo em cerca de 12,0 s; clique em "Preparar visita" em 12,75 s; fim em 13,4 s |
| Interação | O cursor volta de fora do quadro em 11,85 s e aperta "Preparar visita" |
| Som | `whoosh` (0,45 s) em 10,35 s; `click` em 12,75 s |
| Continuidade | O mapa ocupa no dossiê o mesmo lado em que a foto estava no S1: a foto do anúncio dá lugar à evidência |

## 3. Morphs planejados para a demonstração completa

| Transição | De → para | Elemento compartilhado | Ideia |
| --- | --- | --- | --- |
| Link → análise | Campo "Auditar novo anúncio" → cartão "Lendo o anúncio no aparelho" | O campo do link | O campo cresce para baixo; o sublinhado da URL vira a barra de progresso; as 4 etapas entram uma por vez |
| Análise → cartão do imóvel | Cartão de leitura → cartão do anúncio (S1) | O título com o endereço | A etapa "Cruzando com a base do Recife" fica marcada e o cartão abre a foto pela esquerda |
| Dossiê → mensagem ao corretor | Dossiê (S5) → folha "Converse com o corretor" | As perguntas 01 e 02 | O dossiê sobe como folha; as duas perguntas viram as linhas numeradas da mensagem; o cursor aperta "Copiar mensagem" |
| Mensagem → modo visita | Folha → "No imóvel" | O botão "Preparar visita" | O botão vira o cronômetro da visita; o anel de 150 m encolhe até a bússola de "Luz na janela" |
