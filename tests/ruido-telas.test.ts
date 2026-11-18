// Ruído estimado nas telas (decisões A1, A2, A3 e A13 de 18/11/2026; itens R1, R4 e R5 da unificação). Um modelo só:
// placar do dossiê, "Sossego à noite por fonte", pulso da quadra, matriz do Comparar, simulador andar × fachada, cartão
// "Dia × Noite" e tradutor dos 10 indicadores mostram a mesma estimativa do prédio. Regras conferidas aqui:
// - nenhuma nota "/10" de sossego na tela sem a ficha "como foi calculada" a um toque;
// - todo "dB" na tela vem com "estimativa" ou "estimado";
// - Golden Tower (Boa Viagem) e o prédio da Torre têm notas diferentes; frente mais barulhenta que fundos;
// - sem camada para o prédio: "Sem leitura", nunca um valor fixo;
// - saem da tela a Lei municipal 16.243/1996 e o RBAC 161 (conferência de leis); a referência é a NBR 10151.
import { describe, expect, it, jest } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { DueloFinalistas } from "../src/componentes/cidadao/DueloFinalistas";
import { SimuladorDaUnidade } from "../src/componentes/dossie-v1/SimuladorDaUnidade";
import { EscalaDeRuidoHumana } from "../src/componentes/visual/EscalasVisuais";
import { fichaDaMatrizComparar, MatrizVisualComparar, type ColunaMatrizComparar } from "../src/componentes/visual/MatrizVisualComparar";
import { PlacarHeroi5Segundos } from "../src/componentes/visual/PlacarHeroi5Segundos";
import { PulsoDaQuadra } from "../src/componentes/visual/PulsoDaQuadra";
import { decomporSossego } from "../src/dados/acustica/decomporSossego";
import { traduzirIndicadoresCidadao } from "../src/dados/cidadao/tradutorCidadao";
import { avaliarConfortoTermico } from "../src/dados/clima/confortoTermico";
import type { Edificio } from "../src/dados/contratos";
import type { CustoPorPartes } from "../src/dados/custoPorPartes";
import { calcularPulsoDaQuadra } from "../src/dados/dossie/pulsoDaQuadra";
import { derivarSintesesInteligentes } from "../src/dados/dossie/sintesesDaRua";
import type { FichaDeMetodo6Campos } from "../src/dados/fichaDeMetodo";
import { edificiosDoBairro, indiceDoBairro } from "../src/dados/recife/indice";
import { estimarRuido, type EstimativaDeRuido, type RuidoEstimado } from "../src/dados/ruido/estimativa";
import { acusticaDaEstimativa } from "../src/dados/ruido/ponte";
import { avaliarAcustica3d, fecharResultadoAcustico } from "../src/nucleo/motores/acustica3d";
import { simularUnidade } from "../src/dados/dossie/simuladorDaUnidade";
import { alturaDoAndarM } from "../src/dados/dossie/solESombra";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

const ROTULOS_DA_FICHA = ["O que mede: ", "Fonte: ", "Data: ", "Como foi calculada: ", "Limite: ", "Na visita: "];
const CAMPOS: (keyof FichaDeMetodo6Campos)[] = ["oQueMede", "fonte", "data", "calculo", "limite", "naVisita"];

function textos(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(textos);
  return (node.children ?? []).flatMap((c) => (typeof c === "string" ? [c] : textos(c)));
}
function montar(...elementos: React.ReactElement[]): TestRenderer.ReactTestRenderer {
  let arvore!: TestRenderer.ReactTestRenderer;
  act(() => {
    arvore = TestRenderer.create(React.createElement(TemaDoApp, null, ...elementos));
  });
  return arvore;
}
const botao = (a: TestRenderer.ReactTestRenderer, testID: string) => a.root.findAll((n) => n.props.testID === testID && typeof n.props.onPress === "function")[0];
function abrir(a: TestRenderer.ReactTestRenderer, testID: string): void {
  const b = botao(a, testID);
  if (!b) throw new Error(`botão ${testID} não está na tela`);
  act(() => b.props.onPress());
}
/** As duas regras de tela: dB só com estimativa; nota de sossego "/10" só com botão de ficha de método. */
function conferirRegras(a: TestRenderer.ReactTestRenderer): { comDb: string[]; notas: number } {
  const linhas = textos(a.toJSON());
  const comDb = linhas.filter((t) => /\bdB\b/.test(t));
  for (const t of comDb) expect(t).toMatch(/estimativ|estimad/i);
  const notas = linhas.filter((t) => /\d\s*\/\s*10\b(?!\/)/.test(t)).length;
  const fichas = a.root.findAll((n) => typeof n.props.testID === "string" && /metodo-toggle$/.test(n.props.testID) && typeof n.props.onPress === "function").length;
  if (notas > 0) expect(fichas).toBeGreaterThan(0);
  return { comDb, notas };
}

const predio = (bairro: "boa-viagem" | "torre" | "casa-forte", id: string): Edificio => edificiosDoBairro(bairro).find((e) => e.id === id)!;
const GOLDEN_TOWER = predio("boa-viagem", "8001-216");
const DA_TORRE = predio("torre", "31950-280");
const estimado = (e: EstimativaDeRuido): RuidoEstimado => {
  if (e.estado !== "estimado") throw new Error("sem leitura");
  return e;
};
const conforto = avaliarConfortoTermico({ andar: 6, fachadaAzimuteGraus: 90, pavimentosTotais: 15 });
const placar = (ruido: EstimativaDeRuido, anoConstrucao: number | null = 2005) =>
  React.createElement(PlacarHeroi5Segundos, {
    modalidade: "compra",
    precoPrincipalReais: 850_000,
    mensalBolsoRealReais: 5_900,
    dinheiroParaEntrarReais: 195_000,
    comparacaoM2Pct: 12,
    orientacaoCurta: "Nascente",
    conforto,
    ruidoDormitorioDb: acusticaDaEstimativa(ruido, { anoConstrucao })?.ruidoInternoDormitorioDbA ?? null,
    sossego: { ...ruido.textos.placar, ficha: ruido.estado === "estimado" ? ruido.textos.ficha : null },
  });

describe("placar do topo do dossiê (R1)", () => {
  it("o sossego vem do modelo: dB(A) estimado à noite, nota 0–10 e a ficha a um toque, com as fontes do prédio", () => {
    const ruido = estimado(estimarRuido(GOLDEN_TOWER, { andar: 6, fachadaGraus: 90, janelaFechada: true }));
    const a = montar(placar(ruido));
    const fechado = textos(a.toJSON()).join("\n");
    expect(fechado).toContain(ruido.nivelDeSossego);
    expect(fechado).toMatch(/~\d+ dB\(A\) à noite na janela \(estimativa\) · \d+,\d\/10/);
    expect(fechado).toContain(`${ruido.notaDeSossego.toFixed(1).replace(".", ",")}/10`);
    expect(fechado).not.toContain("O que mede");
    // As duas notas do placar (conforto e sossego) têm ficha.
    expect(botao(a, "placar-conforto-metodo-toggle")).toBeDefined();
    abrir(a, "placar-sossego-metodo-toggle");
    const aberto = textos(a.toJSON()).join("\n");
    for (const r of ROTULOS_DA_FICHA) expect(aberto).toContain(r);
    expect(aberto).toContain(ruido.fontes[0]!.texto);
    expect(aberto).toContain("Estimativa com dados abertos, não medição");
    expect(aberto).toContain("4 a 5 dB acima do medido");
    expect(aberto).toContain("10 a 15 dB abaixo do medido");
    expect(aberto).toContain("norma técnica, não lei municipal");
    conferirRegras(a);
    act(() => a.unmount());
  });

  it("Golden Tower e o prédio da Torre têm notas de sossego diferentes; a via fixa 'coletora a 18 m' acabou", () => {
    const gt = estimado(estimarRuido(GOLDEN_TOWER, { andar: 4, fachadaGraus: 90 }));
    const torre = estimado(estimarRuido(DA_TORRE, { andar: 4, fachadaGraus: 90 }));
    expect(gt.notaDeSossego).not.toBe(torre.notaDeSossego);
    expect(gt.textos.placar.subtitulo).not.toBe(torre.textos.placar.subtitulo);
    const a = montar(placar(gt)), b = montar(placar(torre));
    expect(textos(a.toJSON()).join("\n")).toContain(gt.textos.placar.subtitulo);
    expect(textos(b.toJSON()).join("\n")).toContain(torre.textos.placar.subtitulo);
    for (const arquivo of ["src/app/(abas)/dossie.tsx", "src/app/(abas)/comparar.tsx", "src/dados/dossie/colunaDoComparar.ts"]) {
      const fonte = readFileSync(join(__dirname, "..", arquivo), "utf8");
      expect(fonte).not.toMatch(/tipologiaVia|distanciaViaM|avaliarAcustica3d/);
      // Desde a pendência 1 do HANDOFF (19/11/2026) as telas leem o ruído pela unidade ativa, que chama estimarRuido; o
      // Comparar monta a coluna em src/dados/dossie/colunaDoComparar.ts.
      if (!arquivo.endsWith("comparar.tsx")) expect(fonte).toContain("lerUnidade(");
    }
    expect(readFileSync(join(__dirname, "..", "src/dados/dossie/unidadeAtiva.ts"), "utf8")).toContain("estimarRuido(");
    act(() => { a.unmount(); b.unmount(); });
  });

  it("sem leitura: diz 'Sem leitura', sem nota de sossego e sem número; o valor pedido compara com o ITBI do prédio", () => {
    const a = montar(placar(estimarRuido(null)));
    const t = textos(a.toJSON()).join("\n");
    expect(t).toContain("Sem leitura");
    expect(t).toContain("Sem estimativa de ruído");
    expect(t).not.toMatch(/\bdB\b/);
    expect(botao(a, "placar-sossego-metodo-toggle")).toBeUndefined();
    expect(t).toContain("12% acima do ITBI do prédio");
    expect(t).not.toMatch(/do bairro/);
    act(() => a.unmount());
  });
});

describe("'Sossego à noite por fonte' e pulso da quadra: a mesma nota, com ficha", () => {
  const ruido = estimado(estimarRuido(GOLDEN_TOWER, { andar: 6, fachadaGraus: 90, janelaFechada: true }));
  const acustica = acusticaDaEstimativa(ruido, { anoConstrucao: GOLDEN_TOWER.anoConstrucao })!;

  it("o resultado dos cartões sai do modelo: nível da noite na janela, janela da NBR 15575-4 e a nota do modelo", () => {
    expect(acustica.notaSossego0a10).toBe(ruido.notaDeSossego);
    expect(acustica.ruidoExternoCombinadoDbA).toBeCloseTo(ruido.naJanela.noiteDb, 1);
    expect(acustica.ruidoInternoDormitorioDbA).toBeCloseTo(ruido.noQuarto!.noiteDb, 1);
    expect(decomporSossego(acustica, 1999).notaSossego0a10).toBe(ruido.notaDeSossego);
    // O motor aposentado (só em teste) usa a mesma escala: 48 dB(A) = 10; 86 = 0.
    const motor = avaliarAcustica3d({ andar: 2, fachadaVoltadaParaVia: "frente", tipologiaVia: "coletora", distanciaViaM: 18, anoConstrucao: 2010 });
    expect(motor.notaSossego0a10).toBe(Math.round(((86 - motor.ruidoExternoCombinadoDbA) / 38) * 100) / 10);
    expect(decomporSossego(motor, 2010).notaSossego0a10).toBe(motor.notaSossego0a10);
  });

  it("cartão: nota de sossego com a ficha a um toque, dB só como estimativa; sem leitura, sem nota", () => {
    const a = montar(React.createElement(EscalaDeRuidoHumana, { acustica, anoConstrucao: 1999, ruido }));
    const fechado = textos(a.toJSON()).join("\n");
    expect(fechado).toContain(`Nota de sossego ${ruido.notaDeSossego.toFixed(1).replace(".", ",")} / 10`);
    expect(fechado).toContain(ruido.textos.manchete);
    expect(fechado).toContain("Estimativa com dados abertos, não medição.");
    expect(fechado).toContain("NBR 10151");
    abrir(a, "escala-ruido-metodo-toggle");
    const aberto = textos(a.toJSON()).join("\n");
    for (const r of ROTULOS_DA_FICHA) expect(aberto).toContain(r);
    expect(aberto).toContain(ruido.fontes[0]!.texto);
    expect(conferirRegras(a).notas).toBeGreaterThan(0);
    act(() => a.unmount());

    // Montado só com o motor (sem a estimativa do prédio), a nota continua com ficha: a geral.
    const motor = avaliarAcustica3d({ andar: 2, fachadaVoltadaParaVia: "frente", tipologiaVia: "coletora", distanciaViaM: 18, anoConstrucao: 2010 });
    const b = montar(React.createElement(EscalaDeRuidoHumana, { acustica: motor, anoConstrucao: 2010 }));
    expect(botao(b, "escala-ruido-metodo-toggle")).toBeDefined();
    conferirRegras(b);
    act(() => b.unmount());

    const c = montar(React.createElement(EscalaDeRuidoHumana, { acustica: null, anoConstrucao: null, ruido: estimarRuido(null) }));
    const semLeitura = textos(c.toJSON()).join("\n");
    expect(semLeitura).toContain("sem leitura");
    expect(semLeitura).not.toMatch(/\/\s*10|\bdB\b/);
    act(() => c.unmount());
  });

  it("pulso da quadra: o eixo de sossego usa a nota do modelo e diz a conta; sem leitura, fora da média", () => {
    const base = { conforto, anoConstrucao: 1999, obrasProximas: null, visaoRua: null, vinculoConfirmado: true, precoInformado: true, condominioInformado: true, spuAtivo: false };
    const com = calcularPulsoDaQuadra({ ...base, acustica });
    const sem = calcularPulsoDaQuadra({ ...base, acustica: null });
    const eixo = (p: typeof com) => p.eixos.find((e) => e.id === "sossego")!;
    expect(eixo(com).nota0a10).toBe(ruido.notaDeSossego);
    expect(eixo(com).resumo).toContain(ruido.nivelDeSossego);
    expect(eixo(com).conta).toContain("estimativa com dados abertos, não medição");
    expect(com.metodo.calculo).toContain(`Sossego noturno: ${eixo(com).conta}`);
    expect(eixo(sem).nota0a10).toBeNull();
    expect(eixo(sem).rotuloValor).toBe("Sem leitura");
    expect(sem.eixosComLeitura).toBe(com.eixosComLeitura - 1);
    const notas = sem.eixos.map((e) => e.nota0a10).filter((n): n is number => n !== null);
    expect(sem.mediaGeral0a10).toBe(Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10);
    // Dois prédios, duas notas no pulso.
    const torre = estimarRuido(DA_TORRE, { andar: 6, fachadaGraus: 90, janelaFechada: true });
    expect(eixo(calcularPulsoDaQuadra({ ...base, acustica: acusticaDaEstimativa(torre, { anoConstrucao: 1985 }) })).nota0a10).not.toBe(eixo(com).nota0a10);
    const a = montar(React.createElement(PulsoDaQuadra, { pulso: com }));
    abrir(a, "pulso-metodo-toggle");
    conferirRegras(a);
    act(() => a.unmount());
  });
});

describe("matriz do Comparar (R4): 'leva vantagem em N de 6' com o sossego pela nota do modelo", () => {
  const coluna = (nome: string, p: Edificio | null, extra: Partial<ColunaMatrizComparar> = {}): ColunaMatrizComparar => {
    const ruido = estimarRuido(p, { andar: 4, fachadaGraus: 90, janelaFechada: true });
    return {
      nome, precoPrincipalReais: 800_000, areaM2: 100, mensalBolsoRealReais: 6_000, orientacaoCurta: "Nascente", climaSelo: "Fresco", confortoQuente: false,
      ruidoInternoDb: acusticaDaEstimativa(ruido, { anoConstrucao: p?.anoConstrucao ?? null })?.ruidoInternoDormitorioDbA ?? null,
      sossego: ruido.estado === "estimado" ? { nota0a10: ruido.notaDeSossego, nivel: ruido.nivelDeSossego, noiteDb: ruido.naJanela.noiteDb } : null,
      anoConstrucao: 2010, spuAlerta: false, ...extra,
    };
  };

  it("a linha de sossego mostra a nota de cada prédio e a ficha diz como os 6 pontos são comparados", () => {
    const A = coluna("Golden Tower", GOLDEN_TOWER), B = coluna("Bosque da Torre", DA_TORRE);
    const a = montar(React.createElement(MatrizVisualComparar, { modalidade: "compra", opcaoA: A, opcaoB: B }));
    const t = textos(a.toJSON()).join("\n");
    expect(t).toContain(`${A.sossego!.nivel} · ${A.sossego!.nota0a10.toFixed(1).replace(".", ",")}/10`);
    expect(t).toContain(`${B.sossego!.nivel} · ${B.sossego!.nota0a10.toFixed(1).replace(".", ",")}/10`);
    expect(A.sossego!.nota0a10).not.toBe(B.sossego!.nota0a10);
    expect(t).toMatch(/Estimativa com dados abertos, não medição\./);
    abrir(a, "matriz-metodo-toggle");
    const aberto = textos(a.toJSON()).join("\n");
    for (const r of ROTULOS_DA_FICHA) expect(aberto).toContain(r);
    for (const ponto of ["Preço por m²", "Saída mensal", "Sol e conforto", "Sossego à noite", "Idade do prédio", "Terreno"]) expect(aberto).toContain(`${ponto}:`);
    expect(aberto).toContain("empate");
    conferirRegras(a);
    act(() => a.unmount());
    for (const campo of CAMPOS) expect(fichaDaMatrizComparar(false, true)[campo].length).toBeGreaterThan(20);
  });

  it("vantagem pelo sossego só com 1 ponto de nota de diferença; sem leitura num lado, empate e 'Sem leitura'", () => {
    const base = coluna("A", GOLDEN_TOWER);
    const vantagens = (x: ColunaMatrizComparar, y: ColunaMatrizComparar) => {
      const a = montar(React.createElement(MatrizVisualComparar, { modalidade: "compra", opcaoA: x, opcaoB: y }));
      const t = textos(a.toJSON()).join("\n");
      act(() => a.unmount());
      return t;
    };
    const melhor = { ...base, nome: "Quieto", sossego: { nota0a10: 9, nivel: "Muito tranquilo", noiteDb: 50 } };
    const pior = { ...base, nome: "Movimentado", sossego: { nota0a10: 6.5, nivel: "Moderado", noiteDb: 61 } };
    const quase = { ...base, nome: "Parecido", sossego: { nota0a10: 8.4, nivel: "Tranquilo", noiteDb: 54 } };
    expect(vantagens(melhor, pior)).toContain("Quieto leva vantagem em 1 de 6 pontos objetivos lado a lado.");
    expect(vantagens(pior, melhor)).toContain("Quieto leva vantagem em 1 de 6 pontos objetivos lado a lado.");
    expect(vantagens(melhor, quase)).toContain("Empate técnico direto");
    const semLeitura = vantagens(melhor, coluna("Sem prédio", null));
    expect(semLeitura).toContain("Sem leitura");
    expect(semLeitura).toContain("Empate técnico direto");
    expect(semLeitura).toContain("Sem prédio: sem leitura");
  });

  it("duelo dos finalistas: a palavra da estimativa, sem nota solta; sem leitura dito", () => {
    const candidato = { id: "a", nomeExibicao: "A", custoMensalTotalReais: 5000, areaM2: 90, deslocamentoMinDia: 40, ruidoInternoDb: 38, situacaoDocumentalResumo: "A confirmar", riscoAguaChuvaResumo: "Checar" };
    const a = montar(React.createElement(DueloFinalistas, { opcaoA: { ...candidato, sossego: { nota0a10: 8.8, nivel: "Muito tranquilo" } }, opcaoB: { ...candidato, id: "b", nomeExibicao: "B", sossego: null } }));
    const t = textos(a.toJSON()).join("\n");
    expect(t).toContain("Muito tranquilo à noite (estimativa)");
    expect(t).toContain("Sem leitura");
    expect(conferirRegras(a).notas).toBe(0);
    act(() => a.unmount());
  });
});

describe("simulador andar × fachada (R5)", () => {
  it("mostra a estimativa na janela, a faixa, a NBR 10151, a nota com ficha, o aviso e mantém as fontes nomeadas e as causas", () => {
    const a = montar(React.createElement(SimuladorDaUnidade, { predio: GOLDEN_TOWER, vizinhos: edificiosDoBairro("boa-viagem"), tipologia: "apartamento", andarInicial: 6, fachadaInicialGraus: 90 }));
    const resumo = a.root.findAll((n) => typeof n.props.onPress === "function" && typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.startsWith("Barulho por perto:"))[0]!;
    expect(resumo.props.accessibilityLabel).toMatch(/~\d+ dB\(A\) de dia · ~\d+ à noite \(estimativa\)/);
    act(() => resumo.props.onPress());
    const esperado = estimado(estimarRuido(GOLDEN_TOWER, { andar: 6, fachadaGraus: 90, janelaFechada: true }));
    const t = textos(a.toJSON()).join("\n");
    expect(t).toContain(esperado.textos.manchete);
    expect(t).toContain(esperado.textos.janela!);
    expect(t).toContain(esperado.textos.quarto!);
    expect(t).toContain(esperado.textos.faixa);
    expect(t).toContain(esperado.textos.nbr);
    expect(t).toContain("Estimativa com dados abertos, não medição.");
    expect(a.root.findAll((n) => n.props.testID === "simulador-causas-barulho").length).toBeGreaterThan(0);
    expect(t).toContain("Avião");
    abrir(a, "simulador-ruido-metodo-toggle");
    const aberto = textos(a.toJSON()).join("\n");
    for (const r of ROTULOS_DA_FICHA) expect(aberto).toContain(r);
    expect(aberto).toContain(esperado.fontes[0]!.texto);
    expect(conferirRegras(a).comDb.length).toBeGreaterThan(3);
    act(() => a.unmount());
  });

  it("frente mais barulhenta que fundos na tela do simulador", () => {
    const rua = estimado(estimarRuido(DA_TORRE));
    const rumo = Math.round(rua.fontes.find((f) => f.rumoGraus !== null)!.rumoGraus! / 45) * 45 % 360;
    const frente = estimado(estimarRuido(DA_TORRE, { andar: 3, fachadaGraus: rumo }));
    const fundos = estimado(estimarRuido(DA_TORRE, { andar: 3, fachadaGraus: (rumo + 180) % 360 }));
    expect(frente.naJanela.diaDb).toBeGreaterThan(fundos.naJanela.diaDb);
    expect(frente.textos.janela).not.toBe(fundos.textos.janela);
  });
});

describe("cartão 'Dia × Noite' e tradutor dos 10 indicadores", () => {
  it("o cartão traz os dB(A) estimados de dia e à noite com o aviso, e credita as vias do OpenStreetMap", () => {
    const indice = indiceDoBairro("boa-viagem");
    const s = derivarSintesesInteligentes({ slugBairro: "boa-viagem", edificio: GOLDEN_TOWER, ruaDoBairro: indice.rua ?? null, andar: 6 }).ruidoDiaNoite!;
    const e = estimado(estimarRuido(GOLDEN_TOWER));
    expect(s.sobretitulo).toBe("Acústica urbana · Dia × Noite");
    expect(s.medidaDestaque).toBe(`~${Math.round(e.naRua.diaDb)} dB(A) na rua de dia · ~${Math.round(e.naRua.noiteDb)} à noite (estimativa)`);
    expect(s.explicacaoHumana).toContain(e.textos.manchete);
    expect(s.explicacaoHumana).toContain("Estimativa com dados abertos, não medição.");
    expect(s.fonteCurta).toContain("© colaboradores do OpenStreetMap (ODbL)");
    for (const t of [s.manchete, s.medidaDestaque, s.explicacaoHumana, s.dicaPratica ?? ""]) if (/\bdB\b/.test(t)) expect(t).toMatch(/estimativ|estimad/i);
    // Sem prédio: o cartão fica só com os fatos, sem número.
    const semPredio = derivarSintesesInteligentes({ slugBairro: "boa-viagem", edificio: null, ruaDoBairro: null, andar: null }).ruidoDiaNoite;
    if (semPredio) expect(`${semPredio.medidaDestaque} ${semPredio.explicacaoHumana}`).not.toMatch(/\bdB\b/);
  });

  it("indicador de ruído: dB(A) estimado, referência só da norma técnica; saem a Lei 16.243/1996 e o RBAC 161", () => {
    const ruido = estimarRuido(GOLDEN_TOWER, { andar: 6, fachadaGraus: 90, janelaFechada: true });
    const acustica = acusticaDaEstimativa(ruido, { anoConstrucao: 1999 });
    // O cartão de ruído não lê o custo: um custo vazio basta para montar os dez.
    const custoPorPartes = {} as CustoPorPartes;
    const cartoes = (acu: typeof acustica) => traduzirIndicadoresCidadao({ modalidade: "compra", custoPorPartes, acustica: acu });
    const ind04 = cartoes(acustica).find((c) => c.indicadorId === "IND-04")!;
    const tudo = JSON.stringify(ind04);
    expect(tudo).not.toMatch(/16\.243|RBAC|SBRF|CTTU/);
    expect(ind04.camada1Manchete).toMatch(/estimativ|estimad/i);
    expect(ind04.camada1Manchete).toMatch(/~?\d+ dB\(A\)/);
    expect(ind04.camada3ProvaMetodo.metodo6Campos.baseLegalOuNormativa).toContain("norma técnica, não lei municipal");
    expect(ind04.camada3ProvaMetodo.metodo6Campos.baseLegalOuNormativa).toContain("NBR 10151");
    expect(ind04.camada3ProvaMetodo.metodo6Campos.fontePrimaria).toContain("OpenStreetMap (ODbL)");
    // Sem leitura: o cartão diz que não sabe, sem número.
    const sem = cartoes(null).find((c) => c.indicadorId === "IND-04")!;
    expect(sem.camada3ProvaMetodo.ausencia).not.toBeNull();
    expect(sem.camada1Manchete).not.toMatch(/\bdB\b/);
    // E o motor não devolve mais texto com a lei nem com o regulamento.
    expect(JSON.stringify(acustica)).not.toMatch(/16\.243|RBAC|SBRF|Lei/);
  });
});

// Pendência 3 do HANDOFF (19/11/2026).
describe("restos do ruído", () => {
  const manchete = (acu: NonNullable<ReturnType<typeof acusticaDaEstimativa>>) =>
    traduzirIndicadoresCidadao({ modalidade: "compra", custoPorPartes: {} as CustoPorPartes, acustica: acu }).find((c) => c.indicadorId === "IND-04")!.camada1Manchete;
  const fechar = (chao: number, aviao: number) =>
    fecharResultadoAcustico({ nivelDoChaoDbA: chao, nivelDoAviaoDbA: aviao, atenuacaoAlturaViaDb: 0, atenuacaoFachadaFundosDb: 0, isolamentoD2mnTwDb: 20, viaMovimentada: false, somNoturnoPerto: false, epistemicTag: "inferencia" });

  it("a manchete 'Rota de aviões' só aparece quando o avião é a fonte que mais pesa à noite", () => {
    expect(manchete(fechar(52, 34))).not.toContain("Rota de aviões");
    expect(manchete(fechar(50, 62))).toContain("Rota de aviões");
    expect(manchete(fechar(50, 62))).toContain("à noite na janela");
  });

  it("'dentro da referência' é o nível da noite na janela, o mesmo do texto da NBR 10151: nunca 'dentro' e 'N dB a mais à noite' juntos", () => {
    let dentro = 0, fora = 0;
    for (const bairro of ["boa-viagem", "torre", "casa-forte", "gracas", "imbiribeira"] as const) {
      for (const p of edificiosDoBairro(bairro)) {
        for (const opcoes of [{}, { andar: 9, fachadaGraus: 90 }, { andar: 2, fachadaGraus: 270 }]) {
          const e = estimarRuido(p, { ...opcoes, janelaFechada: true });
          if (e.estado !== "estimado") continue;
          const acu = acusticaDaEstimativa(e, { anoConstrucao: p.anoConstrucao ?? null })!;
          expect(acu.atendeReferenciaNoturnaNbr10151).toBe(Math.round(e.naJanela.noiteDb) <= 50);
          if (acu.atendeReferenciaNoturnaNbr10151) {
            dentro++;
            expect(e.textos.nbr).not.toMatch(/dB a mais à noite|à noite e fica dentro dela de dia/);
          } else {
            fora++;
            expect(e.textos.nbr).toMatch(/à noite/);
          }
        }
      }
    }
    expect(dentro).toBeGreaterThan(20);
    expect(fora).toBeGreaterThan(20);
  });

  it("o placar pinta o sossego pela palavra da nota, não por um corte próprio em dB do quarto", () => {
    const cor = (valor: string, dbQuarto: number | null) => {
      const a = montar(React.createElement(PlacarHeroi5Segundos, {
        modalidade: "compra", precoPrincipalReais: 650_000, mensalBolsoRealReais: 5_000, dinheiroParaEntrarReais: null, comparacaoM2Pct: null,
        orientacaoCurta: "Nascente", conforto: null, ruidoDormitorioDb: dbQuarto, sossego: { valor, subtitulo: "x", ficha: null },
      }));
      const celula = a.root.find((n) => n.props.testID === "placar-item-ruido");
      const textoGrande = celula.findAll((n) => n.props.children === valor && n.props.cor)[0]!;
      const r = textoGrande.props.cor as string;
      act(() => a.unmount());
      return r;
    };
    // Antes: 46 dB no quarto pintava "Tranquilo" de alerta.
    expect(cor("Tranquilo", 46)).not.toBe("cor-barro-texto");
    expect(cor("Agitado", 30)).toBe("cor-barro-texto");
    expect(cor("Barulhento", null)).toBe("cor-barro-texto");
  });

  it("a altura da janela do 9º andar é a mesma no simulador e no 2.5D (~29,4 m)", () => {
    expect(alturaDoAndarM(9)).toBe(29.4);
    const s = simularUnidade({ predio: GOLDEN_TOWER, vizinhos: edificiosDoBairro("boa-viagem"), tipo: "apartamento", andar: 9, fachadaGraus: null });
    expect(s.explicacaoDaAltura).toContain("~29,4 m");
  });
});
