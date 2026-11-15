// VE05.03 / issue I01 do VE00 — "corredor de ônibus" passa a usar partidas reais num dia útil típico do GTFS fixado,
// resolvido pelo calendário (calendar + calendar_dates), em vez da soma de stop_times de dia útil + sábado + domingo.
// Mantém o limiar (≥ 180 partidas), a caixa do Recife, a exclusão de paradas de metrô/VLT e a deduplicação por célula de
// ~75 m do script original; muda só a unidade, que agora é de fato "partidas no dia".
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/dados/transito/corredores.mjs --aplicar --relatorio <json>
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prepararGrade, servicosAtivos } from "../../../src/dados/transito/roteador.ts";

export const DIA_UTIL_DE_REFERENCIA = "2026-11-17";
export const LIMIAR_PARTIDAS = 180;
const CAIXA = (lo, la) => lo >= -35.03 && lo <= -34.86 && la >= -8.165 && la <= -7.93;

/** Partidas (embarque permitido, sem contar a última parada) por parada na data de serviço `iso`. */
export function partidasNoDia(g, iso) {
  const ativos = servicosAtivos(g, iso);
  const n = new Int32Array(g.n);
  for (const r of g.rotas) {
    const pd = g.padroes[r.padrao];
    let viagens = 0;
    for (let j = 0; j < r.servicos.length; j++) if (ativos[r.servicos[j]]) viagens += 1;
    if (!viagens) continue;
    for (let i = 0; i < pd.paradas.length - 1; i++) if (!(pd.bandeiras && pd.bandeiras[i] & 1)) n[pd.paradas[i]] += viagens;
  }
  return n;
}

/** [lon, lat, partidas no dia útil] com a mesma deduplicação do script de camadas (maior volume por célula). */
export function corredoresDoDiaUtil(g, iso = DIA_UTIL_DE_REFERENCIA) {
  const dep = partidasNoDia(g, iso);
  const ferro = new Set();
  for (const pd of g.padroes) if ([0, 1, 2].includes(g.bruta.linhas.m[pd.linha])) for (const p of pd.paradas) ferro.add(p);
  const lista = [];
  for (let i = 0; i < g.n; i++) {
    const lo = Math.round(g.lon[i] * 1e5) / 1e5, la = Math.round(g.lat[i] * 1e5) / 1e5;
    if (ferro.has(i) || !CAIXA(lo, la) || dep[i] < LIMIAR_PARTIDAS) continue;
    lista.push([lo, la, dep[i]]);
  }
  const vistas = new Set();
  const out = [];
  for (const c of lista.sort((a, b) => b[2] - a[2] || a[0] - b[0] || a[1] - b[1])) {
    const k = `${Math.round(c[0] * 1350)},${Math.round(c[1] * 1350)}`;
    if (vistas.has(k)) continue;
    vistas.add(k);
    out.push(c);
  }
  return out.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

const distancia = (a, b) => {
  const r = 6371008.8, rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
};
const proximo = (centro, corredores) => {
  let m = Infinity;
  for (const [lo, la] of corredores) if (Math.abs(lo - centro[0]) <= 0.004 && Math.abs(la - centro[1]) <= 0.004) m = Math.min(m, distancia(centro, [lo, la]));
  return m;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const RAIZ = process.cwd();
  const v = /VERSAO_DO_TRANSITO = "([^"]+)"/.exec(readFileSync(join(RAIZ, "src/dados/recife/transitoGerado.ts"), "utf8"))[1];
  const g = prepararGrade(JSON.parse(readFileSync(join(RAIZ, `src/dados/recife/transito/${v}/grade.json`), "utf8")));
  const novos = corredoresDoDiaUtil(g);
  const arq = join(RAIZ, "src/dados/recife/camadas-ambientais.json");
  const texto = readFileSync(arq, "utf8");
  const camadas = JSON.parse(texto);
  const antigos = camadas.ruidoCorredores.corredoresOnibus;
  // Prédios do piloto: quantos mudam no limiar de 160 m usado pela síntese da rua.
  const dir = /DIRETORIO_DO_INDICE = "([^"]+)"/.exec(readFileSync(join(RAIZ, "src/dados/recife/publicacaoGerada.ts"), "utf8"))[1];
  const piloto = {};
  for (const a of ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"]) {
    const ix = JSON.parse(readFileSync(join(RAIZ, `src/dados/recife/${dir}/${a}.json`), "utf8"));
    const c = { predios: 0, antes: 0, depois: 0, perderam: 0, ganharam: 0 };
    for (const e of ix.edificios) {
      c.predios += 1;
      const x = proximo(e.centro, antigos) <= 160, y = proximo(e.centro, novos) <= 160;
      c.antes += x; c.depois += y; c.perderam += x && !y; c.ganharam += !x && y;
    }
    piloto[a] = c;
  }
  const relatorio = { diaUtil: DIA_UTIL_DE_REFERENCIA, limiar: LIMIAR_PARTIDAS, grade: v, feed: g.bruta.feed.versao,
    antes: { corredores: antigos.length, unidade: "linhas de stop_times somando dia útil, sábado e domingo (feed não fixado)" },
    depois: { corredores: novos.length, unidade: `partidas programadas em ${DIA_UTIL_DE_REFERENCIA} (terça sem exceção)` },
    piloto160m: piloto };
  if (process.argv.includes("--aplicar")) {
    camadas.ruidoCorredores.fonte = `Grande Recife Consórcio de Transporte / CBTU Metrô do Recife (GTFS oficial ${g.bruta.feed.versao}; corredores = paradas com ≥ ${LIMIAR_PARTIDAS} partidas programadas num dia útil típico)`;
    camadas.ruidoCorredores.corredoresOnibus = novos;
    writeFileSync(`${arq}.tmp`, JSON.stringify(camadas)); renameSync(`${arq}.tmp`, arq);
    relatorio.aplicado = true;
  }
  const i = process.argv.indexOf("--relatorio");
  if (i > 0) writeFileSync(process.argv[i + 1], JSON.stringify(relatorio, null, 1) + "\n");
  console.log(JSON.stringify(relatorio, null, 1));
}
