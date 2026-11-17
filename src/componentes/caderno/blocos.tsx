import { useState, type ReactNode } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { useTema } from "../../tema/Tema";
import { TIPOS } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { useFocoDoCampo } from "../casca/foco";

export function CampoLocal({ rotulo, ...props }: TextInputProps & { rotulo: string }) {
  const { cor } = useTema();
  const foco = useFocoDoCampo();
  return <View style={{ gap: 6, marginVertical: 6 }}>
    <Texto tipo="apoio">{rotulo}</Texto>
    <TextInput {...props} accessibilityLabel={rotulo} onFocus={foco.aoFocar} onBlur={foco.aoDesfocar}
      placeholderTextColor={cor("cor-texto-apoio")}
      style={[TIPOS.corpo, { color: cor("cor-texto"), backgroundColor: cor("cor-superficie"), borderWidth: 1, borderColor: cor("cor-linha-forte"),
        borderRadius: 10, padding: 12, minHeight: 48, fontSize: 16, textAlignVertical: "top" }, foco.estilo, props.style]} />
  </View>;
}
export function GrupoLocal({ titulo, apoio, children, aberto = false, aoAlternar }: { titulo: string; apoio?: string; children: ReactNode; aberto?: boolean; aoAlternar?: (aberto: boolean) => void }) {
  const [visivel, setVisivel] = useState(aberto);
  const { cor } = useTema();
  return <View style={{ borderTopWidth: 1, borderColor: cor("cor-linha"), paddingVertical: 14, gap: 10 }}>
    <Botao rotulo={`${visivel ? "−" : "+"} ${titulo}`} expandido={visivel} onPress={() => { setVisivel(!visivel); aoAlternar?.(!visivel); }} />
    {apoio ? <Texto tipo="apoio" cor="cor-texto-apoio">{apoio}</Texto> : null}
    {visivel ? children : null}
  </View>;
}
export function EscolhaLocal<T extends string>({ rotulo, valor, opcoes, aoEscolher }: {
  rotulo: string; valor: T; opcoes: readonly { valor: T; rotulo: string }[]; aoEscolher: (v: T) => void;
}) {
  return <View role="group" accessibilityLabel={rotulo} style={{ gap: 6, marginVertical: 8 }}>
    <Texto tipo="apoio">{rotulo}</Texto>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {opcoes.map(o => <Botao key={o.valor} rotulo={`${o.valor === valor ? "✓ " : ""}${o.rotulo}`}
        acessivel={`${rotulo}: ${o.rotulo}${o.valor === valor ? ", selecionado" : ""}`} pilula onPress={() => aoEscolher(o.valor)} />)}
    </View>
  </View>;
}

/** Vazio é ausência; formato inválido gera erro, nunca vira zero. Valores em reais com vírgula brasileira. */
export function centavosDaEntrada(texto: string): number | null {
  if (!texto.trim()) return null;
  const limpo = texto.trim().replace(/^R\$\s*/, "");
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(limpo)) throw new Error("Informe o valor em reais, como 2.500,00, ou deixe vazio.");
  const resultado = Math.round(Number(limpo.replace(/\./g, "").replace(",", ".")) * 100);
  if (!Number.isSafeInteger(resultado) || resultado > 1e12) throw new Error("Valor fora do limite.");
  return resultado;
}
