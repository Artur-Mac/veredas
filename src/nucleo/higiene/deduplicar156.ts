/**
 * Desduplicação determinística por hash de conteúdo dos chamados EMLURB/156.
 * Resolve republicações duplicadas entre 2025 e 2026 com hashes de arquivo distintos,
 * evitando dupla contagem de protocolos idênticos.
 */

export type Registro156Bruto = {
  GRUPOSERVICO_DESCRICAO?: string | null;
  SERVICO_DESCRICAO?: string | null;
  LOGRADOURO?: string | null;
  NUMERO?: string | null;
  BAIRRO?: string | null;
  DATA_DEMANDA?: string | null;
  SITUACAO?: string | null;
  DATA_ULT_SITUACAO?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

export type Chamado156Unico = {
  protocoloHash: string;
  grupoServico: string;
  servico: string;
  logradouro: string;
  numero: string;
  bairro: string;
  dataDemanda: string | null;
  situacao: string;
  dataUltimaSituacao: string | null;
  coordenada: [number, number] | null;
  ocorrenciasArquivo: number;
};

export type ResultadoDedupe156 = {
  unicos: Chamado156Unico[];
  totalBruto: number;
  duplicadosDescartados: number;
};

function normalizarTexto(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function dataIsoSimples(s: unknown): string | null {
  const t = String(s ?? "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function coordRecife(latBruto: unknown, lonBruto: unknown): [number, number] | null {
  const parse = (v: unknown): number | null => {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (v === null || v === undefined || v === "") return null;
    let t = String(v).trim();
    if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };
  const lat = parse(latBruto);
  const lon = parse(lonBruto);
  if (lat === null || lon === null || (lat === 0 && lon === 0)) return null;
  if (lat < -8.35 || lat > -7.75 || lon < -35.2 || lon > -34.75) return null;
  return [Number(lon.toFixed(6)), Number(lat.toFixed(6))];
}

/** Hash FNV-1a 64-bit determinístico sem dependência nativa de `node:crypto` (portável para Web/Mobile). */
export function hashProtocolo156(assinatura: string): string {
  let h1 = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < assinatura.length; i += 1) {
    h1 ^= BigInt(assinatura.charCodeAt(i));
    h1 = (h1 * prime) & mask;
  }
  return `p156_${h1.toString(16).padStart(16, "0")}`;
}

export function assinaturaChamado156(r: Registro156Bruto): string {
  return [
    normalizarTexto(r.GRUPOSERVICO_DESCRICAO),
    normalizarTexto(r.SERVICO_DESCRICAO),
    normalizarTexto(r.LOGRADOURO),
    normalizarTexto(r.NUMERO),
    normalizarTexto(r.BAIRRO),
    dataIsoSimples(r.DATA_DEMANDA) ?? "sem_data",
  ].join("|");
}

export function deduplicarChamados156(registros: readonly Registro156Bruto[]): ResultadoDedupe156 {
  const mapa = new Map<string, Chamado156Unico>();
  let duplicadosDescartados = 0;

  for (const r of registros) {
    const assinatura = assinaturaChamado156(r);
    const protocoloHash = hashProtocolo156(assinatura);
    const coord = coordRecife(r.latitude, r.longitude);
    const dataUlt = dataIsoSimples(r.DATA_ULT_SITUACAO);
    const dataDem = dataIsoSimples(r.DATA_DEMANDA);
    const situacao = String(r.SITUACAO ?? "").trim();

    const existente = mapa.get(protocoloHash);
    if (!existente) {
      mapa.set(protocoloHash, {
        protocoloHash,
        grupoServico: String(r.GRUPOSERVICO_DESCRICAO ?? "").trim(),
        servico: String(r.SERVICO_DESCRICAO ?? "").trim(),
        logradouro: String(r.LOGRADOURO ?? "").replace(/\s+/g, " ").trim(),
        numero: String(r.NUMERO ?? "").trim(),
        bairro: String(r.BAIRRO ?? "").trim(),
        dataDemanda: dataDem,
        situacao,
        dataUltimaSituacao: dataUlt,
        coordenada: coord,
        ocorrenciasArquivo: 1,
      });
      continue;
    }

    duplicadosDescartados += 1;
    existente.ocorrenciasArquivo += 1;

    const existenteUlt = existente.dataUltimaSituacao ?? "";
    const novoUlt = dataUlt ?? "";
    const prefereNovo =
      novoUlt > existenteUlt ||
      (novoUlt === existenteUlt && coord !== null && existente.coordenada === null);

    if (prefereNovo) {
      existente.situacao = situacao || existente.situacao;
      existente.dataUltimaSituacao = dataUlt ?? existente.dataUltimaSituacao;
      existente.coordenada = coord ?? existente.coordenada;
    }
  }

  return {
    unicos: [...mapa.values()],
    totalBruto: registros.length,
    duplicadosDescartados,
  };
}
