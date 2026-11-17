// Catálogo de destinos do dia a dia (VE04.01): mercado, farmácia, praça/parque e ponto de transporte. Puro.
// Regras: categoria pela etiqueta, não por proximidade de escola ou igreja; local fechado sai (com contagem); um mesmo
// estabelecimento mapeado duas vezes (nó + contorno, OSM + Prefeitura) vira um local canônico; duas lojas da mesma rede
// em endereços diferentes continuam dois locais; horário só quando a fonte informa.

export const VERSAO_DO_CATALOGO = "1";
export const CATEGORIAS = ["mercado", "farmacia", "praca", "transporte"];

const MERCADO = new Set(["supermarket", "convenience", "greengrocer", "grocery", "wholesale", "deli"]);
const FECHADO_CHAVES = ["disused:shop", "disused:amenity", "was:shop", "was:amenity", "abandoned:shop", "abandoned:amenity"];

const dobrar = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Categoria do objeto OSM, ou null. */
export function categoriaOsm(tags) {
  if (!tags) return null;
  if (MERCADO.has(tags.shop) || tags.amenity === "marketplace") return "mercado";
  if (tags.amenity === "pharmacy" || tags.shop === "chemist" || tags.healthcare === "pharmacy") return "farmacia";
  if ((tags.leisure === "park" || tags.leisure === "garden") && tags.access !== "private" && tags.access !== "no") return "praca";
  return null;
}

/** O OSM diz que o local está fechado/desativado? (as chaves `disused:`/`was:` substituem a etiqueta ativa). */
export function fechadoNoOsm(tags) {
  if (!tags) return false;
  if (tags.shop === "vacant") return true;
  if (FECHADO_CHAVES.some((k) => k in tags)) return true;
  if (/^(closed|off)$/i.test(String(tags.opening_hours ?? "").trim())) return true;
  return /\(fechad[oa]\)|\bfechad[oa] definitivamente\b/i.test(tags.name ?? "");
}

/** Categoria de um local que o OSM marca como desativado (para contar o que saiu). */
export function categoriaDesativada(tags) {
  const ativa = categoriaOsm(tags);
  if (ativa) return ativa;
  const s = tags["disused:shop"] ?? tags["was:shop"] ?? tags["abandoned:shop"];
  const a = tags["disused:amenity"] ?? tags["was:amenity"] ?? tags["abandoned:amenity"];
  return categoriaOsm({ shop: s, amenity: a });
}

const ENTRADAS_PUBLICAS = new Set(["main", "yes", "entrance", "home"]);
/** Entrada adequada para o público? (de serviço, emergência, saída e garagem não servem). */
export function entradaPublica(tags) {
  return Boolean(tags?.entrance && ENTRADAS_PUBLICAS.has(tags.entrance) && tags.access !== "private" && tags.access !== "no");
}

/** Até `max` pontos do contorno (para destinos que são áreas: praça, mercado mapeado como prédio). */
export function amostrarContorno(pontos, max = 24) {
  if (pontos.length <= max) return pontos;
  const passo = pontos.length / max;
  return Array.from({ length: max }, (_, i) => pontos[Math.floor(i * passo)]);
}

const R = 6371008.8;
function metros(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad, dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Funde candidatos da mesma categoria em locais canônicos. Dois candidatos são o mesmo local quando: (a) os nomes
 * normalizados são iguais e estão a até 60 m; ou (b) um deles não tem nome e estão a até 25 m. Nome diferente nunca
 * funde (duas farmácias vizinhas numa galeria continuam duas). Ordem de entrada determinística (por id).
 * candidato: { id, categoria, nome, ponto:[lon,lat], destinos:[[lon,lat]…], horario, fontes:[…], ativoEm? }
 */
export function fundirCandidatos(candidatos) {
  const ordenados = [...candidatos].sort((a, b) => a.categoria.localeCompare(b.categoria) || a.id.localeCompare(b.id));
  const locais = [];
  const duplicatas = [];
  for (const c of ordenados) {
    const nc = dobrar(c.nome);
    const alvo = locais.find((l) => l.categoria === c.categoria && (() => {
      const d = metros(l.ponto, c.ponto);
      const nl = dobrar(l.nome);
      return (nc && nl && nc === nl && d <= 60) || ((!nc || !nl) && d <= 25);
    })());
    if (alvo) {
      duplicatas.push({ local: alvo.id, fundido: c.id, metros: Math.round(metros(alvo.ponto, c.ponto)) });
      alvo.fontes = [...new Set([...alvo.fontes, ...c.fontes])];
      alvo.idsFundidos.push(c.id);
      if (!alvo.nome && c.nome) alvo.nome = c.nome;
      if (!alvo.horario && c.horario) alvo.horario = c.horario;
      // Entrada mapeada de qualquer das cópias vale mais que o contorno.
      if (c.entradaMapeada && !alvo.entradaMapeada) { alvo.destinos = c.destinos; alvo.entradaMapeada = true; }
      else if (!alvo.entradaMapeada) alvo.destinos = [...alvo.destinos, ...c.destinos].slice(0, 32);
      continue;
    }
    locais.push({ ...c, idsFundidos: [c.id] });
  }
  return { locais, duplicatas };
}
