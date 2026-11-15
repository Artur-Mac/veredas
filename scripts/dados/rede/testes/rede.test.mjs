// Testes offline da rede de caminhada (VE03). Node 22:
//   node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/rede/testes/rede.test.mjs
// Geografia SINTÉTICA perto de (−34,90; −8,05). Um codificador PBF mínimo gera o arquivo do teste do leitor.
import { Buffer } from "node:buffer";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { deflateSync } from "node:zlib";
import { lerPbf } from "../pbf.mjs";
import { indexarArestas, montarGrafo, noBloqueia, permissaoAPe, resumirRota, rota, rotaEntre, versaoDaRede, arestaMaisProxima } from "../grafo.mjs";
import { atravessaAgua, entradaDoPredio, frentesDoPredio, indexarAgua, indexarRuasOficiais, distanciaAoContorno } from "../frentes.mjs";

const LON0 = -34.9, LAT0 = -8.05;
const dx = (m) => m / 110222, dy = (m) => m / 110574; // metros → graus perto do Recife
const P = (xm, ym) => [LON0 + dx(xm), LAT0 + dy(ym)];
const sha = (t) => createHash("sha256").update(t).digest("hex");

// ——— Codificador PBF mínimo (só para o teste) ——————————————————————————————————————————————
function varint(n) {
  const out = [];
  while (n >= 128) { out.push((n % 128) | 128); n = Math.floor(n / 128); }
  out.push(n);
  return out;
}
const zz = (n) => (n >= 0 ? 2 * n : -2 * n - 1);
const campoV = (c, n) => [...varint(c * 8), ...varint(n)];
const campoB = (c, bytes) => [...varint(c * 8 + 2), ...varint(bytes.length), ...bytes];
const empacotado = (c, nums) => campoB(c, nums.flatMap(varint));
const texto = (s) => [...Buffer.from(s, "utf8")];
function blocoDoArquivo(tipo, carga, comprimir) {
  const blob = comprimir ? [...campoV(2, carga.length), ...campoB(3, [...deflateSync(Buffer.from(carga))])] : campoB(1, carga);
  const cab = [...campoB(1, texto(tipo)), ...campoV(3, blob.length)];
  const tam = Buffer.alloc(4);
  tam.writeUInt32BE(cab.length);
  return Buffer.concat([tam, Buffer.from(cab), Buffer.from(blob)]);
}
function pbfSintetico(nos, vias) {
  const strings = ["", "highway", "residential", "name", "Rua Sintética", "crossing", "zebra"];
  const ix = (s) => strings.indexOf(s);
  const delta = (arr) => arr.map((v, i) => v - (i ? arr[i - 1] : 0));
  const lat = nos.map((n) => Math.round((n.lat * 1e9) / 100)), lon = nos.map((n) => Math.round((n.lon * 1e9) / 100));
  const kv = nos.flatMap((n) => [...(n.tags ? Object.entries(n.tags).flatMap(([k, v]) => [ix(k), ix(v)]) : []), 0]);
  const denso = [
    ...empacotado(1, delta(nos.map((n) => n.id)).map(zz)),
    ...campoB(5, [...campoB(1, [1, 2, 3]), ...campoB(2, [9, 9])]), // denseinfo: precisa ser pulado inteiro
    ...empacotado(8, delta(lat).map(zz)),
    ...empacotado(9, delta(lon).map(zz)),
    ...empacotado(10, kv),
  ];
  const viasBytes = vias.flatMap((v) => campoB(3, [
    ...campoV(1, v.id),
    ...empacotado(2, Object.keys(v.tags).map(ix)),
    ...empacotado(3, Object.values(v.tags).map(ix)),
    ...campoB(4, [...campoV(1, 7)]), // info: pulado
    ...empacotado(8, delta(v.refs).map(zz)),
  ]));
  const bloco = [...campoB(1, strings.flatMap((s) => campoB(1, texto(s)))), ...campoB(2, campoB(2, denso)), ...campoB(2, viasBytes)];
  return Buffer.concat([blocoDoArquivo("OSMHeader", campoB(4, texto("OsmSchema-V0.6")), false), blocoDoArquivo("OSMData", bloco, true)]);
}

describe("leitor PBF", () => {
  it("lê nós densos (pulando denseinfo), tags de nó e vias com referências delta", () => {
    const dir = mkdtempSync(join(tmpdir(), "ve03-pbf-"));
    try {
      const nos = [{ id: 10, lon: -34.9, lat: -8.05 }, { id: 11, lon: -34.899, lat: -8.0501, tags: { highway: "crossing", crossing: "zebra" } }, { id: 15, lon: -34.898, lat: -8.0502 }];
      const arq = join(dir, "t.osm.pbf");
      writeFileSync(arq, pbfSintetico(nos, [{ id: 99, refs: [10, 11, 15], tags: { highway: "residential", name: "Rua Sintética" } }]));
      const lidos = [], vias = [];
      const c = lerPbf(arq, { aoNo: (id, lon, lat, tags) => lidos.push({ id, lon, lat, tags }), aoCaminho: (id, refs, tags) => vias.push({ id, refs, tags }) });
      assert.equal(c.nos, 3);
      assert.equal(c.vias, 1);
      assert.deepEqual(lidos.map((n) => n.id), [10, 11, 15]);
      for (const [i, n] of nos.entries()) {
        assert.ok(Math.abs(lidos[i].lon - n.lon) < 1e-7 && Math.abs(lidos[i].lat - n.lat) < 1e-7);
      }
      assert.deepEqual(lidos[1].tags, { highway: "crossing", crossing: "zebra" });
      assert.equal(lidos[0].tags, null);
      assert.deepEqual(vias[0], { id: 99, refs: [10, 11, 15], tags: { highway: "residential", name: "Rua Sintética" } });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ——— Regras a pé e grafo —————————————————————————————————————————————————————————————————

describe("permissão a pé e barreiras", () => {
  it("proíbe autoestrada, obra, foot=no e privado; foot=yes vence access=private; clientes é restrito", () => {
    assert.equal(permissaoAPe({ highway: "motorway" }), "nao");
    assert.equal(permissaoAPe({ highway: "construction" }), "nao");
    assert.equal(permissaoAPe({ highway: "primary", foot: "no" }), "nao");
    assert.equal(permissaoAPe({ highway: "service", access: "private" }), "nao");
    assert.equal(permissaoAPe({ highway: "service", access: "private", foot: "yes" }), "sim");
    assert.equal(permissaoAPe({ highway: "service", access: "customers" }), "restrito");
    assert.equal(permissaoAPe({ highway: "residential", oneway: "yes" }), "sim");
    assert.equal(permissaoAPe({ building: "yes" }), "nao");
  });
  it("portão privado e muro bloqueiam; portão com foot=yes não", () => {
    assert.equal(noBloqueia({ barrier: "gate", access: "private" }), true);
    assert.equal(noBloqueia({ barrier: "wall" }), true);
    assert.equal(noBloqueia({ barrier: "gate", access: "private", foot: "yes" }), false);
    assert.equal(noBloqueia({ barrier: "gate" }), false);
  });
});

/** Rede sintética: coordenadas em metros a partir da origem. */
function rede(pontos, vias, tagsDosNos = {}) {
  const coords = new Map(Object.entries(pontos).map(([id, [x, y]]) => [Number(id), P(x, y)]));
  return montarGrafo(vias.map((v) => ({ ...v, tags: v.tags })), coords, new Map(Object.entries(tagsDosNos).map(([k, v]) => [Number(k), v])));
}
const idx = (g, id) => g.indice.get(id);

describe("grafo e rotas", () => {
  const pontos = { 1: [0, 0], 2: [100, 0], 3: [200, 0], 4: [200, 30], 5: [100, 15], 6: [0, 60], 7: [100, 120], 8: [200, 60], 9: [150, -50], 10: [150, 50], 20: [500, 0], 21: [520, 0] };
  const vias = [
    { id: 1, nos: [1, 2, 3], tags: { highway: "residential", oneway: "yes" } },
    { id: 2, nos: [3, 4], tags: { highway: "footway" } },
    { id: 3, nos: [1, 5, 4], tags: { highway: "steps" } }, // atalho por escada
    { id: 4, nos: [1, 6, 7, 8, 4], tags: { highway: "residential" } }, // volta longa sem escada
    { id: 5, nos: [1, 4], tags: { highway: "service", access: "private" } }, // atalho privado
    { id: 6, nos: [9, 10], tags: { highway: "footway", bridge: "yes", layer: "1" } }, // viaduto sobre a via 1, sem nó comum
    { id: 7, nos: [20, 21], tags: { highway: "footway" } }, // componente desconectado
    { id: 8, nos: [2, 7], tags: { highway: "motorway" } },
  ];
  const g = rede(pontos, vias);

  it("via privada e autoestrada ficam fora; mão única não restringe a pé", () => {
    assert.equal(g.arestas.some((e) => e.via === 5 || e.via === 8), false);
    const ida = rota(g, idx(g, 1), idx(g, 3)), volta = rota(g, idx(g, 3), idx(g, 1));
    assert.ok(ida && volta && Math.abs(ida.metros - volta.metros) < 1e-6);
  });
  it("escada: rota padrão usa a escada; cenário sem escadas faz a volta longa", () => {
    const comEscada = resumirRota(g, rota(g, idx(g, 1), idx(g, 4)));
    const semEscada = resumirRota(g, rota(g, idx(g, 1), idx(g, 4), { evitarEscadas: true }));
    assert.ok(comEscada.escadasM > 0);
    assert.equal(semEscada.escadasM, 0);
    assert.ok(semEscada.metros > comEscada.metros);
  });
  it("viaduto sem nó comum não se liga à via de baixo; componente isolado não tem rota", () => {
    assert.notEqual(g.comp[idx(g, 9)], g.comp[idx(g, 1)]);
    assert.equal(rota(g, idx(g, 1), idx(g, 9)), null);
    assert.equal(rota(g, idx(g, 1), idx(g, 20)), null);
    assert.ok(g.tamanhos.length >= 3);
  });
  it("portão privado no meio da via corta a passagem; com foot=yes, passa", () => {
    const p = { 1: [0, 0], 2: [50, 0], 3: [100, 0], 4: [0, 80], 5: [100, 80] };
    const v = [{ id: 1, nos: [1, 2, 3], tags: { highway: "footway" } }, { id: 2, nos: [1, 4, 5, 3], tags: { highway: "footway" } }];
    const fechado = rede(p, v, { 2: { barrier: "gate", access: "private" } });
    assert.ok(rota(fechado, idx(fechado, 1), idx(fechado, 3)).metros > 200);
    const aberto = rede(p, v, { 2: { barrier: "gate", access: "private", foot: "yes" } });
    assert.ok(rota(aberto, idx(aberto, 1), idx(aberto, 3)).metros < 101);
  });
  it("pista dupla: atravessar exige a faixa (footway=crossing) e conta via principal", () => {
    const p = { 1: [0, 0], 2: [0, 200], 3: [20, 0], 4: [20, 200], 5: [0, 100], 6: [20, 100], 7: [-30, 100], 8: [50, 100] };
    const v = [
      { id: 1, nos: [1, 5, 2], tags: { highway: "primary", oneway: "yes" } },
      { id: 2, nos: [4, 6, 3], tags: { highway: "primary", oneway: "yes" } },
      { id: 3, nos: [5, 6], tags: { highway: "footway", footway: "crossing" } },
      { id: 4, nos: [7, 5], tags: { highway: "footway" } },
      { id: 5, nos: [6, 8], tags: { highway: "footway" } },
    ];
    const gg = rede(p, v);
    const r = resumirRota(gg, rota(gg, idx(gg, 7), idx(gg, 8)));
    assert.ok(r.travessiasMarcadas >= 1);
    assert.equal(r.viaPrincipalM, 0);
    const pelaPista = resumirRota(gg, rota(gg, idx(gg, 1), idx(gg, 2)));
    assert.ok(pelaPista.viaPrincipalM > 190);
  });
  it("cliente/restrito só entra quando pedido", () => {
    const p = { 1: [0, 0], 2: [100, 0], 3: [0, 100], 4: [100, 100] };
    const v = [{ id: 1, nos: [1, 2], tags: { highway: "service", access: "customers" } }, { id: 2, nos: [1, 3, 4, 2], tags: { highway: "footway" } }];
    const gg = rede(p, v);
    assert.ok(rota(gg, idx(gg, 1), idx(gg, 2)).metros > 250);
    assert.ok(rota(gg, idx(gg, 1), idx(gg, 2), { evitarRestritas: false }).metros < 101);
  });
  it("rota a partir de um ponto sobre a aresta soma as pontas", () => {
    const grade = indexarArestas(g);
    // Abaixo da via 1 (y = −5): a escada (que passa em y ≈ 7,5 em x = 50) fica mais longe que a rua.
    const [lon, lat] = P(50, -5);
    const a = arestaMaisProxima(g, grade, lon, lat, 30);
    assert.ok(a && a.metros < 6);
    const r = rotaEntre(g, a.pontas, [{ no: idx(g, 3), m: 0 }]);
    assert.ok(Math.abs(r.metros - 150) < 2, `esperava ~150 m, deu ${r.metros}`);
  });
  it("versão da rede: igual para entradas iguais; muda com extrato, regras ou correções", () => {
    const base = { shaDoExtrato: "a", regras: "1", frentes: "1", correcoes: [] };
    assert.equal(versaoDaRede(sha, base), versaoDaRede(sha, { ...base }));
    assert.notEqual(versaoDaRede(sha, base), versaoDaRede(sha, { ...base, shaDoExtrato: "b" }));
    assert.notEqual(versaoDaRede(sha, base), versaoDaRede(sha, { ...base, regras: "2" }));
    assert.notEqual(versaoDaRede(sha, base), versaoDaRede(sha, { ...base, correcoes: [{ tipo: "via_bloqueada", via: 1 }] }));
  });
});

// ——— Frentes: esquina, canal, correção ——————————————————————————————————————————————————————

describe("frentes e entradas", () => {
  // Ruas oficiais: 100 (horizontal em y=0), 200 (vertical em x=100), 300 (horizontal em y=130).
  const linha = (codigo, a, b) => ({ type: "Feature", properties: { CLOGRACODI: codigo }, geometry: { type: "LineString", coordinates: [P(...a), P(...b)] } });
  const trechos = { features: [linha(100, [-50, 0], [250, 0]), linha(200, [100, -50], [100, 250]), linha(300, [-50, 130], [250, 130])] };
  // Canal entre y=40 e y=60.
  const agua = { features: [{ properties: { NMRECHIDRIC: "Canal Sintético" }, geometry: { type: "Polygon", coordinates: [[P(-60, 40), P(260, 40), P(260, 60), P(-60, 60), P(-60, 40)]] } }] };
  const gradeRuas = indexarRuasOficiais(trechos);
  const gradeAgua = indexarAgua(agua);
  // Rede a pé sobre as ruas oficiais (vias OSM 1 = rua 100, 2 = rua 200, 3 = rua 300), ligadas pela 2.
  const pontos = { 1: [-50, 0], 2: [100, 0], 3: [250, 0], 4: [100, 250], 5: [-50, 130], 6: [100, 130], 7: [250, 130] };
  const g = rede(pontos, [
    { id: 1, nos: [1, 2, 3], tags: { highway: "residential", name: "Rua Cem" } },
    { id: 2, nos: [2, 6, 4], tags: { highway: "residential", name: "Rua Duzentos", bridge: "no" } },
    { id: 3, nos: [5, 6, 7], tags: { highway: "residential", name: "Rua Trezentos" } },
  ]);
  const linhagem = new Map([[1, 100], [2, 200], [3, 300]]);
  const contexto = { g, gradeArestas: indexarArestas(g), linhagem, gradeRuas, gradeAgua };
  const quadrado = (x0, y0, x1, y1) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];

  it("esquina: a frente do código cadastral é a principal e a outra rua fica como frente adicional", () => {
    const predio = { id: "100-1", centro: P(85, 15), poligono: quadrado(75, 6, 94, 24), codigoDaRua: 100 };
    const r = entradaDoPredio(predio, contexto);
    assert.equal(r.principal.codigo, 100);
    assert.deepEqual(r.adicionais.map((a) => a.codigo), [200]);
    assert.equal(r.classe, "forte");
    assert.equal(r.ligacao.metodo, "via_com_mesmo_codigo");
  });
  it("canal: a rua do outro lado da água é recusada, nunca escolhida; a ligação não cruza o canal", () => {
    const predio = { id: "100-2", centro: P(20, 75), poligono: quadrado(10, 65, 30, 85), codigoDaRua: 100 };
    const fr = frentesDoPredio(predio, gradeRuas, gradeAgua, { raioM: 90 });
    assert.ok(fr.find((f) => f.codigo === 100).recusa.startsWith("atravessa_agua"));
    const r = entradaDoPredio(predio, contexto);
    assert.equal(r.principal, null);
    assert.equal(r.classe, "fraca");
    assert.ok(atravessaAgua(gradeAgua, P(20, 65), P(20, 0)));
  });
  it("correção revisada substitui o candidato, guarda a origem e não toca o centroide", () => {
    const predio = { id: "100-2", centro: P(20, 75), poligono: quadrado(10, 65, 30, 85), codigoDaRua: 100 };
    const r = entradaDoPredio(predio, contexto, { tipo: "entrada", predio: "100-2", ponto: P(20, 120), revisor: "teste", data: "2026-11-14" });
    assert.equal(r.classe, "revisada");
    assert.equal(r.origem, "correcao_revisada");
    assert.deepEqual(predio.centro, P(20, 75));
    assert.ok(r.ligacao && r.ligacao.metros < 15);
  });
  it("distância ao contorno: 0 dentro, metros fora", () => {
    const pol = quadrado(0, 0, 10, 10);
    assert.equal(distanciaAoContorno(P(5, 5), pol), 0);
    assert.ok(Math.abs(distanciaAoContorno(P(15, 5), pol) - 5) < 0.2);
  });
});
