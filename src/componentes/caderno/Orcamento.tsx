import { useState } from "react";
import { View } from "react-native";
import type { AnaliseV2 } from "../../dados/contratos";
import { cadernoVazio, esquemaCenario, type Caderno } from "../../dados/caderno";
import { custoMensal } from "../../dados/custos";
import { formatarReais } from "../../dados/formatos";
import { comprarOuAlugar, horizonte, price, taxaMensalEfetiva } from "../../dados/orcamento";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, centavosDaEntrada, GrupoLocal } from "./blocos";

type Props = { analise: AnaliseV2; salvar: (mudar: (c: Caderno) => Caderno) => Promise<boolean> };
export function OrcamentoPessoal({ analise, salvar }: Props) {
  const caderno = analise.caderno ?? cadernoVazio();
  const custo = custoMensal(analise);
  const [nome, setNome] = useState("");
  const [meses, setMeses] = useState("12");
  const [despesas, setDespesas] = useState("");
  const [caucao, setCaucao] = useState("");
  const [extras, setExtras] = useState("");
  const [erro, setErro] = useState("");
  const [entrada, setEntrada] = useState("");
  const [taxa, setTaxa] = useState("");
  const [prazo, setPrazo] = useState("360");
  const [priceGuardada, setPriceGuardada] = useState<{ chave: string; valor: ReturnType<typeof price> } | null>(null);
  const [aluguel, setAluguel] = useState("");
  const [aquisicao, setAquisicao] = useState("");
  const [retorno, setRetorno] = useState("");
  const [valorizacao, setValorizacao] = useState("");
  const [venda, setVenda] = useState("");
  const [comparacaoGuardada, setComparacaoGuardada] = useState<{ chave: string; valor: ReturnType<typeof comprarOuAlugar> } | null>(null);
  const chavePrice = JSON.stringify([analise.declarados.preco, entrada, taxa, prazo]);
  const chaveComparacao = JSON.stringify([chavePrice, analise.declarados, meses, aluguel, aquisicao, retorno, valorizacao, venda]);
  const resultado = priceGuardada?.chave === chavePrice ? priceGuardada.valor : null;
  const comparacao = comparacaoGuardada?.chave === chaveComparacao ? comparacaoGuardada.valor : null;
  const setResultado = (valor: ReturnType<typeof price> | null) => setPriceGuardada(valor ? { chave: chavePrice, valor } : null);
  const setComparacao = (valor: ReturnType<typeof comprarOuAlugar> | null) => setComparacaoGuardada(valor ? { chave: chaveComparacao, valor } : null);
  const guardar = async () => {
    try {
      const c = esquemaCenario.parse({ id: `cenario-${Date.now().toString(36)}`, nome, meses: Number(meses),
        despesasIniciaisCentavos: centavosDaEntrada(despesas), caucaoCentavos: centavosDaEntrada(caucao),
        extrasMensaisCentavos: centavosDaEntrada(extras), registradoEm: new Date().toISOString() });
      if (await salvar(anterior => ({ ...anterior, cenarios: [...anterior.cenarios, c] }))) { setNome(""); setErro(""); }
    } catch { setErro("Confira o nome, o horizonte de 1 a 600 meses e os valores. Vazio continua desconhecido."); }
  };
  const simular = () => {
    try {
      const preco = analise.declarados.preco.aConfirmar ? null : analise.declarados.preco.valor;
      const e = centavosDaEntrada(entrada);
      const anual = centavosDaEntrada(taxa);
      if (preco === null || e === null || anual === null || e > Math.round(preco * 100)) throw new Error();
      setResultado(price(Math.round(preco * 100) - e, taxaMensalEfetiva(anual / 10000), Number(prazo)));
      setErro("");
    } catch { setResultado(null); setErro("Informe aquisição conhecida, entrada, taxa anual efetiva (%) e prazo válido. A entrada não pode superar o preço."); }
  };
  const comparar = () => {
    try {
      const preco = analise.declarados.preco.aConfirmar ? null : analise.declarados.preco.valor;
      const dinheiro = (texto: string) => { const v = centavosDaEntrada(texto); if (v === null) throw new Error(); return v; };
      const percentual = (texto: string) => (texto.trim().startsWith("-") ? -1 : 1) * dinheiro(texto.trim().replace(/^-/, "")) / 10000;
      if (preco === null || custo.pendentes > 0 || custo.totalMensalConhecido === null) throw new Error();
      const r = comprarOuAlugar({ precoCentavos: Math.round(preco * 100), entradaCentavos: dinheiro(entrada),
        taxaMensal: taxaMensalEfetiva(dinheiro(taxa) / 10000), prazo: Number(prazo), horizonte: Number(meses),
        aluguelMensalCentavos: dinheiro(aluguel), custosCompraMensaisCentavos: Math.round(custo.totalMensalConhecido * 100),
        custosAquisicaoCentavos: dinheiro(aquisicao), retornoMensal: taxaMensalEfetiva(percentual(retorno)),
        valorizacaoMensal: taxaMensalEfetiva(percentual(valorizacao)), custoVendaFracao: dinheiro(venda) / 10000 });
      setComparacao(r); setErro("");
    } catch (e) { setComparacao(null); setErro(e instanceof Error && e.message.startsWith("As hipóteses excedem") ? e.message : "Confirme as parcelas mensais da compra e preencha todas as hipóteses, inclusive entrada, taxa e prazo do financiamento. Zero é uma hipótese válida; vazio continua desconhecido."); }
  };
  return <View style={{ gap: 12 }}>
    <Texto tipo="titulo-tela">Seu orçamento.</Texto>
    <Texto tipo="secao">Mensal conhecido: {custo.totalMensalConhecido === null ? "A confirmar" : formatarReais(custo.totalMensalConhecido)}</Texto>
    <Texto tipo="apoio">{custo.notaForaDaSoma ?? "Parcelas recorrentes informadas."} Preço de aquisição permanece separado.</Texto>
    {caderno.cenarios.map(c => {
      const h = horizonte(analise, c);
      return <View key={c.id} style={{ gap: 6, marginVertical: 10 }}>
        <Texto tipo="secao">{c.nome} · {c.meses} meses</Texto>
        <Texto>Despesa conhecida no horizonte: {h.despesaConhecidaCentavos === null ? "A confirmar" : formatarReais(h.despesaConhecidaCentavos / 100)}</Texto>
        <Texto>Caixa inicial informado: {h.caixaInicialConhecidoCentavos === null ? "A confirmar" : formatarReais(h.caixaInicialConhecidoCentavos / 100)}</Texto>
        <Texto tipo="apoio">Caução reembolsável: {h.caucaoCentavos === null ? "A confirmar" : formatarReais(h.caucaoCentavos / 100)}. Não entra como despesa definitiva.</Texto>
        <Texto tipo="apoio">{h.completo ? "Entradas deste cenário preenchidas." : "Cenário parcial: há valores a confirmar."} Calculado com o mensal conhecido atual; hipóteses do cenário não alteram o anúncio.</Texto>
      </View>;
    })}
    <GrupoLocal titulo="Novo cenário de permanência" apoio="Separe despesas de entrada do valor reembolsável. Digite zero quando souber que não há custo.">
      <CampoLocal rotulo="Nome do cenário" value={nome} onChangeText={setNome} maxLength={100} />
      <CampoLocal rotulo="Horizonte em meses" value={meses} onChangeText={setMeses} keyboardType="number-pad" />
      <CampoLocal rotulo="Despesas iniciais em R$" value={despesas} onChangeText={setDespesas} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Caução reembolsável em R$" value={caucao} onChangeText={setCaucao} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Extras mensais em R$ (água, energia, transporte)" value={extras} onChangeText={setExtras} keyboardType="decimal-pad" />
      <Botao rotulo="Guardar cenário" variante="principal" onPress={() => void guardar()} />
    </GrupoLocal>
    {analise.modalidade === "compra" ? <GrupoLocal titulo="Simular financiamento Price" apoio="Simulação nominal. Não é proposta bancária ou CET.">
      <CampoLocal rotulo="Entrada em R$" value={entrada} onChangeText={setEntrada} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Taxa anual efetiva em %" value={taxa} onChangeText={setTaxa} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Prazo do financiamento em meses" value={prazo} onChangeText={setPrazo} keyboardType="number-pad" />
      <Botao rotulo="Calcular parcela simulada" onPress={simular} />
      {resultado ? <><Texto>Parcela simulada: {formatarReais(resultado.parcelaCentavos / 100)}</Texto>
        <Texto>Última parcela ajustada ao saldo: {formatarReais(resultado.parcelaFinalCentavos / 100)}</Texto>
        <Texto>Juros no prazo: {formatarReais(resultado.jurosCentavos / 100)}</Texto><Texto tipo="apoio">{resultado.excluidos}</Texto></> : null}
    </GrupoLocal> : null}
    {analise.modalidade === "compra" ? <GrupoLocal titulo="Cenário comprar × alugar" apoio="Usa entrada, taxa e prazo preenchidos no simulador, e o horizonte em meses. Confirme custos recorrentes antes de calcular. Não é recomendação financeira.">
      <CampoLocal rotulo="Aluguel equivalente mensal em R$ (com encargos)" value={aluguel} onChangeText={setAluguel} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Custos de aquisição em R$ (tributos e taxas informados)" value={aquisicao} onChangeText={setAquisicao} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Retorno anual efetivo líquido do investimento em %" value={retorno} onChangeText={setRetorno} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Valorização anual hipotética em %" value={valorizacao} onChangeText={setValorizacao} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Custo hipotético de venda em % do imóvel" value={venda} onChangeText={setVenda} keyboardType="decimal-pad" />
      <Botao rotulo="Calcular cenário comprar e alugar" onPress={comparar} />
      {comparacao ? <>
        <Texto>Compra — patrimônio líquido estimado no horizonte: {formatarReais(comparacao.patrimonioCompraCentavos / 100)}</Texto>
        <Texto>Compra — saldo devedor estimado: {formatarReais(comparacao.saldoDevedorCentavos / 100)}</Texto>
        <Texto>Aluguel — investimento estimado no horizonte: {formatarReais(comparacao.investimentoAluguelCentavos / 100)}</Texto>
        <Texto tipo="apoio">Diferenças mensais de caixa são investidas no cenário com menor desembolso. Hipóteses nominais constantes; inflação, reajustes, seguros e custos não preenchidos não são inferidos. Altere as hipóteses para avaliar sensibilidade.</Texto>
      </> : null}
    </GrupoLocal> : null}
    {erro ? <Texto role="alert">{erro}</Texto> : null}
  </View>;
}
