// Preparo do dossiê (15/11/2026): logo depois de confirmar o prédio, uma tela por cima (modal) mostra o que o Vereda
// está cruzando e um aviso curto de que os dados podem estar desatualizados ou divergir. Rápida: o tempo é o de carregar
// as camadas do bairro (no mínimo ~1,6 s, para dar para ler; no máximo 8 s, depois segue e o dossiê mostra o próprio
// estado). Ao terminar, quem abriu navega ao dossiê (a navegação de antes, que leva o id da análise).
import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Modal, View } from "react-native";
import { Texto } from "../Texto";
import { garantirCamadas } from "../../dados/camadas";
import { camadasDoBairro } from "../../dados/camadasDasTelas";
import { solDaTardeDoBairro } from "../../dados/dossie/solDaTarde";
import { passosDoPreparo } from "../../dados/preparo";
import { eCoberto } from "../../dados/recife/bairros";
import { edificiosDoBairro, indiceDoBairro } from "../../dados/recife/indice";
import { useTema } from "../../tema/Tema";
import { ESPACO } from "../../tema/tokens";

const TEMPO_MINIMO_MS = 1600;
const TEMPO_MAXIMO_MS = 8000;

export const AVISO_DO_PREPARO =
  "Os dados vêm de bases públicas e do anúncio e podem estar desatualizados ou divergir. O Vereda é uma ferramenta de apoio: não é avaliação, laudo nem garantia. Confira o que importa na visita e nos documentos.";

type Props = { nome: string; bairro: string | null; aoTerminar: () => void };

/** Modal de preparo; `aberto` false não desenha nada. */
export function PreparoDoDossie({ aberto, ...props }: Props & { aberto: boolean }) {
  return (
    <Modal visible={aberto} animationType="fade" onRequestClose={() => undefined} statusBarTranslucent>
      {aberto ? <Preparo {...props} /> : null}
    </Modal>
  );
}

function Preparo({ nome, bairro, aoTerminar }: Props) {
  const { cor } = useTema();
  const camadas = useMemo(() => camadasDoBairro(bairro), [bairro]);
  const passos = useMemo(() => passosDoPreparo(camadas, bairro), [camadas, bairro]);
  const [feitos, setFeitos] = useState(0);

  useEffect(() => {
    let vivo = true;
    const inicio = Date.now();
    // Um passo a cada fatia do tempo mínimo; o último só fecha quando as camadas chegam (ou o teto passa).
    const intervalo = setInterval(() => {
      if (vivo) setFeitos((n) => Math.min(n + 1, passos.length - 1));
    }, TEMPO_MINIMO_MS / passos.length);
    // Todos os relógios ficam guardados para a desmontagem limpar: nada roda depois que o modal fecha.
    const relogios: ReturnType<typeof setTimeout>[] = [];
    // Com as camadas prontas, adianta o "Sol e sombra" do bairro (o cálculo mais pesado dos indicadores, ~0,2 s num
    // laptop em Boa Viagem) enquanto a pessoa lê esta tela: o dossiê abre com o resultado em cache.
    const carregar = garantirCamadas(camadas).catch(() => undefined).then(() => {
      if (!vivo || !eCoberto(bairro)) return;
      try { solDaTardeDoBairro(edificiosDoBairro(bairro), indiceDoBairro(bairro).rua); } catch { /* sem índice: o dossiê diz o próprio estado */ }
    });
    const esperar = (ms: number) => new Promise((r) => { relogios.push(setTimeout(r, ms)); });
    void Promise.race([carregar, esperar(TEMPO_MAXIMO_MS)]).then(async () => {
      const falta = TEMPO_MINIMO_MS - (Date.now() - inicio);
      if (falta > 0) await esperar(falta);
      if (!vivo) return;
      clearInterval(intervalo);
      setFeitos(passos.length);
      AccessibilityInfo.announceForAccessibility?.("Dossiê pronto");
      relogios.push(setTimeout(() => {
        if (vivo) aoTerminar();
      }, 350));
    });
    return () => {
      vivo = false;
      clearInterval(intervalo);
      relogios.forEach(clearTimeout);
    };
    // Roda uma vez por abertura: o fim chama quem abriu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: cor("cor-fundo") }} accessibilityViewIsModal>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: ESPACO[5], gap: ESPACO[5], maxWidth: 480, width: "100%", alignSelf: "center" }}>
        <View style={{ gap: ESPACO[2] }}>
          <Texto tipo="apoio" cor="cor-barro-texto" style={{ letterSpacing: 1.2, fontWeight: "600" }}>
            PREPARANDO O DOSSIÊ
          </Texto>
          <Texto tipo="titulo-tela" role="heading">
            {nome}
          </Texto>
        </View>
        <View role="list" aria-label="O que o Vereda está fazendo" style={{ gap: ESPACO[3] }}>
          {passos.map((p, i) => {
            const feito = i < feitos;
            const atual = i === feitos;
            return (
              <View key={p} role="listitem" style={{ flexDirection: "row", alignItems: "center", gap: ESPACO[3], opacity: feito || atual ? 1 : 0.45 }}>
                <View
                  style={{
                    width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center",
                    backgroundColor: feito ? cor("cor-acao") : "transparent", borderWidth: feito ? 0 : 1.5, borderColor: cor("cor-texto-apoio"),
                  }}
                >
                  {feito ? <Texto tipo="apoio" style={{ color: cor("cor-sobre-acao"), fontSize: 12, lineHeight: 14 }}>✓</Texto> : null}
                </View>
                <Texto tipo="corpo" style={{ flex: 1 }} accessibilityLabel={`${p}${feito ? ", feito" : atual ? ", em andamento" : ""}`}>
                  {p}
                </Texto>
              </View>
            );
          })}
        </View>
        <Texto tipo="apoio" cor="cor-texto-apoio" role="note" style={{ fontSize: 13, lineHeight: 19 }}>
          {AVISO_DO_PREPARO}
        </Texto>
      </View>
    </View>
  );
}
