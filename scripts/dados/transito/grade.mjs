// Grade compacta de horários programados (VE05.01): um feed GTFS fixado → padrões de parada, perfis de tempo e partidas,
// com calendário e exceções preservados para o aparelho resolver o dia de serviço. Nada de contagem somada de stop_times.
// Semântica (referência GTFS Schedule): horários são do "dia de serviço" no fuso da agência e podem passar de 24:00:00;
// uma viagem só circula numa data se o serviço estiver ativo nela (calendar.txt + calendar_dates.txt).
// pickup_type/drop_off_type = 1 proíbem embarque/desembarque naquela parada. America/Recife não tem horário de verão,
// então "meio-dia menos 12 h" coincide com a meia-noite local.

export const VERSAO_DA_GRADE = "1";
const BOM = String.fromCharCode(0xfeff);

/** "25:07:30" → 90450 segundos do dia de serviço. Vazio ou inválido → null. */
export function segundosGtfs(t) {
  const m = /^(\d{1,3}):([0-5]\d):([0-5]\d)$/.exec((t ?? "").trim());
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
}

/** Linhas de um CSV simples do GTFS (sem aspas com vírgula dentro nos campos usados) → objetos. */
export function tabelaGtfs(texto) {
  if (!texto) return [];
  const t = texto.startsWith(BOM) ? texto.slice(1) : texto;
  const linhas = t.split(/\r?\n/).filter((l) => l.length);
  const cab = dividir(linhas[0]).map((c) => c.trim());
  return linhas.slice(1).map((l) => { const v = dividir(l); return Object.fromEntries(cab.map((c, i) => [c, (v[i] ?? "").trim()])); });
}
function dividir(l) {
  if (!l.includes('"')) return l.split(",");
  const out = []; let cur = "", q = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out;
}

const DIAS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/**
 * Compacta o feed. `ler(nome)` devolve o texto do arquivo ou null. `nomeDaParada(stop, idx)` pode trocar o nome exibido
 * (ex.: código numérico → rua). Viagens sem serviço no calendário, com horário faltando ou com tempo voltando atrás vão
 * para `descartes` com o motivo — nunca entram na grade.
 */
export function compactarFeed(ler, { nomeDaParada = (s) => s.stop_name } = {}) {
  const info = tabelaGtfs(ler("feed_info.txt"))[0] ?? {};
  const agencias = tabelaGtfs(ler("agency.txt"));
  const fusos = [...new Set(agencias.map((a) => a.agency_timezone).filter(Boolean))];
  const rotasGtfs = tabelaGtfs(ler("routes.txt"));
  const viagensGtfs = tabelaGtfs(ler("trips.txt"));
  const calendario = tabelaGtfs(ler("calendar.txt"));
  const datas = tabelaGtfs(ler("calendar_dates.txt"));
  const paradasGtfs = tabelaGtfs(ler("stops.txt"));

  // Serviços: calendar.txt e serviços que só existem em calendar_dates.txt.
  const servicos = { id: [], dias: [], de: [], ate: [] };
  const idxServico = new Map();
  const servico = (id) => {
    if (!idxServico.has(id)) { idxServico.set(id, servicos.id.length); servicos.id.push(id); servicos.dias.push(0); servicos.de.push(0); servicos.ate.push(0); }
    return idxServico.get(id);
  };
  for (const c of calendario) {
    const i = servico(c.service_id);
    servicos.dias[i] = DIAS.reduce((m, d, k) => m | (c[d] === "1" ? 1 << k : 0), 0);
    servicos.de[i] = Number(c.start_date); servicos.ate[i] = Number(c.end_date);
  }
  const excecoes = datas.map((d) => [Number(d.date), servico(d.service_id), Number(d.exception_type)])
    .filter(([d, , t]) => Number.isInteger(d) && (t === 1 || t === 2)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  // Paradas: só as de embarque (location_type 0/vazio) entram na grade; estações-pai ficam como agrupamento.
  const idxParada = new Map();
  const paradas = { id: [], n: [], x: [], y: [], pai: [] };
  const paiPorId = new Map(paradasGtfs.filter((s) => s.location_type === "1").map((s) => [s.stop_id, s]));
  for (const s of paradasGtfs) {
    if (s.location_type && s.location_type !== "0") continue;
    const lon = Number(s.stop_lon), lat = Number(s.stop_lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat) || s.stop_lon === "" || s.stop_lat === "") continue;
    idxParada.set(s.stop_id, paradas.id.length);
    paradas.id.push(s.stop_id);
    paradas.n.push(nomeDaParada(s, paradas.id.length - 1, paiPorId.get(s.parent_station) ?? null));
    paradas.x.push(Math.round(lon * 1e5)); paradas.y.push(Math.round(lat * 1e5));
    paradas.pai.push(s.parent_station || null);
  }

  const idxLinha = new Map();
  const linhas = { id: [], c: [], n: [], m: [] };
  for (const r of rotasGtfs) {
    idxLinha.set(r.route_id, linhas.id.length);
    linhas.id.push(r.route_id); linhas.c.push(r.route_short_name || r.route_id); linhas.n.push(r.route_long_name || ""); linhas.m.push(Number(r.route_type));
  }
  const viagemInfo = new Map(viagensGtfs.map((t) => [t.trip_id, t]));

  // stop_times: varredura linear do texto (o arquivo do Recife tem ~200 MB).
  const st = ler("stop_times.txt");
  const porViagem = new Map();
  let p = st.startsWith(BOM) ? 1 : 0;
  let fim = st.indexOf("\n", p);
  const cab = st.slice(p, fim).trim().split(",");
  const ci = (n) => cab.indexOf(n);
  const [cT, cA, cD, cS, cQ, cP, cO] = ["trip_id", "arrival_time", "departure_time", "stop_id", "stop_sequence", "pickup_type", "drop_off_type"].map(ci);
  p = fim + 1;
  const descartes = { semServico: 0, semViagem: 0, paradaDesconhecida: 0, horarioFaltando: 0, tempoVoltando: 0, curta: 0 };
  while (p < st.length) {
    fim = st.indexOf("\n", p); if (fim < 0) fim = st.length;
    const l = st.slice(p, fim).replace(/\r$/, ""); p = fim + 1;
    if (!l) continue;
    const v = l.split(",");
    const t = v[cT];
    let a = porViagem.get(t);
    if (!a) { a = []; porViagem.set(t, a); }
    a.push([Number(v[cQ]), v[cS], segundosGtfs(v[cA]), segundosGtfs(v[cD]), cP >= 0 ? Number(v[cP] || 0) : 0, cO >= 0 ? Number(v[cO] || 0) : 0]);
  }

  // Agrupa por padrão (linha, sentido, paradas, bandeiras) e, dentro dele, por perfil de tempos relativos.
  const padroes = new Map();
  for (const [tripId, a] of porViagem) {
    const t = viagemInfo.get(tripId);
    if (!t) { descartes.semViagem += 1; continue; }
    if (!idxServico.has(t.service_id)) { descartes.semServico += 1; continue; }
    a.sort((x, y) => x[0] - y[0]);
    if (a.length < 2) { descartes.curta += 1; continue; }
    if (a.some((x) => !idxParada.has(x[1]))) { descartes.paradaDesconhecida += 1; continue; }
    // GTFS: horários podem faltar em paradas não "timepoint"; aqui não há interpolação — a viagem sai inteira.
    if (a.some((x) => x[2] === null || x[3] === null)) { descartes.horarioFaltando += 1; continue; }
    let ok = true;
    for (let i = 0; i < a.length; i++) { if (a[i][3] < a[i][2] || (i && a[i][2] < a[i - 1][3])) { ok = false; break; } }
    if (!ok) { descartes.tempoVoltando += 1; continue; }
    const linha = idxLinha.get(t.route_id);
    const sentido = t.direction_id === "1" ? 1 : 0;
    const paradasDaViagem = a.map((x) => idxParada.get(x[1]));
    const bandeiras = a.map((x) => (x[4] === 1 ? 1 : 0) | (x[5] === 1 ? 2 : 0));
    const chaveP = `${linha}|${sentido}|${paradasDaViagem.join(".")}|${bandeiras.join("")}`;
    let pd = padroes.get(chaveP);
    if (!pd) { pd = { linha, sentido, paradas: paradasDaViagem, bandeiras, perfis: new Map() }; padroes.set(chaveP, pd); }
    const t0 = a[0][3];
    // Perfil: chegada e partida relativas (dwell preservado: chegada ≤ partida em cada parada).
    const rel = [];
    for (const x of a) rel.push(x[2] - t0, x[3] - t0);
    const chaveF = rel.join(",");
    let pf = pd.perfis.get(chaveF);
    if (!pf) { pf = { rel, viagens: [] }; pd.perfis.set(chaveF, pf); }
    pf.viagens.push([t0, idxServico.get(t.service_id), tripId]);
  }

  // Rota da grade = (padrão, perfil): viagens FIFO por construção (mesmos tempos relativos). Padrões guardados uma vez.
  const listaDePadroes = [];
  const rotas = [];
  const idsDeViagem = [];
  for (const pd of padroes.values()) {
    const q = listaDePadroes.length;
    const pad = { l: pd.linha, s: pd.sentido, p: delta(pd.paradas) };
    if (pd.bandeiras.some((b) => b)) pad.f = pd.bandeiras;
    listaDePadroes.push(pad);
    for (const pf of pd.perfis.values()) {
      pf.viagens.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
      const temDwell = pf.rel.some((v, i) => i % 2 === 1 && v !== pf.rel[i - 1]);
      // Tempos: deltas de partida entre paradas consecutivas; com dwell, pares [chegada, partida] em delta corrido.
      const tempos = [];
      if (temDwell) for (let i = 0; i < pf.rel.length; i++) tempos.push(i ? pf.rel[i] - pf.rel[i - 1] : pf.rel[i]);
      else for (let i = 1; i < pd.paradas.length; i++) tempos.push(pf.rel[2 * i] - pf.rel[2 * i - 2]);
      const partidas = [];
      let ant = 0;
      for (const [t0] of pf.viagens) { partidas.push(t0 - ant); ant = t0; }
      const r = { q, t: tempos, h: partidas, v: pf.viagens.map((x) => x[1]) };
      if (temDwell) r.d = 1;
      rotas.push(r);
      idsDeViagem.push(pf.viagens.map((x) => x[2]));
    }
  }
  return {
    grade: {
      formato: 1, analisador: VERSAO_DA_GRADE,
      feed: { versao: info.feed_version || null, inicio: info.feed_start_date || null, fim: info.feed_end_date || null, fuso: fusos.length === 1 ? fusos[0] : null, publicador: info.feed_publisher_name || null },
      paradas: { n: paradas.n, x: delta(paradas.x), y: delta(paradas.y) },
      servicos, excecoes, linhas: { c: linhas.c, n: linhas.n, m: linhas.m }, padroes: listaDePadroes, rotas,
    },
    // Fora do pacote: ids originais para auditoria e reprodução manual.
    auditoria: { paradas: paradas.id, pais: paradas.pai, linhas: linhas.id, viagens: idsDeViagem, fusos },
    descartes,
    contagens: { viagens: [...porViagem.keys()].length, padroes: listaDePadroes.length, rotas: rotas.length, paradas: paradas.id.length, servicos: servicos.id.length, excecoes: excecoes.length },
  };
}

/** [10, 12, 11] → [10, 2, -1]. */
export function delta(a) {
  const out = new Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = i ? a[i] - a[i - 1] : a[i];
  return out;
}
