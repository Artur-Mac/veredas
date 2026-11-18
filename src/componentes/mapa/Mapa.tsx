import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform, Pressable, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, G, Mask, Path, Rect } from "react-native-svg";
import type { Coordenada, Dossie } from "../../dados/esquema";
import { formatarDistancia } from "../../dados/formatos";
import { slugDoBairroPorTexto } from "../../dados/formulario";
import { coordenadaParaMetros, metrosParaCoordenada } from "../../dados/geo";
import type { CaixaEmGraus } from "../../dados/recife/mapaBase";
import { useTema } from "../../tema/Tema";
import { comAlfa, RAIO, type Cores } from "../../tema/tokens";
import { Texto } from "../Texto";
import { AvisoDoFundoDoMapa } from "./AvisoDoFundoDoMapa";
import { CreditoDaBase, FundoDoMapa, SeloDoBairro } from "./FundoDoMapa";
import { descreverFundoDoMapa, loteNoPonto, type CenaDoFundo, type LoteNoDesenho, type QuadroDoFundo } from "./fundoDoMapaCena";
import type { ParaDesenho } from "./fundoDoMapaGeometria";
import { celulasDeCalor, type CelulaDeCalor, type Ponto } from "./geometria";
import { useFundoDoMapa, type EstadoDoFundo } from "./useFundoDoMapa";

/**
 * Camadas do mapa dos exemplos. "Alagamento" saiu da lista em 18/11/2026 (M2): era oferecida sem desenho nenhum, porque a
 * faixa hachurada sobre a água de verdade da base pareceria uma inundação mapeada. O fato da faixa marginal continua na
 * seção "Alagamento" do dossiê de exemplo.
 */
export type Camada = "ruas" | "3d" | "calor";
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
  /** false: sem o selo "BAIRRO" no canto (o topo do dossiê já tem as pílulas ali; o nome do bairro vem no desenho). */
  selo?: boolean;
  /** Retângulos [x0, y0, x1, y1], em px do mapa, que o que vai por cima ocupa (pílulas, botões): os rótulos desviam. */
  obstaculos?: (largura: number, altura: number) => [number, number, number, number][];
  /** Completa a frase do aviso quando o fundo falha: o que continua valendo neste mapa. */
  oQueContinua?: string;
  /** Avisa a tela (confirmar o lote) do estado do fundo e de quantos candidatos há; `escolhido`: o selecionado existe. */
  aoMudarCandidatos?: (info: InfoDosCandidatos) => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export type InfoDosCandidatos = { readonly estado: EstadoDoFundo; readonly quantos: number; readonly escolhido: boolean };

type Vista = { escala: number; centro: Ponto };

const NAO_ESCALA = "non-scaling-stroke" as const;
const SEM_OBSTACULOS = (): [number, number, number, number][] => [];
const semDesenho: ParaDesenho = () => [0, 0];

/** A água (e as pontes por cima dela) da cena que está na tela, com a conta que a leva ao mundo do mapa, em metros. */
export type AguaDoMapa = { readonly agua: string; readonly pontes: string; readonly transformacao: string };

/**
 * Calor de demonstração: células de 100 m, em metros em volta do imóvel. Onde a base tem água (mar, rio, canal) a célula
 * é recortada por uma máscara com o MESMO caminho e a mesma regra de preenchimento da camada de água do fundo: o calor
 * não pinta o mar (M3, 18/11/2026). As pontes, que o fundo desenha como chão por cima da água, continuam com calor.
 * Sem o fundo não se sabe onde há água, e as células ficam inteiras sobre a terra lisa.
 */
const Calor = memo(function Calor({ calor, agua, cores }: { calor: CelulaDeCalor[]; agua: AguaDoMapa | null; cores: Cores }) {
  // O id da máscara é do documento inteiro na web: dois mapas na mesma página não podem dividir a mesma.
  const id = "calor-sem-agua-" + useId().replace(/[^A-Za-z0-9_-]/g, "");
  const [x0, y0, lado] = extensaoDoCalor(calor);
  return (
    <>
      {agua ? (
        <Defs>
          <Mask id={id} maskUnits="userSpaceOnUse" x={x0} y={y0} width={lado} height={lado}>
            <Rect x={x0} y={y0} width={lado} height={lado} fill="#FFFFFF" />
            <G transform={agua.transformacao}>
              <Path d={agua.agua} fill="#000000" fillRule="evenodd" />
              {agua.pontes ? <Path d={agua.pontes} fill="#FFFFFF" fillRule="evenodd" /> : null}
            </G>
          </Mask>
        </Defs>
      ) : null}
      <G testID="calor-do-mapa" mask={agua ? `url(#${id})` : undefined}>
        {calor.map((c) => (
          <Rect key={`${c.x},${c.y}`} x={c.x} y={c.y} width={100} height={100} fill={cores["cor-texto"]} fillOpacity={0.06 + c.v * 0.54} />
        ))}
      </G>
    </>
  );
});

/** O quadrado [x, y, lado], em metros, que contém todas as células de calor. */
function extensaoDoCalor(calor: readonly CelulaDeCalor[]): [number, number, number] {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const c of calor) {
    if (c.x < x0) x0 = c.x;
    if (c.y < y0) y0 = c.y;
    if (c.x + 100 > x1) x1 = c.x + 100;
    if (c.y + 100 > y1) y1 = c.y + 100;
  }
  return Number.isFinite(x0) ? [x0, y0, Math.max(x1 - x0, y1 - y0)] : [0, 0, 0];
}

/** Raios e destinos: em metros, por cima do chão (o fundo ou a terra lisa). */
const Sobreposto = memo(function Sobreposto({ o, cores }: { o: OpcoesDoMundo; cores: Cores }) {
  return (
    <>
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

/** Caminho SVG dos anéis de um lote da base (coordenadas do desenho, pares x, y). */
export function caminhoDosAneis(aneis: readonly Float64Array[], dx = 0, dy = 0): string {
  const partes: string[] = [];
  for (const r of aneis) {
    if (r.length < 6) continue;
    let d = "";
    for (let i = 0; i < r.length; i += 2) d += `${i === 0 ? "M" : "L"}${(r[i]! + dx).toFixed(1)} ${(r[i + 1]! + dy).toFixed(1)}`;
    partes.push(`${d}Z`);
  }
  return partes.join("");
}

function centroDaCaixa(l: LoteNoDesenho): Ponto {
  return [(l.caixa[0] + l.caixa[2]) / 2, (l.caixa[1] + l.caixa[3]) / 2];
}

/**
 * Os candidatos de "É este o prédio?": na posição 0, o lote da base que contém o centro do imóvel (null se o centro não
 * cai em lote nenhum, o que acontece com coordenada ilustrativa na rua); depois os vizinhos mais próximos do centro.
 */
export function candidatosDaCena(cena: CenaDoFundo, centro: Ponto, quantos = 8): (LoteNoDesenho | null)[] {
  if (cena.nivel !== "lote") return [];
  const doImovel = loteNoPonto(cena, centro[0], centro[1]);
  const vizinhos = cena.lotes
    .filter((l) => l !== doImovel)
    .map((l) => {
      const [x, y] = centroDaCaixa(l);
      return { l, d: Math.hypot(x - centro[0], y - centro[1]) };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, quantos)
    .map((v) => v.l);
  return [doImovel, ...vizinhos];
}

const PE_DIREITO_M = 3;

/**
 * O que vai por cima do fundo, nas coordenadas do desenho da cena: lote escolhido ou candidatos, e as camadas de
 * demonstração que dependem do chão de verdade ("3D e sombra" com os lotes e pavimentos da base, só no nível de lote).
 */
const SobreOFundo = memo(function SobreOFundo({
  cena,
  escala,
  centro,
  o,
  cores,
}: {
  cena: CenaDoFundo;
  escala: number;
  centro: Ponto;
  o: OpcoesDoMundo;
  cores: Cores;
}) {
  const candidatos = o.lotes === "candidatos" ? candidatosDaCena(cena, centro) : [];
  const escolhido = candidatos[o.selecionado] ?? null;
  const volumes = o.camada === "3d" && cena.nivel === "lote" ? cena.lotes.filter((l) => l.pavimentos !== null && l.pavimentos > 0) : [];
  return (
    <>
      {volumes.length > 0 ? (
        <>
          <Path
            d={volumes.map((l) => caminhoDosAneis(l.aneis, (l.pavimentos ?? 0) * PE_DIREITO_M * 0.5 * escala, (l.pavimentos ?? 0) * PE_DIREITO_M * 0.35 * escala)).join("")}
            fill={cores["cor-texto"]}
            fillOpacity={0.16}
          />
          <Path
            d={volumes.map((l) => caminhoDosAneis(l.aneis)).join("")}
            fill={cores["cor-superficie"]}
            stroke={cores["cor-traco"]}
            strokeWidth={1}
            vectorEffect={NAO_ESCALA}
            fillRule="evenodd"
          />
        </>
      ) : null}
      {candidatos.map((lote, i) =>
        !lote || i === o.selecionado ? null : (
          <Path
            key={`l${i}`}
            d={caminhoDosAneis(lote.aneis)}
            fill={cores["cor-superficie"]}
            fillOpacity={o.destacarVizinhos ? 0.9 : 0.5}
            stroke={o.destacarVizinhos ? cores["cor-texto"] : cores["cor-traco"]}
            strokeWidth={o.destacarVizinhos ? 2 : 1.5}
            strokeDasharray="4 3"
            vectorEffect={NAO_ESCALA}
            fillRule="evenodd"
          />
        ),
      )}
      {escolhido ? (
        <Path
          d={caminhoDosAneis(escolhido.aneis)}
          fill={cores["cor-azul-cadastral"]}
          fillOpacity={0.85}
          stroke={cores["cor-azul-cadastral"]}
          strokeWidth={1.5}
          vectorEffect={NAO_ESCALA}
          fillRule="evenodd"
        />
      ) : null}
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

/**
 * A janela para a qual a cena do fundo foi montada: o centro e a escala (px por metro) da vista naquele momento, o
 * tamanho do mapa e uma folga em volta. O desenho da cena tem (largura + 2·folgaX) × (altura + 2·folgaY) px e o seu
 * canto (0, 0) fica em `origemDaJanela`, em metros do mundo do mapa.
 */
export type Janela = {
  readonly centro: Ponto;
  readonly escala: number;
  readonly largura: number;
  readonly altura: number;
  readonly folgaX: number;
  readonly folgaY: number;
};

/** Folga da janela em cada lado, em fração do tamanho do mapa. */
export const FOLGA_DA_JANELA = 0.3;
/** Fora deste intervalo de zoom em relação à janela, a cena é remontada (traços e rótulos ficariam grandes ou miúdos). */
const ZOOM_SEM_REMONTAR: readonly [number, number] = [0.7, 1.45];

export function janelaDaVista(vista: Vista, tamanho: Tamanho): Janela {
  return {
    centro: vista.centro,
    escala: vista.escala,
    largura: tamanho.largura,
    altura: tamanho.altura,
    folgaX: Math.round(tamanho.largura * FOLGA_DA_JANELA),
    folgaY: Math.round(tamanho.altura * FOLGA_DA_JANELA),
  };
}

/** Canto (0, 0) do desenho da cena, em metros do mundo. */
export function origemDaJanela(j: Janela): Ponto {
  return [j.centro[0] - (j.largura / 2 + j.folgaX) / j.escala, j.centro[1] - (j.altura / 2 + j.folgaY) / j.escala];
}

/**
 * Decide se a cena tem de ser remontada para a vista atual: não há janela, o mapa mudou de tamanho, o zoom saiu do
 * intervalo da janela ou a parte visível saiu da folga. Função pura; o mapa só pergunta quando o gesto termina.
 */
export function precisaRemontar(janela: Janela | null, vista: Vista, tamanho: Tamanho): boolean {
  if (!janela) return true;
  if (janela.largura !== tamanho.largura || janela.altura !== tamanho.altura) return true;
  const razao = vista.escala / janela.escala;
  if (razao < ZOOM_SEM_REMONTAR[0] || razao > ZOOM_SEM_REMONTAR[1]) return true;
  const visivelX = tamanho.largura / 2 / vista.escala;
  const visivelY = tamanho.altura / 2 / vista.escala;
  const cobreX = (janela.largura / 2 + janela.folgaX) / janela.escala;
  const cobreY = (janela.altura / 2 + janela.folgaY) / janela.escala;
  return Math.abs(vista.centro[0] - janela.centro[0]) + visivelX > cobreX || Math.abs(vista.centro[1] - janela.centro[1]) + visivelY > cobreY;
}

/** [lon, lat] → desenho da janela, pela mesma conta de metros do mapa (dados/geo). Linear em lon e lat. */
export function paraDesenhoDaJanela(j: Janela, centro: Coordenada): ParaDesenho {
  const [ox, oy] = origemDaJanela(j);
  return (ponto) => {
    const [x, y] = coordenadaParaMetros(centro, [ponto[0], ponto[1]]);
    return [(x - ox) * j.escala, (y - oy) * j.escala];
  };
}

/** Caixa [oeste, sul, leste, norte], em graus, do desenho inteiro da janela (com a folga). */
export function caixaDaJanela(j: Janela, centro: Coordenada): CaixaEmGraus {
  const [ox, oy] = origemDaJanela(j);
  const [oeste, norte] = metrosParaCoordenada(centro, ox, oy);
  const [leste, sul] = metrosParaCoordenada(centro, ox + (j.largura + 2 * j.folgaX) / j.escala, oy + (j.altura + 2 * j.folgaY) / j.escala);
  return [oeste, sul, leste, norte];
}

type Retangulo = [number, number, number, number];

/** Parte visível da janela no desenho da cena (sem arraste): o mapa sem a folga. */
export function visivelNaJanela(j: Janela): Retangulo {
  return [j.folgaX, j.folgaY, j.folgaX + j.largura, j.folgaY + j.altura];
}

/** Margem, em px, entre um rótulo e a borda do mapa. */
const MARGEM_DOS_ROTULOS = 4;

/**
 * Obstáculos (px do mapa, como `QuadroDoFundo.obstaculos`) que cobrem a folga em volta da parte visível: a cena coloca
 * rótulos de rua e nomes de bairro só dentro do mapa visível, com uma margem, no momento em que é montada.
 */
export function obstaculosDaFolga(j: Janela, margem = MARGEM_DOS_ROTULOS): Retangulo[] {
  const fx = j.folgaX + 1;
  const fy = j.folgaY + 1;
  return [
    [-fx, -fy, j.largura + fx, margem],
    [-fx, j.altura - margem, j.largura + fx, j.altura + fy],
    [-fx, -fy, margem, j.altura + fy],
    [j.largura - margem, -fy, j.largura + fx, j.altura + fy],
  ];
}

/** O desenho inteiro do pino (28 × 36 px, com a ponta no imóvel), em px do mapa na vista da janela. */
export function retanguloDoPino(j: Janela): Retangulo {
  const x = j.largura / 2 - j.centro[0] * j.escala;
  const y = j.altura / 2 - j.centro[1] * j.escala;
  return [x - 15, y - 37, x + 15, y + 2];
}

function dentro(c: readonly number[], r: Retangulo): boolean {
  return c[0]! >= r[0] && c[1]! >= r[1] && c[2]! <= r[2] && c[3]! <= r[3];
}

/**
 * Só os rótulos de rua e nomes de bairro da cena cuja caixa cabe inteira em `janela` (coordenadas do desenho). Rede de
 * segurança: com a folga como obstáculo a cena já os põe dentro; um rótulo que ainda saísse seria cortado na borda.
 */
export function rotulosNaJanela(cena: CenaDoFundo, janela: Retangulo): CenaDoFundo {
  const rotulos = cena.rotulos.filter((r) => r.caixas.every((c) => dentro(c, janela)));
  const bairros = cena.bairros.filter((b) => dentro(b.caixa, janela));
  if (rotulos.length === cena.rotulos.length && bairros.length === cena.bairros.length) return cena;
  return { ...cena, rotulos, bairros };
}

/** Espera depois do último movimento (roda, pinça, arraste) para considerar o gesto terminado. */
const FIM_DO_GESTO_MS = 220;
/** Lugar do crédito no canto de baixo à esquerda, em px (largura, altura), para os rótulos desviarem. */
const CREDITO: readonly [number, number] = [176, 18];
const ALTURA_PARA_O_SELO = 280;

type Mostrada = { cena: CenaDoFundo; janela: Janela };

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
    selo: comSelo = true,
    obstaculos = SEM_OBSTACULOS,
    oQueContinua = "O pino e os raios continuam valendo.",
    aoMudarCandidatos,
    children,
    style,
  } = props;
  const calor = celulasDeCalor(dossie.id);
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
  const [tamanho, setTamanho] = useState<Tamanho | null>(null);
  const [vista, setVista] = useState<Vista | null>(null);
  const [janela, setJanela] = useState<Janela | null>(null);
  const raiz = useRef<View>(null);
  const gesto = useRef<Gesto>({ moveu: false, inicio: [0, 0], anterior: [0, 0], pinca: null, origem: [0, 0] });

  // A primeira janela sai junto com o primeiro quadro. Depois, a cena acompanha a vista pelo transform durante o gesto;
  // quando a vista para (FIM_DO_GESTO_MS sem mudar) fora da janela, a janela é refeita e o gancho monta a cena de novo.
  if (tamanho && vista && !janela) setJanela(janelaDaVista(vista, tamanho));
  useEffect(() => {
    if (!tamanho || !vista || !janela || !precisaRemontar(janela, vista, tamanho)) return;
    const espera = setTimeout(() => setJanela(janelaDaVista(vista, tamanho)), FIM_DO_GESTO_MS);
    return () => clearTimeout(espera);
  }, [vista, tamanho, janela]);

  const centro = dossie.lote.centro;
  const bairro = useMemo(() => slugDoBairroPorTexto(dossie.bairro), [dossie.bairro]);
  const paraDesenho = useMemo(() => (janela ? paraDesenhoDaJanela(janela, centro) : semDesenho), [janela, centro]);
  const chaveDosObstaculos = tamanho ? JSON.stringify(obstaculos(tamanho.largura, tamanho.altura)) : "[]";
  const quadro = useMemo<QuadroDoFundo>(() => {
    const fx = janela?.folgaX ?? 0;
    const fy = janela?.folgaY ?? 0;
    const ocupados = JSON.parse(chaveDosObstaculos) as [number, number, number, number][];
    if (janela) {
      ocupados.push(...obstaculosDaFolga(janela), retanguloDoPino(janela));
      ocupados.push([8, janela.altura - 8 - CREDITO[1], 8 + CREDITO[0], janela.altura - 8]);
      if (comSelo && janela.altura >= ALTURA_PARA_O_SELO) ocupados.push([janela.largura - 150, 0, janela.largura, 56]);
      // As pílulas dos raios ficam no alto de cada círculo, na vista da janela.
      for (const raio of opcoes.raios) {
        const x = janela.largura / 2 - janela.centro[0] * janela.escala;
        const y = janela.altura / 2 + (-raio - janela.centro[1]) * janela.escala;
        ocupados.push([x - 72, y - 16, x + 72, y + 16]);
      }
    }
    return {
      largura: janela ? janela.largura + 2 * fx : 1,
      altura: janela ? janela.altura + 2 * fy : 1,
      paraDesenho,
      zoom: 1,
      deslocamento: [-fx, -fy],
      obstaculos: ocupados,
    };
  }, [janela, paraDesenho, chaveDosObstaculos, comSelo, opcoes.raios]);
  const caixa = useMemo<CaixaEmGraus>(() => (janela ? caixaDaJanela(janela, centro) : [0, 0, 0, 0]), [janela, centro]);
  const imovel = useMemo(() => ({ centro, codigoDoLogradouro: null }), [centro]);
  const fundo = useFundoDoMapa({ bairro, imovel, quadro, caixa, ativo: janela !== null });

  // Enquanto a cena da janela nova não chega (arquivos dos vizinhos, remontagem), fica na tela a última cena pronta, no
  // lugar dela no mundo: a área ainda sem arquivo aparece hachurada, como "sem dado". Sem cena nenhuma, chão liso.
  const [mostrada, setMostrada] = useState<Mostrada | null>(null);
  if (fundo.cena && janela && fundo.cena !== mostrada?.cena) setMostrada({ cena: fundo.cena, janela });
  // Cena sem dado nenhum (quadro fora do Recife): nem desenho, nem crédito, nem descrição.
  const cena = mostrada?.cena.temDado ? mostrada.cena : null;
  // O lote do imóvel só aparece destacado quando confirmado; nos candidatos, o destaque é o do escolhido.
  const janelaMostrada = mostrada?.janela ?? null;
  const cenaNaTela = useMemo(() => {
    if (!cena || !janelaMostrada) return null;
    const cabem = rotulosNaJanela(cena, visivelNaJanela(janelaMostrada));
    return lotes !== "confirmado" ? { ...cabem, camadas: { ...cabem.camadas, loteDoImovel: "" } } : cabem;
  }, [cena, janelaMostrada, lotes]);
  const centroNoDesenho = useMemo<Ponto | null>(() => {
    if (!mostrada) return null;
    const [ox, oy] = origemDaJanela(mostrada.janela);
    return [-ox * mostrada.janela.escala, -oy * mostrada.janela.escala];
  }, [mostrada]);

  const candidatos = useMemo(
    () => (lotes === "candidatos" && cena && centroNoDesenho ? candidatosDaCena(cena, centroNoDesenho) : []),
    [lotes, cena, centroNoDesenho],
  );
  const quantos = candidatos.filter((c) => c !== null).length;
  const escolhidoExiste = candidatos[selecionado] != null;
  useEffect(() => {
    aoMudarCandidatos?.({ estado: fundo.estado, quantos, escolhido: escolhidoExiste });
  }, [aoMudarCandidatos, fundo.estado, quantos, escolhidoExiste]);

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
      const caixaNaTela = no.getBoundingClientRect();
      zoom(Math.exp(-evento.deltaY * 0.0015), [evento.clientX - caixaNaTela.left, evento.clientY - caixaNaTela.top]);
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
      const indice = candidatoNoPonto(mostrada, ponto);
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
  // Em mapa baixo (o de caminhos, 220 px) o selo cobriria as pílulas dos raios: o nome do bairro fica no desenho.
  const mostrarSelo = comSelo && tamanho !== null && tamanho.altura >= ALTURA_PARA_O_SELO;
  const rotulo = cena ? `${acessivel}. ${descreverFundoDoMapa(cena)}` : acessivel;
  const origemMostrada = mostrada ? origemDaJanela(mostrada.janela) : null;
  // Do desenho da cena (px da janela em que foi montada) para o mundo do mapa (metros em volta do imóvel).
  const transformacaoDaCena =
    mostrada && origemMostrada ? `translate(${origemMostrada[0].toFixed(3)} ${origemMostrada[1].toFixed(3)}) scale(${(1 / mostrada.janela.escala).toFixed(7)})` : null;
  const calorLigado = camada === "calor" && comCalor;
  const aguaDaCena = cenaNaTela?.camadas.agua ?? "";
  const pontesDaCena = cenaNaTela?.camadas.pontes ?? "";
  const aguaDoMapa = useMemo<AguaDoMapa | null>(
    () => (aguaDaCena && transformacaoDaCena ? { agua: aguaDaCena, pontes: pontesDaCena, transformacao: transformacaoDaCena } : null),
    [aguaDaCena, pontesDaCena, transformacaoDaCena],
  );

  return (
    <View
      ref={raiz}
      accessibilityLabel={rotulo}
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
                {/* Com o calor ligado, a ordem é chão, calor e, por cima, os nomes de rua e de bairro (antes o calor os cobria). */}
                {mostrada && cenaNaTela && transformacaoDaCena ? (
                  <G transform={transformacaoDaCena}>
                    <FundoDoMapa cena={cenaNaTela} partes={calorLigado ? "chao" : "tudo"} />
                  </G>
                ) : null}
                {calorLigado ? <Calor calor={calor} agua={aguaDoMapa} cores={cores} /> : null}
                {mostrada && cenaNaTela && transformacaoDaCena && centroNoDesenho ? (
                  <G transform={transformacaoDaCena}>
                    {calorLigado ? <FundoDoMapa cena={cenaNaTela} partes="rotulos" /> : null}
                    <SobreOFundo cena={mostrada.cena} escala={mostrada.janela.escala} centro={centroNoDesenho} o={opcoes} cores={cores} />
                  </G>
                ) : null}
                <Sobreposto o={opcoes} cores={cores} />
              </G>
            </Svg>
          </View>
          <View pointerEvents="box-none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
            {opcoes.raios.map((raio, i) => {
              const [rx, ry] = aTela([0, -raio]);
              if (ry < 14 || ry > tamanho.altura - 14 || rx < 0 || rx > tamanho.largura) return null;
              // Afastado, as pílulas se empilham sobre o pino e umas sobre as outras: some a que não cabe.
              const anterior = i > 0 ? (opcoes.raios[i - 1] ?? 0) : 0;
              if ((raio - anterior) * vista.escala < 30 || raio * vista.escala < 44) return null;
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
            {mostrarSelo && (cena?.selo ?? cena?.acessibilidade.bairro) ? (
              <View pointerEvents="none" style={{ position: "absolute", top: 8, right: 8 }}>
                <SeloDoBairro nome={(cena?.selo ?? cena?.acessibilidade.bairro) as string} />
              </View>
            ) : null}
            <View
              pointerEvents="box-none"
              style={{ position: "absolute", left: 8, bottom: 8, maxWidth: tamanho.largura - 16, gap: 4, alignItems: "flex-start" }}
            >
              <AvisoDoFundoDoMapa
                estado={fundo.estado}
                tentarDeNovo={fundo.tentarDeNovo}
                oQueContinua={oQueContinua}
                style={{ backgroundColor: comAlfa(cores["cor-superficie"], 0.9), borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}
              />
              {cena ? <CreditoDaBase style={{ alignSelf: "flex-start" }} /> : null}
            </View>
            {children}
          </View>
        </>
      ) : null}
    </View>
  );
}

/** O índice do candidato tocado no ponto (metros do mundo), ou -1. */
function candidatoNoPonto(mostrada: Mostrada | null, ponto: Ponto): number {
  if (!mostrada) return -1;
  const [ox, oy] = origemDaJanela(mostrada.janela);
  const e = mostrada.janela.escala;
  const tocado = loteNoPonto(mostrada.cena, (ponto[0] - ox) * e, (ponto[1] - oy) * e);
  if (!tocado) return -1;
  return candidatosDaCena(mostrada.cena, [-ox * e, -oy * e]).indexOf(tocado);
}
