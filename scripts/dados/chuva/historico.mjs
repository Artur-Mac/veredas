// Histórico de alagamento da rua confirmada do prédio e cruzamento com os catálogos do eSIG (pontos e trechos de 2026).
// Puro: recebe o índice de ruas (observacoes/vinculo.mjs), as feições do eSIG e as observações do livro.
// Quatro fatos que nunca se misturam:
//   ponto_catalogado  — ponto de alagamento do eSIG (posição aproximada ou interseção), sem data de evento;
//   trecho_catalogado — logradouro da camada "Logradouros_Alagamentos_2026" do eSIG, sem critério publicado;
//   ocorrencia_de_rua — atendimento da Defesa Civil "Alagamentos" (via), com data administrativa;
//   imovel_alagado    — atendimento "Imóveis Alagados" na rua (não diz qual imóvel);
// e um quinto, que nenhuma fonte atual traz: bloqueio_observado (interdição/reabertura, modo afetado).
import { vincularRua } from "../observacoes/vinculo.mjs";
import { analisarLogradouro } from "../rua/nucleo.mjs";
import { projetar } from "../rede/grafo.mjs";

export const VERSAO_DO_HISTORICO = "1";

const slugDe = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Segmentos {ax,ay,bx,by} por código oficial (malha trechos-de-logradouros). */
export function segmentosPorCodigo(trechos) {
  const out = new Map();
  for (const f of trechos.features) {
    const c = Number(f.properties.CLOGRACODI);
    if (!f.geometry || !Number.isFinite(c)) continue;
    const ls = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const l of ls) for (let i = 0; i + 1 < l.length; i++) {
      if (!out.has(c)) out.set(c, []);
      out.get(c).push({ ax: l[i][0], ay: l[i][1], bx: l[i + 1][0], by: l[i + 1][1] });
    }
  }
  return out;
}

/** Distância (m) de um ponto ao conjunto de segmentos. */
export function distanciaAosSegmentos(x, y, segs) {
  let m = Infinity;
  for (const s of segs ?? []) m = Math.min(m, projetar(x, y, s.ax, s.ay, s.bx, s.by).metros);
  return m;
}

/**
 * Cruza os pontos de alagamento do eSIG com a malha oficial: bairro pelo polígono, código pelo nome no bairro do
 * polígono, conferido pela distância à rua (≤ toleranciaM). Interseção ou nome que não fecha ficam registrados.
 */
export function cruzarPontos(pontos, indice, segs, { toleranciaM = 60 } = {}) {
  return pontos.features.map((f) => {
    const p = f.properties;
    const [x, y] = f.geometry.coordinates;
    const bairrosDoPoligono = indice.bairrosDoPonto(x, y);
    const bairroDaFonte = slugDe(p.bairro);
    const bairro = bairrosDoPoligono[0] ?? null;
    const v = vincularRua(indice, p.logradouro ?? "", bairro ?? bairroDaFonte);
    const dist = v.codigo !== null ? distanciaAosSegmentos(x, y, segs.get(v.codigo)) : null;
    let estado;
    if (v.codigo === null) estado = `nome_${v.metodo}`;
    else if (dist > toleranciaM) estado = "nome_longe_da_posicao";
    else estado = "vinculado";
    return {
      id: p.id, objectid: p.objectid, logradouro: p.logradouro, trecho: p.trecho ?? null, precisao: p.precisao ?? null,
      bairroDaFonte: p.bairro ?? null, bairroDoPoligono: bairro, bairroConfere: bairro !== null && bairro === bairroDaFonte,
      codigo: estado === "vinculado" ? v.codigo : null, metodo: v.metodo, distanciaM: dist === null ? null : Math.round(dist), estado,
      lon: x, lat: y, camposVazios: ["recorrencia", "n_recorrencia", "mare", "n_mare", "lamina"].filter((k) => p[k] === null || p[k] === undefined || p[k] === ""),
    };
  });
}

/** Cruza os trechos do eSIG: o código existe na malha? o nome confere? em que bairros cai? */
export function cruzarTrechos(trechosEsig, indice) {
  return trechosEsig.features.map((f) => {
    const p = f.properties;
    const c = Number(p.clogracodi);
    const oficial = indice.porCodigo.get(c) ?? null;
    const ls = f.geometry ? (f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates]) : [];
    const bairros = new Set();
    let metros = 0;
    for (const l of ls) for (let i = 0; i + 1 < l.length; i++) {
      const mx = (l[i][0] + l[i + 1][0]) / 2, my = (l[i][1] + l[i + 1][1]) / 2;
      for (const b of indice.bairrosDoPonto(mx, my)) bairros.add(b);
      metros += Math.hypot((l[i + 1][0] - l[i][0]) * 111320 * Math.cos((my * Math.PI) / 180), (l[i + 1][1] - l[i][1]) * 110574);
    }
    const nomeConfere = oficial ? slugDe(oficial.nome) === slugDe(p.nlograconc) || slugDe(oficial.nome).endsWith(slugDe(p.nlograconc)) || slugDe(p.nlograconc).endsWith(slugDe(oficial.nome)) : false;
    return { fid: p.fid, codigo: Number.isFinite(c) ? c : null, nome: p.nlograconc ?? null, codigoNaMalha: Boolean(oficial), nomeConfere, bairros: [...bairros].sort(), metros: Math.round(metros) };
  });
}

/**
 * Observações do livro (via e imóvel) vinculadas a um código de rua no bairro do registro. As de via já trazem
 * `codigoDaRua`; as de imóvel são vinculadas aqui só pelo nome e bairro (sem arestas: não entram em rota).
 */
// Vias secundárias que costumam repetir o nome da rua principal: "Travessa Lemos Torres" não é a "Rua Lemos Torres".
const SECUNDARIAS = new Set(["travessa", "beco", "vila", "passagem", "viela", "escadaria", "corrego", "1a travessa", "2a travessa"]);

/** O tipo de via do registro diverge do oficial de um jeito que indica outra via (travessa × rua)? */
export function tipoDeViaDiverge(ruaDoRegistro, nomeOficial) {
  const a = analisarLogradouro(ruaDoRegistro).classe, b = analisarLogradouro(nomeOficial).classe;
  if (!a || !b || a === b) return false;
  return SECUNDARIAS.has(a) || SECUNDARIAS.has(b);
}

export function vincularObservacoesARuas(observacoes, indice, contagem = {}) {
  const porRua = new Map();
  for (const o of observacoes) {
    if (o.precisaoDoLocal === "lugar_nomeado") continue;
    if (o.tipo === "imovel_alagado" && o.codigoDaRua === undefined) {
      const v = vincularRua(indice, o.rua, slugDe(o.bairro));
      o.codigoDaRua = v.codigo; o.vinculo = `imovel_${v.metodo}`;
    }
    if (o.codigoDaRua === null || o.codigoDaRua === undefined) continue;
    // Histórico só com vínculo que não troca de via: tipo divergente para via secundária fica fora (e contado).
    if (tipoDeViaDiverge(o.rua, indice.porCodigo.get(o.codigoDaRua)?.nome ?? "")) { contagem.tipoDeViaDiverge = (contagem.tipoDeViaDiverge ?? 0) + 1; o.historico = "tipo_de_via_diverge"; continue; }
    contagem.noHistorico = (contagem.noHistorico ?? 0) + 1;
    const k = `${o.codigoDaRua}|${slugDe(o.bairro)}`;
    if (!porRua.has(k)) porRua.set(k, []);
    porRua.get(k).push(o);
  }
  return porRua;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * Leitura de meses e anos de uma lista de observações. Datadas viram "mai/2022"; só com ano viram "2015".
 * `sazonal` só quando a série sustenta: ≥ 4 datas distintas em ≥ 2 anos, e todas dentro de uma janela de ≤ 5 meses.
 */
export function mesesEAnos(obs) {
  const datadas = [...new Set(obs.filter((o) => o.data ?? o.dataAdministrativa).map((o) => (o.data ?? o.dataAdministrativa).slice(0, 7)))].sort();
  const soAno = [...new Set(obs.filter((o) => !(o.data ?? o.dataAdministrativa)).map((o) => o.ano))].sort();
  const anosDatados = new Set(datadas.map((d) => d.slice(0, 4)));
  const rotulos = [...soAno.filter((a) => !anosDatados.has(String(a))).map(String), ...datadas.map((d) => `${MESES[Number(d.slice(5, 7)) - 1]}/${d.slice(0, 4)}`)];
  const ordem = (r) => (r.includes("/") ? `${r.slice(-4)}-${String(MESES.indexOf(r.slice(0, 3)) + 1).padStart(2, "0")}` : `${r}-00`);
  rotulos.sort((a, b) => ordem(a).localeCompare(ordem(b)));
  let sazonal = null;
  const datasDistintas = new Set(obs.map((o) => o.data ?? o.dataAdministrativa).filter(Boolean));
  if (datasDistintas.size >= 4 && anosDatados.size >= 2) {
    const meses = [...new Set(datadas.map((d) => Number(d.slice(5, 7))))].sort((a, b) => a - b);
    const janela = meses.at(-1) - meses[0] + 1;
    if (janela <= 5) sazonal = { de: MESES[meses[0] - 1], ate: MESES[meses.at(-1) - 1] };
  }
  return { rotulos, datas: datasDistintas.size, anos: new Set([...anosDatados, ...soAno.map(String)]).size, sazonal };
}
