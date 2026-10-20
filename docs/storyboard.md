# Storyboard do pitch VEREDA

> **Atualização de 18/10/2026:** o usuário enviou um [roteiro revisado](pitch-revisado-2026-10-18.md) e uma gravação de referência. Este storyboard documenta a versão visual anterior e mantém suas citações literais para verificação. Os cortes, trocas de texto em tela e a futura sincronização com a voz estão mapeados no [plano de montagem](plano-montagem-roteiro-revisado.md).

Refeito em 17/10/2026 a partir do roteiro do pitch enviado pelo usuário. A versão anterior foi descartada: usava frases e números que não estão no roteiro. Marca e telas vêm do `index.html` ([`motion-language.md`](motion-language.md)); o que existe ou não no protótipo está em [`ui-state-spec.md`](ui-state-spec.md).

**Formato.** Pitch ao vivo: a fala manda. Cada cena tem ENTER (curto), HOLD (indefinido, até o clicker) e EXIT; cenas longas têm batidas internas, cada uma com seu HOLD. O tempo de tela abaixo é estimado pela fala, a cerca de 2,5 palavras por segundo. O total fica em torno de 4 min 15 s. A narração é fixa ([`pitch-original-locked.md`](pitch-original-locked.md)): o visual acompanha a fala, nunca o contrário.

**Roteiro novo, 18/10/2026 (noite).** As seções de cena abaixo descrevem o roteiro anterior. O filme atual segue `pitch-revisado-2026-10-18.md`, com os tempos de `mapa-fala-revisada.md`, e o que cada cena faz agora está em [`review-log.md`](review-log.md), na seção "Roteiro novo". A cena 09 saiu do filme e foi trocada pela ponte `costura08-10`. As decisões do usuário (sem avisos, dados demonstrativos, nenhum endereço real) estão no `AGENTS.md`.

**Motivo.** Ver "Visão geral das cenas 2 a 12" abaixo: a linha em tinta enquanto é problema, laranja a partir da virada (cena 5), até o contorno do ninho.

## Antes de produzir: afirmações sem fonte no repositório

A fala não muda. Esta tabela só decide o que o visual faz com cada afirmação e o que a equipe precisa ter em mãos para a banca.

| Trecho do roteiro | Situação no repositório | Decisão visual |
| --- | --- | --- |
| "armadilha financeira de R$ 125 mil nos próximos cinco anos" | Nenhuma memória de cálculo | Em destaque na cena 01 por decisão do usuário. A equipe deve ter a conta pronta para a banca |
| "93% dos brasileiros relatam dificuldade" | Sem fonte nos docs | Fica fora da tela até a equipe trazer a fonte (decisão pendente); a batida funciona sem o número |
| "83 pessoas... mais de 70% só descobriram problemas graves depois de assinar" | Tem fonte: 71,1% (59/83) relataram ao menos um arrependimento grave nas 6 primeiras semanas ([`PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md`](PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md), linha 15). Os dois relatórios da amostra de 83 divergem em datas, canais e percentuais | O destaque repete a fala ("mais de 70%"); rodapé "pesquisa da equipe, N = 83" |
| "89% dos entrevistados toparam colaborar" | 89,2% (62,7% + 26,5%, 74 de 83) está em [`PESQUISA_QUANTITATIVA_UFPE_83.md`](PESQUISA_QUANTITATIVA_UFPE_83.md) (pergunta 10, coleta de 02 a 12/10/2026). No outro relatório da amostra de 83 ([`PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md`](PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md), linhas 17 e 18), 89,2% é a utilidade do conceito e a disposição a colaborar é 78,3% (65 de 83). Conferido em 18/10/2026 | Na tela da cena 10, com a fonte UFPE. A equipe precisa escolher um relatório antes da banca: pelo outro, a fala estaria errada |
| "nota de utilidade de 4,73 de 5" | 4,73 (σ = 0,55) está só em [`PESQUISA_QUANTITATIVA_UFPE_83.md`](PESQUISA_QUANTITATIVA_UFPE_83.md) (pergunta 9); o outro relatório não tem esse número | Na tela da cena 10, com a fonte UFPE |
| "mais de meio milhão de registros da cidade" | Tamanho das bases públicas com data: IPTU 2026 422.776 + Licenciamento Urbanístico 113.305 + Defesa Civil 2024 80.173 = 616.254 (`ignorar/docs/pesquisa-viabilidade/inv3-iptu-modelo-3d.md`, docs). O cruzamento já registrado cobriu cerca de 105 mil registros de IPTU em 5 bairros | Destaque "+500 MIL registros", como a fala, com as três bases nomeadas no rodapé |
| "por quanto... foram realmente negociados nas escrituras" | O ITBI público é avaliação fiscal agregada por prédio, não preço de escritura | A tela mostra o dado como o protótipo mostra ("transmissões no prédio", "mediana de R$ 4.339/m²", ITBI 2015–2026), com a fonte. Não aparece um rótulo "escritura" ou "preço negociado" |
| "corrige a distorção das fotos" | Não existe no protótipo | Ilustração da correção com a etiqueta "simulação" ou "em desenvolvimento". Material possível: o par de fotos da REF-10, com as regras de [`reference-analysis.md`](reference-analysis.md), seção 7 |
| "usa o GPS para confirmar o prédio" | Não existe no `index.html`; o app Expo tem `expo-location` | Etiqueta "no app" ou "em desenvolvimento" |
| "o microfone para medir o barulho" | O protótipo mostra uma leitura de exemplo (44 dB e 58 dB) marcada como "demonstração" | Mostrar com a mesma etiqueta |
| "o custo real do que você resolve a pé" | O protótipo dá distância em linha reta, sem tempo e sem custo | A tela mostra só o que o protótipo tem (destinos e distância em linha reta); nenhum valor de custo é inventado |
| "alta precisão na identificação" | Sem taxa de acerto de identificação do prédio no repositório (o 99,9% registrado mede o vínculo IPTU–lote, outra coisa) | Nenhum percentual de precisão na tela |
| "Samuel em produto, Matheus em design e Artur em dados e engenharia" | `DOSSIE_MATURIDADE_ORIENTACAO_HACKATHON.md` e `VEREDA_DOCUMENTO_DEFINITIVO.md` dizem Walter em design | A tela segue a fala (Matheus). A equipe confirma o nome |
| "empreendedores parceiros do centro de informática" | Os docs citam 3 professores sem nome; "parceiros" não aparece | Texto de tela só com o que a fala diz, sem nomes nem logos |
| "WhatsAp" (grafia do roteiro) | A fala não muda | Rótulos de interface usam o nome do botão do protótipo, "Abrir WhatsApp" |

---

## Cena 01 · O anúncio perfeito

> **Produção, 17/10/2026:** três variantes da cena 01 prontas como prova de conceito, em `motion/poc/cena01.html` (`?v=1` janela, `?v=2` linha do anúncio, `?v=3` geometria da sala), com 18 s cada. Os vídeos ficam em `out/cena01-v<N>-com-som.mp4` e a revisão em [`review-log.md`](review-log.md) (CENA-01). Elas substituem a transição A abaixo. O número R$ 125 mil está na tela a pedido do usuário; a memória de cálculo continua pendente.
>
> **Decisão, 18/10/2026:** o usuário escolheu a **V1 · janela**. É a direção da cena 01: o vento para no "Mas"; o sol do "100% nascente" se põe atrás das torres e a cor sai; a câmera entra pela janela, a sala vira noite em PB e o caixilho se abre num vão só; "R$ 125 MIL" sobe de trás do peitoril no lugar do sol, em laranja, com "em cinco anos" abaixo da moldura. HOLD ao vivo em 3,4 s, 10,6 s e 18 s. A V2 e a V3 ficam no mesmo arquivo como alternativas, sem manutenção. Master a 60 fps em `out/cena01-v1-60fps-com-som.mp4`.

| Campo | |
| --- | --- |
| Frase | "Imagine que você acabou de encontrar este apartamento no Recife. O anúncio diz: "75 metros quadrados, super ventilado, 100% nascente, condomínio baratinho". Parece o lar perfeito. Mas, se assinarem esse contrato hoje, vocês acabaram de cair em uma armadilha financeira de R$ 125 mil nos próximos cinco anos." |
| Objetivo | Gancho: o anúncio é bonito, e a conta vem depois |
| Estado inicial | Cartão de anúncio no estilo do protótipo, sem endereço (o imóvel é hipotético): foto grande e quatro chips com as promessas entre aspas |
| Estado final | "R$ 125 MIL" em tipografia cinética sobre uma régua de cinco anos (2026 a 2031) |
| O que persiste | A linha de preço do cartão, que vira a régua dos cinco anos |
| Técnica | Transição A: cartão → número cinético |
| Ativo real | Componente de cartão (`ed-card`, chips, `specs-strip`); foto ilustrativa com selo |
| Interação e câmera | Câmera de tela parada, sem cursor (é a imaginação de quem ouve). Na frase "Mas", a câmera aproxima 1,02 e as aspas dos chips ganham traço tracejado de "declarado" |
| Som | Silêncio no anúncio; um `thump` baixo no "R$ 125 mil" |
| Tempo estimado | 20 s (duas batidas: anúncio, número) |
| HOLD | Batida 1: cartão parado. Batida 2: "R$ 125 MIL" parado |
| Complexidade | Média |

---

## Visão geral das cenas 2 a 12

Revisado em 18/10/2026 a partir de um painel com três propostas (produto protagonista, motivo e metáfora, palco ao vivo) e dois juízes (narrativa e marca; honestidade e viabilidade), em `motion-references/painel-criativo.json`. A espinha é a da proposta de motivo e metáfora; as regras de dado e de palco vêm da proposta de palco; as telas reais vêm da proposta de produto. Cada cena cita o trecho literal da narração travada ([`pitch-original-locked.md`](pitch-original-locked.md)); as batidas são cortes desse trecho e, juntas, o reconstroem.

**O motivo.** Uma linha atravessa o filme. Enquanto é problema, é tinta: assinatura do contrato (3), batente da porta (3), caminho emaranhado nos estratos (4). Na virada (5) ela é puxada até ficar reta e fica laranja pela primeira vez: laranja é a VEREDA. Daí em diante é sublinhado do link e soleira dentro/fora (5), colchete declarado × oficial (6), raio de 150 m e linha reta até o destino (7), divisória do dossiê (8), agulha da bússola, onda do ruído e limpador da janela (9), régua sem cobranças e régua de 1 a 5 (10), linha do tempo e meio-fio (11) e, no fim, o contorno do ninho (12). As cores têm papel fixo: ferrugem para o problema (o X, os arrependimentos), laranja para a VEREDA, azul cadastral para o registro oficial.

**Curva de intensidade** (1 a 5): 1 (cena 1) pico no escuro → 2 (2) papel, sóbria → 3 subindo (3) → 4 (4) o problema no ápice, de volta ao escuro → 4 na luz e 2 no movimento (5) a virada → 3 (6) → 4 (7) a mais espacial → 2 (8) clareza → 5 (9) a mais física → 1 (10) respira → 3 (11) → 5 (12) pico emocional, quieto.

| Cena | Título | Tipo | Duração | Mapa | Fotos | Prioridade |
| --- | --- | --- | --- | --- | --- | --- |
| 02 | O portal não está do seu lado | ilustrativa | 28 s ao vivo (12 s de animação produzida) | Só o mapinha esquemático do anúncio fictício. | Nenhuma: a sala é vetorial (determinística,… | 8 |
| 03 | Quem descobre tarde demais | ilustrativa | 30 s | Quadra 2.5D esquemática (não é Boa Viagem),… | Nenhuma: pessoas como pontos dão escala e… | 7 |
| 04 | Os dados existem, mas estão enterrados | ilustrativa | 23 s | Só um recorte esquemático de mapa de lotes… | Nenhuma. | 6 |
| 05 | A virada: em segundos | protótipo | 14 s | Não. | Nenhuma. | 4 |
| 06 | Da porta para dentro | protótipo (híbrida na foto) | 27 s | Lote 2.5D com vizinhos (do POC-01). | Só a sala ilustrativa na simulação… | 2 |
| 07 | Da porta para fora | híbrida | 24 s | Sim, o principal do filme: SVG próprio em… | Nenhuma; a cidade é vetorial. | 1 |
| 08 | Tirar a maquiagem e negociar | protótipo | 19 s | Não. | Nenhuma. | 3 |
| 09 | O celular vira ferramenta | híbrida | 18 s | Curto: a vista de cima do lote da cena 7,… | Nenhuma. | 5 |
| 10 | Modelo e validação | híbrida | 23 s | Não. | Nenhuma. | 9 |
| 11 | Prova, equipe e piloto | híbrida | 25 s | Só a rua de perfil no fim. | Retratos da equipe só se enviados e… | 10 |
| 12 | A verdade antes da decisão | ilustrativa | 7 s + HOLD final | Não. | Nenhuma: a "foto bonita" é a sala vetorial… | 11 |

Tipos: **protótipo** (telas reais do `index.html` animadas: 5, 6, 8), **híbrida** (telas reais com ilustração ou mapa de apoio: 7, 9, 10, 11), **ilustrativa** (composição do filme na linguagem da marca: 2, 3, 4, 12).

**Onde fotos ajudam.** Quase nenhuma foto: a sala vetorial da cena 1 é a "foto bonita" (determinística e sem direito de imagem) e volta nas cenas 2, 6 (simulação) e 12. Fotos reais só com autorização: o par da REF-10 na simulação da cena 6, se a equipe liberar, e retratos da equipe na cena 11. O cartão do prédio real (cenas 6 e 8) não usa foto de banco: usa o comportamento do protótipo sem foto, o mapa com o pino.

**Onde mapas são necessários.** Cena 7 (o mapa principal: lote → quadra → bairro, SVG próprio), cena 6 (lote 2.5D com vizinhos), cena 9 (vista de cima do lote, curta), cena 3 (quadra esquemática), cena 4 (recorte de lotes no estrato do ESIG). O mapa do protótipo é um iframe de rede e não entra.

## Prioridades de produção

1. **Cena 7**, da porta para fora: a mais importante e a que cria a cidade em código (reaproveitada nas cenas 3 e 11); parte do M3 e do S4 do POC-01.
2. **Cena 6**, da porta para dentro: reordena o POC-01 com as telas reais de leitura e de lote.
3. **Cena 8**, tirar a maquiagem: quase só telas reais.
4. **Cena 5**, a virada: o cartão real de entrada e a troca de palavras.
5. **Cena 9**, o celular: bússola por arraste e onda; depende da decisão sobre o eco do número.
6. **Cena 4**, os estratos. 7. **Cena 3**, pessoas e quadra. 8. **Costuras da cena 2** (1→2, kicker, tecla ←, saída para a 3). 9. **Cena 10**. 10. **Cena 11**. 11. **Cena 12** (a máscara orgânica é prototipada cedo, mesmo sendo a última).

Infraestrutura em paralelo: uma página-palco que encadeia as cenas e pré-carrega a próxima (troca de arquivo sem piscar); fontes servidas localmente (hoje vêm do Google Fonts); estado final exportado de cada cena para as costuras. Na página-palco, o HOLD final de cada cena para no último quadro gravado (DUR − 1/30), que é o quadro conferido na emenda, e não em DUR (na cena 01 há resíduo de câmera de menos de 1 px em t = 18); as passagens 2 → 3, 3 → 4, 7 → 8, 9 → 10 e 11 → 12 encadeiam sem pedir clique; uma cena aberta sozinha em `?live` começa ao carregar, então o palco segura cada cena em t = 0 até o clique. Quadros de emenda entre cenas feitas em paralelo: `motion/lib/costuras.js`.

## Decisões pendentes do usuário

| Decisão | Opções | Padrão até decidir |
| --- | --- | --- |
| "93%" na tela (cena 3) | mostrar com a fonte que a equipe trouxer / não mostrar | não mostrar; o campo de pontos e as palavras da fala seguram a batida |
| Eco do "R$ 125 MIL" (cena 9) | a janela volta com o número / volta sem o número | sem o número |
| Pontilhado do subsolo (cena 4) | A, claro (ferrugem sobre papel) / B, escuro (papel sobre tinta) | B, só nesta cena |
| Par de fotos da REF-10 (cena 6) | usar com autorização / só a sala vetorial | só a sala vetorial |
| Versão da pesquisa N = 83 | os dois relatórios divergem; a equipe escolhe um. "Mais de 70%" (cena 3) só existe em `PESQUISA_VALIDACAO_MERCADO_RECIFE_83.md` (03 a 14/10/2026); "89%" e "4,73" (cena 10) só batem com `PESQUISA_QUANTITATIVA_UFPE_83.md` (02 a 12/10/2026), e pelo primeiro relatório a disposição a colaborar seria 78,3% | cada número com o relatório de onde vem: rodapé com o período do questionário (e a pergunta, na cena 10), para os dois não parecerem uma pesquisa só |
| Nome em design e programa (cena 11) | a fala diz Matheus e "a Campus"; os docs dizem Walter e Campus Mobile | a tela segue a fala |

---

## Cena 02 · O portal não está do seu lado

> «Por quê? Porque o cliente dos grandes portais imobiliários é a imobiliária, não você. Eles ganham por anúncio e por clique. Por isso, o mercado tolera que fotos esticadas em lente olho de peixe façam uma sala parecer gigante, que a vaga de garagem seja somada como área de quarto, que um apartamento poente seja vendido como nascente e que ninguém avise que aquela rua trava quando chove muito.»

| Campo | |
| --- | --- |
| Objetivo | Mostrar por que o problema existe: o incentivo do portal está alinhado com a imobiliária, e você fica de fora; depois, quatro maquiagens de um anúncio genérico. |
| Conceito visual | Produzida e escolhida: `cena02.html?v=2`, "o sistema e a ficha". Três polos num eixo; o X ferrugem cai sobre o card "Você"; o nó do portal vira o anúncio fictício e quatro marcas numeradas revelam as maquiagens. Ajustes desta revisão: a costura com a cena 1 (a janela vira o card "Você"), um HOLD para o X, o kicker da lista e a saída para a cena 3. |
| Telas reais do protótipo | Nenhuma tela do produto (a cena fala de portais; a regra de marcas proíbe captura e nome de portal). Usa a gramática do `index.html`: `.ed-kicker`, superfície `.ed-card`, chips e faixa de especificações, paleta do mapa. |
| Telas e ilustrações de apoio | Diagrama de três polos e anúncio fictício "Sala ampla, sol da manhã", já produzidos, com o rodapé "Portal e anúncio fictícios · valores ilustrativos". Costura nova janela → card "Você", recomposta em SVG a partir do estado final exportado da cena 1 (não PNG). |
| Honestidade | Portal e anúncio são fictícios do primeiro ao último quadro. 75 m² e 62,5 m² são exemplo. A correção de lente aqui é retórica (a maquiagem do mercado), não demonstração do recurso. O kicker "O que a análise mostra" vira "O que o anúncio não mostra": nesta cena nenhum produto analisou nada. |
| Entrada | Da cena 1: no clique de "Por quê?", "R$ 125 MIL" afunda de volta atrás do peitoril pelo mesmo recorte; o passe-partout de papel cresce até as bordas; o vão preto encolhe até o retângulo do card "Você" e fica branco, com o ícone. Do preto ao papel sem fade. |
| Saída | As quatro marcas perdem o número e viram quatro pontos ferrugem numa linha de base: as primeiras pessoas da cena 3. |
| Tom | Sóbrio, editorial, didático; a única ênfase é o X. |
| Intensidade | 2 de 5 |
| Duração estimada | 28 s ao vivo (12 s de animação produzida) |
| Tipo | ilustrativa |
| Fotos | Nenhuma: a sala é vetorial (determinística, sem direito de imagem). |
| Mapa | Só o mapinha esquemático do anúncio fictício. |
| Complexidade e risco | Baixa (ajustes numa cena pronta). Risco: a costura precisa casar com o último quadro da cena 1; usar uma função de estado final comum e um teste de diferença entre os dois quadros. |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “Por quê?” | Costura nova, cerca de 1,2 s: o número afunda atrás do peitoril, o papel cresce, o vão vira o card "Você". | não |
| B2 | “Porque o cliente dos grandes portais imobiliários é a imobiliária,” | Kicker "POR QUÊ", título "O cliente dos grandes portais / é a imobiliária.", nós Imobiliária e corretor ⇄ Portal, setas, divisória tracejada e o fio "o anúncio pronto" até "Você". | sim |
| B3 | “não você.” | O X ferrugem, em dois traços, cai sobre o card. Quadro parado. | sim |
| B4 | “Eles ganham por anúncio e por clique.” | "R$ por anúncio" e "R$ por clique" sobre as setas (JetBrains Mono, 30 px para o fundo da sala). | sim |
| B5 | “Por isso, o mercado tolera que fotos esticadas em lente olho de peixe façam uma sala parecer gigante,” | O nó do portal vira o anúncio fictício; marca 1 e dolly da lente (só geometria; luz e cor iguais). | sim |
| B6 | “que a vaga de garagem seja somada como área de quarto,” | Marca 2: a vaga hachurada sai da planta; 75 m² vira 62,5 m² em ferrugem. | sim |
| B7 | “que um apartamento poente seja vendido como nascente” | Marca 3: "Nascente" vira "Poente" por recorte; a bússola gira a fachada para o oeste. | sim |
| B8 | “e que ninguém avise que aquela rua trava quando chove muito.” | Marca 4: a hachura de água ocupa a rua do anúncio fictício. HOLD. No clique seguinte, a saída para a cena 3. | sim |

## Cena 03 · Quem descobre tarde demais

> «Não por acaso, 93% dos brasileiros relatam dificuldade para comprar um imóvel. Quando ouvimos 83 pessoas que se mudaram recentemente no Recife, mais de 70% só descobriram problemas graves depois de assinar o contrato. E o arrependimento não para na porta do apartamento: as pessoas descobrem tarde demais que se mudaram para um bolsão de calor, para o lado de uma demolição barulhenta ou uma quadra insegura, sem praças e cara de viver a pé.»

| Campo | |
| --- | --- |
| Objetivo | Dar escala humana ao problema e levar o arrependimento da porta para o bairro, com a emoção crescendo e sem infográfico. |
| Conceito visual | Pessoas como pontos. Os quatro pontos da cena 2 viram um campo de pessoas que se condensa nas 83 ouvidas. Uma linha em tinta, "assinatura do contrato", é atravessada pelos pontos, e os que descobrem tarde ficam ferrugem do outro lado. A linha gira e vira o batente de uma porta em planta; os pontos saem por ela e a câmera recua até a quadra. A quadra é a cidade da REF-01 em versão dessaturada (papel, tinta e ferrugem): a cidade que você descobre tarde. Na cena 7 a mesma cidade volta nas cores quentes da marca, investigada. |
| Telas reais do protótipo | Nenhuma tela. Só os tokens e o kicker da marca; as marcas de calor e insegurança desenhadas como as camadas do produto, sem os números do protótipo. |
| Telas e ilustrações de apoio | Campo de pontos (posições por `rng`); grade de 83 pontos sobre uma linha de base; linha "assinatura do contrato"; planta com porta em traço de prancheta; quadra 2.5D na linguagem da REF-01, dessaturada, com "quadra ilustrativa". |
| Honestidade | "93%" só vai para a tela quando a equipe trouxer a fonte (chave `fonte93`); sem ela, a batida mostra o campo e as palavras da fala. "Mais de 70%" tem fonte (71,1%, 59 de 83); os dois relatórios da amostra divergem, e a equipe confirma qual vale. A tela diz "pessoas ouvidas no Recife". Nenhum percentual por tipo de arrependimento, nenhum depoimento, nenhum nome de entrevistado. |
| Entrada | Da cena 2: os quatro pontos ferrugem na linha de base. |
| Saída | A câmera desce ao nível da rua; a linha do chão da quadra vira o plano de corte da cena 4, e os pontos se recolhem num só, parado na calçada: você. |
| Tom | Sóbrio e humano; a emoção cresce. Silêncio nos números. |
| Intensidade | 3 subindo |
| Duração estimada | 30 s |
| Tipo | ilustrativa |
| Fotos | Nenhuma: pessoas como pontos dão escala e dignidade sem foto de banco. |
| Mapa | Quadra 2.5D esquemática (não é Boa Viagem), com "quadra ilustrativa". |
| Complexidade e risco | Alta. Risco: pontos virarem "partícula genérica"; todo movimento é `track` amortecido sobre grade e linha de base. A cidade da REF-01 é construída na cena 7 e reaproveitada aqui. |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “Não por acaso, 93% dos brasileiros relatam dificuldade para comprar um imóvel.” | Os quatro pontos se multiplicam num campo denso de pontos pequenos sobre papel. Em Fraunces, as palavras da fala: "dificuldade para comprar um imóvel". "93%" entra só com a fonte (rodapé). | sim |
| B2 | “Quando ouvimos 83 pessoas que se mudaram recentemente no Recife,” | O campo se condensa em exatamente 83 pontos maiores, numa grade de 12 colunas sobre a linha de base. "83" e "pessoas ouvidas no Recife"; rodapé "pesquisa da equipe · N = 83 · out/2026". | sim |
| B3 | “mais de 70% só descobriram problemas graves depois de assinar o contrato.” | Uma linha vertical em tinta, "assinatura do contrato", se ergue no meio da grade; só 59 pontos a atravessam e ficam ferrugem; os 24 ficam do lado de cá, em tinta (a amostra inclui quem só buscou imóvel). Destaque: "mais de 70%". | sim |
| B4 | “E o arrependimento não para na porta do apartamento:” | A linha gira 90° e vira o batente de uma porta em planta; o arco abre e os pontos ferrugem saem. A câmera recua (zoom de layout) até a quadra dessaturada. | não |
| B5 | “as pessoas descobrem tarde demais que se mudaram para um bolsão de calor,” | Pontos assentam sobre topos que ganham hachura em três níveis de luminância (sem vermelho, sem gradiente). Rótulo: "bolsão de calor". | sim |
| B6 | “para o lado de uma demolição barulhenta ou uma quadra insegura,” | Ao lado do prédio, um lote vira terreno com hachura de entulho e três ondas de ruído: "demolição barulhenta". Manchas de luz ao longo da calçada se apagam: "quadra insegura". Sem HOLD: a fala segue depois da vírgula (decisão de 18/10/2026). | não |
| B7 | “sem praças e cara de viver a pé.” | Um quadrado tracejado vazio onde caberia uma praça: "sem praças". Um ponto tenta andar e a linha se estica até sair do quadro: "cara de viver a pé". A câmera assenta. | sim |

## Cena 04 · Os dados existem, mas estão enterrados

> «Os dados que evitam essa cilada são públicos, mas estão enterrados em cadastros técnicos que ninguém consegue cruzar sozinho. Hoje, para se proteger, você precisaria descobrir o número do lote na marra, baixar planilhas, caçar alvarás de obras e checar mapas. Fazer essa investigação leva semanas — tempo suficiente para outra pessoa levar o imóvel no seu lugar.»

| Campo | |
| --- | --- |
| Objetivo | Mostrar que a resposta existe, mas está espalhada em bases técnicas que ninguém cruza sozinho, e criar o cansaço que a virada resolve. |
| Conceito visual | Subsolo de cadastro. A quadra é cortada como num corte arquitetônico e a câmera desce abaixo da linha do chão. Embaixo, seis estratos, cada um uma base pública real, cada um com textura própria. O mesmo prédio aparece como um tique num ponto diferente de cada estrato: é por isso que ninguém cruza sozinho. O ponto "você" mergulha e a linha em tinta vira um caminho emaranhado entre os estratos; puxado, o emaranhado estica numa régua longa de semanas. |
| Telas reais do protótipo | Nomes de bases e órgãos do catálogo do protótipo (`openSourceSheet`: IPTU 2026, ITBI 2015–2026, Licenciamento Urbanístico, Defesa Civil 2024, SDS-PE / Crime Brasil) e o ESIG; o traço tracejado de "declarado" (`.conf-trace.declarado`) no contorno vazio do anúncio. |
| Telas e ilustrações de apoio | Corte com seis estratos; grade de planilha só com cabeçalhos de campos lidos (logradouro, número, bairro, área construída, ano), sem linhas de dado; máscara de código de lote sem dígitos reais; pilha de processos; recorte esquemático de mapa de lotes; régua de semanas; miniatura do anúncio fictício da cena 2. |
| Honestidade | Nenhuma linha de dado real (pode haver dado pessoal), nenhuma chave DSQFL, nenhuma data de atualização inventada das folhas de fonte. "SEMANAS" é palavra da fala, sem número de dias. |
| Entrada | Da cena 3: a linha do chão vira o plano de corte; o ponto "você" está na calçada. |
| Saída | A régua de semanas e o contorno tracejado vazio do anúncio levado passam para a cena 5. |
| Tom | Denso e cansativo, mas ordenado; a câmera mais lenta do filme. |
| Intensidade | 4 (o problema no ápice) |
| Duração estimada | 23 s |
| Tipo | ilustrativa |
| Fotos | Nenhuma. |
| Mapa | Só um recorte esquemático de mapa de lotes no estrato do ESIG, com "ilustrativo". |
| Complexidade e risco | Média. Risco: virar parede de dados genérica; seis estratos nomeados, deriva quase parada no HOLD, nenhum número inventado. Cor do subsolo depende da decisão do pontilhado (A claro ou B escuro). |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “Os dados que evitam essa cilada são públicos, mas estão enterrados em cadastros técnicos que ninguém consegue cruzar sozinho.” | Corte: a câmera desce abaixo do chão. Os seis estratos se revelam de cima para baixo por recorte, cada um com o nome real da base em JetBrains Mono. O mesmo prédio é um tique num x diferente em cada estrato. | sim |
| B2 | “Hoje, para se proteger, você precisaria descobrir o número do lote na marra,” | O ponto mergulha e deixa a linha atrás de si. No estrato do ESIG, a máscara de código de lote (__.____.____.__.____) recebe algarismos tentados um a um (`rng`) que não fecham. | sim |
| B3 | “baixar planilhas, caçar alvarás de obras e checar mapas.” | A linha ziguezagueia: no IPTU uma grade de planilha só com cabeçalhos se desdobra; no Licenciamento, uma pilha de processos se abre; no ESIG, um recorte de lotes. A linha volta e se cruza: o emaranhado. | sim |
| B4 | “Fazer essa investigação leva semanas —” | O emaranhado é puxado para a direita e estica numa régua longa com marcas de semana que saem do quadro. "SEMANAS" em Fraunces (opsz 40), sem bounce. Silêncio. | sim |
| B5 | “tempo suficiente para outra pessoa levar o imóvel no seu lugar.” | Na ponta da régua, a miniatura do anúncio fictício da cena 2. Um ponto cinza chega antes e leva o cartão; fica o contorno vazio em traço tracejado. | sim |

## Cena 05 · A virada: em segundos

> «A VEREDA faz essa investigação em segundos.»
> «Você cola o link do anúncio no aplicativo e revelamos o que os documentos oficiais dizem sobre o imóvel e o que o entorno espera de você.»

> **Produção, 18/10/2026:** prova de conceito em `motion/poc/cena05.html` (15,75 s), com crítica independente e uma segunda versão. O último quadro é o primeiro da cena 6; o primeiro é o subsolo escuro que a cena 4 terá de terminar (`motion/lib/subsolo.js`). Vídeo em `out/cena05-com-som.mp4`; revisão em [`review-log.md`](review-log.md) (CENA-05).

| Campo | |
| --- | --- |
| Objetivo | A virada do filme: o emaranhado vira uma vereda reta, e a investigação ganha casa no produto real. Um gesto basta. |
| Conceito visual | O emaranhado vira vereda. A maior mudança de luz do filme cai em "A VEREDA faz": a tinta escoa para baixo da linha do chão e o papel volta. A régua é puxada até ficar reta e curta, e é aqui que a linha fica laranja pela primeira vez: laranja é a cor da VEREDA. Os nomes das bases sobem e se condensam dentro do contorno vazio do anúncio levado, que fica sólido e vira o cartão real "Auditar novo anúncio". O lugar onde o imóvel se perdia é onde a investigação começa. Os mesmos nomes voltam no B3, cada um do seu lado da parede: o que os documentos dizem sobre o imóvel fica dentro, o que o entorno espera fica fora. |
| Telas reais do protótipo | `renderExplore`: cartão `.scanner-card` "Auditar novo anúncio", "Colar link", `#decoderUrlInput`, "Gerar Dossiê" (`.btn-scanner-primary`); cabeçalho `.brand-lockup` com o ninho e "VEREDA"; abas reais do dossiê "Destaques · Entorno · Edifício". |
| Telas e ilustrações de apoio | Troca "SEMANAS" → "SEGUNDOS" por caractere; a porta em planta (parede, folha e arco de giro, diagrama do filme) separando "Edifício", do lado de dentro, de "Entorno", do lado de fora. |
| Honestidade | O campo do protótipo nasce com o link de exemplo; o filme mostra o campo vazio e o link chegando de uma vez, como numa colagem, e isso é encenação documentada. O domínio `imovel.app` é fictício: nota "link de exemplo". O sublinhado laranja é anotação do filme. Depois de "Gerar Dossiê" o app real mostra a leitura (cena 6); o B3 mostra só as abas reais e os nomes das bases como índice do que vem, sem nenhum dado, e o rodapé diz isso. A leitura real dura 0,82 s; o filme estica para acompanhar a fala. |
| Entrada | Da cena 4: a régua esticada e o contorno vazio. |
| Saída | A câmera atravessa a soleira para o lado de dentro ("Edifício"): começa a cena 6. |
| Tom | Alívio e clareza: a primeira respiração do filme. |
| Intensidade | 4 na luz, 2 no movimento |
| Duração estimada | 14 s |
| Tipo | protótipo |
| Fotos | Nenhuma. |
| Mapa | Não. |
| Complexidade e risco | Média. Risco: a troca de letras parecer truque; curta (até 0,6 s), spring `type`, medida sem transform. |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “A VEREDA faz essa investigação em segundos.” | A borda da tinta desce até a régua e para nela em "VEREDA"; a régua é o chão e fica laranja nesse instante; depois a tinta abaixo dela escoa para fora do quadro e o papel volta com a grade. A marca entra grande (é a primeira vez que o nome é dito). A régua fica reta e curta; em "segundos", "SEMANAS" vira "SEGUNDOS" só nas letras que mudam. Os nomes das bases se condensam no contorno vazio. HOLD com a marca, "SEGUNDOS" sobre a régua curta e o contorno quieto (decisão de 18/10/2026: "SEGUNDOS" fica no HOLD e sai no começo do B2). | sim |
| B2 | “Você cola o link do anúncio no aplicativo” | A marca vai para o cabeçalho, "SEGUNDOS" sai e o contorno funde no cartão real "Auditar novo anúncio", com o campo vazio. O cursor toca "Colar link"; o link de exemplo chega de uma vez, com o toast real "Link de anúncio colado", e a linha laranja desliza para baixo dele como sublinhado. Clique em "Gerar Dossiê" com o squish do protótipo. | não |
| B3 | “e revelamos o que os documentos oficiais dizem sobre o imóvel e o que o entorno espera de você.” | O cartão se recolhe na barra de abas real "Destaques · Entorno · Edifício", sobre o papel. Em "documentos oficiais", os nomes das bases saem da barra. Em "imóvel", Edifício é selecionado e a linha vira a parede de uma porta em planta, com folha e arco de giro; Edifício, IPTU 2026, ITBI 2015–2026, Licenciamento Urbanístico e ESIG ficam do lado de dentro. Em "entorno", Entorno, Defesa Civil 2024 e SDS-PE / Crime Brasil descem para o lado de fora. HOLD logo depois de "entorno". Na saída, sai tudo menos a parede e "Edifício", a porta fecha e a câmera assenta no primeiro quadro da cena 6. | sim |

## Cena 06 · Da porta para dentro

> **Produção, 18/10/2026:** prova de conceito em `motion/poc/cena06.html` (29,7 s), com crítica independente e correção; vídeo em `out/cena06-com-som.mp4`; revisão em [`review-log.md`](review-log.md).

> «Da porta para dentro, nossa solução lê o anúncio, corrige a distorção das fotos para revelar a proporção real dos cômodos e descobre o lote exato do prédio. Na hora, cruzamos os registros da prefeitura para mostrar se a metragem anunciada bate com a área do IPTU, se existem taxas omitidas e por quanto os apartamentos daquele prédio foram realmente negociados nas escrituras dos últimos dez anos.»

| Campo | |
| --- | --- |
| Objetivo | Provar o cruzamento declarado × oficial com o prédio real da Rua João Cardoso Aires, 327: leitura, lote, área, IPTU e ITBI. |
| Conceito visual | Uma forma só, conduzida pelo cursor, na ordem da fala. O cartão de leitura lê o anúncio; um painel à parte simula a correção da foto; os cantos do cartão viram o lote em 2.5D enquanto a pessoa confirma "É este prédio"; depois um único painel troca de conteúdo três vezes (área, IPTU, ITBI). Motivo: o colchete laranja une o declarado (tracejado) ao oficial (azul, cheio); o que confere vira contínuo, o que não confere continua tracejado e vira pergunta. |
| Telas reais do protótipo | `triggerUrlDecode` → "Lendo o anúncio no aparelho" com as quatro etapas e "Só lemos campos do imóvel. Nada sobre quem anuncia."; `renderAnalyzingLotCard`: "É este o prédio?", "Toque nos lotes vizinhos se o pino não estiver sobre o prédio correto", "É este prédio"; `openDossierEvidence('cadastro')`: 44 unidades, 2010, 124,81 m², padrão Superior; `openDossierQuestion(1)`: "O IPTU de R$ 288 é mensal?"; `openDossierEvidence('historico')`: "56 transmissões entre 2015 e 2026 · mediana de R$ 4.339/m²", "Avaliação fiscal não é preço de venda."; kicker "O que o Vereda encontrou" e título "Além do anúncio.". |
| Telas e ilustrações de apoio | Painel de simulação da correção de lente com a sala ilustrativa (vetorial, a da cena 1), selo grande "simulação · recurso em desenvolvimento · sala ilustrativa"; painel de cruzamento com colchete (o protótipo mostra 125 m² e 124,81 m² em lugares diferentes); lote 2.5D e prédio com "polígono e altura ilustrativos". O cartão do anúncio real não tem foto: usa o comportamento do protótipo sem foto (o mapa com o pino), para não pôr a sala fictícia como aparência do prédio real. |
| Honestidade | Fora da tela: "Edifício Costa Atlântica" (o título é o endereço), a chave DSQFL, "12 pavimentos" como dado, o carimbo "ESIG" junto do polígono ilustrativo, o aluguel de R$ 4.500 e os R$ 5.690/6.018 (ilustrativos), "52 transmissões". Nenhuma palavra "escritura" nem "preço negociado" na tela. Área que confere não ganha selo verde. Cada linha com origem e "consultado em 15/10/2026". |
| Entrada | Da cena 5: a câmera atravessa a soleira para "Edifício"; o cartão vira a leitura do anúncio. |
| Saída | O painel sai; o lote com o pino fica sozinho e a câmera sobe pela fachada: a porta do prédio é a última coisa do lado de dentro. |
| Tom | Preciso, confiante, fluido; o cursor só faz o que a fala narra. |
| Intensidade | 3 (precisa) |
| Duração estimada | 27 s |
| Tipo | protótipo (híbrida na foto) |
| Fotos | Só a sala ilustrativa na simulação (vetorial). Se a equipe autorizar o par de fotos da REF-10, a simulação pode usar a foto A corrigida só na geometria. |
| Mapa | Lote 2.5D com vizinhos (do POC-01). |
| Complexidade e risco | Alta. Risco: texto demais em seis batidas; cada painel tem no máximo um número declarado e um oficial. Reordenar o POC-01 (lote antes do registro) mexe nos morphs. |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “Da porta para dentro, nossa solução lê o anúncio,” | O cartão vira "Lendo o anúncio no aparelho": título é o endereço; as quatro etapas marcam uma a uma (Condomínio R$ 1.190/mês; 125 m² · 4 quartos · 3 vagas; endereço; "Cruzando com a base do Recife"); a linha laranja vira a barra de 25% a 100%. Campos em tracejado "declarado pelo anunciante · lido em 15/10/2026". | não |
| B2 | “corrige a distorção das fotos para revelar a proporção real dos cômodos” | Painel à direita abre por recorte: a sala ilustrativa em grande angular; a grade marca as verticais; dolly da lente 340 → 1000; luz e cor iguais. Selo grande "simulação · recurso em desenvolvimento · sala ilustrativa". | sim |
| B3 | “e descobre o lote exato do prédio.” | O painel fecha. Os cantos do cartão interpolam até o lote 2.5D; o painel mostra "É este o prédio?" e "44 unidades · construído em 2010 · padrão Superior"; o cursor toca "É este prédio" e o contorno azul engrossa; o prédio sobe. "polígono e altura ilustrativos". | sim |
| B4 | “Na hora, cruzamos os registros da prefeitura para mostrar se a metragem anunciada bate com a área do IPTU,” | O lote vai para a esquerda e fica como âncora. Painel único: "O que o Vereda encontrou · Além do anúncio."; "125 m² no anúncio" (tracejado), colchete laranja, "124,81 m² no IPTU" (azul, cheio). O tracejado fica contínuo: confere. Fonte IPTU 2026. | sim |
| B5 | “se existem taxas omitidas” | O painel troca: "IPTU no anúncio · R$ 288 · período não informado" (tracejado), colchete, "IPTU 2026 cobrado no prédio · R$ 3.934 a R$ 4.457 por ano" (R$ 328 a R$ 371 por mês). O tracejado continua e vira a pergunta "O IPTU de R$ 288 é mensal?". | sim |
| B6 | “e por quanto os apartamentos daquele prédio foram realmente negociados nas escrituras dos últimos dez anos.” | O painel troca: "Transmissões no prédio · 56 avaliações no ITBI desde 2015 · mediana de R$ 4.339/m²", 56 traços curtos em bloco, a nota "Avaliação fiscal não é preço de venda." e a fonte ITBI 2015–2026. | sim |

## Cena 07 · Da porta para fora

> **Produção, 18/10/2026:** prova de conceito em `motion/poc/cena07.html` (25,4 s), com crítica independente e correção; vídeo em `out/cena07-com-som.mp4`; revisão em [`review-log.md`](review-log.md).

> «Da porta para fora, nós lemos o entorno para a sua rotina: mostramos se há alvará de obra ou demolição aprovado a menos de 150 metros da sua janela, se a rua sofre com alagamentos, se a quadra vira uma ilha de calor, como está a segurança no bairro e o custo real do que você resolve a pé.»

| Campo | |
| --- | --- |
| Objetivo | Mostrar como o entorno afeta a rotina, camada por camada, com o mesmo rigor de fonte: cada camada conta uma coisa só e deixa uma ficha. |
| Conceito visual | A cidade volta, agora investigada. A mesma cidade da cena 3 reaparece a partir do lote, nas cores quentes da marca (volumes da REF-01: faces laranja e ferrugem, topos de papel, contorno branco), com o lote em azul cadastral saltando à vista. A barra real "Explore o entorno" fica no alto e o cursor escolhe cada camada como na tela. A haste do pino sai da janela e varre o raio de 150 m; depois a câmera fica de cima e cada camada deixa uma marca leve no mapa e uma ficha na legenda. O que não tem dado por rua vira pergunta. No fim, o mapa da rotina fica parado com as fichas. |
| Telas reais do protótipo | `renderDossierSurroundings`: "Explore o entorno", camadas "Rotas", "Alagamento", "Calor", "Serviços"; destaque "49 registros de obra · Em 150 m · 4 demolições em 2026"; `openDossierFlood`: "A rua fica transitável? A água chega à garagem?"; "Confira a rua e a entrada da garagem."; "Calor · temperatura da superfície"; `openDossierEvidence('bairro')`: "Ocorrências / mil moradores · norte → sul" e as cinco taxas; "O que você quer por perto?" com Saúde, Escolas, Mercados, Transporte; "O trajeto e o tempo são calculados no aplicativo de mapas.". |
| Telas e ilustrações de apoio | Mapa SVG próprio (o do protótipo é um iframe de rede): cidade em volumes da REF-01 com "quadras ilustrativas"; raio de 150 m e faixa de 118 a 140 m; contorno pontilhado e "?" na garagem; régua de calor em degraus de luminância fora do mapa; faixas esquemáticas dos cinco bairros com barras; linha reta tracejada até um destino de exemplo. |
| Honestidade | "Desde 2018" (real), não "desde 2017"; demolições "entre 118 m e 140 m", uma faixa e não quatro pinos. Nenhuma água desenhada na rua real (não há dado por rua): só o contorno pontilhado e a pergunta; os 206 atendimentos da Defesa Civil com "não medem alagamento na rua". Calor: só a amplitude real de 6,6 °C, de superfície, numa régua; nada de −1,8 °C nem índice verde. Segurança: taxas reais por bairro, Boa Viagem em tinta, sem verde ou vermelho e sem "2ª menor". A pé: nenhum minuto, nenhum custo, nenhum km do protótipo (o pino dele fica a 1,9 km do prédio); "custo a pé · em desenvolvimento". Fonte e data em cada camada. |
| Entrada | Da cena 6: o lote com o pino; a câmera sobe pela fachada e o chão se revela a partir do lote. |
| Saída | O mapa encolhe; o anel de 150 m encolhe junto até o tamanho de um selo, vazio: começa a cena 8. |
| Tom | Espacial, cinematográfico e calmo; a câmera assenta em cada HOLD. |
| Intensidade | 4 (a mais espacial) |
| Duração estimada | 24 s |
| Tipo | híbrida |
| Fotos | Nenhuma; a cidade é vetorial. |
| Mapa | Sim, o principal do filme: SVG próprio em 2.5D (lote → quadra → bairro). |
| Complexidade e risco | Alta. Risco: seis camadas virarem "filtros rápidos"; cada uma tem HOLD e uma ideia só. A cidade da REF-01 em código é nova (e serve às cenas 3 e 11). |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “Da porta para fora, nós lemos o entorno para a sua rotina:” | A câmera sobe e inclina; o chão se revela a partir do lote e as quadras sobem como volumes quentes da REF-01, com o lote azul. No alto, a barra real "Explore o entorno" com as quatro camadas. "quadras ilustrativas". | sim |
| B2 | “mostramos se há alvará de obra ou demolição aprovado a menos de 150 metros da sua janela,” | A haste sai da janela do prédio, gira e varre o raio de 150 m; a faixa de 118 a 140 m em hachura; pílula "150 m em linha reta". Painel: "4 · alvarás de demolição deferidos em 2026 · entre 118 m e 140 m do prédio" e "49 · registros de obra em 150 m desde 2018"; fonte Licenciamento. O painel vira a ficha "Obras · 150 m". | sim |
| B3 | “se a rua sofre com alagamentos,” | O cursor toca "Alagamento"; a câmera fica de cima. A rua do prédio ganha contorno pontilhado e um "?" na garagem: "A água chega à garagem?". Painel: "Defesa Civil 2024 · 206 atendimentos em Boa Viagem" e "Os atendimentos não medem alagamento na rua.". Ficha "Alagamento · a conferir". | sim |
| B4 | “se a quadra vira uma ilha de calor,” | O cursor toca "Calor": ao lado do mapa, uma régua de cinco degraus de luminância com "6,6 °C" e "variação da temperatura de superfície no bairro · superfície, não ar · Landsat 8 e 9". O prédio não é posto na régua. Ficha "Calor · bairro". | sim |
| B5 | “como está a segurança no bairro” | A câmera sobe ao bairro: cinco faixas de norte a sul viram as barras "Pina 22,4 · Imbiribeira 17,4 · Ibura 18,0 · Boa Viagem 17,2 · Jordão 12,8", "2.165 ocorrências · out/2025 a set/2026", fonte SDS-PE / Crime Brasil · Censo 2022. Ficha "Segurança · bairro". | sim |
| B6 | “e o custo real do que você resolve a pé.” | A câmera desce de volta. O cursor toca "Serviços" (chips Saúde, Escolas, Mercados, Transporte) e "Rotas": uma linha reta tracejada laranja do pino até "Seu destino · exemplo · em linha reta"; rodapé "O trajeto e o tempo são calculados no aplicativo de mapas." e "custo a pé · em desenvolvimento". O mapa da rotina fica parado com as fichas. | sim |

## Cena 08 · Tirar a maquiagem e negociar

> «Em vez de inventar uma nota, a VEREDA  remove a maquiagem dos anúncios e separa as informações mais importantes —  aumentando seu poder de negociação. Com um toque, o app monta uma mensagem direta para você perguntar sobre os pontos ainda não revelados para o corretor no WhatsAp.»

> **Produção, 18/10/2026:** prova de conceito em `motion/poc/cena08.html` (21,9 s), com crítica independente e correção. O B3 começa em Conforto e o toque em Custo põe o IPTU em 01, como no protótipo; a faixa do anúncio só tem campos do anúncio real. Vídeo em `out/cena08-com-som.mp4`; revisão em [`review-log.md`](review-log.md) (CENA-08).

| Campo | |
| --- | --- |
| Objetivo | Mostrar que o VEREDA não julga: separa o declarado do registrado, põe em ordem o que importa e transforma o que falta em perguntas prontas para o corretor. |
| Conceito visual | O anel que não vira selo. O anel de 150 m encolhe até o tamanho de um selo e fica vazio por um instante; em vez de receber uma nota, ele se abre e desenrola numa linha reta: a divisória do dossiê. Acima, o declarado (tracejado); abaixo, o registrado (contínuo). O que confere passa a contínuo; o que não confere sobe como pergunta numerada, e as perguntas viajam inteiras até a mensagem ao corretor. |
| Telas reais do protótipo | `renderDossierHighlights`: "O que o Vereda encontrou", "Além do anúncio.", "Banheiros não conferem · 3 × 1 · suítes × banheiros"; aba Edifício: "Antes de decidir.", "O que pesa mais para você? · Custo · Conforto · Documentos" (`setDossierPriority`), "R$ 288 de IPTU por mês?", "Quantos banheiros há?"; `openAboutDataSheet`: traços "registro oficial" e "declarado pelo anunciante"; Visita · Preparar: "Antes de marcar", "Peça as informações que faltam e combine a visita com o corretor.", "Preparar mensagem"; `openVisitMessage`: "Converse com o corretor", a mensagem, "Copiar mensagem", toast "Mensagem copiada", "Abrir WhatsApp". |
| Telas e ilustrações de apoio | Anel vazio que se desenrola na divisória; composição em duas faixas (declarado acima, oficial abaixo) numa tela só. |
| Honestidade | Nenhuma nota, estrela ou selo; o anel fica vazio menos de 0,4 s e não recebe nada. O destaque "−1,8° na superfície" do protótipo é inventado e sai. O subtítulo "Edifício Costa Atlântica" vira o endereço. Sem logo, cor ou tela do WhatsApp: só o botão do protótipo, com o rótulo do botão; a fala continua como está. A mensagem mostra exatamente as perguntas que o protótipo põe nela. |
| Entrada | Da cena 7: o anel de 150 m, que encolhe com o mapa. |
| Saída | A seta de "Abrir WhatsApp" se estende como a linha laranja; a folha desce e se fecha na moldura de celular do protótipo: a investigação vai para o bolso. |
| Tom | Confiante, prático, empoderador; o ritmo mais limpo do filme. |
| Intensidade | 2 (clareza) |
| Duração estimada | 19 s |
| Tipo | protótipo |
| Fotos | Nenhuma. |
| Mapa | Não. |
| Complexidade e risco | Média. Risco: muitas trocas de texto; respeitar "sai antes, entra depois". |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “Em vez de inventar uma nota,” | O anel encolhe até cerca de 120 px e para vazio; então se abre num ponto e desenrola numa linha laranja horizontal que atravessa o quadro: a divisória. | não |
| B2 | “a VEREDA  remove a maquiagem dos anúncios” | O cartão do anúncio desce sobre a divisória e se separa por ela: acima, "declarado pelo anunciante — preço, área, fotos" com os campos em tracejado; abaixo, "registro oficial — IPTU, ITBI, Licenciamento" em traço contínuo. | sim |
| B3 | “e separa as informações mais importantes —  aumentando seu poder de negociação.” | Os fatos se ordenam em escada: os que conferem (125 m² × 124,81 m²; 44 unidades · 2010) passam a contínuo; "R$ 288 de IPTU por mês?" e "Quantos banheiros há?" sobem ao topo como 01 e 02. O cursor toca "Custo" em "O que pesa mais para você?" e a lista reordena. | sim |
| B4 | “Com um toque, o app monta uma mensagem direta para você perguntar sobre os pontos ainda não revelados para o corretor no WhatsAp.” | O cursor toca "Preparar mensagem"; a folha "Converse com o corretor" sobe; as linhas 01 e 02 voam inteiras para dentro da mensagem. "Copiar mensagem" → toast "Mensagem copiada"; o botão "Abrir WhatsApp" fica visível, sem logo. | sim |

## Cena 09 · O celular vira ferramenta

> «E, na visita presencial, o seu celular vira ferramenta de investigação: usa o GPS para confirmar o prédio, a bússola para testar o sol na janela e o microfone para medir o barulho da rua. Aquele prejuízo lá do começo? Você desmascara em dois minutos.»

| Campo | |
| --- | --- |
| Objetivo | A investigação sai da tela e entra no lugar: confirmar o prédio, testar o sol, ouvir a rua; e fechar o arco do prejuízo da cena 1. |
| Conceito visual | A planta sob o celular. O celular, na moldura do próprio protótipo, pousa sobre uma planta de apartamento em traço de prancheta que nasce dele. Cada ferramenta estende a linha laranja para fora da tela: o anel de precisão encolhe até o prédio; o anel vira o aro da bússola e a agulha atravessa a janela da planta como direção do sol; a onda do ruído vem da rua até o aparelho. No fim, a onda se aplaina na linha do peitoril e a janela da cena 1 volta; a linha a atravessa como um limpador. |
| Telas reais do protótipo | Moldura de celular do protótipo (`.app-frame`); Visita · No imóvel: "Durante a visita", "Olhe de perto.", cronômetro, "Seu roteiro"; `openVisitLight`: "Luz na janela", N L S O, "Leste", "Observe o sol da manhã.", "Orientação manual"; `openVisitNoise`: "Escute com a janela aberta", "44 dB · Janela fechada", "58 dB · Janela aberta", "Exemplo de leitura · demonstração"; Resumo: "Sua visita, registrada.", "Luz na janela · Leste · 98° registrados por você"; quadro final da cena 1. |
| Telas e ilustrações de apoio | Planta "ilustrativa" em traço de prancheta; anel de GPS com "GPS · em desenvolvimento"; prolongamento da agulha como direção do sol; onda de ruído determinística; limpador laranja sobre a janela da cena 1. |
| Honestidade | O GPS não existe no protótipo web (só no app Expo): etiqueta "em desenvolvimento" e a nota de que hoje o prédio é confirmado no toque "É este prédio". A bússola é manual: "Orientação manual" na tela; o arraste do cursor é esse gesto. O protótipo não calcula sol nem horário: o arco só ilustra a direção. O microfone não mede: 44 e 58 dB com "demonstração". O cronômetro não termina em "02:00". O eco do "R$ 125 MIL" só volta com um sim do usuário; sem ele, a janela volta sem o número. |
| Entrada | Da cena 8: a folha se fecha na moldura do celular. |
| Saída | A linha do limpador deita e vira a régua de doze meses da cena 10. |
| Tom | Criativa e física; interface sóbria, encenação cinematográfica. O eco é o primeiro arrepio desde a cena 1. |
| Intensidade | 5 (a mais física) |
| Duração estimada | 18 s |
| Tipo | híbrida |
| Fotos | Nenhuma. |
| Mapa | Curto: a vista de cima do lote da cena 7, para o GPS. |
| Complexidade e risco | Alta. Risco: três ferramentas e um eco em 18 s; cada uma com HOLD. Versão de corte pronta: celular sobre papel, sem planta. |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “E, na visita presencial, o seu celular vira ferramenta de investigação:” | A folha se fecha no celular; na tela, "Durante a visita · Olhe de perto." e o cronômetro (recriado com `seek`). Do aparelho para fora, as paredes de uma planta se desenham: "planta ilustrativa". Sem HOLD: a fala termina em dois-pontos e emenda no GPS (decisão de 18/10/2026). | não |
| B2 | “usa o GPS para confirmar o prédio,” | Zoom de layout para fora: a planta cabe no prédio, e o prédio no lote azul da cena 7, visto de cima. O anel laranja de precisão sai da borda do celular e encolhe até o pino; o lote fica contínuo como na cena 7, e o contorno do prédio passa de tracejado a contínuo, com o rótulo "prédio". "GPS · em desenvolvimento". | sim |
| B3 | “a bússola para testar o sol na janela” | O anel vira o aro da bússola de "Luz na janela". O cursor arrasta o controle "Orientação manual" do celular até 98° e a agulha assenta (a bússola da planta só a ecoa); a agulha se prolonga pela janela da planta como direção do sol, com um arco de manhã do lado leste. "Leste · Observe o sol da manhã." e "Orientação manual". | sim |
| B4 | “e o microfone para medir o barulho da rua.” | Da rua, uma onda corre até o aparelho; a folha "Escute com a janela aberta" mostra 44 dB; a janela da planta abre e o número passa a 58 dB. "Exemplo de leitura · demonstração" o tempo todo. | sim |
| B5 | “Aquele prejuízo lá do começo?” | A onda perde amplitude e vira o peitoril; a câmera entra pela janela da planta e o quadro final da cena 1 volta. Sem o "R$ 125 MIL" (padrão até a decisão do usuário), as quatro promessas do anúncio fictício da cena 1 voltam sobre o vidro escuro, em pílulas tracejadas; com ele (`?eco=1`), o número. | sim |
| B6 | “Você desmascara em dois minutos.” | A linha laranja varre o vidro como um limpador, levando as promessas; atrás dela o vidro vira papel com a grade. Ao lado, o resumo real "Sua visita, registrada." com "Luz na janela · Leste · 98° registrados por você". | sim |

## Cena 10 · Modelo e validação

> «Como ninguém muda de casa todo mês, nós não cobramos assinatura mensal. Você começa com créditos e ganha novos ao colaborar em campo confirmando dados ou compra dossiês avulsos quando está prestes a fechar negócio. Na nossa validação, 89% dos entrevistados toparam colaborar em troca de créditos, e o app teve nota de utilidade de 4,73 de 5.»

| Campo | |
| --- | --- |
| Objetivo | Explicar créditos em vez de assinatura e mostrar a aceitação (89% e 4,73 de 5) com calma, sem frear o filme. |
| Conceito visual | A régua sem cobranças e as 83 pessoas de volta. A linha vira uma régua de doze meses cujas marcas de cobrança se apagam; sobra um ponto, a mudança, que sobe, vira a pílula "3 créditos" e abre a carteira real. Depois voltam os mesmos 83 pontos da cena 3: quem descobriu tarde agora acende em laranja, a cor da VEREDA, como quem topa colaborar. Os pontos se alinham numa régua de 1 a 5 e a linha corre até 4,73. |
| Telas reais do protótipo | Pílula `.credits-pill-btn` "3 créditos"; `openCreditsSheet`: "Saldo disponível", "Cada dossiê gerado consome 1 crédito", "Como ganhar créditos (+1 por ação):", "• Confirmar o lote de um prédio não identificado (+1)", extrato com "Pacote de 3 dossiês" e, após confirmar um lote, "Lote confirmado em Espinheiro · Agora · +1" e saldo 4. |
| Telas e ilustrações de apoio | Régua de doze meses com marcas que se apagam; grade de 83 pontos (a mesma da cena 3); régua de 1 a 5. |
| Honestidade | Saldo e extrato são de exemplo: rótulo "extrato de exemplo"; sem o código "(T16)". Não há botão de compra no protótipo: só a linha do extrato. 89% = 89,2% (74 de 83), com "pesquisa da equipe · N = 83 · out/2026 · intenção declarada". 4,73 foi dado à ideia apresentada aos entrevistados, não a um app usado; escala de 1 a 5; sem estrelas. A equipe confirma qual versão da pesquisa vale. |
| Entrada | Da cena 9: a linha do limpador deita. |
| Saída | A régua de 1 a 5 se estende e vira a linha do tempo da cena 11. |
| Tom | Tranquilizador e conciso. |
| Intensidade | 1 (respira) |
| Duração estimada | 23 s |
| Tipo | híbrida |
| Fotos | Nenhuma. |
| Mapa | Não. |
| Complexidade e risco | Baixa. Risco: parecer slide de modelo de negócio; um objeto só (ponto → pílula → folha) e os números sobre as mesmas 83 pessoas. |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “Como ninguém muda de casa todo mês, nós não cobramos assinatura mensal.” | Régua "jan … dez" sobre papel; doze marcas de cobrança se desenham e são recortadas uma a uma; sobra um ponto laranja num mês só. Texto: "não cobramos assinatura mensal" (palavras literais da fala). | sim |
| B2 | “Você começa com créditos e ganha novos ao colaborar em campo confirmando dados” | O ponto sobe e vira a pílula "3 créditos"; o cursor toca e a pílula se abre na "Carteira de créditos"; realce em "Confirmar o lote de um prédio não identificado (+1)"; entra "Lote confirmado em Espinheiro · Agora · +1" e o saldo vai a 4. | sim |
| B3 | “ou compra dossiês avulsos quando está prestes a fechar negócio.” | Realce na linha "Pacote de 3 dossiês" do extrato. Nenhum botão de compra. | sim |
| B4 | “Na nossa validação, 89% dos entrevistados toparam colaborar em troca de créditos,” | A folha sai e a grade dos 83 pontos da cena 3 volta no mesmo lugar; 74 acendem em laranja. "89%" em Fraunces; rodapé da pesquisa. | sim |
| B5 | “e o app teve nota de utilidade de 4,73 de 5.” | Os pontos se condensam numa régua de 1 a 5 (cinco marcas, sem estrelas); a linha laranja corre até 4,73. "4,73" e "de 5"; rodapé "nota média de utilidade da ideia apresentada aos entrevistados". | sim |

## Cena 11 · Prova, equipe e piloto

> «Tudo isso já está validado com profissionais da área, e empreendedores parceiros do centro de informática,  telas funcionais, cruzando mais de meio milhão de registros da cidade com alta precisão na identificação. Somos três profissionais e universitários — Samuel em produto, Matheus em design e Artur em dados e engenharia. Com a Campus, vamos colocar o piloto na rua até junho de 2027.»

| Campo | |
| --- | --- |
| Objetivo | Responder "essas pessoas conseguem construir e lançar isso?": telas que funcionam, bases da cidade com tamanho conhecido, três pessoas com papéis claros e uma data. |
| Conceito visual | O subsolo vem à superfície. A régua vira a linha do tempo; acima dela, as telas reais do protótipo, ligadas na ordem da jornada pelo caminho laranja. Depois os estratos enterrados da cena 4 voltam em papel, alinhados e proporcionais às bases reais, atravessados num ponto só por uma linha laranja que converge num contorno de lote. A equipe fica de pé sobre a linha, que corre até junho de 2027 e desce numa rua. |
| Telas reais do protótipo | Capturas reais do protótipo em `motion-references/contact-sheets/prototipo/` (Lendo o anúncio, É este o prédio?, Edifício, Entorno, Luz na janela, Converse com o corretor), em tamanho fixo, reveladas por recorte. |
| Telas e ilustrações de apoio | Linha do tempo com marcos; três blocos proporcionais às bases; cartões tipográficos da equipe (inicial num círculo de papel); rua da cidade de perfil. |
| Honestidade | Nenhum nome, logo ou instituição para "profissionais da área" e "empreendedores parceiros". "+500 MIL" é o tamanho das três bases (616.254), não o total cruzado; o rodapé diz o que conta. Nenhum percentual de precisão. A tela segue a fala (Matheus; "a Campus"); a equipe confirma nome e programa. Capturas sem "T16", sem "Edifício Costa Atlântica" e sem números inventados. Fotos da equipe só se enviadas e autorizadas. |
| Entrada | Da cena 10: a régua de 1 a 5 vira a linha do tempo. |
| Saída | A linha deixa a rua, sobe e desenha um retângulo: a moldura da foto da cena 12. |
| Tom | Prova, não hype: sóbrio, digno, voltado ao futuro. |
| Intensidade | 3 (firme) |
| Duração estimada | 25 s |
| Tipo | híbrida |
| Fotos | Retratos da equipe só se enviados e autorizados; até lá, cartões tipográficos. |
| Mapa | Só a rua de perfil no fim. |
| Complexidade e risco | Média. Risco: pendências de fato (nome do designer, programa, "parceiros") travarem o render; cada uma é um campo fácil de trocar. |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “Tudo isso já está validado com profissionais da área, e empreendedores parceiros do centro de informática,  telas funcionais,” | A régua vira a linha do tempo. Acima, seis telas reais do protótipo em molduras de celular, reveladas em escada e ligadas pelo caminho laranja na ordem da jornada. Chips só com palavras da fala: "profissionais da área", "centro de informática", "telas funcionais". | sim |
| B2 | “cruzando mais de meio milhão de registros da cidade com alta precisão na identificação.” | As telas descem; os estratos da cena 4 sobem em papel, proporcionais: IPTU 2026 · 422.776, Licenciamento Urbanístico · 113.305, Defesa Civil 2024 · 80.173. Uma linha laranja os atravessa num ponto e converge num contorno de lote azul. "+500 MIL registros"; rodapé com as três bases e a soma. | sim |
| B3 | “Somos três profissionais e universitários — Samuel em produto, Matheus em design e Artur em dados e engenharia.” | A linha deita e vira a base; três cartões ficam de pé: "Samuel · produto", "Matheus · design", "Artur · dados e engenharia". | sim |
| B4 | “Com a Campus, vamos colocar o piloto na rua até junho de 2027.” | A base estica até "junho de 2027 · piloto na rua"; na ponta, desce e vira o meio-fio de uma rua da cidade, de perfil. Marcos intermediários só se a equipe confirmar. | sim |

## Cena 12 · A verdade antes da decisão

> «Afinal, uma boa foto serve para conquistar o seu clique. Decidir onde morar exige saber a verdade.»

| Campo | |
| --- | --- |
| Objetivo | Fechar o círculo: a mesma foto bonita da abertura, agora atravessada pela verdade, e a marca como o lugar onde a verdade fica visível antes da decisão. |
| Conceito visual | A janela vira a porta do ninho. A linha desenha a moldura de um anúncio; dentro, a sala quente da cena 1 com as quatro promessas entre aspas. O cursor clica: é "o seu clique". Na última frase, uma máscara orgânica descasca a foto a partir do clique e mostra, sobre papel, as linhas do filme (o contorno do lote, o arco do raio, a agulha, a onda, a divisória), que se juntam no contorno do ninho do joão-de-barro; a janela da sala, onde o sol se pôs e o prejuízo subiu, vira a abertura do ninho. "VEREDA" entra no silêncio. |
| Telas reais do protótipo | Ninho e "VEREDA" do `.brand-lockup` do `index.html` (caminhos do `joao-barro-icon`, #F47745 e #F5F0E6); sala da cena 1 no estado de encantamento. |
| Telas e ilustrações de apoio | Máscara orgânica de descasque (técnica nova, borda guiada por springs); morph da moldura no ninho e da janela na abertura (contornos amostrados a partir do mesmo ponto). |
| Honestidade | A sala é do anúncio fictício das cenas 1 e 2, com "anúncio fictício" no rodapé; nada de Boa Viagem. Sem slogan novo: a única palavra nova é a marca. Nenhum número. |
| Entrada | Da cena 11: a linha deixa a rua e desenha a moldura. |
| Saída | Fim: a marca parada sobre papel durante as perguntas. |
| Tom | Emocionante, elevado, definidor de marca; silêncio na marca. |
| Intensidade | 5 (pico emocional, quieto) |
| Duração estimada | 7 s + HOLD final |
| Tipo | ilustrativa |
| Fotos | Nenhuma: a "foto bonita" é a sala vetorial da abertura. |
| Mapa | Não. |
| Complexidade e risco | Alta. Risco: o morph do retângulo no ninho parecer efeito de logo de template; spring `camera` sem overshoot e a abertura nascendo visivelmente da janela. Prototipar a máscara cedo. |

| # | Fala (literal) | Visual | HOLD |
| --- | --- | --- | --- |
| B1 | “Afinal, uma boa foto serve para conquistar o seu clique.” | A linha desenha o retângulo da foto (raio 36); a sala quente entra por recorte com as quatro aspas e o rodapé "anúncio fictício". O cursor volta e clica no meio da foto. | sim |
| B2 | “Decidir onde morar exige saber a verdade.” | A máscara descasca a sala a partir do clique; por baixo, as linhas do filme convergem no contorno do ninho, que se enche de laranja; a janela encolhe até a abertura do ninho. "VEREDA" entra depois da última palavra; a câmera recua de 1,025 para 1,0 (teto da `motion-language`). HOLD final. | sim |

