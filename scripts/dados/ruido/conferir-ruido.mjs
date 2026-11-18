// Conferência do ruído estimado antes de mostrar (seção 4.1 do pedido de unificação, 18/11/2026).
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/ruido/conferir-ruido.mjs [--saida <arquivo.json>]
//
// (a) compara, nos 6 bairros com todas as camadas, a mediana dos prédios do Vereda com o número que o Mapa Sossego
//     publica na página do bairro; (b) mostra três prédios (Golden Tower, um da Torre, um de Casa Forte), na rua e na
//     janela de frente e de fundos para a fonte que mais pesa. Usa a mesma leitura do app (src/dados/ruido/leitura.ts)
//     sobre a camada publicada e o mesmo cone do aeroporto. Não grava nada no app.
import { readFileSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";

registerHooks({
  resolve(especificador, contexto, proximo) {
    try {
      return proximo(especificador, contexto);
    } catch (e) {
      if (/^\.{1,2}\//.test(especificador) && !/\.[cm]?[jt]s$/.test(especificador)) return proximo(`${especificador}.ts`, contexto);
      throw e;
    }
  },
});
const { montarEstimativa } = await import("../../../src/dados/ruido/leitura.ts");
const { aoLadoDaPista, aviaoNoPonto, relacaoComOAeroporto, validarAeroporto } = await import("../../../src/dados/recife/aeroporto.ts");

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const ler = (c) => readFileSync(join(RAIZ, c), "utf8");
const gerado = ler("src/dados/recife/ruidoGerado.ts");
const versao = /VERSAO_DO_RUIDO = "([^"]+)"/.exec(gerado)[1];
const dirIndice = /INDICE_DO_RUIDO = "([^"]+)"/.exec(gerado)[1];
const viasDe = /"dadosDe": "([^"]+)"/.exec(gerado)[1];
const aeroporto = validarAeroporto(JSON.parse(ler("src/dados/recife/aeroporto.json")));
const datas = { viasDe, metodologiaLidaEm: "2026-11-18" };

/**
 * O que o Mapa Sossego publica em https://mapasossego.com.br/ruido/recife/<bairro>, lido em 18/11/2026: índice e
 * "~dB(A)" de dia e à noite, e as parcelas de "O que compõe o índice". `sha256` é o do HTML lido.
 */
const MAPA_SOSSEGO = {
  "boa-viagem": { dia: [54, 66], noite: [65, 61], transito: 65, aeroportos: 53, locais: 41, vizinhanca: 55, habPorHa: 262, sha256: "2d5bd00e14760ace74d058cf3251238bb06106eba0b842b9c95774160f725a81" },
  "casa-forte": { dia: [64, 62], noite: [82, 55], transito: 61, aeroportos: 42, locais: 38, vizinhanca: 48, habPorHa: 112, sha256: "dbfc7fd92cd1037a68a46beaf97ab297160b8e74431ecb78fd807c13d4cd8788" },
  gracas: { dia: [64, 62], noite: [82, 55], transito: 61, aeroportos: 40, locais: 39, vizinhanca: 50, habPorHa: 152, sha256: "1978d5fea5017eccd13c38bce8597a8e635d9a9a58b4b002b9eab1ac330e80f7" },
  espinheiro: { dia: [52, 66], noite: [70, 60], transito: 66, aeroportos: 38, locais: 38, vizinhanca: 51, habPorHa: 156, sha256: "21ae0d1ea1f22b9b7e850e8039b691c6fe2c526a068794846f77a455e0d3b202" },
  madalena: { dia: [50, 67], noite: [68, 60], transito: 67, aeroportos: 43, locais: 42, vizinhanca: 51, habPorHa: 168, sha256: "3fbbdb138cb1b7907f391fe958a06313542f667b96a674ffbd2606f42a28d005" },
  torre: { dia: [60, 63], noite: [79, 56], transito: 61, aeroportos: 42, locais: 38, vizinhanca: 52, habPorHa: 188, sha256: "2c569b18d6c06d549e92cbf8662dd2bbf45b920a0ac7595fecefbbec21fd0ec9" },
};
/** Os três prédios do aceite: [bairro, id no índice]. */
const PREDIOS = [["boa-viagem", "8001-216"], ["torre", "31950-280"], ["casa-forte", "19526-1070"]];

const um = (x) => Math.round(x * 10) / 10;
const quantil = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
const mediana = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const energia = (db) => 10 ** (db / 10);

function carregar(bairro) {
  const indice = JSON.parse(ler(`src/dados/recife/${dirIndice}/${bairro}.json`));
  const camada = JSON.parse(ler(`src/dados/recife/ruido/${versao}/${bairro}.json`));
  return { indice, camada };
}
function estimar(camada, predio, opcoes = {}) {
  const registro = camada.predios[predio.id];
  if (!registro) return null;
  return montarEstimativa({ registro, nomes: camada.nomes, aviao: aviaoNoPonto(predio.centro, aeroporto), pistaAoLado: aoLadoDaPista(predio.centro, aeroporto), anoConstrucao: predio.anoConstrucao ?? null, datas, opcoes });
}

// ——— (a) Bairros ————————————————————————————————————————————————————————————————————————————————————
const bairros = {};
for (const [bairro, ms] of Object.entries(MAPA_SOSSEGO)) {
  const { indice, camada } = carregar(bairro);
  const leituras = indice.edificios.map((p) => estimar(camada, p)).filter(Boolean);
  const dia = leituras.map((l) => l.naRua.diaDb), noite = leituras.map((l) => l.naRua.noiteDb);
  // O que faltaria somar para ficar igual ao método do site: a parcela de vizinhança que ele publica para o bairro.
  const comVizinhanca = (xs, queda) => mediana(xs.map((x) => 10 * Math.log10(energia(x) + energia(ms.vizinhanca - queda))));
  bairros[bairro] = {
    predios: indice.edificios.length, comLeitura: leituras.length,
    vereda: { diaMediana: um(mediana(dia)), diaP10: um(quantil(dia, 0.1)), diaP90: um(quantil(dia, 0.9)), noiteMediana: um(mediana(noite)), noiteP10: um(quantil(noite, 0.1)), noiteP90: um(quantil(noite, 0.9)), notaMediana: um(mediana(leituras.map((l) => l.notaDeSossego))) },
    mapaSossego: { diaIndice: ms.dia[0], diaDb: ms.dia[1], noiteIndice: ms.noite[0], noiteDb: ms.noite[1], transito: ms.transito, aeroportos: ms.aeroportos, locais: ms.locais, vizinhanca: ms.vizinhanca },
    diferenca: { dia: um(mediana(dia) - ms.dia[1]), noite: um(mediana(noite) - ms.noite[1]) },
    comAVizinhancaDoSite: { dia: um(comVizinhanca(dia, 0)), noite: um(comVizinhanca(noite, 3)), diferencaDia: um(comVizinhanca(dia, 0) - ms.dia[1]), diferencaNoite: um(comVizinhanca(noite, 3) - ms.noite[1]) },
    sobALinhaDePouso: indice.edificios.filter((p) => relacaoComOAeroporto(p.centro, aeroporto)?.trajetoria).length,
    dentroDaFaixa: Math.abs(mediana(dia) - ms.dia[1]) <= 5 && Math.abs(mediana(noite) - ms.noite[1]) <= 5,
  };
}

// ——— (b) Três prédios ————————————————————————————————————————————————————————————————————————————————
const predios = PREDIOS.map(([bairro, id]) => {
  const { indice, camada } = carregar(bairro);
  const p = indice.edificios.find((e) => e.id === id);
  if (!p) throw new Error(`Prédio ${id} não está no índice de ${bairro}.`);
  const rua = estimar(camada, p);
  const maisForte = rua.fontes.find((f) => f.rumoGraus !== null);
  const andar = Math.max(1, Math.round(((p.pavimentos ?? 8) - 1) / 2));
  const frente = estimar(camada, p, { andar, fachadaGraus: maisForte.rumoGraus, janelaFechada: true });
  const fundos = estimar(camada, p, { andar, fachadaGraus: (maisForte.rumoGraus + 180) % 360, janelaFechada: true });
  const curto = (l) => ({ dia: l.naJanela.diaDb, noite: l.naJanela.noiteDb, nota: l.notaDeSossego, quartoNoite: l.noQuarto?.noiteDb ?? null });
  return {
    bairro, id, nome: p.nome, endereco: `${p.logradouro}, ${p.numero}`, pavimentos: p.pavimentos, anoConstrucao: p.anoConstrucao,
    naRua: { dia: rua.naRua.diaDb, noite: rua.naRua.noiteDb, nota: rua.notaDeSossego, nivel: rua.nivelDeSossego },
    manchete: rua.textos.manchete, nbr: rua.textos.nbr,
    andarDaConferencia: andar, fachadaDeFrenteGraus: maisForte.rumoGraus,
    frente: curto(frente), fundos: curto(fundos), frenteMenosFundos: { dia: um(frente.naJanela.diaDb - fundos.naJanela.diaDb), noite: um(frente.naJanela.noiteDb - fundos.naJanela.noiteDb) },
    terreoContraTopo: (() => { const topo = estimar(camada, p, { andar: Math.max(1, (p.pavimentos ?? 8) - 1) }); return { terreoDia: rua.naRua.diaDb, topoDia: topo.naJanela.diaDb, andarDoTopo: topo.andar }; })(),
    fontes: rua.textos.fontes,
  };
});

// ——— Cidade inteira: cobertura e distribuição ———————————————————————————————————————————————————————————
const pub = ler("src/dados/recife/publicacaoGerada.ts");
const todos = [...pub.matchAll(/"([a-z-]+)": "recife\/indice-municipal\/[0-9a-f]+\/[a-z-]+\.json"/g)].map((m) => m[1]);
let total = 0, comLeitura = 0, sobLinha = 0, comAviao = 0, pistaAoLado = 0;
// Pendência 2 do HANDOFF (19/11/2026): os prédios a até 1 km da pista, com e sem avião na conta, e a palavra da nota.
const ate1km = { predios: 0, comAviao: 0, pistaAoLado: 0, semAviaoNemAviso: 0, tranquiloOuMuitoSemAviso: 0 };
const diaCidade = [], noiteCidade = [], notas = [];
for (const b of todos) {
  const { indice, camada } = carregar(b);
  for (const p of indice.edificios) {
    total++;
    const l = estimar(camada, p);
    if (!l) continue;
    comLeitura++;
    if (relacaoComOAeroporto(p.centro, aeroporto)?.trajetoria) sobLinha++;
    if (l.partes.doAviao) comAviao++;
    if (l.pistaAoLado) pistaAoLado++;
    const rel = relacaoComOAeroporto(p.centro, aeroporto);
    if (rel && rel.distanciaM <= 1000) {
      ate1km.predios++;
      if (l.partes.doAviao) ate1km.comAviao++;
      if (l.pistaAoLado) ate1km.pistaAoLado++;
      if (!l.partes.doAviao && !l.pistaAoLado) {
        ate1km.semAviaoNemAviso++;
        if (/tranquilo/i.test(l.nivelDeSossego)) ate1km.tranquiloOuMuitoSemAviso++;
      }
    }
    diaCidade.push(l.naRua.diaDb); noiteCidade.push(l.naRua.noiteDb); notas.push(l.notaDeSossego);
  }
}
const cidade = {
  bairros: todos.length, predios: total, comLeitura, sobALinhaDePouso: sobLinha, comAviaoNaConta: comAviao, pistaAoLadoSemNumero: pistaAoLado, ate1kmDaPista: ate1km,
  dia: { p10: quantil(diaCidade, 0.1), mediana: um(mediana(diaCidade)), p90: quantil(diaCidade, 0.9), minimo: Math.min(...diaCidade), maximo: Math.max(...diaCidade) },
  noite: { p10: quantil(noiteCidade, 0.1), mediana: um(mediana(noiteCidade)), p90: quantil(noiteCidade, 0.9), minimo: Math.min(...noiteCidade), maximo: Math.max(...noiteCidade) },
  nota: { p10: quantil(notas, 0.1), mediana: um(mediana(notas)), p90: quantil(notas, 0.9) },
};

const saida = { versao, viasDe, bairros, predios, cidade };
const arq = arg("--saida");
if (arq) writeFileSync(arq, JSON.stringify(saida, null, 1) + "\n");
console.log(JSON.stringify(saida, null, 1));
