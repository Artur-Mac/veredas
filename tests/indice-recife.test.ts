import { describe, expect, it, jest } from "@jest/globals";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  esquemaEdificio,
  esquemaIndiceDoBairro,
  esquemaMetaDoIndice,
  type IndiceDoBairro,
  type MetaDoIndice,
} from "../src/dados/contratos";
import { BAIRROS_COBERTOS, GRAFIAS_NO_CADASTRO, type SlugCoberto } from "../src/dados/recife/bairros";
import { checarIndiceRaso, edificioPorId, indiceDoBairro, validarIndiceCompleto } from "../src/dados/recife/indice";

// Confere os seis arquivos gerados por scripts/dados/construir-indice-recife.mjs. Ver Fatia 3 e C7 da ordem
// do arquiteto. Os arquivos são dado real da Prefeitura do Recife (ODbL): nada aqui é fixture inventada.

const DIR_INDICE = join(__dirname, "..", "src", "dados", "recife", "indice");
const SCRIPT = join(__dirname, "..", "scripts", "dados", "construir-indice-recife.mjs");
const DIR_CACHE = join(__dirname, "..", ".cache", "dados-recife");

/**
 * Referência medida pelo arquiteto em 20/10/2026 (tabela de C7) com a regra antiga: só registros de IPTU com
 * coordenada. Desde a correção I2 o índice também guarda prédios sem coordenada (mediana do grupo ou lote achado
 * pelo endereço), então a contagem de edifícios é um piso (95%) e pode passar da tabela.
 */
const C7 = {
  iptu: { "boa-viagem": 71237, "casa-forte": 3247, gracas: 11373, espinheiro: 6533, madalena: 12805 } satisfies Record<SlugCoberto, number>,
  edificios: { "boa-viagem": 1818, "casa-forte": 78, gracas: 283, espinheiro: 154, madalena: 214 } satisfies Record<SlugCoberto, number>,
  licenciamento: 39067,
  lotes: 114079,
};

/** Colunas que nunca podem aparecer em nenhum JSON (ordem do arquiteto, seção 1.2). */
const COLUNAS_PROIBIDAS = [
  "Número do contribuinte",
  "CPF/CNPJ mascarado do contribuinte",
  "tipo de contribuinte",
  "complemento",
  "Regime de Tributação do iptu",
  "Regime de Tributação da trsd",
  "cnpj",
  "razao_social",
  "razao_social_mercantil",
  "inscricao_mercantil",
  "endereco_empreendimento",
];

const MEGABYTE = 1_000_000;

type Lido<T> = { nome: string; bytes: number; texto: string; json: unknown; dados: T };

function lerArquivo(nome: string): { nome: string; bytes: number; texto: string; json: unknown } {
  const texto = readFileSync(join(DIR_INDICE, nome), "utf-8");
  return { nome, bytes: Buffer.byteLength(texto), texto, json: JSON.parse(texto) as unknown };
}

const bairros = BAIRROS_COBERTOS.map((slug): Lido<IndiceDoBairro> & { slug: SlugCoberto } => {
  const a = lerArquivo(`${slug}.json`);
  // A validação completa (Zod, todo campo de todo edifício) mora aqui: o app só faz a checagem rasa.
  return { ...a, slug, dados: validarIndiceCompleto(slug, a.json) };
});
const metaLida = lerArquivo("meta.json");
const meta: MetaDoIndice = esquemaMetaDoIndice.parse(metaLida.json);
const arquivos = [...bairros, metaLida];

const dentroDe5 = (valor: number, referencia: number) => Math.abs(valor - referencia) / referencia <= 0.05;

/** Trechos de `situacao_processo` (sem acento, minúsculas) que tiram a licença de toda contagem. */
const SITUACOES_EXCLUIDAS = ["indefer", "cancel", "arquiv", "desist", "extint"];
const semAcento = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const situacaoExcluida = (situacao: string | null) => situacao !== null && SITUACOES_EXCLUIDAS.some((t) => semAcento(situacao).includes(t));

function distanciaM([lon1, lat1]: readonly number[], [lon2, lat2]: readonly number[]): number {
  const rad = Math.PI / 180;
  const dLat = ((lat2 ?? 0) - (lat1 ?? 0)) * rad;
  const dLon = ((lon2 ?? 0) - (lon1 ?? 0)) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 ?? 0) * rad) * Math.cos((lat2 ?? 0) * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fonte(chave: MetaDoIndice["fontes"][number]["chave"]) {
  const f = meta.fontes.find((x) => x.chave === chave);
  if (!f) throw new Error(`meta.json sem a fonte ${chave}`);
  return f;
}

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

describe("índice cadastral do Recife: formato", () => {
  it("há um JSON por bairro coberto e o meta.json", () => {
    expect(bairros.map((b) => b.slug)).toEqual(["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"]);
    for (const b of bairros) {
      expect(b.dados.bairro).toBe(b.slug);
      expect(b.dados.contexto.bairro).toBe(b.slug);
    }
  });

  it("cada edifício está no bairro do seu arquivo, com id único, ordenado e coerente com o número", () => {
    const todos = new Set<string>();
    for (const b of bairros) {
      const ids = b.dados.edificios.map((e) => e.id);
      expect(ids).toEqual([...ids].sort());
      for (const e of b.dados.edificios) {
        expect(e.bairro).toBe(b.slug);
        expect(e.id.endsWith(`-${e.numero}`)).toBe(true);
        expect(todos.has(e.id)).toBe(false);
        todos.add(e.id);
      }
    }
  });

  it("o contexto do bairro confere com os edifícios do arquivo", () => {
    for (const b of bairros) {
      expect(b.dados.contexto.edificios).toBe(b.dados.edificios.length);
      expect(b.dados.contexto.unidades).toBe(b.dados.edificios.reduce((s, e) => s + e.unidades, 0));
      expect(b.dados.contexto.iptuAnualPorM2).not.toBeNull();
      // O ITBI por m² saiu do contexto (a área do ITBI inclui área comum): só estas quatro chaves existem.
      expect(Object.keys(b.dados.contexto).sort()).toEqual(["bairro", "edificios", "iptuAnualPorM2", "unidades"]);
    }
  });

  it("geradoEm é o mesmo em todos os arquivos", () => {
    for (const b of bairros) expect(b.dados.geradoEm).toBe(meta.geradoEm);
    expect(meta.geradoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it("as cinco fontes do meta.json têm as colunas da lista branca, sem nenhuma coluna pessoal", () => {
    expect(meta.fontes.map((f) => f.chave)).toEqual(["iptu_2026", "itbi", "licenciamento", "lotes", "bairros"]);
    expect(fonte("iptu_2026").colunasUsadas).toEqual([
      "logradouro", "numero", "Código Logradouro", "AREA CONSTRUIDA", "valor cobrado de IPTU", "ano da construção corrigido",
      "tipo de uso do imóvel", "tipo de padrão da construção", "Tipo de Construção", "Tipo de Empreendimento", "latitude", "longitude",
    ]);
    expect(fonte("itbi").colunasUsadas).toEqual([
      "cod_logradouro", "numero", "bairro", "valor_avaliacao", "area_construida", "data_transacao", "tipo_imovel", "latitude", "longitude",
    ]);
    expect(fonte("itbi").recursos).toHaveLength(11);
    expect(fonte("licenciamento").colunasUsadas).toEqual([
      "dsqfl", "tipo_processo", "assunto", "data_entrada", "situacao_processo", "latitude", "longitude", "categoria_empreendimento",
    ]);
    // NMENDCOMP (endereço do lote) é lido só para casar prédios sem coordenada; o valor nunca é gravado.
    expect(fonte("lotes").colunasUsadas).toEqual(["DSQFL", "QTDPAVIMENTOS", "NMEDIFICACAO", "NMENDCOMP", "geometry"]);
    for (const f of meta.fontes) {
      const proibidas = f.colunasUsadas.filter((c) => COLUNAS_PROIBIDAS.some((p) => p.toLowerCase() === c.toLowerCase()));
      expect(proibidas).toEqual([]);
    }
  });

  it("as grafias de bairro do script são as de bairros.ts", () => {
    const codigo = readFileSync(SCRIPT, "utf-8");
    const trecho = /const GRAFIAS_NO_CADASTRO = (\{[\s\S]*?\n\});/.exec(codigo);
    expect(trecho).not.toBeNull();
    const doScript = new Function(`return (${trecho?.[1] ?? "{}"});`)() as unknown;
    expect(doScript).toEqual(GRAFIAS_NO_CADASTRO);
  });
});

describe("índice cadastral do Recife: orçamento e privacidade", () => {
  it("cada arquivo tem no máximo 2,0 MB e a soma no máximo 4 MB", () => {
    for (const a of arquivos) expect({ arquivo: a.nome, ok: a.bytes <= 2 * MEGABYTE }).toEqual({ arquivo: a.nome, ok: true });
    expect(arquivos.reduce((s, a) => s + a.bytes, 0)).toBeLessThanOrEqual(4 * MEGABYTE);
  });

  it("nenhuma coluna proibida aparece como chave nem como texto em nenhum JSON", () => {
    for (const a of arquivos) {
      const chaves = [...chavesDe(a.json)].map((c) => c.toLowerCase());
      for (const proibida of COLUNAS_PROIBIDAS) {
        expect({ arquivo: a.nome, proibida, comoChave: chaves.includes(proibida.toLowerCase()) }).toEqual({ arquivo: a.nome, proibida, comoChave: false });
        expect({ arquivo: a.nome, proibida, comoTexto: a.texto.toLowerCase().includes(`"${proibida.toLowerCase()}"`) }).toEqual({ arquivo: a.nome, proibida, comoTexto: false });
      }
    }
  });

  it("o endereço por extenso do lote (NMENDCOMP) não é gravado em nenhum JSON", () => {
    for (const a of arquivos) {
      expect({ arquivo: a.nome, comoChave: [...chavesDe(a.json)].some((c) => c.toLowerCase() === "nmendcomp") }).toEqual({ arquivo: a.nome, comoChave: false });
      // O formato do valor é "Rua X,  14, Bairro, Recife - Pernambuco, CEP  50000-000".
      expect({ arquivo: a.nome, comValor: /Recife - Pernambuco|CEP\s+\d/i.test(a.texto) }).toEqual({ arquivo: a.nome, comValor: false });
    }
  });

  it("todo dsqfl tem 14 dígitos", () => {
    for (const b of bairros) {
      for (const e of b.dados.edificios) {
        if (e.dsqfl !== null) expect(e.dsqfl).toMatch(/^\d{14}$/);
      }
    }
  });
});

describe("índice cadastral do Recife: conferência com a tabela de C7", () => {
  it("o número de edifícios de cada bairro é de pelo menos 95% da tabela C7 (pode passar dela, por causa do I2)", () => {
    for (const b of bairros) {
      const n = b.dados.edificios.length;
      const piso = Math.ceil(C7.edificios[b.slug] * 0.95);
      expect({ bairro: b.slug, n, ok: n >= piso }).toEqual({ bairro: b.slug, n, ok: true });
    }
  });

  it("os prédios sem coordenada entraram: nenhum bairro ficou abaixo da tabela C7 e algum passou dela", () => {
    expect(bairros.every((b) => b.dados.edificios.length >= C7.edificios[b.slug])).toBe(true);
    expect(bairros.some((b) => b.dados.edificios.length > C7.edificios[b.slug])).toBe(true);
  });

  it("registrosLidos de cada fonte está a 5% da medida do arquiteto", () => {
    const iptu = Object.values(C7.iptu).reduce((s, n) => s + n, 0);
    expect(dentroDe5(fonte("iptu_2026").registrosLidos, iptu)).toBe(true);
    expect(dentroDe5(fonte("licenciamento").registrosLidos, C7.licenciamento)).toBe(true);
    expect(dentroDe5(fonte("lotes").registrosLidos, C7.lotes)).toBe(true);
    expect(fonte("bairros").registrosLidos).toBe(94);
    expect(fonte("itbi").registrosLidos).toBeGreaterThan(100000);
  });

  it("a taxa de vínculo com Lotes passa de 85% em cada bairro", () => {
    for (const b of bairros) {
      const comLote = b.dados.edificios.filter((e) => e.dsqfl !== null).length;
      const taxa = comLote / b.dados.edificios.length;
      expect({ bairro: b.slug, taxa: Number(taxa.toFixed(3)), ok: taxa > 0.85 }).toEqual({ bairro: b.slug, taxa: Number(taxa.toFixed(3)), ok: true });
    }
  });
});

describe("índice cadastral do Recife: obras", () => {
  it("todo item de recentes aponta para uma obra válida (existente, relevante, em 24 meses, sem situação excluída), a até 150 m", () => {
    const [ano = 0, mes = 0] = meta.geradoEm.slice(0, 7).split("-").map(Number);
    const limiar = `${String(ano - 2).padStart(4, "0")}-${String(mes).padStart(2, "0")}`;
    for (const b of bairros) {
      for (const e of b.dados.edificios) {
        for (const [indice, distancia] of e.obras150m.recentes) {
          const obra = b.dados.obras[indice];
          expect({ bairro: b.slug, edificio: e.id, indice, existe: obra !== undefined }).toEqual({ bairro: b.slug, edificio: e.id, indice, existe: true });
          if (!obra) continue;
          expect(["construcao", "acrescimo", "demolicao"]).toContain(obra.categoria);
          expect(situacaoExcluida(obra.situacao)).toBe(false);
          expect(obra.data >= limiar).toBe(true);
          expect(distancia).toBeLessThanOrEqual(150);
          // A distância gravada é a de verdade (a menos de 1 m de arredondamento).
          expect(Math.abs(distanciaM(e.centro, obra.centro) - distancia)).toBeLessThanOrEqual(1.01);
        }
      }
    }
  });

  it("nenhuma obra do índice tem situação excluída (indeferida, cancelada, arquivada, desistência, extinta)", () => {
    for (const b of bairros) {
      const excluidas = b.dados.obras.filter((o) => situacaoExcluida(o.situacao));
      expect({ bairro: b.slug, excluidas }).toEqual({ bairro: b.slug, excluidas: [] });
    }
  });

  it("nenhum edifício passa de 100 obras relevantes em 24 meses (a repetição de linhas do portal foi colapsada)", () => {
    for (const b of bairros) {
      for (const e of b.dados.edificios) {
        expect({ bairro: b.slug, edificio: e.id, ok: e.obras150m.relevantes24m <= 100 }).toEqual({ bairro: b.slug, edificio: e.id, ok: true });
        expect(e.obras150m.demolicoes24m).toBeLessThanOrEqual(e.obras150m.relevantes24m);
      }
    }
  });

  it("a lista de obras do bairro só guarda obras referidas, sem repetição e em ordem de data", () => {
    for (const b of bairros) {
      const referidas = new Set<number>();
      for (const e of b.dados.edificios) for (const [indice] of e.obras150m.recentes) referidas.add(indice);
      expect(referidas.size).toBe(b.dados.obras.length);

      const chaves = b.dados.obras.map((o) => JSON.stringify(o));
      expect(new Set(chaves).size).toBe(chaves.length);
      const datas = b.dados.obras.map((o) => o.data);
      expect(datas).toEqual([...datas].sort());
    }
  });

  it("só entram obras de 2018 em diante, dos 24 meses anteriores à geração, e nenhuma é do futuro", () => {
    const [ano = 0, mes = 0] = meta.geradoEm.slice(0, 7).split("-").map(Number);
    const limiar = `${String(ano - 2).padStart(4, "0")}-${String(mes).padStart(2, "0")}`;
    for (const b of bairros) {
      for (const o of b.dados.obras) {
        expect(o.data >= limiar).toBe(true);
        expect(o.data <= meta.geradoEm.slice(0, 7)).toBe(true);
      }
    }
  });

  it("as contagens de obras são coerentes e recentes respeita o limite de 10", () => {
    for (const b of bairros) {
      for (const e of b.dados.edificios) {
        const o = e.obras150m;
        expect(o.demolicoes24m).toBeLessThanOrEqual(o.relevantes24m);
        expect(o.relevantes24m).toBeLessThanOrEqual(o.licencasDeObra);
        expect(o.recentes.length).toBeLessThanOrEqual(Math.min(10, o.relevantes24m));
        const distintos = new Set(o.recentes.map(([i]) => i));
        expect(distintos.size).toBe(o.recentes.length);
      }
    }
  });

  it("a categoria de cada obra é construção, acréscimo ou demolição, com posição dentro do Recife", () => {
    for (const b of bairros) {
      for (const o of b.dados.obras) {
        const [lon, lat] = o.centro;
        expect(lat).toBeGreaterThan(-8.35);
        expect(lat).toBeLessThan(-7.75);
        expect(lon).toBeGreaterThan(-35.2);
        expect(lon).toBeLessThan(-34.75);
      }
    }
  });
});

describe("índice cadastral do Recife: valores desconhecidos nunca viram zero", () => {
  it("tipologias, IPTU e ITBI não guardam zero no lugar de ausente", () => {
    for (const b of bairros) {
      for (const e of b.dados.edificios) {
        for (const t of e.tipologias) {
          expect(t.area).toBeGreaterThan(0);
          if (t.iptuAnualMediano !== null) expect(t.iptuAnualMediano).toBeGreaterThan(0);
        }
        if (e.iptuAnual) expect(e.iptuAnual.p25).toBeGreaterThan(0);
        if (e.itbi) {
          expect(e.itbi.desde).toBeLessThanOrEqual(e.itbi.ate);
          expect(e.itbi.porAno.reduce((s, [, n]) => s + n, 0)).toBe(e.itbi.transmissoes);
          if (e.itbi.valorUnidade) expect(e.itbi.valorUnidade.p25).toBeGreaterThan(0);
        }
        expect(e.tipologias.map((t) => t.area)).toEqual(e.tipologias.map((t) => t.area).sort((x, y) => x - y));
        expect(e.tipologias.reduce((soma, t) => soma + t.unidades, 0)).toBeLessThanOrEqual(e.unidades);
        expect(e.pavimentos === null || e.pavimentos > 0).toBe(true);
      }
    }
  });

  it("os quartis do contexto do bairro estão em ordem", () => {
    for (const b of bairros) {
      const q = b.dados.contexto.iptuAnualPorM2;
      if (!q) continue;
      expect(q.p25).toBeLessThanOrEqual(q.mediana);
      expect(q.mediana).toBeLessThanOrEqual(q.p75);
    }
  });
});

describe("índice cadastral do Recife: ITBI por unidade", () => {
  const [anoDaGeracao = 0] = meta.geradoEm.slice(0, 4).split("-").map(Number);
  const comItbi = bairros.flatMap((b) => b.dados.edificios.filter((e) => e.itbi !== null).map((e) => ({ bairro: b.slug, e })));

  it("há edifícios com ITBI e com valorUnidade, e outros com ITBI mas sem valorUnidade (n < 3 é null, nunca zero)", () => {
    expect(comItbi.length).toBeGreaterThan(1000);
    expect(comItbi.filter(({ e }) => e.itbi?.valorUnidade).length).toBeGreaterThan(500);
    expect(comItbi.filter(({ e }) => e.itbi?.valorUnidade === null).length).toBeGreaterThan(100);
  });

  it("valorUnidade só existe com n >= 3, os quartis estão em ordem e são positivos", () => {
    for (const { bairro, e } of comItbi) {
      const q = e.itbi?.valorUnidade;
      if (!q) continue;
      const conferido = {
        bairro, id: e.id, n: q.n, nMinimo: q.n >= 3,
        emOrdem: q.p25 <= q.mediana && q.mediana <= q.p75, positivo: q.p25 > 0,
      };
      expect(conferido).toEqual({ bairro, id: e.id, n: q.n, nMinimo: true, emOrdem: true, positivo: true });
    }
  });

  it("valorUnidade não passa do que as transmissões permitem: n <= transmissões dos últimos 36 meses (por ano) e < 3 no total vira null", () => {
    for (const { bairro, e } of comItbi) {
      const itbi = e.itbi;
      if (!itbi) continue;
      if (itbi.transmissoes < 3) expect({ bairro, id: e.id, valorUnidade: itbi.valorUnidade }).toEqual({ bairro, id: e.id, valorUnidade: null });
      if (!itbi.valorUnidade) continue;
      // A janela de 36 meses começa em `anoDaGeracao - 3`; contar o ano inteiro só deixa o teto mais folgado.
      const tetoPorAno = itbi.porAno.filter(([ano]) => ano >= anoDaGeracao - 3).reduce((s, [, n]) => s + n, 0);
      expect({ bairro, id: e.id, ok: itbi.valorUnidade.n <= tetoPorAno }).toEqual({ bairro, id: e.id, ok: true });
      expect(itbi.valorUnidade.n).toBeLessThanOrEqual(itbi.transmissoes);
    }
  });

  it("nenhuma chave valorM2 ou itbiValorM2 aparece em nenhum JSON, em lugar nenhum, nem no script", () => {
    const proibidas = ["valorm2", "itbivalorm2"];
    for (const a of arquivos) {
      const chaves = [...chavesDe(a.json)].map((c) => c.toLowerCase());
      for (const p of proibidas) {
        expect({ arquivo: a.nome, p, comoChave: chaves.includes(p) }).toEqual({ arquivo: a.nome, p, comoChave: false });
        expect({ arquivo: a.nome, p, noTexto: a.texto.toLowerCase().includes(p) }).toEqual({ arquivo: a.nome, p, noTexto: false });
      }
    }
    const codigo = readFileSync(SCRIPT, "utf-8").toLowerCase();
    for (const p of proibidas) expect({ p, noScript: codigo.includes(p) }).toEqual({ p, noScript: false });
  });

  it("os quartis dos edifícios (IPTU anual e ITBI por unidade) têm só as chaves n, p25, mediana e p75", () => {
    for (const { e } of comItbi.slice(0, 400)) {
      const q = e.itbi?.valorUnidade;
      if (q) expect(Object.keys(q).sort()).toEqual(["mediana", "n", "p25", "p75"]);
      if (e.iptuAnual) expect(e.iptuAnual.p25).toBeLessThanOrEqual(e.iptuAnual.p75);
    }
  });

  // Recalcula valorUnidade direto do cache bruto do ITBI (.cache/ não vai para o git: sem ele o teste é pulado).
  (existsSync(join(DIR_CACHE, "itbi-2026.json")) ? it : it.skip)(
    "valorUnidade confere com um recálculo independente a partir do cache bruto (amostra de edifícios)",
    () => {
      const limiar = `${anoDaGeracao - 3}${meta.geradoEm.slice(4, 10)}`;
      const fim = meta.geradoEm.slice(0, 10);
      type Linha = { cod_logradouro?: unknown; numero?: unknown; tipo_imovel?: unknown; data_transacao?: unknown; valor_avaliacao?: unknown };
      const linhas: Linha[] = [];
      for (let ano = 2016; ano <= anoDaGeracao; ano++) {
        const cache = JSON.parse(readFileSync(join(DIR_CACHE, `itbi-${ano}.json`), "utf-8")) as { registros: Linha[] };
        linhas.push(...cache.registros);
      }
      const numero = (v: unknown): number | null => {
        if (typeof v === "number") return Number.isFinite(v) ? v : null;
        if (typeof v !== "string" || v.trim() === "") return null;
        const n = Number(v.replace(/\./g, "").replace(",", "."));
        return Number.isFinite(n) ? n : null;
      };
      const inteiro = (v: unknown) => String(v ?? "").replace(/\.0+$/, "");
      const percentil = (o: number[], p: number) => {
        const k = (o.length - 1) * p;
        const f = Math.floor(k);
        const c = Math.min(f + 1, o.length - 1);
        return (o[f] ?? 0) + ((o[c] ?? 0) - (o[f] ?? 0)) * (k - f);
      };
      const r2 = (x: number) => Math.round(x * 100) / 100;
      const porEdificio = new Map<string, Linha[]>();
      for (const r of linhas) {
        const chave = `${inteiro(r.cod_logradouro)}-${inteiro(r.numero)}`;
        const lista = porEdificio.get(chave);
        if (lista) lista.push(r);
        else porEdificio.set(chave, [r]);
      }
      const amostra = comItbi.filter((_, i) => i % 9 === 0);
      expect(amostra.length).toBeGreaterThan(100);
      for (const { bairro, e } of amostra) {
        const valores = (porEdificio.get(e.id) ?? [])
          .filter((r) => semAcento(String(r.tipo_imovel ?? "")).startsWith("apartamento"))
          .filter((r) => {
            const data = String(r.data_transacao ?? "").slice(0, 10);
            return data >= limiar && data <= fim;
          })
          .map((r) => numero(r.valor_avaliacao))
          .filter((v): v is number => v !== null && v > 0)
          .sort((a, b) => a - b);
        const esperado = valores.length >= 3
          ? { n: valores.length, p25: r2(percentil(valores, 0.25)), mediana: r2(percentil(valores, 0.5)), p75: r2(percentil(valores, 0.75)) }
          : null;
        expect({ bairro, id: e.id, valorUnidade: e.itbi?.valorUnidade }).toEqual({ bairro, id: e.id, valorUnidade: esperado });
      }
    },
  );
});

describe("índice cadastral do Recife: validação em tempo de execução é rasa; a completa é a do teste", () => {
  const casaForte = bairros.find((b) => b.slug === "casa-forte");
  const copia = (): Record<string, unknown> => JSON.parse(casaForte?.texto ?? "{}") as Record<string, unknown>;
  const edificiosDe = (o: Record<string, unknown>) => o.edificios as Record<string, unknown>[];

  it("os cinco arquivos gerados passam nas duas validações e dão o mesmo resultado", () => {
    for (const b of bairros) {
      expect(checarIndiceRaso(b.slug, b.json)).toBe(b.json);
      expect(validarIndiceCompleto(b.slug, b.json)).toEqual(b.json);
    }
  });

  it("indiceDoBairro não chama a validação Zod do índice inteiro: só a amostra de um edifício", () => {
    // Este é o primeiro acesso a Boa Viagem neste arquivo de teste, então passa pela carga de verdade.
    const indice = jest.spyOn(esquemaIndiceDoBairro, "safeParse");
    const amostra = jest.spyOn(esquemaEdificio, "safeParse");
    try {
      const lido = indiceDoBairro("boa-viagem");
      expect(lido.edificios.length).toBe(bairros.find((b) => b.slug === "boa-viagem")?.dados.edificios.length);
      expect(indice).not.toHaveBeenCalled();
      expect(amostra).toHaveBeenCalledTimes(1);
      indiceDoBairro("boa-viagem");
      expect(amostra).toHaveBeenCalledTimes(1); // segunda chamada vem da memória
    } finally {
      indice.mockRestore();
      amostra.mockRestore();
    }
  });

  it("a checagem rasa é pelo menos 10 vezes mais rápida que a completa em Boa Viagem", () => {
    const boaViagem = bairros.find((b) => b.slug === "boa-viagem");
    const melhorDe = (vezes: number, f: () => unknown) => {
      let melhor = Infinity;
      for (let i = 0; i < vezes; i++) {
        const inicio = performance.now();
        f();
        melhor = Math.min(melhor, performance.now() - inicio);
      }
      return melhor;
    };
    const rapida = melhorDe(5, () => checarIndiceRaso("boa-viagem", boaViagem?.json));
    const completa = melhorDe(2, () => validarIndiceCompleto("boa-viagem", boaViagem?.json));
    expect({ rapida, completa, ok: rapida * 10 < completa }).toEqual({ rapida, completa, ok: true });
  });

  it("indiceDoBairro e edificioPorId servem o que está no arquivo", () => {
    const gracas = bairros.find((b) => b.slug === "gracas");
    const primeiro = gracas?.dados.edificios[0];
    expect(primeiro).toBeDefined();
    if (!primeiro) return;
    expect(edificioPorId(primeiro.id, "gracas")).toEqual(primeiro);
    expect(edificioPorId(primeiro.id)).toEqual(primeiro);
    expect(edificioPorId("0-0")).toBeNull();
    expect(indiceDoBairro("gracas").contexto).toEqual(gracas?.dados.contexto);
  });

  it("a checagem rasa recusa o que não tem forma de índice, com o campo que falhou", () => {
    const sem = (chave: string) => {
      const o = copia();
      delete o[chave];
      return o;
    };
    const motivo = /Índice cadastral inválido em casa-forte\.json \(\d+ problemas?; primeiro em /;
    expect(() => checarIndiceRaso("casa-forte", null)).toThrow(/primeiro em \(raiz\): esperado objeto/);
    expect(() => checarIndiceRaso("casa-forte", [])).toThrow(motivo);
    expect(() => checarIndiceRaso("casa-forte", sem("geradoEm"))).toThrow(/primeiro em geradoEm: /);
    expect(() => checarIndiceRaso("casa-forte", sem("bairro"))).toThrow(/primeiro em bairro: /);
    expect(() => checarIndiceRaso("casa-forte", sem("contexto"))).toThrow(/primeiro em contexto: /);
    expect(() => checarIndiceRaso("casa-forte", sem("obras"))).toThrow(/primeiro em obras: /);
    expect(() => checarIndiceRaso("casa-forte", sem("edificios"))).toThrow(/primeiro em edificios: /);
    expect(() => checarIndiceRaso("casa-forte", { ...copia(), edificios: {} })).toThrow(/primeiro em edificios: /);
    expect(() => checarIndiceRaso("casa-forte", { bairro: "casa-forte", edificios: [{ id: "1-1" }] })).toThrow(motivo);
  });

  it("a amostra é o primeiro edifício: formato antigo (valorM2) ou campo faltando no primeiro é recusado nas duas validações", () => {
    const antigo = copia();
    const primeiro = edificiosDe(antigo).find((e) => e.itbi);
    expect(primeiro).toBeDefined();
    const indiceDoPrimeiro = edificiosDe(antigo).indexOf(primeiro ?? {});
    // Põe o edifício com ITBI na posição 0 e troca valorUnidade pelo nome antigo.
    const lista = edificiosDe(antigo);
    const [movido] = lista.splice(indiceDoPrimeiro, 1);
    const itbi = { ...(movido?.itbi as Record<string, unknown>) };
    delete itbi.valorUnidade;
    itbi.valorM2 = null;
    lista.unshift({ ...movido, itbi });
    expect(() => checarIndiceRaso("casa-forte", antigo)).toThrow(/primeiro em edificios\.0\.itbi/);
    expect(() => validarIndiceCompleto("casa-forte", antigo)).toThrow(/primeiro em edificios\.0\.itbi/);

    const semNumero = copia();
    delete edificiosDe(semNumero)[0]?.numero;
    expect(() => checarIndiceRaso("casa-forte", semNumero)).toThrow(/primeiro em edificios\.0\.numero/);
  });

  it("o preço da checagem rasa: um erro no meio do arquivo passa por ela e só a validação completa o pega", () => {
    const corrompido = copia();
    const lista = edificiosDe(corrompido);
    expect(lista.length).toBeGreaterThan(10);
    lista[5] = { ...lista[5], unidades: "muitas" };
    expect(() => checarIndiceRaso("casa-forte", corrompido)).not.toThrow();
    expect(() => validarIndiceCompleto("casa-forte", corrompido)).toThrow(/primeiro em edificios\.5\.unidades/);
  });

  it("arquivo de outro bairro e id repetido são recusados nas duas validações", () => {
    expect(() => checarIndiceRaso("madalena", casaForte?.json)).toThrow(/diz ser do bairro "casa-forte"/);
    expect(() => validarIndiceCompleto("madalena", casaForte?.json)).toThrow(/diz ser do bairro "casa-forte"/);
    const repetido = copia();
    const lista = edificiosDe(repetido);
    lista[1] = { ...lista[0] };
    expect(() => validarIndiceCompleto("casa-forte", repetido)).toThrow(/edifício .* repetido/);
  });
});

describe("índice cadastral do Recife: pavimentos coerentes com o IPTU", () => {
  it("nenhum edifício tem pavimentos <= 4 com ate4Pavimentos false (as fontes divergem: pavimentos fica null)", () => {
    for (const b of bairros) {
      const incoerentes = b.dados.edificios
        .filter((e) => e.pavimentos !== null && e.pavimentos <= 4 && e.ate4Pavimentos === false)
        .map((e) => ({ id: e.id, pavimentos: e.pavimentos, ate4Pavimentos: e.ate4Pavimentos }));
      expect({ bairro: b.slug, incoerentes }).toEqual({ bairro: b.slug, incoerentes: [] });
    }
  });

  it("os edifícios com pavimentos null por divergência continuam no índice, com lote e polígono", () => {
    // IPTU diz "> 4 Pavimentos" e o lote diz até 4: o número de pavimentos some, o vínculo com o lote fica.
    const semPavimentos = bairros.flatMap((b) => b.dados.edificios.filter((e) => e.pavimentos === null && e.ate4Pavimentos === false));
    expect(semPavimentos.length).toBeGreaterThan(0);
    expect(semPavimentos.filter((e) => e.dsqfl !== null && e.poligono !== null).length).toBeGreaterThan(0);
  });

  it("pavimentos conhecido nunca é zero e não passa de 200", () => {
    for (const b of bairros) {
      for (const e of b.dados.edificios) expect(e.pavimentos === null || (e.pavimentos >= 1 && e.pavimentos <= 200)).toBe(true);
    }
  });
});

describe("índice cadastral do Recife: rua renomeada entre o IPTU e o lote", () => {
  /** Lê a função do script (sem dependências) para testar a regra de prefixo sem rodar o script. */
  const ruasCompativeisPorPrefixo = (() => {
    const codigo = readFileSync(SCRIPT, "utf-8");
    const trecho = /function ruasCompativeisPorPrefixo\([^)]*\) \{[\s\S]*?\n\}/.exec(codigo);
    if (!trecho) throw new Error("ruasCompativeisPorPrefixo não foi encontrada no script");
    return new Function(`${trecho[0]}; return ruasCompativeisPorPrefixo;`)() as (a: string, b: string) => boolean;
  })();

  it("o nome mais curto precisa ser prefixo do outro, palavra por palavra, e ter 2 palavras ou mais", () => {
    expect(ruasCompativeisPorPrefixo("beira rio", "beira rio governador eduardo campos")).toBe(true);
    expect(ruasCompativeisPorPrefixo("beira rio governador eduardo campos", "beira rio")).toBe(true);
    expect(ruasCompativeisPorPrefixo("beira rio", "beira rio")).toBe(true);
    expect(ruasCompativeisPorPrefixo("beira", "beira rio governador eduardo campos")).toBe(false);
    expect(ruasCompativeisPorPrefixo("beira rio", "beira riozinho")).toBe(false);
    expect(ruasCompativeisPorPrefixo("rio beira", "beira rio governador eduardo campos")).toBe(false);
    expect(ruasCompativeisPorPrefixo("rio", "rio branco")).toBe(false);
    expect(ruasCompativeisPorPrefixo("", "beira rio")).toBe(false);
  });

  it("em Madalena, os prédios da antiga Av. Beira Rio (cód. 127620) acharam o lote pelo endereço", () => {
    const madalena = bairros.find((b) => b.slug === "madalena");
    const beiraRio = (madalena?.dados.edificios ?? []).filter((e) => e.id.startsWith("127620-"));
    expect(beiraRio.length).toBeGreaterThanOrEqual(18);
    expect(new Set(beiraRio.map((e) => e.logradouro))).toEqual(new Set(["AV BEIRA RIO GOVERNADOR EDUARDO CAMPOS"]));
    expect(beiraRio.filter((e) => e.dsqfl === null || e.poligono === null)).toEqual([]);
  });
});

describe("índice cadastral do Recife: lotes e nomes", () => {
  it("o polígono do lote tem de 3 a 24 vértices e envolve o centro do edifício", () => {
    let comPoligono = 0;
    for (const b of bairros) {
      for (const e of b.dados.edificios) {
        if (!e.poligono) continue;
        comPoligono++;
        const lons = e.poligono.map((p) => p[0]);
        const lats = e.poligono.map((p) => p[1]);
        const folga = 0.0002;
        expect(e.centro[0]).toBeGreaterThanOrEqual(Math.min(...lons) - folga);
        expect(e.centro[0]).toBeLessThanOrEqual(Math.max(...lons) + folga);
        expect(e.centro[1]).toBeGreaterThanOrEqual(Math.min(...lats) - folga);
        expect(e.centro[1]).toBeLessThanOrEqual(Math.max(...lats) + folga);
      }
    }
    expect(comPoligono).toBeGreaterThan(1000);
  });

  it("o nome do edifício vem normalizado: sem prefixo EDF/EDIF/EDIFICIO e com espaços simples", () => {
    let comNome = 0;
    for (const b of bairros) {
      for (const e of b.dados.edificios) {
        if (e.nome === null) continue;
        comNome++;
        expect(e.nome).toBe(e.nome.trim());
        expect(e.nome).not.toMatch(/\s{2,}/);
        expect(e.nome).not.toMatch(/^(edf|edif|edificio)\b/i);
      }
    }
    expect(comNome).toBeGreaterThan(500);
  });
});
