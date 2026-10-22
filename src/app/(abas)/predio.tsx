import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Botao } from "../../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../../componentes/Cartao";
import { Coluna } from "../../componentes/casca/Coluna";
import { AlternativasDePredio } from "../../componentes/predio/AlternativasDePredio";
import { BuscaDePredio } from "../../componentes/predio/BuscaDePredio";
import { CaixaDoPredio } from "../../componentes/predio/CaixaDoPredio";
import { GavetaSemCreditos } from "../../componentes/predio/GavetaSemCreditos";
import { MapaDoPredio } from "../../componentes/predio/MapaDoPredio";
import { PERCURSO_INICIAL, aposEscolha, proximoDoPercurso, type Percurso } from "../../componentes/predio/percurso";
import { avisoDeTipologia, formatarChaveCadastral, mensagemSemCandidatos } from "../../componentes/predio/textos";
import { Tela } from "../../componentes/Tela";
import { Texto } from "../../componentes/Texto";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { bairroPorSlug, eCoberto, type SlugCoberto } from "../../dados/recife/bairros";
import { buscarCandidatosDetalhados, type EntradaDeBusca } from "../../dados/recife/buscar";
import { edificiosDoBairro, indiceDoBairro } from "../../dados/recife/indice";
import { useAnalises } from "../../estado/Analises";
import { useCarteira } from "../../estado/Carteira";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";

export default function TelaPredio() {
  const parametros = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(parametros.id) ? parametros.id[0] : parametros.id;
  const { lista, pronto, analiseAtiva } = useAnalises();
  const { saldo, recarregarTeste } = useCarteira();
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [recarregando, setRecarregando] = useState(false);
  const [erroDaRecarga, setErroDaRecarga] = useState("");
  const analise = id ? (lista.find((a) => a.id === id) ?? null) : analiseAtiva;

  const recarregar = async () => {
    setRecarregando(true);
    setErroDaRecarga("");
    try {
      await recarregarTeste();
      setGavetaAberta(false);
    } catch {
      setErroDaRecarga("Não foi possível recarregar. Tente de novo.");
    } finally {
      setRecarregando(false);
    }
  };

  return (
    <Tela comAbas>
      <ScrollView contentContainerStyle={styles.rolagem} keyboardShouldPersistTaps="handled">
        <Coluna>
          {!pronto ? (
            <Texto tipo="apoio" cor="cor-texto-apoio">
              Abrindo suas análises…
            </Texto>
          ) : !analise ? (
            <CartaoDeAviso titulo="Nenhuma análise aberta" texto="Abra uma análise em Explorar para confirmar o prédio." />
          ) : !eCoberto(analise.bairro) ? (
            <CartaoDeAviso
              titulo={`Ainda não temos o cadastro de ${analise.bairroTexto || "este bairro"}`}
              texto="O Vereda confirma o prédio em Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena."
            />
          ) : (
            // `key`: a tela fica montada entre uma análise e outra; o prédio escolhido na anterior não vale para esta.
            <ConfirmarPredio key={analise.id} analise={analise} bairro={analise.bairro} aoFaltarCredito={() => setGavetaAberta(true)} />
          )}
        </Coluna>
      </ScrollView>
      <GavetaSemCreditos
        visivel={gavetaAberta}
        saldo={saldo}
        trabalhando={recarregando}
        erro={erroDaRecarga}
        aoRecarregar={() => void recarregar()}
        aoFechar={() => setGavetaAberta(false)}
      />
    </Tela>
  );
}

function CartaoDeAviso({ titulo, texto }: { titulo: string; texto: string }) {
  const { cor } = useTema();
  return (
    <Cartao style={[styles.cartao, { borderColor: comAlfa(cor("cor-texto"), 0.09) }]}>
      <CorpoDoCartao style={styles.corpo}>
        <Texto tipo="secao">{titulo}</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio">
          {texto}
        </Texto>
        <Botao rotulo="Ir para Explorar" variante="principal" onPress={() => router.push("/")} />
      </CorpoDoCartao>
    </Cartao>
  );
}

/** Sobretítulo azul com o traço de "registro oficial" de index.html (.conf-trace.oficial) e a chave cadastral. */
function SobretituloCadastral({ chave }: { chave: string | null }) {
  const { cor } = useTema();
  return (
    <View style={styles.sobretitulo}>
      <View style={styles.rastro} accessibilityLabel="Cadastro imobiliário · Prefeitura do Recife">
        <View style={[styles.linhaDoRastro, { backgroundColor: cor("cor-azul-cadastral") }]} />
        <Texto tipo="apoio" cor="cor-azul-cadastral" style={styles.textoDoRastro}>
          Cadastro imobiliário · Prefeitura do Recife
        </Texto>
      </View>
      {chave ? (
        <Texto tipo="etiqueta" cor="cor-azul-cadastral" accessibilityLabel={`Chave cadastral ${chave}`} style={styles.chave}>
          {chave}
        </Texto>
      ) : null}
    </View>
  );
}

/**
 * Área "a confirmar" (a leitura trouxe anomalia) não serve de pista: ela sozinha dá 30 a 40 pontos a qualquer prédio com
 * tipologia parecida e sugeriria um prédio (a confirmação custa 1 crédito) sem nenhum outro sinal do anúncio.
 */
function entradaDeBusca(analise: AnaliseV2, bairro: SlugCoberto): EntradaDeBusca {
  // Loja, sala ou casa: a área casaria com apartamentos parecidos, que não são o imóvel. Rua, número e nome valem.
  const area = avisoDeTipologia(analise.tipologia) ? { valor: null, aConfirmar: true } : analise.declarados.area;
  return {
    bairro,
    logradouro: analise.logradouro,
    numero: analise.numero,
    nomeEdificio: analise.nomeEdificio,
    area: area.aConfirmar ? null : area.valor,
    andar: analise.declarados.andar.valor,
    anoConstrucao: analise.extracao?.campos.anoConstrucao ?? null,
  };
}

type PropsDaConfirmacao = { analise: AnaliseV2; bairro: SlugCoberto; aoFaltarCredito: () => void };

function ConfirmarPredio({ analise, bairro, aoFaltarCredito }: PropsDaConfirmacao) {
  const { cor } = useTema();
  const { salvar } = useAnalises();
  const { saldo, debitarDossie, bloqueada: carteiraBloqueada, erro: erroDaCarteira } = useCarteira();

  /** Prédio que a pessoa escolheu (vizinho, busca ou mapa). null = o primeiro da lista. */
  const [escolhidoId, setEscolhidoId] = useState<string | null>(null);
  /** O que "Não é este (ver vizinho)" já mostrou, para não repetir nenhum prédio. */
  const [percurso, setPercurso] = useState<Percurso>(PERCURSO_INICIAL);
  /** Como o prédio fora da lista de candidatos chegou à tela: a pessoa escolheu, ou o botão mostrou um vizinho. */
  const [comoChegou, setComoChegou] = useState<"escolha" | "vizinho">("escolha");
  const [aviso, setAviso] = useState("");
  const [trabalhando, setTrabalhando] = useState(false);
  /** Trava de toque duplo: o estado só muda no próximo quadro e dois toques seguidos cobrariam duas vezes. */
  const ocupado = useRef(false);
  const [erro, setErro] = useState("");

  const indice = useMemo(() => {
    try {
      return { edificios: edificiosDoBairro(bairro), problema: null };
    } catch (e) {
      return { edificios: [] as Edificio[], problema: e instanceof Error ? e.message : String(e) };
    }
  }, [bairro]);
  const { edificios, problema } = indice;
  const porId = useMemo(() => new Map(edificios.map((e) => [e.id, e])), [edificios]);

  const resultado = useMemo(
    () => buscarCandidatosDetalhados(entradaDeBusca(analise, bairro), edificios),
    [analise, bairro, edificios],
  );

  const candidatos = resultado.candidatos;
  const [mostrarAlternativas, setMostrarAlternativas] = useState(false);
  const soPistasGerais = !candidatos.some((c) => c.pistas.some((p) => p === "nome" || p === "rua"));

  const vinculo = analise.vinculo;
  const jaConfirmado = vinculo.estado === "confirmado";
  const idConfirmado = vinculo.estado === "confirmado" ? vinculo.edificioId : null;

  // Prédio já confirmado primeiro; depois os candidatos, do mais ao menos provável.
  const ordem = useMemo(() => {
    const sugeridos = candidatos.flatMap((c) => porId.get(c.edificioId) ?? []);
    const antes = idConfirmado ? porId.get(idConfirmado) : undefined;
    return antes ? [antes, ...sugeridos.filter((e) => e.id !== antes.id)] : sugeridos;
  }, [candidatos, porId, idConfirmado]);

  const atual = (escolhidoId ? porId.get(escolhidoId) : undefined) ?? (jaConfirmado || !soPistasGerais ? ordem[0] : null) ?? null;
  const naLista = atual !== null && ordem.some((e) => e.id === atual.id);
  const candidato = atual ? candidatos.find((c) => c.edificioId === atual.id) : undefined;
  const eOConfirmado = atual !== null && atual.id === idConfirmado;
  const motivoForaDaLista = comoChegou === "vizinho" ? "Prédio vizinho no cadastro" : "Escolhido por você";
  const motivos = candidato?.motivos ?? (atual && !naLista ? [motivoForaDaLista] : []);
  const naoEncontrado = analise.modalidade === "compra";
  const rotuloDeSeguir = naoEncontrado ? "Não encontrei o prédio" : "Pular por agora";
  const nomeDoBairro = bairroPorSlug(bairro)?.nome ?? analise.bairroTexto;

  const abrirDossie = () => router.push({ pathname: "/dossie", params: { id: analise.id } });
  const estiloDoCartao = [styles.cartao, { borderColor: comAlfa(cor("cor-texto"), 0.09) }];

  const escolher = (edificio: Edificio) => {
    setErro("");
    setAviso("");
    setPercurso((p) => aposEscolha(p, atual?.id ?? null));
    setComoChegou("escolha");
    setEscolhidoId(edificio.id);
  };

  /** Percorre os candidatos; acabados eles, os prédios do índice mais próximos do atual, até 5, sem repetir. */
  const verVizinho = () => {
    if (!atual) return;
    setErro("");
    const passo = proximoDoPercurso(atual, ordem, edificios, percurso);
    setPercurso(passo.percurso);
    if (passo.edificio) {
      setAviso("");
      setComoChegou("vizinho");
      setEscolhidoId(passo.edificio.id);
    } else {
      setAviso(`Não há outro prédio no cadastro de ${nomeDoBairro} para mostrar.`);
    }
  };

  const confirmar = async (edificio: Edificio) => {
    if (ocupado.current) return;
    if (!jaConfirmado && carteiraBloqueada) {
      setErro(erroDaCarteira);
      return;
    }
    if (!jaConfirmado && saldo <= 0) {
      aoFaltarCredito();
      return;
    }
    ocupado.current = true;
    setTrabalhando(true);
    setErro("");
    try {
      const agora = new Date().toISOString();
      await salvar({
        ...analise,
        atualizadaEm: agora,
        vinculo: {
          estado: "confirmado",
          edificioId: edificio.id,
          dsqfl: edificio.dsqfl,
          confirmadoEm: agora,
          indiceGeradoEm: indiceDoBairro(bairro).geradoEm,
        },
      });
      if (!jaConfirmado) {
        // Cobra depois de gravar o vínculo; se a cobrança não acontecer, desfaz o vínculo.
        let debitou = false;
        try {
          debitou = await debitarDossie(analise.id);
        } finally {
          if (!debitou) await salvar(analise);
        }
        if (!debitou) {
          aoFaltarCredito();
          return;
        }
      }
      abrirDossie();
    } catch {
      setErro("Não foi possível confirmar o prédio. Nenhum crédito foi usado; tente de novo.");
    } finally {
      ocupado.current = false;
      setTrabalhando(false);
    }
  };

  const seguirSemPredio = async () => {
    if (ocupado.current) return;
    ocupado.current = true;
    setTrabalhando(true);
    setErro("");
    try {
      const em = new Date().toISOString();
      await salvar({
        ...analise,
        atualizadaEm: em,
        vinculo: naoEncontrado ? { estado: "nao_encontrado", em } : { estado: "pulado", em },
      });
      abrirDossie();
    } catch {
      setErro("Não foi possível salvar. Tente de novo.");
    } finally {
      ocupado.current = false;
      setTrabalhando(false);
    }
  };

  const textoDeErro = erro ? (
    <Texto tipo="apoio" cor="cor-barro-texto" accessibilityLiveRegion="polite">
      {erro}
    </Texto>
  ) : null;

  const alternativas = resultado.totalCompativeis > 0 ? (
    <View style={{ gap: 8 }}>
      <Texto tipo="apoio" cor="cor-texto-apoio">
        {`${resultado.totalCompativeis} ${resultado.totalCompativeis === 1 ? "prédio compatível" : "prédios compatíveis"} com as informações disponíveis.`}
        {resultado.resultadosLimitados ? ` Até ${candidatos.length} sugestões exibidas; refine pelo endereço ou nome.` : ""}
      </Texto>
      <Botao
        rotulo={mostrarAlternativas ? "Ocultar sugestões" : "Examinar sugestões"}
        expandido={mostrarAlternativas}
        variante="secundario"
        desativado={trabalhando}
        onPress={() => setMostrarAlternativas((v) => !v)}
      />
      {mostrarAlternativas ? (
        <AlternativasDePredio resultado={resultado} porId={porId} atualId={atual?.id ?? null} aoEscolher={escolher} desativado={trabalhando} />
      ) : null}
    </View>
  ) : null;

  // Sem prédio para mostrar: índice ilegível, ou nenhum candidato e nada escolhido na busca.
  if (!atual) {
    return (
      <Cartao style={estiloDoCartao}>
        <CorpoDoCartao style={styles.corpo}>
          <SobretituloCadastral chave={null} />
          {problema ? (
            <>
              <Texto tipo="titulo-tela" role="heading" style={styles.titulo}>
                {`Não foi possível abrir o cadastro de ${nomeDoBairro}`}
              </Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.paragrafo}>
                O cadastro deste bairro não pôde ser lido neste aparelho. Você pode seguir sem confirmar o prédio.
              </Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.detalheTecnico}>
                {problema}
              </Texto>
            </>
          ) : (
            <>
              <Texto tipo="titulo-tela" role="heading" style={styles.titulo}>
                {avisoDeTipologia(analise.tipologia)
                  ? "Este tipo de imóvel não está no cadastro de prédios"
                  : soPistasGerais ? "Precisamos de mais uma informação para localizar o prédio" : "É este o prédio?"}
              </Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.paragrafo}>
                {avisoDeTipologia(analise.tipologia) ??
                  (resultado.totalCompativeis > 0
                  ? "Área e ano podem coincidir em vários prédios. Informe a rua e o número ou o nome do edifício. Você também pode continuar sem identificar."
                  : mensagemSemCandidatos(analise.logradouro, analise.numero))}
              </Texto>
              <BuscaDePredio edificios={edificios} aoEscolher={escolher} />
              {alternativas}
            </>
          )}
          {textoDeErro}
          {jaConfirmado ? (
            <Botao rotulo="Ver dossiê" variante="principal" onPress={abrirDossie} />
          ) : (
            <Botao rotulo="Continuar sem identificar" variante="secundario" desativado={trabalhando} onPress={() => void seguirSemPredio()} />
          )}
        </CorpoDoCartao>
      </Cartao>
    );
  }

  const chave = formatarChaveCadastral(atual.dsqfl);

  return (
    <Cartao style={estiloDoCartao}>
      <CorpoDoCartao style={styles.corpo}>
        <SobretituloCadastral chave={chave} />
        <Texto tipo="titulo-tela" role="heading" style={styles.titulo}>
          É este o prédio?
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.paragrafo}>
          Vou usar este prédio para consultar o cadastro. Confira o endereço antes de confirmar.
          {jaConfirmado ? null : (
            <Texto tipo="apoio" cor="cor-barro-texto" style={[styles.paragrafo, { fontWeight: "700" }]}>
              {" Usa 1 crédito."}
            </Texto>
          )}
        </Texto>

        <BuscaDePredio edificios={edificios} aoEscolher={escolher} />

        {alternativas}
        <MapaDoPredio selecionado={atual} outros={edificios} aoEscolher={escolher} />

        <CaixaDoPredio edificio={atual} motivos={motivos} />

        {textoDeErro}
        {aviso ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" accessibilityLiveRegion="polite">
            {aviso}
          </Texto>
        ) : null}

        <View style={styles.botoes}>
          <Botao
            rotulo={eOConfirmado ? "Ver dossiê" : "É este prédio"}
            variante="principal"
            desativado={trabalhando}
            onPress={() => (eOConfirmado ? abrirDossie() : void confirmar(atual))}
          />
          <View style={styles.linhaDeBotoes}>
            <Botao
              rotulo="Não é este (ver vizinho)"
              variante="secundario"
              desativado={trabalhando}
              onPress={verVizinho}
              style={styles.botaoDaLinha}
            />
            {jaConfirmado ? null : (
              <Botao
                rotulo={rotuloDeSeguir}
                variante="secundario"
                desativado={trabalhando}
                onPress={() => void seguirSemPredio()}
                style={styles.botaoDaLinha}
              />
            )}
          </View>
        </View>
      </CorpoDoCartao>
    </Cartao>
  );
}

const styles = StyleSheet.create({
  // As margens laterais ficam na rolagem; a coluna (720 px no desktop, como as demais telas) vem dentro delas.
  rolagem: { padding: 16, paddingBottom: 48 },
  // A cor da borda (`cor-texto` a 9%) entra pelo tema, em cada uso.
  cartao: {
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  corpo: { paddingVertical: 16, paddingHorizontal: 15, gap: 12 },
  sobretitulo: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 8,
    rowGap: 4,
  },
  rastro: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  linhaDoRastro: { width: 16, height: 2 },
  textoDoRastro: { fontSize: 11, lineHeight: 13, fontWeight: "500", flexShrink: 1 },
  chave: {
    fontFamily: "JetBrainsMono",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
  titulo: { fontSize: 22, lineHeight: 26, fontWeight: "500", letterSpacing: -0.44, marginBottom: -4 },
  paragrafo: { fontSize: 12.5, lineHeight: 18 },
  detalheTecnico: { fontSize: 11, lineHeight: 15 },
  botoes: { gap: 8 },
  linhaDeBotoes: { flexDirection: "row", gap: 8 },
  botaoDaLinha: { flex: 1, paddingHorizontal: 8 },
});
