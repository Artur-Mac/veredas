// Comparar (T5). Referência: `renderCompare`, index.html 5964–5989; CSS `.vx-*` e `.vc-*` a partir da linha 3045.
// Duas análises não descartadas da mesma modalidade, lado a lado: Custo, Espaço e Entorno. Custos só por
// `custoMensal`; o Entorno vem do índice cadastral quando o prédio está confirmado. No topo, o resumo da decisão (VE01):
// quem visitar primeiro segundo a prioridade escolhida, até três diferenças e a pergunta que pode mudar a escolha.
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { CartaoDoImovel } from "../../componentes/comparar/CartaoDoImovel";
import {
  comparar,
  detalheDoImovel,
  elegiveis,
  escolherPar,
  modalidadeInicial,
  trocarNoSlot,
  type Par,
  type Topico,
} from "../../componentes/comparar/comparar";
import { GavetaDeEscolha, type OpcaoDeEscolha } from "../../componentes/comparar/GavetaDeEscolha";
import { poligonoDoEdificio } from "../../componentes/comparar/lote";
import { confirmarPredio, editarAnalise, useAbrirAnalise, usePrepararVisita } from "../../componentes/comparar/navegacao";
import { PainelDeCusto, PainelDeEntorno, PainelDeEspaco } from "../../componentes/comparar/Paineis";
import { PainelDeRotina } from "../../componentes/comparar/Rotina";
import { PlacarDoPar } from "../../componentes/comparar/Placar";
import { placarDoPar } from "../../componentes/comparar/placarDoPar";
import { extrasDoPar } from "../../componentes/comparar/extras";
import { CompartilharSala } from "../../componentes/comparar/Sala";
import { arquivoDaProcura } from "../../dados/recife/procura";
import { indicadoresDoPredio, type Indicador } from "../../dados/dossie/indicadores";
import { chuvaDoBairro } from "../../dados/recife/chuva";
import { edificiosDoBairro, indiceDoBairro } from "../../dados/recife/indice";
import { noiteDoBairro } from "../../dados/recife/noite";
import { useEdificios } from "../../componentes/comparar/useEdificios";
import { EsperaDasCamadas } from "../../componentes/EsperaDasCamadas";
import { camadasDaRotina, camadasDasAnalises } from "../../dados/camadasDasTelas";
import { ResumoDaDecisao } from "../../componentes/comparar/Decisao";
import { adicionarPropria } from "../../componentes/visita-v1/logica";
import { projetarDecisao, type PrioridadeDaDecisao } from "../../dados/decisao";
import { aplicarResposta, efeitoDaResposta } from "../../dados/resposta";
import { essenciaisDoBairro, essenciaisDoPredio } from "../../dados/recife/essenciais";
import { BotaoVx, CabecalhoVx, LinkVx, MARGEM_DA_PAGINA_VX, PaginaVx, SegmentosVx, SuperficieVx, VazioVx } from "../../componentes/comparar/vx";
import { Texto } from "../../componentes/Texto";
import type { AnaliseV2, Edificio, Modalidade } from "../../dados/contratos";
import { derivarCustoPorPartes } from "../../dados/custoPorPartes";
import { bairroPorSlug, eCoberto } from "../../dados/recife/bairros";
import { useAnalises } from "../../estado/Analises";
import { usePerfilDomicilio } from "../../estado/PerfilDomicilio";
import { useTema } from "../../tema/Tema";
import { ComparacaoDeTres } from "../../componentes/comparar/Tres";
import { PrioridadesPessoais } from "../../componentes/comparar/Prioridades";
import { ComparaveisPessoais } from "../../componentes/comparar/ComparaveisPessoais";

const MODALIDADES: readonly { valor: Modalidade; rotulo: string }[] = [
  { valor: "aluguel", rotulo: "Alugar" },
  { valor: "compra", rotulo: "Comprar" },
];

const TOPICOS: readonly { valor: Topico; rotulo: string }[] = [
  { valor: "custo", rotulo: "Custo" },
  { valor: "espaco", rotulo: "Espaço" },
  { valor: "entorno", rotulo: "Entorno" },
  { valor: "rotina", rotulo: "Rotina" },
];

/** O bairro tem cadastro e o prédio ainda não foi confirmado. */
function faltaConfirmar(a: AnaliseV2): boolean {
  return eCoberto(a.bairro) && a.vinculo.estado !== "confirmado";
}

/** D036: o Comparar lê o índice e o dia a dia a pé de cada bairro do caderno, fora do bundle; espera por eles. */
export default function Comparar() {
  const { lista } = useAnalises();
  const { perfil } = usePerfilDomicilio();
  const { cor } = useTema();
  // 15/11/2026: com destino no perfil, o placar lê a ida das 7h por rua ("Onde mais procurar").
  const caminhos = perfil.destinoBairro ? [...camadasDasAnalises(lista), arquivoDaProcura()] : camadasDasAnalises(lista);
  return (
    <View style={{ flex: 1, backgroundColor: cor("cor-fundo") }}>
      <EsperaDasCamadas caminhos={caminhos} carregando="Carregando os dados dos seus imóveis…" oQue="os dados dos bairros dos seus imóveis">
        <CompararComDados />
      </EsperaDasCamadas>
    </View>
  );
}

function CompararComDados() {
  const { cor } = useTema();
  const { lista, pronto, erro, atualizar } = useAnalises();
  const { perfil: perfilDomicilio } = usePerfilDomicilio();
  const abrirAnalise = useAbrirAnalise();
  const prepararVisita = usePrepararVisita();
  const { ids: idsDoLink, id: idDoLink } = useLocalSearchParams<{ ids?: string; id?: string }>();

  // Análises pedidas pelo link (`?ids=a,b` ou `?id=a`): valem só no começo, até a pessoa mexer nas escolhas.
  const doLink = useMemo(() => [...(idsDoLink?.split(",") ?? []), ...(idDoLink ? [idDoLink] : [])].filter(Boolean), [idsDoLink, idDoLink]);
  const [modalidadeEscolhida, setModalidadeEscolhida] = useState<Modalidade | null>(null);
  const [idsEscolhidos, setIdsEscolhidos] = useState<string[] | null>(null);
  const [topico, setTopico] = useState<Topico>("custo");
  const [trocando, setTrocando] = useState<0 | 1 | null>(null);
  const [escolhendoVisita, setEscolhendoVisita] = useState(false);
  const [terceiroId, setTerceiroId] = useState<string | null>(null);
  const [tresAberto, setTresAberto] = useState(false);
  const [prioridade, setPrioridade] = useState<PrioridadeDaDecisao>("custo");
  // VE15: a frase do efeito da resposta, presa ao par (gravar a análise remonta o resumo; outro par não a herda).
  const [efeitoDaUltimaResposta, setEfeitoDaUltimaResposta] = useState<{ par: string; texto: string } | null>(null);

  // Um link novo (`?id=` ou `?ids=`) vale mais que as escolhas antigas, mesmo com a aba já aberta antes.
  const chaveDoLink = doLink.join(",");
  const [linkVisto, setLinkVisto] = useState(chaveDoLink);
  if (chaveDoLink !== linkVisto) {
    setLinkVisto(chaveDoLink);
    setIdsEscolhidos(null);
    setModalidadeEscolhida(null);
  }

  const preferidas = idsEscolhidos ?? doLink;
  const modalidade = modalidadeEscolhida ?? modalidadeInicial(lista, preferidas);
  const ids = useMemo(() => escolherPar(lista, modalidade, preferidas), [lista, modalidade, preferidas]);
  const analises = ids.map((id) => lista.find((a) => a.id === id)).filter((a): a is AnaliseV2 => a !== undefined);
  const a = analises.length === 2 ? (analises[0] as AnaliseV2) : null;
  const b = analises.length === 2 ? (analises[1] as AnaliseV2) : null;
  const par: Par<AnaliseV2> | null = a && b ? [a, b] : null;

  const doIndice = useEdificios(a && b ? [a, b] : []);
  const ea = (a && doIndice?.get(a.id)) || null;
  const eb = (b && doIndice?.get(b.id)) || null;
  const comparacao = a && b ? comparar(a, b, [ea, eb]) : null;
  // 15/11/2026: o placar por seção usa os mesmos indicadores do dossiê (comparados com o bairro de cada prédio).
  const indicadoresDe = (e: Edificio | null): Indicador[] | null => {
    if (!e) return null;
    try {
      return indicadoresDoPredio({ nomeDoBairro: bairroPorSlug(e.bairro)?.nome ?? e.bairro, predio: e, edificiosDoBairro: edificiosDoBairro(e.bairro), essenciais: essenciaisDoBairro(e.bairro), noite: noiteDoBairro(e.bairro), chuva: chuvaDoBairro(e.bairro), ruaDoBairro: indiceDoBairro(e.bairro).rua ?? null });
    } catch {
      return null;
    }
  };
  const placar = comparacao && a && b ? placarDoPar(comparacao, [indicadoresDe(ea), indicadoresDe(eb)], extrasDoPar([a, b], [ea, eb], perfilDomicilio)) : [];
  const decisao = a && b && comparacao
    ? projetarDecisao(a, b, [ea, eb], comparacao.rotulos, prioridade, [
        ea ? essenciaisDoPredio(ea.bairro, ea.id)?.predio ?? null : null,
        eb ? essenciaisDoPredio(eb.bairro, eb.id)?.predio ?? null : null,
      ])
    : null;
  const partesDoPar: Par<ReturnType<typeof derivarCustoPorPartes>> | null = a && b
    ? [derivarCustoPorPartes(a, ea, perfilDomicilio), derivarCustoPorPartes(b, eb, perfilDomicilio)] : null;

  const naModalidade = elegiveis(lista, modalidade);
  const modoTres = tresAberto && naModalidade.some(a => a.id === terceiroId && !ids.includes(a.id));
  const outraModalidade: Modalidade = modalidade === "aluguel" ? "compra" : "aluguel";
  const nasDuasModalidadesTemPar = elegiveis(lista, outraModalidade).length >= 2;

  const mudarModalidade = (m: Modalidade) => {
    setModalidadeEscolhida(m);
    setIdsEscolhidos([]);
  };

  const opcoesDoSlot = (slot: 0 | 1): OpcaoDeEscolha[] =>
    naModalidade.map((a) => ({ id: a.id, titulo: a.nome, detalhe: detalheDoImovel(a), marcada: ids[slot] === a.id }));

  const opcoesDeVisita: OpcaoDeEscolha[] = analises.map((a) => ({ id: a.id, titulo: a.nome, detalhe: detalheDoImovel(a), marcada: false }));

  return (
    <View style={{ flex: 1, backgroundColor: cor("cor-fundo") }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: MARGEM_DA_PAGINA_VX, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <PaginaVx>
          <CabecalhoVx
            sobretitulo="Lado a lado"
            link={{ rotulo: "Meus salvos", onPress: () => router.push("/salvos") }}
            titulo="Compare suas opções."
            texto="Veja o que muda na sua escolha."
          />

          <SegmentosVx opcoes={MODALIDADES} valor={modalidade} aoMudar={mudarModalidade} rotulo="Modalidade dos imóveis" modo="grupo" margemInferior={0} />

          {!pronto ? (
            <SuperficieVx style={{ marginTop: 17 }}>
              <Texto role="status" cor="cor-texto-apoio">
                Abrindo suas análises…
              </Texto>
            </SuperficieVx>
          ) : erro ? (
            <SuperficieVx style={{ marginTop: 17 }}>
              <Texto role="alert" cor="cor-barro-texto">
                {erro}
              </Texto>
            </SuperficieVx>
          ) : par && comparacao ? (
            <View style={{ marginTop: 17 }}>
              {!modoTres ? <>
              {decisao?.estado === "pronta" ? (
                <View style={{ marginTop: -17, marginBottom: 16 }}>
                  <ResumoDaDecisao
                    projecao={decisao}
                    aoMudarPrioridade={(v) => {
                      setEfeitoDaUltimaResposta(null);
                      setPrioridade(v);
                    }}
                    efeito={efeitoDaUltimaResposta?.par === `${par[0].id}|${par[1].id}` ? efeitoDaUltimaResposta.texto : null}
                    aoLevarParaVisita={async (alvo, texto) => {
                      let coube = false;
                      await atualizar(par[alvo].id, (x) => {
                        const visita = adicionarPropria(x.visita, texto);
                        if (!visita) return x;
                        coube = true;
                        return { ...x, visita };
                      });
                      return coube;
                    }}
                    aoPrepararVisita={(alvo) => void prepararVisita(par[alvo].id)}
                    aoResponder={async (alvo, campo, valor, periodo) => {
                      // Refaz a projeção com o valor antes de gravar, para dizer se a ordem mudou.
                      const em = new Date().toISOString();
                      const nova = aplicarResposta(par[alvo], campo, valor, periodo, em);
                      if (!nova) return null;
                      const novoPar: [AnaliseV2, AnaliseV2] = alvo === 0 ? [nova, par[1]] : [par[0], nova];
                      const depois = projetarDecisao(novoPar[0], novoPar[1], [ea, eb], comparacao.rotulos, prioridade, [
                        ea ? essenciaisDoPredio(ea.bairro, ea.id)?.predio ?? null : null,
                        eb ? essenciaisDoPredio(eb.bairro, eb.id)?.predio ?? null : null,
                      ]);
                      await atualizar(par[alvo].id, (x) => aplicarResposta(x, campo, valor, periodo, em) ?? x);
                      const frase = efeitoDaResposta(decisao, depois);
                      setEfeitoDaUltimaResposta({ par: `${par[0].id}|${par[1].id}`, texto: frase });
                      return frase;
                    }}
                  />
                </View>
              ) : null}
              <View style={{ flexDirection: "row", gap: 12 }}>
                {([0, 1] as const).map((i) => {
                  const edificio = i === 0 ? ea : eb;
                  return (
                    <CartaoDoImovel
                      key={par[i].id}
                      indice={i}
                      analise={par[i]}
                      poligono={edificio ? poligonoDoEdificio(edificio) : null}
                      resumo={comparacao.resumos[i]}
                      aoTrocar={() => setTrocando(i)}
                      aoVerDossie={() => void abrirAnalise(par[i])}
                    />
                  );
                })}
              </View>

              {placar.length ? (
                <View style={{ marginTop: 16 }}>
                  <PlacarDoPar linhas={placar} rotulos={comparacao.rotulos} aoAbrir={setTopico} />
                </View>
              ) : null}
              <View style={{ marginTop: 16 }}>
                <SegmentosVx opcoes={TOPICOS} valor={topico} aoMudar={setTopico} rotulo="O que comparar" modo="abas" margemInferior={12} />
                <View role="tabpanel" aria-label={TOPICOS.find((t) => t.valor === topico)?.rotulo}>
                  {topico === "custo" ? (
                    <PainelDeCusto
                      custo={comparacao.custo}
                      rotulos={comparacao.rotulos}
                      aoAjustar={(i) => editarAnalise(par[i].id)}
                      partes={partesDoPar}
                      aoAbrirPerfilDomicilio={() => router.push("/perfil-domicilio")}
                    />
                  ) : topico === "espaco" ? (
                    <PainelDeEspaco espaco={comparacao.espaco} rotulos={comparacao.rotulos} />
                  ) : topico === "rotina" ? (
                    <EsperaDasCamadas
                      caminhos={camadasDaRotina([ea?.bairro, eb?.bairro])}
                      carregando="Calculando a rotina por horário…"
                      oQue="os horários de ônibus"
                    >
                    <PainelDeRotina
                      par={par}
                      edificios={[ea, eb]}
                      rotulos={comparacao.rotulos}
                      perfil={perfilDomicilio}
                      aoAbrirPerfilDomicilio={() => router.push("/perfil-domicilio")}
                      custos={[0, 1].map((i) => ({ mensal: comparacao.custo.colunas[i as 0 | 1].mensalConhecido, pendentes: comparacao.custo.colunas[i as 0 | 1].pendentes })) as [{ mensal: number | null; pendentes: number }, { mensal: number | null; pendentes: number }]}
                    />
                    </EsperaDasCamadas>
                  ) : (
                    <PainelDeEntorno
                      entorno={comparacao.entorno}
                      rotulos={comparacao.rotulos}
                      carregando={doIndice === null}
                      podeConfirmar={[faltaConfirmar(par[0]), faltaConfirmar(par[1])]}
                      aoConfirmar={(i) => confirmarPredio(par[i].id)}
                    />
                  )}
                </View>
              </View>

              </> : null}
              <View style={{ marginTop: 18 }}>
                <ComparacaoDeTres par={par} candidatas={naModalidade} id={terceiroId} aoEscolher={setTerceiroId} aoAlternar={setTresAberto} />
                <PrioridadesPessoais analises={modoTres ? [...par, naModalidade.find(a => a.id === terceiroId)!] : par} />
                <ComparaveisPessoais key={par[0].id} lista={lista} referencia={par[0]} />
                <CompartilharSala analises={modoTres ? [...par, naModalidade.find(a => a.id === terceiroId)!] : par} />
                <BotaoVx rotulo="Escolher para visitar" onPress={() => setEscolhendoVisita(true)} />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 17 }}>
              <VazioVx
                titulo={`Duas análises de ${modalidade} para comparar.`}
                texto={
                  naModalidade.length === 0
                    ? `Você ainda não tem análise de ${modalidade}. Cole o link de um anúncio em Explorar.`
                    : `Você tem 1 análise de ${modalidade}. Cole o link de outro anúncio em Explorar.`
                }
              >
                <BotaoVx rotulo="Explorar imóveis" onPress={() => router.push("/")} />
                {nasDuasModalidadesTemPar ? (
                  <LinkVx rotulo={`Comparar ${outraModalidade}`} onPress={() => mudarModalidade(outraModalidade)} />
                ) : null}
              </VazioVx>
            </View>
          )}
        </PaginaVx>
      </ScrollView>

      {/* As gavetas ficam fora da rolagem: ancoram na tela, não no fim do conteúdo. */}
      <GavetaDeEscolha
        visivel={trocando !== null && par !== null}
        titulo={`Escolher imóvel ${(trocando ?? 0) + 1}`}
        subtitulo={`Análises de ${modalidade} que você não descartou.`}
        opcoes={opcoesDoSlot(trocando ?? 0)}
        aoEscolher={(id) => {
          if (trocando !== null) setIdsEscolhidos(trocarNoSlot(ids, trocando, id));
          setTrocando(null);
        }}
        aoFechar={() => setTrocando(null)}
      />
      <GavetaDeEscolha
        visivel={escolhendoVisita && par !== null}
        titulo="Escolher para visitar"
        subtitulo="O roteiro da visita é feito para um imóvel por vez."
        opcoes={opcoesDeVisita}
        aoEscolher={(id) => {
          setEscolhendoVisita(false);
          void prepararVisita(id);
        }}
        aoFechar={() => setEscolhendoVisita(false)}
      />
    </View>
  );
}
