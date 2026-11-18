import { blob, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Esquema Drizzle ORM em paridade estrita com `src/persistencia/ddlCanonico.sql.ts`
 * (inspirado na disciplina schema-first de `mcphub`: fonte única para SQLite + Zod).
 */

export const sourceSnapshotsTable = sqliteTable("source_snapshots", {
  snapshot_id: text("snapshot_id").primaryKey(),
  source_slug: text("source_slug").notNull(),
  uri_origem: text("uri_origem").notNull(),
  fetched_at_utc: text("fetched_at_utc").notNull(),
  reference_vintage: text("reference_vintage").notNull(),
  license: text("license").notNull(),
  sha256_raw: text("sha256_raw").notNull(),
  row_count: integer("row_count").notNull(),
  schema_version: text("schema_version").notNull(),
});

export const edificiosTable = sqliteTable("edificios", {
  building_id: text("building_id").primaryKey(),
  dsqfl: text("dsqfl"),
  cod_logradouro: text("cod_logradouro").notNull(),
  numero: text("numero").notNull(),
  bairro_slug: text("bairro_slug").notNull(),
  logradouro: text("logradouro").notNull(),
  nome: text("nome"),
  lon: real("lon").notNull(),
  lat: real("lat").notNull(),
  min_lon: real("min_lon").notNull(),
  max_lon: real("max_lon").notNull(),
  min_lat: real("min_lat").notNull(),
  max_lat: real("max_lat").notNull(),
  unidades: integer("unidades").notNull(),
  ano_construcao: integer("ano_construcao"),
  pavimentos: integer("pavimentos"),
  padrao: text("padrao"),
  tipo_estrutura: text("tipo_estrutura"),
  iptu_mediana_anual: real("iptu_mediana_anual"),
  itbi_transmissoes: integer("itbi_transmissoes").default(0),
  itbi_mediana_unidade: real("itbi_mediana_unidade"),
  solar_horizonte_108b: blob("solar_horizonte_108b", { mode: "buffer" }),
  acustica_8dir_blob: blob("acustica_8dir_blob", { mode: "buffer" }),
  resumo_json: text("resumo_json").notNull(),
});

export const observationsTable = sqliteTable("observations", {
  obs_id: text("obs_id").primaryKey(),
  entity_id: text("entity_id").notNull(),
  entity_type: text("entity_type").notNull(),
  metric_key: text("metric_key").notNull(),
  value_num: real("value_num"),
  value_json: text("value_json"),
  unit: text("unit"),
  epistemic_tag: text("epistemic_tag").notNull(),
  absence_state: text("absence_state"),
  ci_low: real("ci_low"),
  ci_high: real("ci_high"),
  ci_level: real("ci_level"),
  snapshot_id: text("snapshot_id").notNull(),
});

export const offerSnapshotsTable = sqliteTable("offer_snapshots", {
  offer_id: text("offer_id").primaryKey(),
  share_url: text("share_url").notNull(),
  captured_at: text("captured_at").notNull(),
  capture_method: text("capture_method").notNull(),
  asking_price_brl: real("asking_price_brl"),
  condo_fee_brl: real("condo_fee_brl"),
  iptu_declared_brl: real("iptu_declared_brl"),
  area_declared_m2: real("area_declared_m2"),
  floor_declared: integer("floor_declared"),
  sun_declared: text("sun_declared"),
  perceptual_img_hash: text("perceptual_img_hash"),
  canonical_unit_id: text("canonical_unit_id"),
  epistemic_tag: text("epistemic_tag").notNull().default("declarado"),
  raw_analysis_json: text("raw_analysis_json").notNull(),
});

export const entityLinksTable = sqliteTable("entity_links", {
  link_id: text("link_id").primaryKey(),
  source_entity_type: text("source_entity_type").notNull(),
  target_dsqfl: text("target_dsqfl"),
  target_building_id: text("target_building_id"),
  cod_logradouro: text("cod_logradouro"),
  cnm_16: text("cnm_16"),
  fellegi_sunter_weight: real("fellegi_sunter_weight").notNull(),
  posterior_probability: real("posterior_probability").notNull(),
  match_tier: text("match_tier").notNull(),
  reviewed_by: text("reviewed_by"),
  requires_user_confirmation: integer("requires_user_confirmation").notNull(),
});
