// Vínculo de nome de rua (texto da fonte) ao código oficial do logradouro (VE02.02, etapa "linked" do relatório).
// Usa a malha oficial `trechos-de-logradouros.geojson` (CLOGRACODI, NLGPAVOFIC) e os polígonos oficiais dos bairros para
// separar ruas homônimas. Regra determinística, sem revisão humana: só vincula quando sobra exatamente um código
// compatível com o nome E com o bairro informado. Ambiguidade fica registrada, nunca resolvida por chute.
import { analisarLogradouro, dobrar } from "../rua/nucleo.mjs";

export const VERSAO_DO_VINCULO = "1";

const slug = (t) => dobrar(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function dentroDoAnel(x, y, anel) {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i];
    const [xj, yj] = anel[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Índice: nome analisado → [{ codigo, bairros:Set<slug> }]. */
export function criarIndiceDeRuas(trechos, bairrosGeojson) {
  const poligonos = [];
  for (const f of bairrosGeojson.features) {
    const s = slug(f.properties.EBAIRRNOME);
    const g = f.geometry;
    for (const p of g.type === "MultiPolygon" ? g.coordinates : [g.coordinates]) {
      const anel = p[0];
      let w = Infinity, e = -Infinity, so = Infinity, n = -Infinity;
      for (const [x, y] of anel) { w = Math.min(w, x); e = Math.max(e, x); so = Math.min(so, y); n = Math.max(n, y); }
      poligonos.push({ s, anel, caixa: [w, so, e, n] });
    }
  }
  const bairrosDoPonto = (x, y) => poligonos.filter((p) => x >= p.caixa[0] && x <= p.caixa[2] && y >= p.caixa[1] && y <= p.caixa[3] && dentroDoAnel(x, y, p.anel)).map((p) => p.s);

  const porCodigo = new Map();
  for (const f of trechos.features) {
    const codigo = f.properties.CLOGRACODI;
    if (codigo === null || codigo === undefined || !f.geometry) continue;
    const c = Number(codigo);
    const reg = porCodigo.get(c) ?? { codigo: c, nome: f.properties.NLGPAVOFIC || f.properties.NLOGRACONC || "", bairros: new Set() };
    const linhas = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
    for (const linha of linhas) {
      // Vértices e pontos médios: basta para saber quais bairros a via atravessa.
      for (let i = 0; i < linha.length; i++) {
        for (const b of bairrosDoPonto(linha[i][0], linha[i][1])) reg.bairros.add(b);
        if (i + 1 < linha.length) {
          for (const b of bairrosDoPonto((linha[i][0] + linha[i + 1][0]) / 2, (linha[i][1] + linha[i + 1][1]) / 2)) reg.bairros.add(b);
        }
      }
    }
    porCodigo.set(c, reg);
  }
  const chaves = { completa: new Map(), classeCompleta: new Map(), semTitulo: new Map() };
  const por = (mapa, k, reg) => { if (!k) return; mapa.set(k, [...(mapa.get(k) ?? []), reg]); };
  for (const reg of porCodigo.values()) {
    const a = analisarLogradouro(reg.nome);
    por(chaves.classeCompleta, `${a.classe}|${a.completa}`, reg);
    por(chaves.completa, a.completa, reg);
    por(chaves.semTitulo, a.semTitulo, reg);
  }
  return { porCodigo, chaves, bairrosDoPonto };
}

/** { codigo, metodo } com metodo em: nome_e_bairro, ambiguo, nome_fora_do_bairro, sem_correspondencia. */
export function vincularRua(indice, ruaTexto, bairroSlug) {
  const a = analisarLogradouro(ruaTexto);
  const tentativas = [
    indice.chaves.classeCompleta.get(`${a.classe}|${a.completa}`),
    indice.chaves.completa.get(a.completa),
    indice.chaves.semTitulo.get(a.semTitulo),
  ];
  for (const candidatos of tentativas) {
    if (!candidatos?.length) continue;
    const noBairro = bairroSlug ? candidatos.filter((c) => c.bairros.has(bairroSlug)) : candidatos;
    if (noBairro.length === 1) return { codigo: noBairro[0].codigo, metodo: "nome_e_bairro" };
    if (noBairro.length > 1) return { codigo: null, metodo: "ambiguo" };
    return { codigo: null, metodo: "nome_fora_do_bairro" };
  }
  return { codigo: null, metodo: "sem_correspondencia" };
}
