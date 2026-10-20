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
import { creditarDescarteNaCarteira } from "../dados/descarte";
import { gravarJson, lerJson } from "./armazenamento";

function criarCarteiraInicial(): Carteira {
  return {
    saldo: 3,
    extrato: [
      {
        em: new Date().toISOString(),
        tipo: "cota_inicial",
        analiseId: null,
        delta: 3,
      },
    ],
  };
}

interface ContextoCarteira {
  carteira: Carteira;
  saldo: number;
  pronto: boolean;
  debitarDossie: (analiseId: string) => Promise<boolean>;
  /** +1 crédito pelo descarte, uma única vez por análise. Devolve `true` só quando creditou agora. */
  creditarDescarte: (analiseId: string) => Promise<boolean>;
  recarregarTeste: () => Promise<void>;
}

const Contexto = createContext<ContextoCarteira | null>(null);

export function CarteiraNoAparelho({ children }: { children: ReactNode }) {
  const [carteira, setCarteira] = useState<Carteira>(() => criarCarteiraInicial());
  const [pronto, setPronto] = useState(false);
  const atual = useRef<Carteira>(carteira);
  const fila = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const carga = lerJson(CHAVE_CARTEIRA)
      .then(async (bruto) => {
        if (!bruto) {
          const inicial = criarCarteiraInicial();
          await gravarJson(CHAVE_CARTEIRA, inicial);
          atual.current = inicial;
          setCarteira(inicial);
        } else {
          const parsed = esquemaCarteira.parse(bruto);
          atual.current = parsed;
          setCarteira(parsed);
        }
        setPronto(true);
      })
      .catch(() => {
        const fallback = criarCarteiraInicial();
        atual.current = fallback;
        setCarteira(fallback);
        setPronto(true);
      });
    // Toda alteração entra na fila depois da leitura: antes dela, `atual` é só o saldo inicial de mentira e
    // gravar em cima apagaria a carteira guardada.
    fila.current = fila.current.then(() => carga);
  }, []);

  const alterar = useCallback(
    (fn: (c: Carteira) => Carteira) => {
      const tarefa = fila.current.then(async () => {
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
          extrato: [
            { em: new Date().toISOString(), tipo: "dossie_cadastral" as const, analiseId, delta: -1 },
            ...c.extrato,
          ].slice(0, 500),
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
      extrato: [
        {
          em: new Date().toISOString(),
          tipo: "recarga_de_teste" as const,
          analiseId: null,
          delta: 3,
        },
        ...c.extrato,
      ].slice(0, 500),
    }));
  }, [alterar]);

  return (
    <Contexto.Provider
      value={{
        carteira,
        saldo: carteira.saldo,
        pronto,
        debitarDossie,
        creditarDescarte,
        recarregarTeste,
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
