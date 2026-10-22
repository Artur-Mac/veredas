// Busca do prédio no índice cadastral: candidatos para um anúncio (buscarCandidatos) e busca livre digitada
// pela pessoa (buscarPorEndereco). Funções puras sobre os edifícios que o chamador passa; nada de rede.
import type { Candidato, Edificio } from "../contratos";
import { formatarNumero } from "../formatos";
import { BAIRROS_DO_RECIFE, type SlugCoberto } from "./bairros";

export type EntradaDeBusca = {
  bairro: SlugCoberto;
  logradouro: string | null;
  numero: string | null;
  nomeEdificio: string | null;
  area: number | null;
  andar: number | null;
  anoConstrucao: number | null;
};

const MAXIMO_DE_RESULTADOS = 8;
const PONTOS_MINIMOS = 30;

const PONTOS_NOME = 100;
const PONTOS_RUA = 50;
const PONTOS_NUMERO = 100;
const PONTOS_AREA = 30;
const PONTOS_AREA_REPETIDA = 10;
const PONTOS_ANO = 15;

/** Palavras que não identificam o prédio ("Edifício Solar do Gayppio" e "Solar do Gayppio" são o mesmo nome). */
const PALAVRAS_DE_EDIFICIO = new Set(["edificio", "edif", "edf", "condominio", "residencial"]);

/**
 * Tipo de via, só quando é a primeira palavra do endereço, dos dois lados da comparação. O cadastro do Recife usa
 * exatamente RUA, AV, EST e PRC no início do logradouro; os anúncios escrevem por extenso ("Estrada", "Praça") ou
 * abreviado, com ou sem ponto. O texto já chega normalizado: sem acento ("praça" vira "praca") e sem pontuação.
 */
const TIPOS_DE_VIA = new Set([
  "rua", "r", "avenida", "av", "estrada", "est", "estr", "praca", "pca", "pc", "prc", "travessa", "tv", "trav",
  "alameda", "al", "largo", "lgo", "lg", "beco", "bc", "rodovia", "rod", "via", "caminho", "cam", "passagem", "pass",
  "ladeira", "lad", "parque", "pq", "patio", "viaduto", "vila",
]);

/** Abreviaturas comuns de título nos logradouros do cadastro. */
const ABREVIATURAS = new Map([
  ["dr", "doutor"], ["dra", "doutora"], ["prof", "professor"], ["profa", "professora"], ["eng", "engenheiro"],
  ["cel", "coronel"], ["des", "desembargador"], ["gen", "general"], ["ten", "tenente"], ["cap", "capitao"],
  ["sen", "senador"], ["sta", "santa"], ["sto", "santo"],
]);

/** Sem acento, sem caixa, só letras e números separados por um espaço. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function palavras(texto: string): string[] {
  const normal = normalizar(texto);
  return normal ? normal.split(" ") : [];
}

/** Palavras do nome do prédio, sem "edifício", "edf", "condomínio" e "residencial". */
function palavrasDoNome(texto: string): string[] {
  return palavras(texto).filter((p) => !PALAVRAS_DE_EDIFICIO.has(p));
}

/** Palavras do logradouro, sem o tipo de via e com as abreviaturas de título por extenso. */
function palavrasDaRua(texto: string): string[] {
  const todas = palavras(texto);
  const sem = todas.length > 1 && TIPOS_DE_VIA.has(todas[0] ?? "") ? todas.slice(1) : todas;
  return sem.map((p) => ABREVIATURAS.get(p) ?? p);
}

function numeroNormalizado(numero: string | null): string | null {
  if (numero === null) return null;
  const limpo = normalizar(numero).replace(/ /g, "").replace(/^0+(?=\d)/, "");
  return limpo === "" ? null : limpo;
}

function mesmoTexto(a: string[], b: string[]): boolean {
  return a.length > 0 && a.length === b.length && a.every((p, i) => p === b[i]);
}

/** `menor` aparece inteiro, palavra por palavra e em sequência, dentro de `maior`. */
function contem(maior: string[], menor: string[]): boolean {
  if (menor.length === 0 || menor.length > maior.length) return false;
  for (let i = 0; i + menor.length <= maior.length; i += 1) {
    if (menor.every((p, j) => maior[i + j] === p)) return true;
  }
  return false;
}

/** Mesmo nome: igual, ou um contém o outro e o contido tem 2 palavras ou mais. */
function mesmoNomeDeEdificio(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  if (mesmoTexto(a, b)) return true;
  const maior = a.length >= b.length ? a : b;
  const menor = a.length >= b.length ? b : a;
  return menor.length >= 2 && contem(maior, menor);
}

type Normalizado = { nome: string[]; rua: string[]; numero: string | null };

const guardados = new WeakMap<Edificio, Normalizado>();

function normalizado(e: Edificio): Normalizado {
  let n = guardados.get(e);
  if (!n) {
    n = { nome: e.nome ? palavrasDoNome(e.nome) : [], rua: palavrasDaRua(e.logradouro), numero: numeroNormalizado(e.numero) };
    guardados.set(e, n);
  }
  return n;
}

function porPontosEDepoisId<T extends { id: string; pontos: number }>(a: T, b: T): number {
  if (a.pontos !== b.pontos) return b.pontos - a.pontos;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function textoDaArea(area: number): string {
  const casas = Number.isInteger(area) ? 0 : Number.isInteger(area * 10) ? 1 : 2;
  return formatarNumero(area, casas);
}

function unidadesComArea(unidades: number, area: number): string {
  return `${unidades} ${unidades === 1 ? "unidade" : "unidades"} com ${textoDaArea(area)} m² no cadastro`;
}

/** Tolerância de área: o maior entre 1,5 m² e 3% da área do anúncio. */
function tolerancia(area: number): number {
  return Math.max(1.5, area * 0.03);
}

type Tipologia = Edificio["tipologias"][number];

/**
 * Tipologias do prédio dentro da tolerância de área, da mais próxima da área do anúncio para a mais distante;
 * empate de distância fica com a que tem mais unidades.
 */
function tipologiasNaTolerancia(e: Edificio, area: number): Tipologia[] {
  const limite = tolerancia(area);
  return e.tipologias
    .filter((t) => Math.abs(t.area - area) <= limite)
    .sort((a, b) => Math.abs(a.area - area) - Math.abs(b.area - area) || b.unidades - a.unidades);
}

/**
 * Prédios do bairro que podem ser o do anúncio, do mais ao menos provável (no máximo 8, mínimo de 30 pontos).
 * Pontos: mesmo nome de edifício +100; mesma rua +50 e, se o número também for o mesmo, mais +100 (a soma
 * dá 150); alguma tipologia com área próxima +30, e mais +10 se alguma das tipologias próximas tem 2 ou mais
 * unidades (não precisa ser a mais próxima); ano de construção com no máximo 1 ano de diferença +15. Andar maior que os pavimentos do prédio exclui. Sem nenhum sinal, devolve
 * lista vazia. Só entram edifícios do `bairro` da entrada.
 */
export type PistaDeCorrespondencia = "nome" | "rua" | "numero" | "area" | "ano";
export type CandidatoDetalhado = Candidato & { pistas: PistaDeCorrespondencia[] };
export type ResultadoDeCandidatos = {
  candidatos: CandidatoDetalhado[];
  totalCompativeis: number;
  resultadosLimitados: boolean;
};

/** Detalhes não persistidos: os pontos ordenam, mas não representam probabilidade. */
export function buscarCandidatosDetalhados(entrada: EntradaDeBusca, edificios: readonly Edificio[]): ResultadoDeCandidatos {
  const nomeProcurado = entrada.nomeEdificio ? palavrasDoNome(entrada.nomeEdificio) : [];
  const ruaProcurada = entrada.logradouro ? palavrasDaRua(entrada.logradouro) : [];
  const numeroProcurado = numeroNormalizado(entrada.numero);

  const candidatos: (CandidatoDetalhado & { id: string })[] = [];
  for (const e of edificios) {
    if (e.bairro !== entrada.bairro) continue;
    if (entrada.andar !== null && e.pavimentos !== null && entrada.andar > e.pavimentos) continue;

    const n = normalizado(e);
    let pontos = 0;
    const motivos: string[] = [];
    const pistas: PistaDeCorrespondencia[] = [];

    if (mesmoNomeDeEdificio(nomeProcurado, n.nome)) {
      pistas.push("nome");
      pontos += PONTOS_NOME;
      motivos.push("Mesmo nome de edifício do anúncio");
    }

    if (mesmoTexto(ruaProcurada, n.rua)) {
      pistas.push("rua");
      pontos += PONTOS_RUA;
      if (numeroProcurado !== null && numeroProcurado === n.numero) {
        pistas.push("numero");
        pontos += PONTOS_NUMERO;
        motivos.push("Mesma rua e mesmo número do anúncio");
      } else {
        motivos.push("Mesma rua do anúncio");
      }
    }

    if (entrada.area !== null && entrada.area > 0) {
      const naTolerancia = tipologiasNaTolerancia(e, entrada.area);
      const maisProxima = naTolerancia[0];
      if (maisProxima) {
        pistas.push("area");
        pontos += PONTOS_AREA;
        // O motivo cita a tipologia que explica a pontuação: a repetida, quando existe; senão, a mais próxima.
        const repetida = naTolerancia.find((t) => t.unidades >= 2);
        if (repetida) pontos += PONTOS_AREA_REPETIDA;
        const citada = repetida ?? maisProxima;
        motivos.push(unidadesComArea(citada.unidades, citada.area));
      }
    }

    if (entrada.anoConstrucao !== null && e.anoConstrucao !== null && Math.abs(e.anoConstrucao - entrada.anoConstrucao) <= 1) {
      pistas.push("ano");
      pontos += PONTOS_ANO;
      motivos.push(`Construído em ${e.anoConstrucao}, perto do ano do anúncio`);
    }

    if (pontos >= PONTOS_MINIMOS) candidatos.push({ id: e.id, edificioId: e.id, pontos, motivos, pistas });
  }

  return {
    totalCompativeis: candidatos.length,
    resultadosLimitados: candidatos.length > MAXIMO_DE_RESULTADOS,
    candidatos: candidatos.sort(porPontosEDepoisId).slice(0, MAXIMO_DE_RESULTADOS)
      .map(({ edificioId, pontos, motivos, pistas }) => ({ edificioId, pontos, motivos, pistas })),
  };
}

/** API anterior preservada para consumidores que só precisam da lista. */
export function buscarCandidatos(entrada: EntradaDeBusca, edificios: readonly Edificio[]): Candidato[] {
  return buscarCandidatosDetalhados(entrada, edificios).candidatos
    .map(({ edificioId, pontos, motivos }) => ({ edificioId, pontos, motivos }));
}

/** Palavra digitada que ainda pode estar incompleta: vale como começo de alguma palavra do alvo. */
function comecaEm(alvo: string[], digitadas: string[]): boolean {
  return digitadas.length > 0 && digitadas.every((d) => alvo.some((p) => p.startsWith(d)));
}

const MARCAS_DE_NUMERO = new Set(["n", "no", "nro", "num", "numero"]);

/** Separa o número ("331", "331a") do resto do que foi digitado. O último número vence. */
function separarNumero(digitado: string[]): { numero: string | null; resto: string[] } {
  let posicao = -1;
  for (let i = digitado.length - 1; i >= 0; i -= 1) {
    if (/^\d{1,5}[a-z]?$/.test(digitado[i] ?? "")) {
      posicao = i;
      break;
    }
  }
  if (posicao < 0) return { numero: null, resto: digitado };
  const marca = posicao > 0 && MARCAS_DE_NUMERO.has(digitado[posicao - 1] ?? "") ? posicao - 1 : posicao;
  return { numero: numeroNormalizado(digitado[posicao] ?? null), resto: [...digitado.slice(0, marca), ...digitado.slice(posicao + 1)] };
}

/**
 * Busca livre: "rua teles junior 331", "teles júnior, 331", "parador de cervantes" ou só "331". Aceita palavras
 * incompletas (a pessoa ainda digitando). Com número digitado, só devolve os prédios daquela rua com aquele
 * número quando existe algum; senão, os da rua. Até 8, do mais ao menos parecido, depois por `id`.
 */
/** Nomes que fecham um endereço colado do anúncio ("- Graças, Recife - PE") e não são da rua nem do prédio. */
const FECHOS_DE_ENDERECO = new Set([
  ...BAIRROS_DO_RECIFE.map((b) => normalizar(b.nome)),
  "recife", "pe", "pernambuco", "brasil", "cep",
]);

/**
 * O endereço como o anúncio mostra ("Rua Esmeraldino Bandeira, 411 - Graças, Recife - PE, 52011-000") vira só a rua
 * e o número: sai o CEP, e saem os trechos (separados por vírgula ou " - ") que são bairro, cidade ou estado.
 */
export function enderecoSemFecho(texto: string): string {
  const semCep = texto.replace(/\b\d{5}-?\d{3}\b/g, " ");
  const trechos = semCep.split(/,|\s+[-–]\s+/).filter((t) => {
    const n = normalizar(t);
    return n !== "" && !FECHOS_DE_ENDERECO.has(n);
  });
  return trechos.join(" ");
}

export function buscarPorEndereco(texto: string, edificios: readonly Edificio[]): Edificio[] {
  const { numero, resto } = separarNumero(palavras(enderecoSemFecho(texto)));
  const ruaDigitada = resto.length > 1 && TIPOS_DE_VIA.has(resto[0] ?? "") ? resto.slice(1) : resto;
  const ruaDigitadaCompleta = ruaDigitada.map((p) => ABREVIATURAS.get(p) ?? p);
  const nomeDigitado = resto.filter((p) => !PALAVRAS_DE_EDIFICIO.has(p));
  const soNumero = resto.length === 0 && numero !== null;
  if (resto.length === 0 && numero === null) return [];
  if (!soNumero && normalizar(resto.join(" ")).length < 2) return [];

  type Achado = { id: string; pontos: number; edificio: Edificio; comNumero: boolean };
  const achados: Achado[] = [];
  for (const e of edificios) {
    const n = normalizado(e);
    const numeroIgual = numero !== null && numero === n.numero;
    if (soNumero) {
      if (numeroIgual) achados.push({ id: e.id, pontos: PONTOS_NUMERO, edificio: e, comNumero: true });
      continue;
    }
    let pontos = 0;
    if (mesmoTexto(nomeDigitado, n.nome)) pontos += PONTOS_NOME;
    else if (mesmoNomeDeEdificio(nomeDigitado, n.nome) || comecaEm(n.nome, nomeDigitado)) pontos += PONTOS_NOME / 2;

    const ruaCasa = mesmoTexto(ruaDigitadaCompleta, n.rua) ? PONTOS_RUA : comecaEm(n.rua, ruaDigitadaCompleta) ? PONTOS_RUA / 2 : 0;
    pontos += ruaCasa;
    let comNumero = false;
    if (numeroIgual && ruaCasa > 0) {
      pontos += PONTOS_NUMERO;
      comNumero = true;
    }
    if (pontos > 0) achados.push({ id: e.id, pontos, edificio: e, comNumero });
  }

  const exatos = achados.filter((a) => a.comNumero);
  const lista = numero !== null && exatos.length > 0 ? exatos : achados;
  return lista
    .sort(porPontosEDepoisId)
    .slice(0, MAXIMO_DE_RESULTADOS)
    .map((a) => a.edificio);
}
