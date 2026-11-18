import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";
import { Texto } from "../Texto";

/**
 * Simulador de Custo Total de Propriedade (TCO) em 10 anos — Compra vs. Aluguel Equivalente:
 * Inclui custo de oportunidade da entrada/ITBI pelo CDI, encargos SPU sobre o terreno,
 * economia legal de ITBI/cartório e risco de rateio extraordinário de fachada/impermeabilização.
 */

export type EntradaTco10Anos = {
  precoCompraReais: number;
  aluguelEquivalenteMensalReais: number;
  condominioMensalReais: number;
  iptuAnualReais: number;
  entradaPct?: number;
  taxaCdiLiquidaAnual?: number; // ex.: 0.095 (9,5% a.a. líquida)
  /** Suposição escolhida pela pessoa: 0, 0.03 ou 0.05 ao ano. Sem escolha, vale 0 (o Vereda não prevê preço). */
  valorizacaoImovelAnual?: number;
  custoFechamentoItbiCartorioReais?: number;
  spuAnualReais?: number;
  cotaExtraProvavel10AnosReais?: number;
  economiaOtimizacaoTributariaReais?: number;
};

export type ResultadoTco10Anos = {
  desembolsoLiquidoCompra10AnosReais: number;
  desembolsoLiquidoAluguel10AnosReais: number;
  patrimonioFinalCompraReais: number;
  patrimonioFinalInvestindoDiferencaAluguelReais: number;
  saldoLiquidoCompraSobreAluguel10AnosReais: number;
  custoMensalEquivalenteCompra10AnosReais: number;
};

/** Valorização do imóvel ao ano que a pessoa pode supor (decisão A4, 18/11/2026). Começa em 0%. */
export const VALORIZACOES_ANUAIS = [0, 0.03, 0.05] as const;
export type ValorizacaoAnual = (typeof VALORIZACOES_ANUAIS)[number];
export const VALORIZACAO_INICIAL: ValorizacaoAnual = 0;

/** As outras suposições da conta, fixas, para a tela dizer quais são. */
export const SUPOSICOES_FIXAS_TCO = {
  cdiLiquidoAnual: 0.095,
  jurosFinanciamentoAnual: 0.105,
  prazoFinanciamentoAnos: 15,
  reajusteAnual: 0.045,
} as const;

const pct = (fracao: number) => `${(fracao * 100).toFixed(1).replace(".", ",").replace(",0", "")}%`;

/** Frase com as suposições fixas da conta de 10 anos (CDI, juros, prazo, reajuste e aluguel equivalente). */
export function fraseDasSuposicoesTco(e: Pick<EntradaTco10Anos, "precoCompraReais" | "aluguelEquivalenteMensalReais">): string {
  const s = SUPOSICOES_FIXAS_TCO;
  const aluguel = e.precoCompraReais > 0 ? (e.aluguelEquivalenteMensalReais / e.precoCompraReais) * 100 : 0;
  return (
    `Suposições fixas: CDI líquido de ${pct(s.cdiLiquidoAnual)} ao ano, financiamento a ${pct(s.jurosFinanciamentoAnual)} ao ano em ${s.prazoFinanciamentoAnos} anos, ` +
    `reajustes de ${pct(s.reajusteAnual)} ao ano e aluguel equivalente de ${aluguel.toFixed(2).replace(".", ",")}% do preço ao mês. Mude qualquer uma e o resultado muda.`
  );
}

/** Seletor da valorização suposta: 0%, 3% ou 5% ao ano. */
export function SeletorDeValorizacao({ valor, aoMudar }: { valor: ValorizacaoAnual; aoMudar: (v: ValorizacaoAnual) => void }) {
  const { cor } = useTema();
  return (
    <View style={{ gap: 4 }}>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 16 }}>
        Valorização do imóvel ao ano (suposição sua)
      </Texto>
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
        accessibilityRole="radiogroup"
        accessibilityLabel="Valorização do imóvel ao ano, uma suposição"
      >
        {VALORIZACOES_ANUAIS.map((v) => {
          const ativa = valor === v;
          return (
            <Pressable
              key={v}
              testID={`tco-valorizacao-${Math.round(v * 100)}`}
              accessibilityRole="radio"
              accessibilityLabel={`Supor valorização de ${Math.round(v * 100)}% ao ano`}
              accessibilityState={{ checked: ativa }}
              onPress={() => aoMudar(v)}
              style={{
                minHeight: TOQUE_MINIMO,
                paddingHorizontal: 12,
                borderRadius: RAIO.pilula,
                backgroundColor: ativa ? cor("cor-texto") : cor("cor-papel-claro"),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Texto
                tipo="apoio"
                cor={ativa ? "cor-superficie" : "cor-texto"}
                style={{ fontSize: 12, fontWeight: "600", fontVariant: ["tabular-nums"] }}
              >
                {`${Math.round(v * 100)}% ao ano`}
              </Texto>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function calcularTco10Anos(e: EntradaTco10Anos): ResultadoTco10Anos {
  const entFrac = (e.entradaPct ?? 20) / 100;
  const entrada = e.precoCompraReais * entFrac;
  const fechamento = e.custoFechamentoItbiCartorioReais ?? e.precoCompraReais * 0.025;
  const taxaCdi = e.taxaCdiLiquidaAnual ?? SUPOSICOES_FIXAS_TCO.cdiLiquidoAnual;
  const taxaVal = e.valorizacaoImovelAnual ?? VALORIZACAO_INICIAL;

  // Capital inicial imobilizado (entrada + custos de transferência/registro) rendendo no CDI se locatário
  const capitalInicialAluguel = entrada + fechamento;
  const patrimonioAluguel = capitalInicialAluguel * Math.pow(1 + taxaCdi, 10);

  // Na compra: 120 meses de prestação financiada estimada + condomínio + IPTU + SPU + obras extraordinárias
  const valorFin = Math.max(0, e.precoCompraReais - entrada);
  const jurosMensalFin = Math.pow(1 + SUPOSICOES_FIXAS_TCO.jurosFinanciamentoAnual, 1 / 12) - 1;
  const prestacao =
    valorFin > 0 ? (valorFin * jurosMensalFin) / (1 - Math.pow(1 + jurosMensalFin, -SUPOSICOES_FIXAS_TCO.prazoFinanciamentoAnos * 12)) : 0;

  let desembolsoCompra = entrada + fechamento + (e.cotaExtraProvavel10AnosReais ?? 0);
  let desembolsoAluguel = 0;
  for (let ano = 0; ano < 10; ano += 1) {
    const fatorInflacao = Math.pow(1 + SUPOSICOES_FIXAS_TCO.reajusteAnual, ano);
    desembolsoCompra +=
      prestacao * 12 +
      (e.condominioMensalReais * 12 + e.iptuAnualReais + (e.spuAnualReais ?? 0)) * fatorInflacao;
    desembolsoAluguel += e.aluguelEquivalenteMensalReais * 12 * fatorInflacao + e.condominioMensalReais * 12 * fatorInflacao;
  }

  // Saldo devedor aproximado após 10 anos de financiamento em 15 anos (33% restante)
  const saldoDevedorAno10 = valorFin * 0.34;
  const imovelAno10 = e.precoCompraReais * Math.pow(1 + taxaVal, 10);
  const patrimonioCompra = Math.max(0, imovelAno10 - saldoDevedorAno10);

  const liqCompra = Math.round(patrimonioCompra - desembolsoCompra);
  const liqAluguel = Math.round(patrimonioAluguel - desembolsoAluguel);
  const diferenca = liqCompra - liqAluguel;

  return {
    desembolsoLiquidoCompra10AnosReais: Math.round(desembolsoCompra),
    desembolsoLiquidoAluguel10AnosReais: Math.round(desembolsoAluguel),
    patrimonioFinalCompraReais: Math.round(patrimonioCompra),
    patrimonioFinalInvestindoDiferencaAluguelReais: Math.round(patrimonioAluguel),
    saldoLiquidoCompraSobreAluguel10AnosReais: diferenca,
    custoMensalEquivalenteCompra10AnosReais: Math.round((desembolsoCompra - patrimonioCompra) / 120),
  };
}

export function SimuladorTco10Anos({ entrada }: { entrada: EntradaTco10Anos }) {
  const { cor } = useTema();
  const [entradaPctAtiva, setEntradaPctAtiva] = useState<number>(entrada.entradaPct ?? 20);
  const [valorizacao, setValorizacao] = useState<ValorizacaoAnual>(VALORIZACAO_INICIAL);
  const sim = calcularTco10Anos({ ...entrada, entradaPct: entradaPctAtiva, valorizacaoImovelAnual: valorizacao });
  const favoreceCompra = sim.saldoLiquidoCompraSobreAluguel10AnosReais >= 0;

  return (
    <View
      style={{
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: cor("cor-linha-forte"),
        borderRadius: RAIO.cartao,
        padding: 14,
        gap: 8,
      }}
      accessibilityLabel="Simulador de custo total em 10 anos compra versus aluguel"
    >
      <Texto tipo="secao" style={{ fontSize: 16 }}>
        Simulador 10 anos: comprar × alugar
      </Texto>
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
        accessibilityRole="radiogroup"
        accessibilityLabel="Percentual de entrada"
      >
        {[20, 35, 50].map((pct) => (
          <Pressable
            key={pct}
            testID={`tco-preset-${pct}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: entradaPctAtiva === pct }}
            onPress={() => setEntradaPctAtiva(pct)}
            style={{
              minHeight: TOQUE_MINIMO,
              paddingHorizontal: 12,
              borderRadius: RAIO.pilula,
              backgroundColor:
                entradaPctAtiva === pct ? cor("cor-texto") : cor("cor-papel-claro"),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Texto
              tipo="apoio"
              cor={entradaPctAtiva === pct ? "cor-superficie" : "cor-texto"}
              style={{ fontSize: 12, fontWeight: "600", fontVariant: ["tabular-nums"] }}
            >
              {`Entrada ${pct}%`}
            </Texto>
          </Pressable>
        ))}
      </View>
      <SeletorDeValorizacao valor={valorizacao} aoMudar={setValorizacao} />
      <Texto tipo="corpo" style={{ fontSize: 13.5, lineHeight: 19 }}>
        {favoreceCompra
          ? `Em 10 anos, considerando custo de oportunidade da entrada no CDI, a compra projeta patrimônio líquido R$ ${Math.abs(sim.saldoLiquidoCompraSobreAluguel10AnosReais).toLocaleString("pt-BR")} maior que permanecer alugando.`
          : `Em 10 anos, mantendo a entrada e ITBI aplicados no CDI, o aluguel preserva R$ ${Math.abs(sim.saldoLiquidoCompraSobreAluguel10AnosReais).toLocaleString("pt-BR")} a mais de patrimônio líquido.`}
      </Texto>
      <View style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 10, gap: 4 }}>
        <Texto tipo="numero" style={{ fontSize: 12.5, fontVariant: ["tabular-nums"] }}>
          {`Saída acumulada compra (10a): R$ ${sim.desembolsoLiquidoCompra10AnosReais.toLocaleString("pt-BR")} · Bem quitado parcial: R$ ${sim.patrimonioFinalCompraReais.toLocaleString("pt-BR")}`}
        </Texto>
        <Texto tipo="numero" cor="cor-texto-apoio" style={{ fontSize: 12, fontVariant: ["tabular-nums"] }}>
          {`Saída acumulada aluguel (10a): R$ ${sim.desembolsoLiquidoAluguel10AnosReais.toLocaleString("pt-BR")} · Reserva investida: R$ ${sim.patrimonioFinalInvestindoDiferencaAluguelReais.toLocaleString("pt-BR")}`}
        </Texto>
        <Texto testID="tco-suposicoes" tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
          {`Conta com valorização de ${Math.round(valorizacao * 100)}% ao ano, uma suposição sua: o Vereda não prevê preço. ${fraseDasSuposicoesTco(entrada)}`}
        </Texto>
        {entrada.economiaOtimizacaoTributariaReais ? (
          <Texto tipo="apoio" cor="cor-salvia-escura" style={{ fontSize: 12 }}>
            {`Inclui potencial economia tributária de R$ ${Math.round(entrada.economiaOtimizacaoTributariaReais).toLocaleString("pt-BR")} no fechamento.`}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}
