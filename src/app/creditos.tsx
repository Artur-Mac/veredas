// Carteira de créditos (modal). Referência: `openCreditsSheet`, index.html 6229–6281.
// Saldo, como o crédito entra e sai, o extrato em palavras e a frase da versão de teste. Com saldo zero,
// "Recarregar 3 créditos de teste". Não existe compra: créditos não têm valor em dinheiro.
import { View } from "react-native";
import { Botao } from "../componentes/Botao";
import { useAviso } from "../componentes/casca/Aviso";
import { Folha } from "../componentes/Folha";
import { voltarOu } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { dataLocal, descreverMovimento, sinalDoDelta } from "../dados/descarte";
import { useAnalises } from "../estado/Analises";
import { useCarteira } from "../estado/Carteira";
import { useTema } from "../tema/Tema";

/** O aviso (toast) vem do provedor da raiz do app (`src/app/_layout.tsx`). */
export default function Creditos() {
  const { cor } = useTema();
  const { lista } = useAnalises();
  const { carteira, saldo, pronto, recarregarTeste } = useCarteira();
  const { mostrarAviso } = useAviso();
  const nomes = new Map(lista.map((a) => [a.id, a.nome]));

  const recarregar = async () => {
    try {
      await recarregarTeste();
      mostrarAviso("+3 créditos de teste");
    } catch {
      mostrarAviso("Não deu para recarregar agora. Tente de novo.");
    }
  };

  return (
    <Folha titulo="Carteira de créditos" pai="/">
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Texto tipo="titulo-tela" role="heading" aria-level={2} style={{ fontSize: 18.5, lineHeight: 22, fontWeight: "500", letterSpacing: -0.37 }}>
              Saldo disponível
            </Texto>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18 }}>
              Cada prédio confirmado no cadastro usa 1 crédito.
            </Texto>
          </View>
          <View accessible accessibilityLabel={pronto ? `Saldo: ${saldo} ${saldo === 1 ? "crédito" : "créditos"}` : "Saldo carregando"} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cor("cor-acao") }} />
            <Texto tipo="numero" role="status" style={{ fontSize: 30, lineHeight: 38, fontWeight: "500" }}>
              {pronto ? String(saldo) : "—"}
            </Texto>
          </View>
        </View>

        <View
          style={{
            backgroundColor: cor("cor-creme"),
            borderWidth: 1,
            borderColor: cor("cor-linha"),
            borderRadius: 13,
            paddingVertical: 13,
            paddingHorizontal: 14,
            gap: 6,
          }}
        >
          <Texto tipo="secao" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 16, fontWeight: "700" }}>
            Como os créditos entram e saem
          </Texto>
          <Texto style={{ fontSize: 12.5, lineHeight: 18 }}>
            • Confirmar o prédio de um imóvel no cadastro: <Texto style={{ fontSize: 12.5, fontWeight: "700" }}>−1</Texto>
          </Texto>
          <Texto style={{ fontSize: 12.5, lineHeight: 18 }}>
            • Informar o motivo ao descartar um imóvel, uma vez por imóvel: <Texto style={{ fontSize: 12.5, fontWeight: "700" }}>+1</Texto>
          </Texto>
        </View>

        <View style={{ gap: 8 }}>
          <Texto tipo="secao" role="heading" aria-level={3} style={{ fontSize: 12, lineHeight: 16, fontWeight: "700" }}>
            Extrato de uso e contribuições
          </Texto>
          <View accessibilityLabel="Extrato" style={{ gap: 6 }}>
            {carteira.extrato.map((m, i) => (
              <View
                key={`${m.em}-${m.tipo}-${m.analiseId ?? "-"}-${i}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  backgroundColor: cor("cor-creme"),
                  borderRadius: 8,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Texto numberOfLines={2} style={{ fontSize: 12, lineHeight: 17, fontWeight: "600" }}>
                    {descreverMovimento(m, m.analiseId ? (nomes.get(m.analiseId) ?? null) : null)}
                  </Texto>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>
                    {dataLocal(m.em)}
                  </Texto>
                </View>
                <Texto
                  tipo="numero"
                  cor={m.delta > 0 ? "cor-salvia-escura" : "cor-texto-apoio"}
                  accessibilityLabel={`${m.delta > 0 ? "Mais" : "Menos"} ${Math.abs(m.delta)}`}
                  style={{ fontSize: 14, lineHeight: 20, fontWeight: "700" }}
                >
                  {sinalDoDelta(m.delta)}
                </Texto>
              </View>
            ))}
          </View>
        </View>

        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18 }}>
          Na versão de teste, créditos não têm valor em dinheiro.
        </Texto>

        {pronto && saldo === 0 ? (
          <Botao rotulo="Recarregar 3 créditos de teste" variante="principal" onPress={() => void recarregar()} />
        ) : (
          <Botao rotulo="Fechar" onPress={() => voltarOu("/")} />
        )}
      </View>
    </Folha>
  );
}
