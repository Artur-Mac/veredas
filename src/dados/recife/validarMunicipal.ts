import { z } from "zod";
import { esquemaContextoDoBairro, esquemaEdificio, esquemaIndiceDoBairro } from "../contratos";
import { BAIRROS_DO_RECIFE } from "./bairros";

const bairroMunicipal = z.enum(BAIRROS_DO_RECIFE.map(b => b.slug));
const esquemaMunicipal = esquemaIndiceDoBairro.extend({ bairro: bairroMunicipal,
  contexto: esquemaContextoDoBairro.extend({ bairro: bairroMunicipal }),
  edificios: z.array(esquemaEdificio.extend({ bairro: bairroMunicipal })),
});

/** Valida staging sem habilitar bairros ou relaxar o contrato dos arquivos publicados no app. */
export function validarIndiceMunicipal(slug: string, bruto: unknown) {
  bairroMunicipal.parse(slug);
  const indice = esquemaMunicipal.parse(bruto);
  if (indice.bairro !== slug || indice.contexto.bairro !== slug) throw new Error("Partição de outro bairro.");
  if (!Number.isFinite(Date.parse(indice.geradoEm))) throw new Error("Data de geração inválida.");
  const ids = new Set<string>();
  for (const e of indice.edificios) {
    if (e.bairro !== slug || ids.has(e.id)) throw new Error("Edifício duplicado ou de outro bairro na partição.");
    ids.add(e.id);
    if (e.tipologias.reduce((s, t) => s + t.unidades, 0) > e.unidades) throw new Error("Tipologias excedem unidades.");
    for (const [i] of e.obras150m.recentes) if (!indice.obras[i]) throw new Error("Referência de obra ausente.");
    const setor = e.rua?.[0];
    if (setor !== undefined && setor !== null && !indice.rua?.setores[setor]) throw new Error("Referência censitária ausente.");
  }
  if (indice.contexto.edificios !== indice.edificios.length || indice.contexto.unidades !== indice.edificios.reduce((s, e) => s + e.unidades, 0))
    throw new Error("Totais da partição inconsistentes.");
  return indice;
}

/** Controle geométrico; não é probabilidade de identificação correta do prédio. */
export function qualidadeGeometrica(indice: ReturnType<typeof validarIndiceMunicipal>) {
  const dentro = ([x, y]: number[], anel: number[][]) => {
    let resultado = false;
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      const a = anel[i]!; const b = anel[j]!;
      if ((a[1]! > y!) !== (b[1]! > y!) && x! < (b[0]! - a[0]!) * (y! - a[1]!) / (b[1]! - a[1]!) + a[0]!) resultado = !resultado;
    }
    return resultado;
  };
  const comPoligono = indice.edificios.filter(e => e.poligono !== null);
  const centrosInternos = comPoligono.filter(e => dentro(e.centro, e.poligono!)).length;
  return { comPoligono: comPoligono.length, centrosInternos,
    fracaoInterna: comPoligono.length ? centrosInternos / comPoligono.length : null };
}
