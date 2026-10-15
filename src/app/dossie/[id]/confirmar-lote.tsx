import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Botao } from "../../../componentes/Botao";
import { PilulaIlustrativo } from "../../../componentes/Etiquetas";
import { Mapa } from "../../../componentes/mapa/Mapa";
import { Cabecalho, Tela } from "../../../componentes/Tela";
import { Texto } from "../../../componentes/Texto";
import { enderecoDoDossie, fato as fatoDe } from "../../../dados/consultas";
import { useAparelho } from "../../../estado/Aparelho";
import { useDossie } from "../../../navegacao/useDossie";
import { useTema } from "../../../tema/Tema";
import { ESPACO } from "../../../tema/tokens";

export default function ConfirmarOLote() {
  const dossie = useDossie();
  const { cor } = useTema();
  const { mudar } = useAparelho();
  const [naoEEste, setNaoEEste] = useState(false);
  const [selecionado, setSelecionado] = useState(0);
  const pavimentos = fatoDe(dossie, "predio", "pavimentos");
  const apoio = `${enderecoDoDossie(dossie)}${pavimentos ? `, ${pavimentos.texto} pavimentos no cadastro` : ""}`;

  const decidir = (confirmado: boolean) => {
    mudar((atuais) => ({ lotesConfirmados: { ...atuais.lotesConfirmados, [dossie.id]: confirmado } }));
    if (router.canDismiss()) router.dismissTo({ pathname: "/dossie/[id]", params: { id: dossie.id } });
    else router.replace({ pathname: "/dossie/[id]", params: { id: dossie.id } });
  };

  return (
    <Tela>
      <Cabecalho titulo="Confirmar o lote" pai={{ pathname: "/dossie/[id]", params: { id: dossie.id } }} />
      <Mapa
        dossie={dossie}
        interativo
        raios={[]}
        lotes="candidatos"
        selecionado={selecionado}
        destacarVizinhos={naoEEste}
        ajustar={110}
        acessivel={enderecoDoDossie(dossie)}
        aoTocarLote={setSelecionado}
        style={{ flex: 1 }}
      />
      <View style={{ backgroundColor: cor("cor-superficie"), paddingHorizontal: ESPACO[4], paddingTop: ESPACO[3], paddingBottom: ESPACO[4], gap: ESPACO[2] }}>
        <Texto tipo="barra" role="heading">
          É este o prédio?
        </Texto>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: ESPACO[2] }}>
          <Texto cor="cor-texto-apoio">{apoio}</Texto>
          {dossie.endereco.ilustrativo || dossie.lote.ilustrativo_poligono ? <PilulaIlustrativo /> : null}
        </View>
        {naoEEste ? <Texto>Escolha o prédio no mapa.</Texto> : null}
        <Botao rotulo="É este prédio" variante="principal" onPress={() => decidir(true)} />
        <Botao rotulo="Não é este" onPress={() => setNaoEEste(true)} />
        {dossie.tipo === "aluguel" ? (
          <Botao rotulo="Pular por agora" variante="texto" onPress={() => decidir(false)} style={{ alignSelf: "center" }} />
        ) : null}
      </View>
    </Tela>
  );
}
