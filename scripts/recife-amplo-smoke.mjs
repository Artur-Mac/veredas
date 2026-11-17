// Fluxos novos com dados sintéticos, sem chamadas externas. Não valida aparelhos ou integrações pagas.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.POC_URL || "http://localhost:8091";
const saida = path.resolve(process.env.AMPLO_OUT || "out/v1/execucao-ampla/novos");
await fs.mkdir(saida, { recursive: true });
const catalogo = await fs.readFile("src/dados/recife/publicacaoGerada.ts", "utf8");
const diretorioDoIndice = /export const DIRETORIO_DO_INDICE = "([a-z0-9/-]+)"/.exec(catalogo)?.[1];
assert(diretorioDoIndice && !diretorioDoIndice.includes(".."));
const indice = JSON.parse(await fs.readFile(`src/dados/recife/${diretorioDoIndice}/casa-forte.json`, "utf8"));
const predio = indice.edificios[0];
const em = "2026-10-21T12:00:00.000Z";
const vazio = { valor: null, origem: "voce", aConfirmar: false };
function analise(id) {
  return { versao: 2, id, criadaEm: em, atualizadaEm: em,
    nome: `Imóvel de teste ${id} com nome muito longo para conferir a leitura integral em uma tela estreita do Recife`,
    modalidade: "aluguel", tipologia: "apartamento", bairroTexto: "Casa Forte", bairro: "casa-forte", logradouro: null, numero: null, nomeEdificio: null, url: "", extracao: null,
    declarados: { preco: { ...vazio, valor: 2500 }, condominio: { ...vazio, valor: 600 }, iptu: { ...vazio, periodo: "desconhecido" },
      seguroIncendio: vazio, taxaServico: vazio, outros: vazio, area: vazio, quartos: vazio, suites: vazio, banheiros: vazio, vagas: vazio, andar: vazio },
    vinculo: { estado: "confirmado", edificioId: predio.id, dsqfl: predio.dsqfl ?? null, confirmadoEm: em, indiceGeradoEm: indice.geradoEm },
    visita: { verificadas: [], respostas: { propria: "Resposta anterior" }, perguntasProprias: [], notas: "Nota privada de teste", ruido: null, orientacaoGraus: null, segundos: 30, concluidaEm: em }, salva: true, descarte: null };
}
const erros = [];
const capturas = [];
function pdfSintetico() {
  const stream = "BT /F1 12 Tf 20 50 Td (Documento sintetico de teste) Tj ET";
  const objetos = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 100] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let texto = "%PDF-1.4\n";
  const offsets = [0];
  for (const [i, obj] of objetos.entries()) { offsets.push(Buffer.byteLength(texto)); texto += `${i + 1} 0 obj\n${obj}\nendobj\n`; }
  const inicio = Buffer.byteLength(texto);
  texto += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => String(n).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${inicio}\n%%EOF\n`;
  return Buffer.from(texto);
}
const navegador = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
try {
  for (const largura of [375, 1280, 360]) {
    const contexto = await navegador.newContext({ viewport: { width: largura, height: largura === 1280 ? 900 : 812 } });
    await contexto.route("**/*", r => {
      if (new URL(r.request().url()).origin === new URL(base).origin || /^(data|blob):/.test(r.request().url())) return r.continue();
      erros.push(`Chamada externa: ${new URL(r.request().url()).origin}`); return r.abort();
    });
    const pagina = await contexto.newPage();
    pagina.on("pageerror", e => erros.push(e.message));
    await pagina.addInitScript(({ lista, em }) => {
      if (!localStorage.getItem("vereda-smoke-inicializado")) {
        localStorage.setItem("vereda-analises-v2", JSON.stringify(lista));
        localStorage.setItem("vereda-ativa-v1", "a");
        localStorage.setItem("vereda-carteira-v1", JSON.stringify({ saldo: 3, extrato: [{ tipo: "cota_inicial", delta: 3, em, analiseId: null }] }));
        localStorage.setItem("vereda-smoke-inicializado", "sim");
      }
    }, { lista: [analise("a"), analise("b"), analise("c")], em });
    const foto = async (nome, foco) => {
      if (foco) await foco.scrollIntoViewIfNeeded();
      else await pagina.evaluate(() => {
        for (const el of document.querySelectorAll("*")) {
          if (el.scrollHeight > el.clientHeight && /auto|scroll/.test(getComputedStyle(el).overflowY)) el.scrollTop = 0;
        }
      });
      await pagina.screenshot({ path: path.join(saida, `${nome}-${largura}.png`), fullPage: true });
      const overflow = await pagina.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `Overflow em ${nome}/${largura}`);
      capturas.push(`${nome}-${largura}.png`);
    };
    const ir = async (rota) => { await pagina.goto(base + rota); await pagina.getByText("Guarde uma cópia.").or(pagina.getByText("Seu orçamento.")).or(pagina.getByText("Documentos e edifício.")).or(pagina.getByText("Seu registro de campo.")).or(pagina.getByText("Compare suas opções.")).or(pagina.getByText("Adicionar imóvel", { exact: true })).first().waitFor(); };

    await ir("/detalhes?id=a&secao=orcamento");
    await pagina.getByRole("button", { name: /Novo cenário de permanência/ }).click();
    await pagina.getByRole("textbox", { name: "Nome do cenário", exact: true }).fill("Permanência de teste");
    await pagina.getByRole("textbox", { name: "Despesas iniciais em R$", exact: true }).fill("1.000");
    await pagina.getByRole("textbox", { name: "Caução reembolsável em R$", exact: true }).fill("7.500");
    await pagina.getByRole("button", { name: "Guardar cenário", exact: true }).click();
    await pagina.getByText("Permanência de teste · 12 meses").waitFor();
    await foto("orcamento");

    await ir("/detalhes?id=a&secao=edificio");
    await pagina.getByRole("button", { name: /Registrar documento apresentado/ }).click();
    const [escolherPdf] = await Promise.all([pagina.waitForEvent("filechooser"), pagina.getByRole("button", { name: "Escolher PDF deste aparelho", exact: true }).click()]);
    await escolherPdf.setFiles({ name: "documento-sintetico.pdf", mimeType: "application/pdf", buffer: pdfSintetico() });
    await pagina.getByText("PDF guardado neste aparelho. Confirme os dados abaixo para vinculá-lo ao registro.").waitFor();
    await pagina.getByRole("textbox", { name: "Título do documento", exact: true }).fill("Inspeção de fachada — teste");
    await pagina.getByRole("textbox", { name: "Origem ou responsável que apresentou", exact: true }).fill("Documento sintético do teste");
    await pagina.getByRole("textbox", { name: "Data da inspeção (AAAA-MM-DD, se conhecida)", exact: true }).fill("2020-01-01");
    await pagina.getByRole("textbox", { name: "Data de emissão (AAAA-MM-DD, se conhecida)", exact: true }).fill("2026-01-01");
    await pagina.getByRole("button", { name: "Vínculo do documento ao imóvel: Conferi o imóvel", exact: true }).click();
    await pagina.getByRole("button", { name: "Guardar registro do documento", exact: true }).click();
    await pagina.getByText(/Última inspeção apresentada: 01\/01\/2020/).waitFor();
    await pagina.getByRole("button", { name: /Identidade jurídica e CNPJ/ }).click();
    await pagina.getByRole("textbox", { name: "Nome da entidade", exact: true }).fill("Condomínio sintético de teste");
    await pagina.getByRole("textbox", { name: "CNPJ informado", exact: true }).fill("AB.CDE.123/0001-99");
    await pagina.getByRole("textbox", { name: "Evidência do vínculo (documento/endereço)", exact: true }).fill("Ata sintética vinculada ao imóvel do teste");
    await pagina.getByRole("button", { name: "Você conferiu esse vínculo?: Sim", exact: true }).click();
    await pagina.getByRole("button", { name: "Guardar entidade", exact: true }).click();
    await pagina.getByText("ABCDE123000199", { exact: false }).waitFor();
    await pagina.getByRole("button", { name: /Obras, questões construtivas e trabalhistas/ }).click();
    await pagina.getByRole("button", { name: "Entidade do registro: Condomínio sintético de teste (condominio)", exact: true }).click();
    await pagina.getByRole("button", { name: "Assunto do registro: Trabalhista", exact: true }).click();
    await pagina.getByRole("textbox", { name: "Número do processo ou identificador do documento", exact: true }).fill("processo-sintetico");
    await pagina.getByRole("textbox", { name: "Tribunal ou órgão de origem", exact: true }).fill("TRT6 — fonte sintética");
    await pagina.getByRole("button", { name: "Polo da entidade: Autor", exact: true }).click();
    await pagina.getByRole("textbox", { name: "Estágio informado na fonte", exact: true }).fill("Alegação em discussão");
    await pagina.getByRole("textbox", { name: "Fonte, documento e página", exact: true }).fill("Documento sintético, página 1");
    await pagina.getByRole("button", { name: "Guardar ocorrência apresentada", exact: true }).click();
    await pagina.getByText("Trabalhista · processo-sintetico", { exact: true }).waitFor();
    await foto("documentos");

    await ir("/detalhes?id=a&secao=campo");
    await pagina.getByRole("button", { name: /Contestar uma informação/ }).click();
    await pagina.getByRole("textbox", { name: "Qual informação precisa de correção?", exact: true }).fill("Nome cadastral divergente");
    await pagina.getByRole("textbox", { name: "Fonte, data ou versão contestada", exact: true }).fill("Índice local do ensaio");
    await pagina.getByRole("textbox", { name: "Motivo da correção", exact: true }).fill("Verificar placa durante a visita; não altera a fonte pública.");
    await pagina.getByRole("button", { name: "Guardar correção no caderno", exact: true }).click();
    await pagina.getByText("Nome cadastral divergente", { exact: true }).waitFor();
    await foto("correcao-local", pagina.getByText("Nome cadastral divergente", { exact: true }));
    await pagina.getByRole("button", { name: /Destinos da sua rotina/ }).click();
    await pagina.getByRole("textbox", { name: "Apelido do destino", exact: true }).fill("Trabalho de teste");
    await pagina.getByRole("textbox", { name: "Anotação de trajeto (opcional)", exact: true }).fill("Conferir ponte e travessia na visita");
    await pagina.getByRole("button", { name: "Guardar destino privado", exact: true }).click();
    await pagina.getByText("Trabalho de teste", { exact: true }).waitFor();
    await foto("rotina-sem-posicao", pagina.getByText("Trabalho de teste", { exact: true }));
    await contexto.setGeolocation({ latitude: -8.03, longitude: -34.9, accuracy: 20 });
    await contexto.grantPermissions(["geolocation"]);
    await pagina.getByRole("textbox", { name: "Apelido do destino", exact: true }).fill("Destino com GPS simulado");
    await pagina.getByRole("button", { name: "Estou no destino: obter minha posição", exact: true }).click();
    await pagina.getByText("Posição obtida. Confira o apelido antes de guardar.").waitFor();
    await pagina.getByRole("button", { name: "Guardar destino privado", exact: true }).click();
    await pagina.getByText(/Não é rota nem tempo de deslocamento/).waitFor();
    await foto("rotina-gps-simulado", pagina.getByText(/Não é rota nem tempo de deslocamento/));
    if (largura === 375) {
      await pagina.getByRole("button", { name: /Preparar resumo para compartilhar/ }).click();
      const [pdf] = await Promise.all([pagina.waitForEvent("popup"), pagina.getByRole("button", { name: "Imprimir ou salvar PDF", exact: true }).click()]);
      await pdf.waitForLoadState();
      await pdf.evaluate(() => document.fonts.ready);
      const textoPdf = await pdf.locator("body").innerText();
      assert(textoPdf.includes("Mensal conhecido: R$ 3.100"));
      for (const privado of ["Nota privada de teste", "Trabalho de teste", "Destino com GPS simulado", "ABCDE123000199"]) assert(!textoPdf.includes(privado));
      await pdf.pdf({ path: path.join(saida, "resumo-selecionado.pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
      await pdf.close();
    }
    await pagina.getByRole("textbox", { name: "Cômodo ou local", exact: true }).fill("Quarto de teste");
    await pagina.getByRole("button", { name: "Assunto da observação: Conectividade", exact: true }).click();
    await pagina.getByRole("textbox", { name: "O que você observou", exact: true }).fill("Sem roteador. Indicador 4G observado no aparelho, sem teste de velocidade.");
    await pagina.getByRole("button", { name: "Guardar observação", exact: true }).click();
    await pagina.getByText("Quarto de teste · conectividade").waitFor();
    await pagina.getByRole("button", { name: /Fotos próprias/ }).click();
    const png = await pagina.evaluate(() => {
      const c = document.createElement("canvas"); c.width = 20; c.height = 20;
      c.getContext("2d").fillRect(0, 0, 20, 20); return c.toDataURL("image/png").split(",")[1];
    });
    const [seletor] = await Promise.all([pagina.waitForEvent("filechooser"), pagina.getByRole("button", { name: "Escolher uma foto própria", exact: true }).click()]);
    await seletor.setFiles({ name: "foto-teste.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
    await pagina.getByText("Foto guardada neste aparelho. Não está incluída no backup de texto.").waitFor();
    await pagina.getByRole("button", { name: /Visitas anteriores/ }).click();
    await pagina.getByRole("button", { name: "Guardar visita atual e preparar outra", exact: true }).click();
    await pagina.getByText("Nota privada de teste", { exact: true }).waitFor();
    await foto("campo");
    await pagina.reload();
    await pagina.getByText("Quarto de teste · conectividade").waitFor();
    const dados = await pagina.evaluate(() => JSON.parse(localStorage.getItem("vereda-analises-v2")));
    assert.equal(dados[0].caderno?.visitas.length, 1);
    assert.equal(dados[0].visita.notas, "");
    assert.equal(dados[0].caderno?.cenarios.length, 1);
    assert.equal(dados[0].caderno?.fotos.length, 1);

    await ir("/dados-do-caderno");
    await pagina.getByRole("button", { name: /Restaurar ou juntar/ }).click();
    const backup = { formato: "vereda-caderno", versao: 1, exportadoEm: em, incluiArquivos: false, analises: dados };
    await pagina.getByRole("textbox", { name: "Conteúdo do arquivo de caderno", exact: true }).fill(JSON.stringify(backup));
    await pagina.getByRole("button", { name: "Revisar importação", exact: true }).click();
    await pagina.getByText(/0 novas cópias · 3 já presentes/).waitFor();
    await foto("backup");
    await pagina.getByRole("button", { name: "Confirmar importação", exact: true }).click();
    await pagina.getByText("Importação salva neste aparelho.").waitFor();
    await pagina.getByRole("button", { name: /Cópia com arquivos deste navegador/ }).click();
    const [download] = await Promise.all([pagina.waitForEvent("download"), pagina.getByRole("button", { name: "Exportar com fotos e PDFs", exact: true }).click()]);
    const copia = path.join(saida, `pacote-sintetico-${largura}.json`);
    await download.saveAs(copia);
    const pacoteTexto = await fs.readFile(copia, "utf8");
    const pacote = JSON.parse(pacoteTexto);
    assert.equal(pacote.arquivos.length, 2);
    await pagina.evaluate(async () => {
      localStorage.setItem("vereda-analises-v2", "[]"); localStorage.removeItem("vereda-ativa-v1");
      await new Promise((resolve, reject) => {
        const r = indexedDB.open("vereda-midia-v1", 1);
        r.onsuccess = () => { const db = r.result; const t = db.transaction("fotos", "readwrite"); t.objectStore("fotos").clear();
          t.oncomplete = () => { db.close(); resolve(); }; t.onerror = reject; }; r.onerror = reject;
      });
    });
    await pagina.reload();
    await pagina.getByRole("button", { name: /Cópia com arquivos deste navegador/ }).click();
    const escolherPacote = async (texto) => {
      const [s] = await Promise.all([pagina.waitForEvent("filechooser"), pagina.getByRole("button", { name: "Escolher cópia com arquivos", exact: true }).click()]);
      await s.setFiles({ name: "copia-sintetica.json", mimeType: "application/json", buffer: Buffer.from(texto) });
    };
    const adulterado = structuredClone(pacote);
    adulterado.arquivos[0].sha256 = "0".repeat(64);
    await escolherPacote(JSON.stringify(adulterado));
    await pagina.getByText("A integridade de um arquivo não pôde ser confirmada.").waitFor();
    assert.equal(await pagina.evaluate(() => localStorage.getItem("vereda-analises-v2")), "[]");
    const caminhoInvalido = structuredClone(pacote);
    caminhoInvalido.arquivos[0].chave = "../../foto-invalida.jpg";
    await escolherPacote(JSON.stringify(caminhoInvalido));
    await pagina.getByText("Pacote inválido ou incompatível. O caderno anterior foi preservado.").waitFor();
    assert.equal(await pagina.getByRole("button", { name: "Confirmar pacote com arquivos", exact: true }).count(), 0);
    const ausente = structuredClone(pacote); ausente.arquivos.pop();
    await escolherPacote(JSON.stringify(ausente));
    await pagina.getByText("Há anexos ausentes. O pacote não é uma cópia completa.").waitFor();
    const duplicado = structuredClone(pacote); duplicado.arquivos.push(duplicado.arquivos[0]);
    await escolherPacote(JSON.stringify(duplicado));
    await pagina.getByText("Arquivo duplicado ou não referenciado corretamente.").waitFor();
    await escolherPacote(pacoteTexto);
    await pagina.getByText(/3 novas cópias · 0 já presentes · 2 arquivos verificados/).waitFor();
    await foto("pacote-revisao");
    await pagina.getByRole("button", { name: "Confirmar pacote com arquivos", exact: true }).click();
    await pagina.getByText("Pacote restaurado neste navegador.").waitFor();
    assert.equal(await pagina.evaluate(() => JSON.parse(localStorage.getItem("vereda-analises-v2")).length), 3);
    const arquivosRestaurados = await pagina.evaluate(async () => new Promise((resolve, reject) => {
      const r = indexedDB.open("vereda-midia-v1", 1);
      r.onsuccess = () => { const db = r.result; const t = db.transaction("fotos"); const q = t.objectStore("fotos").getAllKeys();
        q.onsuccess = () => resolve(q.result); q.onerror = reject; t.oncomplete = () => db.close(); }; r.onerror = reject;
    }));
    assert.equal(arquivosRestaurados.length, 2);
    await escolherPacote(pacoteTexto);
    await pagina.getByText(/0 novas cópias · 3 já presentes · 2 arquivos verificados/).waitFor();
    await pagina.getByRole("button", { name: "Confirmar pacote com arquivos", exact: true }).click();
    await pagina.getByText("Pacote restaurado neste navegador.").waitFor();
    assert.equal(await pagina.evaluate(() => JSON.parse(localStorage.getItem("vereda-analises-v2")).length), 3);

    await pagina.goto(base + "/dossie?id=a");
    await pagina.getByRole("tab", { name: "Entorno", exact: true }).click();
    await pagina.getByRole("button", { name: /Serviços registrados no entorno/ }).click();
    await pagina.getByText(/Coordenadas originais do levantamento/).waitFor();
    await foto("servicos-cnefe");
    await foto("servicos-cnefe-detalhe", pagina.getByText(/Coordenadas originais do levantamento/));

    await ir("/comparar");
    await pagina.getByRole("button", { name: /Incluir um terceiro imóvel/ }).click();
    await pagina.getByRole("button", { name: "Escolher terceiro imóvel", exact: true }).click();
    await pagina.getByRole("radiogroup", { name: "Escolher terceiro imóvel", exact: true }).getByRole("radio").first().click();
    await pagina.getByRole("button", { name: "Trocar terceiro imóvel", exact: true }).waitFor();
    await foto("tres-imoveis");
    await pagina.getByText(/Mensal conhecido/).last().evaluate(el => el.scrollIntoView({ block: "center" }));
    await foto("tres-imoveis-custo", pagina.getByText(/Mensal conhecido/).last());
    await pagina.getByRole("button", { name: "Assunto da comparação ampliada: Documentos", exact: true }).click();
    await pagina.getByText(/Inspeção apresentada com vínculo confirmado: não informada/).last().waitFor();
    await foto("comparacao-documentos-ausentes", pagina.getByText(/Inspeção apresentada com vínculo confirmado: não informada/).last());

    await pagina.getByRole("button", { name: /Comparar pelas minhas prioridades/ }).click();
    await pagina.getByRole("button", { name: "Ver Rotina primeiro", exact: true }).click();
    await pagina.getByText("1. Rotina", { exact: true }).waitFor();
    const destinosDaRotina=pagina.getByRole("button",{name:/^Comparar destino /});
    await destinosDaRotina.last().click();
    await pagina.getByText(/m em linha reta ao mesmo destino/).first().waitFor();
    await foto("prioridades-rotina",pagina.getByText("1. Rotina",{exact:true}));
    await pagina.getByRole("button", { name: /Comparar pelas minhas prioridades/ }).click();
    await pagina.getByRole("button", { name: /Comparáveis do meu caderno/ }).click();
    await pagina.getByText(/registros compatíveis após filtros/).waitFor();
    await pagina.getByRole("textbox",{name:"Área mínima declarada dos comparáveis, em m²",exact:true}).fill("100");
    await pagina.getByRole("textbox",{name:"Área máxima declarada dos comparáveis, em m²",exact:true}).fill("50");
    await pagina.getByText(/Informe áreas positivas/).waitFor();
    await foto("comparaveis-filtro",pagina.getByText(/Informe áreas positivas/));
    await pagina.getByRole("button", { name: /Comparáveis do meu caderno/ }).click();

    await pagina.evaluate(() => {
      const lista = JSON.parse(localStorage.getItem("vereda-analises-v2"));
      const a = lista.find(a => a.id === "a");
      a.caderno.documentos.push({ ...a.caderno.documentos[0], id: "sem-datas", titulo: "Documento apresentado sem datas", inspecaoEm: null, emitidoEm: null });
      localStorage.setItem("vereda-analises-v2", JSON.stringify(lista));
    });
    await ir("/detalhes?id=a&secao=edificio");
    await pagina.getByText("Inspeção: não informada · Emissão: não informada", { exact: true }).waitFor();
    await foto("documento-datas-ausentes", pagina.getByText("Inspeção: não informada · Emissão: não informada", { exact: true }));

    await pagina.getByRole("button", { name: /Linha do tempo do imóvel/ }).click();
    await pagina.getByText(/Eventos do índice atual e registros pessoais/).waitFor();
    await foto("cronologia-publica",pagina.getByText(/Eventos do índice atual e registros pessoais/));
    await ir("/editar");
    const nome = pagina.getByRole("textbox", { name: "Nome da análise", exact: true });
    await nome.fill("Rascunho de teste sem bairro");
    await pagina.waitForFunction(() => localStorage.getItem("vereda-rascunho-v1-novo")?.includes("Rascunho de teste"));
    await pagina.reload();
    await pagina.getByRole("button", { name: "Retomar rascunho", exact: true }).click();
    assert.equal(await nome.inputValue(), "Rascunho de teste sem bairro");
    await pagina.getByRole("button", { name: "Salvar alterações", exact: true }).click();
    await pagina.getByRole("link", { name: "Abrir Rascunho de teste sem bairro", exact: true }).waitFor();
    await foto("salvos-incompleto");

    await ir("/detalhes?id=a&secao=orcamento");
    await pagina.evaluate(() => {
      for (const el of document.querySelectorAll("body *")) {
        const c = getComputedStyle(el);
        if (el.children.length === 0 && (el.textContent?.trim() || el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
          el.style.fontSize = `${parseFloat(c.fontSize) * 2}px`;
          el.style.lineHeight = `${parseFloat(c.lineHeight) * 2 || parseFloat(c.fontSize) * 2.6}px`;
        }
      }
    });
    await pagina.keyboard.press("Tab");
    const foco = await pagina.evaluate(() => document.activeElement?.tagName);
    assert.notEqual(foco, "BODY");
    await foto("orcamento-texto-200");

    const compra = analise("compra"); compra.modalidade = "compra"; compra.declarados.preco.valor = 120000;
    for (const k of ["condominio", "iptu", "seguroIncendio", "taxaServico", "outros"]) compra.declarados[k] = { ...compra.declarados[k], valor: 0 };
    compra.declarados.iptu.periodo = "mes";
    await pagina.evaluate(compra => {
      const lista = JSON.parse(localStorage.getItem("vereda-analises-v2")); lista.push(compra);
      localStorage.setItem("vereda-analises-v2", JSON.stringify(lista));
    }, compra);
    await ir("/detalhes?id=compra&secao=orcamento");
    await pagina.getByRole("button", { name: /Simular financiamento Price/ }).click();
    await pagina.getByRole("textbox", { name: "Entrada em R$", exact: true }).fill("0");
    await pagina.getByRole("textbox", { name: "Taxa anual efetiva em %", exact: true }).fill("0");
    await pagina.getByRole("textbox", { name: "Prazo do financiamento em meses", exact: true }).fill("12");
    await pagina.getByRole("button", { name: "Calcular parcela simulada", exact: true }).click();
    await pagina.getByText("Última parcela ajustada ao saldo: R$ 10.000", { exact: true }).waitFor();
    await pagina.getByRole("button", { name: /Cenário comprar × alugar/ }).click();
    for (const [campo, valor] of [["Aluguel equivalente mensal em R$ (com encargos)", "10000"], ["Custos de aquisição em R$ (tributos e taxas informados)", "0"], ["Retorno anual efetivo líquido do investimento em %", "0"], ["Valorização anual hipotética em %", "0"], ["Custo hipotético de venda em % do imóvel", "0"]]) await pagina.getByRole("textbox", { name: campo, exact: true }).fill(valor);
    await pagina.getByRole("button", { name: "Calcular cenário comprar e alugar", exact: true }).click();
    await pagina.getByText("Compra — saldo devedor estimado: R$ 0", { exact: true }).waitFor();
    await foto("compra-cenario", pagina.getByText("Compra — saldo devedor estimado: R$ 0", { exact: true }));
    await pagina.getByRole("textbox", { name: "Taxa anual efetiva em %", exact: true }).fill("10");
    assert.equal(await pagina.getByText(/^Parcela simulada:/).count(), 0, "resultado antigo deve desaparecer após editar hipótese");
    await contexto.close();
  }
  assert.deepEqual(erros, []);
  await fs.writeFile(path.join(saida, "resultado.json"), JSON.stringify({ capturas, erros, dimensoes: ["375×812", "1280×900", "360×812"], plataformas: ["web"], pacoteComArquivos: "exportado, corrompido recusado sem alterar caderno e restaurado com dois arquivos", textoAmpliado: "aproximação por estilos 200%; não Dynamic Type nativo" }, null, 2));
  console.log(JSON.stringify({ capturas: capturas.length, erros }));
} finally { await navegador.close(); }
