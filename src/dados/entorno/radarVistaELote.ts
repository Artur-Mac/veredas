import type { Edificio, ObrasProximas } from "../contratos";
import { emMetros } from "../sol/geometria";
import type { FachadaInferida, VizinhoParaFachada } from "../sol/inferirFachadas";

export type NivelAlertaRadar = "ok" | "moderado" | "atencao" | "sem_leitura";

export type ItemRadarVistaELote = {
  id: "cone_vista" | "privacidade" | "lote" | "obras";
  titulo: string;
  estado: NivelAlertaRadar;
  valorCurto: string;
  detalhe: string;
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
}): ResultadoRadarVistaELote {
  const { centro, edificio, fachadaAtiva, andar, vizinhos, obrasProximas } = params;
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
      valorCurto: `${obrasNoCone.length} licença(s) no eixo`,
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
        if (d >= 5 && d < min) min = d;
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

  const itemLote: ItemRadarVistaELote = {
    id: "lote",
    titulo: "Lote e esquina",
    estado: loteDeEsquinaProvavel ? "ok" : "sem_leitura",
    valorCurto: [
      loteDeEsquinaProvavel ? "Possível esquina" : "Lote de meio de quadra",
      areaLoteM2 ? `${areaLoteM2.toLocaleString("pt-BR")} m²` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    detalhe: areaLoteM2
      ? `Área estimada do terreno de ~${areaLoteM2.toLocaleString("pt-BR")} m²${
          loteDeEsquinaProvavel
            ? " com encontro próximo de outra via (duas frentes potenciais de vento)."
            : " em quadra contínua."
        }`
      : loteDeEsquinaProvavel
        ? "Há logradouro transversal próximo em até 48 m (potencial lote de esquina)."
        : "Polígono de lote não carregado para medição de área.",
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
      novas > 0 ? `${novas} construção(ões)` : null,
      ampliacoes > 0 ? `${ampliacoes} ampliação(ões)` : null,
      demolicoes > 0 ? `${demolicoes} demolição(ões)` : null,
    ].filter(Boolean);
    itemObras = {
      id: "obras",
      titulo: "Licenças de obra (150 m)",
      estado: novas + demolicoes >= 2 ? "atencao" : "moderado",
      valorCurto: `${obrasProximas.relevantes24m} relevante(s) em 24m`,
      detalhe: `Tipologia oficial recente: ${
        partes.length > 0 ? partes.join(", ") : `${obrasProximas.relevantes24m} licença(s)`
      } num raio de 150 m.`,
    };
  }

  const manchete =
    obrasNoCone.length > 0
      ? `Há ${obrasNoCone.length} licença(s) oficial(is) no horizonte da face ${fachadaAtiva.orientacaoSolar}`
      : vizinhoMaisAltoNaFrente
        ? `Edifício vizinho ocupa o campo visual desta face (${vizinhoMaisAltoNaFrente.distVaoM} m)`
        : distMinGeral !== null && distMinGeral < 12
          ? `Vizinho próximo (~${distMinGeral} m) pede verificação de privacidade`
          : `Horizonte ${fachadaAtiva.orientacaoSolar} sem licença de obra bloqueando a vista`;

  // Unused RAD guard (mantem simetria trigonometrica disponivel)
  void RAD;

  return {
    manchete,
    areaLoteM2,
    loteDeEsquinaProvavel,
    distanciaVizinhoConeM: distMinGeral,
    obrasNoConeCount: obrasNoCone.length,
    itens: [itemCone, itemPrivacidade, itemLote, itemObras],
  };
}
