import { chromium } from 'file:///C:/Users/ssamu/OneDrive/Desktop/repos/veredas/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path';
const D='C:/Users/ssamu/OneDrive/Desktop/repos/veredas/src/dados/recife/indice-municipal/faa40c969275e6b5';
const polys=[];for(const f of fs.readdirSync(D)){const j=JSON.parse(fs.readFileSync(path.join(D,f)));if(!j.edificios)continue;for(const e of j.edificios)if(e.poligono)polys.push(e.poligono);}
// centro Boa Viagem; projeta para 320x280 com 6 m/px (quadro ~2 km)
const c=[-34.9010,-8.1200];const MPG=(Math.PI/180)*6371008.8,cos=Math.cos(c[1]*Math.PI/180);
const proj=([lo,la],mpp)=>[160+(lo-c[0])*MPG*cos/mpp,140-(la-c[1])*MPG/mpp];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const page=await browser.newPage({viewport:{width:360,height:640}});
const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await page.setContent('<body style="margin:0"><div id="r"></div></body>');
const res=[];
for(const N of [60,300,1000,3000,7179]){
 const sel=polys.slice(0,N).map(p=>p.map(q=>proj(q,1.5)).map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`));
 for(const modo of ['separados-tracejado','separados','um-path','canvas']){
  const t=await page.evaluate(async({sel,modo})=>{
   const r=document.getElementById('r');r.innerHTML='';await new Promise(a=>requestAnimationFrame(()=>requestAnimationFrame(a)));
   const t0=performance.now();
   if(modo==='canvas'){const cv=document.createElement('canvas');cv.width=640;cv.height=560;cv.style.width='320px';r.appendChild(cv);const g=cv.getContext('2d');g.scale(2,2);g.strokeStyle='#2E5A85';g.fillStyle='rgba(46,90,133,.05)';g.beginPath();for(const s of sel){s.forEach((p,i)=>{const [x,y]=p.split(',').map(Number);i?g.lineTo(x,y):g.moveTo(x,y)});g.closePath();}g.fill();g.stroke();}
   else{const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('width','320');svg.setAttribute('height','280');
    const mk=d=>{const p=document.createElementNS(ns,'path');p.setAttribute('d',d);p.setAttribute('fill','#2E5A85');p.setAttribute('fill-opacity','.05');p.setAttribute('stroke','#2E5A85');if(modo==='separados-tracejado')p.setAttribute('stroke-dasharray','4 3');svg.appendChild(p);};
    if(modo==='um-path')mk(sel.map(s=>'M'+s.join('L')+'Z').join(''));else for(const s of sel)mk('M'+s.join('L')+'Z');r.appendChild(svg);}
   await new Promise(a=>requestAnimationFrame(()=>requestAnimationFrame(a)));return performance.now()-t0;},{sel,modo});
  res.push({N,modo,ms:Math.round(t)});}}
console.table(res);await browser.close();
