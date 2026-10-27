import { useState } from "react";
import { View } from "react-native";
import type { AnaliseV2 } from "../../dados/contratos";
import { ultimaInspecao } from "../../dados/caderno";
import { custoMensal } from "../../dados/custos";
import { distanciaDaRotina } from "../../dados/rotina";
import { formatarData, formatarReais } from "../../dados/formatos";
import { GrupoLocal } from "../caderno/blocos";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { useEdificios } from "./useEdificios";
const titulos={orcamento:"Orçamento",rotina:"Rotina",documentos:"Edifício e documentos",visita:"Visita"};
type Assunto=keyof typeof titulos;
export function PrioridadesPessoais({analises}:{analises:AnaliseV2[]}) {
 const [ordem,setOrdem]=useState<Assunto[]>(["orcamento","rotina","documentos","visita"]),[destinoId,setDestinoId]=useState<string|null>(null);
 const edificios=useEdificios(analises);
 const destinos=analises.flatMap(a=>(a.caderno?.destinos??[]).map(d=>({chave:`${a.id}/${d.id}`,d,imovel:a.nome})));
 const escolhido=destinos.find(d=>d.chave===destinoId);
 return <GrupoLocal titulo="Comparar pelas minhas prioridades" apoio="Escolha o assunto que quer ver primeiro. A ordem vale nesta tela; não altera dados, não produz nota nem escolhe um vencedor.">
  {ordem.map((assunto,indice)=><View key={assunto} style={{gap:8,marginVertical:10}}>
   <Texto tipo="secao">{indice+1}. {titulos[assunto]}</Texto>
   {indice>0?<Botao rotulo={`Ver ${titulos[assunto]} primeiro`} onPress={()=>setOrdem([assunto,...ordem.filter(v=>v!==assunto)])}/>:null}
   {assunto==="rotina"?<>
    <Texto tipo="apoio">Escolha um único destino para todos os imóveis. Distância reta ao ponto cadastral; não é rota, tempo, acessibilidade ou custo de transporte.</Texto>
    {destinos.length?destinos.map(v=><Botao key={v.chave} rotulo={`${v.chave===destinoId?"✓ ":""}Destino: ${v.d.apelido} · ${v.imovel}`} acessivel={`Comparar destino ${v.chave}`} onPress={()=>setDestinoId(v.chave)}/>):<Texto>Nenhum destino privado registrado nestas análises.</Texto>}
    {escolhido?<Texto tipo="apoio">Mesma posição escolhida de {escolhido.d.apelido}; precisão: {escolhido.d.posicao?.precisaoM??"não informada"} m. Sem precisão de até 100 m, não mostramos distância.</Texto>:null}
   </>:null}
   {analises.map(a=>{const c=custoMensal(a),laudo=ultimaInspecao(a.caderno?.documentos??[]),e=edificios?.get(a.id);const metros=escolhido?distanciaDaRotina(e?.centro??null,escolhido.d):null;
    return <View key={a.id} style={{gap:4,marginVertical:6}}><Texto tipo="secao">{a.nome}</Texto>
     {assunto==="orcamento"?<><Texto>Mensal conhecido: {c.totalMensalConhecido===null?"A confirmar":formatarReais(c.totalMensalConhecido)}</Texto><Texto tipo="apoio">{c.notaForaDaSoma??"Parcelas recorrentes informadas."} Não é custo total menor enquanto houver pendências.</Texto></>:assunto==="rotina"?<Texto>{metros===null?"Distância indisponível: selecione destino com posição precisa e confirme a referência cadastral do prédio.":`Aproximadamente ${metros.toLocaleString("pt-BR")} m em linha reta ao mesmo destino.`}</Texto>:assunto==="documentos"?<><Texto>{a.caderno?.documentos.length??0} documentos apresentados; quantidade não indica condição melhor.</Texto><Texto tipo="apoio">Última inspeção apresentada e vinculada: {laudo?.inspecaoEm?formatarData(laudo.inspecaoEm):"data não informada"}. Escopo: {laudo?.escopo||"não informado"}. Não certifica o prédio.</Texto></>:<Texto>{a.visita.concluidaEm?`Visita atual concluída em ${formatarData(a.visita.concluidaEm.slice(0,10))}`:"Visita atual não concluída"} · {a.caderno?.visitas.length??0} anteriores arquivadas. Respostas são registros pessoais.</Texto>}
    </View>;
   })}
  </View>)}
 </GrupoLocal>;
}
