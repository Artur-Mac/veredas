// M5 (18/11/2026): o leitor de tela lia "Trv", "Prc" e "Vdo" letra por letra. O texto acessível passa a dizer o tipo de
// logradouro e os títulos por extenso; o DESENHO continua com o nome curto, como a Prefeitura publica (decisão A12).
// Os nomes daqui são da base publicada; a tabela é conferida contra o logradouro do índice de prédios, que escreve os
// títulos por extenso ("RUA PADRE JOSE EDWALDO GOMES").
import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { esquecerLargurasDoMapaDoLote, MapaDoLote } from "../src/componentes/dossie-v1/MapaDoLote";
import { FundoDoMapa } from "../src/componentes/mapa/FundoDoMapa";
import { logradouroPorExtenso, ondeFica, ruaPorExtenso } from "../src/componentes/mapa/fundoDoMapaAbreviacoes";
import { descreverFundoDoMapa, type CenaDoFundo } from "../src/componentes/mapa/fundoDoMapaCena";
import { BAIRROS_DO_RECIFE, eCoberto, type SlugCoberto } from "../src/dados/recife/bairros";
import { arquivoDoIndice, edificioPorId, edificiosDoBairro } from "../src/dados/recife/indice";
import { arquivoDoMapaBase, mapaBaseDoBairro } from "../src/dados/recife/mapaBase";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("expo-router", () => ({}));

describe("tipo de logradouro por extenso, no começo do nome", () => {
  it.each([
    ["R. Frei Jaboatao", "Rua Frei Jaboatao", "f"],
    ["R da Felicidade I", "Rua da Felicidade I", "f"],
    ["Rua do Mangue", "Rua do Mangue", "f"],
    ["Av. Boa Viagem", "Avenida Boa Viagem", "f"],
    ["Trv da Av Sul", "Travessa da Avenida Sul", "f"],
    ["Trv. Profª Rosilda Costa", "Travessa Professora Rosilda Costa", "f"],
    ["Tr. Dezenove de Abril", "Travessa Dezenove de Abril", "f"],
    ["Prc Largo da Encruzilhada", "Praça Largo da Encruzilhada", "f"],
    ["Prc. do Derby", "Praça do Derby", "f"],
    ["Prç.  Venâncio de Rezende", "Praça Venâncio de Rezende", "f"],
    ["Vdo Dois Irmãos", "Viaduto Dois Irmãos", "m"],
    ["Vdo. da Av. Visconde de São Leopoldo", "Viaduto da Avenida Visconde de São Leopoldo", "m"],
    ["Pte de Afogados", "Ponte de Afogados", "f"],
    ["Bec do Comissariado", "Beco do Comissariado", "m"],
    ["Vil Miami", "Vila Miami", "f"],
    ["Est. de Belém", "Estrada de Belém", "f"],
    ["Est do Passarinho", "Estrada do Passarinho", "f"],
    ["Lgo da Mustardinha", "Largo da Mustardinha", "m"],
    ["Cor do Abdias", "Córrego do Abdias", "m"],
    ["Sub da Garapeira", "Subida da Garapeira", "f"],
    ["Lad do Sapoti", "Ladeira do Sapoti", "f"],
    ["Rod Br Cento e Um", "Rodovia Br Cento e Um", "f"],
    ["Esc Alto da Esperança", "Escadaria Alto da Esperança", "f"],
    ["Prq Infantil Walt Disney", "Parque Infantil Walt Disney", "m"],
    ["Pat de São Pedro", "Pátio de São Pedro", "m"],
    ["C da Alfândega", "Cais da Alfândega", "m"],
    ["C. do Apolo", "Cais do Apolo", "m"],
  ] as [string, string, "f" | "m"][])("%s → %s", (publicado, lido, genero) => {
    expect(logradouroPorExtenso(publicado)).toEqual({ nome: lido, genero });
  });

  it.each([
    ["1Tr Feliciano Castilho", "1ª Travessa Feliciano Castilho"],
    ["2ª Tr Benjamin Torreão", "2ª Travessa Benjamin Torreão"],
    ["1ª Trv. Dr. Arsênio Tavares", "1ª Travessa Doutor Arsênio Tavares"],
    ["1º trv. Horizontina", "1ª Travessa Horizontina"],
    ["2tr da Fronteira", "2ª Travessa da Fronteira"],
    ["5 tr. Damolândia", "5ª Travessa Damolândia"],
    ["10ªTr  Córrego da Bica", "10ª Travessa Córrego da Bica"],
    ["1ªTrv. Lupércio", "1ª Travessa Lupércio"],
    ["1Sb do Coto", "1ª Subida do Coto"],
    ["4º Sub. Olho D'Água", "4ª Subida Olho D'Água"],
  ])("com número: %s → %s", (publicado, lido) => {
    expect(ruaPorExtenso(publicado)).toBe(lido);
  });

  it("colado no nome ou com erro de digitação da base: ainda é rua", () => {
    expect(ruaPorExtenso("R.Rio  Jordão")).toBe("Rua Rio Jordão");
    expect(ruaPorExtenso("R.Dr. Ruy Pinto Cunha")).toBe("Rua Doutor Ruy Pinto Cunha");
    expect(ruaPorExtenso("R,. Lírio Formoso")).toBe("Rua Lírio Formoso");
  });

  it("o que a tabela não conhece fica como a base publica (o leitor soletra, mas nada é inventado)", () => {
    for (const nome of ["Ref Campos da Ufpe", "Ent Complexo da Macaxeira", "Ala São Francisco Salles", "3Pr Alto do Paraíso"]) {
      expect(logradouroPorExtenso(nome)).toEqual({ nome, genero: null });
    }
    // "Rio Jaboatão" na base é a Rua Rio Jaboatão (o índice diz RUA RIO JABOATAO): "Rio" não é tipo de logradouro.
    expect(logradouroPorExtenso("Rio Jaboatão")).toEqual({ nome: "Rio Jaboatão", genero: null });
  });
});

describe("títulos e tipos no meio do nome", () => {
  it.each([
    ["R. Dr Sérgio Romero", "Rua Doutor Sérgio Romero"],
    ["Trv Dra. Amariles Barbosa de Aguiar", "Travessa Doutora Amariles Barbosa de Aguiar"],
    ["Av. Prof. José dos Anjos", "Avenida Professor José dos Anjos"],
    ["R. Profa Angela Pinto", "Rua Professora Angela Pinto"],
    ["Rua Pe. José Edwaldo Gomes", "Rua Padre José Edwaldo Gomes"],
    ["Av. Sul Gov. Cid Sampaio", "Avenida Sul Governador Cid Sampaio"],
    ["Av. Des. Nestor Diógens de Mello", "Avenida Desembargador Nestor Diógens de Mello"],
    ["Av. Cons Rosa e Silva", "Avenida Conselheiro Rosa e Silva"],
    ["Av. Eng Abdias de Carvalho", "Avenida Engenheiro Abdias de Carvalho"],
    ["R. Cap Adolfo Taquis", "Rua Capitão Adolfo Taquis"],
    ["R. Jorn. Nilo Pereira", "Rua Jornalista Nilo Pereira"],
    ["R. jor. José Leite Filho", "Rua Jornalista José Leite Filho"],
    ["R. Del. José Batista Moreno", "Rua Delegado José Batista Moreno"],
    ["R. N. Srª de Fátima", "Rua Nossa Senhora de Fátima"],
    ["Av. N S Aparecida", "Avenida Nossa Senhora Aparecida"],
    ["3ª Tr Sto Antônio", "3ª Travessa Santo Antônio"],
    ["Trv da R. Guapua", "Travessa da Rua Guapua"],
    ["Ref Av. Alberto Santos Dumont", "Ref Avenida Alberto Santos Dumont"],
    ["R. Sgt Sargento Silvino Macêdo", "Rua Sargento Silvino Macêdo"],
  ])("%s → %s", (publicado, lido) => {
    expect(ruaPorExtenso(publicado)).toBe(lido);
  });

  it("não troca o que só parece abreviação: sigla, palavra no fim do nome, inicial de pessoa", () => {
    expect(ruaPorExtenso("R. Dos Sem Terra PE")).toBe("Rua Dos Sem Terra PE");
    expect(ruaPorExtenso("R. Pe Villemain")).toBe("Rua Padre Villemain");
    expect(ruaPorExtenso("R. Bem Me Quer")).toBe("Rua Bem Me Quer");
    expect(ruaPorExtenso("R. Maria de Lourdes C. Dos Santos")).toBe("Rua Maria de Lourdes C. Dos Santos");
    expect(ruaPorExtenso("R. D. João Mota")).toBe("Rua D. João Mota");
    expect(ruaPorExtenso("Trv S. João")).toBe("Travessa S. João");
    expect(ruaPorExtenso("Ent BR 101-Avenida Norte")).toBe("Ent BR 101-Avenida Norte");
  });
});

describe("a frase do leitor de tela", () => {
  const cena = (rua: string | null) => ({ acessibilidade: { rua, bairro: "Afogados", distanciaDaDivisaM: 120 } }) as unknown as CenaDoFundo;

  it("concorda com o tipo: na Travessa, no Viaduto, no Cais; sem tipo reconhecido, em", () => {
    expect(ondeFica("Trv Dianopolis")).toBe("na Travessa Dianopolis");
    expect(ondeFica("Vdo Dois Irmãos")).toBe("no Viaduto Dois Irmãos");
    expect(ondeFica("C. Santa Rita")).toBe("no Cais Santa Rita");
    expect(ondeFica("Rio Jaboatão")).toBe("em Rio Jaboatão");
    expect(descreverFundoDoMapa(cena("Prc. do Derby"))).toBe("Mapa do entorno, bairro Afogados. O imóvel fica na Praça do Derby. A divisa mais próxima de Afogados fica a 120 m do imóvel.");
    expect(descreverFundoDoMapa(cena("Lgo da Santa Cruz"))).toContain("O imóvel fica no Largo da Santa Cruz.");
    expect(descreverFundoDoMapa(cena(null))).not.toContain("O imóvel fica");
  });

  // Prédios do índice em travessa, praça, largo, estrada e ladeira (o código da rua é o prefixo do id do prédio).
  it.each([
    ["cordeiro", "71730-41", "Trv Dianopolis", "O imóvel fica na Travessa Dianopolis."],
    ["derby", "66290-63", "Prc. do Derby", "O imóvel fica na Praça do Derby."],
    ["torre", "66117-1183", "Prç. Prof. Barreto Campello", "O imóvel fica na Praça Professor Barreto Campello."],
    ["beberibe", "10618-51", "3Tr Porto Real", "O imóvel fica na 3ª Travessa Porto Real."],
    ["boa-vista", "53791-418", "Lgo da Santa Cruz", "O imóvel fica no Largo da Santa Cruz."],
    ["sao-jose", "75396-595", "C. Santa Rita", "O imóvel fica no Cais Santa Rita."],
    ["porto-da-madeira", "54100-237", "Lad do Sapoti", "O imóvel fica na Ladeira do Sapoti."],
  ] as [SlugCoberto, string, string, string][])("%s %s: o mapa do lote lê por extenso e desenha %s, como a base publica", (bairro, id, publicado, frase) => {
    esquecerLargurasDoMapaDoLote();
    const predio = edificioPorId(id, bairro)!;
    let a!: TestRenderer.ReactTestRenderer;
    act(() => {
      a = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(MapaDoLote, { predio, obras: [], vizinhos: edificiosDoBairro(bairro) })));
    });
    const moldura = a.root.findAll((n) => typeof n.type === "string" && typeof n.props.onLayout === "function")[0]!;
    act(() => moldura.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 343, height: 280 } } }));
    const descricao = a.root.findAll((n) => n.props.role === "img")[0]!.props.accessibilityLabel as string;
    expect(descricao).toContain(frase);
    expect(descricao).not.toContain(publicado);
    // O desenho não muda: o dado da cena e o rótulo da rua (quando há) continuam com o nome curto.
    const cenaDoFundo = a.root.findAllByType(FundoDoMapa)[0]!.props.cena as CenaDoFundo;
    expect(cenaDoFundo.acessibilidade.rua).toBe(publicado);
    for (const r of cenaDoFundo.rotulos.filter((x) => x.tipo === "imovel")) expect(r.nome).toBe(publicado);
    act(() => a.unmount());
  });
});

describe("a tabela contra o índice de prédios", () => {
  const semAcento = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/[ªº°]/g, "")
      .replace(/[^A-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  // O índice abrevia o tipo ("TRV", "PRC") e, em parte das ruas, "DR", "DRA", "PROF", "GOV" e "N S": leva ao extenso.
  const TIPOS_DO_INDICE: Record<string, string> = { R: "RUA", AV: "AVENIDA", TRV: "TRAVESSA", TR: "TRAVESSA", PRC: "PRACA", EST: "ESTRADA", LGO: "LARGO", LAD: "LADEIRA", C: "CAIS", VDO: "VIADUTO", PTE: "PONTE", BEC: "BECO", VIL: "VILA", COR: "CORREGO", SUB: "SUBIDA", SB: "SUBIDA" };
  const indicePorExtenso = (s: string) => {
    const limpo = semAcento(s).replace(/\bDRA\b/g, "DOUTORA").replace(/\bDR\b/g, "DOUTOR").replace(/\bPROF\b/g, "PROFESSOR").replace(/\bGOV\b/g, "GOVERNADOR").replace(/\bN S\b/g, "NOSSA SENHORA");
    const m = /^(\d{1,2})?([A-Z]+) (.*)$/.exec(limpo);
    return m ? `${m[1] ? `${m[1]} ` : ""}${TIPOS_DO_INDICE[m[2]!] ?? m[2]!} ${m[3]}` : limpo;
  };

  it("em toda rua com prédio no índice, o nome por extenso bate com o logradouro do índice, menos nas grafias que diferem na origem", () => {
    let total = 0;
    const diferentes: string[] = [];
    for (const b of BAIRROS_DO_RECIFE) {
      if (!eCoberto(b.slug) || !arquivoDoIndice(b.slug) || !arquivoDoMapaBase(b.slug)) continue;
      const base = mapaBaseDoBairro(b.slug);
      if (!base) continue;
      const porCodigo = new Map<number, string>();
      for (const r of base.ruas) if (r.codigo !== null) porCodigo.set(r.codigo, r.nome);
      const feitos = new Set<number>();
      for (const e of edificiosDoBairro(b.slug)) {
        const codigo = Number(e.id.split("-")[0]);
        const nome = porCodigo.get(codigo);
        if (!nome || feitos.has(codigo)) continue;
        feitos.add(codigo);
        total += 1;
        if (semAcento(ruaPorExtenso(nome)) !== indicePorExtenso(e.logradouro)) diferentes.push(`${nome} → ${ruaPorExtenso(nome)} ≠ ${e.logradouro}`);
      }
    }
    expect(total).toBeGreaterThan(1500);
    // As que sobram são grafias diferentes entre as duas bases (Dorothea × Dorotheia, Pio Nono × Pio IX, "Rio Jaboatão" sem
    // o "R."), nomes encurtados e abreviações que a tabela deixa de fora de propósito ("Vis", "Mis", iniciais).
    expect(diferentes.length / total).toBeLessThan(0.02);
    // Nenhuma diferença vem de um título trocado: onde a tabela pôs um título, o índice tem a mesma palavra.
    const TITULOS = ["DOUTOR", "DOUTORA", "PROFESSOR", "PROFESSORA", "CORONEL", "GOVERNADOR", "DESEMBARGADOR", "ENGENHEIRO", "VEREADOR", "SENADOR", "DEPUTADO", "GENERAL", "TENENTE", "CAPITAO", "SARGENTO", "BRIGADEIRO", "ALMIRANTE", "PREFEITO", "PRESIDENTE", "MINISTRO", "CONSELHEIRO", "VISCONDE", "JORNALISTA", "EXPEDICIONARIO", "COMPOSITOR", "HISTORIADOR", "INVESTIGADOR", "ADVOGADO", "MEDICO", "PADRE", "SANTA", "SANTO", "DELEGADO"];
    const trocados = diferentes.filter((d) => {
      const [, meu, dele] = /→ (.*) ≠ (.*)$/.exec(d)!;
      const doIndice = new Set(indicePorExtenso(dele!).split(" "));
      return semAcento(meu!).split(" ").some((p) => TITULOS.includes(p) && !doIndice.has(p));
    });
    expect(trocados).toEqual([]);
  });
});
