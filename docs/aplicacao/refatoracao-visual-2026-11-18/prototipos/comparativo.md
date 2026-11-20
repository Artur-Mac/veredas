# Comparativo das duas opções (fase 1)

Refatoração visual da navegação principal do Vereda, 19/11/2026. Os dois protótipos usam os mesmos imóveis e os mesmos números, lidos do app (ver `../auditoria/exemplo-escolhido.md`). **A escolha é do Samuel.** Este documento dá o argumento de cada opção, os prós e contras, a avaliação pelas heurísticas de Nielsen, o teste de 5 segundos e a minha recomendação.

- Opção A: [`opcao-a/index.html`](opcao-a/index.html) · folha de contato [`folha-de-contato-a.png`](folha-de-contato-a.png) · gavetas menores [`folha-de-contato-a-gavetas.png`](folha-de-contato-a-gavetas.png) · 360 px [`folha-de-contato-a-360.png`](folha-de-contato-a-360.png)
- Opção B: [`opcao-b/index.html`](opcao-b/index.html) · folha de contato [`folha-de-contato-b.png`](folha-de-contato-b.png) · gavetas menores [`folha-de-contato-b-gavetas.png`](folha-de-contato-b-gavetas.png) · 360 px [`folha-de-contato-b-360.png`](folha-de-contato-b-360.png)

Abra os HTML num navegador de computador: à esquerda fica o roteiro com todas as telas e estados; à direita, o aparelho de 390 × 844, clicável. Num celular, o protótipo ocupa a tela.

## 1. De onde as duas partem

A auditoria (`../auditoria/auditoria.md`) mostrou que o problema não é só de aparência. O dossiê tem 13,7 telas numa aba e 33 nas três; o barulho aparece em 8 lugares; a conta de 10 anos dá dois resultados; três das quatro abas ficam vazias sem um imóvel aberto. Por isso as duas opções mudam a estrutura antes do desenho, e nisto são iguais:

- **A navegação nasce das perguntas**, na ordem em que pesam: cabe no bolso, o prédio é confiável, como é a rua, barulho, calor e chuva, o que perguntar. "Dossiê" deixa de ser uma aba: é o imóvel aberto.
- **Cada leitura tem um lugar só.** Número grande, unidade e uma linha; o detalhe a um toque; a ficha de método e a fonte a mais um.
- **Dois nomes fixos** no app inteiro: "Como foi calculada" (a ficha de 6 campos) e "Ver a fonte". Hoje são 11 nomes.
- **Uma ação laranja por tela.** Quando uma gaveta abre com a sua, a da tela de baixo se apaga.
- **O caderno é a casa de quem volta.** Uma lista só; triagem (favoritar, anotar, etapa, descartar) no mesmo lugar.
- **Estados desenhados:** primeiro uso, buscando, resultados, sem permissão, sem rede, "Sem leitura" (prédio não confirmado).
- **Mapas como estão.** Entram como captura do mapa atual, com o crédito da Prefeitura.

O que cada uma faz de diferente:

| | A · Ficha de campo | B · Painel de bolso |
|---|---|---|
| Ideia | O imóvel é uma folha de cadastro: lê-se de cima a baixo | O imóvel é um painel: vê-se de uma vez |
| Barra de baixo | 3 abas de texto: Caderno, Comparar, Visita | 4 abas com ícone: Painel, Comparar, Visita, Caderno |
| Tela de entrada (com caderno) | Caderno: os imóveis em linhas, agrupados pela etapa | Painel do último imóvel; desliza-se para o próximo |
| O imóvel | Uma folha com 5 perguntas e índice que gruda no alto | Uma tela com 7 mostradores; o detalhe sobe em gaveta |
| Onde está o detalhe | Na própria folha, logo abaixo do número | Na gaveta de cada mostrador |
| Novo imóvel | Tela própria, aberta pelo botão do Caderno | Gaveta, aberta pelo "+" de qualquer lugar |
| Link colado | Uma tela: o que foi lido e "é este o prédio?" | Uma gaveta com as mesmas duas partes |
| Comparar | Tabela por pergunta; ponto cheio em quem leva vantagem | Duelo: valor de cada lado e barra que cresce do meio |
| Visita | Lista de conferência com caixas, instrumentos no fim | Um ponto por tela, respostas grandes; microfone e bússola viram pontos |
| Imóvel de aluguel | A mesma folha; o bolso soma aluguel, condomínio e seguro (desenhado só o topo, com o Viena) | O mesmo painel; o bolso diz "aluguel e taxas por mês" (painel do Viena desenhado) |
| Superfícies | Papel e linha fina; nenhum cartão | Superfícies brancas de canto médio sobre o papel |
| Número | Fraunces 56, com régua embaixo | Fraunces 56 no bolso e 28 nos mostradores, com arco ou escala |
| Estado do dado | Carimbo (confirmado, estimativa, não confere, trava, sem leitura) | Selo discreto, ponto ferrugem de atenção, arco tracejado |
| Gestos | Nenhum obrigatório | Deslizar entre imóveis e na linha do caderno, sempre com botão equivalente |

## 2. Opção A · Ficha de campo

**Argumento.** Quem analisa um imóvel está montando um processo: junta papel, confere número, anota pergunta. A ficha dá a isso a forma que já é conhecida de cartório e de vistoria: uma folha por imóvel, com o número do cadastro no alto, um carimbo dizendo o que está confirmado, e as cinco perguntas na mesma ordem em todo imóvel. A leitura é contínua: a pessoa rola e o índice acompanha. Nada fica escondido atrás de um toque que ela não sabe que existe.

**Prós**
- É a opção com mais cara própria. Carimbo, régua, pontilhado e a chave cadastral não se parecem com nenhum app de imóvel, e vêm do assunto do produto, não de enfeite.
- A origem de cada número fica colada nele ("anúncio", "cadastro do prédio · IPTU 2026", "estimativa · 80% em 30 anos"). A barra "conhecido × estimativa" mostra que o anúncio conta R$ 1.075 de R$ 6.805.
- Lê bem com fonte ampliada e com leitor de tela: uma coluna, na ordem do documento, sem grade para reorganizar.
- Implementação barata e de baixo risco: rolagem com cabeçalho fixo, texto e SVG. Não pede biblioteca de gesto nem de gaveta nova.
- Serve de folha impressa: o "Pacote para especialista" sai quase pronto do mesmo desenho.

**Contras**
- Continua sendo uma rolagem longa: a folha tem cerca de 8 telas (era 13,7 só na primeira aba). O índice resolve o acesso, não o tamanho.
- Parece mais documento do que aplicativo. A queixa de origem foi "não parece um aplicativo"; a ficha responde "tem cara própria" melhor do que responde isso.
- Barra de baixo só com texto foge do costume das plataformas (ícone e rótulo). Funciona com três palavras claras, mas é uma aposta.
- Comparar vários imóveis exige voltar ao Caderno e abrir outro: não há passagem direta de uma ficha para a seguinte.
- Rótulos em mono e caixa alta dão o tom de cadastro, mas em excesso cansam. Precisa de disciplina para não virar formulário.

**Onde pode dar errado na implementação.** A tentação de voltar a empilhar: cada seção só fica boa com no máximo um número grande, uma régua e cinco linhas. O que passar disso tem de ir para gaveta.

## 3. Opção B · Painel de bolso

**Argumento.** A primeira coisa que a pessoa quer saber de um imóvel cabe em sete números. O painel mostra os sete de uma vez, sempre no mesmo lugar, e deixa o resto a um toque. Como o lugar de cada mostrador não muda, deslizar de um imóvel para outro já é comparar: o olho fica no "Noite e ruído" e vê 58, 58, 64. É o desenho que mais se comporta como um aplicativo de celular: barra de abas, gaveta, deslize, botão no alcance do polegar.

**Prós**
- Responde à queixa principal: parece aplicativo e tem pouco texto. O painel do Parque Atlântico tem 78 palavras, contando os nomes da barra; a aba Destaques de hoje tem 2.067.
- Passa no teste de 5 segundos (seção 5): o custo por mês domina, e os pontos ferrugem levam o olho ao que pede atenção.
- Memória de lugar: o mesmo mostrador no mesmo canto em todo imóvel. Ajuda quem está entre três ou quatro opções, que é o público da primeira fase (aluguel, duas ou mais opções concretas).
- "Sem leitura" fica evidente: o mostrador continua lá, com o arco tracejado, e diz o que falta ("confirme o prédio").
- A visita com um ponto por tela e respostas grandes serve para usar em pé, com uma mão.

**Contras**
- O detalhe fica escondido. "Documentos do sinal" está dentro de Prédio; "Preparar a negociação", dentro de Perguntas. Quem não tocar não descobre. A lista de cobertura (`cobertura.md`) mostra o caminho de cada coisa, e vários têm 2 toques.
- Mostradores são superfícies: é a opção mais perto do risco de "grade de cartões". Só se sustenta se cada um continuar sendo rótulo, número, uma linha e o seu instrumento, sem parágrafo e sem botão dentro.
- Com fonte ampliada o painel deixa de caber numa tela e passa a rolar. Continua usável, mas perde a leitura de uma vez só.
- Pede mais do código: páginas que deslizam, gavetas com mais de uma altura, gesto na linha do caderno. Mais superfície para testar em celular físico, que ainda não foi feito para nenhuma tela do app.
- A média de seis leituras num número só ("Pulso da quadra") combina menos com um painel que já mostra as seis. Ficou numa linha discreta.

**Onde pode dar errado na implementação.** Encher o painel. A regra tem de ser dura: sete mostradores, nenhum a mais; o que for novo entra como linha de uma gaveta.

## 4. Heurísticas de Nielsen

Avaliação minha, sobre os protótipos (não houve teste com pessoas). "Atende", "atende em parte" ou "não atende", com o motivo.

| # | Heurística | A · Ficha de campo | B · Painel de bolso |
|---|---|---|---|
| 1 | Visibilidade do estado do sistema | **Atende.** Carimbo em cada dado; o índice marca a pergunta em que a pessoa está; a etapa agrupa o Caderno. Falta desenhar a confirmação depois de uma ação ("Nota guardada") | **Atende.** Etapa e posição entre os imóveis sempre no alto; ponto de atenção no mostrador; espera desenhada no "sem rede". Falta a mesma confirmação de ação |
| 2 | Correspondência com o mundo real | **Atende.** Ficha, caderno e carimbo são palavras do assunto; os títulos são as perguntas da pessoa ("Cabe no bolso?") | **Atende.** Uma palavra por mostrador (Bolso, Prédio, A pé, Chuva). "Noite e ruído" junta duas coisas, mas é como a pessoa pergunta |
| 3 | Controle e liberdade | **Atende.** Voltar sempre no mesmo canto; gaveta fecha no ×, fora dela ou no Esc; descarte se desfaz em "descartados" | **Atende.** Igual, e todo gesto tem botão equivalente (pontos para trocar de imóvel, três pontos na linha do caderno) |
| 4 | Consistência e padrões | **Atende em parte.** Coerente por dentro (dois nomes fixos, um desenho de linha), mas a barra só com texto foge do padrão de ícone e rótulo | **Atende.** Barra de abas, gaveta, segmento e interruptor como nas plataformas |
| 5 | Prevenção de erros | **Atende.** Confirmar o prédio é um passo próprio, com mapa e motivo; valor "a confirmar" nunca vira zero; descartar pede o motivo | **Atende em parte.** O mesmo, mas o deslize na linha do caderno deixa "Descartar" a um gesto: tem de passar pela gaveta do motivo, nunca descartar direto |
| 6 | Reconhecer em vez de lembrar | **Atende.** Tudo o que existe sobre o imóvel está na folha, com nome | **Atende em parte.** Os sete mostradores se reconhecem de imediato; o que está dentro de cada gaveta precisa ser lembrado ou procurado |
| 7 | Flexibilidade e eficiência | **Atende em parte.** Rápida para ler um imóvel a fundo; lenta para passar por vários | **Atende.** Deslizar entre imóveis olhando o mesmo mostrador; o "+" abre a entrada de qualquer lugar |
| 8 | Estética e desenho mínimo | **Atende.** Sem caixa, sem ícone decorativo; hierarquia por tamanho e espaço. O tamanho da folha é o ponto fraco | **Atende.** Uma tela, sete leituras. Depende de manter os mostradores enxutos |
| 9 | Reconhecer e sair de um erro | **Atende.** "Os dados de Boa Viagem não chegaram. O que veio do anúncio continua aqui." com "Tentar de novo"; "Sem permissão" diz o que fazer | **Atende.** Os mesmos estados, com o mostrador em espera no lugar do número |
| 10 | Ajuda e documentação | **Atende.** Ficha de método de 6 campos e "Ver a fonte" a um toque de cada número; "Sobre os dados" no menu | **Atende.** Os mesmos, a dois toques (mostrador, depois a linha "Como foi calculada") |

Resumo: A perde em padrão de plataforma (4) e em passar por vários imóveis (7). B perde em descoberta do detalhe (6) e pede cuidado com o gesto de descartar (5).

## 5. Teste de 5 segundos

Não foi feito com pessoas: é a minha leitura de cada resumo, escrita antes de qualquer teste, para ser conferida. A pergunta é "o que a pessoa entende do resumo do imóvel em 5 segundos?". Fica como proposta rodar com cinco pessoas nas sessões de uso que já estão no hub (tarefa "Fazer sessões de uso com pessoas em busca ativa de aluguel"): mostrar a tela por 5 segundos, esconder e perguntar "o que você viu?" e "isso é bom ou ruim para você?".

**A (topo da ficha).** A pessoa lê o nome, o endereço e o carimbo "Confirmado", e depois desce pela leitura rápida. Em 5 segundos, o provável: "é o Parque Atlântico, em Boa Viagem; sai uns R$ 6.805 por mês; o prédio é de 2016". As linhas de rua, conforto e perguntas ficam para a segunda olhada, porque a leitura é de cima para baixo. O achado ("IPTU não confere") está na quinta linha, em ferrugem: pode passar.

**B (painel).** O número do bolso ocupa um quarto da tela e é lido primeiro. Os dois pontos ferrugem (Noite e ruído; Perguntas) puxam o olho em seguida. Em 5 segundos, o provável: "uns R$ 6.805 por mês; tem alguma coisa com o barulho e com o IPTU; o resto parece bem". O nome do prédio e o endereço competem menos, porque estão em tamanho menor que o do bolso.

**O que cada um arrisca.** Na A, a pessoa pode sair sem ver o que pede atenção. Na B, pode não entender o que é cada número sem ler o rótulo pequeno ("9,2 de 10" de quê?), e "58 dB(A)" não diz se é muito para quem nunca viu decibel: a linha "estimativa, à noite" não responde isso; a resposta ("8 dB acima da referência") está na gaveta.

## 6. Medidas

Do verificador (`verificacao-a.json`, `verificacao-b.json`) e das capturas, com o app atual ao lado (`../auditoria/metricas.json`).

| Medida | App atual | A | B |
|---|---|---|---|
| Altura do imóvel aberto, em telas de 844 px | 13,7 (Destaques), 33 nas três abas | 8,0 (a folha inteira, com as 5 perguntas) | 1 (painel) |
| Palavras na primeira tela do imóvel | 2.067 na aba | 98 na primeira tela; 790 na folha inteira | 78: a primeira tela é o painel inteiro |
| Toques do imóvel aberto até a ficha de método do sossego | 1, depois de rolar 1,5 tela | 2 (leitura rápida, nota) | 2 (mostrador, nota) |
| Toques até "Ver a fonte" de um número | 1 a 2 | 1 com a seção na tela (a linha do número); 2 a partir do topo | 2 (mostrador, linha "Ver a fonte") |
| Destinos na barra de baixo | 4 (3 vazios sem imóvel) | 3 | 4 |
| Telas e estados desenhados | | 63 rotas: 16 telas, 42 aberturas de gaveta (38 gavetas) e as 5 seções da ficha | 62 rotas: 12 telas, 47 gavetas e as outras 3 páginas do painel |
| Ocorrências do verificador (toque, contraste, rótulo, dB(A) sem "estimativa", vazamento) | | 0 em 126 capturas | 0 em 124 capturas |

## 7. Recomendação

**Recomendo a B como estrutura, com o rigor da A dentro das gavetas.** Em uma frase: painel por fora, ficha por dentro.

Por quê:

1. **A queixa de origem.** O pedido começa com "não parece um aplicativo" e "tem muito texto corrido". A B responde às duas de frente; a A responde melhor a "cara própria" e a "o que cada dado significa". Juntas, cobrem as quatro.
2. **O público da primeira fase.** O recorte do hub é quem busca aluguel com duas ou mais opções concretas. Essa pessoa passa mais tempo indo de um imóvel a outro do que lendo um só a fundo. O painel com lugar fixo e deslize serve a isso; a ficha serve à hora de fechar negócio.
3. **O teste de 5 segundos.** O painel entrega o custo e os pontos de atenção de uma vez. A ficha entrega o custo e a identidade do prédio, e deixa a atenção para depois.
4. **O risco da B tem remédio conhecido**, e ele está na A: dentro de cada gaveta, usar a linha com a origem embaixo do valor, a régua, a barra "conhecido × estimativa" e o carimbo do estado. Isso já está em parte no protótipo B (toda linha tem a origem em letra menor); o que falta trazer é a barra do conhecido e o carimbo.

O que eu traria da A para a B, se for esse o caminho:
- a barra "anúncio, cadastro, estimativa" do bolso, no lugar da barra por parcela (ou as duas, uma em cada aba da gaveta);
- o carimbo no lugar do selo cinza para "estimativa", "não confere" e "trava";
- a tabela por pergunta no "Também muda" do Comparar;
- a ficha inteira como o formato do "Pacote para especialista" e da impressão.

Quando eu escolheria a A: se a prioridade for entregar em menos fatias e com menos risco (ela não pede gesto nem gaveta nova), ou se o teste com fonte ampliada e leitor de tela pesar mais que a sensação de aplicativo. A A também é a melhor base para uma versão web larga.

O que não recomendo: misturar as navegações (por exemplo, painel com índice de perguntas). As duas estruturas resolvem o mesmo problema de formas opostas; juntas, voltam a repetir.

## 8. O que cada opção pede do código (para a fase 3)

Nada foi instalado. São propostas para decidir depois da escolha.

| Item | Para quê | A | B | Recomendação |
|---|---|---|---|---|
| Gaveta do próprio app (`src/componentes/casca/Gaveta.tsx`) | detalhe, método, fonte, triagem | já serve | serve para começar; falta ter duas alturas | **Manter e estender.** Ela já tem foco, movimento reduzido e arrastar para fechar |
| `@gorhom/bottom-sheet` (+ `react-native-reanimated`, `react-native-gesture-handler`) | gaveta nativa com pontos de parada | não precisa | só se a gaveta própria não der conta das duas alturas | **Não instalar na primeira fatia.** Decidir depois do teste em celular físico |
| `react-native-reanimated` + `react-native-gesture-handler` | deslize da linha do caderno a 60 quadros | não precisa | precisa para o deslize da linha; as páginas do painel saem com `FlatList` e `pagingEnabled`, sem biblioteca | **Só na B, e só na fatia do Caderno** |
| `expo-haptics` | toque leve ao favoritar, descartar, confirmar o prédio | opcional | recomendado | **Sim, nas duas.** Custo baixo |
| `lucide-react-native` | conjunto único de ícones | não precisa | não precisa | **Não instalar.** O app já tem um conjunto coerente (Tabler, MIT, em `src/componentes/icones.ts`); os 4 ícones da barra da B saem dele |
| `expo-image` | fotos com cache | não | não | **Não.** "Foto do imóvel no cartão" está adiada no hub |
| `react-native-svg` (já instalado) | réguas, arcos, escalas, contorno do lote | sim | sim | Continua. Sem Skia nem Victory: nenhuma visualização das duas opções pede |

Base comum às duas, primeira fatia: a escala de tipo de sete degraus (12, 14, 16, 20, 28, 40, 56) e a de espaço de 4 px em `src/tema/tokens.ts`; os componentes `Numero`, `LinhaDeFicha` (nome, valor, origem), `Regua`, `Carimbo` ou `Selo`, `Mostrador` (só na B) e `FichaDeMetodo` em gaveta.

## 9. O que os protótipos não provam

- Só o Parque Atlântico tem o detalhe desenhado, nas duas opções. O aluguel (Viena) tem o topo da ficha na A e o painel na B; as gavetas e seções abertas a partir dele mostram o Parque Atlântico (ver "Limites do protótipo" em `cobertura.md`).
- Nada rodou em celular físico nem com leitor de tela. As capturas são do Chrome, em 390 × 844 e 360 × 780.
- Tema escuro não foi desenhado (os tokens escuros existem em `src/tema/tokens.ts`).
- Fonte ampliada não foi capturada. A A deve reorganizar-se sozinha; a B precisa de teste.
- Os textos das fichas de método foram encurtados a partir dos do app. Antes de implementar, cada um precisa ser conferido contra a regra de dado.
- Os números de anúncio (preço, condomínio, IPTU, área, andar) são entrada de exemplo, digitada. Tudo o que vem do cadastro e das camadas foi lido do app.
