// Checagens da visita derivadas do risco do prédio (15/11/2026): no máximo 3, no topo do roteiro, cada uma com o porquê
// em números do dossiê. Sem nota: só o que conferir no local.
// 1. Cota baixa, canal perto ou pedidos de drenagem ao 156 → garagem e comporta;
// 2. Prédio com mais de 25 anos (e condomínio/m² bem abaixo dos pares da sua amostra, quando houver) → pressão da água e fachada;
// 3. Internet: o teste no cômodo (Conectividade no local), se o caderno ainda não tem medição.
import type { AnaliseV2, Edificio, Pergunta } from "../contratos";
import { lerRuaDoEdificio } from "../dossie/rua";
import type { ComparacaoDoCondominio } from "../dossie/fichaViva";

export const MAX_CHECAGENS = 3;
export type EntradaDasChecagens = {
  analise: AnaliseV2;
  predio: Edificio | null;
  relevo: { altitudeM: number | null; cursoDaguaMaisProximo: { nome: string; distanciaM: number } | null } | null;
  condominio: ComparacaoDoCondominio | null;
  anoAtual: number;
};

const pergunta = (id: string, titulo: string, pista: string, textoParaMensagem: string): Pergunta =>
  ({ id: `risco-${id}`, titulo, pista, textoParaMensagem, origem: "achado", prioridade: "conforto" });

export function checagensDoRisco(x: EntradaDasChecagens): Pergunta[] {
  const out: Pergunta[] = [];
  const { predio, relevo } = x;
  const drenagem = predio?.rua ? lerRuaDoEdificio(predio.rua).pedidos156.drenagem[0] : null;
  const motivos: string[] = [];
  if (relevo?.altitudeM != null && relevo.altitudeM <= 5) motivos.push(`cota ~${relevo.altitudeM.toFixed(1).replace(".", ",")} m`);
  if (relevo?.cursoDaguaMaisProximo && relevo.cursoDaguaMaisProximo.distanciaM <= 200) motivos.push(`${relevo.cursoDaguaMaisProximo.nome} a ${relevo.cursoDaguaMaisProximo.distanciaM} m`);
  if (drenagem !== null && drenagem >= 3) motivos.push(`${drenagem} pedidos de drenagem ao 156 em 12 meses`);
  if (motivos.length) {
    out.push(pergunta("agua", "Garagem e comporta: a água da rua entra?", `Olhe o nível da garagem e os ralos. Por quê: ${motivos.join(", ")}`,
      "A garagem fica acima do nível da rua? Há comporta, ralo com válvula ou bomba? A rua ou a garagem já encheram em chuva forte com maré alta?"));
  }
  const idade = predio?.anoConstrucao ? x.anoAtual - predio.anoConstrucao : null;
  if (idade !== null && idade > 25) {
    const baixo = x.condominio?.estado === "ok" && x.condominio.desvio !== null && x.condominio.desvio < -1.5;
    out.push(pergunta("idade", "Pressão da água e fachada", `Abra torneira e chuveiro juntos; olhe fissuras e reboco. Por quê: prédio de ${idade} anos${baixo ? "; condomínio/m² bem abaixo dos pares da sua amostra" : ""}`,
      "Quando foi a última obra de fachada e de impermeabilização? Quanto há no fundo de reserva?"));
  }
  const medidas = x.analise.caderno?.conectividade?.length ?? 0;
  if (!medidas) {
    out.push(pergunta("internet", "Internet no cômodo onde você vai usar", "Teste Wi-Fi e 4G/5G e registre em Conectividade no local. Por quê: ainda não há teste no caderno",
      "Quais operadoras de fibra atendem o prédio? O sinal de celular pega bem dentro do apartamento?"));
  }
  return out.slice(0, MAX_CHECAGENS);
}
