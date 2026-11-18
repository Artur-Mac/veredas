// Placar do Comparar (15/11/2026, sabatina: "seções com vencedor"). Uma linha por seção — Custo, Espaço, Dia a dia a pé,
// Rua e clima — com quem ganha e por quanto, e qual aba abre. Puro: recebe a comparação e os indicadores de cada prédio.
import type { Indicador } from "../../dados/dossie/indicadores";
import { formatarNumero, formatarReais } from "../../dados/formatos";
import type { Comparacao, Par, Topico } from "./comparar";

export type LinhaDoPlacar = {
  id: "custo" | "custo_total" | "espaco" | "a_pe" | "rua" | "rotina" | "ambiente" | "condominio";
  secao: string;
  /** 0 ou 1: quem ganha; null: empate ou sem dado para os dois. */
  vencedor: 0 | 1 | null;
  frase: string;
  /** A aba do Comparar que mostra o detalhe. */
  topico: Topico;
};

const nome = (r: Par<string>, i: 0 | 1) => r[i];

/** Minutos a pé até mercado + farmácia + ônibus, do indicador "a_pe" (frase "Mercado a X min, farmácia a Y min e ônibus a Z min"). */
function minutosDoDia(ind: readonly Indicador[] | null): number | null {
  const i = ind?.find((x) => x.id === "a_pe");
  if (!i) return null;
  const ms = [...i.frase.matchAll(/a (\d+|menos de 1) min/g)].map((m) => (m[1] === "menos de 1" ? 0.5 : Number(m[1])));
  return ms.length === 3 ? ms.reduce((s, x) => s + x, 0) : null;
}

const atencoes = (ind: readonly Indicador[] | null) => (ind ?? []).filter((i) => i.classe === "pior" && i.id !== "a_pe");

/**
 * 15/11/2026 (copiloto): o que mais entra no placar, calculado pela tela.
 * - custo total da compra: preço + ITBI numa faixa de 1,8% a 3% (Código Tributário do Recife, arts. 52 e 55: 3% na regra
 *   comum, 1,8% com o lançamento pedido em até 180 dias; a parte financiada pelo SFH paga 1%) + escritura e registro
 *   a confirmar (nunca 0);
 * - rotina: ida programada das 7h até o bairro de destino (camada "Onde mais procurar"), em horas por mês e dias úteis de
 *   8 h por ano, dizendo que a volta foi suposta igual à ida;
 * - calor de superfície e cota de cada prédio; condomínio por m² dos dois (sem vencedor: o valor sozinho não diz o que o condomínio inclui).
 */
export type ExtrasDoPlacar = {
  compra: boolean;
  precos: Par<number | null>;
  rotina: { destino: string; minutosIda: Par<number | null>; dias: number } | null;
  ambiente: Par<{ calorC: number | null; cotaM: number | null }>;
  condominioM2: Par<number | null>;
};
export const ITBI_MINIMO = 0.018;
export const ITBI_MAXIMO = 0.03;
const decimal = (v: number, casas = 1) => v.toFixed(casas).replace(".", ",");

function linhasExtras(r: Par<string>, x: ExtrasDoPlacar): LinhaDoPlacar[] {
  const linhas: LinhaDoPlacar[] = [];
  if (x.compra) {
    const [pa, pb] = x.precos;
    if (pa !== null && pb !== null) {
      const v: 0 | 1 | null = Math.abs(pa - pb) < 1 ? null : pa < pb ? 0 : 1;
      const faixa = (p: number) => `${formatarReais(p * (1 + ITBI_MINIMO))} a ${formatarReais(p * (1 + ITBI_MAXIMO))}`;
      linhas.push({ id: "custo_total", secao: "Custo total da compra", vencedor: v, topico: "custo",
        frase: `${r[0]}: ${faixa(pa)}; ${r[1]}: ${faixa(pb)}. Preço + ITBI de 1,8% a 3% (1,8% se o lançamento for pedido em até 180 dias da assinatura do contrato, 3% depois disso); escritura e registro a confirmar no cartório.` });
    } else linhas.push({ id: "custo_total", secao: "Custo total da compra", vencedor: null, topico: "custo", frase: "Falta o preço de um dos dois para somar ITBI." });
  }
  if (x.rotina) {
    const [ma, mb] = x.rotina.minutosIda;
    if (ma !== null && mb !== null) {
      const horas = (m: number) => (m * 2 * x.rotina!.dias) / 60;
      const d = Math.abs(ma - mb);
      const v: 0 | 1 | null = d < 3 ? null : ma < mb ? 0 : 1;
      const dif = Math.abs(horas(ma) - horas(mb));
      linhas.push({ id: "rotina", secao: "Rotina até o destino", vencedor: v, topico: "rotina",
        frase: `Ida das 7h até ${x.rotina.destino}: ${r[0]} ${ma} min, ${r[1]} ${mb} min. ` +
          (v === null ? "Diferença pequena." : `Com a volta igual à ida e ${x.rotina.dias} dias por mês, ${r[v]} poupa ~${decimal(dif)} h por mês (~${decimal((dif * 12) / 8)} dias úteis de 8 h por ano).`) });
    } else linhas.push({ id: "rotina", secao: "Rotina até o destino", vencedor: null, topico: "rotina", frase: `Sem leitura publicada da ida das 7h até ${x.rotina.destino} para os dois endereços ainda.` });
  }
  const [aa, ab] = x.ambiente;
  if (aa.calorC !== null && ab.calorC !== null) {
    const d = Math.abs(aa.calorC - ab.calorC);
    const v: 0 | 1 | null = d < 0.5 ? null : aa.calorC < ab.calorC ? 0 : 1;
    const cota = (c: number | null) => (c === null ? "cota sem leitura" : `cota ${decimal(c)} m`);
    linhas.push({ id: "ambiente", secao: "Calor e cota", vencedor: v, topico: "entorno",
      frase: `Superfície (satélite): ${r[0]} ${decimal(aa.calorC)} °C, ${cota(aa.cotaM)}; ${r[1]} ${decimal(ab.calorC)} °C, ${cota(ab.cotaM)}.${v === null ? "" : ` ${r[v]} fica ${decimal(d)} °C mais fresco no chão.`}` });
  }
  const [ca, cb] = x.condominioM2;
  if (ca !== null || cb !== null) {
    const t = (v: number | null) => (v === null ? "a confirmar" : `R$ ${decimal(v, 2)}/m²`);
    linhas.push({ id: "condominio", secao: "Condomínio por m²", vencedor: null, topico: "custo",
      frase: `${r[0]}: ${t(ca)}; ${r[1]}: ${t(cb)}. O valor por m² não diz o que o condomínio inclui: pergunte isso e quanto há no fundo de reserva.` });
  }
  return linhas;
}

export function placarDoPar(c: Comparacao, indicadores: Par<readonly Indicador[] | null>, extras?: ExtrasDoPlacar): LinhaDoPlacar[] {
  const r = c.rotulos;
  const linhas: LinhaDoPlacar[] = [];

  // Custo: mensal conhecido (aluguel) ou preço anunciado (compra); menor ganha.
  const [ca, cb] = [c.custo.colunas[0], c.custo.colunas[1]];
  const compra = c.custo.referencia === "preco_anunciado";
  const va = compra ? ca.principal : ca.mensalConhecido, vb = compra ? cb.principal : cb.mensalConhecido;
  if (va !== null && vb !== null) {
    const d = Math.abs(va - vb);
    const v: 0 | 1 | null = d < 1 ? null : va < vb ? 0 : 1;
    linhas.push({ id: "custo", secao: "Custo", vencedor: v, topico: "custo",
      frase: v === null ? (compra ? "Mesmo preço anunciado." : "Mesmo custo mensal conhecido.") : `${nome(r, v)} ${compra ? "custa" : "sai por"} ${formatarReais(d)} a menos${compra ? "" : " por mês"}${(ca.pendentes || cb.pendentes) ? " (há valores a confirmar)" : ""}.` });
  } else linhas.push({ id: "custo", secao: "Custo", vencedor: null, topico: "custo", frase: "Falta preço ou custo de um dos dois." });

  // Espaço: área maior ganha.
  const [aa, ab] = c.espaco.areas;
  if (aa !== null && ab !== null) {
    const d = Math.abs(aa - ab);
    const v: 0 | 1 | null = d < 1 ? null : aa > ab ? 0 : 1;
    linhas.push({ id: "espaco", secao: "Espaço", vencedor: v, topico: "espaco",
      frase: v === null ? "Mesma área." : `${nome(r, v)} tem ${formatarNumero(Math.round(d))} m² a mais.` });
  } else linhas.push({ id: "espaco", secao: "Espaço", vencedor: null, topico: "espaco", frase: "Falta a área de um dos dois." });

  // Dia a dia a pé: soma dos minutos até mercado, farmácia e ônibus; menor ganha.
  const [ma, mb] = [minutosDoDia(indicadores[0]), minutosDoDia(indicadores[1])];
  if (ma !== null && mb !== null) {
    const d = Math.abs(ma - mb);
    const v: 0 | 1 | null = d < 2 ? null : ma < mb ? 0 : 1;
    linhas.push({ id: "a_pe", secao: "Dia a dia a pé", vencedor: v, topico: "rotina",
      frase: v === null ? "Mercado, farmácia e ônibus a distâncias parecidas." : `${nome(r, v)} fica ${formatarNumero(Math.round(d))} min mais perto de mercado, farmácia e ônibus (somados).` });
  }

  // Rua e clima: menos pontos de atenção comparados ao bairro (avenida colada, obras, alagamento, ônibus da noite longe).
  if (indicadores[0] && indicadores[1]) {
    const [xa, xb] = [atencoes(indicadores[0]), atencoes(indicadores[1])];
    const v: 0 | 1 | null = xa.length === xb.length ? null : xa.length < xb.length ? 0 : 1;
    const perdedor = v === null ? null : v === 0 ? xb : xa;
    linhas.push({ id: "rua", secao: "Rua e clima", vencedor: v, topico: "entorno",
      frase: v === null
        ? (xa.length ? `Os dois têm ${xa.length} ${xa.length === 1 ? "ponto" : "pontos"} de atenção.` : "Nenhum ponto de atenção a mais nos dois.")
        : `${nome(r, v)} tem menos pontos de atenção; no outro: ${perdedor!.map((i) => i.rotulo.toLowerCase()).join(", ")}.` });
  }
  if (extras) {
    const extra = linhasExtras(r, extras);
    // O custo total entra logo depois do custo; o resto, no fim.
    const iCusto = linhas.findIndex((l) => l.id === "custo");
    linhas.splice(iCusto + 1, 0, ...extra.filter((l) => l.id === "custo_total"));
    linhas.push(...extra.filter((l) => l.id !== "custo_total"));
  }
  return linhas;
}
