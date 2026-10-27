import { expect, it } from "@jest/globals";
import { edificiosDoBairro } from "../src/dados/recife/indice";
import { eventosDoIndice } from "../src/dados/cronologiaPublica";
it("conserva precisão e alcance: ano fiscal agregado e entrada mensal de licença próxima",()=>{
 const e=edificiosDoBairro("casa-forte")[0]!;
 const eventos=eventosDoIndice({...e,anoConstrucao:1998,itbi:{transmissoes:2,desde:2024,ate:2024,valorUnidade:null,porAno:[[2024,2]]},obras150m:{licencasDeObra:1,relevantes24m:1,demolicoes24m:0,recentes:[[0,80]]}},
 {geradoEm:"2026-10-22T12:00:00Z",obras:[{categoria:"construcao",descricao:"ALVARÁ SINTÉTICO",data:"2026-08",situacao:null,centro:e.centro}]});
 expect(eventos.map(e=>e.data)).toEqual(["1998","2024","2026-08"]);
 expect(eventos[1]?.tipoDeData).toContain("não histórico de compra da sua unidade");
 expect(eventos[2]?.tipoDeData).toContain("Não comprova início, conclusão ou relação com este edifício");
 expect(eventos.every(e=>e.fonte.includes("Prefeitura do Recife"))).toBe(true);
});
