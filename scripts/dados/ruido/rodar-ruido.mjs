// Ruído estimado por prédio e fachada (decisão A2 do Samuel, 18/11/2026): a metodologia publicada pelo Mapa Sossego
// (https://mapasossego.com.br/sobre) aplicada no centro do lote de cada prédio do índice ativo, com dados abertos.
//
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/ruido/rodar-ruido.mjs \
//     [--baixar] [--relatorio <arquivo.json>]
//
// Entradas (nada pessoal: só vias, pontos e contagens):
// - vias: OpenStreetMap `highway`, do extrato datado do Geofabrik (região Nordeste) em .cache/osm; --baixar busca o
//   arquivo quando ele não está na máquina. MD5 publicado e SHA-256 fixado abaixo são conferidos a cada execução;
// - ônibus: paradas com ≥ 180 partidas num dia útil (GTFS Grande Recife), em src/dados/recife/camadas-ambientais.json;
// - metrô e VLT: traçado CBTU amostrado, no mesmo arquivo;
// - locais com licença de som (LUSE vigente): índice ativo de cada bairro (só o ponto; nunca nome nem processo);
// - bar, oficina e mercado mais perto: camada de atrito (CNEFE do Censo 2022; só categoria, contagem, metros e rumo).
// O avião NÃO entra na camada: o app soma pelo cone de aproximação (src/dados/recife/aeroporto.ts), um cálculo só.
// A densidade de moradores por setor (piso da vizinhança) também não: o repositório não tem a área dos setores.
//
// Saída: src/dados/recife/ruido/<versão>/<bairro>.json e src/dados/recife/ruidoGerado.ts, publicados pelo sistema de
// camadas. Determinístico: as mesmas entradas dão os mesmos bytes (a versão é o hash das entradas e do código).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";
import publicacaoDeCamadas from "../publicar-camadas.cjs";
import { gravarImutavel } from "../imutavel.mjs";
import { lerPbf } from "../rede/pbf.mjs";

// O modelo é TypeScript do app (src/dados/ruido): o Node apaga os tipos, mas não completa a extensão dos imports.
registerHooks({
  resolve(especificador, contexto, proximo) {
    try {
      return proximo(especificador, contexto);
    } catch (e) {
      if (/^\.{1,2}\//.test(especificador) && !/\.[cm]?[jt]s$/.test(especificador)) return proximo(`${especificador}.ts`, contexto);
      throw e;
    }
  },
});
const { FORMATO_DO_RUIDO, camadaDoBairro, criarPlano, prepararCenario } = await import("./nucleo.ts");
const { CLASSE_POR_HIGHWAY } = await import("../../../src/dados/ruido/parametros.ts");

const RAIZ = process.cwd();
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const t0 = Date.now();

/** O extrato usado. Trocar de extrato é trocar este bloco de propósito (arquivo, data e SHA-256). */
const EXTRATO = {
  arquivo: "nordeste-261117.osm.pbf",
  url: "https://download.geofabrik.de/south-america/brazil/nordeste-261117.osm.pbf",
  dadosDe: "2026-11-17",
  baixadoEm: "2026-11-18",
  md5: "9546c214b72a118f99ad5c8d1c06a630",
  sha256: "4b1b5e2eae02e04f29db98c88ce93c484816ace1484ed3238f920a684aa7a43d",
  bytes: 445617687,
};
const PBF = join(RAIZ, ".cache/osm", EXTRATO.arquivo);
/** Recife com ~1,5 km de margem (a mesma caixa da rede a pé, scripts/dados/rede/rodar-rede.mjs). */
const CAIXA = { s: -8.17, w: -35.04, n: -7.91, e: -34.84 };
const dentro = (lo, la) => la >= CAIXA.s && la <= CAIXA.n && lo >= CAIXA.w && lo <= CAIXA.e;

async function baixar() {
  mkdirSync(join(RAIZ, ".cache/osm"), { recursive: true });
  // User-Agent genérico, sem nome de pessoa ou projeto.
  const r = await fetch(EXTRATO.url, { headers: { "User-Agent": "osm-data-script/1.0" } });
  if (!r.ok) throw new Error(`Geofabrik: HTTP ${r.status} em ${EXTRATO.url}`);
  writeFileSync(`${PBF}.tmp`, Buffer.from(await r.arrayBuffer()));
  renameSync(`${PBF}.tmp`, PBF);
}

/** Vias de trânsito geral dentro da caixa, com cache pelo SHA-256 do extrato (ler o PBF inteiro leva ~1 min). */
function lerVias() {
  const cache = join(RAIZ, ".cache/osm", `ruido-vias-${EXTRATO.sha256.slice(0, 16)}-f${FORMATO_DO_RUIDO}.json`);
  if (existsSync(cache)) return { ...JSON.parse(readFileSync(cache, "utf8")), doCache: true };
  const bytes = readFileSync(PBF);
  const md5 = createHash("md5").update(bytes).digest("hex");
  const sha = sha256(bytes);
  if (md5 !== EXTRATO.md5) throw new Error(`MD5 do extrato não confere com o publicado pelo Geofabrik (${md5}).`);
  if (sha !== EXTRATO.sha256) throw new Error(`SHA-256 do extrato mudou (${sha}). Confira o arquivo e atualize EXTRATO de propósito.`);
  const coords = new Map();
  const vias = [];
  let foraDaClasse = 0, tuneis = 0;
  const contagens = lerPbf(PBF, {
    querTagsDoNo: () => false,
    aoNo: (id, lo, la) => { if (dentro(lo, la)) coords.set(id, [Math.round(lo * 1e7) / 1e7, Math.round(la * 1e7) / 1e7]); },
    aoCaminho: (id, refs, tags) => {
      if (!tags.highway) return;
      if (!(tags.highway in CLASSE_POR_HIGHWAY)) { foraDaClasse++; return; }
      if (tags.area === "yes") return;
      // Túnel e passagem por dentro de prédio não soam na rua.
      if (tags.tunnel && tags.tunnel !== "no") { tuneis++; return; }
      const pontos = refs.map((r) => coords.get(r)).filter(Boolean);
      if (pontos.length < 2) return;
      const via = { id, nome: tags.name ?? null, highway: tags.highway, pontos };
      if (tags.lanes) via.lanes = tags.lanes;
      if (tags.maxspeed) via.maxspeed = tags.maxspeed;
      vias.push(via);
    },
  });
  if (!contagens.ordenado) throw new Error("Extrato fora de ordem (vias antes dos nós): o leitor exige os nós primeiro.");
  vias.sort((a, b) => a.id - b.id);
  const leitura = { blocos: contagens.blocos, nos: contagens.nos, vias: contagens.vias, nosNaCaixa: coords.size, viasDeTransito: vias.length, tuneis, foraDaClasse };
  writeFileSync(`${cache}.tmp`, JSON.stringify({ vias, leitura }));
  renameSync(`${cache}.tmp`, cache);
  return { vias, leitura, doCache: false };
}

if (process.argv.includes("--baixar") && !existsSync(PBF)) await baixar();
if (!existsSync(PBF) && !existsSync(join(RAIZ, ".cache/osm", `ruido-vias-${EXTRATO.sha256.slice(0, 16)}-f${FORMATO_DO_RUIDO}.json`))) {
  throw new Error(`.cache/osm/${EXTRATO.arquivo} ausente: rode com --baixar (${EXTRATO.url}, ${Math.round(EXTRATO.bytes / 1e6)} MB).`);
}
const { vias, leitura, doCache } = lerVias();

// ——— Entradas que já estão no app ————————————————————————————————————————————————————————————————————
const ler = (c) => readFileSync(join(RAIZ, c), "utf8");
const pub = ler("src/dados/recife/publicacaoGerada.ts");
const dirIndice = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
const arquivosDoIndice = Object.fromEntries([...pub.matchAll(/"([a-z-]+)": "(recife\/indice-municipal\/[0-9a-f]+\/[a-z-]+\.json)"/g)].map((m) => [m[1], m[2]]));
const atritoTs = ler("src/dados/recife/atritoGerado.ts");
const versaoDoAtrito = /VERSAO_DO_ATRITO = "([^"]+)"/.exec(atritoTs)[1];
if (/INDICE_DO_ATRITO = "([^"]+)"/.exec(atritoTs)[1] !== dirIndice) throw new Error("A camada de atrito é de outro índice: rode scripts/dados/atrito/rodar-atrito.mjs antes.");
const ambientais = JSON.parse(ler("src/dados/recife/camadas-ambientais.json")).ruidoCorredores;

const prediosPorBairro = {};
const luse = new Map();
for (const [bairro, c] of Object.entries(arquivosDoIndice)) {
  const ix = JSON.parse(ler(join("src/dados", c)));
  prediosPorBairro[bairro] = ix.edificios.map((e) => ({ id: e.id, lon: e.centro[0], lat: e.centro[1] }));
  // Só o ponto do local com licença vigente; o índice não traz nome, endereço nem processo.
  for (const l of ix.rua?.luse ?? []) if (l.vigente) luse.set(`${l.centro[0]},${l.centro[1]}`, l.centro);
}
const pontosDeLuse = [...luse.keys()].sort().map((k) => luse.get(k));

// ——— Versão: hash das entradas e do código (fim de linha normalizado: o mesmo hash no Windows e no Linux) —————————————
const codigo = ["scripts/dados/ruido/rodar-ruido.mjs", "scripts/dados/ruido/nucleo.ts", "src/dados/ruido/modelo.ts", "src/dados/ruido/parametros.ts"]
  .map((f) => sha256(ler(f).replace(/\r\n/g, "\n")));
const versao = sha256(JSON.stringify({
  formato: FORMATO_DO_RUIDO, codigo, extrato: EXTRATO.sha256, indice: dirIndice, atrito: versaoDoAtrito,
  onibus: sha256(JSON.stringify(ambientais.corredoresOnibus)), trilho: sha256(JSON.stringify(ambientais.trilhosMetro)), luse: sha256(JSON.stringify(pontosDeLuse)),
})).slice(0, 16);

// ——— Cálculo ————————————————————————————————————————————————————————————————————————————————————————
const plano = criarPlano(-34.92, -8.05);
const cenario = prepararCenario({ vias, paradas: ambientais.corredoresOnibus, trilho: ambientais.trilhosMetro, luse: pontosDeLuse, plano });
const pasta = join(RAIZ, "src/dados/recife/ruido", versao);
mkdirSync(pasta, { recursive: true });
const arquivos = {}, resumo = {};
const niveis = [];
for (const bairro of Object.keys(prediosPorBairro)) {
  const atrito = JSON.parse(ler(`src/dados/recife/atrito/${versaoDoAtrito}/${bairro}.json`)).predios;
  const camada = camadaDoBairro(cenario, versao, prediosPorBairro[bairro], atrito, plano);
  const texto = JSON.stringify(camada);
  gravarImutavel(join(pasta, `${bairro}.json`), texto);
  arquivos[bairro] = `recife/ruido/${versao}/${bairro}.json`;
  const v = Object.values(camada.predios);
  for (const p of v) if (p.f[0]) niveis.push(p.f[0][4] / 10);
  resumo[bairro] = { predios: v.length, bytes: Buffer.byteLength(texto), nomesDeVia: camada.nomes.length, semFonteNenhuma: v.filter((p) => !p.f.length).length, fontesPorPredio: +(v.reduce((s, p) => s + p.f.length, 0) / Math.max(1, v.length)).toFixed(2) };
}

const FONTES = {
  vias: { nome: "OpenStreetMap, vias (extrato Geofabrik, região Nordeste)", url: EXTRATO.url, arquivo: EXTRATO.arquivo, dadosDe: EXTRATO.dadosDe, baixadoEm: EXTRATO.baixadoEm, md5: EXTRATO.md5, sha256: EXTRATO.sha256, licenca: "ODbL 1.0", atribuicao: "© colaboradores do OpenStreetMap" },
  onibus: { nome: "GTFS Grande Recife (partidas programadas num dia útil)", origem: "src/dados/recife/camadas-ambientais.json (ruidoCorredores.corredoresOnibus)" },
  trilho: { nome: "CBTU Metrô do Recife (traçado)", origem: "src/dados/recife/camadas-ambientais.json (ruidoCorredores.trilhosMetro)" },
  luse: { nome: "Licenciamento Ambiental do Recife (LUSE vigente)", origem: `src/dados/recife/${dirIndice} (rua.luse)` },
  cnefe: { nome: "CNEFE, Censo Demográfico 2022 (IBGE)", origem: `src/dados/recife/atrito/${versaoDoAtrito}` },
  metodologia: { nome: "Mapa Sossego, “Como funciona”", url: "https://mapasossego.com.br/sobre", lidaEm: "2026-11-18" },
};
const ts = "// Gerado por scripts/dados/ruido/rodar-ruido.mjs (18/11/2026). Troca atômica depois de gravar as partições.\n" +
  "// Ruído estimado com dados abertos, não medição: fontes do chão por prédio (vias do OpenStreetMap, ônibus, trilho,\n" +
  "// LUSE e CNEFE). O avião é somado no app. Vias: © colaboradores do OpenStreetMap, ODbL 1.0.\n" +
  `export const VERSAO_DO_RUIDO = ${JSON.stringify(versao)};\n` +
  `export const INDICE_DO_RUIDO = ${JSON.stringify(dirIndice)};\n` +
  `export const ARQUIVOS_DO_RUIDO: Record<string, string> = {\n${Object.entries(arquivos).map(([b, c]) => `  ${JSON.stringify(b)}: ${JSON.stringify(c)},`).join("\n")}\n};\n` +
  `export const FONTES_DO_RUIDO = ${JSON.stringify(FONTES, null, 1)} as const;\n`;
const arqTs = join(RAIZ, "src/dados/recife/ruidoGerado.ts");
writeFileSync(`${arqTs}.tmp`, ts); renameSync(`${arqTs}.tmp`, arqTs);
publicacaoDeCamadas.publicarCamadas(); // D036: os arquivos vão para public/dados e assets/dados, fora do bundle.

niveis.sort((a, b) => a - b);
const q = (p) => niveis[Math.min(niveis.length - 1, Math.floor(niveis.length * p))];
const bytes = Object.values(resumo).map((r) => r.bytes);
const relatorio = {
  executadoEm: new Date().toISOString(), versao, formato: FORMATO_DO_RUIDO, indice: dirIndice, atrito: versaoDoAtrito, extrato: EXTRATO, viasDoCache: doCache, leitura,
  cenario: cenario.resumo, luseVigentes: pontosDeLuse.length, pontosDoTrilho: ambientais.trilhosMetro.length,
  bairros: Object.keys(arquivos).length, predios: Object.values(resumo).reduce((s, r) => s + r.predios, 0),
  semFonteNenhuma: Object.values(resumo).reduce((s, r) => s + r.semFonteNenhuma, 0),
  bytesTotais: bytes.reduce((s, b) => s + b, 0), maiorArquivo: Math.max(...bytes),
  fonteMaisForteDeDiaDb: { p10: q(0.1), mediana: q(0.5), p90: q(0.9), maximo: niveis.at(-1) },
  sha256DosArquivos: sha256(Object.keys(arquivos).sort().map((b) => `${b}:${sha256(readFileSync(join(pasta, `${b}.json`)))}`).join("\n")),
  porBairro: resumo, ms: Date.now() - t0, memoriaPicoMB: Math.round(process.resourceUsage().maxRSS / 1024),
};
const out = arg("--relatorio");
if (out) writeFileSync(out, JSON.stringify(relatorio, null, 1) + "\n");
const { porBairro: _porBairro, ...curto } = relatorio;
console.log(JSON.stringify(curto, null, 1));
