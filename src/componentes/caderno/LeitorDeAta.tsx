// Leitor de ata, convenção e balancete (15/11/2026): à esquerda (ou em cima, no celular) o trecho literal com a página;
// ao lado, o tema. Cola o texto ou escolhe um .txt (navegador). PDF: copie o texto do PDF e cole (o app não traz um leitor
// de PDF). Nada é salvo sozinho: "Guardar no caderno" cria um documento "a confirmar" com os trechos achados.
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import type { Caderno } from "../../dados/caderno";
import { lerAta, ROTULO_DO_TEMA, type AchadoDaAta, type TemaDoAchado, type TipoDeDocumento } from "../../dados/leitorDeAta";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, EscolhaLocal, GrupoLocal } from "./blocos";

const PRIORIDADES_LEITOR = [
  { id: "animais", rotulo: "Animais", temas: ["animais"] },
  { id: "temporada", rotulo: "Temporada", temas: ["temporada"] },
  { id: "reforma", rotulo: "Reforma", temas: ["obras", "obra_aprovada"] },
  { id: "caixa", rotulo: "Caixa e rateio", temas: ["chamada_extra", "fundo_de_reserva", "inadimplencia", "deficit_orcamentario"] },
  { id: "onus_spu", rotulo: "Ônus e SPU", temas: ["gravames", "restricoes_matricula", "situacao_onus", "regime_spu", "acoes"] },
] as const;

export type ResumoCoberturaDaLeitura = {
  temasEncontrados: number;
  temasAusentes: number;
  prioridadesEncontradas: string[];
  prioridadesAusentes: string[];
  linhaResumo: string;
  linhaPrioridades: string | null;
};

/**
 * Síntese de cobertura do parser (`Cherre R27 §6.5`): quantos temas do roteiro apareceram no trecho,
 * quantos esperados não apareceram e o saldo das prioridades marcadas pela pessoa.
 */
export function resumirCoberturaDaLeitura(
  leitura: ReturnType<typeof lerAta>,
  prioridadesIds: readonly string[],
): ResumoCoberturaDaLeitura {
  const temasPresentes = new Set<TemaDoAchado>(leitura.achados.map((a) => a.tema));
  const temasEncontrados = temasPresentes.size;
  const temasAusentes = leitura.ausentesEsperados.length;

  const prioridadesEncontradas: string[] = [];
  const prioridadesAusentes: string[] = [];
  for (const p of PRIORIDADES_LEITOR) {
    if (!prioridadesIds.includes(p.id)) continue;
    const achou = p.temas.some((t) => temasPresentes.has(t));
    if (achou) prioridadesEncontradas.push(p.rotulo);
    else prioridadesAusentes.push(p.rotulo);
  }

  const linhaResumo = `Cobertura no trecho: ${temasEncontrados} ${temasEncontrados === 1 ? "tema localizado" : "temas localizados"} · ${temasAusentes} ${temasAusentes === 1 ? "esperado sem menção" : "esperados sem menção"}`;

  let linhaPrioridades: string | null = null;
  if (prioridadesEncontradas.length > 0 && prioridadesAusentes.length > 0) {
    linhaPrioridades = `Prioridades marcadas: ${prioridadesEncontradas.join(", ")} com menção · ${prioridadesAusentes.join(", ")} sem menção neste trecho.`;
  } else if (prioridadesEncontradas.length > 0) {
    linhaPrioridades = `Prioridades marcadas com menção: ${prioridadesEncontradas.join(", ")}.`;
  } else if (prioridadesAusentes.length > 0) {
    linhaPrioridades = `Prioridades marcadas sem menção neste trecho: ${prioridadesAusentes.join(", ")}.`;
  }

  return {
    temasEncontrados,
    temasAusentes,
    prioridadesEncontradas,
    prioridadesAusentes,
    linhaResumo,
    linhaPrioridades,
  };
}

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

function Trecho({ a, prioritario = false }: { a: AchadoDaAta; prioritario?: boolean }) {
  const { cor } = useTema();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: cor("cor-linha") }}>
      <View style={{ flexGrow: 3, flexBasis: 220, borderLeftWidth: 3, borderLeftColor: cor(prioritario || a.secao === "financeiro" ? "cor-barro" : "cor-azul-cadastral"), paddingLeft: 8 }}>
        <Texto selectable style={{ fontSize: 12.5, lineHeight: 18, fontStyle: "italic" }}>{`“${a.trecho}”`}</Texto>
      </View>
      <View style={{ flexGrow: 1, flexBasis: 110, gap: 2 }}>
        {prioritario ? (
          <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 11, fontWeight: "700" }}>
            Sua prioridade
          </Texto>
        ) : null}
        <Texto tipo="apoio" style={{ fontSize: 11.5, fontWeight: "700" }}>{ROTULO_DO_TEMA[a.tema]}</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, fontVariant: ["tabular-nums"] }}>{a.pagina ? `p. ${a.pagina}` : "página não marcada"}</Texto>
      </View>
    </View>
  );
}

export function LeitorDeAta({ salvar }: { salvar: Salvar }) {
  const { cor } = useTema();
  const [tipo, setTipo] = useState<TipoDeDocumento>("ata");
  const [prioridades, setPrioridades] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [lido, setLido] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const leitura = useMemo(() => (lido ? lerAta(lido, tipo) : null), [lido, tipo]);

  const temasPrioritarios = useMemo(
    () =>
      new Set<TemaDoAchado>(
        PRIORIDADES_LEITOR.filter((p) => prioridades.includes(p.id)).flatMap((p) => [...p.temas]),
      ),
    [prioridades],
  );
  const ordenarPorPrioridade = (lista: AchadoDaAta[]) =>
    [...lista].sort((a, b) => Number(temasPrioritarios.has(b.tema)) - Number(temasPrioritarios.has(a.tema)));
  const regras = ordenarPorPrioridade(leitura?.achados.filter((a) => a.secao === "regras") ?? []);
  const financeiro = ordenarPorPrioridade(leitura?.achados.filter((a) => a.secao === "financeiro") ?? []);
  const cobertura = useMemo(
    () => (leitura ? resumirCoberturaDaLeitura(leitura, prioridades) : null),
    [leitura, prioridades],
  );

  const alternarPrioridade = (id: string) =>
    setPrioridades((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]));

  const copiarPerguntas = async () => {
    if (!leitura?.perguntas.length) return;
    try {
      await Clipboard.setStringAsync(leitura.perguntas.map((q, i) => `${i + 1}. ${q}`).join("\n"));
      setAviso("Perguntas copiadas para enviar ao síndico ou corretor.");
    } catch {
      setAviso("Não foi possível copiar as perguntas agora.");
    }
  };

  const guardar = async () => {
    if (!leitura) return;
    const trecho = leitura.achados.map((a) => `[${ROTULO_DO_TEMA[a.tema]}${a.pagina ? ` · p. ${a.pagina}` : ""}] ${a.trecho}`).join("\n").slice(0, 6000);
    const titulo =
      tipo === "ata"
        ? "Ata (trechos do leitor)"
        : tipo === "convencao"
          ? "Convenção (trechos do leitor)"
          : tipo === "balancete"
            ? "Balancete (trechos do leitor)"
            : "Matrícula (trechos do leitor)";
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
    <GrupoLocal titulo="Ler ata, convenção, balancete ou matrícula" apoio="Cole o texto do documento. O leitor separa trechos literais com a página, aponta o que não apareceu e gera perguntas prontas.">
      <EscolhaLocal
        rotulo="Documento"
        valor={tipo}
        opcoes={[
          { valor: "ata", rotulo: "Ata (AGO/AGE)" },
          { valor: "convencao", rotulo: "Convenção" },
          { valor: "balancete", rotulo: "Balancete" },
          { valor: "matricula", rotulo: "Matrícula / ônus" },
        ]}
        aoEscolher={setTipo}
      />
      <View testID="leitor-prioridades-intake" style={{ gap: 6 }}>
        <Texto tipo="apoio" cor="cor-texto-apoio">O que mais pesa para você neste imóvel (opcional):</Texto>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {PRIORIDADES_LEITOR.map((p) => {
            const ativo = prioridades.includes(p.id);
            return (
              <Pressable
                key={p.id}
                testID={`leitor-prioridade-${p.id}`}
                onPress={() => alternarPrioridade(p.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                aria-pressed={ativo}
                style={{
                  minHeight: TOQUE_MINIMO,
                  paddingHorizontal: 12,
                  borderRadius: RAIO.pilula,
                  backgroundColor: ativo ? cor("cor-texto") : cor("cor-papel-claro"),
                  justifyContent: "center",
                }}
              >
                <Texto tipo="apoio" cor={ativo ? "cor-papel-claro" : "cor-texto"} style={{ fontSize: 12.5, fontWeight: ativo ? "700" : "500" }}>
                  {p.rotulo}
                </Texto>
              </Pressable>
            );
          })}
        </View>
      </View>
      <CampoLocal rotulo="Texto do documento" value={texto} onChangeText={setTexto} multiline maxLength={200000} placeholder="Cole aqui. No celular: abra o PDF, selecione tudo, copie." />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Botao rotulo="Ler o texto" variante="principal" desativado={!texto.trim()} onPress={() => { setLido(texto); setAviso(""); }} />
        {Platform.OS === "web" ? <Botao rotulo="Escolher arquivo .txt" variante="secundario" onPress={() => void escolherTxt().then((t) => { if (t) { setTexto(t); setLido(t); } else setAviso("Não deu para ler o arquivo (só .txt de até 2 MB)."); })} /> : null}
      </View>
      {leitura ? (
        <View style={{ gap: 12 }}>
          <Texto tipo="apoio" role="status" style={{ fontVariant: ["tabular-nums"] }}>{`${leitura.achados.length} trechos em ${leitura.paginas} página(s). Cada trecho é cópia literal do texto; confira no original.`}</Texto>
          {cobertura ? (
            <View
              testID="leitor-resumo-cobertura"
              style={{
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: cor("cor-linha"),
                gap: 2,
              }}
            >
              <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 17, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                {cobertura.linhaResumo}
              </Texto>
              {cobertura.linhaPrioridades ? (
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
                  {cobertura.linhaPrioridades}
                </Texto>
              ) : null}
            </View>
          ) : null}
          <View style={{ gap: 4 }} role="group" aria-label={tipo === "matricula" ? "Titularidade e restrições" : "Regras da casa"}>
            <Texto style={{ fontWeight: "700" }}>{tipo === "matricula" ? "1. Titularidade e restrições" : "1. Regras da casa"}</Texto>
            {regras.length ? regras.map((a, i) => <Trecho key={`r${i}`} a={a} prioritario={temasPrioritarios.has(a.tema)} />) : <Texto tipo="apoio">{tipo === "matricula" ? "Nenhum trecho sobre proprietário, fração ideal, usufruto ou cláusula restritiva." : "Nenhum trecho sobre animais, temporada, obras, vagas, mudança ou silêncio."}</Texto>}
          </View>
          <View style={{ gap: 4 }} role="group" aria-label={tipo === "matricula" ? "Ônus, marinha (SPU) e averbações" : "Fatos financeiros e jurídicos"}>
            <Texto style={{ fontWeight: "700" }}>{tipo === "matricula" ? "2. Ônus, marinha (SPU) e averbações" : "2. Fatos financeiros e jurídicos citados"}</Texto>
            {financeiro.length ? financeiro.map((a, i) => <Trecho key={`f${i}`} a={a} prioritario={temasPrioritarios.has(a.tema)} />) : <Texto tipo="apoio">{tipo === "matricula" ? "Nenhum trecho sobre gravames, terreno de marinha (SPU) ou averbações." : "Nenhum trecho sobre chamada extra, fundo de reserva, inadimplência, ações, seguro ou obra aprovada."}</Texto>}
          </View>
          {leitura.ausentesEsperados.length ? (
            <View testID="leitor-ausentes-esperados" style={{ gap: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: cor("cor-linha") }}>
              <Texto style={{ fontWeight: "700" }}>O que não apareceu neste texto</Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
                Não constar no trecho colado não confirma ausência — onde checar:
              </Texto>
              {leitura.ausentesEsperados.map((item) => (
                <Texto key={item.tema} tipo="apoio" style={{ fontSize: 12.5, lineHeight: 18 }}>
                  {`• ${item.rotulo}: ${item.ondeConfirmar}`}
                </Texto>
              ))}
            </View>
          ) : null}
          <View style={{ gap: 4 }} role="group" aria-label="Perguntas prontas">
            <Texto style={{ fontWeight: "700" }}>
              {tipo === "matricula" ? "3. Perguntas para cartório, vendedor ou advogado" : "3. Perguntas para o síndico ou corretor"}
            </Texto>
            {leitura.perguntas.map((q) => <Texto key={q} selectable style={{ fontSize: 13, lineHeight: 19 }}>{`• ${q}`}</Texto>)}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Botao rotulo="Guardar os trechos no caderno" variante="secundario" desativado={!leitura.achados.length} onPress={() => void guardar()} />
            <Botao rotulo="Copiar perguntas" variante="secundario" desativado={!leitura.perguntas.length} onPress={() => void copiarPerguntas()} />
          </View>
        </View>
      ) : null}
      {aviso ? <Texto tipo="apoio" role="status">{aviso}</Texto> : null}
    </GrupoLocal>
  );
}
