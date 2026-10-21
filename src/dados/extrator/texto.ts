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
  const textoLimpo = semDadosPessoais(limparHtml(conteudo));
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
        if (resto && /(?:R\$|n[ãa]o\s+informado|consulte|sob\s+consulta)/i.test(resto)) {
          const proximoRotulo = /(?:\s+(?:condom[íi]nio|iptu|seguro|taxa|total)\b)/i.exec(resto);
          const trechoValor = proximoRotulo ? resto.slice(0, proximoRotulo.index).trim() : resto;
          return { valorLido: trechoValor, linhaIdx: i };
        }
        // Se a linha ficou vazia ou não tem valor de custo, pega a próxima linha não vazia se contiver R$ ou Não informado
        if (i + 1 < linhas.length) {
          const prox = linhas[i + 1];
          if (prox && /(?:R\$|n[ãa]o\s+informado|consulte|sob\s+consulta)/i.test(prox)) {
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

  if (achadoAluguel) {
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

  // Quartos: (\d+)\s+quartos?
  const matchQuartos = /([0-9]+)\s+quartos?\b/i.exec(textoLimpo);
  if (matchQuartos && matchQuartos[1]) {
    campos.quartos = Number(matchQuartos[1]);
  }

  // Suítes: (\d+)\s+su[ií]tes?
  const matchSuites = /([0-9]+)\s+su[ií]tes?\b/i.exec(textoLimpo);
  if (matchSuites && matchSuites[1]) {
    campos.suites = Number(matchSuites[1]);
  }

  // Banheiros: (\d+)\s+banheiros?
  const matchBanhos = /([0-9]+)\s+banheiros?\b/i.exec(textoLimpo);
  if (matchBanhos && matchBanhos[1]) {
    campos.banheiros = Number(matchBanhos[1]);
  }

  // Vagas: (\d+)\s+vagas?
  const matchVagas = /([0-9]+)\s+vagas?\b/i.exec(textoLimpo);
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
  // até " - ", "," ou fim de linha; ", 123" logo depois vira numero.
  const matchLog = /\b((?:Rua|R\.|Avenida|Av\.|Travessa|Tv\.|Estrada|Praça|Praca|Largo|Alameda)\s+[^,\n-]+?)(?:\s*-\s*|,\s*|\n|$)/i.exec(textoLimpo);
  if (matchLog && matchLog[1]) {
    campos.logradouro = matchLog[1].trim();
    // Verifica se há número logo após o fim do match
    const restoDepois = textoLimpo.slice(matchLog.index + matchLog[1].length);
    const matchNum = /^,\s*([0-9]+[a-zA-Z]?)\b/.exec(restoDepois);
    if (matchNum && matchNum[1]) {
      campos.numero = matchNum[1];
    }
  }

  // Bairro no texto
  const resBairro = encontrarBairroNoTexto(textoLimpo);
  campos.bairro = resBairro.bairro;
  campos.bairroTexto = resBairro.bairroTexto;
  if (campos.bairro || /recife/i.test(textoLimpo)) {
    campos.cidade = "recife";
  }

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
