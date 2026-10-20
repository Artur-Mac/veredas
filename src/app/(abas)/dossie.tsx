import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Botao } from "../../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../../componentes/Cartao";
import { useAviso } from "../../componentes/casca/Aviso";
import { GavetaDeDescarte } from "../../componentes/descarte/GavetaDeDescarte";
import { AbasDoDossie, ID_DO_PAINEL, idDaAba } from "../../componentes/dossie-v1/AbasDoDossie";
import { CaixaCreme, Corpo, LinkComSeta } from "../../componentes/dossie-v1/base";
import { carregarCadastro } from "../../componentes/dossie-v1/cadastro";
import { BlocoDeCusto } from "../../componentes/dossie-v1/Custo";
import { Destaques } from "../../componentes/dossie-v1/Destaques";
import { EdificioDoDossie, type SecaoDoEdificio } from "../../componentes/dossie-v1/Edificio";
import { Entorno, type SecaoDoEntorno } from "../../componentes/dossie-v1/Entorno";
import { GavetaDaPergunta, GavetaDoAnuncio, GavetaDoCadastro, GavetaDoMapa, GavetaDoRoteiro } from "../../componentes/dossie-v1/Gavetas";
import { InfoDoImovel } from "../../componentes/dossie-v1/InfoDoImovel";
import { TopoDoDossie } from "../../componentes/dossie-v1/Topo";
import type { AbaDoDossie } from "../../componentes/dossie-v1/textos";
import { GavetaDeFonte, type PedidoDeFonte } from "../../componentes/fonte/GavetaDeFonte";
import { Tela } from "../../componentes/Tela";
import { Texto } from "../../componentes/Texto";
import type { AnaliseV2, Pergunta, Prioridade } from "../../dados/contratos";
import { derivarDossie } from "../../dados/dossie/derivar";
import { bairroPorSlug, eCoberto } from "../../dados/recife/bairros";
import { useAnalises } from "../../estado/Analises";
import { useTema } from "../../tema/Tema";
import { ESPACO, comAlfa } from "../../tema/tokens";

/** Recuo do painel (`.ds-panel`, padding 20 18): a posição de uma seção na tela soma este recuo ao topo do painel. */
const RECUO_DO_PAINEL = 20;
/** Folga acima da seção ao rolar até ela. */
const FOLGA_AO_ROLAR = 8;

type GavetaAberta =
  /** `voltarPara`: a gaveta que estava aberta quando a pessoa tocou no dado; ao fechar a fonte, ela volta. */
  | { tipo: "fonte"; pedido: PedidoDeFonte; voltarPara?: "cadastro" }
  | { tipo: "anuncio" }
  | { tipo: "cadastro" }
  | { tipo: "mapa" }
  | { tipo: "roteiro" }
  | { tipo: "pergunta"; pergunta: Pergunta }
  | { tipo: "descarte" };

type SecaoDaAba = SecaoDoEntorno | SecaoDoEdificio;

/** `aria-labelledby` existe na web e não consta nos tipos do React Native: o painel é nomeado pela aba ativa. */
const PAINEL_DA_ABA = (aba: AbaDoDossie) => ({ "aria-labelledby": idDaAba(aba) }) as unknown as object;

function primeiroParametro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default function TelaDossie() {
  const parametros = useLocalSearchParams<{ id?: string | string[] }>();
  const id = primeiroParametro(parametros.id);
  const { lista, ativa, analiseAtiva, pronto, definirAtiva } = useAnalises();
  const analise = id ? (lista.find((a) => a.id === id) ?? null) : analiseAtiva;
  const idDaAnalise = analise?.id ?? null;

  // Abrir por id torna a análise a ativa: a Visita e o Comparar partem dela.
  useEffect(() => {
    if (id && idDaAnalise === id && ativa !== id) void definirAtiva(id).catch(() => undefined);
  }, [id, idDaAnalise, ativa, definirAtiva]);

  // Com a análise já ativa, o parâmetro sai da rota: depois disso a tela segue a ativa, e um parâmetro antigo não
  // sobrepõe uma análise aberta em outra aba (o dock abre "/dossie" sem id).
  useEffect(() => {
    if (!id || idDaAnalise !== id || ativa !== id) return;
    try {
      router.setParams({ id: undefined });
    } catch {
      // Sem roteador montado (teste ou transição): o parâmetro simplesmente continua na rota.
    }
  }, [id, idDaAnalise, ativa]);

  return (
    <Tela comAbas>
      {!pronto ? (
        <View style={styles.centro}>
          <Texto tipo="apoio" cor="cor-texto-apoio">
            Abrindo suas análises…
          </Texto>
        </View>
      ) : analise ? (
        <DossieDaAnalise key={analise.id} analise={analise} lista={lista} />
      ) : (
        <EstadoVazio />
      )}
    </Tela>
  );
}

function EstadoVazio() {
  return (
    <View style={styles.conteiner}>
      <Cartao style={styles.cartao}>
        <CorpoDoCartao>
          <Texto tipo="secao">Dossiê</Texto>
          <Texto tipo="corpo" cor="cor-texto-apoio">
            Nenhum dossiê aberto. Cole um link em Explorar.
          </Texto>
          <Botao rotulo="Ir para Explorar" variante="principal" onPress={() => router.push("/")} />
        </CorpoDoCartao>
      </Cartao>
    </View>
  );
}

function DossieDaAnalise({ analise, lista }: { analise: AnaliseV2; lista: AnaliseV2[] }) {
  const { cor } = useTema();
  const { salvar, definirAtiva } = useAnalises();
  const { mostrarAviso } = useAviso();
  const [aba, setAba] = useState<AbaDoDossie>("destaques");
  const [prioridade, setPrioridade] = useState<Prioridade>("custo");
  const [gaveta, setGaveta] = useState<GavetaAberta | null>(null);

  const rolagem = useRef<ScrollView>(null);
  const posicoes = useRef({ coluna: 0, painel: 0 });
  const secoes = useRef<Partial<Record<SecaoDaAba, number>>>({});
  const pendente = useRef<SecaoDaAba | null>(null);

  // O índice do bairro valida no primeiro acesso e fica em memória; a leitura é uma busca em mapa.
  const cadastro = useMemo(() => carregarCadastro(analise), [analise]);
  const outras = useMemo(() => lista.filter((x) => x.id !== analise.id), [lista, analise.id]);
  const visao = useMemo(
    () => derivarDossie(analise, cadastro.edificio, cadastro.contexto, cadastro.obras, outras, new Date(), prioridade),
    [analise, cadastro, outras, prioridade],
  );

  const coberto = eCoberto(analise.bairro);
  const vinculoConfirmado = analise.vinculo.estado === "confirmado";
  const nomeDoBairro = bairroPorSlug(analise.bairro)?.nome ?? (analise.bairroTexto.trim() || "Bairro");
  const predio = visao.loteConfirmado ? cadastro.edificio : null;

  const fechar = useCallback(() => setGaveta(null), []);

  const rolarAte = useCallback((y: number) => {
    const { coluna, painel } = posicoes.current;
    rolagem.current?.scrollTo({ y: Math.max(0, coluna + painel + RECUO_DO_PAINEL + y - FOLGA_AO_ROLAR), animated: false });
  }, []);

  const irPara = useCallback(
    (destino: AbaDoDossie, secao: SecaoDaAba) => {
      setGaveta(null);
      const y = destino === aba ? secoes.current[secao] : undefined;
      if (y !== undefined) {
        rolarAte(y);
        return;
      }
      pendente.current = secao;
      setAba(destino);
    },
    [aba, rolarAte],
  );

  const medirSecao = useCallback(
    (secao: SecaoDaAba, y: number) => {
      secoes.current[secao] = y;
      if (pendente.current === secao) {
        pendente.current = null;
        rolarAte(y);
      }
    },
    [rolarAte],
  );

  const escolherAba = useCallback((destino: AbaDoDossie) => {
    pendente.current = null;
    setAba(destino);
  }, []);

  const abrirFonte = useCallback((pedido: PedidoDeFonte) => setGaveta({ tipo: "fonte", pedido }), []);
  const abrirFonteDoCadastro = useCallback((pedido: PedidoDeFonte) => setGaveta({ tipo: "fonte", pedido, voltarPara: "cadastro" }), []);
  const fecharFonte = useCallback(() => setGaveta((g) => (g?.tipo === "fonte" && g.voltarPara ? { tipo: g.voltarPara } : null)), []);

  const confirmarPredio = useCallback(() => router.push({ pathname: "/predio", params: { id: analise.id } }), [analise.id]);
  const verComposicao = useCallback(() => router.push({ pathname: "/editar", params: { id: analise.id } }), [analise.id]);

  const prepararVisita = useCallback(async () => {
    setGaveta(null);
    try {
      await definirAtiva(analise.id);
    } catch {
      mostrarAviso("Não foi possível abrir a visita. Tente de novo.");
      return;
    }
    router.push("/visita");
  }, [analise.id, definirAtiva, mostrarAviso]);

  const alternarSalvo = useCallback(async () => {
    try {
      await salvar({ ...analise, salva: !analise.salva, atualizadaEm: new Date().toISOString() });
      mostrarAviso(analise.salva ? "Removido dos salvos" : "Salvo no caderno");
    } catch {
      mostrarAviso("Não foi possível salvar. Tente de novo.");
    }
  }, [analise, salvar, mostrarAviso]);

  const gavetaDeFonte = gaveta?.tipo === "fonte" ? gaveta.pedido : null;
  const perguntaAberta = gaveta?.tipo === "pergunta" ? gaveta.pergunta : null;

  return (
    <>
      <ScrollView ref={rolagem} contentContainerStyle={styles.rolagem} keyboardShouldPersistTaps="handled">
        <View style={styles.coluna} onLayout={(e) => (posicoes.current.coluna = e.nativeEvent.layout.y)}>
          {/* `.ds-overview` */}
          <View
            accessibilityLabel="Resumo do imóvel"
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: comAlfa(cor("cor-texto"), 0.09),
              backgroundColor: cor("cor-superficie"),
              overflow: "hidden",
            }}
          >
            <TopoDoDossie
              predio={predio}
              salva={analise.salva}
              aoVoltar={() => router.navigate("/")}
              aoAlternarSalvo={() => void alternarSalvo()}
              aoAbrirMapa={predio ? () => setGaveta({ tipo: "mapa" }) : null}
            />
            <InfoDoImovel
              visao={visao}
              coberto={coberto}
              aoConfirmarPredio={confirmarPredio}
              aoAbrirAnuncio={() => setGaveta({ tipo: "anuncio" })}
              aoAbrirCadastro={() => setGaveta({ tipo: "cadastro" })}
              aoAbrirFonte={abrirFonte}
            />
            <BlocoDeCusto custo={visao.custo} area={visao.especificacoes.area} posicao={visao.posicao} aoAbrirPosicao={() => irPara("entorno", "preco")} aoAjustar={verComposicao} />
          </View>

          {cadastro.falhou ? (
            <CaixaCreme estilo={{ marginTop: ESPACO[3] }}>
              <Texto tipo="corpo" role="alert" style={{ fontSize: 13, lineHeight: 19, fontWeight: "600" }}>
                Não foi possível abrir o cadastro de {nomeDoBairro}.
              </Texto>
              <Corpo estilo={{ fontSize: 13, lineHeight: 19 }}>Os dados do anúncio e o que você informou continuam aqui.</Corpo>
            </CaixaCreme>
          ) : null}

          <AbasDoDossie atual={aba} aoEscolher={escolherAba} />

          <View
            role="tabpanel"
            nativeID={ID_DO_PAINEL}
            tabIndex={0}
            {...PAINEL_DA_ABA(aba)}
            accessibilityLabel={aba === "destaques" ? "Destaques" : aba === "entorno" ? "Entorno" : "Edifício"}
            onLayout={(e) => (posicoes.current.painel = e.nativeEvent.layout.y)}
            style={{
              paddingVertical: RECUO_DO_PAINEL,
              paddingHorizontal: 18,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: comAlfa(cor("cor-texto"), 0.08),
              backgroundColor: cor("cor-superficie"),
            }}
          >
            {aba === "destaques" ? (
              <Destaques
                visao={visao}
                coberto={coberto}
                vinculoConfirmado={vinculoConfirmado}
                aoAbrirFonte={abrirFonte}
                aoVerComposicao={verComposicao}
                aoVerObras={() => irPara("entorno", "obras")}
                aoConfirmarPredio={confirmarPredio}
                aoVerVerificacoes={() => irPara("edificio", "verificacoes")}
              />
            ) : aba === "entorno" ? (
              <Entorno
                visao={visao}
                edificio={predio}
                contexto={cadastro.contexto}
                nomeDoBairro={nomeDoBairro}
                coberto={coberto}
                vinculoConfirmado={vinculoConfirmado}
                aoAbrirFonte={abrirFonte}
                aoAbrirMapa={() => setGaveta({ tipo: "mapa" })}
                aoConfirmarPredio={confirmarPredio}
                aoMedirSecao={medirSecao}
              />
            ) : (
              <EdificioDoDossie
                visao={visao}
                edificio={predio}
                coberto={coberto}
                vinculoConfirmado={vinculoConfirmado}
                prioridade={prioridade}
                aoMudarPrioridade={setPrioridade}
                aoAbrirPergunta={(pergunta) => setGaveta({ tipo: "pergunta", pergunta })}
                aoAbrirRoteiro={() => setGaveta({ tipo: "roteiro" })}
                aoAbrirFonte={abrirFonte}
                aoAbrirCadastro={() => setGaveta({ tipo: "cadastro" })}
                aoConfirmarPredio={confirmarPredio}
                aoMedirSecao={medirSecao}
              />
            )}
          </View>

          {/* `.ds-after-panel`: a ação principal e os dois links. */}
          <View style={styles.depoisDoPainel}>
            <Botao rotulo="Preparar visita" variante="principal" seta onPress={() => void prepararVisita()} />
            <View style={styles.acoes}>
              <LinkComSeta rotulo="Comparar imóveis" onPress={() => router.push("/comparar")} discreto seta={false} />
              {analise.descarte ? (
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 16 }}>
                  Análise descartada
                </Texto>
              ) : (
                <LinkComSeta rotulo="Descartar" onPress={() => setGaveta({ tipo: "descarte" })} discreto seta={false} />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <GavetaDeFonte
        visivel={gavetaDeFonte !== null}
        aoFechar={fecharFonte}
        fonte={gavetaDeFonte?.fonte ?? null}
        confianca={gavetaDeFonte?.confianca ?? null}
        dado={gavetaDeFonte?.dado ?? null}
      />
      <GavetaDoAnuncio visivel={gaveta?.tipo === "anuncio"} aoFechar={fechar} analise={analise} />
      <GavetaDoCadastro visivel={gaveta?.tipo === "cadastro"} aoFechar={fechar} visao={visao} aoAbrirFonte={abrirFonteDoCadastro} />
      <GavetaDoMapa visivel={gaveta?.tipo === "mapa"} aoFechar={fechar} predio={predio} visao={visao} vizinhos={cadastro.vizinhos} />
      <GavetaDoRoteiro
        visivel={gaveta?.tipo === "roteiro"}
        aoFechar={fechar}
        perguntas={visao.perguntas}
        aoAbrirPergunta={(pergunta) => setGaveta({ tipo: "pergunta", pergunta })}
        aoPrepararVisita={() => void prepararVisita()}
      />
      <GavetaDaPergunta visivel={perguntaAberta !== null} aoFechar={fechar} pergunta={perguntaAberta} aoLevarParaVisita={() => void prepararVisita()} />
      <GavetaDeDescarte
        analiseId={analise.id}
        visivel={gaveta?.tipo === "descarte"}
        aoFechar={fechar}
        aoDescartar={() => router.replace("/")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: ESPACO[4] },
  conteiner: { flex: 1, padding: ESPACO[4], justifyContent: "center", alignItems: "center" },
  cartao: { width: "100%", maxWidth: 480, marginHorizontal: 0 },
  rolagem: { padding: ESPACO[4], paddingBottom: 48 },
  // `#dossierContainer { max-width: 780px; margin-inline: auto }`
  coluna: { width: "100%", maxWidth: 780, alignSelf: "center" },
  depoisDoPainel: { marginTop: 18, paddingHorizontal: 3, gap: ESPACO[2] },
  acoes: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: ESPACO[3] },
});
