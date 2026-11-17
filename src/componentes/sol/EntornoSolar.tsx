import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import type { Edificio } from "../../dados/contratos";
import type { JanelaSolar } from "../../dados/sol/contratos";
import { garantirCamadas } from "../../dados/camadas";
import { camadasDoSol } from "../../dados/camadasDasTelas";
import { carregarEntornoSolar, facesDoVolume, type EntornoDaJanela } from "../../dados/sol/entorno";
import { alturasDaJanela, emMetros, lerExposicao, trajetoria, type Ponto, type RecorteSolar, type VolumeSolar } from "../../dados/sol/geometria";
import { nomeDaDirecao } from "../../dados/sol/janelas";
import { useTema } from "../../tema/Tema";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoDeTexto } from "../visita-v1/blocos";
import { EscolhaSolar } from "./Captura";
import { ControleSolar } from "./Controle";

const caminho = (pts: readonly Ponto[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ") + " Z";

/** Planta dos volumes construídos. Sombra na altura aproximada da janela, não no chão. */
function PlantaSolar({ janela, recorte, volumes, leitura, semId }: {
  janela: JanelaSolar; recorte: RecorteSolar; volumes: VolumeSolar[];
  leitura: ReturnType<typeof lerExposicao>; semId: string | undefined;
}) {
  const { cor } = useTema();
  const centro: Ponto = janela.posicao ? [janela.posicao.longitude, janela.posicao.latitude] : recorte.centro;
  // Enquadramento métrico fixo: um obstáculo distante não reduz a janela a um ponto ilegível.
  const escala = 2.2;
  const px = (p: Ponto): [number, number] => { const [x, y] = emMetros(p, centro); return [170 + x * escala, 120 - y * escala]; };
  const z = janela.andar === null ? null : alturasDaJanela(janela.andar).reduce((a, b) => a + b) / 2;
  const elevar = leitura.sol.elevacao * Math.PI / 180;
  const a = leitura.sol.azimute * Math.PI / 180;
  const dsqflAtivo = recorte.volumes.find(v => v.id === janela.posicao?.volumeId)?.dsqfl;
  const sombra = (v: VolumeSolar) => {
    if (z === null || v.alturaM === null || v.baseM + v.alturaM <= z || elevar <= 0) return [];
    const distancia = (v.baseM + v.alturaM - z) / Math.tan(elevar);
    const deslocar = (p: Ponto): Ponto => [p[0] - Math.sin(a) * distancia * escala, p[1] + Math.cos(a) * distancia * escala];
    const rings = v.aneis.map(r => r.map(px));
    return [rings.map(r => caminho(r.map(deslocar))).join(" "), ...rings.flatMap(r => {
      const shifted = r.map(deslocar);
      return r.slice(0, -1).map((p, i) => caminho([p, r[i + 1]!, shifted[i + 1]!, shifted[i]!]));
    })];
  };
  return <Svg width="100%" height={246} viewBox="0 0 340 246" role="img" accessibilityLabel={`Planta dos contornos construídos. ${leitura.motivo}. Norte para cima. Sombras aproximadas na altura da janela.`}>
    <G opacity={0.13} fill={cor("cor-texto")}>
      {volumes.filter(v => v.id !== semId).flatMap(v => sombra(v).map((d, i) => <Path key={`${v.id}-${i}`} d={d} fillRule="evenodd" />))}
    </G>
    {volumes.map(v => <Path key={v.id} d={v.aneis.map(r => caminho(r.map(px))).join(" ")} fillRule="evenodd"
      fill={cor(v.dsqfl === recorte.volumes.find(x => x.id === janela.posicao?.volumeId)?.dsqfl ? "cor-sutil" : "cor-superficie")}
      stroke={cor(v.id === semId ? "cor-traco" : "cor-linha-forte")} strokeWidth={1.2} strokeDasharray={v.id === semId ? "3 4" : undefined} opacity={v.id === semId ? 0.4 : 1} />)}
    {volumes.filter(v => v.dsqfl !== dsqflAtivo).map((v, i) => {
      const p = px(v.aneis[0]![0]!);
      if (p[0] >= 18 && p[0] <= 322 && p[1] >= 45 && p[1] <= 212) return null;
      const x = Math.max(24, Math.min(306, p[0])), y = Math.max(48, Math.min(206, p[1]));
      return <G key={`fora-${v.id}`}><Circle cx={x} cy={y} r={8} fill={cor("cor-superficie")} stroke={cor("cor-traco")} /><SvgText x={x} y={y + 3} fontSize={9} textAnchor="middle" fill={cor("cor-texto")}>{i + 1}</SvgText></G>;
    })}
    {janela.posicao ? <G>
      <Circle cx={170} cy={120} r={7} fill={cor("cor-superficie")} stroke={cor("cor-acao")} strokeWidth={3} />
      <SvgText x={170} y={142} textAnchor="middle" fontSize={11} fontFamily="PlusJakartaSans" fill={cor("cor-texto")}>Sua janela</SvgText>
    </G> : null}
    <Line x1={316} y1={39} x2={316} y2={22} stroke={cor("cor-texto-apoio")} />
    <SvgText x={316} y={16} textAnchor="middle" fontSize={10} fill={cor("cor-texto-apoio")}>N</SvgText>
    <SvgText x={14} y={232} fontSize={10} fontFamily="PlusJakartaSans" fill={cor("cor-texto-apoio")}>PLANTA · ALTURAS ESTIMADAS</SvgText>
    <Line x1={264} y1={228} x2={308} y2={228} stroke={cor("cor-texto-apoio")} />
    <SvgText x={286} y={220} textAnchor="middle" fontSize={10} fill={cor("cor-texto-apoio")}>20 m</SvgText>
  </Svg>;
}

export function EntornoSolar({ janela, predio, dia, minutos, andarDeclarado, aoGuardar }: {
  janela: JanelaSolar; predio: Edificio | null; dia: string; minutos: number; andarDeclarado: number | null;
  aoGuardar: (j: JanelaSolar) => Promise<void>;
}) {
  const [dados, setDados] = useState<EntornoDaJanela | null>(null), [carregando, setCarregando] = useState(true);
  const [editar, setEditar] = useState(!janela.posicao || janela.andar === null);
  const [andar, setAndar] = useState(String(janela.andar ?? andarDeclarado ?? ""));
  const [volumeId, setVolumeId] = useState(janela.posicao?.volumeId ?? "");
  const [face, setFace] = useState(0), [posicaoNoLado, setPosicaoNoLado] = useState(50);
  const [selecionado, setSelecionado] = useState<string | null>(null), [semVizinho, setSemVizinho] = useState(false);
  const [erro, setErro] = useState(""), [salvando, setSalvando] = useState(false);
  // D036: o recorte do bairro fica fora do bundle. Falha ao carregar é dita como falha, nunca como "sem contorno".
  const [falhou, setFalhou] = useState(false), [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    const t = setTimeout(() => {
      void garantirCamadas(predio ? camadasDoSol(predio.bairro) : []).then(
        () => { const d = predio ? carregarEntornoSolar(predio) : null; if (ativo) { setDados(d); setCarregando(false); } },
        () => { if (ativo) { setFalhou(true); setCarregando(false); } });
    }, 0);
    return () => { ativo = false; clearTimeout(t); };
  }, [predio, tentativa]);
  const volume = dados?.volumesDoImovel.find(v => v.id === volumeId) ?? dados?.volumesDoImovel[0] ?? null;
  const faces = useMemo(() => volume ? facesDoVolume(volume, janela.graus ?? 0) : [], [volume, janela.graus]);
  const escolhida = faces[face] ?? faces[0];
  const pronta = !!janela.posicao && janela.andar !== null && dados?.recorte.versao === janela.posicao.geometriaVersao;
  const serie = useMemo(() => dados && pronta ? trajetoria(janela, dia, dados.recorte, undefined, 15) : [], [dados, pronta, janela, dia]);
  const relevantes = useMemo(() => {
    if (!dados) return [];
    const contagem = new Map<string, number>();
    for (const p of serie) if (p.leitura.obstaculoId) contagem.set(p.leitura.obstaculoId, (contagem.get(p.leitura.obstaculoId) ?? 0) + 1);
    const dsqfl = predio?.dsqfl;
    const candidatos = dados.recorte.volumes.filter(v => v.dsqfl !== dsqfl);
    const distancia = (v: VolumeSolar) => Math.min(...v.aneis[0]!.map(p => Math.hypot(...emMetros(p, dados.recorte.centro))));
    const principal = [...candidatos].filter(v => contagem.has(v.id)).sort((a, b) => (contagem.get(b.id) ?? 0) - (contagem.get(a.id) ?? 0))[0];
    const locais = candidatos.filter(v => v.id !== principal?.id).sort((a, b) => distancia(a) - distancia(b));
    // Um obstáculo de impacto + contexto próximo: não reduz o quadro a três marcadores distantes.
    return [...(principal ? [principal] : []), ...locais].slice(0, 3);
  }, [dados, serie, predio?.dsqfl]);
  if (carregando) return <Texto role="status">Abrindo os contornos do entorno…</Texto>;
  if (falhou) return <View style={{ gap: 10 }}>
    <Texto role="alert" tipo="corpo">Não foi possível carregar os contornos do entorno deste bairro. Sem internet, só abrem os bairros já abertos neste aparelho.</Texto>
    <Botao rotulo="Tentar de novo" variante="secundario" onPress={() => { setFalhou(false); setCarregando(true); setTentativa(n => n + 1); }} />
  </View>;
  if (!dados || !volume) return <View style={{ gap: 10 }}>
    <Texto tipo="secao">Entorno a conferir</Texto>
    <Texto tipo="corpo">Ainda não temos um contorno construído associado com segurança a este imóvel. O percurso do Sol continua disponível; a sombra dos vizinhos não foi calculada.</Texto>
  </View>;
  const ler = (sem?: string) => lerExposicao(janela, dia, minutos, dados.recorte, sem);
  const leitura = ler(semVizinho ? selecionado ?? undefined : undefined);
  const bloqueadorOculto = leitura.obstaculoId && !relevantes.some(v => v.id === leitura.obstaculoId) && !dados.volumesDoImovel.some(v => v.id === leitura.obstaculoId)
    ? dados.recorte.volumes.find(v => v.id === leitura.obstaculoId) : null;
  const volumesVisiveis = [...dados.volumesDoImovel, ...relevantes, ...(bloqueadorOculto ? [bloqueadorOculto] : [])];
  const confirmar = async () => {
    const n = Number(andar);
    if (!andar.trim() || !Number.isInteger(n) || n < -5 || n > 200 || !escolhida) { setErro("Informe o andar e escolha o lado da janela."); return; }
    if (predio?.pavimentos && n > predio.pavimentos) { setErro("Este andar ultrapassa os pavimentos cadastrados. Confira o prédio e o andar."); return; }
    const t = posicaoNoLado / 100;
    setSalvando(true); setErro("");
    try { await aoGuardar({ ...janela, andar: n, posicao: { volumeId: volume.id,
      longitude: escolhida.a[0] + t * (escolhida.b[0] - escolhida.a[0]), latitude: escolhida.a[1] + t * (escolhida.b[1] - escolhida.a[1]),
      geometriaVersao: dados.recorte.versao, origem: "fachada_informada" }, revisadoEm: new Date().toISOString() }); setEditar(false); }
    catch { setErro("Não foi possível guardar. Tente de novo."); } finally { setSalvando(false); }
  };
  return <View style={{ gap: 14 }}>
    <Texto tipo="titulo-tela" style={{ fontSize: 24 }}>Os prédios ao redor</Texto>
    {editar ? <>
      <Texto tipo="apoio" cor="cor-texto-apoio">Para estimar a sombra, precisamos do andar e da posição aproximada desta janela.</Texto>
      <CampoDeTexto rotulo="Andar do apartamento" keyboardType="numbers-and-punctuation" value={andar} onChangeText={setAndar} maxLength={3} placeholder="Ex.: 5; térreo = 0" />
      {dados.volumesDoImovel.length > 1 ? <View style={{ gap: 8 }}>
        <Texto tipo="apoio">Em qual volume fica a janela?</Texto>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{dados.volumesDoImovel.map((v, i) => <EscolhaSolar key={v.id} rotulo={`Volume ${i + 1}`} selecionado={v.id === volume.id} aoEscolher={() => { setVolumeId(v.id); setFace(0); }} />)}</View>
      </View> : null}
      <PlantaSolar janela={{ ...janela, posicao: escolhida ? { volumeId: volume.id, longitude: escolhida.a[0] + posicaoNoLado / 100 * (escolhida.b[0] - escolhida.a[0]), latitude: escolhida.a[1] + posicaoNoLado / 100 * (escolhida.b[1] - escolhida.a[1]), geometriaVersao: dados.recorte.versao, origem: "fachada_informada" } : null }} recorte={dados.recorte} volumes={dados.volumesDoImovel} leitura={leitura} semId={undefined} />
      <Texto tipo="apoio">Escolha o lado compatível com a direção registrada.</Texto>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{faces.map((f, i) => <EscolhaSolar key={f.indice} rotulo={`Lado ${i + 1} · ${nomeDaDirecao(f.orientacao)}`} selecionado={i === face} aoEscolher={() => setFace(i)} />)}</View>
      {!faces.length ? <Texto>Não encontramos uma face compatível. Confira a direção e o volume antes de estimar sombras.</Texto> : null}
      <ControleSolar valor={posicaoNoLado} minimo={5} maximo={95} passo={5} rotulo="Posição neste lado" texto={posicaoNoLado === 50 ? "No meio" : posicaoNoLado < 50 ? "Mais perto do início" : "Mais perto do fim"} aoMudar={setPosicaoNoLado} />
      {erro ? <Texto role="alert">{erro}</Texto> : null}
      <Botao rotulo={salvando ? "Guardando…" : "Usar esta posição"} onPress={() => void confirmar()} desativado={!escolhida || salvando} />
      <Botao rotulo="Não sei · continuar sem sombras" variante="texto" onPress={() => setEditar(false)} />
    </> : <>
      {pronta ? <>
        <PlantaSolar janela={janela} recorte={dados.recorte} volumes={volumesVisiveis} leitura={leitura} semId={semVizinho ? selecionado ?? undefined : undefined} />
        <Texto role="status" tipo="corpo">{semVizinho ? "Sem este obstáculo · hipótese. " : ""}{leitura.motivo}.</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio">Alturas aproximadas. Marcadores na borda indicam volumes fora do quadro; o cálculo considera todos os volumes do recorte.</Texto>
        <Texto tipo="apoio" style={{ fontWeight: "600" }}>Influência de um vizinho</Texto>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{relevantes.map((v, i) => <EscolhaSolar key={v.id} rotulo={`Vizinho ${i + 1}`} selecionado={selecionado === v.id} aoEscolher={() => { setSelecionado(v.id); setSemVizinho(false); }} />)}</View>
        {selecionado ? <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            <EscolhaSolar rotulo="Com todos os obstáculos" selecionado={!semVizinho} aoEscolher={() => setSemVizinho(false)} />
            <EscolhaSolar rotulo="Sem este obstáculo · hipótese" selecionado={semVizinho} aoEscolher={() => setSemVizinho(true)} />
          </View>
          <Texto tipo="apoio">{ler().estado === ler(selecionado).estado ? "Neste horário, retirar esse volume não muda a conclusão." : "Neste horário, esse volume interfere na exposição estimada da janela."}</Texto>
        </> : null}
      </> : <Texto tipo="corpo">O entorno está disponível como contexto. Informe a posição e o andar para explorar a sombra dos volumes cadastrados.</Texto>}
      <Botao rotulo="Conferir andar e posição" variante="texto" onPress={() => setEditar(true)} />
    </>}
    <Texto tipo="apoio" cor="cor-texto-apoio">Prefeitura do Recife · base publicada em março de 2026 · ODbL. Cobertura parcial; a situação atual pode ser diferente.</Texto>
  </View>;
}
