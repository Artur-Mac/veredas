import type { Dossie, Fato, Fonte, Secao } from "./esquema";
import { formatarData } from "./formatos";
import { TEXTO_ILUSTRATIVO } from "./textos";

export type FatoDaRegua = Fato & { regua: Dossie["preco"]["regua"] };

export function tipoDoDossie(dossie: Dossie): "Aluguel" | "Compra" {
  return dossie.tipo === "aluguel" ? "Aluguel" : "Compra";
}

export function enderecoDoDossie(dossie: Dossie): string {
  const { logradouro, numero } = dossie.endereco;
  return numero ? `${logradouro}, ${numero}` : logradouro;
}

export function precoPrincipal(dossie: Dossie): Fato {
  const principal = dossie.anuncio.campos.aluguel ?? dossie.anuncio.campos.preco;
  if (!principal) throw new Error(`Dossiê ${dossie.id} sem aluguel nem preço no anúncio`);
  return principal;
}

export function camposDoAnuncio(dossie: Dossie): Fato[] {
  return Object.values(dossie.anuncio.campos).filter((f): f is Fato => f !== undefined);
}

export function todosOsFatos(dossie: Dossie): Fato[] {
  return [...camposDoAnuncio(dossie), ...dossie.secoes.flatMap((s) => s.fatos)];
}

export function reguaComoFato(dossie: Dossie): FatoDaRegua {
  const regua = dossie.preco.regua;
  return {
    id: "regua",
    rotulo: regua.rotulo,
    valor: regua.valor_anuncio,
    unidade: regua.unidade,
    texto: regua.frase,
    fonte: regua.fonte,
    escala: regua.escala,
    ilustrativo: regua.ilustrativo,
    estado: "padrao",
    motivo_nao_sabemos: null,
    regua,
  };
}

export function acharFato(dossie: Dossie, idFato: string): Fato | FatoDaRegua | null {
  if (idFato === "regua") return reguaComoFato(dossie);
  return todosOsFatos(dossie).find((f) => f.id === idFato) ?? null;
}

export function secaoDoFato(dossie: Dossie, idFato: string): Secao | null {
  return dossie.secoes.find((s) => s.fatos.some((f) => f.id === idFato)) ?? null;
}

export function secao(dossie: Dossie, id: string): Secao | null {
  return dossie.secoes.find((s) => s.id === id) ?? null;
}

export function fato(dossie: Dossie, idSecao: string, idFato: string): Fato | null {
  return secao(dossie, idSecao)?.fatos.find((f) => f.id === idFato) ?? null;
}

export const SECOES_COM_RECORTE_DE_BAIRRO = new Set(["defesa_civil", "bairro", "calor"]);

export function recorteDoFato(dossie: Dossie, idFato: string): string {
  if (idFato === "regua") return dossie.bairro;
  if (idFato.startsWith("anuncio_")) return enderecoDoDossie(dossie);
  const s = secaoDoFato(dossie, idFato);
  if (s && SECOES_COM_RECORTE_DE_BAIRRO.has(s.id)) return dossie.bairro;
  return enderecoDoDossie(dossie);
}

export function agruparPorFonte<T extends Fato>(fatos: T[]): T[][] {
  const grupos = new Map<string, T[]>();
  for (const f of fatos) {
    const chave = `${f.fonte.base}|${f.fonte.orgao}`;
    const grupo = grupos.get(chave);
    if (grupo) grupo.push(f);
    else grupos.set(chave, [f]);
  }
  return [...grupos.values()];
}

export function fontesDoApp(lista: Iterable<Dossie>): Fonte[] {
  const vistas = new Map<string, Fonte>();
  for (const dossie of lista) {
    for (const f of [...todosOsFatos(dossie), reguaComoFato(dossie)]) {
      const fonte = f.fonte;
      if (f.ilustrativo || fonte.base === "anúncio" || fonte.base === TEXTO_ILUSTRATIVO) continue;
      const chave = `${fonte.base}|${fonte.orgao}`;
      if (!vistas.has(chave)) vistas.set(chave, fonte);
    }
  }
  return [...vistas.values()];
}

export function linhaDaFonte(fonte: Fonte, recorte: string | null): string {
  if (fonte.base === TEXTO_ILUSTRATIVO) return `${TEXTO_ILUSTRATIVO}.`;
  if (fonte.base === "anúncio") return `lido em ${formatarData(fonte.consultado_em)}.`;
  const partes = [fonte.base, recorte, fonte.orgao, fonte.via].filter((p): p is string => Boolean(p));
  const consulta = fonte.consultado_em ? `, consultado em ${formatarData(fonte.consultado_em)}` : "";
  return `${partes.join(", ")}${consulta}.`;
}
