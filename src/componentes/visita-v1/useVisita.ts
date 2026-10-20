// Estado da visita em andamento (Fatia 5): grava em `analise.visita` por `salvar`, mantém o cronômetro e junta
// em uma só gravação o que a pessoa digita (notas, orientação). Nada aqui calcula custo nem lê o índice.
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { AnaliseV2, Visita } from "../../dados/contratos";
import {
  MAX_NOTAS,
  MAX_SEGUNDOS,
  adicionarPropria,
  alternarVerificada,
  definirResposta,
  limitarGraus,
  segundosDoRelogio,
} from "./logica";

/** Espera depois da última digitação ou do último ajuste antes de gravar. */
const ATRASO_DO_RASCUNHO_MS = 600;
/** Com o cronômetro correndo, grava o tempo somado a cada 30 s: se o aparelho fechar o app, perde-se pouco. */
const INTERVALO_DO_PONTO_DE_CONTROLE_MS = 30_000;

export const AVISO_DE_FALHA_AO_SALVAR = "Não foi possível salvar a visita neste aparelho. Tente de novo.";

type Relogio = { inicio: number; base: number };
/** A visita local (à frente do que está guardado, enquanto a gravação não termina) e a quem ela pertence. */
type Local = { id: string; visita: Visita };
type NotasLocais = { id: string; texto: string };
type Rascunho = { notas?: string; orientacaoGraus?: number | null };

const temPendencia = (r: Rascunho) => r.notas !== undefined || r.orientacaoGraus !== undefined;

type Parametros = {
  analise: AnaliseV2 | null;
  salvar: (a: AnaliseV2) => Promise<void>;
  aoFalhar: (mensagem: string) => void;
};

export type ControleDaVisita = {
  visita: Visita | null;
  /** Texto das notas como a pessoa digitou, antes de gravar. */
  notas: string;
  rodando: boolean;
  /** Segundos da visita, incluindo o cronômetro em andamento. */
  segundos: number;
  alternarCronometro: () => void;
  iniciar: () => void;
  alternarVerificada: (id: string) => void;
  responder: (id: string, texto: string, conferida: boolean) => void;
  /** `false` quando o texto é vazio, longo demais ou o limite de perguntas próprias foi atingido. */
  adicionarPropria: (texto: string) => boolean;
  definirNotas: (texto: string) => void;
  definirOrientacao: (graus: number | null) => void;
  definirRuido: (ruido: Visita["ruido"]) => void;
  /** Soma o cronômetro e grava `concluidaEm`. Devolve `true` se a gravação deu certo. */
  encerrar: () => Promise<boolean>;
  /** Pausa o cronômetro e grava tudo o que estava pendente. Usado antes de trocar de imóvel. */
  pausarEGravar: () => Promise<boolean>;
};

export function useVisita({ analise, salvar, aoFalhar }: Parametros): ControleDaVisita {
  const idDaAnalise = analise?.id ?? null;
  const [local, definirLocal] = useState<Local | null>(null);
  const [notasLocais, definirNotasLocais] = useState<NotasLocais | null>(null);
  const [relogio, definirRelogioDaTela] = useState<Relogio | null>(null);
  const [agora, definirAgora] = useState(() => Date.now());
  const [focada, definirFocada] = useState(false);

  // Outra análise ficou ativa: o que era local da anterior não vale para esta. O tempo da anterior já foi gravado
  // na última saída da tela (ou na troca feita por esta tela, que grava antes).
  const [idVisto, definirIdVisto] = useState(idDaAnalise);
  if (idVisto !== idDaAnalise) {
    definirIdVisto(idDaAnalise);
    definirLocal(null);
    definirNotasLocais(null);
    definirRelogioDaTela(null);
  }

  // O espelho é a última análise que esta tela recebeu ou gravou. Gravações seguidas partem dele, não do estado
  // renderizado, que só alcança a gravação depois que ela termina: sem isso, duas ações rápidas se atropelariam.
  const espelho = useRef<AnaliseV2 | null>(null);
  const doProvedor = useRef<AnaliseV2 | null>(null);
  const emVoo = useRef(0);
  const rascunho = useRef<Rascunho>({});
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const relogioRef = useRef<Relogio | null>(null);
  const salvarRef = useRef(salvar);
  const aoFalharRef = useRef(aoFalhar);

  useEffect(() => {
    salvarRef.current = salvar;
    aoFalharRef.current = aoFalhar;
  }, [salvar, aoFalhar]);

  const definirRelogio = useCallback((novo: Relogio | null) => {
    relogioRef.current = novo;
    definirRelogioDaTela(novo);
    if (novo) definirAgora(Date.now());
  }, []);

  const limparTemporizador = useCallback(() => {
    if (temporizador.current !== null) clearTimeout(temporizador.current);
    temporizador.current = null;
  }, []);

  /** Aplica `mudar` sobre a visita do espelho, junto com o rascunho pendente, e grava. */
  const gravar = useCallback(
    (mudar: (v: Visita) => Visita): Promise<boolean> => {
      const base = espelho.current;
      if (!base) return Promise.resolve(true);
      const pendente = rascunho.current;
      rascunho.current = {};
      limparTemporizador();
      const nova: AnaliseV2 = {
        ...base,
        visita: mudar({ ...base.visita, ...pendente }),
        atualizadaEm: new Date().toISOString(),
      };
      espelho.current = nova;
      definirLocal({ id: nova.id, visita: nova.visita });
      emVoo.current += 1;
      return salvarRef
        .current(nova)
        .then(
          () => true,
          () => {
            // Volta ao que está guardado e avisa: a tela não pode mostrar como salvo o que não foi. A exceção é o rascunho
            // (notas e orientação): foi o que a pessoa digitou ou ajustou, continua na tela e segue pendente para a próxima
            // gravação. O que ela mexeu enquanto esta gravação corria vale mais que o rascunho que falhou.
            const guardada = doProvedor.current;
            const mesmaAnalise = espelho.current?.id === nova.id;
            espelho.current = guardada;
            if (mesmaAnalise) rascunho.current = { ...pendente, ...rascunho.current };
            const mantido = mesmaAnalise ? rascunho.current : {};
            definirLocal(guardada ? { id: guardada.id, visita: { ...guardada.visita, ...mantido } } : null);
            if (mantido.notas === undefined) definirNotasLocais(null);
            aoFalharRef.current(AVISO_DE_FALHA_AO_SALVAR);
            return false;
          },
        )
        .finally(() => {
          emVoo.current -= 1;
        });
    },
    [limparTemporizador],
  );

  const agendar = useCallback(
    (parte: Rascunho) => {
      rascunho.current = { ...rascunho.current, ...parte };
      limparTemporizador();
      temporizador.current = setTimeout(() => {
        temporizador.current = null;
        void gravar((v) => v);
      }, ATRASO_DO_RASCUNHO_MS);
    },
    [gravar, limparTemporizador],
  );

  // Acompanha o provedor sem mexer no que se vê: troca de análise zera o que estava pendente; fora isso, o espelho
  // só adota o que veio de fora quando não há gravação em andamento nem texto por gravar.
  useEffect(() => {
    doProvedor.current = analise;
    if ((espelho.current?.id ?? null) !== idDaAnalise) {
      rascunho.current = {};
      limparTemporizador();
      relogioRef.current = null;
      espelho.current = analise;
      return;
    }
    if (analise && emVoo.current === 0 && !temPendencia(rascunho.current)) espelho.current = analise;
  }, [analise, idDaAnalise, limparTemporizador]);

  // Ponto de controle: soma o tempo corrido, grava e recomeça a contar de agora, sem parar o cronômetro.
  const pontoDeControle = useCallback((): Promise<boolean> => {
    const atual = relogioRef.current;
    if (!atual) return Promise.resolve(true);
    const instante = Date.now();
    const somado = segundosDoRelogio(atual, instante);
    definirRelogio({ inicio: instante, base: somado });
    return gravar((v) => ({ ...v, segundos: somado }));
  }, [definirRelogio, gravar]);

  /** Grava o que estiver pendente: o cronômetro em andamento ou o texto ainda não gravado. */
  const descarregar = useCallback((): Promise<boolean> => {
    if (relogioRef.current) return pontoDeControle();
    if (temPendencia(rascunho.current)) return gravar((v) => v);
    return Promise.resolve(true);
  }, [gravar, pontoDeControle]);

  const descarregarRef = useRef(descarregar);
  useEffect(() => {
    descarregarRef.current = descarregar;
  }, [descarregar]);

  // Saiu da aba: grava. Voltou: o cronômetro, que seguiu pelo relógio, reaparece com o tempo certo.
  useFocusEffect(
    useCallback(() => {
      definirFocada(true);
      definirAgora(Date.now());
      return () => {
        definirFocada(false);
        void descarregarRef.current();
      };
    }, []),
  );

  // Fechou a tela ou o app foi para segundo plano: grava.
  useEffect(() => () => void descarregarRef.current(), []);
  useEffect(() => {
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado !== "active") void descarregarRef.current();
    });
    return () => assinatura.remove();
  }, []);

  // O relógio da tela e o ponto de controle só andam com a aba à vista. Ao sair dela já houve uma gravação, e uma
  // gravação em segundo plano refaria a análise ativa, que a pessoa pode ter trocado em outra aba.
  const rodando = relogio !== null;
  useEffect(() => {
    if (!rodando || !focada) return;
    const tique = setInterval(() => definirAgora(Date.now()), 1000);
    return () => clearInterval(tique);
  }, [rodando, focada]);
  useEffect(() => {
    if (!rodando || !focada) return;
    const controle = setInterval(() => void descarregarRef.current(), INTERVALO_DO_PONTO_DE_CONTROLE_MS);
    return () => clearInterval(controle);
  }, [rodando, focada]);

  const iniciar = useCallback(() => {
    if (relogioRef.current) return;
    const v = espelho.current?.visita;
    if (!v) return;
    definirRelogio({ inicio: Date.now(), base: v.segundos });
    // Recomeçar uma visita já encerrada a reabre.
    if (v.concluidaEm !== null) void gravar((x) => ({ ...x, concluidaEm: null }));
  }, [definirRelogio, gravar]);

  const pausar = useCallback((): Promise<boolean> => {
    const atual = relogioRef.current;
    if (!atual) return descarregar();
    const somado = segundosDoRelogio(atual, Date.now());
    definirRelogio(null);
    return gravar((v) => ({ ...v, segundos: somado }));
  }, [definirRelogio, descarregar, gravar]);

  const alternarCronometro = useCallback(() => {
    if (relogioRef.current) void pausar();
    else iniciar();
  }, [iniciar, pausar]);

  const encerrar = useCallback((): Promise<boolean> => {
    const atual = relogioRef.current;
    const instante = Date.now();
    const somado = atual ? segundosDoRelogio(atual, instante) : null;
    definirRelogio(null);
    return gravar((v) => ({
      ...v,
      segundos: somado ?? v.segundos,
      concluidaEm: new Date(instante).toISOString(),
    }));
  }, [definirRelogio, gravar]);

  const aoAlternarVerificada = useCallback((id: string) => void gravar((v) => alternarVerificada(v, id)), [gravar]);

  const responder = useCallback(
    (id: string, texto: string, conferida: boolean) => void gravar((v) => definirResposta(v, id, texto, conferida)),
    [gravar],
  );

  const aoAdicionarPropria = useCallback(
    (texto: string): boolean => {
      const base = espelho.current?.visita;
      if (!base || adicionarPropria({ ...base, ...rascunho.current }, texto) === null) return false;
      void gravar((v) => adicionarPropria(v, texto) ?? v);
      return true;
    },
    [gravar],
  );

  const definirNotas = useCallback(
    (texto: string) => {
      const id = espelho.current?.id;
      if (!id) return;
      const limitado = texto.slice(0, MAX_NOTAS);
      definirNotasLocais({ id, texto: limitado });
      agendar({ notas: limitado });
    },
    [agendar],
  );

  const definirOrientacao = useCallback(
    (graus: number | null) => {
      const base = espelho.current;
      if (!base) return;
      const valor = graus === null ? null : limitarGraus(graus);
      // O controle mostra o valor na hora; a gravação espera a pessoa parar de mexer.
      definirLocal((atual) => {
        const v = atual !== null && atual.id === base.id ? atual.visita : base.visita;
        return { id: base.id, visita: { ...v, orientacaoGraus: valor } };
      });
      agendar({ orientacaoGraus: valor });
    },
    [agendar],
  );

  const definirRuido = useCallback((ruido: Visita["ruido"]) => void gravar((v) => ({ ...v, ruido })), [gravar]);

  // O que se vê: a visita local da análise ativa (à frente do que está guardado até a gravação terminar) ou,
  // sem ela, a que está guardada.
  const visita = analise ? (local !== null && local.id === analise.id ? local.visita : analise.visita) : null;
  const notas = analise ? (notasLocais !== null && notasLocais.id === analise.id ? notasLocais.texto : analise.visita.notas) : "";
  const segundos = relogio ? segundosDoRelogio(relogio, agora) : (visita?.segundos ?? 0);

  return {
    visita,
    notas,
    rodando,
    segundos: Math.min(MAX_SEGUNDOS, segundos),
    alternarCronometro,
    iniciar,
    alternarVerificada: aoAlternarVerificada,
    responder,
    adicionarPropria: aoAdicionarPropria,
    definirNotas,
    definirOrientacao,
    definirRuido,
    encerrar,
    pausarEGravar: pausar,
  };
}
