import { router } from "expo-router";
import { View } from "react-native";
import { agruparPorFonte, enderecoDoDossie, precoPrincipal, reguaComoFato, tipoDoDossie } from "../../dados/consultas";
import type { Dossie, Fato } from "../../dados/esquema";
import { TEXTO_RECEBIDO } from "../../dados/textos";
import { chaveDoFato } from "../../estado/Aparelho";
import { useCarregando, useEstadoDoFato, useLoteConfirmado } from "../../estado/fatos";
import { useSessao } from "../../estado/Sessao";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, comAlfa } from "../../tema/tokens";
import { Botao, LinkDeLinha } from "../Botao";
import { Cartao, CorpoDoCartao } from "../Cartao";
import { PilulaIlustrativo } from "../Etiquetas";
import { Regua } from "../fatos/Regua";
import { Rodape } from "../fatos/Rodape";
import { LinhaDeValor, LinhaNaoSabemos, Valores } from "../fatos/Valores";
import { Icone } from "../Icone";
import type { NomeIcone } from "../icones";
import { Mapa, PilulaDoMapa } from "../mapa/Mapa";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Bloco, Traco } from "../Traco";
import { GaleriaDoAnuncio } from "./Galeria";

function irParaConfirmarLote(dossie: Dossie) {
  router.push({ pathname: "/dossie/[id]/confirmar-lote", params: { id: dossie.id } });
}

export function TopoDoDossie({ dossie }: { dossie: Dossie }) {
  const { cor } = useTema();
  const carregando = useCarregando();
  const estilo = { height: 200, borderRadius: RAIO.cartao, marginHorizontal: ESPACO[3], marginBottom: ESPACO[2] };
  if (carregando) return <View aria-hidden style={[estilo, { backgroundColor: cor("cor-linha") }]} />;
  const mapa = <MapaDeContexto dossie={dossie} estilo={estilo} />;
  if (!dossie.anuncio.imagens?.length) return mapa;
  return (
    <GaleriaDoAnuncio
      key={dossie.id}
      titulo={enderecoDoDossie(dossie)}
      fotos={dossie.anuncio.imagens.map((url) => ({ url, descricao: "Foto do anúncio" }))}
      alternativa={mapa}
      aoAbrirMapa={() => router.navigate({ pathname: "/dossie/[id]/mapa", params: { id: dossie.id } })}
    />
  );
}

function MapaDeContexto({ dossie, estilo }: { dossie: Dossie; estilo: { height: number; borderRadius: number; marginHorizontal: number; marginBottom: number } }) {
  const { cor } = useTema();
  const confirmado = useLoteConfirmado(dossie);
  return (
    <Mapa dossie={dossie} raios={[500]} lotes={confirmado ? "confirmado" : "nenhum"} ajustar={500} acessivel={enderecoDoDossie(dossie)} style={estilo}>
      <View style={{ position: "absolute", left: ESPACO[3], top: ESPACO[3], flexDirection: "row", flexWrap: "wrap", gap: ESPACO[2] }}>
        {confirmado ? (
          dossie.lote.ilustrativo_poligono ? <PilulaIlustrativo fundo="cor-superficie" /> : null
        ) : (
          <>
            <PilulaDoMapa texto="Lote não confirmado" />
            <Pressionavel
              role="link"
              onPress={() => irParaConfirmarLote(dossie)}
              style={{ minHeight: 28, paddingHorizontal: 10, borderRadius: RAIO.pilula, backgroundColor: cor("cor-superficie"), justifyContent: "center" }}
            >
              <Texto tipo="apoio" style={{ textDecorationLine: "underline" }}>
                Confirmar o lote
              </Texto>
            </Pressionavel>
          </>
        )}
      </View>
      <View style={{ position: "absolute", right: ESPACO[3], bottom: ESPACO[3] }}>
        <Botao
          rotulo="Abrir mapa"
          icone="map"
          tamanhoIcone="p"
          pilula
          onPress={() => router.navigate({ pathname: "/dossie/[id]/mapa", params: { id: dossie.id } })}
        />
      </View>
    </Mapa>
  );
}

function Chip({ fato, icone, rotulo }: { fato: Fato | undefined; icone: NomeIcone; rotulo: string }) {
  const { cor } = useTema();
  if (!fato) return null;
  return (
    <View
      accessible
      accessibilityLabel={rotulo}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: ESPACO[1],
        minHeight: 32,
        paddingHorizontal: ESPACO[3],
        borderRadius: RAIO.pilula,
        backgroundColor: cor("cor-fundo"),
      }}
    >
      <Icone nome={icone} tamanho="p" />
      <Texto>{rotulo}</Texto>
    </View>
  );
}

function plural(fato: Fato | undefined, um: string, varios: string): string {
  return fato ? `${fato.texto} ${fato.valor === 1 ? um : varios}` : "";
}

export function CartaoDoAnuncio({ dossie }: { dossie: Dossie }) {
  const { cor } = useTema();
  const carregando = useCarregando();
  const { recebido } = useSessao();
  const c = dossie.anuncio.campos;
  const fatos = [c.area, c.quartos, c.suites, c.banheiros, c.vagas, c.andar].filter((f): f is Fato => f !== undefined);
  const principal = precoPrincipal(dossie);
  const fatosDoAnuncio = [principal, c.condominio, c.iptu].filter((f): f is Fato => f !== undefined);
  return (
    <Cartao>
      <CorpoDoCartao style={{ gap: ESPACO[4] }}>
        <Texto tipo="apoio" cor="cor-texto-apoio">{`${tipoDoDossie(dossie)}, ${dossie.bairro}`}</Texto>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: ESPACO[2] }}>
          <Texto tipo="titulo-tela" role="heading">
            {enderecoDoDossie(dossie)}
          </Texto>
          {dossie.endereco.ilustrativo ? <PilulaIlustrativo /> : null}
        </View>
        <ValorPrincipal dossie={dossie} fato={principal} />
        {carregando ? (
          <Bloco largura="80%" />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO[2] }}>
            <Chip fato={c.area} icone="ruler-2" rotulo={c.area?.texto ?? ""} />
            <Chip fato={c.quartos} icone="bed" rotulo={plural(c.quartos, "quarto", "quartos")} />
            <Chip fato={c.suites} icone="bed" rotulo={plural(c.suites, "suíte", "suítes")} />
            <Chip fato={c.banheiros} icone="bath" rotulo={plural(c.banheiros, "banheiro", "banheiros")} />
            <Chip fato={c.vagas} icone="car" rotulo={plural(c.vagas, "vaga", "vagas")} />
            <Chip fato={c.andar} icone="stairs" rotulo={c.andar?.texto ?? ""} />
          </View>
        )}
        {agruparPorFonte(fatos).map((grupo, i) => (
          <Rodape key={i} dossie={dossie} fatos={grupo} tracejado={i > 0} />
        ))}
        <LinkDeLinha rotulo="Não é este prédio" tipo="apoio" onPress={() => irParaConfirmarLote(dossie)} />
        <View style={{ height: 0.5, backgroundColor: cor("cor-linha") }} />
        <View style={{ gap: ESPACO[3] }}>
          <Valores>
            {c.condominio ? <LinhaDeValor dossie={dossie} fato={c.condominio} nome="Condomínio" comTraco /> : null}
            {c.iptu ? (
              <LinhaDeValor dossie={dossie} fato={c.iptu} nome="IPTU no anúncio" comTraco />
            ) : (
              <LinhaNaoSabemos nome="IPTU no anúncio" motivo="O anúncio não diz IPTU." />
            )}
          </Valores>
          <Texto tipo="apoio" cor="cor-texto-apoio">
            Sem total.
          </Texto>
          <View style={{ gap: ESPACO[3] }}>
            <Regua dossie={dossie} />
            {recebido === chaveDoFato(dossie.id, "regua") ? <Texto tipo="apoio">{TEXTO_RECEBIDO}</Texto> : null}
          </View>
          <Rodape dossie={dossie} fatos={[reguaComoFato(dossie)]} recorte={dossie.bairro} />
          {agruparPorFonte(fatosDoAnuncio).map((grupo, i) => (
            <Rodape key={i} dossie={dossie} fatos={grupo} tracejado />
          ))}
        </View>
      </CorpoDoCartao>
    </Cartao>
  );
}

function ValorPrincipal({ dossie, fato }: { dossie: Dossie; fato: Fato }) {
  const estado = useEstadoDoFato(dossie, fato);
  if (estado === "carregando") return <Bloco largura="60%" alto />;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: ESPACO[2] }}>
      <Traco rotulo={fato.rotulo} />
      <Texto tipo="numero">{fato.texto}</Texto>
      {fato.ilustrativo ? <PilulaIlustrativo /> : null}
    </View>
  );
}

export function CartaoVisita({ dossie, aoAbrirFato }: { dossie: Dossie; aoAbrirFato: (idFato: string) => void }) {
  const { cor } = useTema();
  return (
    <Cartao nota>
      <CorpoDoCartao style={{ gap: 0 }}>
        <Texto tipo="secao" role="heading" style={{ marginBottom: ESPACO[3] }}>
          Para perguntar na visita
        </Texto>
        {dossie.visita.map((item, i) => {
          const corpo = (
            <>
              {item.rotulo === "nao_sabemos" ? <Traco rotulo="nao_sabemos" /> : null}
              <View style={{ flex: 1, gap: 2 }}>
                <Texto>{item.texto}</Texto>
                {item.escala ? (
                  <Texto tipo="apoio" cor="cor-texto-apoio">
                    {item.escala}
                  </Texto>
                ) : null}
              </View>
            </>
          );
          const linha = { flexDirection: "row" as const, gap: ESPACO[3], alignItems: "center" as const, minHeight: 48, paddingVertical: ESPACO[2] };
          const origem = item.origem[0];
          return (
            <View key={item.texto} style={i > 0 ? { borderTopWidth: 0.5, borderTopColor: comAlfa(cor("cor-texto"), 0.18) } : undefined}>
              {origem ? (
                <Pressionavel role="button" onPress={() => aoAbrirFato(origem)} style={[linha, { borderRadius: RAIO.quadrado }]}>
                  {corpo}
                  <Icone nome="chevron-right" tamanho="p" />
                </Pressionavel>
              ) : (
                <View style={linha}>{corpo}</View>
              )}
            </View>
          );
        })}
      </CorpoDoCartao>
    </Cartao>
  );
}
