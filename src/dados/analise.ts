import { z } from "zod";

const valor = z.number().finite().min(0).max(1e10).nullable();
export const esquemaAnalise = z.object({
  id: z.string(),
  nome: z.string().trim().min(1).max(120),
  bairro: z.string().max(120),
  url: z.string(),
  tipo: z.enum(["aluguel", "compra"]),
  preco: valor,
  condominio: valor,
  iptuAnual: valor,
  outros: valor,
  area: z.number().positive().max(100000).nullable(),
  dsqfl: z.string().nullable().optional(),
  quartos: z.number().int().min(0).max(100).nullable().optional(),
  logradouro: z.string().nullable().optional(),
  alertas: z.array(z.string()).optional(),
  notas: z.string().max(4000),
  verificadas: z.array(z.string()),
  atualizadoEm: z.string(),
});
export type Analise = z.infer<typeof esquemaAnalise>;

/** Vazio é desconhecido; zero é um valor explicitamente informado. */
export function numeroDigitado(texto: string): number | null {
  const limpo = texto.trim().replace(/^R\$\s*/, "");
  if (!limpo) return null;
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(limpo)) return NaN;
  const numero = Number(limpo.replace(/\./g, "").replace(",", "."));
  return numero <= 1e10 ? numero : NaN;
}

export function urlValida(texto: string): boolean {
  try {
    const url = new URL(texto);
    return ["https:", "http:"].includes(url.protocol) && url.hostname.includes(".") && !url.username && !url.password;
  } catch { return false; }
}

export function custos(a: Analise) {
  const parcelas = [
    ...(a.tipo === "aluguel" ? [{ nome: "Aluguel", valor: a.preco }] : []),
    { nome: "Condomínio", valor: a.condominio },
    { nome: "IPTU mensalizado", valor: a.iptuAnual === null ? null : a.iptuAnual / 12 },
    { nome: "Outros custos mensais", valor: a.outros },
  ];
  const conhecidas = parcelas.filter((p) => p.valor !== null);
  return { parcelas, subtotal: conhecidas.length ? conhecidas.reduce((s, p) => s + p.valor!, 0) : null,
    pendentes: parcelas.filter((p) => p.valor === null).length };
}

export function perguntas(a: Analise) {
  return [
    ...(a.preco === null ? [{ id: "preco", texto: `Qual é o valor de ${a.tipo === "compra" ? "venda" : "aluguel"}?` }] : []),
    ...(a.condominio === null ? [{ id: "condominio", texto: "Qual é o condomínio e há cobranças extraordinárias?" }] : []),
    ...(a.iptuAnual === null ? [{ id: "iptu", texto: "Qual é o IPTU anual desta unidade?" }] : []),
    ...(a.outros === null ? [{ id: "outros", texto: "Há seguro, taxas ou outros custos mensais?" }] : []),
    { id: "agua", texto: "Conferir pressão da água e sinais de umidade." },
    { id: "ruido", texto: "Ouvir o ruído com janelas abertas e fechadas." },
    { id: "sol", texto: "Confirmar em que horário o sol entra nos cômodos." },
    { id: "obras", texto: "Perguntar sobre obras no prédio e nos lotes vizinhos." },
  ];
}

export function mensagemDaAnalise(a: Analise) {
  const abertas = perguntas(a).filter((p) => !a.verificadas.includes(p.id));
  return `Olá! Tenho interesse em ${a.nome}.\n${abertas.length ? "Gostaria de esclarecer estes pontos antes da visita:\n" + abertas.map((p, i) => `${i + 1}. ${p.texto}`).join("\n") : "Podemos combinar uma visita?"}\nObrigado!`;
}
