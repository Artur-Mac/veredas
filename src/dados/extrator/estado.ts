import {
  camposVazios,
  type LeituraParcial,
  type Periodo,
  type Portal,
} from "../contratos";
import { BAIRROS_DO_RECIFE } from "../recife/bairros";
import { normalizarTexto } from "./bairro";

const CHAVES_ID = new Set(["id", "listingid", "legacyid", "houseid"]);

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
    for (const [k, v] of Object.entries(obj)) {
      if (CHAVES_ID.has(k.toLowerCase())) {
        if (v !== null && v !== undefined && String(v).trim() === idStr) {
          return obj;
        }
      }
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

  return null;
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
    const n = Number(val.replace(/\./g, "").replace(",", "."));
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

  // Condomínio
  const condo = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["condoPrice", "condoFee", "monthlyCondoFee"]));
  campos.condominio = condo;

  // IPTU
  const yearlyIptu = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["yearlyIptu"]));
  const monthlyIptu = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["monthlyIptu"]));
  const iptuGen = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["iptu"]));

  if (yearlyIptu !== null) {
    campos.iptu = { valor: yearlyIptu, periodo: "ano" };
  } else if (monthlyIptu !== null) {
    campos.iptu = { valor: monthlyIptu, periodo: "mes" };
  } else if (iptuGen !== null) {
    const periodo: Periodo = portal === "quintoandar" ? "mes" : "desconhecido";
    campos.iptu = { valor: iptuGen, periodo };
  }

  // Seguro e Taxa
  campos.seguroIncendio = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["insurance", "fireInsurance"]));
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
  const bedrooms = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["bedrooms"]));
  if (bedrooms !== null) campos.quartos = Math.round(bedrooms);

  const suites = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["suites"]));
  if (suites !== null) campos.suites = Math.round(suites);

  const bathrooms = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["bathrooms"]));
  if (bathrooms !== null) campos.banheiros = Math.round(bathrooms);

  const parking = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["parkingSpaces"]));
  if (parking !== null) campos.vagas = Math.round(parking);

  const floor = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["floor", "unitFloor"]));
  if (floor !== null) campos.andar = Math.round(floor);

  // Endereço
  const street = buscarChaveInsensivel(objetoAnuncio, ["street"]);
  if (typeof street === "string" && street.trim()) {
    campos.logradouro = street.trim();
  }

  const numberRaw = buscarChaveInsensivel(objetoAnuncio, ["streetNumber", "number"]);
  if (numberRaw !== undefined && numberRaw !== null) {
    const numStr = String(numberRaw).trim();
    if (numStr) campos.numero = numStr;
  }

  const neighborhood = buscarChaveInsensivel(objetoAnuncio, ["neighborhood"]);
  if (typeof neighborhood === "string" && neighborhood.trim()) {
    campos.bairroTexto = neighborhood.trim();
    const norm = normalizarTexto(neighborhood);
    const achouBairro = BAIRROS_DO_RECIFE.find(
      (b) => normalizarTexto(b.nome) === norm || b.slug === norm || b.aliases?.includes(norm),
    );
    campos.bairro = achouBairro ? achouBairro.slug : null;
  }

  const city = buscarChaveInsensivel(objetoAnuncio, ["city"]);
  if (typeof city === "string" && city.trim()) {
    if (normalizarTexto(city).includes("recife")) {
      campos.cidade = "recife";
    }
  }

  const year = extrairNumero(buscarChaveInsensivel(objetoAnuncio, ["constructionYear", "buildingYear"]));
  if (year !== null) campos.anoConstrucao = Math.round(year);

  return {
    metodo: "json_ld",
    portal,
    idNoPortal,
    campos,
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
