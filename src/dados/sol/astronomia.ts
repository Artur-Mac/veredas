import * as SunCalc from "suncalc";
import type { CoordenadaSolar } from "./contratos";

export const FUSO_SOLAR = "America/Recife";
const rad = (g: number) => g * Math.PI / 180;
export type Sol = { azimute: number; elevacao: number; vetor: readonly [number, number, number] };
/** SunCalc 2.1.1: graus e azimute horário desde o norte, sem conversões da v1. */
export function posicaoDoSol(instante: Date, coordenada: Pick<CoordenadaSolar, "longitude" | "latitude">): Sol {
  if (!Number.isFinite(instante.getTime()) || !Number.isFinite(coordenada.latitude) || !Number.isFinite(coordenada.longitude)
    || Math.abs(coordenada.latitude) > 90 || Math.abs(coordenada.longitude) > 180) throw new Error("Posição ou data inválida");
  const p = SunCalc.getPosition(instante, coordenada.latitude, coordenada.longitude);
  const a = rad(p.azimuth), e = rad(p.altitude);
  return { azimute: p.azimuth, elevacao: p.altitude, vetor: [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)] };
}
export function diaNoRecife(instante: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_SOLAR, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instante);
  const parte = (tipo: string) => partes.find(p => p.type === tipo)!.value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}
/** Recife usa UTC−3 sem horário de verão. Nunca depende do fuso do celular/processo. */
export function instanteNoRecife(dia: string, minutos: number): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !Number.isInteger(minutos) || minutos < 0 || minutos >= 1440) throw new Error("Data ou horário inválido");
  const base = new Date(`${dia}T00:00:00-03:00`);
  if (!Number.isFinite(base.getTime()) || diaNoRecife(base) !== dia) throw new Error("Data inválida");
  return new Date(base.getTime() + minutos * 60000);
}
export function incidenciaNaFace(sol: Sol, graus: number): boolean {
  return sol.elevacao > 0 && Math.cos(rad(sol.elevacao)) * Math.cos(rad(sol.azimute - graus)) > 1e-6;
}
export const horaLegivel = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export function periodoDeSol(dia: string, coordenada: CoordenadaSolar, graus: number): string {
  let manha = 0, tarde = 0;
  for (let m = 0; m < 1440; m += 15) {
    if (incidenciaNaFace(posicaoDoSol(instanteNoRecife(dia, m + 7), coordenada), graus)) {
      if (m < 720) manha++; else tarde++;
    }
  }
  if (!manha && !tarde) return "Sem exposição direta prevista para esta data";
  if (manha > tarde * 2) return "Potencial de sol pela manhã";
  if (tarde > manha * 2) return "Potencial de sol à tarde";
  return "Potencial de sol em parte da manhã e da tarde";
}
