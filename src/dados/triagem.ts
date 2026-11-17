// Triagem do Explorar (15/11/2026): favoritar (o "salvo" que já existia), anotar (uma linha no diário do caderno) e a
// etapa da busca (a "situação da busca" do caderno, com nomes curtos). Descartar continua na gaveta de descarte.
// Puro: devolve a análise nova; quem chama grava.
import type { Caderno } from "./caderno";
import { cadernoVazio } from "./caderno";
import type { AnaliseV2 } from "./contratos";

export type EtapaDaBusca = Caderno["decisao"];
export const ETAPAS_DA_TRIAGEM: readonly { valor: EtapaDaBusca; rotulo: string }[] = [
  { valor: "considerando", rotulo: "Triagem" },
  { valor: "visita_planejada", rotulo: "Visita" },
  { valor: "visitado", rotulo: "Visitado" },
  { valor: "negociando", rotulo: "Negociando" },
];
/** "Escolhido" fica no caderno; no filtro do Explorar ele aparece junto de "Negociando". */
export function etapaDaAnalise(a: AnaliseV2): EtapaDaBusca {
  return a.caderno?.decisao ?? "considerando";
}
export const rotuloDaEtapa = (e: EtapaDaBusca): string => (e === "escolhido" ? "Escolhido" : ETAPAS_DA_TRIAGEM.find((x) => x.valor === e)?.rotulo ?? "Triagem");

export type FiltroDeEtapa = "todas" | EtapaDaBusca;
export function passaNoFiltro(a: AnaliseV2, filtro: FiltroDeEtapa): boolean {
  if (filtro === "todas") return true;
  const e = etapaDaAnalise(a);
  return filtro === "negociando" ? e === "negociando" || e === "escolhido" : e === filtro;
}

export function comEtapa(a: AnaliseV2, etapa: EtapaDaBusca, agora: string): AnaliseV2 {
  return { ...a, atualizadaEm: agora, caderno: { ...(a.caderno ?? cadernoVazio()), decisao: etapa } };
}

export const LIMITE_DA_NOTA = 2000;
/** Uma nota rápida vira uma linha do diário do caderno (o mesmo diário da tela de detalhes). Texto vazio: null. */
export function comNota(a: AnaliseV2, texto: string, agora: string): AnaliseV2 | null {
  const t = texto.trim().slice(0, LIMITE_DA_NOTA);
  if (!t) return null;
  const c = a.caderno ?? cadernoVazio();
  if (c.diario.length >= 200) return null;
  const entrada = { id: `diario-${Date.parse(agora).toString(36)}`, em: agora, texto: t };
  return { ...a, atualizadaEm: agora, caderno: { ...c, diario: [...c.diario, entrada] } };
}

/** A última nota (para o cartão mostrar o que a pessoa escreveu por último). */
export function ultimaNota(a: AnaliseV2): string | null {
  return a.caderno?.diario.at(-1)?.texto ?? null;
}
