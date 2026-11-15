// Movimento reduzido. Na web vale `prefers-reduced-motion: reduce`; no celular, a opção de acessibilidade do sistema
// (`AccessibilityInfo.isReduceMotionEnabled`). Quem anima (aviso, gaveta, diálogo) lê daqui e, com movimento reduzido,
// troca o estado de uma vez, sem transição.
import { useEffect, useRef, useState, type RefObject } from "react";
import { AccessibilityInfo, Platform } from "react-native";

const CONSULTA_DA_WEB = "(prefers-reduced-motion: reduce)";

function consultaDaWeb(): MediaQueryList | null {
  if (Platform.OS !== "web" || typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(CONSULTA_DA_WEB);
}

/** O valor agora, de forma síncrona, quando dá para saber (na web); no celular só depois da primeira leitura do sistema. */
export function movimentoReduzidoAgora(): boolean {
  return consultaDaWeb()?.matches ?? false;
}

/** `true` quando a pessoa pediu menos movimento. Acompanha a mudança da opção com o app aberto. */
export function useMovimentoReduzido(): boolean {
  const [reduzir, definirReduzir] = useState<boolean>(() => movimentoReduzidoAgora());
  const atual = useRef(reduzir);
  useEffect(() => {
    atual.current = reduzir;
  }, [reduzir]);

  useEffect(() => {
    const consulta = consultaDaWeb();
    if (consulta) {
      const aoMudar = () => definirReduzir(consulta.matches);
      aoMudar();
      consulta.addEventListener("change", aoMudar);
      return () => consulta.removeEventListener("change", aoMudar);
    }
    // Guarda de desmontagem: a resposta do sistema pode chegar depois que a tela saiu. E só atualiza se mudou: a
    // primeira leitura quase sempre confirma o valor inicial, sem renderizar de novo.
    let vivo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((ligado) => {
      if (vivo && ligado !== atual.current) definirReduzir(ligado);
    });
    const assinatura = AccessibilityInfo.addEventListener("reduceMotionChanged", definirReduzir);
    return () => {
      vivo = false;
      assinatura?.remove();
    };
  }, []);

  return reduzir;
}

/** O mesmo valor numa referência, para quem decide dentro de um callback (aviso, fim de arrasto) sem renderizar de novo. */
export function useMovimentoReduzidoRef(): RefObject<boolean> {
  const reduzir = useMovimentoReduzido();
  const ref = useRef(reduzir);
  useEffect(() => {
    ref.current = reduzir;
  }, [reduzir]);
  return ref;
}
