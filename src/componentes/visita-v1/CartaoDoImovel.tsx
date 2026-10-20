// `.vx-property` e `.vv-property` de index.html: o imóvel da visita, com o botão "Trocar". A v1.0 não tem fotos de
// anúncio; no lugar fica a grade arquitetônica e, com prédio confirmado, o contorno do lote.
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, comAlfa } from "../../tema/tokens";
import { GradeArquitetonica } from "../GradeArquitetonica";
import { Icone } from "../Icone";
import { caminho, poligonoNaCaixa } from "../mapa/geometria";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Seta } from "./blocos";
import { enderecoDoImovel, poligonoDoLote, subtituloDoImovel } from "./logica";

const LARGURA = 68;
const ALTURA = 76;

function Miniatura({ predio }: { predio: Edificio | null }) {
  const { cor } = useTema();
  const contorno = poligonoDoLote(predio);
  return (
    <View
      style={{
        width: LARGURA,
        height: ALTURA,
        borderRadius: RAIO.quadrado,
        backgroundColor: cor("cor-sutil"),
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <GradeArquitetonica />
      {contorno ? (
        <Svg width={LARGURA} height={ALTURA} viewBox={`0 0 ${LARGURA} ${ALTURA}`} aria-hidden>
          <Path
            d={caminho(poligonoNaCaixa(contorno, LARGURA - 20, ALTURA - 20, 10))}
            fill={cor("cor-azul-cadastral")}
            fillOpacity={0.18}
            stroke={cor("cor-azul-cadastral")}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </Svg>
      ) : (
        <Icone nome="building" tamanho="g" cor="cor-traco" />
      )}
    </View>
  );
}

/** O bloco de identificação do imóvel: miniatura, nome, endereço (se conhecido) e "Bairro · área · quartos". */
export function IdentificacaoDoImovel({ analise, predio }: { analise: AnaliseV2; predio: Edificio | null }) {
  const endereco = enderecoDoImovel(analise, predio);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3], minWidth: 0, flex: 1 }}>
      <Miniatura predio={predio} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Texto numberOfLines={2} style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
          {analise.nome}
        </Texto>
        {endereco ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" numberOfLines={2} style={{ fontSize: 11, lineHeight: 17, marginTop: 4 }}>
            {endereco}
          </Texto>
        ) : null}
        <Texto tipo="apoio" cor="cor-texto-apoio" numberOfLines={2} style={{ fontSize: 11, lineHeight: 17, marginTop: endereco ? 0 : 4 }}>
          {subtituloDoImovel(analise)}
        </Texto>
      </View>
    </View>
  );
}

/** `.vv-property`: o imóvel num cartão branco com "Trocar" à direita. */
export function CartaoDoImovel({
  analise,
  predio,
  aoTrocar,
}: {
  analise: AnaliseV2;
  predio: Edificio | null;
  aoTrocar: () => void;
}) {
  const { cor } = useTema();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: ESPACO[3],
        padding: ESPACO[3],
        marginBottom: 17,
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto"), 0.07),
        borderRadius: 13,
      }}
    >
      <IdentificacaoDoImovel analise={analise} predio={predio} />
      <Pressionavel
        accessibilityRole="button"
        accessibilityLabel="Trocar imóvel da visita"
        onPress={aoTrocar}
        style={{ minHeight: 48, minWidth: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: ESPACO[1], borderRadius: RAIO.quadrado }}
      >
        <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 11, fontWeight: "600" }}>
          Trocar
        </Texto>
      </Pressionavel>
    </View>
  );
}

/** Linha de `.vx-picker`: imóvel à esquerda e, à direita, o visto do que está em uso ou a seta. */
export function LinhaDeImovel({
  analise,
  predio,
  ativa,
  primeira = false,
  aoEscolher,
}: {
  analise: AnaliseV2;
  predio: Edificio | null;
  ativa: boolean;
  primeira?: boolean;
  aoEscolher: () => void;
}) {
  const { cor } = useTema();
  const endereco = enderecoDoImovel(analise, predio);
  return (
    <Pressionavel
      accessibilityRole="button"
      accessibilityLabel={`${analise.nome}. ${endereco ? `${endereco}. ` : ""}${subtituloDoImovel(analise)}${ativa ? ". Imóvel da visita" : ""}`}
      accessibilityState={{ selected: ativa }}
      aria-pressed={ativa}
      onPress={aoEscolher}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: ESPACO[3],
        minHeight: 48,
        paddingVertical: ESPACO[3],
        borderTopWidth: primeira ? 0 : 1,
        borderTopColor: cor("cor-linha"),
      }}
    >
      <IdentificacaoDoImovel analise={analise} predio={predio} />
      {ativa ? <Icone nome="check" tamanho="g" cor="cor-barro" /> : <Seta tamanho={18} />}
    </Pressionavel>
  );
}
