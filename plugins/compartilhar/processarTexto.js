// "Ler no Vereda" no menu de seleção de texto do Android (ACTION_PROCESS_TEXT). O compartilhar do Chrome manda só o
// link; selecionar o trecho com os preços e escolher o Vereda no menu manda o texto que a pessoa está vendo.
//
// Uma atividade sem tela recebe o trecho e o repassa à MainActivity como um compartilhamento de texto comum
// (ACTION_SEND, text/plain), que o expo-share-intent já entrega ao JavaScript. Assim os dois caminhos chegam ao app
// pelo mesmo lugar.
const fs = require("node:fs");
const path = require("node:path");
const { AndroidConfig, withAndroidManifest, withDangerousMod } = require("expo/config-plugins");

const NOME_DA_ATIVIDADE = "ProcessarTextoActivity";
const ROTULO_NO_MENU = "Ler no Vereda";

/** Código Kotlin da atividade, no pacote da MainActivity. */
function codigoDaAtividade(pacote) {
  return `package ${pacote}

import android.app.Activity
import android.content.Intent
import android.os.Bundle

/**
 * "${ROTULO_NO_MENU}" no menu de seleção de texto. Repassa o trecho escolhido à MainActivity como um compartilhamento
 * de texto e fecha, sem tela própria. Gerado por plugins/compartilhar (não edite em android/).
 */
class ${NOME_DA_ATIVIDADE} : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val texto = intent?.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()
    if (!texto.isNullOrBlank()) {
      val repasse = Intent(this, MainActivity::class.java).apply {
        action = Intent.ACTION_SEND
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, texto)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      startActivity(repasse)
    }
    // Nada volta para o navegador: o trecho selecionado fica como estava.
    setResult(RESULT_CANCELED)
    finish()
  }
}
`;
}

/** Acrescenta a atividade ao manifesto, uma vez só (o prebuild pode rodar de novo sobre o mesmo projeto). */
function adicionarAtividade(manifesto) {
  const aplicacao = AndroidConfig.Manifest.getMainApplicationOrThrow(manifesto);
  const nome = `.${NOME_DA_ATIVIDADE}`;
  const atividades = (aplicacao.activity ?? []).filter((a) => a.$["android:name"] !== nome);
  atividades.push({
    $: {
      "android:name": nome,
      "android:label": ROTULO_NO_MENU,
      "android:exported": "true",
      "android:excludeFromRecents": "true",
      "android:noHistory": "true",
      "android:theme": "@android:style/Theme.NoDisplay",
    },
    "intent-filter": [
      {
        action: [{ $: { "android:name": "android.intent.action.PROCESS_TEXT" } }],
        category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
        data: [{ $: { "android:mimeType": "text/plain" } }],
      },
    ],
  });
  aplicacao.activity = atividades;
  return manifesto;
}

function caminhoDaAtividade(raizDoAndroid, pacote) {
  return path.join(raizDoAndroid, "app", "src", "main", "java", ...pacote.split("."), `${NOME_DA_ATIVIDADE}.kt`);
}

const withProcessarTexto = (config) => {
  const pacote = config.android?.package;
  if (!pacote) throw new Error("[compartilhar] falta android.package no app.json");

  config = withAndroidManifest(config, (mod) => {
    mod.modResults = adicionarAtividade(mod.modResults);
    return mod;
  });

  return withDangerousMod(config, [
    "android",
    async (mod) => {
      const arquivo = caminhoDaAtividade(mod.modRequest.platformProjectRoot, pacote);
      await fs.promises.mkdir(path.dirname(arquivo), { recursive: true });
      await fs.promises.writeFile(arquivo, codigoDaAtividade(pacote));
      return mod;
    },
  ]);
};

module.exports = {
  NOME_DA_ATIVIDADE,
  ROTULO_NO_MENU,
  adicionarAtividade,
  caminhoDaAtividade,
  codigoDaAtividade,
  withProcessarTexto,
};
