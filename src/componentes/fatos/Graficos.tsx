import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { Anel as DadosDoAnel, BarrasVizinhos as DadosDasBarras } from "../../dados/esquema";
import { formatarNumero } from "../../dados/formatos";
import { useCarregando } from "../../estado/fatos";
import { useTema } from "../../tema/Tema";
import { ESPACO } from "../../tema/tokens";
import { Divisor } from "../Cartao";
import { Texto } from "../Texto";
import { Bloco, NaoSabemos, QuadradoDeCor } from "../Traco";

const RAIO_DO_ANEL = 40;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO_DO_ANEL;

type PropsDosArcos = { grafico: Pick<DadosDoAnel, "fatias">; pequeno: boolean; carregando: boolean };

function Arcos({ grafico, pequeno, carregando }: PropsDosArcos) {
  const { cor } = useTema();
  const espessura = pequeno ? 18 : 14;
  const total = grafico.fatias.reduce((soma, f) => soma + f.valor, 0);
  if (carregando || total === 0) {
    return <Circle cx={50} cy={50} r={RAIO_DO_ANEL} fill="none" stroke={cor("cor-linha")} strokeWidth={espessura} />;
  }
  const folga = grafico.fatias.length > 1 ? (pequeno ? 3 : 1.6) : 0;
  const comprimentos = grafico.fatias.map((f) => (f.valor / total) * CIRCUNFERENCIA);
  const inicios = comprimentos.map((_, i) => comprimentos.slice(0, i).reduce((soma, c) => soma + c, 0));
  return (
    <>
      {grafico.fatias.map((fatia, i) => {
        const comprimento = comprimentos[i] ?? 0;
        const visivel = Math.max(comprimento - folga, 0.6);
        const inicio = inicios[i] ?? 0;
        return (
          <Circle
            key={fatia.nome}
            cx={50}
            cy={50}
            r={RAIO_DO_ANEL}
            fill="none"
            stroke={cor(fatia.cor)}
            strokeWidth={espessura}
            strokeDasharray={`${visivel.toFixed(2)} ${(CIRCUNFERENCIA - visivel).toFixed(2)}`}
            strokeDashoffset={-inicio}
            transform="rotate(-90 50 50)"
          />
        );
      })}
    </>
  );
}

export function AnelPequeno({ grafico }: { grafico: Pick<DadosDoAnel, "fatias"> }) {
  const carregando = useCarregando();
  return (
    <Svg width={30} height={30} viewBox="0 0 100 100" aria-hidden>
      <Arcos grafico={grafico} pequeno carregando={carregando} />
    </Svg>
  );
}

export function Anel({ grafico }: { grafico: DadosDoAnel }) {
  const { cor } = useTema();
  const carregando = useCarregando();
  return (
    <View style={{ gap: ESPACO[3] }}>
      <View style={{ width: 168, height: 168, alignSelf: "center" }}>
        <Svg width={168} height={168} viewBox="0 0 100 100" aria-hidden>
          <Arcos grafico={grafico} pequeno={false} carregando={carregando} />
        </Svg>
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
          accessible
          accessibilityLabel={carregando ? undefined : `${formatarNumero(grafico.total)} ${grafico.rotulo_centro}`}
        >
          {carregando ? (
            <Bloco largura={56} alto />
          ) : (
            <>
              <Texto tipo="numero">{formatarNumero(grafico.total)}</Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio">
                {grafico.rotulo_centro}
              </Texto>
            </>
          )}
        </View>
      </View>
      {carregando ? null : (
        <View>
          {grafico.fatias.map((f, i) => (
            <View key={f.nome}>
              {i > 0 ? <Divisor /> : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3], paddingVertical: 6 }}>
                <QuadradoDeCor corLivre={cor(f.cor)} />
                <Texto style={{ flex: 1 }}>{f.nome}</Texto>
                <Texto>{formatarNumero(f.valor)}</Texto>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function BarrasVizinhos({ grafico }: { grafico: DadosDasBarras }) {
  const { cor } = useTema();
  const carregando = useCarregando();
  if (carregando) {
    return (
      <View style={{ gap: ESPACO[2] }}>
        {grafico.itens.map((item) => (
          <Bloco key={item.bairro} />
        ))}
      </View>
    );
  }
  const maximo = Math.max(...grafico.itens.map((i) => i.por_mil ?? 0));
  return (
    <View>
      {grafico.itens.map((item) => {
        const peso = item.do_dossie ? "secao" : "corpo";
        if (item.estado === "nao_sabemos" || item.por_mil === null) {
          return (
            <View key={item.bairro} style={{ gap: 4, paddingVertical: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: ESPACO[2] }}>
                <Texto tipo={peso}>{item.bairro}</Texto>
                <NaoSabemos />
              </View>
              <Texto tipo="apoio" cor="cor-texto-apoio">
                {item.motivo_nao_sabemos}
              </Texto>
            </View>
          );
        }
        const largura = maximo > 0 ? (item.por_mil / maximo) * 100 : 0;
        return (
          <View key={item.bairro} style={{ gap: 4, paddingVertical: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: ESPACO[2] }}>
              <Texto tipo={peso}>{item.bairro}</Texto>
              <Texto tipo={peso}>{`${formatarNumero(item.por_mil, 1)} (${formatarNumero(item.ocorrencias)})`}</Texto>
            </View>
            <View aria-hidden style={{ height: 10 }}>
              <View
                style={{
                  height: 10,
                  width: `${largura}%`,
                  borderTopRightRadius: 4,
                  borderBottomRightRadius: 4,
                  backgroundColor: cor(item.do_dossie ? "crime-1" : "crime-3"),
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
