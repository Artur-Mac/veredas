import { useLocalSearchParams } from 'expo-router';

import { useEstado, useRegistro } from '@/estado/armazenamento';
import { dossiePorId } from '@/fixtures';

import { montarVisao, precisaConfirmacao, resolucaoValida, type Resolucao, type VisaoDossie } from '@/dominio/visao';

export type ParametrosResolucao = { edificio: string } | { modo: 'rua' } | Record<string, never>;

export type ResultadoRota =
  | { tipo: 'pronto'; id: string; visao: VisaoDossie; parametros: ParametrosResolucao }
  | { tipo: 'aguardando' }
  | { tipo: 'inexistente'; id: string }
  | { tipo: 'confirmar'; id: string };

export function parametrosDa(visao: VisaoDossie): ParametrosResolucao {
  if (visao.modo === 'rua') {
    return { modo: 'rua' };
  }
  if (visao.origem === 'humano' && visao.edificio !== null) {
    return { edificio: visao.edificio.id };
  }
  return {};
}

export function useVisaoDaRota(): ResultadoRota {
  const parametros = useLocalSearchParams<{ id: string; edificio?: string; modo?: string }>();
  const id = parametros.id;
  const { hidratado } = useEstado();
  const registro = useRegistro(id);
  const dossie = dossiePorId(id);
  if (dossie === null) {
    return { tipo: 'inexistente', id };
  }
  let resolucao: Resolucao | null = registro.resolucao;
  if (typeof parametros.edificio === 'string' && parametros.edificio.length > 0) {
    resolucao = { tipo: 'candidata', candidata: parametros.edificio };
  } else if (parametros.modo === 'rua') {
    resolucao = { tipo: 'rua' };
  }
  if (precisaConfirmacao(dossie) && resolucaoValida(dossie, resolucao) === null) {
    return hidratado ? { tipo: 'confirmar', id } : { tipo: 'aguardando' };
  }
  const visao = montarVisao(dossie, resolucao);
  return { tipo: 'pronto', id, visao, parametros: parametrosDa(visao) };
}
