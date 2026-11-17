import { it, expect } from "@jest/globals";
import { registrarAlteracaoDoAnuncio } from "../src/dados/historicoDoAnuncio";
import { analiseDeTeste, EM } from "./fixtures/caderno";
import { esquemaAnaliseV2 } from "../src/dados/contratos";
import { distanciaDaRotina } from "../src/dados/rotina";
import { cadernoVazio } from "../src/dados/caderno";
import { resumoCompartilhavel } from "../src/dados/resumo";

it("não inventa passado, não registra visita/notas como anúncio e não altera o original", () => {
  const a = analiseDeTeste();
  expect(registrarAlteracaoDoAnuncio(undefined, a, EM)).toBe(a);
  const b = { ...a, visita: { ...a.visita, notas: "Nota privada" } };
  expect(registrarAlteracaoDoAnuncio(a, b, EM)).toBe(b);
  expect(a.caderno).toBeUndefined();
});
it("destino impreciso não gera distância, distância reta não gera minutos e posição fica fora do resumo", () => {
  const d = { id: "destino-a", apelido: "Trabalho privado", nota: "Porta privada", posicao: { longitude: -34.9, latitude: -8.03, precisaoM: 20, em: EM } };
  expect(distanciaDaRotina([-34.9, -8.03], d)).toBe(100);
  expect(distanciaDaRotina(null, d)).toBeNull();
  expect(distanciaDaRotina([-34.9, -8.03], { ...d, posicao: { ...d.posicao, precisaoM: null } })).toBeNull();
  expect(distanciaDaRotina([-34.9, -8.03], { ...d, posicao: { ...d.posicao, precisaoM: 101 } })).toBeNull();
  const a = analiseDeTeste("privado", { caderno: { ...cadernoVazio(), destinos: [d] } });
  expect(resumoCompartilhavel(a)).not.toContain("Trabalho privado");
  expect(resumoCompartilhavel(a)).not.toContain("-34.9");
});
it("preserva ausência, zero, origem e IPTU anual ao registrar alteração deliberada", () => {
  const a = analiseDeTeste();
  const b = { ...a, declarados: { ...a.declarados, preco: { ...a.declarados.preco, valor: 2600 }, iptu: { ...a.declarados.iptu, valor: 0, periodo: "ano" as const } } };
  const resultado = registrarAlteracaoDoAnuncio(a, b, EM);
  expect(esquemaAnaliseV2.safeParse(resultado).success).toBe(true);
  const h = resultado.caderno!.historicoDoAnuncio![0]!;
  expect(h.alteracoes).toHaveLength(2);
  expect(h.alteracoes[1]!.antes).toContain("Não informado");
  expect(h.alteracoes[1]!.depois).toContain("0 · informado por você · período: ano");
  expect(registrarAlteracaoDoAnuncio(resultado, { ...resultado }, EM).caderno!.historicoDoAnuncio).toHaveLength(1);
  expect(a.declarados.preco.valor).toBe(2500);
});
