import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Modal, ScrollView, StyleSheet, View } from "react-native";
import { Botao } from "../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../componentes/Cartao";
import { Coluna } from "../componentes/casca/Coluna";
import { useMovimentoReduzido } from "../componentes/casca/movimento";
import { AlvoDeToque } from "../componentes/Pressionavel";
import { FormularioDeRevisao } from "../componentes/revisao/FormularioDeRevisao";
import { estilosDoTema } from "../componentes/revisao/estilosDoTema";
import { Cabecalho, Tela } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { esquemaAnaliseV2, type AnaliseV2 } from "../dados/contratos";
import {
  anomaliasPendentes,
  camposDaAnalise,
  coberturaDoFormulario,
  declaradosDoFormulario,
  formularioDeAnalise,
  formularioVazio,
  vinculoDoFormulario,
  type EstadoDoFormulario,
} from "../dados/formulario";
import { useAnalises } from "../estado/Analises";
import { apagarRascunho, guardarRascunho, lerRascunho, type RascunhoLocal } from "../estado/rascunho";
import { comAlfa } from "../tema/tokens";

const VISITA_VAZIA: AnaliseV2["visita"] = {
  verificadas: [],
  respostas: {},
  perguntasProprias: [],
  notas: "",
  ruido: null,
  orientacaoGraus: null,
  segundos: 0,
  concluidaEm: null,
};

export default function TelaEditar() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { lista, pronto } = useAnalises();
  // Abrir uma análise existente antes de o caderno carregar mostraria o formulário vazio no lugar dela.
  const aguardando = Boolean(params.id) && pronto === false;
  const existente = params.id ? (lista.find((a) => a.id === params.id) ?? null) : null;

  if (aguardando) {
    return (
      <Tela>
        <Cabecalho titulo="Editar análise" pai="/salvos" />
      </Tela>
    );
  }
  if (params.id && !existente) return <Tela><Cabecalho titulo="Análise não encontrada" pai="/salvos" /></Tela>;
  return <Editor key={existente?.id ?? "novo"} existente={existente} />;
}

function Editor({ existente }: { existente: AnaliseV2 | null }) {
  const { lista, salvar, remover, erro: erroDoCaderno } = useAnalises();
  const styles = useEstilos();
  const movimentoReduzido = useMovimentoReduzido();

  const [idGerado, setIdGerado] = useState(() => `imovel-${Date.now()}`);
  const idAnalise = existente ? existente.id : idGerado;

  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erroValidacao, setErroValidacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  // O formulário nasce completo (bairro escolhido e campos editados), de uma análise salva ou vazio, como o da leitura.
  const [form, setForm] = useState<EstadoDoFormulario>(() => (existente ? formularioDeAnalise(existente) : formularioVazio()));
  const chaveRascunho = existente?.id ?? "novo";
  const [rascunho, setRascunho] = useState<RascunhoLocal | null>(null);
  const rascunhoLido = useRef(false);
  const bloqueio = useRef(false);
  useEffect(() => {
    let montado = true;
    void lerRascunho(chaveRascunho).then(v => { if (montado) { if (v) setRascunho(v); rascunhoLido.current = true; } })
      .catch(() => { if (montado) setErroValidacao("Não foi possível abrir o rascunho. Ele foi preservado; seu caderno continua disponível."); });
    return () => { montado = false; };
  }, [chaveRascunho]);
  const alterarFormulario = (novo: EstadoDoFormulario) => {
    setForm(novo);
    if (rascunhoLido.current && !rascunho) void guardarRascunho(chaveRascunho, novo, idAnalise).catch(() => setErroValidacao("A edição ainda não foi guardada como rascunho. Tente salvar o imóvel antes de sair."));
  };

  // Como na leitura: a cobertura vem do bairro escolhido, e sem bairro escolhido não há como saber o vínculo.
  const semBairro = coberturaDoFormulario(form) === "desconhecida";
  // Só a anomalia que ainda vale: o valor que a pessoa digitou a resolve, e o preço lido para outra modalidade não conta.
  const anomalias = useMemo(
    () => anomaliasPendentes(existente?.extracao ?? null, declaradosDoFormulario(form), form.modalidade),
    [existente, form],
  );

  const salvarAnalise = async () => {
    if (bloqueio.current || rascunho !== null) return;
    bloqueio.current = true;
    setSalvando(true);
    try {
      setErroValidacao("");
      const agora = new Date().toISOString();
      const analise: AnaliseV2 = {
        versao: 2,
        id: idAnalise,
        criadaEm: existente ? existente.criadaEm : agora,
        atualizadaEm: agora,
        url: existente ? existente.url : "",
        extracao: existente ? existente.extracao : null,
        ...camposDaAnalise(form),
        vinculo: vinculoDoFormulario(form, existente),
        visita: existente ? existente.visita : VISITA_VAZIA,
        salva: existente ? existente.salva : true,
        descarte: existente ? existente.descarte : null,
        ...(existente?.caderno ? { caderno: existente.caderno } : {}),
        ...(existente?.confirmacoesDaRua ? { confirmacoesDaRua: existente.confirmacoesDaRua } : {}),
      };

      const validada = esquemaAnaliseV2.parse(analise);
      await salvar(validada);
      if (rascunhoLido.current) await apagarRascunho(chaveRascunho).catch(() => undefined);
      router.push("/salvos");
    } catch {
      // Caderno que não abriu: o problema não são os campos, e a mensagem do caderno diz o que fazer.
      setErroValidacao(erroDoCaderno || "Verifique os campos preenchidos antes de salvar.");
    } finally {
      bloqueio.current = false;
      setSalvando(false);
    }
  };

  const executarExclusao = async () => {
    if (existente) {
      await remover(existente.id);
    }
    router.push("/salvos");
  };

  return (
    <Tela>
      <Coluna>
        <Cabecalho titulo={existente ? "Editar análise" : "Adicionar imóvel"} pai="/salvos" />
      </Coluna>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Coluna>
          <Cartao style={styles.cartao}>
            <CorpoDoCartao>
              {rascunho ? <View style={{ gap: 8, marginBottom: 16 }}>
                <Texto>Há um rascunho guardado neste aparelho.</Texto>
                <Botao rotulo="Retomar rascunho" onPress={() => {
                  if (!existente && rascunho.analiseId && lista.some(a => a.id === rascunho.analiseId)) {
                    router.replace({ pathname: "/editar", params: { id: rascunho.analiseId } }); return;
                  }
                  setForm(rascunho.form); if (rascunho.analiseId) setIdGerado(rascunho.analiseId); setRascunho(null);
                }} />
                <Botao rotulo="Descartar rascunho" onPress={() => { void apagarRascunho(chaveRascunho).then(() => setRascunho(null)).catch(() => setErroValidacao("Não foi possível descartar o rascunho.")); }} />
              </View> : null}
              <FormularioDeRevisao estado={form} anomalias={anomalias} aoAlterar={alterarFormulario} desabilitado={rascunho !== null} />

              {semBairro ? (
                <Texto tipo="apoio" accessibilityLiveRegion="polite" style={styles.dicaDoBairro}>
                  Você pode salvar incompleto e escolher o bairro depois.
                </Texto>
              ) : null}

              {erroValidacao ? (
                <Texto tipo="apoio" role="alert" style={styles.textoErro}>
                  {erroValidacao}
                </Texto>
              ) : null}

              <View style={styles.acoes}>
                <Botao rotulo="Salvar alterações" variante="principal" desativado={salvando || rascunho !== null} onPress={salvarAnalise} />

                {existente && <Botao rotulo="Excluir análise" variante="secundario" onPress={() => setConfirmarExclusao(true)} />}
              </View>
            </CorpoDoCartao>
          </Cartao>
        </Coluna>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Confirmação de Exclusão. Com movimento reduzido, entra sem o fade. */}
      <Modal visible={confirmarExclusao} transparent animationType={movimentoReduzido ? "none" : "fade"}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Texto tipo="secao" style={styles.modalTitulo}>
              Excluir esta análise?
            </Texto>
            <Texto tipo="apoio" style={styles.modalTexto}>
              Esta ação removerá a análise do seu caderno local de forma permanente.
            </Texto>
            <View style={styles.modalAcoes}>
              <AlvoDeToque
                onPress={() => setConfirmarExclusao(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                style={styles.btnCancelarModal}
              >
                <Texto tipo="apoio" style={styles.textoCancelarModal}>
                  Cancelar
                </Texto>
              </AlvoDeToque>
              <AlvoDeToque onPress={executarExclusao} accessibilityRole="button" accessibilityLabel="Sim, excluir" style={styles.btnExcluirModal}>
                <Texto tipo="apoio" style={styles.textoExcluirModal}>
                  Sim, excluir
                </Texto>
              </AlvoDeToque>
            </View>
          </View>
        </View>
      </Modal>
    </Tela>
  );
}

// Só estrutura e cores por token: nenhuma cor solta nesta tela.
const useEstilos = estilosDoTema((cor) =>
  StyleSheet.create({
    scroll: {
      padding: 16,
      paddingBottom: 48,
    },
    // Como o cartão de revisão da leitura (`.ed-card`): o `Cartao` traz margem lateral, e a rolagem já recua.
    cartao: {
      marginHorizontal: 0,
      marginBottom: 0,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
    },
    acoes: {
      marginTop: 20,
      gap: 10,
    },
    dicaDoBairro: {
      color: cor("cor-texto-apoio"),
      fontSize: 12,
      lineHeight: 16,
    },
    textoErro: {
      color: cor("cor-barro-texto"),
      fontSize: 12,
      marginTop: 8,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: comAlfa(cor("cor-campo"), 0.45),
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: cor("cor-superficie"),
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
    },
    modalTitulo: {
      color: cor("cor-barro-texto"),
    },
    modalTexto: {
      marginVertical: 12,
      color: cor("cor-texto-apoio"),
    },
    modalAcoes: {
      flexDirection: "row",
      gap: 10,
      justifyContent: "flex-end",
    },
    btnCancelarModal: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 14,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: cor("cor-linha-forte"),
    },
    textoCancelarModal: {
      color: cor("cor-texto"),
      fontWeight: "600",
    },
    btnExcluirModal: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: 14,
      borderRadius: 6,
      backgroundColor: cor("cor-barro"),
    },
    textoExcluirModal: {
      color: cor("cor-sobre-barro"),
      fontWeight: "700",
    },
  }),
);
