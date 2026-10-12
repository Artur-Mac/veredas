import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { pareceLinkDeAnuncio } from '@/dominio/link';

import { podeLerAreaDeTransferencia } from './permissaoAreaDeTransferencia';

export function useLinkNaAreaDeTransferencia() {
  const [link, setLink] = useState<string | null>(null);
  const [descartados, setDescartados] = useState<string[]>([]);

  const verificar = useCallback(async () => {
    if (!(await podeLerAreaDeTransferencia())) {
      return;
    }
    if (!(await Clipboard.hasStringAsync())) {
      return;
    }
    const texto = (await Clipboard.getStringAsync()).trim();
    if (pareceLinkDeAnuncio(texto) && !descartados.includes(texto)) {
      setLink(texto);
    }
  }, [descartados]);

  useEffect(() => {
    const executar = () => {
      verificar().catch((erro: unknown) => {
        console.warn('Não foi possível ler a área de transferência.', erro);
      });
    };
    executar();
    const inscricao = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        executar();
      }
    });
    return () => inscricao.remove();
  }, [verificar]);

  const descartar = useCallback(() => {
    if (link !== null) {
      setDescartados((anteriores) => [...anteriores, link]);
    }
    setLink(null);
  }, [link]);

  return { link, descartar };
}
