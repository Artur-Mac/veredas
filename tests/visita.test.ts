// Testes da aba Visita (Fatia 5): a lógica pura (orientação, cronômetro, perguntas próprias, roteiro, resumo) e a tela
// inteira montada sobre o provedor de análises de verdade, com o armazenamento simulado. Toda análise daqui é
// SINTÉTICA, montada no próprio teste; o único dado do índice é o primeiro edifício de Casa Forte, lido em tempo de teste.
/* eslint-disable @typescript-eslint/no-require-imports -- as fábricas de jest.mock só podem usar require */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React from "react";
import { Linking, StyleSheet } from "react-native";
import TestRenderer, { act, type ReactTestInstance } from "react-test-renderer";
import { adicionarPropria, alternarVerificada, definirResposta, duracaoPorExtenso, enderecoDoImovel, formatarCronometro, idDaPropria, limitarGraus, orientacaoDaJanela, perguntasDaVisita, resumirVisita, segundosDoRelogio, subtituloDoImovel, urlDoWhatsapp } from "../src/componentes/visita-v1/logica";
import TelaVisita from "../src/app/(abas)/visita";
import { Pressionavel } from "../src/componentes/Pressionavel";
import { AVISO_DE_FALHA_AO_SALVAR } from "../src/componentes/visita-v1/useVisita";
import {
  CHAVE_ANALISES_V2,
  esquemaAnaliseV2,
  esquemaVisita,
  type AnaliseV2,
  type Pergunta,
  type Visita,
} from "../src/dados/contratos";
import { derivarDossie } from "../src/dados/dossie/derivar";
import { entradaDaRua } from "../src/componentes/dossie-v1/cadastro";
import { formatarEndereco } from "../src/dados/recife/endereco";
import { mensagemParaCorretor } from "../src/dados/mensagem";
import { contextoDoBairro, edificiosDoBairro, indiceDoBairro } from "../src/dados/recife/indice";
import { AnalisesNoAparelho } from "../src/estado/Analises";
import { TemaDoApp } from "../src/tema/Tema";

// ——— Simulações ——————————————————————————————————————————————————————————————————

jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn(async () => true), getStringAsync: jest.fn(async () => "") }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
// O aviso de verdade anima a opacidade com um atraso de 2,6 s que sobrevive ao teste. Aqui ele vira um texto na árvore,
// o que basta para conferir o que a tela mandou avisar.
jest.mock("../src/componentes/casca/Aviso", () => {
  const react = require("react") as typeof import("react");
  const { Text } = require("react-native") as typeof import("react-native");
  const Contexto = react.createContext<{ mostrarAviso: (mensagem: string) => void }>({ mostrarAviso: () => undefined });
  return {
    ProvedorDeAviso: ({ children }: { children: React.ReactNode }) => {
      const [mensagem, definirMensagem] = react.useState("");
      return react.createElement(
        Contexto.Provider,
        { value: { mostrarAviso: definirMensagem } },
        children,
        mensagem ? react.createElement(Text, null, mensagem) : null,
      );
    },
    useAviso: () => react.useContext(Contexto),
  };
});
jest.mock("expo-router", () => {
  const react = require("react") as typeof import("react");
  return {
    router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => false) },
    // A aba está em foco enquanto montada; sair do foco é simulado desmontando a árvore.
    useFocusEffect: (efeito: () => void | (() => void)) => react.useEffect(efeito, [efeito]),
  };
});

const INSTANTE = "2026-10-20T12:00:00.000Z";
const v = (valor: number | null) => ({ valor, origem: "texto" as const, aConfirmar: false });

const VISITA_VAZIA: Visita = {
  verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null,
};

function analise(mudancas: Partial<AnaliseV2> = {}): AnaliseV2 {
  return esquemaAnaliseV2.parse({
    versao: 2, id: "visita-a", criadaEm: INSTANTE, atualizadaEm: INSTANTE,
    nome: "Apartamento sintético de 3 quartos", modalidade: "aluguel", tipologia: "apartamento",
    url: "https://anuncio.invalid/sintetico-1", bairroTexto: "Casa Forte", bairro: "casa-forte",
    logradouro: null, numero: null, nomeEdificio: null, extracao: null,
    declarados: {
      preco: v(4500), condominio: v(1190), iptu: { ...v(288), periodo: "mes" as const }, seguroIncendio: v(42), taxaServico: v(null),
      outros: v(null), area: v(98), quartos: v(3), suites: v(null), banheiros: v(null), vagas: v(null), andar: v(null),
    },
    vinculo: { estado: "pendente" },
    visita: VISITA_VAZIA,
    salva: true, descarte: null,
    ...mudancas,
  });
}

const pergunta = (id: string, titulo = `Título de ${id}`): Pergunta => ({
  id, titulo, pista: "Pista", textoParaMensagem: `Texto de ${id}?`, origem: "padrao", prioridade: "conforto",
});

// ——— Lógica pura ————————————————————————————————————————————————————————————————————

describe("orientação da janela", () => {
  const casos: [number, string][] = [
    [0, "N"], [22, "N"], [23, "NE"], [45, "NE"], [67, "NE"], [68, "L"], [90, "L"], [98, "L"], [112, "L"], [113, "SE"],
    [135, "SE"], [157, "SE"], [158, "S"], [180, "S"], [202, "S"], [203, "SO"], [225, "SO"], [247, "SO"], [248, "O"],
    [270, "O"], [292, "O"], [293, "NO"], [315, "NO"], [337, "NO"], [338, "N"], [359, "N"],
  ];
  it.each(casos)("%i° é %s", (graus, rotulo) => {
    expect(orientacaoDaJanela(graus).rotulo).toBe(rotulo);
  });

  it("os oito rótulos existem, cada um com seu nome", () => {
    const nomes = [0, 45, 90, 135, 180, 225, 270, 315].map((g) => orientacaoDaJanela(g));
    expect(nomes.map((o) => o.rotulo)).toEqual(["N", "NE", "L", "SE", "S", "SO", "O", "NO"]);
    expect(nomes.map((o) => o.nome)).toEqual(["Norte", "Nordeste", "Leste", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"]);
  });

  it("limita ao contrato (inteiro de 0 a 359) e cabe no esquema da visita", () => {
    expect(limitarGraus(-3)).toBe(0);
    expect(limitarGraus(400)).toBe(359);
    expect(limitarGraus(12.6)).toBe(13);
    expect(esquemaVisita.safeParse({ ...VISITA_VAZIA, orientacaoGraus: limitarGraus(1234) }).success).toBe(true);
  });
});

describe("cronômetro", () => {
  it("formata minutos e segundos; passando de uma hora, mostra a hora", () => {
    expect(formatarCronometro(0)).toBe("00:00");
    expect(formatarCronometro(65)).toBe("01:05");
    expect(formatarCronometro(3599)).toBe("59:59");
    expect(formatarCronometro(3600)).toBe("1:00:00");
    expect(formatarCronometro(3725)).toBe("1:02:05");
  });

  it("a duração por extenso", () => {
    expect(duracaoPorExtenso(45)).toBe("45 s");
    expect(duracaoPorExtenso(750)).toBe("12 min 30 s");
    expect(duracaoPorExtenso(1200)).toBe("20 min");
    expect(duracaoPorExtenso(3900)).toBe("1 h 05 min");
  });

  it("soma o que já estava gravado ao tempo corrido desde o início", () => {
    expect(segundosDoRelogio({ inicio: 10_000, base: 100 }, 75_500)).toBe(165);
    expect(segundosDoRelogio({ inicio: 10_000, base: 100 }, 5_000)).toBe(100);
    expect(segundosDoRelogio({ inicio: 0, base: 604_000 }, 9_999_999_999)).toBe(604_800);
  });
});

describe("perguntas próprias", () => {
  it("o id é propria-<slug curto>, sem acento, e cabe no esquema", () => {
    expect(idDaPropria("Posso carregar um carro elétrico na garagem?", [])).toBe("propria-posso-carregar-um-carro");
    expect(idDaPropria("???", [])).toBe("propria-pergunta");
    const v2 = adicionarPropria(VISITA_VAZIA, "Há vaga para visitantes?");
    expect(v2).not.toBeNull();
    expect(esquemaVisita.safeParse(v2).success).toBe(true);
    expect(v2?.perguntasProprias[0]).toEqual({ id: "propria-ha-vaga-para-visitantes", texto: "Há vaga para visitantes?" });
  });

  it("textos que dão o mesmo slug ganham sufixo, sem repetir id", () => {
    let atual: Visita = VISITA_VAZIA;
    for (let i = 0; i < 3; i++) atual = adicionarPropria(atual, "Tem elevador de serviço?") ?? atual;
    expect(atual.perguntasProprias.map((p) => p.id)).toEqual([
      "propria-tem-elevador-de-servico",
      "propria-tem-elevador-de-servico-2",
      "propria-tem-elevador-de-servico-3",
    ]);
    expect(esquemaVisita.safeParse(atual).success).toBe(true);
  });

  it("recusa texto vazio, texto de mais de 240 caracteres e a 31ª pergunta", () => {
    expect(adicionarPropria(VISITA_VAZIA, "   ")).toBeNull();
    expect(adicionarPropria(VISITA_VAZIA, "a".repeat(241))).toBeNull();
    expect(adicionarPropria(VISITA_VAZIA, "a".repeat(240))).not.toBeNull();
    let cheia: Visita = VISITA_VAZIA;
    for (let i = 0; i < 30; i++) cheia = adicionarPropria(cheia, `Pergunta número ${i} sobre o prédio`) ?? cheia;
    expect(cheia.perguntasProprias).toHaveLength(30);
    expect(adicionarPropria(cheia, "Mais uma pergunta")).toBeNull();
    expect(esquemaVisita.safeParse(cheia).success).toBe(true);
  });
});

describe("conferir e responder", () => {
  it("alterna a conferência de uma pergunta", () => {
    const marcada = alternarVerificada(VISITA_VAZIA, "padrao-agua");
    expect(marcada.verificadas).toEqual(["padrao-agua"]);
    expect(alternarVerificada(marcada, "padrao-agua").verificadas).toEqual([]);
  });

  it("guarda a resposta aparada e a conferência numa gravação só; resposta vazia apaga", () => {
    const v1 = definirResposta(VISITA_VAZIA, "padrao-agua", "  Boa pressão  ", true);
    expect(v1.respostas).toEqual({ "padrao-agua": "Boa pressão" });
    expect(v1.verificadas).toEqual(["padrao-agua"]);
    const v2 = definirResposta(v1, "padrao-agua", "   ", false);
    expect(v2.respostas).toEqual({});
    expect(v2.verificadas).toEqual([]);
    expect(esquemaVisita.safeParse(v1).success).toBe(true);
  });

  it("corta a resposta em 1000 caracteres, o limite do contrato", () => {
    const v1 = definirResposta(VISITA_VAZIA, "padrao-agua", "x".repeat(1500), false);
    expect(v1.respostas["padrao-agua"]).toHaveLength(1000);
    expect(esquemaVisita.safeParse(v1).success).toBe(true);
  });
});

describe("WhatsApp", () => {
  it("abre sem destinatário, com o texto codificado", () => {
    const texto = "Olá! Vi o anúncio X (https://a.invalid/1?x=2&y=3).\n1. Qual é o IPTU?";
    expect(urlDoWhatsapp(texto)).toBe(`https://wa.me/?text=${encodeURIComponent(texto)}`);
    expect(urlDoWhatsapp(texto)).not.toMatch(/wa\.me\/\d/);
  });
});

describe("roteiro de perguntas: a mesma montagem do dossiê", () => {
  const agora = new Date(INSTANTE);
  const primeiro = edificiosDoBairro("casa-forte")[0];
  if (!primeiro) throw new Error("Índice de Casa Forte vazio");

  const confirmada = (): AnaliseV2["vinculo"] => ({
    estado: "confirmado", edificioId: primeiro.id, dsqfl: primeiro.dsqfl, confirmadoEm: INSTANTE, indiceGeradoEm: "teste",
  });

  it("sem vínculo confirmado, a pergunta de endereço vem primeiro e não há dados de edifício", () => {
    const perguntas = perguntasDaVisita(analise(), [], agora);
    expect(perguntas[0]?.id).toBe("lacuna-endereco");
    expect(perguntas.map((p) => p.id)).toEqual(derivarDossie(analise(), null, contextoDoBairro("casa-forte"), indiceDoBairro("casa-forte").obras, [], agora).perguntas.map((p) => p.id));
  });

  it("com vínculo confirmado, usa o edifício do índice e a pergunta de endereço some", () => {
    const a = analise({ vinculo: confirmada() });
    const perguntas = perguntasDaVisita(a, [], agora);
    expect(perguntas.some((p) => p.id === "lacuna-endereco")).toBe(false);
    // v1.1: a Visita monta como o dossiê, com a camada "A rua" do índice (e as perguntas da rua).
    const dossie = derivarDossie(a, primeiro, contextoDoBairro("casa-forte"), indiceDoBairro("casa-forte").obras, [], agora, null, entradaDaRua(indiceDoBairro("casa-forte")));
    expect(perguntas).toEqual(dossie.perguntas);
    expect(perguntas.some((p) => p.id.startsWith("rua-"))).toBe(true);
  });

  it("vínculo para um edifício que não está no índice não derruba a tela nem inventa dado", () => {
    const a = analise({ vinculo: { estado: "confirmado", edificioId: "0-0", dsqfl: null, confirmadoEm: INSTANTE, indiceGeradoEm: "teste" } });
    const perguntas = perguntasDaVisita(a, [], agora);
    expect(perguntas.length).toBeGreaterThan(0);
  });

  it("bairro fora da cobertura: só as perguntas que dispensam o índice", () => {
    const fora = analise({ bairro: "cabanga", bairroTexto: "Cabanga", vinculo: { estado: "fora_de_cobertura" } });
    const ids = perguntasDaVisita(fora, [], agora).map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(["padrao-documentos", "padrao-agua", "padrao-ruido", "padrao-sol"]));
    expect(ids).not.toContain("lacuna-endereco");
  });

  it("as perguntas próprias vêm no fim, com o id gravado", () => {
    const v1 = adicionarPropria(VISITA_VAZIA, "Há vaga para visitantes?");
    const perguntas = perguntasDaVisita(analise({ visita: v1 ?? VISITA_VAZIA }), [], agora);
    expect(perguntas[perguntas.length - 1]).toMatchObject({ id: "propria-ha-vaga-para-visitantes", origem: "propria" });
  });

  it("a mensagem ao corretor leva as perguntas ainda não conferidas", () => {
    const a = analise();
    const perguntas = perguntasDaVisita(a, [], agora);
    const conferida = perguntas.find((p) => p.id === "padrao-agua");
    expect(conferida).toBeDefined();
    const texto = mensagemParaCorretor({ ...a, visita: alternarVerificada(a.visita, "padrao-agua") }, perguntas);
    expect(texto).toContain("Antes de visitar, pode me confirmar:");
    expect(texto).not.toContain(conferida?.textoParaMensagem ?? "?");
  });
});

describe("resumo da visita", () => {
  const perguntas = [pergunta("a", "Pergunta A"), pergunta("b", "Pergunta B"), pergunta("c", "Pergunta C")];

  it("conta o que foi conferido, junta as respostas e traduz ruído e orientação", () => {
    const visita: Visita = {
      ...VISITA_VAZIA, verificadas: ["a", "c"], respostas: { a: "Resposta A", b: "  " }, ruido: "moderado", orientacaoGraus: 98,
      notas: " Gostei da luz ", segundos: 750, concluidaEm: INSTANTE,
    };
    const resumo = resumirVisita(visita, perguntas);
    expect(resumo.total).toBe(3);
    expect(resumo.conferidas.map((p) => p.id)).toEqual(["a", "c"]);
    expect(resumo.pendentes.map((p) => p.id)).toEqual(["b"]);
    expect(resumo.respostas).toEqual([{ id: "a", titulo: "Pergunta A", texto: "Resposta A" }]);
    expect(resumo.ruido).toBe("Moderado");
    expect(resumo.orientacao).toMatchObject({ rotulo: "L", nome: "Leste", graus: 98 });
    expect(resumo.notas).toBe("Gostei da luz");
    expect(resumo.segundos).toBe(750);
  });

  it("ruído e orientação não informados continuam desconhecidos, nunca zero", () => {
    const resumo = resumirVisita(VISITA_VAZIA, perguntas);
    expect(resumo.ruido).toBeNull();
    expect(resumo.orientacao).toBeNull();
  });

  it("a resposta de uma pergunta que saiu do roteiro não some", () => {
    const resumo = resumirVisita({ ...VISITA_VAZIA, respostas: { antiga: "Anotei isto antes" } }, perguntas);
    expect(resumo.respostas).toEqual([{ id: "antiga", titulo: "Pergunta que saiu do roteiro", texto: "Anotei isto antes" }]);
  });

  it("o subtítulo do imóvel só traz o que se sabe", () => {
    expect(subtituloDoImovel(analise())).toBe("Casa Forte · 98 m² · 3 quartos");
    const semMedidas = analise({ declarados: { ...analise().declarados, area: v(null), quartos: v(null) } });
    expect(subtituloDoImovel(semMedidas)).toBe("Casa Forte");
  });
});

// ——— A tela, sobre o provedor de verdade ——————————————————————————————————————————————

const armazenamento = AsyncStorage as unknown as { clear: () => Promise<void>; setItem: (k: string, v: string) => Promise<void>; getItem: (k: string) => Promise<string | null> };
const setStringAsync = Clipboard.setStringAsync as unknown as jest.Mock;
const empurrar = router.push as unknown as jest.Mock;

/** Deixa as promessas do provedor (leitura, fila de gravação) terminarem. */
async function esvaziar() {
  await act(async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
  });
}

const montadas: TestRenderer.ReactTestRenderer[] = [];

async function montar(analises: AnaliseV2[], ativa: string | null = analises[0]?.id ?? null) {
  await armazenamento.setItem(CHAVE_ANALISES_V2, JSON.stringify(analises));
  if (ativa) await armazenamento.setItem("vereda-ativa-v1", ativa);
  let arvore!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    arvore = TestRenderer.create(
      React.createElement(TemaDoApp, null, React.createElement(AnalisesNoAparelho, null, React.createElement(TelaVisita))),
    );
  });
  await esvaziar();
  montadas.push(arvore);
  return arvore;
}

async function gravadas(): Promise<AnaliseV2[]> {
  const bruto = await armazenamento.getItem(CHAVE_ANALISES_V2);
  return (JSON.parse(bruto ?? "[]") as unknown[]).map((x) => esquemaAnaliseV2.parse(x));
}

function textoDe(no: ReactTestInstance | string): string {
  if (typeof no === "string") return no;
  return no.children.map((c) => textoDe(c)).join("");
}
const todoOTexto = (arvore: TestRenderer.ReactTestRenderer) => textoDe(arvore.root);
const podeTocar = (i: ReactTestInstance) => typeof i.props.onPress === "function";

/** Os estilos de cada `Text` de verdade (host) cujo texto é exatamente `texto`, já achatados. */
function estilosDoTexto(arvore: TestRenderer.ReactTestRenderer, texto: string) {
  return arvore.root
    .findAll((n) => (n.type as unknown) === "Text" && textoDe(n) === texto)
    .map((n) => StyleSheet.flatten(n.props.style as object) as { fontFamily?: string; fontWeight?: string });
}

function achar(arvore: TestRenderer.ReactTestRenderer, criterio: (i: ReactTestInstance) => boolean): ReactTestInstance {
  const achados = arvore.root.findAll(criterio);
  const primeiro = achados[0];
  if (!primeiro) throw new Error("Elemento não encontrado");
  return primeiro;
}
const porRotulo = (rotulo: string) => (i: ReactTestInstance) => podeTocar(i) && i.props.accessibilityLabel === rotulo;
const porTexto = (texto: string) => (i: ReactTestInstance) => podeTocar(i) && textoDe(i) === texto;

async function tocar(arvore: TestRenderer.ReactTestRenderer, criterio: (i: ReactTestInstance) => boolean) {
  const alvo = achar(arvore, criterio);
  await act(async () => {
    (alvo.props.onPress as () => void)();
  });
  await esvaziar();
}

async function digitar(arvore: TestRenderer.ReactTestRenderer, rotulo: string, texto: string) {
  const campo = achar(arvore, (i) => typeof i.props.onChangeText === "function" && i.props.accessibilityLabel === rotulo);
  await act(async () => {
    (campo.props.onChangeText as (t: string) => void)(texto);
  });
}

describe("a tela Visita", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await armazenamento.clear();
  });
  afterEach(async () => {
    // Desmonta o que ficou montado: os relógios da tela não podem sobreviver ao teste.
    await act(async () => {
      for (const arvore of montadas.splice(0)) {
        try {
          arvore.unmount();
        } catch {
          // já desmontada pelo próprio teste
        }
      }
    });
    jest.useRealTimers();
  });

  it("sem análise, mostra o estado vazio e leva a Explorar", async () => {
    const arvore = await montar([], null);
    expect(todoOTexto(arvore)).toContain("Nenhum dossiê aberto. Cole um link em Explorar.");
    await tocar(arvore, porTexto("Ir para Explorar"));
    expect(empurrar).toHaveBeenCalledWith("/");
  });

  it("com análise ativa, mostra Preparar: contagem, as três primeiras numeradas, roteiro e mensagem", async () => {
    const a = analise();
    const arvore = await montar([a]);
    const texto = todoOTexto(arvore);
    const esperadas = perguntasDaVisita(a, [a], new Date());
    expect(texto).toContain("Prepare sua visita.");
    expect(texto).toContain("Sua próxima visita");
    expect(texto).toContain(String(esperadas.length));
    expect(texto).toContain("pontos para conferir");
    expect(texto).toContain("01");
    expect(texto).toContain("03");
    expect(texto).not.toContain("04");
    expect(texto).toContain("Ver roteiro completo");
    expect(texto).toContain("Adicionar pergunta");
    expect(texto).toContain("Antes de marcar");
    expect(texto).toContain("Preparar mensagem");
    expect(texto).toContain("Começar visita");
    expect(texto).toContain("Casa Forte · 98 m² · 3 quartos");
  });

  it("a mensagem: texto editável, Copiar com aviso e WhatsApp sem destinatário", async () => {
    const a = analise();
    const arvore = await montar([a]);
    await tocar(arvore, porTexto("Preparar mensagem"));
    expect(todoOTexto(arvore)).toContain("Converse com o corretor");

    const sugerida = mensagemParaCorretor(a, perguntasDaVisita(a, [a], new Date()));
    const campo = achar(arvore, (i) => typeof i.props.onChangeText === "function" && i.props.accessibilityLabel === "Mensagem para agendar");
    expect(campo.props.value).toBe(sugerida);
    expect(sugerida.endsWith("\n\nMensagem preparada com o VEREDA.")).toBe(true);
    expect(sugerida.startsWith("Olá! Vi o anúncio Apartamento sintético de 3 quartos (https://anuncio.invalid/sintetico-1).")).toBe(true);

    await tocar(arvore, porTexto("Copiar mensagem"));
    expect(setStringAsync).toHaveBeenCalledWith(sugerida);
    expect(todoOTexto(arvore)).toContain("Mensagem copiada");

    const abrir = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await digitar(arvore, "Mensagem para agendar", "Texto editado pela pessoa");
    await tocar(arvore, porTexto("Copiar mensagem"));
    expect(setStringAsync).toHaveBeenLastCalledWith("Texto editado pela pessoa");
    await tocar(arvore, porTexto("Abrir no WhatsApp"));
    expect(abrir).toHaveBeenCalledWith(`https://wa.me/?text=${encodeURIComponent("Texto editado pela pessoa")}`);
    expect(todoOTexto(arvore)).toContain("Nada é enviado pelo Vereda");
    await tocar(arvore, porTexto("Voltar ao texto sugerido"));
    expect(achar(arvore, (i) => i.props.accessibilityLabel === "Mensagem para agendar").props.value).toBe(sugerida);
    // Nada foi gravado na análise por causa da mensagem.
    expect((await gravadas())[0]?.visita).toEqual(VISITA_VAZIA);
  });

  it("'Começar visita' abre No imóvel; conferir uma pergunta grava em verificadas com atualizadaEm novo", async () => {
    const a = analise();
    const arvore = await montar([a]);
    await tocar(arvore, porTexto("Começar visita"));
    expect(todoOTexto(arvore)).toContain("Olhe de perto.");
    const primeira = perguntasDaVisita(a, [a], new Date())[0];
    if (!primeira) throw new Error("sem perguntas");

    await tocar(arvore, porRotulo(`Conferida: ${primeira.titulo}`));
    const [gravada] = await gravadas();
    expect(gravada?.visita.verificadas).toEqual([primeira.id]);
    expect(Date.parse(gravada?.atualizadaEm ?? "")).toBeGreaterThan(Date.parse(INSTANTE));
    expect(todoOTexto(arvore)).toContain(`1 de ${perguntasDaVisita(a, [a], new Date()).length}`);

    // Tocar de novo desmarca.
    await tocar(arvore, porRotulo(`Conferida: ${primeira.titulo}`));
    expect((await gravadas())[0]?.visita.verificadas).toEqual([]);
  });

  it("duas conferências seguidas, sem esperar a gravação, não se atropelam", async () => {
    const a = analise();
    const arvore = await montar([a]);
    await tocar(arvore, porTexto("Começar visita"));
    const [p1, p2] = perguntasDaVisita(a, [a], new Date());
    if (!p1 || !p2) throw new Error("perguntas insuficientes");
    const um = achar(arvore, porRotulo(`Conferida: ${p1.titulo}`));
    const dois = achar(arvore, porRotulo(`Conferida: ${p2.titulo}`));
    await act(async () => {
      (um.props.onPress as () => void)();
      (dois.props.onPress as () => void)();
    });
    await esvaziar();
    expect((await gravadas())[0]?.visita.verificadas).toEqual([p1.id, p2.id]);
  });

  it("responder: a gaveta grava a resposta e a conferência", async () => {
    const a = analise();
    const arvore = await montar([a]);
    const primeira = perguntasDaVisita(a, [a], new Date())[0];
    if (!primeira) throw new Error("sem perguntas");
    await tocar(arvore, (i) => podeTocar(i) && typeof i.props.accessibilityLabel === "string" && i.props.accessibilityLabel.startsWith(primeira.titulo));
    expect(todoOTexto(arvore)).toContain("O que você descobriu?");
    await digitar(arvore, "O que você descobriu?", "  Rua nº 12, bloco B  ");
    await tocar(arvore, (i) => podeTocar(i) && i.props.accessibilityLabel === "Pergunta conferida");
    await tocar(arvore, porTexto("Salvar resposta"));
    const [gravada] = await gravadas();
    expect(gravada?.visita.respostas[primeira.id]).toBe("Rua nº 12, bloco B");
    expect(gravada?.visita.verificadas).toContain(primeira.id);
    expect(todoOTexto(arvore)).toContain("Resposta salva");
  });

  it("adicionar pergunta grava em perguntasProprias com id propria-<slug> e a pergunta entra no roteiro", async () => {
    const a = analise();
    const arvore = await montar([a]);
    await tocar(arvore, porTexto("Adicionar pergunta"));
    await tocar(arvore, porTexto("Adicionar ao roteiro"));
    expect(todoOTexto(arvore)).toContain("Escreva sua pergunta.");
    await digitar(arvore, "Sua pergunta", "Posso carregar um carro elétrico?");
    await tocar(arvore, porTexto("Adicionar ao roteiro"));
    const [gravada] = await gravadas();
    expect(gravada?.visita.perguntasProprias).toEqual([{ id: "propria-posso-carregar-um-carro", texto: "Posso carregar um carro elétrico?" }]);
    expect(todoOTexto(arvore)).toContain("Pergunta adicionada");
    await tocar(arvore, porTexto("Ver roteiro completo"));
    expect(todoOTexto(arvore)).toContain("Posso carregar um carro elétrico?");
  });

  it("cronômetro: conta, pausa e persiste em segundos; retomar soma ao que já havia", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
    const arvore = await montar([analise()]);
    await tocar(arvore, porTexto("Começar visita"));
    expect(todoOTexto(arvore)).toContain("00:00");
    expect(todoOTexto(arvore)).toContain("Visita em andamento");

    await act(async () => {
      jest.advanceTimersByTime(65_000);
    });
    expect(todoOTexto(arvore)).toContain("01:05");

    await tocar(arvore, porTexto("Pausar"));
    expect((await gravadas())[0]?.visita.segundos).toBe(65);
    expect(todoOTexto(arvore)).toContain("Visita pausada");
    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    expect(todoOTexto(arvore)).toContain("01:05");

    await tocar(arvore, porTexto("Retomar"));
    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(todoOTexto(arvore)).toContain("01:15");
    await tocar(arvore, porTexto("Pausar"));
    expect((await gravadas())[0]?.visita.segundos).toBe(75);
  });

  it("com o cronômetro correndo, grava o tempo somado a cada 30 s e o relógio da tela não pula", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
    const arvore = await montar([analise()]);
    await tocar(arvore, porTexto("Começar visita"));
    await act(async () => {
      jest.advanceTimersByTime(29_000);
    });
    expect((await gravadas())[0]?.visita.segundos).toBe(0);
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    await esvaziar();
    expect((await gravadas())[0]?.visita.segundos).toBe(30);
    expect(todoOTexto(arvore)).toContain("00:31");
    await act(async () => {
      jest.advanceTimersByTime(29_000);
    });
    await esvaziar();
    expect((await gravadas())[0]?.visita.segundos).toBe(60);
    expect(todoOTexto(arvore)).toContain("01:00");
    expect(todoOTexto(arvore)).toContain("Visita em andamento");
  });

  it("sair da tela com o cronômetro correndo grava o tempo somado", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
    const arvore = await montar([analise()]);
    await tocar(arvore, porTexto("Começar visita"));
    await act(async () => {
      jest.advanceTimersByTime(42_000);
    });
    await act(async () => {
      arvore.unmount();
    });
    await esvaziar();
    expect((await gravadas())[0]?.visita.segundos).toBe(42);
  });

  it("ruído: três opções, sem decibéis; a escolha grava e tocar de novo limpa", async () => {
    const arvore = await montar([analise()]);
    await tocar(arvore, porTexto("Começar visita"));
    const texto = todoOTexto(arvore);
    for (const nome of ["Silencioso", "Moderado", "Alto"]) expect(texto).toContain(nome);
    expect(texto).not.toMatch(/\d\s*dB/i);

    await tocar(arvore, porRotulo("Moderado"));
    expect((await gravadas())[0]?.visita.ruido).toBe("moderado");
    await tocar(arvore, porRotulo("Alto"));
    expect((await gravadas())[0]?.visita.ruido).toBe("alto");
    await tocar(arvore, porRotulo("Alto"));
    expect((await gravadas())[0]?.visita.ruido).toBeNull();
  });

  it("orientação: sem registro até a pessoa ajustar; o rótulo acompanha os graus e grava ao parar", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
    const arvore = await montar([analise()]);
    await tocar(arvore, porTexto("Começar visita"));
    expect(todoOTexto(arvore)).toContain("Sem registro");
    expect((await gravadas())[0]?.visita.orientacaoGraus).toBeNull();

    const aumentar = async () => {
      const controle = achar(arvore, (i) => i.props.role === "slider" && typeof i.props.onAccessibilityAction === "function");
      await act(async () => {
        (controle.props.onAccessibilityAction as (e: { nativeEvent: { actionName: string } }) => void)({ nativeEvent: { actionName: "increment" } });
      });
    };
    // O primeiro passo sem registro grava 0° (N); os 18 seguintes, de 5° em 5°, chegam a 90°.
    for (let i = 0; i < 19; i++) await aumentar();
    expect(todoOTexto(arvore)).toContain("90°");
    expect(todoOTexto(arvore)).toContain("Leste");
    // Ainda dentro do atraso de gravação: nada gravado.
    expect((await gravadas())[0]?.visita.orientacaoGraus).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(700);
    });
    await esvaziar();
    expect((await gravadas())[0]?.visita.orientacaoGraus).toBe(90);

    await tocar(arvore, porTexto("Limpar orientação"));
    await act(async () => {
      jest.advanceTimersByTime(700);
    });
    await esvaziar();
    expect((await gravadas())[0]?.visita.orientacaoGraus).toBeNull();
  });

  describe("orientação sem registro (G7)", () => {
    const trilho = (arvore: TestRenderer.ReactTestRenderer) =>
      achar(arvore, (i) => i.props.role === "slider" && typeof i.props.onAccessibilityAction === "function");
    const pelaDireita = porRotulo("Girar a direção da janela 1 grau para a direita");
    const pelaEsquerda = porRotulo("Girar a direção da janela 1 grau para a esquerda");

    async function gravarAgora() {
      await act(async () => {
        jest.advanceTimersByTime(700);
      });
      await esvaziar();
    }

    it("o leitor de tela não ouve valor nenhum: sem now, só o texto 'Não registrada'", async () => {
      jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
      const arvore = await montar([analise()]);
      await tocar(arvore, porTexto("Começar visita"));
      const sem = trilho(arvore);
      expect(sem.props["aria-valuenow"]).toBeUndefined();
      expect(sem.props["aria-valuetext"]).toBe("Não registrada");
      expect(sem.props.accessibilityValue).toEqual({ min: 0, max: 359, text: "Não registrada" });
      expect(sem.props.accessibilityValue).not.toHaveProperty("now");

      await tocar(arvore, pelaDireita);
      const com = trilho(arvore);
      expect(com.props["aria-valuenow"]).toBe(0);
      expect(com.props["aria-valuetext"]).toBe("0 graus, Norte");
      expect(com.props.accessibilityValue).toEqual({ min: 0, max: 359, now: 0, text: "0 graus, Norte" });
    });

    it("o primeiro toque em + grava 0° (N), não 1°; o seguinte vai a 1°", async () => {
      jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
      const arvore = await montar([analise()]);
      await tocar(arvore, porTexto("Começar visita"));
      await tocar(arvore, pelaDireita);
      expect(todoOTexto(arvore)).toContain("0°");
      expect(todoOTexto(arvore)).toContain("Norte");
      await gravarAgora();
      expect((await gravadas())[0]?.visita.orientacaoGraus).toBe(0);
      await tocar(arvore, pelaDireita);
      await gravarAgora();
      expect((await gravadas())[0]?.visita.orientacaoGraus).toBe(1);
    });

    it("o primeiro toque em − grava 0° (N), não 359°; depois dele, − dá a volta para 359°", async () => {
      jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
      const arvore = await montar([analise()]);
      await tocar(arvore, porTexto("Começar visita"));
      await tocar(arvore, pelaEsquerda);
      await gravarAgora();
      expect((await gravadas())[0]?.visita.orientacaoGraus).toBe(0);
      await tocar(arvore, pelaEsquerda);
      await gravarAgora();
      expect((await gravadas())[0]?.visita.orientacaoGraus).toBe(359);
    });

    it("as ações de acessibilidade (±5°) também começam em 0°; limpar volta a 'Não registrada'", async () => {
      jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
      const arvore = await montar([analise()]);
      await tocar(arvore, porTexto("Começar visita"));
      const acao = async (actionName: string) => {
        await act(async () => {
          (trilho(arvore).props.onAccessibilityAction as (e: { nativeEvent: { actionName: string } }) => void)({ nativeEvent: { actionName } });
        });
      };
      await acao("decrement");
      expect(trilho(arvore).props["aria-valuenow"]).toBe(0);
      await acao("increment");
      expect(trilho(arvore).props["aria-valuenow"]).toBe(5);
      await acao("decrement");
      await acao("decrement");
      expect(trilho(arvore).props["aria-valuenow"]).toBe(355);
      await tocar(arvore, porTexto("Limpar orientação"));
      expect(trilho(arvore).props["aria-valuenow"]).toBeUndefined();
      expect(trilho(arvore).props["aria-valuetext"]).toBe("Não registrada");
    });
  });

  it("se a gravação falhar, o rascunho das notas e da orientação continua na tela e vai junto na próxima gravação", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
    const arvore = await montar([analise()]);
    await tocar(arvore, porTexto("Começar visita"));
    await digitar(arvore, "Suas impressões", "Luz boa na sala");
    const trilho = () => achar(arvore, (i) => i.props.role === "slider" && typeof i.props.onAccessibilityAction === "function");
    for (let i = 0; i < 19; i++) {
      await act(async () => {
        (trilho().props.onAccessibilityAction as (e: { nativeEvent: { actionName: string } }) => void)({ nativeEvent: { actionName: "increment" } });
      });
    }
    expect(todoOTexto(arvore)).toContain("90°");

    // `setItem` já é um mock do jest: a próxima gravação falha uma vez e as seguintes voltam ao normal.
    const gravarItem = armazenamento.setItem as unknown as jest.Mock<(k: string, v: string) => Promise<void>>;
    gravarItem.mockRejectedValueOnce(new Error("sem espaço"));
    await act(async () => {
      jest.advanceTimersByTime(700);
    });
    await esvaziar();

    // Avisou, não gravou, e a tela continua com o que a pessoa escreveu e ajustou.
    expect(todoOTexto(arvore)).toContain(AVISO_DE_FALHA_AO_SALVAR);
    const [naoGravada] = await gravadas();
    expect(naoGravada?.visita).toMatchObject({ notas: "", orientacaoGraus: null });
    const campo = achar(arvore, (i) => typeof i.props.onChangeText === "function" && i.props.accessibilityLabel === "Suas impressões");
    expect(campo.props.value).toBe("Luz boa na sala");
    expect(todoOTexto(arvore)).toContain("90°");
    expect(todoOTexto(arvore)).toContain("Leste");
    expect(trilho().props["aria-valuenow"]).toBe(90);

    // O rascunho segue pendente: a próxima gravação leva notas e orientação junto.
    await tocar(arvore, porRotulo("Moderado"));
    const [gravada] = await gravadas();
    expect(gravada?.visita).toMatchObject({ notas: "Luz boa na sala", orientacaoGraus: 90, ruido: "moderado" });
    expect(achar(arvore, (i) => typeof i.props.onChangeText === "function" && i.props.accessibilityLabel === "Suas impressões").props.value).toBe("Luz boa na sala");
  });

  it("o que a pessoa escreveu enquanto a gravação falhava vale mais que o rascunho que falhou", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
    const arvore = await montar([analise()]);
    await tocar(arvore, porTexto("Começar visita"));
    await digitar(arvore, "Suas impressões", "Primeira versão");
    let soltar: (() => void) | undefined;
    const gravarItem = armazenamento.setItem as unknown as jest.Mock<(k: string, v: string) => Promise<void>>;
    gravarItem.mockImplementationOnce(() => new Promise<void>((_ok, rejeitar) => { soltar = () => rejeitar(new Error("sem espaço")); }));
    await act(async () => {
      jest.advanceTimersByTime(700);
    });
    await esvaziar();
    // A gravação está no ar; a pessoa segue digitando.
    await digitar(arvore, "Suas impressões", "Segunda versão, mais completa");
    await act(async () => {
      soltar?.();
    });
    await esvaziar();
    const campo = achar(arvore, (i) => typeof i.props.onChangeText === "function" && i.props.accessibilityLabel === "Suas impressões");
    expect(campo.props.value).toBe("Segunda versão, mais completa");
    await act(async () => {
      jest.advanceTimersByTime(700);
    });
    await esvaziar();
    expect((await gravadas())[0]?.visita.notas).toBe("Segunda versão, mais completa");
  });

  it("notas: gravam depois de um instante e juntas com a próxima gravação", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
    const arvore = await montar([analise()]);
    await tocar(arvore, porTexto("Começar visita"));
    await digitar(arvore, "Suas impressões", "Luz boa na sala");
    expect((await gravadas())[0]?.visita.notas).toBe("");
    await act(async () => {
      jest.advanceTimersByTime(700);
    });
    await esvaziar();
    expect((await gravadas())[0]?.visita.notas).toBe("Luz boa na sala");
  });

  it("encerrar grava concluidaEm e mostra o resumo, com 'Comparar minhas opções'", async () => {
    const a = analise();
    const arvore = await montar([a]);
    await tocar(arvore, porTexto("Começar visita"));
    const perguntas = perguntasDaVisita(a, [a], new Date());
    const primeira = perguntas[0];
    if (!primeira) throw new Error("sem perguntas");
    await tocar(arvore, porRotulo(`Conferida: ${primeira.titulo}`));
    await tocar(arvore, porRotulo("Moderado"));
    await tocar(arvore, porTexto("Salvar e encerrar visita"));

    const [gravada] = await gravadas();
    expect(gravada?.visita.concluidaEm).not.toBeNull();
    expect(Date.parse(gravada?.visita.concluidaEm ?? "")).not.toBeNaN();

    const texto = todoOTexto(arvore);
    expect(texto).toContain("Sua visita, registrada.");
    expect(texto).toContain("Visita salva neste aparelho");
    expect(texto).toContain(`de ${perguntas.length} perguntas conferidas`);
    expect(texto).toContain(primeira.titulo);
    expect(texto).toContain("Moderado");
    expect(texto).toContain("Resumo");
    expect(texto).toContain("Comparar minhas opções");

    await tocar(arvore, porTexto("Comparar minhas opções"));
    expect(empurrar).toHaveBeenCalledWith("/comparar");
  });

  it("Trocar: lista só as análises não descartadas e muda o imóvel ativo", async () => {
    const a = analise();
    const b = analise({ id: "visita-b", nome: "Casa sintética em Graças", bairro: "gracas", bairroTexto: "Graças" });
    const c = analise({
      id: "visita-c", nome: "Imóvel descartado",
      descarte: { motivo: "outro", observacao: "", em: INSTANTE },
    });
    const arvore = await montar([a, b, c], "visita-a");
    expect(todoOTexto(arvore)).toContain("Apartamento sintético de 3 quartos");

    await tocar(arvore, porRotulo("Trocar imóvel da visita"));
    const texto = todoOTexto(arvore);
    expect(texto).toContain("Qual imóvel vai visitar?");
    expect(texto).toContain("Casa sintética em Graças");
    expect(texto).not.toContain("Imóvel descartado");

    await tocar(arvore, (i) => podeTocar(i) && typeof i.props.accessibilityLabel === "string" && i.props.accessibilityLabel.startsWith("Casa sintética em Graças"));
    const depois = todoOTexto(arvore);
    expect(depois).toContain("Prepare sua visita.");
    expect(depois).toContain("Casa sintética em Graças");
    expect(depois).not.toContain("Qual imóvel vai visitar?");
    expect(await armazenamento.getItem("vereda-ativa-v1")).toBe("visita-b");
  });

  it("Trocar com o cronômetro correndo grava o tempo do imóvel anterior antes de mudar", async () => {
    jest.useFakeTimers({ now: new Date("2026-10-20T13:00:00.000Z") });
    const a = analise();
    const b = analise({ id: "visita-b", nome: "Casa sintética em Graças" });
    const arvore = await montar([a, b], "visita-a");
    await tocar(arvore, porTexto("Começar visita"));
    await act(async () => {
      jest.advanceTimersByTime(20_000);
    });
    await tocar(arvore, porRotulo("Trocar imóvel da visita"));
    await tocar(arvore, (i) => podeTocar(i) && typeof i.props.accessibilityLabel === "string" && i.props.accessibilityLabel.startsWith("Casa sintética em Graças"));
    const gravadasAgora = await gravadas();
    expect(gravadasAgora.find((x) => x.id === "visita-a")?.visita.segundos).toBe(20);
    expect(gravadasAgora.find((x) => x.id === "visita-b")?.visita.segundos).toBe(0);
    expect(await armazenamento.getItem("vereda-ativa-v1")).toBe("visita-b");
  });

  it("uma análise descartada como ativa não abre visita: pede para escolher outro imóvel", async () => {
    const descartada = analise({ descarte: { motivo: "outro", observacao: "", em: INSTANTE } });
    const outra = analise({ id: "visita-b", nome: "Casa sintética em Graças" });
    const arvore = await montar([descartada, outra], "visita-a");
    const texto = todoOTexto(arvore);
    expect(texto).toContain("Escolha o imóvel que você vai visitar.");
    expect(texto).not.toContain("Começar visita");
    await tocar(arvore, porTexto("Escolher imóvel"));
    expect(todoOTexto(arvore)).toContain("Casa sintética em Graças");
  });

  describe("endereço do imóvel por extenso", () => {
    const estrada = indiceDoBairro("casa-forte").edificios.find((e) => e.logradouro.startsWith("EST "));
    if (!estrada) throw new Error("Casa Forte não tem um edifício em estrada (prefixo EST) no índice");
    const vinculoDaEstrada: AnaliseV2["vinculo"] = {
      estado: "confirmado", edificioId: estrada.id, dsqfl: estrada.dsqfl, confirmadoEm: INSTANTE, indiceGeradoEm: "teste",
    };

    it("com prédio confirmado, o cartão mostra o endereço do edifício: 'Estrada do Encanamento', nunca 'Est do Encanamento'", async () => {
      const a = analise({ nome: "Apartamento na estrada", logradouro: "Rua digitada", numero: "1", vinculo: vinculoDaEstrada });
      const arvore = await montar([a]);
      const esperado = formatarEndereco(estrada.logradouro, estrada.numero);
      expect(esperado.startsWith("Estrada ")).toBe(true);
      expect(enderecoDoImovel(a, estrada)).toBe(esperado);
      const texto = todoOTexto(arvore);
      expect(texto).toContain(esperado);
      expect(texto).not.toMatch(/\bEst (do|da|de)\b/);
      expect(texto).not.toContain("Rua digitada");
      expect(texto).toContain("Casa Forte · 98 m² · 3 quartos");
    });

    it("sem prédio, vale a rua da análise, por extenso; sem rua, o cartão não inventa endereço", async () => {
      const arvore = await montar([analise({ logradouro: "av. rui barbosa", numero: "12" })]);
      expect(todoOTexto(arvore)).toContain("Avenida Rui Barbosa, 12");
      const sem = await montar([analise({ id: "visita-sem-rua" })]);
      expect(enderecoDoImovel(analise(), null)).toBeNull();
      expect(todoOTexto(sem)).not.toMatch(/Avenida|Rua |Estrada/);
    });

    it("a lista de 'Trocar' também mostra o endereço do prédio confirmado de cada imóvel", async () => {
      const a = analise({ id: "visita-a", nome: "Apartamento sintético de 3 quartos" });
      const b = analise({ id: "visita-b", nome: "Apartamento na estrada", vinculo: vinculoDaEstrada });
      const arvore = await montar([a, b], "visita-a");
      await tocar(arvore, porRotulo("Trocar imóvel da visita"));
      const linha = achar(arvore, (i) => podeTocar(i) && typeof i.props.accessibilityLabel === "string" && i.props.accessibilityLabel.startsWith("Apartamento na estrada"));
      expect(linha.props.accessibilityLabel).toContain(formatarEndereco(estrada.logradouro, estrada.numero));
      expect(todoOTexto(arvore)).toContain(formatarEndereco(estrada.logradouro, estrada.numero));
    });
  });

  it("'N pontos para conferir' e o número do resumo estão em Fraunces 500, não em JetBrains Mono", async () => {
    const a = analise();
    const arvore = await montar([a]);
    const n = perguntasDaVisita(a, [a], new Date()).length;
    const preparar = estilosDoTexto(arvore, String(n));
    expect(preparar.length).toBeGreaterThan(0);
    for (const estilo of preparar) expect(estilo).toMatchObject({ fontFamily: "Fraunces", fontWeight: "500" });
    expect(todoOTexto(arvore)).toContain("pontos para conferir");

    await tocar(arvore, porTexto("Começar visita"));
    await tocar(arvore, porTexto("Salvar e encerrar visita"));
    const resumo = estilosDoTexto(arvore, "0");
    expect(resumo.length).toBeGreaterThan(0);
    for (const estilo of resumo) expect(estilo).toMatchObject({ fontFamily: "Fraunces", fontWeight: "500" });
    expect(todoOTexto(arvore)).toContain(`de ${n} perguntas conferidas`);
  });

  it("as etapas da visita: tablist com setas, Home e End, só a etapa ativa na ordem de Tab", async () => {
    const arvore = await montar([analise()]);
    const lista = () => achar(arvore, (i) => (i.type as unknown) === "View" && i.props.role === "tablist" && i.props.accessibilityLabel === "Etapas da visita");
    const etapas = () => arvore.root.findAll((i) => i.type === Pressionavel && i.props.role === "tab");
    expect(etapas().map((e) => e.props["aria-selected"])).toEqual([true, false]);
    expect(etapas().map((e) => e.props.tabIndex)).toEqual([0, -1]);
    expect(etapas().map((e) => e.props.nativeID)).toEqual(["vx-etapa-preparar", "vx-etapa-campo"]);
    const tecla = async (key: string) => {
      const preventDefault = jest.fn();
      await act(async () => {
        (lista().props.onKeyDown as (e: unknown) => void)({ key, preventDefault });
      });
      return preventDefault;
    };
    expect(await tecla("ArrowRight")).toHaveBeenCalled();
    expect(todoOTexto(arvore)).toContain("Olhe de perto.");
    expect(etapas().map((e) => e.props["aria-selected"])).toEqual([false, true]);
    expect(await tecla("ArrowRight")).toHaveBeenCalled();
    expect(todoOTexto(arvore)).toContain("Prepare sua visita.");
    await tecla("End");
    expect(todoOTexto(arvore)).toContain("Olhe de perto.");
    await tecla("Home");
    expect(todoOTexto(arvore)).toContain("Prepare sua visita.");
    expect(await tecla("Tab")).not.toHaveBeenCalled();
    expect(todoOTexto(arvore)).toContain("Prepare sua visita.");
  });

  it("nenhum texto da tela traz nota, selo ou veredito sobre o imóvel", async () => {
    const arvore = await montar([analise()]);
    const abas = [todoOTexto(arvore)];
    await tocar(arvore, porTexto("Começar visita"));
    abas.push(todoOTexto(arvore));
    await tocar(arvore, porTexto("Salvar e encerrar visita"));
    abas.push(todoOTexto(arvore));
    const proibidas = /melhor op[cç][aã]o|recomend|nota\s*\d|selo|imperd[ií]vel|excelente|ótimo|otimo|bom neg[oó]cio/i;
    for (const texto of abas) expect(texto).not.toMatch(proibidas);
  });
});
