// Seção "A pé, a partir da entrada" da aba Entorno (VE04): mercado, farmácia, praça e ônibus, com o tempo a pé e um
// plano B que não depende da mesma ponte. Só desenha o que src/dados/recife/essenciais.ts já calculou e redigiu.
import { useMemo } from "react";
import { View } from "react-native";
import type { Edificio } from "../../dados/contratos";
import { NOTA_DAS_FONTES, essenciaisDoPredio, fraseDaCadeia, linhasDoDia, ponteDoCaminho } from "../../dados/recife/essenciais";
import { useTema } from "../../tema/Tema";
import { ESPACO, comAlfa } from "../../tema/tokens";
import { Texto } from "../Texto";
import { Corpo, Nota, Sobretitulo, Titulo2 } from "./base";
import { SeAlagar } from "./SeAlagar";
import { VoltandoANoite } from "./Noite";

export function DiaADia({ edificio }: { edificio: Edificio | null }) {
  const { cor } = useTema();
  const dados = useMemo(() => (edificio ? essenciaisDoPredio(edificio.bairro, edificio.id) : null), [edificio]);
  if (!dados) return null;
  const linhas = linhasDoDia(dados.pacote, dados.predio);
  const cadeia = fraseDaCadeia(dados.pacote, dados.predio);
  const ponte = ponteDoCaminho(dados.predio);
  return (
    <View>
      <Sobretitulo>A pé, a partir da entrada</Sobretitulo>
      <Titulo2>Mercado, farmácia, praça e ônibus</Titulo2>
      {ponte ? <Corpo estilo={{ marginTop: ESPACO[2] }}>{ponte}</Corpo> : null}
      <View style={{ marginTop: ESPACO[3], gap: ESPACO[3] }} role="list" aria-label="Destinos do dia a dia a pé">
        {linhas.map((l) => (
          <View
            key={l.categoria}
            role="listitem"
            accessible
            accessibilityLabel={`${l.rotulo}: ${l.valor}. ${l.detalhe}`}
            style={{ paddingBottom: ESPACO[3], borderBottomWidth: 1, borderBottomColor: comAlfa(cor("cor-texto"), 0.08), gap: 4 }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Texto style={{ fontSize: 14, fontWeight: "600" }}>{l.rotulo}</Texto>
              <Texto tipo="numero" style={{ fontSize: 15, fontWeight: "600" }}>{l.valor}</Texto>
            </View>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18 }}>
              {l.detalhe}
            </Texto>
          </View>
        ))}
      </View>
      {cadeia ? <Corpo estilo={{ marginTop: ESPACO[3] }}>{cadeia}</Corpo> : null}
      <SeAlagar bairro={edificio?.bairro ?? null} predioId={edificio?.id ?? null} />
      <VoltandoANoite bairro={edificio?.bairro ?? null} predioId={edificio?.id ?? null} />
      <Nota estilo={{ marginTop: ESPACO[3] }}>{NOTA_DAS_FONTES}</Nota>
    </View>
  );
}
