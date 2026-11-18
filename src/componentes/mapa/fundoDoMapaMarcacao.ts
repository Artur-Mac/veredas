// O fundo do mapa como marcação SVG (texto), para a web desenhar tudo num único elemento em vez de dezenas de componentes
// do react-native-svg (desempenho, 18/11/2026). Puro: a mesma tabela de estilo (fundoDoMapaEstilo) e os mesmos atributos
// que o FundoDoMapa nativo passa ao react-native-svg, que na web viram estes mesmos atributos (fonte, tamanho e peso no
// `style`, como o react-native-svg faz). As provas visuais (tests/apoio) usam esta mesma função.
import type { CenaDoFundo } from "./fundoDoMapaCena";
import { FONTES_DO_FUNDO, TRACEJADO_DA_DIVISA, TRACO, type EstiloDoFundo } from "./fundoDoMapaEstilo";
import type { RotuloDeRua } from "./fundoDoMapaRotulos";

export type PartesDaMarcacao = "tudo" | "chao" | "rotulos";

/** Escapa texto e valor de atributo: & < > e aspas. */
export function escaparMarcacao(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const num = (n: number): string => String(n);

/** A emenda do chão do vizinho com a divisa fina do bairro (a mesma conta do componente). */
export function larguraDaEmenda(cena: CenaDoFundo): number {
  return Number.isFinite(cena.metrosPorPx) && cena.metrosPorPx > 0 ? 3 / (cena.metrosPorPx * cena.zoom) : 2 / cena.zoom;
}

/**
 * O conteúdo (sem o grupo raiz) do fundo: as camadas de chão e/ou os rótulos. `prefixo` torna únicos, no documento, os
 * ids dos caminhos dos rótulos (dois fundos na mesma página não podem apontar um para o caminho do outro).
 */
export function marcacaoDoFundo(cena: CenaDoFundo, e: EstiloDoFundo, partes: PartesDaMarcacao, prefixo: string): string {
  if (!cena.temDado) return "";
  const t = (px: number) => num(px / cena.zoom);
  const c = cena.camadas;
  const s: string[] = [];
  const p = (d: string | null | undefined, attrs: string) => {
    if (d) s.push(`<path d="${d}" ${attrs}/>`);
  };
  if (partes !== "rotulos") {
    s.push(`<rect x="0" y="0" width="${num(cena.largura)}" height="${num(cena.altura)}" fill="${e.semDado}"/>`);
    s.push(`<path d="${c.hachura}" stroke="${e.hachura}" stroke-width="${t(TRACO.hachura)}" fill="none"/>`);
    p(c.chao, `fill="${e.chao}" fill-rule="evenodd"`);
    p(c.chaoDaCidade, `fill="${e.chao}" stroke="${e.chao}" stroke-width="${num(larguraDaEmenda(cena))}" stroke-linejoin="round" fill-rule="evenodd"`);
    p(c.tintaDoBairro, `fill="${e.tinta}" fill-opacity="${e.tintaOpacidade}" fill-rule="evenodd"`);
    p(c.quadras, `fill="${e.quadra}" fill-rule="evenodd"`);
    p(c.lotes, `fill="${e.lote}" stroke="${e.loteLinha}" stroke-width="${t(TRACO.lote)}" stroke-linejoin="round" fill-rule="evenodd"`);
    p(c.predios, `fill="${e.predio}" stroke="${e.predioLinha}" stroke-opacity="${e.predioLinhaOpacidade}" stroke-width="${t(TRACO.predio)}" stroke-linejoin="round" fill-rule="evenodd"`);
    p(c.pracas, `fill="${e.praca}" stroke="${e.pracaLinha}" stroke-width="${t(TRACO.praca)}" fill-rule="evenodd"`);
    p(c.agua, `fill="${e.agua}" stroke="${e.aguaLinha}" stroke-width="${t(TRACO.agua)}" fill-rule="evenodd"`);
    p(c.pontes, `fill="${e.chao}" fill-rule="evenodd"`);
    p(c.vias, `fill="none" stroke="${e.via}" stroke-width="${t(TRACO.via)}" stroke-linecap="round" stroke-linejoin="round"`);
    p(c.divisas, `fill="none" stroke="${e.divisa}" stroke-opacity="${e.divisaOpacidade}" stroke-width="${t(TRACO.divisa)}" stroke-dasharray="${TRACEJADO_DA_DIVISA.map(t).join(",")}"`);
    p(c.divisaDoImovel, `fill="none" stroke="${e.divisaDoImovel}" stroke-opacity="${e.divisaDoImovelOpacidade}" stroke-width="${t(TRACO.divisaDoImovel)}" stroke-linejoin="round"`);
    p(c.loteDoImovel, `fill="${e.loteDoImovel}" fill-opacity="${e.loteDoImovelOpacidade}" stroke="${e.loteDoImovel}" stroke-width="${t(TRACO.loteDoImovel)}" stroke-linejoin="round" fill-rule="evenodd"`);
  }
  if (partes !== "chao") {
    const id = (r: RotuloDeRua) => escaparMarcacao(`${prefixo}-${r.id}`);
    if (cena.rotulos.length > 0) s.push(`<defs>${cena.rotulos.map((r) => `<path id="${id(r)}" d="${r.caminho}"/>`).join("")}</defs>`);
    const corDaRua = (r: RotuloDeRua) => (r.sobreOLote ? e.ruaDoImovelSobreOLote : r.tipo === "imovel" ? e.ruaDoImovel : r.tipo === "avenida" ? e.avenida : e.rua);
    const haloDaRua = (r: RotuloDeRua) => (r.sobreOLote ? e.haloSobreOLote : e.halo);
    for (const halo of [true, false]) {
      s.push("<g>");
      for (const r of cena.rotulos) {
        const traco = halo ? ` stroke="${haloDaRua(r)}" stroke-width="${t(TRACO.haloDaRua)}" stroke-linejoin="round"` : "";
        s.push(
          `<text text-anchor="middle" fill="${halo ? haloDaRua(r) : corDaRua(r)}"${traco} style="font-family:${FONTES_DO_FUNDO.rua};font-size:${num(r.tamanho)}px;font-weight:${r.tipo === "imovel" ? 700 : 600}">` +
            `<textPath href="#${id(r)}" startOffset="${num(r.inicio)}">${escaparMarcacao(r.nome)}</textPath></text>`,
        );
      }
      for (const b of cena.bairros) {
        const traco = halo ? ` stroke="${e.halo}" stroke-width="${t(TRACO.haloDoBairro)}" stroke-linejoin="round"` : "";
        s.push(
          `<text x="${num(b.x)}" y="${num(b.y + b.tamanho * 0.36)}" letter-spacing="${num(b.espacamento)}" text-anchor="middle" fill="${halo ? e.halo : b.doImovel ? e.bairroDoImovel : e.bairro}"${traco} style="font-family:${FONTES_DO_FUNDO.bairro};font-size:${num(b.tamanho)}px;font-weight:600">` +
            `${escaparMarcacao(b.nome)}</text>`,
        );
      }
      s.push("</g>");
    }
  }
  return s.join("");
}

