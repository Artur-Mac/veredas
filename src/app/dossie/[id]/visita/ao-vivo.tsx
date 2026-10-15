import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { View } from "react-native";
import { Botao, BotaoIcone } from "../../../../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../../../../componentes/Cartao";
import { Icone } from "../../../../componentes/Icone";
import type { NomeIcone } from "../../../../componentes/icones";
import { Pressionavel } from "../../../../componentes/Pressionavel";
import { Cabecalho, Rolagem, Tela, voltarOu } from "../../../../componentes/Tela";
import { Texto } from "../../../../componentes/Texto";
import { Bloco, NaoSabemos } from "../../../../componentes/Traco";
import { ListaDoRoteiro, useRoteiro } from "../../../../componentes/visita/Roteiro";
import { formatarNumero } from "../../../../dados/formatos";
import { distanciaMetros } from "../../../../dados/geo";
import { useDossie } from "../../../../navegacao/useDossie";
import { TemaEscuro, useTema } from "../../../../tema/Tema";
import { ESPACO, RAIO } from "../../../../tema/tokens";

const DIRECOES = ["norte", "nordeste", "leste", "sudeste", "sul", "sudoeste", "oeste", "noroeste"];

type Gps = { tipo: "pergunta" } | { tipo: "lendo" } | { tipo: "nao_sabemos" } | { tipo: "distancia"; metros: number };
type Leitura = { tipo: "vazio" } | { tipo: "nao_sabemos" } | { tipo: "texto"; texto: string } | { tipo: "feito" };

function Cronometro() {
  const [segundos, setSegundos] = useState(0);
  const [pausado, setPausado] = useState(false);
  useEffect(() => {
    if (pausado) return;
    const relogio = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(relogio);
  }, [pausado]);
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  return (
    <Cartao>
      <CorpoDoCartao style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Texto tipo="numero" style={{ fontSize: 48, lineHeight: 52 }}>{`${mm}:${ss}`}</Texto>
        <BotaoIcone
          icone={pausado ? "player-play" : "player-pause"}
          acessivel="Pausar"
          pressionado={pausado}
          onPress={() => setPausado((p) => !p)}
        />
      </CorpoDoCartao>
    </Cartao>
  );
}

function CartaoDoGps({ centro }: { centro: [number, number] }) {
  const [gps, setGps] = useState<Gps>({ tipo: "pergunta" });
  const assinatura = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => () => assinatura.current?.remove(), []);

  const permitir = async () => {
    setGps({ tipo: "lendo" });
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setGps({ tipo: "nao_sabemos" });
      return;
    }
    assinatura.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (posicao) => setGps({ tipo: "distancia", metros: distanciaMetros(centro, [posicao.coords.longitude, posicao.coords.latitude]) }),
      () => setGps({ tipo: "nao_sabemos" }),
    );
  };

  let corpo: ReactNode;
  if (gps.tipo === "pergunta") {
    corpo = (
      <>
        <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
          <Icone nome="current-location" />
          <Texto style={{ flex: 1 }}>Para confirmar o prédio, o Vereda usa a sua localização só durante a visita.</Texto>
        </View>
        <View style={{ flexDirection: "row", gap: ESPACO[2] }}>
          <View style={{ flex: 1 }}>
            <Botao rotulo="Permitir" variante="principal" onPress={() => void permitir().catch(() => setGps({ tipo: "nao_sabemos" }))} />
          </View>
          <View style={{ flex: 1 }}>
            <Botao rotulo="Agora não" onPress={() => setGps({ tipo: "nao_sabemos" })} />
          </View>
        </View>
      </>
    );
  } else if (gps.tipo === "lendo") {
    corpo = <Bloco largura="60%" />;
  } else if (gps.tipo === "nao_sabemos") {
    corpo = <NaoSabemos />;
  } else {
    corpo = (
      <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
        <Icone nome="current-location" />
        <Texto tipo="secao">
          {gps.metros <= 40 ? "Você está no prédio" : `Você está a ${formatarNumero(Math.round(gps.metros))} m do prédio`}
        </Texto>
      </View>
    );
  }
  return (
    <Cartao>
      <CorpoDoCartao>{corpo}</CorpoDoCartao>
    </Cartao>
  );
}

function ItemDaGrade({ icone, titulo, leitura, onPress, expandido }: { icone: NomeIcone; titulo: string; leitura: Leitura; onPress: () => void; expandido?: boolean }) {
  const { cor } = useTema();
  return (
    <Pressionavel
      role="button"
      accessibilityLabel={titulo}
      accessibilityState={expandido === undefined ? undefined : { expanded: expandido }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 112,
        padding: ESPACO[4],
        gap: ESPACO[2],
        backgroundColor: cor("cor-superficie"),
        borderRadius: RAIO.cartao,
        alignItems: "flex-start",
      }}
    >
      <Icone nome={icone} tamanho="g" />
      <Texto tipo="secao">{titulo}</Texto>
      {leitura.tipo === "nao_sabemos" ? <NaoSabemos /> : null}
      {leitura.tipo === "texto" ? (
        <Texto tipo="apoio" cor="cor-texto-apoio">
          {leitura.texto}
        </Texto>
      ) : null}
      {leitura.tipo === "feito" ? <Icone nome="check" tamanho="p" /> : null}
    </Pressionavel>
  );
}

function ModoVisita() {
  const dossie = useDossie();
  const { itens, marcados } = useRoteiro(dossie);
  const [foto, setFoto] = useState<Leitura>({ tipo: "vazio" });
  const [ruido, setRuido] = useState<Leitura>({ tipo: "vazio" });
  const [bussola, setBussola] = useState<Leitura>({ tipo: "vazio" });
  const [listaAberta, setListaAberta] = useState(false);
  const gravador = useAudioRecorder({ ...RecordingPresets.LOW_QUALITY, isMeteringEnabled: true });
  const estadoDoGravador = useAudioRecorderState(gravador, 250);
  const rumo = useRef<Location.LocationSubscription | null>(null);
  const pai = { pathname: "/dossie/[id]/visita", params: { id: dossie.id } } as const;

  useEffect(
    () => () => {
      rumo.current?.remove();
    },
    [],
  );

  useEffect(() => {
    if (!estadoDoGravador.isRecording) return;
    return () => {
      void gravador.stop();
    };
  }, [estadoDoGravador.isRecording, gravador]);

  const metragem = estadoDoGravador.metering;
  const leituraDoRuido: Leitura =
    estadoDoGravador.isRecording && typeof metragem === "number"
      ? { tipo: "texto", texto: `${Math.max(30, Math.min(110, Math.round(metragem + 94)))} dB agora` }
      : ruido;

  const tirarFoto = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      setFoto({ tipo: "nao_sabemos" });
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (!resultado.canceled) setFoto({ tipo: "feito" });
  };

  const medirRuido = async () => {
    if (estadoDoGravador.isRecording) return;
    const permissao = await requestRecordingPermissionsAsync();
    if (!permissao.granted) {
      setRuido({ tipo: "nao_sabemos" });
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await gravador.prepareToRecordAsync();
    gravador.record();
  };

  const lerBussola = async () => {
    if (rumo.current) return;
    setBussola({ tipo: "nao_sabemos" });
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    rumo.current = await Location.watchHeadingAsync((leitura) => {
      const graus = leitura.trueHeading >= 0 ? leitura.trueHeading : leitura.magHeading;
      setBussola({ tipo: "texto", texto: `janela da sala: ${DIRECOES[Math.round(graus / 45) % 8]}` });
    });
  };

  const naoSabemos = (definir: (l: Leitura) => void) => () => definir({ tipo: "nao_sabemos" });

  return (
    <Tela>
      <StatusBar style="light" />
      <Cabecalho
        titulo="Modo visita"
        direita={<Botao rotulo="Encerrar" pilula onPress={() => voltarOu(pai)} style={{ alignSelf: "center" }} />}
      />
      <Rolagem>
        <Cronometro />
        <CartaoDoGps centro={dossie.lote.centro} />
        <View style={{ marginHorizontal: ESPACO[3], gap: ESPACO[2] }}>
          <View style={{ flexDirection: "row", gap: ESPACO[2] }}>
            <ItemDaGrade icone="camera" titulo="Foto da fachada" leitura={foto} onPress={() => void tirarFoto().catch(naoSabemos(setFoto))} />
            <ItemDaGrade icone="ear" titulo="Ruído" leitura={leituraDoRuido} onPress={() => void medirRuido().catch(naoSabemos(setRuido))} />
          </View>
          <View style={{ flexDirection: "row", gap: ESPACO[2] }}>
            <ItemDaGrade icone="compass" titulo="Bússola" leitura={bussola} onPress={() => void lerBussola().catch(naoSabemos(setBussola))} />
            <ItemDaGrade
              icone="clipboard-check"
              titulo="Roteiro"
              leitura={{ tipo: "texto", texto: `${marcados.length} de ${itens.length}` }}
              expandido={listaAberta}
              onPress={() => setListaAberta((a) => !a)}
            />
          </View>
        </View>
        {listaAberta ? (
          <Cartao style={{ marginTop: ESPACO[2] }}>
            <CorpoDoCartao>
              <ListaDoRoteiro dossie={dossie} />
            </CorpoDoCartao>
          </Cartao>
        ) : null}
      </Rolagem>
    </Tela>
  );
}

export default function TelaDoModoVisita() {
  return (
    <TemaEscuro>
      <ModoVisita />
    </TemaEscuro>
  );
}
