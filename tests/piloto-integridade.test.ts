// VE12: integridade do caderno com o que as épocas VE05–VE11 passaram a gravar (retrato da memória, perguntas levadas
// para a visita, destinos com posição) — exportar e restaurar não perde nada; caderno antigo continua válido.
import { describe, expect, it } from "@jest/globals";
import { esquemaAnaliseV2 } from "../src/dados/contratos";
import { cadernoVazio } from "../src/dados/caderno";
import { exportarCaderno, lerBackup } from "../src/dados/backup";
import { retrato } from "../src/dados/memoria";
import { adicionarPropria } from "../src/componentes/visita-v1/logica";
import { analiseDeTeste, EM } from "./fixtures/caderno";

describe("backup e restauração com os campos novos", () => {
  const memoria = retrato({ em: EM, fontes: { indice: "indice-municipal/x" }, declarados: { preco: { valor: 3000 }, condominio: { valor: 650 }, iptu: { valor: 150, periodo: "mes" }, seguroIncendio: { valor: 40 } },
    obras: [{ categoria: "construcao", descricao: "ALVARA DE CONSTRUCAO INICIAL", data: "2026-03", situacao: "DEFERIDO", centro: [-34.9, -8.1], distanciaM: 80 }],
    defesaCivil: { porAno: [[2024, 2]], acoesComunitarias: 3 }, ruaDoPredio: null, essenciais: [{ categoria: "mercado", nome: "Mercado A", minutos: 6 }], noite: { parada: "Ponto X", ultima: 85000 } });
  const base = analiseDeTeste("a", { caderno: { ...cadernoVazio(), memoria,
    destinos: [{ id: "destino-trabalho", apelido: "Trabalho", nota: "", posicao: { longitude: -34.87, latitude: -8.06, precisaoM: 15, em: EM } }] } });
  const comPerguntas = { ...base, visita: adicionarPropria(adicionarPropria(base.visita, "Sol no lado sul por volta das 8h: as janelas do apartamento ficam desse lado? Há proteção (varanda, brise, árvore)?")!,
    "Barulho: ouvir o lado sudeste (Avenida Boa Viagem) num dia útil por volta das 18h e comparar com o lado noroeste.")! };

  it("exportar e restaurar preserva retrato, destinos e perguntas levadas para a visita", () => {
    expect(esquemaAnaliseV2.safeParse(comPerguntas).success).toBe(true);
    const lido = lerBackup(exportarCaderno([comPerguntas], EM));
    expect(lido).toEqual([comPerguntas]);
    expect(lido[0]!.caderno?.memoria?.fatos.length).toBe(memoria.fatos.length);
    expect(lido[0]!.visita.perguntasProprias).toHaveLength(2);
  });
  it("caderno anterior às épocas novas (sem retrato nem destinos) continua válido e restaura igual", () => {
    const antigo = analiseDeTeste("b", { caderno: cadernoVazio() });
    expect(lerBackup(exportarCaderno([antigo], EM))).toEqual([antigo]);
  });
  it("retrato com campo inválido é recusado pelo esquema, não gravado pela metade", () => {
    const ruim = { ...base, caderno: { ...base.caderno!, memoria: { ...memoria, versao: 2 } } };
    expect(esquemaAnaliseV2.safeParse(ruim).success).toBe(false);
  });
});
