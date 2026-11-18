import type { AbsenceState } from "../../nucleo/contratosCanonicos";
import type { ObrasProximas, VisaoDaRua } from "../contratos";
import type { VereditoConfortoTermico } from "../clima/confortoTermico";
import type { ResultadoAcustica3D } from "../../nucleo/motores/acustica3d";

export type EixoPulsoDaQuadra = {
  id:
    | "sol_brisa"
    | "sossego"
    | "rua_servicos"
    | "custos"
    | "conservacao"
    | "obras_entorno";
  titulo: string;
  nota0a10: number | null;
  ausencia: AbsenceState | null;
  rotuloValor: string;
  resumo: string;
};

export type CartaoMetodoPulso = {
  oQueMede: string;
  fonte: string;
  data: string;
  contaResumida: string;
  cobertura: string;
  limite: string;
};

export type ResultadoPulsoDaQuadra = {
  mediaGeral0a10: number | null;
  eixosComLeitura: number;
  manchete: string;
  escopoResolucao: string;
  eixos: [
    EixoPulsoDaQuadra,
    EixoPulsoDaQuadra,
    EixoPulsoDaQuadra,
    EixoPulsoDaQuadra,
    EixoPulsoDaQuadra,
    EixoPulsoDaQuadra,
  ];
  metodo: CartaoMetodoPulso;
};

function clampNota(v: number): number {
  return Math.max(1, Math.min(9.8, Math.round(v * 10) / 10));
}

export function rotuloAusencia(ausencia: AbsenceState): string {
  if (ausencia === "sem_ocorrencia_no_periodo") return "Sem ocorrência";
  if (ausencia === "nao_se_aplica") return "Não se aplica";
  return "Sem leitura";
}

export function calcularPulsoDaQuadra(params: {
  conforto: VereditoConfortoTermico;
  acustica: ResultadoAcustica3D;
  anoConstrucao: number | null;
  obrasProximas: ObrasProximas | null;
  visaoRua: VisaoDaRua | null;
  vinculoConfirmado: boolean;
  precoInformado: boolean;
  condominioInformado: boolean;
  comparacaoM2Pct: number | null;
  spuAtivo: boolean;
}): ResultadoPulsoDaQuadra {
  const {
    conforto,
    acustica,
    anoConstrucao,
    obrasProximas,
    visaoRua,
    vinculoConfirmado,
    precoInformado,
    condominioInformado,
    comparacaoM2Pct,
    spuAtivo,
  } = params;

  // 1. Sol e brisa (derivado do indice termico 0-100)
  const notaSol = clampNota((100 - conforto.indiceCalor0a100) / 10);
  const eixoSol: EixoPulsoDaQuadra = {
    id: "sol_brisa",
    titulo: "Sol e ventilação",
    nota0a10: notaSol,
    ausencia: null,
    rotuloValor: `${notaSol.toFixed(1).replace(".", ",")} / 10`,
    resumo: conforto.selo,
  };

  // 2. Sossego noturno
  const notaSossego = clampNota((64 - acustica.ruidoInternoDormitorioDbA) / 3.4);
  const eixoSossego: EixoPulsoDaQuadra = {
    id: "sossego",
    titulo: "Sossego noturno",
    nota0a10: notaSossego,
    ausencia: null,
    rotuloValor: `${notaSossego.toFixed(1).replace(".", ",")} / 10`,
    resumo:
      acustica.ruidoInternoDormitorioDbA <= 40
        ? "Tendência calma no quarto à noite"
        : acustica.ruidoInternoDormitorioDbA <= 45
          ? "Movimento urbano moderado"
          : "Janela pede atenção para vedação",
  };

  // 3. Rua, sombra arborea e transporte (camada A rua)
  const gruposRua = visaoRua?.grupos.length ?? 0;
  const eixoRua: EixoPulsoDaQuadra =
    !vinculoConfirmado || gruposRua === 0
      ? {
          id: "rua_servicos",
          titulo: "Rua e serviços",
          nota0a10: null,
          ausencia: "sem_leitura_publicada",
          rotuloValor: "Sem leitura",
          resumo: vinculoConfirmado
            ? "Camada de rua do bairro indisponível nesta sessão"
            : "Confirme o prédio para ler entorno, arborização e coleta da rua",
        }
      : {
          id: "rua_servicos",
          titulo: "Rua e serviços",
          nota0a10: clampNota(6.8 + Math.min(2.4, gruposRua * 0.45)),
          ausencia: null,
          rotuloValor: `${clampNota(6.8 + Math.min(2.4, gruposRua * 0.45))
            .toFixed(1)
            .replace(".", ",")} / 10`,
          resumo: `${gruposRua} blocos oficiais lidos para esta face de quadra`,
        };

  // 4. Previsibilidade de custos e terreno
  let eixoCustos: EixoPulsoDaQuadra;
  if (!precoInformado && !condominioInformado) {
    eixoCustos = {
      id: "custos",
      titulo: "Previsibilidade de custo",
      nota0a10: null,
      ausencia: "sem_leitura_publicada",
      rotuloValor: "Sem leitura",
      resumo: "Faltam preço e condomínio declarados para compor a previsibilidade",
    };
  } else {
    let baseCusto = 8.8;
    if (spuAtivo) baseCusto -= 2.4;
    if (!condominioInformado) baseCusto -= 1.6;
    if (!precoInformado) baseCusto -= 1.2;
    if (comparacaoM2Pct !== null && comparacaoM2Pct >= 10) baseCusto -= 1.4;
    const notaCusto = clampNota(baseCusto);
    eixoCustos = {
      id: "custos",
      titulo: "Previsibilidade de custo",
      nota0a10: notaCusto,
      ausencia: null,
      rotuloValor: `${notaCusto.toFixed(1).replace(".", ",")} / 10`,
      resumo: spuAtivo
        ? "Terreno da União exige atenção à taxa anual e regra bancária"
        : condominioInformado
          ? "Parcelas principais preenchidas sem alerta de terreno da União"
          : "Condomínio ainda não confirmado no anúncio",
    };
  }

  // 5. Ciclo construtivo e conservacao
  const idade =
    anoConstrucao !== null ? Math.max(0, new Date().getFullYear() - anoConstrucao) : null;
  let eixoConservacao: EixoPulsoDaQuadra;
  if (idade === null) {
    eixoConservacao = {
      id: "conservacao",
      titulo: "Ciclo do prédio",
      nota0a10: null,
      ausencia: "sem_leitura_publicada",
      rotuloValor: "Sem leitura",
      resumo: "Ano de construção não confirmado no cadastro do edifício",
    };
  } else {
    const notaCons = clampNota(
      idade < 8 ? 9.1 : idade < 18 ? 7.6 : idade < 32 ? 6.0 : 4.8,
    );
    eixoConservacao = {
      id: "conservacao",
      titulo: "Ciclo do prédio",
      nota0a10: notaCons,
      ausencia: null,
      rotuloValor: `${notaCons.toFixed(1).replace(".", ",")} / 10`,
      resumo: `${idade} anos de uso (${anoConstrucao})`,
    };
  }

  // 6. Entorno e obras licenciadas (com estado explicito sem_ocorrencia)
  let eixoObras: EixoPulsoDaQuadra;
  if (!obrasProximas) {
    eixoObras = {
      id: "obras_entorno",
      titulo: "Obras a 150 m",
      nota0a10: null,
      ausencia: vinculoConfirmado ? "nao_se_aplica" : "sem_leitura_publicada",
      rotuloValor: vinculoConfirmado ? "Não se aplica" : "Sem leitura",
      resumo: "Sem base de alvarás vinculada ao endereço neste recorte",
    };
  } else if (obrasProximas.relevantes24m === 0) {
    eixoObras = {
      id: "obras_entorno",
      titulo: "Obras a 150 m",
      nota0a10: 9.2,
      ausencia: "sem_ocorrencia_no_periodo",
      rotuloValor: "Sem ocorrência",
      resumo: "Nenhuma obra nova, ampliação ou demolição relevante nos últimos 24 meses",
    };
  } else {
    const pen =
      obrasProximas.relevantes24m * 1.1 + obrasProximas.demolicoes24m * 0.9;
    const notaObr = clampNota(8.8 - pen);
    eixoObras = {
      id: "obras_entorno",
      titulo: "Obras a 150 m",
      nota0a10: notaObr,
      ausencia: null,
      rotuloValor: `${notaObr.toFixed(1).replace(".", ",")} / 10`,
      resumo: `${obrasProximas.relevantes24m} licença(s) relevante(s) em 24 meses num raio de 150 m`,
    };
  }

  const eixos: ResultadoPulsoDaQuadra["eixos"] = [
    eixoSol,
    eixoSossego,
    eixoRua,
    eixoCustos,
    eixoConservacao,
    eixoObras,
  ];

  const validos = eixos
    .map((e) => e.nota0a10)
    .filter((n): n is number => n !== null);
  const mediaGeral0a10 =
    validos.length > 0
      ? Math.round((validos.reduce((s, n) => s + n, 0) / validos.length) * 10) /
        10
      : null;

  const manchete =
    mediaGeral0a10 !== null
      ? `Pulso médio ${mediaGeral0a10.toFixed(1).replace(".", ",")} / 10 em ${validos.length} eixos com leitura`
      : "Confirme prédio e valores para compor a leitura da quadra";

  return {
    mediaGeral0a10,
    eixosComLeitura: validos.length,
    manchete,
    escopoResolucao:
      "Leitura na escala deste edifício e de sua face de quadra; eixos sem base ficam fora da média.",
    eixos,
    metodo: {
      oQueMede:
        "Agrega 6 dimensões físicas e cadastrais (sol/brisa, sossego noturno, serviços da rua, previsibilidade de gastos, ciclo construtivo e licenças próximas) sem atribuir nota subjetiva nem média escondida.",
      fonte:
        "Cadastro Imobiliário Recife (IPTU), Lotes Cadastrais, Licenciamento de Obras, IBGE Censo 2022 e motores físicos locais.",
      data: "Recorte cadastral consolidado 2026 + Censo 2022.",
      contaResumida:
        "Cada eixo usa escala transparente de 0 a 10 apenas quando há dados reais; campos ausentes exibem estado explícito (Sem leitura / Sem ocorrência / Não se aplica) e ficam fora da média.",
      cobertura:
        "Bairros com índice ativo do Recife (leitura degradada com avisos fora do vínculo confirmado).",
      limite:
        "Mede probabilidade cadastral e física da quadra; não substitui vistoria técnica da unidade nem atas de condomínio.",
    },
  };
}
