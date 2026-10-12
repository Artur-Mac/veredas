import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { PreferenciaTema } from '@/estado/armazenamento';

import { paletaClara, paletaEscura, type Paleta } from './cores';

interface Tema {
  paleta: Paleta;
  escuro: boolean;
}

const Contexto = createContext<Tema | null>(null);

export function TemaProvider({ preferencia, children }: { preferencia: PreferenciaTema; children: ReactNode }) {
  const sistema = useColorScheme();
  const escuro = preferencia === 'escuro' || (preferencia === 'sistema' && sistema === 'dark');
  return (
    <Contexto.Provider value={{ paleta: escuro ? paletaEscura : paletaClara, escuro }}>{children}</Contexto.Provider>
  );
}

export function useTema(): Tema {
  const tema = useContext(Contexto);
  if (tema === null) {
    throw new Error('useTema precisa estar dentro de TemaProvider');
  }
  return tema;
}
