// Caixas dos bairros do índice ativo (15/11/2026), para "Usar minha localização agora" no Explorar: com a posição do
// aparelho, o app só baixa as partições dos bairros cuja caixa (centros dos prédios + 300 m) contém o ponto.
//   node scripts/dados/localizar/caixas-dos-bairros.mjs
// Rode depois de ativar um índice novo (RUNBOOK-ATUALIZACAO.md, seção 1b). Pequeno: entra no bundle.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();
const pub = readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8");
const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
const arquivos = Object.fromEntries([...pub.matchAll(/"([a-z-]+)": "(recife\/indice-municipal\/[0-9a-f]+\/[a-z-]+\.json)"/g)].map((m) => [m[1], m[2]]));
const MARGEM = 0.0028; // ~300 m
const caixas = {};
for (const [bairro, c] of Object.entries(arquivos)) {
  const d = JSON.parse(readFileSync(join(RAIZ, "src/dados", c), "utf8"));
  if (!d.edificios.length) continue;
  const lons = d.edificios.map((e) => e.centro[0]), lats = d.edificios.map((e) => e.centro[1]);
  caixas[bairro] = [Math.min(...lons) - MARGEM, Math.min(...lats) - MARGEM, Math.max(...lons) + MARGEM, Math.max(...lats) + MARGEM].map((v) => Number(v.toFixed(4)));
}
const ts = "// Gerado por scripts/dados/localizar/caixas-dos-bairros.mjs: caixa [oeste, sul, leste, norte] dos centros dos prédios\n" +
  "// de cada bairro do índice ativo, com 300 m de folga. Só decide quais partições baixar para achar o prédio mais perto.\n" +
  `export const INDICE_DAS_CAIXAS = ${JSON.stringify(dir)};\n` +
  `export const CAIXAS_DOS_BAIRROS: Record<string, readonly [number, number, number, number]> = {\n${Object.entries(caixas).map(([b, x]) => `  ${JSON.stringify(b)}: [${x.join(", ")}],`).join("\n")}\n};\n`;
const destino = join(RAIZ, "src/dados/recife/caixasDosBairros.ts");
writeFileSync(`${destino}.tmp`, ts); renameSync(`${destino}.tmp`, destino);
console.log(JSON.stringify({ indice: dir, bairros: Object.keys(caixas).length, bytes: Buffer.byteLength(ts) }));
