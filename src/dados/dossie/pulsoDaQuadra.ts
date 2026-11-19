import type { AbsenceState } from "../../nucleo/contratosCanonicos";
import type { ObrasProximas, VisaoDaRua } from "../contratos";
import type { VereditoConfortoTermico } from "../clima/confortoTermico";
import type { ResultadoAcustica3D } from "../../nucleo/motores/acustica3d";
import type { FichaDeMetodo6Campos } from "../fichaDeMetodo";
import type { ResultadoCaminhabilidadeEVida } from "./caminhabilidadeEVidaNaRua";
import { nivelDeSossego } from "../ruido/leitura";
import { DB_DA_NOTA_0, DB_DA_NOTA_10 } from "../ruido/parametros";
import { pl } from "../formatos";

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
  /** Como a nota deste eixo foi calculada, com os números do imóvel (entra na ficha de método). */
  conta: string;
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
  metodo: FichaDeMetodo6Campos;
};

function clampNota(v: number): number {
  return Math.max(1, Math.min(9.8, Math.round(v * 10) / 10));
}

/** Nota de 0 a 10 com uma casa, sem piso nem teto artificial. */
function nota0a10(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v * 10) / 10));
}

const virgula = (n: number) => n.toFixed(1).replace(".", ",");

/** Cada obra relevante em 24 meses tira este tanto da nota; cada demolição, o outro. */
export const PONTOS_POR_OBRA_RELEVANTE = 1.1;
export const PONTOS_POR_DEMOLICAO = 0.9;

export function rotuloAusencia(ausencia: AbsenceState): string {
  if (ausencia === "sem_ocorrencia_no_periodo") return "Sem ocorrência";
  if (ausencia === "nao_se_aplica") return "Não se aplica";
  return "Sem leitura";
}

export function calcularPulsoDaQuadra(params: {
  /** `null` sem prédio confirmado: não há fachada nem vizinhos para a regra de conforto, e o eixo fica sem leitura. */
  conforto: VereditoConfortoTermico | null;
  /** O resultado acústico do prédio pelo modelo de ruído estimado; `null` = sem leitura (o eixo sai da média). */
  acustica: ResultadoAcustica3D | null;
  anoConstrucao: number | null;
  obrasProximas: ObrasProximas | null;
  visaoRua: VisaoDaRua | null;
  vinculoConfirmado: boolean;
  precoInformado: boolean;
  condominioInformado: boolean;
  /** IPTU conhecido (do anúncio ou do cadastro do prédio). */
  iptuConhecido?: boolean;
  spuAtivo: boolean;
  /** Nota a pé do prédio pela rede de ruas; sem ela, o eixo de serviços fica sem leitura. */
  caminhabilidade?: Pick<ResultadoCaminhabilidadeEVida, "notaAPe0a10" | "categorias"> | null;
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
    iptuConhecido = false,
    spuAtivo,
    caminhabilidade = null,
  } = params;

  // 1. Sol e brisa (derivado do indice termico 0-100)
  const notaSol = conforto ? clampNota((100 - conforto.indiceCalor0a100) / 10) : null;
  const eixoSol: EixoPulsoDaQuadra =
    conforto && notaSol !== null
      ? {
          id: "sol_brisa",
          titulo: "Sol e ventilação",
          nota0a10: notaSol,
          ausencia: null,
          rotuloValor: `${notaSol.toFixed(1).replace(".", ",")} / 10`,
          resumo: conforto.selo,
          conta: `10 menos o índice de calor (${conforto.indiceCalor0a100} de 100) dividido por 10`,
        }
      : {
          id: "sol_brisa",
          titulo: "Sol e ventilação",
          nota0a10: null,
          ausencia: "sem_leitura_publicada",
          rotuloValor: "Sem leitura",
          resumo: "Confirme o prédio para ler a fachada, o andar e os vizinhos",
          conta: "sem prédio confirmado, o eixo fica fora da média",
        };

  // 2. Sossego noturno: a mesma nota do placar e do Comparar, a do modelo de ruído estimado (18/11/2026, A1 e A2).
  // Antes era (64 − dB no quarto) ÷ 3,4, com uma via fixa igual para todo prédio. Sem leitura, fora da média.
  const eixoSossego: EixoPulsoDaQuadra =
    acustica === null
      ? {
          id: "sossego",
          titulo: "Sossego noturno",
          nota0a10: null,
          ausencia: "sem_leitura_publicada",
          rotuloValor: "Sem leitura",
          resumo: "Sem estimativa de ruído para este prédio",
          conta: "sem estimativa de ruído para o prédio, o eixo fica fora da média",
        }
      : {
          id: "sossego",
          titulo: "Sossego noturno",
          nota0a10: acustica.notaSossego0a10,
          ausencia: null,
          rotuloValor: `${virgula(acustica.notaSossego0a10)} / 10`,
          resumo: `${nivelDeSossego(acustica.notaSossego0a10)} à noite pelo ruído estimado`,
          conta: `a nota de sossego do ruído estimado à noite na janela (${Math.round(acustica.ruidoExternoCombinadoDbA)} dB(A), estimativa com dados abertos, não medição): 10 com ${DB_DA_NOTA_10} dB(A) ou menos, 0 com ${DB_DA_NOTA_0} ou mais, em linha reta entre os dois`,
        };

  // 3. Serviços a pé: a nota a pé do prédio pela rede de ruas (R2, 19/11/2026: antes era 6,8 fixo mais um tanto por
  // bloco de dado lido, igual para qualquer prédio com a camada da rua). `visaoRua` fica só para dizer por que não há leitura.
  const notaAPe = caminhabilidade?.notaAPe0a10 ?? null;
  const tempos = (caminhabilidade?.categorias ?? [])
    .filter((c) => c.minutosAPe !== null)
    .map((c) => `${c.titulo} ~${c.minutosAPe} min`);
  const eixoRua: EixoPulsoDaQuadra =
    notaAPe === null
      ? {
          id: "rua_servicos",
          titulo: "Serviços a pé",
          nota0a10: null,
          ausencia: "sem_leitura_publicada",
          rotuloValor: "Sem leitura",
          resumo: !vinculoConfirmado
            ? "Confirme o prédio para medir a caminhada até mercado, farmácia, transporte e praça"
            : (visaoRua?.grupos.length ?? 0) === 0
              ? "Camada de rua do bairro indisponível nesta sessão"
              : "Sem caminho medido pela rede de ruas para este prédio",
          conta: "sem caminho medido pela rede de ruas, o eixo fica fora da média",
        }
      : {
          id: "rua_servicos",
          titulo: "Serviços a pé",
          nota0a10: nota0a10(notaAPe),
          ausencia: null,
          rotuloValor: `${virgula(nota0a10(notaAPe))} / 10`,
          resumo: tempos.length > 0 ? `${tempos.join(" · ")} a pé` : "Caminhada medida pela rede de ruas",
          conta: "a nota a pé do prédio: média das notas por minuto de caminhada, com pesos de mercado 30%, farmácia 25%, transporte 25% e praça 20%",
        };

  // 4. Itens do custo conhecidos (R2: antes partia de 8,8 fixo e tirava pontos). A nota é a parte do custo que já se sabe.
  const itensDoCusto: { nome: string; conhecido: boolean }[] = [
    { nome: "preço", conhecido: precoInformado },
    { nome: "condomínio", conhecido: condominioInformado },
    { nome: "IPTU", conhecido: iptuConhecido },
    // O regime do terreno só entra quando há indício de terreno da União; aí ele é um item em aberto.
    ...(spuAtivo ? [{ nome: "regime do terreno da União", conhecido: false }] : []),
  ];
  const conhecidos = itensDoCusto.filter((i) => i.conhecido);
  const emAberto = itensDoCusto.filter((i) => !i.conhecido);
  let eixoCustos: EixoPulsoDaQuadra;
  if (!precoInformado && !condominioInformado) {
    eixoCustos = {
      id: "custos",
      titulo: "Custo conhecido",
      nota0a10: null,
      ausencia: "sem_leitura_publicada",
      rotuloValor: "Sem leitura",
      resumo: "Faltam preço e condomínio declarados para compor a leitura do custo",
      conta: "sem preço e sem condomínio, o eixo fica fora da média",
    };
  } else {
    const notaCusto = nota0a10((10 * conhecidos.length) / itensDoCusto.length);
    eixoCustos = {
      id: "custos",
      titulo: "Custo conhecido",
      nota0a10: notaCusto,
      ausencia: null,
      rotuloValor: `${virgula(notaCusto)} / 10`,
      resumo:
        emAberto.length === 0
          ? `${conhecidos.length} de ${itensDoCusto.length} itens do custo conhecidos`
          : `${conhecidos.length} de ${itensDoCusto.length} itens do custo conhecidos; falta ${emAberto.map((i) => i.nome).join(", ")}`,
      conta: `10 × ${conhecidos.length} itens conhecidos ÷ ${itensDoCusto.length} itens considerados (${itensDoCusto.map((i) => i.nome).join(", ")})`,
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
      conta: "sem ano de construção, o eixo fica fora da média",
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
      conta: `pela idade do prédio (${idade} anos): até 7 anos, 9,1; de 8 a 17, 7,6; de 18 a 31, 6,0; 32 ou mais, 4,8`,
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
      conta: "sem a base de licenças para o endereço, o eixo fica fora da média",
    };
  } else if (obrasProximas.relevantes24m === 0) {
    eixoObras = {
      id: "obras_entorno",
      titulo: "Obras a 150 m",
      // R2: antes 9,2 fixo. Zero obra em 24 meses é um dado do imóvel e entra na mesma conta das outras: 10 − 0.
      nota0a10: 10,
      ausencia: "sem_ocorrencia_no_periodo",
      rotuloValor: "Sem ocorrência",
      resumo: "Nenhuma obra nova, ampliação ou demolição relevante nos últimos 24 meses",
      conta: "10 menos 0 (nenhuma obra relevante nem demolição em 24 meses a 150 m)",
    };
  } else {
    const pen =
      obrasProximas.relevantes24m * PONTOS_POR_OBRA_RELEVANTE + obrasProximas.demolicoes24m * PONTOS_POR_DEMOLICAO;
    const notaObr = nota0a10(10 - pen);
    eixoObras = {
      id: "obras_entorno",
      titulo: "Obras a 150 m",
      nota0a10: notaObr,
      ausencia: null,
      rotuloValor: `${notaObr.toFixed(1).replace(".", ",")} / 10`,
      resumo: `${pl(obrasProximas.relevantes24m, "licença relevante", "licenças relevantes")} em 24 meses num raio de 150 m`,
      conta: `10 menos 1,1 por obra relevante (${obrasProximas.relevantes24m}) e 0,9 por demolição (${obrasProximas.demolicoes24m}) em 24 meses a 150 m`,
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
        "Seis leituras do imóvel e da quadra, cada uma de 0 a 10: sol e ventilação, sossego à noite, serviços a pé, itens do custo conhecidos, idade do prédio e obras licenciadas a 150 m.",
      fonte:
        "Cadastro Imobiliário Recife (IPTU), Lotes Cadastrais, Licenciamento de Obras, rede de ruas a pé (OpenStreetMap), o anúncio que você informou e os cálculos de sol e de ruído do Vereda.",
      data: "Recorte cadastral consolidado de 2026.",
      calculo: `${eixos.map((e) => `${e.titulo}: ${e.conta}`).join(". ")}. Pulso médio: média simples dos eixos com leitura (${validos.length} de 6).`,
      limite:
        "As faixas e os pesos são escolhas do Vereda, não medições; eixo sem dado fica fora da média. Não substitui vistoria da unidade nem atas de condomínio.",
      naVisita: "Confira no local os eixos de nota mais baixa e os que ficaram sem leitura.",
    },
  };
}
