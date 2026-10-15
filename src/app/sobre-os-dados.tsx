import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Botao } from "../componentes/Botao";
import { Cartao, Divisor } from "../componentes/Cartao";
import { Icone } from "../componentes/Icone";
import { Pressionavel } from "../componentes/Pressionavel";
import { AreaDeBotoes, Cabecalho, Rolagem, Tela } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { fontesDoApp } from "../dados/consultas";
import { dossies } from "../dados/dossies";
import type { Fonte } from "../dados/esquema";
import { useAparelho } from "../estado/Aparelho";
import { useSessao } from "../estado/Sessao";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO, comAlfa } from "../tema/tokens";

function ItemDaFonte({ fonte }: { fonte: Fonte }) {
  const corpo = (
    <View style={{ flex: 1, gap: 2 }}>
      <Texto tipo="secao">{[fonte.base, fonte.orgao].filter(Boolean).join(", ")}</Texto>
      {fonte.via ? (
        <Texto tipo="apoio" cor="cor-texto-apoio">
          {fonte.via}
        </Texto>
      ) : null}
      {fonte.licenca ? (
        <Texto tipo="apoio" cor="cor-texto-apoio">
          {fonte.licenca}
        </Texto>
      ) : null}
    </View>
  );
  const estilo = { flexDirection: "row" as const, alignItems: "flex-start" as const, gap: ESPACO[3], paddingVertical: ESPACO[3], paddingHorizontal: ESPACO[4], minHeight: 64 };
  const url = fonte.url;
  if (!url) return <View style={estilo}>{corpo}</View>;
  return (
    <Pressionavel role="link" onPress={() => void WebBrowser.openBrowserAsync(url)} style={estilo}>
      {corpo}
      <Icone nome="external-link" tamanho="p" />
    </Pressionavel>
  );
}

export default function SobreOsDados() {
  const { cor } = useTema();
  const { apagarTudo } = useAparelho();
  const { mudar } = useSessao();
  const [confirmando, setConfirmando] = useState(false);
  const fontes = fontesDoApp(dossies.values());

  return (
    <Tela>
      <Cabecalho titulo="Sobre os dados" pai="/" />
      <Rolagem>
        <Cartao>
          {fontes.map((f, i) => (
            <View key={`${f.base}|${f.orgao}`}>
              {i > 0 ? <Divisor /> : null}
              <ItemDaFonte fonte={f} />
            </View>
          ))}
        </Cartao>
        <AreaDeBotoes>
          <Botao rotulo="Apagar dados do aparelho" icone="trash" onPress={() => setConfirmando(true)} />
        </AreaDeBotoes>
      </Rolagem>
      {confirmando ? (
        <View style={StyleSheet.absoluteFill}>
          <Pressable
            accessibilityLabel="Cancelar"
            onPress={() => setConfirmando(false)}
            style={[StyleSheet.absoluteFill, { backgroundColor: comAlfa(cor("cor-texto"), 0.32) }]}
          />
          <View
            role="alertdialog"
            aria-modal
            style={{
              position: "absolute",
              left: ESPACO[4],
              right: ESPACO[4],
              top: "35%",
              backgroundColor: cor("cor-superficie"),
              borderRadius: RAIO.cartao,
              paddingTop: ESPACO[5],
              paddingHorizontal: ESPACO[4],
              paddingBottom: ESPACO[4],
              gap: ESPACO[4],
            }}
          >
            <Texto>Apagar todos os dossiês e destinos deste aparelho? Não dá para desfazer.</Texto>
            <Botao
              rotulo="Apagar"
              variante="principal"
              onPress={() => {
                apagarTudo();
                mudar(() => ({ selecao: [], selecionando: false }));
                router.dismissTo("/");
              }}
            />
            <Botao rotulo="Cancelar" onPress={() => setConfirmando(false)} />
          </View>
        </View>
      ) : null}
    </Tela>
  );
}
