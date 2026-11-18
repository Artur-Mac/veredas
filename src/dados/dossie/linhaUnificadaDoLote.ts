import type { Edificio, ObrasProximas, VisaoDaRua } from "../contratos";

export type EventoLinhaUnificada = {
  ordemAno: number;
  etiquetaData: string;
  categoria: "predio" | "itbi" | "obra" | "rua";
  titulo: string;
  detalhe: string;
};

export type ResultadoLinhaUnificadaDoLote = {
  manchete: string;
  eventos: EventoLinhaUnificada[];
  acoesConcretas: string[];
};

export function construirLinhaUnificadaDoLote(params: {
  edificio: Edificio | null;
  obrasProximas: ObrasProximas | null;
  visaoRua: VisaoDaRua | null;
  spuAtivo: boolean;
}): ResultadoLinhaUnificadaDoLote {
  const { edificio, obrasProximas, visaoRua, spuAtivo } = params;
  const anoAtual = new Date().getFullYear();
  const eventos: EventoLinhaUnificada[] = [];

  if (edificio?.anoConstrucao) {
    const idade = Math.max(0, anoAtual - edificio.anoConstrucao);
    eventos.push({
      ordemAno: edificio.anoConstrucao,
      etiquetaData: String(edificio.anoConstrucao),
      categoria: "predio",
      titulo: `Edifício entregue (${idade} anos de idade)`,
      detalhe: `Referência simples de manutenção: primeira janela de fachada aos ${edificio.anoConstrucao + 15} (+15a) e prumadas aos ${edificio.anoConstrucao + 25} (+25a).`,
    });
  }

  if (edificio?.itbi && edificio.itbi.porAno.length > 0) {
    const recentesItbi = [...edificio.itbi.porAno]
      .sort((a, b) => b[0] - a[0])
      .slice(0, 3);
    for (const [ano, qtd] of recentesItbi) {
      eventos.push({
        ordemAno: ano,
        etiquetaData: String(ano),
        categoria: "itbi",
        titulo: `${qtd} ${qtd === 1 ? "transmissão fiscal registrada" : "transmissões fiscais registradas"} neste edifício`,
        detalhe: "Movimentação oficial usada na apuração fiscal do município (não é valor de anúncio).",
      });
    }
  }

  if (obrasProximas && obrasProximas.recentes.length > 0) {
    for (const o of obrasProximas.recentes.slice(0, 5)) {
      const anoObra = Number.parseInt(o.data.slice(0, 4), 10) || anoAtual;
      const tipoTxt =
        o.categoria === "demolicao"
          ? "Demolição licenciada"
          : o.categoria === "acrescimo"
            ? "Ampliação licenciada"
            : "Obra nova licenciada";
      eventos.push({
        ordemAno: anoObra + 0.5,
        etiquetaData: o.data,
        categoria: "obra",
        titulo: `${tipoTxt} a ~${Math.round(o.distanciaM)} m`,
        detalhe: o.situacao
          ? `${o.descricao} (${o.situacao})`
          : o.descricao,
      });
    }
  }

  if (visaoRua?.defesaCivil) {
    const ultimoAno =
      Number.parseInt(
        visaoRua.defesaCivil.anos.match(/\d{4}/g)?.slice(-1)[0] ?? String(anoAtual - 1),
        10,
      ) || anoAtual - 1;
    eventos.push({
      ordemAno: ultimoAno + 0.2,
      etiquetaData: visaoRua.defesaCivil.anos,
      categoria: "rua",
      titulo: `${visaoRua.defesaCivil.atendimentos} chamado(s) da Defesa Civil na via`,
      detalhe: `Base mascarada para ${visaoRua.defesaCivil.rua}: confirmar na visita se ocorreu neste lote ou em outro número da mesma rua.`,
    });
  }

  eventos.sort((a, b) => b.ordemAno - a.ordemAno);

  // R45: Bloco "O que fazer com isso" — 2 a 3 ações concretas objetivas
  const acoesConcretas: string[] = [];
  if (!edificio) {
    acoesConcretas.push(
      "Vincule o edifício no cadastro do Recife para puxar ano exato, transmissões oficiais e alvarás a 150 m.",
    );
  } else {
    const idade = edificio.anoConstrucao ? anoAtual - edificio.anoConstrucao : null;
    if (idade !== null && idade >= 14) {
      acoesConcretas.push(
        `Com ${idade} anos de entrega, peça as últimas atas para checar se fachada e prumadas já passaram por revisão e qual o saldo em caixa.`,
      );
    } else if (edificio.anoConstrucao) {
      acoesConcretas.push(
        "Conferir o manual de garantias construtivas da entrega e atas recentes sobre eventuais vícios iniciais.",
      );
    }
    if (obrasProximas && obrasProximas.relevantes24m > 0) {
      acoesConcretas.push(
        `Observar na visita os canteiros num raio de 150 m para confirmar impacto de barulho diurno e insolação futura.`,
      );
    }
    if (spuAtivo) {
      acoesConcretas.push(
        "Solicitar certidão do regime do terreno da União (ocupação ou aforamento) antes de aprovar financiamento bancário.",
      );
    }
  }

  if (acoesConcretas.length === 0) {
    acoesConcretas.push(
      "Levar a lista de pendências documentais e o script fechado de 3 perguntas antes de assinar sinal.",
    );
  }

  const manchete =
    eventos.length > 0
      ? `Linha unificada com ${eventos.length} marco(s) oficiais do prédio e da quadra`
      : "Confirme o prédio para montar a linha do tempo unificada de entregas, licenças e registros";

  return {
    manchete,
    eventos,
    acoesConcretas: acoesConcretas.slice(0, 3),
  };
}
