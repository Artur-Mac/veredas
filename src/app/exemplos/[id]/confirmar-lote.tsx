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
  // A resposta é sobre o prédio do endereço e fica guardada como sim ou não: não depende de o fundo do mapa carregar
  // (M1, 18/11/2026; até 17/11 os botões nunca desligavam). Sem os lotes do cadastro (o fundo falhou, ainda carrega ou
  // não tem lote aqui) nada é inventado: os botões continuam ligados, a tela diz o que falta e "Pular por agora" é a saída.
  const semCandidatos = !info || info.quantos === 0;
  const temEscolhido = !semCandidatos && info.escolhido;
  const faltam: "carregando" | "falhou" | "sem-lotes" | null = !semCandidatos
    ? null
    : // "desligado": o mapa ainda não foi medido e o fundo nem começou a carregar.
      !info || info.estado === "carregando" || info.estado === "desligado"
      ? "carregando"
      : info.estado === "falhou"
        ? "falhou"
        : "sem-lotes";
  const situacao =
    faltam === "carregando"
      ? "Carregando os lotes do cadastro… Dá para responder pelo endereço sem esperar o mapa."
      : faltam === "falhou"
        ? "Os lotes do cadastro não carregaram. Dá para responder pelo endereço acima."
        : faltam === "sem-lotes"
          ? "Não há lotes do cadastro neste ponto do mapa. A resposta vale pelo endereço acima."
          : null;
  const semOutroLote =
    faltam === "carregando"
      ? "Os lotes ainda estão carregando: quando aparecerem, toque no prédio certo no mapa. Ou use “Pular por agora”."
      : faltam === "falhou"
        ? "Sem os lotes do cadastro não dá para escolher outro prédio no mapa. Use “Tentar de novo” no mapa ou “Pular por agora”."
        : "Não há outro lote do cadastro para escolher neste ponto do mapa. Use “Pular por agora”.";
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
        oQueContinua="Sem elas, não dá para escolher o lote no mapa; a resposta pelo endereço continua valendo."
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
          // Depois de "Não é este" sem lotes, a mesma linha passa a dizer por que não dá para escolher outro e quais são as saídas.
          <Texto role="status" cor={naoEEste ? "cor-texto" : "cor-texto-apoio"}>
            {naoEEste ? semOutroLote : situacao}
          </Texto>
        ) : (
          <Texto tipo="apoio" cor="cor-texto-apoio">
            {temEscolhido
              ? "Em azul, o lote escolhido; tracejados, os lotes vizinhos do cadastro da Prefeitura."
              : "Tracejados, os lotes do cadastro da Prefeitura. Toque num deles para escolher."}
          </Texto>
        )}
        {naoEEste && !semCandidatos ? <Texto role="status">Escolha o prédio no mapa.</Texto> : null}
        <Botao rotulo="É este prédio" variante="principal" onPress={() => decidir(true)} />
        <Botao rotulo="Não é este" onPress={() => setNaoEEste(true)} />
        {/* A saída vale para compra e aluguel: sem ela, quem não consegue responder ficava preso na tela. */}
        <Botao rotulo="Pular por agora" variante="texto" onPress={() => decidir(false)} style={{ alignSelf: "center" }} />
      </View>
    </Tela>
  );
}
