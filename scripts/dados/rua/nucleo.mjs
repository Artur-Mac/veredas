// Núcleo puro das camadas "A rua" (v1.1): nomes de rua, geocodificador local pelo CNEFE 2022 do IBGE, leitura das
// linhas de cada base (Licenciamento Ambiental, Central 156, sinistros da CTTU, Defesa Civil, roteiro de coleta,
// Censo) e leitura de ZIP e XLSX sem dependências.
//
// Nada aqui importa módulo, lê arquivo, usa rede ou relógio. O que precisa de zlib recebe a função de fora. Por isso
// os testes (tests/rua-nucleo.test.ts) leem este arquivo como texto, tiram os `export` e avaliam as funções.
//
// Regras de privacidade que moram aqui:
// - CNEFE: só as colunas de COLUNAS_DO_CNEFE saem da leitura; complemento (NOM_COMP_ELEM*, VAL_COMP_ELEM*), nome do
//   estabelecimento e código único do endereço nunca entram em objeto nenhum.
// - Defesa Civil: o número do imóvel vem mascarado na publicação ("Rua das Gracas, ?_$."). Ele nunca é lido nem
//   decifrado; o casamento é só por rua e bairro.

// ——— Texto e números ——————————————————————————————————————————————————————————————

/** Minúsculas, sem acento e com espaços simples: serve só para comparar. */
export function dobrar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function limpar(texto) {
  return String(texto ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

export function soDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

/**
 * Decimal do portal: ora número, ora texto com vírgula ("-8,0826"), ora com ponto. Com vírgula, o ponto é separador
 * de milhar. Vazio e inválido viram null, nunca 0.
 */
export function numeroDecimal(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (valor === null || valor === undefined) return null;
  let t = String(valor).trim();
  if (t === "") return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Primeiro número inteiro positivo do texto ("719", "719A", "719 - fundos"), ou null ("SN", "S/N", vazio). */
export function numeroDoImovel(valor) {
  const achado = /^\s*(\d{1,6})/.exec(String(valor ?? ""));
  if (!achado) return null;
  const n = Number(achado[1]);
  return n > 0 ? n : null;
}

export function ordemTexto(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function arredondar(n, casas) {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
}

/** Interpolação linear entre vizinhos, como o padrão do numpy. `ordenados` já vem em ordem crescente. */
export function percentil(ordenados, p) {
  const n = ordenados.length;
  if (n === 1) return ordenados[0];
  const pos = p * (n - 1);
  const i = Math.floor(pos);
  if (i >= n - 1) return ordenados[n - 1];
  return ordenados[i] + (pos - i) * (ordenados[i + 1] - ordenados[i]);
}

export function mediana(valores) {
  const o = valores.slice().sort((a, b) => a - b);
  return o.length ? percentil(o, 0.5) : null;
}

/** Valor mais frequente; empate vai para o menor, para a saída não depender da ordem de leitura. */
export function moda(valores) {
  const contagem = new Map();
  for (const v of valores) {
    if (v === null || v === undefined) continue;
    contagem.set(v, (contagem.get(v) ?? 0) + 1);
  }
  let melhor = null;
  let max = 0;
  for (const [v, c] of contagem) {
    if (c > max || (c === max && v < melhor)) {
      melhor = v;
      max = c;
    }
  }
  return melhor;
}

export function haversineM(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Região generosa do Recife; coordenada fora dela é tratada como ausente. */
const REGIAO = { latMin: -8.35, latMax: -7.75, lonMin: -35.2, lonMax: -34.75 };

/** { lon, lat } ou null se faltar, for (0, 0) ou cair fora do Recife. */
export function coordenadaNoRecife(latBruta, lonBruta) {
  const lat = numeroDecimal(latBruta);
  const lon = numeroDecimal(lonBruta);
  if (lat === null || lon === null || (lat === 0 && lon === 0)) return null;
  if (lat < REGIAO.latMin || lat > REGIAO.latMax || lon < REGIAO.lonMin || lon > REGIAO.lonMax) return null;
  return { lon, lat };
}

/** "2026-01-25T00:00:00" ou "2026-01-25" → "2026-01-25"; qualquer outra coisa → null. */
export function dataIso(valor) {
  const t = String(valor ?? "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

/** Dias entre duas datas AAAA-MM-DD (fim − início), inteiro. */
export function diasEntre(inicio, fim) {
  return Math.round((Date.parse(`${fim}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86_400_000);
}

/** A data AAAA-MM-DD menos `meses` meses mais um dia: início de uma janela de `meses` meses que termina em `fim`. */
export function inicioDaJanela(fim, meses) {
  const [a, m, d] = fim.split("-").map(Number);
  const inicio = new Date(Date.UTC(a, m - 1 - meses, d + 1));
  return inicio.toISOString().slice(0, 10);
}

// ——— Nomes de rua ————————————————————————————————————————————————————————————————

/** Primeira palavra que é tipo de via → classe usada para desempatar ruas homônimas ("Rua X" e "Avenida X"). */
const TIPOS_DE_VIA = new Map([
  ["rua", "rua"], ["r", "rua"],
  ["avenida", "avenida"], ["av", "avenida"], ["ave", "avenida"],
  ["estrada", "estrada"], ["est", "estrada"], ["estr", "estrada"],
  ["travessa", "travessa"], ["tv", "travessa"], ["trav", "travessa"], ["tr", "travessa"],
  ["praca", "praca"], ["pca", "praca"], ["prc", "praca"], ["pc", "praca"], ["praça", "praca"],
  ["alameda", "alameda"], ["al", "alameda"],
  ["largo", "largo"], ["lg", "largo"], ["lgo", "largo"],
  ["rodovia", "rodovia"], ["rod", "rodovia"],
  ["beco", "beco"], ["bc", "beco"],
  ["vila", "vila"], ["vl", "vila"],
  ["ladeira", "ladeira"], ["ld", "ladeira"],
  ["cais", "cais"], ["ponte", "ponte"], ["viaduto", "viaduto"], ["via", "via"], ["passagem", "passagem"],
]);

/** Abreviações de título como aparecem no IPTU, no 156 e na CTTU, pela forma do CNEFE. */
const ABREVIACOES = new Map([
  ["dr", "doutor"], ["dra", "doutora"], ["prof", "professor"], ["profa", "professora"], ["pref", "prefeito"],
  ["gov", "governador"], ["eng", "engenheiro"], ["des", "desembargador"], ["gen", "general"], ["cel", "coronel"],
  ["mal", "marechal"], ["alm", "almirante"], ["pe", "padre"], ["cons", "conselheiro"], ["pres", "presidente"],
  ["sen", "senador"], ["dep", "deputado"], ["ver", "vereador"], ["min", "ministro"], ["cap", "capitao"],
  ["ten", "tenente"], ["maj", "major"], ["sgt", "sargento"], ["visc", "visconde"], ["cmte", "comandante"],
  ["comend", "comendador"], ["jorn", "jornalista"], ["mons", "monsenhor"], ["sto", "santo"], ["sta", "santa"],
  ["sr", "senhor"], ["sra", "senhora"], ["arq", "arquiteto"], ["brig", "brigadeiro"], ["cde", "conde"],
]);

/** Títulos que o CNEFE separa do nome (NOM_TITULO_SEGLOGR), na forma sem acento. Saem da chave "sem título". */
const TITULOS = new Set([
  "doutor", "doutora", "professor", "professora", "sao", "padre", "engenheiro", "conselheiro", "visconde", "barao",
  "santa", "santo", "general", "capitao", "desembargador", "dona", "dom", "coronel", "jornalista", "conde", "presidente",
  "vereador", "governador", "marechal", "tenente", "marques", "major", "frei", "expedicionario", "deputado", "senador",
  "almirante", "sargento", "cabo", "ministro", "monsenhor", "soldado", "compositor", "poeta", "arquiteto", "comendador",
  "conego", "pintor", "cantor", "irma", "pastor", "cantora", "aviador", "escritor", "principe", "maestro", "madre",
  "estudante", "brigadeiro", "senhor", "senhora", "prefeito", "cardeal", "embaixador", "consul", "duque", "reverendo",
  "bacharel", "comandante", "juiz", "delegado", "baronesa", "viscondessa", "condessa", "princesa", "imperador",
  "imperatriz", "mestre", "bispo", "papa", "radialista", "historiador", "academico", "cientista", "reitor",
]);

/** Partículas que um portal escreve e outro não ("Estrada do Encanamento", "EST ENCANAMENTO"). */
const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e", "d"]);

const UNIDADES = ["", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze",
  "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];

/** 1 a 99 por extenso, sem acento ("17" → "dezessete", "48" → "quarenta e oito"); fora disso, o próprio número. */
function porExtenso(n) {
  if (n < 1 || n > 99) return String(n);
  if (n < 20) return UNIDADES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? DEZENAS[d] : `${DEZENAS[d]} e ${UNIDADES[u]}`;
}

/**
 * Nome de rua em três formas para comparar:
 * - `classe`: o tipo de via ("rua", "avenida"...), ou null quando o texto não começa por um;
 * - `completa`: sem acento, sem caixa, sem pontuação, sem o tipo de via, com as abreviações de título por extenso, os
 *   números de 1 a 99 por extenso e sem partículas ("AV DEZESSETE DE AGOSTO" e "AVENIDA 17 DE AGOSTO" →
 *   "dezessete agosto");
 * - `semTitulo`: a completa sem os títulos do começo ("RUA DR SAMUEL LINS" → "samuel lins"), mas nunca vazia.
 * `tipo` (opcional) é o tipo de via quando vem em campo separado, como no CNEFE.
 */
export function analisarLogradouro(texto, tipo = null) {
  let tokens = dobrar(texto).replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean);
  let classe = null;
  if (tipo !== null && tipo !== undefined && String(tipo).trim() !== "") {
    const t = dobrar(tipo).replace(/[^a-z0-9]+/g, " ").trim();
    classe = TIPOS_DE_VIA.get(t) ?? t;
  } else if (tokens.length > 1 && TIPOS_DE_VIA.has(tokens[0])) {
    classe = TIPOS_DE_VIA.get(tokens[0]);
    tokens = tokens.slice(1);
  }
  const expandidos = [];
  for (const t of tokens) {
    const forma = ABREVIACOES.get(t) ?? (/^\d{1,2}$/.test(t) ? porExtenso(Number(t)) : t === "primeiro" ? "um" : t);
    expandidos.push(...forma.split(" "));
  }
  const palavras = expandidos.filter((t) => !PARTICULAS.has(t));
  const completa = palavras.join(" ");
  let i = 0;
  while (palavras.length - i > 1) {
    if (palavras[i] === "nossa" && palavras[i + 1] === "senhora" && palavras.length - i > 2) i += 2;
    else if (TITULOS.has(palavras[i])) i += 1;
    else break;
  }
  return { classe, completa, semTitulo: palavras.slice(i).join(" ") };
}

/**
 * Nomes compatíveis quando um é prefixo do outro, palavra por palavra, e o mais curto tem 2 palavras ou mais
 * ("beira rio" e "beira rio governador eduardo campos"), ou quando o mais curto é o fim do outro e tem 2 palavras ou
 * uma de 6 letras ou mais ("rondon" e "candido rondon"). A igualdade é tratada antes e não passa por aqui.
 */
export function nomesCompativeis(a, b) {
  const pa = a.split(" ").filter(Boolean);
  const pb = b.split(" ").filter(Boolean);
  const [curto, longo] = pa.length <= pb.length ? [pa, pb] : [pb, pa];
  if (curto.length === 0 || curto.length === longo.length) return false;
  const prefixo = curto.length >= 2 && curto.every((p, i) => p === longo[i]);
  const desloc = longo.length - curto.length;
  const sufixo = (curto.length >= 2 || curto[0].length >= 6) && curto.every((p, i) => p === longo[desloc + i]);
  return prefixo || sufixo;
}

/** Distância de edição (Levenshtein) com teto: devolve `teto + 1` assim que passar dele. */
export function distanciaDeEdicao(a, b, teto = 2) {
  if (Math.abs(a.length - b.length) > teto) return teto + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let menor = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      atual.push(v);
      if (v < menor) menor = v;
    }
    if (menor > teto) return teto + 1;
    anterior = atual;
  }
  return anterior[b.length];
}

/** Erro de digitação tolerado: 1 letra em nomes de 8 a 13 letras, 2 em nomes de 14 ou mais. */
function tetoDeDigitacao(nome) {
  return nome.length >= 14 ? 2 : nome.length >= 8 ? 1 : 0;
}

// ——— Grade de pontos (busca por raio) ———————————————————————————————————————————————

const PASSO_DA_GRADE = 0.002; // ~220 m

function celula(lon, lat) {
  return `${Math.floor(lon / PASSO_DA_GRADE)}:${Math.floor(lat / PASSO_DA_GRADE)}`;
}

/** Índice espacial simples: `pontos` é uma lista de objetos com `lon` e `lat`. */
export function criarGrade(pontos) {
  const celulas = new Map();
  pontos.forEach((p, i) => {
    const c = celula(p.lon, p.lat);
    if (!celulas.has(c)) celulas.set(c, []);
    celulas.get(c).push(i);
  });
  return { pontos, celulas };
}

/** Índices dos pontos a até `raioM` metros, com a distância, em ordem de índice. */
export function pontosNoRaio(grade, lon, lat, raioM) {
  const alcance = Math.ceil(raioM / 200) + 1;
  const cx = Math.floor(lon / PASSO_DA_GRADE);
  const cy = Math.floor(lat / PASSO_DA_GRADE);
  const achados = [];
  for (let x = cx - alcance; x <= cx + alcance; x++) {
    for (let y = cy - alcance; y <= cy + alcance; y++) {
      for (const i of grade.celulas.get(`${x}:${y}`) ?? []) {
        const p = grade.pontos[i];
        const d = haversineM(lat, lon, p.lat, p.lon);
        if (d <= raioM) achados.push({ i, d });
      }
    }
  }
  return achados.sort((a, b) => a.i - b.i);
}

// ——— Geocodificador local pelo CNEFE 2022 ————————————————————————————————————————————

/**
 * Colunas do CNEFE que o índice lê (lista branca). Complemento, CEP, quadra, face, nome do estabelecimento e código
 * único do endereço ficam de fora já na leitura.
 */
export const COLUNAS_DO_CNEFE = [
  "COD_SETOR", "DSC_LOCALIDADE", "NOM_TIPO_SEGLOGR", "NOM_TITULO_SEGLOGR", "NOM_SEGLOGR", "NUM_ENDERECO",
  "LATITUDE", "LONGITUDE", "NV_GEO_COORD", "COD_ESPECIE",
];

/** Espécie 1 do CNEFE: domicílio particular. */
export const ESPECIE_DOMICILIO_PARTICULAR = 1;

/**
 * Uma linha do CSV do CNEFE (já separada) → { bairro, tipo, titulo, nome, numero, lon, lat, setor, especie }, só com
 * as colunas da lista branca. `indices` é a posição de cada coluna de COLUNAS_DO_CNEFE no cabeçalho. Sem coordenada
 * válida → null.
 */
export function lerEnderecoDoCnefe(colunas, indices) {
  const v = (nome) => (colunas[indices[nome]] ?? "").trim();
  const posicao = coordenadaNoRecife(v("LATITUDE"), v("LONGITUDE"));
  if (!posicao) return null;
  const setor = soDigitos(v("COD_SETOR")).slice(0, 15);
  return {
    bairro: dobrar(v("DSC_LOCALIDADE")),
    tipo: v("NOM_TIPO_SEGLOGR"),
    titulo: v("NOM_TITULO_SEGLOGR"),
    nome: v("NOM_SEGLOGR"),
    numero: numeroDoImovel(v("NUM_ENDERECO")),
    lon: posicao.lon,
    lat: posicao.lat,
    setor: setor.length === 15 ? setor : null,
    especie: Number(v("COD_ESPECIE")) || null,
  };
}

/**
 * Monta o geocodificador a partir dos endereços do CNEFE (`lerEnderecoDoCnefe`). Uma rua é (bairro, classe, nome
 * completo); cada número guarda a mediana das coordenadas e a moda do setor dos endereços dele.
 */
export function criarGeocodificador(enderecos) {
  const ruas = [];
  const porChave = new Map();
  const pontos = [];
  for (const e of enderecos) {
    const nome = [e.titulo, e.nome].filter(Boolean).join(" ");
    const { classe, completa, semTitulo } = analisarLogradouro(nome, e.tipo);
    if (!completa) continue;
    const chave = `${e.bairro}|${classe ?? ""}|${completa}`;
    let rua = porChave.get(chave);
    if (!rua) {
      rua = { id: ruas.length, bairro: e.bairro, classe, completa, semTitulo, brutos: new Map(), numeros: null, ordenados: null, centro: null };
      ruas.push(rua);
      porChave.set(chave, rua);
    }
    const n = e.numero ?? 0; // 0 = sem número: conta para o centro e o cruzamento, nunca para casar número
    if (!rua.brutos.has(n)) rua.brutos.set(n, []);
    rua.brutos.get(n).push(e);
    pontos.push({ lon: e.lon, lat: e.lat, setor: e.setor, rua: rua.id });
  }
  const indexar = (mapa, chave, rua) => {
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave).push(rua.id);
  };
  const porBairroCompleta = new Map();
  const porBairroSemTitulo = new Map();
  const porCompleta = new Map();
  const porSemTitulo = new Map();
  const ruasDoBairro = new Map();
  for (const rua of ruas) {
    rua.numeros = new Map();
    const todos = [];
    for (const [n, lista] of rua.brutos) {
      todos.push(...lista);
      if (n === 0) continue;
      rua.numeros.set(n, {
        lon: arredondar(mediana(lista.map((x) => x.lon)), 6),
        lat: arredondar(mediana(lista.map((x) => x.lat)), 6),
        setor: moda(lista.map((x) => x.setor)),
      });
    }
    rua.ordenados = [...rua.numeros.keys()].sort((a, b) => a - b);
    rua.centro = { lon: mediana(todos.map((x) => x.lon)), lat: mediana(todos.map((x) => x.lat)) };
    rua.pontos = todos.map((x) => ({ lon: x.lon, lat: x.lat }));
    delete rua.brutos;
    indexar(porBairroCompleta, `${rua.bairro}|${rua.completa}`, rua);
    indexar(porBairroSemTitulo, `${rua.bairro}|${rua.semTitulo}`, rua);
    indexar(porCompleta, rua.completa, rua);
    indexar(porSemTitulo, rua.semTitulo, rua);
    if (!ruasDoBairro.has(rua.bairro)) ruasDoBairro.set(rua.bairro, []);
    ruasDoBairro.get(rua.bairro).push(rua.id);
  }
  return { ruas, porBairroCompleta, porBairroSemTitulo, porCompleta, porSemTitulo, ruasDoBairro, grade: criarGrade(pontos), memoria: new Map() };
}

/** Entre ruas candidatas, a da mesma classe (se houver uma só), senão a única; mais de uma → null. */
function escolherPorClasse(geo, ids, classe) {
  if (ids.length === 1) return geo.ruas[ids[0]];
  const mesma = ids.filter((id) => geo.ruas[id].classe === classe);
  return mesma.length === 1 ? geo.ruas[mesma[0]] : null;
}

/** Entre ruas de bairros diferentes, a única ou a mais perto de `perto` (a até 1,5 km); senão null. */
function escolherPorPerto(geo, ids, classe, perto) {
  const unica = escolherPorClasse(geo, ids, classe);
  if (unica || !perto) return unica;
  let melhor = null;
  let menor = 1500;
  for (const id of ids) {
    const r = geo.ruas[id];
    const d = haversineM(perto.lat, perto.lon, r.centro.lat, r.centro.lon);
    if (d < menor || (d === menor && melhor && id < melhor.id)) {
      menor = d;
      melhor = r;
    }
  }
  return melhor;
}

function acharNoBairro(geo, b, classe, completa, semTitulo) {
  const exata = escolherPorClasse(geo, geo.porBairroCompleta.get(`${b}|${completa}`) ?? [], classe);
  if (exata) return { rua: exata, via: "nome" };
  const semT = escolherPorClasse(geo, geo.porBairroSemTitulo.get(`${b}|${semTitulo}`) ?? [], classe);
  if (semT) return { rua: semT, via: "sem_titulo" };
  const doBairro = geo.ruasDoBairro.get(b).map((id) => geo.ruas[id]);
  const compativeis = doBairro.filter((r) => nomesCompativeis(r.semTitulo, semTitulo));
  const compativel = compativeis.length === 1 ? compativeis[0] : null;
  if (compativel) return { rua: compativel, via: "prefixo" };
  const teto = tetoDeDigitacao(semTitulo);
  if (teto > 0) {
    const parecidas = doBairro.filter((r) => distanciaDeEdicao(r.semTitulo, semTitulo, teto) <= teto);
    const umNomeSo = new Set(parecidas.map((r) => r.semTitulo)).size === 1;
    const parecida = parecidas.length === 1 ? parecidas[0] : umNomeSo ? escolherPorClasse(geo, parecidas.map((r) => r.id), classe) : null;
    if (parecida) return { rua: parecida, via: "digitacao" };
  }
  return { rua: null, via: null };
}

/**
 * Acha a rua do CNEFE de um logradouro escrito por outra base. Com `bairro` (já dobrado, ou o nome como na base),
 * procura nele, nesta ordem: nome completo igual; nome sem título igual; um nome prefixo ou fim do outro
 * (`nomesCompativeis`); um erro de digitação (`distanciaDeEdicao`). Cada passo só vale com uma única rua. Sem nada no
 * bairro, procura na cidade: nome completo e depois sem título, numa rua só ou na mais perto de `perto`.
 * Devolve { rua, via } ou { rua: null, via: null }.
 */
export function acharRua(geo, { logradouro, tipo = null, bairro = null, perto = null }) {
  const { classe, completa, semTitulo } = analisarLogradouro(logradouro, tipo);
  if (!completa) return { rua: null, via: null };
  const b = bairro ? dobrar(bairro) : null;
  if (b && geo.ruasDoBairro.has(b)) {
    // Muitas linhas repetem a mesma rua: o passo dentro do bairro, que não depende de `perto`, fica guardado.
    const chave = `${b}|${classe ?? ""}|${completa}`;
    if (!geo.memoria.has(chave)) geo.memoria.set(chave, acharNoBairro(geo, b, classe, completa, semTitulo));
    const achado = geo.memoria.get(chave);
    if (achado.rua) return achado;
  }
  const naCidade = escolherPorPerto(geo, geo.porCompleta.get(completa) ?? [], classe, perto);
  if (naCidade) return { rua: naCidade, via: "cidade" };
  const naCidadeSemT = escolherPorPerto(geo, geo.porSemTitulo.get(semTitulo) ?? [], classe, perto);
  if (naCidadeSemT) return { rua: naCidadeSemT, via: "cidade" };
  return { rua: null, via: null };
}

/** Diferença máxima de numeração para usar o número vizinho, do mesmo lado da rua (mesma paridade). */
export const MAX_DIFERENCA_DE_NUMERO = 30;
/** Intervalo máximo entre os dois números do mesmo lado que cercam o pedido para interpolar entre eles. */
export const MAX_INTERVALO_PARA_INTERPOLAR = 300;

/** Ruas homônimas de outros bairros a até esta distância são o mesmo logradouro que continua (avenidas longas). */
export const MAX_DISTANCIA_DA_CONTINUACAO_M = 3000;

/** O número numa rua: exato, vizinho do mesmo lado ou interpolado entre os dois do mesmo lado que o cercam. */
function numeroNaRua(rua, n) {
  const exato = rua.numeros.get(n);
  if (exato) return { ...exato, precisao: "numero" };
  let melhor = null;
  let abaixo = null;
  let acima = null;
  for (const m of rua.ordenados) {
    if (m % 2 !== n % 2) continue;
    const d = Math.abs(m - n);
    if (d <= MAX_DIFERENCA_DE_NUMERO && (!melhor || d < melhor.d)) melhor = { m, d };
    if (m < n) abaixo = m;
    else if (m > n && acima === null) acima = m;
  }
  if (melhor) return { ...rua.numeros.get(melhor.m), precisao: "vizinho" };
  if (abaixo === null || acima === null || acima - abaixo > MAX_INTERVALO_PARA_INTERPOLAR) return null;
  const a = rua.numeros.get(abaixo);
  const b = rua.numeros.get(acima);
  const t = (n - abaixo) / (acima - abaixo);
  return {
    lon: arredondar(a.lon + (b.lon - a.lon) * t, 6),
    lat: arredondar(a.lat + (b.lat - a.lat) * t, 6),
    setor: t <= 0.5 ? a.setor : b.setor,
    precisao: "interpolado",
  };
}

/**
 * Rua e número → { lon, lat, setor, via, precisao, rua }. `precisao` é "numero" (o número existe no CNEFE), "vizinho"
 * (o mais próximo do mesmo lado, a até MAX_DIFERENCA_DE_NUMERO) ou "interpolado" (entre o número de baixo e o de cima
 * do mesmo lado, se distarem até MAX_INTERVALO_PARA_INTERPOLAR; o setor é o do mais próximo). O CNEFE parte as ruas
 * longas por bairro: sem o número no trecho achado, procura no trecho de mesmo nome e tipo mais perto (até
 * MAX_DISTANCIA_DA_CONTINUACAO_M), e aí `via` é "continuacao". Sem rua, sem número ou sem posição → null.
 */
export function geocodificar(geo, { logradouro, numero, tipo = null, bairro = null, perto = null }) {
  const n = typeof numero === "number" ? numero : numeroDoImovel(numero);
  if (n === null) return null;
  const { rua, via } = acharRua(geo, { logradouro, tipo, bairro, perto });
  if (!rua) return null;
  const aqui = numeroNaRua(rua, n);
  if (aqui) return { ...aqui, via, rua: rua.id };
  const continuacoes = (geo.porCompleta.get(rua.completa) ?? [])
    .map((id) => geo.ruas[id])
    .filter((r) => r.id !== rua.id && r.classe === rua.classe)
    .map((r) => ({ r, d: haversineM(rua.centro.lat, rua.centro.lon, r.centro.lat, r.centro.lon) }))
    .filter((x) => x.d <= MAX_DISTANCIA_DA_CONTINUACAO_M)
    .sort((a, b) => a.d - b.d || a.r.id - b.r.id);
  for (const { r } of continuacoes) {
    const ali = numeroNaRua(r, n);
    if (ali) return { ...ali, via: "continuacao", rua: r.id };
  }
  return null;
}

/** Distância máxima entre pontos das duas ruas para chamar de cruzamento (esquinas de avenida têm poucos endereços). */
export const MAX_DISTANCIA_DO_CRUZAMENTO_M = 100;

/**
 * Cruzamento de duas ruas (sinistro "AV X com RUA Y", sem número): o meio do par de endereços mais próximos entre as
 * duas, se estiverem a até MAX_DISTANCIA_DO_CRUZAMENTO_M. Devolve { lon, lat, setor: null, via, precisao: "cruzamento" }.
 */
export function geocodificarCruzamento(geo, { logradouro, cruzamento, bairro = null, perto = null }) {
  const a = acharRua(geo, { logradouro, bairro, perto }).rua;
  const b = acharRua(geo, { logradouro: cruzamento, bairro, perto: perto ?? (a ? a.centro : null) }).rua;
  if (!a || !b || a.id === b.id) return null;
  const grade = criarGrade(b.pontos);
  let melhor = null;
  for (const p of a.pontos) {
    for (const { i, d } of pontosNoRaio(grade, p.lon, p.lat, MAX_DISTANCIA_DO_CRUZAMENTO_M)) {
      if (!melhor || d < melhor.d) melhor = { p, q: b.pontos[i], d };
    }
  }
  if (!melhor) return null;
  return {
    lon: arredondar((melhor.p.lon + melhor.q.lon) / 2, 6),
    lat: arredondar((melhor.p.lat + melhor.q.lat) / 2, 6),
    setor: null,
    via: "cruzamento",
    precisao: "cruzamento",
    rua: a.id,
  };
}

/** O endereço do CNEFE mais perto de um ponto, a até `raioM`; serve para dar setor a quem não casou pela rua. */
export function enderecoMaisProximo(geo, lon, lat, raioM) {
  let melhor = null;
  for (const { i, d } of pontosNoRaio(geo.grade, lon, lat, raioM)) {
    const p = geo.grade.pontos[i];
    if (!melhor || d < melhor.d || (d === melhor.d && (p.setor ?? "") < (melhor.p.setor ?? ""))) melhor = { p, d };
  }
  return melhor ? { setor: melhor.p.setor, distancia: melhor.d, rua: melhor.p.rua } : null;
}

// ——— Licenciamento Ambiental: LUSE ——————————————————————————————————————————————————

/**
 * Situação da Licença de Utilização Sonora no histórico do lote (`licenciamento_ambiental`, itens como
 * "Licenciamento vigente - LUSE - LICENÇA UTILIZAÇÃO SONORA - ESTABELECIMENTO"). "vigente" se algum item de LUSE for
 * vigente; "expirada" se só houver LUSE expirada; null sem LUSE (ou só "solicitada", que ainda não é licença).
 */
export function situacaoDaLuse(historico) {
  const texto = dobrar(historico);
  const itens = texto.split(/(?=licenciamento (?:vigente|expirado|\(s\) solicitado))/);
  let expirada = false;
  for (const item of itens) {
    if (!/\bluse\b|utilizacao sonora/.test(item)) continue;
    if (item.startsWith("licenciamento vigente")) return "vigente";
    if (item.startsWith("licenciamento expirado")) expirada = true;
  }
  return expirada ? "expirada" : null;
}

/**
 * Processos do Licenciamento Ambiental → locais com LUSE, um por lote. O mesmo bar renova a licença várias vezes, e
 * cada processo do lote repete o histórico do lote inteiro: 575 linhas com LUSE viram cerca de 140 locais.
 * - Lugar: o `dsqfl` com 14 dígitos (o portal o publica com pontos) ou, sem ele, a coordenada a 5 casas.
 * - Situação: a do processo de `data_entrada` mais recente do lugar (empate: a vigente).
 * - Posição: a coordenada publicada mais recente do lugar ou, sem nenhuma, o centro do lote (`centroPorDsqfl`, mapa
 *   dsqfl → [lon, lat]); sem nenhuma das duas, o lugar fica de fora e conta em `semPosicao`.
 * Devolve { locais, linhasComLuse, semPosicao }, com os locais em ordem de lugar.
 */
export function deduplicarLuse(registros, centroPorDsqfl = new Map()) {
  const lugares = new Map();
  let linhasComLuse = 0;
  for (const r of registros) {
    const situacao = situacaoDaLuse(r.licenciamento_ambiental);
    if (!situacao) continue;
    linhasComLuse++;
    const digitos = soDigitos(r.dsqfl);
    const dsqfl = digitos.length === 14 ? digitos : null;
    const publicada = coordenadaNoRecife(r.latitude, r.longitude);
    const lugar = dsqfl ? `d:${dsqfl}` : publicada ? `c:${publicada.lon.toFixed(5)},${publicada.lat.toFixed(5)}` : null;
    if (!lugar) continue;
    const linha = { situacao, data: dataIso(r.data_entrada) ?? "0000-00-00", publicada, dsqfl };
    if (!lugares.has(lugar)) lugares.set(lugar, []);
    lugares.get(lugar).push(linha);
  }
  const locais = [];
  let semPosicao = 0;
  for (const lugar of [...lugares.keys()].sort()) {
    const linhas = lugares.get(lugar).slice().sort(
      (a, b) => ordemTexto(b.data, a.data) || (a.situacao === b.situacao ? 0 : a.situacao === "vigente" ? -1 : 1),
    );
    const maisRecente = linhas[0];
    const comPosicao = linhas.find((l) => l.publicada);
    const centro = comPosicao
      ? [arredondar(comPosicao.publicada.lon, 6), arredondar(comPosicao.publicada.lat, 6)]
      : maisRecente.dsqfl && centroPorDsqfl.get(maisRecente.dsqfl)
        ? centroPorDsqfl.get(maisRecente.dsqfl)
        : null;
    if (!centro) {
      semPosicao++;
      continue;
    }
    locais.push({
      lugar,
      centro,
      vigente: maisRecente.situacao === "vigente",
      ultimaEntrada: maisRecente.data === "0000-00-00" ? null : maisRecente.data.slice(0, 7),
      processos: linhas.length,
    });
  }
  return { locais, linhasComLuse, semPosicao };
}

// ——— Central 156 da Emlurb ——————————————————————————————————————————————————————

export const CATEGORIAS_DO_156 = ["drenagem", "lampada", "entulho"];

/**
 * Categoria do pedido para "A rua": drenagem (todo o grupo DRENAGEM: galeria, valeta, canaleta, tampa de poço),
 * lâmpada apagada (lâmpada e circuito apagados) e entulho. Os demais serviços ficam de fora (null).
 */
export function categoriaDoPedido(grupo, servico) {
  const g = dobrar(grupo);
  const s = dobrar(servico);
  if (g === "drenagem") return "drenagem";
  if (s === "manutencao em lampada apagada" || s === "acender circuito") return "lampada";
  if (s === "remocao de entulhos") return "entulho";
  return null;
}

/** Dias da demanda até a última situação, só para pedido "ATENDIDA" com as duas datas em ordem; senão null. */
export function diasAteAtender(situacao, demanda, ultimaSituacao) {
  if (dobrar(situacao) !== "atendida") return null;
  const d = dataIso(demanda);
  const u = dataIso(ultimaSituacao);
  if (!d || !u || u < d) return null;
  return diasEntre(d, u);
}

// ——— Sinistros de trânsito da CTTU ————————————————————————————————————————————————

/**
 * Linha da CTTU → { data, ano, comVitima, atropelamento, logradouro, numero, cruzamento, bairro } ou null sem data.
 * Com vítima: natureza "COM VÍTIMA" ou "VÍTIMA FATAL", ou `vitimas` > 0. Atropelamento: pedestre envolvido ou tipo
 * "ATROPELAMENTO". `cruzamento` é o `detalhe_endereco_acidente` quando ele nomeia outra rua.
 */
export function lerSinistro(r) {
  const data = dataIso(r.data);
  if (!data) return null;
  const natureza = dobrar(r.natureza);
  const vitimas = numeroDecimal(r.vitimas) ?? 0;
  const fatais = numeroDecimal(r.vitimasfatais) ?? 0;
  const comVitima = natureza === "com vitima" || natureza === "vitima fatal" || vitimas > 0 || fatais > 0;
  const atropelamento = (numeroDecimal(r.pedestre) ?? 0) > 0 || /atropel/.test(dobrar(r.tipo));
  const logradouro = limpar(r.endereco);
  const detalhe = limpar(r.detalhe_endereco_acidente);
  const cruzamento = /[a-z]{3}/i.test(detalhe) && dobrar(detalhe) !== dobrar(logradouro) ? detalhe : null;
  return {
    data,
    ano: Number(data.slice(0, 4)),
    comVitima,
    atropelamento,
    logradouro,
    numero: numeroDoImovel(r.numero),
    cruzamento,
    bairro: limpar(r.bairro),
  };
}

// ——— Defesa Civil ————————————————————————————————————————————————————————————————

const MESES = new Set(["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]);

function anoDe(...valores) {
  for (const v of valores) {
    const t = String(v ?? "").trim();
    if (/^\d{4}(?:\.0+)?$/.test(t)) return Number(t.slice(0, 4));
    const d = dataIso(t);
    if (d) return Number(d.slice(0, 4));
  }
  return null;
}

/**
 * Linha da Defesa Civil → { ano, bairro, rua, ocorrencia } ou null sem rua. `r` tem as chaves Regional, Ano, Mes,
 * Data, Ocorrencia, Solicitacao, Endereco e Bairro (o chamador unifica a grafia de "Mês").
 * Em parte dos arquivos (2019, 2020 e 2022) as colunas vêm deslocadas: o Ano traz o nome do mês, a rua cai em
 * Solicitacao e a ocorrência em Data. A linha deslocada é reconhecida pelo mês no campo Ano.
 * O número do imóvel vem mascarado na publicação ("Rua das Gracas, ?_$."): fica fora, nunca é lido nem decifrado.
 */
export function lerAtendimentoDaDefesaCivil(r) {
  const deslocada = MESES.has(dobrar(r.Ano));
  const ano = deslocada ? anoDe(r.Regional, r.Mes) : anoDe(r.Ano, r.Data);
  const bruta = deslocada ? String(r.Solicitacao ?? "") : String(r.Endereco ?? "").replace(/,[^,]*$/, "");
  const rua = limpar(bruta.replace(/"/g, " "));
  if (!/[a-z]{3}/i.test(dobrar(rua))) return null;
  return {
    ano,
    bairro: limpar(r.Bairro),
    rua: rua.slice(0, 120),
    ocorrencia: limpar(deslocada ? r.Data : r.Ocorrencia),
  };
}

/** Categoria da ocorrência da Defesa Civil, tolerando a acentuação perdida da publicação ("Imveis com Danos"). */
export function categoriaDaOcorrencia(texto) {
  const t = dobrar(texto);
  if (t === "") return "nao_informada";
  if (/danos|risco/.test(t) && !/rvore/.test(t)) return "danos_ou_risco";
  if (/alag|inunda/.test(t)) return "alagamento";
  if (/desab/.test(t)) return "desabamento";
  if (/inc.?ndio/.test(t)) return "incendio";
  if (/rvore/.test(t)) return "arvore";
  if (/desliz|barreira|encosta|morro/.test(t)) return "deslizamento";
  return "outra";
}

// ——— Roteiro da coleta domiciliar —————————————————————————————————————————————————

const TURNOS = new Map([["manha", "manhã"], ["tarde", "tarde"], ["noturno", "noite"], ["diurno", "dia"]]);
const DIAS = new Map([["seg", "seg"], ["ter", "ter"], ["qua", "qua"], ["qui", "qui"], ["sex", "sex"], ["sab", "sáb"], ["dom", "dom"]]);

function hora(h, m) {
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/**
 * Linha do roteiro → { rua, turno, intervalo, frequencia, setor }, com os textos normalizados para exibir:
 * "MANHÃ" → "manhã", "07:30 à 12:00 hs" → "7h30 às 12h", "TER, QUI, SAB" → "ter, qui e sáb", "DIÁRIA" → "diária".
 */
export function lerRoteiroDeColeta(r) {
  const turno = TURNOS.get(dobrar(r.turno)) ?? (dobrar(r.turno) || null);
  const intervaloBruto = limpar(r.intervalo);
  const faixa = /(\d{1,2}):(\d{2})\s*[aà]s?\s*(\d{1,2}):(\d{2})/i.exec(intervaloBruto);
  const intervalo = faixa ? `${hora(faixa[1], faixa[2])} às ${hora(faixa[3], faixa[4])}` : intervaloBruto || null;
  const freq = dobrar(r.frequencia);
  let frequencia;
  if (freq === "diaria") frequencia = "diária";
  else {
    const dias = freq.split(/[^a-z]+/).filter(Boolean).map((d) => DIAS.get(d.slice(0, 3)) ?? d);
    frequencia = dias.length > 1 ? `${dias.slice(0, -1).join(", ")} e ${dias[dias.length - 1]}` : dias[0] ?? null;
  }
  return { rua: limpar(r.endereco), turno, intervalo, frequencia, setor: limpar(r.setor) };
}

// ——— Censo 2022 ——————————————————————————————————————————————————————————————————

/**
 * Variáveis do arquivo de domicílios do entorno, por setor (dicionário de 07/05/2025): domicílios particulares
 * permanentes ocupados em setor da pesquisa do entorno (V05000) e os em face de quadra com ponto de ônibus (V05015),
 * calçada (V05021), obstáculo na calçada (V05024), rampa para cadeirante (V05027) e 5 ou mais árvores (V05033).
 */
export const VARIAVEIS_DO_ENTORNO = {
  domicilios: "V05000",
  onibus: "V05015",
  calcada: "V05021",
  obstaculo: "V05024",
  rampa: "V05027",
  arvores: "V05033",
};

/** Contagem do Censo: "X" (valor suprimido) e vazio viram null, nunca 0. */
export function contagemDoCenso(valor) {
  const t = String(valor ?? "").replace(/"/g, "").trim();
  return /^\d+$/.test(t) ? Number(t) : null;
}

/** Linha do CSV do entorno (objeto coluna → valor) → { codigo, domicilios, onibus, calcada, obstaculo, rampa, arvores }. */
export function lerSetorDoEntorno(linha) {
  const saida = { codigo: soDigitos(linha.CD_setor ?? linha.CD_SETOR) };
  for (const [nome, variavel] of Object.entries(VARIAVEIS_DO_ENTORNO)) saida[nome] = contagemDoCenso(linha[variavel]);
  return saida;
}

// ——— CSV, ZIP e XLSX ——————————————————————————————————————————————————————————————

/** Leitor de CSV com campos entre aspas (aspas duplicadas e quebra de linha dentro do campo). */
export function lerCsv(texto, separador) {
  const linhas = [];
  let linha = [];
  let campo = "";
  let entreAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else entreAspas = false;
      } else campo += c;
    } else if (c === '"') entreAspas = true;
    else if (c === separador) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      campo = "";
      linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (campo !== "" || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

/**
 * Lê o diretório central de um ZIP (sem ZIP64) e devolve um mapa nome → função que descompacta a entrada.
 * `inflarCru` é `zlib.inflateRawSync`, recebido de fora para este arquivo continuar sem import.
 */
export function lerZip(buffer, inflarCru) {
  let fim = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65_557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      fim = i;
      break;
    }
  }
  if (fim < 0) throw new Error("ZIP sem diretório central");
  const entradas = buffer.readUInt16LE(fim + 10);
  let p = buffer.readUInt32LE(fim + 16);
  const mapa = new Map();
  for (let k = 0; k < entradas; k++) {
    if (buffer.readUInt32LE(p) !== 0x02014b50) throw new Error("ZIP com diretório central inválido");
    const metodo = buffer.readUInt16LE(p + 10);
    const compactado = buffer.readUInt32LE(p + 20);
    const tamanho = buffer.readUInt32LE(p + 24);
    const nomeLen = buffer.readUInt16LE(p + 28);
    const extraLen = buffer.readUInt16LE(p + 30);
    const comentarioLen = buffer.readUInt16LE(p + 32);
    const local = buffer.readUInt32LE(p + 42);
    const nome = buffer.subarray(p + 46, p + 46 + nomeLen).toString("utf8");
    if (compactado === 0xffffffff || tamanho === 0xffffffff || local === 0xffffffff) throw new Error(`ZIP64 não suportado: ${nome}`);
    mapa.set(nome, () => {
      if (buffer.readUInt32LE(local) !== 0x04034b50) throw new Error(`Entrada ZIP inválida: ${nome}`);
      const inicio = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
      const dados = buffer.subarray(inicio, inicio + compactado);
      if (metodo === 0) return Buffer.from(dados);
      if (metodo === 8) return inflarCru(dados);
      throw new Error(`Método de compressão ${metodo} não suportado: ${nome}`);
    });
    p += 46 + nomeLen + extraLen + comentarioLen;
  }
  return mapa;
}

function desescaparXml(texto) {
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/** `xl/sharedStrings.xml` → lista de textos. */
export function textosCompartilhados(xml) {
  const textos = [];
  for (const si of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    textos.push(desescaparXml([...si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")));
  }
  return textos;
}

/**
 * Linhas de uma planilha (`xl/worksheets/sheetN.xml`) como objetos coluna → valor ({ A: "...", B: "..." }).
 * `filtro(xmlDaLinha)` (opcional) descarta a linha antes de ler as células, para planilhas de 100 MB.
 */
export function* linhasDaPlanilha(xml, textos, filtro = null) {
  for (const row of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    if (filtro && !filtro(row[1])) continue;
    const celulas = {};
    for (const c of row[1].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const [, coluna, atributos, corpo] = c;
      if (!corpo) continue;
      const v = /<v>([\s\S]*?)<\/v>/.exec(corpo);
      const inline = /<t[^>]*>([\s\S]*?)<\/t>/.exec(corpo);
      let valor = v ? v[1] : inline ? inline[1] : null;
      if (valor !== null && /t="s"/.test(atributos)) valor = textos[Number(valor)] ?? null;
      else if (valor !== null) valor = desescaparXml(valor);
      celulas[coluna] = valor;
    }
    yield celulas;
  }
}

// ——— Shapefile (malha de setores censitários) ——————————————————————————————————————

/**
 * Tabela .dbf → { campos, ler(i) }, onde `ler(i)` devolve o registro i com só as colunas pedidas em `colunas`
 * (texto sem espaços nas pontas). Codificação UTF-8, como declara o .cpg da malha do IBGE.
 */
export function lerDbf(buffer, colunas) {
  const registros = buffer.readUInt32LE(4);
  const cabecalho = buffer.readUInt16LE(8);
  const tamanho = buffer.readUInt16LE(10);
  const campos = [];
  let deslocamento = 1; // o primeiro byte do registro marca exclusão
  for (let p = 32; p < cabecalho - 1 && buffer[p] !== 0x0d; p += 32) {
    const nome = buffer.subarray(p, p + 11).toString("latin1").replace(/\0.*$/s, "");
    const largura = buffer[p + 16];
    campos.push({ nome, deslocamento, largura });
    deslocamento += largura;
  }
  const pedidos = colunas.map((c) => {
    const campo = campos.find((x) => x.nome === c);
    if (!campo) throw new Error(`DBF sem a coluna ${c}`);
    return campo;
  });
  return {
    registros,
    campos: campos.map((c) => c.nome),
    ler(i) {
      const inicio = cabecalho + i * tamanho;
      const saida = {};
      for (const c of pedidos) saida[c.nome] = buffer.subarray(inicio + c.deslocamento, inicio + c.deslocamento + c.largura).toString("utf8").trim();
      return saida;
    },
  };
}

/**
 * Polígono i de um .shp (tipo 5) pelo índice .shx: { caixa: [minLon, minLat, maxLon, maxLat], aneis: [[[lon, lat], ...]] }.
 * Coordenadas com 6 casas. Registro vazio (tipo 0) → null.
 */
export function lerPoligonoDoShp(shp, shx, i) {
  const posicao = shx.readUInt32BE(100 + i * 8) * 2;
  const conteudo = posicao + 8;
  const tipo = shp.readInt32LE(conteudo);
  if (tipo === 0) return null;
  if (tipo !== 5 && tipo !== 15 && tipo !== 25) throw new Error(`Shapefile com tipo ${tipo} no registro ${i}: esperava polígono`);
  const caixa = [0, 1, 2, 3].map((k) => arredondar(shp.readDoubleLE(conteudo + 4 + k * 8), 6));
  const partes = shp.readInt32LE(conteudo + 36);
  const pontos = shp.readInt32LE(conteudo + 40);
  const inicioDasPartes = conteudo + 44;
  const inicioDosPontos = inicioDasPartes + partes * 4;
  const aneis = [];
  for (let k = 0; k < partes; k++) {
    const de = shp.readInt32LE(inicioDasPartes + k * 4);
    const ate = k + 1 < partes ? shp.readInt32LE(inicioDasPartes + (k + 1) * 4) : pontos;
    const anel = [];
    for (let j = de; j < ate; j++) {
      const q = inicioDosPontos + j * 16;
      anel.push([arredondar(shp.readDoubleLE(q), 6), arredondar(shp.readDoubleLE(q + 8), 6)]);
    }
    aneis.push(anel);
  }
  return { caixa, aneis };
}

/** Ponto dentro de um polígono de vários anéis pela regra par-ímpar (buracos excluídos), como no shapefile. */
export function pontoNoPoligono(lon, lat, aneis) {
  let dentro = false;
  for (const anel of aneis) {
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      const [xi, yi] = anel[i];
      const [xj, yj] = anel[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
    }
  }
  return dentro;
}

/**
 * Localizador de setor: `setores` é uma lista de { codigo, caixa, aneis }. `achar(lon, lat)` devolve o código do setor
 * que contém o ponto (o de menor caixa, se a borda cair em dois), ou null.
 */
export function criarLocalizadorDeSetor(setores) {
  const passo = 0.005;
  const celulas = new Map();
  setores.forEach((s, i) => {
    const [x0, y0, x1, y1] = s.caixa;
    for (let x = Math.floor(x0 / passo); x <= Math.floor(x1 / passo); x++) {
      for (let y = Math.floor(y0 / passo); y <= Math.floor(y1 / passo); y++) {
        const c = `${x}:${y}`;
        if (!celulas.has(c)) celulas.set(c, []);
        celulas.get(c).push(i);
      }
    }
  });
  return {
    achar(lon, lat) {
      let melhor = null;
      for (const i of celulas.get(`${Math.floor(lon / passo)}:${Math.floor(lat / passo)}`) ?? []) {
        const s = setores[i];
        const [x0, y0, x1, y1] = s.caixa;
        if (lon < x0 || lon > x1 || lat < y0 || lat > y1 || !pontoNoPoligono(lon, lat, s.aneis)) continue;
        const area = (x1 - x0) * (y1 - y0);
        if (!melhor || area < melhor.area || (area === melhor.area && s.codigo < melhor.codigo)) melhor = { codigo: s.codigo, area };
      }
      return melhor?.codigo ?? null;
    },
  };
}
