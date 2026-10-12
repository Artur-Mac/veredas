import { Redirect } from 'expo-router';

import type { ResultadoRota } from '@/navegacao/useVisaoDaRota';

export function DesvioDeRota({ resultado }: { resultado: Exclude<ResultadoRota, { tipo: 'pronto' }> }) {
  switch (resultado.tipo) {
    case 'aguardando':
      return null;
    case 'inexistente':
      return <Redirect href={{ pathname: '/demonstracao', params: { link: resultado.id } }} />;
    case 'confirmar':
      return <Redirect href={{ pathname: '/anuncio/[id]/confirmacao', params: { id: resultado.id } }} />;
  }
}
