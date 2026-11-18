// Como o ruído estimado aparece (decisão A2 do Samuel, 18/11/2026): os dB(A) de dia e à noite com "(estimativa)", a
// faixa de ±5 dB, a comparação com a NBR 10151, a nota de sossego e, a um toque, a ficha "Como foi calculado" nos 6
// campos da ficha de método (o que mede, fonte, data, cálculo, limite, o que fazer na visita), com as fontes que mais
// pesam e os vieses conhecidos. Segue o desenho da ficha de método dos indicadores (dossie-v1/Indicadores.tsx).
// Regra de tela: todo "dB" vem com "estimativa" ou "estimado"; os textos vêm prontos de src/dados/ruido/leitura.ts.
import { useState } from "react";
import { View } from "react-native";
import type { EstimativaDeRuido, RuidoEstimado } from "../../dados/ruido/estimativa";
import { useTema } from "../../tema/Tema";
import { TOQUE_MINIMO } from "../../tema/tokens";
import { AlvoDeToque } from "../Pressionavel";
import { Texto } from "../Texto";

const NUMEROS = { fontVariant: ["tabular-nums" as const] };

/** Os números da estimativa, do mais importante para o detalhe. Sem leitura, diz isso e o que falta. */
export function LeituraDoRuido({ estimativa, testID = "ruido-estimado" }: { estimativa: EstimativaDeRuido; testID?: string }) {
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
      <Texto testID={`${testID}-nota`} tipo="corpo" style={[{ fontSize: 13.5, lineHeight: 19, fontWeight: "600" }, NUMEROS]}>{t.nota}</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={[{ fontSize: 12.5, lineHeight: 18 }, NUMEROS]}>{t.faixa}</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={[{ fontSize: 12.5, lineHeight: 18 }, NUMEROS]}>{t.nbr}</Texto>
      <Texto testID={`${testID}-aviso`} tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12.5, lineHeight: 18, fontWeight: "600" }}>{t.aviso}</Texto>
    </View>
  );
}

function linhasDaFicha(e: RuidoEstimado): readonly [string, string][] {
  const f = e.textos.ficha;
  return [
    ["O que mede", f.oQueMede],
    ["Fonte", f.fonte],
    ["Data", f.data],
    ["Cálculo", f.calculo],
    ["Limite", f.limite],
    ["O que fazer na visita", f.naVisita],
  ];
}

/** "Como foi calculado", a um toque: as fontes que mais pesam, os 6 campos da ficha de método e o aviso de estimativa. */
export function FichaComoFoiCalculado({ estimativa, testID = "ruido-ficha", abertaDeInicio = false }: { estimativa: EstimativaDeRuido; testID?: string; abertaDeInicio?: boolean }) {
  const { cor } = useTema();
  const [aberta, setAberta] = useState(abertaDeInicio);
  if (estimativa.estado !== "estimado") return null;
  const t = estimativa.textos;
  return (
    <View testID={testID}>
      <AlvoDeToque
        testID={`${testID}-toggle`}
        onPress={() => setAberta((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberta }}
        accessibilityLabel={aberta ? "Ocultar como o ruído foi calculado" : "Ver como o ruído foi calculado"}
        style={{ minHeight: TOQUE_MINIMO, justifyContent: "center" }}
      >
        <Texto tipo="apoio" cor="cor-azul-cadastral" style={{ fontSize: 12.5, lineHeight: 17, fontWeight: "600" }}>
          {aberta ? "Ocultar como foi calculado" : "Como foi calculado (ficha de método)"}
        </Texto>
      </AlvoDeToque>
      {aberta ? (
        <View testID={`${testID}-conteudo`} style={{ gap: 6, paddingBottom: 4 }}>
          <View style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 6, gap: 3 }}>
            <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>Fontes que mais pesam</Texto>
            {t.fontes.length ? (
              t.fontes.map((linha, i) => (
                <Texto key={`${i}:${linha}`} tipo="apoio" style={[{ fontSize: 12, lineHeight: 17 }, NUMEROS]}>{linha}</Texto>
              ))
            ) : (
              <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 17 }}>Nenhuma fonte acima do piso urbano perto deste prédio.</Texto>
            )}
          </View>
          {linhasDaFicha(estimativa).map(([rotulo, valor]) => (
            <View key={rotulo} style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 5, gap: 1 }}>
              <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>{rotulo}</Texto>
              <Texto tipo="apoio" style={[{ fontSize: 12, lineHeight: 17 }, NUMEROS]}>{valor}</Texto>
            </View>
          ))}
          <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 17, fontWeight: "600" }}>{t.aviso}</Texto>
        </View>
      ) : null}
    </View>
  );
}
