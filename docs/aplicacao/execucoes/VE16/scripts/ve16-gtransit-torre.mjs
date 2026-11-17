// VE16 — G-TRANSIT-TORRE: conjunto reservado da área de expansão. Mesma regra do G-TRANSIT (VE05): prédios com ligação
// forte pela ordem do SHA-256 do id, destinos = centroides de bairro do app, cenários fixados antes de rodar. Conferido
// pelo verificador independente do VE05 (Python, sem código compartilhado com o roteador).
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/aplicacao/execucoes/VE16/scripts/ve16-gtransit-torre.mjs
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { gravarFolha } from "../../../../../scripts/dados/folhas.mjs";
import { ativosEm, avaliarJanela, melhorJornada, pontasEstimadas, prepararGrade, raptor, servicosAtivos, somarDias } from "../../../../../src/dados/transito/roteador.ts";

const ts = readFileSync("src/dados/recife/transitoGerado.ts", "utf8");
const v = /VERSAO_DO_TRANSITO = "([^"]+)"/.exec(ts)[1];
const g = prepararGrade(JSON.parse(readFileSync(`src/dados/recife/transito/${v}/grade.json`, "utf8")));
const pub = JSON.parse(readFileSync(".cache/publicacoes/transito/atual.json", "utf8"));
const aud = JSON.parse(gunzipSync(readFileSync(`.cache/publicacoes/transito/versoes/${pub.versao}/auditoria.json.gz`)));
const centroides = JSON.parse(readFileSync("src/dados/recife/referencias-publicas.json", "utf8")).centroidesBairros;
const acessos = Object.fromEntries(["torre"].map((a) => [a, JSON.parse(readFileSync(`src/dados/recife/transito/${v}/${a}.json`, "utf8")).predios]));

// Dois prédios da Torre, escolhidos pela ordem do SHA-256 do id (sem olhar o resultado).
const h = (s) => createHash("sha256").update(`VE16-gtransit-torre|${s}`).digest("hex");
const ordem = Object.keys(acessos.torre).filter((id) => acessos.torre[id].length).sort((x, y) => h(x).localeCompare(h(y)));
const predio = { torre: ordem[0], torre2: ordem[1] };
acessos.torre2 = acessos.torre;
const casa = (a) => { const l = acessos[a][predio[a]]; const o = []; for (let i = 0; i < l.length; i += 2) o.push({ parada: l[i], seg: Math.round(l[i + 1] / 1.2) }); return o; };
const bairro = (b) => pontasEstimadas(g, centroides[b][0], centroides[b][1], 800);
const H = (hh, mm = 0) => hh * 3600 + mm * 60;

const casos = [
  ["GTT01", "dia útil, ida", "torre", "recife", "2026-11-17", H(7, 30), "ida"],
  ["GTT02", "dia útil, volta (sentido oposto do GTT01)", "torre", "recife", "2026-11-17", H(18), "volta"],
  ["GTT03", "dia útil, ida com possível baldeação", "torre", "boa-viagem", "2026-11-17", H(7, 30), "ida"],
  ["GTT04", "dia útil, ida", "torre", "boa-vista", "2026-11-17", H(7, 30), "ida"],
  ["GTT05", "sábado", "torre", "recife", "2026-11-21", H(9, 30), "ida"],
  ["GTT06", "domingo", "torre", "boa-viagem", "2026-11-22", H(9, 30), "ida"],
  ["GTT07", "feriado (02/11, segunda: serviço de domingo por exceção)", "torre", "recife", "2026-11-02", H(7, 30), "ida"],
  ["GTT08", "volta tarde", "torre", "recife", "2026-11-17", H(23, 30), "volta"],
  ["GTT09", "depois da meia-noite, pedido como 24:20 do dia de serviço 17/11", "torre", "recife", "2026-11-17", H(24, 20), "volta"],
  ["GTT10", "segundo prédio, dia útil, ida", "torre2", "recife", "2026-11-17", H(7, 30), "ida"],
  ["GTT11", "segundo prédio, dia útil, volta com possível baldeação", "torre2", "boa-viagem", "2026-11-17", H(18), "volta"],
  ["GTT12", "segundo prédio, dia útil, ida", "torre2", "cidade-universitaria", "2026-11-17", H(7, 30), "ida"],
];

const hhmm = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
const saida = [];
for (const [id, cenario, area, destinoBairro, data, t, sentido, opc = {}] of casos) {
  const [origens, destino] = sentido === "ida" ? [casa(area), bairro(destinoBairro)] : [bairro(destinoBairro), casa(area)];
  const caso = { id, cenario, area: "torre", predio: predio[area], destinoBairro, centroide: centroides[destinoBairro], sentido, data, saida: hhmm(t), saidaSeg: t,
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
  conjunto: "G-TRANSIT-TORRE", versao: 1, criadoEm: "2026-11-15", epoca: "VE16", grade: v, feed: g.bruta.feed,
  selecao: "conjunto reservado da área de expansão (Torre): dois prédios com acesso a pé publicado, pela ordem do SHA-256 do id; destinos = centroides de bairro do app; 12 cenários fixados antes de rodar; nada foi ajustado com estes casos",
  revisao: "nao_revisado",
  casos: saida,
};
writeFileSync("docs/aplicacao/evaluation-sets/g-transit-torre.json", JSON.stringify(registro, null, 1) + "\n");
const csv = [["caso", "cenario", "data", "saida", "origem", "destino", "resultado", "duracao_min", "itinerario", "REVISAO_confere(sim/nao)", "REVISAO_nota"]];
for (const c of saida) {
  const it = (c.pernas ?? []).map((p) => p.tipo === "a_pe" ? `a pé ${Math.round(p.seg / 60)} min` : `linha ${p.linha} (${p.sentido}) ${p.deNome} ${p.partidaTexto} → ${p.paraNome} ${p.chegadaTexto}`).join(" | ");
  const [o, d] = c.sentido === "ida" ? [`prédio ${c.predio} (${c.area})`, `centro de ${c.destinoBairro}`] : [`centro de ${c.destinoBairro}`, `prédio ${c.predio} (${c.area})`];
  csv.push([c.id, c.cenario, c.data, c.saida, o, d, c.resultado, c.duracaoMin ?? "", it, "", ""]);
}
gravarFolha("docs/aplicacao/evaluation-sets/g-transit-torre-revisao.csv", csv.map((l) => l.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n") + "\n");
console.log(saida.map((c) => `${c.id} ${c.resultado} ${c.duracaoMin ?? ""} ${c.viagens ?? ""} ${(c.pernas ?? []).filter((p) => p.tipo === "viagem").map((p) => `${p.linha}@${p.partidaTexto}`).join(">")}`).join("\n"));
