// Seção "A rua" do dossiê (v1.1, revisão 2.6 da ordem). Pura: recebe a análise, o edifício confirmado e a camada da rua
// do índice (`IndiceDoBairro.rua` e `META.fontesDaRua`) e devolve os fatos da seção e as perguntas novas do roteiro.
// Cada fato leva a fonte e a data (ou o período) do dado. Sem nota, sem ranking e sem adjetivo de julgamento: contagem,
// percentual e o recorte. Valor desconhecido nunca vira zero: vira "A confirmar" com confiança "não sabemos".
import type {
  AnaliseV2,
  CategoriaDaOcorrencia,
  ChaveDeFonteDaRua,
  Confianca,
  Edificio,
  FatoDaRua,
  FonteDaRua,
  GrupoDaRua,
  Pergunta,
  RuaDoBairro,
  RuaDoEdificio,
  VisaoDaRua,
} from "../contratos";
import { formatarDistancia, formatarNumero } from "../formatos";
import { distanciaMetros } from "../geo";
import { bairroPorSlug } from "../recife/bairros";

/** Raio de todas as camadas por ponto (LUSE, 156, iluminação, sinistros), o mesmo das obras. */
export const RAIO_DA_RUA_M = 150;
/** A partir de quantos pedidos de lâmpada apagada em 12 meses a pergunta sobre a rua à noite entra no roteiro. */
const PEDIDOS_DE_LAMPADA_PARA_PERGUNTAR = 3;

/** `Edificio.rua` com nomes (o índice guarda uma tupla; ver `esquemaRuaDoEdificio`). */
export type RuaDoEdificioLida = {
  setor: number | null;
  /** Drenagem, lâmpada apagada e entulho: [pedidos a até 150 m em 12 meses, mediana de dias até o atendimento]. */
  pedidos156: { drenagem: [number, number | null]; lampada: [number, number | null]; entulho: [number, number | null] };
  sinistros: { comVitima: number; atropelamentos: number };
};

export function lerRuaDoEdificio(rua: RuaDoEdificio): RuaDoEdificioLida {
  const [setor, drenagem, diasDrenagem, lampada, diasLampada, entulho, diasEntulho, comVitima, atropelamentos] = rua;
  return {
    setor,
    pedidos156: { drenagem: [drenagem, diasDrenagem], lampada: [lampada, diasLampada], entulho: [entulho, diasEntulho] },
    sinistros: { comVitima, atropelamentos },
  };
}

/** O que o chamador lê do índice: a camada do bairro e as fontes do meta.json. */
export type EntradaDaRua = { bairro: RuaDoBairro; fontes: readonly FonteDaRua[] };

export type AnaliseDaRua = { visao: VisaoDaRua; perguntas: Pergunta[] };

const A_CONFIRMAR = "A confirmar";

/** Depois da contagem: "2 por imóvel com danos ou risco", "1 sem ocorrência registrada". */
const ROTULO_DA_OCORRENCIA: Record<CategoriaDaOcorrencia, string> = {
  danos_ou_risco: "por imóvel com danos ou risco",
  alagamento: "por alagamento",
  desabamento: "por desabamento",
  incendio: "por incêndio",
  arvore: "por árvore",
  deslizamento: "por deslizamento",
  outra: "por outra ocorrência",
  nao_informada: "sem ocorrência registrada",
};

// ——— Utilidades ———————————————————————————————————————————————————————————————————

function plural(n: number, singular: string, pluralizado: string): string {
  return `${formatarNumero(n)} ${n === 1 ? singular : pluralizado}`;
}

/** "a, b e c". */
function lista(itens: readonly string[]): string {
  return itens.length <= 1 ? (itens[0] ?? "") : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** "2026-10-19" → "19/10/2026". */
function dia(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

function porcento(parte: number, total: number): string {
  return `${Math.round((parte / total) * 100)}%`;
}

/** "casa-forte" → "Casa Forte" pela lista oficial; fora dela, o slug com espaços e iniciais maiúsculas. */
function nomeDoBairro(slug: string): string {
  return bairroPorSlug(slug)?.nome ?? slug.split("-").map((p) => (p.length > 2 ? p.charAt(0).toUpperCase() + p.slice(1) : p)).join(" ");
}

/**
 * Data que acompanha cada fato na tela: "Censo 2022" para o IBGE; o período da fonte ("2022 a 2024" quando cobre anos
 * inteiros, "31/01/2025 a 30/01/2026" quando não); ou "base de {data}" quando vale a situação na data da publicação.
 */
export function dataDaFonteDaRua(fonte: FonteDaRua | undefined): string {
  if (!fonte) return "data não informada";
  if (fonte.licenca === "Citar o IBGE") return "Censo 2022";
  const p = fonte.periodo;
  if (p) {
    const anosInteiros = p.de.endsWith("-01-01") && p.ate.endsWith("-12-31");
    if (anosInteiros) return p.de.slice(0, 4) === p.ate.slice(0, 4) ? p.de.slice(0, 4) : `${p.de.slice(0, 4)} a ${p.ate.slice(0, 4)}`;
    return `${dia(p.de)} a ${dia(p.ate)}`;
  }
  return fonte.modificadoEm ? `base de ${dia(fonte.modificadoEm)}` : "data não informada";
}

/** Pontos de uma lista ([lon, lat]) a até o raio do centro, com a distância, do mais perto ao mais longe. */
function pertoDe(centro: readonly [number, number], pontos: readonly (readonly [number, number])[]): number[] {
  return pontos
    .map((p) => distanciaMetros([centro[0], centro[1]], [p[0], p[1]]))
    .filter((d) => d <= RAIO_DA_RUA_M)
    .sort((x, y) => x - y);
}

// ——— Montagem ———————————————————————————————————————————————————————————————————

type Contexto = {
  /** A data que acompanha os fatos da fonte (`dataDaFonteDaRua`). */
  data: (fonte: ChaveDeFonteDaRua) => string;
  fato: (id: string, rotulo: string, valor: string, detalhe: string | null, fonte: ChaveDeFonteDaRua, confianca?: Confianca) => FatoDaRua;
};

function contexto(fontes: readonly FonteDaRua[]): Contexto {
  const datas = new Map(fontes.map((f) => [f.chave, dataDaFonteDaRua(f)]));
  const data = (fonte: ChaveDeFonteDaRua) => datas.get(fonte) ?? "data não informada";
  return {
    data,
    fato: (id, rotulo, valor, detalhe, fonte, confianca = "oficial") => ({ id, rotulo, valor, detalhe, confianca, fonte, data: data(fonte) }),
  };
}

function grupoDoSom(c: Contexto, e: Edificio, rua: RuaDoBairro): { grupo: GrupoDaRua; vigentes: number } {
  const vigentes = pertoDe(e.centro, rua.luse.filter((l) => l.vigente).map((l) => l.centro));
  const expiradas = pertoDe(e.centro, rua.luse.filter((l) => !l.vigente).map((l) => l.centro));
  let detalhe: string;
  if (vigentes.length > 0) {
    detalhe = `Bar, casa de show ou evento com som amplificado licenciado; o mais perto a ${formatarDistancia(vigentes[0] ?? 0)}.`;
    if (expiradas.length > 0) detalhe += ` Mais ${plural(expiradas.length, "local", "locais")} com licença expirada.`;
  } else if (expiradas.length > 0) {
    detalhe = `Nenhuma vigente; ${plural(expiradas.length, "local teve", "locais tiveram")} licença de som, hoje expirada.`;
  } else {
    detalhe = "Nenhum local com licença de som no histórico do Licenciamento Ambiental.";
  }
  return {
    vigentes: vigentes.length,
    grupo: {
      id: "som",
      titulo: "Som",
      fatos: [c.fato("rua-luse", "Licenças de som vigentes a 150 m", formatarNumero(vigentes.length), detalhe, "licenciamento_ambiental")],
      nota: "A licença diz quem pode usar som amplificado, não quanto barulho faz; quem toca sem licença não aparece.",
    },
  };
}

function grupoDo156(c: Contexto, rua: RuaDoEdificioLida): GrupoDaRua {
  const linhas: [string, string, [number, number | null]][] = [
    ["rua-156-drenagem", "Pedidos de drenagem (galeria, canaleta)", rua.pedidos156.drenagem],
    ["rua-156-lampada", "Pedidos de lâmpada apagada", rua.pedidos156.lampada],
    ["rua-156-entulho", "Pedidos de remoção de entulho", rua.pedidos156.entulho],
  ];
  const fatos = linhas.map(([id, rotulo, [n, dias]]) => {
    const detalhe = n === 0
      ? "Nenhum pedido a até 150 m."
      : dias === null
        ? "Nenhum marcado como atendido até a publicação."
        : `Mediana de ${plural(dias, "dia", "dias")} até o atendimento.`;
    return c.fato(id, rotulo, formatarNumero(n), detalhe, "central_156");
  });
  return { id: "zeladoria", titulo: "Pedidos ao 156 a 150 m, em 12 meses", fatos, nota: "O 156 mede quem pede o serviço, não a condição da rua." };
}

function grupoDaIluminacao(c: Contexto, e: Edificio, rua: RuaDoBairro): { grupo: GrupoDaRua; desativados: number } {
  const perto = pertoDe(e.centro, rua.iluminacaoDesativada);
  const detalhe = perto.length > 0 ? `O mais perto a ${formatarDistancia(perto[0] ?? 0)}, no cadastro de pontos da Emlurb.` : "Nenhum ponto desativado no cadastro de pontos da Emlurb.";
  return {
    desativados: perto.length,
    grupo: {
      id: "iluminacao",
      titulo: "Iluminação",
      fatos: [c.fato("rua-luz", "Pontos de iluminação desativados a 150 m", formatarNumero(perto.length), detalhe, "iluminacao")],
      nota: null,
    },
  };
}

function grupoDaColeta(c: Contexto, logradouro: RuaDoBairro["logradouros"][string] | undefined): { grupo: GrupoDaRua; resumo: string | null } {
  let fato: FatoDaRua;
  let resumo: string | null = null;
  if (!logradouro || !logradouro.ruaCasada) {
    fato = c.fato("rua-coleta", "Coleta domiciliar na rua", A_CONFIRMAR, "Não achamos a rua no CNEFE para casar com o roteiro.", "coleta", "nao_sabemos");
  } else if (logradouro.coleta.length === 0) {
    fato = c.fato("rua-coleta", "Coleta domiciliar na rua", "Sem roteiro", "A rua não aparece no roteiro publicado pela Emlurb.", "coleta", "nao_sabemos");
  } else {
    const partes = logradouro.coleta.map((r) => [r.turno, r.intervalo, r.frequencia].filter(Boolean).join(", "));
    const [unico] = logradouro.coleta;
    const valor = logradouro.coleta.length === 1 && unico?.turno ? unico.turno.charAt(0).toUpperCase() + unico.turno.slice(1) : `${logradouro.coleta.length} roteiros`;
    const detalhe = logradouro.coleta.length === 1
      ? [unico?.intervalo, unico?.frequencia].filter(Boolean).join(" · ")
      : `A rua aparece em ${logradouro.coleta.length} roteiros: ${partes.join("; ")}.`;
    fato = c.fato("rua-coleta", "Coleta domiciliar na rua", valor, detalhe || null, "coleta");
    resumo = partes[0] ?? null;
  }
  return { resumo, grupo: { id: "coleta", titulo: "Coleta de lixo", fatos: [fato], nota: null } };
}

function grupoDoTransito(c: Contexto, rua: RuaDoEdificioLida): GrupoDaRua {
  const { comVitima, atropelamentos } = rua.sinistros;
  const detalhe = comVitima === 0
    ? "Nenhum chamado com vítima a até 150 m."
    : atropelamentos > 0
      ? `${formatarNumero(atropelamentos)} com pedestre atropelado.`
      : "Nenhum com pedestre atropelado.";
  return {
    id: "transito",
    titulo: "Trânsito",
    fatos: [c.fato("rua-sinistros", "Sinistros com vítima a 150 m", formatarNumero(comVitima), detalhe, "sinistros")],
    nota: "São chamados registrados pela CTTU, com o endereço posto no mapa pelo CNEFE.",
  };
}

function textoDosAnos(porAno: readonly (readonly [number, number])[]): string {
  const anos = porAno.map(([ano]) => String(ano));
  if (anos.length <= 4) return lista(anos);
  return `${anos[0]} a ${anos[anos.length - 1]}, em ${anos.length} anos`;
}

function grupoDaDefesaCivil(
  c: Contexto,
  a: AnaliseV2,
  logradouro: RuaDoBairro["logradouros"][string] | undefined,
  rotuloDaRua: string,
): { grupo: GrupoDaRua; bloco: VisaoDaRua["defesaCivil"] } {
  const dc = logradouro?.defesaCivil ?? null;
  const resposta = a.confirmacoesDaRua?.defesaCivil?.resposta ?? null;
  if (!logradouro?.ruaCasada || !dc) {
    const fato = c.fato("rua-defesa-civil", "Atendimentos da Defesa Civil na rua", A_CONFIRMAR, "Não achamos a rua no CNEFE para casar com os registros.", "defesa_civil", "nao_sabemos");
    return { bloco: null, grupo: { id: "defesa_civil", titulo: "Defesa Civil", fatos: [fato], nota: null } };
  }
  const fatos: FatoDaRua[] = [];
  if (dc.atendimentos === 0) {
    fatos.push(c.fato("rua-defesa-civil", "Atendimentos da Defesa Civil na rua", "0", "Nenhum atendimento registrado nesta rua do bairro.", "defesa_civil"));
    return { bloco: null, grupo: { id: "defesa_civil", titulo: "Defesa Civil", fatos, nota: null } };
  }
  const ocorrencias = dc.ocorrencias.map(([categoria, n]) => `${formatarNumero(n)} ${ROTULO_DA_OCORRENCIA[categoria]}`);
  fatos.push(
    c.fato(
      "rua-defesa-civil",
      "Atendimentos da Defesa Civil na rua",
      formatarNumero(dc.atendimentos),
      `${lista(ocorrencias)}. O número do imóvel não é publicado: não dá para saber se foi este prédio.`,
      "defesa_civil",
    ),
  );
  if (resposta === "neste_predio") {
    const em = a.confirmacoesDaRua?.defesaCivil?.em;
    fatos.push({
      id: "rua-defesa-civil-predio",
      rotulo: "Atendimento neste prédio",
      valor: "Confirmado por você",
      detalhe: "Peça ao síndico o laudo ou o registro da vistoria.",
      confianca: "declarado",
      fonte: "voce",
      data: em ? `respondido em ${dia(em)}` : "respondido por você",
    });
  }
  return {
    grupo: { id: "defesa_civil", titulo: "Defesa Civil", fatos, nota: null },
    bloco: { rua: dc.grafia ?? rotuloDaRua, atendimentos: dc.atendimentos, anos: textoDosAnos(dc.porAno), resposta },
  };
}

function grupoDoEntorno(c: Contexto, setor: RuaDoBairro["setores"][number] | null): GrupoDaRua {
  const titulo = "Calçada e entorno da quadra";
  const nota = "Percentual dos domicílios do setor censitário em face de quadra com o item, pelo recenseador.";
  if (!setor || setor.domicilios === null || setor.domicilios === 0) {
    const fato = c.fato("rua-censo", "Entorno do setor no Censo", A_CONFIRMAR, setor ? "O setor ficou fora da pesquisa do entorno ou teve o dado suprimido." : "Não achamos o setor censitário do prédio.", "censo_entorno", "nao_sabemos");
    return { id: "entorno", titulo, fatos: [fato], nota: null };
  }
  const total = setor.domicilios;
  const itens: [string, string, number | null][] = [
    ["rua-censo-onibus", "Ponto de ônibus na face da quadra", setor.onibus],
    ["rua-censo-calcada", "Calçada", setor.calcada],
    ["rua-censo-obstaculo", "Obstáculo na calçada", setor.obstaculo],
    ["rua-censo-rampa", "Rampa para cadeirante", setor.rampa],
    ["rua-censo-arvores", "Cinco ou mais árvores na face da quadra", setor.arvores],
  ];
  const fatos = itens.map(([id, rotulo, n]) =>
    n === null
      ? c.fato(id, rotulo, A_CONFIRMAR, "Valor suprimido pelo IBGE neste setor.", "censo_entorno", "nao_sabemos")
      : c.fato(id, rotulo, porcento(n, total), `${formatarNumero(n)} de ${plural(total, "domicílio", "domicílios")} do setor`, "censo_entorno"),
  );
  return { id: "entorno", titulo, fatos, nota };
}

function grupoDaMoradia(c: Contexto, rua: RuaDoBairro, setor: RuaDoBairro["setores"][number] | null): GrupoDaRua | null {
  const area = setor?.areaDePonderacao ? rua.areasDePonderacao.find((x) => x.codigo === setor.areaDePonderacao) : undefined;
  if (!area) return null;
  const umEmCada = area.alugados > 0 ? Math.round(area.domicilios / area.alugados) : null;
  const bairros = area.bairros.map(nomeDoBairro);
  // Com 4 bairros (o máximo guardado) a área pode ter outros: "Parnamirim, Monteiro, Casa Forte, Poço da Panela e vizinhos".
  const regiao = bairros.length === 0 ? "" : bairros.length === 4 ? ` (${bairros.join(", ")} e vizinhos)` : ` (${lista(bairros)})`;
  const detalhe = `${umEmCada ? `Cerca de 1 em cada ${umEmCada} dos` : "Dos"} ${plural(area.domicilios, "domicílio", "domicílios")} da área de ponderação ${area.codigo.slice(7)} do Censo${regiao}. Média da área, não do prédio.`;
  return {
    id: "moradia",
    titulo: "Moradia na região",
    fatos: [c.fato("rua-alugados", "Domicílios alugados", porcento(area.alugados, area.domicilios), detalhe, "censo_amostra")],
    nota: null,
  };
}

/**
 * Fatos da seção "A rua" e as perguntas novas do roteiro. Só com prédio confirmado e com a camada da rua no índice;
 * sem um dos dois, null. `rotuloDaRua` é o endereço já formatado da rua do prédio (para a Defesa Civil sem grafia).
 */
export function analisarRua(a: AnaliseV2, predio: Edificio | null, entrada: EntradaDaRua | null, rotuloDaRua = "a rua do prédio"): AnaliseDaRua | null {
  if (!predio?.rua || !entrada) return null;
  const c = contexto(entrada.fontes);
  const rua = entrada.bairro;
  const doPredio = lerRuaDoEdificio(predio.rua);
  const setor = doPredio.setor !== null ? (rua.setores[doPredio.setor] ?? null) : null;
  const logradouro = rua.logradouros[predio.id.split("-")[0] ?? ""];

  const som = grupoDoSom(c, predio, rua);
  const luz = grupoDaIluminacao(c, predio, rua);
  const coleta = grupoDaColeta(c, logradouro);
  const defesaCivil = grupoDaDefesaCivil(c, a, logradouro, rotuloDaRua);
  const moradia = grupoDaMoradia(c, rua, setor);
  const grupos: GrupoDaRua[] = [
    som.grupo,
    grupoDo156(c, doPredio),
    luz.grupo,
    grupoDoTransito(c, doPredio),
    coleta.grupo,
    defesaCivil.grupo,
    grupoDoEntorno(c, setor),
    ...(moradia ? [moradia] : []),
  ];

  const perguntas: Pergunta[] = [];
  const drenagem = doPredio.pedidos156.drenagem;
  const lampada = doPredio.pedidos156.lampada;
  const sinistros = doPredio.sinistros.comVitima;
  if (som.vigentes > 0) {
    perguntas.push({
      id: "rua-som", titulo: "Como é o som à noite e no fim de semana?",
      pista: `${plural(som.vigentes, "licença de som vigente", "licenças de som vigentes")} a 150 m`,
      textoParaMensagem: "Há bar, casa de show ou evento com som perto do prédio? Como fica o barulho à noite e no fim de semana?",
      origem: "achado", prioridade: "conforto",
    });
  }
  if (drenagem[0] > 0) {
    perguntas.push({
      id: "rua-drenagem", titulo: "A rua acumula água na chuva?",
      pista: `${plural(drenagem[0], "pedido de drenagem", "pedidos de drenagem")} ao 156 em 12 meses`,
      textoParaMensagem: "A rua ou a garagem do prédio acumulam água quando chove forte?",
      origem: "achado", prioridade: "conforto",
    });
  }
  if (luz.desativados > 0 || lampada[0] >= PEDIDOS_DE_LAMPADA_PARA_PERGUNTAR) {
    perguntas.push({
      id: "rua-iluminacao", titulo: "Como é a rua à noite?",
      pista: luz.desativados > 0
        ? `${plural(luz.desativados, "ponto de luz desativado", "pontos de luz desativados")} a 150 m`
        : `${plural(lampada[0], "pedido de lâmpada apagada", "pedidos de lâmpada apagada")} em 12 meses`,
      textoParaMensagem: "Como é a iluminação da rua à noite, no caminho até o prédio?",
      origem: "achado", prioridade: "conforto",
    });
  }
  if (sinistros > 0) {
    perguntas.push({
      id: "rua-travessia", titulo: "Como é atravessar a rua a pé?",
      pista: `${plural(sinistros, "sinistro com vítima", "sinistros com vítima")} a 150 m, ${c.data("sinistros")}`,
      textoParaMensagem: "Como é atravessar a rua a pé perto do prédio? Há faixa ou semáforo?",
      origem: "achado", prioridade: "conforto",
    });
  }
  if (coleta.resumo) {
    perguntas.push({
      id: "rua-coleta", titulo: "Onde o lixo espera a coleta?", pista: `Coleta: ${coleta.resumo}`,
      textoParaMensagem: `Onde o prédio guarda o lixo até a coleta? Pelo roteiro da Emlurb, ela passa na rua: ${coleta.resumo}.`,
      origem: "achado", prioridade: "conforto",
    });
  }
  if (defesaCivil.bloco && defesaCivil.bloco.resposta !== "outro_endereco") {
    perguntas.push({
      id: "rua-defesa-civil", titulo: "A Defesa Civil já esteve no prédio?",
      pista: `${plural(defesaCivil.bloco.atendimentos, "atendimento", "atendimentos")} na rua, ${c.data("defesa_civil")}`,
      textoParaMensagem: "A Defesa Civil já vistoriou o prédio? Se sim, pode enviar o laudo ou o registro?",
      origem: "achado", prioridade: "documentos",
    });
  }

  return { visao: { grupos, defesaCivil: defesaCivil.bloco }, perguntas };
}
