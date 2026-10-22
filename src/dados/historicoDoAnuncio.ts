import type { AnaliseV2 } from "./contratos";
import { cadernoVazio } from "./caderno";

const campos = { preco: "Preço anunciado", condominio: "Condomínio", iptu: "IPTU", seguroIncendio: "Seguro incêndio", taxaServico: "Taxa de serviço", outros: "Outros custos", area: "Área", quartos: "Quartos", suites: "Suítes", banheiros: "Banheiros", vagas: "Vagas", andar: "Andar" } as const;
const origens = { voce: "informado por você", anuncio: "anúncio", url: "link", texto: "texto", pagina: "página" };
function descrever(v: AnaliseV2["declarados"]["preco"] & { periodo?: string }): string {
  const origem = origens[v.origem as keyof typeof origens] ?? v.origem;
  return `${v.valor === null ? "Não informado" : v.valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} · ${origem}${v.aConfirmar ? " · a confirmar" : ""}${v.periodo ? ` · período: ${v.periodo}` : ""}`;
}
/** Só depois de uma edição/reimportação deliberada. Sem consulta periódica a portais. */
export function registrarAlteracaoDoAnuncio(antes: AnaliseV2 | undefined, depois: AnaliseV2, em: string): AnaliseV2 {
  if (!antes) return depois;
  const alteracoes: { campo: string; antes: string; depois: string }[] = [];
  for (const chave of Object.keys(campos) as (keyof typeof campos)[]) {
    if (JSON.stringify(antes.declarados[chave]) !== JSON.stringify(depois.declarados[chave])) {
      alteracoes.push({ campo: campos[chave], antes: descrever(antes.declarados[chave]), depois: descrever(depois.declarados[chave]) });
    }
  }
  for (const chave of ["nome", "url", "bairroTexto", "logradouro", "numero", "nomeEdificio", "modalidade"] as const) {
    if (antes[chave] !== depois[chave]) alteracoes.push({ campo: { nome: "Nome da análise", url: "Link", bairroTexto: "Bairro informado", logradouro: "Logradouro", numero: "Número", nomeEdificio: "Nome do edifício", modalidade: "Modalidade" }[chave], antes: String(antes[chave] ?? "Não informado"), depois: String(depois[chave] ?? "Não informado") });
  }
  if (!alteracoes.length) return depois;
  const c = depois.caderno ?? cadernoVazio();
  const historico = c.historicoDoAnuncio ?? [];
  if (historico.length >= 500) throw new Error("O histórico desta análise atingiu 500 alterações. Exporte uma cópia antes de continuar em uma nova análise.");
  const origem = JSON.stringify(antes.extracao) !== JSON.stringify(depois.extracao) ? "nova_extracao" as const : "edicao" as const;
  return { ...depois, caderno: { ...c, historicoDoAnuncio: [...historico, { id: `historico-${Date.parse(em).toString(36)}-${historico.length}`, em, origem, alteracoes }] } };
}
