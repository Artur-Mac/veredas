// Pacote para especialista (advogado ou vistoriador), 15/11/2026: um documento limpo, para imprimir ou baixar (.md e
// .html), com a ficha do prédio, as contradições entre anúncio e cadastro, a linha do tempo estrutural, os trechos de
// ata guardados, o roteiro da visita (com o que foi conferido e respondido) e as perguntas jurídicas e técnicas em aberto.
// Fica de fora, de propósito: o perfil da casa (acessibilidade, orçamento), fotos e o caderno pessoal (diário).
import type { AnaliseV2, Pergunta, VisaoDoDossie } from "./contratos";
import { estruturaDoCaderno, type ItemDaFicha } from "./dossie/fichaViva";
import { ROTULO_DA_ETAPA } from "./estrutura/linhaDoTempo";
import { trechosDaAta } from "./negociacao";

export type SecaoDoPacote = { titulo: string; linhas: string[] };
export type Pacote = { titulo: string; geradoEm: string; secoes: SecaoDoPacote[] };

const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

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
