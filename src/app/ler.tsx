import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Linking, View } from "react-native";
import { Botao } from "../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../componentes/Cartao";
import { Icone } from "../componentes/Icone";
import { GaleriaDoAnuncio } from "../componentes/dossie/Galeria";
import { Cabecalho, Rolagem, Tela } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { Bloco } from "../componentes/Traco";
import { IDS_DOSSIES, dossieOuErro } from "../dados/dossies";
import { anuncioExemplo, eAnuncioExemplo } from "../dados/anuncioExemplo";
import { formatarData, formatarReais } from "../dados/formatos";
import { AVISO_LEITURA } from "../dados/textos";
import { useAparelho } from "../estado/Aparelho";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO } from "../tema/tokens";

const ETAPAS = ["Anúncio aberto", "Preço, área e quartos lidos", "Procurando o lote", "Lote encontrado"];

const SITUACOES = ["lendo", "nao-abriu", "nao-e-anuncio", "fora", "sem-conexao", "lote-nao-encontrado"] as const;
type Situacao = (typeof SITUACOES)[number];

const ETAPAS_FEITAS: Record<Situacao, number> = {
  lendo: 0,
  "nao-abriu": 0,
  "nao-e-anuncio": 1,
  fora: 2,
  "sem-conexao": 0,
  "lote-nao-encontrado": 3,
};

type Acao = "tentar" | "colar" | "marcar";

const MENSAGENS: Partial<Record<Situacao, [string, Acao[]]>> = {
  "nao-abriu": ["O anúncio não abriu. Tente de novo ou cole outro link.", ["tentar", "colar"]],
  "nao-e-anuncio": ["Este link não é de um anúncio de apartamento. Cole outro link.", ["colar"]],
  fora: [
    "Este anúncio fica em Areias. Por enquanto o Vereda cobre Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena.",
    ["colar"],
  ],
  "sem-conexao": ["Sem conexão. O dossiê abre quando a internet voltar.", ["tentar"]],
  "lote-nao-encontrado": ["Não achamos o lote deste endereço. Marque o prédio no mapa.", ["marcar"]],
};

function destinoDoLink(url: string): string {
  const texto = url.toLowerCase();
  return IDS_DOSSIES.find((id) => texto.includes(id)) ?? "boa-viagem";
}

function situacaoDoLink(url: string): Situacao {
  if (!url) return "lendo";
  if (!/^https?:\/\/\S+\.\S+/i.test(url)) return "nao-e-anuncio";
  if (/areias/i.test(url)) return "fora";
  return "lendo";
}

function eSituacao(valor: string | undefined): valor is Situacao {
  return SITUACOES.some((s) => s === valor);
}

export default function LendoOAnuncio() {
  const { cor } = useTema();
  const { url = "", estado } = useLocalSearchParams<{ url?: string; estado?: string }>();
  const { dados } = useAparelho();
  const exemplo = !estado && eAnuncioExemplo(url);
  const situacao: Situacao = eSituacao(estado) ? estado : situacaoDoLink(url);
  const idDestino = destinoDoLink(url);
  const [feitas, setFeitas] = useState(ETAPAS_FEITAS[situacao]);
  const terminou = situacao === "lendo" && feitas >= ETAPAS.length;
  const confirmado = dados.lotesConfirmados[idDestino] ?? dossieOuErro(idDestino).lote.confirmado;

  useEffect(() => {
    if (situacao !== "lendo" || exemplo) return;
    const relogio = setInterval(() => setFeitas((atual) => Math.min(atual + 1, ETAPAS.length)), 700);
    return () => clearInterval(relogio);
  }, [situacao, exemplo]);

  useEffect(() => {
    if (!terminou || exemplo) return;
    const saida = setTimeout(
      () =>
        router.replace(
          confirmado
            ? { pathname: "/dossie/[id]", params: { id: idDestino } }
            : { pathname: "/dossie/[id]/confirmar-lote", params: { id: idDestino } },
        ),
      600,
    );
    return () => clearTimeout(saida);
  }, [terminou, confirmado, idDestino, exemplo]);

  if (exemplo) return <PreviaDoAnuncio />;

  const mensagem = MENSAGENS[situacao];
  const botoes: Record<Acao, ReactNode> = {
    tentar: (
      <Botao
        key="tentar"
        rotulo="Tentar de novo"
        onPress={() => router.replace({ pathname: "/ler", params: { url, ...(estado ? { estado } : {}) } })}
      />
    ),
    colar: <Botao key="colar" rotulo="Colar outro link" variante="principal" onPress={() => router.dismissTo("/")} />,
    marcar: (
      <Botao
        key="marcar"
        rotulo="Marcar no mapa"
        variante="principal"
        onPress={() => router.replace({ pathname: "/dossie/[id]/confirmar-lote", params: { id: idDestino } })}
      />
    ),
  };

  return (
    <Tela>
      <Cabecalho titulo="Lendo o anúncio" pai="/" />
      <Rolagem>
        {situacao === "sem-conexao" || situacao === "nao-abriu" ? null : (
          <View
            aria-hidden
            style={{
              height: 240,
              marginHorizontal: ESPACO[3],
              marginBottom: ESPACO[3],
              borderRadius: RAIO.cartao,
              backgroundColor: cor("cor-superficie"),
              padding: ESPACO[4],
              gap: ESPACO[3],
              overflow: "hidden",
            }}
          >
            {[90, 60, 100, 100, 80, 40, 100, 70, 100, 55, 90, 100].map((largura, i) => (
              <Bloco key={i} largura={`${largura}%`} alto={i % 5 === 0} />
            ))}
          </View>
        )}
        <Cartao>
          <CorpoDoCartao>
            <View aria-live="polite">
              {ETAPAS.map((nome, i) => {
                const feita = i < feitas;
                return (
                  <View key={nome} style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3], minHeight: 40 }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: cor(feita ? "cor-texto" : "cor-traco"),
                        backgroundColor: feita ? cor("cor-texto") : undefined,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {feita ? <Icone nome="check" tamanho="p" cor="cor-fundo" /> : null}
                    </View>
                    <Texto cor={feita ? "cor-texto" : "cor-texto-apoio"}>{nome}</Texto>
                  </View>
                );
              })}
            </View>
            <Texto tipo="apoio" cor="cor-texto-apoio">
              {AVISO_LEITURA}
            </Texto>
          </CorpoDoCartao>
        </Cartao>
        {mensagem ? (
          <Cartao>
            <CorpoDoCartao>
              <Texto role="status">{mensagem[0]}</Texto>
              {mensagem[1].map((acao) => botoes[acao])}
            </CorpoDoCartao>
          </Cartao>
        ) : null}
      </Rolagem>
    </Tela>
  );
}

function PreviaDoAnuncio() {
  const { cor } = useTema();
  const anuncio = anuncioExemplo;
  const caracteristicas = [
    { icone: "ruler-2" as const, texto: `${anuncio.area} m²` },
    { icone: "bed" as const, texto: `${anuncio.quartos} quartos` },
    { icone: "bath" as const, texto: `${anuncio.banheiros} banheiro` },
    { icone: "car" as const, texto: `${anuncio.vagas} vaga` },
  ];
  return (
    <Tela>
      <Cabecalho titulo="Imóvel do anúncio" pai="/" />
      <Rolagem style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
        <GaleriaDoAnuncio titulo={anuncio.endereco} fotos={anuncio.fotos} />
        <Cartao>
          <CorpoDoCartao style={{ gap: ESPACO[4] }}>
            <View style={{ gap: ESPACO[2] }}>
              <Texto tipo="apoio" cor="cor-texto-apoio">{`${anuncio.bairro} · ${anuncio.cidade}, ${anuncio.uf}`}</Texto>
              <Texto tipo="titulo-tela" role="heading">{anuncio.endereco}</Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio">{anuncio.andar}</Texto>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO[3] }}>
              {caracteristicas.map((item) => (
                <View key={item.icone} style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[1] }}>
                  <Icone nome={item.icone} tamanho="p" />
                  <Texto>{item.texto}</Texto>
                </View>
              ))}
            </View>
            <View style={{ gap: ESPACO[1] }}>
              <Texto tipo="apoio" cor="cor-texto-apoio">Aluguel</Texto>
              <Texto tipo="numero">{`${formatarReais(anuncio.aluguel)}/mês`}</Texto>
            </View>
            <View style={{ gap: ESPACO[2], borderTopWidth: 0.5, borderTopColor: cor("cor-linha"), paddingTop: ESPACO[3] }}>
              {[
                { nome: "Condomínio", valor: anuncio.condominio },
                { nome: "IPTU no anúncio", valor: anuncio.iptu },
              ].map((custo) => (
                <View key={custo.nome} style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: ESPACO[2] }}>
                  <Texto cor="cor-texto-apoio">{custo.nome}</Texto>
                  <Texto>{formatarReais(custo.valor)}</Texto>
                </View>
              ))}
              <Texto tipo="apoio" cor="cor-texto-apoio">{`${anuncio.fonte} · Consulta em ${formatarData(anuncio.consultado_em)}`}</Texto>
            </View>
          </CorpoDoCartao>
        </Cartao>
        <Cartao nota>
          <CorpoDoCartao>
            <Texto tipo="secao" role="heading">O dossiê ainda não está disponível em São Paulo</Texto>
            <Texto cor="cor-texto-apoio">Por enquanto, analisamos imóveis em Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena, no Recife.</Texto>
            <Botao rotulo="Colar outro anúncio" variante="principal" onPress={() => router.dismissTo("/")} />
            <Botao rotulo="Ver anúncio original" icone="external-link" onPress={() => void Linking.openURL(anuncio.url)} />
          </CorpoDoCartao>
        </Cartao>
      </Rolagem>
    </Tela>
  );
}
