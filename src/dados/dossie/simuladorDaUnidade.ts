// Simulador "Andar × Fachada" (15/11/2026): a pessoa escolhe casa ou apartamento, o andar e a fachada da janela (rosa
// de 8 direções) e o app recalcula, no aparelho, sem nota de 0 a 100:
// - barulho: as 3 fontes nomeadas mais perto (via principal, corredor de ônibus, metrô, bar, local com licença de som,
//   oficina), com distância e se a janela fica de frente, de lado ou de costas para cada uma. SEM decibéis (decisão do
//   usuário, 15/11/2026): nenhuma fonte do Recife foi medida ou calibrada; o dB(A) fica "Sem leitura publicada";
// - sol: horas de sol direto nessa fachada nessa altura no equinócio, descontando prédios vizinhos mais altos
//   (analisarJanelaNoRecife, o mesmo cálculo da visita);
// - vento: se a fachada recebe a brisa de sudeste e se um vizinho mais alto que a janela fica no caminho (altura pelos
//   pavimentos do cadastro; o modelo de superfície do PE3D, MDS − MDT, ainda não tem leitura publicada).
import type { Edificio } from "../contratos";
import { atritoDoPredio } from "../recife/atrito";
import { baseDeCamadasAmbientais } from "../recife/camadasAmbientais";
import { noiteDoBairro } from "../recife/noite";
import { distanciaMetros } from "../geo";
import { SEM_LEITURA } from "./fichaViva";
import { alturaDoAndarM, analisarJanelaNoRecife, METROS_POR_PAVIMENTO, type LeituraDaJanela } from "./solESombra";

export type TipoDeImovel = "apartamento" | "casa";
/** Grade 3×3 da rosa: NO N NE / O ? L / SO S SE. `null` é "não sei". */
export const ROSA: readonly (readonly ({ rotulo: string; graus: number | null })[])[] = [
  [{ rotulo: "NO", graus: 315 }, { rotulo: "N", graus: 0 }, { rotulo: "NE", graus: 45 }],
  [{ rotulo: "O", graus: 270 }, { rotulo: "?", graus: null }, { rotulo: "L", graus: 90 }],
  [{ rotulo: "SO", graus: 225 }, { rotulo: "S", graus: 180 }, { rotulo: "SE", graus: 135 }],
];
const DIRS = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"];
export const nomeDaDirecao = (g: number) => DIRS[Math.round((((g % 360) + 360) % 360) / 45) % 8]!;
const grausDaPalavra = (lado: string): number | null => { const i = DIRS.indexOf(lado.toLowerCase()); return i >= 0 ? i * 45 : null; };
const difAngulo = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const rumo = (de: readonly [number, number], para: readonly [number, number]) => {
  const x = (para[0] - de[0]) * Math.cos((((de[1] + para[1]) / 2) * Math.PI) / 180), y = para[1] - de[1];
  return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
};

export type FonteDeBarulho = {
  id: "via" | "onibus" | "metro" | "bar" | "luse" | "oficina" | "mercado";
  nome: string;
  quando: "de dia" | "à noite" | "de dia e à noite";
  distanciaM: number;
  rumoGraus: number;
  fonte: string;
};
export type RelacaoComAFachada = "de_frente" | "de_lado" | "de_costas" | "sem_fachada";
export const relacaoComAFachada = (fachada: number | null, rumoDaFonte: number): RelacaoComAFachada =>
  fachada === null ? "sem_fachada" : difAngulo(fachada, rumoDaFonte) <= 60 ? "de_frente" : difAngulo(fachada, rumoDaFonte) <= 120 ? "de_lado" : "de_costas";
const TEXTO_DA_RELACAO: Record<RelacaoComAFachada, string> = {
  de_frente: "a janela fica de frente para ela",
  de_lado: "a janela fica de lado para ela",
  de_costas: "a janela fica de costas: o próprio prédio fica entre ela e a janela",
  sem_fachada: "escolha a fachada para saber de que lado ela fica",
};

/** Fontes nomeadas de barulho em volta do prédio, da mais perto à mais longe (todas, sem corte). */
export function fontesDeBarulho(predio: Edificio): FonteDeBarulho[] {
  const fontes: FonteDeBarulho[] = [];
  const n = noiteDoBairro(predio.bairro)?.predios[predio.id];
  if (n?.r) { const g = grausDaPalavra(n.r.lado); if (g !== null) fontes.push({ id: "via", nome: n.r.rua ? `Via principal (${n.r.rua})` : "Via principal", quando: "de dia e à noite", distanciaM: n.r.m, rumoGraus: g, fonte: "OpenStreetMap (vias principais)" }); }
  if (n?.s) { const g = grausDaPalavra(n.s.lado); if (g !== null) fontes.push({ id: "luse", nome: "Local com licença de som (LUSE)", quando: "à noite", distanciaM: n.s.m, rumoGraus: g, fonte: "Licenciamento Ambiental do Recife (LUSE vigente)" }); }
  const a = atritoDoPredio(predio.bairro, predio.id);
  if (a?.n && a.n[1] <= 300) fontes.push({ id: "bar", nome: "Bar ou venda de bebida", quando: "à noite", distanciaM: a.n[1], rumoGraus: a.n[2], fonte: "CNEFE, Censo 2022 (IBGE)" });
  if (a?.o && a.o[1] <= 150) fontes.push({ id: "oficina", nome: "Oficina, borracharia ou serralheria", quando: "de dia", distanciaM: a.o[1], rumoGraus: a.o[2], fonte: "CNEFE, Censo 2022 (IBGE)" });
  if (a?.m && a.m[1] <= 200) fontes.push({ id: "mercado", nome: "Supermercado ou carga e descarga", quando: "de dia", distanciaM: a.m[1], rumoGraus: a.m[2], fonte: "CNEFE, Censo 2022 (IBGE)" });
  try {
    const r = baseDeCamadasAmbientais().ruidoCorredores;
    let onibus: { d: number; g: number; v: number } | null = null;
    for (const [lon, lat, v] of r.corredoresOnibus) {
      if (Math.abs(lon - predio.centro[0]) > 0.004 || Math.abs(lat - predio.centro[1]) > 0.004) continue;
      const d = distanciaMetros(predio.centro, [lon, lat]);
      if (d <= 200 && (!onibus || d < onibus.d)) onibus = { d, g: rumo(predio.centro, [lon, lat]), v };
    }
    if (onibus) fontes.push({ id: "onibus", nome: `Corredor de ônibus (${onibus.v} partidas num dia útil)`, quando: "de dia e à noite", distanciaM: Math.round(onibus.d), rumoGraus: onibus.g, fonte: "GTFS Grande Recife (horário programado)" });
    let metro: { d: number; g: number } | null = null;
    for (const [lon, lat] of r.trilhosMetro) {
      if (Math.abs(lon - predio.centro[0]) > 0.006 || Math.abs(lat - predio.centro[1]) > 0.006) continue;
      const d = distanciaMetros(predio.centro, [lon, lat]);
      if (d <= 300 && (!metro || d < metro.d)) metro = { d, g: rumo(predio.centro, [lon, lat]) };
    }
    if (metro) fontes.push({ id: "metro", nome: "Linha do metrô/VLT", quando: "de dia e à noite", distanciaM: Math.round(metro.d), rumoGraus: metro.g, fonte: "CBTU (traçado)" });
  } catch {
    // Camada ambiental fora: as outras fontes continuam.
  }
  return fontes.sort((x, y) => x.distanciaM - y.distanciaM);
}

export type SimulacaoDaUnidade = {
  alturaDaJanelaM: number;
  explicacaoDaAltura: string;
  barulho: {
    fontes: (FonteDeBarulho & { relacao: RelacaoComAFachada; frase: string })[];
    semFontes: boolean;
    consequenciaPorFace: string;
    decibeis: string;
    nota: string;
    acaoConcreta: string;
  };
  sol: LeituraDaJanela | null;
  acaoSol: string | null;
  vento: { frase: string; barreira: string | null; superficie3d: string; acaoConcreta: string };
};

export function simularUnidade(opcoes: { predio: Edificio; vizinhos: readonly Edificio[]; tipo: TipoDeImovel; andar: number; fachadaGraus: number | null }): SimulacaoDaUnidade {
  const { predio, vizinhos, tipo, fachadaGraus } = opcoes;
  const andar = tipo === "casa" ? 0 : Math.max(0, Math.round(opcoes.andar));
  const alturaDaJanelaM = alturaDoAndarM(andar) ?? 1.6;
  const explicacaoDaAltura = tipo === "casa" || andar === 0 ? "Janela no térreo (~1,6 m do chão)." : `Janela a ~${alturaDaJanelaM.toFixed(1).replace(".", ",")} m do chão (${andar}º andar × ${METROS_POR_PAVIMENTO.toFixed(1).replace(".", ",")} m + 1,5 m).`;

  const todas = fontesDeBarulho(predio).slice(0, 3);
  const fontes = todas.map((f) => {
    const relacao = relacaoComAFachada(fachadaGraus, f.rumoGraus);
    return { ...f, relacao, frase: `${f.nome}, ${f.quando}, a ~${f.distanciaM} m para o ${nomeDaDirecao(f.rumoGraus)}: ${TEXTO_DA_RELACAO[relacao]}.` };
  });

  const consequenciaPorFace =
    fontes.length === 0
      ? "Nenhuma fonte ruidosa mapeada perto em qualquer fachada deste prédio."
      : fachadaGraus === null
        ? "Toque numa direção da rosa acima para comparar se a janela fica de frente para a rua ou protegida nos fundos."
        : fontes.some((f) => f.relacao === "de_frente")
          ? "Janela de frente para a fonte principal: o som chega direto à esquadria; feche o vidro na visita para testar a vedação."
          : fontes.every((f) => f.relacao === "de_costas")
            ? "Janela nos fundos em relação às fontes mapeadas: o próprio corpo do prédio funciona como barreira acústica."
            : "Janela lateral à fonte principal: o som incide de viés, com exposição reduzida em relação à frente.";

  const sol = fachadaGraus === null ? null : analisarJanelaNoRecife(fachadaGraus, { predio, vizinhos, andar });

  // Vento: brisa de sudeste (cone de 95° a 165°, o mesmo de analisarJanelaNoRecife) e o vizinho mais alto que a janela.
  let barreira: string | null = null;
  let melhor: { d: number; h: number; nome: string | null } | null = null;
  for (const v of vizinhos) {
    if (v.id === predio.id || v.pavimentos === null) continue;
    const g = rumo(predio.centro, v.centro);
    if (g < 110 || g > 160) continue;
    const d = distanciaMetros(predio.centro, v.centro);
    const h = v.pavimentos * METROS_POR_PAVIMENTO;
    if (d > 3 && d <= 120 && h > alturaDaJanelaM && (!melhor || d < melhor.d)) melhor = { d, h, nome: v.nome };
  }
  if (melhor) barreira = `${melhor.nome ? `Ed. ${melhor.nome}` : "Um prédio"} de ~${Math.round(melhor.h)} m (pavimentos do cadastro), a ~${Math.round(melhor.d)} m para o sudeste, fica mais alto que a sua janela.`;
  const frase = fachadaGraus === null
    ? "Escolha a fachada para saber se ela recebe a brisa de sudeste."
    : sol?.recebeBrisaSudeste === "direta" ? "A fachada fica voltada para a brisa de sudeste, a mais comum no Recife."
      : sol?.recebeBrisaSudeste === "reduzida_por_vizinho" ? "A fachada fica voltada para a brisa de sudeste, mas um vizinho mais alto fica no caminho."
        : "A fachada não fica voltada para a brisa de sudeste: o vento chega mais pelos outros lados.";

  const acaoBarulho = fontes.some((f) => f.relacao === "de_frente")
    ? "Na visita: feche as janelas da sala e do quarto principal no horário de movimento e cheque se a esquadria tem vedação íntegra."
    : fontes.length > 0
      ? "Na visita: ouça dos quartos e da varanda com a janela aberta e fechada para confirmar o isolamento do prédio."
      : "Na visita: confira ruídos internos ou imediatos não mapeados (gerador, bombas hidráulicas ou rampa de garagem).";
  const acaoSol =
    sol === null
      ? null
      : /oeste|sudoeste|noroeste/i.test(sol.fachada)
        ? "Na visita: se possível agende após 15h para sentir o calor da parede e pergunte se o condomínio permite película ou proteção solar na varanda."
        : "Na visita: confira pela manhã a luz natural nos quartos e se há umidade em armários de paredes pouco ensolaradas.";
  const acaoVento =
    barreira !== null
      ? "Na visita: abra duas janelas opostas da unidade para testar se há corrente de ar mesmo com o vizinho a sudeste."
      : "Na visita: teste a abertura das folhas voltadas para sudeste/leste e a circulação de ar entre sala e serviço.";

  return {
    alturaDaJanelaM, explicacaoDaAltura,
    barulho: {
      fontes, semFontes: fontes.length === 0,
      consequenciaPorFace,
      decibeis: `Nível em dB(A): ${SEM_LEITURA} (nenhuma medição calibrada no Recife).`,
      nota: "Distâncias em linha reta, do centro do lote; dobrar a distância reduz de forma relevante o efeito da fonte. Para comparar, ouça na visita com a janela aberta e fechada, num dia útil às 18h e numa sexta à noite.",
      acaoConcreta: acaoBarulho,
    },
    sol,
    acaoSol,
    vento: { frase, barreira, superficie3d: `Altura real dos obstáculos (PE3D, MDS − MDT): ${SEM_LEITURA}; usamos os pavimentos do cadastro.`, acaoConcreta: acaoVento },
  };
}
