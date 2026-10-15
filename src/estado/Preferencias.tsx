import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import type { EstadoForcado } from "../dados/estadoDoFato";
import { gravarJson, lerJson } from "./armazenamento";

export type { EstadoForcado };

const CHAVE = "vereda-mock-preferencias";

const esquema = z.object({
  tema: z.enum(["sistema", "claro", "escuro"]).default("sistema"),
  final: z.boolean().default(true),
});

type Persistidas = z.infer<typeof esquema>;
export type PreferenciaDeTema = Persistidas["tema"];

type ValorDasPreferencias = Persistidas & {
  carregadas: boolean;
  forcado: EstadoForcado;
  mudar: (mudanca: Partial<Persistidas>) => void;
  forcar: (estado: EstadoForcado) => void;
};

const Contexto = createContext<ValorDasPreferencias | null>(null);

export function PreferenciasDoMock({ children }: { children: ReactNode }) {
  const [persistidas, setPersistidas] = useState<Persistidas>({ tema: "sistema", final: true });
  const [carregadas, setCarregadas] = useState(false);
  const [forcado, forcar] = useState<EstadoForcado>("padrao");

  useEffect(() => {
    void lerJson(CHAVE).then((bruto) => {
      const lidas = esquema.safeParse(bruto ?? {});
      if (lidas.success) setPersistidas(lidas.data);
      setCarregadas(true);
    });
  }, []);

  const mudar = useCallback((mudanca: Partial<Persistidas>) => {
    setPersistidas((atuais) => {
      const novas = { ...atuais, ...mudanca };
      void gravarJson(CHAVE, novas);
      return novas;
    });
  }, []);

  const valor = useMemo(
    () => ({ ...persistidas, carregadas, forcado, mudar, forcar }),
    [persistidas, carregadas, forcado, mudar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePreferencias(): ValorDasPreferencias {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("usePreferencias fora de PreferenciasDoMock");
  return valor;
}
