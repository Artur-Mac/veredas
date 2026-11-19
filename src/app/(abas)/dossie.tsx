import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import { Botao } from "../../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../../componentes/Cartao";
import { useAviso } from "../../componentes/casca/Aviso";
import { Coluna } from "../../componentes/casca/Coluna";
import { useFocoDeTeclado } from "../../componentes/casca/foco";
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
import { FichaViva, LinhaDoTempoEstrutural } from "../../componentes/dossie-v1/FichaViva";
import { TopoDoDossie } from "../../componentes/dossie-v1/Topo";
import { ServicosDeEntorno } from "../../componentes/caderno/Servicos";
import type { AbaDoDossie } from "../../componentes/dossie-v1/textos";
import { GavetaDeFonte, type PedidoDeFonte } from "../../componentes/fonte/GavetaDeFonte";
import { Tela } from "../../componentes/Tela";
import { Texto } from "../../componentes/Texto";
import { SolNasFachadas } from "../../componentes/dossie-v1/SolNasFachadas";
import { LadoDoBarulho } from "../../componentes/dossie-v1/Noite";
import { DesdeQueSalvou } from "../../componentes/dossie-v1/DesdeQueSalvou";
import { PrepararNegociacao } from "../../componentes/dossie-v1/Negociacao";
import { EsperaDasCamadas } from "../../componentes/EsperaDasCamadas";
import { cadernoVazio } from "../../dados/caderno";
import { adiantarCamadas } from "../../dados/camadas";
import { camadasDoBairro, camadasParaDepois } from "../../dados/camadasDasTelas";
import type { Instantaneo } from "../../dados/memoria";
import { retratoDoDossie } from "../../dados/memoriaDoDossie";
import { adicionarPropria } from "../../componentes/visita-v1/logica";
import type { RespostaDaDefesaCivil } from "../../componentes/dossie-v1/ARua";
import type { AnaliseV2, Pergunta, Prioridade } from "../../dados/contratos";
import { derivarCustoPorPartes } from "../../dados/custoPorPartes";
import { derivarDossie } from "../../dados/dossie/derivar";
import { indicadoresDoPredio, type Indicador } from "../../dados/dossie/indicadores";
import { referenciaDoCadastro } from "../../dados/iptuDoAnuncio";
import { chuvaDoBairro } from "../../dados/recife/chuva";
import { essenciaisDoBairro, type EssenciaisDoBairro } from "../../dados/recife/essenciais";
import { edificiosDoBairro, indiceDoBairro } from "../../dados/recife/indice";
import { noiteDoBairro } from "../../dados/recife/noite";
import { bairroPorSlug, eCoberto } from "../../dados/recife/bairros";
import { useAnalises } from "../../estado/Analises";
import { usePerfilDomicilio } from "../../estado/PerfilDomicilio";
import { useTema } from "../../tema/Tema";
import { ESPACO, TOQUE_MINIMO } from "../../tema/tokens";
import { traduzirIndicadoresCidadao } from "../../dados/cidadao/tradutorCidadao";
import { CartaoCidadao3Camadas } from "../../componentes/cidadao/CartaoCidadao3Camadas";
import { SimuladorTco10Anos, type EntradaTco10Anos } from "../../componentes/cidadao/SimuladorTco10Anos";
import { ResumoEvidenciaPartilhavel } from "../../componentes/cidadao/ResumoEvidenciaPartilhavel";
import { acusticaDaEstimativa } from "../../dados/ruido/ponte";
import { avaliarHidroMare1m } from "../../municipios/recife/motores/hidroMare1m";
import { avaliarResilienciaRedes } from "../../municipios/recife/motores/resilienciaRedes";
import type { PapelFachada } from "../../dados/sol/inferirFachadas";
import { escolherUnidadeAtiva, inferirFachadasDaAnalise, lerUnidade } from "../../dados/dossie/unidadeAtiva";
import { carregarEntornoSolar } from "../../dados/sol/entorno";
import { lerMicroclimaDoPonto } from "../../dados/clima/microclima";
import { PlacarHeroi5Segundos } from "../../componentes/visual/PlacarHeroi5Segundos";
import { CanvasSolSombraBrisa25D } from "../../componentes/visual/CanvasSolSombraBrisa25D";
import { TermometroConfortoTermico } from "../../componentes/visual/TermometroConfortoTermico";
import { TresPerguntasDoBolso } from "../../componentes/visual/TresPerguntasDoBolso";
import { EscalaDeRuidoHumana, RelogioDoPredio, SilencioInteligente } from "../../componentes/visual/EscalasVisuais";
import { analisarRadarVistaELote } from "../../dados/entorno/radarVistaELote";
import { RadarVistaELote } from "../../componentes/visual/RadarVistaELote";
import { CopilotoDocumentosPreSinal } from "../../componentes/visual/CopilotoDocumentosPreSinal";
import { calcularPulsoDaQuadra } from "../../dados/dossie/pulsoDaQuadra";
import { PulsoDaQuadra } from "../../componentes/visual/PulsoDaQuadra";
import { ExportarResumoExecutivo } from "../../componentes/visual/ExportarResumoExecutivo";
import { avaliarCaminhabilidadeEVidaNaRua } from "../../dados/dossie/caminhabilidadeEVidaNaRua";
import { VidaAPeNaQuadra } from "../../componentes/visual/VidaAPeNaQuadra";
import { construirLinhaUnificadaDoLote } from "../../dados/dossie/linhaUnificadaDoLote";
import { LinhaUnificadaDoLote } from "../../componentes/visual/LinhaUnificadaDoLote";

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
  const { lista, ativa, analiseAtiva, pronto, erro, definirAtiva } = useAnalises();
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
        // D036: os dados do bairro ficam fora do bundle; o dossiê só desenha com eles em memória.
        <EsperaDasCamadas
          key={analise.id}
          caminhos={camadasDoBairro(analise.bairro)}
          carregando={`Carregando os dados de ${bairroPorSlug(analise.bairro)?.nome ?? "do bairro"}…`}
          oQue={`os dados de ${bairroPorSlug(analise.bairro)?.nome ?? "deste bairro"}`}
        >
          <DossieDaAnalise analise={analise} lista={lista} />
        </EsperaDasCamadas>
      ) : (
        <EstadoVazio erro={erro} />
      )}
    </Tela>
  );
}

/** `erro` vem de `useAnalises()`: preenchido só quando o caderno não abriu (a lista vazia, então, não é escolha da pessoa). */
function EstadoVazio({ erro }: { erro: string }) {
  return (
    <View style={styles.conteiner}>
      <Coluna>
        <Cartao style={styles.cartao}>
          <CorpoDoCartao>
            <Texto tipo="secao">Dossiê</Texto>
            <Texto tipo="corpo" cor="cor-texto-apoio">
              Nenhum dossiê aberto. Cole um link em Explorar.
            </Texto>
            {erro ? (
              <Texto tipo="apoio" role="alert" cor="cor-barro-texto">
                {erro}
              </Texto>
            ) : null}
            <Botao rotulo="Ir para Explorar" variante="principal" onPress={() => router.push("/")} />
          </CorpoDoCartao>
        </Cartao>
      </Coluna>
    </View>
  );
}

function DossieDaAnalise({ analise, lista }: { analise: AnaliseV2; lista: AnaliseV2[] }) {
  const { cor } = useTema();
  const { salvar, definirAtiva, atualizar } = useAnalises();
  const { perfil: perfilDomicilio } = usePerfilDomicilio();
  const { mostrarAviso } = useAviso();
  const [aba, setAba] = useState<AbaDoDossie>("destaques");
  const [prioridade, setPrioridade] = useState<Prioridade>("custo");
  const [gaveta, setGaveta] = useState<GavetaAberta | null>(null);
  // O painel das abas entra na ordem de Tab (`tabIndex` 0, como em index.html): com o teclado, ele leva o anel de foco.
  const focoDoPainel = useFocoDeTeclado();

  const rolagem = useRef<ScrollViewInstance>(null);
  const posicoes = useRef({ coluna: 0, painel: 0 });
  const secoes = useRef<Partial<Record<SecaoDaAba, number>>>({});
  const pendente = useRef<SecaoDaAba | null>(null);

  // O índice do bairro valida no primeiro acesso e fica em memória; a leitura é uma busca em mapa.
  const cadastro = useMemo(() => carregarCadastro(analise), [analise]);
  // Com o dossiê na tela, guarda no aparelho o que a aba Edifício e o Comparar vão pedir (reabrir sem rede).
  useEffect(() => {
    const t = setTimeout(() => adiantarCamadas(camadasParaDepois(analise.bairro)), 1500);
    return () => clearTimeout(t);
  }, [analise.bairro]);
  const outras = useMemo(() => lista.filter((x) => x.id !== analise.id), [lista, analise.id]);
  const visao = useMemo(
    () => derivarDossie(analise, cadastro.edificio, cadastro.contexto, cadastro.obras, outras, new Date(), prioridade, cadastro.rua),
    [analise, cadastro, outras, prioridade],
  );

  const coberto = eCoberto(analise.bairro);
  const vinculoConfirmado = analise.vinculo.estado === "confirmado";
  const nomeDoBairro = bairroPorSlug(analise.bairro)?.nome ?? (analise.bairroTexto.trim() || "Bairro");
  const predio = visao.loteConfirmado ? cadastro.edificio : null;
  // 15/11/2026: o prédio comparado com o bairro (dia a dia a pé, noite, avenida, obras, alagamento).
  const indicadores = useMemo<Indicador[]>(() => {
    if (!predio || !analise.bairro) return [];
    try {
      return indicadoresDoPredio({ nomeDoBairro, predio, edificiosDoBairro: edificiosDoBairro(predio.bairro), essenciais: essenciaisDoBairro(analise.bairro), noite: noiteDoBairro(analise.bairro), chuva: chuvaDoBairro(analise.bairro), ruaDoBairro: indiceDoBairro(predio.bairro).rua ?? null });
    } catch {
      return [];
    }
  }, [predio, analise.bairro, nomeDoBairro]);

  const caminhabilidade = useMemo(() => {
    let ess: EssenciaisDoBairro | null = null;
    if (predio && analise.bairro) {
      try {
        ess = essenciaisDoBairro(analise.bairro);
      } catch {
        ess = null;
      }
    }
    return avaliarCaminhabilidadeEVidaNaRua({
      predio,
      essenciais: ess,
      visaoRua: visao.rua ?? null,
      nomeDoBairro,
    });
  }, [analise.bairro, nomeDoBairro, predio, visao]);

  // Pendência 1 do HANDOFF (19/11/2026): andar e fachada saem de uma função só (src/dados/dossie/unidadeAtiva.ts), a
  // mesma do Comparar e do valor inicial do simulador; o placar diz qual andar e qual fachada usou.
  const [andarEscolhido, setAndarSimulado] = useState<number | null>(null);
  const [fachadaSelecionada, setFachadaSelecionada] = useState<PapelFachada | null>(null);

  const inferenciaFachadas = useMemo(
    () => inferirFachadasDaAnalise(analise, predio, cadastro.vizinhos),
    [analise, cadastro.vizinhos, predio],
  );

  const unidade = useMemo(
    () =>
      escolherUnidadeAtiva({
        inferencia: inferenciaFachadas,
        pavimentos: predio?.pavimentos ?? null,
        andarDeclarado: analise.declarados.andar.valor,
        andarEscolhido,
        fachadaEscolhida: fachadaSelecionada,
        orientacaoBussolaGraus: analise.visita.orientacaoGraus,
        tipologia: analise.tipologia,
      }),
    [analise.declarados.andar.valor, analise.tipologia, analise.visita.orientacaoGraus, andarEscolhido, fachadaSelecionada, inferenciaFachadas, predio?.pavimentos],
  );
  const andarSimulado = unidade.andar;
  const fachadaAtiva = unidade.fachada;

  const entornoSolar = useMemo(() => {
    if (!predio) return null;
    try {
      return carregarEntornoSolar(predio);
    } catch {
      return null;
    }
  }, [predio]);

  const microclima = useMemo(() => {
    const coord =
      predio?.centro ??
      (analise.caderno?.localizacaoDaVisita
        ? ([analise.caderno.localizacaoDaVisita.longitude, analise.caderno.localizacaoDaVisita.latitude] as [number, number])
        : null);
    return lerMicroclimaDoPonto(coord, analise.bairro);
  }, [analise.bairro, analise.caderno, predio]);

  // 18/11/2026 (decisões A1 e A2): o barulho sai do modelo estimado do prédio (src/dados/ruido), no andar e na fachada
  // ativos; sem prédio ou sem camada, "sem leitura". Os cartões da frente visual recebem o resultado pela ponte.
  const { bioclimatico, ruido, conforto: confortoTermico } = useMemo(
    () => lerUnidade(predio, unidade, microclima),
    [microclima, predio, unidade],
  );
  const acustica = useMemo(
    () => acusticaDaEstimativa(ruido, { anoConstrucao: predio?.anoConstrucao ?? null, precoImovelReais: analise.declarados.preco.valor ?? null }),
    [analise.declarados.preco.valor, predio?.anoConstrucao, ruido],
  );

  const centroParaRadar = useMemo<readonly [number, number]>(() => {
    if (predio?.centro) return predio.centro;
    if (analise.caderno?.localizacaoDaVisita) {
      return [
        analise.caderno.localizacaoDaVisita.longitude,
        analise.caderno.localizacaoDaVisita.latitude,
      ];
    }
    return [-34.896, -8.121];
  }, [analise.caderno, predio]);

  const clausulaTemporadaNaConvencao = useMemo(() => {
    const docs = analise.caderno?.documentos ?? [];
    const docRelevante = docs.find(
      (d) =>
        d.vinculo !== "outro_imovel" &&
        (d.tipo === "convencao" || d.tipo === "ata") &&
        /temporada|airbnb|hospedagem/i.test(`${d.trecho} ${d.escopo}`),
    );
    return docRelevante ? docRelevante.trecho.trim() || docRelevante.escopo.trim() : null;
  }, [analise.caderno]);

  const radarVistaELote = useMemo(
    () =>
      analisarRadarVistaELote({
        centro: centroParaRadar,
        edificio: predio,
        fachadaAtiva,
        andar: andarSimulado,
        vizinhos: cadastro.vizinhos,
        obrasProximas: visao.obras,
        areaDeclaradaM2: analise.declarados.area.valor,
        clausulaTemporadaNaConvencao,
      }),
    [analise.declarados.area.valor, andarSimulado, cadastro, centroParaRadar, clausulaTemporadaNaConvencao, fachadaAtiva, predio, visao],
  );

  const hidroMare = useMemo(
    () =>
      avaliarHidroMare1m({
        handM: null,
        areaDrenadaM2: null,
        declividadeTangente: null,
      }),
    [],
  );

  const resiliencia = useMemo(
    () =>
      avaliarResilienciaRedes({
        bairroSlug: analise.bairro ?? "recife",
        unidadesCondominio: predio?.unidades ?? null,
        andar: andarSimulado,
      }),
    [analise.bairro, andarSimulado, predio?.unidades],
  );

  const partesDeCusto = useMemo(
    () => derivarCustoPorPartes(analise, predio, perfilDomicilio),
    [analise, predio, perfilDomicilio],
  );
  // Revisão de 19/11/2026: a saída mensal estimada é uma soma só para o placar, o bolso e o resumo. A luz é a "Luz
  // estimada" do custo (perfil da casa), a mesma do topo do dossiê; antes o bolso somava o gasto de ar da regra de conforto
  // e a tela mostrava dois valores de luz. A legenda diz só o que entrou.
  const saidaMensalEstimada = useMemo(() => {
    const compra = analise.modalidade === "compra";
    const itens: { rotulo: string; valor: number }[] = compra
      ? [
          { rotulo: "Parcela", valor: partesDeCusto.simulacaoCompra?.prestacaoPriceReais ?? 0 },
          { rotulo: "cond.", valor: analise.declarados.condominio.valor ?? 0 },
          { rotulo: "IPTU do cadastro", valor: Math.round((predio?.iptuAnual?.mediana ?? 0) / 12) },
        ]
      : [{ rotulo: "Mensal conhecido", valor: visao.custo.totalMensalConhecido ?? visao.custo.principal.valor ?? 0 }];
    const luz = partesDeCusto.fatiasDaRotina.find((f) => f.id === "energia")?.valorMensalReais ?? 0;
    itens.push({ rotulo: "luz", valor: luz });
    const entraram = itens.filter((i) => i.valor > 0);
    const total = Math.round(entraram.reduce((s, i) => s + i.valor, 0));
    return { total: total > 0 ? total : null, composicao: entraram.map((i) => i.rotulo), luz };
  }, [analise.declarados.condominio.valor, analise.modalidade, partesDeCusto, predio?.iptuAnual?.mediana, visao.custo.principal.valor, visao.custo.totalMensalConhecido]);

  // Revisão de 19/11/2026: entrada e ITBI de entrada numa conta só para o placar, o bolso e o resumo (antes o placar e o
  // resumo caíam em 3% do preço quando não havia cenário SFH, e o bolso em 1,8%: R$ 24 mil de diferença em R$ 2 milhões).
  const dinheiroParaEntrar = useMemo(() => {
    const preco = analise.modalidade === "compra" ? analise.declarados.preco.valor : null;
    if (!preco) return null;
    const entrada = partesDeCusto.simulacaoCompra?.entradaReais ?? Math.round(preco * 0.2);
    const itbi =
      partesDeCusto.otimizacaoFechamento?.sfhOtimizado1Pct?.itbiReais ??
      partesDeCusto.otimizacaoFechamento?.aVistaTempestivo18Pct.itbiReais ??
      Math.round(preco * 0.018);
    return { entrada, itbi, total: Math.round(entrada + itbi) };
  }, [analise.declarados.preco.valor, analise.modalidade, partesDeCusto]);

  const entradaTco10Anos = useMemo((): EntradaTco10Anos | null => {
    if (analise.modalidade !== "compra" || !analise.declarados.preco.valor) return null;
    return {
      precoCompraReais: analise.declarados.preco.valor,
      aluguelEquivalenteMensalReais: Math.round(analise.declarados.preco.valor * 0.0045),
      condominioMensalReais: analise.declarados.condominio.valor ?? 0,
      iptuAnualReais: predio?.iptuAnual?.mediana ?? 0,
      spuAnualReais: partesDeCusto.spuEstatutario?.encargoPatrimonialAnualVigenteReais ?? 0,
      economiaOtimizacaoTributariaReais:
        partesDeCusto.otimizacaoFechamento?.melhorCenarioEconomiaReais ?? 0,
      // O mesmo prazo e os mesmos juros da simulação de financiamento do custo (antes a conta de 10 anos supunha 15 anos
      // a 10,5% enquanto o topo dizia "Financiar 80% em 30 anos").
      ...(partesDeCusto.simulacaoCompra
        ? {
            entradaPct: partesDeCusto.simulacaoCompra.entradaPct,
            prazoFinanciamentoAnos: partesDeCusto.simulacaoCompra.prazoAnos,
            jurosFinanciamentoAnual: partesDeCusto.simulacaoCompra.taxaEfetivaAnualPct / 100,
          }
        : {}),
    };
  }, [analise.declarados.condominio.valor, analise.declarados.preco.valor, analise.modalidade, partesDeCusto, predio?.iptuAnual?.mediana]);

  const pulsoDaQuadra = useMemo(
    () =>
      calcularPulsoDaQuadra({
        // Sem prédio confirmado não há fachada nem vizinhos: o eixo de sol fica sem leitura.
        conforto: predio ? confortoTermico : null,
        // O eixo de sossego usa a nota do modelo de ruído estimado; sem leitura, fica fora da média.
        acustica,
        anoConstrucao: predio?.anoConstrucao ?? null,
        obrasProximas: visao.obras,
        visaoRua: visao.rua ?? null,
        vinculoConfirmado,
        precoInformado: analise.declarados.preco.valor !== null,
        condominioInformado: analise.declarados.condominio.valor !== null,
        // O IPTU conta como conhecido com o valor do anúncio ou com a referência do cadastro do prédio (a mesma que entra
        // na saída estimada do placar); antes o pulso dizia "falta IPTU" ao lado dela.
        iptuConhecido: analise.declarados.iptu.valor !== null || (predio?.iptuAnual?.mediana ?? 0) > 0,
        spuAtivo: Boolean(partesDeCusto.alertaMarinha),
        caminhabilidade,
      }),
    [
      acustica,
      analise.declarados.condominio.valor,
      analise.declarados.iptu.valor,
      analise.declarados.preco.valor,
      caminhabilidade,
      confortoTermico,
      partesDeCusto,
      predio,
      vinculoConfirmado,
      visao,
    ],
  );

  const linhaUnificada = useMemo(
    () =>
      construirLinhaUnificadaDoLote({
        edificio: predio,
        obrasProximas: visao.obras,
        visaoRua: visao.rua ?? null,
        spuAtivo: Boolean(partesDeCusto.alertaMarinha),
      }),
    [partesDeCusto, predio, visao],
  );

  const cartoesCidadao = useMemo(
    () =>
      traduzirIndicadoresCidadao({
        modalidade: analise.modalidade,
        dsqfl: predio?.dsqfl ?? null,
        cnm16: null,
        custoPorPartes: partesDeCusto,
        bioclimatico,
        acustica,
        hidroMare,
        resiliencia,
      }),
    [analise.modalidade, predio, partesDeCusto, bioclimatico, acustica, hidroMare, resiliencia],
  );
  const [mostrarPainelCidadao, setMostrarPainelCidadao] = useState(false);

  const itensSilencio = useMemo(() => {
    const listaOk: { rotulo: string; detalhe?: string }[] = [];
    if (vinculoConfirmado) listaOk.push({ rotulo: "Prédio confirmado no cadastro do Recife", detalhe: predio?.nome ?? undefined });
    if (predio?.iptuAnual) listaOk.push({ rotulo: "Referência oficial de IPTU localizada no edifício" });
    if (acustica?.atendeReferenciaNoturnaNbr10151) listaOk.push({ rotulo: "Ruído noturno estimado dentro da referência da norma técnica" });
    if (!partesDeCusto.alertaMarinha) listaOk.push({ rotulo: "Fora da área típica de Terreno de Marinha" });
    return listaOk;
  }, [acustica?.atendeReferenciaNoturnaNbr10151, partesDeCusto.alertaMarinha, predio?.iptuAnual, predio?.nome, vinculoConfirmado]);

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
  );  const investigar = useCallback((id: Indicador["id"]) => {
    irPara("entorno", id === "obras" ? "obras" : id === "barulho" || id === "noite" ? "rua" : "leitura");
  }, [irPara]);


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
  const abrirPerfilDomicilio = useCallback(() => router.push("/perfil-domicilio"), []);

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

  // VE07: leva uma conferência (ex.: o sol num lado do prédio) para o roteiro da visita desta análise.
  const levarParaVisita = useCallback(
    async (texto: string) => {
      const visita = adicionarPropria(analise.visita, texto);
      if (!visita) return false;
      try {
        await salvar({ ...analise, visita, atualizadaEm: new Date().toISOString() });
        return true;
      } catch {
        mostrarAviso("Não foi possível salvar. Tente de novo.");
        return false;
      }
    },
    [analise, salvar, mostrarAviso],
  );

  // v1.1: a Defesa Civil não publica o número do imóvel; a resposta da pessoa fica na análise (null desfaz).
  const responderDefesaCivil = useCallback(
    async (resposta: RespostaDaDefesaCivil) => {
      const agora = new Date().toISOString();
      try {
        await salvar({
          ...analise,
          confirmacoesDaRua: { ...analise.confirmacoesDaRua, defesaCivil: resposta ? { resposta, em: agora } : null },
          atualizadaEm: agora,
        });
        mostrarAviso(resposta === null ? "Resposta desfeita" : "Resposta guardada no caderno");
      } catch {
        mostrarAviso("Não foi possível salvar. Tente de novo.");
      }
    },
    [analise, salvar, mostrarAviso],
  );

  const alternarSalvo = useCallback(async () => {
    try {
      const em = new Date().toISOString();
      // VE09: salvar é uma ação deliberada; se ainda não há retrato, guarda o que o dossiê mostra agora. `atualizar`
      // edita a análise guardada (o `salvar` preserva o caderno existente de propósito).
      await atualizar(analise.id, (a) => ({
        ...a, salva: !a.salva, atualizadaEm: em,
        ...(!a.salva && !a.caderno?.memoria ? { caderno: { ...(a.caderno ?? cadernoVazio()), memoria: retratoDoDossie(a, predio, em) } } : {}),
      }));
      mostrarAviso(analise.salva ? "Removido dos salvos" : "Salvo no caderno");
    } catch {
      mostrarAviso("Não foi possível salvar. Tente de novo.");
    }
  }, [analise, atualizar, mostrarAviso, predio]);

  const guardarRetrato = useCallback(async (retrato: Instantaneo) => {
    try {
      await atualizar(analise.id, (a) => ({ ...a, atualizadaEm: retrato.em, caderno: { ...(a.caderno ?? cadernoVazio()), memoria: retrato } }));
      mostrarAviso("Guardado como visto hoje");
    } catch {
      mostrarAviso("Não foi possível salvar. Tente de novo.");
    }
  }, [analise.id, atualizar, mostrarAviso]);

  const gavetaDeFonte = gaveta?.tipo === "fonte" ? gaveta.pedido : null;
  const perguntaAberta = gaveta?.tipo === "pergunta" ? gaveta.pergunta : null;

  return (
    <>
      <ScrollView ref={rolagem} contentContainerStyle={styles.rolagem} keyboardShouldPersistTaps="handled">
        <Coluna onLayout={(e) => (posicoes.current.coluna = e.nativeEvent.layout.y)}>
          {/* `.ds-overview` */}
          <View
            accessibilityLabel="Resumo do imóvel"
            style={{
              borderRadius: 18,
              borderWidth: 1,
              borderColor: cor("cor-linha-forte"),
              backgroundColor: cor("cor-superficie"),
              overflow: "hidden",
            }}
          >
            <TopoDoDossie
              predio={predio}
              fotos={analise.extracao?.fotos ?? []}
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
              comodidades={analise.extracao?.campos.comodidades ?? []}
              unidades={predio?.unidades ?? null}
              temAnuncio={Boolean(analise.url || analise.extracao)}
            />
            <BlocoDeCusto
              custo={visao.custo}
              area={visao.especificacoes.area}
              posicao={visao.posicao}
              aoAbrirPosicao={() => irPara("entorno", "preco")}
              aoAjustar={verComposicao}
              partes={partesDeCusto}
              perfilConfigurado={perfilDomicilio.configurado}
              aoAbrirPerfilDomicilio={abrirPerfilDomicilio}
              referenciaIptu={predio ? referenciaDoCadastro(predio, visao.especificacoes.area) : null}
            />
          </View>

          <PlacarHeroi5Segundos
            modalidade={analise.modalidade}
            precoPrincipalReais={visao.custo.principal.valor}
            mensalBolsoRealReais={saidaMensalEstimada.total}
            composicaoMensal={saidaMensalEstimada.composicao}
            dinheiroParaEntrarReais={dinheiroParaEntrar?.total ?? null}
            comparacaoM2Pct={visao.posicao?.deltaPercentual ?? null}
            orientacaoCurta={fachadaAtiva.orientacaoSolar}
            conforto={predio ? confortoTermico : null}
            ruidoDormitorioDb={acustica?.ruidoInternoDormitorioDbA ?? null}
            sossego={{ ...ruido.textos.placar, ficha: ruido.estado === "estimado" ? ruido.textos.ficha : null }}
            unidade={predio ? unidade.descricao : null}
            spuAtivo={Boolean(partesDeCusto.alertaMarinha)}
            aoTocarMetrica={(alvo) => {
              setAba(alvo === "predio" ? "edificio" : "destaques");
            }}
          />

          {cadastro.falhou ? (
            <CaixaCreme estilo={{ marginTop: ESPACO[3] }}>
              <Texto tipo="corpo" role="alert" style={{ fontSize: 13, lineHeight: 19, fontWeight: "600" }}>
                Não foi possível abrir o cadastro de {nomeDoBairro}.
              </Texto>
              <Corpo estilo={{ fontSize: 13, lineHeight: 19 }}>Os dados do anúncio e o que você informou continuam aqui.</Corpo>
            </CaixaCreme>
          ) : null}

          <View style={{ marginTop: 16 }} />
          <AbasDoDossie atual={aba} aoEscolher={escolherAba} />

          <View
            role="tabpanel"
            nativeID={ID_DO_PAINEL}
            tabIndex={0}
            {...PAINEL_DA_ABA(aba)}
            accessibilityLabel={aba === "destaques" ? "Destaques" : aba === "entorno" ? "Entorno" : "Edifício"}
            onLayout={(e) => (posicoes.current.painel = e.nativeEvent.layout.y)}
            onFocus={focoDoPainel.aoFocar}
            onBlur={focoDoPainel.aoDesfocar}
            style={[
              {
                paddingVertical: RECUO_DO_PAINEL,
                paddingHorizontal: 18,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: cor("cor-linha-forte"),
                backgroundColor: cor("cor-superficie"),
              },
              focoDoPainel.estilo,
            ]}
          >
            {aba === "destaques" ? <DesdeQueSalvou analise={analise} predio={predio} aoGuardarRetrato={guardarRetrato} /> : null}
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
                indicadores={indicadores}
                bairro={analise.bairro}
                predioId={predio?.id ?? null}
                aoAbrirPergunta={(pergunta) => setGaveta({ tipo: "pergunta", pergunta })}
                aoVerRotina={() => irPara("entorno", "leitura")}
                aoInvestigar={investigar}
              />
            ) : aba === "entorno" ? (
              <Entorno
                visao={visao}
                edificio={predio}
                vizinhos={cadastro.vizinhos}
                orientacaoJanelaGraus={analise.visita.orientacaoGraus}
                unidade={{ andar: unidade.andar, fachadaGraus: unidade.fachada.azimuteGraus, descricao: unidade.descricao }}
                slugBairro={analise.bairro}
                ruaDoBairro={cadastro.rua?.bairro ?? null}
                contexto={cadastro.contexto}
                nomeDoBairro={nomeDoBairro}
                coberto={coberto}
                vinculoConfirmado={vinculoConfirmado}
                aoAbrirFonte={abrirFonte}
                aoAbrirMapa={() => setGaveta({ tipo: "mapa" })}
                aoConfirmarPredio={confirmarPredio}
                aoMedirSecao={medirSecao}
                aoResponderDefesaCivil={(resposta) => void responderDefesaCivil(resposta)}
                indicadores={indicadores}
                acesso={perfilDomicilio.necessidadesDeAcesso}
                tipologia={analise.tipologia}
                analiseId={analise.id}
                centroReferencia={analise.caderno?.localizacaoDaVisita ? [analise.caderno.localizacaoDaVisita.longitude, analise.caderno.localizacaoDaVisita.latitude] : null}
              />
            ) : (
              <EdificioDoDossie
                visao={visao}
                edificio={predio}
                coberto={coberto}
                vinculoConfirmado={vinculoConfirmado}
                prioridade={prioridade}
                chaveLote14={predio?.dsqfl ?? null}
                textosDocumentos={(analise.caderno?.documentos ?? []).map((d) => `${d.titulo} ${d.escopo} ${d.trecho}`)}
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

          {/* `.ds-after-panel`: Visual Story Canvas, Conforto Termico, Bolso e Escalas antes do detalhamento. */}
          <View style={styles.depoisDoPainel}>
            {aba === "destaques" ? (
              <View style={{ gap: 12 }}>
                {/* R9 (19/11/2026): sem prédio confirmado não há ponto para desenhar; antes o volume caía num ponto fixo de
                    Boa Viagem. */}
                {predio ? (
                  <CanvasSolSombraBrisa25D
                    inferencia={inferenciaFachadas}
                    fachadaSelecionada={fachadaAtiva.id}
                    aoSelecionarFachada={setFachadaSelecionada}
                    andar={andarSimulado}
                    aoAlterarAndar={setAndarSimulado}
                    pavimentosTotais={predio.pavimentos ?? null}
                    centro={predio.centro}
                    volumesEntorno={entornoSolar?.recorte.volumes}
                    vizinhosLotes={cadastro.vizinhos}
                    obrasEntorno={visao.obras}
                  />
                ) : (
                  <Texto testID="canvas-25d-sem-predio" tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 19 }}>
                    Confirme o prédio para ver o volume com sol, sombra e brisa, o conforto térmico e o horizonte da janela neste endereço.
                  </Texto>
                )}
                {/* Revisão de 19/11/2026: sem prédio confirmado, o conforto e o horizonte saíam de um ponto fictício (a mesma
                    nota para qualquer anúncio sem vínculo). Agora só aparecem com o prédio. */}
                {predio ? <TermometroConfortoTermico conforto={confortoTermico} andar={andarSimulado} /> : null}
                {predio ? <RadarVistaELote radar={radarVistaELote} /> : null}
                <TresPerguntasDoBolso
                  modalidade={analise.modalidade}
                  nomeImovel={analise.nome}
                  enderecoImovel={visao.endereco || nomeDoBairro}
                  precoAnuncioReais={analise.declarados.preco.valor}
                  aluguelAnunciadoReais={analise.modalidade === "aluguel" ? visao.custo.principal.valor : null}
                  condominioMensalReais={analise.declarados.condominio.valor ?? 0}
                  iptuMensalReais={Math.round((predio?.iptuAnual?.mediana ?? 0) / 12)}
                  prestacaoEstimadaReais={partesDeCusto.simulacaoCompra?.prestacaoPriceReais ?? 0}
                  entradaReais={dinheiroParaEntrar?.entrada ?? 0}
                  itbiReais={dinheiroParaEntrar?.itbi ?? 0}
                  spuAnualReais={partesDeCusto.spuEstatutario?.encargoPatrimonialAnualVigenteReais ?? 0}
                  custoMensalArReais={saidaMensalEstimada.luz}
                  economiaLegalItbiReais={
                    partesDeCusto.otimizacaoFechamento?.melhorCenarioEconomiaReais ?? 0
                  }
                  descontoRuidoReais={acustica?.descontoHedonicoEstimadoReais ?? 0}
                  vplCalorPoenteReais={bioclimatico.exposicaoPoente ? bioclimatico.vpl10AnosPoenteReais : 0}
                  riscoManutencaoPredioReais={
                    partesDeCusto.estruturaECondominio?.choqueCotaExtraEstimadoPorUnidadeReais ?? 0
                  }
                  excedenteMedianaM2Reais={
                    visao.posicao && visao.posicao.deltaPercentual > 3 && analise.declarados.preco.valor
                      ? Math.round(
                          analise.declarados.preco.valor *
                            (visao.posicao.deltaPercentual / (100 + visao.posicao.deltaPercentual)),
                        )
                      : 0
                  }
                  entradaTco10Anos={entradaTco10Anos}
                  pendenciaDocumentalResumo={
                    partesDeCusto.alertaMarinha
                      ? "Terreno da União pede certidão atualizada do regime (ocupação ou aforamento) antes de fechar financiamento."
                      : !vinculoConfirmado
                        ? "Confirme o prédio no cadastro do Recife para cruzar IPTU oficial, matrícula e obras próximas."
                        : analise.declarados.condominio.aConfirmar
                          ? "Condomínio marcado para confirmação: peça o último boleto completo antes de enviar proposta."
                          : predio?.anoConstrucao &&
                              new Date().getFullYear() - predio.anoConstrucao >= 15
                            ? "Antes do sinal, solicite a última ata de assembleia e o saldo atual do fundo de reserva."
                            : null
                  }
                />
                <EscalaDeRuidoHumana acustica={acustica} anoConstrucao={predio?.anoConstrucao ?? null} ruido={ruido} />
                <RelogioDoPredio
                  anoConstrucao={predio?.anoConstrucao ?? null}
                  unidades={predio?.unidades ?? null}
                  pavimentos={predio?.pavimentos ?? null}
                  exibirSemLeitura
                />
                <CopilotoDocumentosPreSinal
                  nomeImovel={analise.nome}
                  anoConstrucao={predio?.anoConstrucao ?? null}
                  unidades={predio?.unidades ?? null}
                  chaveLote14={predio?.dsqfl ?? null}
                  textoAnuncio={analise.extracao ? JSON.stringify(analise.extracao.campos) : analise.nome}
                  spuAtivo={Boolean(partesDeCusto.alertaMarinha)}
                />
                <SilencioInteligente itensNormais={itensSilencio} />
                <ExportarResumoExecutivo
                  analisePrincipal={analise}
                  outrasAnalises={outras}
                  entrada={{
                    nomeImovel: analise.nome,
                    endereco: visao.endereco || nomeDoBairro,
                    modalidade: analise.modalidade,
                    precoPrincipalReais: visao.custo.principal.valor,
                    mensalBolsoRealReais: saidaMensalEstimada.total,
                    dinheiroEntrarReais: dinheiroParaEntrar?.total ?? null,
                    fachadaResumo: predio ? `${fachadaAtiva.orientacaoSolar} (${andarSimulado}º andar)` : "Sem leitura (prédio não confirmado)",
                    conforto: predio ? confortoTermico : null,
                    sossegoNivel:
                      ruido.estado === "estimado"
                        ? `${ruido.nivelDeSossego} (~${Math.round(ruido.naJanela.noiteDb)} dB(A) à noite na janela, estimativa)`
                        : ruido.textos.placar.valor,
                    radar: predio ? radarVistaELote : null,
                    pulso: pulsoDaQuadra,
                    anoConstrucao: predio?.anoConstrucao ?? null,
                    unidades: predio?.unidades ?? null,
                    chaveLote14: predio?.dsqfl ?? null,
                    spuAtivo: Boolean(partesDeCusto.alertaMarinha),
                  }}
                />
              </View>
            ) : null}
            {aba === "destaques" ? <FichaViva analise={analise} predio={predio} lista={lista} visao={visao} nomeDoBairro={nomeDoBairro} /> : null}
            {aba === "entorno" ? (
              <View style={{ gap: 12, marginTop: 8 }}>
                <VidaAPeNaQuadra dados={caminhabilidade} />
                <PulsoDaQuadra pulso={pulsoDaQuadra} />
                <ServicosDeEntorno
                  centro={
                    predio?.centro ??
                    (analise.caderno?.localizacaoDaVisita
                      ? [
                          analise.caderno.localizacaoDaVisita.longitude,
                          analise.caderno.localizacaoDaVisita.latitude,
                        ]
                      : null)
                  }
                  referenciaDaVisita={!predio ? analise.caderno?.localizacaoDaVisita : undefined}
                  bairro={predio?.bairro ?? null}
                  predioId={predio?.id ?? null}
                />
              </View>
            ) : null}
            {aba === "destaques" ? <PrepararNegociacao analise={analise} visao={visao} lista={lista} predio={predio} nomeDoBairro={nomeDoBairro} /> : null}
            {aba === "destaques" ? (
              <View style={{ gap: 10 }}>
                <Botao
                  rotulo={mostrarPainelCidadao ? "Ocultar auditoria detalhada em 10 pontos" : "Ver auditoria detalhada em 10 pontos e simulador"}
                  variante="secundario"
                  onPress={() => setMostrarPainelCidadao((v) => !v)}
                />
                {mostrarPainelCidadao ? (
                  <View style={{ gap: 10, minHeight: TOQUE_MINIMO }}>
                    {analise.modalidade === "compra" && analise.declarados.preco.valor ? (
                      <SimuladorTco10Anos
                        entrada={{
                          precoCompraReais: analise.declarados.preco.valor,
                          aluguelEquivalenteMensalReais: Math.round(analise.declarados.preco.valor * 0.0045),
                          condominioMensalReais: analise.declarados.condominio.valor ?? 0,
                          iptuAnualReais: predio?.iptuAnual?.mediana ?? 0,
                          spuAnualReais: partesDeCusto.spuEstatutario?.encargoPatrimonialAnualVigenteReais ?? 0,
                          economiaOtimizacaoTributariaReais:
                            partesDeCusto.otimizacaoFechamento?.melhorCenarioEconomiaReais ?? 0,
                        }}
                      />
                    ) : null}
                    {cartoesCidadao.map((c) => (
                      <CartaoCidadao3Camadas key={c.indicadorId} item={c} />
                    ))}
                    <ResumoEvidenciaPartilhavel
                      tituloImovel={analise.nome}
                      dsqfl={predio?.dsqfl ?? null}
                      cartoes={cartoesCidadao}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
            {aba === "destaques" ? <LinkComSeta rotulo="Orçamento e cenários" onPress={() => router.push({ pathname: "/detalhes", params: { id: analise.id, secao: "orcamento" } })} /> : null}
            {aba === "edificio" ? <LinhaUnificadaDoLote linha={linhaUnificada} /> : null}
            {aba === "edificio" ? <SolNasFachadas analise={analise} predio={predio} aoLevarParaVisita={levarParaVisita} /> : null}
            {aba === "edificio" ? <LadoDoBarulho bairro={predio?.bairro ?? null} predioId={predio?.id ?? null} centro={predio?.centro ?? null} aoLevarParaVisita={levarParaVisita} /> : null}
            {aba === "edificio" ? <LinhaDoTempoEstrutural analise={analise} aoRegistrar={() => router.push({ pathname: "/detalhes", params: { id: analise.id, secao: "edificio" } })} /> : null}
            {aba === "edificio" ? <LinkComSeta rotulo="Documentos e CNPJ do edifício" onPress={() => router.push({ pathname: "/detalhes", params: { id: analise.id, secao: "edificio" } })} /> : null}
            <LinkComSeta rotulo="Observações e histórico de visitas" onPress={() => router.push({ pathname: "/detalhes", params: { id: analise.id, secao: "campo" } })} />
            <LinkComSeta rotulo="Comparar imóveis" onPress={() => router.push("/comparar")} />
            <Botao rotulo="Preparar visita" variante="principal" seta onPress={() => void prepararVisita()} />
            {/* 15/11/2026: "Comparar" saiu do lado de "Descartar"; descartar fica sozinho, discreto, no fim. */}
            <View style={[styles.acoes, { justifyContent: "flex-end" }]}>
              {analise.descarte ? (
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 16 }}>
                  Análise descartada
                </Texto>
              ) : (
                <LinkComSeta rotulo="Descartar" onPress={() => setGaveta({ tipo: "descarte" })} discreto seta={false} />
              )}
            </View>
          </View>
        </Coluna>
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
  cartao: { marginHorizontal: 0 },
  // As margens laterais ficam na rolagem; a coluna (720 px no desktop, como as demais telas) vem dentro delas.
  rolagem: { padding: ESPACO[4], paddingBottom: 48 },
  depoisDoPainel: { marginTop: 18, paddingHorizontal: 3, gap: ESPACO[2] },
  acoes: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: ESPACO[3] },
});
