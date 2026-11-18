// Unificação de 19/11/2026: textos que prometiam mais do que o cálculo entrega (itens R8 e R10 do plano).
import { pl } from "../src/dados/formatos";
import { describe, expect, it } from "@jest/globals";
import { derivarCustoPorPartes } from "../src/dados/custoPorPartes";
import { traduzirIndicadoresCidadao } from "../src/dados/cidadao/tradutorCidadao";
import { esquemaAnaliseV2 } from "../src/dados/contratos";
import { avaliarCaminhabilidadeEVidaNaRua } from "../src/dados/dossie/caminhabilidadeEVidaNaRua";
import {
  FATOR_DE_DESVIO_DA_LINHA_RETA,
  fraseDoMetodoDaRotina,
  VELOCIDADE_MEDIA_KMH,
} from "../src/dados/mobilidade/rotinaCasal";
import type { PerfilDoDomicilio } from "../src/estado/PerfilDomicilio";

const VAZIO = { valor: null, origem: "link" as const, aConfirmar: true };
const PERFIL: PerfilDoDomicilio = {
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
};

function analiseDeCompra() {
  return esquemaAnaliseV2.parse({
    versao: 2,
    id: "unif-r10",
    criadaEm: "2026-11-19T12:00:00Z",
    atualizadaEm: "2026-11-19T12:00:00Z",
    url: "https://anuncio.invalid/unif-r10",
    nome: "Apartamento de teste",
    modalidade: "compra",
    tipologia: "apartamento",
    bairro: "boa-viagem",
    bairroTexto: "Boa Viagem",
    logradouro: "Rua Teste",
    numero: "100",
    nomeEdificio: "Edifício Teste",
    extracao: null,
    declarados: {
      preco: { valor: 650_000, origem: "link", aConfirmar: false },
      condominio: { valor: 1_050, origem: "link", aConfirmar: false },
      iptu: { ...VAZIO, periodo: "desconhecido" },
      seguroIncendio: VAZIO,
      taxaServico: VAZIO,
      outros: VAZIO,
      area: { valor: 110, origem: "link", aConfirmar: false },
      quartos: VAZIO,
      suites: VAZIO,
      banheiros: VAZIO,
      vagas: VAZIO,
      andar: VAZIO,
    },
    vinculo: { estado: "pendente" },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true,
    descarte: null,
  });
}

describe("R8: o tempo da rotina é dito como estimativa por linha reta", () => {
  it("a frase do método diz o fator, a velocidade e que não é o trajeto pelas ruas", () => {
    expect(FATOR_DE_DESVIO_DA_LINHA_RETA).toBe(1.38);
    const pico = fraseDoMetodoDaRotina("pico", 20);
    expect(pico).toContain("Estimativa em horário de pico");
    expect(pico).toContain("linha reta × 1,38");
    expect(pico).toContain(`~${VELOCIDADE_MEDIA_KMH.pico} km/h · 20 dias/mês`);
    expect(pico).toContain("Não é o trajeto pelas ruas");
    expect(pico).not.toMatch(/\breal\b/i);
    expect(fraseDoMetodoDaRotina("fora_pico", 12)).toContain(`~${VELOCIDADE_MEDIA_KMH.fora_pico} km/h · 12 dias/mês`);
  });

  it("a caminhabilidade fala em rede de ruas a pé, não em malha real de calçadas", () => {
    const semPredio = avaliarCaminhabilidadeEVidaNaRua({ predio: null, essenciais: null, visaoRua: null, nomeDoBairro: "Boa Viagem" } as never);
    const texto = [semPredio.escopoGranularidade, semPredio.decomposicaoResumo, semPredio.fraseMalhaQuadra].join(" ");
    expect(texto).not.toMatch(/\brea(l|is)\b/i);
    expect(texto).toContain("rede de ruas a pé");
  });
});

describe("R10: a conta da taxa da União só é citada quando o valor do terreno foi informado", () => {
  it("sem valor do terreno, a ficha diz que nada foi lido da SPU", () => {
    const partes = derivarCustoPorPartes(analiseDeCompra(), null, PERFIL, { regimeSpu: "aforamento" });
    expect(partes.spuEstatutario?.baseTerrenoUnidadeReais ?? null).toBeNull();
    const ind01 = traduzirIndicadoresCidadao({ modalidade: "compra", custoPorPartes: partes })[0]!;
    expect(ind01.indicadorId).toBe("IND-01");
    expect(ind01.camada3ProvaMetodo.metodo6Campos.fontePrimaria).toContain("Nenhum valor de terreno da SPU foi lido");
    expect(ind01.camada3ProvaMetodo.metodo6Campos.vintage).toBe("sem leitura");
  });

  it("com o valor do terreno informado, a ficha cita a origem do valor", () => {
    const partes = derivarCustoPorPartes(analiseDeCompra(), null, PERFIL, {
      regimeSpu: "aforamento",
      valorDominioPlenoTerrenoReais: 10_000_000,
      fracaoIdeal: 0.02,
    });
    expect(partes.spuEstatutario?.baseTerrenoUnidadeReais).toBe(200_000);
    const ind01 = traduzirIndicadoresCidadao({ modalidade: "compra", custoPorPartes: partes })[0]!;
    expect(ind01.camada3ProvaMetodo.metodo6Campos.fontePrimaria).toContain("certidão do RIP");
    expect(ind01.camada3ProvaMetodo.metodo6Campos.vintage).toBe("2026-11");
  });
});

describe("revisão de código de 19/11/2026: as frases descrevem a conta", () => {
  it("rotina: a frase diz os minutos fixos por trecho e o mínimo, que empatam imóveis muito perto do destino", () => {
    expect(fraseDoMetodoDaRotina("pico", 20)).toContain("mais 6 min por trecho, com mínimo de 12 min");
    expect(fraseDoMetodoDaRotina("fora_pico", 12)).toContain("mais 4 min por trecho, com mínimo de 10 min");
  });
});

// Pendência 5 do HANDOFF (19/11/2026): plural real, sem "obra(s)" na tela.
describe("plural real", () => {
  it("pl diz 1 no singular e o resto no plural", () => {
    expect(pl(1, "obra relevante", "obras relevantes")).toBe("1 obra relevante");
    expect(pl(0, "obra relevante", "obras relevantes")).toBe("0 obras relevantes");
    expect(pl(3, "transmissão", "transmissões")).toBe("3 transmissões");
  });
});
