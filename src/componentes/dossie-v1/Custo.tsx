import { useState } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { ParcelaDoCusto, Posicao, VisaoDoDossie } from "../../dados/contratos";
import type { CustoPorPartes } from "../../dados/custoPorPartes";
import { avisoDeValoresPendentes } from "../../dados/custos";
import { formatarReais } from "../../dados/formatos";
import { useTema } from "../../tema/Tema";
import { ESPACO, type TokenDeCor } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { SimuladorPrice } from "./SimuladorPrice";
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
  const larguraUtil = Math.max(96, largura - (sufixo ? 38 : 6));
  const corpo = corpoQueCabe(texto, larguraUtil, 22, 13);
  return (
    <View style={{ flex: 1, minWidth: 0 }} onLayout={(e) => aoMedir(e.nativeEvent.layout.width)}>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>
        {rotulo}
      </Texto>
      <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
        <Numero tamanho={corpo} peso="600" estilo={{ flexShrink: 1 }}>
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
          style={{ marginTop: 5, fontSize: 11.5, lineHeight: 16, fontWeight: apoio.ferrugem ? "500" : "600" }}
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
  /** Camada 2 opcional: estimativas de rotina parametrizadas pelo perfil único do aparelho (`T14`), nunca somadas ao mensal oficial. */
  partes?: CustoPorPartes | null;
  perfilConfigurado?: boolean;
  aoAbrirPerfilDomicilio?: () => void;
  /** 15/11/2026: IPTU mensal do cadastro na tipologia do anúncio, para dizer a referência no mesmo lugar do IPTU. */
  referenciaIptu?: { mensal: number } | null;
};

/** IPTU uma vez só: o do anúncio (com a referência do cadastro só quando difere mais de 20%), ou o do cadastro com "~". */
export function textoDaParcela(p: ParcelaDoCusto, referenciaIptu: { mensal: number } | null, iptuDoPredio: number | null): { valor: string; apoio: string | null } {
  if (p.nome !== "IPTU") return { valor: textoDoValorMensal(p), apoio: null };
  if (p.estado === "conhecido" && p.valorMensal !== null) {
    const ref = referenciaIptu?.mensal ?? null;
    const difere = ref !== null && ref > 0 && Math.abs(p.valorMensal - ref) / ref > 0.2;
    return { valor: formatarReais(p.valorMensal), apoio: difere ? `cadastro: ~${formatarReais(Math.round(ref!))}` : null };
  }
  if (iptuDoPredio !== null) return { valor: `~${formatarReais(iptuDoPredio)}`, apoio: "pelo cadastro, fora da soma" };
  return { valor: textoDoValorMensal(p), apoio: null };
}

/**
 * `.ds-finance` de index.html (renderDossierFinance 5107 a 5137; CSS 2735 a 2759): principal e total mensal conhecido,
 * "+R$ Z além do aluguel", barra segmentada, legenda com "A confirmar" e a nota do que ficou fora da soma. O fundo
 * degradê do protótipo vira o creme chapado do app.
 */
export function BlocoDeCusto({
  custo,
  area,
  posicao,
  aoAbrirPosicao,
  aoAjustar,
  partes = null,
  perfilConfigurado = false,
  aoAbrirPerfilDomicilio,
  referenciaIptu = null,
}: Props) {
  const { cor } = useTema();
  const [largura, setLargura] = useState(147);
  // Estimativas pessoais (luz, financiamento) recolhidas num cartão: a pessoa abre se quiser (sabatina, 15/11/2026).
  const [estimativasAbertas, setEstimativasAbertas] = useState(false);
  // 15/11/2026: a pílula do financiamento abre o simulador Price aqui mesmo.
  const [simuladorAberto, setSimuladorAberto] = useState(false);
  const iptuDoPredio = partes?.referenciaIptuDoPredio?.mensalMedianoReais ?? null;
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
        {(aluguel ? ["mensal", "principal"] : ["principal", "mensal"]).map((tipo) => (
          <ValorGrande
            key={tipo}
            rotulo={tipo === "mensal" ? rotuloDoTotal(custo) : custo.principal.rotulo}
            texto={tipo === "mensal" ? total : principal}
            sufixo={tipo === "mensal" ? (custo.totalMensalConhecido !== null ? "/mês" : undefined) : (aluguel && custo.principal.valor !== null ? "/mês" : undefined)}
            apoio={tipo === "mensal" ? (alem !== null ? { texto: `+${formatarReais(alem)} além do aluguel`, ferrugem: true } : null) : { texto: precoPorM2(custo, area) }}
            aoMedir={tipo === "principal" ? setLargura : () => undefined}
            largura={largura}
          />
        ))}
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
        {custo.parcelas.map((p) => { const t = textoDaParcela(p, referenciaIptu, iptuDoPredio); return (
          <View key={p.nome} accessible accessibilityLabel={`${p.nome}: ${t.valor}${t.apoio ? `, ${t.apoio}` : ""}`} style={{ width: "47%", flexGrow: 1, minWidth: 0 }}>
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
              {t.valor}
            </Texto>
            {t.apoio ? (
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10.5, lineHeight: 14, paddingLeft: 12 }}>
                {t.apoio}
              </Texto>
            ) : null}
          </View>
        ); })}
      </View>

      <View style={{ gap: 4, marginTop: 6 }}>
        {avisoDeValoresPendentes(custo) ? <Nota>{avisoDeValoresPendentes(custo)}</Nota> : null}
        {custo.notaForaDaSoma ? <Nota>{custo.notaForaDaSoma}</Nota> : null}
        {notas.map((n) => (
          <Nota key={n}>{n}</Nota>
        ))}
        {partes?.comparacaoComTetoPessoal ? <Nota>{partes.comparacaoComTetoPessoal}</Nota> : null}
        {!aluguel ? <Nota>Preço de compra e financiamento não entram nesta soma.</Nota> : null}
      </View>

      {partes && !estimativasAbertas ? (
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {partes.fatiasDaRotina.filter((f) => f.valorMensalReais > 0).map((f) => (
              <Pressionavel
                key={f.id}
                onPress={() => setEstimativasAbertas(true)}
                accessibilityRole="button"
                accessibilityLabel={`${f.id === "energia" ? "Luz estimada" : f.rotulo}: cerca de ${formatarReais(f.valorMensalReais)} por mês, à parte. Toque para ver e ajustar`}
                style={{ minHeight: 44, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: cor("cor-superficie") }}
              >
                <Texto tipo="numero" style={{ fontSize: 13, lineHeight: 18, fontWeight: "600" }}>{`~${formatarReais(f.valorMensalReais)}/mês`}</Texto>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10.5, lineHeight: 14 }}>{f.id === "energia" ? "Luz estimada" : f.rotulo}</Texto>
              </Pressionavel>
            ))}
            {partes.simulacaoCompra && partes.simulacaoCompra.prestacaoPriceReais > 0 ? (
              <Pressionavel
                onPress={() => setSimuladorAberto((x) => !x)}
                accessibilityRole="button"
                accessibilityState={{ expanded: simuladorAberto }}
                accessibilityLabel={`Financiamento: cerca de ${formatarReais(partes.simulacaoCompra.prestacaoPriceReais)} por mês, financiando ${100 - partes.simulacaoCompra.entradaPct}% em ${partes.simulacaoCompra.prazoAnos} anos. ${simuladorAberto ? "Fechar o simulador" : "Toque para simular entrada e prazo"}`}
                style={{ minHeight: 44, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: cor(simuladorAberto ? "cor-azul-cadastral-suave" : "cor-superficie") }}
              >
                <Texto tipo="numero" style={{ fontSize: 13, lineHeight: 18, fontWeight: "600" }}>{`~${formatarReais(partes.simulacaoCompra.prestacaoPriceReais)}/mês`}</Texto>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10.5, lineHeight: 14 }}>{`Financiar ${100 - partes.simulacaoCompra.entradaPct}% em ${partes.simulacaoCompra.prazoAnos} anos`}</Texto>
              </Pressionavel>
            ) : null}
          </View>
          {simuladorAberto && partes.simulacaoCompra ? <SimuladorPrice simulacao={partes.simulacaoCompra} aoFechar={() => setSimuladorAberto(false)} /> : null}
          <Pressionavel onPress={() => setEstimativasAbertas(true)} accessibilityRole="button" accessibilityLabel="Estimativas à parte: luz e financiamento. Toque para ver e ajustar" style={{ minHeight: 32, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 16, fontWeight: "600" }}>Estimativas à parte · toque para ver e ajustar</Texto>
            <Seta tamanho={11} />
          </Pressionavel>
        </View>
      ) : null}

      {partes && estimativasAbertas ? (
        <View
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: cor("cor-linha"),
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <Texto tipo="apoio" cor="cor-azul-cadastral" style={{ fontSize: 10.5, lineHeight: 14, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>
              {perfilConfigurado ? "Sua rotina neste endereço (à parte)" : "Estimativa de rotina padrão (à parte)"}
            </Texto>
          </View>

          {partes.fatiasDaRotina.some((f) => f.valorMensalReais > 0) ? (
            <View style={{ flexDirection: "row", gap: 3, height: 6, borderRadius: 4, overflow: "hidden" }}>
              {partes.fatiasDaRotina
                .filter((f) => f.valorMensalReais > 0)
                .map((f) => (
                  <View
                    key={f.id}
                    style={{
                      flexGrow: f.valorMensalReais,
                      flexBasis: 0,
                      minWidth: 0,
                      backgroundColor: cor(f.id === "energia" ? "cor-azul-cadastral" : "cor-salvia-escura"),
                      opacity: 0.72,
                    }}
                  />
                ))}
            </View>
          ) : null}

          <View style={{ gap: 6 }}>
            {partes.fatiasDaRotina.map((f) => (
              <View key={f.id} style={{ gap: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <Texto tipo="apoio" style={{ fontSize: 11.5, lineHeight: 16, fontWeight: "600", flex: 1 }}>
                    {f.rotulo}
                  </Texto>
                  <Texto tipo="numero" style={{ fontSize: 12, lineHeight: 17, fontWeight: "600" }}>
                    {f.valorMensalReais > 0 ? `~${formatarReais(f.valorMensalReais)}/mês` : "Sem gasto direto"}
                  </Texto>
                </View>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
                  {f.explicacaoHumana}
                </Texto>
              </View>
            ))}

            {partes.simulacaoCompra && partes.simulacaoCompra.prestacaoPriceReais > 0 ? (
              <View style={{ marginTop: 2, paddingTop: 6, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 2 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <Texto tipo="apoio" style={{ fontSize: 11.5, lineHeight: 16, fontWeight: "600", flex: 1 }}>
                    {`Simulação Price (${partes.simulacaoCompra.entradaPct}% entrada · ${partes.simulacaoCompra.prazoAnos} anos)`}
                  </Texto>
                  <Texto tipo="numero" style={{ fontSize: 12, lineHeight: 17, fontWeight: "600" }}>
                    {`~${formatarReais(partes.simulacaoCompra.prestacaoPriceReais)}/mês`}
                  </Texto>
                </View>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
                  {`Entrada de ${formatarReais(partes.simulacaoCompra.entradaReais)} · ${partes.simulacaoCompra.fonteCurta}. Não substitui proposta do banco.`}
                </Texto>
              </View>
            ) : null}

            {partes.transferencia ? (
              <View style={{ marginTop: 2, paddingTop: 6, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 2 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <Texto tipo="apoio" style={{ fontSize: 11.5, lineHeight: 16, fontWeight: "600", flex: 1 }}>Custo total da compra (preço + ITBI)</Texto>
                  <Texto tipo="numero" style={{ fontSize: 12, lineHeight: 17, fontWeight: "600" }}>
                    {`${formatarReais(partes.transferencia.totalMinimoReais)} a ${formatarReais(partes.transferencia.totalMaximoReais)}`}
                  </Texto>
                </View>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
                  {`${partes.transferencia.explicacao} Fonte: ${partes.transferencia.fonteCurta}.`}
                </Texto>
              </View>
            ) : null}

            {partes.otimizacaoFechamento ? (
              <View style={{ marginTop: 2, paddingTop: 6, borderTopWidth: 1, borderTopColor: cor("cor-linha"), gap: 2 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <Texto tipo="apoio" style={{ fontSize: 11.5, lineHeight: 16, fontWeight: "600", flex: 1 }}>
                    Economia legal no fechamento (ITBI + cartório)
                  </Texto>
                  <Texto tipo="numero" cor="cor-salvia-escura" style={{ fontSize: 12, lineHeight: 17, fontWeight: "600" }}>
                    {`até ${formatarReais(partes.otimizacaoFechamento.melhorCenarioEconomiaReais)}`}
                  </Texto>
                </View>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
                  {`À vista em 30 dias (1,8%): economiza ${formatarReais(partes.otimizacaoFechamento.economiaAVistaTempestivoReais)}${partes.otimizacaoFechamento.economiaSfhReais ? ` · Financiado SFH (1,0% até R$ 1.036.600,71): economiza ${formatarReais(partes.otimizacaoFechamento.economiaSfhReais)}` : ""}.`}
                </Texto>
              </View>
            ) : null}

            {partes.alertaMarinha ? (
              <View
                style={{
                  marginTop: 4,
                  padding: 10,
                  borderRadius: 9,
                  backgroundColor: cor("cor-superficie"),
                  borderWidth: 1,
                  borderColor: cor("cor-linha"),
                  gap: 3,
                }}
              >
                <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 11.5, lineHeight: 16, fontWeight: "700" }}>
                  {partes.alertaMarinha.titulo}
                </Texto>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>
                  {partes.alertaMarinha.explicacaoHumana}
                </Texto>
              </View>
            ) : null}
          </View>

          <Nota>Estimativas pessoais não entram no mensal conhecido do imóvel.</Nota>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: ESPACO[1] }}>
        <LinkComSeta rotulo="Ver composição e ajustar valores" onPress={aoAjustar} />
        {aoAbrirPerfilDomicilio ? (
          <LinkComSeta
            rotulo={perfilConfigurado ? "Ajustar perfil da casa" : "Personalizar perfil da casa"}
            onPress={aoAbrirPerfilDomicilio}
          />
        ) : null}
      </View>
    </View>
  );
}
