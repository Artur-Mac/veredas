import { useEffect, useRef, useState } from "react";
import { escolherImagemOcr, extrairImagemLocal } from "../../plataforma/ocr.web";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CampoLocal, GrupoLocal } from "../caderno/blocos";
export function LeituraDeImagem({ aoRevisar, contexto = "anuncio" }: { aoRevisar: (texto: string) => void; contexto?: "anuncio" | "documento" }) {
  const [texto, setTexto] = useState(""); const [aviso, setAviso] = useState(""); const [ocupado, setOcupado] = useState(false); const [progresso, setProgresso] = useState(0);
  const controle = useRef<AbortController | null>(null);
  useEffect(() => () => controle.current?.abort(), []);
  const ler = async () => {
    if (controle.current) return;
    const c = new AbortController(); controle.current = c; setOcupado(true);
    try {
      const f = await escolherImagemOcr(); if (!f) return;
      setAviso("Lendo apenas neste navegador…"); setTexto(""); setProgresso(0);
      const resultado = await extrairImagemLocal(f, c.signal, setProgresso);
      if (!c.signal.aborted) { setTexto(resultado); setAviso("Texto extraído. Confira valores, sinais, unidades e trechos antes de usar."); }
    } catch (e) { setAviso(e instanceof Error ? e.message : "Não foi possível ler. Continue manualmente."); }
    finally { controle.current = null; setOcupado(false); }
  };
  return <GrupoLocal titulo={contexto === "documento" ? "Ler imagem de uma página do documento" : "Ler uma imagem do anúncio"} apoio="PNG, JPEG ou WebP de até 10 MB. OCR local em português; a imagem não é enviada a terceiros nem guardada no caderno. PDF não é processado diretamente: escolha a imagem de uma página e informe a referência ao registrar o trecho.">
    <Botao rotulo="Escolher imagem para leitura local" desativado={ocupado} onPress={() => void ler()} />
    {ocupado ? <><Texto>Leitura em andamento · {Math.round(progresso * 100)}% do processamento, não da certeza do texto.</Texto><Botao rotulo="Cancelar leitura da imagem" onPress={() => controle.current?.abort()} /></> : null}
    {texto ? <><CampoLocal rotulo="Texto extraído da imagem, para revisão" multiline value={texto} onChangeText={setTexto} maxLength={200000} />
      <Botao rotulo="Usar texto extraído na revisão" desativado={ocupado} onPress={() => aoRevisar(texto)} /></> : null}
    {aviso ? <Texto role="status">{aviso}</Texto> : null}
  </GrupoLocal>;
}
