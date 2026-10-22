import { esquemaAnaliseV2, type AnaliseV2 } from "../../src/dados/contratos";
const vazio = { valor: null, origem: "voce", aConfirmar: false };
export const EM = "2026-10-21T12:00:00.000Z";
export function analiseDeTeste(id = "teste", mudar: Partial<AnaliseV2> = {}): AnaliseV2 {
  return esquemaAnaliseV2.parse({ versao: 2, id, criadaEm: EM, atualizadaEm: EM, nome: "Imóvel sintético de teste", modalidade: "aluguel", tipologia: "apartamento",
    url: "", bairroTexto: "Casa Forte", bairro: "casa-forte", logradouro: null, numero: null, nomeEdificio: null, extracao: null,
    declarados: { preco: { ...vazio, valor: 2500 }, condominio: { ...vazio, valor: 600 }, iptu: { ...vazio, periodo: "desconhecido" },
      seguroIncendio: vazio, taxaServico: vazio, outros: vazio, area: vazio, quartos: vazio, suites: vazio, banheiros: vazio, vagas: vazio, andar: vazio },
    vinculo: { estado: "pendente" }, visita: { verificadas: [], respostas: {}, perguntasProprias: [], notas: "", ruido: null, orientacaoGraus: null, segundos: 0, concluidaEm: null },
    salva: true, descarte: null, ...mudar });
}
