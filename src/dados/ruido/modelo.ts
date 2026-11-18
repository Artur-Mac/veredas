// Modelo de ruído estimado (decisão A2, 18/11/2026): as contas, sem leitura de arquivo nem de rede. É a metodologia
// publicada pelo Mapa Sossego (https://mapasossego.com.br/sobre) aplicada no ponto do prédio, com o que o Vereda
// acrescenta: partidas de ônibus, andar, fachada e janela fechada. Todo número vem de ./parametros.
// O mesmo arquivo roda no app e no pipeline (scripts/dados/ruido/rodar-ruido.mjs): só sintaxe que o Node apaga sozinho.
import {
  ABSORCAO_DB_POR_100_M,
  ALTURA_DE_REFERENCIA_DO_AVIAO_M,
  ANDAR_DA_ABSORCAO_MINIMA,
  ANGULO_DE_FRENTE_GRAUS,
  ANGULO_DE_LADO_GRAUS,
  BARREIRA_DOS_FUNDOS_DB,
  CLASSE_POR_HIGHWAY,
  CORRECAO_DE_ZONA_30_DB,
  CORRECAO_POR_10_KMH_DB,
  DB_DA_NOTA_0,
  DB_DA_NOTA_10,
  DELTA_DA_FONTE_PONTUAL_A_NOITE_DB,
  DISTANCIA_DE_REFERENCIA_M,
  DISTANCIA_MINIMA_M,
  FAIXAS_DE_REFERENCIA,
  FRACAO_MINIMA_DA_ABSORCAO,
  LIMITE_NBR_10151_A_NOITE_DB,
  LIMITE_NBR_10151_DE_DIA_DB,
  METROS_POR_ANDAR,
  NIVEL_DA_FONTE_PONTUAL_DB,
  NIVEL_DA_VIA_DB,
  NIVEL_DO_AVIAO_A_60_M_DB,
  NIVEL_DO_TRILHO_DB,
  NIVEL_POR_PARTIDA_DE_ONIBUS_DB,
  PASSO_DA_LINHA_M,
  PISO_A_NOITE_DB,
  PISO_DE_DIA_DB,
  QUEDA_DA_LINHA_POR_DECADA_DB,
  QUEDA_DA_VIA_A_NOITE_DB,
  QUEDA_DE_LADO_DB,
  QUEDA_DO_AVIAO_A_NOITE_DB,
  QUEDA_DO_AVIAO_POR_60_M_DB,
  QUEDA_DO_AVIAO_POR_KM_DE_LADO_DB,
  QUEDA_DO_PONTO_POR_DECADA_DB,
  QUEDA_DO_TRILHO_A_NOITE_DB,
  TETO_DA_CORRECAO_POR_FAIXAS_DB,
  TETO_DA_CORRECAO_POR_VELOCIDADE_DB,
  TETO_DO_GRUPO_DE_BARES_DB,
  VELOCIDADE_DE_ZONA_30_KMH,
  VELOCIDADE_SEM_CORRECAO_KMH,
  type ClasseDeVia,
  type TipoDeFontePontual,
} from "./parametros";

/** Tipos de fonte do chão, na ordem dos códigos gravados na camada (o índice é o código). Não reordene: muda o formato. */
export const TIPOS_DE_FONTE = ["rodovia", "arterial", "coletora", "local", "residencial", "trilho", "luse", "bar", "oficina", "mercado"] as const;
export type TipoDeFonte = (typeof TIPOS_DE_FONTE)[number];
export type Periodo = "dia" | "noite";

const CLASSES: readonly string[] = ["rodovia", "arterial", "coletora", "local", "residencial"];
export const eVia = (t: TipoDeFonte): t is ClasseDeVia => CLASSES.includes(t);
/** Via e trilho caem como linha (3 dB por dobro); o resto, como ponto (6 dB por dobro). */
export const eLinha = (t: TipoDeFonte): boolean => eVia(t) || t === "trilho";

// ——— Energia ——————————————————————————————————————————————————————————————————————————————————————

export const energiaDe = (db: number): number => 10 ** (db / 10);
/** dB de uma energia; zero ou menos vira −Infinity (não há som a somar). */
export const dbDe = (energia: number): number => (energia > 0 ? 10 * Math.log10(energia) : -Infinity);

/** Soma em energia, não em dB: dois níveis iguais somam +3 dB. Valores não finitos ficam de fora. */
export function somarEmEnergia(niveis: readonly number[]): number {
  let e = 0;
  for (const n of niveis) if (Number.isFinite(n)) e += energiaDe(n);
  return dbDe(e);
}

// ——— Emissão ——————————————————————————————————————————————————————————————————————————————————————

const numero = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number.parseFloat(v) : Number.NaN;
  return Number.isFinite(n) ? n : null;
};

/** +10·log10(faixas ÷ 2) acima de 2 faixas, até o teto. */
export function correcaoPorFaixas(faixas: number | null): number {
  if (faixas === null || faixas <= FAIXAS_DE_REFERENCIA) return 0;
  return Math.min(TETO_DA_CORRECAO_POR_FAIXAS_DB, 10 * Math.log10(faixas / FAIXAS_DE_REFERENCIA));
}

/** +1 dB a cada 10 km/h acima de 60 (até o teto); −2 dB em zona 30. */
export function correcaoPorVelocidade(kmh: number | null): number {
  if (kmh === null || kmh <= 0) return 0;
  if (kmh <= VELOCIDADE_DE_ZONA_30_KMH) return CORRECAO_DE_ZONA_30_DB;
  if (kmh <= VELOCIDADE_SEM_CORRECAO_KMH) return 0;
  return Math.min(TETO_DA_CORRECAO_POR_VELOCIDADE_DB, ((kmh - VELOCIDADE_SEM_CORRECAO_KMH) / 10) * CORRECAO_POR_10_KMH_DB);
}

/** Classe e nível de dia (dB(A) a 10 m) de uma via do OpenStreetMap; null para o que não é via de trânsito geral. */
export function nivelDaVia(etiquetas: { highway?: string; lanes?: string | number; maxspeed?: string | number }): { classe: ClasseDeVia; nivelDb: number } | null {
  const classe = etiquetas.highway ? CLASSE_POR_HIGHWAY[etiquetas.highway] : undefined;
  if (!classe) return null;
  return { classe, nivelDb: NIVEL_DA_VIA_DB[classe] + correcaoPorFaixas(numero(etiquetas.lanes)) + correcaoPorVelocidade(numero(etiquetas.maxspeed)) };
}

/** Parcela dos ônibus numa via, em dB(A) a 10 m: 10·log10(partidas num dia útil) + o nível por partida. */
export function nivelDosOnibus(partidasPorDiaUtil: number): number {
  return partidasPorDiaUtil > 0 ? NIVEL_POR_PARTIDA_DE_ONIBUS_DB + 10 * Math.log10(partidasPorDiaUtil) : -Infinity;
}

/** Nível de dia de uma fonte pontual a 10 m; bares em grupo ganham 10·log10(quantos a 150 m), até o teto. */
export function nivelDaFontePontual(tipo: TipoDeFontePontual, quantosNoGrupo = 1): number {
  const grupo = tipo === "bar" && quantosNoGrupo > 1 ? Math.min(TETO_DO_GRUPO_DE_BARES_DB, 10 * Math.log10(quantosNoGrupo)) : 0;
  return NIVEL_DA_FONTE_PONTUAL_DB[tipo] + grupo;
}

/** Quanto a fonte muda da manhã para a noite (22h–7h), em dB: negativo perde, positivo ganha. */
export function deltaDaNoite(tipo: TipoDeFonte): number {
  if (eVia(tipo)) return -QUEDA_DA_VIA_A_NOITE_DB[tipo];
  if (tipo === "trilho") return -QUEDA_DO_TRILHO_A_NOITE_DB;
  return DELTA_DA_FONTE_PONTUAL_A_NOITE_DB[tipo];
}

export { NIVEL_DO_TRILHO_DB };

// ——— Propagação ———————————————————————————————————————————————————————————————————————————————————

export const alturaDoAndar = (andar: number): number => Math.max(0, andar) * METROS_POR_ANDAR;

/** Fração da absorção do ar e do solo que sobra no andar: 100% no térreo, 60% do 10º andar para cima. */
export function fracaoDaAbsorcao(andar: number): number {
  const a = Math.max(0, Math.min(ANDAR_DA_ABSORCAO_MINIMA, andar));
  return 1 - (1 - FRACAO_MINIMA_DA_ABSORCAO) * (a / ANDAR_DA_ABSORCAO_MINIMA);
}

/** Absorção do ar e do solo em `distanciaM`, em dB. */
export const absorcao = (distanciaM: number, andar = 0): number => (ABSORCAO_DB_POR_100_M / 100) * distanciaM * fracaoDaAbsorcao(andar);

/** Nível de uma fonte pontual a `distanciaM` no chão, vista de `andar`: 6 dB por dobro da distância 3D, mais a absorção. */
export function nivelDePonto(nivelDeReferenciaDb: number, distanciaM: number, andar = 0): number {
  const d = Math.max(DISTANCIA_MINIMA_M, Math.hypot(distanciaM, alturaDoAndar(andar)));
  return nivelDeReferenciaDb - QUEDA_DO_PONTO_POR_DECADA_DB * Math.log10(d / DISTANCIA_DE_REFERENCIA_M) - absorcao(d, andar);
}

/**
 * Energia que um trecho reto de linha (via, trilho) entrega no ponto (0, 0), com as pontas A e B em metros e o ponto na
 * altura de `andar`. A linha infinita cai 3 dB por dobro da distância; o trecho vale a fração do ângulo que ocupa visto
 * do ponto (ângulo ÷ π), o que impede contar duas vezes uma via dividida em pedaços no mapa. O trecho é cortado em
 * pedaços de até PASSO_DA_LINHA_M e cada pedaço perde a absorção da própria distância.
 */
export function energiaDeTrecho(nivelDeReferenciaDb: number, ax: number, ay: number, bx: number, by: number, andar = 0): number {
  const dx = bx - ax, dy = by - ay;
  const comprimento = Math.hypot(dx, dy);
  if (!(comprimento > 0)) return 0;
  const ux = dx / comprimento, uy = dy / comprimento;
  // Pé da perpendicular: `t0` ao longo do trecho a partir de A; `p` é a distância do ponto à reta, em 3D.
  const t0 = -(ax * ux + ay * uy);
  const lado = Math.abs(ax * uy - ay * ux);
  const p = Math.max(DISTANCIA_MINIMA_M, Math.hypot(lado, alturaDoAndar(andar)));
  const pedacos = Math.max(1, Math.ceil(comprimento / PASSO_DA_LINHA_M));
  const base = (energiaDe(nivelDeReferenciaDb) * DISTANCIA_DE_REFERENCIA_M) / (Math.PI * p);
  let e = 0;
  for (let i = 0; i < pedacos; i++) {
    const s1 = (comprimento * i) / pedacos - t0, s2 = (comprimento * (i + 1)) / pedacos - t0;
    const angulo = Math.atan(s2 / p) - Math.atan(s1 / p);
    const meio = Math.hypot(p, (s1 + s2) / 2);
    e += base * angulo * 10 ** (-absorcao(meio, andar) / 10);
  }
  return e;
}

/** Nível, em dB, do mesmo trecho. */
export const nivelDeTrecho = (nivelDeReferenciaDb: number, ax: number, ay: number, bx: number, by: number, andar = 0): number =>
  dbDe(energiaDeTrecho(nivelDeReferenciaDb, ax, ay, bx, by, andar));

/**
 * Energia de um pedaço de linha de `comprimentoM` cujo meio fica a `distanciaM`, quando só se conhece esse ponto (o
 * traçado do metrô vem amostrado em pontos): o pedaço é posto de frente para quem ouve.
 */
export function energiaDeElementoDeLinha(nivelDeReferenciaDb: number, distanciaM: number, comprimentoM: number, andar = 0): number {
  const p = Math.max(DISTANCIA_MINIMA_M, Math.hypot(distanciaM, alturaDoAndar(andar)));
  const angulo = 2 * Math.atan(comprimentoM / 2 / p);
  return ((energiaDe(nivelDeReferenciaDb) * DISTANCIA_DE_REFERENCIA_M) / (Math.PI * p)) * angulo * 10 ** (-absorcao(p, andar) / 10);
}

// ——— Fachada ——————————————————————————————————————————————————————————————————————————————————————

export type RelacaoComAFachada = "de_frente" | "de_lado" | "de_costas" | "sem_fachada";
const diferencaDeAngulo = (a: number, b: number): number => Math.abs(((a - b + 540) % 360) - 180);

/** A janela fica de frente (até 60°), de lado (até 120°) ou de costas para a fonte; sem fachada escolhida, não se sabe. */
export function relacaoComAFachada(fachadaGraus: number | null, rumoDaFonteGraus: number): RelacaoComAFachada {
  if (fachadaGraus === null) return "sem_fachada";
  const d = diferencaDeAngulo(fachadaGraus, rumoDaFonteGraus);
  return d <= ANGULO_DE_FRENTE_GRAUS ? "de_frente" : d <= ANGULO_DE_LADO_GRAUS ? "de_lado" : "de_costas";
}

/** Quanto a fonte perde por causa da fachada, em dB: nada de frente, 3 de lado, a barreira do prédio nos fundos. */
export function quedaDaFachada(fachadaGraus: number | null, rumoDaFonteGraus: number): number {
  const r = relacaoComAFachada(fachadaGraus, rumoDaFonteGraus);
  return r === "de_lado" ? QUEDA_DE_LADO_DB : r === "de_costas" ? BARREIRA_DOS_FUNDOS_DB : 0;
}

// ——— Andar ————————————————————————————————————————————————————————————————————————————————————————

/**
 * Leva ao andar o nível de uma fonte calculado no chão. Só a distância mais curta é conhecida: a linha perde
 * 10·log10(distância 3D ÷ distância no chão), o ponto perde 20·log10, e a absorção passa a valer pela fração do andar
 * (andares altos ouvem melhor o que está longe). No térreo devolve o mesmo nível.
 */
export function nivelNoAndar(tipo: TipoDeFonte, nivelNoChaoDb: number, distanciaM: number, andar: number): number {
  if (!(andar > 0)) return nivelNoChaoDb;
  const noChao = Math.max(DISTANCIA_MINIMA_M, distanciaM);
  const no3d = Math.max(DISTANCIA_MINIMA_M, Math.hypot(distanciaM, alturaDoAndar(andar)));
  const queda = (eLinha(tipo) ? QUEDA_DA_LINHA_POR_DECADA_DB : QUEDA_DO_PONTO_POR_DECADA_DB) * Math.log10(no3d / noChao);
  return nivelNoChaoDb - queda + absorcao(noChao, 0) - absorcao(no3d, andar);
}

// ——— Avião ————————————————————————————————————————————————————————————————————————————————————————

/**
 * Nível de dia sob a linha de pouso e decolagem, pela altura do avião (cone de src/dados/recife/aeroporto.ts) e pelo
 * afastamento do eixo. Não muda com o andar nem com a fachada: o som vem de cima.
 */
export function nivelDoAviao(alturaDoAviaoM: number, afastamentoDoEixoM = 0): number {
  const h = Math.max(ALTURA_DE_REFERENCIA_DO_AVIAO_M, alturaDoAviaoM);
  return (
    NIVEL_DO_AVIAO_A_60_M_DB -
    10 * Math.log10(h / ALTURA_DE_REFERENCIA_DO_AVIAO_M) -
    ((h - ALTURA_DE_REFERENCIA_DO_AVIAO_M) / ALTURA_DE_REFERENCIA_DO_AVIAO_M) * QUEDA_DO_AVIAO_POR_60_M_DB -
    (Math.abs(afastamentoDoEixoM) / 1000) * QUEDA_DO_AVIAO_POR_KM_DE_LADO_DB
  );
}
export const nivelDoAviaoANoite = (nivelDeDiaDb: number): number => nivelDeDiaDb - QUEDA_DO_AVIAO_A_NOITE_DB;

// ——— Composição ———————————————————————————————————————————————————————————————————————————————————

export const pisoDoPeriodo = (periodo: Periodo): number => (periodo === "dia" ? PISO_DE_DIA_DB : PISO_A_NOITE_DB);

/** Uma fonte do chão como a camada guarda: tipo, distância e rumo do ponto mais perto e o nível de dia no chão. */
export type FonteDoChao = { tipo: TipoDeFonte; distanciaM: number; rumoGraus: number; nivelDeDiaDb: number };

/** Nível de uma fonte do chão na janela (andar e fachada), no período. */
export function nivelDaFonteNaJanela(f: FonteDoChao, periodo: Periodo, andar: number, fachadaGraus: number | null): number {
  const noChao = f.nivelDeDiaDb + (periodo === "noite" ? deltaDaNoite(f.tipo) : 0);
  return nivelNoAndar(f.tipo, noChao, f.distanciaM, andar) - quedaDaFachada(fachadaGraus, f.rumoGraus);
}

/**
 * Nível do que vem do chão na janela: as fontes que mais pesam (cada uma levada ao andar e à fachada), o resto das
 * fontes (já com a fachada, calculado no pipeline) e o piso urbano do período. O avião entra depois, sem atenuação.
 */
export function nivelDoChao(fontes: readonly FonteDoChao[], restoDb: number, periodo: Periodo, andar: number, fachadaGraus: number | null): number {
  return somarEmEnergia([...fontes.map((f) => nivelDaFonteNaJanela(f, periodo, andar, fachadaGraus)), restoDb, pisoDoPeriodo(periodo)]);
}

// ——— Leitura ——————————————————————————————————————————————————————————————————————————————————————

/** Nota de sossego 0–10, linear: 48 dB(A) ou menos = 10; 86 ou mais = 0 (a escala do Mapa Sossego, dividida por 10). */
export function notaDeSossego(db: number): number {
  const n = ((DB_DA_NOTA_0 - db) / (DB_DA_NOTA_0 - DB_DA_NOTA_10)) * 10;
  return Math.round(Math.max(0, Math.min(10, n)) * 10) / 10;
}

export const limiteDaNbr10151 = (periodo: Periodo): number => (periodo === "dia" ? LIMITE_NBR_10151_DE_DIA_DB : LIMITE_NBR_10151_A_NOITE_DB);

/** Diferença, em dB inteiros, entre a estimativa e a referência da NBR 10151 para área residencial no período. */
export function compararComANbr10151(db: number, periodo: Periodo): { limiteDb: number; diferencaDb: number } {
  const limiteDb = limiteDaNbr10151(periodo);
  return { limiteDb, diferencaDb: Math.round(db) - limiteDb };
}

/** No quarto, com a janela fechada: o nível de fora menos o isolamento da fachada (NBR 15575-4, pelo ano do prédio). */
export const nivelComJanelaFechada = (nivelDeForaDb: number, isolamentoDb: number): number => nivelDeForaDb - isolamentoDb;
