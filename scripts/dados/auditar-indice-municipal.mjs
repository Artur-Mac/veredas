// Auditoria do staging do índice municipal (.cache/dados-recife/indice-municipal-staging), antes de ativar.
//
//   node scripts/dados/auditar-indice-municipal.mjs --saida <auditoria.json> [--diff <diff.json>]
//
// Grava o arquivo que scripts/dados/ativar-indice-municipal.mjs exige (VEREDA_AUDITORIA_MUNICIPAL): por partição, o
// número de edifícios e unidades, o controle geométrico (centro do edifício dentro do polígono do próprio lote), bytes e
// SHA-256; colisões de id entre bairros; bairros sem edifício; partições acima de 2 MB. Também confere, em cada
// partição, que nenhuma coluna pessoal aparece no texto (lista branca LGPD) e compara com a versão ativa (--diff):
// ids que entram, que saem e que mudam, por bairro. Não altera nada.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();
const STAGING = join(RAIZ, ".cache/dados-recife/indice-municipal-staging");
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const sha = (b) => createHash("sha256").update(b).digest("hex");
const LIMITE = 2_000_000;

/** Termos que nunca podem aparecer num arquivo publicado (nomes de coluna pessoais e campos de identificação). */
export const TERMOS_PROIBIDOS = [
  "cnpj", "razao_social", "razao social", "inscricao_mercantil", "inscrição mercantil", "Número do contribuinte",
  "numero do contribuinte", "CPF/CNPJ", "contribuinte", "complemento", "Protocolo", "endereco_empreendimento",
];

export function termosProibidosNoTexto(texto) {
  const t = texto.toLowerCase();
  return TERMOS_PROIBIDOS.filter((x) => t.includes(`"${x.toLowerCase()}"`) || t.includes(`"${x.toLowerCase()}":`));
}

function dentro([x, y], poligono) {
  let c = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [x1, y1] = poligono[i], [x2, y2] = poligono[j];
    if ((y1 > y) !== (y2 > y) && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) c = !c;
  }
  return c;
}

function auditar() {
  const arquivos = readdirSync(STAGING).filter((n) => n.endsWith(".json") && n !== "meta.json" && n !== "coleta-iptu.json").sort();
  const particoes = [];
  const donos = new Map();
  const proibidos = [];
  for (const nome of arquivos) {
    const bytes = readFileSync(join(STAGING, nome));
    const texto = bytes.toString("utf8");
    const termos = termosProibidosNoTexto(texto);
    if (termos.length) proibidos.push({ bairro: nome.replace(/\.json$/, ""), termos });
    const d = JSON.parse(texto);
    const comPoligono = d.edificios.filter((e) => e.poligono).length;
    const centrosInternos = d.edificios.filter((e) => e.poligono && dentro(e.centro, e.poligono)).length;
    for (const e of d.edificios) donos.set(e.id, [...(donos.get(e.id) ?? []), d.bairro]);
    particoes.push({
      bairro: d.bairro,
      edificios: d.edificios.length,
      unidades: d.edificios.reduce((s, e) => s + e.unidades, 0),
      geometria: { comPoligono, centrosInternos, fracaoInterna: comPoligono ? centrosInternos / comPoligono : null },
      bytes: bytes.length,
      sha256: sha(bytes),
    });
  }
  const colisoesEntreBairros = [...donos].filter(([, bs]) => bs.length > 1).map(([id, bs]) => ({ id, bairros: bs }));
  const meta = readFileSync(join(STAGING, "meta.json"), "utf8");
  const termosMeta = termosProibidosNoTexto(meta);
  if (termosMeta.length) proibidos.push({ bairro: "meta.json", termos: termosMeta });
  if (proibidos.length) throw new Error(`Coluna pessoal no staging: ${JSON.stringify(proibidos)}`);
  return {
    estado: "staging auditado: estrutura, geometria, colisões, tamanho e lista branca",
    particoes,
    colisoesEntreBairros,
    semEdificios: particoes.filter((p) => p.edificios === 0).map((p) => p.bairro),
    acimaDe2MB: particoes.filter((p) => p.bytes > LIMITE).map((p) => p.bairro),
  };
}

/** Diferenças entre o staging e a versão ativa: ids novos, saídos e alterados, e o que mudou neles. */
function comparar() {
  const pub = readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8");
  const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(pub)[1];
  const ativo = join(RAIZ, "src/dados/recife", dir);
  const porBairro = {};
  const totais = { novos: 0, saidos: 0, alterados: 0, iguais: 0, campos: {} };
  for (const nome of readdirSync(ativo).filter((n) => n.endsWith(".json") && n !== "meta.json" && n !== "cobertura.json")) {
    const novo = join(STAGING, nome);
    if (!existsSync(novo)) continue;
    const a = JSON.parse(readFileSync(join(ativo, nome), "utf8")), b = JSON.parse(readFileSync(novo, "utf8"));
    const ma = new Map(a.edificios.map((e) => [e.id, e])), mb = new Map(b.edificios.map((e) => [e.id, e]));
    const novos = [...mb.keys()].filter((id) => !ma.has(id)), saidos = [...ma.keys()].filter((id) => !mb.has(id));
    let alterados = 0;
    for (const [id, e] of mb) {
      const v = ma.get(id);
      if (!v) continue;
      const campos = Object.keys({ ...e, ...v }).filter((k) => JSON.stringify(e[k]) !== JSON.stringify(v[k]));
      if (campos.length) {
        alterados++;
        for (const c of campos) totais.campos[c] = (totais.campos[c] ?? 0) + 1;
      } else totais.iguais++;
    }
    totais.novos += novos.length; totais.saidos += saidos.length; totais.alterados += alterados;
    porBairro[b.bairro] = { antes: ma.size, depois: mb.size, novos: novos.slice(0, 20), saidos: saidos.slice(0, 20), nNovos: novos.length, nSaidos: saidos.length, alterados, obrasAntes: a.obras.length, obrasDepois: b.obras.length, obrasComLicenca: b.obras.filter((o) => o.licenca).length };
  }
  return { ativo: dir, totais, porBairro };
}

const saida = arg("--saida");
if (!saida) throw new Error("Use --saida <arquivo.json>");
const auditoria = auditar();
writeFileSync(saida, JSON.stringify(auditoria, null, 1) + "\n");
const diff = arg("--diff");
if (diff) writeFileSync(diff, JSON.stringify(comparar(), null, 1) + "\n");
console.log(JSON.stringify({ particoes: auditoria.particoes.length, colisoes: auditoria.colisoesEntreBairros.length, semEdificios: auditoria.semEdificios.length, acimaDe2MB: auditoria.acimaDe2MB }, null, 1));
