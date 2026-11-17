// "Se a rua alagar" (VE06): pacote real do piloto e frases que mostram a consequência antes do registro.
import { describe, expect, it } from "@jest/globals";
import { chuvaDoBairro, chuvaDoPredio, mesesEAnos } from "../src/dados/recife/chuva";
import { VERSAO_DA_CHUVA } from "../src/dados/recife/chuvaGerado";

const PILOTO = ["boa-viagem", "casa-forte", "gracas", "espinheiro", "madalena"];

describe("pacote real", () => {
  it("cada bairro do piloto abre, valida e tem a versão gerada", () => {
    for (const b of PILOTO) expect(chuvaDoBairro(b)?.versao).toBe(VERSAO_DA_CHUVA);
    expect(chuvaDoBairro("cabanga")).toBeNull();
  });
  it("só entram cenários materiais (≥ 3 min a mais ou perda) e toda referência existe", () => {
    for (const b of PILOTO) {
      const p = chuvaDoBairro(b)!;
      for (const l of Object.values(p.predios)) for (const s of l) {
        expect(p.observacoes[s.o]).toBeDefined();
        expect(p.locais[s.a.l]).toBeDefined();
        if (s.d) { expect(p.locais[s.d.l]).toBeDefined(); expect(s.d.min - s.a.min).toBeGreaterThanOrEqual(3); }
      }
      // A data é administrativa ou só o ano; nunca hora de evento.
      for (const o of p.observacoes) expect(o.data === null || /^\d{4}-\d{2}-\d{2}$/.test(o.data)).toBe(true);
    }
  });
});

describe("frases: primeiro o que muda para a pessoa", () => {
  it("Boa Viagem, Rua Barão de Beberibe 232: a avenida alagada alonga o caminho até o mercado", () => {
    const r = chuvaDoPredio("boa-viagem", "10537-232")!;
    const l = r.linhas.find((x) => x.frase.includes("mercado"))!;
    expect(l.frase).toBe("Se um alagamento como o de 30/06/2023 bloquear a passagem a pé na Avenida Barão de Souza Leão, o caminho a pé até o mercado passaria de 6 min para 13 min, por outro caminho.");
    expect(l.registro).toMatch(/^Defesa Civil do Recife, atendimentos 2014–2024 \(dados\.recife\.pe\.gov\.br\): "Alagamentos" em Avenida Barão de Souza Leão, Boa Viagem, em 30\/06\/2023\./);
    expect(l.registro).toContain("não diz se a passagem a pé foi bloqueada");
    expect(l.registro).toContain("a rua é longa e a fonte não diz o ponto");
    expect(l.registro).toMatch(/consideramos os \d+,\d km dela dentro do bairro/);
  });
  it("Madalena: os dois registros do túnel viram uma frase só", () => {
    const r = chuvaDoPredio("madalena", "10910-341")!;
    const l = r.linhas.find((x) => x.frase.includes("Túnel"))!;
    expect(l.frase).toMatch(/^Se um alagamento como os de 15\/06\/2024 e 25\/06\/2024 bloquear a passagem a pé no Túnel da Madalena, o mercado mais perto a pé passaria a ser .+, a 14 min \(hoje 9 min\)\.$/);
    expect(r.linhas.filter((x) => x.frase.includes("Túnel") && x.frase.includes("mercado"))).toHaveLength(1);
  });
  it("rua do próprio prédio: histórico datado, sem afirmar que a saída fica bloqueada", () => {
    const r = chuvaDoPredio("casa-forte", "38490-145")!;
    expect(r.ruaPropria?.frase).toBe("Na rua do prédio (Rua Lemos Torres), a Defesa Civil registrou alagamento na via em 2015. Nenhuma dessas fontes diz se a passagem a pé foi bloqueada, nem por quanto tempo. Na visita, pergunte até onde a água chega na entrada e por quanto tempo ela fica.");
    expect(r.ruaPropria?.frase).not.toMatch(/comprometida|qualquer que seja o destino/);
    // Vínculo ambíguo: o "Imóveis Alagados" da Travessa Lemos Torres (outra via) não entra no histórico da Rua.
    expect(r.ruaPropria?.registro).not.toContain("Travessa");
    expect(r.linhas.some((x) => x.frase.includes("Lemos Torres"))).toBe(false);
  });
  it("desvio é cenário condicional: 'se ... bloquear', nunca afirmação de bloqueio", () => {
    for (const b of PILOTO) {
      const p = chuvaDoBairro(b)!;
      for (const id of Object.keys(p.predios)) for (const l of chuvaDoPredio(b, id)!.linhas) {
        expect(l.frase).toMatch(/^Se um alagamento como (o|os) de .+ bloquear a passagem a pé/);
        expect(l.frase).toMatch(/passaria|ficaria/);
        expect(l.registro).toContain("o desvio é um cenário");
      }
    }
  });
  it("histórico aparece mesmo quando o desvio calculado é pequeno", () => {
    const r = chuvaDoPredio("gracas", "21075-38")!;
    expect(r.linhas).toHaveLength(0);
    expect(r.pequenos?.frase).toBe("No caminho a pé até a farmácia e o ponto de ônibus também há uma rua com alagamento registrado: Avenida Conselheiro Portela (mai/2024). Se ela ficar intransitável, o desvio é de menos de 3 min.");
  });
  it("catálogo da Prefeitura e registro da Defesa Civil são fatos distintos", () => {
    const r = chuvaDoPredio("gracas", "59595-264")!;
    expect(r.ruaPropria?.frase).toMatch(/^Na rua do prédio \(Avenida Rui Barbosa\), a Defesa Civil não tem atendimento de alagamento de 2014 a 2024\. A Prefeitura cataloga um ponto de alagamento nesta rua a \d+ m da entrada \(posição aproximada\)\./);
    expect(r.ruaPropria?.registro).toContain("eSIG");
    expect(r.ruaPropria?.registro).toContain("não traz data de evento");
    const bv = chuvaDoPredio("boa-viagem", "34991-207")!;
    expect(bv.ruaPropria?.frase).toContain("imóvel alagado na rua em jun/2022 (o registro não diz qual imóvel)");
    expect(bv.ruaPropria?.frase).not.toContain("alagamento na via");
  });
  it("dado ausente: sem pacote, sem prédio ou sem nada registrado, nada a mostrar", () => {
    expect(chuvaDoPredio("boa-viagem", "nao-existe")).toBeNull();
    expect(chuvaDoPredio("cabanga", "10537-232")).toBeNull();
    expect(chuvaDoPredio(null, "10537-232")).toBeNull();
    expect(chuvaDoPredio("torre", Object.keys(chuvaDoBairro("torre")!.predios)[0] ?? "sem-registro")).toBeNull();
  });
});

describe("meses e anos", () => {
  it("datados viram mês/ano; só com ano viram o ano; ordem cronológica", () => {
    expect(mesesEAnos([{ data: "2023-06-30", ano: 2023 }, { data: null, ano: 2015 }, { data: "2022-05-31", ano: 2022 }]).rotulos).toEqual(["2015", "mai/2022", "jun/2023"]);
  });
  it("leitura sazonal só quando a série sustenta (≥ 4 datas em ≥ 2 anos, janela ≤ 5 meses)", () => {
    const quatro = ["2022-05-30", "2022-06-14", "2023-06-30", "2024-07-02"].map((d) => ({ data: d, ano: Number(d.slice(0, 4)) }));
    expect(mesesEAnos(quatro).sazonal).toBe("todos os registros com data caíram entre mai e jul");
    expect(mesesEAnos(quatro.slice(0, 3)).sazonal).toBeNull();
    expect(mesesEAnos([...quatro.slice(0, 3), { data: "2024-12-01", ano: 2024 }]).sazonal).toBeNull();
  });
});
