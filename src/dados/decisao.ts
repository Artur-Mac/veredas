// Projeção da decisão (VE01, aplicações A01–A04). Pura e determinística: recebe duas análises da mesma modalidade, os
// edifícios confirmados (ou null) e a prioridade escolhida na tela, e devolve o resumo que o Comparar mostra no topo.
//
// Regras (docs/aplicacao/execucoes/VE01/evaluation.md):
// - Todo valor mensal vem de `custoMensal` (src/dados/custos.ts), a mesma função do dossiê e dos cartões.
// - Parcela desconhecida nunca vira zero: entra como faixa [mínimo, sem teto]. IPTU com valor e sem periodicidade entra
//   como faixa [valor/12, valor]. A ordem do custo só é "definida" quando as faixas não se cruzam.
// - Quando a ordem pode se inverter, o limiar é a diferença conhecida: o que falta do lado que custa menos precisaria
//   passar dele. Essa é a pergunta decisiva.
// - Sem nota única do imóvel, sem valor do tempo da pessoa, sem tempo de deslocamento inferido de distância em linha reta.
// - Limiares iniciais de diferença material (D004/D010): custo mensal ≥ max(R$ 50, 2%); preço ≥ max(R$ 5.000, 1%);
//   área ≥ 10% da menor; obras licenciadas a 150 m com diferença ≥ 3.
import type { AnaliseV2, Edificio, Modalidade, ParcelaDoCusto } from "./contratos";
import { CATEGORIAS_DO_DIA, type EssenciaisDoPredio } from "./recife/essenciais";
import { custoMensal } from "./custos";
import { formatarNumero, formatarReais } from "./formatos";

const DESTINO_COM_ARTIGO = { mercado: "um mercado", farmacia: "uma farmácia", praca: "uma praça ou parque", transporte: "um ponto de ônibus ou metrô" } as const;

export type Par<T> = [T, T];
export type Lado = 0 | 1;
export type PrioridadeDaDecisao = "custo" | "espaco";

/** De onde vem o número: o anúncio/a pessoa (declarado) ou uma base pública. Guardado para a gaveta de fonte. */
export type FonteDaDiferenca = "anuncio" | "licenciamento" | "mapa";

export type DiferencaMaterial = {
  id: "custo_mensal" | "preco" | "despesas_mensais" | "area" | "dia_a_dia" | "obras";
  /** Lado que leva vantagem nesta dimensão (custa menos, tem mais área, menos obras); null quando empata ou não se sabe. */
  favorece: Lado | null;
  /** A ordem não muda com o que falta saber. */
  definida: boolean;
  texto: string;
  fontes: FonteDaDiferenca[];
  /** Campos que sustentam a frase, para auditoria (ex.: "a.declarados.condominio"). */
  evidencias: string[];
};

export type CampoDaPergunta = "preco" | "condominio" | "iptu" | "iptu_periodo" | "seguro" | "taxa" | "outros" | "area";

export type PerguntaDecisiva = {
  tipo: "visita" | "negociacao";
  /** Imóvel a quem a pergunta se dirige. */
  alvo: Lado;
  campo: CampoDaPergunta | "preco_negociado";
  texto: string;
  /** Por que esta pergunta: o limiar que inverte a ordem, ou a diferença que a negociação fecharia. */
  motivo: string;
  /**
   * "decisiva": a resposta pode inverter a ordem e nada do que se sabe indica o contrário. "confirmacao": o outro imóvel tem
   * um valor conhecido para a mesma parcela, abaixo do limiar; a ordem dificilmente muda, mas o valor ainda falta.
   */
  forca: "decisiva" | "confirmacao" | "negociacao";
};

export type FaixaMensal = { minimo: number; maximo: number | null };

export type ProjecaoDaDecisao =
  | { estado: "incompativel"; motivo: string }
  | {
      estado: "pronta";
      modalidade: Modalidade;
      prioridade: PrioridadeDaDecisao;
      rotulos: Par<string>;
      visitarPrimeiro: Lado | null;
      manchete: string;
      apoio: string | null;
      diferencas: DiferencaMaterial[];
      pergunta: PerguntaDecisiva | null;
      custo: {
        /** Total mensal só com parcelas conhecidas, igual ao do dossiê (`custoMensal`). */
        mensalConhecido: Par<number | null>;
        faixas: Par<FaixaMensal | null>;
        pendentes: Par<number>;
        /** Aluguel: custo mensal; compra: preço anunciado. Positivo = lado 1 custa mais que o lado 0. */
        diferenca: number | null;
        definida: boolean;
        /** Valor que o que falta do lado que custa menos precisaria superar para inverter a ordem. */
        limiarDeInversao: number | null;
      };
      /** Compra: meses até as despesas mensais mais altas somarem a diferença de preço (sem juros nem financiamento). */
      horizonteMeses: number | null;
      /** Diferença mensal (aluguel) ou de preço (compra) a usar na conta do tempo; null sem ordem material. */
      baseDoTempo: { reais: number; porMes: boolean } | null;
    };

// ——— Faixas de custo ————————————————————————————————————————————————————————————————

type ParcelaPendente = { nome: ParcelaDoCusto["nome"]; campo: CampoDaPergunta; minimo: number; maximo: number | null; valorDoAnuncio: number | null };

const CAMPO_DA_PARCELA: Record<ParcelaDoCusto["nome"], CampoDaPergunta> = {
  Aluguel: "preco", "Condomínio": "condominio", IPTU: "iptu", "Seguro incêndio": "seguro", "Taxa de serviço": "taxa", Outros: "outros",
};
/** Ordem em que a pergunta é escolhida quando várias parcelas do mesmo lado podem inverter a ordem (magnitude típica). */
const PRIORIDADE_DA_PERGUNTA: CampoDaPergunta[] = ["preco", "condominio", "iptu_periodo", "iptu", "taxa", "outros", "seguro", "area"];

type LadoDoCusto = { conhecido: number; temConhecido: boolean; pendentes: ParcelaPendente[]; faixa: FaixaMensal };

function ladoDoCusto(a: AnaliseV2): LadoDoCusto {
  const c = custoMensal(a);
  const pendentes: ParcelaPendente[] = c.parcelas
    .filter((p) => p.estado !== "conhecido")
    .map((p) => {
      const iptu = a.declarados.iptu;
      if (p.nome === "IPTU" && iptu.valor !== null && iptu.periodo === "desconhecido" && !iptu.aConfirmar) {
        return { nome: p.nome, campo: "iptu_periodo" as const, minimo: iptu.valor / 12, maximo: iptu.valor, valorDoAnuncio: iptu.valor };
      }
      return { nome: p.nome, campo: CAMPO_DA_PARCELA[p.nome], minimo: 0, maximo: null, valorDoAnuncio: null };
    });
  const conhecido = c.totalMensalConhecido ?? 0;
  const minimo = conhecido + pendentes.reduce((s, p) => s + p.minimo, 0);
  const maximo = pendentes.some((p) => p.maximo === null) ? null : conhecido + pendentes.reduce((s, p) => s + (p.maximo ?? 0), 0);
  return { conhecido, temConhecido: c.totalMensalConhecido !== null, pendentes, faixa: { minimo, maximo } };
}

function materialMensal(diferenca: number, base: number): boolean {
  return Math.abs(diferenca) >= Math.max(50, 0.02 * base);
}
function materialPreco(diferenca: number, base: number): boolean {
  return Math.abs(diferenca) >= Math.max(5000, 0.01 * base);
}

type OrdemDoCusto = {
  /** Lado que custa menos com o que se sabe (faixas no mínimo); null quando empata. */
  menor: Lado | null;
  /** Mínimo do lado 1 menos mínimo do lado 0. */
  diferenca: number;
  definida: boolean;
  /** Quanto o que falta do lado `menor` precisaria somar acima do mínimo para a ordem se inverter. */
  limiar: number | null;
};

function ordenarFaixas(l: Par<LadoDoCusto>): OrdemDoCusto {
  const [f0, f1] = [l[0].faixa, l[1].faixa];
  const diferenca = f1.minimo - f0.minimo;
  if (Math.abs(diferenca) < 0.005) {
    const semPendentes = l[0].pendentes.length === 0 && l[1].pendentes.length === 0;
    return { menor: null, diferenca: 0, definida: semPendentes, limiar: semPendentes ? null : 0 };
  }
  const menor: Lado = diferenca > 0 ? 0 : 1;
  const outro: Lado = menor === 0 ? 1 : 0;
  const maxDoMenor = l[menor].faixa.maximo;
  const definida = maxDoMenor !== null && maxDoMenor <= l[outro].faixa.minimo;
  return { menor, diferenca, definida, limiar: definida ? null : Math.abs(diferenca) };
}

/** Valor que a(s) parcela(s) pendente(s) precisariam passar para inverter: mínimo já contado + lacuna. */
function limiarDasParcelas(pendentes: ParcelaPendente[], lacuna: number): number {
  return pendentes.reduce((s, p) => s + p.minimo, 0) + lacuna;
}

function motivoDaInversao(
  p: ParcelaPendente, lacuna: number, nomeDoAlvo: string, nomeDoOutro: string, sobre: string, referencia: number | null,
): { motivo: string; forca: "decisiva" | "confirmacao" } {
  if (p.campo === "iptu_periodo" && p.maximo !== null) {
    return { motivo: `Se os ${formatarReais(p.maximo)} de IPTU forem por mês, ${nomeDoOutro} passa a ${sobre}.`, forca: "decisiva" };
  }
  const limite = limiarDasParcelas([p], lacuna);
  if (referencia !== null && referencia < limite) {
    return {
      motivo: `Para inverter a ordem, ${ARTIGO[p.nome]} de ${nomeDoAlvo} teria de passar de ${formatarReais(limite)}/mês; em ${nomeDoOutro} é ${formatarReais(referencia)}/mês.`,
      forca: "confirmacao",
    };
  }
  return { motivo: `Se ${ARTIGO[p.nome]} de ${nomeDoAlvo} passar de ${formatarReais(limite)}/mês, ${nomeDoOutro} passa a ${sobre}.`, forca: "decisiva" };
}

// ——— Textos ————————————————————————————————————————————————————————————————————————

const ARTIGO: Record<ParcelaDoCusto["nome"], string> = {
  Aluguel: "o aluguel", "Condomínio": "o condomínio", IPTU: "o IPTU", "Seguro incêndio": "o seguro incêndio", "Taxa de serviço": "a taxa de serviço", Outros: "outras taxas",
};

/** Valor mensal conhecido da mesma parcela no outro imóvel, quando existe. */
function referenciaDoOutro(outro: AnaliseV2, nome: ParcelaDoCusto["nome"]): number | null {
  const p = custoMensal(outro).parcelas.find((x) => x.nome === nome);
  return p && p.estado === "conhecido" ? p.valorMensal : null;
}

/** Área com vírgula e até duas casas, sem zeros à direita (17,5; 82,5; 100). */
function formatarArea(valor: number): string {
  return formatarNumero(valor, Number.isInteger(valor) ? 0 : 2).replace(/,(\d)0$/, ",$1");
}

function juntar(nomes: string[]): string {
  return nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

function mesesEmTexto(meses: number): string {
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = meses / 12;
  const anosTexto = Number.isInteger(anos) ? formatarNumero(anos) : formatarNumero(anos, 1);
  return `${meses} meses (cerca de ${anosTexto} ${anos === 1 ? "ano" : "anos"})`;
}

function textoDaPergunta(campo: CampoDaPergunta, modalidade: Modalidade, valorDoAnuncio: number | null): string {
  switch (campo) {
    case "preco":
      return modalidade === "aluguel" ? "Qual é o valor do aluguel pedido?" : "Qual é o preço pedido pelo imóvel?";
    case "condominio":
      return "Qual é o valor atual do condomínio? Há taxa extra ou rateio aprovado?";
    case "iptu_periodo":
      return `O IPTU de ${formatarReais(valorDoAnuncio ?? 0)} informado no anúncio é por mês ou por ano?`;
    case "iptu":
      return modalidade === "aluguel" ? "Qual é o IPTU deste ano, e quem paga: quem aluga ou o proprietário?" : "Qual é o valor do IPTU deste ano?";
    case "seguro":
      return "Qual é o valor do seguro incêndio, e quem paga?";
    case "taxa":
    case "outros":
      return "Que outras taxas mensais existem além do aluguel, condomínio e IPTU?";
    case "area":
      return "Qual é a área privativa do apartamento, em m²?";
  }
}

// ——— Espaço e entorno ——————————————————————————————————————————————————————————————

function areaConhecida(a: AnaliseV2): number | null {
  const d = a.declarados.area;
  return d.aConfirmar || d.valor === null || d.valor <= 0 ? null : d.valor;
}

type OrdemDaArea = { maior: Lado | null; diferenca: number | null; material: boolean };

function ordenarArea(a: AnaliseV2, b: AnaliseV2): OrdemDaArea {
  const [x, y] = [areaConhecida(a), areaConhecida(b)];
  if (x === null || y === null) return { maior: null, diferenca: null, material: false };
  const diferenca = y - x;
  const material = Math.abs(diferenca) >= 0.1 * Math.min(x, y);
  return { maior: diferenca === 0 ? null : diferenca > 0 ? 1 : 0, diferenca, material };
}

// ——— Tempo (A02) ———————————————————————————————————————————————————————————————————

/**
 * Quanto custa cada hora poupada quando o imóvel que custa mais poupa `minutosPorDia` em `diasPorMes`. Não atribui valor ao
 * tempo da pessoa: só mostra o preço implícito. Ex. do plano: R$ 180/mês, 20 min × 16 dias = 5h20 → R$ 33,75 por hora.
 */
export function precoDaHoraPoupada(reaisPorMes: number, minutosPorDia: number, diasPorMes: number):
  { horasPorMes: number; reaisPorHora: number; horasTexto: string; reaisPorHoraTexto: string } | null {
  if (!(reaisPorMes > 0) || !(minutosPorDia > 0) || !(diasPorMes > 0) || diasPorMes > 31 || minutosPorDia > 600) return null;
  const minutos = minutosPorDia * diasPorMes;
  const horasPorMes = minutos / 60;
  const reaisPorHora = reaisPorMes / horasPorMes;
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos - h * 60);
  return {
    horasPorMes,
    reaisPorHora,
    horasTexto: m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`,
    reaisPorHoraTexto: `R$ ${formatarNumero(reaisPorHora, 2)}`,
  };
}

// ——— Projeção ——————————————————————————————————————————————————————————————————————

export function rotulosDaDecisao(a: AnaliseV2, b: AnaliseV2, rotulos: Par<string>): Par<string> {
  return rotulos[0] !== rotulos[1] ? rotulos : [a.nome, b.nome];
}

export function projetarDecisao(
  a: AnaliseV2,
  b: AnaliseV2,
  edificios: Par<Edificio | null>,
  rotulos: Par<string>,
  prioridade: PrioridadeDaDecisao = "custo",
  /** VE04: tempo a pé até mercado, farmácia, praça e ônibus de cada prédio (só conta quando os dois têm caminho na rede). */
  essenciais: Par<EssenciaisDoPredio | null> = [null, null],
): ProjecaoDaDecisao {
  if (a.modalidade !== b.modalidade) {
    return { estado: "incompativel", motivo: "Aluguel e compra não se comparam lado a lado: escolha dois imóveis da mesma modalidade." };
  }
  const modalidade = a.modalidade;
  const aluguel = modalidade === "aluguel";
  const nomes = rotulos;
  const par: Par<AnaliseV2> = [a, b];
  const lados: Par<LadoDoCusto> = [ladoDoCusto(a), ladoDoCusto(b)];
  const diferencas: DiferencaMaterial[] = [];

  // — Custo principal: aluguel → custo mensal com faixas; compra → preço anunciado.
  let custoVencedor: Lado | null = null;
  let custoDefinido = false;
  let custoDiferenca: number | null = null;
  let limiar: number | null = null;
  let perguntaDoCusto: PerguntaDecisiva | null = null;
  let baseDoTempo: { reais: number; porMes: boolean } | null = null;
  const ordemMensal = ordenarFaixas(lados);
  const precos: Par<number | null> = [custoMensal(a).principal.valor, custoMensal(b).principal.valor];

  if (aluguel) {
    const rentFaltando = precos.findIndex((p) => p === null);
    if (rentFaltando >= 0) {
      const alvo = rentFaltando as Lado;
      perguntaDoCusto = {
        tipo: "visita", alvo, campo: "preco", texto: textoDaPergunta("preco", modalidade, null),
        motivo: `Sem o aluguel de ${nomes[alvo]}, não dá para comparar o custo mensal.`, forca: "decisiva",
      };
    } else {
      custoDiferenca = ordemMensal.diferenca;
      custoDefinido = ordemMensal.definida;
      const base = Math.min(lados[0].faixa.minimo, lados[1].faixa.minimo);
      if (ordemMensal.menor !== null && materialMensal(ordemMensal.diferenca, base)) {
        custoVencedor = ordemMensal.menor;
        limiar = ordemMensal.limiar;
        const outro: Lado = custoVencedor === 0 ? 1 : 0;
        const valor = formatarReais(Math.abs(ordemMensal.diferenca));
        const faltam = lados[custoVencedor].pendentes;
        const limite = formatarReais(limiarDasParcelas(faltam, Math.abs(ordemMensal.diferenca)));
        // Definida com pendências: a diferença garantida é o mínimo do outro menos o máximo de quem custa menos.
        const exata = lados[0].pendentes.length === 0 && lados[1].pendentes.length === 0;
        const garantida = formatarReais(lados[outro].faixa.minimo - (lados[custoVencedor].faixa.maximo ?? lados[custoVencedor].faixa.minimo));
        const texto = custoDefinido
          ? exata
            ? `${nomes[custoVencedor]} custa ${valor}/mês a menos que ${nomes[outro]}.`
            : `${nomes[custoVencedor]} custa pelo menos ${garantida}/mês a menos que ${nomes[outro]}.`
          : `${nomes[custoVencedor]} custa ${valor}/mês a menos no que já se sabe. Só se inverte se ${juntar(faltam.map((p) => ARTIGO[p.nome]))} de ${nomes[custoVencedor]} ${faltam.length > 1 ? `somarem mais de ${limite}` : `passar de ${limite}`}/mês.`;
        diferencas.push({
          id: "custo_mensal", favorece: custoVencedor, definida: custoDefinido, texto, fontes: ["anuncio"],
          evidencias: ["custoMensal(a).parcelas", "custoMensal(b).parcelas"],
        });
        baseDoTempo = { reais: Math.abs(ordemMensal.diferenca), porMes: true };
      } else if (ordemMensal.menor === null && ordemMensal.definida) {
        diferencas.push({
          id: "custo_mensal", favorece: null, definida: true, texto: `Os dois têm o mesmo custo mensal conhecido: ${formatarReais(lados[0].faixa.minimo)}/mês.`,
          fontes: ["anuncio"], evidencias: ["custoMensal(a)", "custoMensal(b)"],
        });
      } else {
        const valor = formatarReais(Math.abs(ordemMensal.diferenca));
        diferencas.push({
          id: "custo_mensal", favorece: null, definida: false,
          texto: ordemMensal.diferenca === 0
            ? `Custo mensal conhecido igual (${formatarReais(lados[0].faixa.minimo)}/mês), com parcelas ainda a confirmar.`
            : `Custo mensal parecido: ${valor}/mês de diferença no que já se sabe.`,
          fontes: ["anuncio"], evidencias: ["custoMensal(a)", "custoMensal(b)"],
        });
      }
      // Pergunta decisiva do custo: uma parcela do lado que custa menos que pode passar do limiar (ou, no empate com
      // pendências, qualquer parcela que falte).
      const candidatas = ordemMensal.menor === null
        ? ([0, 1] as const).flatMap((l) => lados[l].pendentes.map((p) => ({ p, alvo: l as Lado })))
        : custoVencedor !== null && !custoDefinido
          ? lados[custoVencedor].pendentes
              .filter((p) => p.maximo === null || p.maximo - p.minimo > (limiar ?? 0))
              .map((p) => ({ p, alvo: custoVencedor as Lado }))
          : [];
      const escolhida = candidatas.sort(
        (x, y) => PRIORIDADE_DA_PERGUNTA.indexOf(x.p.campo) - PRIORIDADE_DA_PERGUNTA.indexOf(y.p.campo) || x.alvo - y.alvo,
      )[0];
      if (escolhida) {
        const outro: Lado = escolhida.alvo === 0 ? 1 : 0;
        const m = ordemMensal.menor === null
          ? { motivo: `O custo mensal conhecido empata; ${ARTIGO[escolhida.p.nome]} de ${nomes[escolhida.alvo]} desempata.`, forca: "decisiva" as const }
          : motivoDaInversao(escolhida.p, limiar ?? 0, nomes[escolhida.alvo], nomes[outro], "custar menos por mês", referenciaDoOutro(par[outro], escolhida.p.nome));
        perguntaDoCusto = {
          tipo: "visita", alvo: escolhida.alvo, campo: escolhida.p.campo,
          texto: textoDaPergunta(escolhida.p.campo, modalidade, escolhida.p.valorDoAnuncio), ...m,
        };
      }
    }
  } else {
    // Compra: preço e despesas mensais separados; o preço nunca entra no mensal.
    const faltaPreco = precos.findIndex((p) => p === null);
    if (faltaPreco >= 0) {
      const alvo = faltaPreco as Lado;
      perguntaDoCusto = {
        tipo: "visita", alvo, campo: "preco", texto: textoDaPergunta("preco", modalidade, null),
        motivo: `Sem o preço de ${nomes[alvo]}, não dá para comparar a compra.`, forca: "decisiva",
      };
    } else {
      const [p0, p1] = precos as Par<number>;
      custoDiferenca = p1 - p0;
      custoDefinido = true;
      if (custoDiferenca !== 0 && materialPreco(custoDiferenca, Math.min(p0, p1))) {
        custoVencedor = custoDiferenca > 0 ? 0 : 1;
        const outro: Lado = custoVencedor === 0 ? 1 : 0;
        diferencas.push({
          id: "preco", favorece: custoVencedor, definida: true,
          texto: `${nomes[custoVencedor]} pede ${formatarReais(Math.abs(custoDiferenca))} a menos que ${nomes[outro]}.`,
          fontes: ["anuncio"], evidencias: ["a.declarados.preco", "b.declarados.preco"],
        });
        baseDoTempo = { reais: Math.abs(custoDiferenca), porMes: false };
      } else {
        diferencas.push({
          id: "preco", favorece: null, definida: true,
          texto: custoDiferenca === 0 ? "Os dois pedem o mesmo preço." : `Preços parecidos: ${formatarReais(Math.abs(custoDiferenca))} de diferença.`,
          fontes: ["anuncio"], evidencias: ["a.declarados.preco", "b.declarados.preco"],
        });
      }
    }
  }

  // — Compra: despesas mensais e horizonte em que compensam a diferença de preço.
  let horizonteMeses: number | null = null;
  if (!aluguel) {
    const m = ordemMensal;
    const base = Math.min(lados[0].faixa.minimo, lados[1].faixa.minimo);
    if (m.menor !== null && materialMensal(m.diferenca, base)) {
      const outro: Lado = m.menor === 0 ? 1 : 0;
      const valor = formatarReais(Math.abs(m.diferenca));
      let texto = m.definida
        ? `As despesas mensais de ${nomes[outro]} são ${valor}/mês mais altas.`
        : `As despesas mensais de ${nomes[outro]} são ${valor}/mês mais altas no que já se sabe.`;
      if (m.definida && custoVencedor !== null && custoVencedor === outro && custoDiferenca !== null) {
        horizonteMeses = Math.ceil(Math.abs(custoDiferenca) / Math.abs(m.diferenca));
        texto += ` Em ${mesesEmTexto(horizonteMeses)} elas somam a diferença de preço, sem contar juros, financiamento ou valorização.`;
      }
      diferencas.push({ id: "despesas_mensais", favorece: m.menor, definida: m.definida, texto, fontes: ["anuncio"], evidencias: ["custoMensal(a)", "custoMensal(b)"] });
      // Preço igual ou parecido: as despesas mensais decidem o custo da compra.
      if (custoVencedor === null && precos[0] !== null && precos[1] !== null) {
        custoVencedor = m.menor;
        custoDefinido = m.definida;
        if (baseDoTempo === null) baseDoTempo = { reais: Math.abs(m.diferenca), porMes: true };
      }
    }
    if (!perguntaDoCusto && !m.definida) {
      const candidatas = m.menor === null
        ? ([0, 1] as const).flatMap((l) => lados[l].pendentes.map((p) => ({ p, alvo: l as Lado })))
        : lados[m.menor].pendentes.filter((p) => p.maximo === null || p.maximo - p.minimo > (m.limiar ?? 0)).map((p) => ({ p, alvo: m.menor as Lado }));
      const escolhida = candidatas.sort(
        (x, y) => PRIORIDADE_DA_PERGUNTA.indexOf(x.p.campo) - PRIORIDADE_DA_PERGUNTA.indexOf(y.p.campo) || x.alvo - y.alvo,
      )[0];
      if (escolhida) {
        const outro: Lado = escolhida.alvo === 0 ? 1 : 0;
        const mot = m.menor === null
          ? { motivo: `As despesas mensais conhecidas empatam; ${ARTIGO[escolhida.p.nome]} de ${nomes[escolhida.alvo]} desempata.`, forca: "decisiva" as const }
          : motivoDaInversao(escolhida.p, m.limiar ?? 0, nomes[escolhida.alvo], nomes[outro], "ter despesas mensais menores", referenciaDoOutro(par[outro], escolhida.p.nome));
        perguntaDoCusto = {
          tipo: "visita", alvo: escolhida.alvo, campo: escolhida.p.campo,
          texto: textoDaPergunta(escolhida.p.campo, modalidade, escolhida.p.valorDoAnuncio), ...mot,
        };
      }
    }
  }

  // — Espaço.
  const area = ordenarArea(a, b);
  let espacoVencedor: Lado | null = null;
  if (area.diferenca !== null && area.material && area.maior !== null) {
    espacoVencedor = area.maior;
    const outro: Lado = area.maior === 0 ? 1 : 0;
    let texto = `${nomes[area.maior]} tem ${formatarArea(Math.abs(area.diferenca))} m² a mais de área anunciada.`;
    // Preço implícito de cada m² extra quando quem tem mais área também custa mais.
    if (custoVencedor !== null && custoVencedor === outro && custoDiferenca !== null) {
      const porM2 = Math.abs(custoDiferenca) / Math.abs(area.diferenca);
      texto += aluguel && custoDefinido
        ? ` Cada m² extra sai por ${formatarReais(porM2)}/mês.`
        : !aluguel ? ` Cada m² extra sai por ${formatarReais(porM2)} no preço.` : "";
    }
    diferencas.push({ id: "area", favorece: area.maior, definida: true, texto, fontes: ["anuncio"], evidencias: ["a.declarados.area", "b.declarados.area"] });
  }
  const perguntaDaArea: PerguntaDecisiva | null = area.diferenca === null
    ? (() => {
        const alvo: Lado = areaConhecida(a) === null ? 0 : 1;
        return { tipo: "visita" as const, alvo, campo: "area" as const, texto: textoDaPergunta("area", modalidade, null), motivo: `Sem a área de ${nomes[alvo]}, não dá para comparar o espaço.`, forca: "decisiva" as const };
      })()
    : null;

  // — Dia a dia a pé (VE04): a categoria com a maior diferença de minutos, se ≥ 5 min e os dois prédios têm caminho
  //   calculado a partir de uma entrada ligada com confiança. Linha reta nunca entra aqui.
  const [d0, d1] = essenciais;
  if (d0?.modo === "rede" && d1?.modo === "rede") {
    let melhor: { cat: (typeof CATEGORIAS_DO_DIA)[number]; m0: number; m1: number } | null = null;
    for (const cat of CATEGORIAS_DO_DIA) {
      const [x0, x1] = [d0.c[cat], d1.c[cat]];
      if (!x0 || !x1) continue;
      const dif = Math.abs(x0.min - x1.min);
      if (dif >= 5 && (!melhor || dif > Math.abs(melhor.m0 - melhor.m1))) melhor = { cat, m0: x0.min, m1: x1.min };
    }
    if (melhor) {
      const perto: Lado = melhor.m0 < melhor.m1 ? 0 : 1;
      const longe: Lado = perto === 0 ? 1 : 0;
      const [mp, ml] = perto === 0 ? [melhor.m0, melhor.m1] : [melhor.m1, melhor.m0];
      diferencas.push({
        id: "dia_a_dia", favorece: perto, definida: true,
        texto: `${nomes[perto]} fica a ${formatarNumero(Math.round(mp))} min a pé de ${DESTINO_COM_ARTIGO[melhor.cat]}; ${nomes[longe]}, a ${formatarNumero(Math.round(ml))} min.`,
        fontes: ["mapa"], evidencias: ["essenciais.c"],
      });
    }
  }

  // — Entorno verificado: obras licenciadas a 150 m (Prefeitura, 24 meses), só com os dois prédios confirmados.
  const [e0, e1] = edificios;
  if (a.vinculo.estado === "confirmado" && b.vinculo.estado === "confirmado" && e0 && e1) {
    const [o0, o1] = [e0.obras150m.relevantes24m, e1.obras150m.relevantes24m];
    if (Math.abs(o0 - o1) >= 3) {
      const menos: Lado = o0 < o1 ? 0 : 1;
      const mais: Lado = menos === 0 ? 1 : 0;
      diferencas.push({
        id: "obras", favorece: menos, definida: true,
        texto: `${nomes[mais]} tem ${formatarNumero(Math.max(o0, o1))} obras licenciadas a até 150 m nos últimos 24 meses; ${nomes[menos]}, ${formatarNumero(Math.min(o0, o1))}. Vale ouvir a rua na visita.`,
        fontes: ["licenciamento"], evidencias: ["edificio.obras150m.relevantes24m"],
      });
    }
  }

  // — Quem visitar primeiro, segundo a prioridade escolhida (sem nota única).
  const porDimensao: Record<PrioridadeDaDecisao, Lado | null> = { custo: custoVencedor, espaco: espacoVencedor };
  const outraDimensao: PrioridadeDaDecisao = prioridade === "custo" ? "espaco" : "custo";
  const principal = porDimensao[prioridade];
  const secundaria = porDimensao[outraDimensao];
  let visitarPrimeiro: Lado | null = null;
  let manchete: string;
  let apoio: string | null = null;
  const precoSemDiferenca = diferencas.find((d) => d.id === "preco")?.favorece === null;
  const idDoCusto: DiferencaMaterial["id"] = aluguel
    ? "custo_mensal"
    : precoSemDiferenca && diferencas.some((d) => d.id === "despesas_mensais") ? "despesas_mensais" : "preco";

  // O apoio não repete as diferenças da lista: só diz o que se troca, ou por que a outra dimensão decidiu.
  const curto = (d: PrioridadeDaDecisao, lado: Lado): string => {
    if (d === "espaco" && area.diferenca !== null) return `${nomes[lado]} tem ${formatarArea(Math.abs(area.diferenca))} m² a mais`;
    const dif = diferencas.find((x) => x.id === idDoCusto);
    const reais = idDoCusto === "despesas_mensais" ? Math.abs(ordemMensal.diferenca) : Math.abs(custoDiferenca ?? 0);
    const porMes = aluguel || idDoCusto === "despesas_mensais";
    return `${nomes[lado]} ${porMes ? "custa" : "pede"} ${formatarReais(reais)}${porMes ? "/mês" : ""} a menos${dif && !dif.definida ? " no que já se sabe" : ""}`;
  };
  if (principal !== null && (secundaria === null || secundaria === principal)) {
    visitarPrimeiro = principal;
    manchete = secundaria === principal
      ? `Visite primeiro ${nomes[principal]}: ${aluguel ? "custa menos por mês" : "custa menos"} e tem mais área.`
      : `Visite primeiro ${nomes[principal]}.`;
  } else if (principal !== null && secundaria !== null) {
    visitarPrimeiro = principal;
    manchete = `Visite primeiro ${nomes[principal]}, se ${prioridade === "custo" ? "o custo" : "o espaço"} pesa mais agora.`;
    apoio = `Em troca, ${curto(outraDimensao, secundaria)}.`;
  } else if (principal === null && secundaria !== null) {
    visitarPrimeiro = secundaria;
    manchete = `Visite primeiro ${nomes[secundaria]}.`;
    apoio = prioridade === "custo" ? "No custo, ainda não há diferença clara." : "No espaço, ainda não há diferença clara.";
  } else {
    const dia = diferencas.find((d) => d.id === "dia_a_dia");
    if (dia && dia.favorece !== null) {
      // Custo e espaço não separam, mas o dia a dia a pé sim: a recomendação vem daí, sem contradizer a lista.
      visitarPrimeiro = dia.favorece;
      manchete = `Visite primeiro ${nomes[dia.favorece]}.`;
      apoio = "No custo e no espaço, os dois ficam próximos; a diferença está no dia a dia a pé.";
    } else {
      manchete = "Com o que se sabe, os dois ficam próximos.";
      apoio = null;
    }
  }

  // — Pergunta: a do custo quando o custo pode virar; senão a da área; senão uma pergunta de negociação.
  let pergunta: PerguntaDecisiva | null =
    prioridade === "espaco" ? perguntaDaArea ?? perguntaDoCusto : perguntaDoCusto ?? perguntaDaArea;
  if (!pergunta && visitarPrimeiro !== null && custoVencedor !== null && visitarPrimeiro !== custoVencedor && custoDefinido && custoDiferenca !== null) {
    const alvo = visitarPrimeiro;
    const lacuna = Math.abs(custoDiferenca);
    const preco = precos[alvo];
    if (preco !== null && lacuna < preco) {
      pergunta = {
        tipo: "negociacao", alvo, campo: "preco_negociado",
        texto: aluguel
          ? `O aluguel pode ficar em ${formatarReais(preco - lacuna)}? Assim o custo mensal empata com o outro imóvel que estou considerando.`
          : `O vendedor considera ${formatarReais(preco - lacuna)}? É o valor que empata com o outro imóvel que estou considerando.`,
        motivo: `${nomes[alvo]} ${aluguel ? "custa" : "pede"} ${formatarReais(lacuna)}${aluguel ? "/mês" : ""} a mais; esta é a diferença que a negociação fecharia.`,
        forca: "negociacao",
      };
    }
  }

  if (visitarPrimeiro === null) {
    apoio = pergunta
      ? "A pergunta abaixo é a que mais pode separar os dois."
      : "Não há diferença material no que se sabe de custo e espaço: a visita decide.";
  }

  // Até três diferenças, na ordem: a dimensão escolhida, a outra, e o resto.
  const ordem: DiferencaMaterial["id"][] = prioridade === "custo"
    ? [idDoCusto, "despesas_mensais", "area", "dia_a_dia", "obras"]
    : ["area", idDoCusto, "despesas_mensais", "dia_a_dia", "obras"];
  diferencas.sort((x, y) => ordem.indexOf(x.id) - ordem.indexOf(y.id));

  return {
    estado: "pronta",
    modalidade,
    prioridade,
    rotulos: nomes,
    visitarPrimeiro,
    manchete,
    apoio: apoio && apoio.trim() ? apoio.trim() : null,
    diferencas: diferencas.slice(0, 3),
    pergunta,
    custo: {
      mensalConhecido: [custoMensal(par[0]).totalMensalConhecido, custoMensal(par[1]).totalMensalConhecido],
      faixas: [lados[0].faixa, lados[1].faixa],
      pendentes: [lados[0].pendentes.length, lados[1].pendentes.length],
      diferenca: custoDiferenca,
      definida: custoDefinido,
      limiarDeInversao: limiar,
    },
    horizonteMeses,
    baseDoTempo,
  };
}
