// "Exportar pacote para especialista (advogado / vistoriador)" (15/11/2026): cartão padronizado para imprimir/PDF ou baixar
// .md e .html. Na web, o arquivo é gerado no próprio navegador; no aparelho, a impressão usa expo-print.
import * as Print from "expo-print";
import { useState } from "react";
import { Platform, View } from "react-native";
import type { AnaliseV2, VisaoDoDossie } from "../../dados/contratos";
import type { ItemDaFicha } from "../../dados/dossie/fichaViva";
import { montarPacote, pacoteEmHtml, pacoteEmMarkdown } from "../../dados/pacoteEspecialista";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { Nota } from "./base";

function baixar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: `${tipo};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PacoteParaEspecialista({ analise, visao, ficha }: { analise: AnaliseV2; visao: VisaoDoDossie; ficha: readonly ItemDaFicha[] }) {
  const { cor } = useTema();
  const [aviso, setAviso] = useState("");
  const pacote = () => montarPacote({ analise, visao, ficha, perguntas: visao.perguntas, agora: new Date().toISOString() });
  const nome = `vereda-pacote-${analise.id}`;
  const web = Platform.OS === "web" && typeof document !== "undefined";
  const imprimir = async () => {
    const html = pacoteEmHtml(pacote());
    try {
      if (web) {
        const janela = window.open("", "_blank");
        if (!janela) { setAviso("O navegador bloqueou o pop-up. Use \"Baixar .html\" e imprima de lá."); return; }
        janela.document.write(html); janela.document.close(); janela.focus(); janela.print();
      } else await Print.printAsync({ html });
    } catch { setAviso("Não foi possível abrir a impressão agora."); }
  };
  return (
    <View
      style={{
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto"), 0.09),
        backgroundColor: cor("cor-superficie"),
        gap: 10,
      }}
      role="group"
      aria-label="Pacote para especialista"
    >
      <View style={{ gap: 3 }}>
        <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 11, lineHeight: 15, fontWeight: "700", letterSpacing: 0.7, textTransform: "uppercase" }}>
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
        {web ? <Botao rotulo="Baixar .html" variante="secundario" onPress={() => baixar(`${nome}.html`, pacoteEmHtml(pacote()), "text/html")} /> : null}
        {web ? <Botao rotulo="Baixar .md" variante="secundario" onPress={() => baixar(`${nome}.md`, pacoteEmMarkdown(pacote()), "text/markdown")} /> : null}
      </View>
      {aviso ? <Texto tipo="apoio" cor="cor-barro-texto" role="alert" style={{ fontSize: 13, fontWeight: "600" }}>{aviso}</Texto> : null}
      <Nota>Ficam de fora por privacidade: orçamento pessoal, acessibilidade, fotos e diário.</Nota>
    </View>
  );
}
