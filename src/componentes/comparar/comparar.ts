// Lógica do Comparar (Fatia 5). Pura: recebe duas análises v2 e devolve o que a tela mostra, já formatado.
// Custos só via `custoMensal` (src/dados/custos.ts): nada aqui soma parcelas por conta própria.
// Nenhuma frase compara com adjetivo nem recomenda; a tela mostra fatos lado a lado.
import type { AnaliseV2, Edificio, Modalidade, OrigemDoValor, ParcelaDoCusto } from "../../dados/contratos";
import { custoMensal, quemInforma, ROTULO_MENSAL_CONHECIDO, avisoDeValoresPendentes } from "../../dados/custos";
import { formatarNumero, formatarReais } from "../../dados/formatos";
import { nomeDoBairro } from "../../dados/formulario";
import { enderecoEmCaixaDeTitulo } from "../predio/textos";

export type Topico = "custo" | "espaco" | "entorno";
export type Par<T> = [T, T];

// ——— Quem entra na comparação ——————————————————————————————————————————————————————

/** Análises não descartadas da modalidade, na ordem do caderno. */
export function elegiveis(lista: readonly AnaliseV2[], modalidade: Modalidade): AnaliseV2[] {
  return lista.filter((a) => a.descarte === null && a.modalidade === modalidade);
}

/**
 * Modalidade com que a tela abre: a da primeira análise preferida (vinda de um link), senão a primeira que tem
 * duas análises para comparar (aluguel antes de compra), senão a que tem mais, senão aluguel.
 */
export function modalidadeInicial(lista: readonly AnaliseV2[], preferidas: readonly string[] = []): Modalidade {
  const preferida = preferidas.map((id) => lista.find((a) => a.id === id && a.descarte === null)).find(Boolean);
  if (preferida) return preferida.modalidade;
  const aluguel = elegiveis(lista, "aluguel").length;
  const compra = elegiveis(lista, "compra").length;
  if (aluguel >= 2) return "aluguel";
  if (compra >= 2) return "compra";
  return compra > aluguel ? "compra" : "aluguel";
}

/**
 * Até duas análises para os dois lugares: primeiro as preferidas que ainda valem (existem, não foram descartadas e
 * são da modalidade), depois as mais recentes que faltam. Menos de duas quer dizer que não há o que comparar.
 */
export function escolherPar(lista: readonly AnaliseV2[], modalidade: Modalidade, preferidas: readonly string[] = []): string[] {
  const validas = elegiveis(lista, modalidade);
  const ids: string[] = [];
  for (const id of preferidas) {
    if (ids.length < 2 && !ids.includes(id) && validas.some((a) => a.id === id)) ids.push(id);
  }
  for (const a of validas) {
    if (ids.length < 2 && !ids.includes(a.id)) ids.push(a.id);
  }
  return ids;
}

/** Troca o imóvel de um lugar; se ele já estava no outro, os dois trocam de lugar. */
export function trocarNoSlot(ids: readonly string[], slot: 0 | 1, novoId: string): string[] {
  const proximos = [...ids];
  const outro = slot === 0 ? 1 : 0;
  if (proximos[slot] === novoId) return proximos;
  if (proximos[outro] === novoId) proximos[outro] = proximos[slot] as string;
  proximos[slot] = novoId;
  return proximos;
}

/** Nome da coluna: o bairro, quando os dois são conhecidos e diferentes; senão "Imóvel 1" e "Imóvel 2". */
export function rotulosDasColunas(a: AnaliseV2, b: AnaliseV2): Par<string> {
  const ba = nomeDoBairro(a.bairro, a.bairroTexto);
  const bb = nomeDoBairro(b.bairro, b.bairroTexto);
  if (ba && bb && ba !== bb) return [ba, bb];
  return ["Imóvel 1", "Imóvel 2"];
}

/** "125 m² · 3 quartos" com o que se sabe; vazio quando não se sabe nada. */
export function resumoDoImovel(a: AnaliseV2): string {
  const area = valorConhecido(a.declarados.area);
  const quartos = valorConhecido(a.declarados.quartos);
  const partes: string[] = [];
  if (area !== null) partes.push(`${formatarArea(area)} m²`);
  if (quartos !== null) partes.push(`${quartos} ${quartos === 1 ? "quarto" : "quartos"}`);
  return partes.join(" · ");
}

/** "Casa Forte · 100 m² · 3 quartos": bairro e o que se sabe do espaço; partes desconhecidas saem. */
export function detalheDoImovel(a: AnaliseV2): string {
  return [nomeDoBairro(a.bairro, a.bairroTexto), resumoDoImovel(a)].filter(Boolean).join(" · ");
}

// ——— Formatação ————————————————————————————————————————————————————————————————————

type Declarado = { valor: number | null; origem: OrigemDoValor; aConfirmar: boolean };

/** Valor que entra em conta: o que está marcado "a confirmar" ou não foi lido fica de fora, nunca vira zero. */
function valorConhecido(d: { valor: number | null; aConfirmar: boolean }): number | null {
  return d.aConfirmar ? null : d.valor;
}

export function formatarArea(valor: number): string {
  const texto = formatarNumero(valor, Number.isInteger(valor) ? 0 : 2);
  return texto.replace(/,(\d)0$/, ",$1");
}

export function textoDePendentes(n: number): string {
  if (n === 0) return "Nenhuma parcela a confirmar";
  return n === 1 ? "1 parcela a confirmar" : `${n} parcelas a confirmar`;
}

function barras(valores: Par<number | null>): Par<number | null> {
  const conhecidos = valores.filter((v): v is number => v !== null);
  const maior = Math.max(0, ...conhecidos);
  const escala = (v: number | null) => (v === null ? null : maior > 0 ? v / maior : 0);
  return [escala(valores[0]), escala(valores[1])];
}

function diferencaEntre(valores: Par<number | null>): number | null {
  const [a, b] = valores;
  return a === null || b === null ? null : Math.abs(a - b);
}

// ——— Custo —————————————————————————————————————————————————————————————————————————

export type CelulaDeParcela = { texto: string; detalhe: string | null };

export function celulaDaParcela(p: ParcelaDoCusto | null): CelulaDeParcela {
  if (p === null) return { texto: "—", detalhe: null };
  if (p.estado === "conhecido" && p.valorMensal !== null) return { texto: `${formatarReais(p.valorMensal)}/mês`, detalhe: null };
  if (p.estado === "a_confirmar") return { texto: "A confirmar", detalhe: p.nota };
  return { texto: "A confirmar", detalhe: "Não informado" };
}

export type ColunaDeCusto = {
  /** Aluguel anunciado ou preço anunciado; null quando não foi lido ou está a confirmar. */
  principal: number | null;
  /** Total mensal só das parcelas conhecidas; null quando nenhuma é conhecida. */
  mensalConhecido: number | null;
  /** O que as barras medem: o custo mensal conhecido (aluguel) ou o preço anunciado (compra). */
  valorDaBarra: number | null;
  pendentes: number;
  textoDePendentes: string;
  /** Preço (ou aluguel) por m²; null sem valor ou sem área conhecidos. */
  porM2: number | null;
};

export type LinhaDeParcela = { nome: ParcelaDoCusto["nome"]; celulas: Par<CelulaDeParcela> };

export type ComparacaoDeCusto = {
  referencia: "custo_mensal_conhecido" | "preco_anunciado";
  rotuloDoPrincipal: "Aluguel anunciado" | "Preço anunciado";
  rotuloDoMensal: typeof ROTULO_MENSAL_CONHECIDO;
  colunas: Par<ColunaDeCusto>;
  /** 0 a 1, na mesma escala (o maior valor conhecido ocupa a barra inteira); null sem valor conhecido. */
  barras: Par<number | null>;
  /** Diferença arredondada em reais; null quando uma das duas não tem valor conhecido. */
  diferenca: number | null;
  /** Número em destaque: "R$ 1.190", "R$ 0" ou "A confirmar". */
  destaque: string;
  /** Texto abaixo do destaque: "de diferença no custo mensal conhecido." */
  legenda: string;
  /** A frase inteira, para leitor de tela: "R$ 1.190 de diferença no custo mensal conhecido." */
  frase: string;
  /** Aviso de que a diferença deixa de fora parcelas a confirmar. */
  nota: string | null;
  parcelas: LinhaDeParcela[];
};

const ORDEM_DAS_PARCELAS: ParcelaDoCusto["nome"][] = ["Aluguel", "Condomínio", "IPTU", "Seguro incêndio", "Taxa de serviço", "Outros"];

/** Nota de que a conta de cada coluna deixa de fora parcelas a confirmar (aluguel e compra usam o mesmo texto). */
const NOTA_DAS_PARCELAS_A_CONFIRMAR = "A diferença usa só as parcelas conhecidas; as a confirmar ficam fora.";

/** Quais parcelas ficaram fora da soma da coluna (a confirmar ou desconhecidas), como um texto comparável: nomes em ordem. */
function chaveDasParcelasForaDaSoma(c: ReturnType<typeof custoMensal>): string {
  return c.parcelas
    .filter((p) => p.estado !== "conhecido")
    .map((p) => p.nome)
    .sort()
    .join("|");
}

export function compararCusto(a: AnaliseV2, b: AnaliseV2): ComparacaoDeCusto {
  const aluguel = a.modalidade === "aluguel";
  const custos: Par<ReturnType<typeof custoMensal>> = [custoMensal(a), custoMensal(b)];
  const colunas = custos.map((c): ColunaDeCusto => ({
    principal: c.principal.valor,
    mensalConhecido: c.totalMensalConhecido,
    valorDaBarra: aluguel ? c.totalMensalConhecido : c.principal.valor,
    pendentes: c.pendentes,
    textoDePendentes: [avisoDeValoresPendentes(c), textoDePendentes(c.pendentes)].filter(Boolean).join(" · "),
    porM2: c.principal.porM2,
  })) as Par<ColunaDeCusto>;

  const valores: Par<number | null> = [colunas[0].valorDaBarra, colunas[1].valorDaBarra];
  const bruta = diferencaEntre(valores);
  const diferenca = bruta === null ? null : Math.round(bruta);
  const referencia = aluguel ? "custo_mensal_conhecido" : "preco_anunciado";
  const nomeDaReferencia = aluguel ? "custo mensal conhecido" : "preço anunciado";

  let destaque: string;
  let legenda: string;
  let frase: string;
  if (diferenca === null) {
    destaque = "A confirmar";
    legenda = "Uma das análises ainda não tem valor conhecido para comparar.";
    frase = legenda;
  } else if (diferenca === 0) {
    destaque = formatarReais(0);
    legenda = aluguel ? "Mesmo custo mensal conhecido." : "Mesmo preço anunciado.";
    frase = legenda;
  } else {
    destaque = formatarReais(diferenca);
    legenda = `de diferença no ${nomeDaReferencia}.`;
    frase = `${destaque} ${legenda}`;
  }

  // Aluguel: qualquer parcela a confirmar tira algo da soma que gera a diferença. Compra: a diferença é do preço, mas as
  // despesas mensais ficam lado a lado, e só se comparam quando as duas somas deixam de fora as mesmas parcelas.
  const pendentes = colunas[0].pendentes + colunas[1].pendentes;
  const somasComParcelasDiferentes = chaveDasParcelasForaDaSoma(custos[0]) !== chaveDasParcelasForaDaSoma(custos[1]);
  const nota =
    diferenca !== null && (aluguel ? pendentes > 0 : somasComParcelasDiferentes) ? NOTA_DAS_PARCELAS_A_CONFIRMAR : null;

  const nomes = ORDEM_DAS_PARCELAS.filter((nome) => custos.some((c) => c.parcelas.some((p) => p.nome === nome)));
  const parcelas = nomes.map((nome): LinhaDeParcela => ({
    nome,
    celulas: [
      celulaDaParcela(custos[0].parcelas.find((p) => p.nome === nome) ?? null),
      celulaDaParcela(custos[1].parcelas.find((p) => p.nome === nome) ?? null),
    ],
  }));

  return {
    referencia,
    rotuloDoPrincipal: aluguel ? "Aluguel anunciado" : "Preço anunciado",
    rotuloDoMensal: ROTULO_MENSAL_CONHECIDO,
    colunas,
    barras: barras(valores),
    diferenca,
    destaque,
    legenda,
    frase,
    nota,
    parcelas,
  };
}

// ——— Espaço ————————————————————————————————————————————————————————————————————————

export type MedidaDoEspaco = { texto: string; detalhe: string | null };
export type LinhaDoEspaco = { rotulo: string; medidas: Par<MedidaDoEspaco>; chave?: boolean };

export type ComparacaoDeEspaco = {
  /** Áreas conhecidas para as barras; null quando não foi lida ou está a confirmar. */
  areas: Par<number | null>;
  barras: Par<number | null>;
  diferenca: number | null;
  destaque: string;
  legenda: string;
  frase: string;
  linhas: LinhaDoEspaco[];
};

const A_CONFIRMAR: MedidaDoEspaco = { texto: "A confirmar", detalhe: "Não informado" };

/** Medida declarada: valor conhecido, "A confirmar" (com o que o anúncio diz, se disser) ou "A confirmar / Não informado". */
function medida(d: Declarado, formatar: (v: number) => string): MedidaDoEspaco {
  if (d.valor === null) return A_CONFIRMAR;
  if (d.aConfirmar) return { texto: "A confirmar", detalhe: `${quemInforma(d.origem)} ${formatar(d.valor)}` };
  return { texto: formatar(d.valor), detalhe: null };
}

const comoNumero = (v: number) => formatarNumero(v);
const comoArea = (v: number) => `${formatarArea(v)} m²`;
const comoAndar = (v: number) => (v === 0 ? "Térreo" : `${v}º andar`);

export function compararEspaco(a: AnaliseV2, b: AnaliseV2): ComparacaoDeEspaco {
  const par = <T,>(fazer: (x: AnaliseV2) => T): Par<T> => [fazer(a), fazer(b)];
  const areas = par((x) => valorConhecido(x.declarados.area));
  const diferencaBruta = diferencaEntre(areas);
  const diferenca = diferencaBruta === null ? null : Math.round(diferencaBruta * 100) / 100;

  let destaque: string;
  let legenda: string;
  let frase: string;
  if (diferenca === null) {
    destaque = "A confirmar";
    legenda = "Uma das análises ainda não tem área conhecida para comparar.";
    frase = legenda;
  } else if (diferenca === 0) {
    destaque = comoArea(0);
    legenda = "Mesma área anunciada.";
    frase = legenda;
  } else {
    destaque = comoArea(diferenca);
    legenda = "de diferença na área anunciada.";
    frase = `${destaque} ${legenda}`;
  }

  const custos = par(custoMensal);
  const rotuloPorM2 = a.modalidade === "aluguel" ? "Aluguel anunciado por m²" : "Preço anunciado por m²";
  const medidaPorM2 = (i: 0 | 1): MedidaDoEspaco => {
    const valor = custos[i].principal.porM2;
    return valor === null
      ? { texto: "A confirmar", detalhe: "Precisa de valor e área conhecidos" }
      : { texto: `${formatarReais(valor)}/m²`, detalhe: null };
  };

  const linhas: LinhaDoEspaco[] = [
    { rotulo: "Área anunciada", medidas: par((x) => medida(x.declarados.area, comoArea)) },
    { rotulo: "Quartos", medidas: par((x) => medida(x.declarados.quartos, comoNumero)) },
    { rotulo: "Banheiros", medidas: par((x) => medida(x.declarados.banheiros, comoNumero)) },
    { rotulo: "Vagas de garagem", medidas: par((x) => medida(x.declarados.vagas, comoNumero)) },
    { rotulo: "Andar anunciado", medidas: par((x) => medida(x.declarados.andar, comoAndar)) },
    { rotulo: rotuloPorM2, medidas: [medidaPorM2(0), medidaPorM2(1)], chave: true },
  ];

  return { areas, barras: barras(areas), diferenca, destaque, legenda, frase, linhas };
}

// ——— Entorno ———————————————————————————————————————————————————————————————————————

export type ColunaDoEntorno =
  | { estado: "confirmado"; edificio: Edificio }
  | { estado: "nao_confirmado" }
  /** Vínculo confirmado, mas o edifício não está no índice atual (índice regenerado). */
  | { estado: "fora_do_indice" };

export type CelulaDoEntorno = { texto: string; detalhe: string | null };
export type LinhaDoEntorno = { rotulo: string; celulas: Par<CelulaDoEntorno>; chave?: boolean; texto?: boolean };

export type ComparacaoDeEntorno = { colunas: Par<ColunaDoEntorno>; linhas: LinhaDoEntorno[] };

export function colunaDoEntorno(a: AnaliseV2, edificio: Edificio | null): ColunaDoEntorno {
  if (a.vinculo.estado !== "confirmado") return { estado: "nao_confirmado" };
  return edificio ? { estado: "confirmado", edificio } : { estado: "fora_do_indice" };
}

const SEM_CADASTRO: CelulaDoEntorno = { texto: "—", detalhe: null };

function celulaDoPredio(c: ColunaDoEntorno): CelulaDoEntorno {
  if (c.estado === "nao_confirmado") return { texto: "Prédio não confirmado", detalhe: null };
  if (c.estado === "fora_do_indice") return { texto: "Prédio fora do índice atual", detalhe: "Confirme o prédio de novo" };
  const e = c.edificio;
  return { texto: "Prédio confirmado", detalhe: e.nome ?? enderecoEmCaixaDeTitulo(e.logradouro, e.numero) };
}

function pavimentosDoEdificio(e: Edificio): CelulaDoEntorno {
  if (e.pavimentos !== null) return { texto: formatarNumero(e.pavimentos), detalhe: null };
  if (e.ate4Pavimentos === true) return { texto: "Até 4", detalhe: "Pelo tipo de construção no cadastro" };
  return SEM_CADASTRO;
}

/** `edificios[i]` é o edifício do índice da análise i, ou null quando o vínculo não está confirmado ou não foi achado. */
export function compararEntorno(a: AnaliseV2, b: AnaliseV2, edificios: Par<Edificio | null>): ComparacaoDeEntorno {
  const colunas: Par<ColunaDoEntorno> = [colunaDoEntorno(a, edificios[0]), colunaDoEntorno(b, edificios[1])];
  const dosDois = (fazer: (e: Edificio) => CelulaDoEntorno): Par<CelulaDoEntorno> => [
    colunas[0].estado === "confirmado" ? fazer(colunas[0].edificio) : SEM_CADASTRO,
    colunas[1].estado === "confirmado" ? fazer(colunas[1].edificio) : SEM_CADASTRO,
  ];
  const linhas: LinhaDoEntorno[] = [
    { rotulo: "Prédio", celulas: [celulaDoPredio(colunas[0]), celulaDoPredio(colunas[1])], texto: true },
    {
      rotulo: "Obras licenciadas a 150 m",
      celulas: dosDois((e) => ({ texto: formatarNumero(e.obras150m.relevantes24m), detalhe: "Últimos 24 meses" })),
      chave: true,
    },
    {
      rotulo: "Ano de construção",
      celulas: dosDois((e) => (e.anoConstrucao !== null ? { texto: String(e.anoConstrucao), detalhe: null } : SEM_CADASTRO)),
    },
    { rotulo: "Pavimentos", celulas: dosDois(pavimentosDoEdificio) },
    {
      rotulo: "Unidades residenciais",
      celulas: dosDois((e) => ({ texto: formatarNumero(e.unidades), detalhe: "No cadastro do prédio" })),
    },
  ];
  return { colunas, linhas };
}

// ——— Tudo junto ————————————————————————————————————————————————————————————————————

export type Comparacao = {
  modalidade: Modalidade;
  rotulos: Par<string>;
  resumos: Par<string>;
  custo: ComparacaoDeCusto;
  espaco: ComparacaoDeEspaco;
  entorno: ComparacaoDeEntorno;
};

export function comparar(a: AnaliseV2, b: AnaliseV2, edificios: Par<Edificio | null>): Comparacao {
  return {
    modalidade: a.modalidade,
    rotulos: rotulosDasColunas(a, b),
    resumos: [resumoDoImovel(a), resumoDoImovel(b)],
    custo: compararCusto(a, b),
    espaco: compararEspaco(a, b),
    entorno: compararEntorno(a, b, edificios),
  };
}
