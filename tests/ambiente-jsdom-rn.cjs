// Ambiente jsdom para testes que juntam o preset do React Native com o React DOM (ex.: toque-no-svg).
// O setup do preset do RN redefine `window` no global; no jsdom 26 (jest 30) `window` é imutável e isso lança
// "Cannot redefine property: window". Aqui `window` já é o próprio global, então só essa chave é ignorada.
const { TestEnvironment } = require("jest-environment-jsdom");

class AmbienteJsdomComReactNative extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    const global = this.global;
    const definir = global.Object.defineProperties;
    global.Object.defineProperties = function (alvo, propriedades) {
      if (alvo === global && propriedades && Object.prototype.hasOwnProperty.call(propriedades, "window")) {
        const { window: _ignorada, ...resto } = propriedades;
        return definir.call(this, alvo, resto);
      }
      return definir.call(this, alvo, propriedades);
    };
  }
}

module.exports = AmbienteJsdomComReactNative;
