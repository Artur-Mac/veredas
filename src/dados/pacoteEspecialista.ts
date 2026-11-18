// Pacote para especialista (advogado ou vistoriador), 15/11/2026: um documento limpo, para imprimir ou baixar (.md e
// .html), com a ficha do prédio, as contradições entre anúncio e cadastro, a linha do tempo estrutural, os trechos de
// ata guardados, o roteiro da visita (com o que foi conferido e respondido) e as perguntas jurídicas e técnicas em aberto.
// Fica de fora, de propósito: o perfil da casa (acessibilidade, orçamento), fotos e o caderno pessoal (diário).
import type { DocumentoPessoal } from "./caderno";
import type { AnaliseV2, Pergunta, VisaoDoDossie } from "./contratos";
import { estruturaDoCaderno, type ItemDaFicha } from "./dossie/fichaViva";
import { ROTULO_DA_ETAPA } from "./estrutura/linhaDoTempo";
import { formatarReais } from "./formatos";
import { regraDaVistoriaPredialPe } from "../municipios/recife/motores/estruturaCondominio";
import { trechosDaAta } from "./negociacao";

export type SecaoDoPacote = { titulo: string; linhas: string[] };
export type Pacote = { titulo: string; geradoEm: string; secoes: SecaoDoPacote[] };

export type EstadoDocDoPacote = "recebido" | "desatualizado" | "faltando";
export type ItemControlePacote = {
  id: string;
  titulo: string;
  estado: EstadoDocDoPacote;
  rotuloEstado: "Recebido" | "Data antiga" | "Faltando";
  detalhe: string;
  referencia: string;
};
export type AuditoriaConjuntoDocumental = {
  itens: readonly ItemControlePacote[];
  totalObrigatorios: number;
  guardados: number;
  recebidosEmDia: number;
  desatualizados: number;
  faltantes: number;
  resumoCurto: string;
};

const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

function diasEntre(ymdInicio: string, ymdFim: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymdInicio) || !/^\d{4}-\d{2}-\d{2}$/.test(ymdFim)) return null;
  const tIni = Date.parse(`${ymdInicio}T12:00:00Z`);
  const tFim = Date.parse(`${ymdFim}T12:00:00Z`);
  if (!Number.isFinite(tIni) || !Number.isFinite(tFim)) return null;
  return Math.floor((tFim - tIni) / 86_400_000);
}

function ultimoDiaDoPeriodo(periodoYm: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(periodoYm);
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${m[1]}-${m[2]}-${String(ultimoDia).padStart(2, "0")}`;
}

type RequisitoDoc = {
  id: string;
  titulo: string;
  tipos: readonly DocumentoPessoal["tipo"][];
  incluirBalancetes?: boolean;
  prefInspecao?: boolean;
  maxDias: number | null;
  /** Vistoria predial (Lei PE 13.032/2006): o prazo e a exigência dependem da idade do prédio; `maxDias` vale sem a idade. */
  prazoPelaIdadeDoPredio?: boolean;
  referencia: string;
};

const DIAS_EM_3_ANOS = 1095;
const DIAS_EM_4_ANOS = 1461;

const REQUISITOS_COMPRA: readonly RequisitoDoc[] = [
  {
    id: "matricula",
    titulo: "Matrícula atualizada do imóvel",
    tipos: ["matricula"],
    maxDias: 30,
    referencia: "Certidão de ônus reais (até 30 dias · Dec. nº 93.240/1986)",
  },
  {
    id: "convencao",
    titulo: "Convenção de condomínio",
    tipos: ["convencao"],
    maxDias: null,
    referencia: "Regras de uso, vagas, animais e locação por temporada",
  },
  {
    id: "ata",
    titulo: "Atas de assembleia (últimos 24 meses)",
    tipos: ["ata"],
    maxDias: 730,
    referencia: "Obras aprovadas, chamadas extras e gestão",
  },
  {
    id: "balancete",
    titulo: "Balancete e saldo do fundo de reserva",
    tipos: ["balancete"],
    incluirBalancetes: true,
    maxDias: 180,
    referencia: "Receitas × despesas e reserva para obras",
  },
  {
    id: "estrutura",
    titulo: "Vistoria / laudo estrutural ou ART-RRT",
    tipos: ["laudo", "art_rrt"],
    prefInspecao: true,
    maxDias: DIAS_EM_4_ANOS,
    prazoPelaIdadeDoPredio: true,
    referencia: "Inspeção periódica (Lei Estadual PE nº 13.032/2006 · a cada 3 ou 4 anos, conforme a idade do prédio)",
  },
  {
    id: "licenca",
    titulo: "Licença / AVCB dos Bombeiros",
    tipos: ["licenca"],
    maxDias: 365,
    referencia: "Regularidade de proteção contra incêndio do edifício",
  },
  {
    id: "trabalhista",
    titulo: "Certidão trabalhista do condomínio (CNDT)",
    tipos: ["cndt", "acoes_trt6"],
    maxDias: 180,
    referencia: "Débitos e ações trabalhistas (CLT, art. 642-A, § 4º · 180 dias)",
  },
];

const REQUISITOS_ALUGUEL: readonly RequisitoDoc[] = [
  {
    id: "convencao",
    titulo: "Convenção / regimento interno",
    tipos: ["convencao"],
    maxDias: null,
    referencia: "Regras de convivência, animais, mudança e garagem",
  },
  {
    id: "balancete",
    titulo: "Balancete recente",
    tipos: ["balancete"],
    incluirBalancetes: true,
    maxDias: 180,
    referencia: "Cota ordinária × fundo de reserva e rateios",
  },
  {
    id: "licenca",
    titulo: "Licença / AVCB dos Bombeiros",
    tipos: ["licenca"],
    maxDias: 365,
    referencia: "Regularidade de proteção contra incêndio do edifício",
  },
  {
    id: "estrutura",
    titulo: "Vistoria / laudo estrutural",
    tipos: ["laudo", "art_rrt"],
    prefInspecao: true,
    maxDias: DIAS_EM_4_ANOS,
    prazoPelaIdadeDoPredio: true,
    referencia: "Registro técnico de manutenção (Lei PE nº 13.032/2006)",
  },
];

/**
 * Controle determinístico de completude e atualidade documental (HomeWiseDocs R15 §6.1–§6.2).
 * Nunca inventa validade quando a data declarada do documento está ausente.
 *
 * Vistoria predial (Lei PE nº 13.032/2006): com o ano de construção, o prazo é de 4 anos em prédio com até 20 anos e de
 * 3 anos depois, e o laudo não é cobrado de prédio com até 5 anos. Sem o ano, o laudo é pedido e só fica "data antiga"
 * depois de 4 anos; entre 3 e 4 anos a linha avisa que o prazo é de 3 anos em prédio com mais de 20.
 */
export function auditarConjuntoDocumental(
  analise: AnaliseV2,
  agoraIso: string,
  opcoes: { anoConstrucao?: number | null } = {},
): AuditoriaConjuntoDocumental {
  const hojeYmd = agoraIso.slice(0, 10);
  const idadeDoPredio =
    typeof opcoes.anoConstrucao === "number" && Number.isFinite(opcoes.anoConstrucao)
      ? Math.max(0, Number(hojeYmd.slice(0, 4)) - opcoes.anoConstrucao)
      : null;
  const vistoria = regraDaVistoriaPredialPe(idadeDoPredio);
  const docs = (analise.caderno?.documentos ?? []).filter((d) => d.vinculo !== "outro_imovel");
  const balancetes = analise.caderno?.balancetes ?? [];
  const requisitos = analise.modalidade === "aluguel" ? REQUISITOS_ALUGUEL : REQUISITOS_COMPRA;

  const itens: ItemControlePacote[] = requisitos.flatMap((req): ItemControlePacote[] => {
    const maxDias = req.prazoPelaIdadeDoPredio && vistoria.intervaloAnos === 3 ? DIAS_EM_3_ANOS : req.maxDias;
    const candidatosDocs = docs.filter((d) => req.tipos.includes(d.tipo));
    const registros = candidatosDocs.map((d) => {
      const ymd = (req.prefInspecao ? d.inspecaoEm ?? d.emitidoEm : d.emitidoEm ?? d.inspecaoEm) ?? null;
      const prefixo = req.prefInspecao && d.inspecaoEm ? "Inspecionado em" : "Emitido em";
      return { ymd, rotuloOrigem: ymd ? `${prefixo} ${dataBr(ymd)}` : "" };
    });

    if (req.incluirBalancetes) {
      for (const b of balancetes) {
        const ymd = ultimoDiaDoPeriodo(b.periodo);
        registros.push({
          ymd,
          rotuloOrigem: `Balancete ${b.periodo.slice(5, 7)}/${b.periodo.slice(0, 4)}`,
        });
      }
    }

    if (registros.length === 0) {
      // Prédio com até 5 anos de habite-se ainda não precisa da vistoria: o laudo não entra na lista do que falta.
      if (req.prazoPelaIdadeDoPredio && vistoria.exigida === false) return [];
      return [{
        id: req.id,
        titulo: req.titulo,
        estado: "faltando",
        rotuloEstado: "Faltando",
        detalhe: "Não guardado no caderno ainda",
        referencia: req.referencia,
      }];
    }

    const comData = registros
      .filter((r): r is { ymd: string; rotuloOrigem: string } => typeof r.ymd === "string")
      .sort((a, b) => b.ymd.localeCompare(a.ymd));

    const maisRecente = comData[0];
    if (!maisRecente) {
      return [{
        id: req.id,
        titulo: req.titulo,
        estado: "recebido",
        rotuloEstado: "Recebido",
        detalhe: "Recebido · sem data declarada",
        referencia: req.referencia,
      }];
    }

    const dias = diasEntre(maisRecente.ymd, hojeYmd);
    if (maxDias !== null && dias !== null && dias > maxDias) {
      return [{
        id: req.id,
        titulo: req.titulo,
        estado: "desatualizado",
        rotuloEstado: "Data antiga",
        detalhe: `${maisRecente.rotuloOrigem} · ${dias} dias (referência: até ${maxDias} dias)`,
        referencia: req.referencia,
      }];
    }

    const avisoDoPrazoMenor =
      req.prazoPelaIdadeDoPredio && vistoria.intervaloAnos === null && dias !== null && dias > DIAS_EM_3_ANOS
        ? " · se o prédio tiver mais de 20 anos, o prazo é de 3 anos"
        : "";
    return [{
      id: req.id,
      titulo: req.titulo,
      estado: "recebido",
      rotuloEstado: "Recebido",
      detalhe:
        (dias !== null && dias >= 0
          ? `${maisRecente.rotuloOrigem} (${dias} ${dias === 1 ? "dia" : "dias"})`
          : maisRecente.rotuloOrigem) + avisoDoPrazoMenor,
      referencia: req.referencia,
    }];
  });

  const recebidosEmDia = itens.filter((i) => i.estado === "recebido").length;
  const desatualizados = itens.filter((i) => i.estado === "desatualizado").length;
  const faltantes = itens.filter((i) => i.estado === "faltando").length;
  const guardados = recebidosEmDia + desatualizados;

  let resumoCurto = "Todos os documentos de referência guardados e dentro dos prazos usuais.";
  if (faltantes > 0 || desatualizados > 0) {
    const partes: string[] = [];
    if (faltantes > 0) partes.push(`${faltantes} faltando`);
    if (desatualizados > 0) partes.push(`${desatualizados} com data antiga`);
    resumoCurto = partes.join(" · ");
  }

  return {
    itens,
    totalObrigatorios: itens.length,
    guardados,
    recebidosEmDia,
    desatualizados,
    faltantes,
    resumoCurto,
  };
}

/** Gera texto objetivo para solicitar ao corretor, vendedor ou síndico apenas os itens faltantes ou antigos. */
export function gerarPedidoDocumentosFaltantes(analise: AnaliseV2, auditoria: AuditoriaConjuntoDocumental): string {
  const pendentes = auditoria.itens.filter((i) => i.estado !== "recebido");
  if (pendentes.length === 0) {
    return `Todos os documentos de referência para ${analise.nome} já constam guardados e atualizados no pacote.`;
  }
  const endereco = [analise.logradouro, analise.numero].filter(Boolean).join(", ");
  const linhas = [
    `Olá! Antes de avançar na conferência de ${analise.nome}${endereco ? ` (${endereco})` : ""}, poderia enviar ou atualizar os documentos abaixo?`,
    "",
    ...pendentes.map((item, idx) =>
      item.estado === "desatualizado"
        ? `${idx + 1}) [Atualizar] ${item.titulo} — ${item.detalhe}`
        : `${idx + 1}) [Enviar] ${item.titulo} — ${item.referencia}`,
    ),
    "",
    "Mensagem preparada com o VEREDA (leitura independente; não substitui certidões oficiais).",
  ];
  return linhas.join("\n");
}

/**
 * Roteiro objetivo de 3 perguntas fechadas para o síndico ou administradora (`R23` / Winker R22 §6.2),
 * substituindo pedidos longos que raramente recebem resposta.
 */
export function gerarRoteiroTresPerguntasSindico(
  nomeImovel: string,
  condominioMensalReais: number | null,
): string {
  const q1 =
    condominioMensalReais !== null && condominioMensalReais > 0
      ? `(1) A taxa ordinária mensal vigente desta unidade confere com ${formatarReais(condominioMensalReais)}/mês?`
      : "(1) Qual o valor atual da taxa condominial ordinária mensal desta unidade?";
  return [
    `Bom dia! Sobre ${nomeImovel}, poderia me confirmar três pontos rápidos?`,
    "",
    q1,
    "(2) Qual o saldo atual do fundo de reserva do condomínio?",
    "(3) Há alguma obra ou rateio extra aprovado ou em pauta para os próximos 12 meses?",
    "",
    "Obrigado!",
  ].join("\n");
}

export function montarPacote(x: { analise: AnaliseV2; visao: Pick<VisaoDoDossie, "achados">; ficha: readonly ItemDaFicha[]; perguntas: readonly Pergunta[]; agora: string }): Pacote {
  const { analise: a } = x;
  const secoes: SecaoDoPacote[] = [];
  secoes.push({ titulo: "Imóvel", linhas: [
    a.nome, [a.logradouro, a.numero].filter(Boolean).join(", ") || "Endereço não informado", a.bairroTexto || a.bairro || "Bairro não informado",
    a.url ? `Anúncio: ${a.url}` : "Sem anúncio (Raio-X do prédio)", a.modalidade === "compra" ? "Modalidade: compra" : "Modalidade: aluguel",
    a.vinculo.estado === "confirmado" ? `Vínculo municipal confirmado (${a.vinculo.edificioId})` : "Vínculo municipal do lote pendente de confirmação",
    "Matrícula cartorária (CNM 16 dígitos): solicitar certidão atualizada (30 dias) ao vendedor",
  ] });
  secoes.push({ titulo: "Ficha do edifício", linhas: x.ficha.map((i) => `${i.rotulo}: ${i.valor}${i.leitura ? ` — ${i.leitura}` : ""}${i.atencao ? ` [${i.atencao}]` : ""} (Fonte: ${i.fonte})`) });
  const contradicoes = [x.visao.achados.principal, ...x.visao.achados.apoio].filter((c): c is NonNullable<typeof c> => !!c && ["anomalia", "area", "iptu", "itbi"].includes(c.tipo));
  secoes.push({ titulo: "Anúncio × cadastro municipal", linhas: contradicoes.length ? contradicoes.map((c) => `${c.titulo}: ${c.texto}`) : ["Nenhuma diferença registrada entre o anúncio e o cadastro."] });
  const est = estruturaDoCaderno(a.caderno);
  secoes.push({ titulo: "Linha do tempo da estrutura (documentos guardados)", linhas: [
    est.frase,
    ...est.atos.map((t) => `${t.data ? dataBr(t.data) : "sem data"} · ${ROTULO_DA_ETAPA[t.etapa]} · ${t.documento}${t.numero ? ` · nº ${t.numero}` : ""}${t.orgao ? ` · ${t.orgao}` : ""}`),
    `Falta: ${est.checagemQueFalta}`,
  ] });
  const ata = trechosDaAta(a);
  secoes.push({ titulo: "Trechos de ata, convenção e balancete (literais)", linhas: ata.length ? ata.map((t) => `${t.documento}${t.pagina ? `, p. ${t.pagina}` : ""} · ${t.tema}: “${t.trecho}”`) : ["Nenhum trecho guardado pelo leitor de ata."] });
  secoes.push({ titulo: "Roteiro da visita", linhas: x.perguntas.length ? x.perguntas.map((p) => {
    const conferida = a.visita.verificadas.includes(p.id);
    const resp = a.visita.respostas[p.id];
    return `[${conferida ? "x" : " "}] ${p.titulo}${resp ? ` — resposta anotada: ${resp}` : ""}`;
  }) : ["Sem perguntas no roteiro."] });
  const abertas = [
    ...x.ficha.map((i) => i.pergunta).filter((q): q is string => !!q),
    est.perguntaAoSindico,
    "A matrícula atualizada (30 dias) tem ônus, penhora, usufruto ou indisponibilidade? O terreno é alodial ou de marinha (SPU)?",
    "Há débitos de condomínio e de IPTU em aberto? Certidões negativas do vendedor (cível, trabalhista, fiscal)?",
    "O habite-se e a área averbada batem com a área anunciada?",
  ];
  secoes.push({ titulo: "Perguntas jurídicas e técnicas em aberto", linhas: [...new Set(abertas)] });
  return { titulo: `Pacote para especialista · ${a.nome}`, geradoEm: x.agora, secoes };
}

export function pacoteEmMarkdown(p: Pacote): string {
  return [`# ${p.titulo}`, "", `Gerado pelo VEREDA em ${dataBr(p.geradoEm)} · Modelo v2 · Processado localmente no aparelho (nenhum dado enviado a servidor ou usado para treinar modelos). Fatos com fonte; nenhuma nota ou veredito.`, "",
    ...p.secoes.flatMap((s) => [`## ${s.titulo}`, "", ...s.linhas.map((l) => `- ${l}`), ""])].join("\n");
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function pacoteEmHtml(p: Pacote): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.titulo)}</title>
<style>
:root{--papel:#F2EBDD;--superficie:#FFFFFF;--texto:#171717;--apoio:#57534E;--linha:#E2DACB;--azul:#2E5A85;--ferrugem:#B94E36}
*{box-sizing:border-box}
body{font-family:"Plus Jakarta Sans",system-ui,-apple-system,sans-serif;color:var(--texto);background:var(--papel);margin:0;padding:28px 18px;line-height:1.55;font-size:15px}
.folha{max-width:780px;margin:0 auto;background:var(--superficie);border:1px solid var(--linha);border-radius:14px;overflow:hidden}
.cab{background:var(--papel);padding:26px 28px;border-bottom:1px solid var(--linha)}
.marca{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ferrugem);margin:0 0 8px}
h1{font-family:Fraunces,Georgia,serif;font-weight:500;font-size:26px;line-height:1.2;margin:0 0 8px}
.nota{color:var(--apoio);font-size:13px;margin:0}
.corpo{padding:12px 28px 32px}
section{margin-top:22px;padding-top:16px;border-top:1px solid var(--linha)}
section:first-child{margin-top:8px;border-top:0;padding-top:4px}
h2{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--azul);margin:0 0 10px}
ul{margin:0;padding-left:18px}
li{margin:6px 0}
@media print{body{background:#fff;padding:0}.folha{border:0;border-radius:0;max-width:none}@page{margin:16mm}}
</style></head>
<body><main class="folha">
<header class="cab"><p class="marca">VEREDA · Dossiê Técnico</p><h1>${esc(p.titulo)}</h1><p class="nota">Gerado em ${dataBr(p.geradoEm)} · Modelo v2 · Processado localmente no aparelho (nenhum dado enviado a servidor ou usado para treinar modelos). Apenas fatos com fonte pública ou declarada; nenhuma nota ou veredito.</p></header>
<div class="corpo">${p.secoes.map((s) => `<section><h2>${esc(s.titulo)}</h2><ul>${s.linhas.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></section>`).join("\n")}</div>
</main></body></html>`;
}
