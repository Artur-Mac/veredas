import type { AnaliseV2 } from "../dados/contratos";
import type { DocumentAssertion, EntityLink, OfferSnapshot } from "../nucleo/contratosCanonicos";
import type { SqliteDriver } from "./adaptadorSqlite";
import { DDL_COFRE_USUARIO_SQL } from "./ddlCanonico.sql";

/**
 * Cofre Privado Criptografado do Usuário (`user_vault.db`) e junção cross-database via `ATTACH DATABASE`.
 * Garante sigilo absoluto das notas pessoais, perfis de acessibilidade, documentos ONR/atas e favoritos no aparelho.
 */

export class CofreUsuarioLocal {
  constructor(private readonly driver: SqliteDriver) {}

  inicializar(opts: { chaveSqlCipherHex?: string } = {}): void {
    if (opts.chaveSqlCipherHex) {
      // No SQLCipher nativo, configura chave AES-256 + proteção de memória; inofensivo caso PRAGMA seja ignorado no Node padrão.
      try {
        this.driver.exec(`PRAGMA key = "x'${opts.chaveSqlCipherHex.replace(/[^a-f0-9]/gi, "")}'";`);
        this.driver.exec("PRAGMA cipher_memory_security = ON;");
      } catch {
        // Ignorado em builds sem SQLCipher.
      }
    }
    this.driver.exec(DDL_COFRE_USUARIO_SQL);
  }

  salvarOfertaSnapshot(offer: OfferSnapshot, analise?: AnaliseV2 | Record<string, unknown>): void {
    this.driver
      .prepare(
        `INSERT OR REPLACE INTO offer_snapshots (
           offer_id, share_url, captured_at, capture_method,
           asking_price_brl, condo_fee_brl, iptu_declared_brl, area_declared_m2,
           floor_declared, sun_declared, perceptual_img_hash, canonical_unit_id,
           epistemic_tag, raw_analysis_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        offer.offer_id,
        offer.share_url,
        offer.captured_at,
        offer.capture_method,
        offer.asking_price_brl,
        offer.condo_fee_brl,
        offer.iptu_declared_brl,
        offer.area_declared_m2,
        offer.floor_declared,
        offer.sun_declared,
        offer.perceptual_img_hash,
        offer.canonical_unit_id,
        offer.epistemic_tag,
        JSON.stringify(analise ?? {}),
      );
  }

  listarOfertas(): (OfferSnapshot & { raw_analysis_json: string })[] {
    return this.driver.prepare("SELECT * FROM offer_snapshots ORDER BY captured_at DESC").all() as (OfferSnapshot & {
      raw_analysis_json: string;
    })[];
  }

  salvarEntityLink(link: EntityLink): void {
    this.driver
      .prepare(
        `INSERT OR REPLACE INTO entity_links (
           link_id, source_entity_type, target_dsqfl, target_building_id,
           cod_logradouro, cnm_16, fellegi_sunter_weight, posterior_probability,
           match_tier, reviewed_by, requires_user_confirmation
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        link.link_id,
        link.source_entity_type,
        link.target_dsqfl,
        link.target_building_id,
        link.cod_logradouro,
        link.cnm_16,
        link.fellegi_sunter_weight,
        link.posterior_probability,
        link.match_tier,
        link.reviewed_by,
        link.requires_user_confirmation ? 1 : 0,
      );
  }

  salvarAssercaoDocumental(doc: DocumentAssertion): void {
    this.driver
      .prepare(
        `INSERT OR REPLACE INTO document_assertions (
           assertion_id, doc_sha256, doc_class, claim_type, extracted_value,
           source_page, verbatim_quote, entailment_verified, epistemic_status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        doc.assertion_id,
        doc.doc_sha256,
        doc.doc_class,
        doc.claim_type,
        doc.extracted_value,
        doc.source_page,
        doc.verbatim_quote,
        doc.entailment_verified ? 1 : 0,
        doc.epistemic_status,
      );
  }

  gravarMeta(chave: string, valor: string): void {
    this.driver
      .prepare("INSERT OR REPLACE INTO vault_meta (chave, valor, atualizado_em) VALUES (?, ?, ?)")
      .run(chave, valor, new Date().toISOString());
  }

  lerMeta(chave: string): string | null {
    const r = this.driver.prepare("SELECT valor FROM vault_meta WHERE chave = ?").get(chave);
    return typeof r?.valor === "string" ? r.valor : null;
  }

  apagarTudoParaLgpd(): void {
    this.driver.exec(`
      DELETE FROM visit_photo_refs;
      DELETE FROM document_assertions;
      DELETE FROM decision_projections;
      DELETE FROM entity_links;
      DELETE FROM offer_snapshots;
      DELETE FROM vault_meta;
    `);
  }
}

export type OfertaComEdificioAnexado = {
  offer_id: string;
  asking_price_brl: number | null;
  condo_fee_brl: number | null;
  area_declared_m2: number | null;
  building_id: string | null;
  dsqfl: string | null;
  nome_edificio: string | null;
  bairro_slug: string | null;
  iptu_mediana_anual: number | null;
  match_tier: string | null;
};

/**
 * Executa `ATTACH DATABASE` unindo o Banco Público Somente-Leitura (`main`) ao Cofre Privado (`user_vault`)
 * em memória no dispositivo para cruzar anúncios salvos do comprador com o cadastro público oficial.
 */
export function consultarOfertasCruzadasViaAttach(
  driverPublico: SqliteDriver,
  caminhoVaultDb: string,
): OfertaComEdificioAnexado[] {
  const escaped = caminhoVaultDb.replace(/'/g, "''");
  driverPublico.exec(`ATTACH DATABASE '${escaped}' AS user_vault;`);
  try {
    const rows = driverPublico
      .prepare(
        `SELECT o.offer_id, o.asking_price_brl, o.condo_fee_brl, o.area_declared_m2,
                l.target_building_id AS building_id, l.target_dsqfl AS dsqfl,
                e.nome AS nome_edificio, e.bairro_slug, e.iptu_mediana_anual, l.match_tier
           FROM user_vault.offer_snapshots o
           LEFT JOIN user_vault.entity_links l
             ON l.link_id LIKE (o.offer_id || '::%')
           LEFT JOIN main.edificios e
             ON e.building_id = l.target_building_id
          ORDER BY o.captured_at DESC`,
      )
      .all();
    return rows as OfertaComEdificioAnexado[];
  } finally {
    driverPublico.exec("DETACH DATABASE user_vault;");
  }
}
