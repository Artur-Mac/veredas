import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Botao } from "../componentes/Botao";
import { Cartao, CorpoDoCartao } from "../componentes/Cartao";
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
  return <Editor existente={existente} />;
}

function Editor({ existente }: { existente: AnaliseV2 | null }) {
  const { salvar, remover } = useAnalises();
  const styles = useEstilos();

  const [idGerado] = useState(() => `imovel-${Date.now()}`);
  const idAnalise = existente ? existente.id : idGerado;

  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erroValidacao, setErroValidacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  // O formulário nasce completo (bairro escolhido e campos editados), de uma análise salva ou vazio, como o da leitura.
  const [form, setForm] = useState<EstadoDoFormulario>(() => (existente ? formularioDeAnalise(existente) : formularioVazio()));

  // Como na leitura: a cobertura vem do bairro escolhido, e sem bairro escolhido não há como saber o vínculo.
  const semBairro = coberturaDoFormulario(form) === "desconhecida";
  // Só a anomalia que ainda vale: o valor que a pessoa digitou a resolve, e o preço lido para outra modalidade não conta.
  const anomalias = useMemo(
    () => anomaliasPendentes(existente?.extracao ?? null, declaradosDoFormulario(form), form.modalidade),
    [existente, form],
  );

  const salvarAnalise = async () => {
    if (salvando || semBairro) return;
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
      };

      const validada = esquemaAnaliseV2.parse(analise);
      await salvar(validada);
      router.push("/salvos");
    } catch {
      setErroValidacao("Verifique os campos preenchidos antes de salvar.");
    } finally {
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
      <Cabecalho titulo={existente ? "Editar análise" : "Adicionar imóvel"} pai="/salvos" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Cartao style={styles.cartao}>
          <CorpoDoCartao>
            <FormularioDeRevisao estado={form} anomalias={anomalias} aoAlterar={setForm} />

            {semBairro ? (
              <Texto tipo="apoio" accessibilityLiveRegion="polite" style={styles.dicaDoBairro}>
                Escolha o bairro
              </Texto>
            ) : null}

            {erroValidacao ? (
              <Texto tipo="apoio" role="alert" style={styles.textoErro}>
                {erroValidacao}
              </Texto>
            ) : null}

            <View style={styles.acoes}>
              <Botao rotulo="Salvar alterações" variante="principal" desativado={salvando || semBairro} onPress={salvarAnalise} />

              {existente && <Botao rotulo="Excluir análise" variante="secundario" onPress={() => setConfirmarExclusao(true)} />}
            </View>
          </CorpoDoCartao>
        </Cartao>
      </ScrollView>

      {/* Modal de Confirmação de Exclusão */}
      <Modal visible={confirmarExclusao} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Texto tipo="secao" style={styles.modalTitulo}>
              Excluir esta análise?
            </Texto>
            <Texto tipo="apoio" style={styles.modalTexto}>
              Esta ação removerá a análise do seu caderno local de forma permanente.
            </Texto>
            <View style={styles.modalAcoes}>
              <Pressable
                onPress={() => setConfirmarExclusao(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
                style={styles.btnCancelarModal}
              >
                <Texto tipo="apoio" style={styles.textoCancelarModal}>
                  Cancelar
                </Texto>
              </Pressable>
              <Pressable onPress={executarExclusao} accessibilityRole="button" accessibilityLabel="Sim, excluir" style={styles.btnExcluirModal}>
                <Texto tipo="apoio" style={styles.textoExcluirModal}>
                  Sim, excluir
                </Texto>
              </Pressable>
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
