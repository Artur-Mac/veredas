// Como o ruído estimado aparece (decisão A2 do Samuel, 18/11/2026): os dB(A) de dia e à noite com "(estimativa)", a
// faixa de ±5 dB, a comparação com a NBR 10151, a nota de sossego e o aviso "Estimativa com dados abertos, não medição".
// A ficha "como foi calculada" é a ficha de método compartilhada (visual/FichaDeMetodo, decisão A13), com as fontes que
// mais pesam e os vieses conhecidos nos campos "cálculo" e "limite".
// Regra de tela: todo "dB" vem com "estimativa" ou "estimado"; os textos vêm prontos de src/dados/ruido/leitura.ts.
import { View } from "react-native";
import type { EstimativaDeRuido } from "../../dados/ruido/estimativa";
import { FichaDeMetodo } from "../visual/FichaDeMetodo";
import { Texto } from "../Texto";

const NUMEROS = { fontVariant: ["tabular-nums" as const] };

/** Os números da estimativa, do mais importante para o detalhe. Sem leitura, diz isso e o que falta. */
export function LeituraDoRuido({ estimativa, testID = "ruido-estimado", comNota = true }: { estimativa: EstimativaDeRuido; testID?: string; comNota?: boolean }) {
  if (estimativa.estado !== "estimado") {
    return (
      <View testID={`${testID}-sem-leitura`} style={{ gap: 2 }}>
        <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>{estimativa.textos.manchete}</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5, lineHeight: 18 }}>{estimativa.textos.explicacao}</Texto>
      </View>
    );
  }
  const t = estimativa.textos;
  return (
    <View testID={testID} style={{ gap: 4 }}>
      <Texto testID={`${testID}-manchete`} tipo="numero" style={[{ fontSize: 16, lineHeight: 22, fontWeight: "700" }, NUMEROS]}>{t.manchete}</Texto>
      {t.janela ? <Texto testID={`${testID}-janela`} tipo="corpo" style={[{ fontSize: 13.5, lineHeight: 19, fontWeight: "600" }, NUMEROS]}>{t.janela}</Texto> : null}
      {t.quarto ? <Texto testID={`${testID}-quarto`} tipo="apoio" cor="cor-texto-apoio" style={[{ fontSize: 12.5, lineHeight: 18 }, NUMEROS]}>{t.quarto}</Texto> : null}
      {comNota ? <Texto testID={`${testID}-nota`} tipo="corpo" style={[{ fontSize: 13.5, lineHeight: 19, fontWeight: "600" }, NUMEROS]}>{t.nota}</Texto> : null}
      <Texto tipo="apoio" cor="cor-texto-apoio" style={[{ fontSize: 12.5, lineHeight: 18 }, NUMEROS]}>{t.faixa}</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={[{ fontSize: 12.5, lineHeight: 18 }, NUMEROS]}>{t.nbr}</Texto>
      <Texto testID={`${testID}-aviso`} tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12.5, lineHeight: 18, fontWeight: "600" }}>{t.aviso}</Texto>
    </View>
  );
}

/** A ficha de método do ruído deste prédio, a um toque; sem leitura, nada. */
export function FichaDoRuidoEstimado({ estimativa, testID }: { estimativa: EstimativaDeRuido; testID: string }) {
  if (estimativa.estado !== "estimado") return null;
  return <FichaDeMetodo ficha={estimativa.textos.ficha} testID={testID} />;
}
