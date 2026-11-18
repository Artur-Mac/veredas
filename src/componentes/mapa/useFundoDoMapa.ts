// O gancho comum de todos os mapas do app para o mapa-base: dado o quadro de um mapa, carrega os arquivos de que ele
// precisa (sistema de camadas, D036) e entrega a cena pronta para <FundoDoMapa>.
//
// Regras (plano de 18/11/2026):
// - Nunca bloqueia a tela: enquanto carrega, o mapa que hospeda desenha como desenhava antes, sem o fundo.
// - Carga em dois tempos: primeiro só o arquivo do bairro do imóvel; se o quadro sai da borda de 300 m dele, os bairros
//   cuja caixa toca o quadro e o arquivo da cidade. No nível de cidade (quadro de mais de ~3 km) só a cidade e o bairro do
//   imóvel: a cena não usa quadras de longe.
// - Arquivo que falta ou não confere vira `falhou`: o mapa fica sem fundo e oferece tentar de novo, nunca um dado parecido.
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { ouvirCamadas } from "../../dados/camadas";
import { METROS_POR_GRAU } from "../../dados/recife/mapaBaseContrato";
import { arquivoDaCidade, arquivoDoMapaBase, arquivosDoMapaBaseParaOQuadro, mapaBaseDaCidade, mapaBaseDoBairro, type CaixaEmGraus } from "../../dados/recife/mapaBase";
import type { MapaBaseDoBairro } from "../../dados/recife/mapaBaseContrato";
import { useCamadas } from "../EsperaDasCamadas";
import { montarFundoDoMapa, nivelDaEscala, type CenaDoFundo, type ImovelDoFundo, type QuadroDoFundo } from "./fundoDoMapaCena";

export type PedidoDoFundo = {
  /** Slug do bairro do imóvel; null quando não se sabe (carrega os bairros cuja caixa toca o quadro). */
  readonly bairro: string | null;
  readonly imovel: ImovelDoFundo | null;
  /**
   * O quadro do mapa que hospeda. `paraDesenho` tem de ter identidade estável entre renders (useMemo/useCallback):
   * a cena é remontada quando ela muda. Os demais campos são comparados por valor.
   */
  readonly quadro: QuadroDoFundo;
  /** Caixa [oeste, sul, leste, norte], em graus, do quadro inteiro na escala 1 (o que a pessoa alcança arrastando). */
  readonly caixa: CaixaEmGraus;
  /** false: não carrega nem monta (mapa fechado, ou modo que não usa o fundo). */
  readonly ativo?: boolean;
  /**
   * true: enquanto um quadro novo carrega ou monta, entrega a última cena pronta (estado `carregando`, `cena` não nula),
   * para o mapa não piscar sem fundo a cada passo de zoom. Padrão false: `carregando` vem sem cena, como sempre foi.
   */
  readonly manterAnterior?: boolean;
};

/**
 * - `desligado`: `ativo` é false.
 * - `sem-cobertura`: não há arquivo para este quadro, ou a cena montada não tem dado nenhum (quadro fora do Recife).
 * - `carregando`, `falhou`, `pronta`: como nas outras camadas. A cena só existe em `pronta` (e em `carregando` com
 *   `manterAnterior`: a cena anterior).
 */
export type EstadoDoFundo = "desligado" | "sem-cobertura" | "carregando" | "falhou" | "pronta";

export type FundoDoMapaCarregado = {
  readonly estado: EstadoDoFundo;
  readonly cena: CenaDoFundo | null;
  readonly tentarDeNovo: () => void;
};

// Relógio das camadas: muda a cada arquivo que chega ou falha. `arquivosDoMapaBaseParaOQuadro` olha o que já está em
// memória, então o plano de carga tem de ser refeito quando isso muda. Este ouvinte é registrado antes dos do React e,
// por isso, o relógio já andou quando o React relê.
let relogio = 0;
ouvirCamadas(() => {
  relogio += 1;
});
const lerRelogio = (): number => relogio;

const semAcao = (): void => undefined;
const DESLIGADO: FundoDoMapaCarregado = { estado: "desligado", cena: null, tentarDeNovo: semAcao };
const SEM_ARQUIVOS: readonly string[] = [];

/** Metros por pixel na tela (já contando o zoom) de um quadro cuja caixa em graus é `caixa`. */
export function metrosPorPixelDoQuadro(caixa: CaixaEmGraus, largura: number, zoom = 1): number {
  const latMedia = (caixa[1] + caixa[3]) / 2;
  const metros = (caixa[2] - caixa[0]) * METROS_POR_GRAU * Math.cos((latMedia * Math.PI) / 180);
  return largura > 0 && zoom > 0 ? metros / largura / zoom : Number.POSITIVE_INFINITY;
}

/** Os arquivos que o quadro pede agora e se a lista já é a definitiva (ver a carga em dois tempos). Função pura. */
export function planoDeCargaDoFundo(bairro: string | null, caixa: CaixaEmGraus, largura: number, zoom = 1): { arquivos: string[]; completo: boolean } {
  try {
    return planoSemProtecao(bairro, caixa, largura, zoom);
  } catch {
    // O arquivo do bairro em memória foi recusado: pede só ele, e a montagem falha e oferece tentar de novo.
    const doBairro = arquivoDoMapaBase(bairro);
    return { arquivos: doBairro ? [doBairro] : [], completo: true };
  }
}

function planoSemProtecao(bairro: string | null, caixa: CaixaEmGraus, largura: number, zoom: number): { arquivos: string[]; completo: boolean } {
  if (nivelDaEscala(metrosPorPixelDoQuadro(caixa, largura, zoom)) === "cidade") {
    const arquivos = [arquivoDoMapaBase(bairro), arquivoDaCidade()].filter((a): a is string => a !== null);
    return { arquivos, completo: true };
  }
  return arquivosDoMapaBaseParaOQuadro({ bairro, caixa });
}

function slugDoArquivo(caminho: string): string {
  return (caminho.split("/").pop() ?? "").replace(/\.json$/, "");
}

export function useFundoDoMapa(pedido: PedidoDoFundo): FundoDoMapaCarregado {
  const { bairro, imovel, quadro, caixa } = pedido;
  const ativo = pedido.ativo !== false;
  const zoom = quadro.zoom ?? 1;
  const [oeste, sul, leste, norte] = caixa;

  const tique = useSyncExternalStore(ouvirCamadas, lerRelogio, lerRelogio);
  // Cada "tentar de novo" refaz o plano, a leitura e a montagem (o arquivo recusado não fica guardado em memória).
  const [tentativa, setTentativa] = useState(0);
  const plano = useMemo(
    () => (ativo ? planoDeCargaDoFundo(bairro, [oeste, sul, leste, norte], quadro.largura, zoom) : { arquivos: [] as string[], completo: true }),
    // `tique` entra de propósito: o plano depende do que já está em memória.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ativo, bairro, oeste, sul, leste, norte, quadro.largura, zoom, tique, tentativa],
  );
  const { estado, tentarDeNovo: tentarAsCamadas } = useCamadas(ativo ? plano.arquivos : SEM_ARQUIVOS);
  const tentarDeNovo = useCallback(() => {
    setTentativa((n) => n + 1);
    tentarAsCamadas();
  }, [tentarAsCamadas]);

  const centroLon = imovel?.centro[0] ?? null;
  const centroLat = imovel?.centro[1] ?? null;
  const codigo = imovel?.codigoDoLogradouro ?? null;
  const chaveDosObstaculos = JSON.stringify(quadro.obstaculos ?? []);
  const dx = quadro.deslocamento?.[0] ?? 0;
  const dy = quadro.deslocamento?.[1] ?? 0;
  const pronto = ativo && estado === "pronta" && plano.completo && plano.arquivos.length > 0;
  const chaveDosArquivos = plano.arquivos.join("\n");

  const montada = useMemo((): { cena: CenaDoFundo | null; falhou: boolean } => {
    if (!pronto) return { cena: null, falhou: false };
    try {
      const cidadeArquivo = arquivoDaCidade();
      const arquivos = chaveDosArquivos ? chaveDosArquivos.split("\n") : [];
      const bairros: MapaBaseDoBairro[] = [];
      for (const a of arquivos) {
        if (a === cidadeArquivo) continue;
        const mapa = mapaBaseDoBairro(slugDoArquivo(a));
        if (mapa) bairros.push(mapa);
      }
      const cidade = cidadeArquivo && arquivos.includes(cidadeArquivo) ? mapaBaseDaCidade() : null;
      const cena = montarFundoDoMapa({
        bairros,
        cidade,
        bairroDoImovel: bairro,
        imovel: centroLon !== null && centroLat !== null ? { centro: [centroLon, centroLat], codigoDoLogradouro: codigo } : null,
        quadro: {
          largura: quadro.largura,
          altura: quadro.altura,
          paraDesenho: quadro.paraDesenho,
          zoom,
          obstaculos: JSON.parse(chaveDosObstaculos) as [number, number, number, number][],
          deslocamento: [dx, dy],
        },
      });
      return { cena, falhou: false };
    } catch {
      // Arquivo inválido ou de outra versão: a leitura recusa. O mapa fica sem fundo, como em qualquer falha de carga.
      return { cena: null, falhou: true };
    }
    // `tentativa` entra de propósito: tentar de novo relê e remonta mesmo com a mesma entrada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, chaveDosArquivos, bairro, centroLon, centroLat, codigo, quadro.largura, quadro.altura, quadro.paraDesenho, zoom, chaveDosObstaculos, dx, dy, tentativa]);

  // A última cena pronta, para `manterAnterior` (estado ajustado durante o render, o padrão do React para "valor anterior").
  const [anterior, setAnterior] = useState<CenaDoFundo | null>(null);
  const cenaPronta = ativo && plano.arquivos.length > 0 && estado !== "falhou" && !montada.falhou && pronto && montada.cena?.temDado ? montada.cena : null;
  if (cenaPronta && cenaPronta !== anterior) setAnterior(cenaPronta);

  if (!ativo) return DESLIGADO;
  if (plano.arquivos.length === 0) return { estado: "sem-cobertura", cena: null, tentarDeNovo };
  if (estado === "falhou" || montada.falhou) return { estado: "falhou", cena: null, tentarDeNovo };
  if (!pronto || !montada.cena) return { estado: "carregando", cena: pedido.manterAnterior ? anterior : null, tentarDeNovo };
  if (!montada.cena.temDado) return { estado: "sem-cobertura", cena: null, tentarDeNovo };
  return { estado: "pronta", cena: montada.cena, tentarDeNovo };
}
