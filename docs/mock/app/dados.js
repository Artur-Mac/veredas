export const IDS_DOSSIES = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];

export async function carregarDossies() {
  const lidos = await Promise.all(IDS_DOSSIES.map(async (id) => {
    const resposta = await fetch(`dossies/${id}.json`);
    if (!resposta.ok) throw new Error(`dossies/${id}.json respondeu ${resposta.status}`);
    return resposta.json();
  }));
  return new Map(lidos.map((dossie) => [dossie.id, dossie]));
}

export async function carregarCreditos() {
  const resposta = await fetch("creditos.json");
  if (!resposta.ok) throw new Error(`creditos.json respondeu ${resposta.status}`);
  return resposta.json();
}

export const NOMES_DE_MOVIMENTO = {
  cota_inicial: "Cota inicial",
  dossie: "Dossiê",
  confirmacao_lote: "Confirmação do lote",
  feedback_pos_visita: "Feedback pós-visita",
  motivo_descarte: "Motivo do descarte",
};

export const COMO_GANHAR = [
  ["map-pin", "confirmacao_lote", 1],
  ["message-circle", "feedback_pos_visita", 1],
  ["square-x", "motivo_descarte", 1],
];

export function resumoDosCreditos(creditos) {
  const soma = (filtro) => creditos.extrato.filter(filtro).reduce((total, m) => total + m.delta, 0);
  return {
    disponiveis: soma(() => true),
    cotaInicial: soma((m) => m.tipo === "cota_inicial"),
    ganhos: soma((m) => m.delta > 0 && m.tipo !== "cota_inicial"),
    usados: -soma((m) => m.delta < 0),
  };
}

const CHAVE = "vereda-mock";

function lerTudo() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || "{}");
  } catch {
    return {};
  }
}

export const aparelho = {
  ler(chave, padrao) {
    const tudo = lerTudo();
    return chave in tudo ? tudo[chave] : padrao;
  },
  gravar(chave, valor) {
    const tudo = lerTudo();
    tudo[chave] = valor;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(tudo));
    } catch {
      return;
    }
  },
  apagarTudo() {
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      return;
    }
  },
};

export const ROTULOS = {
  registro_oficial: "registro oficial",
  declarado: "declarado pelo anunciante",
  inferencia: "inferência ou sinal exploratório",
  nao_sabemos: "não sabemos",
};

export const TEXTO_ILUSTRATIVO = "dado ilustrativo, pendente de fonte";
export const TEXTO_ROTAS = "abre no app de mapas que você escolher; o Vereda não calcula tempo";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function maiuscula(texto) {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : texto;
}

export function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  if (!dia) return `${MESES[Number(mes) - 1]}/${ano}`;
  return `${dia}/${mes}/${ano}`;
}

export function formatarDiaMes(iso) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export function hojeIso() {
  const agora = new Date();
  const dois = (n) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

export function formatarNumero(valor, casas = 0) {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function formatarReais(valor) {
  return `R$ ${formatarNumero(Math.round(valor))}`;
}

export function formatarDistancia(metros) {
  if (metros < 1000) return `${formatarNumero(Math.round(metros / 10) * 10)} m`;
  const km = Math.round(metros / 100) / 10;
  return `${formatarNumero(km, Number.isInteger(km) ? 0 : 1)} km`;
}

export function tipoDoDossie(dossie) {
  return dossie.tipo === "aluguel" ? "Aluguel" : "Compra";
}

export function enderecoDoDossie(dossie) {
  const { logradouro, numero } = dossie.endereco;
  return numero ? `${logradouro}, ${numero}` : logradouro;
}

export function todosOsFatos(dossie) {
  const fatos = Object.values(dossie.anuncio.campos);
  for (const secao of dossie.secoes) fatos.push(...secao.fatos);
  return fatos;
}

export function acharFato(dossie, idFato) {
  if (idFato === "regua") return reguaComoFato(dossie);
  return todosOsFatos(dossie).find((fato) => fato.id === idFato) || null;
}

export function reguaComoFato(dossie) {
  const regua = dossie.preco.regua;
  return {
    id: "regua",
    rotulo: regua.rotulo,
    valor: regua.valor_anuncio,
    unidade: regua.unidade,
    texto: regua.frase,
    fonte: regua.fonte,
    escala: regua.escala,
    ilustrativo: regua.ilustrativo,
    estado: "padrao",
    motivo_nao_sabemos: null,
    regua,
  };
}

export function secaoDoFato(dossie, idFato) {
  return dossie.secoes.find((secao) => secao.fatos.some((fato) => fato.id === idFato)) || null;
}

export function secao(dossie, id) {
  return dossie.secoes.find((s) => s.id === id) || null;
}

export function fato(dossie, idSecao, idFato) {
  const s = secao(dossie, idSecao);
  return s ? s.fatos.find((f) => f.id === idFato) || null : null;
}

export function semente(texto) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  let estado = h >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function distanciaMetros([lon1, lat1], [lon2, lat2]) {
  const r = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function metrosParaCoordenada([lon0, lat0], x, y) {
  const lat = lat0 - y / 110540;
  const lon = lon0 + x / (111320 * Math.cos(lat0 * Math.PI / 180));
  return [lon, lat];
}

export function linkDoMapa([lon, lat], rotulo, origem) {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (ios) {
    const partida = origem ? `source=${origem[1]},${origem[0]}&` : "";
    return `https://maps.apple.com/directions?${partida}destination=${lat},${lon}&mode=`;
  }
  return `geo:0,0?q=${lat},${lon}(${encodeURIComponent(rotulo)})`;
}

export function h(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
