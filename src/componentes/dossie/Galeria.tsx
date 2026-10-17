import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, Modal, ScrollView, View, useWindowDimensions } from "react-native";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO } from "../../tema/tokens";
import { Botao, BotaoIcone } from "../Botao";
import { Icone } from "../Icone";
import { Pressionavel } from "../Pressionavel";
import { Cabecalho, Tela } from "../Tela";
import { Texto } from "../Texto";

type Foto = { url: string; descricao: string };
type Props = {
  fotos: readonly Foto[];
  titulo: string;
  alternativa?: ReactNode;
  aoAbrirMapa?: () => void;
};

export function GaleriaDoAnuncio({ fotos, titulo, alternativa, aoAbrirMapa }: Props) {
  const { cor } = useTema();
  const { height: alturaDaTela } = useWindowDimensions();
  const rolagem = useRef<ScrollView>(null);
  const posicao = useRef(0);
  const [largura, setLargura] = useState(0);
  const [indice, setIndice] = useState(0);
  const [ampliada, setAmpliada] = useState(false);
  const [falhas, setFalhas] = useState<string[]>([]);
  const disponiveis = fotos.filter((foto) => !falhas.includes(foto.url));
  const quantidade = disponiveis.length;
  const atual = Math.min(indice, Math.max(0, quantidade - 1));
  const fotoAtual = disponiveis[atual];
  const altura = Math.min(420, largura ? largura * 0.75 : 260, Math.max(180, alturaDaTela * 0.45));

  useEffect(() => {
    posicao.current = Math.min(posicao.current, Math.max(0, quantidade - 1));
    setIndice(posicao.current);
    rolagem.current?.scrollTo({ x: posicao.current * largura, animated: false });
  }, [largura, quantidade]);

  function escolher(novo: number) {
    const proximo = Math.max(0, Math.min(novo, quantidade - 1));
    posicao.current = proximo;
    setIndice(proximo);
    rolagem.current?.scrollTo({ x: proximo * largura, animated: false });
  }

  const falhou = (url: string) => setFalhas((atuais) => atuais.includes(url) ? atuais : [...atuais, url]);
  const controles = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: ESPACO[2] }}>
      {([-1, 1] as const).map((direcao) => {
        const desativado = direcao === -1 ? atual === 0 : atual === quantidade - 1;
        return (
          <Pressionavel
            key={direcao}
            accessibilityRole="button"
            accessibilityLabel={direcao === -1 ? "Foto anterior" : "Próxima foto"}
            accessibilityState={{ disabled: desativado }}
            disabled={desativado}
            onPress={() => escolher(atual + direcao)}
            style={{ width: 48, height: 48, borderRadius: RAIO.pilula, backgroundColor: cor("cor-superficie"), alignItems: "center", justifyContent: "center", opacity: desativado ? 0.5 : 1 }}
          >
            <Icone nome={direcao === -1 ? "chevron-left" : "chevron-right"} />
          </Pressionavel>
        );
      })}
    </View>
  );

  if (!fotoAtual) return alternativa ?? (
    <View style={{ marginHorizontal: ESPACO[3], padding: ESPACO[5], backgroundColor: cor("cor-superficie"), borderRadius: RAIO.cartao }}>
      <Texto cor="cor-texto-apoio" role="status">As fotos não carregaram. Você pode vê-las no anúncio original.</Texto>
    </View>
  );

  return (
    <>
      <View
        onLayout={(event) => setLargura(event.nativeEvent.layout.width)}
        style={{ height: altura, borderRadius: RAIO.cartao, marginHorizontal: ESPACO[3], marginBottom: ESPACO[2], overflow: "hidden", backgroundColor: cor("cor-linha") }}
      >
        {largura > 0 ? (
          <ScrollView
            ref={rolagem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            onScroll={(event) => {
              const novo = Math.max(0, Math.min(quantidade - 1, Math.round(event.nativeEvent.contentOffset.x / largura)));
              posicao.current = novo;
              setIndice(novo);
            }}
            style={{ flex: 1 }}
          >
            {disponiveis.map((foto) => (
              <Image
                key={foto.url}
                source={{ uri: foto.url }}
                accessibilityLabel={`${foto.descricao}. ${titulo}`}
                resizeMode="cover"
                onError={() => falhou(foto.url)}
                style={{ width: largura, height: altura }}
              />
            ))}
          </ScrollView>
        ) : null}
        <View style={{ position: "absolute", left: ESPACO[3], top: ESPACO[3] }}>
          <Botao rotulo={`Fotos · ${atual + 1} / ${quantidade}`} icone="camera" tamanhoIcone="p" pilula acessivel={`Ampliar foto ${atual + 1} de ${quantidade}: ${fotoAtual.descricao}`} onPress={() => setAmpliada(true)} />
        </View>
        <View style={{ position: "absolute", left: ESPACO[3], bottom: ESPACO[3] }}>{quantidade > 1 ? controles : null}</View>
        {aoAbrirMapa ? (
          <View style={{ position: "absolute", right: ESPACO[3], bottom: ESPACO[3] }}>
            <Botao rotulo="Abrir mapa" icone="map" tamanhoIcone="p" pilula onPress={aoAbrirMapa} />
          </View>
        ) : null}
      </View>
      <Modal visible={ampliada} animationType="none" onRequestClose={() => setAmpliada(false)}>
        <Tela>
          <Cabecalho titulo="Fotos do anúncio" direita={<BotaoIcone icone="x" acessivel="Fechar fotos" onPress={() => setAmpliada(false)} />} />
          <Image source={{ uri: fotoAtual.url }} accessibilityLabel={`${fotoAtual.descricao}. ${titulo}`} resizeMode="contain" onError={() => falhou(fotoAtual.url)} style={{ flex: 1, width: "100%" }} />
          <View style={{ padding: ESPACO[4], gap: ESPACO[3] }}>
            <Texto style={{ textAlign: "center" }} aria-live="polite">{`${atual + 1} de ${quantidade} · ${fotoAtual.descricao}`}</Texto>
            {quantidade > 1 ? controles : null}
          </View>
        </Tela>
      </Modal>
    </>
  );
}
