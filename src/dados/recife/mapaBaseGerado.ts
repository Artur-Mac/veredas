// Gerado por scripts/dados/construir-mapa-base.mjs. Não edite à mão. Troca atômica depois de gravar os arquivos.
// Mapa-base por bairro (fora do bundle, D036): bairro → arquivo de camada; caixa [oeste, sul, leste, norte] em graus do
// polígono do bairro; o índice usado para marcar os lotes de prédios conhecidos; as fontes para "Sobre os dados".
export const VERSAO_DO_MAPA_BASE_GERADO = "2341003b4fca7f7f";
export const INDICE_DO_MAPA_BASE = "indice-municipal/faa40c969275e6b5";
export const ARQUIVO_DA_CIDADE: string = "recife/mapa-base/2341003b4fca7f7f/cidade.json";
export const ARQUIVOS_DO_MAPA_BASE: Record<string, string> = {
  "boa-viagem": "recife/mapa-base/2341003b4fca7f7f/boa-viagem.json",
  "torre": "recife/mapa-base/2341003b4fca7f7f/torre.json",
};
export const CAIXAS_DO_MAPA_BASE: Record<string, readonly [number, number, number, number]> = {
  "boa-viagem": [-34.91795, -8.15533, -34.88266, -8.09875],
  "torre": [-34.9177, -8.04855, -34.90338, -8.03726],
};
export type FonteDoMapaBase = { recurso: string; nome: string; conjunto: string; licenca: string; lastModified: string | null; sha256: string; bytes: number };
export const FONTES_DO_MAPA_BASE: readonly FonteDoMapaBase[] = [
  {
    "recurso": "5c67ce14-1799-40c4-a37c-9daa04d1761c",
    "nome": "Bairros do Recife",
    "conjunto": "Área urbana",
    "licenca": "odc-odbl",
    "lastModified": "2026-03-02T13:48:59.673960",
    "sha256": "2099e5d6a7087596f90f47722c7a89930d7631e7b541db41c1baaee1980ef91a",
    "bytes": 2182385
  },
  {
    "recurso": "a961bf64-f6fe-4b1d-95c5-456bf0d01a31",
    "nome": "Quadras",
    "conjunto": "Área urbana",
    "licenca": "odc-odbl",
    "lastModified": "2026-03-02T13:50:16.834255",
    "sha256": "3cbe3740807c95d9dd75f3d5fe9bcb63d370cbd31035741cab06e12a00a31591",
    "bytes": 42167459
  },
  {
    "recurso": "c41ee0d0-bb33-4380-8809-2e9082d79ab0",
    "nome": "Lotes",
    "conjunto": "Área urbana",
    "licenca": "odc-odbl",
    "lastModified": "2026-03-02T13:50:04.937553",
    "sha256": "6ee9c8cefc24f37d1fe5777bbb5224b0676d5ef74ed1e3bca9f29ad40801b658",
    "bytes": 136947752
  },
  {
    "recurso": "6be90377-7b6d-483c-9b58-f7f34401ee6a",
    "nome": "Trechos de Logradouros",
    "conjunto": "Área urbana",
    "licenca": "odc-odbl",
    "lastModified": "2026-03-02T13:50:14.732363",
    "sha256": "154ebe0adc920bd12ec013e1fe110df94f6d2717764dfec9b7ccfc639e426ace",
    "bytes": 14527751
  },
  {
    "recurso": "dc655db0-6b58-4334-8d72-1ef666de4b86",
    "nome": "Recursos Hídricos",
    "conjunto": "Área urbana",
    "licenca": "odc-odbl",
    "lastModified": "2026-03-02T13:50:40.990267",
    "sha256": "f9f2e5923b8ee8917d29f8bd3720bd5407639559a64b07574e9d2ae0efbc4548",
    "bytes": 24978776
  },
  {
    "recurso": "054f05a9-a113-47e0-a46f-720e4828eaf2",
    "nome": "Parques e Praças",
    "conjunto": "Parques e praças",
    "licenca": "odc-odbl",
    "lastModified": "2026-03-04T12:27:09.939316",
    "sha256": "4029e3cb7dacee68c97f5bd3fbe534e9f71c3a44d0685a4c069074654b7f4abe",
    "bytes": 1106878
  }
];
