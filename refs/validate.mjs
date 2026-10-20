// Confere refs/references.json e lista o que falta analisar.
// Uso: node refs/validate.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const arquivo = path.join(path.dirname(fileURLToPath(import.meta.url)), 'references.json');
const manifesto = JSON.parse(readFileSync(arquivo, 'utf8'));
const status = Object.keys(manifesto.accessStatusVocabulary);
const obrigatorios = ['id', 'slug', 'title', 'creator', 'type', 'originalUrl', 'accessibleSupportingUrls', 'accessStatus', 'accessLog', 'evidenceInspected', 'visualTechniques', 'technicalTechniques', 'proposedUseInVereda', 'analysis'];
const erros = [];
const vistos = new Set();

for (const ref of manifesto.references) {
  for (const campo of obrigatorios) if (!(campo in ref)) erros.push(`${ref.id ?? '?'}: falta o campo ${campo}`);
  if (!/^REF-\d{2,}$/.test(ref.id)) erros.push(`${ref.id}: id fora do padrão REF-NN`);
  if (vistos.has(ref.id)) erros.push(`${ref.id}: id repetido`);
  vistos.add(ref.id);
  if (!status.includes(ref.accessStatus)) erros.push(`${ref.id}: accessStatus desconhecido (${ref.accessStatus})`);
  if (ref.accessStatus === 'available_inspected' && !ref.accessLog?.length) erros.push(`${ref.id}: available_inspected sem accessLog`);
  if (ref.analysis?.status === 'analyzed' && ref.accessStatus === 'not_inspected') erros.push(`${ref.id}: analisada mas não inspecionada`);
}

const ids = manifesto.references.map((r) => Number(r.id.slice(4)));
const proximo = `REF-${String(Math.max(...ids) + 1).padStart(2, '0')}`;
const pendentes = manifesto.references.filter((r) => r.analysis?.status !== 'analyzed');

if (erros.length) {
  console.error(erros.join('\n'));
  process.exit(1);
}
console.log(`${manifesto.references.length} referências válidas. Próximo id: ${proximo}.`);
console.log(pendentes.length ? `Pendentes de análise: ${pendentes.map((r) => r.id).join(', ')}` : 'Nenhuma pendente.');
