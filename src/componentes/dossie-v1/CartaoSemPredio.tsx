import type { VisaoDoDossie } from "../../dados/contratos";
import { ESPACO } from "../../tema/tokens";
import { Botao } from "../Botao";
import { Texto } from "../Texto";
import { CaixaCreme, Corpo } from "./base";
import { textosSemPredio } from "./textos";

type Props = {
  visao: VisaoDoDossie;
  coberto: boolean;
  vinculoConfirmado: boolean;
  aoConfirmar: () => void;
};

/**
 * Ocupa o lugar do cadastro quando não há prédio: "Confirme o prédio para ver o cadastro" (bairro coberto) ou
 * "Fora da área com cadastro". Nunca mostra dado de cadastro que não exista.
 */
export function CartaoSemPredio({ visao, coberto, vinculoConfirmado, aoConfirmar }: Props) {
  const t = textosSemPredio(visao, coberto, vinculoConfirmado);
  return (
    <CaixaCreme estilo={{ gap: ESPACO[3] }}>
      <Texto tipo="corpo" role="heading" style={{ fontSize: 15, lineHeight: 21, fontWeight: "600" }}>
        {t.titulo}
      </Texto>
      <Corpo estilo={{ fontSize: 13, lineHeight: 19 }}>{t.texto}</Corpo>
      {t.podeConfirmar ? <Botao rotulo="Confirmar prédio" variante="secundario" seta onPress={aoConfirmar} /> : null}
    </CaixaCreme>
  );
}
