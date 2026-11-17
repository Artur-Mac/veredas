import { useState } from "react";
import { View } from "react-native";
import { esquemaCenario, type Caderno } from "../../dados/caderno";
import { formatarCentavos } from "../../dados/formatos";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, centavosDaEntrada, EscolhaLocal } from "./blocos";
type Cenario = Caderno["cenarios"][number];
type Item = NonNullable<Cenario["itens"]>[number];
const entrada = (v: number | null) => v === null ? "" : (v / 100).toFixed(2).replace(".", ",");
export function EditarCenario({ cenario, salvar }: { cenario: Cenario; salvar: (mudar: (c: Caderno) => Caderno) => Promise<boolean> }) {
  const [base, setBase] = useState<Cenario | null>(null);
  const [nome, setNome] = useState(""); const [meses, setMeses] = useState("");
  const [inicial, setInicial] = useState(""); const [mensal, setMensal] = useState(""); const [caucao, setCaucao] = useState("");
  const [modo, setModo] = useState<"totais" | "itens">("totais"); const [itens, setItens] = useState<Item[]>([]);
  const [titulo, setTitulo] = useState(""); const [categoria, setCategoria] = useState<Item["categoria"]>("inicial");
  const [valor, setValor] = useState(""); const [duracao, setDuracao] = useState(""); const [fonte, setFonte] = useState(""); const [erro, setErro] = useState("");
  const abrir = () => { setBase(cenario); setNome(cenario.nome); setMeses(String(cenario.meses)); setInicial(entrada(cenario.despesasIniciaisCentavos)); setMensal(entrada(cenario.extrasMensaisCentavos)); setCaucao(entrada(cenario.caucaoCentavos)); setItens(cenario.itens ?? []); setModo(cenario.itens && cenario.usarItens !== false ? "itens" : "totais"); setErro(""); };
  const adicionar = () => {
    try {
      const item = esquemaCenario.shape.itens.unwrap().element.parse({ id: `item-${Date.now().toString(36)}-${itens.length}`, titulo, categoria,
        valorCentavos: centavosDaEntrada(valor), duracaoMeses: categoria === "mensal" && duracao.trim() ? Number(duracao) : null, fonte });
      if (itens.length >= 50) throw new Error(); setItens([...itens,item]); setTitulo(""); setValor(""); setFonte(""); setDuracao(""); setErro("");
    } catch { setErro("Confira descrição, fonte, valor (ou vazio) e duração mensal de 1 a 600 meses. Limite de 50 itens."); }
  };
  const guardar = async () => {
    if (!base) return;
    try {
      const novo = esquemaCenario.parse({ ...base, nome, meses: Number(meses), despesasIniciaisCentavos: centavosDaEntrada(inicial), extrasMensaisCentavos: centavosDaEntrada(mensal), caucaoCentavos: centavosDaEntrada(caucao),
        itens: itens.length || modo === "itens" ? itens : undefined, usarItens: modo === "itens" });
      const ok = await salvar(c => {
        const atual = c.cenarios.find(v => v.id === base.id);
        if (JSON.stringify(atual) !== JSON.stringify(base)) throw new Error("Cenário mudou durante a edição.");
        return { ...c, cenarios: c.cenarios.map(v => v.id === novo.id ? novo : v) };
      });
      if (ok) setBase(null); else setErro("Não foi possível gravar. Reabra o cenário para conferir a versão atual; sua prévia permanece aqui.");
    } catch { setErro("Confira nome, valores e horizonte. Se o cenário mudou, cancele e reabra antes de aplicar."); }
  };
  if (!base) return <Botao rotulo="Editar hipóteses e despesas" acessivel={`Editar cenário ${cenario.nome}`} onPress={abrir} />;
  return <View style={{ gap: 8 }}>
    <Texto tipo="secao">Editar cenário</Texto>
    <CampoLocal rotulo="Nome do cenário em edição" value={nome} onChangeText={setNome} maxLength={100} />
    <CampoLocal rotulo="Horizonte do cenário em edição, em meses" value={meses} onChangeText={setMeses} keyboardType="number-pad" />
    <EscolhaLocal rotulo="Como calcular este cenário" valor={modo} opcoes={[{valor:"totais",rotulo:"Totais informados"},{valor:"itens",rotulo:"Itens detalhados"}]} aoEscolher={setModo} />
    <Texto tipo="apoio">Somente o modo selecionado entra na conta. Os totais e os itens ficam preservados para trocar de modo, sem somar os dois. Consumos do perfil doméstico não são acrescentados automaticamente.</Texto>
    {modo === "totais" ? <>
      <CampoLocal rotulo="Despesa inicial total em edição, em R$" value={inicial} onChangeText={setInicial} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Extra mensal total em edição, em R$" value={mensal} onChangeText={setMensal} keyboardType="decimal-pad" />
      <CampoLocal rotulo="Caução total em edição, em R$" value={caucao} onChangeText={setCaucao} keyboardType="decimal-pad" />
    </> : <>
      <Texto tipo="apoio">Registre mudança, instalação, rateio ou outra hipótese com fonte. Categorias sem item continuam desconhecidas; registre um item de valor zero quando souber que não há custo. Não inclua valores já no mensal do anúncio.</Texto>
      {itens.map(i => <View key={i.id}><Texto>{i.titulo} · {i.categoria} · {i.valorCentavos === null ? "A confirmar" : formatarCentavos(i.valorCentavos)}{i.categoria === "mensal" ? ` · ${i.duracaoMeses ?? "todos os"} meses, limitado ao horizonte` : ""}</Texto><Texto tipo="apoio">{i.fonte}</Texto><Botao rotulo="Retirar item da prévia" acessivel={`Retirar item ${i.titulo} da prévia`} onPress={() => setItens(itens.filter(v => v.id !== i.id))} /></View>)}
      <CampoLocal rotulo="Descrição da despesa detalhada" value={titulo} onChangeText={setTitulo} maxLength={120} />
      <EscolhaLocal rotulo="Categoria da despesa detalhada" valor={categoria} opcoes={[{valor:"inicial",rotulo:"Despesa inicial"},{valor:"mensal",rotulo:"Extra mensal"},{valor:"reembolsavel",rotulo:"Reembolsável"}]} aoEscolher={setCategoria} />
      <CampoLocal rotulo="Valor do item em R$" value={valor} onChangeText={setValor} keyboardType="decimal-pad" />
      {categoria === "mensal" ? <CampoLocal rotulo="Duração do extra em meses (vazio: todo o horizonte)" value={duracao} onChangeText={setDuracao} keyboardType="number-pad" /> : null}
      <CampoLocal rotulo="Fonte ou hipótese da despesa" value={fonte} onChangeText={setFonte} maxLength={300} />
      <Botao rotulo="Acrescentar item à prévia" onPress={adicionar} />
    </>}
    <Botao rotulo="Guardar edição do cenário" onPress={() => void guardar()} />
    <Botao rotulo="Cancelar edição do cenário" onPress={() => setBase(null)} />
    {erro ? <Texto role="alert">{erro}</Texto> : null}
  </View>;
}
