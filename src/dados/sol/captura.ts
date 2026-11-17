import type { CoordenadaSolar } from "./contratos";
export type AmostraDeRumo = { graus: number; calibracao: number; em: number };
export type EstadoDaBussola =
  | { estado: "preparando" }
  | { estado: "indisponivel"; mensagem: string }
  | { estado: "leitura"; graus: number; calibracao: number; estavel: boolean; coordenada: CoordenadaSolar | null };
export type FonteDeRumo = {
  preparar: () => Promise<CoordenadaSolar | null>;
  observar: (receber: (graus: number, calibracao: number) => void, falhar: (mensagem: string) => void) => Promise<() => void>;
};
export function mediaCircular(graus: readonly number[]): number {
  const x = graus.reduce((s, g) => s + Math.sin(g * Math.PI / 180), 0);
  const y = graus.reduce((s, g) => s + Math.cos(g * Math.PI / 180), 0);
  return (Math.atan2(x, y) * 180 / Math.PI + 360) % 360;
}
/** O cancelamento vale mesmo enquanto a permissão/assinatura ainda é uma promessa. */
export function iniciarCaptura(fonte: FonteDeRumo, receber: (e: EstadoDaBussola) => void, agora: () => number = Date.now): () => void {
  let cancelada = false, remover: (() => void) | null = null;
  const amostras: AmostraDeRumo[] = [];
  receber({ estado: "preparando" });
  const parar = () => { cancelada = true; clearTimeout(limite); remover?.(); remover = null; };
  const falhar = (mensagem: string) => { if (!cancelada) { receber({ estado: "indisponivel", mensagem }); parar(); } };
  const limite = setTimeout(() => falhar("Não conseguimos uma leitura confiável. Você pode indicar a direção."), 12000);
  void Promise.resolve().then(() => fonte.preparar()).then(async coordenada => {
    if (cancelada) return;
    const desligar = await fonte.observar((graus, calibracao) => {
      if (cancelada) return;
      if (!Number.isFinite(graus) || graus < 0 || graus >= 360 || !Number.isInteger(calibracao) || calibracao < 0 || calibracao > 3) {
        falhar("O norte verdadeiro não está disponível. Indique a direção pelo desenho."); return;
      }
      const em = agora();
      amostras.push({ graus, calibracao, em });
      while (amostras.length > 20 || (amostras.length > 1 && em - amostras[0]!.em > 2200)) amostras.shift();
      const media = mediaCircular(amostras.map(a => a.graus));
      const dispersao = Math.max(...amostras.map(a => Math.abs(((a.graus - media + 540) % 360) - 180)));
      const estavel = amostras.length >= 5 && em - amostras[0]!.em >= 1500 && dispersao <= 8 && amostras.every(a => a.calibracao >= 2);
      if (estavel) clearTimeout(limite);
      receber({ estado: "leitura", graus: Math.round(media) % 360, calibracao, estavel, coordenada });
    }, falhar);
    if (cancelada) desligar(); else remover = desligar;
  }).catch(() => falhar("Não foi possível usar a bússola. Você pode indicar a direção."));
  return parar;
}
