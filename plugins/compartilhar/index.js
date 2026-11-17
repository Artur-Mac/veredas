// Plugin do Expo para receber o anúncio por compartilhamento, sem copiar e colar (ver
// docs/produto/pesquisa-2026-10-20/08-COMPARTILHAR-PARA-O-VEREDA.md).
//
// - iOS: extensão de compartilhamento do Safari, do expo-share-intent, com a coleta da página injetada no arquivo de
//   pré-processamento. A extensão guarda a coleta no grupo de apps e abre o Vereda.
// - Android: o compartilhar de texto (ACTION_SEND text/plain), do expo-share-intent, e "Ler no Vereda" no menu de
//   seleção de texto (ACTION_PROCESS_TEXT), deste plugin.
//
// Nada aqui troca o user agent, abre página escondida ou passa por proxy: a leitura é a da página que a pessoa já
// abriu no navegador dela.
const { withPlugins } = require("expo/config-plugins");
// O plugin da biblioteca é exportado como `default` (módulo compilado de TypeScript).
const withShareIntent = require("expo-share-intent/app.plugin").default;
const { trechoDoPreprocessador } = require("./coletaDaPagina");
const { ROTULO_NO_MENU, withProcessarTexto } = require("./processarTexto");

/**
 * Opções do expo-share-intent. Exportadas para o teste conferir o que vai para o app.
 * @returns {import("expo-share-intent/plugin/build/types").Parameters}
 */
function opcoesDoShareIntent() {
  return {
    // Página do Safari (com a coleta), link solto e texto selecionado. Imagem e arquivo não entram.
    iosActivationRules: {
      NSExtensionActivationSupportsWebURLWithMaxCount: 1,
      NSExtensionActivationSupportsWebPageWithMaxCount: 1,
      NSExtensionActivationSupportsText: true,
    },
    // O nome que aparece na folha de compartilhar. "Vereda" sozinho colidiria com o alvo do app no Xcode.
    iosShareExtensionName: ROTULO_NO_MENU,
    preprocessorInjectJS: trechoDoPreprocessador(),
    androidIntentFilters: ["text/*"],
  };
}

function withCompartilhar(config) {
  return withPlugins(config, [[withShareIntent, opcoesDoShareIntent()], withProcessarTexto]);
}
withCompartilhar.opcoesDoShareIntent = opcoesDoShareIntent;

module.exports = withCompartilhar;
