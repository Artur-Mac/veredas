import type { ResultadoBioclimatico3D } from "../../municipios/recife/motores/bioclimatico3d";
import type { FachadaInferida } from "../sol/inferirFachadas";
import { classificarOrientacaoRecife } from "../sol/inferirFachadas";

export type ZonaConfortoTermico =
  | "fresco_ventilado"
  | "clima_agradavel"
  | "tende_abafar"
  | "quente_tarde";

export type FatorTermico = {
  titulo: string;
  detalhe: string;
  efeito: "refresca" | "esquenta" | "neutro";
};

export type VereditoConfortoTermico = {
  indiceCalor0a100: number;
  zona: ZonaConfortoTermico;
  selo: string;
  perguntaTitulo: string;
  vereditoUmaLinha: string;
  custoMensalArReais: number;
  custoExtraVsFrescoMesReais: number;
  temperaturaQuadraResumo: string | null;
  fatores: FatorTermico[];
};

export type EntradaConfortoTermico = {
  andar: number;
  pavimentosTotais?: number | null;
  fachada?: Pick<FachadaInferida, "azimuteGraus" | "orientacaoSolar" | "grupoSolar" | "recebeBrisaAlisia" | "alinhamentoBrisaPct">;
  fachadaAzimuteGraus?: number;
  bioclimatico?: ResultadoBioclimatico3D | null;
  emSombraVizinhoTarde?: boolean;
  diferencaBairroCalorC?: number | null;
  tempQuadraC?: number | null;
  pracasAte300m?: number;
  distanciaPraiaOuRioM?: number | null;
  possuiArvoreProxima?: boolean;
};

/**
 * Sintetiza o veredito humano "Este apartamento é fresco ou quente?" para Recife,
 * cruzando sol da tarde (Poente), passagem dos alísios E-SE, ilha de calor da quadra,
 * área verde próxima e efeito de laje no último andar.
 */
export function avaliarConfortoTermico(entrada: EntradaConfortoTermico): VereditoConfortoTermico {
  const az = entrada.fachada?.azimuteGraus ?? entrada.fachadaAzimuteGraus ?? 90;
  const orient = classificarOrientacaoRecife(az);
  const grupo = entrada.fachada?.grupoSolar ?? orient.grupoSolar;
  const recebeBrisa = entrada.fachada?.recebeBrisaAlisia ?? orient.recebeBrisaAlisia;
  const andar = Math.max(1, entrada.andar);
  const ultimoAndar =
    entrada.pavimentosTotais != null &&
    entrada.pavimentosTotais > 1 &&
    andar >= entrada.pavimentosTotais;

  let calor = 46; // base equilibrada tropical (0=fresco, 100=muito quente)
  const fatores: FatorTermico[] = [];

  // 1. Orientação solar (Poente vs Nascente)
  if (grupo === "Poente") {
    const alivioSombra = entrada.emSombraVizinhoTarde ? 14 : 0;
    calor += 36 - alivioSombra;
    fatores.push({
      titulo: entrada.emSombraVizinhoTarde
        ? "Sol da tarde (Poente) parcialmente sombreado"
        : "Sol forte da tarde direto na janela (Poente)",
      detalhe: entrada.emSombraVizinhoTarde
        ? "A fachada olha para o pôr do sol, mas um prédio vizinho bloqueia parte da radiação neste andar."
        : "Paredes e vidros absorvem calor das 13h às 17h e devolvem esse calor para o quarto à noite.",
      efeito: "esquenta",
    });
  } else if (grupo === "Nascente") {
    calor -= 18;
    fatores.push({
      titulo: `Sol manso da manhã (${entrada.fachada?.orientacaoSolar ?? orient.orientacaoSolar})`,
      detalhe: "Recebe sol no início do dia e passa toda a tarde protegido na sombra.",
      efeito: "refresca",
    });
  } else if (grupo === "Norte") {
    calor += 8;
    fatores.push({
      titulo: "Orientação Norte",
      detalhe: "Recebe sol oblíquo durante boa parte do inverno (maio a agosto).",
      efeito: "neutro",
    });
  } else {
    calor -= 5;
    fatores.push({
      titulo: "Orientação Sul",
      detalhe: "Recebe menos sol direto de tarde na maior parte do ano.",
      efeito: "refresca",
    });
  }

  // 2. Brisa predominante do Recife (ventos alísios E-SE, 90°-160°)
  const brisaClass = entrada.bioclimatico?.classificacaoBrisaLesteSudeste;
  if (brisaClass === "barrada_por_entorno") {
    calor += 14;
    fatores.push({
      titulo: "Vento alísio barrado por prédios vizinhos",
      detalhe: "Torres a Leste-Sudeste bloqueiam parte da brisa natural antes de chegar à fachada.",
      efeito: "esquenta",
    });
  } else if (recebeBrisa && (brisaClass === "brisa_franca" || andar >= 6)) {
    calor -= 14;
    fatores.push({
      titulo: "Vento Leste-Sudeste entrando livre",
      detalhe: `No ${andar}º andar, a fachada recebe diretamente os ventos vindos do mar.`,
      efeito: "refresca",
    });
  } else if (recebeBrisa) {
    calor -= 8;
    fatores.push({
      titulo: "Alinhado com a brisa do Sudeste",
      detalhe: "Posição favorável à ventilação natural, melhor ainda acima do 5º andar.",
      efeito: "refresca",
    });
  } else {
    calor += 7;
    fatores.push({
      titulo: "De costas para o vento predominante",
      detalhe: "O vento do mar vem do outro lado; depende de janelas em faces opostas para cruzar o ar.",
      efeito: "esquenta",
    });
  }

  // 3. Efeito de laje / cobertura vs andar muito baixo sem vento
  if (ultimoAndar) {
    calor += 16;
    fatores.push({
      titulo: "Último andar (calor acumulado da laje)",
      detalhe: "A cobertura recebe sol o dia inteiro no teto, aumentando a temperatura noturna.",
      efeito: "esquenta",
    });
  } else if (andar <= 2 && grupo !== "Nascente") {
    calor += 6;
  } else if (andar >= 12) {
    calor -= 5;
  }

  // 4. Microclima da quadra (ilha de calor + praças/árvores/água)
  const deltaC = entrada.diferencaBairroCalorC ?? entrada.bioclimatico?.deltaIlhaCalorLstC ?? null;
  let temperaturaQuadraResumo: string | null = null;
  if (deltaC !== null && Number.isFinite(deltaC)) {
    if (deltaC >= 0.8) {
      calor += Math.min(12, Math.round(deltaC * 4));
      temperaturaQuadraResumo = `Quadra +${deltaC.toFixed(1).replace(".", ",")} °C mais quente que a média do bairro`;
      fatores.push({
        titulo: "Ilha de calor urbana na quadra",
        detalhe: "Mais asfalto e concreto ao redor elevam a temperatura externa mesmo após o pôr do sol.",
        efeito: "esquenta",
      });
    } else if (deltaC <= -0.5) {
      calor -= 8;
      temperaturaQuadraResumo = `Microclima ${Math.abs(deltaC).toFixed(1).replace(".", ",")} °C mais ameno que o bairro`;
    } else {
      temperaturaQuadraResumo = "Temperatura de superfície na média do bairro";
    }
  }

  const pracas = entrada.pracasAte300m ?? 0;
  if (pracas > 0 || entrada.possuiArvoreProxima) {
    calor -= 6;
    fatores.push({
      titulo: pracas > 1 ? `${pracas} praças arborizadas por perto` : "Área verde arborizada a até 300 m",
      detalhe: "Copas de árvores nas proximidades ajudam a amenizar a sensação térmica da rua.",
      efeito: "refresca",
    });
  }

  if (entrada.distanciaPraiaOuRioM != null && entrada.distanciaPraiaOuRioM <= 450) {
    calor -= 5;
  }

  const indiceCalor0a100 = Math.max(8, Math.min(96, Math.round(calor)));

  let zona: ZonaConfortoTermico;
  let selo: string;
  if (indiceCalor0a100 <= 32) {
    zona = "fresco_ventilado";
    selo = "Fresco e ventilado";
  } else if (indiceCalor0a100 <= 52) {
    zona = "clima_agradavel";
    selo = "Clima agradável";
  } else if (indiceCalor0a100 <= 72) {
    zona = "tende_abafar";
    selo = "Tende a abafar";
  } else {
    zona = "quente_tarde";
    selo = "Quente à tarde";
  }

  const custoMensalArReais = Math.round(65 + (indiceCalor0a100 / 100) * 235);
  const custoExtraVsFrescoMesReais = Math.max(0, custoMensalArReais - 95);

  let vereditoUmaLinha: string;
  if (zona === "fresco_ventilado") {
    vereditoUmaLinha = `Apartamento naturalmente fresco no ${andar}º andar: pega sol leve e recebe boa circulação da brisa do Recife.`;
  } else if (zona === "clima_agradavel") {
    vereditoUmaLinha = `Conforto térmico equilibrado no ${andar}º andar; nos meses mais quentes o ventilador dá conta em boa parte do dia.`;
  } else if (zona === "tende_abafar") {
    vereditoUmaLinha =
      grupo === "Poente"
        ? "Recebe calor à tarde ou tem pouca ventilação cruzada — espere ligar o ar-condicionado nos horários quentes."
        : "Pouca brisa direta nesta face ou calor acumulado na quadra; vale testar a circulação do ar abrindo as janelas na visita.";
  } else {
    vereditoUmaLinha =
      ultimoAndar
        ? `Combinação pesada: fachada ${grupo} somada ao calor da laje do último andar eleva a conta de energia para ~R$ ${custoMensalArReais}/mês.`
        : `Sol da tarde direto e pouca brisa de alívio — o quarto tende a permanecer quente até a noite (~R$ ${custoMensalArReais}/mês de ar).`;
  }

  return {
    indiceCalor0a100,
    zona,
    selo,
    perguntaTitulo: "Este apartamento é fresco ou quente?",
    vereditoUmaLinha,
    custoMensalArReais,
    custoExtraVsFrescoMesReais,
    temperaturaQuadraResumo,
    fatores: fatores.slice(0, 4),
  };
}
