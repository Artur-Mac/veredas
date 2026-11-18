import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { decomporSossego, type NivelSossego } from "../../dados/acustica/decomporSossego";
import type { ResultadoAcustica3D } from "../../nucleo/motores/acustica3d";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO, type TokenDeCor } from "../../tema/tokens";

const FAIXAS_SOSSEGO = [
  { id: "silencioso", rotulo: "Silencioso\nmadrugada", corToken: "cat-mare" as TokenDeCor },
  { id: "calmo", rotulo: "Calmo\nrua local", corToken: "cor-salvia" as TokenDeCor },
  { id: "moderado", rotulo: "Moderado\nvia mista", corToken: "cor-acao" as TokenDeCor },
  { id: "intenso", rotulo: "Intenso\ncorredor", corToken: "cor-barro" as TokenDeCor },
];

function corNivelSossego(nivel: NivelSossego): TokenDeCor {
  if (nivel === "Calmo") return "cor-salvia";
  if (nivel === "Moderado") return "cor-acao";
  return "cor-barro";
}

export function EscalaDeRuidoHumana({
  acustica,
  anoConstrucao,
}: {
  acustica: ResultadoAcustica3D;
  anoConstrucao: number | null;
}) {
  const { cor } = useTema();
  const sintese = decomporSossego(acustica, anoConstrucao);
  const silencioso = sintese.nivelQuarto !== "Intenso";

  return (
    <View
      testID="escala-de-ruido-humana"
      style={[
        styles.cartao,
        { backgroundColor: cor("cor-superficie"), borderColor: cor("cor-linha-forte") },
      ]}
    >
      <View style={styles.topoRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
            Sossego à noite por fonte
          </Texto>
          <Texto tipo="secao" style={styles.titulo}>
            {sintese.tituloQuarto}
          </Texto>
        </View>
        <View
          style={[
            styles.pilula,
            { backgroundColor: cor(silencioso ? "cor-salvia-suave" : "cor-barro-suave") },
          ]}
        >
          <Texto
            tipo="etiqueta"
            cor={silencioso ? "cor-salvia-escura" : "cor-barro-texto"}
            style={styles.textoPilula}
          >
            {sintese.rotuloSelo}
          </Texto>
        </View>
      </View>

      <View style={styles.reguaContainer}>
        <View style={styles.ponteiroTrack}>
          <View
            style={[
              styles.ponteiroExterno,
              { left: `${sintese.indice0a100Externo}%`, backgroundColor: cor("cor-traco") },
            ]}
          />
          <View
            style={[
              styles.ponteiroInterno,
              {
                left: `${sintese.indice0a100Interno}%`,
                backgroundColor: cor(silencioso ? "cor-salvia-escura" : "cor-barro"),
              },
            ]}
          />
        </View>
        <View style={styles.faixas}>
          {FAIXAS_SOSSEGO.map((m) => (
            <View key={m.id} style={styles.faixaCol}>
              <View style={[styles.faixaCor, { backgroundColor: cor(m.corToken) }]} />
              <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoFaixa}>
                {m.rotulo}
              </Texto>
            </View>
          ))}
        </View>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.legendaPinos}>
          Ponto forte: dentro do quarto · Ponto cinza: na rua fora da janela
        </Texto>
      </View>

      {/* Decomposição por fonte sem caixas aninhadas (HowLoud + Mapa Sossego) */}
      <View style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 8, gap: 7 }}>
        {sintese.fontes.map((f) => (
          <View
            key={f.id}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                marginTop: 5,
                backgroundColor: cor(corNivelSossego(f.nivel)),
              }}
            />
            <View style={{ flex: 1, gap: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <Texto tipo="etiqueta" style={{ fontSize: 12.5, fontWeight: "700" }}>
                  {f.titulo}
                </Texto>
                <Texto
                  tipo="apoio"
                  cor={f.nivel === "Intenso" ? "cor-barro-texto" : "cor-texto-apoio"}
                  style={{ fontSize: 11.5, fontWeight: "600" }}
                >
                  {f.nivel}
                </Texto>
              </View>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 16 }}>
                {f.resumo}
              </Texto>
            </View>
          </View>
        ))}
      </View>

      <Texto tipo="corpo" style={styles.descricao}>
        {sintese.notaJanela}
      </Texto>
    </View>
  );
}

export function RelogioDoPredio({
  anoConstrucao,
  unidades,
  pavimentos,
}: {
  anoConstrucao: number | null;
  unidades: number | null;
  pavimentos: number | null;
}) {
  const { cor } = useTema();
  if (!anoConstrucao) return null;
  const anoAtual = new Date().getFullYear();
  const idade = Math.max(0, anoAtual - anoConstrucao);
  const pctVida = Math.max(6, Math.min(96, (idade / 50) * 100));

  let cicloAtual: string;
  let alertaCiclo = false;
  if (idade < 8) {
    cicloAtual = "Fase jovem: garantias recentes e baixa chance de reforma pesada de fachada nos próximos anos.";
  } else if (idade < 20) {
    cicloAtual = "Janela clássica de primeira grande reforma de pintura, rejunte de fachada e modernização de elevadores.";
    alertaCiclo = true;
  } else if (idade < 35) {
    cicloAtual = "Edifício maduro: confira em ata se já trocou colunas de água, impermeabilização da garagem e tubulações.";
    alertaCiclo = true;
  } else {
    cicloAtual = "Prédio antigo consolidado: condomínio costuma diluir obras em poucas unidades ou exigir reserva sólida.";
    alertaCiclo = true;
  }

  const impactoCota =
    unidades && unidades <= 16
      ? `Rateio pesado: apenas ${unidades} apartamentos dividem qualquer obra grande no prédio.`
      : unidades
        ? `Obra grande dividida entre ${unidades} unidades${pavimentos ? ` em ${pavimentos} andares` : ""}.`
        : null;

  return (
    <View
      testID="relogio-do-predio"
      style={[
        styles.cartao,
        { backgroundColor: cor("cor-superficie"), borderColor: cor("cor-linha-forte") },
      ]}
    >
      <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
        Relógio do prédio e ciclo de obras
      </Texto>
      <View style={styles.topoRow}>
        <Texto tipo="secao" style={styles.titulo}>
          {`${idade} anos de construção (${anoConstrucao})`}
        </Texto>
        {alertaCiclo ? (
          <View style={[styles.pilula, { backgroundColor: cor("cor-barro-suave") }]}>
            <Texto tipo="etiqueta" cor="cor-barro-texto" style={styles.textoPilula}>
              Olho na ata e reserva
            </Texto>
          </View>
        ) : null}
      </View>

      <View style={[styles.trilhoVida, { backgroundColor: cor("cor-linha") }]}>
        <View
          style={[
            styles.progressoVida,
            {
              width: `${pctVida}%`,
              backgroundColor: cor(idade >= 20 ? "cor-acao" : "cor-salvia"),
            },
          ]}
        />
      </View>
      <View style={styles.marcosVidaRow}>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoMarco}>0 anos</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoMarco}>15a fachada</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoMarco}>25a colunas</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoMarco}>50a ciclo</Texto>
      </View>

      <Texto tipo="corpo" style={styles.descricao}>
        {cicloAtual}
      </Texto>
      {impactoCota ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.subTexto}>
          {impactoCota}
        </Texto>
      ) : null}
    </View>
  );
}

export function SilencioInteligente({
  titulo = "Itens conferidos sem alerta",
  itensNormais,
}: {
  titulo?: string;
  itensNormais: readonly { rotulo: string; detalhe?: string }[];
}) {
  const { cor } = useTema();
  const [aberto, setAberto] = useState(false);

  if (itensNormais.length === 0) return null;

  return (
    <View
      testID="silencio-inteligente"
      style={[
        styles.silencioLinha,
        { borderTopColor: cor("cor-linha"), borderBottomColor: cor("cor-linha") },
      ]}
    >
      <Pressable
        testID="silencio-inteligente-toggle"
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        onPress={() => setAberto((v) => !v)}
        style={styles.silencioBotao}
      >
        <View style={styles.silencioTituloRow}>
          <View style={[styles.pontoVerde, { backgroundColor: cor("cor-salvia") }]} />
          <Texto tipo="etiqueta" cor="cor-salvia-escura" style={styles.silencioTitulo}>
            {`${itensNormais.length} ${titulo.toLowerCase()} · tudo em ordem`}
          </Texto>
        </View>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.silencioAcao}>
          {aberto ? "Ocultar" : "Ver lista"}
        </Texto>
      </Pressable>
      {aberto ? (
        <View style={styles.silencioLista}>
          {itensNormais.map((item, idx) => (
            <View key={idx} style={styles.silencioItem}>
              <Texto tipo="corpo" style={styles.silencioRotulo}>
                {`• ${item.rotulo}`}
              </Texto>
              {item.detalhe ? (
                <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.silencioDetalhe}>
                  {item.detalhe}
                </Texto>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  topoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  titulo: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  pilula: {
    borderRadius: RAIO.pilula,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  textoPilula: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  reguaContainer: {
    gap: 6,
  },
  ponteiroTrack: {
    height: 12,
    position: "relative",
  },
  ponteiroExterno: {
    position: "absolute",
    top: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
  ponteiroInterno: {
    position: "absolute",
    top: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
  },
  faixas: {
    flexDirection: "row",
    gap: 4,
  },
  faixaCol: {
    flex: 1,
    gap: 4,
  },
  faixaCor: {
    height: 8,
    borderRadius: 4,
  },
  textoFaixa: {
    fontSize: 10.5,
    lineHeight: 13,
    textAlign: "center",
  },
  legendaPinos: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  descricao: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  subTexto: {
    fontSize: 12,
  },
  trilhoVida: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressoVida: {
    height: "100%",
    borderRadius: 4,
  },
  marcosVidaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textoMarco: {
    fontSize: 10.5,
  },
  silencioLinha: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  silencioBotao: {
    minHeight: TOQUE_MINIMO,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  silencioTituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  pontoVerde: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  silencioTitulo: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  silencioAcao: {
    fontSize: 12,
    fontWeight: "600",
  },
  silencioLista: {
    paddingBottom: 12,
    paddingLeft: 15,
    gap: 6,
  },
  silencioItem: {
    gap: 1,
  },
  silencioRotulo: {
    fontSize: 13,
  },
  silencioDetalhe: {
    fontSize: 12,
    paddingLeft: 10,
  },
});
