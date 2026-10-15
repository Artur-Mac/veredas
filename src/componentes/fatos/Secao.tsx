import { useEffect, useState, type ReactNode } from "react";
import { Animated, Platform, View } from "react-native";
import type { Dossie } from "../../dados/esquema";
import { useCarregando } from "../../estado/fatos";
import { useSessao } from "../../estado/Sessao";
import { animarSecao, useReduzirMovimento } from "../../tema/movimento";
import { ESPACO, MOVIMENTO, RAIO } from "../../tema/tokens";
import { Cartao, IconeDeSecao } from "../Cartao";
import { EtiquetaFase, FaseVisivel, PilulaIlustrativo } from "../Etiquetas";
import { Icone, eIcone } from "../Icone";
import type { NomeIcone } from "../icones";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Bloco } from "../Traco";
import { AnelPequeno } from "./Graficos";

type Comum = {
  titulo: string;
  fase: "prototipo" | "final";
  icone: string;
  resumo: string;
  ilustrativo?: boolean;
};

function iconeOuErro(nome: string): NomeIcone {
  if (!eIcone(nome)) throw new Error(`Ícone ausente: ${nome}`);
  return nome;
}

function Textos({ titulo, fase, resumo, ilustrativo, aberta }: Comum & { aberta: boolean }) {
  const carregando = useCarregando();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: ESPACO[2] }}>
        <Texto tipo="secao">{titulo}</Texto>
        <EtiquetaFase fase={fase} />
        {ilustrativo ? <PilulaIlustrativo /> : null}
      </View>
      {aberta ? null : carregando ? (
        <Bloco largura="70%" />
      ) : (
        <Texto tipo="apoio" cor="cor-texto-apoio" numberOfLines={1}>
          {resumo}
        </Texto>
      )}
    </View>
  );
}

type PropsDaSecao = Comum & {
  dossie: Dossie;
  id: string;
  pequeno?: Parameters<typeof AnelPequeno>[0]["grafico"];
  children: ReactNode;
};

export function SecaoDeFato({ dossie, id, pequeno, children, ...comum }: PropsDaSecao) {
  const { abertas, alternarSecao } = useSessao();
  const reduzir = useReduzirMovimento();
  const aberta = (abertas[dossie.id] ?? []).includes(id);
  const [giro] = useState(() => new Animated.Value(aberta ? 1 : 0));

  useEffect(() => {
    Animated.timing(giro, {
      toValue: aberta ? 1 : 0,
      duration: reduzir ? 0 : MOVIMENTO.seta,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [aberta, giro, reduzir]);

  const rotacao = giro.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  return (
    <FaseVisivel fase={comum.fase}>
      <Cartao>
        <Pressionavel
          role="button"
          accessibilityLabel={`${comum.titulo}, ${comum.resumo}`}
          accessibilityState={{ expanded: aberta }}
          onPress={() => {
            animarSecao(reduzir);
            alternarSecao(dossie.id, id);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: ESPACO[3],
            minHeight: 64,
            paddingVertical: ESPACO[3],
            paddingLeft: ESPACO[3],
            paddingRight: ESPACO[2],
            borderRadius: RAIO.cartao,
          }}
        >
          <IconeDeSecao nome={iconeOuErro(comum.icone)} />
          <Textos {...comum} aberta={aberta} />
          {pequeno && !aberta ? <AnelPequeno grafico={pequeno} /> : null}
          <Animated.View style={{ width: 32, alignItems: "center", transform: [{ rotate: rotacao }] }}>
            <Icone nome="chevron-down" />
          </Animated.View>
        </Pressionavel>
        {aberta ? (
          <View role="region" accessibilityLabel={comum.titulo} style={{ paddingHorizontal: ESPACO[4], paddingBottom: ESPACO[4], gap: ESPACO[3] }}>
            {children}
          </View>
        ) : null}
      </Cartao>
    </FaseVisivel>
  );
}

type PropsDoLink = Comum & { onPress: () => void };

export function SecaoLink({ onPress, ...comum }: PropsDoLink) {
  return (
    <FaseVisivel fase={comum.fase}>
      <Cartao>
        <Pressionavel
          role="link"
          accessibilityLabel={`${comum.titulo}, ${comum.resumo}`}
          onPress={onPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: ESPACO[3],
            minHeight: 64,
            paddingVertical: ESPACO[3],
            paddingLeft: ESPACO[3],
            paddingRight: ESPACO[2],
            borderRadius: RAIO.cartao,
          }}
        >
          <IconeDeSecao nome={iconeOuErro(comum.icone)} />
          <Textos {...comum} aberta={false} />
          <View style={{ width: 32, alignItems: "center" }}>
            <Icone nome="chevron-right" tamanho="p" />
          </View>
        </Pressionavel>
      </Cartao>
    </FaseVisivel>
  );
}
