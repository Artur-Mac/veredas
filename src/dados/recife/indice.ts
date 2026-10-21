// Acesso ao índice cadastral do Recife gerado por scripts/dados/construir-indice-recife.mjs.
// Os JSON são lidos com `require` tipado como `unknown`: o TypeScript não infere o formato deles.
//
// Validação em duas camadas, porque a completa custa caro:
// - Em tempo de execução, no primeiro acesso a cada bairro, só uma checagem rasa (`checarIndiceRaso`): bairro,
//   geradoEm, contexto, os arrays `edificios` e `obras` e o formato de um edifício de amostra. A validação Zod
//   completa de Boa Viagem leva ~200 ms no desktop e travaria a primeira pintura em celular lento.
// - Os JSON são os do repositório, gerados pelo script, e `tests/indice-recife.test.ts` os valida por inteiro com
//   `validarIndiceCompleto`. Um arquivo corrompido no meio não passa no teste; a checagem rasa só protege o app
//   de um arquivo que não tem a forma de índice (troca de arquivo, edição à mão, geração interrompida).
// Arquivo inválido lança erro com o caminho do campo que falhou; nada aqui devolve dado "parecido" com o cadastro.
import {
  esquemaEdificio,
  esquemaIndiceDoBairro,
  esquemaMetaDoIndice,
  type ContextoDoBairro,
  type Edificio,
  type IndiceDoBairro,
  type MetaDoIndice,
  type RuaDoBairro,
} from "../contratos";
import { BAIRROS_COBERTOS, type SlugCoberto } from "./bairros";

const ARQUIVOS: Record<SlugCoberto, () => unknown> = {
  "boa-viagem": () => require("./indice/boa-viagem.json") as unknown,
  "casa-forte": () => require("./indice/casa-forte.json") as unknown,
  gracas: () => require("./indice/gracas.json") as unknown,
  espinheiro: () => require("./indice/espinheiro.json") as unknown,
  madalena: () => require("./indice/madalena.json") as unknown,
};
const ARQUIVO_META = () => require("./indice/meta.json") as unknown;

type Carregado = { indice: IndiceDoBairro; porId: Map<string, Edificio> };
/** Um problema de formato, no mesmo feitio dos `issues` do Zod (que são aceitos como estão). */
type Problema = { path: readonly PropertyKey[]; message: string };

const emMemoria = new Map<SlugCoberto, Carregado>();
let metaEmMemoria: MetaDoIndice | null = null;

function descreverFalha(nome: string, problemas: readonly Problema[]): string {
  const primeiro = problemas[0];
  const onde = primeiro && primeiro.path.length > 0 ? primeiro.path.map(String).join(".") : "(raiz)";
  const quantos = problemas.length;
  const detalhe = primeiro ? `${onde}: ${primeiro.message}` : "formato desconhecido";
  return `Índice cadastral inválido em ${nome} (${quantos} ${quantos === 1 ? "problema" : "problemas"}; primeiro em ${detalhe}). Gere o índice de novo com scripts/dados/construir-indice-recife.mjs.`;
}

const ehObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === "object" && valor !== null && !Array.isArray(valor);

/** O arquivo de um bairro tem de dizer ser desse bairro. */
function conferirBairro(slug: SlugCoberto, indice: IndiceDoBairro): void {
  if (indice.bairro !== slug) {
    throw new Error(`Índice cadastral inválido em ${slug}.json: o arquivo diz ser do bairro "${indice.bairro}".`);
  }
}

/** Mapa id → edifício. Lança em id ausente ou repetido (O(n), sem Zod). */
function indexarPorId(slug: SlugCoberto, edificios: readonly Edificio[]): Map<string, Edificio> {
  const porId = new Map<string, Edificio>();
  edificios.forEach((edificio, posicao) => {
    const id = (edificio as { id?: unknown } | null)?.id;
    if (typeof id !== "string") {
      throw new Error(descreverFalha(`${slug}.json`, [{ path: ["edificios", posicao, "id"], message: "esperado texto" }]));
    }
    if (porId.has(id)) throw new Error(`Índice cadastral inválido em ${slug}.json: edifício ${id} repetido.`);
    porId.set(id, edificio);
  });
  return porId;
}

/**
 * Validação completa, com o Zod do contrato: todo campo de todo edifício e obra. Custa ~200 ms em Boa Viagem,
 * por isso o app não a usa; o teste dos arquivos gerados sim (`tests/indice-recife.test.ts`).
 */
export function validarIndiceCompleto(slug: SlugCoberto, dados: unknown): IndiceDoBairro {
  const resultado = esquemaIndiceDoBairro.safeParse(dados);
  if (!resultado.success) throw new Error(descreverFalha(`${slug}.json`, resultado.error.issues));
  conferirBairro(slug, resultado.data);
  indexarPorId(slug, resultado.data.edificios);
  return resultado.data;
}

/**
 * Checagem rasa, a que o app faz em tempo de execução: `bairro` e `geradoEm` em texto, `contexto` objeto,
 * `edificios` e `obras` arrays, o primeiro edifício no formato do contrato (Zod, em um só objeto) e o arquivo
 * dizendo ser do bairro pedido. Não olha os demais edifícios nem as obras; quem garante o conteúdo é o teste
 * com `validarIndiceCompleto`.
 */
export function checarIndiceRaso(slug: SlugCoberto, dados: unknown): IndiceDoBairro {
  const problemas: Problema[] = [];
  if (!ehObjeto(dados)) {
    problemas.push({ path: [], message: "esperado objeto" });
  } else {
    if (typeof dados.bairro !== "string") problemas.push({ path: ["bairro"], message: "esperado texto" });
    if (typeof dados.geradoEm !== "string") problemas.push({ path: ["geradoEm"], message: "esperado texto" });
    if (!ehObjeto(dados.contexto)) problemas.push({ path: ["contexto"], message: "esperado objeto" });
    if (!Array.isArray(dados.obras)) problemas.push({ path: ["obras"], message: "esperado lista" });
    // v1.1: a camada "A rua" é opcional; presente, tem de ser objeto com as listas do contrato.
    if (dados.rua !== undefined) {
      if (!ehObjeto(dados.rua)) problemas.push({ path: ["rua"], message: "esperado objeto" });
      else {
        for (const campo of ["setores", "areasDePonderacao", "luse", "iluminacaoDesativada"] as const) {
          if (!Array.isArray(dados.rua[campo])) problemas.push({ path: ["rua", campo], message: "esperado lista" });
        }
        if (!ehObjeto(dados.rua.logradouros)) problemas.push({ path: ["rua", "logradouros"], message: "esperado objeto" });
      }
    }
    if (!Array.isArray(dados.edificios)) {
      problemas.push({ path: ["edificios"], message: "esperado lista" });
    } else if (dados.edificios.length > 0) {
      const amostra = esquemaEdificio.safeParse(dados.edificios[0]);
      if (!amostra.success) {
        for (const p of amostra.error.issues) problemas.push({ path: ["edificios", 0, ...p.path], message: p.message });
      }
    }
  }
  if (problemas.length > 0) throw new Error(descreverFalha(`${slug}.json`, problemas));
  // A forma foi conferida acima; o conteúdo, pelo teste. A asserção é a troca consciente de custo por velocidade.
  const indice = dados as IndiceDoBairro;
  conferirBairro(slug, indice);
  return indice;
}

function carregar(slug: SlugCoberto): Carregado {
  const guardado = emMemoria.get(slug);
  if (guardado) return guardado;
  const leitor = ARQUIVOS[slug];
  if (!leitor) throw new Error(`Bairro sem índice cadastral: ${String(slug)}`);
  const indice = checarIndiceRaso(slug, leitor());
  const carregado = { indice, porId: indexarPorId(slug, indice.edificios) };
  emMemoria.set(slug, carregado);
  return carregado;
}

function carregarMeta(): MetaDoIndice {
  if (metaEmMemoria) return metaEmMemoria;
  // O meta.json tem meia dúzia de linhas: a validação completa é de graça.
  const resultado = esquemaMetaDoIndice.safeParse(ARQUIVO_META());
  if (!resultado.success) throw new Error(descreverFalha("meta.json", resultado.error.issues));
  metaEmMemoria = resultado.data;
  return metaEmMemoria;
}

/** O índice inteiro do bairro (edifícios, contexto e obras). Checa o formato no primeiro acesso. */
export function indiceDoBairro(slug: SlugCoberto): IndiceDoBairro {
  return carregar(slug).indice;
}

/** Edifícios do bairro, ordenados por `id`, como o script os grava. */
export function edificiosDoBairro(slug: SlugCoberto): Edificio[] {
  return carregar(slug).indice.edificios;
}

export function contextoDoBairro(slug: SlugCoberto): ContextoDoBairro {
  return carregar(slug).indice.contexto;
}

/** v1.1: a camada "A rua" do bairro (setores, LUSE, iluminação, coleta, Defesa Civil), ou null num índice da v1.0. */
export function ruaDoBairro(slug: SlugCoberto): RuaDoBairro | null {
  return carregar(slug).indice.rua ?? null;
}

/**
 * Acha um edifício pelo `id` (`${Código Logradouro}-${numero}`). Sem `bairro`, procura nos cinco, começando pelos
 * que já estão em memória; com `bairro`, só nele. Devolve null quando o id não está no índice. Um bairro inválido
 * não esconde um id achado em outro; só lança quando o id não apareceu em nenhum e algum arquivo falhou.
 */
export function edificioPorId(id: string, bairro?: SlugCoberto): Edificio | null {
  if (bairro) return carregar(bairro).porId.get(id) ?? null;
  const ordem = [...BAIRROS_COBERTOS].sort((a, b) => Number(emMemoria.has(b)) - Number(emMemoria.has(a)));
  let falha: unknown = null;
  for (const slug of ordem) {
    try {
      const achado = carregar(slug).porId.get(id);
      if (achado) return achado;
    } catch (erro) {
      falha ??= erro;
    }
  }
  if (falha) throw falha;
  return null;
}

/**
 * Meta do índice (fontes, licença, datas). Lida e validada só quando um campo é acessado, para que importar
 * este módulo nunca falhe por causa de um arquivo inválido.
 */
export const META: MetaDoIndice = {
  get geradoEm() {
    return carregarMeta().geradoEm;
  },
  get fontes() {
    return carregarMeta().fontes;
  },
  /** v1.1: as bases da seção "A rua"; ausente num índice da v1.0. */
  get fontesDaRua() {
    return carregarMeta().fontesDaRua;
  },
};
