// Consulta Overpass e caixas de bairro, puras e testáveis (VE02.02). Substitui as caixas fixas de
// docs/dados/infra/scripts/10-osm-pois.mjs (latitude perto de −8,8, fora do Recife) e os seletores malformados de
// 12-amenidades.mjs (`amenity["pharmacy"](...)` não é Overpass QL; `["k"~""a"|"b""]` quebra as aspas).
// A via preferida para POIs e rede é o extrato datado do Geofabrik (geofabrik.mjs); isto fica para consultas pontuais.

/** Envelope generoso do município do Recife (graus decimais, WGS84). Uma caixa fora dele é erro, não "zero POIs". */
export const ENVELOPE_DO_RECIFE = { s: -8.16, w: -35.02, n: -7.92, e: -34.85 };

/** Caixa {s, w, n, e} de um Polygon/MultiPolygon GeoJSON (lon, lat), com margem opcional em metros. */
export function caixaDaGeometria(geometria, margemM = 0) {
  let s = Infinity, w = Infinity, n = -Infinity, e = -Infinity;
  const andar = (c) => {
    if (typeof c[0] === "number") {
      const [lon, lat] = c;
      s = Math.min(s, lat); n = Math.max(n, lat); w = Math.min(w, lon); e = Math.max(e, lon);
    } else for (const x of c) andar(x);
  };
  andar(geometria.coordinates);
  if (!Number.isFinite(s)) throw new Error("Geometria sem coordenadas.");
  const dLat = margemM / 110574;
  const dLon = margemM / (111319.49 * Math.cos(((s + n) / 2) * Math.PI / 180));
  return arredondarCaixa({ s: s - dLat, w: w - dLon, n: n + dLat, e: e + dLon });
}

function arredondarCaixa(c) {
  const r = (x) => Math.round(x * 1e6) / 1e6;
  return { s: r(c.s), w: r(c.w), n: r(c.n), e: r(c.e) };
}

/**
 * Recusa caixa invertida, degenerada ou fora do envelope (inclui lat/lon trocados e coordenadas em metros, que caem
 * longe de −8/−35). Devolve a própria caixa para encadear.
 */
export function validarCaixa(c, envelope = ENVELOPE_DO_RECIFE) {
  const nums = [c?.s, c?.w, c?.n, c?.e];
  if (!nums.every(Number.isFinite)) throw new Error("Caixa com coordenada não numérica.");
  if (!(c.s < c.n) || !(c.w < c.e)) throw new Error(`Caixa invertida ou degenerada: ${JSON.stringify(c)}`);
  if (c.s < envelope.s || c.n > envelope.n || c.w < envelope.w || c.e > envelope.e) {
    throw new Error(`Caixa fora do Recife (CRS errado ou lat/lon trocados?): ${JSON.stringify(c)}`);
  }
  return c;
}

const escaparRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\"]/g, "\\$&");

/** `nwr["chave"~"^(a|b)$"](s,w,n,e);` — um seletor por categoria, valores exatos. */
export function seletorOverpass(chave, valores, caixa) {
  if (!/^[a-z_:]+$/.test(chave)) throw new Error(`Chave OSM inválida: ${chave}`);
  if (!Array.isArray(valores) || valores.length === 0) throw new Error("Categoria sem valores.");
  validarCaixa(caixa);
  const alternativas = valores.map(escaparRegex).join("|");
  return `nwr["${chave}"~"^(${alternativas})$"](${caixa.s},${caixa.w},${caixa.n},${caixa.e});`;
}

/** Consulta inteira para várias categorias numa só requisição (menos carga no servidor que uma por categoria). */
export function consultaOverpass(categorias, caixa, { timeoutS = 60 } = {}) {
  const seletores = Object.values(categorias).map(({ key, values }) => seletorOverpass(key, values, caixa));
  return `[out:json][timeout:${timeoutS}];(${seletores.join("")});out center tags;`;
}

/** Caixas dos bairros pedidos a partir do GeoJSON oficial (propriedade EBAIRRNOME, em caixa alta e sem acento). */
export function caixasDosBairros(geojson, nomes, margemM = 0) {
  const dobrar = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
  const resultado = {};
  for (const nome of nomes) {
    const f = geojson.features.find((x) => dobrar(x.properties?.EBAIRRNOME) === dobrar(nome));
    if (!f) throw new Error(`Bairro ${nome} não está no GeoJSON oficial.`);
    resultado[nome] = validarCaixa(caixaDaGeometria(f.geometry, margemM));
  }
  return resultado;
}

/**
 * Coordenada (lon, lat) WGS84 esperada no Recife: "ok", "provavel_crs_errado" (valores de metros, ex.: UTM 25S
 * ~290000/9110000), "lat_lon_trocados" ou "coordenada_fora_da_regiao". Usada antes de normalizar qualquer ponto.
 */
export function classificarCoordenada(lon, lat, envelope = ENVELOPE_DO_RECIFE) {
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return "coordenada_fora_da_regiao";
  if (Math.abs(lon) > 180 || Math.abs(lat) > 90) return "provavel_crs_errado";
  const dentro = (x, y) => y >= envelope.s && y <= envelope.n && x >= envelope.w && x <= envelope.e;
  if (dentro(lon, lat)) return "ok";
  if (dentro(lat, lon)) return "lat_lon_trocados";
  return "coordenada_fora_da_regiao";
}

/**
 * Estado de uma coleta por categorias (ex.: Overpass): todas falharam → "falhou"; alguma falhou → "parcial";
 * nenhuma falhou e nenhuma trouxe elemento → "vazia"; senão "valida". Um "ok" de requisição não basta.
 */
export function resumirCategorias(resultados) {
  const v = Object.values(resultados);
  if (v.length === 0) return { estado: "falhou", motivo: "nenhum_registro_utilizavel" };
  const falhas = v.filter((r) => r.erro).length;
  const elementos = v.reduce((s, r) => s + (r.erro ? 0 : r.total ?? 0), 0);
  if (falhas === v.length) return { estado: "falhou", motivo: "erro_http" };
  if (falhas > 0) return { estado: "parcial", motivo: "erro_http" };
  if (elementos === 0) return { estado: "vazia", motivo: null };
  return { estado: "valida", motivo: null };
}
