// VE05.01 — compactação do feed: horários ≥ 24h, dwell, bandeiras de embarque, exceções e descartes com motivo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { compactarFeed, segundosGtfs, tabelaGtfs } from "../grade.mjs";
import { prepararGrade, servicosAtivos } from "../../../../src/dados/transito/roteador.ts";

const FEED = {
  "feed_info.txt": "feed_publisher_name,feed_version,feed_start_date,feed_end_date\nTeste,v1,20260101,20271231\n",
  "agency.txt": "agency_id,agency_name,agency_timezone\nA,Agência,America/Recife\n",
  "routes.txt": "route_id,agency_id,route_short_name,route_long_name,route_type\nR1,A,001,\"Centro, via Norte\",3\nR2,A,002,Sul,3\n",
  "calendar.txt": "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\nDUT,1,1,1,1,1,0,0,20260101,20271231\nDOM,0,0,0,0,0,0,1,20260101,20271231\n",
  "calendar_dates.txt": "service_id,date,exception_type\nDUT,20261102,2\nDOM,20261102,1\nEXTRA,20261225,1\n",
  "stops.txt": "stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station\nT,Terminal,-8.05,-34.9,1,\nS1,Plataforma 1,-8.05,-34.9,0,T\nS2,010203,-8.06,-34.91,0,\nS3,Ponto 3,-8.07,-34.92,0,\nSX,Sem coordenada,,,0,\n",
  "trips.txt": "route_id,service_id,trip_id,direction_id\nR1,DUT,t1,0\nR1,DUT,t2,0\nR1,DUT,t3,0\nR2,DOM,t4,1\nR2,DUT,t5,0\nR2,DUT,t6,0\n",
  "stop_times.txt": [
    "trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type,drop_off_type",
    // t1 e t2: mesmo padrão e mesmo perfil (FIFO); t3: mesmo padrão, perfil diferente, passa da meia-noite.
    "t1,07:00:00,07:00:00,S1,1,0,1", "t1,07:10:00,07:10:00,S2,2,0,0", "t1,07:20:00,07:20:00,S3,3,1,0",
    "t2,07:30:00,07:30:00,S1,1,0,1", "t2,07:40:00,07:40:00,S2,2,0,0", "t2,07:50:00,07:50:00,S3,3,1,0",
    "t3,24:50:00,24:50:00,S1,1,0,1", "t3,25:05:00,25:05:00,S2,2,0,0", "t3,25:20:00,25:20:00,S3,3,1,0",
    // t4: dwell na parada do meio; sequência fora de ordem no arquivo.
    "t4,09:10:00,09:12:00,S2,2,0,0", "t4,09:00:00,09:00:00,S3,1,0,0", "t4,09:20:00,09:20:00,S1,3,0,0",
    // t5: horário faltando (não é interpolado); t6: tempo voltando atrás.
    "t5,08:00:00,08:00:00,S1,1,0,0", "t5,,,S2,2,0,0", "t5,08:20:00,08:20:00,S3,3,0,0",
    "t6,08:00:00,08:00:00,S1,1,0,0", "t6,07:50:00,07:50:00,S2,2,0,0",
  ].join("\n") + "\n",
};
const ler = (n) => FEED[n] ?? null;

test("segundos GTFS aceitam horários depois de 24h e recusam lixo", () => {
  assert.equal(segundosGtfs("25:07:30"), 90450);
  assert.equal(segundosGtfs("7:00:00"), 25200);
  assert.equal(segundosGtfs(""), null);
  assert.equal(segundosGtfs("07:61:00"), null);
});

test("CSV com aspas e vírgula dentro do campo", () => {
  assert.equal(tabelaGtfs(FEED["routes.txt"])[0].route_long_name, "Centro, via Norte");
});

test("compactação: padrões, perfis, dwell, bandeiras e descartes com motivo", () => {
  const r = compactarFeed(ler);
  assert.deepEqual(r.descartes, { semServico: 0, semViagem: 0, paradaDesconhecida: 0, horarioFaltando: 1, tempoVoltando: 1, curta: 0 });
  assert.equal(r.grade.padroes.length, 2);
  assert.equal(r.grade.rotas.length, 3); // R1 perfil 10 min (t1,t2), R1 perfil 15 min (t3), R2 com dwell (t4)
  assert.equal(r.grade.paradas.n.length, 3, "estação-pai e parada sem coordenada ficam fora");
  const r1 = r.grade.padroes.find((p) => p.l === 0);
  assert.deepEqual(r1.f, [2, 0, 1], "sem desembarque na 1ª, sem embarque na última");
  const rapido = r.grade.rotas.find((x) => x.h.length === 2);
  assert.deepEqual(rapido.h, [25200, 1800]);
  const noturna = r.grade.rotas.find((x) => x.h[0] === 24 * 3600 + 50 * 60);
  assert.ok(noturna, "a viagem das 24:50 fica com o horário original do dia de serviço");
  const dwell = r.grade.rotas.find((x) => x.d === 1);
  assert.deepEqual(dwell.t, [0, 0, 600, 120, 480, 0]);
  assert.deepEqual(r.auditoria.viagens.flat().sort(), ["t1", "t2", "t3", "t4"]);
});

test("exceções: serviço só de calendar_dates entra; feriado troca DUT por DOM no aparelho", () => {
  const r = compactarFeed(ler);
  assert.deepEqual(r.grade.servicos.id, ["DUT", "DOM", "EXTRA"]);
  const g = prepararGrade({ ...r.grade, versao: "t", feed: { ...r.grade.feed, sha256: "0" }, baldeacoes: [], caminhada: { velocidadeMps: 1.2, fatorDeDesvio: 1.2 } });
  assert.deepEqual([...servicosAtivos(g, "2026-11-02")], [0, 1, 0]);
  assert.deepEqual([...servicosAtivos(g, "2026-11-03")], [1, 0, 0]);
  assert.deepEqual([...servicosAtivos(g, "2026-12-25")], [1, 0, 1]);
  // Tempos reconstruídos do perfil com dwell: chegada 09:10, partida 09:12 na parada do meio.
  const rota = g.rotas.find((x) => x.chegada[1] !== x.partida[1]);
  assert.deepEqual([rota.chegada[1], rota.partida[1], rota.chegada[2]], [600, 720, 1200]);
});

test("nome de parada pode ser trocado (código → rua) sem mudar o id", () => {
  const r = compactarFeed(ler, { nomeDaParada: (s) => (/^\d+$/.test(s.stop_name) ? "Ponto na Rua Teste" : s.stop_name) });
  assert.ok(r.grade.paradas.n.includes("Ponto na Rua Teste"));
  assert.ok(r.auditoria.paradas.includes("S2"));
});
