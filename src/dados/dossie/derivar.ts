// Derivação do dossiê (Fatia 4). Pura: recebe a análise, o edifício do índice e o contexto do bairro e
// devolve a VisaoDoDossie. Sem relógio, sem rede, sem armazenamento. O custo vem de ../custos; nenhuma
// soma de parcelas é refeita aqui. Valor desconhecido nunca vira zero: vira null, "A confirmar" ou pergunta.
import type {
  Achado,
  AnaliseV2,
  Anomalia,
  ChaveDeFonte,
  ContextoDoBairro,
  Edificio,
  Fato,
  Obra,
  ObrasProximas,
  Pergunta,
  Posicao,
  Prioridade,
  Quartis,
  Tipologia,
  VisaoDoDossie,
} from "../contratos";
import { tituloDaAnomalia } from "../anomalias";
import { custoMensal } from "../custos";
import { formatarNumero, formatarReais } from "../formatos";
import { bairroPorSlug, eCoberto } from "../recife/bairros";
import { formatarChaveCadastral, formatarEndereco } from "../recife/endereco";

type TipologiaDoPredio = Edificio["tipologias"][number];
type CampoDeCusto = "iptu" | "condominio";

const A_CONFIRMAR = "A confirmar";
/** Tolerância da Fatia 3 para "mesma área": o maior entre 1,5 m² e 3% da área do anúncio. */
const TOLERANCIA_AREA_M2 = 1.5;
const TOLERANCIA_AREA_RELATIVA = 0.03;
/** Diferença mínima entre o IPTU do anúncio e o do cadastro para mostrar "IPTU não confere". */
const LIMITE_IPTU_NAO_CONFERE = 0.2;
/** A área do anúncio só "não confere" acima destes dois limites ao mesmo tempo. */
const LIMITE_AREA_NAO_CONFERE_M2 = 5;
const LIMITE_AREA_NAO_CONFERE_RELATIVO = 0.1;
const ANO_DE_CORTE_ESTRUTURA = 2005;
const MAX_ACHADOS_DE_APOIO = 3;
/** Prédio de tipologia única: todas as áreas das tipologias a até 3% da mediana delas. */
const LIMITE_TIPOLOGIA_UNICA = 0.03;
/** Como a posição de compra nomeia a referência: a mediana de `itbi.valorUnidade` (36 meses). */
const REFERENCIA_DO_ITBI = "mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses)";

// ——— Utilidades ———————————————————————————————————————————————————————————————————

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e"]);

/** "RUA TELES JUNIOR" -> "Rua Teles Junior". */
function caixaDeTitulo(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((palavra, i) => (i > 0 && PARTICULAS.has(palavra) ? palavra : palavra.charAt(0).toUpperCase() + palavra.slice(1)))
    .join(" ");
}

/** 98 -> "98"; 98,5 -> "98,5"; 84,79 -> "84,79". */
function formatarArea(area: number): string {
  const arredondada = Math.round(area * 100) / 100;
  return Number.isInteger(arredondada) ? formatarNumero(arredondada) : formatarNumero(arredondada, 2).replace(/0$/, "");
}

function arredondar(valor: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

function plural(n: number, singular: string, pluralizado: string): string {
  return `${n} ${n === 1 ? singular : pluralizado}`;
}

/** Quartis com interpolação linear (o padrão do numpy), como o índice. */
function quartisDe(valores: number[]): Quartis | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((x, y) => x - y);
  const em = (p: number) => {
    const pos = (v.length - 1) * p;
    const baixo = Math.floor(pos);
    const a = v[baixo] ?? 0;
    const b = v[baixo + 1] ?? a;
    return a + (b - a) * (pos - baixo);
  };
  return { n: v.length, p25: arredondar(em(0.25)), mediana: arredondar(em(0.5)), p75: arredondar(em(0.75)) };
}

/**
 * Valor declarado que entra em conta: ausente ou "a confirmar" não entra. Vale também para a área: com `aConfirmar` ela
 * não serve para casar tipologia (nem IPTU por tipologia, nem "Área não confere", nem "Área das unidades mais parecidas");
 * quem aparece é o achado da anomalia da área.
 */
function conhecido(d: { valor: number | null; aConfirmar: boolean }): number | null {
  return d.aConfirmar ? null : d.valor;
}

function precoPorM2(a: AnaliseV2): number | null {
  const preco = conhecido(a.declarados.preco);
  const area = conhecido(a.declarados.area);
  return preco !== null && area !== null && area > 0 ? preco / area : null;
}

function tipologiaMaisProxima(e: Edificio, area: number): TipologiaDoPredio | null {
  let melhor: TipologiaDoPredio | null = null;
  for (const t of e.tipologias) {
    if (melhor === null || Math.abs(t.area - area) < Math.abs(melhor.area - area)) melhor = t;
  }
  return melhor;
}

function mesmaArea(areaDoCadastro: number, areaDoAnuncio: number): boolean {
  const tolerancia = Math.max(TOLERANCIA_AREA_M2, TOLERANCIA_AREA_RELATIVA * areaDoAnuncio);
  return Math.abs(areaDoCadastro - areaDoAnuncio) <= tolerancia + 1e-9;
}

const DEMONSTRATIVO: Record<Tipologia, string> = {
  apartamento: "deste apartamento",
  casa: "desta casa",
  flat: "deste flat",
  kitnet: "desta kitnet",
  cobertura: "desta cobertura",
  outro: "deste imóvel",
};

// ——— Posição (barra bala) —————————————————————————————————————————————————————————

/** Mediana de uma lista não vazia, sem interpolar além dos dois valores centrais. */
function medianaDe(valores: number[]): number {
  const v = [...valores].sort((x, y) => x - y);
  const meio = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? (v[meio] ?? 0) : ((v[meio - 1] ?? 0) + (v[meio] ?? 0)) / 2;
}

/**
 * Prédio de tipologia única: todas as áreas das tipologias ficam a até 3% da mediana delas. Só nele o valor de uma
 * unidade do ITBI vale como referência para o preço de uma unidade anunciada: a `area_construida` do ITBI inclui área
 * comum e não serve para comparar R$/m² com a área privativa do anúncio.
 */
export function tipologiaUnica(e: Edificio): boolean {
  if (e.tipologias.length === 0) return false;
  const mediana = medianaDe(e.tipologias.map((t) => t.area));
  return e.tipologias.every((t) => Math.abs(t.area - mediana) <= mediana * LIMITE_TIPOLOGIA_UNICA + 1e-9);
}

function montarPosicao(
  rotulo: string,
  valor: number,
  referencia: Quartis,
  nomeDaReferencia: string,
  unidade: Posicao["unidade"],
  fonte: Posicao["fonte"],
): Posicao | null {
  if (!(referencia.mediana > 0)) return null;
  const diferenca = (valor / referencia.mediana - 1) * 100;
  const naMediana = Math.abs(diferenca) < 1;
  const n = Math.round(Math.abs(diferenca));
  const frase = naMediana ? `Na ${nomeDaReferencia}` : `${n}% ${diferenca > 0 ? "acima" : "abaixo"} da ${nomeDaReferencia}`;
  return {
    rotulo,
    valor: arredondar(valor),
    referencia,
    unidade,
    deltaPercentual: naMediana ? 0 : Math.round(diferenca),
    frase,
    fonte,
  };
}

/**
 * Compra: o preço anunciado contra as avaliações fiscais por unidade (ITBI, 36 meses), só em prédio de tipologia única
 * e com `valorUnidade`. Sem isso, não há posição. Aluguel: R$/m² contra as análises da própria pessoa.
 */
function posicaoDe(a: AnaliseV2, porM2: number | null, predio: Edificio | null, outras: AnaliseV2[]): Posicao | null {
  if (a.modalidade === "compra") {
    const preco = conhecido(a.declarados.preco);
    const referencia = predio?.itbi?.valorUnidade ?? null;
    if (preco === null || predio === null || referencia === null || !tipologiaUnica(predio)) return null;
    return montarPosicao("Preço anunciado", preco, referencia, REFERENCIA_DO_ITBI, "R$", "itbi");
  }
  if (porM2 === null || a.bairro === null) return null;
  const comparaveis = outras
    .filter((o) => o.id !== a.id && o.modalidade === "aluguel" && o.bairro === a.bairro)
    .map(precoPorM2)
    .filter((v): v is number => v !== null);
  if (comparaveis.length < 3) return null;
  const referencia = quartisDe(comparaveis);
  if (referencia === null) return null;
  const nomeDoBairro = bairroPorSlug(a.bairro)?.nome ?? a.bairroTexto;
  return montarPosicao("Aluguel por m²", porM2, referencia, `mediana das suas análises em ${nomeDoBairro}`, "R$/m²", "suas_analises");
}

// ——— Anomalias de custo ———————————————————————————————————————————————————————————

type AnomaliaDeCusto = { campo: CampoDeCusto; anomalia: Anomalia };

/** Quando duas anomalias atingem o mesmo campo, vale a primeira desta lista. */
const PRECEDENCIA_DAS_ANOMALIAS: Anomalia["tipo"][] = [
  "valor_simbolico", "valor_repetido", "periodo_desconhecido", "incoerente", "valor_atipico",
];

function campoDeCusto(anomalia: Anomalia): CampoDeCusto | null {
  return anomalia.campo === "iptu" || anomalia.campo === "condominio" ? anomalia.campo : null;
}

/** Uma anomalia lida do anúncio deixa de valer quando a pessoa já corrigiu o valor. */
function anomaliaVigente(anomalia: Anomalia, campo: CampoDeCusto, d: AnaliseV2["declarados"]): boolean {
  const declarado = campo === "iptu" ? d.iptu : d.condominio;
  if (anomalia.tipo === "periodo_desconhecido") return campo === "iptu" && d.iptu.valor !== null && d.iptu.periodo === "desconhecido";
  if (declarado.valor !== null && declarado.origem === "voce" && !declarado.aConfirmar) return false;
  if (anomalia.tipo === "valor_repetido") return d.iptu.valor !== null && d.iptu.valor === d.condominio.valor;
  return true;
}

function anomaliasDeCusto(a: AnaliseV2): AnomaliaDeCusto[] {
  const lidas = a.extracao?.anomalias ?? [];
  const resultado: AnomaliaDeCusto[] = [];
  for (const campo of ["iptu", "condominio"] as const) {
    for (const tipo of PRECEDENCIA_DAS_ANOMALIAS) {
      const anomalia = lidas.find((l) => campoDeCusto(l) === campo && l.tipo === tipo);
      if (anomalia && descricaoDaAnomalia(a, campo, anomalia) && anomaliaVigente(anomalia, campo, a.declarados)) {
        resultado.push({ campo, anomalia });
        break;
      }
    }
  }
  return resultado;
}

/** O título do achado vem de `tituloDaAnomalia` (src/dados/anomalias.ts); aqui só ficam pista, texto e mensagem. */
type DescricaoDaAnomalia = {
  pista: string;
  texto: string;
  mensagem: string;
  unidadeDaMedida: string;
  /** "R$ 288" ou null quando o anúncio não traz valor. */
  valor: string | null;
};

/** Valor do anúncio como texto: o declarado; sem ele, o valor lido, se vier no formato "R$ 5". */
function valorDoAnuncio(a: AnaliseV2, campo: CampoDeCusto, anomalia: Anomalia): string | null {
  const declarado = campo === "iptu" ? a.declarados.iptu : a.declarados.condominio;
  if (declarado.valor !== null) return formatarReais(declarado.valor);
  return anomalia.valorLido !== null && /^R\$\s?[\d.,]+$/.test(anomalia.valorLido) ? anomalia.valorLido : null;
}

function areaDoAnuncio(a: AnaliseV2): number | null {
  return conhecido(a.declarados.area) ?? a.extracao?.campos.area ?? null;
}

function descricaoDaAnomalia(a: AnaliseV2, campo: CampoDeCusto, anomalia: Anomalia): DescricaoDaAnomalia | null {
  const valor = valorDoAnuncio(a, campo, anomalia);
  const nome = campo === "iptu" ? "IPTU" : "condomínio";
  const informa = valor ? `O anúncio informa ${valor} de ${nome}` : `O anúncio traz um valor de ${nome}`;
  const base = { valor, unidadeDaMedida: "no anúncio" };
  const fachada = "Valor do anúncio parece de fachada";
  switch (anomalia.tipo) {
    case "valor_simbolico":
      return {
        ...base, pista: fachada,
        texto: `${informa}, valor simbólico. Fica fora da soma até você confirmar.`,
        mensagem: `${informa}. Qual é o valor correto?`,
      };
    case "valor_repetido": {
      const outro = campo === "iptu" ? "condomínio" : "IPTU";
      return {
        ...base, pista: fachada,
        texto: `${informa}, o mesmo valor do ${outro}. Confirme os dois.`,
        mensagem: `${informa}, o mesmo valor do ${outro}. Qual é o valor correto de cada um?`,
      };
    }
    case "periodo_desconhecido":
      if (campo !== "iptu") return null;
      return {
        ...base, unidadeDaMedida: "sem periodicidade", pista: "Anúncio sem periodicidade",
        texto: `${informa}, sem dizer se é por mês ou por ano. Fica fora da soma até você confirmar.`,
        mensagem: `${informa}, sem dizer se é por mês ou por ano. Qual é o valor mensal?`,
      };
    case "incoerente":
      return {
        ...base, pista: "Valores diferentes no anúncio",
        texto: `O link e o texto colado trazem valores diferentes de ${nome}. Confirme o valor.`,
        mensagem: `O anúncio traz valores diferentes de ${nome}. Qual é o valor correto?`,
      };
    case "valor_atipico": {
      if (campo !== "condominio") return null;
      const area = areaDoAnuncio(a);
      const paraArea = area !== null ? `para ${formatarArea(area)} m²` : "para a área";
      return {
        ...base, pista: `Abaixo do comum ${paraArea}`,
        texto: `${informa} ${paraArea}, abaixo do comum. Confirme o valor e se há cota extra.`,
        mensagem: `${informa} ${paraArea}. Esse valor está certo, e há cota extra?`,
      };
    }
    default:
      return null;
  }
}

// ——— Anomalia da área ——————————————————————————————————————————————————————————————

const ID_DA_PERGUNTA_DA_ANOMALIA_DE_AREA = "anomalia-area";

/**
 * Anomalia da leitura que deixa a área a confirmar. Só vale enquanto a área está marcada `aConfirmar`: o formulário a
 * liga quando a leitura traz anomalia na área, e desliga quando a pessoa digita outro valor. Com a marca desligada a área
 * entra em conta como qualquer outra e não há achado. Quando a leitura traz mais de uma anomalia, vale a primeira da
 * precedência; sem nenhuma na lista, a primeira lida.
 */
function anomaliaDeArea(a: AnaliseV2): Anomalia | null {
  const lidas = (a.extracao?.anomalias ?? []).filter((l) => l.campo === "area");
  if (lidas.length === 0 || !a.declarados.area.aConfirmar) return null;
  for (const tipo of PRECEDENCIA_DAS_ANOMALIAS) {
    const achada = lidas.find((l) => l.tipo === tipo);
    if (achada) return achada;
  }
  return lidas[0] ?? null;
}

type DescricaoDaAnomaliaDeArea = { pergunta: string; pista: string; texto: string; mensagem: string };

function descricaoDaAnomaliaDeArea(a: AnaliseV2, anomalia: Anomalia): DescricaoDaAnomaliaDeArea {
  // O valor que o anúncio traz, quando traz um: a área lida, mesmo a confirmar (ela só não entra em conta nenhuma).
  const lida = a.declarados.area.valor ?? a.extracao?.campos.area ?? null;
  const fora = "Fica fora da comparação com o cadastro e do preço por m² até você confirmar.";
  switch (anomalia.tipo) {
    case "incoerente":
      return {
        pergunta: lida !== null ? `Área de ${formatarArea(lida)} m² está certa?` : "Qual é a área do imóvel?",
        pista: "Valores diferentes no anúncio",
        texto: `O link e o texto colado trazem áreas diferentes. ${fora}`,
        mensagem: "O anúncio traz áreas diferentes. Qual é a área privativa do imóvel?",
      };
    case "nao_informado":
      return {
        pergunta: "Qual é a área do imóvel?",
        pista: "Não informado no anúncio",
        texto: `O anúncio não informa a área. ${fora}`,
        mensagem: "O anúncio não informa a área. Qual é a área privativa do imóvel?",
      };
    default:
      return {
        pergunta: lida !== null ? `Área de ${formatarArea(lida)} m² está certa?` : "Qual é a área do imóvel?",
        pista: "Valor a confirmar",
        texto: `O anúncio traz um valor de área que precisa de confirmação. ${fora}`,
        mensagem: "Qual é a área privativa do imóvel?",
      };
  }
}

/** O título vem de `tituloDaAnomalia`, como o das anomalias de custo; só a pergunta e o texto são daqui. */
function achadoDaAnomaliaDeArea(a: AnaliseV2, anomalia: Anomalia): Achado {
  const d = descricaoDaAnomaliaDeArea(a, anomalia);
  return {
    id: "ach-anomalia-area",
    tipo: "anomalia",
    titulo: tituloDaAnomalia(anomalia),
    medida: null,
    texto: d.texto,
    confianca: "declarado",
    fonte: "anuncio",
    perguntaId: ID_DA_PERGUNTA_DA_ANOMALIA_DE_AREA,
  };
}

// ——— Achados ——————————————————————————————————————————————————————————————————————

const ID_DA_PERGUNTA_DA_ANOMALIA: Record<CampoDeCusto, string> = { iptu: "anomalia-iptu", condominio: "anomalia-condominio" };

function achadoDaAnomalia(a: AnaliseV2, { campo, anomalia }: AnomaliaDeCusto): Achado | null {
  const d = descricaoDaAnomalia(a, campo, anomalia);
  if (d === null) return null;
  return {
    id: `ach-anomalia-${campo}`,
    tipo: "anomalia",
    titulo: tituloDaAnomalia(anomalia),
    medida: d.valor ? { numero: d.valor, unidade: d.unidadeDaMedida } : null,
    texto: d.texto,
    confianca: "declarado",
    fonte: "anuncio",
    perguntaId: ID_DA_PERGUNTA_DA_ANOMALIA[campo],
  };
}

function achadoDeIptu(a: AnaliseV2, predio: Edificio, iptuMensalDeclarado: number | null): Achado | null {
  const area = conhecido(a.declarados.area);
  if (area === null) return null;
  const tipologia = tipologiaMaisProxima(predio, area);
  if (tipologia === null || !mesmaArea(tipologia.area, area)) return null;
  // Mediana nula ou zero não é IPTU do apartamento: isenção é do contribuinte, não da unidade. Sem achado.
  const iptuAnualDoCadastro = tipologia.iptuAnualMediano;
  if (iptuAnualDoCadastro === null || !(iptuAnualDoCadastro > 0)) return null;
  const cadastro = iptuAnualDoCadastro / 12;
  const amostra = `${plural(tipologia.unidades, "unidade", "unidades")} de ${formatarArea(tipologia.area)} m² neste prédio · IPTU 2026`;
  if (iptuMensalDeclarado === null) {
    return {
      id: "ach-iptu", tipo: "iptu", titulo: "IPTU no cadastro",
      medida: { numero: formatarReais(cadastro), unidade: "/mês" },
      texto: `Mediana de ${amostra}`,
      confianca: "oficial", fonte: "iptu_2026", perguntaId: null,
    };
  }
  if (Math.abs(iptuMensalDeclarado - cadastro) / cadastro <= LIMITE_IPTU_NAO_CONFERE) return null;
  return {
    id: "ach-iptu", tipo: "iptu", titulo: "IPTU não confere",
    medida: { numero: `${formatarReais(iptuMensalDeclarado)} × ${formatarReais(cadastro)}`, unidade: "/mês" },
    texto: `O anúncio informa ${formatarReais(iptuMensalDeclarado)} por mês. Mediana de ${amostra}: ${formatarReais(cadastro)} por mês.`,
    confianca: "oficial", fonte: "iptu_2026", perguntaId: null,
  };
}

function achadoDeArea(a: AnaliseV2, predio: Edificio): Achado | null {
  const area = conhecido(a.declarados.area);
  if (area === null) return null;
  const tipologia = tipologiaMaisProxima(predio, area);
  if (tipologia === null) return null;
  const diferenca = Math.abs(area - tipologia.area);
  if (!(diferenca > LIMITE_AREA_NAO_CONFERE_M2 && diferenca / tipologia.area > LIMITE_AREA_NAO_CONFERE_RELATIVO)) return null;
  return {
    id: "ach-area", tipo: "area", titulo: "Área não confere",
    medida: { numero: `${formatarArea(area)} × ${formatarArea(tipologia.area)}`, unidade: "m²" },
    texto: `O anúncio informa ${formatarArea(area)} m²; a tipologia mais próxima no cadastro tem ${formatarArea(tipologia.area)} m². Confira a área privativa na matrícula.`,
    confianca: "inferencia", fonte: "iptu_2026", perguntaId: "achado-area",
  };
}

function achadoDeEstrutura(predio: Edificio): Achado | null {
  const ate4 = predio.ate4Pavimentos === true || (predio.pavimentos !== null && predio.pavimentos <= 4);
  const antigo = predio.anoConstrucao !== null && predio.anoConstrucao < ANO_DE_CORTE_ESTRUTURA;
  const padrao = predio.padrao !== null && ["simples", "medio"].includes(semAcento(predio.padrao));
  if (!(ate4 && antigo && padrao)) return null;
  return {
    id: "ach-estrutura", tipo: "estrutura", titulo: "3 sinais no cadastro", medida: null,
    texto: `Até 4 pavimentos, construído antes de ${ANO_DE_CORTE_ESTRUTURA}, padrão ${predio.padrao}. Confirme o sistema estrutural e peça o laudo.`,
    confianca: "inferencia", fonte: "iptu_2026", perguntaId: "achado-estrutura",
  };
}

function achadoDeObras(predio: Edificio): Achado | null {
  // Só `relevantes24m`: `licencasDeObra` inclui habite-se e reforma pequena e nunca é número de destaque.
  const { relevantes24m, demolicoes24m } = predio.obras150m;
  if (relevantes24m < 1) return null;
  const demolicoes = demolicoes24m > 0 ? ` · ${plural(demolicoes24m, "demolição", "demolições")}` : "";
  return {
    id: "ach-obras", tipo: "obras", titulo: "Obras na vizinhança",
    medida: { numero: String(relevantes24m), unidade: relevantes24m === 1 ? "obra licenciada perto" : "obras licenciadas perto" },
    texto: `Construção, acréscimo ou demolição a até 150 m nos últimos 24 meses${demolicoes}`,
    confianca: "oficial", fonte: "licenciamento", perguntaId: "achado-obras",
  };
}

/** "Na mediana…" vira "na mediana…" para entrar no meio de uma frase; "12% acima…" fica como está. */
function noMeioDaFrase(frase: string): string {
  return frase.charAt(0).toLowerCase() + frase.slice(1);
}

/** Só existe com a posição fiscal da compra: prédio de tipologia única, com avaliações por unidade nos 36 meses. */
function achadoDeItbi(a: AnaliseV2, posicao: Posicao | null): Achado | null {
  if (a.modalidade !== "compra" || posicao === null || posicao.fonte !== "itbi") return null;
  const delta = posicao.deltaPercentual;
  return {
    id: "ach-itbi", tipo: "itbi", titulo: "Preço × avaliação fiscal",
    medida: delta === 0 ? null : { numero: `${Math.abs(delta)}%`, unidade: delta > 0 ? "acima da mediana fiscal" : "abaixo da mediana fiscal" },
    texto: `Preço anunciado de ${formatarReais(posicao.valor)}: ${noMeioDaFrase(posicao.frase)}. Avaliação fiscal não é preço de mercado.`,
    confianca: "oficial", fonte: "itbi", perguntaId: null,
  };
}

/** Todos os achados, na ordem de prioridade da ordem do arquiteto (o primeiro é o principal). */
function achadosDe(
  a: AnaliseV2,
  predio: Edificio | null,
  anomalias: AnomaliaDeCusto[],
  iptuMensalDeclarado: number | null,
  posicao: Posicao | null,
): Achado[] {
  const anomaliaDaArea = anomaliaDeArea(a);
  const lista: (Achado | null)[] = [
    ...anomalias.map((an) => achadoDaAnomalia(a, an)),
    anomaliaDaArea ? achadoDaAnomaliaDeArea(a, anomaliaDaArea) : null,
    predio ? achadoDeIptu(a, predio, iptuMensalDeclarado) : null,
    predio ? achadoDeArea(a, predio) : null,
    predio ? achadoDeEstrutura(predio) : null,
    predio ? achadoDeObras(predio) : null,
    achadoDeItbi(a, posicao),
  ];
  return lista.filter((x): x is Achado => x !== null);
}

// ——— Perguntas ————————————————————————————————————————————————————————————————————

/** A pergunta de endereço fica sempre em primeiro; a prioridade escolhida vem depois; o resto mantém a ordem. */
export function ordenarPerguntas(perguntas: Pergunta[], prioridade: Prioridade | null): Pergunta[] {
  const peso = (p: Pergunta) => (p.id === "lacuna-endereco" ? 0 : prioridade !== null && p.prioridade === prioridade ? 1 : 2);
  return perguntas
    .map((pergunta, posicao) => ({ pergunta, posicao }))
    .sort((x, y) => peso(x.pergunta) - peso(y.pergunta) || x.posicao - y.posicao)
    .map((x) => x.pergunta);
}

function perguntasDe(
  a: AnaliseV2,
  predio: Edificio | null,
  anomalias: AnomaliaDeCusto[],
  achados: Achado[],
  custo: VisaoDoDossie["custo"],
): Pergunta[] {
  const lista: Pergunta[] = [];
  const d = a.declarados;
  const deste = DEMONSTRATIVO[a.tipologia ?? "outro"];
  const tem = (id: string) => achados.some((x) => x.id === id);

  // Só se pergunta o endereço quando falta rua ou número: com os dois já na análise não há o que perguntar.
  const faltaRuaOuNumero = !a.logradouro?.trim() || !a.numero?.trim();
  if (eCoberto(a.bairro) && a.vinculo.estado !== "confirmado" && faltaRuaOuNumero) {
    lista.push({
      id: "lacuna-endereco", titulo: "Qual é o endereço completo?", pista: "Para conferir o cadastro do prédio",
      textoParaMensagem: "Qual é o endereço completo do imóvel, com rua e número?", origem: "lacuna", prioridade: "documentos",
    });
  }

  const pistaDaLacuna = (valor: number | null) => (valor === null ? "Não informado no anúncio" : "Valor a confirmar");
  if (d.preco.valor === null || d.preco.aConfirmar) {
    const aluguel = a.modalidade === "aluguel";
    lista.push({
      id: "lacuna-preco", titulo: aluguel ? "Qual é o valor do aluguel?" : "Qual é o preço de venda?", pista: pistaDaLacuna(d.preco.valor),
      textoParaMensagem: aluguel ? "Qual é o valor mensal do aluguel?" : "Qual é o preço de venda do imóvel?", origem: "lacuna", prioridade: "custo",
    });
  }
  const comAnomalia = (campo: CampoDeCusto) => anomalias.some((an) => an.campo === campo);
  const parcela = (nome: string) => custo.parcelas.find((p) => p.nome === nome);
  if (!comAnomalia("condominio") && parcela("Condomínio")?.estado !== "conhecido") {
    lista.push({
      id: "lacuna-condominio", titulo: "Qual é o condomínio e há cota extra?", pista: pistaDaLacuna(d.condominio.valor),
      textoParaMensagem: "Qual é o valor do condomínio e há alguma cota extra prevista?", origem: "lacuna", prioridade: "custo",
    });
  }
  if (!comAnomalia("iptu") && parcela("IPTU")?.estado !== "conhecido") {
    const semPeriodicidade = d.iptu.valor !== null && d.iptu.periodo === "desconhecido";
    lista.push({
      id: "lacuna-iptu", titulo: `Qual é o IPTU ${deste}?`, pista: semPeriodicidade ? "Anúncio sem periodicidade" : pistaDaLacuna(d.iptu.valor),
      textoParaMensagem: `Qual é o valor do IPTU ${deste}, por mês ou por ano?`, origem: "lacuna", prioridade: "custo",
    });
  }

  if (a.modalidade === "aluguel" && parcela("Seguro incêndio")?.estado !== "conhecido") {
    const informado = d.seguroIncendio.valor;
    lista.push({
      id: "lacuna-seguro", titulo: "Há seguro incêndio? Quanto custa?", pista: pistaDaLacuna(informado),
      textoParaMensagem: informado === null
        ? "Há seguro incêndio no contrato de aluguel? Qual é o valor mensal?"
        : `Qual é o valor mensal do seguro incêndio? O anúncio informa ${formatarReais(informado)}.`,
      origem: "lacuna", prioridade: "custo",
    });
  }
  // Taxa de serviço e Outros só aparecem no custo quando o anúncio os informa; só perguntamos se estão a confirmar.
  if (parcela("Taxa de serviço")?.estado === "a_confirmar" && d.taxaServico.valor !== null) {
    lista.push({
      id: "lacuna-taxa-servico", titulo: "Qual é a taxa de serviço?", pista: pistaDaLacuna(d.taxaServico.valor),
      textoParaMensagem: `O anúncio informa ${formatarReais(d.taxaServico.valor)} de taxa de serviço. Qual é o valor correto e o que ela cobre?`,
      origem: "lacuna", prioridade: "custo",
    });
  }
  if (parcela("Outros")?.estado === "a_confirmar" && d.outros.valor !== null) {
    lista.push({
      id: "lacuna-outros", titulo: "O que são os outros custos?", pista: pistaDaLacuna(d.outros.valor),
      textoParaMensagem: `O anúncio informa ${formatarReais(d.outros.valor)} de outros custos mensais. Do que se trata e qual é o valor correto?`,
      origem: "lacuna", prioridade: "custo",
    });
  }

  for (const { campo, anomalia } of anomalias) {
    const descricao = descricaoDaAnomalia(a, campo, anomalia);
    if (descricao === null) continue;
    const por = campo === "iptu" && d.iptu.periodo === "ano" ? "por ano" : "por mês";
    const titulo = campo === "iptu"
      ? descricao.valor ? `${descricao.valor} de IPTU ${por}?` : "O IPTU do anúncio está certo?"
      : descricao.valor ? `Condomínio de ${descricao.valor} está certo?` : "O condomínio do anúncio está certo?";
    lista.push({
      id: ID_DA_PERGUNTA_DA_ANOMALIA[campo], titulo, pista: descricao.pista,
      textoParaMensagem: descricao.mensagem, origem: "anomalia", prioridade: "custo",
    });
  }

  const anomaliaDaArea = tem("ach-anomalia-area") ? anomaliaDeArea(a) : null;
  if (anomaliaDaArea) {
    const descricao = descricaoDaAnomaliaDeArea(a, anomaliaDaArea);
    lista.push({
      id: ID_DA_PERGUNTA_DA_ANOMALIA_DE_AREA, titulo: descricao.pergunta, pista: descricao.pista,
      textoParaMensagem: descricao.mensagem, origem: "anomalia", prioridade: "documentos",
    });
  }

  if (tem("ach-estrutura")) {
    lista.push({
      id: "achado-estrutura", titulo: "Qual é o sistema estrutural?", pista: "3 sinais no cadastro",
      textoParaMensagem: "Qual é o sistema estrutural do prédio e há laudo disponível?", origem: "achado", prioridade: "documentos",
    });
  }
  if (tem("ach-area")) {
    const area = conhecido(d.area);
    const proxima = predio && area !== null ? tipologiaMaisProxima(predio, area) : null;
    lista.push({
      id: "achado-area", titulo: "Qual é a área privativa na matrícula?",
      pista: area !== null && proxima ? `${formatarArea(area)} × ${formatarArea(proxima.area)} m²` : "Anúncio × cadastro",
      textoParaMensagem: "Qual é a área privativa do imóvel na matrícula?", origem: "achado", prioridade: "documentos",
    });
  }
  if (tem("ach-obras") && predio) {
    const n = predio.obras150m.relevantes24m;
    lista.push({
      id: "achado-obras", titulo: "As obras próximas afetam a rotina?",
      pista: `${n} ${n === 1 ? "obra licenciada" : "obras licenciadas"} a 150 m`,
      textoParaMensagem: "Há obras próximas ao prédio que afetem a rotina dos moradores?", origem: "achado", prioridade: "conforto",
    });
  }

  lista.push(
    {
      id: "padrao-documentos", titulo: "Há cota extra ou obra aprovada?", pista: "Peça atas e balancetes",
      textoParaMensagem: "Há cota extra ou obra aprovada no condomínio? Pode enviar as últimas atas e balancetes?", origem: "padrao", prioridade: "documentos",
    },
    {
      id: "padrao-agua", titulo: "Como é a pressão da água?", pista: "Teste torneiras e chuveiro",
      textoParaMensagem: "Como é a pressão da água? Posso testar torneiras e chuveiro na visita?", origem: "padrao", prioridade: "conforto",
    },
    {
      id: "padrao-ruido", titulo: "Como é o ruído com a janela aberta?", pista: "Ouça na visita",
      textoParaMensagem: "Como é o ruído do entorno com a janela aberta?", origem: "padrao", prioridade: "conforto",
    },
    {
      id: "padrao-sol", titulo: "O sol chega às janelas?", pista: "Anote a orientação na visita",
      textoParaMensagem: "Para onde as janelas principais estão voltadas e o sol chega a elas?", origem: "padrao", prioridade: "conforto",
    },
  );

  for (const propria of a.visita.perguntasProprias) {
    lista.push({
      id: propria.id, titulo: propria.texto, pista: "Sua pergunta",
      textoParaMensagem: propria.texto, origem: "propria", prioridade: "conforto",
    });
  }

  const vistos = new Set<string>();
  return lista.filter((p) => (vistos.has(p.id) ? false : (vistos.add(p.id), true)));
}

// ——— Cadastro e histórico ————————————————————————————————————————————————————————

function desconhecido(id: string, rotulo: string): Fato {
  return { id, rotulo, valor: A_CONFIRMAR, confianca: "nao_sabemos", fonte: null, detalhe: "Não consta no cadastro" };
}

function oficial(id: string, rotulo: string, valor: string, fonte: ChaveDeFonte, detalhe: string | null = null): Fato {
  return { id, rotulo, valor, confianca: "oficial", fonte, detalhe };
}

/**
 * "IPTU 2026 no prédio": faixa central (1º a 3º quartil) do IPTU anual das unidades, em valor mensal. É o fato
 * curto do topo do dossiê. Sem faixa quando há menos de 2 unidades com valor ou quando o limite inferior não
 * chega a R$ 1 por mês: zero no cadastro é isenção de quem paga, não valor do apartamento, e não vira "R$ 0".
 */
function faixaDeIptu(predio: Edificio): Fato | null {
  const q = predio.iptuAnual;
  if (q === null || q.n < 2) return null;
  const baixo = Math.round(q.p25 / 12);
  const alto = Math.round(q.p75 / 12);
  if (!(baixo >= 1) || alto < baixo) return null;
  const valor = baixo === alto ? `${formatarReais(baixo)}/mês` : `${formatarReais(baixo)}–${formatarReais(alto)}/mês`;
  return oficial("iptu-faixa", "IPTU 2026 no prédio", valor, "iptu_2026", `Metade central das ${q.n} unidades residenciais do prédio`);
}

function cadastroDe(a: AnaliseV2, predio: Edificio): Fato[] {
  const fatos: Fato[] = [];
  if (predio.nome) fatos.push(oficial("cadastro-nome", "Nome do edifício", predio.nome, "lotes"));

  fatos.push(
    predio.anoConstrucao !== null
      ? oficial("cadastro-ano", "Ano de construção", String(predio.anoConstrucao), "iptu_2026", "Mais frequente entre as unidades do prédio")
      : desconhecido("cadastro-ano", "Ano de construção"),
  );

  if (predio.pavimentos !== null) {
    fatos.push(oficial("cadastro-pavimentos", "Pavimentos", String(predio.pavimentos), "lotes"));
  } else if (predio.ate4Pavimentos !== null) {
    fatos.push({
      id: "cadastro-pavimentos", rotulo: "Pavimentos", valor: predio.ate4Pavimentos ? "Até 4 pavimentos" : "Mais de 4 pavimentos",
      confianca: "inferencia", fonte: "iptu_2026", detalhe: "Pelo tipo de construção no IPTU",
    });
  } else {
    fatos.push(desconhecido("cadastro-pavimentos", "Pavimentos"));
  }

  fatos.push(oficial("cadastro-unidades", "Unidades residenciais", String(predio.unidades), "iptu_2026", "Registros de IPTU residenciais neste endereço"));

  const area = conhecido(a.declarados.area);
  const proxima = area !== null ? tipologiaMaisProxima(predio, area) : null;
  if (area !== null && proxima) {
    // Escolher a tipologia mais próxima da área do anúncio é uma inferência, não um dado do cadastro.
    fatos.push({
      id: "cadastro-area", rotulo: "Área das unidades mais parecidas", valor: `${formatarArea(proxima.area)} m²`,
      confianca: "inferencia", fonte: "iptu_2026",
      detalhe: `${plural(proxima.unidades, "unidade", "unidades")} de ${formatarArea(proxima.area)} m² neste prédio`,
    });
  } else if (predio.tipologias.length === 0) {
    fatos.push(desconhecido("cadastro-area", "Área no cadastro"));
  } else {
    const areas = predio.tipologias.map((t) => t.area);
    const menor = Math.min(...areas);
    const maior = Math.max(...areas);
    fatos.push(oficial(
      "cadastro-area", "Área no cadastro",
      menor === maior ? `${formatarArea(menor)} m²` : `${formatarArea(menor)} a ${formatarArea(maior)} m²`,
      "iptu_2026", plural(predio.tipologias.length, "tipologia", "tipologias") + " no prédio",
    ));
  }

  const faixa = faixaDeIptu(predio);
  if (faixa) fatos.push(faixa);

  fatos.push(
    predio.padrao
      ? oficial("cadastro-padrao", "Padrão", predio.padrao, "iptu_2026", "Mais frequente entre as unidades do prédio")
      : desconhecido("cadastro-padrao", "Padrão"),
  );
  const chave = formatarChaveCadastral(predio.dsqfl);
  fatos.push(chave ? oficial("cadastro-chave", "Chave cadastral", chave, "lotes") : desconhecido("cadastro-chave", "Chave cadastral"));
  return fatos;
}

function semPredio(a: AnaliseV2): Fato {
  const valor = !eCoberto(a.bairro)
    ? "Fora da área com cadastro"
    : a.vinculo.estado === "confirmado"
      ? "Prédio confirmado não encontrado no índice atual"
      : "Confirme o prédio para ver o cadastro";
  return { id: "cadastro-sem-predio", rotulo: "Prédio não confirmado", valor, confianca: "nao_sabemos", fonte: null, detalhe: null };
}

/**
 * Linha do tempo do prédio, do mais antigo ao mais recente: construção (IPTU), transmissões por ano (ITBI, `porAno`) e
 * demolições licenciadas a até 150 m. No mesmo ano, vale a ordem em que as fontes entram.
 */
function historicoDe(predio: Edificio, obras: ObrasProximas): VisaoDoDossie["historico"] {
  const itens: VisaoDoDossie["historico"] = [];
  if (predio.anoConstrucao !== null) itens.push({ quando: String(predio.anoConstrucao), texto: "Construção registrada no cadastro" });
  if (predio.itbi) {
    for (const [ano, transmissoes] of predio.itbi.porAno) {
      itens.push({ quando: String(ano), texto: plural(transmissoes, "transmissão", "transmissões") });
    }
  }
  for (const obra of obras.recentes) {
    if (obra.categoria === "demolicao") {
      itens.push({ quando: obra.data.slice(0, 4), texto: `Demolição licenciada a ${obra.distanciaM} m` });
    }
  }
  return itens
    .map((item, posicao) => ({ item, posicao }))
    .sort((x, y) => Number(x.item.quando) - Number(y.item.quando) || x.posicao - y.posicao)
    .map((x) => x.item);
}

function obrasProximas(predio: Edificio, obrasDoBairro: Obra[]): ObrasProximas {
  const { licencasDeObra, relevantes24m, demolicoes24m, recentes } = predio.obras150m;
  return {
    licencasDeObra,
    relevantes24m,
    demolicoes24m,
    recentes: recentes.flatMap(([indice, distanciaM]) => {
      const obra = obrasDoBairro[indice];
      return obra ? [{ ...obra, distanciaM }] : [];
    }),
  };
}

// ——— Derivação ————————————————————————————————————————————————————————————————————

function subtituloDe(a: AnaliseV2): string {
  const cidadeLida = a.extracao?.campos.cidade ?? null;
  const cidade = cidadeLida && cidadeLida !== "recife" ? caixaDeTitulo(cidadeLida.replace(/-/g, " ")) : "Recife";
  const bairro = bairroPorSlug(a.bairro)?.nome ?? (a.bairroTexto.trim() || null);
  return bairro ? `${bairro} · ${cidade}` : cidade;
}

/**
 * O endereço que o dossiê e a visita mostram, sempre por `formatarEndereco` ("EST DO ENCANAMENTO" vira "Estrada do
 * Encanamento"). Com prédio confirmado, vale o do edifício (logradouro e número do índice); sem ele, o que a análise
 * guarda; sem rua, nulo.
 */
export function enderecoDoImovel(a: Pick<AnaliseV2, "logradouro" | "numero">, predio: Pick<Edificio, "logradouro" | "numero"> | null): string | null {
  if (predio) return formatarEndereco(predio.logradouro, predio.numero);
  const rua = a.logradouro?.trim();
  if (!rua) return null;
  return formatarEndereco(rua, a.numero);
}

/**
 * `e` só vale com vínculo confirmado ao mesmo edifício. `contexto` (o do bairro) fica na assinatura para os
 * chamadores não mudarem, mas a derivação não o usa mais: a posição de compra vem do ITBI do próprio prédio.
 * `prioridade` é o filtro Custo / Conforto / Documentos da tela (não faz parte da análise); sem ela, as
 * perguntas saem na ordem da derivação, com a de endereço em primeiro. `agora` fica na assinatura para que
 * regras futuras dependentes de tempo não mudem os chamadores; hoje nenhuma regra o usa.
 */
export function derivarDossie(
  a: AnaliseV2,
  e: Edificio | null,
  contexto: ContextoDoBairro | null,
  obrasDoBairro: Obra[],
  outras: AnaliseV2[],
  agora: Date,
  prioridade: Prioridade | null = null,
): VisaoDoDossie {
  void agora;
  void contexto;
  const predio = a.vinculo.estado === "confirmado" && e !== null && e.id === a.vinculo.edificioId ? e : null;

  const c = custoMensal(a);
  const custo: VisaoDoDossie["custo"] = {
    principal: c.principal,
    totalMensalConhecido: c.totalMensalConhecido,
    alemDoPrincipal: c.alemDoPrincipal,
    parcelas: c.parcelas,
    notaForaDaSoma: c.notaForaDaSoma,
  };
  const iptu = c.parcelas.find((p) => p.nome === "IPTU");
  const iptuMensalDeclarado = iptu?.estado === "conhecido" ? iptu.valorMensal : null;

  const posicao = posicaoDe(a, c.principal.porM2, predio, outras);
  const anomalias = anomaliasDeCusto(a);
  const todos = achadosDe(a, predio, anomalias, iptuMensalDeclarado, posicao);
  const perguntas = ordenarPerguntas(perguntasDe(a, predio, anomalias, todos, custo), prioridade);
  const obras = predio ? obrasProximas(predio, obrasDoBairro) : null;

  const d = a.declarados;
  return {
    analiseId: a.id,
    titulo: a.nome,
    subtitulo: subtituloDe(a),
    endereco: enderecoDoImovel(a, predio),
    loteConfirmado: predio !== null,
    especificacoes: {
      area: conhecido(d.area),
      quartos: conhecido(d.quartos),
      banheiros: conhecido(d.banheiros),
      vagas: conhecido(d.vagas),
      andar: conhecido(d.andar),
    },
    custo,
    posicao,
    achados: { principal: todos[0] ?? null, apoio: todos.slice(1, 1 + MAX_ACHADOS_DE_APOIO) },
    perguntas,
    cadastro: predio ? cadastroDe(a, predio) : [semPredio(a)],
    historico: predio && obras ? historicoDe(predio, obras) : [],
    obras,
  };
}
