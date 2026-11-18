import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { formatarReais, formatarReaisCompacto } from "../../dados/formatos";
import { Texto } from "../Texto";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO, type TokenDeCor } from "../../tema/tokens";

export type PropsTresPerguntasDoBolso = {
  modalidade: "compra" | "aluguel";
  nomeImovel: string;
  enderecoImovel: string;
  precoAnuncioReais: number | null;
  aluguelAnunciadoReais: number | null;
  condominioMensalReais: number;
  iptuMensalReais: number;
  prestacaoEstimadaReais: number;
  entradaReais: number;
  itbiReais: number;
  cartorioRegistroReais: number;
  spuAnualReais: number;
  custoMensalArReais: number;
  economiaLegalItbiCartorioReais: number;
  descontoRuidoReais: number;
  vplCalorPoenteReais: number;
  riscoManutencaoPredioReais: number;
  excedenteMedianaM2Reais: number;
  saldo10AnosCompraVsAluguelReais?: number | null;
  pendenciaDocumentalResumo?: string | null;
};

type FatiaBarra = {
  rotulo: string;
  valor: number;
  corToken: TokenDeCor;
};

export function TresPerguntasDoBolso({
  modalidade,
  nomeImovel,
  enderecoImovel,
  precoAnuncioReais,
  aluguelAnunciadoReais,
  condominioMensalReais,
  iptuMensalReais,
  prestacaoEstimadaReais,
  entradaReais,
  itbiReais,
  cartorioRegistroReais,
  spuAnualReais,
  custoMensalArReais,
  economiaLegalItbiCartorioReais,
  descontoRuidoReais,
  vplCalorPoenteReais,
  riscoManutencaoPredioReais,
  excedenteMedianaM2Reais,
  saldo10AnosCompraVsAluguelReais = null,
  pendenciaDocumentalResumo = null,
}: PropsTresPerguntasDoBolso) {
  const { cor } = useTema();
  const [copiado, setCopiado] = useState(false);
  const [verChecklistIptu, setVerChecklistIptu] = useState(false);
  const [verMetodoBolso, setVerMetodoBolso] = useState(false);
  const [modoBolso, setModoBolso] = useState<"morar" | "fechado">("morar");

  const compra = modalidade === "compra";
  const baseMensal = compra ? prestacaoEstimadaReais : (aluguelAnunciadoReais ?? 0);
  const spuMensal = Math.round(spuAnualReais / 12);
  const totalMensalReal = Math.max(
    0,
    Math.round(baseMensal + condominioMensalReais + iptuMensalReais + custoMensalArReais + spuMensal),
  );
  const fixoSemMorador = Math.round(condominioMensalReais + iptuMensalReais + spuMensal);
  const fixoComParcela = Math.round(prestacaoEstimadaReais + fixoSemMorador);

  const dinheiroEntrarBase: FatiaBarra[] = compra
    ? [
        { rotulo: "Entrada (20%)", valor: entradaReais, corToken: "cor-acao" },
        { rotulo: "Imposto (ITBI)", valor: itbiReais, corToken: "cor-azul-cadastral" },
        { rotulo: "Cartório/Registro", valor: cartorioRegistroReais, corToken: "cor-salvia" },
      ]
    : [
        { rotulo: "Garantia / caução (~3x)", valor: (aluguelAnunciadoReais ?? 0) * 3, corToken: "cor-acao" },
        { rotulo: "1º mês + taxas", valor: (aluguelAnunciadoReais ?? 0) + condominioMensalReais, corToken: "cor-azul-cadastral" },
      ];
  const dinheiroEntrar = dinheiroEntrarBase.filter((f) => f.valor > 0);
  const totalEntrar = dinheiroEntrar.reduce((s, f) => s + f.valor, 0);

  const fatiasMesBase: FatiaBarra[] = [
    { rotulo: compra ? "Financiamento" : "Aluguel", valor: baseMensal, corToken: "cor-acao" },
    { rotulo: "Condomínio", valor: condominioMensalReais, corToken: "cor-salvia" },
    { rotulo: "IPTU", valor: iptuMensalReais, corToken: "cor-azul-cadastral" },
    { rotulo: "Climatização / energia", valor: custoMensalArReais, corToken: "cat-ipe-amarelo" },
    { rotulo: "Taxa da União /12", valor: spuMensal, corToken: "cor-barro" },
  ];
  const fatiasMes = fatiasMesBase.filter((f) => f.valor > 0);

  const deducoesNegociacao: { motivo: string; valor: number }[] = [];
  if (excedenteMedianaM2Reais > 3_000) {
    deducoesNegociacao.push({ motivo: "Acima do preço médio do prédio/rua", valor: excedenteMedianaM2Reais });
  }
  if (vplCalorPoenteReais > 2_000) {
    deducoesNegociacao.push({ motivo: "Impacto de calor à tarde (Poente em 10 anos)", valor: vplCalorPoenteReais });
  }
  if (descontoRuidoReais > 2_000) {
    deducoesNegociacao.push({ motivo: "Ruído acima do padrão noturno", valor: descontoRuidoReais });
  }
  if (riscoManutencaoPredioReais > 2_000) {
    deducoesNegociacao.push({ motivo: "Provisão para fachada e obras pela idade do prédio", valor: riscoManutencaoPredioReais });
  }
  const somaDescontos = deducoesNegociacao.reduce((s, d) => s + d.valor, 0);
  const precoBase = compra ? precoAnuncioReais : aluguelAnunciadoReais;
  const tetoDesconto = precoBase ? Math.round(precoBase * 0.22) : somaDescontos;
  const descontoSugerido = Math.min(somaDescontos, tetoDesconto);
  const precoAlvoJusto = precoBase ? Math.max(Math.round(precoBase * 0.72), precoBase - descontoSugerido) : null;

  const textoWhatsapp = [
    `Resumo VEREDA — ${nomeImovel} (${enderecoImovel})`,
    precoBase
      ? `• Pedido anunciado: ${formatarReais(precoBase)}${compra ? "" : "/mês"}`
      : null,
    totalMensalReal > 0
      ? `• Custo mensal completo (com cond., IPTU e luz): ~${formatarReais(totalMensalReal)}/mês`
      : null,
    compra && totalEntrar > 0
      ? `• Dinheiro necessário para entrada + cartório + ITBI: ~${formatarReaisCompacto(totalEntrar)}`
      : null,
    economiaLegalItbiCartorioReais > 500
      ? `• Economia legal prevista em ITBI/Cartório (SFH/180 dias): até ${formatarReais(economiaLegalItbiCartorioReais)}`
      : null,
    deducoesNegociacao.length > 0 && precoAlvoJusto
      ? `• Argumentos técnicos para contraproposta (${deducoesNegociacao.map((d) => `${d.motivo}: -${formatarReaisCompacto(d.valor)}`).join("; ")}) -> Alvo justo sugerido: ${formatarReais(precoAlvoJusto)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const copiarParaWhatsapp = () => {
    void Clipboard.setStringAsync(textoWhatsapp)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
      })
      .catch(() => {
        setCopiado(false);
      });
  };

  return (
    <View
      testID="tres-perguntas-do-bolso"
      style={[
        styles.folhaUnificada,
        { backgroundColor: cor("cor-superficie"), borderColor: cor("cor-linha-forte") },
      ]}
    >
      {/* Bloco 1: Dinheiro à vista para entrar */}
      <View style={styles.secao}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
          Dinheiro à vista para entrar
        </Texto>
        <View style={styles.linhaTituloValor}>
          <Texto tipo="secao" style={styles.perguntaTitulo}>
            {compra ? "Quanto preciso ter na mão agora?" : "Quanto preciso ter na assinatura?"}
          </Texto>
          <Texto tipo="numero" style={styles.valorDestaque}>
            {totalEntrar > 0 ? `~${formatarReaisCompacto(totalEntrar)}` : "A confirmar"}
          </Texto>
        </View>

        {totalEntrar > 0 ? (
          <View style={styles.barraEmpilhada}>
            {dinheiroEntrar.map((f) => (
              <View
                key={f.rotulo}
                style={{
                  flexGrow: f.valor,
                  flexBasis: 0,
                  backgroundColor: cor(f.corToken),
                }}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.legendaWrap}>
          {dinheiroEntrar.map((f) => (
            <View key={f.rotulo} style={styles.legendaItem}>
              <View style={[styles.quadradoCor, { backgroundColor: cor(f.corToken) }]} />
              <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoLegenda}>
                {`${f.rotulo}: ${formatarReaisCompacto(f.valor)}`}
              </Texto>
            </View>
          ))}
        </View>

        {compra && economiaLegalItbiCartorioReais >= 1000 ? (
          <View style={[styles.chamadaLateral, { borderLeftColor: cor("cor-salvia") }]}>
            <Texto tipo="etiqueta" cor="cor-salvia-escura" style={styles.textoDicaTitulo}>
              {`Economia legal no fechamento: até ${formatarReais(economiaLegalItbiCartorioReais)}`}
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              Pela regra municipal do Recife (1% na faixa financiada e 1,8% pagando no prazo certo de até 180 dias).
            </Texto>
          </View>
        ) : null}
      </View>

      {/* Bloco 2: Saída mensal real */}
      <View style={[styles.secao, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
          Saída real do bolso por mês
        </Texto>
        <View style={styles.linhaTituloValor}>
          <Texto tipo="secao" style={styles.perguntaTitulo}>
            Quanto pesa por mês de verdade?
          </Texto>
          <Texto tipo="numero" style={styles.valorDestaque}>
            {totalMensalReal > 0 ? `~${formatarReais(totalMensalReal)}/mês` : "A calcular"}
          </Texto>
        </View>

        {totalMensalReal > 0 ? (
          <View style={styles.barraEmpilhada}>
            {fatiasMes.map((f) => (
              <View
                key={f.rotulo}
                style={{
                  flexGrow: f.valor,
                  flexBasis: 0,
                  backgroundColor: cor(f.corToken),
                }}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.legendaWrap}>
          {fatiasMes.map((f) => (
            <View key={f.rotulo} style={styles.legendaItem}>
              <View style={[styles.quadradoCor, { backgroundColor: cor(f.corToken) }]} />
              <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoLegenda}>
                {`${f.rotulo}: ${formatarReais(f.valor)}`}
              </Texto>
            </View>
          ))}
        </View>

        {compra && totalMensalReal > 0 ? (
          <View role="radiogroup" accessibilityLabel="Cenário de uso do imóvel" style={styles.linhaModoUso}>
            <Pressable
              testID="bolso-modo-morar"
              accessibilityRole="radio"
              accessibilityState={{ checked: modoBolso === "morar" }}
              onPress={() => setModoBolso("morar")}
              style={[
                styles.pilulaModoUso,
                { backgroundColor: modoBolso === "morar" ? cor("cor-texto") : cor("cor-sutil") },
              ]}
            >
              <Texto
                tipo="apoio"
                cor={modoBolso === "morar" ? "cor-papel-claro" : "cor-texto-apoio"}
                style={styles.textoModoUso}
              >
                Morando no imóvel
              </Texto>
            </Pressable>
            <Pressable
              testID="bolso-modo-imovel-fechado"
              accessibilityRole="radio"
              accessibilityState={{ checked: modoBolso === "fechado" }}
              onPress={() => setModoBolso("fechado")}
              style={[
                styles.pilulaModoUso,
                { backgroundColor: modoBolso === "fechado" ? cor("cor-texto") : cor("cor-sutil") },
              ]}
            >
              <Texto
                tipo="apoio"
                cor={modoBolso === "fechado" ? "cor-papel-claro" : "cor-texto-apoio"}
                style={styles.textoModoUso}
              >
                Fechado / em reforma
              </Texto>
            </Pressable>
          </View>
        ) : null}

        {compra && totalMensalReal > 0 && modoBolso === "fechado" ? (
          <View
            testID="bolso-resumo-imovel-fechado"
            style={[styles.chamadaLateral, { borderLeftColor: cor("cor-azul-cadastral") }]}
          >
            <Texto
              tipo="apoio"
              cor="cor-texto"
              style={[styles.textoDicaDetalhe, { fontVariant: ["tabular-nums"] }]}
            >
              {`Sem morador (obra ou transição): ~${formatarReais(fixoSemMorador)}/mês de encargos fixos do imóvel (condomínio + IPTU${spuMensal > 0 ? " + União" : ""})${prestacaoEstimadaReais > 0 ? `, ou ~${formatarReais(fixoComParcela)}/mês somando a prestação` : ""} — sem contar consumo de climatização.`}
            </Texto>
          </View>
        ) : null}

        {pendenciaDocumentalResumo ? (
          <View
            testID="nudge-pendencia-documental"
            style={[styles.chamadaLateral, { borderLeftColor: cor("cor-acao") }]}
          >
            <Texto tipo="etiqueta" cor="cor-barro-texto" style={styles.textoDicaTitulo}>
              Documentação para conferir junto deste custo
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              {pendenciaDocumentalResumo}
            </Texto>
          </View>
        ) : null}

        <Pressable
          testID="iptu-revisao-toggle"
          accessibilityRole="button"
          accessibilityState={{ expanded: verChecklistIptu }}
          onPress={() => setVerChecklistIptu((v) => !v)}
          style={styles.botaoChecklistIptu}
        >
          <Texto tipo="apoio" cor="cor-azul-cadastral" style={styles.textoChecklistIptu}>
            {verChecklistIptu
              ? "Ocultar conferência de revisão e isenção de IPTU"
              : "Conferir área e hipóteses de revisão ou isenção do IPTU"}
          </Texto>
        </Pressable>

        {verChecklistIptu ? (
          <View style={[styles.chamadaLateral, { borderLeftColor: cor("cor-azul-cadastral") }]}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              • Área privativa no carnê vs matrícula: divergência relevante permite pedido formal de revisão cadastral na Prefeitura do Recife.
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              • Único imóvel residencial: verifique se o valor venal ou regras específicas (aposentado / servidor / adimplência) geram isenção ou desconto parcial.
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              • Cota única anual costuma conceder abatimento oficial em relação ao pagamento parcelado em 10 vezes.
            </Texto>
          </View>
        ) : null}
      </View>

      {/* Bloco 3: Visão de 10 anos */}
      {compra && saldo10AnosCompraVsAluguelReais !== null ? (
        <View style={[styles.secao, { borderTopWidth: 1, borderTopColor: cor("cor-linha") }]}>
          <Texto tipo="etiqueta" cor="cor-texto-apoio" style={styles.kicker}>
            Visão de 10 anos
          </Texto>
          <Texto tipo="secao" style={styles.perguntaTitulo}>
            Comprar vs manter capital aplicado no CDI
          </Texto>
          <View style={[styles.chamadaLateral, { borderLeftColor: cor("cor-azul-cadastral") }]}>
            <Texto tipo="corpo" style={styles.textoDicaTitulo}>
              {saldo10AnosCompraVsAluguelReais >= 0
                ? `Comprar tende a deixar saldo líquido de ~${formatarReaisCompacto(saldo10AnosCompraVsAluguelReais)} à frente em 10 anos.`
                : `Alugar e aplicar entrada + custos tende a deixar saldo líquido de ~${formatarReaisCompacto(Math.abs(saldo10AnosCompraVsAluguelReais))} à frente em 10 anos.`}
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              Considera prestação, condomínio, IPTU, taxa da União e juros compostos líquidos sobre a entrada.
            </Texto>
          </View>
        </View>
      ) : null}

      {/* Bloco 4: Cascata de contraproposta sem borda dupla */}
      {compra && precoBase && precoAlvoJusto && deducoesNegociacao.length > 0 ? (
        <View
          testID="cascata-negociacao"
          style={[
            styles.secao,
            {
              borderTopWidth: 1,
              borderTopColor: cor("cor-linha"),
              backgroundColor: cor("cor-papel-claro"),
            },
          ]}
        >
          <Texto tipo="etiqueta" cor="cor-barro-texto" style={styles.kicker}>
            Calculadora de contraproposta
          </Texto>
          <Texto tipo="secao" style={styles.perguntaTitulo}>
            Argumentos com conta feita para negociar o preço
          </Texto>

          <View style={styles.cascataLista}>
            <View style={styles.cascataLinha}>
              <Texto tipo="corpo" style={styles.cascataRotulo}>Pedido no anúncio</Texto>
              <Texto tipo="numero" style={styles.cascataValor}>{formatarReais(precoBase)}</Texto>
            </View>
            {deducoesNegociacao.map((d, i) => (
              <View key={i} style={styles.cascataLinha}>
                <Texto tipo="apoio" cor="cor-barro-texto" style={styles.cascataRotulo}>
                  {`− ${d.motivo}`}
                </Texto>
                <Texto tipo="numero" cor="cor-barro-texto" style={styles.cascataValor}>
                  {`-${formatarReaisCompacto(d.valor)}`}
                </Texto>
              </View>
            ))}
            <View style={[styles.cascataLinha, styles.cascataFinal, { borderTopColor: cor("cor-linha-forte") }]}>
              <Texto tipo="etiqueta" cor="cor-salvia-escura" style={styles.cascataFinalRotulo}>
                Alvo sugerido de proposta
              </Texto>
              <Texto tipo="numero" cor="cor-salvia-escura" style={styles.valorDestaque}>
                {formatarReais(precoAlvoJusto)}
              </Texto>
            </View>
          </View>
        </View>
      ) : null}

      {/* Base legal e formulas (Ownwell app30 §6.2 + Symbium R41 + Jupiter R44) */}
      <View style={[styles.faixaMetodo, { borderTopColor: cor("cor-linha") }]}>
        <Pressable
          testID="bolso-metodo-toggle"
          accessibilityRole="button"
          accessibilityState={{ expanded: verMetodoBolso }}
          onPress={() => setVerMetodoBolso((v) => !v)}
          style={styles.botaoChecklistIptu}
        >
          <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoChecklistIptu}>
            {verMetodoBolso
              ? "Ocultar base legal e fórmulas de custo"
              : "Como calculamos impostos, entrada e horizonte de 10 anos"}
          </Texto>
        </Pressable>
        {verMetodoBolso ? (
          <View testID="bolso-ficha-metodo" style={styles.blocoMetodo}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              • ITBI Recife (CTM / LC nº 227/2026): 1% sobre a parcela financiada pelo SFH e 1,8% sobre recursos próprios pagando em até 180 dias (alíquota cheia de 3% fora do prazo).
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              • Terreno da União (Decreto-Lei nº 2.398/1987 e Leis nº 13.139/2015 e 13.240/2015): foro anual (0,6%) ou ocupação (2%) calculados apenas sobre a fração ideal do terreno, excluídas as benfeitorias.
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              • Saída mensal e 10 anos: financiamento referencial Tabela Price com 20% de entrada e comparação líquida contra aplicação no CDI.
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.textoDicaDetalhe}>
              • Limite: simulação educativa local neste aparelho; confirme valores finais na guia oficial da Prefeitura do Recife, cartório e agente financeiro.
            </Texto>
          </View>
        ) : null}
      </View>

      {/* Rodape CTA unico */}
      <View style={[styles.rodapeCta, { borderTopColor: cor("cor-linha") }]}>
        <Pressable
          testID="botao-copiar-whatsapp"
          accessibilityRole="button"
          onPress={copiarParaWhatsapp}
          style={({ pressed }) => [
            styles.botaoWhatsapp,
            {
              backgroundColor: copiado ? cor("cor-salvia-suave") : cor("cor-texto"),
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Texto
            tipo="botao"
            cor={copiado ? "cor-salvia-escura" : "cor-superficie"}
            style={styles.textoBotaoWhatsapp}
          >
            {copiado ? "Resumo copiado! Cole direto no WhatsApp" : "Copiar resumo e proposta para WhatsApp"}
          </Texto>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  folhaUnificada: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    overflow: "hidden",
  },
  secao: {
    padding: 16,
    gap: 10,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
  },
  linhaTituloValor: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 8,
  },
  perguntaTitulo: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  valorDestaque: {
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  barraEmpilhada: {
    height: 10,
    borderRadius: 5,
    flexDirection: "row",
    gap: 2,
    overflow: "hidden",
  },
  legendaWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  legendaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  quadradoCor: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  textoLegenda: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  chamadaLateral: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 2,
    gap: 3,
  },
  textoDicaTitulo: {
    fontSize: 13,
    fontWeight: "700",
  },
  textoDicaDetalhe: {
    fontSize: 12,
    lineHeight: 17,
  },
  cascataLista: {
    gap: 6,
  },
  cascataLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
  },
  cascataRotulo: {
    fontSize: 13,
    flex: 1,
  },
  cascataValor: {
    fontSize: 13.5,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  cascataFinal: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  cascataFinalRotulo: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  rodapeCta: {
    borderTopWidth: 1,
    padding: 12,
  },
  botaoWhatsapp: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotaoWhatsapp: {
    fontSize: 14,
    fontWeight: "700",
  },
  botaoChecklistIptu: {
    minHeight: TOQUE_MINIMO,
    justifyContent: "center",
  },
  textoChecklistIptu: {
    fontSize: 12,
    fontWeight: "600",
  },
  faixaMetodo: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  blocoMetodo: {
    paddingBottom: 10,
    gap: 4,
  },
  linhaModoUso: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  pilulaModoUso: {
    flex: 1,
    minHeight: TOQUE_MINIMO,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textoModoUso: {
    fontSize: 12,
    fontWeight: "700",
  },
});
