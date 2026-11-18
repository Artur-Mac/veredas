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
}: PropsTresPerguntasDoBolso) {
  const { cor } = useTema();
  const [copiado, setCopiado] = useState(false);

  const compra = modalidade === "compra";
  const baseMensal = compra ? prestacaoEstimadaReais : (aluguelAnunciadoReais ?? 0);
  const spuMensal = Math.round(spuAnualReais / 12);
  const totalMensalReal = Math.max(
    0,
    Math.round(baseMensal + condominioMensalReais + iptuMensalReais + custoMensalArReais + spuMensal),
  );

  // Pergunta 1: Caixa na mao para entrar
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

  // Pergunta 2: Saida mensal real empilhada
  const fatiasMesBase: FatiaBarra[] = [
    { rotulo: compra ? "Financiamento" : "Aluguel", valor: baseMensal, corToken: "cor-acao" },
    { rotulo: "Condomínio", valor: condominioMensalReais, corToken: "cor-salvia" },
    { rotulo: "IPTU", valor: iptuMensalReais, corToken: "cor-azul-cadastral" },
    { rotulo: "Climatização / energia", valor: custoMensalArReais, corToken: "cat-ipe-amarelo" },
    { rotulo: "Taxa da União /12", valor: spuMensal, corToken: "cor-barro" },
  ];
  const fatiasMes = fatiasMesBase.filter((f) => f.valor > 0);

  // Calculadora Cascata de Negociacao
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
    <View testID="tres-perguntas-do-bolso" style={styles.wrapper}>
      {/* Pergunta 1: Dinheiro na mao para entrar */}
      <View style={[styles.cartao, { backgroundColor: cor("cor-superficie"), borderColor: cor("cor-linha-forte") }]}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 12, fontWeight: "600" }}>
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
          <View style={[styles.dicaVerde, { backgroundColor: cor("cor-salvia-suave"), borderColor: cor("cor-salvia") }]}>
            <Texto tipo="etiqueta" cor="cor-salvia-escura" style={styles.textoDicaTitulo}>
              {`Economia legal no fechamento: até ${formatarReais(economiaLegalItbiCartorioReais)}`}
            </Texto>
            <Texto tipo="apoio" cor="cor-salvia-escura" style={styles.textoDicaDetalhe}>
              Pela regra municipal do Recife (1% na faixa financiada e 1,8% pagando no prazo certo de até 180 dias).
            </Texto>
          </View>
        ) : null}
      </View>

      {/* Pergunta 2: Saida mensal real */}
      <View style={[styles.cartao, { backgroundColor: cor("cor-superficie"), borderColor: cor("cor-linha-forte") }]}>
        <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 12, fontWeight: "600" }}>
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
      </View>

      {/* Pergunta 3: 10 anos comprar vs alugar */}
      {compra && saldo10AnosCompraVsAluguelReais !== null ? (
        <View style={[styles.cartao, { backgroundColor: cor("cor-superficie"), borderColor: cor("cor-linha-forte") }]}>
          <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 12, fontWeight: "600" }}>
            Visão de 10 anos
          </Texto>
          <Texto tipo="secao" style={styles.perguntaTitulo}>
            Comprar vs manter capital aplicado no CDI
          </Texto>
          <View style={[styles.dicaNeutro, { backgroundColor: cor("cor-papel-claro"), borderColor: cor("cor-linha") }]}>
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

      {/* Cascata visual de desconto / negociacao + copiar WhatsApp */}
      {compra && precoBase && precoAlvoJusto && deducoesNegociacao.length > 0 ? (
        <View
          testID="cascata-negociacao"
          style={[styles.cartao, { backgroundColor: cor("cor-papel-claro"), borderColor: cor("cor-acao") }]}
        >
          <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 12, fontWeight: "600" }}>
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

      <Pressable
        testID="botao-copiar-whatsapp"
        accessibilityRole="button"
        onPress={copiarParaWhatsapp}
        style={({ pressed }) => [
          styles.botaoWhatsapp,
          {
            backgroundColor: copiado ? cor("cor-salvia-suave") : cor("cor-texto"),
            borderColor: copiado ? cor("cor-salvia") : cor("cor-texto"),
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
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  cartao: {
    borderRadius: RAIO.cartao,
    borderWidth: 1,
    padding: 16,
    gap: 10,
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
    flexShrink: 1,
  },
  valorDestaque: {
    fontSize: 18,
    fontWeight: "700",
  },
  barraEmpilhada: {
    height: 12,
    borderRadius: 6,
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
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  textoLegenda: {
    fontSize: 12,
  },
  dicaVerde: {
    borderRadius: RAIO.quadrado,
    borderWidth: 1,
    padding: 10,
    gap: 3,
  },
  dicaNeutro: {
    borderRadius: RAIO.quadrado,
    borderWidth: 1,
    padding: 10,
    gap: 4,
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
  botaoWhatsapp: {
    minHeight: TOQUE_MINIMO,
    borderRadius: RAIO.quadrado,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textoBotaoWhatsapp: {
    fontSize: 14,
    fontWeight: "700",
  },
});
