// Ruído estimado do prédio (decisão A2 do Samuel, 18/11/2026): a leitura única de barulho do app. Lê a camada gerada por
// scripts/dados/ruido/rodar-ruido.mjs (fontes do chão por prédio), soma o avião pelo cone de aproximação
// (../recife/aeroporto) e aplica o andar, a fachada e a janela (./leitura, ./modelo). Sem camada para o prédio devolve
// "sem leitura": nunca um valor fixo. Todo número daqui é estimativa com dados abertos, não medição.
import { z } from "zod";
import { faltaCamada, lerCamada } from "../camadas";
import { relacaoComOAeroporto } from "../recife/aeroporto";
import { ARQUIVOS_DO_RUIDO, FONTES_DO_RUIDO, VERSAO_DO_RUIDO } from "../recife/ruidoGerado";
import type { FichaDeMetodo6Campos } from "../fichaDeMetodo";
import { fichaDoRuido, montarEstimativa, semLeituraDeRuido, type AviaoSobreOPredio, type EstimativaDeRuido, type OpcoesDeRuido } from "./leitura";

export type { EstimativaDeRuido, FonteQuePesa, OpcoesDeRuido, RuidoEstimado, SemLeituraDeRuido } from "./leitura";

const DATAS = { viasDe: FONTES_DO_RUIDO.vias.dadosDe, metodologiaLidaEm: FONTES_DO_RUIDO.metodologia.lidaEm };
/** A ficha de método do ruído sem as fontes de um prédio: o que mede, de onde vem, de quando é, a conta e o limite. */
export const fichaGeralDoRuido = (): FichaDeMetodo6Campos => fichaDoRuido(DATAS, []);

/** O arquivo de camada do bairro (fora do bundle, D036), ou null onde a estimativa não foi publicada. */
export const arquivoDoRuido = (bairro: string | null | undefined): string | null => (bairro ? ARQUIVOS_DO_RUIDO[bairro] ?? null : null);

const decimos = z.number().int().nonnegative();
/** [código do tipo, índice do nome ou −1, metros, rumo, nível de dia em décimos de dB, partidas de ônibus ou bares no grupo]. */
const fonte = z.union([
  z.tuple([z.number().int().min(0).max(9), z.number().int().min(-1), decimos, z.number().int().min(0).max(359), z.number().int()]),
  z.tuple([z.number().int().min(0).max(9), z.number().int().min(-1), decimos, z.number().int().min(0).max(359), z.number().int(), z.number().int().positive()]),
]);
const esquema = z.strictObject({
  versao: z.string(),
  nomes: z.array(z.string().min(1)),
  predios: z.record(z.string(), z.strictObject({ f: z.array(fonte).max(6), d: z.array(decimos).length(9).optional(), n: z.array(decimos).length(9).optional() })),
});
export type RuidoDoBairro = z.infer<typeof esquema>;

const cache = new Map<string, RuidoDoBairro | null>();
/** A camada do bairro, validada e da versão publicada; null fora da cobertura. Lança se a tela não esperou o arquivo. */
export function ruidoDoBairro(bairro: string | null | undefined): RuidoDoBairro | null {
  if (!bairro) return null;
  if (!cache.has(bairro)) {
    const c = arquivoDoRuido(bairro);
    const p = c ? esquema.safeParse(lerCamada(c)) : null;
    cache.set(bairro, p?.success && p.data.versao === VERSAO_DO_RUIDO ? p.data : null);
  }
  return cache.get(bairro) ?? null;
}

/** O que a estimativa precisa do prédio do índice. */
export type PredioParaORuido = { id: string; bairro: string; centro: readonly [number, number]; anoConstrucao?: number | null };

function aviaoSobre(centro: readonly [number, number]): AviaoSobreOPredio {
  try {
    return relacaoComOAeroporto(centro)?.trajetoria ?? null;
  } catch {
    return null;
  }
}

/**
 * dB(A) estimados de dia e à noite na rua e na janela (andar e fachada), a faixa de ±5 dB, a comparação com a
 * NBR 10151, a nota de sossego 0–10, as fontes que mais pesam e os textos prontos. Sem prédio ou sem camada: "sem leitura".
 */
export function estimarRuido(predio: PredioParaORuido | null | undefined, opcoes: OpcoesDeRuido = {}): EstimativaDeRuido {
  if (!predio) return semLeituraDeRuido("sem_predio");
  let camada: RuidoDoBairro | null;
  try {
    camada = ruidoDoBairro(predio.bairro);
  } catch (e) {
    // Arquivo ainda não carregado ou que falhou: sem número, e sem guardar "sem dado" no cache.
    if (faltaCamada(e)) return semLeituraDeRuido("sem_camada");
    throw e;
  }
  if (!camada) return semLeituraDeRuido("sem_camada");
  const registro = camada.predios[predio.id];
  if (!registro) return semLeituraDeRuido("sem_registro");
  return montarEstimativa({
    registro,
    nomes: camada.nomes,
    aviao: aviaoSobre(predio.centro),
    anoConstrucao: predio.anoConstrucao ?? null,
    datas: DATAS,
    opcoes,
  });
}

export const fontesDoRuido = () => FONTES_DO_RUIDO;
