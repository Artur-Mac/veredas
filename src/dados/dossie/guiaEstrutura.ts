// Guia de observação visual para edifícios que reúnem os 3 sinais cadastrais de tipologia baixa anterior a 2005.
// Nunca emite diagnóstico estrutural nem laudo: explica em linguagem simples o que significam os 3 sinais do cadastro
// e quais pontos visuais observar ou perguntar durante a visita.
import type { Edificio, VisaoDoDossie } from "../contratos";

export type PontoVisualEstrutura = {
  id: "trincas-aberturas" | "umidade-base" | "paredes-reformas";
  ondeOlhar: string;
  oQueObservar: string;
};

export type GuiaVisualDeEstrutura = {
  titulo: string;
  explicacaoSimples: string;
  sinaisNoCadastro: string;
  pontosDaVisita: readonly PontoVisualEstrutura[];
  contextoDefesaCivil: string | null;
  avisoDeEscopo: string;
};

function normalizarSemAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

/** Verifica exatamente os mesmos 3 sinais cadastrais auditáveis exigidos pelo dossiê (`ach-estrutura`). */
export function temTresSinaisCadastrais(e: Pick<Edificio, "ate4Pavimentos" | "pavimentos" | "anoConstrucao" | "padrao"> | null): boolean {
  if (!e) return false;
  const ate4 = (e.pavimentos !== null && e.pavimentos <= 4) || (e.pavimentos === null && e.ate4Pavimentos === true);
  const antesDe2005 = e.anoConstrucao !== null && e.anoConstrucao < 2005;
  const padrao = e.padrao !== null ? normalizarSemAcento(e.padrao) : "";
  const simplesOuMedio = padrao === "simples" || padrao === "medio";
  return ate4 && antesDe2005 && simplesOuMedio;
}

const PONTOS_VISUAIS: readonly PontoVisualEstrutura[] = [
  {
    id: "trincas-aberturas",
    ondeOlhar: "Cantos de janelas e portas",
    oQueObservar: "Observe se há rachaduras inclinadas na diagonal (cerca de 45°) partindo dos cantos das esquadrias ou degraus que parecem descolados da parede.",
  },
  {
    id: "umidade-base",
    ondeOlhar: "Base do térreo e áreas externas",
    oQueObservar: "Olhe o rodapé externo do prédio, pilotis e caixas de inspeção: manchas contínuas de umidade subindo pela parede ou reboco estufado merecem pergunta ao condomínio.",
  },
  {
    id: "paredes-reformas",
    ondeOlhar: "Reformas internas e vistoria",
    oQueObservar: "Pergunte ao proprietário ou síndico se alguma parede interna foi removida para integrar sala ou cozinha e se o condomínio possui laudo de engenharia recente.",
  },
];

/** Deriva o guia em linguagem acessível somente quando os 3 sinais cadastrais coexistem no edifício confirmado. */
export function derivarGuiaDeEstrutura(e: Edificio | null, visao?: Pick<VisaoDoDossie, "rua"> | null): GuiaVisualDeEstrutura | null {
  if (!temTresSinaisCadastrais(e) || !e) return null;

  const pavTexto = e.pavimentos !== null ? `${e.pavimentos} pavimentos` : "até 4 pavimentos";
  const anoTexto = e.anoConstrucao !== null ? `construído em ${e.anoConstrucao}` : "anterior a 2005";
  const padraoTexto = e.padrao ? `padrão ${e.padrao}` : "padrão simples ou médio";

  const dc = visao?.rua?.defesaCivil ?? null;
  let contextoDefesaCivil: string | null = null;
  if (dc && dc.atendimentos > 0) {
    if (dc.resposta === "neste_predio") {
      contextoDefesaCivil = `Você confirmou que houve atendimento da Defesa Civil neste endereço (${dc.anos}). Peça cópia do parecer da vistoria antes de fechar negócio.`;
    } else if (dc.resposta === null) {
      contextoDefesaCivil = `Na mesma rua constam ${dc.atendimentos} ${dc.atendimentos === 1 ? "registro" : "registros"} da Defesa Civil (${dc.anos}), sem número publicado — vale perguntar ao síndico se algum foi neste edifício.`;
    }
  }

  return {
    titulo: "Como observar a estrutura na visita",
    explicacaoSimples:
      "Na Região Metropolitana do Recife, parte dos prédios baixos construídos antes de 2005 usa alvenaria autoportante — sistema em que as próprias paredes sustentam o peso dos andares, sem pilares e vigas independentes. O cadastro municipal não informa o método construtivo deste edifício.",
    sinaisNoCadastro: `Sinais combinados no IPTU/Lotes: ${pavTexto} · ${anoTexto} · ${padraoTexto}.`,
    pontosDaVisita: PONTOS_VISUAIS,
    contextoDefesaCivil,
    avisoDeEscopo: "Orientação para observação leiga em visita; não substitui vistoria de engenheiro ou arquiteto habilitado.",
  };
}
