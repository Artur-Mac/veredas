import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  POLOS_RECIFE,
  compararRotinaDoisDestinos,
  fraseDoMetodoDaRotina,
  type FaixaHorarioTrajeto,
  type PoloDestinoRecife,
} from "../../dados/mobilidade/rotinaCasal";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";

/** O que a pessoa escolhe no cartão: os dois destinos, o horário e os dias presenciais. */
export type EscolhaDaRotina = {
  destino1Id: PoloDestinoRecife["id"];
  destino2Id: PoloDestinoRecife["id"];
  faixaHorario: FaixaHorarioTrajeto;
  diasPresenciais: 20 | 12;
};
export const ESCOLHA_INICIAL_DA_ROTINA: EscolhaDaRotina = { destino1Id: "polo_porto_digital", destino2Id: "polo_boa_viagem", faixaHorario: "pico", diasPresenciais: 20 };

type Props = {
  /** Com estes dois, a escolha fica com quem chama (o Comparar usa a mesma no Duelo). */
  escolha?: EscolhaDaRotina;
  aoMudarEscolha?: (e: EscolhaDaRotina) => void;
  nomeOpcaoA: string;
  centroA: readonly [number, number] | null;
  bairroA: string | null;
  nomeOpcaoB: string;
  centroB: readonly [number, number] | null;
  bairroB: string | null;
};

export function RotinaDoisDestinosComparar({
  nomeOpcaoA,
  centroA,
  bairroA,
  nomeOpcaoB,
  centroB,
  bairroB,
  escolha,
  aoMudarEscolha,
}: Props) {
  const { cor } = useTema();
  const [interna, setInterna] = useState<EscolhaDaRotina>(ESCOLHA_INICIAL_DA_ROTINA);
  const atual = escolha ?? interna;
  const { destino1Id, destino2Id, faixaHorario, diasPresenciais } = atual;
  // Sem quem controle, atualização funcional: dois toques seguidos não se desfazem.
  const mudar = (parte: Partial<EscolhaDaRotina>) => {
    if (aoMudarEscolha) aoMudarEscolha({ ...atual, ...parte });
    else setInterna((anterior) => ({ ...anterior, ...parte }));
  };
  const setDestino1Id = (id: PoloDestinoRecife["id"]) => mudar({ destino1Id: id });
  const setDestino2Id = (id: PoloDestinoRecife["id"]) => mudar({ destino2Id: id });
  const setFaixaHorario = (f: FaixaHorarioTrajeto) => mudar({ faixaHorario: f });
  const setDiasPresenciais = (d: 20 | 12) => mudar({ diasPresenciais: d });

  const resultado = compararRotinaDoisDestinos({
    nomeOpcaoA,
    centroA,
    bairroA,
    nomeOpcaoB,
    centroB,
    bairroB,
    destino1Id,
    destino2Id,
    diasPresenciaisMes: diasPresenciais,
    faixaHorario,
  });
  const difMinDia = Math.abs(resultado.minutosDiaOpcaoA - resultado.minutosDiaOpcaoB);
  const horasMesMenos = Math.round(((difMinDia * diasPresenciais) / 60) * 10) / 10;
  const diasUteisAnoMenos = Math.round(((horasMesMenos * 12) / 8) * 10) / 10;

  return (
    <View
      testID="rotina-dois-destinos-comparar"
      style={[
        styles.cartao,
        {
          backgroundColor: cor("cor-superficie"),
          borderColor: cor("cor-linha-forte"),
        },
      ]}
    >
      <View style={styles.cabecalho}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
          {faixaHorario === "pico"
            ? "Rotina a dois destinos (ida e volta no pico)"
            : "Rotina a dois destinos (ida e volta fora de pico)"}
        </Texto>
        <Texto tipo="secao" style={styles.manchete}>
          {resultado.resumoRotina}
        </Texto>
      </View>

      {/* Seletores compactos sem caixas aninhadas */}
      <View style={[styles.secao, { borderTopColor: cor("cor-linha") }]}>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloPolo}>
          Trajeto 1
        </Texto>
        <View style={styles.chipsRow}>
          {POLOS_RECIFE.map((p) => {
            const ativo = destino1Id === p.id;
            return (
              <Pressable
                key={`d1-${p.id}`}
                accessibilityRole="button"
                onPress={() => setDestino1Id(p.id)}
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
                  {p.nomeCurto}
                </Texto>
              </Pressable>
            );
          })}
        </View>

        <Texto
          tipo="apoio"
          cor="cor-texto-apoio"
          style={[styles.rotuloPolo, { marginTop: 4 }]}
        >
          Trajeto 2
        </Texto>
        <View style={styles.chipsRow}>
          {POLOS_RECIFE.map((p) => {
            const ativo = destino2Id === p.id;
            return (
              <Pressable
                key={`d2-${p.id}`}
                accessibilityRole="button"
                onPress={() => setDestino2Id(p.id)}
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
                  {p.nomeCurto}
                </Texto>
              </Pressable>
            );
          })}
        </View>

        <Texto
          tipo="apoio"
          cor="cor-texto-apoio"
          style={[styles.rotuloPolo, { marginTop: 4 }]}
        >
          Premissa de horário e frequência
        </Texto>
        <View style={styles.chipsRow}>
          <Pressable
            testID="rotina-faixa-pico"
            accessibilityRole="radio"
            accessibilityState={{ checked: faixaHorario === "pico" }}
            onPress={() => setFaixaHorario("pico")}
            style={[
              styles.chip,
              {
                backgroundColor:
                  faixaHorario === "pico" ? cor("cor-texto") : cor("cor-papel-claro"),
              },
            ]}
          >
            <Texto
              tipo="apoio"
              cor={faixaHorario === "pico" ? "cor-superficie" : "cor-texto"}
              style={[styles.textoChip, { fontVariant: ["tabular-nums"] }]}
            >
              Pico (7h30 / 18h)
            </Texto>
          </Pressable>
          <Pressable
            testID="rotina-faixa-fora-pico"
            accessibilityRole="radio"
            accessibilityState={{ checked: faixaHorario === "fora_pico" }}
            onPress={() => setFaixaHorario("fora_pico")}
            style={[
              styles.chip,
              {
                backgroundColor:
                  faixaHorario === "fora_pico" ? cor("cor-texto") : cor("cor-papel-claro"),
              },
            ]}
          >
            <Texto
              tipo="apoio"
              cor={faixaHorario === "fora_pico" ? "cor-superficie" : "cor-texto"}
              style={[styles.textoChip, { fontVariant: ["tabular-nums"] }]}
            >
              Fora de pico (10h / 15h)
            </Texto>
          </Pressable>
          <Pressable
            testID="rotina-dias-20"
            accessibilityRole="radio"
            accessibilityState={{ checked: diasPresenciais === 20 }}
            onPress={() => setDiasPresenciais(20)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  diasPresenciais === 20 ? cor("cor-azul-cadastral") : cor("cor-papel-claro"),
              },
            ]}
          >
            <Texto
              tipo="apoio"
              cor={diasPresenciais === 20 ? "cor-superficie" : "cor-texto"}
              style={[styles.textoChip, { fontVariant: ["tabular-nums"] }]}
            >
              20 dias/mês
            </Texto>
          </Pressable>
          <Pressable
            testID="rotina-dias-12"
            accessibilityRole="radio"
            accessibilityState={{ checked: diasPresenciais === 12 }}
            onPress={() => setDiasPresenciais(12)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  diasPresenciais === 12 ? cor("cor-azul-cadastral") : cor("cor-papel-claro"),
              },
            ]}
          >
            <Texto
              tipo="apoio"
              cor={diasPresenciais === 12 ? "cor-superficie" : "cor-texto"}
              style={[styles.textoChip, { fontVariant: ["tabular-nums"] }]}
            >
              Híbrido (12 dias)
            </Texto>
          </Pressable>
        </View>
      </View>

      {/* Comparativo lado a lado por hairline */}
      <View style={[styles.linhaTotais, { borderTopColor: cor("cor-linha") }]}>
        <View style={styles.colTotal}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.nomeCol} numberOfLines={1}>
            {nomeOpcaoA}
          </Texto>
          <Texto
            tipo="numero"
            cor={
              resultado.vencedorRotina === "A" ? "cor-salvia-escura" : "cor-texto"
            }
            style={styles.valorTotal}
          >
            {`~${resultado.minutosDiaOpcaoA} min/dia`}
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.detalheTrajeto}>
            {`${resultado.destino1.nomeCurto} ${resultado.pessoa1OpcaoAMin}m · ${resultado.destino2.nomeCurto} ${resultado.pessoa2OpcaoAMin}m`}
          </Texto>
        </View>

        <View
          style={[styles.divisorVert, { backgroundColor: cor("cor-linha") }]}
        />

        <View style={styles.colTotal}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.nomeCol} numberOfLines={1}>
            {nomeOpcaoB}
          </Texto>
          <Texto
            tipo="numero"
            cor={
              resultado.vencedorRotina === "B" ? "cor-salvia-escura" : "cor-texto"
            }
            style={styles.valorTotal}
          >
            {`~${resultado.minutosDiaOpcaoB} min/dia`}
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.detalheTrajeto}>
            {`${resultado.destino1.nomeCurto} ${resultado.pessoa1OpcaoBMin}m · ${resultado.destino2.nomeCurto} ${resultado.pessoa2OpcaoBMin}m`}
          </Texto>
        </View>
      </View>

      {difMinDia >= 6 && resultado.vencedorRotina !== "empate" ? (
        <View
          testID="rotina-economia-mensal"
          style={[styles.faixaEconomia, { borderTopColor: cor("cor-linha") }]}
        >
          <Texto tipo="apoio" cor="cor-salvia-escura" style={styles.textoEconomia}>
            {`~${String(horasMesMenos).replace(".", ",")} h/mês a menos no trânsito (~${String(diasUteisAnoMenos).replace(".", ",")} dias úteis de 8h por ano) em ${resultado.vencedorRotina === "A" ? nomeOpcaoA : nomeOpcaoB} considerando ${diasPresenciais} dias presenciais.`}
          </Texto>
        </View>
      ) : null}

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: cor("cor-linha"),
          paddingHorizontal: 14,
          paddingVertical: 8,
        }}
      >
        <Texto testID="rotina-aviso-tabela" tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15, fontVariant: ["tabular-nums"] }}>
          {fraseDoMetodoDaRotina(faixaHorario, diasPresenciais)}
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
    marginBottom: 14,
  },
  cabecalho: {
    padding: 16,
    paddingBottom: 12,
    gap: 3,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  manchete: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  secao: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 6,
  },
  rotuloPolo: {
    fontSize: 11,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  chip: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.pilula,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  textoChip: {
    fontSize: 11,
    fontWeight: "600",
  },
  linhaTotais: {
    borderTopWidth: 1,
    flexDirection: "row",
    padding: 14,
    gap: 10,
    alignItems: "center",
  },
  faixaEconomia: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textoEconomia: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  colTotal: {
    flex: 1,
    gap: 2,
  },
  divisorVert: {
    width: 1,
    alignSelf: "stretch",
  },
  nomeCol: {
    fontSize: 12,
    fontWeight: "600",
  },
  valorTotal: {
    fontSize: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  detalheTrajeto: {
    fontSize: 11,
    lineHeight: 15,
    fontVariant: ["tabular-nums"],
  },
});
