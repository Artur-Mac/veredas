// Montagem pura do formulário de revisão a partir da extração do anúncio (Fatia 2, C1, K1, K2).
// Nenhuma função aqui toca a tela, o relógio ou o armazenamento.
import { tituloDaAnomalia } from "./anomalias";
import type {
  AnaliseV2,
  Anomalia,
  ChaveDeCampo,
  Cobertura,
  Declarados,
  ExtracaoAnuncio,
  Modalidade,
  OrigemDoValor,
  Periodo,
  Portal,
  Tipologia,
} from "./contratos";
import { normalizarTexto, slugParaTitulo } from "./extrator/bairro";
import { formatarReais } from "./formatos";
import { BAIRROS_DO_RECIFE, bairroPorSlug, eCoberto } from "./recife/bairros";

/** Valor de `bairro` quando a pessoa escolhe "Fora do Recife". Nenhum slug oficial é igual a ele. */
export const FORA_DO_RECIFE = "fora-do-recife";

/** Como "Fora do Recife" aparece na tela: opção do seletor e pílula do cartão sem bairro nem texto. */
export const ROTULO_FORA_DO_RECIFE = "Fora do Recife";

/** Slug oficial que, escrito sozinho, nomeia a cidade; o bairro do centro antigo só casa pelos apelidos de `bairros.ts`. */
const SLUG_QUE_E_A_CIDADE = "recife";

/**
 * Campos que a pessoa pode mexer na revisão. Quem mexeu fica em `EstadoDoFormulario.editados` e nenhuma nova
 * leitura (página, texto colado) o sobrescreve. "A confirmar" de cada custo conta como campo à parte, para que
 * ligar a marca não impeça a leitura de preencher o valor.
 */
export const CAMPOS_EDITAVEIS = [
  "nome",
  "modalidade",
  "tipologia",
  "bairro",
  "logradouro",
  "numero",
  "nomeEdificio",
  "preco",
  "precoAConfirmar",
  "condominio",
  "condominioAConfirmar",
  "iptuValor",
  "iptuPeriodo",
  "iptuAConfirmar",
  "seguroIncendio",
  "seguroIncendioAConfirmar",
  "taxaServico",
  "taxaServicoAConfirmar",
  "outros",
  "outrosAConfirmar",
  "area",
  "quartos",
  "suites",
  "banheiros",
  "vagas",
  "andar",
] as const;

export type CampoEditavel = (typeof CAMPOS_EDITAVEIS)[number];
export type CamposEditados = Partial<Record<CampoEditavel, true>>;

/** Estado do `FormularioDeRevisao`: um campo por valor declarado, cada um com origem e, nos custos, "a confirmar". */
export interface EstadoDoFormulario {
  nome: string;
  modalidade: Modalidade;
  tipologia: Tipologia | null;
  /**
   * Bairro como foi lido ou escolhido, para mostrar e guardar na análise. Com um bairro do Recife escolhido é o nome
   * oficial; com "Fora do Recife", o que o anúncio trouxe (pode ser vazio).
   */
  bairroTexto: string;
  /** Escolha do seletor: slug oficial de `BAIRROS_DO_RECIFE`, `FORA_DO_RECIFE`, ou `null` (nada escolhido). */
  bairro: string | null;
  logradouro: string;
  numero: string;
  nomeEdificio: string;

  preco: number | null;
  precoAConfirmar: boolean;
  precoOrigem: OrigemDoValor;

  condominio: number | null;
  condominioAConfirmar: boolean;
  condominioOrigem: OrigemDoValor;

  iptuValor: number | null;
  iptuPeriodo: Periodo;
  iptuAConfirmar: boolean;
  iptuOrigem: OrigemDoValor;

  seguroIncendio: number | null;
  seguroIncendioAConfirmar: boolean;
  seguroIncendioOrigem: OrigemDoValor;

  taxaServico: number | null;
  taxaServicoAConfirmar: boolean;
  taxaServicoOrigem: OrigemDoValor;

  outros: number | null;
  outrosAConfirmar: boolean;
  outrosOrigem: OrigemDoValor;

  area: number | null;
  areaOrigem: OrigemDoValor;

  quartos: number | null;
  quartosOrigem: OrigemDoValor;

  suites: number | null;
  suitesOrigem: OrigemDoValor;

  banheiros: number | null;
  banheirosOrigem: OrigemDoValor;

  vagas: number | null;
  vagasOrigem: OrigemDoValor;

  andar: number | null;
  andarOrigem: OrigemDoValor;

  /** Campos que a pessoa mexeu (`{}` = nenhum). Quem grava é `editarFormulario`. */
  editados: CamposEditados;
}

// ——— Textos de portal e de bairro ——————————————————————————————————————————————

const NOME_DO_PORTAL: Record<Exclude<Portal, "outro">, string> = {
  zap: "ZAP Imóveis",
  vivareal: "VivaReal",
  quintoandar: "QuintoAndar",
  olx: "OLX",
};

/** Nome do portal como a marca escreve. Para `outro` não existe nome de marca: devolve "outro site". */
export function nomeDoPortal(portal: Portal): string {
  return portal === "outro" ? "outro site" : NOME_DO_PORTAL[portal];
}

/** Título do cartão de leitura quando ainda não se leu nada que sirva de nome. */
export function tituloPadraoDoAnuncio(portal: Portal): string {
  return portal === "outro" ? "Anúncio de outro site" : `Anúncio do ${NOME_DO_PORTAL[portal]}`;
}

/** Bairro para exibição: nome oficial quando o slug é do Recife; senão o texto lido (slug vira Título). */
export function nomeDoBairro(slug: string | null, texto: string | null): string | null {
  const oficial = bairroPorSlug(slug)?.nome;
  if (oficial) return oficial;
  const limpo = texto?.trim();
  if (!limpo) return null;
  return /^[a-z0-9-]+$/.test(limpo) ? slugParaTitulo(limpo) : limpo;
}

// ——— Nome sugerido ——————————————————————————————————————————————————————————————

const ROTULO_DA_TIPOLOGIA: Record<Tipologia, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  flat: "Flat",
  kitnet: "Kitnet",
  cobertura: "Cobertura",
  outro: "Imóvel",
};

export function rotuloDaTipologia(tipologia: Tipologia): string {
  return ROTULO_DA_TIPOLOGIA[tipologia];
}

type BaseDoNome = {
  tipologia: Tipologia | null;
  quartos: number | null;
  bairro: string | null;
  bairroTexto: string | null;
};

/** "{Tipologia} {n} quartos · {Bairro}", com o que houver. Zero quartos não entra no nome. */
export function nomeSugerido(base: BaseDoNome): string {
  const tipo = base.tipologia ? rotuloDaTipologia(base.tipologia) : "Imóvel";
  const quartos = base.quartos ? ` ${base.quartos} ${base.quartos === 1 ? "quarto" : "quartos"}` : "";
  const bairro = nomeDoBairro(base.bairro, base.bairroTexto);
  return `${tipo}${quartos}${bairro ? ` · ${bairro}` : ""}`;
}

// ——— Bairro escolhido e cobertura (K2) ————————————————————————————————————————————

/**
 * Slug oficial do bairro do Recife que o texto nomeia (nome de exibição, slug ou alias de `bairros.ts`, sem acento e
 * sem caixa); `null` se nenhum. O texto "Recife" sozinho é a cidade, não o bairro do centro antigo: esse só casa pelo
 * nome de exibição ("Recife (bairro)") ou pelos apelidos "bairro-do-recife" e "recife-antigo", como em `extrator/bairro.ts`.
 */
export function slugDoBairroPorTexto(texto: string): string | null {
  const norma = normalizarTexto(texto);
  if (!norma) return null;
  const porNome = BAIRROS_DO_RECIFE.find((b) => normalizarTexto(b.nome) === norma);
  if (porNome) return porNome.slug;
  const comoSlug = norma.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (comoSlug === SLUG_QUE_E_A_CIDADE) return null;
  return bairroPorSlug(comoSlug)?.slug ?? null;
}

type BaseDoBairro = { bairro?: string | null; bairroTexto?: string };

/**
 * O que o formulário diz sobre o bairro: slug oficial de um bairro do Recife, `FORA_DO_RECIFE` ou `null` (nada escolhido).
 * `bairro` ausente (formulário antigo) vale o que `bairroTexto` nomeia; `bairro: null` é "nada escolhido" de propósito.
 */
export function bairroEscolhido(f: BaseDoBairro): string | null {
  if (f.bairro === FORA_DO_RECIFE) return FORA_DO_RECIFE;
  if (f.bairro !== undefined) return bairroPorSlug(f.bairro)?.slug ?? null;
  return slugDoBairroPorTexto(f.bairroTexto ?? "");
}

/**
 * Cobertura que o bairro escolhido dá ao imóvel: `coberto` (um dos cinco com cadastro), `recife_fora` (outro bairro do
 * Recife), `fora_do_recife` ("Fora do Recife") ou `desconhecida` (nada escolhido: a pessoa ainda precisa escolher).
 */
export function coberturaDoFormulario(f: BaseDoBairro): Cobertura {
  const escolhido = bairroEscolhido(f);
  if (escolhido === null) return "desconhecida";
  if (escolhido === FORA_DO_RECIFE) return "fora_do_recife";
  return eCoberto(escolhido) ? "coberto" : "recife_fora";
}

/** Título do cartão de "ainda não cobrimos": "Ainda não cobrimos Torre." ou "… esta cidade."; `null` quando há cobertura ou nada foi escolhido. */
export function tituloDeForaDeCobertura(f: BaseDoBairro): string | null {
  switch (coberturaDoFormulario(f)) {
    case "recife_fora": {
      const nome = bairroPorSlug(bairroEscolhido(f))?.nome;
      return nome ? `Ainda não cobrimos ${nome}.` : null;
    }
    case "fora_do_recife":
      return "Ainda não cobrimos esta cidade.";
    default:
      return null;
  }
}

/** `bairro` e `bairroTexto` da análise a salvar: bairro do Recife → slug e nome oficial; qualquer outra escolha → `bairro: null`. */
export function bairroParaSalvar(f: BaseDoBairro): { bairro: string | null; bairroTexto: string } {
  const escolhido = bairroEscolhido(f);
  const oficial = escolhido !== FORA_DO_RECIFE ? bairroPorSlug(escolhido) : null;
  if (oficial) return { bairro: oficial.slug, bairroTexto: oficial.nome };
  return { bairro: null, bairroTexto: (f.bairroTexto ?? "").trim() };
}

/** Nome sugerido para o que está no formulário agora ("Apartamento 2 quartos · Casa Forte"). */
export function nomeSugeridoDoFormulario(f: Pick<EstadoDoFormulario, "tipologia" | "quartos" | "bairro" | "bairroTexto">): string {
  const { bairro, bairroTexto } = bairroParaSalvar(f);
  return nomeSugerido({ tipologia: f.tipologia, quartos: f.quartos, bairro, bairroTexto });
}

export type OpcaoDeBairro = { valor: string; rotulo: string; coberto: boolean };

const OPCAO_FORA_DO_RECIFE: OpcaoDeBairro = { valor: FORA_DO_RECIFE, rotulo: ROTULO_FORA_DO_RECIFE, coberto: false };

const OPCOES_DE_BAIRRO: readonly OpcaoDeBairro[] = [...BAIRROS_DO_RECIFE]
  .sort((a, b) => normalizarTexto(a.nome).localeCompare(normalizarTexto(b.nome)))
  .map((b) => ({ valor: b.slug, rotulo: b.nome, coberto: eCoberto(b.slug) }));

/**
 * Opções do seletor de bairro: "Fora do Recife" primeiro, depois os 94 bairros do Recife em ordem alfabética (nome de
 * exibição). Com `consulta`, só os que a contêm (sem acento e sem caixa; vale o nome ou o slug).
 */
export function opcoesDeBairro(consulta = ""): OpcaoDeBairro[] {
  const q = normalizarTexto(consulta);
  const todas = [OPCAO_FORA_DO_RECIFE, ...OPCOES_DE_BAIRRO];
  if (!q) return todas;
  return todas.filter((o) => normalizarTexto(o.rotulo).includes(q) || o.valor.includes(q));
}

/**
 * O que o formulário passa a ter quando a pessoa toca numa opção do seletor. Um bairro do Recife leva o slug e o nome
 * oficial. "Fora do Recife" leva `bairro: FORA_DO_RECIFE` e mantém o texto de bairro que o anúncio trouxe (é só
 * informação, nunca vira ""), a menos que esse texto seja o nome de um bairro do Recife: aí ele não descreve mais o imóvel.
 */
export function escolhaDeBairro(atual: BaseDoBairro, valor: string): { bairro: string; bairroTexto: string } {
  if (valor === FORA_DO_RECIFE) {
    const lido = (atual.bairroTexto ?? "").trim();
    return { bairro: FORA_DO_RECIFE, bairroTexto: slugDoBairroPorTexto(lido) === null ? lido : "" };
  }
  const oficial = bairroPorSlug(valor);
  return { bairro: oficial ? oficial.slug : valor, bairroTexto: oficial ? oficial.nome : "" };
}

/** O texto "Recife" sozinho (qualquer caixa, com ou sem espaços) é a cidade, não um bairro. */
export function textoEhACidade(texto: string | null | undefined): boolean {
  return normalizarTexto(texto ?? "") === SLUG_QUE_E_A_CIDADE;
}

/**
 * Texto da pílula de bairro no cartão do Explorar: o nome oficial quando há slug ("Casa Forte · Recife"); sem slug, o
 * texto de bairro que o anúncio trouxe; sem nada disso, "Fora do Recife". Nunca "Recife" por padrão: o texto "Recife"
 * sozinho é a cidade, não um bairro, e sem slug ele não diz onde o imóvel fica (quem escolheu "Fora do Recife" e guardou
 * a cidade vê "Fora do Recife").
 */
export function rotuloDoBairroNoCartao(a: Pick<AnaliseV2, "bairro" | "bairroTexto">): string {
  const oficial = bairroPorSlug(a.bairro)?.nome;
  if (oficial) return /recife/i.test(oficial) ? oficial : `${oficial} · Recife`;
  const texto = nomeDoBairro(null, a.bairroTexto);
  return texto === null || textoEhACidade(texto) ? ROTULO_FORA_DO_RECIFE : texto;
}

/** Rótulo do bairro escolhido para o seletor; `null` quando nada foi escolhido. */
export function rotuloDoBairroEscolhido(f: BaseDoBairro): string | null {
  const escolhido = bairroEscolhido(f);
  if (escolhido === null) return null;
  return escolhido === FORA_DO_RECIFE ? OPCAO_FORA_DO_RECIFE.rotulo : (bairroPorSlug(escolhido)?.nome ?? null);
}

// ——— Edição pela pessoa (K1) ——————————————————————————————————————————————————————

type ChaveDeOrigem = Extract<keyof EstadoDoFormulario, `${string}Origem`>;

/** Origem que cada campo editável carrega no formulário; mexer no campo a passa para "você". */
const ORIGEM_DO_CAMPO: Partial<Record<CampoEditavel, ChaveDeOrigem>> = {
  preco: "precoOrigem",
  condominio: "condominioOrigem",
  iptuValor: "iptuOrigem",
  iptuPeriodo: "iptuOrigem",
  seguroIncendio: "seguroIncendioOrigem",
  taxaServico: "taxaServicoOrigem",
  outros: "outrosOrigem",
  area: "areaOrigem",
  quartos: "quartosOrigem",
  suites: "suitesOrigem",
  banheiros: "banheirosOrigem",
  vagas: "vagasOrigem",
  andar: "andarOrigem",
};

/**
 * Campos que formam uma unidade: o valor só significa algo com o seu complemento. Mexer em qualquer um marca todos como
 * editados, e nenhuma leitura nova troca um deles sozinho. O IPTU de R$ 3.456 por ano não é o mesmo número por mês.
 */
const UNIDADES_DE_CAMPOS: readonly (readonly CampoEditavel[])[] = [["iptuValor", "iptuPeriodo"]];

/**
 * Aplica uma mudança feita pela pessoa: marca cada campo mexido em `editados` (nenhuma leitura nova o sobrescreve) e,
 * nos campos com origem, passa a origem para "você". É por aqui que o formulário muda; reler usa `formularioDeExtracao`.
 */
export function editarFormulario(estado: EstadoDoFormulario, mudanca: Partial<EstadoDoFormulario>): EstadoDoFormulario {
  const editados: CamposEditados = { ...estado.editados };
  const novo: EstadoDoFormulario = { ...estado, ...mudanca };
  const mexidos = CAMPOS_EDITAVEIS.filter((campo) => campo in mudanca);
  for (const unidade of UNIDADES_DE_CAMPOS) {
    if (unidade.some((campo) => mexidos.includes(campo))) mexidos.push(...unidade.filter((campo) => !mexidos.includes(campo)));
  }
  for (const campo of mexidos) {
    editados[campo] = true;
    const origem = ORIGEM_DO_CAMPO[campo];
    if (origem) novo[origem] = "voce";
  }
  // O texto do bairro anda junto com a escolha: mexer num é mexer no outro.
  if ("bairroTexto" in mudanca) editados.bairro = true;
  return { ...novo, editados };
}

// ——— Montagem a partir da extração ————————————————————————————————————————————————

function origemLida(ext: ExtracaoAnuncio, chave: ChaveDeCampo): OrigemDoValor {
  // A extração só tem duas fontes ("link" e "texto"); "voce" só nasce na digitação.
  return ext.origemDosCampos[chave] ?? "texto";
}

function temAnomalia(ext: ExtracaoAnuncio, chave: ChaveDeCampo): boolean {
  return ext.anomalias.some((a) => a.campo === chave);
}

type CampoNumerico =
  | "preco"
  | "condominio"
  | "seguroIncendio"
  | "taxaServico"
  | "area"
  | "quartos"
  | "suites"
  | "banheiros"
  | "vagas"
  | "andar";

type CustoComConfirmar = "preco" | "condominio" | "seguroIncendio" | "taxaServico" | "outros";

/**
 * A pessoa fixou a modalidade e a leitura traz a outra (não nula). O preço lido é de outra modalidade (aluguel por mês
 * contra preço de venda), então ele não entra no formulário.
 */
export function leituraContradizAModalidade(ext: ExtracaoAnuncio, f: Pick<EstadoDoFormulario, "modalidade" | "editados">): boolean {
  const lida = ext.campos.modalidade;
  return f.editados?.modalidade === true && lida !== null && lida !== f.modalidade;
}

/**
 * Formulário de revisão a partir da extração. Regras:
 * - todo campo de custo com anomalia nasce com `aConfirmar: true`;
 * - IPTU com valor e período desconhecido nasce a confirmar mesmo sem anomalia registrada;
 * - valor lido nunca vira zero: o que não foi lido fica `null`;
 * - bairro: vem escolhido pela extração (slug do Recife, ou "Fora do Recife" quando a cidade é outra); sem leitura, nada escolhido;
 * - ao reler (`prev`), todo campo em `prev.editados` (nome, modalidade, tipologia, bairro, rua, número, edifício, custos,
 *   especificações e as marcas de "a confirmar") fica como a pessoa deixou, inclusive vazio; a leitura só preenche o resto;
 *   "a confirmar" ligado por leitura fica ligado;
 * - valor e período do IPTU são uma unidade: se a pessoa mexeu em qualquer um, a leitura não troca nenhum dos dois;
 * - se a pessoa fixou a modalidade e a leitura traz a outra, o preço lido não entra: vale o do formulário;
 * - leitura nova nunca apaga o que o formulário já tem: sem valor novo, o campo (e a sua origem) fica como estava;
 * - o nome só é refeito se a pessoa não o escreveu (ou o apagou).
 */
export function formularioDeExtracao(ext: ExtracaoAnuncio, prev?: EstadoDoFormulario): EstadoDoFormulario {
  const c = ext.campos;
  const editados: CamposEditados = { ...prev?.editados };
  /** O formulário anterior, só quando a pessoa mexeu no campo; do contrário, `null` e a leitura manda. */
  const dela = (campo: CampoEditavel): EstadoDoFormulario | null =>
    prev !== undefined && editados[campo] === true ? prev : null;
  const precoDeOutraModalidade = prev !== undefined && leituraContradizAModalidade(ext, prev);

  const numeroDe = (campo: CampoNumerico): { valor: number | null; origem: OrigemDoValor } => {
    const p = dela(campo);
    if (p) return { valor: p[campo], origem: "voce" };
    const lido = c[campo];
    if (lido !== null) return { valor: lido, origem: origemLida(ext, campo) };
    // Sem valor novo, o que já estava no campo fica (com a origem que tinha).
    return prev ? { valor: prev[campo], origem: prev[`${campo}Origem`] } : { valor: null, origem: "voce" };
  };

  const confirmarDe = (campo: CustoComConfirmar): boolean => {
    const chave = `${campo}AConfirmar` as const;
    const p = dela(chave);
    if (p) return p[chave];
    // Anomalia da leitura liga a marca (a de um preço que não entrou, não); uma marca já ligada continua ligada.
    const anomaliaDaLeitura = campo !== "outros" && temAnomalia(ext, campo) && !(campo === "preco" && precoDeOutraModalidade);
    return anomaliaDaLeitura || Boolean(prev?.[chave]);
  };

  const preco = precoDeOutraModalidade && prev ? { valor: prev.preco, origem: prev.precoOrigem } : numeroDe("preco");
  const condominio = numeroDe("condominio");
  const seguro = numeroDe("seguroIncendio");
  const taxa = numeroDe("taxaServico");
  const area = numeroDe("area");
  const quartos = numeroDe("quartos");
  const suites = numeroDe("suites");
  const banheiros = numeroDe("banheiros");
  const vagas = numeroDe("vagas");
  const andar = numeroDe("andar");

  // IPTU: valor e período são uma unidade (mexer num marca os dois, e a leitura não troca nenhum). "A confirmar" é à parte.
  const iptuDela = dela("iptuValor") ?? dela("iptuPeriodo");
  let iptuValor: number | null;
  let iptuPeriodo: Periodo;
  let iptuOrigem: OrigemDoValor;
  if (iptuDela) {
    ({ iptuValor, iptuPeriodo } = iptuDela);
    iptuOrigem = "voce";
  } else if (c.iptu) {
    iptuValor = c.iptu.valor;
    iptuPeriodo = c.iptu.periodo;
    iptuOrigem = origemLida(ext, "iptu");
  } else if (prev) {
    ({ iptuValor, iptuPeriodo, iptuOrigem } = prev);
  } else {
    iptuValor = null;
    iptuPeriodo = "desconhecido";
    iptuOrigem = "voce";
  }
  const iptuSemPeriodo = iptuValor !== null && iptuPeriodo === "desconhecido";
  const iptuConfirmarDela = dela("iptuAConfirmar");
  const iptuAConfirmar = iptuConfirmarDela
    ? iptuConfirmarDela.iptuAConfirmar
    : temAnomalia(ext, "iptu") || iptuSemPeriodo || Boolean(prev?.iptuAConfirmar);

  // Identificação.
  const pModalidade = dela("modalidade");
  const modalidade: Modalidade = pModalidade ? pModalidade.modalidade : (c.modalidade ?? prev?.modalidade ?? "aluguel");
  const pTipologia = dela("tipologia");
  const tipologia: Tipologia | null = pTipologia ? pTipologia.tipologia : (c.tipologia ?? prev?.tipologia ?? null);
  const pLogradouro = dela("logradouro");
  const logradouro = pLogradouro ? pLogradouro.logradouro : (c.logradouro ?? prev?.logradouro ?? "");
  const pNumero = dela("numero");
  const numero = pNumero ? pNumero.numero : (c.numero ?? prev?.numero ?? "");
  const pEdificio = dela("nomeEdificio");
  const nomeEdificio = pEdificio ? pEdificio.nomeEdificio : (c.nomeEdificio ?? prev?.nomeEdificio ?? "");

  // Bairro: a escolha da pessoa vale; senão, o que a leitura achou; sem nada novo, o que já estava.
  const pBairro = dela("bairro");
  const oficialLido = bairroPorSlug(c.bairro);
  const textoLido = nomeDoBairro(null, c.bairroTexto);
  const anteriorEscolhido = prev ? bairroEscolhido(prev) : null;
  let bairro: string | null;
  let bairroTexto: string;
  if (pBairro) {
    bairro = bairroEscolhido(pBairro);
    bairroTexto = pBairro.bairroTexto;
  } else if (oficialLido) {
    bairro = oficialLido.slug;
    bairroTexto = oficialLido.nome;
  } else if (ext.cobertura === "fora_do_recife") {
    // O texto que o anúncio trouxe continua guardado como informação; o nome de um bairro do Recife não descreve este imóvel.
    bairro = FORA_DO_RECIFE;
    bairroTexto = textoLido ?? (anteriorEscolhido === FORA_DO_RECIFE ? (prev?.bairroTexto ?? "") : "");
  } else if (prev && anteriorEscolhido !== null) {
    bairro = anteriorEscolhido;
    bairroTexto = anteriorEscolhido === FORA_DO_RECIFE ? (textoLido ?? prev.bairroTexto) : prev.bairroTexto;
  } else {
    bairro = null;
    bairroTexto = textoLido ?? prev?.bairroTexto ?? "";
  }

  const pNome = dela("nome");
  const escreveuONome = pNome !== null && pNome.nome.trim() !== "";
  const sugestao = nomeSugeridoDoFormulario({ tipologia, quartos: quartos.valor, bairro, bairroTexto });

  return {
    nome: escreveuONome ? pNome.nome : sugestao,
    modalidade,
    tipologia,
    bairroTexto,
    bairro,
    logradouro,
    numero,
    nomeEdificio,

    preco: preco.valor,
    precoAConfirmar: confirmarDe("preco"),
    precoOrigem: preco.origem,

    condominio: condominio.valor,
    condominioAConfirmar: confirmarDe("condominio"),
    condominioOrigem: condominio.origem,

    iptuValor,
    iptuPeriodo,
    iptuAConfirmar,
    iptuOrigem,

    seguroIncendio: seguro.valor,
    seguroIncendioAConfirmar: confirmarDe("seguroIncendio"),
    seguroIncendioOrigem: seguro.origem,

    taxaServico: taxa.valor,
    taxaServicoAConfirmar: confirmarDe("taxaServico"),
    taxaServicoOrigem: taxa.origem,

    // Sem leitura para "outros": o que a pessoa digitou fica.
    outros: prev?.outros ?? null,
    outrosAConfirmar: confirmarDe("outros"),
    outrosOrigem: prev?.outrosOrigem ?? "voce",

    area: area.valor,
    areaOrigem: area.origem,
    quartos: quartos.valor,
    quartosOrigem: quartos.origem,
    suites: suites.valor,
    suitesOrigem: suites.origem,
    banheiros: banheiros.valor,
    banheirosOrigem: banheiros.origem,
    vagas: vagas.valor,
    vagasOrigem: vagas.origem,
    andar: andar.valor,
    andarOrigem: andar.origem,

    editados,
  };
}

// ——— Checklist da leitura: "Preço e custos" ————————————————————————————————————————

/** "IPTU R$ 154/mês", "IPTU R$ 1.848/ano" ou, sem período, "IPTU R$ 154 · período não informado". */
function textoDoIptuLido(iptu: { valor: number; periodo: Periodo }): string {
  const valor = formatarReais(iptu.valor);
  if (iptu.periodo === "mes") return `IPTU ${valor}/mês`;
  if (iptu.periodo === "ano") return `IPTU ${valor}/ano`;
  return `IPTU ${valor} · período não informado`;
}

/**
 * O que a leitura trouxe de preço e custos, como mostra o checklist ("R$ 4.500/mês", "Cond. R$ 1.190/mês", "IPTU R$ 154
 * · período não informado"). Segue o formulário: o aluguel leva "/mês" e a compra, não; o preço lido num anúncio da outra
 * modalidade (R2: a pessoa fixou a modalidade) fica de fora, porque o formulário também o deixou de fora. `precoLido` diz
 * se o preço mostrado é o do formulário. Valor que não foi lido não aparece, e nunca vira zero.
 */
export function resumoDePrecoECustos(
  ext: ExtracaoAnuncio,
  f: Pick<EstadoDoFormulario, "modalidade" | "editados">,
): { precoLido: boolean; partes: string[] } {
  const c = ext.campos;
  const preco = leituraContradizAModalidade(ext, f) ? null : c.preco;
  const partes: string[] = [];
  if (preco !== null) partes.push(`${formatarReais(preco)}${f.modalidade === "aluguel" ? "/mês" : ""}`);
  if (c.condominio !== null) partes.push(`Cond. ${formatarReais(c.condominio)}/mês`);
  if (c.iptu) partes.push(textoDoIptuLido(c.iptu));
  return { precoLido: preco !== null, partes };
}

// ——— Do formulário para os valores declarados ————————————————————————————————————————

/** Zero só vale quando a pessoa o digitou; zero "lido" é ausência. */
function valorDeclarado(valor: number | null, origem: OrigemDoValor): number | null {
  if (valor === null || !Number.isFinite(valor)) return null;
  return valor === 0 && origem !== "voce" ? null : valor;
}

/** Área precisa ser positiva (o esquema recusa 0). */
function areaDeclarada(valor: number | null): number | null {
  return valor !== null && Number.isFinite(valor) && valor > 0 ? valor : null;
}

export function declaradosDoFormulario(f: EstadoDoFormulario): Declarados {
  return {
    preco: { valor: valorDeclarado(f.preco, f.precoOrigem), origem: f.precoOrigem, aConfirmar: f.precoAConfirmar },
    condominio: {
      valor: valorDeclarado(f.condominio, f.condominioOrigem),
      origem: f.condominioOrigem,
      aConfirmar: f.condominioAConfirmar,
    },
    iptu: {
      valor: valorDeclarado(f.iptuValor, f.iptuOrigem),
      periodo: f.iptuPeriodo,
      origem: f.iptuOrigem,
      aConfirmar: f.iptuAConfirmar,
    },
    seguroIncendio: {
      valor: valorDeclarado(f.seguroIncendio, f.seguroIncendioOrigem),
      origem: f.seguroIncendioOrigem,
      aConfirmar: f.seguroIncendioAConfirmar,
    },
    taxaServico: {
      valor: valorDeclarado(f.taxaServico, f.taxaServicoOrigem),
      origem: f.taxaServicoOrigem,
      aConfirmar: f.taxaServicoAConfirmar,
    },
    outros: { valor: valorDeclarado(f.outros, f.outrosOrigem), origem: f.outrosOrigem, aConfirmar: f.outrosAConfirmar },
    area: { valor: areaDeclarada(f.area), origem: f.areaOrigem, aConfirmar: false },
    quartos: { valor: valorDeclarado(f.quartos, f.quartosOrigem), origem: f.quartosOrigem, aConfirmar: false },
    suites: { valor: valorDeclarado(f.suites, f.suitesOrigem), origem: f.suitesOrigem, aConfirmar: false },
    banheiros: { valor: valorDeclarado(f.banheiros, f.banheirosOrigem), origem: f.banheirosOrigem, aConfirmar: false },
    vagas: { valor: valorDeclarado(f.vagas, f.vagasOrigem), origem: f.vagasOrigem, aConfirmar: false },
    andar: { valor: valorDeclarado(f.andar, f.andarOrigem), origem: f.andarOrigem, aConfirmar: false },
  };
}

// ——— Cartão do Explorar ———————————————————————————————————————————————————————————

/** Campo de `declarados` que cada chave de anomalia descreve. Chave fora daqui (bairro, rua, modalidade…) não tem valor a resolver. */
const CAMPO_DECLARADO: Partial<Record<ChaveDeCampo, keyof Declarados>> = {
  preco: "preco",
  condominio: "condominio",
  iptu: "iptu",
  seguroIncendio: "seguroIncendio",
  taxaServico: "taxaServico",
  area: "area",
  quartos: "quartos",
  suites: "suites",
  banheiros: "banheiros",
  vagas: "vagas",
  andar: "andar",
};

/**
 * A anomalia da leitura continua valendo enquanto o valor declarado ainda é o da leitura (origem link ou texto) ou segue
 * desconhecido. Valor que a pessoa digitou (origem "você") a resolve. Anomalia de campo sem valor declarado não conta, e a
 * do preço lido num anúncio de outra modalidade também não: aquele preço não é o desta análise.
 */
function anomaliaPendente(extracao: ExtracaoAnuncio, d: Declarados, modalidade: Modalidade, campo: ChaveDeCampo): boolean {
  const chave = CAMPO_DECLARADO[campo];
  if (chave === undefined) return false;
  if (campo === "preco") {
    const lida = extracao.campos.modalidade;
    if (lida !== null && lida !== modalidade) return false;
  }
  const declarado = d[chave];
  if (declarado.valor !== null && declarado.origem === "voce") return false;
  switch (chave) {
    case "preco":
    case "condominio":
    case "seguroIncendio":
    case "taxaServico":
      return d[chave].aConfirmar || d[chave].valor === null;
    case "iptu":
      return d.iptu.aConfirmar || d.iptu.valor === null || d.iptu.periodo === "desconhecido";
    default:
      return true;
  }
}

/** Anomalias da leitura que a pessoa ainda não resolveu (nenhuma, sem leitura). */
export function anomaliasPendentes(extracao: ExtracaoAnuncio | null, declarados: Declarados, modalidade: Modalidade): Anomalia[] {
  return extracao ? extracao.anomalias.filter((anomalia) => anomaliaPendente(extracao, declarados, modalidade, anomalia.campo)) : [];
}

/** Título da primeira anomalia da leitura que a pessoa ainda não resolveu; `null` quando não há. */
export function primeiraAnomaliaPendente(a: AnaliseV2): string | null {
  const achada = anomaliasPendentes(a.extracao, a.declarados, a.modalidade)[0];
  return achada ? tituloDaAnomalia(achada) : null;
}

/** Anomalias que a revisão mostra: as da leitura, menos as do preço que não entrou por ser de outra modalidade. */
export function anomaliasDaRevisao(ext: ExtracaoAnuncio, f: Pick<EstadoDoFormulario, "modalidade" | "editados">): Anomalia[] {
  return leituraContradizAModalidade(ext, f) ? ext.anomalias.filter((a) => a.campo !== "preco") : ext.anomalias;
}

/**
 * Para onde o cartão do Explorar leva: o prédio, quando a análise é de bairro coberto e o vínculo ainda está pendente
 * (falta confirmar o edifício); o dossiê, nos demais casos.
 */
export function destinoDaAnalise(a: Pick<AnaliseV2, "bairro" | "vinculo">): "predio" | "dossie" {
  return a.vinculo.estado === "pendente" && eCoberto(a.bairro) ? "predio" : "dossie";
}

// ——— Análise salva e formulário (R6: /editar) ———————————————————————————————————————

/** Formulário de uma análise nova, sem link: nada lido, nada editado, nenhum bairro escolhido. */
export function formularioVazio(): EstadoDoFormulario {
  return {
    nome: "",
    modalidade: "aluguel",
    tipologia: "apartamento",
    bairroTexto: "",
    bairro: null,
    logradouro: "",
    numero: "",
    nomeEdificio: "",

    preco: null,
    precoAConfirmar: false,
    precoOrigem: "voce",

    condominio: null,
    condominioAConfirmar: false,
    condominioOrigem: "voce",

    iptuValor: null,
    iptuPeriodo: "desconhecido",
    iptuAConfirmar: false,
    iptuOrigem: "voce",

    seguroIncendio: null,
    seguroIncendioAConfirmar: false,
    seguroIncendioOrigem: "voce",

    taxaServico: null,
    taxaServicoAConfirmar: false,
    taxaServicoOrigem: "voce",

    outros: null,
    outrosAConfirmar: false,
    outrosOrigem: "voce",

    area: null,
    areaOrigem: "voce",
    quartos: null,
    quartosOrigem: "voce",
    suites: null,
    suitesOrigem: "voce",
    banheiros: null,
    banheirosOrigem: "voce",
    vagas: null,
    vagasOrigem: "voce",
    andar: null,
    andarOrigem: "voce",

    editados: {},
  };
}

/**
 * O que o seletor mostra para uma análise já salva: o slug do Recife (guardado ou nomeado pelo texto), "Fora do Recife"
 * (sem slug e sem bairro do Recife no texto, mas com texto de bairro ou fora de cobertura) ou nada escolhido.
 */
function bairroDaAnalise(a: Pick<AnaliseV2, "bairro" | "bairroTexto" | "vinculo">): { bairro: string | null; bairroTexto: string } {
  const texto = a.bairroTexto.trim();
  // Análise salva sem slug cujo texto nomeia um bairro do Recife: o texto vale ("Boa Viagem" não vira "Fora do Recife").
  const oficial = bairroPorSlug(a.bairro) ?? bairroPorSlug(slugDoBairroPorTexto(texto));
  if (oficial) return { bairro: oficial.slug, bairroTexto: oficial.nome };
  const fora = texto !== "" || a.vinculo.estado === "fora_de_cobertura";
  return { bairro: fora ? FORA_DO_RECIFE : null, bairroTexto: texto };
}

/** Formulário de uma análise salva: o que ela guarda, com as origens que tinha e nenhum campo editado ainda. */
export function formularioDeAnalise(a: AnaliseV2): EstadoDoFormulario {
  const d = a.declarados;
  return {
    nome: a.nome,
    modalidade: a.modalidade,
    tipologia: a.tipologia,
    ...bairroDaAnalise(a),
    logradouro: a.logradouro ?? "",
    numero: a.numero ?? "",
    nomeEdificio: a.nomeEdificio ?? "",

    preco: d.preco.valor,
    precoAConfirmar: d.preco.aConfirmar,
    precoOrigem: d.preco.origem,

    condominio: d.condominio.valor,
    condominioAConfirmar: d.condominio.aConfirmar,
    condominioOrigem: d.condominio.origem,

    iptuValor: d.iptu.valor,
    iptuPeriodo: d.iptu.periodo,
    iptuAConfirmar: d.iptu.aConfirmar,
    iptuOrigem: d.iptu.origem,

    seguroIncendio: d.seguroIncendio.valor,
    seguroIncendioAConfirmar: d.seguroIncendio.aConfirmar,
    seguroIncendioOrigem: d.seguroIncendio.origem,

    taxaServico: d.taxaServico.valor,
    taxaServicoAConfirmar: d.taxaServico.aConfirmar,
    taxaServicoOrigem: d.taxaServico.origem,

    outros: d.outros.valor,
    outrosAConfirmar: d.outros.aConfirmar,
    outrosOrigem: d.outros.origem,

    area: d.area.valor,
    areaOrigem: d.area.origem,
    quartos: d.quartos.valor,
    quartosOrigem: d.quartos.origem,
    suites: d.suites.valor,
    suitesOrigem: d.suites.origem,
    banheiros: d.banheiros.valor,
    banheirosOrigem: d.banheiros.origem,
    vagas: d.vagas.valor,
    vagasOrigem: d.vagas.origem,
    andar: d.andar.valor,
    andarOrigem: d.andar.origem,

    editados: {},
  };
}

/** Os campos da análise que vêm do formulário (revisão e edição montam o resto: id, datas, link, leitura, vínculo, visita). */
export type CamposDoFormulario = Pick<
  AnaliseV2,
  "nome" | "modalidade" | "tipologia" | "bairroTexto" | "bairro" | "logradouro" | "numero" | "nomeEdificio" | "declarados"
>;

/** O bairro escolhido manda: slug e nome oficial, ou nulo com o texto lido. O nome, sem escrita da pessoa, é a sugestão. */
export function camposDaAnalise(f: EstadoDoFormulario): CamposDoFormulario {
  const { bairro, bairroTexto } = bairroParaSalvar(f);
  return {
    nome: f.nome.trim() || nomeSugeridoDoFormulario(f),
    modalidade: f.modalidade,
    tipologia: f.tipologia,
    bairroTexto,
    bairro,
    logradouro: f.logradouro.trim() || null,
    numero: f.numero.trim() || null,
    nomeEdificio: f.nomeEdificio.trim() || null,
    declarados: declaradosDoFormulario(f),
  };
}

/**
 * Vínculo com o prédio depois de salvar: a cobertura vem do bairro escolhido. Bairro coberto → `pendente` (falta
 * confirmar o prédio); qualquer outro → `fora_de_cobertura`. Quem já tinha vínculo num bairro coberto e não mudou de
 * bairro o mantém (um prédio confirmado continua confirmado); mudar de bairro recomeça.
 */
export function vinculoDoFormulario(
  f: BaseDoBairro,
  existente: Pick<AnaliseV2, "bairro" | "vinculo"> | null,
): AnaliseV2["vinculo"] {
  if (coberturaDoFormulario(f) !== "coberto") return { estado: "fora_de_cobertura" };
  const { bairro } = bairroParaSalvar(f);
  if (existente && existente.bairro === bairro && existente.vinculo.estado !== "fora_de_cobertura") return existente.vinculo;
  return { estado: "pendente" };
}
