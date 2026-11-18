// Ruído estimado (decisão A2, 18/11/2026): a camada publicada e a leitura do app.
// (1) o núcleo do pipeline é determinístico; (2) a camada cobre todos os prédios do índice ativo, valida e cabe no peso;
// (3) estimarRuido devolve dB(A) estimados de dia e à noite, faixa, NBR 10151, nota e fontes, e "sem leitura" sem camada;
// (4) aceite: Golden Tower, Torre e Casa Forte com números diferentes e frente mais barulhenta que fundos;
// (5) todo texto com "dB" diz "estimativa" ou "estimado".
import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import { gzipSync } from "zlib";
import { camadaDoBairro, criarPlano, fontesDoPonto, prepararCenario, type ViaDoMapa } from "../scripts/dados/ruido/nucleo";
import { CAMADAS_PUBLICADAS } from "../src/dados/camadasGeradas";
import { camadasDoBairro } from "../src/dados/camadasDasTelas";
import type { Edificio } from "../src/dados/contratos";
import { aviaoNoPonto, baseDoAeroporto, relacaoComOAeroporto } from "../src/dados/recife/aeroporto";
import { nivelDoAviao } from "../src/dados/ruido/modelo";
import { BAIRROS_HABILITADOS, DIRETORIO_DO_INDICE } from "../src/dados/recife/publicacaoGerada";
import { ARQUIVOS_DO_RUIDO, FONTES_DO_RUIDO, INDICE_DO_RUIDO, VERSAO_DO_RUIDO } from "../src/dados/recife/ruidoGerado";
import { arquivoDoRuido, estimarRuido, fichaGeralDoRuido, ruidoDoBairro, type RuidoEstimado } from "../src/dados/ruido/estimativa";
import { AVISO_DE_ESTIMATIVA, FAIXA_DB } from "../src/dados/ruido/parametros";
import { acusticaDaEstimativa } from "../src/dados/ruido/ponte";
import { simularUnidade } from "../src/dados/dossie/simuladorDaUnidade";

const DADOS = join(__dirname, "..", "src", "dados");
const indiceDe = (bairro: string) => (JSON.parse(readFileSync(join(DADOS, "recife", DIRETORIO_DO_INDICE, `${bairro}.json`), "utf8")) as { edificios: Edificio[] }).edificios;
const predioDe = (bairro: string, id: string): Edificio => {
  const p = indiceDe(bairro).find((e) => e.id === id);
  if (!p) throw new Error(`Prédio ${id} não está no índice de ${bairro}`);
  return p;
};
const estimado = (e: ReturnType<typeof estimarRuido>): RuidoEstimado => {
  if (e.estado !== "estimado") throw new Error(`sem leitura: ${e.motivo}`);
  return e;
};
/** Todas as frases de um valor (recursivo). */
function frases(v: unknown, saida: string[] = []): string[] {
  if (typeof v === "string") saida.push(v);
  else if (Array.isArray(v)) for (const x of v) frases(x, saida);
  else if (v && typeof v === "object") for (const x of Object.values(v)) frases(x, saida);
  return saida;
}

// Os três prédios do aceite (seção 4.1): Golden Tower (Boa Viagem), um da Torre e um de Casa Forte.
const GOLDEN_TOWER = () => predioDe("boa-viagem", "8001-216");
const DA_TORRE = () => predioDe("torre", "31950-280");
const DE_CASA_FORTE = () => predioDe("casa-forte", "19526-1070");

describe("núcleo do pipeline: determinístico", () => {
  const plano = criarPlano(-34.9, -8.05);
  // 1 grau de longitude ≈ 110,2 km nessa latitude; 0,001° ≈ 110 m.
  const vias: ViaDoMapa[] = [
    { id: 30, nome: "Avenida Um", highway: "primary", lanes: "3", pontos: [[-34.905, -8.0495], [-34.9, -8.0495], [-34.895, -8.0495]] },
    { id: 10, nome: "Rua Dois", highway: "residential", pontos: [[-34.9, -8.055], [-34.9, -8.045]] },
    { id: 20, nome: "Avenida Um", highway: "primary", lanes: "3", pontos: [[-34.895, -8.0495], [-34.89, -8.0495]] },
    { id: 40, nome: null, highway: "tertiary", pontos: [[-34.903, -8.052], [-34.897, -8.052]] },
    { id: 50, nome: "Passeio", highway: "footway", pontos: [[-34.9001, -8.05], [-34.9002, -8.05]] },
  ];
  const entrada = {
    vias,
    // A parada fica na avenida, a ~220 m da Rua Dois (que cruza a avenida em -34,9).
    paradas: [[-34.902, -8.04951, 800] as const],
    trilho: [[-34.9, -8.06] as const, [-34.899, -8.06] as const],
    luse: [[-34.9005, -8.0503] as const],
    plano,
  };
  const predios = [
    { id: "b-2", lon: -34.9003, lat: -8.0502 },
    { id: "a-1", lon: -34.8995, lat: -8.0512 },
    { id: "c-3", lon: -34.86, lat: -8.0 },
  ];
  const atrito = { "a-1": { n: [3, 40, 90] as const, o: [1, 100, 180] as const, m: [0, 250, 0] as const } };

  it("duas execuções dão o mesmo texto, e a ordem de entrada das vias e dos prédios não muda nada", () => {
    const a = JSON.stringify(camadaDoBairro(prepararCenario(entrada), "v", predios, atrito, plano));
    const b = JSON.stringify(camadaDoBairro(prepararCenario(entrada), "v", predios, atrito, plano));
    const c = JSON.stringify(camadaDoBairro(prepararCenario({ ...entrada, vias: [...vias].reverse() }), "v", [...predios].reverse(), atrito, plano));
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it("o registro guarda as fontes que mais pesam, com nome, distância, rumo e nível, e o resto por fachada", () => {
    const camada = camadaDoBairro(prepararCenario(entrada), "v", predios, atrito, plano);
    expect(Object.keys(camada.predios)).toEqual(["a-1", "b-2", "c-3"]);
    const b2 = camada.predios["b-2"]!;
    // A avenida (arterial, código 1) é a que mais pesa: a ~77 m ao norte, com as partidas da parada ligada a ela.
    expect(b2.f[0]![0]).toBe(1);
    expect(camada.nomes[b2.f[0]![1]]).toBe("Avenida Um");
    expect(b2.f[0]![2]).toBeGreaterThan(60);
    expect(b2.f[0]![2]).toBeLessThan(95);
    expect([0, 355, 356, 357, 358, 359, 1, 2, 3, 4, 5]).toContain(b2.f[0]![3]);
    expect(b2.f[0]![5]).toBe(800);
    // O LUSE a ~60 m entra como fonte (código 6); o passeio (footway) não é via de trânsito.
    expect(b2.f.some((f) => f[0] === 6)).toBe(true);
    expect(camada.nomes).not.toContain("Passeio");
    // No máximo 6 fontes; o resto, quando há, vem em 9 posições (na rua + 8 fachadas), em décimos de dB.
    for (const p of Object.values(camada.predios)) {
      expect(p.f.length).toBeLessThanOrEqual(6);
      for (const r of [p.d, p.n]) if (r) expect(r).toHaveLength(9);
    }
    // Longe de tudo (mais de 1,5 km): nenhuma fonte, só o piso urbano entra no app.
    expect(camada.predios["c-3"]).toEqual({ f: [] });
    // O bar em grupo (3 a 150 m) e a oficina do CNEFE entram pelo atrito; o mercado a 250 m passa do raio de 200 m.
    const tipos = fontesDoPonto(prepararCenario(entrada), ...plano(-34.8995, -8.0512), atrito["a-1"]).map((f) => f.tipo);
    expect(tipos).toEqual(expect.arrayContaining(["bar", "oficina"]));
    expect(tipos).not.toContain("mercado");
  });

  it("os ônibus pesam mais numa rua pequena do que numa avenida", () => {
    const semOnibus = fontesDoPonto(prepararCenario({ ...entrada, paradas: [] }), ...plano(-34.9003, -8.0502), null).find((f) => f.nome === "Avenida Um")!;
    const comOnibus = fontesDoPonto(prepararCenario(entrada), ...plano(-34.9003, -8.0502), null).find((f) => f.nome === "Avenida Um")!;
    expect(comOnibus.nivelDeDiaDb).toBeGreaterThan(semOnibus.nivelDeDiaDb);
    expect(comOnibus.nivelDeDiaDb - semOnibus.nivelDeDiaDb).toBeLessThan(1);
  });
});

describe("camada publicada", () => {
  it("cobre os 72 bairros e os 7.203 prédios do índice ativo, na versão gerada", () => {
    expect(INDICE_DO_RUIDO).toBe(DIRETORIO_DO_INDICE);
    expect(Object.keys(ARQUIVOS_DO_RUIDO).sort()).toEqual([...BAIRROS_HABILITADOS].sort());
    let predios = 0;
    for (const bairro of BAIRROS_HABILITADOS) {
      const camada = ruidoDoBairro(bairro);
      expect({ bairro, valida: camada !== null }).toEqual({ bairro, valida: true });
      expect(camada!.versao).toBe(VERSAO_DO_RUIDO);
      const ids = indiceDe(bairro).map((e) => e.id);
      expect({ bairro, semRegistro: ids.filter((id) => !camada!.predios[id]) }).toEqual({ bairro, semRegistro: [] });
      expect(Object.keys(camada!.predios)).toHaveLength(ids.length);
      for (const p of Object.values(camada!.predios)) for (const f of p.f) if (f[1] >= 0) expect(camada!.nomes[f[1]]).toBeDefined();
      predios += ids.length;
    }
    expect(predios).toBe(7203);
  });

  it("entra pelo sistema de camadas (manifesto) e na espera do dossiê", () => {
    for (const c of Object.values(ARQUIVOS_DO_RUIDO)) expect(CAMADAS_PUBLICADAS[c]).toBeDefined();
    expect(camadasDoBairro("boa-viagem")).toContain(arquivoDoRuido("boa-viagem"));
    expect(arquivoDoRuido("nao-existe")).toBeNull();
  });

  it("peso: cada arquivo até 450 kB (150 kB com gzip) e a camada inteira até 2 MB", () => {
    let total = 0;
    for (const c of Object.values(ARQUIVOS_DO_RUIDO)) {
      const bytes = readFileSync(join(DADOS, c));
      total += bytes.length;
      expect({ c, ok: bytes.length <= 450_000 }).toEqual({ c, ok: true });
      expect({ c, ok: gzipSync(bytes).length <= 150_000 }).toEqual({ c, ok: true });
    }
    expect(total).toBeLessThanOrEqual(2_000_000);
  });

  it("origem das vias: extrato datado do Geofabrik com MD5 e SHA-256, licença ODbL e atribuição", () => {
    expect(FONTES_DO_RUIDO.vias.url).toMatch(/^https:\/\/download\.geofabrik\.de\/south-america\/brazil\/nordeste-\d{6}\.osm\.pbf$/);
    expect(FONTES_DO_RUIDO.vias.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(FONTES_DO_RUIDO.vias.md5).toMatch(/^[0-9a-f]{32}$/);
    expect(FONTES_DO_RUIDO.vias.dadosDe).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(FONTES_DO_RUIDO.vias.licenca).toBe("ODbL 1.0");
    expect(FONTES_DO_RUIDO.vias.atribuicao).toBe("© colaboradores do OpenStreetMap");
    const sobre = readFileSync(join(__dirname, "..", "src", "app", "sobre-os-dados.tsx"), "utf8");
    expect(sobre).toContain("© colaboradores do OpenStreetMap, sob a Open Database License (ODbL)");
    expect(sobre).toContain("estimativa com dados abertos, não medição");
  });

  it("LGPD: só vias, pontos e contagens; nenhum nome de pessoa, estabelecimento, CPF, CNPJ ou processo", () => {
    const camada = ruidoDoBairro("gracas")!;
    expect(Object.keys(camada).sort()).toEqual(["nomes", "predios", "versao"]);
    for (const p of Object.values(camada.predios)) expect(Object.keys(p).every((k) => ["f", "d", "n"].includes(k))).toBe(true);
    // Os nomes são de logradouro (etiqueta `name` das vias do OpenStreetMap): começam por um tipo de via.
    const tipoDeVia = /^(Rua|Avenida|Av\.|Travessa|Estrada|Praça|Ponte|Viaduto|Rodovia|Alameda|Largo|Beco|Via|Túnel|Acesso|Cais|Ladeira|Parque|Pátio|Vila|Caminho|Girador|Retorno|Alça|Passagem|Marginal|Corredor|Complexo|Terminal|BR-|PE-|\d)/i;
    const fora = camada.nomes.filter((n) => !tipoDeVia.test(n));
    expect(fora.length).toBeLessThanOrEqual(Math.ceil(camada.nomes.length * 0.05));
  });
});

describe("estimarRuido", () => {
  it("devolve dB(A) de dia e à noite na rua, faixa de ±5, NBR 10151, nota 0–10, fontes e textos", () => {
    const e = estimado(estimarRuido(GOLDEN_TOWER()));
    expect(e.naRua.diaDb).toBeGreaterThan(e.naRua.noiteDb);
    expect(e.naRua.diaDb).toBeGreaterThan(45);
    expect(e.naRua.diaDb).toBeLessThan(80);
    expect(e.naJanela).toEqual(e.naRua);
    expect(e.noQuarto).toBeNull();
    expect(e.faixaDb).toBe(FAIXA_DB);
    expect(e.nbr10151.dia).toEqual({ limiteDb: 55, diferencaDb: Math.round(e.naRua.diaDb) - 55 });
    expect(e.nbr10151.noite).toEqual({ limiteDb: 50, diferencaDb: Math.round(e.naRua.noiteDb) - 50 });
    expect(e.notaDeSossego).toBeGreaterThanOrEqual(0);
    expect(e.notaDeSossego).toBeLessThanOrEqual(10);
    expect(e.textos.manchete).toMatch(/^~\d+ dB\(A\) na rua de dia · ~\d+ à noite \(estimativa\)$/);
    expect(e.textos.faixa).toContain("±5 dB");
    expect(e.textos.nbr).toContain("NBR 10151");
    expect(e.textos.nbr).toContain("norma técnica, não lei municipal");
    expect(e.textos.aviso).toBe(`${AVISO_DE_ESTIMATIVA}.`);
    expect(e.textos.janela).toBeNull();
    // Fontes com nome, classe, distância e nível; a ficha as repete e traz os vieses conhecidos.
    expect(e.fontes.length).toBeGreaterThan(0);
    const via = e.fontes.find((f) => f.classe !== null)!;
    expect(via.nome.length).toBeGreaterThan(3);
    expect(via.distanciaM).toBeGreaterThan(0);
    expect(via.texto).toMatch(/, \d+ m: ~\d+ dB\(A\) de dia · ~\d+ à noite \(estimativa\)$/);
    expect(e.textos.ficha.calculo).toContain(e.fontes[0]!.texto);
    expect(e.textos.ficha.limite).toContain("4 a 5 dB acima do medido");
    expect(e.textos.ficha.limite).toContain("10 a 15 dB abaixo do medido");
    expect(e.textos.ficha.limite).toContain(AVISO_DE_ESTIMATIVA);
    expect(e.textos.ficha.fonte).toContain("© colaboradores do OpenStreetMap, ODbL");
  });

  it("sem prédio, sem camada ou sem registro: 'sem leitura', nunca um valor fixo", () => {
    for (const [e, motivo] of [
      [estimarRuido(null), "sem_predio"],
      [estimarRuido(undefined), "sem_predio"],
      [estimarRuido({ ...GOLDEN_TOWER(), bairro: "bairro-sem-camada" }), "sem_camada"],
      [estimarRuido({ ...GOLDEN_TOWER(), id: "nao-existe" }), "sem_registro"],
    ] as const) {
      expect(e.estado).toBe("sem_leitura");
      if (e.estado !== "sem_leitura") continue;
      expect(e.motivo).toBe(motivo);
      expect(JSON.stringify(e)).not.toMatch(/\d\s*dB/);
      expect(e.textos.placar.valor).toBe("Sem leitura");
      expect(acusticaDaEstimativa(e, { anoConstrucao: 2000 })).toBeNull();
    }
  });

  it("andar e fachada mudam a janela, não a rua; a janela fechada tira o isolamento da NBR 15575-4 pelo ano do prédio", () => {
    const p = GOLDEN_TOWER();
    const rua = estimado(estimarRuido(p));
    const frente = rua.fontes.find((f) => f.rumoGraus !== null)!.rumoGraus!;
    const janela = estimado(estimarRuido(p, { andar: 9, fachadaGraus: frente, janelaFechada: true }));
    expect(janela.naRua).toEqual(rua.naRua);
    expect(janela.naJanela).not.toEqual(rua.naRua);
    expect(janela.textos.janela).toMatch(/^Na janela do 9º andar, fachada \w+: ~\d+ dB\(A\) de dia · ~\d+ à noite \(estimativa\)$/);
    // Prédio de 1999 (antes de 2013): 17,8 dB de isolamento.
    expect(janela.noQuarto!.isolamentoDb).toBe(17.8);
    expect(janela.noQuarto!.noiteDb).toBeCloseTo(janela.naJanela.noiteDb - 17.8, 1);
    const novo = estimado(estimarRuido(p, { andar: 9, fachadaGraus: frente, janelaFechada: true, anoConstrucao: 2020 }));
    expect(novo.noQuarto!.isolamentoDb).toBe(27);
    expect(novo.noQuarto!.noiteDb).toBeLessThan(janela.noQuarto!.noiteDb);
    expect(janela.textos.quarto).toContain("com a janela fechada");
    expect(janela.textos.quarto).toContain("(estimativa)");
  });

  it("aceite: Golden Tower, Torre e Casa Forte com números e notas diferentes, e frente mais barulhenta que fundos", () => {
    const leituras = [GOLDEN_TOWER(), DA_TORRE(), DE_CASA_FORTE()].map((p) => ({ p, rua: estimado(estimarRuido(p)) }));
    const notas = leituras.map((l) => l.rua.notaDeSossego);
    // Desde 19/11/2026 (pendência 2 do HANDOFF) o Golden Tower recebe o avião fora do cone e o dia dele empatou, por
    // coincidência, com o de Casa Forte (63,4); o par dia/noite e a nota continuam diferentes nos três.
    expect(new Set(leituras.map((l) => `${l.rua.naRua.diaDb}/${l.rua.naRua.noiteDb}`)).size).toBe(3);
    expect(new Set(leituras.map((l) => l.rua.naRua.noiteDb)).size).toBe(3);
    expect(new Set(notas).size).toBe(3);
    // Aceite do R1: Golden Tower e o prédio da Torre com notas de sossego diferentes.
    expect(notas[0]).not.toBe(notas[1]);
    for (const { p, rua } of leituras) {
      const maisForte = rua.fontes.find((f) => f.rumoGraus !== null)!;
      const andar = Math.max(1, Math.round(((p.pavimentos ?? 8) - 1) / 2));
      const frente = estimado(estimarRuido(p, { andar, fachadaGraus: maisForte.rumoGraus }));
      const fundos = estimado(estimarRuido(p, { andar, fachadaGraus: (maisForte.rumoGraus! + 180) % 360 }));
      expect(frente.naJanela.diaDb).toBeGreaterThan(fundos.naJanela.diaDb);
      expect(frente.naJanela.noiteDb).toBeGreaterThan(fundos.naJanela.noiteDb);
      expect(frente.notaDeSossego).toBeLessThanOrEqual(fundos.notaDeSossego);
      expect(frente.fontes.find((f) => f.nome === maisForte.nome && f.distanciaM === maisForte.distanciaM)!.relacao).toBe("de_frente");
      expect(fundos.fontes.find((f) => f.nome === maisForte.nome && f.distanciaM === maisForte.distanciaM)!.relacao).toBe("de_costas");
    }
  });

  it("todo texto com 'dB' diz 'estimativa' ou 'estimado' (com e sem andar, fachada, janela e avião)", () => {
    const sobALinha = indiceDe("imbiribeira").find((p) => relacaoComOAeroporto(p.centro)?.trajetoria) ?? indiceDe("boa-viagem").find((p) => relacaoComOAeroporto(p.centro)?.trajetoria)!;
    const casos = [
      estimarRuido(GOLDEN_TOWER()),
      estimarRuido(DA_TORRE(), { andar: 3, fachadaGraus: 90, janelaFechada: true }),
      estimarRuido(DE_CASA_FORTE(), { andar: 12, fachadaGraus: 270 }),
      estimarRuido(sobALinha, { andar: 5, fachadaGraus: 0, janelaFechada: true }),
    ];
    for (const e of casos) {
      const comDb = frases(estimado(e).textos).filter((t) => /\bdB\b/.test(t));
      expect(comDb.length).toBeGreaterThan(5);
      for (const t of comDb) expect(t).toMatch(/estimativ|estimad/i);
    }
    for (const t of frases(fichaGeralDoRuido()).filter((x) => /\bdB\b/.test(x))) expect(t).toMatch(/estimativ|estimad/i);
  });
});

describe("avião: um cálculo só (cone da pista + soma em energia)", () => {
  const sobALinha = () => {
    for (const bairro of ["imbiribeira", "boa-viagem", "ipsep", "pina"]) {
      const p = indiceDe(bairro).find((e) => relacaoComOAeroporto(e.centro)?.trajetoria);
      if (p) return p;
    }
    throw new Error("nenhum prédio sob a linha de pouso nos bairros esperados");
  };

  it("sob a linha de pouso o avião entra nas fontes, pela altura do cone, e não muda com andar nem fachada", () => {
    const p = sobALinha();
    const t = relacaoComOAeroporto(p.centro)!.trajetoria!;
    const rua = estimado(estimarRuido(p));
    const aviao = rua.fontes.find((f) => f.tipo === "aviao")!;
    expect(aviao.relacao).toBe("de_cima");
    expect(aviao.texto).toContain(`avião a ~${t.alturaEstimadaM} m de altura`);
    expect(aviao.texto).toContain("(estimativa)");
    expect(aviao.nivelDeDiaDb - aviao.nivelANoiteDb).toBeCloseTo(7, 6);
    for (const opcoes of [{ andar: 15 }, { andar: 15, fachadaGraus: 0 }, { andar: 15, fachadaGraus: 180 }]) {
      const e = estimado(estimarRuido(p, opcoes));
      expect(e.partes.doAviao).toEqual(rua.partes.doAviao);
      expect(e.fontes.find((f) => f.tipo === "aviao")!.nivelDeDiaDb).toBe(aviao.nivelDeDiaDb);
      // O total nunca fica abaixo do avião sozinho: ele entra inteiro, sem desconto.
      expect(e.naJanela.diaDb).toBeGreaterThanOrEqual(aviao.nivelDeDiaDb);
    }
    // Fora da linha de pouso não há parcela de avião.
    expect(estimado(estimarRuido(DE_CASA_FORTE())).partes.doAviao).toBeNull();
  });

  it("aeroporto dentro de simularUnidade: fonte nomeada, causa 'Avião', som de cima e dB só como estimativa", () => {
    const p = sobALinha();
    const vizinhos = indiceDe(p.bairro);
    const frente = simularUnidade({ predio: p, vizinhos, tipo: "apartamento", andar: 6, fachadaGraus: 90 });
    const fundos = simularUnidade({ predio: p, vizinhos, tipo: "apartamento", andar: 6, fachadaGraus: 270 });
    const aeroporto = frente.barulho.fontes.find((f) => f.id === "aeroporto")!;
    expect(aeroporto).toBeDefined();
    expect(aeroporto.deCima).toBe(true);
    expect(aeroporto.frase).toContain("o som vem de cima e chega a todas as fachadas");
    // As fontes do chão são no máximo 3; o aeroporto entra além delas.
    expect(frente.barulho.fontes.filter((f) => f.id !== "aeroporto").length).toBeLessThanOrEqual(3);
    const causa = frente.barulho.porCausa.find((c) => c.id === "aereo")!;
    expect(causa).toMatchObject({ rotulo: "Avião", nivel: "Presença próxima" });
    expect(frente.barulho.consequenciaPorFace).toContain("O avião passa por cima");
    expect(frente.barulho.consequenciaPorFace).not.toMatch(/\d+\s*dB/);
    // A estimativa do simulador é a mesma de estimarRuido, com o avião igual nas duas fachadas.
    const eFrente = estimado(frente.barulho.estimativa), eFundos = estimado(fundos.barulho.estimativa);
    expect(eFrente).toEqual(estimarRuido(p, { andar: 6, fachadaGraus: 90, janelaFechada: true }));
    expect(eFrente.partes.doAviao).toEqual(eFundos.partes.doAviao);
    expect(eFrente.partes.doAviao).not.toBeNull();
    expect(frente.barulho.decibeis).toMatch(/dB\(A\) de dia · ~\d+ à noite \(estimativa\)/);
    // Casa: térreo, e o avião continua lá.
    const casa = simularUnidade({ predio: p, vizinhos, tipo: "casa", andar: 9, fachadaGraus: null });
    expect(estimado(casa.barulho.estimativa).andar).toBe(0);
    expect(estimado(casa.barulho.estimativa).partes.doAviao).toEqual(eFrente.partes.doAviao);
  });
});

// Pendência 2 do HANDOFF (19/11/2026): fora do cone, além das cabeceiras, o avião cai com o afastamento ("uns 9 dB a
// menos 1 km para o lado", Mapa Sossego), sem degrau na borda; ao lado da pista não há número, e a tela e a ficha dizem
// que a nota é um piso.
describe("avião fora do cone de aproximação", () => {
  const base = baseDoAeroporto();
  /** Desloca um ponto em metros, perpendicular ao eixo da pista. */
  const deLado = (centro: readonly [number, number], m: number): [number, number] => {
    const [n, s] = [base.pista.cabeceiraNorte.lonLat, base.pista.cabeceiraSul.lonLat];
    const kx = 111320 * Math.cos((centro[1] * Math.PI) / 180), ky = 110574;
    const [ux, uy] = [(s[0] - n[0]) * kx, (s[1] - n[1]) * ky];
    const L = Math.hypot(ux, uy);
    return [centro[0] + ((-uy / L) * m) / kx, centro[1] + ((ux / L) * m) / ky];
  };
  const nivel = (c: readonly [number, number]) => {
    const a = aviaoNoPonto(c)!;
    return { cone: a.dentroDoCone, db: nivelDoAviao(a.alturaEstimadaM, a.afastamentoDoEixoM) };
  };

  it("prédio 64823-1080, logo fora do cone: entra com o avião, e atravessar a borda muda menos de 1 dB", () => {
    const p = predioDe("boa-viagem", "64823-1080");
    expect(relacaoComOAeroporto(p.centro)?.trajetoria).toBeNull();
    const r = estimado(estimarRuido(p));
    expect(r.partes.doAviao?.diaDb).toBeGreaterThan(65);
    expect(r.fontes.find((f) => f.tipo === "aviao")?.texto).toMatch(/para o lado da linha de pouso e decolagem: ~\d+ dB\(A\) de dia · ~\d+ à noite \(estimativa\)$/);
    // Varre 300 m de lado a lado, de 30 em 30 m: a borda fica no meio, e nenhum passo pula mais de 1 dB.
    const passos = Array.from({ length: 11 }, (_, i) => nivel(deLado(p.centro, -150 + 30 * i)));
    expect(passos.some((x) => x.cone) && passos.some((x) => !x.cone)).toBe(true);
    for (let i = 1; i < passos.length; i++) expect(Math.abs(passos[i]!.db - passos[i - 1]!.db)).toBeLessThan(1);
  });

  it("a 1 km para o lado da linha de pouso, ~9 dB a menos que no eixo, na mesma altura", () => {
    const p = predioDe("boa-viagem", "64823-1080");
    const a = aviaoNoPonto(p.centro)!;
    expect(nivelDoAviao(a.alturaEstimadaM, 0) - nivelDoAviao(a.alturaEstimadaM, 1000)).toBeCloseTo(9, 5);
  });

  it("todo prédio a até 1 km da pista tem o avião na conta ou o aviso de piso; ao lado da pista, nenhum número do aeroporto", () => {
    let perto = 0, aoLado = 0;
    for (const bairro of BAIRROS_HABILITADOS) {
      if (!arquivoDoRuido(bairro)) continue;
      for (const p of indiceDe(bairro)) {
        const rel = relacaoComOAeroporto(p.centro);
        if (!rel || rel.distanciaM > 1000) continue;
        perto++;
        const r = estimado(estimarRuido(p));
        expect(Boolean(r.partes.doAviao) || Boolean(r.pistaAoLado)).toBe(true);
        if (r.pistaAoLado && !aviaoNoPonto(p.centro)) {
          aoLado++;
          expect(r.partes.doAviao).toBeNull();
          expect(r.fontes.some((f) => f.tipo === "aviao")).toBe(false);
          expect(r.textos.aeroporto).toContain("leia a nota como piso");
          expect(r.textos.nota).toContain("É um piso: a pista do aeroporto ao lado não entra.");
          expect(r.textos.placar.subtitulo).toContain("piso, sem a pista ao lado");
          expect(r.textos.ficha.limite).toContain(r.textos.aeroporto!);
        }
      }
    }
    expect(perto).toBeGreaterThan(300);
    expect(aoLado).toBeGreaterThan(100);
  });

  it("longe da pista, sem aviso de piso", () => {
    const r = estimado(estimarRuido(DA_TORRE()));
    expect(r.pistaAoLado).toBeNull();
    expect(r.textos.aeroporto).toBeNull();
    expect(r.textos.placar.subtitulo).not.toContain("piso");
  });
});
