// Única fonte do custo mensal (arquiteto). Cartão do Explorar, Comparar e derivarDossie usam esta função;
// nenhuma outra tela soma parcelas por conta própria.
import type { AnaliseV2, ParcelaDoCusto, VisaoDoDossie } from "./contratos";
import { formatarReais } from "./formatos";

type Declarado = { valor: number | null; aConfirmar: boolean; origem: AnaliseV2["declarados"]["preco"]["origem"] };
export type CustoMensal = VisaoDoDossie["custo"] & { pendentes: number };

/** Atribui o valor a quem o trouxe: o anúncio (link ou texto) ou a própria pessoa. */
export function quemInforma(origem: Declarado["origem"]): string {
  return origem === "voce" ? "Você informou" : "O anúncio informa";
}

function parcela(nome: ParcelaDoCusto["nome"], d: Declarado): ParcelaDoCusto {
  if (d.valor === null) return { nome, valorMensal: null, estado: "desconhecido", nota: null };
  if (d.aConfirmar) return { nome, valorMensal: null, estado: "a_confirmar", nota: `${quemInforma(d.origem)} ${formatarReais(d.valor)}` };
  return { nome, valorMensal: d.valor, estado: "conhecido", nota: null };
}

function parcelaDoIptu(iptu: AnaliseV2["declarados"]["iptu"]): ParcelaDoCusto {
  if (iptu.valor !== null && iptu.periodo === "desconhecido")
    return { nome: "IPTU", valorMensal: null, estado: "a_confirmar", nota: `${quemInforma(iptu.origem)} ${formatarReais(iptu.valor)}, sem periodicidade` };
  const mensal = iptu.valor === null ? null : iptu.periodo === "ano" ? iptu.valor / 12 : iptu.valor;
  return parcela("IPTU", { valor: mensal, aConfirmar: iptu.aConfirmar, origem: iptu.origem });
}

function juntar(nomes: string[]): string {
  return nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/**
 * Parcelas esperadas aparecem sempre (aluguel: Aluguel, Condomínio, IPTU, Seguro incêndio; compra:
 * Condomínio, IPTU). Taxa de serviço e Outros só quando informados. Só parcela "conhecido" entra no total;
 * preço de compra nunca entra.
 */
export function custoMensal(a: AnaliseV2): CustoMensal {
  const d = a.declarados;
  const aluguel = a.modalidade === "aluguel";
  const parcelas: ParcelaDoCusto[] = [
    ...(aluguel ? [parcela("Aluguel", d.preco)] : []),
    parcela("Condomínio", d.condominio),
    parcelaDoIptu(d.iptu),
    ...(aluguel || d.seguroIncendio.valor !== null ? [parcela("Seguro incêndio", d.seguroIncendio)] : []),
    ...(d.taxaServico.valor !== null ? [parcela("Taxa de serviço", d.taxaServico)] : []),
    ...(d.outros.valor !== null ? [parcela("Outros", d.outros)] : []),
  ];
  const conhecidas = parcelas.filter((p) => p.estado === "conhecido");
  const total = conhecidas.length ? conhecidas.reduce((s, p) => s + p.valorMensal!, 0) : null;
  const fora = parcelas.filter((p) => p.estado !== "conhecido");
  const principal = d.preco.aConfirmar ? null : d.preco.valor;
  const area = d.area.aConfirmar ? null : d.area.valor;
  const parcelaDoAluguel = aluguel ? parcelas[0] : undefined;
  const aluguelConhecido = parcelaDoAluguel?.estado === "conhecido" ? parcelaDoAluguel.valorMensal : null;
  return {
    principal: {
      rotulo: aluguel ? "Aluguel anunciado" : "Preço anunciado",
      valor: principal,
      porM2: principal !== null && area ? principal / area : null,
    },
    totalMensalConhecido: total,
    alemDoPrincipal: aluguelConhecido !== null && total !== null ? total - aluguelConhecido : null,
    parcelas,
    notaForaDaSoma: fora.length ? `${juntar(fora.map((p) => p.nome))} fora da soma.` : null,
    pendentes: fora.length,
  };
}

/** Vocabulário compartilhado por cartões, dossiê e comparação. */
export const ROTULO_MENSAL_CONHECIDO = "Mensal conhecido";
export function avisoDeValoresPendentes(custo: VisaoDoDossie["custo"]): string | null {
  return custo.notaForaDaSoma ? "+ valores a confirmar" : null;
}
