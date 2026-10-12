import { router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';

import { dossiePorTexto } from '@/fixtures';

export function rotaParaTexto(texto: string): { pathname: '/anuncio/[id]'; params: { id: string } } | { pathname: '/demonstracao'; params: { link: string } } {
  const dossie = dossiePorTexto(texto);
  if (dossie === null) {
    return { pathname: '/demonstracao', params: { link: texto.slice(0, 300) } };
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
