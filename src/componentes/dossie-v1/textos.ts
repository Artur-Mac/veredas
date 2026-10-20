// Textos e pequenas contas de apresentação da tela do dossiê (Fatia 4). Funções puras: nenhuma lê armazenamento,
// relógio ou rede. Tudo o que aparece vem da VisaoDoDossie (derivada em src/dados/dossie/derivar.ts); aqui só se
// escolhe a forma de mostrar. Valor desconhecido nunca vira zero: continua nulo ou "A confirmar".
import type {
  Achado,
  AnaliseV2,
  Anomalia,
  ChaveDeFonte,
  Confianca,
  ContextoDoBairro,
  Edificio,
  Fato,
  ObrasProximas,
  Obra,
  ParcelaDoCusto,
  Pergunta,
  Posicao,
  Prioridade,
  VisaoDoDossie,
} from "../../dados/contratos";
import { tipologiaUnica } from "../../dados/dossie/derivar";
import { formatarNumero, formatarReais } from "../../dados/formatos";
import { BAIRROS_COBERTOS, bairroPorSlug } from "../../dados/recife/bairros";

export type AbaDoDossie = "destaques" | "entorno" | "edificio";

export const ABAS_DO_DOSSIE: readonly { id: AbaDoDossie; rotulo: string }[] = [
  { id: "destaques", rotulo: "Destaques" },
  { id: "entorno", rotulo: "Entorno" },
  { id: "edificio", rotulo: "Edifício" },
];

export const PRIORIDADES: readonly { id: Prioridade; rotulo: string }[] = [
  { id: "custo", rotulo: "Custo" },
  { id: "conforto", rotulo: "Conforto" },
  { id: "documentos", rotulo: "Documentos" },
];

/** Quantas verificações aparecem antes de "Ver todas as verificações" (index.html, renderDossierChecks). */
export const VERIFICACOES_VISIVEIS = 3;

const FALTA = "A confirmar";

// ——— Números ———————————————————————————————————————————————————————————————————————

/** 98 vira "98"; 98,5 vira "98,5"; 84,79 vira "84,79". */
export function formatarAreaDoDossie(area: number): string {
  const arredondada = Math.round(area * 100) / 100;
  return Number.isInteger(arredondada) ? formatarNumero(arredondada) : formatarNumero(arredondada, 2).replace(/0$/, "");
}

/** R$ por m² com duas casas, para valores pequenos como o IPTU anual por m². */
export function formatarReaisComCentavos(valor: number): string {
  return `R$ ${formatarNumero(valor, 2)}`;
}

/** JetBrains Mono tem 0,6 em de largura por caractere. Devolve o maior corpo, até `maximo`, em que `texto` cabe em `largura`. */
export function corpoQueCabe(texto: string, largura: number, maximo: number, minimo = 15): number {
  const porCaractere = 0.6;
  return Math.max(minimo, Math.min(maximo, Math.floor(largura / (Math.max(texto.length, 1) * porCaractere))));
}

function plural(n: number, singular: string, pluralizado: string): string {
  return `${formatarNumero(n)} ${n === 1 ? singular : pluralizado}`;
}

// ——— Topo e especificações —————————————————————————————————————————————————————————————

export type ItemDeEspecificacao = { id: "area" | "quartos" | "banheiros" | "vagas"; texto: string; rotulo: string };

/** A faixa de especificações de index.html (`.vereda-specs-strip`): só o que se sabe, nunca zero no lugar de nulo. */
export function especificacoesDaFaixa(e: VisaoDoDossie["especificacoes"]): ItemDeEspecificacao[] {
  const itens: ItemDeEspecificacao[] = [];
  if (e.area !== null) itens.push({ id: "area", texto: `${formatarAreaDoDossie(e.area)} m²`, rotulo: `${formatarAreaDoDossie(e.area)} metros quadrados` });
  if (e.quartos !== null) itens.push({ id: "quartos", texto: `${e.quartos} qtos`, rotulo: plural(e.quartos, "quarto", "quartos") });
  if (e.banheiros !== null) itens.push({ id: "banheiros", texto: `${e.banheiros} ban`, rotulo: plural(e.banheiros, "banheiro", "banheiros") });
  if (e.vagas !== null) itens.push({ id: "vagas", texto: `${e.vagas} vg`, rotulo: plural(e.vagas, "vaga", "vagas") });
  return itens;
}

export function textoDoAndar(andar: number | null): string | null {
  if (andar === null) return null;
  return andar === 0 ? "Térreo" : `${andar}º andar`;
}

/** "Rua Teles Junior, 331 · 8º andar", com o que houver. */
export function linhaDeEndereco(visao: VisaoDoDossie): string | null {
  const partes = [visao.endereco, textoDoAndar(visao.especificacoes.andar)].filter((p): p is string => p !== null && p !== "");
  return partes.length > 0 ? partes.join(" · ") : null;
}

export type FatoCurto = {
  /** Linha em destaque: "Construído em 2010" ou "R$ 328–R$ 371/mês". */
  destaque: string;
  /** Linha de apoio: "12 pavimentos" ou "IPTU 2026 no prédio". */
  apoio: string | null;
  fonte: ChaveDeFonte;
  confianca: Confianca;
  /** O dado, para a gaveta de fonte. */
  dado: { rotulo: string; valor: string };
};

function conhecido(f: Fato | undefined): f is Fato {
  return f !== undefined && f.confianca !== "nao_sabemos" && f.valor !== FALTA;
}

function textoDosPavimentos(f: Fato | undefined): string | null {
  if (!conhecido(f)) return null;
  return /^\d+$/.test(f.valor) ? plural(Number(f.valor), "pavimento", "pavimentos") : f.valor;
}

/**
 * Os dois fatos curtos do topo: ano e pavimentos ("Construído em 2010 · 12 pavimentos") e o `Fato` "iptu-faixa" do
 * cadastro. Cada um some quando falta o dado; nenhum vira "0".
 */
export function fatosCurtos(visao: VisaoDoDossie): { construcao: FatoCurto | null; iptu: FatoCurto | null } {
  const ano = visao.cadastro.find((f) => f.id === "cadastro-ano");
  const pavimentos = visao.cadastro.find((f) => f.id === "cadastro-pavimentos");
  const faixa = visao.cadastro.find((f) => f.id === "iptu-faixa");

  const textoDoAno = conhecido(ano) ? `Construído em ${ano.valor}` : null;
  const textoPav = textoDosPavimentos(pavimentos);
  const origem = textoDoAno ? ano : conhecido(pavimentos) ? pavimentos : undefined;
  const construcao: FatoCurto | null =
    origem && origem.fonte && origem.fonte !== "anuncio" && origem.fonte !== "voce" && (textoDoAno || textoPav)
      ? {
          destaque: textoDoAno ?? textoPav ?? "",
          apoio: textoDoAno ? textoPav : null,
          fonte: origem.fonte,
          confianca: origem.confianca,
          dado: { rotulo: origem.rotulo, valor: origem.valor },
        }
      : null;

  const iptu: FatoCurto | null =
    conhecido(faixa) && faixa.fonte && faixa.fonte !== "anuncio" && faixa.fonte !== "voce"
      ? {
          destaque: faixa.valor,
          apoio: faixa.rotulo,
          fonte: faixa.fonte,
          confianca: faixa.confianca,
          dado: { rotulo: faixa.rotulo, valor: faixa.valor },
        }
      : null;
  return { construcao, iptu };
}

// ——— Custo ————————————————————————————————————————————————————————————————————————

export type SegmentoDaBarra = { nome: ParcelaDoCusto["nome"]; valor: number };

/** A barra segmentada só tem o que entra na soma: parcela conhecida e maior que zero. */
export function segmentosDaBarra(parcelas: ParcelaDoCusto[]): SegmentoDaBarra[] {
  return parcelas.flatMap((p) => (p.estado === "conhecido" && p.valorMensal !== null && p.valorMensal > 0 ? [{ nome: p.nome, valor: p.valorMensal }] : []));
}

/** "Total mensal" quando nada ficou de fora; senão "Total mensal conhecido" (aluguel) ou "Mensal conhecido" (compra). */
export function rotuloDoTotal(custo: VisaoDoDossie["custo"]): string {
  const aluguel = custo.principal.rotulo === "Aluguel anunciado";
  if (custo.totalMensalConhecido !== null && custo.notaForaDaSoma === null) return "Total mensal";
  return aluguel ? "Total mensal conhecido" : "Mensal conhecido";
}

/** Notas das parcelas "a confirmar" ("O anúncio informa R$ 288, sem periodicidade"), uma frase por parcela. */
export function notasDasParcelas(parcelas: ParcelaDoCusto[]): string[] {
  return parcelas.flatMap((p) => (p.estado === "a_confirmar" && p.nota ? [`${p.nome}: ${p.nota}.`] : []));
}

export function textoDoValorMensal(parcela: ParcelaDoCusto): string {
  return parcela.estado === "conhecido" && parcela.valorMensal !== null ? formatarReais(parcela.valorMensal) : FALTA;
}

/**
 * A linha sob o preço principal: o R$/m² do anúncio ou, quando não dá para calcular, o que realmente falta. Preço e
 * área estão em `custo.principal` e em `especificacoes.area`; sem `area` informada, só o preço é checado.
 */
export function precoPorM2(custo: VisaoDoDossie["custo"], area: number | null | undefined = undefined): string {
  const porM2 = custo.principal.porM2;
  if (porM2 !== null) return `${formatarReais(porM2)}/m²`;
  if (custo.principal.valor === null) return area === null ? "Preço e área a confirmar" : "Preço a confirmar";
  return "Área a confirmar";
}

// ——— Posição (barra bala) ——————————————————————————————————————————————————————————

export type DeltaDaPosicao = {
  /** "+12%", "−8%" ou vazio quando está na mediana. */
  metrica: string;
  tom: "acima" | "abaixo" | "na_mediana";
  /** A frase da derivação sem o número do começo: "acima da mediana das avaliações fiscais de unidades deste prédio (ITBI, 36 meses)". */
  direcao: string;
};

export function deltaDaPosicao(p: Posicao): DeltaDaPosicao {
  const d = p.deltaPercentual;
  const tom = d === 0 ? "na_mediana" : d > 0 ? "acima" : "abaixo";
  return {
    metrica: d === 0 ? "" : `${d > 0 ? "+" : "−"}${Math.abs(d)}%`,
    tom,
    direcao: p.frase.replace(/^\d+%\s+/, ""),
  };
}

/** O número de uma posição com a unidade dela: "R$ 8.960/m²", "R$ 990.000", "R$ 4.500/mês". Falado: "R$ 8.960 por m²". */
export function valorDaPosicao(p: Posicao, valor: number, falado = false): string {
  const reais = formatarReais(valor);
  const sufixo = { "R$/m²": ["/m²", " por m²"], "R$/mês": ["/mês", " por mês"], "R$/ano": ["/ano", " por ano"], R$: ["", ""] }[p.unidade];
  return `${reais}${sufixo[falado ? 1 : 0]}`;
}

/** Faixa central das avaliações fiscais de uma posição de compra; aluguel não tem nota. */
export function notaDaPosicao(p: Posicao): string | null {
  if (p.fonte !== "itbi") return null;
  return `Metade central das avaliações fiscais deste prédio: ${faixaDeReais(p.referencia.p25, p.referencia.p75)} por unidade · ${plural(p.referencia.n, "transmissão", "transmissões")} em 36 meses. É avaliação fiscal, não preço de mercado.`;
}

/** Por que não há posição, em uma frase: o que falta ou por que o prédio não permite a comparação. */
export function textoSemPosicao(visao: VisaoDoDossie, edificio: Edificio | null): string {
  if (visao.custo.principal.rotulo === "Aluguel anunciado") {
    return visao.custo.principal.porM2 === null
      ? "O aluguel por m² aparece quando o aluguel e a área estão confirmados."
      : "Para comparar o aluguel por m², o Vereda usa 3 ou mais análises suas de aluguel no mesmo bairro.";
  }
  if (visao.custo.principal.valor === null) return "A comparação com as avaliações fiscais aparece quando o preço anunciado está confirmado.";
  if (edificio === null) return "Confirme o prédio para comparar o preço com as avaliações fiscais dele.";
  if (!tipologiaUnica(edificio)) {
    return "Este prédio tem apartamentos de tamanhos diferentes. A avaliação fiscal vale por unidade e só se compara com o preço de uma unidade do mesmo tamanho; por isso o Vereda não calcula a diferença.";
  }
  return "Este prédio tem menos de 3 transmissões nos últimos 36 meses. Sem elas, não há avaliação fiscal por unidade para comparar.";
}

/** Posições, de 0 a 100, do preenchimento e do marcador da mediana, na mesma escala (index.html, renderDossierBullet). */
export function posicoesDoBullet(p: Posicao): { valor: number; referencia: number } {
  const max = Math.max(p.referencia.p75, p.valor, p.referencia.mediana, 1) * 1.12;
  return { valor: (p.valor / max) * 100, referencia: (p.referencia.mediana / max) * 100 };
}

// ——— Achados ———————————————————————————————————————————————————————————————————————

/** O principal e os de apoio, na ordem da derivação. */
export function listaDeAchados(visao: VisaoDoDossie): Achado[] {
  return [visao.achados.principal, ...visao.achados.apoio].filter((a): a is Achado => a !== null);
}

export function achadoPedeComposicao(a: Achado): boolean {
  return a.tipo === "anomalia";
}

export function achadoPedeObras(a: Achado): boolean {
  return a.tipo === "obras";
}

// ——— Perguntas ———————————————————————————————————————————————————————————————————————

const PORQUE_DA_PERGUNTA: Record<Pergunta["origem"], string> = {
  lacuna: "O anúncio não informa este dado.",
  anomalia: "O valor que o anúncio traz precisa ser conferido.",
  achado: "O cadastro da Prefeitura trouxe um sinal sobre este ponto.",
  padrao: "Verificação que vale para qualquer imóvel.",
  propria: "Pergunta que você mesmo acrescentou.",
};

export function porQueAparece(origem: Pergunta["origem"]): string {
  return PORQUE_DA_PERGUNTA[origem];
}

// ——— Obras e contexto do bairro ——————————————————————————————————————————————————————————

const CATEGORIA_DA_OBRA: Record<Obra["categoria"], string> = {
  construcao: "Construção nova",
  acrescimo: "Acréscimo de área",
  demolicao: "Demolição",
};

export function categoriaDaObra(categoria: Obra["categoria"]): string {
  return CATEGORIA_DA_OBRA[categoria];
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-05" vira "maio de 2026". */
export function mesDaObra(data: string): string {
  const [ano, mes] = data.split("-");
  const nome = MESES[Number(mes) - 1];
  return nome && ano ? `${nome} de ${ano}` : data;
}

/** A situação vem em caixa alta do cadastro ("EM EXIGÊNCIA"): vira "Em exigência". Sem valor, diz que falta. */
export function situacaoDaObra(situacao: string | null): string {
  const limpa = situacao?.trim();
  if (!limpa) return "Situação não informada";
  const minuscula = limpa.toLocaleLowerCase("pt-BR");
  return minuscula.charAt(0).toLocaleUpperCase("pt-BR") + minuscula.slice(1);
}

export function distanciaDaObra(metros: number): string {
  return metros < 5 ? "a menos de 5 m" : `a ${formatarNumero(metros)} m`;
}

export type LinhaDeObra = {
  /** 1, 2, 3… na ordem da lista; o mapa usa o mesmo número no ponto. */
  numero: number;
  categoria: Obra["categoria"];
  titulo: string;
  mes: string;
  distancia: string;
  situacao: string;
  /** "maio de 2026 · a 113 m · Deferido", para a linha de detalhe. */
  detalhe: string;
  /** Frase completa para leitores de tela. */
  rotuloAcessivel: string;
};

export function linhasDeObras(obras: ObrasProximas | null): LinhaDeObra[] {
  if (!obras) return [];
  return obras.recentes.map((o, i) => {
    const mes = mesDaObra(o.data);
    const distancia = distanciaDaObra(o.distanciaM);
    const situacao = situacaoDaObra(o.situacao);
    const titulo = categoriaDaObra(o.categoria);
    return {
      numero: i + 1,
      categoria: o.categoria,
      titulo,
      mes,
      distancia,
      situacao,
      detalhe: `${mes} · ${distancia} · ${situacao}`,
      rotuloAcessivel: `Obra ${i + 1}: ${titulo}, ${mes}, ${distancia}, ${situacao}`,
    };
  });
}

/** Resumo da vizinhança em uma frase factual, sem adjetivo. */
export function resumoDasObras(obras: ObrasProximas): string {
  if (obras.relevantes24m === 0) {
    return "Nenhuma licença de construção, acréscimo ou demolição a até 150 m nos últimos 24 meses.";
  }
  const demolicoes = obras.demolicoes24m > 0 ? ` · ${plural(obras.demolicoes24m, "demolição", "demolições")}` : "";
  return `Construção, acréscimo ou demolição a até 150 m nos últimos 24 meses${demolicoes}`;
}

/** "Desde 2018: 68 licenças de obra de qualquer tipo a até 150 m, com habite-se e reformas pequenas." */
export function notaDasLicencas(obras: ObrasProximas): string | null {
  if (obras.licencasDeObra <= 0) return null;
  return `Desde 2018 há ${plural(obras.licencasDeObra, "licença de obra", "licenças de obra")} de qualquer tipo a até 150 m, com habite-se e reformas pequenas. Só as de construção, acréscimo e demolição contam como obras licenciadas.`;
}

export type LinhaDeContexto = {
  id: string;
  rotulo: string;
  valor: string;
  apoio: string | null;
  fonte: ChaveDeFonte;
};

/** O contexto do bairro (prédios e apartamentos indexados e IPTU por m²), em linhas com a base de cada número. */
export function linhasDoContexto(c: ContextoDoBairro): LinhaDeContexto[] {
  const linhas: LinhaDeContexto[] = [
    { id: "edificios", rotulo: "Prédios no índice cadastral", valor: formatarNumero(c.edificios), apoio: "Endereços com 2 ou mais apartamentos no IPTU 2026", fonte: "iptu_2026" },
    { id: "unidades", rotulo: "Apartamentos nesses prédios", valor: formatarNumero(c.unidades), apoio: null, fonte: "iptu_2026" },
  ];
  if (c.iptuAnualPorM2) {
    linhas.push({
      id: "iptu",
      rotulo: "IPTU anual por m²",
      valor: `${formatarReaisComCentavos(c.iptuAnualPorM2.mediana)}/m²`,
      apoio: `Mediana de ${plural(c.iptuAnualPorM2.n, "unidade", "unidades")} · metade central de ${formatarReaisComCentavos(c.iptuAnualPorM2.p25)} a ${formatarReaisComCentavos(c.iptuAnualPorM2.p75)}`,
      fonte: "iptu_2026",
    });
  }
  return linhas;
}

// ——— Cadastro ——————————————————————————————————————————————————————————————————————

/** "Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena", na ordem de exibição dos bairros cobertos. */
export function listaDeBairrosCobertos(): string {
  const nomes = BAIRROS_COBERTOS.map((slug) => bairroPorSlug(slug)?.nome ?? slug);
  return nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

export type TextosSemPredio = { titulo: string; texto: string; podeConfirmar: boolean };

/**
 * O cartão que ocupa o lugar do cadastro quando não há prédio. O título é o do `Fato` "Prédio não confirmado" da
 * derivação, para as duas telas dizerem a mesma coisa.
 */
export function textosSemPredio(visao: VisaoDoDossie, coberto: boolean, vinculoConfirmado: boolean): TextosSemPredio {
  const titulo = visao.cadastro.find((f) => f.id === "cadastro-sem-predio")?.valor;
  if (!coberto) {
    return {
      titulo: titulo ?? "Fora da área com cadastro",
      texto: `O cadastro do Vereda cobre ${listaDeBairrosCobertos()}. Aqui valem os dados do anúncio e o que você informou.`,
      podeConfirmar: false,
    };
  }
  if (vinculoConfirmado) {
    return {
      titulo: titulo ?? "Prédio confirmado não encontrado no índice atual",
      texto: "O índice cadastral foi gerado de novo e este prédio não está nele. Confirme o prédio outra vez para ver o cadastro.",
      podeConfirmar: true,
    };
  }
  return {
    titulo: titulo ?? "Confirme o prédio para ver o cadastro",
    texto: "Com o prédio confirmado, o dossiê mostra IPTU, ITBI, obras próximas e o cadastro do edifício.",
    podeConfirmar: true,
  };
}

/** Valor curto (ano, pavimentos, unidades) em corpo grande; valor longo (nome, faixa de IPTU, chave) em corpo menor. */
export function valorEhCurto(valor: string): boolean {
  return valor.length <= 7;
}

export type ResumoDoValor = {
  rotulo: string;
  valor: string;
  apoio: string | null;
  /** A frase inteira, para leitor de tela e para a gaveta de fonte: "Avaliações fiscais: R$ 640.000–R$ 780.000 por unidade · 12 transmissões em 36 meses". */
  frase: string;
  /** `null` quando não há dado a abrir: o valor é "A confirmar". */
  fonte: ChaveDeFonte | null;
  confianca: Confianca;
};

/** "R$ 640.000–R$ 780.000"; com os dois limites iguais, um valor só. */
function faixaDeReais(baixo: number, alto: number): string {
  const a = formatarReais(baixo);
  const b = formatarReais(alto);
  return a === b ? a : `${a}–${b}`;
}

/**
 * "O valor em perspectiva" (index.html, renderDossierBuilding): no aluguel, a faixa de IPTU mensal das unidades do
 * prédio; na compra, as avaliações fiscais por unidade do prédio (ITBI, 36 meses): metade central de `valorUnidade` e
 * o número de transmissões. Nunca por m²: a área do ITBI inclui área comum. Sem dado, "A confirmar" e o motivo.
 */
export function resumoDoValor(visao: VisaoDoDossie, edificio: Edificio | null): ResumoDoValor {
  const aluguel = visao.custo.principal.rotulo === "Aluguel anunciado";
  if (aluguel) {
    const faixa = visao.cadastro.find((f) => f.id === "iptu-faixa");
    if (conhecido(faixa) && faixa.fonte && faixa.fonte !== "anuncio" && faixa.fonte !== "voce") {
      return { rotulo: "IPTU mensal no prédio", valor: faixa.valor, apoio: faixa.detalhe, frase: `IPTU mensal no prédio: ${faixa.valor}`, fonte: faixa.fonte, confianca: faixa.confianca };
    }
    return {
      rotulo: "IPTU mensal no prédio", valor: FALTA, apoio: "Sem unidades suficientes com valor no cadastro.",
      frase: `IPTU mensal no prédio: ${FALTA}`, fonte: null, confianca: "nao_sabemos",
    };
  }
  const rotulo = "Avaliações fiscais";
  const q = edificio?.itbi?.valorUnidade ?? null;
  if (edificio?.itbi && q) {
    const valor = faixaDeReais(q.p25, q.p75);
    const complemento = `por unidade · ${plural(q.n, "transmissão", "transmissões")} em 36 meses`;
    return {
      rotulo,
      valor,
      apoio: `${complemento}. É avaliação fiscal, não preço de mercado.`,
      frase: `${rotulo}: ${valor} ${complemento}`,
      fonte: "itbi",
      confianca: "oficial",
    };
  }
  return {
    rotulo,
    valor: FALTA,
    apoio: edificio?.itbi ? "Menos de 3 transmissões nos últimos 36 meses neste endereço." : "Nenhuma transmissão registrada neste endereço.",
    frase: `${rotulo}: ${FALTA}`,
    fonte: null,
    confianca: "nao_sabemos",
  };
}

// ——— Dados do anúncio ——————————————————————————————————————————————————————————————

export type LinhaDeDeclarado = {
  id: string;
  rotulo: string;
  valor: string;
  origem: "link" | "texto" | "voce" | null;
  aConfirmar: boolean;
};

function textoDeReais(valor: number | null): string {
  return valor === null ? "Não informado" : formatarReais(valor);
}

function textoDeContagem(valor: number | null, unidade: string): string {
  return valor === null ? "Não informado" : `${formatarNumero(valor)}${unidade}`;
}

/**
 * Os valores declarados na análise, com a origem de cada um. Preço, condomínio, IPTU e seguro incêndio (aluguel) sempre
 * aparecem, mesmo vazios; o resto só aparece quando há valor. Valor nulo é "Não informado", nunca 0.
 */
export function linhasDeDeclarados(a: AnaliseV2): LinhaDeDeclarado[] {
  const d = a.declarados;
  const aluguel = a.modalidade === "aluguel";
  const linhas: LinhaDeDeclarado[] = [];
  const dinheiro = (id: string, rotulo: string, campo: AnaliseV2["declarados"]["preco"], sempre: boolean, sufixo = "") => {
    if (!sempre && campo.valor === null) return;
    linhas.push({
      id,
      rotulo,
      valor: campo.valor === null ? "Não informado" : `${textoDeReais(campo.valor)}${sufixo}`,
      origem: campo.valor === null ? null : campo.origem,
      aConfirmar: campo.aConfirmar,
    });
  };
  dinheiro("preco", aluguel ? "Aluguel" : "Preço de venda", d.preco, true, aluguel ? "/mês" : "");
  dinheiro("condominio", "Condomínio", d.condominio, true, "/mês");
  const periodo = d.iptu.periodo === "ano" ? "/ano" : d.iptu.periodo === "mes" ? "/mês" : ", sem periodicidade";
  linhas.push({
    id: "iptu",
    rotulo: "IPTU",
    valor: d.iptu.valor === null ? "Não informado" : `${textoDeReais(d.iptu.valor)}${periodo}`,
    origem: d.iptu.valor === null ? null : d.iptu.origem,
    aConfirmar: d.iptu.aConfirmar,
  });
  dinheiro("seguro", "Seguro incêndio", d.seguroIncendio, aluguel, "/mês");
  dinheiro("taxa", "Taxa de serviço", d.taxaServico, false, "/mês");
  dinheiro("outros", "Outros custos", d.outros, false, "/mês");

  const area = d.area;
  if (area.valor !== null) linhas.push({ id: "area", rotulo: "Área", valor: `${formatarAreaDoDossie(area.valor)} m²`, origem: area.origem, aConfirmar: false });
  const contagens: [string, string, AnaliseV2["declarados"]["quartos"]][] = [
    ["quartos", "Quartos", d.quartos],
    ["suites", "Suítes", d.suites],
    ["banheiros", "Banheiros", d.banheiros],
    ["vagas", "Vagas", d.vagas],
  ];
  for (const [id, rotulo, campo] of contagens) {
    if (campo.valor !== null) linhas.push({ id, rotulo, valor: textoDeContagem(campo.valor, ""), origem: campo.origem, aConfirmar: false });
  }
  if (d.andar.valor !== null) {
    linhas.push({ id: "andar", rotulo: "Andar", valor: textoDoAndar(d.andar.valor) ?? "", origem: d.andar.origem, aConfirmar: false });
  }
  return linhas;
}

export function rotuloDaOrigem(origem: "link" | "texto" | "voce"): string {
  return origem === "link" ? "do link" : origem === "texto" ? "do anúncio" : "você";
}

/** Uma anomalia que a pessoa já corrigiu (digitou o valor e tirou o "a confirmar") deixa de ser pendência. */
export function anomaliaResolvida(a: AnaliseV2, anomalia: Anomalia): boolean {
  const d = a.declarados;
  const campo =
    anomalia.campo === "preco" ? d.preco
    : anomalia.campo === "condominio" ? d.condominio
    : anomalia.campo === "iptu" ? d.iptu
    : anomalia.campo === "seguroIncendio" ? d.seguroIncendio
    : anomalia.campo === "taxaServico" ? d.taxaServico
    : null;
  if (campo === null) return false;
  if (campo.valor === null || campo.origem !== "voce" || campo.aConfirmar) return false;
  return anomalia.campo === "iptu" ? d.iptu.periodo !== "desconhecido" : true;
}

/** `http` ou `https`; qualquer outra coisa não vira link. */
export function urlDoAnuncio(a: AnaliseV2): string | null {
  const url = a.url.trim();
  return /^https?:\/\/\S+$/i.test(url) ? url : null;
}
