import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CHAVE_CARTEIRA,
  esquemaCarteira,
  type Carteira,
} from "../dados/contratos";
import { creditarDescarteNaCarteira, limitarExtrato } from "../dados/descarte";
import { gravarJson, guardarCopiaBruta, lerSeguro } from "./armazenamento";

/** Cópia do texto bruto de uma carteira que não pôde ser lida: `<prefixo>-<data>`. */
export const PREFIXO_BRUTO_CARTEIRA = "vereda-carteira-v1-bruto";

function criarCarteiraInicial(agora: Date): Carteira {
  return {
    saldo: 3,
    extrato: [
      {
        em: agora.toISOString(),
        tipo: "cota_inicial",
        analiseId: null,
        delta: 3,
      },
    ],
  };
}

/** O que as telas enxergam enquanto a carteira não foi lida, ou quando ela não pôde ser lida. Nunca é o saldo de ninguém. */
const SEM_LEITURA: Carteira = { saldo: 0, extrato: [] };

// ——— Carga da carteira ———————————————————————————————————————————————————————————————————————————————————————————
// Regra de ferro (a mesma do caderno): nada grava por cima de uma chave que não foi lida com sucesso. A carteira inicial
// (3 créditos) só nasce quando a chave não existe. Se existe e não pôde ser lida, as gravações ficam bloqueadas.

export type FalhaDaCargaDaCarteira =
  /** O armazenamento lançou erro na leitura. */
  | "armazenamento"
  /** A chave tem texto que não é JSON. */
  | "json_invalido"
  /** A chave tem JSON, mas não uma carteira válida (fora do esquema). */
  | "formato"
  /** A chave não existia e a carteira inicial não pôde ser gravada. */
  | "gravacao";

export type ResultadoDaCargaDaCarteira =
  | {
      ok: true;
      carteira: Carteira;
      /** `true` quando a chave não existia e a carteira inicial foi criada agora. */
      criada: boolean;
    }
  | {
      ok: false;
      falha: FalhaDaCargaDaCarteira;
      chave: string;
      /** Chave onde o texto bruto foi copiado, ou `null` se não havia texto ou não foi possível copiar. */
      copia: string | null;
    };

async function falhaDeLeitura(
  falha: FalhaDaCargaDaCarteira,
  texto: string | null,
  agora: Date,
): Promise<ResultadoDaCargaDaCarteira> {
  const copia = texto === null ? null : await guardarCopiaBruta(PREFIXO_BRUTO_CARTEIRA, texto, agora);
  return { ok: false, falha, chave: CHAVE_CARTEIRA, copia };
}

/**
 * Lê a carteira do armazenamento. Só grava quando a chave não existe (a carteira inicial); com a chave ilegível ou fora
 * do esquema, copia o texto bruto para `vereda-carteira-v1-bruto-<data>` e não toca na chave. Nunca lança.
 */
export async function carregarCarteira(agora: Date = new Date()): Promise<ResultadoDaCargaDaCarteira> {
  try {
    const leitura = await lerSeguro(CHAVE_CARTEIRA);
    if (leitura.estado === "ilegivel") return await falhaDeLeitura(leitura.motivo, leitura.texto, agora);

    if (leitura.estado === "lido") {
      const lida = esquemaCarteira.safeParse(leitura.valor);
      if (!lida.success) return await falhaDeLeitura("formato", leitura.texto, agora);
      return { ok: true, carteira: lida.data, criada: false };
    }

    // Chave ausente: primeiro uso. Gravar aqui não apaga nada.
    const inicial = criarCarteiraInicial(agora);
    try {
      await gravarJson(CHAVE_CARTEIRA, inicial);
    } catch {
      return { ok: false, falha: "gravacao", chave: CHAVE_CARTEIRA, copia: null };
    }
    return { ok: true, carteira: inicial, criada: true };
  } catch {
    return { ok: false, falha: "armazenamento", chave: CHAVE_CARTEIRA, copia: null };
  }
}

// ——— Textos para a pessoa (sem jargão: nada de "JSON", "esquema" ou "extrato bruto") ————————————————————————————————

const ERRO_BLOQUEADA =
  "Sua carteira de créditos não foi aberta com sucesso, então nada foi gravado. Recarregue o app antes de usar ou receber créditos.";
const ERRO_CARREGANDO = "Aguarde sua carteira de créditos carregar.";

function mensagemDeBloqueio(r: Extract<ResultadoDaCargaDaCarteira, { ok: false }>): string {
  const base =
    "Não foi possível abrir sua carteira de créditos neste aparelho. Nada foi apagado nem gravado por cima, e usar, receber e recarregar créditos ficam desligados até você recarregar o app.";
  return r.copia ? `${base} Uma cópia do conteúdo original ficou guardada à parte.` : base;
}

// ——— Provedor ————————————————————————————————————————————————————————————————————————————————————————————————————

interface ContextoCarteira {
  /** Com a carteira bloqueada ou ainda não lida, é uma carteira vazia (sem saldo): não é o saldo da pessoa. */
  carteira: Carteira;
  saldo: number;
  pronto: boolean;
  /**
   * Preenchido só quando a carteira NÃO foi lida com sucesso: debitar, creditar e recarregar estão bloqueados. Quem
   * mostra `erro` no lugar do saldo pode fazê-lo: nesse estado o `saldo` (0) é falta de leitura, não o da pessoa.
   */
  erro: string;
  /** `true` quando debitar, creditar e recarregar estão bloqueados porque a leitura da carteira falhou. */
  bloqueada: boolean;
  /** Uma alteração com a carteira bloqueada rejeita com uma mensagem em linguagem de gente (`erro`). */
  debitarDossie: (analiseId: string) => Promise<boolean>;
  /** +1 crédito pelo descarte, uma única vez por análise. Devolve `true` só quando creditou agora. */
  creditarDescarte: (analiseId: string) => Promise<boolean>;
  recarregarTeste: () => Promise<void>;
  /** Lê a carteira de novo (depois de uma falha de leitura, por exemplo). Entra na mesma fila das gravações. */
  recarregar: () => Promise<void>;
}

type EstadoDaCarga = "carregando" | "ok" | "bloqueada";

const Contexto = createContext<ContextoCarteira | null>(null);

export function CarteiraNoAparelho({ children }: { children: ReactNode }) {
  const [carteira, setCarteira] = useState<Carteira>(SEM_LEITURA);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState("");
  const atual = useRef<Carteira>(SEM_LEITURA);
  const fila = useRef<Promise<void>>(Promise.resolve());
  const carga = useRef<EstadoDaCarga>("carregando");
  const iniciou = useRef(false);

  const abrirCarteira = useCallback(async (): Promise<void> => {
    carga.current = "carregando";
    const resultado = await carregarCarteira(new Date());

    if (!resultado.ok) {
      carga.current = "bloqueada";
      atual.current = SEM_LEITURA;
      setCarteira(SEM_LEITURA);
      setErro(mensagemDeBloqueio(resultado));
      setPronto(true);
      return;
    }

    atual.current = resultado.carteira;
    carga.current = "ok";
    setCarteira(resultado.carteira);
    setErro("");
    setPronto(true);
  }, []);

  useEffect(() => {
    // A carga é a primeira tarefa da fila: toda alteração só roda depois dela terminar (e confere o resultado). Antes
    // dela, `atual` é só uma carteira vazia, e gravar em cima apagaria a carteira guardada.
    if (iniciou.current) return;
    iniciou.current = true;
    fila.current = fila.current.then(abrirCarteira).catch(() => {});
  }, [abrirCarteira]);

  const recarregar = useCallback((): Promise<void> => {
    const tarefa = fila.current.then(abrirCarteira);
    fila.current = tarefa.catch(() => {});
    return tarefa;
  }, [abrirCarteira]);

  const alterar = useCallback(
    (fn: (c: Carteira) => Carteira) => {
      const tarefa = fila.current.then(async () => {
        // Antes de cada gravação: a carga terminou com sucesso? Se não, a chave da carteira não foi lida e gravar por
        // cima apagaria o que há nela (saldo e extrato).
        if (carga.current !== "ok") {
          throw new Error(carga.current === "bloqueada" ? ERRO_BLOQUEADA : ERRO_CARREGANDO);
        }
        const proxima = fn(atual.current);
        if (proxima === atual.current) return;
        const validada = esquemaCarteira.parse(proxima);
        await gravarJson(CHAVE_CARTEIRA, validada);
        atual.current = validada;
        setCarteira(validada);
      });
      fila.current = tarefa.catch(() => {});
      return tarefa;
    },
    [],
  );

  const debitarDossie = useCallback(
    async (analiseId: string): Promise<boolean> => {
      let debitou = false;
      // O saldo é conferido dentro da fila: duas confirmações seguidas com 1 crédito não debitam as duas.
      await alterar((c) => {
        if (c.saldo <= 0) return c;
        debitou = true;
        return {
          saldo: c.saldo - 1,
          // O corte do extrato nunca tira as linhas de dossiê e de descarte (ver `limitarExtrato`).
          extrato: limitarExtrato([
            { em: new Date().toISOString(), tipo: "dossie_cadastral" as const, analiseId, delta: -1 },
            ...c.extrato,
          ]),
        };
      });
      return debitou;
    },
    [alterar],
  );

  const creditarDescarte = useCallback(
    async (analiseId: string): Promise<boolean> => {
      let creditou = false;
      // A decisão sai da carteira que a fila enxerga (a mais recente), não do estado da tela: duas chamadas
      // seguidas para a mesma análise creditam uma vez só.
      await alterar((c) => {
        const proxima = creditarDescarteNaCarteira(c, analiseId, new Date());
        creditou = proxima !== c;
        return proxima;
      });
      return creditou;
    },
    [alterar],
  );

  const recarregarTeste = useCallback(async (): Promise<void> => {
    await alterar((c) => ({
      saldo: Math.min(999, c.saldo + 3),
      extrato: limitarExtrato([
        {
          em: new Date().toISOString(),
          tipo: "recarga_de_teste" as const,
          analiseId: null,
          delta: 3,
        },
        ...c.extrato,
      ]),
    }));
  }, [alterar]);

  return (
    <Contexto.Provider
      value={{
        carteira,
        saldo: carteira.saldo,
        pronto,
        erro,
        bloqueada: erro !== "",
        debitarDossie,
        creditarDescarte,
        recarregarTeste,
        recarregar,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useCarteira(): ContextoCarteira {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useCarteira fora de CarteiraNoAparelho");
  return valor;
}
