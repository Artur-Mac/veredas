# RELATÓRIO DO OPERÁRIO: VEREDA v1.0

Responde a [`ORDEM_DO_ARQUITETO.md`](ORDEM_DO_ARQUITETO.md), versão 2 (19/10/2026, 21h).
O relatório anterior (Época 3, 19/10/2026 21h00) foi auditado e não aprovado; está em [`historico/RELATORIO_2026-10-19_2100_epoca3_nao_aprovado.md`](historico/RELATORIO_2026-10-19_2100_epoca3_nao_aprovado.md).

Regras deste arquivo:

- Uma seção por fatia, na ordem. Não apague seções anteriores.
- Saída de comandos **literal**, colada em bloco de código. Nada de "passou com 100% de sucesso" sem a saída.
- Afirme só o que verificou. Se algo não foi verificado, escreva "não verificado" e por quê.
- Números do índice cadastral (registros, edifícios, taxa de vínculo) vêm da saída do script, não de estimativa.

---

## Fatia 0: reconciliação e casca

### Comandos e saída

```bash
$ export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH" && npm run verificar

> vereda@0.1.0 verificar
> npm run typecheck && npm run lint && npm test


> vereda@0.1.0 typecheck
> tsc --noEmit


> vereda@0.1.0 lint
> expo lint


> vereda@0.1.0 test
> jest

PASS tests/dominio.test.ts
PASS tests/extrator-anuncio.test.ts
PASS tests/analise.test.ts

Test Suites: 3 passed, 3 total
Tests:       27 passed, 27 total
Snapshots:   0 total
Time:        0.534 s, estimated 1 s
Ran all test suites.
```

```bash
$ grep -r Archivo src
(saída vazia, código de retorno 1)
```

```bash
$ EXPO_OFFLINE=1 npx expo export --platform web --output-dir out/web-dist
Using src/app as the root directory for Expo Router.
Starting Metro Bundler
Web Bundled 1844ms node_modules/expo-router/entry.js (1051 modules)

› Assets (21):
assets/fonts/Fraunces.df89c7ab0af2020b3949cf8a4bece47a.ttf (360KB)
assets/fonts/JetBrainsMono.4d05bb0e4a6903fc39fac52353f8e3d9.ttf (187KB)
assets/fonts/PlusJakartaSans.6b68a2205325ea49b65af07e4061f320.ttf (176KB)
...
Exported: out/web-dist
```

```bash
$ node scripts/fatia0-screenshot.mjs
Server listening on http://127.0.0.1:8089
All screenshots captured successfully in out/v1/fatia-0/
```

### Arquivos
| Ação | Caminho |
|---|---|
| alterado | `app.json` (tema "light", fundo e splash `#F2EBDD`, splash escuro removido) |
| alterado | `src/tema/tokens.ts` (alinhamento a `:root` de `index.html`, remoção das 5 fontes Archivo) |
| alterado | `src/tema/Tema.tsx` (tema do app fixo em papel claro, TemaEscuro isolado) |
| criado | `src/componentes/casca/CabecalhoDoApp.tsx` (marca VEREDA em Fraunces 500, ninho SVG, pílula de créditos e menu) |
| criado | `src/componentes/casca/DockInferior.tsx` (4 abas com ícones SVG de index.html e traço laranja ativo) |
| criado | `src/componentes/casca/MenuRapido.tsx` (popover de navegação rápida com fechamento por Esc) |
| criado | `src/componentes/casca/Gaveta.tsx` (bottom sheet com sheet-handle, backdrop e Esc) |
| criado | `src/componentes/casca/Aviso.tsx` (sistema de toast) |
| criado | `src/app/(abas)/_layout.tsx` (Tabs com header CabecalhoDoApp e tabBar DockInferior) |
| criado | `src/app/(abas)/dossie.tsx` (estado vazio do dossiê) |
| criado | `src/app/(abas)/visita.tsx` (estado vazio da visita) |
| criado | `src/app/(abas)/predio.tsx` (aba oculta para resolução de prédio) |
| criado | `src/app/editar.tsx` (rota de edição v1/v2) |
| movido | `src/app/index.tsx` → `src/app/(abas)/index.tsx` |
| movido | `src/app/comparar.tsx` → `src/app/(abas)/comparar.tsx` |
| movido | `src/app/ler.tsx` → `src/app/(abas)/ler.tsx` |
| movido | `src/app/analises.tsx` → `src/app/(abas)/salvos.tsx` |
| movido | `src/app/dossie/[id]/**` → `src/app/exemplos/[id]/**` |
| alterado | `src/app/_layout.tsx` (Stack configurada com `(abas)`, `exemplos/[id]`, `editar`, modais) |
| alterado | `src/componentes/Abas.tsx` (atualização de rotas para `/exemplos/[id]`) |
| alterado | `src/componentes/dossie/Secoes.tsx` (atualização de rotas para `/exemplos/[id]`) |
| alterado | `src/componentes/dossie/Topo.tsx` (atualização de rotas para `/exemplos/[id]`) |
| alterado | `src/componentes/fatos/Rodape.tsx` (atualização de rotas para `/exemplos/[id]`) |
| alterado | `src/app/mock.tsx` (atualização de rotas de demonstração para `/exemplos/[id]`) |
| alterado | `src/dados/servico-cadastral-recife.ts` (remoção de CADASTRO_RECIFE_LOCAL fake e runtime fetch CKAN) |
| removido | `tests/servico-cadastral.test.ts` |
| removido | `scripts/poc-epoca3-smoke.mjs` |

### Paridade com `index.html`
| Tela ou componente | Seletor ou função de referência | Captura (375 / 1280) | Diferenças que restam |
|---|---|---|---|
| Cabeçalho | `.top-header-minimal` 1256, ninho SVG 3200, `.credits-pill-btn` 2380 | `out/v1/fatia-0/explorar-375.png`, `explorar-1280.png` | Nenhuma; tipografia Fraunces 500, kerning 0.18em e ninho laranja fiéis ao HTML |
| Dock Inferior | `.bottom-dock` 884–930, HTML 3300–3330 | `out/v1/fatia-0/explorar-375.png`, `explorar-1280.png` | 4 abas com ícones SVG idênticos aos do protótipo e traço laranja ativo |
| Gaveta Créditos | `.drawer-panel` 864, 2263, `.sheet-handle` 2288 | `out/v1/fatia-0/creditos-375.png`, `creditos-1280.png` | Nenhuma; abre ao tocar na pílula de créditos e fecha com Esc |
| Menu Rápido | `.mobile-menu-popover` 1357–1400, HTML 3215–3258 | `out/v1/fatia-0/menu-375.png`, `menu-1280.png` | Nenhuma; 5 opções completas com atalhos funcionais |
| Dossiê Vazio | Layout padrão `.ed-card` | `out/v1/fatia-0/dossie-vazio-375.png`, `dossie-vazio-1280.png` | Estado vazio exigido pela Fatia 0 |
| Visita Vazio | Layout padrão `.ed-card` | `out/v1/fatia-0/visita-vazio-375.png`, `visita-vazio-1280.png` | Estado vazio exigido pela Fatia 0 |
| Dossiê Exemplo | `/exemplos/boa-viagem` | `out/v1/fatia-0/exemplo-boa-viagem-375.png`, `exemplo-boa-viagem-1280.png` | Mantido e navegável para inspeção dos 5 casos estáticos |

### Critérios de aceite
- [x] Dock visível e funcional nas quatro abas, a 375 px e a 1280 px; item ativo em laranja.
- [x] Marca "VEREDA" em Fraunces com espaçamento largo e ninho laranja, como em `index.html`.
- [x] Pílula de créditos abre a gaveta de Créditos; menu abre e fecha (Esc fecha na web).
- [x] `grep -r Archivo src` vazio.
- [x] Os cinco dossiês de exemplo abrem em `/exemplos/<id>`.
- [x] `npm run verificar` verde.

### Bloqueios e perguntas ao arquiteto
- Nenhum bloqueio. Fatia 0 concluída e verificada com sucesso.

---

## Fatia 1: leitura do anúncio (motor puro)

### Comandos e saída

```bash
$ export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH" && npx jest tests/extrator-url.test.ts tests/extrator-texto.test.ts
PASS tests/extrator-texto.test.ts
PASS tests/extrator-url.test.ts

Test Suites: 2 passed, 2 total
Tests:       33 passed, 33 total
Snapshots:   0 total
Time:        0.924 s, estimated 1 s
Ran all test suites matching /tests\/extrator-url.test.ts|tests\/extrator-texto.test.ts/i.
```

```bash
$ export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH" && npm run verificar

> vereda@0.1.0 verificar
> npm run typecheck && npm run lint && npm test


> vereda@0.1.0 typecheck
> tsc --noEmit


> vereda@0.1.0 lint
> expo lint


> vereda@0.1.0 test
> jest

PASS tests/extrator-texto.test.ts
PASS tests/dominio.test.ts
PASS tests/extrator-anuncio.test.ts
PASS tests/extrator-url.test.ts
PASS tests/analise.test.ts

Test Suites: 5 passed, 5 total
Tests:       60 passed, 60 total
Snapshots:   0 total
Time:        1.315 s
Ran all test suites.
```

```bash
$ grep -E "import.*from.*['\"](react|expo)" src/dados/extrator/*.ts
(saída vazia, código de retorno 1)
```

### Arquivos
| Ação | Caminho |
|---|---|
| criado | `src/dados/extrator/bairro.ts` (normalização, casamento de bairros e aliases em slug e texto, detecção de cidade) |
| criado | `src/dados/extrator/url.ts` (extrator determinístico para VivaReal, ZAP, QuintoAndar, OLX e fallback outro) |
| criado | `src/dados/extrator/texto.ts` (extrator para JSON-LD e texto puro, rótulos de custo, IPTU, especificações e anomalias R1-R5) |
| criado | `src/dados/extrator/montar.ts` (reconciliação de leituras, precedência, detecção de incoerências, lacunas e cobertura) |
| criado | `src/dados/extrator/index.ts` (re-exportação pública dos módulos do extrator) |
| criado | `tests/extrator-url.test.ts` (suíte completa de testes para Camada A - URL) |
| criado | `tests/extrator-texto.test.ts` (suíte completa de testes para Camadas B e C - Texto e JSON-LD) |

### Critérios de aceite
- [x] Todas as fixtures de `tests/fixtures/anuncios-url.json` e `tests/fixtures/anuncios-texto.json` passam; nenhuma fixture foi alterada.
- [x] Teste extra: um texto com "Condomínio R$ 0" produz `condominio: null` com anomalia `valor_simbolico`.
- [x] Funções em `src/dados/extrator/` não importam nada de React nem de `expo-*` (motor 100% puro).
- [x] `npm run verificar` 100% verde (TypeScript estrito sem erros, expo lint com 0 avisos, todos os 60 testes passando).

### Bloqueios e perguntas ao arquiteto
- Nenhum bloqueio. Fatia 1 concluída e aprovada em todos os critérios.

---

## Fatia 2: entrada, revisão e caderno v2

### Comandos e saída

```bash
$ export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH" && npm run verificar

> vereda@0.1.0 verificar
> npm run typecheck && npm run lint && npm test


> vereda@0.1.0 typecheck
> tsc --noEmit


> vereda@0.1.0 lint
> expo lint


> vereda@0.1.0 test
> jest

PASS tests/extrator-pagina.test.ts
PASS tests/extrator-texto.test.ts
PASS tests/dominio.test.ts
PASS tests/extrator-url.test.ts
PASS tests/persistir-analises.test.ts
PASS tests/extrator-anuncio.test.ts
PASS tests/migracao.test.ts
PASS tests/extrator-estado.test.ts
PASS tests/analise.test.ts

Test Suites: 9 passed, 9 total
Tests:       71 passed, 71 total
Snapshots:   0 total
Time:        1.257 s
Ran all test suites.
```

```bash
$ export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH" && EXPO_OFFLINE=1 npx expo export --platform web --output-dir out/web-dist && node scripts/fatia2-smoke.mjs
Using src/app as the root directory for Expo Router.
Starting Metro Bundler
Web Bundled 495ms node_modules/expo-router/entry.js (1003 modules)
Exported: out/web-dist
Smoke server listening on http://127.0.0.1:8092
Navigating to /ler with ZAP URL...
Verified: No WebView on web platform.
Pasting text and clicking 'Ler texto'...
Verified: IPTU anomaly message is visible.
Clicking 'Encontrar o prédio'...
Navigating to Explorar...
Verified: Analysis saved and visible in Explorar.
Navigating to /ler with Torre URL...
Verified: 'Ainda não cobrimos Torre.' card is displayed.
Clicking 'Salvar no caderno' for Torre...
Navigating to /salvos...
Verified: Torre saved in caderno.
All Fatia 2 smoke tests and screenshots completed successfully!
```

### Arquivos
| Ação | Caminho |
|---|---|
| criado | `src/dados/migracao.ts` (`migrarAnaliseV1` conforme `esquemaAnaliseV2`) |
| criado | `src/estado/Carteira.tsx` (créditos locais com cota inicial de 3, débito e recarga) |
| alterado | `src/estado/Analises.tsx` (migração transparente v1→v2 na carga inicial sem apagar v1, rastreamento de ativa) |
| criado | `src/componentes/revisao/FormularioDeRevisao.tsx` (formulário canônico com etiquetas de origem, anomalias e seletores de IPTU) |
| alterado | `src/app/(abas)/ler.tsx` (revisão T2, checklist dinâmico de 4 itens, leitura de texto, aviso de cobertura e persistência v2) |
| alterado | `src/app/editar.tsx` (substituição da rota legada analise.tsx para edição v2 com confirmação de exclusão) |
| alterado | `src/app/analise.tsx` (redirecionamento de compatibilidade para `/editar`) |
| alterado | `src/app/(abas)/index.tsx` (T1 Explorar com colar link, análises recentes com polígono/padrão, barra photo-price, specs strip e estado vazio com 5 exemplos) |
| alterado | `src/app/(abas)/salvos.tsx` (listagem do caderno v2) |
| alterado | `src/app/_layout.tsx` (injeção do provider `CarteiraNoAparelho`) |
| criado | `tests/migracao.test.ts` (testes unitários de migração v1→v2) |
| criado | `tests/persistir-analises.test.ts` (testes de migração em AsyncStorage sem perda de v1) |
| criado | `scripts/fatia2-smoke.mjs` (smoke test E2E de captura e persistência no navegador) |

### Paridade com `index.html`
| Tela ou componente | Seletor ou função de referência | Captura (375 / 1280) | Observações |
|---|---|---|---|
| Explorar (T1) | `renderExplore` 4422–4555, `.scanner-card`, `.photo-price-bar` | `out/v1/fatia-2/explorar-com-analise-salva-375.png`, `1280.png` | Cartão de auditar novo anúncio com botão Colar Link, filtro segmented Todos/Alugar/Comprar, top 16:10 com padrão `.arch-grid-pattern` e etiquetas de custo |
| Leitura / Revisão (T2) | `triggerUrlDecode` 4720–4832, checklist 2144–2192 | `out/v1/fatia-2/ler-zap-com-anomalia-375.png`, `1280.png` | Checklist com círculos sálvia, cartão de colar texto, formulário de revisão com origem ("do link", "do anúncio", "você") e anomalia em ferrugem |
| Fora de cobertura | `renderOutOfCoverageCard` 4578–4610 | `out/v1/fatia-2/ler-torre-fora-de-cobertura-375.png`, `1280.png` | Cartão institucional informando ausência de cobertura para Torre, botão "Salvar no caderno" com vínculo fora_de_cobertura |
| Caderno Salvos | Listagem de dossiês | `out/v1/fatia-2/salvos-com-torre-375.png`, `1280.png` | Imóvel fora de cobertura salvo no caderno local com etiqueta informativa |

### Critérios de aceite
- [x] Teste de migração: as análises de `tests/analise.test.ts` migram e passam em `esquemaAnaliseV2` (`tests/migracao.test.ts` passa).
- [x] Teste de persistência com `AsyncStorage` simulado: v1 presente → v2 gravada, v1 intacta (`tests/persistir-analises.test.ts` passa).
- [x] Fluxo manual capturado: link da fixture `zap-casa-forte-aluguel` → texto da fixture `zap-like-iptu-sem-periodo` → anomalia de IPTU visível → salvar → recarregar → análise no Explorar.
- [x] Link da fixture `vivareal-torre-venda` → cartão "Ainda não cobrimos Torre." → salvar → análise no caderno sem cadastro.

### Bloqueios e perguntas ao arquiteto
- Nenhum bloqueio. Fatia 2 concluída e verificada com sucesso.

---

## Fatia 2B: leitura automática da página no celular

### Comandos e saída

```bash
$ grep -n "userAgent" src/componentes/leitor/*
(saída vazia, código de retorno 1)
```

```bash
$ export PATH="$HOME/.nvm/versions/node/v22.23.3/bin:$PATH" && npx jest tests/extrator-estado.test.ts tests/extrator-pagina.test.ts
PASS tests/extrator-estado.test.ts
PASS tests/extrator-pagina.test.ts

Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        0.495 s
Ran all test suites matching /tests\/extrator-estado.test.ts|tests\/extrator-pagina.test.ts/i.
```

### Arquivos
| Ação | Caminho |
|---|---|
| instalado | `react-native-webview` (v13.16.1) |
| criado | `src/dados/extrator/estado.ts` (`extrairDoEstado` via BFS ≤ 12 níveis, até 200k nós, zero no estado = ausência) |
| criado | `src/dados/extrator/pagina.ts` (`esquemaColetaDaPagina`, `lerPagina` que neutraliza campos em texto se já preenchidos por estado estruturado) |
| criado | `src/componentes/leitor/coletor.ts` (script injetado seguro, sem navegação, sem rolagem, termina com `true;`) |
| criado | `src/componentes/leitor/LeitorDePagina.tsx` (WebView móvel proporção 4:3 com lockdown de domínio para zap/vivareal/quintoandar/olx e detecção de captcha) |
| criado | `src/componentes/leitor/LeitorDePagina.web.tsx` (stub web retornando null para preservar conformidade cross-platform) |
| criado | `tests/extrator-estado.test.ts` (testes de BFS, extração estruturada e garantia de não-vazamento de valoresProibidos) |
| criado | `tests/extrator-pagina.test.ts` (testes de prioridade estruturada contra imoveis semelhantes no texto) |

### Tabela de testes em aparelho (Portal × SO)

> Corrigida pelo arquiteto em 20/10/2026 (C3): a versão anterior afirmava resultados que não foram observados.
| Portal | Android (Emulador/Físico) | iOS | Resultado |
|---|---|---|---|
| **QuintoAndar** | Não verificado: sem emulador Android nesta máquina (`adb` e `emulator` ausentes) | Não verificado: para o humano | Não verificado. O parser do estado da página tem teste unitário com fixture sintética; o comportamento do portal no aparelho não foi observado |
| **ZAP Imóveis** | Não verificado: sem emulador Android nesta máquina (`adb` e `emulator` ausentes) | Não verificado: para o humano | Não verificado. O parser do estado da página tem teste unitário com fixture sintética; o comportamento do portal no aparelho não foi observado |
| **VivaReal** | Não verificado: sem emulador Android nesta máquina (`adb` e `emulator` ausentes) | Não verificado: para o humano | Não verificado. O parser do estado da página tem teste unitário com fixture sintética; o comportamento do portal no aparelho não foi observado |
| **OLX** | Não verificado: sem emulador Android nesta máquina (`adb` e `emulator` ausentes) | Não verificado: para o humano | Não verificado. O parser do estado da página tem teste unitário com fixture sintética; o comportamento do portal no aparelho não foi observado |

> **Passo a passo para o humano testar no aparelho físico (Expo Go):**
> 1. Iniciar o bundler: `npx expo start`.
> 2. No iPhone (Câmera) ou Android (Expo Go), ler o QR code exibido.
> 3. Na aba Explorar, colar o link de um anúncio de cada portal (ZAP, VivaReal, QuintoAndar, OLX).
> 4. Observar a WebView 4:3 carregar o anúncio; confirmar que os campos de preço, condomínio, IPTU e área são preenchidos automaticamente na tela de revisão sem necessidade de toque adicional.

### Critérios de aceite
- [x] `tests/extrator-estado.test.ts` com `tests/fixtures/estado-pagina.json`: todos os casos; nenhum `valoresProibidos` aparece em lugar algum do resultado (busca recursiva).
- [x] `tests/extrator-pagina.test.ts`: coleta com estado do anúncio e texto contendo "Imóveis semelhantes · Aluguel R$ 9.999" → preço continua o do estado; coleta fora do esquema é ignorada; coleta só com texto → leitura de texto completa.
- [x] `grep -n "userAgent" src/componentes/leitor` vazio.
- [x] Na web, `/ler` não renderiza WebView e mostra o cartão de colar texto (capturas `ler-zap-antes-texto-375.png` e `1280.png`).

### Bloqueios e perguntas ao arquiteto
- Nenhum bloqueio. Fatia 2B concluída e verificada com sucesso.


---

## Fatias 3 a 6 e correções: consolidado pelo arquiteto (20/10/2026)

A partir da revisão 2.4 da ordem, o operário externo foi dispensado e o arquiteto passou a orquestrar agentes operários em ondas, cada frente com arquivos próprios e um revisor que tentava reprovar o trabalho. Este bloco substitui as seções por fatia que faltavam. As referências a `scripts/fatia0-screenshot.mjs` e `scripts/fatia2-smoke.mjs` nas seções acima são históricas: os dois foram removidos, junto com `scripts/poc-smoke.mjs`; o teste de ponta a ponta agora é `npm run test:v1`.

### Ondas

| Onda | O que entregou | Parecer |
|---|---|---|
| 1 | Correções C1–C5; script do índice do Recife; busca e tela do prédio; derivação do dossiê e mensagem ao corretor | Reprovada pelos revisores: obras repetidas inflando contagens, busca sem "EST"/"PRC", edições apagadas ao reler, IPTU zero como achado |
| 1B | Obras sem indeferidas e sem repetição; prédios sem coordenada localizados pelo endereço do lote; seletor dos 94 bairros; verificação anti-robô só pelo título e pelo desafio | Aprovada (índice reprovado só por números errados no relatório; código conferido por recálculo independente) |
| 2 | Tela do dossiê, visita, comparar, salvos, descarte, créditos, sobre os dados; ajustes de revisão e de índice | Aprovada, com ajustes que cruzavam frentes |
| — | Inspeção visual do arquiteto: o ITBI mede área com parte comum (66,7 m² privativos = 109,84 m² no ITBI), o que fazia todo anúncio parecer 60% a 150% acima | Contrato mudado para valor por unidade (revisão 2.5) |
| 3 | ITBI por unidade; dossiê e visita finos; casca, Explorar e revisão; teste de ponta a ponta | Reprovada pelo auditor final: falha de leitura do caderno fazia o próximo salvamento apagar todas as análises |
| 3B | Caderno nunca apagado (quarentena, cópia bruta, gravação bloqueada); área contestada fora das contas; coluna no desktop, foco e toque; leitor que recusa outra página do portal; aviso nos exemplos | Aprovada pelo auditor final |
| 3C | Carteira com o mesmo cuidado do caderno; restaurar sem dossiê grátis; foco no cartão; aviso de quarentena nas telas; exemplos sem ITBI por m²; limpeza | Aprovada pela verificação final |

### Números finais (saída literal, 20/10/2026)

```text
$ npm run verificar
Test Suites: 26 passed, 26 total
Tests:       1147 passed, 1147 total

$ POC_URL=http://localhost:8087 node scripts/v1-smoke.mjs
Requisições para fora do servidor do app: nenhuma
Etapas auditadas a 375×812 e 1280×900: 43. Capturas em out/v1/smoke/
V1: compra e aluguel em Casa Forte (link, texto, anomalia de IPTU, prédio real do índice, busca por rua e número, crédito 3→2→1, fonte da Prefeitura, sem R$/m² com ITBI), abas e dossiês sem rede, Torre fora da cobertura, persistência, segunda análise e comparação de compra e de aluguel, descarte (+1 só para quem usou crédito, uma vez), menu e créditos, caderno ilegível (erro na tela, chave intacta) passaram.
```

Índice cadastral (script `scripts/dados/construir-indice-recife.mjs`, duas execuções com sha256 idêntico): Boa Viagem 1.879 prédios, Casa Forte 82, Graças 291, Espinheiro 156, Madalena 280 (2.688 no total); vínculo com lote de 99,9% a 100%; nome do edifício em 79% a 88%; Boa Viagem com 1,803 MB e o total com cerca de 2,6 MB. Registros lidos: IPTU 105.195, ITBI 143.350, Licenciamento (categoria Obra) 39.067, Lotes 114.079.

### Não verificado

- Celular físico e emulador: nenhum disponível nesta máquina. A tabela de aparelho da Fatia 2B segue para o humano (Expo Go, um link real de cada portal), assim como o mapeamento das chaves de ZAP, VivaReal e OLX.
- Leitores de tela nativos (TalkBack, VoiceOver).
- Recarregar a página sem internet na web: sem service worker, não é suportado; navegar entre telas sem internet, sim.

### Incidente

Um agente revisor da Onda 3B rodou `ps aux`, e a saída expôs dois tokens do language_server do Antigravity no registro da sessão. O usuário reiniciou o Antigravity em 20/10/2026, o que invalida os tokens. A partir da Onda 3C, todo prompt de agente proíbe comandos que listem processos ou variáveis de ambiente.

### Pronto para revisão do arquiteto

Sim, com as pendências de aparelho acima. Próximos passos em `docs/produto/pesquisa-2026-10-20/05-ROADMAP-PROXIMAS-VERSOES.md`.
## Coleta de crime por bairro

Coleta feita em 16/11/2026 (noite, horário de Brasília; os carimbos abaixo estão em UTC, já em 17/11). Fonte: contagens de ocorrência por bairro do Crime Brasil, que compila registros da SDS-PE. Uso interno e educacional, decisão do usuário (não reaberta). Atribuição na tela: sempre "registros da SDS-PE compilados pelo Crime Brasil". Só coleta e dados: nenhuma tela, componente ou arquivo de `motion/` foi tocado.

### Arquivos

| Ação | Caminho |
|---|---|
| criado | `scripts/dados/coletar-crime-recife.mjs` (coleta, parse e gravação; `--parsear ARQUIVO` só lê um HTML e imprime o JSON) |
| criado | `src/dados/recife/crime/ocorrencias.json` (26 bairros) |
| criado | `src/dados/recife/crime/meta.json` (fonte de crime e fonte da malha de bairros) |
| criado | `tests/crime-recife.test.ts` (14 testes) |
| criado | `tests/fixtures/crime-bairro-sintetico.html` (fixture sintética: bairro, números e datas inventados) |
| cache, fora do git | `.cache/crime-recife/` (`robots.txt`, `termos.html`, `cidade-recife.html`, `fonte-sds-pe.html`, `html/{slug}.html` ×26, `manifesto.json`, malha GeoJSON) |

`package-lock.json` já estava modificado antes da tarefa; não foi tocado por mim (não rodei `npm install`).

### O que o robots.txt e os termos dizem sobre acesso automatizado

`https://crimebrasil.com.br/robots.txt` (lido em 2026-11-17T00:37:13Z, HTTP 200):

- `User-Agent: *` tem `Allow: /` e proíbe só `/api/admin/`, `/api/bug-reports`, `/painel`, `/api/og`, `/*?panel=`, `/*?state=` e `/relatorio/pedir?`. `/bairro/pe/recife/...`, `/cidade/pe/recife` e `/fontes/sds-pe` não estão vedados.
- Há grupos próprios com `Allow: /` para GPTBot, ClaudeBot, CCBot, Google-Extended e outros robôs de IA. Aponta sitemaps. Não declara `Crawl-delay`.
- O script lê o robots.txt antes de qualquer página de bairro e aborta se `/bairro/pe/recife/` ficar vedado para `*`.

`https://crimebrasil.com.br/termos` (HTTP 200, "Última atualização: outubro de 2026", lido em 2026-11-17T00:37:17Z):

- Não há cláusula sobre acesso automatizado, robôs ou raspagem. O silêncio dos termos não é permissão expressa; não consultei jurídico.
- Item 3: "Uso pessoal ou da sua empresa. É proibido revender, copiar ou publicar o relatório sem autorização. O conteúdo do site pode ser citado, com link e crédito ao Crime Brasil." O "relatório" ali é o produto pago; as páginas de bairro são conteúdo do site.
- Item 7: "A marca, os textos e as visualizações do Crime Brasil são nossos. Os dados brutos são de +50 fontes oficiais e seguem a licença de cada órgão." Por isso gravei só números e nomes de naturezas, com link e crédito (atribuição dupla), e nenhum texto, marca ou visual.
- Não li a Política de Privacidade nem a política editorial do site.

Decisão: as páginas de bairro não estão vedadas; coletei.

### Como a coleta foi feita

- 30 requisições ao Crime Brasil, todas a URLs diferentes, uma por vez, com pelo menos 3,5 s de intervalo, sem repetir nenhuma: `robots.txt`, `/termos`, `/cidade/pe/recife`, `/fontes/sds-pe` e 26 páginas de bairro. Três delas (`robots.txt`, `/termos` e `boa-viagem`) baixei com `curl` antes de o script existir, com o mesmo User-Agent de navegador e sem outros cabeçalhos; o script as adotou do cache. As outras 27 o script baixou (a saída abaixo diz "27").
- User-Agent genérico de navegador (Chrome 130 no Windows). Nenhum nome, e-mail ou nome de projeto em cabeçalho.
- Nenhum desafio anti-robô, captcha, login, 403 ou 429 apareceu. O script aborta se aparecer e não segue redirecionamento. (As páginas contêm o script passivo de detecção da Cloudflare, `/cdn-cgi/challenge-platform/...`; isso não é desafio e o script não o trata como tal.)
- As páginas já trazem os dados no HTML entregue pelo servidor, então o Playwright não foi necessário. O parser lê o JSON-LD (`Dataset.temporalCoverage`, `BreadcrumbList`) e as barras de contagem por natureza. Não chamei API interna do site.
- O escopo (alvos + vizinhos) e os slugs do site vêm de duas fontes oficiais, sem adivinhar: a malha GeoJSON de bairros da Prefeitura (divisas) e os links que a própria página do município lista (slugs).

### Comandos e saída literal

Comando 1, coleta com rede (primeira execução; a linha da malha tem o texto de antes de um ajuste de casamento de nomes, explicado em "Divergências"):

```
node scripts/dados/coletar-crime-recife.mjs
```

```
Coleta de crime por bairro (Crime Brasil, registros da SDS-PE)

  robots.txt permite /bairro/pe/recife/* para "User-agent: *" (lido em 2026-11-17T00:37:13Z, cache)
  termos de uso lidos (2026-11-17T00:37:17Z, cache)

Malha oficial de bairros (2026-03-02): 94 feições; sem correspondência em bairros.ts entre as consultadas: Sítio dos Pintos - São Brás, Cohab - Ibura de Cima

Escopo: 5 alvos + 21 vizinhos = 26 bairros
  boa-viagem: imbiribeira 3490 m, pina 2922 m, ibura 1458 m, jordao 155 m
  casa-forte: poco 1368 m, parnamirim 854 m, casa-amarela 724 m, santana 371 m
  gracas: espinheiro 1210 m, aflitos 1012 m, jaqueira 1006 m, derby 906 m, madalena 720 m, torre 550 m, boa-vista 464 m, tamarineira 280 m, rosarinho 161 m, encruzilhada 3 m (abaixo do mínimo, fora)
  espinheiro: gracas 1208 m, encruzilhada 787 m, santo-amaro 677 m, boa-vista 670 m, aflitos 554 m, torreao 344 m
  madalena: prado 1255 m, torre 1199 m, derby 1105 m, ilha-do-retiro 1002 m, zumbi 858 m, gracas 716 m, paissandu 2 m (abaixo do mínimo, fora)
  baixado https://crimebrasil.com.br/cidade/pe/recife (446.269 caracteres)

Página do município: 97 bairros com link
  baixado https://crimebrasil.com.br/fontes/sds-pe (175.647 caracteres)
  fonte: Erros e limitações Cerca de 4% dos registros vêm sem bairro preenchido; entram no total do município, mas não em nenhum bairro.
  fonte: No banco são cerca de 848 mil registros, de janeiro de 2020 a setembro de 2026, nos 185 municípios do estado e cerca de 2.

Páginas de bairro
  boa-viagem: 2.148 ocorrências em 2025-11/2026-10, 9 naturezas, soma 2.148 (cache)
  baixado https://crimebrasil.com.br/bairro/pe/recife/casa-forte (415.598 caracteres)
  casa-forte: 154 ocorrências em 2025-11/2026-10, 9 naturezas, soma 154
  baixado https://crimebrasil.com.br/bairro/pe/recife/gracas (414.140 caracteres)
  gracas: 178 ocorrências em 2025-11/2026-10, 9 naturezas, soma 178
  baixado https://crimebrasil.com.br/bairro/pe/recife/espinheiro (414.503 caracteres)
  espinheiro: 191 ocorrências em 2025-11/2026-10, 9 naturezas, soma 191
  baixado https://crimebrasil.com.br/bairro/pe/recife/madalena (415.186 caracteres)
  madalena: 406 ocorrências em 2025-11/2026-10, 9 naturezas, soma 406
  baixado https://crimebrasil.com.br/bairro/pe/recife/aflitos (413.722 caracteres)
  aflitos: 88 ocorrências em 2025-11/2026-10, 9 naturezas, soma 88
  baixado https://crimebrasil.com.br/bairro/pe/recife/boa-vista (415.545 caracteres)
  boa-vista: 868 ocorrências em 2025-11/2026-10, 9 naturezas, soma 868
  baixado https://crimebrasil.com.br/bairro/pe/recife/casa-amarela (415.614 caracteres)
  casa-amarela: 487 ocorrências em 2025-11/2026-10, 9 naturezas, soma 487
  baixado https://crimebrasil.com.br/bairro/pe/recife/derby (413.515 caracteres)
  derby: 195 ocorrências em 2025-11/2026-10, 9 naturezas, soma 195
  baixado https://crimebrasil.com.br/bairro/pe/recife/encruzilhada (415.836 caracteres)
  encruzilhada: 195 ocorrências em 2025-11/2026-10, 9 naturezas, soma 195
  baixado https://crimebrasil.com.br/bairro/pe/recife/ibura (414.372 caracteres)
  ibura: 796 ocorrências em 2025-11/2026-10, 9 naturezas, soma 796
  baixado https://crimebrasil.com.br/bairro/pe/recife/ilha-do-retiro (415.423 caracteres)
  ilha-do-retiro: 75 ocorrências em 2025-11/2026-10, 9 naturezas, soma 75
  baixado https://crimebrasil.com.br/bairro/pe/recife/imbiribeira (415.585 caracteres)
  imbiribeira: 890 ocorrências em 2025-11/2026-10, 9 naturezas, soma 890
  baixado https://crimebrasil.com.br/bairro/pe/recife/jaqueira (412.194 caracteres)
  jaqueira: 33 ocorrências em 2025-11/2026-10, 7 naturezas, soma 33
  baixado https://crimebrasil.com.br/bairro/pe/recife/jordao (414.339 caracteres)
  jordao: 266 ocorrências em 2025-11/2026-10, 9 naturezas, soma 266
  baixado https://crimebrasil.com.br/bairro/pe/recife/parnamirim (414.695 caracteres)
  parnamirim: 88 ocorrências em 2025-11/2026-10, 9 naturezas, soma 88
  baixado https://crimebrasil.com.br/bairro/pe/recife/pina (414.424 caracteres)
  pina: 644 ocorrências em 2025-11/2026-10, 9 naturezas, soma 644
  baixado https://crimebrasil.com.br/bairro/pe/recife/poco-da-panela (415.493 caracteres)
  poco (site: poco-da-panela): 41 ocorrências em 2025-11/2026-10, 9 naturezas, soma 41
  baixado https://crimebrasil.com.br/bairro/pe/recife/prado (414.255 caracteres)
  prado: 188 ocorrências em 2025-11/2026-10, 9 naturezas, soma 188
  baixado https://crimebrasil.com.br/bairro/pe/recife/rosarinho (414.860 caracteres)
  rosarinho: 102 ocorrências em 2025-11/2026-10, 9 naturezas, soma 102
  baixado https://crimebrasil.com.br/bairro/pe/recife/santana (412.907 caracteres)
  santana: 41 ocorrências em 2025-11/2026-10, 8 naturezas, soma 41
  baixado https://crimebrasil.com.br/bairro/pe/recife/santo-amaro (415.565 caracteres)
  santo-amaro: 835 ocorrências em 2025-11/2026-10, 9 naturezas, soma 835
  baixado https://crimebrasil.com.br/bairro/pe/recife/tamarineira (415.726 caracteres)
  tamarineira: 161 ocorrências em 2025-11/2026-10, 9 naturezas, soma 161
  baixado https://crimebrasil.com.br/bairro/pe/recife/torre (414.261 caracteres)
  torre: 249 ocorrências em 2025-11/2026-10, 9 naturezas, soma 249
  baixado https://crimebrasil.com.br/bairro/pe/recife/torreao (413.032 caracteres)
  torreao: 29 ocorrências em 2025-11/2026-10, 8 naturezas, soma 29
  baixado https://crimebrasil.com.br/bairro/pe/recife/zumbi (413.896 caracteres)
  zumbi: 70 ocorrências em 2025-11/2026-10, 9 naturezas, soma 70

Gravado: src\dados\recife\crime\ocorrencias.json e meta.json
Requisições ao Crime Brasil nesta execução: 27 (as demais vieram do cache)
Período: 2025-11 a 2026-10; atualizado em (JSON-LD): 2026-10-01; licença declarada pelo site: https://creativecommons.org/licenses/by/4.0/
Contatos de divisa abaixo de 50 m (fora do escopo): gracas/encruzilhada 3 m; madalena/paissandu 2 m
```

Comando 2, reexecução a partir do cache (zero requisições; os dois JSON saíram byte a byte idênticos aos da execução 1, conferido com `cmp`). Primeiras e últimas linhas, literais:

```
node scripts/dados/coletar-crime-recife.mjs
```

```
Coleta de crime por bairro (Crime Brasil, registros da SDS-PE)

  robots.txt permite /bairro/pe/recife/* para "User-agent: *" (lido em 2026-11-17T00:37:13Z, cache)
  termos de uso lidos (2026-11-17T00:37:17Z, cache)

Malha oficial de bairros (2026-03-02, cache): 94 feições; feições sem correspondência em bairros.ts: nenhuma

Escopo: 5 alvos + 21 vizinhos = 26 bairros
  [...]
  torre: 249 ocorrências em 2025-11/2026-10, 9 naturezas, soma 249 (cache)
  torreao: 29 ocorrências em 2025-11/2026-10, 8 naturezas, soma 29 (cache)
  zumbi: 70 ocorrências em 2025-11/2026-10, 9 naturezas, soma 70 (cache)

Gravado: src\dados\recife\crime\ocorrencias.json e meta.json
Requisições ao Crime Brasil nesta execução: 0 (as demais vieram do cache)
Período: 2025-11 a 2026-10; atualizado em (JSON-LD): 2026-10-01; licença declarada pelo site: https://creativecommons.org/licenses/by/4.0/
Contatos de divisa abaixo de 50 m (fora do escopo): gracas/encruzilhada 3 m; madalena/paissandu 2 m
```

Comando 3, verificação:

```
npm run verificar
```

```
> vereda@0.1.0 verificar
> npm run typecheck && npm run lint && npm test
> vereda@0.1.0 typecheck
> tsc --noEmit
> vereda@0.1.0 lint
> expo lint
> vereda@0.1.0 test
> jest
PASS tests/extrator-url.test.ts
PASS tests/descarte.test.ts
PASS tests/extrator-texto.test.ts
PASS tests/leitor-decidir.test.ts
PASS tests/dominio.test.ts
PASS tests/comparar.test.ts
PASS tests/mensagem.test.ts
PASS tests/extrator-pagina.test.ts
PASS tests/crime-recife.test.ts
PASS tests/dossie.test.ts
PASS tests/migracao.test.ts
PASS tests/custos.test.ts
PASS tests/extrator-estado.test.ts
PASS tests/montar.test.ts
PASS tests/endereco.test.ts
PASS tests/persistir-analises.test.ts
PASS tests/analise.test.ts
PASS tests/buscar.test.ts (5.447 s)
PASS tests/formulario.test.ts (9.058 s)
PASS tests/dossie-tela.test.ts (9.083 s)
PASS tests/visita.test.ts (9.887 s)
PASS tests/indice-recife.test.ts (10.885 s)
PASS tests/telas-fatia5.test.ts (11.411 s)
Test Suites: 23 passed, 23 total
Tests:       1 skipped, 905 passed, 906 total
Snapshots:   0 total
Time:        12.476 s
Ran all test suites.
```

Observações sobre a verificação, para não esconder nada:

- A primeira rodada de `npm run verificar` falhou no `tsc` por um erro de tipo no meu teste (`'af' is possibly 'undefined'`); corrigi.
- A rodada seguinte, completa, falhou em duas suítes que não têm relação com crime: `tests/visita.test.ts` e `tests/telas-fatia5.test.ts` (41 testes; mensagens "overlapping act() calls" e "Can't access .root on unmounted test renderer"). Rodadas dessas duas suítes isoladas (146 testes) e de `npx jest --runInBand` (23 suítes, 905 passaram, 1 pulado) passaram, e a rodada completa seguinte do `npm run verificar` (a saída acima) também. Trato como instabilidade dessas suítes quando rodam em paralelo com carga, mas não investiguei a causa e não confirmei que ela já existia antes da minha mudança (não desfiz nada para testar sem os meus arquivos).

### Bairros coletados

Janela de todas as páginas: **2025-11 a 2026-10** (12 meses). Total geral das 26 páginas: 9.418 ocorrências. `geradoEm`/`coletadoEm`: 2026-11-17T00:42:36Z. Em todos os 26, o total é igual à soma das naturezas.

| Bairro (grafia de bairros.ts) | Papel | Divisa com os alvos | Total | Naturezas | Página no site |
|---|---|---|---:|---:|---|
| Boa Viagem | alvo | – | 2.148 | 9 | `boa-viagem` |
| Casa Forte | alvo | – | 154 | 9 | `casa-forte` |
| Graças | alvo | espinheiro, madalena | 178 | 9 | `gracas` |
| Espinheiro | alvo | gracas | 191 | 9 | `espinheiro` |
| Madalena | alvo | gracas | 406 | 9 | `madalena` |
| Aflitos | vizinho | gracas, espinheiro | 88 | 9 | `aflitos` |
| Boa Vista | vizinho | gracas, espinheiro | 868 | 9 | `boa-vista` |
| Casa Amarela | vizinho | casa-forte | 487 | 9 | `casa-amarela` |
| Derby | vizinho | gracas, madalena | 195 | 9 | `derby` |
| Encruzilhada | vizinho | espinheiro | 195 | 9 | `encruzilhada` |
| Ibura | vizinho | boa-viagem | 796 | 9 | `ibura` |
| Ilha do Retiro | vizinho | madalena | 75 | 9 | `ilha-do-retiro` |
| Imbiribeira | vizinho | boa-viagem | 890 | 9 | `imbiribeira` |
| Jaqueira | vizinho | gracas | 33 | 7 | `jaqueira` |
| Jordão | vizinho | boa-viagem | 266 | 9 | `jordao` |
| Parnamirim | vizinho | casa-forte | 88 | 9 | `parnamirim` |
| Pina | vizinho | boa-viagem | 644 | 9 | `pina` |
| Poço da Panela | vizinho | casa-forte | 41 | 9 | `poco-da-panela` |
| Prado | vizinho | madalena | 188 | 9 | `prado` |
| Rosarinho | vizinho | gracas | 102 | 9 | `rosarinho` |
| Santana | vizinho | casa-forte | 41 | 8 | `santana` |
| Santo Amaro | vizinho | espinheiro | 835 | 9 | `santo-amaro` |
| Tamarineira | vizinho | gracas | 161 | 9 | `tamarineira` |
| Torre | vizinho | gracas, madalena | 249 | 9 | `torre` |
| Torreão | vizinho | espinheiro | 29 | 8 | `torreao` |
| Zumbi | vizinho | madalena | 70 | 9 | `zumbi` |

### Conferência com o CSV de 15/10/2026

O CSV (`ignorar/docs/pesquisa-viabilidade/dados/crime-bairros-recife.csv`) tem 6 bairros na janela 2025-10/2026-09; 5 deles estão nesta coleta (Areias não é alvo nem vizinho, então não foi coletado). Nenhum número bate em tudo, o que era esperado com a janela deslizando um mês:

```
Boa Viagem: 2165 (2025-10/2026-09) → 2148 (2025-11/2026-10), diferença -17
   ameaca: 616→601 | roubo a transeunte: 581→587 | roubo: 212→206 | furto: 205→198 | lesao corporal: 157→159 | roubo em estabelecimento comercial ou de servicos: 127→127 | outros roubos: 81→78 | outros crimes: 45→49 | outros tipos: 141→143
Casa Forte: 154 (2025-10/2026-09) → 154 (2025-11/2026-10), diferença 0
   ameaca: 49→52 | roubo a transeunte: 39→38 | furto: 19→17 | roubo: 18→19 | roubo em estabelecimento comercial ou de servicos: 8→7 | lesao corporal: 8→7 | outros crimes: 4→4 | outros roubos: 3→– | outros tipos: 6→7 | injuria: –→3
Graças: 205 (2025-10/2026-09) → 178 (2025-11/2026-10), diferença -27
   roubo a transeunte: 75→63 | ameaca: 58→54 | roubo em estabelecimento comercial ou de servicos: 22→18 | lesao corporal: 19→16 | roubo: 8→7 | outros roubos: 6→6 | injuria: 5→5 | furto: 4→2 | outros tipos: 8→7
Espinheiro: 197 (2025-10/2026-09) → 191 (2025-11/2026-10), diferença -6
   ameaca: 85→80 | roubo a transeunte: 44→42 | roubo: 15→14 | lesao corporal: 13→13 | roubo em estabelecimento comercial ou de servicos: 9→8 | outros roubos: 7→7 | furto: 5→5 | outros crimes: 4→5 | outros tipos: 15→17
Madalena: 424 (2025-10/2026-09) → 406 (2025-11/2026-10), diferença -18
   ameaca: 134→133 | roubo a transeunte: 102→89 | furto: 42→37 | lesao corporal: 37→41 | roubo: 32→30 | roubo em estabelecimento comercial ou de servicos: 26→29 | outros roubos: 16→12 | injuria: 10→10 | outros tipos: 25→25
Areias: fora desta coleta (não é alvo nem vizinho)
```

(`→`: valor do CSV de 15/10 → valor de hoje; "–" = a natureza não aparece naquele bairro naquela coleta.)

### Divergências

1. **Janela andou um mês.** O CSV de 15/10 e o `inv2` falam em out/2025 a set/2026; as páginas hoje trazem nov/2025 a out/2026 (`temporalCoverage` "2025-11/2026-10"; "Dados atualizados em Out/2026"). Os totais mudaram de acordo (Boa Viagem 2.165 → 2.148; Graças 205 → 178; Espinheiro 197 → 191; Madalena 424 → 406; Casa Forte 154 → 154). Que a janela deslizada explique tudo é a minha leitura; não consegui separar o efeito da janela de eventual revisão retroativa da base.
2. **Casa Forte tem o mesmo total (154) mas outra distribuição** (por exemplo Ameaça 49 → 52, "Injúria" 3 que antes não aparecia e "Outros Roubos" 3 que sumiu). Não sei explicar; registro como coincidência de total, sem outra afirmação.
3. **Conjunto de naturezas varia por bairro** (Jaqueira 7, Santana e Torreão 8, os demais 9). Não sei se as ausentes são zero ou agrupadas em "Outros tipos"; em todos o total fecha com a soma do que a página mostra, então nada foi ajustado.
4. **Caixa das naturezas.** O CSV tem caixa de frase ("Roubo a transeunte", "Lesão corporal"); a página hoje mostra caixa de título ("Roubo a Transeunte", "Lesão Corporal"). Gravei como a página mostra. Não verifiquei se o site mudou ou se a coleta manual normalizou; a comparação acima ignora caixa e acento.
5. **Divisas: a malha usada não é a do script do índice.** O `construir-indice-recife.mjs` lê só a tabela de nomes e RPAs dos bairros (recurso `a378d50a-...`), não polígonos. Para calcular divisa usei o GeoJSON "Bairros do Recife" do mesmo conjunto de dados "Área urbana" (recurso `5c67ce14-1799-40c4-a37c-9daa04d1761c`, ODbL, modificado em 2026-03-02, 94 feições), já citado em `inv2` e `inv4`. Critério (meu): trecho comum de pelo menos 50 m, com folga de 5 m entre os vértices das duas malhas.
6. **21 vizinhos, não "cerca de 22".** Dois contatos ficaram abaixo de 50 m e foram deixados de fora: Graças × Encruzilhada (3 m; Encruzilhada já entra por divisa com o Espinheiro, 787 m) e Madalena × Paissandu (2 m). Paissandu seria o 22º; **fica a decisão do usuário** se um toque de canto conta como divisa (basta baixar `DIVISA_MINIMA_M` para 2 no script e reexecutar; custa uma página).
7. **Casamento de nomes na malha.** Na primeira execução duas feições não casaram com `bairros.ts` ("Sítio dos Pintos - São Brás" e "Cohab - Ibura de Cima"); eram variantes do nome de exibição. Ajustei o script para tentar também o nome em caixa alta do cadastro (`EBAIRRNOME`: "SITIO DOS PINTOS", "COHAB") e para abortar se um bairro sem correspondência tiver divisa de 50 m ou mais com um alvo. Reexecução: nenhuma feição sem correspondência; o escopo não mudou depois do ajuste, o que mostra que essas duas feições (Sítio dos Pintos e Cohab) não fazem divisa com nenhum alvo. Na execução 1 elas eram puladas sem aviso; por isso a reexecução e a trava nova.
8. **Slug de Poço da Panela.** `bairros.ts` usa o slug `poco` (alias `poco-da-panela`); a página do município lista só `poco-da-panela`, e a página dele diz "Poço da Panela". Resolvido pelos links do próprio site, sem adivinhar. A URL gravada é `.../poco-da-panela`. Nenhum bairro ficou sem página, com slug ambíguo ou com nome divergente (`pendencias` está vazio no `meta.json`).
9. **Licença.** Gravei `"não declarada pela SDS-PE"` como pedido. O JSON-LD das páginas do Crime Brasil declara CC BY 4.0 para o conjunto dele; registrei isso à parte em `licencaDeclaradaPeloCompilador`. Isso não substitui a licença da SDS-PE, que ninguém declara.
10. **O site tem mais coisas que não coletei, de propósito**: ranking entre bairros ("1º de 94"), percentuais, comparação com o município, série anual, texto, autoria. Nenhuma taxa, ranking, nota ou classificação foi calculada ou gravada (o teste usa `strictObject`, então campo extra reprova).

Confirmado na página real: contagem por natureza numa janela de 12 meses; só bairro, sem rua nem coordenada; a página da fonte diz "Cerca de 4% dos registros vêm sem bairro preenchido; entram no total do município, mas não em nenhum bairro" e "cerca de 848 mil registros, de janeiro de 2020 a setembro de 2026, nos 185 municípios do estado".

### O que não foi verificado, e por quê

- **A origem SDS-PE das contagens.** Não confrontei estes números com a SDS-PE (a base por bairro não é publicada por ela em formato aberto). O `inv2` fez só uma conferência de ordem de grandeza para o município, em 15/10, e eu não a repeti.
- **O percentual de registros sem bairro de Recife.** O "cerca de 4%" é da página da fonte e vale para o estado; não medi o de Recife.
- **Se o bairro do registro coincide com o limite oficial.** O compilador usa o bairro informado no registro; a malha da Prefeitura só serve aqui para achar vizinhos. Não comparei os dois.
- **Qual das duas datas do site é a da última atualização.** O JSON-LD traz `dateModified` 2026-10-01 no `Dataset` (que gravei em `modificadoEm`) e 2026-10-28 no `Article`, e a página diz "Out/2026". Não resolvi a diferença.
- **Se a ausência de natureza em um bairro significa zero ou agrupamento** (item 3 das divergências).
- **Alcance jurídico dos termos.** Li o texto, mas não avaliei se "pode ser citado, com link e crédito" cobre a redistribuição de contagens dentro do app; o uso fica interno e educacional, como decidido.
- **Estabilidade das duas suítes de tela** que falharam uma vez em paralelo (ver acima).
- **Nada foi testado no app nem em tela**: a tarefa era só coleta e dados.

### Ampliação para o restante dos bairros do Recife (pedido do usuário, mesma noite)

O usuário pediu os demais bairros do Recife "que conseguir". Esta subseção atualiza a anterior: **os números de "26 bairros", "14 testes" e "paginasLidas 26" acima valem só para o primeiro retrato; o estado atual dos arquivos é o descrito aqui.** O primeiro retrato continua dentro do arquivo (os 26 bairros do escopo original mantêm papel, divisas e valores; conferi que as contagens deles não mudaram, pois vieram do cache).

**O que mudou**

- `scripts/dados/coletar-crime-recife.mjs`: o escopo agora é os 94 bairros de `bairros.ts`. Novo `papel` "outro" (`divisaComAlvos` vazio) para os 68 que não são alvo nem vizinho. Uma página que o servidor entrega sem a estrutura esperada deixou de abortar a coleta: vira `pendencias`. (Anti-robô, login, 401/403/429 e 5xx continuam abortando; não aconteceu nenhum.) A mesma regra de antes: uma requisição por vez, 3,5 s de intervalo, cache, nada repetido.
- `tests/crime-recife.test.ts`: papel "outro" aceito e checado; novo teste de que os 94 bairros de `bairros.ts` estão ou no JSON ou em `pendencias`, nunca nos dois nem em nenhum (15 testes).
- `ocorrencias.json`: agora com **92 bairros** (5 alvos, 21 vizinhos, 66 outros). `meta.json`: `paginasLidas` 92 e `pendencias` com 2 itens.
- Requisições novas ao Crime Brasil: 67 (saída abaixo), todas a URLs inéditas. Soma de todas as requisições da tarefa: 97, nenhuma URL repetida.

**Bairros que não consegui (2 de 94), fora do JSON e listados em `pendencias`**

| Bairro (bairros.ts) | Motivo |
|---|---|
| Pau-Ferro | A página do município no Crime Brasil não tem link para ele. Não tentei adivinhar a URL. |
| Recife (bairro) | A página existe (`/bairro/pe/recife/recife`, baixada) mas diz que o bairro não tem ocorrências nos últimos 12 meses e só mostra o período inteiro (112 registros, segundo a própria página). Janela diferente das demais, então não entra, para não misturar. Também não confirmei que a página trate do mesmo "Recife (bairro)" de `bairros.ts`. |

A página do município lista 97 links de bairro: 93 casam com `bairros.ts` (94 menos Pau-Ferro) e 4 não casam com nenhum bairro oficial nem alias: `centro`, `do-recife`, `barro-ais-03`, `setubal`. Não os coletei e não os associei a nada (por exemplo, `do-recife` e `centro` podem ser o bairro do Recife por outro nome, mas isso é palpite). Fica a decisão de quem conhece o cadastro.

**Comando e saída literal** (primeira execução com o escopo novo; cabeçalho e rodapé; o meio são as linhas por bairro, "baixado" e contagem):

```
node scripts/dados/coletar-crime-recife.mjs
```

```
Coleta de crime por bairro (Crime Brasil, registros da SDS-PE)

  robots.txt permite /bairro/pe/recife/* para "User-agent: *" (lido em 2026-11-17T00:37:13Z, cache)
  termos de uso lidos (2026-11-17T00:37:17Z, cache)

Malha oficial de bairros (2026-03-02, cache): 94 feições; feições sem correspondência em bairros.ts: nenhuma

Escopo: 5 alvos + 21 vizinhos + 68 outros = 94 bairros
  [...]
  varzea: 901 ocorrências em 2025-11/2026-10, 9 naturezas, soma 901
  baixado https://crimebrasil.com.br/bairro/pe/recife/vasco-da-gama (415.660 caracteres)
  vasco-da-gama: 309 ocorrências em 2025-11/2026-10, 9 naturezas, soma 309

Gravado: src\dados\recife\crime\ocorrencias.json e meta.json
Requisições ao Crime Brasil nesta execução: 67 (as demais vieram do cache)
Período: 2025-11 a 2026-10; atualizado em (JSON-LD): 2026-10-01; licença declarada pelo site: https://creativecommons.org/licenses/by/4.0/
Contatos de divisa abaixo de 50 m (fora do escopo): gracas/encruzilhada 3 m; madalena/paissandu 2 m
Pendências: pau-ferro (nenhum link do site corresponde ao slug "pau-ferro"); recife (página sem a estrutura esperada em https://crimebrasil.com.br/bairro/pe/recife/recife: temporalCoverage inválido: undefined)
```

Reexecução a partir do cache, com a mensagem de pendência já refinada para "Recife (bairro)" (a única mudança de código depois da coleta; o `ocorrencias.json` saiu idêntico ao da execução anterior, conferido com `cmp`):

```
  vasco-da-gama: 309 ocorrências em 2025-11/2026-10, 9 naturezas, soma 309 (cache)

Gravado: src\dados\recife\crime\ocorrencias.json e meta.json
Requisições ao Crime Brasil nesta execução: 0 (as demais vieram do cache)
Período: 2025-11 a 2026-10; atualizado em (JSON-LD): 2026-10-01; licença declarada pelo site: https://creativecommons.org/licenses/by/4.0/
Contatos de divisa abaixo de 50 m (fora do escopo): gracas/encruzilhada 3 m; madalena/paissandu 2 m
Pendências: pau-ferro (nenhum link do site corresponde ao slug "pau-ferro"); recife (página sem a estrutura esperada em https://crimebrasil.com.br/bairro/pe/recife/recife: a página diz que o bairro não tem ocorrências nos últimos 12 meses e só mostra o período inteiro (janela diferente das demais))
```

`npm run verificar`:

```
> vereda@0.1.0 verificar
> npm run typecheck && npm run lint && npm test
> vereda@0.1.0 typecheck
> tsc --noEmit
> vereda@0.1.0 lint
> expo lint
> vereda@0.1.0 test
> jest
PASS tests/descarte.test.ts
PASS tests/extrator-url.test.ts
PASS tests/comparar.test.ts
PASS tests/dominio.test.ts
PASS tests/leitor-decidir.test.ts
PASS tests/mensagem.test.ts
PASS tests/extrator-texto.test.ts
PASS tests/extrator-pagina.test.ts
PASS tests/dossie.test.ts
PASS tests/montar.test.ts
PASS tests/persistir-analises.test.ts
PASS tests/extrator-estado.test.ts
PASS tests/migracao.test.ts
PASS tests/custos.test.ts
PASS tests/analise.test.ts
PASS tests/endereco.test.ts
PASS tests/crime-recife.test.ts
PASS tests/buscar.test.ts (5.049 s)
PASS tests/dossie-tela.test.ts (10.581 s)
PASS tests/formulario.test.ts (10.761 s)
PASS tests/telas-fatia5.test.ts (12.071 s)
PASS tests/indice-recife.test.ts (12.103 s)
PASS tests/visita.test.ts (12.535 s)
Test Suites: 23 passed, 23 total
Tests:       1 skipped, 906 passed, 907 total
Snapshots:   0 total
Time:        13.539 s
Ran all test suites.
```

**Os 66 bairros novos** (contagem bruta de registros, janela 2025-11 a 2026-10, em ordem alfabética; sem taxa, ranking nem nota). Total geral dos 92 bairros: 26.185 ocorrências. Em todos, total = soma das naturezas.

| Bairro | Total | Naturezas | Página no site |
|---|---:|---:|---|
| Afogados | 814 | 9 | `afogados` |
| Água Fria | 712 | 9 | `agua-fria` |
| Alto do Mandu | 75 | 9 | `alto-do-mandu` |
| Alto José Bonifácio | 151 | 9 | `alto-jose-bonifacio` |
| Alto José do Pinho | 161 | 9 | `alto-jose-do-pinho` |
| Alto Santa Terezinha | 71 | 9 | `alto-santa-terezinha` |
| Apipucos | 65 | 9 | `apipucos` |
| Areias | 491 | 9 | `areias` |
| Arruda | 231 | 9 | `arruda` |
| Barro | 336 | 9 | `barro` |
| Beberibe | 147 | 9 | `beberibe` |
| Bomba do Hemetério | 215 | 9 | `bomba-do-hemeterio` |
| Bongi | 156 | 9 | `bongi` |
| Brasília Teimosa | 242 | 9 | `brasilia-teimosa` |
| Brejo da Guabiraba | 138 | 9 | `brejo-da-guabiraba` |
| Brejo de Beberibe | 136 | 9 | `brejo-de-beberibe` |
| Cabanga | 84 | 9 | `cabanga` |
| Caçote | 85 | 9 | `cacote` |
| Cajueiro | 112 | 9 | `cajueiro` |
| Campina do Barreto | 165 | 9 | `campina-do-barreto` |
| Campo Grande | 615 | 9 | `campo-grande` |
| Caxangá | 244 | 9 | `caxanga` |
| Cidade Universitária | 154 | 9 | `cidade-universitaria` |
| Coelhos | 102 | 9 | `coelhos` |
| Cohab | 666 | 9 | `cohab` |
| Coqueiral | 105 | 9 | `coqueiral` |
| Cordeiro | 811 | 9 | `cordeiro` |
| Córrego do Jenipapo | 82 | 9 | `corrego-do-jenipapo` |
| Curado | 286 | 9 | `curado` |
| Dois Irmãos | 142 | 9 | `dois-irmaos` |
| Dois Unidos | 483 | 9 | `dois-unidos` |
| Engenho do Meio | 217 | 9 | `engenho-do-meio` |
| Estância | 159 | 9 | `estancia` |
| Fundão | 108 | 9 | `fundao` |
| Guabiraba | 228 | 9 | `guabiraba` |
| Hipódromo | 45 | 9 | `hipodromo` |
| Ilha do Leite | 113 | 9 | `ilha-do-leite` |
| Ilha Joana Bezerra | 312 | 9 | `ilha-joana-bezerra` |
| Ipsep | 395 | 9 | `ipsep` |
| Iputinga | 874 | 9 | `iputinga` |
| Jardim São Paulo | 666 | 9 | `jardim-sao-paulo` |
| Jiquiá | 161 | 9 | `jiquia` |
| Linha do Tiro | 195 | 9 | `linha-do-tiro` |
| Macaxeira | 403 | 9 | `macaxeira` |
| Mangabeira | 54 | 9 | `mangabeira` |
| Mangueira | 95 | 9 | `mangueira` |
| Monteiro | 38 | 9 | `monteiro` |
| Morro da Conceição | 76 | 9 | `morro-da-conceicao` |
| Mustardinha | 150 | 9 | `mustardinha` |
| Nova Descoberta | 417 | 9 | `nova-descoberta` |
| Paissandu | 51 | 9 | `paissandu` |
| Passarinho | 223 | 9 | `passarinho` |
| Peixinhos | 2 | 1 | `peixinhos` |
| Ponto de Parada | 21 | 7 | `ponto-de-parada` |
| Porto da Madeira | 86 | 9 | `porto-da-madeira` |
| San Martin | 449 | 9 | `san-martin` |
| Sancho | 104 | 9 | `sancho` |
| Santo Antônio | 321 | 9 | `santo-antonio` |
| São José | 451 | 9 | `sao-jose` |
| Sítio dos Pintos | 65 | 9 | `sitio-dos-pintos` |
| Soledade | 72 | 9 | `soledade` |
| Tejipió | 197 | 9 | `tejipio` |
| Torrões | 464 | 9 | `torroes` |
| Totó | 68 | 9 | `toto` |
| Várzea | 901 | 9 | `varzea` |
| Vasco da Gama | 309 | 9 | `vasco-da-gama` |

**Ainda não verificado (além do que já estava na lista acima)**

- Não conferi se as contagens dos 66 bairros novos batem com alguma outra fonte; não havia CSV de referência para eles. Só a soma interna (total × naturezas) e a janela comum foram checadas.
- Soma dos 92 bairros não é o total de Recife: faltam 2 bairros e os registros sem bairro (cerca de 4% no estado, segundo a página da fonte). Não comparei com os 27.085 do município citados em `inv2`, que são de outra janela e eu não recoletei.
- Por que o Crime Brasil não tem página para Pau-Ferro e trata "Recife" de forma diferente: não investiguei.

### Correção: páginas `recife` e `centro` (pedido do usuário)

O usuário apontou que `https://crimebrasil.com.br/bairro/pe/recife/recife` e `.../centro` têm dados. Minha afirmação anterior estava incompleta: **a subseção anterior tratava "Recife (bairro)" como página sem a estrutura esperada e deixava `centro` na lista de links sem correspondência. Isso está superado por esta subseção.** Reli as duas páginas (a de `recife` já estava no cache; a de `centro` baixei agora, 1 requisição, 98ª da tarefa, mesmo User-Agent e regras).

**`recife` (bairro "Recife", bairros.ts: "Recife (bairro)")**

- Tem dados, mas **históricos**: a página diz que o bairro "não tem ocorrências registradas nos últimos 12 meses" e mostra o período inteiro disponível, sem datas: 112 registros (Roubo 67, Furto 45; fecha com a soma). O JSON-LD não traz `temporalCoverage`.
- Por isso não tem a janela de 12 meses das demais. Entrou em `ocorrencias.json` com `janela: "todo-o-periodo"` e `periodo: null` (não inventei datas). Ficou de fora da soma de registros do `meta.json` e há uma limitação escrita dizendo para não comparar nem somar com os demais.
- O nome na página é "Recife"; bairros.ts diz "Recife (bairro)". O script agora aceita o nome sem o sufixo "(bairro)". Que a página `recife` seja de fato o bairro do centro antigo, e não outra coisa, vem da combinação slug + aceitação do usuário, não de verificação minha.

**`centro`**

- Tem dados normais de 12 meses (2025-11/2026-10): 333 ocorrências, 9 naturezas (inclui "Vias de Fatos", que outros bairros também têm), total = soma.
- **"Centro" não é um dos 94 bairros oficiais** (não está em bairros.ts nem nos aliases). Em vez de forçar uma associação, gravei num bloco à parte, `foraDaListaOficial` em `ocorrencias.json`, com `motivo` explicando. Não sei se "Centro" se sobrepõe a bairros oficiais (Recife, Santo Antônio, São José, Boa Vista etc.); por isso não o somei a eles em nenhum lugar e há uma limitação dizendo "podem se sobrepor; não verificado".

**Mudanças de código e dados**

- `scripts/dados/coletar-crime-recife.mjs`: o parser reconhece a página sem janela (`janela: "12-meses" | "todo-o-periodo"`; `periodo` nulo na segunda) e exige que o rótulo do total combine com a janela; novo bloco `EXTRAS_FORA_DA_LISTA` (só `centro`); regra de nome sem "(bairro)".
- `ocorrencias.json`: 93 bairros (5 alvos, 21 vizinhos, 67 outros, entre eles `recife`) + 1 em `foraDaListaOficial` (`centro`). Todo bairro ganhou o campo `janela`; os valores anteriores (92 bairros) não mudaram, conferido campo a campo.
- `meta.json`: `paginasLidas` 94; `registrosLidos` 26.518 (só janela de 12 meses: os 92 bairros com janela + Centro); `pendencias` agora só `pau-ferro`; duas limitações novas.
- Testes: 18 (eram 15). Nova fixture sintética `tests/fixtures/crime-bairro-historico-sintetico.html`; testes de parser da página sem janela, do esquema com `janela` coerente com `periodo`, do bloco `foraDaListaOficial` e das limitações.

**Saída literal (execução a partir do cache, versão final do script):**

```
Coleta de crime por bairro (Crime Brasil, registros da SDS-PE)

  robots.txt permite /bairro/pe/recife/* para "User-agent: *" (lido em 2026-11-17T00:37:13Z, cache)
  [...]
  tejipio: 197 ocorrências em 2025-11/2026-10, 9 naturezas, soma 197 (cache)
  torroes: 464 ocorrências em 2025-11/2026-10, 9 naturezas, soma 464 (cache)
  toto: 68 ocorrências em 2025-11/2026-10, 9 naturezas, soma 68 (cache)
  varzea: 901 ocorrências em 2025-11/2026-10, 9 naturezas, soma 901 (cache)
  vasco-da-gama: 309 ocorrências em 2025-11/2026-10, 9 naturezas, soma 309 (cache)

Rótulos do site fora da lista oficial
  centro: 333 ocorrências em 2025-11/2026-10, 9 naturezas, soma 333 (cache)

Gravado: src\dados\recife\crime\ocorrencias.json e meta.json
Requisições ao Crime Brasil nesta execução: 0 (as demais vieram do cache)
Período: 2025-11 a 2026-10; atualizado em (JSON-LD): 2026-10-01; licença declarada pelo site: https://creativecommons.org/licenses/by/4.0/
Contatos de divisa abaixo de 50 m (fora do escopo): gracas/encruzilhada 3 m; madalena/paissandu 2 m
Pendências: pau-ferro (nenhum link do site corresponde ao slug "pau-ferro")
Sem janela de 12 meses (período inteiro, não comparável): recife
```

`npm run verificar`:

```
> vereda@0.1.0 verificar
> npm run typecheck && npm run lint && npm test
> vereda@0.1.0 typecheck
> tsc --noEmit
> vereda@0.1.0 lint
> expo lint
> vereda@0.1.0 test
> jest
PASS tests/extrator-url.test.ts
PASS tests/descarte.test.ts
PASS tests/extrator-texto.test.ts
PASS tests/leitor-decidir.test.ts
PASS tests/dominio.test.ts
PASS tests/persistir-analises.test.ts
PASS tests/extrator-pagina.test.ts
PASS tests/comparar.test.ts
PASS tests/mensagem.test.ts
PASS tests/dossie.test.ts
PASS tests/montar.test.ts
PASS tests/migracao.test.ts
PASS tests/extrator-estado.test.ts
PASS tests/custos.test.ts
PASS tests/analise.test.ts
PASS tests/endereco.test.ts
PASS tests/crime-recife.test.ts
PASS tests/buscar.test.ts
PASS tests/formulario.test.ts (7.605 s)
PASS tests/dossie-tela.test.ts (7.684 s)
PASS tests/visita.test.ts (8.228 s)
PASS tests/indice-recife.test.ts (9.113 s)
PASS tests/telas-fatia5.test.ts (10.469 s)
Test Suites: 23 passed, 23 total
Tests:       1 skipped, 909 passed, 910 total
Snapshots:   0 total
Time:        11.377 s, estimated 14 s
Ran all test suites.
```

**Continua de fora**

- **Pau-Ferro**: a página do município no site não tem link para ele; não adivinhei URL.
- Os outros 3 rótulos da página do município que não casam com bairro oficial (`do-recife`, `barro-ais-03`, `setubal`): o usuário citou só `recife` e `centro`, então não os coletei. Se quiser, é uma página cada.

**Não verificado**

- Se `centro` e `recife` cobrem o mesmo território ou se `centro` se sobrepõe a bairros oficiais.
- Desde quando vão os 112 registros do `recife` (a página diz só "todo o período disponível"; a página da fonte fala em jan/2020 a set/2026 para a base inteira, mas não assumi isso para este bairro).
