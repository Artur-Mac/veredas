import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import type { EstadoItemPacoteDocumental } from "../../nucleo/documentos/auditorDocumental";
import {
  ALERTAS_DILIGENCIA_RECIFE_2026,
  AVISO_LEITURA_INDEPENDENTE,
  ORIENTACAO_CNIB_ONR,
  PACOTE_PRE_SINAL_ITENS,
  PRAZOS_REFERENCIA_PRE_SINAL,
  auditarTextoColadoCidadao,
  calcularRateioReserva,
  extrairChaveCnm,
  gerarScriptSindico3Perguntas,
} from "../../dados/documentos/copilotoPreSinal";
import { formatarReais, formatarReaisCompacto } from "../../dados/formatos";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";

type Props = {
  nomeImovel: string;
  anoConstrucao: number | null;
  unidades: number | null;
  chaveLote14: string | null;
  textoAnuncio?: string | null;
  spuAtivo?: boolean;
};

const CENARIOS_OBRA = [
  { label: "Obra R$ 120 mil", valor: 120_000 },
  { label: "Fachada R$ 250 mil", valor: 250_000 },
  { label: "Colunas R$ 500 mil", valor: 500_000 },
] as const;

const CENARIOS_RESERVA = [
  { label: "Sem reserva", valor: 0 },
  { label: "R$ 50 mil", valor: 50_000 },
  { label: "R$ 150 mil", valor: 150_000 },
] as const;

function proximoEstadoPacote(
  atual: EstadoItemPacoteDocumental,
): EstadoItemPacoteDocumental {
  if (atual === "faltando") return "recebido";
  if (atual === "recebido") return "vencido";
  return "faltando";
}

function rotuloEstadoPacote(estado: EstadoItemPacoteDocumental): string {
  if (estado === "recebido") return "Recebido";
  if (estado === "vencido") return "Vencido";
  return "Faltando";
}

export function CopilotoDocumentosPreSinal({
  nomeImovel,
  anoConstrucao,
  unidades,
  chaveLote14,
  textoAnuncio,
  spuAtivo = false,
}: Props) {
  const { cor } = useTema();
  const [custoObra, setCustoObra] = useState<number>(250_000);
  const [saldoReserva, setSaldoReserva] = useState<number>(50_000);
  const [verPerguntas, setVerPerguntas] = useState<boolean>(false);
  const [verLeitorDoc, setVerLeitorDoc] = useState<boolean>(false);
  const [verPrazos, setVerPrazos] = useState<boolean>(false);
  const [textoColado, setTextoColado] = useState<string>("");
  const [copiado, setCopiado] = useState<boolean>(false);
  const [estadosPacote, setEstadosPacote] = useState<
    Record<string, EstadoItemPacoteDocumental>
  >({
    matricula: "faltando",
    ata: "faltando",
    balancete: "faltando",
    certidao_condo: "faltando",
  });

  const unidadesBase = Math.max(1, unidades ?? 24);
  const rateio = calcularRateioReserva({
    custoObraReais: custoObra,
    saldoReservaReais: saldoReserva,
    unidades: unidadesBase,
  });

  const leituraDoc = auditarTextoColadoCidadao(textoColado);
  const cnm = extrairChaveCnm(
    textoColado.trim() ? textoColado : (textoAnuncio ?? ""),
  );
  const script = gerarScriptSindico3Perguntas({
    nomeImovel,
    anoConstrucao,
    unidades,
    spuAtivo,
  });

  const copiarPerguntas = () => {
    void Clipboard.setStringAsync(script)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
      })
      .catch(() => {
        setCopiado(false);
      });
  };

  const recebidosCount = PACOTE_PRE_SINAL_ITENS.filter(
    (item) => estadosPacote[item.id] === "recebido",
  ).length;

  return (
    <View
      testID="copiloto-documentos-pre-sinal"
      style={[
        styles.cartao,
        {
          backgroundColor: cor("cor-superficie"),
          borderColor: cor("cor-linha-forte"),
        },
      ]}
    >
      {/* Cabecalho + Chaves duplas de identificacao */}
      <View style={styles.secao}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
          Documentação e caixa antes do sinal
        </Texto>
        <Texto tipo="secao" style={styles.manchete}>
          Pergunte 3 pontos ao síndico e confira o pacote pré-sinal
        </Texto>

        <View style={styles.chavesLinha}>
          <View style={styles.chaveItem}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.chaveRotulo}>
              Chave municipal do lote
            </Texto>
            <Texto tipo="numero" style={styles.chaveValor}>
              {chaveLote14 ?? "A confirmar no vínculo"}
            </Texto>
          </View>
          <View style={styles.chaveItem}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.chaveRotulo}>
              Matrícula nacional (CNM)
            </Texto>
            <Texto tipo="numero" style={styles.chaveValor}>
              {cnm.encontrada && cnm.formatada
                ? cnm.formatada
                : "Solicitar certidão (16 dígitos)"}
            </Texto>
          </View>
        </View>
      </View>

      {/* Pacote pré-sinal em 3 estados (recebido / faltando / vencido) */}
      <View style={[styles.secao, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
        <View style={styles.linhaTopoCalc}>
          <Texto tipo="etiqueta" style={styles.subTitulo}>
            Pacote pré-sinal (toque para marcar)
          </Texto>
          <Texto tipo="numero" cor="cor-texto-apoio" style={styles.contagemPacote}>
            {`${recebidosCount}/${PACOTE_PRE_SINAL_ITENS.length} recebidos`}
          </Texto>
        </View>
        <View style={styles.listaPacote}>
          {PACOTE_PRE_SINAL_ITENS.map((item, idx) => {
            const est = estadosPacote[item.id] ?? "faltando";
            return (
              <Pressable
                key={item.id}
                testID={`pacote-item-${idx}`}
                accessibilityRole="button"
                onPress={() =>
                  setEstadosPacote((prev) => ({
                    ...prev,
                    [item.id]: proximoEstadoPacote(prev[item.id] ?? "faltando"),
                  }))
                }
                style={[
                  styles.linhaPacote,
                  idx > 0
                    ? { borderTopWidth: 1, borderTopColor: cor("cor-linha") }
                    : undefined,
                ]}
              >
                <View style={styles.pacoteEsq}>
                  <Texto tipo="apoio" style={styles.pacoteTitulo}>
                    {item.titulo}
                  </Texto>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.pacoteSub}>
                    {item.validade}
                  </Texto>
                </View>
                <Texto
                  tipo="etiqueta"
                  cor={
                    est === "recebido"
                      ? "cor-salvia-escura"
                      : est === "vencido"
                        ? "cor-barro-texto"
                        : "cor-texto-apoio"
                  }
                  style={styles.pacoteEstado}
                >
                  {rotuloEstadoPacote(est)}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Scanner local de matricula, ata ou convencao colada */}
      <View style={[styles.secao, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
        <Pressable
          testID="toggle-leitor-rapido-doc"
          accessibilityRole="button"
          accessibilityState={{ expanded: verLeitorDoc }}
          onPress={() => setVerLeitorDoc((v) => !v)}
          style={styles.botaoVerScript}
        >
          <Texto tipo="etiqueta" style={styles.subTitulo}>
            Ler trecho de matrícula, ata ou convenção (no aparelho)
          </Texto>
          <Texto tipo="apoio" cor="cor-azul-cadastral" style={styles.acaoVer}>
            {verLeitorDoc ? "Fechar" : "Colar texto"}
          </Texto>
        </Pressable>

        {verLeitorDoc ? (
          <View style={styles.blocoLeitorDoc}>
            <TextInput
              testID="input-texto-documento"
              multiline
              numberOfLines={4}
              value={textoColado}
              onChangeText={setTextoColado}
              placeholder="Cole trechos de matrícula (R-n/CNM), ata ou convenção para checar ônus, cota extra ou vaga presa…"
              placeholderTextColor={cor("cor-texto-apoio")}
              style={[
                styles.campoDoc,
                {
                  backgroundColor: cor("cor-papel-claro"),
                  color: cor("cor-texto"),
                },
              ]}
            />
            {textoColado.trim().length > 0 ? (
              <View style={styles.resultadoDoc}>
                <Texto tipo="etiqueta" style={styles.subTitulo}>
                  {`Detectado: ${leituraDoc.classeRotulo}${
                    leituraDoc.cnmFormatada ? ` · CNM ${leituraDoc.cnmFormatada}` : ""
                  }`}
                </Texto>
                <View testID="observabilidade-leitura-doc" style={styles.blocoObservabilidade}>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoObs}>
                    {`Lido neste recorte: ${
                      leituraDoc.camposReconhecidos.length > 0
                        ? leituraDoc.camposReconhecidos.join(", ")
                        : "somente texto corrido sem identificação estruturada"
                    }.`}
                  </Texto>
                  {leituraDoc.camposAusentesNoTrecho.length > 0 ? (
                    <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoObs}>
                      {`Ausente neste recorte: ${leituraDoc.camposAusentesNoTrecho.join(", ")}.`}
                    </Texto>
                  ) : null}
                </View>
                {leituraDoc.onusAtivosResumo.map((o, i) => (
                  <View
                    key={`onus-${i}`}
                    style={[styles.achadoDocLinha, { borderLeftColor: cor("cor-barro") }]}
                  >
                    <Texto tipo="etiqueta" cor="cor-barro-texto" style={styles.textoAchadoTit}>
                      {`${o.atoNumero} · ${o.titulo}`}
                    </Texto>
                    <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoAchadoCit}>
                      {o.citacao}
                    </Texto>
                  </View>
                ))}
                {leituraDoc.alertasCondoScanResumo.map((a, i) => (
                  <View
                    key={`cs-${i}`}
                    style={[
                      styles.achadoDocLinha,
                      {
                        borderLeftColor: cor(
                          a.severidade === "critico" ? "cor-barro" : "cor-acao",
                        ),
                      },
                    ]}
                  >
                    <Texto
                      tipo="etiqueta"
                      cor={a.severidade === "critico" ? "cor-barro-texto" : "cor-texto"}
                      style={styles.textoAchadoTit}
                    >
                      {a.titulo}
                    </Texto>
                    <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoAchadoCit}>
                      {a.citacao}
                    </Texto>
                  </View>
                ))}
                {leituraDoc.onusAtivosResumo.length === 0 &&
                leituraDoc.alertasCondoScanResumo.length === 0 ? (
                  <Texto tipo="apoio" cor="cor-salvia-escura" style={styles.resumoCalc}>
                    Nenhum gravame ativo nem alerta de cota extra ou vaga presa encontrado neste trecho.
                  </Texto>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Simulador instantaneo de fundo de reserva vs obra (CondoScan R5) */}
      <View style={[styles.secao, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
        <View style={styles.linhaTopoCalc}>
          <Texto tipo="etiqueta" style={styles.subTitulo}>
            Simulador de rateio por obra
          </Texto>
          <Texto
            tipo="numero"
            cor={rateio.cobertoPelaReserva ? "cor-salvia-escura" : "cor-barro-texto"}
            style={styles.valorRateio}
          >
            {rateio.cobertoPelaReserva
              ? "Coberto pelo caixa"
              : `~${formatarReais(rateio.cotaExtraPorUnidadeReais)}/unid.`}
          </Texto>
        </View>

        <View style={styles.chipsRow}>
          {CENARIOS_OBRA.map((c) => {
            const ativo = custoObra === c.valor;
            return (
              <Pressable
                key={c.valor}
                testID={`calc-obra-${c.valor}`}
                accessibilityRole="button"
                onPress={() => setCustoObra(c.valor)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: ativo
                      ? cor("cor-texto")
                      : cor("cor-papel-claro"),
                  },
                ]}
              >
                <Texto
                  tipo="apoio"
                  cor={ativo ? "cor-superficie" : "cor-texto"}
                  style={styles.textoChip}
                >
                  {c.label}
                </Texto>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.chipsRow}>
          {CENARIOS_RESERVA.map((r) => {
            const ativo = saldoReserva === r.valor;
            return (
              <Pressable
                key={r.valor}
                testID={`calc-reserva-${r.valor}`}
                accessibilityRole="button"
                onPress={() => setSaldoReserva(r.valor)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: ativo
                      ? cor("cor-azul-cadastral")
                      : cor("cor-papel-claro"),
                  },
                ]}
              >
                <Texto
                  tipo="apoio"
                  cor={ativo ? "cor-superficie" : "cor-texto"}
                  style={styles.textoChip}
                >
                  {r.label}
                </Texto>
              </Pressable>
            );
          })}
        </View>

        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.resumoCalc}>
          {unidades
            ? rateio.resumoCurto
            : `${rateio.resumoCurto} Base ilustrativa de ${unidadesBase} unidades (${formatarReaisCompacto(custoObra)} − ${formatarReaisCompacto(saldoReserva)}).`}
        </Texto>
      </View>

      {/* Roteiro fechado em 3 perguntas + copiar WhatsApp (Eli R23 + R32) */}
      <View style={[styles.secao, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: verPerguntas }}
          onPress={() => setVerPerguntas((v) => !v)}
          style={styles.botaoVerScript}
        >
          <Texto tipo="etiqueta" style={styles.subTitulo}>
            Script fechado com 3 perguntas ao síndico
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.acaoVer}>
            {verPerguntas ? "Ocultar" : "Ler roteiro"}
          </Texto>
        </Pressable>

        {verPerguntas ? (
          <Texto tipo="apoio" cor="cor-texto" style={styles.textoScript}>
            {script}
          </Texto>
        ) : null}

        <Pressable
          testID="copiloto-copiar-3-perguntas"
          accessibilityRole="button"
          onPress={copiarPerguntas}
          style={({ pressed }) => [
            styles.botaoCopiar,
            {
              backgroundColor: copiado
                ? cor("cor-salvia-suave")
                : cor("cor-papel-claro"),
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Texto
            tipo="etiqueta"
            cor={copiado ? "cor-salvia-escura" : "cor-texto"}
            style={styles.textoBotaoCopiar}
          >
            {copiado
              ? "3 perguntas copiadas! Cole no WhatsApp"
              : "Copiar 3 perguntas para síndico / corretor"}
          </Texto>
        </Pressable>

        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.avisoIndep}>
          {AVISO_LEITURA_INDEPENDENTE}
        </Texto>
      </View>

      {/* Prazos de referência pré-sinal e orientação CNIB / ONR (B4 / ONR app26) */}
      <View style={[styles.secao, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
        <Pressable
          testID="toggle-prazos-pre-sinal"
          accessibilityRole="button"
          accessibilityState={{ expanded: verPrazos }}
          onPress={() => setVerPrazos((v) => !v)}
          style={styles.botaoVerScript}
        >
          <Texto tipo="etiqueta" style={styles.subTitulo}>
            Prazos de referência das certidões e CNIB
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.acaoVer}>
            {verPrazos ? "Ocultar" : "Ver prazos"}
          </Texto>
        </Pressable>

        {verPrazos ? (
          <View testID="lista-prazos-pre-sinal" style={styles.listaPrazos}>
            {PRAZOS_REFERENCIA_PRE_SINAL.map((p, idx) => (
              <View
                key={p.id}
                style={[
                  styles.linhaPrazo,
                  idx > 0
                    ? { borderTopWidth: 1, borderTopColor: cor("cor-linha") }
                    : undefined,
                ]}
              >
                <View style={styles.linhaTopoCalc}>
                  <Texto tipo="apoio" style={styles.pacoteTitulo}>
                    {p.titulo}
                  </Texto>
                  <Texto tipo="numero" cor="cor-azul-cadastral" style={styles.prazoValor}>
                    {p.prazo}
                  </Texto>
                </View>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.pacoteSub}>
                  {`Referência processual antes do sinal · ${p.origem}`}
                </Texto>
              </View>
            ))}
            <View testID="alertas-diligencia-recife">
              {ALERTAS_DILIGENCIA_RECIFE_2026.map((a) => (
                <View
                  key={a.id}
                  style={[styles.linhaPrazo, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}
                >
                  <Texto tipo="apoio" style={styles.pacoteTitulo}>
                    {a.titulo}
                  </Texto>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoObs}>
                    {a.detalhe}
                  </Texto>
                </View>
              ))}
            </View>
            <View style={[styles.linhaPrazo, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoObs}>
                {ORIENTACAO_CNIB_ONR}
              </Texto>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    overflow: "hidden",
  },
  secao: {
    padding: 16,
    gap: 9,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  manchete: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  chavesLinha: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 2,
  },
  chaveItem: {
    flexGrow: 1,
    gap: 2,
  },
  chaveRotulo: {
    fontSize: 11,
  },
  chaveValor: {
    fontSize: 12.5,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  contagemPacote: {
    fontSize: 11.5,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  listaPacote: {
    gap: 0,
  },
  linhaPacote: {
    minHeight: TOQUE_MINIMO,
    paddingVertical: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  pacoteEsq: {
    flex: 1,
    gap: 1,
  },
  pacoteTitulo: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  pacoteSub: {
    fontSize: 11,
  },
  pacoteEstado: {
    fontSize: 12,
    fontWeight: "700",
  },
  blocoLeitorDoc: {
    gap: 8,
  },
  campoDoc: {
    borderRadius: RAIO.quadrado,
    padding: 10,
    minHeight: 72,
    fontFamily: "PlusJakartaSans",
    fontSize: 12.5,
    textAlignVertical: "top",
  },
  resultadoDoc: {
    gap: 6,
  },
  achadoDocLinha: {
    borderLeftWidth: 3,
    paddingLeft: 9,
    gap: 2,
  },
  textoAchadoTit: {
    fontSize: 12,
    fontWeight: "700",
  },
  textoAchadoCit: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  linhaTopoCalc: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 8,
  },
  subTitulo: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  valorRateio: {
    fontSize: 14.5,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.pilula,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  textoChip: {
    fontSize: 11.5,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  resumoCalc: {
    fontSize: 12,
    lineHeight: 17,
    fontVariant: ["tabular-nums"],
  },
  botaoVerScript: {
    minHeight: TOQUE_MINIMO,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  blocoObservabilidade: {
    gap: 2,
    paddingBottom: 2,
  },
  textoObs: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  listaPrazos: {
    gap: 0,
  },
  linhaPrazo: {
    paddingVertical: 7,
    gap: 2,
  },
  prazoValor: {
    fontSize: 11.5,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  acaoVer: {
    fontSize: 12,
    fontWeight: "600",
  },
  textoScript: {
    fontSize: 12,
    lineHeight: 18,
  },
  botaoCopiar: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotaoCopiar: {
    fontSize: 13,
    fontWeight: "700",
  },
  avisoIndep: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
