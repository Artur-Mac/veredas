import React, { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  type Anomalia,
  type ChaveDeCampo,
  type OrigemDoValor,
  type Periodo,
} from "../../dados/contratos";
import { editarFormulario, type EstadoDoFormulario } from "../../dados/formulario";
import { formatarNumero } from "../../dados/formatos";
import { useTema } from "../../tema/Tema";
import { useFocoDoCampo } from "../casca/foco";
import { AlvoDeToque } from "../Pressionavel";
import { Texto } from "../Texto";
import { estilosDoTema } from "./estilosDoTema";
import { SeletorDeBairro } from "./SeletorDeBairro";

// O estado do formulário mora em `dados/formulario.ts` (montagem pura e testada); reexportado para quem já o importa daqui.
export type { EstadoDoFormulario } from "../../dados/formulario";

export interface FormularioDeRevisaoProps {
  estado: EstadoDoFormulario;
  anomalias: Anomalia[];
  aoAlterar: (novo: EstadoDoFormulario) => void;
  desabilitado?: boolean;
  /**
   * Leitura de um link: só modalidade, bairro e os três números do custo (preço, condomínio e IPTU). Nome, endereço,
   * seguro, taxa, outros e especificações ficam atrás de "Ver todos os campos"; o que ficou em branco vira pergunta.
   */
  essencial?: boolean;
}

/** Campos que o modo essencial recolhe; o aviso deles aparece no link "Ver todos os campos". */
const CAMPOS_RECOLHIDOS: ChaveDeCampo[] = [
  "logradouro", "numero", "nomeEdificio", "seguroIncendio", "taxaServico", "area", "quartos", "suites", "banheiros", "vagas", "andar",
];

// ——— Conversão de números digitados ——————————————————————————————————————————————

type TipoDeNumero = "moeda" | "decimal" | "inteiro";

function lerMoeda(texto: string): number | null {
  const limpo = texto.trim().replace(/^R\$\s*/, "").replace(/\./g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function lerDecimal(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function lerInteiro(texto: string): number | null {
  const limpo = texto.trim();
  return /^-?\d+$/.test(limpo) ? parseInt(limpo, 10) : null;
}

const CONVERSORES: Record<TipoDeNumero, { ler: (texto: string) => number | null; mostrar: (valor: number) => string }> = {
  moeda: { ler: lerMoeda, mostrar: (v) => formatarNumero(v, Number.isInteger(v) ? 0 : 2) },
  decimal: { ler: lerDecimal, mostrar: (v) => String(v).replace(".", ",") },
  inteiro: { ler: lerInteiro, mostrar: (v) => String(v) },
};

// ——— Peças ——————————————————————————————————————————————————————————————————————

function Entrada({ style, onFocus, onBlur, ...resto }: TextInputProps) {
  const { cor } = useTema();
  const styles = useEstilos();
  // Foco: borda de 2 px em azul cadastral (o contorno do navegador está zerado em `input`).
  const foco = useFocoDoCampo();
  return (
    <TextInput
      placeholderTextColor={cor("cor-texto-apoio")}
      {...resto}
      onFocus={(e) => {
        foco.aoFocar();
        onFocus?.(e);
      }}
      onBlur={(e) => {
        foco.aoDesfocar();
        onBlur?.(e);
      }}
      style={[styles.input, foco.focado ? styles.inputFocado : null, style, foco.estilo]}
    />
  );
}

function EtiquetaDeOrigem({ origem }: { origem: OrigemDoValor }) {
  const styles = useEstilos();
  const texto = origem === "link" ? "do link" : origem === "texto" ? "do anúncio" : "você";
  return (
    <View style={[styles.etiquetaOrigem, origem === "voce" ? styles.etiquetaVoce : null]}>
      <Texto tipo="apoio" style={origem === "voce" ? styles.textoEtiquetaVoce : styles.textoEtiquetaOrigem}>
        {texto}
      </Texto>
    </View>
  );
}

function CasaDeMarcar({
  marcada,
  rotulo,
  aoAlternar,
  desabilitado,
}: {
  marcada: boolean;
  rotulo: string;
  aoAlternar: () => void;
  desabilitado: boolean;
}) {
  const { cor } = useTema();
  const styles = useEstilos();
  return (
    <AlvoDeToque
      accessibilityRole="checkbox"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: marcada, disabled: desabilitado }}
      aria-checked={marcada}
      disabled={desabilitado}
      onPress={aoAlternar}
      style={styles.linhaConfirmar}
    >
      <View style={[styles.caixa, marcada ? styles.caixaMarcada : null]}>
        {marcada ? (
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={cor("cor-sobre-acao")} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <Path d="M5 12l5 5l10 -10" />
          </Svg>
        ) : null}
      </View>
      <Texto tipo="apoio" style={styles.textoConfirmar}>
        {rotulo}
      </Texto>
    </AlvoDeToque>
  );
}

/**
 * Campo de número com rótulo permanente, etiqueta de origem, anomalia em ferrugem e, nos custos, "a confirmar".
 * O texto digitado é guardado aqui; quando o valor muda por fora (nova leitura da página ou do texto), o campo
 * passa a mostrar o valor novo, e só mantém o texto digitado enquanto ele ainda corresponde ao valor.
 */
function CampoNumerico({
  rotulo,
  tipo,
  valor,
  origem,
  anomalia,
  placeholder,
  desabilitado,
  aoMudar,
  aConfirmar,
}: {
  rotulo: string;
  tipo: TipoDeNumero;
  valor: number | null;
  origem: OrigemDoValor;
  anomalia?: Anomalia;
  placeholder: string;
  desabilitado: boolean;
  aoMudar: (valor: number | null) => void;
  aConfirmar?: { marcada: boolean; rotulo: string; aoAlternar: () => void };
}) {
  const styles = useEstilos();
  const conversor = CONVERSORES[tipo];
  const [digitado, definirDigitado] = useState(valor === null ? "" : conversor.mostrar(valor));
  const mostrado = conversor.ler(digitado) === valor ? digitado : valor === null ? "" : conversor.mostrar(valor);
  return (
    <View style={styles.campo}>
      <View style={styles.cabecalhoCampo}>
        <Texto tipo="etiqueta" style={styles.rotulo}>
          {rotulo}
        </Texto>
        <EtiquetaDeOrigem origem={origem} />
      </View>
      <Entrada
        value={mostrado}
        onChangeText={(texto) => {
          definirDigitado(texto);
          aoMudar(conversor.ler(texto));
        }}
        keyboardType={tipo === "inteiro" ? "number-pad" : "decimal-pad"}
        editable={!desabilitado}
        placeholder={placeholder}
        accessibilityLabel={rotulo}
      />
      {anomalia ? (
        <Texto tipo="apoio" style={styles.textoAnomalia}>
          {anomalia.mensagem}
        </Texto>
      ) : null}
      {aConfirmar ? (
        <CasaDeMarcar
          marcada={aConfirmar.marcada}
          rotulo={aConfirmar.rotulo}
          aoAlternar={aConfirmar.aoAlternar}
          desabilitado={desabilitado}
        />
      ) : null}
    </View>
  );
}

// ——— Formulário ————————————————————————————————————————————————————————————————

export function FormularioDeRevisao({ estado, anomalias, aoAlterar, desabilitado = false, essencial = false }: FormularioDeRevisaoProps) {
  const styles = useEstilos();
  const [verTudo, definirVerTudo] = useState(!essencial);
  const avisosRecolhidos = anomalias.filter((a) => CAMPOS_RECOLHIDOS.includes(a.campo)).length;
  const acharAnomalia = (campo: ChaveDeCampo): Anomalia | undefined => anomalias.find((a) => a.campo === campo);
  // Toda mudança passa por `editarFormulario`: ela marca o campo como editado, e nova leitura não o sobrescreve.
  const alterar = (mudanca: Partial<EstadoDoFormulario>) => aoAlterar(editarFormulario(estado, mudanca));

  const textoDe = (rotulo: string, valor: string, chave: "nome" | "logradouro" | "numero" | "nomeEdificio", placeholder: string) => (
    <View style={styles.campo}>
      <Texto tipo="etiqueta" style={styles.rotulo}>
        {rotulo}
      </Texto>
      <Entrada
        value={valor}
        onChangeText={(v) => alterar({ [chave]: v })}
        editable={!desabilitado}
        placeholder={placeholder}
        accessibilityLabel={rotulo}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {verTudo ? textoDe("Nome da análise", estado.nome, "nome", "Ex.: Apartamento 2 quartos · Casa Forte") : null}

      <View style={styles.campo}>
        <Texto tipo="etiqueta" style={styles.rotulo}>
          Modalidade
        </Texto>
        <View style={styles.segmentado} accessibilityRole="radiogroup">
          {(["aluguel", "compra"] as const).map((m) => {
            const ativo = estado.modalidade === m;
            return (
              <AlvoDeToque
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ checked: ativo, disabled: desabilitado }}
                aria-checked={ativo}
                disabled={desabilitado}
                onPress={() => alterar({ modalidade: m })}
                style={[styles.segmentadoBtn, ativo ? styles.segmentadoAtivo : null]}
              >
                <Texto tipo="apoio" style={ativo ? styles.textoSegmentadoAtivo : styles.textoSegmentado}>
                  {m === "aluguel" ? "Alugar" : "Comprar"}
                </Texto>
              </AlvoDeToque>
            );
          })}
        </View>
      </View>

      <SeletorDeBairro
        estado={estado}
        desabilitado={desabilitado}
        aoEscolher={alterar}
      />

      {verTudo ? (
        <>
          <View style={styles.linhaDupla}>
            <View style={styles.doisTercos}>{textoDe("Rua", estado.logradouro, "logradouro", "Ex.: Rua Amélia")}</View>
            <View style={styles.umTerco}>{textoDe("Número", estado.numero, "numero", "Ex.: 331")}</View>
          </View>

          {textoDe("Edifício", estado.nomeEdificio, "nomeEdificio", "Ex.: Edifício Quinta das Américas")}
        </>
      ) : null}

      <Texto tipo="secao" style={styles.secaoTitulo}>
        Custos mensais e compra
      </Texto>
      {verTudo ? null : (
        <Texto tipo="apoio" style={styles.textoDeApoio}>
          Confira o que o anúncio trouxe. O que ele não diz, deixe em branco: vira pergunta para a visita, e o IPTU do
          cadastro aparece quando o prédio for confirmado.
        </Texto>
      )}

      <CampoNumerico
        rotulo={estado.modalidade === "aluguel" ? "Aluguel (R$ por mês)" : "Preço de venda (R$)"}
        tipo="moeda"
        valor={estado.preco}
        origem={estado.precoOrigem}
        anomalia={acharAnomalia("preco")}
        placeholder="Não informado"
        desabilitado={desabilitado}
        aoMudar={(v) => alterar({ preco: v })}
        aConfirmar={{
          marcada: estado.precoAConfirmar,
          rotulo: "A confirmar na visita ou contrato",
          aoAlternar: () => alterar({ precoAConfirmar: !estado.precoAConfirmar }),
        }}
      />

      <CampoNumerico
        rotulo="Condomínio (R$ por mês)"
        tipo="moeda"
        valor={estado.condominio}
        origem={estado.condominioOrigem}
        anomalia={acharAnomalia("condominio")}
        placeholder="Não informado"
        desabilitado={desabilitado}
        aoMudar={(v) => alterar({ condominio: v })}
        aConfirmar={{
          marcada: estado.condominioAConfirmar,
          rotulo: "A confirmar",
          aoAlternar: () => alterar({ condominioAConfirmar: !estado.condominioAConfirmar }),
        }}
      />

      <View style={styles.campo}>
        <CampoNumerico
          rotulo="IPTU (R$)"
          tipo="moeda"
          valor={estado.iptuValor}
          origem={estado.iptuOrigem}
          anomalia={acharAnomalia("iptu")}
          placeholder="Não informado"
          desabilitado={desabilitado}
          aoMudar={(v) => alterar({ iptuValor: v })}
        />
        <View style={styles.periodoContainer} accessibilityRole="radiogroup">
          <Texto tipo="apoio" style={styles.textoPeriodoRotulo}>
            Período
          </Texto>
          {(["mes", "ano", "desconhecido"] as Periodo[]).map((p) => {
            const rotulo = p === "mes" ? "Mês" : p === "ano" ? "Ano" : "Não sei";
            const ativo = estado.iptuPeriodo === p;
            return (
              // A área de toque tem 44 px de altura; a pílula desenhada por dentro mantém os 30 px.
              <AlvoDeToque
                key={p}
                accessibilityRole="radio"
                accessibilityState={{ checked: ativo, disabled: desabilitado }}
                aria-checked={ativo}
                disabled={desabilitado}
                onPress={() => alterar({ iptuPeriodo: p })}
                style={styles.alvoDoPeriodo}
              >
                <View style={[styles.pilulaPeriodo, ativo ? styles.pilulaPeriodoAtiva : null]}>
                  <Texto tipo="apoio" style={ativo ? styles.textoPeriodoAtivo : styles.textoPeriodo}>
                    {rotulo}
                  </Texto>
                </View>
              </AlvoDeToque>
            );
          })}
        </View>
        <CasaDeMarcar
          marcada={estado.iptuAConfirmar}
          rotulo="A confirmar"
          aoAlternar={() => alterar({ iptuAConfirmar: !estado.iptuAConfirmar })}
          desabilitado={desabilitado}
        />
      </View>

      {verTudo ? (
        <>
          <View style={styles.linhaDupla}>
            <View style={styles.metade}>
              <CampoNumerico
                rotulo="Seguro incêndio (R$ por mês)"
                tipo="moeda"
                valor={estado.seguroIncendio}
                origem={estado.seguroIncendioOrigem}
                anomalia={acharAnomalia("seguroIncendio")}
                placeholder="Não informado"
                desabilitado={desabilitado}
                aoMudar={(v) => alterar({ seguroIncendio: v })}
                aConfirmar={{
                  marcada: estado.seguroIncendioAConfirmar,
                  rotulo: "A confirmar",
                  aoAlternar: () => alterar({ seguroIncendioAConfirmar: !estado.seguroIncendioAConfirmar }),
                }}
              />
            </View>
            <View style={styles.metade}>
              <CampoNumerico
                rotulo="Taxa de serviço (R$ por mês)"
                tipo="moeda"
                valor={estado.taxaServico}
                origem={estado.taxaServicoOrigem}
                anomalia={acharAnomalia("taxaServico")}
                placeholder="Não informado"
                desabilitado={desabilitado}
                aoMudar={(v) => alterar({ taxaServico: v })}
                aConfirmar={{
                  marcada: estado.taxaServicoAConfirmar,
                  rotulo: "A confirmar",
                  aoAlternar: () => alterar({ taxaServicoAConfirmar: !estado.taxaServicoAConfirmar }),
                }}
              />
            </View>
          </View>

          <CampoNumerico
            rotulo="Outros custos (R$ por mês)"
            tipo="moeda"
            valor={estado.outros}
            origem={estado.outrosOrigem}
            placeholder="Não informado"
            desabilitado={desabilitado}
            aoMudar={(v) => alterar({ outros: v })}
            aConfirmar={{
              marcada: estado.outrosAConfirmar,
              rotulo: "A confirmar",
              aoAlternar: () => alterar({ outrosAConfirmar: !estado.outrosAConfirmar }),
            }}
          />

          <Texto tipo="secao" style={styles.secaoTitulo}>
            Especificações do imóvel
          </Texto>

          <View style={styles.linhaDupla}>
            <View style={styles.metade}>
              <CampoNumerico
                rotulo="Área (m²)"
                tipo="decimal"
                valor={estado.area}
                origem={estado.areaOrigem}
                anomalia={acharAnomalia("area")}
                placeholder="Ex.: 85"
                desabilitado={desabilitado}
                aoMudar={(v) => alterar({ area: v })}
              />
            </View>
            <View style={styles.metade}>
              <CampoNumerico
                rotulo="Quartos"
                tipo="inteiro"
                valor={estado.quartos}
                origem={estado.quartosOrigem}
                placeholder="Ex.: 2"
                desabilitado={desabilitado}
                aoMudar={(v) => alterar({ quartos: v })}
              />
            </View>
          </View>

          <View style={styles.linhaDupla}>
            <View style={styles.metade}>
              <CampoNumerico
                rotulo="Suítes"
                tipo="inteiro"
                valor={estado.suites}
                origem={estado.suitesOrigem}
                placeholder="Ex.: 1"
                desabilitado={desabilitado}
                aoMudar={(v) => alterar({ suites: v })}
              />
            </View>
            <View style={styles.metade}>
              <CampoNumerico
                rotulo="Banheiros"
                tipo="inteiro"
                valor={estado.banheiros}
                origem={estado.banheirosOrigem}
                placeholder="Ex.: 2"
                desabilitado={desabilitado}
                aoMudar={(v) => alterar({ banheiros: v })}
              />
            </View>
          </View>

          <View style={styles.linhaDupla}>
            <View style={styles.metade}>
              <CampoNumerico
                rotulo="Vagas"
                tipo="inteiro"
                valor={estado.vagas}
                origem={estado.vagasOrigem}
                placeholder="Ex.: 1"
                desabilitado={desabilitado}
                aoMudar={(v) => alterar({ vagas: v })}
              />
            </View>
            <View style={styles.metade}>
              <CampoNumerico
                rotulo="Andar"
                tipo="inteiro"
                valor={estado.andar}
                origem={estado.andarOrigem}
                placeholder="Ex.: 5"
                desabilitado={desabilitado}
                aoMudar={(v) => alterar({ andar: v })}
              />
            </View>
          </View>
        </>
      ) : (
        <AlvoDeToque
          onPress={() => definirVerTudo(true)}
          accessibilityRole="button"
          accessibilityLabel={`Ver todos os campos${avisosRecolhidos > 0 ? `, ${avisosRecolhidos} ${avisosRecolhidos === 1 ? "aviso" : "avisos"}` : ""}`}
          style={styles.linkVerTudo}
        >
          <Texto tipo="apoio" style={styles.textoVerTudo}>
            Ver todos os campos
          </Texto>
          <Texto tipo="apoio" style={styles.textoDeApoio}>
            {avisosRecolhidos > 0
              ? `Endereço, seguro, área e quartos · ${avisosRecolhidos} ${avisosRecolhidos === 1 ? "aviso" : "avisos"}`
              : "Endereço, seguro, área e quartos"}
          </Texto>
        </AlvoDeToque>
      )}
    </View>
  );
}

// Valores de index.html (.scanner-input-well 1512, .filter-segmented-pill 1595), com as cores sempre por token.
const useEstilos = estilosDoTema((cor) =>
  StyleSheet.create({
    container: {
      gap: 14,
    },
    secaoTitulo: {
      marginTop: 10,
      color: cor("cor-texto"),
      fontWeight: "700",
    },
    textoDeApoio: {
      color: cor("cor-texto-apoio"),
      fontSize: 12,
      lineHeight: 16,
    },
    linkVerTudo: {
      minHeight: 44,
      justifyContent: "center",
      alignSelf: "flex-start",
      gap: 2,
    },
    textoVerTudo: {
      color: cor("cor-azul-cadastral"),
      fontSize: 12.5,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    campo: {
      gap: 5,
      minWidth: 0,
    },
    metade: {
      flex: 1,
      minWidth: 0,
    },
    doisTercos: {
      flex: 2,
      minWidth: 0,
    },
    umTerco: {
      flex: 1,
      minWidth: 0,
    },
    cabecalhoCampo: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      columnGap: 6,
      rowGap: 2,
    },
    rotulo: {
      color: cor("cor-texto-apoio"),
      fontWeight: "600",
    },
    input: {
      minHeight: 46,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 10,
      backgroundColor: cor("cor-creme"),
      color: cor("cor-texto"),
      fontFamily: "PlusJakartaSans",
      fontSize: 14,
      fontWeight: "500",
      outlineWidth: 0,
    },
    // O contorno (2 px em azul cadastral) vem de `useFocoDoCampo`; aqui só o fundo branco do protótipo.
    inputFocado: {
      backgroundColor: cor("cor-superficie"),
    },
    linhaDupla: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    segmentado: {
      flexDirection: "row",
      backgroundColor: cor("cor-sutil"),
      borderWidth: 1,
      borderColor: cor("cor-linha"),
      padding: 2,
      borderRadius: 10,
      gap: 2,
    },
    // 44 px de altura: a web ignora `hitSlop`, então a área desenhada é a que vale.
    segmentadoBtn: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 7,
    },
    segmentadoAtivo: {
      backgroundColor: cor("cor-texto"),
    },
    textoSegmentado: {
      color: cor("cor-texto-apoio"),
      fontSize: 12.5,
      fontWeight: "500",
    },
    textoSegmentadoAtivo: {
      color: cor("cor-papel-claro"),
      fontSize: 12.5,
      fontWeight: "600",
    },
    etiquetaOrigem: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: cor("cor-sutil"),
    },
    etiquetaVoce: {
      backgroundColor: cor("cor-salvia-suave"),
    },
    textoEtiquetaOrigem: {
      fontSize: 10.5,
      lineHeight: 14,
      color: cor("cor-texto-apoio"),
      fontWeight: "600",
    },
    textoEtiquetaVoce: {
      fontSize: 10.5,
      lineHeight: 14,
      color: cor("cor-salvia-escura"),
      fontWeight: "600",
    },
    textoAnomalia: {
      color: cor("cor-barro-texto"),
      fontSize: 11.5,
      lineHeight: 15,
    },
    linhaConfirmar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 44,
      alignSelf: "flex-start",
    },
    caixa: {
      width: 18,
      height: 18,
      borderWidth: 1.5,
      borderColor: cor("cor-linha-forte"),
      borderRadius: 5,
      backgroundColor: cor("cor-superficie"),
      alignItems: "center",
      justifyContent: "center",
    },
    caixaMarcada: {
      backgroundColor: cor("cor-acao"),
      borderColor: cor("cor-acao"),
    },
    textoConfirmar: {
      color: cor("cor-texto-apoio"),
      fontSize: 12,
    },
    // Sem `gap`: cada área de toque já traz 3 px de folga de cada lado, e entre as pílulas ficam os 6 px de antes.
    periodoContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
    },
    textoPeriodoRotulo: {
      color: cor("cor-texto-apoio"),
      fontSize: 12,
      marginRight: 5,
    },
    // Área de toque de 44 px; a pílula (`pilulaPeriodo`) fica desenhada por dentro, com 3 px de folga de cada lado.
    alvoDoPeriodo: {
      minHeight: 44,
      minWidth: 44,
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    pilulaPeriodo: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: cor("cor-linha"),
      backgroundColor: cor("cor-superficie"),
    },
    pilulaPeriodoAtiva: {
      backgroundColor: cor("cor-texto"),
      borderColor: cor("cor-texto"),
    },
    textoPeriodo: {
      fontSize: 11.5,
      color: cor("cor-texto-apoio"),
      fontWeight: "500",
    },
    textoPeriodoAtivo: {
      fontSize: 11.5,
      color: cor("cor-papel-claro"),
      fontWeight: "600",
    },
  }),
);
