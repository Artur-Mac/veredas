// Peças pequenas da aba Visita: `.vx-kicker`, `.vx-link`, `.vx-surface`, `.vx-segments`, `.vx-field` e a barra
// `.vv-progress` de index.html (CSS 3045–3200). Só tokens de cor: dentro do painel de campo, sob `TemaEscuro`,
// as mesmas peças saem escuras.
import { useState, type ReactNode } from "react";
import { TextInput, View, type StyleProp, type TextInputProps, type ViewProps, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, TOQUE_MINIMO, comAlfa, type TokenDeCor } from "../../tema/tokens";
import { abaPorTecla, focarElemento, teclaDoEvento, type EventoDeTecla } from "../dossie-v1/teclado";
import { Icone } from "../Icone";
import type { NomeIcone } from "../icones";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";

/** A seta de `dossierIcon('arrow')`: a mesma do botão primário. */
export function Seta({ tamanho = 14, cor = "cor-barro" }: { tamanho?: number; cor?: TokenDeCor }) {
  const { cor: corDe } = useTema();
  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke={corDe(cor)}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

/** `.vx-link`: texto ferrugem 12/600, 44 px de altura, seta opcional depois do rótulo. */
export function LinkDeAcao({
  rotulo,
  onPress,
  seta = true,
  icone,
  acessivel,
  desativado = false,
}: {
  rotulo: string;
  onPress: () => void;
  seta?: boolean;
  icone?: NomeIcone;
  acessivel?: string;
  desativado?: boolean;
}) {
  return (
    <Pressionavel
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={acessivel ?? rotulo}
      accessibilityState={{ disabled: desativado }}
      style={{
        minHeight: TOQUE_MINIMO,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 7,
        paddingVertical: ESPACO[2],
        borderRadius: RAIO.quadrado,
        opacity: desativado ? 0.45 : 1,
      }}
    >
      {icone ? <Icone nome={icone} tamanho="p" cor="cor-barro" /> : null}
      <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontWeight: "600" }}>
        {rotulo}
      </Texto>
      {seta ? <Seta /> : null}
    </Pressionavel>
  );
}

/** `.vx-kicker`: 10 px, caixa alta, 0,07em, ferrugem. */
export function Chamada({ children }: { children: string }) {
  return (
    <Texto
      tipo="apoio"
      cor="cor-barro-texto"
      style={{ fontSize: 10, lineHeight: 14, fontWeight: "600", letterSpacing: 0.7, textTransform: "uppercase" }}
    >
      {children}
    </Texto>
  );
}

/** `.vx-surface`: cartão branco de raio 16, borda de 7% de tinta. */
export function Superficie({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { cor } = useTema();
  return (
    <View
      style={[
        {
          backgroundColor: cor("cor-superficie"),
          borderWidth: 1,
          borderColor: comAlfa(cor("cor-texto"), 0.07),
          borderRadius: RAIO.cartao,
          paddingVertical: 21,
          paddingHorizontal: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Título de seção em Fraunces 500, como `.vv-message h2` e `.vv-number-title h2`. */
export function TituloDeSecao({ children, tamanho = 23 }: { children: string; tamanho?: number }) {
  return (
    <Texto
      tipo="titulo-tela"
      role="heading"
      style={{ fontSize: tamanho, lineHeight: Math.round(tamanho * 1.2), fontWeight: "500", letterSpacing: -tamanho * 0.025 }}
    >
      {children}
    </Texto>
  );
}

type Etapa<T extends string> = { valor: T; rotulo: string };

const idDaEtapa = (valor: string) => `vx-etapa-${valor}`;

/**
 * `.vx-segments` com papel de abas: Preparar, No imóvel e, depois de encerrada, Resumo. Com teclado (`journeyTabKeys`):
 * setas, Home e End trocam de etapa e levam o foco; só a etapa ativa entra na ordem de Tab.
 */
export function Etapas<T extends string>({
  etapas,
  atual,
  aoEscolher,
  rotulo,
}: {
  etapas: readonly Etapa<T>[];
  atual: T;
  aoEscolher: (valor: T) => void;
  rotulo: string;
}) {
  const { cor } = useTema();
  const aoTeclar = (evento: EventoDeTecla) => {
    const destino = abaPorTecla(etapas.map((e) => e.valor), atual, teclaDoEvento(evento));
    if (destino === null) return;
    evento.preventDefault?.();
    aoEscolher(destino);
    focarElemento(idDaEtapa(destino));
  };
  // `onKeyDown` existe na web (react-native-web) e não consta nos tipos de View do React Native.
  const teclado = { onKeyDown: aoTeclar } as unknown as ViewProps;
  return (
    <View
      role="tablist"
      accessibilityLabel={rotulo}
      {...teclado}
      style={{
        flexDirection: "row",
        gap: 4,
        padding: 4,
        marginBottom: ESPACO[4],
        backgroundColor: cor("cor-sutil"),
        borderWidth: 1,
        borderColor: cor("cor-linha"),
        borderRadius: 11,
      }}
    >
      {etapas.map((etapa) => {
        const ativa = etapa.valor === atual;
        return (
          <Pressionavel
            key={etapa.valor}
            nativeID={idDaEtapa(etapa.valor)}
            role="tab"
            tabIndex={ativa ? 0 : -1}
            accessibilityLabel={etapa.rotulo}
            accessibilityState={{ selected: ativa }}
            aria-selected={ativa}
            onPress={() => aoEscolher(etapa.valor)}
            style={{
              flex: 1,
              minHeight: TOQUE_MINIMO,
              alignItems: "center",
              justifyContent: "center",
              padding: ESPACO[2],
              borderRadius: 7,
              backgroundColor: ativa ? cor("cor-superficie") : undefined,
              boxShadow: ativa ? `0 1px 3px ${comAlfa(cor("cor-texto"), 0.05)}` : undefined,
            }}
          >
            <Texto
              tipo="etiqueta"
              cor={ativa ? "cor-texto" : "cor-texto-apoio"}
              style={{ fontWeight: ativa ? "700" : "400" }}
              numberOfLines={1}
            >
              {etapa.rotulo}
            </Texto>
          </Pressionavel>
        );
      })}
    </View>
  );
}

type PropsDoCampo = Omit<TextInputProps, "style" | "multiline" | "numberOfLines"> & {
  rotulo: string;
  /** Linhas visíveis; mais de uma vira campo de várias linhas. */
  linhas?: number;
};

/** `.vx-field`: rótulo 12/600 e campo de 14 px com a fonte da marca; o foco acende a borda cadastral. */
export function CampoDeTexto({ rotulo, linhas = 1, onFocus, onBlur, ...resto }: PropsDoCampo) {
  const { cor } = useTema();
  const [foco, setFoco] = useState(false);
  const altura = linhas > 1 ? linhas * 22 + 22 : TOQUE_MINIMO;
  return (
    <View style={{ gap: 7 }}>
      <Texto tipo="etiqueta" style={{ fontWeight: "600" }}>
        {rotulo}
      </Texto>
      <TextInput
        accessibilityLabel={rotulo}
        multiline={linhas > 1}
        numberOfLines={linhas > 1 ? linhas : undefined}
        textAlignVertical={linhas > 1 ? "top" : "center"}
        placeholderTextColor={cor("cor-texto-apoio")}
        {...resto}
        onFocus={(e) => {
          setFoco(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFoco(false);
          onBlur?.(e);
        }}
        style={{
          minHeight: altura,
          paddingVertical: 11,
          paddingHorizontal: 11,
          borderRadius: RAIO.quadrado,
          borderWidth: 1,
          borderColor: foco ? cor("cor-azul-cadastral") : cor("cor-linha-forte"),
          backgroundColor: cor("cor-papel-claro"),
          boxShadow: foco ? `0 0 0 2px ${comAlfa(cor("cor-azul-cadastral"), 0.35)}` : undefined,
          color: cor("cor-texto"),
          fontFamily: "PlusJakartaSans",
          fontSize: 14,
          lineHeight: 22,
          outlineWidth: 0,
        }}
      />
    </View>
  );
}

/** `.vv-progress`: trilho de 5 px e preenchimento sálvia. */
export function BarraDeProgresso({ feitas, total, rotulo }: { feitas: number; total: number; rotulo: string }) {
  const { cor } = useTema();
  const parte = total > 0 ? Math.min(1, feitas / total) : 0;
  return (
    <View
      role="progressbar"
      accessibilityLabel={rotulo}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={feitas}
      accessibilityValue={{ min: 0, max: total, now: feitas }}
      style={{ height: 5, borderRadius: 4, overflow: "hidden", backgroundColor: cor("cor-sutil"), marginTop: 14, marginBottom: 10 }}
    >
      <View style={{ width: `${parte * 100}%`, height: "100%", borderRadius: 4, backgroundColor: cor("cor-salvia") }} />
    </View>
  );
}
