import { View } from "react-native";
import { useTema } from "../../tema/Tema";
import { RAIO, comAlfa } from "../../tema/tokens";
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
  valorizacaoImovelAnual?: number; // ex.: 0.05 (5% a.a.)
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

export function calcularTco10Anos(e: EntradaTco10Anos): ResultadoTco10Anos {
  const entFrac = (e.entradaPct ?? 20) / 100;
  const entrada = e.precoCompraReais * entFrac;
  const fechamento = e.custoFechamentoItbiCartorioReais ?? e.precoCompraReais * 0.025;
  const taxaCdi = e.taxaCdiLiquidaAnual ?? 0.095;
  const taxaVal = e.valorizacaoImovelAnual ?? 0.05;

  // Capital inicial imobilizado (entrada + custos de transferência/registro) rendendo no CDI se locatário
  const capitalInicialAluguel = entrada + fechamento;
  const patrimonioAluguel = capitalInicialAluguel * Math.pow(1 + taxaCdi, 10);

  // Na compra: 120 meses de prestação financiada estimada + condomínio + IPTU + SPU + obras extraordinárias
  const valorFin = Math.max(0, e.precoCompraReais - entrada);
  const jurosMensalFin = Math.pow(1 + 0.105, 1 / 12) - 1;
  const prestacao =
    valorFin > 0 ? (valorFin * jurosMensalFin) / (1 - Math.pow(1 + jurosMensalFin, -180)) : 0;

  let desembolsoCompra = entrada + fechamento + (e.cotaExtraProvavel10AnosReais ?? 0);
  let desembolsoAluguel = 0;
  for (let ano = 0; ano < 10; ano += 1) {
    const fatorInflacao = Math.pow(1.045, ano);
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
  const sim = calcularTco10Anos(entrada);
  const favoreceCompra = sim.saldoLiquidoCompraSobreAluguel10AnosReais >= 0;

  return (
    <View
      style={{
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto"), 0.12),
        borderRadius: RAIO.cartao,
        padding: 14,
        gap: 8,
      }}
      accessibilityLabel="Simulador de custo total em 10 anos compra versus aluguel"
    >
      <Texto tipo="secao" style={{ fontSize: 16 }}>
        Simulador 10 anos: comprar × alugar
      </Texto>
      <Texto tipo="corpo" style={{ fontSize: 13.5, lineHeight: 19 }}>
        {favoreceCompra
          ? `Em 10 anos, considerando custo de oportunidade da entrada no CDI, a compra projeta patrimônio líquido R$ ${Math.abs(sim.saldoLiquidoCompraSobreAluguel10AnosReais).toLocaleString("pt-BR")} maior que permanecer alugando.`
          : `Em 10 anos, mantendo a entrada e ITBI aplicados no CDI, o aluguel preserva R$ ${Math.abs(sim.saldoLiquidoCompraSobreAluguel10AnosReais).toLocaleString("pt-BR")} a mais de patrimônio líquido.`}
      </Texto>
      <View style={{ backgroundColor: cor("cor-creme"), borderRadius: RAIO.quadrado, padding: 10, gap: 4 }}>
        <Texto tipo="numero" style={{ fontSize: 12.5, fontVariant: ["tabular-nums"] }}>
          {`Saída acumulada compra (10a): R$ ${sim.desembolsoLiquidoCompra10AnosReais.toLocaleString("pt-BR")} · Bem quitado parcial: R$ ${sim.patrimonioFinalCompraReais.toLocaleString("pt-BR")}`}
        </Texto>
        <Texto tipo="numero" cor="cor-texto-apoio" style={{ fontSize: 12, fontVariant: ["tabular-nums"] }}>
          {`Saída acumulada aluguel (10a): R$ ${sim.desembolsoLiquidoAluguel10AnosReais.toLocaleString("pt-BR")} · Reserva investida: R$ ${sim.patrimonioFinalInvestindoDiferencaAluguelReais.toLocaleString("pt-BR")}`}
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
