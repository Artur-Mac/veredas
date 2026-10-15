import { Redirect } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Botao } from "../../../componentes/Botao";
import { Alterna, Segmentado } from "../../../componentes/Controles";
import { EtiquetaFase } from "../../../componentes/Etiquetas";
import { Folha } from "../../../componentes/Folha";
import { voltarOu } from "../../../componentes/Tela";
import { Texto } from "../../../componentes/Texto";
import { useAparelho, type Domicilio } from "../../../estado/Aparelho";
import { useMostrarFinal } from "../../../estado/fatos";
import { useDossie } from "../../../navegacao/useDossie";
import { ESPACO } from "../../../tema/tokens";

const PESSOAS = ["1", "2", "3 a 4", "5 ou mais"].map((v) => ({ valor: v, nome: v }));
const VEICULOS = ["0", "1", "2 ou mais"].map((v) => ({ valor: v, nome: v }));

export default function DadosDoDomicilio() {
  const dossie = useDossie();
  const mostrarFinal = useMostrarFinal();
  const { dados, mudar } = useAparelho();
  const [rascunho, setRascunho] = useState<Domicilio>(dados.domicilio);
  const [apagados, setApagados] = useState(false);
  const pai = { pathname: "/dossie/[id]", params: { id: dossie.id } } as const;
  if (!mostrarFinal) return <Redirect href={pai} />;

  const alterar = (mudanca: Partial<Domicilio>) => {
    setApagados(false);
    setRascunho((atual) => ({ ...atual, ...mudanca }));
  };

  return (
    <Folha titulo="Dados do domicílio" pai={pai}>
      <View style={{ gap: ESPACO[3] }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
          <EtiquetaFase fase="final" />
          <Texto tipo="apoio" cor="cor-texto-apoio">
            Fica só neste aparelho.
          </Texto>
        </View>
        <View style={{ gap: ESPACO[2] }}>
          <Texto tipo="secao">Pessoas</Texto>
          <Segmentado rotulo="Pessoas" opcoes={PESSOAS} valor={rascunho.pessoas} aoMudar={(pessoas) => alterar({ pessoas })} />
        </View>
        <Alterna rotulo="Criança em idade escolar" ligado={Boolean(rascunho.crianca)} aoMudar={(crianca) => alterar({ crianca })} />
        <View style={{ gap: ESPACO[2] }}>
          <Texto tipo="secao">Veículos</Texto>
          <Segmentado rotulo="Veículos" opcoes={VEICULOS} valor={rascunho.veiculos} aoMudar={(veiculos) => alterar({ veiculos })} />
        </View>
        <Alterna rotulo="Deslocamento" ligado={Boolean(rascunho.deslocamento)} aoMudar={(deslocamento) => alterar({ deslocamento })} />
        <Alterna rotulo="Pet" ligado={Boolean(rascunho.pet)} aoMudar={(pet) => alterar({ pet })} />
        <Texto role="status">{apagados ? "Dados apagados." : ""}</Texto>
        <Botao
          rotulo="Salvar"
          variante="principal"
          onPress={() => {
            mudar(() => ({ domicilio: rascunho }));
            voltarOu(pai);
          }}
        />
        <Botao
          rotulo="Apagar"
          onPress={() => {
            mudar(() => ({ domicilio: {} }));
            setRascunho({});
            setApagados(true);
          }}
        />
      </View>
    </Folha>
  );
}
