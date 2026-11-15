// H1 (NEXT-PROGRAMME): o bloco de chuva só fica se um revisor confirmar pelo menos 3 dos 4 registros que mais sustentam
// consequências de caminho, em até 30 minutos. Este script acha esses registros na camada de chuva ativa e grava a folha
// docs/aplicacao/evaluation-sets/g-rain-h1.csv (sem apagar resposta humana: scripts/dados/folhas.mjs).
//
//   node scripts/dados/chuva/revisao-h1.mjs              gera ou atualiza a folha e imprime o resumo
//   node scripts/dados/chuva/revisao-h1.mjs --decidir    lê as respostas e diz: manter, esconder ou pendente
//
// "Consequência de caminho" = um prédio com um desvio de 3 min ou mais no caminho a pé até mercado, farmácia ou ônibus
// por causa do registro (`predios` da camada). O mesmo registro em vários bairros conta uma vez por prédio.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gravarFolha, lerCsv } from "../folhas.mjs";

const RAIZ = process.cwd();
const FOLHA = join(RAIZ, "docs/aplicacao/evaluation-sets/g-rain-h1.csv");
export const CABECALHO = [
  "posicao", "predios_com_consequencia", "bairros_dos_predios", "data", "episodio", "rua", "bairro", "ocorrencia", "tipo", "trecho_m",
  "caso_g_rain", "mapa", "REVISAO_local_correto(sim/nao/incerto)", "REVISAO_data_do_evento", "REVISAO_modo(pe/veiculo/ambos/incerto)", "REVISAO_minutos", "REVISAO_nota",
];

/** Registros que sustentam consequências de caminho, do que mais pesa ao que menos pesa. */
export function registrosQueSustentam(pacotes) {
  const porRegistro = new Map();
  for (const [bairro, p] of Object.entries(pacotes)) {
    for (const [predio, cenarios] of Object.entries(p.predios ?? {})) {
      for (const o of new Set(cenarios.map((c) => c.o))) {
        const obs = p.observacoes[o];
        if (!obs) continue;
        const chave = [obs.data ?? obs.ano, obs.rua, obs.bairro, obs.ocorrencia].join("|");
        const r = porRegistro.get(chave) ?? { obs, predios: new Set(), bairros: new Set() };
        r.predios.add(predio); r.bairros.add(bairro);
        porRegistro.set(chave, r);
      }
    }
  }
  return [...porRegistro.values()].sort((a, b) => b.predios.size - a.predios.size || String(a.obs.data).localeCompare(String(b.obs.data)));
}

/** Decisão da regra H1 a partir das linhas respondidas. */
export function decidirH1(linhas) {
  const respostas = linhas.map((l) => String(l["REVISAO_local_correto(sim/nao/incerto)"] ?? "").trim().toLowerCase());
  const sim = respostas.filter((r) => r === "sim").length;
  const vazias = respostas.filter((r) => r === "").length;
  const minutos = linhas.map((l) => Number(String(l.REVISAO_minutos ?? "").replace(",", "."))).filter((m) => Number.isFinite(m) && m > 0);
  const total = minutos.reduce((s, m) => s + m, 0);
  if (sim >= 3) return { decisao: "manter", sim, vazias, minutos: total, dentroDoTempo: minutos.length ? total <= 30 : null };
  if (sim + vazias >= 3) return { decisao: "pendente", sim, vazias, minutos: total, dentroDoTempo: null };
  return { decisao: "esconder", sim, vazias, minutos: total, dentroDoTempo: minutos.length ? total <= 30 : null };
}

function pacotesAtivos() {
  const ts = readFileSync(join(RAIZ, "src/dados/recife/chuvaGerado.ts"), "utf8");
  const versao = /VERSAO_DA_CHUVA = "([^"]+)"/.exec(ts)[1];
  const arquivos = Object.fromEntries([...ts.matchAll(/"([a-z-]+)": "(recife\/chuva\/[0-9a-f]+\/[a-z-]+\.json)"/g)].map((m) => [m[1], m[2]]));
  return { versao, pacotes: Object.fromEntries(Object.entries(arquivos).map(([b, c]) => [b, JSON.parse(readFileSync(join(RAIZ, "src/dados", c), "utf8"))])) };
}

function casosDoGRain() {
  const p = join(RAIZ, "docs/aplicacao/evaluation-sets/g-rain.json");
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, "utf8")).casos ?? [];
}

const csv = (linhas) => linhas.map((l) => l.map((x) => `"${String(x ?? "").replaceAll('"', '""')}"`).join(",")).join("\n") + "\n";

function main() {
  if (process.argv.includes("--decidir")) {
    if (!existsSync(FOLHA)) throw new Error("Folha g-rain-h1.csv ausente: rode sem --decidir primeiro.");
    const [cab, ...linhas] = lerCsv(readFileSync(FOLHA, "utf8"));
    const objetos = linhas.map((l) => Object.fromEntries(cab.map((c, i) => [c, l[i]])));
    console.log(JSON.stringify(decidirH1(objetos), null, 1));
    return;
  }
  const { versao, pacotes } = pacotesAtivos();
  const registros = registrosQueSustentam(pacotes);
  const total = registros.reduce((s, r) => s + r.predios.size, 0);
  const casos = casosDoGRain();
  const top = registros.slice(0, 4);
  const linhas = top.map((r, i) => {
    const o = r.obs;
    const caso = casos.find((c) => c.data === o.data && c.rua === o.rua && c.bairro === o.bairro)?.id ?? "";
    const mapa = `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${o.rua}, ${o.bairro}, Recife`)}`;
    return [i + 1, r.predios.size, [...r.bairros].join(" "), o.data ?? o.ano, o.episodio ?? "", o.rua, o.bairro, o.ocorrencia, o.tipo, o.trechoM ?? "", caso, mapa, "", "", "", "", ""];
  });
  const estado = gravarFolha(FOLHA, csv([CABECALHO, ...linhas]));
  const distintos = new Set(registros.flatMap((r) => [...r.predios])).size;
  console.log(JSON.stringify({ camadaDeChuva: versao, registrosComConsequencia: registros.length, consequenciasDeCaminho: total, prediosDistintos: distintos,
    topo4: top.map((r) => ({ predios: r.predios.size, data: r.obs.data, rua: r.obs.rua, bairro: r.obs.bairro, bairrosDosPredios: [...r.bairros] })),
    fracaoNoTopo4: total ? Math.round((top.reduce((s, r) => s + r.predios.size, 0) / total) * 1000) / 1000 : null, folha: estado }, null, 1));
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) main();
