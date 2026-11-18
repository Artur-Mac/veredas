import { useState } from "react";
import { Pressable, View } from "react-native";
import type { CartaoCidadao3Camadas } from "../../dados/cidadao/tradutorCidadao";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO, comAlfa } from "../../tema/tokens";
import { Texto } from "../Texto";

/**
 * Gerador do Resumo de Evidências Partilhável (100% em português):
 * Organiza os argumentos de negociação e as perguntas objetivas para o corretor/síndico
 * excluindo estritamente qualquer preferência sensível de saúde/acessibilidade do usuário.
 */
export function montarTextoNegociacaoPartilhavel(opts: {
  tituloImovel: string;
  dsqfl: string | null;
  cnm16: string | null;
  cartoes: readonly CartaoCidadao3Camadas[];
}): string {
  const cab = [
    `RESUMO DE VERIFICAÇÃO — ${opts.tituloImovel}`,
    `Identificação cadastral: DSQFL ${opts.dsqfl ?? "a confirmar"} | Matrícula CNM ${opts.cnm16 ?? "a confirmar"}`,
    "",
  ];
  const corpo = opts.cartoes.map(
    (c, idx) =>
      `${idx + 1}. ${c.tituloCurto}: ${c.camada1Manchete}\n   Pedido/Verificação: ${c.camada2AcaoConcreta}`,
  );
  return [...cab, ...corpo].join("\n");
}

export function ResumoEvidenciaPartilhavel({
  tituloImovel,
  dsqfl = null,
  cnm16 = null,
  cartoes,
}: {
  tituloImovel: string;
  dsqfl?: string | null;
  cnm16?: string | null;
  cartoes: readonly CartaoCidadao3Camadas[];
}) {
  const { cor } = useTema();
  const [copiadoOuExpandido, setCopiadoOuExpandido] = useState(false);
  const texto = montarTextoNegociacaoPartilhavel({ tituloImovel, dsqfl, cnm16, cartoes });

  return (
    <View
      style={{
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto"), 0.12),
        borderRadius: RAIO.cartao,
        padding: 14,
        gap: 8,
      }}
      accessibilityLabel="Resumo partilhável de evidências e perguntas para corretor"
    >
      <Texto tipo="secao" style={{ fontSize: 15.5 }}>
        Roteiro para enviar ao corretor ou proprietário
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5 }}>
        Texto objetivo com documentos e perguntas de negociação (dados pessoais sensíveis nunca são incluídos).
      </Texto>

      <Pressable
        onPress={() => setCopiadoOuExpandido((v) => !v)}
        accessibilityRole="button"
        style={{
          minHeight: TOQUE_MINIMO,
          backgroundColor: cor("cor-azul-cadastral-suave"),
          borderRadius: RAIO.pilula,
          paddingHorizontal: 14,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Texto tipo="etiqueta" cor="cor-azul-cadastral" style={{ fontSize: 13 }}>
          {copiadoOuExpandido ? "Ocultar roteiro pronto" : "Visualizar roteiro pronto para copiar"}
        </Texto>
      </Pressable>

      {copiadoOuExpandido ? (
        <View style={{ backgroundColor: cor("cor-papel-claro"), borderRadius: RAIO.quadrado, padding: 10 }}>
          <Texto tipo="apoio" style={{ fontSize: 11.5, lineHeight: 17 }}>
            {texto}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}
