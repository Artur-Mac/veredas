import { useEffect, useState } from "react";
import { AccessibilityInfo, LayoutAnimation } from "react-native";
import { MOVIMENTO } from "./tokens";

export function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduzir);
    const assinatura = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduzir);
    return () => assinatura.remove();
  }, []);
  return reduzir;
}

export function animarSecao(reduzir: boolean) {
  if (reduzir) return;
  LayoutAnimation.configureNext({
    duration: MOVIMENTO.secao,
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  });
}
