import { useState } from "react";
import { View } from "react-native";
import type { Dossie, Regua as DadosDaRegua } from "../../dados/esquema";
import { formatarNumero, formatarReais } from "../../dados/formatos";
import { TEXTO_ILUSTRATIVO } from "../../dados/textos";
import { useCarregando } from "../../estado/fatos";
import { useSessao, type EscolhaDaRegua } from "../../estado/Sessao";
import { useTema } from "../../tema/Tema";
import { ESPACO, REGUA } from "../../tema/tokens";
import { Segmentado } from "../Controles";
import { PilulaIlustrativo } from "../Etiquetas";
import { Texto } from "../Texto";
import { Bloco, NaoSabemos, Traco } from "../Traco";

const RECORTES = [
  { valor: "bairro", nome: "Bairro" },
  { valor: "raio_500", nome: "500 m" },
  { valor: "raio_1000", nome: "1 km" },
] as const;

const PERIODOS = [
  { valor: 12, nome: "12 meses" },
  { valor: 24, nome: "24 meses" },
] as const;

const LARGURA_DO_ROTULO = 72;
const LARGURA_DO_VALOR = 128;

function Desenho({ dados, semArea }: { dados: DadosDaRegua; semArea: boolean }) {
  const { cor } = useTema();
  const [largura, setLargura] = useState(0);
  const x = (valor: number) => ((valor - dados.minimo) / (dados.maximo - dados.minimo)) * largura;

  const caixaCentrada = (px: number, caixa: number, borda: number) => {
    const p = largura ? px / largura : 0;
    if (p < borda) return { left: px, alinhamento: "left" as const };
    if (p > 1 - borda) return { left: px - caixa, alinhamento: "right" as const };
    return { left: px - caixa / 2, alinhamento: "center" as const };
  };

  const sufixo = dados.unidade.replace("R$", "").trim().replace(/^\//, "");
  const anuncio = caixaCentrada(x(dados.valor_anuncio), LARGURA_DO_VALOR, 0.15);

  return (
    <View
      role="img"
      accessibilityLabel={dados.frase}
      onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      style={{ height: 68, marginVertical: ESPACO[2] }}
    >
      {largura > 0 ? (
        <>
          <View style={{ position: "absolute", top: 28, left: 0, right: 0, height: REGUA.trilho, borderRadius: 3, backgroundColor: cor("cor-linha") }} />
          <View
            style={{
              position: "absolute",
              top: 28,
              left: x(dados.p25),
              width: x(dados.p75) - x(dados.p25),
              height: REGUA.trilho,
              backgroundColor: cor("cor-faixa-regua"),
            }}
          />
          <View style={{ position: "absolute", top: 24, left: x(dados.mediana) - 1, width: 2, height: 14, backgroundColor: cor("cor-texto") }} />
          {semArea ? null : (
            <>
              <Texto
                tipo="secao"
                numberOfLines={1}
                style={{ position: "absolute", top: 0, left: anuncio.left, width: LARGURA_DO_VALOR, textAlign: anuncio.alinhamento }}
              >
                {`${formatarReais(dados.valor_anuncio)}/${sufixo}`}
              </Texto>
              <View
                style={{
                  position: "absolute",
                  top: 22,
                  left: x(dados.valor_anuncio) - REGUA.marcador / 2 - 2,
                  width: REGUA.marcador + 4,
                  height: REGUA.marcador + 4,
                  borderRadius: (REGUA.marcador + 4) / 2,
                  borderWidth: 2,
                  borderColor: cor("cor-superficie"),
                  backgroundColor: cor("cor-barro"),
                }}
              />
            </>
          )}
          {[dados.p25, dados.mediana, dados.p75].map((valor) => {
            const caixa = caixaCentrada(x(valor), LARGURA_DO_ROTULO, 0.08);
            return (
              <Texto
                key={valor}
                tipo="apoio"
                cor="cor-texto-apoio"
                style={{ position: "absolute", top: 48, left: caixa.left, width: LARGURA_DO_ROTULO, textAlign: caixa.alinhamento }}
              >
                {formatarNumero(valor)}
              </Texto>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

export function Regua({ dossie }: { dossie: Dossie }) {
  const dados = dossie.preco.regua;
  const sessao = useSessao();
  const carregando = useCarregando();
  const escolha: EscolhaDaRegua = sessao.regua[dossie.id] ?? { recorte: dados.recorte, periodo: dados.periodo_meses };
  const escolher = (mudanca: Partial<EscolhaDaRegua>) =>
    sessao.mudar((atual) => ({ regua: { ...atual.regua, [dossie.id]: { ...escolha, ...mudanca } } }));

  const controles = (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO[2] }}>
      <Segmentado rotulo="Recorte" opcoes={RECORTES} valor={escolha.recorte} aoMudar={(recorte) => escolher({ recorte })} />
      <Segmentado rotulo="Período" opcoes={PERIODOS} valor={escolha.periodo} aoMudar={(periodo) => escolher({ periodo })} />
    </View>
  );

  let corpo;
  if (carregando) {
    corpo = (
      <>
        <Bloco alto />
        {dados.fonte.base === TEXTO_ILUSTRATIVO ? null : (
          <Texto tipo="apoio" cor="cor-texto-apoio">{`Lendo o ${dados.fonte.base}`}</Texto>
        )}
      </>
    );
  } else if (escolha.recorte !== dados.recorte || escolha.periodo !== dados.periodo_meses) {
    corpo = <NaoSabemos />;
  } else if (dados.n < 10) {
    corpo = <Texto>{`Poucos registros no recorte: N = ${formatarNumero(dados.n)}. Aumente o raio ou o período.`}</Texto>;
  } else {
    const area = dossie.anuncio.campos.area;
    const semArea = !area || area.estado === "nao_sabemos";
    corpo = (
      <>
        <Desenho dados={dados} semArea={semArea} />
        {semArea ? (
          <NaoSabemos />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: ESPACO[2] }}>
            <Traco rotulo={dados.rotulo} />
            <Texto style={{ flexShrink: 1 }}>{dados.frase}</Texto>
            {dados.ilustrativo ? <PilulaIlustrativo /> : null}
          </View>
        )}
      </>
    );
  }

  return (
    <View style={{ gap: ESPACO[2] }}>
      {controles}
      {corpo}
    </View>
  );
}
