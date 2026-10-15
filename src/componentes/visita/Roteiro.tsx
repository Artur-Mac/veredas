import { View } from "react-native";
import type { Dossie } from "../../dados/esquema";
import { useAparelho } from "../../estado/Aparelho";
import { Divisor } from "../Cartao";
import { CaixaDeMarcar } from "../Controles";
import { itensDoRoteiro } from "./textosDaVisita";

export function useRoteiro(dossie: Dossie) {
  const { dados, mudar } = useAparelho();
  const itens = itensDoRoteiro(dossie, dados);
  const marcados = dados.roteiro[dossie.id] ?? [];
  const alternar = (indice: number) =>
    mudar((atuais) => {
      const lista = atuais.roteiro[dossie.id] ?? [];
      const nova = lista.includes(indice) ? lista.filter((i) => i !== indice) : [...lista, indice];
      return { roteiro: { ...atuais.roteiro, [dossie.id]: nova } };
    });
  return { itens, marcados, alternar };
}

export function ListaDoRoteiro({ dossie }: { dossie: Dossie }) {
  const { itens, marcados, alternar } = useRoteiro(dossie);
  return (
    <View>
      {itens.map((texto, i) => (
        <View key={`${i}-${texto}`}>
          {i > 0 ? <Divisor /> : null}
          <CaixaDeMarcar rotulo={texto} marcada={marcados.includes(i)} aoMudar={() => alternar(i)} />
        </View>
      ))}
    </View>
  );
}
