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
import {
  calcularSpuEstatutario,
  type RegimeSpu,
  type ResultadoSpu,
} from "../nucleo/motores/spuMarinha";
import {
  simularOtimizacaoItbiRecife,
  type ResultadoOtimizadorItbiRecife,
} from "../municipios/recife/motores/econometriaItbi";
import {
  avaliarEstruturaECondominio,
  type ResultadoEstruturaCondominio,
} from "../municipios/recife/motores/estruturaCondominio";

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

export type CustosDeTransferencia = {
  itbiMinimoReais: number;
  itbiMaximoReais: number;
  /** Escritura e registro: tabela do cartório (TJPE), não estimados aqui. */
  escrituraERegistroReais: null;
  totalMinimoReais: number;
  totalMaximoReais: number;
  explicacao: string;
  fonteCurta: string;
};

/** Faixa do ITBI do Recife sobre o preço: 1,8% com o lançamento pedido em até 180 dias, 3% depois disso. */
export const ITBI_ALIQUOTA_MINIMA = 0.018;
export const ITBI_ALIQUOTA_MAXIMA = 0.03;

/**
 * ITBI do Recife numa faixa de 1,8% a 3% sobre o valor (Código Tributário do Recife, Lei 15.563/1991: art. 52, II, 3%;
 * art. 52, parágrafo único, e art. 55, § 1º, 1,8% com o lançamento pedido em até 180 dias; a parte financiada pelo SFH
 * paga 1% até o limite de 2026). O benefício temporário de 2% (Lei 19.452/2025) venceu em 31/12/2025 e saiu da conta.
 * A base é o valor declarado ou o arbitrado pela Prefeitura (art. 51, na redação da Lei 19.490/2026): por isso, sobre
 * o preço é só uma referência.
 */
export function estimarTransferencia(precoReais: number | null): CustosDeTransferencia | null {
  if (precoReais === null || !(precoReais > 0)) return null;
  const itbiMinimoReais = Math.round(precoReais * ITBI_ALIQUOTA_MINIMA), itbiMaximoReais = Math.round(precoReais * ITBI_ALIQUOTA_MAXIMA);
  return {
    itbiMinimoReais, itbiMaximoReais, escrituraERegistroReais: null,
    totalMinimoReais: precoReais + itbiMinimoReais, totalMaximoReais: precoReais + itbiMaximoReais,
    explicacao: `ITBI de ${formatarReais(itbiMinimoReais)} a ${formatarReais(itbiMaximoReais)} (1,8% a 3% do preço anunciado: 1,8% se o lançamento for pedido em até 180 dias da assinatura do contrato, 3% depois disso; a parte financiada pelo SFH paga 1% até R$ 1.036.600,71 em 2026. A base é o valor declarado, se a Prefeitura aceitar). Escritura e registro: a confirmar no cartório (tabela de emolumentos do TJPE).`,
    fonteCurta: "Código Tributário do Recife (Lei 15.563/1991), arts. 51, 52 e 55; Lei municipal 19.490/2026",
  };
}

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
  /** 15/11/2026: custos de transferência na compra (ITBI em faixa; escritura e registro a confirmar, nunca 0). */
  transferencia: CustosDeTransferencia | null;
  /** Comparação puramente descritiva com o teto mensal definido pela pessoa, se houver. */
  comparacaoComTetoPessoal: string | null;
  /** Compatibilidade: a direção da janela não altera o consumo estimado. */
  janelaPoenteConsiderada: boolean;
  /** Motor SPU estatutário (IND-01): laudêmio, taxa/foro e bloqueio de FGTS sobre fração ideal de terreno. */
  spuEstatutario?: ResultadoSpu | null;
  /** Otimizador tributário e cartorário ITBI + TJPE (arts. 52 e 55 do Código Tributário do Recife / art. 290 da Lei 6.015/1973). */
  otimizacaoFechamento?: ResultadoOtimizadorItbiRecife | null;
  /** Triagem estrutural, ciclo VUP NBR 15575-1:2025 e maresia NBR 6118 (IND-02 & IND-09). */
  estruturaECondominio?: ResultadoEstruturaCondominio | null;
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

/** Prestação constante da Tabela Price, com a taxa efetiva anual convertida para mensal; 0 sem valor ou sem taxa. */
export function prestacaoPrice(valorFinanciadoReais: number, prazoMeses: number, taxaEfetivaAnualPct: number): number {
  const taxaMensal = Math.pow(1 + taxaEfetivaAnualPct / 100, 1 / 12) - 1;
  const fator = Math.pow(1 + taxaMensal, prazoMeses);
  return valorFinanciadoReais > 0 && taxaMensal > 0 && prazoMeses > 0 ? Math.round((valorFinanciadoReais * (taxaMensal * fator)) / (fator - 1)) : 0;
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
  const prestacaoPriceReais = prestacaoPrice(valorFinanciadoReais, prazoMeses, taxaEfetivaAnualPct);

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

function estimarDistanciaCostaRecifeM(centro: [number, number] | null): number | null {
  if (!centro) return null;
  // Pontos de referência da linha de preamar na Orla de Boa Viagem / Pina
  const orlaRef: [number, number][] = [
    [-34.881, -8.086],
    [-34.889, -8.116],
    [-34.901, -8.138],
  ];
  let menor = Number.POSITIVE_INFINITY;
  for (const pt of orlaRef) {
    const d = distanciaMetros(centro, pt);
    if (d < menor) menor = d;
  }
  return Number.isFinite(menor) ? Math.round(menor) : null;
}

export type OpcoesMotorEconomico = {
  regimeSpu?: RegimeSpu;
  valorDominioPlenoTerrenoReais?: number | null;
  fracaoIdeal?: number | null;
  financiamentoSfh?: boolean;
};

/**
 * Monta o quadro de Custo por Partes respeitando estritamente a separação entre:
 * 1) Encargos fixos conhecidos do imóvel (`oficial`), e
 * 2) Estimativas parametrizadas da rotina da pessoa (`fatiasDaRotina` / `simulacaoCompra`).
 */
export function derivarCustoPorPartes(
  analise: AnaliseV2,
  predio: Edificio | null,
  perfil: PerfilDoDomicilio,
  opcoes?: OpcoesMotorEconomico,
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
  let spuEstatutario: ResultadoSpu | null = null;
  let otimizacaoFechamento: ResultadoOtimizadorItbiRecife | null = null;

  if (analise.modalidade === "compra") {
    if (oficial.principal.valor !== null && oficial.principal.valor > 0) {
      simulacaoCompra = simularFinanciamentoPrice(oficial.principal.valor, perfil, refs);
      otimizacaoFechamento = simularOtimizacaoItbiRecife({
        precoImovelReais: oficial.principal.valor,
        financiamentoSfh: opcoes?.financiamentoSfh ?? oficial.principal.valor <= 1_500_000,
        percentualFinanciado: Math.max(0.1, 1 - perfil.entradaPercentualCompra / 100),
      });
    }
    const indicioMarinha = verificarFaixaDeMarinha(predio?.centro ?? null, analise.bairro);
    if (indicioMarinha.emFaixaDeAtencao || opcoes?.regimeSpu) {
      // R10 (19/11/2026): nenhuma tela passa `valorDominioPlenoTerrenoReais` nem `regimeSpu`; sem eles, os valores em
      // reais ficam nulos e a tela mostra só o teto de 5% sobre o preço e a pergunta para a matrícula.
      spuEstatutario = calcularSpuEstatutario({
        regime: opcoes?.regimeSpu ?? "nao_sabemos",
        valorDominioPlenoTerrenoReais: opcoes?.valorDominioPlenoTerrenoReais ?? null,
        fracaoIdeal: opcoes?.fracaoIdeal ?? (predio?.unidades ? 1 / predio.unidades : null),
        precoImovelReais: oficial.principal.valor,
        emPoligonalMarinha: indicioMarinha.emFaixaDeAtencao,
      });
    }
    if (indicioMarinha.emFaixaDeAtencao) {
      const preco = oficial.principal.valor;
      const laudemioEstatutario = spuEstatutario?.laudemio5PctVendedorReais ?? null;
      const laudemio5Pct =
        laudemioEstatutario ?? (preco !== null && preco > 0 ? Math.round(preco * 0.05) : null);
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
          laudemioEstatutario !== null
            ? `Imóvel em ${localTexto}. Pela fração ideal sobre o valor do terreno (Decreto-Lei nº 2.398/1987, excluídas benfeitorias), o laudêmio de 5% equivale a ${formatarReais(laudemioEstatutario)}, além da taxa de ocupação (2% a.a.) ou foro (0,6% a.a.).`
            : laudemio5Pct !== null
              ? `Imóvel em ${localTexto}, onde parte dos lotes tem domínio da União (SPU). Por lei (Decreto-Lei nº 2.398/1987), o laudêmio de 5% incide apenas sobre o valor do terreno pela fração ideal; sem essa base cadastral, 5% sobre o preço anunciado seria teto máximo de ${formatarReais(laudemio5Pct)}.`
              : `Imóvel em ${localTexto}, onde parte dos lotes tem domínio da União (SPU). Se a matrícula for de ocupação ou aforamento, há cobrança de laudêmio de 5% sobre o terreno e taxa/foro anual.`,
        perguntaParaCorretor:
          "Na certidão de matrícula deste imóvel, o terreno consta como alodial (livre de marinha) ou tem inscrição na SPU com laudêmio e foro/taxa de ocupação?",
        fonteCurta: `${refs.marinha.normaReferencia} · Decreto-Lei nº 2.398/1987 · Geometria hídrica ESIG Recife (ODbL)`,
      };
    }
  }

  const estruturaECondominio = predio
    ? avaliarEstruturaECondominio({
        buildingId: predio.id,
        bairroSlug: analise.bairro ?? predio.bairro,
        anoConstrucao: predio.anoConstrucao,
        pavimentos: predio.pavimentos,
        tipoEstruturaIptu: predio.ate4Pavimentos ? "Apartamento <= 4 Pavimentos" : "Concreto Armado",
        distanciaCostaOuEstuarioM: estimarDistanciaCostaRecifeM(predio.centro),
        unidadesCondominio: predio.unidades,
      })
    : null;

  const transferencia = analise.modalidade === "compra" ? estimarTransferencia(oficial.principal.valor) : null;

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
    transferencia,
    comparacaoComTetoPessoal,
    janelaPoenteConsiderada: poente,
    spuEstatutario,
    otimizacaoFechamento,
    estruturaECondominio,
  };
}
