// Verificação offline. Não baixa nem atualiza modelos silenciosamente.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const raiz=path.resolve('public/ocr');
const manifesto=JSON.parse(await fs.readFile(path.join(raiz,'manifesto.json'),'utf8'));
for(const [nome,v] of Object.entries(manifesto.arquivos)) {
 assert(!nome.includes('..')&&!path.isAbsolute(nome),'Caminho de recurso inválido');
 const bytes=await fs.readFile(path.join(raiz,nome));
 assert.equal(bytes.length,v.bytes,nome+': tamanho');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),v.sha256,nome+': hash');
}
const instalado=JSON.parse(await fs.readFile('node_modules/tesseract.js/package.json','utf8'));
assert.equal(manifesto.motor,'tesseract.js '+instalado.version,'Motor instalado difere dos recursos congelados');
for(const nome of ['tesseract.min.js','worker.min.js'])
 assert.deepEqual(await fs.readFile(path.join(raiz,nome)),await fs.readFile('node_modules/tesseract.js/dist/'+nome),nome+': pacote diferente');
console.log(`${Object.keys(manifesto.arquivos).length} recursos OCR locais íntegros; motor ${instalado.version}.`);
