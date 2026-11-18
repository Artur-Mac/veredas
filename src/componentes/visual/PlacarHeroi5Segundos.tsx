import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { classificarNivelSossegoPorDbInterno } from "../../dados/acustica/decomporSossego";
import type { VereditoConfortoTermico } from "../../dados/clima/confortoTermico";
import type { FichaDeMetodo6Campos } from "../../dados/fichaDeMetodo";
import { formatarReaisCompacto } from "../../dados/formatos";
import { FichaDeMetodo } from "./FichaDeMetodo";
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
  /** dB(A) estimados no quarto à noite, com a janela fechada; `null` = sem leitura para o prédio. */
  ruidoDormitorioDb: number | null;
  /**
   * A leitura de sossego do modelo de ruído estimado (src/dados/ruido): a palavra da nota,
   * "~61 dB(A) à noite (estimativa) · 6,6/10" e a ficha "como foi calculada" (`null` sem leitura). É o que a tela do
   * dossiê passa (decisões A1, A2 e A13, 18/11/2026): a nota não aparece sem a ficha.
   */
  sossego?: { valor: string; subtitulo: string; ficha: FichaDeMetodo6Campos | null };
  spuAtivo?: boolean;
  aoTocarMetrica?: (alvo: "bolso" | "sol" | "ruido" | "predio") => void;
};

type CelulaPlacar = {
  id: "bolso" | "sol" | "ruido" | "predio";
  rotulo: string;
  valorGrande: string;
  subtitulo: string;
  corPonto: TokenDeCor;
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
  sossego: sossegoDoModelo,
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
        ? `${Math.abs(comparacaoM2Pct)}% abaixo do ITBI do prédio`
        : comparacaoM2Pct >= 8
          ? `${comparacaoM2Pct}% acima do ITBI do prédio`
          : "Perto do ITBI do prédio"
      : compra && dinheiroParaEntrarReais
        ? `Entrada + cartório ~${formatarReaisCompacto(dinheiroParaEntrarReais)}`
        : "Confira os custos abaixo";

  const mensalTxt =
    mensalBolsoRealReais !== null
      ? `~${formatarReaisCompacto(mensalBolsoRealReais)}/mês`
      : "A calcular";

  const confortoQuente =
    conforto.zona === "quente_tarde" || conforto.zona === "tende_abafar";

  // A nota e o dB vêm do modelo estimado do prédio; sem ele (cartão montado só com o dB do quarto) fica a palavra do
  // nível, sem nota. Sem leitura nenhuma, diz "Sem leitura": nunca um valor fixo.
  const porQuarto = ruidoDormitorioDb !== null ? classificarNivelSossegoPorDbInterno(ruidoDormitorioDb) : null;
  const sossego = sossegoDoModelo ??
    (porQuarto ? { valor: porQuarto.nivel, subtitulo: porQuarto.subtituloPlacar, ficha: null } : { valor: "Sem leitura", subtitulo: "Sem estimativa de ruído", ficha: null });
  // A13: as duas notas do placar (conforto e sossego) abrem a ficha de método num toque.
  const temNotaDeConforto = typeof conforto.notaConforto0a10 === "number";
  const ruidoAlto = ruidoDormitorioDb !== null && ruidoDormitorioDb > 45;
  const precoAcima = comparacaoM2Pct !== null && comparacaoM2Pct >= 10;

  const celulas: [CelulaPlacar, CelulaPlacar, CelulaPlacar, CelulaPlacar] = [
    {
      id: "bolso",
      rotulo: compra ? "Valor pedido" : "Aluguel + taxas",
      valorGrande: precoTxt,
      subtitulo: comparacaoTxt,
      corPonto: precoAcima ? "cor-barro" : "cor-acao",
      corDestaque: precoAcima ? "cor-barro-texto" : "cor-texto",
    },
    {
      id: "predio",
      rotulo: compra ? "Saída real por mês" : "Total mensal real",
      valorGrande: mensalTxt,
      subtitulo: spuAtivo
        ? "Terreno da União (ver regra)"
        : compra
          ? "Parcela + cond. + IPTU + luz"
          : "Aluguel + cond. + IPTU + luz",
      corPonto: spuAtivo ? "cor-barro" : "cor-azul-cadastral",
      corDestaque: spuAtivo ? "cor-barro-texto" : "cor-texto",
    },
    {
      id: "sol",
      rotulo: "Sol & conforto",
      valorGrande: orientacaoCurta,
      subtitulo:
        typeof conforto.notaConforto0a10 === "number"
          ? `${conforto.selo} · ${conforto.notaConforto0a10.toFixed(1).replace(".", ",")}/10`
          : conforto.selo,
      corPonto: confortoQuente ? "cor-barro" : "cor-salvia",
      corDestaque: confortoQuente ? "cor-barro-texto" : "cor-salvia-escura",
    },
    {
      id: "ruido",
      rotulo: "Sossego à noite",
      valorGrande: sossego.valor,
      subtitulo: sossego.subtitulo,
      corPonto: ruidoAlto ? "cor-barro" : "cat-mare",
      corDestaque: ruidoAlto ? "cor-barro-texto" : "cor-azul-cadastral",
    },
  ];

  const renderCelula = (c: CelulaPlacar, bordaEsq = false) => (
    <Pressable
      key={c.id}
      testID={`placar-item-${c.id}`}
      accessibilityRole="button"
      onPress={() => aoTocarMetrica?.(c.id)}
      style={({ pressed }) => [
        styles.celula,
        bordaEsq ? { borderLeftWidth: 1, borderLeftColor: cor("cor-linha") } : undefined,
        pressed ? { opacity: 0.72 } : undefined,
      ]}
    >
      <View style={styles.rotuloLinha}>
        <View style={[styles.ponto, { backgroundColor: cor(c.corPonto) }]} />
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.rotulo}>
          {c.rotulo}
        </Texto>
      </View>
      <Texto tipo="numero" cor={c.corDestaque} style={styles.valorGrande}>
        {c.valorGrande}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.subtitulo}>
        {c.subtitulo}
      </Texto>
    </Pressable>
  );

  return (
    <View
      testID="placar-heroi-5-segundos"
      style={[
        styles.containerUnificado,
        {
          backgroundColor: cor("cor-superficie"),
          borderColor: cor("cor-linha-forte"),
        },
      ]}
    >
      <View style={styles.linhaGrade}>
        {renderCelula(celulas[0], false)}
        {renderCelula(celulas[1], true)}
      </View>
      <View style={[styles.linhaGrade, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
        {renderCelula(celulas[2], false)}
        {renderCelula(celulas[3], true)}
      </View>
      {temNotaDeConforto || sossego.ficha ? (
        <View testID="placar-fichas-de-metodo" style={styles.fichas}>
          {temNotaDeConforto ? <FichaDeMetodo ficha={conforto.metodo} testID="placar-conforto-metodo" rotulo="Como foi calculada a nota de sol e conforto" /> : null}
          {sossego.ficha ? <FichaDeMetodo ficha={sossego.ficha} testID="placar-sossego-metodo" rotulo="Como foi calculada a nota de sossego" /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  containerUnificado: {
    marginTop: 12,
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    overflow: "hidden",
  },
  linhaGrade: {
    flexDirection: "row",
  },
  fichas: {
    paddingHorizontal: 14,
  },
  celula: {
    flex: 1,
    minHeight: TOQUE_MINIMO + 26,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 3,
    justifyContent: "space-between",
  },
  rotuloLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ponto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rotulo: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  valorGrande: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  subtitulo: {
    fontSize: 11.5,
    lineHeight: 15,
    fontVariant: ["tabular-nums"],
  },
});
