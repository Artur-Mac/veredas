# VEREDA — Validação da primeira entrega da POC

19/10/2026. Escopo: núcleo das épocas 0–2 de `PLANO-POC-EXECUCAO.md`.

## Implementado e verificado

- Entrada pelo link sem navegação durante a digitação. Links comuns abrem formulário próprio, sem receber automaticamente dados de Boa Viagem.
- Novo imóvel para aluguel ou compra, região, URL de referência, área e parcelas.
- Cálculo real de subtotal mensal; IPTU anual dividido por 12; lacunas preservadas como desconhecidas; preço de compra separado.
- Gravação local validada, reabertura após recarga, edição, checklist, notas e exclusão confirmada.
- Perguntas derivadas das lacunas e cópia para a área de transferência. Nenhuma mensagem enviada automaticamente.
- Seleção de dois imóveis e comparação dos valores informados.
- Tipografia da marca embarcada e cores centrais alinhadas a `index.html`; isso não comprova fidelidade integral de layout, navegação e experiência, que ainda deve ser revisada contra esse arquivo. Controles com estados acessíveis no navegador.

## Evidências de execução

| Verificação | Resultado |
|---|---|
| `npm run verificar` | TypeScript, ESLint e 18 testes passaram |
| `npm run test:poc` com servidor em 8087 | Fluxo integrado passou em Chromium |
| `EXPO_OFFLINE=1 npx expo export --platform all --output-dir out/poc-export` | Bundles web, Android e iOS gerados |
| Desktop 1440 × 1000 | Revisado visualmente |
| Celular no navegador 375 × 812 | Revisado visualmente; sem overflow horizontal do documento no teste |
| Tema escuro e preferência de movimento reduzido | Captura revisada e fluxo executado |
| Celular físico / simulador nativo | Não executado; exportação não substitui teste em aparelho |

O teste integrado usa um contexto de navegador isolado. Cria Apartamento Aurora e Apartamento Jardim, valida erro de formulário vazio, salva dados e checklist, copia perguntas, recarrega, verifica recuperação, edita, compara e exclui um imóvel. Ao final, verifica a permanência do outro e ausência de erros de execução da página. Os cálculos são cobertos também por testes de domínio.

A configuração anterior de Jest falhava antes de executar qualquer teste por não localizar `expo-modules-core`, instalado sob `expo/node_modules`. A busca de módulos agora inclui esse diretório, mantendo também a resolução padrão.

## Revisão visual e correções

Primeira rodada: captura do caderno vazio mostrou uma sequência literal `\n` no título e botão principal em ferrugem. Corrigidos texto e token de ação para laranja com texto escuro. Revisão do formulário confirmou rótulos permanentes e espaçamento legível a 375 px.

Segunda rodada: inspeção do caderno preenchido em desktop e do formulário em celular, mais tema escuro. A verificação automatizada revelou que os checkboxes guardavam corretamente os dados, mas o DOM não expunha `aria-checked`. Corrigidos checkbox, seletor segmentado e switch; os botões também expõem seus estados. Ajustados seletores do teste para usar os controles da tela ativa, pois o navegador mantém telas anteriores na pilha.

Capturas locais:

- `out/poc/desktop-caderno.png`
- `out/poc/desktop-escuro.png`
- `out/poc/mobile-editor.png`
- `out/poc/mobile-comparacao.png`

## Limites e continuidade

- Não há scraping, extração automática de links, API municipal nova, autenticação ou sincronização entre aparelhos nesta entrega. Link é referência guardada; campos são informados pela pessoa.
- Dossiês antigos e painel de estados continuam como exemplos funcionais, não como referências de design ou UX. A única referência visual e de experiência é `/home/v/Documents/vereda/veredas/index.html`. O fluxo novo não comprova integrações descritas nesses exemplos.
- É necessário tocar em **Salvar análise**. A tela mostra alterações não salvas; ainda não há proteção completa contra fechar a aba ou sair com mudanças pendentes.
- Dados ficam no armazenamento local; não há backup/exportação do caderno nesta etapa. Uma falha de gravação é exibida e preserva os campos na tela.
- A comparação apresenta subtotais parciais com quantidade de parcelas pendentes, sem afirmar qual imóvel é melhor. Compra não inclui simulação de financiamento.
- Ainda falta avaliação em celular físico, revisão completa das telas históricas com as novas fontes e sessões com pessoas. O padrão visual é uma base coerente, não uma certificação de excelência de UX.

Próxima época: extração assistida a partir de texto/HTML e uma evidência externa verificável, com revisão dos campos antes de gravar. O plano completo e o prompt de continuidade estão em `docs/PLANO-POC-EXECUCAO.md`.
