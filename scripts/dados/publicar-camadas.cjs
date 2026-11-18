// Publica os arquivos de camada fora do bundle JS (D036, divisão do pacote).
//
//   node scripts/dados/publicar-camadas.cjs              publica (idempotente)
//   node scripts/dados/publicar-camadas.cjs --conferir   só confere; sai com 1 se algo estiver velho ou faltando
//
// Lê, nos módulos gerados pelos pipelines (*Gerado.ts e afins), os caminhos dos arquivos de camada ("recife/…/x.json",
// "sol/…/x.json", relativos a src/dados) e, para cada um:
// - copia para public/dados/<caminho>.<sha16>.json (web: o Expo serve public/ no desenvolvimento e o copia no export);
// - copia para assets/dados/<caminho>.<sha16>.vjson (nativo: asset empacotado pelo Metro, ver metro.config.js);
// - escreve src/dados/camadasGeradas.ts (caminho → url, bytes, sha256) e src/plataforma/camadasNativasGeradas.ts
//   (caminho → require do asset).
// O sha no nome torna cada arquivo publicado imutável: cache e service worker nunca servem conteúdo trocado no lugar.
// Cópias de versões que saíram dos módulos gerados são apagadas de public/dados e assets/dados (ambos fora do git).
// O metro.config.js chama `publicarCamadas()` ao subir o Metro (expo start/export, build nativo), e cada pipeline que
// regrava um módulo gerado também; esquecer de rodar não chega ao app.
"use strict";
/* global __dirname */
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "../..");
/** Módulos gerados que listam arquivos de camada (caminhos relativos a src/dados). */
const MODULOS_GERADOS = [
  "recife/publicacaoGerada.ts",
  "recife/transitoGerado.ts",
  "recife/essenciaisGerados.ts",
  "recife/noiteGerado.ts",
  "recife/chuvaGerado.ts",
  "recife/procuraGerado.ts",
  "recife/equipamentosGerado.ts",
  "recife/atritoGerado.ts",
  "recife/mapaBaseGerado.ts",
  "sol/fontesGeradas.ts",
];
const CAMINHO_DE_CAMADA = /"((?:recife|sol)\/[a-z0-9_./-]+\.json)"/g;

function caminhosDeCamada(raiz = RAIZ) {
  const dados = path.join(raiz, "src/dados");
  const caminhos = new Set();
  for (const m of MODULOS_GERADOS) {
    const texto = fs.readFileSync(path.join(dados, m), "utf8");
    if (/require\(\s*["']\.\/(?!indice-municipal\/[0-9a-f]{16}\/meta\.json)[^"']+\.json["']\s*\)/.test(texto)) {
      throw new Error(`${m} ainda importa um arquivo de camada com require(): o JSON entraria no bundle. Gere de novo com o pipeline atualizado.`);
    }
    for (const r of texto.matchAll(CAMINHO_DE_CAMADA)) {
      const c = r[1];
      if (c.split("/").includes("..")) throw new Error(`${m}: caminho de camada com "..": ${c}`);
      caminhos.add(c);
    }
  }
  return [...caminhos].sort();
}

function descrever(raiz, caminhos) {
  const dados = path.join(raiz, "src/dados");
  return caminhos.map((caminho) => {
    const origem = path.join(dados, caminho);
    if (!fs.existsSync(origem)) throw new Error(`Arquivo de camada listado e ausente: src/dados/${caminho}`);
    const bytes = fs.readFileSync(origem);
    const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    const base = `${caminho.replace(/\.json$/, "")}.${sha256.slice(0, 16)}`;
    return { caminho, origem, bytes: bytes.length, sha256, web: `dados/${base}.json`, nativo: `dados/${base}.vjson` };
  });
}

function textoDoManifesto(lista) {
  const linhas = lista.map((a) => `  ${JSON.stringify(a.caminho)}: { url: ${JSON.stringify(a.web)}, bytes: ${a.bytes}, sha256: ${JSON.stringify(a.sha256)} },`);
  return (
    "// Gerado por scripts/dados/publicar-camadas.cjs a partir dos módulos gerados de cada camada. Não edite à mão.\n" +
    "// Caminho do arquivo de camada (relativo a src/dados) → onde a web o busca, tamanho e sha256 conferidos na leitura.\n" +
    "export type ArquivoPublicado = { url: string; bytes: number; sha256: string };\n" +
    `export const CAMADAS_PUBLICADAS: Record<string, ArquivoPublicado> = {\n${linhas.join("\n")}\n};\n`
  );
}

function textoDosAssets(lista) {
  const linhas = lista.map((a) => `  ${JSON.stringify(a.caminho)}: () => require(${JSON.stringify(`../../assets/${a.nativo}`)}),`);
  return (
    "// Gerado por scripts/dados/publicar-camadas.cjs. Não edite à mão. Só o nativo (src/plataforma/camadas.ts) importa:\n" +
    "// cada arquivo de camada é um asset .vjson empacotado no aplicativo, fora do bundle JS.\n" +
    "/* eslint-disable @typescript-eslint/no-require-imports */\n" +
    `export const ASSETS_DAS_CAMADAS: Record<string, () => number> = {\n${linhas.join("\n")}\n};\n`
  );
}

/** Os dois módulos TS gerados, como deveriam estar agora (o teste compara com o que está no repositório). */
function modulosGerados(raiz = RAIZ) {
  const lista = descrever(raiz, caminhosDeCamada(raiz));
  return [
    { arquivo: path.join(raiz, "src/dados/camadasGeradas.ts"), texto: textoDoManifesto(lista) },
    { arquivo: path.join(raiz, "src/plataforma/camadasNativasGeradas.ts"), texto: textoDosAssets(lista) },
  ];
}

function listarArquivos(dir) {
  if (!fs.existsSync(dir)) return [];
  const saida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) saida.push(...listarArquivos(p));
    else saida.push(p);
  }
  return saida;
}

function igualEmTamanho(p, bytes) {
  try {
    return fs.statSync(p).size === bytes;
  } catch {
    return false;
  }
}

/**
 * Publica (ou só confere, com `conferir: true`). Devolve { arquivos, bytes, escritos, removidos, problemas }.
 * Conferindo, `problemas` lista o que está velho ou faltando; publicando, sai vazio.
 */
function publicarCamadas({ raiz = RAIZ, conferir = false } = {}) {
  const lista = descrever(raiz, caminhosDeCamada(raiz));
  const destinos = [
    { pasta: path.join(raiz, "public"), chave: "web" },
    { pasta: path.join(raiz, "assets"), chave: "nativo" },
  ];
  const modulos = [
    { arquivo: path.join(raiz, "src/dados/camadasGeradas.ts"), texto: textoDoManifesto(lista) },
    { arquivo: path.join(raiz, "src/plataforma/camadasNativasGeradas.ts"), texto: textoDosAssets(lista) },
  ];
  const problemas = [];
  let escritos = 0;
  let removidos = 0;
  for (const m of modulos) {
    const atual = fs.existsSync(m.arquivo) ? fs.readFileSync(m.arquivo, "utf8") : null;
    if (atual === m.texto) continue;
    if (conferir) problemas.push(`${path.relative(raiz, m.arquivo)} desatualizado`);
    else {
      fs.writeFileSync(m.arquivo, m.texto);
      escritos++;
    }
  }
  for (const d of destinos) {
    const esperados = new Set();
    for (const a of lista) {
      const alvo = path.join(d.pasta, a[d.chave]);
      esperados.add(alvo);
      if (igualEmTamanho(alvo, a.bytes)) continue;
      if (conferir) {
        problemas.push(`${path.relative(raiz, alvo)} ausente`);
        continue;
      }
      fs.mkdirSync(path.dirname(alvo), { recursive: true });
      const temporario = `${alvo}.${process.pid}.tmp`;
      fs.copyFileSync(a.origem, temporario, fs.constants.COPYFILE_FICLONE);
      fs.renameSync(temporario, alvo);
      escritos++;
    }
    for (const p of listarArquivos(path.join(d.pasta, "dados"))) {
      if (esperados.has(p)) continue;
      if (conferir) problemas.push(`${path.relative(raiz, p)} sobrando`);
      else {
        fs.rmSync(p);
        removidos++;
      }
    }
  }
  return { arquivos: lista.length, bytes: lista.reduce((s, a) => s + a.bytes, 0), escritos, removidos, problemas };
}

module.exports = { publicarCamadas, caminhosDeCamada, modulosGerados, MODULOS_GERADOS };

if (require.main === module) {
  const conferir = process.argv.includes("--conferir");
  const r = publicarCamadas({ conferir });
  console.log(JSON.stringify({ arquivos: r.arquivos, mb: +(r.bytes / 1e6).toFixed(1), escritos: r.escritos, removidos: r.removidos, problemas: r.problemas.slice(0, 20) }));
  if (r.problemas.length) process.exit(1);
}
