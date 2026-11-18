// "Preparar a negociação" (VE10): cartão padronizado com argumentos marcáveis do dossiê + mensagem editável para enviar ao
// vendedor/corretor. O app não sugere valor de proposta nem usa preço de mercado.
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { AnaliseV2, Edificio, VisaoDoDossie } from "../../dados/contratos";
import { fichaDoDossie } from "../../dados/dossie/fichaViva";
import { fontesDeBarulho } from "../../dados/dossie/simuladorDaUnidade";
import { mensagemDeNegociacao, prepararNegociacao } from "../../dados/negociacao";
import { useTema } from "../../tema/Tema";
import { Botao } from "../Botao";
import { AlvoDeToque } from "../Pressionavel";
import { Texto } from "../Texto";
import { CampoDeTexto } from "../visita-v1/blocos";
import { Nota } from "./base";
import { PacoteParaEspecialista } from "./Pacote";

type Props = { analise: AnaliseV2; visao: VisaoDoDossie; lista: readonly AnaliseV2[]; predio?: Edificio | null; nomeDoBairro?: string };

function categoriaDoArgumento(id: string): string {
  if (id.startsWith("itbi:")) return "Imposto (ITBI)";
  if (id.startsWith("ata:")) return "Ata / condomínio";
  if (id.startsWith("ambiente:")) return "Ambiente";
  if (id.startsWith("taxas:") || id.startsWith("lacuna:")) return "Falta no anúncio";
  if (id.startsWith("historico:")) return "Histórico";
  if (id.startsWith("amostra:")) return "Sua amostra";
  return "Dossiê";
}

function CaixaSelecao({ marcado }: { marcado: boolean }) {
  const { cor } = useTema();
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: marcado ? cor("cor-acao") : cor("cor-linha-forte"),
        backgroundColor: marcado ? cor("cor-acao") : cor("cor-superficie"),
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
      }}
    >
      {marcado ? (
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={cor("cor-sobre-acao")} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <Path d="M20 6 9 17l-5-5" />
        </Svg>
      ) : null}
    </View>
  );
}

export function PrepararNegociacao({ analise, visao, lista, predio = null, nomeDoBairro = "" }: Props) {
  const { cor } = useTema();
  const ficha = useMemo(() => fichaDoDossie({ analise, predio, lista, visao, nomeDoBairro, agora: new Date() }), [analise, predio, lista, visao, nomeDoBairro]);
  const n = useMemo(() => {
    let barulho: { nome: string; distanciaM: number }[] = [];
    try { barulho = predio ? fontesDeBarulho(predio) : []; } catch { barulho = []; }
    return prepararNegociacao(analise, visao, lista, { predio, calor: ficha.calor, barulho });
  }, [analise, visao, lista, predio, ficha.calor]);

  const [desmarcados, setDesmarcados] = useState<string[]>([]);
  const escolhidos = n.argumentos.map((a) => a.id).filter((id) => !desmarcados.includes(id));
  const [aberta, setAberta] = useState(false);
  const [proposta, setProposta] = useState("");
  const [editada, setEditada] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const valorDaProposta = (() => {
    const v = Number(proposta.replace(/\./g, "").replace(",", "."));
    return proposta.trim() && Number.isFinite(v) && v > 0 ? v : null;
  })();
  const gerada = mensagemDeNegociacao(analise, n, escolhidos, valorDaProposta);
  const texto = editada ?? gerada;
  const destaquesResumo = n.argumentos.filter((a) => a.peso > 0).slice(0, 3);

  return (
    <View style={{ gap: 16, marginTop: 18 }}>
      {n.argumentos.length > 0 || n.total.valor !== null ? (
        <View
          role="region"
          aria-label="Preparar a negociação"
          style={{
            padding: 18,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: cor("cor-linha-forte"),
            backgroundColor: cor("cor-superficie"),
            gap: 12,
          }}
        >
          <View style={{ gap: 4 }}>
            <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 16, fontWeight: "700" }}>
              Antes de propor um valor
            </Texto>
            <Texto tipo="secao" role="heading" style={{ fontSize: 19, lineHeight: 25, fontWeight: "700" }}>
              Preparar a negociação
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13.5, lineHeight: 19 }}>
              Reúna os fatos do dossiê para negociar com base concreta ou gerar uma mensagem pronta.
            </Texto>
          </View>

          <View role="list" aria-label="O que pesa na negociação" style={{ gap: 0 }}>
            <View style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: cor("cor-linha") }}>
              <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>{n.total.texto}</Texto>
            </View>
            {destaquesResumo.map((a) => (
              <View key={a.id} role="listitem" style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 3 }}>
                <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 11.5, fontWeight: "700" }}>
                  {categoriaDoArgumento(a.id)}
                </Texto>
                <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20 }}>{a.fato}</Texto>
              </View>
            ))}
          </View>

          {n.mesmoImovel.length ? (
            <View style={{ paddingVertical: 10, paddingHorizontal: 12, borderLeftWidth: 3, borderLeftColor: cor("cat-ipe-amarelo"), backgroundColor: cor("cor-creme") }}>
              <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 13, lineHeight: 19 }}>
                {`Possível duplicata: ${n.mesmoImovel.map((m) => `"${m.nome}" (${m.motivo})`).join("; ")}.`}
              </Texto>
            </View>
          ) : null}

          <Botao
            rotulo={aberta ? "Fechar construtor de mensagem" : "Montar proposta e mensagem"}
            variante="secundario"
            onPress={() => setAberta((x) => !x)}
          />

          {aberta ? (
            <View style={{ gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: cor("cor-linha") }}>
              <CampoDeTexto
                rotulo={n.aluguel ? "Sua proposta de aluguel mensal (opcional, R$)" : "Sua proposta de compra (opcional, R$)"}
                keyboardType="numeric"
                value={proposta}
                onChangeText={(t) => { setProposta(t); setEditada(null); }}
                placeholder="Deixe em branco para só pedir confirmações"
              />

              <View role="group" aria-label="Fatos incluídos na mensagem" style={{ gap: 6 }}>
                <Texto tipo="corpo" style={{ fontSize: 14, fontWeight: "700" }}>Escolha o que entra na mensagem:</Texto>
                {n.argumentos.map((x) => {
                  const marcado = escolhidos.includes(x.id);
                  return (
                    <AlvoDeToque
                      key={x.id}
                      onPress={() => { setEditada(null); setDesmarcados((d) => (marcado ? [...d, x.id] : d.filter((y) => y !== x.id))); }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: marcado }}
                      aria-checked={marcado}
                      accessibilityLabel={x.fato}
                      style={{
                        minHeight: 48,
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 10,
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: cor("cor-linha"),
                      }}
                    >
                      <CaixaSelecao marcado={marcado} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 11.5, fontWeight: "700" }}>
                          {categoriaDoArgumento(x.id)}
                        </Texto>
                        <Texto tipo="apoio" style={{ fontSize: 13.5, lineHeight: 19, color: cor("cor-texto") }}>{x.fato}</Texto>
                      </View>
                    </AlvoDeToque>
                  );
                })}
              </View>

              <CampoDeTexto rotulo="Mensagem pronta (pode editar livremente)" linhas={8} value={texto} onChangeText={setEditada} maxLength={4000} />

              <Botao
                rotulo="Copiar mensagem"
                variante="principal"
                onPress={() => void Clipboard.setStringAsync(texto).then(() => setAviso("Mensagem copiada! Cole no WhatsApp ou e-mail.")).catch(() => setAviso("Não foi possível copiar automaticamente."))}
              />
              {aviso ? <Texto role="status" tipo="apoio" cor="cor-salvia-escura" style={{ fontSize: 13, fontWeight: "600" }}>{aviso}</Texto> : null}
              <Nota>Texto gerado localmente com seus dados. O VEREDA nunca envia mensagens sozinho.</Nota>
            </View>
          ) : null}
        </View>
      ) : null}

      <PacoteParaEspecialista analise={analise} visao={visao} ficha={ficha.itens} />
    </View>
  );
}
