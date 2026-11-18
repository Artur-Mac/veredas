import React from "react";
import { StyleSheet, View } from "react-native";
import type { VereditoConfortoTermico, ZonaConfortoTermico } from "../../dados/clima/confortoTermico";
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
          <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 12, fontWeight: "600" }}>
            Conforto térmico na prática
          </Texto>
          <Texto tipo="secao" style={[styles.perguntaTitulo, { fontWeight: "700", letterSpacing: -0.35 }]}>
            {conforto.perguntaTitulo}
          </Texto>
        </View>
        <View
          testID="selo-conforto-termico"
          style={[
            styles.selo,
            { backgroundColor: cor(corSeloFundo), borderColor: cor(corSeloTexto) },
          ]}
        >
          <Texto tipo="etiqueta" cor={corSeloTexto} style={styles.textoSelo}>
            {conforto.selo}
          </Texto>
        </View>
      </View>

      {/* Medidor visual em 4 zonas com marcador de posicao exata */}
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
                      opacity: ativo ? 1 : 0.28,
                      height: ativo ? 12 : 8,
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

      {/* Veredito humano em 1 frase */}
      <Texto tipo="corpo" cor="cor-texto" style={styles.veredito}>
        {conforto.vereditoUmaLinha}
      </Texto>

      {/* Impacto de conta de energia + temperatura de superfície */}
      <View
        style={[
          styles.faixaEnergia,
          { backgroundColor: cor("cor-papel-claro"), borderColor: cor("cor-linha") },
        ]}
      >
        <View style={styles.energiaItem}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloMini}>
            Climatização estimada
          </Texto>
          <Texto tipo="secao" style={styles.valorEnergia}>
            {`~R$ ${conforto.custoMensalArReais}/mês`}
          </Texto>
        </View>
        <View style={[styles.divisorVertical, { backgroundColor: cor("cor-linha-forte") }]} />
        <View style={styles.energiaItem}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloMini}>
            Diferença vs Nascente fresco
          </Texto>
          <Texto
            tipo="secao"
            cor={conforto.custoExtraVsFrescoMesReais >= 90 ? "cor-barro-texto" : "cor-salvia-escura"}
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

      {/* Fatores explicativos claros */}
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
  perguntaTitulo: {
    fontSize: 17,
    lineHeight: 22,
  },
  selo: {
    borderRadius: RAIO.pilula,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textoSelo: {
    fontSize: 12,
    fontWeight: "700",
  },
  reguaWrapper: {
    gap: 6,
    paddingTop: 4,
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
    borderRadius: RAIO.quadrado,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
  },
  energiaItem: {
    flex: 1,
    gap: 2,
  },
  divisorVertical: {
    width: 1,
    height: 30,
    marginHorizontal: 10,
  },
  rotuloMini: {
    fontSize: 11,
  },
  valorEnergia: {
    fontSize: 15,
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
    width: 8,
    height: 8,
    borderRadius: 4,
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
});
