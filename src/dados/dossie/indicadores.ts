// Indicadores do prédio comparados com o próprio bairro (15/11/2026, sabatina: "classificador direto, comparado com o
// entorno"). Sem nota única: cada tema diz onde o prédio fica entre os prédios do bairro que o Vereda conhece, com a
// medida que sustenta a frase. Puro: recebe os pacotes já carregados (índice, essenciais, noite, chuva).
import type { Edificio, RuaDoBairro } from "../contratos";
import { formatarNumero } from "../formatos";
import type { ChuvaDoBairro } from "../recife/chuva";
import { mesesEAnos } from "../recife/chuva";
import type { EssenciaisDoBairro } from "../recife/essenciais";
import type { NoiteDoBairro } from "../recife/noite";
import { horaEmTexto, solDaTardeDoBairro } from "./solDaTarde";

export type TemaDoIndicador = "a_pe" | "noite" | "barulho" | "obras" | "chuva" | "sol";
export type ClasseDoIndicador = "melhor" | "igual" | "pior";

export type Indicador = {
  id: TemaDoIndicador;
  /** Nome do tema, curto ("Dia a dia a pé"). */
  tema: string;
  classe: ClasseDoIndicador;
  /** O classificador direto ("Perto do dia a dia", "Avenida colada"). */
  rotulo: string;
  /** A medida do prédio, numa frase ("Mercado a 4 min, farmácia a 6 min, ônibus a 2 min."). */
  frase: string;
  /** A comparação com o bairro ("Mais perto que 8 de cada 10 prédios da Torre."). */
  comparacao: string;
  /** O que isso pode significar para quem mora, numa frase. */
  significado: string;
  /** Posição relativa no bairro (0–100, fração de outros prédios em condição inferior), ou null quando categórico. */
  percentilBairro?: number | null;
  /** 0 (no meio do bairro) a 1 (num extremo): ordena os destaques. */
  forca: number;
  /** Quantos prédios do bairro entram na comparação. */
  base: number;
};

export type EntradaDosIndicadores = {
  nomeDoBairro: string;
  predio: Edificio;
  edificiosDoBairro: readonly Edificio[];
  essenciais: EssenciaisDoBairro | null;
  noite: NoiteDoBairro | null;
  chuva: ChuvaDoBairro | null;
  /** 15/11/2026: a camada da rua do índice (setores do Censo, para as árvores do "Sol e sombra"). */
  ruaDoBairro?: RuaDoBairro | null;
};

/** Mínimo de prédios no bairro para comparar. */
const BASE_MINIMA = 20;
const minutos = (m: number) => (m < 1 ? "menos de 1 min" : `${formatarNumero(Math.round(m))} min`);
const metros = (m: number) => (m >= 1000 ? `${formatarNumero(Math.round(m / 100) / 10)} km` : `${formatarNumero(Math.round(m / 10) * 10)} m`);
// "da Torre", "das Graças", "do Espinheiro", "de Boa Viagem", "de Casa Forte".
const deBairro = (nome: string) =>
  /^(torre|madalena|várzea|varzea|tamarineira|encruzilhada|jaqueira|imbiribeira|iputinga|estância|estancia|boa vista)$/i.test(nome) ? `da ${nome}`
    : /^(graças|gracas|aflitos)$/i.test(nome) ? `${/aflitos/i.test(nome) ? "dos" : "das"} ${nome}`
      : /^(espinheiro|derby|pina|cordeiro|recife|parnamirim|monteiro|rosarinho|ipsep|ibura|prado|arruda|cabanga)$/i.test(nome) ? `do ${nome}`
        : `de ${nome}`;

/**
 * Posição de `valor` entre `todos` (menor é melhor quando `menorMelhor`): fração dos outros prédios que ficam piores e
 * fração que ficam melhores. Empates não contam para nenhum lado.
 */
export function posicaoNoBairro(valor: number, todos: readonly number[], menorMelhor: boolean): { piores: number; melhores: number; n: number } {
  const outros = todos.length - 1;
  if (outros <= 0) return { piores: 0, melhores: 0, n: todos.length };
  let piores = 0, melhores = 0;
  for (const v of todos) {
    if (v === valor) continue;
    const pior = menorMelhor ? v > valor : v < valor;
    if (pior) piores += 1; else melhores += 1;
  }
  return { piores: piores / outros, melhores: melhores / outros, n: todos.length };
}

/** Classe e frase da comparação, com "k de cada 10" e percentil explícito (`R14`). */
function comparar(valor: number, todos: readonly number[], menorMelhor: boolean, bairro: string, melhorQue: string, piorQue: string): { classe: ClasseDoIndicador; comparacao: string; forca: number; percentilBairro: number } {
  const p = posicaoNoBairro(valor, todos, menorMelhor);
  const forca = Math.abs(p.piores - p.melhores);
  const percentilBairro = Math.round(p.piores * 100);
  if (p.piores >= 0.7) return { classe: "melhor", comparacao: `${melhorQue} que ${Math.round(p.piores * 10)} de cada 10 prédios ${deBairro(bairro)}.`, forca, percentilBairro };
  if (p.melhores >= 0.7) return { classe: "pior", comparacao: `${piorQue} que ${Math.round(p.melhores * 10)} de cada 10 prédios ${deBairro(bairro)}.`, forca, percentilBairro };
  return { classe: "igual", comparacao: `Parecido com a maioria dos prédios ${deBairro(bairro)}.`, forca, percentilBairro };
}

function indicadorAPe(e: EntradaDosIndicadores): Indicador | null {
  const pac = e.essenciais;
  if (!pac) return null;
  const valorDe = (id: string): number | null => {
    const p = pac.predios[id];
    if (!p || p.modo !== "rede") return null;
    const ms = [p.c.mercado?.min, p.c.farmacia?.min, p.c.transporte?.min];
    return ms.every((x) => typeof x === "number") ? (ms as number[]).reduce((s, x) => s + x, 0) : null;
  };
  const meu = valorDe(e.predio.id);
  if (meu === null) return null;
  const todos = Object.keys(pac.predios).map(valorDe).filter((x): x is number => x !== null);
  if (todos.length < BASE_MINIMA) return null;
  const p = pac.predios[e.predio.id]!;
  if (p.modo !== "rede") return null;
  const c = comparar(meu, todos, true, e.nomeDoBairro, "Mais perto", "Mais longe");
  return {
    id: "a_pe", tema: "Dia a dia a pé", ...c,
    rotulo: c.classe === "melhor" ? "Perto do dia a dia" : c.classe === "pior" ? "Longe do dia a dia" : "Dia a dia na média",
    frase: `Mercado a ${minutos(p.c.mercado!.min)}, farmácia a ${minutos(p.c.farmacia!.min)} e ônibus a ${minutos(p.c.transporte!.min)}, a pé da entrada.`,
    significado: c.classe === "pior" ? "Mais coisas do dia a dia vão depender de carro ou aplicativo." : c.classe === "melhor" ? "Dá para resolver o dia a dia a pé, sem depender de carro." : "O dia a dia a pé é o típico do bairro.",
    base: todos.length,
  };
}

function indicadorNoite(e: EntradaDosIndicadores): Indicador | null {
  const pac = e.noite;
  if (!pac) return null;
  const meu = pac.predios[e.predio.id]?.v;
  if (!meu) return null;
  const todos = Object.values(pac.predios).map((x) => x.v?.m).filter((x): x is number => typeof x === "number");
  if (todos.length < BASE_MINIMA) return null;
  const c = comparar(meu.m, todos, true, e.nomeDoBairro, "Mais perto", "Mais longe");
  const parada = pac.paradas[meu.p];
  return {
    id: "noite", tema: "Volta à noite", ...c,
    rotulo: c.classe === "melhor" ? "Ônibus da noite perto" : c.classe === "pior" ? "Ônibus da noite longe" : "Volta à noite na média",
    frase: `Ponto com ônibus entre 22h e 2h a ${metros(meu.m)} a pé${parada ? ` (${parada.nome})` : ""}.`,
    significado: c.classe === "pior" ? "Voltar tarde de ônibus pede uma caminhada maior; confira a iluminação do trajeto na visita." : c.classe === "melhor" ? "Voltar tarde de ônibus é uma caminhada curta." : "A volta à noite é a típica do bairro.",
    base: todos.length,
  };
}

function indicadorBarulho(e: EntradaDosIndicadores): Indicador | null {
  const pac = e.noite;
  if (!pac) return null;
  const meu = pac.predios[e.predio.id];
  if (!meu) return null;
  // Sem avenida registrada perto, a distância conta como "longe" (o pacote só guarda a avenida próxima).
  const LONGE = 400;
  const valorDe = (x: NoiteDoBairro["predios"][string]) => x.r?.m ?? LONGE;
  const todos = Object.values(pac.predios).map(valorDe);
  if (todos.length < BASE_MINIMA) return null;
  const c = comparar(valorDe(meu), todos, false, e.nomeDoBairro, "Mais longe de avenida", "Mais perto de avenida");
  const r = meu.r;
  const partes: string[] = [];
  if (r) partes.push(`${r.rua ?? "Uma via principal"} a ${metros(r.m)}, do lado ${r.lado}${r.partidas ? `, com ${formatarNumero(r.partidas)} partidas de ônibus por dia útil` : ""}.`);
  else partes.push("Nenhuma via principal colada no prédio.");
  if (meu.s) partes.push(`Local com licença de som a ${metros(meu.s.m)}, do lado ${meu.s.lado}.`);
  return {
    id: "barulho", tema: "Barulho de rua", ...c,
    rotulo: c.classe === "pior" ? "Avenida colada" : c.classe === "melhor" ? "Longe de avenida" : "Rua na média",
    frase: partes.join(" "),
    significado: c.classe === "pior" ? `Visite em horário de pico e compare o lado ${r?.lado ?? "da via"} com o lado oposto.` : "O barulho de trânsito tende a ser menor que no resto do bairro.",
    base: todos.length,
  };
}

function indicadorObras(e: EntradaDosIndicadores): Indicador | null {
  const meu = e.predio.obras150m?.relevantes24m;
  if (typeof meu !== "number") return null;
  const todos = e.edificiosDoBairro.map((x) => x.obras150m?.relevantes24m).filter((x): x is number => typeof x === "number");
  if (todos.length < BASE_MINIMA) return null;
  const c = comparar(meu, todos, true, e.nomeDoBairro, "Menos obras em volta", "Mais obras em volta");
  const dem = e.predio.obras150m.demolicoes24m;
  return {
    id: "obras", tema: "Obras em volta", ...c,
    rotulo: c.classe === "pior" ? "Muitas obras em volta" : c.classe === "melhor" ? "Poucas obras em volta" : "Obras na média",
    frase: meu === 0 ? "Nenhuma construção ou demolição licenciada a até 150 m nos últimos 24 meses." : `${meu} ${meu === 1 ? "construção, acréscimo ou demolição licenciada" : "construções, acréscimos ou demolições licenciadas"} a até 150 m nos últimos 24 meses${dem ? `, ${dem === 1 ? "1 delas demolição" : `${dem} delas demolições`}` : ""}.`,
    significado: meu === 0 ? "Pouca chance de barulho de obra perto nos próximos meses." : dem ? "Demolição costuma vir antes de prédio novo: barulho e poeira por um ou dois anos, e a vista pode mudar." : "Pode haver barulho e poeira em horário comercial; pergunte o horário das obras.",
    base: todos.length,
  };
}

function indicadorChuva(e: EntradaDosIndicadores): Indicador | null {
  const pac = e.chuva;
  if (!pac) return null;
  const temRegistro = (id: string) => (pac.historico[id]?.o.length ?? 0) > 0 || (pac.predios[id]?.length ?? 0) > 0;
  const total = e.edificiosDoBairro.length;
  if (total < BASE_MINIMA) return null;
  const comRegistro = e.edificiosDoBairro.filter((x) => temRegistro(x.id)).length;
  const fracao = comRegistro / total;
  const h = pac.historico[e.predio.id];
  const obs = (h?.o ?? []).map((i) => pac.observacoes[i]!).filter(Boolean);
  const naRua = obs.length > 0;
  const noCaminho = (pac.predios[e.predio.id]?.length ?? 0) > 0;
  const k = Math.round(fracao * 10);
  if (!naRua && !noCaminho) {
    // Sem registro não é "rua que não alaga": fica como o bairro, nunca "melhor".
    return {
      id: "chuva", tema: "Alagamento", classe: "igual", forca: 0, base: total, percentilBairro: null,
      rotulo: "Sem registro na rua",
      frase: "A Defesa Civil não tem alagamento registrado na rua nem no caminho a pé (2014–2024).",
      comparacao: k <= 1 ? `Como a grande maioria dos prédios ${deBairro(e.nomeDoBairro)}.` : `${k} de cada 10 prédios ${deBairro(e.nomeDoBairro)} têm algum registro na rua ou no caminho.`,
      significado: "Não ter registro não garante que a rua não alaga; pergunte na visita.",
    };
  }
  const quando = naRua ? lista(mesesEAnos(obs).rotulos) : null;
  return {
    id: "chuva", tema: "Alagamento", classe: fracao <= 0.3 ? "pior" : "igual", forca: Math.max(0, 0.9 - fracao), base: total, percentilBairro: null,
    rotulo: naRua ? "Rua com alagamento registrado" : "Caminho com alagamento registrado",
    frase: naRua ? `A Defesa Civil registrou alagamento na rua do prédio em ${quando}.` : "Uma rua do caminho a pé até o dia a dia tem alagamento registrado.",
    comparacao: `${k === 0 ? "Menos de 1" : k} de cada 10 prédios ${deBairro(e.nomeDoBairro)} têm algum registro assim.`,
    significado: noCaminho ? "Se a água bloquear a passagem, o caminho até o mercado ou o ponto pode ficar mais longo." : "Pergunte na visita até onde a água chega na entrada e por quanto tempo.",
  };
}

const lista = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}`);

/**
 * Sol e sombra (15/11/2026): sol direto da tarde nas fachadas, com a sombra dos vizinhos mais altos e, em prédio baixo,
 * as árvores do quarteirão (solDaTarde.ts). Menos sol da tarde é "acima do bairro" para o calor; a frase lembra a luz.
 */
function indicadorSol(e: EntradaDosIndicadores): Indicador | null {
  const todos = solDaTardeDoBairro(e.edificiosDoBairro, e.ruaDoBairro);
  const meu = todos.get(e.predio.id);
  if (!meu || todos.size < BASE_MINIMA) return null;
  const c = comparar(meu.valor, [...todos.values()].map((x) => x.valor), true, e.nomeDoBairro, "Menos sol da tarde", "Mais sol da tarde");
  const poente = Math.round(meu.fracaoPoente * 10);
  const partes = [
    poente >= 3 ? `${poente} de cada 10 metros do contorno do lote dão para o poente.` : "Pouco do contorno do lote dá para o poente.",
    meu.sombraDesde !== null ? `Um prédio mais alto na direção do Sol faz sombra no meio da fachada a partir das ${horaEmTexto(meu.sombraDesde)}.` : "Nenhum prédio mais alto do cadastro tapa o sol da tarde.",
  ];
  if (meu.arvores !== null) partes.push(`No setor do Censo, ${Math.round(meu.arvores * 10)} de cada 10 domicílios ficam em face de quadra com 5 ou mais árvores.`);
  partes.push(`Estimativa no equinócio, de 13h a 17h, pelo contorno do lote${meu.alturaConhecida ? " e a altura do cadastro" : " (altura do prédio estimada)"}.`);
  return {
    id: "sol", tema: "Sol e sombra", ...c,
    rotulo: c.classe === "melhor" ? "Menos sol da tarde" : c.classe === "pior" ? "Sol da tarde forte" : "Sol da tarde na média",
    frase: partes.join(" "),
    significado: c.classe === "pior"
      ? "As fachadas do poente pegam a tarde de frente: os cômodos desse lado tendem a esquentar. Visite depois das 15h e pergunte para que lado o apartamento dá."
      : c.classe === "melhor"
        ? "Pouco sol direto depois das 13h: tende a esquentar menos à tarde. Confira na visita se a luz natural basta."
        : "O sol da tarde é o típico do bairro; para que lado o apartamento dá pesa mais que o prédio.",
    base: todos.size,
  };
}

/** Todos os indicadores que o bairro sustenta, na ordem de leitura. */
export function indicadoresDoPredio(e: EntradaDosIndicadores): Indicador[] {
  return [indicadorAPe(e), indicadorNoite(e), indicadorBarulho(e), indicadorObras(e), indicadorSol(e), indicadorChuva(e)].filter((x): x is Indicador => x !== null);
}

/** Os mais fortes (fora da média do bairro), no máximo `n`. */
export function destaquesDosIndicadores(ind: readonly Indicador[], n = 3): Indicador[] {
  return ind.filter((i) => i.classe !== "igual").sort((a, b) => b.forca - a.forca).slice(0, n);
}

export type FichaDeMetodoIndicador = {
  medida: string;
  unidade: string;
  fonte: string;
  recorte: string;
  amostra: string;
  limite: string;
};

const FICHAS_POR_TEMA: Record<TemaDoIndicador, Omit<FichaDeMetodoIndicador, "amostra">> = {
  a_pe: {
    medida: "Soma dos menores percursos a pé até mercado, farmácia e transporte",
    unidade: "Minutos a pé pela malha viária",
    fonte: "Prefeitura do Recife + Grande Recife (malha a pé)",
    recorte: "Entorno conectado a partir da entrada do lote",
    limite: "Considera percurso nas vias mapeadas; sem tempo real de semáforo.",
  },
  noite: {
    medida: "Distância a pé até a parada com linha programada entre 22h e 2h",
    unidade: "Metros a pé pela rede viária",
    fonte: "Grande Recife / CBTU (horário programado)",
    recorte: "Linhas com viagens previstas na madrugada",
    limite: "Horário programado pode variar em feriados e trechos com iluminação reduzida.",
  },
  barulho: {
    medida: "Distância até via principal de tráfego e local com licença sonora",
    unidade: "Metros em linha reta do lote",
    fonte: "Malha viária pública + Licenciamento Ambiental (Recife)",
    recorte: "Entorno imediato das fachadas do edifício",
    limite: "Não mede decibéis no apartamento nem vedação de janelas; visite nos horários de pico.",
  },
  obras: {
    medida: "Contagem de alvarás licenciados em raio de 150 m em 24 meses",
    unidade: "Licenças emitidas no período",
    fonte: "Licenciamento de Obras da Prefeitura do Recife",
    recorte: "Construção nova, acréscimo de área e demolição a até 150 m",
    limite: "Licença emitida não comprova que a obra já começou ou foi encerrada.",
  },
  sol: {
    medida: "Parcela do lote voltada ao poente e sombra de edifícios vizinhos (13h–17h)",
    unidade: "Fração do contorno + hora de sombra no equinócio",
    fonte: "Cadastro municipal de lotes e pavimentos + Censo 2022",
    recorte: "Contorno do prédio, vizinhos no raio solar e arborização da quadra",
    limite: "Andar, recuo e posição exata da janela dentro do prédio mudam a exposição interna.",
  },
  chuva: {
    medida: "Histórico de chamados de alagamento na rua ou rota a pé (2014–2024)",
    unidade: "Registros oficiais na via e trajeto",
    fonte: "Defesa Civil do Recife (chamados 2014–2024)",
    recorte: "Logradouro do prédio e vias da caminhada diária",
    limite: "Ausência de chamado registrado não garante ausência de acúmulo em chuva intensa.",
  },
};

/** Ficha de método de 6 campos por indicador (`R44` / Jupiter R28 + ATTOM R23). */
export function fichaDeMetodoDoIndicador(i: Indicador): FichaDeMetodoIndicador {
  return {
    ...FICHAS_POR_TEMA[i.id],
    amostra: `${formatarNumero(i.base)} edifícios no bairro (mínimo 20)`,
  };
}

/** Ação prática concreta após a leitura do indicador (`R45` / Jupiter R28). */
export function acaoPraticaDoIndicador(i: Indicador): string {
  switch (i.id) {
    case "a_pe":
      return i.classe === "pior"
        ? "Faça a pé o trajeto até o mercado ou parada mais próxima no horário em que costuma sair."
        : "Confirme na visita por qual portaria se sai direto para a calçada do comércio e das paradas.";
    case "noite":
      return i.classe === "pior"
        ? "Observe iluminação, movimento e calçadas entre a parada noturna e a portaria após 21h."
        : "Confira o movimento ao redor da parada noturna e a visibilidade até a entrada do prédio.";
    case "barulho":
      return i.classe === "pior"
        ? "Visite entre 17h30 e 19h30 e teste abrir e fechar a janela do quarto principal."
        : "Cheque ruídos internos do próprio prédio (garagem, bombas, salão) com a janela fechada.";
    case "obras":
      return i.classe === "melhor"
        ? "Mesmo com poucas licenças, observe terrenos vizinhos para checar avisos de futuro canteiro."
        : "Pergunte na portaria sobre horários de obra próxima e veja no mapa qual fachada enfrenta o canteiro.";
    case "sol":
      return i.classe === "pior"
        ? "Visite entre 15h e 17h, toque a parede voltada ao poente e veja se o condomínio permite película."
        : "Confira na planta a posição dos quartos e teste a ventilação cruzada abrindo duas frentes.";
    case "chuva":
      return i.forca > 0 || i.frase.includes("registrou")
        ? "Pergunte na portaria até onde a água sobe na rua, na rampa da garagem e nas vagas em chuva forte."
        : "Confirme com porteiro ou vizinho se a rua ou a rampa da garagem acumulam água em maré alta com chuva.";
  }
}
