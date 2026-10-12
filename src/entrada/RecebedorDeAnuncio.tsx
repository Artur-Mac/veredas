import { router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';

import { extrairCodigoAnuncio } from '@/dominio/link';
import { dossiePorTexto } from '@/fixtures';

type RotaDeEntrada =
  | { pathname: '/anuncio/[id]'; params: { id: string } }
  | { pathname: '/demonstracao'; params: { codigo: string } | Record<string, never> };

export function rotaParaTexto(texto: string): RotaDeEntrada {
  const dossie = dossiePorTexto(texto);
  if (dossie === null) {
    const codigo = extrairCodigoAnuncio(texto);
    return { pathname: '/demonstracao', params: codigo === null ? {} : { codigo } };
  }
  return { pathname: '/anuncio/[id]', params: { id: dossie.dossie_id } };
}

export function RecebedorDeAnuncio() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();

  useEffect(() => {
    if (error !== null) {
      console.warn('Falha ao receber o conteúdo compartilhado.', error);
    }
  }, [error]);

  useEffect(() => {
    if (!hasShareIntent) {
      return;
    }
    const texto = [shareIntent.webUrl, shareIntent.text].filter((parte): parte is string => typeof parte === 'string').join(' ');
    resetShareIntent();
    if (texto.trim().length === 0) {
      return;
    }
    router.push(rotaParaTexto(texto));
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  return null;
}
