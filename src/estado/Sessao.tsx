import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Regua } from "../dados/esquema";

export type EscolhaDaRegua = { recorte: Regua["recorte"]; periodo: Regua["periodo_meses"] };

type EstadoDaSessao = {
  selecao: string[];
  selecionando: boolean;
  abertas: Record<string, string[]>;
  natureza: string[];
  recebido: string | null;
  regua: Record<string, EscolhaDaRegua>;
};

type ValorDaSessao = EstadoDaSessao & {
  mudar: (mudanca: (atual: EstadoDaSessao) => Partial<EstadoDaSessao>) => void;
  alternarSecao: (idDossie: string, idSecao: string) => void;
  abrirSecao: (idDossie: string, idSecao: string) => void;
};

const INICIAL: EstadoDaSessao = {
  selecao: [],
  selecionando: false,
  abertas: {},
  natureza: [],
  recebido: null,
  regua: {},
};

const Contexto = createContext<ValorDaSessao | null>(null);

export function SessaoDoApp({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoDaSessao>(INICIAL);

  const mudar = useCallback((mudanca: (atual: EstadoDaSessao) => Partial<EstadoDaSessao>) => {
    setEstado((atual) => ({ ...atual, ...mudanca(atual) }));
  }, []);

  const alternarSecao = useCallback(
    (idDossie: string, idSecao: string) =>
      mudar((atual) => {
        const lista = atual.abertas[idDossie] ?? [];
        const nova = lista.includes(idSecao) ? lista.filter((s) => s !== idSecao) : [...lista, idSecao];
        return { abertas: { ...atual.abertas, [idDossie]: nova } };
      }),
    [mudar],
  );

  const abrirSecao = useCallback(
    (idDossie: string, idSecao: string) =>
      mudar((atual) => {
        const lista = atual.abertas[idDossie] ?? [];
        return lista.includes(idSecao) ? {} : { abertas: { ...atual.abertas, [idDossie]: [...lista, idSecao] } };
      }),
    [mudar],
  );

  const valor = useMemo(
    () => ({ ...estado, mudar, alternarSecao, abrirSecao }),
    [estado, mudar, alternarSecao, abrirSecao],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ValorDaSessao {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useSessao fora de SessaoDoApp");
  return valor;
}
