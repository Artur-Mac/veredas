// Raio-X de um prédio sem anúncio (15/11/2026): a busca por nome, rua ou bairro, a localização do aparelho e os três
// exemplos do Explorar abrem o dossiê de um prédio do cadastro sem a pessoa ter um link. A análise nasce com o prédio já
// confirmado (a pessoa escolheu o prédio, não um anúncio) e com tudo do anúncio desconhecido: preço, condomínio e IPTU
// ficam null ("A confirmar"), nunca 0. Sem crédito e sem conta.
import type { AnaliseV2, Edificio } from "./contratos";
import { formatarEndereco } from "./recife/endereco";
import { bairroPorSlug } from "./recife/bairros";

export const VISITA_VAZIA: AnaliseV2["visita"] = {
  verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null,
};

const vazio = (): { valor: null; origem: "voce"; aConfirmar: false } => ({ valor: null, origem: "voce", aConfirmar: false });

/** Id estável por prédio: abrir o mesmo prédio de novo reabre a mesma análise, sem duplicar o caderno. */
export const idDoRaioX = (edificioId: string, prefixo: "raiox" | "exemplo" = "raiox"): string =>
  `${prefixo}-${edificioId.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`.slice(0, 60);

export type OrigemDoRaioX = "busca" | "localizacao" | "exemplo";

/** O endereço do cadastro em linguagem de tela ("Av. Boa Viagem, 2290"). */
export const enderecoDoPredio = (e: Pick<Edificio, "logradouro" | "numero">): string => formatarEndereco(e.logradouro, e.numero);

/** Nome de tela: o nome do prédio no cadastro, senão o endereço. */
export function nomeDoPredio(e: Pick<Edificio, "nome" | "logradouro" | "numero">): string {
  return e.nome ? `Ed. ${e.nome}` : enderecoDoPredio(e);
}

export function analiseDoPredio(
  e: Edificio,
  opcoes: { agora: string; indiceGeradoEm: string; origem: OrigemDoRaioX; titulo?: string; modalidade?: AnaliseV2["modalidade"] },
): AnaliseV2 {
  const bairro = bairroPorSlug(e.bairro);
  const nome = (opcoes.titulo ?? `Raio-X · ${nomeDoPredio(e)}`).slice(0, 120);
  return {
    versao: 2,
    id: idDoRaioX(e.id, opcoes.origem === "exemplo" ? "exemplo" : "raiox"),
    criadaEm: opcoes.agora,
    atualizadaEm: opcoes.agora,
    nome,
    // Sem anúncio não há modalidade: compra é só o ponto de partida do custo (a pessoa troca em "Editar").
    modalidade: opcoes.modalidade ?? "compra",
    tipologia: "apartamento",
    url: "",
    bairroTexto: bairro?.nome ?? e.bairro,
    bairro: e.bairro,
    logradouro: e.logradouro,
    numero: e.numero,
    nomeEdificio: e.nome,
    extracao: null,
    declarados: {
      preco: vazio(), condominio: vazio(), iptu: { ...vazio(), periodo: "desconhecido" }, seguroIncendio: vazio(), taxaServico: vazio(),
      outros: vazio(), area: vazio(), quartos: vazio(), suites: vazio(), banheiros: vazio(), vagas: vazio(), andar: vazio(),
    },
    vinculo: { estado: "confirmado", edificioId: e.id, dsqfl: e.dsqfl, confirmadoEm: opcoes.agora, indiceGeradoEm: opcoes.indiceGeradoEm },
    visita: VISITA_VAZIA,
    salva: false,
    descarte: null,
  };
}

/**
 * Três cenários de exemplo, prédios reais do cadastro municipal (sem anúncio, sem preço): escolhidos em 15/11/2026 por
 * critério fixo no índice faa40c969275e6b5 (docs/aplicacao/execucoes/copiloto-2026-11-15/README.md). O cartão não mostra
 * o nome do prédio; o dossiê mostra o que o cadastro público mostra para qualquer prédio. Se um índice novo tirar o
 * prédio, o exemplo some (nunca troca por outro em silêncio).
 */
export const EXEMPLOS = [
  {
    id: "beira-mar",
    bairro: "boa-viagem",
    edificioId: "11720-2290",
    titulo: "Beira-mar em Boa Viagem",
    resumo: "Torre recente na avenida da praia, com via movimentada e bar a menos de 150 m.",
    criterio: "Av. Boa Viagem; via principal a até 80 m (camada da noite); bar ou venda de bebida a até 150 m (CNEFE 2022); mais transmissões de ITBI.",
  },
  {
    id: "revenda-antiga",
    bairro: "gracas",
    edificioId: "59382-537",
    titulo: "Revenda antiga nas Graças",
    resumo: "Prédio de 1972 com histórico de ITBI para comparar o preço pedido.",
    criterio: "Construído antes de 1990; quartis de ITBI por unidade nos últimos 36 meses; mais transmissões entre os de nome conhecido.",
  },
  {
    id: "rua-com-chuva",
    bairro: "madalena",
    edificioId: "1880-186",
    titulo: "Rua da Madalena com pedidos de drenagem",
    resumo: "Rua perto do Capibaribe com pedidos de limpeza de galeria ao 156.",
    criterio: "Mais pedidos de drenagem ao 156 a até 150 m na janela de 12 meses (20/06/2025 a 19/06/2026).",
  },
] as const;
export type Exemplo = (typeof EXEMPLOS)[number];
