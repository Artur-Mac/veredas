import React from "react";
import { StyleSheet, View } from "react-native";
import type {
  VereditoConfortoTermico,
  ZonaConfortoTermico,
} from "../../dados/clima/confortoTermico";
import { FichaDeMetodo } from "./FichaDeMetodo";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, type TokenDeCor } from "../../tema/tokens";

type Props = {
  conforto: VereditoConfortoTermico;
  andar?: number;
};

const ZONAS: {
  id: ZonaConfortoTermico;
  rotulo: string;
  corToken: TokenDeCor;
}[] = [
  { id: "fresco_ventilado", rotulo: "Fresco", corToken: "cat-mare" },
  { id: "clima_agradavel", rotulo: "Agradável", corToken: "cor-salvia" },
  { id: "tende_abafar", rotulo: "Abafa", corToken: "cor-acao" },
  { id: "quente_tarde", rotulo: "Quente", corToken: "cor-barro" },
];

export function TermometroConfortoTermico({ conforto }: Props) {
  const { cor } = useTema();

  const corSeloFundo: TokenDeCor =
    conforto.zona === "fresco_ventilado" || conforto.zona === "clima_agradavel"
      ? "cor-salvia-suave"
      : "cor-barro-suave";
  const corSeloTexto: TokenDeCor =
    conforto.zona === "fresco_ventilado" || conforto.zona === "clima_agradavel"
      ? "cor-salvia-escura"
      : "cor-barro-texto";

  return (
    <View
      testID="termometro-conforto-termico"
      style={[
        styles.cartao,
        {
          backgroundColor: cor("cor-superficie"),
          borderColor: cor("cor-linha-forte"),
        },
      ]}
    >
      <View style={styles.topoRow}>
        <View style={styles.topoEsq}>
          <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
            Conforto térmico na prática
          </Texto>
          <Texto tipo="secao" style={styles.perguntaTitulo}>
            {conforto.perguntaTitulo}
          </Texto>
          <Texto
            testID="termometro-nota-0a10"
            tipo="apoio"
            cor="cor-texto-apoio"
            style={styles.notaEscala}
          >
            {`Nota de conforto térmico ${conforto.notaConforto0a10.toFixed(1).replace(".", ",")} / 10`}
          </Texto>
        </View>
        <View
          testID="selo-conforto-termico"
          style={[styles.selo, { backgroundColor: cor(corSeloFundo) }]}
        >
          <Texto tipo="etiqueta" cor={corSeloTexto} style={styles.textoSelo}>
            {conforto.selo}
          </Texto>
        </View>
      </View>

      {/* Regua visual de 4 zonas */}
      <View style={styles.reguaWrapper}>
        <View style={styles.marcadorRow}>
          <View
            style={[
              styles.marcadorPin,
              {
                left: `${Math.max(4, Math.min(92, conforto.indiceCalor0a100))}%`,
                backgroundColor: cor("cor-texto"),
              },
            ]}
          />
        </View>
        <View style={styles.barrasRow}>
          {ZONAS.map((z) => {
            const ativo = z.id === conforto.zona;
            return (
              <View key={z.id} style={styles.zonaCol}>
                <View
                  style={[
                    styles.barraSegmento,
                    {
                      backgroundColor: cor(z.corToken),
                      opacity: ativo ? 1 : 0.25,
                      height: ativo ? 10 : 6,
                    },
                  ]}
                />
                <Texto
                  tipo="apoio"
                  cor={ativo ? "cor-texto" : "cor-texto-apoio"}
                  style={[styles.rotuloZona, ativo ? styles.rotuloZonaAtiva : undefined]}
                >
                  {z.rotulo}
                </Texto>
              </View>
            );
          })}
        </View>
      </View>

      <Texto tipo="corpo" cor="cor-texto" style={styles.veredito}>
        {conforto.vereditoUmaLinha}
      </Texto>

      {/* Strip de energia separado por hairlines 1px (zero caixa interna) */}
      <View
        style={[
          styles.faixaEnergia,
          { borderTopColor: cor("cor-linha"), borderBottomColor: cor("cor-linha") },
        ]}
      >
        <View style={styles.energiaItem}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloMini}>
            Ar-condicionado (fórmula, não medição)
          </Texto>
          <Texto tipo="secao" style={styles.valorEnergia}>
            {`~R$ ${conforto.custoMensalArReais}/mês`}
          </Texto>
        </View>
        <View style={[styles.divisorVertical, { backgroundColor: cor("cor-linha") }]} />
        <View style={styles.energiaItem}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloMini}>
            Diferença vs Nascente fresco
          </Texto>
          <Texto
            tipo="secao"
            cor={
              conforto.custoExtraVsFrescoMesReais >= 90
                ? "cor-barro-texto"
                : "cor-salvia-escura"
            }
            style={styles.valorEnergia}
          >
            {conforto.custoExtraVsFrescoMesReais > 15
              ? `+R$ ${conforto.custoExtraVsFrescoMesReais}/mês`
              : "Sem custo extra"}
          </Texto>
        </View>
      </View>

      {conforto.temperaturaQuadraResumo ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.subResumo}>
          {conforto.temperaturaQuadraResumo}
        </Texto>
      ) : null}

      <View style={styles.listaFatores}>
        {conforto.fatores.map((f, idx) => {
          const corPonto: TokenDeCor =
            f.efeito === "refresca"
              ? "cat-mare"
              : f.efeito === "esquenta"
                ? "cor-barro"
                : "cor-traco";
          return (
            <View key={idx} style={styles.fatorRow}>
              <View style={[styles.bolinha, { backgroundColor: cor(corPonto) }]} />
              <View style={styles.fatorTexto}>
                <Texto tipo="etiqueta" style={styles.fatorTitulo}>
                  {f.titulo}
                </Texto>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.fatorDetalhe}>
                  {f.detalhe}
                </Texto>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.blocoAcaoVisita, { borderTopColor: cor("cor-linha") }]}>
        <Texto testID="termometro-acao-visita" tipo="apoio" cor="cor-texto-apoio" style={styles.acaoVisita}>
          {conforto.acaoVisita}
        </Texto>
      </View>
      {/* R6 e R11: a nota e o selo ficam; a ficha diz que a regra de pontos e o gasto com ar não têm base medida. */}
      <FichaDeMetodo ficha={conforto.metodo} testID="termometro-metodo" />
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  topoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  topoEsq: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  perguntaTitulo: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  selo: {
    borderRadius: RAIO.pilula,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textoSelo: {
    fontSize: 12,
    fontWeight: "700",
  },
  reguaWrapper: {
    gap: 6,
    paddingTop: 2,
  },
  marcadorRow: {
    height: 10,
    position: "relative",
  },
  marcadorPin: {
    position: "absolute",
    top: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
  },
  barrasRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  zonaCol: {
    flex: 1,
    gap: 4,
  },
  barraSegmento: {
    borderRadius: 6,
    width: "100%",
  },
  rotuloZona: {
    fontSize: 11,
    textAlign: "center",
  },
  rotuloZonaAtiva: {
    fontWeight: "700",
  },
  veredito: {
    fontSize: 14,
    lineHeight: 20,
  },
  faixaEnergia: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  energiaItem: {
    flex: 1,
    gap: 2,
  },
  divisorVertical: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },
  rotuloMini: {
    fontSize: 11,
  },
  valorEnergia: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  subResumo: {
    fontSize: 12,
  },
  listaFatores: {
    gap: 8,
  },
  fatorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  bolinha: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 6,
  },
  fatorTexto: {
    flex: 1,
    gap: 1,
  },
  fatorTitulo: {
    fontSize: 13.5,
  },
  fatorDetalhe: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  notaEscala: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  blocoAcaoVisita: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  acaoVisita: {
    fontSize: 12,
    lineHeight: 17,
  },
});
