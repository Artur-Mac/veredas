import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Cartao, CorpoDoCartao } from "../../componentes/Cartao";
import { Coluna } from "../../componentes/casca/Coluna";
import { FaixaDoCaderno } from "../../componentes/casca/FaixaDoCaderno";
import { carregarCadastro, type CadastroDaAnalise } from "../../componentes/dossie-v1/cadastro";
import { GradeArquitetonica } from "../../componentes/GradeArquitetonica";
import { caminho, poligonoNaCaixa, type Poligono } from "../../componentes/mapa/geometria";
import { AlvoDeToque, Pressionavel } from "../../componentes/Pressionavel";
import { estilosDoTema } from "../../componentes/revisao/estilosDoTema";
import { Tela } from "../../componentes/Tela";
import { Texto } from "../../componentes/Texto";
import { ImportarExtensao } from "../../componentes/leitor/ImportarExtensao";
import { BuscaUnificada, ExemplosAgora, FiltroDeEtapas, OndeMaisProcurarNoPiloto, TriagemDoCartao } from "../../componentes/inicio/Explorar";
import { GavetaDeDescarte } from "../../componentes/descarte/GavetaDeDescarte";
import { passaNoFiltro, type FiltroDeEtapa } from "../../dados/triagem";
import { type AnaliseV2, type Edificio } from "../../dados/contratos";
import { custoMensal, ROTULO_MENSAL_CONHECIDO, avisoDeValoresPendentes } from "../../dados/custos";
import { derivarDossie } from "../../dados/dossie/derivar";
import { formatarReais } from "../../dados/formatos";
import { destinoDaAnalise, nomeDoBairro, rotuloDoBairroNoCartao, textoEhACidade } from "../../dados/formulario";
import { formatarEndereco } from "../../dados/recife/endereco";
import { eCoberto } from "../../dados/recife/bairros";
import { arquivoDoIndice } from "../../dados/recife/indice";
import { garantirCamadas } from "../../dados/camadas";
import { useAnalises } from "../../estado/Analises";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";

type FiltroModalidade = "TODOS" | "aluguel" | "compra";

const FILTROS: { valor: FiltroModalidade; rotulo: string }[] = [
  { valor: "TODOS", rotulo: "Todos" },
  { valor: "aluguel", rotulo: "Alugar" },
  { valor: "compra", rotulo: "Comprar" },
];

export default function ExplorarT1() {
  const styles = useEstilos();
  const { lista, definirAtiva, erro } = useAnalises();
  const [filtro, setFiltro] = useState<FiltroModalidade>("TODOS");
  const [etapa, setEtapa] = useState<FiltroDeEtapa>("todas");
  const [descartando, setDescartando] = useState<string | null>(null);

  const analisesAtivas = lista.filter((a) => !a.descarte);
  const naModalidade = analisesAtivas.filter((a) => filtro === "TODOS" || a.modalidade === filtro);
  const analisesFiltradas = naModalidade.filter((a) => passaNoFiltro(a, etapa));

  // Vínculo pendente em bairro coberto: falta confirmar o prédio. Nos demais casos, o dossiê, com a análise ativa.
  const abrirAnalise = async (a: AnaliseV2) => {
    if (destinoDaAnalise(a) === "predio") {
      router.push({ pathname: "/predio", params: { id: a.id } });
      return;
    }
    await definirAtiva(a.id);
    router.push({ pathname: "/dossie", params: { id: a.id } });
  };

  return (
    <Tela>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Coluna style={styles.coluna}>
          {/* Aviso do caderno (análises guardadas à parte): fica na tela, além do toast da abertura. */}
          <FaixaDoCaderno />

          {/* `.scanner-card`, 15/11/2026: entrada única (link OU prédio, rua, bairro) e "Usar minha localização agora". */}
          <Cartao style={styles.cartaoDoScanner}>
            <CorpoDoCartao style={styles.corpoDoScanner}>
              <BuscaUnificada />
            </CorpoDoCartao>
          </Cartao>

          {/* Sem análise ainda, os exemplos ficam abertos; com caderno, recolhidos (um toque abre). */}
          <ExemplosAgora recolhido={analisesAtivas.length > 0} />
          <OndeMaisProcurarNoPiloto />

          <ImportarExtensao />
          {/* `.saved-section-header` */}
          <View style={styles.secaoHeader}>
            <Texto tipo="titulo-tela" role="heading" style={[styles.secaoTitulo, styles.secaoTituloQueEncolhe]}>
              Análises Recentes
            </Texto>
            <View style={styles.segmentadoFiltro} accessibilityRole="radiogroup">
              {FILTROS.map(({ valor, rotulo }) => {
                const ativo = filtro === valor;
                return (
                  <AlvoDeToque
                    key={valor}
                    onPress={() => setFiltro(valor)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: ativo }}
                    aria-checked={ativo}
                    style={[styles.btnFiltro, ativo ? styles.btnFiltroAtivo : null]}
                  >
                    <Texto tipo="apoio" style={ativo ? styles.textoFiltroAtivo : styles.textoFiltro}>
                      {rotulo}
                    </Texto>
                  </AlvoDeToque>
                );
              })}
            </View>
          </View>
          {naModalidade.length > 0 ? (
            <FiltroDeEtapas filtro={etapa} aoEscolher={setEtapa} contagem={(f) => naModalidade.filter((a) => passaNoFiltro(a, f)).length} />
          ) : null}

          {analisesFiltradas.length > 0 ? (
            <View style={styles.gradeAnalises}>
              {analisesFiltradas.map((a) => (
                <CartaoDaAnalise key={a.id} analise={a} aoAbrir={() => abrirAnalise(a)} aoDescartar={() => setDescartando(a.id)} />
              ))}
            </View>
          ) : naModalidade.length > 0 ? (
            <Texto tipo="apoio" style={styles.semResultado}>
              Nenhuma análise nesta etapa.
            </Texto>
          ) : analisesAtivas.length > 0 ? (
            <Texto tipo="apoio" style={styles.semResultado}>
              {filtro === "aluguel" ? "Nenhuma análise de aluguel ainda." : "Nenhuma análise de compra ainda."}
            </Texto>
          ) : (
            <View style={styles.cadernoVazioContainer}>
              {/* Caderno que não abriu não está vazio: dizer "começa com um link" faria a pessoa achar que perdeu as análises. */}
              {erro ? (
                <Cartao style={styles.cartaoSimples}>
                  <CorpoDoCartao>
                    <Texto tipo="secao" style={styles.tituloDoCadernoVazio}>
                      Seu caderno não abriu.
                    </Texto>
                    <Texto tipo="apoio" role="alert" cor="cor-barro-texto" style={styles.textoDoCadernoVazio}>
                      {erro}
                    </Texto>
                  </CorpoDoCartao>
                </Cartao>
              ) : (
                <Cartao style={styles.cartaoSimples}>
                  <CorpoDoCartao>
                    <Texto tipo="secao" style={styles.tituloDoCadernoVazio}>
                      Seu caderno começa com um link, um prédio ou onde você está.
                    </Texto>
                    <Texto tipo="apoio" style={styles.textoDoCadernoVazio}>
                      Cole o endereço de um anúncio, busque um prédio pelo nome ou pela rua, ou abra um dos exemplos acima.
                    </Texto>
                  </CorpoDoCartao>
                </Cartao>
              )}
            </View>
          )}
        </Coluna>
      </ScrollView>
      {descartando ? (
        <GavetaDeDescarte analiseId={descartando} visivel aoFechar={() => setDescartando(null)} aoDescartar={() => setDescartando(null)} />
      ) : null}
    </Tela>
  );
}

const ICONES_DA_FAIXA = {
  area: ["M3 3h18v18H3z", "M3 9h18", "M9 21V9"],
  quartos: ["M2 4v16", "M2 8h18a2 2 0 0 1 2 2v10", "M2 17h20", "M6 8v9"],
  banheiros: ["M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5", "M10 5 8 7", "M2 12h20"],
  vagas: [
    "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
    "M9 17h6",
    "M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
    "M15 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  ],
} as const;

function ItemDaFaixa({ icone, texto }: { icone: keyof typeof ICONES_DA_FAIXA; texto: string }) {
  const { cor } = useTema();
  const styles = useEstilos();
  return (
    <View style={styles.specItem}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={cor("cor-texto-apoio")} strokeWidth={1.8} aria-hidden>
        {ICONES_DA_FAIXA[icone].map((d) => (
          <Path key={d} d={d} />
        ))}
      </Svg>
      <Texto tipo="apoio" style={styles.specTexto}>
        {texto}
      </Texto>
    </View>
  );
}

type LoteDoCartao = { poligono: Poligono | null; ano: number | null; endereco: string };

/**
 * Lote, ano e endereço do edifício confirmado, do índice cadastral. O endereço é o do cadastro, com número, escrito por
 * `formatarEndereco`. Sem edifício confirmado ou sem polígono, nada é desenhado.
 */
function loteDoEdificio(a: AnaliseV2, edificio: Edificio | null): LoteDoCartao | null {
  if (a.vinculo.estado !== "confirmado" || !edificio) return null;
  try {
    const endereco = formatarEndereco(edificio.logradouro, edificio.numero);
    const pontos = edificio.poligono;
    if (!pontos) return { poligono: null, ano: edificio.anoConstrucao, endereco };
    // Plano local: longitude reduzida pelo cosseno da latitude e latitude invertida (norte para cima).
    const [, lat0 = 0] = pontos[0] ?? [0, 0];
    const fator = Math.cos((lat0 * Math.PI) / 180);
    const plano: Poligono = pontos.map(([lon, lat]) => [lon * fator, -lat]);
    return { poligono: plano, ano: edificio.anoConstrucao, endereco };
  } catch {
    return null;
  }
}

/**
 * Título do achado principal do dossiê desta análise, o mesmo que o dossiê destaca: a derivação recebe o cadastro como o
 * dossiê o monta (edifício só com vínculo confirmado; contexto e obras do índice do bairro) e as outras análises do caderno.
 */
function achadoPrincipalDoCartao(a: AnaliseV2, cadastro: CadastroDaAnalise, outras: AnaliseV2[]): string | null {
  try {
    const visao = derivarDossie(a, cadastro.edificio, cadastro.contexto, cadastro.obras, outras, new Date());
    return visao.achados.principal?.titulo ?? null;
  } catch {
    return null;
  }
}

type LeituraDoCartao = { lote: LoteDoCartao | null; achado: string | null };

const SEM_LEITURA: LeituraDoCartao = { lote: null, achado: null };

/**
 * Lê o índice depois da primeira pintura: o primeiro acesso a um bairro valida o arquivo inteiro, e o Explorar
 * não deve esperar por isso para aparecer. Devolve o lote do edifício e o achado principal do dossiê.
 */
function useLeituraDoCartao(a: AnaliseV2, lista: AnaliseV2[]): LeituraDoCartao {
  const [leitura, definirLeitura] = useState<LeituraDoCartao>(SEM_LEITURA);
  useEffect(() => {
    let ativo = true;
    // D036: o índice do bairro fica fora do bundle. Sem ele (ex.: sem rede), o cartão fica sem lote e sem achado.
    const arquivo = eCoberto(a.bairro) ? arquivoDoIndice(a.bairro) : null;
    const agendado = setTimeout(() => {
      void garantirCamadas(arquivo ? [arquivo] : []).then(
        () => {
          if (!ativo) return;
          const cadastro = carregarCadastro(a);
          const outras = lista.filter((x) => x.id !== a.id);
          definirLeitura({ lote: loteDoEdificio(a, cadastro.edificio), achado: achadoPrincipalDoCartao(a, cadastro, outras) });
        },
        () => {
          if (ativo) definirLeitura(SEM_LEITURA);
        },
      );
    }, 0);
    return () => {
      ativo = false;
      clearTimeout(agendado);
    };
  }, [a, lista]);
  return leitura;
}

/** `.vereda-home-card`: topo 16:10 com a grade arquitetônica, barra de preço, corpo e faixa de diagnóstico. */
function CartaoDaAnalise({
  analise: a,
  aoAbrir,
  aoDescartar,
}: {
  analise: AnaliseV2;
  aoAbrir: () => void;
  aoDescartar: () => void;
}) {
  const { cor } = useTema();
  const styles = useEstilos();
  const { lista } = useAnalises();
  const confirmado = a.vinculo.estado === "confirmado";
  const { lote, achado } = useLeituraDoCartao(a, lista);
  const aluguel = a.modalidade === "aluguel";
  // Único cálculo de custo do app: nenhuma tela soma parcelas por conta própria.
  const custo = custoMensal(a);
  const anunciado = custo.principal.valor !== null ? formatarReais(custo.principal.valor) : "A confirmar";
  const mensalConhecido = custo.totalMensalConhecido !== null ? formatarReais(custo.totalMensalConhecido) : "A confirmar";
  const alem = aluguel && custo.alemDoPrincipal !== null && custo.alemDoPrincipal > 0 ? custo.alemDoPrincipal : null;

  // "Recife" sozinho é a cidade, não o bairro: sem rua, a linha de endereço não o repete como se fosse bairro.
  const nomeDoBairroDaAnalise = nomeDoBairro(a.bairro, a.bairroTexto);
  const bairro = textoEhACidade(nomeDoBairroDaAnalise) ? null : nomeDoBairroDaAnalise;
  // Nome oficial quando há slug; senão o texto que o anúncio trouxe; senão "Fora do Recife" (nunca "Recife" por padrão).
  const rotuloDoBairro = rotuloDoBairroNoCartao(a);
  // Prédio confirmado: o endereço do edifício, com número. Senão, a rua que a pessoa informou; sem rua, o bairro.
  const enderecoDoCartao = lote?.endereco ?? (a.logradouro ? formatarEndereco(a.logradouro, a.numero) : (bairro ?? ""));

  const area = a.declarados.area.valor;
  const quartos = a.declarados.quartos.valor;
  const banheiros = a.declarados.banheiros.valor;
  const vagas = a.declarados.vagas.valor;
  // Área marcada "a confirmar" (a leitura trouxe anomalia): o cartão diz isso em vez de mostrar o valor ou nada, como o dossiê.
  const areaAConfirmar = a.declarados.area.aConfirmar;
  const temFaixa = areaAConfirmar || area !== null || quartos !== null || banheiros !== null || vagas !== null;

  // O marcador e o cartão são irmãos: um botão dentro de outro quebra a hidratação na web (<button> em <button>).
  return (
    <View style={styles.cardAnalise}>
      <Pressionavel
        onPress={aoAbrir}
        style={styles.areaDoCartao}
        accessibilityRole="button"
        accessibilityLabel={`${a.nome}. ${rotuloDoBairro}. ${ROTULO_MENSAL_CONHECIDO}: ${mensalConhecido}. ${custo.principal.rotulo}: ${anunciado}. ${avisoDeValoresPendentes(custo) ?? ""}`}
      >
        <View style={styles.cardTopo}>
          <GradeArquitetonica />
          {lote?.poligono ? (
            <View style={styles.poligonoBox} pointerEvents="none">
              <Svg width="100%" height="100%" viewBox="0 0 300 84" aria-hidden>
                <Path
                  d={caminho(poligonoNaCaixa(lote.poligono, 288, 72, 6))}
                  fill={cor("cor-azul-cadastral")}
                  fillOpacity={0.18}
                  stroke={cor("cor-azul-cadastral")}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          ) : null}

          <View style={styles.pilulaBairro}>
            <Texto tipo="apoio" numberOfLines={1} style={styles.textoPilulaBairro}>
              {rotuloDoBairro}
            </Texto>
          </View>

          {/* `.photo-price-bar` */}
          <View style={styles.photoPriceBar}>
            <View style={styles.grupoDePreco}>
              <Texto tipo="apoio" style={aluguel ? styles.precoDestaque : styles.precoLinha}>
                {`${ROTULO_MENSAL_CONHECIDO}: ${mensalConhecido}${custo.totalMensalConhecido !== null ? "/mês" : ""}`}
              </Texto>
              <Texto tipo="apoio" style={aluguel ? styles.precoLinha : styles.precoDestaque}>
                {`${custo.principal.rotulo}: ${anunciado}${aluguel && custo.principal.valor !== null ? "/mês" : ""}`}
              </Texto>
            </View>
            {alem !== null || custo.pendentes > 0 ? (
              <View style={styles.etiquetas}>
                {alem !== null ? (
                  <View style={styles.etiquetaAlerta}>
                    <Texto tipo="apoio" style={styles.textoEtiquetaAlerta}>
                      {`+${formatarReais(alem)} além do aluguel`}
                    </Texto>
                  </View>
                ) : null}
                {custo.pendentes > 0 ? (
                  <View style={styles.etiquetaAlerta}>
                    <Texto tipo="apoio" style={styles.textoEtiquetaAlerta}>
                      {avisoDeValoresPendentes(custo)}
                    </Texto>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardCorpo}>
          <View>
            <Texto tipo="titulo-tela" role="heading" numberOfLines={2} style={styles.cardTitulo}>
              {a.nome}
            </Texto>
            {enderecoDoCartao ? (
              <Texto tipo="apoio" numberOfLines={1} style={styles.cardEndereco}>
                {enderecoDoCartao}
              </Texto>
            ) : null}
          </View>

          {temFaixa ? (
            <View style={styles.faixaSpecs}>
              {areaAConfirmar ? (
                <ItemDaFaixa icone="area" texto="Área a confirmar" />
              ) : area !== null ? (
                <ItemDaFaixa icone="area" texto={`${String(area).replace(".", ",")} m²`} />
              ) : null}
              {quartos !== null ? <ItemDaFaixa icone="quartos" texto={`${quartos} qtos`} /> : null}
              {banheiros !== null ? <ItemDaFaixa icone="banheiros" texto={`${banheiros} ban`} /> : null}
              {vagas !== null ? <ItemDaFaixa icone="vagas" texto={`${vagas} vg`} /> : null}
            </View>
          ) : null}

          {/* `.urban-diagnosis-strip`: o segundo item é o achado principal do dossiê desta análise. */}
          <View style={styles.faixaDiagnostico}>
            <View style={styles.itemDeDiagnostico}>
              <View style={[styles.pontoDiagnostico, confirmado ? styles.pontoConfirmado : styles.pontoNeutro]} />
              <Texto tipo="apoio" numberOfLines={1} style={confirmado ? styles.textoConfirmado : styles.textoNeutro}>
                {confirmado ? (lote?.ano ? `Prédio confirmado · ${lote.ano}` : "Prédio confirmado") : "Prédio não confirmado"}
              </Texto>
            </View>
            {achado ? (
              <>
                <View style={styles.divisorDiagnostico} />
                <View style={styles.itemDeDiagnostico}>
                  <View style={[styles.pontoDiagnostico, styles.pontoFerrugem]} />
                  <Texto tipo="apoio" numberOfLines={1} style={styles.textoFerrugem}>
                    {achado}
                  </Texto>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Pressionavel>

      {/* 15/11/2026: triagem num toque (favoritar, anotar, descartar e etapa). O marcador antigo do canto virou "Favoritar". */}
      <TriagemDoCartao analise={a} aoDescartar={aoDescartar} />
    </View>
  );
}

// Valores de index.html (.scanner-card 1463; .vereda-home-card 1629; .photo-price-bar 1784; .urban-diagnosis-strip 1861),
// com as cores sempre por token. Texto pequeno em ferrugem usa "cor-barro-texto"; o laranja fica em preenchimento, borda e traço.
const useEstilos = estilosDoTema((cor) => {
  const bordaDoCartao = cor("cor-linha");
  const sombraDoCartao = `0 4px 14px -4px ${comAlfa(cor("cor-texto"), 0.05)}`;
  return StyleSheet.create({
    // As margens laterais ficam na rolagem; a coluna (720 px no desktop) vem dentro delas.
    scroll: {
      padding: 16,
      paddingBottom: 48,
    },
    coluna: {
      gap: 16,
    },
    // `.scanner-card`: raio 18, borda e sombra suaves. Sem a margem lateral do `Cartao`: a rolagem já recua.
    cartaoDoScanner: {
      marginHorizontal: 0,
      marginBottom: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: bordaDoCartao,
      boxShadow: sombraDoCartao,
    },
    corpoDoScanner: {
      paddingTop: 16,
      paddingHorizontal: 15,
      paddingBottom: 15,
      gap: 12,
    },
    scannerHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    scannerTitulo: {
      flexShrink: 1,
      fontSize: 21,
      lineHeight: 24,
      fontWeight: "500",
      letterSpacing: -0.42,
      color: cor("cor-texto"),
    },
    alvoColar: {
      minHeight: 44,
      minWidth: 44,
      justifyContent: "center",
    },
    btnColar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 5,
      backgroundColor: cor("cor-papel-claro"),
      borderRadius: 999,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
    },
    textoBtnColar: {
      fontSize: 11.5,
      lineHeight: 16,
      color: cor("cor-texto-apoio"),
      fontWeight: "600",
    },
    pocoLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 11,
      paddingHorizontal: 13,
      minHeight: 46,
      backgroundColor: cor("cor-creme"),
      borderRadius: 12,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
    },
    // O contorno de foco (2 px em azul cadastral) vem de `useFocoDoCampo`; aqui só o fundo branco do protótipo.
    pocoLinkFocado: {
      backgroundColor: cor("cor-superficie"),
    },
    inputUrl: {
      flex: 1,
      minWidth: 0,
      padding: 0,
      color: cor("cor-texto"),
      fontFamily: "PlusJakartaSans",
      fontSize: 13,
      fontWeight: "500",
      outlineWidth: 0,
    },
    textoErroUrl: {
      color: cor("cor-barro-texto"),
      fontSize: 12,
      lineHeight: 16,
    },
    acoesDoScanner: {
      gap: 10,
    },
    // `.saved-section-header` (index.html 1577): título à esquerda e filtro à direita, sempre na mesma linha. Sem os 2 px
    // laterais do protótipo e com 8 px entre os dois, o título de 162 px cabe em uma linha a partir de 375 px; abaixo
    // disso ele quebra em duas linhas e o filtro continua ao lado.
    secaoHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    secaoTituloQueEncolhe: {
      flexShrink: 1,
      minWidth: 0,
    },
    secaoTitulo: {
      fontSize: 20,
      lineHeight: 23,
      fontWeight: "500",
      letterSpacing: -0.4,
      color: cor("cor-texto"),
    },
    segmentadoFiltro: {
      flexShrink: 0,
      flexDirection: "row",
      backgroundColor: cor("cor-sutil"),
      borderRadius: 10,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
      padding: 2,
      gap: 2,
    },
    // 6 px de lado em vez dos 11 do protótipo: com a fonte do app o título tem 162 px, e só assim ele e o filtro cabem
    // na mesma linha a 375 px. Altura e largura mínimas de 44 px: a web ignora `hitSlop`, então a área desenhada é a que vale.
    btnFiltro: {
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: 6,
      paddingVertical: 5,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    btnFiltroAtivo: {
      backgroundColor: cor("cor-texto"),
      boxShadow: `0 2px 5px ${comAlfa(cor("cor-texto"), 0.15)}`,
    },
    textoFiltro: {
      fontSize: 11.5,
      lineHeight: 16,
      color: cor("cor-texto-apoio"),
      fontWeight: "500",
    },
    textoFiltroAtivo: {
      fontSize: 11.5,
      lineHeight: 16,
      color: cor("cor-papel-claro"),
      fontWeight: "600",
    },
    gradeAnalises: {
      gap: 14,
    },
    semResultado: {
      color: cor("cor-texto-apoio"),
      fontSize: 13,
      paddingHorizontal: 2,
    },
    // `.vereda-home-card`
    // Sem `overflow: hidden`: o anel de foco do teclado é desenhado por fora da área do cartão (`Pressionavel`,
    // `outlineOffset` 2) e seria cortado. O recorte dos cantos fica por dentro: `areaDoCartao` e o topo (`cardTopo`).
    cardAnalise: {
      backgroundColor: cor("cor-superficie"),
      borderRadius: 18,
      borderWidth: 1,
      borderColor: bordaDoCartao,
      boxShadow: sombraDoCartao,
    },
    // Raio do cartão menos a borda de 1 px: o toque e o realce de "pressionado" seguem os cantos arredondados, e o anel de
    // foco, que acompanha este raio, aparece inteiro.
    areaDoCartao: {
      borderRadius: 17,
    },
    cardTopo: {
      width: "100%",
      aspectRatio: 16 / 10,
      backgroundColor: cor("cor-sutil"),
      borderTopLeftRadius: 17,
      borderTopRightRadius: 17,
      overflow: "hidden",
    },
    poligonoBox: {
      position: "absolute",
      top: 36,
      bottom: 96,
      left: 16,
      right: 16,
    },
    pilulaBairro: {
      position: "absolute",
      top: 10,
      left: 10,
      maxWidth: "70%",
      backgroundColor: comAlfa(cor("cor-campo"), 0.65),
      borderWidth: 1,
      borderColor: comAlfa(cor("cor-superficie"), 0.15),
      paddingHorizontal: 9,
      paddingVertical: 3.5,
      borderRadius: 6,
    },
    textoPilulaBairro: {
      color: cor("cor-texto-campo"),
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "600",
    },
    // Alvo de 44 px (48 com o token) no canto do topo; o círculo de 32 px de `.card-bookmark-btn` fica a 10 px das bordas.
    alvoDoMarcador: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    btnBookmark: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: comAlfa(cor("cor-campo"), 0.4),
      alignItems: "center",
      justifyContent: "center",
    },
    btnBookmarkSalvo: {
      backgroundColor: cor("cor-superficie"),
      boxShadow: `0 2px 6px ${comAlfa(cor("cor-texto"), 0.18)}`,
    },
    photoPriceBar: {
      position: "absolute",
      bottom: 8,
      left: 8,
      right: 8,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      columnGap: 8,
      rowGap: 6,
      backgroundColor: comAlfa(cor("cor-campo"), 0.82),
      borderWidth: 1,
      borderColor: comAlfa(cor("cor-superficie"), 0.16),
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    grupoDePreco: {
      flexShrink: 1,
      gap: 1.5,
    },
    precoLinha: {
      color: comAlfa(cor("cor-texto-campo"), 0.72),
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "500",
    },
    precoDestaque: {
      color: cor("cor-texto-campo"),
      fontSize: 15,
      lineHeight: 18,
      fontWeight: "700",
      letterSpacing: -0.22,
    },
    etiquetas: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    // `.visor-delta-pill.alert`: o laranja só no preenchimento e na borda; o texto fica claro sobre a barra escura.
    etiquetaAlerta: {
      backgroundColor: comAlfa(cor("cor-acao"), 0.24),
      borderWidth: 1,
      borderColor: comAlfa(cor("cor-acao"), 0.52),
      borderRadius: 7,
      paddingVertical: 4.5,
      paddingHorizontal: 9,
    },
    textoEtiquetaAlerta: {
      color: cor("cor-texto-campo"),
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "600",
    },
    cardCorpo: {
      paddingTop: 14,
      paddingHorizontal: 15,
      paddingBottom: 14,
      gap: 10,
    },
    cardTitulo: {
      fontSize: 18.5,
      lineHeight: 22,
      fontWeight: "500",
      letterSpacing: -0.37,
      color: cor("cor-texto"),
    },
    cardEndereco: {
      color: cor("cor-texto-apoio"),
      fontSize: 12,
      lineHeight: 16,
      marginTop: 2,
    },
    faixaSpecs: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      columnGap: 12,
      rowGap: 6,
    },
    specItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    specTexto: {
      color: cor("cor-texto-apoio"),
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "500",
    },
    faixaDiagnostico: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: cor("cor-linha"),
    },
    itemDeDiagnostico: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
    },
    pontoDiagnostico: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    pontoConfirmado: {
      backgroundColor: cor("cor-salvia-escura"),
      boxShadow: `0 0 0 2px ${comAlfa(cor("cor-salvia-escura"), 0.16)}`,
    },
    pontoNeutro: {
      backgroundColor: cor("cor-texto-apoio"),
      boxShadow: `0 0 0 2px ${comAlfa(cor("cor-texto-apoio"), 0.16)}`,
    },
    pontoFerrugem: {
      backgroundColor: cor("cor-barro"),
      boxShadow: `0 0 0 2px ${comAlfa(cor("cor-barro"), 0.16)}`,
    },
    textoConfirmado: {
      flexShrink: 1,
      color: cor("cor-salvia-escura"),
      fontSize: 11.5,
      lineHeight: 14,
      fontWeight: "500",
    },
    textoNeutro: {
      flexShrink: 1,
      color: cor("cor-texto-apoio"),
      fontSize: 11.5,
      lineHeight: 14,
      fontWeight: "500",
    },
    textoFerrugem: {
      flexShrink: 1,
      color: cor("cor-barro-texto"),
      fontSize: 11.5,
      lineHeight: 14,
      fontWeight: "500",
    },
    divisorDiagnostico: {
      width: 1,
      height: 15,
      backgroundColor: cor("cor-linha"),
    },
    // Caderno vazio
    cadernoVazioContainer: {
      gap: 12,
    },
    cartaoSimples: {
      marginHorizontal: 0,
      marginBottom: 0,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: bordaDoCartao,
    },
    tituloDoCadernoVazio: {
      color: cor("cor-texto"),
      fontWeight: "700",
    },
    textoDoCadernoVazio: {
      color: cor("cor-texto-apoio"),
      fontSize: 13,
      lineHeight: 19,
    },
  });
});
