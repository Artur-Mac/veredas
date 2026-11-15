// Promoção de publicações de observações (VE02.03). Cada versão é uma pasta imutável com manifesto e partições; a
// autoridade é um ponteiro (`atual.json`) trocado por rename atômico, só depois de conferir manifesto, hashes,
// compatibilidade e cobertura. Escrita interrompida ou hash errado deixam a versão anterior ativa.
//
// Estrutura: <raiz>/<publicacao>/versoes/<versao>/{manifesto.json, <partições>}, <raiz>/<publicacao>/atual.json
import { Buffer } from "node:buffer";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { esquemaManifestoDePublicacao, estadoDaPublicacao, VERSAO_DO_CONTRATO } from "../../../src/dados/observacao.ts";

export const sha256 = (b) => createHash("sha256").update(b).digest("hex");

function gravarAtomico(arquivo, conteudo) {
  const tmp = `${arquivo}.${randomUUID()}.tmp`;
  writeFileSync(tmp, conteudo);
  renameSync(tmp, arquivo);
}

export function ponteiroAtual(raiz, publicacao) {
  const p = join(raiz, publicacao, "atual.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}

export function lerManifesto(raiz, publicacao, versao) {
  return esquemaManifestoDePublicacao.parse(JSON.parse(readFileSync(join(raiz, publicacao, "versoes", versao, "manifesto.json"), "utf8")));
}

/**
 * Grava uma versão nova numa pasta temporária e só então a renomeia para `versoes/<versao>`. `aoGravar` (testes) é
 * chamado depois de cada arquivo e pode lançar para simular uma interrupção. Devolve o manifesto.
 */
export function prepararVersao(raiz, publicacao, { particoes, fontes, derivacoes, cobertura, validacao, criadoEm }, { aoGravar } = {}) {
  const base = join(raiz, publicacao);
  mkdirSync(join(base, "versoes"), { recursive: true });
  const atual = ponteiroAtual(raiz, publicacao);
  const resumo = particoes.map((p) => ({ arquivo: p.arquivo, sha256: sha256(p.conteudo), bytes: Buffer.byteLength(p.conteudo), registros: p.registros }));
  const versao = sha256(JSON.stringify({ resumo, fontes: fontes.map((f) => f.sha256), derivacoes })).slice(0, 16);
  const estado = estadoDaPublicacao(fontes);
  if (estado === "bloqueada") throw new Error("Nenhuma fonte utilizável: publicação bloqueada.");
  const manifesto = esquemaManifestoDePublicacao.parse({
    versaoDoContrato: VERSAO_DO_CONTRATO, publicacao, versao, criadoEm, versaoAnterior: atual?.versao ?? null, estado,
    fontes, derivacoes, particoes: resumo, cobertura, validacao,
  });
  const final = join(base, "versoes", versao);
  if (existsSync(final)) {
    const existente = lerManifesto(raiz, publicacao, versao);
    if (JSON.stringify(existente.particoes) !== JSON.stringify(resumo)) throw new Error("Versão já existe com outro conteúdo.");
    return existente;
  }
  const tmp = join(base, "versoes", `.${versao}.${randomUUID()}.tmp`);
  mkdirSync(tmp);
  try {
    for (const p of particoes) {
      writeFileSync(join(tmp, p.arquivo), p.conteudo);
      aoGravar?.(p.arquivo);
    }
    writeFileSync(join(tmp, "manifesto.json"), JSON.stringify(manifesto, null, 1) + "\n");
    aoGravar?.("manifesto.json");
    renameSync(tmp, final);
  } catch (e) {
    rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
  return manifesto;
}

/** Confere os arquivos da versão contra o manifesto: existência, bytes e sha256. Lista os problemas. */
export function verificarVersao(raiz, publicacao, versao) {
  const problemas = [];
  let manifesto;
  try {
    manifesto = lerManifesto(raiz, publicacao, versao);
  } catch (e) {
    return { manifesto: null, problemas: [`manifesto ilegível: ${String(e.message).slice(0, 120)}`] };
  }
  for (const p of manifesto.particoes) {
    const arq = join(raiz, publicacao, "versoes", versao, p.arquivo);
    if (!existsSync(arq)) { problemas.push(`${p.arquivo}: ausente`); continue; }
    const b = readFileSync(arq);
    if (b.length !== p.bytes) problemas.push(`${p.arquivo}: ${b.length} bytes, manifesto diz ${p.bytes}`);
    if (sha256(b) !== p.sha256) problemas.push(`${p.arquivo}: sha256 não confere`);
  }
  return { manifesto, problemas };
}

/**
 * Ativa a versão: só com manifesto íntegro, contrato compatível, estado "completa" (ou "parcial" com `aceitarParcial`
 * explícito e motivo) e sem queda de cobertura acima de `quedaMaxima` por chave em relação à versão ativa.
 */
export function ativar(raiz, publicacao, versao, { quedaMaxima = 0.2, aceitarParcial = null, agora = new Date().toISOString() } = {}) {
  const { manifesto, problemas } = verificarVersao(raiz, publicacao, versao);
  if (!manifesto || problemas.length) throw new Error(`Versão ${versao} não confere: ${problemas.join("; ")}`);
  if (manifesto.versaoDoContrato !== VERSAO_DO_CONTRATO) throw new Error("Contrato incompatível.");
  if (manifesto.estado !== "completa" && !aceitarParcial) throw new Error(`Versão ${versao} é parcial; ativar exige motivo explícito.`);
  const atual = ponteiroAtual(raiz, publicacao);
  const quedas = [];
  if (atual) {
    const anterior = lerManifesto(raiz, publicacao, atual.versao);
    for (const [chave, antes] of Object.entries(anterior.cobertura.porChave)) {
      const depois = manifesto.cobertura.porChave[chave] ?? 0;
      if (antes > 0 && (antes - depois) / antes > quedaMaxima) quedas.push(`${chave}: ${antes} → ${depois}`);
    }
    if (quedas.length) throw new Error(`Cobertura caiu além de ${Math.round(quedaMaxima * 100)}%: ${quedas.join("; ")}`);
  }
  const ponteiro = { publicacao, versao, ativadoEm: agora, anterior: atual?.versao ?? null, parcialAceita: aceitarParcial };
  gravarAtomico(join(raiz, publicacao, "atual.json"), JSON.stringify(ponteiro, null, 1) + "\n");
  return ponteiro;
}

/** Volta o ponteiro para a versão anterior, se ela ainda confere. */
export function reverter(raiz, publicacao, { agora = new Date().toISOString() } = {}) {
  const atual = ponteiroAtual(raiz, publicacao);
  if (!atual?.anterior) throw new Error("Não há versão anterior registrada.");
  const { problemas } = verificarVersao(raiz, publicacao, atual.anterior);
  if (problemas.length) throw new Error(`Versão anterior não confere: ${problemas.join("; ")}`);
  const anteriorDoAnterior = (() => {
    try { return lerManifesto(raiz, publicacao, atual.anterior).versaoAnterior; } catch { return null; }
  })();
  const ponteiro = { publicacao, versao: atual.anterior, ativadoEm: agora, anterior: anteriorDoAnterior, parcialAceita: null, revertidaDe: atual.versao };
  gravarAtomico(join(raiz, publicacao, "atual.json"), JSON.stringify(ponteiro, null, 1) + "\n");
  return ponteiro;
}

/** Pastas temporárias deixadas por uma escrita interrompida (nunca são lidas como versão). */
export function restosTemporarios(raiz, publicacao) {
  const p = join(raiz, publicacao, "versoes");
  return existsSync(p) ? readdirSync(p).filter((n) => n.endsWith(".tmp")) : [];
}
