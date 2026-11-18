import { describe, expect, test } from "@jest/globals";
import { calcularSpuEstatutario, calcularTetoReajusteSpu } from "../src/nucleo/motores/spuMarinha";
import { avaliarEstruturaECondominio, classificarMaresiaNbr6118 } from "../src/municipios/recife/motores/estruturaCondominio";
import { analisarItbiNbr14653, simularOtimizacaoItbiRecife, TETO_SFH_RECIFE_2026_REAIS } from "../src/municipios/recife/motores/econometriaItbi";
import { derivarCustoPorPartes } from "../src/dados/custoPorPartes";
import { esquemaAnaliseV2, type Edificio } from "../src/dados/contratos";
import type { PerfilDoDomicilio } from "../src/estado/PerfilDomicilio";

const PERFIL_PADRAO: PerfilDoDomicilio = {
  versao: 1,
  configurado: false,
  moradores: 2,
  usoArCondicionado: "noite_1_quarto",
  destinoBairro: null,
  modoTransporte: "transporte_publico",
  diasPresenciaisMes: 20,
  entradaPercentualCompra: 20,
  prazoAnosCompra: 30,
  necessidadesDeAcesso: [],
  orcamentoMensalReais: null,
  locaisRotina: [],
  atualizadoEm: null,
};

describe("Milestone 3 — SPU Estatutário, Estrutura/Condomínio e Econometria/Otimizador ITBI", () => {
  test("IND-01 SPU calcula laudêmio, foro/ocupação, conversão e remição apenas sobre o domínio pleno do terreno pela fração ideal", () => {
    const torre50 = calcularSpuEstatutario({
      regime: "aforamento",
      valorDominioPlenoTerrenoReais: 15_300_000,
      fracaoIdeal: 1 / 50,
      precoImovelReais: 1_200_000,
    });
    expect(torre50.baseTerrenoUnidadeReais).toBe(306_000);
    expect(torre50.laudemio5PctVendedorReais).toBe(15_300);
    expect(torre50.taxaOcupacaoMensalReais).toBe(510);
    expect(torre50.foroMensalReais).toBe(153);
    expect(torre50.custoRemicaoForo17PctReais).toBe(52_020);
    expect(torre50.elegivelFgtsCaixa).toBe(true);
    expect(torre50.epistemicTag).toBe("registro_oficial");

    const pilotis8 = calcularSpuEstatutario({
      regime: "ocupacao",
      valorDominioPlenoTerrenoReais: 4_050_000,
      fracaoIdeal: 1 / 8,
      precoImovelReais: 850_000,
      portariaAutorizativaAtiva: false,
    });
    expect(pilotis8.baseTerrenoUnidadeReais).toBe(506_250);
    expect(pilotis8.taxaOcupacaoMensalReais).toBe(843.75);
    expect(pilotis8.custoConversao83PctReais).toBe(420_187.5);
    expect(pilotis8.elegivelFgtsCaixa).toBe(false);
    expect(pilotis8.bloqueioFgtsMotivo).toMatch(/FGTS/i);
    expect(pilotis8.prazoOrdinarioSpuDias).toBe(180);

    const alodial = calcularSpuEstatutario({
      regime: "alodial",
      valorDominioPlenoTerrenoReais: null,
      fracaoIdeal: null,
    });
    expect(alodial.laudemio5PctVendedorReais).toBe(0);
    expect(alodial.elegivelFgtsCaixa).toBe(true);
    // Lei 14.474/2022: o teto é 2× o IPCA do ano anterior; os 10,06% valeram só em 2022.
    expect(calcularTetoReajusteSpu(0.045)).toBe(0.09);
    expect(alodial.tetoReajusteAnualPct).toBeNull();
  });

  test("Otimizador do ITBI (arts. 52 e 55 do Código Tributário do Recife) reproduz os cenários de R$ 650 mil e o limite do SFH de 2026, sem valor de cartório", () => {
    expect(TETO_SFH_RECIFE_2026_REAIS).toBe(1_036_600.71);

    const sim = simularOtimizacaoItbiRecife({
      precoImovelReais: 650_000,
      financiamentoSfh: true,
      percentualFinanciado: 0.8,
    });

    expect(sim.semOrientacao3Pct.itbiReais).toBe(19_500);
    expect(sim.semOrientacao3Pct.escrituraERegistroReais).toBeNull();
    expect(sim.semOrientacao3Pct.prazoLegalDias).toBeNull();

    expect(sim.aVistaTempestivo18Pct.itbiReais).toBe(11_700);
    expect(sim.aVistaTempestivo18Pct.prazoLegalDias).toBe(180);
    expect(sim.economiaAVistaTempestivoReais).toBe(7_800);

    expect(sim.sfhOtimizado1Pct).not.toBeNull();
    expect(sim.sfhOtimizado1Pct!.itbiReais).toBe(7_540);
    expect(sim.sfhOtimizado1Pct!.prazoLegalDias).toBe(180);
    expect(sim.sfhOtimizado1Pct!.escrituraERegistroReais).toBeNull();
    expect(sim.economiaSfhReais).toBe(11_960);
    expect(sim.melhorCenarioEconomiaReais).toBe(11_960);
    expect(sim.notaBaseDeCalculoLc227).toMatch(/Lei Complementar federal 227\/2026, de 13\/01\/2026, mudou o art\. 38 do Código Tributário Nacional/);
    expect(sim.notaBaseDeCalculoLc227).toMatch(/Lei 19\.490\/2026/);
    expect(sim.notaBaseDeCalculoLc227).not.toMatch(/Tema 1\.124|Tema 1\.113|ônus da prova/);
  });

  test("IND-07 Econometria NBR 14653-2 aplica expurgo de fração parcial, Chauvenet, IC 80% (Grau I–III) e Repeat-Sales", () => {
    const registros = [
      { id: "1", dataTransacao: "2024-03-10", valorAvaliacaoReais: 600_000, areaConstruidaM2: 110, fracaoIdeal: 1, complemento: "APTO 101", estadoConservacao: "Bom", sfh: true },
      { id: "2", dataTransacao: "2024-07-12", valorAvaliacaoReais: 615_000, areaConstruidaM2: 110, fracaoIdeal: 1, complemento: "APTO 201", estadoConservacao: "Bom", sfh: true },
      { id: "3", dataTransacao: "2025-01-18", valorAvaliacaoReais: 625_000, areaConstruidaM2: 110, fracaoIdeal: 1, complemento: "APTO 301", estadoConservacao: "Bom", sfh: false },
      { id: "4", dataTransacao: "2025-06-05", valorAvaliacaoReais: 640_000, areaConstruidaM2: 110, fracaoIdeal: 1, complemento: "APTO 401", estadoConservacao: "Bom", sfh: true },
      { id: "5", dataTransacao: "2026-04-02", valorAvaliacaoReais: 726_000, areaConstruidaM2: 110, fracaoIdeal: 1, complemento: "APTO 101", estadoConservacao: "Bom", sfh: true },
      // Fração parcial de garagem (0.5) e outlier extremo de Chauvenet (3.8M) devem ser expurgados
      { id: "p", dataTransacao: "2025-02-01", valorAvaliacaoReais: 310_000, areaConstruidaM2: 110, fracaoIdeal: 0.5, complemento: "APTO 501", sfh: false },
      { id: "out", dataTransacao: "2025-03-01", valorAvaliacaoReais: 3_800_000, areaConstruidaM2: 110, fracaoIdeal: 1, complemento: "COBERTURA", sfh: false },
    ];

    const eco = analisarItbiNbr14653(registros, {
      totalUnidadesPredio: 20,
      anosJanela: 3,
      fracaoIdealEsperada: 1,
    });
    expect(eco.expurgosFracaoParcial).toBe(1);
    expect(eco.expurgosChauvenet).toBe(1);
    expect(eco.amostraValidaN).toBe(5);
    expect(eco.repeatSalesPares).toBe(1);
    expect(eco.valorizacaoAnualCagrPct).toBeGreaterThan(8);
    expect(eco.grauPrecisao).toBe("Grau_III");
    expect(eco.amplitudeIc80Pct).toBeLessThanOrEqual(15);
    expect(eco.taxaLiquidezAnualLambdaB).toBeCloseTo(5 / 3 / 20, 3);
  });

  test("IND-02 & IND-09 Estrutura, VUP NBR 15575-1:2025, NBR 6118, Lei 13.032/06, TRF5 e Lei 8.245/91 segregam boleto e triam risco", () => {
    expect(classificarMaresiaNbr6118(100)).toBe("CAA-IV");
    expect(classificarMaresiaNbr6118(500)).toBe("CAA-III");
    expect(classificarMaresiaNbr6118(2500)).toBe("CAA-II");

    const caixaoTrf5 = avaliarEstruturaECondominio({
      buildingId: "B1",
      bairroSlug: "torre",
      anoConstrucao: 1980,
      anoReferencia: 2026,
      pavimentos: 4,
      tipoEstruturaIptu: "Alvenaria Autoportante",
      distanciaCostaOuEstuarioM: 120,
      constaAcordoTrf5_431: true,
      ultimaVistoriaAno: 2021,
      ultimaReformaFachadaAno: 2019,
      saldoFundoReservaReais: 40_000,
      orcamentoEstimadoObraReais: 200_000,
      unidadesCondominio: 16,
      itensBoleto: [
        { descricao: "Cota condominial ordinária", valorReais: 750, categoria: "ordinaria" },
        { descricao: "Fundo de reserva 10%", valorReais: 75, categoria: "fundo_reserva" },
        { descricao: "Rateio reforma estrutural de fachada", valorReais: 320, categoria: "obra_estrutural" },
      ],
    });

    expect(caixaoTrf5.classeAgressividade).toBe("CAA-IV");
    expect(caixaoTrf5.riscoPredioCaixao).toBe("confirmado_acordo_trf5");
    expect(caixaoTrf5.indenizacaoReferenciaTrf5TetoReais).toBe(120_000);
    // Prédio de 1980 (46 anos): vistoria a cada 3 anos; a de 2021 valia até 2024.
    expect(caixaoTrf5.vistoriaPeriodicaLei13032).toEqual({ obrigatoria: true, intervaloAnos: 3, estado: "vencida_ou_ausente", proximaVistoriaAteAno: 2024 });
    expect(caixaoTrf5.sistemasEmJanelaCritica.length).toBeGreaterThanOrEqual(3);
    expect(caixaoTrf5.choqueCotaExtraEstimadoPorUnidadeReais).toBeGreaterThan(10_000);
    expect(caixaoTrf5.segregacaoLei8245.totalOrdinarioInquilinoReais).toBe(750);
    expect(caixaoTrf5.segregacaoLei8245.totalExtraordinarioLocadorReais).toBe(395);
    expect(caixaoTrf5.segregacaoLei8245.itensCobrancaAbusivaNoBoleto).toHaveLength(2);
    expect(caixaoTrf5.alertaPropterRemStj).toBe(
      "Dívida de condomínio acompanha o imóvel (STJ, REsp 1.910.280, Segunda Seção, 2025): quem figura na matrícula responde pelos débitos da unidade. Exija certidão negativa de débitos condominiais antes do sinal.",
    );
    expect(caixaoTrf5.alertaPropterRemStj).not.toMatch(/2\.147\.665/);
  });

  test("derivarCustoPorPartes integra spuEstatutario, otimizacaoFechamento e estruturaECondominio sem quebrar contrato anterior", () => {
    const predioMock: Edificio = {
      id: "edf-bv-01",
      bairro: "boa-viagem",
      logradouro: "AV BOA VIAGEM",
      numero: "1200",
      dsqfl: "01020304050607",
      nome: "Edifício Atlântico Sul",
      centro: [-34.8895, -8.1162],
      poligono: null,
      unidades: 50,
      tipologias: [{ area: 110, unidades: 50, iptuAnualMediano: 3600 }],
      anoConstrucao: 1998,
      pavimentos: 16,
      ate4Pavimentos: false,
      padrao: "Superior",
      iptuAnual: { n: 50, p25: 3400, mediana: 3600, p75: 3800 },
      itbi: null,
      obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
    };

    const vazio = { valor: null, origem: "link" as const, aConfirmar: true };
    const analiseMock = esquemaAnaliseV2.parse({
      versao: 2,
      id: "a1",
      criadaEm: "2026-11-17T10:00:00Z",
      atualizadaEm: "2026-11-17T10:00:00Z",
      url: "https://anuncio.invalid/bv-1200",
      nome: "Apartamento em Boa Viagem",
      modalidade: "compra",
      tipologia: "apartamento",
      bairro: "boa-viagem",
      bairroTexto: "Boa Viagem",
      logradouro: "Av Boa Viagem",
      numero: "1200",
      nomeEdificio: "Edifício Atlântico Sul",
      extracao: null,
      declarados: {
        preco: { valor: 650_000, origem: "link", aConfirmar: false },
        condominio: { valor: 1100, origem: "link", aConfirmar: false },
        iptu: { ...vazio, periodo: "desconhecido" },
        seguroIncendio: vazio,
        taxaServico: vazio,
        outros: vazio,
        area: { valor: 110, origem: "link", aConfirmar: false },
        quartos: { valor: 3, origem: "link", aConfirmar: false },
        suites: vazio,
        banheiros: { valor: 3, origem: "link", aConfirmar: false },
        vagas: { valor: 2, origem: "link", aConfirmar: false },
        andar: { valor: 8, origem: "link", aConfirmar: false },
      },
      vinculo: {
        estado: "confirmado",
        edificioId: "edf-bv-01",
        dsqfl: "01020304050607",
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

    const partes = derivarCustoPorPartes(analiseMock, predioMock, PERFIL_PADRAO, {
      regimeSpu: "aforamento",
      valorDominioPlenoTerrenoReais: 15_300_000,
      fracaoIdeal: 1 / 50,
      financiamentoSfh: true,
    });

    expect(partes.alertaMarinha?.laudemioReferencia5PctReais).toBe(15_300);
    expect(partes.spuEstatutario?.foroMensalReais).toBe(153);
    expect(partes.otimizacaoFechamento?.economiaSfhReais).toBe(11_960);
    expect(partes.estruturaECondominio?.classeAgressividade).toBe("CAA-IV");
  });
});
