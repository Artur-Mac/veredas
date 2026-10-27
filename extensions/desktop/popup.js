/* Acesso apenas por ação; sem background, crawling, cookies, host_permissions ou rede. */
const campo = id => document.getElementById(id);
const estado = texto => { campo('estado').textContent = texto; };
let ocupado = false;
campo('ler').addEventListener('click', async () => {
  if (ocupado) return; ocupado = true;
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (tab?.id && !tab.url) throw new Error('Acione o ícone da extensão na aba do anúncio para conceder acesso temporário. Se o navegador não permitir, use a cópia manual.');
    if (!tab || !tab.id || !/^https?:\/\//i.test(tab.url ?? '')) throw new Error('Abra uma página http ou https de anúncio. Não lemos páginas internas do navegador.');
    const [resposta] = await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>({url:location.href,titulo:document.title.slice(0,300),texto:(window.getSelection()?.toString().trim() || document.querySelector('main')?.innerText || document.body.innerText || '').slice(0,200000)})});
    const v=resposta?.result; const u=new URL(v.url);
    if (!['http:','https:'].includes(u.protocol) || u.username || u.password || v.url.length>2000 || typeof v.texto!=='string') throw new Error('Conteúdo incompatível. Copie manualmente o trecho do anúncio.');
    campo('url').value=v.url; campo('titulo').value=v.titulo; campo('texto').value=v.texto; campo('previa').hidden=false; estado('Revise o conteúdo; nenhum campo foi salvo no VEREDA. Até 200 mil caracteres.');
  } catch(e) { campo('previa').hidden=true; estado(e.message || 'Não foi possível ler esta aba. Use a cópia manual.'); }
  finally {ocupado=false;}
});
campo('copiar').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(campo('texto').value);estado('Texto copiado. No VEREDA, cole o link do anúncio, depois o texto, e revise os campos.');}catch{estado('Não foi possível copiar. Selecione e copie o texto manualmente.');}});
campo('arquivo').addEventListener('click',async()=>{
 try {
  const url=campo('url').value,texto=campo('texto').value,titulo=campo('titulo').value;
  const origem=new URL(url);
  if(!['http:','https:'].includes(origem.protocol)||origem.username||origem.password||url.length>2000||texto.length>200000||titulo.length>300)throw new Error('Arquivo incompatível');
  const bytes=new TextEncoder().encode(url+'\n'+texto); const h=await crypto.subtle.digest('SHA-256',bytes);
  const id='ext-'+Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,40);
  const pacote={formato:'vereda-anuncio',versao:1,id,url,titulo,texto};
  const uri=URL.createObjectURL(new Blob([JSON.stringify(pacote)],{type:'application/json'})); const a=document.createElement('a');a.href=uri;a.download='vereda-anuncio.json';a.click();setTimeout(()=>URL.revokeObjectURL(uri),1000);
  estado('Arquivo preparado. No VEREDA, use Importar anúncio da extensão e revise antes de salvar.');
 } catch {estado('Não foi possível preparar o arquivo. Use a cópia manual.');}
});
