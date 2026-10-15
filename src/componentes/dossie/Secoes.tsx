import { router } from "expo-router";
import { View } from "react-native";
import { SECOES_COM_RECORTE_DE_BAIRRO, fato as fatoDe, secao as secaoDe } from "../../dados/consultas";
import type { Anel as DadosDoAnel, Dossie, Fato, Secao } from "../../dados/esquema";
import { formatarDistancia } from "../../dados/formatos";
import { distanciaMetros } from "../../dados/geo";
import { useAparelho } from "../../estado/Aparelho";
import { useCarregando, useEstadoDoFato } from "../../estado/fatos";
import { useSessao } from "../../estado/Sessao";
import { useTema } from "../../tema/Tema";
import { ESPACO, type TokenDeCor } from "../../tema/tokens";
import { Botao, LinkDeLinha } from "../Botao";
import { Anel, BarrasVizinhos } from "../fatos/Graficos";
import { RodapesPorFonte } from "../fatos/Rodape";
import { SecaoDeFato, SecaoLink } from "../fatos/Secao";
import { LinhaDeValor, Valores } from "../fatos/Valores";
import type { Camada } from "../mapa/Mapa";
import { Texto } from "../Texto";
import { Bloco, QuadradoDeCor } from "../Traco";

function irParaCamada(dossie: Dossie, camada: Camada) {
  router.navigate({ pathname: "/dossie/[id]/mapa", params: { id: dossie.id, camada } });
}

function ConteudoDeValores({ dossie, secao }: { dossie: Dossie; secao: Secao }) {
  const mistura = new Set(secao.fatos.map((f) => f.rotulo)).size > 1;
  const recorte = SECOES_COM_RECORTE_DE_BAIRRO.has(secao.id) ? dossie.bairro : null;
  return (
    <>
      <Valores>
        {secao.fatos.map((f) => (
          <LinhaDeValor key={f.id} dossie={dossie} fato={f} secao={secao} comTraco={mistura} />
        ))}
      </Valores>
      <RodapesPorFonte dossie={dossie} fatos={secao.fatos} recorte={recorte} />
    </>
  );
}

function EstadoDoTotal({ dossie, secao, fato }: { dossie: Dossie; secao: Secao; fato: Fato }) {
  const estado = useEstadoDoFato(dossie, fato);
  if (estado !== "contestado" && estado !== "em_verificacao") return null;
  return <LinhaDeValor dossie={dossie} fato={fato} secao={secao} />;
}

function ConteudoDefesaCivil({ dossie, secao, grafico }: { dossie: Dossie; secao: Secao; grafico: DadosDoAnel }) {
  const carregando = useCarregando();
  const primeiro = secao.fatos[0];
  const extras = secao.fatos.filter((f) => f.valor !== grafico.total);
  return (
    <>
      {grafico.total === 0 && !carregando ? <Texto>Nenhum atendimento em 2024</Texto> : <Anel grafico={grafico} />}
      {extras.length ? (
        <Valores>
          {extras.map((f) => (
            <LinhaDeValor key={f.id} dossie={dossie} fato={f} secao={secao} />
          ))}
        </Valores>
      ) : null}
      {primeiro ? <EstadoDoTotal dossie={dossie} secao={secao} fato={primeiro} /> : null}
      <RodapesPorFonte dossie={dossie} fatos={secao.fatos} recorte={dossie.bairro} />
    </>
  );
}

function ConteudoBairro({ dossie, secao }: { dossie: Dossie; secao: Secao }) {
  const { natureza, mudar } = useSessao();
  const aberto = natureza.includes(dossie.id);
  const grafico = secao.grafico;
  if (!grafico || grafico.tipo !== "barras_vizinhos") throw new Error(`Seção bairro de ${dossie.id} sem barras_vizinhos`);
  return (
    <>
      <Valores>
        {secao.fatos.map((f) => (
          <LinhaDeValor key={f.id} dossie={dossie} fato={f} secao={secao} />
        ))}
      </Valores>
      <View style={{ gap: ESPACO[3] }}>
        <Texto tipo="apoio" cor="cor-texto-apoio">
          Por mil moradores, com os bairros que fazem divisa. Moradores: Censo 2022.
        </Texto>
        <BarrasVizinhos grafico={grafico} />
        <Texto tipo="apoio" cor="cor-texto-apoio">
          Ordem do mapa, de norte a sul.
        </Texto>
      </View>
      <Botao
        rotulo="Ver por natureza"
        icone="chart-donut"
        expandido={aberto}
        onPress={() =>
          mudar((atual) => ({
            natureza: atual.natureza.includes(dossie.id) ? atual.natureza.filter((x) => x !== dossie.id) : [...atual.natureza, dossie.id],
          }))
        }
      />
      {aberto ? <Anel grafico={grafico.detalhe} /> : null}
      <RodapesPorFonte dossie={dossie} fatos={secao.fatos} recorte={dossie.bairro} />
    </>
  );
}

type ParteDoCusto = { nome: string; cor: TokenDeCor; fato: Fato; mensal: boolean };

function partesDoCusto(dossie: Dossie): ParteDoCusto[] {
  const candidatas: (Omit<ParteDoCusto, "fato"> & { fato: Fato | null | undefined })[] = [
    { nome: "Condomínio", cor: "cat-ipe-roxo", fato: dossie.anuncio.campos.condominio, mensal: true },
    { nome: "IPTU cobrado", cor: "cat-goiaba", fato: fatoDe(dossie, "predio", "iptu_cobrado"), mensal: false },
    { nome: "Transporte", cor: "cat-ipe-amarelo", fato: fatoDe(dossie, "custo", "custo_transporte"), mensal: true },
    { nome: "Cesta DIEESE", cor: "cat-mare", fato: fatoDe(dossie, "custo", "custo_cesta"), mensal: true },
  ];
  return candidatas.filter((p): p is ParteDoCusto => Boolean(p.fato));
}

function ConteudoCusto({ dossie }: { dossie: Dossie }) {
  const { cor } = useTema();
  const carregando = useCarregando();
  const partes = partesDoCusto(dossie);
  const naBarra = partes.filter((p) => p.mensal && p.fato.estado !== "nao_sabemos" && typeof p.fato.valor === "number");
  return (
    <>
      {carregando ? (
        <Bloco />
      ) : (
        <View aria-hidden style={{ flexDirection: "row", height: 16, borderRadius: 4, overflow: "hidden", gap: 2 }}>
          {naBarra.map((p) => (
            <View key={p.nome} style={{ flex: typeof p.fato.valor === "number" ? p.fato.valor : 0, backgroundColor: cor(p.cor) }} />
          ))}
        </View>
      )}
      <Texto tipo="apoio" cor="cor-texto-apoio">
        Sem total.
      </Texto>
      <Valores>
        {partes.map((p) => (
          <View key={p.nome} style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
            <QuadradoDeCor corLivre={cor(p.cor)} />
            <View style={{ flex: 1 }}>
              <LinhaDeValor dossie={dossie} fato={p.fato} nome={p.nome} comTraco />
            </View>
          </View>
        ))}
      </Valores>
      <RodapesPorFonte dossie={dossie} fatos={partes.map((p) => p.fato)} />
      <Botao
        rotulo="Informar meu domicílio"
        onPress={() => router.push({ pathname: "/dossie/[id]/domicilio", params: { id: dossie.id } })}
      />
    </>
  );
}

function useResumoDosCaminhos(dossie: Dossie): string {
  const { dados } = useAparelho();
  const primeiro = dados.destinos[0];
  if (!primeiro) return "Adicionar destino";
  return `${primeiro.nome}; ${formatarDistancia(distanciaMetros(dossie.lote.centro, primeiro.coordenada))} em linha reta a partir do prédio`;
}

const ORDEM = ["predio", "transmissoes", "obras", "defesa_civil", "caminhos", "linha_do_tempo", "sol", "calor", "alagamento", "renda", "tipologia", "bairro", "custo"];

function UmaSecao({ dossie, id }: { dossie: Dossie; id: string }) {
  const resumoDosCaminhos = useResumoDosCaminhos(dossie);
  if (id === "caminhos") {
    return (
      <SecaoLink
        titulo="Seus caminhos"
        fase="prototipo"
        icone="route"
        resumo={resumoDosCaminhos}
        onPress={() => router.push({ pathname: "/dossie/[id]/caminhos", params: { id: dossie.id } })}
      />
    );
  }
  const secao = secaoDe(dossie, id);
  if (!secao) return null;
  const base = { titulo: secao.titulo, fase: secao.fase, icone: secao.icone, resumo: secao.resumo, ilustrativo: secao.ilustrativo };
  if (id === "linha_do_tempo") {
    return (
      <SecaoLink {...base} onPress={() => router.push({ pathname: "/dossie/[id]/linha-do-tempo", params: { id: dossie.id } })} />
    );
  }
  if (id === "defesa_civil") {
    const grafico = secao.grafico;
    if (!grafico || grafico.tipo !== "anel") throw new Error(`Defesa Civil de ${dossie.id} sem anel`);
    return (
      <SecaoDeFato dossie={dossie} id={id} {...base} pequeno={grafico}>
        <ConteudoDefesaCivil dossie={dossie} secao={secao} grafico={grafico} />
      </SecaoDeFato>
    );
  }
  return (
    <SecaoDeFato dossie={dossie} id={id} {...base}>
      {id === "bairro" ? <ConteudoBairro dossie={dossie} secao={secao} /> : null}
      {id === "custo" ? <ConteudoCusto dossie={dossie} /> : null}
      {id !== "bairro" && id !== "custo" ? <ConteudoDeValores dossie={dossie} secao={secao} /> : null}
      {id === "predio" ? (
        <LinkDeLinha
          rotulo="Não é este prédio"
          tipo="apoio"
          onPress={() => router.push({ pathname: "/dossie/[id]/confirmar-lote", params: { id: dossie.id } })}
        />
      ) : null}
      {id === "sol" ? <Botao rotulo="Ver em 3D" icone="map" onPress={() => irParaCamada(dossie, "3d")} /> : null}
      {id === "calor" ? <Botao rotulo="Abrir mapa" icone="map" onPress={() => irParaCamada(dossie, "calor")} /> : null}
      {id === "alagamento" ? <Botao rotulo="Abrir mapa" icone="map" onPress={() => irParaCamada(dossie, "alagamento")} /> : null}
    </SecaoDeFato>
  );
}

export function SecoesDoDossie({ dossie, aoMedir }: { dossie: Dossie; aoMedir: (id: string, y: number) => void }) {
  return (
    <>
      {ORDEM.map((id) => (
        <View key={id} onLayout={(e) => aoMedir(id, e.nativeEvent.layout.y)}>
          <UmaSecao dossie={dossie} id={id} />
        </View>
      ))}
    </>
  );
}
