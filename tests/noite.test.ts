// VE08: a volta à noite e o lado do barulho, com o pacote real do piloto. Primeiro a consequência, depois os registros.
import { describe, expect, it } from "@jest/globals";
import { ladoDoBarulho, noiteDoBairro, voltaANoite } from "../src/dados/recife/noite";
import { VERSAO_DA_NOITE } from "../src/dados/recife/noiteGerado";
import { MAX_TEXTO_DA_PERGUNTA } from "../src/componentes/visita-v1/logica";

const PILOTO = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];
const PROIBIDO = /segur|perigos|crime|violên|assalt|renda|decib|\bdB\b/i;

describe("pacote real", () => {
  it("cada bairro do piloto valida, tem a versão gerada e referências válidas", () => {
    for (const b of PILOTO) {
      const n = noiteDoBairro(b)!;
      expect(n.versao).toBe(VERSAO_DA_NOITE);
      for (const p of Object.values(n.predios)) if (p.v) {
        expect(n.paradas[p.v.p]).toBeDefined();
        // Última chegada do dia de serviço: depois das 22h, até as 6h da madrugada seguinte.
        expect(n.paradas[p.v.p]!.ultima).toBeGreaterThanOrEqual(22 * 3600);
        expect(n.paradas[p.v.p]!.ultima).toBeLessThanOrEqual(30 * 3600);
        if (p.v.alt) { expect(p.v.alt.travessias).toBeLessThan(p.v.t); expect(p.v.alt.m).toBeGreaterThanOrEqual(p.v.m); expect(p.v.alt.m).toBeLessThanOrEqual(p.v.m * 1.2 + 1); }
        expect(p.v.luz[3]).toBeLessThanOrEqual(p.v.luz[2]);
      }
    }
  });
});

describe("frases", () => {
  it("volta à noite: ponto, minutos, travessias e último ônibus primeiro; postes e pedidos 156 atrás do toque", () => {
    const v = voltaANoite("boa-viagem", "10537-232")!;
    expect(v.frase).toMatch(/^Chegando de ônibus depois das 22h num dia útil: o ponto mais perto com chegada nesse horário é o .+, a \d+ min a pé, (sem atravessar via principal|com \d+ travessias? de via principal)\. (O último ônibus programado chega lá às (2[2-3]|0[0-1]):[0-5]\d|Há chegada programada lá também de madrugada \(a última, às 0[2-5]:[0-5]\d\))\.$/);
    expect(v.detalhes[0]).toMatch(/^Postes cadastrados a até 25 m do caminho: \d+.*O cadastro diz onde há poste, não se a lâmpada acende/);
    expect(v.detalhes.at(-1)).toContain("não é uma avaliação de segurança");
    expect([v.frase, ...v.detalhes.slice(0, -1)].join(" ")).not.toMatch(PROIBIDO);
  });
  it("atropelamentos aparecem com rua, quantidade e anos, e dizem que não há ponto nem hora", () => {
    const n = noiteDoBairro("boa-viagem")!;
    const id = Object.keys(n.predios).find((k) => (n.predios[k]!.v?.ruas.length ?? 0) > 0)!;
    const d = voltaANoite("boa-viagem", id)!.detalhes.find((x) => x.startsWith("Atropelamentos"))!;
    expect(d).toMatch(/^Atropelamentos registrados pela CTTU em 2022–2024 nas ruas que o caminho usa: .+ \(\d+.*; 202[2-4].*\)\. O registro dá a rua, não o ponto do caminho nem a hora\.$/);
  });
  it("lado do barulho: lado e via, hora de visita e lado oposto; pergunta cabe no roteiro; sem decibéis", () => {
    const n = noiteDoBairro("boa-viagem")!;
    const id = Object.keys(n.predios).find((k) => n.predios[k]!.r?.rua && n.predios[k]!.r?.lado === "leste")!;
    const b = ladoDoBarulho("boa-viagem", id)!;
    expect(b.frase).toMatch(/^O lado leste do prédio dá para a .+, via principal a \d+ m.*Para comparar o barulho, visite num dia útil entre 17h e 19h e ouça também o lado oeste\./);
    expect(b.pergunta.length).toBeLessThanOrEqual(MAX_TEXTO_DA_PERGUNTA);
    expect(b.titulo).toMatch(/^(A via movimentada mais perto|Rua movimentada e som licenciado)\.$/);
    expect(b.nota).toContain("Sem medição de decibéis");
    expect(b.nota).toContain("O aeroporto não entra");
  });
  it("LUSE vigente: diz que a licença não dá horário nem volume", () => {
    const n = noiteDoBairro("gracas")!;
    const id = Object.keys(n.predios).find((k) => n.predios[k]!.s)!;
    expect(ladoDoBarulho("gracas", id)!.frase).toContain("licença ambiental de uso sonoro (LUSE) vigente; a licença não diz horário nem volume");
  });
  it("fora do piloto ou sem dados: nada", () => {
    expect(voltaANoite("cabanga", "1-1")).toBeNull();
    expect(ladoDoBarulho("boa-viagem", "nao-existe")).toBeNull();
  });
});
