// Aba Visita (Fatia 5). Referência: index.html, renderLiveVisit 5902–5921, CSS .vx-* (3045) e .vv-* (3129),
// painel de campo .field-dark-panel (2625). Preparar: o roteiro de perguntas do dossiê, a mensagem ao corretor.
// No imóvel: cronômetro, roteiro conferível, luz, ruído e notas. Tudo grava em `analise.visita` neste aparelho;
// o Vereda não envia nada a ninguém.
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Botao } from "../../componentes/Botao";
import { ProvedorDeAviso, useAviso } from "../../componentes/casca/Aviso";
import { Coluna } from "../../componentes/casca/Coluna";
import { Texto } from "../../componentes/Texto";
import { Chamada, Etapas, LinkDeAcao, Superficie } from "../../componentes/visita-v1/blocos";
import { CartaoDoImovel } from "../../componentes/visita-v1/CartaoDoImovel";
import {
  GavetaDeMensagem,
  GavetaDeNovaPergunta,
  GavetaDeResposta,
  GavetaDeTroca,
  GavetaDoRoteiro,
} from "../../componentes/visita-v1/Gavetas";
import { perguntasDaVisita, predioDaAnalise, resumirVisita } from "../../componentes/visita-v1/logica";
import { PainelDeCampo } from "../../componentes/visita-v1/NoImovel";
import { Preparar } from "../../componentes/visita-v1/Preparar";
import { Resumo } from "../../componentes/visita-v1/Resumo";
import { useVisita } from "../../componentes/visita-v1/useVisita";
import { mensagemParaCorretor } from "../../dados/mensagem";
import { useAnalises } from "../../estado/Analises";
import { useTema } from "../../tema/Tema";
import { ESPACO } from "../../tema/tokens";

type Aba = "preparar" | "campo" | "resumo";

type GavetaAberta =
  | { tipo: "troca" }
  | { tipo: "roteiro" }
  | { tipo: "pergunta"; id: string }
  | { tipo: "nova" }
  | { tipo: "mensagem" }
  | null;

const TEXTOS: Record<Aba, { chamada: string; titulo: string; apoio: string }> = {
  preparar: { chamada: "Sua próxima visita", titulo: "Prepare sua visita.", apoio: "As perguntas certas, antes de sair de casa." },
  campo: { chamada: "Durante a visita", titulo: "Olhe de perto.", apoio: "Confira o que importa para a sua decisão." },
  resumo: { chamada: "Seu registro", titulo: "Sua visita, registrada.", apoio: "O que você descobriu fica aqui." },
};

export default function TelaVisita() {
  const { cor } = useTema();
  // O aviso (toast) vive dentro da tela: "Mensagem copiada" aparece sobre o conteúdo da aba.
  return (
    <View style={{ flex: 1, backgroundColor: cor("cor-fundo") }}>
      <ProvedorDeAviso>
        <ConteudoDaVisita />
      </ProvedorDeAviso>
    </View>
  );
}

/** `.vx-head`: chamada, título em Fraunces 34 e linha de apoio. */
function Cabecalho({ aba }: { aba: Aba }) {
  const t = TEXTOS[aba];
  return (
    <View style={{ paddingTop: 5, paddingHorizontal: 3, paddingBottom: 18 }}>
      <Texto
        tipo="titulo-tela"
        role="heading"
        style={{ fontSize: 34, lineHeight: 38, fontWeight: "500", letterSpacing: -1.53, maxWidth: 330 }}
      >
        {t.titulo}
      </Texto>
      <Texto cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 21, marginTop: 10 }}>
        {t.apoio}
      </Texto>
    </View>
  );
}

function ConteudoDaVisita() {
  const { lista, analiseAtiva, pronto, erro, definirAtiva, salvar } = useAnalises();
  const { mostrarAviso } = useAviso();

  const naoDescartadas = useMemo(() => lista.filter((a) => a.descarte === null), [lista]);
  const analise = analiseAtiva !== null && analiseAtiva.descarte === null ? analiseAtiva : null;
  const controle = useVisita({ analise, salvar, aoFalhar: mostrarAviso });

  const [aba, definirAba] = useState<Aba>("preparar");
  const [gaveta, definirGaveta] = useState<GavetaAberta>(null);
  const [rascunhoDaMensagem, definirRascunhoDaMensagem] = useState<{ id: string; texto: string } | null>(null);
  const rolagem = useRef<ScrollView>(null);

  // Outro imóvel: a tela volta a "Preparar" e fecha o que estava aberto.
  const idDaAnalise = analise?.id ?? null;
  const [idVisto, definirIdVisto] = useState(idDaAnalise);
  if (idVisto !== idDaAnalise) {
    definirIdVisto(idDaAnalise);
    definirAba("preparar");
    definirGaveta(null);
    definirRascunhoDaMensagem(null);
  }

  const visita = controle.visita;
  const proprias = visita?.perguntasProprias;
  const perguntas = useMemo(() => {
    if (!analise || !proprias) return [];
    return perguntasDaVisita({ ...analise, visita: { ...analise.visita, perguntasProprias: proprias } }, lista, new Date());
  }, [analise, proprias, lista]);
  const predio = useMemo(() => (analise ? predioDaAnalise(analise) : null), [analise]);

  const analiseLocal = useMemo(() => (analise && visita ? { ...analise, visita } : null), [analise, visita]);
  const mensagemSugerida = useMemo(
    () => (analiseLocal ? mensagemParaCorretor(analiseLocal, perguntas) : ""),
    [analiseLocal, perguntas],
  );
  const textoDaMensagem = rascunhoDaMensagem !== null && rascunhoDaMensagem.id === idDaAnalise ? rascunhoDaMensagem.texto : mensagemSugerida;

  const concluida = Boolean(visita?.concluidaEm);
  const abaAtual: Aba = aba === "resumo" && !concluida ? "preparar" : aba;

  const irParaOTopo = () => rolagem.current?.scrollTo({ y: 0, animated: false });

  const comecarVisita = () => {
    controle.iniciar();
    definirAba("campo");
    irParaOTopo();
  };

  const encerrarVisita = async () => {
    const gravou = await controle.encerrar();
    if (!gravou) return;
    definirAba("resumo");
    irParaOTopo();
    mostrarAviso("Visita salva neste aparelho");
  };

  const escolherImovel = async (id: string) => {
    definirGaveta(null);
    if (id === idDaAnalise) return;
    // Primeiro grava o tempo e o que faltava do imóvel atual; só então o outro passa a ser o ativo.
    await controle.pausarEGravar();
    await definirAtiva(id);
  };

  const abrirDossie = () => {
    if (analise) router.push({ pathname: "/dossie", params: { id: analise.id } });
  };

  const perguntaAberta = gaveta?.tipo === "pergunta" ? (perguntas.find((p) => p.id === gaveta.id) ?? null) : null;

  const gavetas = (
    <>
      {gaveta?.tipo === "troca" ? (
        <GavetaDeTroca analises={naoDescartadas} ativaId={idDaAnalise} aoEscolher={(id) => void escolherImovel(id)} aoFechar={() => definirGaveta(null)} />
      ) : null}
      {gaveta?.tipo === "roteiro" && visita ? (
        <GavetaDoRoteiro
          perguntas={perguntas}
          visita={visita}
          aoAbrir={(id) => definirGaveta({ tipo: "pergunta", id })}
          aoFechar={() => definirGaveta(null)}
        />
      ) : null}
      {perguntaAberta && visita ? (
        <GavetaDeResposta
          key={perguntaAberta.id}
          pergunta={perguntaAberta}
          visita={visita}
          aoSalvar={(id, texto, conferida) => {
            controle.responder(id, texto, conferida);
            mostrarAviso("Resposta salva");
          }}
          aoFechar={() => definirGaveta(null)}
        />
      ) : null}
      {gaveta?.tipo === "nova" && visita ? (
        <GavetaDeNovaPergunta
          quantasPropriasJa={visita.perguntasProprias.length}
          aoAdicionar={(texto) => {
            const coube = controle.adicionarPropria(texto);
            if (coube) mostrarAviso("Pergunta adicionada");
            return coube;
          }}
          aoFechar={() => definirGaveta(null)}
        />
      ) : null}
      {gaveta?.tipo === "mensagem" && analise ? (
        <GavetaDeMensagem
          analise={analise}
          texto={textoDaMensagem}
          editado={rascunhoDaMensagem !== null && rascunhoDaMensagem.id === idDaAnalise}
          aoEditar={(texto) => definirRascunhoDaMensagem({ id: analise.id, texto })}
          aoRestaurar={() => definirRascunhoDaMensagem(null)}
          aoFechar={() => definirGaveta(null)}
        />
      ) : null}
    </>
  );

  // ——— Sem imóvel para visitar ———————————————————————————————————————————————————

  if (!pronto) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: ESPACO[4] }}>
        <Texto cor="cor-texto-apoio">Carregando suas análises…</Texto>
      </View>
    );
  }

  if (!analise || !visita) {
    const temOutros = naoDescartadas.length > 0;
    return (
      <>
        <ScrollView contentContainerStyle={{ padding: ESPACO[4], paddingBottom: ESPACO[6] + ESPACO[4] }} keyboardShouldPersistTaps="handled">
          <Coluna>
            <View style={{ marginBottom: 4, marginHorizontal: 2 }}>
              <Chamada>Sua próxima visita</Chamada>
            </View>
            <Cabecalho aba="preparar" />
            {erro ? (
              <Texto role="alert" cor="cor-barro-texto" style={{ fontSize: 13, lineHeight: 20, marginBottom: ESPACO[3] }}>
                {erro}
              </Texto>
            ) : null}
            <Superficie style={{ gap: ESPACO[4] }}>
              <Texto cor="cor-texto-apoio" style={{ fontSize: 14, lineHeight: 22 }}>
                {temOutros ? "Escolha o imóvel que você vai visitar." : "Nenhum dossiê aberto. Cole um link em Explorar."}
              </Texto>
              {temOutros ? (
                <Botao rotulo="Escolher imóvel" variante="principal" seta onPress={() => definirGaveta({ tipo: "troca" })} />
              ) : null}
              <Botao
                rotulo="Ir para Explorar"
                variante={temOutros ? "secundario" : "principal"}
                seta={!temOutros}
                onPress={() => router.push("/")}
              />
            </Superficie>
          </Coluna>
        </ScrollView>
        {gavetas}
      </>
    );
  }

  // ——— Visita ——————————————————————————————————————————————————————————————————

  const etapas = [
    { valor: "preparar" as const, rotulo: "Preparar" },
    { valor: "campo" as const, rotulo: "No imóvel" },
    ...(concluida ? [{ valor: "resumo" as const, rotulo: "Resumo" }] : []),
  ];

  return (
    <>
      <ScrollView ref={rolagem} contentContainerStyle={{ padding: ESPACO[4], paddingBottom: ESPACO[6] + ESPACO[4] }} keyboardShouldPersistTaps="handled">
        <Coluna>
          {erro ? (
            <Texto role="alert" cor="cor-barro-texto" style={{ fontSize: 13, lineHeight: 20, marginBottom: ESPACO[3] }}>
              {erro}
            </Texto>
          ) : null}

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: ESPACO[3], marginHorizontal: 2, marginBottom: 4 }}>
            <Chamada>{TEXTOS[abaAtual].chamada}</Chamada>
            <LinkDeAcao rotulo="Ver dossiê" onPress={abrirDossie} />
          </View>
          <Cabecalho aba={abaAtual} />
          <CartaoDoImovel analise={analise} predio={predio} aoTrocar={() => definirGaveta({ tipo: "troca" })} />
          <Etapas etapas={etapas} atual={abaAtual} aoEscolher={definirAba} rotulo="Etapas da visita" />

          <View key={analise.id}>
            {abaAtual === "preparar" ? (
              <Preparar
                perguntas={perguntas}
                visita={visita}
                aoAbrirPergunta={(id) => definirGaveta({ tipo: "pergunta", id })}
                aoVerRoteiro={() => definirGaveta({ tipo: "roteiro" })}
                aoAdicionarPergunta={() => definirGaveta({ tipo: "nova" })}
                aoPrepararMensagem={() => definirGaveta({ tipo: "mensagem" })}
              />
            ) : null}
            {abaAtual === "campo" ? (
              <PainelDeCampo
                perguntas={perguntas}
                controle={controle}
                aoAbrirPergunta={(id) => definirGaveta({ tipo: "pergunta", id })}
                aoAdicionarPergunta={() => definirGaveta({ tipo: "nova" })}
              />
            ) : null}
            {abaAtual === "resumo" ? (
              <Resumo resumo={resumirVisita(visita, perguntas)} aoReverRespostas={() => definirAba("campo")} />
            ) : null}
          </View>

          <View style={{ marginTop: 18 }}>
            {abaAtual === "preparar" ? <Botao rotulo="Começar visita" variante="principal" seta onPress={comecarVisita} /> : null}
            {abaAtual === "campo" ? (
              <Botao rotulo="Salvar e encerrar visita" variante="principal" seta onPress={() => void encerrarVisita()} />
            ) : null}
            {abaAtual === "resumo" ? (
              <Botao rotulo="Comparar minhas opções" variante="principal" seta onPress={() => router.push("/comparar")} />
            ) : null}
            {abaAtual !== "resumo" && concluida ? <LinkDeAcao rotulo="Ver último resumo" onPress={() => definirAba("resumo")} /> : null}
          </View>
        </Coluna>
      </ScrollView>
      {gavetas}
    </>
  );
}
