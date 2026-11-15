// Perfil único do domicílio no aparelho (`T14`): preenchido uma única vez em linguagem simples (sem exigir kWh nem taxas
// bancárias) para estimar energia, deslocamento e simulação de compra em todos os imóveis salvos, dossiês e comparações.
// Fica estritamente no armazenamento local (`vereda-perfil-domicilio-v1`) e nunca soma suas estimativas ao mensal oficial.
import { useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { Botao } from "../componentes/Botao";
import { useAviso } from "../componentes/casca/Aviso";
import { Gaveta, RESPIRO_NO_TOPO_DA_GAVETA } from "../componentes/casca/Gaveta";
import { Pressionavel } from "../componentes/Pressionavel";
import { voltarOu } from "../componentes/Tela";
import { Texto } from "../componentes/Texto";
import { formatarReais } from "../dados/formatos";
import { BAIRROS_DO_RECIFE, bairroPorSlug } from "../dados/recife/bairros";
import { baseDeReferenciasPublicas } from "../dados/recife/referenciasPublicas";
import {
  usePerfilDomicilio,
  type ModoDeTransporte,
  type PerfilDoDomicilio,
  type UsoArCondicionado,
} from "../estado/PerfilDomicilio";
import { useTema } from "../tema/Tema";
import { ESPACO, RAIO, comAlfa } from "../tema/tokens";

const OPCOES_MORADORES = [1, 2, 3, 4, 5] as const;

const OPCOES_AR: readonly { valor: UsoArCondicionado; rotulo: string; apoio: string }[] = [
  { valor: "nenhum", rotulo: "Sem ar-condicionado", apoio: "Ventilador e ventilação cruzada" },
  { valor: "noite_1_quarto", rotulo: "À noite em 1 quarto", apoio: "Cerca de 8h por noite (1 split)" },
  { valor: "intenso_2_quartos", rotulo: "Uso intenso (2 ambientes)", apoio: "Dois quartos ou trabalho em casa climatizado" },
];

const OPCOES_TRANSPORTE: readonly { valor: ModoDeTransporte; rotulo: string }[] = [
  { valor: "transporte_publico", rotulo: "Ônibus / Metrô" },
  { valor: "carro_moto", rotulo: "Carro ou moto" },
  { valor: "app", rotulo: "Aplicativo" },
  { valor: "a_pe_bike", rotulo: "A pé / Bicicleta" },
];

const BAIRROS_DESTINO_RAPIDOS = [
  "recife",
  "boa-viagem",
  "ilha-do-leite",
  "boa-vista",
  "santo-amaro",
  "casa-forte",
  "espinheiro",
  "cidade-universitaria",
] as const;

const OPCOES_DIAS = [0, 8, 12, 20, 24] as const;
const OPCOES_ENTRADA = [20, 30, 40, 50] as const;
const OPCOES_PRAZO_ANOS = [15, 20, 30, 35] as const;

function PilulaDeEscolha({
  rotulo,
  ativa,
  aoTocar,
  acessivel,
}: {
  rotulo: string;
  ativa: boolean;
  aoTocar: () => void;
  acessivel?: string;
}) {
  const { cor } = useTema();
  const azul = cor("cor-azul-cadastral");
  return (
    <Pressionavel
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={acessivel ?? rotulo}
      accessibilityState={{ selected: ativa }}
      aria-pressed={ativa}
      style={{
        minHeight: 40,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: RAIO.pilula,
        borderWidth: 1,
        borderColor: ativa ? comAlfa(azul, 0.65) : cor("cor-linha"),
        backgroundColor: ativa ? cor("cor-azul-cadastral-suave") : cor("cor-superficie"),
        justifyContent: "center",
      }}
    >
      <Texto
        tipo="apoio"
        cor={ativa ? "cor-azul-cadastral" : "cor-texto"}
        style={{ fontSize: 12.5, lineHeight: 17, fontWeight: ativa ? "700" : "500" }}
      >
        {rotulo}
      </Texto>
    </Pressionavel>
  );
}

function SecaoDoPerfil({ titulo, apoio, children }: { titulo: string; apoio?: string; children: React.ReactNode }) {
  const { cor } = useTema();
  return (
    <View
      style={{
        backgroundColor: cor("cor-creme"),
        borderWidth: 1,
        borderColor: comAlfa(cor("cor-texto"), 0.08),
        borderRadius: 13,
        padding: 14,
        gap: 10,
      }}
    >
      <View style={{ gap: 3 }}>
        <Texto tipo="secao" style={{ fontSize: 14, lineHeight: 19, fontWeight: "600" }}>
          {titulo}
        </Texto>
        {apoio ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 17 }}>
            {apoio}
          </Texto>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export default function TelaPerfilDomicilio() {
  const { cor } = useTema();
  const { mostrarAviso } = useAviso();
  const { perfil, salvarPerfil, limparPerfil } = usePerfilDomicilio();
  const refs = useMemo(() => baseDeReferenciasPublicas(), []);

  const [moradores, setMoradores] = useState<number>(perfil.moradores);
  const [usoAr, setUsoAr] = useState<UsoArCondicionado>(perfil.usoArCondicionado);
  const [destinoBairro, setDestinoBairro] = useState<string | null>(perfil.destinoBairro);
  const [buscaBairro, setBuscaBairro] = useState("");
  const [modoTransporte, setModoTransporte] = useState<ModoDeTransporte>(perfil.modoTransporte);
  const [diasMes, setDiasMes] = useState<number>(perfil.diasPresenciaisMes);
  const [entradaPct, setEntradaPct] = useState<number>(perfil.entradaPercentualCompra);
  const [prazoAnos, setPrazoAnos] = useState<number>(perfil.prazoAnosCompra);
  const [acesso, setAcesso] = useState<PerfilDoDomicilio["necessidadesDeAcesso"]>(perfil.necessidadesDeAcesso);
  const alternarAcesso = (x: "mobilidade" | "visao") => setAcesso((a) => (a.includes(x) ? a.filter((y) => y !== x) : [...a, x]));
  const [tetoTexto, setTetoTexto] = useState<string>(
    perfil.orcamentoMensalReais !== null ? String(Math.round(perfil.orcamentoMensalReais)) : "",
  );

  const fechar = () => voltarOu("/dossie");

  const bairrosFiltrados = useMemo(() => {
    const q = buscaBairro
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (!q) return [];
    return BAIRROS_DO_RECIFE.filter((b) => {
      const limpo = b.nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return limpo.includes(q) || b.slug.includes(q);
    }).slice(0, 8);
  }, [buscaBairro]);

  const gravar = async () => {
    const limpo = tetoTexto.replace(/[^\d]/g, "");
    const tetoNumero = limpo ? Number(limpo) : null;
    try {
      await salvarPerfil({
        configurado: true,
        moradores,
        usoArCondicionado: usoAr,
        destinoBairro,
        modoTransporte,
        diasPresenciaisMes: diasMes,
        entradaPercentualCompra: entradaPct,
        prazoAnosCompra: prazoAnos,
        necessidadesDeAcesso: acesso,
        orcamentoMensalReais: tetoNumero !== null && tetoNumero > 0 ? tetoNumero : null,
      });
      mostrarAviso("Perfil da casa salvo neste aparelho");
      fechar();
    } catch {
      mostrarAviso("Não foi possível salvar agora. Tente de novo.");
    }
  };

  const restaurarPadrao = async () => {
    try {
      await limparPerfil();
      setMoradores(2);
      setUsoAr("noite_1_quarto");
      setDestinoBairro(null);
      setModoTransporte("transporte_publico");
      setDiasMes(20);
      setEntradaPct(20);
      setPrazoAnos(30);
      setAcesso([]);
      setTetoTexto("");
      mostrarAviso("Perfil restaurado para o padrão");
    } catch {
      mostrarAviso("Não foi possível limpar agora.");
    }
  };

  const nomeDestinoAtual = destinoBairro ? bairroPorSlug(destinoBairro)?.nome ?? destinoBairro : null;

  return (
    <Gaveta visivel aoFechar={fechar} titulo="Perfil da sua casa">
      <View style={{ paddingTop: RESPIRO_NO_TOPO_DA_GAVETA, gap: ESPACO[3] }}>
        <Texto tipo="corpo" cor="cor-texto-apoio" style={{ fontSize: 13.5, lineHeight: 20 }}>
          Preencha uma única vez. O Vereda usa essas escolhas para estimar luz, deslocamento e financiamento em todos os imóveis — sempre em fatias separadas, sem misturar com o valor oficial do anúncio.
        </Texto>

        <SecaoDoPerfil titulo="Quantas pessoas vão morar?" apoio="Ajuda a estimar o consumo básico mensal de energia da casa.">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {OPCOES_MORADORES.map((n) => (
              <PilulaDeEscolha
                key={n}
                rotulo={n === 5 ? "5 ou mais" : `${n} ${n === 1 ? "pessoa" : "pessoas"}`}
                ativa={moradores === n}
                aoTocar={() => setMoradores(n)}
              />
            ))}
          </View>
        </SecaoDoPerfil>

        <SecaoDoPerfil
          titulo="Como vocês usam ar-condicionado?"
          apoio={`Calculado com a tarifa residencial da Neoenergia PE homologada pela ANEEL (${String(refs.energia.tarifaHomologadaKwh).replace(".", ",")} R$/kWh sem tributos; ~${String(refs.energia.tarifaComTributosEstimadaKwh).replace(".", ",")} R$/kWh com tributos médios).`}
        >
          <View style={{ gap: 8 }}>
            {OPCOES_AR.map((op) => {
              const ativa = usoAr === op.valor;
              return (
                <Pressionavel
                  key={op.valor}
                  onPress={() => setUsoAr(op.valor)}
                  accessibilityRole="button"
                  accessibilityLabel={`${op.rotulo}: ${op.apoio}`}
                  accessibilityState={{ selected: ativa }}
                  aria-pressed={ativa}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: ativa ? comAlfa(cor("cor-azul-cadastral"), 0.65) : cor("cor-linha"),
                    backgroundColor: ativa ? cor("cor-azul-cadastral-suave") : cor("cor-superficie"),
                    gap: 2,
                  }}
                >
                  <Texto
                    tipo="corpo"
                    cor={ativa ? "cor-azul-cadastral" : "cor-texto"}
                    style={{ fontSize: 13, lineHeight: 18, fontWeight: "600" }}
                  >
                    {op.rotulo}
                  </Texto>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>
                    {op.apoio}
                  </Texto>
                </Pressionavel>
              );
            })}
          </View>
        </SecaoDoPerfil>

        <SecaoDoPerfil
          titulo="Deslocamento frequente no Recife"
          apoio="Escolha o bairro para onde você mais vai trabalhar ou estudar. Se trabalha de casa, deixe em Sem deslocamento fixo."
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            <PilulaDeEscolha
              rotulo="Sem deslocamento fixo"
              ativa={destinoBairro === null}
              aoTocar={() => setDestinoBairro(null)}
            />
            {BAIRROS_DESTINO_RAPIDOS.map((slug) => {
              const nome = bairroPorSlug(slug)?.nome ?? slug;
              return (
                <PilulaDeEscolha
                  key={slug}
                  rotulo={nome}
                  ativa={destinoBairro === slug}
                  aoTocar={() => setDestinoBairro(slug)}
                />
              );
            })}
          </View>

          <View style={{ gap: 6, marginTop: 4 }}>
            <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>
              {nomeDestinoAtual ? `Destino selecionado: ${nomeDestinoAtual}. Ou busque outro dos 94 bairros:` : "Ou busque qualquer um dos 94 bairros do Recife:"}
            </Texto>
            <TextInput
              value={buscaBairro}
              onChangeText={setBuscaBairro}
              placeholder="Ex.: Afogados, Caxangá, Pina, Torre…"
              placeholderTextColor={cor("cor-texto-apoio")}
              accessibilityLabel="Buscar bairro de destino no Recife"
              style={{
                minHeight: 42,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: cor("cor-linha"),
                backgroundColor: cor("cor-superficie"),
                color: cor("cor-texto"),
                fontFamily: "PlusJakartaSans",
                fontSize: 13,
              }}
            />
            {bairrosFiltrados.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {bairrosFiltrados.map((b) => (
                  <PilulaDeEscolha
                    key={b.slug}
                    rotulo={b.nome}
                    ativa={destinoBairro === b.slug}
                    aoTocar={() => {
                      setDestinoBairro(b.slug);
                      setBuscaBairro("");
                    }}
                  />
                ))}
              </View>
            ) : null}
          </View>

          {destinoBairro !== null ? (
            <>
              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16, marginTop: 4 }}>
                Meio de transporte principal ({`Anel A oficial: ${formatarReais(refs.transportePublico.tarifaAnelAReais)}`})
              </Texto>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                {OPCOES_TRANSPORTE.map((m) => (
                  <PilulaDeEscolha
                    key={m.valor}
                    rotulo={m.rotulo}
                    ativa={modoTransporte === m.valor}
                    aoTocar={() => setModoTransporte(m.valor)}
                  />
                ))}
              </View>

              <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16, marginTop: 4 }}>
                Dias presenciais por mês (ida e volta)
              </Texto>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
                {OPCOES_DIAS.map((d) => (
                  <PilulaDeEscolha
                    key={d}
                    rotulo={d === 0 ? "Nenhum" : `${d} dias/mês`}
                    ativa={diasMes === d}
                    aoTocar={() => setDiasMes(d)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </SecaoDoPerfil>

        <SecaoDoPerfil
          titulo="Preferências para simulação de compra"
          apoio={`Usadas apenas em anúncios de venda, com a taxa média de mercado do Banco Central (${String(refs.financiamento.taxaEfetivaAnualPct).replace(".", ",")}% a.a. · Série SGS 20774).`}
        >
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16 }}>
            Entrada na compra
          </Texto>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {OPCOES_ENTRADA.map((pct) => (
              <PilulaDeEscolha key={pct} rotulo={`${pct}%`} ativa={entradaPct === pct} aoTocar={() => setEntradaPct(pct)} />
            ))}
          </View>
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11.5, lineHeight: 16, marginTop: 4 }}>
            Prazo do financiamento
          </Texto>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {OPCOES_PRAZO_ANOS.map((anos) => (
              <PilulaDeEscolha key={anos} rotulo={`${anos} anos`} ativa={prazoAnos === anos} aoTocar={() => setPrazoAnos(anos)} />
            ))}
          </View>
        </SecaoDoPerfil>

        <SecaoDoPerfil
          titulo="Alguém na casa precisa de acessibilidade? (opcional)"
          apoio="Se marcar, o dossiê mostra rampas do quarteirão e semáforos sonoros perto do prédio. Fica só neste aparelho e não entra em nada que você compartilhe."
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <PilulaDeEscolha rotulo="Mobilidade reduzida" ativa={acesso.includes("mobilidade")} aoTocar={() => alternarAcesso("mobilidade")} />
            <PilulaDeEscolha rotulo="Baixa visão ou cegueira" ativa={acesso.includes("visao")} aoTocar={() => alternarAcesso("visao")} />
          </View>
        </SecaoDoPerfil>

        <SecaoDoPerfil
          titulo="Teto mensal opcional (aluguel + taxas fixas)"
          apoio="Se quiser, anote até quanto pretende comprometer por mês nas parcelas fixas do imóvel. Fica só neste aparelho."
        >
          <TextInput
            value={tetoTexto}
            onChangeText={setTetoTexto}
            keyboardType="number-pad"
            placeholder="Ex.: 4500 (deixe vazio se não quiser usar)"
            placeholderTextColor={cor("cor-texto-apoio")}
            accessibilityLabel="Teto mensal opcional em reais"
            style={{
              minHeight: 42,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: cor("cor-linha"),
              backgroundColor: cor("cor-superficie"),
              color: cor("cor-texto"),
              fontFamily: "JetBrainsMono",
              fontSize: 13.5,
            }}
          />
        </SecaoDoPerfil>

        <View style={{ gap: 10, marginTop: 4 }}>
          <Botao rotulo="Salvar perfil neste aparelho" variante="principal" onPress={() => void gravar()} />
          <Botao rotulo="Restaurar padrão" onPress={() => void restaurarPadrao()} />
        </View>
      </View>
    </Gaveta>
  );
}
