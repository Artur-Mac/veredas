// "O sol nas fachadas" (VE07.02), na aba Edifício: primeiro qual lado do prédio tem sol e quando visitar para ver a
// diferença; os números por lado e o método ficam atrás de um toque; um botão leva a conferência para a visita.
import { useEffect, useState } from "react";
import { View } from "react-native";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { garantirCamadas } from "../../dados/camadas";
import { camadasDoSol } from "../../dados/camadasDasTelas";
import { carregarEntornoSolar } from "../../dados/sol/entorno";
import { contrasteDasFachadas, fraseDoDestaque, horaDaVisita, linhasDosLados, notaDoMetodo, perguntaParaVisita, type ContrasteDasFachadas } from "../../dados/sol/fachadas";
import { ESPACO } from "../../tema/tokens";
import { Texto } from "../Texto";
import { Corpo, LinkComSeta, Nota, Sobretitulo, Titulo2 } from "./base";

type Calculo = { c: ContrasteDasFachadas; hora: number | null };
const cache = new Map<string, Calculo>();
function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Props = { analise: AnaliseV2; predio: Edificio | null; aoLevarParaVisita: (texto: string) => Promise<boolean>; hoje?: string };

export function SolNasFachadas({ analise, predio, aoLevarParaVisita, hoje = hojeLocal() }: Props) {
  const andar = analise.declarados.andar.valor;
  const chave = predio ? `${predio.bairro}|${predio.id}|${andar}|${hoje}` : null;
  // O resultado mora no cache do módulo; o estado só avisa que um cálculo terminou.
  const [, setVersao] = useState(0);
  const calculo = chave ? cache.get(chave) ?? null : null;
  const [aberto, setAberto] = useState(false);
  const [levado, setLevado] = useState<"sim" | "nao" | null>(null);
  // D036: o recorte solar do bairro fica fora do bundle; falhar ao carregá-lo é dito, nunca vira "lados parecidos".
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    if (!predio || !chave || cache.has(chave)) return;
    let ativo = true;
    // Calcula depois de desenhar a tela (dezenas de milhares de raios no aparelho).
    const t = setTimeout(() => {
      void garantirCamadas(camadasDoSol(predio.bairro)).then(
        () => {
          if (!ativo) return;
          const entorno = carregarEntornoSolar(predio);
          const c = contrasteDasFachadas(entorno, andar);
          cache.set(chave, { c, hora: c.estado === "ok" && entorno ? horaDaVisita(entorno, c, hoje) : null });
          setVersao((v) => v + 1);
        },
        () => { if (ativo) setFalhou(true); },
      );
    }, 0);
    return () => { ativo = false; clearTimeout(t); };
  }, [predio, chave, andar, hoje, tentativa]);
  if (!predio) return null;
  const c = calculo?.c;
  if (c && c.estado !== "ok") return null;
  const frase = c ? fraseDoDestaque(c, calculo!.hora) : null;
  const pergunta = c ? perguntaParaVisita(c, calculo!.hora) : null;
  return (
    <View style={{ gap: ESPACO[2] }}>
      <Sobretitulo>O sol nas fachadas</Sobretitulo>
      <Titulo2>Qual lado do prédio pega sol.</Titulo2>
      {!c && falhou ? (
        <>
          <Texto role="alert" tipo="apoio">Não foi possível carregar os contornos do bairro para calcular o sol. Sem internet, só abrem os bairros já abertos neste aparelho.</Texto>
          <LinkComSeta rotulo="Tentar de novo" discreto seta={false} onPress={() => { setFalhou(false); setTentativa((n) => n + 1); }} />
        </>
      ) : !c ? (
        <Texto role="status" tipo="apoio" cor="cor-texto-apoio">Calculando o sol em cada lado do prédio…</Texto>
      ) : (
        <>
          <Corpo>{frase ?? "Os lados do prédio têm sol parecido ao longo do dia no cálculo; a diferença fica nas janelas de cada apartamento."}</Corpo>
          <LinkComSeta rotulo={aberto ? "Ocultar os lados" : "Ver cada lado"} discreto seta={false} onPress={() => setAberto((x) => !x)} />
          {aberto ? (
            <View style={{ gap: 6 }}>
              {linhasDosLados(c).map((l) => <Texto key={l} tipo="apoio" style={{ fontSize: 12, lineHeight: 18 }}>{l}</Texto>)}
              <Nota>{notaDoMetodo(c)}</Nota>
            </View>
          ) : null}
          {pergunta ? (
            levado === "sim" ? (
              <Texto role="status" tipo="apoio" cor="cor-texto-apoio">Levado para o roteiro da visita.</Texto>
            ) : (
              <LinkComSeta
                rotulo={levado === "nao" ? "Não coube no roteiro (limite de perguntas)" : "Levar para a visita"}
                acessivel="Levar a conferência do sol nas fachadas para o roteiro da visita"
                onPress={() => void aoLevarParaVisita(pergunta).then((ok) => setLevado(ok ? "sim" : "nao"))}
              />
            )
          ) : null}
        </>
      )}
    </View>
  );
}
