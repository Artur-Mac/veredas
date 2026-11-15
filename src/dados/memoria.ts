// Memória do dossiê (VE09): um retrato semântico do que o dossiê mostra para um imóvel, guardado só numa ação deliberada
// (salvar o imóvel ou "guardar como visto hoje"), e as mudanças desde esse retrato, classificadas pelo que significam:
// - "mundo": algo aconteceu depois do retrato (licença nova, situação que mudou, atendimento num ano em curso, grade nova);
// - "antigo": um registro com data anterior ao retrato que só apareceu agora (não é novidade no mundo);
// - "correcao": a base corrigiu ou reclassificou o passado (contagem de um ano fechado mudou, registro sumiu);
// - "anuncio": valores do anúncio ou informados por você;
// - "mapa": o catálogo do mapa mudou (não dá para separar loja nova de mapeamento novo).
// Diferença só de grafia (acento, caixa, espaço, pontuação) não é mudança. Republicação sem mudança de fatos não gera
// nada. Sumir de uma base nunca vira "fechou", "vendeu" ou "terminou".
import { z } from "zod";

export const esquemaFato = z.strictObject({
  id: z.string().max(200),
  grupo: z.enum(["custo", "obras", "defesa_civil", "essenciais", "noite", "transito"]),
  rotulo: z.string().max(200),
  valor: z.union([z.string().max(300), z.number(), z.null()]),
  /** Data do registro na fonte (AAAA, AAAA-MM ou AAAA-MM-DD), quando existe. */
  data: z.string().max(10).nullable(),
});
export const esquemaInstantaneo = z.strictObject({
  versao: z.literal(1),
  em: z.iso.datetime(),
  /** Versão de cada base usada no retrato (ex.: indice → pasta publicada). */
  fontes: z.record(z.string().max(40), z.string().max(80)),
  fatos: z.array(esquemaFato).max(400),
});
export type Fato = z.infer<typeof esquemaFato>;
export type Instantaneo = z.infer<typeof esquemaInstantaneo>;

const normal = (v: Fato["valor"]) => (typeof v === "string" ? v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() : v);
const chaveTexto = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// ——— Retrato ———————————————————————————————————————————————————————————————————————————————————

type Declarado = { valor: number | null };
export type EntradasDoRetrato = {
  em: string;
  fontes: Record<string, string>;
  declarados: { preco: Declarado; condominio: Declarado; iptu: Declarado & { periodo?: string | null }; seguroIncendio: Declarado };
  /** Licenças a até 150 m (24 meses) já resolvidas contra o índice. */
  obras: { categoria: string; descricao: string; data: string; situacao: string | null; centro: [number, number]; distanciaM: number }[];
  /** Defesa Civil na rua do prédio (índice). */
  defesaCivil: { porAno: [number, number][]; acoesComunitarias?: number } | null;
  ruaDoPredio: string | null;
  essenciais: { categoria: string; nome: string | null; minutos: number | null }[];
  noite: { parada: string; ultima: number } | null;
};

const ROTULO_ESSENCIAL: Record<string, string> = { mercado: "Mercado mais perto", farmacia: "Farmácia mais perto", praca: "Praça ou parque mais perto", transporte: "Ponto de ônibus mais perto" };

export function retrato(e: EntradasDoRetrato): Instantaneo {
  const fatos: Fato[] = [];
  const d = e.declarados;
  fatos.push({ id: "custo:preco", grupo: "custo", rotulo: "Preço anunciado", valor: d.preco.valor, data: null });
  fatos.push({ id: "custo:condominio", grupo: "custo", rotulo: "Condomínio", valor: d.condominio.valor, data: null });
  fatos.push({ id: "custo:iptu", grupo: "custo", rotulo: "IPTU", valor: d.iptu.valor === null ? null : d.iptu.valor, data: null });
  fatos.push({ id: "custo:seguro", grupo: "custo", rotulo: "Seguro incêndio", valor: d.seguroIncendio.valor, data: null });
  for (const o of e.obras) {
    // Licença não tem número de processo no índice: a identidade é categoria + assunto + mês + posição (≈ 10 m).
    const id = `obra:${o.categoria}|${chaveTexto(o.descricao)}|${o.data}|${o.centro[0].toFixed(4)},${o.centro[1].toFixed(4)}`;
    fatos.push({ id, grupo: "obras", rotulo: `${o.descricao.charAt(0)}${o.descricao.slice(1).toLowerCase()} a ${o.distanciaM} m`, valor: o.situacao, data: o.data });
  }
  if (e.defesaCivil) {
    for (const [ano, n] of e.defesaCivil.porAno) fatos.push({ id: `dc:${ano}`, grupo: "defesa_civil", rotulo: `Atendimentos da Defesa Civil na rua em ${ano}`, valor: n, data: String(ano) });
    if (e.defesaCivil.acoesComunitarias !== undefined) fatos.push({ id: "dc:comunitarias", grupo: "defesa_civil", rotulo: "Ações comunitárias da Defesa Civil na rua (fora da conta)", valor: e.defesaCivil.acoesComunitarias, data: null });
  }
  for (const s of e.essenciais) fatos.push({ id: `ess:${s.categoria}`, grupo: "essenciais", rotulo: ROTULO_ESSENCIAL[s.categoria] ?? s.categoria, valor: s.nome === null && s.minutos === null ? null : `${s.nome ?? "sem nome no mapa"}|${s.minutos ?? "?"}`, data: null });
  if (e.noite) {
    fatos.push({ id: "noite:parada", grupo: "noite", rotulo: "Ponto com ônibus depois das 22h", valor: e.noite.parada, data: null });
    fatos.push({ id: "noite:ultima", grupo: "noite", rotulo: "Último ônibus programado nesse ponto", valor: e.noite.ultima, data: null });
  }
  if (e.fontes.gtfs) fatos.push({ id: "transito:grade", grupo: "transito", rotulo: "Grade de horários de ônibus e metrô", valor: e.fontes.gtfs, data: null });
  return { versao: 1, em: e.em, fontes: e.fontes, fatos };
}

// ——— Mudanças ——————————————————————————————————————————————————————————————————————————————————

export type Natureza = "mundo" | "antigo" | "correcao" | "anuncio" | "mapa";
export type Mudanca = { id: string; grupo: Fato["grupo"]; natureza: Natureza; frase: string; peso: number };

const reais = (v: number | null) => (v === null ? "não informado" : `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`);
const hora = (s: number) => { const x = s % 86400; return `${String(Math.floor(x / 3600)).padStart(2, "0")}:${String(Math.floor((x % 3600) / 60)).padStart(2, "0")}`; };
const mesBr = (aaaamm: string) => `${aaaamm.slice(5, 7)}/${aaaamm.slice(0, 4)}`;
/** Mês do registro (AAAA-MM) anterior ao mês do retrato: registro antigo que só agora apareceu. O mesmo mês fica como
 *  novo (pode ter entrado depois do dia do retrato). */
const anteriorAo = (data: string | null, em: string) => data !== null && data.slice(0, 7) < em.slice(0, 7);

export function mudancasDesde(antes: Instantaneo, agora: Instantaneo): Mudanca[] {
  const a = new Map(antes.fatos.map((f) => [f.id, f])), b = new Map(agora.fatos.map((f) => [f.id, f]));
  const out: Mudanca[] = [];
  const anoDoRetrato = Number(antes.em.slice(0, 4));
  // Camadas que dependem de a base existir (mapa, noite, grade): ausentes no retrato antigo = camada nova no dossiê, não
  // "não havia no mapa"; ausentes agora = base não carregou, sem comparação (nunca "fechou").
  const CAMADAS: Fato["grupo"][] = ["essenciais", "noite", "transito"];
  const tem = (s: Instantaneo, gr: Fato["grupo"]) => s.fatos.some((f) => f.grupo === gr);
  const NOME_DA_CAMADA: Record<string, string> = { essenciais: "mercado, farmácia, praça e ponto mais perto a pé", noite: "a volta de ônibus à noite", transito: "os horários de ônibus e metrô" };
  const pular = new Set<Fato["grupo"]>();
  for (const gr of CAMADAS) {
    if (!tem(antes, gr) && tem(agora, gr)) { pular.add(gr); out.push({ id: `camada:${gr}`, grupo: gr, natureza: "correcao", peso: 1, frase: `O dossiê passou a mostrar ${NOME_DA_CAMADA[gr]}; não havia isso no seu retrato para comparar.` }); }
    else if (tem(antes, gr) && !tem(agora, gr)) pular.add(gr);
  }
  for (const id of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(id), y = b.get(id);
    if (pular.has((y ?? x)!.grupo)) continue;
    if (x && y && normal(x.valor) === normal(y.valor)) continue;
    const f = (y ?? x)!;
    switch (f.grupo) {
      case "custo": {
        if (!x || !y) continue;
        const dif = typeof x.valor === "number" && typeof y.valor === "number" ? y.valor - x.valor : null;
        out.push({ id, grupo: f.grupo, natureza: "anuncio", peso: 5,
          frase: `${f.rotulo}: ${reais(x.valor as number | null)} → ${reais(y.valor as number | null)}${dif !== null ? ` (${dif > 0 ? "+" : "−"}${reais(Math.abs(dif)).replace("R$ ", "R$ ")} por mês)` : ""}.` });
        break;
      }
      case "obras": {
        if (!x && y) {
          const antiga = anteriorAo(y.data, antes.em);
          out.push({ id, grupo: f.grupo, natureza: antiga ? "antigo" : "mundo", peso: antiga ? 2 : 4,
            frase: antiga ? `${f.rotulo}: licença com entrada em ${mesBr(y.data!)} que só apareceu agora na base (não é obra nova desde o seu retrato).`
              : `Nova licença de obra: ${f.rotulo.charAt(0).toLowerCase()}${f.rotulo.slice(1)}, entrada em ${mesBr(y.data!)}, situação ${y.valor ?? "não informada"}.` });
        } else if (x && y) {
          out.push({ id, grupo: f.grupo, natureza: "mundo", peso: 4, frase: `${f.rotulo}: a situação passou de ${x.valor ?? "não informada"} para ${y.valor ?? "não informada"}.` });
        } else if (x) {
          // Sair da lista pode ser só a janela de 24 meses andando: não é obra concluída nem cancelada.
          out.push({ id, grupo: f.grupo, natureza: "correcao", peso: 1, frase: `${f.rotulo} (entrada em ${mesBr(x.data!)}) não aparece mais entre as licenças recentes; isso não diz que a obra terminou ou foi cancelada.` });
        }
        break;
      }
      case "defesa_civil": {
        if (id === "dc:comunitarias") {
          if (!x) out.push({ id, grupo: f.grupo, natureza: "correcao", peso: 1, frase: `A base passou a separar ações comunitárias da Defesa Civil (${y!.valor} na rua), que não são atendimentos a risco.` });
          else out.push({ id, grupo: f.grupo, natureza: "correcao", peso: 1, frase: `${f.rotulo}: ${x.valor ?? 0} → ${y?.valor ?? 0}.` });
          break;
        }
        const ano = Number(f.data);
        const fechado = ano < anoDoRetrato;
        const de = (x?.valor as number | undefined) ?? 0, para = (y?.valor as number | undefined) ?? 0;
        if (fechado) out.push({ id, grupo: f.grupo, natureza: "correcao", peso: 1,
          frase: `Atendimentos da Defesa Civil na rua em ${ano}: ${de} → ${para}. É um ano já fechado: a base foi corrigida ou reclassificada, não houve atendimento novo.` });
        else if (para > de) out.push({ id, grupo: f.grupo, natureza: "mundo", peso: 3, frase: `${para - de} ${para - de === 1 ? "novo atendimento" : "novos atendimentos"} da Defesa Civil na rua em ${ano} (agora ${para}).` });
        else out.push({ id, grupo: f.grupo, natureza: "correcao", peso: 1, frase: `Atendimentos da Defesa Civil na rua em ${ano}: ${de} → ${para} (a base revisou registros).` });
        break;
      }
      case "essenciais": {
        if (!x || !y || x.valor === null || y.valor === null) {
          out.push({ id, grupo: f.grupo, natureza: "mapa", peso: 2, frase: `${f.rotulo}: ${x?.valor === null || !x ? "não havia no mapa" : String(x.valor).split("|")[0]} → ${!y || y.valor === null ? "nenhum a até 2 km no mapa" : String(y.valor).split("|")[0]}.` });
          break;
        }
        const [n1, m1] = String(x.valor).split("|"), [n2, m2] = String(y.valor).split("|");
        const dm = Number(m2) - Number(m1);
        if (chaveTexto(n1!) === chaveTexto(n2!) && Math.abs(dm) < 2) continue; // arredondamento, não mudança
        out.push({ id, grupo: f.grupo, natureza: "mapa", peso: Math.abs(dm) >= 3 ? 3 : 2,
          frase: `${f.rotulo}: ${n1}, ${m1} min → ${n2}, ${m2} min a pé (o mapa mudou; pode ser lugar novo ou só mapeado agora).` });
        break;
      }
      case "noite": {
        if (!x || !y) continue;
        out.push({ id, grupo: f.grupo, natureza: "mundo", peso: 2, frase: id === "noite:ultima" ? `${f.rotulo}: ${hora(x.valor as number)} → ${hora(y.valor as number)}.` : `${f.rotulo}: ${x.valor} → ${y.valor}.` });
        break;
      }
      case "transito": {
        if (!x || !y) continue;
        out.push({ id, grupo: f.grupo, natureza: "mundo", peso: 2, frase: `A grade de horários foi atualizada (${x.valor} → ${y.valor}); os tempos da aba Rotina já usam a nova.` });
        break;
      }
    }
  }
  return out.sort((p, q) => q.peso - p.peso || p.id.localeCompare(q.id));
}

/** Resumo para o topo do bloco: quantas mudanças contam para a decisão e quantas são correções de base. */
export function resumoDasMudancas(ms: Mudanca[]): { relevantes: Mudanca[]; correcoes: Mudanca[] } {
  return { relevantes: ms.filter((m) => m.natureza !== "correcao" && m.natureza !== "antigo"), correcoes: ms.filter((m) => m.natureza === "correcao" || m.natureza === "antigo") };
}
