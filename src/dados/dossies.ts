import boaViagem from "../../docs/mock/dossies/boa-viagem.json";
import casaForte from "../../docs/mock/dossies/casa-forte.json";
import espinheiro from "../../docs/mock/dossies/espinheiro.json";
import gracas from "../../docs/mock/dossies/gracas.json";
import madalena from "../../docs/mock/dossies/madalena.json";
import creditosBrutos from "../../docs/mock/creditos.json";
import { esquemaDoDossie, esquemaDosCreditos, type Creditos, type Dossie } from "./esquema";

const brutos: Record<string, unknown> = {
  "boa-viagem": boaViagem,
  "casa-forte": casaForte,
  gracas,
  espinheiro,
  madalena,
};

function validarDossie(arquivo: string, bruto: unknown): Dossie {
  const resultado = esquemaDoDossie.safeParse(bruto);
  if (!resultado.success) {
    throw new Error(`docs/mock/dossies/${arquivo}.json fora do esquema: ${resultado.error.message}`);
  }
  if (resultado.data.id !== arquivo) {
    throw new Error(`docs/mock/dossies/${arquivo}.json tem id ${resultado.data.id}`);
  }
  return resultado.data;
}

export const IDS_DOSSIES = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"] as const;

export const dossies: ReadonlyMap<string, Dossie> = new Map(
  IDS_DOSSIES.map((id) => [id, validarDossie(id, brutos[id])]),
);

export const creditos: Creditos = (() => {
  const resultado = esquemaDosCreditos.safeParse(creditosBrutos);
  if (!resultado.success) throw new Error(`docs/mock/creditos.json fora do esquema: ${resultado.error.message}`);
  return resultado.data;
})();

export function dossieOuNulo(id: string | undefined): Dossie | null {
  return id ? dossies.get(id) ?? null : null;
}

export function dossieOuErro(id: string): Dossie {
  const dossie = dossies.get(id);
  if (!dossie) throw new Error(`Dossiê não encontrado: ${id}`);
  return dossie;
}
