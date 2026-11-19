import { useRef, useState } from "react";
import { View, type ViewProps, type ViewInstance } from "react-native";
import { useTema } from "../../tema/Tema";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { useFocoDeTeclado } from "../casca/foco";

/** Toque no trilho, arraste, setas do teclado, botões e ações de leitor de tela. */
export function ControleSolar({ valor, minimo, maximo, passo, rotulo, texto, aoMudar }: {
  valor: number; minimo: number; maximo: number; passo: number; rotulo: string; texto: string; aoMudar: (n: number) => void;
}) {
  const { cor } = useTema();
  const foco = useFocoDeTeclado();
  const ref = useRef<ViewInstance>(null), origem = useRef(0), largura = useRef(1);
  const [medida, setMedida] = useState(1);
  const mudar = (n: number) => aoMudar(Math.max(minimo, Math.min(maximo, Math.round(n / passo) * passo)));
  const porX = (x: number) => mudar(minimo + Math.max(0, Math.min(1, (x - origem.current - 12) / Math.max(1, largura.current - 24))) * (maximo - minimo));
  const teclado = { onKeyDown: (e: { key: string; preventDefault: () => void }) => {
    const next = e.key === "Home" ? minimo : e.key === "End" ? maximo : ["ArrowRight", "ArrowUp"].includes(e.key) ? valor + passo : ["ArrowLeft", "ArrowDown"].includes(e.key) ? valor - passo : null;
    if (next !== null) { e.preventDefault(); mudar(next); }
  } } as unknown as ViewProps;
  return <View style={{ gap: 6 }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <Texto tipo="apoio" cor="cor-texto-apoio">{rotulo}</Texto><Texto tipo="numero" style={{ fontSize: 19 }}>{texto}</Texto>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {[-1, 0, 1].map(s => s === 0 ? <View key="trilho" ref={ref} {...teclado}
        role="slider" tabIndex={0} accessible accessibilityLabel={rotulo} accessibilityValue={{ min: minimo, max: maximo, now: valor, text: texto }}
        aria-valuemin={minimo} aria-valuemax={maximo} aria-valuenow={valor} aria-valuetext={texto}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={e => mudar(valor + (e.nativeEvent.actionName === "increment" ? passo : -passo))}
        onLayout={e => { largura.current = e.nativeEvent.layout.width; setMedida(largura.current); }}
        onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
        onResponderGrant={e => { const x = e.nativeEvent.pageX; ref.current?.measureInWindow(left => { origem.current = left; porX(x); }); }}
        onResponderMove={e => porX(e.nativeEvent.pageX)}
        onFocus={foco.aoFocar} onBlur={foco.aoDesfocar}
        style={[{ flex: 1, height: 48, justifyContent: "center", borderRadius: 6 }, foco.estilo]}>
        <View pointerEvents="none" style={{ height: 4, marginHorizontal: 12, borderRadius: 3, backgroundColor: cor("cor-traco") }} />
        <View pointerEvents="none" style={{ position: "absolute", left: 2 + (valor - minimo) / (maximo - minimo) * (medida - 24),
          height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: cor("cor-superficie"), backgroundColor: cor("cor-acao") }} />
      </View> : <Pressionavel key={s} accessibilityRole="button" accessibilityLabel={`${s < 0 ? "Diminuir" : "Aumentar"} ${rotulo.toLowerCase()}`}
        onPress={() => mudar(valor + s * passo)} style={{ width: 48, height: 48, borderWidth: 1, borderRadius: 24, borderColor: cor("cor-linha"), alignItems: "center", justifyContent: "center" }}>
        <Texto style={{ fontSize: 22 }}>{s < 0 ? "−" : "+"}</Texto>
      </Pressionavel>)}
    </View>
  </View>;
}
