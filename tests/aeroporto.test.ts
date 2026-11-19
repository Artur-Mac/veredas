import { describe, expect, it } from "@jest/globals";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import {
  ALCANCE_DA_TRAJETORIA_M,
  RAIO_DO_AEROPORTO_M,
  baseDoAeroporto,
  fraseDoAeroporto,
  relacaoComOAeroporto,
} from "../src/dados/recife/aeroporto";

// "Ruído do aeroporto" (hub, 18/11/2026): pista do OpenStreetMap, distância e trajetória, sem decibéis.
const base = baseDoAeroporto();
const { cabeceiraNorte: n18, cabeceiraSul: s36 } = base.pista;

/** Ponto a `metros` além de uma cabeceira, no prolongamento do eixo, deslocado `lado` metros para o lado. */
function alem(cabeceira: "18" | "36", metros: number, lado = 0): [number, number] {
  const [de, para] = cabeceira === "18" ? [s36.lonLat, n18.lonLat] : [n18.lonLat, s36.lonLat];
  const kx = 111320 * Math.cos((para[1] * Math.PI) / 180);
  const ky = 110574;
  const dx = (para[0] - de[0]) * kx;
  const dy = (para[1] - de[1]) * ky;
  const L = Math.hypot(dx, dy);
  const [ux, uy] = [dx / L, dy / L];
  return [para[0] + (ux * metros + uy * lado) / kx, para[1] + (uy * metros - ux * lado) / ky];
}

describe("aeroporto.json", () => {
  it("pista 18/36 do Guararapes, cabeceira 18 ao norte, ~3 km, rumo coerente com a pista magnética", () => {
    expect(base.pista.ref).toBe("18/36");
    expect(n18.lonLat[1]).toBeGreaterThan(s36.lonLat[1]);
    expect(base.pista.comprimentoM).toBeGreaterThan(2800);
    expect(base.pista.comprimentoM).toBeLessThan(3200);
    // Dentro do Recife/Jaboatão, não 80 km ao sul como o cone descartado de 11/11/2026.
    for (const p of [n18.lonLat, s36.lonLat]) {
      expect(p[1]).toBeGreaterThan(-8.2);
      expect(p[1]).toBeLessThan(-8.05);
    }
  });
});

describe("relacaoComOAeroporto", () => {
  it("no prolongamento ao norte: trajetória da cabeceira 18, altura pela rampa de 3°", () => {
    const r = relacaoComOAeroporto(alem("18", 2000))!;
    expect(r.trajetoria?.cabeceira).toBe("18");
    expect(r.trajetoria?.distanciaDaCabeceiraM).toBeGreaterThan(1990);
    expect(r.trajetoria?.distanciaDaCabeceiraM).toBeLessThan(2010);
    expect(r.trajetoria?.alturaEstimadaM).toBe(Math.round((r.trajetoria!.distanciaDaCabeceiraM * Math.tan((3 * Math.PI) / 180)) / 10) * 10);
  });

  it("a faixa abre 15% para cada lado: dentro a 400 m de lado a 5 km, fora a 1.200 m", () => {
    expect(relacaoComOAeroporto(alem("18", 5000, 400))?.trajetoria).not.toBeNull();
    // Fora da faixa e a mais de 3 km da pista: não passa por cima, mas desde 19/11/2026 (pendência 2 do HANDOFF) o
    // avião ao lado da rota entra na estimativa de ruído, e o aeroporto aparece com nome.
    const fora = relacaoComOAeroporto(alem("18", 5000, 1200))!;
    expect(fora.trajetoria).toBeNull();
    expect(fora.aviao?.posicao).toBe("ao_lado_da_rota");
    expect(fraseDoAeroporto(fora).frase).toContain("Os aviões passam ao lado, não por cima");
    // Longe o bastante para o avião ficar abaixo de 35 dB(A): fora.
    expect(relacaoComOAeroporto(alem("18", 5000, 5000))).toBeNull();
  });

  it("além do alcance de 10 km não conta como trajetória", () => {
    expect(relacaoComOAeroporto(alem("18", ALCANCE_DA_TRAJETORIA_M + 500))).toBeNull();
    expect(relacaoComOAeroporto(alem("36", ALCANCE_DA_TRAJETORIA_M - 500))?.trajetoria?.cabeceira).toBe("36");
  });

  it("ao lado da pista: só a distância, até 3 km", () => {
    const meio: [number, number] = [(n18.lonLat[0] + s36.lonLat[0]) / 2, (n18.lonLat[1] + s36.lonLat[1]) / 2];
    const ladoOeste: [number, number] = [meio[0] - 0.015, meio[1]];
    const r = relacaoComOAeroporto(ladoOeste)!;
    expect(r.trajetoria).toBeNull();
    expect(r.distanciaM).toBeLessThanOrEqual(RAIO_DO_AEROPORTO_M);
    // Rumo do prédio para a pista: leste.
    expect(r.rumoGraus).toBeGreaterThan(45);
    expect(r.rumoGraus).toBeLessThan(135);
    expect(relacaoComOAeroporto([meio[0] - 0.06, meio[1]])).toBeNull();
    expect(relacaoComOAeroporto(null)).toBeNull();
  });

  it("frases sem decibéis e com a pergunta para a visita", () => {
    for (const p of [alem("18", 3000), alem("18", 0, 1500)]) {
      const r = relacaoComOAeroporto(p);
      if (!r) continue;
      const f = fraseDoAeroporto(r);
      expect(`${f.manchete} ${f.frase} ${f.pergunta}`).not.toMatch(/db|decib/i);
      expect(f.pergunta).toMatch(/^Avião:/);
    }
  });
});

describe("prédios do índice ativo", () => {
  it("alguns ficam sob a trajetória e todos ficam a mais de 100 m da pista", () => {
    const dir = join(__dirname, "..", "src", "dados", "recife", "indice-municipal", "faa40c969275e6b5");
    let sob = 0;
    let perto = 0;
    for (const arq of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "meta.json")) {
      const dados = JSON.parse(readFileSync(join(dir, arq), "utf-8")) as { edificios?: { centro: [number, number] }[] };
      for (const p of dados.edificios ?? []) {
        const r = relacaoComOAeroporto(p.centro);
        if (!r) continue;
        if (r.trajetoria) sob += 1;
        else perto += 1;
        expect(r.distanciaM).toBeGreaterThan(100);
      }
    }
    expect(sob).toBeGreaterThan(0);
    expect(sob + perto).toBeGreaterThan(0);
  });
});
