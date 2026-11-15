// "Preparar a negociação" (VE10), em Destaques: primeiro o total conhecido e o que pesa no preço; o "mesmo imóvel"
// salvo duas vezes, se houver; depois uma mensagem editável que você copia e envia por onde quiser. O app não sugere
// valor de proposta nem usa preço de mercado.
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { View } from "react-native";
import type { AnaliseV2, VisaoDoDossie } from "../../dados/contratos";
import { mensagemDeNegociacao, prepararNegociacao } from "../../dados/negociacao";
import { ESPACO } from "../../tema/tokens";
import { Texto } from "../Texto";
import { CampoDeTexto } from "../visita-v1/blocos";
import { Corpo, LinkComSeta, Nota, Sobretitulo, Titulo2 } from "./base";

type Props = { analise: AnaliseV2; visao: VisaoDoDossie; lista: readonly AnaliseV2[] };

export function PrepararNegociacao({ analise, visao, lista }: Props) {
  const n = useMemo(() => prepararNegociacao(analise, visao, lista), [analise, visao, lista]);
  const [aberta, setAberta] = useState(false);
  const [proposta, setProposta] = useState("");
  const [editada, setEditada] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");
  const valorDaProposta = (() => { const v = Number(proposta.replace(/\./g, "").replace(",", ".")); return proposta.trim() && Number.isFinite(v) && v > 0 ? v : null; })();
  const gerada = mensagemDeNegociacao(analise, n, n.argumentos.map((a) => a.id), valorDaProposta);
  const texto = editada ?? gerada;
  if (!n.argumentos.length && n.total.valor === null) return null;
  return (
    <View style={{ gap: ESPACO[2], marginTop: ESPACO[5] }}>
      <Sobretitulo>Antes de propor um valor</Sobretitulo>
      <Titulo2>Preparar a negociação.</Titulo2>
      {/* Lista: cada frase é um item próprio na árvore de acessibilidade, e a leitura não junta, por exemplo, a área do
          IPTU com o ITBI na mesma linha (a área do ITBI inclui área comum; o valor fiscal só se compara por unidade). */}
      <View role="list" aria-label="O que pesa na negociação" style={{ gap: ESPACO[2] }}>
        {[{ id: "total", fato: n.total.texto }, ...n.argumentos.filter((a) => a.peso > 0).slice(0, 3)].map((a) => (
          <View key={a.id} role="listitem"><Corpo>{a.fato}</Corpo></View>
        ))}
      </View>
      {n.mesmoImovel.length ? (
        <Nota>{`Pode ser o mesmo imóvel que ${n.mesmoImovel.map((m) => `"${m.nome}": ${m.motivo}`).join("; ")}. Confira antes de comparar os dois como opções diferentes.`}</Nota>
      ) : null}
      <LinkComSeta rotulo={aberta ? "Ocultar a mensagem" : "Montar uma mensagem"} discreto={aberta} onPress={() => setAberta((x) => !x)} />
      {aberta ? (
        <View style={{ gap: ESPACO[3] }}>
          <CampoDeTexto rotulo={n.aluguel ? "Sua proposta de aluguel por mês (opcional)" : "Sua proposta de preço (opcional)"} keyboardType="numeric" value={proposta}
            onChangeText={(t) => { setProposta(t); setEditada(null); }} placeholder="Deixe vazio para só pedir as confirmações" />
          <CampoDeTexto rotulo="Mensagem (edite à vontade)" linhas={10} value={texto} onChangeText={setEditada} maxLength={4000} />
          <LinkComSeta rotulo="Copiar a mensagem" onPress={() => void Clipboard.setStringAsync(texto).then(() => setAviso("Mensagem copiada. Você escolhe onde enviar.")).catch(() => setAviso("Não foi possível copiar."))} />
          {aviso ? <Texto role="status" tipo="apoio" cor="cor-texto-apoio">{aviso}</Texto> : null}
          <Nota>A mensagem usa só o que está neste dossiê: valores do anúncio, cadastro da Prefeitura e o que você registrou. O VEREDA não envia nada.</Nota>
        </View>
      ) : null}
    </View>
  );
}
