import { describe, expect, test } from "@jest/globals";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PMTiles } from "pmtiles";
import { esquemaAnaliseV2 } from "../src/dados/contratos";
import {
  esquemaOfferSnapshot,
  esquemaPublicationManifest,
} from "../src/nucleo/contratosCanonicos";
import { vincularAnuncioFellegiSunter } from "../src/nucleo/resolucao/fellegiSunter";
import { BancoPublicoLocal } from "../src/persistencia/bancoPublico";
import {
  CofreUsuarioLocal,
  consultarOfertasCruzadasViaAttach,
} from "../src/persistencia/cofreUsuario";
import { abrirDriverNodeSqlite } from "../src/persistencia/driverNodeSqlite";
import { migrarAsyncStorageParaCofre } from "../src/persistencia/migrarAsyncStorage";
import { criarEstiloEditorialMapLibre } from "../src/cartografia/estiloEditorial";
import { diagnosticarImovelPorMunicipio, resolverCapacidadesMunicipio } from "../src/municipios/adaptadores/registroMunicipios";
import { endpointDatajudEstadualPorUf } from "../src/nucleo/camadaZeroNacional";

describe("Milestone 6 — SQLite Offline (R*Tree/FTS5/ATTACH), PMTiles v3 e Camada 0/1/2 Multi-Cidade", () => {
  test("Lê recife_public.db compilado com 7.203 edifícios, executa R*Tree bbox e FTS5 em < 15 ms e valida PublicationManifest", () => {
    const dbPath = join(__dirname, "..", "out/pacote-offline/recife_public.db");
    const manifestPath = join(__dirname, "..", "out/pacote-offline/publication_manifest.json");
    const manifestRaw = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const manifest = esquemaPublicationManifest.parse(manifestRaw);

    expect(manifest.city_code_ibge).toBe("2611606");
    expect(manifest.layer_tier).toBe("C2");
    expect(manifest.coverage_stats.bairros_indexados).toBe(72);
    expect(manifest.coverage_stats.edificios_total).toBe(7203);
    expect(manifest.pending_human_gates_count).toBe(300);
    expect(manifest.pending_human_gates_zero).toBe(false);
    expect(manifest.certified_for_release).toBe(false);

    const driver = abrirDriverNodeSqlite(dbPath, true);
    try {
      const pub = new BancoPublicoLocal(driver);
      expect(pub.contarEdificios()).toBe(7203);

      const t0 = performance.now();
      const bbox = pub.buscarPorBboxRtree(-34.906, -8.055, -34.892, -8.038, 100);
      const msRtree = performance.now() - t0;
      expect(bbox.length).toBeGreaterThan(20);
      expect(msRtree).toBeLessThan(15);

      const t1 = performance.now();
      const hitsFts = pub.buscarEnderecosFts5("Carneiro Vilela", 15);
      const msFts = performance.now() - t1;
      expect(hitsFts.length).toBeGreaterThanOrEqual(1);
      expect(msFts).toBeLessThan(15);

      const primeiro = pub.obterDossieEdificio(hitsFts[0]!.building_id);
      expect(primeiro).not.toBeNull();
      expect(primeiro!.solar_horizonte_108b?.byteLength).toBe(108);
    } finally {
      driver.close();
    }
  });

  test("Cofre user_vault migra AsyncStorage sem destruir chaves antigas e faz JOIN cross-db via ATTACH DATABASE", async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "vereda-vault-"));
    try {
      const vaultPath = join(tmpDir, "user_vault.sqlite");
      const pubPath = join(__dirname, "..", "out/pacote-offline/recife_public.db");

      const vaultDriver = abrirDriverNodeSqlite(vaultPath, false);
      const cofre = new CofreUsuarioLocal(vaultDriver);
      cofre.inicializar();

      const driverPub = abrirDriverNodeSqlite(pubPath, true);
      const pub = new BancoPublicoLocal(driverPub);
      const alvo = pub.buscarEnderecosFts5("Carneiro Vilela", 1)[0]!;

      const analiseLegada = esquemaAnaliseV2.parse({
        versao: 2,
        id: "an-mig-1",
        criadaEm: "2026-11-10T10:00:00Z",
        atualizadaEm: "2026-11-15T14:30:00Z",
        url: "https://anuncio.invalid/migracao",
        nome: "Apartamento nas Graças",
        modalidade: "compra",
        tipologia: "apartamento",
        bairro: alvo.bairro_slug,
        bairroTexto: alvo.bairro_slug,
        logradouro: alvo.logradouro,
        numero: alvo.numero,
        nomeEdificio: alvo.nome,
        extracao: null,
        declarados: {
          preco: { valor: 720_000, origem: "link", aConfirmar: false },
          condominio: { valor: 900, origem: "link", aConfirmar: false },
          iptu: { valor: 1800, periodo: "ano", origem: "link", aConfirmar: false },
          seguroIncendio: { valor: null, origem: "link", aConfirmar: true },
          taxaServico: { valor: null, origem: "link", aConfirmar: true },
          outros: { valor: null, origem: "link", aConfirmar: true },
          area: { valor: 120, origem: "link", aConfirmar: false },
          quartos: { valor: 3, origem: "link", aConfirmar: false },
          suites: { valor: 1, origem: "link", aConfirmar: false },
          banheiros: { valor: 2, origem: "link", aConfirmar: false },
          vagas: { valor: 2, origem: "link", aConfirmar: false },
          andar: { valor: 5, origem: "link", aConfirmar: false },
        },
        vinculo: {
          estado: "confirmado",
          edificioId: alvo.building_id,
          dsqfl: alvo.dsqfl,
          confirmadoEm: "2026-11-15T14:30:00Z",
          indiceGeradoEm: "2026-11-15T00:00:00Z",
        },
        visita: {
          verificadas: [],
          respostas: {},
          perguntasProprias: [],
          notas: "",
          ruido: null,
          orientacaoGraus: null,
          segundos: 0,
          concluidaEm: null,
        },
        salva: true,
        descarte: null,
      });

      const storeMock: Record<string, unknown> = {
        "vereda-analises-v2": [analiseLegada],
        "vereda-perfil-domicilio-v1": { moradores: 3, usoArCondicionado: "noite_1_quarto" },
      };

      const mig1 = await migrarAsyncStorageParaCofre({
        listarChaves: async () => Object.keys(storeMock),
        lerJson: async (k) => storeMock[k],
        cofre,
      });
      expect(mig1.jaMigradoAntes).toBe(false);
      expect(mig1.ofertasMigradas).toBe(1);
      expect(mig1.perfisMigrados).toBe(1);
      // Chaves antigas preservadas (não destrutivo)
      expect(Object.keys(storeMock)).toHaveLength(2);

      // Re-execução é idempotente
      const mig2 = await migrarAsyncStorageParaCofre({
        listarChaves: async () => Object.keys(storeMock),
        lerJson: async (k) => storeMock[k],
        cofre,
      });
      expect(mig2.jaMigradoAntes).toBe(true);

      const links = vincularAnuncioFellegiSunter(
        {
          adId: analiseLegada.id,
          url: analiseLegada.url,
          portal: "zap",
          bairroSlug: alvo.bairro_slug,
          logradouroTexto: alvo.logradouro,
          numeroTexto: alvo.numero,
          nomeEdificioTexto: alvo.nome,
          areaM2: 120,
          quartos: 3,
          vagas: 2,
          andar: 5,
          precoReais: 720_000,
          lon: alvo.lon,
          lat: alvo.lat,
        },
        [
          {
            buildingId: alvo.building_id,
            dsqfl: alvo.dsqfl ?? "00000000000000",
            codLogradouro: alvo.cod_logradouro,
            nomeEdificio: alvo.nome,
            logradouro: alvo.logradouro,
            numero: alvo.numero,
            bairroSlug: alvo.bairro_slug,
            lon: alvo.lon,
            lat: alvo.lat,
            pavimentos: alvo.pavimentos,
            areasTipologiasM2: [120],
          },
        ],
      );
      expect(links).toHaveLength(1);
      cofre.salvarEntityLink(links[0]!);
      vaultDriver.close();

      // ATTACH DATABASE real cruzando user_vault + edificios públicos
      const cruzado = consultarOfertasCruzadasViaAttach(driverPub, vaultPath);
      expect(cruzado).toHaveLength(1);
      expect(cruzado[0]!.building_id).toBe(alvo.building_id);
      expect(cruzado[0]!.iptu_mediana_anual).toBe(alvo.iptu_mediana_anual);
      driverPub.close();

      expect(esquemaOfferSnapshot).toBeDefined();
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("Valida arquivo PMTiles Spec v3 offline gerado e estilo editorial MapLibre", async () => {
    const pmtilesPath = join(__dirname, "..", "out/pacote-offline/recife_2026_11.pmtiles");
    const buf = readFileSync(pmtilesPath);
    const reader = new PMTiles({
      getKey: () => "local-recife-pmtiles",
      getBytes: async (offset: number, length: number) => ({
        data: buf.buffer.slice(buf.byteOffset + offset, buf.byteOffset + offset + length),
      }),
    });

    const header = await reader.getHeader();
    expect(header.specVersion).toBe(3);
    expect(header.minZoom).toBe(12);
    expect(header.maxZoom).toBe(14);
    expect(header.numAddressedTiles).toBeGreaterThan(30);

    const meta = (await reader.getMetadata()) as { vector_layers: { id: string }[] };
    expect(meta.vector_layers.map((l) => l.id)).toEqual(
      expect.arrayContaining(["edificios", "alagamento", "iep", "ruido_aeroporto"]),
    );

    const tile = await reader.getZxy(12, 1650, 2139);
    expect(tile?.data.byteLength).toBeGreaterThan(20);

    const estilo = criarEstiloEditorialMapLibre(false);
    expect(estilo.version).toBe(8);
  });

  test("Roteia Camada 0 Nacional (5.570 municípios) e Camadas 1/2 (Recife C2 + capitais C1)", () => {
    const capRecife = resolverCapacidadesMunicipio("2611606");
    expect(capRecife.tier).toBe("C2");
    expect(capRecife.possuiLidarAltaResolucao).toBe(true);

    const capSp = resolverCapacidadesMunicipio("3550308");
    expect(capSp.tier).toBe("C1");
    expect(endpointDatajudEstadualPorUf("SP")).toMatch(/api_publica_tjsp/);

    const c0 = diagnosticarImovelPorMunicipio({
      codigoIbge7: "2604106", // Caruaru (PE) — cobertura universal Camada 0
      nomeMunicipio: "Caruaru",
      uf: "PE",
      distanciaErb5gM: 380,
      conjuntoAneelDec: 11.4,
      deltaIlhaCalorMapBiomasC: 2.8,
      areaRiscoCprm: false,
    });
    expect(c0.capacidades.tier).toBe("C0");
    expect(c0.dossieBaseNacional.sinaisNacionais.cobertura5gEstimada).toBe("forte");
    expect(c0.dossieBaseNacional.tagPredominante).toBe("registro_oficial");
  });
});
