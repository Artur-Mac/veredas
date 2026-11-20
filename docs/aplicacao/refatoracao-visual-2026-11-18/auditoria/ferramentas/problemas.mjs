// Evidências dos 10 piores problemas da auditoria (fase 0): capturas de janela (390 × 844) roladas até o trecho, e uma
// folha por problema em auditoria/problemas/.
//   node problemas.mjs      (depende do caderno montado por `node capturar.mjs B C` e das capturas em auditoria/capturas)
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fatiar } from "./fatiar.mjs";
import { montarFolha } from "./folha.mjs";
import { abrirNavegador, AQUI, BASE, esperar, esperarTexto, PASTA_AUDITORIA, pausa, rolarAteTexto } from "./navegador.mjs";

const DIR = path.join(PASTA_AUDITORIA, "problemas");
const BRUTAS = path.join(DIR, "trechos");
const CAPTURAS = path.join(PASTA_AUDITORIA, "capturas");
await mkdir(BRUTAS, { recursive: true });

const { browser, page } = await abrirNavegador({ estado: path.join(AQUI, ".estado.json") });
const rota = () => new URL(page.url()).pathname;
const foto = async (nome) => {
  const arquivo = path.join(BRUTAS, `${nome}.png`);
  await page.screenshot({ path: arquivo });
  return arquivo;
};
const trecho = async (nome, texto, folga = 110) => {
  await rolarAteTexto(page, texto, folga);
  return foto(nome);
};
async function abrir(caminho) {
  await page.goto(`${BASE}${caminho}`, { waitUntil: "load" });
  await page.getByRole("tab", { name: "Explorar", exact: true }).waitFor({ timeout: 60_000 });
  await pausa(3000);
}
const aba = async (nome) => {
  await page.getByRole("tab", { name: nome, exact: true }).click();
  await pausa(2500);
};

await abrir("/");
await page.getByRole("button", { name: /^Exemplo · Beira-mar/ }).first().click();
await esperar(() => rota() === "/dossie", "rota /dossie", 40_000);
await esperarTexto(page, "Destaques", 40_000);
await pausa(4000);

const t = {};
// Destaques
t.placar = await trecho("placar", "Valor pedido", 90);
t.guarde = await trecho("guarde", "Guarde o que este dossiê", 160);
t.dezAnosA = await trecho("dez-anos-a", "Visão de 10 anos", 100);
t.sossego = await trecho("sossego-por-fonte", "Sossego à noite por fonte", 90);
t.resumo = await trecho("resumo-para-enviar", "Resumo para guardar ou enviar", 100);
t.raiox = await trecho("raio-x", "Raio-X do edifício", 90);
t.exportar = await trecho("exportar-e-fim", "Exportar dossiê técnico", 90);
await page.getByRole("button", { name: "Ver auditoria detalhada em 10 pontos e simulador", exact: true }).click();
await pausa(1500);
t.dezAnosB = await trecho("dez-anos-b", "Simulador 10 anos: comprar", 100);
t.dezPontos = await trecho("dez-pontos", "Terreno de Marinha e FGTS", 90);
t.ruidoQuarto = await trecho("dez-pontos-ruido", "Ruído no quarto e horário de teste", 90);
t.agua = await trecho("dez-pontos-agua", "Reserva de água, energia e sinal 5G", 200);
// Entorno
await aba("Entorno");
t.andar = await trecho("andar-fachada", "Andar × fachada", 90);
t.aPe1 = await trecho("a-pe-lista", "Mercado, farmácia, praça e ônibus", 90);
t.diaADia = await trecho("dia-a-dia", "O que esperar no dia a dia", 90);
t.aPe2 = await trecho("a-pe-nota", "Dia a dia a pé e vida na rua", 90);
t.pulso = await trecho("pulso", "Pulso da quadra por dimensão", 90);
// Edifício
await aba("Edifício");
t.lado = await trecho("lado-do-barulho", "De que lado vem o barulho", 90);
// Comparar
await abrir("/comparar");
await pausa(2000);
t.cmpTopo = await trecho("comparar-6-pontos", "Lado a lado em 6 pontos", 90);
t.cmpDecidir = await trecho("comparar-para-decidir", "Para decidir", 90);
t.cmpDuelo = await trecho("comparar-duelo", "Duelo direto", 90);
await browser.close();

const c = (n) => path.join(CAPTURAS, `${n}.png`);
const folha = (nome, titulo, itens, colunas = itens.length) => montarFolha(itens, { saida: path.join(DIR, `${nome}.png`), titulo, colunas, largura: 320, escala: 1.5 });

await fatiar(path.join(CAPTURAS, "15-dossie-destaques-inteira.png"), { altura: 2320, colunas: 5, saida: path.join(DIR, "p01-dossie-em-13-telas") });
await folha("p02-a-mesma-leitura-varias-vezes", "O barulho aparece em 8 lugares do mesmo dossiê, cada um com outro desenho", [
  { arquivo: t.placar, legenda: "1. Placar do topo" },
  { arquivo: t.sossego, legenda: "2. Destaques · Sossego à noite por fonte" },
  { arquivo: t.raiox, legenda: "3. Destaques · Raio-X · Movimento e barulho" },
  { arquivo: t.ruidoQuarto, legenda: "4. Destaques · 10 pontos · Ruído no quarto" },
  { arquivo: t.andar, legenda: "5. Entorno · Andar × fachada · Barulho por perto" },
  { arquivo: t.diaADia, legenda: "6. Entorno · Acústica urbana · Dia × Noite" },
  { arquivo: t.pulso, legenda: "7. Entorno · Pulso · Sossego noturno" },
  { arquivo: t.lado, legenda: "8. Edifício · De que lado vem o barulho" },
], 4);
await folha("p03-numeros-diferentes-para-a-mesma-coisa", "Dois resultados para 10 anos e dois valores de saída mensal para o mesmo imóvel", [
  { arquivo: t.dezAnosA, legenda: "Destaques · Visão de 10 anos: ~R$ 559 mil" },
  { arquivo: t.dezAnosB, legenda: "Destaques · 10 pontos · Simulador 10 anos: R$ 420.264" },
  { arquivo: t.placar, legenda: "Dossiê · saída estimada ~R$ 6.805/mês" },
  { arquivo: c("26-salvos"), legenda: "Salvos · Bolso ~R$ 6.675/mês" },
]);
await folha("p04-pilha-de-cartoes-iguais", "Caixas iguais em sequência: rótulo, título, parágrafo e botão, tudo com o mesmo peso", [
  { arquivo: t.dezPontos, legenda: "10 pontos: 10 cartões com a mesma forma" },
  { arquivo: t.raiox, legenda: "Raio-X do edifício" },
  { arquivo: t.sossego, legenda: "Sossego à noite por fonte" },
]);
await folha("p05-muitas-acoes-e-rotulos-longos", "97 controles na aba Destaques; 39 com mais de 3 palavras", [
  { arquivo: t.exportar, legenda: "Fim da aba: 9 ações antes de “Preparar visita”" },
  { arquivo: t.resumo, legenda: "Três botões de copiar em sequência" },
  { arquivo: c("12-explorar-com-caderno"), legenda: "Explorar: “Gerar Dossiê” e “Simular” disputam" },
]);
await folha("p06-paragrafo-explicativo-e-jargao", "Texto de explicação na primeira camada e termos internos na tela", [
  { arquivo: t.guarde, legenda: "“Guarde o que este dossiê mostra hoje para ver…”" },
  { arquivo: t.resumo, legenda: "“Copiar link privado sem servidor (#s= / #v=)”" },
  { arquivo: t.cmpDuelo, legenda: "Comparar: “nao_sabemos”" },
  { arquivo: t.agua, legenda: "10 pontos: “Reserva estimada para ? dias”" },
]);
await fatiar(path.join(CAPTURAS, "12-explorar-com-caderno-inteira.png"), { altura: 1500, colunas: 2, saida: path.join(DIR, "p07-caderno-abaixo-da-dobra") });
await folha("p08-abas-vazias-e-salvos-escondido", "Três abas dependem de um imóvel aberto; Salvos só pelo menu e acende “Comparar”", [
  { arquivo: c("34-dossie-vazio"), legenda: "Aba Dossiê sem imóvel" },
  { arquivo: c("36-visita-vazia"), legenda: "Aba Visita sem imóvel" },
  { arquivo: c("27-menu-aberto"), legenda: "“Minhas análises” só no menu" },
  { arquivo: c("26-salvos"), legenda: "Salvos acende a aba Comparar" },
]);
await folha("p09-ficha-de-metodo-em-bloco-de-texto", "A ficha de método abre no meio da tela como um bloco de texto", [
  { arquivo: c("16-dossie-ficha-de-metodo"), legenda: "“Como foi calculada a nota de sossego” aberta" },
  { arquivo: c("17-dossie-ver-a-fonte"), legenda: "“Ver a fonte”: gaveta própria, bem resolvida" },
]);
await folha("p10-comparar-com-tres-conclusoes", "O Comparar conclui três coisas diferentes na mesma tela", [
  { arquivo: t.cmpTopo, legenda: "“Ana Elizabeth leva vantagem em 3 de 6”" },
  { arquivo: t.cmpDecidir, legenda: "“Visite primeiro Ana Elizabeth”" },
  { arquivo: t.cmpDuelo, legenda: "“Parque Atlântico custa R$ 385 a menos por mês…”" },
]);
await folha("x1-a-pe-quatro-vezes", "Os minutos a pé aparecem 4 vezes no mesmo dossiê", [
  { arquivo: c("15-dossie-destaques"), legenda: "Destaques · A pé, da porta do prédio (ver a tira p01)" },
  { arquivo: t.aPe1, legenda: "Entorno · Mercado, farmácia, praça e ônibus" },
  { arquivo: t.aPe2, legenda: "Entorno · Nota a pé" },
  { arquivo: t.pulso, legenda: "Entorno · Pulso · Serviços a pé" },
]);
console.log("pronto");
