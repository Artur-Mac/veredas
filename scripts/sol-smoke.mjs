import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base=process.env.SOL_URL || 'http://localhost:8109';
const passo=process.env.SOL_PASSO || 'pass-1';
const out=path.resolve('docs/produto/sol-nas-janelas-2026-10-27/evidencias',passo);
await mkdir(out,{recursive:true});
const pack=JSON.parse(await readFile('src/dados/sol/recortes/casa-forte.json','utf8'));
const indice=JSON.parse(await readFile('src/dados/recife/indice-municipal/91b71d239c1847cf/casa-forte.json','utf8'));
const v=pack.volumes.find(v=>v[2]>8&&v[3]===1&&indice.edificios.some(e=>e.dsqfl===pack.lotes[v[1]]));
const predio=indice.edificios.find(e=>e.dsqfl===pack.lotes[v[1]]);
const nulo={valor:null,origem:'voce',aConfirmar:false};
const a={versao:2,id:'solar-qa',criadaEm:'2026-10-27T12:00:00.000Z',atualizadaEm:'2026-10-27T12:00:00.000Z',nome:'Apartamento da visita',modalidade:'aluguel',tipologia:'apartamento',url:'',bairroTexto:'Casa Forte',bairro:'casa-forte',logradouro:predio.logradouro,numero:predio.numero,nomeEdificio:predio.nome,extracao:null,
 declarados:{preco:{...nulo,valor:3000},condominio:{...nulo,valor:600},iptu:{...nulo,periodo:'desconhecido'},seguroIncendio:nulo,taxaServico:nulo,outros:nulo,area:{...nulo,valor:80},quartos:{...nulo,valor:2},suites:nulo,banheiros:nulo,vagas:nulo,andar:nulo},
 vinculo:{estado:'confirmado',edificioId:predio.id,dsqfl:predio.dsqfl,confirmadoEm:'2026-10-27T12:00:00.000Z',indiceGeradoEm:'2026-10-22T00:30:36Z'},visita:{verificadas:[],respostas:{},perguntasProprias:[],notas:'',ruido:null,orientacaoGraus:null,segundos:0,concluidaEm:null},salva:true,descarte:null};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Los_Angeles',reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(a=>{if(!localStorage.getItem('solar-qa-iniciado')){localStorage.setItem('vereda-analises-v2',JSON.stringify([a]));localStorage.setItem('vereda-ativa-v1',JSON.stringify(a.id));localStorage.setItem('solar-qa-iniciado','sim');}},a);
const shot=async n=>{
 if(/^(01|02|09)/.test(n))await page.evaluate(()=>{for(const e of document.querySelectorAll('*'))if(e.scrollHeight>e.clientHeight+10)e.scrollTop=0;});
 if(/^(05|06|07)/.test(n))await page.getByText('Os prédios ao redor',{exact:true}).scrollIntoViewIfNeeded();
 if(/^08/.test(n))await page.getByText('O sol em cada janela',{exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:path.join(out,`${n}.png`),fullPage:true});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'rolagem horizontal');
};
const btn=n=>page.getByRole('button',{name:n,exact:true});
try {
 await page.goto(base+'/sol?id=solar-qa',{waitUntil:'networkidle',timeout:120000});
 await page.getByText('Qual janela vamos observar?',{exact:true}).waitFor({timeout:60000});
 await shot('01-captura-390');
 await btn('oeste').click();await btn('Guardar direção').click();
 await page.getByText('Voltada para oeste',{exact:true}).waitFor();await shot('02-explorar-390');
 const slider=page.getByRole('slider',{name:'Horário',exact:true});
 await slider.focus();await page.keyboard.press('Home');await page.getByText('Agora é noite no percurso solar',{exact:true}).waitFor();await shot('03-noite-390');
 await page.keyboard.press('ArrowRight');assert.equal(await slider.getAttribute('aria-valuenow'),'10');
 await slider.focus();await page.keyboard.press('End');
 await btn('Mudar data').click();await btn('21 de junho').click();
 assert.match(await page.locator('body').innerText(),/21\/06\/2026/);
 await btn('Mudar data').click();await btn('21 de dezembro').click();await shot('04-dezembro-390');
 await slider.focus();await page.keyboard.press('Home');for(let i=0;i<90;i++)await page.keyboard.press('ArrowRight');
 const started=Date.now();await btn('Ver entorno').click();await page.getByRole('textbox',{name:'Andar do apartamento',exact:true}).waitFor({timeout:30000});
 const entornoAbrirMs=Date.now()-started;
 await page.getByRole('textbox',{name:'Andar do apartamento',exact:true}).fill('5');
 await shot('05-posicao-390');await btn('Usar esta posição').click();
 await page.getByText('Influência de um vizinho',{exact:true}).waitFor({timeout:30000});await shot('06-entorno-390');
 if(await btn('Vizinho 1').count()){await btn('Vizinho 1').click();await btn('Sem este obstáculo · hipótese').click();await shot('07-hipotese-390');}
 await btn('Gerenciar janelas').click();await btn('Adicionar outra janela').click();await btn('Quarto').click();await btn('leste').click();await btn('Guardar direção').click();
 await page.getByText('Voltada para leste',{exact:true}).waitFor();await btn('Comparar com outra janela').click();
 await btn('Sala · Apartamento da visita').click();await shot('08-comparacao-390');
 const salvas=await page.evaluate(()=>JSON.parse(localStorage.getItem('vereda-analises-v2'))[0]);
 assert.equal(salvas.caderno.solar.janelas.length,2);assert.equal(salvas.caderno.solar.janelas[0].andar,5);
 await page.reload({waitUntil:'networkidle'});await page.getByText('Voltada para leste',{exact:true}).waitFor();
 await btn('Como foi estimado').click();await btn('Varanda').click();await page.getByText('Anotação da visita. Sem dimensões, essas proteções não entram no cálculo de sombras.',{exact:true}).waitFor();
 assert.equal(await btn('Varanda').getAttribute('aria-pressed'),'true');await btn('Como foi estimado').click();
 await context.setOffline(true);await btn('Mudar data').click();await btn('21 de junho').click();await context.setOffline(false);
 for(const [name,viewport] of [['360',{width:360,height:800}],['desktop',{width:1280,height:900}],['horizontal',{width:844,height:390}]]){
  await page.setViewportSize(viewport);await shot(`09-explorar-${name}`);
 }
 await page.setViewportSize({width:360,height:800});
 const estilosAntes=await page.evaluate(()=>{const es=[...document.querySelectorAll('[dir="auto"]')].map(e=>({e,tamanho:parseFloat(getComputedStyle(e).fontSize),linha:parseFloat(getComputedStyle(e).lineHeight)}));es.forEach(({e,tamanho,linha})=>{e.dataset.solarFontAntes=e.style.fontSize;e.dataset.solarLinhaAntes=e.style.lineHeight;e.style.fontSize=`${tamanho*1.5}px`;if(Number.isFinite(linha))e.style.lineHeight=`${linha*1.5}px`;});return es.length;});
 assert(estilosAntes>0);await shot('09-fonte-ampliada-360');
 await page.evaluate(()=>{for(const e of document.querySelectorAll('[data-solar-font-antes]')){e.style.fontSize=e.dataset.solarFontAntes;e.style.lineHeight=e.dataset.solarLinhaAntes;}});
 await page.setViewportSize({width:390,height:844});await btn('Mudar data').click();await page.getByRole('textbox',{name:'Data (dia/mês/ano)'}).fill('31/02/2026');await btn('Usar esta data').click();await page.getByText('Use uma data válida no formato dia/mês/ano.',{exact:true}).waitFor();await btn('Hoje').click();
 await page.setViewportSize({width:360,height:800});await page.goto(base+'/dossie?id=solar-qa',{waitUntil:'networkidle'});
 await page.getByText('Sol nas suas janelas',{exact:true}).waitFor();await shot('10-dossie-360');
 await page.getByRole('tab',{name:'Entorno',exact:true}).click();assert(!/Sol, sombra e vento do Recife|Brisa Sudeste/.test(await page.locator('body').innerText()),'síntese solar antiga reapareceu');
 assert.equal(errors.length,0,errors.join('\n'));
 await writeFile(path.join(out,'resultado.json'),JSON.stringify({passo,erroPagina:errors,entornoAbrirMs,viewport:'390x844 / 360x800 / 1280x900 / 844x390',janelas:salvas.caderno.solar.janelas.length,casos:['captura manual','calendário sazonal','noite','teclado','entorno','posição por fachada','hipótese','comparação','persistência após recarga','interação offline após carga','dossiê'],limite:'Chromium desktop; não comprova sensores ou desempenho em celular físico'},null,2));
 console.log(JSON.stringify({ok:true,out,entornoAbrirMs,imagens:(await readdir(out)).filter(n=>n.endsWith('.png')).length}));
} finally {await browser.close();}
