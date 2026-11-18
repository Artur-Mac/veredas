// Modelo de ruído estimado (decisão A2, 18/11/2026): as contas de src/dados/ruido/modelo.ts, sem arquivo nenhum.
// Propagação de linha e de ponto, soma em energia, noite, andar, fachada, avião, nota e NBR 10151.
import { describe, expect, it } from "@jest/globals";
import {
  absorcao,
  compararComANbr10151,
  correcaoPorFaixas,
  correcaoPorVelocidade,
  deltaDaNoite,
  energiaDeElementoDeLinha,
  energiaDeTrecho,
  fracaoDaAbsorcao,
  nivelComJanelaFechada,
  nivelDaFonteNaJanela,
  nivelDaFontePontual,
  nivelDaVia,
  nivelDePonto,
  nivelDeTrecho,
  nivelDoAviao,
  nivelDoAviaoANoite,
  nivelDoChao,
  nivelDosOnibus,
  nivelNoAndar,
  notaDeSossego,
  quedaDaFachada,
  relacaoComAFachada,
  somarEmEnergia,
  dbDe,
  type FonteDoChao,
} from "../src/dados/ruido/modelo";
import * as P from "../src/dados/ruido/parametros";
import { somarComOAviao } from "../src/nucleo/motores/acustica3d";

/** Uma via reta e longa (20 km) passando a `p` metros do ponto. */
const viaLonga = (nivel: number, p: number, andar = 0) => nivelDeTrecho(nivel, -10_000, p, 10_000, p, andar);

describe("propagação", () => {
  it("ponto: dobrar a distância tira 6 dB (mais a absorção do trecho a mais)", () => {
    const perto = nivelDePonto(70, 20), longe = nivelDePonto(70, 40);
    expect(perto - longe).toBeCloseTo(20 * Math.log10(2) + (P.ABSORCAO_DB_POR_100_M / 100) * 20, 6);
    // Só a geometria, devolvendo a absorção: 6,02 dB.
    expect(perto + absorcao(20) - (longe + absorcao(40))).toBeCloseTo(6.02, 2);
    // A 10 m vale o nível de referência menos a absorção; mais perto que isso o nível não sobe.
    expect(nivelDePonto(70, 10)).toBeCloseTo(70 - 0.18, 6);
    expect(nivelDePonto(70, 3)).toBe(nivelDePonto(70, 10));
  });

  it("linha: dobrar a distância tira ~3 dB (a absorção acrescenta décimos)", () => {
    const d = viaLonga(73, 20) - viaLonga(73, 40);
    expect(d).toBeGreaterThan(3.0);
    expect(d).toBeLessThan(4.0);
    // A conta exata num trecho de 20 m visto de frente: 10·log10(2) da distância (3,01 dB), a correção do ângulo que o
    // trecho ocupa e a absorção dos metros a mais.
    const trecho = (p: number) => dbDe(energiaDeTrecho(73, -10, p, 10, p));
    const angulo = (p: number) => 2 * Math.atan(10 / p);
    expect(trecho(20) - trecho(40)).toBeCloseTo(10 * Math.log10(2) + 10 * Math.log10(angulo(20) / angulo(40)) + absorcao(20), 6);
    const curto = (p: number) => dbDe(energiaDeTrecho(73, -2, p, 2, p));
    expect(curto(100) - curto(200)).toBeGreaterThan(5.9); // trecho curto visto de longe cai como ponto
    // A 10 m de uma via longa o nível é o de referência da classe (menos décimos de absorção); nunca passa dele.
    expect(viaLonga(73, 10)).toBeGreaterThan(72.3);
    expect(viaLonga(73, 10)).toBeLessThanOrEqual(73);
    expect(viaLonga(73, 2)).toBeLessThanOrEqual(73);
  });

  it("linha finita: vale o ângulo que o trecho ocupa; partir a via em pedaços não conta duas vezes", () => {
    const inteira = energiaDeTrecho(68, -300, 40, 300, 40);
    const emDois = energiaDeTrecho(68, -300, 40, 0, 40) + energiaDeTrecho(68, 0, 40, 300, 40);
    const emTres = energiaDeTrecho(68, -300, 40, -100, 40) + energiaDeTrecho(68, -100, 40, 120, 40) + energiaDeTrecho(68, 120, 40, 300, 40);
    expect(emDois).toBeCloseTo(inteira, 6);
    expect(emTres / inteira).toBeCloseTo(1, 3);
    // Metade da via (só um lado) entrega metade da energia: −3 dB.
    expect(dbDe(inteira) - dbDe(energiaDeTrecho(68, 0, 40, 300, 40))).toBeCloseTo(3.01, 1);
    // Um trecho que só aparece de viés pesa menos que o mesmo trecho de frente.
    expect(energiaDeTrecho(68, 200, 40, 260, 40)).toBeLessThan(energiaDeTrecho(68, -30, 40, 30, 40));
    // Trecho de comprimento zero não soa; a ordem das pontas não importa.
    expect(energiaDeTrecho(68, 5, 5, 5, 5)).toBe(0);
    expect(energiaDeTrecho(68, 300, 40, -300, 40)).toBeCloseTo(inteira, 6);
  });

  it("elemento de linha (trilho amostrado): de longe vale um trecho do mesmo tamanho", () => {
    const elemento = energiaDeElementoDeLinha(70, 400, 90);
    const trecho = energiaDeTrecho(70, -45, 400, 45, 400);
    expect(elemento / trecho).toBeGreaterThan(0.98);
    expect(elemento / trecho).toBeLessThan(1.02);
  });

  it("absorção: ~1,8 dB a cada 100 m no chão; 60% disso do 10º andar para cima", () => {
    expect(absorcao(100)).toBeCloseTo(1.8, 6);
    expect(fracaoDaAbsorcao(0)).toBe(1);
    expect(fracaoDaAbsorcao(5)).toBeCloseTo(0.8, 6);
    expect(fracaoDaAbsorcao(10)).toBeCloseTo(0.6, 6);
    expect(fracaoDaAbsorcao(25)).toBeCloseTo(0.6, 6);
    expect(absorcao(100, 10)).toBeCloseTo(1.08, 6);
  });
});

describe("soma em energia", () => {
  it("dois níveis iguais somam +3 dB; um nível 10 dB abaixo quase não muda", () => {
    expect(somarEmEnergia([60, 60])).toBeCloseTo(63.01, 2);
    expect(somarEmEnergia([60, 50])).toBeCloseTo(60.41, 2);
    expect(somarEmEnergia([60])).toBeCloseTo(60, 6);
    expect(somarEmEnergia([])).toBe(-Infinity);
    expect(somarEmEnergia([55, -Infinity, Number.NaN])).toBeCloseTo(55, 6);
  });
  it("o avião entra por cima pela mesma soma (acustica3d), sem desconto", () => {
    expect(somarComOAviao(60, 60)).toBeCloseTo(63, 1);
    expect(somarComOAviao(60, null)).toBe(60);
    expect(somarComOAviao(60, 0)).toBe(60);
  });
});

describe("emissão", () => {
  it("classe pela etiqueta highway, com os níveis publicados", () => {
    expect(nivelDaVia({ highway: "trunk" })).toEqual({ classe: "rodovia", nivelDb: 78 });
    expect(nivelDaVia({ highway: "primary" })).toEqual({ classe: "arterial", nivelDb: 73 });
    expect(nivelDaVia({ highway: "secondary" })).toEqual({ classe: "coletora", nivelDb: 68 });
    expect(nivelDaVia({ highway: "tertiary" })).toEqual({ classe: "local", nivelDb: 61 });
    expect(nivelDaVia({ highway: "unclassified" })).toEqual({ classe: "local", nivelDb: 61 });
    expect(nivelDaVia({ highway: "residential" })).toEqual({ classe: "residencial", nivelDb: 48 });
    for (const h of ["service", "footway", "cycleway", "pedestrian", "construction"]) expect(nivelDaVia({ highway: h })).toBeNull();
    expect(nivelDaVia({})).toBeNull();
  });
  it("faixas e velocidade aumentam, zona 30 reduz, sempre com teto", () => {
    expect(correcaoPorFaixas(null)).toBe(0);
    expect(correcaoPorFaixas(2)).toBe(0);
    expect(correcaoPorFaixas(4)).toBeCloseTo(3.01, 2);
    expect(correcaoPorFaixas(12)).toBe(P.TETO_DA_CORRECAO_POR_FAIXAS_DB);
    expect(correcaoPorVelocidade(null)).toBe(0);
    expect(correcaoPorVelocidade(30)).toBe(P.CORRECAO_DE_ZONA_30_DB);
    expect(correcaoPorVelocidade(60)).toBe(0);
    expect(correcaoPorVelocidade(80)).toBe(2);
    expect(correcaoPorVelocidade(120)).toBe(P.TETO_DA_CORRECAO_POR_VELOCIDADE_DB);
    expect(nivelDaVia({ highway: "primary", lanes: "4", maxspeed: "60" })!.nivelDb).toBeCloseTo(76.01, 2);
    expect(nivelDaVia({ highway: "residential", maxspeed: "30" })!.nivelDb).toBe(46);
    expect(nivelDaVia({ highway: "primary", lanes: "sem número", maxspeed: "BR:urban" })!.nivelDb).toBe(73);
  });
  it("ônibus: 10·log10(partidas) sobre o nível por partida; dez vezes mais partidas, +10 dB", () => {
    expect(nivelDosOnibus(1000) - nivelDosOnibus(100)).toBeCloseTo(10, 6);
    expect(nivelDosOnibus(1000)).toBeCloseTo(P.NIVEL_POR_PARTIDA_DE_ONIBUS_DB + 30, 6);
    expect(nivelDosOnibus(0)).toBe(-Infinity);
    // Numa arterial quase não muda; numa rua residencial do mapa com linha de ônibus, muda muito.
    expect(somarEmEnergia([73, nivelDosOnibus(1000)]) - 73).toBeLessThan(1);
    expect(somarEmEnergia([48, nivelDosOnibus(1000)]) - 48).toBeGreaterThan(10);
  });
  it("fontes pontuais: bares em grupo ganham até 9 dB", () => {
    expect(nivelDaFontePontual("bar")).toBe(P.NIVEL_DA_FONTE_PONTUAL_DB.bar);
    expect(nivelDaFontePontual("bar", 2)).toBeCloseTo(P.NIVEL_DA_FONTE_PONTUAL_DB.bar + 3.01, 2);
    expect(nivelDaFontePontual("bar", 40)).toBe(P.NIVEL_DA_FONTE_PONTUAL_DB.bar + P.TETO_DO_GRUPO_DE_BARES_DB);
    expect(nivelDaFontePontual("oficina", 5)).toBe(P.NIVEL_DA_FONTE_PONTUAL_DB.oficina);
  });
});

describe("noite (22h–7h)", () => {
  it("cada classe perde o que a metodologia publica; bar e som licenciado ganham", () => {
    expect(deltaDaNoite("rodovia")).toBe(-6);
    expect(deltaDaNoite("arterial")).toBe(-7);
    expect(deltaDaNoite("coletora")).toBe(-8);
    expect(deltaDaNoite("local")).toBe(-9);
    expect(deltaDaNoite("residencial")).toBe(-10);
    expect(deltaDaNoite("trilho")).toBe(-6);
    expect(deltaDaNoite("bar")).toBe(3);
    expect(deltaDaNoite("luse")).toBe(4);
    expect(deltaDaNoite("mercado")).toBe(-12);
    expect(deltaDaNoite("oficina")).toBe(-15);
  });
  it("o piso cai de 38 para 33 e entra na soma", () => {
    expect(nivelDoChao([], -Infinity, "dia", 0, null)).toBeCloseTo(38, 6);
    expect(nivelDoChao([], -Infinity, "noite", 0, null)).toBeCloseTo(33, 6);
    const via: FonteDoChao = { tipo: "arterial", distanciaM: 30, rumoGraus: 90, nivelDeDiaDb: 65 };
    expect(nivelDaFonteNaJanela(via, "dia", 0, null) - nivelDaFonteNaJanela(via, "noite", 0, null)).toBe(7);
    expect(nivelDoChao([via], -Infinity, "dia", 0, null)).toBeGreaterThan(nivelDoChao([via], -Infinity, "noite", 0, null) + 6.9);
  });
});

describe("andar", () => {
  it("a 3,1 m por andar: a via a 18 m, vista do 10º andar, fica a ~36 m e perde ~3 dB", () => {
    const d3 = Math.hypot(18, 10 * P.METROS_POR_ANDAR);
    expect(d3).toBeCloseTo(35.85, 1);
    const queda = 65 - nivelNoAndar("arterial", 65, 18, 10);
    expect(queda).toBeGreaterThan(2.8);
    expect(queda).toBeLessThan(3.2);
    expect(nivelNoAndar("arterial", 65, 18, 0)).toBe(65);
  });
  it("o ponto perde o dobro da linha; perto da via, quanto mais alto, menos barulho", () => {
    const linha = 65 - nivelNoAndar("coletora", 65, 20, 8), ponto = 65 - nivelNoAndar("bar", 65, 20, 8);
    expect(ponto).toBeGreaterThan(linha * 1.9);
    let anterior = Infinity;
    for (const andar of [0, 2, 5, 10, 20]) {
      const n = nivelNoAndar("arterial", 70, 15, andar);
      expect(n).toBeLessThanOrEqual(anterior);
      anterior = n;
    }
  });
  it("fonte distante: o andar alto ouve um pouco melhor (menos absorção), como a metodologia descreve", () => {
    expect(nivelNoAndar("rodovia", 50, 600, 12)).toBeGreaterThan(50);
  });
  it("o cálculo direto do trecho no andar bate com levar o nível do chão ao andar (via longa e perto)", () => {
    const noChao = viaLonga(73, 25), direto = viaLonga(73, 25, 9);
    expect(Math.abs(nivelNoAndar("arterial", noChao, 25, 9) - direto)).toBeLessThan(0.5);
  });
});

describe("fachada", () => {
  it("de frente até 60°, de lado até 120°, de costas além disso; sem fachada, não se sabe", () => {
    expect(relacaoComAFachada(90, 90)).toBe("de_frente");
    expect(relacaoComAFachada(90, 150)).toBe("de_frente");
    expect(relacaoComAFachada(90, 151)).toBe("de_lado");
    expect(relacaoComAFachada(90, 210)).toBe("de_lado");
    expect(relacaoComAFachada(90, 270)).toBe("de_costas");
    expect(relacaoComAFachada(350, 20)).toBe("de_frente");
    expect(relacaoComAFachada(null, 20)).toBe("sem_fachada");
  });
  it("fundos < lado < frente: 12 dB da barreira do prédio, 3 dB de lado", () => {
    expect(quedaDaFachada(90, 90)).toBe(0);
    expect(quedaDaFachada(90, 180)).toBe(P.QUEDA_DE_LADO_DB);
    expect(quedaDaFachada(90, 270)).toBe(P.BARREIRA_DOS_FUNDOS_DB);
    expect(quedaDaFachada(null, 270)).toBe(0);
    const via: FonteDoChao = { tipo: "arterial", distanciaM: 30, rumoGraus: 90, nivelDeDiaDb: 66 };
    const frente = nivelDoChao([via], -Infinity, "dia", 4, 90), lado = nivelDoChao([via], -Infinity, "dia", 4, 180), fundos = nivelDoChao([via], -Infinity, "dia", 4, 270);
    expect(fundos).toBeLessThan(lado);
    expect(lado).toBeLessThan(frente);
    expect(frente - fundos).toBeGreaterThan(10);
  });
});

describe("avião", () => {
  it("pela altura: os três pontos publicados (60 m, 150 m e 300 m de altura)", () => {
    expect(nivelDoAviao(60)).toBeCloseTo(71, 6);
    expect(Math.abs(nivelDoAviao(150) - 66)).toBeLessThanOrEqual(0.6);
    expect(Math.abs(nivelDoAviao(300) - 60)).toBeLessThanOrEqual(0.6);
    // Mais baixo que 60 m não passa do que a página publica.
    expect(nivelDoAviao(20)).toBe(71);
    expect(nivelDoAviao(500)).toBeLessThan(nivelDoAviao(300));
  });
  it("1 km de lado tira ~9 dB; à noite, 7 dB a menos", () => {
    expect(nivelDoAviao(150) - nivelDoAviao(150, 1000)).toBeCloseTo(9, 6);
    expect(nivelDoAviao(150, -400)).toBe(nivelDoAviao(150, 400));
    expect(nivelDoAviaoANoite(66)).toBe(59);
  });
});

describe("nota de sossego e NBR 10151", () => {
  it("48 dB(A) ou menos = 10; 86 ou mais = 0; linear no meio", () => {
    expect(notaDeSossego(48)).toBe(10);
    expect(notaDeSossego(30)).toBe(10);
    expect(notaDeSossego(86)).toBe(0);
    expect(notaDeSossego(95)).toBe(0);
    expect(notaDeSossego(67)).toBe(5);
    expect(notaDeSossego(66)).toBe(5.3); // o índice 54 do Mapa Sossego (~66 dB(A)), dividido por 10
    expect(notaDeSossego(61)).toBe(6.6); // o índice 65 (~61 dB(A))
    expect(notaDeSossego(60)).toBeGreaterThan(notaDeSossego(61));
  });
  it("compara com 55 dB(A) de dia e 50 à noite", () => {
    expect(compararComANbr10151(66.2, "dia")).toEqual({ limiteDb: 55, diferencaDb: 11 });
    expect(compararComANbr10151(48.4, "noite")).toEqual({ limiteDb: 50, diferencaDb: -2 });
  });
  it("janela fechada: o nível de fora menos o isolamento", () => {
    expect(nivelComJanelaFechada(60, 27)).toBe(33);
  });
});
