import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { ShareIntentModule } from "expo-share-intent";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, Linking, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Botao } from "../../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../../componentes/Cartao";
import { Coluna } from "../../componentes/casca/Coluna";
import { useFocoDoCampo } from "../../componentes/casca/foco";
import { rendeDados } from "../../componentes/leitor/decidir";
import { LeitorDePagina } from "../../componentes/leitor/LeitorDePagina";
import { avisoDeTipologia } from "../../componentes/predio/textos";
import { estilosDoTema } from "../../componentes/revisao/estilosDoTema";
import { AlvoDeToque } from "../../componentes/Pressionavel";
import { FormularioDeRevisao } from "../../componentes/revisao/FormularioDeRevisao";
import { Tela } from "../../componentes/Tela";
import { Texto } from "../../componentes/Texto";
import { type AnaliseV2, type ExtracaoAnuncio, type LeituraParcial, type Portal } from "../../dados/contratos";
import { extrairDaUrl, extrairDoTexto, montarExtracao } from "../../dados/extrator";
import { textoDoAnuncioCopiado } from "../../dados/extrator/copiado";
import { lerPagina } from "../../dados/extrator/pagina";
import { formatarNumero } from "../../dados/formatos";
import {
  anomaliasDaRevisao,
  camposDaAnalise,
  coberturaDoFormulario,
  formularioDeExtracao,
  nomeDoBairro,
  nomeDoPortal,
  nomeSugerido,
  resumoDePrecoECustos,
  rotuloDaTipologia,
  tituloDeForaDeCobertura,
  tituloPadraoDoAnuncio,
  type EstadoDoFormulario,
} from "../../dados/formulario";
import { useAnalises } from "../../estado/Analises";
import { coletaDoId, recebeuDesde, registrarLinkAberto } from "../../estado/compartilhamento";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";

const VISITA_VAZIA: AnaliseV2["visita"] = {
  verificadas: [],
  respostas: {},
  perguntasProprias: [],
  notas: "",
  ruido: null,
  orientacaoGraus: null,
  segundos: 0,
  concluidaEm: null,
};

const AVISO_DE_TEXTO_LIDO = "Lemos o texto que você copiou. Confira os números abaixo.";
const AVISO_SEM_COPIA = "Não conseguimos ler o que você copiou. Toque e segure o campo abaixo e escolha Colar.";
const AVISO_NAO_E_ANUNCIO =
  "O que você copiou não parece o anúncio. No navegador, selecione o trecho com o preço, copie e toque em Colar o que copiei.";
const AVISO_SEM_NAVEGADOR = "Não conseguimos abrir o navegador. Abra o link nele, copie o texto do anúncio e cole abaixo.";
const AVISO_DA_PAGINA_COMPARTILHADA = "Lemos a página que você compartilhou. Confira os números abaixo.";
const AVISO_DO_TRECHO_RECEBIDO = "Lemos o trecho que você escolheu. Confira os números abaixo.";
const AVISO_DA_PAGINA_SEM_PRECO =
  "A página que você compartilhou não trouxe preço nem área. No navegador, selecione o trecho com o preço, copie e toque em Colar o que copiei.";

/**
 * Como o anúncio volta do navegador sem copiar, no build próprio do app (plugins/compartilhar): no iOS pela folha de
 * compartilhar do Safari, no Android pelo menu de seleção de texto. No Expo Go e na web o módulo não existe e fica só a
 * área de transferência.
 */
function instrucaoNoNavegador(): string | null {
  if (ShareIntentModule == null) return null;
  if (Platform.OS === "ios") {
    return "Lá, toque em Compartilhar e escolha Ler no Vereda. Se preferir, copie o trecho com preço, condomínio e IPTU e volte: o Vereda lê sozinho o que você copiou.";
  }
  if (Platform.OS === "android") {
    return "Lá, selecione o trecho com preço, condomínio e IPTU e toque em Ler no Vereda, no menu da seleção. Se preferir, copie o trecho e volte: o Vereda lê sozinho o que você copiou.";
  }
  return null;
}

/**
 * A página que a pessoa compartilhou do Safari, lida como a coleta da WebView; null quando não veio página. Sem
 * `urlPedida`: o link já é o da própria página, e o atalho "mesmo caminho do link pedido" leria uma lista ou uma busca
 * compartilhada como se fosse o anúncio.
 */
function leiturasDaPaginaCompartilhada(idDaColeta: string, url: string): LeituraParcial[] | null {
  const coleta = idDaColeta ? coletaDoId(idDaColeta) : null;
  if (coleta === null) return null;
  const lida = url ? extrairDaUrl(url) : null;
  const doLink = lida !== null && !("erro" in lida) ? lida : null;
  return lerPagina(coleta, doLink?.portal ?? "outro", doLink?.idNoPortal ?? null);
}

/** Todas as leituras juntas: link, página (celular) e o texto colado que já foi lido. */
function extrairTudo(
  url: string,
  leituraDaUrl: LeituraParcial | null,
  portal: Portal,
  paginas: LeituraParcial[],
  texto: string,
): ExtracaoAnuncio {
  const leituras: LeituraParcial[] = [];
  if (leituraDaUrl) leituras.push(leituraDaUrl);
  leituras.push(...paginas);
  if (texto.trim()) leituras.push(...extrairDoTexto(texto, portal));
  return montarExtracao(url, leituras, new Date());
}

/**
 * A leitura é uma aba escondida (`href: null`): o navegador a mantém montada entre uma visita e outra, e o estado dela
 * (texto lido, formulário e o id da análise) sobreviveria ao link seguinte; salvar o segundo link regravaria a primeira
 * análise com o mesmo id. A chave (link, texto e `n`, a marca que o Explorar põe a cada "Gerar Dossiê" e o
 * `RecebedorDeCompartilhamento` a cada anúncio recebido) recomeça a leitura do zero a cada visita.
 */
export default function TelaDeLeitura() {
  const { url = "", texto = "", n = "" } = useLocalSearchParams<{ url?: string; texto?: string; n?: string }>();
  return <LeituraDoAnuncio key={`${url}|${texto}|${n}`} />;
}

function LeituraDoAnuncio() {
  const { cor } = useTema();
  const styles = useEstilos();
  const {
    url: urlDaRota = "",
    texto: textoDaRota = "",
    coleta: idDaColeta = "",
    origem = "",
  } = useLocalSearchParams<{ url?: string; texto?: string; coleta?: string; origem?: string }>();
  const url = urlDaRota.trim();
  const { salvar, erro: erroDoCaderno } = useAnalises();
  const focoDoTexto = useFocoDoCampo();

  // Anúncio recebido por compartilhamento (`RecebedorDeCompartilhamento`): a página do Safari e o trecho escolhido no
  // menu de seleção já chegam lidos, e a WebView não precisa abrir (nos portais que bloqueiam, nem abriria).
  const compartilhado = origem === "compartilhado";
  const [daPagina] = useState(() => (compartilhado ? leiturasDaPaginaCompartilhada(idDaColeta, url) : null));
  const paginaRendeu = daPagina !== null && rendeDados(daPagina);
  const trechoRecebido = compartilhado && textoDaRota.trim() !== "";
  const avisoDoRecebido = paginaRendeu
    ? AVISO_DA_PAGINA_COMPARTILHADA
    : trechoRecebido
      ? AVISO_DO_TRECHO_RECEBIDO
      : daPagina !== null
        ? AVISO_DA_PAGINA_SEM_PRECO
        : "";

  const [idGerado] = useState(() => `imovel-${Date.now()}`);
  /** O que está no campo de texto e o que já foi lido ("Ler texto"): a leitura só muda no botão. */
  const [textoDoCampo, setTextoDoCampo] = useState(textoDaRota);
  const [textoLido, setTextoLido] = useState(textoDaRota);
  const [leiturasDaPagina, setLeiturasDaPagina] = useState<LeituraParcial[]>(daPagina ?? []);
  const [paginaAberta, setPaginaAberta] = useState(daPagina === null && !trechoRecebido);
  const [motivoDaFalha, setMotivoDaFalha] = useState<string | null>(null);
  const [pediuTexto, setPediuTexto] = useState(trechoRecebido || (daPagina !== null && !paginaRendeu));
  const [salvando, setSalvando] = useState(false);
  const [erroAoSalvar, setErroAoSalvar] = useState("");
  /** Depois da primeira leitura bem-sucedida, a página reaberta é só para a pessoa ver. */
  const jaLeuAPagina = useRef(paginaRendeu);
  /** Resultado da última leitura do que a pessoa copiou (lido, vazio ou não é anúncio). */
  const [avisoDaCopia, setAvisoDaCopia] = useState("");
  /** A pessoa foi ao navegador copiar o anúncio: na volta, o app lê a área de transferência uma vez. */
  const esperandoACopia = useRef(false);
  /** Aba do Safari aberta por cima do app (iOS): a volta é o fim de `openBrowserAsync`, não a mudança de AppState. */
  const abaPorCima = useRef(false);
  /** Quando a pessoa foi ao navegador; o anúncio que chegar por compartilhamento depois disso dispensa a cópia. */
  const abriuONavegadorEm = useRef(0);

  const leituraDaUrl = useMemo(() => {
    if (!url) return null;
    const lida = extrairDaUrl(url);
    return "erro" in lida ? null : lida;
  }, [url]);
  const portal = leituraDaUrl ? leituraDaUrl.portal : "outro";
  const idNoPortal = leituraDaUrl ? leituraDaUrl.idNoPortal : null;
  const noCelular = Platform.OS !== "web";
  /** A página só abre para um link http(s) válido, à vista da pessoa. */
  const abrePagina = noCelular && leituraDaUrl !== null;

  const extracao = useMemo(
    () => extrairTudo(url, leituraDaUrl, portal, leiturasDaPagina, textoLido),
    [url, leituraDaUrl, portal, leiturasDaPagina, textoLido],
  );

  const [form, setForm] = useState<EstadoDoFormulario>(() => formularioDeExtracao(extracao));

  const aoLerAPagina = (leituras: LeituraParcial[]) => {
    if (jaLeuAPagina.current) return;
    jaLeuAPagina.current = true;
    setLeiturasDaPagina(leituras);
    setPaginaAberta(false);
    setMotivoDaFalha(null);
    setForm((anterior) => formularioDeExtracao(extrairTudo(url, leituraDaUrl, portal, leituras, textoLido), anterior));
  };

  const aoFalharAPagina = (motivo: string) => {
    if (jaLeuAPagina.current) return;
    setMotivoDaFalha(motivo);
    setPediuTexto(true);
    // A página de bloqueio não tem nada para a pessoa fazer: sai da tela e dá lugar ao navegador.
    if (motivo === "bloqueio") setPaginaAberta(false);
  };

  const lerTexto = (texto: string) => {
    setTextoLido(texto);
    setForm((anterior) => formularioDeExtracao(extrairTudo(url, leituraDaUrl, portal, leiturasDaPagina, texto), anterior));
  };

  /** Lê a área de transferência. Só o que parece anúncio entra no campo; o resto é descartado sem aparecer. */
  const lerCopiado = async () => {
    let copiado = "";
    try {
      copiado = await Clipboard.getStringAsync();
    } catch {
      copiado = "";
    }
    if (!copiado.trim()) {
      setAvisoDaCopia(AVISO_SEM_COPIA);
      return;
    }
    const texto = textoDoAnuncioCopiado(copiado, url);
    if (texto === null) {
      setAvisoDaCopia(AVISO_NAO_E_ANUNCIO);
      return;
    }
    setTextoDoCampo(texto);
    lerTexto(texto);
    setAvisoDaCopia(AVISO_DE_TEXTO_LIDO);
  };

  const voltouDoNavegador = () => {
    if (!esperandoACopia.current) return;
    esperandoACopia.current = false;
    // O anúncio já voltou por "Ler no Vereda": ler a área de transferência por cima dele pediria permissão à toa (iOS).
    if (recebeuDesde(abriuONavegadorEm.current)) return;
    void lerCopiado();
  };
  // O ouvinte do AppState é montado uma vez; a ref aponta sempre para a versão desta renderização.
  const voltouDoNavegadorRef = useRef(voltouDoNavegador);
  useEffect(() => {
    voltouDoNavegadorRef.current = voltouDoNavegador;
  });

  useEffect(() => {
    if (Platform.OS === "web") return;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado !== "active" || abaPorCima.current) return;
      // No Android 10 ou mais novo, a área de transferência só é entregue ao app com foco, que chega logo depois.
      espera = setTimeout(() => voltouDoNavegadorRef.current(), 500);
    });
    return () => {
      assinatura.remove();
      if (espera) clearTimeout(espera);
    };
  }, []);

  /** O portal que bloqueia a página no app abre no navegador do aparelho (Safari ou Chrome), sem disfarce nenhum. */
  const abrirNoNavegador = async () => {
    setAvisoDaCopia("");
    esperandoACopia.current = true;
    abaPorCima.current = Platform.OS === "ios";
    // O trecho escolhido no menu de seleção (Android) volta sem link: o recebedor junta este.
    abriuONavegadorEm.current = Date.now();
    registrarLinkAberto(url, abriuONavegadorEm.current);
    try {
      await WebBrowser.openBrowserAsync(url);
      if (abaPorCima.current) {
        abaPorCima.current = false;
        voltouDoNavegador();
      }
    } catch {
      abaPorCima.current = false;
      try {
        await Linking.openURL(url);
      } catch {
        esperandoACopia.current = false;
        setAvisoDaCopia(AVISO_SEM_NAVEGADOR);
      }
    }
  };

  // ——— Checklist: reflete só o que a extração trouxe ———————————————————————————

  const c = extracao.campos;
  const nomeDoImovel = nomeDoBairro(c.bairro, c.bairroTexto);
  const temBaseParaOTitulo = Boolean(c.tipologia || c.quartos || nomeDoImovel);
  const tituloDoCartao = temBaseParaOTitulo ? nomeSugerido(c) : tituloPadraoDoAnuncio(portal);

  const reconhecido = leituraDaUrl !== null && leituraDaUrl.portal !== "outro";
  const detalheDoLink = reconhecido
    ? `${nomeDoPortal(portal)}${idNoPortal ? ` · código ${idNoPortal}` : ""}`
    : "Link de outro site. Preencha abaixo.";

  const partesDoTipo: string[] = [];
  if (c.tipologia) partesDoTipo.push(rotuloDaTipologia(c.tipologia));
  if (c.quartos) partesDoTipo.push(`${c.quartos} ${c.quartos === 1 ? "quarto" : "quartos"}`);
  if (c.area) partesDoTipo.push(`${formatarNumero(c.area, Number.isInteger(c.area) ? 0 : 1)} m²`);

  // Aluguel com "/mês", IPTU com o período, e nada de preço que o formulário deixou de fora (outra modalidade).
  const { precoLido, partes: partesDoPreco } = resumoDePrecoECustos(extracao, form);

  // A rua e o número lidos da página aparecem aqui: o formulário enxuto não mostra o endereço.
  const enderecoLido = c.logradouro ? `${c.logradouro}${c.numero ? `, ${c.numero}` : ""} · ` : "";
  const detalheDaCobertura =
    enderecoLido +
    (extracao.cobertura === "coberto"
      ? `${nomeDoImovel ?? "Bairro"} · com cadastro`
      : extracao.cobertura === "recife_fora"
        ? `${nomeDoImovel ?? "Bairro"} · ainda sem cadastro`
        : extracao.cobertura === "fora_do_recife"
          ? "Fora do Recife"
          : "Bairro a confirmar");

  const linhas = [
    { lida: reconhecido, titulo: "Link reconhecido", detalhe: detalheDoLink },
    {
      lida: partesDoTipo.length > 0,
      titulo: "Tipo, quartos e área",
      detalhe: partesDoTipo.length > 0 ? partesDoTipo.join(" · ") : "Não estão no link",
    },
    {
      lida: precoLido,
      titulo: "Preço e custos",
      detalhe: partesDoPreco.length > 0 ? partesDoPreco.join(" · ") : "Cole o texto do anúncio para ler condomínio e IPTU",
    },
    { lida: extracao.cobertura !== "desconhecida", titulo: c.logradouro ? "Endereço e cobertura" : "Bairro e cobertura", detalhe: detalheDaCobertura },
  ];

  // ——— Salvar ——————————————————————————————————————————————————————————————————

  const montarAnalise = (vinculo: AnaliseV2["vinculo"]): AnaliseV2 => {
    const agora = new Date().toISOString();
    return {
      versao: 2,
      id: idGerado,
      criadaEm: agora,
      atualizadaEm: agora,
      url,
      extracao,
      // O bairro que a pessoa escolheu no formulário manda: ele decide a cobertura e o que fica gravado.
      ...camposDaAnalise(form),
      vinculo,
      visita: VISITA_VAZIA,
      salva: true,
      descarte: null,
    };
  };

  const salvarEIr = async (vinculo: AnaliseV2["vinculo"], depois: () => void) => {
    if (salvando) return;
    setSalvando(true);
    setErroAoSalvar("");
    try {
      const analise = montarAnalise(vinculo);
      await salvar(analise);
      depois();
    } catch {
      // Caderno que não abriu: o problema não são os valores digitados, e a mensagem do caderno diz o que fazer.
      setErroAoSalvar(erroDoCaderno || "Não foi possível salvar. Confira os valores digitados e tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  const encontrarOPredio = () => {
    // Sem bairro escolhido o botão fica desativado; a guarda cobre qualquer outro caminho até aqui.
    if (coberturaDoFormulario(form) !== "coberto") return Promise.resolve();
    return salvarEIr({ estado: "pendente" }, () => router.push({ pathname: "/predio", params: { id: idGerado } }));
  };
  const salvarForaDeCobertura = () => salvarEIr({ estado: "fora_de_cobertura" }, () => router.push("/"));

  // ——— Tela ————————————————————————————————————————————————————————————————————

  // A cobertura vem do bairro escolhido no formulário, não só do que a leitura achou.
  const coberturaEscolhida = coberturaDoFormulario(form);
  const foraDeCobertura = coberturaEscolhida === "recife_fora" || coberturaEscolhida === "fora_do_recife";
  const semBairro = coberturaEscolhida === "desconhecida";
  const mostrarCartaoDeTexto = !noCelular || pediuTexto;
  const bloqueado = motivoDaFalha === "bloqueio";
  /** No celular, quando a página não pôde ser lida, o caminho principal é o navegador do aparelho. */
  const ofereceNavegador = noCelular && leituraDaUrl !== null && motivoDaFalha !== null;
  const instrucao = instrucaoNoNavegador();

  return (
    <Tela>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Coluna style={styles.coluna}>
          <AlvoDeToque
            onPress={() => router.push("/")}
            accessibilityRole="button"
            accessibilityLabel="Cancelar"
            style={styles.botaoCancelar}
          >
            <Texto tipo="apoio" style={styles.textoCancelar}>
              ← Cancelar
            </Texto>
          </AlvoDeToque>

          <Cartao style={styles.cartao}>
            <CorpoDoCartao style={styles.corpo}>
              <View style={styles.cabecalho}>
                <Texto tipo="apoio" style={styles.sobretitulo}>
                  Lendo o anúncio no aparelho
                </Texto>
                <Texto tipo="titulo-tela" role="heading" style={styles.titulo}>
                  {tituloDoCartao}
                </Texto>
                {url ? (
                  <Texto tipo="apoio" numberOfLines={1} style={styles.enderecoDoLink}>
                    {url}
                  </Texto>
                ) : null}
              </View>

              {avisoDoRecebido ? (
                <Texto tipo="apoio" accessibilityLiveRegion="polite" style={styles.avisoDaCopia}>
                  {avisoDoRecebido}
                </Texto>
              ) : null}

              {abrePagina && paginaAberta ? (
                <View style={styles.blocoDaPagina}>
                  <LeitorDePagina
                    url={url}
                    portal={portal}
                    idNoPortal={idNoPortal}
                    aoLer={aoLerAPagina}
                    aoFalhar={aoFalharAPagina}
                  />
                  {!mostrarCartaoDeTexto ? <LinkDoCartao rotulo="Prefiro colar o texto" aoPressionar={() => setPediuTexto(true)} /> : null}
                </View>
              ) : null}

              {abrePagina && !paginaAberta && !bloqueado ? (
                <View style={styles.linhaDeLinks}>
                  <LinkDoCartao rotulo="Ver página do anúncio" aoPressionar={() => setPaginaAberta(true)} />
                  {!mostrarCartaoDeTexto ? <LinkDoCartao rotulo="Prefiro colar o texto" aoPressionar={() => setPediuTexto(true)} /> : null}
                </View>
              ) : null}

              <View style={styles.checklist}>
                {linhas.map((linha, indice) => (
                  <LinhaDoChecklist key={linha.titulo} numero={indice + 1} {...linha} />
                ))}
              </View>

              {avisoDeTipologia(form.tipologia) ? (
                <Texto tipo="apoio" accessibilityLiveRegion="polite" style={styles.avisoDaCopia}>
                  {avisoDeTipologia(form.tipologia)}
                </Texto>
              ) : null}

              <View style={styles.rodapeDePrivacidade}>
                <Texto tipo="apoio" style={styles.textoDePrivacidade}>
                  Só lemos campos do imóvel. Nada sobre quem anuncia.
                </Texto>
                <Texto tipo="apoio" style={styles.seloDePrivacidade}>
                  Privacidade local
                </Texto>
              </View>
            </CorpoDoCartao>
          </Cartao>

          {mostrarCartaoDeTexto ? (
            <Cartao style={styles.cartao}>
              <CorpoDoCartao style={styles.corpo}>
                <Texto tipo="secao" role="heading" style={styles.tituloDeSecao}>
                  {bloqueado ? "Abra o anúncio no navegador" : "Complete com o texto do anúncio"}
                </Texto>
                <Texto tipo="apoio" style={styles.descricao}>
                  {bloqueado
                    ? `${portal === "outro" ? "Este site" : nomeDoPortal(portal)} não deixa outros apps abrirem a página, mas o navegador do celular abre. ${instrucao ?? "Lá, selecione o trecho com preço, condomínio e IPTU, copie e volte: o Vereda lê sozinho o que você copiou."}`
                    : ofereceNavegador
                      ? instrucao
                        ? `Não conseguimos ler esta página aqui. Abra no navegador. ${instrucao}`
                        : "Não conseguimos ler esta página aqui. Abra no navegador, copie o trecho com preço, condomínio e IPTU e volte: o Vereda lê sozinho o que você copiou."
                      : Platform.OS === "web"
                        ? "O navegador não deixa o Vereda abrir a página do portal, então preço, condomínio e IPTU vêm do texto: no anúncio, selecione todo o texto da página e cole aqui. No celular, o app tenta ler a página sozinho."
                        : "No anúncio, selecione todo o texto da página e cole aqui."}
                </Texto>

                {ofereceNavegador ? (
                  <Botao rotulo="Abrir no navegador" variante="principal" icone="external-link" onPress={() => void abrirNoNavegador()} />
                ) : null}
                {noCelular ? (
                  <Botao rotulo="Colar o que copiei" variante="secundario" icone="clipboard" onPress={() => void lerCopiado()} />
                ) : null}
                {avisoDaCopia ? (
                  <Texto tipo="apoio" accessibilityLiveRegion="polite" style={styles.avisoDaCopia}>
                    {avisoDaCopia}
                  </Texto>
                ) : null}

                <View style={styles.campoDeTexto}>
                  <Texto tipo="etiqueta" style={styles.rotuloDoCampo}>
                    Texto do anúncio
                  </Texto>
                  <TextInput
                    multiline
                    numberOfLines={6}
                    value={textoDoCampo}
                    onChangeText={setTextoDoCampo}
                    placeholder="Cole aqui o texto copiado do anúncio"
                    placeholderTextColor={cor("cor-texto-apoio")}
                    accessibilityLabel="Texto do anúncio"
                    onFocus={focoDoTexto.aoFocar}
                    onBlur={focoDoTexto.aoDesfocar}
                    style={[styles.areaDeTexto, focoDoTexto.estilo]}
                  />
                </View>

                <Botao rotulo="Ler texto" variante="secundario" onPress={() => lerTexto(textoDoCampo)} />
              </CorpoDoCartao>
            </Cartao>
          ) : null}

          <Cartao style={styles.cartao}>
            <CorpoDoCartao style={styles.corpo}>
              <Texto tipo="titulo-tela" role="heading" style={styles.tituloDoFormulario}>
                Revise antes de salvar
              </Texto>
              <FormularioDeRevisao essencial estado={form} anomalias={anomaliasDaRevisao(extracao, form)} aoAlterar={setForm} />

              {foraDeCobertura ? null : (
                <View style={styles.acoes}>
                  <Botao rotulo="Encontrar o prédio" variante="principal" desativado={salvando || semBairro} onPress={encontrarOPredio} />
                  {semBairro ? (
                    <Texto tipo="apoio" accessibilityLiveRegion="polite" style={styles.dicaDoBairro}>
                      Escolha o bairro
                    </Texto>
                  ) : null}
                </View>
              )}
              {!foraDeCobertura && erroAoSalvar ? (
                <Texto tipo="apoio" role="alert" style={styles.erro}>
                  {erroAoSalvar}
                </Texto>
              ) : null}
            </CorpoDoCartao>
          </Cartao>

          {foraDeCobertura ? (
            <Cartao style={styles.cartao}>
              <CorpoDoCartao style={styles.corpo}>
                <Texto tipo="titulo-tela" role="heading" style={styles.titulo}>
                  {tituloDeForaDeCobertura(form) ?? "Ainda não cobrimos este bairro."}
                </Texto>
                <Texto tipo="apoio" style={styles.textoDaCobertura}>
                  O Vereda está disponível para{" "}
                  <Texto tipo="apoio" style={styles.destaqueDaCobertura}>
                    Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena
                  </Texto>
                  . A leitura deste anúncio não consumiu crédito.
                </Texto>

                <View style={styles.caixaCreme}>
                  <Texto tipo="apoio" style={styles.textoDaCaixaCreme}>
                    Nosso recorte inicial exige consolidação completa da chave cadastral junto às bases abertas do Recife.
                  </Texto>
                </View>

                <View style={styles.acoes}>
                  <Botao rotulo="Salvar no caderno" variante="principal" desativado={salvando} onPress={salvarForaDeCobertura} />
                  <Botao rotulo="Colar outro link" variante="secundario" onPress={() => router.push("/")} />
                </View>
                {erroAoSalvar ? (
                  <Texto tipo="apoio" role="alert" style={styles.erro}>
                    {erroAoSalvar}
                  </Texto>
                ) : null}
              </CorpoDoCartao>
            </Cartao>
          ) : null}
        </Coluna>
      </ScrollView>
    </Tela>
  );
}

function LinkDoCartao({ rotulo, aoPressionar }: { rotulo: string; aoPressionar: () => void }) {
  const styles = useEstilos();
  return (
    <AlvoDeToque onPress={aoPressionar} accessibilityRole="link" accessibilityLabel={rotulo} style={styles.link}>
      <Texto tipo="apoio" style={styles.textoDoLink}>
        {rotulo}
      </Texto>
    </AlvoDeToque>
  );
}

/** `.extract-step-row` de index.html (linha 2144): caixa creme com borda; círculo escuro com ✓ quando lida, só contorno quando não. */
function LinhaDoChecklist({
  numero,
  lida,
  titulo,
  detalhe,
}: {
  numero: number;
  lida: boolean;
  titulo: string;
  detalhe: string;
}) {
  const styles = useEstilos();
  return (
    <View
      accessible
      accessibilityLabel={`${titulo}: ${detalhe}. ${lida ? "Lido" : "Não lido"}`}
      style={[styles.linhaDoChecklist, lida ? styles.linhaLida : null]}
    >
      <View style={[styles.circulo, lida ? styles.circuloLido : null]}>
        <Texto tipo="apoio" style={lida ? styles.numeroLido : styles.numeroPendente}>
          {lida ? "✓" : String(numero)}
        </Texto>
      </View>
      <View style={styles.textosDaLinha}>
        <Texto tipo="etiqueta" style={styles.tituloDaLinha}>
          {titulo}
        </Texto>
        <Texto tipo="apoio" style={styles.detalheDaLinha}>
          {detalhe}
        </Texto>
      </View>
    </View>
  );
}

// Valores de index.html (.ed-card 1922; .extract-step-row 2144; .ed-title-lg 1951), com as cores sempre por token.
// Texto pequeno em ferrugem usa "cor-barro-texto" (contraste); o laranja fica só em preenchimento, ícone e traço.
const useEstilos = estilosDoTema((cor) =>
  StyleSheet.create({
    // As margens laterais ficam na rolagem; a coluna (720 px no desktop) vem dentro delas.
    scroll: {
      padding: 16,
      paddingBottom: 48,
    },
    coluna: {
      gap: 16,
    },
    botaoCancelar: {
      alignSelf: "flex-start",
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 12,
      backgroundColor: cor("cor-papel-claro"),
      borderRadius: 11,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
    },
    textoCancelar: {
      color: cor("cor-texto"),
      fontSize: 12,
      fontWeight: "600",
    },
    // `.ed-card`: raio 18, borda de 1 px. Sem a margem lateral que o `Cartao` traz, porque a rolagem já recua.
    cartao: {
      marginHorizontal: 0,
      marginBottom: 0,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
    },
    corpo: {
      paddingVertical: 16,
      paddingHorizontal: 15,
      gap: 14,
    },
    cabecalho: {
      gap: 3,
    },
    sobretitulo: {
      color: cor("cor-barro-texto"),
      fontSize: 12,
      fontWeight: "600",
    },
    titulo: {
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "500",
      letterSpacing: -0.44,
      color: cor("cor-texto"),
    },
    tituloDoFormulario: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: "500",
      letterSpacing: -0.4,
      color: cor("cor-texto"),
    },
    tituloDeSecao: {
      color: cor("cor-texto"),
      fontWeight: "700",
    },
    enderecoDoLink: {
      color: cor("cor-texto-apoio"),
      fontSize: 12,
    },
    blocoDaPagina: {
      gap: 4,
    },
    linhaDeLinks: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 18,
    },
    link: {
      minHeight: 44,
      minWidth: 44,
      justifyContent: "center",
      alignSelf: "flex-start",
    },
    textoDoLink: {
      color: cor("cor-azul-cadastral"),
      fontSize: 12.5,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    checklist: {
      gap: 7,
    },
    linhaDoChecklist: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 11,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 11,
      backgroundColor: cor("cor-creme"),
      borderWidth: 1,
      borderColor: cor("cor-linha"),
    },
    linhaLida: {
      backgroundColor: cor("cor-superficie"),
      borderColor: cor("cor-salvia"),
    },
    circulo: {
      width: 22,
      height: 22,
      borderRadius: 11,
      marginTop: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: cor("cor-sutil"),
      borderWidth: 1,
      borderColor: cor("cor-linha-forte"),
    },
    circuloLido: {
      backgroundColor: cor("cor-salvia-escura"),
      borderColor: cor("cor-salvia-escura"),
    },
    numeroPendente: {
      fontSize: 11,
      lineHeight: 14,
      color: cor("cor-texto-apoio"),
      fontWeight: "700",
    },
    numeroLido: {
      fontSize: 11,
      lineHeight: 14,
      color: cor("cor-superficie"),
      fontWeight: "700",
    },
    textosDaLinha: {
      flex: 1,
      minWidth: 0,
    },
    tituloDaLinha: {
      fontSize: 13,
      lineHeight: 18,
      color: cor("cor-texto"),
      fontWeight: "600",
    },
    detalheDaLinha: {
      fontSize: 11.5,
      lineHeight: 15.5,
      color: cor("cor-texto-apoio"),
    },
    rodapeDePrivacidade: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "center",
      columnGap: 12,
      rowGap: 2,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: comAlfa(cor("cor-texto"), 0.07),
    },
    textoDePrivacidade: {
      flexShrink: 1,
      fontSize: 11.5,
      color: cor("cor-texto-apoio"),
    },
    seloDePrivacidade: {
      fontSize: 11.5,
      color: cor("cor-texto-apoio"),
    },
    descricao: {
      color: cor("cor-texto-apoio"),
      fontSize: 13,
      lineHeight: 18,
    },
    avisoDaCopia: {
      color: cor("cor-texto"),
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: "600",
    },
    campoDeTexto: {
      gap: 5,
    },
    rotuloDoCampo: {
      color: cor("cor-texto-apoio"),
      fontWeight: "600",
    },
    areaDeTexto: {
      minHeight: 120,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 11,
      backgroundColor: cor("cor-creme"),
      color: cor("cor-texto"),
      fontFamily: "PlusJakartaSans",
      fontSize: 13,
      fontWeight: "500",
      textAlignVertical: "top",
      outlineWidth: 0,
    },
    textoDaCobertura: {
      color: cor("cor-texto-apoio"),
      fontSize: 13.5,
      lineHeight: 20,
    },
    destaqueDaCobertura: {
      color: cor("cor-texto"),
      fontSize: 13.5,
      lineHeight: 20,
      fontWeight: "700",
    },
    caixaCreme: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: cor("cor-creme"),
      borderWidth: 1,
      borderColor: cor("cor-linha"),
    },
    textoDaCaixaCreme: {
      color: cor("cor-texto-apoio"),
      fontSize: 12.5,
      lineHeight: 18,
    },
    acoes: {
      gap: 8,
    },
    dicaDoBairro: {
      color: cor("cor-texto-apoio"),
      fontSize: 12,
      lineHeight: 16,
    },
    erro: {
      color: cor("cor-barro-texto"),
      fontSize: 12,
      lineHeight: 16,
    },
  }),
);
