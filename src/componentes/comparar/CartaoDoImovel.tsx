// `.vc-home` de index.html (CSS 3069–3076): cartão de uma coluna do Comparar, com o topo 1,8:1, o rótulo
// "Imóvel N", o seletor, o resumo e o link para o dossiê. Sem foto de anúncio (o Vereda não guarda fotos): o topo
// mostra o padrão arquitetônico e, com o prédio confirmado, o polígono do lote.
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { AnaliseV2 } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { GradeArquitetonica } from "../GradeArquitetonica";
import { Icone } from "../Icone";
import { caminho, poligonoNaCaixa, type Poligono } from "../mapa/geometria";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { LinkVx } from "./vx";

type Props = {
  indice: 0 | 1;
  analise: AnaliseV2;
  /** Lote do prédio confirmado, em plano local; null quando não há. */
  poligono: Poligono | null;
  resumo: string;
  aoTrocar: () => void;
  aoVerDossie: () => void;
};

export function CartaoDoImovel({ indice, analise, poligono, resumo, aoTrocar, aoVerDossie }: Props) {
  const { cor } = useTema();
  const rotulo = `Imóvel ${indice + 1}`;
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: cor("cor-superficie"),
        borderRadius: 13,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto"), 0.07),
      }}
    >
      <View style={{ width: "100%", aspectRatio: 1.8, backgroundColor: cor("cor-sutil") }}>
        <GradeArquitetonica />
        {poligono ? (
          <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
            <Svg width="100%" height="100%" viewBox="0 0 180 100" aria-hidden>
              <Path
                d={caminho(poligonoNaCaixa(poligono, 164, 84, 8))}
                fill={cor("cor-azul-cadastral")}
                fillOpacity={0.18}
                stroke={cor("cor-azul-cadastral")}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        ) : null}
      </View>
      <View style={{ paddingVertical: 8, paddingHorizontal: 10 }}>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10, lineHeight: 14, marginBottom: 3 }}>
          {rotulo}
        </Texto>
        <Pressionavel
          role="button"
          accessibilityLabel={`${rotulo}: ${analise.nome}. Trocar imóvel`}
          onPress={aoTrocar}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            minHeight: 44,
            borderBottomWidth: 1,
            borderBottomColor: cor("cor-linha"),
          }}
        >
          <Texto tipo="secao" style={{ flex: 1, fontSize: 13, lineHeight: 17, fontWeight: "600" }}>
            {analise.nome}
          </Texto>
          <Icone nome="chevron-down" tamanho="p" cor="cor-texto-apoio" />
        </Pressionavel>
        {resumo ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16, marginTop: 7 }}>
            {resumo}
          </Texto>
        ) : null}
        <LinkVx rotulo="Ver dossiê" tamanho={11} onPress={aoVerDossie} acessivel={`Ver dossiê de ${analise.nome}`} />
      </View>
    </View>
  );
}
