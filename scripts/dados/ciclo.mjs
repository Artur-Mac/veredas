// VE16 — ciclo de atualização: aquisição → validação → publicação de todas as camadas por prédio, em ordem, com ponto
// de restauração, medição e o que muda para a pessoa (prédios com camada nova, alterada ou perdida, por área).
//
//   node --max-old-space-size=8000 --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/ciclo.mjs --nome <id> \
//     [--ao-vivo] [--sem-cache] [--interromper <passo>:<segundos>] [--so <passo,passo>]
//   node … scripts/dados/ciclo.mjs --reverter <id>      volta ao estado de antes do ciclo <id>
//   node … scripts/dados/ciclo.mjs --reaplicar <id>     reaplica o estado deixado pelo ciclo <id>
//   node … scripts/dados/ciclo.mjs --conferir           só confere o estado atual (ponteiros, versões, arquivos do app)
//
// Sem --ao-vivo nada sai da máquina (as fontes municipais vêm do último bruto arquivado). Com --ao-vivo: até 2
// requisições ao CKAN da Prefeitura e 2 ao Geofabrik (observações) e até 3 ao CKAN (destinos), como no VE02/VE04.
// Cache por passo: um passo é pulado quando o código, as entradas de dados e o estado deixado pelos passos anteriores
// são os mesmos da última execução bem-sucedida e as saídas dele continuam ativas (--sem-cache desliga).
// Registros em .cache/ciclos/<id>/ (antes.json, depois.json, ciclo.json, relatórios de cada passo).
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import camadas from "./publicar-camadas.cjs";
import { AREAS, AREAS_DE_EXPANSAO } from "./areas.mjs";
import { lerManifesto, ponteiroAtual, restosTemporarios, verificarVersao } from "./observacoes/publicar.mjs";

const RAIZ = process.cwd();
const PUB = join(RAIZ, ".cache/publicacoes");
const CICLOS = join(RAIZ, ".cache/ciclos");
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const sha = (b) => createHash("sha256").update(b).digest("hex");
const gravarAtomico = (arq, texto) => { writeFileSync(`${arq}.tmp`, texto); renameSync(`${arq}.tmp`, arq); };

/** Passos em ordem de dependência. `publicacoes`: o que o passo ativa; `gerados`: módulos do app que ele regrava. */
export const PASSOS = [
  { id: "observacoes", script: "scripts/dados/observacoes/rodar.mjs", aoVivo: true, publicacoes: ["defesa-civil"], gerados: [] },
  { id: "rede", script: "scripts/dados/rede/rodar-rede.mjs", publicacoes: ["rede-pedestre"], gerados: [] },
  { id: "destinos", script: "scripts/dados/destinos/rodar-destinos.mjs", aoVivo: true, publicacoes: ["essenciais"], gerados: ["src/dados/recife/essenciaisGerados.ts"] },
  { id: "transito", script: "scripts/dados/transito/rodar-transito.mjs", publicacoes: ["transito"], gerados: ["src/dados/recife/transitoGerado.ts"] },
  { id: "chuva", script: "scripts/dados/chuva/rodar-chuva.mjs", publicacoes: ["chuva"], gerados: ["src/dados/recife/chuvaGerado.ts"] },
  { id: "noite", script: "scripts/dados/noite/rodar-noite.mjs", publicacoes: [], gerados: ["src/dados/recife/noiteGerado.ts"] },
  { id: "procura", script: "scripts/dados/transito/onde-procurar.mjs", publicacoes: [], gerados: ["src/dados/recife/procuraGerado.ts"] },
  // Recortes solares (VE07): só arquivos locais (.cache/sol-fontes, hashes no relatório de geometrias).
  { id: "sol", python: "scripts/dados/preparar-sol-recife.py", publicacoes: [], gerados: ["src/dados/sol/fontesGeradas.ts"] },
];
const PUBLICACOES = [...new Set(PASSOS.flatMap((p) => p.publicacoes))];
const GERADOS = camadas.MODULOS_GERADOS.map((m) => `src/dados/${m}`);

// ——— Estado: módulos gerados, ponteiros e arquivos de camada que o app lê ————————————————————————————————
function estado() {
  const gerados = Object.fromEntries(GERADOS.map((g) => [g, readFileSync(join(RAIZ, g), "utf8")]));
  const ponteiros = Object.fromEntries(PUBLICACOES.map((p) => [p, ponteiroAtual(PUB, p)]));
  const arquivos = Object.fromEntries(camadas.caminhosDeCamada(RAIZ).map((c) => [c, sha(readFileSync(join(RAIZ, "src/dados", c)))]));
  return { em: new Date().toISOString(), areas: [...AREAS], gerados, ponteiros, arquivos };
}

/** Problemas no estado atual: versão ativa que não confere, arquivo do app ausente, sobra de escrita interrompida. */
export function conferir() {
  const problemas = [];
  for (const p of PUBLICACOES) {
    const pt = ponteiroAtual(PUB, p);
    if (!pt) { problemas.push(`${p}: sem versão ativa`); continue; }
    const v = verificarVersao(PUB, p, pt.versao);
    for (const x of v.problemas) problemas.push(`${p}@${pt.versao}: ${x}`);
    for (const t of restosTemporarios(PUB, p)) problemas.push(`${p}: sobra temporária ${t} (nunca lida como versão)`);
  }
  const r = camadas.publicarCamadas({ conferir: true });
  for (const x of r.problemas) problemas.push(`camadas: ${x}`);
  return problemas;
}

// ——— Impressão das entradas (para pular passos sem mudança) ————————————————————————————————————————————
function listar(dir, filtro = () => true) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const n of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, n.name);
    if (n.isDirectory()) { if (n.name !== "testes" && n.name !== "__pycache__") out.push(...listar(p, filtro)); } else if (filtro(p)) out.push(p);
  }
  return out.sort();
}
function impressaoDasEntradas() {
  const h = createHash("sha256");
  // Código: conteúdo inteiro (pequeno). Dados brutos: tamanho + data de modificação (grandes; uma nova cópia muda a data).
  const codigo = [...listar(join(RAIZ, "scripts/dados"), (p) => /\.(mjs|cjs|json|py)$/.test(p) && !p.includes("/ciclo")), ...listar(join(RAIZ, "src/dados/transito")),
    join(RAIZ, "src/dados/observacao.ts")];
  for (const f of codigo) h.update(`${relative(RAIZ, f)}\0${sha(readFileSync(f))}\n`);
  const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8"))[1];
  const dados = [...listar(join(RAIZ, ".cache/osm")), ...listar(join(RAIZ, ".cache/dados-recife")), ...listar(join(RAIZ, ".cache/observacoes/brutos")),
    join(RAIZ, "docs/dados/raw/transporte/gtfs.zip"), ...listar(join(RAIZ, "src/dados/recife", dir)), join(RAIZ, "src/dados/recife/referencias-publicas.json"),
    ...listar(join(RAIZ, "docs/aplicacao/evaluation-sets"), (p) => p.endsWith(".json"))];
  for (const f of dados) { const s = statSync(f); h.update(`${relative(RAIZ, f)}\0${s.size}\0${s.mtimeMs}\n`); }
  return h.digest("hex");
}
// Só as versões ativas entram na chave: anotações do ponteiro (hora de ativação, restauração) não mudam o dado.
const versoesAtivas = (e) => Object.fromEntries(Object.entries(e.ponteiros).map(([p, pt]) => [p, pt?.versao ?? null]));
const chaveDoPasso = (passo, entradas, e) => sha(JSON.stringify([passo.id, entradas, versoesAtivas(e), e.gerados]));
const saidaDoPasso = (passo, e) => sha(JSON.stringify([passo.publicacoes.map((p) => e.ponteiros[p]?.versao ?? null), passo.gerados.map((g) => e.gerados[g])]));

// ——— O que muda para a pessoa: prédios por área e camada ————————————————————————————————————————————————
const CAMADA = /^recife\/(essenciais|transito|chuva|noite)\/[0-9a-f]{16}\/([a-z-]+)\.json$/;
function porCamada(e) {
  const m = {};
  for (const c of Object.keys(e.arquivos)) { const x = CAMADA.exec(c); if (x && x[2] !== "grade") (m[x[1]] ??= {})[x[2]] = c; }
  return m;
}
function predios(caminho) {
  try { return JSON.parse(readFileSync(join(RAIZ, "src/dados", caminho), "utf8")).predios ?? {}; } catch { return null; }
}
export function diferencaParaAPessoa(antes, depois) {
  const a = porCamada(antes), d = porCamada(depois), out = {};
  for (const camada of new Set([...Object.keys(a), ...Object.keys(d)])) {
    for (const area of new Set([...Object.keys(a[camada] ?? {}), ...Object.keys(d[camada] ?? {})])) {
      const ca = a[camada]?.[area], cd = d[camada]?.[area];
      const r = { arquivoIgual: !!ca && !!cd && antes.arquivos[ca] === depois.arquivos[cd], novos: 0, removidos: 0, alterados: 0, iguais: 0 };
      if (!r.arquivoIgual) {
        const pa = ca ? predios(ca) ?? {} : {}, pd = cd ? predios(cd) ?? {} : {};
        for (const id of new Set([...Object.keys(pa), ...Object.keys(pd)])) {
          if (!(id in pa)) r.novos++; else if (!(id in pd)) r.removidos++;
          else if (JSON.stringify(pa[id]) === JSON.stringify(pd[id])) r.iguais++; else r.alterados++;
        }
      } else r.iguais = Object.keys(predios(cd) ?? {}).length;
      (out[camada] ??= {})[area] = r;
    }
  }
  // Sol: recorte por área (sem prédios); conta só se o arquivo é novo, igual ou mudou.
  const sol = (e) => Object.fromEntries(Object.keys(e.arquivos).map((c) => /^sol\/recortes\/([a-z-]+)\.json$/.exec(c)).filter(Boolean).map((x) => [x[1], e.arquivos[x[0]]]));
  const sa = sol(antes), sd = sol(depois);
  for (const area of new Set([...Object.keys(sa), ...Object.keys(sd)])) (out.sol ??= {})[area] = { arquivo: !sa[area] ? "novo" : !sd[area] ? "removido" : sa[area] === sd[area] ? "igual" : "alterado" };
  return out;
}

// ——— Execução de um passo, com tempo e memória de pico ———————————————————————————————————————————————————
function rodar(passo, dirCiclo, { aoVivo, interromperApos }) {
  return new Promise((resolve) => {
    const rel = join(dirCiclo, `${passo.id}.json`);
    const args = passo.python
      ? ["-f", "%M", "python3", "-I", passo.python, "--cache", ".cache/sol-fontes", "--bairros", ...AREAS]
      : ["-f", "%M", process.execPath, "--max-old-space-size=8000", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", passo.script, "--relatorio", rel];
    if (aoVivo && passo.aoVivo) args.push("--ao-vivo");
    const t0 = Date.now();
    // Grupo de processos próprio: a interrupção mata o pipeline inteiro (o /usr/bin/time e o node filho), não só o
    // invólucro — senão o filho órfão termina sozinho e ativa a versão (achado do VE16).
    const filho = spawn("/usr/bin/time", args, { cwd: RAIZ, stdio: ["ignore", "pipe", "pipe"], detached: true });
    let err = "";
    filho.stdout.on("data", () => {});
    filho.stderr.on("data", (b) => { err += b; if (err.length > 20000) err = err.slice(-20000); });
    let interrompido = false;
    const relogio = interromperApos != null ? setTimeout(() => { interrompido = true; process.kill(-filho.pid, "SIGKILL"); }, interromperApos * 1000) : null;
    filho.on("close", (codigo, sinal) => {
      if (relogio) clearTimeout(relogio);
      const linhas = err.trim().split("\n");
      const kb = Number(linhas.at(-1));
      const relatorio = existsSync(rel) ? JSON.parse(readFileSync(rel, "utf8")) : null;
      resolve({
        estado: interrompido ? "interrompido" : codigo === 0 ? "executado" : "falhou",
        ms: Date.now() - t0, picoMB: Number.isFinite(kb) ? Math.round(kb / 1024) : null, codigo, sinal,
        erro: codigo === 0 ? null : linhas.slice(-8).join("\n").slice(0, 2000), relatorio: relatorio ? `${passo.id}.json` : null,
      });
    });
  });
}

// ——— Idade dos dados: quando cada fonte da versão ativa foi obtida ——————————————————————————————————————
function idadeDasFontes(e) {
  const out = {};
  for (const [p, pt] of Object.entries(e.ponteiros)) {
    if (!pt) continue;
    try { out[p] = lerManifesto(PUB, p, pt.versao).fontes.map((f) => ({ fonte: f.fonte, estado: f.estado, recuperadoEm: f.recuperadoEm })); } catch { out[p] = null; }
  }
  return out;
}

async function ciclo() {
  const nome = arg("--nome");
  if (!nome || !/^[a-z0-9-]+$/.test(nome)) throw new Error("--nome <id> (minúsculas, números e hífen)");
  const dir = join(CICLOS, nome);
  if (existsSync(join(dir, "ciclo.json"))) throw new Error(`Ciclo ${nome} já registrado; use outro nome.`);
  mkdirSync(dir, { recursive: true });
  const aoVivo = process.argv.includes("--ao-vivo"), semCache = process.argv.includes("--sem-cache");
  const [passoInterrompido, segundos] = (arg("--interromper") ?? ":").split(":");
  const so = arg("--so")?.split(",") ?? null;
  const problemasAntes = conferir();
  const antes = estado();
  gravarAtomico(join(dir, "antes.json"), JSON.stringify(antes));
  const impressoesArq = join(CICLOS, "impressoes.json");
  const impressoes = existsSync(impressoesArq) ? JSON.parse(readFileSync(impressoesArq, "utf8")) : {};
  const entradas = impressaoDasEntradas();
  const passos = [];
  const t0 = Date.now();
  let parou = null;
  for (const passo of PASSOS) {
    if (so && !so.includes(passo.id)) { passos.push({ id: passo.id, estado: "fora_do_ciclo" }); continue; }
    if (parou) { passos.push({ id: passo.id, estado: "nao_rodou", motivo: `parou em ${parou}` }); continue; }
    const e = estado();
    const chave = chaveDoPasso(passo, entradas, e);
    const anterior = impressoes[passo.id];
    if (!semCache && !(aoVivo && passo.aoVivo) && anterior?.chave === chave && anterior.saida === saidaDoPasso(passo, e)) {
      passos.push({ id: passo.id, estado: "pulado", motivo: "mesmas entradas e saídas ativas da última execução" });
      continue;
    }
    const r = await rodar(passo, dir, { aoVivo, interromperApos: passo.id === passoInterrompido ? Number(segundos) : null });
    passos.push({ id: passo.id, ...r });
    console.log(JSON.stringify({ passo: passo.id, estado: r.estado, ms: r.ms, picoMB: r.picoMB }));
    if (r.estado !== "executado") { parou = passo.id; continue; }
    impressoes[passo.id] = { chave, saida: saidaDoPasso(passo, estado()), em: new Date().toISOString(), ciclo: nome };
    gravarAtomico(impressoesArq, JSON.stringify(impressoes, null, 1) + "\n");
  }
  const depois = estado();
  gravarAtomico(join(dir, "depois.json"), JSON.stringify(depois));
  const registro = {
    nome, aoVivo, semCache, areas: [...AREAS], expansao: [...AREAS_DE_EXPANSAO], inicio: antes.em, fim: depois.em, ms: Date.now() - t0,
    estado: parou ? "incompleto" : "completo", passos,
    publicacoes: Object.fromEntries(PUBLICACOES.map((p) => [p, { antes: antes.ponteiros[p]?.versao ?? null, depois: depois.ponteiros[p]?.versao ?? null }])),
    geradosAlterados: GERADOS.filter((g) => antes.gerados[g] !== depois.gerados[g]),
    arquivosDoApp: { antes: Object.keys(antes.arquivos).length, depois: Object.keys(depois.arquivos).length,
      novos: Object.keys(depois.arquivos).filter((c) => !(c in antes.arquivos)).length, saiu: Object.keys(antes.arquivos).filter((c) => !(c in depois.arquivos)).length,
      bytesDepois: Object.keys(depois.arquivos).reduce((s, c) => s + statSync(join(RAIZ, "src/dados", c)).size, 0) },
    paraAPessoa: diferencaParaAPessoa(antes, depois),
    idadeDasFontes: idadeDasFontes(depois),
    problemasAntes, problemasDepois: conferir(),
  };
  gravarAtomico(join(dir, "ciclo.json"), JSON.stringify(registro, null, 1) + "\n");
  console.log(JSON.stringify({ ciclo: nome, estado: registro.estado, ms: registro.ms, problemasDepois: registro.problemasDepois.length }));
  return registro;
}

/**
 * Volta ao estado registrado antes do ciclo (ou, com `lado = "depois"`, reaplica o estado deixado por ele): ponteiros
 * (versões conferidas), módulos gerados e arquivos publicados. Nada é escrito se algo do ponto não conferir.
 */
export function reverterCiclo(nome, lado = "antes") {
  const antes = JSON.parse(readFileSync(join(CICLOS, nome, `${lado}.json`), "utf8"));
  const t0 = Date.now();
  for (const [p, pt] of Object.entries(antes.ponteiros)) {
    if (!pt) continue;
    const { problemas } = verificarVersao(PUB, p, pt.versao);
    if (problemas.length) throw new Error(`${p}@${pt.versao} não confere: ${problemas.join("; ")}`);
  }
  for (const c of Object.keys(antes.arquivos)) {
    const arq = join(RAIZ, "src/dados", c);
    if (!existsSync(arq) || sha(readFileSync(arq)) !== antes.arquivos[c]) throw new Error(`Arquivo de camada do ponto de restauração ausente ou diferente: ${c}`);
  }
  for (const [p, pt] of Object.entries(antes.ponteiros)) if (pt) gravarAtomico(join(PUB, p, "atual.json"), JSON.stringify({ ...pt, restauradoEm: new Date().toISOString(), restauradoDoCiclo: `${nome}:${lado}` }, null, 1) + "\n");
  for (const [g, texto] of Object.entries(antes.gerados)) if (readFileSync(join(RAIZ, g), "utf8") !== texto) gravarAtomico(join(RAIZ, g), texto);
  camadas.publicarCamadas();
  const agora = estado();
  const igual = GERADOS.every((g) => agora.gerados[g] === antes.gerados[g]) && JSON.stringify(Object.keys(agora.arquivos).sort()) === JSON.stringify(Object.keys(antes.arquivos).sort());
  const r = { [lado === "antes" ? "revertido" : "reaplicado"]: nome, ms: Date.now() - t0, igualAoPontoDeRestauracao: igual, problemas: conferir() };
  console.log(JSON.stringify(r));
  return r;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--conferir")) { const p = conferir(); console.log(JSON.stringify({ problemas: p })); process.exit(p.length ? 1 : 0); }
  else if (arg("--reverter")) reverterCiclo(arg("--reverter"));
  else if (arg("--reaplicar")) reverterCiclo(arg("--reaplicar"), "depois");
  else await ciclo();
}
