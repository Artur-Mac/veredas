import { View } from "react-native";
import { formatarReais } from "../../dados/formatos";
import type { ResumoCompartilhado } from "../../dados/salaDeDecisao";
import { useTema } from "../../tema/Tema";
import { Nota } from "../dossie-v1/base";
import { Texto } from "../Texto";

/**
 * Cartão read-only para o link privado `#v=` de dossiê único (HomeWiseDocs R24),
 * isolado sem dependência de AsyncStorage.
 */
export function CartaoResumoCompartilhado({ resumo }: { resumo: ResumoCompartilhado }) {
  const { cor } = useTema();
  const compra = resumo.m === "compra";
  return (
    <View
      testID="sala-resumo-compartilhado"
      style={{
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: cor("cor-linha-forte"),
        backgroundColor: cor("cor-superficie"),
        gap: 10,
      }}
    >
      <View style={{ gap: 2 }}>
        <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 12, fontWeight: "700" }}>
          Dossiê resumido compartilhado
        </Texto>
        <Texto tipo="secao" role="heading" style={{ fontSize: 18, lineHeight: 24, fontWeight: "700" }}>
          {resumo.n}
        </Texto>
        {resumo.e ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5 }}>
            {resumo.e}
          </Texto>
        ) : null}
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 10, gap: 4 }}>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12 }}>
          {`${compra ? "Compra" : "Aluguel"} · Sol e fachada: ${resumo.s}`}
        </Texto>
        <Texto tipo="numero" style={{ fontSize: 14, fontVariant: ["tabular-nums"] }}>
          {`Pedido no anúncio: ${resumo.p !== null ? `${formatarReais(resumo.p)}${compra ? "" : "/mês"}` : "A confirmar"}`}
        </Texto>
        <Texto tipo="numero" cor="cor-texto-apoio" style={{ fontSize: 13, fontVariant: ["tabular-nums"] }}>
          {`Saída mensal estimada: ${resumo.mb !== null ? `~${formatarReais(resumo.mb)}/mês` : "A calcular"}`}
        </Texto>
      </View>

      <Nota>Pacote privado lido diretamente do link, sem conta e sem servidor.</Nota>
    </View>
  );
}
