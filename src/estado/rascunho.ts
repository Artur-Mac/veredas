import AsyncStorage from "@react-native-async-storage/async-storage";
import { CAMPOS_EDITAVEIS, formularioVazio, type EstadoDoFormulario } from "../dados/formulario";

export const PREFIXO_RASCUNHO = "vereda-rascunho-v1-";
let fila: Promise<unknown> = Promise.resolve();
function enfileirar<T>(acao: () => Promise<T>): Promise<T> {
  const tarefa = fila.then(acao);
  fila = tarefa.catch(() => undefined);
  return tarefa;
}

export function validarFormularioRascunho(v: unknown): v is EstadoDoFormulario {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const objeto = v as Record<string, unknown>;
  const vazio = formularioVazio();
  const campos = Object.keys(vazio) as (keyof EstadoDoFormulario)[];
  if (Object.keys(objeto).length !== campos.length) return false;
  return campos.every(c => {
    const valor = objeto[c];
    if (c === "editados") return typeof valor === "object" && valor !== null && !Array.isArray(valor) &&
      Object.entries(valor).every(([k, x]) => (CAMPOS_EDITAVEIS as readonly string[]).includes(k) && x === true);
    if (c === "bairro") return valor === null || (typeof valor === "string" && valor.length <= 80);
    if (c === "tipologia") return valor === null || ["apartamento", "casa", "flat", "kitnet", "cobertura", "outro"].includes(String(valor));
    if (c === "modalidade") return valor === "aluguel" || valor === "compra";
    if (c === "iptuPeriodo") return ["mes", "ano", "desconhecido"].includes(String(valor));
    if (c.endsWith("Origem")) return ["link", "texto", "voce"].includes(String(valor));
    if (typeof vazio[c] === "boolean") return typeof valor === "boolean";
    if (typeof vazio[c] === "string") return typeof valor === "string" && valor.length <= 4000;
    return valor === null || (typeof valor === "number" && Number.isFinite(valor));
  });
}

export type RascunhoLocal = { form: EstadoDoFormulario; analiseId: string | null };
export function lerRascunho(id: string): Promise<RascunhoLocal | null> {
  return enfileirar(async () => {
    const texto = await AsyncStorage.getItem(PREFIXO_RASCUNHO + id);
    if (texto === null) return null;
    const v = JSON.parse(texto) as { versao?: unknown; form?: unknown; analiseId?: unknown };
    if (v.versao !== 1 || !validarFormularioRascunho(v.form)) throw new Error("Este rascunho não pôde ser aberto; o original foi preservado.");
    if (v.analiseId !== undefined && (typeof v.analiseId !== "string" || !/^[a-z0-9-]{1,60}$/.test(v.analiseId))) throw new Error("Rascunho incompatível.");
    return { form: v.form, analiseId: typeof v.analiseId === "string" ? v.analiseId : null };
  });
}
export function guardarRascunho(id: string, form: EstadoDoFormulario, analiseId?: string): Promise<void> {
  return enfileirar(async () => {
    if (!validarFormularioRascunho(form)) throw new Error("Rascunho inválido.");
    await AsyncStorage.setItem(PREFIXO_RASCUNHO + id, JSON.stringify({ versao: 1, form, ...(analiseId ? { analiseId } : {}) }));
  });
}
export function apagarRascunho(id: string): Promise<void> {
  return enfileirar(() => AsyncStorage.removeItem(PREFIXO_RASCUNHO + id));
}
