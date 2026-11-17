// Gaveta de descarte (Fatia 5). Referência: `openDiscardSheet`, index.html 6325–6371. Os quatro motivos do protótipo,
// uma observação opcional (até 400 caracteres), grava o descarte, credita +1 uma única vez por análise, avisa
// "+1 crédito" e chama `aoDescartar`. A assinatura (PropsDaGavetaDeDescarte) é contrato do arquiteto: não mude.
import { router } from "expo-router";
import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import type { MotivoDeDescarte } from "../../dados/contratos";
import {
  LIMITE_DA_OBSERVACAO,
  MOTIVOS_DE_DESCARTE,
  aplicarDescarte,
  descarteGeraCredito,
  extratoTemDescarte,
} from "../../dados/descarte";
import { useAnalises } from "../../estado/Analises";
import { useCarteira } from "../../estado/Carteira";
import { useTema } from "../../tema/Tema";
import { RAIO } from "../../tema/tokens";
import { Botao } from "../Botao";
import { useAviso } from "../casca/Aviso";
import { Gaveta } from "../casca/Gaveta";
import { Icone } from "../Icone";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";

export type PropsDaGavetaDeDescarte = {
  analiseId: string;
  visivel: boolean;
  aoFechar: () => void;
  /** Chamado depois de gravar o descarte e creditar +1 (uma única vez por análise). */
  aoDescartar?: () => void;
};

export function GavetaDeDescarte({ analiseId, visivel, aoFechar, aoDescartar }: PropsDaGavetaDeDescarte) {
  const { cor } = useTema();
  const { lista, ativa, salvar, definirAtiva } = useAnalises();
  const { carteira, pronto: carteiraPronta, bloqueada: carteiraBloqueada, erro: erroDaCarteira, creditarDescarte } = useCarteira();
  const { mostrarAviso } = useAviso();
  const [motivo, setMotivo] = useState<MotivoDeDescarte | null>(null);
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const travado = useRef(false);

  // Cada abertura começa limpa. (Ajuste durante a renderização, sem efeito: a gaveta que fecha e abre de novo, ou
  // que passa a outra análise, nunca mostra o motivo e a observação da vez anterior.)
  const [aberta, setAberta] = useState<string | null>(null);
  const abertaAgora = visivel ? analiseId : null;
  if (abertaAgora !== aberta) {
    setAberta(abertaAgora);
    if (abertaAgora !== null) {
      setMotivo(null);
      setObservacao("");
      setErro("");
    }
  }

  const analise = lista.find((a) => a.id === analiseId) ?? null;
  const jaCreditou = extratoTemDescarte(carteira.extrato, analiseId);
  // O +1 só vale para o imóvel que usou crédito (prédio confirmado): a frase da gaveta segue a mesma regra do crédito.
  const rendeCredito = descarteGeraCredito(carteira.extrato, analiseId);

  const confirmar = async () => {
    if (!analise || !motivo || travado.current) return;
    // Carteira não lida: o extrato exposto é vazio, o descarte seria gravado sem o +1. Não descarta.
    if (carteiraBloqueada) {
      setErro(erroDaCarteira);
      return;
    }
    travado.current = true;
    setEnviando(true);
    setErro("");
    try {
      const resultado = aplicarDescarte(analise, { motivo, observacao }, carteira.extrato, new Date());
      if (resultado.analise !== analise) {
        await salvar(resultado.analise);
        // `salvar` torna a análise gravada a ativa. Descartar outro imóvel (a partir dos Salvos) não deve trocar o que
        // o Dossiê e a Visita estavam mostrando; descartar o que está aberto no Dossiê não muda nada.
        if (ativa !== analise.id) await definirAtiva(ativa);
      }
      // Grava primeiro, credita depois: se a gravação falhar, não sobra crédito sem descarte. A carteira confere
      // de novo o extrato dentro da fila dela, então um segundo toque não credita outra vez.
      const creditou = resultado.creditar ? await creditarDescarte(analise.id) : false;
      if (creditou) mostrarAviso("+1 crédito");
      aoFechar();
      if (aoDescartar) aoDescartar();
      else router.replace("/");
    } catch {
      setErro("Não deu para descartar agora. Seus dados continuam como estavam; tente de novo.");
    } finally {
      travado.current = false;
      setEnviando(false);
    }
  };

  const nome = analise?.nome ?? "";
  return (
    <Gaveta visivel={visivel && analise !== null} titulo="Descartar imóvel" aoFechar={aoFechar}>
      <View style={{ paddingTop: 14, gap: 3 }}>
        <Texto
          tipo="titulo-tela"
          role="heading"
          aria-level={2}
          style={{ fontSize: 18.5, lineHeight: 22, fontWeight: "500", letterSpacing: -0.37 }}
        >
          Por que você descartou este imóvel?
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18 }}>
          {jaCreditou
            ? `${nome} · O crédito deste descarte já foi concedido.`
            : rendeCredito
              ? `${nome} · Seu feedback concede +1 crédito na carteira.`
              : `${nome} · Este imóvel não usou crédito, então o descarte não rende crédito.`}
        </Texto>
      </View>

      <View role="radiogroup" aria-label="Motivo do descarte" style={{ gap: 8, marginTop: 12, marginBottom: 14 }}>
        {MOTIVOS_DE_DESCARTE.map((m) => {
          const marcado = motivo === m.chave;
          return (
            <Pressionavel
              key={m.chave}
              role="radio"
              aria-checked={marcado}
              accessibilityState={{ checked: marcado }}
              onPress={() => setMotivo(m.chave)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                minHeight: 48,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 11,
                borderWidth: marcado ? 2 : 1,
                borderColor: marcado ? cor("cor-texto") : cor("cor-linha-forte"),
                backgroundColor: marcado ? cor("cor-superficie") : cor("cor-papel-claro"),
              }}
            >
              <Texto tipo="secao" style={{ flex: 1, fontSize: 12.5, lineHeight: 18, fontWeight: "600" }}>
                {m.rotulo}
              </Texto>
              {marcado ? <Icone nome="check" tamanho="m" cor="cor-salvia-escura" /> : null}
            </Pressionavel>
          );
        })}
      </View>

      <View style={{ gap: 7, marginBottom: 14 }}>
        <Texto tipo="secao" style={{ fontSize: 12, lineHeight: 16, fontWeight: "600" }}>
          Observação (opcional)
        </Texto>
        <TextInput
          value={observacao}
          onChangeText={(t) => setObservacao(t.slice(0, LIMITE_DA_OBSERVACAO))}
          multiline
          numberOfLines={4}
          maxLength={LIMITE_DA_OBSERVACAO}
          accessibilityLabel="Observação (opcional)"
          placeholder="Se quiser, conte o que pesou."
          placeholderTextColor={cor("cor-texto-apoio")}
          style={{
            minHeight: 98,
            paddingVertical: 11,
            paddingHorizontal: 11,
            borderWidth: 1,
            borderColor: cor("cor-linha-forte"),
            borderRadius: 8,
            backgroundColor: cor("cor-papel-claro"),
            color: cor("cor-texto"),
            fontFamily: "PlusJakartaSans",
            fontSize: 13,
            lineHeight: 21,
            textAlignVertical: "top",
          }}
        />
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 14, textAlign: "right" }}>
          {`${observacao.length}/${LIMITE_DA_OBSERVACAO}`}
        </Texto>
      </View>

      {erro ? (
        <Texto role="alert" cor="cor-barro-texto" style={{ fontSize: 12.5, lineHeight: 18, marginBottom: 10, borderRadius: RAIO.quadrado }}>
          {erro}
        </Texto>
      ) : null}
      <Botao
        rotulo="Descartar imóvel"
        variante="principal"
        onPress={() => void confirmar()}
        desativado={motivo === null || enviando || !carteiraPronta}
      />
    </Gaveta>
  );
}
