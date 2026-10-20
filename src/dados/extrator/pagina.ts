import { z } from "zod";
import {
  type LeituraParcial,
  type Portal,
} from "../contratos";
import { extrairDoEstado } from "./estado";
import { extrairDoTexto } from "./texto";

export const esquemaColetaDaPagina = z.strictObject({
  url: z.string().max(2000),
  titulo: z.string().max(300),
  ld: z.array(z.string().max(200 * 1024)).max(10),
  estados: z.array(z.string().max(3 * 1024 * 1024)).max(3),
  texto: z.string().max(200000),
  verificacao: z.boolean(),
});

export type ColetaDaPagina = z.infer<typeof esquemaColetaDaPagina>;

export function lerPagina(
  coleta: ColetaDaPagina,
  portal: Portal,
  idNoPortal: string | null,
): LeituraParcial[] {
  const parseRes = esquemaColetaDaPagina.safeParse(coleta);
  if (!parseRes.success) return [];

  const validada = parseRes.data;
  const leituras: LeituraParcial[] = [];

  // 1. Primeiro estado em que extrairDoEstado achar o anúncio
  for (const estadoStr of validada.estados) {
    try {
      const estadoObj = JSON.parse(estadoStr);
      const res = extrairDoEstado(estadoObj, portal, idNoPortal);
      if (res) {
        leituras.push(res);
        break;
      }
    } catch {
      // Ignora erro de JSON malformado
    }
  }

  // 2. JSON-LD
  for (const ldStr of validada.ld) {
    try {
      const scriptHtml = `<script type="application/ld+json">${ldStr}</script>`;
      const resLd = extrairDoTexto(scriptHtml, portal);
      const apenasLd = resLd.filter((l) => l.metodo === "json_ld");
      leituras.push(...apenasLd);
    } catch {
      // Ignora erro
    }
  }

  // Mapeia todos os campos já preenchidos pelas leituras estruturadas (estado e json_ld)
  const preenchidos = new Set<string>();
  for (const l of leituras) {
    for (const [campo, val] of Object.entries(l.campos)) {
      if (val !== null && val !== undefined && (!Array.isArray(val) || val.length > 0)) {
        preenchidos.add(campo);
      }
    }
  }

  // 3. Leitura de texto com nulo em todo campo que as estruturadas já preencheram
  if (validada.texto.trim()) {
    const leiturasTexto = extrairDoTexto(validada.texto, portal);
    for (const lt of leiturasTexto) {
      if (lt.metodo === "texto") {
        for (const campo of Object.keys(lt.campos) as (keyof typeof lt.campos)[]) {
          if (preenchidos.has(campo)) {
            (lt.campos as any)[campo] = null;
          }
        }
        leituras.push(lt);
      }
    }
  }

  return leituras;
}
