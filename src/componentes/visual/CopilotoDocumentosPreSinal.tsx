import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  AVISO_LEITURA_INDEPENDENTE,
  calcularRateioReserva,
  extrairChaveCnm,
  gerarScriptSindico3Perguntas,
} from "../../dados/documentos/copilotoPreSinal";
import { formatarReais, formatarReaisCompacto } from "../../dados/formatos";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";

type Props = {
  nomeImovel: string;
  anoConstrucao: number | null;
  unidades: number | null;
  chaveLote14: string | null;
  textoAnuncio?: string | null;
  spuAtivo?: boolean;
};

const CENARIOS_OBRA = [
  { label: "Obra R$ 120 mil", valor: 120_000 },
  { label: "Fachada R$ 250 mil", valor: 250_000 },
  { label: "Colunas R$ 500 mil", valor: 500_000 },
] as const;

const CENARIOS_RESERVA = [
  { label: "Sem reserva", valor: 0 },
  { label: "R$ 50 mil", valor: 50_000 },
  { label: "R$ 150 mil", valor: 150_000 },
] as const;

export function CopilotoDocumentosPreSinal({
  nomeImovel,
  anoConstrucao,
  unidades,
  chaveLote14,
  textoAnuncio,
  spuAtivo = false,
}: Props) {
  const { cor } = useTema();
  const [custoObra, setCustoObra] = useState<number>(250_000);
  const [saldoReserva, setSaldoReserva] = useState<number>(50_000);
  const [verPerguntas, setVerPerguntas] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);

  const unidadesBase = Math.max(1, unidades ?? 24);
  const rateio = calcularRateioReserva({
    custoObraReais: custoObra,
    saldoReservaReais: saldoReserva,
    unidades: unidadesBase,
  });

  const cnm = extrairChaveCnm(textoAnuncio ?? "");
  const script = gerarScriptSindico3Perguntas({
    nomeImovel,
    anoConstrucao,
    unidades,
    spuAtivo,
  });

  const copiarPerguntas = () => {
    void Clipboard.setStringAsync(script)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
      })
      .catch(() => {
        setCopiado(false);
      });
  };

  return (
    <View
      testID="copiloto-documentos-pre-sinal"
      style={[
        styles.cartao,
        {
          backgroundColor: cor("cor-superficie"),
          borderColor: cor("cor-linha-forte"),
        },
      ]}
    >
      {/* Cabecalho + Chaves duplas de identificacao */}
      <View style={styles.secao}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
          Documentação e caixa antes do sinal
        </Texto>
        <Texto tipo="secao" style={styles.manchete}>
          Pergunte 3 pontos ao síndico e simule o impacto de obras na unidade
        </Texto>

        <View style={styles.chavesLinha}>
          <View style={styles.chaveItem}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.chaveRotulo}>
              Chave municipal do lote
            </Texto>
            <Texto tipo="numero" style={styles.chaveValor}>
              {chaveLote14 ?? "A confirmar no vínculo"}
            </Texto>
          </View>
          <View style={styles.chaveItem}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.chaveRotulo}>
              Matrícula nacional (CNM)
            </Texto>
            <Texto tipo="numero" style={styles.chaveValor}>
              {cnm.encontrada && cnm.formatada
                ? cnm.formatada
                : "Solicitar certidão (16 dígitos)"}
            </Texto>
          </View>
        </View>
      </View>

      {/* Simulador instantaneo de fundo de reserva vs obra (CondoScan R5) */}
      <View style={[styles.secao, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
        <View style={styles.linhaTopoCalc}>
          <Texto tipo="etiqueta" style={styles.subTitulo}>
            Simulador de rateio por obra
          </Texto>
          <Texto
            tipo="numero"
            cor={rateio.cobertoPelaReserva ? "cor-salvia-escura" : "cor-barro-texto"}
            style={styles.valorRateio}
          >
            {rateio.cobertoPelaReserva
              ? "Coberto pelo caixa"
              : `~${formatarReais(rateio.cotaExtraPorUnidadeReais)}/unid.`}
          </Texto>
        </View>

        <View style={styles.chipsRow}>
          {CENARIOS_OBRA.map((c) => {
            const ativo = custoObra === c.valor;
            return (
              <Pressable
                key={c.valor}
                testID={`calc-obra-${c.valor}`}
                accessibilityRole="button"
                onPress={() => setCustoObra(c.valor)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: ativo
                      ? cor("cor-texto")
                      : cor("cor-papel-claro"),
                  },
                ]}
              >
                <Texto
                  tipo="apoio"
                  cor={ativo ? "cor-superficie" : "cor-texto"}
                  style={styles.textoChip}
                >
                  {c.label}
                </Texto>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.chipsRow}>
          {CENARIOS_RESERVA.map((r) => {
            const ativo = saldoReserva === r.valor;
            return (
              <Pressable
                key={r.valor}
                testID={`calc-reserva-${r.valor}`}
                accessibilityRole="button"
                onPress={() => setSaldoReserva(r.valor)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: ativo
                      ? cor("cor-azul-cadastral")
                      : cor("cor-papel-claro"),
                  },
                ]}
              >
                <Texto
                  tipo="apoio"
                  cor={ativo ? "cor-superficie" : "cor-texto"}
                  style={styles.textoChip}
                >
                  {r.label}
                </Texto>
              </Pressable>
            );
          })}
        </View>

        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.resumoCalc}>
          {unidades
            ? rateio.resumoCurto
            : `${rateio.resumoCurto} Base ilustrativa de ${unidadesBase} unidades (${formatarReaisCompacto(custoObra)} − ${formatarReaisCompacto(saldoReserva)}).`}
        </Texto>
      </View>

      {/* Roteiro fechado em 3 perguntas + copiar WhatsApp (Eli R23 + R32) */}
      <View style={[styles.secao, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: verPerguntas }}
          onPress={() => setVerPerguntas((v) => !v)}
          style={styles.botaoVerScript}
        >
          <Texto tipo="etiqueta" style={styles.subTitulo}>
            Script fechado com 3 perguntas ao síndico
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.acaoVer}>
            {verPerguntas ? "Ocultar" : "Ler roteiro"}
          </Texto>
        </Pressable>

        {verPerguntas ? (
          <Texto tipo="apoio" cor="cor-texto" style={styles.textoScript}>
            {script}
          </Texto>
        ) : null}

        <Pressable
          testID="copiloto-copiar-3-perguntas"
          accessibilityRole="button"
          onPress={copiarPerguntas}
          style={({ pressed }) => [
            styles.botaoCopiar,
            {
              backgroundColor: copiado
                ? cor("cor-salvia-suave")
                : cor("cor-papel-claro"),
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Texto
            tipo="etiqueta"
            cor={copiado ? "cor-salvia-escura" : "cor-texto"}
            style={styles.textoBotaoCopiar}
          >
            {copiado
              ? "3 perguntas copiadas! Cole no WhatsApp"
              : "Copiar 3 perguntas para síndico / corretor"}
          </Texto>
        </Pressable>

        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.avisoIndep}>
          {AVISO_LEITURA_INDEPENDENTE}
        </Texto>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    overflow: "hidden",
  },
  secao: {
    padding: 16,
    gap: 9,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  manchete: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  chavesLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 2,
  },
  chaveItem: {
    flexGrow: 1,
    gap: 2,
  },
  chaveRotulo: {
    fontSize: 11,
  },
  chaveValor: {
    fontSize: 12.5,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  linhaTopoCalc: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 8,
  },
  subTitulo: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  valorRateio: {
    fontSize: 14.5,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    minHeight: 38,
    borderRadius: RAIO.pilula,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  textoChip: {
    fontSize: 11.5,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  resumoCalc: {
    fontSize: 12,
    lineHeight: 17,
    fontVariant: ["tabular-nums"],
  },
  botaoVerScript: {
    minHeight: TOQUE_MINIMO - 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  acaoVer: {
    fontSize: 12,
    fontWeight: "600",
  },
  textoScript: {
    fontSize: 12,
    lineHeight: 18,
  },
  botaoCopiar: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotaoCopiar: {
    fontSize: 13,
    fontWeight: "700",
  },
  avisoIndep: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
