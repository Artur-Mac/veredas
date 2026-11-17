// Internet no lugar em que a pessoa vai usar (15/11/2026). Três fatos que não se misturam:
//   disponibilidade consultada — o que a prestadora respondeu para o endereço, o bloco ou a unidade, com data;
//   cobertura móvel externa     — predição da Anatel ao ar livre (contexto; não diz como é dentro da unidade);
//   qualidade observada         — o que a pessoa mediu ou testou num cômodo, numa hora, numa rede.
// Valor não medido fica null e nunca vira zero. Wi-Fi e rede móvel são redes diferentes e não se comparam entre si.
import { z } from "zod";

const id = z.string().regex(/^[a-z0-9-]{1,60}$/);
const instante = z.iso.datetime();
const mbps = z.number().min(0).max(100000).nullable();

export const esquemaConsultaDeFibra = z.strictObject({
  id, tipo: z.literal("consulta_fibra"),
  prestadora: z.string().trim().min(1).max(80),
  /** Até onde vale a resposta: endereço do prédio, um bloco ou a própria unidade. */
  escopo: z.enum(["endereco", "bloco", "unidade"]),
  bloco: z.string().trim().max(40),
  resultado: z.enum(["disponivel", "consulta_tecnica", "indisponivel", "sem_resposta"]),
  canal: z.enum(["site", "telefone", "whatsapp", "loja", "sindico_ou_portaria", "outro"]),
  protocolo: z.string().trim().max(80),
  consultadoEm: z.iso.date(),
  registradoEm: instante,
});
export const esquemaMedicaoNoComodo = z.strictObject({
  id, tipo: z.literal("medicao"),
  comodo: z.string().trim().min(1).max(100),
  /** Data e hora da medição (a qualidade muda com o horário). */
  em: instante,
  rede: z.enum(["wifi", "movel"]),
  operadora: z.string().trim().max(80).nullable(),
  tecnologia: z.enum(["wifi_2_4", "wifi_5", "wifi_desconhecida", "2g", "3g", "4g", "5g", "movel_desconhecida"]),
  metodo: z.enum(["simet", "chamada", "outro_teste"]),
  downloadMbps: mbps, uploadMbps: mbps,
  latenciaMs: z.number().min(0).max(60000).nullable(),
  chamada: z.enum(["funcionou", "falhou", "nao_testada"]),
  nota: z.string().max(1000),
  registradoEm: instante,
}).refine((m) => (m.rede === "wifi") === m.tecnologia.startsWith("wifi"), "A tecnologia precisa ser da mesma rede (Wi-Fi ou móvel).")
  .refine((m) => m.metodo !== "chamada" || m.chamada !== "nao_testada", "Num teste de chamada, diga se a chamada funcionou.");
export const esquemaRegistroDeConectividade = z.union([esquemaConsultaDeFibra, esquemaMedicaoNoComodo]);
export type ConsultaDeFibra = z.infer<typeof esquemaConsultaDeFibra>;
export type MedicaoNoComodo = z.infer<typeof esquemaMedicaoNoComodo>;
export type RegistroDeConectividade = z.infer<typeof esquemaRegistroDeConectividade>;

export const SIMET_URL = "https://medicoes.nic.br/consumidor/";
export const ANATEL_MOSAICO_URL = "https://sistemas.anatel.gov.br/se/public/cmap.php";

const RESULTADO: Record<ConsultaDeFibra["resultado"], string> = {
  disponivel: "disponível segundo a prestadora", consulta_tecnica: "depende de visita técnica", indisponivel: "indisponível segundo a prestadora", sem_resposta: "sem resposta",
};
const ESCOPO: Record<ConsultaDeFibra["escopo"], string> = { endereco: "para o endereço do prédio", bloco: "para o bloco", unidade: "para a unidade" };
const TECNOLOGIA: Record<MedicaoNoComodo["tecnologia"], string> = {
  wifi_2_4: "Wi-Fi 2,4 GHz", wifi_5: "Wi-Fi 5 GHz", wifi_desconhecida: "Wi-Fi", "2g": "2G", "3g": "3G", "4g": "4G", "5g": "5G", movel_desconhecida: "rede móvel",
};
const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const num = (v: number) => String(Math.round(v * 10) / 10).replace(".", ",");

/** Uma linha por consulta, dizendo até onde a resposta vale. */
export function frasesDaDisponibilidade(regs: readonly RegistroDeConectividade[]): string[] {
  return regs.filter((r): r is ConsultaDeFibra => r.tipo === "consulta_fibra")
    .sort((a, b) => b.consultadoEm.localeCompare(a.consultadoEm))
    .map((c) => {
      const alcance = c.escopo === "bloco" ? `${ESCOPO.bloco} ${c.bloco || "(bloco não informado)"}` : ESCOPO[c.escopo];
      const ressalva = c.escopo === "endereco" ? " Vale para o endereço; a instalação na unidade ainda depende de porta disponível e acesso à infraestrutura do condomínio." : "";
      return `Fibra ${c.prestadora}: ${RESULTADO[c.resultado]} ${alcance}, consulta de ${dataBr(c.consultadoEm)}${c.protocolo ? ` (protocolo ${c.protocolo})` : ""}.${ressalva}`;
    });
}

/** Uma linha por medição; só mostra o que foi medido. */
export function frasesDaQualidade(regs: readonly RegistroDeConectividade[]): string[] {
  return regs.filter((r): r is MedicaoNoComodo => r.tipo === "medicao")
    .sort((a, b) => b.em.localeCompare(a.em))
    .map((m) => {
      const quando = new Date(m.em).toLocaleString("pt-BR", { timeZone: "America/Recife", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const rede = `${TECNOLOGIA[m.tecnologia]}${m.operadora ? ` ${m.operadora}` : m.rede === "movel" ? " (operadora não informada)" : ""}`;
      const medidas = [m.downloadMbps !== null ? `download ${num(m.downloadMbps)} Mbps` : null, m.uploadMbps !== null ? `upload ${num(m.uploadMbps)} Mbps` : null,
        m.latenciaMs !== null ? `latência ${Math.round(m.latenciaMs)} ms` : null].filter(Boolean);
      const chamada = m.chamada === "funcionou" ? "chamada funcionou" : m.chamada === "falhou" ? "chamada falhou" : null;
      const metodo = m.metodo === "simet" ? "SIMET" : m.metodo === "chamada" ? "teste de chamada" : "outro teste";
      const resultado = [...medidas, chamada].filter(Boolean).join(", ") || "sem resultado medido";
      return `${m.comodo}, ${quando}, ${rede}: ${resultado} (${metodo}).`;
    });
}

/**
 * Resumo para a visita: o que falta para responder "a internet funciona onde vou usar?". Não compara Wi-Fi com rede
 * móvel, não troca a consulta de endereço por confirmação na unidade e não supõe nada que não foi medido.
 */
export function pendenciasDaConectividade(regs: readonly RegistroDeConectividade[]): string[] {
  const consultas = regs.filter((r): r is ConsultaDeFibra => r.tipo === "consulta_fibra");
  const medicoes = regs.filter((r): r is MedicaoNoComodo => r.tipo === "medicao");
  const out: string[] = [];
  if (!consultas.length) out.push("Consultar a fibra de pelo menos uma prestadora para o endereço ou o bloco.");
  else if (!consultas.some((c) => c.escopo !== "endereco" && c.resultado === "disponivel")) out.push("Nenhuma consulta confirma a fibra para o bloco ou a unidade; pergunte à portaria quais prestadoras já atendem o prédio.");
  if (!medicoes.length) out.push("Medir no cômodo onde você pretende trabalhar (SIMET ou uma chamada), anotando a hora.");
  else {
    if (!medicoes.some((m) => m.rede === "movel")) out.push("Testar também a rede móvel no cômodo (sem Wi-Fi), para saber se o celular funciona sem o roteador.");
    if (!medicoes.some((m) => m.uploadMbps !== null || m.latenciaMs !== null)) out.push("Anotar upload e latência: para videochamada contam mais que o download.");
    if (new Set(medicoes.map((m) => m.comodo.toLowerCase())).size < 2) out.push("Medir num segundo cômodo (por exemplo, perto da janela), para comparar.");
  }
  return out;
}
