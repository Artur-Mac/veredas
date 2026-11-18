export type PoloDestinoRecife = {
  id:
    | "polo_porto_digital"
    | "polo_agamenon"
    | "polo_boa_viagem"
    | "polo_casa_forte"
    | "polo_ufpe"
    | "polo_imbiribeira";
  nomeCurto: string;
  nomeCompleto: string;
  centro: readonly [number, number];
};

export const POLOS_RECIFE: readonly PoloDestinoRecife[] = [
  {
    id: "polo_porto_digital",
    nomeCurto: "Recife Antigo",
    nomeCompleto: "Porto Digital / Recife Antigo",
    centro: [-34.8717, -8.0631],
  },
  {
    id: "polo_agamenon",
    nomeCurto: "Agamenon / Derby",
    nomeCompleto: "Ilha do Leite / Agamenon",
    centro: [-34.8942, -8.0628],
  },
  {
    id: "polo_boa_viagem",
    nomeCurto: "Boa Viagem",
    nomeCompleto: "Boa Viagem / Zona Sul",
    centro: [-34.8972, -8.1189],
  },
  {
    id: "polo_casa_forte",
    nomeCurto: "Casa Forte",
    nomeCompleto: "Casa Forte / Zona Norte",
    centro: [-34.9189, -8.0345],
  },
  {
    id: "polo_ufpe",
    nomeCurto: "UFPE / Várzea",
    nomeCompleto: "UFPE / Cidade Universitária",
    centro: [-34.9511, -8.0522],
  },
  {
    id: "polo_imbiribeira",
    nomeCurto: "Imbiribeira / Sul",
    nomeCompleto: "Imbiribeira / Aeroporto",
    centro: [-34.9145, -8.1264],
  },
];

const CENTROS_BAIRRO: Record<string, readonly [number, number]> = {
  "boa-viagem": [-34.896, -8.121],
  "casa-forte": [-34.919, -8.034],
  gracas: [-34.901, -8.048],
  espinheiro: [-34.894, -8.042],
  madalena: [-34.909, -8.055],
  torre: [-34.911, -8.046],
};

function haversineKm(
  [lon1, lat1]: readonly [number, number],
  [lon2, lat2]: readonly [number, number],
): number {
  const R = 6371;
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r;
  const dLon = (lon2 - lon1) * r;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function minutosIdaEVolta(
  origem: readonly [number, number],
  destino: readonly [number, number],
): number {
  const kmRota = haversineKm(origem, destino) * 1.38;
  const minutosTrecho = Math.round((kmRota / 19) * 60 + 6);
  return Math.max(12, Math.min(95, minutosTrecho)) * 2;
}

export type ResultadoRotinaDoisDestinos = {
  destino1: PoloDestinoRecife;
  destino2: PoloDestinoRecife;
  minutosDiaOpcaoA: number;
  minutosDiaOpcaoB: number;
  pessoa1OpcaoAMin: number;
  pessoa2OpcaoAMin: number;
  pessoa1OpcaoBMin: number;
  pessoa2OpcaoBMin: number;
  vencedorRotina: "A" | "B" | "empate";
  diferencaHorasMes: number;
  resumoRotina: string;
};

export function resolverCentroImovel(
  centro: readonly [number, number] | null | undefined,
  bairroSlug: string | null | undefined,
): readonly [number, number] {
  if (centro) return centro;
  if (bairroSlug && CENTROS_BAIRRO[bairroSlug]) return CENTROS_BAIRRO[bairroSlug]!;
  return [-34.896, -8.055];
}

export function estimarMinutosPicoIdaVolta(
  centro: readonly [number, number] | null | undefined,
  bairro: string | null | undefined,
  destinoId: PoloDestinoRecife["id"] = "polo_porto_digital",
): number {
  const origem = resolverCentroImovel(centro, bairro);
  const destino = POLOS_RECIFE.find((p) => p.id === destinoId) ?? POLOS_RECIFE[0]!;
  return minutosIdaEVolta(origem, destino.centro);
}

export function compararRotinaDoisDestinos(params: {
  nomeOpcaoA: string;
  centroA: readonly [number, number] | null;
  bairroA: string | null;
  nomeOpcaoB: string;
  centroB: readonly [number, number] | null;
  bairroB: string | null;
  destino1Id: PoloDestinoRecife["id"];
  destino2Id: PoloDestinoRecife["id"];
  diasPresenciaisMes?: number;
}): ResultadoRotinaDoisDestinos {
  const destino1 =
    POLOS_RECIFE.find((p) => p.id === params.destino1Id) ?? POLOS_RECIFE[0]!;
  const destino2 =
    POLOS_RECIFE.find((p) => p.id === params.destino2Id) ?? POLOS_RECIFE[2]!;
  const origA = resolverCentroImovel(params.centroA, params.bairroA);
  const origB = resolverCentroImovel(params.centroB, params.bairroB);

  const p1A = minutosIdaEVolta(origA, destino1.centro);
  const p2A = minutosIdaEVolta(origA, destino2.centro);
  const p1B = minutosIdaEVolta(origB, destino1.centro);
  const p2B = minutosIdaEVolta(origB, destino2.centro);

  const totalA = p1A + p2A;
  const totalB = p1B + p2B;
  const diffMin = Math.abs(totalA - totalB);
  const dias = Math.max(1, params.diasPresenciaisMes ?? 20);
  const diferencaHorasMes = Math.round((diffMin * dias) / 60);

  const vencedorRotina: "A" | "B" | "empate" =
    diffMin >= 10 ? (totalA < totalB ? "A" : "B") : "empate";

  const resumoRotina =
    vencedorRotina === "empate"
      ? `Equilíbrio de deslocamento entre ${params.nomeOpcaoA} e ${params.nomeOpcaoB} para esses dois polos.`
      : vencedorRotina === "A"
        ? `${params.nomeOpcaoA} economiza cerca de ${diferencaHorasMes}h por mês nos dois trajetos somados.`
        : `${params.nomeOpcaoB} economiza cerca de ${diferencaHorasMes}h por mês nos dois trajetos somados.`;

  return {
    destino1,
    destino2,
    minutosDiaOpcaoA: totalA,
    minutosDiaOpcaoB: totalB,
    pessoa1OpcaoAMin: p1A,
    pessoa2OpcaoAMin: p2A,
    pessoa1OpcaoBMin: p1B,
    pessoa2OpcaoBMin: p2B,
    vencedorRotina,
    diferencaHorasMes,
    resumoRotina,
  };
}
