import { Pressable, View } from "react-native";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO, TOQUE_MINIMO } from "../tema/tokens";
import { Icone } from "./Icone";
import { Pressionavel } from "./Pressionavel";
import { Texto } from "./Texto";

type Opcao<T> = { valor: T; nome: string };

type PropsDoSegmentado<T> = { opcoes: readonly Opcao<T>[]; valor: T | undefined; aoMudar: (valor: T) => void; rotulo?: string };

export function Segmentado<T extends string | number>({ opcoes, valor, aoMudar, rotulo }: PropsDoSegmentado<T>) {
  const { cor } = useTema();
  return (
    <View
      role="radiogroup"
      accessibilityLabel={rotulo}
      style={{ flexDirection: "row", gap: 2, padding: 2, backgroundColor: cor("cor-fundo"), borderRadius: RAIO.pilula, flexGrow: 1 }}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressionavel
            key={String(o.valor)}
            role="radio"
            accessibilityState={{ checked: ativo }}
            aria-checked={ativo}
            onPress={() => aoMudar(o.valor)}
            style={{
              flexGrow: 1,
              flexShrink: 0,
              flexBasis: "auto",
              minHeight: 40,
              borderRadius: RAIO.pilula,
              paddingHorizontal: ESPACO[3],
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: ativo ? cor("cor-superficie") : undefined,
              borderWidth: 1,
              borderColor: ativo ? cor("cor-linha") : "transparent",
            }}
          >
            <Texto tipo={ativo ? "etiqueta" : "apoio"} cor={ativo ? "cor-texto" : "cor-texto-apoio"} numberOfLines={1}>
              {o.nome}
            </Texto>
          </Pressionavel>
        );
      })}
    </View>
  );
}

type PropsDaAlterna = { rotulo: string; ligado: boolean; aoMudar: (ligado: boolean) => void };

export function Alterna({ rotulo, ligado, aoMudar }: PropsDaAlterna) {
  const { cor } = useTema();
  return (
    <Pressable
      role="switch"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: ligado }}
      aria-checked={ligado}
      onPress={() => aoMudar(!ligado)}
      style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3], minHeight: TOQUE_MINIMO }}
    >
      <Texto style={{ flex: 1 }}>{rotulo}</Texto>
      <View
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: cor(ligado ? "cor-texto" : "cor-traco"),
          backgroundColor: cor(ligado ? "cor-texto" : "cor-linha"),
          justifyContent: "center",
          paddingHorizontal: 3,
        }}
      >
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: cor(ligado ? "cor-fundo" : "cor-texto-apoio"),
            alignSelf: ligado ? "flex-end" : "flex-start",
          }}
        />
      </View>
    </Pressable>
  );
}

type PropsDaCaixa = { rotulo: string; marcada: boolean; aoMudar: (marcada: boolean) => void; radio?: boolean };

export function CaixaDeMarcar({ rotulo, marcada, aoMudar, radio = false }: PropsDaCaixa) {
  const { cor } = useTema();
  return (
    <Pressionavel
      role={radio ? "radio" : "checkbox"}
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: marcada }}
      aria-checked={marcada}
      onPress={() => aoMudar(!marcada)}
      style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3], minHeight: TOQUE_MINIMO, paddingVertical: ESPACO[2] }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: radio ? 10 : 4,
          borderWidth: 2,
          borderColor: cor("cor-texto"),
          backgroundColor: marcada && !radio ? cor("cor-texto") : undefined,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {marcada && radio ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cor("cor-texto") }} /> : null}
        {marcada && !radio ? <Icone nome="check" tamanho="p" cor="cor-fundo" /> : null}
      </View>
      <Texto style={{ flex: 1 }}>{rotulo}</Texto>
    </Pressionavel>
  );
}
