// Capturas da auditoria visual (fase 0), a 390 × 844, com o Chrome headless sobre a exportação estática do app.
//
//   node capturar.mjs            todas as seções, na ordem
//   node capturar.mjs C D        só as seções pedidas (C em diante dependem do caderno montado em B)
//
// Seções: A Explorar vazio e busca · B entrada pelo link e caderno de exemplo · C Explorar com caderno e triagem ·
// D Dossiê · E Comparar · F Visita · G Salvos e casca · H erro e sem rede.
// O caderno montado em B fica em ferramentas/.estado.json (armazenamento do navegador) e é reaproveitado pelas outras.
//
// Os três imóveis são os endereços de exemplo do próprio app (Explorar › "Explorar um endereço exemplo agora"). Os valores
// de anúncio (preço, condomínio, IPTU, área, andar) foram digitados aqui para o dossiê aparecer completo: são entrada de
// exemplo, não dado oficial. Tudo o que vem do cadastro e das camadas é o que o app calcula.
import { existsSync } from "node:fs";
import path from "node:path";
import { abrirNavegador, AQUI, BASE, capturar, esperar, esperarTexto, pausa, textoVisivel } from "./navegador.mjs";

const ESTADO = path.join(AQUI, ".estado.json");
const pedidas = process.argv.slice(2).map((s) => s.toUpperCase());
const roda = (s) => pedidas.length === 0 || pedidas.includes(s);

const LINK_CASA_FORTE = "https://www.zapimoveis.com.br/imovel/venda-apartamento-2-quartos-com-piscina-casa-forte-recife-pe-66m2-id-2799999990/";
const TEXTO_CASA_FORTE = ["Apartamento com 2 quartos à venda, 66 m²", "Estrada do Encanamento - Casa Forte, Recife - PE", "Venda", "R$ 690.000", "Condomínio", "R$ 780", "IPTU", "R$ 154", "66 m²", "2 quartos", "8º andar"].join("\n");

/** Entrada de exemplo digitada no editor de cada análise (não é dado oficial). */
const ANUNCIOS = [
  { exemplo: "Beira-mar em Boa Viagem", modalidade: "compra", preco: 720000, condominio: 980, iptu: 95, area: 58, quartos: 2, suites: 1, banheiros: 2, vagas: 1, andar: 14 },
  { exemplo: "Revenda antiga nas Graças", modalidade: "compra", preco: 495000, condominio: 1350, iptu: 110, area: 130, quartos: 3, suites: 1, banheiros: 3, vagas: 1, andar: 4 },
  { exemplo: "Rua da Madalena com pedidos de drenagem", modalidade: "aluguel", preco: 3600, condominio: 1250, iptu: null, seguro: 45, area: 141, quartos: 4, suites: 1, banheiros: 3, vagas: 2, andar: 5 },
];

const rota = (page) => new URL(page.url()).pathname;
const esperarRota = (page, r, ms = 20_000) => esperar(() => rota(page) === r, `rota ${r} (estou em ${rota(page)})`, ms);
const campo = (page, nome) => page.getByRole("textbox", { name: nome, exact: true });

/** `semDock`: telas fora das abas (créditos, sobre os dados, perfil, cópia do caderno) não têm a barra inferior. */
async function abrirApp(page, caminho = "/", { semDock = false } = {}) {
  await page.goto(`${BASE}${caminho}`, { waitUntil: "load" });
  if (semDock) await esperar(async () => (await textoVisivel(page)).trim().length > 40, `tela ${caminho}`, 60_000);
  else await page.getByRole("tab", { name: "Explorar", exact: true }).waitFor({ timeout: 60_000 });
  await pausa(1200);
}

async function fecharGaveta(page) {
  await page.keyboard.press("Escape");
  await esperar(async () => (await page.getByRole("dialog").count()) === 0, "gaveta fecha", 8000).catch(() => undefined);
  await pausa(300);
}

/** Rola a rolagem visível até um texto ficar a `folga` px do topo da janela. */
async function rolarAteTexto(page, texto, folga = 120) {
  await page.evaluate(
    ({ texto, folga }) => {
      const alvo = [...document.querySelectorAll("body *")]
        .filter((el) => !el.closest('[aria-hidden="true"]') && el.childElementCount === 0 && el.textContent.trim().startsWith(texto))
        .at(0);
      if (!alvo) throw new Error(`sem texto: ${texto}`);
      let pai = alvo.parentElement;
      while (pai && !(/(auto|scroll)/.test(getComputedStyle(pai).overflowY) && pai.scrollHeight > pai.clientHeight + 8)) pai = pai.parentElement;
      if (!pai) return;
      pai.scrollTop += alvo.getBoundingClientRect().top - folga;
    },
    { texto, folga },
  );
  await pausa(500);
}

// ——— A: Explorar com o caderno vazio ———————————————————————————————————————————————————————————————
if (roda("A")) {
  console.log("A) Explorar vazio, busca e localização");
  const { browser, context, page } = await abrirNavegador();
  await abrirApp(page);
  await capturar(page, "01-explorar-vazio", { inteira: true });

  // Buscando: os arquivos do cadastro são atrasados 2,5 s para o estado "Procurando no cadastro…" ficar na tela.
  await context.route("**/dados/**", async (r) => {
    await pausa(2500);
    await r.continue();
  });
  await campo(page, "Link do anúncio, prédio, rua ou bairro").fill("Rosa e Silva");
  await page.getByRole("button", { name: "Buscar no cadastro", exact: true }).click();
  await esperarTexto(page, "Procurando no cadastro");
  await capturar(page, "02-explorar-buscando");
  await esperarTexto(page, "Toque para abrir o Raio-X", 60_000);
  await context.unroute("**/dados/**");
  await pausa(600);
  await capturar(page, "03-explorar-resultados", { inteira: true });

  // Sem permissão de localização (o navegador nega na hora).
  await campo(page, "Link do anúncio, prédio, rua ou bairro").fill("");
  await page.getByRole("button", { name: "Usar minha localização agora", exact: true }).click();
  await esperar(async () => /Sem permissão de localização|Não deu para ler a sua localização/.test(await textoVisivel(page)), "aviso de localização", 20_000);
  await capturar(page, "04-explorar-sem-permissao");
  await browser.close();

  // Com permissão, na porta do prédio de exemplo de Boa Viagem.
  const b = await abrirNavegador();
  await b.context.grantPermissions(["geolocation"], { origin: BASE });
  await b.context.setGeolocation({ longitude: -34.889839, latitude: -8.110565, accuracy: 12 });
  await abrirApp(b.page);
  await b.page.getByRole("button", { name: "Usar minha localização agora", exact: true }).click();
  await esperarTexto(b.page, "Prédio mais perto", 60_000);
  await pausa(500);
  await capturar(b.page, "05-explorar-localizacao");
  await b.browser.close();
}

// ——— B: entrada pelo link e caderno de exemplo ———————————————————————————————————————————————————
if (roda("B")) {
  console.log("B) link do anúncio, prédio e caderno de exemplo");
  const { browser, context, page } = await abrirNavegador();
  await abrirApp(page);

  await campo(page, "Link do anúncio, prédio, rua ou bairro").fill(LINK_CASA_FORTE);
  await pausa(300);
  await capturar(page, "06-explorar-link-colado", { texto: false });
  await page.getByRole("button", { name: "Gerar Dossiê", exact: true }).click();
  await esperarRota(page, "/ler");
  await esperar(async () => /Editar ›|código 2799999990/.test(await textoVisivel(page)), "leitura do link", 30_000);
  await pausa(1200);
  await capturar(page, "07-ler-link", { inteira: true });
  await campo(page, "Texto do anúncio").fill(TEXTO_CASA_FORTE);
  await page.getByRole("button", { name: "Ler texto", exact: true }).click();
  await esperarTexto(page, "R$ 690.000");
  await pausa(1200);
  await capturar(page, "08-ler-texto-lido", { inteira: true });
  const encontrar = page.getByRole("button", { name: "Encontrar o prédio", exact: true });
  if (await encontrar.count()) await encontrar.click();
  else await page.getByRole("button", { name: /^Não é este/ }).click();
  await esperarRota(page, "/predio");
  await esperarTexto(page, "É este o prédio?", 30_000);
  await pausa(2500);
  await capturar(page, "09-predio-confirmar", { inteira: true });

  // Os três exemplos do Explorar, um por vez; depois, os dados do anúncio digitados no editor.
  for (const a of ANUNCIOS) {
    await abrirApp(page);
    const abrir = page.getByRole("button", { name: "Explorar um endereço exemplo agora", exact: true });
    if ((await abrir.getAttribute("aria-expanded")) === "false") await abrir.click();
    await page.getByRole("button", { name: new RegExp(`^Exemplo: ${a.exemplo}`) }).click();
    await esperarRota(page, "/dossie", 40_000);
    await esperarTexto(page, "Destaques", 40_000);
    await pausa(3000);
    if (a === ANUNCIOS[0]) await capturar(page, "10-dossie-exemplo-como-abre", { inteira: true });

    await page.getByText("Ver composição e ajustar valores").first().click();
    await esperarRota(page, "/editar");
    await pausa(800);
    const aluguel = a.modalidade === "aluguel";
    await page.getByRole("radio", { name: aluguel ? "Alugar" : "Comprar", exact: true }).click();
    await pausa(300);
    await campo(page, aluguel ? "Aluguel (R$ por mês)" : "Preço de venda (R$)").fill(String(a.preco));
    await campo(page, "Condomínio (R$ por mês)").fill(String(a.condominio));
    if (a.iptu !== null) {
      await campo(page, "IPTU (R$)").fill(String(a.iptu));
      await page.getByRole("radio", { name: "Mês", exact: true }).click();
    }
    if (a.seguro) await campo(page, "Seguro incêndio (R$ por mês)").fill(String(a.seguro));
    await campo(page, "Área (m²)").fill(String(a.area));
    await campo(page, "Quartos").fill(String(a.quartos));
    await campo(page, "Suítes").fill(String(a.suites));
    await campo(page, "Banheiros").fill(String(a.banheiros));
    await campo(page, "Vagas").fill(String(a.vagas));
    await campo(page, "Andar").fill(String(a.andar));
    await pausa(300);
    if (a === ANUNCIOS[0]) await capturar(page, "11-editar-anuncio", { inteira: true });
    await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
    await esperar(() => rota(page) !== "/editar", "sai do editor", 20_000);
    await pausa(1500);
    console.log(`  ${a.exemplo}: salvo, em ${rota(page)}`);
  }
  await context.storageState({ path: ESTADO });
  await browser.close();
}

if (["C", "D", "E", "F", "G", "H"].some(roda) && !existsSync(ESTADO)) {
  console.error("Falta o caderno de exemplo: rode a seção B primeiro.");
  process.exit(1);
}

/** Abre o dossiê de uma análise pelo cartão do Explorar. */
async function abrirDossie(page, comecaCom) {
  await abrirApp(page);
  await page.getByRole("button", { name: new RegExp(`^Exemplo · ${comecaCom}`) }).first().click();
  await esperarRota(page, "/dossie", 40_000);
  await esperarTexto(page, "Destaques", 40_000);
  await pausa(3500);
}

// ——— C: Explorar com o caderno e a triagem ———————————————————————————————————————————————————————
if (roda("C")) {
  console.log("C) Explorar com caderno, triagem e descarte");
  const { browser, context, page } = await abrirNavegador({ estado: ESTADO });
  await abrirApp(page);
  await pausa(2500);
  await capturar(page, "12-explorar-com-caderno", { inteira: true });

  // Triagem: favorita Boa Viagem, põe Graças em "Visita" e abre "Anotar" em Boa Viagem.
  await page.getByRole("button", { name: /^Favoritar Exemplo · Beira-mar/ }).click();
  await pausa(500);
  const etapaGracas = page.getByRole("radiogroup", { name: /^Etapa de Exemplo · Revenda antiga/ }).getByRole("radio", { name: "Etapa Visita", exact: true });
  await etapaGracas.click();
  await pausa(500);
  await page.getByRole("button", { name: /^Anotar sobre Exemplo · Beira-mar/ }).click();
  await pausa(400);
  await page.getByRole("textbox", { name: /^Nota sobre Exemplo · Beira-mar/ }).fill("Perguntar o IPTU do boleto e se a varanda pega sol da tarde.");
  await rolarAteTexto(page, "Análises Recentes", 90);
  await capturar(page, "13-explorar-triagem-anotar");
  await page.getByRole("button", { name: "Guardar nota", exact: true }).click();
  await pausa(700);

  await page.getByRole("button", { name: /^Descartar Exemplo · Rua da Madalena/ }).click();
  await page.getByRole("dialog").first().waitFor();
  await pausa(700);
  await capturar(page, "14-descartar-gaveta");
  await fecharGaveta(page);
  await context.storageState({ path: ESTADO });
  await browser.close();
}

// ——— D: Dossiê ————————————————————————————————————————————————————————————————————————————————————
if (roda("D")) {
  console.log("D) Dossiê do exemplo de Boa Viagem, com anúncio");
  const { browser, page } = await abrirNavegador({ estado: ESTADO });
  await abrirDossie(page, "Beira-mar");
  await capturar(page, "15-dossie-destaques", { inteira: true });

  // Ficha de método (6 campos) da nota de sossego, no placar do topo.
  await page.getByRole("button", { name: "Como foi calculada a nota de sossego", exact: true }).click();
  await pausa(500);
  await rolarAteTexto(page, "Sossego à noite", 110);
  await capturar(page, "16-dossie-ficha-de-metodo");
  await page.getByRole("button", { name: /^Ocultar: como foi calculada a nota de sossego/i }).click().catch(() => undefined);

  // Ver a fonte de um número do cadastro.
  await page.getByRole("button", { name: /^Prédio de .*Ver fonte\.$/ }).click();
  await page.getByRole("dialog").first().waitFor();
  await pausa(700);
  await capturar(page, "17-dossie-ver-a-fonte");
  await fecharGaveta(page);

  await page.getByRole("link", { name: "Cadastro oficial", exact: true }).click();
  await page.getByRole("dialog", { name: "Cadastro oficial" }).waitFor();
  await pausa(700);
  await capturar(page, "18-dossie-gaveta-cadastro");
  await fecharGaveta(page);

  await page.getByRole("button", { name: /Abrir mapa/ }).first().click();
  await page.getByRole("dialog").first().waitFor();
  await pausa(2500);
  await capturar(page, "19-dossie-gaveta-mapa");
  await fecharGaveta(page);

  // "Auditoria detalhada em 10 pontos": o que aparece ao abrir o botão do fim da aba Destaques.
  await page.getByRole("button", { name: "Ver auditoria detalhada em 10 pontos e simulador", exact: true }).click();
  await pausa(1500);
  await capturar(page, "20-dossie-destaques-10-pontos", { inteira: true });
  await page.getByRole("button", { name: "Ocultar auditoria detalhada em 10 pontos", exact: true }).click();

  await page.getByRole("tab", { name: "Entorno", exact: true }).click();
  await pausa(3000);
  await capturar(page, "21-dossie-entorno", { inteira: true });
  await page.getByRole("tab", { name: "Edifício", exact: true }).click();
  await pausa(3000);
  await capturar(page, "22-dossie-edificio", { inteira: true });
  await browser.close();
}

// ——— E: Comparar ——————————————————————————————————————————————————————————————————————————————————
if (roda("E")) {
  console.log("E) Comparar");
  const { browser, page } = await abrirNavegador({ estado: ESTADO });
  await abrirApp(page, "/comparar");
  await pausa(4000);
  console.log((await textoVisivel(page)).slice(0, 600));
  await capturar(page, "23-comparar", { inteira: true });
  for (const topico of await page.getByRole("tab").allInnerTexts()) console.log("  aba:", topico.replace(/\n/g, " "));
  await browser.close();
}

// ——— F: Visita ————————————————————————————————————————————————————————————————————————————————————
if (roda("F")) {
  console.log("F) Visita");
  const { browser, page } = await abrirNavegador({ estado: ESTADO });
  await abrirDossie(page, "Beira-mar");
  await page.getByRole("button", { name: "Preparar visita", exact: true }).click();
  await esperarRota(page, "/visita");
  await pausa(3000);
  await capturar(page, "24-visita-preparar", { inteira: true });
  await page.getByRole("button", { name: "Começar visita", exact: true }).click();
  await pausa(2500);
  await capturar(page, "25-visita-no-imovel", { inteira: true });
  console.log((await page.getByRole("tab").allInnerTexts()).map((t) => t.replace(/\n/g, " ")).join(" | "));
  await browser.close();
}

// ——— G: Salvos e casca ————————————————————————————————————————————————————————————————————————————
if (roda("G")) {
  console.log("G) Salvos, menu, créditos, sobre os dados");
  const { browser, page } = await abrirNavegador({ estado: ESTADO });
  await abrirApp(page, "/salvos");
  await pausa(2500);
  await capturar(page, "26-salvos", { inteira: true });
  await page.getByRole("button", { name: "Menu de navegação", exact: true }).click();
  await pausa(600);
  await capturar(page, "27-menu-aberto");
  await page.keyboard.press("Escape");
  await abrirApp(page, "/creditos", { semDock: true });
  await pausa(1500);
  await capturar(page, "28-creditos", { inteira: true });
  await abrirApp(page, "/sobre-os-dados", { semDock: true });
  await pausa(1500);
  await capturar(page, "29-sobre-os-dados", { inteira: true });
  await abrirApp(page, "/perfil-domicilio", { semDock: true });
  await pausa(1500);
  await capturar(page, "30-perfil-da-casa", { inteira: true });
  await abrirApp(page, "/dados-do-caderno", { semDock: true });
  await pausa(1500);
  await capturar(page, "31-copia-do-caderno", { inteira: true });
  await browser.close();
}

// ——— H: erro e sem rede ———————————————————————————————————————————————————————————————————————————
if (roda("H")) {
  console.log("H) sem rede e telas vazias");
  // Caderno guardado, mas os arquivos de camada não chegam (sem rede): o dossiê não tem como desenhar.
  const { browser, context, page } = await abrirNavegador({ estado: ESTADO });
  await context.route("**/dados/**", (r) => r.abort());
  await abrirApp(page);
  await pausa(1500);
  await page.getByRole("button", { name: /^Exemplo · Beira-mar/ }).first().click();
  await esperarRota(page, "/dossie", 40_000);
  await pausa(6000);
  await capturar(page, "32-dossie-sem-rede");
  await abrirApp(page);
  await campo(page, "Link do anúncio, prédio, rua ou bairro").fill("Parque Atlântico");
  await page.getByRole("button", { name: "Buscar no cadastro", exact: true }).click();
  await esperar(async () => /não abriu agora|Nada no cadastro/.test(await textoVisivel(page)), "aviso da busca sem rede", 30_000);
  await capturar(page, "33-explorar-busca-sem-rede");
  await browser.close();

  // Sem caderno: as abas Dossiê, Comparar e Visita vazias.
  const v = await abrirNavegador();
  for (const [aba, nome] of [["/dossie", "34-dossie-vazio"], ["/comparar", "35-comparar-vazio"], ["/visita", "36-visita-vazia"], ["/salvos", "37-salvos-vazio"]]) {
    await abrirApp(v.page, aba);
    await pausa(1500);
    await capturar(v.page, nome);
  }
  await v.browser.close();
}
console.log("pronto");
