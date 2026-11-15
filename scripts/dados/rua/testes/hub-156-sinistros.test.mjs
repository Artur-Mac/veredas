// 15/11/2026 — leitura local do hub, janela e dedupe da Central 156, decimais com vírgula da CTTU e estado da licença.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { abrirHub, converter, lerCsvTexto, COLUNAS_PROIBIDAS_DO_HUB } from "../../hub.mjs";
import { estadoDaLicenca } from "../../licenca.mjs";
import { RECURSO_156_PARCIAL, lerSinistro, numeroDecimal, selecionarPedidos156 } from "../nucleo.mjs";

const pedido = (data, extra = {}) => ({
  GRUPOSERVICO_DESCRICAO: "DRENAGEM", SERVICO_DESCRICAO: "DESOBSTRUCAO DE GALERIA", LOGRADOURO: "AV   Conselheiro Aguiar", NUMERO: "100",
  BAIRRO: "Boa Viagem", DATA_DEMANDA: `${data}T00:00:00`, SITUACAO: "PREPARACAO", DATA_ULT_SITUACAO: `${data}T00:00:00`, latitude: null, longitude: null, ...extra,
});

test("156: janela estrita de 12 meses que termina no pedido mais recente publicado", () => {
  const a2026 = { id: "80c5b3cd-d4f7-466e-9031-e636ef56dd99", registros: [pedido("2009-05-19"), pedido("2026-06-19"), pedido("2025-06-19"), pedido("2025-06-20")] };
  const r = selecionarPedidos156([a2026], "2026-11-15");
  assert.equal(r.fim, "2026-06-19");
  assert.equal(r.inicio, "2025-06-20");
  assert.deepEqual([...r.linhas.values()].map((l) => l.data).sort(), ["2025-06-20", "2026-06-19"]);
  assert.equal(r.vias.get("antes da janela"), 2);
});

test("156: nunca passa da data da geração; categoria fora (animal morto) não puxa o fim da janela", () => {
  const outro = pedido("2026-07-01", { GRUPOSERVICO_DESCRICAO: "LIMPEZA URBANA", SERVICO_DESCRICAO: "REMOCAO DE ANIMAIS MORTOS PEQUENOS" });
  const r = selecionarPedidos156([{ id: "x", registros: [pedido("2026-01-30"), pedido("2026-12-01"), outro] }], "2026-11-15");
  assert.equal(r.fim, "2026-01-30");
  assert.equal(r.vias.get("depois da janela"), 1);
});

test("156: o mesmo pedido nos arquivos de 2025 e 2026 conta uma vez, com a situação mais recente", () => {
  const de2025 = pedido("2025-10-01", { SITUACAO: "PREPARACAO", DATA_ULT_SITUACAO: "2025-10-01T00:00:00" });
  const de2026 = pedido("2025-10-01", { SITUACAO: "ATENDIDA", DATA_ULT_SITUACAO: "2026-02-03T00:00:00", LOGRADOURO: "AV Conselheiro  Aguiar" });
  const r = selecionarPedidos156([
    { id: "80c5b3cd-d4f7-466e-9031-e636ef56dd99", registros: [de2026, pedido("2026-06-19", { NUMERO: "9" })] },
    { id: "e40fc8b9-49b7-4f08-8b9f-60ba6ed35519", registros: [de2025] },
  ], "2026-11-15");
  const doDia = [...r.linhas.values()].filter((l) => l.data === "2025-10-01");
  assert.equal(doDia.length, 1);
  assert.equal(doDia[0].r.SITUACAO, "ATENDIDA");
  assert.equal(r.vias.get("repetido entre arquivos"), 1);
});

test("156: repetido no mesmo arquivo conta uma vez e prefere a linha com coordenada no empate", () => {
  const sem = pedido("2026-03-03"), com = pedido("2026-03-03", { latitude: -8.1, longitude: -34.9 });
  const r = selecionarPedidos156([{ id: "x", registros: [sem, com] }], "2026-11-15");
  assert.equal(r.linhas.size, 1);
  assert.equal([...r.linhas.values()][0].r.latitude, -8.1);
  assert.equal(r.vias.get("repetido no mesmo arquivo"), 1);
});

test("156: a cópia parcial de 2025 (06872af2) nunca é somada", () => {
  assert.throws(() => selecionarPedidos156([{ id: RECURSO_156_PARCIAL, registros: [] }], "2026-11-15"), /parcial/);
});

test("CTTU: decimais com vírgula viram número ('1,0' → 1) e o sinistro sem número nem cruzamento fica sem posição", () => {
  assert.equal(numeroDecimal("1,0"), 1);
  assert.equal(numeroDecimal("0,0"), 0);
  assert.equal(numeroDecimal("174,0"), 174);
  assert.equal(numeroDecimal(""), null);
  const s = lerSinistro({ data: "2024-01-01T00:00:00", natureza: "COM VÍTIMA", bairro: "VASCO DA GAMA", endereco: "AV NORTE", numero: "", detalhe_endereco_acidente: "", tipo: "COLISÃO LATERAL", pedestre: "0,0", vitimas: "1,0", vitimasfatais: "0,0" });
  assert.equal(s.comVitima, true);
  assert.equal(s.atropelamento, false);
  assert.equal(s.numero, null);
  assert.equal(s.cruzamento, null);
  const atropelamento = lerSinistro({ data: "2023-05-02", natureza: "SEM VÍTIMA", endereco: "RUA X", numero: "12", detalhe_endereco_acidente: "", tipo: "", pedestre: "2,0", vitimas: "0,0", vitimasfatais: "0,0" });
  assert.equal(atropelamento.atropelamento, true);
  assert.equal(atropelamento.comVitima, false);
  assert.equal(lerSinistro({ data: "", natureza: "COM VÍTIMA" }), null);
});

test("hub: CSV com aspas, BOM e separador ponto e vírgula", () => {
  assert.deepEqual(lerCsvTexto('﻿a;b\r\n"292972,0";"diz ""oi"""\n', ";"), [["a", "b"], ["292972,0", 'diz "oi"']]);
});

test("hub: tipos do datastore (inteiro, número, data) e vazio", () => {
  assert.equal(converter("233", "int", "t"), 233);
  assert.equal(converter("", "int", "t"), null);
  assert.equal(converter("-8.037377", "num", "t"), -8.037377);
  assert.equal(converter("2026-06-19", "data", "t"), "2026-06-19T00:00:00");
  assert.equal(converter("476,98", undefined, "t"), "476,98");
  assert.throws(() => converter("233A", "int", "t"), /inteiro/);
});

function hubDeTeste(conteudo, { sha } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), "hub-"));
  mkdirSync(join(raiz, "docs/aplicacao"), { recursive: true });
  mkdirSync(join(raiz, ".cache/dados-recife/hub-teste"), { recursive: true });
  const arquivo = ".cache/dados-recife/hub-teste/9a847338-0000.csv";
  writeFileSync(join(raiz, arquivo), conteudo);
  const real = createHash("sha256").update(conteudo).digest("hex");
  writeFileSync(join(raiz, "docs/aplicacao/manifesto-extracao-hub-teste.json"), JSON.stringify([
    { resource_id: "9a847338-0000", arquivo, sha256: sha ?? real, bytes: Buffer.byteLength(conteudo), registros: 2, delimitador: ";", estado: "baixado" },
  ]));
  return abrirHub("teste", raiz);
}
const IPTU = "Número do contribuinte;logradouro;numero;bairro;CPF/CNPJ mascarado do contribuinte;latitude\n123;RUA A;10;Aflitos;***;-8.03\n456;RUA B;;Torre;***;\n";

test("hub: lista branca, filtro por igualdade e tipos; nenhuma coluna pessoal sai", () => {
  const hub = hubDeTeste(IPTU);
  const r = hub.lerTabela({ recurso: "9a847338-0000", fields: ["logradouro", "numero", "latitude"], filters: { bairro: "Aflitos" }, rotulo: "IPTU" });
  assert.deepEqual(r.registros, [{ logradouro: "RUA A", numero: 10, latitude: -8.03 }]);
  assert.equal(r.total, 1);
  assert.ok(r.registros.every((x) => Object.keys(x).every((k) => !COLUNAS_PROIBIDAS_DO_HUB.includes(k))));
  assert.throws(() => hub.lerTabela({ recurso: "9a847338-0000", fields: ["logradouro", "Número do contribuinte"], rotulo: "IPTU" }), /proibida/);
  assert.throws(() => hub.lerTabela({ recurso: "9a847338-0000", fields: ["logradouro"], filters: { "CPF/CNPJ mascarado do contribuinte": "***" }, rotulo: "IPTU" }), /proibida/);
  assert.throws(() => hub.lerTabela({ recurso: "9a847338-0000", fields: ["area"], rotulo: "IPTU" }), /não tem as colunas/);
  assert.equal(hub.lerTabela({ recurso: "fora-do-hub", fields: ["x"], rotulo: "X" }), null);
});

test("hub: arquivo com SHA-256 diferente do manifesto para a leitura", () => {
  const hub = hubDeTeste(IPTU, { sha: "0".repeat(64) });
  assert.throws(() => hub.lerTabela({ recurso: "9a847338-0000", fields: ["logradouro"], rotulo: "IPTU" }), /SHA-256/);
});

test("hub: a cópia parcial do 156 de 2025 é recusada mesmo listada", () => {
  const hub = hubDeTeste(IPTU);
  assert.throws(() => hub.arquivo(RECURSO_156_PARCIAL), /recusado/);
});

test("licença: válida, vencida, emitida, deferida sem data e em análise (retrato da base)", () => {
  const base = { situacao_processo: "DEFERIDO", empreendimento_de_impacto: "Não", data_emissao_licenca: null, data_validade_licenca: null };
  assert.deepEqual(estadoDaLicenca({ ...base, data_emissao_licenca: "2026-07-20T00:00:00", data_validade_licenca: "2029-07-20T00:00:00" }, "2026-11-15"),
    { estado: "valida", emitidaEm: "2026-07-20", validaAte: "2029-07-20", impacto: false });
  assert.equal(estadoDaLicenca({ ...base, data_emissao_licenca: "2023-10-25", data_validade_licenca: "2024-10-25" }, "2026-11-15").estado, "vencida");
  assert.equal(estadoDaLicenca({ ...base, data_emissao_licenca: "2025-01-02" }, "2026-11-15").estado, "emitida");
  assert.equal(estadoDaLicenca(base, "2026-11-15").estado, "deferida");
  assert.equal(estadoDaLicenca({ ...base, situacao_processo: "EM EXIGÊNCIA" }, "2026-11-15").estado, "em_analise");
  assert.equal(estadoDaLicenca({ ...base, empreendimento_de_impacto: "Sim" }, "2026-11-15").impacto, true);
  assert.equal(estadoDaLicenca({ situacao_processo: "DEFERIDO" }, "2026-11-15"), null);
});

// Com a extração real presente: a janela termina em 19/06/2026 e o arquivo de 2026 traz pedidos desde 2009.
const REAL = join(process.cwd(), ".cache/dados-recife/hub-2026-11-15/80c5b3cd-d4f7-466e-9031-e636ef56dd99.csv");
test("156 real (hub 2026-11-15): janela 20/06/2025 a 19/06/2026, sem somar o mesmo pedido duas vezes", { skip: !existsSync(REAL) }, () => {
  const hub = abrirHub("2026-11-15");
  const campos = ["GRUPOSERVICO_DESCRICAO", "SERVICO_DESCRICAO", "LOGRADOURO", "NUMERO", "BAIRRO", "DATA_DEMANDA", "SITUACAO", "DATA_ULT_SITUACAO", "latitude", "longitude"];
  const ler = (id) => ({ id, registros: hub.lerTabela({ recurso: id, fields: campos, rotulo: "156" }).registros });
  const a2026 = ler("80c5b3cd-d4f7-466e-9031-e636ef56dd99"), a2025 = ler("e40fc8b9-49b7-4f08-8b9f-60ba6ed35519");
  assert.equal(a2026.registros.length, 61225);
  assert.equal(a2026.registros.map((r) => r.DATA_DEMANDA).sort()[0].slice(0, 10), "2009-05-19");
  const r = selecionarPedidos156([a2026, a2025], "2026-11-15");
  assert.equal(r.fim, "2026-06-19");
  assert.equal(r.inicio, "2025-06-20");
  assert.ok(r.vias.get("antes da janela") > 0);
  assert.ok(r.vias.get("repetido entre arquivos") > 0);
  const chaves = [...r.linhas.keys()];
  assert.equal(new Set(chaves).size, chaves.length);
});
