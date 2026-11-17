import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { View } from "react-native";
import { Botao } from "../../../../componentes/Botao";
import { Folha } from "../../../../componentes/Folha";
import { ReguaDoItbiRetirada, reguaEDoItbi } from "../../../../componentes/fatos/Regua";
import { Valores } from "../../../../componentes/fatos/Valores";
import { Texto } from "../../../../componentes/Texto";
import { Traco } from "../../../../componentes/Traco";
import { acharFato, recorteDoFato } from "../../../../dados/consultas";
import { formatarData, formatarNumero, hojeIso, maiuscula } from "../../../../dados/formatos";
import { ROTULOS, TEXTO_ILUSTRATIVO } from "../../../../dados/textos";
import { useEstadoDoFato } from "../../../../estado/fatos";
import { useDossie } from "../../../../navegacao/useDossie";
import { ESPACO } from "../../../../tema/tokens";

function LinhaDaFonte({ nome, valor }: { nome: string; valor: string | null | undefined }) {
  if (!valor) return null;
  return (
    <View style={{ flexDirection: "row", gap: ESPACO[3], paddingVertical: 12 }}>
      <Texto cor="cor-texto-apoio" style={{ flex: 1 }}>
        {nome}
      </Texto>
      <Texto style={{ maxWidth: "70%", textAlign: "right" }}>{valor}</Texto>
    </View>
  );
}

export default function VerFonte() {
  const dossie = useDossie();
  const { fato: idFato } = useLocalSearchParams<{ fato: string }>();
  const fato = acharFato(dossie, idFato);
  if (!fato) throw new Error(`Fato não encontrado: ${idFato}`);
  // A régua do ITBI por m² saiu dos exemplos: o endereço direto dela não mostra base, N nem "registro oficial".
  if ("regua" in fato && reguaEDoItbi(fato.regua)) {
    return (
      <Folha titulo="De onde vem" pai={{ pathname: "/exemplos/[id]", params: { id: dossie.id } }}>
        <ReguaDoItbiRetirada />
      </Folha>
    );
  }
  return <ConteudoDaFonte dossie={dossie} fato={fato} />;
}

function ConteudoDaFonte({ dossie, fato }: { dossie: ReturnType<typeof useDossie>; fato: NonNullable<ReturnType<typeof acharFato>> }) {
  const estado = useEstadoDoFato(dossie, fato);
  const f = fato.fonte;
  const regua = "regua" in fato ? fato.regua : null;
  const base = [f.base, f.orgao, f.via].filter(Boolean).join(", ");
  const url = f.url;
  return (
    <Folha titulo="De onde vem" pai={{ pathname: "/exemplos/[id]", params: { id: dossie.id } }}>
      <View style={{ gap: ESPACO[3] }}>
        {fato.ilustrativo ? <Texto>{TEXTO_ILUSTRATIVO}</Texto> : null}
        <Valores>
          <LinhaDaFonte nome="Base" valor={base} />
          <LinhaDaFonte nome="Licença" valor={f.licenca} />
          <LinhaDaFonte nome="Recorte" valor={recorteDoFato(dossie, fato.id)} />
          {regua ? <LinhaDaFonte nome="Período" valor={`${regua.periodo_meses} meses`} /> : null}
          {regua ? <LinhaDaFonte nome="N" valor={formatarNumero(regua.n)} /> : null}
          <LinhaDaFonte nome="Consultado em" valor={f.consultado_em ? formatarData(f.consultado_em) : null} />
          {estado === "em_verificacao" ? (
            <LinhaDaFonte
              nome="Em verificação"
              valor={`${formatarData(hojeIso())}, ${formatarData(hojeIso())}; O valor está diferente do que vi`}
            />
          ) : null}
        </Valores>
        <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[2] }}>
          <Traco rotulo={fato.rotulo} />
          <Texto tipo="apoio" cor="cor-texto-apoio">
            {maiuscula(ROTULOS[fato.rotulo])}
          </Texto>
        </View>
        {fato.escala ? (
          <Texto tipo="apoio" cor="cor-texto-apoio">
            {fato.escala}
          </Texto>
        ) : null}
        {url ? <Botao rotulo="Abrir a base" icone="external-link" onPress={() => void WebBrowser.openBrowserAsync(url)} /> : null}
      </View>
    </Folha>
  );
}
