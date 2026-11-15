import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import { apagar, gravarJson, lerJson } from "./armazenamento";

/** Começa com "vereda-" para entrar automaticamente em `apagarDadosDoAparelho()`. */
export const CHAVE_PERFIL_DOMICILIO = "vereda-perfil-domicilio-v1";

export const esquemaUsoAr = z.enum(["nenhum", "noite_1_quarto", "intenso_2_quartos"]);
export type UsoArCondicionado = z.infer<typeof esquemaUsoAr>;

export const esquemaModoTransporte = z.enum(["transporte_publico", "carro_moto", "app", "a_pe_bike"]);
export type ModoDeTransporte = z.infer<typeof esquemaModoTransporte>;

export const esquemaPerfilDomicilio = z.strictObject({
  versao: z.literal(1).default(1),
  /** Marca se a pessoa já personalizou o perfil da casa ao menos uma vez neste aparelho. */
  configurado: z.boolean().default(false),
  moradores: z.number().int().min(1).max(8).default(2),
  usoArCondicionado: esquemaUsoAr.default("noite_1_quarto"),
  /** Slug de bairro do Recife onde trabalha/estuda com mais frequência (ex.: "recife", "boa-viagem"), ou null. */
  destinoBairro: z.string().nullable().default(null),
  modoTransporte: esquemaModoTransporte.default("transporte_publico"),
  diasPresenciaisMes: z.number().int().min(0).max(30).default(20),
  /** Percentual de entrada para simulação de financiamento na compra (10% a 80%). */
  entradaPercentualCompra: z.number().min(10).max(80).default(20),
  /** Prazo em anos para simulação de financiamento na compra (5 a 35 anos). */
  prazoAnosCompra: z.number().int().min(5).max(35).default(30),
  /** Teto mensal pessoal opcional definido pela pessoa (sem julgamento sobre o imóvel). */
  orcamentoMensalReais: z.number().positive().nullable().default(null),
  atualizadoEm: z.string().nullable().default(null),
});

export type PerfilDoDomicilio = z.infer<typeof esquemaPerfilDomicilio>;

export const PERFIL_DOMICILIO_PADRAO: PerfilDoDomicilio = esquemaPerfilDomicilio.parse({});

type ValorContextoPerfil = {
  perfil: PerfilDoDomicilio;
  carregado: boolean;
  salvarPerfil: (mudancas: Partial<Omit<PerfilDoDomicilio, "versao">>) => Promise<void>;
  limparPerfil: () => Promise<void>;
};

const PADRAO_FORA_DO_PROVEDOR: ValorContextoPerfil = {
  perfil: PERFIL_DOMICILIO_PADRAO,
  carregado: true,
  salvarPerfil: async () => undefined,
  limparPerfil: async () => undefined,
};

const ContextoPerfil = createContext<ValorContextoPerfil>(PADRAO_FORA_DO_PROVEDOR);

export function PerfilDoDomicilioNoAparelho({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<PerfilDoDomicilio>(PERFIL_DOMICILIO_PADRAO);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let ativo = true;
    void lerJson(CHAVE_PERFIL_DOMICILIO).then((bruto) => {
      if (!ativo) return;
      if (bruto && typeof bruto === "object") {
        const validado = esquemaPerfilDomicilio.safeParse(bruto);
        if (validado.success) setPerfil(validado.data);
      }
      setCarregado(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const salvarPerfil = useCallback(async (mudancas: Partial<Omit<PerfilDoDomicilio, "versao">>) => {
    const proximo = esquemaPerfilDomicilio.parse({
      ...perfil,
      ...mudancas,
      versao: 1,
      configurado: mudancas.configurado ?? true,
      atualizadoEm: new Date().toISOString(),
    });
    setPerfil(proximo);
    await gravarJson(CHAVE_PERFIL_DOMICILIO, proximo);
  }, [perfil]);

  const limparPerfil = useCallback(async () => {
    setPerfil(PERFIL_DOMICILIO_PADRAO);
    await apagar(CHAVE_PERFIL_DOMICILIO);
  }, []);

  const valor = useMemo(
    () => ({ perfil, carregado, salvarPerfil, limparPerfil }),
    [perfil, carregado, salvarPerfil, limparPerfil],
  );

  return <ContextoPerfil.Provider value={valor}>{children}</ContextoPerfil.Provider>;
}

/**
 * Lê o perfil único da casa salvo no aparelho (`T14`).
 * Se chamado em testes isolados sem provedor montado, devolve `PERFIL_DOMICILIO_PADRAO` sem lançar erro.
 */
export function usePerfilDomicilio(): ValorContextoPerfil {
  return useContext(ContextoPerfil);
}
