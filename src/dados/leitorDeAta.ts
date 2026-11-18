// Leitor de ata (AGO/AGE), convenção e balancete (15/11/2026), no padrão "trecho literal + página". A pessoa cola o texto
// (ou escolhe um .txt); o leitor só ORGANIZA: cada achado é uma frase copiada do documento, sem paráfrase, com a página
// quando o texto traz marca de página ("Página 3", "Pág. 3", "- 3 -", "3/12" sozinho na linha, ou quebra de página).
// Três seções: regras da casa; fatos financeiros e jurídicos citados; perguntas prontas (inclusive sobre o que o
// documento NÃO cita). Não interpreta, não conclui e não salva nada sozinho. Ver também `proporBalancete`.

export type TipoDeDocumento = "ata" | "convencao" | "balancete" | "matricula";
export type SecaoDoLeitor = "regras" | "financeiro" | "perguntas";
export type TemaDoAchado =
  | "animais" | "temporada" | "obras" | "vagas" | "mudanca" | "silencio"
  | "chamada_extra" | "fundo_de_reserva" | "inadimplencia" | "acoes" | "seguro" | "obra_aprovada" | "valores"
  | "deficit_orcamentario" | "troca_administradora"
  | "gravames" | "restricoes_matricula" | "situacao_onus" | "regime_spu" | "proprietario_fracao" | "historico_transacoes";
export type AchadoDaAta = { secao: Exclude<SecaoDoLeitor, "perguntas">; tema: TemaDoAchado; trecho: string; pagina: number | null };
export type AusenciaDoDocumento = { tema: TemaDoAchado; rotulo: string; ondeConfirmar: string };
export type LeituraDaAta = { achados: AchadoDaAta[]; perguntas: string[]; ausentesEsperados: AusenciaDoDocumento[]; paginas: number; caracteres: number };

export const ROTULO_DO_TEMA: Record<TemaDoAchado, string> = {
  animais: "Animais", temporada: "Aluguel por temporada (Airbnb)", obras: "Obras e reformas nas unidades", vagas: "Vagas e garagem",
  mudanca: "Mudança", silencio: "Horário de silêncio", chamada_extra: "Chamada extra / rateio", fundo_de_reserva: "Fundo de reserva",
  inadimplencia: "Inadimplência", acoes: "Ações judiciais", seguro: "Seguro e sinistros", obra_aprovada: "Obra do condomínio aprovada", valores: "Valores citados",
  deficit_orcamentario: "Déficit no caixa", troca_administradora: "Troca de administradora",
  gravames: "Gravames e garantias", restricoes_matricula: "Restrições e usufruto", situacao_onus: "Situação de ônus",
  regime_spu: "Terreno de marinha (SPU)", proprietario_fracao: "Proprietário e fração ideal", historico_transacoes: "Registro e averbações",
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
  ["deficit_orcamentario", "financeiro", /\b(d[eé]ficits?|saldos? negativos?|despesas? superaram as receitas?)\b/i],
  ["troca_administradora", "financeiro", /\b(troca|substitui[cç][aã]o|destitui[cç][aã]o|nova) (?:de |da )?administradora\b/i],
  ["acoes", "financeiro", /\b(a[cç][aã]o (?:judicial|trabalhista|de cobran[cç]a)|processos? (?:judicial|n[ºo°])|execu[cç][aã]o|reclama[cç][aã]o trabalhista|TRT)\b/i],
  ["seguro", "financeiro", /\b(seguros?|sinistros?|ap[oó]lice)\b/i],
  ["obra_aprovada", "financeiro", /\b(aprova(?:d[ao]s?|[cç][aã]o) (?:d[aoe] )?(?:obra|reforma|pintura|impermeabiliza[cç][aã]o|fachada|elevador))|\b(?:obra|reforma|pintura|impermeabiliza[cç][aã]o) (?:da |de )?(?:fachada|elevadores?|telhado|coberta)\b/i],
  ["valores", "financeiro", /R\$\s*\d/],
];

const REGRAS_MATRICULA: [TemaDoAchado, AchadoDaAta["secao"], RegExp][] = [
  ["gravames", "financeiro", /\b(penhoras?|hipotecas?|aliena[cç][aã]o fiduci[aá]ria|arrestos?|indisponibilidades?|bloqueios?)\b/i],
  ["restricoes_matricula", "regras", /\b(usufrutos?|inalienabilidades?|impenhorabilidades?|incomunicabilidades?|cl[aá]usulas? restritivas?|servid[aã]o)\b/i],
  ["situacao_onus", "financeiro", /\b(nada consta|livre e desembara[cç]ad[oa]|sem [oô]nus|[oô]nus reais|certid[aã]o positiva|certid[aã]o negativa)\b/i],
  ["regime_spu", "financeiro", /\b(terrenos? de marinha|regime de ocupa[cç][aã]o|aforamentos?|foros?\b|laud[eê]mios?|RIP\b|SPU\b|dom[ií]nio [uú]til)\b/i],
  ["proprietario_fracao", "regras", /\b(propriet[aá]ri[oa]s?|adquirentes?|fra[cç][aã]o ideal)\b/i],
  ["historico_transacoes", "financeiro", /\b(compra e venda|doa[cç][aã]o|averba[cç][aã]o|AV-\d+|R-\d+|carta de arremata[cç][aã]o|formal de partilha)\b/i],
  ["acoes", "financeiro", /\b(a[cç][aã]o (?:judicial|trabalhista|de cobran[cç]a)|processos? (?:judicial|n[ºo°])|execu[cç][aã]o)\b/i],
  ["valores", "financeiro", /R\$\s*\d/],
];

const ESPERADOS_POR_TIPO: Record<TipoDeDocumento, readonly [TemaDoAchado, string][]> = {
  ata: [
    ["fundo_de_reserva", "Balancete mensal ou prestação de contas"],
    ["chamada_extra", "Atas dos últimos 24 meses e cota atualizada"],
    ["inadimplencia", "Demonstrativo de receita e inadimplência"],
    ["obra_aprovada", "Atas recentes e cronograma de manutenção"],
    ["acoes", "Certidão de ações e relatório da administradora"],
    ["seguro", "Apólice vigente com o síndico"],
  ],
  convencao: [
    ["animais", "Regimento interno ou atas de assembleia"],
    ["temporada", "Regimento interno e atas sobre locação por temporada"],
    ["obras", "Regimento interno (horários e exigência de ART/RRT)"],
    ["vagas", "Quadro de frações ou regimento da garagem"],
    ["silencio", "Regimento interno do condomínio"],
  ],
  balancete: [
    ["fundo_de_reserva", "Demonstrativo de saldo bancário e aplicações"],
    ["inadimplencia", "Relatório de rateio e inadimplência com a administradora"],
    ["deficit_orcamentario", "Demonstrativo completo do mês e previsão orçamentária"],
    ["chamada_extra", "Folha de cobrança e atas que aprovaram rateios"],
  ],
  matricula: [
    ["situacao_onus", "Certidão de inteiro teor e ônus reais emitida há menos de 30 dias"],
    ["gravames", "Certidão de ônus reais e histórico completo de registros (R-)"],
    ["proprietario_fracao", "Quadro de qualificação do proprietário e fração ideal"],
    ["regime_spu", "Certidão da SPU / RIP para confirmar se há terreno de marinha"],
  ],
};

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
  const regrasAtivas = tipo === "matricula" ? REGRAS_MATRICULA : REGRAS;
  for (const { frase, pagina } of frases) {
    for (const [tema, secao, re] of regrasAtivas) {
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
  const ausentesEsperados: AusenciaDoDocumento[] = ESPERADOS_POR_TIPO[tipo]
    .filter(([tema]) => !tem(tema))
    .map(([tema, ondeConfirmar]) => ({ tema, rotulo: ROTULO_DO_TEMA[tema], ondeConfirmar }));

  const perguntas: string[] = [];
  if (tipo === "matricula") {
    if (tem("gravames")) perguntas.push(`Há gravame ou garantia citada na matrícula${pg("gravames")}: qual o saldo atualizado e como será feita a quitação ou baixa antes da escritura?`);
    if (tem("restricoes_matricula")) perguntas.push(`Há cláusula restritiva ou usufruto citado na matrícula${pg("restricoes_matricula")}: quem precisa assinar a anuência ou baixa?`);
    if (tem("regime_spu")) perguntas.push(`A matrícula cita terreno de marinha / SPU${pg("regime_spu")}: o regime é aforamento ou ocupação (impacta FGTS), o foro/taxa está em dia e o vendedor emitirá a CAT?`);
    if (tem("acoes")) perguntas.push(`Há ação ou execução citada na matrícula${pg("acoes")}: qual o processo e o risco de fraude à execução?`);
    if (!tem("situacao_onus")) perguntas.push("Este trecho não mostra a certidão atual de ônus reais: foi emitida há menos de 30 dias em cartório?");
    if (!tem("regime_spu")) perguntas.push("Confira se na abertura da matrícula ou no registro do terreno há menção a terreno de marinha (SPU) ou patrimônio público.");
  } else {
    const nome = tipo === "ata" ? "a ata" : tipo === "convencao" ? "a convenção" : "o balancete";
    if (tem("chamada_extra")) perguntas.push(`${nome.charAt(0).toUpperCase()}${nome.slice(1)} cita chamada extra ou rateio${pg("chamada_extra")}: quanto falta pagar, por quantos meses, e quem paga (vendedor ou comprador)?`);
    if (tem("obra_aprovada")) perguntas.push(`Há obra do condomínio aprovada${pg("obra_aprovada")}: qual o orçamento, o prazo e como será paga?`);
    if (tem("acoes")) perguntas.push(`Há ação judicial citada${pg("acoes")}: qual o número do processo, a fase e o valor em discussão?`);
    if (tem("inadimplencia")) perguntas.push(`Há inadimplência citada${pg("inadimplencia")}: qual o percentual hoje e quanto isso pesa no caixa?`);
    if (tem("deficit_orcamentario")) perguntas.push(`${nome.charAt(0).toUpperCase()}${nome.slice(1)} cita déficit ou saldo negativo${pg("deficit_orcamentario")}: como o condomínio pretende recompor o caixa neste ano?`);
    if (tem("troca_administradora")) perguntas.push(`Há troca de administradora citada${pg("troca_administradora")}: qual foi o motivo e a entrega dos balancetes anteriores está em dia?`);
    if (!tem("fundo_de_reserva")) perguntas.push(`${nome.charAt(0).toUpperCase()}${nome.slice(1)} não cita fundo de reserva: qual o saldo hoje e quanto entra por mês?`);
    if (tipo !== "balancete" && !tem("temporada")) perguntas.push("O documento não fala de aluguel por temporada (Airbnb): é permitido? Há regra aprovada em assembleia?");
    if (tipo !== "balancete" && !tem("animais")) perguntas.push("O documento não fala de animais: há regra sobre animais de estimação nas áreas comuns?");
    if (!tem("seguro")) perguntas.push("O seguro obrigatório do prédio está em dia? Qual a vigência da apólice?");
  }
  return { achados, perguntas, ausentesEsperados, paginas: Math.max(1, ...frases.map((f) => f.pagina ?? 1)), caracteres: Math.min(texto.length, LIMITE_DO_TEXTO) };
}
