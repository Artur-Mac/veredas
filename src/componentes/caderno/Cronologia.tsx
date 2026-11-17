import { useEffect, useState } from "react";
import { View } from "react-native";
import type { AnaliseV2 } from "../../dados/contratos";
import { eventosDoIndice } from "../../dados/cronologiaPublica";
import { linhaDoTempo, type EventoDaAnalise } from "../../dados/complementos";
import { eCoberto } from "../../dados/recife/bairros";
import { edificioPorId, indiceDoBairro } from "../../dados/recife/indice";
import { formatarData } from "../../dados/formatos";
import { Texto } from "../Texto";
export function CronologiaDaAnalise({ analise:a }:{analise:AnaliseV2}) {
 const id=a.vinculo.estado==="confirmado"?a.vinculo.edificioId:null;
 const chave=`${a.bairro??""}/${id??""}`;
 const [leitura,setLeitura]=useState<{chave:string;publicos:EventoDaAnalise[];estado:string}|null>(null);
 useEffect(()=>{
  const tarefa=setTimeout(()=>{
   if(!id||!eCoberto(a.bairro)){setLeitura({chave,publicos:[],estado:"Sem referência cadastral confirmada; apenas seus registros aparecem nesta linha do tempo."});return;}
   try{const e=edificioPorId(id,a.bairro);setLeitura({chave,publicos:e?eventosDoIndice(e,indiceDoBairro(a.bairro)):[],estado:e?"Eventos do índice atual e registros pessoais. Datas com precisão diferente não comprovam a ordem exata dentro de um ano/mês ou relação causal.":"Referência ausente do índice atual; seus registros foram preservados."});}
   catch{setLeitura({chave,publicos:[],estado:"Não foi possível ler a cronologia pública local. Seus registros continuam disponíveis."});}
  },0);return()=>clearTimeout(tarefa);
 },[id,a.bairro,chave]);
 const publicos=leitura?.chave===chave?leitura.publicos:[],estado=leitura?.chave===chave?leitura.estado:"Consultando o índice local…";
 const eventos=[...publicos,...linhaDoTempo(a)].sort((a,b)=>a.data===null?(b.data===null?a.id.localeCompare(b.id):1):b.data===null?-1:b.data.localeCompare(a.data));
 return <><Texto tipo="apoio">{estado}</Texto>{eventos.length===0?<Texto>Ainda não há eventos datados ou documentos apresentados no caderno.</Texto>:null}
  {eventos.map(e=><View key={e.id} style={{gap:4,marginVertical:8}}><Texto tipo="secao">{e.titulo}</Texto><Texto>{e.data?(e.data.length===4?e.data:formatarData(e.data.slice(0,10))):"Data do evento não informada"}</Texto><Texto tipo="apoio">{e.fonte} · {e.tipoDeData}</Texto></View>)}
 </>;
}
