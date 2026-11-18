// A coluna de um imóvel na matriz visual do Comparar (antes a função `montar` dentro de src/app/(abas)/comparar.tsx).
// Fora da tela para que o teste monte as entradas do Comparar e as compare com as do dossiê (pendência 1 do HANDOFF de
// 19/11/2026): mesmo andar, mesma fachada, mesmo selo de conforto e mesma nota de sossego, com e sem bússola.
import type { ColunaMatrizComparar } from "../../componentes/visual/MatrizVisualComparar";
import { lerMicroclimaDoPonto } from "../clima/microclima";
import type { AnaliseV2, Edificio } from "../contratos";
import type { derivarCustoPorPartes } from "../custoPorPartes";
import { edificiosDoBairro } from "../recife/indice";
import { acusticaDaEstimativa } from "../ruido/ponte";
import { escolherUnidadeAtiva, inferirFachadasDaAnalise, lerUnidade } from "./unidadeAtiva";

function vizinhosDe(e: Edificio): Edificio[] {
  try {
    return edificiosDoBairro(e.bairro);
  } catch {
    return [];
  }
}

export function montarColunaDoComparar(item: AnaliseV2, ed: Edificio | null, pt: ReturnType<typeof derivarCustoPorPartes>, nomeCurto: string): ColunaMatrizComparar {
  // Pendência 1 do HANDOFF (19/11/2026): o mesmo andar e a mesma fachada do dossiê (src/dados/dossie/unidadeAtiva.ts),
  // com a fachada da bússola aproximada à inferida, para conforto e ruído. Antes o conforto usava a fachada sugerida e
  // o ruído o grau cru da bússola (prédio 10227-187: "Quente à tarde" no dossiê e "Clima agradável" aqui).
  const inf = inferirFachadasDaAnalise(item, ed, ed ? vizinhosDe(ed) : []);
  const unidade = escolherUnidadeAtiva({
    inferencia: inf,
    pavimentos: ed?.pavimentos ?? null,
    andarDeclarado: item.declarados.andar.valor,
    orientacaoBussolaGraus: item.visita.orientacaoGraus,
    tipologia: item.tipologia,
  });
  const fac = unidade.fachada;
  // O mesmo microclima que o dossiê lê: sem ele, o selo de conforto do mesmo prédio saía diferente nas duas telas.
  const microclima = lerMicroclimaDoPonto(ed?.centro ?? null, item.bairro);
  const { conforto: conf, ruido } = lerUnidade(ed, unidade, microclima);
  const acu = acusticaDaEstimativa(ruido, { anoConstrucao: ed?.anoConstrucao ?? null });
  // A mesma soma do dossiê: a luz é a "Luz estimada" do custo (perfil da casa), não o gasto de ar da regra de conforto.
  const luz = pt.fatiasDaRotina.find((f) => f.id === "energia")?.valorMensalReais ?? 0;
  const baseMensal =
    item.modalidade === "compra"
      ? (pt.simulacaoCompra?.prestacaoPriceReais ?? 0) +
        (item.declarados.condominio.valor ?? 0) +
        Math.round((ed?.iptuAnual?.mediana ?? 0) / 12) +
        luz
      : (pt.oficial.totalMensalConhecido ?? item.declarados.preco.valor ?? 0) + luz;
  return {
    nome: nomeCurto,
    precoPrincipalReais: item.declarados.preco.valor ?? null,
    areaM2: item.declarados.area.valor ?? null,
    mensalBolsoRealReais: baseMensal > 0 ? Math.round(baseMensal) : null,
    orientacaoCurta: fac.orientacaoSolar,
    climaSelo: conf.selo,
    confortoQuente: conf.zona === "quente_tarde" || conf.zona === "tende_abafar",
    // Sem prédio confirmado a fachada sairia de um ponto inventado: o dossiê não mostra conforto, e o Comparar também não.
    confortoSemLeitura: !ed,
    ruidoInternoDb: acu?.ruidoInternoDormitorioDbA ?? null,
    sossego: ruido.estado === "estimado" ? { nota0a10: ruido.notaDeSossego, nivel: ruido.nivelDeSossego, noiteDb: ruido.naJanela.noiteDb, piso: Boolean(ruido.pistaAoLado) } : null,
    anoConstrucao: ed?.anoConstrucao ?? null,
    spuAlerta: Boolean(pt.alertaMarinha),
  };
}
