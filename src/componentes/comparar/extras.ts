// Extras do placar (15/11/2026): o que a tela junta para `placarDoPar` — preços, ida das 7h até o destino do perfil
// (camada "Onde mais procurar", por rua), calor de superfície e cota de cada prédio, condomínio por m². Desconhecido é null.
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { faltaCamada } from "../../dados/camadas";
import { bairroPorSlug } from "../../dados/recife/bairros";
import { lerRelevoECanalProximo, lerTemperaturaSuperficie100m } from "../../dados/recife/camadasAmbientais";
import { procura } from "../../dados/recife/procura";
import type { PerfilDoDomicilio } from "../../estado/PerfilDomicilio";
import type { Par } from "./comparar";
import type { ExtrasDoPlacar } from "./placar";

const conhecido = (d: { valor: number | null; aConfirmar: boolean }) => (d.aConfirmar ? null : d.valor);

/** Minutos da ida das 7h da rua do prédio até o bairro de destino; null fora das ruas publicadas. */
export function minutosDaRua(e: Edificio | null, destino: string): number | null {
  if (!e) return null;
  try {
    const p = procura();
    const j = p ? p.bairros.indexOf(destino) : -1;
    if (!p || j < 0) return null;
    const rua = p.ruas.find((r) => r.c === e.id.split("-")[0]);
    return rua?.t[j] ?? null;
  } catch (erro) {
    if (faltaCamada(erro)) return null;
    throw erro;
  }
}

function ambiente(e: Edificio | null) {
  if (!e) return { calorC: null, cotaM: null };
  try {
    return { calorC: lerTemperaturaSuperficie100m(e.centro, e.bairro)?.tempQuadraC ?? null, cotaM: lerRelevoECanalProximo(e.centro).altitudeM };
  } catch {
    return { calorC: null, cotaM: null };
  }
}

function condominioM2(a: AnaliseV2): number | null {
  const c = conhecido(a.declarados.condominio), ar = conhecido(a.declarados.area);
  return c !== null && ar !== null && ar > 0 ? c / ar : null;
}

export function extrasDoPar(par: Par<AnaliseV2>, edificios: Par<Edificio | null>, perfil: Pick<PerfilDoDomicilio, "destinoBairro" | "diasPresenciaisMes">): ExtrasDoPlacar {
  const destino = perfil.destinoBairro;
  return {
    compra: par[0].modalidade === "compra",
    precos: [conhecido(par[0].declarados.preco), conhecido(par[1].declarados.preco)],
    rotina: destino && perfil.diasPresenciaisMes > 0
      ? { destino: bairroPorSlug(destino)?.nome ?? destino, minutosIda: [minutosDaRua(edificios[0], destino), minutosDaRua(edificios[1], destino)], dias: perfil.diasPresenciaisMes }
      : null,
    ambiente: [ambiente(edificios[0]), ambiente(edificios[1])],
    condominioM2: [condominioM2(par[0]), condominioM2(par[1])],
  };
}
