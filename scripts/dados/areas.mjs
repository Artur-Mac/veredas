// Áreas onde os pipelines de camada rodam (VE16). Fonte única: scripts/dados/areas.json. O piloto vem primeiro e na
// mesma ordem de sempre, para os arquivos do piloto não mudarem quando uma área entra na expansão.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const config = JSON.parse(readFileSync(join(import.meta.dirname, "areas.json"), "utf8"));
export const AREAS_DO_PILOTO = Object.freeze([...config.piloto]);
export const AREAS_DE_EXPANSAO = Object.freeze([...config.expansao]);
/** Piloto + expansão, sem repetição. */
export const AREAS = Object.freeze([...new Set([...AREAS_DO_PILOTO, ...AREAS_DE_EXPANSAO])]);
