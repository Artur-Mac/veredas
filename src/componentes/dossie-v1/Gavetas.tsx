import { useMemo } from "react";
import { Linking, View } from "react-native";
import type { AnaliseV2, Edificio, Fato, MetaDoIndice, Pergunta, VisaoDoDossie } from "../../dados/contratos";
import { tituloDaAnomalia } from "../../dados/anomalias";
import { META } from "../../dados/recife/indice";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Gaveta } from "../casca/Gaveta";
import type { PedidoDeFonte } from "../fonte/GavetaDeFonte";
import { RastroDeConfianca } from "../fonte/RastroDeConfianca";
import { dataDaFonte, descreverFonte, nomeCurtoDaFonte, rotuloDaConfianca } from "../fonte/textos";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { Corpo, LinhaTocavel, Nota, Seta } from "./base";
import { LegendaDoMapa, LinhaDeObraNumerada, MapaDoLote } from "./MapaDoLote";
import {
  anomaliaResolvida,
  linhasDeDeclarados,
  linhasDeObras,
  porQueAparece,
  rotuloDaOrigem,
  urlDoAnuncio,
} from "./textos";

// Gavetas do dossiê. Todas usam `Gaveta` (casca/Gaveta.tsx): alça, Esc e arraste fecham; o conteúdo rola.

const CORPO_DA_GAVETA = { gap: ESPACO[3], paddingTop: ESPACO[3] } as const;

function LinhaDeValor({ rotulo, valor, apoio, aConfirmar = false }: { rotulo: string; valor: string; apoio?: string | null; aConfirmar?: boolean }) {
  const { cor } = useTema();
  return (
    <View
      accessible
      accessibilityLabel={`${rotulo}: ${valor}${apoio ? `, ${apoio}` : ""}${aConfirmar ? ", a confirmar" : ""}`}
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 9,
        borderBottomWidth: 0.5,
        borderBottomColor: cor("cor-linha"),
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Texto tipo="corpo" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
          {rotulo}
        </Texto>
        {apoio ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15, marginTop: 1 }}>
            {apoio}
          </Texto>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", flexShrink: 1 }}>
        <Texto tipo="corpo" style={{ fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "right", fontVariant: ["tabular-nums"] }}>
          {valor}
        </Texto>
        {aConfirmar ? (
          <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 11, lineHeight: 15 }}>
            A confirmar
          </Texto>
        ) : null}
      </View>
    </View>
  );
}

// ——— Dados do anúncio ——————————————————————————————————————————————————————————————

type PropsDoAnuncio = { visivel: boolean; aoFechar: () => void; analise: AnaliseV2 };

/** "Dados do anúncio": os valores declarados, de onde veio cada um, as anomalias lidas e o link original. */
export function GavetaDoAnuncio({ visivel, aoFechar, analise }: PropsDoAnuncio) {
  const linhas = useMemo(() => linhasDeDeclarados(analise), [analise]);
  const anomalias = analise.extracao?.anomalias ?? [];
  const url = urlDoAnuncio(analise);
  if (!visivel) return null;
  return (
    <Gaveta visivel titulo="Dados do anúncio" subtitulo="O que o anúncio informa e o que você corrigiu" aoFechar={aoFechar}>
      <View style={CORPO_DA_GAVETA}>
        <View>
          {linhas.map((l) => (
            <LinhaDeValor
              key={l.id}
              rotulo={l.rotulo}
              valor={l.valor}
              apoio={l.origem ? `Origem: ${rotuloDaOrigem(l.origem)}` : null}
              aConfirmar={l.aConfirmar}
            />
          ))}
        </View>
        {anomalias.length > 0 ? (
          <View style={{ gap: ESPACO[2] }}>
            <Texto tipo="secao" role="heading" style={{ fontWeight: "600" }}>
              O que a leitura do anúncio apontou
            </Texto>
            {anomalias.map((a, i) => {
              const resolvida = anomaliaResolvida(analise, a);
              return (
                <View key={`${a.campo}-${a.tipo}-${i}`} accessible accessibilityLabel={`${tituloDaAnomalia(a)}. ${a.mensagem}${resolvida ? " Corrigido por você." : ""}`} style={{ gap: 2 }}>
                  <Texto tipo="corpo" cor={resolvida ? "cor-texto-apoio" : "cor-barro-texto"} style={{ fontSize: 13, lineHeight: 19, fontWeight: "600" }}>
                    {tituloDaAnomalia(a)}
                  </Texto>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
                    {resolvida ? `${a.mensagem} Você já corrigiu este valor.` : a.mensagem}
                  </Texto>
                </View>
              );
            })}
          </View>
        ) : null}
        <RastroDeConfianca confianca="declarado" fonte="anuncio" />
        {url ? (
          <Botao
            rotulo="Abrir o anúncio original"
            variante="secundario"
            icone="external-link"
            tamanhoIcone="p"
            onPress={() => {
              void Linking.openURL(url).catch(() => undefined);
            }}
          />
        ) : (
          <Nota>Esta análise não tem link de anúncio.</Nota>
        )}
      </View>
    </Gaveta>
  );
}

// ——— Cadastro oficial ————————————————————————————————————————————————————————————

type PropsDoCadastro = { visivel: boolean; aoFechar: () => void; visao: VisaoDoDossie; aoAbrirFonte: (pedido: PedidoDeFonte) => void };

function lerMeta(): Pick<MetaDoIndice, "fontes"> | null {
  try {
    return { fontes: META.fontes };
  } catch {
    return null;
  }
}

/** Um fato com base conhecida abre a gaveta de fonte; "A confirmar" não tem fonte a mostrar. */
function pedidoDoFato(f: Fato): PedidoDeFonte | null {
  if (f.fonte === null || f.confianca === "nao_sabemos") return null;
  return { fonte: f.fonte, confianca: f.confianca, dado: { rotulo: f.rotulo, valor: f.valor } };
}

/**
 * "Cadastro oficial": cada `Fato` do prédio com a base de onde veio, quando foi consultada e a confiança. Tocar num fato
 * com fonte abre a gaveta de fonte, como na aba Edifício.
 */
export function GavetaDoCadastro({ visivel, aoFechar, visao, aoAbrirFonte }: PropsDoCadastro) {
  const { cor } = useTema();
  const meta = useMemo(() => (visivel ? lerMeta() : null), [visivel]);
  if (!visivel) return null;
  return (
    <Gaveta visivel titulo="Cadastro oficial" subtitulo="Prefeitura do Recife · Open Database License (ODbL)" aoFechar={aoFechar}>
      <View style={CORPO_DA_GAVETA}>
        <Corpo estilo={{ fontSize: 13, lineHeight: 19 }}>
          Dados do prédio no cadastro da Prefeitura. Cada linha mostra a base de onde veio e a confiança do dado.
        </Corpo>
        <View>
          {visao.cadastro.map((f) => {
            const fonte = f.fonte;
            const base = fonte && fonte !== "anuncio" && fonte !== "voce" && meta ? descreverFonte(fonte, meta) : null;
            const consulta = base?.tipo === "base" ? `Consultada em ${base.consultadoEm}` : null;
            const pedido = pedidoDoFato(f);
            const rotulo = `${f.rotulo}: ${f.valor}. ${rotuloDaConfianca(f.confianca, fonte)}${fonte ? `, ${nomeCurtoDaFonte(fonte)}` : ""}.`;
            const linha = (
              <>
                <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <Texto tipo="corpo" cor="cor-texto-apoio" style={{ flex: 1, fontSize: 12, lineHeight: 17 }}>
                    {f.rotulo}
                  </Texto>
                  <Texto tipo="corpo" style={{ flexShrink: 1, fontSize: 13, lineHeight: 19, fontWeight: "600", textAlign: "right", fontVariant: ["tabular-nums"] }}>
                    {f.valor}
                  </Texto>
                  {pedido ? <Seta tamanho={12} cor="cor-texto-apoio" /> : null}
                </View>
                <RastroDeConfianca
                  confianca={f.confianca}
                  fonte={fonte}
                  texto={`${rotuloDaConfianca(f.confianca, fonte)}${fonte ? ` · ${nomeCurtoDaFonte(fonte)}` : ""}${consulta ? ` · ${consulta.toLowerCase()}` : ""}`}
                />
                {f.detalhe ? <Nota>{f.detalhe}</Nota> : null}
              </>
            );
            const estilo = { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: cor("cor-linha"), gap: 4 } as const;
            return pedido ? (
              <Pressionavel
                key={f.id}
                onPress={() => aoAbrirFonte(pedido)}
                accessibilityRole="button"
                accessibilityLabel={`${rotulo} Ver fonte.`}
                style={[estilo, { minHeight: 48, justifyContent: "center" }]}
              >
                {linha}
              </Pressionavel>
            ) : (
              <View key={f.id} accessible accessibilityLabel={rotulo} style={estilo}>
                {linha}
              </View>
            );
          })}
        </View>
        {meta ? (
          <Nota>Bases lidas em {dataDaFonte(META.geradoEm)}. Toque em um dado para ver o recorte e as colunas usadas.</Nota>
        ) : null}
      </View>
    </Gaveta>
  );
}

// ——— Mapa ————————————————————————————————————————————————————————————————————————

type PropsDoMapa = {
  visivel: boolean;
  aoFechar: () => void;
  predio: Edificio | null;
  visao: VisaoDoDossie;
  vizinhos: readonly Edificio[];
};

/** "Abrir mapa": o lote do prédio e as obras recentes como pontos numerados, com a lista ao lado. */
export function GavetaDoMapa({ visivel, aoFechar, predio, visao, vizinhos }: PropsDoMapa) {
  const obras = visao.obras?.recentes ?? [];
  const linhas = useMemo(() => linhasDeObras(visao.obras), [visao.obras]);
  if (!visivel) return null;
  return (
    <Gaveta visivel titulo="Mapa do lote" subtitulo={visao.endereco ?? visao.subtitulo} aoFechar={aoFechar}>
      <View style={CORPO_DA_GAVETA}>
        {predio ? (
          <>
            <MapaDoLote predio={predio} obras={obras} vizinhos={vizinhos} />
            <LegendaDoMapa categorias={obras.map((o) => o.categoria)} />
            {linhas.length > 0 ? (
              <View>
                {linhas.map((l) => (
                  <LinhaDeObraNumerada key={l.numero} numero={l.numero} categoria={l.categoria} titulo={l.titulo} detalhe={l.detalhe} rotulo={l.rotuloAcessivel} />
                ))}
              </View>
            ) : (
              <Corpo estilo={{ fontSize: 13, lineHeight: 19 }}>
                Nenhuma licença de construção, acréscimo ou demolição a até 150 m nos últimos 24 meses.
              </Corpo>
            )}
            <Nota>
              Cada ponto é onde a Prefeitura registrou a licença; sem coordenada publicada, vale o centro do lote. O contorno do prédio vem da base de Lotes.
            </Nota>
          </>
        ) : (
          <Corpo>Confirme o prédio para ver o lote e as obras próximas no mapa.</Corpo>
        )}
      </View>
    </Gaveta>
  );
}

// ——— Verificações ————————————————————————————————————————————————————————————————

type PropsDoRoteiro = {
  visivel: boolean;
  aoFechar: () => void;
  perguntas: Pergunta[];
  aoAbrirPergunta: (p: Pergunta) => void;
  aoPrepararVisita: () => void;
};

/** "Seu roteiro de verificação" (`openDossierAllChecks`): todas as perguntas, na ordem da prioridade escolhida. */
export function GavetaDoRoteiro({ visivel, aoFechar, perguntas, aoAbrirPergunta, aoPrepararVisita }: PropsDoRoteiro) {
  const { cor } = useTema();
  if (!visivel) return null;
  return (
    <Gaveta visivel titulo="Seu roteiro de verificação" subtitulo={`${perguntas.length} ${perguntas.length === 1 ? "pergunta" : "perguntas"} para a visita`} aoFechar={aoFechar}>
      <View style={CORPO_DA_GAVETA}>
        <View>
          {perguntas.map((p, i) => (
            <View key={p.id} style={{ borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: cor("cor-linha") }}>
              <LinhaTocavel onPress={() => aoAbrirPergunta(p)} acessivel={`${p.titulo}. ${p.pista}`} minimo={58} estilo={{ paddingVertical: 12 }}>
                <Texto tipo="corpo" style={{ fontSize: 16, lineHeight: 22, fontWeight: "600" }}>
                  {p.titulo}
                </Texto>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17, marginTop: 3 }}>
                  {p.pista}
                </Texto>
              </LinhaTocavel>
            </View>
          ))}
        </View>
        <Botao rotulo="Preparar visita" variante="principal" seta onPress={aoPrepararVisita} />
      </View>
    </Gaveta>
  );
}

type PropsDaPergunta = {
  visivel: boolean;
  aoFechar: () => void;
  pergunta: Pergunta | null;
  aoLevarParaVisita: () => void;
};

/** Uma verificação: por que aparece, a frase que vai na mensagem ao corretor e o atalho para a visita. */
export function GavetaDaPergunta({ visivel, aoFechar, pergunta, aoLevarParaVisita }: PropsDaPergunta) {
  const { cor } = useTema();
  if (!visivel || !pergunta) return null;
  return (
    <Gaveta visivel titulo={pergunta.titulo} subtitulo={pergunta.pista} aoFechar={aoFechar}>
      <View style={CORPO_DA_GAVETA}>
        <Corpo estilo={{ fontSize: 13, lineHeight: 19 }}>{porQueAparece(pergunta.origem)}</Corpo>
        <View
          style={{
            gap: 4,
            padding: ESPACO[3],
            borderRadius: RAIO.icone,
            backgroundColor: cor("cor-creme"),
            borderWidth: 1,
            borderColor: cor("cor-linha"),
          }}
        >
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 15 }}>
            Pergunta para o corretor
          </Texto>
          <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 21 }}>
            {pergunta.textoParaMensagem}
          </Texto>
        </View>
        <Botao rotulo="Levar para a visita" variante="principal" seta onPress={aoLevarParaVisita} />
      </View>
    </Gaveta>
  );
}
