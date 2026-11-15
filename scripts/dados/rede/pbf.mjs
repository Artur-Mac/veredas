// Leitor de OSM PBF sem dependências (VE03.02). Formato: https://wiki.openstreetmap.org/wiki/PBF_Format
// Arquivo = sequência de [int32 BE tamanho][BlobHeader][Blob]; o Blob traz um PrimitiveBlock comprimido com zlib.
// Lê nós (densos ou não) e vias; relações são puladas (a rede de caminhada não precisa delas nesta época).
// Ids de até 2^53 cabem em Number sem perda (ids OSM atuais < 2^34).
import { Buffer } from "node:buffer";
import { closeSync, openSync, readSync } from "node:fs";
import { inflateSync } from "node:zlib";

const decodificador = new TextDecoder();

/** Leitor protobuf mínimo sobre um Uint8Array. */
class Protobuf {
  constructor(buf, inicio = 0, fim = buf.length) {
    this.buf = buf;
    this.pos = inicio;
    this.fim = fim;
  }
  get acabou() {
    return this.pos >= this.fim;
  }
  varint() {
    let r = 0, mult = 1, b;
    do {
      b = this.buf[this.pos++];
      r += (b & 0x7f) * mult;
      mult *= 128;
    } while (b & 0x80);
    return r;
  }
  svarint() {
    const n = this.varint();
    return n % 2 === 1 ? -(n + 1) / 2 : n / 2;
  }
  /** [campo, tipo] da próxima chave. */
  chave() {
    const k = this.varint();
    return [Math.floor(k / 8), k & 7];
  }
  /** Sub-mensagem ou bytes: [inicio, fim] no mesmo buffer. */
  delimitado() {
    const n = this.varint();
    const inicio = this.pos;
    this.pos += n;
    return [inicio, inicio + n];
  }
  pular(tipo) {
    if (tipo === 0) this.varint();
    else if (tipo === 1) this.pos += 8;
    // O comprimento tem de ser lido antes de somar: em `this.pos += this.varint()` o `pos` antigo seria usado.
    else if (tipo === 2) { const n = this.varint(); this.pos += n; }
    else if (tipo === 5) this.pos += 4;
    else throw new Error(`Tipo protobuf ${tipo} não suportado`);
  }
}

function* varintsEmpacotados(buf, [inicio, fim], comSinal) {
  const p = new Protobuf(buf, inicio, fim);
  while (!p.acabou) yield comSinal ? p.svarint() : p.varint();
}

function lerBlocoBruto(fd, posicao) {
  const tam = Buffer.alloc(4);
  if (readSync(fd, tam, 0, 4, posicao) < 4) return null;
  const tamCabecalho = tam.readUInt32BE(0);
  const cab = Buffer.alloc(tamCabecalho);
  readSync(fd, cab, 0, tamCabecalho, posicao + 4);
  const pc = new Protobuf(cab);
  let tipo = null, tamDados = 0;
  while (!pc.acabou) {
    const [campo, t] = pc.chave();
    if (campo === 1) { const [i, f] = pc.delimitado(); tipo = decodificador.decode(cab.subarray(i, f)); }
    else if (campo === 3) tamDados = pc.varint();
    else pc.pular(t);
  }
  const blob = Buffer.alloc(tamDados);
  readSync(fd, blob, 0, tamDados, posicao + 4 + tamCabecalho);
  const pb = new Protobuf(blob);
  let dados = null;
  while (!pb.acabou) {
    const [campo, t] = pb.chave();
    if (campo === 1) { const [i, f] = pb.delimitado(); dados = blob.subarray(i, f); }
    else if (campo === 3) { const [i, f] = pb.delimitado(); dados = inflateSync(blob.subarray(i, f)); }
    else pb.pular(t);
  }
  if (dados === null) throw new Error(`Blob sem dados suportados (só raw e zlib) em ${posicao}`);
  return { tipo, dados, proximo: posicao + 4 + tamCabecalho + tamDados };
}

/**
 * Percorre o arquivo. `aoNo(id, lon, lat, tags|null)` e `aoCaminho(id, refs, tags)`. `querTagsDoNo(lon, lat)` decide se
 * as tags de um nó denso precisam virar objeto (custo), por exemplo só dentro da área de interesse.
 * Devolve contagens. Exige arquivo ordenado (nós antes das vias), como os extratos do Geofabrik.
 */
export function lerPbf(caminho, { aoNo = null, aoCaminho = null, querTagsDoNo = () => true } = {}) {
  const fd = openSync(caminho, "r");
  const contagens = { blocos: 0, nos: 0, vias: 0, relacoesPuladas: 0, cabecalhoVisto: false, ordenado: true };
  let jaViuVia = false;
  try {
    for (let pos = 0; ;) {
      const bloco = lerBlocoBruto(fd, pos);
      if (!bloco) break;
      pos = bloco.proximo;
      if (bloco.tipo === "OSMHeader") { contagens.cabecalhoVisto = true; continue; }
      if (bloco.tipo !== "OSMData") continue;
      contagens.blocos += 1;
      const buf = bloco.dados;
      const p = new Protobuf(buf);
      let tabela = null, grupos = [], granularidade = 100, offLat = 0, offLon = 0;
      while (!p.acabou) {
        const [campo, t] = p.chave();
        if (campo === 1) tabela = p.delimitado();
        else if (campo === 2) grupos.push(p.delimitado());
        else if (campo === 17) granularidade = p.varint();
        else if (campo === 19) offLat = p.varint();
        else if (campo === 20) offLon = p.varint();
        else p.pular(t);
      }
      const strings = [];
      if (tabela) {
        const pt = new Protobuf(buf, tabela[0], tabela[1]);
        while (!pt.acabou) {
          const [campo, t] = pt.chave();
          if (campo === 1) { const [i, f] = pt.delimitado(); strings.push(decodificador.decode(buf.subarray(i, f))); }
          else pt.pular(t);
        }
      }
      const coord = (v, off) => 1e-9 * (off + granularidade * v);
      for (const [gi, gf] of grupos) {
        const pg = new Protobuf(buf, gi, gf);
        while (!pg.acabou) {
          const [campo, t] = pg.chave();
          if (campo === 2 && aoNo) {
            if (jaViuVia) contagens.ordenado = false;
            const [di, df] = pg.delimitado();
            const pd = new Protobuf(buf, di, df);
            let ids = null, lats = null, lons = null, kv = null;
            while (!pd.acabou) {
              const [c, tt] = pd.chave();
              if (c === 1) ids = pd.delimitado();
              else if (c === 8) lats = pd.delimitado();
              else if (c === 9) lons = pd.delimitado();
              else if (c === 10) kv = pd.delimitado();
              else pd.pular(tt);
            }
            const gIds = varintsEmpacotados(buf, ids, true), gLat = varintsEmpacotados(buf, lats, true), gLon = varintsEmpacotados(buf, lons, true);
            const gKv = kv ? varintsEmpacotados(buf, kv, false) : null;
            let id = 0, la = 0, lo = 0;
            for (const dId of gIds) {
              id += dId; la += gLat.next().value; lo += gLon.next().value;
              const lat = coord(la, offLat), lon = coord(lo, offLon);
              let tags = null;
              if (gKv) {
                const quer = querTagsDoNo(lon, lat);
                for (let k = gKv.next().value; k !== 0 && k !== undefined; k = gKv.next().value) {
                  const v = gKv.next().value;
                  if (quer) (tags ??= {})[strings[k]] = strings[v];
                }
              }
              contagens.nos += 1;
              aoNo(id, lon, lat, tags);
            }
          } else if (campo === 1 && aoNo) {
            // Nó não denso (raro nos extratos atuais).
            const [ni, nf] = pg.delimitado();
            const pn = new Protobuf(buf, ni, nf);
            let id = 0, la = 0, lo = 0, ks = [], vs = [];
            while (!pn.acabou) {
              const [c, tt] = pn.chave();
              if (c === 1) id = pn.svarint();
              else if (c === 2) ks = [...varintsEmpacotados(buf, pn.delimitado(), false)];
              else if (c === 3) vs = [...varintsEmpacotados(buf, pn.delimitado(), false)];
              else if (c === 8) la = pn.svarint();
              else if (c === 9) lo = pn.svarint();
              else pn.pular(tt);
            }
            const tags = ks.length ? Object.fromEntries(ks.map((k, i) => [strings[k], strings[vs[i]]])) : null;
            contagens.nos += 1;
            aoNo(id, coord(lo, offLon), coord(la, offLat), tags);
          } else if (campo === 3 && aoCaminho) {
            jaViuVia = true;
            const [wi, wf] = pg.delimitado();
            const pw = new Protobuf(buf, wi, wf);
            let id = 0, ks = null, vs = null, refs = null;
            while (!pw.acabou) {
              const [c, tt] = pw.chave();
              if (c === 1) id = pw.varint();
              else if (c === 2) ks = pw.delimitado();
              else if (c === 3) vs = pw.delimitado();
              else if (c === 8) refs = pw.delimitado();
              else pw.pular(tt);
            }
            const tags = {};
            if (ks) {
              const gv = varintsEmpacotados(buf, vs, false);
              for (const k of varintsEmpacotados(buf, ks, false)) tags[strings[k]] = strings[gv.next().value];
            }
            const nos = [];
            let acumulado = 0;
            if (refs) for (const d of varintsEmpacotados(buf, refs, true)) { acumulado += d; nos.push(acumulado); }
            contagens.vias += 1;
            aoCaminho(id, nos, tags);
          } else if (campo === 4) {
            contagens.relacoesPuladas += 1;
            pg.pular(t);
          } else pg.pular(t);
        }
      }
    }
  } finally {
    closeSync(fd);
  }
  return contagens;
}
