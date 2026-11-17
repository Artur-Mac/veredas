// fontes.mjs — registro de fontes e status de acesso.
// Cada scraper grava aqui quando roda; o crivo lê de volta.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const FONTES_PATH = join(__dirname, "..", "..", "fontes", "fontes.json");

function load() {
  if (existsSync(FONTES_PATH)) return JSON.parse(readFileSync(FONTES_PATH, "utf8"));
  return { fontes: {} };
}

export function registrarFonte({ id, nome, url, tipo, area, status, acesso, observacoes = "" }) {
  const db = load();
  const agora = new Date().toISOString();
  db.fontes[id] = {
    ...db.fontes[id],
    id, nome, url, tipo, area, observacoes,
    status, // ok | parcial | falhou | pendente_parecer | nao_licenciada
    ultimo_acesso: agora,
    historico: [
      ...(db.fontes[id]?.historico || []).slice(-9),
      { em: agora, status, acesso, observacoes },
    ],
  };
  mkdirSync(dirname(FONTES_PATH), { recursive: true });
  writeFileSync(FONTES_PATH, JSON.stringify(db, null, 2), "utf8");
  return db.fontes[id];
}

export function listarFontes() {
  return load().fontes;
}
