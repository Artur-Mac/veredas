import type { Edificio, MetaDoIndice } from "../contratos";
import { formatarData, formatarNumero } from "../formatos";

export type ItemBoletimPreContrato = {
  numero: string;
  titulo: string;
  resumo: string;
};

export type BoletimPreContrato = {
  edicao: string;
  titulo: string;
  subtitulo: string;
  itens: readonly ItemBoletimPreContrato[];
};

const diaBr = (iso: string): string => formatarData(iso.slice(0, 10));

/**
 * Boletim numerado do pré-contrato (DataZap R27 adaptado sem preço / valuation):
 * organiza fatos agregados diretamente do meta.json publicado (e amostra opcional
 * de edifícios já carregada) para leitura rápida antes de assinar sinal ou escritura.
 */
export function montarBoletimPreContrato(params: {
  meta: MetaDoIndice;
  bairrosCobertos: number;
  edificiosAmostra?: readonly Edificio[];
}): BoletimPreContrato {
  const { meta, bairrosCobertos, edificiosAmostra } = params;
  const totalFontes = meta.fontes.length + (meta.fontesDaRua?.length ?? 0);
  const totalRegistros = meta.fontes.reduce((soma, f) => soma + f.registrosLidos, 0);
  const licencasFonte = meta.fontes.find((f) => f.chave === "licenciamento");
  const itbiFonte = meta.fontes.find((f) => f.chave === "itbi");

  const amostra = edificiosAmostra ?? [];
  const temAmostra = amostra.length > 0;
  const pre2013 = amostra.filter((e) => e.anoConstrucao !== null && e.anoConstrucao < 2013).length;
  const comObra24m = amostra.filter((e) => e.obras150m.relevantes24m > 0).length;

  const itens: ItemBoletimPreContrato[] = [
    {
      numero: "Boletim #01",
      titulo: `Rede cadastral em ${bairrosCobertos} bairros do Recife`,
      resumo: `${totalFontes} bases abertas integradas (${formatarNumero(totalRegistros)} registros oficiais lidos até ${diaBr(meta.geradoEm)}).`,
    },
    {
      numero: "Boletim #02",
      titulo: "Licenciamento de obras e marco acústico de 2013",
      resumo: temAmostra
        ? `Na amostra analisada: ${pre2013} de ${amostra.length} prédios anteriores a 2013 (projeto antes da norma de desempenho) e ${comObra24m} com obra licenciada a 150 m em 24 meses.`
        : `${licencasFonte ? `${formatarNumero(licencasFonte.registrosLidos)} processos oficiais de obra` : "Alvarás de construção, ampliação e demolição"} cruzados em raio de 150 m e cone visual.`,
    },
    {
      numero: "Boletim #03",
      titulo: "Base legal SPU (terreno) e janela do ITBI",
      resumo: `Foro (0,6%), ocupação (2%) e laudêmio (5%) incidem somente sobre o domínio pleno do terreno × fração ideal (DL 2.398/1987); ${itbiFonte ? `${formatarNumero(itbiFonte.registrosLidos)} transmissões lidas` : "ITBI municipal"} com checagem de alíquota reduzida SFH em até 180 dias.`,
    },
    {
      numero: "Boletim #04",
      titulo: "Identificação dupla e zero avaliação de preço",
      resumo: "Cada imóvel separa o cadastro fiscal de 14 dígitos da Prefeitura da matrícula cartorária de 16 dígitos (CNM), comparando exclusivamente fatos publicados sem sugerir preço de mercado.",
    },
  ];

  return {
    edicao: "Edição 1 · Pré-contrato",
    titulo: "Radar do pré-contrato (Recife)",
    subtitulo: "Boletim factual sem preço anunciado nem nota subjetiva",
    itens,
  };
}
