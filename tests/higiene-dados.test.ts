import { describe, expect, it } from "@jest/globals";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  converterUtcParaBrt,
  corrigirPulsoCopParaBrt,
  higienizarApacGeojson,
  sanitizarLeituraPluviometrica,
} from "../src/nucleo/higiene/chuvaBr";
import { deduplicarChamados156, hashProtocolo156 } from "../src/nucleo/higiene/deduplicar156";
import { deduplicarParaciclosGeojson } from "../src/nucleo/higiene/cicloviario";
import {
  deveExcluirDoManifesto,
  extrairArvoresTombadasOficiais,
  filtrarCadastroArboreoLegado,
} from "../src/nucleo/higiene/arquivosLegados";
import { diagnosticarPendencias } from "../src/nucleo/higiene/pendenciasHumanas";

const RAIZ = join(__dirname, "..");

describe("Higiene de dados (APAC -3h, 156 hash, paraciclos, legados e gates humanos)", () => {
  it("converte timestamps UTC APAC/CEMADEN para BRT (-03:00) e põe negativos/1900 em quarentena", () => {
    const conv = converterUtcParaBrt("2026-11-15 11:20:00 11:20:00");
    expect(conv).not.toBeNull();
    expect(conv?.utcIso).toBe("2026-11-15T11:20:00Z");
    expect(conv?.brtIso).toBe("2026-11-15T08:20:00-03:00");

    expect(converterUtcParaBrt("1900-01-01 11:29:55")).toBeNull();
    expect(sanitizarLeituraPluviometrica(-1)).toBeNull();
    expect(sanitizarLeituraPluviometrica(0)).toBe(0);
    expect(sanitizarLeituraPluviometrica(12.45)).toBe(12.45);

    const apacReal = JSON.parse(
      readFileSync(join(RAIZ, "docs/aplicacao/apac-chuva-recife-2026-11-15.geojson"), "utf8"),
    );
    const res = higienizarApacGeojson(apacReal);
    expect(res.totalLidas).toBe(20);
    expect(res.quarentenadas).toBe(1);
    expect(res.leiturasNegativasRemovidas).toBeGreaterThanOrEqual(20);
    const inmet = res.estacoes.find((e) => e.objectId === 682);
    expect(inmet?.epistemicTag).toBe("nao_sabemos");
    expect(inmet?.leituraBrt).toBeNull();
    expect(inmet?.acumuladosMm.h24).toBeNull();
  });

  it("corrige o desvio de +3h nos pulsos COP entre IDUNICO e DATAHORA", () => {
    const amostra = corrigirPulsoCopParaBrt({
      OBJECTID: 415230,
      CODESTACAO: "18",
      LATITUDE: -8.107935,
      LONGITUDE: -34.927014,
      NOME: "Av. Recife",
      CHUVA: 0.5,
      IDUNICO: "0012f80000002235_1689598972000",
      DATAHORA: 1689588172000,
    });
    expect(amostra.desvioCorrigido3h).toBe(true);
    expect(amostra.leituraUtc).toBe("2023-07-17T13:02:52Z");
    expect(amostra.leituraBrt).toBe("2023-07-17T10:02:52-03:00");
    expect(amostra.epistemicTag).toBe("registro_oficial");
  });

  it("desduplica chamados 156 republicados por hash de conteúdo e mantém situação mais recente", () => {
    const out = deduplicarChamados156([
      {
        GRUPOSERVICO_DESCRICAO: "ILUMINAÇÃO",
        SERVICO_DESCRICAO: "LÂMPADA APAGADA",
        LOGRADOURO: "RUA DO SOL",
        NUMERO: "100",
        BAIRRO: "BOA VISTA",
        DATA_DEMANDA: "2026-01-10",
        SITUACAO: "ABERTA",
        DATA_ULT_SITUACAO: "2026-01-10",
        latitude: null,
        longitude: null,
      },
      {
        GRUPOSERVICO_DESCRICAO: "Iluminacao",
        SERVICO_DESCRICAO: "Lampada Apagada",
        LOGRADOURO: "Rua  do  Sol",
        NUMERO: "100",
        BAIRRO: "Boa Vista",
        DATA_DEMANDA: "2026-01-10",
        SITUACAO: "ATENDIDA",
        DATA_ULT_SITUACAO: "2026-01-12",
        latitude: "-8,0621",
        longitude: "-34,8772",
      },
    ]);
    expect(out.duplicadosDescartados).toBe(1);
    expect(out.unicos).toHaveLength(1);
    expect(out.unicos[0]?.situacao).toBe("ATENDIDA");
    expect(out.unicos[0]?.coordenada).toEqual([-34.8772, -8.0621]);
    expect(out.unicos[0]?.protocoloHash).toMatch(/^p156_[a-f0-9]{16}$/);
    expect(hashProtocolo156("abc")).toBe(hashProtocolo156("abc"));
  });

  it("desduplica GeoJSONs triplicados de paraciclos pelo SHA-256 e chave espacial", () => {
    const res = deduplicarParaciclosGeojson([
      {
        resourceId: "836b8e24-67d8-49fc-a62c-85602b501e80",
        sha256: "e840".padEnd(64, "0"),
        features: [
          { geometry: { type: "Point", coordinates: [-34.89, -8.05] }, properties: { Name: "P01" } },
        ],
      },
      {
        resourceId: "a290b35f-0f2f-440a-a437-ad478a9076ff",
        sha256: "e840".padEnd(64, "0"),
        features: [
          { geometry: { type: "Point", coordinates: [-34.89, -8.05] }, properties: { Name: "P01" } },
        ],
      },
    ]);
    expect(res.recursosLidos).toBe(1);
    expect(res.recursosDescartadosPorShaIdentico).toEqual(["a290b35f-0f2f-440a-a437-ad478a9076ff"]);
    expect(res.unicos).toHaveLength(1);
  });

  it("exclui CTTU 2015/2016 e copa arbórea de 2007 preservando árvores tombadas oficiais", () => {
    expect(deveExcluirDoManifesto("5767160f-f27a-43f1-9fe0-40ebd4742e3f")).toBe(true);
    expect(deveExcluirDoManifesto("a6a6d09e-fc5c-4fec-adcb-bf9286d1748f")).toBe(true);
    expect(deveExcluirDoManifesto("recurso-ativo-qualquer")).toBe(false);

    const filtradas = filtrarCadastroArboreoLegado([
      { id: 1, tombada: false, alturaCopaM: 12, diametroCopaM: 6 },
      { id: 2, tombada: true, alturaCopaM: 15, diametroCopaM: 9 },
    ]);
    expect(filtradas).toHaveLength(1);
    expect(filtradas[0]?.restricaoLegalAbate).toBe(true);
    expect("alturaCopaM" in (filtradas[0] ?? {})).toBe(false);

    const rawArvores = extrairArvoresTombadasOficiais({
      features: [
        {
          geometry: { coordinates: [-34.922, -8.034] },
          properties: { objectid: 1, cdnum: 1, nmpopul: "Baobá", cdnmcient: "Adansonia digitata L." },
        },
      ],
    });
    expect(rawArvores[0]?.epistemicTag).toBe("registro_oficial");
  });

  it("preserva integralmente a trava de pendências humanas (sem fabricação de revisões)", () => {
    const diag = diagnosticarPendencias(join(RAIZ, "docs/aplicacao/evaluation-sets"));
    expect(diag.totalPendentes).toBeGreaterThanOrEqual(259);
    expect(diag.totalRevisadas).toBe(0);
    expect(diag.pending_human_gates_zero).toBe(false);

    const cliOut = JSON.parse(
      execFileSync(process.execPath, [join(RAIZ, "scripts/auditoria-humana.mjs"), "--status"], {
        encoding: "utf8",
      }),
    );
    expect(cliOut.pending_human_gates_zero).toBe(false);
    expect(cliOut.totalPendentes).toBe(diag.totalPendentes);
  });
});
