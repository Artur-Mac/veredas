// IPTU do anúncio contra o cadastro do prédio (15/11/2026). O ZAP mostra só "IPTU", sem dizer se é por mês ou por ano.
// Ao confirmar o prédio, o cadastro da Prefeitura (IPTU 2026 da tipologia mais parecida com a área do anúncio) decide
// o período quando o anúncio não diz; quando diz, só aponta a divergência. Puro.
import type { AnaliseV2, Edificio } from "./contratos";

export type ReferenciaDoIptu = { mensal: number; area: number; unidades: number };

/** IPTU mensal mediano do cadastro na tipologia de área mais próxima (até 15% de diferença), ou null. */
export function referenciaDoCadastro(edificio: Pick<Edificio, "tipologias">, area: number | null): ReferenciaDoIptu | null {
  const comIptu = edificio.tipologias.filter((t) => t.iptuAnualMediano !== null && t.iptuAnualMediano !== undefined && t.iptuAnualMediano > 0);
  if (!comIptu.length) return null;
  const alvo = area ?? null;
  const t = alvo === null
    ? (comIptu.length === 1 ? comIptu[0]! : null)
    : [...comIptu].sort((a, b) => Math.abs(a.area - alvo) - Math.abs(b.area - alvo))[0]!;
  if (!t || (alvo !== null && Math.abs(t.area - alvo) > alvo * 0.15)) return null;
  return { mensal: (t.iptuAnualMediano as number) / 12, area: t.area, unidades: t.unidades };
}

export type LeituraDoIptu = {
  periodo: "mes" | "ano" | "desconhecido";
  /** Quem decidiu o período: o anúncio (disse), o cadastro (inferido) ou ninguém. */
  decididoPor: "anuncio" | "cadastro" | "ninguem";
  /** O valor mensal do anúncio fica a mais de 2× (para cima ou para baixo) do cadastro. */
  divergente: boolean;
};

const FAIXA = 2;
const dentro = (v: number, ref: number) => v >= ref / FAIXA && v <= ref * FAIXA;

/**
 * Período do IPTU do anúncio. Com período dito, mantém e só marca divergência. Sem período, escolhe "mes" ou "ano"
 * quando exatamente uma das leituras cai a até 2× do cadastro; senão continua desconhecido.
 */
export function lerIptuDoAnuncio(valor: number | null, periodo: "mes" | "ano" | "desconhecido", ref: ReferenciaDoIptu | null): LeituraDoIptu {
  if (valor === null || valor <= 0 || !ref) return { periodo, decididoPor: periodo === "desconhecido" ? "ninguem" : "anuncio", divergente: false };
  if (periodo !== "desconhecido") {
    const mensal = periodo === "mes" ? valor : valor / 12;
    return { periodo, decididoPor: "anuncio", divergente: !dentro(mensal, ref.mensal) };
  }
  const mes = dentro(valor, ref.mensal), ano = dentro(valor / 12, ref.mensal);
  if (mes && !ano) return { periodo: "mes", decididoPor: "cadastro", divergente: false };
  if (ano && !mes) return { periodo: "ano", decididoPor: "cadastro", divergente: false };
  return { periodo: "desconhecido", decididoPor: "ninguem", divergente: !mes && !ano };
}

/**
 * Aplica a leitura à análise na confirmação do prédio. Só mexe no IPTU que veio do anúncio (link ou texto) com período
 * desconhecido; o que a pessoa digitou nunca muda. Devolve a mesma análise quando nada muda.
 */
export function resolverIptuNaConfirmacao(analise: AnaliseV2, edificio: Pick<Edificio, "tipologias">): AnaliseV2 {
  const d = analise.declarados.iptu;
  if (d.origem === "voce" || d.periodo !== "desconhecido" || d.valor === null) return analise;
  const l = lerIptuDoAnuncio(d.valor, d.periodo, referenciaDoCadastro(edificio, analise.declarados.area.valor));
  if (l.decididoPor !== "cadastro") return analise;
  return { ...analise, declarados: { ...analise.declarados, iptu: { ...d, periodo: l.periodo, aConfirmar: false } } };
}
