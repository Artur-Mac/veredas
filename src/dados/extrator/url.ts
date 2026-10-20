import { urlValida } from "../analise";
import {
  camposVazios,
  type LeituraParcial,
  type Portal,
  type Tipologia,
} from "../contratos";
import { BAIRROS_DO_RECIFE } from "../recife/bairros";
import { encontrarBairroNoSlug, slugParaTitulo } from "./bairro";

const COMODIDADES_VALIDAS = [
  "piscina",
  "garagem",
  "churrasqueira",
  "mobiliado",
  "academia",
  "sauna",
  "vista-mar",
  "varanda",
  "elevador",
  "playground",
] as const;

export function extrairDaUrl(url: string): LeituraParcial | { erro: "url_invalida" } {
  if (!urlValida(url)) {
    return { erro: "url_invalida" };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { erro: "url_invalida" };
  }

  const hostname = parsed.hostname.toLowerCase();
  let portal: Portal = "outro";
  if (hostname === "zapimoveis.com.br" || hostname.endsWith(".zapimoveis.com.br")) {
    portal = "zap";
  } else if (hostname === "vivareal.com.br" || hostname.endsWith(".vivareal.com.br")) {
    portal = "vivareal";
  } else if (hostname === "quintoandar.com.br" || hostname.endsWith(".quintoandar.com.br")) {
    portal = "quintoandar";
  } else if (hostname === "olx.com.br" || hostname.endsWith(".olx.com.br")) {
    portal = "olx";
  }

  const campos = camposVazios();

  // Em portal desconhecido, não adivinhe nada
  if (portal === "outro") {
    return {
      metodo: "url",
      portal: "outro",
      idNoPortal: null,
      campos,
    };
  }

  // Caminho decodificado, minúsculas, sem query nem fragmento
  const pathname = decodeURIComponent(parsed.pathname).toLowerCase();
  const segments = pathname.split("/").filter(Boolean);

  let slug = segments[segments.length - 1] ?? "";
  let idNoPortal: string | null = null;

  // 1. Identificação do ID e extrações específicas de cada portal
  if (portal === "vivareal") {
    // /imovel/{tipologia}-{n}-quarto(s)-{bairro}-bairros-{cidade}[-com-…]-{area}m2-{venda|aluguel}-RS{preco}-id-{id}/
    const idMatch = /-id-(\d+)/.exec(slug);
    if (idMatch && idMatch[1]) idNoPortal = idMatch[1];

    if (slug.includes("-aluguel-")) campos.modalidade = "aluguel";
    else if (slug.includes("-venda-")) campos.modalidade = "compra";

    const precoMatch = /-rs(\d+)-id-/.exec(slug);
    if (precoMatch && precoMatch[1]) campos.preco = Number(precoMatch[1]);

    const areaMatch = /-([0-9]+)m2-/.exec(slug);
    if (areaMatch && areaMatch[1]) campos.area = Number(areaMatch[1]);
  } else if (portal === "zap") {
    // /imovel/{aluguel|venda}-{tipologia}-{n}-quarto(s)[-com-…]-{bairro}-{cidade}-{uf}[-{area}m2]-id-{id}/
    const idMatch = /-id-(\d+)/.exec(slug);
    if (idMatch && idMatch[1]) idNoPortal = idMatch[1];

    if (slug.startsWith("aluguel-") || slug.includes("/aluguel-")) campos.modalidade = "aluguel";
    else if (slug.startsWith("venda-") || slug.includes("/venda-")) campos.modalidade = "compra";

    const areaMatch = /-([0-9]+)m2(?:-id-|$)/.exec(slug);
    if (areaMatch && areaMatch[1]) campos.area = Number(areaMatch[1]);
  } else if (portal === "quintoandar") {
    // /imovel/{id}/{alugar|comprar}/{tipologia}-{n}-quarto(s)-{resto}
    // id é o 2º segmento (índice 1 de /imovel/{id}/...)
    const imovelIdx = segments.indexOf("imovel");
    if (imovelIdx !== -1) {
      const segId = segments[imovelIdx + 1];
      if (segId) idNoPortal = segId;
    }
    const acao = segments[imovelIdx + 2];
    if (acao === "alugar") campos.modalidade = "aluguel";
    else if (acao === "comprar") campos.modalidade = "compra";

    // O slug para tipologia, quartos e bairro é o último segmento
    slug = segments[segments.length - 1] ?? "";

    const prefixoQa = /^(?:apartamento|cobertura|flat|kitnet|casa)-[0-9]+-quartos?-(.*)$/.exec(slug);
    const resto = prefixoQa && prefixoQa[1] ? prefixoQa[1] : slug;
    if (resto.endsWith("-recife")) {
      const bSlug = resto.slice(0, -"-recife".length);
      const bObj = BAIRROS_DO_RECIFE.find((b) => b.slug === bSlug || b.aliases?.includes(bSlug));
      campos.bairro = bObj ? bObj.slug : bSlug;
      campos.bairroTexto = null;
      campos.cidade = "recife";
    } else {
      campos.bairroTexto = resto;
      campos.bairro = null;
      campos.cidade = null;
    }
  } else if (portal === "olx") {
    // /…/imoveis/{titulo}-{id}, id = dígitos finais (9 ou mais)
    const idMatch = /(\d{9,})$/.exec(slug);
    if (idMatch && idMatch[1]) idNoPortal = idMatch[1];

    // Modalidade: a-venda, venda, vender, vendo -> compra; alugar, aluguel, alugo, aluga -> aluguel
    const temCompra = /\b(a-venda|venda|vender|vendo)\b/.test(slug);
    const temAluguel = /\b(alugar|aluguel|alugo|aluga)\b/.test(slug);
    if (temCompra && !temAluguel) campos.modalidade = "compra";
    else if (temAluguel && !temCompra) campos.modalidade = "aluguel";
    else campos.modalidade = null;

    // Área: -(\d+)-m- ou (\d+)m2
    const areaMatch = /(?:-([0-9]+)-m-|-([0-9]+)m2\b)/.exec(slug);
    if (areaMatch) campos.area = Number(areaMatch[1] ?? areaMatch[2]);

    // Suítes: (\d+)-suites?
    const suiteMatch = /([0-9]+)-suites?\b/.exec(slug);
    if (suiteMatch) campos.suites = Number(suiteMatch[1]);
  }

  // 2. Extrações Comuns a todos os portais suportados
  // Tipologia: primeira ocorrência de apartamento|cobertura|flat|kitnet|casa
  const tipologiaMatch = /\b(apartamento|cobertura|flat|kitnet|casa)\b/.exec(slug);
  if (tipologiaMatch) {
    campos.tipologia = tipologiaMatch[1] as Tipologia;
  }

  // Quartos: (\d+)-quartos?
  const quartosMatch = /([0-9]+)-quartos?\b/.exec(slug);
  if (quartosMatch) {
    campos.quartos = Number(quartosMatch[1]);
  }

  // Comodidades na ordem em que aparecem no slug, sem repetir
  const comodidadesEncontradas: { nome: string; index: number }[] = [];
  for (const c of COMODIDADES_VALIDAS) {
    const idx = slug.indexOf(c);
    if (idx !== -1) {
      comodidadesEncontradas.push({ nome: c, index: idx });
    }
  }
  comodidadesEncontradas.sort((a, b) => a.index - b.index);
  campos.comodidades = comodidadesEncontradas.map((c) => c.nome);

  // 3. Bairro e Cidade
  if (portal !== "quintoandar") {
    const resBairro = encontrarBairroNoSlug(slug, portal);
    campos.bairro = resBairro.bairro;
    campos.bairroTexto = resBairro.bairroTexto;
    campos.cidade = resBairro.cidade;
  }

  // 4. OLX: logradouro e nomeEdificio específicos
  if (portal === "olx") {
    // Depois de -no- ou -na-
    const prepMatch = /-(?:no|na)-([a-z0-9-]+)/.exec(slug);
    if (prepMatch && prepMatch[1]) {
      let trecho: string = prepMatch[1];
      // Corta o trecho no início do bairro identificado ou do id final
      if (campos.bairro) {
        const idxBairro = trecho.indexOf(campos.bairro);
        if (idxBairro > 0) {
          trecho = trecho.slice(0, idxBairro).replace(/-$/, "");
        } else if (idxBairro === 0) {
          // O trecho começa exatamente com o bairro: "pina", "boa-vista", etc.
          // "se o trecho é um bairro → é o bairro" -> nomeEdificio e logradouro ficam null
          trecho = "";
        }
      }
      // Se sobrou algum hífen final ou se tinha sufixos comuns
      trecho = trecho.replace(/-recife-pe.*$/, "").replace(/-$/, "");

      if (trecho) {
        // Se começa com rua-, avenida-, av-, travessa-, estrada-, praca-, alameda-
        const prefixoVia = /^(?:rua|avenida|av|travessa|estrada|praca|alameda)-/.exec(trecho);
        if (prefixoVia) {
          campos.logradouro = slugParaTitulo(trecho);
          campos.nomeEdificio = null;
        } else {
          // Se começa com condominio-do-edificio-, edificio-, condominio-, residencial-
          const prefixoEd = /^(?:condominio-do-edificio|edificio|condominio|residencial)-/.exec(trecho);
          if (prefixoEd) {
            const semPrefixo = trecho.slice(prefixoEd[0].length);
            campos.nomeEdificio = slugParaTitulo(semPrefixo);
            campos.logradouro = null;
          } else {
            // Verifica se o trecho é um bairro
            const eBairro = BAIRROS_DO_RECIFE.some((b) => b.slug === trecho || b.aliases?.includes(trecho));
            if (!eBairro) {
              campos.nomeEdificio = slugParaTitulo(trecho);
              campos.logradouro = null;
            }
          }
        }
      }
    }
  }

  return {
    metodo: "url",
    portal,
    idNoPortal,
    campos,
  };
}
