// Lógica pura da aba Visita (Fatia 5). Sem React, sem relógio, sem armazenamento: recebe a análise e devolve
// dados. As telas e o hook `useVisita` só chamam estas funções. Valor desconhecido nunca vira zero.
import type { AnaliseV2, ContextoDoBairro, Edificio, Obra, Pergunta, Visita } from "../../dados/contratos";
import { derivarDossie, enderecoDoImovel } from "../../dados/dossie/derivar";
import { eCoberto, bairroPorSlug } from "../../dados/recife/bairros";
import { contextoDoBairro, edificioPorId, indiceDoBairro } from "../../dados/recife/indice";
import type { Poligono } from "../mapa/geometria";

// ——— Limites do contrato (esquemaVisita) ————————————————————————————————————————

export const MAX_PERGUNTAS_PROPRIAS = 30;
export const MAX_TEXTO_DA_PERGUNTA = 240;
export const MAX_RESPOSTA = 1000;
export const MAX_NOTAS = 4000;
export const MAX_VERIFICADAS = 100;
export const MAX_SEGUNDOS = 604800;

// ——— Roteiro de perguntas ————————————————————————————————————————————————————————

/** O edifício do índice, só com vínculo confirmado. Índice ausente ou inválido: sem edifício, nunca um chute. */
export function predioDaAnalise(a: AnaliseV2): Edificio | null {
  if (a.vinculo.estado !== "confirmado" || !eCoberto(a.bairro)) return null;
  try {
    return edificioPorId(a.vinculo.edificioId, a.bairro);
  } catch {
    return null;
  }
}

/**
 * As perguntas da visita são as do dossiê, na mesma montagem da tela dele: edifício só com vínculo confirmado,
 * contexto e obras do índice do bairro. As perguntas próprias já vêm no fim (derivarDossie as acrescenta).
 */
export function perguntasDaVisita(a: AnaliseV2, todas: readonly AnaliseV2[], agora: Date): Pergunta[] {
  let predio: Edificio | null = null;
  let contexto: ContextoDoBairro | null = null;
  let obras: Obra[] = [];
  if (eCoberto(a.bairro)) {
    try {
      contexto = contextoDoBairro(a.bairro);
      obras = indiceDoBairro(a.bairro).obras;
      if (a.vinculo.estado === "confirmado") predio = edificioPorId(a.vinculo.edificioId, a.bairro);
    } catch {
      predio = null;
      contexto = null;
      obras = [];
    }
  }
  const outras = todas.filter((x) => x.id !== a.id && x.descarte === null);
  return derivarDossie(a, predio, contexto, obras, outras, agora).perguntas;
}

/** Contorno do lote no plano local (longitude reduzida pelo cosseno da latitude, norte para cima). */
export function poligonoDoLote(e: Edificio | null): Poligono | null {
  const pontos = e?.poligono;
  if (!pontos || pontos.length < 3) return null;
  const [, lat0 = 0] = pontos[0] ?? [0, 0];
  const fator = Math.cos((lat0 * Math.PI) / 180);
  return pontos.map(([lon, lat]) => [lon * fator, -lat]);
}

/** O mesmo endereço do dossiê: com prédio confirmado, o do edifício; sempre por `formatarEndereco`. */
export { enderecoDoImovel };

/** "Casa Forte · 98 m² · 3 quartos": só o que a pessoa ou o anúncio informaram. */
export function subtituloDoImovel(a: AnaliseV2): string {
  const bairro = bairroPorSlug(a.bairro)?.nome ?? (a.bairroTexto.trim() || null);
  const partes: string[] = [];
  if (bairro) partes.push(bairro);
  const { area, quartos } = a.declarados;
  if (area.valor !== null) partes.push(`${String(area.valor).replace(".", ",")} m²`);
  if (quartos.valor !== null) partes.push(`${quartos.valor} ${quartos.valor === 1 ? "quarto" : "quartos"}`);
  return partes.length > 0 ? partes.join(" · ") : "Recife";
}

// ——— Mensagem ao corretor ————————————————————————————————————————————————————————————

/** WhatsApp sem destinatário: a pessoa escolhe o contato e envia. O Vereda não envia nada. */
export function urlDoWhatsapp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

// ——— Edição da visita ————————————————————————————————————————————————————————————

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const MAX_SLUG = 28;

/** "Posso carregar um carro elétrico?" -> "posso-carregar-um-carro": palavras inteiras, até 28 caracteres. */
function slugCurto(texto: string): string {
  const base = semAcento(texto).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let slug = "";
  for (const palavra of base.split("-")) {
    const proximo = slug === "" ? palavra : `${slug}-${palavra}`;
    if (proximo.length > MAX_SLUG) break;
    slug = proximo;
  }
  // Uma primeira palavra maior que o limite é cortada.
  return slug || base.slice(0, MAX_SLUG) || "pergunta";
}

/** `propria-<slug curto>`, com `-2`, `-3`… quando o slug já existe. Cabe em /^propria-[a-z0-9-]{1,40}$/. */
export function idDaPropria(texto: string, existentes: readonly string[]): string {
  const base = `propria-${slugCurto(texto)}`;
  if (!existentes.includes(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidato = `${base}-${n}`;
    if (!existentes.includes(candidato)) return candidato;
  }
}

/** Acrescenta uma pergunta própria. `null` quando vazia, longa demais ou quando o limite de 30 foi atingido. */
export function adicionarPropria(v: Visita, texto: string): Visita | null {
  const limpo = texto.trim();
  if (limpo === "" || limpo.length > MAX_TEXTO_DA_PERGUNTA) return null;
  if (v.perguntasProprias.length >= MAX_PERGUNTAS_PROPRIAS) return null;
  const id = idDaPropria(limpo, v.perguntasProprias.map((p) => p.id));
  return { ...v, perguntasProprias: [...v.perguntasProprias, { id, texto: limpo }] };
}

/** Marca ou desmarca uma pergunta como conferida. */
export function alternarVerificada(v: Visita, id: string): Visita {
  if (v.verificadas.includes(id)) return { ...v, verificadas: v.verificadas.filter((x) => x !== id) };
  if (v.verificadas.length >= MAX_VERIFICADAS) return v;
  return { ...v, verificadas: [...v.verificadas, id] };
}

/** Guarda a resposta (vazia apaga) e marca ou desmarca a pergunta como conferida, numa gravação só. */
export function definirResposta(v: Visita, id: string, texto: string, conferida: boolean): Visita {
  const limpa = texto.trim().slice(0, MAX_RESPOSTA);
  const respostas = { ...v.respostas };
  if (limpa === "") delete respostas[id];
  else respostas[id] = limpa;
  const semEsta = v.verificadas.filter((x) => x !== id);
  const verificadas = conferida && semEsta.length < MAX_VERIFICADAS ? [...semEsta, id] : semEsta;
  return { ...v, respostas, verificadas };
}

// ——— Cronômetro ——————————————————————————————————————————————————————————————————

/** "05:07"; passando de uma hora, "1:05:07". */
export function formatarCronometro(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "45 s", "12 min 30 s", "1 h 05 min". */
export function duracaoPorExtenso(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  if (s < 60) return `${s} s`;
  const h = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${String(min).padStart(2, "0")} min`;
  return s % 60 === 0 ? `${min} min` : `${min} min ${s % 60} s`;
}

/** Segundos decorridos de um cronômetro em andamento: o que já estava somado mais o tempo desde `inicio`. */
export function segundosDoRelogio(relogio: { inicio: number; base: number }, agora: number): number {
  const decorrido = Math.max(0, Math.floor((agora - relogio.inicio) / 1000));
  return Math.min(MAX_SEGUNDOS, relogio.base + decorrido);
}

// ——— Orientação da janela ————————————————————————————————————————————————————————

export const ROTULOS_DA_ORIENTACAO = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"] as const;
const NOMES_DA_ORIENTACAO = ["Norte", "Nordeste", "Leste", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"] as const;
const DICAS_DA_ORIENTACAO = [
  "Observe a luz ao longo do dia.",
  "Observe o sol da manhã.",
  "Observe o sol da manhã.",
  "Observe o sol da manhã.",
  "Observe a luz ao longo do dia.",
  "Confira o sol da tarde.",
  "Confira o sol da tarde.",
  "Confira o sol da tarde.",
] as const;

export type OrientacaoDaJanela = { graus: number; rotulo: string; nome: string; dica: string };

/** Setores de 45° centrados nos pontos cardeais e colaterais: 338° a 22° é N, 23° a 67° é NE, e assim por diante. */
export function orientacaoDaJanela(graus: number): OrientacaoDaJanela {
  const g = ((Math.round(graus) % 360) + 360) % 360;
  const i = Math.round(g / 45) % 8;
  return {
    graus: g,
    rotulo: ROTULOS_DA_ORIENTACAO[i] ?? "N",
    nome: NOMES_DA_ORIENTACAO[i] ?? "Norte",
    dica: DICAS_DA_ORIENTACAO[i] ?? "",
  };
}

/** Limita ao intervalo do contrato: inteiro de 0 a 359. */
export function limitarGraus(graus: number): number {
  return Math.min(359, Math.max(0, Math.round(graus)));
}

// ——— Ruído ———————————————————————————————————————————————————————————————————————

export const OPCOES_DE_RUIDO = [
  { valor: "silencioso", nome: "Silencioso" },
  { valor: "moderado", nome: "Moderado" },
  { valor: "alto", nome: "Alto" },
] as const satisfies readonly { valor: NonNullable<Visita["ruido"]>; nome: string }[];

export function nomeDoRuido(ruido: Visita["ruido"]): string | null {
  return OPCOES_DE_RUIDO.find((o) => o.valor === ruido)?.nome ?? null;
}

// ——— Resumo ——————————————————————————————————————————————————————————————————————

export type ResumoDaVisita = {
  total: number;
  conferidas: Pergunta[];
  pendentes: Pergunta[];
  /** Respostas anotadas; as de perguntas que saíram do roteiro continuam aqui, com título genérico. */
  respostas: { id: string; titulo: string; texto: string }[];
  ruido: string | null;
  orientacao: OrientacaoDaJanela | null;
  notas: string;
  segundos: number;
};

export const TITULO_DA_PERGUNTA_ANTIGA = "Pergunta que saiu do roteiro";

/** O que a pessoa conferiu, respondeu e percebeu. Sem nota, sem veredito. */
export function resumirVisita(v: Visita, perguntas: readonly Pergunta[]): ResumoDaVisita {
  const feitas = new Set(v.verificadas);
  const conhecidas = new Set(perguntas.map((p) => p.id));
  const respostas = [
    ...perguntas.flatMap((p) => {
      const texto = v.respostas[p.id]?.trim();
      return texto ? [{ id: p.id, titulo: p.titulo, texto }] : [];
    }),
    ...Object.entries(v.respostas).flatMap(([id, texto]) =>
      !conhecidas.has(id) && texto.trim() !== "" ? [{ id, titulo: TITULO_DA_PERGUNTA_ANTIGA, texto: texto.trim() }] : [],
    ),
  ];
  return {
    total: perguntas.length,
    conferidas: perguntas.filter((p) => feitas.has(p.id)),
    pendentes: perguntas.filter((p) => !feitas.has(p.id)),
    respostas,
    ruido: nomeDoRuido(v.ruido),
    orientacao: v.orientacaoGraus === null ? null : orientacaoDaJanela(v.orientacaoGraus),
    notas: v.notas.trim(),
    segundos: v.segundos,
  };
}
