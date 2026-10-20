// As cinco gavetas da aba Visita (index.html: openVisitPicker 5819, openVisitAllQuestions 5841, openVisitQuestion 5829,
// openCustomVisitQuestion 5844, openVisitMessage 5861). Cada uma recebe o que mostrar e devolve o que a pessoa fez;
// quem grava é o hook `useVisita`.
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Linking, View } from "react-native";
import type { AnaliseV2, Pergunta, Visita } from "../../dados/contratos";
import { ESPACO } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Gaveta } from "../casca/Gaveta";
import { useAviso } from "../casca/Aviso";
import { CaixaDeMarcar } from "../Controles";
import { Texto } from "../Texto";
import { CampoDeTexto, LinkDeAcao } from "./blocos";
import { LinhaDeImovel } from "./CartaoDoImovel";
import { LinhaDePergunta } from "./LinhaDePergunta";
import { MAX_PERGUNTAS_PROPRIAS, MAX_RESPOSTA, MAX_TEXTO_DA_PERGUNTA, predioDaAnalise, subtituloDoImovel, urlDoWhatsapp } from "./logica";

const MAX_MENSAGEM = 3000;

function Apoio({ children }: { children: string }) {
  return (
    <Texto cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 21 }}>
      {children}
    </Texto>
  );
}

// ——— Trocar de imóvel ————————————————————————————————————————————————————————————

export function GavetaDeTroca({
  analises,
  ativaId,
  aoEscolher,
  aoFechar,
}: {
  analises: AnaliseV2[];
  ativaId: string | null;
  aoEscolher: (id: string) => void;
  aoFechar: () => void;
}) {
  return (
    <Gaveta visivel titulo="Qual imóvel vai visitar?" aoFechar={aoFechar}>
      {analises.length === 0 ? (
        <Apoio>Você ainda não tem imóveis. Cole um link em Explorar.</Apoio>
      ) : (
        analises.map((a, i) => (
          <LinhaDeImovel key={a.id} analise={a} predio={predioDaAnalise(a)} ativa={a.id === ativaId} primeira={i === 0} aoEscolher={() => aoEscolher(a.id)} />
        ))
      )}
    </Gaveta>
  );
}

// ——— Roteiro completo ————————————————————————————————————————————————————————————

export function GavetaDoRoteiro({
  perguntas,
  visita,
  aoAbrir,
  aoFechar,
}: {
  perguntas: Pergunta[];
  visita: Visita;
  aoAbrir: (id: string) => void;
  aoFechar: () => void;
}) {
  return (
    <Gaveta visivel titulo="Seu roteiro completo" aoFechar={aoFechar}>
      {perguntas.map((p, i) => (
        <LinhaDePergunta
          key={p.id}
          pergunta={p}
          numero={i + 1}
          conferida={visita.verificadas.includes(p.id)}
          resposta={visita.respostas[p.id]}
          aoAbrir={() => aoAbrir(p.id)}
        />
      ))}
    </Gaveta>
  );
}

// ——— Responder uma pergunta ——————————————————————————————————————————————————————

export function GavetaDeResposta({
  pergunta,
  visita,
  aoSalvar,
  aoFechar,
}: {
  pergunta: Pergunta;
  visita: Visita;
  aoSalvar: (id: string, texto: string, conferida: boolean) => void;
  aoFechar: () => void;
}) {
  const [texto, setTexto] = useState(visita.respostas[pergunta.id] ?? "");
  const [conferida, setConferida] = useState(visita.verificadas.includes(pergunta.id));
  return (
    <Gaveta visivel titulo={pergunta.titulo} aoFechar={aoFechar}>
      <View style={{ gap: ESPACO[2] }}>
        <Apoio>{pergunta.origem === "propria" ? "Pergunta adicionada por você." : pergunta.textoParaMensagem}</Apoio>
        <CampoDeTexto
          rotulo="O que você descobriu?"
          linhas={4}
          maxLength={MAX_RESPOSTA}
          value={texto}
          onChangeText={setTexto}
          placeholder="Anote a resposta ou o que ainda precisa confirmar."
        />
        <CaixaDeMarcar rotulo="Pergunta conferida" marcada={conferida} aoMudar={setConferida} />
        <Botao
          rotulo="Salvar resposta"
          variante="principal"
          icone="check"
          onPress={() => {
            aoSalvar(pergunta.id, texto, conferida);
            aoFechar();
          }}
        />
      </View>
    </Gaveta>
  );
}

// ——— Adicionar pergunta ——————————————————————————————————————————————————————————

export function GavetaDeNovaPergunta({
  quantasPropriasJa,
  aoAdicionar,
  aoFechar,
}: {
  quantasPropriasJa: number;
  /** Devolve `false` quando não coube (vazia, longa demais ou limite atingido). */
  aoAdicionar: (texto: string) => boolean;
  aoFechar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const noLimite = quantasPropriasJa >= MAX_PERGUNTAS_PROPRIAS;

  const adicionar = () => {
    if (texto.trim() === "") {
      setErro("Escreva sua pergunta.");
      return;
    }
    if (!aoAdicionar(texto)) {
      setErro("Não foi possível adicionar esta pergunta.");
      return;
    }
    aoFechar();
  };

  return (
    <Gaveta visivel titulo="O que mais importa?" aoFechar={aoFechar}>
      <View style={{ gap: ESPACO[2] }}>
        <CampoDeTexto
          rotulo="Sua pergunta"
          linhas={3}
          maxLength={MAX_TEXTO_DA_PERGUNTA}
          value={texto}
          onChangeText={(v) => {
            setTexto(v);
            if (erro) setErro("");
          }}
          placeholder="Ex.: posso carregar um carro elétrico na garagem?"
        />
        {noLimite ? <Apoio>{`Você já adicionou ${MAX_PERGUNTAS_PROPRIAS} perguntas, o limite do roteiro.`}</Apoio> : null}
        {erro ? (
          <Texto tipo="apoio" cor="cor-barro-texto" role="alert">
            {erro}
          </Texto>
        ) : null}
        <Botao rotulo="Adicionar ao roteiro" variante="principal" icone="plus" desativado={noLimite} onPress={adicionar} />
      </View>
    </Gaveta>
  );
}

// ——— Mensagem ao corretor ————————————————————————————————————————————————————————

export function GavetaDeMensagem({
  analise,
  texto,
  editado,
  aoEditar,
  aoRestaurar,
  aoFechar,
}: {
  analise: AnaliseV2;
  texto: string;
  /** O texto já não é o sugerido: mostra o caminho de volta. */
  editado: boolean;
  aoEditar: (texto: string) => void;
  aoRestaurar: () => void;
  aoFechar: () => void;
}) {
  const { mostrarAviso } = useAviso();

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(texto);
      mostrarAviso("Mensagem copiada");
    } catch {
      mostrarAviso("Não foi possível copiar. Selecione o texto e copie.");
    }
  };

  // Sem destinatário: a pessoa escolhe o contato no WhatsApp e envia por lá. O Vereda não envia nada.
  const abrirNoWhatsapp = async () => {
    try {
      await Linking.openURL(urlDoWhatsapp(texto));
    } catch {
      mostrarAviso("Não foi possível abrir o WhatsApp. Copie a mensagem e cole na conversa.");
    }
  };

  return (
    <Gaveta visivel titulo="Converse com o corretor" subtitulo={`${analise.nome} · ${subtituloDoImovel(analise)}`} aoFechar={aoFechar}>
      <View style={{ gap: ESPACO[2] }}>
        <CampoDeTexto rotulo="Mensagem para agendar" linhas={8} maxLength={MAX_MENSAGEM} value={texto} onChangeText={aoEditar} />
        <Apoio>Nada é enviado pelo Vereda. No WhatsApp você escolhe o contato e envia.</Apoio>
        {editado ? <LinkDeAcao rotulo="Voltar ao texto sugerido" seta={false} onPress={aoRestaurar} /> : null}
        <Botao rotulo="Copiar mensagem" variante="principal" icone="check" desativado={texto.trim() === ""} onPress={() => void copiar()} />
        <LinkDeAcao rotulo="Abrir no WhatsApp" desativado={texto.trim() === ""} onPress={() => void abrirNoWhatsapp()} />
      </View>
    </Gaveta>
  );
}
