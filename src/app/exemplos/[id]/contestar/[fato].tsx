import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Botao } from "../../../../componentes/Botao";
import { CaixaDeMarcar } from "../../../../componentes/Controles";
import { Folha } from "../../../../componentes/Folha";
import { LinhaDeValor, Valores } from "../../../../componentes/fatos/Valores";
import { voltarOu } from "../../../../componentes/Tela";
import { Texto } from "../../../../componentes/Texto";
import { acharFato, secaoDoFato } from "../../../../dados/consultas";
import { hojeIso } from "../../../../dados/formatos";
import { chaveDoFato, useAparelho } from "../../../../estado/Aparelho";
import { useSessao } from "../../../../estado/Sessao";
import { useDossie } from "../../../../navegacao/useDossie";
import { ESPACO } from "../../../../tema/tokens";

const MOTIVOS = ["O valor está diferente do que vi", "Não é deste prédio", "Está desatualizado", "A fonte não diz isso"];

export default function IssoEstaErrado() {
  const dossie = useDossie();
  const { fato: idFato } = useLocalSearchParams<{ fato: string }>();
  const { mudar: mudarAparelho } = useAparelho();
  const { mudar: mudarSessao, abrirSecao } = useSessao();
  const [motivo, setMotivo] = useState<string | null>(null);
  const fato = acharFato(dossie, idFato);
  if (!fato) throw new Error(`Fato não encontrado: ${idFato}`);
  const pai = { pathname: "/exemplos/[id]", params: { id: dossie.id } } as const;

  const enviar = () => {
    if (!motivo) return;
    const chave = chaveDoFato(dossie.id, fato.id);
    mudarAparelho((atuais) => ({ contestacoes: { ...atuais.contestacoes, [chave]: { data: hojeIso(), motivo } } }));
    mudarSessao(() => ({ recebido: chave }));
    const secao = secaoDoFato(dossie, fato.id);
    if (secao) abrirSecao(dossie.id, secao.id);
    voltarOu(pai);
  };

  return (
    <Folha titulo="Isso está errado" pai={pai}>
      <View style={{ gap: ESPACO[3] }}>
        {"regua" in fato ? (
          <Texto>{fato.texto}</Texto>
        ) : (
          <Valores>
            <LinhaDeValor dossie={dossie} fato={fato} secao={secaoDoFato(dossie, fato.id)} nome={null} />
          </Valores>
        )}
        <View role="radiogroup" accessibilityLabel="Isso está errado">
          {MOTIVOS.map((m) => (
            <CaixaDeMarcar key={m} rotulo={m} radio marcada={motivo === m} aoMudar={() => setMotivo(m)} />
          ))}
        </View>
        <Botao rotulo="Enviar" variante="principal" desativado={!motivo} onPress={enviar} />
      </View>
    </Folha>
  );
}
