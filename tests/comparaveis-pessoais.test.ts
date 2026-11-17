import { expect, it } from "@jest/globals";
import { comparaveisPessoais } from "../src/dados/comparaveisPessoais";
import { analiseDeTeste } from "./fixtures/caderno";
const referencia=analiseDeTeste("ref",{bairroTexto:"Casa Forte",url:"https://anuncio.test/ref"});
const f={bairro:"casa fórte",areaMin:null,areaMax:null};
it("filtra por modalidade, tipologia e bairro; dados ausentes não ganham área inferida",()=>{
 const bom=analiseDeTeste("bom",{bairroTexto:"Casa Forte",url:"https://anuncio.test/bom"});
 const compra=analiseDeTeste("compra",{modalidade:"compra",bairroTexto:"Casa Forte"});
 const ausente={...bom,id:"sem-area",url:"",declarados:{...bom.declarados,area:{...bom.declarados.area,valor:null}}};
 expect(comparaveisPessoais([referencia,bom,compra,ausente],referencia,f).map(v=>v.id)).toEqual(["bom","sem-area"]);
 expect(comparaveisPessoais([ausente],referencia,{...f,areaMin:1})).toEqual([]);
 expect(()=>comparaveisPessoais([],referencia,{...f,areaMin:100,areaMax:50})).toThrow();
});
it("remove URL repetida com rastreamento, mas não junta unidades diferentes do mesmo edifício",()=>{
 const a=analiseDeTeste("a",{bairroTexto:"Casa Forte",url:"https://anuncio.test/unidade?utm_source=x"});
 const b={...a,id:"b",url:"https://anuncio.test/unidade?utm_source=y"};
 const c={...a,id:"c",url:"https://anuncio.test/outra-unidade"};
 expect(comparaveisPessoais([a,b,c],referencia,f).map(v=>v.id)).toEqual(["a","c"]);
 expect(comparaveisPessoais([{...a,url:referencia.url}],referencia,f)).toEqual([]);
});
