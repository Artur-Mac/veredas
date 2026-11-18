// Copiloto (15/11/2026): Explorar sem partida a frio, Ficha Viva, simulador andar × fachada, placar ampliado, sala de
// decisão, leitor de ata, negociação com argumentos marcáveis, pacote para especialista e a camada de atrito.
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Image, Modal, View } from "react-native";
import { LinhaDoTempoEstrutural } from "../src/componentes/dossie-v1/FichaViva";
import { PacoteParaEspecialista } from "../src/componentes/dossie-v1/Pacote";
import { SimuladorDaUnidade } from "../src/componentes/dossie-v1/SimuladorDaUnidade";
import { TopoDoDossie } from "../src/componentes/dossie-v1/Topo";
import { Pressionavel } from "../src/componentes/Pressionavel";
import { placarDoPar, type ExtrasDoPlacar } from "../src/componentes/comparar/placar";
import { fraseDaDiferenca, nivelRelativoDb } from "../src/componentes/visita-v1/MedidorDeRuido";
import { cadernoVazio, type Caderno } from "../src/dados/caderno";
import { CAMADAS_PUBLICADAS } from "../src/dados/camadasGeradas";
import { esquemaAnaliseV2, type AnaliseV2, type Edificio } from "../src/dados/contratos";
import { compararCondominio, estruturaDoCaderno, fichaViva, mad, mediana, SEM_LEITURA } from "../src/dados/dossie/fichaViva";
import { relacaoComAFachada, ROSA, simularUnidade } from "../src/dados/dossie/simuladorDaUnidade";
import { lerAta } from "../src/dados/leitorDeAta";
import { mensagemDeNegociacao, prepararNegociacao } from "../src/dados/negociacao";
import { montarCenaComPontosExtras } from "../src/componentes/dossie-v1/mapa";
import { montarPacote, pacoteEmHtml, pacoteEmMarkdown } from "../src/dados/pacoteEspecialista";
import { extrairDoTexto } from "../src/dados/extrator/texto";
import { analiseDoPredio, EXEMPLOS, idDoRaioX } from "../src/dados/raioX";
import { atritoDoPredio, direcaoDoRumo, fatosDeAtrito } from "../src/dados/recife/atrito";
import { nomeHidricoDeTela, pontosDoEntornoNoMapa } from "../src/dados/recife/camadasAmbientais";
import { edificioPorId, edificiosDoBairro } from "../src/dados/recife/indice";
import { bairrosCitados, bairrosDaBusca, bairrosNoPonto, buscarNoCadastro, lerEntrada, predioMaisPerto } from "../src/dados/recife/localizar";
import { deBase64Url, fragmentoDaResposta, fragmentoDaSala, importarResposta, lerFragmento, montarSala, paraBase64Url } from "../src/dados/salaDeDecisao";
import { comEtapa, comNota, passaNoFiltro } from "../src/dados/triagem";
import { esquemaPerfilDomicilio } from "../src/estado/PerfilDomicilio";
import { TemaDoApp } from "../src/tema/Tema";

jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-print", () => ({ printAsync: jest.fn(async () => undefined) }));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn(async () => true) }));

const AGORA = "2026-11-15T12:00:00.000Z";
const gracas = edificiosDoBairro("gracas");
const comNome = gracas.find((e) => e.nome && e.pavimentos && e.anoConstrucao)!;

function analise(sobre: Partial<AnaliseV2> = {}, declarados: Partial<Record<keyof AnaliseV2["declarados"], number | null>> = {}): AnaliseV2 {
  const base = analiseDoPredio(comNome, { agora: AGORA, indiceGeradoEm: "2026-11-15T00:00:00Z", origem: "busca" });
  const d = { ...base.declarados };
  for (const [k, v] of Object.entries(declarados)) (d as Record<string, { valor: number | null }>)[k] = { ...(d as Record<string, object>)[k], valor: v } as { valor: number | null };
  return { ...base, ...sobre, declarados: d };
}

const montadas: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => { act(() => montadas.splice(0).forEach((a) => a.unmount())); });
function textos(no: unknown): string {
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(textos).join(" ");
  return no && typeof no === "object" && "children" in no ? textos((no as { children: unknown }).children) : "";
}

describe("entrada única e localização", () => {
  it("link vira link; texto vira busca; link quebrado avisa", () => {
    expect(lerEntrada("https://www.zapimoveis.com.br/imovel/x")).toMatchObject({ tipo: "link" });
    expect(lerEntrada("www.zapimoveis.com.br/imovel/x")).toMatchObject({ tipo: "link", url: "https://www.zapimoveis.com.br/imovel/x" });
    expect(lerEntrada("Rua da Hora, Espinheiro")).toEqual({ tipo: "busca", texto: "Rua da Hora, Espinheiro" });
    expect(lerEntrada("   ")).toEqual({ tipo: "vazia" });
  });
  it("bairro citado no texto decide onde procurar; sem bairro, o piloto", () => {
    expect(bairrosCitados("rua x, graças")).toContain("gracas");
    expect(bairrosDaBusca("Ed. Qualquer").citados).toBe(false);
    expect(bairrosDaBusca("Ed. Qualquer").bairros).toEqual(expect.arrayContaining(["boa-viagem", "gracas", "madalena"]));
  });
  it("acha o prédio pelo nome e lista o bairro quando o texto é só o bairro", () => {
    const mapa = new Map([["gracas", gracas]] as const);
    expect(buscarNoCadastro(`Edifício ${comNome.nome}`, mapa).map((r) => r.edificio.id)).toContain(comNome.id);
    const soBairro = buscarNoCadastro("Graças", mapa);
    expect(soBairro.length).toBe(8);
    expect(soBairro.every((r) => r.motivo === "bairro")).toBe(true);
  });
  it("a posição do aparelho escolhe as partições e o prédio mais perto (até 250 m)", () => {
    const [lon, lat] = comNome.centro;
    expect(bairrosNoPonto(lon, lat)).toContain("gracas");
    expect(predioMaisPerto(lon + 0.00001, lat, gracas)?.edificio.id).toBe(comNome.id);
    expect(predioMaisPerto(lon + 0.05, lat, gracas)).toBeNull();
    expect(bairrosNoPonto(-35.5, -8.5)).toEqual([]);
  });
});

describe("Raio-X sem anúncio e exemplos", () => {
  it("a análise do prédio é válida, confirmada e com tudo do anúncio desconhecido (null, nunca 0)", () => {
    const a = esquemaAnaliseV2.parse(analise());
    expect(a.vinculo).toMatchObject({ estado: "confirmado", edificioId: comNome.id });
    expect(Object.values(a.declarados).every((d) => d.valor === null)).toBe(true);
    expect(a.id).toBe(idDoRaioX(comNome.id));
    expect(a.url).toBe("");
  });
  it("os três exemplos apontam para prédios do índice ativo", () => {
    expect(EXEMPLOS).toHaveLength(3);
    for (const x of EXEMPLOS) expect(edificioPorId(x.edificioId, x.bairro)).not.toBeNull();
  });
});

describe("triagem", () => {
  it("etapa, nota e filtro (Negociando inclui Escolhido)", () => {
    const a = comEtapa(analise(), "negociando", AGORA);
    expect(a.caderno?.decisao).toBe("negociando");
    expect(passaNoFiltro(a, "negociando")).toBe(true);
    expect(passaNoFiltro(comEtapa(a, "escolhido", AGORA), "negociando")).toBe(true);
    expect(passaNoFiltro(a, "considerando")).toBe(false);
    expect(comNota(a, "   ", AGORA)).toBeNull();
    expect(comNota(a, "ligar para o corretor", AGORA)?.caderno?.diario.at(-1)?.texto).toBe("ligar para o corretor");
  });
});

describe("Ficha Viva", () => {
  const ano = comNome.anoConstrucao!;
  const par = (id: string, condominio: number, area: number) => analise({ id, bairro: "gracas" }, { condominio, area });
  it("mediana e MAD", () => {
    expect(mediana([1, 2, 3, 4])).toBe(2.5);
    expect(mad([1, 2, 3, 4, 100])).toBe(1);
  });
  it("condomínio/m²: menos de 5 pares é 'amostra pequena'; com 5, mediana ± MAD e o desvio", () => {
    const eu = par("eu", 900, 100);
    const quatro = [par("p1", 500, 100), par("p2", 520, 100), par("p3", 480, 100), par("p4", 510, 100)];
    const anoDe = () => ano;
    expect(compararCondominio(eu, ano, [eu, ...quatro], anoDe, 2026)).toMatchObject({ estado: "amostra_pequena", n: 4 });
    const r = compararCondominio(eu, ano, [eu, ...quatro, par("p5", 505, 100)], anoDe, 2026);
    expect(r).toMatchObject({ estado: "ok", n: 5, mediana: 5.05 });
    if (r.estado !== "ok") throw new Error();
    expect(r.acima).toBe(true);
    // Prédio de 25 a 45 anos com condomínio bem abaixo dos pares: sinal de fundo de reserva baixo.
    const barato = par("barato", 200, 100);
    const r2 = compararCondominio(barato, 1990, [barato, ...quatro, par("p5", 505, 100)], () => 1990, 2026);
    expect(r2).toMatchObject({ estado: "ok", abaixoEmPredioMaduro: true });
    expect(compararCondominio(analise(), ano, [], anoDe, 2026)).toEqual({ estado: "sem_valor" });
  });
  it("cinco itens com fonte; desconhecido vira 'Sem leitura' ou 'A confirmar', nunca 0; ITBI por unidade", () => {
    const itens = fichaViva({ analise: analise(), predio: comNome, lista: [], anoDe: () => null, agora: new Date(AGORA), calor: null, relevo: null, rua: null, nomeDoBairro: "Graças" });
    expect(itens.map((i) => i.id)).toEqual(["escala", "estrutura", "itbi", "condominio", "clima"]);
    for (const i of itens) { expect(i.fonte.length).toBeGreaterThan(5); expect(i.valor).not.toMatch(/^0\b|R\$ 0\b/); }
    expect(itens.find((i) => i.id === "clima")!.valor).toBe(SEM_LEITURA);
    expect(itens.find((i) => i.id === "condominio")!.valor).toBe("A confirmar");
    const itbi = itens.find((i) => i.id === "itbi")!;
    if (comNome.itbi?.valorUnidade) expect(itbi.valor).toMatch(/por unidade/);
    expect(itens.map((i) => `${i.valor} ${i.leitura ?? ""} ${i.atencao ?? ""}`).join(" ")).not.toMatch(/\bnota\b|seguro\b|\b\d+\/10\b|estrelas?/i);
  });
  it("linha do tempo: atos do caderno com documento, número e data literais; 'a confirmar' não entra", () => {
    const c: Caderno = { ...cadernoVazio(), documentos: [
      { id: "laudo-1", titulo: "Laudo de inspeção predial", tipo: "laudo", inspecaoEm: "2025-03-10", emitidoEm: "2025-03-20", recebidoEm: AGORA, origem: "Síndico", escopo: "Fachada", trecho: "", pagina: 2, vinculo: "confirmado" },
      { id: "ata-1", titulo: "Vistoria da Defesa Civil", tipo: "outro", inspecaoEm: "2024-01-05", emitidoEm: null, recebidoEm: AGORA, origem: "Vizinho", escopo: "vistoria", trecho: "", pagina: null, vinculo: "a_confirmar" },
    ] };
    const l = estruturaDoCaderno(c);
    expect(l.atos).toHaveLength(1);
    expect(l.descartados).toBe(1);
    const a = analise({ caderno: c });
    let arv!: TestRenderer.ReactTestRenderer;
    act(() => { arv = TestRenderer.create(React.createElement(TemaDoApp, null, React.createElement(LinhaDoTempoEstrutural, { analise: a, aoRegistrar: () => {} }))); });
    montadas.push(arv);
    const t = textos(arv.toJSON());
    expect(t).toContain("10/03/2025 · Laudo de inspeção predial (Síndico, p. 2)");
    expect(t).toContain("Vistoria · sem documento");
    expect(t).toContain("Pergunta para o síndico");
    expect(t).not.toMatch(/condição atual (é|está) /);
  });
});

describe("simulador andar × fachada", () => {
  const vizinhos = gracas;
  it("rosa 3×3 com '?' no meio; relação da fachada com a fonte", () => {
    expect(ROSA.flat().map((c) => c.rotulo)).toEqual(["NO", "N", "NE", "O", "?", "L", "SO", "S", "SE"]);
    expect(relacaoComAFachada(90, 100)).toBe("de_frente");
    expect(relacaoComAFachada(90, 180)).toBe("de_lado");
    expect(relacaoComAFachada(90, 270)).toBe("de_costas");
    expect(relacaoComAFachada(null, 270)).toBe("sem_fachada");
  });
  it("sem dB inventado; recalcula com andar e fachada; casa fica no térreo", () => {
    const leste = simularUnidade({ predio: comNome, vizinhos, tipo: "apartamento", andar: 2, fachadaGraus: 90 });
    const oeste = simularUnidade({ predio: comNome, vizinhos, tipo: "apartamento", andar: 2, fachadaGraus: 270 });
    expect(leste.barulho.decibeis).toContain(SEM_LEITURA);
    expect(JSON.stringify(leste.barulho.fontes)).not.toMatch(/\d+\s*dB/);
    expect(leste.barulho.consequenciaPorFace.length).toBeGreaterThan(15);
    expect(leste.barulho.consequenciaPorFace).not.toMatch(/\d+\s*dB/);
    expect(leste.barulho.fontes.length).toBeLessThanOrEqual(3);
    expect(leste.sol?.fachada).not.toBe(oeste.sol?.fachada);
    const alto = simularUnidade({ predio: comNome, vizinhos, tipo: "apartamento", andar: 10, fachadaGraus: 90 });
    expect(alto.alturaDaJanelaM).toBeGreaterThan(leste.alturaDaJanelaM);
    expect(simularUnidade({ predio: comNome, vizinhos, tipo: "casa", andar: 10, fachadaGraus: 90 }).alturaDaJanelaM).toBeLessThan(2);
    expect(simularUnidade({ predio: comNome, vizinhos, tipo: "apartamento", andar: 2, fachadaGraus: null }).sol).toBeNull();
    expect(leste.vento.superficie3d).toContain(SEM_LEITURA);
  });
});

describe("placar ampliado", () => {
  const comparacao = {
    rotulos: ["Graças", "Torre"] as [string, string],
    custo: { referencia: "preco_anunciado", colunas: [{ principal: 500000, mensalConhecido: null, pendentes: 0 }, { principal: 600000, mensalConhecido: null, pendentes: 0 }] },
    espaco: { areas: [80, 90] },
  } as unknown as Parameters<typeof placarDoPar>[0];
  const extras: ExtrasDoPlacar = {
    compra: true, precos: [500000, 600000], rotina: { destino: "Boa Vista", minutosIda: [20, 35], dias: 20 },
    ambiente: [{ calorC: 38.2, cotaM: 6 }, { calorC: 40.1, cotaM: null }], condominioM2: [9.5, null],
  };
  it("custo total com ITBI em faixa, rotina em h/mês, calor e cota, condomínio sem vencedor", () => {
    const l = placarDoPar(comparacao, [null, null], extras);
    const ids = l.map((x) => x.id);
    expect(ids.indexOf("custo_total")).toBe(ids.indexOf("custo") + 1);
    const total = l.find((x) => x.id === "custo_total")!;
    expect(total.frase).toContain("R$ 510.000 a R$ 515.000");
    expect(total.frase).toContain("escritura e registro a confirmar");
    const rotina = l.find((x) => x.id === "rotina")!;
    expect(rotina.vencedor).toBe(0);
    expect(rotina.frase).toContain("~10,0 h por mês");
    expect(rotina.frase).toContain("volta igual à ida");
    expect(l.find((x) => x.id === "ambiente")!.frase).toContain("cota sem leitura");
    expect(l.find((x) => x.id === "condominio")).toMatchObject({ vencedor: null });
    expect(l.find((x) => x.id === "condominio")!.frase).toContain("a confirmar");
    expect(l.map((x) => x.frase).join(" ")).not.toMatch(/melhor|pior|vale a pena|barat|caro\b|nota\b/i);
  });
  it("sem destino no perfil, sem linha de rotina; sem minutos, 'Sem leitura publicada'", () => {
    expect(placarDoPar(comparacao, [null, null], { ...extras, rotina: null }).some((x) => x.id === "rotina")).toBe(false);
    const semMin = placarDoPar(comparacao, [null, null], { ...extras, rotina: { destino: "Boa Vista", minutosIda: [null, 30], dias: 20 } });
    expect(semMin.find((x) => x.id === "rotina")!.frase).toMatch(/^Sem leitura publicada/);
  });
});

describe("sala de decisão", () => {
  const a = analise({ id: "imovel-a", nome: "Apê nas Graças ção" }, { preco: 500000, area: 80 });
  const b = analise({ id: "imovel-b", nome: "Torre" }, { preco: 450000 });
  it("ida e volta pelo fragmento, com acento; sem caderno nem perfil; desconhecido viaja como null", () => {
    expect(deBase64Url(paraBase64Url("Ação ✓ 😀"))).toBe("Ação ✓ 😀");
    const sala = montarSala([{ ...a, caderno: { ...cadernoVazio(), diario: [{ id: "d-1", em: AGORA, texto: "segredo" }] } }, b], AGORA);
    const f = fragmentoDaSala(sala);
    expect(f).not.toContain("segredo");
    const lido = lerFragmento(`#${f}`);
    expect(lido).toMatchObject({ tipo: "sala" });
    if (lido.tipo !== "sala") throw new Error();
    expect(lido.sala.imoveis[0]!.nome).toBe("Apê nas Graças ção");
    expect(lido.sala.imoveis[1]!.area).toBeNull();
    expect(JSON.stringify(lido.sala)).not.toMatch(/caderno|diario|necessidades|orcamento/);
  });
  it("link alterado ou de fora é recusado", () => {
    const f = fragmentoDaSala(montarSala([a, b], AGORA));
    expect(lerFragmento(f.slice(0, -6)).tipo).toBe("erro");
    expect(lerFragmento("#x=abc").tipo).toBe("erro");
    expect(lerFragmento("").tipo).toBe("vazio");
    expect(() => montarSala([a], AGORA)).toThrow();
  });
  it("a resposta vira linha do diário uma vez só", () => {
    const sala = montarSala([a, b], AGORA);
    const r = { v: 1 as const, sala: sala.sala, autor: "Ana", em: AGORA, respostas: [{ id: "imovel-a", reacao: "duvida" as const, nota: "e o barulho?" }, { id: "imovel-b", reacao: null, nota: "" }] };
    const lido = lerFragmento(fragmentoDaResposta(r));
    expect(lido.tipo).toBe("resposta");
    const novas = importarResposta(r, [a, b], AGORA);
    expect(novas).toHaveLength(1);
    expect(novas[0]!.caderno!.diario.at(-1)!.texto).toBe("Sala de decisão · Ana: Dúvida — e o barulho?");
    expect(importarResposta(r, [novas[0]!, b], AGORA)).toHaveLength(0);
  });
});

describe("leitor de ata (trecho literal + página)", () => {
  const texto = [
    "ATA DA ASSEMBLEIA GERAL EXTRAORDINÁRIA", "Página 1",
    "Foi aprovada chamada extra de R$ 350,00 por unidade, em 10 parcelas, para a pintura da fachada.",
    "Fica proibida a locação por temporada via Airbnb nas unidades.", "Página 2",
    "O síndico informou ação trabalhista movida por ex-funcionário, processo nº 0000123-45.",
  ].join("\n");
  it("cada achado é cópia literal do texto, com a página quando marcada", () => {
    const l = lerAta(texto, "ata");
    for (const a of l.achados) expect(texto).toContain(a.trecho);
    expect(l.achados.find((a) => a.tema === "chamada_extra")).toMatchObject({ secao: "financeiro" });
    expect(l.achados.find((a) => a.tema === "temporada")).toMatchObject({ secao: "regras", pagina: 2 });
    expect(l.achados.find((a) => a.tema === "acoes")?.pagina).toBe(3);
    expect(l.perguntas.join(" ")).toMatch(/não cita fundo de reserva/);
    expect(l.perguntas.join(" ")).toMatch(/chamada extra ou rateio/);
  });
  it("marca no topo da página é cabeçalho: o que vem depois de 'Página 2' é da página 2", () => {
    const l = lerAta("Página 1\nRegras gerais do prédio e da garagem.\nPágina 2\nÉ permitido ter animais de pequeno porte nas unidades.", "convencao");
    expect(l.achados.find((a) => a.tema === "animais")?.pagina).toBe(2);
    expect(l.achados.find((a) => a.tema === "vagas")?.pagina).toBe(1);
  });
  it("quebra de página (\\f) numera as páginas", () => {
    const l = lerAta("Regras gerais do prédio.\fÉ permitido ter animais de pequeno porte nas unidades.", "convencao");
    expect(l.achados.find((a) => a.tema === "animais")?.pagina).toBe(2);
  });
});

describe("negociação com argumentos marcáveis e pacote para especialista", () => {
  const ata = { ...cadernoVazio(), documentos: [{ id: "doc-ata", titulo: "Ata (trechos do leitor)", tipo: "ata" as const, inspecaoEm: null, emitidoEm: null, recebidoEm: AGORA, origem: "Texto colado", escopo: "", trecho: "[Chamada extra / rateio · p. 1] Foi aprovada chamada extra de R$ 350,00 por unidade.", pagina: 1, vinculo: "a_confirmar" as const }] };
  const a = analise({ caderno: ata }, { preco: 900000 });
  const visao = { achados: { principal: null, apoio: [] }, perguntas: [] } as unknown as Parameters<typeof prepararNegociacao>[1];
  it("ata, taxas omitidas, calor e barulho viram argumentos; desmarcado não entra na mensagem", () => {
    const n = prepararNegociacao(a, visao, [a], { predio: comNome, calor: { diferencaBairroC: 1.4 }, barulho: [{ nome: "Via principal (Rua X)", distanciaM: 40 }] });
    const ids = n.argumentos.map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(["ata:0", "taxas:omitidas", "ambiente:calor", "ambiente:barulho"]));
    const tudo = mensagemDeNegociacao(a, n, ids, null);
    expect(tudo).toContain("“Foi aprovada chamada extra de R$ 350,00 por unidade.”");
    const sem = mensagemDeNegociacao(a, n, ids.filter((x) => x !== "ata:0"), null);
    expect(sem).not.toContain("chamada extra de R$ 350");
  });
  it("pacote: seções fixas, HTML escapado e sem perfil da casa", () => {
    const p = montarPacote({ analise: { ...a, nome: "Apê <script>" }, visao, ficha: [], perguntas: [], agora: AGORA });
    expect(p.secoes.map((s) => s.titulo)).toEqual(["Imóvel", "Ficha do edifício", "Anúncio × cadastro municipal", "Linha do tempo da estrutura (documentos guardados)", "Trechos de ata, convenção e balancete (literais)", "Roteiro da visita", "Perguntas jurídicas e técnicas em aberto"]);
    const html = pacoteEmHtml(p);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Modelo v2");
    expect(html).toContain("CNM 16 dígitos");
    const md = pacoteEmMarkdown(p);
    expect(md).toContain("## Trechos de ata");
    expect(md).toContain("Modelo v2");
    expect(md).toContain("nenhum dado enviado a servidor");
    expect(md).not.toMatch(/mobilidade|baixa visão|orçamento mensal/i);
  });
});

describe("nomes da hidrografia em linguagem de tela", () => {
  it("classe vira descrição; nome vira título; nada de 'ALAGADO' como nome", () => {
    expect(nomeHidricoDeTela("ALAGADO")).toBe("Área úmida mapeada");
    expect(nomeHidricoDeTela("RIO CAPIBARIBE")).toBe("Rio Capibaribe");
    expect(nomeHidricoDeTela("BRAÇO MORTO DO RIO CAPIBARIBE")).toBe("Braço Morto do Rio Capibaribe");
    expect(nomeHidricoDeTela("CANAL VASCO DA GAMA_SUBTERRANEO")).toBe("Canal Vasco da Gama (trecho subterrâneo)");
  });
});

describe("atrito (CNEFE 2022) e medidor", () => {
  it("a camada por prédio só tem números: nunca nome ou complemento", () => {
    const arquivos = Object.keys(CAMADAS_PUBLICADAS).filter((c) => c.startsWith("recife/atrito/"));
    expect(arquivos.length).toBeGreaterThan(60);
    for (const c of arquivos.slice(0, 10)) {
      const d = JSON.parse(readFileSync(join(__dirname, "..", "src", "dados", c), "utf8")) as { predios: Record<string, Record<string, unknown[]>> };
      for (const p of Object.values(d.predios)) for (const v of Object.values(p)) expect(v.every((x) => typeof x === "number")).toBe(true);
    }
  });
  it("fatos: atrito antes da conveniência; retrato de 2022 com aviso; direção por extenso", () => {
    const p = gracas.find((e) => atritoDoPredio("gracas", e.id)?.n)!;
    const f = fatosDeAtrito("gracas", p.id);
    const grupos = f.map((x) => x.grupo);
    expect(grupos.indexOf("conveniencia") === -1 || grupos.lastIndexOf("atrito") < grupos.indexOf("conveniencia")).toBe(true);
    for (const x of f) expect(x.detalhe).toContain("Censo 2022");
    expect(direcaoDoRumo(135)).toBe("sudeste");
    expect(fatosDeAtrito("gracas", "inexistente")).toEqual([]);
  });
  it("o microfone só compara aberta × fechada", () => {
    expect(nivelRelativoDb(0, 100)).toBeNull();
    expect(nivelRelativoDb(1, 1)).toBe(0);
    expect(fraseDaDiferenca(-20, -28)).toBe("Fechar a janela baixou ~8 dB relativos.");
    expect(fraseDaDiferenca(-20, -21)).toMatch(/parecido/);
  });
});

describe("por perto no mapa, rotina personalizada, comodidades e HTML editorial", () => {
  it("pontosDoEntornoNoMapa encontra praças próximas no cadastro ambiental e montarCenaComPontosExtras enquadra perto vs foraDoQuadro", () => {
    const pontos = pontosDoEntornoNoMapa(comNome.centro);
    expect(Array.isArray(pontos)).toBe(true);
    const extras = [
      ...pontos,
      {
        id: "r-perto",
        categoria: "rotina" as const,
        rotulo: "Academia perto",
        detalhe: "Rua das Graças",
        coordenada: [comNome.centro[0] + 0.002, comNome.centro[1] - 0.001] as [number, number],
        distanciaM: 250,
      },
      {
        id: "r-longe",
        categoria: "rotina" as const,
        rotulo: "Trabalho distante",
        detalhe: "Boa Viagem",
        coordenada: [comNome.centro[0] + 0.02, comNome.centro[1] - 0.05] as [number, number],
        distanciaM: 5800,
      },
    ];
    const resultado = montarCenaComPontosExtras(comNome, [], gracas, 360, 280, extras);
    expect(resultado.pontos.some((p) => p.id === "r-perto")).toBe(true);
    expect(resultado.foraDoQuadro.some((p) => p.id === "r-longe" && /^[NSLOE]{1,2}$/.test(p.direcao))).toBe(true);
  });

  it("esquemaPerfilDomicilio mantém compatibilidade retroativa com locaisRotina=[] e valida lugares salvos", () => {
    const legado = esquemaPerfilDomicilio.parse({});
    expect(legado.locaisRotina).toEqual([]);
    const comLugar = esquemaPerfilDomicilio.parse({
      locaisRotina: [
        { id: "lr-1", nome: "Trabalho", detalhe: "Bairro do Recife", tipo: "rotina", bairroSlug: "recife", coordenada: [-34.872, -8.063] },
      ],
    });
    expect(comLugar.locaisRotina).toHaveLength(1);
    expect(comLugar.locaisRotina[0]?.nome).toBe("Trabalho");
  });

  it("extrairDoTexto extrai comodidades do prédio quando citadas no anúncio e pacoteEmHtml usa identidade VEREDA", () => {
    const leituras = extrairDoTexto("Apartamento 85 m², 3 quartos, piscina, elevador e portaria 24h.", "outro");
    const comodidades = leituras.flatMap((l) => l.campos.comodidades);
    expect(comodidades).toEqual(expect.arrayContaining(["piscina", "elevador", "portaria-24h"]));

    const visaoMinima = { achados: { principal: null, apoio: [] } } as unknown as Parameters<typeof prepararNegociacao>[1];
    const pacote = montarPacote({ analise: analise(), visao: visaoMinima, ficha: [], perguntas: [], agora: AGORA });
    const html = pacoteEmHtml(pacote);
    expect(html).toContain("#F2EBDD");
    expect(html).toContain("VEREDA · Dossiê Técnico");
  });

  it("tocar na foto do anúncio em TopoDoDossie abre visualizador limpo em tela cheia só com a foto", () => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(TopoDoDossie, {
            predio: comNome,
            salva: false,
            aoVoltar: jest.fn(),
            aoAlternarSalvo: jest.fn(),
            aoAbrirMapa: null,
            fotos: ["https://exemplo.com/foto1.jpg", "https://exemplo.com/foto2.jpg"],
          }),
        ),
      );
    });
    const containerComLayout = arvore.root.findAllByType(View).find((v) => typeof v.props.onLayout === "function")!;
    act(() => {
      containerComLayout.props.onLayout({ nativeEvent: { layout: { width: 420 } } });
    });
    const modalInicial = arvore.root.findByType(Modal);
    expect(modalInicial.props.visible).toBe(false);

    const ampliarBtn = arvore.root.findAllByType(Pressionavel).find((p) => String(p.props.accessibilityLabel ?? "").startsWith("Ampliar foto"))!;
    act(() => {
      ampliarBtn.props.onPress();
    });

    const modalAberto = arvore.root.findByType(Modal);
    expect(modalAberto.props.visible).toBe(true);
    const imgTelaCheia = modalAberto.findByType(Image);
    expect(imgTelaCheia.props.source).toEqual({ uri: "https://exemplo.com/foto1.jpg" });
    expect(imgTelaCheia.props.resizeMode).toBe("contain");

    const fecharBtn = arvore.root.findAllByType(Pressionavel).find((p) => p.props.accessibilityLabel === "Fechar foto")!;
    act(() => {
      fecharBtn.props.onPress();
    });
    expect(arvore.root.findByType(Modal).props.visible).toBe(false);
    act(() => {
      arvore.unmount();
    });
  });

  it("SimuladorDaUnidade renderiza painel único hairline em volta dos 3 tópicos (S45)", () => {
    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(SimuladorDaUnidade, {
            predio: comNome,
            vizinhos: gracas,
            tipologia: "apartamento",
            andarDoAnuncio: 4,
            orientacaoGraus: 90,
          }),
        ),
      );
    });
    expect(arvore.root.find((n) => n.props.testID === "simulador-painel-unificado")).toBeDefined();
    act(() => {
      arvore.unmount();
    });
  });

  it("PacoteParaEspecialista oferece cópia direta em Markdown no celular/web sem comAlfa (S57)", async () => {
    const pacoteSrc = readFileSync(join(__dirname, "..", "src", "componentes", "dossie-v1", "Pacote.tsx"), "utf8");
    expect(pacoteSrc).not.toMatch(/\bcomAlfa\b/);

    const visaoMinima = {
      achados: { principal: null, apoio: [] },
      perguntas: [],
    } as unknown as Parameters<typeof PacoteParaEspecialista>[0]["visao"];

    let arvore!: TestRenderer.ReactTestRenderer;
    act(() => {
      arvore = TestRenderer.create(
        React.createElement(
          TemaDoApp,
          null,
          React.createElement(PacoteParaEspecialista, {
            analise: analise(),
            visao: visaoMinima,
            ficha: [],
          }),
        ),
      );
    });

    const jsonInicial = JSON.stringify(arvore.toJSON());
    expect(jsonInicial).toContain("Copiar texto (.md)");

    const botaoCopiar = arvore.root
      .findAllByType(Pressionavel)
      .find((n) => n.findAll((sub) => sub.children.includes("Copiar texto (.md)")).length > 0);
    expect(botaoCopiar).toBeDefined();

    await act(async () => {
      await botaoCopiar!.props.onPress?.();
    });

    const jsonAposCopiar = JSON.stringify(arvore.toJSON());
    expect(jsonAposCopiar).toContain("Dossiê técnico (.md) copiado para colar ou enviar.");
    expect(jsonAposCopiar).toContain('"role":"status"');

    act(() => {
      arvore.unmount();
    });
  });
});

// Garante que o tipo Edificio usado acima é o do índice (sem dado inventado).
const _tipo: Edificio = comNome;
void _tipo;
