import { describe, expect, it, beforeEach } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import { z } from "zod";
import { CHAVE_ANALISES_V2, esquemaAnaliseV2 } from "../src/dados/contratos";
import { esquemaAnalise } from "../src/dados/analise";
import { migrarAnaliseV1 } from "../src/dados/migracao";

describe("Persistência e migração de análises v1 -> v2 com AsyncStorage", () => {
  const CHAVE_V1 = "vereda-analises-v1";

  const analisesV1 = [
    {
      id: "teste-1",
      nome: "Apartamento em Casa Forte",
      bairro: "Casa Forte",
      url: "https://www.zapimoveis.com.br/imovel/111",
      tipo: "aluguel",
      preco: 3200,
      condominio: 800,
      iptuAnual: 2400,
      outros: null,
      area: 85,
      notas: "Andar alto",
      verificadas: [],
      atualizadoEm: "2026-10-19T12:00:00.000Z",
    },
  ];

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("migra v1 para v2 na primeira carga e mantém v1 intacta", async () => {
    // 1. Simula v1 pré-existente
    await AsyncStorage.setItem(CHAVE_V1, JSON.stringify(analisesV1));

    // 2. Simula o fluxo de carga do AnalisesNoAparelho
    const brutoV2 = await AsyncStorage.getItem(CHAVE_ANALISES_V2);
    expect(brutoV2).toBeNull();

    const brutoV1 = await AsyncStorage.getItem(CHAVE_V1);
    expect(brutoV1).not.toBeNull();
    const lidasV1 = JSON.parse(brutoV1!);

    const agora = new Date("2026-10-19T21:00:00.000Z");
    const migradas = lidasV1.map((item: unknown) => {
      const v1 = esquemaAnalise.parse(item);
      return migrarAnaliseV1(v1, agora);
    });

    await AsyncStorage.setItem(CHAVE_ANALISES_V2, JSON.stringify(migradas));

    // 3. Verifica que v2 foi gravada e é válida
    const v2Gravada = await AsyncStorage.getItem(CHAVE_ANALISES_V2);
    expect(v2Gravada).not.toBeNull();
    const parsedV2 = z.array(esquemaAnaliseV2).parse(JSON.parse(v2Gravada!));
    expect(parsedV2.length).toBe(1);
    expect(parsedV2[0]?.id).toBe("teste-1");
    expect(parsedV2[0]?.bairro).toBe("casa-forte");
    expect(parsedV2[0]?.versao).toBe(2);

    // 4. Verifica que v1 continua INTACTA
    const v1Apos = await AsyncStorage.getItem(CHAVE_V1);
    expect(v1Apos).toBe(JSON.stringify(analisesV1));
  });
});
