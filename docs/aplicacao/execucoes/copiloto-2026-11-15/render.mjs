// Copiloto (15/11/2026): as quatro abas na tela, a 1280 px (desktop) e a 360 px (celular), começando do caderno vazio.
// Explorar (entrada única, busca, exemplos, triagem) → exemplo de Boa Viagem → Ficha Viva → Entorno (simulador andar ×
// fachada, atrito, "Isso bate") → Edifício (linha do tempo) → leitor de ata → segundo e terceiro exemplos → Comparar
// (placar ampliado, sala de decisão: link, voto, resposta, importação) → Visita (checagens do risco, microfone).
// Nada de rede de fora: tudo que não é o próprio app é bloqueado e contado.
//   POC_URL=http://localhost:8087 node docs/aplicacao/execucoes/copiloto-2026-11-15/render.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8087").replace(/\/+$/, "");
const AQUI = "docs/aplicacao/execucoes/copiloto-2026-11-15";
const saida = path.resolve(AQUI, "telas");
await mkdir(saida, { recursive: true });
// Nota, estrela de avaliação, "x/10", veredito de segurança ou de alagamento: nada disso pode aparecer.
const PROIBIDO = /\b\d{1,2}(?:[.,]\d)?\s*\/\s*10\b|\bnota\s+\d|\bestrelas?\b|★★|\bseguro para morar|\blivre de alagamento|\bsem risco de|\bpontua[cç][aã]o\b|\bscore\b|\bvencedor\b/i;
const r = { porLargura: {} };
const b = await chromium.launch();
const texto = (p) => p.evaluate(() => {
  const ocultos = [...document.querySelectorAll('[aria-hidden="true"]')]; const g = ocultos.map((el) => [el, el.style.display]);
  for (const el of ocultos) el.style.display = "none"; const t = document.body.innerText; for (const [el, d] of g) el.style.display = d; return t;
});
const rolagem = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function percorrer(largura) {
  const x = { externas: [], erros: [], console: [], rolagem: {}, conferido: {}, proibidos: [] };
  const c = await b.newContext({ viewport: { width: largura, height: largura < 500 ? 800 : 900 } });
  await c.route("**/*", (q) => {
    const u = q.request().url();
    if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue();
    x.externas.push(u); return q.abort();
  });
  const p = await c.newPage();
  p.on("pageerror", (e) => x.erros.push(e.message));
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) x.console.push(m.text().slice(0, 240)); });
  const foto = (nome) => p.screenshot({ path: path.join(saida, `${largura}-${nome}.png`) });
  const conferirProibidos = async (onde) => { const t = await texto(p); const m = t.match(PROIBIDO); if (m) x.proibidos.push(`${onde}: ${m[0]}`); return t; };

  // 1. Explorar vazio: entrada única, exemplos abertos, busca.
  await p.goto(`${base}/`, { waitUntil: "load" });
  await p.getByText("Anúncio, prédio ou rua").waitFor({ timeout: 180000 });
  await p.waitForTimeout(1200);
  let t = await conferirProibidos("explorar");
  x.conferido.entradaUnica = t.includes("Usar minha localização agora") && t.includes("Gerar Dossiê");
  x.conferido.exemplosAbertos = t.includes("Beira-mar em Boa Viagem") && t.includes("Revenda antiga nas Graças") && t.includes("Rua da Madalena com pedidos de drenagem");
  await foto("explorar-vazio");
  x.rolagem.explorar = await rolagem(p);
  await p.getByRole("textbox", { name: "Link do anúncio, prédio, rua ou bairro" }).fill("Rua da Hora, Espinheiro");
  x.conferido.botaoVira = await p.getByRole("button", { name: "Buscar no cadastro", exact: true }).isVisible();
  await p.getByRole("button", { name: "Buscar no cadastro", exact: true }).click();
  await p.getByRole("group", { name: "Prédios encontrados" }).waitFor({ timeout: 60000 }).catch(() => undefined);
  t = await texto(p);
  x.conferido.buscaAcha = /Do cadastro de Espinheiro/.test(t);
  await foto("explorar-busca");

  // 2. Exemplo de Boa Viagem → dossiê com Ficha Viva.
  await p.getByRole("textbox", { name: "Link do anúncio, prédio, rua ou bairro" }).fill("");
  await p.getByRole("button", { name: /^Exemplo: Beira-mar em Boa Viagem/ }).click();
  await p.waitForURL(/\/dossie/, { timeout: 60000 });
  await p.getByText("Ficha viva do edifício").waitFor({ timeout: 60000 });
  await p.waitForTimeout(2500);
  t = await conferirProibidos("dossie");
  x.conferido.fichaViva = ["Escala e idade", "Registros estruturais", "ITBI no prédio", "Condomínio/m²", "Clima e entorno"].every((s) => t.toUpperCase().includes(s.toUpperCase()));
  x.conferido.pilulas = /CALOR DE SUPERF[IÍ]CIE/i.test(t) && /COTA E ÁGUA POR PERTO/i.test(t) && /BARULHO DIA × NOITE/i.test(t);
  x.conferido.condominioDesconhecido = t.includes("A confirmar");
  await p.getByText("Ficha viva do edifício").scrollIntoViewIfNeeded();
  await foto("dossie-ficha-viva");
  await p.getByRole("button", { name: /^ITBI no prédio:/ }).click(); await p.waitForTimeout(300);
  t = await texto(p);
  x.conferido.itbiFiscal = /avaliação da Prefeitura para cobrar o imposto/.test(t);
  await foto("dossie-ficha-itbi");
  x.rolagem.dossie = await rolagem(p);

  // 3. Entorno: simulador, atrito, "Isso bate".
  await p.getByRole("tab", { name: "Entorno", exact: true }).click(); await p.waitForTimeout(2000);
  await p.getByText("Andar × fachada").scrollIntoViewIfNeeded();
  const antes = await texto(p);
  await p.getByRole("radio", { name: "Fachada SE" }).click(); await p.waitForTimeout(250);
  await p.getByRole("button", { name: "Subir um andar" }).click(); await p.waitForTimeout(250);
  t = await conferirProibidos("entorno");
  x.conferido.simuladorRecalcula = antes !== t && /Sol direto nessa fachada/i.test(t) && /Sudeste/.test(t);
  x.conferido.semDb = /Nível em dB\(A\): Sem leitura publicada/.test(t) && !/\b\d{2,3}\s*dB\(A\)/.test(t);
  await foto("entorno-simulador");
  x.conferido.atrito = /Bares, oficinas e comércio em volta/.test(t);
  await p.getByText("Isso bate com a rua hoje?").scrollIntoViewIfNeeded();
  await p.getByRole("radio", { name: "Não bate" }).click(); await p.waitForTimeout(300);
  t = await texto(p);
  x.conferido.bate = /Guardado só neste aparelho/.test(t) && await p.getByRole("textbox", { name: "O que não bate (opcional)" }).isVisible();
  await foto("entorno-bate");
  await p.getByText("Bares, oficinas e comércio em volta").scrollIntoViewIfNeeded();
  await foto("entorno-atrito");
  x.conferido.atritoSeparado = /Pode trazer barulho ou movimento|Conveniência do dia a dia/.test(await texto(p));
  x.rolagem.entorno = await rolagem(p);

  // 4. Edifício: linha do tempo da estrutura.
  await p.getByRole("tab", { name: "Edifício", exact: true }).click(); await p.waitForTimeout(1500);
  await p.getByText("Linha do tempo da estrutura").scrollIntoViewIfNeeded();
  t = await conferirProibidos("edificio");
  x.conferido.linhaDoTempo = /Nenhum ato documentado sobre a estrutura/.test(t) && /Laudo com ART\/RRT · sem documento/.test(t) && /Pergunta para o síndico/.test(t);
  await foto("edificio-linha-do-tempo");

  // 5. Leitor de ata (caderno do prédio).
  const idBv = "exemplo-11720-2290";
  await p.goto(`${base}/detalhes?id=${idBv}&secao=edificio`, { waitUntil: "load" });
  await p.getByRole("button", { name: /Ler ata, convenção ou balancete/ }).waitFor({ timeout: 60000 });
  await p.getByRole("button", { name: /Ler ata, convenção ou balancete/ }).click();
  await p.getByRole("textbox", { name: "Texto do documento" }).fill("ATA DA ASSEMBLEIA GERAL\nPágina 1\nFoi aprovada chamada extra de R$ 350,00 por unidade, em 10 parcelas, para a pintura da fachada.\nFica proibida a locação por temporada via Airbnb nas unidades.");
  await p.getByRole("button", { name: "Ler o texto", exact: true }).click(); await p.waitForTimeout(400);
  t = await texto(p);
  x.conferido.leitorDeAta = t.includes("“Foi aprovada chamada extra de R$ 350,00 por unidade, em 10 parcelas, para a pintura da fachada.”") && /p\. 2/.test(t) && /não cita fundo de reserva/.test(t);
  await p.getByText("1. Regras da casa").scrollIntoViewIfNeeded();
  await foto("leitor-de-ata");
  x.rolagem.leitor = await rolagem(p);

  // 6. Mais dois exemplos (para comparar) e a triagem no Explorar.
  await p.goto(`${base}/`, { waitUntil: "load" });
  await p.getByText("Anúncio, prédio ou rua").waitFor({ timeout: 60000 });
  await p.getByRole("button", { name: "Explorar um endereço exemplo agora" }).click();
  await p.getByRole("button", { name: /^Exemplo: Revenda antiga nas Graças/ }).click();
  await p.waitForURL(/\/dossie/, { timeout: 60000 }); await p.waitForTimeout(1500);
  await p.goto(`${base}/`, { waitUntil: "load" });
  await p.getByText("Anúncio, prédio ou rua").waitFor({ timeout: 60000 });
  await p.waitForTimeout(800);
  await p.getByRole("radio", { name: /^Etapa Visita$/ }).first().click(); await p.waitForTimeout(400);
  t = await conferirProibidos("explorar-triagem");
  x.conferido.triagem = /Visita 1/.test(t) && /Triagem 1/.test(t);
  await p.getByRole("button", { name: /^Anotar sobre/ }).first().click();
  x.conferido.anotar = await p.getByRole("textbox", { name: /^Nota sobre/ }).first().isVisible();
  await foto("explorar-triagem");

  // 7. Comparar: placar ampliado e sala de decisão.
  await p.goto(`${base}/comparar`, { waitUntil: "load" });
  await p.getByText(/Quem ganha em cada parte/i).first().waitFor({ timeout: 60000 }).catch(() => undefined);
  await p.waitForTimeout(1500);
  t = await conferirProibidos("comparar");
  x.conferido.placarAmpliado = /Custo total da compra/.test(t) && /Calor e cota/.test(t);
  await p.getByText(/Quem ganha em cada parte/i).first().scrollIntoViewIfNeeded().catch(() => undefined);
  await foto("comparar-placar");
  x.rolagem.comparar = await rolagem(p);
  await p.getByRole("button", { name: "Compartilhar comparação (voto e notas)" }).click(); await p.waitForTimeout(300);
  t = await texto(p);
  const link = (t.match(/https?:\/\/\S+\/sala#s=[A-Za-z0-9_-]+/) ?? [null])[0];
  x.conferido.linkDaSala = Boolean(link) && !/caderno|diario/.test(link ?? "");
  await p.getByText(/\/sala#s=/).scrollIntoViewIfNeeded().catch(() => undefined);
  await foto("comparar-sala-link");
  if (link) {
    const outra = await c.newPage();
    outra.on("pageerror", (e) => x.erros.push(e.message));
    await outra.goto(link, { waitUntil: "load" });
    await outra.getByText("Sala de decisão").first().waitFor({ timeout: 60000 });
    await outra.waitForTimeout(800);
    await outra.getByRole("radio", { name: "Faz sentido" }).first().click();
    await outra.getByRole("textbox", { name: /^Nota sobre/ }).first().fill("Perto do mar, mas e o barulho?");
    await outra.getByRole("textbox", { name: "Seu nome ou apelido (opcional)" }).fill("Ana");
    await outra.getByRole("button", { name: "Gerar link de resposta" }).click(); await outra.waitForTimeout(300);
    await outra.screenshot({ path: path.join(saida, `${largura}-sala-voto.png`) });
    const tr = await outra.evaluate(() => document.body.innerText);
    const resposta = (tr.match(/https?:\/\/\S+\/sala#r=[A-Za-z0-9_-]+/) ?? [null])[0];
    x.rolagem.sala = await outra.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await outra.close();
    if (resposta) {
      await p.goto(resposta, { waitUntil: "load" });
      await p.getByRole("button", { name: "Importar para o meu caderno" }).waitFor({ timeout: 60000 });
      await p.getByRole("button", { name: "Importar para o meu caderno" }).click(); await p.waitForTimeout(500);
      t = await texto(p);
      x.conferido.respostaImportada = /recebeu a resposta no diário|receberam a resposta no diário/.test(t);
      await foto("sala-importada");
    }
  }

  // 8. Visita: checagens do risco no topo e o medidor opcional.
  await p.goto(`${base}/visita`, { waitUntil: "load" });
  await p.getByText(/pontos para conferir/).waitFor({ timeout: 60000 }).catch(() => undefined);
  await p.waitForTimeout(1200);
  t = await conferirProibidos("visita");
  x.conferido.checagens = /Pressão da água e fachada|Garagem e comporta|Internet no cômodo/.test(t);
  await foto("visita-preparar");
  const comecar = p.getByRole("button", { name: /Começar visita/ });
  if (await comecar.count()) {
    await comecar.first().click(); await p.waitForTimeout(800);
    await p.getByText("Ruído de fora").scrollIntoViewIfNeeded();
    t = await texto(p);
    x.conferido.microfone = /Medir 10 s com microfone/.test(t) && /Silencioso/.test(t);
    await foto("visita-microfone");
  }
  x.rolagem.visita = await rolagem(p);
  await c.close();
  return x;
}

try {
  for (const largura of [1280, 360]) r.porLargura[largura] = await percorrer(largura);
} finally {
  await b.close();
  await writeFile(path.join(AQUI, "render.json"), JSON.stringify(r, null, 1) + "\n");
  console.log(JSON.stringify(Object.fromEntries(Object.entries(r.porLargura).map(([l, x]) => [l, { externas: x.externas.length, erros: x.erros, console: x.console.slice(0, 6), proibidos: x.proibidos, rolagem: x.rolagem, conferido: x.conferido }])), null, 1));
}
