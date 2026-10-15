import { useRef, useState } from "react";
import { Linking, Platform, TextInput, View } from "react-native";
import { AbasForaDoDossie } from "../../../componentes/Abas";
import { Botao } from "../../../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../../../componentes/Cartao";
import { EtiquetaFase, SoNoFinal } from "../../../componentes/Etiquetas";
import { Valores } from "../../../componentes/fatos/Valores";
import { Mapa } from "../../../componentes/mapa/Mapa";
import { Cabecalho, Rolagem, Tela } from "../../../componentes/Tela";
import { Texto } from "../../../componentes/Texto";
import { enderecoDoDossie } from "../../../dados/consultas";
import { formatarDistancia } from "../../../dados/formatos";
import { coordenadaParaMetros, distanciaMetros, linkDoMapa, metrosParaCoordenada } from "../../../dados/geo";
import { TEXTO_ROTAS } from "../../../dados/textos";
import { useAparelho } from "../../../estado/Aparelho";
import { useDossie } from "../../../navegacao/useDossie";
import { useTema } from "../../../tema/Tema";
import { ESPACO, RAIO, TIPOS } from "../../../tema/tokens";

export default function CaminhosDiarios() {
  const dossie = useDossie();
  const { cor } = useTema();
  const { dados, mudar } = useAparelho();
  const [adicionando, setAdicionando] = useState(false);
  const [nome, setNome] = useState("");
  const campo = useRef<TextInput>(null);
  const plataforma = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

  return (
    <Tela comAbas>
      <Cabecalho titulo="Caminhos diários" pai={{ pathname: "/dossie/[id]", params: { id: dossie.id } }} />
      <Rolagem>
        <Cartao>
          <CorpoDoCartao>
            {dados.destinos.length ? (
              <Valores>
                {dados.destinos.map((d) => (
                  <View key={`${d.nome}-${d.coordenada.join(",")}`} style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3], paddingVertical: 10 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Texto tipo="secao">{d.nome}</Texto>
                      <Texto tipo="apoio" cor="cor-texto-apoio">
                        {`${formatarDistancia(distanciaMetros(dossie.lote.centro, d.coordenada))} em linha reta a partir do prédio`}
                      </Texto>
                    </View>
                    <Botao
                      rotulo="Abrir rota"
                      icone="external-link"
                      tamanhoIcone="p"
                      pilula
                      style={{ alignSelf: "center" }}
                      onPress={() => void Linking.openURL(linkDoMapa(plataforma, d.coordenada, d.nome, dossie.lote.centro))}
                    />
                  </View>
                ))}
              </Valores>
            ) : (
              <Texto cor="cor-texto-apoio">Guarde os lugares aonde você vai toda semana. Ficam só neste aparelho.</Texto>
            )}
            <Botao
              rotulo="Adicionar destino"
              icone="plus"
              expandido={adicionando}
              onPress={() => {
                setAdicionando(true);
                campo.current?.focus();
              }}
            />
            {adicionando ? (
              <View style={{ gap: ESPACO[3] }}>
                <TextInput
                  ref={campo}
                  autoFocus
                  value={nome}
                  onChangeText={setNome}
                  accessibilityLabel="Adicionar destino"
                  style={[
                    TIPOS.corpo,
                    {
                      minHeight: 40,
                      paddingHorizontal: ESPACO[3],
                      backgroundColor: cor("cor-fundo"),
                      borderWidth: 1,
                      borderColor: cor("cor-linha"),
                      borderRadius: RAIO.quadrado,
                      color: cor("cor-texto"),
                    },
                  ]}
                />
                <Mapa
                  dossie={dossie}
                  interativo
                  raios={[500, 1000]}
                  lotes="confirmado"
                  ajustar={1100}
                  destinos={dados.destinos.map((d) => coordenadaParaMetros(dossie.lote.centro, d.coordenada))}
                  acessivel={enderecoDoDossie(dossie)}
                  aoTocarMapa={([x, y]) => {
                    const limpo = nome.trim();
                    if (!limpo) {
                      campo.current?.focus();
                      return;
                    }
                    mudar((atuais) => ({
                      destinos: [...atuais.destinos, { nome: limpo, coordenada: metrosParaCoordenada(dossie.lote.centro, x, y) }],
                    }));
                    setNome("");
                  }}
                  style={{ height: 220, borderRadius: RAIO.cartao }}
                />
              </View>
            ) : null}
            <Texto tipo="apoio" cor="cor-texto-apoio">
              {TEXTO_ROTAS}
            </Texto>
          </CorpoDoCartao>
        </Cartao>
        <SoNoFinal>
          <Cartao>
            <CorpoDoCartao>
              <EtiquetaFase fase="final" />
              <Texto>Rotina de 3 pontos, isócronas a pé, trânsito típico, verificação da distância declarada</Texto>
            </CorpoDoCartao>
          </Cartao>
        </SoNoFinal>
      </Rolagem>
      <AbasForaDoDossie idDossie={dossie.id} />
    </Tela>
  );
}
