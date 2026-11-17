import { router, type Href } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Botao } from "../componentes/Botao";
import { Cartao, CorpoDoCartao, Divisor } from "../componentes/Cartao";
import { Alterna, Segmentado } from "../componentes/Controles";
import { Pressionavel } from "../componentes/Pressionavel";
import { Cabecalho, Rolagem, Tela, TituloDeGrupo } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { IDS_DOSSIES, dossieOuErro } from "../dados/dossies";
import { anuncioExemplo } from "../dados/anuncioExemplo";
import { useAparelho } from "../estado/Aparelho";
import { usePreferencias, type EstadoForcado, type PreferenciaDeTema } from "../estado/Preferencias";
import { ESPACO } from "../tema/tokens";

const TEMAS: { valor: PreferenciaDeTema; nome: string }[] = [
  { valor: "sistema", nome: "Sistema" },
  { valor: "claro", nome: "Claro" },
  { valor: "escuro", nome: "Escuro" },
];

const ESTADOS: { valor: EstadoForcado; nome: string }[] = [
  { valor: "padrao", nome: "Padrão" },
  { valor: "carregando", nome: "Carregando" },
  { valor: "contestado", nome: "Contestado" },
  { valor: "em_verificacao", nome: "Em verificação" },
];

const ESTADOS_DE_T2 = [
  { estado: "nao-abriu", nome: "não abriu" },
  { estado: "nao-e-anuncio", nome: "não é anúncio de apartamento" },
  { estado: "fora", nome: "fora dos bairros cobertos" },
  { estado: "sem-conexao", nome: "Sem conexão" },
  { estado: "lote-nao-encontrado", nome: "Lote não encontrado" },
];

function telas(id: string): { tela: string; nome: string; href: Href; final?: boolean }[] {
  const comparar = id === "espinheiro" ? "boa-viagem,espinheiro" : `${id},espinheiro`;
  const fato = id === "boa-viagem" ? "iptu_cobrado" : "dc_total";
  return [
    { tela: "T1", nome: "Meus dossiês", href: "/" },
    { tela: "T2", nome: "Lendo o anúncio", href: { pathname: "/ler", params: { url: `https://exemplo.test/${id}` } } },
    { tela: "T3", nome: "Confirmar o lote", href: { pathname: "/exemplos/[id]/confirmar-lote", params: { id } } },
    { tela: "T4", nome: "Dossiê", href: { pathname: "/exemplos/[id]", params: { id } } },
    { tela: "T5", nome: "Mapa", href: { pathname: "/exemplos/[id]/mapa", params: { id } } },
    { tela: "T6", nome: "Visita", href: { pathname: "/exemplos/[id]/visita", params: { id } } },
    { tela: "T7", nome: "Modo visita", href: { pathname: "/exemplos/[id]/visita/ao-vivo", params: { id } } },
    { tela: "T8", nome: "Caminhos diários", href: { pathname: "/exemplos/[id]/caminhos", params: { id } } },
    { tela: "T9", nome: "Comparar", href: { pathname: "/comparar", params: { ids: comparar } } },
    { tela: "T10", nome: "Ver fonte", href: { pathname: "/exemplos/[id]/fonte/[fato]", params: { id, fato } } },
    { tela: "T11", nome: "Isso está errado", href: { pathname: "/exemplos/[id]/contestar/[fato]", params: { id, fato } } },
    { tela: "T13", nome: "Linha do tempo do prédio", href: { pathname: "/exemplos/[id]/linha-do-tempo", params: { id } }, final: true },
    { tela: "T14", nome: "Dados do domicílio", href: { pathname: "/exemplos/[id]/domicilio", params: { id } }, final: true },
    { tela: "T15", nome: "Sobre os dados", href: "/sobre-os-dados" },
    { tela: "T16", nome: "Créditos", href: "/creditos" },
  ];
}

function LinkDeTela({ tela, nome, href, recuo = false }: { tela: string; nome: string; href: Href; recuo?: boolean }) {
  return (
    <Pressionavel
      role="link"
      onPress={() => router.push(href)}
      style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2], minHeight: 40, paddingLeft: recuo ? 36 : 0 }}
    >
      {tela ? (
        <Texto cor="cor-texto-apoio" style={{ minWidth: 28 }}>
          {tela}
        </Texto>
      ) : null}
      <Texto tipo={recuo ? "apoio" : "corpo"}>{nome}</Texto>
    </Pressionavel>
  );
}

export default function ControlesDoMock() {
  const preferencias = usePreferencias();
  const { restaurar } = useAparelho();
  const [id, setId] = useState<string>("boa-viagem");
  const lista = telas(id).filter((t) => preferencias.final || !t.final);

  return (
    <Tela>
      <Cabecalho titulo="Controles do mock" pai="/" />
      <Rolagem>
        <Cartao>
          <CorpoDoCartao>
            <Texto tipo="apoio" cor="cor-texto-apoio">
              Esta tela é do mock, não do app. Abre com um toque longo no logotipo.
            </Texto>
            <Segmentado rotulo="Tema" opcoes={TEMAS} valor={preferencias.tema} aoMudar={(tema) => preferencias.mudar({ tema })} />
            <Alterna rotulo="Mostrar o Final" ligado={preferencias.final} aoMudar={(final) => preferencias.mudar({ final })} />
            <View style={{ gap: ESPACO[2] }}>
              <Texto tipo="secao">Estado forçado</Texto>
              <Segmentado rotulo="Estado forçado" opcoes={ESTADOS.slice(0, 2)} valor={preferencias.forcado} aoMudar={preferencias.forcar} />
              <Segmentado rotulo="Estado forçado" opcoes={ESTADOS.slice(2)} valor={preferencias.forcado} aoMudar={preferencias.forcar} />
            </View>
            <Botao rotulo="Restaurar dados do aparelho" icone="trash" onPress={restaurar} />
          </CorpoDoCartao>
        </Cartao>
        <TituloDeGrupo>Dossiê</TituloDeGrupo>
        <Cartao>
          <CorpoDoCartao style={{ gap: 0 }}>
            {IDS_DOSSIES.map((d, i) => (
              <View key={d}>
                {i > 0 ? <Divisor /> : null}
                <Pressionavel
                  role="radio"
                  accessibilityState={{ checked: d === id }}
                  aria-checked={d === id}
                  onPress={() => setId(d)}
                  style={{ minHeight: 40, justifyContent: "center" }}
                >
                  <Texto tipo={d === id ? "secao" : "corpo"}>{dossieOuErro(d).bairro}</Texto>
                </Pressionavel>
              </View>
            ))}
          </CorpoDoCartao>
        </Cartao>
        <TituloDeGrupo>Telas</TituloDeGrupo>
        <Cartao>
          <CorpoDoCartao style={{ gap: 0 }}>
            {lista.map((t) => (
              <View key={t.tela}>
                <LinkDeTela tela={t.tela} nome={t.nome} href={t.href} />
                {t.tela === "T2"
                  ? ESTADOS_DE_T2.map((e) => (
                      <LinkDeTela
                        key={e.estado}
                        tela=""
                        nome={e.nome}
                        recuo
                        href={{ pathname: "/ler", params: { url: "", estado: e.estado } }}
                      />
                    ))
                  : null}
              </View>
            ))}
          </CorpoDoCartao>
        </Cartao>
        <TituloDeGrupo>Fotos do anúncio</TituloDeGrupo>
        <Cartao>
          <CorpoDoCartao>
            <Texto cor="cor-texto-apoio">Exemplo fornecido para a galeria. Brás, São Paulo, fora da cobertura do dossiê.</Texto>
            <Botao rotulo="Ver exemplo com fotos" icone="camera" onPress={() => router.push({ pathname: "/ler", params: { url: anuncioExemplo.url } })} />
          </CorpoDoCartao>
        </Cartao>
      </Rolagem>
    </Tela>
  );
}
