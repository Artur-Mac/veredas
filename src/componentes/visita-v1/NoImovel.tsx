// "No imóvel": o painel escuro de campo (`.field-dark-panel` e `.field-dark-row`, index.html 2625–2642) com
// cronômetro, roteiro conferível, "Sinta o espaço" (luz e ruído) e impressões. Sob `TemaEscuro`, todas as peças
// leem os tokens escuros; o fundo é `cor-campo` e o texto, `cor-texto-campo`.
import { useState, type ReactNode } from "react";
import { router } from "expo-router";
import { View } from "react-native";
import type { Edificio, Pergunta, Visita } from "../../dados/contratos";
import { derivarGuiaDeEstrutura } from "../../dados/dossie/guiaEstrutura";
import { useTema } from "../../tema/Tema";
import { ESPACO, RAIO, TOQUE_MINIMO, comAlfa } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { BarraDeProgresso, CampoDeTexto, Chamada, LinkDeAcao, TituloDeSecao } from "./blocos";
import { LinhaDePergunta } from "./LinhaDePergunta";
import { MedidorDeRuido } from "./MedidorDeRuido";
import { OPCOES_DE_RUIDO, MAX_NOTAS, formatarCronometro } from "./logica";
import type { ControleDaVisita } from "./useVisita";

function Faixa({ children, ultima = false }: { children: ReactNode; ultima?: boolean }) {
  const { cor } = useTema();
  return (
    <View
      style={{
        paddingVertical: ESPACO[3],
        borderBottomWidth: ultima ? 0 : 1,
        borderBottomColor: cor("cor-linha"),
      }}
    >
      {children}
    </View>
  );
}

function Cronometro({ controle }: { controle: ControleDaVisita }) {
  const { rodando, segundos } = controle;
  const estado = rodando ? "Visita em andamento" : segundos > 0 ? "Visita pausada" : "Pronto para começar";
  const rotulo = rodando ? "Pausar" : segundos > 0 ? "Retomar" : "Começar";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: ESPACO[4] }}>
      <View style={{ flexShrink: 1 }}>
        <Texto
          tipo="numero"
          cor="cor-texto"
          accessibilityRole="timer"
          accessibilityLabel={`Tempo da visita ${formatarCronometro(segundos)}`}
          style={{ fontSize: 32, lineHeight: 38, letterSpacing: -1.3 }}
        >
          {formatarCronometro(segundos)}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, marginTop: 4 }}>
          {estado}
        </Texto>
      </View>
      <Botao
        rotulo={rotulo}
        variante="secundario"
        pilula
        icone={rodando ? "player-pause" : "player-play"}
        tamanhoIcone="p"
        onPress={controle.alternarCronometro}
      />
    </View>
  );
}

/** Ruído em três opções: percepção da pessoa, sem decibéis. Tocar de novo na escolhida limpa o registro. */
function RuidoDeFora({ ruido, aoEscolher, aoGuardarMedida }: { ruido: Visita["ruido"]; aoEscolher: (ruido: Visita["ruido"]) => void; aoGuardarMedida?: (texto: string) => void }) {
  const { cor } = useTema();
  return (
    <View style={{ gap: ESPACO[3] }}>
      <View>
        <Texto style={{ fontSize: 16, lineHeight: 23, fontWeight: "600", letterSpacing: -0.4 }}>Ruído de fora</Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 17, marginTop: 5 }}>
          Compare com a janela aberta e fechada. Os botões guardam a sua percepção; a medida pelo microfone, abaixo, é opcional e só compara aberta × fechada.
        </Texto>
      </View>
      <View role="group" accessibilityLabel="Ruído percebido" style={{ flexDirection: "row", gap: ESPACO[2] }}>
        {OPCOES_DE_RUIDO.map((opcao) => {
          const escolhida = ruido === opcao.valor;
          return (
            <Pressionavel
              key={opcao.valor}
              accessibilityRole="button"
              accessibilityLabel={opcao.nome}
              accessibilityState={{ selected: escolhida }}
              aria-pressed={escolhida}
              onPress={() => aoEscolher(escolhida ? null : opcao.valor)}
              style={{
                flex: 1,
                minHeight: TOQUE_MINIMO,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: RAIO.icone,
                borderWidth: 1,
                borderColor: escolhida ? cor("cor-acao") : cor("cor-linha-forte"),
                backgroundColor: escolhida ? cor("cor-acao") : undefined,
              }}
            >
              <Texto tipo="etiqueta" cor={escolhida ? "cor-sobre-acao" : "cor-texto"} style={{ fontWeight: escolhida ? "700" : "500" }} numberOfLines={1}>
                {opcao.nome}
              </Texto>
            </Pressionavel>
          );
        })}
      </View>
      <MedidorDeRuido aoGuardar={aoGuardarMedida} />
    </View>
  );
}

type PropsDoPainel = {
  analiseId?: string;
  perguntas: Pergunta[];
  controle: ControleDaVisita;
  aoAbrirPergunta: (id: string) => void;
  aoAdicionarPergunta: () => void;
  predio?: Edificio | null;
  vizinhos?: readonly Edificio[];
  andar?: number | null;
};

type ComodoFiltro = "todos" | "janelas" | "hidraulica" | "predio";

const COMODOS: readonly { id: ComodoFiltro; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "janelas", rotulo: "Sol & Janelas" },
  { id: "hidraulica", rotulo: "Água & Cheiro" },
  { id: "predio", rotulo: "Prédio & Atas" },
];

function casaComodo(p: Pergunta, comodo: ComodoFiltro): boolean {
  if (comodo === "todos") return true;
  const texto = `${p.titulo} ${p.pista} ${p.textoParaMensagem}`.toLowerCase();
  if (comodo === "janelas") return /sol|janela|barulho|ru[ií]do|vento|calor|varanda/.test(texto);
  if (comodo === "hidraulica") return /infiltr|mofo|[aá]gua|press[aã]o|vazamento|umidade|banheiro|ralo/.test(texto);
  return /ata|cota|condom[ií]nio|elevador|garagem|portaria|fachada|reforma|taxa|marinha|iptu/.test(texto);
}

function Painel({ perguntas, controle, aoAbrirPergunta, aoAdicionarPergunta, predio = null, analiseId }: PropsDoPainel) {
  const { cor } = useTema();
  const [comodo, setComodo] = useState<ComodoFiltro>("todos");
  const { visita } = controle;
  if (!visita) return null;
  const conferidas = perguntas.filter((p) => visita.verificadas.includes(p.id)).length;
  const guiaEstrutura = derivarGuiaDeEstrutura(predio);
  const visiveis = perguntas.filter((p) => casaComodo(p, comodo));
  const perguntasExibidas = visiveis.length > 0 ? visiveis : perguntas;
  return (
    <View
      testID="painel-visita-editorial"
      style={{
        backgroundColor: cor("cor-superficie"),
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: cor("cor-linha-forte"),
        boxShadow: `0 6px 20px -8px ${comAlfa(cor("cor-texto"), 0.12)}`,
      }}
    >
      <Faixa>
        <Cronometro controle={controle} />
      </Faixa>

      <Faixa>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: ESPACO[3] }}>
          <TituloDeSecao>Seu roteiro</TituloDeSecao>
          <Texto tipo="apoio" cor="cor-texto-apoio" accessibilityLabel={`${conferidas} de ${perguntas.length} conferidas`}>
            {`${conferidas} de ${perguntas.length}`}
          </Texto>
        </View>
        <BarraDeProgresso feitas={conferidas} total={perguntas.length} rotulo="Perguntas conferidas" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10, marginBottom: 6 }}>
          {COMODOS.map((c) => {
            const ativo = comodo === c.id;
            return (
              <Pressionavel
                key={c.id}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                onPress={() => setComodo(c.id)}
                style={{
                  minHeight: TOQUE_MINIMO,
                  paddingHorizontal: 11,
                  borderRadius: RAIO.pilula,
                  borderWidth: 1,
                  borderColor: ativo ? cor("cor-acao") : cor("cor-linha-forte"),
                  backgroundColor: ativo ? cor("cor-acao") : cor("cor-papel-claro"),
                  justifyContent: "center",
                }}
              >
                <Texto tipo="etiqueta" cor={ativo ? "cor-sobre-acao" : "cor-texto"} style={{ fontSize: 12 }}>
                  {c.rotulo}
                </Texto>
              </Pressionavel>
            );
          })}
        </View>
        {perguntasExibidas.map((p) => (
          <LinhaDePergunta
            key={p.id}
            pergunta={p}
            conferida={visita.verificadas.includes(p.id)}
            resposta={visita.respostas[p.id]}
            aoConferir={() => controle.alternarVerificada(p.id)}
            aoAbrir={() => aoAbrirPergunta(p.id)}
          />
        ))}
        <LinkDeAcao rotulo="Sua pergunta" icone="plus" seta={false} onPress={aoAdicionarPergunta} />
      </Faixa>

      {guiaEstrutura ? (
        <Faixa>
          <Chamada>Observação visual</Chamada>
          <View style={{ height: ESPACO[2] }} />
          <TituloDeSecao tamanho={18}>{guiaEstrutura.titulo}</TituloDeSecao>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18, marginTop: 6 }}>
            {guiaEstrutura.sinaisNoCadastro}
          </Texto>
          <View style={{ gap: 10, marginTop: ESPACO[3] }}>
            {guiaEstrutura.pontosDaVisita.map((ponto, idx) => (
              <View key={ponto.id} style={{ gap: 2 }}>
                <Texto style={{ fontSize: 13, lineHeight: 19, fontWeight: "600" }}>
                  {`${idx + 1}. ${ponto.ondeOlhar}`}
                </Texto>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
                  {ponto.oQueObservar}
                </Texto>
              </View>
            ))}
          </View>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16, marginTop: ESPACO[2] }}>
            {guiaEstrutura.avisoDeEscopo}
          </Texto>
        </Faixa>
      ) : null}

      <Faixa>
        <Chamada>Sinta o espaço</Chamada>
        <View style={{ height: ESPACO[3] }} />
        <TituloDeSecao tamanho={20}>Sol nas suas janelas</TituloDeSecao>
        <View style={{ height: ESPACO[3] }} />
        <Texto tipo="apoio" cor="cor-texto-apoio">Guarde a direção de uma janela e explore o percurso do Sol ao longo do dia.</Texto>
        <View style={{ height: 12 }} />
        <Botao rotulo="Observar uma janela" onPress={() => { void controle.pausarEGravar().then(ok => { if (ok) router.push({ pathname: "/sol", params: { id: analiseId } }); }); }} />
      </Faixa>

      <Faixa>
        <RuidoDeFora ruido={visita.ruido} aoEscolher={controle.definirRuido}
          aoGuardarMedida={(texto) => controle.definirNotas(`${controle.notas}${controle.notas.trim() ? "\n" : ""}${texto}`.slice(0, MAX_NOTAS))} />
      </Faixa>

      <Faixa ultima>
        <CampoDeTexto
          rotulo="Suas impressões"
          linhas={4}
          maxLength={MAX_NOTAS}
          value={controle.notas}
          onChangeText={controle.definirNotas}
          placeholder="O que você gostou? O que pesou contra?"
        />
      </Faixa>
    </View>
  );
}

/** O painel de campo claro e legível à luz do dia (cartões editoriais por cômodo). */
export function PainelDeCampo(props: PropsDoPainel) {
  return <Painel {...props} />;
}
