// Dia a dia a pé (VE04): pacote real do piloto, frases do dossiê e diferença no resumo do Comparar.
import { describe, expect, it } from "@jest/globals";
import { esquemaAnaliseV2, type AnaliseV2 } from "../src/dados/contratos";
import { projetarDecisao, type Par } from "../src/dados/decisao";
import {
  CATEGORIAS_DO_DIA,
  essenciaisDoBairro,
  essenciaisDoPredio,
  esquemaEssenciaisDoBairro,
  fraseDaCadeia,
  linhasDoDia,
  ponteDoCaminho,
  type EssenciaisDoBairro,
  type EssenciaisDoPredio,
} from "../src/dados/recife/essenciais";
import { VERSAO_DOS_ESSENCIAIS } from "../src/dados/recife/essenciaisGerados";

const PILOTO = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];

describe("pacote real do piloto", () => {
  it("cada bairro do piloto carrega, valida e tem a versão do catálogo", () => {
    for (const b of PILOTO) {
      const p = essenciaisDoBairro(b);
      expect(p?.versao).toBe(VERSAO_DOS_ESSENCIAIS);
      expect(Object.keys(p!.predios).length).toBeGreaterThan(50);
    }
    expect(essenciaisDoBairro("cabanga")).toBeNull();
    expect(essenciaisDoBairro(null)).toBeNull();
  });

  it("toda referência a local existe; prédio em linha reta nunca traz minutos a pé", () => {
    for (const b of PILOTO) {
      const p = essenciaisDoBairro(b)!;
      for (const pr of Object.values(p.predios)) {
        for (const cat of CATEGORIAS_DO_DIA) {
          const x = pr.c[cat];
          if (!x) continue;
          expect(p.locais[x.l]).toBeDefined();
          if (pr.modo === "linha_reta") expect("min" in x).toBe(false);
          else if ("b" in x && x.b) expect(p.locais[x.b.l]).toBeDefined();
        }
        if (pr.cadeia) expect(pr.cadeia.m).toBeLessThanOrEqual(pr.cadeia.separadasM);
      }
    }
  });

  it("prédio sem ligação forte (VE03: 5690-1013) fica em linha reta", () => {
    expect(essenciaisDoPredio("boa-viagem", "5690-1013")?.predio.modo).toBe("linha_reta");
  });
});

// ——— Frases ———————————————————————————————————————————————————————————————————————

const pacote: EssenciaisDoBairro = esquemaEssenciaisDoBairro.parse({
  versao: "0123456789abcdef", geradoEm: "2026-11-14T00:00:00Z", rede: "fedcba9876543210", velocidadeMps: 1.2, limiteM: 2000, fontes: {},
  locais: [
    { nome: "Mercado Leste", categoria: "mercado", ponto: [-34.9, -8.05], horario: "Mo-Sa 07:00-22:00", fontes: ["osm"], periodico: false },
    { nome: "Mercado Oeste", categoria: "mercado", ponto: [-34.91, -8.05], horario: null, fontes: ["osm"], periodico: false },
    { nome: null, categoria: "farmacia", ponto: [-34.9, -8.051], horario: null, fontes: ["osm"], periodico: false },
    { nome: "Feira da Praça", categoria: "mercado", ponto: [-34.9, -8.052], horario: "Sábado, 6h às 12h", fontes: ["prefeitura"], periodico: true },
    { nome: "Praça do Sol", categoria: "praca", ponto: [-34.9, -8.053], horario: null, fontes: ["prefeitura", "osm"], periodico: false },
    { nome: "100208", categoria: "transporte", ponto: [-34.9, -8.054], horario: null, fontes: ["gtfs"], periodico: false },
    { nome: "Ti Cajueiro Seco - 020002", categoria: "transporte", ponto: [-34.9, -8.055], horario: null, fontes: ["gtfs"], periodico: false },
  ],
  predios: {},
});
const rede = (c: Record<string, unknown>, cadeia: unknown = null) => ({ modo: "rede", c: { mercado: null, farmacia: null, praca: null, transporte: null, ...c }, cadeia }) as EssenciaisDoPredio;

describe("frases do dia a dia", () => {
  it("com ponte no caminho, diz qual e dá o plano B sem ela", () => {
    const p = rede({ mercado: { l: 0, m: 480, min: 6.7, b: { l: 1, m: 900, min: 12.5 }, pontes: ["Ponte Sintética"], segundoNaMesmaPonte: true } });
    const l = linhasDoDia(pacote, p).find((x) => x.categoria === "mercado")!;
    expect(l.valor).toBe("7 min");
    expect(l.detalhe).toBe("Mercado Leste, 480 m a pé. Horário informado: Mo-Sa 07:00-22:00. Passa pela ponte. Sem ela: Mercado Oeste, 13 min.");
    expect(ponteDoCaminho(p)).toBe("Ponte no caminho até mercado: Ponte Sintética. Se ela fechar, cada linha mostra a opção que não depende dela.");
  });
  it("sem ponte, o plano B é só outra opção; sem nome, diz que não tem nome no mapa; feira diz quando funciona", () => {
    const p = rede({
      farmacia: { l: 2, m: 150, min: 2.1, b: null },
      mercado: { l: 3, m: 300, min: 4.2, b: { l: 0, m: 500, min: 6.9 } },
      transporte: { l: 5, m: 60, min: 0.8, b: null },
    });
    const ls = linhasDoDia(pacote, p);
    expect(ls.find((x) => x.categoria === "farmacia")!.detalhe).toBe("Farmácia sem nome no mapa, 150 m a pé.");
    expect(ls.find((x) => x.categoria === "mercado")!.detalhe).toBe("Feira da Praça, 300 m a pé. Funciona: Sábado, 6h às 12h. Outra opção: Mercado Leste, 7 min.");
    expect(ls.find((x) => x.categoria === "transporte")!.valor).toBe("menos de 1 min");
    expect(ls.find((x) => x.categoria === "transporte")!.detalhe).toBe("Ponto de ônibus, 60 m a pé.");
    expect(ponteDoCaminho(p)).toBeNull();
    expect(ls.find((x) => x.categoria === "praca")!.valor).toBe("—");
  });
  it("linha reta: distância aproximada, nenhum tempo a pé e o motivo", () => {
    const p = { modo: "linha_reta", c: { mercado: { l: 0, retaM: 320 }, farmacia: null, praca: null, transporte: null }, cadeia: null } as EssenciaisDoPredio;
    const l = linhasDoDia(pacote, p)[0]!;
    expect(l.valor).toBe("~320 m");
    expect(l.detalhe).toContain("em linha reta");
    expect(l.detalhe).not.toMatch(/\bmin\b/);
  });
  it("cadeia só aparece com economia material (≥ 300 m e ≥ 15%)", () => {
    expect(fraseDaCadeia(pacote, rede({}, { mercado: 0, farmacia: 2, m: 1400, separadasM: 2100 }))).toBe(
      "Mercado e farmácia numa volta só (Mercado Leste e Farmácia sem nome no mapa): 1,4 km, em vez de 2,1 km em duas idas.",
    );
    expect(fraseDaCadeia(pacote, rede({}, { mercado: 0, farmacia: 2, m: 1900, separadasM: 2100 }))).toBeNull();
    expect(fraseDaCadeia(pacote, rede({}, { mercado: 0, farmacia: 2, m: 700, separadasM: 900 }))).toBeNull();
  });
});

// ——— Comparar ——————————————————————————————————————————————————————————————————————

const INSTANTE = "2026-11-14T12:00:00.000Z";
const v = (valor: number | null) => ({ valor, origem: "texto" as const, aConfirmar: false });
function analise(id: string): AnaliseV2 {
  return esquemaAnaliseV2.parse({
    versao: 2, id, criadaEm: INSTANTE, atualizadaEm: INSTANTE, nome: id, modalidade: "aluguel", tipologia: "apartamento", url: "",
    bairroTexto: "Graças", bairro: "gracas", logradouro: null, numero: null, nomeEdificio: null, extracao: null,
    declarados: { preco: v(3000), condominio: v(600), iptu: { ...v(100), periodo: "mes" }, seguroIncendio: v(40), taxaServico: v(null), outros: v(null), area: v(70), quartos: v(2), suites: v(null), banheiros: v(null), vagas: v(null), andar: v(null) },
    vinculo: { estado: "pendente" },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null,
  });
}
const ROT: Par<string> = ["Graças", "Madalena"];

describe("resumo do Comparar com o dia a dia", () => {
  it("diferença de ≥ 5 min numa categoria entra como diferença material, a favor de quem fica mais perto", () => {
    const perto = rede({ mercado: { l: 0, m: 300, min: 4.2, b: null }, farmacia: { l: 2, m: 200, min: 2.8, b: null } });
    const longe = rede({ mercado: { l: 0, m: 900, min: 12.5, b: null }, farmacia: { l: 2, m: 250, min: 3.5, b: null } });
    const p = projetarDecisao(analise("a"), analise("b"), [null, null], ROT, "custo", [perto, longe]);
    if (p.estado !== "pronta") throw new Error("esperava pronta");
    const d = p.diferencas.find((x) => x.id === "dia_a_dia");
    expect(d).toMatchObject({ favorece: 0, fontes: ["mapa"] });
    expect(d?.texto).toBe("Graças fica a 4 min a pé de um mercado; Madalena, a 13 min.");
    // Custo e espaço iguais: a recomendação vem do dia a dia, sem contradizer a lista.
    expect(p.visitarPrimeiro).toBe(0);
    expect(p.manchete).toBe("Visite primeiro Graças.");
    expect(p.apoio).toBe("No custo e no espaço, os dois ficam próximos; a diferença está no dia a dia a pé.");
  });

  it("terminal com nome perde o código; ponto só com código vira 'Ponto de ônibus'", () => {
    const p = rede({ transporte: { l: 6, m: 200, min: 2.8, b: { l: 5, m: 300, min: 4.2 } } });
    expect(linhasDoDia(pacote, p).find((x) => x.categoria === "transporte")!.detalhe).toBe("Ti Cajueiro Seco, 200 m a pé. Outra opção: Ponto de ônibus, 4 min.");
  });
  it("linha reta, diferença pequena ou ausência de dados não entram", () => {
    const perto = rede({ mercado: { l: 0, m: 300, min: 4.2, b: null } });
    const reta = { modo: "linha_reta", c: { mercado: { l: 0, retaM: 900 }, farmacia: null, praca: null, transporte: null }, cadeia: null } as EssenciaisDoPredio;
    const quase = rede({ mercado: { l: 0, m: 500, min: 7, b: null } });
    for (const outro of [reta, quase, null]) {
      const p = projetarDecisao(analise("a"), analise("b"), [null, null], ROT, "custo", [perto, outro]);
      if (p.estado !== "pronta") throw new Error("esperava pronta");
      expect(p.diferencas.find((x) => x.id === "dia_a_dia")).toBeUndefined();
    }
  });
});
