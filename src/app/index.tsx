import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Botao, LinkDeLinha } from "../componentes/Botao";
import { Cartao, CorpoDoCartao, IconeDeSecao } from "../componentes/Cartao";
import { SecaoLink } from "../componentes/fatos/Secao";
import { Icone } from "../componentes/Icone";
import type { NomeIcone } from "../componentes/icones";
import { CartaoDeCreditos, PilulaDeCredito } from "../componentes/inicio/Creditos";
import { KvMini, Logotipo } from "../componentes/Marca";
import { PoligonoMini } from "../componentes/mapa/PoligonoMini";
import { Pressionavel } from "../componentes/Pressionavel";
import { Cabecalho, Rolagem, Tela, TituloDeGrupo } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { enderecoDoDossie, fontesDoApp, tipoDoDossie } from "../dados/consultas";
import { IDS_DOSSIES, dossies, dossieOuErro } from "../dados/dossies";
import type { Dossie } from "../dados/esquema";
import { formatarData } from "../dados/formatos";
import { AVISO_LEITURA, BAIRROS_COBERTOS_TEXTO } from "../dados/textos";
import { useAparelho } from "../estado/Aparelho";
import { useLoteConfirmado } from "../estado/fatos";
import { useSessao } from "../estado/Sessao";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO, TIPOS } from "../tema/tokens";

const PASSOS: { icone: NomeIcone; texto: string }[] = [
  { icone: "link", texto: "Colar link" },
  { icone: "map-pin", texto: "Confirmar o lote" },
  { icone: "file-text", texto: "Dossiê" },
  { icone: "clipboard-check", texto: "Preparar visita" },
];

function abrirLink(url: string) {
  const limpo = url.trim();
  if (limpo) router.push({ pathname: "/ler", params: { url: limpo } });
}

function CartaoDeEntrada({ comparando }: { comparando: boolean }) {
  const { cor } = useTema();
  const [url, setUrl] = useState("");
  const campo = useRef<TextInput>(null);

  const colar = async () => {
    if (url.trim()) {
      abrirLink(url);
      return;
    }
    const texto = (await Clipboard.getStringAsync()).trim();
    if (texto) {
      setUrl(texto);
      abrirLink(texto);
    } else {
      campo.current?.focus();
    }
  };

  return (
    <Cartao>
      <CorpoDoCartao>
        <View style={{ flexDirection: "row", gap: ESPACO[3], alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: ESPACO[1] }}>
            <Texto tipo="titulo-tela" role="heading">
              O link do anúncio vira um dossiê de evidências.
            </Texto>
            <Texto cor="cor-texto-apoio">Recife, a partir de registros públicos.</Texto>
          </View>
          <KvMini />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: ESPACO[2],
            minHeight: 56,
            padding: 4,
            paddingLeft: ESPACO[4],
            backgroundColor: cor("cor-fundo"),
            borderWidth: 1,
            borderColor: cor("cor-linha"),
            borderRadius: RAIO.cartao,
          }}
        >
          <Icone nome="link" />
          <TextInput
            ref={campo}
            value={url}
            onChangeText={(novo) => {
              const colado = url === "" && /^https?:\/\/\S{6,}/i.test(novo.trim());
              setUrl(novo);
              if (colado) abrirLink(novo);
            }}
            onSubmitEditing={() => abrirLink(url)}
            placeholder="Cole o link do anúncio"
            placeholderTextColor={cor("cor-texto-apoio")}
            accessibilityLabel="Colar link"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            style={[TIPOS.corpo, { flex: 1, minHeight: 44, color: cor("cor-texto"), minWidth: 0 }]}
          />
          <Botao
            rotulo="Colar"
            icone="clipboard"
            tamanhoIcone="p"
            variante={comparando ? "secundario" : "principal"}
            onPress={() => void colar()}
            style={{ alignSelf: "center", minHeight: 46, borderRadius: 13 }}
          />
        </View>
        <View style={{ gap: ESPACO[2] }}>
          {[
            { icone: "shield-lock" as const, texto: AVISO_LEITURA },
            { icone: "map-pin" as const, texto: BAIRROS_COBERTOS_TEXTO },
          ].map((aviso) => (
            <View key={aviso.texto} style={{ flexDirection: "row", gap: ESPACO[2], alignItems: "flex-start" }}>
              <Icone nome={aviso.icone} tamanho="p" cor="cor-texto-apoio" />
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ flex: 1 }}>
                {aviso.texto}
              </Texto>
            </View>
          ))}
        </View>
      </CorpoDoCartao>
    </Cartao>
  );
}

function ItemDoDossie({ dossie, marcado, aoTocar, aoSegurar }: { dossie: Dossie; marcado: boolean; aoTocar: () => void; aoSegurar: () => void }) {
  const { cor } = useTema();
  const confirmado = useLoteConfirmado(dossie);
  const campos = dossie.anuncio.campos;
  const resumo = [campos.aluguel ?? campos.preco, campos.area]
    .filter((f) => f !== undefined)
    .map((f) => f.texto)
    .join(" · ");
  return (
    <Pressionavel
      role="button"
      accessibilityLabel={`${enderecoDoDossie(dossie)}, ${resumo}, ${tipoDoDossie(dossie)}, ${dossie.bairro}`}
      accessibilityState={{ selected: marcado }}
      onPress={aoTocar}
      onLongPress={aoSegurar}
      delayLongPress={500}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: ESPACO[3],
        minHeight: 72,
        paddingVertical: ESPACO[3],
        paddingHorizontal: ESPACO[4],
        backgroundColor: cor("cor-superficie"),
        borderRadius: RAIO.cartao,
      }}
    >
      <View
        style={{
          width: 56,
          height: 48,
          borderRadius: RAIO.icone,
          backgroundColor: cor("cor-fundo"),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PoligonoMini dossie={dossie} confirmado={confirmado} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Texto tipo="secao">{enderecoDoDossie(dossie)}</Texto>
        <Texto>{resumo}</Texto>
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: ESPACO[2] }}>
          <View
            style={{
              minHeight: 22,
              paddingHorizontal: 8,
              borderRadius: RAIO.pilula,
              backgroundColor: cor("cor-fundo"),
              justifyContent: "center",
            }}
          >
            <Texto tipo="etiqueta" cor="cor-texto-apoio">
              {tipoDoDossie(dossie)}
            </Texto>
          </View>
          <Texto tipo="apoio" cor="cor-texto-apoio">
            {`${dossie.bairro} · ${formatarData(dossie.gerado_em)}`}
          </Texto>
        </View>
      </View>
      <View style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}>
        {marcado ? <Icone nome="check" /> : <Icone nome="chevron-right" tamanho="p" />}
      </View>
      {marcado ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: RAIO.cartao,
            borderWidth: 2,
            borderColor: cor("cor-texto"),
          }}
        />
      ) : null}
    </Pressionavel>
  );
}

export default function MeusDossies() {
  const { cor } = useTema();
  const { dados } = useAparelho();
  const { selecao, selecionando, mudar } = useSessao();
  const lista = dados.apagado ? [] : IDS_DOSSIES.map((id) => dossieOuErro(id));
  const emSelecao = selecionando || selecao.length > 0;
  const comparando = selecao.length >= 2 && selecao.length <= 3;
  const fontes = fontesDoApp(dossies.values())
    .map((f) => f.base)
    .join(", ");

  const alternar = (id: string) =>
    mudar((atual) => {
      if (atual.selecao.includes(id)) return { selecao: atual.selecao.filter((x) => x !== id) };
      if (atual.selecao.length < 3) return { selecao: [...atual.selecao, id] };
      return {};
    });

  return (
    <Tela>
      <Cabecalho
        esquerda={
          <Pressable
            accessibilityRole="header"
            onLongPress={() => router.push("/mock")}
            delayLongPress={800}
            style={{ flex: 1, paddingLeft: ESPACO[3] }}
          >
            <Logotipo />
          </Pressable>
        }
        direita={<PilulaDeCredito />}
      />
      <Rolagem>
        <CartaoDeEntrada comparando={comparando} />
        <CartaoDeCreditos />
        <TituloDeGrupo
          direita={
            lista.length ? (
              <LinkDeLinha
                rotulo={emSelecao ? "Cancelar" : "Selecionar"}
                tipo="apoio"
                altura={32}
                onPress={() => mudar(() => ({ selecionando: !emSelecao, selecao: [] }))}
              />
            ) : undefined
          }
        >
          Meus dossiês
        </TituloDeGrupo>
        {lista.length ? (
          <>
            <View style={{ gap: ESPACO[2], paddingHorizontal: ESPACO[3] }}>
              {lista.map((d) => (
                <ItemDoDossie
                  key={d.id}
                  dossie={d}
                  marcado={selecao.includes(d.id)}
                  aoTocar={() => (emSelecao ? alternar(d.id) : router.push({ pathname: "/dossie/[id]", params: { id: d.id } }))}
                  aoSegurar={() => alternar(d.id)}
                />
              ))}
            </View>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ paddingTop: ESPACO[3], paddingHorizontal: ESPACO[4] }}>
              {emSelecao ? "Toque para selecionar 2 ou 3 e comparar." : "Toque e segure para selecionar e comparar."}
            </Texto>
          </>
        ) : (
          <Texto cor="cor-texto-apoio" style={{ paddingHorizontal: ESPACO[4] }}>
            Nenhum dossiê ainda. Compartilhe um anúncio de apartamento com o Vereda ou cole o link acima.
          </Texto>
        )}
        <Cartao style={{ marginTop: ESPACO[5] }}>
          <View style={{ flexDirection: "row", gap: ESPACO[2], paddingVertical: ESPACO[4], paddingHorizontal: ESPACO[3] }}>
            {PASSOS.map((p) => (
              <View key={p.texto} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <IconeDeSecao nome={p.icone} />
                <Texto tipo="apoio" style={{ textAlign: "center" }}>
                  {p.texto}
                </Texto>
              </View>
            ))}
          </View>
        </Cartao>
        <SecaoLink
          titulo="Sobre os dados"
          fase="prototipo"
          icone="info-circle"
          resumo={fontes}
          onPress={() => router.push("/sobre-os-dados")}
        />
      </Rolagem>
      {comparando ? (
        <View style={{ padding: ESPACO[3], backgroundColor: cor("cor-fundo") }}>
          <Botao
            rotulo={`Comparar ${selecao.length}`}
            variante="principal"
            onPress={() => router.push({ pathname: "/comparar", params: { ids: selecao.join(",") } })}
          />
        </View>
      ) : null}
    </Tela>
  );
}
