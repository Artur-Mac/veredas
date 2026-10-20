import { useState } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { ParcelaDoCusto, Posicao, VisaoDoDossie } from "../../dados/contratos";
import { formatarReais } from "../../dados/formatos";
import { useTema } from "../../tema/Tema";
import { ESPACO, type TokenDeCor } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { LinkComSeta, Nota, Numero, Seta } from "./base";
import { corpoQueCabe, notasDasParcelas, precoPorM2, rotuloDoTotal, segmentosDaBarra, textoDoValorMensal } from "./textos";

// `DOSSIER_COLORS` de index.html (linha 5032) trocado pelos tokens do app: aluguel laranja, condomínio sálvia, IPTU azul
// cadastral e os demais em tons neutros. A cor reforça a legenda; o valor e o nome estão sempre escritos.
const COR_DA_PARCELA: Record<ParcelaDoCusto["nome"], TokenDeCor> = {
  Aluguel: "cor-acao",
  Condomínio: "cor-salvia",
  IPTU: "cor-azul-cadastral",
  "Seguro incêndio": "cat-terra",
  "Taxa de serviço": "cor-traco",
  Outros: "cat-outros",
};

type PropsDoValor = {
  rotulo: string;
  texto: string;
  sufixo?: string;
  /** Linha abaixo do valor: o preço por m² ou "+R$ Z além do aluguel". */
  apoio?: { texto: string; ferrugem?: boolean } | null;
  aoMedir: (largura: number) => void;
  largura: number;
};

function ValorGrande({ rotulo, texto, sufixo, apoio, aoMedir, largura }: PropsDoValor) {
  const corpo = corpoQueCabe(texto, largura - (sufixo ? 34 : 0), 24);
  return (
    <View style={{ flex: 1, minWidth: 0 }} onLayout={(e) => aoMedir(e.nativeEvent.layout.width)}>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>
        {rotulo}
      </Texto>
      <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
        <Numero tamanho={corpo} peso="600">
          {texto}
        </Numero>
        {sufixo ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>
            {sufixo}
          </Texto>
        ) : null}
      </View>
      {apoio ? (
        <Texto
          tipo="apoio"
          cor={apoio.ferrugem ? "cor-barro-texto" : "cor-texto"}
          style={{ marginTop: 5, fontSize: 11, lineHeight: 16, fontWeight: apoio.ferrugem ? "500" : "600" }}
        >
          {apoio.texto}
        </Texto>
      ) : null}
    </View>
  );
}

function IconeDeTendencia({ cor }: { cor: TokenDeCor }) {
  const { cor: corDe } = useTema();
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={corDe(cor)} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <Path d="m4 16 6-6 4 4 6-9m-6 0h6v6" />
    </Svg>
  );
}

type Props = {
  custo: VisaoDoDossie["custo"];
  /** Área conhecida do anúncio: só para dizer o que falta quando o R$/m² não pode ser calculado. */
  area: number | null;
  posicao: Posicao | null;
  aoAbrirPosicao: () => void;
  aoAjustar: () => void;
};

/**
 * `.ds-finance` de index.html (renderDossierFinance 5107 a 5137; CSS 2735 a 2759): principal e total mensal conhecido,
 * "+R$ Z além do aluguel", barra segmentada, legenda com "A confirmar" e a nota do que ficou fora da soma. O fundo
 * degradê do protótipo vira o creme chapado do app.
 */
export function BlocoDeCusto({ custo, area, posicao, aoAbrirPosicao, aoAjustar }: Props) {
  const { cor } = useTema();
  const [largura, setLargura] = useState(147);
  const aluguel = custo.principal.rotulo === "Aluguel anunciado";
  const principal = custo.principal.valor !== null ? formatarReais(custo.principal.valor) : "A confirmar";
  const total = custo.totalMensalConhecido !== null ? formatarReais(custo.totalMensalConhecido) : "A confirmar";
  const segmentos = segmentosDaBarra(custo.parcelas);
  const alem = aluguel && custo.alemDoPrincipal !== null && custo.alemDoPrincipal > 0 ? custo.alemDoPrincipal : null;
  const notas = notasDasParcelas(custo.parcelas);
  const descricaoDaBarra = `Composição dos ${total} mensais conhecidos: ${segmentos.map((s) => `${s.nome} ${formatarReais(s.valor)}`).join(", ")}`;

  return (
    <View
      style={{
        paddingVertical: 14,
        paddingHorizontal: 18,
        backgroundColor: cor("cor-creme"),
        borderTopWidth: 1,
        borderTopColor: cor("cor-linha"),
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <ValorGrande
          rotulo={custo.principal.rotulo}
          texto={principal}
          sufixo={aluguel && custo.principal.valor !== null ? "/mês" : undefined}
          apoio={{ texto: precoPorM2(custo, area) }}
          aoMedir={setLargura}
          largura={largura}
        />
        <ValorGrande
          rotulo={rotuloDoTotal(custo)}
          texto={total}
          sufixo={custo.totalMensalConhecido !== null ? "/mês" : undefined}
          apoio={alem !== null ? { texto: `+${formatarReais(alem)} além do aluguel`, ferrugem: true } : null}
          aoMedir={() => undefined}
          largura={largura}
        />
      </View>

      {posicao ? (
        <Pressionavel
          onPress={aoAbrirPosicao}
          accessibilityRole="button"
          accessibilityLabel={`${posicao.rotulo}: ${posicao.frase}. Ver no Entorno.`}
          style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7 }}
        >
          <IconeDeTendencia cor="cor-barro-texto" />
          <Texto tipo="apoio" cor="cor-barro-texto" style={{ flex: 1, fontSize: 11, lineHeight: 15, fontWeight: "600" }}>
            {posicao.frase}
          </Texto>
          <Seta cor="cor-barro-texto" />
        </Pressionavel>
      ) : null}

      {segmentos.length > 0 ? (
        <View
          accessible
          role="img"
          accessibilityLabel={descricaoDaBarra}
          style={{ flexDirection: "row", gap: 3, height: 8, borderRadius: 5, overflow: "hidden", marginVertical: 10 }}
        >
          {segmentos.map((s) => (
            <View key={s.nome} style={{ flexGrow: s.valor, flexBasis: 0, minWidth: 0, backgroundColor: cor(COR_DA_PARCELA[s.nome]) }} />
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 9 }}>
        {custo.parcelas.map((p) => (
          <View key={p.nome} accessible accessibilityLabel={`${p.nome}: ${textoDoValorMensal(p)}`} style={{ width: "47%", flexGrow: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 2,
                  backgroundColor: cor(p.estado === "conhecido" ? COR_DA_PARCELA[p.nome] : "cor-linha-forte"),
                }}
              />
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
                {p.nome}
              </Texto>
            </View>
            <Texto tipo="corpo" style={{ fontSize: 12, lineHeight: 17, fontWeight: "600", paddingLeft: 12, marginTop: 2 }}>
              {textoDoValorMensal(p)}
            </Texto>
          </View>
        ))}
      </View>

      <View style={{ gap: 4, marginTop: 6 }}>
        {custo.notaForaDaSoma ? <Nota>{custo.notaForaDaSoma}</Nota> : null}
        {notas.map((n) => (
          <Nota key={n}>{n}</Nota>
        ))}
        {!aluguel ? <Nota>Preço de compra e financiamento não entram nesta soma.</Nota> : null}
      </View>

      <LinkComSeta rotulo="Ver composição e ajustar valores" onPress={aoAjustar} estilo={{ marginTop: ESPACO[1] }} />
    </View>
  );
}
