import { expect, it } from "@jest/globals";
import { horizonte } from "../src/dados/orcamento";
import { esquemaCenario } from "../src/dados/caderno";
import { analiseDeTeste, EM } from "./fixtures/caderno";
const a=analiseDeTeste("a");
const base={id:"cenario",nome:"12 meses",meses:12,despesasIniciaisCentavos:10000,caucaoCentavos:100000,extrasMensaisCentavos:5000,registradoEm:EM};
const item=(id:string,categoria:"inicial"|"mensal"|"reembolsavel",valorCentavos:number|null,duracaoMeses:number|null=null)=>({id,titulo:id,categoria,valorCentavos,duracaoMeses,fonte:"Hipótese sintética"});
it("itens substituem os agregados sem duplicar; extra temporário não dura todo o horizonte",()=>{
 const c=esquemaCenario.parse({...base,itens:[item("mudanca","inicial",50000),item("rateio","mensal",20000,3),item("caucao","reembolsavel",500000)]});
 const h=horizonte(a,c),mensal=h.mensalConhecidoCentavos??0;
 expect(h.despesaConhecidaCentavos).toBe(mensal*12+50000+20000*3);expect(h.caixaInicialConhecidoCentavos).toBe(550000);expect(h.caucaoCentavos).toBe(500000);
 const legado=horizonte(a,{...c,usarItens:false});expect(legado.despesaConhecidaCentavos).toBe(mensal*12+10000+5000*12);expect(c.itens).toHaveLength(3);
});
it("categoria ausente e item desconhecido continuam parciais; zero e duração limitada são conhecidos",()=>{
 const c={...base,itens:[item("rateio","mensal",20000,30),item("extra","mensal",null)]};
 const h=horizonte(a,c);expect(h.completo).toBe(false);expect(h.caucaoCentavos).toBeNull();expect(h.despesaConhecidaCentavos).toBe((h.mensalConhecidoCentavos??0)*12+20000*12);
 expect(horizonte(a,{...base,itens:[item("zero","reembolsavel",0)]}).caucaoCentavos).toBe(0);
});
it("horizonte inválido e soma que perde precisão são recusados",()=>{
 expect(()=>horizonte(a,{...base,meses:0})).toThrow();
 expect(()=>horizonte(a,{...base,meses:600,itens:Array.from({length:50},(_,i)=>item(`v-${i}`,"mensal",1e12))})).toThrow("precisão monetária");
 expect(esquemaCenario.safeParse(base).success).toBe(true);
});
