// Gera `src/dados/recife/censo-renda-setores.json` a partir dos Agregados por Setores Censitários e por Bairros
// do Censo Demográfico 2022 — Rendimento do Responsável pelo Domicílio (IBGE, publicação 2026-05-08).
// Variáveis oficiais conferidas em `dicionario_de_dados_renda_responsavel_20260508.xlsx`:
// - V06001: Pessoas responsáveis em domicílios particulares permanentes ocupados (N domicílios)
// - V06002: Moradores em domicílios particulares permanentes ocupados
// - V06004: Valor do rendimento nominal médio mensal das pessoas responsáveis (R$)
// - V06006: Valor do rendimento nominal mediano mensal das pessoas responsáveis (R$)
// Quando o IBGE suprime por sigilo estatístico ("X", "-", ".."), grava `null` — nunca zero.

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dirCache = path.join(raiz, ".cache/dados-recife");
fs.mkdirSync(dirCache, { recursive: true });

const URL_SETORES =
  "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/Agregados_por_setores_renda_responsavel_BR_20260508_csv.zip";
const URL_BAIRROS =
  "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/Agregados_por_bairros_renda_responsavel_BR_20260508_csv.zip";
const URL_DICIONARIO =
  "https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios_Rendimento_do_Responsavel/dicionario_de_dados_renda_responsavel_20260508.xlsx";

function normalizarSlug(nome) {
  const s = String(nome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s === "poco-da-panela") return "poco";
  if (s === "bairro-do-recife" || s === "recife-antigo") return "recife";
  return s;
}

async function garantirZip(nomeArquivo, url) {
  const caminho = path.join(dirCache, nomeArquivo);
  if (!fs.existsSync(caminho)) {
    const resp = await fetch(url, { headers: { "User-Agent": "VeredaRecifeDadosAbertos/1.0" } });
    if (!resp.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${resp.status}`);
    fs.writeFileSync(caminho, Buffer.from(await resp.arrayBuffer()));
  }
  const sha256 = createHash("sha256").update(fs.readFileSync(caminho)).digest("hex");
  return { caminho, sha256 };
}

function numeroOuNulo(bruto) {
  if (bruto === undefined || bruto === null) return null;
  const limpo = String(bruto).replace(/^"|"$/g, "").trim().replace(",", ".");
  if (!limpo || limpo === "X" || limpo === "x" || limpo === "-" || limpo === "..") return null;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const zipSetores = await garantirZip("ibge-censo-2022-renda-setores.zip", URL_SETORES);
const zipBairros = await garantirZip("ibge-censo-2022-renda-bairros.zip", URL_BAIRROS);

// Extrai apenas linhas de Recife ("2611606...") diretamente do ZIP via Python stdlib (rápido e determinístico)
const jsonExtraido = JSON.parse(
  execFileSync(
    "python3",
    [
      "-c",
      `
import zipfile, csv, io, json, sys

def ler_recife(zip_path):
    with zipfile.ZipFile(zip_path) as z:
        nome = [n for n in z.namelist() if n.lower().endswith(".csv")][0]
        with z.open(nome) as f:
            leitor = csv.DictReader(io.TextIOWrapper(f, "utf-8-sig", errors="replace"), delimiter=";")
            linhas = []
            for row in leitor:
                cod = (row.get("CD_SETOR") or row.get("CD_BAIRRO") or "").strip()
                if cod.startswith("2611606"):
                    linhas.append(row)
            return linhas

print(json.dumps({
    "setores": ler_recife(sys.argv[1]),
    "bairros": ler_recife(sys.argv[2]),
}))
`,
      zipSetores.caminho,
      zipBairros.caminho,
    ],
    { maxBuffer: 32 * 1024 * 1024 },
  ).toString("utf8"),
);

// Tupla compacta por setor: [responsáveis (N), moradores, média R$, mediana R$]
const setores = {};
let suprimidos = 0;
for (const row of jsonExtraido.setores) {
  const codigo = String(row.CD_SETOR ?? "").trim();
  if (!/^\d{15}$/.test(codigo)) continue;
  const responsaveis = numeroOuNulo(row.V06001);
  const moradores = numeroOuNulo(row.V06002);
  const media = numeroOuNulo(row.V06004);
  const mediana = numeroOuNulo(row.V06006);
  if (mediana === null || media === null) suprimidos += 1;
  setores[codigo] = [
    responsaveis !== null ? Math.round(responsaveis) : null,
    moradores !== null ? Math.round(moradores) : null,
    media !== null ? Math.round(media) : null,
    mediana !== null ? Math.round(mediana) : null,
  ];
}

const bairros = {};
for (const row of jsonExtraido.bairros) {
  const nome = row.NM_BAIRRO ?? "";
  const slug = normalizarSlug(nome);
  if (!slug) continue;
  const responsaveis = numeroOuNulo(row.V06001);
  const moradores = numeroOuNulo(row.V06002);
  const media = numeroOuNulo(row.V06004);
  const mediana = numeroOuNulo(row.V06006);
  bairros[slug] = [
    responsaveis !== null ? Math.round(responsaveis) : null,
    moradores !== null ? Math.round(moradores) : null,
    media !== null ? Math.round(media) : null,
    mediana !== null ? Math.round(mediana) : null,
  ];
}

const chavesOrdenadas = Object.keys(setores).sort();
if (chavesOrdenadas.length < 2500) {
  throw new Error(`Esperados ao menos 2.500 setores no Recife; obtidos ${chavesOrdenadas.length}`);
}

const setoresOrdenados = {};
for (const k of chavesOrdenadas) setoresOrdenados[k] = setores[k];

const bairrosOrdenados = {};
for (const k of Object.keys(bairros).sort()) bairrosOrdenados[k] = bairros[k];

const saida = {
  versao: 1,
  municipio: "2611606",
  referencia: "Censo Demográfico 2022",
  modificadoEm: "2026-05-08",
  consultadoEm: "2026-10-27",
  fonte: URL_SETORES,
  fonteBairros: URL_BAIRROS,
  dicionario: URL_DICIONARIO,
  licenca: "Citar o IBGE",
  sha256SetoresZip: zipSetores.sha256,
  sha256BairrosZip: zipBairros.sha256,
  colunasUsadas: ["CD_SETOR", "V06001", "V06002", "V06004", "V06006"],
  setoresLidos: chavesOrdenadas.length,
  setoresComSigilo: suprimidos,
  setores: setoresOrdenados,
  bairros: bairrosOrdenados,
};

const destino = path.join(raiz, "src/dados/recife/censo-renda-setores.json");
fs.writeFileSync(destino + ".tmp", JSON.stringify(saida) + "\n");
fs.renameSync(destino + ".tmp", destino);
console.log(
  JSON.stringify({
    setores: chavesOrdenadas.length,
    setoresComSigilo: suprimidos,
    bairros: Object.keys(bairrosOrdenados).length,
    bytes: fs.statSync(destino).size,
  }),
);
