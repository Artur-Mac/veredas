import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { VereditoConfortoTermico } from "../../dados/clima/confortoTermico";
import { formatarReaisCompacto } from "../../dados/formatos";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO, type TokenDeCor } from "../../tema/tokens";

type Props = {
  modalidade: "compra" | "aluguel";
  precoPrincipalReais: number | null;
  mensalBolsoRealReais: number | null;
  dinheiroParaEntrarReais: number | null;
  comparacaoM2Pct: number | null;
  orientacaoCurta: string;
  conforto: VereditoConfortoTermico;
  ruidoDormitorioDb: number;
  spuAtivo?: boolean;
  aoTocarMetrica?: (alvo: "bolso" | "sol" | "ruido" | "predio") => void;
};

type CelulaPlacar = {
  id: "bolso" | "sol" | "ruido" | "predio";
  rotulo: string;
  valorGrande: string;
  subtitulo: string;
  corFundo: TokenDeCor;
  corBorda: TokenDeCor;
  corDestaque: TokenDeCor;
};

export function PlacarHeroi5Segundos({
  modalidade,
  precoPrincipalReais,
  mensalBolsoRealReais,
  dinheiroParaEntrarReais,
  comparacaoM2Pct,
  orientacaoCurta,
  conforto,
  ruidoDormitorioDb,
  spuAtivo = false,
  aoTocarMetrica,
}: Props) {
  const { cor } = useTema();
  const compra = modalidade === "compra";

  const precoTxt =
    precoPrincipalReais !== null
      ? compra
        ? formatarReaisCompacto(precoPrincipalReais)
        : `${formatarReaisCompacto(precoPrincipalReais)}/mês`
      : "A confirmar";

  const comparacaoTxt =
    comparacaoM2Pct !== null
      ? comparacaoM2Pct <= -5
        ? `${Math.abs(comparacaoM2Pct)}% abaixo do bairro`
        : comparacaoM2Pct >= 8
          ? `${comparacaoM2Pct}% acima do bairro`
          : "Na média do bairro"
      : compra && dinheiroParaEntrarReais
        ? `Entrada+cartório ~${formatarReaisCompacto(dinheiroParaEntrarReais)}`
        : "Confira os custos abaixo";

  const mensalTxt =
    mensalBolsoRealReais !== null
      ? `~${formatarReaisCompacto(mensalBolsoRealReais)}/mês`
      : "A calcular";

  const confortoQuente =
    conforto.zona === "quente_tarde" || conforto.zona === "tende_abafar";

  const ruidoAlto = ruidoDormitorioDb > 45;

  const celulas: CelulaPlacar[] = [
    {
      id: "bolso",
      rotulo: compra ? "VALOR PEDIDO" : "ALUGUEL + TAXAS",
      valorGrande: precoTxt,
      subtitulo: comparacaoTxt,
      corFundo: comparacaoM2Pct !== null && comparacaoM2Pct >= 10 ? "cor-barro-suave" : "cor-papel-claro",
      corBorda: comparacaoM2Pct !== null && comparacaoM2Pct >= 10 ? "cor-barro" : "cor-linha-forte",
      corDestaque: comparacaoM2Pct !== null && comparacaoM2Pct >= 10 ? "cor-barro-texto" : "cor-texto",
    },
    {
      id: "predio",
      rotulo: compra ? "SAÍDA REAL POR MÊS" : "TOTAL MENSAL REAL",
      valorGrande: mensalTxt,
      subtitulo: spuAtivo ? "Terreno da União (ver regra)" : compra ? "Parcela + cond. + IPTU + luz" : "Aluguel + cond. + IPTU + luz",
      corFundo: spuAtivo ? "cor-barro-suave" : "cor-papel-claro",
      corBorda: spuAtivo ? "cor-barro" : "cor-linha-forte",
      corDestaque: spuAtivo ? "cor-barro-texto" : "cor-texto",
    },
    {
      id: "sol",
      rotulo: "SOL & CONFORTO",
      valorGrande: orientacaoCurta,
      subtitulo: conforto.selo,
      corFundo: confortoQuente ? "cor-barro-suave" : "cor-salvia-suave",
      corBorda: confortoQuente ? "cor-barro" : "cor-salvia",
      corDestaque: confortoQuente ? "cor-barro-texto" : "cor-salvia-escura",
    },
    {
      id: "ruido",
      rotulo: "RUÍDO NO QUARTO",
      valorGrande: `~${Math.round(ruidoDormitorioDb)} dB`,
      subtitulo: ruidoAlto ? "Acima do silêncio noturno" : "Ambiente noturno calmo",
      corFundo: ruidoAlto ? "cor-barro-suave" : "cor-azul-cadastral-suave",
      corBorda: ruidoAlto ? "cor-barro" : "cor-azul-cadastral",
      corDestaque: ruidoAlto ? "cor-barro-texto" : "cor-azul-cadastral",
    },
  ];

  return (
    <View testID="placar-heroi-5-segundos" style={styles.container}>
      <View style={styles.grade}>
        {celulas.map((c) => (
          <Pressable
            key={c.id}
            testID={`placar-item-${c.id}`}
            accessibilityRole="button"
            onPress={() => aoTocarMetrica?.(c.id)}
            style={({ pressed }) => [
              styles.celula,
              {
                backgroundColor: cor(c.corFundo),
                borderColor: cor(c.corBorda),
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.rotulo}>
              {c.rotulo}
            </Texto>
            <Texto tipo="numero" cor={c.corDestaque} style={styles.valorGrande}>
              {c.valorGrande}
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.subtitulo}>
              {c.subtitulo}
            </Texto>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  grade: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  celula: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: TOQUE_MINIMO + 24,
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
    justifyContent: "space-between",
  },
  rotulo: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  valorGrande: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  subtitulo: {
    fontSize: 11.5,
    lineHeight: 15,
  },
});
