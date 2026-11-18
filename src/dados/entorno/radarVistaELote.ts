import type { Edificio, ObrasProximas } from "../contratos";
import { emMetros } from "../sol/geometria";
import type { FachadaInferida, VizinhoParaFachada } from "../sol/inferirFachadas";
import { pl } from "../formatos";

export type NivelAlertaRadar = "ok" | "moderado" | "atencao" | "sem_leitura";

export type ItemRadarVistaELote = {
  id: "cone_vista" | "privacidade" | "lote" | "obras";
  titulo: string;
  estado: NivelAlertaRadar;
  valorCurto: string;
  detalhe: string;
};

export type FichaMetodoRadar = {
  metodo: string;
  fonte: string;
  escala: string;
  formula: string;
  naoInclui: string;
  janelaTemporal: string;
};

export type ItemUsoECapacidadeLote = {
  id: "temporada" | "escala_vertical" | "fracao_terreno";
  pergunta: string;
  respostaCurta: string;
  fundamentoEAritmetica: string;
};

export type ResultadoRadarVistaELote = {
  manchete: string;
  areaLoteM2: number | null;
  loteDeEsquinaProvavel: boolean;
  distanciaVizinhoConeM: number | null;
  obrasNoConeCount: number;
  itens: [
    ItemRadarVistaELote,
    ItemRadarVistaELote,
    ItemRadarVistaELote,
    ItemRadarVistaELote,
  ];
  acoesPraticas: readonly string[];
  fundamentoNormativoEAritmetica: string;
  perguntasDeUsoELote: readonly ItemUsoECapacidadeLote[];
  fichaMetodo: FichaMetodoRadar;
};

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function diferencaAngularGraus(a: number, b: number): number {
  return Math.abs((((a - b) % 360) + 540) % 360 - 180);
}

function areaPoligonoM2(
  poligono: readonly (readonly [number, number])[],
  centro: readonly [number, number],
): number | null {
  if (poligono.length < 3) return null;
  const pts = poligono.map((p) => emMetros(p, centro));
  let soma = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    soma += a[0] * b[1] - b[0] * a[1];
  }
  const area = Math.abs(soma) / 2;
  return area >= 20 ? Math.round(area) : null;
}

function normalizarRua(nome: string | null | undefined): string {
  return (nome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\b(RUA|AV|AVENIDA|ESTRADA|EST|PRACA|PCA|ALAMEDA|TRAVESSA)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function rotuloCategoriaObra(
  cat: "construcao" | "acrescimo" | "demolicao",
): string {
  if (cat === "construcao") return "obra nova";
  if (cat === "acrescimo") return "ampliação";
  return "demolição";
}

export function analisarRadarVistaELote(params: {
  centro: readonly [number, number];
  edificio: Edificio | null;
  fachadaAtiva: FachadaInferida;
  andar: number;
  vizinhos: readonly VizinhoParaFachada[];
  obrasProximas: ObrasProximas | null;
  areaDeclaradaM2?: number | null;
  clausulaTemporadaNaConvencao?: string | null;
}): ResultadoRadarVistaELote {
  const {
    centro,
    edificio,
    fachadaAtiva,
    andar,
    vizinhos,
    obrasProximas,
    areaDeclaradaM2 = null,
    clausulaTemporadaNaConvencao = null,
  } = params;
  const coneAz = fachadaAtiva.azimuteGraus;

  // 1. Cone visual da fachada (±42° ate 120 m) — R1 Localize.city (exclusivamente licencas oficiais e volume existente)
  const obrasNoCone = (obrasProximas?.recentes ?? [])
    .map((o) => {
      const [dx, dy] = emMetros(o.centro, centro);
      const az = (((Math.atan2(dx, dy) * DEG) % 360) + 360) % 360;
      return {
        obra: o,
        az,
        diff: diferencaAngularGraus(az, coneAz),
      };
    })
    .filter((x) => x.diff <= 42 && x.obra.distanciaM <= 120)
    .sort((a, b) => a.obra.distanciaM - b.obra.distanciaM);

  const vizinhosNoCone = vizinhos
    .map((v) => {
      const [dx, dy] = emMetros(v.centro, centro);
      const distCentro = Math.hypot(dx, dy);
      if (distCentro < 5 || distCentro > 120) return null;
      const az = (((Math.atan2(dx, dy) * DEG) % 360) + 360) % 360;
      const diff = diferencaAngularGraus(az, coneAz);
      if (diff > 42) return null;
      // Estimativa conservadora de vaos entre centros (~8 m descontados para faces)
      const distVaoM = Math.max(4, Math.round(distCentro - 8));
      return {
        id: v.id,
        logradouro: v.logradouro,
        distCentroM: distCentro,
        distVaoM,
        pavimentos: v.pavimentos ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.distVaoM - b.distVaoM);

  const vizinhoMaisAltoNaFrente = vizinhosNoCone.find(
    (v) => v.pavimentos !== null && v.pavimentos >= andar + 1 && v.distVaoM <= 70,
  );

  let itemCone: ItemRadarVistaELote;
  if (obrasNoCone.length > 0) {
    const primeira = obrasNoCone[0]!.obra;
    itemCone = {
      id: "cone_vista",
      titulo: `Horizonte ${fachadaAtiva.orientacaoSolar}`,
      estado: "atencao",
      valorCurto: `${pl(obrasNoCone.length, "licença", "licenças")} no eixo`,
      detalhe: `${rotuloCategoriaObra(primeira.categoria)} licenciada a ~${Math.round(primeira.distanciaM)} m na direção da janela (${primeira.data}).`,
    };
  } else if (vizinhoMaisAltoNaFrente) {
    itemCone = {
      id: "cone_vista",
      titulo: `Horizonte ${fachadaAtiva.orientacaoSolar}`,
      estado: "moderado",
      valorCurto: `Torre à frente (${vizinhoMaisAltoNaFrente.pavimentos}p)`,
      detalhe: `Edifício existente de ${vizinhoMaisAltoNaFrente.pavimentos} andares a ~${vizinhoMaisAltoNaFrente.distVaoM} m no campo de visão do ${andar}º andar.`,
    };
  } else {
    itemCone = {
      id: "cone_vista",
      titulo: `Horizonte ${fachadaAtiva.orientacaoSolar}`,
      estado: "ok",
      valorCurto: "Sem obra licenciada à frente",
      detalhe: `Nenhuma licença de obra nem torre mais alta imediata bloqueia o eixo ${fachadaAtiva.orientacaoSolar} hoje.`,
    };
  }

  // 2. Distancia janela a janela (HouseCanary R22)
  const vizinhoMaisProximo = vizinhosNoCone[0] ?? null;
  const distMinGeral =
    vizinhoMaisProximo?.distVaoM ??
    (() => {
      let min = Infinity;
      for (const v of vizinhos) {
        const [dx, dy] = emMetros(v.centro, centro);
        const d = Math.hypot(dx, dy);
        if (d >= 5 && d <= 150 && d < min) min = d;
      }
      return Number.isFinite(min) ? Math.max(4, Math.round(min - 8)) : null;
    })();

  let itemPrivacidade: ItemRadarVistaELote;
  if (distMinGeral === null) {
    itemPrivacidade = {
      id: "privacidade",
      titulo: "Afastamento e privacidade",
      estado: "sem_leitura",
      valorCurto: "A conferir no local",
      detalhe: "Sem vizinhos indexados perto para medir vão livre entre fachadas.",
    };
  } else if (distMinGeral < 12) {
    itemPrivacidade = {
      id: "privacidade",
      titulo: "Afastamento e privacidade",
      estado: "atencao",
      valorCurto: `~${distMinGeral} m até o vizinho`,
      detalhe: "Vão estreito entre prédios; vale checar cortina e linha de visão para outros apartamentos.",
    };
  } else if (distMinGeral < 25) {
    itemPrivacidade = {
      id: "privacidade",
      titulo: "Afastamento e privacidade",
      estado: "moderado",
      valorCurto: `~${distMinGeral} m de recuo`,
      detalhe: "Afastamento urbano intermediário até a edificação vizinha mais próxima.",
    };
  } else {
    itemPrivacidade = {
      id: "privacidade",
      titulo: "Afastamento e privacidade",
      estado: "ok",
      valorCurto: `~${distMinGeral} m livre`,
      detalhe: "Folga confortável até o prédio mais próximo na direção desta janela.",
    };
  }

  // 3. Geometria do lote + deteccao de esquina (Gridics R39, R40)
  const areaLoteM2 =
    edificio?.poligono && edificio.poligono.length >= 3
      ? areaPoligonoM2(edificio.poligono, centro)
      : null;

  const ruaBase = normalizarRua(edificio?.logradouro);
  let loteDeEsquinaProvavel = false;
  if (ruaBase) {
    for (const v of vizinhos) {
      const [dx, dy] = emMetros(v.centro, centro);
      const d = Math.hypot(dx, dy);
      if (d < 4 || d > 48) continue;
      const ruaV = normalizarRua(v.logradouro);
      if (ruaV && ruaV !== ruaBase) {
        loteDeEsquinaProvavel = true;
        break;
      }
    }
  }

  let estadoLote: NivelAlertaRadar = loteDeEsquinaProvavel ? "ok" : "sem_leitura";
  let detalheLote = areaLoteM2
    ? `Área estimada do terreno de ~${areaLoteM2.toLocaleString("pt-BR")} m²${
        loteDeEsquinaProvavel
          ? " com encontro próximo de outra via (duas frentes potenciais de vento)."
          : " em quadra contínua."
      }`
    : loteDeEsquinaProvavel
      ? "Há logradouro transversal próximo em até 48 m (potencial lote de esquina)."
      : "Polígono de lote não carregado para medição de área.";

  if (areaDeclaradaM2 && areaDeclaradaM2 > 0 && edificio && edificio.tipologias.length > 0) {
    const maisProxima = [...edificio.tipologias].sort(
      (a, b) => Math.abs(a.area - areaDeclaradaM2) - Math.abs(b.area - areaDeclaradaM2),
    )[0]!;
    const diffM2 = Math.abs(areaDeclaradaM2 - maisProxima.area);
    const relPct = maisProxima.area > 0 ? Math.round((diffM2 / maisProxima.area) * 100) : 0;
    const fmt = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");
    if (diffM2 > 5 && relPct > 8) {
      estadoLote = "atencao";
      detalheLote = `${detalheLote} Anúncio informa ${fmt(areaDeclaradaM2)} m² × cadastro ${fmt(maisProxima.area)} m² (${relPct}% de diferença: confirmar metragem privativa vs área total).`;
    } else {
      detalheLote = `${detalheLote} Metragem compatível (anúncio ${fmt(areaDeclaradaM2)} m² × cadastro ${fmt(maisProxima.area)} m²).`;
    }
  }

  const itemLote: ItemRadarVistaELote = {
    id: "lote",
    titulo: "Lote, área e esquina",
    estado: estadoLote,
    valorCurto: [
      loteDeEsquinaProvavel ? "Possível esquina" : "Lote de meio de quadra",
      areaLoteM2 ? `${areaLoteM2.toLocaleString("pt-BR")} m²` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    detalhe: detalheLote,
  };

  // 4. Classificacao deterministica de licencas a 150 m (Shovels R21)
  const recentes = obrasProximas?.recentes ?? [];
  const novas = recentes.filter((o) => o.categoria === "construcao").length;
  const ampliacoes = recentes.filter((o) => o.categoria === "acrescimo").length;
  const demolicoes = obrasProximas?.demolicoes24m ?? 0;

  let itemObras: ItemRadarVistaELote;
  if (!obrasProximas) {
    itemObras = {
      id: "obras",
      titulo: "Licenças de obra (150 m)",
      estado: "sem_leitura",
      valorCurto: "Sem leitura no bairro",
      detalhe: "Confirme este edifício no cadastro do Recife para cruzar licenças de obra.",
    };
  } else if (obrasProximas.relevantes24m === 0) {
    itemObras = {
      id: "obras",
      titulo: "Licenças de obra (150 m)",
      estado: "ok",
      valorCurto: "0 obras em 24 meses",
      detalhe: `Sem alvará recente de obra nova, ampliação ou demolição a 150 m${
        obrasProximas.licencasDeObra > 0
          ? ` (${obrasProximas.licencasDeObra} registros totais desde 2018).`
          : "."
      }`,
    };
  } else {
    const partes = [
      novas > 0 ? pl(novas, "construção", "construções") : null,
      ampliacoes > 0 ? pl(ampliacoes, "ampliação", "ampliações") : null,
      demolicoes > 0 ? pl(demolicoes, "demolição", "demolições") : null,
    ].filter(Boolean);
    itemObras = {
      id: "obras",
      titulo: "Licenças de obra (150 m)",
      estado: novas + demolicoes >= 2 ? "atencao" : "moderado",
      valorCurto: `${pl(obrasProximas.relevantes24m, "relevante", "relevantes")} em 24 meses`,
      detalhe: `Tipologia oficial recente: ${
        partes.length > 0 ? partes.join(", ") : pl(obrasProximas.relevantes24m, "licença", "licenças")
      } num raio de 150 m.`,
    };
  }

  const manchete =
    obrasNoCone.length > 0
      ? `Há ${pl(obrasNoCone.length, "licença oficial", "licenças oficiais")} no horizonte da face ${fachadaAtiva.orientacaoSolar}`
      : vizinhoMaisAltoNaFrente
        ? `Edifício vizinho ocupa o campo visual desta face (${vizinhoMaisAltoNaFrente.distVaoM} m)`
        : distMinGeral !== null && distMinGeral < 12
          ? `Vizinho próximo (~${distMinGeral} m) pede verificação de privacidade`
          : `Horizonte ${fachadaAtiva.orientacaoSolar} sem licença de obra bloqueando a vista`;

  // Unused RAD guard (mantem simetria trigonometrica disponivel)
  void RAD;

  const acoesPraticas: string[] = [];
  if (itemCone.estado === "atencao") {
    acoesPraticas.push(
      "Consultar o alvará e o gabarito da obra no eixo da janela para estimar impacto em sol e vista.",
    );
  } else if (itemCone.estado === "moderado") {
    acoesPraticas.push(
      `Confirmar na visita presencial a linha do horizonte no ${andar}º andar frente ao edifício vizinho.`,
    );
  }
  if (itemPrivacidade.estado === "atencao") {
    acoesPraticas.push(
      "Conferir na visita a distância real entre janelas e necessidade de cortina ou película.",
    );
  }
  if (itemLote.estado === "atencao") {
    acoesPraticas.push(
      "Solicitar a matrícula do imóvel para conferir metragem privativa registrada versus anunciada.",
    );
  }
  if (
    acoesPraticas.length < 3 &&
    (itemObras.estado === "atencao" || itemObras.estado === "moderado")
  ) {
    acoesPraticas.push(
      "Checar horários de canteiro das obras licenciadas num raio de 150 m antes de assinar proposta.",
    );
  }

  const fichaMetodo: FichaMetodoRadar = {
    metodo:
      "Cone direcional de 42° até 120 m, vão livre entre fachadas e polígonos cadastrados.",
    fonte: "Cadastro imobiliário e licenciamento urbano (Prefeitura do Recife).",
    escala: "Faixas em metros, pavimentos e área útil com recorte de 24 meses.",
    formula: "Cruzamento geométrico da fachada escolhida contra alvarás e vizinhos.",
    naoInclui: "Reformas internas sem alvará nem projetos particulares ainda não protocolados.",
    janelaTemporal: "Licenças nos últimos 24 meses (histórico 2018–2026).",
  };

  const fundamentoNormativoEAritmetica =
    distMinGeral !== null
      ? `Aritmética do recuo: ~${distMinGeral} m livres (distância entre centros cadastrais menos ~8 m de meia-projeção das fachadas; cone visual ±42° até 120 m${areaLoteM2 ? `; polígono de ~${areaLoteM2.toLocaleString("pt-BR")} m²` : ""}). Referência normativa: Plano Diretor do Recife (LC Municipal nº 2/2021) e licenciamento urbanístico municipal; leitura informativa que não substitui certidão de uso e ocupação do solo.`
      : `Aritmética do recuo: cone visual ±42° até 120 m a partir da fachada ${fachadaAtiva.orientacaoSolar} (sem vizinho indexado até 150 m para subtração de vão). Referência normativa: Plano Diretor do Recife (LC Municipal nº 2/2021) e licenciamento urbanístico municipal; leitura informativa que não substitui certidão de uso e ocupação do solo.`;

  // 5. Respostas de 3 partes (Symbium R25 §6.1 + Zoneomics R19 §6.1 + Gridics R24 §6.2)
  const clausulaLimpa = clausulaTemporadaNaConvencao?.trim() ?? "";
  const itemTemporada: ItemUsoECapacidadeLote = clausulaLimpa
    ? {
        id: "temporada",
        pergunta: "Posso alugar por curta temporada (Airbnb)?",
        respostaCurta: "Há trecho salvo nos documentos",
        fundamentoEAritmetica: `Convenção ou ata registrada: “${clausulaLimpa.slice(0, 140)}” · STJ (REsp 2.121.055, Segunda Seção, 07/05/2026): a liberação depende de aprovação de dois terços dos condôminos.`,
      }
    : {
        id: "temporada",
        pergunta: "Posso alugar por curta temporada (Airbnb)?",
        respostaCurta: "Depende da convenção do condomínio",
        fundamentoEAritmetica:
          "STJ (REsp 2.121.055, Segunda Seção, 07/05/2026): em condomínio residencial, oferecer a unidade para estadia de curta temporada depende de aprovação de dois terços dos condôminos em assembleia. Confira a convenção e as atas antes do sinal.",
      };

  const maxPavVizinho = vizinhos.reduce<number | null>((maior, v) => {
    if (v.pavimentos === null || v.pavimentos === undefined) return maior;
    const [dx, dy] = emMetros(v.centro, centro);
    const d = Math.hypot(dx, dy);
    if (d < 5 || d > 120) return maior;
    return maior === null ? v.pavimentos : Math.max(maior, v.pavimentos);
  }, null);

  let itemEscalaVertical: ItemUsoECapacidadeLote;
  if (edificio?.pavimentos && maxPavVizinho !== null) {
    const diff = edificio.pavimentos - maxPavVizinho;
    const relacaoTopo =
      diff > 0
        ? `+${diff} acima do maior vizinho em 120 m`
        : diff < 0
          ? `${Math.abs(diff)} abaixo do maior vizinho em 120 m`
          : "mesma altura máxima dos vizinhos em 120 m";
    itemEscalaVertical = {
      id: "escala_vertical",
      pergunta: "Qual o porte deste prédio frente à vizinhança imediata?",
      respostaCurta: `Prédio de ${edificio.pavimentos}p · vizinhos até ${maxPavVizinho}p em 120 m`,
      fundamentoEAritmetica: `Seu andar selecionado: ${andar}º de ${edificio.pavimentos}p · diferença para o topo vizinho em 120 m: ${relacaoTopo} · referência: Plano Diretor do Recife (LC Municipal nº 2/2021).`,
    };
  } else if (edificio?.pavimentos) {
    itemEscalaVertical = {
      id: "escala_vertical",
      pergunta: "Qual o porte deste prédio frente à vizinhança imediata?",
      respostaCurta: `Prédio de ${edificio.pavimentos}p`,
      fundamentoEAritmetica: `Seu andar selecionado: ${andar}º de ${edificio.pavimentos}p (sem gabarito vizinho completo no raio de 120 m) · referência: Plano Diretor do Recife (LC Municipal nº 2/2021).`,
    };
  } else {
    itemEscalaVertical = {
      id: "escala_vertical",
      pergunta: "Qual o porte deste prédio frente à vizinhança imediata?",
      respostaCurta: "Sem gabarito completo no raio de 120 m",
      fundamentoEAritmetica:
        "Confirme o edifício no cadastro municipal para comparar altura com as torres vizinhas em 120 m · Plano Diretor do Recife (LC Municipal nº 2/2021).",
    };
  }

  let itemFracaoTerreno: ItemUsoECapacidadeLote;
  if (areaLoteM2 !== null && edificio?.unidades && edificio.unidades >= 2) {
    const m2PorUnid = Math.round((areaLoteM2 / edificio.unidades) * 10) / 10;
    const m2Texto = String(m2PorUnid).replace(".", ",");
    itemFracaoTerreno = {
      id: "fracao_terreno",
      pergunta: "Quanto de terreno corresponde a cada unidade?",
      respostaCurta: `~${m2Texto} m² de lote por unidade`,
      fundamentoEAritmetica: `Polígono de ~${areaLoteM2.toLocaleString("pt-BR")} m² ÷ ${edificio.unidades} unidades = ~${m2Texto} m²/unid. (quanto menor o rateio por apartamento, mais diluídos ficam encargos de terreno e obras comuns).`,
    };
  } else {
    itemFracaoTerreno = {
      id: "fracao_terreno",
      pergunta: "Quanto de terreno corresponde a cada unidade?",
      respostaCurta: "A confirmar na matrícula",
      fundamentoEAritmetica:
        "Sem polígono de lote e contagem oficial de unidades juntos; confira a fração ideal na matrícula atualizada do imóvel.",
    };
  }

  return {
    manchete,
    areaLoteM2,
    loteDeEsquinaProvavel,
    distanciaVizinhoConeM: distMinGeral,
    obrasNoConeCount: obrasNoCone.length,
    // Ordem Gridics (R38): capacidade/horizonte -> terreno/lote -> privacidade/afastamento -> licenças existentes
    itens: [itemCone, itemLote, itemPrivacidade, itemObras],
    acoesPraticas: acoesPraticas.slice(0, 3),
    fundamentoNormativoEAritmetica,
    perguntasDeUsoELote: [itemTemporada, itemEscalaVertical, itemFracaoTerreno],
    fichaMetodo,
  };
}
