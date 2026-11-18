// Fotos das telas que vieram da frente visual, a 390 px, com a janela esticada até o fim da rolagem (as telas rolam dentro
// de um contêiner), e as checagens de texto do plano de unificação (seção 5):
//   - "alvo justo" / "alvo sugerido" / "contraproposta": nenhum;
//   - todo "dB" acompanhado de "estimativa" ou "estimado" na mesma tela;
//   - toda nota "/10" com um botão de ficha de método na mesma tela;
//   - zero rolagem horizontal, zero erro de console, zero requisição falha.
//
//   CI=1 npx expo start --web --port 8096          (noutro terminal; espere a página responder)
//   node docs/aplicacao/unificacao-2026-11-19/scripts/capturar-telas-novas.mjs --base http://localhost:8096 --saida .cache/unificacao/<rodada>
//
// Usa os casos e os utilitários do roteiro do mapa-base (../../mapa-base-2026-11-18/scripts). Os valores do anúncio são
// de teste (preço, condomínio, área e andar), só para as telas de custo terem o que mostrar.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { abrirNavegador, analiseDoCaso, lerCasos, novoContexto, rolagemHorizontal } from "../../mapa-base-2026-11-18/scripts/comum.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pares, a, i, todos) => (a.startsWith("--") ? [...pares, [a.slice(2), todos[i + 1]]] : pares), []),
);
const base = args.base ?? "http://localhost:8096";
const saida = args.saida;
if (!saida) {
  console.error("Uso: node capturar-telas-novas.mjs --saida <pasta> [--base http://localhost:8096] [--largura 390]");
  process.exit(2);
}
const largura = Number(args.largura ?? 390);
await mkdir(saida, { recursive: true });

const informado = (valor) => ({ valor, origem: "link", aConfirmar: false });
const dados = await lerCasos();
const ANUNCIOS = {
  "golden-tower": { preco: 890_000, condominio: 1_250, area: 112, andar: 9 },
  torre: { preco: 420_000, condominio: 680, area: 68, andar: 3 },
  "casa-forte-divisa": { preco: 760_000, condominio: 1_100, area: 120, andar: 5 },
};
const analises = dados.casos
  .filter((c) => ANUNCIOS[c.id])
  .map((c) => {
    const a = analiseDoCaso(c, dados.indiceGeradoEm);
    const v = ANUNCIOS[c.id];
    a.declarados.preco = informado(v.preco);
    a.declarados.condominio = informado(v.condominio);
    a.declarados.area = informado(v.area);
    a.declarados.andar = informado(v.andar);
    return a;
  });
// Uma análise sem prédio confirmado, para a tela sem vínculo (R9: o 2.5D não desenha nada).
const semPredio = { ...structuredClone(analises[0]), id: "captura-sem-predio", nome: "Anúncio sem prédio confirmado", vinculo: { estado: "pendente" } };
analises.push(semPredio);

const id = (caso) => `captura-${caso}`;
const TELAS = [
  { nome: "explorar", rota: "/" },
  { nome: "dossie-destaques--golden-tower", rota: `/dossie?id=${id("golden-tower")}`, aba: "Destaques" },
  { nome: "dossie-entorno--golden-tower", rota: `/dossie?id=${id("golden-tower")}`, aba: "Entorno" },
  { nome: "dossie-edificio--golden-tower", rota: `/dossie?id=${id("golden-tower")}`, aba: "Edifício" },
  { nome: "dossie-destaques--torre", rota: `/dossie?id=${id("torre")}`, aba: "Destaques" },
  { nome: "dossie-entorno--torre", rota: `/dossie?id=${id("torre")}`, aba: "Entorno" },
  { nome: "dossie-destaques--sem-predio", rota: `/dossie?id=captura-sem-predio`, aba: "Destaques" },
  { nome: "comparar--golden-tower-x-torre", rota: `/comparar?ids=${id("golden-tower")},${id("torre")}` },
  { nome: "visita--golden-tower", rota: `/visita?id=${id("golden-tower")}` },
  { nome: "sobre-os-dados", rota: "/sobre-os-dados" },
];

/** Na página: a maior altura de conteúdo entre os contêineres que rolam na vertical. */
function alturaDoConteudo() {
  let maior = document.documentElement.scrollHeight;
  for (const el of document.querySelectorAll("*")) {
    const estilo = getComputedStyle(el);
    if ((estilo.overflowY === "auto" || estilo.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 4) {
      maior = Math.max(maior, el.scrollHeight + el.getBoundingClientRect().top + 120);
    }
  }
  return Math.min(Math.ceil(maior), 30000);
}

/** Checagens de texto do plano, sobre o texto visível da tela. */
function checarTexto(texto, botoesDeFicha) {
  const achados = [];
  const alvo = texto.match(/alvo (justo|sugerido)|contraproposta/gi);
  if (alvo) achados.push(`preço-alvo na tela: ${[...new Set(alvo)].join(", ")}`);
  const dB = (texto.match(/\bdB\b/g) ?? []).length;
  if (dB > 0 && !/estimativ|estimad/i.test(texto)) achados.push(`${dB} "dB" sem "estimativa" na tela`);
  // "18/10/2026" é data, não nota: a barra seguinte descarta.
  const notas = (texto.match(/\d(?:[,.]\d)?\s?\/\s?10\b(?!\s?\/)/g) ?? []).length;
  if (notas > 0 && botoesDeFicha === 0) achados.push(`${notas} nota(s) "/10" sem botão de ficha de método na tela`);
  return { achados, dB, notas };
}

const navegador = await abrirNavegador();
const relatorio = [];
try {
  for (const tela of TELAS) {
    const { contexto, pagina, registro } = await novoContexto(navegador, { base, largura, altura: 900, analises, ativa: id("golden-tower") });
    const linha = { tela: tela.nome, rota: tela.rota };
    try {
      await pagina.goto(base + tela.rota, { waitUntil: "networkidle", timeout: 120000 });
      if (tela.aba) {
        await pagina.getByRole("tab", { name: tela.aba, exact: true }).first().click({ timeout: 30000 });
      }
      await pagina.waitForTimeout(2500);
      // Abre todas as fichas de método fechadas, para a foto e o texto incluírem a conta.
      const botoes = pagina.locator('[data-testid$="metodo-toggle"], [data-testid$="pesos-toggle"], [data-testid*="ficha"][data-testid$="-toggle"]');
      const fichas = await botoes.count();
      for (let i = fichas - 1; i >= 0; i--) {
        const rotulo = (await botoes.nth(i).innerText().catch(() => "")) ?? "";
        if (!/^Ocultar/i.test(rotulo.trim())) await botoes.nth(i).click({ timeout: 5000 }).catch((e) => console.log(`  não abriu a ficha ${i}: ${String(e).slice(0, 120)}`));
      }
      await pagina.waitForTimeout(500);
      const altura = await pagina.evaluate(alturaDoConteudo);
      await pagina.setViewportSize({ width: largura, height: Math.max(900, altura) });
      await pagina.waitForTimeout(1500);
      const arquivo = `${tela.nome}--${largura}.png`;
      await pagina.screenshot({ path: path.join(saida, arquivo), fullPage: true });
      // Tiras de 1.600 px: a foto inteira passa de 10.000 px de altura e fica ilegível quando reduzida.
      const alturaDaFoto = Math.max(900, altura);
      await mkdir(path.join(saida, "tiras"), { recursive: true });
      for (let y = 0, n = 1; y < alturaDaFoto; y += 1600, n++) {
        await pagina.screenshot({
          path: path.join(saida, "tiras", `${tela.nome}--${largura}--${String(n).padStart(2, "0")}.png`),
          clip: { x: 0, y, width: largura, height: Math.min(1600, alturaDaFoto - y) },
        });
      }
      const texto = await pagina.evaluate(() => document.body.innerText);
      await writeFile(path.join(saida, `${tela.nome}--${largura}.txt`), texto);
      Object.assign(linha, {
        arquivo,
        altura,
        rolagemHorizontal: await rolagemHorizontal(pagina),
        fichasDeMetodo: fichas,
        ...checarTexto(texto, fichas),
        console: [...registro.console],
        falhas: [...registro.falhas],
        externas: registro.externas.length,
      });
    } catch (e) {
      linha.erro = String(e).slice(0, 400);
    }
    relatorio.push(linha);
    await contexto.close();
    const problemas = (linha.achados?.length ?? 0) + (linha.console?.length ?? 0) + (linha.falhas?.length ?? 0) + (linha.rolagemHorizontal > 0 ? 1 : 0) + (linha.erro ? 1 : 0);
    console.log(`${problemas === 0 ? "ok  " : "VER "} ${tela.nome}${linha.erro ? ` · ${linha.erro}` : ""}${linha.achados?.length ? ` · ${linha.achados.join("; ")}` : ""}${linha.console?.length ? ` · console: ${linha.console.length}` : ""}${linha.falhas?.length ? ` · falhas: ${linha.falhas.length}` : ""}${linha.rolagemHorizontal > 0 ? ` · rolagem horizontal ${linha.rolagemHorizontal}px` : ""}`);
  }
} finally {
  await navegador.close();
}
await writeFile(path.join(saida, "telas-novas.json"), JSON.stringify({ base, largura, geradoEm: new Date().toISOString(), telas: relatorio }, null, 2));
const comProblema = relatorio.filter((l) => l.erro || l.achados?.length || l.console?.length || l.falhas?.length || l.rolagemHorizontal > 0);
console.log(`${relatorio.length} telas, ${comProblema.length} com algo para ver. Relatório: ${path.join(saida, "telas-novas.json")}`);
process.exit(comProblema.length === 0 ? 0 : 1);
