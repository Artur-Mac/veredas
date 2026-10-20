import { useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import type { Edificio } from "../../dados/contratos";
import { buscarPorEndereco } from "../../dados/recife/buscar";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { linhaDeResultado } from "./textos";

type Props = {
  edificios: readonly Edificio[];
  aoEscolher: (edificio: Edificio) => void;
};

/** Campo sempre visível: rua, número ou nome do prédio. Os resultados vêm de buscarPorEndereco. */
export function BuscaDePredio({ edificios, aoEscolher }: Props) {
  const { cor } = useTema();
  const [texto, setTexto] = useState("");
  const consulta = texto.trim();
  const resultados = useMemo(
    () => (consulta.length >= 2 ? buscarPorEndereco(consulta, edificios) : []),
    [consulta, edificios],
  );

  return (
    <View style={{ gap: ESPACO[2] }}>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder="Buscar por rua, número ou nome do prédio"
        placeholderTextColor="#A8A29E"
        accessibilityLabel="Buscar por rua, número ou nome do prédio"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={{
          minHeight: 46,
          paddingHorizontal: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "rgba(23, 23, 23, 0.12)",
          backgroundColor: cor("cor-superficie"),
          color: cor("cor-texto"),
          fontFamily: "PlusJakartaSans",
          fontSize: 13,
        }}
      />
      {consulta.length >= 2 ? (
        resultados.length > 0 ? (
          <View
            role="list"
            style={{
              borderRadius: 11,
              borderWidth: 1,
              borderColor: "rgba(23, 23, 23, 0.08)",
              backgroundColor: cor("cor-creme"),
              overflow: "hidden",
            }}
          >
            {resultados.map((e, i) => (
              <Pressionavel
                key={e.id}
                role="button"
                accessibilityLabel={`Escolher ${linhaDeResultado(e)}`}
                onPress={() => {
                  setTexto("");
                  aoEscolher(e);
                }}
                style={{
                  minHeight: 44,
                  justifyContent: "center",
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                  borderTopWidth: i === 0 ? 0 : 0.5,
                  borderTopColor: cor("cor-linha"),
                }}
              >
                <Texto tipo="apoio" style={{ fontSize: 12.5, lineHeight: 17, fontWeight: "600" }}>
                  {linhaDeResultado(e)}
                </Texto>
              </Pressionavel>
            ))}
          </View>
        ) : (
          <View style={{ padding: 11, borderRadius: RAIO.icone, backgroundColor: cor("cor-creme") }}>
            <Texto tipo="apoio" cor="cor-texto-apoio">
              Nenhum prédio com esse endereço ou nome. O cadastro do Vereda só tem edifícios com 2 ou mais apartamentos.
            </Texto>
          </View>
        )
      ) : null}
    </View>
  );
}
