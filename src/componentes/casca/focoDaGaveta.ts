// Foco da gaveta na web (diálogo modal, WAI-ARIA). Ao abrir, o foco entra na gaveta (no título; sem título, no primeiro
// controle); Tab e Shift+Tab giram dentro dela, sem alcançar a página de trás; ao fechar, o foco volta a quem a abriu.
// No celular não há teclado de foco para cuidar: nada disto roda. As funções puras recebem o painel e o documento, para
// serem testadas sem navegador.
import { useEffect, type RefObject } from "react";
import { Platform } from "react-native";

const SELETOR_DE_FOCAVEIS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable=true]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const SELETOR_DE_TITULO = 'h1,h2,h3,h4,h5,h6,[role="heading"]';

/** Bits de `compareDocumentPosition`: o outro nó vem antes / depois. */
const VEM_ANTES = 2;
const VEM_DEPOIS = 4;

/** Os controles que o Tab alcança dentro do painel, na ordem do documento. */
export function focaveisDe(painel: HTMLElement): HTMLElement[] {
  return Array.from(painel.querySelectorAll<HTMLElement>(SELETOR_DE_FOCAVEIS)).filter(
    (no) => no.getAttribute("aria-hidden") !== "true" && (typeof no.getClientRects !== "function" || no.getClientRects().length > 0),
  );
}

/**
 * Leva o foco para dentro do painel: o título (que passa a aceitar foco por programa, sem entrar na ordem de Tab), senão o
 * primeiro controle, senão o próprio painel. Se algo de dentro já tem o foco (um campo com foco automático), não o tira.
 */
export function focarDentro(painel: HTMLElement, documento: Document = document): HTMLElement {
  const ativo = documento.activeElement as HTMLElement | null;
  if (ativo && ativo !== painel && painel.contains(ativo)) return ativo;
  const alvo = painel.querySelector<HTMLElement>(SELETOR_DE_TITULO) ?? focaveisDe(painel)[0] ?? painel;
  if (!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex", "-1");
  alvo.focus({ preventScroll: true });
  return alvo;
}

type TeclaDeTab = { key: string; shiftKey: boolean; preventDefault: () => void };

/**
 * Prende o Tab dentro do painel: no último controle, Tab volta ao primeiro; no primeiro (ou antes dele, no título ou no
 * próprio painel), Shift+Tab vai ao último; com o foco fora do painel, o foco volta para dentro. No meio do caminho o
 * navegador cuida do Tab. Devolve `true` quando tratou a tecla.
 */
export function prenderTab(evento: TeclaDeTab, painel: HTMLElement, documento: Document = document): boolean {
  if (evento.key !== "Tab") return false;
  const focaveis = focaveisDe(painel);
  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  if (!primeiro || !ultimo) {
    // Nada para focar: o foco fica no painel, em vez de sair para a página.
    evento.preventDefault();
    painel.focus({ preventScroll: true });
    return true;
  }
  const ativo = documento.activeElement as HTMLElement | null;
  const dentro = ativo !== null && painel.contains(ativo);
  if (evento.shiftKey) {
    if (!dentro || ativo === primeiro || (primeiro.compareDocumentPosition(ativo) & VEM_ANTES) !== 0) {
      evento.preventDefault();
      ultimo.focus();
      return true;
    }
    return false;
  }
  if (!dentro || ativo === ultimo || (ultimo.compareDocumentPosition(ativo) & VEM_DEPOIS) !== 0) {
    evento.preventDefault();
    primeiro.focus();
    return true;
  }
  return false;
}

/** Devolve o foco a quem abriu a gaveta, se esse elemento ainda existe na página. */
export function devolverFoco(quemAbriu: HTMLElement | null, documento: Document = document): void {
  if (!quemAbriu || quemAbriu === documento.body || quemAbriu.isConnected === false) return;
  if (typeof quemAbriu.focus === "function") quemAbriu.focus({ preventScroll: true });
}

/** A referência do painel é um elemento do DOM na web; em outro ambiente (teste, nativo) pode ser outra coisa. */
function comoNoDoDom(valor: unknown): HTMLElement | null {
  const no = valor as Partial<HTMLElement> | null;
  return no && typeof no.contains === "function" && typeof no.querySelector === "function" ? (no as HTMLElement) : null;
}

/** Gavetas abertas agora, da mais antiga para a mais nova: só a de cima prende o Tab (uma gaveta pode abrir sobre outra). */
const abertas: object[] = [];

/** Na web, cuida do foco enquanto `visivel`. `painel` é a referência do elemento com `role="dialog"`. */
export function useFocoDaGaveta(visivel: boolean, painel: RefObject<unknown>): void {
  useEffect(() => {
    if (!visivel || Platform.OS !== "web" || typeof document === "undefined" || typeof window === "undefined") return;
    const no = comoNoDoDom(painel.current);
    const ativoAntes = document.activeElement as HTMLElement | null;
    // Foco que já estava dentro da gaveta (campo com foco automático) não é "quem abriu".
    const quemAbriu = no && ativoAntes && no.contains(ativoAntes) ? null : ativoAntes;
    const vez = {};
    abertas.push(vez);

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== "Tab" || abertas[abertas.length - 1] !== vez) return;
      const atual = comoNoDoDom(painel.current);
      if (atual) prenderTab(evento, atual);
    };
    window.addEventListener("keydown", aoTeclar);
    if (no) focarDentro(no);

    return () => {
      window.removeEventListener("keydown", aoTeclar);
      const posicao = abertas.indexOf(vez);
      if (posicao >= 0) abertas.splice(posicao, 1);
      devolverFoco(quemAbriu);
    };
  }, [visivel, painel]);
}
