// Ponte entre o modelo de ruído estimado e os cartões que a frente visual já tinha (18/11/2026). Esses cartões recebem
// um `ResultadoAcustica3D` (placar, "Sossego à noite por fonte", tradutor dos 10 indicadores, pulso da quadra, Comparar):
// aqui ele passa a sair do modelo estimado do prédio, e não mais de uma via fixa ("coletora a 18 m").
import { fecharResultadoAcustico, resolverIsolamentoD2mnTw, type ResultadoAcustica3D } from "../../nucleo/motores/acustica3d";
import { calcularPulsoDaQuadra, type ResultadoPulsoDaQuadra } from "../dossie/pulsoDaQuadra";
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

/**
 * O eixo "Sossego noturno" do pulso da quadra com a nota do modelo estimado (a mesma do placar e do Comparar), ou
 * "Sem leitura" quando não há estimativa; a média e a manchete são refeitas com os eixos que têm leitura.
 * A conta própria do eixo fica em pulsoDaQuadra.ts (R2, fora deste trabalho): quando o eixo passar a ler
 * `acustica.notaSossego0a10`, esta função pode sair.
 */
export function pulsoComSossegoEstimado(pulso: ResultadoPulsoDaQuadra, e: EstimativaDeRuido): ResultadoPulsoDaQuadra {
  const eixos = pulso.eixos.map((eixo) => {
    if (eixo.id !== "sossego") return eixo;
    if (e.estado !== "estimado") return { ...eixo, nota0a10: null, ausencia: "sem_leitura_publicada" as const, rotuloValor: "Sem leitura", resumo: e.textos.explicacao };
    const nota = e.notaDeSossego;
    return { ...eixo, nota0a10: nota, ausencia: null, rotuloValor: `${nota.toFixed(1).replace(".", ",")} / 10`, resumo: `${e.nivelDeSossego} à noite pela estimativa de ruído` };
  }) as ResultadoPulsoDaQuadra["eixos"];
  const validos = eixos.map((x) => x.nota0a10).filter((n): n is number => typeof n === "number");
  const mediaGeral0a10 = validos.length ? Math.round((validos.reduce((s, n) => s + n, 0) / validos.length) * 10) / 10 : null;
  return {
    ...pulso,
    eixos,
    eixosComLeitura: validos.length,
    mediaGeral0a10,
    manchete: mediaGeral0a10 !== null ? `Pulso médio ${mediaGeral0a10.toFixed(1).replace(".", ",")} / 10 em ${validos.length} eixos com leitura` : "Confirme prédio e valores para compor a leitura da quadra",
  };
}

type EntradaDoPulso = Parameters<typeof calcularPulsoDaQuadra>[0];

/**
 * O pulso da quadra com o sossego do modelo estimado. `calcularPulsoDaQuadra` ainda exige um resultado acústico; sem
 * leitura, recebe um resultado vazio só para a assinatura fechar, e o eixo é trocado por "Sem leitura" logo depois:
 * nenhum número dele chega à tela nem entra na média.
 */
export function pulsoDaQuadraComRuidoEstimado(entrada: Omit<EntradaDoPulso, "acustica">, ruido: EstimativaDeRuido, acustica: ResultadoAcustica3D | null): ResultadoPulsoDaQuadra {
  const semLeitura = fecharResultadoAcustico({ nivelDoChaoDbA: 0, nivelDoAviaoDbA: 0, atenuacaoAlturaViaDb: 0, atenuacaoFachadaFundosDb: 0, isolamentoD2mnTwDb: 0, viaMovimentada: false, somNoturnoPerto: false, epistemicTag: "nao_sabemos" });
  return pulsoComSossegoEstimado(calcularPulsoDaQuadra({ ...entrada, acustica: acustica ?? semLeitura }), ruido);
}
