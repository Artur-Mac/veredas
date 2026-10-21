# Compartilhar para o Vereda: o anúncio volta do navegador sem copiar

Implementação do caminho 1 de [07](07-LEITURA-DO-LINK-NO-CELULAR.md), 20/10/2026. A pessoa está no anúncio, no navegador do celular, e manda a página (iOS) ou o trecho dos preços (Android) para o Vereda. O app abre a revisão com preço, condomínio e IPTU preenchidos.

Só funciona no **build de desenvolvimento** (ou num build de loja). No Expo Go o módulo nativo não existe: o app continua com "Abrir no navegador" e "Colar o que copiei", e a tela não fala de "Ler no Vereda".

## Como fica para a pessoa

| Aparelho | Gestos | O que chega ao app |
|---|---|---|
| iPhone, Safari | Compartilhar → **Ler no Vereda** | A página inteira que ela está vendo: endereço, título, blocos JSON-LD, estado da página (`__NEXT_DATA__`, `initial-data`, `__INITIAL_STATE__`) e o texto visível. Passa por `lerPagina`, como a coleta da WebView. |
| Android, Chrome | Selecionar o trecho → no menu da seleção, **Ler no Vereda** | O texto selecionado. Passa por `textoDoAnuncioCopiado` (só entra com valor em reais ou área). O link vem junto quando a pessoa abriu o anúncio pelo "Abrir no navegador" do Vereda, ou compartilhou o link antes, há menos de 30 minutos. |
| Android, qualquer app | Compartilhar → **Vereda** | O link (e o texto da mensagem, se for de anúncio). Abre a leitura do link, como se tivesse sido colado. |

O que não parece anúncio (uma senha, uma conversa) é descartado sem aparecer nem ser guardado, e a pessoa vê o aviso "O que você mandou não parece o anúncio". A página do Safari e o link aberto ficam só na memória do app, nunca no armazenamento, e somem com "Apagar meus dados deste aparelho".

Nada aqui troca o user agent, abre página escondida ou passa por proxy: a leitura é a da página que a pessoa já abriu no navegador dela.

## Onde está no código

| Peça | Arquivo | O que faz |
|---|---|---|
| Plugin do Expo | `plugins/compartilhar/index.js` | Junta o [expo-share-intent](https://github.com/achorein/expo-share-intent) 8.x (SDK 57) com o "Processar texto" do Android. Fica em `app.json` como `"./plugins/compartilhar"`. |
| Coleta no Safari | `plugins/compartilhar/coletaDaPagina.js` | A mesma coleta de `SCRIPT_COLETOR`, com os limites de `esquemaColetaDaPagina`. O plugin copia a função para o arquivo de pré-processamento da extensão (`NSExtensionJavaScriptPreprocessingFile`); a coleta viaja em `meta["vereda:coleta"]`. |
| Menu de seleção | `plugins/compartilhar/processarTexto.js` | Gera `ProcessarTextoActivity.kt` (sem tela, filtro `ACTION_PROCESS_TEXT`, rótulo "Ler no Vereda"), que repassa o trecho à `MainActivity` como `ACTION_SEND` de texto. Assim os dois caminhos chegam pelo mesmo lugar. |
| Montagem | `src/dados/extrator/compartilhado.ts` | Funções puras: valida a coleta, acha o link no texto, filtra o trecho e monta os parâmetros de `/ler`. |
| Memória | `src/estado/compartilhamento.ts` | Coleta da página (grande demais para a rota), link aberto no navegador, hora do último recebimento. |
| Recebedor | `src/componentes/leitor/RecebedorDeCompartilhamento.tsx`, em `src/app/_layout.tsx` | Lê o compartilhamento, limpa a cópia nativa, fecha a aba do Safari aberta pelo Vereda (iOS) e abre `/ler`. |
| Link do Safari | `src/app/+native-intent.tsx`, `src/app/(abas)/receber.tsx` | A extensão abre `vereda://dataUrl=…`; ele vai para a espera "Abrindo o anúncio" (aba escondida, como a leitura), trocada pela leitura assim que a página chega. Se nada chegar em 6 s, a tela diz o que fazer. |
| Leitura | `src/app/(abas)/ler.tsx` | Parâmetros `origem=compartilhado`, `coleta`, `url` e `texto`. Com dado recebido, a WebView não abre; a área de transferência não é lida por cima de um compartilhamento. |

Os nomes no aparelho: extensão `br.vereda.prototipo.share-extension` (alvo `LernoVereda` no Xcode), grupo de apps `group.br.vereda.prototipo`.

## Gerar o build de desenvolvimento

O `eas.json` tem os perfis `development` (aparelho, APK no Android), `development-simulator` (simulador do iOS) e `preview`. As pastas `android/` e `ios/` não vão para o Git: o prebuild as gera a partir do `app.json` e dos plugins.

### Passos que dependem de uma pessoa

1. **Conta Expo** (gratuita). No terminal, na raiz do projeto:

   ```bash
   npx eas-cli@latest login
   ```

   ```bash
   npx eas-cli@latest init
   ```

   O `init` cria o projeto no Expo e grava `extra.eas.projectId` no `app.json`. Faça commit dessa linha.

2. **Android: não precisa de conta Google** para o build de desenvolvimento. A taxa do Google Play (US$ 25, uma vez) só entra na publicação.

   ```bash
   npx eas-cli@latest build --profile development --platform android
   ```

   No fim, o EAS mostra um link e um QR para instalar o APK no celular (permitir "instalar apps desconhecidos" no navegador).

3. **iPhone: precisa do Apple Developer Program** (US$ 99 por ano). Registre o aparelho e gere o build:

   ```bash
   npx eas-cli@latest device:create
   ```

   ```bash
   npx eas-cli@latest build --profile development --platform ios
   ```

   O EAS pede o login da Apple, cria os certificados dos **dois** alvos (o app e a extensão `LernoVereda`) e liga o grupo de apps `group.br.vereda.prototipo` nos dois. Se o identificador `br.vereda.prototipo` já estiver em uso em outra conta Apple, troque `ios.bundleIdentifier` no `app.json` (a extensão e o grupo acompanham).

   Sem conta Apple, dá para testar a extensão no **simulador**, num Mac com Xcode: `npx eas-cli@latest build --profile development-simulator --platform ios`.

4. Com o app de desenvolvimento instalado:

   ```bash
   npx expo start --dev-client
   ```

   Abra o Vereda de desenvolvimento no celular e leia o QR.

### Build local, sem EAS

Android, com JDK 17 e o Android SDK instalados (Android Studio):

```bash
npx expo run:android
```

iOS, num Mac com Xcode e CocoaPods: `npx expo run:ios --device`, com o time de desenvolvimento escolhido no Xcode para os alvos `Vereda` e `LernoVereda`.

O `expo prebuild` troca os scripts `android` e `ios` do `package.json` para `expo run:…`. Não faça commit dessa troca: o projeto continua usando o Expo Go no dia a dia.

## Roteiro do teste no aparelho

Para cada portal (ZAP, VivaReal, OLX, QuintoAndar), anote: a opção aparece, o app abre na leitura, e os três números (preço ou aluguel, condomínio, IPTU) chegam preenchidos.

**iPhone**

1. No app Safari (fora do Vereda), abra um anúncio do ZAP. Toque em Compartilhar. Na fila de apps, toque em **Ler no Vereda** (na primeira vez pode estar em "Mais"; dá para fixar em "Editar ações").
2. Esperado: "Abrindo o anúncio", depois a leitura com "Lemos a página que você compartilhou. Confira os números abaixo." e os três números na revisão, com a etiqueta "do anúncio".
3. No Vereda, cole um link do ZAP e toque em "Abrir no navegador". Na aba do Safari que abre por cima do app, toque em Compartilhar e veja se **Ler no Vereda** aparece ali também. Se aparecer, a aba fecha sozinha e a leitura abre preenchida. Se não aparecer, o caminho dessa aba fica sendo copiar e voltar (anote no relatório).

**Android**

1. No Vereda, cole um link do ZAP e toque em "Abrir no navegador".
2. No Chrome, selecione o trecho de aluguel, condomínio e IPTU. No menu da seleção (pode estar nos três pontos), toque em **Ler no Vereda**.
3. Esperado: a leitura com "Lemos o trecho que você escolheu." e os três números; o link do passo 1 entra junto (tipo, quartos, área e bairro no cartão).
4. No Chrome, compartilhe o link do anúncio e escolha **Vereda**. Esperado: a leitura do link. No ZAP, a página bloqueia e o cartão "Abra o anúncio no navegador" ensina o "Ler no Vereda".

## O que foi verificado e o que não foi

Verificado nesta máquina (Linux, sem Java, sem Android SDK, sem Mac):

- `npm run verificar` limpo: tipos, lint e 1.190 testes, 31 deles novos em `tests/compartilhar.test.ts`. Entre eles: a coleta do Safari devolve exatamente o mesmo objeto que `SCRIPT_COLETOR` em cinco páginas (inclusive acima dos limites e com o desafio da Cloudflare); o arquivo de pré-processamento **gerado pelo plugin** roda numa página falsa do ZAP e, passando pelo JavaScript da biblioteca, rende aluguel 4.500, condomínio 1.190 e IPTU 288 na revisão, sem abrir a WebView; um erro na coleta ainda entrega o link; o trecho do Android junta o link aberto e não lê a área de transferência.
- `npx expo prebuild --platform all --no-install` gera os dois projetos: o manifesto do Android com `ProcessarTextoActivity` (PROCESS_TEXT, text/plain) e o `ACTION_SEND` text/* na `MainActivity`; no iOS, o alvo `LernoVereda` embutido no app, com a regra de ativação (página, link e texto), o arquivo de pré-processamento com a coleta (sintaxe conferida com `node --check`) e o grupo de apps nas permissões do app e da extensão.
- Na web: o app abre com a biblioteca nova; `/ler` com um trecho recebido preenche os três números e mostra o aviso; `/receber` mostra a espera e, depois de 6 s, "O anúncio não chegou".

Não verificado (depende de um build e de um aparelho):

1. **A compilação** dos dois builds (o Kotlin da atividade e a extensão em Swift do expo-share-intent).
2. A folha de compartilhar do Safari com a página real do ZAP: se a página traz `__NEXT_DATA__`, JSON-LD e o texto com os preços, e se `window.__INITIAL_STATE__` é visível do arquivo de pré-processamento (ele pode rodar isolado das variáveis da página; os blocos `<script>` do documento são lidos de qualquer forma).
3. Se "Ler no Vereda" aparece na folha de compartilhar da aba do Safari aberta pelo próprio Vereda (`openBrowserAsync`). Se não aparecer, a alternativa é abrir o Safari de verdade (`Linking.openURL`) quando o módulo existir.
4. O tamanho: uma página com `__NEXT_DATA__` de vários megabytes passa pelo grupo de apps (`UserDefaults`) e pela ponte até o JavaScript. Os limites são os do esquema (3 MB por estado), mas o tempo e a memória da extensão só o aparelho mostra.
5. O "Ler no Vereda" no menu de seleção do Chrome e de outros navegadores do Android (Samsung Internet, Firefox), e a volta para a leitura com o app já aberto e com o app fechado.
