import { z } from "zod";
import type { AnaliseV2 } from "./contratos";
import { custoMensal } from "./custos";
import { esquemaCenario, type Caderno } from "./caderno";

const dinheiro = z.number().int().min(0).max(1e12);
const prazo = z.number().int().min(1).max(600);
function centavosSeguros(valor: number): number {
  const arredondado = Math.round(valor);
  if (!Number.isSafeInteger(arredondado)) throw new Error("As hipóteses excedem a precisão monetária desta simulação. Reduza taxas, valores ou horizonte.");
  return arredondado;
}

/** Valor da parcela Price; taxa mensal efetiva em fração (0,01 = 1%). Não é CET. */
export function price(principalCentavos: number, taxaMensal: number, meses: number) {
  dinheiro.parse(principalCentavos);
  z.number().finite().min(0).max(1).parse(taxaMensal);
  prazo.parse(meses);
  const parcelaExata = taxaMensal === 0 ? principalCentavos / meses :
    principalCentavos * taxaMensal / -Math.expm1(-meses * Math.log1p(taxaMensal));
  const parcelaCentavos = centavosSeguros(parcelaExata);
  let saldo = principalCentavos;
  let pago = 0;
  let ultima = 0;
  for (let mes = 1; mes <= meses; mes++) {
    const devido = saldo * (1 + taxaMensal);
    ultima = mes === meses ? devido : Math.min(parcelaCentavos, devido);
    pago += ultima;
    saldo = Math.max(0, devido - ultima);
  }
  return { parcelaCentavos, parcelaFinalCentavos: centavosSeguros(ultima), jurosCentavos: centavosSeguros(pago - principalCentavos),
    excluidos: "Seguros, tarifas, tributos, TR e demais indexadores não incluídos." };
}
export function taxaMensalEfetiva(taxaAnual: number): number {
  z.number().finite().gt(-1).max(10).parse(taxaAnual);
  return Math.expm1(Math.log1p(taxaAnual) / 12);
}

export function horizonte(a: AnaliseV2, c: Caderno["cenarios"][number]) {
  esquemaCenario.parse(c);
  const custo = custoMensal(a);
  const mensal = custo.totalMensalConhecido === null ? null : Math.round(custo.totalMensalConhecido * 100);
  // Itens detalhados substituem os agregados somente neste cenário. Os campos
  // antigos continuam no arquivo, para reversão e leitura do caderno anterior.
  const total = (categoria: "inicial" | "mensal" | "reembolsavel", horizonte: boolean) => {
    const itens = c.itens!.filter(i => i.categoria === categoria);
    const conhecidos = itens.filter(i => i.valorCentavos !== null);
    return conhecidos.length ? centavosSeguros(conhecidos.reduce((s, i) => s + i.valorCentavos! * (horizonte && categoria === "mensal" ? Math.min(i.duracaoMeses ?? c.meses, c.meses) : 1), 0)) : null;
  };
  const detalhado = c.itens !== undefined && c.usarItens !== false;
  const extras = detalhado ? total("mensal", true) : c.extrasMensaisCentavos === null ? null : c.extrasMensaisCentavos * c.meses;
  const despesas = detalhado ? total("inicial", false) : c.despesasIniciaisCentavos;
  const caucao = detalhado ? total("reembolsavel", false) : c.caucaoCentavos;
  const itensCompletos = !detalhado || (["inicial", "mensal", "reembolsavel"] as const).every(t => c.itens!.some(i => i.categoria === t) && c.itens!.filter(i => i.categoria === t).every(i => i.valorCentavos !== null));
  return {
    mensalConhecidoCentavos: mensal,
    despesaConhecidaCentavos: mensal === null && extras === null && despesas === null ? null :
      centavosSeguros((mensal ?? 0) * c.meses + (extras ?? 0) + (despesas ?? 0)),
    caixaInicialConhecidoCentavos: despesas === null && caucao === null ? null : centavosSeguros((despesas ?? 0) + (caucao ?? 0)),
    completo: itensCompletos && custo.parcelas.every(p => p.estado === "conhecido") && mensal !== null && extras !== null && despesas !== null && caucao !== null,
    caucaoCentavos: caucao,
  };
}

export const esquemaCompraAluguel = z.strictObject({
  precoCentavos: dinheiro, entradaCentavos: dinheiro, taxaMensal: z.number().min(0).max(1), prazo: prazo,
  horizonte: prazo, aluguelMensalCentavos: dinheiro, custosCompraMensaisCentavos: dinheiro,
  custosAquisicaoCentavos: dinheiro, retornoMensal: z.number().min(-0.1).max(1),
  valorizacaoMensal: z.number().min(-0.1).max(1), custoVendaFracao: z.number().min(0).max(1),
}).refine(x => x.entradaCentavos <= x.precoCentavos, "Entrada maior que aquisição");

/** Cenários nominais: diferenças de caixa são investidas, inclusive quando favorecem a compra. */
export function comprarOuAlugar(entrada: z.input<typeof esquemaCompraAluguel>) {
  const x = esquemaCompraAluguel.parse(entrada);
  let saldo = x.precoCentavos - x.entradaCentavos;
  const parcela = price(saldo, x.taxaMensal, x.prazo).parcelaCentavos;
  let investimentoAluguel = x.entradaCentavos + x.custosAquisicaoCentavos;
  let investimentoCompra = 0;
  for (let mes = 1; mes <= x.horizonte; mes++) {
    const devido = saldo * (1 + x.taxaMensal);
    // Quitar exige pagamento: nunca perdoar o saldo residual de parcelas arredondadas.
    const pagamento = mes > x.prazo ? 0 : mes === x.prazo ? devido : Math.min(parcela, devido);
    saldo = Math.max(0, saldo * (1 + x.taxaMensal) - pagamento);
    const diferenca = pagamento + x.custosCompraMensaisCentavos - x.aluguelMensalCentavos;
    investimentoAluguel = investimentoAluguel * (1 + x.retornoMensal) + Math.max(0, diferenca);
    investimentoCompra = investimentoCompra * (1 + x.retornoMensal) + Math.max(0, -diferenca);
  }
  const valor = x.precoCentavos * (1 + x.valorizacaoMensal) ** x.horizonte;
  return { saldoDevedorCentavos: centavosSeguros(saldo), patrimonioCompraCentavos: centavosSeguros(valor * (1 - x.custoVendaFracao) - saldo + investimentoCompra),
    investimentoAluguelCentavos: centavosSeguros(investimentoAluguel), parcelaCentavos: parcela };
}
