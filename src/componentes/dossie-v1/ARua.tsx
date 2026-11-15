import { useState } from "react";
import { View } from "react-native";
import type { FatoDaRua, GrupoDaRua, VisaoDaRua } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO } from "../../tema/tokens";
import { Botao } from "../Botao";
import type { PedidoDeFonte } from "../fonte/GavetaDeFonte";
import { nomeCurtoDaFonte, rotuloDaConfianca } from "../fonte/textos";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { CaixaCreme, Corpo, LinkComSeta, Nota, Numero, Sobretitulo, Titulo2 } from "./base";

// Seção "A rua" da aba Entorno (v1.1). Cada linha mostra o dado, o recorte e, embaixo, o rastro com a fonte e a data;
// o toque abre a gaveta de fonte. Composta só com as primitivas do dossiê (`.ds-*` de index.html), sem cor nova.

export type RespostaDaDefesaCivil = "neste_predio" | "outro_endereco" | null;

type Props = {
  rua: VisaoDaRua;
  aoAbrirFonte: (pedido: PedidoDeFonte) => void;
  aoResponderDefesaCivil: (resposta: RespostaDaDefesaCivil) => void;
  /** 15/11/2026: rampa só aparece quando o perfil da casa pede acessibilidade de mobilidade. */
  acesso?: readonly ("mobilidade" | "visao")[];
};

/** Fatos que só interessam a quem marcou a necessidade no perfil da casa. */
const SO_COM_ACESSO: Record<string, "mobilidade" | "visao"> = { "rua-censo-rampa": "mobilidade" };
/** Com mobilidade marcada, rampa e obstáculo saem do Censo recolhido e ficam visíveis num grupo próprio. */
const DE_ACESSIBILIDADE = new Set(["rua-censo-rampa", "rua-censo-obstaculo"]);

/** "registro oficial · Central 156 da Emlurb · fev. 2025 a jan. 2026". */
export function textoDoRastroDaRua(f: FatoDaRua): string {
  return `${rotuloDaConfianca(f.confianca, f.fonte)} · ${nomeCurtoDaFonte(f.fonte)} · ${f.data}`;
}

function LinhaDaRua({ fato, primeira, aoAbrirFonte }: { fato: FatoDaRua; primeira: boolean; aoAbrirFonte: Props["aoAbrirFonte"] }) {
  const { cor } = useTema();
  const rastro = textoDoRastroDaRua(fato);
  const [aberta, setAberta] = useState(false);
  const abrirFonte = () => aoAbrirFonte({ fonte: fato.fonte, confianca: fato.confianca, dado: { rotulo: fato.rotulo, valor: fato.valor }, idDoDado: fato.id });
  // 15/11/2026: a consequência vem primeiro; a contagem, o detalhe e a fonte ficam atrás do toque.
  if (fato.consequencia) {
    return (
      <View style={{ borderTopWidth: primeira ? 0 : 0.5, borderTopColor: cor("cor-linha") }}>
        <Pressionavel
          onPress={() => setAberta((x) => !x)}
          accessibilityRole="button"
          accessibilityState={{ expanded: aberta }}
          accessibilityLabel={`${fato.consequencia} ${aberta ? "Fechar" : `Ver o número: ${fato.rotulo}, ${fato.valor}`}.`}
          style={{ minHeight: 48, paddingVertical: 10, gap: 3, borderRadius: RAIO.quadrado }}
        >
          <Texto tipo="corpo" style={{ fontSize: 13, lineHeight: 19 }}>{fato.consequencia}</Texto>
          {aberta ? null : (
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>{`${fato.rotulo}: ${fato.valor}`}</Texto>
          )}
        </Pressionavel>
        {aberta ? (
          <View style={{ paddingBottom: 10, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <Texto tipo="apoio" cor="cor-texto" style={{ flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: "600" }}>{fato.rotulo}</Texto>
              <Numero tamanho={14} estilo={{ textAlign: "right" }}>{fato.valor}</Numero>
            </View>
            {fato.detalhe ? <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>{fato.detalhe}</Texto> : null}
            <LinkComSeta rotulo={`Ver fonte e data (${fato.data})`} onPress={abrirFonte} discreto />
          </View>
        ) : null}
      </View>
    );
  }
  return (
    <Pressionavel
      onPress={abrirFonte}
      accessibilityRole="button"
      accessibilityLabel={`${fato.rotulo}: ${fato.valor}.${fato.detalhe ? ` ${fato.detalhe}` : ""} ${rastro}. Ver fonte.`}
      style={{
        minHeight: 48,
        paddingVertical: 10,
        gap: 3,
        borderTopWidth: primeira ? 0 : 0.5,
        borderTopColor: cor("cor-linha"),
        borderRadius: RAIO.quadrado,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <Texto tipo="apoio" cor="cor-texto" style={{ flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: "600" }}>
          {fato.rotulo}
        </Texto>
        <Numero tamanho={14} estilo={{ textAlign: "right" }}>
          {fato.valor}
        </Numero>
      </View>
      {fato.detalhe ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>
          {fato.detalhe}
        </Texto>
      ) : null}
      {/* 15/11/2026: a fonte e a data ficam no toque (gaveta) e no rótulo acessível, não em cada linha. */}
    </Pressionavel>
  );
}

function Grupo({ grupo, aoAbrirFonte, acesso = [], fora = new Set<string>() }: { grupo: GrupoDaRua; aoAbrirFonte: Props["aoAbrirFonte"]; acesso?: Props["acesso"]; fora?: ReadonlySet<string> }) {
  const fatos = grupo.fatos.filter((f) => !fora.has(f.id) && (!SO_COM_ACESSO[f.id] || acesso.includes(SO_COM_ACESSO[f.id]!)));
  if (!fatos.length) return null;
  return (
    <View style={{ marginTop: ESPACO[4] }} accessibilityLabel={grupo.titulo}>
      <Texto tipo="etiqueta" role="heading" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15, fontWeight: "700", letterSpacing: 0.4, marginBottom: 2 }}>
        {grupo.titulo}
      </Texto>
      {fatos.map((f, i) => (
        <LinhaDaRua key={f.id} fato={f} primeira={i === 0} aoAbrirFonte={aoAbrirFonte} />
      ))}
      {grupo.nota ? <Nota estilo={{ marginTop: 2 }}>{grupo.nota}</Nota> : null}
    </View>
  );
}

/** Atendimentos da Defesa Civil na rua: o número do imóvel não é publicado, então quem confirma é a pessoa. */
function DefesaCivilNaRua({ rua, aoResponder }: { rua: NonNullable<VisaoDaRua["defesaCivil"]>; aoResponder: Props["aoResponderDefesaCivil"] }) {
  const vezes = rua.atendimentos === 1 ? "1 atendimento" : `${rua.atendimentos} atendimentos`;
  return (
    <CaixaCreme estilo={{ marginTop: ESPACO[2] }}>
      <Texto tipo="corpo" style={{ fontSize: 13, lineHeight: 19, fontWeight: "600" }}>
        {`A Defesa Civil registrou ${vezes} em ${rua.rua} (${rua.anos}).`}
      </Texto>
      {rua.resposta === null ? (
        <>
          <Corpo estilo={{ fontSize: 13, lineHeight: 19 }}>
            A publicação esconde o número do imóvel. Pergunte ao síndico ou ao corretor se algum foi neste prédio e marque aqui.
          </Corpo>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO[2] }}>
            <Botao rotulo="Foi neste prédio" variante="secundario" onPress={() => aoResponder("neste_predio")} acessivel="A Defesa Civil atendeu este prédio" />
            <Botao rotulo="Não foi aqui" variante="secundario" onPress={() => aoResponder("outro_endereco")} acessivel="O atendimento da Defesa Civil não foi neste prédio" />
          </View>
        </>
      ) : (
        <>
          <Corpo estilo={{ fontSize: 13, lineHeight: 19 }}>
            {rua.resposta === "neste_predio"
              ? "Você marcou que um atendimento foi neste prédio. Peça ao síndico o laudo ou o registro da vistoria."
              : "Você marcou que os atendimentos não foram neste prédio."}
          </Corpo>
          <LinkComSeta rotulo="Desfazer a resposta" onPress={() => aoResponder(null)} discreto seta={false} />
        </>
      )}
    </CaixaCreme>
  );
}

/** Seção "A rua": o que os registros públicos dizem da rua e do quarteirão do prédio confirmado. */
/** Grupos do Censo (quarteirão e moradia): para quem quer investigar, atrás de um toque (sabatina, 15/11/2026). */
const GRUPOS_DO_CENSO = new Set(["entorno", "moradia"]);

export function ARua({ rua, aoAbrirFonte, aoResponderDefesaCivil, acesso = [] }: Props) {
  const [verCenso, setVerCenso] = useState(false);
  const doCenso = rua.grupos.filter((g) => GRUPOS_DO_CENSO.has(g.id));
  const deAcesso = acesso.includes("mobilidade") ? (rua.grupos.find((g) => g.id === "entorno")?.fatos ?? []).filter((f) => DE_ACESSIBILIDADE.has(f.id)) : [];
  const jaMostrados = new Set(deAcesso.map((f) => f.id));
  return (
    <View>
      <Sobretitulo>A rua</Sobretitulo>
      <Titulo2>O que os registros dizem da rua</Titulo2>
      <Corpo>Registros públicos a até 150 m do prédio. Toque numa linha para ver o número, a fonte e a data.</Corpo>
      {deAcesso.length ? (
        <Grupo
          grupo={{ id: "entorno", titulo: "Acessibilidade do quarteirão (Censo 2022)", fatos: deAcesso, nota: "Pelo recenseador, na face de quadra dos domicílios do setor; não é vistoria da calçada do prédio." }}
          aoAbrirFonte={aoAbrirFonte}
          acesso={acesso}
        />
      ) : null}
      {rua.grupos.filter((g) => verCenso || !GRUPOS_DO_CENSO.has(g.id)).map((g) => (
        <View key={g.id}>
          <Grupo grupo={g} aoAbrirFonte={aoAbrirFonte} acesso={acesso} fora={jaMostrados} />
          {g.id === "defesa_civil" && rua.defesaCivil ? <DefesaCivilNaRua rua={rua.defesaCivil} aoResponder={aoResponderDefesaCivil} /> : null}
        </View>
      ))}
      {doCenso.length && !verCenso ? (
        <LinkComSeta rotulo="Ver calçada, árvores e moradia do quarteirão (Censo)" onPress={() => setVerCenso(true)} discreto />
      ) : null}
    </View>
  );
}
