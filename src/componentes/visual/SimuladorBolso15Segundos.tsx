import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { formatarReais, formatarReaisCompacto } from "../../dados/formatos";
import { prestacaoPrice } from "../../dados/custoPorPartes";
import { baseDeReferenciasPublicas } from "../../dados/recife/referenciasPublicas";
import { simularOtimizacaoItbiRecife } from "../../municipios/recife/motores/econometriaItbi";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";

const PRECOS_COMPRA = [
  { label: "R$ 450 mil", valor: 450_000 },
  { label: "R$ 750 mil", valor: 750_000 },
  { label: "R$ 1,1 mi", valor: 1_100_000 },
  { label: "R$ 1,6 mi", valor: 1_600_000 },
] as const;

const PRECOS_ALUGUEL = [
  { label: "R$ 2.500", valor: 2_500 },
  { label: "R$ 3.800", valor: 3_800 },
  { label: "R$ 5.500", valor: 5_500 },
  { label: "R$ 8.000", valor: 8_000 },
] as const;

export function SimuladorBolso15Segundos({
  entradaPct = 20,
  prazoAnos = 30,
}: {
  entradaPct?: number;
  prazoAnos?: number;
} = {}) {
  const { cor } = useTema();
  const [aberto, setAberto] = useState(false);
  const [modalidade, setModalidade] = useState<"compra" | "aluguel">("compra");
  const [valorSelecionado, setValorSelecionado] = useState<number>(750_000);
  const [entradaAtivaPct, setEntradaAtivaPct] = useState<number>(entradaPct);
  const [garantiaAluguel, setGarantiaAluguel] = useState<"caucao" | "fianca">("caucao");

  const refs = baseDeReferenciasPublicas();
  const compra = modalidade === "compra";
  const opcoes = compra ? PRECOS_COMPRA : PRECOS_ALUGUEL;
  const precoAtivo = opcoes.some((o) => o.valor === valorSelecionado)
    ? valorSelecionado
    : opcoes[1]!.valor;

  let caixaEntrar = 0;
  let mensalEstimado = 0;
  let economiaLegal = 0;

  if (compra) {
    const entradaReais = Math.round((precoAtivo * entradaAtivaPct) / 100);
    const valorFinanciadoReais = Math.max(0, precoAtivo - entradaReais);
    const prestacaoReais = prestacaoPrice(
      valorFinanciadoReais,
      prazoAnos * 12,
      refs.financiamento.taxaEfetivaAnualPct,
    );
    const itbi = simularOtimizacaoItbiRecife({
      precoImovelReais: precoAtivo,
      financiamentoSfh: true,
      percentualFinanciado: 1 - entradaAtivaPct / 100,
    });
    // Só o ITBI entra: escritura e registro ficam a confirmar no cartório (a tabela do TJPE não é proporcional ao preço).
    const fechamento = itbi.sfhOtimizado1Pct?.itbiReais ?? itbi.aVistaTempestivo18Pct.itbiReais;
    const condEst = Math.round((precoAtivo / 100_000) * 145);
    const iptuEst = Math.round((precoAtivo * 0.004) / 12);
    caixaEntrar = Math.round(entradaReais + fechamento);
    mensalEstimado = Math.round(prestacaoReais + condEst + iptuEst + 120);
    economiaLegal = Math.round(itbi.melhorCenarioEconomiaReais);
  } else {
    const condEst = Math.round(precoAtivo * 0.25);
    const iptuEst = Math.round(precoAtivo * 0.07);
    if (garantiaAluguel === "fianca") {
      caixaEntrar = Math.round(precoAtivo + condEst);
      mensalEstimado = Math.round(precoAtivo + condEst + iptuEst + 120 + precoAtivo * 0.1);
    } else {
      caixaEntrar = Math.round(precoAtivo * 3);
      mensalEstimado = Math.round(precoAtivo + condEst + iptuEst + 120);
    }
  }

  return (
    <View
      testID="simulador-bolso-15s"
      style={[
        styles.cartao,
        {
          backgroundColor: cor("cor-superficie"),
          borderColor: cor("cor-linha-forte"),
        },
      ]}
    >
      <Pressable
        testID="simulador-15s-toggle"
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        onPress={() => setAberto((v) => !v)}
        style={styles.cabecalhoBotao}
      >
        <View style={styles.topoEsq}>
          <Texto tipo="etiqueta" style={styles.tituloToggle}>
            Simular bolso em 15 segundos (sem colar link)
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.subToggle}>
            {aberto
              ? "Regras fiscais e financeiras do Recife aplicadas na hora"
              : "Veja entrada, imposto do Recife e saída mensal antes de buscar anúncio"}
          </Texto>
        </View>
        <Texto tipo="apoio" cor="cor-acao" style={styles.acaoToggle}>
          {aberto ? "Ocultar" : "Simular"}
        </Texto>
      </Pressable>

      {aberto ? (
        <View style={[styles.conteudo, { borderTopColor: cor("cor-linha") }]}>
          <View style={styles.chipsRow}>
            {(["compra", "aluguel"] as const).map((m) => {
              const ativo = modalidade === m;
              return (
                <Pressable
                  key={m}
                  testID={`sim15-mod-${m}`}
                  accessibilityRole="button"
                  onPress={() => {
                    setModalidade(m);
                    setValorSelecionado(m === "compra" ? 750_000 : 3_800);
                  }}
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
                    tipo="etiqueta"
                    cor={ativo ? "cor-superficie" : "cor-texto"}
                    style={styles.textoChip}
                  >
                    {m === "compra" ? "Comprar" : "Alugar"}
                  </Texto>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.chipsRow}>
            {opcoes.map((o) => {
              const ativo = precoAtivo === o.valor;
              return (
                <Pressable
                  key={o.valor}
                  testID={`sim15-preco-${o.valor}`}
                  accessibilityRole="button"
                  onPress={() => setValorSelecionado(o.valor)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: ativo
                        ? cor("cor-acao")
                        : cor("cor-papel-claro"),
                    },
                  ]}
                >
                  <Texto
                    tipo="etiqueta"
                    cor={ativo ? "cor-sobre-acao" : "cor-texto"}
                    style={styles.textoChip}
                  >
                    {o.label}
                  </Texto>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.chipsRow}>
            {compra
              ? ([20, 35] as const).map((pct) => {
                  const ativo = entradaAtivaPct === pct;
                  return (
                    <Pressable
                      key={pct}
                      testID={`sim15-entrada-${pct}`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: ativo }}
                      onPress={() => setEntradaAtivaPct(pct)}
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
                        tipo="etiqueta"
                        cor={ativo ? "cor-superficie" : "cor-texto"}
                        style={styles.textoChip}
                      >
                        {`Entrada ${pct}%`}
                      </Texto>
                    </Pressable>
                  );
                })
              : (
                  [
                    { id: "caucao", rotulo: "Caução (3 meses)" },
                    { id: "fianca", rotulo: "Fiança locatícia mensal" },
                  ] as const
                ).map((g) => {
                  const ativo = garantiaAluguel === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      testID={`sim15-garantia-${g.id}`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: ativo }}
                      onPress={() => setGarantiaAluguel(g.id)}
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
                        tipo="etiqueta"
                        cor={ativo ? "cor-superficie" : "cor-texto"}
                        style={styles.textoChip}
                      >
                        {g.rotulo}
                      </Texto>
                    </Pressable>
                  );
                })}
          </View>

          <View
            style={[
              styles.gradeResultados,
              { borderTopColor: cor("cor-linha"), borderBottomColor: cor("cor-linha") },
            ]}
          >
            <View style={styles.colRes}>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloRes}>
                {compra ? "Caixa para entrar (sem cartório)" : "Garantia estimada"}
              </Texto>
              <Texto tipo="numero" style={styles.valorRes}>
                {`~${formatarReaisCompacto(caixaEntrar)}`}
              </Texto>
            </View>
            <View
              style={[styles.divisorVert, { backgroundColor: cor("cor-linha") }]}
            />
            <View style={styles.colRes}>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.rotuloRes}>
                Saída real por mês
              </Texto>
              <Texto tipo="numero" style={styles.valorRes}>
                {`~${formatarReais(mensalEstimado)}/mês`}
              </Texto>
            </View>
          </View>

          {compra && economiaLegal > 0 ? (
            <Texto tipo="apoio" cor="cor-salvia-escura" style={styles.economiaTxt}>
              {`Economia possível de ITBI (SFH e pedido em até 180 dias): até ${formatarReais(economiaLegal)}`}
            </Texto>
          ) : null}

          <Texto testID="sim15-origens-calculo" tipo="apoio" cor="cor-texto-apoio" style={styles.origemTxt}>
            {compra
              ? "Origem de cada linha: financiamento pela taxa média Banco Central · entrada + ITBI pelas regras do Recife (escritura e registro a confirmar no cartório, fora da conta) · condomínio, IPTU e energia por estimativa parametrizada."
              : garantiaAluguel === "fianca"
                ? "Origem de cada linha: entrada sem caução tripla · fiança locatícia estimada em ~10%/mês (Lei nº 8.245/1991) · condomínio, IPTU e energia parametrizados."
                : "Origem de cada linha: caução estimada em 3 meses de aluguel · condomínio, IPTU e energia por estimativa parametrizada do anúncio."}
          </Texto>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/editar")}
            style={[styles.botaoEditar, { backgroundColor: cor("cor-papel-claro") }]}
          >
            <Texto tipo="etiqueta" cor="cor-texto" style={styles.textoBotaoEditar}>
              Montar análise completa com esses números
            </Texto>
          </Pressable>
        </View>
      ) : null}
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
  cabecalhoBotao: {
    minHeight: TOQUE_MINIMO + 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  topoEsq: {
    flex: 1,
    gap: 2,
  },
  tituloToggle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  subToggle: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  acaoToggle: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  conteudo: {
    borderTopWidth: 1,
    padding: 16,
    gap: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.pilula,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  textoChip: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  gradeResultados: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  colRes: {
    flex: 1,
    gap: 2,
  },
  divisorVert: {
    width: 1,
    height: 30,
    marginHorizontal: 10,
  },
  rotuloRes: {
    fontSize: 11,
  },
  valorRes: {
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  economiaTxt: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  origemTxt: {
    fontSize: 11,
    lineHeight: 15.5,
  },
  botaoEditar: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotaoEditar: {
    fontSize: 12.5,
    fontWeight: "700",
  },
});
