// Pastas de versão são imutáveis (VE16). O nome da pasta é o hash das entradas; regravar um arquivo dentro dela com
// outro conteúdo quebra o ponto de restauração de um ciclo (o hash guardado deixa de bater) e engana caches. Mudou o
// conteúdo sem mudar as entradas declaradas? Isso é um erro de versão: o pipeline para em vez de sobrescrever.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

export function gravarImutavel(arquivo, texto) {
  if (existsSync(arquivo)) {
    if (readFileSync(arquivo, "utf8") === texto) return "igual";
    throw new Error(`Versão imutável: ${arquivo} já existe com outro conteúdo. Mude a versão (formato ou entradas declaradas) em vez de regravar.`);
  }
  writeFileSync(`${arquivo}.tmp`, texto);
  renameSync(`${arquivo}.tmp`, arquivo);
  return "gravado";
}
