// Melhoria (15/11/2026): o ciclo com o hub auditado, na tela, a 375 e 360 px. Anúncio real do ZAP (fixture sem anunciante)
// → prédio → preparo → dossiê: simulador Price na pílula do financiamento; Entorno com "Sol e sombra", "A rua" com a
// consequência primeiro e "Por perto"; mapa do lote com 2D/2.5D, zoom e toque na obra; perfil da casa com acessibilidade;
// segundo anúncio (Torre) → Comparar. Permite só as fotos do CDN do ZAP; o resto de fora é bloqueado e contado.
//   POC_URL=http://localhost:8081 ANALISE=<json> node docs/aplicacao/execucoes/melhoria-2026-11-15/render.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.env.POC_URL || "http://localhost:8081").replace(/\/+$/, "");
const AQUI = "docs/aplicacao/execucoes/melhoria-2026-11-15";
const saida = path.resolve(AQUI, "telas");
await mkdir(saida, { recursive: true });
const analise = JSON.parse(await readFile(process.env.ANALISE, "utf8"));
const TEXTO_TORRE = ["Apartamento à venda com 53 m², 2 quartos, 2 banheiros, 1 vaga", "Edf. Engenho Torre", "Torre, Recife - PE", "Venda", "R$ 350.000", "Condomínio R$ 750", "IPTU R$ 180", "8º andar"].join("\n");
const r = { porLargura: {} };
const b = await chromium.launch();
const texto = (p) => p.evaluate(() => {
  const ocultos = [...document.querySelectorAll('[aria-hidden="true"]')]; const g = ocultos.map((el) => [el, el.style.display]);
  for (const el of ocultos) el.style.display = "none"; const t = document.body.innerText; for (const [el, d] of g) el.style.display = d; return t;
});
const rolagem = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const contem = (t, s) => t.includes(s);

async function percorrer(largura) {
  const x = { externas: [], fotos: 0, erros: [], console: [], rolagem: {}, conferido: {} };
  const c = await b.newContext({ viewport: { width: largura, height: 812 } });
  await c.route("**/*", (q) => {
    const u = q.request().url();
    if (u.startsWith("data:") || u.startsWith("blob:") || new URL(u).origin === new URL(base).origin) return q.continue();
    if (new URL(u).hostname === "resizedimgs.zapimoveis.com.br") { x.fotos += 1; return q.continue(); }
    x.externas.push(u); return q.abort();
  });
  await c.addInitScript((a) => { if (!localStorage.getItem("s")) { localStorage.setItem("vereda-analises-v2", JSON.stringify([a])); localStorage.setItem("vereda-ativa-v1", a.id); localStorage.setItem("s", "1"); } }, analise);
  const p = await c.newPage();
  p.on("pageerror", (e) => x.erros.push(e.message));
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) x.console.push(m.text().slice(0, 240)); });
  const foto = (nome) => p.screenshot({ path: path.join(saida, `${largura}-${nome}.png`) });

  // 1. Prédio → preparo → dossiê.
  await p.goto(`${base}/predio?id=${analise.id}`, { waitUntil: "load" });
  await p.getByText("É este o prédio?").waitFor({ timeout: 120000 });
  await p.getByRole("button", { name: "É este prédio", exact: true }).click();
  await p.waitForURL(/\/dossie/, { timeout: 30000 });
  await p.waitForTimeout(3500);
  x.rolagem.dossie = await rolagem(p);

  // 2. Pílula do financiamento → simulador Price; trocar a entrada muda a prestação.
  const pilula = p.getByRole("button", { name: /^Financiamento: cerca de/ });
  await pilula.scrollIntoViewIfNeeded();
  await pilula.click(); await p.waitForTimeout(300);
  let t = await texto(p);
  x.conferido.simulador = contem(t, "SIMULAÇÃO DE FINANCIAMENTO (À PARTE)") || contem(t, "Simulação de financiamento (à parte)");
  const antes = (t.match(/~R\$ [\d.]+\/mês\nEntrada de/) ?? [""])[0];
  await p.getByRole("radio", { name: "Entrada de 50%" }).click(); await p.waitForTimeout(250);
  t = await texto(p);
  const depois = (t.match(/~R\$ [\d.]+\/mês\nEntrada de/) ?? [""])[0];
  x.conferido.simuladorMuda = Boolean(antes && depois && antes !== depois);
  await p.getByText(/Total pago ao banco/).scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
  await foto("simulador-price");
  x.rolagem.simulador = await rolagem(p);

  // 3. Entorno: Sol e sombra, A rua (consequência primeiro, número no toque) e Por perto.
  await p.getByRole("tab", { name: "Entorno", exact: true }).click(); await p.waitForTimeout(2000);
  t = await texto(p);
  x.conferido.solESombra = contem(t, "SOL E SOMBRA") || contem(t, "Sol e sombra");
  x.conferido.porPerto = contem(t, "Equipamentos públicos em volta");
  x.conferido.avisoDoCadastro = contem(t, "Cadastro da Prefeitura: não diz horário, funcionamento nem manutenção.");
  x.conferido.ruaComConsequencia = /Houve \d+ pedidos? de limpeza de galeria|Ninguém pediu limpeza de galeria/.test(t);
  x.conferido.semRampaSemPerfil = !contem(t, "Rampa para cadeirante");
  await p.getByText(/Sol e sombra/i).first().scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await foto("entorno-sol-e-sombra");
  const linhaDaRua = p.getByRole("button", { name: /^(Houve \d+ pedidos? de limpeza|Ninguém pediu limpeza)/ }).first();
  await linhaDaRua.scrollIntoViewIfNeeded(); await linhaDaRua.click(); await p.waitForTimeout(300);
  t = await texto(p);
  x.conferido.ruaFonteNoToque = /Ver fonte e data \(/.test(t);
  await foto("entorno-a-rua");
  await p.getByText("Equipamentos públicos em volta").scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await foto("entorno-por-perto");
  x.rolagem.entorno = await rolagem(p);

  // 4. Mapa do lote: seletor visível, volume da tarde, zoom e toque na obra.
  await p.getByRole("button", { name: /^Abrir mapa do lote/ }).first().click(); await p.waitForTimeout(1200);
  x.conferido.seletor = await p.getByRole("radio", { name: "Ver mapa: Volume · tarde" }).isVisible();
  await p.getByRole("radio", { name: "Ver mapa: Volume · tarde" }).click(); await p.waitForTimeout(400);
  x.conferido.volumeEstimado = contem(await texto(p), "Volume estimado");
  await p.getByRole("button", { name: "Aproximar o mapa" }).click(); await p.waitForTimeout(300);
  x.conferido.zoom = (await p.getByRole("img", { name: /Zoom 1,5 vezes/ }).count()) > 0;
  const obra = p.getByRole("button", { name: /^Obra 1:/ });
  if (await obra.count()) {
    await obra.first().click(); await p.waitForTimeout(300);
    t = await texto(p);
    x.conferido.obraComLicenca = /Licença válida até|Licença vencida em|Licença emitida|Processo deferido|Licença em análise/.test(t);
    x.conferido.obraRetrato = contem(t, "não prova que a obra começou, parou ou terminou");
  } else x.conferido.obraComLicenca = "sem obra visível no quadro";
  await foto("mapa-volume-zoom-obra");
  x.rolagem.mapa = await rolagem(p);
  await p.keyboard.press("Escape").catch(() => undefined);

  // 5. Perfil da casa: a escolha de acessibilidade aparece e fica só no aparelho.
  await p.goto(`${base}/perfil-domicilio`, { waitUntil: "load" }); await p.waitForTimeout(1500);
  t = await texto(p);
  x.conferido.perfilAcessibilidade = contem(t, "Alguém na casa precisa de acessibilidade? (opcional)") && contem(t, "Fica só neste aparelho");
  await p.getByText("Alguém na casa precisa de acessibilidade? (opcional)").scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
  await foto("perfil-acessibilidade");
  x.rolagem.perfil = await rolagem(p);

  // 6. Segundo anúncio (Torre) → Comparar.
  await p.goto(`${base}/ler?texto=${encodeURIComponent(TEXTO_TORRE)}&n=2`, { waitUntil: "load" });
  await p.getByText("É este · gerar o dossiê").first().waitFor({ timeout: 60000 });
  await p.getByText("É este · gerar o dossiê").first().click();
  await p.waitForURL(/\/dossie/, { timeout: 30000 });
  await p.waitForTimeout(2500);
  await p.goto(`${base}/comparar`, { waitUntil: "load" });
  await p.getByText(/Quem ganha em cada parte/i).first().waitFor({ timeout: 30000 }).catch(() => undefined);
  await p.waitForTimeout(1500);
  t = await texto(p);
  x.conferido.compararRuaEClima = /Rua e clima/i.test(t);
  x.compararPlacar = (t.match(/QUEM GANHA EM CADA PARTE[\s\S]{0,700}/i) ?? [null])[0];
  await p.getByText(/Quem ganha em cada parte/i).first().scrollIntoViewIfNeeded().catch(() => undefined); await p.waitForTimeout(300);
  await foto("comparar-placar");
  x.rolagem.comparar = await rolagem(p);
  await c.close();
  return x;
}

try {
  for (const largura of [375, 360]) r.porLargura[largura] = await percorrer(largura);
} finally {
  await b.close();
  await writeFile(path.join(AQUI, "render.json"), JSON.stringify(r, null, 1) + "\n");
  console.log(JSON.stringify(Object.fromEntries(Object.entries(r.porLargura).map(([l, x]) => [l, { externas: x.externas.length, fotos: x.fotos, erros: x.erros, console: x.console.slice(0, 6), rolagem: x.rolagem, conferido: x.conferido }])), null, 1));
}
