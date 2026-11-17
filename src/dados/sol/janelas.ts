import type { AnaliseV2 } from "../contratos";
import { cadernoVazio } from "../caderno";
import { esquemaJanelaSolar, esquemaSolar, type JanelaSolar, type RegistroSolar } from "./contratos";

/** Migração sem relógio implícito: não inventa cômodo, data ou qualidade da observação antiga. */
export function registroSolar(a: AnaliseV2): RegistroSolar {
  if (a.caderno?.solar) return a.caderno.solar;
  const graus = a.visita.orientacaoGraus;
  if (graus === null) return { versao: 1, ativaId: null, janelas: [] };
  const pos = a.caderno?.localizacaoDaVisita;
  return { versao: 1, ativaId: "janela-legada", janelas: [{
    id: "janela-legada", nome: "Janela registrada", graus, referencia: "desconhecido", origem: "legado",
    observadoEm: null, revisadoEm: null, calibracao: null,
    coordenada: pos ? { longitude: pos.longitude, latitude: pos.latitude, origem: "gps_da_visita", precisaoM: pos.precisaoM } : null,
    andar: a.declarados.andar.valor, posicao: null, protecoes: [],
  }] };
}
export function migrarJanelasLegadas(a: AnaliseV2): AnaliseV2 {
  if (a.caderno?.solar || a.visita.orientacaoGraus === null) return a;
  return { ...a, caderno: { ...(a.caderno ?? cadernoVazio()), solar: registroSolar(a) } };
}
export function guardarJanela(a: AnaliseV2, janela: JanelaSolar, em: string): AnaliseV2 {
  const validada = esquemaJanelaSolar.parse(janela);
  const anterior = registroSolar(a);
  const janelas = anterior.janelas.some(j => j.id === janela.id)
    ? anterior.janelas.map(j => j.id === janela.id ? validada : j) : [...anterior.janelas, validada];
  const solar = esquemaSolar.parse({ ...anterior, ativaId: janela.id, janelas });
  return { ...a, atualizadaEm: em, caderno: { ...(a.caderno ?? cadernoVazio()), solar } };
}
export function removerJanela(a: AnaliseV2, id: string, em: string): AnaliseV2 {
  const anterior = registroSolar(a);
  const janelas = anterior.janelas.filter(j => j.id !== id);
  const ativaId = anterior.ativaId === id ? janelas[0]?.id ?? null : anterior.ativaId;
  // Mantém o registro solar vazio para não ressuscitar o campo legado ao recarregar.
  return { ...a, atualizadaEm: em, caderno: { ...(a.caderno ?? cadernoVazio()), solar: { ...anterior, ativaId, janelas } } };
}
export function nomeDaDirecao(graus: number): string {
  return ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"][Math.round(((graus % 360) + 360) % 360 / 45) % 8]!;
}
export function origemDaJanela(j: JanelaSolar): string {
  return j.origem === "bussola" ? "Direção medida na visita" : j.origem === "legado" ? "Registro anterior · direção a conferir" : "Direção informada por você";
}
