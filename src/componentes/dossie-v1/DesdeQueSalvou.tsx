// "Desde que você guardou" (VE09), no topo de Destaques: o que mudou nas bases para este imóvel desde o retrato guardado.
// Primeiro o que conta para a decisão (custo do anúncio, licença nova ou que mudou de situação, atendimento novo na rua,
// mudança no mapa, ônibus da noite); correções de base e registros antigos ficam atrás de um toque. Atualizar o retrato
// é uma ação deliberada da pessoa ("Marcar como visto hoje"); nada roda em segundo plano.
import { useMemo, useState } from "react";
import { View } from "react-native";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { formatarData } from "../../dados/formatos";
import { resumoDasMudancas, type Instantaneo } from "../../dados/memoria";
import { mudancasDoDossie, retratoDoDossie } from "../../dados/memoriaDoDossie";
import { ESPACO } from "../../tema/tokens";
import { Texto } from "../Texto";
import { CaixaCreme, Corpo, LinkComSeta, Nota } from "./base";

type Props = { analise: AnaliseV2; predio: Edificio | null; aoGuardarRetrato: (r: Instantaneo) => Promise<void> };

export function DesdeQueSalvou({ analise, predio, aoGuardarRetrato }: Props) {
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const agora = useMemo(() => new Date().toISOString(), []);
  const r = useMemo(() => mudancasDoDossie(analise, predio, agora), [analise, predio, agora]);
  const guardar = async () => {
    if (ocupado) return;
    setOcupado(true);
    try { await aoGuardarRetrato(retratoDoDossie(analise, predio, new Date().toISOString())); } finally { setOcupado(false); }
  };
  if (!r) {
    return (
      <View style={{ marginBottom: ESPACO[4], gap: 4 }}>
        <Nota>Guarde o que este dossiê mostra hoje para ver, quando voltar, o que mudou nas bases: custo do anúncio, licenças de obra perto, Defesa Civil na rua, mercado e ônibus.</Nota>
        <LinkComSeta rotulo={ocupado ? "Guardando…" : "Guardar o que o dossiê mostra hoje"} discreto onPress={() => void guardar()} />
      </View>
    );
  }
  const desde = formatarData(r.desde.slice(0, 10));
  const { relevantes, correcoes } = resumoDasMudancas(r.mudancas);
  if (!relevantes.length && !correcoes.length) return <View style={{ marginBottom: ESPACO[4] }}><Nota>{`Nada mudou nas bases deste dossiê desde ${desde}.`}</Nota></View>;
  return (
    <CaixaCreme estilo={{ marginBottom: ESPACO[4] }}>
      <View style={{ gap: ESPACO[2] }} role="group" aria-label="Mudanças desde que você guardou">
        <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
          {relevantes.length ? `Desde ${desde}, quando você guardou este dossiê` : `Desde ${desde}: nada mudou no que você viu`}
        </Texto>
        {relevantes.slice(0, aberto ? undefined : 3).map((m) => <Corpo key={m.id}>{m.frase}</Corpo>)}
        {correcoes.length || relevantes.length > 3 ? (
          <LinkComSeta discreto seta={false} onPress={() => setAberto((x) => !x)}
            rotulo={aberto ? "Ocultar detalhes" : `${relevantes.length > 3 ? `Mais ${relevantes.length - 3} · ` : ""}${correcoes.length ? `${correcoes.length} ${correcoes.length === 1 ? "correção" : "correções"} de base` : ""}`.replace(/ · $/, "")} />
        ) : null}
        {aberto ? correcoes.map((m) => <Nota key={m.id}>{m.frase}</Nota>) : null}
        <LinkComSeta rotulo={ocupado ? "Guardando…" : "Marcar como visto hoje"} discreto onPress={() => void guardar()} />
      </View>
    </CaixaCreme>
  );
}
