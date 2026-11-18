import { View } from "react-native";
import { classificarNivelSossegoPorDbInterno } from "../../dados/acustica/decomporSossego";
import { classificarCardeal } from "../../municipios/recife/motores/bioclimatico3d";
import { useTema } from "../../tema/Tema";
import { RAIO } from "../../tema/tokens";
import { Texto } from "../Texto";

/**
 * Bússola Ao Vivo de Sol, Brisa Leste-Sudeste e Leitura Acústica Relativa Local (somente em memória):
 * Guia prático durante a visita presencial ao apartamento sem gravar áudio bruto (P3).
 */
export function BussolaSolarBrisa({
  azimuteGraus,
  ruidoDbAtual,
  cotaAguaElevadaConfirmada = false,
}: {
  azimuteGraus: number | null;
  ruidoDbAtual: number | null;
  cotaAguaElevadaConfirmada?: boolean;
}) {
  const { cor } = useTema();
  const cardeal = azimuteGraus !== null ? classificarCardeal(azimuteGraus) : "Aponte a bússola pela janela";
  const recebeBrisa = azimuteGraus !== null && azimuteGraus >= 60 && azimuteGraus <= 170;
  const recebePoente = azimuteGraus !== null && azimuteGraus >= 225 && azimuteGraus <= 315;
  const nivelSom = ruidoDbAtual !== null ? classificarNivelSossegoPorDbInterno(ruidoDbAtual).nivel : "Aguardando";

  return (
    <View
      style={{
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: cor("cor-linha-forte"),
        borderRadius: RAIO.cartao,
        padding: 14,
        gap: 8,
      }}
      accessibilityLabel="Bússola de visita sol, brisa e som ambiente em memória"
    >
      <Texto tipo="secao" style={{ fontSize: 15.5 }}>
        Modo visita: Sol, brisa e silêncio no quarto
      </Texto>

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 11.5 }}>
            Fachada medida
          </Texto>
          <Texto tipo="numero" style={{ fontSize: 14, fontVariant: ["tabular-nums"] }}>
            {azimuteGraus !== null ? `${Math.round(azimuteGraus)}° · ${cardeal}` : cardeal}
          </Texto>
          <Texto tipo="apoio" cor={recebePoente ? "cor-barro-texto" : "cor-salvia-escura"} style={{ fontSize: 12 }}>
            {azimuteGraus === null
              ? "Abra o sensor encostado no peitoril da sala ou do quarto."
              : recebeBrisa
                ? "Posição favorável aos ventos alísios de Leste/Sudeste."
                : recebePoente
                  ? "Recebe insolação direta da tarde (poente)."
                  : "Incidência solar oblíqua ao longo do dia."}
          </Texto>
        </View>

        <View style={{ width: 118, gap: 2 }}>
          <Texto tipo="etiqueta" cor="cor-texto-apoio" style={{ fontSize: 11.5 }}>
            Som ambiente (agora)
          </Texto>
          <Texto testID="bussola-som-ambiente" tipo="numero" style={{ fontSize: 16, fontWeight: "700" }}>
            {nivelSom}
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11 }}>
            Leitura relativa em memória · zero gravação de áudio
          </Texto>
        </View>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: cor("cor-linha"), paddingTop: 6, gap: 3 }}>
        <Texto tipo="apoio" style={{ fontSize: 12 }}>
          • Testar dados móveis 5G no quarto dos fundos com a porta fechada.
        </Texto>
        <Texto tipo="apoio" style={{ fontSize: 12 }}>
          {cotaAguaElevadaConfirmada
            ? "• Nível da garagem conferido em visita."
            : "• Conferir marcas de água no subsolo e altura da rampa sobre a rua."}
        </Texto>
      </View>
    </View>
  );
}
