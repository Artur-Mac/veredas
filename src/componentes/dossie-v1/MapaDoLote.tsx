import { useMemo, useRef, useState } from "react";
import { View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, G, Line, Path, Text as TextoSvg } from "react-native-svg";
import type { Edificio, Obra, ObrasProximas } from "../../dados/contratos";
import { HORARIOS_DO_MAPA } from "../../dados/dossie/solESombra";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, comAlfa, type TokenDeCor } from "../../tema/tokens";
import { GradeArquitetonica } from "../GradeArquitetonica";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import {
  montarCena25DDoLote,
  montarCenaComPontosExtras,
  montarCenaDoLote,
  reguaDe,
  type CategoriaPontoExtra,
  type EntradaPontoExtraMapa,
  type PontoExtraCena,
} from "./mapa";
import {
  ESTADO_INICIAL, afastar, aproximar, arrastar, naTela, recentrar, tocarObra, transformacao, trocarModo, visivelNoQuadro,
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

const ALTURA = 280;
const LARGURA_ANTES_DA_MEDIDA = 320;

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
function BotaoDoMapa({ rotulo, acessivel, onPress, desligado = false }: { rotulo: string; acessivel: string; onPress: () => void; desligado?: boolean }) {
  const { cor } = useTema();
  return (
    <Pressionavel
      onPress={onPress}
      disabled={desligado}
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      accessibilityState={{ disabled: desligado }}
      style={{
        minWidth: 44, height: 44, paddingHorizontal: 10, borderRadius: 10, alignItems: "center", justifyContent: "center",
        backgroundColor: cor("cor-superficie"), borderWidth: 1, borderColor: cor("cor-linha"), opacity: desligado ? 0.45 : 1,
      }}
    >
      <Texto tipo="corpo" style={{ fontSize: rotulo.length > 2 ? 12 : 18, lineHeight: 20, fontWeight: "700" }}>{rotulo}</Texto>
    </Pressionavel>
  );
}

/** O cartão da obra tocada: tipo, mês, distância e o estado da licença no retrato da base. */
function CartaoDaObra({ numero, obra, aoFechar }: { numero: number; obra: ObrasProximas["recentes"][number]; aoFechar: () => void }) {
  const { cor } = useTema();
  const licenca = textoDaLicenca(obra.licenca);
  return (
    <View accessibilityLiveRegion="polite" style={{ padding: 12, gap: 4, borderRadius: 12, borderWidth: 1, borderColor: cor("cor-linha"), backgroundColor: cor("cor-superficie") }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600", flex: 1 }}>{`${numero}. ${categoriaDaObra(obra.categoria)} ${distanciaDaObra(obra.distanciaM)}`}</Texto>
        <Pressionavel onPress={aoFechar} accessibilityRole="button" accessibilityLabel="Fechar o detalhe da obra" style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 16, lineHeight: 20 }}>✕</Texto>
        </Pressionavel>
      </View>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5, lineHeight: 18 }}>{`Pedido em ${mesDaObra(obra.data)} · ${obra.descricao}`}</Texto>
      <Texto tipo="apoio" cor={licenca ? "cor-texto" : "cor-texto-apoio"} style={{ fontSize: 12.5, lineHeight: 18 }}>
        {licenca ?? "Estado da licença não publicado nesta versão do índice."}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
        Retrato da base de licenciamento: não prova que a obra começou, parou ou terminou.
      </Texto>
    </View>
  );
}

/** Cartão de detalhe ao tocar num ponto de interesse ou lugar da rotina no mapa. */
function CartaoDoPontoExtra({ ponto, aoFechar }: { ponto: PontoExtraCena; aoFechar: () => void }) {
  const { cor } = useTema();
  const est = ESTILO_EXTRA[ponto.categoria];
  const minPe = ponto.distanciaM <= 2500 ? Math.max(1, Math.round(ponto.distanciaM / 75)) : null;
  return (
    <View accessibilityLiveRegion="polite" style={{ padding: 12, gap: 4, borderRadius: 12, borderWidth: 1, borderColor: cor("cor-linha"), backgroundColor: cor("cor-superficie") }}>
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
      <Texto tipo="corpo" style={{ fontSize: 13, lineHeight: 18 }}>
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
  const [largura, setLargura] = useState(LARGURA_ANTES_DA_MEDIDA);
  const [estado, setEstado] = useState<EstadoDoMapa>({ ...ESTADO_INICIAL, modo: modoInicial });
  const [filtroExtra, setFiltroExtra] = useState<"todos" | CategoriaPontoExtra>("todos");
  const [extraTocadoId, setExtraTocadoId] = useState<string | null>(null);
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
        ? montarCenaComPontosExtras(predio, obras, vizinhos, largura, ALTURA, extrasFiltrados)
        : null,
    [predio, obras, vizinhos, largura, pontosExtras.length, modo, extrasFiltrados],
  );
  const cenaPlanta = useMemo(
    () => cenaComExtras?.cena ?? montarCenaDoLote(predio, obras, vizinhos, largura, ALTURA),
    [cenaComExtras, predio, obras, vizinhos, largura],
  );
  const cena25d = useMemo(
    () => (modo === "planta" ? null : montarCena25DDoLote(predio, obras, vizinhos, largura, ALTURA, modo, andar)),
    [predio, obras, vizinhos, largura, modo, andar],
  );
  const cena = cena25d ?? cenaPlanta;
  const pontosNoMapa = useMemo(() => cenaComExtras?.pontos ?? [], [cenaComExtras]);
  const foraDoQuadro = cenaComExtras?.foraDoQuadro ?? [];
  const regua = reguaDe(cena.metrosPorPixel / estado.zoom, largura * 0.35);

  const pontoExtraTocado = extraTocadoId ? pontosNoMapa.find((p) => p.id === extraTocadoId) ?? null : null;

  // Arraste só com zoom: sem ele, o gesto vertical continua rolando a gaveta. Os toques do arraste são lidos pelos
  // eventos de responder da própria View (funcionam no celular e na web).
  const ultimoToque = useRef<{ x: number; y: number } | null>(null);
  const arraste = {
    onMoveShouldSetResponder: () => estado.zoom > 1,
    onResponderGrant: (e: GestureResponderEvent) => { ultimoToque.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; },
    onResponderMove: (e: GestureResponderEvent) => {
      const antes = ultimoToque.current;
      const x = e.nativeEvent.pageX, y = e.nativeEvent.pageY;
      ultimoToque.current = { x, y };
      if (antes) setEstado((s) => arrastar(s, x - antes.x, y - antes.y, largura, ALTURA));
    },
    onResponderRelease: () => { ultimoToque.current = null; },
    onResponderTerminationRequest: () => false,
  };

  const obraTocada = estado.obra !== null ? obras[estado.obra - 1] ?? null : null;
  const descricao =
    `Mapa do lote do prédio${cena25d ? ", volume estimado com sombra projetada" : ", planta cadastral"}` +
    (obras.length > 0 ? ` e ${obras.length} ${obras.length === 1 ? "obra licenciada" : "obras licenciadas"} como pontos numerados; toque num ponto para ver a distância e a licença.` : ", sem obras licenciadas nos últimos 24 meses.") +
    ` Zoom ${String(estado.zoom).replace(".", ",")} vezes. Régua de ${regua.rotulo}.`;
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
                borderWidth: 1,
                borderColor: ativa ? comAlfa(azul, 0.55) : cor("cor-linha"),
                backgroundColor: ativa ? cor("cor-azul-cadastral-suave") : cor("cor-papel-claro"),
                justifyContent: "center",
              }}
            >
              <Texto tipo="apoio" cor={ativa ? "cor-azul-cadastral" : "cor-texto-apoio"} style={{ fontSize: 11.5, lineHeight: 15, fontWeight: ativa ? "700" : "500" }}>
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
              minHeight: 34,
              paddingHorizontal: 10,
              borderRadius: RAIO.pilula,
              borderWidth: 1,
              borderColor: filtroExtra === "todos" ? cor("cor-texto") : cor("cor-linha"),
              backgroundColor: filtroExtra === "todos" ? cor("cor-texto") : cor("cor-superficie"),
              justifyContent: "center",
            }}
          >
            <Texto style={{ fontSize: 11.5, fontWeight: "700", color: filtroExtra === "todos" ? cor("cor-superficie") : cor("cor-texto") }}>
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
                  minHeight: 34,
                  paddingHorizontal: 10,
                  borderRadius: RAIO.pilula,
                  borderWidth: 1,
                  borderColor: ativo ? cor(est.fundo) : cor("cor-linha"),
                  backgroundColor: ativo ? comAlfa(cor(est.fundo), 0.14) : cor("cor-superficie"),
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cor(est.fundo) }} />
                <Texto style={{ fontSize: 11.5, fontWeight: ativo ? "700" : "500", color: cor("cor-texto") }}>
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
        }}
        {...arraste}
        style={{
          height: ALTURA,
          borderRadius: 13,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: comAlfa(azul, 0.25),
          backgroundColor: cor("cor-azul-cadastral-suave"),
        }}
      >
        <GradeArquitetonica />
        <View accessible role="img" accessibilityLabel={descricao} pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <Svg width={cena.largura} height={cena.altura} viewBox={`0 0 ${cena.largura} ${cena.altura}`}>
            <G transform={transformacao(estado, cena.largura, cena.altura)}>
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
                        <TextoSvg x={v.etiquetaAltura.x} y={v.etiquetaAltura.y} fill={v.alvo ? azul : cor("cor-texto-apoio")} fontFamily="JetBrainsMono" fontSize={9.5 / estado.zoom} fontWeight={v.alvo ? "700" : "600"} textAnchor="middle">
                          {v.etiquetaAltura.texto}
                        </TextoSvg>
                      ) : null}
                    </G>
                  ))}
                </>
              ) : (
                <>
                  {/* Dois prédios no mesmo lote têm o mesmo contorno: desenha uma vez (e a chave fica única). */}
                  {[...new Set(cenaPlanta.vizinhos)].map((d) => (
                    <Path key={d} d={d} fill={azul} fillOpacity={0.05} stroke={azul} strokeOpacity={0.35} strokeWidth={1 / estado.zoom} strokeDasharray="4 3" strokeLinejoin="round" />
                  ))}
                  {cenaPlanta.lote ? <Path d={cenaPlanta.lote} fill={azul} fillOpacity={0.22} stroke={azul} strokeWidth={2.5 / estado.zoom} strokeLinejoin="round" /> : null}
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
                  <TextoSvg x={0} y={3.5} fill={cor(COR_DA_OBRA[o.categoria].texto)} fontFamily="JetBrainsMono" fontSize={10} fontWeight="700" textAnchor="middle">
                    {String(o.numero)}
                  </TextoSvg>
                </G>
              );
            })}
            {cena25d ? (
              <G transform={`translate(${cena.largura - 56}, ${cena.altura - 22})`}>
                <Line x1={38} y1={10} x2={22} y2={-4} stroke={azul} strokeWidth={1.5} strokeLinecap="round" />
                <Path d="M22 -4 L28 -3 L23 2 Z" fill={azul} />
                <TextoSvg x={4} y={12} fill={azul} fontFamily="PlusJakartaSans" fontSize={9.5} fontWeight="600">
                  Brisa SE
                </TextoSvg>
              </G>
            ) : null}
            <G>
              <Line x1={12} y1={cena.altura - 14} x2={12 + regua.pixels} y2={cena.altura - 14} stroke={textoCor} strokeWidth={2} />
              <Line x1={12} y1={cena.altura - 18} x2={12} y2={cena.altura - 10} stroke={textoCor} strokeWidth={2} />
              <Line x1={12 + regua.pixels} y1={cena.altura - 18} x2={12 + regua.pixels} y2={cena.altura - 10} stroke={textoCor} strokeWidth={2} />
              <TextoSvg x={12} y={cena.altura - 22} fill={textoCor} fontFamily="JetBrainsMono" fontSize={10} fontWeight="600">
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
        <View style={{ position: "absolute", top: 8, right: 8, gap: 6 }}>
          <BotaoDoMapa rotulo="+" acessivel="Aproximar o mapa" onPress={() => setEstado((e) => aproximar(e, largura, ALTURA, cena.pino))} desligado={estado.zoom >= ZOOMS[ZOOMS.length - 1]!} />
          <BotaoDoMapa rotulo="−" acessivel="Afastar o mapa" onPress={() => setEstado((e) => afastar(e, largura, ALTURA, cena.pino))} desligado={estado.zoom <= ZOOMS[0]!} />
          {comZoom ? <BotaoDoMapa rotulo="Recentrar" acessivel="Voltar ao enquadramento inicial" onPress={() => setEstado(recentrar)} /> : null}
        </View>
      </View>
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
                borderWidth: 1,
                borderColor: cor("cor-linha"),
                backgroundColor: cor("cor-papel-claro"),
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cor(ESTILO_EXTRA[f.categoria].fundo) }} />
              <Texto style={{ fontSize: 12, lineHeight: 16, color: cor("cor-texto") }}>
                <Texto style={{ fontWeight: "700" }}>{f.rotulo}</Texto>
                {` · ${formatarDistanciaCurta(f.distanciaM)} ${f.direcao}`}
              </Texto>
            </View>
          ))}
        </View>
      ) : null}
      {estado.zoom > 1 ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>Arraste o mapa para ver em volta.</Texto>
      ) : null}
      {pontoExtraTocado ? (
        <CartaoDoPontoExtra ponto={pontoExtraTocado} aoFechar={() => setExtraTocadoId(null)} />
      ) : null}
      {obraTocada && estado.obra !== null ? (
        <CartaoDaObra numero={estado.obra} obra={obraTocada} aoFechar={() => setEstado((e) => ({ ...e, obra: null }))} />
      ) : null}
    </View>
  );
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
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: cor("cor-linha") }}
    >
      <View style={{ width: 26, height: 26, borderRadius: RAIO.pilula, alignItems: "center", justifyContent: "center", backgroundColor: cor(cores.fundo) }}>
        <Texto tipo="etiqueta" cor={cores.texto} style={{ fontFamily: "JetBrainsMono", fontSize: 11, lineHeight: 14, fontWeight: "700" }}>
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
        <View style={{ width: 14, height: 10, borderRadius: 2, borderWidth: 2, borderColor: cor("cor-azul-cadastral"), backgroundColor: comAlfa(cor("cor-azul-cadastral"), 0.22) }} />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
          Lote do prédio
        </Texto>
      </View>
      {temSombra ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 12, height: 8, borderRadius: 2, backgroundColor: comAlfa(cor("cor-texto"), 0.16) }} />
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
