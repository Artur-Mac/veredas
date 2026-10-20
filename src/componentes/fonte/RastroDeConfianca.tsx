import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, comAlfa, type TokenDeCor } from "../../tema/tokens";
import type { Confianca } from "../../dados/contratos";
import { Texto } from "../Texto";
import { EXPLICACAO_DA_CONFIANCA, ORDEM_DA_CONFIANCA, rotuloDaConfianca, type FonteDoDado } from "./textos";

// `.conf-trace` de index.html (linhas 2410 a 2440): um traço de 16 × 2 px antes do rótulo. A forma do traço diz a
// confiança sem depender de cor: contínuo = oficial, tracejado = declarado, pontilhado = inferência ou não sabemos.
// Dentro do dossiê, "não sabemos" usa o cinza de apoio (index.html linhas 2700 e 2701), e o texto pequeno usa os tokens
// de contraste do app: o texto de "oficial" é o azul cadastral; os demais, o cinza de apoio.
const TRACO: Record<Confianca, { cor: TokenDeCor; texto: TokenDeCor; tracejado: string | null; arredondado: boolean }> = {
  oficial: { cor: "cor-azul-cadastral", texto: "cor-azul-cadastral", tracejado: null, arredondado: false },
  declarado: { cor: "cor-traco", texto: "cor-texto-apoio", tracejado: "4 2.5", arredondado: false },
  inferencia: { cor: "cat-terra", texto: "cor-texto-apoio", tracejado: "0.1 3.6", arredondado: true },
  nao_sabemos: { cor: "cor-traco", texto: "cor-texto-apoio", tracejado: "0.1 3.6", arredondado: true },
};

/** Só o traço de 16 × 2 px, para listas onde o rótulo já está escrito ao lado. */
export function TracoDeConfianca({ confianca }: { confianca: Confianca }) {
  const { cor } = useTema();
  const t = TRACO[confianca];
  return (
    <Svg width={16} height={2} viewBox="0 0 16 2" aria-hidden>
      <Line
        x1={t.arredondado ? 1 : 0}
        y1={1}
        x2={16}
        y2={1}
        stroke={cor(t.cor)}
        strokeWidth={2}
        strokeDasharray={t.tracejado ?? undefined}
        strokeLinecap={t.arredondado ? "round" : "butt"}
      />
    </Svg>
  );
}

type PropsDoRastro = { confianca: Confianca; fonte?: FonteDoDado | null; texto?: string };

/** `.conf-trace` completo: o traço e o rótulo da categoria (ou `texto`, quando o rótulo precisa ser outro). */
export function RastroDeConfianca({ confianca, fonte = null, texto }: PropsDoRastro) {
  const t = TRACO[confianca];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <TracoDeConfianca confianca={confianca} />
      <Texto tipo="apoio" cor={t.texto} style={{ fontSize: 11, lineHeight: 14, fontWeight: "500", flexShrink: 1 }}>
        {texto ?? rotuloDaConfianca(confianca, fonte)}
      </Texto>
    </View>
  );
}

/**
 * As quatro categorias, na ordem de index.html, com a do dado em destaque: fundo creme, borda e rótulo em negrito.
 * As outras três ficam com a mesma cor de texto, sem apagar nada: o destaque não depende de contraste reduzido.
 */
export function RastroCompleto({ atual, fonte = null }: { atual: Confianca; fonte?: FonteDoDado | null }) {
  const { cor } = useTema();
  return (
    <View role="list" accessibilityLabel="Rastro de confiança" style={{ gap: ESPACO[2] }}>
      {ORDEM_DA_CONFIANCA.map((c) => {
        const ativa = c === atual;
        const t = TRACO[c];
        return (
          <View
            key={c}
            role="listitem"
            accessible
            accessibilityLabel={`${rotuloDaConfianca(c, fonte)}${ativa ? ", é a confiança deste dado" : ""}`}
            style={{
              gap: 4,
              paddingVertical: ESPACO[2] + 2,
              paddingHorizontal: ESPACO[3],
              borderRadius: RAIO.icone,
              borderWidth: 1,
              borderColor: ativa ? cor("cor-linha-forte") : "transparent",
              backgroundColor: ativa ? cor("cor-creme") : "transparent",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TracoDeConfianca confianca={c} />
              <Texto
                tipo="corpo"
                cor={t.texto}
                style={{ fontSize: 13, lineHeight: 18, fontWeight: ativa ? "700" : "500", flexShrink: 1 }}
              >
                {rotuloDaConfianca(c, fonte)}
              </Texto>
              {ativa ? (
                <View
                  style={{
                    marginLeft: "auto",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: RAIO.pilula,
                    backgroundColor: comAlfa(cor(t.cor), 0.14),
                  }}
                >
                  <Texto tipo="etiqueta" cor="cor-texto" style={{ fontSize: 11, lineHeight: 14, fontWeight: "600" }}>
                    Este dado
                  </Texto>
                </View>
              ) : null}
            </View>
            {ativa ? (
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
                {EXPLICACAO_DA_CONFIANCA[c]}
              </Texto>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
