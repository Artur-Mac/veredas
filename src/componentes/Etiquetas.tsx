import type { ReactNode } from "react";
import { View } from "react-native";
import { TEXTO_ILUSTRATIVO } from "../dados/textos";
import { useMostrarFinal } from "../estado/fatos";
import { useTema } from "../tema/Tema";
import { RAIO, type TokenDeCor } from "../tema/tokens";
import { Texto } from "./Texto";

type Props = { texto: string; forte?: boolean; pontilhada?: boolean; fundo?: TokenDeCor; acessivel?: string };

export function Etiqueta({ texto, forte = false, pontilhada = false, fundo, acessivel }: Props) {
  const { cor } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={acessivel ?? texto}
      style={{
        height: 24,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderStyle: pontilhada ? "dotted" : "solid",
        borderColor: cor(pontilhada ? "cor-traco" : "cor-linha"),
        borderRadius: RAIO.pilula,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-start",
        backgroundColor: fundo ? cor(fundo) : undefined,
      }}
    >
      <Texto tipo="etiqueta" cor={forte || pontilhada ? "cor-texto" : "cor-texto-apoio"} numberOfLines={1}>
        {texto}
      </Texto>
    </View>
  );
}

export function EtiquetaFase({ fase }: { fase: "prototipo" | "final" }) {
  if (fase !== "final") return null;
  return <Etiqueta texto="Final" />;
}

export function PilulaIlustrativo({ fundo }: { fundo?: TokenDeCor }) {
  return <Etiqueta texto="ilustrativo" acessivel={TEXTO_ILUSTRATIVO} fundo={fundo} />;
}

export function SoNoFinal({ children }: { children: ReactNode }) {
  return useMostrarFinal() ? <>{children}</> : null;
}

export function FaseVisivel({ fase, children }: { fase: "prototipo" | "final"; children: ReactNode }) {
  const mostrarFinal = useMostrarFinal();
  if (fase === "final" && !mostrarFinal) return null;
  return <>{children}</>;
}
