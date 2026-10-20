import { BAIRROS_DO_RECIFE, type Bairro } from "../recife/bairros";

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Converte slug com hífens em Título ("solar-do-gayppio" -> "Solar do Gayppio"). */
export function slugParaTitulo(slug: string): string {
  const particulas = new Set(["da", "de", "do", "das", "dos", "e"]);
  const palavras = slug.split("-").filter(Boolean);
  return palavras
    .map((palavra, index) => {
      const p = palavra.toLowerCase();
      if (index > 0 && particulas.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(" ");
}

type SlugItem = { slug: string; oficial: Bairro; alias: string };

const TODOS_OS_SLUGS: SlugItem[] = BAIRROS_DO_RECIFE.flatMap((b) => {
  const lista: SlugItem[] = [];
  // O slug "recife" isolado nunca casa o bairro; só via aliases (bairro-do-recife, recife-antigo)
  if (b.slug !== "recife") {
    lista.push({ slug: b.slug, oficial: b, alias: b.slug });
  }
  if (b.aliases) {
    for (const a of b.aliases) {
      lista.push({ slug: a, oficial: b, alias: a });
    }
  }
  return lista;
}).sort((a, b) => b.slug.length - a.slug.length);

/**
 * Encontra bairro no slug de uma URL de acordo com as regras da ORDEM_DO_ARQUITETO:
 * 1. Termina imediatamente antes do marcador de cidade:
 *    - "-bairros-recife" (VivaReal)
 *    - "-recife-pe" (ZAP e OLX)
 *    - "-recife" no final (QuintoAndar)
 * 2. Sem marcador de cidade (OLX):
 *    - após "-em-", "-no-", "-na-", "-nas-", "-nos-" que começa com slug de bairro
 */
export function encontrarBairroNoSlug(slug: string, portal: string): { bairro: string | null; bairroTexto: string | null; cidade: string | null } {
  // Caso 1: marcadores de cidade Recife
  let trechoAntesDoMarcador: string | null = null;
  let marcadorRecife = false;

  if (portal === "vivareal") {
    const idx = slug.indexOf("-bairros-recife");
    if (idx !== -1) {
      trechoAntesDoMarcador = slug.slice(0, idx);
      marcadorRecife = true;
    }
  } else if (portal === "zap") {
    const idx = slug.indexOf("-recife-pe");
    if (idx !== -1) {
      trechoAntesDoMarcador = slug.slice(0, idx);
      marcadorRecife = true;
    }
  } else if (portal === "quintoandar") {
    if (slug.endsWith("-recife")) {
      trechoAntesDoMarcador = slug.slice(0, -"-recife".length);
      marcadorRecife = true;
    }
  } else if (portal === "olx") {
    const idx = slug.indexOf("-recife-pe");
    if (idx !== -1) {
      trechoAntesDoMarcador = slug.slice(0, idx);
      marcadorRecife = true;
    }
  }

  if (trechoAntesDoMarcador !== null && marcadorRecife) {
    for (const item of TODOS_OS_SLUGS) {
      if (
        trechoAntesDoMarcador === item.slug ||
        trechoAntesDoMarcador.endsWith(`-${item.slug}`)
      ) {
        return {
          bairro: item.oficial.slug,
          bairroTexto: item.oficial.nome,
          cidade: "recife",
        };
      }
    }
  }

  // Caso 2: OLX sem marcador imediato ou com "-em-", "-no-", "-na-", "-nas-", "-nos-"
  if (portal === "olx") {
    const regexPrep = /-(?:em|no|na|nas|nos)-([a-z0-9-]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regexPrep.exec(slug)) !== null) {
      const resto = match[1];
      if (!resto) continue;
      for (const item of TODOS_OS_SLUGS) {
        if (resto === item.slug || resto.startsWith(`${item.slug}-`)) {
          return {
            bairro: item.oficial.slug,
            bairroTexto: item.oficial.nome,
            cidade: marcadorRecife || slug.includes("recife") ? "recife" : null,
          };
        }
      }
    }
  }

  // QuintoAndar outra cidade (ex.: "piata-salvador", "aguas-claras-brasilia")
  if (portal === "quintoandar" && !marcadorRecife) {
    return {
      bairro: null,
      bairroTexto: slug,
      cidade: null,
    };
  }

  return {
    bairro: null,
    bairroTexto: null,
    cidade: marcadorRecife ? "recife" : null,
  };
}

/**
 * Encontra bairro no texto livre/HTML estritamente nos padrões especificados:
 * - {Bairro}, Recife
 * - {Bairro} - Recife
 * no|na|nos|nas|em {Bairro}
 * Bairro: {Bairro}
 */
export function encontrarBairroNoTexto(texto: string): { bairro: string | null; bairroTexto: string | null } {
  const textoNorm = normalizarTexto(texto);

  // Ordenamos os bairros por tamanho do nome decrescente para desambiguação
  const bairrosOrdenados = [...BAIRROS_DO_RECIFE].sort((a, b) => b.nome.length - a.nome.length);

  for (const b of bairrosOrdenados) {
    const nomes = [b.nome, ...(b.aliases ?? [])];
    for (const n of nomes) {
      const nomeNorm = normalizarTexto(n);
      // Padrões exigidos
      const padroes = [
        new RegExp(`(?:^|\\s|,|-)\\s*${nomeNorm}\\s*,\\s*recife\\b`, "i"),
        new RegExp(`(?:^|\\s|,|-)\\s*${nomeNorm}\\s*-\\s*recife\\b`, "i"),
        new RegExp(`\\b(?:no|na|nos|nas|em)\\s+${nomeNorm}\\b`, "i"),
        new RegExp(`\\bbairro:\\s*${nomeNorm}\\b`, "i"),
      ];

      for (const reg of padroes) {
        if (reg.test(textoNorm)) {
          return {
            bairro: b.slug,
            bairroTexto: b.nome,
          };
        }
      }
    }
  }

  return { bairro: null, bairroTexto: null };
}
