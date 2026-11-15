import { incidenciaNaFace, instanteNoRecife, posicaoDoSol, type Sol } from "./astronomia";
import type { JanelaSolar } from "./contratos";

export type Ponto = readonly [number, number];
export type VolumeSolar = {
  id: string; dsqfl: string; aneis: Ponto[][]; alturaM: number | null; baseM: number;
  /** Intervalo de cenário, não intervalo estatístico de confiança. */
  alturaMinM: number | null; alturaMaxM: number | null;
  origemAltura: "pavimentos_cadastrais" | "desconhecida";
};
export type RecorteSolar = {
  versao: string; centro: Ponto; raioM: number; fonteEm: string;
  cobertura: "cadastral_parcial"; volumes: VolumeSolar[];
};
export type EstadoSolar = "sol_potencial" | "bloqueado_no_modelo" | "sol_atras_da_face" | "noite" | "indeterminado";
export type LeituraSolar = { estado: EstadoSolar; obstaculoId: string | null; motivo: string; sol: Sol };
export function emMetros(p: Ponto, centro: Ponto): [number, number] {
  return [(p[0] - centro[0]) * 111195.08 * Math.cos(centro[1] * Math.PI / 180), (p[1] - centro[1]) * 111195.08];
}
export function emCoordenadas(p: Ponto, centro: Ponto): [number, number] {
  return [centro[0] + p[0] / (111195.08 * Math.cos(centro[1] * Math.PI / 180)), centro[1] + p[1] / 111195.08];
}
export function dentroDoAnel(p: Ponto, anel: readonly Ponto[]): boolean {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const a = anel[i]!, b = anel[j]!;
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) dentro = !dentro;
  }
  return dentro;
}
const dentroDoVolume = (p: Ponto, aneis: readonly (readonly Ponto[])[]) => !!aneis[0] && dentroDoAnel(p, aneis[0]) && !aneis.slice(1).some(a => dentroDoAnel(p, a));
const cruz = (a: Ponto, b: Ponto) => a[0] * b[1] - a[1] * b[0];
/** Intervalos em que um raio horizontal atravessa o sólido; respeita furos e origem dentro dele. */
export function intervalosDoRaio(origem: Ponto, direcao: Ponto, aneis: readonly (readonly Ponto[])[]): [number, number][] {
  const cortes = [0];
  for (const anel of aneis) for (let i = 0; i < anel.length; i++) {
    const a = anel[i]!, b = anel[(i + 1) % anel.length]!;
    const v: Ponto = [b[0] - a[0], b[1] - a[1]], w: Ponto = [a[0] - origem[0], a[1] - origem[1]];
    const den = cruz(direcao, v);
    if (Math.abs(den) < 1e-10) continue;
    const t = cruz(w, v) / den, u = cruz(w, direcao) / den;
    if (t >= 0 && u >= -1e-8 && u <= 1 + 1e-8) cortes.push(t);
  }
  const ordenados = [...new Set(cortes.map(n => Math.round(n * 1e7) / 1e7))].sort((a, b) => a - b);
  const intervalos: [number, number][] = [];
  for (let i = 0; i < ordenados.length - 1; i++) {
    const a = ordenados[i]!, b = ordenados[i + 1]!;
    const m = (a + b) / 2;
    if (b - a > 1e-7 && dentroDoVolume([origem[0] + m * direcao[0], origem[1] + m * direcao[1]], aneis)) intervalos.push([a, b]);
  }
  return intervalos;
}
export function alturasDaJanela(andar: number): [number, number] {
  // Sensibilidade explícita: 2,8–3,4 m/pavimento e centro da abertura a 1,2–1,8 m.
  return [Math.max(0.2, andar * 2.8 + 1.2), Math.max(0.8, andar * 3.4 + 1.8)];
}
function lerExposicaoCentral(janela: JanelaSolar, dia: string, minutos: number, recorte: RecorteSolar | null = null, desconsiderarId?: string): LeituraSolar {
  const coordenada = janela.coordenada;
  if (!coordenada) throw new Error("Informe a localização do imóvel para simular o Sol");
  const sol = posicaoDoSol(instanteNoRecife(dia, minutos), coordenada);
  const ler = (estado: EstadoSolar, motivo: string, obstaculoId: string | null = null): LeituraSolar => ({ estado, motivo, obstaculoId, sol });
  if (sol.elevacao <= 0) return ler("noite", "O Sol está abaixo do horizonte");
  if (janela.graus === null || janela.referencia !== "verdadeiro") return ler("indeterminado", "Confira a direção desta janela");
  if (!incidenciaNaFace(sol, janela.graus)) return ler("sol_atras_da_face", "O Sol está do outro lado desta fachada");
  if (!recorte || !janela.posicao || janela.andar === null) return ler("sol_potencial", "O Sol está à frente desta janela; obstáculos não calculados");
  if (recorte.versao !== janela.posicao.geometriaVersao || !recorte.volumes.some(v => v.id === janela.posicao!.volumeId))
    return ler("indeterminado", "A posição da janela precisa ser conferida nesta base");
  const distanciaCentro = Math.hypot(...emMetros([janela.posicao.longitude, janela.posicao.latitude], recorte.centro));
  if (distanciaCentro > recorte.raioM - 5) return ler("indeterminado", "A janela está fora do recorte disponível");
  const [zmin, zmax] = alturasDaJanela(janela.andar);
  const g = janela.graus * Math.PI / 180;
  // Avança 5 cm para fora da face, não remove o próprio prédio do conjunto de obstáculos.
  const ponto: Ponto = [janela.posicao.longitude, janela.posicao.latitude];
  const origem: Ponto = [0.05 * Math.sin(g), 0.05 * Math.cos(g)];
  const a = sol.azimute * Math.PI / 180;
  const direcao: Ponto = [Math.sin(a), Math.cos(a)];
  const inclinacao = Math.tan(sol.elevacao * Math.PI / 180);
  let incerto: string | null = null;
  for (const volume of recorte.volumes) {
    if (volume.id === desconsiderarId) continue;
    const aneis = volume.aneis.map(anel => anel.map(p => emMetros(p, ponto)));
    for (const [entrada, saida] of intervalosDoRaio(origem, direcao, aneis)) {
      if (volume.alturaMinM === null || volume.alturaMaxM === null) { incerto = volume.id; continue; }
      const maisAltoNaEntrada = zmax + entrada * inclinacao;
      const maisBaixoNaEntrada = zmin + entrada * inclinacao;
      const maisBaixoNaSaida = zmin + saida * inclinacao;
      if (volume.baseM + volume.alturaMinM > maisAltoNaEntrada && volume.baseM <= maisBaixoNaSaida)
        return ler("bloqueado_no_modelo", "Um volume cadastrado intercepta o Sol neste cenário", volume.id);
      if (volume.baseM + volume.alturaMaxM > maisBaixoNaEntrada && volume.baseM <= zmax + saida * inclinacao) incerto = volume.id;
    }
  }
  if (incerto) return ler("indeterminado", "A altura estimada muda o resultado neste horário", incerto);
  const maxAltura = Math.max(0, ...recorte.volumes.map(v => v.baseM + (v.alturaMaxM ?? 200)));
  if (sol.elevacao < 3 || (maxAltura - zmin) / inclinacao > recorte.raioM - distanciaCentro)
    return ler("indeterminado", "O Sol baixo pode encontrar obstáculos além deste recorte");
  return ler("sol_potencial", "Sem bloqueio nos volumes avaliados; a cobertura cadastral é parcial");
}
export function lerExposicao(janela: JanelaSolar, dia: string, minutos: number, recorte: RecorteSolar | null = null, desconsiderarId?: string): LeituraSolar {
  const central = lerExposicaoCentral(janela, dia, minutos, recorte, desconsiderarId);
  if (janela.graus === null || janela.referencia !== "verdadeiro" || central.estado === "noite" || central.estado === "indeterminado") return central;
  // Sensibilidade de engenharia, não precisão anunciada do sensor ou intervalo estatístico.
  const amplitude = janela.origem === "bussola" ? (janela.calibracao === 2 ? 35 : 20) : 5;
  for (const delta of [-amplitude, amplitude]) {
    const teste = lerExposicaoCentral({ ...janela, graus: (janela.graus + delta + 360) % 360 }, dia, minutos, recorte, desconsiderarId);
    if (teste.estado !== central.estado) return { ...central, estado: "indeterminado", obstaculoId: central.obstaculoId ?? teste.obstaculoId,
      motivo: "Uma pequena mudança de direção altera o resultado neste horário" };
  }
  if (recorte && janela.posicao && janela.andar !== null) {
    const g = janela.graus * Math.PI / 180;
    for (const delta of [-2, 2]) {
      const p = emCoordenadas([delta * Math.cos(g), -delta * Math.sin(g)], [janela.posicao.longitude, janela.posicao.latitude]);
      const teste = lerExposicaoCentral({ ...janela, posicao: { ...janela.posicao, longitude: p[0], latitude: p[1] } }, dia, minutos, recorte, desconsiderarId);
      if (teste.estado !== central.estado) return { ...central, estado: "indeterminado", obstaculoId: central.obstaculoId ?? teste.obstaculoId,
        motivo: "A posição aproximada da janela muda o resultado neste horário" };
    }
  }
  return central;
}
export function trajetoria(janela: JanelaSolar, dia: string, recorte: RecorteSolar | null = null, desconsiderarId?: string, passo = 5) {
  if (!Number.isInteger(passo) || passo < 1 || 1440 % passo !== 0) throw new Error("Passo inválido");
  return Array.from({ length: 1440 / passo }, (_, i) => ({ minuto: i * passo, duracao: passo,
    leitura: lerExposicao(janela, dia, i * passo + Math.floor(passo / 2), recorte, desconsiderarId) }));
}
export function duracaoPotencial(serie: ReturnType<typeof trajetoria>): { minimo: number; maximo: number } {
  // Sem duplicar endpoints. A faixa inclui horários indeterminados; não representa ganho térmico.
  return serie.reduce((r, p) => ({ minimo: r.minimo + (p.leitura.estado === "sol_potencial" ? p.duracao : 0),
    maximo: r.maximo + (["sol_potencial", "indeterminado"].includes(p.leitura.estado) ? p.duracao : 0) }), { minimo: 0, maximo: 0 });
}
