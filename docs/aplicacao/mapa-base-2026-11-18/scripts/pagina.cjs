// Monta a página do plano do mapa-base com o modelo visual (vistas SVG reais + capturas do app de hoje).
const fs = require("fs");
const path = require("path");
const [, , SP, OUT] = process.argv;
const v = JSON.parse(fs.readFileSync(path.join(SP, "mapa-base/vistas.json"), "utf8"));
const b64 = (p) => "data:image/png;base64," + fs.readFileSync(path.join(SP, p)).toString("base64");
const hojeGaveta = b64("mapas/telas/bv-depois/375-gaveta-planta.png");
const hojePerto = b64("mapas/telas/bv-depois/375-por-perto.png");

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plano do mapa-base</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=JetBrains+Mono:wght@600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
body{margin:0;padding:20px;background:var(--background,#fff);color:var(--foreground,#171717);font-family:var(--font-sans,system-ui,sans-serif);font-size:14px;line-height:1.5}
h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin:30px 0 6px}h3{font-size:14px;margin:18px 0 8px}
.m{color:var(--muted-foreground,#666)}
.par{display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start}
figure{margin:0;flex:0 1 340px;max-width:340px}
figcaption{font-size:13px;margin-top:8px}
.tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 8px;border-radius:999px;margin-bottom:6px}
.tag.hoje{background:var(--muted,#eee);color:var(--muted-foreground,#555)}
.tag.prop{background:#F47745;color:#171717}
.crop{width:100%;border-radius:14px;background-repeat:no-repeat;border:1px solid var(--border,#ddd)}
.crop.g{aspect-ratio:342/279;background-size:109.6% auto;background-position:48.5% 59.4%}
.crop.p{aspect-ratio:280/278;background-size:133.9% auto;background-position:50.5% 89.2%}
.mapa svg{display:block;width:100%;height:auto;border-radius:14px;border:1px solid #E2D9C8;background:#fff}
.mapa .rua{font-family:'Plus Jakarta Sans',sans-serif;font-weight:600;fill:#625C51;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}
.mapa .rua.av{fill:#171717}.mapa .rua.alvo{fill:#2E5A85;font-weight:700}
.mapa .mono{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;fill:#171717}.mapa .mini{font-size:8px;fill:#625C51;letter-spacing:.08em}
.mapa .bairro-chip{font-family:'Fraunces',serif;font-size:14px;font-weight:600;fill:#171717}
.mapa .nome-bairro{font-family:'Fraunces',serif;font-size:10.5px;font-weight:600;letter-spacing:.14em;fill:#625C51;paint-order:stroke;stroke:#fff;stroke-width:3px}
.mapa .nome-bairro.atual{font-size:13px;fill:#B94E36}
.leg{display:flex;flex-wrap:wrap;gap:6px 16px;margin:12px 0 0;font-size:12.5px}
.leg span{display:inline-flex;align-items:center;gap:6px}
.sw{width:16px;height:12px;border-radius:3px;display:inline-block;border:1px solid #C9BEA8}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--border,#e5e5e5);vertical-align:top}
th{color:var(--muted-foreground,#666);font-weight:600}
.tw{overflow-x:auto}
.fase{border:1px solid var(--border,#ddd);border-radius:var(--radius,10px);padding:10px 14px;margin:8px 0;background:var(--card,#fafafa);color:var(--card-foreground,#171717)}
.fase b.n{font-family:'JetBrains Mono',monospace;color:#B94E36;margin-right:6px}
.fase ul{margin:4px 0 0;padding-left:18px}
.nota{font-size:12.5px}
</style></head><body>
<h1>Mapa-base do Vereda: plano e modelo visual</h1>
<div class="m">Os mapas propostos abaixo não são ilustração: foram desenhados com a geometria real da Prefeitura do Recife (quadras, lotes, ruas, bairros, água e praças; dados abertos, ODbL) em volta do Golden Tower, R. Major Armando de Souza Mello, 216, Boa Viagem. As vistas “hoje” são capturas do app atual, já com a correção do PR #4.</div>

<h2>1. Gaveta “Mapa do lote” (abre em ≈ 220 m; hoje ≈ 80 m)</h2>
<div class="par">
<figure><span class="tag hoje">Hoje</span><div class="crop g" style="background-image:url(${hojeGaveta})"></div>
<figcaption>Só o lote do prédio e pedaços tracejados de vizinhos, sobre uma grade. Não há rua, quadra nem nome: não dá para saber onde se está.</figcaption></figure>
<figure class="mapa"><span class="tag prop">Proposta</span>${v.gaveta}
<figcaption>Quadras com calçada, <b>todos</b> os lotes, prédios de apartamento que o Vereda conhece em azul claro, o lote do imóvel em azul forte e ruas com nome, com a rua do imóvel destacada. O selo diz o bairro.</figcaption></figure>
</div>
<div class="leg">
<span><i class="sw" style="background:#FFFFFF"></i>rua</span>
<span><i class="sw" style="background:#E7DEC9"></i>quadra (calçada)</span>
<span><i class="sw" style="background:#F2EBDD"></i>lote</span>
<span><i class="sw" style="background:#EBF1F8;border-color:#2E5A85"></i>prédio de apartamento no índice</span>
<span><i class="sw" style="background:#2E5A85;border-color:#2E5A85"></i>lote do imóvel</span>
<span><i class="sw" style="background:#D3DEE8;border-color:#A9BCCF"></i>canal, rio, mar</span>
</div>

<h2>2. “Por perto” (≈ 2,6 km)</h2>
<div class="par">
<figure><span class="tag hoje">Hoje</span><div class="crop p" style="background-image:url(${hojePerto})"></div>
<figcaption>Os pontos de interesse flutuam num fundo vazio; os lotes viram rabiscos de 2 px em volta do pino.</figcaption></figure>
<figure class="mapa"><span class="tag prop">Proposta</span>${v.porPerto}
<figcaption>Quadras dão a forma da cidade; avenidas e corredores com nome orientam; o bairro do imóvel fica levemente tingido com contorno em ferrugem, e os vizinhos (Ibura) aparecem com divisa tracejada. Mar, canais e o Parque Dona Lindu entram. A hachura é área fora dos bairros do Recife (sem dado). Os pontos de interesse de hoje continuam por cima.</figcaption></figure>
</div>
<div class="leg">
<span><i class="sw" style="background:#FDEFE8;border-color:#B94E36"></i>bairro do imóvel</span>
<span><i class="sw" style="background:#fff;border:1px dashed #625C51"></i>divisa com outro bairro</span>
<span><i class="sw" style="background:#E3EBDC;border-color:#7F8870"></i>praça, parque</span>
<span><i class="sw" style="background:repeating-linear-gradient(45deg,#F4F0E8 0 4px,#DCD3C2 4px 5px)"></i>sem dado</span>
</div>

<h2>3. O que aparece em cada zoom</h2>
<div class="tw"><table><thead><tr><th>Escala</th><th>Onde</th><th>Desenha</th><th>Some</th></tr></thead><tbody>
<tr><td>até ~600 m</td><td>Gaveta “Mapa do lote”, Volume 2.5D, zoom do Por perto</td><td>quadras, todos os lotes, prédios do índice, todas as ruas com nome, canais, praças, selo do bairro</td><td>—</td></tr>
<tr><td>~1 a 3 km</td><td>Por perto (inicial)</td><td>quadras, água, praças, avenidas e corredores com nome, divisas e nomes de bairro, pontos de interesse</td><td>lotes e ruas pequenas</td></tr>
<tr><td>mais de 3 km</td><td>(futuro) visão do bairro / comparar dois imóveis</td><td>bairros, água, avenidas</td><td>quadras</td></tr>
</tbody></table></div>
<p class="nota m">Cada camada vira <b>uma única forma</b> no SVG (não uma por lote): medido no Chrome com CPU 4× mais lenta, 7 mil polígonos juntos desenham em 24 ms contra 114 ms separados. Com isso o limite de 60 vizinhos deixa de ser necessário na planta; no 2.5D ele continua só para os volumes com altura.</p>

<h2>4. Plano</h2>
<div class="fase"><b class="n">0</b><b>Decisões antes de codar</b>
<ul><li>Licença ODbL: crédito visível no mapa (“Base: Prefeitura do Recife, ODbL”) e publicar a base derivada sob a mesma licença. Liga com a tarefa do parecer jurídico no Hub.</li>
<li>Piloto: Boa Viagem (o mais denso) e Torre (médio); depois os 72 bairros do índice; cidade toda no fim.</li></ul></div>
<div class="fase"><b class="n">1</b><b>Pipeline de dados</b> — <code>scripts/dados/construir-mapa-base.mjs</code>
<ul><li>Baixa do portal 6 camadas (Quadras, Lotes, Trechos de Logradouros, Bairros, Recursos Hídricos, Parques e Praças).</li>
<li>Recorta por bairro com borda de 300 m, para a divisa não ficar vazia.</li>
<li>Liga lote a quadra pela geometria (18% dos lotes têm código de quadra que não existe mais).</li>
<li>Simplifica (0,5 m) e grava em metros locais com 0,1 m, por diferenças: <code>src/dados/recife/mapa-base/&lt;sha&gt;/&lt;bairro&gt;.json</code>.</li>
<li>Entra no <code>publicar-camadas</code> como as outras camadas: cache, offline, conferência por sha, nada no pacote JS.</li>
<li>Testes: esquema, teto de peso por bairro, cobertura.</li></ul></div>
<div class="fase"><b class="n">2</b><b>Leitura no app</b> — <code>src/dados/recife/mapaBase.ts</code>
<ul><li><code>lerCamada</code>/<code>garantirCamadas</code> do bairro do imóvel e dos bairros que tocam o quadro.</li>
<li>Os vizinhos deixam de vir só do mesmo bairro (hoje some lote real perto da divisa).</li></ul></div>
<div class="fase"><b class="n">3</b><b>Desenho</b> — componente <code>FundoDoMapa</code>
<ul><li>Usado pelo Mapa do lote (planta e 2.5D) e pelo Por perto; depois pelo mapa do prédio e dos exemplos.</li>
<li>Níveis por zoom da tabela acima; uma forma por camada.</li>
<li>Rótulos: a rua do imóvel sempre; avenidas e corredores primeiro; o nome desliza pela via até achar lugar livre; nome do bairro em Fraunces.</li>
<li>Tema escuro com os tokens que já existem.</li></ul></div>
<div class="fase"><b class="n">4</b><b>Interação e acessibilidade</b>
<ul><li>Tocar num lote: “Lote vizinho · 15 pavimentos” (a base traz pavimentos).</li>
<li>Descrição em texto para leitor de tela: rua, bairro e distância até a divisa.</li></ul></div>
<div class="fase"><b class="n">5</b><b>Verificação</b>
<ul><li>Capturas a 375, 360 e 1280 px antes e depois; medir em celular de entrada (o D036 já pedia); abrir sem rede.</li></ul></div>

<h2>5. Peso e dados</h2>
<div class="tw"><table><thead><tr><th></th><th>Boa Viagem</th><th>Torre</th><th>Cidade toda</th></tr></thead><tbody>
<tr><td>Quadras / lotes / ruas</td><td>548 / 5.218 / 267</td><td>111 / 980 / 103</td><td>11.105 / 114.076 / 10.226</td></tr>
<tr><td>Arquivos do portal (gzip)</td><td>1,90 MB</td><td>385 kB</td><td>44 MB</td></tr>
<tr><td><b>Formato compacto (gzip)</b></td><td><b>~174 kB</b></td><td><b>~35 kB</b></td><td><b>~3,8 MB</b></td></tr>
</tbody></table></div>
<p class="nota m">Medido nos arquivos do portal, com simplificação de 0,5 m e precisão de 0,1 m. O app só baixa o bairro aberto (e os vizinhos de divisa), uma vez; depois funciona sem rede.</p>

<h3>Limitações dos dados</h3>
<ul class="nota">
<li><b>Lotes faltando nos morros e na periferia</b> (Coqueiral 98%, Nova Descoberta 90% da área sem lote): ali o mapa mostra a quadra sem lotes, sem inventar.</li>
<li><b>Sem hierarquia de via</b> na base: avenida sai do nome e corredor de transporte do campo CT.</li>
<li><b>Data interna 2023</b> (publicado em mar/2026).</li>
<li><b>Canais por cima de quadras</b>: a água é desenhada por último.</li>
</ul>
</body></html>`;
fs.writeFileSync(OUT, html);
console.log("bytes", Buffer.byteLength(html));
