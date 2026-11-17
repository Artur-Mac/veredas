// Espera os arquivos de camada de uma tela (D036: fora do bundle) antes de desenhar o que depende deles. Enquanto
// carregam, uma linha de estado; se algum falhar, a falha dita em claro e "Tentar de novo". O conteúdo só aparece com
// todos em memória: nada é desenhado com uma camada faltando.
import React, { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { View } from "react-native";
import { estadoDasCamadas, garantirCamadas, ouvirCamadas, type EstadoDasCamadas } from "../dados/camadas";
import { ESPACO } from "../tema/tokens";
import { Botao } from "./Botao";
import { Texto } from "./Texto";

export function useCamadas(caminhos: readonly string[]): { estado: EstadoDasCamadas; tentarDeNovo: () => void } {
  const chave = caminhos.join("\n");
  const lista = useMemo(() => (chave ? chave.split("\n") : []), [chave]);
  const ler = useCallback(() => estadoDasCamadas(lista), [lista]);
  const estado = useSyncExternalStore(ouvirCamadas, ler, ler);
  // Entrar na tela carrega o que falta e tenta de novo o que falhou antes (ex.: a rede voltou).
  useEffect(() => {
    if (estadoDasCamadas(lista) !== "pronta") void garantirCamadas(lista).catch(() => undefined);
  }, [lista]);
  const tentarDeNovo = useCallback(() => void garantirCamadas(lista).catch(() => undefined), [lista]);
  return { estado, tentarDeNovo };
}

type Props = {
  caminhos: readonly string[];
  /** Linha de estado enquanto carrega (ex.: "Carregando os dados de Boa Viagem…"). */
  carregando?: string;
  /** O que não pôde ser carregado (ex.: "os dados deste bairro"). */
  oQue?: string;
  children: React.ReactNode;
};

export function EsperaDasCamadas({ caminhos, carregando, oQue, children }: Props) {
  const { estado, tentarDeNovo } = useCamadas(caminhos);
  if (estado === "pronta") return <>{children}</>;
  return <AvisoDasCamadas estado={estado} tentarDeNovo={tentarDeNovo} carregando={carregando} oQue={oQue} />;
}

/** O estado de espera ou de falha, para telas que usam `useCamadas` direto. */
export function AvisoDasCamadas({
  estado,
  tentarDeNovo,
  carregando = "Carregando os dados do bairro…",
  oQue = "os dados deste bairro",
}: {
  estado: Exclude<EstadoDasCamadas, "pronta">;
  tentarDeNovo: () => void;
  carregando?: string;
  oQue?: string;
}) {
  return (
    <View style={{ paddingVertical: ESPACO[4], paddingHorizontal: ESPACO[3], gap: ESPACO[3], alignItems: "flex-start" }}>
      {estado === "carregando" ? (
        <Texto role="status" tipo="apoio" cor="cor-texto-apoio">
          {carregando}
        </Texto>
      ) : (
        <>
          <Texto role="alert" tipo="corpo">
            {`Não foi possível carregar ${oQue}.`}
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio">
            Sem internet, só abrem os bairros já abertos neste aparelho. Esta parte fica fechada até os dados chegarem, para
            não mostrar nada pela metade.
          </Texto>
          <Botao rotulo="Tentar de novo" variante="secundario" onPress={tentarDeNovo} />
        </>
      )}
    </View>
  );
}
