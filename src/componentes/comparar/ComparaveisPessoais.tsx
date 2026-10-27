import { useState } from "react";
import { router } from "expo-router";
import type { AnaliseV2 } from "../../dados/contratos";
import { comparaveisPessoais } from "../../dados/comparaveisPessoais";
import { custoMensal } from "../../dados/custos";
import { formatarData, formatarReais } from "../../dados/formatos";
import { CampoLocal, GrupoLocal } from "../caderno/blocos";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { View } from "react-native";
export function ComparaveisPessoais({lista,referencia}:{lista:AnaliseV2[];referencia:AnaliseV2}) {
 const [bairro,setBairro]=useState(referencia.bairroTexto),[min,setMin]=useState(""),[max,setMax]=useState("");
 const area=(v:string)=>v.trim()?Number(v.replace(",",".")):null;
 let resultados:AnaliseV2[]=[],erro="";
 try{resultados=comparaveisPessoais(lista,referencia,{bairro,areaMin:area(min),areaMax:area(max)});}catch{erro="Informe áreas positivas e mínimo menor ou igual ao máximo. Vazio não filtra por área.";}
 return <GrupoLocal titulo="Comparáveis do meu caderno" apoio={`Referência: ${referencia.nome}. Mesma modalidade e tipologia (${referencia.tipologia}). Apenas seus registros; não é amostra de mercado ou estimativa de preço justo.`}>
  <CampoLocal rotulo="Bairro dos comparáveis pessoais (vazio: todos)" value={bairro} onChangeText={setBairro} maxLength={100}/>
  <CampoLocal rotulo="Área mínima declarada dos comparáveis, em m²" value={min} onChangeText={setMin} keyboardType="decimal-pad"/>
  <CampoLocal rotulo="Área máxima declarada dos comparáveis, em m²" value={max} onChangeText={setMax} keyboardType="decimal-pad"/>
  {erro?<Texto role="alert">{erro}</Texto>:<Texto>{resultados.length} registros compatíveis após filtros e deduplicação por URL; {Math.min(10,resultados.length)} exibidos. Área pendente fica fora quando há filtro de área.</Texto>}
  {resultados.slice(0,10).map(a=>{const c=custoMensal(a);return <View key={a.id} style={{gap:5,marginVertical:8}}><Texto tipo="secao">{a.nome}</Texto>
    <Texto>{a.declarados.area.aConfirmar||a.declarados.area.valor===null?"Área a confirmar":`${a.declarados.area.valor} m² declarados`} · {a.bairroTexto||"Bairro não informado"}</Texto>
    <Texto>Mensal conhecido: {c.totalMensalConhecido===null?"A confirmar":formatarReais(c.totalMensalConhecido)}</Texto><Texto tipo="apoio">{c.notaForaDaSoma??"Parcelas recorrentes informadas."}</Texto>
    {a.modalidade==="compra"?<Texto>Aquisição: {a.declarados.preco.aConfirmar||a.declarados.preco.valor===null?"A confirmar":formatarReais(a.declarados.preco.valor)}</Texto>:null}
    <Texto tipo="apoio">Atualizado no caderno em {formatarData(a.atualizadaEm.slice(0,10))}; não é data de publicação do anúncio. Anúncios distintos da mesma unidade podem exigir revisão manual.</Texto>
    <Botao rotulo="Abrir comparável" acessivel={`Abrir comparável ${a.nome}`} onPress={()=>router.push({pathname:"/dossie",params:{id:a.id}})}/>
  </View>;})}
 </GrupoLocal>;
}
