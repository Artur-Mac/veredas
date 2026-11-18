import { View } from "react-native";
import { classificarNivelSossegoPorDbInterno } from "../../dados/acustica/decomporSossego";
import type { CandidatoDecisao } from "../../dados/cidadao/dominanciaInvisivel";
import { trocaCustoTempo } from "../../dados/escolha";
import { useTema } from "../../tema/Tema";
import { RAIO } from "../../tema/tokens";
import { Texto } from "../Texto";

/**
 * Duelo A × B entre dois finalistas nas 5 dimensões cidadãs concretas,
 * destacando apenas onde há diferença material para a decisão.
 */
export type EntradaDueloA_B = CandidatoDecisao & {
  situacaoDocumentalResumo: string;
  riscoAguaChuvaResumo: string;
  vpl10AnosReais?: number | null;
};

function linhaDiferenca(rotulo: string, valA: string, valB: string, igual: boolean) {
  return { rotulo, valA, valB, igual };
}

export function DueloFinalistas({ opcaoA, opcaoB }: { opcaoA: EntradaDueloA_B; opcaoB: EntradaDueloA_B }) {
  const { cor } = useTema();

  const linhas = [
    linhaDiferenca(
      "Custo em 10 anos / mês",
      `R$ ${Math.round(opcaoA.custoMensalTotalReais).toLocaleString("pt-BR")}/mês`,
      `R$ ${Math.round(opcaoB.custoMensalTotalReais).toLocaleString("pt-BR")}/mês`,
      Math.abs(opcaoA.custoMensalTotalReais - opcaoB.custoMensalTotalReais) < 50,
    ),
    linhaDiferenca(
      "Sossego no quarto",
      classificarNivelSossegoPorDbInterno(opcaoA.ruidoInternoDb).rotuloComparar,
      classificarNivelSossegoPorDbInterno(opcaoB.ruidoInternoDb).rotuloComparar,
      Math.abs(opcaoA.ruidoInternoDb - opcaoB.ruidoInternoDb) < 2,
    ),
    linhaDiferenca(
      "Terreno, cota e drenagem",
      opcaoA.riscoAguaChuvaResumo,
      opcaoB.riscoAguaChuvaResumo,
      opcaoA.riscoAguaChuvaResumo === opcaoB.riscoAguaChuvaResumo,
    ),
    linhaDiferenca(
      "Situação documental",
      opcaoA.situacaoDocumentalResumo,
      opcaoB.situacaoDocumentalResumo,
      opcaoA.situacaoDocumentalResumo === opcaoB.situacaoDocumentalResumo,
    ),
    linhaDiferenca(
      "Rotina e deslocamento",
      `${Math.round(opcaoA.deslocamentoMinDia)} min/dia · ${Math.round(opcaoA.areaM2)} m²`,
      `${Math.round(opcaoB.deslocamentoMinDia)} min/dia · ${Math.round(opcaoB.areaM2)} m²`,
      Math.abs(opcaoA.deslocamentoMinDia - opcaoB.deslocamentoMinDia) < 5 && Math.abs(opcaoA.areaM2 - opcaoB.areaM2) < 4,
    ),
  ];

  const apenasDiferencas = linhas.filter((l) => !l.igual);
  const exibidas = apenasDiferencas.length > 0 ? apenasDiferencas : linhas;
  const sinteseTroca = trocaCustoTempo(
    [opcaoA.nomeExibicao, opcaoB.nomeExibicao],
    [Math.round(opcaoA.custoMensalTotalReais), Math.round(opcaoB.custoMensalTotalReais)],
    [0, 0],
    [Math.round(opcaoA.deslocamentoMinDia), Math.round(opcaoB.deslocamentoMinDia)],
    22,
  );

  return (
    <View
      style={{
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: cor("cor-linha-forte"),
        borderRadius: RAIO.cartao,
        padding: 14,
        gap: 10,
      }}
      accessibilityLabel={`Comparação direta entre ${opcaoA.nomeExibicao} e ${opcaoB.nomeExibicao}`}
    >
      <Texto tipo="secao" style={{ fontSize: 16 }}>
        {`Duelo direto: ${opcaoA.nomeExibicao} × ${opcaoB.nomeExibicao}`}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5 }}>
        {apenasDiferencas.length > 0
          ? `Mostrando os ${apenasDiferencas.length} pontos em que os dois finalistas realmente diferem.`
          : "Os dois finalistas estão tecnicamente próximos em todas as dimensões medidas."}
      </Texto>

      <View
        testID="duelo-cabecalho-colunas"
        style={{
          borderTopWidth: 1,
          borderTopColor: cor("cor-linha"),
          paddingTop: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <Texto tipo="etiqueta" style={{ flex: 1, fontSize: 12, fontWeight: "700" }} numberOfLines={2}>
          {opcaoA.nomeExibicao}
        </Texto>
        <Texto tipo="etiqueta" style={{ flex: 1, fontSize: 12, fontWeight: "700" }} numberOfLines={2}>
          {opcaoB.nomeExibicao}
        </Texto>
      </View>

      {exibidas.map((l) => (
        <View
          key={l.rotulo}
          style={{
            borderTopWidth: 1,
            borderTopColor: cor("cor-linha"),
            paddingTop: 10,
            gap: 4,
          }}
        >
          <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 11.5 }}>
            {l.rotulo}
          </Texto>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Texto tipo="numero" style={{ flex: 1, fontSize: 13, fontVariant: ["tabular-nums"] }}>
              {l.valA}
            </Texto>
            <Texto tipo="numero" style={{ flex: 1, fontSize: 13, fontVariant: ["tabular-nums"] }}>
              {l.valB}
            </Texto>
          </View>
        </View>
      ))}

      <View
        testID="duelo-sintese-troca"
        style={{
          borderTopWidth: 1,
          borderTopColor: cor("cor-linha"),
          paddingTop: 10,
          gap: 3,
        }}
      >
        <Texto
          tipo="apoio"
          style={{ fontSize: 12.5, lineHeight: 18, fontWeight: "600", fontVariant: ["tabular-nums"] }}
        >
          {sinteseTroca.frase}
        </Texto>
        {sinteseTroca.tipo === "troca" ? (
          <Texto
            tipo="apoio"
            cor="cor-texto-apoio"
            style={{ fontSize: 12, lineHeight: 17, fontVariant: ["tabular-nums"] }}
          >
            {sinteseTroca.limiar}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}
