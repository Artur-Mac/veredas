import { router } from "expo-router";
import type { Dossie } from "../../dados/esquema";
import { analiseSolarDoExemplo } from "../../dados/sol/exemplo";
import { useAparelho } from "../../estado/Aparelho";
import { CartaoSol } from "./CartaoSol";

export function CartaoSolExemplo({ dossie }: { dossie: Dossie }) {
  const { dados } = useAparelho();
  return <CartaoSol analise={analiseSolarDoExemplo(dossie, dados.solarPorExemplo[dossie.id])}
    aoAbrir={() => router.push({ pathname: "/sol", params: { exemplo: dossie.id } })} />;
}
