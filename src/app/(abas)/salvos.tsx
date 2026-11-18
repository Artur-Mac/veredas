// Salvos (T4). Referência: `renderSaved`, index.html 6506+; CSS `.vs-*` (3176–3183) e `.vx-*`.
// Análises marcadas como salvas e não descartadas, com o filtro Todos / Aluguel / Compra, e a seção "Descartados"
// com "Restaurar". Restaurar tira o descarte e não mexe na carteira: o crédito que o descarte rendeu continua lá.
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Botao } from "../../componentes/Botao";
import { useAviso } from "../../componentes/casca/Aviso";
import { FaixaDoCaderno } from "../../componentes/casca/FaixaDoCaderno";
import { detalheDoImovel } from "../../componentes/comparar/comparar";
import { useAbrirAnalise, usePrepararVisita } from "../../componentes/comparar/navegacao";
import { BotaoVx, CabecalhoVx, LinkVx, MARGEM_DA_PAGINA_VX, PaginaVx, SegmentosVx, VazioVx } from "../../componentes/comparar/vx";
import { GavetaDeDescarte } from "../../componentes/descarte/GavetaDeDescarte";
import { GradeArquitetonica } from "../../componentes/GradeArquitetonica";
import { Icone } from "../../componentes/Icone";
import { Pressionavel } from "../../componentes/Pressionavel";
import { Texto } from "../../componentes/Texto";
import type { AnaliseV2, Modalidade } from "../../dados/contratos";
import { derivarCustoPorPartes } from "../../dados/custoPorPartes";
import { custoMensal, ROTULO_MENSAL_CONHECIDO, avisoDeValoresPendentes } from "../../dados/custos";
import { restaurarAnalise, rotuloDoMotivo } from "../../dados/descarte";
import { formatarData, formatarReais, formatarReaisCompacto, hojeIso } from "../../dados/formatos";
import { inferirFachadasDoEdificio } from "../../dados/sol/inferirFachadas";
import { useAnalises } from "../../estado/Analises";
import { useCarteira } from "../../estado/Carteira";
import { usePerfilDomicilio, type PerfilDoDomicilio } from "../../estado/PerfilDomicilio";
import { useTema } from "../../tema/Tema";
import { RAIO } from "../../tema/tokens";

type Filtro = "todos" | Modalidade;

const FILTROS: readonly { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aluguel", rotulo: "Aluguel" },
  { valor: "compra", rotulo: "Compra" },
];

const casa = (filtro: Filtro, a: AnaliseV2) => filtro === "todos" || a.modalidade === filtro;

/** Dia em que o descarte foi feito, na data do aparelho. */
const dataDoInstante = (iso: string) => formatarData(hojeIso(new Date(iso)));

/** Miniatura sem foto (o Vereda não guarda fotos de anúncio): o padrão arquitetônico com o ícone de prédio. */
function Miniatura() {
  const { cor } = useTema();
  return (
    <View
      style={{ width: 68, height: 76, borderRadius: 8, backgroundColor: cor("cor-sutil"), alignItems: "center", justifyContent: "center", overflow: "hidden" }}
    >
      <GradeArquitetonica />
      <Icone nome="building" tamanho="g" cor="cor-texto-apoio" />
    </View>
  );
}

function ImovelDoCartao({ analise, aoAbrir }: { analise: AnaliseV2; aoAbrir: () => void }) {
  const detalhe = detalheDoImovel(analise);
  return (
    <Pressionavel
      role="link"
      accessibilityLabel={`Abrir ${analise.nome}`}
      onPress={aoAbrir}
      style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 2 }}
    >
      <Miniatura />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Texto style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
          {analise.nome}
        </Texto>
        {detalhe ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" numberOfLines={2} style={{ fontSize: 11, lineHeight: 16, marginTop: 4 }}>
            {detalhe}
          </Texto>
        ) : null}
      </View>
    </Pressionavel>
  );
}

type PropsDoCartaoSalvo = {
  analise: AnaliseV2;
  perfilDomicilio: PerfilDoDomicilio;
  aoAbrir: () => void;
  aoRemover: () => void;
  aoPrepararVisita: () => void;
  aoDescartar: () => void;
};

/** `.vs-card`: imóvel, botão de remover, preço anunciado, e as ações. */
function CartaoSalvo({ analise, perfilDomicilio, aoAbrir, aoRemover, aoPrepararVisita, aoDescartar }: PropsDoCartaoSalvo) {
  const { cor } = useTema();
  const custo = custoMensal(analise);
  const partes = derivarCustoPorPartes(analise, null, perfilDomicilio);
  const aluguel = analise.modalidade === "aluguel";
  const valor = aluguel ? custo.totalMensalConhecido : custo.principal.valor;
  const resumoRotina = partes.fatiasDaRotina
    .map((f) => `${f.id === "energia" ? "luz" : "deslocamento"} ${f.valorMensalReais > 0 ? `~${formatarReais(f.valorMensalReais)}` : "sem gasto"}`)
    .join(" · ");
  const inferenciaSalvo = inferirFachadasDoEdificio({
    edificio: {
      id: analise.id,
      bairro: analise.bairro ?? "boa-viagem",
      logradouro: analise.logradouro || analise.bairroTexto || "Via local",
      centro: [-34.896, -8.121],
      poligono: null,
    },
    textoAnuncio: [analise.nome, analise.nomeEdificio, ...(analise.extracao?.campos.comodidades ?? [])]
      .filter(Boolean)
      .join(" "),
  });
  const facSalvo =
    inferenciaSalvo.fachadas.find((f) => f.id === inferenciaSalvo.fachadaSugeridaId) ?? inferenciaSalvo.frente;
  const bolsoMesSalvo =
    (aluguel
      ? (custo.totalMensalConhecido ?? custo.principal.valor ?? 0)
      : (partes.simulacaoCompra?.prestacaoPriceReais ?? 0) + (analise.declarados.condominio.valor ?? 0)) +
    partes.somaRotinaEstimadaReais;
  return (
    <View
      style={{
        backgroundColor: cor("cor-superficie"),
        borderWidth: 1,
        borderColor: cor("cor-linha-forte"),
        borderRadius: 15,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <ImovelDoCartao analise={analise} aoAbrir={aoAbrir} />
        <Pressionavel
          role="button"
          accessibilityLabel={`Remover ${analise.nome} dos salvos`}
          onPress={aoRemover}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: cor("cor-creme"), alignItems: "center", justifyContent: "center" }}
        >
          <Icone nome="x" tamanho="m" cor="cor-barro-texto" />
        </Pressionavel>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3, marginTop: 16 }}>
        <Texto tipo="numero" style={{ fontSize: valor === null ? 18 : 23, lineHeight: 30, fontWeight: "600" }}>
          {valor === null ? "A confirmar" : formatarReais(valor)}
        </Texto>
        {valor !== null && aluguel ? (
          <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>
            /mês
          </Texto>
        ) : null}
      </View>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 17 }}>
        {aluguel ? ROTULO_MENSAL_CONHECIDO : custo.principal.rotulo}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 12, lineHeight: 18, marginTop: 4, fontVariant: ["tabular-nums"] }}>
        {aluguel
          ? `${custo.principal.rotulo}: ${custo.principal.valor === null ? "A confirmar" : `${formatarReais(custo.principal.valor)}/mês`}`
          : `${ROTULO_MENSAL_CONHECIDO}: ${custo.totalMensalConhecido === null ? "A confirmar" : `${formatarReais(custo.totalMensalConhecido)}/mês`}`}
      </Texto>
      <Texto tipo="apoio" cor="cor-azul-cadastral" style={{ fontSize: 11.5, lineHeight: 17, marginTop: 2, fontVariant: ["tabular-nums"] }}>
        {`Rotina à parte: ${resumoRotina}/mês`}
      </Texto>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          marginTop: 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: cor("cor-linha"),
        }}
      >
        {bolsoMesSalvo > 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cor("cor-azul-cadastral") }} />
            <Texto tipo="etiqueta" style={{ fontSize: 11.5, fontVariant: ["tabular-nums"] }}>
              {`Bolso ~${formatarReaisCompacto(bolsoMesSalvo)}/mês`}
            </Texto>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: cor(facSalvo.grupoSolar === "Poente" ? "cor-barro" : "cor-salvia"),
            }}
          />
          <Texto
            tipo="etiqueta"
            cor={facSalvo.grupoSolar === "Poente" ? "cor-barro-texto" : "cor-salvia-escura"}
            style={{ fontSize: 11.5 }}
          >
            {`Sol: ${facSalvo.orientacaoSolar}`}
          </Texto>
        </View>
        {partes.alertaMarinha ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cor("cor-barro") }} />
            <Texto tipo="etiqueta" cor="cor-barro-texto" style={{ fontSize: 11.5 }}>
              Terreno da União
            </Texto>
          </View>
        ) : null}
      </View>
      {avisoDeValoresPendentes(custo) ? (
        <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 11, lineHeight: 17 }}>{avisoDeValoresPendentes(custo)}</Texto>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 6 }}>
        <LinkVx rotulo="Preparar visita" tamanho={12} onPress={aoPrepararVisita} acessivel={`Preparar visita de ${analise.nome}`} />
        <LinkVx rotulo="Descartar" seta={false} cor="cor-texto-apoio" tamanho={12} onPress={aoDescartar} acessivel={`Descartar ${analise.nome}`} />
      </View>
    </View>
  );
}

function CartaoDescartado({ analise, aoRestaurar }: { analise: AnaliseV2; aoRestaurar: () => void }) {
  const { cor } = useTema();
  const descarte = analise.descarte;
  if (!descarte) return null;
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: cor("cor-linha"),
        paddingVertical: 12,
        gap: 4,
      }}
    >
      <Texto numberOfLines={2} style={{ fontSize: 14, lineHeight: 20, fontWeight: "600" }}>
        {analise.nome}
      </Texto>
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 17, fontVariant: ["tabular-nums"] }}>
        {`${rotuloDoMotivo(descarte.motivo)} · ${dataDoInstante(descarte.em)}`}
      </Texto>
      {descarte.observacao ? (
        <Texto tipo="apoio" numberOfLines={3} style={{ fontSize: 12, lineHeight: 18, marginTop: 2 }}>
          {descarte.observacao}
        </Texto>
      ) : null}
      <View style={{ marginTop: 8 }}>
        <Botao rotulo="Restaurar" acessivel={`Restaurar ${analise.nome}`} pilula onPress={aoRestaurar} style={{ borderRadius: RAIO.pilula }} />
      </View>
    </View>
  );
}

/** O aviso (toast) vem do provedor da raiz do app (`src/app/_layout.tsx`). */
export default function Salvos() {
  const { cor } = useTema();
  const { lista, pronto, erro, ativa, salvar, definirAtiva } = useAnalises();
  const { perfil: perfilDomicilio } = usePerfilDomicilio();
  const { mostrarAviso } = useAviso();
  const { carteira, pronto: carteiraPronta, bloqueada: carteiraBloqueada } = useCarteira();
  const abrirAnalise = useAbrirAnalise();
  const prepararVisita = usePrepararVisita();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [descartando, setDescartando] = useState<string | null>(null);

  const todos = lista.filter((a) => a.salva && a.descarte === null);
  const salvos = todos.filter((a) => casa(filtro, a));
  const descartados = lista.filter((a) => a.descarte !== null && casa(filtro, a));

  const gravar = async (a: AnaliseV2, aviso: string) => {
    try {
      await salvar(a);
      // `salvar` torna a análise gravada a ativa; remover dos salvos ou restaurar não deve trocar o imóvel que o
      // Dossiê e a Visita estavam mostrando.
      if (ativa !== a.id) await definirAtiva(ativa);
      mostrarAviso(aviso);
    } catch {
      mostrarAviso("Não deu para salvar agora. Tente de novo.");
    }
  };

  // C2: com o extrato, restaurar desfaz a confirmação que o +1 do descarte devolveu (confirmar de novo custa 1 crédito).
  // Sem a carteira lida, o extrato exposto é vazio e o vínculo ficaria confirmado de graça: não restaura.
  const restaurar = (a: AnaliseV2) => {
    if (!carteiraPronta || carteiraBloqueada) {
      mostrarAviso("Não deu para restaurar agora: a carteira de créditos não abriu. Recarregue o app.");
      return;
    }
    const restaurada = restaurarAnalise(a, new Date(), carteira.extrato);
    const pedeConfirmar = restaurada.vinculo.estado !== a.vinculo.estado;
    void gravar(restaurada, pedeConfirmar ? "Imóvel restaurado. Confirme o prédio de novo para abrir o dossiê." : "Imóvel restaurado");
  };

  return (
    <View style={{ flex: 1, backgroundColor: cor("cor-fundo") }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: MARGEM_DA_PAGINA_VX, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <PaginaVx>
          {/* Aviso do caderno (análises guardadas à parte): fica na tela, além do toast da abertura. */}
          <FaixaDoCaderno style={{ marginBottom: 14 }} />

          <CabecalhoVx
            sobretitulo="Sua seleção"
            link={{ rotulo: "Comparar", onPress: () => router.push("/comparar") }}
            titulo="Seus imóveis salvos."
            texto={
              !pronto
                ? "Abrindo suas análises…"
                : todos.length === 0
                  ? "Nenhum imóvel salvo ainda."
                  : `${todos.length} ${todos.length === 1 ? "opção para olhar com calma." : "opções para olhar com calma."}`
            }
          />

          <View style={{ marginBottom: 10 }}>
            <LinkVx
              rotulo={perfilDomicilio.configurado ? "Ajustar perfil da sua casa" : "Personalizar perfil da sua casa"}
              tamanho={12}
              onPress={() => router.push("/perfil-domicilio")}
            />
          </View>

          <SegmentosVx opcoes={FILTROS} valor={filtro} aoMudar={setFiltro} rotulo="Filtrar imóveis salvos" modo="grupo" />

          {erro ? (
            <Texto role="alert" cor="cor-barro-texto" style={{ fontSize: 13, lineHeight: 20, marginBottom: 14 }}>
              {erro}
            </Texto>
          ) : null}

          {pronto && salvos.length > 0
            ? salvos.map((a) => (
                <CartaoSalvo
                  key={a.id}
                  analise={a}
                  perfilDomicilio={perfilDomicilio}
                  aoAbrir={() => void abrirAnalise(a)}
                  aoRemover={() => void gravar({ ...a, salva: false, atualizadaEm: new Date().toISOString() }, "Removido dos salvos")}
                  aoPrepararVisita={() => void prepararVisita(a.id)}
                  aoDescartar={() => setDescartando(a.id)}
                />
              ))
            : null}

          {pronto && salvos.length === 0 ? (
            <VazioVx
              titulo={todos.length ? "Nenhum imóvel neste filtro." : "Sua próxima opção começa aqui."}
              texto={
                todos.length
                  ? "Veja todos os seus salvos ou explore outras opções."
                  : "Salve os imóveis que chamarem sua atenção para reunir notas e preparar visitas."
              }
            >
              {todos.length ? (
                <BotaoVx rotulo="Ver todos os salvos" onPress={() => setFiltro("todos")} />
              ) : (
                <BotaoVx rotulo="Explorar imóveis" onPress={() => router.push("/")} />
              )}
            </VazioVx>
          ) : null}

          {pronto && descartados.length > 0 ? (
            <View style={{ marginTop: 27 }}>
              <Texto tipo="titulo-tela" role="heading" aria-level={2} style={{ fontSize: 23, lineHeight: 28, fontWeight: "500", letterSpacing: -0.6, marginBottom: 6 }}>
                Descartados
              </Texto>
              <Texto cor="cor-texto-apoio" style={{ fontSize: 13, lineHeight: 21, marginBottom: 15 }}>
                Ficam fora do Explorar e do Comparar. Restaurar traz o imóvel de volta e não mexe nos seus créditos.
              </Texto>
              {descartados.map((a) => (
                <CartaoDescartado
                  key={a.id}
                  analise={a}
                  aoRestaurar={() => restaurar(a)}
                />
              ))}
            </View>
          ) : null}

        </PaginaVx>
      </ScrollView>

      {/* Fora da rolagem: a gaveta ancora na tela, não no fim do conteúdo. */}
      <GavetaDeDescarte
        analiseId={descartando ?? ""}
        visivel={descartando !== null}
        aoFechar={() => setDescartando(null)}
        aoDescartar={() => setDescartando(null)}
      />
    </View>
  );
}
