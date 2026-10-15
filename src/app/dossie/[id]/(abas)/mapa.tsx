import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Platform, ScrollView, View } from "react-native";
import { Botao } from "../../../../componentes/Botao";
import { Segmentado } from "../../../../componentes/Controles";
import { EtiquetaFase, PilulaIlustrativo, SoNoFinal } from "../../../../componentes/Etiquetas";
import { Folha } from "../../../../componentes/Folha";
import { LinhaDeValor } from "../../../../componentes/fatos/Valores";
import { Icone } from "../../../../componentes/Icone";
import type { NomeIcone } from "../../../../componentes/icones";
import { Mapa, type Camada } from "../../../../componentes/mapa/Mapa";
import { Pressionavel } from "../../../../componentes/Pressionavel";
import { Cabecalho, Tela } from "../../../../componentes/Tela";
import { Texto } from "../../../../componentes/Texto";
import { enderecoDoDossie, fato as fatoDe, secao as secaoDe, tipoDoDossie } from "../../../../dados/consultas";
import type { Dossie } from "../../../../dados/esquema";
import { formatarNumero } from "../../../../dados/formatos";
import { linkDoMapa } from "../../../../dados/geo";
import { TEXTO_ROTAS } from "../../../../dados/textos";
import { useLoteConfirmado, useMostrarFinal } from "../../../../estado/fatos";
import { useDossie } from "../../../../navegacao/useDossie";
import { useTema } from "../../../../tema/Tema";
import { ESPACO, RAIO, type TokenDeCor } from "../../../../tema/tokens";

const CATEGORIAS: { id: string; nome: string; icone: NomeIcone; cor: TokenDeCor }[] = [
  { id: "saude", nome: "Saúde", icone: "first-aid-kit", cor: "cat-goiaba" },
  { id: "escolas", nome: "Escolas", icone: "school", cor: "cat-ipe-roxo" },
  { id: "mercados", nome: "Mercados", icone: "shopping-cart", cor: "cat-ipe-amarelo" },
  { id: "estacoes", nome: "Estações", icone: "train", cor: "cat-mare" },
];

const CAMADAS: { valor: Camada; nome: string }[] = [
  { valor: "ruas", nome: "Ruas" },
  { valor: "3d", nome: "3D e sombra" },
  { valor: "calor", nome: "Calor" },
  { valor: "alagamento", nome: "Alagamento" },
];

function eCamada(valor: string | undefined): valor is Camada {
  return CAMADAS.some((c) => c.valor === valor);
}

function PainelDaCamada({ dossie, camada }: { dossie: Dossie; camada: Camada }) {
  const { cor } = useTema();
  if (camada === "3d") {
    const altura = fatoDe(dossie, "sol", "altura");
    if (!altura) return null;
    return (
      <View>
        <LinhaDeValor dossie={dossie} fato={altura} secao={secaoDe(dossie, "sol")} />
        <Texto tipo="apoio" cor="cor-texto-apoio">
          {altura.escala}
        </Texto>
      </View>
    );
  }
  if (camada === "calor") {
    const calor = fatoDe(dossie, "calor", "calor_amplitude");
    if (!calor) return null;
    if (calor.estado === "nao_sabemos" || typeof calor.valor !== "number") {
      return (
        <View>
          <LinhaDeValor dossie={dossie} fato={calor} secao={secaoDe(dossie, "calor")} />
          <Texto tipo="apoio" cor="cor-texto-apoio">
            {calor.escala}
          </Texto>
        </View>
      );
    }
    return (
      <View style={{ gap: ESPACO[2] }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
          <Texto tipo="apoio">0 °C</Texto>
          <View aria-hidden style={{ flex: 1, height: 8, borderRadius: 4, flexDirection: "row", overflow: "hidden" }}>
            {Array.from({ length: 12 }, (_, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: cor("cor-texto"), opacity: 0.06 + (i / 11) * 0.54 }} />
            ))}
          </View>
          <Texto tipo="apoio">{`${formatarNumero(calor.valor, 1)} °C`}</Texto>
          <PilulaIlustrativo />
        </View>
        <Texto tipo="apoio" cor="cor-texto-apoio">
          {calor.texto}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio">
          {calor.escala}
        </Texto>
      </View>
    );
  }
  if (camada === "alagamento") {
    const faixa = fatoDe(dossie, "alagamento", "faixa_marginal");
    return faixa ? <LinhaDeValor dossie={dossie} fato={faixa} secao={secaoDe(dossie, "alagamento")} /> : null;
  }
  return null;
}

export default function TelaDoMapa() {
  const dossie = useDossie();
  const { cor } = useTema();
  const { camada: pedida } = useLocalSearchParams<{ camada?: string }>();
  const mostrarFinal = useMostrarFinal();
  const confirmado = useLoteConfirmado(dossie);
  const camada: Camada = mostrarFinal && eCamada(pedida) ? pedida : "ruas";
  const [ligadas, setLigadas] = useState<string[]>(CATEGORIAS.map((c) => c.id));
  const [folhaAberta, setFolhaAberta] = useState(false);
  const calor = fatoDe(dossie, "calor", "calor_amplitude");
  const endereco = enderecoDoDossie(dossie);
  const plataforma = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

  return (
    <Tela comAbas>
      <Cabecalho titulo="Mapa" pai={{ pathname: "/dossie/[id]", params: { id: dossie.id } }} />
      <View style={{ backgroundColor: cor("cor-superficie"), paddingHorizontal: ESPACO[4], paddingBottom: ESPACO[3], gap: ESPACO[2] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: ESPACO[2] }}>
          {CATEGORIAS.map((c) => {
            const ligada = ligadas.includes(c.id);
            return (
              <Pressionavel
                key={c.id}
                role="button"
                accessibilityState={{ selected: ligada }}
                accessibilityLabel={c.nome}
                onPress={() => setLigadas((atual) => (ligada ? atual.filter((x) => x !== c.id) : [...atual, c.id]))}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: ESPACO[1],
                  minHeight: 40,
                  paddingHorizontal: ESPACO[3],
                  borderRadius: RAIO.pilula,
                  backgroundColor: cor("cor-superficie"),
                  borderWidth: 1,
                  borderColor: cor("cor-linha"),
                }}
              >
                <Icone nome={c.icone} tamanho="p" cor={ligada ? c.cor : "cor-texto-apoio"} />
                <Texto cor={ligada ? "cor-texto" : "cor-texto-apoio"}>{c.nome}</Texto>
              </Pressionavel>
            );
          })}
        </ScrollView>
        <SoNoFinal>
          <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
            <View style={{ flexShrink: 1 }}>
              <Segmentado
                rotulo="Camada"
                opcoes={CAMADAS}
                valor={camada}
                aoMudar={(nova) => router.setParams({ camada: nova === "ruas" ? undefined : nova })}
              />
            </View>
            <EtiquetaFase fase="final" />
          </View>
        </SoNoFinal>
      </View>
      <Mapa
        key={`${dossie.id}-${camada}`}
        dossie={dossie}
        interativo
        raios={[500, 1000, 1500]}
        lotes={confirmado ? "confirmado" : "nenhum"}
        ajustar={1550}
        camada={camada}
        comCalor={Boolean(calor && calor.estado !== "nao_sabemos")}
        acessivel={endereco}
        rotuloPino={endereco}
        aoTocarPino={() => setFolhaAberta(true)}
        style={{ flex: 1 }}
      />
      <View style={{ backgroundColor: cor("cor-superficie"), paddingHorizontal: ESPACO[4], paddingVertical: ESPACO[3], gap: ESPACO[2] }}>
        <SoNoFinal>
          <PainelDaCamada dossie={dossie} camada={camada} />
        </SoNoFinal>
        <Texto tipo="apoio" cor="cor-texto-apoio">
          Pontos de interesse: Prefeitura do Recife; data de referência pendente de ofício.
        </Texto>
      </View>
      {folhaAberta ? (
        <Folha titulo={endereco} pai={{ pathname: "/dossie/[id]/mapa", params: { id: dossie.id } }} aoFechar={() => setFolhaAberta(false)}>
          <View style={{ gap: ESPACO[3] }}>
            <Texto cor="cor-texto-apoio">{`${tipoDoDossie(dossie)}, ${dossie.bairro}`}</Texto>
            <Botao
              rotulo="Abrir no mapa"
              icone="external-link"
              onPress={() => void Linking.openURL(linkDoMapa(plataforma, dossie.lote.centro, endereco))}
            />
            <Texto tipo="apoio" cor="cor-texto-apoio">
              {TEXTO_ROTAS}
            </Texto>
          </View>
        </Folha>
      ) : null}
    </Tela>
  );
}
