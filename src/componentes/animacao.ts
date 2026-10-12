import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';

export const usarDriverNativo = Platform.OS !== 'web';

export function useMovimentoReduzido(): boolean {
  const [reduzido, setReduzido] = useState(false);
  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => {
      if (ativo) {
        setReduzido(valor);
      }
    });
    const inscricao = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzido);
    return () => {
      ativo = false;
      inscricao.remove();
    };
  }, []);
  return reduzido;
}

export function useAparecer(atraso = 0, deslocamento = 10) {
  const [progresso] = useState(() => new Animated.Value(0));
  const reduzido = useMovimentoReduzido();
  useEffect(() => {
    const animacao = Animated.timing(progresso, {
      toValue: 1,
      duration: reduzido ? 0 : 420,
      delay: reduzido ? 0 : atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: usarDriverNativo,
    });
    animacao.start();
    return () => animacao.stop();
  }, [progresso, atraso, reduzido]);
  return {
    opacity: progresso,
    transform: [
      {
        translateY: progresso.interpolate({ inputRange: [0, 1], outputRange: [deslocamento, 0] }),
      },
    ],
  };
}
