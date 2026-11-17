// VE05 — G-TRANSIT: 20 itinerários programados do piloto (dia útil, sábado, domingo, feriado, volta tarde, depois da
// meia-noite, sentidos opostos, feed vencido, janela vazia), com ids originais do GTFS para conferência independente
// (ve05_verificar_itinerarios.py) e uma planilha para revisão humana.
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/aplicacao/execucoes/VE05/scripts/ve05-gtransit.mjs
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { ativosEm, avaliarJanela, melhorJornada, pontasEstimadas, prepararGrade, raptor, servicosAtivos, somarDias } from "../../../../../src/dados/transito/roteador.ts";

const ts = readFileSync("src/dados/recife/transitoGerado.ts", "utf8");
const v = /VERSAO_DO_TRANSITO = "([^"]+)"/.exec(ts)[1];
const g = prepararGrade(JSON.parse(readFileSync(`src/dados/recife/transito/${v}/grade.json`, "utf8")));
const pub = JSON.parse(readFileSync(".cache/publicacoes/transito/atual.json", "utf8"));
const aud = JSON.parse(gunzipSync(readFileSync(`.cache/publicacoes/transito/versoes/${pub.versao}/auditoria.json.gz`)));
const centroides = JSON.parse(readFileSync("src/dados/recife/referencias-publicas.json", "utf8")).centroidesBairros;
const acessos = Object.fromEntries(["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"].map((a) => [a, JSON.parse(readFileSync(`src/dados/recife/transito/${v}/${a}.json`, "utf8")).predios]));

// Um prédio por área, escolhido pela ordem do SHA-256 do id (sem olhar o resultado).
const h = (s) => createHash("sha256").update(`VE05-gtransit|${s}`).digest("hex");
const predio = Object.fromEntries(Object.entries(acessos).map(([a, ps]) => [a, Object.keys(ps).sort((x, y) => h(x).localeCompare(h(y)))[0]]));
const casa = (a) => { const l = acessos[a][predio[a]]; const o = []; for (let i = 0; i < l.length; i += 2) o.push({ parada: l[i], seg: Math.round(l[i + 1] / 1.2) }); return o; };
const bairro = (b) => pontasEstimadas(g, centroides[b][0], centroides[b][1], 800);
const H = (hh, mm = 0) => hh * 3600 + mm * 60;

const casos = [
  ["GT01", "dia útil, ida", "boa-viagem", "recife", "2026-11-17", H(7, 30), "ida"],
  ["GT02", "dia útil, volta (sentido oposto do GT01)", "boa-viagem", "recife", "2026-11-17", H(18), "volta"],
  ["GT03", "dia útil, ida", "casa-forte", "boa-vista", "2026-11-17", H(7, 30), "ida"],
  ["GT04", "dia útil, volta (sentido oposto do GT03)", "casa-forte", "boa-vista", "2026-11-17", H(18), "volta"],
  ["GT05", "dia útil, ida com possível baldeação", "gracas", "cidade-universitaria", "2026-11-17", H(7, 30), "ida"],
  ["GT06", "dia útil, ida com possível baldeação", "espinheiro", "imbiribeira", "2026-11-17", H(7, 30), "ida"],
  ["GT07", "dia útil, ida", "madalena", "recife", "2026-11-17", H(7, 30), "ida"],
  ["GT08", "sábado", "boa-viagem", "cidade-universitaria", "2026-11-21", H(9, 30), "ida"],
  ["GT09", "sábado", "casa-forte", "recife", "2026-11-21", H(9, 30), "ida"],
  ["GT10", "domingo", "madalena", "boa-viagem", "2026-11-22", H(9, 30), "ida"],
  ["GT11", "domingo", "gracas", "recife", "2026-11-22", H(9, 30), "ida"],
  ["GT12", "feriado (02/11, segunda: serviço de domingo por exceção)", "boa-viagem", "recife", "2026-11-02", H(7, 30), "ida"],
  ["GT13", "segunda comum (controle do GT12)", "boa-viagem", "recife", "2026-11-09", H(7, 30), "ida"],
  ["GT14", "volta tarde", "boa-viagem", "recife", "2026-11-17", H(23, 30), "volta"],
  ["GT15", "depois da meia-noite, pedido como 24:20 do dia de serviço 17/11", "boa-viagem", "recife", "2026-11-17", H(24, 20), "volta"],
  ["GT16", "o mesmo instante pedido como 00:20 de 18/11 (usa viagens 24:xx do dia de serviço anterior)", "boa-viagem", "recife", "2026-11-18", H(0, 20), "volta"],
  ["GT17", "dia útil, volta com possível baldeação", "espinheiro", "cidade-universitaria", "2026-11-17", H(18), "volta"],
  ["GT18", "sábado, volta", "gracas", "boa-viagem", "2026-11-21", H(13), "volta"],
  ["GT19", "janela sem serviço útil (03:00, limite de 1 h)", "casa-forte", "cidade-universitaria", "2026-11-17", H(3), "ida", { horizonte: 3600 }],
  ["GT20", "data fora da validade do feed (fim 26/10/2027)", "boa-viagem", "recife", "2027-11-03", H(7, 30), "ida"],
];

const hhmm = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
const saida = [];
for (const [id, cenario, area, destinoBairro, data, t, sentido, opc = {}] of casos) {
  const [origens, destino] = sentido === "ida" ? [casa(area), bairro(destinoBairro)] : [bairro(destinoBairro), casa(area)];
  const caso = { id, cenario, area, predio: predio[area], destinoBairro, centroide: centroides[destinoBairro], sentido, data, saida: hhmm(t), saidaSeg: t,
    servicosAtivos: servicosAtivos(g, data).reduce((s, x) => s + x, 0) };
  const janela = avaliarJanela(g, origens, destino, data, t, t, { passo: 300, ...opc });
  if (janela.estado === "fora_da_validade") { saida.push({ ...caso, resultado: "fora_da_validade" }); continue; }
  const j = melhorJornada(g, raptor(g, origens, t, ativosEm(g, data), opc, destino), destino, origens);
  if (!j) {
    saida.push({ ...caso, resultado: "sem_jornada", horizonteSeg: opc.horizonte ?? 10800,
      paradasDeOrigem: origens.map((o) => ({ stop_id: aud.paradas[o.parada], seg: o.seg })) });
    continue;
  }
  saida.push({
    ...caso, resultado: "jornada", duracaoMin: Math.round(j.duracao / 60), viagens: j.viagens, chegada: hhmm(j.chegada),
    pernas: j.pernas.map((p) => p.tipo === "a_pe"
      ? { tipo: "a_pe", de: p.de === null ? null : aud.paradas[p.de], para: p.para === null ? null : aud.paradas[p.para], seg: p.seg }
      : { tipo: "viagem", trip_id: aud.viagens[p.rota][p.viagem], route_id: aud.linhas[p.linha], linha: g.bruta.linhas.c[p.linha], sentido: p.sentido,
          diaDeServico: p.dia ? somarDias(data, p.dia / 86400) : data, de: aud.paradas[p.de], deNome: g.bruta.paradas.n[p.de], para: aud.paradas[p.para], paraNome: g.bruta.paradas.n[p.para],
          partida: p.partida - p.dia, chegada: p.chegada - p.dia, partidaTexto: hhmm(p.partida - p.dia), chegadaTexto: hhmm(p.chegada - p.dia) }),
  });
}

const registro = {
  conjunto: "G-TRANSIT", versao: 1, criadoEm: "2026-11-14", epoca: "VE05", grade: v, feed: g.bruta.feed,
  selecao: "um prédio com ligação forte por área do piloto, pela ordem do SHA-256 do id; destinos = centroides de bairro usados pelo app (referencias-publicas.json); 20 cenários fixados antes de rodar",
  revisao: "nao_revisado",
  casos: saida,
};
writeFileSync("docs/aplicacao/evaluation-sets/g-transit.json", JSON.stringify(registro, null, 1) + "\n");
const csv = [["caso", "cenario", "data", "saida", "origem", "destino", "resultado", "duracao_min", "itinerario", "REVISAO_confere(sim/nao)", "REVISAO_nota"]];
for (const c of saida) {
  const it = (c.pernas ?? []).map((p) => p.tipo === "a_pe" ? `a pé ${Math.round(p.seg / 60)} min` : `linha ${p.linha} (${p.sentido}) ${p.deNome} ${p.partidaTexto} → ${p.paraNome} ${p.chegadaTexto}`).join(" | ");
  const [o, d] = c.sentido === "ida" ? [`prédio ${c.predio} (${c.area})`, `centro de ${c.destinoBairro}`] : [`centro de ${c.destinoBairro}`, `prédio ${c.predio} (${c.area})`];
  csv.push([c.id, c.cenario, c.data, c.saida, o, d, c.resultado, c.duracaoMin ?? "", it, "", ""]);
}
writeFileSync("docs/aplicacao/evaluation-sets/g-transit-revisao.csv", csv.map((l) => l.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n");
console.log(saida.map((c) => `${c.id} ${c.resultado} ${c.duracaoMin ?? ""} ${c.viagens ?? ""} ${(c.pernas ?? []).filter((p) => p.tipo === "viagem").map((p) => `${p.linha}@${p.partidaTexto}`).join(">")}`).join("\n"));
