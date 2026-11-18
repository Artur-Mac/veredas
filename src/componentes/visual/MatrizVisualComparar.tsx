import React from "react";
import { StyleSheet, View } from "react-native";
import { classificarNivelSossegoPorDbInterno } from "../../dados/acustica/decomporSossego";
import type { FichaDeMetodo6Campos } from "../../dados/fichaDeMetodo";
import { fichaGeralDoRuido } from "../../dados/ruido/estimativa";
import { formatarReais, formatarReaisCompacto } from "../../dados/formatos";
import { FichaDeMetodo } from "./FichaDeMetodo";
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
  /** dB(A) estimados no quarto à noite, com a janela fechada; `null` = sem leitura para o prédio. */
  ruidoInternoDb: number | null;
  /**
   * A nota de sossego do modelo de ruído estimado (a mesma do placar do dossiê): nota 0–10, a palavra da faixa e os
   * dB(A) estimados à noite na janela. `null` = sem leitura. Ausente só nos cartões montados sem o modelo.
   */
  sossego?: { nota0a10: number; nivel: string; noiteDb: number } | null;
  anoConstrucao: number | null;
  spuAlerta: boolean;
};

/** Diferença de nota que conta como vantagem no sossego: 1 ponto, perto dos 4 dB que o critério usava. */
const VANTAGEM_NA_NOTA = 1;
const notaTexto = (n: number) => `${n.toFixed(1).replace(".", ",")}/10`;

/**
 * Como cada um dos 6 pontos é comparado e quando dá empate (decisões D2 e A13): a ficha de método da matriz.
 * `comNotaDeSossego` diz se o sossego veio da nota do modelo de ruído estimado.
 */
export function fichaDaMatrizComparar(compra: boolean, comNotaDeSossego: boolean): FichaDeMetodo6Campos {
  const ruido = fichaGeralDoRuido();
  return {
    oQueMede: "Seis pontos lado a lado, com a mesma régua nos dois imóveis: preço por m², saída mensal, sol e conforto, sossego à noite, idade do prédio e terreno. “Leva vantagem em N de 6” conta em quantos pontos um imóvel fica à frente; não é nota do imóvel.",
    fonte: `O anúncio e o que você informou (preço, área, condomínio), o cadastro do Recife (IPTU, ano do prédio), o cálculo de sol do Vereda e, no sossego, o ruído estimado. ${ruido.fonte}`,
    data: `Cadastro do Recife de 2026. ${ruido.data}`,
    calculo:
      `${compra ? "Preço" : "Aluguel"} por m²: menor vence; empate com diferença de até 4%. Saída mensal: menor vence; empate com diferença abaixo de R$ 150. ` +
      "Sol e conforto: vence o que não fica na faixa quente; empate quando os dois estão do mesmo lado. " +
      (comNotaDeSossego
        ? `Sossego à noite: maior nota de sossego vence (a nota do ruído estimado à noite na janela); empate com diferença abaixo de ${VANTAGEM_NA_NOTA} ponto ou sem leitura num dos lados. `
        : "Sossego no quarto: menor ruído estimado no quarto vence; empate com diferença abaixo de 4 dB (estimativa) ou sem leitura num dos lados. ") +
      "Idade do prédio: o mais novo vence; empate com menos de 5 anos de diferença ou sem ano no cadastro. Terreno: vence o que não tem alerta de terreno da União; empate quando os dois têm ou nenhum tem.",
    limite: `Cada ponto pesa igual e os cortes de empate são escolhas do Vereda, não medições; um ponto sem dado vira empate. No sossego: ${ruido.limite}`,
    naVisita: "Confira no local os pontos em que deu empate e os que estão “A confirmar” ou “Sem leitura”: são eles que podem virar a comparação.",
  };
}

/**
 * A linha de sossego: pela nota do modelo estimado (à noite, na janela) quando os dois lados a trazem, com o rótulo
 * "Sossego à noite"; senão, pelo dB do quarto, com o rótulo "Sossego no quarto" (o rótulo diz o ponto do número).
 */
function linhaDeSossego(a: ColunaMatrizComparar, b: ColunaMatrizComparar): LinhaComparacao {
  if (a.sossego !== undefined && b.sossego !== undefined) {
    const criterio = "Sossego à noite";
    const valor = (s: ColunaMatrizComparar["sossego"]) => (s ? `${s.nivel} · ${notaTexto(s.nota0a10)}` : "Sem leitura");
    const vencedor = a.sossego && b.sossego && Math.abs(a.sossego.nota0a10 - b.sossego.nota0a10) >= VANTAGEM_NA_NOTA ? (a.sossego.nota0a10 > b.sossego.nota0a10 ? "A" : "B") : "empate";
    return { criterio, valorA: valor(a.sossego), valorB: valor(b.sossego), vencedor };
  }
  const criterio = "Sossego no quarto";
  const valor = (db: number | null) => (db === null ? "Sem leitura" : classificarNivelSossegoPorDbInterno(db).rotuloComparar);
  const vencedor = a.ruidoInternoDb !== null && b.ruidoInternoDb !== null && Math.abs(a.ruidoInternoDb - b.ruidoInternoDb) >= 4 ? (a.ruidoInternoDb < b.ruidoInternoDb ? "A" : "B") : "empate";
  return { criterio, valorA: valor(a.ruidoInternoDb), valorB: valor(b.ruidoInternoDb), vencedor };
}

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
      criterio: "Saída mensal estimada",
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
    linhaDeSossego(opcaoA, opcaoB),
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

      <View style={[styles.rodapeEscala, { borderTopColor: cor("cor-linha") }]}>
        <Texto testID="matriz-aviso-escala" tipo="apoio" cor="cor-texto-apoio" style={styles.avisoEscala}>
          Critérios objetivos calculados com a mesma régua nos dois imóveis; empate quando a diferença fica dentro da margem prática.
        </Texto>
        <FichaDeMetodo ficha={fichaDaMatrizComparar(compra, opcaoA.sossego !== undefined && opcaoB.sossego !== undefined)} testID="matriz-metodo" rotulo="Como cada ponto é comparado" />
        {opcaoA.sossego || opcaoB.sossego ? (
          <Texto testID="matriz-sossego-estimativa" tipo="apoio" cor="cor-texto-apoio" style={[styles.avisoEscala, { fontVariant: ["tabular-nums"] }]}>
            {`Sossego: nota 0–10 pelo ruído estimado à noite na janela (${[opcaoA, opcaoB].map((o) => `${o.nome}: ${o.sossego ? `~${Math.round(o.sossego.noiteDb)} dB(A)` : "sem leitura"}`).join("; ")}). Estimativa com dados abertos, não medição.`}
          </Texto>
        ) : null}
      </View>
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
  rodapeEscala: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
    gap: 4,
  },
  avisoEscala: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
