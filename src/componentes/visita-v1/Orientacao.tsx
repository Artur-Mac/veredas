// Orientação da janela (index.html: openVisitLight 5870, updateCompassAzimuth 5880, CSS .vv-compass 3191–3196).
// A pessoa informa para onde a janela está voltada, de 0° a 359°; o app mostra o rótulo (N, NE, L, SE, S, SO, O, NO).
// Não usa bússola do aparelho nem sol calculado: é só o registro dela.
import { useRef, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Path, Text as TextoSvg } from "react-native-svg";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, TOQUE_MINIMO } from "../../tema/tokens";
import { Icone } from "../Icone";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { LinkDeAcao } from "./blocos";
import { limitarGraus, orientacaoDaJanela } from "./logica";

const TAMANHO_DA_BUSSOLA = 108;
const MARGEM_DO_CONTROLE = 12;
const PASSO_ASSISTIVO = 5;

/** `.vv-compass > svg`: rosa dos ventos com a agulha na direção informada; sem valor, sem agulha. */
function Bussola({ graus }: { graus: number | null }) {
  const { cor } = useTema();
  const o = graus === null ? null : orientacaoDaJanela(graus);
  const marca = { fontSize: 10, fill: cor("cor-texto-apoio"), textAnchor: "middle" as const, fontFamily: "PlusJakartaSans" };
  return (
    <Svg
      width={TAMANHO_DA_BUSSOLA}
      height={TAMANHO_DA_BUSSOLA}
      viewBox="0 0 110 110"
      role="img"
      aria-label={o ? `Janela voltada para ${o.nome}, ${o.graus} graus` : "Orientação da janela ainda não registrada"}
    >
      <Circle cx={55} cy={55} r={49} fill="none" stroke={cor("cor-linha-forte")} strokeWidth={1} />
      <TextoSvg x={55} y={20} {...marca}>
        N
      </TextoSvg>
      <TextoSvg x={94} y={59} {...marca}>
        L
      </TextoSvg>
      <TextoSvg x={55} y={98} {...marca}>
        S
      </TextoSvg>
      <TextoSvg x={16} y={59} {...marca}>
        O
      </TextoSvg>
      {o ? (
        // Rotação em torno do centro pelo atributo do próprio SVG: `rotation` com `origin` vira `transform-origin`, que a
        // web não aceita como atributo.
        <G transform={`rotate(${o.graus} 55 55)`}>
          <Path d="M55 29 49 61 55 57 61 61Z" fill={cor("cor-acao")} />
          <Path d="M55 81 49 61 55 57 61 61Z" fill={cor("cor-traco")} />
        </G>
      ) : null}
      <Circle cx={55} cy={55} r={3} fill={cor("cor-texto")} />
    </Svg>
  );
}

function BotaoDePasso({ sinal, acessivel, onPress }: { sinal: "mais" | "menos"; acessivel: string; onPress: () => void }) {
  const { cor } = useTema();
  return (
    <Pressionavel
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      onPress={onPress}
      style={{
        width: TOQUE_MINIMO,
        height: TOQUE_MINIMO,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RAIO.pilula,
        borderWidth: 1,
        borderColor: cor("cor-linha-forte"),
      }}
    >
      {sinal === "mais" ? (
        <Icone nome="plus" tamanho="m" />
      ) : (
        <Svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
          <Path d="M5 12h14" fill="none" stroke={cor("cor-texto")} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      )}
    </Pressionavel>
  );
}

/**
 * Controle de 0° a 359°: arrastar no trilho ou tocar em − e + (1° por toque; dá a volta, porque a direção é circular).
 * Para leitor de tela, o trilho aceita "aumentar" e "diminuir" em passos de 5°. Sem registro (`graus` nulo), o trilho não
 * informa valor nenhum ao leitor de tela, só "Não registrada", e o primeiro toque em − ou + registra 0° (N): o primeiro
 * passo não parte de um zero que ninguém escolheu.
 */
function ControleDeGraus({ graus, aoMudar }: { graus: number | null; aoMudar: (graus: number) => void }) {
  const { cor } = useTema();
  const trilho = useRef<View>(null);
  const largura = useRef(0);
  const origem = useRef(0);
  const [medido, setMedido] = useState(0);
  const valor = graus ?? 0;
  const o = orientacaoDaJanela(valor);

  // Posição horizontal da página (toque ou mouse) -> graus. O trilho é medido na janela a cada toque, porque a
  // rolagem e o teclado mudam onde ele está.
  const aplicar = (paginaX: number) => {
    const util = largura.current - 2 * MARGEM_DO_CONTROLE;
    if (util <= 0) return;
    aoMudar(limitarGraus(((paginaX - origem.current - MARGEM_DO_CONTROLE) / util) * 359));
  };

  const passo = (delta: number) => aoMudar(graus === null ? 0 : (((graus + delta) % 360) + 360) % 360);
  const posicao = medido > 0 ? MARGEM_DO_CONTROLE + (valor / 359) * (medido - 2 * MARGEM_DO_CONTROLE) : MARGEM_DO_CONTROLE;
  const texto = graus === null ? "Não registrada" : `${o.graus} graus, ${o.nome}`;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
      <BotaoDePasso sinal="menos" acessivel="Girar a direção da janela 1 grau para a esquerda" onPress={() => passo(-1)} />
      <View
        ref={trilho}
        onLayout={(e) => {
          largura.current = e.nativeEvent.layout.width;
          setMedido(e.nativeEvent.layout.width);
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(evento) => {
          const x0 = evento.nativeEvent.pageX;
          trilho.current?.measureInWindow((x) => {
            origem.current = x;
            aplicar(x0);
          });
        }}
        onResponderMove={(evento) => aplicar(evento.nativeEvent.pageX)}
        accessible
        role="slider"
        accessibilityLabel="Direção da janela em graus"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={graus ?? undefined}
        aria-valuetext={texto}
        accessibilityValue={graus === null ? { min: 0, max: 359, text: texto } : { min: 0, max: 359, now: graus, text: texto }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(evento) => {
          if (evento.nativeEvent.actionName === "increment") passo(PASSO_ASSISTIVO);
          if (evento.nativeEvent.actionName === "decrement") passo(-PASSO_ASSISTIVO);
        }}
        style={{ flex: 1, height: TOQUE_MINIMO, justifyContent: "center" }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: MARGEM_DO_CONTROLE,
            right: MARGEM_DO_CONTROLE,
            height: 6,
            borderRadius: 3,
            backgroundColor: cor("cor-linha-forte"),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: MARGEM_DO_CONTROLE,
            width: Math.max(0, posicao - MARGEM_DO_CONTROLE),
            height: 6,
            borderRadius: 3,
            backgroundColor: graus === null ? cor("cor-linha-forte") : cor("cor-acao"),
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: posicao - 10,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: graus === null ? cor("cor-traco") : cor("cor-acao"),
            borderWidth: 2,
            borderColor: cor("cor-campo"),
          }}
        />
      </View>
      <BotaoDePasso sinal="mais" acessivel="Girar a direção da janela 1 grau para a direita" onPress={() => passo(1)} />
    </View>
  );
}

/** "Luz na janela": bússola, rótulo e controle. `graus` nulo = a pessoa ainda não registrou. */
export function OrientacaoDaJanela({ graus, aoMudar }: { graus: number | null; aoMudar: (graus: number | null) => void }) {
  const o = graus === null ? null : orientacaoDaJanela(graus);
  return (
    <View style={{ gap: ESPACO[3] }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        <Bussola graus={graus} />
        <View style={{ flex: 1, minWidth: 0 }}>
          {o ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: ESPACO[2] }}>
                <Texto
                  tipo="titulo-tela"
                  accessibilityLabel={o.nome}
                  style={{ fontSize: 30, lineHeight: 34, fontWeight: "500", letterSpacing: -1.2 }}
                >
                  {o.rotulo}
                </Texto>
                <Texto tipo="numero" cor="cor-texto-apoio" style={{ fontSize: 14, lineHeight: 20 }}>
                  {`${o.graus}°`}
                </Texto>
              </View>
              <Texto tipo="secao" style={{ fontWeight: "600" }}>
                {o.nome}
              </Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18, marginTop: 4 }}>
                {o.dica}
              </Texto>
            </>
          ) : (
            <>
              <Texto tipo="secao" style={{ fontWeight: "600" }}>
                Sem registro
              </Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18, marginTop: 4 }}>
                Ajuste a direção para registrar para onde a janela está voltada.
              </Texto>
            </>
          )}
        </View>
      </View>
      <ControleDeGraus graus={graus} aoMudar={aoMudar} />
      {graus !== null ? <LinkDeAcao rotulo="Limpar orientação" seta={false} onPress={() => aoMudar(null)} /> : null}
    </View>
  );
}
