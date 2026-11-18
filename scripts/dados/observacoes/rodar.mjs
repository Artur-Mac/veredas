// Execução do pipeline de observações (VE02): replay dos brutos arquivados da Defesa Civil 2020–2024, vínculo à malha
// oficial, publicação versionada com ativação atômica, snapshots do GTFS e do extrato OSM datado, e relatório de saúde.
//
//   node scripts/dados/observacoes/rodar.mjs [--ao-vivo] [--publicacoes <pasta>] [--relatorio <arquivo.json>]
//
// --ao-vivo faz até 2 requisições ao CKAN da Prefeitura (sonda da Defesa Civil 2024) e 2 ao Geofabrik. Sem a opção,
// nada sai da máquina. Publica em .cache/publicacoes/ (fora do git); o app não lê esta publicação ainda (VE06).
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { get } from "../http.mjs";
import { classificarColeta, esquemaSnapshotDaFonte, VERSAO_DO_CONTRATO } from "../../../src/dados/observacao.ts";
import { coletarDatastore } from "./coleta.mjs";
import { ANALISADOR_DEFESA_CIVIL, normalizarDefesaCivil } from "./defesaCivil.mjs";
import { ANALISADOR_GEOFABRIK, escolherExtrato, lerListagem, lerPaginaDaRegiao, observacoesDaListagem } from "./geofabrik.mjs";
import { resumirFeed } from "./gtfs.mjs";
import { ativar, ponteiroAtual, prepararVersao, verificarVersao } from "./publicar.mjs";
import { criarIndiceDeRuas, VERSAO_DO_VINCULO, vincularRua } from "./vinculo.mjs";

const arg = (n, padrao) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : padrao; };
const AO_VIVO = process.argv.includes("--ao-vivo");
const RAIZ = process.cwd();
const CACHE = join(RAIZ, ".cache/dados-recife");
const BRUTOS = join(RAIZ, ".cache/observacoes/brutos");
const PUBLICACOES = resolve(arg("--publicacoes", join(RAIZ, ".cache/publicacoes")));
const RELATORIO = arg("--relatorio", null);
const CKAN = "https://dados.recife.pe.gov.br";
const RECURSOS = { 2020: "a2e18f69-9d10-4482-8f5f-04bc7bd2e8e7", 2021: "bf6f5af8-3556-425c-bfec-0eddccdeeb73", 2022: "10203dd4-9052-4a76-95eb-fd858aa053d4", 2023: "921d87c7-5ace-4856-9e3f-c31521259c36", 2024: "7c7bb871-3906-4d82-8993-857c9e6f137b" };
const PILOTO = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];
const TERMOS_PCR = { licenca: "ODbL", retencao: "arquivar", atribuicao: "Prefeitura da Cidade do Recife · Secretaria Executiva de Defesa Civil" };

const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const segundos = (d) => new Date(Math.floor(d.getTime() / 1000) * 1000).toISOString().replace(".000Z", "Z");
const agora = segundos(new Date());
const t0 = Date.now();
const saude = { executadoEm: agora, aoVivo: AO_VIVO, contrato: VERSAO_DO_CONTRATO, fontes: [], publicacao: null, rede: null, transporte: null, coletoresOverpass: null, custos: { gastoReais: 0, minutosDeRevisao: 0 } };

function arquivarBruto(origem, hash) {
  mkdirSync(BRUTOS, { recursive: true });
  const destino = join(BRUTOS, `${hash}.json`);
  if (!existsSync(destino)) {
    copyFileSync(origem, `${destino}.tmp`);
    if (sha256(readFileSync(`${destino}.tmp`)) !== hash) throw new Error(`Cópia do bruto ${origem} não confere.`);
    renameSync(`${destino}.tmp`, destino);
  }
  return destino;
}

// ——— 1. Vínculo: malha oficial + bairros ————————————————————————————————————————————————
const tIndice = Date.now();
const trechosPath = join(CACHE, "trechos-de-logradouros.geojson");
const indice = criarIndiceDeRuas(JSON.parse(readFileSync(trechosPath, "utf8")), JSON.parse(readFileSync(join(CACHE, "bairros-do-recife.geojson"), "utf8")));
const msIndice = Date.now() - tIndice;
const vincular = (rua, bairro) => vincularRua(indice, rua, bairro);

// ——— 2. Defesa Civil: replay dos brutos arquivados ————————————————————————————————————————
const particoes = [];
const fontesDoManifesto = [];
const quarentenaTotal = [];
const porChave = {};
let totalAceitas = 0;
const verificacoes = [];
for (const ano of Object.keys(RECURSOS).map(Number)) {
  const tFonte = Date.now();
  const arquivo = join(CACHE, `defesa-civil-${ano}.json`);
  const fonte = `defesa_civil_${ano}`;
  const bruto = readFileSync(arquivo);
  const hash = sha256(bruto);
  arquivarBruto(arquivo, hash);
  const cache = JSON.parse(bruto.toString("utf8"));
  const recuperadoEm = segundos(statSync(arquivo).mtime);
  const n = normalizarDefesaCivil(cache.registros, { fonte, snapshotSha256: hash, recuperadoEm, anoDoRecurso: ano, vincular });
  if (ano === 2022) {
    const n2 = normalizarDefesaCivil(cache.registros, { fonte, snapshotSha256: hash, recuperadoEm, anoDoRecurso: ano, vincular });
    const igual = sha256(JSON.stringify(n.observacoes)) === sha256(JSON.stringify(n2.observacoes)) && sha256(JSON.stringify(n.quarentena)) === sha256(JSON.stringify(n2.quarentena));
    verificacoes.push({ nome: "replay_deterministico_2022", ok: igual, detalhe: `mesma entrada e versão do analisador, duas execuções: ${igual ? "saídas idênticas" : "saídas diferentes"}` });
  }
  const { estado, motivo } = classificarColeta({ erro: null, declarados: cache.total, lidos: cache.registros.length, aceitos: n.observacoes.length, paginasFaltando: 0 });
  const snapshot = esquemaSnapshotDaFonte.parse({
    versaoDoContrato: VERSAO_DO_CONTRATO, fonte, url: `${CKAN}/api/3/action/datastore_search?resource_id=${RECURSOS[ano]}`, recuperadoEm,
    periodoDeReferencia: { de: `${ano}-01-01`, ate: `${ano}-12-31` }, tipoDeMidia: "application/json", sha256: hash, bytes: bruto.length,
    analisador: ANALISADOR_DEFESA_CIVIL, termos: TERMOS_PCR, escala: "rua", precisaoDaData: "dia", estado, motivo,
    contagens: { requisicoes: 0, registrosDeclarados: cache.total, registrosLidos: cache.registros.length, observacoes: n.observacoes.length, quarentena: n.quarentena.length },
  });
  const conteudo = gzipSync(Buffer.from(n.observacoes.map((o) => JSON.stringify(o)).join("\n") + "\n"), { level: 9 });
  particoes.push({ arquivo: `defesa-civil-${ano}.ndjson.gz`, conteudo, registros: n.observacoes.length });
  quarentenaTotal.push(...n.quarentena);
  fontesDoManifesto.push({ fonte, sha256: hash, estado, analisador: `${ANALISADOR_DEFESA_CIVIL.nome}@${ANALISADOR_DEFESA_CIVIL.versao}`, recuperadoEm });
  for (const o of n.observacoes) {
    const a = `ano_administrativo:${o.tempos.administrativo.slice(0, 4)}`;
    porChave[a] = (porChave[a] ?? 0) + 1;
    const b = o.entidades.find((e) => e.tipo === "bairro")?.id;
    if (b && PILOTO.includes(b)) porChave[`bairro:${b}`] = (porChave[`bairro:${b}`] ?? 0) + 1;
  }
  totalAceitas += n.observacoes.length;
  const categoriaConhecida = n.observacoes.filter((o) => o.estadoDoValor === "conhecido").length;
  saude.fontes.push({
    fonte, tipo: "arquivo/API municipal (CKAN datastore), replay do bruto arquivado", snapshot,
    etapas: {
      descobertos: cache.total, capturados: cache.registros.length, analisados: n.observacoes.length,
      vinculados: n.contagens.vinculadas, elegiveis: categoriaConhecida, publicados: n.observacoes.length,
    },
    vinculo: { nomeEBairro: n.contagens.vinculadas, ambiguos: n.contagens.ambiguas, semVinculo: n.contagens.semVinculo },
    layouts: n.contagens.layouts, anoDiferenteDoRecurso: n.contagens.anoDiferenteDoRecurso, mesmoDiaRuaECategoria: n.contagens.mesmoDiaRuaECategoria,
    quarentenaPorMotivo: n.quarentena.reduce((m, q) => ({ ...m, [q.motivo]: (m[q.motivo] ?? 0) + 1 }), {}),
    idadeDaFonteDias: Math.floor((Date.parse(agora) - Date.parse(recuperadoEm)) / 86_400_000),
    msDeExecucao: Date.now() - tFonte,
  });
}
particoes.push({ arquivo: "quarentena.ndjson.gz", conteudo: gzipSync(Buffer.from(quarentenaTotal.map((q) => JSON.stringify(q)).join("\n") + "\n"), { level: 9 }), registros: quarentenaTotal.length });
particoes.push({ arquivo: "snapshots.json", conteudo: Buffer.from(JSON.stringify(saude.fontes.map((f) => f.snapshot), null, 1) + "\n"), registros: saude.fontes.length });
const motivos = quarentenaTotal.reduce((m, q) => ({ ...m, [q.motivo]: (m[q.motivo] ?? 0) + 1 }), {});
verificacoes.push({ nome: "layouts_por_ano", ok: true, detalhe: saude.fontes.map((f) => `${f.fonte}: ${f.layouts.alinhado} alinhadas, ${f.layouts.deslocado} deslocadas`).join("; ") });
const vinc = saude.fontes.reduce((s, f) => s + f.etapas.vinculados, 0);
verificacoes.push({ nome: "vinculo_a_malha_oficial", ok: vinc > 0, detalhe: `${vinc} de ${totalAceitas} observações com código de logradouro (regra nome+bairro, sem revisão humana)` });

// ——— 3. Publicação versionada ————————————————————————————————————————————————————————
const tPub = Date.now();
const manifesto = prepararVersao(PUBLICACOES, "defesa-civil", {
  particoes, fontes: fontesDoManifesto,
  derivacoes: [{ nome: ANALISADOR_DEFESA_CIVIL.nome, versao: ANALISADOR_DEFESA_CIVIL.versao }, { nome: "vinculo_nome_e_bairro", versao: VERSAO_DO_VINCULO }],
  cobertura: { denominador: "observações aceitas por ano administrativo e por bairro do piloto", total: totalAceitas, porChave },
  validacao: { quarentena: quarentenaTotal.length, motivos, verificacoes }, criadoEm: agora,
});
const ativo = ponteiroAtual(PUBLICACOES, "defesa-civil");
const ponteiro = ativo?.versao === manifesto.versao ? ativo : ativar(PUBLICACOES, "defesa-civil", manifesto.versao, { agora });
const conferencia = verificarVersao(PUBLICACOES, "defesa-civil", ponteiro.versao);
saude.publicacao = {
  publicacao: "defesa-civil", versao: manifesto.versao, estado: manifesto.estado, ativa: ponteiro.versao, anterior: ponteiro.anterior ?? null,
  particoes: manifesto.particoes, problemasNaConferencia: conferencia.problemas, bytesTotais: manifesto.particoes.reduce((s, p) => s + p.bytes, 0),
  msDePublicacao: Date.now() - tPub,
};

// ——— 4. Rede: extrato OSM datado (listagem HTML do Geofabrik) ————————————————————————————————
const pbf = join(RAIZ, ".cache/osm/nordeste-261113.osm.pbf");
const rede = { arquivoArquivado: existsSync(pbf) ? ".cache/osm/nordeste-261113.osm.pbf" : null };
if (existsSync(pbf)) {
  const md5 = readFileSync(`${pbf}.md5`, "utf8").split(/\s+/)[0];
  const b = readFileSync(pbf);
  rede.bytes = b.length;
  rede.md5Publicado = md5;
  rede.md5Confere = createHash("md5").update(b).digest("hex") === md5;
  rede.sha256 = sha256(b);
}
if (AO_VIVO) {
  const tRede = Date.now();
  const urlLista = "https://download.geofabrik.de/south-america/brazil/";
  const urlRegiao = "https://download.geofabrik.de/south-america/brazil/nordeste.html";
  try {
    const lista = (await get(urlLista, { cache: false })).text;
    const regiao = (await get(urlRegiao, { cache: false })).text;
    const h = sha256(lista);
    mkdirSync(BRUTOS, { recursive: true });
    writeFileSync(join(BRUTOS, `${h}.html`), lista);
    const extratos = lerListagem(lista, "nordeste");
    const escolhido = extratos ? escolherExtrato(extratos, agora.slice(0, 10)) : null;
    const obs = extratos ? observacoesDaListagem(extratos, { fonte: "geofabrik_nordeste", url: urlLista, snapshotSha256: h, recuperadoEm: agora }) : [];
    const { estado, motivo } = classificarColeta({ erro: extratos ? null : "corpo_nao_e_dados", declarados: null, lidos: extratos?.length ?? 0, aceitos: obs.length, paginasFaltando: 0 });
    rede.snapshot = esquemaSnapshotDaFonte.parse({
      versaoDoContrato: VERSAO_DO_CONTRATO, fonte: "geofabrik_nordeste", url: urlLista, recuperadoEm: agora, periodoDeReferencia: null,
      tipoDeMidia: "text/html", sha256: h, bytes: Buffer.byteLength(lista), analisador: ANALISADOR_GEOFABRIK,
      termos: { licenca: "ODbL (dados OSM)", retencao: "arquivar", atribuicao: "© OpenStreetMap contributors; extratos Geofabrik GmbH" },
      escala: "regiao", precisaoDaData: "dia", estado, motivo,
      contagens: { requisicoes: 2, registrosDeclarados: null, registrosLidos: extratos?.length ?? 0, observacoes: obs.length, quarentena: 0 },
    });
    rede.extratosDatados = extratos?.length ?? 0;
    rede.ultimoDatado = extratos?.at(-1)?.arquivo ?? null;
    rede.escolhido = escolhido?.arquivo ?? null;
    rede.escolhidoIgualAoArquivado = escolhido?.arquivo === "nordeste-261113.osm.pbf";
    rede.paginaDaRegiao = lerPaginaDaRegiao(regiao);
    rede.msDeExecucao = Date.now() - tRede;
  } catch (e) {
    rede.erro = String(e.message ?? e).slice(0, 200);
  }
}
saude.rede = rede;

// ——— 5. Transporte: um feed por execução ————————————————————————————————————————————————
const feeds = [["docs/dados/raw/transporte/gtfs.zip", "exploratório"], [".cache/dados-recife/gtfs-inspecao.zip", "usado pela camada de ruído publicada"]]
  .filter(([f]) => existsSync(join(RAIZ, f)))
  .map(([f, papel]) => ({ arquivo: f, papel, ...resumirFeed(readFileSync(join(RAIZ, f))) }));
const escolhidoFeed = [...feeds].filter((f) => f.checagens.every((c) => c.ok)).sort((a, b) => String(b.versao).localeCompare(String(a.versao)))[0] ?? null;
saude.transporte = {
  feeds: feeds.map(({ sha256: s, ...r }) => ({ ...r, sha256: s })),
  escolhidoParaProximasExecucoes: escolhidoFeed ? { arquivo: escolhidoFeed.arquivo, versao: escolhidoFeed.versao, sha256: escolhidoFeed.sha256 } : null,
  observacao: "A camada de ruído publicada continua gerada do feed v2026.10.16 (sem exceções de calendário); a regeração por data e direção é do VE05.",
};

// ——— 6. Sonda ao vivo do CKAN (orçamento 2): prova o caminho de coleta e a identidade do bruto arquivado ——————————
if (AO_VIVO) {
  const tSonda = Date.now();
  // Mesma lista branca da camada "A rua" (scripts/dados/rua/camadas.mjs): nunca as medidas do imóvel.
  const CAMPOS = ["Regional", "Ano", "Mês", "Data", "Ocorrencia", "Solicitacao", "Endereco", "Bairro"];
  const r = await coletarDatastore({ base: CKAN, recurso: RECURSOS[2024], campos: CAMPOS, limite: 500, orcamento: 2 });
  const arquivado = JSON.parse(readFileSync(join(CACHE, "defesa-civil-2024.json"), "utf8"));
  // O bruto arquivado não guarda `_id` (a coleta antiga pediu só os campos); compara pelo conteúdo da linha.
  const chave = (x) => [x.Data, x.Endereco, x.Bairro, x.Ocorrencia, x.Solicitacao].join("|");
  const noArquivo = new Map();
  for (const x of arquivado.registros) noArquivo.set(chave(x), (noArquivo.get(chave(x)) ?? 0) + 1);
  let iguais = 0;
  for (const x of r.registros) {
    const n = noArquivo.get(chave(x)) ?? 0;
    if (n > 0) { iguais += 1; noArquivo.set(chave(x), n - 1); }
  }
  const colunasRecebidas = r.registros[0] ? Object.keys(r.registros[0]).sort() : [];
  const { estado, motivo } = classificarColeta({ erro: r.erro, declarados: r.declarados, lidos: r.registros.length, aceitos: r.registros.length, paginasFaltando: r.paginasFaltando });
  saude.sondaAoVivo = {
    fonte: "defesa_civil_2024", requisicoes: r.requisicoes, bytes: r.bytes, declaradosAgora: r.declarados, declaradosNoArquivo: arquivado.total,
    lidos: r.registros.length, estado, motivo: motivo ?? r.erro, linhasComMesmoConteudoNoArquivo: iguais, colunasRecebidas, ms: Date.now() - tSonda,
  };
}

// ——— 7. Coletores Overpass ————————————————————————————————————————————————————————————
saude.coletoresOverpass = {
  estado: "reparados e cobertos por testes offline; não executados contra a Overpass nesta época",
  motivo: "o plano prefere um extrato regional datado a várias consultas por categoria; o extrato foi arquivado (seção rede)",
};
saude.msTotais = Date.now() - t0;
saude.msIndiceDeRuas = msIndice;
const saida = JSON.stringify(saude, null, 1) + "\n";
if (RELATORIO) writeFileSync(RELATORIO, saida);
console.log(JSON.stringify({ versao: manifesto.versao, estado: manifesto.estado, ativa: ponteiro.versao, aceitas: totalAceitas, quarentena: quarentenaTotal.length, msTotais: saude.msTotais }));
