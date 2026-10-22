import { View } from "react-native";
import type { Edificio } from "../../dados/contratos";
import type { ResultadoDeCandidatos } from "../../dados/recife/buscar";
import { useTema } from "../../tema/Tema";
import { Pressionavel } from "../Pressionavel";
import { Texto } from "../Texto";
import { linhaDeResultado } from "./textos";

/** Lista explícita: o corte visual não é o total, e escolher não confirma nem usa crédito. */
export function AlternativasDePredio({ resultado, porId, atualId, aoEscolher, desativado = false }: {
  resultado: ResultadoDeCandidatos;
  porId: ReadonlyMap<string, Edificio>;
  atualId: string | null;
  aoEscolher: (edificio: Edificio) => void;
  desativado?: boolean;
}) {
  const { cor } = useTema();
  if (!resultado.totalCompativeis) return null;
  const posicao = resultado.candidatos.findIndex((c) => c.edificioId === atualId);
  return (
    <View style={{ gap: 8 }}>
      <Texto tipo="apoio" cor="cor-texto-apoio" accessibilityLiveRegion="polite">
        {resultado.totalCompativeis === 1 ? "1 prédio compatível com as informações disponíveis."
          : `${resultado.totalCompativeis} prédios compatíveis com as informações disponíveis.`}
        {resultado.resultadosLimitados ? ` Mostrando ${resultado.candidatos.length}; refine a busca por endereço ou nome.` : ""}
        {posicao >= 0 ? ` Selecionado ${posicao + 1} de ${resultado.candidatos.length} sugestões exibidas.` : ""}
      </Texto>
      {resultado.candidatos.map((c) => {
        const e = porId.get(c.edificioId);
        if (!e) return null;
        const selecionado = e.id === atualId;
        return (
          <View key={e.id} style={{ gap: 4, padding: 10, borderRadius: 10, backgroundColor: cor("cor-creme") }}>
            <Pressionavel
              accessibilityRole="button"
              accessibilityLabel={`Examinar ${linhaDeResultado(e)}`}
              accessibilityState={{ selected: selecionado, disabled: desativado }}
              disabled={desativado}
              onPress={() => aoEscolher(e)}
              style={{ minHeight: 44, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: cor("cor-superficie"), justifyContent: "center" }}
            >
              <Texto tipo="apoio" style={{ fontWeight: "600", flexShrink: 1 }}>{`${selecionado ? "Selecionado: " : ""}${linhaDeResultado(e)}`}</Texto>
            </Pressionavel>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18 }}>
              {c.motivos.join(" · ")}
            </Texto>
          </View>
        );
      })}
    </View>
  );
}
