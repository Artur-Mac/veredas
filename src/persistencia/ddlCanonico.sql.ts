/**
 * Esquema DDL SQLite para a arquitetura Local-First de dois bancos:
 * 1) Banco público imutável (`recife_public_vYYYYMMDD.db`) com R*Tree, FTS5 e colunas B-Tree para paridade Web (`wa-sqlite`).
 * 2) Cofre privado criptografado (`user_vault.db` via SQLCipher) anexado em memória via `ATTACH DATABASE`.
 */

export const DDL_BANCO_PUBLICO_SQL = `
PRAGMA journal_mode = OFF;
PRAGMA synchronous = OFF;
PRAGMA temp_store = MEMORY;

CREATE TABLE IF NOT EXISTS source_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  source_slug TEXT NOT NULL,
  uri_origem TEXT NOT NULL,
  fetched_at_utc TEXT NOT NULL,
  reference_vintage TEXT NOT NULL,
  license TEXT NOT NULL,
  sha256_raw TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  schema_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS publication_manifest (
  release_version TEXT PRIMARY KEY,
  city_code_ibge TEXT NOT NULL,
  layer_tier TEXT NOT NULL,
  sqlite_url TEXT NOT NULL,
  sqlite_zstd_sha256 TEXT NOT NULL,
  pmtiles_url TEXT NOT NULL,
  pmtiles_sha256 TEXT NOT NULL,
  schema_min_app_version TEXT NOT NULL,
  coverage_stats_json TEXT NOT NULL,
  pending_human_gates_count INTEGER NOT NULL,
  pending_human_gates_zero INTEGER NOT NULL CHECK (pending_human_gates_zero IN (0, 1)),
  certified_for_release INTEGER NOT NULL CHECK (certified_for_release IN (0, 1))
);

CREATE TABLE IF NOT EXISTS lotes_dsqfl (
  dsqfl TEXT PRIMARY KEY,
  cod_logradouro TEXT NOT NULL,
  bairro_slug TEXT NOT NULL,
  area_terreno_m2 REAL,
  valor_m2_terreno REAL,
  spu_regime TEXT, -- 'ocupacao' | 'aforamento' | 'alodial' | 'nao_sabemos'
  lpuos_zona TEXT,
  vlcoefmax REAL,
  is_iep INTEGER NOT NULL DEFAULT 0,
  is_zeph INTEGER NOT NULL DEFAULT 0,
  is_ipav INTEGER NOT NULL DEFAULT 0,
  min_lon REAL NOT NULL,
  max_lon REAL NOT NULL,
  min_lat REAL NOT NULL,
  max_lat REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lotes_bbox ON lotes_dsqfl (min_lon, max_lon, min_lat, max_lat);
CREATE INDEX IF NOT EXISTS idx_lotes_logradouro ON lotes_dsqfl (cod_logradouro);

CREATE TABLE IF NOT EXISTS edificios (
  building_id TEXT PRIMARY KEY,
  dsqfl TEXT,
  cod_logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  bairro_slug TEXT NOT NULL,
  logradouro TEXT NOT NULL,
  nome TEXT,
  lon REAL NOT NULL,
  lat REAL NOT NULL,
  min_lon REAL NOT NULL,
  max_lon REAL NOT NULL,
  min_lat REAL NOT NULL,
  max_lat REAL NOT NULL,
  unidades INTEGER NOT NULL,
  ano_construcao INTEGER,
  pavimentos INTEGER,
  padrao TEXT,
  tipo_estrutura TEXT,
  iptu_mediana_anual REAL,
  itbi_transmissoes INTEGER DEFAULT 0,
  itbi_mediana_unidade REAL,
  solar_horizonte_108b BLOB,
  acustica_8dir_blob BLOB,
  resumo_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edificios_bairro ON edificios (bairro_slug);
CREATE INDEX IF NOT EXISTS idx_edificios_dsqfl ON edificios (dsqfl);
CREATE INDEX IF NOT EXISTS idx_edificios_bbox ON edificios (min_lon, max_lon, min_lat, max_lat);

CREATE TABLE IF NOT EXISTS observations (
  obs_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  value_num REAL,
  value_json TEXT,
  unit TEXT,
  epistemic_tag TEXT NOT NULL CHECK (epistemic_tag IN ('registro_oficial', 'declarado', 'inferencia', 'nao_sabemos')),
  absence_state TEXT,
  ci_low REAL,
  ci_high REAL,
  ci_level REAL,
  snapshot_id TEXT NOT NULL,
  FOREIGN KEY (snapshot_id) REFERENCES source_snapshots(snapshot_id)
);

CREATE INDEX IF NOT EXISTS idx_obs_entity ON observations (entity_id, metric_key);

CREATE TABLE IF NOT EXISTS urban_events (
  event_id TEXT PRIMARY KEY,
  event_domain TEXT NOT NULL CHECK (event_domain IN ('hidrologico', 'obra_vizinha', 'zeladoria', 'interrupcao_agua')),
  start_utc TEXT NOT NULL,
  end_utc TEXT,
  geometry_wkb TEXT NOT NULL,
  rain_mm_24h REAL,
  tide_m REAL,
  raw_records_count INTEGER NOT NULL,
  mitigated_after_event INTEGER NOT NULL CHECK (mitigated_after_event IN (0, 1)),
  min_lon REAL,
  max_lon REAL,
  min_lat REAL,
  max_lat REAL
);

CREATE INDEX IF NOT EXISTS idx_events_domain ON urban_events (event_domain, start_utc);

CREATE TABLE IF NOT EXISTS arestas_caminhaveis (
  edge_id INTEGER PRIMARY KEY,
  from_node INTEGER NOT NULL,
  to_node INTEGER NOT NULL,
  length_m REAL NOT NULL,
  flags INTEGER NOT NULL DEFAULT 0,
  hand_m REAL,
  twi REAL,
  flood_tier INTEGER NOT NULL DEFAULT 0,
  min_lon REAL NOT NULL,
  max_lon REAL NOT NULL,
  min_lat REAL NOT NULL,
  max_lat REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_arestas_bbox ON arestas_caminhaveis (min_lon, max_lon, min_lat, max_lat);
`;

export const DDL_BANCO_PUBLICO_MODULOS_SQL = `
CREATE VIRTUAL TABLE IF NOT EXISTS lotes_rtree USING rtree(
  rowid_id,
  min_lon, max_lon,
  min_lat, max_lat
);

CREATE VIRTUAL TABLE IF NOT EXISTS edificios_rtree USING rtree(
  rowid_id,
  min_lon, max_lon,
  min_lat, max_lat
);

CREATE VIRTUAL TABLE IF NOT EXISTS edificios_fts USING fts5(
  building_id UNINDEXED,
  nome,
  logradouro,
  numero,
  bairro_slug,
  tokenize = 'unicode61 remove_diacritics 2'
);
`;

export const DDL_COFRE_USUARIO_SQL = `
CREATE TABLE IF NOT EXISTS vault_meta (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS offer_snapshots (
  offer_id TEXT PRIMARY KEY,
  share_url TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  capture_method TEXT NOT NULL,
  asking_price_brl REAL,
  condo_fee_brl REAL,
  iptu_declared_brl REAL,
  area_declared_m2 REAL,
  floor_declared INTEGER,
  sun_declared TEXT,
  perceptual_img_hash TEXT,
  canonical_unit_id TEXT,
  epistemic_tag TEXT NOT NULL DEFAULT 'declarado',
  raw_analysis_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_offers_unit ON offer_snapshots (canonical_unit_id);
CREATE INDEX IF NOT EXISTS idx_offers_phash ON offer_snapshots (perceptual_img_hash);

CREATE TABLE IF NOT EXISTS entity_links (
  link_id TEXT PRIMARY KEY,
  source_entity_type TEXT NOT NULL,
  target_dsqfl TEXT,
  target_building_id TEXT,
  cod_logradouro TEXT,
  cnm_16 TEXT,
  fellegi_sunter_weight REAL NOT NULL,
  posterior_probability REAL NOT NULL,
  match_tier TEXT NOT NULL CHECK (match_tier IN ('confirmado', 'candidato_revisao', 'rejeitado')),
  reviewed_by TEXT,
  requires_user_confirmation INTEGER NOT NULL CHECK (requires_user_confirmation IN (0, 1))
);

CREATE TABLE IF NOT EXISTS document_assertions (
  assertion_id TEXT PRIMARY KEY,
  doc_sha256 TEXT NOT NULL,
  doc_class TEXT NOT NULL CHECK (doc_class IN ('matricula_onr', 'ata', 'convencao', 'balancete', 'laudo', 'seguro')),
  claim_type TEXT NOT NULL,
  extracted_value TEXT NOT NULL,
  source_page INTEGER,
  verbatim_quote TEXT NOT NULL,
  entailment_verified INTEGER NOT NULL CHECK (entailment_verified IN (0, 1)),
  epistemic_status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_doc_assertions_sha ON document_assertions (doc_sha256);

CREATE TABLE IF NOT EXISTS decision_projections (
  projection_id TEXT PRIMARY KEY,
  notebook_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  payload_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visit_photo_refs (
  photo_id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL,
  local_file_uri TEXT NOT NULL,
  caption TEXT,
  taken_at TEXT NOT NULL,
  FOREIGN KEY (offer_id) REFERENCES offer_snapshots(offer_id) ON DELETE CASCADE
);
`;
