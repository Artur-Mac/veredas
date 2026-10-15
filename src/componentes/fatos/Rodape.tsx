import { router } from "expo-router";
import { View } from "react-native";
import { agruparPorFonte, linhaDaFonte } from "../../dados/consultas";
import type { Dossie, Fato } from "../../dados/esquema";
import { maiuscula } from "../../dados/formatos";
import { ROTULOS, TEXTO_ILUSTRATIVO } from "../../dados/textos";
import { useCarregando } from "../../estado/fatos";
import { useTema } from "../../tema/Tema";
import { ESPACO } from "../../tema/tokens";
import { LinkDeLinha } from "../Botao";
import { Texto } from "../Texto";
import { Bloco, Traco } from "../Traco";

type Props = {
  dossie: Dossie;
  fatos: Fato[];
  recorte?: string | null;
  escalasExtras?: string[];
  tracejado?: boolean;
};

export function Rodape({ dossie, fatos, recorte = null, escalasExtras = [], tracejado = false }: Props) {
  const { cor } = useTema();
  const carregando = useCarregando();
  const principal = fatos.find((f) => f.estado !== "nao_sabemos") ?? fatos[0];
  if (!principal) return null;
  const escalas = [...new Set([...fatos.map((f) => f.escala).filter((e): e is string => Boolean(e)), ...escalasExtras])];
  const borda = {
    paddingTop: ESPACO[3],
    borderTopWidth: 0.5,
    borderStyle: tracejado ? ("dashed" as const) : ("solid" as const),
    borderTopColor: cor("cor-linha"),
    gap: ESPACO[1],
  };

  if (carregando) {
    return (
      <View style={borda}>
        {principal.fonte.base === TEXTO_ILUSTRATIVO ? (
          <Bloco largura="50%" />
        ) : (
          <Texto tipo="apoio" cor="cor-texto-apoio">{`Lendo o ${principal.fonte.base}`}</Texto>
        )}
      </View>
    );
  }

  const separador = principal.fonte.base === TEXTO_ILUSTRATIVO || principal.fonte.base === "anúncio" ? "," : ".";
  return (
    <View style={borda}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
        <Traco rotulo={principal.rotulo} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ flex: 1 }}>
          {`${maiuscula(ROTULOS[principal.rotulo])}${separador} ${linhaDaFonte(principal.fonte, recorte)}`}
        </Texto>
      </View>
      {escalas.map((e) => (
        <Texto key={e} tipo="apoio" cor="cor-texto-apoio">
          {e}
        </Texto>
      ))}
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: ESPACO[4] }}>
        <LinkDeLinha
          rotulo="Ver fonte"
          altura={40}
          onPress={() => router.push({ pathname: "/dossie/[id]/fonte/[fato]", params: { id: dossie.id, fato: principal.id } })}
        />
        <LinkDeLinha
          rotulo="Isso está errado"
          altura={40}
          onPress={() =>
            router.push({ pathname: "/dossie/[id]/contestar/[fato]", params: { id: dossie.id, fato: principal.id } })
          }
        />
      </View>
    </View>
  );
}

export function RodapesPorFonte({ dossie, fatos, recorte = null }: { dossie: Dossie; fatos: Fato[]; recorte?: string | null }) {
  return (
    <>
      {agruparPorFonte(fatos).map((grupo, i) => (
        <Rodape key={`${grupo[0]?.fonte.base}-${i}`} dossie={dossie} fatos={grupo} recorte={recorte} tracejado={i > 0} />
      ))}
    </>
  );
}
