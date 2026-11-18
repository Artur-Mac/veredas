// "Por perto" (15/11/2026): equipamentos públicos do cadastro da Prefeitura em volta do prédio, mapa interativo do
// entorno com camadas (praças, metrô, ensino, saúde) e lugares personalizados da rotina / pontos de interesse.
import { useMemo, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { garantirCamadas } from "../../dados/camadas";
import type { Edificio, ObrasProximas } from "../../dados/contratos";
import { distanciaMetros } from "../../dados/geo";
import { BAIRROS_DO_RECIFE, eCoberto, type SlugCoberto } from "../../dados/recife/bairros";
import { normalizar } from "../../dados/recife/buscar";
import { pontosDoEntornoNoMapa } from "../../dados/recife/camadasAmbientais";
import { AVISO_DOS_EQUIPAMENTOS, fatosDeEquipamentos, fonteDosEquipamentos, semaforosPerto, type NecessidadeDeAcesso } from "../../dados/recife/equipamentos";
import { arquivoDoIndice, edificiosDoBairro } from "../../dados/recife/indice";
import { bairrosDaBusca, buscarNoCadastro } from "../../dados/recife/localizar";
import { centroideDoBairro } from "../../dados/recife/referenciasPublicas";
import { baseDeServicos, servicosProximos } from "../../dados/recife/servicos";
import { usePerfilDomicilio, type LocalDeRotina } from "../../estado/PerfilDomicilio";
import { obterPosicaoDaVisita } from "../../plataforma/posicaoDaVisita";
import { useTema } from "../../tema/Tema";
import { comAlfa, ESPACO, RAIO } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Corpo, LinkComSeta, Nota, Sobretitulo, Titulo2 } from "./base";
import { MapaDoLote, type EntradaPontoExtraMapa } from "./MapaDoLote";

const VISIVEIS = 4;
const PAPEIS_RAPIDOS = ["Trabalho", "Academia", "Escola", "Família", "Mercado"] as const;

type OpcaoDeLugar = {
  chave: string;
  titulo: string;
  subtitulo: string;
  bairroSlug: string | null;
  coordenada: [number, number];
  distanciaM: number | null;
};

type Props = {
  bairro: string | null;
  predioId: string | null;
  acesso?: readonly NecessidadeDeAcesso[];
  centro?: [number, number] | null;
  edificio?: Edificio | null;
  obras?: ObrasProximas["recentes"];
  vizinhos?: readonly Edificio[];
};

function formatarDist(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
  return `${Math.round(m)} m`;
}

function predioSintetico(centro: [number, number], bairro: string | null): Edificio {
  return {
    id: "ref-0",
    bairro: bairro && eCoberto(bairro) ? bairro : "boa-viagem",
    logradouro: "",
    numero: "",
    dsqfl: null,
    nome: "Imóvel em análise",
    centro,
    poligono: null,
    unidades: 2,
    tipologias: [{ area: 60, unidades: 2, iptuAnualMediano: null }],
    anoConstrucao: null,
    pavimentos: null,
    ate4Pavimentos: null,
    padrao: null,
    iptuAnual: null,
    itbi: null,
    obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
  };
}

export function PorPerto({ bairro, predioId, acesso = [], centro = null, edificio = null, obras = [], vizinhos = [] }: Props) {
  const { cor } = useTema();
  const { perfil, salvarPerfil } = usePerfilDomicilio();
  const [aberto, setAberto] = useState<string | null>(null);
  const [todos, setTodos] = useState(false);
  const [verFonte, setVerFonte] = useState(false);
  const [verMapa, setVerMapa] = useState(false);

  // Estado do formulário "+ Adicionar lugar" na rotina
  const [adicionando, setAdicionando] = useState(false);
  const [nomeLugar, setNomeLugar] = useState("");
  const [buscaLocal, setBuscaLocal] = useState("");
  const [opcoesBusca, setOpcoesBusca] = useState<OpcaoDeLugar[]>([]);
  const [selecionado, setSelecionado] = useState<OpcaoDeLugar | null>(null);
  const [avisoLugar, setAvisoLugar] = useState<string | null>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const idBusca = useRef(0);

  const centroReferencia = centro ?? edificio?.centro ?? null;
  const fatos = fatosDeEquipamentos(bairro, predioId, acesso);
  const semaforos = semaforosPerto(bairro, predioId);
  const visiveis = todos ? fatos : fatos.slice(0, VISIVEIS);

  const pontosExtras = useMemo<EntradaPontoExtraMapa[]>(() => {
    if (!centroReferencia) return [];
    const lista: EntradaPontoExtraMapa[] = [...pontosDoEntornoNoMapa(centroReferencia)];
    try {
      const base = baseDeServicos();
      const ensino = servicosProximos(base, centroReferencia, 800, 4, 4);
      ensino.itens.forEach((item, i) => {
        lista.push({
          id: `ensino-${i}`,
          categoria: "ensino",
          rotulo: `Escola / ensino #${i + 1}`,
          detalhe: "Cadastro IBGE / CNEFE 2022",
          coordenada: item.coordenada,
          distanciaM: item.distanciaM,
        });
      });
      const saude = servicosProximos(base, centroReferencia, 800, 5, 4);
      saude.itens.forEach((item, i) => {
        lista.push({
          id: `saude-${i}`,
          categoria: "saude",
          rotulo: `Saúde / clínica #${i + 1}`,
          detalhe: "Cadastro IBGE / CNEFE 2022",
          coordenada: item.coordenada,
          distanciaM: item.distanciaM,
        });
      });
    } catch {
      // Base CNEFE pode estar ausente em testes unitários isolados
    }
    for (const local of perfil.locaisRotina) {
      lista.push({
        id: `rotina-${local.id}`,
        categoria: "rotina",
        rotulo: local.nome,
        detalhe: local.detalhe || "Lugar da sua rotina",
        coordenada: local.coordenada,
        distanciaM: Math.round(distanciaMetros(centroReferencia, local.coordenada)),
      });
    }
    return lista;
  }, [centroReferencia, perfil.locaisRotina]);

  if (!fatos.length && !centroReferencia) return null;

  const predioParaMapa = edificio ?? (centroReferencia ? predioSintetico(centroReferencia, bairro) : null);

  const pesquisarLocal = async (texto: string) => {
    setBuscaLocal(texto);
    setAvisoLugar(null);
    const limpo = texto.trim();
    if (limpo.length < 2) {
      setOpcoesBusca([]);
      return;
    }
    const req = ++idBusca.current;
    const norm = normalizar(limpo);

    // 1. Sugestões imediatas de qualquer um dos 94 bairros do Recife
    const bairrosMatch: OpcaoDeLugar[] = [];
    for (const b of BAIRROS_DO_RECIFE) {
      if (!normalizar(b.nome).includes(norm)) continue;
      const coord = centroideDoBairro(b.slug);
      if (!coord) continue;
      bairrosMatch.push({
        chave: `bairro-${b.slug}`,
        titulo: `Bairro ${b.nome}`,
        subtitulo: "Referência central do bairro no Recife",
        bairroSlug: b.slug,
        coordenada: coord,
        distanciaM: centroReferencia ? Math.round(distanciaMetros(centroReferencia, coord)) : null,
      });
      if (bairrosMatch.length >= 3) break;
    }

    // 2. Ruas e prédios nos bairros cobertos
    let prediosMatch: OpcaoDeLugar[] = [];
    try {
      const { bairros } = bairrosDaBusca(limpo);
      await garantirCamadas(bairros.map((b) => arquivoDoIndice(b)).filter((x): x is string => Boolean(x)));
      if (req !== idBusca.current) return;
      const mapaEdificios = new Map<SlugCoberto, Edificio[]>(
        bairros.filter(eCoberto).map((b) => [b, edificiosDoBairro(b)]),
      );
      prediosMatch = buscarNoCadastro(limpo, mapaEdificios)
        .slice(0, 5)
        .map(({ edificio: ed }) => {
          const bairroNome = BAIRROS_DO_RECIFE.find((b) => b.slug === ed.bairro)?.nome ?? ed.bairro;
          const endCurto = [ed.logradouro, ed.numero].filter(Boolean).join(", ");
          return {
            chave: `ed-${ed.id}`,
            titulo: ed.nome ? `${ed.nome} · ${endCurto}` : endCurto,
            subtitulo: bairroNome,
            bairroSlug: ed.bairro,
            coordenada: ed.centro,
            distanciaM: centroReferencia ? Math.round(distanciaMetros(centroReferencia, ed.centro)) : null,
          };
        });
    } catch {
      // Sem índice local carregado: mantém os bairros
    }

    if (req === idBusca.current) {
      setOpcoesBusca([...prediosMatch, ...bairrosMatch].slice(0, 6));
    }
  };

  const usarGpsAtual = async () => {
    setBuscandoGps(true);
    setAvisoLugar(null);
    try {
      const pos = await obterPosicaoDaVisita();
      const coord: [number, number] = [pos.longitude, pos.latitude];
      setSelecionado({
        chave: `gps-${Date.now()}`,
        titulo: "Minha posição atual (GPS)",
        subtitulo: pos.precisaoM !== null ? `Precisão informada de ~${Math.round(pos.precisaoM)} m` : "Posição do aparelho",
        bairroSlug: null,
        coordenada: coord,
        distanciaM: centroReferencia ? Math.round(distanciaMetros(centroReferencia, coord)) : null,
      });
      setOpcoesBusca([]);
    } catch (e) {
      setAvisoLugar(e instanceof Error ? e.message : "Não foi possível obter a localização agora.");
    } finally {
      setBuscandoGps(false);
    }
  };

  const salvarNovoLugar = async () => {
    const tituloFinal = nomeLugar.trim() || "Ponto de interesse";
    if (!selecionado) {
      setAvisoLugar("Escolha uma rua, prédio, bairro ou use seu GPS para marcar o local.");
      return;
    }
    const novo: LocalDeRotina = {
      id: `lr-${Date.now().toString(36)}-${perfil.locaisRotina.length}`,
      nome: tituloFinal.slice(0, 80),
      detalhe: selecionado.titulo.slice(0, 160),
      tipo: "rotina",
      bairroSlug: selecionado.bairroSlug,
      coordenada: selecionado.coordenada,
    };
    await salvarPerfil({ locaisRotina: [...perfil.locaisRotina.slice(-14), novo] });
    setNomeLugar("");
    setBuscaLocal("");
    setSelecionado(null);
    setOpcoesBusca([]);
    setAvisoLugar(null);
    setAdicionando(false);
    setVerMapa(true);
  };

  const removerLugar = async (id: string) => {
    await salvarPerfil({ locaisRotina: perfil.locaisRotina.filter((l) => l.id !== id) });
  };

  const destinoPerfilBairro =
    perfil.destinoBairro && centroReferencia
      ? (() => {
          const coord = centroideDoBairro(perfil.destinoBairro);
          if (!coord) return null;
          const nome = BAIRROS_DO_RECIFE.find((b) => b.slug === perfil.destinoBairro)?.nome ?? perfil.destinoBairro;
          return { nome, distanciaM: Math.round(distanciaMetros(centroReferencia, coord)) };
        })()
      : null;

  return (
    <View role="group" aria-label="Por perto, no cadastro da Prefeitura" style={{ gap: ESPACO[2] }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <View style={{ flex: 1, minWidth: 180 }}>
          <Sobretitulo>Por perto</Sobretitulo>
          <Titulo2 estilo={{ marginBottom: 0 }}>O que há em volta</Titulo2>
        </View>
        {predioParaMapa ? (
          <Pressionavel
            onPress={() => setVerMapa((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: verMapa }}
            accessibilityLabel={verMapa ? "Ocultar mapa do entorno" : "Ver pontos por perto no mapa"}
            style={{
              minHeight: 44,
              paddingHorizontal: 14,
              borderRadius: RAIO.pilula,
              borderWidth: 1,
              borderColor: verMapa ? cor("cor-acao") : cor("cor-linha"),
              backgroundColor: verMapa ? cor("cor-acao") : cor("cor-superficie"),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Texto style={{ fontSize: 13, fontWeight: "700", color: verMapa ? cor("cor-sobre-acao") : cor("cor-texto") }}>
              {verMapa ? "Fechar mapa" : "Ver no mapa"}
            </Texto>
          </Pressionavel>
        ) : null}
      </View>

      {verMapa && predioParaMapa ? (
        <View
          style={{
            padding: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: cor("cor-linha"),
            backgroundColor: cor("cor-superficie"),
            gap: 8,
          }}
        >
          <MapaDoLote
            predio={predioParaMapa}
            obras={obras}
            vizinhos={vizinhos}
            pontosExtras={pontosExtras}
          />
          <Nota>
            Toque em qualquer ponto (Praça, Metrô, Ensino, Saúde ou ★ seus lugares) para ver nome e distância em linha reta.
          </Nota>
        </View>
      ) : null}

      {/* Rotina e pontos de interesse pessoais */}
      <View
        style={{
          padding: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: cor("cor-linha"),
          backgroundColor: cor("cor-superficie"),
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Texto style={{ fontSize: 15, lineHeight: 20, fontWeight: "700", color: cor("cor-texto") }}>
              Sua rotina e pontos de interesse
            </Texto>
            {perfil.locaisRotina.length === 0 && !adicionando ? (
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 18, marginTop: 2 }}>
                Adicione trabalho, escola, academia ou família para medir a distância e marcar no mapa.
              </Texto>
            ) : null}
          </View>
          <Pressionavel
            onPress={() => {
              setAdicionando((a) => !a);
              setAvisoLugar(null);
            }}
            accessibilityRole="button"
            accessibilityState={{ expanded: adicionando }}
            style={{
              minHeight: 44,
              paddingHorizontal: 12,
              borderRadius: RAIO.pilula,
              borderWidth: 1,
              borderColor: adicionando ? cor("cor-linha") : comAlfa(cor("cor-acao"), 0.5),
              backgroundColor: adicionando ? cor("cor-papel-claro") : comAlfa(cor("cor-acao"), 0.12),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Texto style={{ fontSize: 12.5, fontWeight: "700", color: adicionando ? cor("cor-texto-apoio") : cor("cor-acao") }}>
              {adicionando ? "Cancelar" : "+ Adicionar lugar"}
            </Texto>
          </Pressionavel>
        </View>

        {destinoPerfilBairro && perfil.locaisRotina.length === 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 8,
              borderTopWidth: 0.5,
              borderTopColor: cor("cor-linha"),
            }}
          >
            <Texto style={{ fontSize: 13.5, color: cor("cor-texto") }}>
              Destino do perfil · <Texto style={{ fontWeight: "700" }}>{destinoPerfilBairro.nome}</Texto>
            </Texto>
            <Texto style={{ fontVariant: ["tabular-nums"], fontSize: 12.5, fontWeight: "600", color: cor("cor-azul-cadastral") }}>
              {formatarDist(destinoPerfilBairro.distanciaM)}
            </Texto>
          </View>
        ) : null}

        {perfil.locaisRotina.length > 0 ? (
          <View style={{ gap: 2 }}>
            {perfil.locaisRotina.map((local, idx) => {
              const dist = centroReferencia ? Math.round(distanciaMetros(centroReferencia, local.coordenada)) : null;
              const minPe = dist !== null && dist <= 2500 ? Math.max(1, Math.round(dist / 75)) : null;
              return (
                <View
                  key={local.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 8,
                    borderTopWidth: idx === 0 ? 0 : 0.5,
                    borderTopColor: cor("cor-linha"),
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: cor("cor-acao"), alignItems: "center", justifyContent: "center" }}>
                    <Texto style={{ color: cor("cor-sobre-acao"), fontSize: 10, fontWeight: "700" }}>★</Texto>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Texto style={{ fontSize: 14, lineHeight: 19, fontWeight: "700", color: cor("cor-texto") }}>
                      {local.nome}
                    </Texto>
                    {local.detalhe ? (
                      <Texto tipo="apoio" cor="cor-texto-apoio" numberOfLines={1} style={{ fontSize: 12.5, lineHeight: 17 }}>
                        {local.detalhe}
                      </Texto>
                    ) : null}
                  </View>
                  {dist !== null ? (
                    <View style={{ alignItems: "flex-end" }}>
                      <Texto style={{ fontVariant: ["tabular-nums"], fontSize: 13, fontWeight: "700", color: cor("cor-texto") }}>
                        {formatarDist(dist)}
                      </Texto>
                      {minPe ? (
                        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 15 }}>
                          {`~${minPe} min a pé`}
                        </Texto>
                      ) : null}
                    </View>
                  ) : null}
                  <Pressionavel
                    onPress={() => void removerLugar(local.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${local.nome}`}
                    style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
                  >
                    <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 15 }}>✕</Texto>
                  </Pressionavel>
                </View>
              );
            })}
            <Nota estilo={{ marginTop: 4 }}>
              Em linha reta até o ponto. Ruas, pontes e trânsito alteram o percurso real.
            </Nota>
          </View>
        ) : null}

        {adicionando ? (
          <View style={{ gap: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: cor("cor-linha") }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {PAPEIS_RAPIDOS.map((papel) => {
                const ativo = nomeLugar === papel;
                return (
                  <Pressionavel
                    key={papel}
                    onPress={() => setNomeLugar(papel)}
                    accessibilityRole="button"
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 10,
                      borderRadius: RAIO.pilula,
                      borderWidth: 1,
                      borderColor: ativo ? cor("cor-acao") : cor("cor-linha"),
                      backgroundColor: ativo ? comAlfa(cor("cor-acao"), 0.12) : cor("cor-papel-claro"),
                      justifyContent: "center",
                    }}
                  >
                    <Texto style={{ fontSize: 12.5, fontWeight: ativo ? "700" : "500", color: ativo ? cor("cor-acao") : cor("cor-texto") }}>
                      {papel}
                    </Texto>
                  </Pressionavel>
                );
              })}
            </View>

            <TextInput
              value={nomeLugar}
              onChangeText={setNomeLugar}
              placeholder="Nome do lugar (ex.: Trabalho, Pilates, Escola)"
              placeholderTextColor={cor("cor-texto-apoio")}
              accessibilityLabel="Nome do lugar da rotina"
              maxLength={80}
              style={{
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: cor("cor-linha"),
                backgroundColor: cor("cor-papel-claro"),
                color: cor("cor-texto"),
                fontFamily: "PlusJakartaSans",
                fontSize: 14,
              }}
            />

            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TextInput
                value={buscaLocal}
                onChangeText={(t) => void pesquisarLocal(t)}
                placeholder="Buscar rua, prédio ou bairro no Recife…"
                placeholderTextColor={cor("cor-texto-apoio")}
                accessibilityLabel="Buscar endereço ou bairro do lugar"
                style={{
                  flex: 1,
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: cor("cor-linha"),
                  backgroundColor: cor("cor-papel-claro"),
                  color: cor("cor-texto"),
                  fontFamily: "PlusJakartaSans",
                  fontSize: 14,
                }}
              />
              <Pressionavel
                onPress={() => void usarGpsAtual()}
                disabled={buscandoGps}
                accessibilityRole="button"
                accessibilityLabel="Usar minha localização GPS atual"
                style={{
                  minHeight: 44,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: cor("cor-azul-cadastral"),
                  backgroundColor: cor("cor-azul-cadastral-suave"),
                  justifyContent: "center",
                }}
              >
                <Texto style={{ fontSize: 12.5, fontWeight: "700", color: cor("cor-azul-cadastral") }}>
                  {buscandoGps ? "Lendo…" : "Usar GPS"}
                </Texto>
              </Pressionavel>
            </View>

            {opcoesBusca.length > 0 ? (
              <View style={{ borderRadius: 12, borderWidth: 1, borderColor: cor("cor-linha"), backgroundColor: cor("cor-papel-claro"), overflow: "hidden" }}>
                {opcoesBusca.map((op, i) => (
                  <Pressionavel
                    key={op.chave}
                    onPress={() => {
                      setSelecionado(op);
                      setOpcoesBusca([]);
                      setBuscaLocal(op.titulo);
                    }}
                    accessibilityRole="button"
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderTopWidth: i === 0 ? 0 : 0.5,
                      borderTopColor: cor("cor-linha"),
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Texto style={{ fontSize: 13.5, fontWeight: "600", color: cor("cor-texto") }} numberOfLines={1}>
                        {op.titulo}
                      </Texto>
                      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12 }}>
                        {op.subtitulo}
                      </Texto>
                    </View>
                    {op.distanciaM !== null ? (
                      <Texto style={{ fontVariant: ["tabular-nums"], fontSize: 12, fontWeight: "700", color: cor("cor-azul-cadastral") }}>
                        {formatarDist(op.distanciaM)}
                      </Texto>
                    ) : null}
                  </Pressionavel>
                ))}
              </View>
            ) : null}

            {selecionado ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, padding: 10, borderRadius: 10, backgroundColor: cor("cor-azul-cadastral-suave") }}>
                <Texto style={{ fontSize: 13, fontWeight: "600", color: cor("cor-azul-cadastral"), flex: 1 }}>
                  {`Selecionado: ${selecionado.titulo}${selecionado.distanciaM !== null ? ` (${formatarDist(selecionado.distanciaM)})` : ""}`}
                </Texto>
                <Pressionavel
                  onPress={() => void salvarNovoLugar()}
                  accessibilityRole="button"
                  style={{
                    minHeight: 44,
                    paddingHorizontal: 14,
                    borderRadius: RAIO.pilula,
                    backgroundColor: cor("cor-acao"),
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Texto style={{ fontSize: 13, fontWeight: "700", color: cor("cor-sobre-acao") }}>
                    Salvar
                  </Texto>
                </Pressionavel>
              </View>
            ) : null}

            {avisoLugar ? (
              <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12.5 }}>
                {avisoLugar}
              </Texto>
            ) : null}
          </View>
        ) : null}
      </View>

      {fatos.length > 0 ? (
        <>
          <Corpo estilo={{ marginTop: 2 }}>{AVISO_DOS_EQUIPAMENTOS}</Corpo>
          {visiveis.map((f, i) => {
            const estaAberto = aberto === f.id;
            return (
              <Pressionavel
                key={f.id}
                onPress={() => setAberto(estaAberto ? null : f.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: estaAberto }}
                accessibilityLabel={`${f.frase} ${estaAberto ? f.detalhe : "Ver nome e distância."}`}
                style={{ minHeight: 48, paddingVertical: 10, gap: 3, borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: cor("cor-linha") }}
              >
                <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20 }}>{f.frase}</Texto>
                {estaAberto ? <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5, lineHeight: 18 }}>{f.detalhe}</Texto> : null}
              </Pressionavel>
            );
          })}
          {fatos.length > VISIVEIS && !todos ? <LinkComSeta rotulo={`Ver mais ${fatos.length - VISIVEIS}`} onPress={() => setTodos(true)} discreto /> : null}
          {verFonte ? (
            <View style={{ marginTop: ESPACO[2], gap: 4 }}>
              {semaforos ? <Nota>{semaforos}</Nota> : null}
              <Nota>{fonteDosEquipamentos()}</Nota>
            </View>
          ) : (
            <LinkComSeta rotulo="Ver contagens e fonte" onPress={() => setVerFonte(true)} discreto />
          )}
        </>
      ) : null}
    </View>
  );
}
