import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform, Pressable, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, G, Line, Path, Pattern, Rect } from "react-native-svg";
import type { Dossie } from "../../dados/esquema";
import { formatarDistancia } from "../../dados/formatos";
import { useTema } from "../../tema/Tema";
import { RAIO, type Cores } from "../../tema/tokens";
import { Texto } from "../Texto";
import { caminho, dentroDoPoligono, geometria, type Geometria, type Ponto } from "./geometria";

export type Camada = "ruas" | "3d" | "calor" | "alagamento";
type Lotes = "confirmado" | "candidatos" | "nenhum";

type OpcoesDoMundo = {
  raios: number[];
  lotes: Lotes;
  selecionado: number;
  destacarVizinhos: boolean;
  camada: Camada;
  comCalor: boolean;
  destinos: Ponto[];
};

type Props = Partial<OpcoesDoMundo> & {
  dossie: Dossie;
  ajustar: number;
  acessivel: string;
  interativo?: boolean;
  aoTocarLote?: (indice: number) => void;
  aoTocarMapa?: (ponto: Ponto) => void;
  aoTocarPino?: () => void;
  rotuloPino?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

type Vista = { escala: number; centro: Ponto };

const NAO_ESCALA = "non-scaling-stroke" as const;

const Mundo = memo(function Mundo({ g, o, cores, id }: { g: Geometria; o: OpcoesDoMundo; cores: Cores; id: string }) {
  const graus = (g.angulo * 180) / Math.PI;
  const hachura = `hachura-${id}`;
  const lote0 = g.lotes[0];
  const escolhido = g.lotes[o.selecionado];
  return (
    <>
      <Rect x={-4000} y={-4000} width={8000} height={8000} fill={cores["mapa-terra"]} />
      <G transform={`rotate(${graus.toFixed(2)})`}>
        {g.pracas.map((p) => (
          <Rect key={`${p.x},${p.y}`} x={p.x} y={p.y} width={p.largura} height={p.altura} rx={6} fill={cores["mapa-praca"]} />
        ))}
        {g.ruas.map((r) => (
          <Line key={`${r.x1},${r.y1},${r.x2}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={cores["mapa-via"]} strokeWidth={r.largura} />
        ))}
      </G>
      {g.agua.tipo === "mar" ? (
        <>
          <Path
            d={`M ${g.agua.pontos.map(([x, y]) => `${x - 70} ${y}`).join(" L ")} L 4000 3400 L 4000 -3400 Z`}
            fill={cores["mapa-praia"]}
          />
          <Path d={`M ${g.agua.pontos.map(([x, y]) => `${x} ${y}`).join(" L ")} L 4000 3400 L 4000 -3400 Z`} fill={cores["mapa-mar"]} />
        </>
      ) : (
        <Path d={g.agua.d} fill="none" stroke={cores["mapa-mar"]} strokeWidth={g.agua.largura} />
      )}
      {o.camada === "calor" && o.comCalor
        ? g.calor.map((c) => (
            <Rect key={`${c.x},${c.y}`} x={c.x} y={c.y} width={100} height={100} fill={cores["cor-texto"]} fillOpacity={0.06 + c.v * 0.54} />
          ))
        : null}
      {o.camada === "alagamento" ? (
        <>
          <Defs>
            <Pattern id={hachura} width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <Line x1={0} y1={0} x2={0} y2={16} stroke={cores["cor-texto"]} strokeWidth={3} strokeOpacity={0.45} />
            </Pattern>
          </Defs>
          {g.agua.tipo === "mar" ? (
            <Path
              d={`M ${g.agua.pontos.map(([x, y]) => `${x - 150} ${y}`).join(" L ")} L ${g.agua.pontos
                .slice()
                .reverse()
                .map(([x, y]) => `${x} ${y}`)
                .join(" L ")} Z`}
              fill={`url(#${hachura})`}
            />
          ) : (
            <>
              <Path d={g.agua.d} fill="none" stroke={`url(#${hachura})`} strokeWidth={g.agua.largura + 120} />
              <Path d={g.agua.d} fill="none" stroke={cores["mapa-mar"]} strokeWidth={g.agua.largura} />
            </>
          )}
        </>
      ) : null}
      {o.camada === "3d" ? (
        <>
          {g.predios.map((p, i) => (
            <Path
              key={`s${i}`}
              d={caminho(p.poligono.map(([x, y]) => [x + p.altura * 0.5, y + p.altura * 0.35]))}
              fill={cores["cor-texto"]}
              fillOpacity={0.16}
            />
          ))}
          {g.predios.map((p, i) => (
            <Path
              key={`p${i}`}
              d={caminho(p.poligono)}
              fill={cores["cor-superficie"]}
              stroke={cores["cor-traco"]}
              strokeWidth={1}
              vectorEffect={NAO_ESCALA}
            />
          ))}
        </>
      ) : null}
      {o.lotes === "candidatos" && escolhido ? (
        <>
          {g.lotes.map((lote, i) =>
            i === o.selecionado ? null : (
              <Path
                key={`l${i}`}
                d={caminho(lote)}
                fill={cores["cor-superficie"]}
                fillOpacity={o.destacarVizinhos ? 0.9 : 0.5}
                stroke={o.destacarVizinhos ? cores["cor-texto"] : cores["cor-traco"]}
                strokeWidth={o.destacarVizinhos ? 2 : 1.5}
                strokeDasharray="4 3"
                vectorEffect={NAO_ESCALA}
              />
            ),
          )}
          <Path
            d={caminho(escolhido)}
            fill={cores["cor-azul-cadastral"]}
            fillOpacity={0.18}
            stroke={cores["cor-azul-cadastral"]}
            strokeWidth={1.5}
            vectorEffect={NAO_ESCALA}
          />
        </>
      ) : null}
      {o.lotes === "confirmado" && lote0 ? (
        <Path
          d={caminho(lote0)}
          fill={cores["cor-azul-cadastral"]}
          fillOpacity={0.18}
          stroke={cores["cor-azul-cadastral"]}
          strokeWidth={1.5}
          vectorEffect={NAO_ESCALA}
        />
      ) : null}
      {o.raios.map((raio) => (
        <Circle
          key={raio}
          cx={0}
          cy={0}
          r={raio}
          fill="none"
          stroke={cores["cor-barro"]}
          strokeWidth={1.25}
          strokeDasharray="4 4"
          vectorEffect={NAO_ESCALA}
        />
      ))}
      {o.destinos.map(([x, y]) => (
        <Circle
          key={`${x},${y}`}
          cx={x}
          cy={y}
          r={5}
          fill={cores["cor-texto"]}
          stroke={cores["cor-superficie"]}
          strokeWidth={2}
          vectorEffect={NAO_ESCALA}
        />
      ))}
    </>
  );
});

function Pino({ cores }: { cores: Cores }) {
  return (
    <Svg width={28} height={36} viewBox="0 0 28 36" aria-hidden>
      <Path
        d="M14 35 C14 35 2 22.5 2 13.5 a12 12 0 0 1 24 0 C26 22.5 14 35 14 35 Z"
        fill={cores["cor-barro"]}
        stroke={cores["cor-superficie"]}
        strokeWidth={2}
      />
      <Circle cx={14} cy={13.5} r={4.5} fill={cores["cor-superficie"]} />
    </Svg>
  );
}

export function PilulaDoMapa({ texto }: { texto: string }) {
  const { cor } = useTema();
  return (
    <View
      style={{
        minHeight: 28,
        paddingHorizontal: 10,
        borderRadius: RAIO.pilula,
        backgroundColor: cor("cor-superficie"),
        justifyContent: "center",
      }}
    >
      <Texto tipo="apoio" numberOfLines={1}>
        {texto}
      </Texto>
    </View>
  );
}

function limitar(vista: Vista): Vista {
  const escala = Math.min(4, Math.max(0.05, vista.escala));
  const [cx, cy] = vista.centro;
  return { escala, centro: [Math.max(-2600, Math.min(2600, cx)), Math.max(-2600, Math.min(2600, cy))] };
}

type Gesto = { moveu: boolean; inicio: Ponto; anterior: Ponto; pinca: number | null; origem: Ponto };
type Tamanho = { largura: number; altura: number };

function paraMundo([sx, sy]: Ponto, t: Tamanho, v: Vista): Ponto {
  return [(sx - t.largura / 2) / v.escala + v.centro[0], (sy - t.altura / 2) / v.escala + v.centro[1]];
}

function ampliar(v: Vista, t: Tamanho, fator: number, foco: Ponto): Vista {
  const antes = paraMundo(foco, t, v);
  const comEscala = limitar({ ...v, escala: v.escala * fator });
  const depois = paraMundo(foco, t, comEscala);
  return limitar({ ...comEscala, centro: [comEscala.centro[0] + antes[0] - depois[0], comEscala.centro[1] + antes[1] - depois[1]] });
}

export function Mapa(props: Props) {
  const { cores } = useTema();
  const {
    dossie,
    ajustar,
    acessivel,
    interativo = false,
    raios = [500],
    lotes = "confirmado",
    selecionado = 0,
    destacarVizinhos = false,
    camada = "ruas",
    comCalor = false,
    destinos = [],
    aoTocarLote,
    aoTocarMapa,
    aoTocarPino,
    rotuloPino,
    children,
    style,
  } = props;
  const g = geometria(dossie.id);
  const chaveDosRaios = raios.join(",");
  const chaveDosDestinos = JSON.stringify(destinos);
  const opcoes = useMemo<OpcoesDoMundo>(
    () => ({
      raios: chaveDosRaios ? chaveDosRaios.split(",").map(Number) : [],
      lotes,
      selecionado,
      destacarVizinhos,
      camada,
      comCalor,
      destinos: JSON.parse(chaveDosDestinos) as Ponto[],
    }),
    [chaveDosRaios, lotes, selecionado, destacarVizinhos, camada, comCalor, chaveDosDestinos],
  );
  const [tamanho, setTamanho] = useState<{ largura: number; altura: number } | null>(null);
  const [vista, setVista] = useState<Vista | null>(null);
  const raiz = useRef<View>(null);
  const gesto = useRef<Gesto>({ moveu: false, inicio: [0, 0], anterior: [0, 0], pinca: null, origem: [0, 0] });

  const zoom = useCallback(
    (fator: number, foco: Ponto) => {
      if (!tamanho) return;
      setVista((atual) => (atual ? ampliar(atual, tamanho, fator, foco) : atual));
    },
    [tamanho],
  );

  useEffect(() => {
    if (Platform.OS !== "web" || !interativo) return;
    const no = raiz.current as unknown as HTMLElement | null;
    if (!no || typeof no.addEventListener !== "function") return;
    const aoRolar = (evento: WheelEvent) => {
      evento.preventDefault();
      const caixa = no.getBoundingClientRect();
      zoom(Math.exp(-evento.deltaY * 0.0015), [evento.clientX - caixa.left, evento.clientY - caixa.top]);
    };
    no.addEventListener("wheel", aoRolar, { passive: false });
    return () => no.removeEventListener("wheel", aoRolar);
  }, [zoom, interativo]);

  const local = ([px, py]: Ponto): Ponto => [px - gesto.current.origem[0], py - gesto.current.origem[1]];

  const aoComecar = (evento: GestureResponderEvent) => {
    const { pageX, pageY } = evento.nativeEvent;
    gesto.current = { ...gesto.current, moveu: false, inicio: [pageX, pageY], anterior: [pageX, pageY], pinca: null };
    raiz.current?.measureInWindow((x, y) => {
      gesto.current.origem = [x, y];
    });
  };

  const aoMover = (evento: GestureResponderEvent) => {
    const atual = gesto.current;
    const [a, b] = evento.nativeEvent.touches;
    if (a && b) {
      atual.moveu = true;
      const distancia = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
      if (atual.pinca && atual.pinca > 0) zoom(distancia / atual.pinca, local([(a.pageX + b.pageX) / 2, (a.pageY + b.pageY) / 2]));
      atual.pinca = distancia;
      return;
    }
    atual.pinca = null;
    const { pageX, pageY } = evento.nativeEvent;
    if (Math.hypot(pageX - atual.inicio[0], pageY - atual.inicio[1]) > 6) atual.moveu = true;
    const dx = pageX - atual.anterior[0];
    const dy = pageY - atual.anterior[1];
    atual.anterior = [pageX, pageY];
    setVista((v) => (v ? limitar({ ...v, centro: [v.centro[0] - dx / v.escala, v.centro[1] - dy / v.escala] }) : v));
  };

  const aoSoltar = () => {
    if (gesto.current.moveu || !tamanho || !vista) return;
    const ponto = paraMundo(local(gesto.current.inicio), tamanho, vista);
    if (lotes === "candidatos" && aoTocarLote) {
      const indice = g.lotes.findIndex((l) => dentroDoPoligono(ponto, l));
      if (indice >= 0) {
        aoTocarLote(indice);
        return;
      }
    }
    aoTocarMapa?.(ponto);
  };

  const respostas = interativo
    ? {
        onStartShouldSetResponder: () => true,
        onMoveShouldSetResponderCapture: () => true,
        onResponderTerminationRequest: () => false,
        onResponderGrant: aoComecar,
        onResponderMove: aoMover,
        onResponderRelease: aoSoltar,
      }
    : {};

  const aTela = ([x, y]: Ponto): Ponto =>
    tamanho && vista
      ? [tamanho.largura / 2 + (x - vista.centro[0]) * vista.escala, tamanho.altura / 2 + (y - vista.centro[1]) * vista.escala]
      : [0, 0];

  const pino = aTela([0, 0]);

  return (
    <View
      ref={raiz}
      accessibilityLabel={acessivel}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (!width || !height) return;
        setTamanho({ largura: width, altura: height });
        setVista((atual) => atual ?? { escala: (Math.min(width, height) / 2 - 14) / ajustar, centro: [0, 0] });
      }}
      style={[{ overflow: "hidden", backgroundColor: cores["mapa-terra"] }, style]}
    >
      {tamanho && vista ? (
        <>
          <View
            {...respostas}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            aria-hidden
          >
            <Svg width={tamanho.largura} height={tamanho.altura}>
              <G
                transform={`translate(${(tamanho.largura / 2 - vista.centro[0] * vista.escala).toFixed(2)} ${(
                  tamanho.altura / 2 -
                  vista.centro[1] * vista.escala
                ).toFixed(2)}) scale(${vista.escala.toFixed(5)})`}
              >
                <Mundo g={g} o={opcoes} cores={cores} id={dossie.id} />
              </G>
            </Svg>
          </View>
          <View pointerEvents="box-none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
            {opcoes.raios.map((raio) => {
              const [rx, ry] = aTela([0, -raio]);
              if (ry < 14 || ry > tamanho.altura - 14 || rx < 0 || rx > tamanho.largura) return null;
              return (
                <View
                  key={raio}
                  pointerEvents="none"
                  style={{ position: "absolute", left: rx - 90, top: ry - 14, width: 180, alignItems: "center" }}
                >
                  <PilulaDoMapa texto={`${formatarDistancia(raio)} em linha reta`} />
                </View>
              );
            })}
            {aoTocarPino ? (
              <Pressable
                role="button"
                accessibilityLabel={rotuloPino}
                onPress={aoTocarPino}
                style={{ position: "absolute", left: pino[0] - 14, top: pino[1] - 36 }}
              >
                <Pino cores={cores} />
              </Pressable>
            ) : (
              <View pointerEvents="none" style={{ position: "absolute", left: pino[0] - 14, top: pino[1] - 36 }}>
                <Pino cores={cores} />
              </View>
            )}
            {children}
          </View>
        </>
      ) : null}
    </View>
  );
}
