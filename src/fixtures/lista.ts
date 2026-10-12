import dossieBoaViagemRuaDoCatete from './dossies/boa-viagem-rua-do-catete.json';
import mapaBoaViagemRuaDoCatete from './mapas/boa-viagem-rua-do-catete.json';
import dossieCasaAmarelaEstradaDoArraial from './dossies/casa-amarela-estrada-do-arraial.json';
import mapaCasaAmarelaEstradaDoArraial from './mapas/casa-amarela-estrada-do-arraial.json';
import dossieBoaVistaRuaDoAragao from './dossies/boa-vista-rua-do-aragao.json';
import mapaBoaVistaRuaDoAragao from './mapas/boa-vista-rua-do-aragao.json';

export const fixturesBrutas: { arquivo: string; dossie: unknown; mapa: unknown }[] = [
  { arquivo: 'boa-viagem-rua-do-catete', dossie: dossieBoaViagemRuaDoCatete, mapa: mapaBoaViagemRuaDoCatete },
  { arquivo: 'casa-amarela-estrada-do-arraial', dossie: dossieCasaAmarelaEstradaDoArraial, mapa: mapaCasaAmarelaEstradaDoArraial },
  { arquivo: 'boa-vista-rua-do-aragao', dossie: dossieBoaVistaRuaDoAragao, mapa: mapaBoaVistaRuaDoAragao },
];
