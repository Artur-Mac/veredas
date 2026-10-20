import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { VisaoDoDossie } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO } from "../../tema/tokens";
import type { PedidoDeFonte } from "../fonte/GavetaDeFonte";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { LinkComSeta, Numero } from "./base";
import { especificacoesDaFaixa, fatosCurtos, linhaDeEndereco, type FatoCurto, type ItemDeEspecificacao } from "./textos";

// Traços de `renderSpecsStripHtml` (index.html 4372 a 4400), os mesmos do cartão do Explorar.
const ICONES_DA_FAIXA: Record<ItemDeEspecificacao["id"], readonly string[]> = {
  area: ["M3 3h18v18H3z", "M3 9h18", "M9 21V9"],
  quartos: ["M2 4v16", "M2 8h18a2 2 0 0 1 2 2v10", "M2 17h20", "M6 8v9"],
  banheiros: ["M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5", "M10 5 8 7", "M2 12h20"],
  vagas: [
    "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
    "M9 17h6",
    "M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
    "M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  ],
};

function ItemDaFaixa({ item }: { item: ItemDeEspecificacao }) {
  const { cor } = useTema();
  return (
    <View accessible accessibilityLabel={item.rotulo} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={cor("cor-texto-apoio")} strokeWidth={1.8} aria-hidden>
        {ICONES_DA_FAIXA[item.id].map((d) => (
          <Path key={d} d={d} />
        ))}
      </Svg>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15, fontWeight: "500" }}>
        {item.texto}
      </Texto>
    </View>
  );
}

function LoteConfirmado() {
  const { cor } = useTema();
  return (
    <View accessible accessibilityLabel="Lote confirmado" style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cor("cor-azul-cadastral") }} />
      <Texto tipo="apoio" cor="cor-azul-cadastral" style={{ fontSize: 11, lineHeight: 15, fontWeight: "500" }}>
        Lote confirmado ✓
      </Texto>
    </View>
  );
}

function FatoDoTopo({ fato, forma, aoAbrir }: { fato: FatoCurto; forma: "texto" | "numero"; aoAbrir: (p: PedidoDeFonte) => void }) {
  const pedido: PedidoDeFonte = { fonte: fato.fonte, confianca: fato.confianca, dado: fato.dado };
  return (
    <Pressionavel
      onPress={() => aoAbrir(pedido)}
      accessibilityRole="button"
      accessibilityLabel={`${fato.destaque}${fato.apoio ? `, ${fato.apoio}` : ""}. Ver fonte.`}
      style={{ flex: 1, minWidth: 0, minHeight: 44, justifyContent: "center", borderRadius: RAIO.quadrado }}
    >
      {forma === "numero" ? (
        <Numero tamanho={13} peso="600">
          {fato.destaque}
        </Numero>
      ) : (
        <Texto tipo="corpo" style={{ fontSize: 12, lineHeight: 18, fontWeight: "600" }}>
          {fato.destaque}
        </Texto>
      )}
      {fato.apoio ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10.5, lineHeight: 15, marginTop: 1 }}>
          {fato.apoio}
        </Texto>
      ) : null}
    </Pressionavel>
  );
}

type Props = {
  visao: VisaoDoDossie;
  coberto: boolean;
  aoConfirmarPredio: () => void;
  aoAbrirAnuncio: () => void;
  aoAbrirCadastro: () => void;
  aoAbrirFonte: (pedido: PedidoDeFonte) => void;
};

/**
 * `.ds-property-info` de index.html (CSS 2702 a 2733): bairro e situação do lote, título, endereço, especificações, os
 * dois fatos curtos e os links "Dados do anúncio" e "Cadastro oficial".
 */
export function InfoDoImovel({ visao, coberto, aoConfirmarPredio, aoAbrirAnuncio, aoAbrirCadastro, aoAbrirFonte }: Props) {
  const { cor } = useTema();
  const endereco = linhaDeEndereco(visao);
  const itens = especificacoesDaFaixa(visao.especificacoes);
  const { construcao, iptu } = fatosCurtos(visao);
  return (
    <View style={{ paddingTop: 14, paddingHorizontal: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 28, marginBottom: 6 }}>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ flexShrink: 1, fontSize: 11, lineHeight: 15 }}>
          {visao.subtitulo}
        </Texto>
        {visao.loteConfirmado ? (
          <LoteConfirmado />
        ) : coberto ? (
          <LinkComSeta rotulo="Confirmar prédio" onPress={aoConfirmarPredio} seta={false} estilo={{ paddingVertical: 0 }} />
        ) : null}
      </View>
      <Texto tipo="titulo-tela" role="heading" style={{ fontSize: 25, lineHeight: 29, fontWeight: "500", letterSpacing: -0.88 }}>
        {visao.titulo}
      </Texto>
      {endereco ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 18, marginTop: 7 }}>
          {endereco}
        </Texto>
      ) : null}
      {itens.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 7, rowGap: 6, marginTop: 10, marginBottom: 12 }}>
          {itens.map((item, i) => (
            <View key={item.id} style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              {i > 0 ? <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: cor("cor-linha-forte") }} /> : null}
              <ItemDaFaixa item={item} />
            </View>
          ))}
        </View>
      ) : (
        <View style={{ height: ESPACO[3] }} />
      )}
      {construcao || iptu ? (
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 6 }}>
          {construcao ? <FatoDoTopo fato={construcao} forma="texto" aoAbrir={aoAbrirFonte} /> : <View style={{ flex: 1 }} />}
          {iptu ? <FatoDoTopo fato={iptu} forma="numero" aoAbrir={aoAbrirFonte} /> : <View style={{ flex: 1 }} />}
        </View>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: cor("cor-linha"),
        }}
      >
        <LinkComSeta rotulo="Dados do anúncio" onPress={aoAbrirAnuncio} discreto />
        {visao.loteConfirmado ? <LinkComSeta rotulo="Cadastro oficial" onPress={aoAbrirCadastro} discreto /> : null}
      </View>
    </View>
  );
}
