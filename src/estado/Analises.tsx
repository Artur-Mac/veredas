import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import { useAviso } from "../componentes/casca/Aviso";
import { esquemaAnalise } from "../dados/analise";
import {
  CHAVE_ANALISES_V2,
  esquemaAnaliseV2,
  type AnaliseV2,
} from "../dados/contratos";
import { migrarAnaliseV1 } from "../dados/migracao";
import {
  acrescentarNaQuarentena,
  gravarJson,
  guardarCopiaBruta,
  lerSeguro,
} from "./armazenamento";

export const CHAVE_ANALISES_V1 = "vereda-analises-v1";
export const CHAVE_ATIVA = "vereda-ativa-v1";
/** Itens do caderno que não passaram no esquema: guardados intactos, só acrescentados, nunca sobrescritos. */
export const CHAVE_QUARENTENA = "vereda-analises-v2-quarentena";
/** Cópia do texto bruto de uma chave que não pôde ser lida: `<prefixo>-<data>`. */
export const PREFIXO_BRUTO_V2 = "vereda-analises-v2-bruto";
export const PREFIXO_BRUTO_V1 = "vereda-analises-v1-bruto";

// ——— Carga do caderno ——————————————————————————————————————————————————————————————————————————————————————————
// Regra de ferro: nada grava por cima de uma chave que não foi lida com sucesso. Um item ruim não derruba o caderno;
// uma leitura que falha bloqueia as gravações em vez de tratar o caderno como vazio.

export type FalhaDaCarga =
  /** O armazenamento lançou erro na leitura. */
  | "armazenamento"
  /** A chave tem texto que não é JSON. */
  | "json_invalido"
  /** A chave tem JSON, mas não uma lista. */
  | "formato"
  /** Itens inválidos não puderam ser guardados à parte; sem isso, a próxima gravação os apagaria. */
  | "quarentena"
  /** A migração v1 -> v2 não conseguiu gravar a v2 (a v1 continua intacta). */
  | "gravacao";

export type ResultadoDaCarga =
  | {
      ok: true;
      lista: AnaliseV2[];
      /** Itens que não passaram no esquema e foram para a quarentena nesta carga. */
      quarentenadas: number;
      /** Itens da v1 migrados nesta carga. */
      migradas: number;
    }
  | {
      ok: false;
      falha: FalhaDaCarga;
      /** Chave que não pôde ser lida (ou gravada). */
      chave: string;
      /** Chave onde o texto bruto foi copiado, ou `null` se não foi possível copiar. */
      copia: string | null;
    };

async function falhaDeLeitura(
  chave: string,
  prefixoDaCopia: string,
  falha: FalhaDaCarga,
  texto: string | null,
  agora: Date,
): Promise<ResultadoDaCarga> {
  const copia = texto === null ? null : await guardarCopiaBruta(prefixoDaCopia, texto, agora);
  return { ok: false, falha, chave, copia };
}

/** `true` se os itens estão a salvo na quarentena (ou se não havia nenhum). */
async function guardarNaQuarentena(itens: readonly unknown[], agora: Date): Promise<boolean> {
  try {
    await acrescentarNaQuarentena(CHAVE_QUARENTENA, itens, agora);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lê o caderno do armazenamento item a item. Não grava nada na chave v2, exceto a migração v1 -> v2 (quando a v2 ainda
 * não existe) e só depois de os itens ruins estarem na quarentena. Nunca lança.
 */
export async function carregarAnalises(agora: Date = new Date()): Promise<ResultadoDaCarga> {
  try {
    const v2 = await lerSeguro(CHAVE_ANALISES_V2);
    if (v2.estado === "ilegivel") {
      return await falhaDeLeitura(CHAVE_ANALISES_V2, PREFIXO_BRUTO_V2, v2.motivo, v2.texto, agora);
    }

    if (v2.estado === "lido") {
      if (!Array.isArray(v2.valor)) {
        return await falhaDeLeitura(CHAVE_ANALISES_V2, PREFIXO_BRUTO_V2, "formato", v2.texto, agora);
      }
      const lista: AnaliseV2[] = [];
      const invalidos: unknown[] = [];
      for (const item of v2.valor as unknown[]) {
        const lido = esquemaAnaliseV2.safeParse(item);
        if (lido.success) lista.push(lido.data);
        else invalidos.push(item);
      }
      if (!(await guardarNaQuarentena(invalidos, agora))) {
        return { ok: false, falha: "quarentena", chave: CHAVE_QUARENTENA, copia: null };
      }
      return { ok: true, lista, quarentenadas: invalidos.length, migradas: 0 };
    }

    // Sem v2: primeira carga depois da v1. A v1 só é lida, nunca alterada nem apagada.
    const v1 = await lerSeguro(CHAVE_ANALISES_V1);
    if (v1.estado === "ausente") return { ok: true, lista: [], quarentenadas: 0, migradas: 0 };
    if (v1.estado === "ilegivel") {
      return await falhaDeLeitura(CHAVE_ANALISES_V1, PREFIXO_BRUTO_V1, v1.motivo, v1.texto, agora);
    }
    if (!Array.isArray(v1.valor)) {
      return await falhaDeLeitura(CHAVE_ANALISES_V1, PREFIXO_BRUTO_V1, "formato", v1.texto, agora);
    }
    const itensV1 = v1.valor as unknown[];
    if (itensV1.length === 0) return { ok: true, lista: [], quarentenadas: 0, migradas: 0 };

    const migradas: AnaliseV2[] = [];
    const invalidos: unknown[] = [];
    for (const item of itensV1) {
      const lido = esquemaAnalise.safeParse(item);
      if (!lido.success) {
        invalidos.push(item);
        continue;
      }
      try {
        migradas.push(migrarAnaliseV1(lido.data, agora));
      } catch {
        invalidos.push(item);
      }
    }
    // Primeiro os ruins a salvo, depois a v2: se a v2 não for gravada, a próxima carga refaz tudo sem duplicar nada.
    if (!(await guardarNaQuarentena(invalidos, agora))) {
      return { ok: false, falha: "quarentena", chave: CHAVE_QUARENTENA, copia: null };
    }
    try {
      await gravarJson(CHAVE_ANALISES_V2, migradas);
    } catch {
      return { ok: false, falha: "gravacao", chave: CHAVE_ANALISES_V2, copia: null };
    }
    return { ok: true, lista: migradas, quarentenadas: invalidos.length, migradas: migradas.length };
  } catch {
    return { ok: false, falha: "armazenamento", chave: CHAVE_ANALISES_V2, copia: null };
  }
}

// ——— Textos para a pessoa (sem jargão: nada de "JSON", "esquema" ou "quarentena") ————————————————————————————————

const ERRO_BLOQUEADO =
  "Seu caderno não foi aberto com sucesso, então nada foi gravado. Recarregue o app antes de salvar ou remover.";
const ERRO_CARREGANDO = "Aguarde suas análises carregarem.";

function mensagemDeBloqueio(r: Extract<ResultadoDaCarga, { ok: false }>): string {
  const base =
    "Não foi possível abrir seu caderno neste aparelho. Nada foi apagado nem gravado por cima, e salvar e remover ficam desligados até você recarregar o app.";
  return r.copia ? `${base} Uma cópia do conteúdo original ficou guardada à parte.` : base;
}

function avisoDaQuarentena(quarentenadas: number, abertas: number): string {
  if (quarentenadas <= 0) return "";
  const fato =
    quarentenadas === 1
      ? "1 análise não pôde ser aberta e foi guardada à parte."
      : `${quarentenadas} análises não puderam ser abertas e foram guardadas à parte.`;
  return abertas > 0 ? `${fato} As outras continuam no seu caderno.` : fato;
}

// ——— Provedor ——————————————————————————————————————————————————————————————————————————————————————————————————

interface ContextoAnalises {
  lista: AnaliseV2[];
  ativa: string | null;
  analiseAtiva: AnaliseV2 | null;
  pronto: boolean;
  /**
   * Preenchido só quando o caderno NÃO foi lido com sucesso: salvar e remover estão bloqueados. Quem mostra `erro` no
   * lugar do conteúdo pode fazê-lo: nesse estado a lista está vazia por falta de leitura, não por escolha da pessoa.
   */
  erro: string;
  /**
   * Aviso que não bloqueia nada: "N análises não puderam ser abertas e foram guardadas à parte". Vazio quando não há
   * o que avisar. Continua preenchido até a próxima abertura do app.
   */
  aviso: string;
  /** `true` quando salvar e remover estão bloqueados porque a leitura do caderno falhou. */
  bloqueada: boolean;
  definirAtiva: (id: string | null) => Promise<void>;
  salvar: (a: AnaliseV2) => Promise<void>;
  remover: (id: string) => Promise<void>;
  /** Lê o caderno de novo (depois de uma falha de leitura, por exemplo). Entra na mesma fila das gravações. */
  recarregar: () => Promise<void>;
}

type EstadoDaCarga = "carregando" | "ok" | "bloqueada";

const Contexto = createContext<ContextoAnalises | null>(null);

export function AnalisesNoAparelho({ children }: { children: ReactNode }) {
  const { mostrarAviso } = useAviso();
  const [lista, setLista] = useState<AnaliseV2[]>([]);
  const [ativa, setAtiva] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const atual = useRef<AnaliseV2[]>([]);
  const fila = useRef<Promise<void>>(Promise.resolve());
  const carga = useRef<EstadoDaCarga>("carregando");
  const iniciou = useRef(false);

  const abrirCaderno = useCallback(async (): Promise<void> => {
    carga.current = "carregando";
    const resultado = await carregarAnalises(new Date());

    if (!resultado.ok) {
      carga.current = "bloqueada";
      atual.current = [];
      setLista([]);
      setAtiva(null);
      setAviso("");
      setErro(mensagemDeBloqueio(resultado));
      setPronto(true);
      return;
    }

    let idAtivo: string | null = null;
    try {
      idAtivo = await AsyncStorage.getItem(CHAVE_ATIVA);
    } catch {
      idAtivo = null; // é só o ponteiro da análise aberta; sem ele, abre a primeira
    }
    const carregadas = resultado.lista;
    atual.current = carregadas;
    carga.current = "ok";
    setLista(carregadas);
    setAtiva(idAtivo && carregadas.some((a) => a.id === idAtivo) ? idAtivo : (carregadas[0]?.id ?? null));
    setErro("");
    setAviso(avisoDaQuarentena(resultado.quarentenadas, carregadas.length));
    setPronto(true);
  }, []);

  useEffect(() => {
    // A carga é a primeira tarefa da fila: salvar e remover só rodam depois dela terminar (e conferem o resultado).
    if (iniciou.current) return;
    iniciou.current = true;
    fila.current = fila.current.then(abrirCaderno).catch(() => {});
  }, [abrirCaderno]);

  // A mensagem fica no contexto (`aviso`) para as telas; o toast é o que aparece mesmo sem nenhuma delas mostrá-la.
  useEffect(() => {
    if (aviso) mostrarAviso(aviso);
  }, [aviso, mostrarAviso]);

  const recarregar = useCallback((): Promise<void> => {
    const tarefa = fila.current.then(abrirCaderno);
    fila.current = tarefa.catch(() => {});
    return tarefa;
  }, [abrirCaderno]);

  const alterar = useCallback((fn: (lista: AnaliseV2[]) => AnaliseV2[]) => {
    const tarefa = fila.current.then(async () => {
      // Antes de cada gravação: a carga terminou com sucesso? Se não, a chave do caderno não foi lida e gravar por cima
      // apagaria o que há nela.
      if (carga.current !== "ok") {
        throw new Error(carga.current === "bloqueada" ? ERRO_BLOQUEADO : ERRO_CARREGANDO);
      }
      const novas = fn(atual.current);
      const validadas = z.array(esquemaAnaliseV2).parse(novas);
      await gravarJson(CHAVE_ANALISES_V2, validadas);
      atual.current = validadas;
      setLista(validadas);
    });
    fila.current = tarefa.catch(() => {});
    return tarefa;
  }, []);

  const salvar = useCallback(
    async (a: AnaliseV2): Promise<void> => {
      const validada = esquemaAnaliseV2.parse(a);
      await alterar((anterior) => [
        validada,
        ...anterior.filter((x) => x.id !== validada.id),
      ]);
      setAtiva(validada.id);
      await AsyncStorage.setItem(CHAVE_ATIVA, validada.id);
    },
    [alterar],
  );

  const remover = useCallback(
    async (id: string): Promise<void> => {
      await alterar((anterior) => anterior.filter((x) => x.id !== id));
      if (ativa === id) {
        const restante = atual.current.filter((x) => x.id !== id);
        const novoId = restante[0]?.id ?? null;
        setAtiva(novoId);
        if (novoId) {
          await AsyncStorage.setItem(CHAVE_ATIVA, novoId);
        } else {
          await AsyncStorage.removeItem(CHAVE_ATIVA);
        }
      }
    },
    [alterar, ativa],
  );

  const definirAtiva = useCallback(async (id: string | null): Promise<void> => {
    setAtiva(id);
    // Com o caderno bloqueado (ou ainda abrindo), o ponteiro guardado não é tocado: ele não foi lido com sucesso.
    if (carga.current !== "ok") return;
    if (id) {
      await AsyncStorage.setItem(CHAVE_ATIVA, id);
    } else {
      await AsyncStorage.removeItem(CHAVE_ATIVA);
    }
  }, []);

  const analiseAtiva = lista.find((a) => a.id === ativa) ?? null;

  return (
    <Contexto.Provider
      value={{
        lista,
        ativa,
        analiseAtiva,
        pronto,
        erro,
        aviso,
        bloqueada: erro !== "",
        definirAtiva,
        salvar,
        remover,
        recarregar,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useAnalises(): ContextoAnalises {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useAnalises fora de AnalisesNoAparelho");
  return valor;
}
