const fs=require("fs"),path=require("path");
const D=process.argv[2];
const todos=[];const porBairro={};const obrasDe={};
for(const f of fs.readdirSync(D)){const j=JSON.parse(fs.readFileSync(path.join(D,f)));if(!j.edificios)continue;porBairro[j.bairro]=j.edificios;obrasDe[j.bairro]=j.obras;todos.push(...j.edificios);}
const MPG=(Math.PI/180)*6371008.8;
const proj=o=>([lon,lat])=>[(lon-o[0])*MPG*Math.cos(o[1]*Math.PI/180),-(lat-o[1])*MPG];
const L=320,A=280,MARG=0.22,VAO=80,FOLGA=30;
function quadro(e,pts){const p=proj(e.centro);const pl=e.poligono?e.poligono.map(p):[];const t=[[0,0],...pl,...pts];
 const xs=t.map(a=>a[0]),ys=t.map(a=>a[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const vx=Math.max((maxX-minX)*(1+2*MARG),VAO),vy=Math.max((maxY-minY)*(1+2*MARG),VAO*A/L);const mpp=Math.max(vx/L,vy/A);
 return {mpp,meioX:(minX+maxX)/2,meioY:(minY+maxY)/2,mx:L/2*mpp+FOLGA,my:A/2*mpp+FOLGA,larguraM:L*mpp};}
function contar(e,q,lista){const p=proj(e.centro);let n=0;for(const v of lista){if(v.id===e.id||!v.poligono)continue;const [x,y]=p(v.centro);if(Math.abs(x-q.meioX)<=q.mx&&Math.abs(y-q.meioY)<=q.my)n++;}return n;}
function caso(b,e){const p=proj(e.centro);const obras=((e.obras150m&&e.obras150m.recentes)||[]).map(([i])=>obrasDe[b][i]);
 const r={bairro:b,id:e.id,pav:e.pavimentos,obras:obras.length};
 const g=quadro(e,obras.filter(o=>o.centro).map(o=>p(o.centro)));
 r.gaveta={larguraM:Math.round(g.larguraM),mPorPx:+g.mpp.toFixed(2),mesmoBairro:contar(e,g,porBairro[b]),todosBairros:contar(e,g,todos)};
 for(const R of [600,1300]){const q=quadro(e,[[R,0],[-R,0],[0,R],[0,-R]]);r["porPerto"+R]={larguraM:Math.round(q.larguraM),mPorPx:+q.mpp.toFixed(2),mesmoBairro:contar(e,q,porBairro[b]),todosBairros:contar(e,q,todos)};}
 return r;}
for(const b of ["boa-viagem","torre","casa-forte"]){const eds=porBairro[b].filter(e=>e.poligono);
 // mediana por nº de obras recentes e o de mais unidades
 const comObras=[...eds].sort((a,c)=>((c.obras150m?.recentes?.length||0)-(a.obras150m?.recentes?.length||0)));
 const tipico=[...eds].sort((a,c)=>(c.unidades||0)-(a.unidades||0))[Math.floor(eds.length/2)];
 console.log(JSON.stringify(caso(b,comObras[0])));console.log(JSON.stringify(caso(b,tipico)));}
// distribuição: % de prédios do município cujo quadro porPerto1300 passa de 60
let acima=0,acimaG=0;for(const [b,eds] of Object.entries(porBairro))for(const e of eds){if(!e.poligono)continue;const p=proj(e.centro);const q=quadro(e,[[1300,0],[-1300,0],[0,1300],[0,-1300]]);if(contar(e,q,eds)>60)acima++;const o=(e.obras150m?.recentes||[]).map(([i])=>obrasDe[b][i]).filter(o=>o&&o.centro).map(o=>p(o.centro));if(contar(e,quadro(e,o),eds)>60)acimaG++;}
console.log("predios com >60 no quadro (mesmo bairro): porPerto1300",acima,"gaveta",acimaG,"de",todos.filter(e=>e.poligono).length);
