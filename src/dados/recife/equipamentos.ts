// Equipamentos por perto (15/11/2026): só redige o que scripts/dados/equipamentos/rodar-equipamentos.mjs calculou.
// Tudo é cadastro da Prefeitura: não diz horário, funcionamento, manutenção nem acesso atual. Distâncias em linha reta.
// Semáforo sonoro só aparece quando o perfil da casa pede acessibilidade (visão); a contagem de semáforos fica atrás do
// toque. Primeiro a consequência ("praça grande a 5 min"), depois o nome e o número.
import { z } from "zod";
import { lerCamada } from "../camadas";
import { formatarNumero } from "../formatos";
import { ARQUIVOS_DOS_EQUIPAMENTOS, FONTES_DOS_EQUIPAMENTOS, VERSAO_DOS_EQUIPAMENTOS } from "./equipamentosGerado";

export const arquivoDosEquipamentos = (bairro: string | null | undefined): string | null =>
  (bairro ? ARQUIVOS_DOS_EQUIPAMENTOS[bairro] ?? null : null);

const metros = z.number().int().nonnegative();
const par = z.tuple([z.number().int().nonnegative(), metros]);
const esquema = z.strictObject({
  versao: z.string(),
  raioSemaforosM: z.number(),
  locais: z.strictObject({
    b: z.array(z.tuple([z.string(), z.number().nullable()])),
    s: z.array(z.tuple([z.string(), z.string()])),
    a: z.array(z.tuple([z.string(), z.string()])),
    c: z.array(z.tuple([z.string(), z.string()])),
    u: z.array(z.tuple([z.string(), z.number()])),
    p: z.array(z.tuple([z.string().nullable(), z.string(), z.number()])),
  }),
  predios: z.record(z.string(), z.strictObject({
    sem: z.number().int().nonnegative(),
    son: z.number().int().nonnegative(),
    sonM: metros.optional(),
    pc: metros.optional(),
    bk: par.optional(),
    cv: metros.optional(),
    cc: metros.optional(),
    sd: par.optional(),
    ac: par.optional(),
    ct: par.optional(),
    uc: par.optional(),
    pq: par.optional(),
    pg: par.optional(),
  })),
});
export type EquipamentosDoBairro = z.infer<typeof esquema>;
export type EquipamentosDoPredio = EquipamentosDoBairro["predios"][string];

const cache = new Map<string, EquipamentosDoBairro | null>();
export function equipamentosDoBairro(bairro: string | null | undefined): EquipamentosDoBairro | null {
  if (!bairro) return null;
  if (!cache.has(bairro)) {
    const c = arquivoDosEquipamentos(bairro);
    const p = c ? esquema.safeParse(lerCamada(c)) : null;
    cache.set(bairro, p?.success && p.data.versao === VERSAO_DOS_EQUIPAMENTOS ? p.data : null);
  }
  return cache.get(bairro) ?? null;
}

export type NecessidadeDeAcesso = "mobilidade" | "visao";

export type FatoDeEquipamento = {
  id: "praca" | "praca_maior" | "ciclovia" | "conecta" | "bike" | "paraciclo" | "saude" | "academia" | "cultura" | "ucn" | "sonoro";
  /** A consequência em linguagem simples, primeiro. */
  frase: string;
  /** O que sustenta a frase: nome, tipo, tamanho e distância em linha reta. */
  detalhe: string;
  metros: number;
};

/** A pé a ~80 m por minuto, sobre a distância em linha reta (o caminho real costuma ser mais longo). */
const minutos = (m: number) => Math.max(1, Math.round(m / 80));
export const distanciaEmTexto = (m: number) => (m === 0 ? "no local" : m < 1000 ? `a ~${formatarNumero(m)} m` : `a ~${formatarNumero(Math.round(m / 100) / 10)} km`);
const area = (m2: number) => (m2 >= 10_000 ? `${formatarNumero(Math.round(m2 / 1000) / 10)} ha` : `${formatarNumero(Math.round(m2 / 100) * 100)} m²`);
const minusculo = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** Fatos de equipamento perto do prédio, em ordem de distância. Sonoro só com `acesso` incluindo "visao". */
export function fatosDeEquipamentos(bairro: string | null | undefined, predioId: string | null | undefined, acesso: readonly NecessidadeDeAcesso[] = []): FatoDeEquipamento[] {
  const d = equipamentosDoBairro(bairro);
  const e = predioId ? d?.predios[predioId] : undefined;
  if (!d || !e) return [];
  const L = d.locais;
  const fatos: FatoDeEquipamento[] = [];
  if (e.pq) {
    const [nome, tipo, m2] = L.p[e.pq[0]]!;
    const grande = m2 >= 10_000;
    fatos.push({ id: "praca", metros: e.pq[1],
      frase: e.pq[1] === 0 ? `O prédio encosta numa ${tipo === "Parque" ? "área de parque" : "praça"}.` : `${grande ? (tipo === "Parque" ? "Parque" : "Praça grande") : tipo} a ~${minutos(e.pq[1])} min a pé em linha reta.`,
      detalhe: `${nome ?? `${tipo} sem nome no cadastro`}, ${area(m2)}, ${distanciaEmTexto(e.pq[1])} em linha reta.` });
  }
  if (e.pg) {
    const [nome, tipo, m2] = L.p[e.pg[0]]!;
    fatos.push({ id: "praca_maior", metros: e.pg[1], frase: `${tipo === "Parque" ? "Parque" : "Praça maior"} a ~${minutos(e.pg[1])} min a pé em linha reta.`,
      detalhe: `${nome ?? `${tipo} sem nome no cadastro`}, ${area(m2)}, ${distanciaEmTexto(e.pg[1])} em linha reta.` });
  }
  if (e.cv !== undefined) fatos.push({ id: "ciclovia", metros: e.cv, frase: e.cv <= 150 ? "Ciclovia ou ciclofaixa permanente na rua ou ao lado." : `Ciclovia ou ciclofaixa permanente a ~${minutos(e.cv)} min a pé em linha reta.`, detalhe: `Malha cicloviária permanente, ${distanciaEmTexto(e.cv)} em linha reta.` });
  else if (e.cc !== undefined) fatos.push({ id: "conecta", metros: e.cc, frase: `Rota ciclável do Conecta a ~${minutos(e.cc)} min a pé em linha reta.`, detalhe: `Rotas cicláveis do Conecta (ciclorrota, ciclofaixa ou área compartilhada), ${distanciaEmTexto(e.cc)} em linha reta.` });
  if (e.bk) {
    const [nome, cap] = L.b[e.bk[0]]!;
    fatos.push({ id: "bike", metros: e.bk[1], frase: `Estação do Bike PE a ~${minutos(e.bk[1])} min a pé em linha reta.`, detalhe: `${nome}${cap ? `, ${cap} vagas` : ""}, ${distanciaEmTexto(e.bk[1])} em linha reta.` });
  } else if (e.pc !== undefined) fatos.push({ id: "paraciclo", metros: e.pc, frase: `Paraciclo público a ~${minutos(e.pc)} min a pé em linha reta.`, detalhe: `Paraciclo cadastrado, ${distanciaEmTexto(e.pc)} em linha reta.` });
  if (e.sd) {
    const [nome, tipo] = L.s[e.sd[0]]!;
    fatos.push({ id: "saude", metros: e.sd[1], frase: e.sd[1] <= 2400 ? `Unidade de saúde municipal a ~${minutos(e.sd[1])} min a pé em linha reta.` : `Unidade de saúde municipal ${distanciaEmTexto(e.sd[1])}.`, detalhe: `${nome} (${minusculo(tipo)}), ${distanciaEmTexto(e.sd[1])} em linha reta.` });
  }
  if (e.ac) {
    const [nome] = L.a[e.ac[0]]!;
    fatos.push({ id: "academia", metros: e.ac[1], frase: `Academia da Cidade a ~${minutos(e.ac[1])} min a pé em linha reta.`, detalhe: `${nome}, ${distanciaEmTexto(e.ac[1])} em linha reta.` });
  }
  if (e.ct) {
    const [nome, tipo] = L.c[e.ct[0]]!;
    fatos.push({ id: "cultura", metros: e.ct[1], frase: `Cultura ou lazer público ${distanciaEmTexto(e.ct[1])}.`, detalhe: `${nome} (${minusculo(tipo)}), ${distanciaEmTexto(e.ct[1])} em linha reta.` });
  }
  if (e.uc) {
    const [nome, ha] = L.u[e.uc[0]]!;
    fatos.push({ id: "ucn", metros: e.uc[1], frase: e.uc[1] === 0 ? "O lote fica dentro de uma unidade de conservação: pode haver regras extras para obras." : `Unidade de conservação ${distanciaEmTexto(e.uc[1])}.`, detalhe: `${nome}, ${formatarNumero(ha)} ha, ${distanciaEmTexto(e.uc[1])} em linha reta.` });
  }
  if (acesso.includes("visao") && e.sonM !== undefined) {
    fatos.push({ id: "sonoro", metros: e.sonM, frase: e.son > 0 ? `Semáforo com sinal sonoro a até ${d.raioSemaforosM} m.` : `Semáforo com sinal sonoro a ~${minutos(e.sonM)} min a pé em linha reta.`,
      detalhe: `${e.son > 0 ? `${e.son} a até ${d.raioSemaforosM} m; o mais perto ` : "O mais perto "}${distanciaEmTexto(e.sonM)} em linha reta. O cadastro não diz se o sinal funciona hoje (pedido P09).` });
  }
  return fatos.sort((a, b) => a.metros - b.metros);
}

/** Linha de contagem que fica atrás do toque: semáforos a até 150 m. */
export function semaforosPerto(bairro: string | null | undefined, predioId: string | null | undefined): string | null {
  const d = equipamentosDoBairro(bairro);
  const e = predioId ? d?.predios[predioId] : undefined;
  if (!d || !e) return null;
  return e.sem === 0 ? `Nenhum semáforo cadastrado a até ${d.raioSemaforosM} m.` : `${e.sem} ${e.sem === 1 ? "semáforo cadastrado" : "semáforos cadastrados"} a até ${d.raioSemaforosM} m.`;
}

export const AVISO_DOS_EQUIPAMENTOS = "Cadastro da Prefeitura: não diz horário, funcionamento nem manutenção. Distâncias em linha reta; o caminho a pé costuma ser maior.";

export function fonteDosEquipamentos(): string {
  const fontes: readonly { modificadoEm: string | null }[] = FONTES_DOS_EQUIPAMENTOS;
  const datas = fontes.map((f) => f.modificadoEm).filter((x): x is string => typeof x === "string").sort();
  const ultima = datas.at(-1);
  return `Dados Abertos do Recife (ODbL): semáforos, paraciclos, Bike PE, malha cicloviária, saúde municipal, cultura e lazer, unidades de conservação e praças (ESIG). Extraído em 15/11/2026${ultima ? `; publicação mais recente ${ultima.slice(8, 10)}/${ultima.slice(5, 7)}/${ultima.slice(0, 4)}` : ""}.`;
}
