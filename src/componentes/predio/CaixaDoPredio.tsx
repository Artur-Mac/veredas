import { View } from "react-native";
import type { Edificio } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { Texto } from "../Texto";
import { enderecoEmCaixaDeTitulo, resumoDoPredio } from "./textos";

type Props = { edificio: Edificio; motivos: readonly string[] };

/** Caixa creme de renderAnalyzingLotCard: nome ou endereço do prédio, resumo do cadastro e motivos da sugestão. */
export function CaixaDoPredio({ edificio, motivos }: Props) {
  const { cor } = useTema();
  const endereco = enderecoEmCaixaDeTitulo(edificio.logradouro, edificio.numero);
  return (
    <View
      style={{
        paddingVertical: 11,
        paddingHorizontal: 13,
        borderRadius: 11,
        backgroundColor: cor("cor-creme"),
        borderWidth: 1,
        borderColor: "rgba(23, 23, 23, 0.08)",
        gap: 2,
      }}
    >
      <Texto tipo="secao" style={{ fontSize: 13.5, lineHeight: 19, fontWeight: "700" }}>
        {edificio.nome ?? endereco}
      </Texto>
      {edificio.nome ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
          {endereco}
        </Texto>
      ) : null}
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
        {resumoDoPredio(edificio)}
      </Texto>
      {motivos.length > 0 ? (
        <View style={{ gap: 3, marginTop: 6 }}>
          {motivos.map((motivo) => (
            <View key={motivo} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
              <View
                style={{ width: 4, height: 4, borderRadius: 2, marginTop: 7, backgroundColor: cor("cor-azul-cadastral") }}
              />
              <Texto tipo="apoio" style={{ flex: 1, fontSize: 12, lineHeight: 17 }}>
                {motivo}
              </Texto>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
