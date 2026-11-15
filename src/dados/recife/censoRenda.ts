import { z } from "zod";

const tuplaRenda = z.tuple([
  z.number().int().min(0).nullable(), // V06001: responsáveis (N domicílios)
  z.number().int().min(0).nullable(), // V06002: moradores
  z.number().int().min(0).nullable(), // V06004: média mensal (R$)
  z.number().int().min(0).nullable(), // V06006: mediana mensal (R$)
]);

const esquemaCensoRenda = z.strictObject({
  versao: z.literal(1),
  municipio: z.literal("2611606"),
  referencia: z.literal("Censo Demográfico 2022"),
  modificadoEm: z.string(),
  consultadoEm: z.string(),
  fonte: z.string().url(),
  fonteBairros: z.string().url(),
  dicionario: z.string().url(),
  licenca: z.literal("Citar o IBGE"),
  sha256SetoresZip: z.string().length(64),
  sha256BairrosZip: z.string().length(64),
  colunasUsadas: z.array(z.string()),
  setoresLidos: z.number().int().positive(),
  setoresComSigilo: z.number().int().min(0),
  setores: z.record(z.string().regex(/^\d{15}$/), tuplaRenda),
  bairros: z.record(z.string(), tuplaRenda),
});

export type BaseCensoRenda = z.infer<typeof esquemaCensoRenda>;

export type RetratoRendaCenso = {
  recorte: "setor" | "bairro";
  codigoSetor: string | null;
  domiciliosResponsaveis: number | null;
  moradores: number | null;
  mediaMoradoresPorDomicilio: number | null;
  rendaMedianaReais: number | null;
  rendaMediaReais: number | null;
  sigiloEstatistico: boolean;
  referencia: string;
  modificadoEm: string;
  consultadoEm: string;
  urlFonte: string;
};

let cache: BaseCensoRenda | null = null;

export function validarCensoRenda(dados: unknown): BaseCensoRenda {
  return esquemaCensoRenda.parse(dados);
}

export function baseDeCensoRenda(): BaseCensoRenda {
  if (!cache) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cache = validarCensoRenda(require("./censo-renda-setores.json") as unknown);
  }
  return cache;
}

function decodificarTupla(
  tupla: z.infer<typeof tuplaRenda>,
  recorte: "setor" | "bairro",
  codigoSetor: string | null,
  base: BaseCensoRenda,
): RetratoRendaCenso {
  const [domicilios, moradores, media, mediana] = tupla;
  const mediaMoradores =
    domicilios !== null && domicilios > 0 && moradores !== null
      ? Number((moradores / domicilios).toFixed(1))
      : null;
  return {
    recorte,
    codigoSetor,
    domiciliosResponsaveis: domicilios,
    moradores,
    mediaMoradoresPorDomicilio: mediaMoradores,
    rendaMedianaReais: mediana,
    rendaMediaReais: media,
    sigiloEstatistico: mediana === null || media === null,
    referencia: base.referencia,
    modificadoEm: base.modificadoEm,
    consultadoEm: base.consultadoEm,
    urlFonte: recorte === "setor" ? base.fonte : base.fonteBairros,
  };
}

export function lerRendaDoSetorOuBairro(
  codigoSetor: string | null | undefined,
  slugBairro: string | null | undefined,
): RetratoRendaCenso | null {
  const base = baseDeCensoRenda();
  if (codigoSetor && base.setores[codigoSetor]) {
    return decodificarTupla(base.setores[codigoSetor], "setor", codigoSetor, base);
  }
  if (slugBairro && base.bairros[slugBairro]) {
    return decodificarTupla(base.bairros[slugBairro], "bairro", null, base);
  }
  return null;
}
