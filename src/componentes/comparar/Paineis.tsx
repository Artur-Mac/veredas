// Os três painéis do Comparar (`renderCompare`, index.html 5964–5989; CSS `.vc-*` 3077–3108): Custo, Espaço e
// Entorno. Cada painel só desenha o que `comparar.ts` já calculou e formatou; nenhum valor é somado aqui.
import { View } from "react-native";
import { formatarReais } from "../../dados/formatos";
import { useTema } from "../../tema/Tema";
import { comAlfa, type TokenDeCor } from "../../tema/tokens";
import { Texto } from "../Texto";
import {
  formatarArea,
  type ComparacaoDeCusto,
  type ComparacaoDeEntorno,
  type ComparacaoDeEspaco,
  type Par,
} from "./comparar";
import { KickerVx, LinkVx, SuperficieVx } from "./vx";

// ——— Peças ——————————————————————————————————————————————————————————————————————————

type Celula = { texto: string; detalhe: string | null };

/** Número (JetBrains Mono, tabular) quando o texto tem algarismo; senão texto comum, como `.vc-text-value`. */
function ValorDaCelula({ texto, detalhe, tamanho = 16 }: Celula & { tamanho?: number }) {
  const numerico = /\d/.test(texto);
  return (
    <View style={{ gap: 4 }}>
      {numerico ? (
        <Texto tipo="numero" style={{ fontSize: tamanho, lineHeight: tamanho + 7, fontWeight: "600" }}>
          {texto}
        </Texto>
      ) : (
        <Texto style={{ fontSize: 13, lineHeight: 18, fontWeight: "500" }}>{texto}</Texto>
      )}
      {detalhe ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 10, lineHeight: 15 }}>
          {detalhe}
        </Texto>
      ) : null}
    </View>
  );
}

type PropsDaLinha = {
  rotulo: string;
  celulas: Par<Celula>;
  /** Rótulos das duas colunas, só para o leitor de tela. */
  colunas: Par<string>;
  chave?: boolean;
  primeira?: boolean;
  tamanho?: number;
};

/** `.vc-row`: rótulo de 11 px e as duas colunas lado a lado; `chave` (`.is-key`) tinge a linha até as bordas. */
function LinhaDeDois({ rotulo, celulas, colunas, chave = false, primeira = false, tamanho }: PropsDaLinha) {
  const { cor } = useTema();
  const leitura = celulas.map((c, i) => `${colunas[i]}: ${c.texto}${c.detalhe ? `, ${c.detalhe}` : ""}`).join(". ");
  return (
    <View
      accessible
      accessibilityLabel={`${rotulo}. ${leitura}`}
      style={[
        { paddingVertical: 15 },
        chave ? { backgroundColor: cor("cor-creme"), marginHorizontal: -17, paddingHorizontal: 17 } : null,
        primeira ? null : { borderTopWidth: 1, borderTopColor: comAlfa(cor("cor-linha"), 0.7) },
      ]}
    >
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16, marginBottom: 9 }}>
        {rotulo}
      </Texto>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {celulas.map((c, i) => (
          <View key={i} style={{ flex: 1, minWidth: 0 }}>
            <ValorDaCelula {...c} tamanho={tamanho} />
          </View>
        ))}
      </View>
    </View>
  );
}

type PropsDoDestaque = {
  sobretitulo: string;
  /** Número em destaque (mono) ou, com `texto`, uma frase em Fraunces. */
  destaque: string;
  legenda: string;
  nota?: string | null;
  texto?: boolean;
};

/** `.vc-insight`: sobretítulo, o número da diferença em ferrugem e a frase que o explica. */
function Destaque({ sobretitulo, destaque, legenda, nota = null, texto = false }: PropsDoDestaque) {
  const comoTexto = texto || !/\d/.test(destaque);
  return (
    <View style={{ marginBottom: 23 }} accessible accessibilityLabel={`${sobretitulo}. ${destaque} ${legenda}`}>
      <KickerVx>{sobretitulo}</KickerVx>
      {comoTexto ? (
        <Texto tipo="titulo-tela" cor="cor-barro-texto" style={{ fontSize: 26, lineHeight: 31, fontWeight: "500", letterSpacing: -0.6, marginTop: 8, marginBottom: 6 }}>
          {destaque}
        </Texto>
      ) : (
        <Texto tipo="numero" cor="cor-barro-texto" style={{ fontSize: 32, lineHeight: 40, fontWeight: "500", marginTop: 8, marginBottom: 6 }}>
          {destaque}
        </Texto>
      )}
      <Texto style={{ fontSize: 14, lineHeight: 21 }}>{legenda}</Texto>
      {nota ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 17, marginTop: 6 }}>
          {nota}
        </Texto>
      ) : null}
    </View>
  );
}

const COR_DA_BARRA: Par<TokenDeCor> = ["cor-acao", "cor-salvia"];

type PropsDasBarras = { rotulos: Par<string>; textos: Par<string>; barras: Par<number | null> };

/** `.vc-bars`: uma barra por imóvel, na mesma escala (a maior ocupa a largura inteira). Sem valor, a trilha fica vazia. */
function Barras({ rotulos, textos, barras }: PropsDasBarras) {
  const { cor } = useTema();
  return (
    <View style={{ gap: 16, marginBottom: 22 }}>
      {([0, 1] as const).map((i) => {
        const proporcao = barras[i];
        return (
          <View key={i} accessible accessibilityLabel={`${rotulos[i]}: ${textos[i]}`}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
              <Texto tipo="apoio" cor="cor-texto-apoio" numberOfLines={1} style={{ flex: 1, fontSize: 11, lineHeight: 16 }}>
                {rotulos[i]}
              </Texto>
              <Texto
                tipo={proporcao === null ? "apoio" : "numero"}
                style={proporcao === null ? { fontSize: 13, fontWeight: "500" } : { fontSize: 16, lineHeight: 22, fontWeight: "600" }}
              >
                {textos[i]}
              </Texto>
            </View>
            <View style={{ height: 7, backgroundColor: cor("cor-sutil"), borderRadius: 5, overflow: "hidden" }}>
              {proporcao !== null ? (
                <View style={{ width: `${Math.round(proporcao * 1000) / 10}%`, height: "100%", borderRadius: 5, backgroundColor: cor(COR_DA_BARRA[i]) }} />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const PAINEL = { paddingTop: 22, paddingHorizontal: 17, paddingBottom: 15 } as const;

const moeda = (valor: number | null, sufixo = "") => (valor === null ? "A confirmar" : `${formatarReais(valor)}${sufixo}`);

// ——— Painéis ————————————————————————————————————————————————————————————————————————

type PropsDoPainelDeCusto = {
  custo: ComparacaoDeCusto;
  rotulos: Par<string>;
  /** "Ajustar valores" de cada coluna: abre a edição da análise. */
  aoAjustar: (indice: 0 | 1) => void;
};

export function PainelDeCusto({ custo, rotulos, aoAjustar }: PropsDoPainelDeCusto) {
  const aluguel = custo.referencia === "custo_mensal_conhecido";
  const sufixo = aluguel ? "/mês" : "";
  const [a, b] = custo.colunas;
  return (
    <SuperficieVx style={PAINEL}>
      <Destaque
        sobretitulo={aluguel ? "O que pesa no mês" : "O valor da escolha"}
        destaque={custo.destaque}
        legenda={custo.legenda}
        nota={custo.nota}
      />
      <Barras
        rotulos={rotulos}
        textos={[moeda(a.valorDaBarra, sufixo), moeda(b.valorDaBarra, sufixo)]}
        barras={custo.barras}
      />
      <LinhaDeDois
        primeira
        rotulo={custo.rotuloDoPrincipal}
        colunas={rotulos}
        celulas={[
          { texto: moeda(a.principal, aluguel ? "/mês" : ""), detalhe: null },
          { texto: moeda(b.principal, aluguel ? "/mês" : ""), detalhe: null },
        ]}
        tamanho={18}
      />
      <LinhaDeDois
        chave
        rotulo={custo.rotuloDoMensal}
        colunas={rotulos}
        celulas={[
          { texto: moeda(a.mensalConhecido, "/mês"), detalhe: a.textoDePendentes },
          { texto: moeda(b.mensalConhecido, "/mês"), detalhe: b.textoDePendentes },
        ]}
        tamanho={18}
      />
      {custo.parcelas.map((p) => (
        <LinhaDeDois key={p.nome} rotulo={p.nome} colunas={rotulos} celulas={p.celulas} />
      ))}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        {([0, 1] as const).map((i) => (
          <View key={i} style={{ flex: 1, minWidth: 0 }}>
            <LinkVx rotulo="Ajustar valores" tamanho={11} acessivel={`Ajustar valores de ${rotulos[i]}`} onPress={() => aoAjustar(i)} />
          </View>
        ))}
      </View>
    </SuperficieVx>
  );
}

export function PainelDeEspaco({ espaco, rotulos }: { espaco: ComparacaoDeEspaco; rotulos: Par<string> }) {
  const textoDaArea = (v: number | null) => (v === null ? "A confirmar" : `${formatarArea(v)} m²`);
  return (
    <SuperficieVx style={PAINEL}>
      <Destaque sobretitulo="Espaço para a sua rotina" destaque={espaco.destaque} legenda={espaco.legenda} />
      <Barras rotulos={rotulos} textos={[textoDaArea(espaco.areas[0]), textoDaArea(espaco.areas[1])]} barras={espaco.barras} />
      {espaco.linhas.map((l, i) => (
        <LinhaDeDois key={l.rotulo} primeira={i === 0} chave={l.chave} rotulo={l.rotulo} colunas={rotulos} celulas={l.medidas} />
      ))}
    </SuperficieVx>
  );
}

type PropsDoPainelDeEntorno = {
  entorno: ComparacaoDeEntorno;
  rotulos: Par<string>;
  /** Enquanto o índice cadastral não foi lido. */
  carregando: boolean;
  /** Abre a confirmação do prédio da coluna; só é oferecida onde o bairro tem cadastro e o prédio não está confirmado. */
  podeConfirmar: Par<boolean>;
  aoConfirmar: (indice: 0 | 1) => void;
};

export function PainelDeEntorno({ entorno, rotulos, carregando, podeConfirmar, aoConfirmar }: PropsDoPainelDeEntorno) {
  return (
    <SuperficieVx style={PAINEL}>
      <Destaque
        sobretitulo="O entorno no cadastro"
        destaque="O prédio e o que há ao redor."
        legenda="Obras licenciadas, idade e porte, como a Prefeitura registra."
        texto
      />
      {carregando ? (
        <Texto role="status" cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 20, paddingVertical: 15 }}>
          Lendo o cadastro…
        </Texto>
      ) : (
        entorno.linhas.map((l, i) => (
          <LinhaDeDois key={l.rotulo} primeira={i === 0} chave={l.chave} rotulo={l.rotulo} colunas={rotulos} celulas={l.celulas} />
        ))
      )}
      {!carregando && (podeConfirmar[0] || podeConfirmar[1]) ? (
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          {([0, 1] as const).map((i) => (
            <View key={i} style={{ flex: 1, minWidth: 0 }}>
              {podeConfirmar[i] ? (
                <LinkVx rotulo="Confirmar prédio" tamanho={11} acessivel={`Confirmar o prédio de ${rotulos[i]}`} onPress={() => aoConfirmar(i)} />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 18, marginTop: 15 }}>
        Obras: Licenciamento urbanístico. Ano, pavimentos e unidades: IPTU 2026 e Lotes. Prefeitura do Recife, licença ODbL.
      </Texto>
    </SuperficieVx>
  );
}
