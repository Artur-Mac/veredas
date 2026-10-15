import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import { apagar, gravarJson, lerJson } from "./armazenamento";

const CHAVE = "vereda-mock";

const esquema = z.object({
  contestacoes: z.record(z.string(), z.object({ data: z.string(), motivo: z.string() })).default({}),
  lotesConfirmados: z.record(z.string(), z.boolean()).default({}),
  roteiro: z.record(z.string(), z.array(z.number().int())).default({}),
  roteiroExtra: z.record(z.string(), z.array(z.string())).default({}),
  mensagem: z.record(z.string(), z.string()).default({}),
  destinos: z.array(z.object({ nome: z.string(), coordenada: z.tuple([z.number(), z.number()]) })).default([]),
  domicilio: z
    .object({
      pessoas: z.string().optional(),
      veiculos: z.string().optional(),
      crianca: z.boolean().optional(),
      deslocamento: z.boolean().optional(),
      pet: z.boolean().optional(),
    })
    .default({}),
  apagado: z.boolean().default(false),
});

export type DadosDoAparelho = z.infer<typeof esquema>;
export type Destino = DadosDoAparelho["destinos"][number];
export type Domicilio = DadosDoAparelho["domicilio"];

const VAZIO: DadosDoAparelho = esquema.parse({});

type ValorDoAparelho = {
  dados: DadosDoAparelho;
  carregado: boolean;
  mudar: (mudanca: (atuais: DadosDoAparelho) => Partial<DadosDoAparelho>) => void;
  apagarTudo: () => void;
  restaurar: () => void;
};

const Contexto = createContext<ValorDoAparelho | null>(null);

export function DadosNoAparelho({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<DadosDoAparelho>(VAZIO);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    void lerJson(CHAVE).then((bruto) => {
      const lidos = esquema.safeParse(bruto ?? {});
      if (lidos.success) setDados(lidos.data);
      setCarregado(true);
    });
  }, []);

  const mudar = useCallback((mudanca: (atuais: DadosDoAparelho) => Partial<DadosDoAparelho>) => {
    setDados((atuais) => {
      const novos = { ...atuais, ...mudanca(atuais) };
      void gravarJson(CHAVE, novos);
      return novos;
    });
  }, []);

  const apagarTudo = useCallback(() => {
    const novos = { ...VAZIO, apagado: true };
    setDados(novos);
    void gravarJson(CHAVE, novos);
  }, []);

  const restaurar = useCallback(() => {
    setDados(VAZIO);
    void apagar(CHAVE);
  }, []);

  const valor = useMemo(
    () => ({ dados, carregado, mudar, apagarTudo, restaurar }),
    [dados, carregado, mudar, apagarTudo, restaurar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAparelho(): ValorDoAparelho {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useAparelho fora de DadosNoAparelho");
  return valor;
}

export function chaveDoFato(idDossie: string, idFato: string): string {
  return `${idDossie}/${idFato}`;
}
