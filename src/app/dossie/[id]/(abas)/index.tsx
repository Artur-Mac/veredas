import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { Share, View, type ScrollView } from "react-native";
import { Botao, BotaoIcone } from "../../../../componentes/Botao";
import { SecoesDoDossie } from "../../../../componentes/dossie/Secoes";
import { CartaoEndereco, CartaoPreco, CartaoVisita, MapaDoTopo } from "../../../../componentes/dossie/Topo";
import { AreaDeBotoes, Cabecalho, Rolagem, Tela } from "../../../../componentes/Tela";
import { secaoDoFato } from "../../../../dados/consultas";
import { useSessao } from "../../../../estado/Sessao";
import { useDossie } from "../../../../navegacao/useDossie";

export default function TelaDoDossie() {
  const dossie = useDossie();
  const { abrirSecao, recebido } = useSessao();
  const rolagem = useRef<ScrollView>(null);
  const posicoes = useRef(new Map<string, number>());

  const medir = useCallback((id: string, y: number) => {
    posicoes.current.set(id, y);
  }, []);

  const irPara = useCallback((chave: string) => {
    const y = posicoes.current.get(chave);
    if (y !== undefined) rolagem.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
  }, []);

  const abrirFato = useCallback(
    (idFato: string) => {
      if (idFato.startsWith("anuncio_")) {
        irPara("endereco");
        return;
      }
      const secao = secaoDoFato(dossie, idFato);
      if (!secao) return;
      abrirSecao(dossie.id, secao.id);
      setTimeout(() => irPara(secao.id), 50);
    },
    [abrirSecao, dossie, irPara],
  );

  useFocusEffect(
    useCallback(() => {
      if (!recebido || !recebido.startsWith(`${dossie.id}/`)) return;
      const idFato = recebido.slice(dossie.id.length + 1);
      const quando = setTimeout(() => (idFato === "regua" ? irPara("preco") : abrirFato(idFato)), 100);
      return () => clearTimeout(quando);
    }, [recebido, dossie.id, irPara, abrirFato]),
  );

  const compartilhar = () => {
    void Share.share({ message: Linking.createURL(`/dossie/${dossie.id}`) });
  };

  return (
    <Tela comAbas>
      <Cabecalho titulo="Dossiê" pai="/" direita={<BotaoIcone icone="share" acessivel="Compartilhar" onPress={compartilhar} />} />
      <Rolagem ref={rolagem}>
        <MapaDoTopo dossie={dossie} />
        <View onLayout={(e) => medir("endereco", e.nativeEvent.layout.y)}>
          <CartaoEndereco dossie={dossie} />
        </View>
        <View onLayout={(e) => medir("preco", e.nativeEvent.layout.y)}>
          <CartaoPreco dossie={dossie} />
        </View>
        <CartaoVisita dossie={dossie} aoAbrirFato={abrirFato} />
        <SecoesDoDossie dossie={dossie} aoMedir={medir} />
        <AreaDeBotoes>
          <Botao
            rotulo="Preparar visita"
            variante="principal"
            onPress={() => router.navigate({ pathname: "/dossie/[id]/visita", params: { id: dossie.id } })}
          />
        </AreaDeBotoes>
      </Rolagem>
    </Tela>
  );
}
