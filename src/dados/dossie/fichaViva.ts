// Ficha Viva do Edifício (15/11/2026): cinco micro-indicadores factuais no alto do dossiê, antes das abas, cada um com
// fonte e data. Sem nota, sem veredito: medida, comparação explícita ou "Sem leitura publicada nesta área ainda".
// 1. Escala e idade (IPTU 2026 + Lotes); 2. Registros estruturais (linha do tempo documental do caderno);
// 3. ITBI no prédio (avaliação fiscal por unidade × preço pedido); 4. Condomínio/m² × prédios da mesma idade na amostra
// do próprio caderno (mediana ± MAD; precisa de 5); 5. Clima e entorno (calor de superfície, cota e canal, Defesa Civil,
// potencial construtivo do vizinho).
import type { Caderno } from "../caderno";
import type { AnaliseV2, Edificio, VisaoDaRua, VisaoDoDossie } from "../contratos";
import { eCoberto } from "../recife/bairros";
import { lerRelevoECanalProximo, lerTemperaturaSuperficie100m } from "../recife/camadasAmbientais";
import { edificioPorId } from "../recife/indice";
import { derivarSintesesInteligentes } from "./sintesesDaRua";
import { lerLinhaDoTempo, type AtoDocumentado, type EtapaEstrutural, type LeituraEstrutural } from "../estrutura/linhaDoTempo";
import { formatarNumero, formatarReais, pl } from "../formatos";

export const SEM_LEITURA = "Sem leitura publicada nesta área ainda";

export type IdDaFicha = "escala" | "estrutura" | "itbi" | "condominio" | "clima";
export type ItemDaFicha = {
  id: IdDaFicha;
  rotulo: string;
  /** O que aparece de cara: medida ou "Sem leitura…" (nunca 0 no lugar de desconhecido). */
  valor: string;
  /** Uma frase de leitura (comparação explícita), ou null. */
  leitura: string | null;
  /** Atenção factual (ex.: "acima dos pares"), sem nota. */
  atencao: string | null;
  detalhes: string[];
  fonte: string;
  /** Pergunta pronta para o síndico ou corretor, quando faz sentido. */
  pergunta: string | null;
};

// ——— 2. Atos estruturais vindos do caderno ——————————————————————————————————————————————————————

const ETAPA_POR_PALAVRA: [RegExp, EtapaEstrutural][] = [
  [/desab/i, "desabamento"], [/liber|desinterd/i, "liberacao"], [/interd/i, "interdicao"], [/reparo|recupera|refor[cç]o|obra estrutural/i, "reparo"],
  [/laudo|\bart\b|\brrt\b/i, "laudo_art_rrt"], [/vistoria|inspe[cç]/i, "vistoria"], [/chamad|solicita|den[uú]ncia|protocolo/i, "chamado"],
];
const etapaDoTexto = (t: string): EtapaEstrutural | null => ETAPA_POR_PALAVRA.find(([re]) => re.test(t))?.[1] ?? null;
/** "Confirmado" no caderno quer dizer: a pessoa ligou o documento a este imóvel (endereço); "a confirmar" não basta. */
const vinculoDoCaderno = (v: "confirmado" | "a_confirmar" | "outro_imovel"): AtoDocumentado["vinculo"] | null =>
  v === "confirmado" ? "endereco" : v === "a_confirmar" ? "bairro_ou_rua" : null;

/** Laudos, ARTs/RRTs e ocorrências de estrutura que a pessoa guardou no caderno, como atos documentados. */
export function atosDoCaderno(c: Caderno | undefined): AtoDocumentado[] {
  if (!c) return [];
  const atos: AtoDocumentado[] = [];
  for (const d of c.documentos) {
    const vinculo = vinculoDoCaderno(d.vinculo);
    if (!vinculo) continue;
    const etapa = d.tipo === "laudo" || d.tipo === "art_rrt" ? "laudo_art_rrt" : etapaDoTexto(`${d.titulo} ${d.escopo}`);
    if (!etapa) continue;
    atos.push({ etapa, data: d.inspecaoEm ?? d.emitidoEm, documento: `${d.titulo} (${d.origem}${d.pagina ? `, p. ${d.pagina}` : ""})`, numero: null, orgao: null, vinculo });
  }
  for (const o of c.ocorrencias) {
    if (o.assunto !== "estrutura") continue;
    const vinculo = vinculoDoCaderno(o.vinculo);
    const etapa = etapaDoTexto(o.estagio);
    if (!vinculo || !etapa) continue;
    atos.push({ etapa, data: o.referenciaEm, documento: o.fonte, numero: o.identificador, orgao: o.orgao, vinculo });
  }
  return atos;
}

export function estruturaDoCaderno(c: Caderno | undefined): LeituraEstrutural {
  return lerLinhaDoTempo(atosDoCaderno(c));
}

// ——— 4. Condomínio por m² na amostra do caderno ————————————————————————————————————————————————

export const AMOSTRA_MINIMA_DO_CONDOMINIO = 5;
export const FAIXA_DE_IDADE_ANOS = 10;

export function mediana(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}
/** Desvio absoluto mediano (MAD), sem o fator de escala. */
export function mad(xs: readonly number[]): number {
  const m = mediana(xs);
  return mediana(xs.map((x) => Math.abs(x - m)));
}

const condominioPorM2 = (a: AnaliseV2): number | null => {
  const c = a.declarados.condominio, ar = a.declarados.area;
  if (c.valor === null || c.aConfirmar || ar.valor === null || ar.aConfirmar || !(ar.valor > 0)) return null;
  return c.valor / ar.valor;
};

export type ComparacaoDoCondominio =
  | { estado: "sem_valor" }
  | { estado: "amostra_pequena"; valorM2: number; n: number }
  | { estado: "ok"; valorM2: number; n: number; mediana: number; mad: number; desvio: number | null; acima: boolean; abaixoEmPredioMaduro: boolean };

/**
 * Condomínio/m² desta análise × as análises do caderno no mesmo bairro, mesma modalidade e prédio com idade a até 10 anos
 * (prédio confirmado e com ano no cadastro). `anoDe` resolve o ano de construção do prédio de outra análise.
 */
export function compararCondominio(a: AnaliseV2, ano: number | null, lista: readonly AnaliseV2[], anoDe: (x: AnaliseV2) => number | null, anoAtual: number): ComparacaoDoCondominio {
  const v = condominioPorM2(a);
  if (v === null) return { estado: "sem_valor" };
  const pares = ano === null ? [] : lista.filter((x) => x.id !== a.id && !x.descarte && x.bairro === a.bairro && x.modalidade === a.modalidade)
    .map((x) => ({ x, m2: condominioPorM2(x), ano: anoDe(x) }))
    .filter((p) => p.m2 !== null && p.ano !== null && Math.abs(p.ano - ano) <= FAIXA_DE_IDADE_ANOS)
    .map((p) => p.m2!);
  if (pares.length < AMOSTRA_MINIMA_DO_CONDOMINIO) return { estado: "amostra_pequena", valorM2: v, n: pares.length };
  const med = mediana(pares), d = mad(pares);
  const escala = 1.4826 * d;
  const desvio = escala > 0 ? (v - med) / escala : null;
  const idade = ano === null ? null : anoAtual - ano;
  return {
    estado: "ok", valorM2: v, n: pares.length, mediana: med, mad: d, desvio,
    acima: desvio !== null && desvio > 1.5,
    abaixoEmPredioMaduro: desvio !== null && desvio < -1.5 && idade !== null && idade >= 25 && idade <= 45,
  };
}

// ——— A ficha ————————————————————————————————————————————————————————————————————————————————————————

const reaisM2 = (v: number) => `R$ ${formatarNumero(v, 2)}/m²`;
const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export type EntradaDaFicha = {
  analise: AnaliseV2;
  predio: Edificio | null;
  lista: readonly AnaliseV2[];
  anoDe: (x: AnaliseV2) => number | null;
  agora: Date;
  /** Calor de superfície (Landsat 100 m): temperatura da quadra e diferença para a mediana do bairro. */
  calor: { tempQuadraC: number; diferencaBairroC: number | null } | null;
  /** Cota (Copernicus DEM 30 m) e canal/rio mais perto. */
  relevo: { altitudeM: number | null; diferencaEntornoM: number | null; cursoDaguaMaisProximo: { nome: string; distanciaM: number } | null } | null;
  rua: VisaoDaRua | null;
  nomeDoBairro: string;
};

export function fichaViva(x: EntradaDaFicha): ItemDaFicha[] {
  const { analise: a, predio: e } = x;
  const anoAtual = x.agora.getFullYear();

  // 1. Escala e idade.
  const escala: ItemDaFicha = e
    ? {
      id: "escala", rotulo: "Escala e idade",
      valor: [e.anoConstrucao ? `${e.anoConstrucao}` : "Ano não informado", e.pavimentos ? `${e.pavimentos} pavimentos` : "pavimentos não informados", `${formatarNumero(e.unidades)} unidades`].join(" · "),
      leitura: e.anoConstrucao ? `${anoAtual - e.anoConstrucao} anos de construção (ano corrigido mais comum no IPTU).` : null,
      atencao: null,
      detalhes: [e.padrao ? `Padrão de construção no IPTU: ${e.padrao}.` : "Padrão de construção não informado no IPTU.", `${e.tipologias.length === 1 ? "1 tamanho de unidade" : `${e.tipologias.length} tamanhos de unidade`} no cadastro.`],
      fonte: "IPTU 2026 (unidades, ano, padrão) e base de Lotes/ESIG (pavimentos), Prefeitura do Recife, ODbL",
      pergunta: null,
    }
    : { id: "escala", rotulo: "Escala e idade", valor: "Confirme o prédio", leitura: null, atencao: null, detalhes: ["Sem o prédio confirmado no cadastro, ano, pavimentos e unidades ficam em aberto."], fonte: "IPTU 2026", pergunta: null };

  // 2. Registros estruturais (caderno).
  const est = estruturaDoCaderno(a.caderno);
  const estrutura: ItemDaFicha = {
    id: "estrutura", rotulo: "Registros estruturais",
    valor: est.atos.length ? `${est.atos.length === 1 ? "1 ato documentado" : `${est.atos.length} atos documentados`}` : "Nenhum ato documentado",
    leitura: est.frase,
    atencao: est.mostrarDesabamento ? "Há documento de desabamento ligado a este lote e bloco." : est.etapasComprovadas.includes("interdicao") ? "Há interdição documentada." : null,
    detalhes: [
      ...est.atos.map((t) => `${t.data ? dataBr(t.data) : "sem data"} · ${t.etapa === "laudo_art_rrt" ? "Laudo com ART/RRT" : t.etapa.charAt(0).toUpperCase() + t.etapa.slice(1)} · ${t.documento}${t.numero ? ` · nº ${t.numero}` : ""}`),
      est.checagemQueFalta,
      ...(est.descartados ? [`${pl(est.descartados, "registro", "registros")} do caderno sem vínculo confirmado com este imóvel ${est.descartados === 1 ? "ficou" : "ficaram"} de fora.`] : []),
    ],
    fonte: "Documentos e ocorrências que você guardou no caderno (laudos, ART/RRT, Diário Oficial)",
    pergunta: est.perguntaAoSindico,
  };

  // 3. ITBI no prédio.
  const preco = a.modalidade === "compra" && !a.declarados.preco.aConfirmar ? a.declarados.preco.valor : null;
  let itbi: ItemDaFicha;
  if (!e) itbi = { id: "itbi", rotulo: "ITBI no prédio", valor: "Confirme o prédio", leitura: null, atencao: null, detalhes: [], fonte: "ITBI 2016–2026, Prefeitura do Recife, ODbL", pergunta: null };
  else if (!e.itbi) itbi = { id: "itbi", rotulo: "ITBI no prédio", valor: "Nenhuma transmissão registrada", leitura: "O ITBI 2016–2026 não tem venda registrada neste endereço.", atencao: null, detalhes: [], fonte: "ITBI 2016–2026, Prefeitura do Recife, ODbL", pergunta: null };
  else {
    const q = e.itbi.valorUnidade;
    const dif = q && preco !== null ? (preco - q.mediana) / q.mediana : null;
    itbi = {
      id: "itbi", rotulo: "ITBI no prédio",
      valor: q ? `${formatarReais(q.p25)} a ${formatarReais(q.p75)} por unidade` : `${formatarNumero(e.itbi.transmissoes)} transmissões (${e.itbi.desde}–${e.itbi.ate})`,
      leitura: q
        ? dif !== null
          ? `Preço pedido ${formatarReais(preco!)}: ${dif >= 0 ? "+" : "−"}${Math.abs(Math.round(dif * 100))}% sobre a mediana fiscal (${formatarReais(q.mediana)}, ${q.n} avaliações em 36 meses).`
          : `Mediana fiscal ${formatarReais(q.mediana)} (${q.n} avaliações em 36 meses). Sem preço pedido para comparar.`
        : "Menos de 3 avaliações nos últimos 36 meses: sem faixa para comparar.",
      atencao: null,
      detalhes: [
        "É a avaliação da Prefeitura para cobrar o imposto (ITBI), não o preço de venda. É por unidade, de qualquer tamanho: o ITBI soma área comum e não traz a área privativa, então não dá R$/m² comparável ao anúncio.",
        `${formatarNumero(e.itbi.transmissoes)} transmissões de ${e.itbi.desde} a ${e.itbi.ate}: ${e.itbi.porAno.map(([ano, n]) => `${ano}: ${n}`).join(" · ")}.`,
      ],
      fonte: "ITBI 2016–2026 (valor de avaliação), Prefeitura do Recife, ODbL",
      pergunta: null,
    };
  }

  // 4. Condomínio por m² na amostra do caderno.
  const comp = compararCondominio(a, e?.anoConstrucao ?? null, x.lista, x.anoDe, anoAtual);
  let condominio: ItemDaFicha;
  if (comp.estado === "sem_valor") condominio = { id: "condominio", rotulo: "Condomínio/m²", valor: "A confirmar", leitura: "Falta o condomínio ou a área do anúncio para calcular por m².", atencao: null, detalhes: [], fonte: "Anúncio e suas análises", pergunta: "Qual o valor do condomínio e a área privativa da unidade?" };
  else if (comp.estado === "amostra_pequena") condominio = {
    id: "condominio", rotulo: "Condomínio/m²", valor: reaisM2(comp.valorM2),
    leitura: `${SEM_LEITURA} para comparar: há ${comp.n === 1 ? "1 anúncio" : `${comp.n} anúncios`} no seu caderno em ${x.nomeDoBairro}, mesma modalidade e prédio com idade parecida (±${FAIXA_DE_IDADE_ANOS} anos); precisa de ${AMOSTRA_MINIMA_DO_CONDOMINIO}.`,
    atencao: null, detalhes: ["Não existe base pública de condomínio por prédio no Recife: a comparação usa só a sua amostra."], fonte: "Anúncio; amostra: suas análises no caderno", pergunta: null,
  };
  else condominio = {
    id: "condominio", rotulo: "Condomínio/m²", valor: reaisM2(comp.valorM2),
    leitura: `Sua amostra (${comp.n} anúncios em ${x.nomeDoBairro}, prédios com ±${FAIXA_DE_IDADE_ANOS} anos de diferença): mediana ${reaisM2(comp.mediana)} ± ${reaisM2(comp.mad)} (MAD).`,
    atencao: comp.acima ? "Bem acima dos pares da sua amostra." : comp.abaixoEmPredioMaduro ? "Bem abaixo dos pares, num prédio de 25 a 45 anos: pode faltar fundo de reserva para obras grandes." : null,
    detalhes: [comp.desvio !== null ? `Distância da mediana em desvios robustos (1,4826 × MAD): ${comp.desvio.toFixed(1).replace(".", ",")}.` : "Os pares têm o mesmo valor por m²: sem dispersão para medir.", "Não existe base pública de condomínio por prédio no Recife: a comparação usa só a sua amostra."],
    fonte: "Anúncio; amostra: suas análises no caderno",
    pergunta: comp.abaixoEmPredioMaduro ? "Quanto há no fundo de reserva? Há obra grande prevista (fachada, elevador, impermeabilização) ou chamada extra aprovada?" : comp.acima ? "O que o condomínio inclui (funcionários, segurança, lazer)? Há chamada extra embutida?" : null,
  };

  // 5. Clima e entorno.
  const detalhesClima: string[] = [];
  const partes: string[] = [];
  if (x.calor) {
    partes.push(x.calor.diferencaBairroC !== null ? `${x.calor.diferencaBairroC > 0 ? "+" : ""}${x.calor.diferencaBairroC.toFixed(1).replace(".", ",")} °C vs. bairro` : `${x.calor.tempQuadraC.toFixed(1).replace(".", ",")} °C`);
    detalhesClima.push(`Superfície da quadra ${x.calor.tempQuadraC.toFixed(1).replace(".", ",")} °C no satélite (Landsat 8/9, 100 m, 4 cenas de 2023 a 2025 com pouca nuvem, passagem de manhã): temperatura do chão e dos telhados, não do ar.`);
  } else detalhesClima.push(`Calor de superfície (Landsat 100 m): ${SEM_LEITURA}.`);
  if (x.relevo?.altitudeM != null) {
    partes.push(`cota ${x.relevo.altitudeM.toFixed(1).replace(".", ",")} m`);
    detalhesClima.push(`Cota ~${x.relevo.altitudeM.toFixed(1).replace(".", ",")} m no Copernicus DEM (30 m, superfície com prédios e árvores)${x.relevo.diferencaEntornoM !== null ? `, ${Math.abs(x.relevo.diferencaEntornoM).toFixed(1).replace(".", ",")} m ${x.relevo.diferencaEntornoM < 0 ? "abaixo" : "acima"} da média em volta` : ""}. Terreno sem prédios (MDT 1 m do PE3D): ${SEM_LEITURA}.`);
  }
  if (x.relevo?.cursoDaguaMaisProximo) {
    partes.push(`${x.relevo.cursoDaguaMaisProximo.nome} a ${x.relevo.cursoDaguaMaisProximo.distanciaM} m`);
    detalhesClima.push(`${x.relevo.cursoDaguaMaisProximo.nome} a ${x.relevo.cursoDaguaMaisProximo.distanciaM} m em linha reta (hidrografia ESIG).`);
  }
  if (x.rua?.defesaCivil) detalhesClima.push(`Defesa Civil: ${pl(x.rua.defesaCivil.atendimentos, "atendimento", "atendimentos")} na ${x.rua.defesaCivil.rua} (${x.rua.defesaCivil.anos}). A publicação não traz o número do imóvel.`);
  detalhesClima.push(`Potencial construtivo do lote vizinho (LPUOS, coeficiente máximo e outorga onerosa): ${SEM_LEITURA}.`);
  const clima: ItemDaFicha = {
    id: "clima", rotulo: "Clima e entorno",
    valor: partes.length ? partes.join(" · ") : SEM_LEITURA,
    leitura: x.rua?.defesaCivil ? `Defesa Civil registrou ${pl(x.rua.defesaCivil.atendimentos, "atendimento", "atendimentos")} nesta rua (${x.rua.defesaCivil.anos}).` : null,
    atencao: null,
    detalhes: detalhesClima,
    fonte: "Landsat 8/9 (USGS), Copernicus DEM (CC-BY 4.0), ESIG e Defesa Civil do Recife (ODbL)",
    pergunta: x.relevo?.cursoDaguaMaisProximo && x.relevo.cursoDaguaMaisProximo.distanciaM <= 300 ? "A rua ou a garagem já acumularam água em chuva forte com maré alta? Até que altura?" : null,
  };

  return [escala, estrutura, itbi, condominio, clima];
}

// ——— A ficha montada a partir do dossiê (camadas ambientais e índice já em memória) ————————————————————

/** Ano de construção do prédio confirmado de outra análise (só bairros já abertos; senão null). */
export function anoDoPredioDaAnalise(x: AnaliseV2): number | null {
  if (x.vinculo.estado !== "confirmado" || !eCoberto(x.bairro)) return null;
  try {
    return edificioPorId(x.vinculo.edificioId, x.bairro)?.anoConstrucao ?? null;
  } catch {
    return null;
  }
}

export type FichaDoDossie = {
  itens: ItemDaFicha[];
  calor: EntradaDaFicha["calor"];
  relevo: EntradaDaFicha["relevo"];
  /** Destaque das fontes de barulho de dia × noite (corredor, LUSE), ou null. */
  ruido: string | null;
};

export function fichaDoDossie(x: { analise: AnaliseV2; predio: Edificio | null; lista: readonly AnaliseV2[]; visao: Pick<VisaoDoDossie, "rua" | "especificacoes">; nomeDoBairro: string; agora: Date }): FichaDoDossie {
  let calor: EntradaDaFicha["calor"] = null;
  let relevo: EntradaDaFicha["relevo"] = null;
  let ruido: string | null = null;
  try {
    if (x.predio) {
      calor = lerTemperaturaSuperficie100m(x.predio.centro, x.analise.bairro);
      relevo = lerRelevoECanalProximo(x.predio.centro);
    }
    ruido = derivarSintesesInteligentes({ slugBairro: x.analise.bairro, edificio: x.predio, ruaDoBairro: null, andar: x.visao.especificacoes.andar }).ruidoDiaNoite?.medidaDestaque ?? null;
  } catch {
    // Camada ambiental que não abriu: "Sem leitura", nunca 0.
  }
  const itens = fichaViva({ analise: x.analise, predio: x.predio, lista: x.lista, anoDe: anoDoPredioDaAnalise, agora: x.agora, calor, relevo, rua: x.visao.rua ?? null, nomeDoBairro: x.nomeDoBairro });
  return { itens, calor, relevo, ruido };
}
