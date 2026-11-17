// Medidor opcional de 10 s pelo microfone (15/11/2026), só no navegador (Web Audio API). Mede o nível médio (RMS) com a
// janela aberta e com ela fechada e mostra só a DIFERENÇA entre as duas, em dB relativos: o microfone do celular não é
// calibrado, então o número absoluto não é decibel de verdade e não aparece. Nada é gravado: o áudio é lido e descartado.
// Os três botões manuais do "Ruído de fora" continuam (permissão negada, aparelho sem Web Audio, servidor de teste sem https).
import { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { Botao } from "../Botao";
import { Texto } from "../Texto";

export const SEGUNDOS_DA_MEDIDA = 10;

/** Nível médio em dB relativo ao fundo de escala (dBFS) de amostras entre −1 e 1; null para silêncio digital. */
export function nivelRelativoDb(somaDosQuadrados: number, amostras: number): number | null {
  if (!(amostras > 0) || !(somaDosQuadrados > 0)) return null;
  return 10 * Math.log10(somaDosQuadrados / amostras);
}

/** "Fechar a janela baixou ~8 dB": a diferença aberta − fechada, arredondada, com o sentido em palavras. */
export function fraseDaDiferenca(aberta: number, fechada: number): string {
  const d = Math.round(aberta - fechada);
  if (Math.abs(d) < 2) return "Com a janela aberta ou fechada, o nível ficou parecido (diferença menor que 2 dB relativos).";
  return d > 0 ? `Fechar a janela baixou ~${d} dB relativos.` : `Com a janela fechada o nível ficou ~${-d} dB relativos mais alto (barulho de dentro? repita a medida).`;
}

type Medida = { aberta: number | null; fechada: number | null };

export function MedidorDeRuido({ aoGuardar }: { aoGuardar?: (texto: string) => void }) {
  const [medida, setMedida] = useState<Medida>({ aberta: null, fechada: null });
  const [medindo, setMedindo] = useState<keyof Medida | null>(null);
  const [restante, setRestante] = useState(0);
  const [erro, setErro] = useState("");
  const parar = useRef<(() => void) | null>(null);
  useEffect(() => () => parar.current?.(), []);

  const disponivel = Platform.OS === "web" && typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof window !== "undefined" && "AudioContext" in window;
  if (!disponivel) {
    return <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>A medida pelo microfone funciona no navegador. Aqui, use os três botões acima.</Texto>;
  }

  const medir = async (qual: keyof Medida) => {
    setErro("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch {
      setErro("Sem permissão para o microfone. Use os três botões acima.");
      return;
    }
    const ctx = new AudioContext();
    const analisador = ctx.createAnalyser();
    analisador.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analisador);
    const buf = new Float32Array(analisador.fftSize);
    let soma = 0, n = 0;
    setMedindo(qual);
    setRestante(SEGUNDOS_DA_MEDIDA);
    const inicio = Date.now();
    let relogio: ReturnType<typeof setInterval> | null = null;
    const encerrar = (concluiu: boolean) => {
      if (relogio) clearInterval(relogio);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close().catch(() => undefined);
      parar.current = null;
      setMedindo(null);
      if (concluiu) {
        const nivel = nivelRelativoDb(soma, n);
        if (nivel === null) setErro("O microfone não captou som. Tente de novo.");
        else setMedida((m) => ({ ...m, [qual]: nivel }));
      }
    };
    relogio = setInterval(() => {
      analisador.getFloatTimeDomainData(buf);
      for (const v of buf) { soma += v * v; n++; }
      const passou = (Date.now() - inicio) / 1000;
      setRestante(Math.max(0, Math.ceil(SEGUNDOS_DA_MEDIDA - passou)));
      if (passou >= SEGUNDOS_DA_MEDIDA) encerrar(true);
    }, 100);
    parar.current = () => encerrar(false);
  };

  const pronto = medida.aberta !== null && medida.fechada !== null;
  const frase = pronto ? fraseDaDiferenca(medida.aberta!, medida.fechada!) : null;
  return (
    <View style={{ gap: 8, marginTop: 10 }} role="group" aria-label="Medir 10 segundos com o microfone">
      <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 17, fontWeight: "600" }}>Medir 10 s com microfone (opcional)</Texto>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Botao rotulo={medindo === "aberta" ? `Medindo… ${restante} s` : medida.aberta !== null ? "Janela aberta ✓" : "Janela aberta"} variante="secundario" desativado={medindo !== null} onPress={() => void medir("aberta")} />
        <Botao rotulo={medindo === "fechada" ? `Medindo… ${restante} s` : medida.fechada !== null ? "Janela fechada ✓" : "Janela fechada"} variante="secundario" desativado={medindo !== null} onPress={() => void medir("fechada")} />
      </View>
      {frase ? <Texto role="status" style={{ fontSize: 13, lineHeight: 19, fontWeight: "600" }}>{frase}</Texto> : null}
      {frase && aoGuardar ? <Botao rotulo="Guardar nas impressões" variante="texto" onPress={() => aoGuardar(`Microfone (10 s, sem calibração): ${frase}`)} /> : null}
      {erro ? <Texto tipo="apoio" role="alert" cor="cor-barro-texto">{erro}</Texto> : null}
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>
        Só a diferença entre aberta e fechada, no mesmo aparelho e lugar. O microfone não é calibrado e o navegador pode ajustar o ganho: não é medição em dB(A). Nada é gravado. Nível da rua em dB(A) para comparar: Sem leitura publicada nesta área ainda.
      </Texto>
    </View>
  );
}
