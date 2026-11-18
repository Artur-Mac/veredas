import {
  normalizarParaEntailment,
  paraEpistemicTag,
  type AbsenceState,
  type EpistemicTag,
} from "../../nucleo/contratosCanonicos";
import type { CustoPorPartes } from "../custoPorPartes";
import type { ResultadoBioclimatico3D } from "../../municipios/recife/motores/bioclimatico3d";
import type { ResultadoAcustica3D } from "../../nucleo/motores/acustica3d";
import type { ResultadoHidroMare1m } from "../../municipios/recife/motores/hidroMare1m";
import type { ResultadoZeladoriaPu } from "../../nucleo/motores/zeladoriaPuLearning";
import type { ResultadoEconometriaItbi } from "../../municipios/recife/motores/econometriaItbi";
import type { ResultadoResilienciaRedes } from "../../municipios/recife/motores/resilienciaRedes";
import type { ResultadoAuditoriaDocumental } from "../../nucleo/documentos/auditorDocumental";

/**
 * Tradutor Cidadão em 3 Camadas Progressivas (IND-01..IND-10):
 * - Camada 1: Manchete clara em 1 frase sem jargão técnico nem palavras de julgamento proibidas.
 * - Camada 2: Impacto financeiro/rotina + ação prática recomendada.
 * - Camada 3: Gaveta recolhida de prova e método com Cartão de Método (6 campos), chaves duplas (DSQFL + CNM),
 *             artigo legal + a conta e os 3 estados distintos de ausência.
 */

export type EstadoAusenciaCidadao =
  | { estado: AbsenceState; textoExplicativo: string }
  | null;

export type CartaoMetodo6Campos = {
  oQueMede: string;
  baseLegalOuNormativa: string;
  aritmeticaResumo: string;
  fontePrimaria: string;
  vintage: string;
  limiteEpistemologico: string;
};

export type CartaoCidadao3Camadas = {
  indicadorId:
    | "IND-01"
    | "IND-02"
    | "IND-03"
    | "IND-04"
    | "IND-05"
    | "IND-06"
    | "IND-07"
    | "IND-08"
    | "IND-09"
    | "IND-10";
  tituloCurto: string;
  camada1Manchete: string;
  camada2ImpactoPratico: string;
  camada2AcaoConcreta: string;
  camada3ProvaMetodo: {
    epistemicTag: EpistemicTag;
    ausencia: EstadoAusenciaCidadao;
    chavesDuplas: { dsqfl: string | null; cnm16: string | null };
    metodo6Campos: CartaoMetodo6Campos;
  };
};

export const REGEX_JARGON_CAMADA1 =
  /\b(?:DSQFL|HAND|TWI|Fellegi-?Sunter|PU-?Learning|NSDI|PEZR|ST-?DBSCAN|Pareto|CAA-?[IV]+|VUP|D2m,nT)\b/i;

export const PALAVRAS_PROIBIDAS_UI: RegExp[] = [
  /perigos/i,
  /vale a pena/i,
  /\bcaro\b/i,
  /\bcara\b/i,
  /barat/i,
  /caix[ãa]o/i,
  /ótim|\botim/i,
  /\bruim\b/i,
  /arriscad/i,
];

export function sanearTextoCamada1(texto: string): string {
  const clean = texto.replace(/\s+/g, " ").trim();
  for (const p of PALAVRAS_PROIBIDAS_UI) {
    if (p.test(clean)) {
      return clean
        .replace(/pr[eé]dio[s]?\s*-?\s*caix[ãa]o/gi, "alvenaria autoportante")
        .replace(/caix[ãa]o/gi, "alvenaria autoportante")
        .replace(/vale a pena/gi, "compensa no horizonte de 10 anos")
        .replace(/perigos\w*/gi, "de atenção")
        .replace(/arriscad\w*/gi, "sensível")
        .replace(/\bcar[oa]\b/gi, "elevado")
        .replace(/barat\w*/gi, "econômico")
        .replace(/ótim\w*|otim\w*/gi, "favorável")
        .replace(/\bruim\b/gi, "desfavorável");
    }
  }
  return clean;
}

export function descreverAusenciaCidadao(estado: AbsenceState | null): EstadoAusenciaCidadao {
  if (!estado) return null;
  if (estado === "nao_se_aplica") {
    return {
      estado,
      textoExplicativo: "Não se aplica a este imóvel (fora da faixa ou regime correspondente).",
    };
  }
  if (estado === "sem_ocorrencia_no_periodo") {
    return {
      estado,
      textoExplicativo: "Sem ocorrência registrada no período consultado nas bases públicas.",
    };
  }
  return {
    estado,
    textoExplicativo: "Ainda não sabemos — peça esta confirmação na visita ou certidão.",
  };
}

function fReais(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "a confirmar";
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
}

export type EntradaTradutorCidadao = {
  modalidade: "compra" | "aluguel";
  dsqfl?: string | null;
  cnm16?: string | null;
  custoPorPartes: CustoPorPartes;
  econometriaItbi?: ResultadoEconometriaItbi | null;
  bioclimatico?: ResultadoBioclimatico3D | null;
  acustica?: ResultadoAcustica3D | null;
  hidroMare?: ResultadoHidroMare1m | null;
  zeladoriaPu?: ResultadoZeladoriaPu | null;
  resiliencia?: ResultadoResilienciaRedes | null;
  auditoriaDocs?: ResultadoAuditoriaDocumental | null;
};

export function traduzirIndicadoresCidadao(entrada: EntradaTradutorCidadao): CartaoCidadao3Camadas[] {
  const { dsqfl = null, cnm16 = null, custoPorPartes } = entrada;
  const spu = custoPorPartes.spuEstatutario ?? null;
  const est = custoPorPartes.estruturaECondominio ?? null;
  const itbiOpt = custoPorPartes.otimizacaoFechamento ?? null;
  const eco = entrada.econometriaItbi ?? null;
  const bio = entrada.bioclimatico ?? null;
  const acu = entrada.acustica ?? null;
  const hid = entrada.hidroMare ?? null;
  const pu = entrada.zeladoriaPu ?? null;
  const res = entrada.resiliencia ?? null;
  const doc = entrada.auditoriaDocs ?? null;

  const chavesDuplas = { dsqfl, cnm16 };

  // IND-01: Terreno da União / FGTS
  const ind01: CartaoCidadao3Camadas = {
    indicadorId: "IND-01",
    tituloCurto: "Terreno de Marinha e FGTS",
    camada1Manchete:
      entrada.modalidade === "aluguel"
        ? "Na locação, taxa ou foro de terreno da União não são pagos na compra pelo inquilino."
        : spu?.regime === "ocupacao"
          ? "Terreno sob regime de ocupação da União bloqueia uso do FGTS pela Caixa."
          : spu?.regime === "aforamento"
            ? `Aforamento permite FGTS e cobra cerca de ${fReais(spu.foroMensalReais)}/mês além do laudêmio sobre o terreno.`
            : "Confirme na matrícula se o lote paga taxa anual da União (Terreno de Marinha).",
    camada2ImpactoPratico:
      spu?.laudemio5PctVendedorReais != null
        ? `Laudêmio do vendedor estimado em ${fReais(spu.laudemio5PctVendedorReais)} sobre a fração do terreno.`
        : "Sem valor oficial do terreno informado na consulta.",
    camada2AcaoConcreta:
      "Peça a Certidão de Matrícula (ONR) e confira se o terreno é alodial, aforado ou ocupado antes do sinal.",
    camada3ProvaMetodo: {
      epistemicTag: spu?.epistemicTag ?? "nao_sabemos",
      ausencia:
        entrada.modalidade === "aluguel"
          ? descreverAusenciaCidadao("nao_se_aplica")
          : spu?.baseTerrenoUnidadeReais == null
            ? descreverAusenciaCidadao("sem_leitura_publicada")
            : null,
      chavesDuplas,
      metodo6Campos: {
        oQueMede: "Laudêmio (5%), ocupação (2% a.a.) ou foro (0,6% a.a.) e bloqueio de FGTS.",
        baseLegalOuNormativa: "Decreto-Lei nº 2.398/1987, Leis nº 13.240/2015 e 14.474/2022.",
        aritmeticaResumo: "Incide apenas sobre (Valor do Domínio Pleno do Terreno × Fração Ideal).",
        // R10 (19/11/2026): nenhuma tela informa o valor do terreno, então a conta pela fração ideal não roda. A ficha
        // diz isso em vez de citar uma fonte que não foi lida.
        fontePrimaria:
          spu?.baseTerrenoUnidadeReais != null
            ? "Valor do domínio pleno do terreno informado para esta análise (certidão do RIP na SPU)"
            : "Nenhum valor de terreno da SPU foi lido: a conta só roda com o valor do domínio pleno, que vem da certidão do RIP",
        vintage: spu?.baseTerrenoUnidadeReais != null ? "2026-11" : "sem leitura",
        limiteEpistemologico:
          spu?.limiteEpistemologico ?? "Exige certidão do RIP na SPU para confirmar o regime individual.",
      },
    },
  };

  // IND-02: Manutenção do prédio e divisão do boleto
  const sistemasCrit = est?.sistemasEmJanelaCritica.length ?? 0;
  const abusivos = est?.segregacaoLei8245.itensCobrancaAbusivaNoBoleto.length ?? 0;
  const ind02: CartaoCidadao3Camadas = {
    indicadorId: "IND-02",
    tituloCurto: "Obras do prédio e boleto",
    camada1Manchete: sanearTextoCamada1(
      entrada.modalidade === "aluguel" && abusivos > 0
        ? `Boleto inclui ${abusivos} item(ns) extraordinário(s) que competem ao proprietário.`
        : sistemasCrit > 0
          ? `${sistemasCrit} sistema(s) do edifício entraram em janela de reforma pelo tempo de construção.`
          : "Sem alerta imediato de obras extraordinárias além do ciclo normal.",
    ),
    camada2ImpactoPratico:
      est?.choqueCotaExtraEstimadoPorUnidadeReais != null
        ? `Rateio estimado por unidade: ${fReais(est.choqueCotaExtraEstimadoPorUnidadeReais)} (considerando reserva e inadimplência).`
        : "Consulte o saldo atual do fundo de reserva nas últimas atas.",
    camada2AcaoConcreta:
      "Solicite os últimos 3 balancetes, atas de assembleia e o laudo de vistoria predial trienal.",
    camada3ProvaMetodo: {
      epistemicTag: est?.epistemicTag ?? "nao_sabemos",
      ausencia: est ? null : descreverAusenciaCidadao("sem_leitura_publicada"),
      chavesDuplas,
      metodo6Campos: {
        oQueMede: "Ciclo de vida útil de fachada/impermeabilização, maresia costeira e divisão do boleto.",
        baseLegalOuNormativa: "ABNT NBR 15575-1:2025, NBR 6118, Lei PE 13.032/2006 e Lei 8.245/1991 Art. 22 X.",
        aritmeticaResumo: "(Orçamento da obra - Fundo de reserva) / Unidades / (1 - Inadimplência).",
        fontePrimaria: "IPTU Recife 2026 + atas condominiais",
        vintage: "2026-11",
        limiteEpistemologico:
          est?.limiteEpistemologico ?? "Idade construtiva estimada não substitui vistoria com ART/RRT.",
      },
    },
  };

  // IND-03: Sol, calor e proteção da vista
  const ind03: CartaoCidadao3Camadas = {
    indicadorId: "IND-03",
    tituloCurto: "Sol, vento e risco de perder a vista",
    camada1Manchete: sanearTextoCamada1(
      bio
        ? bio.exposicaoPoente
          ? "Apartamento recebe sol forte da tarde, exigindo mais uso de climatização."
          : `Fachada com ${bio.horasSolEquinocioH.toFixed(1)} h de sol direto e boa entrada de brisa leste-sudeste.`
        : "Informe para qual lado a janela principal aponta para simular sol e gasto de energia.",
    ),
    camada2ImpactoPratico: bio
      ? bio.exposicaoPoente
        ? `Consumo adicional estimado de ${fReais(bio.custoMensalExtraPoenteReais)}/mês (${fReais(bio.vpl10AnosPoenteReais)} em 10 anos).`
        : bio.radarPerdaVista.riscoSubstancialVerticalizacao
          ? `Lotes vizinhos têm margem legal para crescer até ${bio.radarPerdaVista.margemLegalGabaritoMaxM ?? "?"} m.`
          : "Entorno imediato sem grande potencial de verticalização aberta."
      : "Use a bússola na visita ao lado da janela da sala e do quarto.",
    camada2AcaoConcreta:
      "Confira a orientação da varanda na visita e se há terrenos baixos sem proteção patrimonial à frente.",
    camada3ProvaMetodo: {
      epistemicTag: bio?.epistemicTag ?? "nao_sabemos",
      ausencia: bio ? null : descreverAusenciaCidadao("sem_leitura_publicada"),
      chavesDuplas,
      metodo6Campos: {
        oQueMede: "Horas de insolação solar, brisa alísia e gabarito construtivo aberto ao redor.",
        baseLegalOuNormativa: "EN 17037, Lei Municipal Recife 19.389/2025 (LPUOS) e Decretos 39.664-39.667/2026.",
        aritmeticaResumo: "Cálculo solar a 8,05° S descontado horizonte 108B; VPL 120m a 8% a.a.",
        fontePrimaria: "PE3D LiDAR + ESIG LPUOS + MapBiomas LST",
        vintage: "2026-11",
        limiteEpistemologico:
          bio?.limiteEpistemologico ?? "Árvores e películas na esquadria alteram a carga térmica real.",
      },
    },
  };

  // IND-04: Silêncio nos quartos
  const ind04: CartaoCidadao3Camadas = {
    indicadorId: "IND-04",
    tituloCurto: "Ruído no quarto e horário de teste",
    camada1Manchete: sanearTextoCamada1(
      acu
        ? acu.ruidoExternoAeronavePezrDb > 0
          ? `Rota de aviões gera cerca de ${acu.ruidoExternoAeronavePezrDb} dB externos mesmo em andares altos.`
          : acu.atendeLimiteNoturnoLei16243_50Db
            ? `Estimativa noturna tranquila no quarto (${acu.ruidoInternoDormitorioDbA.toFixed(1)} dB internos).`
            : `Ruído estimado de ${acu.ruidoInternoDormitorioDbA.toFixed(1)} dB no quarto pede atenção às janelas.`
        : "Silêncio do quarto depende da fachada, distância da via e esquadrias.",
    ),
    camada2ImpactoPratico: acu
      ? `Melhor janela para testar na visita: ${acu.agendaPiorHoraVisita[0] ?? "após 22h"}.`
      : "Leve o medidor em memória na visita para checar a diferença de janela aberta vs fechada.",
    camada2AcaoConcreta: "Agende a segunda visita no horário de pico apontado acima e teste vedação das janelas.",
    camada3ProvaMetodo: {
      epistemicTag: acu?.epistemicTag ?? "nao_sabemos",
      ausencia: acu ? null : descreverAusenciaCidadao("sem_leitura_publicada"),
      chavesDuplas,
      metodo6Campos: {
        oQueMede: "Ruído externo combinado (via + eventos noturnos + rota aérea) e isolamento do quarto.",
        baseLegalOuNormativa: "ABNT NBR 15575-4 (corte 2013), ANAC RBAC 161 e Lei Recife 16.243/1996.",
        aritmeticaResumo: "Soma energética logarítmica menos isolamento D2m,nT,w por idade da obra.",
        fontePrimaria: "CTTU vias + LUSE 150m + ANAC/DECEA SBRF",
        vintage: "2026-11",
        limiteEpistemologico: acu?.limiteEpistemologico ?? "Esquadrias trocadas pelos moradores melhoram a vedação.",
      },
    },
  };

  // IND-05: Chuva e maré alta na rua
  const ind05: CartaoCidadao3Camadas = {
    indicadorId: "IND-05",
    tituloCurto: "Risco de alagamento na rua e garagem",
    camada1Manchete: sanearTextoCamada1(
      hid
        ? hid.classificacaoExposicao === "critica_lote_baixo"
          ? "Lote em cota baixa com histórico próximo de acúmulo de água em chuva e maré alta."
          : hid.classificacaoExposicao === "atencao_via_entorno"
            ? `Foram agrupados ${hid.eventosDistintosAgrupados} episódio(s) distintos de chuva no entorno.`
            : "Cota do terreno fica acima dos pontos baixos mapeados ao redor."
        : "Confirme na portaria se a rampa da garagem já teve entrada de água.",
    ),
    camada2ImpactoPratico: hid
      ? hid.alertaDrenagemNaoLimpa
        ? "Registro recente aponta canal de drenagem da região sem execução de limpeza."
        : hid.riscoAcumulado30AnosPct !== null
          ? `Probabilidade acumulada de ${hid.riscoAcumulado30AnosPct.toFixed(1)}% ao longo de 30 anos.`
          : "Verifique se o desnível da entrada fica acima da rua."
      : "Cheque marcas d'água no muro do subsolo.",
    camada2AcaoConcreta: "Pergunte ao zelador sobre comportas, bombas de recalque e altura do meio-fio em maré alta.",
    camada3ProvaMetodo: {
      epistemicTag: hid?.epistemicTag ?? "nao_sabemos",
      ausencia:
        hid && hid.eventosDistintosAgrupados === 0
          ? descreverAusenciaCidadao("sem_ocorrencia_no_periodo")
          : hid
            ? null
            : descreverAusenciaCidadao("sem_leitura_publicada"),
      chavesDuplas,
      metodo6Campos: {
        oQueMede: "Agrupamento espaço-temporal de ocorrências + altitude relativa ao canal e maré.",
        baseLegalOuNormativa: "Modelo hidrológico 1 m (HAND/TWI) + Tábua DHN/REMO Porto do Recife.",
        aritmeticaResumo: "1 - (1 - p)^30 em 30 anos; descontos hedônicos de referência (-4,6% a -24,9%).",
        fontePrimaria: "EMLURB 156 + APAC/COP + Marinha + PE3D",
        vintage: "2026-11",
        limiteEpistemologico:
          hid?.limiteEpistemologico ?? "Bombeamento próprio do condomínio altera o impacto dentro da garagem.",
      },
    },
  };

  // IND-06: Cuidado urbano da rua (sem viés de subnotificação)
  const ind06Item = pu?.itens[0] ?? null;
  const ind06: CartaoCidadao3Camadas = {
    indicadorId: "IND-06",
    tituloCurto: "Manutenção da rua e iluminação",
    camada1Manchete: sanearTextoCamada1(
      ind06Item
        ? ind06Item.rotuloZeladoria === "subnotificacao_provavel"
          ? "Sinais físicos apontam necessidade de atenção na rua mesmo sem muitos protocolos abertos."
          : ind06Item.rotuloZeladoria === "incidencia_confirmada_156"
            ? "Rua possui registros oficiais de manutenção ou drenagem junto à prefeitura."
            : "Sem indicação relevante de carência crônica de manutenção nos dados públicos."
        : "Ausência de chamado ao 156 não garante rua livre de problemas físicos.",
    ),
    camada2ImpactoPratico: ind06Item
      ? `Propensão estimada de reporte no setor: ${Math.round(ind06Item.propensaoReporteEstimada * 100)}%.`
      : "Observe calçada, drenagem de boca de lobo e postes acesos ao visitar.",
    camada2AcaoConcreta: "Passe pela rua à noite ou no fim da tarde para avaliar iluminação e circulação real.",
    camada3ProvaMetodo: {
      epistemicTag: pu?.epistemicTag ?? "nao_sabemos",
      ausencia: pu ? null : descreverAusenciaCidadao("sem_leitura_publicada"),
      chavesDuplas,
      metodo6Campos: {
        oQueMede: "Risco urbano latente corrigindo subnotificação por renda e acesso ao canal 156.",
        baseLegalOuNormativa: "Boxer, Hong, Kontokosta & Neill (2025) Positive-Unlabeled EM.",
        aritmeticaResumo: "Decompõe P(reportado=1) = P(ocorrência=1) × P(cidadão reportar).",
        fontePrimaria: "156 EMLURB + Censo 2022 + geometria de canal",
        vintage: "2026-11",
        limiteEpistemologico: pu?.limiteEpistemologico ?? "Modelo inferencial para evitar falso senso de tranquilidade.",
      },
    },
  };

  // IND-07: Negociação, ITBI e histórico fiscal do prédio
  const melhorEco = itbiOpt?.melhorCenarioEconomiaReais ?? null;
  const ind07: CartaoCidadao3Camadas = {
    indicadorId: "IND-07",
    tituloCurto: "Economia de ITBI e base de preço",
    camada1Manchete: sanearTextoCamada1(
      entrada.modalidade === "aluguel"
        ? "Economia de imposto de transferência (ITBI) se aplica apenas na compra."
        : melhorEco !== null
          ? `Planejamento correto de prazo e financiamento economiza até ${fReais(melhorEco)} de ITBI; escritura e registro ficam a confirmar no cartório.`
          : "Confira o histórico de transações do prédio e o prazo de 180 dias para pedir o ITBI com alíquota reduzida no Recife.",
    ),
    camada2ImpactoPratico: eco?.medianaReais
      ? `Avaliações fiscais recentes no prédio: mediana de ${fReais(eco.medianaReais)} em ${eco.amostraValidaN} transação(ões).`
      : itbiOpt?.aVistaTempestivo18Pct.prazoLegalDias
        ? `Pedindo o lançamento do ITBI em até ${itbiOpt.aVistaTempestivo18Pct.prazoLegalDias} dias da assinatura do contrato, a alíquota cai de 3% para 1,8%.`
        : "Exija memória do ITBI para conferir se o valor fiscal diverge do preço pedido.",
    camada2AcaoConcreta:
      "Peça o lançamento do ITBI em até 180 dias da assinatura do contrato (em imóvel novo, do habite-se ou do contrato) para pagar 1,8% em vez de 3%. No financiamento pelo SFH, a parte financiada paga 1% até R$ 1.036.600,71 (valor de 2026).",
    camada3ProvaMetodo: {
      epistemicTag: eco?.epistemicTag ?? (itbiOpt ? "registro_oficial" : "nao_sabemos"),
      ausencia:
        entrada.modalidade === "aluguel"
          ? descreverAusenciaCidadao("nao_se_aplica")
          : !eco && !itbiOpt
            ? descreverAusenciaCidadao("sem_leitura_publicada")
            : null,
      chavesDuplas,
      metodo6Campos: {
        oQueMede: "Economia legal de ITBI (diferença entre as alíquotas de 3%, 1,8% e 1%) e estatística comparativa NBR 14653-2. Escritura e registro não entram na conta.",
        baseLegalOuNormativa:
          "Código Tributário do Recife (Lei 15.563/1991), arts. 51, 52 e 55, com a redação das Leis 17.904/2013, 19.174/2023, 19.391/2025 e 19.490/2026; Lei federal 6.015/1973, art. 290; Ato TJPE 1.556/2025 (tabela de 2026); Lei Complementar federal 227/2026.",
        aritmeticaResumo:
          "1% sobre a parte financiada pelo SFH até R$ 1.036.600,71 (2026); 1,8% com pedido em até 180 dias; 3% nos demais casos. Expurgo de Chauvenet + IC 80%.",
        fontePrimaria: "ITBI SEFIN Recife. Escritura e registro: tabela do TJPE, a confirmar no cartório",
        vintage: "2026-11",
        limiteEpistemologico:
          eco?.ressalvaLegalConselhos ??
          "Cálculo tributário informativo; não substitui DAM oficial nem avaliação bancária.",
      },
    },
  };

  // IND-08: Água, luz e internet na rotina
  const ind08: CartaoCidadao3Camadas = {
    indicadorId: "IND-08",
    tituloCurto: "Reserva de água, energia e sinal 5G",
    camada1Manchete: sanearTextoCamada1(
      res
        ? `Reserva estimada para ${res.hidrico.autonomiaReservaDias ?? "?"} dias; atenção à transição AQUA Pernambuco (23/11/2026).`
        : "Confirme capacidade da cisterna, gerador para elevadores e sinal celular nos quartos.",
    ),
    camada2ImpactoPratico: res
      ? `Concessionária em distribuição: ${res.hidrico.concessionariaDistribuicaoVigente}.`
      : "Débitos de água anteriores a 23/11/2026 continuam sendo cobrados pela Compesa.",
    camada2AcaoConcreta: "Teste dados móveis no quarto dos fundos na visita e confira quitação de contas anteriores.",
    camada3ProvaMetodo: {
      epistemicTag: res?.eletrico.epistemicTag ?? "nao_sabemos",
      ausencia: res ? null : descreverAusenciaCidadao("sem_leitura_publicada"),
      chavesDuplas,
      metodo6Campos: {
        oQueMede: "Autonomia da cisterna, interrupções de energia (DEC/FEC) e proximidade de torre 5G.",
        baseLegalOuNormativa: "Concessão AQUA PE (23/11/2026) x Compesa Tapacurá + indicadores ANEEL/ANATEL.",
        aritmeticaResumo: "Volume total (cisterna + caixa) / (Unidades × 2,6 hab × 165 L/dia).",
        fontePrimaria: "ANEEL DEC/FEC + Anatel ERBs + Compesa/AQUA PE",
        vintage: "2026-11",
        limiteEpistemologico:
          res?.limiteEpistemologico ?? "Cisterna e gerador dependem de confirmação física na visita.",
      },
    },
  };

  // IND-09: Integridade estrutural e alvenaria autoportante
  const riscoEst = est?.riscoPredioCaixao ?? "nao_sabemos";
  const ind09: CartaoCidadao3Camadas = {
    indicadorId: "IND-09",
    tituloCurto: "Tipologia construtiva e crédito",
    camada1Manchete: sanearTextoCamada1(
      riscoEst === "confirmado_acordo_trf5"
        ? "Edifício consta em acordo judicial de desocupação e demolição estrutural."
        : riscoEst === "suspeita_tipologica_alvenaria"
          ? "Prédio de até 4 pavimentos em alvenaria autoportante requer laudo estrutural vigente."
          : "Estrutura de concreto armado ou tipologia sem indício cadastral de restrição judicial.",
    ),
    camada2ImpactoPratico:
      est?.bloqueioSeguroECreditoProvavel
        ? "Financiamento habitacional e apólice patrimonial enfrentam bloqueio provável."
        : `Vistoria trienal (Lei PE 13.032/06): ${est?.vistoriaTrienalLei13032.estado ?? "a confirmar"}.`,
    camada2AcaoConcreta: "Peça o último Laudo Técnico de Vistoria Predial (ART/RRT) e a apólice condominial vigente.",
    camada3ProvaMetodo: {
      epistemicTag: est?.epistemicTag ?? "nao_sabemos",
      ausencia: est ? null : descreverAusenciaCidadao("sem_leitura_publicada"),
      chavesDuplas,
      metodo6Campos: {
        oQueMede: "Triagem de alvenaria autoportante vulnerável, Acordo TRF5 (431 edifícios) e vistoria trienal.",
        baseLegalOuNormativa: "Acordo-Base TRF5 01/2024 e Lei Estadual PE 13.032/2006.",
        aritmeticaResumo: "Cruzamento da coluna 31 IPTU (estrutura) × gabarito <= 4 pav. × lista TRF5.",
        fontePrimaria: "IPTU Recife Col. 31 + Acordo TRF5/Seduh",
        vintage: "2026-11",
        limiteEpistemologico: "A triagem cadastral não substitui exame de fundação por engenheiro habilitado.",
      },
    },
  };

  // IND-10: Documentação verificada linha a linha
  const qtdAtivos = doc?.onusAtivos.length ?? null;
  const ind10: CartaoCidadao3Camadas = {
    indicadorId: "IND-10",
    tituloCurto: "Matrícula, atas e processos",
    camada1Manchete: sanearTextoCamada1(
      doc
        ? qtdAtivos! > 0
          ? `Encontrados ${qtdAtivos} registro(s) ativo(s) de gravame ou condição na matrícula.`
          : "Nenhum gravame ativo detectado nas páginas lidas; confira validade de 30 dias da certidão."
        : "Suba a matrícula e a última ata para checar gravames, penhoras e decisões de condomínio.",
    ),
    camada2ImpactoPratico: doc
      ? `Entailment verificável em ${Math.round(doc.taxaCitationEntailment * 100)}% das citações (zero inventos).`
      : "Checar código nacional da matrícula (16 dígitos) e certidões negativas do condomínio.",
    camada2AcaoConcreta: "Solicite certidão de inteiro teor emitida há menos de 30 dias e CND de condomínio.",
    camada3ProvaMetodo: {
      epistemicTag: doc && doc.assercaoCanonicas.length > 0 ? "registro_oficial" : "nao_sabemos",
      ausencia: doc?.estadoAusencia ? descreverAusenciaCidadao(doc.estadoAusencia) : doc ? null : descreverAusenciaCidadao("sem_leitura_publicada"),
      chavesDuplas: { dsqfl, cnm16: doc?.cnmEncontrado?.formatado ?? cnm16 },
      metodo6Campos: {
        oQueMede: "Validade de matrícula (30 dias), dígitos CNM ISO 7064, cadeia R-/AV- e alertas de atas.",
        baseLegalOuNormativa: "Provimento CNJ 143/2023, Decreto 93.240/1986 e STJ dívida propter rem.",
        aritmeticaResumo: "Toda citação passa por prova literal determinística na página de origem.",
        fontePrimaria: "Documentos inseridos no Cofre Privado + DataJud",
        vintage: "2026-11",
        limiteEpistemologico: "Somente páginas anexadas são auditadas; folhas omissas pedem leitura integral.",
      },
    },
  };

  void paraEpistemicTag;
  void normalizarParaEntailment;

  return [ind01, ind02, ind03, ind04, ind05, ind06, ind07, ind08, ind09, ind10];
}
