import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import type { CartaoCidadao3Camadas } from "../../dados/cidadao/tradutorCidadao";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";
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
    `Identificação cadastral: Lote municipal ${opts.dsqfl ?? "a confirmar"} | Matrícula CNM ${opts.cnm16 ?? "a confirmar"}`,
    "",
  ];
  const corpo = opts.cartoes.map(
    (c, idx) =>
      `${idx + 1}. ${c.tituloCurto}: ${c.camada1Manchete}\n   Pedido/Verificação: ${c.camada2AcaoConcreta}`,
  );
  return [...cab, ...corpo, "", "Mensagem preparada com o VEREDA."].join("\n");
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
  const [copiado, setCopiado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const texto = montarTextoNegociacaoPartilhavel({ tituloImovel, dsqfl, cnm16, cartoes });

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const copiarRoteiro = () => {
    void Clipboard.setStringAsync(texto)
      .then(() => {
        setCopiado(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopiado(false), 3000);
      })
      .catch(() => setCopiado(false));
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
      accessibilityLabel="Resumo partilhável de evidências e perguntas para corretor"
    >
      <Texto tipo="secao" style={{ fontSize: 15.5 }}>
        Roteiro para enviar ao corretor ou proprietário
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5 }}>
        Texto objetivo com documentos e perguntas de negociação (dados pessoais sensíveis nunca são incluídos).
      </Texto>

      <Pressable
        testID="botao-copiar-roteiro-evidencia"
        onPress={copiarRoteiro}
        accessibilityRole="button"
        style={{
          minHeight: TOQUE_MINIMO,
          backgroundColor: copiado ? cor("cor-salvia-suave") : cor("cor-texto"),
          borderRadius: RAIO.quadrado,
          paddingHorizontal: 14,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Texto tipo="etiqueta" cor={copiado ? "cor-salvia-escura" : "cor-superficie"} style={{ fontSize: 13 }}>
          {copiado ? "Roteiro copiado para a área de transferência!" : "Copiar roteiro pronto para WhatsApp ou e-mail"}
        </Texto>
      </Pressable>

      <Pressable
        testID="botao-alternar-previa-roteiro"
        onPress={() => setCopiadoOuExpandido((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: copiadoOuExpandido }}
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
          {copiadoOuExpandido ? "Ocultar prévia do roteiro" : "Ler prévia do roteiro antes de copiar"}
        </Texto>
      </Pressable>

      {copiadoOuExpandido ? (
        <View style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 8 }}>
          <Texto tipo="apoio" style={{ fontSize: 11.5, lineHeight: 17 }}>
            {texto}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}
