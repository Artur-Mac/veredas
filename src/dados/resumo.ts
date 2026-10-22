import type { AnaliseV2 } from "./contratos";
import { custoMensal } from "./custos";
import { formatarReais } from "./formatos";

/** Exportação selecionada: notas, documentos e CNPJ ficam fora por padrão. */
export function resumoCompartilhavel(a: AnaliseV2, incluirNotas = false): string {
  const c = custoMensal(a);
  const linhas = ["VEREDA · Resumo do imóvel", a.nome, a.bairroTexto || "Bairro não informado",
    `${c.principal.rotulo}: ${c.principal.valor === null ? "A confirmar" : formatarReais(c.principal.valor)}`,
    `Mensal conhecido: ${c.totalMensalConhecido === null ? "A confirmar" : formatarReais(c.totalMensalConhecido)}`,
    c.notaForaDaSoma ?? "Parcelas recorrentes informadas.",
    "Origem dos valores: anúncio e/ou informações revisadas por você. Valores estimados de cenários não estão incluídos.",
    `Análise revisada em ${new Date(a.atualizadaEm).toLocaleString("pt-BR")}.`,
  ];
  if (incluirNotas && a.visita.notas.trim()) linhas.push("Notas selecionadas por você:", a.visita.notas.trim());
  linhas.push("Preparado com o VEREDA. Confira fontes, datas e pendências antes de decidir.");
  return linhas.join("\n\n");
}

export function htmlDoResumo(texto: string): string {
  const escapar = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>VEREDA · Resumo selecionado</title><style>
    @page{size:A4;margin:20mm}body{font-family:'PlusJakartaSans',sans-serif;color:#171717;background:white;font-size:12pt;line-height:1.5;overflow-wrap:anywhere}
    h1{font-family:Fraunces,serif;color:#B94E36;font-weight:500;font-size:26pt}p{white-space:pre-wrap;orphans:3;widows:3}
    </style><body><h1>VEREDA</h1>${texto.split("\n\n").map(p => `<p>${escapar(p)}</p>`).join("")}</body></html>`;
}
