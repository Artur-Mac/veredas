import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import { iniciarCaptura, type EstadoDaBussola } from "../../dados/sol/captura";
import type { CoordenadaSolar, JanelaSolar } from "../../dados/sol/contratos";
import { nomeDaDirecao } from "../../dados/sol/janelas";
import { fonteDaBussolaSolar, temBussolaSolar } from "../../plataforma/bussolaSolar";
import { useTema } from "../../tema/Tema";
import { Botao } from "../Botao";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { CampoDeTexto } from "../visita-v1/blocos";
import { ControleSolar } from "./Controle";
import { DesenhoDaCaptura } from "./Ilustracao";

export function EscolhaSolar({ rotulo, selecionado = false, aoEscolher }: { rotulo: string; selecionado?: boolean; aoEscolher: () => void }) {
  const { cor } = useTema();
  return <Pressionavel accessibilityRole="button" accessibilityState={{ selected: selecionado }} aria-pressed={selecionado} onPress={aoEscolher}
    style={{ minHeight: 48, minWidth: 48, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1,
      borderColor: cor(selecionado ? "cor-texto" : "cor-linha"), backgroundColor: cor(selecionado ? "cor-sutil" : "cor-superficie"), borderRadius: 24, justifyContent: "center" }}>
    <Texto tipo="apoio" style={{ fontWeight: selecionado ? "700" : "500" }}>{rotulo}</Texto>
  </Pressionavel>;
}
export function CapturaSolar({ existente, coordenada, aoGuardar, aoCancelar }: {
  existente: JanelaSolar | null; coordenada: CoordenadaSolar | null; aoGuardar: (j: JanelaSolar) => Promise<void>; aoCancelar: () => void;
}) {
  const [nome, setNome] = useState(existente?.nome ?? "Sala");
  const [outro, setOutro] = useState(!!existente && !["Sala", "Quarto", "Varanda"].includes(existente.nome));
  const [graus, setGraus] = useState<number | null>(existente?.graus ?? null);
  const [manual, setManual] = useState(!temBussolaSolar);
  const [ajuste, setAjuste] = useState(existente?.graus !== null && existente?.graus !== undefined && existente.graus % 90 !== 0);
  const [leitura, setLeitura] = useState<EstadoDaBussola | null>(null);
  const [salvando, setSalvando] = useState(false), [erro, setErro] = useState("");
  const desligar = useRef<(() => void) | null>(null);
  const parar = useCallback(() => { desligar.current?.(); desligar.current = null; }, []);
  useFocusEffect(useCallback(() => parar, [parar]));
  useEffect(() => {
    const sub = AppState.addEventListener("change", e => { if (e !== "active") { parar(); setLeitura({ estado: "indisponivel", mensagem: "Leitura pausada. Toque em Usar bússola para tentar de novo." }); } });
    return () => { sub.remove(); parar(); };
  }, [parar]);
  const medir = () => { parar(); setManual(false); desligar.current = iniciarCaptura(fonteDaBussolaSolar(), l => { setLeitura(l); if (l.estado === "leitura") setGraus(l.graus); }); };
  const indicar = () => { parar(); setManual(true); setLeitura(null); };
  const pronto = manual ? graus !== null : leitura?.estado === "leitura" && leitura.estavel;
  const guardar = async () => {
    if (!pronto || !nome.trim() || salvando) return;
    parar(); setSalvando(true); setErro("");
    const em = new Date().toISOString();
    const medida = !manual && leitura?.estado === "leitura" ? leitura : null;
    try { await aoGuardar({
      id: existente?.id ?? `janela-${Date.now().toString(36)}`, nome: nome.trim(), graus,
      referencia: "verdadeiro", origem: medida ? "bussola" : "manual", observadoEm: em, revisadoEm: em,
      calibracao: medida?.calibracao ?? null, coordenada: coordenada ?? medida?.coordenada ?? existente?.coordenada ?? null,
      andar: existente?.andar ?? null, posicao: null, protecoes: existente?.protecoes ?? [],
    }); } catch { setErro("Não foi possível guardar a janela. A direção continua aqui para tentar de novo."); }
    finally { setSalvando(false); }
  };
  return <View style={{ gap: 16 }}>
    <Texto tipo="titulo-tela" style={{ fontSize: 29, lineHeight: 35 }}>Qual janela vamos observar?</Texto>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {["Sala", "Quarto", "Varanda", "Outra"].map(n => <EscolhaSolar key={n} rotulo={n} selecionado={n === "Outra" ? outro : !outro && nome === n} aoEscolher={() => { setOutro(n === "Outra"); setNome(n === "Outra" ? "" : n); }} />)}
    </View>
    {outro ? <CampoDeTexto rotulo="Nome da janela" value={nome} onChangeText={setNome} maxLength={60} placeholder="Ex.: quarto de frente" /> : null}
    <DesenhoDaCaptura graus={graus} />
    {manual ? <>
      <Texto tipo="corpo">Indique para onde você olha, de frente para fora da janela.</Texto>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {(ajuste ? [0, 45, 90, 135, 180, 225, 270, 315] : [0, 90, 180, 270]).map(g => <EscolhaSolar key={g} rotulo={nomeDaDirecao(g)} selecionado={graus !== null && nomeDaDirecao(graus) === nomeDaDirecao(g)} aoEscolher={() => setGraus(g)} />)}
      </View>
      <Botao rotulo={ajuste ? "Fechar ajuste fino" : "Refinar direção"} variante="texto" expandido={ajuste} onPress={() => setAjuste(!ajuste)} />
      {ajuste ? <ControleSolar valor={graus ?? 0} minimo={0} maximo={359} passo={1} rotulo="Direção da janela" texto={graus === null ? "A escolher" : nomeDaDirecao(graus)} aoMudar={setGraus} /> : null}
      <Texto tipo="apoio" cor="cor-texto-apoio">Use o norte do mapa ou de uma planta. Se não souber, você pode verificar depois.</Texto>
    </> : <>
      <Texto tipo="corpo">De frente para fora da janela, mantenha o celular deitado e aponte a parte de cima para fora.</Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio">A bússola usa sua permissão de localização para encontrar o norte verdadeiro.</Texto>
      {leitura?.estado === "preparando" ? <Texto role="status">Preparando a bússola…</Texto> : null}
      {leitura?.estado === "leitura" ? <Texto role="status">{leitura.estavel ? `Direção pronta · ${nomeDaDirecao(leitura.graus)}` : "Afaste o celular de metais e mantenha a direção por um instante."}</Texto> : null}
      {leitura?.estado === "indisponivel" ? <Texto role="alert">{leitura.mensagem}</Texto> : null}
      <Botao rotulo="Usar bússola" onPress={medir} />
      <Botao rotulo="Indicar direção manualmente" variante="texto" onPress={indicar} />
    </>}
    {temBussolaSolar && manual ? <Botao rotulo="Usar bússola" variante="texto" onPress={medir} /> : null}
    {erro ? <Texto role="alert" cor="cor-barro-texto">{erro}</Texto> : null}
    <Botao rotulo={salvando ? "Guardando…" : "Guardar direção"} variante="principal" desativado={!pronto || !nome.trim() || salvando} onPress={() => void guardar()} />
    <Botao rotulo="Verificar depois" variante="texto" onPress={() => { parar(); aoCancelar(); }} />
  </View>;
}
