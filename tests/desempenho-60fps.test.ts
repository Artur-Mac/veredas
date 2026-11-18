import { describe, expect, test } from "@jest/globals";
import { join } from "node:path";
import { BancoPublicoLocal } from "../src/persistencia/bancoPublico";
import { abrirDriverNodeSqlite } from "../src/persistencia/driverNodeSqlite";
import { derivarCustoPorPartes } from "../src/dados/custoPorPartes";
import { traduzirIndicadoresCidadao } from "../src/dados/cidadao/tradutorCidadao";
import { filtrarDominanciaInvisivel } from "../src/dados/cidadao/dominanciaInvisivel";
import { esquemaAnaliseV2, esquemaEdificio } from "../src/dados/contratos";
import type { PerfilDoDomicilio } from "../src/estado/PerfilDomicilio";

const DB_PATH = join(__dirname, "..", "out/pacote-offline/recife_public.db");
const VAZIO = { valor: null, origem: "link" as const, aConfirmar: true };

describe("Milestone 8 — Orçamento de Desempenho Offline (< 16 ms p95 para 60 fps)", () => {
  test("Consulta R*Tree + FTS5 + Custo por Partes + Tradutor Cidadão operam em < 16 ms p95", () => {
    const db = abrirDriverNodeSqlite(DB_PATH, true);
    try {
      const pub = new BancoPublicoLocal(db);
      const amostraInicial = pub.buscarEnderecosFts5("Boa Viagem", 1)[0]!;

      const predio = esquemaEdificio.parse({
        id: amostraInicial.building_id,
        bairro: amostraInicial.bairro_slug,
        logradouro: amostraInicial.logradouro,
        numero: amostraInicial.numero,
        dsqfl: amostraInicial.dsqfl,
        nome: amostraInicial.nome,
        centro: [amostraInicial.lon, amostraInicial.lat],
        poligono: null,
        unidades: amostraInicial.unidades,
        tipologias: [{ area: 100, unidades: amostraInicial.unidades, iptuAnualMediano: 3000 }],
        anoConstrucao: amostraInicial.ano_construcao,
        pavimentos: amostraInicial.pavimentos,
        ate4Pavimentos: false,
        padrao: amostraInicial.padrao,
        iptuAnual: null,
        itbi: null,
        obras150m: { licencasDeObra: 0, relevantes24m: 0, demolicoes24m: 0, recentes: [] },
      });

      const analise = esquemaAnaliseV2.parse({
        versao: 2,
        id: "bench-1",
        criadaEm: "2026-11-17T10:00:00Z",
        atualizadaEm: "2026-11-17T10:00:00Z",
        url: "https://anuncio.invalid/bench1",
        nome: "Apartamento Benchmark",
        modalidade: "compra",
        tipologia: "apartamento",
        bairro: "boa-viagem",
        bairroTexto: "Boa Viagem",
        logradouro: amostraInicial.logradouro,
        numero: amostraInicial.numero,
        nomeEdificio: amostraInicial.nome,
        extracao: null,
        declarados: {
          preco: { valor: 650_000, origem: "link", aConfirmar: false },
          condominio: { valor: 950, origem: "link", aConfirmar: false },
          iptu: { ...VAZIO, periodo: "desconhecido" },
          seguroIncendio: VAZIO,
          taxaServico: VAZIO,
          outros: VAZIO,
          area: { valor: 100, origem: "link", aConfirmar: false },
          quartos: { valor: 3, origem: "link", aConfirmar: false },
          suites: VAZIO,
          banheiros: { valor: 2, origem: "link", aConfirmar: false },
          vagas: { valor: 1, origem: "link", aConfirmar: false },
          andar: { valor: 6, origem: "link", aConfirmar: false },
        },
        vinculo: { estado: "pendente" },
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

      const perfil: PerfilDoDomicilio = {
        versao: 1,
        configurado: true,
        moradores: 2,
        usoArCondicionado: "noite_1_quarto",
        destinoBairro: "recife",
        modoTransporte: "transporte_publico",
        diasPresenciaisMes: 20,
        entradaPercentualCompra: 20,
        prazoAnosCompra: 30,
        necessidadesDeAcesso: [],
        orcamentoMensalReais: 5000,
        locaisRotina: [],
        atualizadoEm: null,
      };

      const latenciasMs: number[] = [];
      for (let i = 0; i < 50; i += 1) {
        const t0 = performance.now();
        pub.buscarPorBboxRtree(-34.91, -8.13, -34.88, -8.09, 60);
        pub.buscarEnderecosFts5("Boa Viagem", 10);
        const partes = derivarCustoPorPartes(analise, predio, perfil, {
          regimeSpu: "aforamento",
          valorDominioPlenoTerrenoReais: 10_000_000,
          fracaoIdeal: 0.02,
          financiamentoSfh: true,
        });
        traduzirIndicadoresCidadao({
          modalidade: "compra",
          dsqfl: predio.dsqfl,
          custoPorPartes: partes,
        });
        filtrarDominanciaInvisivel("cad-bench", [
          { id: "1", nomeExibicao: "A", custoMensalTotalReais: 4100, areaM2: 100, deslocamentoMinDia: 25, ruidoInternoDb: 36 },
          { id: "2", nomeExibicao: "B", custoMensalTotalReais: 4500, areaM2: 90, deslocamentoMinDia: 35, ruidoInternoDb: 42 },
        ]);
        latenciasMs.push(performance.now() - t0);
      }

      latenciasMs.sort((a, b) => a - b);
      const p95 = latenciasMs[Math.floor(latenciasMs.length * 0.95)]!;
      expect(p95).toBeLessThan(16);
    } finally {
      db.close();
    }
  });
});
