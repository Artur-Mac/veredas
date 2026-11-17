import type { AnaliseV2 } from "./contratos";
const normal = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLowerCase();
function chave(a: AnaliseV2): string {
  try { const u=new URL(a.url); for (const k of [...u.searchParams.keys()]) if (/^utm_/i.test(k)) u.searchParams.delete(k); u.hash=""; return u.href; }
  catch { return "id:"+a.id; }
}
/** Só amostra pessoal. Mesmo prédio não é a mesma unidade. Sem inferir data do
 * anúncio, mercado, área privativa a partir do cadastro ou valores a confirmar. */
export function comparaveisPessoais(lista: readonly AnaliseV2[], referencia: AnaliseV2, filtros: { bairro: string; areaMin: number | null; areaMax: number | null }) {
  if ([filtros.areaMin,filtros.areaMax].some(v=>v!==null&&(!Number.isFinite(v)||v<=0)) || (filtros.areaMin!==null&&filtros.areaMax!==null&&filtros.areaMin>filtros.areaMax)) throw new Error("Intervalo de área inválido.");
  const vistos=new Set<string>([chave(referencia)]);
  return lista.filter(a=>!a.descarte&&a.id!==referencia.id&&a.modalidade===referencia.modalidade&&a.tipologia===referencia.tipologia)
    .slice().sort((a,b)=>b.atualizadaEm.localeCompare(a.atualizadaEm)).filter(a=>{
      if(filtros.bairro.trim()&&normal(a.bairroTexto)!==normal(filtros.bairro))return false;
      const area=a.declarados.area.aConfirmar?null:a.declarados.area.valor;
      if((filtros.areaMin!==null||filtros.areaMax!==null)&&(area===null||(filtros.areaMin!==null&&area<filtros.areaMin)||(filtros.areaMax!==null&&area>filtros.areaMax)))return false;
      const k=chave(a);if(vistos.has(k))return false;vistos.add(k);return true;
    });
}
