// Confere se uma atualização mexeu nas bases de avaliação congeladas (15/11/2026): G-BUILDING contra o índice ativo,
// G-POI contra a publicação "essenciais" ativa (e a anterior) e G-RAIN contra a camada de chuva ativa (os 4 registros
// do H1). Não altera nada; grava um relatório JSON.
//
//   node scripts/dados/conferir-baselines.mjs --saida <relatorio.json>
import { gunzipSync } from "node:zlib";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { registrosQueSustentam } from "./chuva/revisao-h1.mjs";

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const ler = (p) => JSON.parse(readFileSync(join(RAIZ, p), "utf8"));

function indiceAtivo() {
  const pub = readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8");
  const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
  const porId = new Map();
  for (const [, , c] of pub.matchAll(/"([a-z-]+)": "(recife\/indice-municipal\/[0-9a-f]+\/[a-z-]+\.json)"/g)) {
    for (const e of ler(join("src/dados", c)).edificios) porId.set(e.id, e);
  }
  return { dir, porId };
}

function gBuilding() {
  const g = ler("docs/aplicacao/evaluation-sets/g-building.json");
  const { dir, porId } = indiceAtivo();
  const campos = ["dsqfl", "unidades", "pavimentos", "nome", "centro"];
  const ausentes = [], mudados = [];
  for (const b of g.buildings) {
    const e = porId.get(b.id);
    if (!e) { ausentes.push({ id: b.id, area: b.area }); continue; }
    const diff = campos.filter((c) => b[c] !== undefined && JSON.stringify(b[c]) !== JSON.stringify(e[c]));
    if (diff.length) mudados.push({ id: b.id, area: b.area, campos: Object.fromEntries(diff.map((c) => [c, { antes: b[c], agora: e[c] }])) });
  }
  return { indiceDoConjunto: g.index_directory, indiceAtivo: dir, casos: g.buildings.length, ausentes, mudados, igual: ausentes.length === 0 && mudados.length === 0 };
}

function locaisDaPublicacao(pub, versao) {
  const p = join(RAIZ, ".cache/publicacoes", pub, "versoes", versao, "locais.json.gz");
  return existsSync(p) ? JSON.parse(gunzipSync(readFileSync(p)).toString("utf8")) : null;
}

function gPoi() {
  const g = ler("docs/aplicacao/evaluation-sets/g-poi.json");
  const atual = ler(".cache/publicacoes/essenciais/atual.json");
  const agora = locaisDaPublicacao("essenciais", atual.versao) ?? [];
  const antes = atual.anterior ? locaisDaPublicacao("essenciais", atual.anterior) : null;
  const ids = (lista) => new Set(lista.flatMap((l) => [l.id, ...(l.idsFundidos ?? [])]));
  const iAgora = ids(agora), iAntes = antes ? ids(antes) : null;
  const ausentesAgora = g.itens.filter((x) => !iAgora.has(x.local)).map((x) => ({ local: x.local, area: x.area, motivo: x.motivo }));
  const ausentesAntes = iAntes ? g.itens.filter((x) => !iAntes.has(x.local)).map((x) => x.local) : null;
  return { publicacaoAtiva: atual.versao, anterior: atual.anterior ?? null, casos: g.itens.length, ausentesAgora, ausentesNaAnterior: ausentesAntes,
    igualAAnterior: ausentesAntes ? JSON.stringify(ausentesAntes) === JSON.stringify(ausentesAgora.map((x) => x.local)) : null };
}

function gRain() {
  const ts = readFileSync(join(RAIZ, "src/dados/recife/chuvaGerado.ts"), "utf8");
  const pacotes = Object.fromEntries([...ts.matchAll(/"([a-z-]+)": "(recife\/chuva\/[0-9a-f]+\/[a-z-]+\.json)"/g)].map((m) => [m[1], ler(join("src/dados", m[2]))]));
  const regs = registrosQueSustentam(pacotes);
  const topo = regs.slice(0, 4).map((r) => ({ data: r.obs.data, rua: r.obs.rua, bairro: r.obs.bairro, predios: r.predios.size }));
  // Referência medida no VE17 (docs/aplicacao/execucoes/VE17/evaluation.md): 147, 25, 25 e 1 prédios; 173 distintos.
  const referencia = [147, 25, 25, 1];
  const distintos = new Set(regs.flatMap((r) => [...r.predios])).size;
  return { topo4: topo, prediosDistintos: distintos, referenciaVE17: { topo4: referencia, distintos: 173 },
    igual: JSON.stringify(topo.map((t) => t.predios)) === JSON.stringify(referencia) && distintos === 173 };
}

const saida = arg("--saida");
const relatorio = { conferidoEm: new Date().toISOString(), gBuilding: gBuilding(), gPoi: gPoi(), gRain: gRain() };
if (saida) writeFileSync(saida, JSON.stringify(relatorio, null, 1) + "\n");
console.log(JSON.stringify({
  gBuilding: { ausentes: relatorio.gBuilding.ausentes.length, mudados: relatorio.gBuilding.mudados.length, igual: relatorio.gBuilding.igual },
  gPoi: { ausentesAgora: relatorio.gPoi.ausentesAgora.length, igualAAnterior: relatorio.gPoi.igualAAnterior },
  gRain: { igual: relatorio.gRain.igual, distintos: relatorio.gRain.prediosDistintos },
}, null, 1));
