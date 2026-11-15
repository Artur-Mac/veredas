// Leitor de ata (AGO/AGE), convenção e balancete (15/11/2026), no padrão "trecho literal + página". A pessoa cola o texto
// (ou escolhe um .txt); o leitor só ORGANIZA: cada achado é uma frase copiada do documento, sem paráfrase, com a página
// quando o texto traz marca de página ("Página 3", "Pág. 3", "- 3 -", "3/12" sozinho na linha, ou quebra de página).
// Três seções: regras da casa; fatos financeiros e jurídicos citados; perguntas prontas (inclusive sobre o que o
// documento NÃO cita). Não interpreta, não conclui e não salva nada sozinho. Ver também `proporBalancete`.

export type TipoDeDocumento = "ata" | "convencao" | "balancete";
export type SecaoDoLeitor = "regras" | "financeiro" | "perguntas";
export type TemaDoAchado =
  | "animais" | "temporada" | "obras" | "vagas" | "mudanca" | "silencio"
  | "chamada_extra" | "fundo_de_reserva" | "inadimplencia" | "acoes" | "seguro" | "obra_aprovada" | "valores";
export type AchadoDaAta = { secao: Exclude<SecaoDoLeitor, "perguntas">; tema: TemaDoAchado; trecho: string; pagina: number | null };
export type LeituraDaAta = { achados: AchadoDaAta[]; perguntas: string[]; paginas: number; caracteres: number };

export const ROTULO_DO_TEMA: Record<TemaDoAchado, string> = {
  animais: "Animais", temporada: "Aluguel por temporada (Airbnb)", obras: "Obras e reformas nas unidades", vagas: "Vagas e garagem",
  mudanca: "Mudança", silencio: "Horário de silêncio", chamada_extra: "Chamada extra / rateio", fundo_de_reserva: "Fundo de reserva",
  inadimplencia: "Inadimplência", acoes: "Ações judiciais", seguro: "Seguro e sinistros", obra_aprovada: "Obra do condomínio aprovada", valores: "Valores citados",
};

const REGRAS: [TemaDoAchado, AchadoDaAta["secao"], RegExp][] = [
  ["animais", "regras", /\b(animais?|pets?|cachorros?|c[aã]es|gatos?)\b/i],
  ["temporada", "regras", /\b(airbnb|temporada|curta (?:dura[cç][aã]o|perman[eê]ncia)|hospedage[mn]s?|loca[cç][aã]o por dia)\b/i],
  ["mudanca", "regras", /\bmudan[cç]as?\b/i],
  ["silencio", "regras", /\b(sil[eê]ncio|barulhos?|ru[ií]dos?|som alto)\b/i],
  ["vagas", "regras", /\b(vagas?|garage[mn]s?|estacionamento)\b/i],
  ["obras", "regras", /\b(reformas?|obras? (?:nas|na|em) unidades?|hor[aá]rio de obras?)\b/i],
  ["chamada_extra", "financeiro", /\b(chamadas? extras?|cotas? extras?|taxas? extras?|rateios?)\b/i],
  ["fundo_de_reserva", "financeiro", /\bfundo de reserva\b/i],
  ["inadimplencia", "financeiro", /\b(inadimpl[eê]ncia|inadimplentes?|em atraso|devedores?)\b/i],
  ["acoes", "financeiro", /\b(a[cç][aã]o (?:judicial|trabalhista|de cobran[cç]a)|processos? (?:judicial|n[ºo°])|execu[cç][aã]o|reclama[cç][aã]o trabalhista|TRT)\b/i],
  ["seguro", "financeiro", /\b(seguros?|sinistros?|ap[oó]lice)\b/i],
  ["obra_aprovada", "financeiro", /\b(aprova(?:d[ao]s?|[cç][aã]o) (?:d[aoe] )?(?:obra|reforma|pintura|impermeabiliza[cç][aã]o|fachada|elevador))|\b(?:obra|reforma|pintura|impermeabiliza[cç][aã]o) (?:da |de )?(?:fachada|elevadores?|telhado|coberta)\b/i],
  ["valores", "financeiro", /R\$\s*\d/],
];

const MARCA_DE_PAGINA = /^\s*(?:p[aá]g(?:ina)?\.?\s*(\d{1,4})(?:\s*(?:de|\/)\s*\d{1,4})?|-\s*(\d{1,4})\s*-|(\d{1,4})\s*\/\s*\d{1,4})\s*$/i;
export const LIMITE_DO_TEXTO = 200_000;

/**
 * Frases com a página de cada uma. Quebra de página (\f) avança a página. Marca de página escrita no texto: se a primeira
 * marca vem antes de qualquer frase, as marcas são cabeçalho (o que vem DEPOIS de "Página 3" é da página 3); senão, são
 * rodapé (o que vem ANTES de "Página 3" é da página 3, e o resto depois da última marca, da seguinte).
 */
export function frasesComPagina(texto: string): { frase: string; pagina: number | null }[] {
  const limitado = texto.slice(0, LIMITE_DO_TEXTO);
  const paginas = limitado.split("\f");
  if (paginas.length > 1) {
    return paginas.flatMap((pg, i) => frasesDe(pg).map((frase) => ({ frase, pagina: i + 1 })));
  }
  const linhas = limitado.split(/\r?\n/);
  const primeiraMarca = linhas.findIndex((l) => MARCA_DE_PAGINA.test(l));
  if (primeiraMarca < 0) return frasesDe(limitado).map((frase) => ({ frase, pagina: null }));
  const cabecalho = frasesDe(linhas.slice(0, primeiraMarca).join("\n")).length === 0;
  const out: { frase: string; pagina: number | null }[] = [];
  let pendentes: string[] = [];
  let atual: number | null = null;
  for (const linha of linhas) {
    const m = MARCA_DE_PAGINA.exec(linha);
    if (m) {
      const n = Number(m[1] ?? m[2] ?? m[3]);
      if (cabecalho) atual = n;
      else { out.push(...pendentes.map((frase) => ({ frase, pagina: n }))); pendentes = []; atual = n + 1; }
      continue;
    }
    for (const frase of frasesDe(linha)) {
      if (cabecalho) out.push({ frase, pagina: atual });
      else pendentes.push(frase);
    }
  }
  out.push(...pendentes.map((frase) => ({ frase, pagina: atual })));
  return out;
}

/** Frases de um trecho (sem lookbehind, para motores JS mais antigos); descarta pedaços com menos de 12 caracteres. */
function frasesDe(t: string): string[] {
  return t.split(/\r?\n/).flatMap((linha) => linha.replace(/([.;!?])\s+/g, "$1\u0000").split("\u0000")).map((x) => x.trim()).filter((x) => x.length >= 12);
}

const corte = (t: string) => (t.length > 400 ? `${t.slice(0, 397)}…` : t);

export function lerAta(texto: string, tipo: TipoDeDocumento): LeituraDaAta {
  const frases = frasesComPagina(texto);
  const achados: AchadoDaAta[] = [];
  const vistos = new Set<string>();
  for (const { frase, pagina } of frases) {
    for (const [tema, secao, re] of REGRAS) {
      if (!re.test(frase)) continue;
      // "Valores citados" só quando a frase não caiu em nenhum tema financeiro mais específico.
      if (tema === "valores" && achados.some((a) => a.trecho === corte(frase) && a.secao === "financeiro")) continue;
      const chave = `${tema}|${frase}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      achados.push({ secao, tema, trecho: corte(frase), pagina });
    }
  }
  const tem = (t: TemaDoAchado) => achados.some((a) => a.tema === t);
  const pg = (t: TemaDoAchado) => { const a = achados.find((x) => x.tema === t); return a?.pagina ? ` (p. ${a.pagina})` : ""; };
  const nome = tipo === "ata" ? "a ata" : tipo === "convencao" ? "a convenção" : "o balancete";
  const perguntas: string[] = [];
  if (tem("chamada_extra")) perguntas.push(`${nome.charAt(0).toUpperCase()}${nome.slice(1)} cita chamada extra ou rateio${pg("chamada_extra")}: quanto falta pagar, por quantos meses, e quem paga (vendedor ou comprador)?`);
  if (tem("obra_aprovada")) perguntas.push(`Há obra do condomínio aprovada${pg("obra_aprovada")}: qual o orçamento, o prazo e como será paga?`);
  if (tem("acoes")) perguntas.push(`Há ação judicial citada${pg("acoes")}: qual o número do processo, a fase e o valor em discussão?`);
  if (tem("inadimplencia")) perguntas.push(`Há inadimplência citada${pg("inadimplencia")}: qual o percentual hoje e quanto isso pesa no caixa?`);
  if (!tem("fundo_de_reserva")) perguntas.push(`${nome.charAt(0).toUpperCase()}${nome.slice(1)} não cita fundo de reserva: qual o saldo hoje e quanto entra por mês?`);
  if (tipo !== "balancete" && !tem("temporada")) perguntas.push("O documento não fala de aluguel por temporada (Airbnb): é permitido? Há regra aprovada em assembleia?");
  if (tipo !== "balancete" && !tem("animais")) perguntas.push("O documento não fala de animais: há regra sobre animais de estimação nas áreas comuns?");
  if (!tem("seguro")) perguntas.push("O seguro obrigatório do prédio está em dia? Qual a vigência da apólice?");
  return { achados, perguntas, paginas: Math.max(1, ...frases.map((f) => f.pagina ?? 1)), caracteres: Math.min(texto.length, LIMITE_DO_TEXTO) };
}
