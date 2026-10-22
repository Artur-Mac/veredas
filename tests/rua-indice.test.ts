import { describe, expect, it } from "@jest/globals";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { gunzipSync } from "zlib";
import { esquemaFonteDaRua, esquemaMetaDoIndice, esquemaRuaDoBairro, type IndiceDoBairro, type MetaDoIndice } from "../src/dados/contratos";
import { lerRuaDoEdificio } from "../src/dados/dossie/rua";
import { distanciaMetros } from "../src/dados/geo";
import { DIRETORIO_DO_INDICE } from "../src/dados/recife/publicacaoGerada";
import { BAIRROS_COBERTOS, type SlugCoberto } from "../src/dados/recife/bairros";
import { validarIndiceCompleto } from "../src/dados/recife/indice";

// Camada "A rua" (v1.1) nos arquivos gerados por scripts/dados/construir-indice-recife.mjs com scripts/dados/rua/.
// Dado real (Prefeitura do Recife, ODbL; IBGE, citar a fonte): nada aqui é fixture inventada. Ver a revisão 2.6 da ordem.

const DIR_INDICE = join(__dirname, "..", "src", "dados", "recife", DIRETORIO_DO_INDICE);
const DIR_CACHE = join(__dirname, "..", ".cache", "dados-recife");
const CAMADAS = join(__dirname, "..", "scripts", "dados", "rua", "camadas.mjs");

const bairros = BAIRROS_COBERTOS.map((slug) => {
  const texto = readFileSync(join(DIR_INDICE, `${slug}.json`), "utf-8");
  return { slug, texto, dados: validarIndiceCompleto(slug, JSON.parse(texto) as unknown) as IndiceDoBairro };
});
const textoDoMeta = readFileSync(join(DIR_INDICE, "meta.json"), "utf-8");
const meta: MetaDoIndice = esquemaMetaDoIndice.parse(JSON.parse(textoDoMeta));
const fontesDaRua = meta.fontesDaRua ?? [];
const fonte = (chave: string) => {
  const f = fontesDaRua.find((x) => x.chave === chave);
  if (!f) throw new Error(`meta.json sem a fonte ${chave}`);
  return f;
};

/** Colunas que nunca podem ser lidas nem gravadas pela camada (seção 1.2 da ordem e lista branca da v1.1). */
const PROIBIDAS = [
  "cnpj", "razao_social", "razao_social_mercantil", "inscricao_mercantil", "endereco_empreendimento", "complemento", "Protocolo",
  "COD_UNICO_ENDERECO", "DSC_ESTABELECIMENTO", "CEP", ...[1, 2, 3, 4, 5].flatMap((i) => [`NOM_COMP_ELEM${i}`, `VAL_COMP_ELEM${i}`]),
];

function chavesDe(valor: unknown, acumulado = new Set<string>()): Set<string> {
  if (Array.isArray(valor)) valor.forEach((v) => chavesDe(v, acumulado));
  else if (valor && typeof valor === "object") {
    for (const [k, v] of Object.entries(valor)) {
      acumulado.add(k);
      chavesDe(v, acumulado);
    }
  }
  return acumulado;
}

const proibidasEm = (colunas: readonly string[]) => colunas.filter((c) => PROIBIDAS.some((p) => p.toLowerCase() === c.toLowerCase()));

describe("A rua: fontes no meta.json", () => {
  it("as nove bases da v1.1, com a licença certa: ODbL na Prefeitura, citação no IBGE", () => {
    expect(fontesDaRua.map((f) => f.chave)).toEqual([
      "licenciamento_ambiental", "central_156", "iluminacao", "coleta", "sinistros", "defesa_civil", "cnefe", "censo_entorno", "censo_amostra",
    ]);
    for (const f of fontesDaRua) {
      esquemaFonteDaRua.parse(f);
      const ibge = ["cnefe", "censo_entorno", "censo_amostra"].includes(f.chave);
      expect({ chave: f.chave, licenca: f.licenca }).toEqual({ chave: f.chave, licenca: ibge ? "Citar o IBGE" : "ODbL" });
      expect(f.orgao.startsWith(ibge ? "IBGE" : "Prefeitura da Cidade do Recife")).toBe(true);
      expect(f.consultadoEm).toBe(meta.geradoEm);
      expect(f.registrosLidos).toBeGreaterThan(0);
    }
  });

  it("nenhuma base lê coluna proibida; o Licenciamento Ambiental e a CTTU pedem só a lista branca", () => {
    for (const f of fontesDaRua) expect({ chave: f.chave, proibidas: proibidasEm(f.colunasUsadas) }).toEqual({ chave: f.chave, proibidas: [] });
    expect(fonte("licenciamento_ambiental").colunasUsadas).toEqual(["dsqfl", "licenciamento_ambiental", "data_entrada", "situacao_processo", "bairro", "latitude", "longitude"]);
    expect(fonte("sinistros").colunasUsadas).not.toContain("complemento");
    expect(fonte("cnefe").colunasUsadas).toEqual([
      "COD_SETOR", "DSC_LOCALIDADE", "NOM_TIPO_SEGLOGR", "NOM_TITULO_SEGLOGR", "NOM_SEGLOGR", "NUM_ENDERECO", "LATITUDE", "LONGITUDE", "NV_GEO_COORD", "COD_ESPECIE",
    ]);
    // O script recusa coluna proibida antes de pedir: a lista dele cobre a desta ordem.
    const codigo = readFileSync(CAMADAS, "utf-8");
    for (const p of PROIBIDAS.filter((x) => !x.includes("COMP_ELEM"))) expect({ p, naLista: codigo.includes(`"${p}"`) }).toEqual({ p, naLista: true });
    expect(codigo).toContain("`NOM_COMP_ELEM${i}`");
    expect(codigo).toContain("`VAL_COMP_ELEM${i}`");
  });

  it("contagens lidas conferem com a pesquisa verificada de 20/10/2026", () => {
    expect(fonte("cnefe").registrosLidos).toBe(737511);
    expect(fonte("licenciamento_ambiental").registrosLidos).toBe(49924);
    expect(fonte("coleta").registrosLidos).toBe(5046);
    // Entorno: 2.802 setores do Recife no arquivo; malha: 2.835 setores (a mesma contagem da composição das áreas).
    expect(fonte("censo_entorno").registrosLidos).toBe(2802 + 2835);
    expect(fonte("iluminacao").registrosLidos).toBe(111666);
  });

  it("os períodos que vão para a tela: 12 meses no 156, 2022 a 2024 nos sinistros, 2014 a 2024 na Defesa Civil", () => {
    const p156 = fonte("central_156").periodo;
    expect(p156).not.toBeNull();
    if (p156) {
      const dias = (Date.parse(p156.ate) - Date.parse(p156.de)) / 86_400_000;
      expect(dias).toBeGreaterThanOrEqual(363);
      expect(dias).toBeLessThanOrEqual(365);
      expect(p156.ate <= meta.geradoEm.slice(0, 10)).toBe(true);
    }
    expect(fonte("sinistros").periodo).toEqual({ de: "2022-01-01", ate: "2024-12-31" });
    expect(fonte("defesa_civil").periodo).toEqual({ de: "2014-01-01", ate: "2024-12-31" });
    expect(fonte("licenciamento_ambiental").periodo).toBeNull();
  });
});

describe("A rua: camada de cada bairro e de cada edifício", () => {
  it("todo bairro tem a camada e todo edifício tem a tupla do contrato, com setor válido", () => {
    for (const b of bairros) {
      const rua = b.dados.rua;
      expect(rua).toBeDefined();
      if (!rua) continue;
      esquemaRuaDoBairro.parse(rua);
      const codigos = rua.setores.map((s) => s.codigo);
      expect(codigos).toEqual([...codigos].sort());
      for (const e of b.dados.edificios) {
        expect({ bairro: b.slug, id: e.id, temRua: Array.isArray(e.rua) }).toEqual({ bairro: b.slug, id: e.id, temRua: true });
        if (!e.rua) continue;
        const r = lerRuaDoEdificio(e.rua);
        if (r.setor !== null) expect(r.setor).toBeLessThan(rua.setores.length);
        for (const [quantidade, dias] of Object.values(r.pedidos156)) {
          // Sem pedido não há mediana de dias; com pedido pode não haver atendido (null), nunca zero inventado.
          if (quantidade === 0) expect(dias).toBeNull();
        }
        expect(r.sinistros.atropelamentos).toBeLessThanOrEqual(r.sinistros.comVitima);
      }
      // Quase todo prédio acha o setor pela malha do IBGE.
      const comSetor = b.dados.edificios.filter((e) => e.rua && e.rua[0] !== null).length;
      expect(comSetor / b.dados.edificios.length).toBeGreaterThan(0.98);
    }
  });

  it("setores e áreas de ponderação: códigos do Recife, áreas citadas existem, alugados não passam do total", () => {
    for (const b of bairros) {
      const rua = b.dados.rua;
      if (!rua) continue;
      const areas = new Set(rua.areasDePonderacao.map((a) => a.codigo));
      for (const s of rua.setores) {
        expect(s.codigo.startsWith("2611606")).toBe(true);
        if (s.areaDePonderacao && rua.areasDePonderacao.length) expect(areas.has(s.areaDePonderacao)).toBe(true);
        for (const campo of ["onibus", "calcada", "obstaculo", "rampa", "arvores"] as const) {
          const v = s[campo];
          if (v !== null && s.domicilios !== null) expect(v).toBeLessThanOrEqual(s.domicilios);
        }
      }
      for (const a of rua.areasDePonderacao) {
        expect(a.codigo.startsWith("2611606")).toBe(true);
        expect(a.alugados).toBeLessThanOrEqual(a.domicilios);
        expect(a.bairros.length).toBeGreaterThan(0);
      }
    }
  });

  it("a área de ponderação de Graças e Espinheiro é a 009, com 31,3% de alugados, e a de Casa Forte, a 053, com 17,1%", () => {
    const area = (slug: SlugCoberto, sufixo: string) => bairros.find((b) => b.slug === slug)?.dados.rua?.areasDePonderacao.find((a) => a.codigo.endsWith(sufixo));
    const a009 = area("gracas", "009");
    const a053 = area("casa-forte", "053");
    expect(a009 && Math.round((a009.alugados / a009.domicilios) * 1000) / 10).toBe(31.3);
    expect(a053 && Math.round((a053.alugados / a053.domicilios) * 1000) / 10).toBe(17.1);
  });

  it("LUSE e luz desativada guardam só pontos a até 150 m de algum edifício do bairro", () => {
    for (const b of bairros) {
      const rua = b.dados.rua;
      if (!rua) continue;
      const centros = b.dados.edificios.map((e) => e.centro);
      const perto = (p: readonly [number, number]) => centros.some((c) => distanciaMetros([c[0], c[1]], [p[0], p[1]]) <= 150.5);
      for (const l of rua.luse) expect({ bairro: b.slug, perto: perto(l.centro) }).toEqual({ bairro: b.slug, perto: true });
      for (const p of rua.iluminacaoDesativada) expect({ bairro: b.slug, perto: perto(p) }).toEqual({ bairro: b.slug, perto: true });
    }
  });

  it("ruas do IPTU: toda rua de edifício tem entrada; a Defesa Civil soma por ano e fica entre 2014 e 2024", () => {
    for (const b of bairros) {
      const rua = b.dados.rua;
      if (!rua) continue;
      for (const e of b.dados.edificios) expect(rua.logradouros[e.id.split("-")[0] ?? ""]).toBeDefined();
      for (const [codigo, l] of Object.entries(rua.logradouros)) {
        if (!l.ruaCasada) {
          expect({ codigo, coleta: l.coleta, defesaCivil: l.defesaCivil }).toEqual({ codigo, coleta: [], defesaCivil: null });
          continue;
        }
        const dc = l.defesaCivil;
        expect(dc).not.toBeNull();
        if (!dc) continue;
        expect(dc.porAno.reduce((s, [, n]) => s + n, 0)).toBe(dc.atendimentos);
        expect(dc.ocorrencias.reduce((s, [, n]) => s + n, 0)).toBe(dc.atendimentos);
        if (dc.atendimentos === 0) expect(dc.grafia).toBeNull();
        for (const r of l.coleta) expect(r.turno === null || ["manhã", "tarde", "noite", "dia"].includes(r.turno)).toBe(true);
      }
    }
  });

  it("a rua publicada pela Defesa Civil nunca traz o número mascarado", () => {
    for (const b of bairros) {
      for (const l of Object.values(b.dados.rua?.logradouros ?? {})) {
        const grafia = l.defesaCivil?.grafia;
        if (grafia) expect({ grafia, mascara: /[@}{>$!=`[\]#^_|~?%<\\]/.test(grafia) }).toEqual({ grafia, mascara: false });
      }
    }
  });
});

describe("A rua: privacidade nos arquivos gerados e no cache", () => {
  it("nenhuma coluna proibida aparece como chave em nenhum JSON do índice", () => {
    for (const a of [...bairros.map((b) => ({ nome: b.slug, json: JSON.parse(b.texto) as unknown })), { nome: "meta", json: JSON.parse(textoDoMeta) as unknown }]) {
      const chaves = [...chavesDe(a.json)].map((c) => c.toLowerCase());
      expect({ arquivo: a.nome, proibidas: PROIBIDAS.filter((p) => chaves.includes(p.toLowerCase())) }).toEqual({ arquivo: a.nome, proibidas: [] });
    }
  });

  // O cache (.cache/ não vai para o git): sem ele o teste é pulado.
  (existsSync(join(DIR_CACHE, "cnefe-recife.json.gz")) ? it : it.skip)("o cache do CNEFE guarda só as colunas da lista branca, sem complemento", () => {
    const cache = JSON.parse(gunzipSync(readFileSync(join(DIR_CACHE, "cnefe-recife.json.gz"))).toString("utf-8")) as { colunas: string[]; linhas: string[][] };
    expect(cache.colunas).toEqual(fonte("cnefe").colunasUsadas);
    expect(cache.linhas.length).toBe(737511);
    expect(cache.linhas.every((l) => l.length === cache.colunas.length)).toBe(true);
  });

  (existsSync(join(DIR_CACHE, "ambiental.json")) ? it : it.skip)("o cache do Licenciamento Ambiental e o da CTTU não têm CNPJ, razão social, inscrição nem complemento", () => {
    const ambiental = JSON.parse(readFileSync(join(DIR_CACHE, "ambiental.json"), "utf-8")) as { registros: Record<string, unknown>[] };
    expect(proibidasEm([...chavesDe(ambiental.registros.slice(0, 2000))])).toEqual([]);
    for (const ano of [2022, 2023, 2024]) {
      const sinistros = JSON.parse(readFileSync(join(DIR_CACHE, `sinistros-${ano}.json`), "utf-8")) as { registros: Record<string, unknown>[] };
      expect(proibidasEm([...chavesDe(sinistros.registros)])).toEqual([]);
    }
  });
});
