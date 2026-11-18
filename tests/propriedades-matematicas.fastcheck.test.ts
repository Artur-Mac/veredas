import { describe, expect, test } from "@jest/globals";
import fc from "fast-check";
import { sirgas31985ParaWgs84, wgs84ParaSirgas31985 } from "../src/nucleo/geo/sirgas31985";
import { calcularSpuEstatutario } from "../src/nucleo/motores/spuMarinha";
import { gerarCnm16Formatado, validarCnm16 } from "../src/nucleo/documentos/auditorDocumental";
import { gerarDvProcessoCnj, validarNumeroProcessoCnj } from "../src/nucleo/documentos/datajudClient";
import { analisarItbiNbr14653 } from "../src/municipios/recife/motores/econometriaItbi";
import { ajustarZeladoriaPuLearningEm } from "../src/nucleo/motores/zeladoriaPuLearning";
import { dominaEstritamente, type CandidatoDecisao } from "../src/dados/cidadao/dominanciaInvisivel";

describe("Milestone 8 — Propriedades Matemáticas Invariantes (fast-check, >= 500 execuções)", () => {
  test("Ida e volta WGS84 <-> SIRGAS 2000 UTM 25S (EPSG:31985) tem erro < 1 mm em todo o Recife", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -35.05, max: -34.85, noNaN: true }),
        fc.double({ min: -8.18, max: -7.92, noNaN: true }),
        (lon, lat) => {
          const [easting, northing] = wgs84ParaSirgas31985(lon, lat);
          const [lonBack, latBack] = sirgas31985ParaWgs84(easting, northing);
          const dLatM = Math.abs(latBack - lat) * 111_132;
          const dLonM = Math.abs(lonBack - lon) * 111_320 * Math.cos((lat * Math.PI) / 180);
          return dLatM < 0.001 && dLonM < 0.001;
        },
      ),
      { numRuns: 500 },
    );
  });

  test("SPU estatutário é estritamente invariante ao preço de venda (benfeitorias) e monotônico no terreno/fração", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500_000, max: 30_000_000 }),
        fc.double({ min: 0.005, max: 0.5, noNaN: true }),
        fc.integer({ min: 200_000, max: 3_000_000 }),
        fc.integer({ min: 3_000_001, max: 8_000_000 }),
        (terreno, fracao, precoA, precoB) => {
          const rA = calcularSpuEstatutario({
            regime: "aforamento",
            valorDominioPlenoTerrenoReais: terreno,
            fracaoIdeal: fracao,
            precoImovelReais: precoA,
          });
          const rB = calcularSpuEstatutario({
            regime: "aforamento",
            valorDominioPlenoTerrenoReais: terreno,
            fracaoIdeal: fracao,
            precoImovelReais: precoB,
          });
          const rTerrenoMaior = calcularSpuEstatutario({
            regime: "aforamento",
            valorDominioPlenoTerrenoReais: terreno + 100_000,
            fracaoIdeal: fracao,
            precoImovelReais: precoA,
          });
          return (
            rA.laudemio5PctVendedorReais === rB.laudemio5PctVendedorReais &&
            rA.foroMensalReais === rB.foroMensalReais &&
            rTerrenoMaior.laudemio5PctVendedorReais! >= rA.laudemio5PctVendedorReais!
          );
        },
      ),
      { numRuns: 500 },
    );
  });

  test("CNM (16 dígitos) e CNJ (20 dígitos) detectam 100% de erro de 1 dígito em ISO 7064 MOD 97-10", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 999999 }),
        fc.integer({ min: 1, max: 9999999 }),
        fc.integer({ min: 0, max: 15 }),
        fc.integer({ min: 1, max: 9 }),
        (cns, mat, posMut, delta) => {
          const cnm = gerarCnm16Formatado(String(cns), "2", String(mat).padStart(7, "0"));
          if (!validarCnm16(cnm).valido) return false;
          const dig = cnm.replace(/\D+/g, "").split("");
          dig[posMut] = String((Number(dig[posMut]) + delta) % 10);
          return validarCnm16(dig.join("")).valido === false;
        },
      ),
      { numRuns: 500 },
    );

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999999 }),
        fc.integer({ min: 2015, max: 2026 }),
        fc.integer({ min: 0, max: 19 }),
        fc.integer({ min: 1, max: 9 }),
        (nSeq, ano, posMut, delta) => {
          const proc = gerarDvProcessoCnj(String(nSeq), String(ano), "8", "17", "2001");
          if (!validarNumeroProcessoCnj(proc).valido) return false;
          const dig = proc.replace(/\D+/g, "").split("");
          dig[posMut] = String((Number(dig[posMut]) + delta) % 10);
          return validarNumeroProcessoCnj(dig.join("")).valido === false;
        },
      ),
      { numRuns: 500 },
    );
  });

  test("NBR 14653-2 IC 80% mantém ordenação estrita ic80Min <= media <= ic80Max para amostras >= 3", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 250_000, max: 1_200_000 }), { minLength: 4, maxLength: 15 }),
        (precos) => {
          const regs = precos.map((p, i) => ({
            id: `tx-${i}`,
            dataTransacao: "2026-05-01",
            valorAvaliacaoReais: p,
            areaConstruidaM2: 100,
            fracaoIdeal: 1,
            sfh: true,
          }));
          const eco = analisarItbiNbr14653(regs);
          if (eco.amostraValidaN < 3 || eco.mediaHomogeneizadaReais === null) return true;
          return (
            eco.ic80MinReais! <= eco.mediaHomogeneizadaReais &&
            eco.mediaHomogeneizadaReais <= eco.ic80MaxReais!
          );
        },
      ),
      { numRuns: 500 },
    );
  });

  test("PU-Learning EM limita saídas em [0, 1] e preserva monotonicidade do ELBO", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            obs: fc.boolean(),
            renda: fc.double({ min: 0.5, max: 12, noNaN: true }),
            sinal: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
          { minLength: 3, maxLength: 8 },
        ),
        (lote) => {
          const res = ajustarZeladoriaPuLearningEm(
            lote.map((r, i) => ({
              id: `e-${i}`,
              observadoPositivo156: r.obs,
              rendaMedianaSm: r.renda,
              escolaridadeSuperiorPct: 50,
              coberturaInternetPct: 80,
              sinaisFisicos: {
                proximidadeCanalOuDrenagemScore: r.sinal,
                desnivelTopograficoScore: r.sinal * 0.8,
                deficienciaIluminacaoVistoriada: 0.3,
              },
            })),
            { maxIteracoes: 12 },
          );
          const boundsOk = res.itens.every(
            (x) =>
              x.propensaoReporteEstimada >= 0 &&
              x.propensaoReporteEstimada <= 1 &&
              x.riscoLatenteCorrigidoTheta >= 0 &&
              x.riscoLatenteCorrigidoTheta <= 1,
          );
          let mono = true;
          for (let i = 1; i < res.elboPorIteracao.length; i += 1) {
            if (res.elboPorIteracao[i]! < res.elboPorIteracao[i - 1]! - 1e-5) mono = false;
          }
          return boundsOk && mono;
        },
      ),
      { numRuns: 500 },
    );
  });

  test("Dominância invisível satisfaz irreflexividade, assimetria e transitividade", () => {
    const arbCand = fc.record({
      id: fc.constant("x"),
      nomeExibicao: fc.constant("x"),
      custoMensalTotalReais: fc.integer({ min: 1500, max: 12000 }),
      areaM2: fc.integer({ min: 25, max: 350 }),
      deslocamentoMinDia: fc.integer({ min: 5, max: 120 }),
      ruidoInternoDb: fc.integer({ min: 25, max: 75 }),
    }) as fc.Arbitrary<CandidatoDecisao>;

    fc.assert(
      fc.property(arbCand, arbCand, arbCand, (a, b, c) => {
        if (dominaEstritamente(a, a)) return false;
        if (dominaEstritamente(a, b) && dominaEstritamente(b, a)) return false;
        if (dominaEstritamente(a, b) && dominaEstritamente(b, c) && !dominaEstritamente(a, c)) return false;
        return true;
      }),
      { numRuns: 500 },
    );
  });
});
