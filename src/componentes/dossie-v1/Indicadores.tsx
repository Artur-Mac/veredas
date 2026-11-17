// Indicadores comparados com o bairro, rotina num olhar e divergências do anúncio (15/11/2026, sabatina). Cartão curto
// com o classificador e a comparação; tocar abre o que sustenta a frase e o que pode significar ("investigar").
import { useState } from "react";
import { View } from "react-native";
import type { Achado, Pergunta } from "../../dados/contratos";
import type { Indicador } from "../../dados/dossie/indicadores";
import { CATEGORIAS_DO_DIA, essenciaisDoPredio, nomeDe } from "../../dados/recife/essenciais";
import { formatarNumero } from "../../dados/formatos";
import { useTema } from "../../tema/Tema";
import { ESPACO, type TokenDeCor } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { LinkComSeta, Seta } from "./base";

const CORES: Record<Indicador["classe"], { fundo: TokenDeCor; texto: TokenDeCor }> = {
  melhor: { fundo: "cor-salvia-suave", texto: "cor-salvia-escura" },
  pior: { fundo: "cor-barro-suave", texto: "cor-barro-texto" },
  igual: { fundo: "cor-creme", texto: "cor-texto-apoio" },
};

export function CartaoDoIndicador({ indicador: i, aoInvestigar }: { indicador: Indicador; aoInvestigar?: (id: Indicador["id"]) => void }) {
  const { cor } = useTema();
  const [aberto, setAberto] = useState(false);
  const c = CORES[i.classe];
  return (
    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: cor("cor-linha"), backgroundColor: cor("cor-superficie"), overflow: "hidden" }}>
      <Pressionavel
        onPress={() => setAberto((x) => !x)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel={`${i.tema}: ${i.rotulo}. ${i.comparacao} ${aberto ? "Fechar" : "Ver o porquê"}`}
        style={{ padding: 14, gap: 6 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10.5, lineHeight: 14, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" }}>{i.tema}</Texto>
          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: cor(c.fundo) }}>
            <Texto tipo="apoio" cor={c.texto} style={{ fontSize: 11, lineHeight: 15, fontWeight: "700" }}>
              {i.classe === "melhor" ? "Acima do bairro" : i.classe === "pior" ? "Atenção" : "Como o bairro"}
            </Texto>
          </View>
        </View>
        <Texto tipo="corpo" style={{ fontSize: 16, lineHeight: 21, fontWeight: "600" }}>{i.rotulo}</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5, lineHeight: 18 }}>{i.comparacao}</Texto>
        {aberto ? (
          <View style={{ gap: 6, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: cor("cor-linha") }}>
            <Texto tipo="corpo" style={{ fontSize: 13, lineHeight: 19 }}>{i.frase}</Texto>
            <Texto tipo="corpo" cor="cor-barro-texto" style={{ fontSize: 13, lineHeight: 19 }}>{i.significado}</Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>{`Comparação com ${formatarNumero(i.base)} prédios do bairro no cadastro.`}</Texto>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 16, fontWeight: "600" }}>Ver o porquê</Texto>
            <Seta tamanho={11} />
          </View>
        )}
      </Pressionavel>
      {aberto && aoInvestigar ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
          <LinkComSeta rotulo="Investigar no Entorno" onPress={() => aoInvestigar(i.id)} />
        </View>
      ) : null}
    </View>
  );
}

const ROTULO_CURTO: Record<(typeof CATEGORIAS_DO_DIA)[number], string> = { mercado: "Mercado", farmacia: "Farmácia", transporte: "Ônibus", praca: "Praça" };

/** Minutos a pé até o essencial, em pílulas; tocar abre o "A pé, a partir da entrada" no Entorno. */
export function RotinaNumOlhar({ bairro, predioId, aoVerMais }: { bairro: string | null; predioId: string | null; aoVerMais: () => void }) {
  const { cor } = useTema();
  const r = essenciaisDoPredio(bairro, predioId);
  if (!r || r.predio.modo !== "rede") return null;
  const p = r.predio;
  const itens = CATEGORIAS_DO_DIA.map((cat) => {
    const x = p.c[cat];
    return x ? { cat, min: x.min, nome: nomeDe(r.pacote.locais[x.l]!) } : null;
  }).filter((x): x is { cat: (typeof CATEGORIAS_DO_DIA)[number]; min: number; nome: string } => x !== null);
  if (!itens.length) return null;
  return (
    <View style={{ gap: ESPACO[2] }} role="group" aria-label="Rotina num olhar">
      <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>A pé, da porta do prédio</Texto>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {itens.map((x) => (
          <Pressionavel key={x.cat} onPress={aoVerMais} accessibilityRole="button" accessibilityLabel={`${ROTULO_CURTO[x.cat]}: ${x.nome}, ${Math.round(x.min)} minutos a pé`}
            style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: cor("cor-creme"), minWidth: 72 }}>
            <Texto tipo="numero" style={{ fontSize: 17, lineHeight: 22, fontWeight: "600" }}>{x.min < 1 ? "<1" : formatarNumero(Math.round(x.min))} min</Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>{ROTULO_CURTO[x.cat]}</Texto>
          </Pressionavel>
        ))}
      </View>
    </View>
  );
}

/** Divergências do anúncio: compactas, cada uma com a pergunta pronta para o corretor. */
export function Divergencias({ achados, perguntas, aoAbrirPergunta, aoCorrigir }: { achados: readonly Achado[]; perguntas: readonly Pergunta[]; aoAbrirPergunta: (p: Pergunta) => void; aoCorrigir?: (a: Achado) => (() => void) | null }) {
  const { cor } = useTema();
  if (!achados.length) return null;
  return (
    <View style={{ gap: ESPACO[2] }} role="group" aria-label="Divergências do anúncio">
      <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>{`Divergências do anúncio (${achados.length})`}</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>Diferenças entre o anúncio e o cadastro. Muitas são de leitura; vale perguntar antes da visita.</Texto>
      {achados.map((a) => {
        const pergunta = a.perguntaId ? perguntas.find((p) => p.id === a.perguntaId) ?? null : null;
        return (
          <View key={a.id} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 2 }}>
            <Texto tipo="corpo" style={{ fontSize: 13, lineHeight: 18, fontWeight: "600" }}>{a.titulo}</Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>{a.texto}</Texto>
            {pergunta ? <LinkComSeta rotulo="Perguntar ao corretor" onPress={() => aoAbrirPergunta(pergunta)} /> : null}
            {aoCorrigir?.(a) ? <LinkComSeta rotulo="Corrigir o valor" onPress={aoCorrigir(a)!} /> : null}
          </View>
        );
      })}
    </View>
  );
}
