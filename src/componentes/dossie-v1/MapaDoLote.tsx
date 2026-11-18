import { useMemo, useRef, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as TextoSvg } from "react-native-svg";
import type { Edificio, Obra, ObrasProximas } from "../../dados/contratos";
import { HORARIOS_DO_MAPA } from "../../dados/dossie/solESombra";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, type TokenDeCor } from "../../tema/tokens";
import { GradeArquitetonica } from "../GradeArquitetonica";
import { AvisoDoFundoDoMapa } from "../mapa/AvisoDoFundoDoMapa";
import { CreditoDaBase, FundoDoMapa, SeloDoBairro } from "../mapa/FundoDoMapa";
import { descreverFundoDoMapa, loteNoPonto, rotuloDoLote, type CenaDoFundo, type LoteNoDesenho } from "../mapa/fundoDoMapaCena";
import { useFundoDoMapa } from "../mapa/useFundoDoMapa";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import {
  caixaDoQuadro,
  comVolumesDoChao,
  montarCena25DDoLote,
  montarCenaComPontosExtras,
  montarCenaDoLote,
  paraDesenhoDoQuadro,
  reguaDe,
  VAO_MINIMO_DA_GAVETA_M,
  VAO_MINIMO_VERTICAL_DA_GAVETA_M,
  type CategoriaPontoExtra,
  type EntradaPontoExtraMapa,
  type PontoExtraCena,
} from "./mapa";
import {
  ESTADO_INICIAL, afastar, aproximar, arrastar, deslocamentoDoZoom, naTela, recentrar, tocarObra, transformacao, trocarModo, visivelNoQuadro,
  ZOOMS, type EstadoDoMapa, type ModoDoMapa,
} from "./mapaInterativo";
import { categoriaDaObra, distanciaDaObra, mesDaObra, textoDaLicenca } from "./textos";

export type { ModoDoMapa } from "./mapaInterativo";
export type { EntradaPontoExtraMapa } from "./mapa";

/** Cor de cada categoria de obra: o ponto no mapa e a bolinha da lista usam o mesmo par. O nome está sempre escrito ao lado. */
export const COR_DA_OBRA: Record<Obra["categoria"], { fundo: TokenDeCor; texto: TokenDeCor }> = {
  construcao: { fundo: "cor-acao", texto: "cor-sobre-acao" },
  acrescimo: { fundo: "cor-salvia-escura", texto: "cor-superficie" },
  demolicao: { fundo: "cor-barro", texto: "cor-sobre-barro" },
};

const ESTILO_EXTRA: Record<CategoriaPontoExtra, { sigla: string; nome: string; fundo: TokenDeCor; texto: TokenDeCor }> = {
  praca: { sigla: "P", nome: "Praça / área verde", fundo: "cor-salvia-escura", texto: "cor-superficie" },
  metro: { sigla: "M", nome: "Metrô", fundo: "cor-azul-cadastral", texto: "cor-superficie" },
  ensino: { sigla: "E", nome: "Ensino (CNEFE)", fundo: "cor-barro-texto", texto: "cor-superficie" },
  saude: { sigla: "S", nome: "Saúde", fundo: "cor-barro", texto: "cor-sobre-barro" },
  rotina: { sigla: "★", nome: "Minha rotina", fundo: "cor-acao", texto: "cor-sobre-acao" },
};

function formatarDistanciaCurta(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
  return `${Math.round(m)} m`;
}

/** Área aproximada de projeção (m²) pelo contorno cadastral do lote via Shoelace equiretangular (R39). */
export function calcularAreaPoligonoM2(poligono: Edificio["poligono"]): number | null {
  if (!poligono || poligono.length < 3) return null;
  let latSum = 0;
  for (const [, lat] of poligono) latSum += lat;
  const latMediaRad = ((latSum / poligono.length) * Math.PI) / 180;
  const mPorGrauLat = 111_320;
  const mPorGrauLon = 111_320 * Math.cos(latMediaRad);
  const [lon0, lat0] = poligono[0]!;
  let soma = 0;
  for (let i = 0; i < poligono.length; i += 1) {
    const [lonA, latA] = poligono[i]!;
    const [lonB, latB] = poligono[(i + 1) % poligono.length]!;
    const xA = (lonA - lon0) * mPorGrauLon;
    const yA = (latA - lat0) * mPorGrauLat;
    const xB = (lonB - lon0) * mPorGrauLon;
    const yB = (latB - lat0) * mPorGrauLat;
    soma += xA * yB - xB * yA;
  }
  const area = Math.round(Math.abs(soma) / 2);
  return Number.isFinite(area) && area > 0 ? area : null;
}

const ALTURA = 280;
/** Retângulos ocupados pelos controles por cima do desenho, em px da tela (os rótulos do fundo desviam deles). */
const ALTURA_DOS_BOTOES = 8 + 44 * 3 + 6 * 2 + 4;
const LARGURA_DO_CREDITO = 172;
const MARCA_DO_FUNDO = { "data-fundo-do-mapa": "1" } as object;
const LARGURA_ANTES_DA_MEDIDA = 320;
/**
 * A última largura medida, por tipo de mapa (gaveta ou Por perto): a reabertura começa com ela e já pede o fundo no
 * primeiro render, sem esperar o onLayout (desempenho, 18/11/2026). Se a medida vier diferente, o mapa remonta com ela.
 */
const largurasMedidas = new Map<string, number>();

/** Só para testes: esquece as larguras medidas. */
export function esquecerLargurasDoMapaDoLote(): void {
  largurasMedidas.clear();
}
/**
 * Abaixo desta largura do mapa, o "Recentrar" vira um botão quadrado de 44 px com ícone (rótulo acessível "Voltar ao
 * enquadramento inicial"): a 360 px, a coluna larga cobria o pino e o lote com o zoom máximo (revisão de 18/11/2026).
 */
export const LARGURA_PARA_RECENTRAR_COM_TEXTO = 480;
/** Largura, em px, da coluna de botões (com a margem da borda), para os rótulos do fundo desviarem dela. */
export function larguraDaColunaDeBotoes(larguraDoMapa: number, comRecentrar: boolean): number {
  return 8 + (comRecentrar && larguraDoMapa >= LARGURA_PARA_RECENTRAR_COM_TEXTO ? 100 : 44) + 8;
}
/**
 * Etiqueta de altura do prédio do imóvel: se cair sobre o pino (halo de 11 px), sobe para logo acima dele. Tudo em px de
 * tela; `zoom` converte de volta para o desenho.
 */
export function etiquetaLongeDoPino(
  etiqueta: { x: number; y: number },
  pino: readonly [number, number],
  zoom: number,
): { x: number; y: number } {
  const dx = (etiqueta.x - pino[0]) * zoom;
  const dy = (etiqueta.y - pino[1]) * zoom;
  // A etiqueta tem uns 22 px de largura e 10 de altura acima da linha de base; o halo do pino tem raio 11.
  if (Math.abs(dx) > 11 + 14 || dy < -11 || dy > 11 + 10) return etiqueta;
  return { x: pino[0], y: pino[1] - 14 / zoom };
}

/** 15/11/2026: o seletor volta a aparecer; o volume é estimado (altura do cadastro sobre o contorno do lote). */
const OPCOES_DO_MAPA: readonly { id: ModoDoMapa; rotulo: string }[] = [
  { id: "planta", rotulo: "Planta 2D" },
  ...HORARIOS_DO_MAPA.map((h) => ({ id: h.id as ModoDoMapa, rotulo: `Volume · ${h.rotulo.split(" · ")[0]!.toLowerCase()}` })),
];

type Props = {
  predio: Edificio;
  obras: ObrasProximas["recentes"];
  /** Todos os edifícios do bairro; o mapa desenha só os que ficam perto do quadro, como contexto. */
  vizinhos: readonly Edificio[];
  /** Andar declarado ou conhecido do apartamento, para destacar a altura no volume 2.5D. */
  andar?: number | null;
  /** Modo inicial: planta 2D (padrão) ou volume estimado num horário. */
  modoInicial?: ModoDoMapa;
  /** Pontos de interesse e lugares da rotina para exibir sobre a planta 2D. */
  pontosExtras?: readonly EntradaPontoExtraMapa[];
};

/** Botão quadrado de 44 px sobre o mapa (zoom e recentrar). */
function BotaoDoMapa({ rotulo, acessivel, onPress, desligado = false, icone = false }: { rotulo: string; acessivel: string; onPress: () => void; desligado?: boolean; icone?: boolean }) {
  const { cor } = useTema();
  const corDoSinal = desligado ? cor("cor-texto-apoio") : cor("cor-texto");
  return (
    <Pressionavel
      onPress={onPress}
      disabled={desligado}
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      accessibilityState={{ disabled: desligado }}
      style={{
        minWidth: 44, height: 44, paddingHorizontal: 10, borderRadius: 10, alignItems: "center", justifyContent: "center",
        // Desligado: fundo opaco e sinal em cinza legível (com opacidade, o botão sumia sobre o fundo do mapa). Sem borda,
        // como os outros controles do redesenho visual.
        backgroundColor: desligado ? cor("cor-papel-claro") : cor("cor-superficie"),
      }}
    >
      {icone ? (
        // Mira (enquadramento inicial): um círculo com quatro traços, do tamanho do "+" e do "−".
        <Svg aria-hidden width={20} height={20} viewBox="0 0 20 20">
          <Circle cx={10} cy={10} r={5} fill="none" stroke={corDoSinal} strokeWidth={1.8} />
          <Path d="M10 1 V5 M10 15 V19 M1 10 H5 M15 10 H19" stroke={corDoSinal} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      ) : (
        <Texto tipo="corpo" cor={desligado ? "cor-texto-apoio" : "cor-texto"} style={{ fontSize: rotulo.length > 2 ? 12 : 18, lineHeight: 20, fontWeight: "700" }}>{rotulo}</Texto>
      )}
    </Pressionavel>
  );
}

/** O cartão da obra tocada: tipo, mês, distância e o estado da licença no retrato da base. */
function CartaoDaObra({ numero, obra, aoFechar }: { numero: number; obra: ObrasProximas["recentes"][number]; aoFechar: () => void }) {
  const { cor } = useTema();
  const licenca = textoDaLicenca(obra.licenca);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        padding: 12,
        gap: 4,
        borderRadius: 8,
        borderTopWidth: 1,
        borderTopColor: cor("cor-linha"),
        borderLeftWidth: 3,
        borderLeftColor: cor("cor-acao"),
        backgroundColor: cor("cor-creme"),
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600", flex: 1, fontVariant: ["tabular-nums"] }}>{`${numero}. ${categoriaDaObra(obra.categoria)} ${distanciaDaObra(obra.distanciaM)}`}</Texto>
        <Pressionavel onPress={aoFechar} accessibilityRole="button" accessibilityLabel="Fechar o detalhe da obra" style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 16, lineHeight: 20 }}>✕</Texto>
        </Pressionavel>
      </View>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5, lineHeight: 18, fontVariant: ["tabular-nums"] }}>{`Pedido em ${mesDaObra(obra.data)} · ${obra.descricao}`}</Texto>
      <Texto tipo="apoio" cor={licenca ? "cor-texto" : "cor-texto-apoio"} style={{ fontSize: 12.5, lineHeight: 18 }}>
        {licenca ?? "Estado da licença não publicado nesta versão do índice."}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
        Retrato da base de licenciamento: não prova que a obra começou, parou ou terminou.
      </Texto>
    </View>
  );
}

/** Cartão do lote tocado na planta: vizinho ou do imóvel, com os pavimentos da base de Lotes quando ela os traz. */
function CartaoDoLote({ lote, aoFechar }: { lote: LoteNoDesenho; aoFechar: () => void }) {
  const { cor } = useTema();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        padding: 12,
        gap: 4,
        borderRadius: 8,
        borderTopWidth: 1,
        borderTopColor: cor("cor-linha"),
        borderLeftWidth: 3,
        borderLeftColor: cor("cor-azul-cadastral"),
        backgroundColor: cor("cor-creme"),
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600", flex: 1 }}>{rotuloDoLote(lote)}</Texto>
        <Pressionavel onPress={aoFechar} accessibilityRole="button" accessibilityLabel="Fechar o detalhe do lote" style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 16, lineHeight: 20 }}>✕</Texto>
        </Pressionavel>
      </View>
      {lote.pavimentos !== null && lote.pavimentos > 0 ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          O número de pavimentos é o da base de Lotes da Prefeitura do Recife.
        </Texto>
      ) : null}
    </View>
  );
}

/** Caminho SVG dos anéis de um lote já no desenho ([x0, y0, x1, y1, …]). */
function caminhoDosAneisDoLote(aneis: readonly Float64Array[]): string {
  return aneis
    .map((r) => {
      let d = "";
      for (let i = 0; i + 1 < r.length; i += 2) d += `${i === 0 ? "M" : "L"}${r[i]!.toFixed(1)} ${r[i + 1]!.toFixed(1)}`;
      return d ? `${d}Z` : "";
    })
    .join("");
}

/** Quantos lotes e quantos prédios conhecidos há no quadro (para o leitor de tela, que não alcança o toque livre). */
export function descreverLotes(cena: Pick<CenaDoFundo, "lotes">): string {
  const n = cena.lotes.length;
  if (n === 0) return "";
  const conhecidos = cena.lotes.filter((l) => l.noIndice && !l.doImovel).length;
  return ` ${n} ${n === 1 ? "lote" : "lotes"} no quadro${conhecidos > 0 ? `, ${conhecidos} com prédio que o Vereda conhece` : ""}.`;
}

/** Até quantos px o dedo pode andar e o gesto ainda contar como toque (mais que isso é arraste). */
export const LIMIAR_DO_TOQUE_PX = 8;

/** Cartão de detalhe ao tocar num ponto de interesse ou lugar da rotina no mapa. */
function CartaoDoPontoExtra({ ponto, aoFechar }: { ponto: PontoExtraCena; aoFechar: () => void }) {
  const { cor } = useTema();
  const est = ESTILO_EXTRA[ponto.categoria];
  const minPe = ponto.distanciaM <= 2500 ? Math.max(1, Math.round(ponto.distanciaM / 75)) : null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        padding: 12,
        gap: 4,
        borderRadius: 8,
        borderTopWidth: 1,
        borderTopColor: cor("cor-linha"),
        borderLeftWidth: 3,
        borderLeftColor: cor(est.fundo),
        backgroundColor: cor("cor-creme"),
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: cor(est.fundo), alignItems: "center", justifyContent: "center" }}>
            <Texto style={{ color: cor(est.texto), fontSize: 11, fontWeight: "700" }}>{est.sigla}</Texto>
          </View>
          <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "700", flex: 1 }}>
            {ponto.rotulo}
          </Texto>
        </View>
        <Pressionavel onPress={aoFechar} accessibilityRole="button" accessibilityLabel="Fechar o detalhe do ponto" style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 16, lineHeight: 20 }}>✕</Texto>
        </Pressionavel>
      </View>
      <Texto tipo="corpo" style={{ fontSize: 13, lineHeight: 18, fontVariant: ["tabular-nums"] }}>
        {`${formatarDistanciaCurta(ponto.distanciaM)} em linha reta${minPe ? ` · ~${minPe} min a pé` : ""}`}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
        {`${est.nome}${ponto.detalhe ? ` · ${ponto.detalhe}` : ""}`}
      </Texto>
    </View>
  );
}

/**
 * Mapa do lote: planta cadastral 2D ou volume estimado 2.5D com sombra projetada dos vizinhos (manhã, meio-dia,
 * tarde), com zoom em passos, arraste e toque nas obras e pontos de interesse.
 */
export function MapaDoLote({ predio, obras, vizinhos, andar = null, modoInicial = "planta", pontosExtras = [] }: Props) {
  const { cor } = useTema();
  const azul = cor("cor-azul-cadastral");
  const acao = cor("cor-acao");
  const textoCor = cor("cor-texto");
  const tipoDeMapa = pontosExtras.length > 0 ? "por-perto" : "gaveta";
  const [largura, setLargura] = useState(() => largurasMedidas.get(tipoDeMapa) ?? LARGURA_ANTES_DA_MEDIDA);
  // O fundo só monta depois da primeira medida: com a largura provisória ele montaria e desenharia duas vezes. Na
  // reabertura, a largura lembrada já é uma medida.
  const [medido, setMedido] = useState(() => largurasMedidas.has(tipoDeMapa));
  const [estado, setEstado] = useState<EstadoDoMapa>({ ...ESTADO_INICIAL, modo: modoInicial });
  const [filtroExtra, setFiltroExtra] = useState<"todos" | CategoriaPontoExtra>("todos");
  const [extraTocadoId, setExtraTocadoId] = useState<string | null>(null);
  const [loteTocado, setLoteTocado] = useState<LoteNoDesenho | null>(null);
  const modo = estado.modo;

  const extrasFiltrados = useMemo(() => {
    if (!pontosExtras.length) return [];
    if (filtroExtra === "todos") return pontosExtras;
    return pontosExtras.filter((p) => p.categoria === filtroExtra);
  }, [pontosExtras, filtroExtra]);

  const categoriasExtrasDisponiveis = useMemo(() => {
    const presentes = new Set(pontosExtras.map((p) => p.categoria));
    return (Object.keys(ESTILO_EXTRA) as CategoriaPontoExtra[]).filter((c) => presentes.has(c));
  }, [pontosExtras]);

  const cenaComExtras = useMemo(
    () =>
      pontosExtras.length > 0 && modo === "planta"
        ? montarCenaComPontosExtras(predio, obras, vizinhos, largura, ALTURA, extrasFiltrados, undefined, { limiteDeVizinhos: null })
        : null,
    [predio, obras, vizinhos, largura, pontosExtras.length, modo, extrasFiltrados],
  );
  const cenaPlanta = useMemo(
    // 18/11/2026: a planta abre em ~220 m e desenha todos os vizinhos do quadro (o limite de 60 fica só no 2.5D).
    () => cenaComExtras?.cena ?? montarCenaDoLote(predio, obras, vizinhos, largura, ALTURA, { vaoMinimoM: VAO_MINIMO_DA_GAVETA_M, vaoMinimoVerticalM: VAO_MINIMO_VERTICAL_DA_GAVETA_M, limiteDeVizinhos: null }),
    [cenaComExtras, predio, obras, vizinhos, largura],
  );
  // 18/11/2026: o volume abre na mesma escala da planta (~220 m): trocar de modo não muda o mapa de tamanho.
  const cena25dBase = useMemo(
    () => (modo === "planta" ? null : montarCena25DDoLote(predio, obras, vizinhos, largura, ALTURA, modo, andar, { vaoMinimoM: VAO_MINIMO_DA_GAVETA_M, vaoMinimoVerticalM: VAO_MINIMO_VERTICAL_DA_GAVETA_M })),
    [predio, obras, vizinhos, largura, modo, andar],
  );
  // O quadro que o fundo usa: o da planta, ou o do volume (que desloca o desenho na vertical; o `meio` dele já conta isso).
  const cenaDoQuadro = cena25dBase ?? cenaPlanta;
  const pontosNoMapa = useMemo(() => cenaComExtras?.pontos ?? [], [cenaComExtras]);
  const foraDoQuadro = cenaComExtras?.foraDoQuadro ?? [];

  // Fundo do mapa (mapa-base, 18/11/2026): na planta e, como chão, no volume 2.5D (na projeção do próprio volume).
  const paraDesenho = useMemo(() => paraDesenhoDoQuadro(cenaDoQuadro), [cenaDoQuadro]);
  const caixa = useMemo(() => caixaDoQuadro(cenaDoQuadro), [cenaDoQuadro]);
  // O deslocamento do zoom com foco no pino, não o do arraste: a cena do fundo não é remontada a cada movimento.
  const deslocamento = useMemo(
    () => deslocamentoDoZoom(estado.zoom, cenaDoQuadro.largura, cenaDoQuadro.altura, cenaDoQuadro.pino),
    [estado.zoom, cenaDoQuadro],
  );
  const regua = reguaDe(cenaDoQuadro.metrosPorPixel / estado.zoom, largura * 0.35);
  // A base clara da régua cobre o rótulo inteiro ("50 m"), não só o traço: antes o "m" saía da base e lia em outra cor.
  const larguraDaRegua = Math.max(regua.pixels, regua.rotulo.length * 6.4);
  const vistaSemArraste = { ...estado, dx: deslocamento[0], dy: deslocamento[1] };
  const naVista = (x: number, y: number) => naTela(vistaSemArraste, x, y, cenaDoQuadro.largura, cenaDoQuadro.altura);
  const seloEstimado = 20 + (predio.bairro.length + 2) * 8.5;
  const obstaculos: [number, number, number, number][] = [
    [0, 0, 8 + seloEstimado, 8 + 46],
    // Os botões de zoom e, com zoom, o "Recentrar" (mais largo).
    [largura - larguraDaColunaDeBotoes(largura, estado.zoom > 1), 0, largura, ALTURA_DOS_BOTOES],
    [0, ALTURA - 40, 12 + Math.max(larguraDaRegua, 40) + 12, ALTURA],
    [largura - LARGURA_DO_CREDITO, ALTURA - 22, largura, ALTURA],
    // As obras numeradas ficam por cima do desenho: os nomes de rua desviam delas (na vista sem arraste).
    ...cenaDoQuadro.obras.map((o): [number, number, number, number] => {
      const [x, y] = naVista(o.x, o.y);
      return [x - 12, y - 12, x + 12, y + 12];
    }),
    // O pino e os pontos de interesse (P, M, E, S, estrela) também: os nomes de rua e de bairro desviam deles.
    ...obstaculosDosPontos(cenaDoQuadro.pino, pontosNoMapa, naVista),
  ];
  const fundo = useFundoDoMapa({
    bairro: predio.bairro,
    imovel: { centro: predio.centro, codigoDoLogradouro: codigoDoLogradouro(predio.id) },
    quadro: { largura: cenaDoQuadro.largura, altura: cenaDoQuadro.altura, paraDesenho, zoom: estado.zoom, deslocamento, obstaculos },
    caixa,
    ativo: medido,
  });
  const cenaDoFundo = fundo.estado === "pronta" && fundo.cena?.temDado ? fundo.cena : null;
  const loteNoFundo = Boolean(cenaDoFundo?.camadas.loteDoImovel);
  // No volume, a base do volume do imóvel já marca o lote: o fundo vai sem a camada do lote do imóvel (não pinta duas vezes).
  const fundoDesenhado = useMemo(
    () => (cenaDoFundo && cena25dBase ? { ...cenaDoFundo, camadas: { ...cenaDoFundo.camadas, loteDoImovel: "" } } : cenaDoFundo),
    [cenaDoFundo, cena25dBase],
  );
  // Vizinhos dos bairros que tocam o quadro: os lotes do fundo que são prédio do índice e ainda não têm volume.
  const cena25d = useMemo(
    () => (cena25dBase && cenaDoFundo ? comVolumesDoChao(cena25dBase, cenaDoFundo.lotes, predio.centro) : cena25dBase),
    [cena25dBase, cenaDoFundo, predio.centro],
  );
  const cena = cena25d ?? cenaPlanta;
  const loteTocadoVisivel = modo === "planta" && cenaDoFundo && loteTocado && cenaDoFundo.lotes.includes(loteTocado) ? loteTocado : null;
  const vizinhosJuntos = useMemo(() => [...new Set(cenaPlanta.vizinhos)].join(" "), [cenaPlanta]);

  const pontoExtraTocado = extraTocadoId ? pontosNoMapa.find((p) => p.id === extraTocadoId) ?? null : null;
  const areaPoligonoM2 = useMemo(() => calcularAreaPoligonoM2(predio.poligono), [predio.poligono]);

  // Arraste só com zoom: sem ele, o gesto vertical continua rolando a gaveta. Os toques do arraste são lidos pelos
  // eventos de responder da própria View (funcionam no celular e na web).
  // Toque nos lotes (planta com fundo): o gesto começa como toque e só vira arraste depois de LIMIAR_DO_TOQUE_PX.
  const ultimoToque = useRef<{ x: number; y: number } | null>(null);
  const inicioDoToque = useRef<{ pageX: number; pageY: number; x: number; y: number; andou: number } | null>(null);
  const tocaLotes = modo === "planta" && cenaDoFundo !== null && cenaDoFundo.lotes.length > 0;
  const tocarNoMapa = (sx: number, sy: number) => {
    if (!cenaDoFundo) return;
    const [x, y] = daTelaParaODesenho(estado, sx, sy, largura, ALTURA);
    const lote = loteNoPonto(cenaDoFundo, x, y);
    setLoteTocado((atual) => (lote === null || lote === atual ? null : lote));
    if (lote) {
      setExtraTocadoId(null);
      setEstado((e) => ({ ...e, obra: null }));
    }
  };
  const arraste = {
    onStartShouldSetResponder: () => tocaLotes,
    onMoveShouldSetResponder: () => estado.zoom > 1,
    onResponderGrant: (e: GestureResponderEvent) => {
      const { pageX, pageY, locationX, locationY } = e.nativeEvent;
      ultimoToque.current = { x: pageX, y: pageY };
      inicioDoToque.current = { pageX, pageY, x: locationX, y: locationY, andou: 0 };
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const antes = ultimoToque.current;
      const x = e.nativeEvent.pageX, y = e.nativeEvent.pageY;
      ultimoToque.current = { x, y };
      const inicio = inicioDoToque.current;
      if (inicio) inicio.andou = Math.max(inicio.andou, Math.hypot(x - inicio.pageX, y - inicio.pageY));
      if (antes && estado.zoom > 1) setEstado((s) => arrastar(s, x - antes.x, y - antes.y, largura, ALTURA));
    },
    onResponderRelease: () => {
      const inicio = inicioDoToque.current;
      ultimoToque.current = null;
      inicioDoToque.current = null;
      if (tocaLotes && inicio && ehToque(inicio.andou)) tocarNoMapa(inicio.x, inicio.y);
    },
    // Sem zoom, a rolagem da gaveta pode tomar o gesto; com zoom, o arraste fica com o mapa.
    onResponderTerminationRequest: () => estado.zoom <= 1,
    onResponderTerminate: () => { ultimoToque.current = null; inicioDoToque.current = null; },
  };

  const obraTocada = estado.obra !== null ? obras[estado.obra - 1] ?? null : null;
  const descricao =
    `Mapa do lote do prédio${cena25d ? ", volume estimado com sombra projetada" : ", planta cadastral"}` +
    (obras.length > 0 ? ` e ${obras.length} ${obras.length === 1 ? "obra licenciada" : "obras licenciadas"} como pontos numerados; toque num ponto para ver a distância e a licença.` : ", sem obras licenciadas nos últimos 24 meses.") +
    ` Zoom ${String(estado.zoom).replace(".", ",")} vezes. Régua de ${regua.rotulo}.` +
    (cenaDoFundo ? ` ${descreverFundoDoMapa(cenaDoFundo)}${descreverLotes(cenaDoFundo)}` : "");
  const tela = (x: number, y: number) => naTela(estado, x, y, largura, ALTURA);
  const comZoom = estado.zoom > 1 || estado.dx !== 0 || estado.dy !== 0;

  return (
    <View style={{ gap: ESPACO[2] }}>
      <View role="radiogroup" accessibilityLabel="Modo do mapa" style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {OPCOES_DO_MAPA.map((op) => {
          const ativa = modo === op.id;
          return (
            <Pressionavel
              key={op.id}
              onPress={() => setEstado((e) => trocarModo(e, op.id))}
              accessibilityRole="radio"
              accessibilityLabel={`Ver mapa: ${op.rotulo}`}
              accessibilityState={{ selected: ativa, checked: ativa }}
              aria-checked={ativa}
              style={{
                minHeight: 44,
                paddingHorizontal: 10,
                borderRadius: RAIO.pilula,
                backgroundColor: ativa ? cor("cor-texto") : cor("cor-papel-claro"),
                justifyContent: "center",
              }}
            >
              <Texto tipo="apoio" cor={ativa ? "cor-papel-claro" : "cor-texto"} style={{ fontSize: 11.5, lineHeight: 15, fontWeight: ativa ? "700" : "500" }}>
                {op.rotulo}
              </Texto>
            </Pressionavel>
          );
        })}
      </View>
      {pontosExtras.length > 0 && modo === "planta" && categoriasExtrasDisponiveis.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityLabel="Filtrar pontos no mapa">
          <Pressionavel
            onPress={() => { setFiltroExtra("todos"); setExtraTocadoId(null); }}
            accessibilityRole="button"
            accessibilityState={{ selected: filtroExtra === "todos" }}
            style={{
              minHeight: 44,
              paddingHorizontal: 10,
              borderRadius: RAIO.pilula,
              backgroundColor: filtroExtra === "todos" ? cor("cor-texto") : cor("cor-papel-claro"),
              justifyContent: "center",
            }}
          >
            <Texto style={{ fontSize: 11.5, fontWeight: "700", fontVariant: ["tabular-nums"], color: filtroExtra === "todos" ? cor("cor-papel-claro") : cor("cor-texto") }}>
              Todos ({pontosExtras.length})
            </Texto>
          </Pressionavel>
          {categoriasExtrasDisponiveis.map((cat) => {
            const ativo = filtroExtra === cat;
            const est = ESTILO_EXTRA[cat];
            const qtd = pontosExtras.filter((p) => p.categoria === cat).length;
            return (
              <Pressionavel
                key={cat}
                onPress={() => { setFiltroExtra(cat); setExtraTocadoId(null); }}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 10,
                  borderRadius: RAIO.pilula,
                  backgroundColor: ativo ? cor("cor-sutil") : cor("cor-papel-claro"),
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cor(est.fundo) }} />
                <Texto style={{ fontSize: 11.5, fontWeight: ativo ? "700" : "500", fontVariant: ["tabular-nums"], color: cor("cor-texto") }}>
                  {`${cat === "praca" ? "Praças" : cat === "metro" ? "Metrô" : cat === "ensino" ? "Ensino" : cat === "saude" ? "Saúde" : "Minha rotina"} (${qtd})`}
                </Texto>
              </Pressionavel>
            );
          })}
        </View>
      ) : null}
      {cena25d ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>
          Volume estimado: a altura do cadastro desenhada sobre o contorno do lote, não a forma real da torre. A sombra é do dia de equinócio.
        </Texto>
      ) : null}

      <View
        onLayout={(e) => {
          const medida = Math.round(e.nativeEvent.layout.width);
          if (medida > 0 && medida !== largura) setLargura(medida);
          if (medida > 0) {
            setMedido(true);
            largurasMedidas.set(tipoDeMapa, medida);
          }
        }}
        {...arraste}
        style={{
          height: ALTURA,
          borderRadius: 13,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: cor("cor-linha-forte"),
          backgroundColor: cor("cor-azul-cadastral-suave"),
        }}
      >
        {cenaDoFundo ? null : <GradeArquitetonica />}
        <View accessible role="img" accessibilityLabel={descricao} pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* A descrição (com a do fundo) fica só neste contêiner; o desenho fica fora da acessibilidade. */}
          <Svg aria-hidden width={cena.largura} height={cena.altura} viewBox={`0 0 ${cena.largura} ${cena.altura}`}>
            <G transform={transformacao(estado, cena.largura, cena.altura)}>
              {/* O fundo (ruas, quadras, lotes, água) é o primeiro filho do grupo de zoom: tudo o mais fica por cima. No
                  volume, só o chão vai aqui; os nomes de rua e de bairro vão depois dos volumes, para não sumirem atrás deles. */}
              {cenaDoFundo ? (
                // A marca serve ao roteiro de capturas (conta os elementos do fundo); no nativo é ignorada.
                <G {...MARCA_DO_FUNDO}>
                  <FundoDoMapa cena={fundoDesenhado ?? cenaDoFundo} partes={cena25d ? "chao" : "tudo"} />
                </G>
              ) : null}
              {cena25d ? (
                <>
                  {/* 1. Sombras projetadas no chão por todos os edifícios */}
                  {cena25d.volumes.map((v) =>
                    v.sombra.map((d, idx) => (
                      <Path key={`s-${v.id}-${idx}`} d={d} fill={textoCor} fillOpacity={v.alvo ? 0.14 : 0.09} />
                    )),
                  )}
                  {/* 2. Volumes ordenados de Norte para Sul (paredes, cobertura e andar do imóvel) */}
                  {cena25d.volumes.map((v) => (
                    <G key={`v-${v.id}`}>
                      <Path d={v.base} fill={azul} fillOpacity={v.alvo ? 0.14 : 0.04} stroke={azul} strokeOpacity={v.alvo ? 0.5 : 0.28} strokeWidth={1 / estado.zoom} />
                      {v.paredes.map((p, idx) => (
                        <Path key={`p-${v.id}-${idx}`} d={p} fill={v.alvo ? azul : textoCor} fillOpacity={v.alvo ? 0.18 : 0.06} stroke={azul} strokeOpacity={v.alvo ? 0.55 : 0.25} strokeWidth={0.8 / estado.zoom} strokeLinejoin="round" />
                      ))}
                      <Path
                        d={v.topo}
                        fill={v.alvo ? azul : cor("cor-superficie")}
                        fillOpacity={v.alvo ? 0.28 : 0.72}
                        stroke={azul}
                        strokeOpacity={v.alvo ? 0.95 : 0.48}
                        strokeWidth={(v.alvo ? 2.2 : 1) / estado.zoom}
                        strokeDasharray={!v.alvo && v.alturaM === null ? "4 3" : undefined}
                        strokeLinejoin="round"
                      />
                      {v.faixaDoAndar ? <Path d={v.faixaDoAndar} fill="none" stroke={acao} strokeWidth={2.4 / estado.zoom} strokeLinejoin="round" /> : null}
                      {v.etiquetaAltura ? (
                        <TextoSvg {...(v.alvo ? etiquetaLongeDoPino(v.etiquetaAltura, cena25d.pino, estado.zoom) : { x: v.etiquetaAltura.x, y: v.etiquetaAltura.y })} fill={v.alvo ? azul : cor("cor-texto-apoio")} fontFamily="PlusJakartaSans" fontSize={9.5 / estado.zoom} fontWeight={v.alvo ? "700" : "600"} textAnchor="middle">
                          {v.etiquetaAltura.texto}
                        </TextoSvg>
                      ) : null}
                    </G>
                  ))}
                  {/* 3. Nomes de rua e de bairro do fundo, por cima dos volumes. */}
                  {cenaDoFundo ? <FundoDoMapa cena={fundoDesenhado ?? cenaDoFundo} partes="rotulos" /> : null}
                </>
              ) : (
                <>
                  {/* Sem o fundo, os prédios do índice no quadro numa forma só (dois no mesmo lote: o contorno entra uma vez).
                      Com o fundo, os lotes vizinhos (inclusive dos bairros ao lado) já vêm dele. */}
                  {!cenaDoFundo && vizinhosJuntos ? (
                    <Path d={vizinhosJuntos} fill={azul} fillOpacity={0.05} stroke={azul} strokeOpacity={0.35} strokeWidth={1 / estado.zoom} strokeDasharray="4 3" strokeLinejoin="round" />
                  ) : null}
                  {/* O lote do imóvel vem do fundo quando a base o acha no centro do prédio; senão, o polígono do índice. */}
                  {cenaPlanta.lote && !loteNoFundo ? <Path d={cenaPlanta.lote} fill={azul} fillOpacity={0.22} stroke={azul} strokeWidth={2.5 / estado.zoom} strokeLinejoin="round" /> : null}
                  {loteTocadoVisivel ? (
                    <Path d={caminhoDosAneisDoLote(loteTocadoVisivel.aneis)} fill="none" stroke={textoCor} strokeWidth={2 / estado.zoom} strokeLinejoin="round" />
                  ) : null}
                </>
              )}
            </G>

            {/* Linhas de rumo entre o prédio e lugares da rotina dentro do quadro */}
            {pontosNoMapa
              .filter((p) => p.categoria === "rotina")
              .map((p) => {
                const [px, py] = tela(cena.pino[0], cena.pino[1]);
                const [dx, dy] = tela(p.x, p.y);
                return (
                  <Line
                    key={`linha-${p.id}`}
                    x1={px}
                    y1={py}
                    x2={dx}
                    y2={dy}
                    stroke={acao}
                    strokeWidth={1.6}
                    strokeDasharray="4 3"
                    strokeOpacity={0.75}
                  />
                );
              })}

            {/* Pino e obras ficam do mesmo tamanho em qualquer zoom: só a posição acompanha o desenho. */}
            <G transform={`translate(${tela(cena.pino[0], cena.pino[1]).join(", ")})`}>
              <Circle cx={0} cy={0} r={11} fill={acao} fillOpacity={0.25} />
              <Circle cx={0} cy={0} r={5.5} fill={acao} stroke={cor("cor-superficie")} strokeWidth={2} />
            </G>
            {pontosNoMapa.map((p) => {
              const [x, y] = tela(p.x, p.y);
              const est = ESTILO_EXTRA[p.categoria];
              const tocado = extraTocadoId === p.id;
              const raio = p.categoria === "rotina" ? 11 : 9.5;
              return (
                <G key={p.id} transform={`translate(${x}, ${y})`}>
                  {tocado ? <Circle cx={0} cy={0} r={15} fill="none" stroke={textoCor} strokeWidth={2} /> : null}
                  <Circle cx={0} cy={0} r={raio} fill={cor(est.fundo)} stroke={cor("cor-superficie")} strokeWidth={2} />
                  <TextoSvg x={0} y={3.5} fill={cor(est.texto)} fontFamily="PlusJakartaSans" fontSize={p.categoria === "rotina" ? 10 : 9.5} fontWeight="700" textAnchor="middle">
                    {est.sigla}
                  </TextoSvg>
                </G>
              );
            })}
            {cena.obras.map((o) => {
              const [x, y] = tela(o.x, o.y);
              const tocada = estado.obra === o.numero;
              return (
                <G key={o.numero} transform={`translate(${x}, ${y})`}>
                  {tocada ? <Circle cx={0} cy={0} r={15} fill="none" stroke={textoCor} strokeWidth={2} /> : null}
                  <Circle cx={0} cy={0} r={10} fill={cor(COR_DA_OBRA[o.categoria].fundo)} stroke={cor("cor-superficie")} strokeWidth={2} />
                  <TextoSvg x={0} y={3.5} fill={cor(COR_DA_OBRA[o.categoria].texto)} fontFamily="PlusJakartaSans" fontSize={10} fontWeight="700" textAnchor="middle">
                    {String(o.numero)}
                  </TextoSvg>
                </G>
              );
            })}
            {cena25d ? (
              // Com o fundo, a seta sobe acima do crédito da base (que ocupa o canto de baixo).
              <G transform={`translate(${cena.largura - 56}, ${cena.altura - (cenaDoFundo ? 44 : 22)})`}>
                <Line x1={38} y1={10} x2={22} y2={-4} stroke={azul} strokeWidth={1.5} strokeLinecap="round" />
                <Path d="M22 -4 L28 -3 L23 2 Z" fill={azul} />
                <TextoSvg x={4} y={12} fill={azul} fontFamily="PlusJakartaSans" fontSize={9.5} fontWeight="600">
                  Brisa SE
                </TextoSvg>
              </G>
            ) : null}
            <G>
              {cenaDoFundo ? (
                <Rect x={6} y={cena.altura - 34} width={larguraDaRegua + 12} height={28} rx={5} fill={cor("cor-superficie")} fillOpacity={0.9} />
              ) : null}
              <Line x1={12} y1={cena.altura - 14} x2={12 + regua.pixels} y2={cena.altura - 14} stroke={textoCor} strokeWidth={2} />
              <Line x1={12} y1={cena.altura - 18} x2={12} y2={cena.altura - 10} stroke={textoCor} strokeWidth={2} />
              <Line x1={12 + regua.pixels} y1={cena.altura - 18} x2={12 + regua.pixels} y2={cena.altura - 10} stroke={textoCor} strokeWidth={2} />
              <TextoSvg x={12} y={cena.altura - 22} fill={textoCor} fontFamily="PlusJakartaSans" fontSize={10} fontWeight="600">
                {regua.rotulo}
              </TextoSvg>
            </G>
          </Svg>
        </View>
        {/* Alvos de toque de 44 px sobre cada ponto extra visível. */}
        {pontosNoMapa.map((pt) => {
          const p = tela(pt.x, pt.y);
          if (!visivelNoQuadro(p, largura, ALTURA)) return null;
          return (
            <Pressionavel
              key={`alvo-extra-${pt.id}`}
              onPress={() => {
                setEstado((e) => ({ ...e, obra: null }));
                setLoteTocado(null);
                setExtraTocadoId((atual) => (atual === pt.id ? null : pt.id));
              }}
              accessibilityRole="button"
              accessibilityLabel={`${pt.rotulo} a ${formatarDistanciaCurta(pt.distanciaM)}`}
              accessibilityState={{ selected: extraTocadoId === pt.id }}
              style={{ position: "absolute", left: p[0] - 22, top: p[1] - 22, width: 44, height: 44, borderRadius: 22 }}
            >
              <View pointerEvents="none" />
            </Pressionavel>
          );
        })}
        {/* Alvos de toque de 44 px sobre cada obra visível. */}
        {cena.obras.map((o) => {
          const p = tela(o.x, o.y);
          if (!visivelNoQuadro(p, largura, ALTURA)) return null;
          const obra = obras[o.numero - 1];
          return (
            <Pressionavel
              key={`alvo-${o.numero}`}
              onPress={() => {
                setExtraTocadoId(null);
                setLoteTocado(null);
                setEstado((e) => tocarObra(e, o.numero));
              }}
              accessibilityRole="button"
              accessibilityLabel={`Obra ${o.numero}: ${categoriaDaObra(o.categoria)}${obra ? ` ${distanciaDaObra(obra.distanciaM)}` : ""}. Ver a licença.`}
              accessibilityState={{ selected: estado.obra === o.numero }}
              style={{ position: "absolute", left: p[0] - 22, top: p[1] - 22, width: 44, height: 44, borderRadius: 22 }}
            >
              <View pointerEvents="none" />
            </Pressionavel>
          );
        })}
        {cenaDoFundo?.selo ? <SeloDoBairro nome={cenaDoFundo.selo} style={{ position: "absolute", top: 8, left: 8 }} /> : null}
        {cenaDoFundo ? <CreditoDaBase style={{ position: "absolute", right: 4, bottom: 4 }} /> : null}
        <View style={{ position: "absolute", top: 8, right: 8, gap: 6, alignItems: "flex-end" }}>
          <BotaoDoMapa rotulo="+" acessivel="Aproximar o mapa" onPress={() => setEstado((e) => aproximar(e, largura, ALTURA, cena.pino))} desligado={estado.zoom >= ZOOMS[ZOOMS.length - 1]!} />
          <BotaoDoMapa rotulo="−" acessivel="Afastar o mapa" onPress={() => setEstado((e) => afastar(e, largura, ALTURA, cena.pino))} desligado={estado.zoom <= ZOOMS[0]!} />
          {comZoom ? (
            <BotaoDoMapa
              rotulo="Recentrar"
              icone={largura < LARGURA_PARA_RECENTRAR_COM_TEXTO}
              acessivel="Voltar ao enquadramento inicial"
              onPress={() => setEstado(recentrar)}
            />
          ) : null}
        </View>
      </View>
      <AvisoDoFundoDoMapa estado={fundo.estado} tentarDeNovo={fundo.tentarDeNovo} />
      {foraDoQuadro.length > 0 && modo === "planta" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {foraDoQuadro.map((f) => (
            <View
              key={`fora-${f.id}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: RAIO.pilula,
                backgroundColor: cor("cor-papel-claro"),
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cor(ESTILO_EXTRA[f.categoria].fundo) }} />
              <Texto style={{ fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums"], color: cor("cor-texto") }}>
                <Texto style={{ fontWeight: "700" }}>{f.rotulo}</Texto>
                {` · ${formatarDistanciaCurta(f.distanciaM)} ${f.direcao}`}
              </Texto>
            </View>
          ))}
        </View>
      ) : null}
      {areaPoligonoM2 !== null && predio.poligono ? (
        <Texto
          testID="mapa-geometria-lote"
          tipo="apoio"
          cor="cor-texto-apoio"
          style={{ fontSize: 11.5, lineHeight: 16, fontVariant: ["tabular-nums"] }}
        >
          {`Área do lote no cadastro: ~${areaPoligonoM2.toLocaleString("pt-BR")} m²`}
        </Texto>
      ) : null}
      {estado.zoom > 1 ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>Arraste o mapa para ver em volta.</Texto>
      ) : null}
      {loteTocadoVisivel ? <CartaoDoLote lote={loteTocadoVisivel} aoFechar={() => setLoteTocado(null)} /> : null}
      {pontoExtraTocado ? (
        <CartaoDoPontoExtra ponto={pontoExtraTocado} aoFechar={() => setExtraTocadoId(null)} />
      ) : null}
      {obraTocada && estado.obra !== null ? (
        <CartaoDaObra numero={estado.obra} obra={obraTocada} aoFechar={() => setEstado((e) => ({ ...e, obra: null }))} />
      ) : null}
    </View>
  );
}

/** Retângulos [x0, y0, x1, y1] na tela do pino e dos pontos de interesse: obstáculos para os rótulos do fundo. */
export function obstaculosDosPontos(
  pino: readonly [number, number],
  pontos: readonly { x: number; y: number; categoria: CategoriaPontoExtra }[],
  naVista: (x: number, y: number) => [number, number],
): [number, number, number, number][] {
  const [px, py] = naVista(pino[0], pino[1]);
  return [
    [px - 11, py - 11, px + 11, py + 11],
    ...pontos.map((p): [number, number, number, number] => {
      const [x, y] = naVista(p.x, p.y);
      const r = p.categoria === "rotina" ? 12 : 11;
      return [x - r, y - r, x + r, y + r];
    }),
  ];
}

/** Um gesto que andou até LIMIAR_DO_TOQUE_PX é toque; mais que isso é arraste. */
export const ehToque = (andouPx: number): boolean => andouPx <= LIMIAR_DO_TOQUE_PX;

/** O inverso de `naTela`: da posição na tela para o desenho na escala 1. */
export function daTelaParaODesenho(e: Pick<EstadoDoMapa, "zoom" | "dx" | "dy">, sx: number, sy: number, largura: number, altura: number): [number, number] {
  const cx = largura / 2, cy = altura / 2;
  return [cx + (sx - cx - e.dx) / e.zoom, cy + (sy - cy - e.dy) / e.zoom];
}

/** Código do logradouro: o prefixo do id do prédio no índice ("8001-216" → 8001), ou null. */
function codigoDoLogradouro(id: string): number | null {
  const n = Number(id.split("-")[0]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Linha da lista de obras: bolinha numerada com a cor da categoria, tipo da obra e "mês · distância · situação". */
export function LinhaDeObraNumerada({
  numero, categoria, titulo, detalhe, rotulo, licenca = null,
}: {
  numero: number;
  categoria: Obra["categoria"];
  titulo: string;
  detalhe: string;
  rotulo: string;
  /** 15/11/2026: estado da licença no retrato da base, numa terceira linha. */
  licenca?: string | null;
}) {
  const { cor } = useTema();
  const cores = COR_DA_OBRA[categoria];
  return (
    <View
      accessible
      accessibilityLabel={rotulo}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: cor("cor-linha") }}
    >
      <View style={{ width: 26, height: 26, borderRadius: RAIO.pilula, alignItems: "center", justifyContent: "center", backgroundColor: cor(cores.fundo) }}>
        <Texto tipo="numero" cor={cores.texto} style={{ fontVariant: ["tabular-nums"], fontSize: 11, lineHeight: 14, fontWeight: "700" }}>
          {String(numero)}
        </Texto>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
          {titulo}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17, marginTop: 2 }}>
          {detalhe}
        </Texto>
        {licenca ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
            {licenca}
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

/** Legenda do mapa: o contorno do lote, a sombra projetada, o andar destacado e só as categorias de obra que aparecem. */
export function LegendaDoMapa({ categorias, temAndar = false, temSombra = false }: { categorias: Obra["categoria"][]; temAndar?: boolean; temSombra?: boolean }) {
  const { cor } = useTema();
  const unicas = [...new Set(categorias)];
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 14, height: 10, borderRadius: 2, borderWidth: 2, borderColor: cor("cor-azul-cadastral"), backgroundColor: cor("cor-azul-cadastral-suave") }} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          Lote do prédio
        </Texto>
      </View>
      {/* 18/11/2026: o azul claro do mapa (com ou sem o fundo) são os prédios do índice do Vereda. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 14, height: 10, borderRadius: 2, borderWidth: 1, borderColor: cor("cor-azul-cadastral"), backgroundColor: cor("cor-azul-cadastral-suave") }} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          Prédios que o Vereda conhece
        </Texto>
      </View>
      {temSombra ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 12, height: 8, borderRadius: 2, backgroundColor: cor("cor-sutil") }} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          Sombra estimada
        </Texto>
      </View> : null}
      {temAndar ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 14, height: 3, borderRadius: 1, backgroundColor: cor("cor-acao") }} />
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
            Cota do andar
          </Texto>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cor("cor-acao"), borderWidth: 2, borderColor: cor("cor-superficie") }} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          Centro do prédio
        </Texto>
      </View>
      {unicas.map((c) => (
        <View key={c} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cor(COR_DA_OBRA[c].fundo) }} />
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
            {categoriaDaObra(c)}
          </Texto>
        </View>
      ))}
    </View>
  );
}
