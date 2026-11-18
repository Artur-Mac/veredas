#!/usr/bin/env node
// 08-fipezap.mjs — índice FipeZAP: preço m² por bairro no Recife.
// Baixa a planilha de séries históricas e extrai os bairros-alvo.
// Salva em raw/precos/.

import { saveOut } from "./http.mjs";
import { registrarFonte } from "./fontes.mjs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "..", "raw", "precos");
const XLSX_URL = "https://downloads.fipe.org.br/indices/fipezap/fipezap-serieshistoricas.xlsx";

// Recife = rId53 → xl/worksheets/sheet53.xml (mapa rId→arquivo em xl/_rels/workbook.xml.rels).
// A planilha de séries históricas é agregada por CIDADE (sem quebra por bairro):
// coluna A = data (serial Excel), B = locação R$/m², C–E = locação 1–4 quartos,
// F–J = variação mensal, K = venda R$/m², L–O = venda 1–4 quartos.
const RECIFE_SHEET = "sheet53.xml";

function excelSerialParaISO(serial) {
  // Época 1899-12-30 (correção do bug de 1900 do Excel)
  const dias = Math.round(serial);
  const ms = Math.round((dias - 25569) * 86400000);
  return new Date(ms).toISOString().slice(0, 10);
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  try {
    const res = await fetch(XLSX_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0" },
      redirect: "follow",
    });
    const buf = Buffer.from(await res.arrayBuffer());
    const file = join(OUT, "fipezap-series.xlsx");
    writeFileSync(file, buf);
    console.log("FipeZAP baixado:", buf.length, "bytes");

    const tmp = join(OUT, "fipezap-extracted");
    execSync(`rm -rf ${tmp} && mkdir -p ${tmp} && unzip -o ${file} -d ${tmp}`);
    const ssFile = join(tmp, "xl", "sharedStrings.xml");
    const strings = readXMLStrings(ssFile);
    const sheetFile = join(tmp, "xl", "worksheets", RECIFE_SHEET);
    const rows = readXMLRows(sheetFile, strings);

    // Colunas da folha Recife (0-indexadas):
    // 0 data | 1 locação R$/m² | 2–5 locação 1D 2D 3D 4D | 6–9 variação 12m locação
    // 10 venda R$/m² | 11–14 venda 1D 2D 3D 4D | 15–18 variação 12m venda
    const serie = [];
    for (const r of rows) {
      const serial = parseFloat(r[0]);
      if (!serial || serial < 30000 || serial > 60000) continue; // só linhas de data
      const num = (i) => {
        const v = r[i];
        if (v === undefined || v === "" || v === ".") return null;
        const f = parseFloat(v);
        return isNaN(f) ? null : f;
      };
      serie.push({
        data: excelSerialParaISO(serial),
        locacao_m2: num(1),
        venda_m2: num(10),
        locacao_1d: num(2), locacao_2d: num(3), locacao_3d: num(4), locacao_4d: num(5),
        venda_1d: num(11), venda_2d: num(12), venda_3d: num(13), venda_4d: num(14),
      });
    }
    saveOut(join(OUT, "fipezap-recife.json"), JSON.stringify(
      { fonte: XLSX_URL, consultado_em: new Date().toISOString(),
        observacao: "Série agregada por cidade (Recife). Sem quebra por bairro nesta planilha.",
        total_meses: serie.length, serie }, null, 2));
    console.log("FipeZAP Recife: meses da série =", serie.length, "| último:", JSON.stringify(serie.at(-1)));
  } catch (e) {
    console.error("FipeZAP:", e.message);
  }

  registrarFonte({
    id: "fipezap",
    nome: "Índice FipeZAP (preço m² aluguel/venda)",
    url: "https://www.fipezap.com.br",
    tipo: "xlsx",
    area: "precos",
    status: "ok",
    acesso: "XLSX público; licença: direitos reservados à Fipe (citar fonte)",
    observacoes: "Série histórica agregada por cidade (Recife, folha rId53). Para preço por bairro usar portal ZAP/FipeZAP ou OLX/OLéo.",
  });
}

function readXMLStrings(file) {
  try {
    const xml = readFileSync(file, "utf8");
    return [...xml.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((m) => m[1]);
  } catch {
    return [];
  }
}

function readXMLRows(file, strings) {
  try {
    const xml = readFileSync(file, "utf8");
    const rows = [];
    const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
    let rm;
    while ((rm = rowRe.exec(xml)) !== null) {
      const cells = [];
      const cellRe = /<c[^>]*?(?: t="(\w+)")?[^>]*>(?:<v>([^<]*)<\/v>)?(?:<\/c>)?/g;
      let cm;
      while ((cm = cellRe.exec(rm[1])) !== null) {
        const type = cm[1];
        let val = cm[2] || "";
        if (type === "s") val = strings[parseInt(val, 10)] || val;
        cells.push(val);
      }
      if (cells.length) rows.push(cells);
    }
    return rows;
  } catch {
    return [];
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
