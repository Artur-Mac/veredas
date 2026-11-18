// Sínteses inteligentes em linguagem humana (Fases 3 e 4): cruza dados públicos oficiais já auditados
// (Landsat 8/9 ST_B10 100 m, Árvores Tombadas e Parques/Praças ODbL, Censo 2022 Entorno e Renda por Setor,
// Copernicus DEM, Canais/Rios ESIG ODbL, SINAN Arboviroses 2023–2025, GTFS Corredores/Metrô, LUSE, 156 e Obras)
// com o andar e a tipologia do imóvel.
// Regras invioláveis: zero nota/score, zero ranking entre setores/bairros, zero veredito técnico e zero palavra proibida.

import type { Edificio, RuaDoBairro } from "../contratos";
import { formatarDistancia, formatarNumero, formatarReais } from "../formatos";
import { distanciaMetros } from "../geo";
import { bairroPorSlug } from "../recife/bairros";
import {
  lerArbovirosesDoBairro,
  lerAreasVerdesProximas,
  lerCorredoresDeRuidoDiurno,
  lerRelevoECanalProximo,
  lerTemperaturaSuperficie100m,
} from "../recife/camadasAmbientais";
import { lerRendaDoSetorOuBairro, type RetratoRendaCenso } from "../recife/censoRenda";
import { centroideDoBairro } from "../recife/referenciasPublicas";
import { fraseDoAeroporto, relacaoComOAeroporto } from "../recife/aeroporto";
import { lerRuaDoEdificio } from "./rua";

export type CartaoDeSinteseHumana = {
  id: "calor-e-arvores" | "chuva-e-alagamento" | "arboviroses-e-andar" | "ruido-dia-noite" | "renda-setor-censo";
  sobretitulo: string;
  manchete: string;
  medidaDestaque: string;
  explicacaoHumana: string;
  dicaPratica: string | null;
  fonteCurta: string;
  urlFonte: string | null;
};

export type SintesesInteligentesDoEntorno = {
  calorEArvores: CartaoDeSinteseHumana | null;
  chuvaEAlagamento: CartaoDeSinteseHumana | null;
  arboviroses: CartaoDeSinteseHumana | null;
  ruidoDiaNoite: CartaoDeSinteseHumana | null;
  rendaDoSetor: CartaoDeSinteseHumana | null;
  retratoRendaBruto: RetratoRendaCenso | null;
};

function formatarTempC(v: number): string {
  return `${v.toFixed(1).replace(".", ",")} °C`;
}

function formatarDeltaC(v: number): string {
  const sinal = v > 0 ? "+" : "";
  return `${sinal}${v.toFixed(1).replace(".", ",")} °C`;
}

export function derivarSintesesInteligentes(opcoes: {
  slugBairro: string | null;
  edificio: Edificio | null;
  ruaDoBairro: RuaDoBairro | null;
  andar: number | null;
}): SintesesInteligentesDoEntorno {
  const { slugBairro, edificio, ruaDoBairro, andar } = opcoes;
  const nomeBairro = bairroPorSlug(slugBairro)?.nome ?? "bairro";
  const centro = edificio?.centro ?? centroideDoBairro(slugBairro);

  const ruaLida = edificio?.rua ? lerRuaDoEdificio(edificio.rua) : null;
  const setorObj =
    ruaLida && ruaLida.setor !== null && ruaDoBairro?.setores[ruaLida.setor]
      ? ruaDoBairro.setores[ruaLida.setor]!
      : null;
  const codigoSetor = setorObj?.codigo ?? null;

  // 1. CALOR DE SUPERFÍCIE 100 m + ARBORIZAÇÃO
  let calorEArvores: CartaoDeSinteseHumana | null = null;
  if (centro) {
    const term = lerTemperaturaSuperficie100m(centro, slugBairro);
    const verdes = lerAreasVerdesProximas(centro);
    const pctFaceArborizada =
      setorObj && setorObj.domicilios && setorObj.domicilios > 0 && setorObj.arvores !== null
        ? Math.round((setorObj.arvores / setorObj.domicilios) * 100)
        : null;

    if (term) {
      const diff = term.diferencaBairroC;
      let manchete: string;
      let medidaDestaque: string;
      if (diff !== null && diff >= 0.8) {
        medidaDestaque = `${formatarDeltaC(diff)} vs. ${nomeBairro}`;
        manchete = `Superfície da quadra ${formatarDeltaC(diff)} acima da mediana de ${nomeBairro}`;
      } else if (diff !== null && diff <= -0.8) {
        medidaDestaque = `${formatarDeltaC(diff)} vs. ${nomeBairro}`;
        manchete = `Superfície da quadra ${formatarDeltaC(diff)} abaixo da mediana de ${nomeBairro}`;
      } else {
        medidaDestaque = formatarTempC(term.tempQuadraC);
        manchete = `Superfície da quadra na faixa mediana de ${nomeBairro} (${formatarTempC(term.tempQuadraC)})`;
      }

      const partesVerdes: string[] = [
        `Mediana em satélite de 100 m: ${formatarTempC(term.tempQuadraC)}${term.medianaBairroC !== null ? ` (mediana de ${nomeBairro}: ${formatarTempC(term.medianaBairroC)})` : ""}.`,
      ];
      if (pctFaceArborizada !== null) {
        partesVerdes.push(`No setor do Censo, ${pctFaceArborizada}% dos domicílios ficam em quadras com 5 ou mais árvores.`);
      }
      if (verdes.pracaMaisProxima && verdes.pracaMaisProxima.distanciaM <= 350) {
        partesVerdes.push(`${verdes.pracaMaisProxima.nome} a ${formatarDistancia(verdes.pracaMaisProxima.distanciaM)}.`);
      }
      if (verdes.arvoreTombadaProxima) {
        partesVerdes.push(`Árvore tombada (${verdes.arvoreTombadaProxima.nome}) a ${formatarDistancia(verdes.arvoreTombadaProxima.distanciaM)}.`);
      }

      calorEArvores = {
        id: "calor-e-arvores",
        sobretitulo: "Microclima · Satélite 100 m + árvores",
        manchete,
        medidaDestaque,
        explicacaoHumana: partesVerdes.join(" "),
        dicaPratica:
          diff !== null && diff >= 0.8
            ? "Quadras com mais asfalto e telhado retêm calor até o começo da noite; vale sentir a ventilação natural na visita à tarde."
            : "Sombra de copa e praças próximas ajudam a amenizar o calor da calçada ao caminhar a pé.",
        fonteCurta: "USGS Landsat 8/9 ST_B10 (Domínio Público) · IBGE Censo 2022 · PCR ODbL",
        urlFonte: "https://planetarycomputer.microsoft.com/dataset/landsat-c2-l2",
      };
    }
  }

  // 2. QUANDO CHOVE FORTE (RELEVO + CANAIS + 156 DRENAGEM + DEFESA CIVIL)
  let chuvaEAlagamento: CartaoDeSinteseHumana | null = null;
  if (centro) {
    const rel = lerRelevoECanalProximo(centro);
    const pedidosDrenagem12m = ruaLida?.pedidos156.drenagem[0] ?? null;

    // Checa ocorrências de alagamento na rua pela Defesa Civil, se houver prédio confirmado
    const codLogradouro = edificio ? edificio.id.split("-")[0] ?? "" : "";
    const logInfo = codLogradouro && ruaDoBairro?.logradouros[codLogradouro] ? ruaDoBairro.logradouros[codLogradouro] : null;
    const dcAlagamento =
      logInfo?.defesaCivil?.ocorrencias.find(([cat]) => cat === "alagamento")?.[1] ?? 0;

    const canalPerto = rel.cursoDaguaMaisProximo && rel.cursoDaguaMaisProximo.distanciaM <= 220 ? rel.cursoDaguaMaisProximo : null;
    const cotaBaixa =
      (rel.altitudeM !== null && rel.altitudeM <= 4.5) ||
      (rel.diferencaEntornoM !== null && rel.diferencaEntornoM <= -1.2);

    const frases: string[] = [];
    if (rel.altitudeM !== null) {
      const textoRel =
        rel.diferencaEntornoM !== null && Math.abs(rel.diferencaEntornoM) >= 1.0
          ? ` (${rel.diferencaEntornoM < 0 ? `${Math.abs(rel.diferencaEntornoM).toFixed(1).replace(".", ",")} m abaixo` : `${rel.diferencaEntornoM.toFixed(1).replace(".", ",")} m acima`} da média das quadras vizinhas)`
          : "";
      frases.push(`Terreno a cerca de ${rel.altitudeM.toFixed(1).replace(".", ",")} m acima do nível do mar${textoRel}.`);
    }
    if (rel.cursoDaguaMaisProximo && rel.cursoDaguaMaisProximo.distanciaM <= 450) {
      frases.push(`${rel.cursoDaguaMaisProximo.nome} a ${formatarDistancia(rel.cursoDaguaMaisProximo.distanciaM)}.`);
    }
    if (pedidosDrenagem12m !== null) {
      frases.push(
        pedidosDrenagem12m === 0
          ? "Nenhum chamado de drenagem/limpeza de galeria no 156 a até 150 m em 12 meses."
          : `${formatarNumero(pedidosDrenagem12m)} ${pedidosDrenagem12m === 1 ? "chamado" : "chamados"} de drenagem no 156 a até 150 m em 12 meses.`,
      );
    }
    if (dcAlagamento > 0) {
      frases.push(`Defesa Civil registrou ${formatarNumero(dcAlagamento)} ${dcAlagamento === 1 ? "atendimento" : "atendimentos"} por alagamento nesta rua (2014–2024).`);
    }

    if (frases.length > 0) {
      const pedeAtencaoChuva = Boolean(canalPerto || cotaBaixa || (pedidosDrenagem12m !== null && pedidosDrenagem12m >= 3) || dcAlagamento > 0);
      chuvaEAlagamento = {
        id: "chuva-e-alagamento",
        sobretitulo: "Quando chove forte · Relevo, canais e 156",
        manchete: canalPerto
          ? `A ${formatarDistancia(canalPerto.distanciaM)} de ${canalPerto.nome}${rel.altitudeM !== null ? ` · cota ~${Math.round(rel.altitudeM)} m` : ""}`
          : cotaBaixa
            ? `Quadra em cota baixa (~${rel.altitudeM?.toFixed(1).replace(".", ",")} m)${pedidosDrenagem12m ? ` · ${pedidosDrenagem12m} ch. drenagem` : ""}`
            : `Cota de ~${rel.altitudeM !== null ? `${rel.altitudeM.toFixed(1).replace(".", ",")} m` : "planície"} sem canal colado ao lote`,
        medidaDestaque:
          rel.altitudeM !== null ? `Cota ${rel.altitudeM.toFixed(1).replace(".", ",")} m` : "Relevo local",
        explicacaoHumana: frases.join(" "),
        dicaPratica: pedeAtencaoChuva
          ? "No Recife, chuva forte somada à maré alta retarda o escoamento na planície. Pergunte ao porteiro se a rua acumula água no meio-fio e se a garagem fica acima da guia."
          : "Mesmo em cota mais alta, vale observar na visita o caimento da calçada e dos ralos da garagem.",
        fonteCurta: "Copernicus DEM (CC-BY 4.0) · ESIG Recursos Hídricos · Central 156 e Defesa Civil (ODbL)",
        urlFonte: "https://dados.recife.pe.gov.br/dataset/area-urbana",
      };
    }
  }

  // 3. ARBOVIROSES NO BAIRRO + ANDAR DO IMÓVEL
  let arboviroses: CartaoDeSinteseHumana | null = null;
  const arbo = lerArbovirosesDoBairro(slugBairro);
  if (arbo) {
    const tendencia =
      arbo.casos2025 > arbo.casos2024 * 1.15
        ? `alta de 2024 (${formatarNumero(arbo.casos2024)}) para 2025 (${formatarNumero(arbo.casos2025)})`
        : arbo.casos2025 < arbo.casos2024 * 0.85
          ? `queda de 2024 (${formatarNumero(arbo.casos2024)}) para 2025 (${formatarNumero(arbo.casos2025)})`
          : `estabilidade entre 2024 (${formatarNumero(arbo.casos2024)}) e 2025 (${formatarNumero(arbo.casos2025)})`;

    const dicaAndar =
      andar !== null && andar <= 3
        ? `Como o imóvel fica no ${andar}º andar, a presença de mosquitos vindos do térreo e jardins costuma ser maior — vale observar telas nas janelas e ralos com fecho.`
        : andar !== null && andar >= 8
          ? `No ${andar}º andar o voo direto pela fachada diminui bastante, mas vale checar se há água parada em bandejas, garagem e fosso de elevador.`
          : "Nos primeiros andares e casas térreas a circulação de mosquitos é mais intensa, sobretudo após os meses chuvosos (março a julho).";

    arboviroses = {
      id: "arboviroses-e-andar",
      sobretitulo: "Saúde ambiental · Dengue e Chikungunya",
      manchete: `${formatarNumero(arbo.totalConfirmadosProvaveis3Anos)} casos em ${nomeBairro} de 2023 a 2025`,
      medidaDestaque: `${formatarNumero(arbo.casos2025)} em 2025`,
      explicacaoHumana: `Registros oficiais da Secretaria de Saúde em ${nomeBairro} (excluídos os descartados em exame): ${formatarNumero(arbo.casos2023)} em 2023, ${formatarNumero(arbo.casos2024)} em 2024 e ${formatarNumero(arbo.casos2025)} em 2025 (${tendencia}).`,
      dicaPratica: dicaAndar,
      fonteCurta: "Secretaria de Saúde do Recife / SINAN (2023–2025, ODbL)",
      urlFonte: arbo.url,
    };
  }

  // 4. FONTES DE RUÍDO: DE DIA × À NOITE
  let ruidoDiaNoite: CartaoDeSinteseHumana | null = null;
  if (centro) {
    const corr = lerCorredoresDeRuidoDiurno(centro);
    const obras24m = edificio?.obras150m.relevantes24m ?? 0;

    // LUSE (licenças de uso de som) a até 150 m
    let luse150m = 0;
    let menorDistLuseM: number | null = null;
    if (edificio && ruaDoBairro) {
      for (const l of ruaDoBairro.luse) {
        const d = Math.round(distanciaMetros(edificio.centro, l.centro));
        if (d <= 150) {
          luse150m += 1;
          if (menorDistLuseM === null || d < menorDistLuseM) menorDistLuseM = d;
        }
      }
    }

    const onibusPerto = corr.corredorOnibusProximo && corr.corredorOnibusProximo.distanciaM <= 160 ? corr.corredorOnibusProximo : null;
    const metroPerto = corr.distanciaTrilhoMetroM !== null && corr.distanciaTrilhoMetroM <= 250 ? corr.distanciaTrilhoMetroM : null;

    const sinaisDia: string[] = [];
    if (onibusPerto) {
      // VE05 (issue I01 do VE00): `viagensDia` agora são partidas programadas num dia útil típico do GTFS fixado,
      // resolvidas pelo calendário (scripts/dados/transito/corredores.mjs), não a soma de dia útil, sábado e domingo.
      sinaisDia.push(`corredor de ônibus a ${formatarDistancia(onibusPerto.distanciaM)} (${formatarNumero(onibusPerto.viagensDia)} partidas num dia útil)`);
    }
    if (metroPerto !== null) {
      sinaisDia.push(`linha do Metrô/VLT a ${formatarDistancia(metroPerto)}`);
    }
    if (obras24m > 0) {
      sinaisDia.push(`${formatarNumero(obras24m)} ${obras24m === 1 ? "obra licenciada" : "obras licenciadas"} a até 150 m (24 meses)`);
    }

    const textoDia =
      sinaisDia.length > 0
        ? `De dia: ${sinaisDia.join("; ")}.`
        : "De dia: fora de corredor intenso de ônibus/metrô e sem obras licenciadas recentes a até 150 m.";

    const textoNoite =
      edificio && ruaDoBairro
        ? luse150m > 0
          ? `À noite: ${formatarNumero(luse150m)} ${luse150m === 1 ? "local" : "locais"} com licença de som (LUSE) a até 150 m (mais próximo a ${formatarDistancia(menorDistLuseM!)}).`
          : "À noite: nenhum local com licença municipal de som (LUSE) a até 150 m."
        : "À noite: confirme o prédio para cruzar licenças municipais de som (LUSE) a até 150 m.";

    // 18/11/2026 (hub): aeroporto como fonte com nome, sem dB; sob a trajetória vira a manchete.
    let aero: ReturnType<typeof relacaoComOAeroporto> = null;
    try {
      aero = relacaoComOAeroporto(edificio?.centro ?? null);
    } catch {
      aero = null;
    }
    const fraseAviao = aero ? fraseDoAeroporto(aero).frase : "";
    const textoAviao = aero ? ` Avião, de dia e à noite: ${fraseAviao.charAt(0).toLowerCase()}${fraseAviao.slice(1)}` : "";

    let mancheteRuido: string;
    if (aero?.trajetoria) {
      mancheteRuido = fraseDoAeroporto(aero).manchete;
    } else if (sinaisDia.length > 0 && luse150m > 0) {
      mancheteRuido = "Movimento viário/obras de dia e licença de som a até 150 m";
    } else if (sinaisDia.length > 0) {
      mancheteRuido = "Movimento concentrado no horário diurno; sem licença de som a 150 m";
    } else if (luse150m > 0) {
      mancheteRuido = `Via local de dia, mas com ${luse150m} ${luse150m === 1 ? "licença" : "licenças"} de som a até 150 m`;
    } else {
      mancheteRuido = "Fora de eixos intensos de ônibus/metrô e sem licença de som a 150 m";
    }

    const notaAndarRuido =
      andar !== null && andar >= 6 && (onibusPerto || luse150m > 0)
        ? `No ${andar}º andar o som da rua sobe sem barreira quando não há prédio no meio — teste fechar as janelas dos quartos durante a visita.`
        : corr.estacaoMetroProxima && corr.estacaoMetroProxima.distanciaM <= 900
          ? `Estação ${corr.estacaoMetroProxima.nome} a ${formatarDistancia(corr.estacaoMetroProxima.distanciaM)} em linha reta.`
          : "Se puder, passe na rua em dois horários diferentes (horário comercial e começo da noite de sexta/sábado).";

    ruidoDiaNoite = {
      id: "ruido-dia-noite",
      sobretitulo: "Acústica urbana · Dia × Noite",
      manchete: mancheteRuido,
      medidaDestaque: aero?.trajetoria
        ? `Avião a ~${formatarNumero(aero.trajetoria.alturaEstimadaM)} m`
        : onibusPerto ? `Corredor a ${formatarDistancia(onibusPerto.distanciaM)}` : luse150m > 0 ? `${luse150m} LUSE ≤150 m` : "Via interna",
      explicacaoHumana: `${textoDia} ${textoNoite}${textoAviao}`,
      dicaPratica: aero?.trajetoria ? fraseDoAeroporto(aero).pergunta : notaAndarRuido,
      fonteCurta: `GTFS Grande Recife / CBTU · Licenciamento de Obras e LUSE Semas (ODbL)${aero ? " · pista: OpenStreetMap (ODbL)" : ""}`,
      urlFonte: "https://dados.recife.pe.gov.br",
    };
  }

  // 5. RENDA DO SETOR CENSITÁRIO (CENSO 2022 IBGE — DESCRITIVO COM N, ZERO RANKING)
  let rendaDoSetor: CartaoDeSinteseHumana | null = null;
  const retratoRendaBruto = lerRendaDoSetorOuBairro(codigoSetor, slugBairro);
  if (retratoRendaBruto) {
    const ehSetor = retratoRendaBruto.recorte === "setor";
    const escopoTexto = ehSetor ? "neste setor censitário" : `no bairro ${nomeBairro}`;
    if (
      retratoRendaBruto.sigiloEstatistico ||
      retratoRendaBruto.rendaMedianaReais === null ||
      retratoRendaBruto.rendaMedianaReais <= 0 ||
      retratoRendaBruto.rendaMediaReais === null ||
      retratoRendaBruto.rendaMediaReais <= 0
    ) {
      rendaDoSetor = {
        id: "renda-setor-censo",
        sobretitulo: "Perfil demográfico · Censo 2022 IBGE",
        manchete: `Rendimento suprimido por sigilo estatístico ${escopoTexto}`,
        medidaDestaque: "A confirmar",
        explicacaoHumana:
          retratoRendaBruto.domiciliosResponsaveis !== null
            ? `O IBGE recenseou ${formatarNumero(retratoRendaBruto.domiciliosResponsaveis)} domicílios ocupados ${escopoTexto}, mas não divulga valores monetários quando a amostra permite identificar famílias.`
            : `Valores de rendimento não divulgados pelo IBGE ${escopoTexto} por regra de sigilo estatístico.`,
        dicaPratica: null,
        fonteCurta: "IBGE — Censo Demográfico 2022 (Rendimento do Responsável, mai/2026)",
        urlFonte: retratoRendaBruto.urlFonte,
      };
    } else {
      const med = formatarReais(retratoRendaBruto.rendaMedianaReais);
      const media = formatarReais(retratoRendaBruto.rendaMediaReais);
      const nDom =
        retratoRendaBruto.domiciliosResponsaveis !== null
          ? `em ${formatarNumero(retratoRendaBruto.domiciliosResponsaveis)} domicílios particulares ocupados`
          : "";
      const textoMoradores =
        retratoRendaBruto.mediaMoradoresPorDomicilio !== null
          ? ` Média de ${String(retratoRendaBruto.mediaMoradoresPorDomicilio).replace(".", ",")} moradores por domicílio.`
          : "";

      rendaDoSetor = {
        id: "renda-setor-censo",
        sobretitulo: ehSetor ? "Setor censitário · Censo 2022 IBGE" : `Retrato de ${nomeBairro} · Censo 2022 IBGE`,
        manchete: `Mediana de ${med}/mês e média de ${media}/mês ${escopoTexto}`,
        medidaDestaque: `Mediana ${med}`,
        explicacaoHumana: `Rendimento nominal mensal da pessoa responsável pelo domicílio ${nDom} (Censo 2022): metade ganha até ${med} (mediana) e a média aritmética é ${media}.${textoMoradores}`,
        dicaPratica: ehSetor
          ? `Recorte oficial do setor IBGE ${retratoRendaBruto.codigoSetor} — exibido como retrato descritivo da vizinhança imediata, sem ranking entre setores.`
          : "Confirme o prédio para ver o recorte exato do setor censitário (quarteirões vizinhos) em vez do agregado do bairro inteiro.",
        fonteCurta: "IBGE — Censo Demográfico 2022 (Agregados por Setores, V06001/V06004/V06006)",
        urlFonte: retratoRendaBruto.urlFonte,
      };
    }
  }

  return {
    calorEArvores,
    chuvaEAlagamento,
    arboviroses,
    ruidoDiaNoite,
    rendaDoSetor,
    retratoRendaBruto,
  };
}
