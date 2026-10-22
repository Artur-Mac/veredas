// Ativação somente no checkout local. Não publica site, API ou infraestrutura remota.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cache = path.join(raiz, ".cache/dados-recife");
const pasta = path.join(raiz, "src/dados/recife");
const registro = path.join(pasta, "publicacaoGerada.ts");
const anterior = path.join(cache, "publicacao-anterior.ts");
const hash = texto => createHash("sha256").update(texto).digest("hex");
if (process.argv.includes("--reverter")) {
  if (!fs.existsSync(anterior)) throw new Error("Não há versão anterior registrada.");
  const texto = fs.readFileSync(anterior, "utf8");
  for (const m of texto.matchAll(/require\("(.+?\.json)"\)/g)) if (!fs.existsSync(path.resolve(pasta, m[1]))) throw new Error("Arquivo da versão anterior não encontrado.");
  fs.writeFileSync(registro + ".tmp", texto); fs.renameSync(registro + ".tmp", registro);
  console.log("Índice local anterior reativado; caderno não foi alterado.");
} else {
  const auditoria = JSON.parse(fs.readFileSync(path.join(raiz, "docs/plano-recife/execucoes/municipal-validacao.json"), "utf8"));
  if (auditoria.particoes.length !== 94 || auditoria.colisoesEntreBairros.length) throw new Error("Auditoria municipal incompleta ou com colisões.");
  const staging = path.join(cache, "indice-municipal-staging");
  for (const p of auditoria.particoes) {
    if (hash(fs.readFileSync(path.join(staging, p.bairro + ".json"))) !== p.sha256) throw new Error("O staging mudou; execute a auditoria novamente.");
  }
  const habilitadas = auditoria.particoes.filter(p => p.edificios > 0 && p.bytes <= 2000000 && p.geometria.fracaoInterna >= 0.95);
  const iniciais = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];
  habilitadas.sort((a, b) => {
    const ia = iniciais.indexOf(a.bairro); const ib = iniciais.indexOf(b.bairro);
    return (ia < 0 ? 100 : ia) - (ib < 0 ? 100 : ib) || a.bairro.localeCompare(b.bairro);
  });
  if (!iniciais.every(b => habilitadas.some(h => h.bairro === b))) throw new Error("Um bairro inicial não passou no controle; preservar versão anterior.");
  const metadados = fs.readFileSync(path.join(staging, "meta.json"));
  const meta = JSON.parse(metadados);
  if (!meta.fontes.every(f => f.licenca === "ODbL") || !meta.fontesDaRua?.every(f => ["ODbL", "Citar o IBGE"].includes(f.licenca))) throw new Error("Licenças inconsistentes.");
  const idVersao = hash(metadados.toString() + habilitadas.map(p => p.sha256).join("")).slice(0, 16);
  const diretorio = `indice-municipal/${idVersao}`;
  const destino = path.join(pasta, diretorio);
  fs.mkdirSync(destino, { recursive: true });
  const coberturas = auditoria.particoes.map(p => {
    const grafias = [];
    let registros = 0;
    for (let i = 0; i < 8; i++) {
      const c = path.join(cache, `iptu-2026-${p.bairro}-${i}.json`);
      if (!fs.existsSync(c)) break;
      const v = JSON.parse(fs.readFileSync(c, "utf8"));
      if (v.registros.length !== v.total) throw new Error("Cache incompleto.");
      grafias.push(v.consulta.filters.bairro); registros += v.total;
    }
    return { ...p, grafias, registrosIptu: registros, estado: habilitadas.some(h => h.bairro === p.bairro) ? "habilitado" : p.edificios === 0 ? "sem_registros_elegiveis" : "revisao_geometrica_pendente" };
  });
  const soma = coberturas.reduce((s, c) => s + c.registrosIptu, 0);
  if (soma !== meta.fontes.find(f => f.chave === "iptu_2026").registrosLidos) throw new Error("Totais de coleta e metadados divergem.");
  const gravarUmaVez = (nome, conteudo) => {
    const arquivo = path.join(destino, nome);
    if (fs.existsSync(arquivo)) {
      if (hash(fs.readFileSync(arquivo)) !== hash(conteudo)) throw new Error("Versão já existente com outro conteúdo.");
    } else fs.writeFileSync(arquivo, conteudo, { flag: "wx" });
  };
  for (const p of habilitadas) gravarUmaVez(p.bairro + ".json", fs.readFileSync(path.join(staging, p.bairro + ".json")));
  gravarUmaVez("meta.json", metadados);
  gravarUmaVez("cobertura.json", JSON.stringify({ versao: 1, geradoEm: meta.geradoEm, bairroNaoHabilitadoPermiteCaderno: true,
    nota: "Controle geométrico não é probabilidade de identificação nem validação física do edifício.", bairros: coberturas }, null, 2) + "\n");
  const nomes = habilitadas.map(p => p.bairro);
  const grafias = Object.fromEntries(coberturas.filter(c => nomes.includes(c.bairro)).map(c => [c.bairro, c.grafias]));
  const texto = `// Gerado pelo ativador local; todos os arquivos foram validados antes desta troca atômica.\n` +
    `export const DIRETORIO_DO_INDICE = ${JSON.stringify(diretorio)};\n` +
    `export const BAIRROS_HABILITADOS = ${JSON.stringify(nomes)} as const;\n` +
    `export const GRAFIAS_HABILITADAS = ${JSON.stringify(grafias)};\n` +
    `export const CARREGADORES_DO_INDICE = {\n${nomes.map(b => `  ${JSON.stringify(b)}: () => require(${JSON.stringify(`./${diretorio}/${b}.json`)}) as unknown,`).join("\n")}\n};\n` +
    `export const LER_META_PUBLICADA = () => require(${JSON.stringify(`./${diretorio}/meta.json`)}) as unknown;\n`;
  // O catálogo é a única troca de autoridade; arquivos da versão anterior ficam preservados.
  if (fs.existsSync(registro) && fs.readFileSync(registro, "utf8") !== texto) fs.copyFileSync(registro, anterior);
  fs.writeFileSync(registro + ".tmp", texto); fs.renameSync(registro + ".tmp", registro);
  console.log(JSON.stringify({ versao: idVersao, bairrosHabilitados: nomes.length, edificios: habilitadas.reduce((s, p) => s + p.edificios, 0),
    mantidosSemIndice: coberturas.filter(c => c.estado !== "habilitado").map(c => ({ bairro: c.bairro, motivo: c.estado })) }, null, 2));
}
