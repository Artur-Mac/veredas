// Atrito e conveniência em volta do prédio (15/11/2026): só redige o que scripts/dados/atrito/rodar-atrito.mjs contou no
// CNEFE do Censo 2022 (IBGE). Categoria e contagem, nunca o nome do estabelecimento. É o retrato do levantamento de 2022:
// não diz se o lugar está aberto hoje, horário de funcionamento nem barulho medido. Atrito (bar e venda de bebida,
// oficina, supermercado) fica separado da conveniência do dia a dia (padaria, farmácia, mercadinho, lanchonete).
import { z } from "zod";
import { lerCamada } from "../camadas";
import { formatarNumero } from "../formatos";
import { ARQUIVOS_DO_ATRITO, FONTE_DO_ATRITO, VERSAO_DO_ATRITO } from "./atritoGerado";

export const arquivoDoAtrito = (bairro: string | null | undefined): string | null => (bairro ? ARQUIVOS_DO_ATRITO[bairro] ?? null : null);

/** [contagem a 150 m, metros até o mais perto (até 300 m), rumo do mais perto em graus]. */
const trio = z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative(), z.number().int().min(0).max(359)]);
const esquema = z.strictObject({
  versao: z.string(),
  raioM: z.number(),
  maisPertoAteM: z.number(),
  predios: z.record(z.string(), z.strictObject({ n: trio.optional(), o: trio.optional(), m: trio.optional(), d: trio.optional(), k: trio.optional() })),
});
export type AtritoDoBairro = z.infer<typeof esquema>;
export type AtritoDoPredio = AtritoDoBairro["predios"][string];

const cache = new Map<string, AtritoDoBairro | null>();
export function atritoDoBairro(bairro: string | null | undefined): AtritoDoBairro | null {
  if (!bairro) return null;
  if (!cache.has(bairro)) {
    const c = arquivoDoAtrito(bairro);
    const p = c ? esquema.safeParse(lerCamada(c)) : null;
    cache.set(bairro, p?.success && p.data.versao === VERSAO_DO_ATRITO ? p.data : null);
  }
  return cache.get(bairro) ?? null;
}

export function atritoDoPredio(bairro: string | null | undefined, predioId: string | null | undefined): AtritoDoPredio | null {
  return (predioId ? atritoDoBairro(bairro)?.predios[predioId] : undefined) ?? null;
}

export type CategoriaDeAtrito = "noite" | "oficina" | "mercado" | "dia" | "obra";
export const CHAVE_DA_CATEGORIA: Record<CategoriaDeAtrito, keyof AtritoDoPredio> = { noite: "n", oficina: "o", mercado: "m", dia: "d", obra: "k" };

export type FatoDeAtrito = {
  categoria: CategoriaDeAtrito;
  /** "atrito": pode trazer barulho ou movimento; "conveniencia": serviço do dia a dia; "retrato": obra de 2022. */
  grupo: "atrito" | "conveniencia" | "retrato";
  frase: string;
  detalhe: string;
  contagem150m: number;
  maisPertoM: number;
  rumoGraus: number;
};

const ROTULO: Record<CategoriaDeAtrito, { um: string; varios: string; consequencia: string }> = {
  noite: { um: "bar ou venda de bebida", varios: "bares ou vendas de bebida", consequencia: "vale ouvir a rua numa sexta ou sábado à noite" },
  oficina: { um: "oficina, borracharia ou serralheria", varios: "oficinas, borracharias ou serralherias", consequencia: "barulho de ferramenta em horário comercial e carro na calçada" },
  mercado: { um: "supermercado ou atacado", varios: "supermercados ou atacados", consequencia: "movimento de clientes e caminhão de entrega" },
  dia: { um: "padaria, farmácia, mercadinho ou lanchonete", varios: "padarias, farmácias, mercadinhos ou lanchonetes", consequencia: "compras do dia a dia a pé" },
  obra: { um: "endereço em construção", varios: "endereços em construção", consequencia: "" },
};

const DIRECOES = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"];
/** Rumo em graus → "norte", "nordeste"… */
export const direcaoDoRumo = (graus: number): string => DIRECOES[Math.round((((graus % 360) + 360) % 360) / 45) % 8]!;

export const AVISO_DO_ATRITO = "Censo 2022 (IBGE): retrato do levantamento de 2022. Não diz se o lugar está aberto hoje, o horário nem o barulho.";

/** Fatos em ordem: atrito primeiro (do mais perto ao mais longe), depois conveniência e, por fim, o retrato de obras. */
export function fatosDeAtrito(bairro: string | null | undefined, predioId: string | null | undefined): FatoDeAtrito[] {
  const p = atritoDoPredio(bairro, predioId);
  if (!p) return [];
  const fatos: FatoDeAtrito[] = [];
  for (const categoria of ["noite", "oficina", "mercado", "dia", "obra"] as const) {
    const t = p[CHAVE_DA_CATEGORIA[categoria]];
    if (!t) continue;
    const [n, m, r] = t;
    const rot = ROTULO[categoria];
    const grupo = categoria === "dia" ? "conveniencia" : categoria === "obra" ? "retrato" : "atrito";
    let frase: string;
    if (categoria === "obra") {
      frase = n > 0
        ? `Em 2022, o Censo achou ${n === 1 ? "1 endereço" : `${formatarNumero(n)} endereços`} em construção a até 150 m.`
        : `Em 2022, o endereço em construção mais perto ficava a cerca de ${m} m.`;
    } else if (n > 0) {
      frase = `${n === 1 ? `1 ${rot.um}` : `${formatarNumero(n)} ${rot.varios}`} a até 150 m: ${rot.consequencia}.`;
    } else {
      frase = `${rot.um.charAt(0).toUpperCase()}${rot.um.slice(1)} mais perto: cerca de ${m} m.`;
    }
    const detalhe = `O mais perto fica a cerca de ${m} m, para o ${direcaoDoRumo(r)}, em linha reta. ${AVISO_DO_ATRITO}`;
    fatos.push({ categoria, grupo, frase, detalhe, contagem150m: n, maisPertoM: m, rumoGraus: r });
  }
  const ordem = { atrito: 0, conveniencia: 1, retrato: 2 } as const;
  return fatos.sort((a, b) => ordem[a.grupo] - ordem[b.grupo] || a.maisPertoM - b.maisPertoM);
}

export const fonteDoAtrito = () => FONTE_DO_ATRITO;
