// Normalização das linhas brutas da Defesa Civil (CKAN) no contrato de observação (VE02.02, issue I05 do VE00).
// O layout é detectado linha a linha pelo conteúdo, não pelo cabeçalho declarado: em 2020 e 2022 a data ISO está em
// "Mês", a categoria em "Data" e a rua em "Solicitacao" (deslocado); em 2021, 2023 e 2024 a data está em "Data", a
// categoria em "Ocorrencia" e a rua em "Endereco" (alinhado). Layout desconhecido vai para a quarentena.
// A data é ADMINISTRATIVA (atendimento), nunca o momento do evento. O número do imóvel vem mascarado e nunca é lido.
import { createHash } from "node:crypto";
import { categoriaDaOcorrencia, dobrar, limpar } from "../rua/nucleo.mjs";
import { esquemaObservacao, esquemaQuarentena } from "../../../src/dados/observacao.ts";

// v2 (VE02): reconhece "Maro" (Março sem cedilha). A v1 punha em quarentena todas as linhas de março de 2020 e 2022.
export const ANALISADOR_DEFESA_CIVIL = { nome: "defesa_civil_ckan", versao: "2" };

// "maro": "Março" com o "ç" perdido na publicação de 2020 e 2022.
const MESES = new Set(["janeiro", "fevereiro", "marco", "maro", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]);
const CONHECIDAS = new Set(["_id", "Regional", "Ano", "Data", "Ocorrencia", "Solicitacao", "Endereco", "Bairro", "Tipo_da_Acao", "_full_text"]);
const ISO = /^(\d{4})-(\d{2})-(\d{2})/;

export const slugDoBairro = (t) => dobrar(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function dataIsoValida(v) {
  const m = ISO.exec(String(v ?? "").trim());
  if (!m) return null;
  const [, a, me, d] = m.map(Number);
  if (me < 1 || me > 12 || d < 1 || d > 31 || a < 2000 || a > 2100) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** Chave do mês: a única fora das conhecidas ("Mês", "Mes", "MÃªs"…). */
function chaveDoMes(r) {
  return Object.keys(r).find((k) => !CONHECIDAS.has(k)) ?? null;
}

/** { layout, data, categoriaBruta, rua, bairro } ou { quarentena: motivo }. Pura. */
export function interpretarLinha(r) {
  const km = chaveDoMes(r);
  const dataAlinhada = dataIsoValida(r.Data);
  const dataNoMes = km ? dataIsoValida(r[km]) : null;
  let layout, data, categoriaBruta, ruaBruta, solicitacao;
  if (dataAlinhada) {
    layout = "alinhado";
    data = dataAlinhada;
    categoriaBruta = r.Ocorrencia;
    solicitacao = r.Solicitacao;
    ruaBruta = String(r.Endereco ?? "").replace(/,[^,]*$/, "");
  } else if (dataNoMes && MESES.has(dobrar(r.Ano))) {
    layout = "deslocado";
    data = dataNoMes;
    categoriaBruta = r.Data;
    solicitacao = r.Ocorrencia;
    ruaBruta = String(r.Solicitacao ?? "");
  } else {
    const algumaData = Object.values(r).some((v) => ISO.test(String(v ?? "")));
    return { quarentena: algumaData ? "layout_desconhecido" : "sem_data" };
  }
  const rua = limpar(ruaBruta.replace(/["“”]/g, " ")).slice(0, 120);
  if (!/[a-z]{3}/.test(dobrar(rua))) return { quarentena: "sem_endereco", layout };
  return { layout, data, categoriaBruta: limpar(categoriaBruta), solicitacao: limpar(solicitacao), rua, bairro: limpar(r.Bairro) };
}

const idDe = (...partes) => createHash("sha256").update(partes.join("|")).digest("hex").slice(0, 24);

/**
 * Linhas brutas → observações aceitas + quarentena + contagens. `vincular(rua, bairroSlug)` (opcional) devolve
 * { codigo, metodo } ou { codigo: null, metodo }. Determinística: mesma entrada e versão → mesma saída.
 */
export function normalizarDefesaCivil(registros, { fonte, snapshotSha256, recuperadoEm, anoDoRecurso = null, vincular = null }) {
  const observacoes = [];
  const quarentena = [];
  const contagens = { layouts: { alinhado: 0, deslocado: 0 }, anoDiferenteDoRecurso: 0, categoriaNaoInformada: 0, vinculadas: 0, ambiguas: 0, semVinculo: 0, mesmoDiaRuaECategoria: 0 };
  const assinaturas = new Set();
  registros.forEach((r, i) => {
    const localizador = r._id !== undefined ? `_id=${r._id}` : `linha ${i + 1}`;
    if (r === null || typeof r !== "object") {
      quarentena.push(esquemaQuarentena.parse({ fonte, snapshotSha256, localizador, motivo: "layout_desconhecido", trecho: String(r).slice(0, 120) }));
      return;
    }
    const l = interpretarLinha(r);
    if (l.quarentena) {
      quarentena.push(esquemaQuarentena.parse({
        fonte, snapshotSha256, localizador, motivo: l.quarentena,
        // Trecho sem o campo de endereço mascarado: só as chaves e os campos não pessoais.
        trecho: JSON.stringify({ Ano: r.Ano, Data: r.Data, Ocorrencia: r.Ocorrencia, Bairro: r.Bairro }).slice(0, 300),
      }));
      return;
    }
    contagens.layouts[l.layout] += 1;
    if (anoDoRecurso !== null && Number(l.data.slice(0, 4)) !== anoDoRecurso) contagens.anoDiferenteDoRecurso += 1;
    const categoria = categoriaDaOcorrencia(l.categoriaBruta);
    if (categoria === "nao_informada") contagens.categoriaNaoInformada += 1;
    const bairroSlug = slugDoBairro(l.bairro);
    const assinatura = `${l.data}|${categoria}|${dobrar(l.rua)}|${bairroSlug}`;
    // Não é duplicata: o número do imóvel vem mascarado, então vários imóveis da mesma rua no mesmo dia coincidem aqui.
    if (assinaturas.has(assinatura)) contagens.mesmoDiaRuaECategoria += 1;
    assinaturas.add(assinatura);
    const entidades = [];
    if (bairroSlug) entidades.push({ tipo: "bairro", id: bairroSlug, metodo: "texto_da_fonte" });
    const v = vincular ? vincular(l.rua, bairroSlug) : { codigo: null, metodo: "nao_tentado" };
    if (v.codigo !== null) {
      entidades.push({ tipo: "rua", id: String(v.codigo), metodo: v.metodo });
      contagens.vinculadas += 1;
    } else if (v.metodo === "ambiguo") contagens.ambiguas += 1;
    else contagens.semVinculo += 1;
    observacoes.push(esquemaObservacao.parse({
      id: idDe(fonte, snapshotSha256 ?? "", localizador),
      fonte,
      snapshotSha256,
      localizador,
      propriedade: "defesa_civil.atendimento",
      valor: categoria === "nao_informada" ? null : categoria,
      unidade: null,
      estadoDoValor: categoria === "nao_informada" ? "desconhecido" : "conhecido",
      entidades,
      geometria: null,
      tempos: { evento: null, precisaoDoEvento: "nenhuma", administrativo: l.data, publicado: null, recuperado: recuperadoEm },
      // A categoria vem vazia em 79–97% das linhas; o tipo de solicitação ("Monitoramento", "Vistoria em Imóveis") fica no trecho.
      trecho: `${l.categoriaBruta.slice(0, 80) || "sem categoria"} · ${l.solicitacao.slice(0, 60) || "sem solicitação"} · ${l.rua.slice(0, 100)} · ${l.bairro.slice(0, 40)}`.slice(0, 300),
      metodo: { nome: `${ANALISADOR_DEFESA_CIVIL.nome}_${l.layout}`, versao: ANALISADOR_DEFESA_CIVIL.versao },
    }));
  });
  return { observacoes, quarentena, contagens };
}
