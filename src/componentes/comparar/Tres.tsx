import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import type { AnaliseV2 } from "../../dados/contratos";
import { custoMensal } from "../../dados/custos";
import { formatarReais, formatarData } from "../../dados/formatos";
import { ultimaInspecao } from "../../dados/caderno";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { EscolhaLocal, GrupoLocal } from "../caderno/blocos";
import { GavetaDeEscolha } from "./GavetaDeEscolha";

export function ComparacaoDeTres({ par, candidatas, id, aoEscolher, aoAlternar }: { par: [AnaliseV2, AnaliseV2]; candidatas: AnaliseV2[];
  id: string | null; aoEscolher: (id: string | null) => void; aoAlternar: (aberto: boolean) => void }) {
  const [escolhendo, setEscolhendo] = useState(false);
  const [assunto, setAssunto] = useState<"custo" | "documentos" | "visitas">("custo");
  const opcoes = candidatas.filter(a => a.id !== par[0].id && a.id !== par[1].id);
  const terceira = opcoes.find(a => a.id === id) ?? null;
  return <GrupoLocal titulo="Incluir um terceiro imóvel" apoio="Veja as três opções por assunto, com valores conhecidos e pendências separados." aoAlternar={aoAlternar}>
    <Botao rotulo={terceira ? "Trocar terceiro imóvel" : "Escolher terceiro imóvel"} onPress={() => setEscolhendo(true)} desativado={opcoes.length === 0} />
    {!opcoes.length ? <Texto tipo="apoio">Adicione outra análise da mesma modalidade para comparar três.</Texto> : null}
    {terceira ? <>
      <Botao rotulo="Voltar a comparar dois imóveis" onPress={() => aoEscolher(null)} />
      <EscolhaLocal rotulo="Assunto da comparação ampliada" valor={assunto} opcoes={[{ valor: "custo", rotulo: "Custo" }, { valor: "documentos", rotulo: "Documentos" }, { valor: "visitas", rotulo: "Visitas" }]} aoEscolher={setAssunto} />
      {[...par, terceira].map(a => {
        const custo = custoMensal(a);
        const laudo = ultimaInspecao(a.caderno?.documentos ?? []);
        return <View key={a.id} style={{ gap: 6, marginVertical: 10 }}>
          <Texto tipo="secao">{a.nome}</Texto>
          {assunto === "custo" ? <>
            <Texto>Mensal conhecido: {custo.totalMensalConhecido === null ? "A confirmar" : formatarReais(custo.totalMensalConhecido)}</Texto>
            <Texto tipo="apoio">{custo.notaForaDaSoma ?? "Parcelas recorrentes informadas."}</Texto>
            <Texto tipo="apoio">{custo.principal.rotulo}: {custo.principal.valor === null ? "A confirmar" : formatarReais(custo.principal.valor)}</Texto>
          </> : assunto === "documentos" ? <>
            <Texto>{a.caderno?.documentos.length ?? 0} documentos registrados por você.</Texto>
            <Texto tipo="apoio">Inspeção apresentada com vínculo confirmado: {laudo?.inspecaoEm ? formatarData(laudo.inspecaoEm) : "não informada"}. Não é certificação do prédio.</Texto>
          </> : <>
            <Texto>{a.visita.concluidaEm ? "Visita atual concluída" : "Visita atual ainda não concluída"} · {a.caderno?.visitas.length ?? 0} anteriores arquivadas.</Texto>
            <Texto tipo="apoio">Observações pessoais registradas: {a.caderno?.observacoes.length ?? 0}.</Texto>
          </>}
          <Botao rotulo="Abrir este dossiê" acessivel={`Abrir dossiê de ${a.nome}`} onPress={() => router.push({ pathname: "/dossie", params: { id: a.id } })} />
        </View>;
      })}
      <Texto tipo="apoio">Informação ausente não equivale a custo menor ou condição melhor. Você escolhe o que pesa na decisão.</Texto>
    </> : null}
    <GavetaDeEscolha visivel={escolhendo} titulo="Escolher terceiro imóvel" subtitulo="Análises da mesma modalidade que você não descartou."
      opcoes={opcoes.map(a => ({ id: a.id, titulo: a.nome, detalhe: a.bairroTexto, marcada: a.id === id }))}
      aoEscolher={novo => { aoEscolher(novo); setEscolhendo(false); }} aoFechar={() => setEscolhendo(false)} />
  </GrupoLocal>;
}
