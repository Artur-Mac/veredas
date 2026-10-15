import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { View } from "react-native";
import type { Dossie, Fato, Secao } from "../../dados/esquema";
import { formatarDiaMes, hojeIso } from "../../dados/formatos";
import { TEXTO_RECEBIDO } from "../../dados/textos";
import { chaveDoFato, useAparelho } from "../../estado/Aparelho";
import { useEstadoDoFato } from "../../estado/fatos";
import { useSessao } from "../../estado/Sessao";
import { ESPACO } from "../../tema/tokens";
import { Divisor } from "../Cartao";
import { Etiqueta, PilulaIlustrativo } from "../Etiquetas";
import { Texto } from "../Texto";
import { Bloco, NaoSabemos, Traco } from "../Traco";

const NOMES_DE_FATO: Record<string, string> = {
  ano: "Ano",
  pavimentos: "Pavimentos",
  area_lote: "Área do lote",
  iptu_cobrado: "IPTU por unidade",
  padrao: "Padrão",
  transmissoes_2017: "2017",
  custo_transporte: "Transporte",
  custo_cesta: "Cesta DIEESE",
  altura: "Altura",
  renda_mediana: "Mediana do rendimento do responsável",
};

function textoDoFato(fato: Fato, secao: Secao | null): string {
  const numeroSolto = /^[\d.]+$/.test(fato.texto);
  if (!numeroSolto || NOMES_DE_FATO[fato.id]) return fato.texto;
  if (fato.unidade) return `${fato.texto} ${fato.unidade}`;
  return secao ? secao.resumo : fato.texto;
}

export function Valores({ children }: { children: ReactNode }) {
  const itens = Children.toArray(children).filter(isValidElement);
  return (
    <View>
      {itens.map((item, i) => (
        <Fragment key={item.key ?? i}>
          {i > 0 ? <Divisor /> : null}
          {item}
        </Fragment>
      ))}
    </View>
  );
}

function PilulaDeEstado({ dossie, fato, estado }: { dossie: Dossie; fato: Fato; estado: string }) {
  const { dados } = useAparelho();
  if (estado === "contestado") {
    const registro = dados.contestacoes[chaveDoFato(dossie.id, fato.id)];
    return <Etiqueta texto={`Você contestou em ${formatarDiaMes(registro ? registro.data : hojeIso())}`} forte />;
  }
  if (estado === "em_verificacao") return <Etiqueta texto="Em verificação" pontilhada />;
  return null;
}

type PropsDaLinha = {
  dossie: Dossie;
  fato: Fato;
  secao?: Secao | null;
  comTraco?: boolean;
  nome?: string | null;
};

export function LinhaDeValor({ dossie, fato, secao = null, comTraco = false, nome }: PropsDaLinha) {
  const estado = useEstadoDoFato(dossie, fato);
  const { recebido } = useSessao();
  const rotuloNome = nome === undefined ? NOMES_DE_FATO[fato.id] : nome;
  const inteira = !rotuloNome;
  const alinhamento = inteira ? "flex-start" : "flex-end";

  let dado: ReactNode;
  if (estado === "carregando") {
    dado = <Bloco largura={120} />;
  } else if (estado === "nao_sabemos") {
    dado = (
      <View style={{ alignItems: alinhamento, gap: 2 }}>
        <NaoSabemos />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ textAlign: inteira ? "left" : "right" }}>
          {fato.motivo_nao_sabemos}
        </Texto>
      </View>
    );
  } else {
    const temExtra = fato.ilustrativo || estado === "contestado" || estado === "em_verificacao";
    dado = (
      <View style={{ alignItems: alinhamento, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
          {comTraco ? <Traco rotulo={fato.rotulo} /> : null}
          <Texto style={{ textAlign: inteira ? "left" : "right", flexShrink: 1 }}>{textoDoFato(fato, secao)}</Texto>
        </View>
        {temExtra ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO[2], marginTop: ESPACO[1] }}>
            {fato.ilustrativo ? <PilulaIlustrativo /> : null}
            <PilulaDeEstado dossie={dossie} fato={fato} estado={estado} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: ESPACO[3], paddingVertical: 10 }}>
        {inteira ? null : (
          <Texto cor="cor-texto-apoio" style={{ flex: 1 }}>
            {rotuloNome}
          </Texto>
        )}
        <View style={inteira ? { flex: 1 } : { maxWidth: "70%" }}>{dado}</View>
      </View>
      {recebido === chaveDoFato(dossie.id, fato.id) ? <Texto tipo="apoio">{TEXTO_RECEBIDO}</Texto> : null}
    </View>
  );
}

export function LinhaNaoSabemos({ nome, motivo }: { nome: string; motivo: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: ESPACO[3], paddingVertical: 10 }}>
      <Texto cor="cor-texto-apoio" style={{ flex: 1 }}>
        {nome}
      </Texto>
      <View style={{ maxWidth: "70%", alignItems: "flex-end", gap: 2 }}>
        <NaoSabemos />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ textAlign: "right" }}>
          {motivo}
        </Texto>
      </View>
    </View>
  );
}
