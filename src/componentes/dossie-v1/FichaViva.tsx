// Ficha Viva do Edifício (15/11/2026): vem depois dos Destaques (decisão de UX): primeiro os 3 indicadores visuais com
// cor (temperatura, altura do terreno e água, barulho), depois os itens traduzidos (ITBI explicado, condomínio barato ou
// caro, clima e laudos estruturais) sem repetir a idade/andares que já estão no topo do imóvel.
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import type { AnaliseV2, Edificio, VisaoDoDossie } from "../../dados/contratos";
import { estruturaDoCaderno, fichaDoDossie, type ItemDaFicha } from "../../dados/dossie/fichaViva";
import { ORDEM_DAS_ETAPAS, ROTULO_DA_ETAPA } from "../../dados/estrutura/linhaDoTempo";
import { useTema } from "../../tema/Tema";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Nota, Seta } from "./base";

type TomIndicador = "bom" | "medio" | "atencao" | "neutro";

const ROTULO_DA_FICHA: Partial<Record<ItemDaFicha["id"], { titulo: string; resumo: string | null }>> = {
  itbi: {
    titulo: "Valor fiscal na Prefeitura (ITBI)",
    resumo: "Base usada para calcular o imposto na venda de apartamentos deste prédio — ajuda a conferir o preço pedido.",
  },
  condominio: {
    titulo: "Condomínio · comparação por m²",
    resumo: null,
  },
  estrutura: {
    titulo: "Laudos e registros estruturais",
    resumo: null,
  },
  clima: {
    titulo: "Solo, alagamento e sol/entorno",
    resumo: null,
  },
};

function resumoCondominioSimples(item: ItemDaFicha): string {
  if (item.valor === "A confirmar") return "O anúncio não informou condomínio e área completos para calcular o valor por m².";
  if (item.atencao) return `${item.valor} · ${item.atencao}`;
  if (item.leitura?.startsWith("Sem leitura")) {
    return `${item.valor} — salve ao menos 5 imóveis deste bairro no Explorar para comparar com a mediana local.`;
  }
  return item.leitura ?? item.valor;
}

function LinhaDaFicha({ item, primeira }: { item: ItemDaFicha; primeira: boolean }) {
  const { cor } = useTema();
  const [aberta, setAberta] = useState(false);
  const meta = ROTULO_DA_FICHA[item.id];
  const titulo = meta?.titulo ?? item.rotulo;
  const valorPrincipal =
    item.id === "condominio" && item.valor !== "A confirmar"
      ? `${item.valor} ${item.atencao ? "· Atenção" : ""}`.trim()
      : item.valor;
  const explicacaoCurta =
    item.id === "condominio"
      ? resumoCondominioSimples(item)
      : meta?.resumo ?? item.leitura;

  return (
    <View style={{ borderTopWidth: primeira ? 0 : 1, borderTopColor: cor("cor-linha") }}>
      <Pressionavel onPress={() => setAberta((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: aberta }} aria-expanded={aberta}
        accessibilityLabel={`${titulo}: ${valorPrincipal}.${item.atencao ? ` ${item.atencao}` : ""} ${aberta ? "Fechar" : "Ver detalhes e fonte"}`}
        style={{ minHeight: 52, paddingVertical: 12, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Texto tipo="corpo" style={{ fontSize: 14.5, lineHeight: 20, fontWeight: "700", flexShrink: 1 }}>{titulo}</Texto>
          <Seta tamanho={13} />
        </View>
        <Texto tipo="corpo" style={{ fontSize: 15, lineHeight: 21, fontWeight: "600", fontVariant: ["tabular-nums"], color: cor("cor-texto") }}>
          {valorPrincipal}
        </Texto>
        {explicacaoCurta ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 19 }}>
            {explicacaoCurta}
          </Texto>
        ) : null}
        {item.id !== "condominio" && item.atencao ? (
          <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 13, lineHeight: 18, fontWeight: "600" }}>{item.atencao}</Texto>
        ) : null}
      </Pressionavel>
      {aberta ? (
        <View style={{ gap: 6, paddingBottom: 14 }}>
          {item.leitura && item.id === "itbi" ? <Texto tipo="corpo" style={{ fontSize: 13.5, lineHeight: 20 }}>{item.leitura}</Texto> : null}
          {item.detalhes.map((d) => <Texto key={d} tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 18 }}>{d}</Texto>)}
          {item.pergunta ? (
            <View style={{ paddingVertical: 2, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: cor("cor-azul-cadastral") }}>
              <Texto tipo="apoio" style={{ fontSize: 13, lineHeight: 19, fontWeight: "500" }}>{`Pergunte na visita: ${item.pergunta}`}</Texto>
            </View>
          ) : null}
          <Nota>{`Fonte: ${item.fonte}`}</Nota>
        </View>
      ) : null}
    </View>
  );
}

function IndicadorVisual({ rotulo, estado, detalhe, tom }: { rotulo: string; estado: string; detalhe: string; tom: TomIndicador }) {
  const { cor } = useTema();
  const coresPorTom: Record<TomIndicador, { ponto: string; texto: string }> = {
    bom: { ponto: cor("cor-salvia-escura"), texto: cor("cor-salvia-escura") },
    medio: { ponto: cor("cat-ipe-amarelo"), texto: cor("cor-barro-texto") },
    atencao: { ponto: cor("cor-barro-texto"), texto: cor("cor-barro-texto") },
    neutro: { ponto: cor("cor-texto-apoio"), texto: cor("cor-texto") },
  };
  const c = coresPorTom[tom];
  return (
    <View
      accessible
      accessibilityLabel={`${rotulo}: ${estado}. ${detalhe}`}
      style={{
        flexGrow: 1,
        flexBasis: 170,
        minWidth: 165,
        paddingTop: 10,
        paddingBottom: 6,
        borderTopWidth: 2,
        borderTopColor: tom === "neutro" ? cor("cor-linha") : c.ponto,
        gap: 3,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.ponto }} />
        <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 16, fontWeight: "700", color: c.texto, flexShrink: 1 }}>
          {rotulo}
        </Texto>
      </View>
      <Texto tipo="corpo" style={{ fontSize: 14.5, lineHeight: 19, fontWeight: "700", fontVariant: ["tabular-nums"], color: c.texto }}>
        {estado}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5, lineHeight: 17 }}>
        {detalhe}
      </Texto>
    </View>
  );
}

export function FichaViva({ analise, predio, lista, visao, nomeDoBairro }: { analise: AnaliseV2; predio: Edificio | null; lista: readonly AnaliseV2[]; visao: VisaoDoDossie; nomeDoBairro: string }) {
  const { cor } = useTema();
  const leitura = useMemo(() => fichaDoDossie({ analise, predio, lista, visao, nomeDoBairro, agora: new Date() }), [analise, predio, lista, visao, nomeDoBairro]);

  const { itens, calor, relevo, ruido } = leitura;
  const semLeitura = "Sem leitura publicada";

  // 1. Temperatura clara com indicador de cor
  let tomCalor: TomIndicador = "neutro";
  let estadoCalor = semLeitura;
  let detalheCalor = "Dados de satélite indisponíveis neste ponto";
  if (calor) {
    const dif = calor.diferencaBairroC;
    if (dif === null) {
      estadoCalor = `${calor.tempQuadraC.toFixed(1).replace(".", ",")} °C`;
      detalheCalor = "Temperatura média da quadra no satélite";
    } else if (dif <= -0.5) {
      tomCalor = "bom";
      estadoCalor = "Mais fresco que o bairro";
      detalheCalor = `${dif.toFixed(1).replace(".", ",")} °C vs. bairro · superfície ${calor.tempQuadraC.toFixed(1).replace(".", ",")} °C`;
    } else if (dif < 0.8) {
      tomCalor = "neutro";
      estadoCalor = "Na média do bairro";
      detalheCalor = `${dif >= 0 ? "+" : ""}${dif.toFixed(1).replace(".", ",")} °C vs. bairro · superfície ${calor.tempQuadraC.toFixed(1).replace(".", ",")} °C`;
    } else if (dif < 1.8) {
      tomCalor = "medio";
      estadoCalor = "Mais quente que o bairro";
      detalheCalor = `+${dif.toFixed(1).replace(".", ",")} °C vs. bairro · esquenta mais`;
    } else {
      tomCalor = "atencao";
      estadoCalor = "Ponto bem mais quente";
      detalheCalor = `+${dif.toFixed(1).replace(".", ",")} °C vs. bairro · atenção ao ar-condicionado`;
    }
  }

  // 2. Altura do terreno (cota) e proximidade de água
  let tomAgua: TomIndicador = "neutro";
  let estadoAgua = semLeitura;
  let detalheAgua = "Sem altitude estimada neste ponto";
  if (relevo && relevo.altitudeM !== null) {
    const alt = relevo.altitudeM;
    const rio = relevo.cursoDaguaMaisProximo;
    const pertoRio = rio !== null && rio.distanciaM <= 200;
    const terrenoBaixo = alt < 3 || (relevo.diferencaEntornoM !== null && relevo.diferencaEntornoM < -0.5);
    if (terrenoBaixo || pertoRio) {
      tomAgua = alt < 2 || (rio && rio.distanciaM <= 120) ? "atencao" : "medio";
      estadoAgua = terrenoBaixo ? `Terreno baixo (${alt.toFixed(1).replace(".", ",")} m)` : `${rio!.nome} bem perto`;
      detalheAgua = `${alt.toFixed(1).replace(".", ",")} m acima do mar${rio ? ` · ${rio.nome} a ${rio.distanciaM} m` : ""} · checar garagem na chuva`;
    } else {
      tomAgua = "bom";
      estadoAgua = `Terreno elevado (${alt.toFixed(1).replace(".", ",")} m)`;
      detalheAgua = rio ? `${rio.nome} a ${rio.distanciaM} m · acima de pontos baixos` : "Altura acima da faixa baixa da cidade";
    }
  }

  // 3. Barulho por perto
  let tomRuido: TomIndicador = "neutro";
  let estadoRuido = semLeitura;
  let detalheRuido = "Veja o simulador na aba Entorno";
  if (ruido) {
    const quieto = /nenhuma|sem fonte|calma|longe/i.test(ruido);
    tomRuido = quieto ? "bom" : "medio";
    estadoRuido = quieto ? "Sem corredor pesado perto" : "Fontes de movimento perto";
    detalheRuido = ruido;
  }

  // Evita repetir "Escala e idade" quando o prédio já está confirmado no topo (`InfoDoImovel` mostra ano, andares e unidades).
  const itensVisiveis = predio ? itens.filter((i) => i.id !== "escala") : itens;

  return (
    <View role="region" aria-label="Raio-X do imóvel e edifício" style={{ marginTop: 18, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: cor("cor-linha-forte"), backgroundColor: cor("cor-superficie"), gap: 12 }}>
      <View style={{ gap: 3 }}>
        <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 16, fontWeight: "700" }}>Raio-X do edifício</Texto>
        <Texto tipo="secao" role="heading" style={{ fontSize: 18, lineHeight: 24, fontWeight: "700" }}>Condições físicas, imposto e prédio</Texto>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        <IndicadorVisual rotulo="Temperatura da quadra" estado={estadoCalor} detalhe={detalheCalor} tom={tomCalor} />
        <IndicadorVisual rotulo="Altura do terreno e água" estado={estadoAgua} detalhe={detalheAgua} tom={tomAgua} />
        <IndicadorVisual rotulo="Movimento e barulho" estado={estadoRuido} detalhe={detalheRuido} tom={tomRuido} />
      </View>
      <View>
        {itensVisiveis.map((i, k) => <LinhaDaFicha key={i.id} item={i} primeira={k === 0} />)}
      </View>
      <Nota>Toque numa linha para ver detalhes, fontes oficiais e perguntas para a visita.</Nota>
    </View>
  );
}

/**
 * Aba Edifício: a linha do tempo documental completa (chamado → vistoria → laudo com ART/RRT → interdição → reparo →
 * liberação), com documento, número e data literais de cada ato que a pessoa guardou no caderno, a checagem que falta e
 * a pergunta pronta para o síndico. Nunca diz o estado atual do prédio.
 */
export function LinhaDoTempoEstrutural({ analise, aoRegistrar }: { analise: AnaliseV2; aoRegistrar: () => void }) {
  const { cor } = useTema();
  const l = useMemo(() => estruturaDoCaderno(analise.caderno), [analise.caderno]);
  return (
    <View role="region" aria-label="Linha do tempo da estrutura" style={{ gap: 8, paddingVertical: 8 }}>
      <Texto tipo="secao" role="heading" style={{ fontSize: 16, lineHeight: 22, fontWeight: "600" }}>Linha do tempo da estrutura</Texto>
      <Texto tipo="corpo" style={{ fontSize: 13, lineHeight: 19 }}>{l.frase}</Texto>
      <View role="list" style={{ gap: 0 }}>
        {ORDEM_DAS_ETAPAS.map((etapa, i) => {
          const atos = l.atos.filter((a) => a.etapa === etapa);
          return (
            <View key={etapa} role="listitem" style={{ flexDirection: "row", gap: 10, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: cor("cor-linha") }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: atos.length ? cor("cor-azul-cadastral") : cor("cor-linha-forte") }} />
              <View style={{ flex: 1, gap: 1 }}>
                <Texto tipo="apoio" style={{ fontSize: 12.5, lineHeight: 17, fontWeight: "600" }}>{`${ROTULO_DA_ETAPA[etapa]}${atos.length ? "" : " · sem documento"}`}</Texto>
                {atos.map((a, k) => (
                  <Texto key={`${etapa}-${k}`} tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16, fontVariant: ["tabular-nums"] }}>
                    {`${a.data ? `${a.data.slice(8, 10)}/${a.data.slice(5, 7)}/${a.data.slice(0, 4)}` : "sem data"} · ${a.documento}${a.numero ? ` · nº ${a.numero}` : ""}`}
                  </Texto>
                ))}
              </View>
            </View>
          );
        })}
      </View>
      {l.mostrarDesabamento ? <Texto tipo="apoio" role="alert" cor="cor-barro-texto">Há documento de desabamento ligado a este lote e bloco.</Texto> : null}
      <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 17 }}>{l.checagemQueFalta}</Texto>
      <View style={{ paddingVertical: 2, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: cor("cor-azul-cadastral") }}>
        <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 17 }}>{`Pergunta para o síndico: ${l.perguntaAoSindico}`}</Texto>
      </View>
      {l.descartados ? <Nota>{`${l.descartados} registro(s) sem vínculo confirmado com este imóvel não entram na linha do tempo.`}</Nota> : null}
      <Pressionavel onPress={aoRegistrar} accessibilityRole="link" accessibilityLabel="Registrar laudo, vistoria ou interdição no caderno" style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}>
        <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12.5, fontWeight: "600", textDecorationLine: "underline" }}>Registrar laudo, vistoria ou interdição no caderno</Texto>
      </Pressionavel>
      <Nota>Só entram atos com documento que você guardou e ligou a este imóvel. A linha do tempo organiza datas: não diagnostica a estrutura.</Nota>
    </View>
  );
}
