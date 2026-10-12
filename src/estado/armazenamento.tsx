import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import { z } from 'zod';

import { campoDeclaradoSchema, type CampoDeclarado } from '@/dominio/esquema';
import type { Resolucao } from '@/dominio/visao';

const chaveArmazenamento = 'propsight:estado:v1';

export const estadosDossie = ['em_analise', 'visita_marcada', 'visitado', 'descartado', 'fechado'] as const;

const estadoDossieSchema = z.enum(estadosDossie);
const preferenciaTemaSchema = z.enum(['sistema', 'claro', 'escuro']);

const resolucaoSchema = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('candidata'), candidata: z.string().min(1) }),
  z.strictObject({ tipo: z.literal('rua') }),
]);

const registroSchema = z.strictObject({
  estado: estadoDossieSchema,
  motivoDescarte: z.string().nullable(),
  resolucao: resolucaoSchema.nullable(),
  correcoes: z.partialRecord(campoDeclaradoSchema, z.string()),
  roteiro: z.record(z.string(), z.boolean()),
  contestacoes: z.array(z.strictObject({ cartaoId: z.string(), texto: z.string(), em: z.string() })),
  mensagem: z.string().nullable(),
});

const estadoSchema = z.strictObject({
  tema: preferenciaTemaSchema,
  dossies: z.record(z.string(), registroSchema),
});

export type EstadoDossie = z.infer<typeof estadoDossieSchema>;
export type PreferenciaTema = z.infer<typeof preferenciaTemaSchema>;
export type RegistroDossie = z.infer<typeof registroSchema>;
type EstadoApp = z.infer<typeof estadoSchema>;

export const registroInicial: RegistroDossie = {
  estado: 'em_analise',
  motivoDescarte: null,
  resolucao: null,
  correcoes: {},
  roteiro: {},
  contestacoes: [],
  mensagem: null,
};

const estadoInicial: EstadoApp = { tema: 'sistema', dossies: {} };

type Acao =
  | { tipo: 'hidratar'; estado: EstadoApp }
  | { tipo: 'definirTema'; tema: PreferenciaTema }
  | { tipo: 'definirEstado'; id: string; estado: EstadoDossie; motivo: string | null }
  | { tipo: 'resolver'; id: string; resolucao: Resolucao }
  | { tipo: 'corrigirCampo'; id: string; campo: CampoDeclarado; valor: string | null }
  | { tipo: 'marcarItem'; id: string; item: string; marcado: boolean }
  | { tipo: 'contestar'; id: string; cartaoId: string; texto: string; em: string }
  | { tipo: 'salvarMensagem'; id: string; texto: string | null };

function atualizarRegistro(
  estado: EstadoApp,
  id: string,
  mudar: (registro: RegistroDossie) => RegistroDossie,
): EstadoApp {
  const atual = estado.dossies[id] ?? registroInicial;
  return { ...estado, dossies: { ...estado.dossies, [id]: mudar(atual) } };
}

function redutor(estado: EstadoApp, acao: Acao): EstadoApp {
  switch (acao.tipo) {
    case 'hidratar':
      return acao.estado;
    case 'definirTema':
      return { ...estado, tema: acao.tema };
    case 'definirEstado':
      return atualizarRegistro(estado, acao.id, (r) => ({
        ...r,
        estado: acao.estado,
        motivoDescarte: acao.estado === 'descartado' ? acao.motivo : null,
      }));
    case 'resolver':
      return atualizarRegistro(estado, acao.id, (r) => ({ ...r, resolucao: acao.resolucao }));
    case 'corrigirCampo':
      return atualizarRegistro(estado, acao.id, (r) => {
        const correcoes = { ...r.correcoes };
        if (acao.valor === null) {
          delete correcoes[acao.campo];
        } else {
          correcoes[acao.campo] = acao.valor;
        }
        return { ...r, correcoes };
      });
    case 'marcarItem':
      return atualizarRegistro(estado, acao.id, (r) => ({
        ...r,
        roteiro: { ...r.roteiro, [acao.item]: acao.marcado },
      }));
    case 'contestar':
      return atualizarRegistro(estado, acao.id, (r) => ({
        ...r,
        contestacoes: [...r.contestacoes, { cartaoId: acao.cartaoId, texto: acao.texto, em: acao.em }],
      }));
    case 'salvarMensagem':
      return atualizarRegistro(estado, acao.id, (r) => ({ ...r, mensagem: acao.texto }));
  }
}

interface ContextoEstado {
  estado: EstadoApp;
  hidratado: boolean;
  despachar: (acao: Acao) => void;
}

const Contexto = createContext<ContextoEstado | null>(null);

async function lerEstadoSalvo(): Promise<EstadoApp> {
  const bruto = await AsyncStorage.getItem(chaveArmazenamento);
  if (bruto === null) {
    return estadoInicial;
  }
  const resultado = estadoSchema.safeParse(JSON.parse(bruto));
  if (!resultado.success) {
    console.warn(`Estado salvo em ${chaveArmazenamento} não segue o esquema atual e foi reiniciado.`, resultado.error.issues);
    return estadoInicial;
  }
  return resultado.data;
}

export function EstadoProvider({ children }: { children: ReactNode }) {
  const [estado, despachar] = useReducer(redutor, estadoInicial);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    let ativo = true;
    lerEstadoSalvo()
      .then((salvo) => {
        if (ativo) {
          despachar({ tipo: 'hidratar', estado: salvo });
        }
      })
      .finally(() => {
        if (ativo) {
          setHidratado(true);
        }
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!hidratado) {
      return;
    }
    AsyncStorage.setItem(chaveArmazenamento, JSON.stringify(estado)).catch((erro: unknown) => {
      console.error('Falha ao gravar o estado local do PropSight.', erro);
    });
  }, [estado, hidratado]);

  return <Contexto.Provider value={{ estado, hidratado, despachar }}>{children}</Contexto.Provider>;
}

export function useEstado(): ContextoEstado {
  const contexto = useContext(Contexto);
  if (contexto === null) {
    throw new Error('useEstado precisa estar dentro de EstadoProvider');
  }
  return contexto;
}

export function useRegistro(id: string): RegistroDossie {
  const { estado } = useEstado();
  return estado.dossies[id] ?? registroInicial;
}
