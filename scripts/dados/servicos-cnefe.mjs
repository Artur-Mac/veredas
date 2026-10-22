// Geração local, sem rede. Endereços de ensino/saúde/religiosos, sem nomes ou contatos.
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const arquivo = path.join(raiz, ".cache/dados-recife/cnefe-recife.json.gz");
const bruto = fs.readFileSync(arquivo);
const fonte = JSON.parse(gunzipSync(bruto).toString("utf8"));
const indices = Object.fromEntries(fonte.colunas.map((c, i) => [c, i]));
for (const c of ["NV_GEO_COORD", "COD_ESPECIE", "LATITUDE", "LONGITUDE"]) {
  if (!(c in indices)) throw new Error(`Coluna ausente: ${c}`);
}
const pontos = [];
const vistos = new Set();
const excluidos = { outrasEspecies: 0, qualidade: 0, coordenada: 0, duplicados: 0 };
for (const linha of fonte.linhas) {
  const especie = Number(linha[indices.COD_ESPECIE]);
  if (![4, 5, 8].includes(especie)) { excluidos.outrasEspecies++; continue; }
  const nivel = Number(linha[indices.NV_GEO_COORD]);
  // Apenas coordenada original para esta lista de proximidade; não significa precisão métrica certificada.
  if (nivel !== 1) { excluidos.qualidade++; continue; }
  const lat = Number(linha[indices.LATITUDE]);
  const lon = Number(linha[indices.LONGITUDE]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -8.18 || lat > -7.90 || lon < -35.10 || lon > -34.80) {
    excluidos.coordenada++; continue;
  }
  const ponto = [Number(lon.toFixed(6)), Number(lat.toFixed(6)), especie, nivel];
  const chave = ponto.join("/");
  if (vistos.has(chave)) { excluidos.duplicados++; continue; }
  vistos.add(chave); pontos.push(ponto);
}
pontos.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
const resultado = {
  versao: 1, municipio: "2611606", referencia: "Censo 2022", modificadoEm: fonte.modificadoEm,
  fonte: fonte.consulta.url, dicionario: "https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102063.pdf",
  licenca: "Citar o IBGE", sha256Entrada: createHash("sha256").update(bruto).digest("hex"),
  lidos: fonte.linhas.length, excluidos, pontos,
};
if (!pontos.length) throw new Error("Nenhum ponto válido; publicação cancelada.");
const destino = path.join(raiz, "src/dados/recife/servicos-cnefe.json");
fs.writeFileSync(destino + ".tmp", JSON.stringify(resultado) + "\n");
fs.renameSync(destino + ".tmp", destino);
console.log(JSON.stringify({ registros: pontos.length, excluidos, bytes: fs.statSync(destino).size }));
