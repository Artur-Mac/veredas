import { enderecoDoDossie } from "../../dados/consultas";
import type { Dossie } from "../../dados/esquema";
import type { DadosDoAparelho } from "../../estado/Aparelho";

const ITENS_FIXOS = ["Ouvir o ruído da rua", "Ver o sol na sala", "Ver as áreas comuns"];

export function itensDoRoteiro(dossie: Dossie, dados: DadosDoAparelho): string[] {
  return [...dossie.visita.map((v) => v.texto), ...ITENS_FIXOS, ...(dados.roteiroExtra[dossie.id] ?? [])];
}

export function mensagemPadrao(dossie: Dossie): string {
  return `Olá, vi o apartamento da ${enderecoDoDossie(dossie)}, em ${dossie.bairro}.\nGostaria de visitar {quando}.\nPode confirmar {pergunta 1} e {pergunta 2}?`;
}
