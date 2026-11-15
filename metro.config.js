// Metro com os arquivos de camada fora do bundle JS (D036, divisão do pacote).
// - Ao subir (expo start, expo export, build nativo), publica as camadas: copia cada arquivo listado nos módulos
//   gerados para public/dados (web, servido sob demanda) e assets/dados (nativo, asset empacotado) e regrava os
//   manifestos gerados. Ver scripts/dados/publicar-camadas.cjs.
// - `.vjson` é extensão de asset: no nativo cada camada vai no aplicativo como arquivo, não como módulo JS.
const { getDefaultConfig } = require("expo/metro-config");
const { publicarCamadas } = require("./scripts/dados/publicar-camadas.cjs");

publicarCamadas();

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...config.resolver.assetExts, "vjson"];

module.exports = config;
