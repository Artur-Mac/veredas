// Leitor de ata, convenção e balancete (15/11/2026): à esquerda (ou em cima, no celular) o trecho literal com a página;
// ao lado, o tema. Cola o texto ou escolhe um .txt (navegador). PDF: copie o texto do PDF e cole (o app não traz um leitor
// de PDF). Nada é salvo sozinho: "Guardar no caderno" cria um documento "a confirmar" com os trechos achados.
import { useMemo, useState } from "react";
import { Platform, View } from "react-native";
import type { Caderno } from "../../dados/caderno";
import { lerAta, ROTULO_DO_TEMA, type AchadoDaAta, type TipoDeDocumento } from "../../dados/leitorDeAta";
import { useTema } from "../../tema/Tema";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, EscolhaLocal, GrupoLocal } from "./blocos";

type Salvar = (mudar: (c: Caderno) => Caderno) => Promise<boolean>;

/** Escolher um .txt no navegador (sem biblioteca): input de arquivo criado na hora. */
function escolherTxt(): Promise<string | null> {
  return new Promise((resolver) => {
    if (Platform.OS !== "web" || typeof document === "undefined") { resolver(null); return; }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,text/plain";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f || f.size > 2 * 1024 * 1024) { resolver(null); return; }
      const leitor = new FileReader();
      leitor.onload = () => resolver(typeof leitor.result === "string" ? leitor.result : null);
      leitor.onerror = () => resolver(null);
      leitor.readAsText(f);
    };
    input.click();
  });
}

function Trecho({ a }: { a: AchadoDaAta }) {
  const { cor } = useTema();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: cor("cor-linha") }}>
      <View style={{ flexGrow: 3, flexBasis: 220, borderLeftWidth: 3, borderLeftColor: cor(a.secao === "financeiro" ? "cor-barro" : "cor-azul-cadastral"), paddingLeft: 8 }}>
        <Texto selectable style={{ fontSize: 12.5, lineHeight: 18, fontStyle: "italic" }}>{`“${a.trecho}”`}</Texto>
      </View>
      <View style={{ flexGrow: 1, flexBasis: 110 }}>
        <Texto tipo="apoio" style={{ fontSize: 11.5, fontWeight: "700" }}>{ROTULO_DO_TEMA[a.tema]}</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, fontVariant: ["tabular-nums"] }}>{a.pagina ? `p. ${a.pagina}` : "página não marcada"}</Texto>
      </View>
    </View>
  );
}

export function LeitorDeAta({ salvar }: { salvar: Salvar }) {
  const [tipo, setTipo] = useState<TipoDeDocumento>("ata");
  const [texto, setTexto] = useState("");
  const [lido, setLido] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const leitura = useMemo(() => (lido ? lerAta(lido, tipo) : null), [lido, tipo]);
  const regras = leitura?.achados.filter((a) => a.secao === "regras") ?? [];
  const financeiro = leitura?.achados.filter((a) => a.secao === "financeiro") ?? [];

  const guardar = async () => {
    if (!leitura) return;
    const trecho = leitura.achados.map((a) => `[${ROTULO_DO_TEMA[a.tema]}${a.pagina ? ` · p. ${a.pagina}` : ""}] ${a.trecho}`).join("\n").slice(0, 6000);
    const titulo = tipo === "ata" ? "Ata (trechos do leitor)" : tipo === "convencao" ? "Convenção (trechos do leitor)" : "Balancete (trechos do leitor)";
    const ok = await salvar((c) => ({
      ...c,
      documentos: [...c.documentos, {
        id: `documento-leitor-${Date.now().toString(36)}`, titulo, tipo, inspecaoEm: null, emitidoEm: null, recebidoEm: new Date().toISOString(),
        origem: "Texto colado por você no leitor de ata", escopo: `${leitura.achados.length} trechos achados em ${leitura.paginas} página(s)`, trecho, pagina: leitura.achados.find((a) => a.pagina)?.pagina ?? null, vinculo: "a_confirmar" as const,
      }].slice(-100),
    }));
    setAviso(ok ? "Guardado no caderno como documento \"a confirmar\": confirme que é deste prédio." : "Não foi possível guardar.");
  };

  return (
    <GrupoLocal titulo="Ler ata, convenção ou balancete" apoio="Cole o texto do documento. O leitor separa trechos literais com a página: regras da casa, fatos financeiros e jurídicos citados e perguntas prontas.">
      <EscolhaLocal rotulo="Documento" valor={tipo} opcoes={[{ valor: "ata", rotulo: "Ata (AGO/AGE)" }, { valor: "convencao", rotulo: "Convenção" }, { valor: "balancete", rotulo: "Balancete" }]} aoEscolher={setTipo} />
      <CampoLocal rotulo="Texto do documento" value={texto} onChangeText={setTexto} multiline maxLength={200000} placeholder="Cole aqui. No celular: abra o PDF, selecione tudo, copie." />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Botao rotulo="Ler o texto" variante="principal" desativado={!texto.trim()} onPress={() => { setLido(texto); setAviso(""); }} />
        {Platform.OS === "web" ? <Botao rotulo="Escolher arquivo .txt" variante="secundario" onPress={() => void escolherTxt().then((t) => { if (t) { setTexto(t); setLido(t); } else setAviso("Não deu para ler o arquivo (só .txt de até 2 MB)."); })} /> : null}
      </View>
      {leitura ? (
        <View style={{ gap: 12 }}>
          <Texto tipo="apoio" role="status">{`${leitura.achados.length} trechos em ${leitura.paginas} página(s). Cada trecho é cópia literal do texto; confira no original.`}</Texto>
          <View style={{ gap: 4 }} role="group" aria-label="Regras da casa">
            <Texto style={{ fontWeight: "700" }}>1. Regras da casa</Texto>
            {regras.length ? regras.map((a, i) => <Trecho key={`r${i}`} a={a} />) : <Texto tipo="apoio">Nenhum trecho sobre animais, temporada, obras, vagas, mudança ou silêncio.</Texto>}
          </View>
          <View style={{ gap: 4 }} role="group" aria-label="Fatos financeiros e jurídicos">
            <Texto style={{ fontWeight: "700" }}>2. Fatos financeiros e jurídicos citados</Texto>
            {financeiro.length ? financeiro.map((a, i) => <Trecho key={`f${i}`} a={a} />) : <Texto tipo="apoio">Nenhum trecho sobre chamada extra, fundo de reserva, inadimplência, ações, seguro ou obra aprovada.</Texto>}
          </View>
          <View style={{ gap: 4 }} role="group" aria-label="Perguntas prontas">
            <Texto style={{ fontWeight: "700" }}>3. Perguntas para o síndico ou corretor</Texto>
            {leitura.perguntas.map((q) => <Texto key={q} selectable style={{ fontSize: 13, lineHeight: 19 }}>{`• ${q}`}</Texto>)}
          </View>
          <Botao rotulo="Guardar os trechos no caderno" variante="secundario" desativado={!leitura.achados.length} onPress={() => void guardar()} />
        </View>
      ) : null}
      {aviso ? <Texto tipo="apoio" role="status">{aviso}</Texto> : null}
    </GrupoLocal>
  );
}
