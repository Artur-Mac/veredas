import { describe, expect, test } from "@jest/globals";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { TemaDoApp } from "../src/tema/Tema";
import {
  PALAVRAS_PROIBIDAS_UI,
  REGEX_JARGON_CAMADA1,
  traduzirIndicadoresCidadao,
} from "../src/dados/cidadao/tradutorCidadao";
import { filtrarDominanciaInvisivel } from "../src/dados/cidadao/dominanciaInvisivel";
import { CartaoCidadao3Camadas } from "../src/componentes/cidadao/CartaoCidadao3Camadas";
import { DueloFinalistas } from "../src/componentes/cidadao/DueloFinalistas";
import { ConvergenciaFamiliar } from "../src/componentes/cidadao/ConvergenciaFamiliar";
import { SimuladorTco10Anos } from "../src/componentes/cidadao/SimuladorTco10Anos";
import { BussolaSolarBrisa } from "../src/componentes/cidadao/BussolaSolarBrisa";
import { ResumoEvidenciaPartilhavel } from "../src/componentes/cidadao/ResumoEvidenciaPartilhavel";
import { avaliarBioclimatico3d } from "../src/municipios/recife/motores/bioclimatico3d";
import { avaliarAcustica3d } from "../src/nucleo/motores/acustica3d";
import { avaliarHidroMare1m } from "../src/municipios/recife/motores/hidroMare1m";
import { ajustarZeladoriaPuLearningEm } from "../src/nucleo/motores/zeladoriaPuLearning";
import { avaliarResilienciaRedes } from "../src/municipios/recife/motores/resilienciaRedes";
import { analisarItbiNbr14653 } from "../src/municipios/recife/motores/econometriaItbi";
import { derivarCustoPorPartes } from "../src/dados/custoPorPartes";
import { esquemaAnaliseV2, esquemaEdificio } from "../src/dados/contratos";
import type { PerfilDoDomicilio } from "../src/estado/PerfilDomicilio";

function extrairTextos(node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(extrairTextos);
  const out: string[] = [];
  for (const child of node.children ?? []) {
    if (typeof child === "string") out.push(child);
    else out.push(...extrairTextos(child));
  }
  return out;
}

const PERFIL_TESTE: PerfilDoDomicilio = {
  versao: 1,
  configurado: true,
  moradores: 2,
  usoArCondicionado: "noite_1_quarto",
  destinoBairro: "recife",
  modoTransporte: "transporte_publico",
  diasPresenciaisMes: 20,
  entradaPercentualCompra: 20,
  prazoAnosCompra: 30,
  necessidadesDeAcesso: ["mobilidade"],
  orcamentoMensalReais: 5500,
  locaisRotina: [],
  atualizadoEm: null,
};

describe("Milestone 7 — Tradutor Cidadão 3 Camadas, Dominância Invisível e Ferramentas de Decisão", () => {
  test("Todos os 10 cartões cidadãos (IND-01..IND-10) evitam jargão na Camada 1, palavras proibidas e notas 0-100", () => {
    const vazio = { valor: null, origem: "link" as const, aConfirmar: true };
    const analise = esquemaAnaliseV2.parse({
      versao: 2,
      id: "ux-an-1",
      criadaEm: "2026-11-17T10:00:00Z",
      atualizadaEm: "2026-11-17T10:00:00Z",
      url: "https://anuncio.invalid/ux1",
      nome: "Apartamento nas Graças",
      modalidade: "compra",
      tipologia: "apartamento",
      bairro: "gracas",
      bairroTexto: "Graças",
      logradouro: "Rua Teles Junior",
      numero: "150",
      nomeEdificio: "Parador",
      extracao: null,
      declarados: {
        preco: { valor: 650_000, origem: "link", aConfirmar: false },
        condominio: { valor: 900, origem: "link", aConfirmar: false },
        iptu: { ...vazio, periodo: "desconhecido" },
        seguroIncendio: vazio,
        taxaServico: vazio,
        outros: vazio,
        area: { valor: 110, origem: "link", aConfirmar: false },
        quartos: { valor: 3, origem: "link", aConfirmar: false },
        suites: vazio,
        banheiros: { valor: 2, origem: "link", aConfirmar: false },
        vagas: { valor: 2, origem: "link", aConfirmar: false },
        andar: { valor: 8, origem: "link", aConfirmar: false },
      },
      vinculo: {
        estado: "confirmado",
        edificioId: "88001-150",
        dsqfl: "11223344556677",
        confirmadoEm: "2026-11-17T10:00:00Z",
        indiceGeradoEm: "2026-11-17T08:00:00Z",
      },
      visita: {
        verificadas: [],
        respostas: {},
        perguntasProprias: [],
        notas: "",
        ruido: null,
        orientacaoGraus: null,
        segundos: 0,
        concluidaEm: null,
      },
      salva: true,
      descarte: null,
    });

    const predio = esquemaEdificio.parse({
      id: "88001-150",
      bairro: "gracas",
      logradouro: "RUA TELES JUNIOR",
      numero: "150",
      dsqfl: "11223344556677",
      nome: "Parador",
      centro: [-34.901, -8.046],
      poligono: null,
      unidades: 28,
      tipologias: [{ area: 110, unidades: 28, iptuAnualMediano: 2800 }],
      anoConstrucao: 1984,
      pavimentos: 14,
      ate4Pavimentos: false,
      padrao: "Superior",
      iptuAnual: { n: 28, p25: 2500, mediana: 2800, p75: 3100 },
      itbi: null,
      obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
    });

    const partes = derivarCustoPorPartes(analise, predio, PERFIL_TESTE, {
      regimeSpu: "aforamento",
      valorDominioPlenoTerrenoReais: 8_000_000,
      fracaoIdeal: 1 / 28,
      financiamentoSfh: true,
    });

    const cartoes = traduzirIndicadoresCidadao({
      modalidade: "compra",
      dsqfl: "11223344556677",
      cnm16: "077214.2.0045123-71",
      custoPorPartes: partes,
      econometriaItbi: analisarItbiNbr14653([]),
      bioclimatico: avaliarBioclimatico3d({ fachadaAzimuteGraus: 100, andar: 8 }),
      acustica: avaliarAcustica3d({ andar: 8, fachadaVoltadaParaVia: "fundos", tipologiaVia: "coletora", distanciaViaM: 20, anoConstrucao: 1984 }),
      hidroMare: avaliarHidroMare1m({ handM: 1.5, areaDrenadaM2: 500, declividadeTangente: 0.02 }),
      zeladoriaPu: ajustarZeladoriaPuLearningEm([]),
      resiliencia: avaliarResilienciaRedes({ bairroSlug: "gracas", unidadesCondominio: 28, volumeCisternaLitros: 35000 }),
    });

    expect(cartoes).toHaveLength(10);

    for (const c of cartoes) {
      expect(REGEX_JARGON_CAMADA1.test(c.camada1Manchete)).toBe(false);
      expect(c.camada1Manchete).not.toMatch(/\/100|pontua[cç][aã]o\s+\d/i);
      for (const p of PALAVRAS_PROIBIDAS_UI) {
        expect(c.camada1Manchete).not.toMatch(p);
      }
      expect(c.camada3ProvaMetodo.chavesDuplas.dsqfl).toBe("11223344556677");
      expect(c.camada3ProvaMetodo.chavesDuplas.cnm16).toBe("077214.2.0045123-71");
    }

    // Renderiza CartaoCidadao3Camadas e alterna gaveta Camada 3 (toque >= 48)
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        React.createElement(TemaDoApp, null, React.createElement(CartaoCidadao3Camadas, { item: cartoes[0]! })),
      );
    });
    const inicial = extrairTextos(tree.toJSON()).join("\n");
    expect(inicial).not.toContain("Base legal/normativa:");
    const btn = tree.root.find((n) => n.props.accessibilityRole === "button");
    expect(btn.props.style.minHeight).toBeGreaterThanOrEqual(48);
    act(() => btn.props.onPress());
    const expandido = extrairTextos(tree.toJSON()).join("\n");
    expect(expandido).toContain("Base legal/normativa:");
  });

  test("filtrarDominanciaInvisivel move opções dominadas sem usar palavra 'Pareto' e renderiza Duelo/Convergência/TCO/Bússola/Resumo", () => {
    const dom = filtrarDominanciaInvisivel("cad-teste", [
      { id: "A", nomeExibicao: "Finalista Leste", custoMensalTotalReais: 4200, areaM2: 95, deslocamentoMinDia: 25, ruidoInternoDb: 34 },
      { id: "B", nomeExibicao: "Finalista Maior", custoMensalTotalReais: 4800, areaM2: 120, deslocamentoMinDia: 20, ruidoInternoDb: 36 },
      { id: "C", nomeExibicao: "Opção Superada", custoMensalTotalReais: 4900, areaM2: 88, deslocamentoMinDia: 40, ruidoInternoDb: 45 },
    ]);

    expect(dom.finalistasVisiveis.map((x) => x.id)).toEqual(["A", "B"]);
    expect(dom.opcoesSuperadas).toHaveLength(1);
    expect(dom.opcoesSuperadas[0]!.candidato.id).toBe("C");
    expect(dom.tituloGavetaRecolhida).not.toMatch(/Pareto/i);

    let comp!: TestRenderer.ReactTestRenderer;
    act(() => {
      comp = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(
            React.Fragment,
            null,
            React.createElement(DueloFinalistas, {
              opcaoA: {
                id: "A",
                nomeExibicao: "Graças 95m²",
                custoMensalTotalReais: 4200,
                areaM2: 95,
                deslocamentoMinDia: 25,
                ruidoInternoDb: 34,
                situacaoDocumentalResumo: "Matrícula limpa",
                riscoAguaChuvaResumo: "Cota protegida",
              },
              opcaoB: {
                id: "B",
                nomeExibicao: "Torre 120m²",
                custoMensalTotalReais: 4800,
                areaM2: 120,
                deslocamentoMinDia: 20,
                ruidoInternoDb: 36,
                situacaoDocumentalResumo: "Matrícula limpa",
                riscoAguaChuvaResumo: "Checar garagem",
              },
            }),
            React.createElement(ConvergenciaFamiliar, {
              perfilA: { pessoaNome: "Ana", imoveisFavoritosIds: ["A"], tetoMensalReais: 5000, exigeSilencioNoQuarto: true, exigeElevadorOuRampa: false },
              perfilB: { pessoaNome: "Bruno", imoveisFavoritosIds: ["A"], tetoMensalReais: 4400, exigeSilencioNoQuarto: true, exigeElevadorOuRampa: false },
            }),
            React.createElement(SimuladorTco10Anos, {
              entrada: {
                precoCompraReais: 650_000,
                aluguelEquivalenteMensalReais: 3200,
                condominioMensalReais: 900,
                iptuAnualReais: 2400,
                economiaOtimizacaoTributariaReais: 23_427.15,
              },
            }),
            React.createElement(BussolaSolarBrisa, { azimuteGraus: 105, ruidoDbAtual: 35.4 }),
            React.createElement(ResumoEvidenciaPartilhavel, {
              tituloImovel: "Graças 95m²",
              dsqfl: "11223344556677",
              cnm16: "077214.2.0045123-71",
              cartoes: [],
            }),
          ),
        ),
      );
    });

    const textoTudo = extrairTextos(comp.toJSON()).join("\n");
    expect(textoTudo).toContain("zero gravação de áudio");
    expect(textoTudo).not.toMatch(/Pareto/i);
    expect(textoTudo).not.toMatch(/necessidade.*acessibilidade/i);
  });

  test("Todos os arquivos de src/componentes/cidadao usam apenas tokens do tema (zero hex ou rgb solto)", () => {
    const dir = join(__dirname, "..", "src/componentes/cidadao");
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".tsx")) continue;
      const codigo = readFileSync(join(dir, f), "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(codigo.match(/#[0-9A-Fa-f]{3,8}\b|rgba?\(/g)).toBeNull();
    }
  });
});
