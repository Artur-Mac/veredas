import type { AnaliseV2, Edificio } from "./contratos";
import { custoMensal, type CustoMensal } from "./custos";
import { formatarNumero, formatarReais } from "./formatos";
import { distanciaMetros } from "./geo";
import { bairroPorSlug } from "./recife/bairros";
import {
  baseDeReferenciasPublicas,
  centroideDoBairro,
  verificarFaixaDeMarinha,
  type BaseReferenciasPublicas,
} from "./recife/referenciasPublicas";
import type { ModoDeTransporte, PerfilDoDomicilio, UsoArCondicionado } from "../estado/PerfilDomicilio";

export type FatiaEstimadaDaRotina = {
  id: "energia" | "deslocamento";
  rotulo: string;
  valorMensalReais: number;
  explicacaoHumana: string;
  fonteCurta: string;
};

export type SimulacaoDeCompra = {
  entradaReais: number;
  entradaPct: number;
  valorFinanciadoReais: number;
  prazoAnos: number;
  prazoMeses: number;
  taxaEfetivaAnualPct: number;
  /** Prestação mensal constante pela Tabela Price (apenas juros + amortização de referência BCB, sem taxas acessórias do banco). */
  prestacaoPriceReais: number;
  fonteCurta: string;
};

export type AlertaMarinhaCompra = {
  titulo: string;
  laudemioReferencia5PctReais: number | null;
  explicacaoHumana: string;
  perguntaParaCorretor: string;
  fonteCurta: string;
};

export type ReferenciaIptuCadastral = {
  mensalMedianoReais: number;
  anualMedianoReais: number;
  amostraUnidades: number;
  nota: string;
};

export type CustoPorPartes = {
  /** Camada 1: exatamente o custo oficial conhecido do imóvel (aluguel/condomínio/IPTU declarados), sem misturar estimativas. */
  oficial: CustoMensal;
  /** Quando o IPTU do anúncio está pendente mas o edifício confirmado tem mediana cadastral no IPTU 2026. */
  referenciaIptuDoPredio: ReferenciaIptuCadastral | null;
  /** Camada 2: estimativas mensais da rotina da pessoa neste endereço (separadas das parcelas fixas do imóvel). */
  fatiasDaRotina: FatiaEstimadaDaRotina[];
  /** Soma apenas das estimativas pessoais de rotina (luz + deslocamento), nunca misturada com `oficial.totalMensalConhecido`. */
  somaRotinaEstimadaReais: number;
  /** Simulação separada de financiamento na compra (referência Banco Central SGS 20774). */
  simulacaoCompra: SimulacaoDeCompra | null;
  /** Orientação sobre Terreno de Marinha / Laudêmio de 5% quando aplicável em compra no Recife. */
  alertaMarinha: AlertaMarinhaCompra | null;
  /** Comparação puramente descritiva com o teto mensal definido pela pessoa, se houver. */
  comparacaoComTetoPessoal: string | null;
  /** Compatibilidade: a direção da janela não altera o consumo estimado. */
  janelaPoenteConsiderada: boolean;
};

const KWH_BASE_POR_MORADOR = 55;
const KWH_FIXO_ELETRODOMESTICOS = 65;

const KWH_AR_CONDICIONADO: Record<UsoArCondicionado, number> = {
  nenhum: 0,
  // 1 split inverter 9.000 BTU ~8h/noite (~0,55 kWh/h efetivo com ciclo do compressor * 30 noites ~= 130 kWh/mês)
  noite_1_quarto: 130,
  // 2 aparelhos ou uso dia + noite (~280 kWh/mês)
  intenso_2_quartos: 280,
};

function rotuloDoTransporte(modo: ModoDeTransporte): string {
  switch (modo) {
    case "transporte_publico":
      return "ônibus / metrô";
    case "carro_moto":
      return "carro ou moto";
    case "app":
      return "transporte por aplicativo";
    case "a_pe_bike":
      return "a pé ou bicicleta";
  }
}

export function estimarEnergiaMensal(
  perfil: PerfilDoDomicilio,
  refs: BaseReferenciasPublicas,
  _orientacaoJanelaGraus: number | null = null,
): { fatia: FatiaEstimadaDaRotina; poente: boolean } {
  // A direção não fornece carga térmica: nenhuma majoração de kWh sem um modelo validado.
  const poente = false;
  const kwhDomestico = KWH_FIXO_ELETRODOMESTICOS + perfil.moradores * KWH_BASE_POR_MORADOR;
  const kwhArBase = KWH_AR_CONDICIONADO[perfil.usoArCondicionado];
  const kwhTotal = kwhDomestico + kwhArBase;
  const valorMensalReais = Math.round(kwhTotal * refs.energia.tarifaComTributosEstimadaKwh);

  const textoAr =
    perfil.usoArCondicionado === "nenhum"
      ? "sem ar-condicionado"
      : perfil.usoArCondicionado === "noite_1_quarto"
        ? "ar ligado à noite em 1 quarto"
        : "uso frequente de ar em 2 ambientes";

  const notaPoente = "";

  return {
    poente,
    fatia: {
      id: "energia",
      rotulo: "Luz estimada da casa",
      valorMensalReais,
      explicacaoHumana: `Cerca de ${formatarNumero(kwhTotal)} kWh/mês para ${perfil.moradores} ${perfil.moradores === 1 ? "pessoa" : "pessoas"} (${textoAr}).${notaPoente}`,
      fonteCurta: `Tarifa Neoenergia PE homologada pela ANEEL (${refs.energia.inicioVigencia.slice(0, 7)}) + tributos médios`,
    },
  };
}

export function estimarDeslocamentoMensal(
  analise: AnaliseV2,
  predio: Edificio | null,
  perfil: PerfilDoDomicilio,
  refs: BaseReferenciasPublicas,
): FatiaEstimadaDaRotina | null {
  if (!perfil.destinoBairro || perfil.diasPresenciaisMes <= 0) return null;
  const origem = predio?.centro ?? centroideDoBairro(analise.bairro);
  const destino = centroideDoBairro(perfil.destinoBairro);
  if (!origem || !destino) return null;

  const nomeDestino = bairroPorSlug(perfil.destinoBairro)?.nome ?? perfil.destinoBairro;
  const distLinhaRetaM = distanciaMetros(origem, destino);
  // Fator médio 1,32x entre distância em linha reta e percurso viário urbano no Recife (mínimo 0,8 km quando no mesmo bairro).
  const distViariaKm = Math.max(0.8, Number(((distLinhaRetaM * 1.32) / 1000).toFixed(1)));
  const trechosMes = perfil.diasPresenciaisMes * 2;

  let valorMensalReais = 0;
  let detalheModo = "";
  let fonteCurta = "Distância viária estimada entre o endereço e o bairro de destino";

  switch (perfil.modoTransporte) {
    case "a_pe_bike": {
      valorMensalReais = 0;
      const minutosBike = Math.max(4, Math.round((distViariaKm / 14) * 60));
      detalheModo = `Percurso estimado de ${String(distViariaKm).replace(".", ",")} km por trecho (~${minutosBike} min de bicicleta) até ${nomeDestino}, ${perfil.diasPresenciaisMes} dias/mês.`;
      break;
    }
    case "transporte_publico": {
      valorMensalReais = Math.round(trechosMes * refs.transportePublico.tarifaAnelAReais);
      detalheModo = `${trechosMes} viagens/mês (${perfil.diasPresenciaisMes} dias ida e volta) até ${nomeDestino} (~${String(distViariaKm).replace(".", ",")} km por trecho) pela tarifa Anel A (${formatarReais(refs.transportePublico.tarifaAnelAReais)}).`;
      fonteCurta = refs.transportePublico.fonte;
      break;
    }
    case "carro_moto": {
      const kmMes = Math.round(distViariaKm * trechosMes);
      // Custo operacional direto médio urbano (combustível + pneus/óleo ~R$ 0,92/km, sem estacionamento privado)
      valorMensalReais = Math.round(kmMes * 0.92);
      detalheModo = `Cerca de ${formatarNumero(kmMes)} km/mês ida e volta até ${nomeDestino} (${perfil.diasPresenciaisMes} dias/mês, ${rotuloDoTransporte(perfil.modoTransporte)}). Não inclui estacionamento pago.`;
      break;
    }
    case "app": {
      const porTrecho = Math.max(11, 7.5 + distViariaKm * 2.1);
      valorMensalReais = Math.round(porTrecho * trechosMes);
      detalheModo = `${trechosMes} corridas estimadas/mês até ${nomeDestino} (~${String(distViariaKm).replace(".", ",")} km por trecho, sem tarifa dinâmica de chuva/pico).`;
      break;
    }
  }

  return {
    id: "deslocamento",
    rotulo: `Deslocamento até ${nomeDestino}`,
    valorMensalReais,
    explicacaoHumana: detalheModo,
    fonteCurta,
  };
}

export function simularFinanciamentoPrice(
  precoCompraReais: number,
  perfil: PerfilDoDomicilio,
  refs: BaseReferenciasPublicas,
): SimulacaoDeCompra {
  const entradaPct = perfil.entradaPercentualCompra;
  const entradaReais = Math.round((precoCompraReais * entradaPct) / 100);
  const valorFinanciadoReais = Math.max(0, precoCompraReais - entradaReais);
  const prazoAnos = perfil.prazoAnosCompra;
  const prazoMeses = prazoAnos * 12;
  const taxaEfetivaAnualPct = refs.financiamento.taxaEfetivaAnualPct;
  const taxaMensal = Math.pow(1 + taxaEfetivaAnualPct / 100, 1 / 12) - 1;

  const fator = Math.pow(1 + taxaMensal, prazoMeses);
  const prestacaoPriceReais =
    valorFinanciadoReais > 0 && taxaMensal > 0
      ? Math.round((valorFinanciadoReais * (taxaMensal * fator)) / (fator - 1))
      : 0;

  return {
    entradaReais,
    entradaPct,
    valorFinanciadoReais,
    prazoAnos,
    prazoMeses,
    taxaEfetivaAnualPct,
    prestacaoPriceReais,
    fonteCurta: `Taxa média de mercado PF de ${String(taxaEfetivaAnualPct).replace(".", ",")}% a.a. (${refs.financiamento.fonte}, ref. ${refs.financiamento.referenciaData.slice(0, 7)})`,
  };
}

/**
 * Monta o quadro de Custo por Partes respeitando estritamente a separação entre:
 * 1) Encargos fixos conhecidos do imóvel (`oficial`), e
 * 2) Estimativas parametrizadas da rotina da pessoa (`fatiasDaRotina` / `simulacaoCompra`).
 */
export function derivarCustoPorPartes(
  analise: AnaliseV2,
  predio: Edificio | null,
  perfil: PerfilDoDomicilio,
): CustoPorPartes {
  const refs = baseDeReferenciasPublicas();
  const oficial = custoMensal(analise);
  const orientacaoGraus = analise.visita?.orientacaoGraus ?? null;

  // Referência cadastral quando o anúncio não informou o IPTU mas o lote confirmado tem mediana anual no IPTU 2026
  const parcelaIptu = oficial.parcelas.find((p) => p.nome === "IPTU");
  let referenciaIptuDoPredio: ReferenciaIptuCadastral | null = null;
  if (parcelaIptu && parcelaIptu.estado !== "conhecido" && predio?.iptuAnual && predio.iptuAnual.mediana > 0) {
    const anualMedianoReais = Math.round(predio.iptuAnual.mediana);
    const mensalMedianoReais = Math.round(predio.iptuAnual.mediana / 12);
    referenciaIptuDoPredio = {
      mensalMedianoReais,
      anualMedianoReais,
      amostraUnidades: predio.iptuAnual.n,
      nota: `IPTU não informado no anúncio. Como referência cadastral, a mediana do IPTU 2026 neste edifício equivale a ${formatarReais(mensalMedianoReais)}/mês (${formatarReais(anualMedianoReais)}/ano em ${predio.iptuAnual.n} ${predio.iptuAnual.n === 1 ? "unidade" : "unidades"}). Confirme o boleto da unidade.`,
    };
  }

  const fatiasDaRotina: FatiaEstimadaDaRotina[] = [];
  const { fatia: fatiaEnergia, poente } = estimarEnergiaMensal(perfil, refs, orientacaoGraus);
  fatiasDaRotina.push(fatiaEnergia);

  const fatiaDeslocamento = estimarDeslocamentoMensal(analise, predio, perfil, refs);
  if (fatiaDeslocamento) fatiasDaRotina.push(fatiaDeslocamento);

  const somaRotinaEstimadaReais = fatiasDaRotina.reduce((acc, f) => acc + f.valorMensalReais, 0);

  let simulacaoCompra: SimulacaoDeCompra | null = null;
  let alertaMarinha: AlertaMarinhaCompra | null = null;

  if (analise.modalidade === "compra") {
    if (oficial.principal.valor !== null && oficial.principal.valor > 0) {
      simulacaoCompra = simularFinanciamentoPrice(oficial.principal.valor, perfil, refs);
    }
    const indicioMarinha = verificarFaixaDeMarinha(predio?.centro ?? null, analise.bairro);
    if (indicioMarinha.emFaixaDeAtencao) {
      const preco = oficial.principal.valor;
      const laudemio5Pct = preco !== null && preco > 0 ? Math.round(preco * 0.05) : null;
      const localTexto =
        indicioMarinha.motivo === "orla_atlantica"
          ? "faixa próxima à orla marítima"
          : indicioMarinha.motivo === "margem_estuarina"
            ? "faixa próxima a margem de rio ou estuário sob maré"
            : "bairro de ilha ou aterro histórico do Recife";
      alertaMarinha = {
        titulo: "Conferir regime de Terreno de Marinha (SPU) na matrícula",
        laudemioReferencia5PctReais: laudemio5Pct,
        explicacaoHumana:
          laudemio5Pct !== null
            ? `Imóvel em ${localTexto}, onde parte dos lotes tem domínio da União (SPU). Se a matrícula for de ocupação ou aforamento, a transferência cobra laudêmio de 5% (${formatarReais(laudemio5Pct)} sobre o valor anunciado, além do ITBI municipal) e taxa/foro anual.`
            : `Imóvel em ${localTexto}, onde parte dos lotes tem domínio da União (SPU). Se a matrícula for de ocupação ou aforamento, há cobrança de laudêmio de 5% na compra e taxa/foro anual.`,
        perguntaParaCorretor:
          "Na certidão de matrícula deste imóvel, o terreno consta como alodial (livre de marinha) ou tem inscrição na SPU com laudêmio e foro/taxa de ocupação?",
        fonteCurta: `${refs.marinha.normaReferencia} · Geometria hídrica ESIG Recife (ODbL)`,
      };
    }
  }

  let comparacaoComTetoPessoal: string | null = null;
  if (
    perfil.orcamentoMensalReais !== null &&
    oficial.totalMensalConhecido !== null &&
    analise.modalidade === "aluguel"
  ) {
    const diferenca = oficial.totalMensalConhecido - perfil.orcamentoMensalReais;
    if (diferenca === 0) {
      comparacaoComTetoPessoal = `As parcelas fixas conhecidas (${formatarReais(oficial.totalMensalConhecido)}/mês) coincidem exatamente com o teto de ${formatarReais(perfil.orcamentoMensalReais)}/mês que você anotou no seu perfil.`;
    } else if (diferenca < 0) {
      comparacaoComTetoPessoal = `As parcelas fixas conhecidas (${formatarReais(oficial.totalMensalConhecido)}/mês) deixam ${formatarReais(Math.abs(diferenca))}/mês de margem dentro do teto de ${formatarReais(perfil.orcamentoMensalReais)}/mês que você anotou.`;
    } else {
      comparacaoComTetoPessoal = `As parcelas fixas conhecidas (${formatarReais(oficial.totalMensalConhecido)}/mês) ficam ${formatarReais(diferenca)}/mês acima do teto de ${formatarReais(perfil.orcamentoMensalReais)}/mês que você anotou.`;
    }
  }

  return {
    oficial,
    referenciaIptuDoPredio,
    fatiasDaRotina,
    somaRotinaEstimadaReais,
    simulacaoCompra,
    alertaMarinha,
    comparacaoComTetoPessoal,
    janelaPoenteConsiderada: poente,
  };
}
