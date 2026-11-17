// Confirmar o prédio de uma análise (tela "Prédio" e cartão do anúncio, 15/11/2026). Grava o vínculo, decide o período do
// IPTU do anúncio contra o cadastro, completa rua e número pelo cadastro quando o anúncio não trouxe e cobra 1 crédito
// (só na primeira confirmação). Se a cobrança não acontecer, desfaz o vínculo.
import { useEffect, useRef, useState } from "react";
import type { AnaliseV2, Edificio } from "../../dados/contratos";
import { textoDoCampo } from "../../dados/extrator/nomeEFotos";
import { resolverIptuNaConfirmacao } from "../../dados/iptuDoAnuncio";
import { indiceDoBairro } from "../../dados/recife/indice";
import type { SlugCoberto } from "../../dados/recife/bairros";
import { useAnalises } from "../../estado/Analises";
import { useCarteira } from "../../estado/Carteira";

/** A análise como fica ao confirmar o prédio (pura, testável). */
export function analiseConfirmada(analise: AnaliseV2, edificio: Edificio, geradoEm: string, agora: string): AnaliseV2 {
  const comIptu = resolverIptuNaConfirmacao(analise, edificio);
  const semRua = !textoDoCampo(analise.logradouro);
  return {
    ...comIptu,
    // O anúncio sem endereço (ou com "$undefined" de leituras antigas) passa a ter o endereço do cadastro.
    logradouro: semRua ? edificio.logradouro : analise.logradouro,
    numero: semRua || !textoDoCampo(analise.numero) ? edificio.numero : analise.numero,
    atualizadaEm: agora,
    vinculo: { estado: "confirmado", edificioId: edificio.id, dsqfl: edificio.dsqfl, confirmadoEm: agora, indiceGeradoEm: geradoEm },
  };
}

export type ResultadoDaConfirmacao = "ok" | "sem_credito" | "carteira_bloqueada" | "erro";

export function useConfirmarPredio() {
  const { salvar } = useAnalises();
  const { saldo, debitarDossie, bloqueada, erro: erroDaCarteira } = useCarteira();
  const [trabalhando, setTrabalhando] = useState(false);
  /** Trava de toque duplo: o estado só muda no próximo quadro e dois toques seguidos cobrariam duas vezes. */
  const ocupado = useRef(false);
  // A confirmação costuma terminar com a tela já trocada (preparo → dossiê): não mexe em estado de tela desmontada.
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  const confirmar = async (analise: AnaliseV2, edificio: Edificio, bairro: SlugCoberto): Promise<ResultadoDaConfirmacao> => {
    if (ocupado.current) return "erro";
    const jaConfirmado = analise.vinculo.estado === "confirmado";
    if (!jaConfirmado && bloqueada) return "carteira_bloqueada";
    if (!jaConfirmado && saldo <= 0) return "sem_credito";
    ocupado.current = true;
    setTrabalhando(true);
    try {
      const agora = new Date().toISOString();
      await salvar(analiseConfirmada(analise, edificio, indiceDoBairro(bairro).geradoEm, agora));
      if (!jaConfirmado) {
        let debitou = false;
        try {
          debitou = await debitarDossie(analise.id);
        } finally {
          if (!debitou) await salvar(analise);
        }
        if (!debitou) return "sem_credito";
      }
      return "ok";
    } catch {
      return "erro";
    } finally {
      ocupado.current = false;
      if (montado.current) setTrabalhando(false);
    }
  };

  return { confirmar, trabalhando, erroDaCarteira, saldo };
}
