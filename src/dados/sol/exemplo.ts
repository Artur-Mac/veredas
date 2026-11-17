import type { AnaliseV2 } from "../contratos";
import type { Dossie } from "../esquema";
import { cadernoVazio } from "../caderno";
import { migrarAnaliseV1 } from "../migracao";
import type { RegistroSolar } from "./contratos";

/** Adapta o exemplo ao explorador sem criar um imóvel no caderno pessoal ou confirmar cadastro. */
export function analiseSolarDoExemplo(dossie: Dossie, solar?: RegistroSolar): AnaliseV2 {
  const a = migrarAnaliseV1({
    id: `exemplo-${dossie.id}`, nome: `${dossie.endereco.logradouro}, ${dossie.endereco.numero}`,
    bairro: dossie.bairro, tipo: dossie.tipo, url: "", preco: null, condominio: null,
    iptuAnual: null, outros: null, area: null, notas: "", verificadas: [], atualizadoEm: "2026-10-27T12:00:00.000Z",
  }, new Date("2026-10-27T12:00:00.000Z"));
  a.vinculo = { estado: "pulado", em: a.criadaEm };
  a.salva = false;
  if (solar) a.caderno = { ...cadernoVazio(), solar };
  return a;
}
