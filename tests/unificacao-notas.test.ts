// Unificação de 19/11/2026, itens R2, R6 e R11 (decisões D1 e A13 de 18/11/2026): as notas de 0 a 10 ficam, mas cada uma
// usa dado do imóvel (nunca um valor fixo igual para todos), o eixo sem dado mostra "Sem leitura" e sai da média, e toda
// nota abre, num toque, a ficha de método de 6 campos.
import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { FichaDeMetodo } from "../src/componentes/visual/FichaDeMetodo";
import { PlacarHeroi5Segundos } from "../src/componentes/visual/PlacarHeroi5Segundos";
import { PulsoDaQuadra } from "../src/componentes/visual/PulsoDaQuadra";
import { TermometroConfortoTermico } from "../src/componentes/visual/TermometroConfortoTermico";
import { VidaAPeNaQuadra } from "../src/componentes/visual/VidaAPeNaQuadra";
import { avaliarConfortoTermico } from "../src/dados/clima/confortoTermico";
import { lerMicroclimaDoPonto, SEM_MICROCLIMA } from "../src/dados/clima/microclima";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import { inferirFachadasDoEdificio } from "../src/dados/sol/inferirFachadas";
import { avaliarBioclimatico3d } from "../src/municipios/recife/motores/bioclimatico3d";
import { SimuladorDaUnidade } from "../src/componentes/dossie-v1/SimuladorDaUnidade";
import { carregarCadastro } from "../src/componentes/dossie-v1/cadastro";
import type { AnaliseV2 } from "../src/dados/contratos";
import { derivarCustoPorPartes } from "../src/dados/custoPorPartes";
import { montarColunaDoComparar } from "../src/dados/dossie/colunaDoComparar";
import { ANDAR_SUPOSTO_SEM_CADASTRO, escolherUnidadeAtiva, inferirFachadasDaAnalise, lerUnidade } from "../src/dados/dossie/unidadeAtiva";
import { analiseDeTeste, EM } from "./fixtures/caderno";
import { PERFIL_DOMICILIO_PADRAO } from "../src/estado/PerfilDomicilio";

jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
import type { ObrasProximas } from "../src/dados/contratos";
import { avaliarCaminhabilidadeEVidaNaRua, type ResultadoCaminhabilidadeEVida } from "../src/dados/dossie/caminhabilidadeEVidaNaRua";
import { calcularPulsoDaQuadra } from "../src/dados/dossie/pulsoDaQuadra";
import type { FichaDeMetodo6Campos } from "../src/dados/fichaDeMetodo";
import { avaliarAcustica3d } from "../src/nucleo/motores/acustica3d";
import { TemaDoApp } from "../src/tema/Tema";

const CAMPOS_DA_FICHA: (keyof FichaDeMetodo6Campos)[] = ["oQueMede", "fonte", "data", "calculo", "limite", "naVisita"];
const ROTULOS_DA_FICHA = ["O que mede: ", "Fonte: ", "Data: ", "Como foi calculada: ", "Limite: ", "Na visita: "];

function textos(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(textos).join(" ");
  return (node.children ?? []).map((c) => (typeof c === "string" ? c : textos(c))).join(" ");
}

function montar(elemento: React.ReactElement): TestRenderer.ReactTestRenderer {
  let arvore!: TestRenderer.ReactTestRenderer;
  act(() => {
    arvore = TestRenderer.create(React.createElement(TemaDoApp, null, elemento));
  });
  return arvore;
}

function abrir(arvore: TestRenderer.ReactTestRenderer, testID: string): void {
  const botao = arvore.root.find((n) => n.props.testID === testID && typeof n.props.onPress === "function");
  act(() => botao.props.onPress());
}

const conforto = avaliarConfortoTermico({ andar: 6, fachadaAzimuteGraus: 90, pavimentosTotais: 15 });
const acustica = avaliarAcustica3d({ andar: 6, fachadaVoltadaParaVia: "frente", tipologiaVia: "local", distanciaViaM: 25, anoConstrucao: 2012 });

function obras(relevantes24m: number, demolicoes24m: number): ObrasProximas {
  return { licencasDeObra: relevantes24m, relevantes24m, demolicoes24m, recentes: [] };
}

function caminhada(nota: number | null, minutos: (number | null)[]): Pick<ResultadoCaminhabilidadeEVida, "notaAPe0a10" | "categorias"> {
  const titulos = ["Mercado", "Farmácia", "Ônibus / Metrô", "Praça / Verde"] as const;
  const ids = ["mercado", "farmacia", "transporte", "praca"] as const;
  const pesos = [30, 25, 25, 20];
  return {
    notaAPe0a10: nota,
    categorias: ids.map((id, i) => ({
      id,
      titulo: titulos[i]!,
      pesoPct: pesos[i]!,
      minutosAPe: minutos[i] ?? null,
      distanciaRetaM: null,
      nota0a10: minutos[i] != null ? 7 : null,
      resumo: "",
    })) as ResultadoCaminhabilidadeEVida["categorias"],
  };
}

const BASE = {
  conforto,
  acustica,
  anoConstrucao: 2012,
  visaoRua: null,
  vinculoConfirmado: true,
  precoInformado: true,
  condominioInformado: true,
  spuAtivo: false,
};

const eixo = (p: ReturnType<typeof calcularPulsoDaQuadra>, id: string) => p.eixos.find((e) => e.id === id)!;

describe("R2: o pulso da quadra usa dado do imóvel, sem valor fixo", () => {
  it("serviços a pé: a nota é a nota a pé do prédio, e dois prédios com caminhadas diferentes têm notas diferentes", () => {
    const perto = calcularPulsoDaQuadra({ ...BASE, obrasProximas: obras(0, 0), caminhabilidade: caminhada(8.4, [3, 4, 2, 6]) });
    const longe = calcularPulsoDaQuadra({ ...BASE, obrasProximas: obras(0, 0), caminhabilidade: caminhada(3.1, [14, 18, 9, 22]) });
    expect(eixo(perto, "rua_servicos").nota0a10).toBe(8.4);
    expect(eixo(longe, "rua_servicos").nota0a10).toBe(3.1);
    expect(eixo(perto, "rua_servicos").resumo).toContain("Mercado ~3 min");
  });

  it("serviços a pé sem caminho medido: 'Sem leitura', fora da média", () => {
    const semCaminho = calcularPulsoDaQuadra({ ...BASE, obrasProximas: obras(0, 0), caminhabilidade: caminhada(null, [null, null, null, null]) });
    const comCaminho = calcularPulsoDaQuadra({ ...BASE, obrasProximas: obras(0, 0), caminhabilidade: caminhada(8.4, [3, 4, 2, 6]) });
    const rua = eixo(semCaminho, "rua_servicos");
    expect(rua.nota0a10).toBeNull();
    expect(rua.rotuloValor).toBe("Sem leitura");
    expect(semCaminho.eixosComLeitura).toBe(comCaminho.eixosComLeitura - 1);
    // A média é só dos eixos com nota.
    const notas = semCaminho.eixos.map((e) => e.nota0a10).filter((n): n is number => n !== null);
    expect(semCaminho.mediaGeral0a10).toBe(Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10);
  });

  it("custo conhecido: a nota é a parte dos itens do custo que já se sabe", () => {
    const tudo = calcularPulsoDaQuadra({ ...BASE, obrasProximas: null, iptuConhecido: true });
    const semIptu = calcularPulsoDaQuadra({ ...BASE, obrasProximas: null, iptuConhecido: false });
    const comUniao = calcularPulsoDaQuadra({ ...BASE, obrasProximas: null, iptuConhecido: true, spuAtivo: true });
    const semNada = calcularPulsoDaQuadra({ ...BASE, obrasProximas: null, precoInformado: false, condominioInformado: false });
    expect(eixo(tudo, "custos").nota0a10).toBe(10);
    expect(eixo(semIptu, "custos").nota0a10).toBe(6.7);
    expect(eixo(semIptu, "custos").resumo).toContain("2 de 3 itens do custo conhecidos; falta IPTU");
    expect(eixo(comUniao, "custos").nota0a10).toBe(7.5);
    expect(eixo(comUniao, "custos").resumo).toContain("regime do terreno da União");
    expect(eixo(semNada, "custos").nota0a10).toBeNull();
    expect(eixo(semNada, "custos").rotuloValor).toBe("Sem leitura");
  });

  it("obras a 150 m: 10 menos 1,1 por obra relevante e 0,9 por demolição, sem base fixa", () => {
    const nenhuma = calcularPulsoDaQuadra({ ...BASE, obrasProximas: obras(0, 0) });
    const duas = calcularPulsoDaQuadra({ ...BASE, obrasProximas: obras(2, 1) });
    const muitas = calcularPulsoDaQuadra({ ...BASE, obrasProximas: obras(12, 3) });
    const semBase = calcularPulsoDaQuadra({ ...BASE, obrasProximas: null, vinculoConfirmado: false });
    expect(eixo(nenhuma, "obras_entorno").nota0a10).toBe(10);
    expect(eixo(nenhuma, "obras_entorno").rotuloValor).toBe("Sem ocorrência");
    expect(eixo(duas, "obras_entorno").nota0a10).toBe(6.9);
    expect(eixo(muitas, "obras_entorno").nota0a10).toBe(0);
    expect(eixo(semBase, "obras_entorno").nota0a10).toBeNull();
    expect(eixo(semBase, "obras_entorno").rotuloValor).toBe("Sem leitura");
  });

  it("a ficha do pulso tem os 6 campos e traz a conta de cada eixo com os números do imóvel", () => {
    const pulso = calcularPulsoDaQuadra({ ...BASE, obrasProximas: obras(2, 1), iptuConhecido: false, caminhabilidade: caminhada(8.4, [3, 4, 2, 6]) });
    for (const campo of CAMPOS_DA_FICHA) expect(pulso.metodo[campo].length).toBeGreaterThan(10);
    for (const e of pulso.eixos) {
      expect(e.conta.length).toBeGreaterThan(10);
      expect(pulso.metodo.calculo).toContain(`${e.titulo}: ${e.conta}`);
    }
    expect(pulso.metodo.calculo).toContain("10 × 2 itens conhecidos ÷ 3 itens considerados");
    expect(pulso.metodo.calculo).toContain("1,1 por obra relevante (2) e 0,9 por demolição (1)");
    expect(pulso.metodo.calculo).toContain("média simples dos eixos com leitura (6 de 6)");
  });
});

describe("R11: cada nota abre a ficha de método de 6 campos num toque", () => {
  it("a ficha começa fechada e, num toque, mostra os seis campos", () => {
    const ficha: FichaDeMetodo6Campos = { oQueMede: "A", fonte: "B", data: "C", calculo: "D", limite: "E", naVisita: "F" };
    const arvore = montar(React.createElement(FichaDeMetodo, { ficha, testID: "ficha-teste" }));
    expect(textos(arvore.toJSON())).not.toContain("O que mede");
    const botao = arvore.root.find((n) => n.props.testID === "ficha-teste-toggle" && typeof n.props.onPress === "function");
    expect(botao.props.accessibilityState).toEqual({ expanded: false });
    abrir(arvore, "ficha-teste-toggle");
    const aberto = textos(arvore.toJSON());
    for (const rotulo of ROTULOS_DA_FICHA) expect(aberto).toContain(rotulo);
    act(() => arvore.unmount());
  });

  it("pulso da quadra: um toque mostra a conta de cada eixo", () => {
    const pulso = calcularPulsoDaQuadra({ ...BASE, obrasProximas: obras(2, 1), caminhabilidade: caminhada(8.4, [3, 4, 2, 6]) });
    const arvore = montar(React.createElement(PulsoDaQuadra, { pulso }));
    abrir(arvore, "pulso-metodo-toggle");
    const aberto = textos(arvore.toJSON());
    for (const rotulo of ROTULOS_DA_FICHA) expect(aberto).toContain(rotulo);
    expect(aberto).toContain("Serviços a pé: a nota a pé do prédio");
    act(() => arvore.unmount());
  });

  it("termômetro (R6): a nota e o selo ficam, e a ficha diz que a regra de pontos e o gasto com ar não têm base medida", () => {
    const arvore = montar(React.createElement(TermometroConfortoTermico, { conforto, andar: 6 }));
    const fechado = textos(arvore.toJSON());
    expect(fechado).toContain("Nota de conforto térmico");
    expect(fechado).toContain(conforto.selo);
    expect(fechado).toContain("Ar-condicionado (fórmula, não medição)");
    abrir(arvore, "termometro-metodo-toggle");
    const aberto = textos(arvore.toJSON());
    for (const rotulo of ROTULOS_DA_FICHA) expect(aberto).toContain(rotulo);
    expect(aberto).toContain("sem base medida");
    expect(aberto).toContain(`${conforto.indiceCalor0a100} de 100`);
    act(() => arvore.unmount());
  });

  it("caminhada: um toque mostra os pesos e a curva da nota a pé", () => {
    const dados = avaliarCaminhabilidadeEVidaNaRua({ predio: null, essenciais: null, visaoRua: null, nomeDoBairro: "Boa Viagem" } as never);
    for (const campo of CAMPOS_DA_FICHA) expect(dados.metodo[campo].length).toBeGreaterThan(10);
    const arvore = montar(React.createElement(VidaAPeNaQuadra, { dados }));
    abrir(arvore, "vida-a-pe-pesos-toggle");
    const aberto = textos(arvore.toJSON());
    expect(aberto).toContain("Mercado 30%");
    expect(aberto).toContain("minutos a pé pela rede de ruas");
    act(() => arvore.unmount());
  });
});

// Pendência 1 do HANDOFF (19/11/2026). Substitui o teste antigo "o mesmo prédio tem o mesmo selo de conforto no dossiê e
// no Comparar", que só comparava o microclima consigo mesmo: este monta as entradas das duas telas como cada uma monta
// (vizinhos do cadastro no dossiê, do bairro no Comparar; bússola da visita), com e sem bússola.
describe("andar e fachada: um estado só no placar, no simulador e no Comparar", () => {
  const predios = edificiosDoBairro("boa-viagem");
  const predio = (id: string) => predios.find((e) => e.id === id)!;
  const analiseDo = (id: string, andar: number | null, bussola: number | null) => {
    const e = predio(id);
    const base = analiseDeTeste(`a-${id}`, { bairro: "boa-viagem", bairroTexto: "Boa Viagem", modalidade: "compra" });
    return analiseDeTeste(`a-${id}`, {
      bairro: "boa-viagem",
      bairroTexto: "Boa Viagem",
      modalidade: "compra",
      declarados: { ...base.declarados, preco: { valor: 650_000, origem: "voce", aConfirmar: false }, andar: { valor: andar, origem: "voce", aConfirmar: false } },
      vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl, confirmadoEm: EM, indiceGeradoEm: "2026-11-18T00:00:00Z" },
      visita: { ...base.visita, orientacaoGraus: bussola },
    });
  };
  /** O que a tela do dossiê calcula (src/app/(abas)/dossie.tsx), sem nada tocado pela pessoa. */
  const doDossie = (a: AnaliseV2) => {
    const cadastro = carregarCadastro(a);
    const e = cadastro.edificio!;
    const unidade = escolherUnidadeAtiva({
      inferencia: inferirFachadasDaAnalise(a, e, cadastro.vizinhos),
      pavimentos: e.pavimentos ?? null,
      andarDeclarado: a.declarados.andar.valor,
      orientacaoBussolaGraus: a.visita.orientacaoGraus,
    });
    return { e, unidade, ...lerUnidade(e, unidade, lerMicroclimaDoPonto(e.centro, a.bairro)) };
  };
  /** O que a tela do Comparar calcula (src/app/(abas)/comparar.tsx). */
  const doComparar = (a: AnaliseV2) => {
    const e = carregarCadastro(a).edificio!;
    return montarColunaDoComparar(a, e, derivarCustoPorPartes(a, e, PERFIL_DOMICILIO_PADRAO), "A");
  };

  it.each([
    ["10227-187", 7, null],
    ["10227-187", 7, 20],
    ["12955-45", null, null],
    ["12955-45", null, 200],
    ["8001-216", 9, 95],
  ] as [string, number | null, number | null][])("prédio %s, andar %s, bússola %s: dossiê e Comparar com a mesma fachada, o mesmo selo de conforto e a mesma nota de sossego", (id, andar, bussola) => {
    const a = analiseDo(id, andar, bussola);
    const dossie = doDossie(a);
    const comparar = doComparar(a);
    expect(dossie.ruido.estado).toBe("estimado");
    expect(comparar.climaSelo).toBe(dossie.conforto.selo);
    expect(comparar.orientacaoCurta).toBe(dossie.unidade.fachada.orientacaoSolar);
    expect(comparar.sossego?.nota0a10).toBe(dossie.ruido.estado === "estimado" ? dossie.ruido.notaDeSossego : null);
    expect(dossie.unidade.origemDaFachada).toBe(bussola === null ? "sugerida" : "bussola");
  });

  it("prédio 10227-187 com bússola de 20°: a fachada é a inferida mais perto da bússola, a mesma no conforto e no ruído", () => {
    const a = analiseDo("10227-187", 7, 20);
    const { unidade, ruido } = doDossie(a);
    const dif = (x: number) => Math.abs(((x - 20 + 540) % 360) - 180);
    const inf = inferirFachadasDaAnalise(a, predio("10227-187"), predios);
    for (const f of inf.fachadas) expect(dif(unidade.fachada.azimuteGraus)).toBeLessThanOrEqual(dif(f.azimuteGraus));
    expect(ruido.estado === "estimado" ? ruido.fachadaGraus : null).toBe(unidade.fachada.azimuteGraus);
  });

  it("prédio 12955-45 sem andar no anúncio: placar e simulador começam no mesmo andar e na mesma fachada, com o mesmo dB(A)", () => {
    const a = analiseDo("12955-45", null, null);
    const { e, unidade, ruido } = doDossie(a);
    expect(unidade.origemDoAndar).toBe("suposto");
    expect(unidade.descricao).toContain("suposto");
    expect(ruido.estado).toBe("estimado");
    if (ruido.estado !== "estimado") return;
    const sim = montar(React.createElement(SimuladorDaUnidade, {
      predio: e, vizinhos: predios, tipologia: "apartamento",
      andarInicial: unidade.andar, fachadaInicialGraus: unidade.fachada.azimuteGraus, unidadeDescricao: unidade.descricao,
    }));
    const resumo = sim.root.findAll((n) => typeof n.props.accessibilityLabel === "string" && n.props.accessibilityLabel.startsWith("Barulho por perto:"))[0]!;
    expect(resumo.props.accessibilityLabel).toContain(`~${Math.round(ruido.naJanela.diaDb)} dB(A) de dia · ~${Math.round(ruido.naJanela.noiteDb)} à noite (estimativa)`);
    expect(textos(sim.toJSON())).toContain(`${unidade.andar}º andar`);
    expect(textos(sim.toJSON())).toContain(`Começa como no placar: ${unidade.descricao}.`);
    // O placar diz o andar e a fachada em que calculou.
    const placar = montar(React.createElement(PlacarHeroi5Segundos, {
      modalidade: "compra", precoPrincipalReais: 650_000, mensalBolsoRealReais: 5_000, dinheiroParaEntrarReais: null, comparacaoM2Pct: null,
      orientacaoCurta: unidade.fachada.orientacaoSolar, conforto, ruidoDormitorioDb: null,
      sossego: { ...ruido.textos.placar, ficha: ruido.textos.ficha }, unidade: unidade.descricao,
    }));
    expect(textos(placar.toJSON())).toContain(`Sol e sossego calculados para: ${unidade.descricao}.`);
    act(() => { sim.unmount(); placar.unmount(); });
  });
});

describe("escolherUnidadeAtiva: a ordem de cada escolha", () => {
  const golden = edificiosDoBairro("boa-viagem").find((e) => e.id === "8001-216")!;
  const inferencia = inferirFachadasDoEdificio({ edificio: golden, vizinhosDoBairro: edificiosDoBairro("boa-viagem"), textoAnuncio: "Golden Tower" });
  const sugerida = inferencia.fachadas.find((f) => f.id === inferencia.fachadaSugeridaId)!;
  const outra = inferencia.fachadas.find((f) => f.id !== inferencia.fachadaSugeridaId)!;

  it("andar: escolhido > anúncio > suposto (meio do prédio; 4º sem pavimentos), sempre entre o 1º e o último", () => {
    expect(escolherUnidadeAtiva({ inferencia, pavimentos: 20, andarDeclarado: 9, andarEscolhido: 3 })).toMatchObject({ andar: 3, origemDoAndar: "escolhido" });
    expect(escolherUnidadeAtiva({ inferencia, pavimentos: 20, andarDeclarado: 9 })).toMatchObject({ andar: 9, origemDoAndar: "anuncio" });
    expect(escolherUnidadeAtiva({ inferencia, pavimentos: 20, andarDeclarado: null })).toMatchObject({ andar: 10, origemDoAndar: "suposto" });
    expect(escolherUnidadeAtiva({ inferencia, pavimentos: null, andarDeclarado: null })).toMatchObject({ andar: ANDAR_SUPOSTO_SEM_CADASTRO, origemDoAndar: "suposto" });
    expect(escolherUnidadeAtiva({ inferencia, pavimentos: 8, andarDeclarado: 15 }).andar).toBe(7);
    expect(escolherUnidadeAtiva({ inferencia, pavimentos: 8, andarDeclarado: 0 }).andar).toBe(1);
  });

  it("fachada: escolhida > bússola aproximada à inferida > sugerida; a descrição diz a origem", () => {
    const escolhida = escolherUnidadeAtiva({ inferencia, pavimentos: 20, andarDeclarado: 9, fachadaEscolhida: outra.id, orientacaoBussolaGraus: sugerida.azimuteGraus });
    expect(escolhida).toMatchObject({ fachada: outra, origemDaFachada: "escolhida" });
    expect(escolhida.descricao).toBe(`9º andar (do anúncio) · fachada ${outra.orientacaoSolar} (escolhida por você)`);
    const pelaBussola = escolherUnidadeAtiva({ inferencia, pavimentos: 20, andarDeclarado: 9, orientacaoBussolaGraus: (outra.azimuteGraus + 10) % 360 });
    expect(pelaBussola).toMatchObject({ fachada: outra, origemDaFachada: "bussola" });
    expect(pelaBussola.descricao).toContain("pela bússola da visita");
    expect(escolherUnidadeAtiva({ inferencia, pavimentos: 20, andarDeclarado: 9 })).toMatchObject({ fachada: sugerida, origemDaFachada: "sugerida" });
  });
});

describe("revisão de 19/11/2026: sem prédio confirmado, sol e conforto ficam sem leitura", () => {
  it("pulso: o eixo de sol fica 'Sem leitura' e fora da média, em vez de uma nota tirada de um ponto fictício", () => {
    const sem = calcularPulsoDaQuadra({ ...BASE, conforto: null, obrasProximas: null, vinculoConfirmado: false });
    const sol = eixo(sem, "sol_brisa");
    expect(sol.nota0a10).toBeNull();
    expect(sol.rotuloValor).toBe("Sem leitura");
    expect(sol.resumo).toContain("Confirme o prédio");
    const com = calcularPulsoDaQuadra({ ...BASE, obrasProximas: null, vinculoConfirmado: false });
    expect(sem.eixosComLeitura).toBe(com.eixosComLeitura - 1);
  });

  it("placar: sem conforto, o cartão de sol diz 'Sem leitura' e não mostra nota nem ficha de conforto", () => {
    const props = {
      modalidade: "compra" as const,
      precoPrincipalReais: 650_000,
      mensalBolsoRealReais: 5_000,
      composicaoMensal: ["Parcela", "cond.", "luz"],
      dinheiroParaEntrarReais: 140_000,
      comparacaoM2Pct: null,
      orientacaoCurta: "Nascente",
      ruidoDormitorioDb: null,
    };
    const semPredio = montar(React.createElement(PlacarHeroi5Segundos, { ...props, conforto: null }));
    const textoSem = textos(semPredio.toJSON());
    expect(textoSem).toContain("Sem leitura");
    expect(textoSem).toContain("Confirme o prédio para ler a fachada");
    expect(textoSem).not.toContain("Nascente");
    expect(semPredio.root.findAll((n) => n.props.testID === "placar-conforto-metodo-toggle")).toHaveLength(0);
    // A legenda da soma mensal lista só o que entrou.
    expect(textoSem).toContain("Parcela + cond. + luz");
    expect(textoSem).not.toContain("IPTU");
    const comPredio = montar(React.createElement(PlacarHeroi5Segundos, { ...props, conforto }));
    expect(textos(comPredio.toJSON())).toContain(conforto.selo);
    act(() => { semPredio.unmount(); comPredio.unmount(); });
  });
});

describe("revisão de código de 19/11/2026: a ficha do conforto não cita o que a conta não lê", () => {
  it("a fonte não fala em altura dos vizinhos, e o limite diz que a sombra deles não entra e que a nota tem piso e teto", () => {
    expect(conforto.metodo.fonte).not.toMatch(/vizinhos/i);
    expect(conforto.metodo.limite).toContain("a sombra dos prédios vizinhos não entra nesta conta");
    expect(conforto.metodo.calculo).toContain("nunca abaixo de 1 nem acima de 9,8");
  });
});
