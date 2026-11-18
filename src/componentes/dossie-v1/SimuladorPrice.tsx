// Simulador Price inline (15/11/2026): a pílula do financiamento abre aqui mesmo, com entrada e prazo em atalhos. Usa a
// mesma fórmula e a mesma taxa média do Banco Central do custo por partes; não entra no mensal conhecido do imóvel.
import { useState } from "react";
import { View } from "react-native";
import { prestacaoPrice, type SimulacaoDeCompra } from "../../dados/custoPorPartes";
import { formatarReais } from "../../dados/formatos";
import { useTema } from "../../tema/Tema";
import { RAIO } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Nota } from "./base";

export const ENTRADAS_PCT = [10, 20, 30, 50] as const;
export const PRAZOS_ANOS = [15, 20, 30, 35] as const;

export type ResultadoPrice = { entradaReais: number; financiadoReais: number; prestacaoReais: number; totalPagoReais: number; jurosReais: number };

/** Prestação, entrada, valor financiado, total pago e juros para um preço, entrada (%) e prazo (anos). */
export function simularPrice(precoReais: number, entradaPct: number, prazoAnos: number, taxaAnualPct: number): ResultadoPrice {
  const entradaReais = Math.round((precoReais * entradaPct) / 100);
  const financiadoReais = Math.max(0, precoReais - entradaReais);
  const prestacaoReais = prestacaoPrice(financiadoReais, prazoAnos * 12, taxaAnualPct);
  const totalPagoReais = prestacaoReais * prazoAnos * 12;
  return { entradaReais, financiadoReais, prestacaoReais, totalPagoReais, jurosReais: Math.max(0, totalPagoReais - financiadoReais) };
}

function Atalho({ rotulo, ativo, aoTocar, acessivel }: { rotulo: string; ativo: boolean; aoTocar: () => void; acessivel: string }) {
  const { cor } = useTema();
  return (
    <Pressionavel
      onPress={aoTocar}
      accessibilityRole="radio"
      accessibilityLabel={acessivel}
      accessibilityState={{ selected: ativo, checked: ativo }}
      aria-checked={ativo}
      style={{
        minHeight: 44, minWidth: 56, paddingHorizontal: 10, borderRadius: RAIO.pilula, alignItems: "center", justifyContent: "center",
        backgroundColor: ativo ? cor("cor-azul-cadastral-suave") : cor("cor-superficie"),
      }}
    >
      <Texto tipo="apoio" cor={ativo ? "cor-azul-cadastral" : "cor-texto"} style={{ fontSize: 12.5, lineHeight: 16, fontWeight: ativo ? "700" : "500", fontVariant: ["tabular-nums"] }}>{rotulo}</Texto>
    </Pressionavel>
  );
}

export function SimuladorPrice({ simulacao, aoFechar }: { simulacao: SimulacaoDeCompra; aoFechar: () => void }) {
  const { cor } = useTema();
  const preco = simulacao.entradaReais + simulacao.valorFinanciadoReais;
  const [entradaPct, setEntradaPct] = useState(simulacao.entradaPct);
  const [prazoAnos, setPrazoAnos] = useState(simulacao.prazoAnos);
  const r = simularPrice(preco, entradaPct, prazoAnos, simulacao.taxaEfetivaAnualPct);
  const entradas = [...new Set([...ENTRADAS_PCT, simulacao.entradaPct])].sort((a, b) => a - b);
  const prazos = [...new Set([...PRAZOS_ANOS, simulacao.prazoAnos])].sort((a, b) => a - b);
  return (
    <View role="group" aria-label="Simulador de financiamento" style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Texto tipo="apoio" cor="cor-azul-cadastral" style={{ fontSize: 11.5, lineHeight: 16, fontWeight: "700" }}>
          Simulação de financiamento (à parte)
        </Texto>
        <Pressionavel onPress={aoFechar} accessibilityRole="button" accessibilityLabel="Fechar a simulação" style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 16, lineHeight: 20 }}>✕</Texto>
        </Pressionavel>
      </View>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>Entrada</Texto>
      <View role="radiogroup" aria-label="Entrada" style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {entradas.map((p) => <Atalho key={p} rotulo={`${p}%`} ativo={entradaPct === p} aoTocar={() => setEntradaPct(p)} acessivel={`Entrada de ${p}%`} />)}
      </View>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>Prazo</Texto>
      <View role="radiogroup" aria-label="Prazo" style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {prazos.map((a) => <Atalho key={a} rotulo={`${a} anos`} ativo={prazoAnos === a} aoTocar={() => setPrazoAnos(a)} acessivel={`Prazo de ${a} anos`} />)}
      </View>
      <View accessibilityLiveRegion="polite" style={{ gap: 2, marginTop: 2 }}>
        <Texto tipo="numero" style={{ fontSize: 20, lineHeight: 26, fontWeight: "600" }}>{`~${formatarReais(r.prestacaoReais)}/mês`}</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17, fontVariant: ["tabular-nums"] }}>
          {`Entrada de ${formatarReais(r.entradaReais)} · financiar ${formatarReais(r.financiadoReais)} em ${prazoAnos * 12} parcelas.`}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17, fontVariant: ["tabular-nums"] }}>
          {`Total pago ao banco: ~${formatarReais(r.totalPagoReais)}, dos quais ~${formatarReais(r.jurosReais)} de juros.`}
        </Texto>
      </View>
      <Nota>{`Tabela Price com a ${simulacao.fonteCurta.charAt(0).toLowerCase()}${simulacao.fonteCurta.slice(1)}. Sem seguros e tarifas do banco; não é proposta de crédito nem entra no mensal conhecido do imóvel.`}</Nota>
    </View>
  );
}
