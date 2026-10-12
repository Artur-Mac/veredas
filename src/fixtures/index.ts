import { z } from 'zod';

import { dossieSchema, mapaSchema, type Dossie, type Mapa } from '@/dominio/esquema';
import { extrairCodigoAnuncio } from '@/dominio/link';

import { fixturesBrutas } from './lista';

interface Entrada {
  dossie: Dossie;
  mapa: Mapa;
}

function validar(arquivo: string, dossieBruto: unknown, mapaBruto: unknown): Entrada {
  const dossie = dossieSchema.safeParse(dossieBruto);
  if (!dossie.success) {
    throw new Error(`Fixture dossies/${arquivo}.json inválida:\n${z.prettifyError(dossie.error)}`);
  }
  const mapa = mapaSchema.safeParse(mapaBruto);
  if (!mapa.success) {
    throw new Error(`Fixture mapas/${arquivo}.json inválida:\n${z.prettifyError(mapa.error)}`);
  }
  if (dossie.data.dossie_id !== arquivo || mapa.data.dossie_id !== arquivo) {
    throw new Error(`Fixture ${arquivo}: dossie_id do dossiê e do mapa devem ser iguais ao nome do arquivo`);
  }
  const alvosEsperados =
    dossie.data.identidade.status === 'resolvido' ? ['alvo'] : dossie.data.identidade.candidatas.map((c) => c.id);
  const alvosNoMapa = new Set(mapa.data.alvos.map((a) => a.id));
  for (const alvo of alvosEsperados) {
    if (!alvosNoMapa.has(alvo)) {
      throw new Error(`Fixture ${arquivo}: o mapa não tem o polígono do alvo ${alvo}`);
    }
  }
  return { dossie: dossie.data, mapa: mapa.data };
}

const entradas: Entrada[] = fixturesBrutas.map((f) => validar(f.arquivo, f.dossie, f.mapa));

export const dossies: Dossie[] = entradas.map((e) => e.dossie);

export function dossiePorId(id: string): Dossie | null {
  return entradas.find((e) => e.dossie.dossie_id === id)?.dossie ?? null;
}

export function mapaPorId(id: string): Mapa {
  const entrada = entradas.find((e) => e.dossie.dossie_id === id);
  if (entrada === undefined) {
    throw new Error(`Mapa inexistente para o dossiê ${id}`);
  }
  return entrada.mapa;
}

export function dossiePorTexto(texto: string): Dossie | null {
  const codigo = extrairCodigoAnuncio(texto);
  if (codigo === null) {
    return null;
  }
  return entradas.find((e) => e.dossie.anuncio.codigo_anuncio === codigo)?.dossie ?? null;
}
