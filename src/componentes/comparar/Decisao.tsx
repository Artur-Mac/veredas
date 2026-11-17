// Resumo da decisão no topo do Comparar (VE01, A01–A03). Só desenha o que `projetarDecisao` (src/dados/decisao.ts) já
// calculou; o único cálculo aqui é o preço da hora poupada, com minutos que a própria pessoa digita (nada é inferido de
// distância). Nada é gravado sem toque: a pergunta só vai para a visita no botão.
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { precoDaHoraPoupada, type Lado, type PrioridadeDaDecisao, type ProjecaoDaDecisao } from "../../dados/decisao";
import { CAMPOS_RESPONDIVEIS, ROTULO_DO_CAMPO, type CampoRespondivel } from "../../dados/resposta";
import { formatarReais } from "../../dados/formatos";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoDeTexto } from "../visita-v1/blocos";
import { BotaoVx, KickerVx, SegmentosVx, SuperficieVx } from "./vx";

const PRIORIDADES: readonly { valor: PrioridadeDaDecisao; rotulo: string }[] = [
  { valor: "custo", rotulo: "Menor custo" },
  { valor: "espaco", rotulo: "Mais espaço" },
];

const NOME_DA_FONTE = { anuncio: "Anúncio", licenciamento: "Prefeitura · licenças de obra, 24 meses", mapa: "Caminho a pé no mapa · OpenStreetMap e Prefeitura" } as const;

type Props = {
  projecao: Extract<ProjecaoDaDecisao, { estado: "pronta" }>;
  aoMudarPrioridade: (p: PrioridadeDaDecisao) => void;
  /** Grava a pergunta no roteiro da visita do imóvel; devolve false quando não coube. */
  aoLevarParaVisita: (alvo: Lado, texto: string) => Promise<boolean>;
  aoPrepararVisita: (alvo: Lado) => void;
  /** VE15: grava o valor confirmado do campo da pergunta e devolve a frase do efeito na escolha. */
  aoResponder?: (alvo: Lado, campo: CampoRespondivel, valor: number, periodo: "mes" | "ano" | null) => Promise<string | null>;
  /** VE15: frase do efeito da última resposta, guardada pela tela (o resumo é remontado quando a análise é gravada). */
  efeito?: string | null;
};

const numero = (t: string) => {
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export function ResumoDaDecisao({ projecao: p, aoMudarPrioridade, aoLevarParaVisita, aoPrepararVisita, aoResponder, efeito }: Props) {
  const [texto, setTexto] = useState(p.pergunta?.texto ?? "");
  const [aviso, setAviso] = useState<string | null>(null);
  const [tempoAberto, setTempoAberto] = useState(false);
  const [minutos, setMinutos] = useState("");
  const [dias, setDias] = useState("");
  // Pergunta nova (outro par, outra prioridade): o campo volta ao texto sugerido.
  const chave = `${p.pergunta?.campo ?? ""}|${p.pergunta?.alvo ?? ""}|${p.pergunta?.texto ?? ""}`;
  const [chaveVista, setChaveVista] = useState(chave);
  if (chave !== chaveVista) {
    setChaveVista(chave);
    setTexto(p.pergunta?.texto ?? "");
    setAviso(null);
  }

  // Respondida a pergunta, a caixa some e o cartão encolhe: a tela leva a pessoa até a frase (web; no app nativo o
  // leitor de tela anuncia o status).
  const refEfeito = useRef<View>(null);
  useEffect(() => {
    if (!efeito) return;
    const no = refEfeito.current as unknown as { scrollIntoView?: (o: object) => void } | null;
    no?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [efeito]);

  const tempo = p.baseDoTempo?.porMes ? precoDaHoraPoupada(p.baseDoTempo.reais, numero(minutos), numero(dias)) : null;

  return (
    <SuperficieVx style={{ marginTop: 17 }}>
      <KickerVx>Para decidir</KickerVx>
      <View style={{ marginTop: 12 }}>
        <SegmentosVx opcoes={PRIORIDADES} valor={p.prioridade} aoMudar={aoMudarPrioridade} rotulo="O que pesa mais agora" modo="grupo" margemInferior={14} />
      </View>
      <Texto tipo="titulo-tela" role="heading" aria-level={2} style={{ fontSize: 24, lineHeight: 30, fontWeight: "500", letterSpacing: -0.5 }}>
        {p.manchete}
      </Texto>
      {efeito ? (
        <View ref={refEfeito}>
          <Texto role="status" style={{ fontSize: 14, lineHeight: 21, marginTop: 8, fontWeight: "500" }}>
            {efeito}
          </Texto>
        </View>
      ) : null}
      {p.apoio ? <Texto style={{ fontSize: 14, lineHeight: 21, marginTop: 8 }}>{p.apoio}</Texto> : null}

      {p.diferencas.length ? (
        <View style={{ marginTop: 16, gap: 12 }} role="list" aria-label="Diferenças que pesam">
          {p.diferencas.map((d) => (
            <View key={d.id} role="listitem" style={{ gap: 3 }}>
              <Texto style={{ fontSize: 13, lineHeight: 19 }}>{d.texto}</Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10, lineHeight: 14 }}>
                {d.fontes.map((f) => NOME_DA_FONTE[f]).join(" · ")}
              </Texto>
            </View>
          ))}
        </View>
      ) : null}

      {p.pergunta ? (
        <View style={{ marginTop: 20, gap: 10 }}>
          <KickerVx>
            {p.pergunta.forca === "negociacao" ? "Para negociar" : p.pergunta.forca === "confirmacao" ? "Para confirmar na visita" : "A pergunta que pode mudar a escolha"}
          </KickerVx>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18 }}>
            {p.pergunta.motivo}
          </Texto>
          <CampoDeTexto
            rotulo={`Pergunta para ${p.rotulos[p.pergunta.alvo]}`}
            value={texto}
            onChangeText={(t) => {
              setTexto(t);
              setAviso(null);
            }}
            linhas={3}
            maxLength={240}
          />
          <BotaoVx
            rotulo={`Levar para a visita de ${p.rotulos[p.pergunta.alvo]}`}
            desativado={texto.trim() === ""}
            onPress={() => {
              const alvo = p.pergunta!.alvo;
              void aoLevarParaVisita(alvo, texto).then((ok) =>
                setAviso(ok ? `Pergunta no roteiro da visita de ${p.rotulos[alvo]}.` : "Não coube no roteiro: ele já tem 30 perguntas próprias ou a pergunta está vazia."),
              );
            }}
          />
          <Botao
            rotulo="Copiar pergunta"
            desativado={texto.trim() === ""}
            onPress={() => {
              void Clipboard.setStringAsync(texto.trim()).then(() => setAviso("Pergunta copiada."));
            }}
          />
          {aviso ? (
            <Texto role="status" tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12 }}>
              {aviso}
            </Texto>
          ) : null}
          {aoResponder && p.pergunta.tipo === "visita" && (CAMPOS_RESPONDIVEIS as readonly string[]).includes(p.pergunta.campo) ? (
            <JaTemResposta chave={chave} alvo={p.pergunta.alvo} campo={p.pergunta.campo as CampoRespondivel} rotulo={p.rotulos[p.pergunta.alvo]} aoResponder={aoResponder} />
          ) : null}
        </View>
      ) : p.visitarPrimeiro !== null ? (
        <View style={{ marginTop: 20 }}>
          <BotaoVx rotulo={`Preparar visita a ${p.rotulos[p.visitarPrimeiro]}`} onPress={() => aoPrepararVisita(p.visitarPrimeiro!)} />
        </View>
      ) : null}

      {p.baseDoTempo?.porMes ? (
        <View style={{ marginTop: 16 }}>
          <Botao
            variante="texto"
            rotulo={tempoAberto ? "Fechar conta do tempo" : "E se o que custa mais te poupar tempo?"}
            expandido={tempoAberto}
            onPress={() => setTempoAberto(!tempoAberto)}
          />
          {tempoAberto ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18 }}>
                Diferença de {formatarReais(p.baseDoTempo.reais)}/mês. Informe quanto tempo você acha que pouparia; não calculamos trajeto.
              </Texto>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <CampoDeTexto rotulo="Minutos poupados por dia" value={minutos} onChangeText={setMinutos} keyboardType="number-pad" inputMode="numeric" maxLength={3} />
                </View>
                <View style={{ flex: 1 }}>
                  <CampoDeTexto rotulo="Dias por mês" value={dias} onChangeText={setDias} keyboardType="number-pad" inputMode="numeric" maxLength={2} />
                </View>
              </View>
              {tempo ? (
                <Texto role="status" style={{ fontSize: 14, lineHeight: 21 }}>
                  {`São ${tempo.horasTexto} por mês: cada hora poupada sai por ${tempo.reaisPorHoraTexto}. Você decide quanto vale.`}
                </Texto>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </SuperficieVx>
  );
}

/**
 * VE15: "Já tem a resposta?" — a pessoa informa o valor confirmado (boleto, ata, matrícula, corretor) e a comparação é
 * refeita na hora. Um campo e um toque, no lugar de procurar a pergunta num roteiro inteiro.
 */
function JaTemResposta({ chave, alvo, campo, rotulo, aoResponder }: { chave: string; alvo: Lado; campo: CampoRespondivel; rotulo: string;
  aoResponder: NonNullable<Props["aoResponder"]> }) {
  const [valor, setValor] = useState("");
  const [periodo, setPeriodo] = useState<"mes" | "ano" | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [vista, setVista] = useState(chave);
  if (chave !== vista) { setVista(chave); setValor(""); setPeriodo(null); }
  const iptu = campo === "iptu" || campo === "iptu_periodo";
  const n = Number(valor.replace(/\./g, "").replace(",", "."));
  const pronto = valor.trim() !== "" && Number.isFinite(n) && n >= 0 && (!iptu || periodo !== null);
  return (
    <View style={{ gap: 8, marginTop: 6 }} role="group" aria-label={`Já tem a resposta de ${rotulo}?`}>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18 }}>
        {`Já tem a resposta de ${rotulo}? Informe o valor confirmado e a comparação é refeita.`}
      </Texto>
      <CampoDeTexto rotulo={ROTULO_DO_CAMPO[campo]} value={valor} onChangeText={(t) => { setValor(t); setResultado(null); }} keyboardType="decimal-pad" inputMode="decimal" maxLength={12} />
      {iptu ? (
        <SegmentosVx opcoes={[{ valor: "mes", rotulo: "Por mês" }, { valor: "ano", rotulo: "Por ano" }]} valor={periodo ?? ("" as "mes")} aoMudar={(v) => setPeriodo(v as "mes" | "ano")} rotulo="Período do IPTU" modo="grupo" margemInferior={0} />
      ) : null}
      <Botao rotulo="Usar este valor" desativado={!pronto} onPress={() => { void aoResponder(alvo, campo, n, iptu ? periodo : null).then((r) => setResultado(r ?? "Não foi possível guardar o valor.")); }} />
      {resultado ? <Texto role="status" style={{ fontSize: 13, lineHeight: 19 }}>{resultado}</Texto> : null}
    </View>
  );
}
