// Andar e fachada ativos de uma análise: um estado só para o placar do dossiê, o simulador andar × fachada (valor
// inicial) e o Comparar (pendência 1 do HANDOFF de 19/11/2026). Antes, o placar supunha o 4º andar sem dizer, o
// simulador começava no meio do prédio e sem fachada, e o Comparar usava a fachada sugerida no conforto e o grau cru da
// bússola no ruído: o mesmo imóvel mostrava duas notas de sossego (prédio 12955-45: 9,4 no placar e 6,9 no simulador) e
// dois selos de conforto (prédio 10227-187 com bússola de 20°).
//
// Regra:
// - andar: o que a pessoa escolheu na tela; senão o do anúncio; senão uma suposição dita na tela (meio do prédio, ou o
//   4º andar quando o cadastro não traz os pavimentos). Sempre entre o 1º e o último andar com janela do cadastro;
// - fachada: a que a pessoa escolheu; senão a inferida mais próxima da bússola da visita; senão a sugerida pela rua e
//   pelo anúncio. Conforto e ruído usam o rumo dessa fachada inferida, nunca o grau cru da bússola.
import type { AnaliseV2, Edificio } from "../contratos";
import type { MicroclimaDoPonto } from "../clima/microclima";
import { avaliarConfortoTermico, type VereditoConfortoTermico } from "../clima/confortoTermico";
import { estimarRuido, type EstimativaDeRuido } from "../ruido/estimativa";
import { inferirFachadasDoEdificio, type FachadaInferida, type InferenciaDeFachadas, type PapelFachada, type VizinhoParaFachada } from "../sol/inferirFachadas";
import { avaliarBioclimatico3d } from "../../municipios/recife/motores/bioclimatico3d";

/** Andar suposto quando nem a pessoa nem o anúncio dizem e o cadastro não traz os pavimentos. */
export const ANDAR_SUPOSTO_SEM_CADASTRO = 4;
/** Centro usado só para a geometria da fachada quando não há prédio nem ponto da visita (nenhuma nota sai dele). */
const CENTRO_SEM_PONTO: [number, number] = [-34.896, -8.121];

export type OrigemDoAndar = "escolhido" | "anuncio" | "suposto" | "casa";
export type OrigemDaFachada = "escolhida" | "bussola" | "sugerida";

export type UnidadeAtiva = {
  andar: number;
  origemDoAndar: OrigemDoAndar;
  fachada: FachadaInferida;
  origemDaFachada: OrigemDaFachada;
  /** "9º andar (do anúncio) · fachada Nascente (pela bússola da visita)" */
  descricao: string;
};

/** O último andar com janela que o simulador oferece: pavimentos do cadastro menos o térreo (20 sem cadastro). */
export const ultimoAndar = (pavimentos: number | null | undefined): number => Math.max(1, (pavimentos ?? 20) - 1);

/** Entre o térreo (0) e o último andar com janela do cadastro. */
const limitar = (andar: number, pavimentos: number | null | undefined): number => Math.min(ultimoAndar(pavimentos), Math.max(0, Math.round(andar)));
const nomeDoAndar = (andar: number): string => (andar === 0 ? "térreo" : `${andar}º andar`);

const diferencaAngular = (a: number, b: number): number => Math.abs(((a - b + 540) % 360) - 180);

/** A fachada inferida cujo rumo fica mais perto do grau lido na bússola. */
export function fachadaMaisProxima(inferencia: Pick<InferenciaDeFachadas, "fachadas">, graus: number): FachadaInferida {
  return [...inferencia.fachadas].sort((a, b) => diferencaAngular(a.azimuteGraus, graus) - diferencaAngular(b.azimuteGraus, graus))[0]!;
}

const TEXTO_DO_ANDAR: Record<OrigemDoAndar, string> = {
  escolhido: "escolhido por você",
  anuncio: "do anúncio",
  suposto: "suposto; o anúncio não diz o andar",
  casa: "casa",
};
const TEXTO_DA_FACHADA: Record<OrigemDaFachada, string> = {
  escolhida: "escolhida por você",
  bussola: "pela bússola da visita",
  sugerida: "sugerida pela rua e pelo anúncio",
};

export function escolherUnidadeAtiva(entrada: {
  inferencia: InferenciaDeFachadas;
  pavimentos: number | null | undefined;
  andarDeclarado: number | null | undefined;
  andarEscolhido?: number | null;
  fachadaEscolhida?: PapelFachada | null;
  orientacaoBussolaGraus?: number | null;
  /** "casa" põe a janela no térreo, como o simulador (revisão de 19/11/2026). */
  tipologia?: string | null;
}): UnidadeAtiva {
  const { inferencia, pavimentos } = entrada;
  const [andarBruto, origemDoAndar]: [number, OrigemDoAndar] =
    entrada.tipologia === "casa"
      ? [0, "casa"]
      : entrada.andarEscolhido != null
        ? [entrada.andarEscolhido, "escolhido"]
        : entrada.andarDeclarado != null
          ? [entrada.andarDeclarado, "anuncio"]
          : [pavimentos != null ? Math.ceil(ultimoAndar(pavimentos) / 2) : ANDAR_SUPOSTO_SEM_CADASTRO, "suposto"];
  const andar = limitar(andarBruto, pavimentos);

  const sugerida = inferencia.fachadas.find((f) => f.id === inferencia.fachadaSugeridaId) ?? inferencia.frente;
  const escolhida = entrada.fachadaEscolhida ? inferencia.fachadas.find((f) => f.id === entrada.fachadaEscolhida) ?? null : null;
  const [fachada, origemDaFachada]: [FachadaInferida, OrigemDaFachada] = escolhida
    ? [escolhida, "escolhida"]
    : entrada.orientacaoBussolaGraus != null
      ? [fachadaMaisProxima(inferencia, entrada.orientacaoBussolaGraus), "bussola"]
      : [sugerida, "sugerida"];

  // Revisão de 19/11/2026: quando o andar foi limitado ao cadastro, a descrição diz isso, em vez de "do anúncio".
  const limitado = Math.round(andarBruto) !== andar;
  const andarTexto =
    origemDoAndar === "suposto" && pavimentos != null
      ? "suposto no meio do prédio; o anúncio não diz o andar"
      : limitado && origemDoAndar === "anuncio"
        ? `o anúncio diz ${nomeDoAndar(Math.round(andarBruto))}; o cadastro tem ${pavimentos} pavimentos`
        : TEXTO_DO_ANDAR[origemDoAndar];
  return {
    andar,
    origemDoAndar,
    fachada,
    origemDaFachada,
    descricao: `${nomeDoAndar(andar)} (${andarTexto}) · fachada ${fachada.orientacaoSolar} (${TEXTO_DA_FACHADA[origemDaFachada]})`,
  };
}

/** A inferência de fachadas de uma análise, com os mesmos vizinhos e o mesmo texto do anúncio no dossiê e no Comparar. */
export function inferirFachadasDaAnalise(
  analise: Pick<AnaliseV2, "id" | "bairro" | "bairroTexto" | "logradouro" | "nome" | "nomeEdificio" | "extracao" | "caderno">,
  predio: Edificio | null,
  vizinhosDoBairro: readonly VizinhoParaFachada[],
): InferenciaDeFachadas {
  const visita = analise.caderno?.localizacaoDaVisita;
  const centro: [number, number] = predio?.centro ?? (visita ? [visita.longitude, visita.latitude] : CENTRO_SEM_PONTO);
  return inferirFachadasDoEdificio({
    edificio: predio ?? {
      id: analise.id,
      bairro: analise.bairro ?? "boa-viagem",
      logradouro: analise.logradouro || analise.bairroTexto || "Via local",
      centro,
      poligono: null,
    },
    vizinhosDoBairro,
    textoAnuncio: [analise.nome, analise.nomeEdificio, ...(analise.extracao?.campos.comodidades ?? [])].filter(Boolean).join(" "),
  });
}

export type LeituraDaUnidade = {
  bioclimatico: ReturnType<typeof avaliarBioclimatico3d>;
  conforto: VereditoConfortoTermico;
  ruido: EstimativaDeRuido;
};

/** Conforto e ruído na unidade ativa: a mesma conta no placar, no simulador (de partida) e no Comparar. */
export function lerUnidade(predio: Edificio | null, unidade: Pick<UnidadeAtiva, "andar" | "fachada">, microclima: MicroclimaDoPonto): LeituraDaUnidade {
  const { andar, fachada } = unidade;
  const bioclimatico = avaliarBioclimatico3d({ fachadaAzimuteGraus: fachada.azimuteGraus, andar, lstDeltaIlhaCalorC: microclima.tempDelta });
  const conforto = avaliarConfortoTermico({
    andar,
    pavimentosTotais: predio?.pavimentos ?? null,
    fachada,
    bioclimatico,
    diferencaBairroCalorC: microclima.tempDelta,
    tempQuadraC: microclima.tempQuadraC,
    pracasAte300m: microclima.pracasAte300m,
    possuiArvoreProxima: microclima.possuiArvore,
    distanciaPraiaOuRioM: microclima.distanciaAgua,
  });
  const ruido = estimarRuido(predio, { andar, fachadaGraus: fachada.azimuteGraus, janelaFechada: true });
  return { bioclimatico, conforto, ruido };
}
