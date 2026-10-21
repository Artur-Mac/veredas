// Sobre os dados (modal). Referência: `openAboutDataSheet`, index.html 6282–6324.
// Para cada fonte do `meta.json` do índice cadastral: nome, órgão, licença, datas, registros lidos e colunas usadas;
// a atribuição exigida pela licença ODbL; e o que o Vereda ainda não cobre. Nada aqui é escrito à mão sobre as
// bases: tudo vem de META.fontes e, desde a v1.1, de META.fontesDaRua (Prefeitura e IBGE, com a citação do IBGE).
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { View } from "react-native";
import { Botao } from "../componentes/Botao";
import { apagarDadosDoAparelho } from "../componentes/casca/apagarDados";
import { useAviso } from "../componentes/casca/Aviso";
import { Gaveta, RESPIRO_NO_TOPO_DA_GAVETA } from "../componentes/casca/Gaveta";
import { useReiniciarApp } from "../componentes/casca/Reinicio";
import { RastroDeConfianca } from "../componentes/fonte/RastroDeConfianca";
import { Icone } from "../componentes/Icone";
import { Pressionavel } from "../componentes/Pressionavel";
import { voltarOu } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import type { Confianca, FonteDaRua, MetaDoIndice } from "../dados/contratos";
import { formatarData, formatarNumero } from "../dados/formatos";
import { BAIRROS_COBERTOS, bairroPorSlug } from "../dados/recife/bairros";
import { META } from "../dados/recife/indice";
import { useTema } from "../tema/Tema";
import { RAIO, TOQUE_MINIMO, comAlfa } from "../tema/tokens";

type Fonte = MetaDoIndice["fontes"][number] | FonteDaRua;

const ATRIBUICAO = "Contém dados da Prefeitura do Recife, disponibilizados sob a Open Database License (ODbL).";
/** v1.1: as bases do IBGE não nomeiam licença; o IBGE pede que a fonte seja citada. */
const ATRIBUICAO_DO_IBGE = "Contém dados do IBGE: CNEFE 2022 e Censo Demográfico 2022 (entorno dos domicílios, malha de setores e Amostra por área de ponderação).";

/** Quatro origens de informação de `.conf-trace` (index.html 2410–2440): a forma do traço diz a origem sem depender de cor. */
const ORIGENS: { confianca: Confianca; texto: string }[] = [
  { confianca: "oficial", texto: "registro oficial: IPTU, ITBI, Licenciamento e Lotes" },
  { confianca: "declarado", texto: "declarado no anúncio: preço, área, condomínio" },
  { confianca: "inferencia", texto: "inferência do cadastro: sinais que pedem confirmação" },
  { confianca: "nao_sabemos", texto: "não sabemos: vira pergunta para a visita" },
];

const NAO_COBRIMOS: { titulo: string; texto: string }[] = [
  { titulo: "Aluguel de mercado", texto: "Ainda não usamos dados de aluguel de outros imóveis do bairro." },
  { titulo: "Segurança por bairro", texto: "Ainda não mostramos dados de segurança." },
  { titulo: "Alagamento por endereço", texto: "Ainda não sabemos se o endereço alaga." },
  { titulo: "Fotos dos anúncios", texto: "Não guardamos nem analisamos as fotos." },
];

/** "Boa Viagem, Casa Forte, Graças, Espinheiro e Madalena". */
function nomesDosCobertos(): string {
  const nomes = BAIRROS_COBERTOS.map((s) => bairroPorSlug(s)?.nome ?? s);
  return nomes.length <= 1 ? nomes.join("") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/** Só a data, como foi gravada ("2026-10-20T16:17:16Z" → "20/10/2026"). */
const diaGravado = (iso: string | null) => (iso ? formatarData(iso.slice(0, 10)) : "Não informado");

function lerFontes(): { fontes: Fonte[]; fontesDaRua: FonteDaRua[] } | { erro: string } {
  try {
    return { fontes: META.fontes, fontesDaRua: META.fontesDaRua ?? [] };
  } catch {
    return { erro: "Não deu para ler o registro das fontes deste aparelho. Os dados do índice não foram alterados." };
  }
}

function Fato({ rotulo, valor, numerico = false }: { rotulo: string; valor: string; numerico?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "baseline" }}>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 17, width: 104 }}>
        {rotulo}
      </Texto>
      <Texto tipo={numerico ? "numero" : "apoio"} style={{ flex: 1, minWidth: 0, fontSize: numerico ? 12 : 11.5, lineHeight: 17, fontWeight: "500" }}>
        {valor}
      </Texto>
    </View>
  );
}

/** `.ed-soft-box`: caixa de fundo creme, borda de 8% de tinta, raio 11. */
function CaixaCreme({ children, gap = 4 }: { children: React.ReactNode; gap?: number }) {
  const { cor } = useTema();
  return (
    <View
      style={{
        backgroundColor: cor("cor-creme"),
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto"), 0.08),
        borderRadius: 11,
        paddingVertical: 11,
        paddingHorizontal: 12,
        gap,
      }}
    >
      {children}
    </View>
  );
}

function CartaoDaFonte({ fonte }: { fonte: Fonte }) {
  return (
    <CaixaCreme gap={6}>
      <View style={{ gap: 2 }}>
        <Texto tipo="secao" style={{ fontSize: 13, lineHeight: 18, fontWeight: "600" }}>
          {fonte.nome}
        </Texto>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 17 }}>
          {fonte.orgao}
        </Texto>
      </View>
      <View style={{ gap: 3 }}>
        <Fato rotulo="Licença" valor={fonte.licenca === "Citar o IBGE" ? "Sem licença nomeada; citar o IBGE" : fonte.licenca} />
        <Fato rotulo="Modificado em" valor={diaGravado(fonte.modificadoEm)} numerico={fonte.modificadoEm !== null} />
        {"periodo" in fonte && fonte.periodo ? (
          <Fato rotulo="Período" valor={`${diaGravado(fonte.periodo.de)} a ${diaGravado(fonte.periodo.ate)}`} numerico />
        ) : null}
        <Fato rotulo="Consultado em" valor={diaGravado(fonte.consultadoEm)} numerico />
        <Fato rotulo="Registros lidos" valor={formatarNumero(fonte.registrosLidos)} numerico />
        <Fato rotulo="Colunas usadas" valor={fonte.colunasUsadas.join(", ")} />
      </View>
      <Pressionavel
        role="link"
        accessibilityLabel={`Abrir ${fonte.nome} no ${fonte.licenca === "Citar o IBGE" ? "servidor do IBGE" : "portal de dados abertos"}`}
        onPress={() => void WebBrowser.openBrowserAsync(fonte.url)}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, alignSelf: "flex-start" }}
      >
        <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 12, lineHeight: 16, fontWeight: "600" }}>
          {fonte.licenca === "Citar o IBGE" ? "Abrir no servidor do IBGE" : "Abrir no portal de dados abertos"}
        </Texto>
        <Icone nome="external-link" tamanho="p" cor="cor-barro-texto" />
      </Pressionavel>
    </CaixaCreme>
  );
}

/** O que fica guardado só neste aparelho e some junto com o apagar. Cada linha é o que a pessoa reconhece como seu. */
const O_QUE_SERA_APAGADO: { titulo: string; texto: string }[] = [
  { titulo: "Suas análises", texto: "os imóveis que você leu, salvou, descartou ou adicionou, com os valores e o prédio confirmado." },
  { titulo: "Seus créditos", texto: "o saldo e o extrato da carteira." },
  { titulo: "Suas visitas", texto: "o roteiro, as respostas, as notas, o ruído e o tempo de cada visita." },
  { titulo: "Suas preferências", texto: "o que o app lembra sobre como você o usa." },
];

/**
 * "Apagar meus dados deste aparelho", em dois passos: o botão só abre a confirmação, que lista o que será apagado; apagar
 * de verdade exige o segundo toque. Apaga toda chave "vereda-*" do armazenamento local e reinicia o app, para que nenhuma
 * tela continue mostrando o que já foi apagado.
 */
function ApagarMeusDados() {
  const { cor } = useTema();
  const { mostrarAviso } = useAviso();
  const reiniciarApp = useReiniciarApp();
  const [confirmando, definirConfirmando] = useState(false);
  const [apagando, definirApagando] = useState(false);
  const [erro, definirErro] = useState("");

  const apagar = async () => {
    if (apagando) return;
    definirApagando(true);
    definirErro("");
    try {
      await apagarDadosDoAparelho();
    } catch {
      definirErro("Não deu para apagar agora. Nada foi alterado. Tente de novo.");
      definirApagando(false);
      return;
    }
    // O armazenamento já está vazio: remonta os provedores, que leem o vazio, e volta ao início.
    reiniciarApp();
    router.dismissTo("/");
    mostrarAviso("Dados apagados deste aparelho");
  };

  return (
    <View style={{ gap: 8 }}>
      <Texto tipo="secao" role="heading" aria-level={3} style={{ fontSize: 12, lineHeight: 16, fontWeight: "700" }}>
        Seus dados neste aparelho
      </Texto>
      <CaixaCreme gap={10}>
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 17 }}>
          Suas análises, seus créditos e suas visitas ficam só neste aparelho. Você pode apagar tudo quando quiser.
        </Texto>
        {confirmando ? (
          <View role="alertdialog" aria-label="Confirmar apagar meus dados" style={{ gap: 10 }}>
            <Texto tipo="secao" style={{ fontSize: 13, lineHeight: 18, fontWeight: "700" }}>
              Apagar tudo o que o Vereda guardou aqui?
            </Texto>
            <View style={{ gap: 6 }}>
              {O_QUE_SERA_APAGADO.map((item) => (
                <Texto key={item.titulo} tipo="apoio" style={{ fontSize: 11.5, lineHeight: 17 }}>
                  <Texto tipo="apoio" style={{ fontSize: 11.5, lineHeight: 17, fontWeight: "700" }}>{`${item.titulo}: `}</Texto>
                  {item.texto}
                </Texto>
              ))}
            </View>
            <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 11.5, lineHeight: 17, fontWeight: "600" }}>
              Não dá para desfazer: não existe cópia em outro lugar.
            </Texto>
            {erro ? (
              <Texto tipo="apoio" role="alert" cor="cor-barro-texto" style={{ fontSize: 11.5, lineHeight: 17 }}>
                {erro}
              </Texto>
            ) : null}
            <Pressionavel
              role="button"
              accessibilityLabel="Sim, apagar tudo"
              disabled={apagando}
              onPress={() => void apagar()}
              style={{
                minHeight: TOQUE_MINIMO,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: RAIO.cartao,
                backgroundColor: cor("cor-barro"),
                opacity: apagando ? 0.5 : 1,
              }}
            >
              <Texto tipo="botao" cor="cor-sobre-barro" style={{ fontWeight: "600" }}>
                {apagando ? "Apagando…" : "Sim, apagar tudo"}
              </Texto>
            </Pressionavel>
            <Botao rotulo="Cancelar" desativado={apagando} onPress={() => definirConfirmando(false)} />
          </View>
        ) : (
          <Botao rotulo="Apagar meus dados deste aparelho" icone="trash" onPress={() => definirConfirmando(true)} />
        )}
      </CaixaCreme>
    </View>
  );
}

export default function SobreOsDados() {
  const leitura = lerFontes();
  return (
    <Gaveta visivel titulo="Sobre os dados públicos" aoFechar={() => voltarOu("/")}>
      <View style={{ gap: 14, paddingTop: RESPIRO_NO_TOPO_DA_GAVETA }}>
        <View style={{ gap: 6 }}>
          <Texto tipo="titulo-tela" role="heading" aria-level={2} style={{ fontSize: 18.5, lineHeight: 22, fontWeight: "500", letterSpacing: -0.37 }}>
            De onde vêm os números
          </Texto>
          <Texto style={{ fontSize: 13, lineHeight: 19 }}>
            {`O Vereda cruza ${"fontes" in leitura ? leitura.fontes.length + leitura.fontesDaRua.length : "as"} bases abertas ${"fontes" in leitura && leitura.fontesDaRua.length > 0 ? "do Recife e do IBGE" : "do Recife"} com o anúncio lido no aparelho. Nossa regra central é: `}
            <Texto style={{ fontSize: 13, fontWeight: "700" }}>posição é fato, adjetivo é veredito</Texto>.
          </Texto>
        </View>

        <CaixaCreme gap={6}>
          <Texto tipo="secao" style={{ fontSize: 12.5, lineHeight: 18, fontWeight: "700" }}>
            4 origens de informação:
          </Texto>
          {ORIGENS.map((o) => (
            <RastroDeConfianca key={o.confianca} confianca={o.confianca} texto={o.texto} />
          ))}
        </CaixaCreme>

        <CaixaCreme>
          <Texto tipo="secao" style={{ fontSize: 12.5, lineHeight: 18, fontWeight: "700" }}>
            Privacidade:
          </Texto>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 17 }}>
            O Vereda não guarda nada sobre quem anuncia. A leitura do anúncio e o seu caderno ficam neste aparelho.
          </Texto>
        </CaixaCreme>

        <View style={{ gap: 8 }}>
          <Texto tipo="secao" role="heading" aria-level={3} style={{ fontSize: 12, lineHeight: 16, fontWeight: "700" }}>
            Fontes usadas
          </Texto>
          {"erro" in leitura ? (
            <Texto role="alert" cor="cor-barro-texto" style={{ fontSize: 12.5, lineHeight: 18 }}>
              {leitura.erro}
            </Texto>
          ) : (
            leitura.fontes.map((f) => <CartaoDaFonte key={f.chave} fonte={f} />)
          )}
        </View>

        {"fontes" in leitura && leitura.fontesDaRua.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Texto tipo="secao" role="heading" aria-level={3} style={{ fontSize: 12, lineHeight: 16, fontWeight: "700" }}>
              Fontes da seção A rua
            </Texto>
            {leitura.fontesDaRua.map((f) => (
              <CartaoDaFonte key={f.chave} fonte={f} />
            ))}
          </View>
        ) : null}

        <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 18 }}>
          {ATRIBUICAO}
        </Texto>
        {"fontes" in leitura && leitura.fontesDaRua.some((f) => f.licenca === "Citar o IBGE") ? (
          <Texto tipo="apoio" style={{ fontSize: 12, lineHeight: 18 }}>
            {ATRIBUICAO_DO_IBGE}
          </Texto>
        ) : null}

        <View style={{ gap: 8 }}>
          <Texto tipo="secao" role="heading" aria-level={3} style={{ fontSize: 12, lineHeight: 16, fontWeight: "700" }}>
            O que ainda não cobrimos
          </Texto>
          <CaixaCreme gap={8}>
            {NAO_COBRIMOS.map((item) => (
              <View key={item.titulo} style={{ gap: 1 }}>
                <Texto tipo="secao" style={{ fontSize: 12.5, lineHeight: 18, fontWeight: "600" }}>
                  {item.titulo}
                </Texto>
                <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 17 }}>
                  {item.texto}
                </Texto>
              </View>
            ))}
            <View style={{ gap: 1 }}>
              <Texto tipo="secao" style={{ fontSize: 12.5, lineHeight: 18, fontWeight: "600" }}>
                Bairros fora dos cinco
              </Texto>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 17 }}>
                {`O cadastro cobre ${nomesDosCobertos()}. Nos demais bairros, o Vereda lê o anúncio, mas não tem cadastro do prédio.`}
              </Texto>
            </View>
          </CaixaCreme>
        </View>

        <ApagarMeusDados />

        <Botao rotulo="Entendido" onPress={() => voltarOu("/")} />
      </View>
    </Gaveta>
  );
}
