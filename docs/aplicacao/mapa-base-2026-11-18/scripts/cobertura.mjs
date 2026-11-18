import fs from "node:fs"; import readline from "node:readline"; import { createRequire } from "node:module";
const turf = createRequire(import.meta.url)("@turf/turf");
const B = process.argv[2];
const q = JSON.parse(fs.readFileSync(B+"/quadras.geojson","utf8")).features;
const bairros = JSON.parse(fs.readFileSync(B+"/bairros-do-recife.geojson","utf8")).features;
const cen = f => { const g=f.geometry; const a = g.type==="MultiPolygon"?g.coordinates[0]?.[0]:g.coordinates[0]; if(!a?.length) return null; let x=0,y=0; for(const c of a){x+=c[0];y+=c[1]} return [x/a.length,y/a.length]; };
const G = 0.002, grid = new Map(), key=(x,y)=>Math.floor(x/G)+","+Math.floor(y/G);
const rl = readline.createInterface({ input: fs.createReadStream(B+"/lotes.geojson") });
for await (const l of rl) { if(!l.startsWith('{ "type": "Feature"')) continue; const f=JSON.parse(l.replace(/,\s*$/,"")); if(!f.geometry) continue; const c=cen(f); if(!c) continue; const k=key(...c); if(!grid.has(k)) grid.set(k,[]); grid.get(k).push(c); }
const bairroDe = p => bairros.find(b => turf.booleanPointInPolygon(p,b))?.properties.EBAIRRNOMEOF ?? "(fora)";
const porB = {};
let vazias=0, areaVazia=0, areaTot=0;
for (const f of q) { const c=cen(f); if(!c) continue; const bb=turf.bbox(f); let tem=false;
  for(let x=Math.floor(bb[0]/G);x<=Math.floor(bb[2]/G)&&!tem;x++) for(let y=Math.floor(bb[1]/G);y<=Math.floor(bb[3]/G)&&!tem;y++) for(const p of grid.get(x+","+y)||[]) if(p[0]>=bb[0]&&p[0]<=bb[2]&&p[1]>=bb[1]&&p[1]<=bb[3]&&turf.booleanPointInPolygon(p,f)){tem=true;break;}
  const a=turf.area(f); areaTot+=a; const b=bairroDe(c); porB[b]=porB[b]||{q:0,v:0,a:0,av:0}; porB[b].q++; porB[b].a+=a; if(!tem){vazias++;areaVazia+=a;porB[b].v++;porB[b].av+=a;} }
console.log(`quadras sem nenhum lote (geométrico): ${vazias} de ${q.length} (${(vazias/q.length*100).toFixed(1)}%), ${(areaVazia/areaTot*100).toFixed(1)}% da área de quadras`);
const lista = Object.entries(porB).map(([b,v])=>[b,v.q,v.v,(v.av/v.a*100).toFixed(0)]).sort((a,b)=>b[3]-a[3]);
console.log("piores (bairro, quadras, vazias, % área vazia):", lista.slice(0,12).map(x=>x.join("/")).join("; "));
for (const n of ["Boa Viagem","Torre","Pina","Imbiribeira"]) { const v=porB[n]; console.log(n, v.q, "vazias", v.v, (v.av/v.a*100).toFixed(1)+"% área"); }
console.log("bairros com <10% de área vazia:", lista.filter(x=>+x[3]<10).length, "de", lista.length);
