import type { Analise } from "./analise";
import {
  esquemaAnaliseV2,
  type AnaliseV2,
} from "./contratos";
import { slugDoBairroPorTexto } from "./formulario";
import { eCoberto } from "./recife/bairros";

function paraIso(texto: string | undefined, agora: Date): string {
  if (texto) {
    try {
      const d = new Date(texto);
      if (!Number.isNaN(d.getTime())) {
        return d.toISOString();
      }
    } catch {
      // fallback
    }
  }
  return agora.toISOString();
}

export function migrarAnaliseV1(v: Analise, agora: Date): AnaliseV2 {
  // O texto "Recife" é a cidade, não o bairro "recife": esse só casa pelo nome de exibição e pelos aliases de bairros.ts.
  const slugBairro = slugDoBairroPorTexto(v.bairro);

  const coberto = slugBairro ? eCoberto(slugBairro) : false;

  const dataIso = paraIso(v.atualizadoEm, agora);

  const migrada: AnaliseV2 = {
    versao: 2,
    id: v.id,
    criadaEm: dataIso,
    atualizadaEm: dataIso,
    nome: v.nome,
    modalidade: v.tipo,
    tipologia: "apartamento",
    url: v.url ?? "",
    bairroTexto: v.bairro,
    bairro: slugBairro,
    logradouro: v.logradouro ?? null,
    numero: null,
    nomeEdificio: null,
    extracao: null,
    declarados: {
      preco: { valor: v.preco, origem: "voce", aConfirmar: false },
      condominio: { valor: v.condominio, origem: "voce", aConfirmar: false },
      iptu: { valor: v.iptuAnual, periodo: "ano", origem: "voce", aConfirmar: false },
      seguroIncendio: { valor: null, origem: "voce", aConfirmar: false },
      taxaServico: { valor: null, origem: "voce", aConfirmar: false },
      outros: { valor: v.outros, origem: "voce", aConfirmar: false },
      area: { valor: v.area, origem: "voce", aConfirmar: false },
      quartos: { valor: v.quartos ?? null, origem: "voce", aConfirmar: false },
      suites: { valor: null, origem: "voce", aConfirmar: false },
      banheiros: { valor: null, origem: "voce", aConfirmar: false },
      vagas: { valor: null, origem: "voce", aConfirmar: false },
      andar: { valor: null, origem: "voce", aConfirmar: false },
    },
    vinculo: coberto ? { estado: "pendente" } : { estado: "fora_de_cobertura" },
    visita: {
      verificadas: v.verificadas ?? [],
      respostas: {},
      perguntasProprias: [],
      notas: v.notas ?? "",
      ruido: null,
      orientacaoGraus: null,
      segundos: 0,
      concluidaEm: null,
    },
    salva: true,
    descarte: null,
  };

  return esquemaAnaliseV2.parse(migrada);
}
