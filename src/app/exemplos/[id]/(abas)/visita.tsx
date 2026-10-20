import { router } from "expo-router";
import { useState } from "react";
import { Share, TextInput, View } from "react-native";
import { Botao, BotaoIcone } from "../../../../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../../../../componentes/Cartao";
import { AreaDeBotoes, Cabecalho, Rolagem, Tela } from "../../../../componentes/Tela";
import { Texto } from "../../../../componentes/Texto";
import { mensagemPadrao } from "../../../../componentes/visita/textosDaVisita";
import { ListaDoRoteiro } from "../../../../componentes/visita/Roteiro";
import { useAparelho } from "../../../../estado/Aparelho";
import { useDossie } from "../../../../navegacao/useDossie";
import { useTema } from "../../../../tema/Tema";
import { ESPACO, RAIO, TIPOS } from "../../../../tema/tokens";

export default function TelaDaVisita() {
  const dossie = useDossie();
  const { cor } = useTema();
  const { dados, mudar } = useAparelho();
  const mensagem = dados.mensagem[dossie.id] ?? mensagemPadrao(dossie);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(mensagem);
  const [adicionando, setAdicionando] = useState(false);
  const [novoItem, setNovoItem] = useState("");

  const adicionar = () => {
    const texto = novoItem.trim();
    if (!texto) return;
    mudar((atuais) => ({ roteiroExtra: { ...atuais.roteiroExtra, [dossie.id]: [...(atuais.roteiroExtra[dossie.id] ?? []), texto] } }));
    setNovoItem("");
  };

  const alternarEdicao = () => {
    if (editando) mudar((atuais) => ({ mensagem: { ...atuais.mensagem, [dossie.id]: rascunho } }));
    else setRascunho(mensagem);
    setEditando(!editando);
  };

  const campo = {
    backgroundColor: cor("cor-fundo"),
    borderWidth: 1,
    borderColor: cor("cor-linha"),
    borderRadius: RAIO.quadrado,
    color: cor("cor-texto"),
  };

  return (
    <Tela comAbas>
      <Cabecalho titulo="Visita" pai={{ pathname: "/exemplos/[id]", params: { id: dossie.id } }} />
      <Rolagem>
        <Cartao>
          <CorpoDoCartao style={{ gap: 0 }}>
            <Texto tipo="secao" role="heading" style={{ marginBottom: ESPACO[3] }}>
              Roteiro
            </Texto>
            <ListaDoRoteiro dossie={dossie} />
            {adicionando ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2], marginTop: ESPACO[2] }}>
                <TextInput
                  autoFocus
                  value={novoItem}
                  onChangeText={setNovoItem}
                  onSubmitEditing={adicionar}
                  accessibilityLabel="Adicionar item"
                  returnKeyType="done"
                  style={[TIPOS.corpo, campo, { flex: 1, minHeight: 40, paddingHorizontal: ESPACO[3] }]}
                />
                <BotaoIcone icone="plus" acessivel="Adicionar item" onPress={adicionar} />
              </View>
            ) : null}
            <Botao rotulo="Adicionar item" icone="plus" tamanhoIcone="p" variante="texto" onPress={() => setAdicionando(true)} />
          </CorpoDoCartao>
        </Cartao>
        <Cartao>
          <CorpoDoCartao>
            <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
              <Texto tipo="secao" role="heading" style={{ flex: 1 }}>
                Mensagem ao corretor
              </Texto>
              <Botao rotulo="Editar" variante="texto" onPress={alternarEdicao} style={{ alignSelf: "center" }} />
            </View>
            {editando ? (
              <TextInput
                autoFocus
                multiline
                value={rascunho}
                onChangeText={setRascunho}
                accessibilityLabel="Mensagem ao corretor"
                style={[TIPOS.corpo, campo, { minHeight: 120, padding: ESPACO[3], textAlignVertical: "top" }]}
              />
            ) : (
              <View style={{ padding: ESPACO[3], backgroundColor: cor("cor-fundo"), borderRadius: RAIO.quadrado }}>
                <Texto>{mensagem}</Texto>
              </View>
            )}
            <Botao
              rotulo="Enviar ao corretor"
              icone="share"
              onPress={() => void Share.share({ message: editando ? rascunho : mensagem })}
            />
          </CorpoDoCartao>
        </Cartao>
        <AreaDeBotoes>
          <Botao
            rotulo="Começar visita"
            variante="principal"
            onPress={() => router.push({ pathname: "/exemplos/[id]/visita/ao-vivo", params: { id: dossie.id } })}
          />
        </AreaDeBotoes>
      </Rolagem>
    </Tela>
  );
}
