import { describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { apagarDadosDoAparelho } from "../src/componentes/casca/apagarDados";
import { BlocoDeCusto } from "../src/componentes/dossie-v1/Custo";
import { esquemaAnaliseV2, esquemaEdificio, type AnaliseV2, type Edificio } from "../src/dados/contratos";
import { derivarCustoPorPartes } from "../src/dados/custoPorPartes";
import { BAIRROS_DO_RECIFE } from "../src/dados/recife/bairros";
import { baseDeReferenciasPublicas, verificarFaixaDeMarinha } from "../src/dados/recife/referenciasPublicas";
import {
  CHAVE_PERFIL_DOMICILIO,
  PERFIL_DOMICILIO_PADRAO,
  PerfilDoDomicilioNoAparelho,
  usePerfilDomicilio,
} from "../src/estado/PerfilDomicilio";
import { TemaDoApp } from "../src/tema/Tema";

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("../src/plataforma/lembretes", () => ({ cancelarAvisosDoCaderno: async () => undefined }));
jest.mock("../src/plataforma/midia", () => ({ apagarMidiaPessoal: async () => undefined }));

const PALAVRAS_PROIBIDAS = [/perigos/i, /vale a pena/i, /\bcaro\b/i, /\bcara\b/i, /barat/i, /caix[ãa]o/i, /ótim|\botim/i, /\bruim\b/i, /arriscad/i];

const v = (valor: number) => ({ valor, origem: "link" as const, aConfirmar: false });
const vazio = { valor: null, origem: "link" as const, aConfirmar: true };

const VISITA_VAZIA: AnaliseV2["visita"] = {
  verificadas: [],
  respostas: {},
  perguntasProprias: [],
  notas: "",
  ruido: null,
  orientacaoGraus: null,
  segundos: 0,
  concluidaEm: null,
};

function criarAnaliseSintetica(mudancas: Partial<AnaliseV2> = {}): AnaliseV2 {
  const base: AnaliseV2 = esquemaAnaliseV2.parse({
    versao: 2,
    id: "an-custo-1",
    criadaEm: "2026-10-20T12:00:00Z",
    atualizadaEm: "2026-10-20T12:00:00Z",
    url: "https://anuncio.invalid/sintetico-custo",
    nome: "Apartamento em Boa Viagem",
    modalidade: "aluguel",
    tipologia: "apartamento",
    bairro: "boa-viagem",
    bairroTexto: "Boa Viagem",
    logradouro: "Avenida Boa Viagem",
    numero: "1500",
    nomeEdificio: "Edifício Atlântico",
    extracao: null,
    declarados: {
      preco: v(3800),
      condominio: v(950),
      iptu: { ...vazio, periodo: "desconhecido" },
      seguroIncendio: vazio,
      taxaServico: vazio,
      outros: vazio,
      area: v(80),
      quartos: v(3),
      suites: vazio,
      banheiros: v(2),
      vagas: v(1),
      andar: v(8),
    },
    vinculo: {
      estado: "confirmado",
      edificioId: "88001-1500",
      dsqfl: "61755015020099",
      confirmadoEm: "2026-10-20T12:00:00Z",
      indiceGeradoEm: "2026-10-20T08:15:00Z",
    },
    visita: VISITA_VAZIA,
    salva: true,
    descarte: null,
  });
  return esquemaAnaliseV2.parse({
    ...base,
    ...mudancas,
    declarados: { ...base.declarados, ...(mudancas.declarados ?? {}) },
    visita: { ...base.visita, ...(mudancas.visita ?? {}) },
  });
}

function criarPredio(centro: [number, number] = [-34.8948, -8.1172]): Edificio {
  const d = 0.0001;
  return esquemaEdificio.parse({
    id: "88001-1500",
    bairro: "boa-viagem",
    logradouro: "AVENIDA BOA VIAGEM",
    numero: "1500",
    dsqfl: "61755015020099",
    nome: "Edifício Atlântico",
    centro,
    poligono: [
      [centro[0] - d, centro[1] - d],
      [centro[0] + d, centro[1] - d],
      [centro[0] + d, centro[1] + d],
      [centro[0] - d, centro[1] + d],
    ],
    unidades: 24,
    tipologias: [{ area: 80, unidades: 24, iptuAnualMediano: 3000 }],
    anoConstrucao: 2008,
    pavimentos: 16,
    ate4Pavimentos: false,
    padrao: "Superior",
    iptuAnual: { n: 24, p25: 2700, mediana: 3000, p75: 3300 },
    itbi: null,
    obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
  });
}

function textosDe(no: unknown): string[] {
  if (no === null || no === undefined || typeof no === "boolean") return [];
  if (typeof no === "string" || typeof no === "number") return [String(no)];
  if (Array.isArray(no)) return no.flatMap(textosDe);
  if (typeof no === "object" && "children" in no) {
    return textosDe((no as { children?: unknown }).children);
  }
  return [];
}

describe("Referências públicas abertas, Perfil do Domicílio (T14) e Custo por Partes", () => {
  it("valida referências oficiais (BCB SGS 20774, ANEEL Neoenergia PE, GTFS e os 94 bairros do Recife)", () => {
    const refs = baseDeReferenciasPublicas();
    expect(refs.financiamento.serieSgs).toBe(20774);
    expect(refs.financiamento.taxaEfetivaAnualPct).toBeGreaterThan(5);
    expect(refs.energia.cnpj).toBe("10835932000108");
    expect(refs.energia.tarifaHomologadaKwh).toBeGreaterThan(0.5);
    expect(refs.transportePublico.tarifaAnelAReais).toBeGreaterThan(3);
    expect(Object.keys(refs.centroidesBairros)).toHaveLength(BAIRROS_DO_RECIFE.length);
  });

  it("separa estritamente o mensal oficial conhecido das estimativas de rotina e mostra referência de IPTU cadastral", () => {
    const analiseNascente = criarAnaliseSintetica({
      visita: { ...VISITA_VAZIA, orientacaoGraus: 90 },
    });
    const analisePoente = criarAnaliseSintetica({
      visita: { ...VISITA_VAZIA, orientacaoGraus: 270 },
    });
    const predio = criarPredio();
    const perfil = {
      ...PERFIL_DOMICILIO_PADRAO,
      configurado: true,
      moradores: 3,
      usoArCondicionado: "noite_1_quarto" as const,
      destinoBairro: "recife",
      modoTransporte: "transporte_publico" as const,
      diasPresenciaisMes: 20,
      orcamentoMensalReais: 5000,
    };

    const partesNascente = derivarCustoPorPartes(analiseNascente, predio, perfil);
    const partesPoente = derivarCustoPorPartes(analisePoente, predio, perfil);

    // O total oficial conhecido continua exatamente 3800 + 950 = 4750, sem somar luz, transporte nem IPTU inferido!
    expect(partesNascente.oficial.totalMensalConhecido).toBe(4750);
    expect(partesNascente.referenciaIptuDoPredio?.mensalMedianoReais).toBe(250);
    expect(partesNascente.fatiasDaRotina).toHaveLength(2);
    expect(partesPoente.janelaPoenteConsiderada).toBe(false);

    const luzNascente = partesNascente.fatiasDaRotina.find((f) => f.id === "energia")!.valorMensalReais;
    const luzPoente = partesPoente.fatiasDaRotina.find((f) => f.id === "energia")!.valorMensalReais;
    expect(luzPoente).toBe(luzNascente);
    expect(partesNascente.comparacaoComTetoPessoal).toContain("R$ 250");

    // Modo a pé / bicicleta não gera string "R$ 0" no BlocoDeCusto
    const partesBike = derivarCustoPorPartes(analiseNascente, predio, { ...perfil, modoTransporte: "a_pe_bike" });
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(BlocoDeCusto, {
            custo: partesBike.oficial,
            area: 80,
            posicao: null,
            aoAbrirPosicao: () => undefined,
            aoAjustar: () => undefined,
            partes: partesBike,
            perfilConfigurado: true,
            aoAbrirPerfilDomicilio: () => undefined,
          }),
        ),
      );
    });
    const textoRenderizado = textosDe(arvore.toJSON()).join("\n");
    expect(textoRenderizado).toContain("Sem gasto direto");
    expect(textoRenderizado).not.toMatch(/R\$ 0(?![\d.,])/);
    for (const p of PALAVRAS_PROIBIDAS) expect(textoRenderizado).not.toMatch(p);
  });

  it("simula prestação Price com taxa BCB e orienta sobre Terreno de Marinha (SPU 5%) na orla/estuário na compra", () => {
    const base = criarAnaliseSintetica();
    const compraOrla = criarAnaliseSintetica({
      modalidade: "compra",
      declarados: {
        ...base.declarados,
        preco: v(700000),
      },
    });
    const predioOrla = criarPredio([-34.8946, -8.1172]); // Av. Boa Viagem na orla
    const partesOrla = derivarCustoPorPartes(compraOrla, predioOrla, PERFIL_DOMICILIO_PADRAO);

    expect(partesOrla.simulacaoCompra).not.toBeNull();
    expect(partesOrla.simulacaoCompra!.entradaReais).toBe(140000);
    expect(partesOrla.simulacaoCompra!.prestacaoPriceReais).toBeGreaterThan(4000);
    expect(partesOrla.alertaMarinha).not.toBeNull();
    expect(partesOrla.alertaMarinha!.laudemioReferencia5PctReais).toBe(35000);

    // Lote afastado da costa e fora de estuário sob maré (ex.: Dois Irmãos) não aciona alerta de marinha
    expect(verificarFaixaDeMarinha([-34.965, -8.005], "dois-irmaos").emFaixaDeAtencao).toBe(false);
    expect(verificarFaixaDeMarinha(null, "ilha-do-leite").emFaixaDeAtencao).toBe(true);
  });

  it("grava o perfil do domicílio localmente e remove a chave em apagarDadosDoAparelho()", async () => {
    await AsyncStorage.clear();
    let api!: ReturnType<typeof usePerfilDomicilio>;
    function Leitor() {
      api = usePerfilDomicilio();
      return null;
    }
    await act(async () => {
      TestRenderer.create(React.createElement(PerfilDoDomicilioNoAparelho, null, React.createElement(Leitor)));
    });
    await act(async () => {
      await api.salvarPerfil({ moradores: 4, destinoBairro: "casa-forte", modoTransporte: "carro_moto" });
    });
    expect(api.perfil.configurado).toBe(true);
    expect(api.perfil.moradores).toBe(4);
    expect(await AsyncStorage.getItem(CHAVE_PERFIL_DOMICILIO)).not.toBeNull();

    await apagarDadosDoAparelho();
    expect(await AsyncStorage.getItem(CHAVE_PERFIL_DOMICILIO)).toBeNull();
  });
});
