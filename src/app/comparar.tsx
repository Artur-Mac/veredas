import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { EtiquetaFase, FaseVisivel, PilulaIlustrativo } from "../componentes/Etiquetas";
import { PoligonoMini } from "../componentes/mapa/PoligonoMini";
import { Pressionavel } from "../componentes/Pressionavel";
import { Cabecalho, Rolagem, Tela, TituloDeGrupo } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { NaoSabemos } from "../componentes/Traco";
import { enderecoDoDossie, fato as fatoDe, tipoDoDossie } from "../dados/consultas";
import { dossieOuNulo } from "../dados/dossies";
import type { Dossie, Fato } from "../dados/esquema";
import { formatarNumero, formatarReais } from "../dados/formatos";
import { useLoteConfirmado } from "../estado/fatos";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO } from "../tema/tokens";

type LinhaDeComparacao = {
  nome: string;
  fato: (d: Dossie) => Fato | null | undefined;
  unidade?: (d: Dossie, x: number) => string;
  mesmoTipo?: boolean;
  fase?: "final";
};

const LINHAS: LinhaDeComparacao[] = [
  {
    nome: "Preço",
    fato: (d) => d.anuncio.campos.aluguel ?? d.anuncio.campos.preco,
    unidade: (d, x) => `${formatarReais(x)} a mais${d.tipo === "aluguel" ? " por mês" : ""}`,
    mesmoTipo: true,
  },
  { nome: "Área", fato: (d) => d.anuncio.campos.area, unidade: (_, x) => `${formatarNumero(x)} m² a mais` },
  { nome: "Andar", fato: (d) => d.anuncio.campos.andar },
  { nome: "Ano", fato: (d) => fatoDe(d, "predio", "ano") },
  { nome: "Pavimentos", fato: (d) => fatoDe(d, "predio", "pavimentos"), unidade: (_, x) => `${formatarNumero(x)} pavimentos a mais` },
  {
    nome: "Transmissões no prédio",
    fato: (d) => fatoDe(d, "transmissoes", "transmissoes_total"),
    unidade: (_, x) => `${formatarNumero(x)} avaliações fiscais a mais`,
  },
  { nome: "Obras próximas", fato: (d) => fatoDe(d, "obras", "obras_total"), unidade: (_, x) => `${formatarNumero(x)} processos a mais` },
  {
    nome: "Defesa Civil no bairro",
    fato: (d) => fatoDe(d, "defesa_civil", "dc_total"),
    unidade: (_, x) => `${formatarNumero(x)} atendimentos a mais`,
  },
  {
    nome: "O bairro",
    fato: (d) => fatoDe(d, "bairro", "crime_total"),
    unidade: (_, x) => `${formatarNumero(x)} ocorrências a mais`,
    fase: "final",
  },
];

function valorNumerico(fato: Fato | null | undefined): number | null {
  return fato && typeof fato.valor === "number" && fato.estado !== "nao_sabemos" ? fato.valor : null;
}

function diferenca(linha: LinhaDeComparacao, dossies: Dossie[]): string | null {
  const [da, db] = dossies;
  if (dossies.length !== 2 || !linha.unidade || !da || !db) return null;
  const a = valorNumerico(linha.fato(da));
  const b = valorNumerico(linha.fato(db));
  if (a === null || b === null || a === b) return null;
  if (linha.mesmoTipo && da.tipo !== db.tipo) return null;
  const maior = a > b ? da : db;
  return `${maior.bairro} tem ${linha.unidade(maior, Math.abs(a - b))}.`;
}

function Coluna({ dossie }: { dossie: Dossie }) {
  const { cor } = useTema();
  const confirmado = useLoteConfirmado(dossie);
  return (
    <Pressionavel
      role="link"
      onPress={() => router.push({ pathname: "/dossie/[id]", params: { id: dossie.id } })}
      style={{ flex: 1, gap: ESPACO[1], padding: ESPACO[3], backgroundColor: cor("cor-superficie"), borderRadius: RAIO.cartao }}
    >
      <PoligonoMini dossie={dossie} confirmado={confirmado} />
      <Texto tipo="secao">{dossie.bairro}</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio">
        {enderecoDoDossie(dossie)}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio">
        {tipoDoDossie(dossie)}
      </Texto>
    </Pressionavel>
  );
}

export default function Comparar() {
  const { cor } = useTema();
  const { ids = "" } = useLocalSearchParams<{ ids?: string }>();
  const dossies = ids
    .split(",")
    .map((id) => dossieOuNulo(id))
    .filter((d): d is Dossie => d !== null)
    .slice(0, 3);

  return (
    <Tela>
      <Cabecalho titulo="Comparar" pai="/" />
      <Rolagem>
        <View style={{ paddingHorizontal: ESPACO[3] }}>
          <View style={{ flexDirection: "row", gap: ESPACO[2] }}>
            {dossies.map((d) => (
              <Coluna key={d.id} dossie={d} />
            ))}
          </View>
          <View style={{ marginTop: ESPACO[3] }}>
            {LINHAS.map((linha) => {
              const fatos = dossies.map((d) => linha.fato(d));
              if (fatos.every((f) => !f)) return null;
              const texto = diferenca(linha, dossies);
              return (
                <FaseVisivel key={linha.nome} fase={linha.fase ?? "prototipo"}>
                  <View style={{ paddingVertical: ESPACO[3], borderBottomWidth: 0.5, borderBottomColor: cor("cor-linha") }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
                      <Texto tipo="apoio" cor="cor-texto-apoio">
                        {linha.nome}
                      </Texto>
                      {linha.fase ? <EtiquetaFase fase={linha.fase} /> : null}
                    </View>
                    <View style={{ flexDirection: "row", gap: ESPACO[2], marginTop: ESPACO[1] }}>
                      {fatos.map((f, i) => (
                        <View key={i} style={{ flex: 1, gap: ESPACO[1], alignItems: "flex-start" }}>
                          {!f || f.estado === "nao_sabemos" ? <NaoSabemos /> : <Texto>{f.texto}</Texto>}
                          {f?.ilustrativo ? <PilulaIlustrativo /> : null}
                        </View>
                      ))}
                    </View>
                    {texto ? (
                      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ marginTop: ESPACO[1] }}>
                        {texto}
                      </Texto>
                    ) : null}
                  </View>
                </FaseVisivel>
              );
            })}
          </View>
        </View>
        <TituloDeGrupo>Anúncios que você abriu</TituloDeGrupo>
        <Texto cor="cor-texto-apoio" style={{ paddingHorizontal: ESPACO[4] }}>
          Abra outros anúncios pelo Vereda para vê-los aqui.
        </Texto>
      </Rolagem>
    </Tela>
  );
}
