import React from "react";
import { StyleSheet, View } from "react-native";
import { classificarNivelSossegoPorDbInterno } from "../../dados/acustica/decomporSossego";
import { formatarReais, formatarReaisCompacto } from "../../dados/formatos";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO } from "../../tema/tokens";

export type ColunaMatrizComparar = {
  nome: string;
  precoPrincipalReais: number | null;
  areaM2: number | null;
  mensalBolsoRealReais: number | null;
  orientacaoCurta: string;
  climaSelo: string;
  confortoQuente: boolean;
  ruidoInternoDb: number;
  anoConstrucao: number | null;
  spuAlerta: boolean;
};

type LinhaComparacao = {
  criterio: string;
  valorA: string;
  valorB: string;
  vencedor: "A" | "B" | "empate";
};

function precoPorM2Texto(preco: number | null, area: number | null): string {
  if (!preco || !area || area <= 0) return "A confirmar";
  return `${formatarReais(Math.round(preco / area))}/m²`;
}

export function MatrizVisualComparar({
  modalidade,
  opcaoA,
  opcaoB,
}: {
  modalidade: "compra" | "aluguel";
  opcaoA: ColunaMatrizComparar;
  opcaoB: ColunaMatrizComparar;
}) {
  const { cor } = useTema();
  const compra = modalidade === "compra";

  const pm2A =
    opcaoA.precoPrincipalReais && opcaoA.areaM2
      ? opcaoA.precoPrincipalReais / opcaoA.areaM2
      : null;
  const pm2B =
    opcaoB.precoPrincipalReais && opcaoB.areaM2
      ? opcaoB.precoPrincipalReais / opcaoB.areaM2
      : null;

  const linhas: LinhaComparacao[] = [
    {
      criterio: compra ? "Preço por m²" : "Aluguel por m²",
      valorA: precoPorM2Texto(opcaoA.precoPrincipalReais, opcaoA.areaM2),
      valorB: precoPorM2Texto(opcaoB.precoPrincipalReais, opcaoB.areaM2),
      vencedor:
        pm2A !== null && pm2B !== null && Math.abs(pm2A - pm2B) / Math.max(pm2A, pm2B) > 0.04
          ? pm2A < pm2B
            ? "A"
            : "B"
          : "empate",
    },
    {
      criterio: "Saída mensal real",
      valorA: opcaoA.mensalBolsoRealReais
        ? `~${formatarReaisCompacto(opcaoA.mensalBolsoRealReais)}/mês`
        : "A confirmar",
      valorB: opcaoB.mensalBolsoRealReais
        ? `~${formatarReaisCompacto(opcaoB.mensalBolsoRealReais)}/mês`
        : "A confirmar",
      vencedor:
        opcaoA.mensalBolsoRealReais !== null &&
        opcaoB.mensalBolsoRealReais !== null &&
        Math.abs(opcaoA.mensalBolsoRealReais - opcaoB.mensalBolsoRealReais) >= 150
          ? opcaoA.mensalBolsoRealReais < opcaoB.mensalBolsoRealReais
            ? "A"
            : "B"
          : "empate",
    },
    {
      criterio: "Sol & conforto",
      valorA: `${opcaoA.orientacaoCurta} · ${opcaoA.climaSelo}`,
      valorB: `${opcaoB.orientacaoCurta} · ${opcaoB.climaSelo}`,
      vencedor:
        opcaoA.confortoQuente !== opcaoB.confortoQuente
          ? opcaoA.confortoQuente
            ? "B"
            : "A"
          : "empate",
    },
    {
      criterio: "Sossego no quarto",
      valorA: classificarNivelSossegoPorDbInterno(opcaoA.ruidoInternoDb).rotuloComparar,
      valorB: classificarNivelSossegoPorDbInterno(opcaoB.ruidoInternoDb).rotuloComparar,
      vencedor:
        Math.abs(opcaoA.ruidoInternoDb - opcaoB.ruidoInternoDb) >= 4
          ? opcaoA.ruidoInternoDb < opcaoB.ruidoInternoDb
            ? "A"
            : "B"
          : "empate",
    },
    {
      criterio: "Idade do prédio",
      valorA: opcaoA.anoConstrucao
        ? `${new Date().getFullYear() - opcaoA.anoConstrucao} anos`
        : "A confirmar",
      valorB: opcaoB.anoConstrucao
        ? `${new Date().getFullYear() - opcaoB.anoConstrucao} anos`
        : "A confirmar",
      vencedor:
        opcaoA.anoConstrucao !== null &&
        opcaoB.anoConstrucao !== null &&
        Math.abs(opcaoA.anoConstrucao - opcaoB.anoConstrucao) >= 5
          ? opcaoA.anoConstrucao > opcaoB.anoConstrucao
            ? "A"
            : "B"
          : "empate",
    },
    {
      criterio: "Terreno / matrícula",
      valorA: opcaoA.spuAlerta ? "Checar Marinha" : "Sem alerta SPU",
      valorB: opcaoB.spuAlerta ? "Checar Marinha" : "Sem alerta SPU",
      vencedor:
        opcaoA.spuAlerta !== opcaoB.spuAlerta
          ? opcaoA.spuAlerta
            ? "B"
            : "A"
          : "empate",
    },
  ];

  const vitoriasA = linhas.filter((l) => l.vencedor === "A").length;
  const vitoriasB = linhas.filter((l) => l.vencedor === "B").length;

  const sinteseCurta =
    vitoriasA === vitoriasB
      ? `Empate técnico direto: ${opcaoA.nome} e ${opcaoB.nome} vencem em critérios distintos abaixo.`
      : vitoriasA > vitoriasB
        ? `${opcaoA.nome} leva vantagem em ${vitoriasA} de 6 pontos objetivos lado a lado.`
        : `${opcaoB.nome} leva vantagem em ${vitoriasB} de 6 pontos objetivos lado a lado.`;

  return (
    <View
      testID="matriz-visual-comparar"
      style={[
        styles.cartao,
        { backgroundColor: cor("cor-superficie"), borderColor: cor("cor-linha-forte") },
      ]}
    >
      <View style={styles.cabecalho}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
          Lado a lado em 6 pontos
        </Texto>
        <Texto tipo="secao" style={styles.tituloSintese}>
          {sinteseCurta}
        </Texto>
      </View>

      <View style={[styles.cabecalhoColunas, { borderBottomColor: cor("cor-linha") }]}>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.colCriterio}>Critério</Texto>
        <Texto tipo="etiqueta" numberOfLines={2} style={styles.colOpcao}>{opcaoA.nome}</Texto>
        <Texto tipo="etiqueta" numberOfLines={2} style={styles.colOpcao}>{opcaoB.nome}</Texto>
      </View>

      {linhas.map((l, idx) => (
        <View
          key={l.criterio}
          style={[
            styles.linha,
            idx < linhas.length - 1
              ? { borderBottomWidth: 1, borderBottomColor: cor("cor-linha") }
              : undefined,
          ]}
        >
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.colCriterio}>
            {l.criterio}
          </Texto>
          <View style={styles.celulaValor}>
            {l.vencedor === "A" ? (
              <View style={[styles.pontoVencedor, { backgroundColor: cor("cor-salvia") }]} />
            ) : null}
            <Texto
              tipo="etiqueta"
              cor={l.vencedor === "A" ? "cor-salvia-escura" : "cor-texto"}
              style={[
                styles.textoCelula,
                l.vencedor === "A" ? styles.textoVencedor : undefined,
              ]}
            >
              {l.valorA}
            </Texto>
          </View>
          <View style={styles.celulaValor}>
            {l.vencedor === "B" ? (
              <View style={[styles.pontoVencedor, { backgroundColor: cor("cor-salvia") }]} />
            ) : null}
            <Texto
              tipo="etiqueta"
              cor={l.vencedor === "B" ? "cor-salvia-escura" : "cor-texto"}
              style={[
                styles.textoCelula,
                l.vencedor === "B" ? styles.textoVencedor : undefined,
              ]}
            >
              {l.valorB}
            </Texto>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    marginBottom: 14,
  },
  cabecalho: {
    gap: 3,
    paddingBottom: 6,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  tituloSintese: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  cabecalhoColunas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  colCriterio: {
    flex: 0.9,
    fontSize: 12,
  },
  colOpcao: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "700",
  },
  celulaValor: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pontoVencedor: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  textoCelula: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ["tabular-nums"],
  },
  textoVencedor: {
    fontWeight: "700",
  },
});
