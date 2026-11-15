// Preparar a negociação (VE10): reúne só fatos que o dossiê já tem — total mensal conhecido (custoMensal), valores
// faltando, achados do cadastro (IPTU, área, avaliação fiscal), mudanças de preço que você registrou e a sua própria
// amostra de imóveis salvos — e monta uma mensagem editável. Não sugere valor de proposta, não usa faixa de mercado (não
// há base de anúncios permitida com unidades distintas suficientes) e não trata valor fiscal (ITBI) como preço de mercado.
// Mesmo prédio não é a mesma unidade: candidatos a "mesmo imóvel" exigem prédio confirmado igual, mesma área (±2%) e
// mesmos quartos (e andar, quando os dois informam); ficam fora da amostra e são mostrados para você conferir.
import { comparaveisPessoais } from "./comparaveisPessoais";
import type { AnaliseV2, VisaoDoDossie } from "./contratos";
import { custoMensal } from "./custos";
import { formatarReais } from "./formatos";

/** `peso` 0: só entra na mensagem (pergunta sobre valor que falta; o total já diz o que falta). */
export type Argumento = { id: string; fato: string; pergunta: string | null; peso: number };
export type CandidatoMesmoImovel = { id: string; nome: string; motivo: string };
export type Negociacao = {
  aluguel: boolean;
  total: { valor: number | null; texto: string; faltando: string[] };
  argumentos: Argumento[];
  mesmoImovel: CandidatoMesmoImovel[];
};

const valorConhecido = (d: { valor: number | null; aConfirmar: boolean }) => (d.aConfirmar ? null : d.valor);
/** "Condomínio, IPTU" → "condomínio, IPTU" no meio da frase. */
const emFrase = (nomes: string[]) => nomes.map((n) => (n === "IPTU" ? n : n.charAt(0).toLowerCase() + n.slice(1))).join(", ");

/** Candidatos a "o mesmo imóvel" entre as suas análises (para não contar duas vezes nem negociar às cegas). */
export function candidatosMesmoImovel(a: AnaliseV2, lista: readonly AnaliseV2[]): CandidatoMesmoImovel[] {
  if (a.vinculo.estado !== "confirmado") return [];
  const predio = a.vinculo.edificioId;
  const area = valorConhecido(a.declarados.area), quartos = valorConhecido(a.declarados.quartos), andar = valorConhecido(a.declarados.andar);
  if (area === null || quartos === null) return [];
  return lista.filter((b) => b.id !== a.id && !b.descarte && b.modalidade === a.modalidade && b.vinculo.estado === "confirmado" && b.vinculo.edificioId === predio).flatMap((b) => {
    const ab = valorConhecido(b.declarados.area), qb = valorConhecido(b.declarados.quartos), nb = valorConhecido(b.declarados.andar);
    if (ab === null || qb === null || qb !== quartos || Math.abs(ab - area) / area > 0.02) return [];
    if (andar !== null && nb !== null && andar !== nb) return [];
    const partes = [`mesmo prédio`, `${String(ab).replace(".", ",")} m²`, `${qb} ${qb === 1 ? "quarto" : "quartos"}`, ...(andar !== null && nb !== null ? [`${nb}º andar`] : [])];
    return [{ id: b.id, nome: b.nome, motivo: `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}${andar === null || nb === null ? "; andar não informado em um dos dois" : ""}` }];
  });
}

/** "3.000 · anúncio" → 3000; "Não informado · …" → null. Formato de historicoDoAnuncio. */
export function valorDoHistorico(t: string): number | null {
  const n = t.split(" · ")[0]!.trim();
  if (/^n[ãa]o informado$/i.test(n)) return null;
  const v = Number(n.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

function dataBr(iso: string) { return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`; }

export function prepararNegociacao(a: AnaliseV2, visao: Pick<VisaoDoDossie, "achados" | "perguntas">, lista: readonly AnaliseV2[]): Negociacao {
  const aluguel = a.modalidade === "aluguel";
  const custo = custoMensal(a);
  const faltando = custo.parcelas.filter((p) => p.estado !== "conhecido").map((p) => p.nome);
  const total = {
    valor: custo.totalMensalConhecido,
    faltando,
    texto: custo.totalMensalConhecido === null ? "Ainda não há valor mensal conhecido." :
      `Total mensal conhecido: ${formatarReais(custo.totalMensalConhecido)}${faltando.length ? ` (faltam ${emFrase(faltando)})` : ""}.`,
  };
  const args: Argumento[] = [];
  const perguntaPorId = new Map(visao.perguntas.map((p) => [p.id, p]));
  // 1. Achados do cadastro que pesam no preço (IPTU, área, avaliação fiscal, anomalias de valor).
  for (const ach of [visao.achados.principal, ...visao.achados.apoio]) {
    if (!ach || !["iptu", "area", "itbi", "anomalia"].includes(ach.tipo)) continue;
    const p = ach.perguntaId ? perguntaPorId.get(ach.perguntaId) : undefined;
    args.push({ id: `achado:${ach.id}`, fato: ach.texto, pergunta: p?.textoParaMensagem ?? null, peso: ach.tipo === "itbi" ? 2 : 3 });
  }
  // 2. Valores que faltam para fechar o total.
  for (const p of visao.perguntas) {
    if (p.origem !== "lacuna" || p.prioridade !== "custo" || args.some((x) => x.pergunta === p.textoParaMensagem)) continue;
    args.push({ id: `lacuna:${p.id}`, fato: `${p.titulo} ${p.pista}`.trim(), pergunta: p.textoParaMensagem, peso: 0 });
  }
  // 3. Mudanças de preço que você registrou (só as do preço anunciado).
  const hist = (a.caderno?.historicoDoAnuncio ?? []).flatMap((h) => h.alteracoes.filter((x) => x.campo === "Preço anunciado").map((x) => ({ em: h.em, antes: valorDoHistorico(x.antes), depois: valorDoHistorico(x.depois) })))
    .filter((h) => h.antes !== null && h.depois !== null && h.antes !== h.depois);
  if (hist.length) {
    const prim = hist[0]!, ult = hist.at(-1)!;
    const fato = hist.length === 1
      ? `O preço anunciado passou de ${formatarReais(prim.antes!)} para ${formatarReais(ult.depois!)} em ${dataBr(ult.em)} (registro seu).`
      : `O preço anunciado mudou ${hist.length} vezes desde ${dataBr(prim.em)}: de ${formatarReais(prim.antes!)} para ${formatarReais(ult.depois!)} (registros seus).`;
    args.push({ id: "historico:preco", fato, pergunta: null, peso: ult.depois! < prim.antes! ? 3 : 1 });
  }
  // 4. Sua amostra: imóveis salvos da mesma modalidade, tipologia e bairro, unidades distintas, com área e valor conhecidos.
  const mesmo = candidatosMesmoImovel(a, lista);
  const fora = new Set(mesmo.map((m) => m.id));
  // Mesma base para todos: aluguel (ou preço) anunciado por m². O total mensal não serve aqui porque cada anúncio deixa
  // de fora parcelas diferentes (um total incompleto pareceria mais barato).
  const porM2 = (x: AnaliseV2) => {
    const area = valorConhecido(x.declarados.area), v = valorConhecido(x.declarados.preco);
    return area && v !== null ? v / area : null;
  };
  const meu = porM2(a);
  const outros = comparaveisPessoais(lista, a, { bairro: a.bairroTexto, areaMin: null, areaMax: null }).filter((x) => !fora.has(x.id)).map(porM2).filter((v): v is number => v !== null);
  if (meu !== null && outros.length >= 2) {
    const todos = [...outros, meu].sort((x, y) => y - x);
    const pos = todos.indexOf(meu) + 1;
    const m2 = (v: number) => `${formatarReais(v)}/m²`;
    const coisa = aluguel ? "aluguel anunciado" : "preço anunciado";
    args.push({ id: "amostra:posicao", peso: pos === 1 ? 3 : 1,
      fato: `Entre os ${todos.length} imóveis desse tipo que você salvou em ${a.bairroTexto} com área e valor conhecidos, este tem o ${pos === 1 ? "maior" : pos === todos.length ? "menor" : `${pos}º maior`} ${coisa} por m² (${m2(meu)}; os outros vão de ${m2(Math.min(...outros))} a ${m2(Math.max(...outros))}). É a sua amostra, não um preço de mercado.`,
      pergunta: null });
  }
  return { aluguel, total, argumentos: args.sort((x, y) => y.peso - x.peso), mesmoImovel: mesmo };
}

/** Mensagem editável a partir dos argumentos escolhidos. Sem proposta, ela só pede confirmações. */
export function mensagemDeNegociacao(a: AnaliseV2, n: Negociacao, escolhidos: readonly string[], proposta: number | null): string {
  const args = n.argumentos.filter((x) => escolhidos.includes(x.id));
  const perguntas = [...new Set(args.map((x) => x.pergunta).filter((p): p is string => !!p))];
  const ref = a.logradouro && a.numero ? `na ${a.logradouro}, ${a.numero}` : `"${a.nome}"`;
  const linhas = [`Olá! Tenho interesse no imóvel ${ref}${a.url ? ` (${a.url})` : ""}.`];
  if (perguntas.length) linhas.push("Antes de fazer uma proposta, queria confirmar:", ...perguntas.map((p) => `- ${p}`));
  const historico = args.find((x) => x.id === "historico:preco");
  if (historico) linhas.push(historico.fato.replace(/ \(registros? seus?\)\.$/, "."));
  if (n.total.valor !== null && proposta !== null) linhas.push(`Pelo que levantei, o total mensal conhecido fica em ${formatarReais(n.total.valor)}${n.total.faltando.length ? `, ainda sem ${emFrase(n.total.faltando)}` : ""}.`);
  if (proposta !== null) linhas.push(`Minha proposta é de ${formatarReais(proposta)}${n.aluguel ? " por mês de aluguel" : ""}.`);
  linhas.push("Obrigado!");
  return linhas.join("\n");
}
