// Explorar sem partida a frio (15/11/2026): entrada única (link de anúncio OU busca por prédio, rua ou bairro), "Usar minha
// localização agora", três exemplos reais para quem chega sem link, a triagem dos cartões (favoritar, anotar, descartar,
// etapa) e "Onde mais procurar" assim que o perfil da casa tem destino. Nenhuma nota, nenhum veredito.
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { garantirCamadas } from "../../dados/camadas";
import { ondeMaisProcurar } from "../../dados/escolha";
import { bairroPorSlug, eCoberto, type SlugCoberto } from "../../dados/recife/bairros";
import { arquivoDoIndice, edificioPorId, edificiosDoBairro, indiceDoBairro } from "../../dados/recife/indice";
import {
  bairrosDaBusca, bairrosNoPonto, buscarNoCadastro, lerEntrada, predioMaisPerto, RAIO_DA_LOCALIZACAO_M, type ResultadoDaBusca,
} from "../../dados/recife/localizar";
import { arquivoDaProcura, procura } from "../../dados/recife/procura";
import { analiseDoPredio, enderecoDoPredio, EXEMPLOS, idDoRaioX, nomeDoPredio, type Exemplo } from "../../dados/raioX";
import { comEtapa, comNota, ETAPAS_DA_TRIAGEM, etapaDaAnalise, LIMITE_DA_NOTA, type EtapaDaBusca, type FiltroDeEtapa } from "../../dados/triagem";
import { useAnalises } from "../../estado/Analises";
import { usePerfilDomicilio } from "../../estado/PerfilDomicilio";
import { obterPosicaoDaVisita } from "../../plataforma/posicaoDaVisita";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { Botao } from "../Botao";
import { useFocoDoCampo } from "../casca/foco";
import { tituloDaRua } from "../comparar/Rotina";
import { AlvoDeToque, Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";

/** Abre o Raio-X de um prédio: reaproveita a análise do mesmo prédio, ou cria uma (sem anúncio, sem preço). */
export function useAbrirRaioX() {
  const { lista, salvar, definirAtiva } = useAnalises();
  return useCallback(
    async (e: Edificio, origem: "busca" | "localizacao" | "exemplo", titulo?: string) => {
      const id = idDoRaioX(e.id, origem === "exemplo" ? "exemplo" : "raiox");
      if (!lista.some((a) => a.id === id)) {
        const agora = new Date().toISOString();
        await salvar(analiseDoPredio(e, { agora, indiceGeradoEm: indiceDoBairro(e.bairro as SlugCoberto).geradoEm, origem, titulo }));
      }
      await definirAtiva(id);
      router.push({ pathname: "/dossie", params: { id } });
    },
    [lista, salvar, definirAtiva],
  );
}

async function edificiosDe(bairros: readonly SlugCoberto[]): Promise<Map<SlugCoberto, Edificio[]>> {
  await garantirCamadas(bairros.map((b) => arquivoDoIndice(b)).filter((x): x is string => !!x));
  return new Map(bairros.map((b) => [b, edificiosDoBairro(b)]));
}

type EstadoDaBusca =
  | { tipo: "parado" }
  | { tipo: "procurando"; o: string }
  | { tipo: "resultado"; itens: ResultadoDaBusca[]; onde: string; citados: boolean }
  | { tipo: "perto"; edificio: Edificio; distanciaM: number; precisaoM: number | null }
  | { tipo: "aviso"; texto: string };

export function BuscaUnificada() {
  const { cor } = useTema();
  const foco = useFocoDoCampo();
  const campo = useRef<TextInput>(null);
  const abrirRaioX = useAbrirRaioX();
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [estado, setEstado] = useState<EstadoDaBusca>({ tipo: "parado" });
  const montado = useRef(true);
  useEffect(() => () => { montado.current = false; }, []);
  const entrada = lerEntrada(texto);

  const colar = async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (t && t.trim()) { setTexto(t.trim()); setErro(""); }
      else { setErro("Não há nada copiado. Copie o endereço do anúncio e toque de novo, ou cole direto no campo."); campo.current?.focus(); }
    } catch {
      setErro("O navegador não deixou o Vereda ler o que você copiou. Cole o link direto no campo (Ctrl+V; no celular, toque e segure o campo e escolha Colar).");
      campo.current?.focus();
    }
  };

  const enviar = async () => {
    const e = lerEntrada(texto);
    if (e.tipo === "vazia") { setErro("Cole o link do anúncio ou digite o nome do prédio, a rua ou o bairro."); return; }
    if (e.tipo === "link_invalido") { setErro(e.motivo); return; }
    setErro("");
    if (e.tipo === "link") {
      // `n` faz cada "Gerar Dossiê" recomeçar a leitura: a tela fica montada entre uma visita e outra (ver `ler.tsx`).
      router.push({ pathname: "/ler", params: { url: e.url, n: String(Date.now()) } });
      return;
    }
    const { bairros, citados } = bairrosDaBusca(e.texto);
    setEstado({ tipo: "procurando", o: "Procurando no cadastro…" });
    try {
      const porBairro = await edificiosDe(bairros);
      if (!montado.current) return;
      const itens = buscarNoCadastro(e.texto, porBairro);
      const onde = citados ? bairros.map((b) => bairroPorSlug(b)?.nome ?? b).join(", ") : "Boa Viagem, Graças, Espinheiro, Madalena, Casa Forte e Aflitos";
      setEstado({ tipo: "resultado", itens, onde, citados });
    } catch {
      if (montado.current) setEstado({ tipo: "aviso", texto: "O cadastro não abriu agora (sem rede?). Tente de novo em instantes." });
    }
  };

  const usarLocalizacao = async () => {
    setErro("");
    setEstado({ tipo: "procurando", o: "Pedindo a sua localização…" });
    try {
      const p = await obterPosicaoDaVisita();
      const bairros = bairrosNoPonto(p.longitude, p.latitude);
      if (!bairros.length) { if (montado.current) setEstado({ tipo: "aviso", texto: "Você está fora dos bairros que o Vereda já cobre no Recife. Busque pelo nome do prédio, da rua ou do bairro." }); return; }
      setEstado({ tipo: "procurando", o: "Procurando o prédio mais perto…" });
      const porBairro = await edificiosDe(bairros);
      const perto = predioMaisPerto(p.longitude, p.latitude, [...porBairro.values()].flat());
      if (!montado.current) return;
      setEstado(perto
        ? { tipo: "perto", edificio: perto.edificio, distanciaM: perto.distanciaM, precisaoM: p.precisaoM }
        : { tipo: "aviso", texto: `Nenhum prédio do cadastro (com 2 ou mais apartamentos) a até ${RAIO_DA_LOCALIZACAO_M} m de você. Busque pelo nome ou pela rua.` });
    } catch (e) {
      if (montado.current) setEstado({ tipo: "aviso", texto: e instanceof Error && /autoriz/i.test(e.message) ? "Sem permissão de localização. Busque pelo nome do prédio, da rua ou do bairro." : "Não deu para ler a sua localização agora. Busque pelo nome do prédio, da rua ou do bairro." });
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <Texto tipo="secao" role="heading" style={{ flexShrink: 1, fontSize: 22, lineHeight: 28, fontWeight: "700", letterSpacing: -0.4 }}>
          Anúncio, prédio ou rua
        </Texto>
        <AlvoDeToque onPress={() => void colar()} style={{ minHeight: 44, minWidth: 44, justifyContent: "center" }} accessibilityRole="button" accessibilityLabel="Colar link">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: cor("cor-papel-claro"), borderRadius: 999, borderWidth: 1, borderColor: cor("cor-linha") }}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={cor("cor-texto-apoio")} strokeWidth={1.8} aria-hidden>
              <Rect x={9} y={9} width={13} height={13} rx={2} />
              <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </Svg>
            <Texto tipo="apoio" style={{ fontSize: 13, lineHeight: 17, color: cor("cor-texto"), fontWeight: "600" }}>Colar link</Texto>
          </View>
        </AlvoDeToque>
      </View>
      <View style={[{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, paddingHorizontal: 14, minHeight: 54, backgroundColor: foco.focado ? cor("cor-superficie") : cor("cor-creme"), borderRadius: 12, borderWidth: 1, borderColor: cor("cor-linha-forte") }, foco.estilo]}>
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={cor("cor-acao")} strokeWidth={2} aria-hidden>
          <Path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
          <Path d="m21 21-4.3-4.3" />
        </Svg>
        <TextInput
          ref={campo}
          value={texto}
          onChangeText={(v) => { setTexto(v); if (erro) setErro(""); }}
          onFocus={foco.aoFocar}
          onBlur={foco.aoDesfocar}
          onSubmitEditing={() => void enviar()}
          placeholder="Link do anúncio, prédio ou rua"
          placeholderTextColor={cor("cor-texto-apoio")}
          accessibilityLabel="Link do anúncio, prédio, rua ou bairro"
          style={{ flex: 1, minWidth: 0, padding: 0, color: cor("cor-texto"), fontFamily: "PlusJakartaSans", fontSize: 15.5, fontWeight: "500", outlineWidth: 0 }}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
        />
      </View>
      {erro ? <Texto tipo="apoio" role="alert" style={{ color: cor("cor-barro-texto"), fontSize: 13, lineHeight: 18 }}>{erro}</Texto> : null}
      <View style={{ gap: 10 }}>
        <Botao rotulo={entrada.tipo === "busca" ? "Buscar no cadastro" : "Gerar Dossiê"} variante="principal" seta onPress={() => void enviar()} />
        <Botao rotulo="Usar minha localização agora" variante="secundario" onPress={() => void usarLocalizacao()} />
        <Botao rotulo="Adicionar imóvel sem link" variante="texto" onPress={() => router.push("/editar")} />
      </View>
      <ResultadoDaBuscaUnificada estado={estado} aoAbrir={(e, origem) => void abrirRaioX(e, origem)} />
    </View>
  );
}

function LinhaDePredio({ e, detalhe, aoAbrir }: { e: Edificio; detalhe: string; aoAbrir: () => void }) {
  const { cor } = useTema();
  const nome = nomeDoPredio(e);
  return (
    <Pressionavel onPress={aoAbrir} accessibilityRole="button" accessibilityLabel={`Abrir o Raio-X: ${nome}. ${detalhe}`}
      style={{ minHeight: 52, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: cor("cor-linha"), justifyContent: "center" }}>
      <Texto tipo="corpo" style={{ fontSize: 15, lineHeight: 20, fontWeight: "600" }}>{nome}</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 18 }}>{detalhe}</Texto>
    </Pressionavel>
  );
}

const detalheDoPredio = (e: Edificio) =>
  [e.nome ? enderecoDoPredio(e) : null, bairroPorSlug(e.bairro)?.nome ?? e.bairro, e.anoConstrucao ? `${e.anoConstrucao}` : null, `${e.unidades} unidades no IPTU`].filter(Boolean).join(" · ");

function ResultadoDaBuscaUnificada({ estado, aoAbrir }: { estado: EstadoDaBusca; aoAbrir: (e: Edificio, origem: "busca" | "localizacao") => void }) {
  if (estado.tipo === "parado") return null;
  if (estado.tipo === "procurando") return <Texto tipo="apoio" role="status" cor="cor-texto-apoio">{estado.o}</Texto>;
  if (estado.tipo === "aviso") return <Texto tipo="apoio" role="alert" cor="cor-barro-texto">{estado.texto}</Texto>;
  if (estado.tipo === "perto") {
    return (
      <View style={{ gap: 4 }} role="group" aria-label="Prédio mais perto de você">
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 18 }}>
          {`Prédio mais perto: a ~${estado.distanciaM} m${estado.precisaoM !== null ? ` (precisão ~${Math.round(estado.precisaoM)} m)` : ""}.`}
        </Texto>
        <LinhaDePredio e={estado.edificio} detalhe={detalheDoPredio(estado.edificio)} aoAbrir={() => aoAbrir(estado.edificio, "localizacao")} />
      </View>
    );
  }
  if (!estado.itens.length) {
    return <Texto tipo="apoio" role="status">{`Nada no cadastro de ${estado.onde}. Tente só o nome da rua ou bairro.`}</Texto>;
  }
  const soBairro = estado.itens.every((i) => i.motivo === "bairro");
  return (
    <View role="group" aria-label="Prédios encontrados">
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 18, marginBottom: 4 }}>
        {soBairro ? `Prédios em ${estado.onde}. Toque para abrir o Raio-X.` : `Cadastro de ${estado.onde}. Toque para abrir o Raio-X.`}
      </Texto>
      {estado.itens.map(({ edificio: e }) => <LinhaDePredio key={e.id} e={e} detalhe={detalheDoPredio(e)} aoAbrir={() => aoAbrir(e, "busca")} />)}
    </View>
  );
}

/** "Explorar um endereço exemplo agora": três prédios reais, sem anúncio. Some quando o índice não tem o prédio. */
export function ExemplosAgora({ recolhido = false }: { recolhido?: boolean }) {
  const { cor } = useTema();
  const abrirRaioX = useAbrirRaioX();
  const [aberto, setAberto] = useState(!recolhido);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const abrir = async (x: Exemplo) => {
    setOcupado(x.id);
    try {
      const arquivo = arquivoDoIndice(x.bairro);
      await garantirCamadas(arquivo ? [arquivo] : []);
      const e = eCoberto(x.bairro) ? edificioPorId(x.edificioId, x.bairro) : null;
      if (e) await abrirRaioX(e, "exemplo", `Exemplo · ${x.titulo}`);
    } finally {
      setOcupado(null);
    }
  };
  return (
    <View style={{ gap: 10 }}>
      <Pressionavel onPress={() => setAberto((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: aberto }} aria-expanded={aberto}
        accessibilityLabel="Explorar um endereço exemplo agora" style={{ minHeight: 44, justifyContent: "center" }}>
        <Texto tipo="secao" style={{ fontSize: 17, lineHeight: 23, fontWeight: "700" }}>{`Explorar um endereço exemplo agora ${aberto ? "−" : "+"}`}</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13.5, lineHeight: 19 }}>Prédios reais para testar o dossiê em 1 toque.</Texto>
      </Pressionavel>
      {aberto ? EXEMPLOS.map((x) => (
        <Pressionavel key={x.id} onPress={() => void abrir(x)} accessibilityRole="button" accessibilityLabel={`Exemplo: ${x.titulo}. ${x.resumo}`}
          style={{ minHeight: 58, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: cor("cor-linha"), backgroundColor: cor("cor-superficie"), gap: 4 }}>
          <Texto tipo="corpo" style={{ fontSize: 15, lineHeight: 20, fontWeight: "600" }}>{ocupado === x.id ? `${x.titulo} · abrindo…` : x.titulo}</Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 18 }}>{x.resumo}</Texto>
        </Pressionavel>
      )) : null}
    </View>
  );
}

const LIMITES_DE_IDA = [20, 30, 45] as const;
/** "Onde mais procurar no piloto": ruas com ida das 7h até o bairro de destino do perfil, sem precisar comparar antes. */
export function OndeMaisProcurarNoPiloto() {
  const { cor } = useTema();
  const { perfil } = usePerfilDomicilio();
  const destino = perfil.destinoBairro;
  const [ateMin, setAteMin] = useState<number>(30);
  const [pronto, setPronto] = useState<"carregando" | "ok" | "falhou">("carregando");
  useEffect(() => {
    if (!destino) return;
    let vivo = true;
    garantirCamadas([arquivoDaProcura()]).then(() => vivo && setPronto("ok"), () => vivo && setPronto("falhou"));
    return () => { vivo = false; };
  }, [destino]);
  if (!destino) return null;
  const nomeDestino = bairroPorSlug(destino)?.nome ?? destino;
  const p = pronto === "ok" ? procura() : null;
  const r = p ? ondeMaisProcurar(p.ruas, p.bairros, destino, ateMin, [], { limite: 5 }) : null;
  return (
    <View style={{ gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: comAlfa(cor("cor-texto"), 0.09), backgroundColor: cor("cor-superficie") }} role="group" aria-label="Onde mais procurar no piloto">
      <Texto tipo="secao" style={{ fontSize: 16, lineHeight: 22, fontWeight: "600" }}>Onde mais procurar no piloto</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>{`Ruas com ida de ônibus ou metrô às 7h até ${nomeDestino} (horário programado, dia útil).`}</Texto>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }} accessibilityRole="radiogroup">
        {LIMITES_DE_IDA.map((m) => (
          <AlvoDeToque key={m} onPress={() => setAteMin(m)} accessibilityRole="radio" accessibilityState={{ checked: ateMin === m }} aria-checked={ateMin === m}
            style={{ minHeight: 44, minWidth: 44, justifyContent: "center" }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: ateMin === m ? cor("cor-acao") : cor("cor-linha"), backgroundColor: ateMin === m ? comAlfa(cor("cor-acao"), 0.12) : "transparent" }}>
              <Texto tipo="apoio" style={{ fontSize: 12, fontWeight: "600" }}>{`até ${m} min`}</Texto>
            </View>
          </AlvoDeToque>
        ))}
      </View>
      {pronto === "carregando" ? <Texto tipo="apoio" role="status">Carregando as ruas…</Texto> : null}
      {pronto === "falhou" || (pronto === "ok" && !p) ? <Texto tipo="apoio" role="alert">Sem leitura publicada nesta área ainda.</Texto> : null}
      {r?.estado === "sem_destino" ? <Texto tipo="apoio">{`Sem leitura publicada para ${nomeDestino} ainda.`}</Texto> : null}
      {r?.estado === "nenhuma" ? <Texto tipo="apoio">{`Nenhuma rua do piloto com ida até ${ateMin} min.`}</Texto> : null}
      {r?.estado === "ok" ? (
        <View role="list" style={{ gap: 4 }}>
          {r.ruas.map((x) => (
            <View key={x.c} role="listitem">
              <Texto style={{ fontSize: 13, lineHeight: 19 }}>{`${tituloDaRua(x.n)} (${bairroPorSlug(x.b)?.nome ?? x.b}) · ${x.minutos} min`}</Texto>
            </View>
          ))}
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>
            {`${r.total > r.ruas.length ? `Mais ${r.total - r.ruas.length} ruas também cabem. ` : ""}Preço e anúncios não entram: procure nessas ruas no portal que você usa.`}
          </Texto>
        </View>
      ) : null}
    </View>
  );
}

/** Filtro por etapa da busca, acima dos cartões. */
export function FiltroDeEtapas({ filtro, aoEscolher, contagem }: { filtro: FiltroDeEtapa; aoEscolher: (f: FiltroDeEtapa) => void; contagem: (f: FiltroDeEtapa) => number }) {
  const { cor } = useTema();
  const opcoes: { valor: FiltroDeEtapa; rotulo: string }[] = [{ valor: "todas", rotulo: "Todas" }, ...ETAPAS_DA_TRIAGEM];
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityRole="radiogroup" aria-label="Etapa da busca">
      {opcoes.map((o) => {
        const ativo = filtro === o.valor;
        return (
          <AlvoDeToque key={o.valor} onPress={() => aoEscolher(o.valor)} accessibilityRole="radio" accessibilityState={{ checked: ativo }} aria-checked={ativo}
            accessibilityLabel={`${o.rotulo} (${contagem(o.valor)})`} style={{ minHeight: 44, justifyContent: "center" }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: ativo ? cor("cor-texto") : cor("cor-linha"), backgroundColor: ativo ? cor("cor-texto") : "transparent" }}>
              <Texto tipo="apoio" style={{ fontSize: 11.5, fontWeight: "600", color: ativo ? cor("cor-superficie") : cor("cor-texto") }}>{`${o.rotulo} ${contagem(o.valor)}`}</Texto>
            </View>
          </AlvoDeToque>
        );
      })}
    </View>
  );
}

/** Favoritar / Anotar / Descartar e a etapa, num toque, embaixo de cada cartão. */
export function TriagemDoCartao({ analise: a, aoDescartar }: { analise: AnaliseV2; aoDescartar: () => void }) {
  const { cor } = useTema();
  const { salvar } = useAnalises();
  const [anotando, setAnotando] = useState(false);
  const [nota, setNota] = useState("");
  const [aviso, setAviso] = useState("");
  const etapa = etapaDaAnalise(a);
  const gravar = async (nova: AnaliseV2 | null, ok: string) => {
    if (!nova) return;
    try { await salvar(nova); setAviso(ok); } catch { setAviso("Não foi possível salvar. Tente de novo."); }
  };
  const botao = (rotulo: string, onPress: () => void, extra: object = {}) => (
    <AlvoDeToque onPress={onPress} accessibilityRole="button" style={{ minHeight: 44, minWidth: 44, justifyContent: "center" }} {...extra}>
      <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: cor("cor-linha") }}>
        <Texto tipo="apoio" style={{ fontSize: 12, fontWeight: "600" }}>{rotulo}</Texto>
      </View>
    </AlvoDeToque>
  );
  return (
    <View style={{ gap: 6, paddingHorizontal: 14, paddingBottom: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {botao(a.salva ? "★ Favorito" : "☆ Favoritar", () => void gravar({ ...a, salva: !a.salva, atualizadaEm: new Date().toISOString() }, a.salva ? "Tirado dos favoritos" : "Favoritado"),
          { accessibilityLabel: a.salva ? `Tirar ${a.nome} dos favoritos` : `Favoritar ${a.nome}`, accessibilityState: { selected: a.salva }, "aria-pressed": a.salva })}
        {botao("Anotar", () => setAnotando((v) => !v), { accessibilityLabel: `Anotar sobre ${a.nome}`, accessibilityState: { expanded: anotando } })}
        {botao("Descartar", aoDescartar, { accessibilityLabel: `Descartar ${a.nome}` })}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityRole="radiogroup" aria-label={`Etapa de ${a.nome}`}>
        {ETAPAS_DA_TRIAGEM.map((x) => {
          const ativo = etapa === x.valor || (x.valor === "negociando" && etapa === "escolhido");
          return (
            <AlvoDeToque key={x.valor} onPress={() => void gravar(comEtapa(a, x.valor as EtapaDaBusca, new Date().toISOString()), `Etapa: ${x.rotulo}`)}
              accessibilityRole="radio" accessibilityState={{ checked: ativo }} aria-checked={ativo} accessibilityLabel={`Etapa ${x.rotulo}`} style={{ minHeight: 44, justifyContent: "center" }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: ativo ? comAlfa(cor("cor-azul-cadastral"), 0.14) : "transparent", borderWidth: 1, borderColor: ativo ? cor("cor-azul-cadastral") : cor("cor-linha") }}>
                <Texto tipo="apoio" style={{ fontSize: 11, fontWeight: ativo ? "700" : "500" }}>{x.rotulo}</Texto>
              </View>
            </AlvoDeToque>
          );
        })}
      </View>
      {anotando ? (
        <View style={{ gap: 6 }}>
          <TextInput value={nota} onChangeText={setNota} maxLength={LIMITE_DA_NOTA} multiline accessibilityLabel={`Nota sobre ${a.nome}`} placeholder="Ex.: ligar para o corretor sobre o condomínio"
            placeholderTextColor={cor("cor-texto-apoio")} style={{ minHeight: 44, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: cor("cor-linha"), color: cor("cor-texto"), fontFamily: "PlusJakartaSans", fontSize: 13 }} />
          <Botao rotulo="Guardar nota" variante="secundario" desativado={!nota.trim()} onPress={() => void gravar(comNota(a, nota, new Date().toISOString()), "Nota guardada no caderno").then(() => { setNota(""); setAnotando(false); })} />
        </View>
      ) : null}
      {aviso ? <Texto tipo="apoio" role="status" cor="cor-texto-apoio" style={{ fontSize: 11.5 }}>{aviso}</Texto> : null}
    </View>
  );
}
