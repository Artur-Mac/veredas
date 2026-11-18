import { useState } from "react";
import { Pressable, View } from "react-native";
import type { CartaoCidadao3Camadas as DadosCartao3Camadas } from "../../dados/cidadao/tradutorCidadao";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";
import { Texto } from "../Texto";

/**
 * Cartão Cidadão de 3 Camadas Progressivas:
 * - Camada 1 (sempre visível): manchete direta em português sem jargão.
 * - Camada 2 (sempre visível): impacto prático + o que pedir ou checar agora.
 * - Camada 3 (recolhida por padrão): prova e método (chaves duplas DSQFL + CNM, artigo legal + conta, tag epistêmica).
 */
export function CartaoCidadao3Camadas({ item }: { item: DadosCartao3Camadas }) {
  const { cor } = useTema();
  const [aberto, setAberto] = useState(false);

  const tagRotulo: Record<DadosCartao3Camadas["camada3ProvaMetodo"]["epistemicTag"], string> = {
    registro_oficial: "Registro oficial",
    declarado: "Declarado em documento/anúncio",
    inferencia: "Inferência técnica",
    nao_sabemos: "Ainda não sabemos",
  };

  return (
    <View
      style={{
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: cor("cor-linha-forte"),
        borderRadius: RAIO.cartao,
        padding: 14,
        gap: 8,
      }}
      accessibilityLabel={`Cartão ${item.tituloCurto}`}
    >
      <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 11.5 }}>
        {item.tituloCurto}
      </Texto>

      <Texto tipo="secao" style={{ fontSize: 16, lineHeight: 22 }}>
        {item.camada1Manchete}
      </Texto>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: cor("cor-linha"),
          paddingTop: 10,
          gap: 4,
        }}
      >
        <Texto tipo="corpo" style={{ fontSize: 13.5, lineHeight: 19, fontVariant: ["tabular-nums"] }}>
          {item.camada2ImpactoPratico}
        </Texto>
        <Texto tipo="apoio" cor="cor-azul-cadastral" style={{ fontSize: 12.5, lineHeight: 18 }}>
          {`Próximo passo: ${item.camada2AcaoConcreta}`}
        </Texto>
      </View>

      {item.camada3ProvaMetodo.ausencia ? (
        <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12 }}>
          {item.camada3ProvaMetodo.ausencia.textoExplicativo}
        </Texto>
      ) : null}

      <Pressable
        testID={`cartao-3camadas-toggle-${item.indicadorId}`}
        onPress={() => setAberto((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${aberto ? "Ocultar" : "Ver"} base de cálculo e fontes de ${item.tituloCurto}`}
        style={{
          minHeight: TOQUE_MINIMO,
          justifyContent: "center",
          borderTopWidth: 1,
          borderTopColor: cor("cor-linha"),
          paddingTop: 8,
        }}
      >
        <Texto tipo="etiqueta" cor="cor-azul-cadastral" style={{ fontSize: 12.5 }}>
          {aberto ? "Ocultar prova e método" : "Ver prova, chaves e fonte oficial"}
        </Texto>
      </Pressable>

      {aberto ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: cor("cor-linha"),
            paddingTop: 10,
            gap: 5,
          }}
        >
          <Texto tipo="numero" cor="cor-texto-apoio" style={{ fontSize: 11.5, fontVariant: ["tabular-nums"] }}>
            {`Origem: ${tagRotulo[item.camada3ProvaMetodo.epistemicTag]} · DSQFL: ${item.camada3ProvaMetodo.chavesDuplas.dsqfl ?? "a confirmar"} · CNM: ${item.camada3ProvaMetodo.chavesDuplas.cnm16 ?? "a confirmar"}`}
          </Texto>
          <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 17 }}>
            {`O que mede: ${item.camada3ProvaMetodo.metodo6Campos.oQueMede}`}
          </Texto>
          <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 17 }}>
            {`Base legal/normativa: ${item.camada3ProvaMetodo.metodo6Campos.baseLegalOuNormativa}`}
          </Texto>
          <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 17 }}>
            {`Conta aplicada: ${item.camada3ProvaMetodo.metodo6Campos.aritmeticaResumo}`}
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5 }}>
            {`Fonte: ${item.camada3ProvaMetodo.metodo6Campos.fontePrimaria} (${item.camada3ProvaMetodo.metodo6Campos.vintage}) · Limite: ${item.camada3ProvaMetodo.metodo6Campos.limiteEpistemologico}`}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}
