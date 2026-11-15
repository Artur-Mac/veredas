// Cartão do anúncio lido (15/11/2026, teste no celular): parecido com o anúncio no portal — fotos, preço, custos,
// tamanho e lugar — em vez de uma lista de campos para conferir. Cada linha é tocável e abre a edição; "Editar" embaixo.
import { Linking, ScrollView, View } from "react-native";
import { FotoRemota } from "../FotoRemota";
import type { Portal } from "../../dados/contratos";
import { formatarNumero, formatarReais } from "../../dados/formatos";
import { nomeDoPortal, rotuloDaTipologia, type EstadoDoFormulario } from "../../dados/formulario";
import { useTema } from "../../tema/Tema";
import { ESPACO } from "../../tema/tokens";
import { AlvoDeToque } from "../Pressionavel";
import { Texto } from "../Texto";

type Props = {
  form: EstadoDoFormulario;
  titulo: string;
  portal: Portal;
  url: string;
  fotos: readonly string[];
  aoEditar: () => void;
};

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** "R$ 180/mês", "R$ 2.160/ano" ou "R$ 180 (período a confirmar)". */
function iptuDoCartao(f: EstadoDoFormulario): string | null {
  if (f.iptuValor === null) return null;
  const v = formatarReais(f.iptuValor);
  return f.iptuPeriodo === "mes" ? `${v}/mês` : f.iptuPeriodo === "ano" ? `${v}/ano` : `${v} (período a confirmar)`;
}

export function linhasDoCartao(f: EstadoDoFormulario): { custos: string | null; tamanho: string | null; lugar: string | null } {
  const custos = [
    f.condominio !== null ? `Condomínio ${formatarReais(f.condominio)}` : null,
    iptuDoCartao(f) ? `IPTU ${iptuDoCartao(f)}` : null,
  ].filter(Boolean).join(" · ") || null;
  const tamanho = [
    f.area !== null ? `${formatarNumero(f.area, Number.isInteger(f.area) ? 0 : 1)} m²${f.areaAConfirmar ? " (a conferir)" : ""}` : null,
    f.quartos ? plural(f.quartos, "quarto", "quartos") : null,
    f.banheiros ? plural(f.banheiros, "banheiro", "banheiros") : null,
    f.vagas ? plural(f.vagas, "vaga", "vagas") : null,
    f.andar !== null && f.andar !== undefined ? (f.andar === 0 ? "térreo" : `${f.andar}º andar`) : null,
  ].filter(Boolean).join(" · ") || null;
  const rua = f.logradouro.trim() ? `${f.logradouro.trim()}${f.numero.trim() ? `, ${f.numero.trim()}` : ""}` : null;
  const lugar = [f.nomeEdificio.trim() ? `Edf. ${f.nomeEdificio.trim()}` : null, rua, f.bairroTexto || null].filter(Boolean).join(" · ") || null;
  return { custos, tamanho, lugar };
}

function Linha({ texto, vazio, rotulo, aoEditar }: { texto: string | null; vazio: string; rotulo: string; aoEditar: () => void }) {
  return (
    <AlvoDeToque onPress={aoEditar} accessibilityRole="button" accessibilityLabel={`${rotulo}: ${texto ?? vazio}. Toque para editar`}>
      <Texto tipo={texto ? "corpo" : "apoio"} cor={texto ? undefined : "cor-barro-texto"}>{texto ?? vazio}</Texto>
    </AlvoDeToque>
  );
}

export function CartaoDoAnuncio({ form, titulo, portal, url, fotos, aoEditar }: Props) {
  const { cor } = useTema();
  const { custos, tamanho, lugar } = linhasDoCartao(form);
  const preco = form.preco !== null ? `${formatarReais(form.preco)}${form.modalidade === "aluguel" ? "/mês" : ""}` : null;
  return (
    <View style={{ gap: ESPACO[3] }}>
      {fotos.length ? (
        <View style={{ gap: 6 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityLabel={`${fotos.length} fotos do anúncio`}>
            {fotos.map((f, i) => (
              <FotoRemota key={f} uri={f} rotulo={`Foto ${i + 1} do anúncio`} estilo={{ width: 240, height: 170, borderRadius: 12, backgroundColor: cor("cor-creme") }} />
            ))}
          </ScrollView>
          <AlvoDeToque onPress={() => void Linking.openURL(url).catch(() => undefined)} accessibilityRole="link" accessibilityLabel={`Fotos do anúncio no ${nomeDoPortal(portal)}; abrir o anúncio`}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12 }}>Fotos do anúncio · {nomeDoPortal(portal)} · não guardamos cópia</Texto>
          </AlvoDeToque>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <AlvoDeToque onPress={aoEditar} accessibilityRole="button" accessibilityLabel={`${form.modalidade === "aluguel" ? "Aluguel" : "Venda"}. Toque para editar`}
          style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 999, backgroundColor: cor("cor-creme") }}>
          <Texto tipo="apoio" style={{ fontWeight: "600" }}>{form.modalidade === "aluguel" ? "Aluguel" : "Venda"}</Texto>
        </AlvoDeToque>
        {form.tipologia ? <Texto tipo="apoio" cor="cor-texto-apoio">{rotuloDaTipologia(form.tipologia)}</Texto> : null}
      </View>
      <Texto tipo="titulo-tela" role="heading">{titulo}</Texto>
      <AlvoDeToque onPress={aoEditar} accessibilityRole="button" accessibilityLabel={`Preço: ${preco ?? "não lido"}. Toque para editar`}>
        <Texto tipo="titulo-tela" style={{ fontSize: 28, lineHeight: 34 }} cor={preco ? undefined : "cor-barro-texto"}>{preco ?? "Preço não lido"}</Texto>
      </AlvoDeToque>
      <View style={{ gap: 6 }}>
        <Linha aoEditar={aoEditar} rotulo="Custos" texto={custos} vazio="Condomínio e IPTU não lidos · toque para informar" />
        <Linha aoEditar={aoEditar} rotulo="Tamanho" texto={tamanho} vazio="Área e quartos não lidos · toque para informar" />
        <Linha aoEditar={aoEditar} rotulo="Lugar" texto={lugar} vazio="Bairro não lido · toque para escolher" />
      </View>
      <AlvoDeToque onPress={aoEditar} accessibilityRole="button" accessibilityLabel="Editar os dados do anúncio" style={{ alignSelf: "flex-start", paddingVertical: 4 }}>
        <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontWeight: "600" }}>Editar ›</Texto>
      </AlvoDeToque>
    </View>
  );
}
