// Pacote das bases derivadas sob ODbL 1.0 (seções 4.4 e 4.6 da licença): monta, a partir das camadas publicadas no
// repositório, uma pasta com o índice de prédios, o mapa-base e a camada de ruído, cada uma com um LEIA-ME (fonte, data,
// licença e o script que a gera). Detalhes e local de publicação em docs/dados/ODBL.md. Não é parecer jurídico.
//
//   node scripts/dados/exportar-bases-odbl.mjs              grava em .cache/bases-odbl/ (fora do git)
//   node scripts/dados/exportar-bases-odbl.mjs --saida <pasta>
//
// Lê só o que o app embute: as versões apontadas por src/dados/recife/publicacaoGerada.ts (índice),
// mapaBaseGerado.ts (mapa-base) e ruidoGerado.ts (ruído). Não baixa nada e não altera o repositório.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const RAIZ = process.cwd();
const RECIFE = join(RAIZ, "src/dados/recife");
const LICENCA = "Open Database License (ODbL) 1.0 — https://opendatacommons.org/licenses/odbl/1-0/";
const i = process.argv.indexOf("--saida");
const SAIDA = resolve(RAIZ, i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : ".cache/bases-odbl");

const ler = (arquivo) => readFileSync(join(RECIFE, arquivo), "utf8");
const constante = (texto, nome) => {
  const m = texto.match(new RegExp(`export const ${nome}[^=]*= "([^"]+)"`));
  if (!m) throw new Error(`não achei ${nome}`);
  return m[1];
};
/** O literal JSON que segue `export const NOME ... =`, até o fechamento indicado. */
const literal = (texto, nome, fim) => {
  const ini = texto.indexOf(`export const ${nome}`);
  if (ini < 0) throw new Error(`não achei ${nome}`);
  const a = texto.indexOf("=", ini) + 1;
  const b = texto.indexOf(fim, a);
  return JSON.parse(texto.slice(a, b + fim.length));
};
const sha256 = (caminho) => createHash("sha256").update(readFileSync(caminho)).digest("hex");

const publicacao = ler("publicacaoGerada.ts");
const mapaBase = ler("mapaBaseGerado.ts");
const ruido = ler("ruidoGerado.ts");

const indiceDir = constante(publicacao, "DIRETORIO_DO_INDICE"); // indice-municipal/<sha>
const mapaVersao = constante(mapaBase, "VERSAO_DO_MAPA_BASE_GERADO");
const ruidoVersao = constante(ruido, "VERSAO_DO_RUIDO");
const meta = JSON.parse(readFileSync(join(RECIFE, indiceDir, "meta.json"), "utf8"));
const fontesDoMapa = literal(mapaBase, "FONTES_DO_MAPA_BASE", "\n]");
const fontesDoRuido = literal(ruido, "FONTES_DO_RUIDO", "\n}");

const linhaDaFonte = (f) =>
  `- ${f.nome} — ${f.orgao ?? f.conjunto ?? ""} — licença: ${f.licenca ?? "ver fonte"}` +
  `${f.modificadoEm || f.lastModified ? ` — modificado em ${String(f.modificadoEm ?? f.lastModified).slice(0, 10)}` : ""}` +
  `${f.url ? ` — ${f.url}` : f.recurso ? ` — recurso ${f.recurso} em dados.recife.pe.gov.br` : ""}`;

const comum = (script) => `
Licença: ${LICENCA}
Esta é uma base derivada (Derivative Database) distribuída sob a mesma licença (seção 4.4). Você pode copiar,
distribuir, adaptar e usar, inclusive comercialmente, desde que dê o crédito abaixo, mantenha a licença e ofereça
as suas bases derivadas também sob a ODbL. Nenhum termo do Vereda restringe esse uso.

Atribuição: Contém dados da Prefeitura do Recife (ODbL).${script.includes("ruido") ? " © colaboradores do OpenStreetMap (ODbL)." : ""}

Como foi gerada (arquivo das alterações, seção 4.6): ${script}, no repositório do Vereda. O script, com as fontes
listadas acima, refaz esta base.
`;

const BASES = [
  {
    pasta: "indice-de-predios",
    origem: indiceDir,
    leiaMe: () => `Índice de prédios do Recife (Vereda), versão ${indiceDir.split("/")[1]}
Gerado em: ${meta.geradoEm.slice(0, 10)}

Um arquivo por bairro com os prédios conhecidos (endereço, área, ano, pavimentos, licenças recentes) e meta.json com
as fontes, datas, registros lidos e colunas usadas.

Fontes:
${[...meta.fontes, ...(meta.fontesDaRua ?? [])].map(linhaDaFonte).join("\n")}
${comum("scripts/dados/construir-indice-recife.mjs e scripts/dados/ativar-indice-municipal.mjs")}`,
  },
  {
    pasta: "mapa-base",
    origem: `mapa-base/${mapaVersao}`,
    leiaMe: () => `Mapa-base do Recife (Vereda), versão ${mapaVersao}
Data dos dados: modificados no portal até ${fontesDoMapa.map((f) => f.lastModified ?? "").sort().at(-1).slice(0, 10)}

Quadras, lotes (com pavimentos), ruas com nome, água, praças, pontes e divisas, um arquivo por bairro e cidade.json.
Tudo vem das bases abertas da Prefeitura do Recife; não há dado do OpenStreetMap nesta base.

Fontes:
${fontesDoMapa.map(linhaDaFonte).join("\n")}
${comum("scripts/dados/construir-mapa-base.mjs (fontes em scripts/dados/mapa-base/fontes.mjs)")}`,
  },
  {
    pasta: "ruido",
    origem: `ruido/${ruidoVersao}`,
    leiaMe: () => `Ruído estimado por prédio no Recife (Vereda), versão ${ruidoVersao}
Data dos dados: vias do OpenStreetMap de ${fontesDoRuido.vias.dadosDe}; índice de prédios ${constante(ruido, "INDICE_DO_RUIDO")}.

Estimativa com dados abertos, não medição (dB(A) de dia e à noite por prédio), pelo método publicado pelo Mapa Sossego.

Fontes:
- ${fontesDoRuido.vias.nome} — ${fontesDoRuido.vias.atribuicao}, ${fontesDoRuido.vias.licenca} — ${fontesDoRuido.vias.url}
${["onibus", "trilho", "luse", "cnefe"].map((k) => `- ${fontesDoRuido[k].nome} — ${fontesDoRuido[k].origem}`).join("\n")}
- Prédios e LUSE: índice de prédios acima (Prefeitura do Recife, ODbL)
${comum("scripts/dados/ruido/rodar-ruido.mjs (núcleo em scripts/dados/ruido/nucleo.ts)")}`,
  },
];

rmSync(SAIDA, { recursive: true, force: true });
mkdirSync(SAIDA, { recursive: true });
const manifesto = [];
for (const b of BASES) {
  const de = join(RECIFE, b.origem);
  if (!existsSync(de)) throw new Error(`camada publicada ausente: ${relative(RAIZ, de)}`);
  const para = join(SAIDA, b.pasta);
  cpSync(de, para, { recursive: true });
  writeFileSync(join(para, "LEIA-ME.txt"), b.leiaMe(), "utf8");
  const arquivos = readdirSync(para).sort();
  for (const a of arquivos) manifesto.push(`${sha256(join(para, a))}  ${b.pasta}/${a}`);
  console.log(`${b.pasta}: ${arquivos.length} arquivos (de src/dados/recife/${b.origem})`);
}
writeFileSync(join(SAIDA, "LEIA-ME.txt"), `Bases derivadas do Vereda sob ${LICENCA}
Pastas: ${BASES.map((b) => b.pasta).join(", ")}. Cada uma tem o próprio LEIA-ME. SHA256SUMS.txt confere os arquivos.
Gerado por scripts/dados/exportar-bases-odbl.mjs. Ver docs/dados/ODBL.md no repositório do Vereda.
`, "utf8");
writeFileSync(join(SAIDA, "SHA256SUMS.txt"), manifesto.join("\n") + "\n", "utf8");
console.log(`pacote em ${relative(RAIZ, SAIDA) || SAIDA}`);
