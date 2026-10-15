import { Redirect, router } from "expo-router";
import { View } from "react-native";
import { AbasForaDoDossie } from "../../../componentes/Abas";
import { Cartao, Divisor } from "../../../componentes/Cartao";
import { PilulaIlustrativo } from "../../../componentes/Etiquetas";
import { Pressionavel } from "../../../componentes/Pressionavel";
import { Cabecalho, Rolagem, Tela } from "../../../componentes/Tela";
import { Texto } from "../../../componentes/Texto";
import { Traco } from "../../../componentes/Traco";
import { fato as fatoDe, linhaDaFonte, secao as secaoDe } from "../../../dados/consultas";
import type { Dossie, Fato } from "../../../dados/esquema";
import { useMostrarFinal } from "../../../estado/fatos";
import { useDossie } from "../../../navegacao/useDossie";
import { ESPACO } from "../../../tema/tokens";

type Evento = { ano: string; ordem: number; texto: string; fato: Fato };

function eventosDoPredio(dossie: Dossie): Evento[] {
  const eventos: Evento[] = [];
  const ano = fatoDe(dossie, "predio", "ano");
  if (ano) {
    const texto = fatoDe(dossie, "linha_do_tempo", "lt_construcao")?.texto ?? secaoDe(dossie, "predio")?.resumo ?? ano.texto;
    eventos.push({ ano: ano.texto, ordem: Number(ano.valor), texto, fato: ano });
  }
  const transmissoes = fatoDe(dossie, "transmissoes", "transmissoes_total");
  if (transmissoes) eventos.push({ ano: "2015-2026", ordem: 2015, texto: secaoDe(dossie, "transmissoes")?.resumo ?? transmissoes.texto, fato: transmissoes });
  const dc = fatoDe(dossie, "defesa_civil", "dc_total");
  if (dc) eventos.push({ ano: "2024", ordem: 2024, texto: secaoDe(dossie, "defesa_civil")?.resumo ?? dc.texto, fato: dc });
  const demolicao = fatoDe(dossie, "obras", "obras_demolicao");
  if (demolicao) eventos.push({ ano: "2026", ordem: 2026, texto: demolicao.texto, fato: demolicao });
  return eventos.sort((a, b) => a.ordem - b.ordem);
}

export default function LinhaDoTempo() {
  const dossie = useDossie();
  const mostrarFinal = useMostrarFinal();
  if (!mostrarFinal) return <Redirect href={{ pathname: "/dossie/[id]", params: { id: dossie.id } }} />;
  return (
    <Tela comAbas>
      <Cabecalho titulo="Linha do tempo do prédio" fase="final" pai={{ pathname: "/dossie/[id]", params: { id: dossie.id } }} />
      <Rolagem>
        <Cartao>
          {eventosDoPredio(dossie).map((e, i) => (
            <View key={`${e.ano}-${e.fato.id}`}>
              {i > 0 ? <Divisor /> : null}
              <Pressionavel
                role="link"
                onPress={() => router.push({ pathname: "/dossie/[id]/fonte/[fato]", params: { id: dossie.id, fato: e.fato.id } })}
                style={{ flexDirection: "row", gap: ESPACO[3], alignItems: "flex-start", paddingVertical: ESPACO[3], paddingHorizontal: ESPACO[4], minHeight: 64 }}
              >
                <Texto tipo="secao" style={{ width: 80 }}>
                  {e.ano}
                </Texto>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: ESPACO[2] }}>
                    <Traco rotulo={e.fato.rotulo} />
                    <Texto style={{ flexShrink: 1 }}>{e.texto}</Texto>
                    {e.fato.ilustrativo ? <PilulaIlustrativo /> : null}
                  </View>
                  <Texto tipo="apoio" cor="cor-texto-apoio">
                    {linhaDaFonte(e.fato.fonte, null)}
                  </Texto>
                </View>
              </Pressionavel>
            </View>
          ))}
        </Cartao>
      </Rolagem>
      <AbasForaDoDossie idDossie={dossie.id} />
    </Tela>
  );
}
