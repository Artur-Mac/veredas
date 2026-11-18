import { router } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Botao } from "../../../componentes/Botao";
import { PilulaIlustrativo } from "../../../componentes/Etiquetas";
import { Mapa, type InfoDosCandidatos } from "../../../componentes/mapa/Mapa";
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
  const [info, setInfo] = useState<InfoDosCandidatos | null>(null);
  const aoMudarCandidatos = useCallback((nova: InfoDosCandidatos) => setInfo(nova), []);
  // Sem candidato (o fundo falhou, ainda carrega ou não tem lote aqui) não há o que confirmar: nada de lote inventado.
  const semCandidatos = !info || info.quantos === 0;
  const podeConfirmar = !semCandidatos && info.escolhido;
  const situacao = semCandidatos
    ? info?.estado === "carregando" || !info
      ? "Carregando os lotes do cadastro…"
      : info.estado === "falhou"
        ? "Não dá para escolher o lote agora: os lotes do cadastro não carregaram. Use “Tentar de novo” no mapa."
        : "Não há lotes do cadastro neste ponto do mapa: não dá para escolher o lote aqui."
    : null;
  const pavimentos = fatoDe(dossie, "predio", "pavimentos");
  const apoio = `${enderecoDoDossie(dossie)}${pavimentos ? `, ${pavimentos.texto} pavimentos no cadastro` : ""}`;

  const decidir = (confirmado: boolean) => {
    mudar((atuais) => ({ lotesConfirmados: { ...atuais.lotesConfirmados, [dossie.id]: confirmado } }));
    if (router.canDismiss()) router.dismissTo({ pathname: "/exemplos/[id]", params: { id: dossie.id } });
    else router.replace({ pathname: "/exemplos/[id]", params: { id: dossie.id } });
  };

  return (
    <Tela>
      <Cabecalho titulo="Confirmar o lote" pai={{ pathname: "/exemplos/[id]", params: { id: dossie.id } }} />
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
        oQueContinua="Sem elas, não dá para escolher o lote agora."
        aoMudarCandidatos={aoMudarCandidatos}
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
        {situacao ? (
          <Texto role="status" cor="cor-texto-apoio">
            {situacao}
          </Texto>
        ) : (
          <Texto tipo="apoio" cor="cor-texto-apoio">
            {podeConfirmar
              ? "Em azul, o lote escolhido; tracejados, os lotes vizinhos do cadastro da Prefeitura."
              : "Tracejados, os lotes do cadastro da Prefeitura. Toque num deles para escolher."}
          </Texto>
        )}
        {naoEEste && !semCandidatos ? <Texto>Escolha o prédio no mapa.</Texto> : null}
        <Botao rotulo="É este prédio" variante="principal" desativado={!podeConfirmar} onPress={() => decidir(true)} />
        <Botao rotulo="Não é este" desativado={semCandidatos} onPress={() => setNaoEEste(true)} />
        {dossie.tipo === "aluguel" ? (
          <Botao rotulo="Pular por agora" variante="texto" onPress={() => decidir(false)} style={{ alignSelf: "center" }} />
        ) : null}
      </View>
    </Tela>
  );
}
