// Nomes de logradouro por extenso, só para o texto acessível (M5, 18/11/2026). O leitor de tela lia "Trv", "Prc" e "Vdo"
// letra por letra. O DESENHO continua com o nome curto, como a Prefeitura publica (decisão A12): nada aqui muda o rótulo
// da rua no mapa, nem o dado.
//
// As tabelas saíram da contagem dos 9.763 nomes de rua da base publicada (versão 62be5d5145e04c7f, 94 bairros e a
// cidade). Só entra o que tem leitura única nessa base; o que é ambíguo fica como está e o leitor de tela soletra:
// "S." (São ou Santo), "D." (Dom ou Dona), "Ref", "Ent", "Ala", "Pr" e as iniciais de nomes de pessoa.

export type GeneroDoLogradouro = "f" | "m";

type Tipo = { readonly extenso: string; readonly genero: GeneroDoLogradouro };

const TIPO = (extenso: string, genero: GeneroDoLogradouro): Tipo => ({ extenso, genero });

/**
 * Tipos de logradouro no começo do nome, como a base os escreve (a chave é a palavra em minúsculas e sem ponto). Entre
 * parênteses, quantos nomes da base começam assim, contando as formas com número ("1Tr", "2ª Trv.").
 */
const TIPOS: Readonly<Record<string, Tipo>> = {
  r: TIPO("Rua", "f"), // R. (7.552), R (16)
  rua: TIPO("Rua", "f"),
  av: TIPO("Avenida", "f"), // Av. (245)
  avenida: TIPO("Avenida", "f"),
  trv: TIPO("Travessa", "f"), // Trv (683), Trv. (54)
  tr: TIPO("Travessa", "f"), // 1Tr (244), 2Tr (174), Tr. (9)…
  trav: TIPO("Travessa", "f"),
  travessa: TIPO("Travessa", "f"),
  prc: TIPO("Praça", "f"), // Prc (96), Prc. (14)
  "prç": TIPO("Praça", "f"), // Prç. (8)
  vdo: TIPO("Viaduto", "m"), // Vdo (14)
  pte: TIPO("Ponte", "f"), // Pte (59)
  bec: TIPO("Beco", "m"), // Bec (24)
  vil: TIPO("Vila", "f"), // Vil (17)
  vila: TIPO("Vila", "f"),
  est: TIPO("Estrada", "f"), // Est. (16), Est (13)
  lgo: TIPO("Largo", "m"), // Lgo (15)
  cor: TIPO("Córrego", "m"), // Cor (15)
  sub: TIPO("Subida", "f"), // Sub (32)
  sb: TIPO("Subida", "f"), // 1Sb (9)
  lad: TIPO("Ladeira", "f"), // Lad (3)
  rod: TIPO("Rodovia", "f"), // Rod (1)
  esc: TIPO("Escadaria", "f"), // Esc (2)
  prq: TIPO("Parque", "m"), // Prq (1)
  diq: TIPO("Dique", "m"), // Diq (1)
  pat: TIPO("Pátio", "m"), // Pat (1): Pátio de São Pedro
  "pátio": TIPO("Pátio", "m"),
  c: TIPO("Cais", "m"), // C (3), C. (2): da Detenção, da Alfândega, do Porto do Recife, Santa Rita, do Apolo
  // "Rio", "Canal", "Praia" e "Bacia" ficam de fora de propósito: "Rio Jaboatão" na base é a Rua Rio Jaboatão (o índice
  // de prédios diz RUA RIO JABOATAO), e dizer "o imóvel fica no Rio Jaboatão" seria errado.
};

/** Tipos que a base também escreve no meio do nome ("Trv da R. Guapua", "Ref Av. Alberto Santos Dumont"). */
const TIPOS_NO_MEIO: Readonly<Record<string, string>> = { "r.": "Rua", "av.": "Avenida", av: "Avenida", "trv.": "Travessa", "tr.": "Travessa", "trav.": "Travessa" };

/**
 * Títulos antes do nome da pessoa, com ou sem ponto na base ("Dr" 259 vezes sem ponto e 17 com). Só valem quando há
 * outra palavra depois e a abreviação começa com maiúscula ou leva ponto: "R. Dos Sem Terra PE" não vira "Padre".
 */
const TITULOS: Readonly<Record<string, string>> = {
  dr: "Doutor",
  dra: "Doutora",
  prof: "Professor",
  profa: "Professora",
  "profª": "Professora",
  cel: "Coronel",
  gov: "Governador",
  des: "Desembargador",
  desemb: "Desembargador",
  eng: "Engenheiro",
  ver: "Vereador",
  sen: "Senador",
  dep: "Deputado",
  gal: "General",
  ten: "Tenente",
  cap: "Capitão",
  sgt: "Sargento",
  brig: "Brigadeiro",
  alm: "Almirante",
  pref: "Prefeito",
  pres: "Presidente",
  min: "Ministro",
  cons: "Conselheiro",
  visc: "Visconde",
  jorn: "Jornalista",
  jor: "Jornalista",
  exp: "Expedicionário",
  comp: "Compositor",
  hist: "Historiador",
  invest: "Investigador",
  adv: "Advogado",
  med: "Médico",
  pe: "Padre",
  sta: "Santa",
  sto: "Santo",
};

/** Só com ponto: sem ele a palavra existe em nomes de verdade ("Del Rey"). */
const TITULOS_SO_COM_PONTO: Readonly<Record<string, string>> = { del: "Delegado" };

const COMECO = /^(?:(\d{1,2})\s*[ªº°]?\s*)?([A-Za-zÀ-ÿ]+)[.,]*\s*(.*)$/;

function meioPorExtenso(resto: string): string {
  const palavras = resto.split(/\s+/).filter((p) => p !== "");
  const saida: string[] = [];
  for (let i = 0; i < palavras.length; i++) {
    const p = palavras[i]!;
    const temProxima = i + 1 < palavras.length;
    const comPonto = p.endsWith(".");
    const chave = (comPonto ? p.slice(0, -1) : p).toLowerCase();
    const maiuscula = p[0] !== p[0]!.toLowerCase();
    // "N S", "N. Sra.", "N. Srª": Nossa Senhora.
    if (temProxima && (p === "N" || p === "N.") && /^(S|Sra|Srª)\.?$/.test(palavras[i + 1]!) && i + 2 < palavras.length) {
      saida.push("Nossa", "Senhora");
      i += 1;
      continue;
    }
    if (temProxima && TIPOS_NO_MEIO[p.toLowerCase()]) {
      saida.push(TIPOS_NO_MEIO[p.toLowerCase()]!);
      continue;
    }
    // Palavra toda em caixa alta e sem ponto é sigla ("PE" é o estado, não "Padre"): fica como está.
    const sigla = !comPonto && p.length >= 2 && p === p.toUpperCase();
    const titulo = temProxima && !sigla && (maiuscula || comPonto) ? (TITULOS[chave] ?? (comPonto ? TITULOS_SO_COM_PONTO[chave] : undefined)) : undefined;
    // A base às vezes traz a abreviação e a palavra juntas ("R. Sgt Sargento Silvino Macêdo"): fica só a palavra.
    if (titulo && palavras[i + 1]!.toLowerCase() === titulo.toLowerCase()) continue;
    saida.push(titulo ?? p);
  }
  return saida.join(" ");
}

export type LogradouroPorExtenso = {
  /** O nome para ser lido em voz alta. */
  readonly nome: string;
  /** O gênero do tipo de logradouro ("na Rua", "no Viaduto"), ou null quando o tipo não foi reconhecido. */
  readonly genero: GeneroDoLogradouro | null;
};

/**
 * O nome do logradouro para o leitor de tela: o tipo por extenso no começo ("Trv" → "Travessa", "1Tr" → "1ª Travessa",
 * "Vdo" → "Viaduto"), os títulos por extenso no meio ("Dr" → "Doutor") e os espaços dobrados desfeitos. Tipo que a
 * tabela não conhece: o nome fica como a base publica.
 */
export function logradouroPorExtenso(nome: string): LogradouroPorExtenso {
  const limpo = nome.trim().replace(/\s+/g, " ");
  const m = COMECO.exec(limpo);
  const tipo = m ? TIPOS[m[2]!.toLowerCase()] : undefined;
  if (!m || !tipo || m[3] === "") return { nome: meioPorExtenso(limpo), genero: null };
  const ordinal = m[1] ? `${m[1]}${tipo.genero === "f" ? "ª" : "º"} ` : "";
  return { nome: `${ordinal}${tipo.extenso} ${meioPorExtenso(m[3]!)}`, genero: tipo.genero };
}

/** Só o nome por extenso (ver `logradouroPorExtenso`). */
export function ruaPorExtenso(nome: string): string {
  return logradouroPorExtenso(nome).nome;
}

/** "na Rua X", "no Viaduto Y"; sem tipo reconhecido, "em Z". */
export function ondeFica(nome: string): string {
  const l = logradouroPorExtenso(nome);
  return `${l.genero === "f" ? "na" : l.genero === "m" ? "no" : "em"} ${l.nome}`;
}
