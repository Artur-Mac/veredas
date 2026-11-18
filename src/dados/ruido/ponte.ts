// Ponte entre o modelo de ruído estimado e os cartões que a frente visual já tinha (18/11/2026). Esses cartões recebem
// um `ResultadoAcustica3D` ("Sossego à noite por fonte", tradutor dos 10 indicadores, pulso da quadra, Comparar):
// aqui ele passa a sair do modelo estimado do prédio, e não mais de uma via fixa ("coletora a 18 m").
import { fecharResultadoAcustico, resolverIsolamentoD2mnTw, type ResultadoAcustica3D } from "../../nucleo/motores/acustica3d";
import type { EstimativaDeRuido } from "./leitura";

/**
 * O resultado acústico dos cartões, pelo modelo estimado: o que vem do chão e o avião à NOITE, na janela (andar e
 * fachada), fechados pela mesma soma em energia e pela mesma janela da NBR 15575-4. `null` quando não há leitura.
 */
export function acusticaDaEstimativa(e: EstimativaDeRuido, p: { anoConstrucao: number | null; precoImovelReais?: number | null }): ResultadoAcustica3D | null {
  if (e.estado !== "estimado") return null;
  const perto = (tipos: readonly string[], ateM: number) => e.fontes.some((f) => tipos.includes(f.tipo) && f.distanciaM !== null && f.distanciaM <= ateM);
  return fecharResultadoAcustico({
    nivelDoChaoDbA: e.partes.doChao.noiteDb,
    nivelDoAviaoDbA: e.partes.doAviao?.noiteDb ?? 0,
    atenuacaoAlturaViaDb: Math.max(0, e.partes.quedaDoAndarDb),
    atenuacaoFachadaFundosDb: Math.max(0, e.partes.quedaDaFachadaDb),
    isolamentoD2mnTwDb: resolverIsolamentoD2mnTw(p.anoConstrucao),
    precoImovelReais: p.precoImovelReais,
    viaMovimentada: perto(["rodovia", "arterial", "coletora"], 150),
    somNoturnoPerto: perto(["luse", "bar"], 150),
    epistemicTag: "inferencia",
    limiteEpistemologico: "Estimativa com dados abertos, não medição; a vedação real da janela pede teste no quarto durante a visita.",
    notaSossego0a10: e.notaDeSossego,
  });
}
