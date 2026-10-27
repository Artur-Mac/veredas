import { describe, expect, it } from "@jest/globals";
import { esquemaCaderno, cadernoVazio } from "../src/dados/caderno";
import { custoDaRotina, linhaDoTempo, saldoDoBalancete } from "../src/dados/complementos";
import { moverFoto, retirarFoto } from "../src/dados/galeria";
import { dataDoLembrete, lembretesDesejados, mudancasDeAgendamento } from "../src/dados/lembretes";
import { lerArquivoDaExtensao } from "../src/dados/arquivoDaExtensao";
import { createHash } from "crypto";
import { analiseDeTeste, EM } from "./fixtures/caderno";
import { formatarCentavos } from "../src/dados/formatos";

describe("conclusão local — sem perda/afirmação inventada", () => {
 it("não oculta um centavo e não colide identidades de lembretes compostas", () => {
  expect(formatarCentavos(1)).toBe("R$ 0,01"); expect(formatarCentavos(-1)).toBe("R$ -0,01");
  const c={...cadernoVazio(),lembretes:[{id:"b-c",titulo:"Visitar",em:"2027-01-01T17:00:00.000Z",fuso:"America/Recife",notificar:true,estado:"ativo" as const}]};
  const a=analiseDeTeste("a",{caderno:c});
  const b=analiseDeTeste("a-b",{caderno:{...c,lembretes:[{...c.lembretes[0]!,id:"c"}]}});
  expect(new Set(lembretesDesejados([a,b],Date.parse(EM)).map(r=>r.id)).size).toBe(2);
 });
 it("reordena pela identidade atual e retira referência sem alterar outra cópia", () => {
  const c = { ...cadernoVazio(), fotos: [1,2,3].map(i => ({id:`foto-${i}`,chave:`foto-${i}.jpg`,bytes:100,em:EM})) };
  expect(moverFoto(c,"foto-3","capa").fotos?.map(f=>f.id)).toEqual(["foto-3","foto-1","foto-2"]);
  expect(moverFoto(c,"foto-1","antes")).toBe(c);
  expect(retirarFoto(c,"foto-2").fotos).toHaveLength(2); expect(c.fotos).toHaveLength(3);
 });
 it("consumo zero é conhecido, tarifa ausente permanece pendente e total não entra no anúncio", () => {
  const p = { ocupantes:2,orcamentoCentavos:null,consumos:[{id:"c1",assunto:"energia" as const,unidade:"kwh" as const,quantidade:100,tarifaCentavos:100,fonte:"Conta apresentada",referenciaEm:null},{id:"c2",assunto:"agua" as const,unidade:"m3" as const,quantidade:0,tarifaCentavos:null,fonte:"Tarifa desconhecida",referenciaEm:null}] };
  expect(custoDaRotina(p)).toEqual({conhecidoCentavos:10000,pendentes:1});
  expect(custoDaRotina({...p,consumos:[{...p.consumos[0]!,quantidade:0}]})).toEqual({conhecidoCentavos:0,pendentes:0});
 });
 it("balancete sem receitas não vira saldo zero, reserva não vira dívida da unidade", () => {
  const b={id:"b",documentoId:null,periodo:"2026-10",receitasCentavos:null,despesasCentavos:10000,reservaCentavos:500000,inadimplenciaCentavos:null,fonte:"Balancete, p1",pagina:1,registradoEm:EM};
  expect(saldoDoBalancete(b)).toBeNull(); expect(saldoDoBalancete({...b,receitasCentavos:0})).toBe(-10000);
 });
 it("cronologia não usa recebimento como inspeção e conserva data desconhecida", () => {
  const c=cadernoVazio(); c.documentos=[{id:"doc",titulo:"Fachada",tipo:"laudo",inspecaoEm:null,emitidoEm:"2026-01-01",recebidoEm:EM,origem:"Documento apresentado",escopo:"fachada",trecho:"",pagina:null,vinculo:"a_confirmar"}];
  const linha=linhaDoTempo(analiseDeTeste("a",{caderno:c})); expect(linha).toHaveLength(2); expect(linha.at(-1)?.data).toBeNull(); expect(linha.some(e=>e.data===EM)).toBe(false);
 });
 it("reagendamento cancela o antigo; repetição não duplica; descarte/exclusão eliminam avisos", () => {
  const c={...cadernoVazio(),lembretes:[{id:"l",titulo:"Visitar",em:"2027-01-01T17:00:00.000Z",fuso:"America/Recife",notificar:true,estado:"ativo" as const}]};
  const a=analiseDeTeste("a",{caderno:c}); const atuais=lembretesDesejados([a],Date.parse(EM));
  expect(mudancasDeAgendamento(atuais,atuais)).toEqual({cancelar:[],agendar:[]});
  const novo=atuais.map(r=>({...r,em:"2027-01-02T17:00:00.000Z"})); expect(mudancasDeAgendamento(atuais,novo)).toEqual({cancelar:atuais,agendar:novo});
  expect(lembretesDesejados([],Date.parse(EM))).toEqual([]); expect(lembretesDesejados([analiseDeTeste("a",{caderno:c,descarte:{em:EM,motivo:"outro",observacao:""}})],Date.parse(EM))).toEqual([]);
 });
 it("recusa fuso/data inválidos e conserva horário com offset", () => {
  expect(dataDoLembrete("2027-01-01T14:00-03:00","America/Recife")).toBe("2027-01-01T17:00:00.000Z");
  for(const data of ["2026-02-30T14:00-03:00","2026-11-01T24:00-03:00","2026-11-01T14:00"]) expect(()=>dataDoLembrete(data,"America/Recife")).toThrow();
  const c={...cadernoVazio(),lembretes:[{id:"l",titulo:"Visitar",em:EM,fuso:"Inventado/Falso",notificar:false,estado:"ativo"}]}; expect(esquemaCaderno.safeParse(c).success).toBe(false);
 });
 it("arquivo da extensão exige versão/URL/conteúdo corretos; hash não dá autoridade de fato", async () => {
  const hash=async(v:string)=>createHash("sha256").update(v).digest("hex"); const url="https://www.vivareal.com.br/imovel/teste/",texto="Aluguel R$ 2.500";
  const v={formato:"vereda-anuncio",versao:1,id:"ext-"+(await hash(url+"\n"+texto)).slice(0,40),url,titulo:"Página escolhida",texto};
  expect(await lerArquivoDaExtensao(JSON.stringify(v),hash)).toEqual(v);
  await expect(lerArquivoDaExtensao(JSON.stringify({...v,texto:"Alterado"}),hash)).rejects.toThrow("identificador");
  await expect(lerArquivoDaExtensao(JSON.stringify({...v,url:"javascript:alert(1)"}),hash)).rejects.toThrow();
 });
});
