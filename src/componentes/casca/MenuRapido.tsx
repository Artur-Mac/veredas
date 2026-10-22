// Menu rápido do cabeçalho (`.mobile-menu-popover`, index.html 1357–1400). Cada item leva a uma rota de verdade; a
// carteira mostra o saldo real. Abre numa camada própria (Modal): um toque fora dele, Esc (web) ou o botão de voltar
// (Android) o fecham.
import { router, type Href } from "expo-router";
import React from "react";
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useTema } from "../../tema/Tema";
import { TOQUE_MINIMO, comAlfa } from "../../tema/tokens";
import { Texto } from "../Texto";
import { LARGURA_DA_COLUNA } from "./Coluna";
import { useFocoDeTeclado } from "./foco";

export type ItemDoMenu = { rotulo: string; rota: Href; mostraSaldo?: boolean };

/** As telas do app que o menu abre, na ordem em que aparecem. */
export const ITENS_DO_MENU: readonly ItemDoMenu[] = [
  { rotulo: "Início", rota: "/" },
  { rotulo: "Minhas análises", rota: "/salvos" },
  { rotulo: "Dossiês de exemplo", rota: "/exemplos/boa-viagem" },
  { rotulo: "Carteira de créditos", rota: "/creditos", mostraSaldo: true },
  { rotulo: "Sobre os dados", rota: "/sobre-os-dados" },
  { rotulo: "Cópia do meu caderno", rota: "/dados-do-caderno" },
];

type Props = {
  aberto: boolean;
  aoFechar: () => void;
  /** Saldo da carteira, ou `null` enquanto ela ainda está sendo lida. */
  saldo: number | null;
};

export function MenuRapido({ aberto, aoFechar, saldo }: Props) {
  const { cor } = useTema();
  const { width: larguraDaTela } = useWindowDimensions();
  // No desktop o menu acompanha a borda direita da coluna do app, onde está o botão que o abre; no celular, 14 px da borda.
  const direita = Math.max(14, (larguraDaTela - LARGURA_DA_COLUNA) / 2 + 4);

  const abrir = (rota: Href) => {
    aoFechar();
    router.push(rota);
  };

  return (
    <Modal visible={aberto} transparent animationType="none" onRequestClose={aoFechar}>
      {/* Fundo transparente que cobre a tela inteira: tocar fora do menu o fecha. */}
      <Pressable accessibilityLabel="Fechar menu" tabIndex={-1} onPress={aoFechar} style={StyleSheet.absoluteFill} />
      <View
        role="menu"
        aria-label="Menu rápido de navegação"
        style={[
          styles.popover,
          {
            right: direita,
            backgroundColor: cor("cor-papel-claro"),
            borderColor: comAlfa(cor("cor-texto"), 0.12),
            boxShadow: `0 18px 40px -10px ${comAlfa(cor("cor-texto"), 0.18)}`,
          },
        ]}
      >
        {ITENS_DO_MENU.map((item) => (
          <LinhaDoMenu key={item.rotulo} item={item} saldo={saldo} aoAbrir={abrir} />
        ))}
      </View>
    </Modal>
  );
}

/** Uma linha do menu. Fica em componente próprio para ter o anel de foco de teclado e continuar sendo um único `Pressable`. */
function LinhaDoMenu({ item, saldo, aoAbrir }: { item: ItemDoMenu; saldo: number | null; aoAbrir: (rota: Href) => void }) {
  const { cor } = useTema();
  const foco = useFocoDeTeclado();
  return (
    <Pressable
      role="menuitem"
      accessibilityLabel={item.mostraSaldo && saldo !== null ? `${item.rotulo}: ${saldo}` : item.rotulo}
      onPress={() => aoAbrir(item.rota)}
      onFocus={foco.aoFocar}
      onBlur={foco.aoDesfocar}
      style={({ pressed }) => [styles.item, { backgroundColor: pressed ? comAlfa(cor("cor-texto"), 0.06) : "transparent" }, foco.estilo]}
    >
      <Texto tipo="apoio" style={styles.rotuloDoItem}>
        {item.rotulo}
      </Texto>
      {item.mostraSaldo && saldo !== null ? (
        <Texto tipo="apoio" cor="cor-texto-apoio" style={styles.saldoDoItem}>
          {String(saldo)}
        </Texto>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  popover: {
    position: "absolute",
    top: 52,
    width: 250,
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
    gap: 2,
  },
  item: {
    minHeight: TOQUE_MINIMO,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rotuloDoItem: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  saldoDoItem: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
});
