// Testes da mensagem ao corretor (Fatia 5). Análises e perguntas sintéticas.
import { describe, expect, it } from "@jest/globals";
import { esquemaAnaliseV2, type AnaliseV2, type Pergunta } from "../src/dados/contratos";
import { derivarDossie } from "../src/dados/dossie/derivar";
import { MAX_PERGUNTAS_NA_MENSAGEM, mensagemParaCorretor } from "../src/dados/mensagem";

const INSTANTE = "2026-10-20T12:00:00.000Z";
const v = (valor: number | null) => ({ valor, origem: "texto" as const, aConfirmar: false });

function analise(mudancas: Partial<AnaliseV2> = {}): AnaliseV2 {
  return esquemaAnaliseV2.parse({
    versao: 2, id: "analise-mensagem", criadaEm: INSTANTE, atualizadaEm: INSTANTE,
    nome: "Apartamento sintético de 3 quartos", modalidade: "aluguel", tipologia: "apartamento",
    url: "https://anuncio.invalid/sintetico-1", bairroTexto: "Casa Forte", bairro: "casa-forte",
    logradouro: null, numero: null, nomeEdificio: null, extracao: null,
    declarados: {
      preco: v(4500), condominio: v(null), iptu: { ...v(null), periodo: "desconhecido" }, seguroIncendio: v(null), taxaServico: v(null),
      outros: v(null), area: v(98), quartos: v(3), suites: v(null), banheiros: v(null), vagas: v(null), andar: v(null),
    },
    vinculo: { estado: "pendente" },
    visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null,
    ...mudancas,
  });
}

function pergunta(id: string, texto: string, mudancas: Partial<Pergunta> = {}): Pergunta {
  return { id, titulo: `Título de ${id}`, pista: "Pista", textoParaMensagem: texto, origem: "padrao", prioridade: "conforto", ...mudancas };
}

const P = (n: number) => pergunta(`p${n}`, `Pergunta número ${n}?`);

/** `seguro` só passa dentro de "seguro incêndio" e "seguro fiança" (seção 1.2 da ordem). */
const semSeguroPermitido = (texto: string) => texto.replace(/seguro inc[êe]ndio/gi, "").replace(/seguro fian[çc]a/gi, "");

describe("mensagemParaCorretor", () => {
  it("monta a mensagem no formato da ordem, com o link entre parênteses", () => {
    const mensagem = mensagemParaCorretor(analise(), [P(1), P(2)]);
    expect(mensagem).toBe(
      [
        "Olá! Vi o anúncio Apartamento sintético de 3 quartos (https://anuncio.invalid/sintetico-1).",
        "Antes de visitar, pode me confirmar:",
        "1. Pergunta número 1?",
        "2. Pergunta número 2?",
        "Obrigado!",
      ].join("\n"),
    );
  });

  it("sem link, não há parênteses", () => {
    const mensagem = mensagemParaCorretor(analise({ url: "" }), [P(1)]);
    expect(mensagem.split("\n")[0]).toBe("Olá! Vi o anúncio Apartamento sintético de 3 quartos.");
    expect(mensagem).not.toContain("(");
    expect(mensagemParaCorretor(analise({ url: "   " }), [P(1)])).not.toContain("(");
  });

  it("leva até 6 perguntas, na ordem recebida", () => {
    const todas = [1, 2, 3, 4, 5, 6, 7, 8].map(P);
    const linhas = mensagemParaCorretor(analise(), todas).split("\n");
    expect(MAX_PERGUNTAS_NA_MENSAGEM).toBe(6);
    expect(linhas.filter((l) => /^\d+\. /.test(l))).toEqual([
      "1. Pergunta número 1?", "2. Pergunta número 2?", "3. Pergunta número 3?",
      "4. Pergunta número 4?", "5. Pergunta número 5?", "6. Pergunta número 6?",
    ]);
    expect(linhas[linhas.length - 1]).toBe("Obrigado!");
  });

  it("deixa de fora as perguntas já verificadas e completa com as seguintes", () => {
    const a = analise({ visita: { ...analise().visita, verificadas: ["p1", "p3"] } });
    const linhas = mensagemParaCorretor(a, [1, 2, 3, 4, 5, 6, 7, 8].map(P)).split("\n").filter((l) => /^\d+\. /.test(l));
    expect(linhas).toEqual([
      "1. Pergunta número 2?", "2. Pergunta número 4?", "3. Pergunta número 5?",
      "4. Pergunta número 6?", "5. Pergunta número 7?", "6. Pergunta número 8?",
    ]);
  });

  it("lacuna-endereco vai sempre em primeiro, mesmo vindo depois", () => {
    const endereco = pergunta("lacuna-endereco", "Qual é o endereço completo do imóvel, com rua e número?", { origem: "lacuna", prioridade: "documentos" });
    const linhas = mensagemParaCorretor(analise(), [P(1), P(2), endereco, P(3)]).split("\n").filter((l) => /^\d+\. /.test(l));
    expect(linhas).toEqual([
      "1. Qual é o endereço completo do imóvel, com rua e número?", "2. Pergunta número 1?", "3. Pergunta número 2?", "4. Pergunta número 3?",
    ]);
  });

  it("o endereço entra entre as 6 mesmo com mais de 6 perguntas antes dele", () => {
    const endereco = pergunta("lacuna-endereco", "Qual é o endereço?");
    const linhas = mensagemParaCorretor(analise(), [...[1, 2, 3, 4, 5, 6, 7].map(P), endereco]).split("\n").filter((l) => /^\d+\. /.test(l));
    expect(linhas).toHaveLength(6);
    expect(linhas[0]).toBe("1. Qual é o endereço?");
    expect(linhas[5]).toBe("6. Pergunta número 5?");
  });

  it("endereço já verificado não volta", () => {
    const a = analise({ visita: { ...analise().visita, verificadas: ["lacuna-endereco"] } });
    const endereco = pergunta("lacuna-endereco", "Qual é o endereço?");
    expect(mensagemParaCorretor(a, [endereco, P(1)])).not.toContain("endereço");
  });

  it("sem pergunta pendente, só pede a visita", () => {
    const esperado = "Olá! Vi o anúncio Apartamento sintético de 3 quartos (https://anuncio.invalid/sintetico-1).\nGostaria de marcar uma visita.\nObrigado!";
    expect(mensagemParaCorretor(analise(), [])).toBe(esperado);
    const a = analise({ visita: { ...analise().visita, verificadas: ["p1"] } });
    expect(mensagemParaCorretor(a, [P(1)])).toBe(esperado);
  });

  it("usa textoParaMensagem, não o título curto, e ignora texto vazio", () => {
    const mensagem = mensagemParaCorretor(analise(), [pergunta("x", "   "), pergunta("y", "Texto completo da pergunta?")]);
    expect(mensagem).toContain("1. Texto completo da pergunta?");
    expect(mensagem).not.toContain("Título de");
    expect(mensagem).not.toContain("2.");
  });

  it("não altera as perguntas nem a análise recebidas e é determinística", () => {
    const a = analise();
    const perguntas = [P(2), pergunta("lacuna-endereco", "Endereço?"), P(1)];
    const copia = JSON.parse(JSON.stringify(perguntas));
    const antes = JSON.parse(JSON.stringify(a));
    const primeira = mensagemParaCorretor(a, perguntas);
    expect(mensagemParaCorretor(a, perguntas)).toBe(primeira);
    expect(perguntas).toEqual(copia);
    expect(a).toEqual(antes);
  });

  it("com as perguntas reais do dossiê: endereço e lacunas de custo primeiro, sem palavra proibida", () => {
    const a = analise({
      visita: { ...analise().visita, perguntasProprias: [{ id: "propria-vaga", texto: "A vaga é coberta?" }] },
    });
    const { perguntas } = derivarDossie(a, null, null, [], [], new Date(INSTANTE));
    const mensagem = mensagemParaCorretor(a, perguntas);
    const linhas = mensagem.split("\n");
    expect(linhas[0]).toBe("Olá! Vi o anúncio Apartamento sintético de 3 quartos (https://anuncio.invalid/sintetico-1).");
    expect(linhas[2]).toBe("1. Qual é o endereço completo do imóvel, com rua e número?");
    expect(linhas[3]).toBe("2. Qual é o valor do condomínio e há alguma cota extra prevista?");
    expect(linhas[4]).toMatch(/^3\. Qual é o valor do IPTU deste apartamento/);
    expect(linhas[5]).toBe("4. Há seguro incêndio no contrato de aluguel? Qual é o valor mensal?");
    expect(linhas.filter((l) => /^\d+\. /.test(l))).toHaveLength(6);
    expect(semSeguroPermitido(mensagem)).not.toMatch(/perigos|vale a pena|caro|barat|caix[ãa]o|ótim|ruim|arriscad|seguro/i);
  });

  it("seguro incêndio a confirmar entra na mensagem com o valor do anúncio; com seguro conhecido, não entra", () => {
    const aConfirmar = analise({ declarados: { ...analise().declarados, seguroIncendio: { valor: 42, origem: "texto", aConfirmar: true } } });
    const { perguntas } = derivarDossie(aConfirmar, null, null, [], [], new Date(INSTANTE));
    const mensagem = mensagemParaCorretor(aConfirmar, perguntas);
    expect(mensagem).toContain("Qual é o valor mensal do seguro incêndio? O anúncio informa R$ 42.");
    expect(semSeguroPermitido(mensagem)).not.toMatch(/seguro/i);

    const conhecido = analise({ declarados: { ...analise().declarados, seguroIncendio: v(42) } });
    const sem = derivarDossie(conhecido, null, null, [], [], new Date(INSTANTE)).perguntas;
    expect(mensagemParaCorretor(conhecido, sem)).not.toMatch(/seguro/i);
  });

  it("com rua e número na análise, a mensagem não pergunta o endereço; com um só deles, pergunta", () => {
    const completa = analise({ logradouro: "Rua do Sol", numero: "55" });
    const perguntasCompletas = derivarDossie(completa, null, null, [], [], new Date(INSTANTE)).perguntas;
    expect(perguntasCompletas.map((p) => p.id)).not.toContain("lacuna-endereco");
    expect(mensagemParaCorretor(completa, perguntasCompletas)).not.toContain("endereço completo");

    const semNumero = analise({ logradouro: "Rua do Sol", numero: null });
    const perguntasSemNumero = derivarDossie(semNumero, null, null, [], [], new Date(INSTANTE)).perguntas;
    expect(mensagemParaCorretor(semNumero, perguntasSemNumero).split("\n")[2]).toBe("1. Qual é o endereço completo do imóvel, com rua e número?");
  });
});
