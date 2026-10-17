import { describe, expect, it } from "@jest/globals";
import { dentroDoPoligono, geometria } from "../src/componentes/mapa/geometria";
import { acharFato, enderecoDoDossie, fontesDoApp, linhaDaFonte, recorteDoFato } from "../src/dados/consultas";
import { resumoDosCreditos } from "../src/dados/creditos";
import { IDS_DOSSIES, creditos, dossieOuErro, dossies } from "../src/dados/dossies";
import { formatarData, formatarDistancia, formatarNumero, formatarReais } from "../src/dados/formatos";
import { distanciaMetros, linkDoMapa, metrosParaCoordenada } from "../src/dados/geo";
import { estadoDoFato } from "../src/dados/estadoDoFato";
import { anuncioExemplo, eAnuncioExemplo } from "../src/dados/anuncioExemplo";

describe("anúncio de referência", () => {
  it("reconhece o link fornecido com parâmetros de busca e sem www", () => {
    expect(eAnuncioExemplo(`${anuncioExemplo.url}?search_id=referencia&search_rank=0`)).toBe(true);
    expect(eAnuncioExemplo(anuncioExemplo.url.replace("www.", ""))).toBe(true);
  });

  it("não confunde outros imóveis, domínios ou identificadores parciais com a referência", () => {
    expect(eAnuncioExemplo(anuncioExemplo.url.replace("895773394", "895773395"))).toBe(false);
    expect(eAnuncioExemplo(anuncioExemplo.url.replace("quintoandar.com.br", "quintoandar.com.br.exemplo.com"))).toBe(false);
    expect(eAnuncioExemplo(anuncioExemplo.url.replace("895773394/", "8957733940/"))).toBe(false);
    expect(eAnuncioExemplo("javascript:alert(1)")).toBe(false);
    expect(eAnuncioExemplo("um link inválido")).toBe(false);
  });

  it("mantém o exemplo de São Paulo fora dos dossiês de Recife", () => {
    expect(anuncioExemplo.cidade).toBe("São Paulo");
    expect([...dossies.values()].some((dossie) => dossie.bairro === anuncioExemplo.bairro)).toBe(false);
    expect(anuncioExemplo.fotos.length).toBeGreaterThan(0);
    expect(anuncioExemplo.fotos.every((foto) => new URL(foto.url).hostname === "www.quintoandar.com.br" && foto.descricao)).toBe(true);
  });
});

describe("dados do mock", () => {
  it("valida os cinco dossiês contra o esquema", () => {
    expect([...dossies.keys()]).toEqual([...IDS_DOSSIES]);
  });

  it("soma o extrato de créditos como o mock", () => {
    expect(resumoDosCreditos(creditos)).toEqual({ disponiveis: 2, cotaInicial: 5, ganhos: 2, usados: 5 });
  });

  it("acha a régua como fato e o recorte do bairro", () => {
    const dossie = dossieOuErro("boa-viagem");
    expect(acharFato(dossie, "regua")?.id).toBe("regua");
    expect(recorteDoFato(dossie, "regua")).toBe("Boa Viagem");
    expect(enderecoDoDossie(dossie)).toBe("Rua João Cardoso Aires, 327");
  });

  it("não lista fontes ilustrativas nem o anúncio em Sobre os dados", () => {
    const bases = fontesDoApp(dossies.values()).map((f) => f.base);
    expect(bases).not.toContain("anúncio");
    expect(bases.length).toBeGreaterThan(0);
  });
});

describe("formatos", () => {
  it("formata números, dinheiro, distância e data em pt-BR", () => {
    expect(formatarNumero(2165)).toBe("2.165");
    expect(formatarNumero(17.24, 1)).toBe("17,2");
    expect(formatarReais(4500)).toBe("R$ 4.500");
    expect(formatarDistancia(850)).toBe("850 m");
    expect(formatarDistancia(3200)).toBe("3,2 km");
    expect(formatarDistancia(1000)).toBe("1 km");
    expect(formatarData("2026-10-15")).toBe("15/10/2026");
    expect(formatarData("2025-10")).toBe("out/2025");
  });

  it("monta a linha da fonte com recorte e consulta", () => {
    const fonte = {
      base: "IPTU 2026",
      orgao: "Prefeitura do Recife",
      licenca: "ODbL",
      url: null,
      atualizado_em: null,
      consultado_em: "2026-10-15",
      via: null,
    };
    expect(linhaDaFonte(fonte, "Boa Viagem")).toBe("IPTU 2026, Boa Viagem, Prefeitura do Recife, consultado em 15/10/2026.");
  });
});

describe("estado do fato", () => {
  it("nunca esconde não sabemos e respeita o estado forçado", () => {
    expect(estadoDoFato({ estado: "nao_sabemos" }, "contestado", true)).toBe("nao_sabemos");
    expect(estadoDoFato({ estado: "padrao" }, "carregando", false)).toBe("carregando");
    expect(estadoDoFato({ estado: "padrao" }, "padrao", true)).toBe("contestado");
    expect(estadoDoFato({ estado: "padrao" }, "em_verificacao", true)).toBe("em_verificacao");
    expect(estadoDoFato({ estado: "padrao" }, "padrao", false)).toBe("padrao");
  });
});

describe("mapa", () => {
  it("gera a mesma geometria para o mesmo dossiê e acha o lote tocado", () => {
    const g = geometria("casa-forte");
    expect(geometria("casa-forte")).toBe(g);
    expect(g.lotes).toHaveLength(9);
    expect(dentroDoPoligono([0, 0], g.lotes[0] ?? [])).toBe(true);
    expect(dentroDoPoligono([500, 500], g.lotes[0] ?? [])).toBe(false);
  });

  it("converte metros em coordenada e volta pela distância", () => {
    const centro: [number, number] = [-34.9, -8.1];
    const destino = metrosParaCoordenada(centro, 300, 400);
    expect(Math.round(distanciaMetros(centro, destino))).toBeGreaterThan(495);
    expect(Math.round(distanciaMetros(centro, destino))).toBeLessThan(505);
  });

  it("entrega o local ao app de mapas do sistema", () => {
    expect(linkDoMapa("android", [-34.9, -8.1], "Casa")).toBe("geo:0,0?q=-8.1,-34.9(Casa)");
    expect(linkDoMapa("ios", [-34.9, -8.1], "Casa", [-34.8, -8.0])).toBe(
      "https://maps.apple.com/directions?source=-8,-34.8&destination=-8.1,-34.9&mode=",
    );
  });
});
