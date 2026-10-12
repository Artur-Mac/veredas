import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTema } from '@/tema/TemaProvider';
import { familias } from '@/tema/tipografia';

export default function LayoutDasAbas() {
  const { paleta } = useTema();
  const margens = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: paleta.tinta,
        tabBarInactiveTintColor: paleta.tintaFraca,
        tabBarActiveBackgroundColor: paleta.superficieElevada,
        tabBarStyle: {
          backgroundColor: paleta.superficie,
          borderTopColor: paleta.linha,
          height: 72 + margens.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(margens.bottom, 8),
        },
        tabBarLabelStyle: { fontFamily: familias.textoMedio, fontSize: 12, lineHeight: 16 },
        sceneStyle: { backgroundColor: paleta.fundo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Verificar',
          tabBarIcon: ({ color, size }) => <Feather name="search" color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="dossies"
        options={{
          title: 'Meus dossiês',
          tabBarIcon: ({ color, size }) => <Feather name="folder" color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  );
}
