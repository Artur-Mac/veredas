import { View, type ViewProps } from "react-native";
import { useTema } from "../../tema/Tema";
import { comAlfa } from "../../tema/tokens";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { abaPorTecla, focarElemento, teclaDoEvento, type EventoDeTecla } from "./teclado";
import { ABAS_DO_DOSSIE, type AbaDoDossie } from "./textos";

type Props = { atual: AbaDoDossie; aoEscolher: (aba: AbaDoDossie) => void };

const IDS_DAS_ABAS = ABAS_DO_DOSSIE.map((a) => a.id);

/** `id` da aba e do painel, os mesmos de index.html (`ds-tab-<aba>`, `dossier-panel`); o painel aponta para a aba ativa. */
export const idDaAba = (aba: AbaDoDossie) => `ds-tab-${aba}`;
export const ID_DO_PAINEL = "dossier-panel";
/** `aria-controls` existe na web e não consta nos tipos do React Native. */
const CONTROLA_O_PAINEL = { "aria-controls": ID_DO_PAINEL } as unknown as object;

/**
 * `.ds-tabs` de index.html (CSS 2760 a 2763): três abas num trilho creme; a ativa em branco, com peso 700. Com teclado
 * (`dossierTabKey`, 5201 a 5210): seta direita e esquerda trocam de aba e dão a volta, Home e End vão às pontas, e o foco
 * acompanha. Só a aba ativa entra na ordem de Tab (`tabIndex` 0); as outras ficam em -1.
 */
export function AbasDoDossie({ atual, aoEscolher }: Props) {
  const { cor } = useTema();

  const aoTeclar = (evento: EventoDeTecla) => {
    const destino = abaPorTecla(IDS_DAS_ABAS, atual, teclaDoEvento(evento));
    if (destino === null) return;
    evento.preventDefault?.();
    aoEscolher(destino);
    focarElemento(idDaAba(destino));
  };
  // `onKeyDown` existe na web (react-native-web) e não consta nos tipos de View do React Native.
  const teclado = { onKeyDown: aoTeclar } as unknown as ViewProps;

  return (
    <View
      role="tablist"
      accessibilityLabel="Explorar o dossiê"
      {...teclado}
      style={{
        flexDirection: "row",
        gap: 4,
        padding: 4,
        marginTop: 18,
        marginBottom: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: cor("cor-linha"),
        backgroundColor: cor("cor-sutil"),
      }}
    >
      {ABAS_DO_DOSSIE.map((aba) => {
        const ativa = aba.id === atual;
        return (
          <Pressionavel
            key={aba.id}
            nativeID={idDaAba(aba.id)}
            role="tab"
            {...CONTROLA_O_PAINEL}
            tabIndex={ativa ? 0 : -1}
            accessibilityLabel={aba.rotulo}
            accessibilityState={{ selected: ativa }}
            aria-selected={ativa}
            onPress={() => aoEscolher(aba.id)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: ativa ? cor("cor-superficie") : "transparent",
              boxShadow: ativa ? `0 1px 3px ${comAlfa(cor("cor-texto"), 0.05)}` : undefined,
            }}
          >
            <Texto tipo="apoio" cor={ativa ? "cor-texto" : "cor-texto-apoio"} style={{ fontSize: 12, lineHeight: 16, fontWeight: ativa ? "700" : "500" }}>
              {aba.rotulo}
            </Texto>
          </Pressionavel>
        );
      })}
    </View>
  );
}
