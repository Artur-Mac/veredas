import { View } from "react-native";
import type { FatoDaRua, GrupoDaRua, VisaoDaRua } from "../../dados/contratos";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO } from "../../tema/tokens";
import { Botao } from "../Botao";
import type { PedidoDeFonte } from "../fonte/GavetaDeFonte";
import { RastroDeConfianca } from "../fonte/RastroDeConfianca";
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
};

/** "registro oficial · Central 156 da Emlurb · fev. 2025 a jan. 2026". */
export function textoDoRastroDaRua(f: FatoDaRua): string {
  return `${rotuloDaConfianca(f.confianca, f.fonte)} · ${nomeCurtoDaFonte(f.fonte)} · ${f.data}`;
}

function LinhaDaRua({ fato, primeira, aoAbrirFonte }: { fato: FatoDaRua; primeira: boolean; aoAbrirFonte: Props["aoAbrirFonte"] }) {
  const { cor } = useTema();
  const rastro = textoDoRastroDaRua(fato);
  return (
    <Pressionavel
      onPress={() => aoAbrirFonte({ fonte: fato.fonte, confianca: fato.confianca, dado: { rotulo: fato.rotulo, valor: fato.valor }, idDoDado: fato.id })}
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
      <RastroDeConfianca confianca={fato.confianca} fonte={fato.fonte} texto={rastro} />
    </Pressionavel>
  );
}

function Grupo({ grupo, aoAbrirFonte }: { grupo: GrupoDaRua; aoAbrirFonte: Props["aoAbrirFonte"] }) {
  return (
    <View style={{ marginTop: ESPACO[4] }} accessibilityLabel={grupo.titulo}>
      <Texto tipo="etiqueta" role="heading" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15, fontWeight: "700", letterSpacing: 0.4, marginBottom: 2 }}>
        {grupo.titulo}
      </Texto>
      {grupo.fatos.map((f, i) => (
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
export function ARua({ rua, aoAbrirFonte, aoResponderDefesaCivil }: Props) {
  return (
    <View>
      <Sobretitulo>A rua</Sobretitulo>
      <Titulo2>O que os registros dizem da rua</Titulo2>
      <Corpo>Registros públicos a até 150 m do prédio, na rua dele ou no setor do Censo. Cada linha diz a fonte e a data.</Corpo>
      {rua.grupos.map((g) => (
        <View key={g.id}>
          <Grupo grupo={g} aoAbrirFonte={aoAbrirFonte} />
          {g.id === "defesa_civil" && rua.defesaCivil ? <DefesaCivilNaRua rua={rua.defesaCivil} aoResponder={aoResponderDefesaCivil} /> : null}
        </View>
      ))}
      <Nota estilo={{ marginTop: ESPACO[3] }}>Toque em uma linha para ver a base, o recorte e as colunas usadas.</Nota>
    </View>
  );
}
