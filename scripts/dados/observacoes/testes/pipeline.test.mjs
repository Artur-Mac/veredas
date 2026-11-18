// Testes offline do pipeline de observações (VE02). Rodar com Node 22:
//   node --test --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/observacoes/testes/
// Servidor HTTP local para os cenários de coleta; pasta temporária para publicação. Nada sai da máquina.
import { Buffer } from "node:buffer";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { classificarColeta } from "../../../../src/dados/observacao.ts";
import { coletarDatastore, lerPaginaCkan } from "../coleta.mjs";
import { interpretarLinha, normalizarDefesaCivil } from "../defesaCivil.mjs";
import { escolherExtrato, lerListagem, lerPaginaDaRegiao } from "../geofabrik.mjs";
import { resumirFeed } from "../gtfs.mjs";
import { caixasDosBairros, classificarCoordenada, consultaOverpass, ENVELOPE_DO_RECIFE, resumirCategorias, seletorOverpass, validarCaixa } from "../osm.mjs";
import { ativar, lerManifesto, ponteiroAtual, prepararVersao, restosTemporarios, reverter, verificarVersao } from "../publicar.mjs";

const RAIZ = join(import.meta.dirname, "../../../..");

// ——— Coleta CKAN contra um servidor local ————————————————————————————————————————————————

const registros = (de, ate) => Array.from({ length: ate - de }, (_, i) => ({ _id: de + i + 1, Bairro: "Madalena" }));
const pagina = (total, recs) => JSON.stringify({ success: true, result: { total, records: recs } });
const CENARIOS = {
  normal: (off) => [200, pagina(3, registros(off, Math.min(off + 2, 3)))],
  html200: () => [200, "<!doctype html><html><body>Serviço indisponível</body></html>"],
  falhaCkan: () => [200, JSON.stringify({ success: false, error: { message: "Not found" } })],
  proibido: () => [403, "Forbidden"],
  limite: () => [429, "Too Many Requests", { "Retry-After": "0" }],
  vazio: () => [200, pagina(0, [])],
  repetida: () => [200, pagina(4, registros(0, 2))],
  faltando: (off) => [200, pagina(5, off === 0 ? registros(0, 2) : [])],
  curta: (off) => [200, pagina(5, off === 0 ? registros(0, 2) : off === 2 ? registros(2, 3) : registros(4, 5))],
};
let servidor, base, contagem429 = 0;
before(async () => {
  servidor = createServer((req, res) => {
    const u = new URL(req.url, "http://x");
    ultimaUrl = req.url;
    const cenario = u.searchParams.get("resource_id");
    const off = Number(u.searchParams.get("offset"));
    if (cenario === "limiteUmaVez") {
      contagem429 += 1;
      const [st, corpo, cab] = contagem429 === 1 ? CENARIOS.limite() : CENARIOS.normal(off);
      res.writeHead(st, { "content-type": "application/json", ...(cab ?? {}) });
      return res.end(corpo);
    }
    const [st, corpo, cab] = CENARIOS[cenario](off);
    res.writeHead(st, { "content-type": st === 200 && corpo.startsWith("<") ? "text/html" : "application/json", ...(cab ?? {}) });
    res.end(corpo);
  });
  await new Promise((r) => servidor.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => servidor.close());

let ultimaUrl = "";
const coletar = (recurso, extra = {}) => coletarDatastore({ base, recurso, campos: ["Bairro"], limite: 2, orcamento: 10, opcoesHttp: { retries: 1 }, ...extra });
const estado = (r) => classificarColeta({ erro: r.erro, declarados: r.declarados, lidos: r.registros.length, aceitos: r.registros.length, paginasFaltando: r.paginasFaltando });

describe("coleta CKAN: HTTP 200 não é sucesso", () => {
  it("duas páginas completas → valida, com hash do bruto", async () => {
    const r = await coletar("normal");
    assert.equal(r.registros.length, 3);
    assert.deepEqual(estado(r), { estado: "valida", motivo: null });
    assert.match(r.sha256, /^[0-9a-f]{64}$/);
  });
  it("200 com HTML de erro → falhou (corpo_nao_e_dados), não vazio", async () => {
    assert.deepEqual(estado(await coletar("html200")), { estado: "falhou", motivo: "corpo_nao_e_dados" });
  });
  it("200 com JSON de falha do CKAN → falhou", async () => {
    assert.deepEqual(estado(await coletar("falhaCkan")), { estado: "falhou", motivo: "corpo_nao_e_dados" });
  });
  it("403 → falhou (acesso_negado), nunca conjunto vazio", async () => {
    assert.deepEqual(estado(await coletar("proibido")), { estado: "falhou", motivo: "acesso_negado" });
  });
  it("429 persistente → falhou (limite_de_taxa); 429 uma vez com Retry-After → nova tentativa e valida", async () => {
    assert.deepEqual(estado(await coletar("limite")), { estado: "falhou", motivo: "limite_de_taxa" });
    const r = await coletar("limiteUmaVez");
    assert.deepEqual(estado(r), { estado: "valida", motivo: null });
  });
  it("total 0 legítimo → vazia", async () => {
    assert.deepEqual(estado(await coletar("vazio")), { estado: "vazia", motivo: null });
  });
  it("página repetida → parcial (pagina_repetida), sem registros duplicados", async () => {
    const r = await coletar("repetida");
    assert.equal(r.erro, "pagina_repetida");
    assert.equal(r.registros.length, 2);
    assert.equal(estado(r).estado, "parcial");
  });
  it("próxima página vazia antes do total → parcial (pagina_faltando)", async () => {
    const r = await coletar("faltando");
    assert.deepEqual(estado(r), { estado: "parcial", motivo: "pagina_faltando" });
  });
  it("página curta no meio → parcial", async () => {
    assert.equal(estado(await coletar("curta")).estado, "parcial");
  });
  it("orçamento de requisições esgotado → parcial (orcamento_esgotado)", async () => {
    const r = await coletar("normal", { orcamento: 1 });
    assert.equal(r.requisicoes, 1);
    assert.deepEqual(estado(r), { estado: "parcial", motivo: "orcamento_esgotado" });
  });
  it("pede só a lista branca de campos; sem lista, recusa começar", async () => {
    await coletar("normal");
    assert.match(decodeURIComponent(ultimaUrl), /fields=_id,Bairro$/);
    await assert.rejects(() => coletarDatastore({ base, recurso: "normal" }), /lista branca/);
  });
  it("lerPaginaCkan recusa login, HTML e JSON sem total", () => {
    assert.equal(lerPaginaCkan("<html>login</html>"), null);
    assert.equal(lerPaginaCkan(JSON.stringify({ success: true, result: { records: [] } })), null);
  });
});

// ——— Defesa Civil: layout por linha, quarentena, determinismo ————————————————————————————————

const alinhada = { _id: 1, Regional: "Norte", Ano: 2021, "Mês": "Abril", Data: "2021-04-22T00:00:00", Ocorrencia: "Imóveis Alagados", Solicitacao: "Vistoria", Endereco: "Rua das Graças, ?_$.", Bairro: "Graças" };
const deslocada = { _id: 2, Regional: 2022, Ano: "JUNHO", "MÃªs": "2022-06-08T00:00:00", Data: "Imveis Alagados", Ocorrencia: "Vistoria em Imveis", Solicitacao: "\"Rua Real da Torre", Endereco: " {})!\"", Bairro: "Madalena" };
const marcoSemCedilha = { _id: 3, Regional: "2020", Ano: "Maro", "Mês": "2020-03-02", Data: null, Ocorrencia: "Monitoramento", Solicitacao: "Rua Santa Maria Gorete", Endereco: "$!>=", Bairro: "Vasco da Gama" };
const desconhecida = { _id: 4, Regional: "x", Ano: 2021, "Mês": "2021-05-05", Data: "texto", Ocorrencia: "", Solicitacao: "", Endereco: "Rua A, 1", Bairro: "Torre" };
const dataInvalida = { _id: 5, Regional: "Planície", Ano: 2021, "Mês": "Outubro", Data: "0202-02-10T00:00:00", Ocorrencia: "x", Solicitacao: "", Endereco: "Largo dos Coelhos, `=-[", Bairro: "Coelhos" };
const soMascara = { _id: 6, Regional: "Sul", Ano: 2023, "Mês": "Maio", Data: "2023-05-01T00:00:00", Ocorrencia: "", Solicitacao: "", Endereco: "{})!", Bairro: "Pina" };

describe("Defesa Civil: colunas deslocadas e datas", () => {
  it("detecta alinhada, deslocada e março sem cedilha pelo conteúdo", () => {
    assert.equal(interpretarLinha(alinhada).layout, "alinhado");
    assert.equal(interpretarLinha(deslocada).layout, "deslocado");
    assert.equal(interpretarLinha(deslocada).categoriaBruta, "Imveis Alagados");
    assert.equal(interpretarLinha(deslocada).rua, "Rua Real da Torre");
    assert.equal(interpretarLinha(marcoSemCedilha).layout, "deslocado");
    assert.equal(interpretarLinha(marcoSemCedilha).data, "2020-03-02");
  });
  it("layout desconhecido, data inválida e rua só com máscara vão para a quarentena", () => {
    assert.equal(interpretarLinha(desconhecida).quarentena, "layout_desconhecido");
    assert.equal(interpretarLinha(dataInvalida).quarentena, "layout_desconhecido");
    assert.equal(interpretarLinha(soMascara).quarentena, "sem_endereco");
  });
  it("data administrativa nunca vira tempo do evento; número mascarado não aparece", () => {
    const n = normalizarDefesaCivil([alinhada, deslocada, marcoSemCedilha, desconhecida, soMascara], { fonte: "defesa_civil_teste", snapshotSha256: "a".repeat(64), recuperadoEm: "2026-11-14T12:00:00Z" });
    assert.equal(n.observacoes.length, 3);
    assert.equal(n.quarentena.length, 2);
    for (const o of n.observacoes) {
      assert.equal(o.tempos.evento, null);
      assert.equal(o.tempos.precisaoDoEvento, "nenhuma");
      assert.match(o.tempos.administrativo, /^\d{4}-\d{2}-\d{2}$/);
    }
    const texto = JSON.stringify(n);
    for (const m of ["?_$.", "{})!", "$!>="]) assert.ok(!texto.includes(m), `máscara ${m} vazou`);
    assert.equal(n.observacoes[0].valor, "alagamento");
    assert.equal(n.observacoes[2].valor, null);
    assert.equal(n.observacoes[2].estadoDoValor, "desconhecido");
  });
  it("mesma entrada e versão → mesma saída, byte a byte", () => {
    const op = { fonte: "defesa_civil_teste", snapshotSha256: "b".repeat(64), recuperadoEm: "2026-11-14T12:00:00Z" };
    assert.equal(JSON.stringify(normalizarDefesaCivil([alinhada, deslocada], op)), JSON.stringify(normalizarDefesaCivil([alinhada, deslocada], op)));
  });
  it("tudo em quarentena → falhou, nunca cobertura completa", () => {
    const n = normalizarDefesaCivil([desconhecida, soMascara], { fonte: "defesa_civil_teste", snapshotSha256: null, recuperadoEm: "2026-11-14T12:00:00Z" });
    assert.deepEqual(classificarColeta({ erro: null, declarados: 2, lidos: 2, aceitos: n.observacoes.length, paginasFaltando: 0 }), { estado: "falhou", motivo: "nenhum_registro_utilizavel" });
  });
});

// ——— OSM / coordenadas ————————————————————————————————————————————————————————————————————

describe("OSM: caixas, seletores, coordenadas e categorias", () => {
  const geo = JSON.parse(readFileSync(join(RAIZ, "docs/dados/raw/cadastro-municipal/bairros-do-recife.geojson"), "utf8"));
  it("caixas dos cinco bairros vêm dos polígonos oficiais e ficam no Recife (não perto de −8,8)", () => {
    const c = caixasDosBairros(geo, ["Boa Viagem", "Casa Forte", "Graças", "Espinheiro", "Madalena"]);
    for (const [nome, x] of Object.entries(c)) {
      assert.ok(x.s > -8.2 && x.n < -7.9, `${nome}: ${JSON.stringify(x)}`);
      assert.ok(x.w > -35.05 && x.e < -34.85, `${nome}: ${JSON.stringify(x)}`);
    }
  });
  it("caixa antiga do coletor 10, lat/lon trocados e UTM são recusados", () => {
    assert.throws(() => validarCaixa({ s: -8.89, w: -34.92, n: -8.84, e: -34.883 }), /fora do Recife/);
    assert.throws(() => validarCaixa({ s: -34.92, w: -8.06, n: -34.9, e: -8.04 }), /fora do Recife/);
    assert.throws(() => validarCaixa({ s: 9105000, w: 285000, n: 9106000, e: 286000 }), /fora do Recife/);
    assert.throws(() => validarCaixa({ s: -8.04, w: -34.9, n: -8.05, e: -34.89 }), /invertida/);
  });
  it("seletor Overpass válido, com valores exatos e escapados", () => {
    const caixa = { s: -8.05, w: -34.91, n: -8.04, e: -34.9 };
    assert.equal(seletorOverpass("amenity", ["pharmacy"], caixa), 'nwr["amenity"~"^(pharmacy)$"](-8.05,-34.91,-8.04,-34.9);');
    assert.equal(seletorOverpass("shop", ["a.b", 'c"d'], caixa), 'nwr["shop"~"^(a\\.b|c\\"d)$"](-8.05,-34.91,-8.04,-34.9);');
    const q = consultaOverpass({ f: { key: "amenity", values: ["pharmacy"] }, s: { key: "shop", values: ["supermarket"] } }, caixa);
    assert.match(q, /^\[out:json\]\[timeout:60\];\(nwr\["amenity"~[^;]+;nwr\["shop"~[^;]+;\);out center tags;$/);
    assert.throws(() => seletorOverpass("amenity", [], caixa));
  });
  it("coordenadas: ok, UTM (CRS errado), lat/lon trocados, fora da região", () => {
    assert.equal(classificarCoordenada(-34.9, -8.05), "ok");
    assert.equal(classificarCoordenada(285000, 9105000), "provavel_crs_errado");
    assert.equal(classificarCoordenada(-8.05, -34.9), "lat_lon_trocados");
    assert.equal(classificarCoordenada(-34.9, -8.8), "coordenada_fora_da_regiao");
    assert.equal(ENVELOPE_DO_RECIFE.s < -8.05, true);
  });
  it("todas as categorias com erro → falhou; algumas → parcial; nenhuma com elemento → vazia", () => {
    assert.equal(resumirCategorias({ a: { total: -1, erro: "x" }, b: { total: -1, erro: "y" } }).estado, "falhou");
    assert.equal(resumirCategorias({ a: { total: 3 }, b: { total: -1, erro: "y" } }).estado, "parcial");
    assert.equal(resumirCategorias({ a: { total: 0 }, b: { total: 0 } }).estado, "vazia");
    assert.equal(resumirCategorias({ a: { total: 2 } }).estado, "valida");
  });
  it("os coletores 10 e 12 usam o construtor testado, sem caixas perto de −8,8 nem todosPois fora de escopo", () => {
    const c10 = readFileSync(join(RAIZ, "ignorar/dados-pipeline-2026-11-11/infra/scripts/10-osm-pois.mjs"), "utf8");
    const c12 = readFileSync(join(RAIZ, "ignorar/dados-pipeline-2026-11-11/infra/scripts/12-amenidades.mjs"), "utf8");
    assert.ok(!/-8\.8\d{3}/.test(c10));
    assert.ok(c10.includes("seletorOverpass(") && c12.includes("seletorOverpass("));
    assert.ok(!/\$\{key\}\["\$\{v\}"\]/.test(c12), "seletor malformado ainda presente");
    const decl = c12.indexOf("const todosPois");
    assert.ok(decl > 0 && decl < c12.indexOf("for (const b of BAIRROS)"), "todosPois tem de ser declarado antes do laço");
  });
});

// ——— Fonte HTML: Geofabrik ————————————————————————————————————————————————————————————————

describe("Geofabrik: listagem HTML", () => {
  const html = `<html><body><a href="nordeste-260101.osm.pbf">x</a><a href="nordeste-260101.osm.pbf.md5">m</a>
    <a href="nordeste-261112.osm.pbf">x</a><a href="nordeste-261113.osm.pbf">x</a><a href="nordeste-261113.osm.pbf.md5">m</a>
    <a href="nordeste-261114.osm.pbf">x</a><a href="nordeste-261114.osm.pbf.md5">m</a></body></html>`;
  it("lista datados, exige .md5 e respeita a data limite", () => {
    const l = lerListagem(html, "nordeste");
    assert.equal(l.length, 4);
    assert.equal(escolherExtrato(l, "2026-11-13").arquivo, "nordeste-261113.osm.pbf");
    assert.equal(escolherExtrato(l, "2026-11-12").arquivo, "nordeste-260101.osm.pbf");
  });
  it("página de erro (texto, sem HTML de listagem) → null, não lista vazia", () => {
    assert.equal(lerListagem("Service Unavailable", "nordeste"), null);
    assert.deepEqual(lerListagem("<html><body><a href='x'>x</a></body></html>", "nordeste"), []);
  });
  it("página da região: data dos dados e tamanho do -latest", () => {
    const r = lerPaginaDaRegiao("<p><a>nordeste-latest.osm.pbf</a>, suitable for ... contains all OSM data up to 2026-11-13T21:22:20Z. File size: 424&nbsp;MB. </p>");
    assert.deepEqual(r, { dadosAte: "2026-11-13T21:22:20Z", tamanhoDoLatestMB: 424 });
  });
});

// ——— GTFS ————————————————————————————————————————————————————————————————————————————————

describe("GTFS: snapshot do feed", { skip: !existsSync(join(RAIZ, "docs/dados/raw/transporte/gtfs.zip")) }, () => {
  it("versão, contagens e recusa do deslocamento de −0,75", () => {
    const r = resumirFeed(readFileSync(join(RAIZ, "docs/dados/raw/transporte/gtfs.zip")));
    assert.equal(r.versao, "v2026.10.26");
    assert.ok(r.contagens.paradasNoRecife > 2000);
    assert.equal(r.checagens.find((c) => c.nome === "deslocamento_de_-0,75_rejeitado").ok, true);
  });
});

// ——— Publicação: ativação atômica e recuperação ————————————————————————————————————————————

describe("publicação: versões imutáveis e ponteiro atômico", () => {
  let raiz;
  const fonte = (estado = "valida") => ({ fonte: "f", sha256: "c".repeat(64), estado, analisador: "x@1", recuperadoEm: "2026-11-14T12:00:00Z" });
  const dados = (conteudos, extra = {}) => ({
    particoes: conteudos.map((c, i) => ({ arquivo: `p${i}.ndjson`, conteudo: Buffer.from(c), registros: c.split("\n").filter(Boolean).length })),
    fontes: [fonte()], derivacoes: [{ nome: "t", versao: "1" }],
    cobertura: { denominador: "linhas", total: 10, porChave: { "ano:2024": 10 } },
    validacao: { quarentena: 0, motivos: {}, verificacoes: [] }, criadoEm: "2026-11-14T12:00:00Z", ...extra,
  });
  before(() => { raiz = mkdtempSync(join(tmpdir(), "ve02-pub-")); });
  after(() => rmSync(raiz, { recursive: true, force: true }));

  it("prepara, confere e ativa; reexecução com o mesmo conteúdo é idempotente", () => {
    const m = prepararVersao(raiz, "teste", dados(["a\n", "b\n"]));
    assert.equal(ativar(raiz, "teste", m.versao, { agora: "2026-11-14T12:00:00Z" }).versao, m.versao);
    assert.equal(prepararVersao(raiz, "teste", dados(["a\n", "b\n"])).versao, m.versao);
  });
  it("escrita interrompida: nenhuma versão nova, ponteiro intacto, pasta temporária removida", () => {
    const antes = ponteiroAtual(raiz, "teste");
    assert.throws(() => prepararVersao(raiz, "teste", dados(["x\n", "y\n"]), { aoGravar: (a) => { if (a === "p0.ndjson") throw new Error("queda de energia"); } }), /queda/);
    assert.deepEqual(ponteiroAtual(raiz, "teste"), antes);
    assert.deepEqual(restosTemporarios(raiz, "teste"), []);
  });
  it("resto temporário de um processo morto nunca é lido como versão", () => {
    mkdirSync(join(raiz, "teste", "versoes", ".deadbeefdeadbeef.123.tmp"));
    assert.equal(restosTemporarios(raiz, "teste").length, 1);
    assert.throws(() => ativar(raiz, "teste", "deadbeefdeadbeef"));
  });
  it("hash errado: ativação recusada, versão anterior continua ativa", () => {
    const antes = ponteiroAtual(raiz, "teste");
    const m = prepararVersao(raiz, "teste", dados(["c\n", "d\n"]));
    writeFileSync(join(raiz, "teste", "versoes", m.versao, "p0.ndjson"), "c\nadulterado\n");
    assert.ok(verificarVersao(raiz, "teste", m.versao).problemas.length > 0);
    assert.throws(() => ativar(raiz, "teste", m.versao), /não confere/);
    assert.deepEqual(ponteiroAtual(raiz, "teste"), antes);
  });
  it("versão parcial exige motivo explícito; queda de cobertura acima de 20% é recusada", () => {
    const parcial = prepararVersao(raiz, "teste", dados(["e\n"], { fontes: [fonte("parcial")] }));
    assert.equal(lerManifesto(raiz, "teste", parcial.versao).estado, "parcial");
    assert.throws(() => ativar(raiz, "teste", parcial.versao), /parcial/);
    const menor = prepararVersao(raiz, "teste", dados(["f\n"], { cobertura: { denominador: "linhas", total: 7, porChave: { "ano:2024": 7 } } }));
    assert.throws(() => ativar(raiz, "teste", menor.versao), /Cobertura caiu/);
    assert.equal(ativar(raiz, "teste", menor.versao, { quedaMaxima: 0.5 }).versao, menor.versao);
  });
  it("todas as fontes falharam: publicação bloqueada; reverter volta à versão anterior conferida", () => {
    assert.throws(() => prepararVersao(raiz, "teste", dados(["g\n"], { fontes: [fonte("falhou")] })), /bloqueada/);
    const atual = ponteiroAtual(raiz, "teste");
    const voltou = reverter(raiz, "teste", { agora: "2026-11-14T13:00:00Z" });
    assert.equal(voltou.versao, atual.anterior);
    assert.equal(voltou.revertidaDe, atual.versao);
  });
});
