// Importação deliberada de anúncio (link, texto ou digitação) no mesmo contrato de observação das fontes públicas
// (VE02.02). Pura: lê a análise que a pessoa já salvou e devolve snapshot + observações; não grava nada, não faz rede.
// O bruto da página do portal não é arquivado (retenção "so_derivados"); por isso o snapshot não tem hash.
import type { AnaliseV2 } from "./contratos";
import {
  VERSAO_DO_CONTRATO,
  classificarColeta,
  esquemaObservacao,
  esquemaSnapshotDaFonte,
  type Observacao,
  type SnapshotDaFonte,
} from "./observacao";

export const ANALISADOR_DO_ANUNCIO = { nome: "importacao_deliberada", versao: "1" } as const;

type Campo = keyof AnaliseV2["declarados"];

const UNIDADE: Record<Campo, (a: AnaliseV2) => string | null> = {
  preco: (a) => (a.modalidade === "aluguel" ? "BRL/mes" : "BRL"),
  condominio: () => "BRL/mes",
  iptu: (a) => (a.declarados.iptu.periodo === "mes" ? "BRL/mes" : a.declarados.iptu.periodo === "ano" ? "BRL/ano" : "BRL/periodo_desconhecido"),
  seguroIncendio: () => "BRL/mes",
  taxaServico: () => "BRL/mes",
  outros: () => "BRL/mes",
  area: () => "m2",
  quartos: () => "unidades",
  suites: () => "unidades",
  banheiros: () => "unidades",
  vagas: () => "unidades",
  andar: () => "andar",
};
const PROPRIEDADE: Record<Campo, (a: AnaliseV2) => string> = {
  preco: (a) => (a.modalidade === "aluguel" ? "anuncio.aluguel_pedido" : "anuncio.preco_pedido"),
  condominio: () => "anuncio.condominio",
  iptu: () => "anuncio.iptu",
  seguroIncendio: () => "anuncio.seguro_incendio",
  taxaServico: () => "anuncio.taxa_de_servico",
  outros: () => "anuncio.outras_taxas",
  area: () => "anuncio.area_declarada",
  quartos: () => "anuncio.quartos",
  suites: () => "anuncio.suites",
  banheiros: () => "anuncio.banheiros",
  vagas: () => "anuncio.vagas",
  andar: () => "anuncio.andar",
};
/** Campos de dinheiro: 0 declarado é "zero_declarado" (ex.: casa sem condomínio), diferente de desconhecido. */
const MONETARIOS = new Set<Campo>(["preco", "condominio", "iptu", "seguroIncendio", "taxaServico", "outros"]);

export function observacoesDoAnuncio(a: AnaliseV2): { snapshot: SnapshotDaFonte; observacoes: Observacao[] } {
  const recuperado = a.extracao?.coletadoEm ?? a.criadaEm;
  const entidades: Observacao["entidades"] = [{ tipo: "anuncio", id: a.id, metodo: "caderno_local" }];
  if (a.vinculo.estado === "confirmado") entidades.push({ tipo: "edificio", id: a.vinculo.edificioId, metodo: "confirmacao_da_pessoa" });
  if (a.bairro) entidades.push({ tipo: "bairro", id: a.bairro, metodo: "texto_da_fonte" });

  const observacoes: Observacao[] = (Object.keys(UNIDADE) as Campo[]).map((campo) => {
    const d = a.declarados[campo];
    const estadoDoValor =
      d.valor === null ? "desconhecido" : d.aConfirmar ? "a_confirmar" : d.valor === 0 && MONETARIOS.has(campo) ? "zero_declarado" : "conhecido";
    const leitura = d.origem === "voce" ? "digitado_pela_pessoa" : `leitura_do_${d.origem}`;
    return esquemaObservacao.parse({
      id: `anuncio:${a.id}:${campo}`,
      fonte: "importacao_deliberada",
      snapshotSha256: null,
      localizador: `campo ${campo}`,
      propriedade: PROPRIEDADE[campo](a),
      valor: d.valor,
      unidade: UNIDADE[campo](a),
      estadoDoValor,
      entidades,
      geometria: null,
      tempos: { evento: null, precisaoDoEvento: "nenhuma", administrativo: null, publicado: null, recuperado: recuperado.replace(/\.\d+Z$/, "Z") },
      trecho: null,
      metodo: { nome: leitura, versao: ANALISADOR_DO_ANUNCIO.versao },
    });
  });

  const conhecidos = observacoes.filter((o) => o.estadoDoValor === "conhecido" || o.estadoDoValor === "zero_declarado").length;
  const { estado, motivo } = classificarColeta({ erro: null, declarados: null, lidos: observacoes.length, aceitos: conhecidos, paginasFaltando: 0 });
  const snapshot = esquemaSnapshotDaFonte.parse({
    versaoDoContrato: VERSAO_DO_CONTRATO,
    fonte: "importacao_deliberada",
    url: a.extracao?.url ?? a.url ?? "",
    recuperadoEm: recuperado.replace(/\.\d+Z$/, "Z"),
    periodoDeReferencia: null,
    tipoDeMidia: a.extracao ? "text/plain" : "application/x-vereda-digitacao",
    sha256: null,
    bytes: 0,
    analisador: ANALISADOR_DO_ANUNCIO,
    termos: { licenca: "conteúdo do portal, uso pessoal", retencao: "so_derivados", atribuicao: a.extracao?.portal ?? "a própria pessoa" },
    escala: "unidade",
    precisaoDaData: "instante",
    // Sem nenhum campo conhecido, a importação não sustenta nada: "falhou" (nenhum registro utilizável), nunca "valida".
    estado,
    motivo,
    contagens: { requisicoes: 0, registrosDeclarados: null, registrosLidos: observacoes.length, observacoes: observacoes.length, quarentena: 0 },
  });
  return { snapshot, observacoes };
}
