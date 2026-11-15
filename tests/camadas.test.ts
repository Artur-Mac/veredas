// D036 (divisão do pacote): as camadas de dados por área ficam fora do bundle JS. Aqui: (1) nenhum arquivo de camada é
// alcançável por import/require do app e os manifestos gerados batem com os arquivos; (2) o registro só entrega o que
// carregou e diz "pendente"/"falhou" em vez de devolver dado; (3) na web, tamanho e sha256 são conferidos antes de usar
// ou guardar; (4) a tela mostra a espera, a falha com "Tentar de novo" e só então o conteúdo.
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createHash, webcrypto } from "crypto";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import React from "react";
import { Text } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { Botao } from "../src/componentes/Botao";
import { EsperaDasCamadas } from "../src/componentes/EsperaDasCamadas";
import * as camadas from "../src/dados/camadas";
import { esquecerCamadas } from "../src/dados/camadas";
import { arquivosDoTransito, gradeDoTransito } from "../src/dados/recife/transito";
import { ARQUIVOS_DA_CHUVA } from "../src/dados/recife/chuvaGerado";
import { ARQUIVOS_DA_NOITE } from "../src/dados/recife/noiteGerado";
import { TemaDoApp } from "../src/tema/Tema";

// A plataforma de leitura, controlada pelo teste da tela (os outros blocos trocam por `jest.doMock` isolado).
let mockBuscar: (c: string) => Promise<unknown> = async () => ({});
jest.mock("../src/plataforma/camadas", () => ({
  buscarArquivoDeCamada: (c: string) => mockBuscar(c),
  aquecerArquivoDeCamada: async () => undefined,
}));

const raiz = join(__dirname, "..");
type Leitor = (caminho: string) => unknown;
const global = globalThis as { __veredaLerCamadaEmTeste?: Leitor };

describe("arquivos de camada fora do bundle", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const publicador = require("../scripts/dados/publicar-camadas.cjs") as {
    caminhosDeCamada: () => string[];
    modulosGerados: () => { arquivo: string; texto: string }[];
  };

  it("os manifestos gerados batem com os arquivos (rode scripts/dados/publicar-camadas.cjs se falhar)", () => {
    for (const m of publicador.modulosGerados()) expect({ arquivo: relative(raiz, m.arquivo), igual: readFileSync(m.arquivo, "utf8") === m.texto }).toEqual({ arquivo: relative(raiz, m.arquivo), igual: true });
  });

  it("cobre as camadas grandes: índice dos bairros, sol, trânsito, essenciais, noite, chuva e procura", () => {
    const caminhos = publicador.caminhosDeCamada();
    for (const prefixo of ["recife/indice-municipal/", "sol/recortes/", "recife/transito/", "recife/essenciais/", "recife/noite/", "recife/chuva/", "recife/procura/"]) {
      expect(caminhos.some((c) => c.startsWith(prefixo))).toBe(true);
    }
    expect(caminhos.length).toBeGreaterThanOrEqual(90);
  });

  it("nenhum módulo do app importa um arquivo de camada (o JSON entraria no bundle)", () => {
    const camadas = new Set(publicador.caminhosDeCamada().map((c) => join(raiz, "src/dados", c)));
    const fontes: string[] = [];
    const andar = (d: string) => {
      for (const n of readdirSync(d)) {
        const p = join(d, n);
        if (statSync(p).isDirectory()) andar(p);
        else if (/\.(ts|tsx)$/.test(n)) fontes.push(p);
      }
    };
    andar(join(raiz, "src"));
    const achados: string[] = [];
    for (const f of fontes) {
      for (const m of readFileSync(f, "utf8").matchAll(/(?:require\(|from\s+|import\()\s*["'](\.[^"']+\.json)["']/g)) {
        const alvo = join(f, "..", m[1]!);
        if (camadas.has(alvo)) achados.push(`${relative(raiz, f)} → ${m[1]}`);
      }
    }
    expect(achados).toEqual([]);
  });
});

describe("registro de camadas (sem o leitor do Jest)", () => {
  let leitor: Leitor | undefined;
  // Sem novas tentativas: estes testes são do estado de falha e de "tentar de novo".
  beforeEach(() => { leitor = global.__veredaLerCamadaEmTeste; delete global.__veredaLerCamadaEmTeste; esquecerCamadas(); camadas.definirEsperasEntreTentativas([]); });
  afterEach(() => { global.__veredaLerCamadaEmTeste = leitor; camadas.definirEsperasEntreTentativas(camadas.ESPERAS_ENTRE_TENTATIVAS_MS); });
  function comPlataforma(buscar: (c: string) => Promise<unknown>) {
    const f = jest.fn(buscar);
    mockBuscar = f;
    return f;
  }
  // VE16: o caminho vem do módulo gerado (a versão muda a cada publicação; um caminho fixo sai do manifesto).
  const CAMINHO = ARQUIVOS_DA_NOITE["casa-forte"]!;

  it("antes de carregar, lerCamada lança CamadaPendente; depois, entrega o conteúdo; uma busca só", async () => {
    const f = comPlataforma(async () => ({ ok: 1 }));
    expect(() => camadas.lerCamada(CAMINHO)).toThrow(camadas.CamadaPendente);
    expect(camadas.estadoDasCamadas([CAMINHO])).toBe("carregando");
    await Promise.all([camadas.garantirCamadas([CAMINHO]), camadas.garantirCamadas([CAMINHO, CAMINHO])]);
    expect(camadas.lerCamada(CAMINHO)).toEqual({ ok: 1 });
    expect(camadas.estadoDasCamadas([CAMINHO])).toBe("pronta");
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("falha vira estado `falhou` e lerCamada lança; tentar de novo busca outra vez", async () => {
    let vez = 0;
    comPlataforma(async () => { vez++; if (vez === 1) throw new Error("rede"); return { ok: 2 }; });
    await expect(camadas.garantirCamadas([CAMINHO])).rejects.toThrow(/indisponível.*rede/);
    expect(camadas.estadoDasCamadas([CAMINHO])).toBe("falhou");
    let erro: unknown;
    try { camadas.lerCamada(CAMINHO); } catch (e) { erro = e; }
    expect(camadas.faltaCamada(erro)).toBe(true);
    await camadas.garantirCamadas([CAMINHO]);
    expect(camadas.lerCamada(CAMINHO)).toEqual({ ok: 2 });
  });

  it("arquivo fora do manifesto publicado falha sem buscar nada", async () => {
    const f = comPlataforma(async () => ({}));
    await expect(camadas.garantirCamadas(["recife/noite/0000000000000000/inventado.json"])).rejects.toThrow(/fora do manifesto/);
    expect(f).not.toHaveBeenCalled();
  });

  it("um módulo de camada não guarda 'sem dado' quando o arquivo só não carregou ainda", async () => {
    comPlataforma(async (c) => JSON.parse(readFileSync(join(raiz, "src/dados", c), "utf8")) as unknown);
    expect(() => gradeDoTransito()).toThrow(camadas.CamadaPendente);
    await camadas.garantirCamadas(arquivosDoTransito([]));
    expect(gradeDoTransito()).not.toBeNull();
  });
});

describe("web: leitura conferida", () => {
  const corpo = new TextEncoder().encode(JSON.stringify({ versao: "x", n: 1 }));
  const sha = createHash("sha256").update(corpo).digest("hex");
  const descritor = { url: "dados/recife/x.0123456789abcdef.json", bytes: corpo.byteLength, sha256: sha };
  type Guardado = { arrayBuffer: () => Promise<ArrayBuffer> };
  let guardados: Map<string, Guardado>;
  const copia = (b: Uint8Array): ArrayBuffer => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

  beforeEach(() => {
    guardados = new Map();
    const g = globalThis as Record<string, unknown>;
    if (!g.crypto || !(g.crypto as { subtle?: unknown }).subtle) g.crypto = webcrypto;
    g.caches = { open: async () => ({
      match: async (u: string) => guardados.get(u),
      put: async (u: string, r: { arrayBuffer: () => Promise<ArrayBuffer> }) => { const b = await r.arrayBuffer(); guardados.set(u, { arrayBuffer: async () => b }); },
      delete: async (u: string) => guardados.delete(u),
      keys: async () => [],
    }) };
    if (typeof g.Response === "undefined") {
      g.Response = class { constructor(private b: ArrayBuffer) {} arrayBuffer() { return Promise.resolve(this.b); } };
    }
  });
  afterEach(() => { delete (globalThis as Record<string, unknown>).fetch; });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const web = () => require("../src/plataforma/camadas.web") as typeof import("../src/plataforma/camadas.web");
  const responder = (bytes: Uint8Array, status = 200) => {
    const f = jest.fn(async () => ({ ok: status === 200, status, arrayBuffer: async () => copia(bytes) }));
    (globalThis as Record<string, unknown>).fetch = f;
    return f;
  };

  it("confere, entrega e guarda; da segunda vez vem do cache, sem rede", async () => {
    const f = responder(corpo);
    expect(await web().buscarArquivoDeCamada("recife/x.json", descritor)).toEqual({ versao: "x", n: 1 });
    expect(guardados.has(`/${descritor.url}`)).toBe(true);
    expect(await web().buscarArquivoDeCamada("recife/x.json", descritor)).toEqual({ versao: "x", n: 1 });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("conteúdo trocado (mesmo tamanho) ou cortado é recusado e não entra no cache", async () => {
    const trocado = new TextEncoder().encode(JSON.stringify({ versao: "y", n: 1 }));
    responder(trocado);
    await expect(web().buscarArquivoDeCamada("recife/x.json", descritor)).rejects.toThrow(/sha256/);
    responder(corpo.slice(0, 5));
    await expect(web().buscarArquivoDeCamada("recife/x.json", descritor)).rejects.toThrow(/tamanho/);
    expect(guardados.size).toBe(0);
  });

  it("cache corrompido é descartado e buscado de novo; sem rede e sem cache, erro claro; HTTP 404 também", async () => {
    guardados.set(`/${descritor.url}`, { arrayBuffer: async () => copia(new TextEncoder().encode("{}")) });
    const f = responder(corpo);
    expect(await web().buscarArquivoDeCamada("recife/x.json", descritor)).toEqual({ versao: "x", n: 1 });
    expect(f).toHaveBeenCalledTimes(1);
    guardados.clear();
    (globalThis as Record<string, unknown>).fetch = jest.fn(async () => { throw new TypeError("Failed to fetch"); });
    await expect(web().buscarArquivoDeCamada("recife/x.json", descritor)).rejects.toThrow(/sem conexão/);
    responder(corpo, 404);
    await expect(web().buscarArquivoDeCamada("recife/x.json", descritor)).rejects.toThrow(/HTTP 404/);
  });
});

describe("tela: espera, falha dita e só então o conteúdo", () => {
  let leitor: Leitor | undefined;
  // Sem novas tentativas aqui: o teste é da falha dita na tela (as tentativas têm teste próprio no fim).
  beforeEach(() => { leitor = global.__veredaLerCamadaEmTeste; delete global.__veredaLerCamadaEmTeste; esquecerCamadas(); camadas.definirEsperasEntreTentativas([]); });
  afterEach(() => { global.__veredaLerCamadaEmTeste = leitor; camadas.definirEsperasEntreTentativas(camadas.ESPERAS_ENTRE_TENTATIVAS_MS); });
  const textos = (no: unknown): string => {
    if (typeof no === "string" || typeof no === "number") return String(no);
    if (Array.isArray(no)) return no.map(textos).join(" ");
    return no && typeof no === "object" && "children" in no ? textos((no as { children: unknown }).children) : "";
  };

  it("carregando → falhou (Tentar de novo) → pronta", async () => {
    let vez = 0;
    let liberar!: () => void;
    mockBuscar = () => { vez++; return vez === 1 ? Promise.reject(new Error("sem rede")) : new Promise((r) => { liberar = () => r({}); }); };
    let a!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      a = TestRenderer.create(React.createElement(TemaDoApp, null,
        React.createElement(EsperaDasCamadas, { caminhos: [ARQUIVOS_DA_CHUVA.gracas!], carregando: "Carregando os dados de Graças…", children: React.createElement(Text, null, "CONTEUDO") })));
    });
    // A primeira busca falhou: a falha é dita, o conteúdo não aparece.
    for (let i = 0; i < 5; i++) await act(async () => { await Promise.resolve(); });
    expect(textos(a.toJSON())).toMatch(/Não foi possível carregar os dados deste bairro/);
    expect(textos(a.toJSON())).not.toMatch(/CONTEUDO/);
    const botao = a.root.findAllByType(Botao).find((b) => b.props.rotulo === "Tentar de novo")!;
    await act(async () => { botao.props.onPress?.(); await Promise.resolve(); });
    expect(textos(a.toJSON())).toMatch(/Carregando os dados de Graças…/);
    expect(textos(a.toJSON())).not.toMatch(/CONTEUDO/);
    await act(async () => { liberar(); for (let i = 0; i < 5; i++) await Promise.resolve(); });
    expect(textos(a.toJSON())).toMatch(/CONTEUDO/);
    act(() => a.unmount());
  });
});

describe("novas tentativas (teste no celular, 15/11/2026)", () => {
  it("falha passageira é tentada de novo; falha persistente é devolvida depois da última tentativa", async () => {
    const { comNovasTentativas } = camadas;
    let n = 0;
    const esperas: number[] = [];
    const dormir = async (ms: number) => { esperas.push(ms); };
    await expect(comNovasTentativas(async () => { n += 1; if (n < 3) throw new Error("rede"); return "ok"; }, [400, 1200], dormir)).resolves.toBe("ok");
    expect(n).toBe(3);
    expect(esperas).toEqual([400, 1200]);
    let m = 0;
    await expect(comNovasTentativas(async () => { m += 1; throw new Error("tamanho não confere"); }, [400, 1200], dormir)).rejects.toThrow("tamanho não confere");
    expect(m).toBe(3);
  });
});
