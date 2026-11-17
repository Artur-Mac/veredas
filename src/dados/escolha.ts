// Escolha quando a lista não tem vencedor óbvio (VE11): troca custo × tempo com o limiar que inverte a preferência,
// opções não dominadas entre vários critérios e ruas onde mais procurar. Determinístico e explicável: nenhum perfil
// psicológico, nenhum valor atribuído ao tempo da pessoa (só o preço implícito da hora poupada), nenhuma inferência de
// quem mora na casa.
import { formatarReais } from "./formatos";

type Par<T> = [T, T];
const horas = (min: number) => { const h = Math.floor(min / 60), m = Math.round(min - h * 60); return m === 0 ? `${h} h` : h === 0 ? `${m} min` : `${h}h${String(m).padStart(2, "0")}`; };

export type Troca =
  | { tipo: "sem_dados"; frase: string }
  | { tipo: "parecidos"; frase: string }
  | { tipo: "dominante"; vencedor: 0 | 1; frase: string }
  | { tipo: "troca"; maisCaro: 0 | 1; reaisPorHora: number; frase: string; limiar: string };

/**
 * Custo mensal conhecido × minutos por mês no trajeto (ida + volta × dias). `pendentes`: parcelas do custo ainda a
 * confirmar em cada lado (o limiar pode mudar quando chegarem). Monótono: subir o custo de um lado nunca o favorece.
 */
export function trocaCustoTempo(rotulos: Par<string>, custo: Par<number | null>, pendentes: Par<number>, minutosPorDia: Par<number | null>, dias: number): Troca {
  if (custo.some((c) => c === null) || minutosPorDia.some((m) => m === null) || !(dias > 0))
    return { tipo: "sem_dados", frase: "Falta custo ou tempo de um dos lados para comparar custo e tempo." };
  const [c0, c1] = custo as Par<number>, [m0, m1] = minutosPorDia as Par<number>;
  const dc = c1 - c0, dmMes = (m1 - m0) * dias;
  const aviso = pendentes[0] + pendentes[1] > 0 ? " O custo ainda tem valores a confirmar, e o limiar muda quando eles chegarem." : "";
  const pequenoCusto = Math.abs(dc) < 20, pequenoTempo = Math.abs(dmMes) < 60;
  if (pequenoCusto && pequenoTempo) return { tipo: "parecidos", frase: `No custo conhecido e no tempo de trajeto (${dias} dias por mês), os dois ficam parecidos.${aviso}` };
  // Um lado é mais barato (ou igual) e mais rápido (ou igual): não há troca a fazer.
  if ((dc >= 0 || pequenoCusto) && (dmMes >= 0 || pequenoTempo)) return { tipo: "dominante", vencedor: 0, frase: `${rotulos[0]} custa ${pequenoCusto ? "o mesmo" : `${formatarReais(Math.abs(dc))} a menos por mês`} e ${pequenoTempo ? "leva o mesmo tempo" : `poupa ${horas(Math.abs(dmMes))} por mês no trajeto`}: não há troca a fazer entre custo e tempo.${aviso}` };
  if ((dc <= 0 || pequenoCusto) && (dmMes <= 0 || pequenoTempo)) return { tipo: "dominante", vencedor: 1, frase: `${rotulos[1]} custa ${pequenoCusto ? "o mesmo" : `${formatarReais(Math.abs(dc))} a menos por mês`} e ${pequenoTempo ? "leva o mesmo tempo" : `poupa ${horas(Math.abs(dmMes))} por mês no trajeto`}: não há troca a fazer entre custo e tempo.${aviso}` };
  // Troca: o mais caro é o mais rápido.
  const maisCaro: 0 | 1 = dc > 0 ? 1 : 0;
  const reaisPorHora = Math.abs(dc) / (Math.abs(dmMes) / 60);
  // Abaixo de R$ 10, centavos importam (formatarReais arredonda para reais).
  const valor = reaisPorHora >= 10 ? formatarReais(Math.round(reaisPorHora)) : `R$ ${reaisPorHora.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return {
    tipo: "troca", maisCaro, reaisPorHora,
    frase: `${rotulos[maisCaro]} custa ${formatarReais(Math.abs(dc))} a mais por mês e poupa ${horas(Math.abs(dmMes))} por mês no trajeto (${dias} dias): cerca de ${valor} por hora poupada.${aviso}`,
    limiar: `Se uma hora sua vale mais que ${valor}, ${rotulos[maisCaro]} compensa; se vale menos, ${rotulos[1 - maisCaro]}. A escolha é sua; o VEREDA não dá valor ao seu tempo.`,
  };
}

/** Dias por mês a partir dos quais o tempo poupado passa a valer `reaisPorHora` (para quem já tem um preço da hora). */
export function diasParaCompensar(reaisPorMesAMais: number, minutosPoupadosPorDia: number, reaisPorHora: number): number | null {
  if (!(reaisPorMesAMais > 0) || !(minutosPoupadosPorDia > 0) || !(reaisPorHora > 0)) return null;
  return Math.ceil(reaisPorMesAMais / ((minutosPoupadosPorDia / 60) * reaisPorHora));
}

// ——— Não dominadas ——————————————————————————————————————————————————————————————————————————

export type Criterio = { nome: string; valores: (number | null)[]; menorMelhor: boolean; tolerancia: number };
/**
 * Opções não dominadas: A domina B se é pelo menos tão boa em todo critério conhecido nos dois (com tolerância) e
 * estritamente melhor em algum. Critério sem valor num dos lados não decide nada. Devolve, por critério, quem ganha.
 */
export function naoDominadas(rotulos: string[], criterios: Criterio[]): { naoDominadas: number[]; ganhos: { criterio: string; vencedores: number[] }[] } {
  const n = rotulos.length;
  const melhorOuIgual = (c: Criterio, i: number, j: number) => {
    const a = c.valores[i], b = c.valores[j];
    if (a === null || b === null || a === undefined || b === undefined) return null;
    const d = c.menorMelhor ? b - a : a - b;
    return d >= -c.tolerancia ? (d > c.tolerancia ? "melhor" : "igual") : "pior";
  };
  const domina = (i: number, j: number) => {
    let estrito = false, algum = false;
    for (const c of criterios) {
      const r = melhorOuIgual(c, i, j);
      if (r === null) continue;
      algum = true;
      if (r === "pior") return false;
      if (r === "melhor") estrito = true;
    }
    return algum && estrito;
  };
  const nd = [...Array(n).keys()].filter((i) => ![...Array(n).keys()].some((j) => j !== i && domina(j, i)));
  const ganhos = criterios.map((c) => {
    const conhecidos = c.valores.map((v, i) => [v, i] as const).filter(([v]) => v !== null && v !== undefined) as [number, number][];
    if (conhecidos.length < 2) return { criterio: c.nome, vencedores: [] };
    const melhor = c.menorMelhor ? Math.min(...conhecidos.map(([v]) => v)) : Math.max(...conhecidos.map(([v]) => v));
    const venc = conhecidos.filter(([v]) => Math.abs(v - melhor) <= c.tolerancia).map(([, i]) => i);
    return { criterio: c.nome, vencedores: venc.length === conhecidos.length ? [] : venc };
  });
  return { naoDominadas: nd, ganhos };
}

export function fraseDaDominancia(rotulos: string[], r: ReturnType<typeof naoDominadas>): string {
  const decididos = r.ganhos.filter((g) => g.vencedores.length);
  if (!decididos.length) return "Nos critérios com dado dos dois lados, as opções empatam.";
  if (r.naoDominadas.length === 1) return `${rotulos[r.naoDominadas[0]!]} é melhor ou igual em tudo que dá para comparar: não há troca a fazer.`;
  // Agrupa por quem ganha: "Casa Forte no custo mensal conhecido; Graças na ida até X e na ida até Y".
  const porVencedor = new Map<string, string[]>();
  for (const g of decididos) { const k = g.vencedores.map((i) => rotulos[i]).join(" e "); porVencedor.set(k, [...(porVencedor.get(k) ?? []), g.criterio]); }
  const em = (c: string) => (/^(ida|volta)\b/.test(c) ? `na ${c}` : `no ${c}`);
  const lista = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}`);
  const partes = [...porVencedor].map(([quem, cs]) => `${quem} ${lista(cs.map(em))}`);
  return `Nenhuma opção ganha em tudo: ${partes.join("; ")}. A escolha depende do que pesa mais para vocês.`;
}

// ——— Onde mais procurar ——————————————————————————————————————————————————————————————————————

export type RuaDaProcura = { c: string; n: string; b: string; p: number; m10: number; t: (number | null)[] };
/**
 * Ruas do piloto em que a ida das 7h até o bairro de destino leva no máximo `ateMin`, fora as ruas dos imóveis já
 * comparados. Só dimensões cobertas (tempo programado e mercado a pé); preço e anúncios não entram.
 */
export function ondeMaisProcurar(ruas: RuaDaProcura[], bairros: string[], destino: string, ateMin: number, excluir: string[], { exigirMercado = false, limite = 6 } = {}) {
  const j = bairros.indexOf(destino);
  if (j < 0) return { estado: "sem_destino" as const, ruas: [] };
  const lista = ruas.filter((r) => !excluir.includes(r.c) && r.t[j] !== null && r.t[j]! <= ateMin && (!exigirMercado || r.m10 >= 0.5))
    .sort((x, y) => x.t[j]! - y.t[j]! || y.m10 - x.m10 || x.c.localeCompare(y.c));
  return { estado: lista.length ? ("ok" as const) : ("nenhuma" as const), total: lista.length, ruas: lista.slice(0, limite).map((r) => ({ ...r, minutos: r.t[j]! })) };
}
