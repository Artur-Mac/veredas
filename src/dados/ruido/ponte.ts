// Ponte entre o modelo de ruído estimado e os cartões que a frente visual já tinha (18/11/2026). Esses cartões recebem
// um `ResultadoAcustica3D` ("Sossego à noite por fonte", tradutor dos 10 indicadores, pulso da quadra, Comparar):
// aqui ele passa a sair do modelo estimado do prédio, e não mais de uma via fixa ("coletora a 18 m").
import { fecharResultadoAcustico, resolverIsolamentoD2mnTw, type ResultadoAcustica3D } from "../../nucleo/motores/acustica3d";
import type { EstimativaDeRuido } from "./leitura";
import { FAIXA_DB, LIMITE_NBR_10151_A_NOITE_DB } from "./parametros";

/**
 * O resultado acústico dos cartões, pelo modelo estimado: o que vem do chão e o avião à NOITE, na janela (andar e
 * fachada), fechados pela mesma soma em energia e pela mesma janela da NBR 15575-4. `null` quando não há leitura.
 */
export function acusticaDaEstimativa(e: EstimativaDeRuido, p: { anoConstrucao: number | null; precoImovelReais?: number | null }): ResultadoAcustica3D | null {
  if (e.estado !== "estimado") return null;
  const perto = (tipos: readonly string[], ateM: number) => e.fontes.some((f) => tipos.includes(f.tipo) && f.distanciaM !== null && f.distanciaM <= ateM);
  const resultado = fecharResultadoAcustico({
    nivelDoChaoDbA: e.partes.doChao.noiteDb,
    nivelDoAviaoDbA: e.partes.doAviao?.noiteDb ?? 0,
    atenuacaoAlturaViaDb: Math.max(0, e.partes.quedaDoAndarDb),
    atenuacaoFachadaFundosDb: Math.max(0, e.partes.quedaDaFachadaDb),
    isolamentoD2mnTwDb: resolverIsolamentoD2mnTw(p.anoConstrucao),
    precoImovelReais: p.precoImovelReais,
    viaMovimentada: perto(["rodovia", "arterial", "coletora"], 150),
    // Bar ou som licenciado só conta como movimento noturno quando a parcela dele, à noite na janela, chega perto da
    // referência da NBR 10151 (50 dB(A) menos a faixa de erro): um bar que mal passa do piso não vira "intenso".
    somNoturnoPerto: e.fontes.some((f) => (f.tipo === "luse" || f.tipo === "bar") && f.nivelANoiteDb >= LIMITE_NBR_10151_A_NOITE_DB - FAIXA_DB),
    epistemicTag: "inferencia",
    limiteEpistemologico: "Estimativa com dados abertos, não medição; a vedação real da janela pede teste no quarto durante a visita.",
    notaSossego0a10: e.notaDeSossego,
  });
  // Pendência 3 do HANDOFF (19/11/2026): "dentro da referência" é a mesma comparação que o texto da NBR 10151 mostra
  // (nível da NOITE na janela, arredondado como na tela). Pela soma refeita aqui, um prédio a 50,4 dB(A) podia sair
  // "dentro" numa linha e não na outra.
  return { ...resultado, atendeReferenciaNoturnaNbr10151: e.nbr10151.noite.diferencaDb <= 0 };
}
