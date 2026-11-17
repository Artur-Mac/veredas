// Nativo: os arquivos de camada vão dentro do aplicativo como assets (expo-asset, extensão .vjson registrada em
// metro.config.js), fora do bundle JS; nada é baixado da rede. A leitura confere o tamanho em bytes com o manifesto.
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import type { ArquivoPublicado } from "../dados/camadasGeradas";
import { ASSETS_DAS_CAMADAS } from "./camadasNativasGeradas";

function erro(caminho: string, motivo: string): Error {
  const e = new Error(`Camada de dados indisponível: ${caminho} (${motivo}).`);
  e.name = "CamadaIndisponivel";
  return e;
}

export async function buscarArquivoDeCamada(caminho: string, d: ArquivoPublicado): Promise<unknown> {
  const modulo = ASSETS_DAS_CAMADAS[caminho];
  if (!modulo) throw erro(caminho, "sem asset empacotado; rode scripts/dados/publicar-camadas.mjs e gere o app de novo");
  const asset = Asset.fromModule(modulo());
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw erro(caminho, "asset ausente no aparelho");
  if (info.size !== d.bytes) throw erro(caminho, `tamanho ${info.size} em vez de ${d.bytes}`);
  const texto = await FileSystem.readAsStringAsync(uri);
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    throw erro(caminho, "JSON inválido");
  }
}

/** No nativo os assets já vêm com o aplicativo. */
export async function aquecerArquivoDeCamada(_caminho: string, _d: ArquivoPublicado): Promise<void> {}

/** No nativo os assets vêm com o aplicativo; não há cache a limpar. */
export async function limparCamadasAntigas(_urlsAtuais: readonly string[]): Promise<void> {}
