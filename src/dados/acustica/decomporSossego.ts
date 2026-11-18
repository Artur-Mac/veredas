import type { ResultadoAcustica3D } from "../../nucleo/motores/acustica3d";
import type { FichaDeMetodo6Campos } from "../fichaDeMetodo";
import { fichaGeralDoRuido } from "../ruido/estimativa";
import { nivelDeSossego } from "../ruido/leitura";

export type NivelSossego = "Calmo" | "Moderado" | "Intenso";

export type FonteDeSossego = {
  id: "transito" | "movimento" | "janela" | "avioes";
  titulo: string;
  nivel: NivelSossego;
  resumo: string;
};

export type SinteseSossego = {
  nivelQuarto: NivelSossego;
  rotuloCurtoPlacar: NivelSossego;
  subtituloPlacar: string;
  tituloQuarto: string;
  /** A palavra da nota de sossego do modelo (a mesma do placar, do pulso e do Comparar). */
  rotuloSelo: string;
  notaSossego0a10: number;
  indice0a100Interno: number;
  indice0a100Externo: number;
  notaJanela: string;
  avisoEstimativaSemLaudo: string;
  fontes: FonteDeSossego[];
  /** A ficha "como foi calculada" da nota de sossego (decisão A13): a do prédio, quando veio da estimativa; senão, a geral. */
  metodo: FichaDeMetodo6Campos;
};

export function classificarNivelSossegoPorDbInterno(dbInterno: number): {
  nivel: NivelSossego;
  rotuloComparar: string;
  subtituloPlacar: string;
} {
  if (dbInterno <= 40) {
    return {
      nivel: "Calmo",
      rotuloComparar: "Calmo à noite",
      subtituloPlacar: "Ambiente noturno calmo",
    };
  }
  if (dbInterno <= 45) {
    return {
      nivel: "Moderado",
      rotuloComparar: "Ruído moderado",
      subtituloPlacar: "Som urbano moderado",
    };
  }
  return {
    nivel: "Intenso",
    rotuloComparar: "Ruído ativo",
    subtituloPlacar: "Atenção à janela à noite",
  };
}

function nivelPorExterno(dbExterno: number): NivelSossego {
  if (dbExterno < 56) return "Calmo";
  if (dbExterno < 66) return "Moderado";
  return "Intenso";
}

export function decomporSossego(
  acustica: ResultadoAcustica3D,
  anoConstrucao: number | null,
  fichaDoPredio?: FichaDeMetodo6Campos | null,
): SinteseSossego {
  const internoDb = acustica.ruidoInternoDormitorioDbA;
  const externoDb = acustica.ruidoExternoCombinadoDbA;
  const viaDb = acustica.ruidoExternoViaDbA;

  const { nivel, subtituloPlacar } = classificarNivelSossegoPorDbInterno(internoDb);

  const indice0a100Interno = Math.max(
    6,
    Math.min(94, Math.round(((internoDb - 26) / 42) * 100)),
  );
  const indice0a100Externo = Math.max(
    8,
    Math.min(96, Math.round(((externoDb - 40) / 42) * 100)),
  );

  // Revisão de 19/11/2026: o selo e o título tinham faixas próprias pelo dB do quarto ("Tranquilo", "Quarto calmo…") e
  // o placar mostrava outra palavra para o mesmo prédio ("Muito tranquilo"). Agora a palavra é uma só, a da nota.
  const rotuloSelo = nivelDeSossego(acustica.notaSossego0a10);
  const tituloQuarto = `${rotuloSelo} à noite, pela estimativa`;

  // Fonte 1: Transito da via
  const nivelTransito = nivelPorExterno(viaDb);
  const resumoTransito =
    acustica.atenuacaoFachadaFundosDb >= 8
      ? "Fachada voltada para os fundos ajuda a proteger o quarto da rua"
      : viaDb >= 66
        ? "Fluxo intenso de via movimentada próximo à fachada frontal"
        : viaDb >= 56
          ? "Tráfego intermediário com picos em horários de deslocamento"
          : "Via local com baixo fluxo contínuo de veículos";

  // Fonte 2: Movimento noturno / entorno
  const temMovimentoLuse = acustica.agendaPiorHoraVisita.some((a) =>
    /bars|bares|LUSE|eventos/i.test(a),
  );
  const nivelMovimento: NivelSossego = temMovimentoLuse
    ? "Intenso"
    : viaDb >= 64
      ? "Moderado"
      : "Calmo";
  const resumoMovimento = temMovimentoLuse
    ? "Locais com atividade noturna ou música nas proximidades"
    : viaDb >= 64
      ? "Entorno misto com circulação até o início da noite"
      : "Entorno predominantemente residencial após as 22h";

  // Fonte 3: Janela / esquadria do edificio
  const esquadriaAntiga = anoConstrucao !== null && anoConstrucao < 2013;
  const esquadriaForte = acustica.isolamentoFachadaD2mnTwDb >= 30;
  const nivelJanela: NivelSossego = esquadriaForte
    ? "Calmo"
    : esquadriaAntiga
      ? "Intenso"
      : "Moderado";

  const notaJanela =
    anoConstrucao !== null && anoConstrucao < 2013
      ? `Prédio de ${anoConstrucao}: janelas antigas filtram menos o som da rua (vale checar vedação na visita).`
      : esquadriaForte
        ? "Esquadria reforçada ajuda a conter o som externo com a janela fechada."
        : "Esquadria padrão amortece parte do som externo ao fechar o quarto.";

  const resumoJanela = esquadriaAntiga
    ? `Projeto anterior a 2013 (vedação pede teste presencial na visita)`
    : esquadriaForte
      ? "Vedação reforçada favorece o isolamento interno"
      : "Proteção padrão com vidro comum de edifício pós-2013";

  const fontes: FonteDeSossego[] = [
    {
      id: "transito",
      titulo: "Trânsito da via",
      nivel: nivelTransito,
      resumo: resumoTransito,
    },
    {
      id: "movimento",
      titulo: "Movimento e entorno",
      nivel: nivelMovimento,
      resumo: resumoMovimento,
    },
    {
      id: "janela",
      titulo: "Janela do prédio",
      nivel: nivelJanela,
      resumo: resumoJanela,
    },
  ];

  if (acustica.ruidoExternoAeronavePezrDb >= 55) {
    fontes.push({
      id: "avioes",
      titulo: "Rota aérea",
      nivel: acustica.ruidoExternoAeronavePezrDb >= 65 ? "Intenso" : "Moderado",
      resumo: "Imóvel em faixa de sobrevoo aeronáutico (não atenua em andares altos)",
    });
  }

  // 18/11/2026 (A1): uma nota só no app, a do modelo de ruído estimado (a mesma do placar, do pulso e do Comparar).
  const notaSossego0a10 = acustica.notaSossego0a10;
  const avisoEstimativaSemLaudo =
    "Estimativa por proximidade de fontes e época construtiva; não equivale a medição acústica no local.";

  return {
    nivelQuarto: nivel,
    rotuloCurtoPlacar: nivel,
    subtituloPlacar,
    tituloQuarto,
    rotuloSelo,
    notaSossego0a10,
    indice0a100Interno,
    indice0a100Externo,
    notaJanela,
    avisoEstimativaSemLaudo,
    fontes,
    metodo: fichaDoPredio ?? fichaGeralDoRuido(),
  };
}
