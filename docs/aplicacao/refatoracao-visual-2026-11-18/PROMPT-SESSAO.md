# Prompt: refatoração visual da navegação principal do Vereda

Escrito em 18/11/2026 para uma sessão Claude (Fable, esforço alto). Cole a linha abaixo na sessão nova:

> Leia `docs/aplicacao/refatoracao-visual-2026-11-18/PROMPT-SESSAO.md` e execute as fases 0 e 1. Pare no portão de decisão.

---

## 1. Contexto e objetivo

O Vereda é um app Expo/React Native (com versão web via react-native-web) que ajuda quem vai alugar ou comprar no Recife a analisar um imóvel depois de ver o anúncio. Hoje a interface **não parece um aplicativo**: lembra um site genérico feito por IA, tem muito texto corrido, repete informações, não deixa claro o que cada dado significa e não é bonita nem intuitiva.

Objetivo: refazer o visual e a navegação principal para que o app seja **útil, claro, bonito e com cara própria**. Nada de "cara de IA".

**Antes de qualquer mudança em código**, entregue **2 opções muito bem elaboradas** em protótipo de alta fidelidade. O usuário escolhe (ou mistura) e só depois se implementa.

Fora do escopo: **os mapas ficam como estão** (MapLibre, mapa-base, miniaturas, gaveta do mapa). Nos protótipos, o mapa entra como captura do mapa atual.

## 2. Leia antes de começar (obrigatório)

1. `AGENTS.md` (raiz): regras do hub, método de entrega, regras de notas e avaliações.
2. Hub (MCP `enemyhub`), projeto Vereda, id `8c0a06e6-76eb-4673-a858-d2dc65d0ea81`. Use `enemyhub_get_project` com `sections: ["features"]`. A resposta passa do limite: leia o arquivo salvo em fatias com python. São 85 features; as `incluida` precisam ter lugar nas duas opções.
3. `docs/aplicacao/FEATURE-REGISTER.md`: o espelho técnico (que tela usa que código e que dado).
4. `docs/metodo/contexto-projeto.md` e `docs/metodo/fluxo-entrega.md`.
5. Código da navegação: `src/app/(abas)/_layout.tsx`, `src/componentes/casca/*` (DockInferior, CabecalhoDoApp, Gaveta, MenuRapido), `src/app/(abas)/index.tsx`, `dossie.tsx`, `comparar.tsx`, `visita.tsx`, `ler.tsx`, `predio.tsx`, `salvos.tsx`, `receber.tsx`, `src/componentes/inicio/Explorar.tsx`, `src/componentes/visual/*`, `src/dados/dossie/*`, `src/dados/fichaDeMetodo.ts`.
6. Marca: `src/tema/tokens.ts` e `motion/lib/marca.css`. **Divergência conhecida:** o `AGENTS.md` cita `index.html` na raiz como referência, mas o arquivo foi movido para `ignorar/prototipo-demonstrativo-legado/index.html`. Use os tokens como fonte e aponte a divergência ao usuário; não corrija o AGENTS.md sem ele pedir.

Confira a branch antes de cada commit: outra sessão pode trocar a branch da pasta. Para trabalho longo, use um worktree próprio.

## 3. Regras que as duas opções têm que cumprir

- **Marca:** papel `#F2EBDD`, superfície `#FFFFFF`, texto `#171717`, laranja `#F47745` (ação), ferrugem `#B94E36`, azul cadastral `#2E5A85`, sálvia e as categóricas de `tokens.ts`. Fontes: Fraunces (números e títulos), Plus Jakarta Sans (interface), JetBrains Mono (códigos, fontes, datas). Sem gradiente, glow, glassmorphism, partícula ou 3D de template.
- **Notas e avaliações:** notas 0–10 e selos só com a ficha de método de 6 campos acessível, calculadas com dado do imóvel. Sem dado, a tela diz "Sem leitura" e a nota fica fora de médias. **Proibidos:** previsão de preço, preço-alvo, ranking de bairros, adjetivo sobre bairro ("seguro", "perigoso"). Todo dB(A) vem com a palavra "estimativa".
- **Dados só no aparelho**, sem cadastro obrigatório. A origem de cada número continua a um toque ("Ver a fonte").
- **Acessibilidade:** contraste WCAG AA (texto pequeno em ferrugem usa `cor-barro-texto`), alvo de toque ≥ 44 px, funciona com fonte ampliada e leitor de tela, respeita "reduzir movimento".
- **Nenhum endereço real de pessoa** nos protótipos além dos que já estão nos dossiês de exemplo do app.

### Anti-"cara de IA" (lista de proibições, vale para protótipo e código)

- Grade de cartões iguais empilhados, com título + parágrafo + botão em cada um.
- Ícone ou emoji ao lado de todo título.
- Parágrafo explicando cada seção ("Aqui você vê…", "Esta análise mostra…").
- Frases de efeito e adjetivos vazios ("inteligente", "completo", "poderoso").
- Tudo com o mesmo peso visual; mais de uma ação principal por tela.
- Badges coloridos decorativos, sombras pesadas, cantos arredondados enormes em tudo.
- Texto de botão longo ("Ver auditoria detalhada em 10 pontos e simulador"). Rótulo de botão: até 3 palavras.

### O que fazer no lugar

- **O número primeiro.** Cada leitura é: número grande + unidade + uma linha curta de contexto (comparação com algo concreto). O detalhe e a ficha de método ficam a um toque.
- **Hierarquia por tipografia e espaço**, não por caixas. Use uma escala tipográfica com poucos degraus e uma escala de espaçamento de 4 px.
- **Revelação progressiva:** resumo → detalhe → método/fonte.
- **Microcopy de no máximo uma linha**, em linguagem leiga, sem jargão técnico na primeira camada.
- **Uma ação principal por tela**, em laranja. O resto é secundário.
- **Estados desenhados:** vazio, carregando, sem rede, sem permissão, "Sem leitura", erro.

## 4. Metodologias a aplicar

- **Top tasks / Jobs to be done:** liste as perguntas reais de quem procura imóvel e ordene por importância. Ponto de partida: *Cabe no meu bolso? O prédio é confiável? Como é a rua de dia e de noite? Barulho, calor, alagamento? O que perguntar ao corretor? Qual dos dois é melhor para mim?* A navegação nasce dessa lista, não das features.
- **Princípios de *Refactoring UI*** (Wathan & Schoger): hierarquia por peso e cor antes de tamanho, tirar ênfase do secundário, menos bordas, mais espaço, paleta de cinzas quentes derivada do papel.
- **Tufte, razão dado-tinta:** gráficos sem moldura nem grade decorativa; small multiples para comparar; sparklines e réguas em vez de gráficos de pizza.
- **Padrões nativos de mobile** (Apple HIG e Material 3): barra de abas com no máximo 4–5 destinos, gaveta que sobe de baixo (bottom sheet) para detalhe, gestos de deslizar, polegar alcançando a ação principal.
- **Avaliação:** 10 heurísticas de Nielsen em cada opção e um "teste de 5 segundos" escrito (o que a pessoa entende do resumo do Dossiê em 5 s?).

## 5. Ferramentas e bibliotecas

**Para os protótipos (fase 1):** HTML + CSS puros com os tokens da marca em variáveis CSS, fontes do Google Fonts e JS mínimo para navegar entre telas e abrir gavetas. Moldura de 390 × 844. Capturas com o **Playwright**, que já está no `package.json` da raiz (pode reaproveitar padrões de `motion/render.mjs`). **Não publique página no claude.ai**: tudo fica em arquivo local.

**Para a implementação (fase 3), propor ao usuário, justificando cada uma; nenhuma é instalada antes da aprovação:**

| Biblioteca | Para quê | Quando faz sentido |
|---|---|---|
| `react-native-reanimated` + `react-native-gesture-handler` | transições e gestos a 60 fps (deslizar entre imóveis, gaveta) | se a opção escolhida usa gestos ou gavetas |
| `@gorhom/bottom-sheet` | gaveta nativa com pontos de parada e acessibilidade | se o detalhe abre em gaveta |
| `expo-haptics` | retorno tátil leve ao favoritar, descartar ou confirmar o prédio | baixo custo, melhora a sensação de app |
| `lucide-react-native` (sobre o `react-native-svg` já instalado) | um conjunto único e coerente de ícones no lugar dos SVGs soltos de hoje | se a opção usa ícones; usar com moderação |
| `expo-image` | imagens com cache e transição | só se fotos entrarem em tela (hoje "Foto do imóvel no cartão" está adiada) |

Gráficos continuam em `react-native-svg` (já instalado). Skia ou Victory só se uma visualização da opção escolhida realmente precisar, com justificativa.

**Skills do repositório** (`.agents/skills/ui-ux-pro-max`, `design`, `design-system`, `ui-styling`): use como apoio, mas a seção 3 tem prioridade sobre qualquer padrão sugerido por elas.

**Referências de qualidade** (estudar o padrão, nunca copiar marca, cor ou fonte): Apple Tempo (mostradores de leitura rápida), Things 3 (hierarquia tipográfica e calma), fichas técnicas e plantas cadastrais (linguagem de cadastro), relatórios de inspeção predial, apps de banco brasileiros bem avaliados (clareza de números financeiros).

## 6. Fases

### Fase 0: auditoria (sem mexer em código)

1. Suba o app na web (`npm run web`) e capture com o Playwright, a 390 px, todas as telas da navegação principal com um dossiê de exemplo carregado: Explorar (vazia, buscando, com resultados), Dossiê (topo e rolado), Comparar, Visita, Salvos, Ler, Prédio.
2. Monte o inventário por tela: dados exibidos, contagem aproximada de palavras, repetições entre telas, ações e qual delas é a principal.
3. Monte a matriz **pergunta do usuário → dados que a respondem → feature do hub → tela atual**.
4. Escolha o dossiê de exemplo **que deixa o protótipo mais rico e bonito** (mais dados com leitura, e pelo menos um caso de "Sem leitura" para mostrar o estado).

Entregue em `docs/aplicacao/refatoracao-visual-2026-11-18/auditoria/`: as capturas, `auditoria.md` com o inventário, a matriz e os 10 piores problemas, cada um com captura.

### Fase 1: duas opções em alta fidelidade

As opções têm liberdade total para mudar **a navegação** (número e nome das abas, o que vira gaveta, o que sai do menu, o fluxo de entrada pelo link do anúncio) conforme o que mais importa para o usuário. Elas têm que ser **realmente diferentes** entre si, no visual e na estrutura. Hipóteses de partida, que você pode substituir por outras melhores:

- **A: "Ficha de campo"**, com linguagem de cadastro e caderno: números grandes em Fraunces, linhas de ficha técnica em vez de cartões, réguas, carimbos discretos, mono para fontes e datas. Dossiê como uma folha única com índice fixo das perguntas.
- **B: "Painel de bolso"**, mais nativo: tela-resumo com 5–6 mostradores (bolso, prédio, rua, noite e ruído, calor, alagamento), cada um com número e uma linha, detalhe em gaveta, deslizar entre imóveis, Comparar como duelo lado a lado.

Cada opção cobre no mínimo:
- barra de navegação e cabeçalho;
- entrada: colar link, buscar prédio ou rua, usar localização (vazia, buscando, resultados, sem permissão);
- resumo do imóvel (Dossiê) e um detalhe aberto **com a ficha de método de 6 campos** e "Ver a fonte";
- uma nota 0–10 com ficha, uma leitura "Sem leitura" e um dB(A) com "estimativa";
- bolso (entrada, mensal, 10 anos) e custo mensal por parcelas;
- Comparar dois imóveis;
- Visita (roteiro e sensores);
- triagem do cartão (favoritar, anotar, descartar, etapas) e o caderno/salvos;
- um estado de erro ou sem rede.

Entregáveis em `docs/aplicacao/refatoracao-visual-2026-11-18/prototipos/`:
- `opcao-a/index.html` e `opcao-b/index.html`, clicáveis;
- `folha-de-contato-a.png` e `folha-de-contato-b.png` com todas as telas, mais capturas a 360 px;
- `cobertura.md`: tabela de **cada feature `incluida` do hub → onde aparece em A → onde aparece em B** (ou "fora da navegação principal, acessível por…"). Nenhuma feature pode sumir sem estar listada;
- `comparativo.md`: o argumento de cada opção, prós e contras, avaliação pelas heurísticas de Nielsen, o teste de 5 segundos e **sua recomendação**, com o porquê.

**Revisão obrigatória:** faça pelo menos 2 rodadas de autocrítica olhando as capturas (não o código). Em cada rodada, corrija os 3 piores problemas de cada opção e registre-os em `prototipos/revisao.md`. Confira de propósito, em cada tela, se algum item da lista anti-"cara de IA" escapou.

### Portão de decisão: pare aqui

Mostre ao usuário as folhas de contato, os caminhos dos HTML, o comparativo e a sua recomendação. **A escolha é do usuário.** Não presuma aprovação por silêncio nem por revisão de outro agente.

Junto, proponha o registro no hub e peça confirmação antes de gravar (com o `updatedAt` lido; se der 409, releia e refaça):
- feature nova "Refatoração visual da navegação principal", `em_aberto`, sem justificativa inventada (relacionar à "Frente visual", que também está `em_aberto`);
- tarefa no quadro "Macro" com os critérios de aceite.

### Fase 2: depois da escolha (só com aprovação)

Siga `.agents/skills/entregar-task`: plano e especificação em `docs/planos/F-xxxxxxxx-refatoracao-visual/` a partir dos modelos em `docs/metodo/templates/`, com a aprovação técnica registrada antes de implementar.

### Fase 3: implementação em fatias

1. Base do design: escala tipográfica e de espaçamento em `src/tema/tokens.ts`, componentes base (por exemplo `Numero`, `LinhaDeFicha`, `Mostrador`, `Gaveta`, `Chip`), bibliotecas aprovadas.
2. Barra de navegação e cabeçalho, depois Explorar, Dossiê, Comparar, Visita. **Um PR por fatia**, branch `feat/T-xxxxxxxx-nome-curto` a partir de `main`.
3. Mapas intocados. Toda regra de dados mantida (testes existentes devem continuar passando).
4. Cada fatia: `npm run verificar`, capturas antes/depois a 360 e 390 px, `validacao.md` com o que rodou, o que falhou e o que não rodou (celular físico, leitor de tela), seção "Hub" do modelo de PR preenchida.

## 7. Critérios de pronto da fase 1

- Duas opções clicáveis, diferentes entre si na estrutura e no visual, ambas dentro da marca.
- `cobertura.md` sem nenhuma feature `incluida` sem destino.
- Nenhum parágrafo explicativo na primeira camada de nenhuma tela; nenhum rótulo de botão com mais de 3 palavras.
- Regras de nota, "Sem leitura", "estimativa" e ficha de método visíveis nos protótipos.
- Duas rodadas de revisão registradas.
- Nenhuma alteração em `src/` e nada gravado no hub sem confirmação.
