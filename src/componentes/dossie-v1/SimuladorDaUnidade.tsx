// "Andar × Fachada" (15/11/2026): casa ou apartamento, andar e a rosa 3×3 da fachada; tudo recalcula no aparelho.
// Barulho por fontes nomeadas e, desde 18/11/2026 (decisão A2), o dB(A) estimado de dia e à noite nesse andar e nessa
// fachada, sempre dito como estimativa, com a ficha de método a um toque; sol direto na fachada nessa altura
// e brisa de sudeste. E, no fim do Entorno,
// "Isso bate com a rua hoje?": resposta anônima, guardada só neste aparelho, com motivo opcional.
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import type { Edificio } from "../../dados/contratos";
import { ROSA, simularUnidade, type TipoDeImovel } from "../../dados/dossie/simuladorDaUnidade";
import { useTema } from "../../tema/Tema";
import { Botao } from "../Botao";
import { AlvoDeToque } from "../Pressionavel";
import { FichaDoRuidoEstimado, LeituraDoRuido } from "../ruido/RuidoEstimado";
import { Texto } from "../Texto";
import { Nota } from "./base";

/** O botão da rosa (de 45 em 45°) que corresponde a um rumo. */
const botaoDaRosa = (g: number | null | undefined): number | null => (g === null || g === undefined ? null : (Math.round(g / 45) * 45) % 360);

type TopicoSimulador = "barulho" | "sol" | "brisa";

const ROTULO_RELACAO: Record<"de_frente" | "de_lado" | "de_costas" | "sem_fachada", { texto: string; corFundo: "cor-barro-suave" | "cor-creme" | "cor-salvia-suave"; corTexto: "cor-barro-texto" | "cor-texto-apoio" | "cor-salvia-escura" }> = {
  de_frente: { texto: "De frente", corFundo: "cor-barro-suave", corTexto: "cor-barro-texto" },
  de_lado: { texto: "De lado", corFundo: "cor-creme", corTexto: "cor-texto-apoio" },
  de_costas: { texto: "Protegida pelo prédio", corFundo: "cor-salvia-suave", corTexto: "cor-salvia-escura" },
  sem_fachada: { texto: "Escolha a fachada", corFundo: "cor-creme", corTexto: "cor-texto-apoio" },
};

function Escolha({ ativo, rotulo, onPress, acessivel, botao = false }: { ativo: boolean; rotulo: string; onPress: () => void; acessivel?: string; botao?: boolean }) {
  const { cor } = useTema();
  const papel = botao ? { accessibilityRole: "button" as const } : { accessibilityRole: "radio" as const, accessibilityState: { checked: ativo }, "aria-checked": ativo };
  return (
    <AlvoDeToque onPress={onPress} {...papel} accessibilityLabel={acessivel ?? rotulo}
      style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: ativo ? cor("cor-texto") : cor("cor-papel-claro"), paddingHorizontal: 12 }}>
      <Texto tipo="corpo" cor={ativo ? "cor-papel-claro" : "cor-texto"} style={{ fontSize: 13.5, fontWeight: ativo ? "700" : "500" }}>{rotulo}</Texto>
    </AlvoDeToque>
  );
}

/**
 * Começa no andar e na fachada ativos do dossiê (src/dados/dossie/unidadeAtiva.ts): o rumo exato da fachada, não o botão
 * da rosa, para que o primeiro número seja o mesmo do placar. Tocar na rosa passa a usar a direção do botão.
 */
export function SimuladorDaUnidade({ predio, vizinhos, tipologia, andarInicial, fachadaInicialGraus, unidadeDescricao = null }: {
  predio: Edificio; vizinhos: readonly Edificio[]; tipologia: string | null; andarInicial: number; fachadaInicialGraus: number | null;
  /** "9º andar (do anúncio) · fachada Nascente (pela bússola da visita)": de onde vem o ponto de partida. */
  unidadeDescricao?: string | null;
}) {
  const { cor } = useTema();
  const maxAndar = Math.max(1, (predio.pavimentos ?? 20) - 1);
  const [tipo, setTipo] = useState<TipoDeImovel>(tipologia === "casa" ? "casa" : "apartamento");
  const [andar, setAndar] = useState<number>(Math.min(maxAndar, Math.max(0, Math.round(andarInicial))));
  const [fachada, setFachada] = useState<number | null>(fachadaInicialGraus);
  const [aberto, setAberto] = useState<TopicoSimulador | null>(null);
  const s = useMemo(() => simularUnidade({ predio, vizinhos, tipo, andar, fachadaGraus: fachada }), [predio, vizinhos, tipo, andar, fachada]);

  const alternar = (t: TopicoSimulador) => setAberto((atual) => (atual === t ? null : t));

  const fontesPerto = s.barulho.semFontes
    ? "Nenhuma fonte ruidosa mapeada perto"
    : `${s.barulho.fontes.length} ${s.barulho.fontes.length === 1 ? "fonte perto" : "fontes perto"} (${s.barulho.fontes[0]!.nome.split(" (")[0]} a ~${s.barulho.fontes[0]!.distanciaM} m)`;
  // A estimativa na janela escolhida abre o resumo; as fontes nomeadas continuam logo depois.
  const ruido = s.barulho.estimativa;
  const resumoBarulho = ruido.estado === "estimado"
    ? `Na janela: ~${Math.round(ruido.naJanela.diaDb)} dB(A) de dia · ~${Math.round(ruido.naJanela.noiteDb)} à noite (estimativa) · ${fontesPerto}`
    : fontesPerto;
  const resumoSol = s.sol
    ? `${s.sol.fachada}: ~${s.sol.horasSolDireto.toFixed(1).replace(".", ",")} h/dia`
    : "Toque na direção da janela acima";
  const resumoBrisa = s.vento.barreira ? "Com possível barreira na direção SE" : "Ventilação sudeste";

  return (
    <View role="region" aria-label="Simulador andar e fachada" style={{ gap: 14 }}>
      {unidadeDescricao ? (
        <Texto testID="simulador-ponto-de-partida" tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 19 }}>
          {`Começa como no placar: ${unidadeDescricao}.`}
        </Texto>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }} accessibilityRole="radiogroup" aria-label="Tipo de imóvel">
        <Escolha ativo={tipo === "apartamento"} rotulo="Apartamento" onPress={() => setTipo("apartamento")} />
        <Escolha ativo={tipo === "casa"} rotulo="Casa" onPress={() => setTipo("casa")} />
        {tipo === "apartamento" ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 4 }} aria-label="Andar">
            <Escolha botao ativo={false} rotulo="−" acessivel="Descer um andar" onPress={() => setAndar((a) => Math.max(0, a - 1))} />
            <Texto tipo="numero" accessibilityLiveRegion="polite" style={{ minWidth: 74, textAlign: "center", fontSize: 14, fontWeight: "700" }}>{andar === 0 ? "Térreo" : `${andar}º andar`}</Texto>
            <Escolha botao ativo={false} rotulo="+" acessivel="Subir um andar" onPress={() => setAndar((a) => Math.min(maxAndar, a + 1))} />
          </View>
        ) : null}
      </View>
      {tipo === "apartamento" && maxAndar >= 4 ? (
        <View testID="simulador-atalhos-andar" style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {(() => {
            const andarMeio = Math.max(2, Math.round(maxAndar / 2));
            return (
              <>
                <Escolha ativo={andar === 1} rotulo="Baixo (1º)" acessivel="Simular andar baixo, 1º andar" onPress={() => setAndar(1)} />
                <Escolha ativo={andar === andarMeio} rotulo={`Meio (${andarMeio}º)`} acessivel={`Simular andar médio, ${andarMeio}º andar`} onPress={() => setAndar(andarMeio)} />
                <Escolha ativo={andar === maxAndar} rotulo={`Topo (${maxAndar}º)`} acessivel={`Simular andar mais alto, ${maxAndar}º andar`} onPress={() => setAndar(maxAndar)} />
              </>
            );
          })()}
        </View>
      ) : null}

      <View style={{ gap: 6 }}>
        <Texto tipo="corpo" style={{ fontSize: 13.5, fontWeight: "600" }}>Para qual lado fica a janela principal?</Texto>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
          <View accessibilityRole="radiogroup" aria-label="Fachada da janela" style={{ gap: 4 }}>
            {ROSA.map((linha, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 4 }}>
                {linha.map((c) => (
                  <Escolha key={c.rotulo} ativo={botaoDaRosa(fachada) === c.graus} rotulo={c.rotulo} acessivel={c.graus === null ? "Não sei a fachada" : `Fachada ${c.rotulo}`} onPress={() => setFachada(c.graus)} />
                ))}
              </View>
            ))}
          </View>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ flex: 1, minWidth: 160, fontSize: 13, lineHeight: 19 }}>
            {s.explicacaoDaAltura}
          </Texto>
        </View>
      </View>

      <View
        testID="simulador-painel-unificado"
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: cor("cor-linha-forte"),
          backgroundColor: cor("cor-superficie"),
          overflow: "hidden",
        }}
      >
        <View>
          <AlvoDeToque
            onPress={() => alternar("barulho")}
            accessibilityRole="button"
            accessibilityState={{ expanded: aberto === "barulho" }}
            accessibilityLabel={`Barulho por perto: ${resumoBarulho}. Toque para ${aberto === "barulho" ? "recolher" : "ver detalhes"}`}
            style={{
              minHeight: 48,
              padding: 13,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              backgroundColor: aberto === "barulho" ? cor("cor-creme") : "transparent",
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 12, fontWeight: "700" }}>Barulho por perto</Texto>
              <Texto tipo="corpo" style={{ fontSize: 14.5, lineHeight: 20, fontWeight: "600", fontVariant: ["tabular-nums"] }}>{resumoBarulho}</Texto>
            </View>
            <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 13, fontWeight: "600" }}>{aberto === "barulho" ? "Fechar −" : "Ver +"}</Texto>
          </AlvoDeToque>
          {aberto === "barulho" ? (
            <View style={{ paddingHorizontal: 13, paddingBottom: 14, gap: 6, borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 10 }}>
              <LeituraDoRuido estimativa={ruido} testID="simulador-ruido-estimado" />
              <FichaDoRuidoEstimado estimativa={ruido} testID="simulador-ruido-metodo" />
              <Texto testID="simulador-consequencia-face" tipo="corpo" style={{ fontSize: 13.5, lineHeight: 19, fontWeight: "600", color: cor("cor-texto") }}>
                {s.barulho.consequenciaPorFace}
              </Texto>
              {s.barulho.semFontes ? (
                <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20 }}>
                  Nenhuma via principal, corredor de ônibus, metrô, bar, mercado ou licença de som foi encontrada perto nos dados públicos.
                </Texto>
              ) : (
                s.barulho.fontes.map((f) => {
                  const badge = ROTULO_RELACAO[f.relacao];
                  return (
                    <View key={f.id} style={{ paddingVertical: 9, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 19, fontWeight: "600", flex: 1 }}>{f.nome}</Texto>
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: cor(badge.corFundo) }}>
                          <Texto tipo="apoio" cor={badge.corTexto} style={{ fontSize: 11.5, fontWeight: "700" }}>{badge.texto}</Texto>
                        </View>
                      </View>
                      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 18 }}>
                        {`A ~${f.distanciaM} m · movimento ${f.quando} · fonte: ${f.fonte}`}
                      </Texto>
                    </View>
                  );
                })
              )}
              <View
                testID="simulador-causas-barulho"
                style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 8, marginTop: 2, gap: 6 }}
              >
                <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 11, fontWeight: "700" }}>
                  Fontes por tipo na vizinhança
                </Texto>
                {s.barulho.porCausa.map((causa) => (
                  <View key={causa.id} style={{ gap: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <Texto tipo="apoio" style={{ fontSize: 12.5, lineHeight: 17, fontWeight: "600", flex: 1 }}>
                        {causa.rotulo}
                      </Texto>
                      <Texto
                        tipo="apoio"
                        cor={causa.nivel === "Presença próxima" ? "cor-barro-texto" : causa.nivel === "Presença moderada" ? "cor-azul-cadastral" : "cor-texto-apoio"}
                        style={{ fontSize: 11.5, lineHeight: 16, fontWeight: "700" }}
                      >
                        {causa.nivel}
                      </Texto>
                    </View>
                    <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17, fontVariant: ["tabular-nums"] }}>
                      {causa.detalhe}
                    </Texto>
                  </View>
                ))}
              </View>
              <Texto testID="simulador-atenuacao-distancia" tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5, lineHeight: 18, fontVariant: ["tabular-nums"] }}>
                {`${s.barulho.decibeis} ${s.barulho.nota}`}
              </Texto>
              <View style={{ borderLeftWidth: 3, borderLeftColor: cor("cor-salvia-escura"), paddingLeft: 10, marginTop: 2 }}>
                <Texto testID="simulador-acao-barulho" tipo="apoio" style={{ fontSize: 12.5, lineHeight: 18, color: cor("cor-texto") }}>
                  {s.barulho.acaoConcreta}
                </Texto>
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha") }}>
          <AlvoDeToque
            onPress={() => alternar("sol")}
            accessibilityRole="button"
            accessibilityState={{ expanded: aberto === "sol" }}
            accessibilityLabel={`Sol na fachada: ${resumoSol}`}
            style={{
              minHeight: 48,
              padding: 13,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              backgroundColor: aberto === "sol" ? cor("cor-creme") : "transparent",
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 12, fontWeight: "700" }}>Sol na janela</Texto>
              <Texto tipo="corpo" style={{ fontSize: 14.5, lineHeight: 20, fontWeight: "600" }}>{resumoSol}</Texto>
            </View>
            <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 13, fontWeight: "600" }}>{aberto === "sol" ? "Fechar −" : "Ver +"}</Texto>
          </AlvoDeToque>
          {aberto === "sol" ? (
            <View style={{ paddingHorizontal: 13, paddingBottom: 14, gap: 6, borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 10 }}>
              {s.sol ? (
                <>
                  <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20 }}>
                    {`${s.sol.fachada}: ~${s.sol.horasSolDireto.toFixed(1).replace(".", ",")} h de sol direto no equinócio nessa altura${s.sol.horasSemVizinhos > s.sol.horasSolDireto ? ` (seriam ~${s.sol.horasSemVizinhos.toFixed(1).replace(".", ",")} h sem prédios vizinhos)` : ""}.`}
                  </Texto>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 19 }}>{s.sol.resumoHumano}</Texto>
                  {s.acaoSol ? (
                    <View style={{ borderLeftWidth: 3, borderLeftColor: cor("cor-salvia-escura"), paddingLeft: 10, marginTop: 2 }}>
                      <Texto testID="simulador-acao-sol" tipo="apoio" style={{ fontSize: 12.5, lineHeight: 18, color: cor("cor-texto") }}>
                        {s.acaoSol}
                      </Texto>
                    </View>
                  ) : null}
                </>
              ) : (
                <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20 }}>
                  Escolha uma direção na rosa acima para simular a incidência de sol nesta altura.
                </Texto>
              )}
            </View>
          ) : null}
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha") }}>
          <AlvoDeToque
            onPress={() => alternar("brisa")}
            accessibilityRole="button"
            accessibilityState={{ expanded: aberto === "brisa" }}
            accessibilityLabel={`Brisa de sudeste: ${resumoBrisa}`}
            style={{
              minHeight: 48,
              padding: 13,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              backgroundColor: aberto === "brisa" ? cor("cor-creme") : "transparent",
            }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 12, fontWeight: "700" }}>Vento e brisa</Texto>
              <Texto tipo="corpo" style={{ fontSize: 14.5, lineHeight: 20, fontWeight: "600" }}>{resumoBrisa}</Texto>
            </View>
            <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 13, fontWeight: "600" }}>{aberto === "brisa" ? "Fechar −" : "Ver +"}</Texto>
          </AlvoDeToque>
          {aberto === "brisa" ? (
            <View style={{ paddingHorizontal: 13, paddingBottom: 14, gap: 6, borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 10 }}>
              <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20 }}>{s.vento.frase}</Texto>
              {s.vento.barreira ? <Texto tipo="apoio" style={{ fontSize: 13, lineHeight: 19 }}>{s.vento.barreira}</Texto> : null}
              <View style={{ borderLeftWidth: 3, borderLeftColor: cor("cor-salvia-escura"), paddingLeft: 10, marginTop: 2 }}>
                <Texto testID="simulador-acao-vento" tipo="apoio" style={{ fontSize: 12.5, lineHeight: 18, color: cor("cor-texto") }}>
                  {s.vento.acaoConcreta}
                </Texto>
              </View>
              <Nota>{s.vento.superficie3d}</Nota>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: cor("cor-linha") }} />
    </View>
  );
}

// ——— "Isso bate com a rua hoje?" ———————————————————————————————————————————————————————————————————————

export const CHAVE_BATE_COM_A_RUA = "vereda-bate-com-a-rua-v1";
export type RespostaDaRua = { resposta: "bate" | "nao_bate"; motivo: string; em: string };

export async function lerRespostasDaRua(): Promise<Record<string, RespostaDaRua>> {
  try {
    const t = await AsyncStorage.getItem(CHAVE_BATE_COM_A_RUA);
    const v = t ? (JSON.parse(t) as unknown) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, RespostaDaRua>) : {};
  } catch {
    return {};
  }
}
export async function gravarRespostaDaRua(chave: string, r: RespostaDaRua | null): Promise<void> {
  const todas = await lerRespostasDaRua();
  if (r) todas[chave] = { ...r, motivo: r.motivo.slice(0, 400) };
  else delete todas[chave];
  await AsyncStorage.setItem(CHAVE_BATE_COM_A_RUA, JSON.stringify(todas));
}

export function BateComARua({ chave }: { chave: string }) {
  const [r, setR] = useState<RespostaDaRua | null>(null);
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState("");
  const { cor } = useTema();
  useEffect(() => {
    let vivo = true;
    void lerRespostasDaRua().then((t) => { if (vivo) { setR(t[chave] ?? null); setMotivo(t[chave]?.motivo ?? ""); } });
    return () => { vivo = false; };
  }, [chave]);
  const responder = async (resposta: RespostaDaRua["resposta"] | null) => {
    const nova = resposta ? { resposta, motivo, em: new Date().toISOString() } : null;
    try { await gravarRespostaDaRua(chave, nova); setR(nova); setAviso(nova ? "Guardado só neste aparelho." : "Resposta desfeita."); } catch { setAviso("Não foi possível guardar agora."); }
  };
  return (
    <View role="group" aria-label="Isso bate com a rua hoje?" style={{ gap: 8, paddingTop: 12 }}>
      <Texto tipo="secao" style={{ fontSize: 15, lineHeight: 21, fontWeight: "600" }}>Isso bate com a rua hoje?</Texto>
      <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup">
        <Escolha ativo={r?.resposta === "bate"} rotulo="Bate" onPress={() => void responder(r?.resposta === "bate" ? null : "bate")} />
        <Escolha ativo={r?.resposta === "nao_bate"} rotulo="Não bate" onPress={() => void responder(r?.resposta === "nao_bate" ? null : "nao_bate")} />
      </View>
      {r?.resposta === "nao_bate" ? (
        <View style={{ gap: 6 }}>
          <TextInput value={motivo} onChangeText={setMotivo} maxLength={400} multiline accessibilityLabel="O que não bate (opcional)" placeholder="O que não bate? (opcional)" placeholderTextColor={cor("cor-texto-apoio")}
            style={{ minHeight: 44, padding: 10, borderRadius: 10, backgroundColor: cor("cor-papel-claro"), borderBottomWidth: 1, borderBottomColor: cor("cor-linha-forte"), color: cor("cor-texto"), fontFamily: "PlusJakartaSans", fontSize: 13 }} />
          <Botao rotulo="Guardar o motivo" variante="secundario" desativado={!motivo.trim()} onPress={() => void responder("nao_bate")} />
        </View>
      ) : null}
      {aviso ? <Texto tipo="apoio" role="status" cor="cor-texto-apoio" style={{ fontSize: 11.5 }}>{aviso}</Texto> : null}
      <Nota>Resposta anônima: fica só neste aparelho e não sai dele.</Nota>
    </View>
  );
}
