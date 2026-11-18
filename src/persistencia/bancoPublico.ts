import type { SqliteDriver } from "./adaptadorSqlite";
import { DDL_BANCO_PUBLICO_MODULOS_SQL, DDL_BANCO_PUBLICO_SQL } from "./ddlCanonico.sql";

/**
 * Motor Local-First de Leitura no Banco Público Imutável (`recife_public.db`):
 * - Consultas espaciais R*Tree (`edificios_rtree`) em < 5 ms offline.
 * - Busca textual instantânea FTS5 com remoção de acentos (`unicode61 remove_diacritics 2`).
 * - Consulta direta de dossiê completo por `building_id` ou `dsqfl`.
 */

export type ResumoEdificioSql = {
  building_id: string;
  dsqfl: string | null;
  cod_logradouro: string;
  numero: string;
  bairro_slug: string;
  logradouro: string;
  nome: string | null;
  lon: number;
  lat: number;
  unidades: number;
  ano_construcao: number | null;
  pavimentos: number | null;
  padrao: string | null;
  iptu_mediana_anual: number | null;
  itbi_transmissoes: number;
  itbi_mediana_unidade: number | null;
};

export type DossieBancoPublico = ResumoEdificioSql & {
  solar_horizonte_108b: Uint8Array | null;
  resumo_json: Record<string, unknown>;
  observacoes: {
    obs_id: string;
    metric_key: string;
    value_num: number | null;
    value_json: string | null;
    unit: string | null;
    epistemic_tag: string;
    absence_state: string | null;
  }[];
};

export function inicializarEsquemaBancoPublico(driver: SqliteDriver): void {
  driver.exec(DDL_BANCO_PUBLICO_SQL);
  driver.exec(DDL_BANCO_PUBLICO_MODULOS_SQL);
}

export class BancoPublicoLocal {
  constructor(private readonly driver: SqliteDriver) {}

  contarEdificios(): number {
    const row = this.driver.prepare("SELECT COUNT(*) AS n FROM edificios").get();
    return Number(row?.n ?? 0);
  }

  buscarPorBboxRtree(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number,
    limite = 200,
  ): ResumoEdificioSql[] {
    const rows = this.driver
      .prepare(
        `SELECT e.building_id, e.dsqfl, e.cod_logradouro, e.numero, e.bairro_slug,
                e.logradouro, e.nome, e.lon, e.lat, e.unidades, e.ano_construcao,
                e.pavimentos, e.padrao, e.iptu_mediana_anual, e.itbi_transmissoes, e.itbi_mediana_unidade
           FROM edificios_rtree r
           JOIN edificios e ON e.rowid = r.rowid_id
          WHERE r.max_lon >= ? AND r.min_lon <= ? AND r.max_lat >= ? AND r.min_lat <= ?
          ORDER BY e.unidades DESC
          LIMIT ?`,
      )
      .all(minLon, maxLon, minLat, maxLat, limite);
    return rows as ResumoEdificioSql[];
  }

  buscarEnderecosFts5(consultaRaw: string, limite = 20): ResumoEdificioSql[] {
    const termos = consultaRaw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter((t) => t.length >= 2)
      .map((t) => `${t}*`);

    if (termos.length === 0) return [];
    const matchExpr = termos.join(" ");

    const rows = this.driver
      .prepare(
        `SELECT e.building_id, e.dsqfl, e.cod_logradouro, e.numero, e.bairro_slug,
                e.logradouro, e.nome, e.lon, e.lat, e.unidades, e.ano_construcao,
                e.pavimentos, e.padrao, e.iptu_mediana_anual, e.itbi_transmissoes, e.itbi_mediana_unidade
           FROM edificios_fts f
           JOIN edificios e ON e.building_id = f.building_id
          WHERE edificios_fts MATCH ?
          ORDER BY bm25(edificios_fts)
          LIMIT ?`,
      )
      .all(matchExpr, limite);

    return rows as ResumoEdificioSql[];
  }

  obterDossieEdificio(buildingId: string): DossieBancoPublico | null {
    const e = this.driver
      .prepare(
        `SELECT building_id, dsqfl, cod_logradouro, numero, bairro_slug,
                logradouro, nome, lon, lat, unidades, ano_construcao,
                pavimentos, padrao, iptu_mediana_anual, itbi_transmissoes,
                itbi_mediana_unidade, solar_horizonte_108b, resumo_json
           FROM edificios WHERE building_id = ? LIMIT 1`,
      )
      .get(buildingId);

    if (!e) return null;

    const obs = this.driver
      .prepare(
        `SELECT obs_id, metric_key, value_num, value_json, unit, epistemic_tag, absence_state
           FROM observations WHERE entity_id = ?`,
      )
      .all(buildingId);

    let resumoParsed: Record<string, unknown> = {};
    try {
      resumoParsed = JSON.parse(String(e.resumo_json ?? "{}")) as Record<string, unknown>;
    } catch {
      resumoParsed = {};
    }

    const horizRaw = e.solar_horizonte_108b;
    const solar = horizRaw instanceof Uint8Array ? horizRaw : null;

    return {
      ...(e as ResumoEdificioSql),
      solar_horizonte_108b: solar,
      resumo_json: resumoParsed,
      observacoes: obs as DossieBancoPublico["observacoes"],
    };
  }
}
