# Contexto do projeto — Vereda

> Contexto geral e durável da aplicação, para agentes e pessoas. Cada linha aponta para a fonte viva; quando a fonte mudar, vale a fonte. O que não foi confirmado por uma pessoa está marcado **pendente**. Não copie aqui detalhes temporários de uma task.

| Campo | Valor |
| --- | --- |
| Produto / aplicação | Vereda: a pessoa cola o link de um anúncio de imóvel no Recife e recebe um dossiê de evidências (custo mensal, o prédio no cadastro da Prefeitura, entorno, perguntas para a visita) e a comparação entre imóveis |
| Responsáveis | Papéis do [`README.md`](../../README.md#-equipe-campus-mobile--15ª-edição): Samuel (Estratégia de Produto e Jornada do Usuário), Walter (Design e Interface), Artur (Pesquisa, Engenharia de Dados e Arquitetura de Software). Quem aprova cada etapa do fluxo: **pendente** (seção 5) |
| Hub de planos e tasks | Enemyhub, projeto "Vereda", id `8c0a06e6-76eb-4673-a858-d2dc65d0ea81`, pelo servidor MCP `enemyhub`. O servidor fica no repositório [`Mangue-Bit/EnemiesHub`](https://github.com/Mangue-Bit/EnemiesHub), pasta `mcp/` (`server.mjs`; instalação e token no `mcp/README.md`). Ferramentas usadas no fluxo: `enemyhub_get_project` (leitura) e `enemyhub_apply_changes` (gravação). Regras de uso em [`AGENTS.md`](../../AGENTS.md#fonte-da-verdade-o-enemyhub) |
| Repositório de código | <https://github.com/Artur-Mac/veredas> (`src/`, `scripts/`, `tests/`) |
| Repositório de documentação | O mesmo repositório, pasta [`docs/`](../README.md). Artefatos de plano e task em [`docs/planos/`](../planos/README.md) |
| Última revisão | 18/11/2026, rascunho montado por agente a partir do repositório (commit `05ebf0ec` de `main`) e do hub. Revisão humana: **pendente** |

## 1. Objetivo e limites

- **Usuários e problemas atendidos:** quem procura apartamento para alugar ou comprar no Recife e decide com anúncio incompleto. Fonte: [`README.md`](../../README.md) e subáreas do hub (Proposta de valor, Evidências).
- **Capacidades principais:** leitura do anúncio, caderno local, confirmação do prédio no cadastro, dossiê, visita, Comparar. Lista vigente, com dado e política de atualização de cada uma: [`docs/aplicacao/FEATURE-REGISTER.md`](../aplicacao/FEATURE-REGISTER.md); escopo e veredito de cada feature: hub.
- **Limites conhecidos:** só imóveis no município do Recife; as camadas por prédio rodam em parte dos bairros (ver hub e [`NEXT-PROGRAMME.md`](../aplicacao/NEXT-PROGRAMME.md)). Proibidos: previsão de preço, preço-alvo, ranking de bairros e adjetivo sobre bairro ([`AGENTS.md`](../../AGENTS.md#notas-e-avaliações-no-app)). Nada foi testado em celular físico nem com leitor de tela (tarefa aberta no hub).

## 2. Arquitetura e stack

- **Visão dos componentes e fluxo de dados:** aplicativo que roda no aparelho, sem servidor próprio. Os dados públicos são coletados e processados por `scripts/dados/` e gravados em `src/dados/recife/`; o app lê esses arquivos e guarda as análises da pessoa no aparelho. Fonte: [`docs/plano-recife/03-ARQUITETURA-E-DADOS.md`](../plano-recife/03-ARQUITETURA-E-DADOS.md) e [`docs/dados/README.md`](../dados/README.md).
- **Linguagens, frameworks e versões relevantes:** TypeScript 6.0, React 19.2, React Native 0.86, Expo SDK 57 com Expo Router, Zod 4, `react-native-svg` (os mapas são SVG próprios, sem biblioteca de mapas), AsyncStorage. Testes: Jest 29 com `jest-expo`, `fast-check`, Playwright nos testes de fluxo. Fonte: [`package.json`](../../package.json).
- **Serviços e integrações externas:** portais de anúncio (leitura da página do anúncio) e fontes públicas de dados. Inventário e licenças: documento "Fontes de dados" no hub, [`docs/plano-recife/09-DECISOES-E-FONTES.md`](../plano-recife/09-DECISOES-E-FONTES.md) e [`docs/dados/ODBL.md`](../dados/ODBL.md).
- **Dados e armazenamento:** esquemas em `src/dados/` (Zod); persistência local em `src/estado/`. O núcleo offline com SQLite não será feito agora (decisão de 18/11/2026 em [`AGENTS.md`](../../AGENTS.md#notas-e-avaliações-no-app)). Atualização das camadas: [`docs/aplicacao/RUNBOOK-ATUALIZACAO.md`](../aplicacao/RUNBOOK-ATUALIZACAO.md).
- **Ambientes e implantação:** web local (`npm run web`, porta 8087 em `.claude/launch.json`); perfis EAS `development`, `development-simulator` e `preview` em [`eas.json`](../../eas.json), todos de distribuição interna. Não há perfil de produção nem pipeline de publicação: **pendente**.

## 3. Convenções de desenvolvimento

- **Estrutura do repositório:** `src/app` (telas), `src/componentes`, `src/dados`, `src/estado`, `src/plataforma`, `src/tema`, `src/navegacao`, `src/nucleo`, `src/municipios`; `scripts/dados` (coleta e ciclo); `tests`; `motion`, `refs` e `motion-references` (pitch, com regras próprias no `AGENTS.md`); `docs`; `ignorar` (arquivo morto, não usar como fonte).
- **Branch, commits e PR:** branch padrão `main`; PR no GitHub para `main`, com o [modelo de PR](../../.github/pull_request_template.md). Commits em português no formato `tipo(escopo): descrição` (`feat`, `fix`, `docs`, `chore`, `style`). Branch de task: `<tipo>/T-xxxxxxxx-nome-curto` (convenção do [fluxo](fluxo-entrega.md#equivalências), **pendente** de confirmação).
- **Padrões de código e documentação:** [`AGENTS.md`](../../AGENTS.md) (hub, notas e avaliações, motion); contratos de tela em [`docs/plano-recife/02-EXPERIENCIA-E-CONTRATOS.md`](../plano-recife/02-EXPERIENCIA-E-CONTRATOS.md); regras de dado em [`docs/dados/crivo/CRIVO.md`](../dados/crivo/CRIVO.md). Interface e documentos novos em português; `docs/aplicacao/` foi escrito em inglês e segue assim.
- **Comandos de instalação, execução, testes e lint:** `npm install`; `npm run web` (ou `npm run start`); `npm run verificar` (`tsc --noEmit`, `expo lint` e `jest`); `npm run test:v1` com o servidor web ativo (porta 8087, ou `POC_URL`); `npm run camadas` publica as camadas de dados; ciclo de dados conforme o runbook. Motion: `node motion/render.mjs determinismo` e `node motion/render.mjs qa --passo pass-N`.
- **Critérios de conclusão e CI:** não há CI no GitHub (só o modelo de PR). A verificação obrigatória é `npm run verificar` local, mais os testes da área tocada (por exemplo `npx jest tests/lgpd-artefatos.test.ts` quando mexer em dados publicados). Critérios gerais: [`docs/plano-recife/07-QUALIDADE-E-ACEITE.md`](../plano-recife/07-QUALIDADE-E-ACEITE.md).

## 4. Segurança e operação

- **Autenticação, autorização e dados sensíveis:** o app não tem conta nem servidor. Dados que identificam pessoas ficam fora do repositório (lista no [`.gitignore`](../../.gitignore)) e fora dos artefatos publicados (`tests/lgpd-artefatos.test.ts`). Fixtures de anúncio são higienizadas, sem anunciante.
- **Segredos e configuração:** o token do hub é pessoal, gerado em "Minha conta" no hub e registrado com `claude mcp add --scope user enemyhub ...`; nunca vai para o repositório. O app não exige `.env`; `.env*.local` é ignorado pelo git.
- **Observabilidade e resposta a incidentes:** sem telemetria. Recuperação de uma atualização de dados (ponto de restauração e reversão): [runbook](../aplicacao/RUNBOOK-ATUALIZACAO.md).
- **Publicação e reversão:** publicação do app em loja: **pendente** (não definida). Dados derivados sob ODbL: [`docs/dados/ODBL.md`](../dados/ODBL.md); uso comercial depende do parecer jurídico (tarefa aberta no hub).

## 5. Decisões e dúvidas

- **Decisões arquiteturais:** hub (vereditos das features e documento "Linha do tempo de decisões"); registro técnico em [`docs/aplicacao/EPOCH-TRACKER.md`](../aplicacao/EPOCH-TRACKER.md) (seção "Decision log") e [`docs/plano-recife/09-DECISOES-E-FONTES.md`](../plano-recife/09-DECISOES-E-FONTES.md).
- **Restrições ou riscos atuais:** impedimentos no hub; pendências da última rodada em [`docs/aplicacao/unificacao-2026-11-19/HANDOFF.md`](../aplicacao/unificacao-2026-11-19/HANDOFF.md).
- **Como resolver conflito entre fontes:** vale o hub; corrija o doc ou aponte a divergência ao usuário ([`AGENTS.md`](../../AGENTS.md#fonte-da-verdade-o-enemyhub)).

Pendências deste contexto, para decisão humana:

| Pendência | Por que importa | Proposta |
| --- | --- | --- |
| Quem aprova a etapa funcional (Produto) e a técnica (Engenharia) | O fluxo para nessas duas aprovações | Samuel em Produto e Artur em Engenharia, pelos papéis do README. O `FEATURE-REGISTER` diz que os donos são papéis sem pessoa nomeada; falta confirmar |
| Onde a aprovação fica registrada | Sem registro com autor, a etapa não conta como aprovada | Comentário na feature do hub (Produto e Engenharia) e review no GitHub (PR) |
| Convenção de ID `F-`/`T-` com 8 caracteres do id do hub | Mesmo identificador no hub, na pasta, na branch e no PR | Adotar como está no [fluxo](fluxo-entrega.md#equivalências) |
| Publicação do app e reversão | A especificação técnica pede o plano de implantação | Marcar "Não se aplica" até existir perfil de produção |
