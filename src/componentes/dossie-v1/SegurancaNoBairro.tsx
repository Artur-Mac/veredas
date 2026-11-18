import * as WebBrowser from "expo-web-browser";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { formatarNumero } from "../../dados/formatos";
import {
  FONTE_DA_POPULACAO,
  URL_DA_FONTE_DA_SEGURANCA,
  segurancaDoBairro,
  type LinhaDeSeguranca,
  type SegurancaDoBairro,
} from "../../dados/recife/seguranca";
import { useTema } from "../../tema/Tema";
import { ESPACO } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { CaixaCreme, Corpo, LinkComSeta, Nota, Numero, NumeroEditorial, Sobretitulo, Titulo2 } from "./base";

// "Segurança no bairro" (hub, 18/11/2026). Fato com fonte: registros em 12 meses e taxa por 1.000 moradores, com a
// mediana do Recife como referência. Sem nota, ranking, "seguro" ou "perigoso"; vizinhos em ordem alfabética.

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesAno = (aaaaMm: string) => {
  const [a, m] = aaaaMm.split("-");
  return `${MESES[Number(m) - 1] ?? m}/${a}`;
};
const taxa = (t: number | null) => (t === null ? "—" : formatarNumero(t, 1));

export function frasesDaSeguranca(s: SegurancaDoBairro) {
  const periodo = `de ${mesAno(s.periodo.inicio)} a ${mesAno(s.periodo.fim)}`;
  const b = s.bairro;
  const mediana = formatarNumero(s.medianaRecife, 1);
  const posicao =
    s.posicao === "acima"
      ? `Acima da mediana dos bairros do Recife (${mediana}).`
      : s.posicao === "abaixo"
        ? `Abaixo da mediana dos bairros do Recife (${mediana}).`
        : s.posicao === "perto"
          ? `Perto da mediana dos bairros do Recife (${mediana}).`
          : null;
  return {
    periodo,
    total: b.total === null ? null : `${formatarNumero(b.total)} registros ${periodo}`,
    posicao,
    principais: b.principais.length
      ? `Mais registrados: ${b.principais.map((p) => `${p.natureza.toLowerCase()} (${formatarNumero(p.ocorrencias)})`).join(", ")}.`
      : null,
    poucosMoradores:
      b.poucosMoradores && b.moradores !== null
        ? `${b.nome} tem ${formatarNumero(b.moradores)} moradores. Muita gente passa por lá sem morar, e a taxa por morador fica exagerada.`
        : null,
  };
}

function LinhaDoVizinho({ v, primeira }: { v: LinhaDeSeguranca; primeira: boolean }) {
  const { cor } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={
        v.taxaPorMil === null
          ? `${v.nome}: sem janela de 12 meses na fonte`
          : `${v.nome}: ${taxa(v.taxaPorMil)} registros por 1.000 moradores, ${formatarNumero(v.total ?? 0)} registros`
      }
      style={{
        minHeight: 44,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 10,
        borderTopWidth: primeira ? 0 : 1,
        borderTopColor: cor("cor-linha"),
      }}
    >
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ flex: 1, fontSize: 12.5, lineHeight: 17 }}>
        {v.poucosMoradores ? `${v.nome} · poucos moradores` : v.nome}
      </Texto>
      <Numero tamanho={13.5} estilo={{ textAlign: "right" }}>
        {v.taxaPorMil === null ? "sem 12 meses" : `${taxa(v.taxaPorMil)} · ${formatarNumero(v.total ?? 0)}`}
      </Numero>
    </View>
  );
}

export function SegurancaNoBairro({ slugBairro }: { slugBairro: string | null }) {
  const dados = useMemo(() => segurancaDoBairro(slugBairro), [slugBairro]);
  const [vizinhosAbertos, setVizinhosAbertos] = useState(false);
  if (!dados) return null;
  const b = dados.bairro;
  const f = frasesDaSeguranca(dados);

  return (
    <View>
      <Sobretitulo>Ocorrências registradas</Sobretitulo>
      <Titulo2>{`Segurança em ${b.nome}`}</Titulo2>
      {b.taxaPorMil === null ? (
        <Corpo>{`A fonte não tem a janela de 12 meses para ${b.nome}: o número do bairro não é comparável com os outros.`}</Corpo>
      ) : (
        <CaixaCreme estilo={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <NumeroEditorial tamanho={34} acessivel={`${taxa(b.taxaPorMil)} registros por 1.000 moradores`}>
              {taxa(b.taxaPorMil)}
            </NumeroEditorial>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12.5, lineHeight: 17, flexShrink: 1 }}>
              registros por 1.000 moradores em 12 meses
            </Texto>
          </View>
          {f.posicao ? (
            <Texto tipo="secao" style={{ fontSize: 14.5, lineHeight: 20, fontWeight: "600" }}>
              {f.posicao}
            </Texto>
          ) : null}
          {f.total ? <Nota>{f.total}</Nota> : null}
          {f.principais ? (
            <Texto tipo="corpo" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 19 }}>
              {f.principais}
            </Texto>
          ) : null}
          {f.poucosMoradores ? <Nota>{f.poucosMoradores}</Nota> : null}
        </CaixaCreme>
      )}

      {dados.vizinhos.length ? (
        <View style={{ marginTop: ESPACO[3] }}>
          <Pressionavel
            onPress={() => setVizinhosAbertos((a) => !a)}
            accessibilityRole="button"
            accessibilityState={{ expanded: vizinhosAbertos }}
            accessibilityLabel={`${vizinhosAbertos ? "Esconder" : "Ver"} os ${dados.vizinhos.length} bairros vizinhos`}
            style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-start" }}
          >
            <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 16, fontWeight: "600" }}>
              {`${vizinhosAbertos ? "Esconder" : "Ver"} os ${dados.vizinhos.length} bairros vizinhos`}
            </Texto>
          </Pressionavel>
          {vizinhosAbertos ? (
            <View>
              <Nota estilo={{ marginBottom: 4 }}>Por 1.000 moradores · registros em 12 meses. Bairros com divisa de pelo menos 50 m.</Nota>
              {dados.vizinhos.map((v, i) => (
                <LinhaDoVizinho key={v.slug} v={v} primeira={i === 0} />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Nota estilo={{ marginTop: ESPACO[2] }}>
        Conta só o que chegou à polícia, pelo bairro informado no registro. A taxa divide pelos moradores do bairro, não por quem passa por ele.
      </Nota>
      <LinkComSeta
        rotulo={`Fonte: ${dados.atribuicao} · população: ${FONTE_DA_POPULACAO}`}
        acessivel="Abrir a fonte das ocorrências"
        discreto
        onPress={() => void WebBrowser.openBrowserAsync(URL_DA_FONTE_DA_SEGURANCA)}
      />
    </View>
  );
}
