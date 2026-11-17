// Aba "Rotina" do Comparar (VE05.03): tempo porta a porta programado de ônibus/metrô dos dois imóveis até um destino
// salvo (bairro do perfil da casa ou destino com posição do caderno), em dia útil, sábado e volta tarde. O cálculo roda
// no aparelho, aos poucos (um cenário por vez), e fica em cache enquanto o app está aberto.
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { bairroPorSlug } from "../../dados/recife/bairros";
import { AREAS_POR_CAMADA, nomesDasAreas } from "../../dados/recife/coberturaDasCamadas";
import { centroideDoBairro } from "../../dados/recife/referenciasPublicas";
import {
  CENARIOS,
  NOTA_DO_TRANSITO,
  ULTIMA_SAIDA,
  acessoDoPredio,
  avaliarCenario,
  diferencaMensalHoras,
  frasesDaJornada,
  gradeDoTransito,
  horaDe,
  resumoDoCenario,
  rotuloDaData,
  type DestinoDaRotina,
  type IdDoCenario,
  type ResultadoDoCenario,
} from "../../dados/recife/transito";
import type { PerfilDoDomicilio } from "../../estado/PerfilDomicilio";
import { Texto } from "../Texto";
import type { Par } from "./comparar";
import { Destaque, LinhaDeDois, PAINEL } from "./Paineis";
import { LinkVx, SegmentosVx, SuperficieVx } from "./vx";
import { fraseDaDominancia, naoDominadas, ondeMaisProcurar, trocaCustoTempo, type Criterio } from "../../dados/escolha";
import { procura } from "../../dados/recife/procura";

/** Destinos salvos: o bairro do perfil da casa e os destinos com posição (≤ 100 m) dos cadernos dos dois imóveis. */
export function destinosSalvos(perfil: PerfilDoDomicilio, par: Par<AnaliseV2>): DestinoDaRotina[] {
  const out: DestinoDaRotina[] = [];
  const c = centroideDoBairro(perfil.destinoBairro);
  if (perfil.destinoBairro && c) {
    out.push({ id: `bairro:${perfil.destinoBairro}`, rotulo: `centro do bairro ${(bairroPorSlug(perfil.destinoBairro)?.nome ?? perfil.destinoBairro).replace(/\s*\(bairro\)$/, "")}`, lon: c[0], lat: c[1], aproximado: true });
  }
  const vistos = new Set<string>();
  for (const a of par) for (const d of a.caderno?.destinos ?? []) {
    const p = d.posicao;
    if (!p || p.precisaoM === null || p.precisaoM > 100 || vistos.has(d.id)) continue;
    vistos.add(d.id);
    out.push({ id: `caderno:${d.id}`, rotulo: d.apelido, lon: p.longitude, lat: p.latitude, aproximado: false });
  }
  return out.slice(0, 4);
}

const cache = new Map<string, ResultadoDoCenario>();
function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Props = {
  par: Par<AnaliseV2>;
  edificios: Par<Edificio | null>;
  rotulos: Par<string>;
  perfil: PerfilDoDomicilio;
  aoAbrirPerfilDomicilio: () => void;
  /** Custo mensal conhecido e parcelas a confirmar de cada lado (VE11: troca custo × tempo). */
  custos?: Par<{ mensal: number | null; pendentes: number }>;
  /** Data local de referência (testes). */
  hoje?: string;
};

export function PainelDeRotina({ par, edificios, rotulos, perfil, aoAbrirPerfilDomicilio, custos, hoje = hojeLocal() }: Props) {
  const destinos = useMemo(() => destinosSalvos(perfil, par), [perfil, par]);
  const [destinoId, setDestinoId] = useState<string | null>(null);
  const destino = destinos.find((d) => d.id === destinoId) ?? destinos[0] ?? null;
  const acessos = useMemo(() => edificios.map((e) => acessoDoPredio(e?.bairro, e?.id)) as Par<ReturnType<typeof acessoDoPredio>>, [edificios]);
  const chaveDe = (i: 0 | 1, c: IdDoCenario, d: DestinoDaRotina | null = destino) => `${d?.id}|${edificios[i]?.id}|${hoje}|${c}`;
  const [, setVersao] = useState(0);

  // Um cenário por vez, cedendo a vez à interface entre eles.
  useEffect(() => {
    if (!destino) return;
    const pendentes: [0 | 1, IdDoCenario, DestinoDaRotina][] = [];
    for (const i of [0, 1] as const) {
      const a = acessos[i];
      if (a.estado !== "rede") continue;
      for (const c of CENARIOS) if (!cache.has(chaveDe(i, c.id))) pendentes.push([i, c.id, destino]);
    }
    // VE11: com mais de um destino, a ida de dia útil para cada um (para ver se alguma opção ganha em tudo).
    for (const d of destinos) if (d.id !== destino.id) for (const i of [0, 1] as const) if (acessos[i].estado === "rede" && !cache.has(chaveDe(i, "util_ida", d))) pendentes.push([i, "util_ida", d]);
    if (!pendentes.length) return;
    let ativo = true;
    let espera: ReturnType<typeof setTimeout> | null = null;
    const proximo = () => {
      const item = pendentes.shift();
      if (!ativo || !item) return;
      const [i, c, d] = item;
      const a = acessos[i];
      if (a.estado === "rede") cache.set(chaveDe(i, c, d), avaliarCenario(a.origens, edificios[i]?.centro ?? null, d, c, hoje));
      setVersao((v) => v + 1);
      espera = setTimeout(proximo, 0);
    };
    espera = setTimeout(proximo, 0);
    return () => { ativo = false; if (espera) clearTimeout(espera); };
    // chaveDe depende só de destino, edifícios e hoje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino, destinos, acessos, edificios, hoje]);

  const g = gradeDoTransito();
  if (!destino) {
    return (
      <SuperficieVx style={PAINEL}>
        <Destaque sobretitulo="Rotina por horário" destaque="Para onde você vai?" legenda="Escolha no perfil da casa o bairro onde você trabalha ou estuda, ou registre um destino com posição no caderno do imóvel." texto />
        <LinkVx rotulo="Abrir perfil da casa" onPress={aoAbrirPerfilDomicilio} />
      </SuperficieVx>
    );
  }
  const resultado = (i: 0 | 1, c: IdDoCenario): ResultadoDoCenario | null => cache.get(chaveDe(i, c)) ?? null;
  const celula = (i: 0 | 1, c: IdDoCenario) => {
    const a = acessos[i];
    if (a.estado === "fora_do_piloto") return { texto: "—", detalhe: `Horário porta a porta só em ${nomesDasAreas(AREAS_POR_CAMADA.horarios)}.` };
    if (a.estado === "sem_ligacao") return { texto: "—", detalhe: "Entrada do prédio ainda não confirmada no mapa." };
    const r = resultado(i, c);
    if (!r) return { texto: "…", detalhe: "Calculando" };
    const s = resumoDoCenario(r);
    return { texto: s.valor, detalhe: s.detalhe };
  };
  const dataDe = (c: IdDoCenario) => {
    for (const i of [0, 1] as const) { const r = resultado(i, c); if (r && "data" in r && r.data) return rotuloDaData(r.data); }
    return null;
  };
  const r2 = (c: IdDoCenario) => [resultado(0, c) ?? { estado: "sem_grade" as const }, resultado(1, c) ?? { estado: "sem_grade" as const }] as Par<ResultadoDoCenario>;
  const dif = diferencaMensalHoras(r2("util_ida"), r2("util_volta"), perfil.diasPresenciaisMes);
  const horas = dif === null ? null : Math.round(Math.abs(dif) * 2) / 2;
  const destaque = horas === null
    ? { d: "Ônibus e metrô, porta a porta.", l: `Nos horários programados. Destino: ${destino.rotulo}.`, texto: true }
    : horas < 1
      ? { d: "Quase igual no mês.", l: `Ida 7h–8h e volta 18h–19h em ${perfil.diasPresenciaisMes} dias por mês (perfil da casa): menos de 1 h de diferença. Destino: ${destino.rotulo}.`, texto: true }
      : { d: `${String(horas).replace(".", ",")} h/mês`, l: `${rotulos[dif! > 0 ? 0 : 1]} gasta menos no trajeto: ida 7h–8h e volta 18h–19h em ${perfil.diasPresenciaisMes} dias por mês (perfil da casa). Destino: ${destino.rotulo}.`, texto: false };
  const ultima = (i: 0 | 1) => {
    if (acessos[i].estado !== "rede") return { texto: "—", detalhe: null };
    const r = resultado(i, "tarde");
    if (!r) return { texto: "…", detalhe: "Calculando" };
    if (r.estado !== "ok" || !r.ultima) return { texto: "—", detalhe: "Nenhuma volta de ônibus em até 1h30 saindo depois das 21h." };
    if (r.ultimaAteOFim) return { texto: "Madrugada", detalhe: `ainda há volta saindo às ${horaDe(ULTIMA_SAIDA)}; chega ${horaDe(r.ultima.chegada)}` };
    return { texto: horaDe(r.ultima.saida), detalhe: `última saída com volta em até 1h30; chega ${horaDe(r.ultima.chegada)}` };
  };
  return (
    <SuperficieVx style={PAINEL}>
      <Destaque sobretitulo="Rotina por horário" destaque={destaque.d} legenda={destaque.l} texto={destaque.texto} />
      {destinos.length > 1 ? (
        <SegmentosVx opcoes={destinos.map((d) => ({ valor: d.id, rotulo: d.rotulo.length > 22 ? `${d.rotulo.slice(0, 21)}…` : d.rotulo }))} valor={destino.id} aoMudar={setDestinoId} rotulo="Destino da rotina" modo="grupo" margemInferior={8} />
      ) : null}
      {!g ? (
        <Texto role="alert" cor="cor-barro-texto" style={{ fontSize: 13, lineHeight: 20, paddingVertical: 15 }}>
          A grade de horários não abriu neste aparelho.
        </Texto>
      ) : (
        <>
          {CENARIOS.map((c, k) => (
            <LinhaDeDois key={c.id} primeira={k === 0} rotulo={`${c.rotulo}${dataDe(c.id) ? ` · ${dataDe(c.id)}` : ""}`} colunas={rotulos} celulas={[celula(0, c.id), celula(1, c.id)]} />
          ))}
          <LinhaDeDois rotulo="Última volta útil, dia útil (saindo das 21h às 02h)" colunas={rotulos} celulas={[ultima(0), ultima(1)]} />
          <View style={{ gap: 10, marginTop: 6 }}>
            {([0, 1] as const).map((i) => {
              const r = resultado(i, "util_ida");
              if (!r || r.estado !== "ok" || r.soAPe) return null;
              return (
                <View key={i} accessible accessibilityLabel={`Como seria, ${rotulos[i]}: ${frasesDaJornada(r.tipica).join(". ")}`}>
                  <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 16 }}>{`Dia útil, ida típica · ${rotulos[i]}`}</Texto>
                  <Texto style={{ fontSize: 13, lineHeight: 19 }}>{frasesDaJornada(r.tipica).join(" → ")}.</Texto>
                </View>
              );
            })}
          </View>
          <ParaDecidir rotulos={rotulos} perfil={perfil} custos={custos} destino={destino} destinos={destinos} edificios={edificios}
            resultado={(i, c, d) => cache.get(chaveDe(i, c, d)) ?? null} aluguel={par[0].modalidade === "aluguel"} />
        </>
      )}
      {perfil.modoTransporte !== "transporte_publico" ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 17, marginTop: 12 }}>
          Seu perfil da casa diz que você não usa ônibus no dia a dia; estes horários servem para os dias em que precisar.
        </Texto>
      ) : null}
      <Texto tipo="apoio" cor="cor-texto-apoio" style={{ fontSize: 11, lineHeight: 18, marginTop: 15 }}>
        {`${NOTA_DO_TRANSITO}${destino.aproximado ? " O centro do bairro é um destino aproximado." : ""}${g?.bruta.feed.versao ? ` Grade ${g.bruta.feed.versao}.` : ""}`}
      </Texto>
    </SuperficieVx>
  );
}

// ——— VE11: para decidir quando não há vencedor óbvio ————————————————————————————————————————————

type PropsDoDecidir = {
  rotulos: Par<string>; perfil: PerfilDoDomicilio; custos?: Par<{ mensal: number | null; pendentes: number }>; destino: DestinoDaRotina; destinos: DestinoDaRotina[];
  edificios: Par<Edificio | null>; resultado: (i: 0 | 1, c: IdDoCenario, d: DestinoDaRotina) => ResultadoDoCenario | null; aluguel: boolean;
};
const mediana = (r: ResultadoDoCenario | null) => (r && r.estado === "ok" ? r.mediana / 60 : null);

function ParaDecidir({ rotulos, perfil, custos, destino, destinos, edificios, resultado, aluguel }: PropsDoDecidir) {
  const blocos: { titulo: string; linhas: string[] }[] = [];
  // Custo × tempo (aluguel: custo mensal conhecido contra ida + volta em dias úteis).
  if (aluguel && custos) {
    const ida = ([0, 1] as const).map((i) => mediana(resultado(i, "util_ida", destino)));
    const volta = ([0, 1] as const).map((i) => mediana(resultado(i, "util_volta", destino)));
    const porDia = [0, 1].map((i) => (ida[i] !== null && volta[i] !== null ? ida[i]! + volta[i]! : null)) as Par<number | null>;
    if (porDia.every((x) => x !== null)) {
      const t = trocaCustoTempo(rotulos, [custos[0].mensal, custos[1].mensal], [custos[0].pendentes, custos[1].pendentes], porDia, perfil.diasPresenciaisMes);
      blocos.push({ titulo: "Custo × tempo", linhas: t.tipo === "troca" ? [t.frase, t.limiar] : [t.frase] });
    }
  }
  // Mais de um destino: alguma opção ganha em tudo?
  if (destinos.length >= 2) {
    const crit: Criterio[] = destinos.map((d) => ({ nome: `ida até ${d.rotulo}`, valores: [0, 1].map((i) => mediana(resultado(i as 0 | 1, "util_ida", d))), menorMelhor: true, tolerancia: 2 }));
    if (aluguel && custos) crit.unshift({ nome: "custo mensal conhecido", valores: [custos[0].mensal, custos[1].mensal], menorMelhor: true, tolerancia: 20 });
    if (crit.every((c) => c.valores.some((v) => v !== null))) blocos.push({ titulo: "Com todos os destinos", linhas: [fraseDaDominancia(rotulos, naoDominadas(rotulos, crit))] });
  }
  // Onde mais procurar: ruas do piloto com ida das 7h até o bairro de destino tão curta quanto a melhor das duas.
  const p = destino.aproximado ? procura() : null;
  const slug = destino.id.startsWith("bairro:") ? destino.id.slice(7) : null;
  const melhor = Math.min(...([0, 1] as const).map((i) => mediana(resultado(i, "util_ida", destino)) ?? Infinity));
  if (p && slug && Number.isFinite(melhor)) {
    const ateMin = Math.round(melhor);
    const r = ondeMaisProcurar(p.ruas, p.bairros, slug, ateMin, edificios.map((e) => e?.id.split("-")[0] ?? "").filter(Boolean));
    if (r.estado === "ok") blocos.push({ titulo: `Onde mais procurar (ida das 7h até ${ateMin} min)`, linhas: [
      ...r.ruas.map((x) => `${tituloDaRua(x.n)} (${bairroPorSlug(x.b)?.nome ?? x.b}) · ${x.minutos} min · mercado a até 10 min a pé em ${Math.round(x.m10 * 100)}% dos prédios`),
      `${r.total > r.ruas.length ? `Mais ${r.total - r.ruas.length} ruas também cabem. ` : ""}Só ruas de ${nomesDasAreas(AREAS_POR_CAMADA.horarios)}; preço e anúncios disponíveis não entram: procure anúncios nessas ruas no portal que você usa.`,
    ] });
    else if (r.estado === "nenhuma") blocos.push({ titulo: "Onde mais procurar", linhas: [`Nenhuma outra rua de ${nomesDasAreas(AREAS_POR_CAMADA.horarios)} tem ida das 7h até ${ateMin} min para ${destino.rotulo}.`] });
  }
  if (!blocos.length) return null;
  return (
    <View style={{ gap: 14, marginTop: 18 }}>
      {blocos.map((b) => (
        <View key={b.titulo} style={{ gap: 6 }} role="group" aria-label={b.titulo}>
          <Texto tipo="apoio" cor="cor-barro-texto" style={{ fontSize: 11, lineHeight: 16, fontWeight: "600" }}>{b.titulo}</Texto>
          <View role="list" style={{ gap: 6 }}>
            {b.linhas.map((l) => <View key={l} role="listitem"><Texto style={{ fontSize: 13, lineHeight: 19 }}>{l}</Texto></View>)}
          </View>
        </View>
      ))}
    </View>
  );
}

const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e"]);
/** "RUA CONSELHEIRO PORTELA" → "Rua Conselheiro Portela" (o índice guarda em caixa alta). */
const ABREVIACOES: Record<string, string> = { av: "Avenida", r: "Rua", est: "Estrada", tv: "Travessa", pca: "Praça", al: "Alameda", lgo: "Largo", vl: "Vila", cais: "Cais" };
export function tituloDaRua(n: string): string {
  return n.toLowerCase().split(/\s+/).map((p, i) => (i === 0 && ABREVIACOES[p] ? ABREVIACOES[p] : i > 0 && MINUSCULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(" ");
}
