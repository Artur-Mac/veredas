import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Entorno } from "../src/componentes/dossie-v1/Entorno";
import { derivarDossie } from "../src/dados/dossie/derivar";
import { derivarSintesesInteligentes } from "../src/dados/dossie/sintesesDaRua";
import { esquemaAnaliseV2, type AnaliseV2 } from "../src/dados/contratos";
import {
  baseDeCamadasAmbientais,
  lerArbovirosesDoBairro,
  lerAreasVerdesProximas,
  lerCorredoresDeRuidoDiurno,
  lerRelevoECanalProximo,
  lerTemperaturaSuperficie100m,
} from "../src/dados/recife/camadasAmbientais";
import { baseDeCensoRenda, lerRendaDoSetorOuBairro } from "../src/dados/recife/censoRenda";
import { META, indiceDoBairro } from "../src/dados/recife/indice";
import { TemaDoApp } from "../src/tema/Tema";

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

const PALAVRAS_PROIBIDAS = [
  /perigos/i,
  /vale a pena/i,
  /\bcaro\b/i,
  /\bcara\b/i,
  /barat/i,
  /caix[ãa]o/i,
  /ótim|\botim/i,
  /\bruim\b/i,
  /arriscad/i,
  /ranking/i,
];

function textosDe(no: unknown): string[] {
  if (no === null || no === undefined || typeof no === "boolean") return [];
  if (typeof no === "string" || typeof no === "number") return [String(no)];
  if (Array.isArray(no)) return no.flatMap(textosDe);
  if (typeof no === "object" && "children" in no) {
    return textosDe((no as { children?: unknown }).children);
  }
  return [];
}

describe("Camadas abertas (Fases 3 e 4) e sínteses em linguagem humana", () => {
  it("valida base oficial do Censo 2022 (Renda por Setor) com 2.814 setores, 94 bairros e sigilo preservado como null", () => {
    const censo = baseDeCensoRenda();
    expect(Object.keys(censo.setores).length).toBeGreaterThanOrEqual(2800);
    expect(Object.keys(censo.bairros).length).toBe(94);

    // Boa Viagem tem mediana e média positivas e N de domicílios
    const bv = lerRendaDoSetorOuBairro(null, "boa-viagem");
    expect(bv).not.toBeNull();
    expect(bv?.recorte).toBe("bairro");
    expect(bv?.domiciliosResponsaveis).toBeGreaterThan(10000);
    expect(bv?.rendaMedianaReais).toBeGreaterThan(1000);
    expect(bv?.rendaMediaReais).toBeGreaterThan(bv!.rendaMedianaReais!);

    // Setor em sigilo estatístico ("X" no IBGE) nunca vira zero
    const entradaSigilo = Object.entries(censo.setores).find(([, t]) => t[2] === null || t[3] === null);
    expect(entradaSigilo).toBeDefined();
    const lidoSigilo = lerRendaDoSetorOuBairro(entradaSigilo![0], "boa-viagem");
    expect(lidoSigilo?.sigiloEstatistico).toBe(true);
    expect(lidoSigilo?.rendaMedianaReais).toBeNull();
    expect(lidoSigilo?.rendaMediaReais).toBeNull();
  });

  it("valida base ambiental aberta (Landsat 100 m, Copernicus DEM 30 m, SINAN Arboviroses, GTFS Corredores e Áreas Verdes)", () => {
    const base = baseDeCamadasAmbientais();
    expect(base.calorSuperficie.cenasUsadas.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(base.calorSuperficie.medianaBairrosDecimosC).length).toBe(94);
    expect(base.areasVerdes.arvoresTombadas.length).toBeGreaterThan(30);
    expect(base.areasVerdes.pracasEParques.length).toBeGreaterThan(400);
    expect(base.relevoEDrenagem.pontosCanaisRios.length).toBeGreaterThan(1000);
    expect(base.ruidoCorredores.corredoresOnibus.length).toBeGreaterThan(500);
    expect(base.ruidoCorredores.estacoesMetro.length).toBeGreaterThanOrEqual(20);

    const pontoGracas: [number, number] = [-34.9015, -8.0465];
    const term = lerTemperaturaSuperficie100m(pontoGracas, "gracas");
    expect(term).not.toBeNull();
    expect(term!.tempQuadraC).toBeGreaterThan(20);
    expect(term!.tempQuadraC).toBeLessThan(48);

    const relevo = lerRelevoECanalProximo(pontoGracas);
    expect(relevo.altitudeM).not.toBeNull();
    expect(relevo.cursoDaguaMaisProximo).not.toBeNull();

    const verdes = lerAreasVerdesProximas(pontoGracas);
    expect(verdes.pracaMaisProxima).not.toBeNull();

    const ruido = lerCorredoresDeRuidoDiurno(pontoGracas);
    expect(ruido.corredorOnibusProximo).not.toBeNull();

    const arbo = lerArbovirosesDoBairro("casa-forte");
    expect(arbo).not.toBeNull();
    expect(arbo!.totalConfirmadosProvaveis3Anos).toBeGreaterThan(0);
  });

  it("adapta sínteses inteligentes ao andar (baixo vs. alto) e respeita todas as guardas de vocabulário e zero falso", () => {
    const indice = indiceDoBairro("casa-forte");
    const edificio = indice.edificios.find((x) => x.rua !== undefined) ?? indice.edificios[0]!;

    const andarBaixo = derivarSintesesInteligentes({
      slugBairro: "casa-forte",
      edificio,
      ruaDoBairro: indice.rua ?? null,
      andar: 2,
    });
    const andarAlto = derivarSintesesInteligentes({
      slugBairro: "casa-forte",
      edificio,
      ruaDoBairro: indice.rua ?? null,
      andar: 12,
    });

    expect(andarBaixo.calorEArvores).not.toBeNull();
    expect(andarBaixo.chuvaEAlagamento).not.toBeNull();
    expect(andarBaixo.arboviroses).not.toBeNull();
    expect(andarBaixo.ruidoDiaNoite).not.toBeNull();
    expect(andarBaixo.rendaDoSetor).not.toBeNull();

    expect(andarBaixo.arboviroses?.dicaPratica).toContain("2º andar");
    expect(andarAlto.arboviroses?.dicaPratica).toContain("12º andar");
    expect(andarBaixo.rendaDoSetor?.manchete).toContain("Mediana de R$");

    // Checa sigilo estatístico quando o setor tem renda suprimida: exibe "A confirmar", nunca "R$ 0"
    const censo = baseDeCensoRenda();
    const codigoSigilo = Object.entries(censo.setores).find(([, t]) => t[2] === null)?.[0];
    if (codigoSigilo && indice.rua) {
      const ruaComSigilo = {
        ...indice.rua,
        setores: [
          {
            codigo: codigoSigilo,
            areaDePonderacao: null,
            domicilios: 42,
            onibus: 38,
            calcada: 30,
            obstaculo: 10,
            rampa: 5,
            arvores: 10,
          },
        ],
      };
      const edComSetor0 = {
        ...edificio,
        rua: [0, 0, null, 0, null, 0, null, 0, 0] as [
          number | null,
          number,
          number | null,
          number,
          number | null,
          number,
          number | null,
          number,
          number,
        ],
      };
      const sintSigilo = derivarSintesesInteligentes({
        slugBairro: "casa-forte",
        edificio: edComSetor0,
        ruaDoBairro: ruaComSigilo,
        andar: 3,
      });
      expect(sintSigilo.rendaDoSetor?.medidaDestaque).toBe("A confirmar");
      expect(sintSigilo.rendaDoSetor?.manchete).toContain("sigilo estatístico");
      expect(JSON.stringify(sintSigilo.rendaDoSetor)).not.toMatch(/R\$ 0(?![\d.,])/);
    }

    // Verifica que nenhum cartão usa palavra proibida nem "seguro"
    for (const s of [andarBaixo, andarAlto]) {
      for (const c of [s.calorEArvores, s.chuvaEAlagamento, s.arboviroses, s.ruidoDiaNoite, s.rendaDoSetor]) {
        if (!c) continue;
        // "sem ranking entre setores" aparece apenas como aviso explícito de que NÃO há ranking; validamos as demais
        const textoSemAviso = [c.sobretitulo, c.manchete, c.medidaDestaque, c.explicacaoHumana, c.dicaPratica ?? ""]
          .join("\n")
          .replace(/sem ranking entre setores/gi, "");
        for (const p of PALAVRAS_PROIBIDAS) expect(textoSemAviso).not.toMatch(p);
        expect(textoSemAviso).not.toMatch(/seguro/i);
        expect(textoSemAviso).not.toMatch(/R\$ 0(?![\d.,])/);
      }
    }
  });

  it("renderiza as sínteses do entorno sem recolocar a simulação solar antiga", () => {
    const indice = indiceDoBairro("casa-forte");
    const edificio = indice.edificios[0]!;
    const v = (valor: number) => ({ valor, origem: "link" as const, aConfirmar: false });
    const vazio = { valor: null, origem: "link" as const, aConfirmar: true };
    const analise: AnaliseV2 = esquemaAnaliseV2.parse({
      versao: 2,
      id: "teste-entorno-inteligente",
      criadaEm: "2026-10-20T12:00:00Z",
      atualizadaEm: "2026-10-20T12:00:00Z",
      url: "https://exemplo.invalid/imovel/99",
      nome: "Apartamento em Casa Forte",
      modalidade: "compra",
      tipologia: "apartamento",
      bairro: "casa-forte",
      bairroTexto: "Casa Forte",
      logradouro: edificio.logradouro,
      numero: edificio.numero,
      nomeEdificio: edificio.nome ?? "Edifício Casa Forte",
      extracao: null,
      declarados: {
        preco: v(680000),
        condominio: v(850),
        iptu: { valor: 2400, origem: "link", aConfirmar: false, periodo: "ano" },
        seguroIncendio: vazio,
        taxaServico: vazio,
        outros: vazio,
        area: v(90),
        quartos: v(3),
        suites: vazio,
        banheiros: v(2),
        vagas: v(2),
        andar: v(4),
      },
      vinculo: {
        estado: "confirmado",
        edificioId: edificio.id,
        dsqfl: edificio.dsqfl,
        confirmadoEm: "2026-10-20T12:00:00Z",
        indiceGeradoEm: "2026-10-20T08:15:00Z",
      },
      visita: {
        verificadas: [],
        respostas: {},
        perguntasProprias: [],
        notas: "",
        ruido: null,
        orientacaoGraus: 110,
        segundos: 0,
        concluidaEm: null,
      },
      salva: false,
      descarte: null,
    });

    const entradaRua = indice.rua && META.fontesDaRua ? { bairro: indice.rua, fontes: META.fontesDaRua } : null;
    const visao = derivarDossie(analise, edificio, indice.contexto, indice.obras, [], new Date("2026-10-27T12:00:00Z"), "custo", entradaRua);

    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(Entorno, {
            visao,
            edificio,
            vizinhos: indice.edificios.slice(0, 15),
            orientacaoJanelaGraus: 110,
            slugBairro: "casa-forte",
            ruaDoBairro: indice.rua ?? null,
            contexto: indice.contexto,
            nomeDoBairro: "Casa Forte",
            coberto: true,
            vinculoConfirmado: true,
            aoAbrirFonte: () => undefined,
            aoAbrirMapa: () => undefined,
            aoConfirmarPredio: () => undefined,
            aoMedirSecao: () => undefined,
            aoResponderDefesaCivil: () => undefined,
          }),
        ),
      );
    });

    const textoCompleto = textosDe(arvore.toJSON()).join(" ");
    expect(textoCompleto).not.toContain("Sol, sombra e vento do Recife");
    expect(textoCompleto).not.toContain("Brisa Sudeste");
    expect(textoCompleto).toContain("O que esperar no dia a dia");
    expect(textoCompleto).toContain("Microclima");
    expect(textoCompleto).toContain("Quando chove forte");
    expect(textoCompleto).toContain("Dengue e Chikungunya");
    expect(textoCompleto).toContain("Dia × Noite");
    // 15/11/2026 (copiloto): a renda e a ocupação do setor (Censo) aparecem por padrão, sem toque extra.
    expect(textoCompleto).toContain("Censo 2022 IBGE");
    expect(arvore.root.findAll((n) => n.props.accessibilityLabel === "Ver renda e perfil do setor (Censo)")).toHaveLength(0);
  });
});
