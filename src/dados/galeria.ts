import type { Caderno } from "./caderno";
export function moverFoto(c: Caderno, id: string, destino: "capa" | "antes" | "depois"): Caderno {
  const fotos = [...c.fotos ?? []]; const de = fotos.findIndex(f => f.id === id);
  if (de < 0) return c;
  const para = destino === "capa" ? 0 : de + (destino === "antes" ? -1 : 1);
  if (para < 0 || para >= fotos.length || de === para) return c;
  const [f] = fotos.splice(de, 1); fotos.splice(para, 0, f!);
  return { ...c, fotos };
}
/** Retira só esta referência: o arquivo pode ser usado por outra análise ou cópia. */
export function retirarFoto(c: Caderno, id: string): Caderno { return { ...c, fotos: c.fotos?.filter(f => f.id !== id) }; }
