// VE16 — folhas de revisão: uma atualização nunca apaga resposta humana.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { celulasHumanas, gravarFolha, lerCsv } from "../folhas.mjs";

const csv = (linhas) => linhas.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n") + "\n";
const CAB = ["caso", "rua", "REVISAO_local_correto(sim/nao)", "OBS_nota"];

test("lê campos com vírgula, aspas e quebra de linha", () => {
  assert.deepEqual(lerCsv('"a, b","diz ""oi""","linha1\nlinha2"\n"x","",""\n'), [["a, b", 'diz "oi"', "linha1\nlinha2"], ["x", "", ""]]);
});
test("conta só células humanas preenchidas", () => {
  assert.equal(celulasHumanas(csv([CAB, ["1", "Rua A", "", ""], ["2", "Rua B", "sim", ""]])), 1);
  assert.equal(celulasHumanas(csv([CAB, ["1", "Rua, com vírgula", "", "  "]])), 0);
});
test("sem resposta humana: regrava; igual: não mexe", () => {
  const d = mkdtempSync(join(tmpdir(), "folhas-")), f = join(d, "g.csv");
  assert.equal(gravarFolha(f, csv([CAB, ["1", "Rua A", "", ""]])), "gravada");
  assert.equal(gravarFolha(f, csv([CAB, ["1", "Rua A", "", ""]])), "igual");
  assert.equal(gravarFolha(f, csv([CAB, ["1", "Rua A", "", ""], ["2", "Rua T", "", ""]])), "gravada");
  assert.match(readFileSync(f, "utf8"), /Rua T/);
});
test("com resposta humana: preserva a folha e grava a regerada ao lado", () => {
  const d = mkdtempSync(join(tmpdir(), "folhas-")), f = join(d, "g.csv");
  const humana = csv([CAB, ["1", "Rua A", "nao", "entrada pelos fundos"]]);
  writeFileSync(f, humana);
  assert.equal(gravarFolha(f, csv([CAB, ["1", "Rua A", "", ""], ["2", "Rua T", "", ""]])), "preservada");
  assert.equal(readFileSync(f, "utf8"), humana);
  assert.ok(existsSync(join(d, "g.regerada.csv")));
  assert.match(readFileSync(join(d, "g.regerada.csv"), "utf8"), /Rua T/);
});
