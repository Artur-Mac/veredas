import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTema } from "../../tema/Tema";
import { RAIO, TOQUE_MINIMO, comAlfa } from "../../tema/tokens";
import { Texto } from "../Texto";

/**
 * Modo de Convergência Familiar (100% offline, sem nuvem ou cadastro):
 * Combina as prioridades de duas pessoas do domicílio (A e B) por código exportável/importável
 * e destaca apenas os critérios com acordo vs divergência.
 */

export type PrioridadesFamiliar = {
  pessoaNome: string;
  imoveisFavoritosIds: string[];
  tetoMensalReais: number;
  exigeSilencioNoQuarto: boolean;
  exigeElevadorOuRampa: boolean;
};

export function conciliarPrioridadesDomicilio(a: PrioridadesFamiliar, b: PrioridadesFamiliar) {
  const favoritosEmComum = a.imoveisFavoritosIds.filter((id) => b.imoveisFavoritosIds.includes(id));
  const tetoComum = Math.min(a.tetoMensalReais, b.tetoMensalReais);
  const divergencias: string[] = [];

  if (Math.abs(a.tetoMensalReais - b.tetoMensalReais) > 300) {
    divergencias.push(
      `Orçamento: ${a.pessoaNome} definiu R$ ${a.tetoMensalReais.toLocaleString("pt-BR")} e ${b.pessoaNome} definiu R$ ${b.tetoMensalReais.toLocaleString("pt-BR")}.`,
    );
  }
  if (a.exigeSilencioNoQuarto !== b.exigeSilencioNoQuarto) {
    divergencias.push("Sensibilidade a ruído noturno difere entre os perfis.");
  }
  if (a.exigeElevadorOuRampa !== b.exigeElevadorOuRampa) {
    divergencias.push("Critério de acessibilidade física ativo em apenas um dos aparelhos.");
  }

  return {
    favoritosEmComum,
    tetoComum,
    divergencias,
    codigoOfflineJson: JSON.stringify({ v: 1, a, b }),
  };
}

export function ConvergenciaFamiliar({
  perfilA,
  perfilB,
}: {
  perfilA: PrioridadesFamiliar;
  perfilB: PrioridadesFamiliar;
}) {
  const { cor } = useTema();
  const [exibirCodigo, setExibirCodigo] = useState(false);
  const res = conciliarPrioridadesDomicilio(perfilA, perfilB);

  return (
    <View
      style={{
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto"), 0.12),
        borderRadius: RAIO.cartao,
        padding: 14,
        gap: 8,
      }}
      accessibilityLabel="Modo de convergência familiar sem nuvem"
    >
      <Texto tipo="secao" style={{ fontSize: 15.5 }}>
        {`Convergência: ${perfilA.pessoaNome} + ${perfilB.pessoaNome}`}
      </Texto>
      <Texto tipo="numero" style={{ fontSize: 13, fontVariant: ["tabular-nums"] }}>
        {`Em comum: ${res.favoritosEmComum.length} imóvel(is) · Teto conjunto de referência: R$ ${res.tetoComum.toLocaleString("pt-BR")}/mês`}
      </Texto>

      {res.divergencias.length > 0 ? (
        res.divergencias.map((d) => (
          <Texto key={d} tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12.5 }}>
            {`• Alinhar antes da proposta: ${d}`}
          </Texto>
        ))
      ) : (
        <Texto tipo="apoio" cor="cor-salvia-escura" style={{ fontSize: 12.5 }}>
          Os dois perfis estão alinhados nas restrições principais.
        </Texto>
      )}

      <Pressable
        onPress={() => setExibirCodigo((v) => !v)}
        accessibilityRole="button"
        style={{
          minHeight: TOQUE_MINIMO,
          justifyContent: "center",
          borderTopWidth: 1,
          borderTopColor: comAlfa(cor("cor-texto"), 0.08),
          paddingTop: 6,
        }}
      >
        <Texto tipo="etiqueta" cor="cor-azul-cadastral" style={{ fontSize: 12.5 }}>
          {exibirCodigo ? "Ocultar código offline de troca" : "Gerar código offline para compartilhar no outro celular"}
        </Texto>
      </Pressable>

      {exibirCodigo ? (
        <Texto tipo="numero" cor="cor-texto-apoio" style={{ fontSize: 11 }}>
          {res.codigoOfflineJson}
        </Texto>
      ) : null}
    </View>
  );
}
