import {
  camposVazios,
  type LeituraParcial,
  type Periodo,
  type Portal,
} from "../contratos";
import { BAIRROS_DO_RECIFE } from "../recife/bairros";
import { normalizarTexto } from "./bairro";
import { fotosDoAnuncio, nomeDeEdificioNoTexto, textoDoCampo } from "./nomeEFotos";

// "listid": o código do anúncio na OLX (`initial-data` → `ad.listId`; `ad.adId` é outro número).
const CHAVES_ID = new Set(["id", "listingid", "legacyid", "houseid", "listid"]);

/**
 * Objeto com o id e quase nada mais não é o anúncio: é a rota da página. O QuintoAndar guarda `query: { houseId, slug }`
 * no topo do `__NEXT_DATA__`, e a busca em largura o achava antes de `initialState.house.houseInfo` (18/11/2026).
 */
const CHAVES_MINIMAS_DO_ANUNCIO = 4;

const FOTOS_DO_QUINTOANDAR = "https://www.quintoandar.com.br/img/xlg/";

interface FilaItem {
  no: unknown;
  profundidade: number;
}

function buscarObjetoDoAnuncio(raiz: unknown, idNoPortal: string): Record<string, unknown> | null {
  if (!raiz || typeof raiz !== "object" || !idNoPortal) return null;

  const fila: FilaItem[] = [{ no: raiz, profundidade: 0 }];
  const visitados = new Set<unknown>();
  let visitadosContagem = 0;
  const idStr = String(idNoPortal).trim();
  /** Primeiro objeto raso com o id: só vale se nenhum objeto completo tiver o id. */
  let raso: Record<string, unknown> | null = null;

  while (fila.length > 0 && visitadosContagem < 200000) {
    const item = fila.shift();
    if (!item) break;
    const { no, profundidade } = item;

    if (!no || typeof no !== "object") continue;
    if (visitados.has(no)) continue;
    visitados.add(no);
    visitadosContagem++;

    if (Array.isArray(no)) {
      if (profundidade < 12) {
        for (const el of no) {
          if (el && typeof el === "object") {
            fila.push({ no: el, profundidade: profundidade + 1 });
          }
        }
      }
      continue;
    }

    const obj = no as Record<string, unknown>;

    // Verifica se este objeto tem o ID do anúncio
    const temOId = Object.entries(obj).some(
      ([k, v]) => CHAVES_ID.has(k.toLowerCase()) && v !== null && v !== undefined && String(v).trim() === idStr,
    );
    if (temOId) {
      if (Object.keys(obj).length >= CHAVES_MINIMAS_DO_ANUNCIO) return obj;
      raso ??= obj;
    }

    // Se não é o objeto, enfileira os filhos
    if (profundidade < 12) {
      for (const v of Object.values(obj)) {
        if (v && typeof v === "object") {
          fila.push({ no: v, profundidade: profundidade + 1 });
        }
      }
    }
  }

  return raso;
}

function extrairNumero(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    if (val === 0) return null; // zero no estado é ausência
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    const v = obj["value"] ?? obj["amount"];
    return extrairNumero(v);
  }
  if (typeof val === "string") {
    // A OLX guarda o valor como na tela: "R$ 5.000", "R$ 1/mês", "57m²".
    const semUnidade = val.trim().replace(/^R\$\s*/i, "").replace(/\s*(?:m²|m2)$/i, "").replace(/\s*\/\s*m[eê]s$/i, "");
    const n = Number(semUnidade.replace(/\./g, "").replace(",", "."));
    if (n === 0) return null;
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function buscarChaveInsensivel(obj: Record<string, unknown>, chaves: string[], maxNiveis = 3): unknown {
  const chavesLower = new Set(chaves.map((c) => c.toLowerCase()));

  function buscar(atual: unknown, nivel: number): unknown {
    if (!atual || typeof atual !== "object" || nivel > maxNiveis) return undefined;

    if (Array.isArray(atual)) {
      for (const item of atual) {
        const achou = buscar(item, nivel + 1);
        if (achou !== undefined) return achou;
      }
      return undefined;
    }

    const rec = atual as Record<string, unknown>;
    for (const [k, v] of Object.entries(rec)) {
      if (chavesLower.has(k.toLowerCase()) && v !== undefined && v !== null) {
        return v;
      }
    }

    for (const v of Object.values(rec)) {
      if (v && typeof v === "object") {
        const achou = buscar(v, nivel + 1);
        if (achou !== undefined) return achou;
      }
    }

    return undefined;
  }

  return buscar(obj, 1);
}

/**
 * OLX (`initial-data` → `ad`, 18/11/2026): preço, custos e medidas vêm em listas de `{ name, value }` com o texto da
 * tela (`realEstatePriceInfo`, `properties`, `featuresSummary`): "condominio" "R$ 1", "iptu" "R$ 2", "size" "57m²",
 * "rooms" "2", "real_estate_type" "Venda - apartamento padrão". Nome em minúsculas → valor e período; vale o primeiro.
 */
function propriedadesNomeadas(obj: Record<string, unknown>): Map<string, { valor: unknown; periodo: unknown }> {
  const mapa = new Map<string, { valor: unknown; periodo: unknown }>();
  for (const chave of ["realEstatePriceInfo", "properties", "featuresSummary"]) {
    const lista = obj[chave];
    if (!Array.isArray(lista)) continue;
    for (const item of lista) {
      if (!item || typeof item !== "object") continue;
      const { name, value, period } = item as Record<string, unknown>;
      if (typeof name !== "string" || mapa.has(name.toLowerCase())) continue;
      mapa.set(name.toLowerCase(), { valor: value, periodo: period });
    }
  }
  return mapa;
}

export function extrairDoEstado(
  estado: unknown,
  portal: Portal,
  idNoPortal: string | null,
): LeituraParcial | null {
  if (!idNoPortal) return null;

  const objetoAnuncio = buscarObjetoDoAnuncio(estado, idNoPortal);
  if (!objetoAnuncio) return null;

  const campos = camposVazios();

  // Modalidade: forRent / forSale
  const forRent = buscarChaveInsensivel(objetoAnuncio, ["forRent"]);
  const forSale = buscarChaveInsensivel(objetoAnuncio, ["forSale"]);
  if (forRent === true && forSale !== true) {
    campos.modalidade = "aluguel";
  } else if (forSale === true && forRent !== true) {
    campos.modalidade = "compra";
  } else {
    campos.modalidade = null;
  }

  // Preço
  const rentPrice = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["rentPrice", "rent"]));
  const salePrice = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["salePrice", "price"]));
  if (campos.modalidade === "aluguel") {
    campos.preco = rentPrice ?? salePrice;
  } else if (campos.modalidade === "compra") {
    campos.preco = salePrice ?? rentPrice;
  } else {
    campos.preco = rentPrice ?? salePrice;
  }

  // R$ 1 ou R$ 2 de condomínio ou IPTU é valor simbólico do portal ("não informado"), visto no ZAP real (15/11/2026).
  const simbolico = (n: number | null) => (n !== null && n <= 5 ? null : n);

  // Condomínio
  const condo = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["condoPrice", "condoFee", "monthlyCondoFee"]));
  campos.condominio = simbolico(condo);

  // ZAP e VivaReal com Next.js App Router (2026): `prices.rental` ou `prices.sale`, cada um com `value`,
  // `condominium` e `iptu`. A página mostra só "IPTU", sem período (teste no celular, 15/11/2026: R$ 180 lido como
  // anual dava R$ 15/mês contra R$ 131–165/mês no cadastro). O período fica desconhecido e é resolvido contra o
  // cadastro do prédio na confirmação (src/dados/iptuDoAnuncio.ts). Zero é "isento" ou ausência.
  const precos = objetoAnuncio["prices"];
  if (precos && typeof precos === "object" && !Array.isArray(precos)) {
    const { rental, sale } = precos as Record<string, unknown>;
    const ehObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
    const bloco = ehObjeto(rental) ? rental : ehObjeto(sale) ? sale : null;
    if (bloco) {
      campos.modalidade = ehObjeto(rental) ? "aluguel" : "compra";
      campos.preco = extrairNumero(bloco["value"]) ?? campos.preco;
      campos.condominio = simbolico(extrairNumero(bloco["condominium"])) ?? campos.condominio;
      const iptuSemPeriodo = simbolico(extrairNumero(bloco["iptu"]));
      if (iptuSemPeriodo !== null) campos.iptu = { valor: iptuSemPeriodo, periodo: "desconhecido" };
    }
  }

  // IPTU
  const yearlyIptu = simbolico(extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["yearlyIptu"])));
  const monthlyIptu = simbolico(extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["monthlyIptu"])));
  const iptuGen = simbolico(extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["iptu"])));

  if (campos.iptu !== null) {
    // já veio de `prices` (formato novo do ZAP e do VivaReal)
  } else if (yearlyIptu !== null) {
    campos.iptu = { valor: yearlyIptu, periodo: "ano" };
  } else if (monthlyIptu !== null) {
    campos.iptu = { valor: monthlyIptu, periodo: "mes" };
  } else if (iptuGen !== null) {
    const periodo: Periodo = portal === "quintoandar" ? "mes" : "desconhecido";
    campos.iptu = { valor: iptuGen, periodo };
  }

  // Seguro e Taxa ("homeProtection": o seguro incêndio no QuintoAndar)
  campos.seguroIncendio = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["insurance", "fireInsurance", "homeProtection"]));
  campos.taxaServico = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["tenantServiceFee", "serviceFee"]));
  campos.totalInformado = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["totalCost"]));

  // Área
  const areaRaw = buscarChaveInsensivel(objetoAnuncio, ["area", "usableArea", "usableAreas"]);
  if (Array.isArray(areaRaw)) {
    campos.area = extrairNumero(areaRaw[0]);
  } else {
    campos.area = extrairNumero(areaRaw);
  }

  // Quartos, Suítes, Banheiros, Vagas, Andar
  // No formato novo do ZAP e do VivaReal vêm em lista ("bedrooms": [1]); vale o primeiro, como na área.
  const primeiro = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);
  const bedrooms = extrairNumero(primeiro(buscarChaveInsensivel(objetoAnuncio, ["bedrooms"])));
  if (bedrooms !== null) campos.quartos = Math.round(bedrooms);

  const suites = extrairNumero(primeiro(buscarChaveInsensivel(objetoAnuncio, ["suites"])));
  if (suites !== null) campos.suites = Math.round(suites);

  const bathrooms = extrairNumero(primeiro(buscarChaveInsensivel(objetoAnuncio, ["bathrooms"])));
  if (bathrooms !== null) campos.banheiros = Math.round(bathrooms);

  const parking = extrairNumero(primeiro(buscarChaveInsensivel(objetoAnuncio, ["parkingSpaces"])));
  if (parking !== null) campos.vagas = Math.round(parking);

  const floor = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["floor", "unitFloor"]));
  if (floor !== null) campos.andar = Math.round(floor);

  // OLX: as listas de { name, value } preenchem o que as chaves comuns não trouxeram.
  const nomeadas = propriedadesNomeadas(objetoAnuncio);
  if (nomeadas.size > 0) {
    const numeroDe = (nome: string) => extrairNumero(nomeadas.get(nome)?.valor);
    const tipoDoNegocio = textoDoCampo(nomeadas.get("real_estate_type")?.valor) ?? "";
    if (campos.modalidade === null) {
      if (/^aluguel\b/i.test(tipoDoNegocio)) campos.modalidade = "aluguel";
      else if (/^venda\b/i.test(tipoDoNegocio)) campos.modalidade = "compra";
    }
    campos.condominio ??= simbolico(numeroDe("condominio"));
    const iptuNomeado = simbolico(numeroDe("iptu"));
    if (campos.iptu === null && iptuNomeado !== null) {
      const periodo = String(nomeadas.get("iptu")?.periodo ?? "");
      campos.iptu = { valor: iptuNomeado, periodo: /m[eê]s/i.test(periodo) ? "mes" : /ano/i.test(periodo) ? "ano" : "desconhecido" };
    }
    campos.area ??= numeroDe("size");
    const inteiro = (n: number | null) => (n === null ? null : Math.round(n));
    campos.quartos ??= inteiro(numeroDe("rooms"));
    campos.banheiros ??= inteiro(numeroDe("bathrooms"));
    campos.vagas ??= inteiro(numeroDe("garage_spaces"));
  }

  // Endereço
  // "$undefined" (marcador de ausência do ZAP) e afins não viram rua nem número.
  const street = textoDoCampo(buscarChaveInsensivel(objetoAnuncio, ["street"]));
  if (street) campos.logradouro = street;

  const numberRaw = buscarChaveInsensivel(objetoAnuncio, ["streetNumber", "number"]);
  const numStr = typeof numberRaw === "number" ? String(numberRaw) : textoDoCampo(numberRaw);
  if (numStr && /\d/.test(numStr)) campos.numero = numStr.slice(0, 12);

  // Nome do edifício: campo próprio, quando o portal tem; senão, "Edf. …" no título ou na descrição.
  const nomeDoCampo = textoDoCampo(buscarChaveInsensivel(objetoAnuncio, ["condominiumName", "buildingName", "condoName", "developmentName"]));
  campos.nomeEdificio = (nomeDoCampo ? nomeDoCampo.slice(0, 120) : null)
    ?? nomeDeEdificioNoTexto(textoDoCampo(buscarChaveInsensivel(objetoAnuncio, ["title", "subject"])))
    // O código interno do anunciante costuma trazer o prédio ("EDF CASTELO DE BRUNO RENDA, OPORTUNIDADE…").
    ?? nomeDeEdificioNoTexto(textoDoCampo(buscarChaveInsensivel(objetoAnuncio, ["externalId"])))
    ?? nomeDeEdificioNoTexto(textoDoCampo(buscarChaveInsensivel(objetoAnuncio, ["description"])));

  // "neighbourhood" e "municipality": a grafia da OLX.
  const neighborhood = textoDoCampo(buscarChaveInsensivel(objetoAnuncio, ["neighborhood", "neighbourhood"]));
  if (neighborhood) {
    campos.bairroTexto = neighborhood.trim();
    const norm = normalizarTexto(neighborhood);
    const achouBairro = BAIRROS_DO_RECIFE.find(
      (b) => normalizarTexto(b.nome) === norm || b.slug === norm || b.aliases?.includes(norm),
    );
    campos.bairro = achouBairro ? achouBairro.slug : null;
  }

  const city = textoDoCampo(buscarChaveInsensivel(objetoAnuncio, ["city", "municipality"]));
  if (city) {
    if (normalizarTexto(city).includes("recife")) {
      campos.cidade = "recife";
    }
  }

  const year = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["constructionYear", "buildingYear"]));
  if (year !== null) campos.anoConstrucao = Math.round(year);

  // QuintoAndar: `photos[].url` é só o nome do arquivo; a página e o JSON-LD o servem deste endereço (18/11/2026).
  const fotos = fotosDoAnuncio(objetoAnuncio, 12, portal === "quintoandar" ? FOTOS_DO_QUINTOANDAR : undefined);
  return {
    metodo: "json_ld",
    portal,
    idNoPortal,
    campos,
    ...(fotos.length ? { fotos } : {}),
  };
}

// ——— Mapa de chaves (Fatia 2B, modo de inspeção) —————————————————————————————————————————

/** Quantos níveis de chave abaixo do objeto do anúncio entram no mapa. */
const NIVEIS_DO_MAPA = 3;
/** Teto de caminhos devolvidos: o mapa serve para ler no console, não para despejar o estado inteiro. */
const CAMINHOS_NO_MAPA = 400;
/** Quantos itens de uma lista são percorridos para descobrir as chaves dos objetos dentro dela. */
const ITENS_POR_LISTA = 3;
/** Nome de chave que parece nome de campo. O que não parece (número, e-mail, texto livre) é dado, e dado não sai. */
const NOME_DE_CAMPO = /^[A-Za-z_$][\w$-]{0,59}$/;

/**
 * Caminhos das chaves do objeto do anúncio, até 3 níveis abaixo dele ("rentPrice", "address.street",
 * "listings[].imovelId"). Devolve só NOMES de chave, nunca valores, e nada fora do objeto do anúncio: os ramos do estado
 * com a conta da pessoa (`login`) e os outros anúncios (`houses`) não entram. Chave que não parece nome de campo (um
 * número, um e-mail) vira "<chave>". Sem `idNoPortal` ou sem o anúncio no estado, lista vazia.
 */
export function chavesDoAnuncio(estado: unknown, idNoPortal: string | null): string[] {
  if (!idNoPortal) return [];
  const anuncio = buscarObjetoDoAnuncio(estado, idNoPortal);
  if (!anuncio) return [];

  const caminhos = new Set<string>();

  function descer(no: unknown, prefixo: string, nivel: number): void {
    if (nivel > NIVEIS_DO_MAPA || caminhos.size >= CAMINHOS_NO_MAPA) return;
    if (Array.isArray(no)) {
      // A lista não é um nível: as chaves dos objetos dentro dela são do mesmo nível, sob "chave[]".
      for (const item of no.slice(0, ITENS_POR_LISTA)) descer(item, `${prefixo}[]`, nivel);
      return;
    }
    if (!no || typeof no !== "object") return;
    for (const [chave, filho] of Object.entries(no as Record<string, unknown>)) {
      if (caminhos.size >= CAMINHOS_NO_MAPA) return;
      const nome = NOME_DE_CAMPO.test(chave) ? chave : "<chave>";
      const caminho = prefixo ? `${prefixo}.${nome}` : nome;
      caminhos.add(caminho);
      descer(filho, caminho, nivel + 1);
    }
  }

  descer(anuncio, "", 1);
  return [...caminhos];
}
