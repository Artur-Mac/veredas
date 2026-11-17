import { describe, expect, it, jest, afterEach } from "@jest/globals";
import referencias from "./fixtures/solar-noaa.json";
import { esquemaAnaliseV2, esquemaEdificio } from "../src/dados/contratos";
import { exportarCaderno, lerBackup } from "../src/dados/backup";
import { prepararOutraVisita } from "../src/dados/sessoes";
import { diaNoRecife, instanteNoRecife, posicaoDoSol } from "../src/dados/sol/astronomia";
import { iniciarCaptura, mediaCircular, type EstadoDaBussola, type FonteDeRumo } from "../src/dados/sol/captura";
import { esquemaJanelaSolar, type JanelaSolar } from "../src/dados/sol/contratos";
import { duracaoPotencial, emCoordenadas, intervalosDoRaio, lerExposicao, trajetoria, type Ponto, type RecorteSolar, type VolumeSolar } from "../src/dados/sol/geometria";
import { guardarJanela, migrarJanelasLegadas, registroSolar, removerJanela } from "../src/dados/sol/janelas";
import { analiseDeTeste as analiseVazia } from "./fixtures/caderno";
import { carregarEntornoSolar } from "../src/dados/sol/entorno";
import indice from "../src/dados/recife/indice-municipal/91b71d239c1847cf/casa-forte.json";

const em = "2026-10-27T12:00:00.000Z";
const centro: Ponto = [-34.9, -8.05];
const janela: JanelaSolar = { id: "janela-sala", nome: "Sala", graus: 90, referencia: "verdadeiro", origem: "manual", observadoEm: em,
  revisadoEm: em, calibracao: null, coordenada: { longitude: centro[0], latitude: centro[1], origem: "cadastro", precisaoM: null },
  andar: 0, posicao: { volumeId: "proprio", longitude: centro[0], latitude: centro[1], geometriaVersao: "teste", origem: "fachada_informada" }, protecoes: [] };
function retangulo(x1: number, y1: number, x2: number, y2: number): Ponto[] { return [[x1,y1],[x2,y1],[x2,y2],[x1,y2],[x1,y1]]; }
function volume(id: string, altura: number | null, ring = retangulo(10, -100, 20, 100)): VolumeSolar {
  return { id, dsqfl: "00000000000001", aneis: [ring.map(p => emCoordenadas(p, centro))], alturaM: altura,
    alturaMinM: altura, alturaMaxM: altura, baseM: 0, origemAltura: altura === null ? "desconhecida" : "pavimentos_cadastrais" };
}
const proprio = volume("proprio", 10, retangulo(-10,-5,-.1,5));
function recorte(...vs: VolumeSolar[]): RecorteSolar { return { versao: "teste", fonteEm: "2026-03-02", centro, raioM: 1000, cobertura: "cadastral_parcial", volumes: [proprio,...vs] }; }

describe("posição solar independente e calendário de Recife", () => {
  for (const caso of referencias.casos) it(`${caso.dia} ${caso.minutos} min`, () => {
    const sol=posicaoDoSol(instanteNoRecife(caso.dia,caso.minutos),referencias);
    const delta=Math.abs(((sol.azimute-caso.azimute+540)%360)-180);
    if (Math.abs(caso.elevacao) < 85) expect(delta).toBeLessThan(.5);
    if (caso.elevacao > 85) {
      const a=caso.azimute*Math.PI/180,e=caso.elevacao*Math.PI/180;
      const v=[Math.cos(e)*Math.sin(a),Math.cos(e)*Math.cos(a),Math.sin(e)];
      expect(Math.acos(Math.min(1,sol.vetor.reduce((s,n,i)=>s+n*v[i]!,0)))*180/Math.PI).toBeLessThan(.5);
    }
    if (caso.geometrica > 0) expect(Math.abs(sol.elevacao-caso.elevacao)).toBeLessThan(.5);
    else expect(sol.elevacao).toBeLessThan(0); // refração da biblioteca é limitada ao horizonte abaixo de 0°
  });
  it("não usa o fuso do processo, rejeita datas normalizadas e respeita ano bissexto", () => {
    expect(instanteNoRecife("2026-10-27",0).toISOString()).toBe("2026-10-27T03:00:00.000Z");
    expect(diaNoRecife(new Date("2026-10-27T01:00:00Z"))).toBe("2026-10-26");
    expect(()=>instanteNoRecife("2026-02-29",0)).toThrow();
    expect(()=>instanteNoRecife("2024-02-29",0)).not.toThrow();
    expect(()=>instanteNoRecife("2026-04-31",0)).toThrow();
  });
});
describe("raio contra volumes, sem cones ou centroides", () => {
  it("atravessa dois trechos e respeita o vazio no polígono", () => {
    expect(intervalosDoRaio([0,0],[1,0],[retangulo(10,-10,30,10),retangulo(15,-5,25,5)])).toEqual([[10,15],[25,30]]);
    expect(intervalosDoRaio([20,0],[0,1],[retangulo(10,-10,30,10),retangulo(15,-5,25,5)])).toEqual([[5,10]]);
    expect(intervalosDoRaio([20,0],[1,0],[retangulo(10,-10,30,10)])).toEqual([[0,10]]);
  });
  it("distingue obstáculos à frente, atrás, largos e estreitos e alturas desconhecidas", () => {
    expect(lerExposicao(janela,"2026-03-20",510,recorte(volume("alto",80))).estado).toBe("bloqueado_no_modelo");
    expect(lerExposicao(janela,"2026-03-20",510,recorte(volume("atras",80,retangulo(-30,-100,-20,100)))).estado).toBe("sol_potencial");
    expect(lerExposicao(janela,"2026-03-20",510,recorte(volume("baixo",.1))).estado).toBe("sol_potencial");
    expect(lerExposicao(janela,"2026-03-20",510,recorte(volume("desconhecido",null))).estado).toBe("indeterminado");
    expect(lerExposicao(janela,"2026-03-20",510,recorte(volume("lateral",80,retangulo(10,-60,20,-50)))).estado).toBe("sol_potencial");
  });
  it("não inventa andar; considera o próprio edifício e distingue noite e face oposta", () => {
    expect(lerExposicao({...janela,andar:null},"2026-03-20",510,recorte(volume("alto",80))).estado).toBe("sol_potencial");
    expect(lerExposicao(janela,"2026-03-20",1320,recorte(volume("alto",80))).estado).toBe("noite");
    expect(lerExposicao({...janela,graus:270},"2026-03-20",510,recorte(volume("alto",80))).estado).toBe("sol_atras_da_face");
    expect(lerExposicao(janela,"2026-03-20",510,recorte(volume("proprio-recuo",80))).obstaculoId).toBe("proprio-recuo");
    expect(lerExposicao({...janela,referencia:"magnetico"},"2026-03-20",510).estado).toBe("indeterminado");
    expect(lerExposicao({...janela,posicao:{...janela.posicao!,geometriaVersao:"antiga"}},"2026-03-20",510,recorte()).estado).toBe("indeterminado");
    const sol = posicaoDoSol(instanteNoRecife("2026-03-20",510),janela.coordenada!);
    expect(lerExposicao({...janela,graus:Math.round((sol.azimute+88)%360)},"2026-03-20",510).estado).toBe("indeterminado");
  });
  it("retirar um obstáculo não reduz exposição; intervalos não duplicam endpoints", () => {
    const r=recorte(volume("alto",80));
    const com=duracaoPotencial(trajetoria(janela,"2026-03-20",r));
    const sem=duracaoPotencial(trajetoria(janela,"2026-03-20",r,"alto"));
    expect(com.minimo).toBeLessThanOrEqual(sem.minimo); expect(com.maximo).toBeLessThanOrEqual(sem.maximo);
    const grosso=duracaoPotencial(trajetoria(janela,"2026-03-20",null,undefined,10));
    const fino=duracaoPotencial(trajetoria(janela,"2026-03-20",null,undefined,5));
    expect(Math.abs(grosso.minimo-fino.minimo)).toBeLessThanOrEqual(10);
    expect(trajetoria(janela,"2026-03-20").reduce((s,p)=>s+p.duracao,0)).toBe(1440);
  });
  it("respeita a cota da base e distingue passagem sob um volume de sua interseção",()=>{
    const elevado={...volume("elevado",20,retangulo(10,-100,100,100)),baseM:30};
    expect(lerExposicao(janela,"2026-03-20",510,recorte(elevado)).estado).toBe("bloqueado_no_modelo");
    const passagem={...volume("passagem",20),baseM:100};
    expect(lerExposicao(janela,"2026-03-20",510,recorte(passagem)).estado).toBe("sol_potencial");
  });
});
describe("janelas no caderno, migração e backup", () => {
  it("migra sem inventar sala/data/precisão e é idempotente", () => {
    const base=analiseVazia();base.visita.orientacaoGraus=270;
    const a=migrarJanelasLegadas(base),j=registroSolar(a).janelas[0]!;
    expect(j.nome).toBe("Janela registrada");expect(j.observadoEm).toBeNull();expect(j.referencia).toBe("desconhecido");
    expect(migrarJanelasLegadas(a)).toBe(a);
    expect(registroSolar(removerJanela(a,j.id,em)).janelas).toEqual([]);
  });
  it("preserva múltiplas janelas entre visitas, edições e restauração", () => {
    let a=guardarJanela(analiseVazia(),janela,em);
    a=guardarJanela(a,{...janela,id:"janela-quarto",nome:"Quarto",graus:270},em);
    a=prepararOutraVisita(a,em,"visita-2");
    expect(registroSolar(a).janelas).toHaveLength(2);
    expect(registroSolar(lerBackup(exportarCaderno([a],em))[0]!).janelas).toEqual(registroSolar(a).janelas);
    expect(esquemaAnaliseV2.safeParse(a).success).toBe(true);
    expect(esquemaJanelaSolar.safeParse({...janela,origem:"bussola",calibracao:null}).success).toBe(false);
  });
});
describe("captura e ciclo de vida", () => {
  const concluirPromessas = async () => { for (let i=0;i<10;i++) await Promise.resolve(); };
  afterEach(()=>{ jest.useRealTimers(); });
  it("suaviza a passagem 359°→0° sem apontar para o sul",()=>{
    const media=mediaCircular([359,0,1]);expect(Math.min(media,360-media)).toBeLessThan(.01);
  });
  it("cancela uma assinatura que só resolve depois da saída da tela",async()=>{
    let liberar!: (f:()=>void)=>void;
    const remover=jest.fn();
    const fonte:FonteDeRumo={preparar:async()=>null,observar:()=>new Promise(resolve=>{liberar=resolve;})};
    const receber=jest.fn();const parar=iniciarCaptura(fonte,receber);
    await concluirPromessas();parar();liberar(remover);await concluirPromessas();
    expect(remover).toHaveBeenCalledTimes(1);expect(receber).toHaveBeenCalledTimes(1);
  });
  it("encerra por timeout e não usa rumo magnético inválido como verdadeiro",async()=>{
    jest.useFakeTimers();let callback!:(g:number,c:number)=>void;const remover=jest.fn();const estados:EstadoDaBussola[]=[];
    const fonte:FonteDeRumo={preparar:async()=>null,observar:async cb=>{callback=cb;return remover;}};
    iniciarCaptura(fonte,e=>estados.push(e));await concluirPromessas();
    callback(-1,3);expect(estados.at(-1)?.estado).toBe("indisponivel");expect(remover).toHaveBeenCalledTimes(1);
    iniciarCaptura(fonte,e=>estados.push(e));await concluirPromessas();jest.advanceTimersByTime(12000);
    expect(estados.at(-1)?.estado).toBe("indisponivel");expect(remover).toHaveBeenCalledTimes(2);
  });
  it("exige estabilidade e qualidade, e não assina após cancelar a permissão pendente",async()=>{
    let callback!:(g:number,c:number)=>void;let agora=0;const estados:EstadoDaBussola[]=[];
    const remover=jest.fn();const parar=iniciarCaptura({preparar:async()=>null,observar:async cb=>{callback=cb;return remover;}},e=>estados.push(e),()=>agora);
    await concluirPromessas();
    for(let i=0;i<6;i++){agora=i*400;callback(i%2===0?359:1,3);}
    expect(estados.at(-1)).toMatchObject({estado:"leitura",estavel:true});
    callback(100,0);expect(estados.at(-1)).toMatchObject({estado:"leitura",estavel:false});parar();
    let permitir!:(v:null)=>void;const observar=jest.fn<FonteDeRumo['observar']>();
    const cancelar=iniciarCaptura({preparar:()=>new Promise(resolve=>{permitir=resolve;}),observar},()=>{});
    await concluirPromessas();cancelar();permitir(null);await concluirPromessas();expect(observar).not.toHaveBeenCalled();
  });
  it("permite continuar sem sensor quando a permissão falha",async()=>{
    const estados:EstadoDaBussola[]=[];
    iniciarCaptura({preparar:async()=>{throw new Error("negada");},observar:async()=>()=>{}},e=>estados.push(e));
    await concluirPromessas();expect(estados.at(-1)?.estado).toBe("indisponivel");
  });
});
describe("contornos municipais preparados",()=>{
  it("usa pavimentos construídos e exige associação validada, sem extrudir o lote",()=>{
    const e=esquemaEdificio.parse(indice.edificios.find(e=>e.id==='19526-1070'));
    const dados=carregarEntornoSolar(e)!;
    expect(dados.volumesDoImovel.length).toBeGreaterThan(0);
    expect(dados.recorte.volumes.some(v=>v.alturaM===null)).toBe(true);
    expect(dados.volumesDoImovel.every(v=>v.dsqfl===e.dsqfl)).toBe(true);
    expect(dados.volumesDoImovel[0]!.aneis[0]).not.toEqual(e.poligono);
    expect(dados.recorte.raioM).toBeGreaterThanOrEqual(100);
    expect(carregarEntornoSolar({...e,bairro:'apipucos'})).toBeNull();
    expect(carregarEntornoSolar({...e,dsqfl:'00000000000000'})?.volumesDoImovel).toEqual([]);
  });
});
