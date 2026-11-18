import type { AbsenceState } from "../../nucleo/contratosCanonicos";
import type { Edificio, VisaoDaRua } from "../contratos";
import type { FichaDeMetodo6Campos } from "../fichaDeMetodo";
import type { EssenciaisDoBairro } from "../recife/essenciais";
import { posicaoNoBairro } from "./indicadores";

export type CategoriaCaminhabilidade = {
  id: "mercado" | "farmacia" | "transporte" | "praca";
  titulo: string;
  pesoPct: number;
  minutosAPe: number | null;
  distanciaRetaM: number | null;
  nota0a10: number | null;
  resumo: string;
};

export type ResultadoCaminhabilidadeEVida = {
  notaAPe0a10: number | null;
  ausenciaNota: AbsenceState | null;
  faixaDescritivaAPe: string | null;
  manchete: string;
  percentilNoBairro: number | null;
  amostraPredios: number;
  frasePercentil: string;
  fraseMalhaQuadra: string;
  escopoGranularidade: string;
  microContextoSetor: string;
  vidaNaRuaResumo: string;
  categorias: [
    CategoriaCaminhabilidade,
    CategoriaCaminhabilidade,
    CategoriaCaminhabilidade,
    CategoriaCaminhabilidade,
  ];
  decomposicaoResumo: string;
  /** Ficha "como foi calculada" da nota a pé (decisão A13). */
  metodo: FichaDeMetodo6Campos;
};

const PESOS: readonly {
  id: "mercado" | "farmacia" | "transporte" | "praca";
  titulo: string;
  pesoPct: number;
}[] = [
  { id: "mercado", titulo: "Mercado", pesoPct: 30 },
  { id: "farmacia", titulo: "Farmácia", pesoPct: 25 },
  { id: "transporte", titulo: "Ônibus / Metrô", pesoPct: 25 },
  { id: "praca", titulo: "Praça / Verde", pesoPct: 20 },
];

const BASE_MINIMA_PERCENTIL = 20;

const PESOS_EM_TEXTO = "Mercado 30% · Farmácia 25% · Transporte 25% · Praça 20%";

function fichaDaNotaAPe(calculoDoPredio: string): FichaDeMetodo6Campos {
  return {
    oQueMede: "Quanto do dia a dia se resolve a pé a partir da portaria: mercado, farmácia, ônibus ou metrô e praça.",
    fonte: "Rede de ruas a pé do OpenStreetMap (ODbL), endereços do CNEFE (Censo 2022, IBGE) e paradas do GTFS do Grande Recife.",
    data: "Censo 2022 e a rede de ruas do último ciclo de dados do Vereda.",
    calculo: `Para cada serviço, a nota é 10 × e^(−0,082 × minutos a pé pela rede de ruas), entre 1 e 9,9. A nota a pé é a média com os pesos ${PESOS_EM_TEXTO}, só quando mais da metade do peso tem caminho medido. ${calculoDoPredio}`,
    limite:
      "Os pesos e a curva são escolhas do Vereda. A rede não sabe de calçada quebrada, travessia difícil nem portão fechado, e o ponto mais perto pode não ser o que você usaria.",
    naVisita: "Faça a pé o caminho até o mercado e até a parada, no horário em que você costuma sair.",
  };
}

function notaPorMinutos(min: number): number {
  const n = 10 * Math.exp(-0.082 * Math.max(0, min));
  return Math.max(1.0, Math.min(9.9, Math.round(n * 10) / 10));
}

export function avaliarCaminhabilidadeEVidaNaRua(params: {
  predio: Edificio | null;
  essenciais: EssenciaisDoBairro | null;
  visaoRua: VisaoDaRua | null;
  nomeDoBairro: string;
}): ResultadoCaminhabilidadeEVida {
  const { predio, essenciais, visaoRua, nomeDoBairro } = params;
  const leituraPredio =
    predio && essenciais ? essenciais.predios[predio.id] ?? null : null;

  if (!predio || !essenciais || !leituraPredio) {
    const categoriasVazias = PESOS.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      pesoPct: p.pesoPct,
      minutosAPe: null,
      distanciaRetaM: null,
      nota0a10: null,
      resumo: "Confirme o edifício para medir caminhada pela rede de calçadas.",
    })) as ResultadoCaminhabilidadeEVida["categorias"];

    return {
      notaAPe0a10: null,
      ausenciaNota: "sem_leitura_publicada",
      faixaDescritivaAPe: null,
      manchete: "Confirme o prédio para calcular caminhabilidade a pé e percentil do bairro",
      percentilNoBairro: null,
      amostraPredios: 0,
      frasePercentil:
        "Amostra mínima declarada: 20 prédios com caminho medido em rede de ruas.",
      fraseMalhaQuadra:
        "Sem vínculo confirmado: a conectividade pelas esquinas e travessias da quadra ainda não foi medida.",
      escopoGranularidade:
        "Confirme o edifício para calcular tempos da portaria pela rede de ruas a pé (não média de CEP).",
      microContextoSetor:
        "Escala do bairro (setor censitário do Censo 2022 sem leitura casada neste ponto).",
      vidaNaRuaResumo: "Sem leitura de face de quadra sem vínculo confirmado.",
      categorias: categoriasVazias,
      decomposicaoResumo:
        "Pesos abertos: Mercado 30% · Farmácia 25% · Transporte 25% · Praça 20%, com decaimento exponencial pelo tempo de caminhada na rede de ruas.",
      metodo: fichaDaNotaAPe("Este prédio ainda não tem caminho medido."),
    };
  }

  const categorias = PESOS.map((p): CategoriaCaminhabilidade => {
    if (leituraPredio.modo === "rede") {
      const item = leituraPredio.c[p.id];
      const min = item ? Math.round(item.min) : null;
      const nota = item ? notaPorMinutos(item.min) : null;
      return {
        id: p.id,
        titulo: p.titulo,
        pesoPct: p.pesoPct,
        minutosAPe: min,
        distanciaRetaM: item?.m ?? null,
        nota0a10: nota,
        resumo:
          item !== null
            ? `~${Math.max(1, Math.round(item.min))} min a pé (${item.m} m de caminhada)`
            : "Sem ponto mapeado até o limite de busca",
      };
    }
    const itemReta = leituraPredio.c[p.id];
    return {
      id: p.id,
      titulo: p.titulo,
      pesoPct: p.pesoPct,
      minutosAPe: null,
      distanciaRetaM: itemReta?.retaM ?? null,
      nota0a10: null,
      resumo:
        itemReta !== null
          ? `~${itemReta.retaM} m em linha reta (entrada sem ligação validada à rede)`
          : "Sem ponto mapeado até o limite de busca",
    };
  }) as ResultadoCaminhabilidadeEVida["categorias"];

  let somaPonderada = 0;
  let pesoCoberto = 0;
  for (const c of categorias) {
    if (c.nota0a10 !== null) {
      somaPonderada += c.nota0a10 * (c.pesoPct / 100);
      pesoCoberto += c.pesoPct / 100;
    }
  }
  const notaAPe0a10 =
    leituraPredio.modo === "rede" && pesoCoberto > 0.5
      ? Math.round((somaPonderada / pesoCoberto) * 10) / 10
      : null;

  // Percentil explicito no bairro com corte minimo declarado (BASE_MINIMA = 20)
  const todosTempos: number[] = [];
  for (const reg of Object.values(essenciais.predios)) {
    if (reg.modo !== "rede") continue;
    const ms = [
      reg.c.mercado?.min,
      reg.c.farmacia?.min,
      reg.c.transporte?.min,
    ];
    if (ms.every((v) => typeof v === "number")) {
      todosTempos.push((ms[0] as number) + (ms[1] as number) + (ms[2] as number));
    }
  }

  let percentilNoBairro: number | null = null;
  let frasePercentil = `Amostra do bairro abaixo de ${BASE_MINIMA_PERCENTIL} prédios para percentil comparativo.`;

  if (
    leituraPredio.modo === "rede" &&
    todosTempos.length >= BASE_MINIMA_PERCENTIL &&
    leituraPredio.c.mercado &&
    leituraPredio.c.farmacia &&
    leituraPredio.c.transporte
  ) {
    const meuTotal =
      leituraPredio.c.mercado.min +
      leituraPredio.c.farmacia.min +
      leituraPredio.c.transporte.min;
    const pos = posicaoNoBairro(meuTotal, todosTempos, true);
    percentilNoBairro = Math.min(99, Math.max(1, Math.round(pos.piores * 100)));
    frasePercentil = `Posição relativa: mais perto dos serviços a pé do que ${percentilNoBairro}% dos ${todosTempos.length} prédios medidos em ${nomeDoBairro}.`;
  }

  // Proxy aberto de vida na rua (sem painel nem rastreamento de celulares — R49 Placer adaptado)
  const temGrupoSom = visaoRua?.grupos.find((g) => g.id === "som");
  const temEntorno = visaoRua?.grupos.find((g) => g.id === "entorno");
  const partesVida: string[] = [];
  if (temEntorno && temEntorno.fatos.length > 0) {
    const arbor = temEntorno.fatos.find((f) => /árvor/i.test(f.rotulo));
    const calc = temEntorno.fatos.find((f) => /calçad/i.test(f.rotulo));
    if (calc) partesVida.push(`Calçada: ${calc.valor}`);
    if (arbor) partesVida.push(`Arborização: ${arbor.valor}`);
  }
  if (temGrupoSom && temGrupoSom.fatos.length > 0) {
    partesVida.push(`Uso noturno na quadra: ${temGrupoSom.fatos[0]!.valor}`);
  }
  const vidaNaRuaResumo =
    partesVida.length > 0
      ? partesVida.join(" · ")
      : "Camada aberta de Censo 2022 e uso misto por face de quadra sem rastreamento pessoal.";

  const calcMicro = temEntorno?.fatos.find((f) => /calçad/i.test(f.rotulo) && f.valor !== "A confirmar");
  const arborMicro = temEntorno?.fatos.find((f) => /árvor/i.test(f.rotulo) && f.valor !== "A confirmar");
  const alugMicro = visaoRua?.grupos.find((g) => g.id === "moradia")?.fatos[0];
  const partesSetor = [
    calcMicro ? `Calçada ${calcMicro.valor}` : null,
    arborMicro ? `Arborização ${arborMicro.valor}` : null,
    alugMicro && alugMicro.valor !== "A confirmar" ? `Alugados na região ${alugMicro.valor}` : null,
  ].filter(Boolean);
  const microContextoSetor =
    partesSetor.length > 0
      ? `Recorte micro (setor Censo 2022) + percentil de bairro: ${partesSetor.join(" · ")}.`
      : "Escala do bairro (setor censitário do Censo 2022 sem leitura casada neste ponto).";

  const manchete =
    notaAPe0a10 !== null
      ? `Nota a pé ${notaAPe0a10.toFixed(1).replace(".", ",")} / 10${
          percentilNoBairro !== null ? ` · Percentil ${percentilNoBairro}% em ${nomeDoBairro}` : ""
        }`
      : "Distâncias medidas em linha reta (entrada fora da rede de calçadas)";

  const fraseMalhaQuadra =
    leituraPredio.modo === "rede"
      ? "Trajeto pela malha de quadra: os minutos seguem as ruas e esquinas mapeadas, não a linha reta."
      : "Entrada fora da rede viária validada: distâncias exibidas apenas em linha reta.";

  const escopoGranularidade =
    leituraPredio.modo === "rede"
      ? "Nota calculada da portaria deste edifício pela rede de ruas a pé, não média de CEP ou esquina."
      : "Leitura em linha reta a partir deste edifício (fora da malha de calçadas validada).";

  const faixaDescritivaAPe =
    notaAPe0a10 === null
      ? null
      : notaAPe0a10 >= 8.5
        ? "Rotina majoritariamente a pé: comércio essencial e transporte a poucos minutos da portaria"
        : notaAPe0a10 >= 6.5
          ? "Boa parte das tarefas do dia a dia resolvida a pé pela malha de calçadas"
          : notaAPe0a10 >= 4.5
            ? "Algumas tarefas a pé, combinadas com transporte coletivo ou veículo"
            : "Deslocamento motorizado necessário para a maior parte das compras e serviços";

  const minutosDoPredio = categorias
    .filter((c) => c.minutosAPe !== null)
    .map((c) => `${c.titulo} ~${c.minutosAPe} min (nota ${c.nota0a10 !== null ? c.nota0a10.toFixed(1).replace(".", ",") : "sem leitura"})`);
  const metodo = fichaDaNotaAPe(
    minutosDoPredio.length > 0 ? `Neste prédio: ${minutosDoPredio.join("; ")}.` : "Este prédio está fora da rede de ruas validada: só há distância em linha reta, sem nota.",
  );

  return {
    notaAPe0a10,
    ausenciaNota: notaAPe0a10 === null ? "sem_leitura_publicada" : null,
    faixaDescritivaAPe,
    manchete,
    percentilNoBairro,
    amostraPredios: todosTempos.length,
    frasePercentil,
    fraseMalhaQuadra,
    escopoGranularidade,
    microContextoSetor,
    vidaNaRuaResumo,
    categorias,
    decomposicaoResumo:
      "Pesos transparentes: Mercado 30% · Farmácia 25% · Transporte público 25% · Praça 20%, usando tempo de caminhada na malha viária oficial.",
    metodo,
  };
}
