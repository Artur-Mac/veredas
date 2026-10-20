// Lista oficial dos 94 bairros do Recife.
// Fonte: "Bairros e RPAs do Recife", dados.recife.pe.gov.br (recurso a378d50a-5e55-4956-a28c-13305acfc2b3),
// licença ODbL, modificado em 2026-03-02, consultado em 2026-10-19.
// `slug` deriva do nome oficial (sem acento, minúsculas, hífen). `nome` é a grafia de exibição com acentos.
// `aliases` são grafias de slug vistas em portais; o bairro "Recife" (centro antigo) só casa por alias,
// porque "recife" nas URLs quase sempre é a cidade.

export type Bairro = { slug: string; nome: string; rpa: number; aliases?: readonly string[] };

export const BAIRROS_DO_RECIFE: readonly Bairro[] = [
  { slug: "aflitos", nome: "Aflitos", rpa: 3 },
  { slug: "afogados", nome: "Afogados", rpa: 5 },
  { slug: "agua-fria", nome: "Água Fria", rpa: 2 },
  { slug: "alto-do-mandu", nome: "Alto do Mandu", rpa: 3 },
  { slug: "alto-jose-bonifacio", nome: "Alto José Bonifácio", rpa: 3 },
  { slug: "alto-jose-do-pinho", nome: "Alto José do Pinho", rpa: 3 },
  { slug: "alto-santa-terezinha", nome: "Alto Santa Terezinha", rpa: 2 },
  { slug: "apipucos", nome: "Apipucos", rpa: 3 },
  { slug: "areias", nome: "Areias", rpa: 5 },
  { slug: "arruda", nome: "Arruda", rpa: 2 },
  { slug: "barro", nome: "Barro", rpa: 5 },
  { slug: "beberibe", nome: "Beberibe", rpa: 2 },
  { slug: "boa-viagem", nome: "Boa Viagem", rpa: 6 },
  { slug: "boa-vista", nome: "Boa Vista", rpa: 1 },
  { slug: "bomba-do-hemeterio", nome: "Bomba do Hemetério", rpa: 2 },
  { slug: "bongi", nome: "Bongi", rpa: 5 },
  { slug: "brasilia-teimosa", nome: "Brasília Teimosa", rpa: 6 },
  { slug: "brejo-da-guabiraba", nome: "Brejo da Guabiraba", rpa: 3 },
  { slug: "brejo-de-beberibe", nome: "Brejo de Beberibe", rpa: 3 },
  { slug: "cabanga", nome: "Cabanga", rpa: 1 },
  { slug: "cacote", nome: "Caçote", rpa: 5 },
  { slug: "cajueiro", nome: "Cajueiro", rpa: 2 },
  { slug: "campina-do-barreto", nome: "Campina do Barreto", rpa: 2 },
  { slug: "campo-grande", nome: "Campo Grande", rpa: 2 },
  { slug: "casa-amarela", nome: "Casa Amarela", rpa: 3 },
  { slug: "casa-forte", nome: "Casa Forte", rpa: 3 },
  { slug: "caxanga", nome: "Caxangá", rpa: 4 },
  { slug: "cidade-universitaria", nome: "Cidade Universitária", rpa: 4 },
  { slug: "coelhos", nome: "Coelhos", rpa: 1 },
  { slug: "cohab", nome: "Cohab", rpa: 6 },
  { slug: "coqueiral", nome: "Coqueiral", rpa: 5 },
  { slug: "cordeiro", nome: "Cordeiro", rpa: 4 },
  { slug: "corrego-do-jenipapo", nome: "Córrego do Jenipapo", rpa: 3 },
  { slug: "curado", nome: "Curado", rpa: 5 },
  { slug: "derby", nome: "Derby", rpa: 3 },
  { slug: "dois-irmaos", nome: "Dois Irmãos", rpa: 3 },
  { slug: "dois-unidos", nome: "Dois Unidos", rpa: 2 },
  { slug: "encruzilhada", nome: "Encruzilhada", rpa: 2 },
  { slug: "engenho-do-meio", nome: "Engenho do Meio", rpa: 4 },
  { slug: "espinheiro", nome: "Espinheiro", rpa: 3 },
  { slug: "estancia", nome: "Estância", rpa: 5 },
  { slug: "fundao", nome: "Fundão", rpa: 2 },
  { slug: "gracas", nome: "Graças", rpa: 3 },
  { slug: "guabiraba", nome: "Guabiraba", rpa: 3 },
  { slug: "hipodromo", nome: "Hipódromo", rpa: 2 },
  { slug: "ibura", nome: "Ibura", rpa: 6 },
  { slug: "ilha-do-leite", nome: "Ilha do Leite", rpa: 1 },
  { slug: "ilha-do-retiro", nome: "Ilha do Retiro", rpa: 4 },
  { slug: "ilha-joana-bezerra", nome: "Ilha Joana Bezerra", rpa: 1 },
  { slug: "imbiribeira", nome: "Imbiribeira", rpa: 6 },
  { slug: "ipsep", nome: "Ipsep", rpa: 6 },
  { slug: "iputinga", nome: "Iputinga", rpa: 4 },
  { slug: "jaqueira", nome: "Jaqueira", rpa: 3 },
  { slug: "jardim-sao-paulo", nome: "Jardim São Paulo", rpa: 5 },
  { slug: "jiquia", nome: "Jiquiá", rpa: 5 },
  { slug: "jordao", nome: "Jordão", rpa: 6 },
  { slug: "linha-do-tiro", nome: "Linha do Tiro", rpa: 2 },
  { slug: "macaxeira", nome: "Macaxeira", rpa: 3 },
  { slug: "madalena", nome: "Madalena", rpa: 4 },
  { slug: "mangabeira", nome: "Mangabeira", rpa: 3 },
  { slug: "mangueira", nome: "Mangueira", rpa: 5 },
  { slug: "monteiro", nome: "Monteiro", rpa: 3 },
  { slug: "morro-da-conceicao", nome: "Morro da Conceição", rpa: 3 },
  { slug: "mustardinha", nome: "Mustardinha", rpa: 5 },
  { slug: "nova-descoberta", nome: "Nova Descoberta", rpa: 3 },
  { slug: "paissandu", nome: "Paissandu", rpa: 1 },
  { slug: "parnamirim", nome: "Parnamirim", rpa: 3 },
  { slug: "passarinho", nome: "Passarinho", rpa: 3 },
  { slug: "pau-ferro", nome: "Pau-Ferro", rpa: 3 },
  { slug: "peixinhos", nome: "Peixinhos", rpa: 2 },
  { slug: "pina", nome: "Pina", rpa: 6 },
  { slug: "poco", nome: "Poço da Panela", rpa: 3, aliases: ["poco-da-panela"] },
  { slug: "ponto-de-parada", nome: "Ponto de Parada", rpa: 2 },
  { slug: "porto-da-madeira", nome: "Porto da Madeira", rpa: 2 },
  { slug: "prado", nome: "Prado", rpa: 4 },
  { slug: "recife", nome: "Recife (bairro)", rpa: 1, aliases: ["bairro-do-recife", "recife-antigo"] },
  { slug: "rosarinho", nome: "Rosarinho", rpa: 2 },
  { slug: "san-martin", nome: "San Martin", rpa: 5 },
  { slug: "sancho", nome: "Sancho", rpa: 5 },
  { slug: "santana", nome: "Santana", rpa: 3 },
  { slug: "santo-amaro", nome: "Santo Amaro", rpa: 1 },
  { slug: "santo-antonio", nome: "Santo Antônio", rpa: 1 },
  { slug: "sao-jose", nome: "São José", rpa: 1 },
  { slug: "sitio-dos-pintos", nome: "Sítio dos Pintos", rpa: 3 },
  { slug: "soledade", nome: "Soledade", rpa: 1 },
  { slug: "tamarineira", nome: "Tamarineira", rpa: 3 },
  { slug: "tejipio", nome: "Tejipió", rpa: 5 },
  { slug: "torre", nome: "Torre", rpa: 4 },
  { slug: "torreao", nome: "Torreão", rpa: 2 },
  { slug: "torroes", nome: "Torrões", rpa: 4 },
  { slug: "toto", nome: "Totó", rpa: 5 },
  { slug: "varzea", nome: "Várzea", rpa: 4 },
  { slug: "vasco-da-gama", nome: "Vasco da Gama", rpa: 3 },
  { slug: "zumbi", nome: "Zumbi", rpa: 4 },
];

/** Os 5 bairros com índice cadastral na v1.0. Ordem de exibição. */
export const BAIRROS_COBERTOS = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"] as const;
export type SlugCoberto = (typeof BAIRROS_COBERTOS)[number];

/**
 * Valores exatos da coluna `bairro` no IPTU 2026 e no ITBI para cada bairro coberto. O filtro da API é exato,
 * então consulte cada grafia. Conferido em 2026-10-20: IPTU tem "Gracas" (11.327) e "Graças" (46); ITBI 2026,
 * "Gracas" (387) e "Graças" (39). Não há variantes em caixa alta nessas duas bases.
 */
export const GRAFIAS_NO_CADASTRO: Record<SlugCoberto, readonly string[]> = {
  "boa-viagem": ["Boa Viagem"],
  "casa-forte": ["Casa Forte"],
  gracas: ["Gracas", "Graças"],
  espinheiro: ["Espinheiro"],
  madalena: ["Madalena"],
};

export function eCoberto(slug: string | null | undefined): slug is SlugCoberto {
  return BAIRROS_COBERTOS.some((b) => b === slug);
}

export function bairroPorSlug(slug: string | null | undefined): Bairro | null {
  if (!slug) return null;
  return BAIRROS_DO_RECIFE.find((b) => b.slug === slug || b.aliases?.includes(slug)) ?? null;
}
