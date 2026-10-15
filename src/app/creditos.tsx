import { View } from "react-native";
import { Botao } from "../componentes/Botao";
import { Divisor } from "../componentes/Cartao";
import { Folha } from "../componentes/Folha";
import { NumeroDeCreditos } from "../componentes/inicio/Creditos";
import { Texto } from "../componentes/Texto";
import { enderecoDoDossie } from "../dados/consultas";
import { NOMES_DE_MOVIMENTO } from "../dados/creditos";
import { creditos, dossieOuNulo } from "../dados/dossies";
import type { Creditos } from "../dados/esquema";
import { formatarData } from "../dados/formatos";
import { ESPACO } from "../tema/tokens";

function detalheDoMovimento(movimento: Creditos["extrato"][number]): string {
  const dossie = dossieOuNulo(movimento.dossie ?? undefined);
  if (movimento.tipo === "cota_inicial") return "gratuita";
  if (movimento.tipo === "dossie") return dossie ? dossie.bairro : movimento.dossie ?? "";
  return dossie ? enderecoDoDossie(dossie) : "";
}

export default function TelaDeCreditos() {
  return (
    <Folha titulo="Créditos" pai="/">
      <View style={{ gap: ESPACO[3] }}>
        <NumeroDeCreditos />
        <View accessibilityLabel="Extrato">
          {creditos.extrato.map((m, i) => (
            <View key={`${m.data}-${m.tipo}-${i}`}>
              {i > 0 ? <Divisor /> : null}
              <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3], paddingVertical: 10 }}>
                <View style={{ flex: 1 }}>
                  <Texto>{NOMES_DE_MOVIMENTO[m.tipo]}</Texto>
                  <Texto tipo="apoio" cor="cor-texto-apoio">
                    {`${detalheDoMovimento(m)} · ${formatarData(m.data)}`}
                  </Texto>
                </View>
                <Texto tipo="secao" style={{ textAlign: "right" }}>
                  {`${m.delta > 0 ? "+" : "−"}${Math.abs(m.delta)}`}
                </Texto>
              </View>
            </View>
          ))}
        </View>
        <Texto tipo="apoio" cor="cor-texto-apoio">
          Um crédito abre um dossiê. Você ganha créditos ao confirmar o lote, ao enviar o feedback pós-visita e ao informar o
          motivo do descarte. Nunca por envio de documentos.
        </Texto>
        <Botao rotulo="Comprar créditos" />
      </View>
    </Folha>
  );
}
