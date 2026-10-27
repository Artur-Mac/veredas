import { z } from "zod";

const id = z.string().regex(/^[a-z0-9-]{1,60}$/);
const instante = z.iso.datetime();
const data = z.iso.date().nullable();
const centavos = z.number().int().min(0).max(1e12).nullable();

export const esquemaDocumentoPessoal = z.strictObject({
  id, titulo: z.string().trim().min(1).max(160),
  tipo: z.enum(["laudo", "art_rrt", "ata", "balancete", "convencao", "cndt", "acoes_trt6", "licenca", "matricula", "outro"]),
  inspecaoEm: data, emitidoEm: data, recebidoEm: instante,
  origem: z.string().trim().min(1).max(240),
  escopo: z.string().max(2000), trecho: z.string().max(6000),
  pagina: z.number().int().min(1).max(10000).nullable(),
  vinculo: z.enum(["confirmado", "a_confirmar", "outro_imovel"]),
  arquivo: z.strictObject({ chave: z.string().regex(/^documento-[a-z0-9-]+\.pdf$/), bytes: z.number().int().min(1).max(20 * 1024 * 1024), mime: z.literal("application/pdf") }).optional(),
});
export const esquemaEntidadeJuridica = z.strictObject({
  id, cnpj: z.string().regex(/^[A-Z0-9]{12}\d{2}$/), nome: z.string().trim().min(1).max(160),
  papel: z.enum(["condominio", "construtora", "incorporadora", "administradora", "vizinho"]),
  endereco: z.string().max(240), evidencia: z.string().trim().min(1).max(1000), confirmado: z.boolean(),
});
export const esquemaOcorrencia = z.strictObject({
  id, entidadeId: id, assunto: z.enum(["obra", "vicio", "estrutura", "trabalhista", "ruido", "outro"]),
  identificador: z.string().trim().min(1).max(120), orgao: z.string().trim().min(1).max(120),
  polo: z.enum(["autor", "reu", "outro", "desconhecido"]),
  natureza: z.enum(["alegacao", "documento_tecnico", "decisao", "observacao"]),
  estagio: z.string().trim().min(1).max(240), referenciaEm: data,
  vinculo: z.enum(["confirmado", "a_confirmar", "outro_imovel"]),
  fonte: z.string().trim().min(1).max(500), trecho: z.string().max(3000),
  valorCentavos: centavos, tipoValor: z.enum(["causa", "pedido", "condenacao", "acordo", "provisao", "desconhecido"]),
  registradoEm: instante,
});
export const esquemaObservacao = z.strictObject({
  id, em: instante, comodo: z.string().trim().min(1).max(100),
  assunto: z.enum(["som", "sol", "conectividade", "agua", "acesso", "outro"]),
  texto: z.string().trim().min(1).max(2000), origem: z.literal("voce"),
});
export const esquemaCenario = z.strictObject({
  id, nome: z.string().trim().min(1).max(100), meses: z.number().int().min(1).max(600),
  despesasIniciaisCentavos: centavos, caucaoCentavos: centavos,
  extrasMensaisCentavos: centavos, registradoEm: instante,
  usarItens: z.boolean().optional(),
  itens: z.array(z.strictObject({ id, titulo: z.string().trim().min(1).max(120),
    categoria: z.enum(["inicial", "mensal", "reembolsavel"]), valorCentavos: centavos,
    duracaoMeses: z.number().int().min(1).max(600).nullable(), fonte: z.string().trim().min(1).max(300),
  })).max(50).optional(),
});
export const esquemaSessaoVisita = z.strictObject({
  id, arquivadaEm: instante, concluidaEm: instante.nullable(),
  rotulosDasPerguntas: z.record(z.string().max(60), z.string().max(240)).optional(),
  notas: z.string().max(4000), respostas: z.record(z.string().max(60), z.string().max(1000)),
  verificadas: z.array(z.string().max(60)).max(100),
  perguntasProprias: z.array(z.strictObject({ id: z.string().max(60), texto: z.string().max(240) })).max(30),
  ruido: z.enum(["silencioso", "moderado", "alto"]).nullable(),
  orientacaoGraus: z.number().int().min(0).max(359).nullable(),
  segundos: z.number().int().min(0).max(604800),
});
export const esquemaCaderno = z.strictObject({
  versao: z.literal(1),
  lembretes: z.array(z.strictObject({ id, titulo: z.string().trim().min(1).max(160), em: instante,
    fuso: z.string().trim().min(1).max(100).refine(v => { try { new Intl.DateTimeFormat("pt-BR", { timeZone: v }).format(); return true; } catch { return false; } }), notificar: z.boolean(), estado: z.enum(["ativo", "concluido", "cancelado"]) })).max(100)
    .refine(a => new Set(a.map(r => r.id)).size === a.length, "Lembretes repetidos").optional(),
  perfilDomestico: z.strictObject({ ocupantes: z.number().int().min(1).max(30).nullable(), orcamentoCentavos: centavos,
    consumos: z.array(z.strictObject({ id, assunto: z.enum(["agua", "energia", "transporte", "outro"]),
      unidade: z.enum(["m3", "kwh", "viagem", "mes"]), quantidade: z.number().min(0).max(1e6).nullable(), tarifaCentavos: centavos,
      fonte: z.string().trim().min(1).max(300), referenciaEm: data })).max(30),
  }).optional(),
  balancetes: z.array(z.strictObject({ id, documentoId: id.nullable(), periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    receitasCentavos: centavos, despesasCentavos: centavos, reservaCentavos: centavos, inadimplenciaCentavos: centavos,
    fonte: z.string().trim().min(1).max(300), pagina: z.number().int().min(1).max(10000).nullable(), registradoEm: instante,
    evidencias: z.array(z.strictObject({ campo: z.enum(["receitasCentavos", "despesasCentavos", "reservaCentavos", "inadimplenciaCentavos"]),
      centavos: z.number().int().min(0).max(1e12), trecho: z.string().min(1).max(6000), pagina: z.number().int().min(1).max(10000).nullable(), documentoId: id })).max(4).optional(),
  })).max(100).optional(),
  infraestrutura: z.array(z.strictObject({ id, assunto: z.enum(["cisterna", "reservatorio", "bomba", "rodizio"]),
    estado: z.enum(["sim", "nao", "nao_sabemos"]), relato: z.string().max(2000), fonte: z.string().trim().min(1).max(300),
    observadoEm: data, registradoEm: instante })).max(200).optional(),
  expectativas: z.array(z.strictObject({ id, assunto: z.string().trim().min(1).max(100), esperado: z.string().trim().min(1).max(2000), em: instante,
    experiencias: z.array(z.strictObject({ em: instante, observadoEm: z.iso.date(), texto: z.string().trim().min(1).max(2000) })).max(100),
  })).max(100).optional(),
  historicoDoAnuncio: z.array(z.strictObject({
    id, em: instante, origem: z.enum(["edicao", "nova_extracao"]),
    alteracoes: z.array(z.strictObject({ campo: z.string().max(80), antes: z.string().max(4000), depois: z.string().max(4000) })).min(1).max(30),
  })).max(500).optional(),
  correcoes: z.array(z.strictObject({ id, em: instante, fato: z.string().trim().min(1).max(240),
    referencia: z.string().trim().min(1).max(500), motivo: z.string().trim().min(1).max(2000), evidencia: z.string().max(2000),
  })).max(100).optional(),
  destinos: z.array(z.strictObject({ id, apelido: z.string().trim().min(1).max(80), nota: z.string().max(1000),
    posicao: z.strictObject({ longitude: z.number().min(-180).max(180), latitude: z.number().min(-90).max(90),
      precisaoM: z.number().min(0).nullable(), em: instante }).nullable(),
  })).max(20).optional(),
  localizacaoDaVisita: z.strictObject({ longitude: z.number().min(-180).max(180), latitude: z.number().min(-90).max(90),
    precisaoM: z.number().min(0).nullable(), em: instante, origem: z.literal("gps_da_visita") }).optional(),
  fotos: z.array(z.strictObject({ id, chave: z.string().regex(/^foto-[a-z0-9-]+\.(jpg|png)$/),
    bytes: z.number().int().min(1).max(5 * 1024 * 1024), em: instante })).max(5).optional(),
  documentos: z.array(esquemaDocumentoPessoal).max(100),
  entidades: z.array(esquemaEntidadeJuridica).max(20),
  ocorrencias: z.array(esquemaOcorrencia).max(200),
  observacoes: z.array(esquemaObservacao).max(500),
  cenarios: z.array(esquemaCenario).max(30),
  visitas: z.array(esquemaSessaoVisita).max(100),
  decisao: z.enum(["considerando", "visita_planejada", "visitado", "escolhido"]),
  diario: z.array(z.strictObject({ id, em: instante, texto: z.string().trim().min(1).max(2000) })).max(200),
});
export type Caderno = z.infer<typeof esquemaCaderno>;
export type DocumentoPessoal = z.infer<typeof esquemaDocumentoPessoal>;
export type Ocorrencia = z.infer<typeof esquemaOcorrencia>;

export function cadernoVazio(): Caderno {
  return { versao: 1, documentos: [], entidades: [], ocorrencias: [], observacoes: [], cenarios: [], visitas: [], decisao: "considerando", diario: [] };
}

/** Exibir só a inspeção conhecida e vinculada; emissão não substitui data da inspeção. */
export function ultimaInspecao(documentos: readonly DocumentoPessoal[]): DocumentoPessoal | null {
  return documentos.filter(d => d.tipo === "laudo" && d.vinculo === "confirmado" && d.inspecaoEm !== null)
    .sort((a, b) => b.inspecaoEm!.localeCompare(a.inspecaoEm!))[0] ?? null;
}

export function normalizarCnpj(texto: string): string {
  return texto.toUpperCase().replace(/[.\s/\-]/g, "");
}

/** Número CNJ em graus diferentes continua um caso; não une processos sem número CNJ por semelhança. */
export function chaveDaOcorrencia(o: Ocorrencia): string {
  const numero = o.identificador.replace(/[.\s\-]/g, "");
  return /^\d{20}$/.test(numero) ? `cnj:${numero}` : `${o.orgao.toLowerCase()}:${o.identificador}`;
}

export function ocorrenciasDoImovel(caderno: Caderno): Ocorrencia[] {
  const entidades = new Set(caderno.entidades.filter(e => e.confirmado && e.papel !== "vizinho").map(e => e.id));
  const vistos = new Set<string>();
  return caderno.ocorrencias.filter(o => {
    if (o.vinculo !== "confirmado" || !entidades.has(o.entidadeId)) return false;
    const chave = chaveDaOcorrencia(o);
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}
