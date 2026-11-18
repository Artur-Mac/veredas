// "Exportar pacote para especialista (advogado / vistoriador)" (15/11/2026): cartão padronizado para imprimir/PDF ou baixar
// .md e .html. Na web, o arquivo é gerado no próprio navegador; no aparelho, a impressão usa expo-print.
import * as Clipboard from "expo-clipboard";
import * as Print from "expo-print";
import { useState } from "react";
import { Platform, View } from "react-native";
import type { AnaliseV2, VisaoDoDossie } from "../../dados/contratos";
import type { ItemDaFicha } from "../../dados/dossie/fichaViva";
import {
  auditarConjuntoDocumental,
  gerarPedidoDocumentosFaltantes,
  gerarRoteiroTresPerguntasSindico,
  montarPacote,
  pacoteEmHtml,
  pacoteEmMarkdown,
} from "../../dados/pacoteEspecialista";
import { useTema } from "../../tema/Tema";
import { Botao } from "../Botao";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Nota } from "./base";

function baixar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: `${tipo};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PacoteParaEspecialista({ analise, visao, ficha, anoConstrucao = null }: { analise: AnaliseV2; visao: VisaoDoDossie; ficha: readonly ItemDaFicha[]; /** Ano de construção do prédio, para o prazo da vistoria predial (Lei PE 13.032/2006). */ anoConstrucao?: number | null }) {
  const { cor } = useTema();
  const [aviso, setAviso] = useState<{ texto: string; tipo: "ok" | "erro" } | null>(null);
  const [controleAberto, setControleAberto] = useState(false);
  const agoraIso = new Date().toISOString();
  const auditoria = auditarConjuntoDocumental(analise, agoraIso, { anoConstrucao });
  const pacote = () => montarPacote({ analise, visao, ficha, perguntas: visao.perguntas, agora: new Date().toISOString() });
  const nome = `vereda-pacote-${analise.id}`;
  const web = Platform.OS === "web" && typeof document !== "undefined";
  const imprimir = async () => {
    const html = pacoteEmHtml(pacote());
    try {
      if (web) {
        const janela = window.open("", "_blank");
        if (!janela) { setAviso({ texto: "O navegador bloqueou o pop-up. Use \"Baixar .html\" e imprima de lá.", tipo: "erro" }); return; }
        janela.document.write(html); janela.document.close(); janela.focus(); janela.print();
      } else await Print.printAsync({ html });
    } catch { setAviso({ texto: "Não foi possível abrir a impressão agora.", tipo: "erro" }); }
  };
  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(pacoteEmMarkdown(pacote()));
      setAviso({ texto: "Dossiê técnico (.md) copiado para colar ou enviar.", tipo: "ok" });
    } catch { setAviso({ texto: "Não foi possível copiar o texto agora.", tipo: "erro" }); }
  };
  const copiarPedidoFaltantes = async () => {
    try {
      await Clipboard.setStringAsync(gerarPedidoDocumentosFaltantes(analise, auditoria));
      setAviso({ texto: "Pedido de documentos pendentes copiado para enviar.", tipo: "ok" });
    } catch { setAviso({ texto: "Não foi possível copiar o pedido agora.", tipo: "erro" }); }
  };
  const copiarPerguntasSindico = async () => {
    try {
      await Clipboard.setStringAsync(
        gerarRoteiroTresPerguntasSindico(analise.nome, analise.declarados.condominio.valor),
      );
      setAviso({ texto: "3 perguntas rápidas para o síndico copiadas.", tipo: "ok" });
    } catch { setAviso({ texto: "Não foi possível copiar o roteiro agora.", tipo: "erro" }); }
  };
  const temPendencia = auditoria.faltantes > 0 || auditoria.desatualizados > 0;
  return (
    <View
      style={{
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: cor("cor-linha-forte"),
        backgroundColor: cor("cor-superficie"),
        gap: 10,
      }}
      role="group"
      aria-label="Pacote para especialista"
    >
      <View style={{ gap: 3 }}>
        <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 16, fontWeight: "700" }}>
          Para advogado ou vistoriador
        </Texto>
        <Texto tipo="secao" style={{ fontSize: 18, lineHeight: 24, fontWeight: "700" }}>
          Exportar dossiê técnico
        </Texto>
      </View>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 13.5, lineHeight: 19 }}>
        Gera um documento organizado com ficha do prédio, divergências do anúncio, histórico estrutural, atas e perguntas da visita.
      </Texto>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
        <Botao rotulo="Imprimir / Salvar PDF" variante="secundario" onPress={() => void imprimir()} />
        <Botao rotulo="Copiar texto (.md)" variante="secundario" onPress={() => void copiar()} />
        {web ? <Botao rotulo="Baixar .html" variante="secundario" onPress={() => baixar(`${nome}.html`, pacoteEmHtml(pacote()), "text/html")} /> : null}
        {web ? <Botao rotulo="Baixar .md" variante="secundario" onPress={() => baixar(`${nome}.md`, pacoteEmMarkdown(pacote()), "text/markdown")} /> : null}
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 10, marginTop: 2, gap: 6 }}>
        <Pressionavel
          testID="pacote-toggle-controle-documentos"
          accessibilityRole="button"
          accessibilityState={{ expanded: controleAberto }}
          accessibilityLabel={`Controle do pacote: ${auditoria.guardados} de ${auditoria.totalObrigatorios} guardados. ${auditoria.resumoCurto}. ${controleAberto ? "Ocultar checklist" : "Conferir checklist"}`}
          onPress={() => setControleAberto((v) => !v)}
          style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 4 }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Texto tipo="apoio" style={{ fontSize: 13, lineHeight: 18, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
              {`Controle do pacote: ${auditoria.guardados} de ${auditoria.totalObrigatorios} guardados`}
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17, fontVariant: ["tabular-nums"] }}>
              {auditoria.resumoCurto}
            </Texto>
          </View>
          <Texto tipo="apoio" cor="cor-azul-cadastral" style={{ fontSize: 12.5, lineHeight: 17, fontWeight: "600" }}>
            {controleAberto ? "Ocultar checklist" : "Conferir checklist"}
          </Texto>
        </Pressionavel>
        {controleAberto ? (
          <View testID="pacote-lista-documentos" style={{ gap: 2 }}>
            {auditoria.itens.map((item) => {
              const corPonto =
                item.estado === "recebido"
                  ? cor("cor-salvia-escura")
                  : item.estado === "desatualizado"
                    ? cor("cat-ipe-amarelo")
                    : cor("cor-barro-texto");
              const corRotulo =
                item.estado === "recebido"
                  ? "cor-salvia-escura"
                  : item.estado === "desatualizado"
                    ? "cor-barro-texto"
                    : "cor-texto-apoio";
              return (
                <View
                  key={item.id}
                  style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingVertical: 8, gap: 2 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: corPonto }} />
                      <Texto tipo="apoio" style={{ fontSize: 13, lineHeight: 18, fontWeight: "600", flexShrink: 1 }}>
                        {item.titulo}
                      </Texto>
                    </View>
                    <Texto tipo="apoio" cor={corRotulo} style={{ fontSize: 11.5, lineHeight: 16, fontWeight: "700" }}>
                      {item.rotuloEstado}
                    </Texto>
                  </View>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17, fontVariant: ["tabular-nums"] }}>
                    {item.detalhe}
                  </Texto>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>
                    {item.referencia}
                  </Texto>
                </View>
              );
            })}
            {temPendencia ? (
              <Pressionavel
                testID="pacote-copiar-pedido-faltantes"
                accessibilityRole="button"
                accessibilityLabel="Copiar pedido do que falta"
                onPress={() => void copiarPedidoFaltantes()}
                style={{
                  minHeight: 44,
                  marginTop: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: cor("cor-sutil"),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Texto tipo="apoio" cor="cor-azul-cadastral" style={{ fontSize: 13, lineHeight: 18, fontWeight: "700" }}>
                  Copiar pedido do que falta
                </Texto>
              </Pressionavel>
            ) : null}
            <Pressionavel
              testID="pacote-copiar-perguntas-sindico"
              accessibilityRole="button"
              accessibilityLabel="Copiar 3 perguntas rápidas para o síndico"
              onPress={() => void copiarPerguntasSindico()}
              style={{
                minHeight: 44,
                marginTop: 6,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: cor("cor-papel-claro"),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Texto tipo="apoio" cor="cor-texto" style={{ fontSize: 13, lineHeight: 18, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                Copiar 3 perguntas para o síndico
              </Texto>
            </Pressionavel>
          </View>
        ) : null}
      </View>
      {aviso ? (
        <Texto
          tipo="apoio"
          cor={aviso.tipo === "erro" ? "cor-barro-texto" : "cor-salvia-escura"}
          role={aviso.tipo === "erro" ? "alert" : "status"}
          style={{ fontSize: 13, fontWeight: "600" }}
        >
          {aviso.texto}
        </Texto>
      ) : null}
      <Nota>Ficam de fora por privacidade: orçamento pessoal, acessibilidade, fotos e diário.</Nota>
    </View>
  );
}
