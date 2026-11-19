// Do registro da camada à leitura que a tela mostra (decisão A2, 18/11/2026). Sem leitura de arquivo: recebe o registro
// do prédio (scripts/dados/ruido/nucleo.ts), a relação com o aeroporto e o andar, a fachada e a janela escolhidos, e
// devolve os dB(A) estimados de dia e à noite, a faixa, a comparação com a NBR 10151, a nota de sossego, as fontes que
// mais pesam e os textos prontos. Regra de tela: toda frase com "dB" traz "estimativa" ou "estimado".
import { resolverIsolamentoD2mnTw, somarComOAviao } from "../../nucleo/motores/acustica3d";
import type { FichaDeMetodo6Campos } from "../fichaDeMetodo";
import {
  TIPOS_DE_FONTE,
  compararComANbr10151,
  eVia,
  nivelComJanelaFechada,
  nivelDaFonteNaJanela,
  nivelDoAviao,
  nivelDoAviaoANoite,
  nivelDoChao,
  notaDeSossego,
  relacaoComAFachada,
  type FonteDoChao,
  type Periodo,
  type RelacaoComAFachada,
  type TipoDeFonte,
} from "./modelo";
import {
  AVISO_DE_ESTIMATIVA,
  BARREIRA_DOS_FUNDOS_DB,
  DB_DA_NOTA_0,
  DB_DA_NOTA_10,
  ERRO_MEDIO_ABSOLUTO_DO_MAPA_SOSSEGO_DB,
  FAIXA_DB,
  FAIXAS_DA_NOTA,
  LIMITE_NBR_10151_A_NOITE_DB,
  LIMITE_NBR_10151_DE_DIA_DB,
  NIVEL_DA_VIA_DB,
  PISO_A_NOITE_DB,
  PISO_DE_DIA_DB,
  PONTOS_DE_VALIDACAO_DO_MAPA_SOSSEGO,
  ROTULO_DA_CLASSE,
  VIES_EM_RUA_RESIDENCIAL_COM_PASSAGEM_DB,
  VIES_PERTO_DE_AVENIDA_DB,
} from "./parametros";

/** O registro de um prédio na camada (ver `PredioGravado` em scripts/dados/ruido/nucleo.ts). */
export type RegistroDeRuido = { f: readonly (readonly number[])[]; d?: readonly number[]; n?: readonly number[] };
/** O prédio sob a linha de pouso e decolagem (src/dados/recife/aeroporto.ts), ou null. */
export type AviaoSobreOPredio = { alturaEstimadaM: number; afastamentoDoEixoM: number; distanciaDaCabeceiraM: number } | null;

export type OpcoesDeRuido = {
  /** Andar da janela; 0, null ou ausente = térreo (o nível "na rua"). */
  andar?: number | null;
  /** Para onde a janela dá, em graus a partir do norte; null ou ausente = sem fachada (todas as fontes contam por inteiro). */
  fachadaGraus?: number | null;
  /** Com `true`, a leitura traz também o nível no quarto com a janela fechada (NBR 15575-4, pelo ano do prédio). */
  janelaFechada?: boolean;
  /** Ano do prédio para a janela fechada; ausente, vale o do prédio. */
  anoConstrucao?: number | null;
};

export type NivelDiaENoite = { diaDb: number; noiteDb: number };

export type FonteQuePesa = {
  tipo: TipoDeFonte | "aviao";
  /** "Avenida Engenheiro Domingos Ferreira", "Linha do metrô/VLT", "Aeroporto dos Guararapes"… */
  nome: string;
  /** "arterial", "coletora"…; null para o que não é via. */
  classe: string | null;
  /** Distância em linha reta do centro do lote ao ponto mais perto da fonte; null para o avião. */
  distanciaM: number | null;
  rumoGraus: number | null;
  relacao: RelacaoComAFachada | "de_cima";
  /** Nível na janela (andar e fachada escolhidos), em dB(A) estimados. */
  nivelDeDiaDb: number;
  nivelANoiteDb: number;
  /** Partidas de ônibus num dia útil no trecho mais perto (GTFS), quando há. */
  partidasDeOnibus: number | null;
  /** "Avenida X, arterial, 28 m: ~65 dB(A) de dia · ~58 à noite (estimativa)" */
  texto: string;
};

export type RuidoEstimado = {
  estado: "estimado";
  andar: number;
  fachadaGraus: number | null;
  janelaFechada: boolean;
  /** Na rua em frente ao prédio: térreo, sem fachada. */
  naRua: NivelDiaENoite;
  /** Na janela: no andar e na fachada escolhidos (igual a `naRua` sem andar nem fachada). */
  naJanela: NivelDiaENoite;
  /** No quarto com a janela fechada; null quando `janelaFechada` não foi pedido. */
  noQuarto: (NivelDiaENoite & { isolamentoDb: number }) | null;
  /** Meia largura da faixa de erro mostrada, em dB. */
  faixaDb: number;
  /** Diferença para a referência da NBR 10151 (área residencial), sobre `naJanela`; positivo = acima. */
  nbr10151: { dia: { limiteDb: number; diferencaDb: number }; noite: { limiteDb: number; diferencaDb: number } };
  /** Nota de sossego 0–10 pelo nível da noite na janela (48 dB(A) ou menos = 10; 86 ou mais = 0). */
  notaDeSossego: number;
  /** A mesma escala com o nível de dia. */
  notaDeDia: number;
  /** "Muito tranquilo", "Tranquilo", "Moderado", "Agitado" ou "Barulhento", pela nota da noite. */
  nivelDeSossego: string;
  /** As fontes que mais pesam, da mais forte para a mais fraca de dia. */
  fontes: FonteQuePesa[];
  /** O que entra na conta, para quem liga o modelo às telas antigas (src/dados/ruido/ponte.ts). */
  partes: { doChao: NivelDiaENoite; doAviao: NivelDiaENoite | null; quedaDoAndarDb: number; quedaDaFachadaDb: number };
  textos: {
    /** "~66 dB(A) na rua de dia · ~61 à noite (estimativa)" */
    manchete: string;
    /** "Na janela do 8º andar, fachada leste: ~60 dB(A) de dia · ~54 à noite (estimativa)"; null sem andar nem fachada. */
    janela: string | null;
    quarto: string | null;
    faixa: string;
    nbr: string;
    nota: string;
    /** "Estimativa com dados abertos, não medição." */
    aviso: string;
    fontes: string[];
    vieses: string[];
    /** Para o placar: a palavra da nota e "~61 dB(A) à noite (estimativa) · 6,6/10". */
    placar: { valor: string; subtitulo: string };
    /** A ficha "como foi calculada" (ficha de método de 6 campos), com as fontes que mais pesam neste prédio. */
    ficha: FichaDeMetodo6Campos;
  };
};

export type MotivoSemLeitura = "sem_predio" | "sem_camada" | "sem_registro";
export type SemLeituraDeRuido = { estado: "sem_leitura"; motivo: MotivoSemLeitura; textos: { manchete: string; explicacao: string; placar: { valor: string; subtitulo: string } } };
export type EstimativaDeRuido = RuidoEstimado | SemLeituraDeRuido;

const EXPLICACAO: Record<MotivoSemLeitura, string> = {
  sem_predio: "Confirme o prédio no cadastro do Recife para ver a estimativa de ruído deste endereço.",
  sem_camada: "A estimativa de ruído ainda não cobre este bairro.",
  sem_registro: "Este prédio ainda não tem estimativa de ruído publicada.",
};

/** Sem dado não há número: nunca um valor fixo no lugar. */
export function semLeituraDeRuido(motivo: MotivoSemLeitura): SemLeituraDeRuido {
  return { estado: "sem_leitura", motivo, textos: { manchete: "Ruído estimado: sem leitura para este imóvel", explicacao: EXPLICACAO[motivo], placar: { valor: "Sem leitura", subtitulo: "Sem estimativa de ruído" } } };
}

const DIRECOES = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"] as const;
const direcao = (graus: number): string => DIRECOES[Math.round((((graus % 360) + 360) % 360) / 45) % 8]!;
const um = (x: number): number => Math.round(x * 10) / 10;
const inteiro = (x: number): string => String(Math.round(x));
const virgula = (x: number): string => x.toFixed(1).replace(".", ",");
const milhar = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const metros = (m: number): string => (m >= 1000 ? `${virgula(m / 1000)} km` : `${Math.round(m)} m`);
const decimosParaDb = (v: number | undefined): number => (v && v > 0 ? v / 10 : -Infinity);
/** "~66 dB(A) de dia · ~61 à noite (estimativa)" */
const diaENoite = (n: NivelDiaENoite, lugar = ""): string => `~${inteiro(n.diaDb)} dB(A)${lugar} de dia · ~${inteiro(n.noiteDb)} à noite (estimativa)`;

const NOME_DO_TIPO: Record<Exclude<TipoDeFonte, "rodovia" | "arterial" | "coletora" | "local" | "residencial">, string> = {
  trilho: "Linha do metrô/VLT",
  luse: "Local com licença de som (LUSE)",
  bar: "Bar ou venda de bebida",
  oficina: "Oficina, borracharia ou serralheria",
  mercado: "Supermercado ou atacado",
};

/** A palavra da faixa da nota (escala publicada pelo Mapa Sossego). */
export function nivelDeSossego(nota: number): string {
  return (FAIXAS_DA_NOTA.find((f) => nota >= f.aPartirDe) ?? FAIXAS_DA_NOTA[FAIXAS_DA_NOTA.length - 1]!).rotulo;
}

function textoDaNbr(dia: number, noite: number): string {
  const ref = `(${LIMITE_NBR_10151_DE_DIA_DB} dB(A) de dia e ${LIMITE_NBR_10151_A_NOITE_DB} à noite)`;
  const cabeNaFaixa = [dia, noite].some((d) => Math.abs(d) <= FAIXA_DB) ? ` Diferença de até ${FAIXA_DB} dB cabe na faixa de erro da estimativa.` : "";
  if (dia > 0 && noite > 0) return `Pela estimativa, fica acima da referência da NBR 10151 para área residencial ${ref}: ${dia} dB a mais de dia e ${noite} dB a mais à noite.${cabeNaFaixa}`;
  if (dia <= 0 && noite <= 0) return `Pela estimativa, fica dentro da referência da NBR 10151 para área residencial ${ref}.${cabeNaFaixa}`;
  const [acima, quando, dentro] = dia > 0 ? [dia, "de dia", "à noite"] : [noite, "à noite", "de dia"];
  return `Pela estimativa, passa ${acima} dB da referência da NBR 10151 para área residencial ${ref} ${quando} e fica dentro dela ${dentro}.${cabeNaFaixa}`;
}

function textoDaJanela(andar: number, fachadaGraus: number | null, n: NivelDiaENoite): string | null {
  if (andar <= 0 && fachadaGraus === null) return null;
  const onde = andar > 0 ? `Na janela do ${andar}º andar` : "Na janela do térreo";
  return `${onde}${fachadaGraus === null ? "" : `, fachada ${direcao(fachadaGraus)}`}: ${diaENoite(n)}`;
}

export const VIESES_CONHECIDOS: readonly string[] = [
  `Perto de grandes avenidas, este tipo de estimativa costuma ficar ${VIES_PERTO_DE_AVENIDA_DB[0]} a ${VIES_PERTO_DE_AVENIDA_DB[1]} dB acima do medido: leia como teto.`,
  `Em rua residencial com trânsito de passagem, a estimativa costuma ficar ${VIES_EM_RUA_RESIDENCIAL_COM_PASSAGEM_DB[0]} a ${VIES_EM_RUA_RESIDENCIAL_COM_PASSAGEM_DB[1]} dB abaixo do medido: leia como piso.`,
];

const dataBr = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * A ficha de método (decisão A13): o que mede, fonte, data, cálculo, limite e o que fazer na visita. `fontes` são as
 * frases das fontes que mais pesam neste prédio; sem elas, a ficha é a geral.
 */
export function fichaDoRuido(datas: { viasDe: string; metodologiaLidaEm: string }, fontes: readonly string[]): FichaDeMetodo6Campos {
  const noPredio = fontes.length ? ` Neste prédio, as fontes que mais pesam: ${fontes.join("; ")}.` : "";
  return {
    oQueMede: "O barulho médio do lado de fora, em dB(A) estimados, de dia (7h–22h) e à noite (22h–7h): na rua em frente ao prédio e, com andar e fachada, na janela. A nota de sossego de 0 a 10 sai do nível estimado à noite.",
    fonte: "Vias e pista do aeroporto: OpenStreetMap (© colaboradores do OpenStreetMap, ODbL). Ônibus: partidas do GTFS Grande Recife. Metrô e VLT: traçado da CBTU. Som licenciado: Licenciamento Ambiental do Recife (LUSE). Bares, oficinas e mercados: CNEFE do Censo 2022 (IBGE). Contém dados da Prefeitura do Recife (ODbL) e © colaboradores do OpenStreetMap (ODbL); texto da licença: opendatacommons.org/licenses/odbl/1-0/.",
    data: `Vias do mapa de ${dataBr(datas.viasDe)}; CNEFE de 2022; método publicado pelo Mapa Sossego, lido em ${dataBr(datas.metodologiaLidaEm)}.`,
    calculo: `Estimativa com dados abertos: cada via parte de um nível pela classe no mapa (de ${NIVEL_DA_VIA_DB.residencial} dB(A) numa rua residencial a ${NIVEL_DA_VIA_DB.rodovia} numa via expressa, a 10 m), somado aos ônibus que passam nela. O som cai com a distância, as fontes somam-se em energia e entra um piso de ${PISO_DE_DIA_DB} dB(A) de dia e ${PISO_A_NOITE_DB} à noite. O andar afasta a janela da rua, a fachada dos fundos tira ${BARREIRA_DOS_FUNDOS_DB} dB e o avião entra por cima, sem desconto. Nota: 10 com ${DB_DA_NOTA_10} dB(A) ou menos, 0 com ${DB_DA_NOTA_0} ou mais, em linha reta entre os dois.${noPredio}`,
    limite: `${AVISO_DE_ESTIMATIVA}: não vê muros, prédios vizinhos, relevo, obras, festas nem o trânsito de cada hora, e não há contagem de carros. Nos ${PONTOS_DE_VALIDACAO_DO_MAPA_SOSSEGO} pontos em que o Mapa Sossego comparou com medições, o erro médio da estimativa foi de ${virgula(ERRO_MEDIO_ABSOLUTO_DO_MAPA_SOSSEGO_DB)} dB. ${VIESES_CONHECIDOS.join(" ")} A comparação com ${LIMITE_NBR_10151_DE_DIA_DB} dB(A) de dia e ${LIMITE_NBR_10151_A_NOITE_DB} à noite usa a referência da ABNT NBR 10151 para área residencial: norma técnica, não lei municipal.`,
    naVisita: "Ouça da janela do quarto, aberta e fechada, num dia útil por volta das 18h e numa sexta ou sábado depois das 22h. Use o medidor da visita para comparar aberta e fechada e responda “Isso bate com a rua hoje?”.",
  };
}

/**
 * A leitura de um prédio. `nomes` é a lista de nomes de via do arquivo do bairro; `aviao` vem do cone de aproximação.
 * O avião é somado ao que vem do chão por `somarComOAviao` (acustica3d.ts): sem desconto de andar nem de fachada.
 */
export function montarEstimativa(entrada: {
  registro: RegistroDeRuido;
  nomes: readonly string[];
  aviao: AviaoSobreOPredio;
  anoConstrucao: number | null;
  datas: { viasDe: string; metodologiaLidaEm: string };
  opcoes?: OpcoesDeRuido;
}): RuidoEstimado {
  const { registro, nomes, aviao, opcoes = {} } = entrada;
  const andar = Math.max(0, Math.round(opcoes.andar ?? 0));
  const fachadaGraus = typeof opcoes.fachadaGraus === "number" && Number.isFinite(opcoes.fachadaGraus) ? ((opcoes.fachadaGraus % 360) + 360) % 360 : null;
  const janelaFechada = opcoes.janelaFechada === true;

  const gravadas = registro.f.map((f) => {
    const fonte: FonteDoChao = { tipo: TIPOS_DE_FONTE[f[0]!]!, distanciaM: f[2]!, rumoGraus: f[3]!, nivelDeDiaDb: f[4]! / 10 };
    return { fonte, nome: f[1]! >= 0 ? nomes[f[1]!] ?? null : null, extra: f[5] ?? 0 };
  });
  const fontesDoChao = gravadas.map((g) => g.fonte);
  // O resto vem por fachada: [na rua, N, NE, L, SE, S, SO, O, NO].
  const posicao = (g: number | null): number => (g === null ? 0 : 1 + (Math.round(g / 45) % 8));
  const resto = (periodo: Periodo, g: number | null): number => decimosParaDb((periodo === "dia" ? registro.d : registro.n)?.[posicao(g)]);
  const doChao = (periodo: Periodo, a: number, g: number | null): number => nivelDoChao(fontesDoChao, resto(periodo, g), periodo, a, g);

  const aviaoDeDia = aviao ? nivelDoAviao(aviao.alturaEstimadaM, aviao.afastamentoDoEixoM) : null;
  const doAviao: NivelDiaENoite | null = aviaoDeDia === null ? null : { diaDb: um(aviaoDeDia), noiteDb: um(nivelDoAviaoANoite(aviaoDeDia)) };
  const total = (a: number, g: number | null): NivelDiaENoite => ({
    diaDb: um(somarComOAviao(doChao("dia", a, g), doAviao?.diaDb)),
    noiteDb: um(somarComOAviao(doChao("noite", a, g), doAviao?.noiteDb)),
  });

  const naRua = total(0, null);
  const naJanela = total(andar, fachadaGraus);
  const chaoNaJanela: NivelDiaENoite = { diaDb: um(doChao("dia", andar, fachadaGraus)), noiteDb: um(doChao("noite", andar, fachadaGraus)) };
  const isolamentoDb = resolverIsolamentoD2mnTw(entrada.opcoes?.anoConstrucao !== undefined ? entrada.opcoes.anoConstrucao : entrada.anoConstrucao);
  const noQuarto = janelaFechada
    ? { diaDb: um(nivelComJanelaFechada(naJanela.diaDb, isolamentoDb)), noiteDb: um(nivelComJanelaFechada(naJanela.noiteDb, isolamentoDb)), isolamentoDb }
    : null;

  const nbr10151 = { dia: compararComANbr10151(naJanela.diaDb, "dia"), noite: compararComANbr10151(naJanela.noiteDb, "noite") };
  const nota = notaDeSossego(naJanela.noiteDb);

  const fontes: FonteQuePesa[] = gravadas.map(({ fonte, nome, extra }) => {
    const via = eVia(fonte.tipo);
    const dia = um(nivelDaFonteNaJanela(fonte, "dia", andar, fachadaGraus));
    const noite = um(nivelDaFonteNaJanela(fonte, "noite", andar, fachadaGraus));
    const classe = via ? ROTULO_DA_CLASSE[fonte.tipo as keyof typeof ROTULO_DA_CLASSE] : null;
    const rotulo = via ? nome ?? "Via sem nome no mapa" : NOME_DO_TIPO[fonte.tipo as keyof typeof NOME_DO_TIPO];
    const partidas = via && extra > 0 ? extra : null;
    const grupo = fonte.tipo === "bar" && extra > 1 ? ` (${extra} a até 150 m)` : "";
    const texto = `${rotulo}${grupo}${classe ? `, ${classe}` : ""}${partidas ? `, ${milhar(partidas)} partidas de ônibus num dia útil` : ""}, ${metros(fonte.distanciaM)}: ${diaENoite({ diaDb: dia, noiteDb: noite })}`;
    return { tipo: fonte.tipo, nome: rotulo, classe, distanciaM: fonte.distanciaM, rumoGraus: fonte.rumoGraus, relacao: relacaoComAFachada(fachadaGraus, fonte.rumoGraus), nivelDeDiaDb: dia, nivelANoiteDb: noite, partidasDeOnibus: partidas, texto };
  });
  if (aviao && doAviao) {
    fontes.push({
      tipo: "aviao", nome: "Aeroporto dos Guararapes", classe: null, distanciaM: null, rumoGraus: null, relacao: "de_cima",
      nivelDeDiaDb: doAviao.diaDb, nivelANoiteDb: doAviao.noiteDb, partidasDeOnibus: null,
      texto: `Aeroporto dos Guararapes, avião a ~${Math.round(aviao.alturaEstimadaM)} m de altura na linha de pouso e decolagem: ${diaENoite(doAviao)}`,
    });
  }
  fontes.sort((a, b) => b.nivelDeDiaDb - a.nivelDeDiaDb || b.nivelANoiteDb - a.nivelANoiteDb);

  const ano = entrada.opcoes?.anoConstrucao !== undefined ? entrada.opcoes.anoConstrucao : entrada.anoConstrucao;
  const quarto = noQuarto
    ? `No quarto, com a janela fechada: ${diaENoite(noQuarto)}. A janela ${ano ? `de um prédio de ${ano}` : "sem ano de construção no cadastro"} tira cerca de ${inteiro(isolamentoDb)} dB pela NBR 15575-4; a vedação real pede teste na visita.`
    : null;
  const nivel = nivelDeSossego(nota);

  return {
    estado: "estimado",
    andar, fachadaGraus, janelaFechada,
    naRua, naJanela, noQuarto,
    faixaDb: FAIXA_DB,
    nbr10151,
    notaDeSossego: nota,
    notaDeDia: notaDeSossego(naJanela.diaDb),
    nivelDeSossego: nivel,
    fontes,
    partes: {
      doChao: chaoNaJanela, doAviao,
      quedaDoAndarDb: um(doChao("noite", 0, fachadaGraus) - doChao("noite", andar, fachadaGraus)),
      quedaDaFachadaDb: um(doChao("noite", andar, null) - doChao("noite", andar, fachadaGraus)),
    },
    textos: {
      manchete: diaENoite(naRua, " na rua"),
      janela: textoDaJanela(andar, fachadaGraus, naJanela),
      quarto,
      faixa: `Faixa da estimativa: ±${FAIXA_DB} dB (na rua, de dia, entre ~${inteiro(naRua.diaDb - FAIXA_DB)} e ~${inteiro(naRua.diaDb + FAIXA_DB)} dB(A)).`,
      nbr: `${textoDaNbr(nbr10151.dia.diferencaDb, nbr10151.noite.diferencaDb)} É referência de norma técnica, não lei municipal.`,
      nota: `Nota de sossego ${virgula(nota)}/10 à noite (${nivel.toLowerCase()}); de dia, ${virgula(notaDeSossego(naJanela.diaDb))}/10.`,
      aviso: `${AVISO_DE_ESTIMATIVA}.`,
      fontes: fontes.map((f) => f.texto),
      vieses: [...VIESES_CONHECIDOS],
      placar: { valor: nivel, subtitulo: `~${inteiro(naJanela.noiteDb)} dB(A) à noite (estimativa) · ${virgula(nota)}/10` },
      ficha: fichaDoRuido(entrada.datas, fontes.map((f) => f.texto)),
    },
  };
}
