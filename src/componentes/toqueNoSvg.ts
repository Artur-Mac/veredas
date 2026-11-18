// Toque numa forma do react-native-svg (Polygon, Line, Path…) sem erro de console na web (T4, 18/11/2026).
//
// Na web, o react-native-svg (web/utils/prepare.ts) trata `onPress` de dois jeitos ao mesmo tempo: liga `onClick` e, além
// disso, espalha no elemento do DOM os seis handlers de responder do React Native (onStartShouldSetResponder,
// onResponderTerminationRequest, onResponderGrant, onResponderMove, onResponderRelease, onResponderTerminate). O React
// DOM não conhece essas props: "Unknown event handler property `onStartShouldSetResponder`. It will be ignored.", seis
// vezes por tela. Elas não fazem nada ali: quem responde ao toque na web é o clique.
//
// Aqui a forma recebe o clique direto. `onPress: null` (e não a prop ausente) é de propósito: sem `onPress` o prepare
// regrava `onClick` com undefined; com null ele não mexe e também não espalha os handlers de responder.
// No nativo nada muda: `onPress`, como sempre.
import { Platform } from "react-native";

type PropsDeToque = { onPress?: () => void };

/** Props de toque para espalhar numa forma SVG: `{...toqueNoSvg(aoTocar)}`. Sem `aoTocar`, a forma não é tocável. */
export function toqueNoSvg(aoTocar: (() => void) | null | undefined, plataforma: string = Platform.OS): PropsDeToque {
  if (!aoTocar) return {};
  if (plataforma !== "web") return { onPress: aoTocar };
  return { onPress: null, onClick: () => aoTocar() } as unknown as PropsDeToque;
}
