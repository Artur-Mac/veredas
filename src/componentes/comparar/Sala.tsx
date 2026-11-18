// Sala de decisão (15/11/2026): o botão do Comparar e a tela que abre o link. Sem servidor: o pacote viaja no fragmento
// do link (#s=… / #r=…), que o navegador não manda para servidor nenhum.
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import { Platform, Share, TextInput, View } from "react-native";
import type { AnaliseV2 } from "../../dados/contratos";
import { formatarNumero, formatarReais } from "../../dados/formatos";
import { fragmentoDaResposta, fragmentoDaSala, importarResposta, montarSala, REACOES, type Reacao, type RespostaDaSala, type ResumoCompartilhado, type Sala } from "../../dados/salaDeDecisao";
import { useAnalises } from "../../estado/Analises";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Nota } from "../dossie-v1/base";
import { AlvoDeToque } from "../Pressionavel";
import { Texto } from "../Texto";
import { CartaoResumoCompartilhado } from "./CartaoResumoCompartilhado";

/** Link da sala: na web, a origem atual + /sala#…; no aparelho, o esquema do app com ?d= (o # pode se perder). */
export function linkDaSala(fragmento: string): string {
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.origin}/sala#${fragmento}`;
  return `${Linking.createURL("/sala")}?d=${encodeURIComponent(fragmento)}`;
}

function CaixaDoLink({ link, rotulo }: { link: string; rotulo: string }) {
  const { cor } = useTema();
  const [aviso, setAviso] = useState("");
  return (
    <View style={{ gap: 8 }}>
      <Texto tipo="apoio" selectable numberOfLines={3} style={{ fontSize: 11.5, lineHeight: 16, fontVariant: ["tabular-nums"], padding: 8, borderRadius: 8, backgroundColor: cor("cor-papel-claro") }}>{link}</Texto>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Botao rotulo="Copiar link" variante="secundario" onPress={() => void Clipboard.setStringAsync(link).then(() => setAviso("Link copiado."), () => setAviso("Não deu para copiar: selecione o link acima."))} />
        <Botao rotulo="Enviar" variante="secundario" onPress={() => void Share.share({ message: `${rotulo}\n${link}` }).catch(() => setAviso("Não deu para abrir o compartilhamento."))} />
      </View>
      {aviso ? <Texto tipo="apoio" role="status" cor="cor-texto-apoio">{aviso}</Texto> : null}
    </View>
  );
}

/** No Comparar: monta o link com as 2 ou 3 análises da comparação. */
export function CompartilharSala({ analises }: { analises: readonly AnaliseV2[] }) {
  const [link, setLink] = useState<string | null>(null);
  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      <Botao rotulo="Compartilhar comparação (voto e notas)" variante="secundario" onPress={() => setLink(linkDaSala(fragmentoDaSala(montarSala(analises, new Date().toISOString()))))} />
      {link ? (
        <>
          <CaixaDoLink link={link} rotulo="Comparação de imóveis no Vereda: marque o que faz sentido e me mande o link de resposta." />
          <Nota>Vai no link: nome, bairro, link do anúncio, preço, condomínio, IPTU, área, quartos, vagas e andar. Não vai: caderno, notas, visita nem o perfil da casa. Nada passa por servidor.</Nota>
        </>
      ) : null}
    </View>
  );
}

const valor = (v: number | null, f: (n: number) => string) => (v === null ? "A confirmar" : f(v));

/** A tela do link: a outra pessoa vota; quem compartilhou importa a resposta; ou exibe dossiê único #v=. */
export function TelaDaSala({
  sala,
  resposta,
  resumo = null,
}: {
  sala: Sala | null;
  resposta: RespostaDaSala | null;
  resumo?: ResumoCompartilhado | null;
}) {
  const { cor } = useTema();
  const { lista, salvar } = useAnalises();
  const [autor, setAutor] = useState("");
  const [votos, setVotos] = useState<Record<string, { reacao: Reacao | null; nota: string }>>({});
  const [link, setLink] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  if (resumo) {
    return <CartaoResumoCompartilhado resumo={resumo} />;
  }

  if (resposta) {
    const nossas = resposta.respostas.filter((r) => lista.some((a) => a.id === r.id));
    const importar = async () => {
      const novas = importarResposta(resposta, lista, new Date().toISOString());
      try {
        for (const a of novas) await salvar(a);
        setAviso(novas.length ? `${novas.length === 1 ? "1 análise recebeu" : `${novas.length} análises receberam`} a resposta no diário do caderno.` : "Nada novo para importar (já importado ou sem reação).");
      } catch { setAviso("Não foi possível salvar. Tente de novo."); }
    };
    return (
      <View style={{ gap: 12 }}>
        <Texto tipo="secao" role="heading" style={{ fontSize: 18, fontWeight: "600" }}>{`Resposta de ${resposta.autor.trim() || "outra pessoa"}`}</Texto>
        {resposta.respostas.map((r, idx) => {
          const a = lista.find((x) => x.id === r.id);
          return (
            <View key={r.id} style={{ paddingVertical: 10, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: cor("cor-linha"), gap: 2 }}>
              <Texto style={{ fontWeight: "600" }}>{a?.nome ?? "Análise que não está neste aparelho"}</Texto>
              <Texto tipo="apoio">{`${r.reacao ? REACOES.find((x) => x.valor === r.reacao)!.rotulo : "Sem reação"}${r.nota ? ` — ${r.nota}` : ""}`}</Texto>
            </View>
          );
        })}
        {nossas.length ? <Botao rotulo="Importar para o meu caderno" variante="principal" onPress={() => void importar()} /> : <Texto tipo="apoio" role="alert">Estas análises não estão neste aparelho: abra o link no aparelho que compartilhou a comparação.</Texto>}
        {aviso ? <Texto tipo="apoio" role="status">{aviso}</Texto> : null}
      </View>
    );
  }
  if (!sala) return null;
  const gerar = () => {
    const r: RespostaDaSala = { v: 1, sala: sala.sala, autor: autor.trim().slice(0, 40), em: new Date().toISOString(), respostas: sala.imoveis.map((i) => ({ id: i.id, reacao: votos[i.id]?.reacao ?? null, nota: (votos[i.id]?.nota ?? "").slice(0, 500) })) };
    setLink(linkDaSala(fragmentoDaResposta(r)));
  };
  return (
    <View style={{ gap: 12 }}>
      <Texto tipo="secao" role="heading" style={{ fontSize: 18, fontWeight: "600" }}>Sala de decisão</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio">Marque o que faz sentido em cada imóvel e devolva o link de resposta para quem compartilhou. Nada fica salvo em servidor.</Texto>
      {sala.imoveis.map((i) => {
        const v = votos[i.id] ?? { reacao: null, nota: "" };
        return (
          <View key={i.id} style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: cor("cor-linha"), backgroundColor: cor("cor-superficie"), gap: 6 }} role="group" aria-label={i.nome}>
            <Texto style={{ fontWeight: "600", fontSize: 15 }}>{i.nome}</Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio">{[i.bairro, i.modalidade === "compra" ? "Compra" : "Aluguel"].filter(Boolean).join(" · ")}</Texto>
            <Texto tipo="apoio" style={{ fontVariant: ["tabular-nums"], fontSize: 12 }}>
              {`${i.modalidade === "compra" ? "Preço" : "Aluguel"}: ${valor(i.preco, formatarReais)} · Condomínio: ${valor(i.condominio, formatarReais)} · IPTU: ${valor(i.iptu, formatarReais)}`}
            </Texto>
            <Texto tipo="apoio" style={{ fontVariant: ["tabular-nums"], fontSize: 12 }}>
              {`Área: ${valor(i.area, (n) => `${formatarNumero(n)} m²`)} · Quartos: ${valor(i.quartos, String)} · Vagas: ${valor(i.vagas, String)} · Andar: ${valor(i.andar, (n) => `${n}º`)}`}
            </Texto>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityRole="radiogroup" aria-label={`Reação a ${i.nome}`}>
              {REACOES.map((r) => {
                const ativo = v.reacao === r.valor;
                return (
                  <AlvoDeToque key={r.valor} onPress={() => setVotos((x) => ({ ...x, [i.id]: { ...v, reacao: ativo ? null : r.valor } }))} accessibilityRole="radio" accessibilityState={{ checked: ativo }} aria-checked={ativo}
                    style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: ativo ? cor("cor-acao") : cor("cor-linha"), backgroundColor: ativo ? comAlfa(cor("cor-acao"), 0.14) : "transparent" }}>
                    <Texto tipo="apoio" style={{ fontWeight: "600" }}>{r.rotulo}</Texto>
                  </AlvoDeToque>
                );
              })}
            </View>
            <TextInput value={v.nota} onChangeText={(t) => setVotos((x) => ({ ...x, [i.id]: { ...v, nota: t } }))} maxLength={500} multiline accessibilityLabel={`Nota sobre ${i.nome}`} placeholder="Nota (opcional)" placeholderTextColor={cor("cor-texto-apoio")}
              style={{ minHeight: 44, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: cor("cor-linha"), color: cor("cor-texto"), fontFamily: "PlusJakartaSans", fontSize: 13 }} />
          </View>
        );
      })}
      <TextInput value={autor} onChangeText={setAutor} maxLength={40} accessibilityLabel="Seu nome ou apelido (opcional)" placeholder="Seu nome ou apelido (opcional)" placeholderTextColor={cor("cor-texto-apoio")}
        style={{ minHeight: 44, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: cor("cor-linha"), color: cor("cor-texto"), fontFamily: "PlusJakartaSans", fontSize: 13 }} />
      <Botao rotulo="Gerar link de resposta" variante="principal" onPress={gerar} />
      {link ? <CaixaDoLink link={link} rotulo="Minha resposta à comparação no Vereda." /> : null}
    </View>
  );
}
