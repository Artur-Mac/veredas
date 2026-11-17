// Peças do "vx" de index.html (Comparar, Visita e Salvos; CSS a partir da linha 3045): linha de topo com
// sobretítulo e link, cabeçalho em Fraunces, segmentos, superfície branca e link ferrugem com seta.
// Cores só por token; texto pequeno ferrugem usa "cor-barro-texto" (contraste), o laranja fica no preenchimento.
import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTema } from "../../tema/Tema";
import { RAIO, comAlfa, type TokenDeCor } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Coluna } from "../casca/Coluna";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";

/**
 * `.vx-page`: a coluna do app (720 px no desktop), centrada. As margens laterais de 16 px ficam na rolagem da tela
 * (`MARGEM_DA_PAGINA_VX`), fora da coluna, para os cartões terem a mesma largura das demais telas.
 */
export function PaginaVx({ children }: { children: ReactNode }) {
  return <Coluna style={{ paddingTop: 12, paddingBottom: 22 }}>{children}</Coluna>;
}

/** Margem lateral que a rolagem de Comparar e de Salvos dá à `PaginaVx`. */
export const MARGEM_DA_PAGINA_VX = 16;

export function SetaVx({ cor = "cor-barro-texto", tamanho = 14 }: { cor?: TokenDeCor; tamanho?: number }) {
  const { cor: corDe } = useTema();
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={corDe(cor)} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

/** `.vx-kicker`: 10 px, 600, caixa alta, 0,07em, ferrugem. */
export function KickerVx({ children }: { children: string }) {
  return (
    <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 10, lineHeight: 14, fontWeight: "600", letterSpacing: 0.7, textTransform: "uppercase" }}>
      {children}
    </Texto>
  );
}

type PropsDoLink = {
  rotulo: string;
  onPress: () => void;
  /** Seta depois do rótulo (padrão). */
  seta?: boolean;
  tamanho?: number;
  acessivel?: string;
  cor?: TokenDeCor;
};

/** `.vx-link`: altura mínima 44, 12 px, 600, ferrugem, seta depois. */
export function LinkVx({ rotulo, onPress, seta = true, tamanho = 12, acessivel, cor = "cor-barro-texto" }: PropsDoLink) {
  return (
    <Pressionavel
      role="link"
      accessibilityLabel={acessivel ?? rotulo}
      onPress={onPress}
      style={{ minHeight: 44, paddingVertical: 8, flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 7 }}
    >
      <Texto tipo="etiqueta" cor={cor} style={{ fontSize: tamanho, lineHeight: tamanho + 6, fontWeight: "600" }}>
        {rotulo}
      </Texto>
      {seta ? <SetaVx cor={cor} tamanho={tamanho + 2} /> : null}
    </Pressionavel>
  );
}

type PropsDoCabecalho = {
  sobretitulo: string;
  link?: { rotulo: string; onPress: () => void };
  titulo: string;
  texto?: string;
};

/** `.vx-topline` + `.vx-head`. */
export function CabecalhoVx({ sobretitulo, link, titulo, texto }: PropsDoCabecalho) {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginHorizontal: 2, marginBottom: 4 }}>
        <KickerVx>{sobretitulo}</KickerVx>
        {link ? <LinkVx rotulo={link.rotulo} onPress={link.onPress} /> : null}
      </View>
      <View style={{ paddingTop: 5, paddingHorizontal: 3, paddingBottom: 18 }}>
        <Texto
          tipo="titulo-tela"
          role="heading"
          aria-level={1}
          style={{ fontSize: 34, lineHeight: 37, fontWeight: "500", letterSpacing: -1.5, maxWidth: 330 }}
        >
          {titulo}
        </Texto>
        {texto ? (
          <Texto cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 21, marginTop: 10 }}>
            {texto}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

type Opcao<T extends string> = { valor: T; rotulo: string };
type PropsDosSegmentos<T extends string> = {
  opcoes: readonly Opcao<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
  rotulo: string;
  /** `abas`: papéis tablist/tab (tópicos); `grupo`: radiogroup/radio (modalidade, filtros). */
  modo: "abas" | "grupo";
  margemInferior?: number;
};

/** `.vx-segments`: trilho de 11 px de raio com o segmento ativo em branco e peso 700. */
export function SegmentosVx<T extends string>({ opcoes, valor, aoMudar, rotulo, modo, margemInferior = 16 }: PropsDosSegmentos<T>) {
  const { cor } = useTema();
  return (
    <View
      role={modo === "abas" ? "tablist" : "radiogroup"}
      aria-label={rotulo}
      style={{
        flexDirection: "row",
        gap: 4,
        padding: 4,
        backgroundColor: cor("cor-sutil"),
        borderWidth: 1,
        borderColor: cor("cor-linha"),
        borderRadius: 11,
        marginBottom: margemInferior,
      }}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressionavel
            key={o.valor}
            role={modo === "abas" ? "tab" : "radio"}
            aria-selected={modo === "abas" ? ativo : undefined}
            aria-checked={modo === "grupo" ? ativo : undefined}
            accessibilityState={modo === "abas" ? { selected: ativo } : { checked: ativo }}
            onPress={() => aoMudar(o.valor)}
            style={{
              flex: 1,
              minHeight: 44,
              paddingHorizontal: 8,
              borderRadius: 7,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: ativo ? cor("cor-superficie") : "transparent",
              boxShadow: ativo ? `0 1px 3px ${comAlfa(cor("cor-texto"), 0.05)}` : undefined,
            }}
          >
            <Texto tipo="etiqueta" cor={ativo ? "cor-texto" : "cor-texto-apoio"} numberOfLines={1} style={{ fontSize: 12, fontWeight: ativo ? "700" : "400" }}>
              {o.rotulo}
            </Texto>
          </Pressionavel>
        );
      })}
    </View>
  );
}

/** `.vx-surface`: branca, borda de 7% de tinta, 16 px de raio. */
export function SuperficieVx({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { cor } = useTema();
  return (
    <View
      style={[
        { backgroundColor: cor("cor-superficie"), borderWidth: 1, borderColor: comAlfa(cor("cor-texto"), 0.07), borderRadius: RAIO.cartao, paddingVertical: 21, paddingHorizontal: 18 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** `.vx-primary`: laranja, 48 px de altura, 10 px de raio, tinta por cima (única adaptação de contraste), seta no fim. */
export function BotaoVx({ rotulo, onPress, seta = true, desativado }: { rotulo: string; onPress: () => void; seta?: boolean; desativado?: boolean }) {
  return (
    <Botao rotulo={rotulo} variante="principal" seta={seta} onPress={onPress} desativado={desativado} style={{ minHeight: 48, borderRadius: 10, boxShadow: "none" }} />
  );
}

/** Estado vazio de `.vx-empty`: título em Fraunces 27 e texto de apoio, centrados, com o botão embaixo. */
export function VazioVx({ titulo, texto, children }: { titulo: string; texto: string; children?: ReactNode }) {
  return (
    <SuperficieVx style={{ alignItems: "center", paddingVertical: 35, paddingHorizontal: 8 }}>
      <Texto tipo="titulo-tela" role="heading" style={{ fontSize: 27, lineHeight: 32, fontWeight: "500", textAlign: "center", marginTop: 16, marginBottom: 10 }}>
        {titulo}
      </Texto>
      <Texto cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 21, textAlign: "center" }}>
        {texto}
      </Texto>
      {children ? <View style={{ alignSelf: "stretch", marginTop: 24, gap: 4 }}>{children}</View> : null}
    </SuperficieVx>
  );
}
