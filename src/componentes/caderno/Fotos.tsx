import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Image, Platform, View } from "react-native";
import type { Caderno } from "../../dados/caderno";
import { abrirFoto, guardarFoto, liberarFoto } from "../../plataforma/midia";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { GrupoLocal } from "./blocos";
import { moverFoto, retirarFoto } from "../../dados/galeria";

function FotoGuardada({ chave }: { chave: string }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let ativa = true;
    let carregada: string | null = null;
    void abrirFoto(chave).then(v => { carregada = v; if (ativa) setUri(v); else if (v) liberarFoto(v); }).catch(() => undefined);
    return () => { ativa = false; if (carregada) liberarFoto(carregada); };
  }, [chave]);
  return uri ? <Image source={{ uri }} accessibilityLabel="Foto própria do imóvel" style={{ width: "100%", height: 200, borderRadius: 10 }} resizeMode="contain" /> : <Texto tipo="apoio">Foto não encontrada neste aparelho. A referência foi preservada.</Texto>;
}
export function FotosPessoais({ caderno, salvar }: { caderno: Caderno; salvar: (mudar: (c: Caderno) => Caderno) => Promise<boolean> }) {
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [retirando, setRetirando] = useState<string | null>(null);
  const trava = useRef(false);
  const adicionar = async () => {
    if (trava.current) return;
    trava.current = true; setOcupado(true);
    try {
      if ((caderno.fotos?.length ?? 0) >= 5) throw new Error("Limite de cinco fotos por análise.");
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6, exif: false, allowsMultipleSelection: false });
      if (r.canceled || !r.assets[0]) return;
      const imagem = r.assets[0];
      const id = `foto-${Date.now().toString(36)}`;
      if (Platform.OS !== "web" && imagem.mimeType && !["image/png", "image/jpeg"].includes(imagem.mimeType)) throw new Error("Escolha uma foto JPEG ou PNG.");
      const chave = `${id}.${Platform.OS !== "web" && imagem.mimeType === "image/png" ? "png" : "jpg"}`;
      const bytes = await guardarFoto(imagem.uri, chave);
      const ok = await salvar(c => ({ ...c, fotos: [...(c.fotos ?? []), { id, chave, bytes, em: new Date().toISOString() }] }));
      setAviso(ok ? "Foto guardada neste aparelho. Não está incluída no backup de texto." : "Foto copiada, mas não foi possível salvar sua referência. Tente novamente.");
    } catch (e) { setAviso(e instanceof Error ? e.message : "Não foi possível guardar a foto."); }
    finally { trava.current = false; setOcupado(false); }
  };
  return <GrupoLocal titulo={`Fotos próprias (${caderno.fotos?.length ?? 0}/5)`} apoio="Fotos privadas neste aparelho. O backup de texto não inclui os arquivos.">
    <Botao rotulo="Escolher uma foto própria" onPress={() => void adicionar()} desativado={ocupado} />
    {(caderno.fotos ?? []).map((f, i) => <View key={f.id} style={{ gap: 6 }}>
      <Texto tipo="apoio">{i === 0 ? "Capa" : `Foto ${i + 1}`}</Texto><FotoGuardada chave={f.chave} />
      {i > 0 ? <><Botao rotulo="Usar como capa" acessivel={`Usar foto ${i + 1} como capa`} onPress={() => { void salvar(c => moverFoto(c, f.id, "capa")); }} />
        <Botao rotulo="Mover antes" acessivel={`Mover foto ${i + 1} antes`} onPress={() => { void salvar(c => moverFoto(c, f.id, "antes")); }} /></> : null}
      {i < (caderno.fotos?.length ?? 0) - 1 ? <Botao rotulo="Mover depois" acessivel={`Mover foto ${i + 1} depois`} onPress={() => { void salvar(c => moverFoto(c, f.id, "depois")); }} /> : null}
      <Botao rotulo="Retirar desta análise" acessivel={`Retirar foto ${i + 1} desta análise`} onPress={() => setRetirando(f.id)} />
      {retirando === f.id ? <><Texto>Retirar esta foto da análise? Arquivos e referências em outras cópias ficam preservados. A limpeza completa de arquivos ocorre em Apagar meus dados.</Texto>
        <Botao rotulo="Confirmar retirada da foto" onPress={() => { void salvar(c => retirarFoto(c, f.id)).then(ok => { if (ok) setRetirando(null); }); }} />
        <Botao rotulo="Manter foto" onPress={() => setRetirando(null)} /></> : null}
    </View>)}
    {aviso ? <Texto role="status">{aviso}</Texto> : null}
  </GrupoLocal>;
}
