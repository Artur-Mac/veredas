import { expect, it } from "@jest/globals";
import { proporBalancete } from "../src/dados/propostasBalancete";
import { esquemaDocumentoPessoal, esquemaCaderno, cadernoVazio } from "../src/dados/caderno";
import { corpusDocumentos } from "./fixtures/corpus-documentos";
const em = "2026-10-22T12:00:00.000Z";
function documento(v: typeof corpusDocumentos[number]) {
 return esquemaDocumentoPessoal.parse({id:v.id,tipo:v.tipo,titulo:"Documento sintético",trecho:v.texto,origem:"Corpus de teste",pagina:3,inspecaoEm:null,emitidoEm:null,recebidoEm:em,escopo:"",vinculo:"a_confirmar"});
}
it.each(corpusDocumentos)("corpus $id: abstém ou propõe valor rastreável sem executar instruções", v => {
 const d=documento(v),p=proporBalancete(d);
 expect(Object.fromEntries(p.propostas.map(p=>[p.campo,p.centavos]))).toEqual(v.esperado);
 for(const e of p.propostas){expect(d.trecho.includes(e.trecho)).toBe(true);expect(e.pagina).toBe(3);expect(e.documentoId).toBe(d.id);}
});
it("conflito fica pendente; outro imóvel e tipos incompatíveis nunca viram achado",()=>{
 const d=documento(corpusDocumentos[1]);expect(proporBalancete(d).ambiguos).toEqual(["receitasCentavos"]);
 expect(proporBalancete({...d,vinculo:"outro_imovel"})).toEqual({propostas:[],ambiguos:[]});
 const c={...cadernoVazio(),documentos:[d],balancetes:[{id:"b",documentoId:d.id,periodo:"2026-10",receitasCentavos:null,despesasCentavos:0,reservaCentavos:null,inadimplenciaCentavos:null,fonte:d.origem,pagina:3,registradoEm:em,evidencias:proporBalancete(d).propostas}]};
 expect(esquemaCaderno.parse(c).balancetes?.[0]?.evidencias?.[0]?.centavos).toBe(0);
 expect(esquemaCaderno.safeParse(cadernoVazio()).success).toBe(true);
});
