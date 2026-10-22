import { useRef, useState } from "react";
import { View } from "react-native";
import { esquemaCaderno, type Caderno } from "../../dados/caderno";
import { distanciaDaRotina } from "../../dados/rotina";
import { obterPosicaoDaVisita } from "../../plataforma/posicaoDaVisita";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, GrupoLocal } from "./blocos";

export function RotinaPessoal({ caderno, centro, salvar }: { caderno: Caderno; centro: [number, number] | null; salvar: (mudar: (c: Caderno) => Caderno) => Promise<boolean> }) {
  const [apelido, setApelido] = useState("");
  const [nota, setNota] = useState("");
  const [posicao, setPosicao] = useState<NonNullable<Caderno["destinos"]>[number]["posicao"]>(null);
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const localizar = async () => {
    if (trava.current) return;
    trava.current = true; setOcupado(true);
    try { const { longitude, latitude, precisaoM, em } = await obterPosicaoDaVisita(); setPosicao({ longitude, latitude, precisaoM, em }); setAviso("Posição obtida. Confira o apelido antes de guardar."); }
    catch (e) { setAviso(e instanceof Error ? e.message : "Não foi possível obter a posição. Você pode guardar apenas uma nota."); }
    finally { trava.current = false; setOcupado(false); }
  };
  const guardar = async () => {
    const d = esquemaCaderno.shape.destinos.unwrap().element.safeParse({ id: `destino-${Date.now().toString(36)}`, apelido, nota, posicao });
    if (!d.success) { setAviso("Informe um apelido para o destino, com até 80 caracteres."); return; }
    if (await salvar(c => ({ ...c, destinos: [...c.destinos ?? [], d.data] }))) { setApelido(""); setNota(""); setPosicao(null); setAviso("Destino guardado neste caderno."); }
  };
  return <GrupoLocal titulo="Destinos da sua rotina" apoio="Destinos privados e opcionais. A distância reta não é um caminho: rios, pontes, trânsito e calçadas podem mudar o trajeto.">
    <CampoLocal rotulo="Apelido do destino" value={apelido} onChangeText={setApelido} maxLength={80} />
    <CampoLocal rotulo="Anotação de trajeto (opcional)" value={nota} onChangeText={setNota} multiline maxLength={1000} />
    <Texto tipo="apoio">Se você estiver no destino agora, registre sua posição. Nenhuma localização é solicitada ao abrir esta seção. Sem posição, o destino fica como anotação.</Texto>
    <Botao rotulo="Estou no destino: obter minha posição" desativado={ocupado} onPress={() => void localizar()} />
    {posicao ? <><Texto tipo="apoio">Precisão horizontal informada: {posicao.precisaoM === null ? "indisponível" : `${Math.round(posicao.precisaoM)} m`}. Não confirma uma entrada ou percurso.</Texto><Botao rotulo="Retirar posição deste rascunho" onPress={() => setPosicao(null)} /></> : null}
    <Botao rotulo="Guardar destino privado" desativado={ocupado} onPress={() => void guardar()} />
    {aviso ? <Texto role="status">{aviso}</Texto> : null}
    {caderno.destinos?.map(d => {
      const distancia = distanciaDaRotina(centro, d);
      return <View key={d.id} style={{ gap: 5, marginVertical: 8 }}>
        <Texto tipo="secao">{d.apelido}</Texto><Texto>{distancia === null ? "Distância indisponível: é preciso uma referência do prédio e uma posição do destino com precisão informada de até 100 m." : `Aproximadamente ${distancia.toLocaleString("pt-BR")} m em linha reta do ponto cadastral. Não é rota nem tempo de deslocamento.`}</Texto>
        {d.posicao ? <Texto tipo="apoio">Posição registrada por você em {new Date(d.posicao.em).toLocaleString("pt-BR")}.</Texto> : null}
        {d.nota ? <Texto>{d.nota}</Texto> : null}
        <Botao rotulo="Remover destino" acessivel={`Remover destino ${d.apelido}`} onPress={() => void salvar(c => ({ ...c, destinos: c.destinos?.filter(x => x.id !== d.id) }))} />
      </View>;
    })}
  </GrupoLocal>;
}
