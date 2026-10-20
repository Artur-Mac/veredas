import { View } from "react-native";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Gaveta } from "../casca/Gaveta";
import { Texto } from "../Texto";

type Props = {
  visivel: boolean;
  saldo: number;
  trabalhando: boolean;
  /** Texto de erro da recarga, quando falha. */
  erro?: string;
  aoRecarregar: () => void;
  aoFechar: () => void;
};

/** Gaveta de Créditos aberta quando o saldo não cobre a confirmação do prédio. */
export function GavetaSemCreditos({ visivel, saldo, trabalhando, erro = "", aoRecarregar, aoFechar }: Props) {
  const { cor } = useTema();
  return (
    <Gaveta
      visivel={visivel}
      titulo="Sem créditos para confirmar o prédio"
      subtitulo="Uso interno e educacional da prova de conceito"
      aoFechar={aoFechar}
    >
      <View style={{ gap: ESPACO[4], paddingVertical: ESPACO[3] }}>
        <View style={{ backgroundColor: cor("cor-creme"), padding: ESPACO[4], borderRadius: RAIO.quadrado, gap: 6 }}>
          <Texto tipo="etiqueta" cor="cor-texto-apoio">
            SALDO DISPONÍVEL
          </Texto>
          <Texto tipo="numero">{`${saldo} ${saldo === 1 ? "crédito" : "créditos"}`}</Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio">
            Confirmar o prédio usa 1 crédito. Na versão de teste, créditos não têm valor em dinheiro.
          </Texto>
        </View>
        {erro ? (
          <Texto tipo="apoio" style={{ color: cor("cor-barro") }} accessibilityLiveRegion="polite">
            {erro}
          </Texto>
        ) : null}
        <Botao
          rotulo="Recarregar 3 créditos de teste"
          variante="principal"
          desativado={trabalhando}
          onPress={aoRecarregar}
        />
      </View>
    </Gaveta>
  );
}
