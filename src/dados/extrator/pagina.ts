import { z } from "zod";
import {
  type LeituraParcial,
  type Portal,
} from "../contratos";
import { extrairDoEstado } from "./estado";
import { extrairDoTexto } from "./texto";

export const esquemaColetaDaPagina = z.strictObject({
  url: z.string().max(2000),
  titulo: z.string().max(300),
  ld: z.array(z.string().max(200 * 1024)).max(10),
  estados: z.array(z.string().max(3 * 1024 * 1024)).max(3),
  texto: z.string().max(200000),
  verificacao: z.boolean(),
});

export type ColetaDaPagina = z.infer<typeof esquemaColetaDaPagina>;

/** Domínios de cada portal conhecido. O portal `outro` não tem domínio fixo: vale o do link colado. */
export const DOMINIOS_DOS_PORTAIS: Record<Portal, string[]> = {
  zap: ["zapimoveis.com.br"],
  vivareal: ["vivareal.com.br"],
  quintoandar: ["quintoandar.com.br"],
  olx: ["olx.com.br"],
  outro: [],
};

/** Primeiro trecho do caminho que, em cada portal, é de lista ou de busca (o do anúncio é `imovel`). */
const PRIMEIRO_TRECHO_DE_LISTA: Record<Portal, string[]> = {
  zap: ["venda", "aluguel", "aluguel-temporada", "lancamentos", "imoveis", "condominios", "imobiliarias", "corretores"],
  vivareal: ["venda", "aluguel", "aluguel-temporada", "lancamentos", "imoveis", "condominios", "imobiliarias", "corretores"],
  quintoandar: ["alugar", "comprar"],
  olx: [],
  outro: [],
};

/** Trecho de busca em qualquer portal, em qualquer posição do caminho. */
const TRECHOS_DE_BUSCA = new Set(["busca", "buscar", "search", "resultado", "resultados"]);

function analisarUrl(texto: string): URL | null {
  try {
    const analisada = new URL(texto);
    return analisada.protocol === "https:" || analisada.protocol === "http:" ? analisada : null;
  } catch {
    return null;
  }
}

/** Caminho em minúsculas, decodificado, sem barra no fim; sem query nem fragmento. */
function caminhoNormalizado(url: URL): string {
  let caminho = url.pathname;
  try {
    caminho = decodeURIComponent(caminho);
  } catch {
    // caminho com % solto: fica como veio
  }
  return caminho.toLowerCase().replace(/\/+$/, "");
}

function hostSemWww(url: URL): string {
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

function mesmoSite(a: string, b: string): boolean {
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

function ehDigito(c: string | undefined): boolean {
  return c !== undefined && c >= "0" && c <= "9";
}

/** O id aparece no caminho como número inteiro: "123" não vale dentro de "1234". */
function caminhoTemOId(caminho: string, id: string): boolean {
  const alvo = id.trim().toLowerCase();
  if (!alvo) return true;
  if (!/^\d+$/.test(alvo)) return caminho.includes(alvo);
  let desde = 0;
  for (;;) {
    const posicao = caminho.indexOf(alvo, desde);
    if (posicao < 0) return false;
    if (!ehDigito(caminho[posicao - 1]) && !ehDigito(caminho[posicao + alvo.length])) return true;
    desde = posicao + 1;
  }
}

function caminhoDeListaOuBusca(caminho: string, portal: Portal): boolean {
  const trechos = caminho.split("/").filter(Boolean);
  const primeiro = trechos[0];
  if (primeiro === undefined) return true; // a página inicial do portal não é anúncio
  if (PRIMEIRO_TRECHO_DE_LISTA[portal].includes(primeiro)) return true;
  return trechos.some((t) => TRECHOS_DE_BUSCA.has(t));
}

/**
 * A coleta veio da página do anúncio pedido? Não, se o host não é o do portal (ou, em portal `outro`, o do link
 * colado), se o caminho não traz o id do anúncio quando ele é conhecido, ou se o caminho mudou para lista ou busca.
 * Um caminho igual ao do link pedido é sempre o da página pedida.
 */
export function coletaEhDoAnuncio(
  coleta: Pick<ColetaDaPagina, "url">,
  portal: Portal,
  idNoPortal: string | null,
  urlPedida?: string,
): boolean {
  const atual = analisarUrl(coleta.url);
  if (!atual) return false;
  const pedida = urlPedida ? analisarUrl(urlPedida) : null;

  const dominios = DOMINIOS_DOS_PORTAIS[portal];
  const host = atual.hostname.toLowerCase();
  if (dominios.length > 0) {
    if (!dominios.some((d) => host === d || host.endsWith(`.${d}`))) return false;
  } else if (pedida && !mesmoSite(hostSemWww(atual), hostSemWww(pedida))) {
    return false;
  }

  const caminho = caminhoNormalizado(atual);
  if (pedida && mesmoSite(hostSemWww(atual), hostSemWww(pedida)) && caminho === caminhoNormalizado(pedida)) return true;
  if (idNoPortal && !caminhoTemOId(caminho, idNoPortal)) return false;
  return !caminhoDeListaOuBusca(caminho, portal);
}

export function lerPagina(
  coleta: ColetaDaPagina,
  portal: Portal,
  idNoPortal: string | null,
  urlPedida?: string,
): LeituraParcial[] {
  const parseRes = esquemaColetaDaPagina.safeParse(coleta);
  if (!parseRes.success) return [];

  const validada = parseRes.data;
  const leituras: LeituraParcial[] = [];

  // Em outra página (lista, busca, home, outro site) o JSON-LD e o texto são de outros anúncios: só o estado vale,
  // e só pelo objeto com o id do anúncio, que é o que `extrairDoEstado` procura.
  const doAnuncio = coletaEhDoAnuncio(validada, portal, idNoPortal, urlPedida);

  // 1. Primeiro estado em que extrairDoEstado achar o anúncio
  for (const estadoStr of validada.estados) {
    try {
      const estadoObj = JSON.parse(estadoStr);
      const res = extrairDoEstado(estadoObj, portal, idNoPortal);
      if (res) {
        leituras.push(res);
        break;
      }
    } catch {
      // Ignora erro de JSON malformado
    }
  }

  // 2. JSON-LD
  for (const ldStr of doAnuncio ? validada.ld : []) {
    try {
      const scriptHtml = `<script type="application/ld+json">${ldStr}</script>`;
      const resLd = extrairDoTexto(scriptHtml, portal);
      const apenasLd = resLd.filter((l) => l.metodo === "json_ld");
      leituras.push(...apenasLd);
    } catch {
      // Ignora erro
    }
  }

  // Mapeia todos os campos já preenchidos pelas leituras estruturadas (estado e json_ld)
  const preenchidos = new Set<string>();
  for (const l of leituras) {
    for (const [campo, val] of Object.entries(l.campos)) {
      if (val !== null && val !== undefined && (!Array.isArray(val) || val.length > 0)) {
        preenchidos.add(campo);
      }
    }
  }

  // 3. Leitura de texto com nulo em todo campo que as estruturadas já preencheram
  if (doAnuncio && validada.texto.trim()) {
    const leiturasTexto = extrairDoTexto(validada.texto, portal);
    for (const lt of leiturasTexto) {
      if (lt.metodo === "texto") {
        for (const campo of Object.keys(lt.campos) as (keyof typeof lt.campos)[]) {
          if (preenchidos.has(campo)) {
            (lt.campos as any)[campo] = null;
          }
        }
        leituras.push(lt);
      }
    }
  }

  return leituras;
}
