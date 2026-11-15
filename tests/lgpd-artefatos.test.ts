// LGPD e ODbL nos artefatos publicados (15/11/2026): nenhum arquivo de camada que o app lê, nem o índice ativo, nem o
// meta.json, traz coluna pessoal (CNPJ, razão social, inscrição mercantil, número do contribuinte, CPF/CNPJ mascarado,
// complemento) nem algo com cara de CPF ou CNPJ.
import { describe, expect, it } from "@jest/globals";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { CAMADAS_PUBLICADAS } from "../src/dados/camadasGeradas";
import { DIRETORIO_DO_INDICE } from "../src/dados/recife/publicacaoGerada";

const DADOS = join(__dirname, "..", "src", "dados");
const CHAVES_PROIBIDAS = [
  "cnpj", "razao_social", "razao_social_mercantil", "inscricao_mercantil", "numero do contribuinte", "número do contribuinte",
  "cpf/cnpj mascarado do contribuinte", "complemento", "protocolo", "endereco_empreendimento", "num_licenca", "num_processo",
];
const CPF = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;
const CNPJ = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/;
const MASCARADO = /\*{3}\.\d{3}\.\d{3}-\*{2}|\d{3}\.\*{3}\.\*{3}-\d{2}/;

function chavesDe(valor: unknown, saida: Set<string>): Set<string> {
  if (Array.isArray(valor)) for (const v of valor) chavesDe(v, saida);
  else if (valor && typeof valor === "object") for (const [k, v] of Object.entries(valor)) { saida.add(k.toLowerCase()); chavesDe(v, saida); }
  return saida;
}

const arquivos = [...new Set([...Object.keys(CAMADAS_PUBLICADAS), `recife/${DIRETORIO_DO_INDICE}/meta.json`])].filter((c) => existsSync(join(DADOS, c)));

describe("artefatos publicados sem dado pessoal", () => {
  it("há arquivos para conferir (índice ativo, camadas por prédio, equipamentos)", () => {
    expect(arquivos.length).toBeGreaterThan(100);
    expect(arquivos.some((c) => c.startsWith("recife/equipamentos/"))).toBe(true);
    expect(arquivos.some((c) => c.startsWith(`recife/${DIRETORIO_DO_INDICE}/`))).toBe(true);
  });
  it.each(arquivos)("%s", (caminho) => {
    const texto = readFileSync(join(DADOS, caminho), "utf8");
    const chaves = chavesDe(JSON.parse(texto), new Set());
    expect(CHAVES_PROIBIDAS.filter((k) => chaves.has(k))).toEqual([]);
    expect(CPF.test(texto)).toBe(false);
    expect(CNPJ.test(texto)).toBe(false);
    expect(MASCARADO.test(texto)).toBe(false);
  });
  it("as colunas declaradas no meta.json do índice ativo não incluem coluna pessoal", () => {
    const meta = JSON.parse(readFileSync(join(DADOS, "recife", DIRETORIO_DO_INDICE, "meta.json"), "utf8")) as { fontes: { colunasUsadas: string[] }[]; fontesDaRua?: { colunasUsadas: string[] }[] };
    const usadas = [...meta.fontes, ...(meta.fontesDaRua ?? [])].flatMap((f) => f.colunasUsadas.map((c) => c.toLowerCase()));
    expect(usadas.filter((c) => CHAVES_PROIBIDAS.includes(c) || c.includes("contribuinte"))).toEqual([]);
  });
});
