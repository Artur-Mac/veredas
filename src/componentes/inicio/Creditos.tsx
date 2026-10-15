import { router } from "expo-router";
import { View } from "react-native";
import { COMO_GANHAR, NOMES_DE_MOVIMENTO, resumoDosCreditos, textoDeDisponiveis } from "../../dados/creditos";
import { creditos } from "../../dados/dossies";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO } from "../../tema/tokens";
import { LinkDeLinha } from "../Botao";
import { Cartao, CorpoDoCartao, Divisor, IconeDeSecao } from "../Cartao";
import { Icone } from "../Icone";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";

export function NumeroDeCreditos() {
  const { disponiveis } = resumoDosCreditos(creditos);
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: ESPACO[2] }}>
      <Texto tipo="numero">{String(disponiveis)}</Texto>
      <Texto>{textoDeDisponiveis(disponiveis)}</Texto>
    </View>
  );
}

export function PilulaDeCredito() {
  const { cor } = useTema();
  const { disponiveis } = resumoDosCreditos(creditos);
  return (
    <Pressionavel
      role="link"
      accessibilityLabel={`${disponiveis} créditos, ver extrato`}
      onPress={() => router.push("/creditos")}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: ESPACO[1],
        minHeight: 36,
        paddingLeft: 10,
        paddingRight: 12,
        borderRadius: RAIO.pilula,
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: cor("cor-linha"),
      }}
    >
      <Icone nome="coins" tamanho="p" />
      <Texto tipo="etiqueta">{String(disponiveis)}</Texto>
    </Pressionavel>
  );
}

export function CartaoDeCreditos() {
  const { cor } = useTema();
  const resumo = resumoDosCreditos(creditos);
  const total = resumo.cotaInicial + resumo.ganhos;
  return (
    <Cartao>
      <CorpoDoCartao>
        <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3] }}>
          <IconeDeSecao nome="coins" />
          <View style={{ flex: 1, gap: 2 }}>
            <Texto tipo="secao">Créditos</Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio">
              Um crédito abre um dossiê
            </Texto>
          </View>
        </View>
        <NumeroDeCreditos />
        <View
          role="img"
          accessibilityLabel={`${resumo.disponiveis} disponíveis de ${total}`}
          style={{ flexDirection: "row", gap: 4, height: 10 }}
        >
          {Array.from({ length: total }, (_, i) => (
            <View
              key={i}
              style={{ flex: 1, borderRadius: 3, backgroundColor: cor(i < resumo.disponiveis ? "cor-barro" : "cor-linha") }}
            />
          ))}
        </View>
        <Texto tipo="apoio" cor="cor-texto-apoio">
          {`Cota gratuita de ${resumo.cotaInicial}, ${resumo.ganhos} ganhos, ${resumo.usados} usados.`}
        </Texto>
        <View accessibilityLabel="Como ganhar créditos">
          {COMO_GANHAR.map((g, i) => (
            <View key={g.tipo}>
              {i > 0 ? <Divisor /> : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3], minHeight: 40 }}>
                <IconeDeSecao nome={g.icone} pequeno />
                <Texto style={{ flex: 1 }}>{NOMES_DE_MOVIMENTO[g.tipo]}</Texto>
                <Texto tipo="secao">{`+${g.mais}`}</Texto>
              </View>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: ESPACO[4] }}>
          <LinkDeLinha rotulo="Ver extrato" altura={40} onPress={() => router.push("/creditos")} />
          <LinkDeLinha rotulo="Comprar créditos" altura={40} onPress={() => router.push("/creditos")} />
        </View>
      </CorpoDoCartao>
    </Cartao>
  );
}
