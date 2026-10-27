import type { Edificio, IndiceDoBairro } from "./contratos";
import type { EventoDaAnalise } from "./complementos";
/** Agregados já publicados no índice. Nunca inventar a unidade de uma transação
 * fiscal ou tratar uma licença próxima como execução de obra deste prédio. */
export function eventosDoIndice(e: Edificio, indice: Pick<IndiceDoBairro,"obras"|"geradoEm">): EventoDaAnalise[] {
  const fonte=`Prefeitura do Recife · índice local gerado em ${indice.geradoEm}`;
  const eventos:EventoDaAnalise[]=[];
  if(e.anoConstrucao!==null)eventos.push({id:"publico-ano",data:String(e.anoConstrucao),titulo:"Ano da construção no cadastro",fonte:fonte+" · IPTU",tipoDeData:"precisão anual; ano cadastral corrigido, não é data certa de entrega ou inspeção"});
  for(const[ano,n]of e.itbi?.porAno??[])eventos.push({id:`publico-itbi-${ano}`,data:String(ano),titulo:`${n} transmissões fiscais agregadas no endereço`,fonte:fonte+" · ITBI",tipoDeData:"precisão anual; agregado de unidades, não histórico de compra da sua unidade ou preço de mercado"});
  for(const[i,metros]of e.obras150m.recentes){const o=indice.obras[i];if(!o)continue;eventos.push({id:`publico-licenca-${i}`,data:o.data,titulo:`Licença próxima · ${o.descricao}`,fonte:fonte+" · Licenciamento",tipoDeData:`mês de entrada do processo · cerca de ${metros} m do ponto cadastral · situação publicada: ${o.situacao??"não informada"}. Não comprova início, conclusão ou relação com este edifício`});}
  return eventos;
}
