// O prédio mais provável, dentro da confirmação do anúncio (15/11/2026): o Vereda procura pelo que o anúncio já trouxe
// (nome do edifício, rua e número, área, andar, ano). Se não for este, a pessoa abre a tela de lotes e escolhe.
import { useMemo } from "react";
import { View } from "react-native";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { bairroPorSlug, type SlugCoberto } from "../../dados/recife/bairros";
import { buscarCandidatosDetalhados } from "../../dados/recife/buscar";
import { formatarEndereco } from "../../dados/recife/endereco";
import { arquivoDoIndice, edificiosDoBairro } from "../../dados/recife/indice";
import { ESPACO } from "../../tema/tokens";
import { Botao } from "../Botao";
import { AvisoDasCamadas, useCamadas } from "../EsperaDasCamadas";
import { Texto } from "../Texto";
import { entradaDeBusca } from "./entrada";

type Props = {
  analise: AnaliseV2;
  bairro: SlugCoberto;
  trabalhando: boolean;
  aoConfirmar: (e: Edificio) => void;
  aoEscolherOutro: () => void;
};

/** "15 andares · 2018"; vazio quando o cadastro não tem. */
export function fichaCurta(e: Pick<Edificio, "pavimentos" | "anoConstrucao">): string {
  return [e.pavimentos ? `${e.pavimentos} ${e.pavimentos === 1 ? "andar" : "andares"}` : null, e.anoConstrucao ? String(e.anoConstrucao) : null].filter(Boolean).join(" · ");
}

export function PredioProvavel(props: Props) {
  const caminhos = useMemo(() => [arquivoDoIndice(props.bairro)].filter((x): x is string => !!x), [props.bairro]);
  const { estado, tentarDeNovo } = useCamadas(caminhos);
  if (estado !== "pronta") {
    return <AvisoDasCamadas estado={estado} tentarDeNovo={tentarDeNovo} carregando={`Procurando o prédio no cadastro de ${bairroPorSlug(props.bairro)?.nome ?? "do bairro"}…`} oQue="o cadastro deste bairro" />;
  }
  return <Provavel {...props} />;
}

function Provavel({ analise, bairro, trabalhando, aoConfirmar, aoEscolherOutro }: Props) {
  const edificios = useMemo(() => {
    try { return edificiosDoBairro(bairro); } catch { return [] as Edificio[]; }
  }, [bairro]);
  const r = useMemo(() => buscarCandidatosDetalhados(entradaDeBusca(analise, bairro), edificios), [analise, bairro, edificios]);
  const topo = r.candidatos[0];
  const e = topo ? edificios.find((x) => x.id === topo.edificioId) ?? null : null;
  const outros = r.totalCompativeis - 1;
  // Só área e ano (sem nome, rua ou número): sugestão fraca, dita como tal.
  const fraco = topo ? !topo.pistas.some((p) => p === "nome" || p === "rua" || p === "numero") : true;

  if (!topo || !e) {
    return (
      <View style={{ gap: ESPACO[3] }} role="group" aria-label="Prédio do anúncio">
        <Texto tipo="secao">Qual é o prédio?</Texto>
        <Texto tipo="apoio">O anúncio não trouxe pistas suficientes (nome do edifício, rua e número ou área). Procure pela rua, pelo nome ou no mapa de lotes.</Texto>
        <Botao rotulo="Encontrar o prédio" variante="principal" desativado={trabalhando} onPress={aoEscolherOutro} />
      </View>
    );
  }
  return (
    <View style={{ gap: ESPACO[3] }} role="group" aria-label="Prédio provável do anúncio">
      <Texto tipo="apoio" cor="cor-barro-texto" style={{ letterSpacing: 1, fontWeight: "600" }}>{fraco ? "PODE SER ESTE PRÉDIO" : "PRÉDIO PROVÁVEL"}</Texto>
      <View style={{ gap: 2 }}>
        <Texto tipo="secao">{e.nome ?? "Prédio sem nome no cadastro"}</Texto>
        <Texto tipo="apoio">{[formatarEndereco(e.logradouro, e.numero), fichaCurta(e)].filter(Boolean).join(" · ")}</Texto>
      </View>
      <View style={{ gap: 2 }}>
        {topo.motivos.slice(0, 3).map((m) => <Texto key={m} tipo="apoio" cor="cor-texto-apoio">• {m}</Texto>)}
      </View>
      <Botao rotulo="É este · gerar o dossiê" variante="principal" desativado={trabalhando} onPress={() => aoConfirmar(e)} />
      <Botao rotulo={outros > 0 ? `Não é este · ver ${outros} ${outros === 1 ? "outro" : "outros"} e o mapa` : "Não é este · escolher no mapa"} variante="secundario" desativado={trabalhando} onPress={aoEscolherOutro} />
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12 }}>Gerar o dossiê usa 1 crédito.</Texto>
    </View>
  );
}
