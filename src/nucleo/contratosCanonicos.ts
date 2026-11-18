import { z } from "zod";
import type { Confianca } from "../dados/contratos";

/**
 * Oito Contratos Canónicos de Dados do VEREDA (docs/ARQUITETURA_MESTRE.md §1.1).
 * Governam o pipeline batch offline (Plano 1), o banco SQLite imutável + cofre privado (Plano 2)
 * e toda projeção exibida na interface cidadã.
 */

export const epistemicTag = z.enum(["registro_oficial", "declarado", "inferencia", "nao_sabemos"]);
export type EpistemicTag = z.infer<typeof epistemicTag>;

/** Os 3 estados explícitos de ausência (docs/projetosraiox/00-sintese-backlog.md R17). */
export const absenceState = z.enum(["nao_se_aplica", "sem_ocorrencia_no_periodo", "sem_leitura_publicada"]);
export type AbsenceState = z.infer<typeof absenceState>;

const sha256Hex = z.string().regex(/^[a-f0-9]{64}$/i);
const isoUtc = z.iso.datetime({ offset: true });
const dsqfl14 = z.string().regex(/^\d{14}$/);
const cnm16 = z.string().regex(/^\d{6}\.[23]\.\d{7}-\d{2}$/);
const ibgeMun7 = z.string().regex(/^\d{7}$/);

/** Mapeamento sem perdas entre o vocabulário legado (`src/dados/contratos.ts`) e o contrato canónico. */
export function paraEpistemicTag(c: Confianca): EpistemicTag {
  return c === "oficial" ? "registro_oficial" : c;
}

export function paraConfiancaLegada(e: EpistemicTag): Confianca {
  return e === "registro_oficial" ? "oficial" : e;
}

// 1. SourceSnapshot
export const esquemaSourceSnapshot = z.strictObject({
  snapshot_id: z.string().min(8).max(80),
  source_slug: z.string().min(2).max(80),
  uri_origem: z.string().min(1).max(1000),
  fetched_at_utc: isoUtc,
  reference_vintage: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
  license: z.enum(["ODbL", "CC-BY", "CC-BY-4.0", "LAI", "Dominio_Publico", "IBGE_Citar", "Uso_Privado_Usuario"]),
  sha256_raw: sha256Hex,
  row_count: z.number().int().min(0),
  schema_version: z.string().min(1).max(32),
});
export type SourceSnapshot = z.infer<typeof esquemaSourceSnapshot>;

// 2. EntityLink
export const matchTier = z.enum(["confirmado", "candidato_revisao", "rejeitado"]);
export type MatchTier = z.infer<typeof matchTier>;

export const esquemaEntityLink = z
  .strictObject({
    link_id: z.string().min(4).max(120),
    source_entity_type: z.enum(["anuncio", "edificio_iptu", "matricula_onr", "obra_sedul", "alagamento"]),
    target_dsqfl: dsqfl14.nullable(),
    target_building_id: z.string().min(1).max(60).nullable(),
    cod_logradouro: z.string().regex(/^\d+$/).nullable(),
    cnm_16: cnm16.nullable(),
    fellegi_sunter_weight: z.number().finite(),
    posterior_probability: z.number().min(0).max(1),
    match_tier: matchTier,
    reviewed_by: z.string().max(80).nullable(),
    requires_user_confirmation: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.match_tier === "candidato_revisao" && !v.requires_user_confirmation) {
      ctx.addIssue({
        code: "custom",
        path: ["requires_user_confirmation"],
        message: "Vínculo na zona cinzenta probabilística deve exigir confirmação explícita na interface.",
      });
    }
    if (v.match_tier === "confirmado" && v.posterior_probability < 0.95 && !v.reviewed_by) {
      ctx.addIssue({
        code: "custom",
        path: ["match_tier"],
        message: "match_tier='confirmado' exige probabilidade posterior >= 0,95 ou revisão humana registrada.",
      });
    }
  });
export type EntityLink = z.infer<typeof esquemaEntityLink>;

// 3. Observation
export const esquemaObservation = z
  .strictObject({
    obs_id: z.string().min(3).max(160),
    entity_id: z.string().min(1).max(80),
    entity_type: z.enum(["lote", "edificio", "face_quadra", "setor"]),
    metric_key: z.string().min(2).max(80),
    value_num: z.number().finite().nullable(),
    value_json: z.string().nullable(),
    unit: z.string().min(1).max(40).nullable(),
    epistemic_tag: epistemicTag,
    absence_state: absenceState.nullable().default(null),
    confidence_interval: z
      .strictObject({
        low: z.number().finite(),
        high: z.number().finite(),
        level: z.number().min(0.5).max(0.99),
      })
      .nullable(),
    snapshot_id: z.string().min(8).max(80),
  })
  .superRefine((v, ctx) => {
    if (v.epistemic_tag === "nao_sabemos" && v.value_num !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["value_num"],
        message: "Observação 'nao_sabemos' não pode carregar value_num numérico.",
      });
    }
    if (v.epistemic_tag === "inferencia" && v.value_num !== null && v.confidence_interval === null && v.value_json === null) {
      // Permitido quando intervalo não aplicável, porém encoraja explícito quando paramétrico.
    }
  });
export type Observation = z.infer<typeof esquemaObservation>;

// 4. UrbanEvent
export const esquemaUrbanEvent = z.strictObject({
  event_id: z.string().min(3).max(120),
  event_domain: z.enum(["hidrologico", "obra_vizinha", "zeladoria", "interrupcao_agua"]),
  start_utc: isoUtc,
  end_utc: isoUtc.nullable(),
  geometry_wkb: z.string().min(2).max(20000),
  rain_mm_24h: z.number().min(0).nullable(),
  tide_m: z.number().finite().nullable(),
  raw_records_count: z.number().int().min(1),
  mitigated_after_event: z.boolean(),
  mitigation_evidence: z.string().max(240).nullable().optional(),
});
export type UrbanEvent = z.infer<typeof esquemaUrbanEvent>;

// 5. OfferSnapshot (estritamente iniciado pelo usuário no dispositivo; sempre 'declarado')
export const esquemaOfferSnapshot = z.strictObject({
  offer_id: z.string().min(3).max(100),
  share_url: z.string().max(2000),
  captured_at: isoUtc,
  capture_method: z.enum(["share_intent", "colagem_manual", "link_usuario"]),
  asking_price_brl: z.number().positive().max(1e10).nullable(),
  condo_fee_brl: z.number().nonnegative().max(1e7).nullable(),
  iptu_declared_brl: z.number().nonnegative().max(1e8).nullable(),
  area_declared_m2: z.number().positive().max(100000).nullable(),
  floor_declared: z.number().int().min(-5).max(200).nullable(),
  sun_declared: z.enum(["nascente", "poente", "norte", "sul", "outro"]).nullable(),
  perceptual_img_hash: z.string().regex(/^[a-f0-9]{16}$/i).nullable(),
  canonical_unit_id: z.string().max(120).nullable(),
  epistemic_tag: z.literal("declarado"),
});
export type OfferSnapshot = z.infer<typeof esquemaOfferSnapshot>;

// 6. DocumentAssertion (exige correspondência literal verificada em source_page)
export function normalizarParaEntailment(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9r$\/.,-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Verificador determinístico de citation entailment:
 * comprova se `verbatimQuote` aparece literalmente (após normalização de acentos e espaços)
 * dentro do texto da página `sourcePage` do documento original.
 */
export function verificarEntailmentDeterministico(
  paginasDoDocumento: Readonly<Record<number, string>> | readonly string[],
  sourcePage: number | null,
  verbatimQuote: string,
): boolean {
  if (sourcePage === null || sourcePage < 1) return false;
  const textoPagina = Array.isArray(paginasDoDocumento)
    ? paginasDoDocumento[sourcePage - 1]
    : (paginasDoDocumento as Readonly<Record<number, string>>)[sourcePage];
  if (!textoPagina) return false;
  const citaNorm = normalizarParaEntailment(verbatimQuote);
  if (citaNorm.length < 10) return false;
  const pagNorm = normalizarParaEntailment(textoPagina);
  return pagNorm.includes(citaNorm);
}

export const docClassEnum = z.enum(["matricula_onr", "ata", "convencao", "balancete", "laudo", "seguro"]);
export type DocClass = z.infer<typeof docClassEnum>;

export const esquemaDocumentAssertion = z
  .strictObject({
    assertion_id: z.string().min(3).max(120),
    doc_sha256: sha256Hex,
    doc_class: docClassEnum,
    claim_type: z.string().min(2).max(80),
    extracted_value: z.string().min(1).max(1000),
    source_page: z.number().int().min(1).nullable(),
    verbatim_quote: z.string().max(1200),
    entailment_verified: z.boolean(),
    epistemic_status: z.enum(["registro_oficial", "declarado", "revisao_humana", "nao_sabemos"]),
  })
  .superRefine((v, ctx) => {
    if (v.entailment_verified) {
      if (v.source_page === null) {
        ctx.addIssue({
          code: "custom",
          path: ["source_page"],
          message: "entailment_verified=true exige source_page >= 1.",
        });
      }
      if (v.verbatim_quote.trim().length < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["verbatim_quote"],
          message: "entailment_verified=true exige trecho literal verificável (>= 10 caracteres).",
        });
      }
      if (v.epistemic_status === "nao_sabemos") {
        ctx.addIssue({
          code: "custom",
          path: ["epistemic_status"],
          message: "Afirmação com entailment verificado não deve ter status 'nao_sabemos'.",
        });
      }
    } else if (v.epistemic_status === "registro_oficial") {
      ctx.addIssue({
        code: "custom",
        path: ["epistemic_status"],
        message: "Sem citation entailment verificado, deve rebaixar para 'revisao_humana' ou 'nao_sabemos'.",
      });
    }
  });
export type DocumentAssertion = z.infer<typeof esquemaDocumentAssertion>;

// 7. DecisionProjection (sem nota mágica opaca 0-100)
export const esquemaDecisionProjection = z.strictObject({
  projection_id: z.string().min(3).max(100),
  notebook_id: z.string().min(1).max(80),
  candidate_ids: z.array(z.string().min(1)).min(1),
  pareto_frontier_ids: z.array(z.string().min(1)).min(1),
  dominated_map: z.record(
    z.string(),
    z.strictObject({
      dominated_by_id: z.string().min(1),
      reason_pt_br: z.string().min(10).max(240),
    }),
  ),
  tco_10y_npv_brl: z.record(z.string(), z.number().finite().nullable()),
  negotiation_deltas_brl: z.record(
    z.string(),
    z.array(
      z.strictObject({
        indicador: z.string(),
        delta_brl: z.number().finite(),
        fundamento_pt_br: z.string(),
        epistemic_tag: epistemicTag,
      }),
    ),
  ),
  partner_alignment_matrix: z.record(
    z.string(),
    z.record(z.string(), z.enum(["atende", "viola", "a_confirmar"])),
  ),
});
export type DecisionProjection = z.infer<typeof esquemaDecisionProjection>;

// 8. PublicationManifest (trava dura de revisão humana para produção certificada)
export const esquemaPublicationManifest = z
  .strictObject({
    release_version: z.string().regex(/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?\+\d{8}$/i),
    city_code_ibge: ibgeMun7,
    layer_tier: z.enum(["C0", "C1", "C2"]),
    sqlite_url: z.string().min(1).max(1000),
    sqlite_zstd_sha256: sha256Hex,
    pmtiles_url: z.string().min(1).max(1000),
    pmtiles_sha256: sha256Hex,
    schema_min_app_version: z.string().regex(/^\d+\.\d+\.\d+$/),
    coverage_stats: z.strictObject({
      bairros_indexados: z.number().int().min(0),
      bairros_certificados: z.number().int().min(0),
      edificios_total: z.number().int().min(0),
      lotes_dsqfl_total: z.number().int().min(0),
      arestas_caminhaveis: z.number().int().min(0),
    }),
    pending_human_gates_count: z.number().int().min(0),
    pending_human_gates_zero: z.boolean(),
    certified_for_release: z.boolean(),
  })
  .superRefine((m, ctx) => {
    if (m.pending_human_gates_zero !== (m.pending_human_gates_count === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["pending_human_gates_zero"],
        message: "pending_human_gates_zero deve refletir exatamente pending_human_gates_count === 0.",
      });
    }
    if (m.certified_for_release && !m.pending_human_gates_zero) {
      ctx.addIssue({
        code: "custom",
        path: ["certified_for_release"],
        message: "Publicação certificada bloqueada em CI/CD enquanto houver revisões humanas pendentes.",
      });
    }
  });
export type PublicationManifest = z.infer<typeof esquemaPublicationManifest>;
