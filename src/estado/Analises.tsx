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
import { esquemaAnalise } from "../dados/analise";
import {
  CHAVE_ANALISES_V2,
  esquemaAnaliseV2,
  type AnaliseV2,
} from "../dados/contratos";
import { migrarAnaliseV1 } from "../dados/migracao";
import { gravarJson, lerJson } from "./armazenamento";

const CHAVE_ANALISES_V1 = "vereda-analises-v1";
const CHAVE_ATIVA = "vereda-ativa-v1";

interface ContextoAnalises {
  lista: AnaliseV2[];
  ativa: string | null;
  analiseAtiva: AnaliseV2 | null;
  pronto: boolean;
  erro: string;
  definirAtiva: (id: string | null) => Promise<void>;
  salvar: (a: AnaliseV2) => Promise<void>;
  remover: (id: string) => Promise<void>;
}

const Contexto = createContext<ContextoAnalises | null>(null);

export function AnalisesNoAparelho({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<AnaliseV2[]>([]);
  const [ativa, setAtiva] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState("");
  const atual = useRef<AnaliseV2[]>([]);
  const fila = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    async function inicializar() {
      try {
        let carregadas: AnaliseV2[] = [];
        const brutoV2 = await lerJson(CHAVE_ANALISES_V2);

        if (brutoV2 !== null && Array.isArray(brutoV2)) {
          carregadas = z.array(esquemaAnaliseV2).parse(brutoV2);
        } else {
          // Migração v1 -> v2 na primeira carga sem v2
          const brutoV1 = await lerJson(CHAVE_ANALISES_V1);
          if (brutoV1 !== null && Array.isArray(brutoV1) && brutoV1.length > 0) {
            const agora = new Date();
            const migradas: AnaliseV2[] = [];
            for (const item of brutoV1) {
              const resV1 = esquemaAnalise.safeParse(item);
              if (resV1.success) {
                migradas.push(migrarAnaliseV1(resV1.data, agora));
              }
            }
            carregadas = migradas;
            // Salva v2 sem apagar v1
            await gravarJson(CHAVE_ANALISES_V2, carregadas);
          }
        }

        atual.current = carregadas;
        setLista(carregadas);

        // Recupera ID ativo
        const idAtivo = await AsyncStorage.getItem(CHAVE_ATIVA);
        if (idAtivo && carregadas.some((a) => a.id === idAtivo)) {
          setAtiva(idAtivo);
        } else if (carregadas.length > 0) {
          const primeiroId = carregadas[0]?.id ?? null;
          setAtiva(primeiroId);
        } else {
          setAtiva(null);
        }

        setPronto(true);
      } catch {
        setErro(
          "Não foi possível abrir suas análises. Recarregue para tentar novamente; os dados existentes foram preservados.",
        );
        setPronto(true);
      }
    }

    void inicializar();
  }, []);

  const alterar = useCallback(
    (fn: (lista: AnaliseV2[]) => AnaliseV2[]) => {
      const tarefa = fila.current.then(async () => {
        if (!pronto) throw new Error("Aguarde suas análises carregarem.");
        const novas = fn(atual.current);
        const validadas = z.array(esquemaAnaliseV2).parse(novas);
        await gravarJson(CHAVE_ANALISES_V2, validadas);
        atual.current = validadas;
        setLista(validadas);
        setErro("");
      });
      fila.current = tarefa.catch(() => {});
      return tarefa;
    },
    [pronto],
  );

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
        definirAtiva,
        salvar,
        remover,
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
