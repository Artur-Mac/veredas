import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { derivarCustoPorPartes } from "../src/dados/custoPorPartes";
import { esquemaAnaliseV2, esquemaEdificio } from "../src/dados/contratos";
import type { PerfilDoDomicilio } from "../src/estado/PerfilDomicilio";
import { avaliarEstruturaECondominio } from "../src/municipios/recife/motores/estruturaCondominio";
import { avaliarHidroMare1m } from "../src/municipios/recife/motores/hidroMare1m";
import { avaliarResilienciaRedes } from "../src/municipios/recife/motores/resilienciaRedes";
import { avaliarAcustica3d } from "../src/nucleo/motores/acustica3d";
import { avaliarWalkabilityStreetSmart } from "../src/nucleo/mobilidade/streetSmart";
import { auditarDocumentoVereda, gerarCnm16Formatado } from "../src/nucleo/documentos/auditorDocumental";
import { REGEX_JARGON_CAMADA1, traduzirIndicadoresCidadao } from "../src/dados/cidadao/tradutorCidadao";
import { calcularTco10Anos, SimuladorTco10Anos } from "../src/componentes/cidadao/SimuladorTco10Anos";
import { montarTextoNegociacaoPartilhavel } from "../src/componentes/cidadao/ResumoEvidenciaPartilhavel";

// 19/11/2026 (decisão A8): o prédio vinha do banco SQLite do pacote offline (out/pacote-offline/, fora do git). Com o
// núcleo offline guardado em arquivo/nucleo-offline-2026-11-18, as jornadas usam um prédio de teste fixo.
const PREDIO_DE_TESTE = {
  building_id: "60461-120",
  logradouro: "AV BOA VIAGEM",
  numero: "120",
  dsqfl: "11535105030282",
  nome: "Ed. Teste Boa Viagem",
  lon: -34.8955,
  lat: -8.1215,
  iptu_mediana_anual: 3600,
  ano_construcao: 2000,
  pavimentos: 18,
  padrao: "Superior",
};
const VAZIO = { valor: null, origem: "link" as const, aConfirmar: true };

function criarAnalise(overrides: {
  id: string;
  nome: string;
  modalidade: "compra" | "aluguel";
  bairro: string;
  preco: number;
  condominio: number;
  area: number;
  andar: number;
}) {
  return esquemaAnaliseV2.parse({
    versao: 2,
    id: overrides.id,
    criadaEm: "2026-11-17T12:00:00Z",
    atualizadaEm: "2026-11-17T12:00:00Z",
    url: `https://anuncio.invalid/${overrides.id}`,
    nome: overrides.nome,
    modalidade: overrides.modalidade,
    tipologia: "apartamento",
    bairro: overrides.bairro,
    bairroTexto: overrides.bairro,
    logradouro: "Rua Teste",
    numero: "100",
    nomeEdificio: "Edifício Teste",
    extracao: null,
    declarados: {
      preco: { valor: overrides.preco, origem: "link", aConfirmar: false },
      condominio: { valor: overrides.condominio, origem: "link", aConfirmar: false },
      iptu: { ...VAZIO, periodo: "desconhecido" },
      seguroIncendio: VAZIO,
      taxaServico: VAZIO,
      outros: VAZIO,
      area: { valor: overrides.area, origem: "link", aConfirmar: false },
      quartos: { valor: 3, origem: "link", aConfirmar: false },
      suites: VAZIO,
      banheiros: { valor: 2, origem: "link", aConfirmar: false },
      vagas: { valor: 1, origem: "link", aConfirmar: false },
      andar: { valor: overrides.andar, origem: "link", aConfirmar: false },
    },
    vinculo: { estado: "pendente" },
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
}

function criarPerfil(overrides: Partial<PerfilDoDomicilio> = {}): PerfilDoDomicilio {
  return {
    versao: 1,
    configurado: true,
    moradores: 2,
    usoArCondicionado: "noite_1_quarto",
    destinoBairro: "recife",
    modoTransporte: "transporte_publico",
    diasPresenciaisMes: 20,
    entradaPercentualCompra: 20,
    prazoAnosCompra: 30,
    necessidadesDeAcesso: [],
    orcamentoMensalReais: 5000,
    locaisRotina: [],
    atualizadoEm: null,
    ...overrides,
  };
}

describe("Milestone 8 — Jornadas End-to-End de Personas Reais no Recife", () => {
  test("Persona 1: Comprador 1º imóvel SFH + FGTS em Boa Viagem compara pilotis em Ocupação x torre Aforada e economiza ITBI", () => {
    {
      const edDb = PREDIO_DE_TESTE;

      const predioTorre = esquemaEdificio.parse({
        id: edDb.building_id,
        bairro: "boa-viagem",
        logradouro: edDb.logradouro,
        numero: edDb.numero,
        dsqfl: edDb.dsqfl,
        nome: edDb.nome,
        centro: [edDb.lon, edDb.lat],
        poligono: null,
        unidades: 50,
        tipologias: [{ area: 110, unidades: 50, iptuAnualMediano: edDb.iptu_mediana_anual ?? 3600 }],
        anoConstrucao: edDb.ano_construcao ?? 2000,
        pavimentos: edDb.pavimentos ?? 18,
        ate4Pavimentos: false,
        padrao: edDb.padrao ?? "Superior",
        iptuAnual: null,
        itbi: null,
        obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
      });

      const anCompra = criarAnalise({
        id: "p1-torre",
        nome: "Torre Boa Viagem",
        modalidade: "compra",
        bairro: "boa-viagem",
        preco: 650_000,
        condominio: 1050,
        area: 110,
        andar: 10,
      });

      const partesPilotisOcc = derivarCustoPorPartes(anCompra, { ...predioTorre, unidades: 8, pavimentos: 4 }, criarPerfil(), {
        regimeSpu: "ocupacao",
        valorDominioPlenoTerrenoReais: 4_050_000,
        fracaoIdeal: 1 / 8,
        financiamentoSfh: true,
      });
      expect(partesPilotisOcc.spuEstatutario?.elegivelFgtsCaixa).toBe(false);
      expect(partesPilotisOcc.spuEstatutario?.taxaOcupacaoMensalReais).toBe(843.75);

      const partesTorreAf = derivarCustoPorPartes(anCompra, predioTorre, criarPerfil(), {
        regimeSpu: "aforamento",
        valorDominioPlenoTerrenoReais: 15_300_000,
        fracaoIdeal: 1 / 50,
        financiamentoSfh: true,
      });
      expect(partesTorreAf.spuEstatutario?.elegivelFgtsCaixa).toBe(true);
      expect(partesTorreAf.otimizacaoFechamento?.economiaSfhReais).toBe(23_427.15);

      const cartoes = traduzirIndicadoresCidadao({
        modalidade: "compra",
        dsqfl: edDb.dsqfl,
        cnm16: gerarCnm16Formatado("077214", "2", "0011223"),
        custoPorPartes: partesTorreAf,
      });
      expect(cartoes[0]!.camada1Manchete).toMatch(/FGTS/);
      expect(REGEX_JARGON_CAMADA1.test(cartoes[0]!.camada1Manchete)).toBe(false);

      const tco = calcularTco10Anos({
        precoCompraReais: 650_000,
        aluguelEquivalenteMensalReais: 3200,
        condominioMensalReais: 1050,
        iptuAnualReais: 3600,
        spuAnualReais: partesTorreAf.spuEstatutario?.encargoPatrimonialAnualVigenteReais ?? 0,
        economiaOtimizacaoTributariaReais: partesTorreAf.otimizacaoFechamento?.melhorCenarioEconomiaReais ?? 0,
      });
      expect(tco.desembolsoLiquidoCompra10AnosReais).toBeGreaterThan(0);
      expect(SimuladorTco10Anos).toBeDefined();
    }
  });

  test("Persona 2: Inquilina na Torre segrega cobranças ilegais no boleto (Lei 8.245/91) e audita chuva/maré + AQUA PE 23/11/2026", () => {
    const est = avaliarEstruturaECondominio({
      buildingId: "torre-alq-1",
      bairroSlug: "torre",
      anoConstrucao: 2012,
      pavimentos: 12,
      tipoEstruturaIptu: "Concreto Armado",
      distanciaCostaOuEstuarioM: 600,
      unidadesCondominio: 24,
      itensBoleto: [
        { descricao: "Taxa ordinária condomínio", valorReais: 680, categoria: "ordinaria" },
        { descricao: "Fundo de reserva", valorReais: 68, categoria: "fundo_reserva" },
        { descricao: "Pintura externa fachada", valorReais: 290, categoria: "pintura_externa_desgaste" },
      ],
    });
    expect(est.segregacaoLei8245.totalOrdinarioInquilinoReais).toBe(680);
    expect(est.segregacaoLei8245.totalExtraordinarioLocadorReais).toBe(358);
    expect(est.segregacaoLei8245.itensCobrancaAbusivaNoBoleto).toHaveLength(2);

    const hidro = avaliarHidroMare1m({
      handM: 1.0,
      areaDrenadaM2: 3200,
      declividadeTangente: 0.01,
      cotaTerrenoM: 1.8,
      cotaViaM: 1.9,
      emPoligonalAlagamento2026: true,
      pulsosChuvaProximos: [{ dataHoraUtc: "2026-06-15T06:00:00Z", acumulado3hMm: 52 }],
      leiturasMareDia: [{ hora: "06:30", altura_m: 1.91, tipo: "PM" }],
      statusLimpezaMacrodrenagem: "NÃO FOI LIMPO",
    });
    expect(hidro.eventoCompostoChuvaMareCritica).toBe(true);
    expect(hidro.alertaDrenagemNaoLimpa).toBe(true);

    const redes = avaliarResilienciaRedes(
      { bairroSlug: "torre", unidadesCondominio: 24, volumeCisternaLitros: 20_000 },
      "2026-11-24",
    );
    expect(redes.hidrico.concessionariaDistribuicaoVigente).toBe("AQUA Pernambuco (Acciona + BRK)");
    expect(redes.hidrico.alertaDividaAnterior23Nov2026).toMatch(/23\/11\/2026.*Compesa/);
  });

  test("Persona 3: Família com idoso/cadeirante nas Graças integra semáforos sonoros, silêncio SBRF e partilha sem vazar dado sensível", () => {
    const semPath = join(__dirname, "..", "docs/dados/raw/fontes-prioritarias-2026-11-14/semaforos-acessiveis.json");
    const semaforos = JSON.parse(readFileSync(semPath, "utf-8")) as { bairro: string }[];

    {
      const gracas = [{ ...PREDIO_DE_TESTE, building_id: "teste-gracas", logradouro: "RUA CARNEIRO VILELA", dsqfl: "11280210020150" }];

      const perfilComAcesso = criarPerfil({ necessidadesDeAcesso: ["mobilidade", "visao"] });
      const mob = avaliarWalkabilityStreetSmart({
        servicosProximos: [
          { id: "sup1", categoria: "supermercado", distanciaRedeM: 220 },
          { id: "farm1", categoria: "farmacia", distanciaRedeM: 310 },
        ],
        fatoresRua: {
          comprimentoMedioQuadraM: 90,
          intersecoesPorKm2: 95,
          coberturaCopaArvoresPct: 45,
          iluminacaoDesativada150mCount: 0,
          semaforosSonorosProximosCount: semaforos.filter((s) => /Gra[cç]as/i.test(s.bairro)).length,
        },
      });
      expect(mob.acessibilidadeAuditivaERefugios.semaforosSonorosCount).toBeGreaterThanOrEqual(1);

      const acustica = avaliarAcustica3d({
        andar: 5,
        fachadaVoltadaParaVia: "fundos",
        tipologiaVia: "local",
        distanciaViaM: 25,
        anoConstrucao: 2016,
      });
      expect(acustica.privacidadeAudio.gravacaoAudioBrutoPermitida).toBe(false);

      const an = criarAnalise({
        id: "p3-gracas",
        nome: "Apartamento Graças",
        modalidade: "compra",
        bairro: "gracas",
        preco: 780_000,
        condominio: 980,
        area: 120,
        andar: 5,
      });
      const partes = derivarCustoPorPartes(an, null, perfilComAcesso);
      const cartoes = traduzirIndicadoresCidadao({
        modalidade: "compra",
        dsqfl: gracas[0]!.dsqfl,
        custoPorPartes: partes,
        acustica,
      });
      const textoPartilhado = montarTextoNegociacaoPartilhavel({
        tituloImovel: an.nome,
        dsqfl: gracas[0]!.dsqfl,
        cnm16: null,
        cartoes,
      });
      // Garante sigilo total sobre condições sensíveis de acesso/saúde
      expect(textoPartilhado).not.toMatch(/mobilidade|vis[aã]o|cadeirante|idoso/i);
    }
  });

  test("Persona 4: Diligência estrutural em prédio 4 pav. 1979 e auditoria ONR/ata bloqueiam alucinações com 100% entailment", () => {
    const est = avaliarEstruturaECondominio({
      buildingId: "rmr-1979-4pav",
      bairroSlug: "torre",
      anoConstrucao: 1979,
      anoReferencia: 2026,
      pavimentos: 4,
      tipoEstruturaIptu: "Alvenaria Autoportante",
      distanciaCostaOuEstuarioM: 450,
    });
    expect(est.riscoPredioCaixao).toBe("suspeita_tipologica_alvenaria");
    expect(est.bloqueioSeguroECreditoProvavel).toBe(true);
    expect(est.vistoriaTrienalLei13032.estado).toBe("vencida_ou_ausente");

    const cnm = gerarCnm16Formatado("077214", "2", "0099112");
    const aud = auditarDocumentoVereda({
      docId: "p4-mat-1",
      dataEmissaoCertidaoIso: "2026-11-05",
      dataReferenciaIso: "2026-11-17",
      paginas: [
        {
          pagina: 1,
          texto: [
            `Registro de Imóveis Recife CNM ${cnm}.`,
            "R-4: Penhora expedida pela 5ª Vara Cível da Capital.",
            "Ata de Assembleia aprova cota extra emergencial e cita vaga presa de garagem.",
          ].join("\n"),
        },
      ],
      extrairAssercoesCandidatas: () => [
        { assertionType: "aluc_inventada", literalQuote: "Hipoteca inventada não constante", confidence: 0.99 },
      ],
    });
    expect(aud.onusAtivos).toHaveLength(1);
    expect(aud.alertasCondoScan.map((a) => a.codigo)).toEqual(
      expect.arrayContaining(["chamada_cota_extra", "vaga_presa_ou_rotativa"]),
    );
    expect(aud.rejeitadosPorEntailment).toBe(1);
    expect(aud.taxaCitationEntailment).toBe(1.0);
  });
});
