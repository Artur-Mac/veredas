import { describe, expect, it } from "@jest/globals";
import {
  esquemaDecisionProjection,
  esquemaDocumentAssertion,
  esquemaEntityLink,
  esquemaObservation,
  esquemaOfferSnapshot,
  esquemaPublicationManifest,
  esquemaSourceSnapshot,
  esquemaUrbanEvent,
  paraConfiancaLegada,
  paraEpistemicTag,
  verificarEntailmentDeterministico,
} from "../src/nucleo/contratosCanonicos";

const SHA = "a".repeat(64);

describe("8 Contratos Canónicos do VEREDA", () => {
  it("mapeia sem perda entre epistemicTag canónico e confiança legada", () => {
    expect(paraEpistemicTag("oficial")).toBe("registro_oficial");
    expect(paraConfiancaLegada("registro_oficial")).toBe("oficial");
    expect(paraEpistemicTag("inferencia")).toBe("inferencia");
    expect(paraEpistemicTag("nao_sabemos")).toBe("nao_sabemos");
  });

  it("SourceSnapshot valida snapshot imutável e vintage", () => {
    const ok = esquemaSourceSnapshot.parse({
      snapshot_id: "esig-lotes-20261115",
      source_slug: "esig_lotes_recife",
      uri_origem: "https://esigportal2.recife.pe.gov.br/arcgis/rest/services/Planejamento/BASES_LOTES_EDIFICACAO_BAIRRO/MapServer",
      fetched_at_utc: "2026-11-15T12:00:00Z",
      reference_vintage: "2026-11-15",
      license: "ODbL",
      sha256_raw: SHA,
      row_count: 114079,
      schema_version: "1.0.0",
    });
    expect(ok.row_count).toBe(114079);
  });

  it("EntityLink bloqueia promoção silenciosa na zona cinzenta probabilística", () => {
    expect(() =>
      esquemaEntityLink.parse({
        link_id: "lnk-1",
        source_entity_type: "anuncio",
        target_dsqfl: "12345678901234",
        target_building_id: "60461-331",
        cod_logradouro: "60461",
        cnm_16: null,
        fellegi_sunter_weight: 6.2,
        posterior_probability: 0.78,
        match_tier: "candidato_revisao",
        reviewed_by: null,
        requires_user_confirmation: false,
      }),
    ).toThrow(/confirmação explícita/);

    expect(() =>
      esquemaEntityLink.parse({
        link_id: "lnk-2",
        source_entity_type: "anuncio",
        target_dsqfl: "12345678901234",
        target_building_id: "60461-331",
        cod_logradouro: "60461",
        cnm_16: null,
        fellegi_sunter_weight: 3.1,
        posterior_probability: 0.78,
        match_tier: "confirmado",
        reviewed_by: null,
        requires_user_confirmation: false,
      }),
    ).toThrow(/confirmado/);
  });

  it("Observation proíbe value_num numérico quando epistemic_tag = 'nao_sabemos' e aceita 3 estados de ausência", () => {
    expect(() =>
      esquemaObservation.parse({
        obs_id: "obs-1",
        entity_id: "60461-331",
        entity_type: "edificio",
        metric_key: "altura_m",
        value_num: 0,
        value_json: null,
        unit: "m",
        epistemic_tag: "nao_sabemos",
        absence_state: "sem_leitura_publicada",
        confidence_interval: null,
        snapshot_id: "snap-pe3d-2026",
      }),
    ).toThrow(/nao_sabemos/);

    const ok = esquemaObservation.parse({
      obs_id: "obs-2",
      entity_id: "60461-331",
      entity_type: "edificio",
      metric_key: "spu_regime",
      value_num: null,
      value_json: JSON.stringify({ regime: "alodial" }),
      unit: null,
      epistemic_tag: "registro_oficial",
      absence_state: "nao_se_aplica",
      confidence_interval: null,
      snapshot_id: "snap-spu-2026",
    });
    expect(ok.absence_state).toBe("nao_se_aplica");
  });

  it("OfferSnapshot restringe captura à iniciativa do usuário (Share Intent / manual) sempre como 'declarado'", () => {
    const offer = esquemaOfferSnapshot.parse({
      offer_id: "off-1",
      share_url: "https://portal.invalid/imovel/123",
      captured_at: "2026-11-17T14:00:00Z",
      capture_method: "share_intent",
      asking_price_brl: 650000,
      condo_fee_brl: 910,
      iptu_declared_brl: 240,
      area_declared_m2: 92,
      floor_declared: 6,
      sun_declared: "nascente",
      perceptual_img_hash: "0123456789abcdef",
      canonical_unit_id: "60461-331|92|3q",
      epistemic_tag: "declarado",
    });
    expect(offer.epistemic_tag).toBe("declarado");
  });

  it("DocumentAssertion exige citation entailment verificado com página e trecho literal", () => {
    const paginas = {
      1: "CERTIDÃO DE INTEIRO TEOR. Matrícula 12.345. Proprietário: João Silva.",
      2: "AV-4/12.345: Aprovada chamada extra de fachada no valor de R$ 42.000,00 em 12 parcelas.",
    };
    const quote = "Aprovada chamada extra de fachada no valor de R$ 42.000,00 em 12 parcelas";
    expect(verificarEntailmentDeterministico(paginas, 2, quote)).toBe(true);
    expect(verificarEntailmentDeterministico(paginas, 1, quote)).toBe(false);

    expect(() =>
      esquemaDocumentAssertion.parse({
        assertion_id: "doc-1",
        doc_sha256: SHA,
        doc_class: "ata",
        claim_type: "cota_extra",
        extracted_value: "R$ 42.000,00",
        source_page: 2,
        verbatim_quote: quote,
        entailment_verified: false,
        epistemic_status: "registro_oficial",
      }),
    ).toThrow(/citation entailment/);
  });

  it("UrbanEvent e DecisionProjection validam contratos sem nota mágica opaca", () => {
    const ev = esquemaUrbanEvent.parse({
      event_id: "ev-20230630-bv",
      event_domain: "hidrologico",
      start_utc: "2023-06-30T08:00:00Z",
      end_utc: "2023-06-30T20:00:00Z",
      geometry_wkb: "0101000000",
      rain_mm_24h: 64.5,
      tide_m: 1.92,
      raw_records_count: 7,
      mitigated_after_event: false,
    });
    expect(ev.rain_mm_24h).toBe(64.5);

    const proj = esquemaDecisionProjection.parse({
      projection_id: "proj-1",
      notebook_id: "nb-recife",
      candidate_ids: ["a1", "a2", "a3"],
      pareto_frontier_ids: ["a1", "a2"],
      dominated_map: {
        a3: {
          dominated_by_id: "a1",
          reason_pt_br: "Custa R$ 450/mês a mais, tem área menor e fica mais longe do trabalho.",
        },
      },
      tco_10y_npv_brl: { a1: 710000, a2: 695000, a3: 820000 },
      negotiation_deltas_brl: {
        a1: [{ indicador: "IND-04", delta_brl: -35000, fundamento_pt_br: "Excesso sonoro noturno na fachada frontal.", epistemic_tag: "inferencia" }],
      },
      partner_alignment_matrix: {
        a1: { pessoa_1: "atende", pessoa_2: "atende" },
      },
    });
    expect(proj.pareto_frontier_ids).toEqual(["a1", "a2"]);
  });

  it("PublicationManifest bloqueia certificação quando pending_human_gates_zero é false", () => {
    expect(() =>
      esquemaPublicationManifest.parse({
        release_version: "2.0.0+20261117",
        city_code_ibge: "2611606",
        layer_tier: "C1",
        sqlite_url: "https://cdn.vereda.invalid/recife_public.db.zst",
        sqlite_zstd_sha256: SHA,
        pmtiles_url: "https://cdn.vereda.invalid/recife.pmtiles",
        pmtiles_sha256: SHA,
        schema_min_app_version: "0.2.0",
        coverage_stats: {
          bairros_indexados: 72,
          bairros_certificados: 6,
          edificios_total: 7206,
          lotes_dsqfl_total: 114079,
          arestas_caminhaveis: 300703,
        },
        pending_human_gates_count: 259,
        pending_human_gates_zero: false,
        certified_for_release: true,
      }),
    ).toThrow(/revisões humanas pendentes/);

    const staging = esquemaPublicationManifest.parse({
      release_version: "2.0.0-staging+20261117",
      city_code_ibge: "2611606",
      layer_tier: "C1",
      sqlite_url: "https://cdn.vereda.invalid/recife_public.db.zst",
      sqlite_zstd_sha256: SHA,
      pmtiles_url: "https://cdn.vereda.invalid/recife.pmtiles",
      pmtiles_sha256: SHA,
      schema_min_app_version: "0.2.0",
      coverage_stats: {
        bairros_indexados: 72,
        bairros_certificados: 0,
        edificios_total: 7206,
        lotes_dsqfl_total: 114079,
        arestas_caminhaveis: 300703,
      },
      pending_human_gates_count: 300,
      pending_human_gates_zero: false,
      certified_for_release: false,
    });
    expect(staging.certified_for_release).toBe(false);
  });

});
