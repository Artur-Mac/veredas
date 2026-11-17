// Diagnóstico da leitura da página (só em desenvolvimento): o que a última coleta trouxe e o que rendeu, para a pessoa
// copiar e mandar quando a página abre mas os dados não chegam. Nada de contato: o texto passa por `semDadosPessoais`,
// e só entram as linhas com valor, área ou rótulo de custo.
import type { LeituraParcial } from "../../dados/contratos";
import type { ColetaDaPagina } from "../../dados/extrator/pagina";
import { semDadosPessoais } from "../../dados/extrator/privacidade";

const LINHA_UTIL = /R\$|m²|m2\b|condom|iptu|aluguel|venda|quarto|endere|rua |avenida/i;

function semQuery(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return url.slice(0, 120);
  }
}

function chavesDoTopo(texto: string): string {
  try {
    const obj: unknown = JSON.parse(texto);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) return Object.keys(obj).slice(0, 12).join(", ");
    return Array.isArray(obj) ? `lista de ${obj.length}` : typeof obj;
  } catch {
    return "não é JSON";
  }
}

function tiposDoLd(texto: string): string {
  const tipos = texto.match(/"@type"\s*:\s*"([^"]+)"/g) ?? [];
  return tipos.map((t) => t.replace(/.*"([^"]+)"$/, "$1")).slice(0, 6).join(", ") || "sem @type";
}

export function resumoDaColeta(
  coleta: ColetaDaPagina,
  leituras: LeituraParcial[],
  extras: { numero: number; doAnuncio: boolean; bloqueio: boolean },
): string {
  const linhasDoTexto = coleta.texto.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const uteis = linhasDoTexto.filter((l) => LINHA_UTIL.test(l)).slice(0, 15).map((l) => `  · ${semDadosPessoais(l).slice(0, 90)}`);
  const porMetodo = leituras.map((l) => {
    const preenchidos = Object.entries(l.campos)
      .filter(([, v]) => v !== null && (!Array.isArray(v) || v.length > 0))
      .map(([k]) => k);
    return `  · ${l.metodo}: ${preenchidos.join(", ") || "nada"} (preço ${l.campos.preco ?? "—"}, área ${l.campos.area ?? "—"})`;
  });
  return [
    `Leitura nº ${extras.numero} · ${semQuery(coleta.url)}`,
    `Título: ${semDadosPessoais(coleta.titulo).slice(0, 90)}`,
    `É a página do anúncio: ${extras.doAnuncio ? "sim" : "não"} · verificação: ${coleta.verificacao ? "sim" : "não"} · bloqueio: ${extras.bloqueio ? "sim" : "não"}`,
    `JSON-LD: ${coleta.ld.length}${coleta.ld.length ? ` (${coleta.ld.map(tiposDoLd).join(" | ")})` : ""}`,
    `Estados: ${coleta.estados.length}${coleta.estados.map((e, i) => `\n  · ${i + 1}: ${(e.length / 1024).toFixed(0)} KB, chaves: ${chavesDoTopo(e)}`).join("")}`,
    `Texto: ${coleta.texto.length} caracteres, ${linhasDoTexto.length} linhas; linhas úteis:`,
    ...(uteis.length ? uteis : ["  · nenhuma"]),
    "Rendeu:",
    ...(porMetodo.length ? porMetodo : ["  · nenhuma leitura"]),
  ].join("\n");
}
