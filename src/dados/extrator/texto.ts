import { nomeDeEdificioNoTexto } from "./nomeEFotos";
import {
  camposVazios,
  type ChaveDeCampo,
  type LeituraParcial,
  type Periodo,
  type Portal,
} from "../contratos";
import { encontrarBairroNoTexto } from "./bairro";
import { semDadosPessoais } from "./privacidade";

/** Mapa auxiliar em memória para guardar textos de "Não informado" ou similares sem sujar o contrato Zod. */
export const mapaNaoInformados = new WeakMap<LeituraParcial, Map<ChaveDeCampo, string>>();

function limparHtml(html: string): string {
  // Remove blocos de script e style
  let limpo = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "\n");
  limpo = limpo.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "\n");

  // Quebras de linha em tags de bloco comuns
  limpo = limpo.replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n");
  limpo = limpo.replace(/<br\s*\/?>/gi, "\n");

  // Remove as demais tags
  limpo = limpo.replace(/<[^>]+>/g, " ");

  // Decodifica entidades comuns
  limpo = limpo
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  return limpo;
}

/**
 * Começo da parte da página que já não é o anúncio: os cartões de outros anúncios que o portal mostra depois dele, cada
 * um com preço, "Cond.", "IPTU", área, rua e bairro. Lidos junto, davam ao anúncio o IPTU, o bairro, a rua e até o
 * aluguel de outro imóvel. Títulos vistos nas páginas para celular em 18/11/2026: ZAP e VivaReal ("Outros imóveis
 * parecidos que você pode gostar"), QuintoAndar ("Similares na mesma região") e OLX ("Também podem te interessar",
 * "Imóveis novos para comprar", "Produtos para sua casa", "Mais vistos em Apartamentos").
 */
const INICIO_DE_OUTROS_ANUNCIOS =
  /^(?:outros im[óo]veis parecidos|im[óo]veis (?:parecidos|similares|semelhantes|com caracter[íi]sticas similares)|similares na mesma regi[ãa]o|an[úu]ncios (?:parecidos|similares|semelhantes|relacionados)|tamb[ée]m podem te interessar|voc[êe] tamb[ée]m pode gostar|im[óo]veis novos para comprar|produtos para sua casa|mais vistos em\b|recomenda[çc][õo]es (?:exclusivas )?para voc[êe])/i;

/** O texto até o primeiro título de outros anúncios. Um título logo na primeira linha não corta nada. */
function semOutrosAnuncios(texto: string): string {
  const linhas = texto.split(/\r?\n/);
  const corte = linhas.findIndex((l, i) => i > 0 && INICIO_DE_OUTROS_ANUNCIOS.test(l.trim()));
  return corte < 0 ? texto : linhas.slice(0, corte).join("\n");
}

/** Valor de um rótulo de preço ou custo: em reais, "não informado", "consulte" ou "isento" (ZAP e VivaReal). */
const VALOR_DO_ROTULO = /(?:R\$|n[ãa]o\s+informado|consulte|sob\s+consulta|\bisent[oa]\b)/i;

/**
 * A rua termina antes de "no bairro", "em Recife" ou do ponto que fecha a frase: a descrição do QuintoAndar traz
 * "Rua do Aragão no bairro Boa Vista em Recife. Está bem localizado…". O ponto só fecha depois de palavra de 5 letras
 * ou mais, para "Rua Dr. José" continuar inteira.
 */
function ruaSemOResto(rua: string): string {
  return rua
    .replace(/\s+(?:n[oa]s?\s+bairro|bairro|em\s+recife)\b.*$/i, "")
    .replace(/([a-zà-ÿ]{5})\.\s.*$/i, "$1")
    .trim();
}

function parseDinheiro(str: string): number | null {
  const m = /R\$\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{1,2})?|[0-9]+(?:,[0-9]{1,2})?)/i.exec(str);
  if (!m || !m[1]) return null;
  const limpo = m[1].replace(/\./g, "").replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

function extrairJsonLd(conteudo: string, portal: Portal): LeituraParcial | null {
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(conteudo)) !== null) {
    const raw = (match[1] ?? "").trim();
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      // Pode ser objeto, array ou @graph
      const items = Array.isArray(data)
        ? data
        : data && typeof data === "object" && "@graph" in data && Array.isArray((data as any)["@graph"])
          ? (data as any)["@graph"]
          : [data];

      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const campos = camposVazios();
        let encontrouAlgo = false;

        // Área
        if (item.floorSize) {
          const val = typeof item.floorSize === "object" ? item.floorSize.value : item.floorSize;
          const num = Number(String(val).replace(",", "."));
          if (Number.isFinite(num) && num > 0) {
            campos.area = num;
            encontrouAlgo = true;
          }
        }

        // Quartos
        if (item.numberOfRooms) {
          const q = Number(item.numberOfRooms);
          if (Number.isInteger(q) && q >= 0) {
            campos.quartos = q;
            encontrouAlgo = true;
          }
        }

        // Banheiros
        const baths = item.numberOfBathroomsTotal ?? item.numberOfBathrooms;
        if (baths !== undefined) {
          const b = Number(baths);
          if (Number.isInteger(b) && b >= 0) {
            campos.banheiros = b;
            encontrouAlgo = true;
          }
        }

        // Endereço
        if (item.address && typeof item.address === "object") {
          const street = item.address.streetAddress;
          if (typeof street === "string" && street.trim()) {
            const numMatch = /,\s*([0-9]+[a-zA-Z]?)$/.exec(street.trim());
            if (numMatch && numMatch[1]) {
              campos.numero = numMatch[1];
              campos.logradouro = street.trim().slice(0, numMatch.index).trim();
            } else {
              campos.logradouro = street.trim();
            }
            encontrouAlgo = true;
          }

          const loc = String(item.address.addressLocality ?? "").toLowerCase();
          if (loc.includes("recife")) {
            campos.cidade = "recife";
            encontrouAlgo = true;
          }
        }

        // Preço
        const price = item.offers?.price ?? item.price;
        if (price !== undefined) {
          const numDirect = typeof price === "number" ? price : Number(String(price).trim());
          const p = Number.isFinite(numDirect) && numDirect > 0 ? numDirect : parseDinheiro(`R$ ${price}`);
          if (p !== null && p > 0) {
            campos.preco = p;
            encontrouAlgo = true;
          }
        }

        if (encontrouAlgo) {
          return {
            metodo: "json_ld",
            portal,
            idNoPortal: null,
            campos,
          };
        }
      }
    } catch {
      // Ignorado em silêncio
    }
  }

  return null;
}

export function extrairDoTexto(conteudo: string, portal: Portal): LeituraParcial[] {
  const leituras: LeituraParcial[] = [];

  // 1. Camada C: JSON-LD se houver
  const leituraJsonLd = extrairJsonLd(conteudo, portal);
  if (leituraJsonLd) {
    leituras.push(leituraJsonLd);
  }

  // 2. Camada B: Texto, sem o contato de quem anuncia (o JSON-LD acima só rende campos da lista do imóvel)
  const textoLimpo = semOutrosAnuncios(semDadosPessoais(limparHtml(conteudo)));
  const campos = camposVazios();
  const naoInformados = new Map<ChaveDeCampo, string>();

  const linhas = textoLimpo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Helper para buscar valor de um rótulo (na mesma linha ou na próxima)
  function acharValorRotulo(regexRotulo: RegExp): { valorLido: string; linhaIdx: number } | null {
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      if (!linha) continue;
      const match = regexRotulo.exec(linha);
      if (match) {
        // Verifica o que vem depois na mesma linha
        const resto = linha.slice(match.index + match[0].length).trim();
        if (resto && VALOR_DO_ROTULO.test(resto)) {
          const proximoRotulo = /(?:\s+(?:condom[íi]nio|iptu|seguro|taxa|total)\b)/i.exec(resto);
          const trechoValor = proximoRotulo ? resto.slice(0, proximoRotulo.index).trim() : resto;
          return { valorLido: trechoValor, linhaIdx: i };
        }
        // O rótulo fecha a linha e o valor vem antes dele: "R$ 5.000 Aluguel" (OLX). A linha seguinte ali é o total.
        const antes = linha.slice(0, match.index).trim();
        if (!resto && /^R\$\s*\d/.test(antes)) {
          return { valorLido: antes, linhaIdx: i };
        }
        // Se a linha ficou vazia ou não tem valor de custo, pega a próxima linha não vazia se contiver R$ ou Não informado
        if (i + 1 < linhas.length) {
          const prox = linhas[i + 1];
          if (prox && VALOR_DO_ROTULO.test(prox)) {
            return { valorLido: prox, linhaIdx: i + 1 };
          }
        }
      }
    }
    return null;
  }

  // Rótulos de Custo
  // Preço e Modalidade
  const achadoAluguel = acharValorRotulo(/\b(?:valor\s+do\s+aluguel|aluguel)\b:?/i);
  const achadoVenda = acharValorRotulo(/\b(?:valor\s+de\s+venda|à\s+venda|venda)\b:?/i);
  const achadoPreco = acharValorRotulo(/\b(?:preço|valor)\b:?/i);

  // Com os dois rótulos no texto, vale o que aparece primeiro: o anúncio de venda pode citar "aluguel" mais abaixo.
  if (achadoAluguel && (!achadoVenda || achadoAluguel.linhaIdx <= achadoVenda.linhaIdx)) {
    campos.modalidade = "aluguel";
    const p = parseDinheiro(achadoAluguel.valorLido);
    if (p !== null) campos.preco = p;
  } else if (achadoVenda) {
    campos.modalidade = "compra";
    const p = parseDinheiro(achadoVenda.valorLido);
    if (p !== null) campos.preco = p;
  } else if (achadoPreco) {
    const p = parseDinheiro(achadoPreco.valorLido);
    if (p !== null) campos.preco = p;
  }

  // Se ainda não temos preço, busca um "R$" solto antes de qualquer outro custo
  if (campos.preco === null) {
    for (const linha of linhas) {
      if (/(?:condom[íi]nio|iptu|seguro|taxa|total)/i.test(linha)) {
        break; // encontrou rótulo de custo recorrente, interrompe busca solta
      }
      const p = parseDinheiro(linha);
      if (p !== null) {
        campos.preco = p;
        if (/alug/i.test(linha)) campos.modalidade = "aluguel";
        else if (/(?:venda|compra|à\s+venda)/i.test(linha)) campos.modalidade = "compra";
        break;
      }
    }
  }

  // Se modalidade ainda indefinida, procura termos gerais
  if (!campos.modalidade) {
    if (/\b(?:para\s+alugar|aluguel|alugo|aluga)\b/i.test(textoLimpo)) campos.modalidade = "aluguel";
    else if (/\b(?:para\s+vender|à\s+venda|venda|comprar)\b/i.test(textoLimpo)) campos.modalidade = "compra";
  }

  // Condomínio
  const achadoCondo = acharValorRotulo(/\b(?:condom[íi]nio(?:\s+mensal)?)\b:?/i);
  if (achadoCondo) {
    if (/(?:não\s+informado|consulte|sob\s+consulta)/i.test(achadoCondo.valorLido)) {
      campos.condominio = null;
      naoInformados.set("condominio", achadoCondo.valorLido.replace(/^:\s*/, "").trim());
    } else {
      const c = parseDinheiro(achadoCondo.valorLido);
      if (c !== null) campos.condominio = c;
    }
  }

  // IPTU
  let iptuPeriodoDefinido: Periodo | null = null;
  const achadoIptu = acharValorRotulo(/\b(?:iptu(?:\s+(mensal|anual))?)\b:?/i);
  if (achadoIptu) {
    const linhaIptu = linhas[achadoIptu.linhaIdx];
    if (linhaIptu && /anual/i.test(linhaIptu)) iptuPeriodoDefinido = "ano";
    else if (linhaIptu && /mensal/i.test(linhaIptu)) iptuPeriodoDefinido = "mes";

    if (/(?:não\s+informado|consulte|sob\s+consulta)/i.test(achadoIptu.valorLido)) {
      campos.iptu = null;
      naoInformados.set("iptu", achadoIptu.valorLido.replace(/^:\s*/, "").trim());
    } else {
      const v = parseDinheiro(achadoIptu.valorLido);
      if (v !== null) {
        let periodo: Periodo = iptuPeriodoDefinido ?? "desconhecido";
        if (!iptuPeriodoDefinido) {
          if (/(?:\/m[eê]s|por\s+m[eê]s|mensal)/i.test(achadoIptu.valorLido)) {
            periodo = "mes";
          } else if (/(?:\/ano|por\s+ano|anual)/i.test(achadoIptu.valorLido)) {
            periodo = "ano";
          }
        }
        campos.iptu = { valor: v, periodo };
      }
    }
  }

  // Seguro Incêndio
  const achadoSeguro = acharValorRotulo(/\b(?:seguro\s+inc[eê]ndio)\b:?/i);
  if (achadoSeguro) {
    const s = parseDinheiro(achadoSeguro.valorLido);
    if (s !== null) campos.seguroIncendio = s;
  }

  // Taxa de Serviço
  const achadoTaxa = acharValorRotulo(/\b(?:taxa\s+de\s+servi[çc]o)\b:?/i);
  if (achadoTaxa) {
    const t = parseDinheiro(achadoTaxa.valorLido);
    if (t !== null) campos.taxaServico = t;
  }

  // Total Informado
  const achadoTotal = acharValorRotulo(/\b(?:total)\b:?/i);
  if (achadoTotal) {
    const tot = parseDinheiro(achadoTotal.valorLido);
    if (tot !== null) campos.totalInformado = tot;
  }

  // Conferência do total para IPTU: se soma confere com diferença <= R$ 2, IPTU é "mes"
  if (campos.totalInformado !== null && campos.iptu && campos.preco !== null) {
    const componentes = [
      campos.preco,
      campos.condominio ?? 0,
      campos.iptu.valor,
      campos.seguroIncendio ?? 0,
      campos.taxaServico ?? 0,
    ];
    const soma = componentes.reduce((a, b) => a + b, 0);
    if (Math.abs(soma - campos.totalInformado) <= 2) {
      campos.iptu.periodo = "mes";
    }
  }

  // Especificações
  // Área: (\d{1,5}(?:,\d{1,2})?)\s*m(?:²|2)
  const matchAreaUtil = /(?:[áa]rea\s+[úu]til|[áa]rea\s+privativa)[:\s]*([0-9]{1,5}(?:,[0-9]{1,2})?)\s*m(?:²|2)/i.exec(textoLimpo);
  if (matchAreaUtil && matchAreaUtil[1]) {
    campos.area = Number(matchAreaUtil[1].replace(",", "."));
  } else {
    const matchAreaGeral = /([0-9]{1,5}(?:,[0-9]{1,2})?)\s*m(?:²|2)/i.exec(textoLimpo);
    if (matchAreaGeral && matchAreaGeral[1]) {
      campos.area = Number(matchAreaGeral[1].replace(",", "."));
    }
  }

  // Quartos, suítes, banheiros e vagas: número e palavra na mesma linha. No ZAP e no VivaReal cada rótulo vem em cima
  // do próprio valor ("Quartos", "3", "Banheiros", "2"), e "3\nBanheiros" dava aos banheiros o número dos quartos.
  // Quartos: (\d+) quartos?
  const matchQuartos = /([0-9]+)[^\S\r\n]+quartos?\b/i.exec(textoLimpo);
  if (matchQuartos && matchQuartos[1]) {
    campos.quartos = Number(matchQuartos[1]);
  }

  // Suítes: (\d+) su[ií]tes?
  const matchSuites = /([0-9]+)[^\S\r\n]+su[ií]tes?\b/i.exec(textoLimpo);
  if (matchSuites && matchSuites[1]) {
    campos.suites = Number(matchSuites[1]);
  }

  // Banheiros: (\d+) banheiros?
  const matchBanhos = /([0-9]+)[^\S\r\n]+banheiros?\b/i.exec(textoLimpo);
  if (matchBanhos && matchBanhos[1]) {
    campos.banheiros = Number(matchBanhos[1]);
  }

  // Vagas: (\d+) vagas?
  const matchVagas = /([0-9]+)[^\S\r\n]+vagas?\b/i.exec(textoLimpo);
  if (matchVagas && matchVagas[1]) {
    campos.vagas = Number(matchVagas[1]);
  }

  // Andar: (\d+)\s*[ºo°]?\s*andar ou andar\s+(\d+), térreo -> 0
  const matchAndarNum = /(?:([0-9]+)\s*[ºo°]?\s*andar\b|andar\s+([0-9]+)\b)/i.exec(textoLimpo);
  if (matchAndarNum) {
    const andarStr = matchAndarNum[1] ?? matchAndarNum[2];
    if (andarStr) {
      campos.andar = Number(andarStr);
    }
  } else if (/\bt[éè]rreo\b/i.test(textoLimpo)) {
    campos.andar = 0;
  }

  // Ano de construção: construído em (\d{4}) ou ano de construção:?\s*(\d{4})
  const matchAno = /(?:constru[íi]do\s+em|ano\s+de\s+constru[çc][ãa]o:?)\s*([0-9]{4})\b/i.exec(textoLimpo);
  if (matchAno && matchAno[1]) {
    campos.anoConstrucao = Number(matchAno[1]);
  }

  // Logradouro: trecho que começa com Rua, R., Avenida, Av., Travessa, Tv., Estrada, Praça, Largo, Alameda
  // até " - ", "," ou fim de linha; ", 123" logo depois vira numero. A rua costuma aparecer mais de uma vez (a trilha do
  // portal traz só o nome; a "Localização", o nome e o número): vale a primeira ocorrência com número, senão a primeira.
  const padraoLog = /\b((?:Rua|R\.|Avenida|Av\.|Travessa|Tv\.|Estrada|Praça|Praca|Largo|Alameda)\s+[^,\n-]+?)(?:\s*-\s*|,\s*|\n|$)/gi;
  let primeiraRua: string | null = null;
  for (const matchLog of textoLimpo.matchAll(padraoLog)) {
    const capturada = matchLog[1]?.trim();
    if (!capturada) continue;
    const rua = ruaSemOResto(capturada);
    if (rua !== capturada) {
      // A frase continuou depois da rua: o número, se houver, não vem logo depois dela.
      primeiraRua ??= rua;
      continue;
    }
    primeiraRua ??= rua;
    const restoDepois = textoLimpo.slice((matchLog.index ?? 0) + (matchLog[1]?.length ?? 0));
    const matchNum = /^,\s*([0-9]+[a-zA-Z]?)\b/.exec(restoDepois);
    if (matchNum && matchNum[1]) {
      campos.logradouro = rua;
      campos.numero = matchNum[1];
      break;
    }
  }
  if (campos.logradouro === null && primeiraRua) campos.logradouro = primeiraRua;

  // Nome do edifício escrito no anúncio ("Edf. Engenho Torre", "Condomínio Jardim das Acácias"): pista para achar o prédio.
  campos.nomeEdificio = nomeDeEdificioNoTexto(textoLimpo);

  // Bairro no texto
  const resBairro = encontrarBairroNoTexto(textoLimpo);
  campos.bairro = resBairro.bairro;
  campos.bairroTexto = resBairro.bairroTexto;
  if (campos.bairro || /recife/i.test(textoLimpo)) {
    campos.cidade = "recife";
  }

  // Comodidades do prédio e unidade citadas no texto do anúncio
  const regrasComodidades: readonly [string, RegExp][] = [
    ["piscina", /\bpiscinas?\b/i],
    ["academia", /\bacademia\b|\bfitness\b/i],
    ["elevador", /\belevador(?:es)?\b/i],
    ["portaria-24h", /\bportaria\s*24\s*h|\bportaria\s*24\s*horas\b/i],
    ["salao-festas", /\bsal[ãa]o\s+de\s+festas\b/i],
    ["churrasqueira", /\bchurrasqueiras?\b|\bespa[çc]o\s+gourmet\b/i],
    ["playground", /\bplayground\b|\bbrinquedoteca\b/i],
    ["varanda", /\bvarandas?\b|\bsacada\b/i],
    ["mobiliado", /\bmobiliad[oa]\b/i],
    ["sauna", /\bsauna\b/i],
    ["vista-mar", /\bvista\s+(?:para\s+o\s+)?mar\b|\bbeira[\s-]mar\b/i],
    ["garagem", /\bgaragem\b/i],
  ];
  campos.comodidades = regrasComodidades
    .filter(([, re]) => re.test(textoLimpo))
    .map(([slug]) => slug);

  const leituraTexto: LeituraParcial = {
    metodo: "texto",
    portal,
    idNoPortal: null,
    campos,
  };

  if (naoInformados.size > 0) {
    mapaNaoInformados.set(leituraTexto, naoInformados);
  }

  leituras.push(leituraTexto);
  return leituras;
}
