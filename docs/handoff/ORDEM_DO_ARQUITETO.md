# ORDEM DO ARQUITETO: VEREDA v1.0

**Versão 2, 19/10/2026, 21h. Revisão 2.1, 21h30: nova Fatia 2B (leitura automática da página no celular), entre a 2 e a 3.** Autor: Agente Arquiteto. Destinatário: Agente Operário (externo).
**Substitui** a ordem de 19/10/2026 20h48, arquivada em [`historico/ORDEM_2026-10-19_2048_anterior.md`](historico/ORDEM_2026-10-19_2048_anterior.md). Onde as duas divergirem, vale esta.

Leia esta ordem inteira antes de editar qualquer arquivo. Leia também [`../V1-ESCOPO-E-VIABILIDADE.md`](../V1-ESCOPO-E-VIABILIDADE.md) (o porquê de cada decisão) e [`../../src/dados/contratos.ts`](../../src/dados/contratos.ts) (os tipos que você implementa).

**Revisão 2.2, 20/10/2026, 11h:** auditoria das Fatias 0 a 2B. Faça as correções da seção "Correções C1–C6" logo abaixo **antes** de começar a Fatia 3.

**Revisão 2.3, 20/10/2026, 12h:** checagem das bases da Fatia 3 pelo arquiteto. A Fatia 3 foi reescrita nos itens 1 a 9, na busca e no aceite; o contrato mudou em `esquemaObra`, `obras150m`, `IndiceDoBairro.obras` e `Edificio.nome`. Leia a seção C7 antes de rodar o script de novo.

**Revisão 2.4, 20/10/2026, 14h:** a partir daqui os operários são agentes orquestrados pelo arquiteto (o operário externo foi dispensado). Decisões da auditoria da Onda 1, já repassadas aos agentes:
- Licenças de obra: só valem as que não estão indeferidas, canceladas, arquivadas, desistidas ou extintas; repetições do mesmo lote, categoria e mês contam uma vez.
- IPTU sem coordenada: o prédio é agrupado mesmo assim; o centro vem das unidades com coordenada ou, sem nenhuma, do lote achado pelo endereço (`NMENDCOMP`, lido só para casar).
- Bairro na revisão: seletor dos 94 bairros oficiais mais "Fora do Recife"; o bairro escolhido decide a cobertura.
- Verificação anti-robô: só pelo título da página ou pela presença do desafio do Cloudflare; a palavra "verifique" deixou de contar.
- Texto pequeno que seria laranja sobre fundo claro usa ferrugem `#B94E36` (contraste); o laranja fica em preenchimentos, ícones e traços.
- Títulos de anomalia vêm de `src/dados/anomalias.ts` (arquiteto), em tom neutro.
- Seguro incêndio desconhecido no aluguel vira pergunta; IPTU mediano zero no cadastro não vira achado (isenção é do contribuinte).
- A busca do prédio reconhece os quatro prefixos de via do cadastro: RUA, AV, EST e PRC.

**Revisão 2.5, 20/10/2026, 17h:** inspeção visual do arquiteto (fluxo completo com o prédio real Estrada do Encanamento, 719, em Casa Forte):
- **ITBI por m² saiu.** A `area_construida` do ITBI inclui área comum (66,7 m² privativos no IPTU aparecem como 109,84 m² no ITBI), então o R$/m² do ITBI fazia todo anúncio parecer 60% a 150% acima. Agora `Edificio.itbi.valorUnidade` guarda o valor total por unidade (36 meses) e `ContextoDoBairro.itbiValorM2` deixou de existir. Na compra, a posição só aparece em prédio de tipologia única (todas as áreas a até 3% da mediana): preço do anúncio contra o valor por unidade. Nos demais, só o histórico, sem percentual. No aluguel continua a comparação com as análises da própria pessoa.
- **Números em destaque** (medida do achado, "6 a conferir", "6 pontos para conferir") em Fraunces 500, como em `index.html`; preços em tabela, valores e chave cadastral em JetBrains Mono.
- **Endereço** formatado só por `src/dados/recife/endereco.ts` (arquiteto): "EST DO ENCANAMENTO" vira "Estrada do Encanamento" em todas as telas.
- **Índice depois das correções:** 1.879 prédios em Boa Viagem, 82 em Casa Forte, 291 em Graças, 156 em Espinheiro e 280 em Madalena (2.688 no total). A tabela de C7 vale como piso.

Execute as fatias **na ordem**: 0, 1, 2, 2B, 3, 4, 5, 6. Ao fim de cada fatia, rode as verificações dela e acrescente uma seção ao [`RELATORIO_DO_OPERARIO.md`](RELATORIO_DO_OPERARIO.md). Não comece a fatia seguinte com a anterior falhando.

---

## Correções C1–C6: auditoria das Fatias 0 a 2B (20/10/2026)

Conferido pelo arquiteto contra o código, as fixtures e as capturas em `out/v1/`. `npm run verificar` verde (71 testes). Fixtures intactas. Os testes das Fatias 1 e 2B conferem as fixtures de forma fiel. A casca (Fatia 0) está próxima do protótipo. As falhas abaixo passaram porque nenhum teste cobria a regra.

### C1. Total mensal quebra três regras centrais (grave)

`src/app/(abas)/index.tsx`, linhas 195–203: o "Total" do cartão (a) soma valores com `aConfirmar: true`; (b) soma IPTU com período `desconhecido` como se fosse mensal; (c) em **compra, soma o preço do imóvel às despesas mensais**. A captura `out/v1/fatia-2/explorar-com-analise-salva-375.png` mostra R$ 5.978 onde o certo é R$ 5.690 (4.500 + 1.190) com "2 a confirmar" (IPTU sem período e seguro incêndio desconhecido; `src/dados/custos.ts` já existe, escrito pelo arquiteto).

Correção:
- `src/dados/custos.ts`: `export function custoMensal(a: AnaliseV2): VisaoDoDossie["custo"] & { pendentes: number }`, com exatamente as regras do item 1 da Fatia 4 (antecipadas para cá). `pendentes` = parcelas `a_confirmar` + `desconhecido`. Nenhum cálculo de custo fora desta função: o cartão do Explorar, o Comparar e o `derivarDossie` da Fatia 4 a usam.
- Cartão do Explorar: aluguel → "Anúncio: R$ X/mês", "Total conhecido: R$ Y/mês" e a etiqueta "+R$ Z além do aluguel"; compra → "Preço: R$ X" e "Mensal conhecido: R$ Y"; com `pendentes > 0`, etiqueta extra "{n} a confirmar".
- Mova a montagem do formulário de revisão a partir da extração (hoje `criarFormDeExtracao`, dentro de `ler.tsx`) para uma função pura em `src/dados/`, e teste que todo campo com anomalia nasce com `aConfirmar: true`.
- `tests/custos.test.ts`: compra nunca soma o preço; IPTU `desconhecido` fica fora e conta como pendente; `aConfirmar` fica fora; `null` fica fora e conta como pendente; zero digitado pela pessoa (`origem: "voce"`, `aConfirmar: false`) entra como 0; IPTU anual entra ÷ 12.
- Refaça a captura: o cartão do fluxo da Fatia 2 tem de mostrar R$ 5.690 e "2 a confirmar".

### C2. A leitura da página pode travar a pessoa (grave)

`src/componentes/leitor/LeitorDePagina.tsx` e `src/app/(abas)/ler.tsx`:
- O teste de verificação inclui `verifique`, palavra comum em anúncios ("verifique a disponibilidade"). Quando casa, a mensagem é descartada mesmo trazendo o anúncio inteiro.
- O efeito dos temporizadores depende de `aoFalhar`, que `ler.tsx` passa como função nova a cada renderização: o prazo de 20 s recomeça a cada renderização. Quando `emVerificacao` muda, a limpeza do efeito cancela o prazo de 120 s sem zerar a referência, então ele nunca é recriado. Em verificação, não há prazo nenhum.
- Não existe "Prefiro colar o texto" enquanto a página carrega. Somado aos dois itens acima, a pessoa fica presa no quadro sem saída além de "Cancelar".

Correção:
- `src/componentes/leitor/decidir.ts`, pura: `export function proximoEstado(estado: EstadoDoLeitor, evento: EventoDoLeitor): EstadoDoLeitor`. Estados: `carregando`, `verificando`, `lido`, `falhou` (com motivo). Eventos: `mensagem` (leituras + `verificacao`), `prazo_20s`, `prazo_120s`, `erro`. Regras: mensagem que rende preço ou área → `lido`, **mesmo com `verificacao`**; `verificacao` sem dados → `verificando`; `prazo_20s` só derruba `carregando`; `prazo_120s` derruba `verificando`.
- O componente agenda os dois prazos uma vez (efeito sem dependências, `aoLer` e `aoFalhar` guardados em `useRef`) e só despacha eventos para `proximoEstado`.
- Link "Prefiro colar o texto" visível embaixo da página desde o primeiro instante; ele abre o cartão de colar texto sem fechar a página.
- Página dentro do cartão "Lendo o anúncio no aparelho", como diz a Fatia 2B, em vez de solta acima dele.
- `tests/leitor-decidir.test.ts` cobre as cinco transições acima.

### C3. Relatório da 2B afirma o que não foi testado

A tabela de aparelho diz "Estado lido com sucesso" (QuintoAndar), "aciona challenges.cloudflare.com" (ZAP), "initial-data e JSON-LD lidos" (OLX), mas a coluna Android diz "simulado via testes unitários" e esta máquina não tem emulador Android (`adb` e `emulator` ausentes). Reescreva: Android e iOS = "não verificado: sem emulador nesta máquina; para o humano"; Resultado = "não verificado". O teste unitário verifica o parser, não o portal.

### C4. Arquivos que deviam ter saído na Fatia 1

`src/dados/extrator-anuncio.ts` e `tests/extrator-anuncio.test.ts` continuam no repositório. Remova-os.

### C5. Diferenças visuais com `index.html`

- Títulos em Fraunces 500, não em Plus Jakarta: "Auditar novo anúncio" (`.scanner-card`), "Análises Recentes" (`.saved-section-header`, 1576 em diante), título do cartão do imóvel (`.vereda-home-card`).
- Topo 16:10 do cartão sem prédio confirmado: o padrão `.arch-grid-pattern` (linha 81: linhas de 1 px em `rgba(127,136,112,0.11)` a cada 24 px) tem de aparecer; hoje o quadro está liso. Desenhe com `react-native-svg`.
- "Gerar Dossiê" com a seta depois do rótulo, como no protótipo.
- Faixa de diagnóstico: "Visita técnica" não existe em lugar nenhum da ordem. Até a Fatia 4, o ponto ferrugem mostra o título da primeira anomalia (ex.: "IPTU sem periodicidade") ou some.
- Checklist da leitura: cada linha numa caixa creme com borda, como em `index.html` (CSS 2144–2192).
- Campos de texto com `fontFamily` Plus Jakarta Sans (hoje caem na fonte do sistema).
- Nome dos portais como as marcas escrevem: "ZAP Imóveis", "VivaReal", "QuintoAndar", "OLX".

### C6. Aceite das correções

- [ ] `tests/custos.test.ts` e `tests/leitor-decidir.test.ts` verdes; `npm run verificar` verde.
- [ ] Captura nova do Explorar com R$ 5.690 e "2 a confirmar"; capturas novas de Explorar e Leitura a 375 e 1280 com C5 aplicado.
- [ ] Tabela da 2B reescrita como em C3.
- [ ] Seção "Correções C1–C6" no relatório, com a saída literal.

### C7. O índice gerado em 20/10 às 08h15 está truncado

`meta.json` registra 2.500 registros de IPTU (5 bairros × 500), 500 de Licenciamento e 0 de Lotes; Boa Viagem tem 4 edifícios e Graças 8. O portal devolve no máximo 500 linhas por requisição. Sua paginação de 11h04 já lê o limite ecoado e vai até o `total`, o que está certo, mas nada impedia aceitar o índice truncado. Apague os seis JSONs, gere de novo com a Fatia 3 revisada abaixo e confira contra esta tabela, medida pelo arquiteto em 20/10/2026 com as mesmas regras:

| Bairro | Registros de IPTU (todas as grafias) | Edifícios com 2+ apartamentos residenciais, com número e coordenada |
|---|---|---|
| Boa Viagem | 71.237 | 1.818 |
| Casa Forte | 3.247 | 78 |
| Graças | 11.373 ("Gracas" 11.327 + "Graças" 46) | 283 |
| Espinheiro | 6.533 | 154 |
| Madalena | 12.805 | 214 |

Outras referências: Licenciamento com `categoria_empreendimento = "Obra"`, 39.067 registros; Lotes, 114.079 feições; em Graças, 100% dos edifícios caem num lote, 87% têm `NMEDIFICACAO`, 100% têm `QTDPAVIMENTOS`; ITBI de apartamentos em Graças casa com edifício do IPTU em 95% (2026) a 100% (2020). Diferença maior que 5% em qualquer contagem: pare e investigue antes de seguir.

---

## 0. Reconciliação com o trabalho já feito (fazer primeiro)

### Auditoria do relatório de 19/10/2026, 21h00: Época 3 **não aprovada**

Conferido pelo arquiteto às 21h05 contra o código:

| O relatório afirma | O que o código mostra |
|---|---|
| "DSQFL oficial de 14 dígitos" | Os 12 registros de `CADASTRO_RECIFE_LOCAL` têm 16 dígitos (ex.: `06.1780.0412.02.0327`). Não vêm do cadastro; foram escritos à mão a partir dos dossiês de demonstração |
| "vínculo direto a lotes cadastrais reais" | `consultarCadastroLocal` devolve `bairro_amostra` com `encontrado: true` para qualquer anúncio de bairro coberto sem endereço: o imóvel da pessoa recebe o primeiro prédio inventado do bairro. É o redirecionamento cego que a Época 3 devia eliminar |
| "Consulta CKAN com fallback gracioso" | No Expo Web a consulta é sempre bloqueada por CORS; o fallback esconde isso e entrega o dado inventado |
| `npm run verificar` verde, 34 testes | Confirmado verde. Mas os testes conferem os dados inventados, então verde não prova o vínculo real |

O que se aproveita: as expressões do extrator, a ideia de auditoria de valores de fachada e a casca do fluxo de leitura. O resto segue abaixo.

Você já começou pela ordem anterior. Faça isto antes da Fatia 0:

1. **`src/dados/servico-cadastral-recife.ts`: remova `CADASTRO_RECIFE_LOCAL` e tudo que o usa para mostrar dados.** Os registros foram escritos à mão, os DSQFL têm 16 dígitos (o formato real tem 14: `D SSSS QQQ FF LLLL`, ex.: `61755015020005`) e estão rotulados como `cadastro_oficial_local`. Isso é dado inventado com aparência de cadastro oficial, que é exatamente o que o produto não pode fazer. O índice real sai do script da Fatia 3. Apague o arquivo inteiro ao fim da Fatia 3, quando `src/dados/recife/indice.ts` o substituir.
2. **Não consulte a API CKAN a partir do app.** Ela não envia `Access-Control-Allow-Origin` (testado em 19/10/2026): no Expo Web o navegador bloqueia. Na v1.0 o app só lê o índice local gerado. Remova `resolverCadastroRecife` e o `fetch` com timeout.
3. **`src/dados/extrator-anuncio.ts`:** aproveite as expressões que funcionam, mas a API passa a ser a da Fatia 1, com os tipos de `contratos.ts`. `BAIRROS_PILOTO_RECIFE` e `OUTROS_BAIRROS_RECIFE` dão lugar a `src/dados/recife/bairros.ts` (lista oficial dos 94 bairros). Ao fim da Fatia 1 este arquivo deixa de existir.
4. **`tests/extrator-anuncio.test.ts` e `tests/servico-cadastral.test.ts`:** substitua pelos testes da Fatia 1, guiados pelas fixtures. Testes que dependem de `CADASTRO_RECIFE_LOCAL` saem.
5. **`src/dados/analise.ts`:** deixe o esquema v1 como está (com os opcionais que você acrescentou). Ele passa a ser só formato de leitura para migração; depois da Fatia 2 nada grava v1.
6. **`src/app/ler.tsx`, `src/app/analise.tsx`, `src/app/index.tsx`:** serão refeitos nas Fatias 0 a 2. Não invista mais neles na forma atual. Deixe a árvore compilando (`npm run verificar` verde) e registre no relatório o estado em que parou.

---

## 1. Regras que valem para todas as fatias

### 1.1 Design: `index.html` é a única referência

Antes de codificar uma tela, abra `index.html` nas linhas indicadas na fatia e reproduza composição, hierarquia, espaçamento, raios, bordas, tipografia e textos de interface. Para abrir o protótipo: `node motion/serve.mjs 4180` e `http://127.0.0.1:4180/index.html`.

| Tema | Onde em `index.html` | Regra no app |
|---|---|---|
| Tokens de cor e fonte | `:root`, linhas 13–52 | Copie os valores; não invente cor |
| Superfícies | `.ed-card` 1922, `.ed-cream-box` 1937, `.ed-btn-secondary` 2062–2090 | Cartão `#FFFFFF`, caixa creme `#FAF7F0`, borda 1px `rgba(23,23,23,0.08)` ou `#E2D9C8`. Sem sombra difusa de SaaS |
| Ação | `.btn-scanner-primary` 1544–1575 | Laranja `#F47745`, cantos, altura, peso e sombra iguais ao protótipo. **Única adaptação registrada:** texto `#171717` em vez de branco, porque branco sobre esse laranja tem contraste 2,77 (reprova WCAG AA) e tinta tem 6,46 |
| Texto de apoio | `#view-dossier { --ds-muted: #625C51 }` 2707 | Use `#625C51` para texto secundário (contraste ≥ 4,5 sobre o papel) |
| Números | `.mono-num` 75 | JetBrains Mono, `fontVariant: ["tabular-nums"]` em preços, áreas, contagens, chave cadastral |
| Títulos | `--font-display`, `--title-weight: 500`, `--title-tracking: -0.02em` | Fraunces 500 |
| Movimento | `@media (prefers-reduced-motion)` 2702 | Sem animação quando a pessoa pede movimento reduzido |

Telas sem equivalente direto (revisão da extração, busca por endereço) são compostas só com `.ed-card`, `.ed-cream-box`, `.filter-segmented-pill`, `.ed-btn-secondary` e `.btn-scanner-primary`.

### 1.2 Dados

- **Nenhum dado com aparência oficial que não venha do script da Fatia 3.** Fixtures de teste ficam em `tests/` e nunca são importadas por `src/`.
- Ausente, "Não informado", valor de fachada ou período desconhecido **nunca vira zero**. Vira `null` ou `aConfirmar: true`, fica fora de toda soma, mostra "A confirmar" e gera pergunta.
- Preço de compra nunca entra em total mensal.
- Sem nota, estrela, selo, "melhor opção", nem adjetivo de julgamento. Teste automático (Fatia 4) proíbe nos textos gerados: `perigos`, `vale a pena`, `caro`, `barat`, `caixão`, `ótim`, `ruim`, `arriscad`, e `seguro` fora de "seguro incêndio" e "seguro fiança".
- Sem raspagem de portal: nenhum `fetch` de página de anúncio, nem no app nem em servidor; sem contornar Cloudflare ou CAPTCHA. A única forma de ler a página é a da Fatia 2B: a página que a pessoa pediu, aberta à vista dela na WebView do celular.
- Colunas proibidas nas bases da Prefeitura (nunca peça à API, nunca grave): `Número do contribuinte`, `CPF/CNPJ mascarado do contribuinte`, `tipo de contribuinte`, `complemento`, `Regime de Tributação do iptu`, `Regime de Tributação da trsd`, `cnpj`, `razao_social`, `razao_social_mercantil`, `inscricao_mercantil`, `endereco_empreendimento`.

### 1.3 Código

- Contratos em `src/dados/contratos.ts` e bairros em `src/dados/recife/bairros.ts` são do arquiteto: **não edite**. Se precisar mudar algo, pare e descreva no relatório.
- Também não edite: `index.html`, `docs/mock/`, `motion/`, `motion-references/`, `refs/`, `AGENTS.md`, docs de motion, `tests/fixtures/*.json`.
- Nenhuma dependência nova no `package.json` sem ordem. Única autorizada: `react-native-webview` 13.16.1, instalada com `npx expo install react-native-webview` na Fatia 2B. O script de dados usa só Node ≥ 20 (`fetch`, `fs`, `zlib`).
- Funções de domínio são puras: recebem `agora: Date` quando precisam de tempo; nada de `Date.now()` dentro delas.
- Português do Brasil em nomes e textos, como o resto de `src/`.
- Não faça commit, push nem deploy. O humano decide.

### 1.4 Verificação de cada fatia

1. `npm run verificar` (tsc, lint, jest) verde.
2. Os testes novos da fatia passando.
3. Capturas em `out/v1/fatia-N/` a 375×812 e 1280×900 de cada tela tocada (Playwright já está nas devDependencies), comparadas com o trecho correspondente de `index.html` no mesmo tamanho.
4. Seção no relatório: comandos e saída literal, arquivos criados/alterados/removidos, tabela de paridade (tela × seletor de `index.html` × diferenças restantes), bloqueios.

---

## Fatia 0: casca do app

**Objetivo verificável:** em qualquer tela, cabeçalho com marca e pílula de créditos no topo e dock de quatro abas embaixo, como em `index.html`; tema claro de papel; sem fontes Archivo.

**Referência:** `.top-header-minimal` 1256–1300; `.brand-lockup` e SVG do ninho no HTML 3199–3213; `.brand-wordmark-arch` 1277; `.credits-pill-btn` 2380–2409; `.mobile-menu-popover` 1357–1400 e HTML 3215–3258; `.bottom-dock` e `.dock-item` 884–930 e HTML 3300–3330; gaveta `.drawer-panel` 864 e 2263–2300 com `.sheet-handle` 2288; `showToast` 4243.

**Arquivos:**

- `app.json`: `userInterfaceStyle: "light"`; `backgroundColor` e splash `#F2EBDD`; remova a variante escura do splash.
- `src/tema/tokens.ts`: alinhe `CORES_CLARO` a `:root` (papel `#F2EBDD`, papel claro `#FAF6EE`, creme `#FAF7F0`, sutil `#E7DEC9`, linha `#E2D9C8`, linha forte `#C9BEA8`, texto `#171717`, apoio `#625C51`, laranja `#F47745`, laranja hover `#E06332`, ferrugem `#B94E36` e suave `#F9EBE8`, sálvia `#7F8870`, sálvia escura `#3A5230` e suave `#EBF2E8`, azul cadastral `#2E5A85` e suave `#EBF1F8`, campo `#141413` com texto `#FAF7F0`). Crie os nomes de token que faltarem no padrão existente (`cor-…`). Remova as cinco fontes Archivo de `FONTES` e todo uso.
- `src/tema/Tema.tsx`: sempre claro; tire a dependência do esquema de cor do sistema. `CORES_ESCURO` só se for usado pelo painel de campo; senão, remova.
- Novos em `src/componentes/casca/`: `CabecalhoDoApp.tsx` (marca que volta a Explorar, pílula "N créditos" que abre Créditos, botão de menu), `MenuRapido.tsx` (itens: Início, Minhas análises, Dossiês de exemplo, Carteira de créditos, Sobre os dados), `DockInferior.tsx` (Explorar, Dossiê, Comparar, Visita, com os ícones SVG do HTML 3300–3330 e o traço laranja do item ativo), `Gaveta.tsx` (reaproveite `src/componentes/Folha.tsx`, com `sheet-handle`, fecha com Esc e arraste) e `Aviso.tsx` (toast).
- Rotas (use `git mv` para preservar histórico):
  - `src/app/(abas)/_layout.tsx`: `Tabs` do expo-router com `tabBar` = `DockInferior` e `header` = `CabecalhoDoApp`. Abas visíveis: `index` (Explorar), `dossie`, `comparar`, `visita`. Ocultas (`href: null`), com o item do dock que as "possui": `ler` e `predio` → Explorar; `salvos` → Comparar.
  - `src/app/index.tsx` → `src/app/(abas)/index.tsx`; `src/app/comparar.tsx` → `src/app/(abas)/comparar.tsx`; `src/app/analises.tsx` → `src/app/(abas)/salvos.tsx`; `src/app/ler.tsx` → `src/app/(abas)/ler.tsx`.
  - Dossiês estáticos: `src/app/dossie/[id]/**` → `src/app/exemplos/[id]/**`; atualize todos os `pathname` (as rotas tipadas fazem o `tsc` apontar cada um).
  - `src/app/(abas)/dossie.tsx` e `src/app/(abas)/visita.tsx`: nesta fatia, só o estado vazio ("Nenhum dossiê aberto. Cole um link em Explorar." com botão para Explorar).
  - `src/app/_layout.tsx`: `Stack` com `(abas)`, `exemplos/[id]`, `editar` e as gavetas (`creditos`, `sobre-os-dados`) como modais.

**Aceite:**
- [ ] Dock visível e funcional nas quatro abas, a 375 px e a 1280 px; item ativo em laranja.
- [ ] Marca "VEREDA" em Fraunces com espaçamento largo e ninho laranja, como em `index.html`.
- [ ] Pílula de créditos abre a gaveta de Créditos; menu abre e fecha (Esc fecha na web).
- [ ] `grep -r Archivo src` vazio.
- [ ] Os cinco dossiês de exemplo abrem em `/exemplos/<id>`.
- [ ] `npm run verificar` verde.

---

## Fatia 1: leitura do anúncio (motor puro)

**Objetivo verificável:** todas as fixtures de `tests/fixtures/anuncios-url.json` e `tests/fixtures/anuncios-texto.json` passam.

**Arquivos:**

- `src/dados/extrator/url.ts`: `export function extrairDaUrl(url: string): LeituraParcial | { erro: "url_invalida" }`
- `src/dados/extrator/texto.ts`: `export function extrairDoTexto(conteudo: string, portal: Portal): LeituraParcial[]` (devolve a leitura `json_ld` primeiro, se houver JSON-LD válido, e sempre uma leitura `texto`, mesmo vazia)
- `src/dados/extrator/montar.ts`: `export function montarExtracao(url: string, leituras: LeituraParcial[], agora: Date): ExtracaoAnuncio`
- `src/dados/extrator/bairro.ts`: normalização e busca de bairro (abaixo)
- `src/dados/extrator/index.ts`: reexporta as três funções públicas
- `tests/extrator-url.test.ts` e `tests/extrator-texto.test.ts`: iteram as fixtures (`it.each`), conferindo só as chaves de `esperado`; `invalidas` devolvem `{ erro: "url_invalida" }`
- Remova `src/dados/extrator-anuncio.ts` e `tests/extrator-anuncio.test.ts`.

### Regras da Camada A (URL)

1. Valide com `urlValida` de `src/dados/analise.ts`. Descarte query e fragmento; decodifique `%`; caminho em minúsculas.
2. Portal pelo host: `zapimoveis.com.br` → `zap`; `vivareal.com.br` → `vivareal`; `quintoandar.com.br` → `quintoandar`; `*.olx.com.br` → `olx`; qualquer outro → `outro`, com todos os campos nulos e `idNoPortal: null` (não adivinhe nada em portal desconhecido).
3. Padrões (o slug é o último segmento do caminho, salvo no QuintoAndar):
   - **VivaReal** `/imovel/{tipologia}-{n}-quarto(s)-{bairro}-bairros-{cidade}[-com-…]-{area}m2-{venda|aluguel}-RS{preco}-id-{id}/`. `venda` → `compra`. Como o caminho já está em minúsculas, o preço casa com `-rs(\d+)-id-`.
   - **ZAP** `/imovel/{aluguel|venda}-{tipologia}-{n}-quarto(s)[-com-…]-{bairro}-{cidade}-{uf}[-{area}m2]-id-{id}/`.
   - **QuintoAndar** `/imovel/{id}/{alugar|comprar}/{tipologia}-{n}-quarto(s)-{resto}`. Se `resto` termina em `-recife`, o que vem antes é o bairro. Senão, `bairroTexto = resto`, `bairro` e `cidade` nulos (outra cidade).
   - **OLX** `/…/imoveis/{titulo}-{id}`, id = dígitos finais (9 ou mais). Modalidade: `a-venda`, `venda`, `vender`, `vendo` → compra; `alugar`, `aluguel`, `alugo`, `aluga` → aluguel; as duas presentes → `null`. Depois de `-no-` ou `-na-`: se o trecho começa com `rua-`, `avenida-`, `av-`, `travessa-`, `estrada-`, `praca-`, `alameda-` → `logradouro` até o bairro; se começa com `condominio-do-edificio-`, `edificio-`, `condominio-`, `residencial-` → tire o prefixo e use como `nomeEdificio`; se o trecho é um bairro → é o bairro; senão → `nomeEdificio`. Área: `-(\d+)-m-` ou `(\d+)m2`. Suítes: `(\d+)-suites?`.
4. Comuns: quartos `(\d+)-quartos?`; tipologia pela primeira ocorrência de `apartamento|cobertura|flat|kitnet|casa`; comodidades, na ordem em que aparecem e sem repetir: `piscina`, `garagem`, `churrasqueira`, `mobiliado`, `academia`, `sauna`, `vista-mar`, `varanda`, `elevador`, `playground`.
5. **Bairro no slug** (`bairro.ts`): procure o slug oficial (ou alias) que termina **imediatamente antes** do marcador de cidade: `-bairros-recife` (VivaReal), `-recife-pe` (ZAP e OLX), `-recife` final (QuintoAndar); compare por fronteira de hífen e escolha o mais longo (`torreao` antes de `torre`, `boa-viagem` e `boa-vista` são distintos). Sem marcador, no OLX, procure o primeiro `-em-`, `-no-`, `-na-`, `-nas-` ou `-nos-` cujo texto seguinte **começa** com um slug de bairro seguido de hífen ou fim (o mais longo); esse é o bairro. O slug `recife` só vale como bairro pelos aliases `bairro-do-recife` e `recife-antigo`. Havendo marcador de Recife, `cidade = "recife"`.
6. Nomes do slug viram título com acento só onde a lista de bairros tiver; partículas `da`, `de`, `do`, `das`, `dos`, `e` ficam minúsculas ("Solar do Gayppio", "Rua Jack Ayres").

### Regras das Camadas B e C (texto e HTML)

1. JSON-LD: cada `<script type="application/ld+json">` em `try/catch` (quebrado é ignorado em silêncio). Aceite objeto, lista e `@graph`. Mapeie `floorSize.value` → área, `numberOfRooms` → quartos, `numberOfBathroomsTotal` → banheiros, `address.streetAddress` → logradouro (número final vira `numero`), `address.addressLocality` "Recife" → `cidade: "recife"`, `offers.price` ou `price` → preço.
2. Texto: remova os blocos `<script>…</script>` e `<style>…</style>` inteiros (depois de ler o JSON-LD), depois as demais tags; decodifique entidades (`&nbsp;`, `&amp;`); mantenha quebras de linha.
3. Dinheiro: `R$ 2.900.250` → 2900250; `R$ 4.500,50` → 4500.5. Rótulos: preço (`aluguel` e `valor do aluguel` → modalidade aluguel; `venda`, `valor de venda`, `à venda` → compra; `preço`, `valor`), `condomínio`, `iptu`, `seguro incêndio`, `taxa de serviço`, `total`. O valor de um rótulo é o primeiro `R$ …` ou `Não informado`/`Consulte`/`Sob consulta` na mesma linha depois dele, ou na próxima linha não vazia se o rótulo estiver sozinho. Um `R$` solto antes de qualquer rótulo de custo é o preço.
4. Período até 12 caracteres depois do valor: `/mês`, `/mes`, `por mês`, `mensal` → `mes`; `/ano`, `por ano`, `anual` → `ano`; o rótulo `IPTU anual` ou `IPTU mensal` também define. Sem indicação → `desconhecido`.
5. **Conferência do total:** havendo `Total`, se aluguel + condomínio + IPTU + seguro + taxa (os presentes) somam o total com diferença ≤ R$ 2, o IPTU é `mes`.
6. Especificações: área `(\d{1,5}(?:,\d{1,2})?)\s*m(?:²|2)` (prefira a rotulada "área útil" ou "área privativa"); `(\d+)\s+quartos?`; `(\d+)\s+su[ií]tes?`; `(\d+)\s+banheiros?`; `(\d+)\s+vagas?`; andar `(\d+)\s*[ºo°]?\s*andar` ou `andar\s+(\d+)`, `térreo` → 0; ano `constru[ií]do em (\d{4})` ou `ano de constru[cç][aã]o:?\s*(\d{4})`.
7. Logradouro: trecho que começa com `Rua`, `R.`, `Avenida`, `Av.`, `Travessa`, `Tv.`, `Estrada`, `Praça`, `Largo`, `Alameda` até ` - `, `,` ou fim de linha; `, 123` logo depois vira `numero`.
8. Bairro no texto, só nestes padrões (nunca palavra solta, porque Torre, Prado, Monteiro, Santana e Barro são também nomes comuns): `- {Bairro}, Recife`, `{Bairro}, Recife`, `{Bairro} - Recife`, `no|na|nos|nas|em {Bairro}`, `Bairro: {Bairro}`. Compare sem acento e sem caixa.

### Regras de `montarExtracao`

1. Ordem das leituras: `url`, `json_ld`, `texto`. `metodos` = métodos das leituras recebidas, nessa ordem, sem repetir.
2. Campos numéricos e de custo: vale o último não nulo (`texto` > `json_ld` > `url`). Identificação (`modalidade`, `tipologia`, `bairro`, `bairroTexto`, `cidade`, `logradouro`, `numero`, `nomeEdificio`): vale o primeiro não nulo (`url` > `json_ld` > `texto`). `comodidades`: união. Dois valores não nulos diferentes geram anomalia `incoerente` no campo (área: diferença > 1 m²). Registre em `origemDosCampos` de onde veio cada valor final (`json_ld` conta como `texto`).
3. Auditoria, nesta ordem:
   - **R1** valor `Não informado`/`Consulte`/`Sob consulta` → campo `null`, anomalia `nao_informado` com `valorLido`.
   - **R2** custo recorrente ≤ R$ 10, ou preço < R$ 100 → `null`, anomalia `valor_simbolico` com `valorLido` ("R$ 1").
   - **R3** condomínio < R$ 1,50 por m² (com área conhecida e tipologia diferente de `casa`) → mantém o valor, anomalia `valor_atipico`.
   - **R4** IPTU com período `desconhecido` → mantém, anomalia `periodo_desconhecido`.
   - **R5** IPTU igual ao condomínio e > R$ 10 → anomalia `valor_repetido` nos dois.
   - Mensagens curtas e factuais, ex.: "O anúncio informa R$ 100 de condomínio para 152 m²."
4. `lacunas`: dos campos `preco`, `condominio`, `iptu`, `area`, `bairro`, os que ficaram nulos.
5. `cobertura`: `coberto` se `bairro` está em `BAIRROS_COBERTOS`; `recife_fora` se é outro bairro do Recife; `fora_do_recife` se a cidade é outra (QuintoAndar sem `-recife`, ZAP com cidade/UF diferente de `recife-pe`, VivaReal com `bairros-{cidade}` diferente de recife); senão `desconhecida`.
6. Resultado validado com `esquemaExtracao.parse` antes de retornar.

**Aceite:**
- [ ] Todas as fixtures passam; nenhuma fixture alterada.
- [ ] Teste extra: um texto com "Condomínio R$ 0" produz `condominio: null` com `valor_simbolico`.
- [ ] Funções não importam nada de React nem de `expo-*`.

---

## Fatia 2: entrada, revisão e caderno v2

**Objetivo verificável:** colar um link de Casa Forte e o texto do anúncio, revisar e salvar uma análise v2; recarregar a página e ela continuar lá; análises v1 antigas aparecem migradas.

### Explorar (T1)

**Referência:** `renderExplore` 4422–4555; CSS 1463–1900 (`.scanner-card`, `.scanner-input-well`, `.scanner-url-field`, `.btn-scanner-primary`, `.filter-segmented-pill`, `.vereda-home-card`, `.photo-price-bar`, `.vereda-specs-strip`, `.urban-diagnosis-strip`).

- Cartão "Auditar novo anúncio" com botão "Colar link" (lê a área de transferência), poço do link com ícone laranja e botão primário "Gerar Dossiê". Link inválido mostra erro abaixo do campo; nada navega enquanto a pessoa digita. Link "Adicionar imóvel sem link" (secundário) abre `/editar`.
- "Análises Recentes" com filtro Todos / Alugar / Comprar e os cartões das análises não descartadas, mais recente primeiro. O topo 16:10 do cartão, onde o protótipo tem foto, mostra o polígono do lote (`PoligonoMini`) sobre o padrão `.arch-grid-pattern` quando o prédio está confirmado, ou o padrão vazio quando não. Mantenha a pílula de bairro, o marcador de salvo e a barra `.photo-price-bar`: "Anúncio: R$ X/mês" e "Total conhecido: R$ Y/mês" (compra: "Preço: R$ X"), com a etiqueta "+R$ Z além do aluguel" ou "N a confirmar". Embaixo: nome, endereço quando houver, faixa de especificações e faixa de diagnóstico com dois itens (ponto sálvia: "Prédio confirmado · {ano}" ou "Prédio não confirmado"; ponto ferrugem: título do achado principal, quando houver).
- Caderno vazio: cartão "Seu caderno começa com um link." e, abaixo, "Dossiês de exemplo" com os cinco estáticos levando a `/exemplos/<id>`, cada um com a etiqueta "Exemplo".

### Leitura e revisão (T2): `src/app/(abas)/ler.tsx`

**Referência:** `triggerUrlDecode` 4720–4832 e CSS 2144–2192 (checklist de extração).

1. Cartão "Lendo o anúncio no aparelho" (sobretítulo laranja), com título montado do que se leu ("Apartamento 1 quarto · Casa Forte") ou "Anúncio do {portal}". Quatro linhas de checklist, cada uma com o círculo verde-sálvia escuro quando lida e contorno quando não:
   1. "Link reconhecido": "{Portal} · código {id}" ou "Link de outro site. Preencha abaixo."
   2. "Tipo, quartos e área": valores lidos ou "Não estão no link".
   3. "Preço e custos": valores lidos ou "Cole o texto do anúncio para ler condomínio e IPTU".
   4. "Bairro e cobertura": "{Bairro} · com cadastro", "{Bairro} · ainda sem cadastro" ou "Fora do Recife".
   Rodapé: "Só lemos campos do imóvel. Nada sobre quem anuncia." e "Privacidade local". Nenhuma animação simulando etapas: as linhas refletem o resultado real.
2. Cartão "Complete com o texto do anúncio" (na web, sempre; no celular, a Fatia 2B o rebaixa a plano B): "No anúncio, selecione todo o texto da página e cole aqui." Campo de várias linhas com rótulo permanente e botão secundário "Ler texto". Ler texto refaz `montarExtracao` com as leituras de URL e texto e atualiza o checklist e a revisão.
3. Cartão "Revise antes de salvar" (`FormularioDeRevisao`, componente compartilhado com `/editar`): nome (sugestão: "{Tipologia} {n} quartos · {Bairro}"), modalidade, preço, condomínio, IPTU com período (Mês / Ano / Não sei), seguro incêndio, taxa de serviço, outros, área, quartos, suítes, banheiros, vagas, andar, rua, número, edifício. Ao lado de cada valor, uma etiqueta de origem: "do link" (origem `link`), "do anúncio" (origem `texto`, que inclui JSON-LD, estado da página e texto colado) ou "você" (passa a "você" ao editar). Cada anomalia aparece em ferrugem embaixo do campo, com a mensagem. Campos de custo têm "A confirmar", ligado por padrão quando há anomalia.
4. Ação principal:
   - `coberto` → "Encontrar o prédio": salva e vai a `/predio?id=…` com `vinculo: pendente`.
   - qualquer outra cobertura → cartão "Ainda não cobrimos {Bairro}." no padrão de `renderOutOfCoverageCard` 4578–4610 (sem "Avise-me", que dependeria de servidor): primário "Salvar no caderno" (`vinculo: fora_de_cobertura`) e secundário "Colar outro link". A leitura não consome crédito.

### Persistência v2

- `src/dados/migracao.ts`: `export function migrarAnaliseV1(v: Analise, agora: Date): AnaliseV2`. `preco`, `condominio`, `outros`, `area` → `declarados` com `origem: "voce"` e `aConfirmar: false`; `iptuAnual` → `iptu` com `periodo: "ano"`; `tipo` → `modalidade`; `bairro` → `bairroTexto` e `bairro` = slug se o texto for um bairro do Recife; `dsqfl`, `quartos`, `logradouro` opcionais copiados; `notas` e `verificadas` → `visita`; `extracao: null`; `vinculo: pendente` se o bairro é coberto, senão `fora_de_cobertura`; `salva: true`; `descarte: null`; `criadaEm` e `atualizadaEm` = `atualizadoEm` (ou `agora`, se inválido).
- `src/estado/Analises.tsx`: usa `CHAVE_ANALISES_V2`. Na primeira carga, sem v2 e com v1, migra tudo, grava v2 e **não apaga** v1. Expõe também `ativa` (id da análise aberta no Dossiê e na Visita), persistida em `vereda-ativa-v1`.
- `src/estado/Carteira.tsx`: `esquemaCarteira` em `CHAVE_CARTEIRA`; começa com 3 (`cota_inicial`).
- `src/app/editar.tsx`: substitui `src/app/analise.tsx`; usa `FormularioDeRevisao`, cria (sem link) ou edita uma análise v2. Exclusão com confirmação continua aqui.

**Aceite:**
- [ ] Teste de migração: as análises de `tests/analise.test.ts` migram e passam em `esquemaAnaliseV2`.
- [ ] Teste de persistência com `AsyncStorage` simulado: v1 presente → v2 gravada, v1 intacta.
- [ ] Fluxo manual capturado: link da fixture `zap-casa-forte-aluguel` → texto da fixture `zap-like-iptu-sem-periodo` → anomalia de IPTU visível → salvar → recarregar → análise no Explorar.
- [ ] Link da fixture `vivareal-torre-venda` → cartão "Ainda não cobrimos Torre." → salvar → análise no caderno sem cadastro.

---

## Fatia 2B: leitura automática da página no celular

**Requisito do usuário (19/10/2026):** a pessoa só cola o link e já tem as informações do imóvel, sem copiar e colar texto.

**Objetivo verificável:** no celular (Expo Go, Android e iOS), colar o link de um anúncio de ZAP, VivaReal, QuintoAndar ou OLX e, sem outro toque, a revisão aparecer preenchida com o que a página mostra (preço, condomínio, IPTU, área, quartos). Na web, o fluxo continua o da Fatia 2, porque o navegador não deixa um site ler outro.

### Princípio (não negociável)

A página é aberta pela ação da pessoa, **à vista dela**, uma por vez, na WebView do sistema e sem disfarce. É o mesmo que ela abrir o anúncio no navegador; o app só lê o que está na tela dela. Proibido:

- WebView oculta, transparente, fora da tela ou com altura menor que 240 px;
- abrir qualquer página que a pessoa não pediu (pré-carregamento, listas de resultado, "imóveis semelhantes", repetição em laço);
- trocar o user agent ou qualquer cabeçalho; resolver, clicar ou automatizar desafio do Cloudflare ou CAPTCHA; clicar ou rolar elementos da página por script;
- guardar HTML, texto bruto, fotos ou cookies além do que a WebView guarda sozinha. Só os campos extraídos entram na `Analise`.

### Arquivos

- `npx expo install react-native-webview` (13.16.1, compatível com o SDK 57 e incluída no Expo Go).
- `src/dados/extrator/estado.ts`: `export function extrairDoEstado(estado: unknown, portal: Portal, idNoPortal: string | null): LeituraParcial | null`, com `metodo: "json_ld"`.
  1. Ache **o objeto do anúncio**: busca em largura (profundidade ≤ 12, até 200 mil nós) pelo objeto com chave `id`, `listingId`, `legacyId` ou `houseId` cujo valor, como texto, é igual a `idNoPortal`. Sem `idNoPortal` ou sem objeto: devolva `null`. Nunca leia fora desse objeto: o estado da página traz outros anúncios e pode trazer dados da conta da pessoa no portal (no QuintoAndar, o ramo `login.user`).
  2. Dentro dele (chaves sem diferença de caixa, até 3 níveis abaixo): preço ← `rentPrice` ou `rent` (aluguel), `salePrice` ou `price` (compra); modalidade ← `forRent`/`forSale` (os dois verdadeiros → `null`); condomínio ← `condoPrice`, `condoFee`, `monthlyCondoFee`; IPTU ← `yearlyIptu` (ano), `monthlyIptu` (mês), `iptu` (no QuintoAndar, mês: a página mostra o pacote mensal, conferido em 19/10/2026; nos outros, `desconhecido`); seguro ← `insurance`, `fireInsurance`; taxa ← `tenantServiceFee`, `serviceFee`; total ← `totalCost`; área ← `area`, `usableArea`, `usableAreas` (lista: primeiro item); quartos ← `bedrooms`; suítes ← `suites`; banheiros ← `bathrooms`; vagas ← `parkingSpaces`; andar ← `floor`, `unitFloor`; rua ← `address.street`; número ← `address.streetNumber` ou `address.number` não vazio; `bairroTexto` ← `address.neighborhood`, com `bairro` = slug oficial se casar com a lista de bairros; cidade ← `address.city` ("Recife" → `recife`); ano ← `constructionYear`, `buildingYear`. Valores em lista ou objeto com `value` ou `amount`: use o número.
  3. **Zero no estado é ausência**, não valor: vira `null` sem anomalia (o QuintoAndar traz `salePrice: 0` em anúncio de aluguel).
  4. ZAP, VivaReal e OLX bloqueiam leitura fora de um navegador, então os nomes de chave deles não foram conferidos. Descubra no aparelho com o modo de inspeção abaixo, acrescente os sinônimos neste mapa e registre no relatório o caminho do objeto e as chaves encontradas, por portal.
- `src/dados/extrator/pagina.ts`:
  - `esquemaColetaDaPagina` (Zod) para a mensagem vinda da página, que é dado não confiável: `{ url: string ≤ 2000; titulo: string ≤ 300; ld: string[] ≤ 10 itens de ≤ 200 KB; estados: string[] ≤ 3 itens de ≤ 3 MB; texto: string ≤ 200 mil caracteres; verificacao: boolean }`. Mensagem fora do esquema é ignorada.
  - `export function lerPagina(coleta: ColetaDaPagina, portal: Portal, idNoPortal: string | null): LeituraParcial[]`: devolve, nesta ordem, a leitura do primeiro estado em que `extrairDoEstado` achar o anúncio; a de JSON-LD (mesmo parser da Fatia 1); e a de texto (`extrairDoTexto` sobre `coleta.texto`) **com nulo em todo campo que as leituras estruturadas já preencheram**, para que preços de "imóveis semelhantes" no texto não sobrescrevam o anúncio.
- `src/componentes/leitor/coletor.ts`: o script injetado, como constante de texto. Na página: lê `script[type="application/ld+json"]`; os estados `script#__NEXT_DATA__`, o atributo `data-json` de `script#initial-data` e `JSON.stringify(window.__INITIAL_STATE__)` quando existirem; o texto de `main` ou, sem ele, de `body` (`innerText`); `document.title`; `location.href`; `verificacao` = título ou texto casando com `/just a moment|verifique|verify you are human|cf-chl|captcha/i`. Respeita os limites do esquema, envia com `window.ReactNativeWebView.postMessage(JSON.stringify(…))`, roda ao fim do carregamento e de novo 2,5 s depois (páginas que montam o conteúdo depois de carregar) e termina com `true;`. Não clica, não rola, não navega.
- `src/componentes/leitor/LeitorDePagina.tsx` (celular) e `LeitorDePagina.web.tsx` (devolve `null`):
  - Props: `{ url: string; portal: Portal; idNoPortal: string | null; aoLer: (leituras: LeituraParcial[]) => void; aoFalhar: (motivo: "tempo" | "verificacao" | "erro") => void }`.
  - `WebView` com `source={{ uri: url }}`, `injectedJavaScript` = coletor, `onMessage` validando com `esquemaColetaDaPagina`, `setSupportMultipleWindows={false}`, `thirdPartyCookiesEnabled={false}`, `sharedCookiesEnabled={false}`, `allowsInlineMediaPlayback={false}`, `mediaPlaybackRequiresUserAction`, **sem** a prop `userAgent`. `onShouldStartLoadWithRequest` só permite navegar no mesmo domínio do link (`zapimoveis.com.br`, `vivareal.com.br`, `quintoandar.com.br`, `olx.com.br`, ou o host exato para portal `outro`) e em `challenges.cloudflare.com`; o resto é bloqueado sem abrir nada.
  - Chama `aoLer` quando uma mensagem rende preço ou área sem `verificacao`. Com `verificacao`, mostra "O portal pediu uma verificação. Complete na página abaixo.", aumenta a página e espera até 120 s antes de `aoFalhar("verificacao")`. Sem mensagem útil em 20 s: `aoFalhar("tempo")`. Erro de carregamento: `aoFalhar("erro")`.
  - Modo de inspeção só em `__DEV__`: botão "Mapear chaves" que registra no console os **nomes** das chaves do objeto do anúncio, nunca os valores. É o que você usa para o item 4 de `estado.ts`.

### Mudanças na leitura (T2, `ler.tsx`)

- No celular, com portal reconhecido ou `outro`, o cartão "Lendo o anúncio no aparelho" mostra a página do anúncio num quadro de 4:3 com borda `.ed-card` e o checklist embaixo, atualizado conforme as leituras chegam. Quando `aoLer` dispara, o app refaz `montarExtracao` com a leitura do link mais as da página, recolhe o quadro (link "Ver página do anúncio" para reabrir) e mostra a revisão já preenchida. **Nenhum toque além de colar o link.**
- `aoFalhar`: a página continua visível e aparece o cartão de colar o texto com a frase "Não conseguimos ler esta página. Copie o texto dela e cole aqui." A pessoa sempre tem também o link "Prefiro colar o texto".
- Na web: exatamente a Fatia 2.

**Aceite:**
- [ ] `tests/extrator-estado.test.ts` com `tests/fixtures/estado-pagina.json`: todos os casos; nenhum `valoresProibidos` aparece em lugar algum do resultado (busca recursiva).
- [ ] `tests/extrator-pagina.test.ts`: coleta com estado do anúncio e texto contendo "Imóveis semelhantes · Aluguel R$ 9.999" → preço continua o do estado; coleta fora do esquema é ignorada; coleta só com texto → leitura de texto completa.
- [ ] `grep -n "userAgent" src/componentes/leitor` vazio.
- [ ] Na web, `/ler` não renderiza WebView e mostra o cartão de colar texto (captura).
- [ ] Teste em aparelho, tabela no relatório: portal × Android × iOS × resultado ("campos lidos: …", "pediu verificação", "falhou: motivo"). Rode no emulador Android se tiver; o que só der para testar em celular físico, marque "para o humano" com o passo a passo (Expo Go, `npm start`, colar um link real de cada portal).

---

## Fatia 3: índice cadastral do Recife e confirmação do prédio

**Objetivo verificável:** `src/dados/recife/indice/` contém um JSON por bairro coberto e um `meta.json`, gerados do zero por um comando; a tela de prédio encontra um edifício real pela rua e número e o vínculo fica gravado.

### Script `scripts/dados/construir-indice-recife.mjs`

Uso: `node scripts/dados/construir-indice-recife.mjs [--sem-lotes]`. Node ≥ 20, sem dependências.

1. **Cliente CKAN** (`https://dados.recife.pe.gov.br/api/3/action/`): `datastore_search` sempre com `fields` (lista branca) e, quando aplicável, `filters`. **O portal devolve no máximo 500 linhas por requisição, qualquer que seja o `limit` pedido** (a resposta ecoa `limit: 500`): pagine com `offset` até o `total` e, no fim, aborte com erro se o número de linhas lidas for diferente do `total`. Os arquivos para download (`url` dos recursos) respondem com redirecionamento 302 para um link temporário: siga-o. Três tentativas com espera crescente em erro 5xx ou tempo esgotado (30 s). Guarde as respostas brutas em `.cache/dados-recife/` (acrescente ao `.gitignore`) para rodar de novo sem rede. `datastore_search_sql` está desativado no portal; não use.
2. **IPTU 2026**, recurso `9a847338-92a6-4b74-b3e8-c8f8b57aff2d`, uma consulta por grafia de `GRAFIAS_NO_CADASTRO[slug]` (de `src/dados/recife/bairros.ts`; Graças aparece como "Gracas" e "Graças") e `fields`: `logradouro`, `numero`, `Código Logradouro`, `AREA CONSTRUIDA`, `valor cobrado de IPTU`, `ano da construção corrigido`, `tipo de uso do imóvel`, `tipo de padrão da construção`, `Tipo de Construção`, `Tipo de Empreendimento`, `latitude`, `longitude`. Fique com `tipo de uso do imóvel = "RESIDENCIAL"` e `Tipo de Construção` começando por `Apartamento`. Decimais vêm com vírgula ("26,56"). `numero` vem como inteiro e às vezes nulo; descarte registros sem `numero` ou sem coordenada. Agrupe por `Código Logradouro` + `numero`; mantenha grupos com 2 ou mais registros. `centro` = mediana de latitude e longitude do grupo.
3. **ITBI 2016–2026**, pacote `imposto-sobre-transmissao-de-bens-imoveis-itbi`. Recursos: 2026 `fc95e204-a121-4b7a-94b2-e4420539c0d1`, 2025 `1d705d4a-f67a-4914-971f-01f9b1685d1b`, 2024 `756d9a7e-33aa-4fdd-a541-0f5dc97c7502`, 2023 `47dfea23-81ec-455e-83a0-3e451e5b5ca6`, 2022 `5226cf6f-ed06-4956-b133-a0c788a5d494`, 2021 `f3a083a1-aa48-416d-b3aa-c022192219e6`, 2020 `6f79d820-b764-4cde-939f-83d80e728c53`, 2019 `6a8a8f7e-8d3d-4729-aaf9-fcc43ae2827a`, 2018 `ae29c630-77b8-4109-8e1b-02292069f4d5`, 2017 `53617998-09e8-420c-9399-75d859c8528e`, 2016 `210db9b0-4ea5-49cb-8084-135ebfca848d`. Confira `datastore_active` com `resource_show`; se falso, baixe o CSV do campo `url`. `fields`: `cod_logradouro`, `numero`, `bairro`, `valor_avaliacao`, `area_construida`, `data_transacao`, `tipo_imovel`, `latitude`, `longitude`. **Nunca `complemento`.** 2017 não está na API (`datastore_active: false`): baixe o CSV (separador `;`, campos entre aspas, decimal com vírgula) e descarte a coluna `complemento` na leitura, antes de qualquer gravação, inclusive no cache. De 2016 a 2024 há a coluna extra `Distrito`, que você ignora. `area_construida` e `valor_avaliacao` vêm ora como texto com vírgula, ora como número. Bairro: as mesmas grafias do IPTU. Antes de filtrar, registre no relatório os valores distintos de `bairro` e de `tipo_imovel` que casam com os 5 bairros e com apartamento. Ligue ao edifício por `cod_logradouro` + `numero`.
4. **Licenciamento**, recurso `39927a3d-3235-436a-9dc8-df7f4ea3b720`, com `filters: {"categoria_empreendimento": "Obra"}` e `fields`: `dsqfl`, `tipo_processo`, `assunto`, `data_entrada`, `situacao_processo`, `latitude`, `longitude`, `categoria_empreendimento`. **Dois terços da base são "Atividade", isto é, alvará de funcionamento de loja ou empresa, e não obra.** Sem esse filtro, cada prédio de Graças teria mediana de 259 "obras" a 150 m; com ele, 68; contando só o que incomoda o vizinho, 5.
   - Classificação (`assunto`, ou `tipo_processo` quando `assunto` vazio): `construcao` = "ALVARA DE CONSTRUCAO INICIAL", "APROVACAO DE PROJETO INICIAL", "ALVARA DE CONSTRUCAO/LEGALIZACAO"; `acrescimo` = `tipo_processo` "REFORMA COM ACRÉSCIMO DE ÁREA"; `demolicao` = "ALVARA DE DEMOLICAO" (em qualquer dos dois campos). O resto não é relevante: conta só em `licencasDeObra`.
   - A série útil começa em 2018 (2017 tem 395 registros). `licencasDeObra` conta desde 2018-01-01; `relevantes24m` e `demolicoes24m`, os relevantes com `data_entrada` nos 24 meses anteriores à geração.
   - 19% das obras não têm coordenada. Nesses casos use o centro do lote pelo `dsqfl` (14 dígitos), achado na base de Lotes; sem lote, descarte e conte no relatório.
   - Distância por Haversine a partir do `centro` do edifício; até 150 m.
5. **Lotes** (pulável com `--sem-lotes`): GeoJSON do recurso `c41ee0d0-bb33-4380-8809-2e9082d79ab0` (137 MB) baixado para `.cache/`. Os nomes reais (conferidos em 20/10/2026) **não são os do dicionário**: use `DSQFL` (texto já com 14 dígitos), `QTDPAVIMENTOS`, `NMEDIFICACAO`; ignore os demais, inclusive `NMENDCOMP`. CRS84, o mesmo do IPTU. Toda geometria é `MultiPolygon`; 3 vêm vazias (pule); 231 DSQFL aparecem em mais de uma feição (qualquer uma serve). Para cada edifício, ache o lote que contém o `centro` (filtro por retângulo e depois ponto no polígono, implementado à mão, testando o anel externo e excluindo buracos). `pavimentos` = `QTDPAVIMENTOS` quando positivo. `nome` = `NMEDIFICACAO` normalizado como diz o contrato. Polígono: o anel externo do maior polígono; a mediana é de 9 vértices, então simplifique só acima de 24. Polígono: 6 casas decimais e Douglas–Peucker com tolerância de 0,00001°, aumentando até ficar com 24 vértices ou menos. Registre a taxa de vínculo por bairro (esperado acima de 85%).
6. **Edifício** (`esquemaEdificio`): `tipologias` por área arredondada a 0,01 m², com a mediana do IPTU de cada uma; `anoConstrucao`, `padrao` e `ate4Pavimentos` pela moda; `iptuAnual` em quartis; `itbi` com `valorM2` só se n ≥ 3; `obras150m` conforme o item 4, com `recentes` apontando para a lista de obras do bairro.
7. **Contexto do bairro**: quartis de R$/m² do ITBI de apartamentos nos 24 meses anteriores à geração; quartis de IPTU anual por m² das unidades indexadas.
8. **Quartis**: ordene e interpole linearmente (o padrão do numpy). Dinheiro com 2 casas, coordenadas com 6.
9. **Saída determinística**: `src/dados/recife/indice/<slug>.json` (`esquemaIndiceDoBairro`) e `src/dados/recife/indice/meta.json` (`esquemaMetaDoIndice`, com `colunasUsadas` exatamente iguais aos `fields` pedidos), edifícios ordenados por `id`, `obras` sem repetição e ordenadas por data e coordenada, JSON sem espaços. Orçamento: ≤ 2,0 MB por arquivo e ≤ 4 MB somados (estimativa do arquiteto: Boa Viagem ~2 MB com as obras deduplicadas; os outros, até 0,5 MB). Rodar duas vezes com o mesmo cache gera arquivos idênticos.

### No app

- `src/dados/recife/indice.ts`: mapa estático com `require` dos cinco JSONs; valida com Zod no primeiro acesso de cada bairro e guarda em memória. Exporta `edificiosDoBairro(slug)`, `edificioPorId(id)`, `contextoDoBairro(slug)` e `META`.
- `src/dados/recife/buscar.ts`:
  - `buscarCandidatos(entrada: { bairro: SlugCoberto; logradouro: string | null; numero: string | null; nomeEdificio: string | null; area: number | null; andar: number | null; anoConstrucao: number | null }, edificios: Edificio[]): Candidato[]`. Pontos: mesmo nome de edifício (sem acento, sem caixa, sem "edificio", "edf", "condominio", "residencial"; igual, ou um contém o outro com 2 palavras ou mais) +100; mesma rua (comparação sem acento, sem caixa e sem o tipo de via) +50; mesma rua e mesmo número +100; alguma tipologia com |área − anúncio| ≤ máx(1,5 m²; 3%) +30, e +10 se essa tipologia tem 2 ou mais unidades; |ano − anoConstrucao| ≤ 1 +15; andar maior que `pavimentos` exclui. Mínimo de 30 pontos. Ordem: pontos decrescentes, depois `id`. No máximo 8. `motivos` factuais ("4 unidades com 125 m² no cadastro", "Mesma rua do anúncio").
  - `buscarPorEndereco(texto: string, edificios: Edificio[]): Edificio[]`: "rua teles junior 331", "teles júnior, 331" ou o nome do prédio ("parador de cervantes") acham o edifício; até 8 resultados.
- `src/app/(abas)/predio.tsx`, referência `renderAnalyzingLotCard` 4611–4719:
  - `.ed-card` com sobretítulo azul "— Cadastro imobiliário · Prefeitura do Recife" e, à direita, a chave cadastral em mono no formato `D.SSSS.QQQ.FF.LLLL` (se houver). Título "É este o prédio?". Texto: "Confirmar o prédio garante que IPTU, ITBI e obras sejam deste edifício."
  - Mapa em `react-native-svg`: candidato e vizinhos projetados num plano local; o selecionado em azul cadastral, os outros tracejados e tocáveis; pino laranja; legenda "Toque nos lotes vizinhos se o pino não estiver sobre o prédio correto". Sem polígono, círculos.
  - Caixa creme: endereço em caixa de título, "{unidades} unidades · construído em {ano} · padrão {padrao} · {pavimentos} pavimentos" e os `motivos`.
  - Botões: primário "É este prédio"; secundários "Não é este (ver vizinho)", que percorre os candidatos, e "Pular por agora" (aluguel) ou "Não encontrei o prédio" (compra).
  - Sempre visível: campo "Buscar por rua, número ou nome do prédio" com `buscarPorEndereco`. A caixa creme mostra o `nome` do edifício quando houver.
  - Sem candidatos: "Sem o endereço não dá para saber qual é o prédio. Peça a rua e o número ao corretor." com a busca e "Pular por agora".
  - Confirmar: `vinculo: confirmado` com `indiceGeradoEm`, débito de 1 crédito (`dossie_cadastral`), vai para `/dossie?id=`. Saldo zero abre a gaveta de Créditos com "Recarregar 3 créditos de teste".

**Aceite:**
- [ ] `node scripts/dados/construir-indice-recife.mjs` gera os seis arquivos; com o cache, uma segunda execução gera arquivos idênticos (compare com `sha256sum`).
- [ ] `tests/indice-recife.test.ts`: os cinco JSONs passam em `esquemaIndiceDoBairro` e o `meta.json` em `esquemaMetaDoIndice`; cada arquivo ≤ 2,0 MB e a soma ≤ 4 MB; número de edifícios e `registrosLidos` dentro de 5% da tabela de C7; todo índice em `recentes` aponta para uma obra existente; nenhuma chave proibida da seção 1.2 aparece em nenhum JSON (busca recursiva por nome de chave); todo `dsqfl` tem 14 dígitos.
- [ ] `tests/buscar.test.ts` com um índice sintético pequeno em `tests/fixtures/` (cinco edifícios inventados, marcados como sintéticos): rua e número acham direto; só área devolve os que têm a tipologia; andar acima dos pavimentos exclui; sem sinal devolve lista vazia.
- [ ] Relatório com: registros lidos por fonte, edifícios por bairro, taxa de vínculo com Lotes por bairro, valores distintos de `bairro` e `tipo_imovel` do ITBI, tamanho de cada arquivo.
- [ ] Fluxo capturado: análise da Fatia 2 → prédio achado por rua e número (use um edifício real do índice gerado) → confirmado → crédito debitado.
- [ ] `src/dados/servico-cadastral-recife.ts` removido.

---

## Fatia 4: dossiê (T4)

**Objetivo verificável:** a análise confirmada abre um dossiê no layout de `index.html`, com custos, achados vindos do cadastro e perguntas; cada número abre a fonte.

### Derivação: `src/dados/dossie/derivar.ts`

`export function derivarDossie(a: AnaliseV2, e: Edificio | null, contexto: ContextoDoBairro | null, outras: AnaliseV2[], agora: Date): VisaoDoDossie`, pura.

1. **Custo.** Parcelas: Aluguel (só aluguel), Condomínio, IPTU, Seguro incêndio, Taxa de serviço, Outros. IPTU anual ÷ 12; período `desconhecido` → `a_confirmar` com nota "O anúncio informa R$ X, sem periodicidade"; `aConfirmar` → `a_confirmar`; `valor null` → `desconhecido`. `totalMensalConhecido` = soma das conhecidas, ou `null` se nenhuma. `alemDoPrincipal` = total − aluguel (só aluguel). Compra: `principal` = preço, fora do total. `porM2` = principal ÷ área.
2. **Posição** (barra bala): compra com `e.itbi.valorM2` → "da mediana fiscal deste prédio" (fonte `itbi`); senão compra com `contexto.itbiValorM2` → "da mediana fiscal do bairro, 24 meses"; aluguel com 3 ou mais `outras` do mesmo bairro e modalidade com preço e área → quartis de R$/m² dessas, fonte `suas_analises`, frase "… das suas análises em {Bairro}"; senão `null`. Frase: "{n}% acima da …" ou "{n}% abaixo da …"; diferença menor que 1% → "Na mediana …".
3. **Achados**, nesta ordem de prioridade (o primeiro presente é o principal; até 3 de apoio):
   1. `anomalia` de custo (IPTU ou condomínio), título curto ("IPTU sem periodicidade", "Condomínio abaixo do comum").
   2. `iptu` com prédio confirmado e tipologia da mesma área (tolerância da Fatia 3): sem IPTU declarado conhecido → "IPTU no cadastro", medida "R$ {mediana÷12}/mês", texto "Mediana de {n} unidades de {área} m² neste prédio · IPTU 2026", `oficial`. Com IPTU declarado mensal e diferença > 20% → "IPTU não confere", medida "R$ {anúncio} × R$ {cadastro}".
   3. `area`: área declarada difere da tipologia mais próxima em mais de 10% e mais de 5 m² → "Área não confere", medida "{anúncio} × {cadastro} m²", `inferencia`.
   4. `estrutura`: `ate4Pavimentos` (ou `pavimentos ≤ 4`), `anoConstrucao < 2005` e `padrao` Simples ou Médio → "3 sinais no cadastro", texto "Até 4 pavimentos, construído antes de 2005, padrão {padrao}. Confirme o sistema estrutural e peça o laudo.", `inferencia`.
   5. `obras`: `relevantes24m ≥ 1` → medida "{relevantes24m}" "obras licenciadas perto", texto "Construção, acréscimo ou demolição a até 150 m nos últimos 24 meses · {demolicoes24m} demolições" (omitir a segunda parte se zero), `oficial`. Nunca use `licencasDeObra` como número de destaque: inclui habite-se e reforma pequena.
   6. `itbi`: só compra, com posição de fonte `itbi`, texto da posição, `oficial`.
4. **Perguntas** (`Pergunta`), sem repetir id:
   - `lacuna-endereco` (documentos), primeira de todas, quando o bairro é coberto e o vínculo não é `confirmado`: "Qual é o endereço completo?" / "Para conferir o cadastro do prédio".
   - `lacuna-preco`, `lacuna-condominio` ("Qual é o condomínio e há cota extra?"), `lacuna-iptu` ("Qual é o IPTU deste apartamento?"): custo.
   - `anomalia-iptu`: título "R$ {valor} de IPTU por mês?" e pista "Anúncio sem periodicidade" (período desconhecido) ou "Valor do anúncio parece de fachada" (simbólico ou repetido); `anomalia-condominio`: "Condomínio de R$ {valor} está certo?" / "Abaixo do comum para {área} m²". Custo.
   - `achado-estrutura` (documentos): "Qual é o sistema estrutural?" / "3 sinais no cadastro". `achado-area` (documentos): "Qual é a área privativa na matrícula?". `achado-obras` (conforto): "As obras próximas afetam a rotina?" / "{relevantes24m} obras licenciadas a 150 m".
   - Padrão, sempre: `padrao-documentos` "Há cota extra ou obra aprovada?" / "Peça atas e balancetes" (documentos); `padrao-agua` "Como é a pressão da água?" / "Teste torneiras e chuveiro" (conforto); `padrao-ruido` "Como é o ruído com a janela aberta?" (conforto); `padrao-sol` "O sol chega às janelas?" / "Anote a orientação na visita" (conforto).
   - `visita.perguntasProprias` no fim, origem `propria`, prioridade `conforto`.
   - Ordenação como `getDossierChecks` (5514–5527): a prioridade escolhida pela pessoa primeiro, mantendo a ordem acima; `lacuna-endereco` fica em primeiro sempre.
5. **Cadastro** (`Fato[]`, só com prédio confirmado): Nome do edifício (`lotes`, quando houver), Ano de construção (`iptu_2026`), Pavimentos (`lotes`) ou "Até 4 pavimentos" (`inferencia`), Unidades residenciais, Área no cadastro (tipologia mais próxima), Padrão, Chave cadastral. Sem prédio: um único fato `nao_sabemos` "Prédio não confirmado".
6. **Histórico**: construção ("{ano}", "Construção registrada no cadastro"); ITBI ("{desde}–{ate}", "{n} transmissões"); demolições licenciadas ("{ano}" de cada demolição em `recentes`, "Demolição licenciada a {distância} m").
7. `tests/dossie.test.ts`: cada regra acima com um edifício sintético; nenhum texto gerado contém as palavras proibidas da seção 1.2 (teste varrendo todos os campos de texto de `VisaoDoDossie` para uma bateria de 10 análises sintéticas).

### Tela: `src/app/(abas)/dossie.tsx?id=`

**Referência:** `renderDossier` 5138–5190, `renderDossierFinance` 5107–5137, `getDossierFindings` 5234–5251, `renderDossierHighlights` 5261–5274, `renderDossierBullet` 5284–5290, `renderDossierBuilding` 5554–5571, `renderDossierChecks` 5528–5532, `openSourceSheet` 6003–6101; CSS 2643–2990.

- Topo 16:10 com o mapa do lote (ou padrão vazio), botão voltar, marcador de salvo e "Abrir mapa" (gaveta com o mapa maior e as obras como pontos).
- Linha "{Bairro} · Recife" e, à direita, "Lote confirmado ✓" ou o link "Confirmar prédio" para `/predio`. Título, endereço, especificações, dois fatos curtos (ex.: "Construído em 2010 · 12 pavimentos" e "IPTU 2026 · R$ 328–R$ 371/mês"), links "Dados do anúncio →" (gaveta: valores declarados, origem de cada um, anomalias e link original) e "Cadastro oficial →" (gaveta com os `Fato`).
- Bloco de custo `.ds-finance` (2735 em diante): principal, "Total mensal conhecido", "+R$ Z além do aluguel", barra segmentada (aluguel em laranja, condomínio em sálvia, demais em tons do protótipo), legenda com "A confirmar" e a nota fora da soma; link "Ver composição e ajustar valores →" para `/editar`. Posição como `.ds-bullet` com `.ds-price-delta`.
- Abas `.ds-tabs` (2760): **Destaques** (cartão do achado principal com borda laranja à esquerda e fundo creme, achados de apoio em linhas com seta, linha "Antes de decidir · {n} verificações"); **Entorno** (obras recentes com data, distância e situação; contexto do bairro); **Edifício** (perguntas com o filtro Custo / Conforto / Documentos, "Estrutura e cadastro" em grade, "Valor e histórico").
- Rodapé: primário "Preparar visita →" (aba Visita com esta análise ativa); links "Comparar imóveis" e "Descartar".
- Todo `Fato` e todo `Achado` com fonte abre a gaveta de fonte: nome da base, órgão, licença ODbL, data de modificação e de consulta, recorte usado, e o rastro de confiança (`.conf-trace` 2410–2440).
- Sem análise ativa: estado vazio da Fatia 0. Sem prédio confirmado: dados declarados, achados de anomalia e o cartão "Confirme o prédio para ver o cadastro" (coberto) ou "Fora da área com cadastro" (não coberto).

**Aceite:**
- [ ] `tests/dossie.test.ts` verde.
- [ ] Capturas das três abas do dossiê da análise confirmada na Fatia 3, a 375 e 1280, ao lado do dossiê de `index.html` no mesmo tamanho.
- [ ] Um toque num número de IPTU do cadastro abre a gaveta com "IPTU 2026 · Prefeitura do Recife · ODbL" e as datas do `meta.json`.

---

## Fatia 5: visita, comparar, salvos, descarte, créditos, sobre os dados

**Referências:** Visita `renderLiveVisit` 5902–5921 e CSS 3129+ (`.vv-*`), painel de campo `.field-dark-panel` 2625–2642; Comparar `renderCompare` 5964–5989 e CSS 3045+ (`.vx-*`, `.vc-*`); Salvos `renderSaved` 6506+; Descarte `openDiscardSheet` 6325–6371; Créditos `openCreditsSheet` 6229–6281; Sobre os dados `openAboutDataSheet` 6282–6324.

- **Visita**: "SUA PRÓXIMA VISITA" e "Ver dossiê →"; "Prepare sua visita."; cartão do imóvel com "Trocar"; abas Preparar / No imóvel.
  - Preparar: "{n} pontos para conferir", as três primeiras numeradas, "Ver roteiro completo", "Adicionar pergunta"; seção "Antes de marcar" com "Preparar mensagem": gaveta com o texto editável, "Copiar" e "Abrir no WhatsApp" (`https://wa.me/?text=` com o texto codificado e sem destinatário; a pessoa escolhe o contato e envia); primário "Começar visita".
  - No imóvel, painel escuro de campo: cronômetro (iniciar e pausar; `segundos` persistido), lista de verificação com resposta por pergunta (gaveta), ruído em três opções (Silencioso / Moderado / Alto, sem decibéis), orientação da janela com controle de 0° a 359° e rótulo N, NE, L, SE, S, SO, O, NO, notas; primário "Salvar e encerrar visita" grava `concluidaEm` e mostra o resumo.
  - `src/dados/mensagem.ts`: `mensagemParaCorretor(a: AnaliseV2, perguntas: Pergunta[]): string` = "Olá! Vi o anúncio {nome}{ (url)}.\nAntes de visitar, pode me confirmar:\n1. …\nObrigado!", com até 6 perguntas não verificadas usando `textoParaMensagem`, `lacuna-endereco` primeiro. Teste.
- **Comparar**: "LADO A LADO" e "Meus salvos →"; "Compare suas opções."; Alugar / Comprar; dois seletores com análises não descartadas da modalidade; tópicos Custo / Espaço / Entorno. Custo: "R$ {diferença} de diferença no custo mensal conhecido.", barras na mesma escala, parcelas lado a lado com "A confirmar" e "{n} parcelas a confirmar" quando houver. Espaço: área, quartos, vagas, andar, preço por m². Entorno: obras licenciadas a 150 m em 24 meses (`relevantes24m`), ano, pavimentos, unidades; "Prédio não confirmado" quando for o caso. Nenhuma frase de recomendação.
- **Salvos** (`/salvos`): "Seus imóveis salvos.", filtro Todos / Aluguel / Compra e a seção "Descartados" com "Restaurar".
- **Descarte**: gaveta com os quatro motivos de `index.html` (chaves em `motivoDeDescarte`) e observação opcional; grava `descarte`, +1 crédito (`descarte`) uma única vez por análise, volta a Explorar.
- **Créditos**: saldo, extrato e a frase "Na versão de teste, créditos não têm valor em dinheiro." Com saldo zero, "Recarregar 3 créditos de teste" (`recarga_de_teste`).
- **Sobre os dados**: para cada fonte do `meta.json`, nome, órgão, licença ODbL, modificado em, consultado em, registros lidos e colunas usadas; atribuição "Contém dados da Prefeitura do Recife, disponibilizados sob a Open Database License (ODbL)"; seção "O que ainda não cobrimos": aluguel de mercado, segurança por bairro, alagamento por endereço, fotos dos anúncios, bairros fora dos cinco.

**Aceite:**
- [ ] Teste de `mensagemParaCorretor`.
- [ ] Teste do crédito: descartar duas vezes a mesma análise credita uma vez.
- [ ] Capturas de cada tela a 375 e 1280.

---

## Fatia 6: acabamento e teste de ponta a ponta

- Acessibilidade: `role`, `aria-label` e estado nos controles; foco visível na web; Esc fecha gavetas; área de toque ≥ 44×44; contraste ≥ 4,5 em texto; sem animação com movimento reduzido.
- `scripts/v1-smoke.mjs` (substitui `scripts/poc-smoke.mjs`, mesma forma de execução, `POC_URL`), contexto isolado do Chromium:
  1. Link da fixture `zap-casa-forte-aluguel` → "Casa Forte · com cadastro" → texto `zap-like-iptu-sem-periodo` → anomalia visível → salvar → prédio por rua e número (primeiro edifício de `casa-forte.json` lido em tempo de teste) → confirmar → dossiê mostra um fato com "Prefeitura do Recife".
  2. `context.setOffline(true)` e repete a abertura do dossiê: tudo continua funcionando (índice local).
  3. Link `vivareal-torre-venda` → fora de cobertura → salvar.
  4. Recarregar: análises e vínculo persistem.
  5. Comparar as duas de aluguel (crie uma segunda pelo editor).
  6. Descartar uma: crédito +1.
  7. Nenhum `pageerror` no console.
  8. Capturas de cada etapa em `out/v1/smoke/`.
- `EXPO_OFFLINE=1 npx expo export --platform all --output-dir out/v1-export` sem erro.
- O teste de ponta a ponta acima roda na web, onde não há WebView. A leitura automática da página fica coberta pela tabela de aparelho da Fatia 2B; repita-a ao final, com os mesmos quatro portais.
- Atualize `docs/POC-VALIDACAO.md` com o que foi verificado e o que não foi (celular físico fica para o humano).

**Aceite final:** tudo acima verde e o relatório com a seção "Pronto para revisão do arquiteto".

---

## Perguntas ao arquiteto

Se uma regra desta ordem for impossível ou contraditória, não improvise: escreva no relatório, na seção "Bloqueios", o que tentou, o que viu e a alternativa que sugere, e siga para o próximo item que não dependa dela.
