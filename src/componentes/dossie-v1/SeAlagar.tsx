// "Se a rua alagar" (VE06; histórico da rua em 15/11/2026): dentro de "A pé, a partir da entrada". Primeiro o histórico da
// rua do prédio, depois os desvios condicionais do caminho a pé e os desvios pequenos; o
// registro da Defesa Civil e o método ficam atrás de "Ver o registro".
import { useState } from "react";
import { View } from "react-native";
import { chuvaDoPredio, type ConsequenciaDaChuva } from "../../dados/recife/chuva";
import { ESPACO } from "../../tema/tokens";
import { Texto } from "../Texto";
import { Corpo, LinkComSeta, Nota } from "./base";

function Linha({ c }: { c: ConsequenciaDaChuva }) {
  const [aberto, setAberto] = useState(false);
  return (
    <View style={{ gap: 4 }}>
      <Corpo>{c.frase}</Corpo>
      <LinkComSeta rotulo={aberto ? "Ocultar o registro" : "Ver o registro"} discreto seta={false} acessivel={`${aberto ? "Ocultar" : "Ver"} o registro da Defesa Civil`} onPress={() => setAberto((x) => !x)} />
      {aberto ? <Nota>{c.registro}</Nota> : null}
    </View>
  );
}

export function SeAlagar({ bairro, predioId }: { bairro: string | null; predioId: string | null }) {
  const r = chuvaDoPredio(bairro, predioId);
  if (!r) return null;
  return (
    <View style={{ marginTop: ESPACO[4], gap: ESPACO[3] }} role="group" aria-label="Se a rua alagar">
      <Texto tipo="corpo" style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>Se a rua alagar</Texto>
      {r.ruaPropria ? <Linha c={r.ruaPropria} /> : null}
      {r.linhas.map((c) => <Linha key={c.frase} c={c} />)}
      {r.pequenos ? <Linha c={r.pequenos} /> : null}
    </View>
  );
}
